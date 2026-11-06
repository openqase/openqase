-- =============================================================================
-- Atomic content save: parent row + junction diff in one transaction (#262)
-- =============================================================================
--
-- WHAT
--   public.save_content_with_relationships(p_table, p_id, p_data, p_relationships)
--   writes a CMS content row and syncs its junction-table links in a single
--   function call, i.e. a single transaction. If any step fails (bad column,
--   FK violation on a link, invalid uuid, ...) the whole call is rolled back:
--   the parent row and every junction table are left exactly as they were.
--
--   Modes:
--     p_id IS NULL                  INSERT p_data as a new row
--     p_id set, p_data set          UPDATE that row with p_data
--     p_id set, p_data IS NULL      no parent write (links only); the parent
--                                   row is locked FOR UPDATE and must exist
--   Returns the parent row as jsonb (same shape PostgREST returns for
--   `.insert().select().single()`).
--
--   p_data keys must be real, non-generated columns of p_table (checked
--   against pg_catalog.pg_attribute), mirroring PostgREST, which rejects
--   unknown columns.
--
--   p_relationships is a JSON array of
--     { "name": "industries",                  -- used in error messages only
--       "junction": "persona_industry_relations",
--       "foreign_key": "persona_id",          -- column holding the parent id
--       "target_key": "industry_id",          -- column holding the target id
--       "target_ids": ["<uuid>", ...],        -- desired final set of links
--       "extra_fields": { "relation_type": "related" } }  -- optional
--   For each entry the function deletes links whose target is not in
--   target_ids and inserts the missing ones (the same insert-diff
--   src/cms/operations/relationships.ts used to do in separate requests).
--   An empty target_ids array clears the relationship. Relationships that are
--   not listed are left untouched.
--
-- SAFETY OF DYNAMIC SQL
--   Table and column identifiers are never taken from input as-is:
--   - p_table must be one of the 9 CMS content tables.
--   - Each (p_table, junction, foreign_key, target_key) tuple must match a
--     row of the fixed allow-list below, which mirrors the `relationships`
--     declared in src/cms/types/*.ts (a unit test keeps the two in sync).
--   - extra_fields keys must be listed for that junction in the allow-list
--     (only blog_post_relations.relation_type today).
--   - p_data keys must be existing columns of p_table.
--   Every identifier is validated first and then quoted with format('%I').
--   All values travel as bind parameters (EXECUTE ... USING), never as text.
--
-- SECURITY
--   SECURITY INVOKER: the only caller is the server-side service-role client
--   (createServiceRoleSupabaseClient), which already has full table
--   privileges and bypasses RLS, so DEFINER rights would add nothing. INVOKER
--   also means that, should EXECUTE ever be granted by mistake, an anon or
--   authenticated caller would still be limited by its own (read-only) table
--   privileges and RLS.
--   EXECUTE is revoked from PUBLIC, anon and authenticated and granted to
--   service_role only (same pattern as 20260923152216). search_path is empty
--   and every object is schema-qualified.
--
-- RE-RUNNABLE
--   CREATE OR REPLACE plus idempotent REVOKE/GRANT. Safe to apply twice.
--
-- After applying, regenerate src/types/supabase.ts (the function appears
-- under Functions).
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."save_content_with_relationships"(
    "p_table" "text",
    "p_id" "uuid" DEFAULT NULL::"uuid",
    "p_data" "jsonb" DEFAULT NULL::"jsonb",
    "p_relationships" "jsonb" DEFAULT '[]'::"jsonb"
) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY INVOKER
    SET "search_path" TO ''
    AS $$
DECLARE
  allowed_tables CONSTANT text[] := ARRAY[
    'algorithms', 'blog_posts', 'case_studies', 'industries', 'personas',
    'partner_companies', 'quantum_companies', 'quantum_hardware', 'quantum_software'
  ];
  v_id          uuid := p_id;
  v_row         jsonb;
  v_cols        text[];
  v_bad_col     text;
  v_sql_cols    text;
  v_rel         jsonb;
  v_name        text;
  v_junction    text;
  v_fk          text;
  v_tk          text;
  v_allowed_ext text[];
  v_extra       jsonb;
  v_extra_cols  text[];
  v_ins_extra   text;
  v_sel_extra   text;
  v_ids         uuid[];
BEGIN
  -- ---------------------------------------------------------------------------
  -- 1. Validate the parent table and the data keys
  -- ---------------------------------------------------------------------------
  IF p_table IS NULL OR NOT (p_table = ANY (allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid content table: %', p_table USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL AND p_data IS NULL THEN
    RAISE EXCEPTION 'p_data is required when creating a row' USING ERRCODE = '22023';
  END IF;

  IF p_data IS NOT NULL THEN
    IF pg_catalog.jsonb_typeof(p_data) <> 'object' THEN
      RAISE EXCEPTION 'p_data must be a JSON object' USING ERRCODE = '22023';
    END IF;

    SELECT pg_catalog.array_agg(k ORDER BY k) INTO v_cols
    FROM pg_catalog.jsonb_object_keys(p_data) AS k;

    SELECT k INTO v_bad_col
    FROM pg_catalog.unnest(v_cols) AS k
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.format('public.%I', p_table)::pg_catalog.regclass
        AND a.attname = k
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND a.attgenerated = ''
    )
    LIMIT 1;

    IF v_bad_col IS NOT NULL THEN
      RAISE EXCEPTION 'Unknown column % for table %', v_bad_col, p_table USING ERRCODE = '42703';
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 2. Parent write (INSERT / UPDATE / lock-only)
  -- ---------------------------------------------------------------------------
  IF p_id IS NULL THEN
    IF v_cols IS NULL THEN
      EXECUTE pg_catalog.format(
        'INSERT INTO public.%I AS t DEFAULT VALUES RETURNING pg_catalog.to_jsonb(t)',
        p_table
      ) INTO v_row;
    ELSE
      SELECT pg_catalog.string_agg(pg_catalog.format('%I', c), ', ' ORDER BY c) INTO v_sql_cols
      FROM pg_catalog.unnest(v_cols) AS c;

      EXECUTE pg_catalog.format(
        'INSERT INTO public.%1$I AS t (%2$s) '
        'SELECT %2$s FROM pg_catalog.jsonb_populate_record(NULL::public.%1$I, $1) '
        'RETURNING pg_catalog.to_jsonb(t)',
        p_table, v_sql_cols
      ) INTO v_row USING p_data;
    END IF;
    v_id := (v_row ->> 'id')::uuid;
  ELSIF v_cols IS NOT NULL THEN
    SELECT pg_catalog.string_agg(pg_catalog.format('%1$I = r.%1$I', c), ', ' ORDER BY c) INTO v_sql_cols
    FROM pg_catalog.unnest(v_cols) AS c;

    EXECUTE pg_catalog.format(
      'UPDATE public.%1$I AS t SET %2$s '
      'FROM pg_catalog.jsonb_populate_record(NULL::public.%1$I, $1) AS r '
      'WHERE t.id = $2 '
      'RETURNING pg_catalog.to_jsonb(t)',
      p_table, v_sql_cols
    ) INTO v_row USING p_data, p_id;
  ELSE
    EXECUTE pg_catalog.format(
      'SELECT pg_catalog.to_jsonb(t) FROM public.%I AS t WHERE t.id = $1 FOR UPDATE',
      p_table
    ) INTO v_row USING p_id;
  END IF;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'No % row with id %', p_table, p_id USING ERRCODE = 'P0002';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 3. Junction diffs
  -- ---------------------------------------------------------------------------
  IF p_relationships IS NULL OR p_relationships = 'null'::jsonb THEN
    RETURN v_row;
  END IF;

  IF pg_catalog.jsonb_typeof(p_relationships) <> 'array' THEN
    RAISE EXCEPTION 'p_relationships must be a JSON array' USING ERRCODE = '22023';
  END IF;

  FOR v_rel IN SELECT e FROM pg_catalog.jsonb_array_elements(p_relationships) AS e LOOP
    IF pg_catalog.jsonb_typeof(v_rel) <> 'object' THEN
      RAISE EXCEPTION 'Each relationship must be a JSON object' USING ERRCODE = '22023';
    END IF;

    v_junction := v_rel ->> 'junction';
    v_fk       := v_rel ->> 'foreign_key';
    v_tk       := v_rel ->> 'target_key';
    v_name     := COALESCE(v_rel ->> 'name', v_junction);

    -- Allow-list: mirrors `relationships` in src/cms/types/*.ts.
    -- (parent table, junction table, parent FK column, target column, extra columns)
    SELECT a.extra INTO v_allowed_ext
    FROM (VALUES
      ('algorithms',        'algorithm_industry_relations',          'algorithm_id',        'industry_id',          ARRAY[]::text[]),
      ('algorithms',        'algorithm_case_study_relations',        'algorithm_id',        'case_study_id',        ARRAY[]::text[]),
      ('algorithms',        'persona_algorithm_relations',           'algorithm_id',        'persona_id',           ARRAY[]::text[]),
      ('blog_posts',        'blog_post_relations',                   'blog_post_id',        'related_blog_post_id', ARRAY['relation_type']::text[]),
      ('case_studies',      'case_study_industry_relations',         'case_study_id',       'industry_id',          ARRAY[]::text[]),
      ('case_studies',      'algorithm_case_study_relations',        'case_study_id',       'algorithm_id',         ARRAY[]::text[]),
      ('case_studies',      'case_study_persona_relations',          'case_study_id',       'persona_id',           ARRAY[]::text[]),
      ('case_studies',      'case_study_quantum_software_relations', 'case_study_id',       'quantum_software_id',  ARRAY[]::text[]),
      ('case_studies',      'case_study_quantum_hardware_relations', 'case_study_id',       'quantum_hardware_id',  ARRAY[]::text[]),
      ('case_studies',      'case_study_quantum_company_relations',  'case_study_id',       'quantum_company_id',   ARRAY[]::text[]),
      ('case_studies',      'case_study_partner_company_relations',  'case_study_id',       'partner_company_id',   ARRAY[]::text[]),
      ('industries',        'algorithm_industry_relations',          'industry_id',         'algorithm_id',         ARRAY[]::text[]),
      ('industries',        'case_study_industry_relations',         'industry_id',         'case_study_id',        ARRAY[]::text[]),
      ('industries',        'persona_industry_relations',            'industry_id',         'persona_id',           ARRAY[]::text[]),
      ('partner_companies', 'case_study_partner_company_relations',  'partner_company_id',  'case_study_id',        ARRAY[]::text[]),
      ('personas',          'persona_industry_relations',            'persona_id',          'industry_id',          ARRAY[]::text[]),
      ('personas',          'persona_algorithm_relations',           'persona_id',          'algorithm_id',         ARRAY[]::text[]),
      ('personas',          'case_study_persona_relations',          'persona_id',          'case_study_id',        ARRAY[]::text[]),
      ('quantum_companies', 'case_study_quantum_company_relations',  'quantum_company_id',  'case_study_id',        ARRAY[]::text[]),
      ('quantum_hardware',  'case_study_quantum_hardware_relations', 'quantum_hardware_id', 'case_study_id',        ARRAY[]::text[]),
      ('quantum_software',  'case_study_quantum_software_relations', 'quantum_software_id', 'case_study_id',        ARRAY[]::text[])
    ) AS a(parent, junction, fk, tk, extra)
    WHERE a.parent = p_table AND a.junction = v_junction AND a.fk = v_fk AND a.tk = v_tk;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Relationship not allowed for %: % (% -> %)', p_table, v_junction, v_fk, v_tk
        USING ERRCODE = '22023';
    END IF;

    v_extra := COALESCE(v_rel -> 'extra_fields', '{}'::jsonb);
    IF pg_catalog.jsonb_typeof(v_extra) <> 'object' THEN
      RAISE EXCEPTION '%: extra_fields must be a JSON object', v_name USING ERRCODE = '22023';
    END IF;

    SELECT pg_catalog.array_agg(k ORDER BY k) INTO v_extra_cols
    FROM pg_catalog.jsonb_object_keys(v_extra) AS k;

    IF v_extra_cols IS NOT NULL AND NOT (v_extra_cols OPERATOR(pg_catalog.<@) v_allowed_ext) THEN
      RAISE EXCEPTION '%: extra_fields % not allowed for %', v_name, v_extra_cols, v_junction
        USING ERRCODE = '22023';
    END IF;

    IF pg_catalog.jsonb_typeof(v_rel -> 'target_ids') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION '%: target_ids must be a JSON array', v_name USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(pg_catalog.string_agg(pg_catalog.format(', %I', c), '' ORDER BY c), ''),
           COALESCE(pg_catalog.string_agg(pg_catalog.format(', x.%I', c), '' ORDER BY c), '')
      INTO v_ins_extra, v_sel_extra
    FROM pg_catalog.unnest(v_extra_cols) AS c;

    BEGIN
      SELECT COALESCE(pg_catalog.array_agg(DISTINCT t::uuid), ARRAY[]::uuid[]) INTO v_ids
      FROM pg_catalog.jsonb_array_elements_text(v_rel -> 'target_ids') AS t;

      -- Remove links that are no longer wanted.
      EXECUTE pg_catalog.format(
        'DELETE FROM public.%1$I WHERE %2$I = $1 AND %3$I IS NOT NULL AND NOT (%3$I = ANY ($2))',
        v_junction, v_fk, v_tk
      ) USING v_id, v_ids;

      -- Add links that are missing.
      EXECUTE pg_catalog.format(
        'INSERT INTO public.%1$I (%2$I, %3$I%4$s) '
        'SELECT $1, ids.id%5$s '
        'FROM pg_catalog.unnest($2) AS ids(id) '
        'CROSS JOIN pg_catalog.jsonb_populate_record(NULL::public.%1$I, $3) AS x '
        'WHERE NOT EXISTS (SELECT 1 FROM public.%1$I AS j WHERE j.%2$I = $1 AND j.%3$I = ids.id)',
        v_junction, v_fk, v_tk, v_ins_extra, v_sel_extra
      ) USING v_id, v_ids, v_extra;
    EXCEPTION WHEN OTHERS THEN
      -- Re-raise with the relationship name; the outer transaction (the whole
      -- function call) still aborts, so the parent write is undone too.
      RAISE EXCEPTION '%: could not save links, nothing was saved (%)', v_name, SQLERRM
        USING ERRCODE = SQLSTATE;
    END;
  END LOOP;

  RETURN v_row;
END;
$$;

ALTER FUNCTION "public"."save_content_with_relationships"("p_table" "text", "p_id" "uuid", "p_data" "jsonb", "p_relationships" "jsonb") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."save_content_with_relationships"("p_table" "text", "p_id" "uuid", "p_data" "jsonb", "p_relationships" "jsonb") IS 'Insert/update a CMS content row and sync its junction links in one transaction (all or nothing). Tables and junctions come from a fixed allow-list. Service role only. SECURITY INVOKER with empty search_path.';

REVOKE ALL ON FUNCTION "public"."save_content_with_relationships"("p_table" "text", "p_id" "uuid", "p_data" "jsonb", "p_relationships" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."save_content_with_relationships"("p_table" "text", "p_id" "uuid", "p_data" "jsonb", "p_relationships" "jsonb") FROM "anon";
REVOKE ALL ON FUNCTION "public"."save_content_with_relationships"("p_table" "text", "p_id" "uuid", "p_data" "jsonb", "p_relationships" "jsonb") FROM "authenticated";
GRANT EXECUTE ON FUNCTION "public"."save_content_with_relationships"("p_table" "text", "p_id" "uuid", "p_data" "jsonb", "p_relationships" "jsonb") TO "service_role";

-- Make PostgREST pick up the new function without a restart.
NOTIFY pgrst, 'reload schema';


-- =============================================================================
-- ROLLBACK (manual; the app's create/update/saveRelationships call this
-- function, so revert the app code first)
-- =============================================================================
-- DROP FUNCTION IF EXISTS public.save_content_with_relationships(text, uuid, jsonb, jsonb);
