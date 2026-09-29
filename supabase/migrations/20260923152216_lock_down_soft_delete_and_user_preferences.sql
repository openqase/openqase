-- =============================================================================
-- Lock down soft-delete RPCs and user_preferences RLS
-- =============================================================================
--
-- WHAT
--   1. public.soft_delete_content / public.recover_content
--      - REVOKE EXECUTE from PUBLIC, anon, authenticated; keep service_role.
--      - Redefine both with a caller check: only service_role or an admin
--        (user_preferences.role = 'admin' for auth.uid()) may call them.
--      - Extend the table allow-list to quantum_hardware, quantum_software,
--        quantum_companies, partner_companies (all have deleted_at/deleted_by).
--      - soft_delete_content now records auth.uid() as deleted_by when the
--        caller does not pass one.
--   2. New helper public.is_admin() (STABLE, SECURITY DEFINER, search_path '')
--      so user_preferences policies can check "caller is admin" without
--      recursing into user_preferences' own RLS.
--   3. user_preferences policies rewritten:
--      - SELECT: own row OR caller is admin (was: own row OR *row* is admin,
--        which exposed every admin row to every signed-in user).
--      - INSERT/DELETE: caller is admin (was: row.role = 'admin', i.e. any
--        signed-in user could insert/delete admin rows given table privileges).
--      - UPDATE: own row OR caller is admin, and non-admins cannot set
--        role = 'admin' on their own row (WITH CHECK).
--      Table write privileges for anon/authenticated are already revoked in the
--      baseline, so the write policies are defence in depth.
--   4. REVOKE SELECT on user_preferences from anon. No anon code path reads it
--      (src/proxy.ts and src/lib/auth.ts query it with the signed-in user's
--      session), and anon has no SELECT policy anyway.
--   5. Default privileges for objects postgres creates in public from now on:
--      - TABLES:    revoke ALL from anon/authenticated, then grant SELECT only.
--      - SEQUENCES: revoke ALL from anon/authenticated; grant nothing.
--      - FUNCTIONS: revoke EXECUTE from anon/authenticated (public schema) and
--                   from PUBLIC (global default for postgres; see section 6).
--      postgres and service_role keep ALL. Existing objects are unaffected;
--      default privileges only apply to objects created after this runs.
--
-- WHY
--   Both RPCs are SECURITY DEFINER (bypass RLS) and did not check the caller,
--   yet were granted to anon. Anyone holding the public anon key could
--   soft-delete (and thereby unpublish) or recover any case study, algorithm,
--   industry, persona or blog post via POST /rest/v1/rpc/soft_delete_content.
--   The app only ever calls these RPCs through the service-role client from
--   admin-gated API routes (src/app/api/*/delete/route.ts), so revoking
--   anon/authenticated access has no functional impact.
--
--   The baseline's ALTER DEFAULT PRIVILEGES granted ALL on every *future*
--   table, sequence and function in public to anon and authenticated. The
--   per-table write revokes at the end of the baseline only cover tables that
--   existed then, so any new table would have been writable (and any new
--   SECURITY DEFINER function callable) with the public anon key unless its
--   migration remembered to revoke. Section 5 makes "locked" the default.
--
-- NOTE
--   New-object defaults after this migration:
--   - A new table is readable by anon/authenticated (SELECT, gated by RLS) and
--     writable only by service_role. This mirrors the effective state of every
--     existing table (the baseline leaves SELECT, REFERENCES, TRIGGER; the
--     latter two are dropped as they are useless to roles that cannot create
--     tables or triggers). ALWAYS `ENABLE ROW LEVEL SECURITY` on a new table:
--     without RLS the SELECT grant exposes every row to the anon key. (The
--     baseline defines public.rls_auto_enable() for an event trigger that
--     does this, but event triggers are not in the dump, so do not rely on
--     it being installed.) If a
--     table must not be public at all, REVOKE SELECT explicitly.
--   - A new function is executable only by postgres and service_role. A
--     function that anon/authenticated must call directly (RPC) or that an RLS
--     policy calls (like is_admin()) needs an explicit
--     GRANT EXECUTE ... TO anon/authenticated. Trigger functions need no grant
--     (EXECUTE is checked when the trigger is created, not when it fires).
--   - A new sequence is usable only by postgres and service_role, which is
--     sufficient because anon/authenticated cannot INSERT anyway.
--   is_admin() (section 1) is created before section 5 runs, so it still
--   revokes/grants explicitly.
--   After applying, regenerate src/types/supabase.ts (is_admin appears under
--   Functions).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. is_admin() helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_preferences up
    WHERE up.id = auth.uid()
      AND up.role = 'admin'
  );
$$;

ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."is_admin"() IS 'True when the calling user (auth.uid()) has role = admin in user_preferences. SECURITY DEFINER so RLS policies on user_preferences can use it without recursion.';

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "anon";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";


-- -----------------------------------------------------------------------------
-- 2. soft_delete_content
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  allowed_tables TEXT[] := ARRAY[
    'case_studies', 'blog_posts', 'algorithms', 'industries', 'personas',
    'quantum_hardware', 'quantum_software', 'quantum_companies', 'partner_companies'
  ];
BEGIN
  -- Caller check: service role (server-side admin routes) or an admin user.
  IF NOT (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- Validate table name to prevent SQL injection
  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  IF content_id IS NULL THEN
    RAISE EXCEPTION 'Content ID cannot be NULL';
  END IF;

  EXECUTE format('
    UPDATE public.%I
    SET deleted_at = NOW(),
        deleted_by = %L,
        published = false
    WHERE id = %L
    AND deleted_at IS NULL',  -- Only delete if not already deleted
    table_name,
    COALESCE(deleted_by_user, auth.uid()),
    content_id
  );

  RETURN FOUND;
END;
$$;

ALTER FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") IS 'Soft deletes content by setting deleted_at and unpublishing. Service role or admin only. SECURITY DEFINER with empty search_path.';

REVOKE ALL ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") FROM "anon";
REVOKE ALL ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") FROM "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") TO "service_role";


-- -----------------------------------------------------------------------------
-- 3. recover_content (does not touch published: recovered items stay drafts)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  allowed_tables TEXT[] := ARRAY[
    'case_studies', 'blog_posts', 'algorithms', 'industries', 'personas',
    'quantum_hardware', 'quantum_software', 'quantum_companies', 'partner_companies'
  ];
BEGIN
  IF NOT (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  IF content_id IS NULL THEN
    RAISE EXCEPTION 'Content ID cannot be NULL';
  END IF;

  EXECUTE format('
    UPDATE public.%I
    SET deleted_at = NULL,
        deleted_by = NULL
    WHERE id = %L
    AND deleted_at IS NOT NULL',  -- Only recover if actually deleted
    table_name,
    content_id
  );

  RETURN FOUND;
END;
$$;

ALTER FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") IS 'Recovers soft-deleted content (stays unpublished). Service role or admin only. SECURITY DEFINER with empty search_path.';

REVOKE ALL ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") FROM "anon";
REVOKE ALL ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") FROM "authenticated";
GRANT EXECUTE ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") TO "service_role";


-- -----------------------------------------------------------------------------
-- 4. user_preferences policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view preferences" ON "public"."user_preferences";
CREATE POLICY "Authenticated can view preferences" ON "public"."user_preferences"
  FOR SELECT TO "authenticated"
  USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "public"."is_admin"() AS "is_admin")));

DROP POLICY IF EXISTS "Authenticated can update preferences" ON "public"."user_preferences";
CREATE POLICY "Authenticated can update preferences" ON "public"."user_preferences"
  FOR UPDATE TO "authenticated"
  USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ( SELECT "public"."is_admin"() AS "is_admin")))
  WITH CHECK ((( SELECT "public"."is_admin"() AS "is_admin") OR ((( SELECT "auth"."uid"() AS "uid") = "id") AND (COALESCE("role", 'user'::"text") <> 'admin'::"text"))));

DROP POLICY IF EXISTS "Admins can insert preferences" ON "public"."user_preferences";
CREATE POLICY "Admins can insert preferences" ON "public"."user_preferences"
  FOR INSERT TO "authenticated"
  WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));

DROP POLICY IF EXISTS "Admins can delete preferences" ON "public"."user_preferences";
CREATE POLICY "Admins can delete preferences" ON "public"."user_preferences"
  FOR DELETE TO "authenticated"
  USING (( SELECT "public"."is_admin"() AS "is_admin"));


-- -----------------------------------------------------------------------------
-- 5. anon has no business reading user_preferences
-- -----------------------------------------------------------------------------
REVOKE SELECT ON TABLE "public"."user_preferences" FROM "anon";


-- -----------------------------------------------------------------------------
-- 6. Default privileges for future objects created by postgres in public
-- -----------------------------------------------------------------------------
-- Tables: read-only for API roles (RLS still gates rows).
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES TO "authenticated";

-- Sequences: nothing for API roles (they cannot INSERT).
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

-- Functions: no EXECUTE for API roles; grant per function when needed.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";
-- PostgreSQL grants EXECUTE to PUBLIC on new functions as a built-in *global*
-- default, and per-schema default privileges can only add to global ones, so
-- `... IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` would be a
-- no-op. The revoke must be global (all schemas, functions created by
-- postgres). Without it anon/authenticated would still inherit EXECUTE via
-- PUBLIC.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- postgres and service_role keep the baseline's ALL defaults (unchanged).


-- =============================================================================
-- ROLLBACK (run manually only if this migration must be undone; restores the
-- baseline's insecure behaviour, so prefer a forward fix)
-- =============================================================================
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
--
-- GRANT SELECT ON TABLE public.user_preferences TO anon;
--
-- DROP POLICY IF EXISTS "Authenticated can view preferences" ON public.user_preferences;
-- CREATE POLICY "Authenticated can view preferences" ON public.user_preferences FOR SELECT TO authenticated
--   USING (((SELECT auth.uid()) = id) OR (role = 'admin'));
-- DROP POLICY IF EXISTS "Authenticated can update preferences" ON public.user_preferences;
-- CREATE POLICY "Authenticated can update preferences" ON public.user_preferences FOR UPDATE TO authenticated
--   USING (((SELECT auth.uid()) = id) OR (role = 'admin'));
-- DROP POLICY IF EXISTS "Admins can insert preferences" ON public.user_preferences;
-- CREATE POLICY "Admins can insert preferences" ON public.user_preferences FOR INSERT TO authenticated
--   WITH CHECK (role = 'admin');
-- DROP POLICY IF EXISTS "Admins can delete preferences" ON public.user_preferences;
-- CREATE POLICY "Admins can delete preferences" ON public.user_preferences FOR DELETE TO authenticated
--   USING (role = 'admin');
--
-- GRANT EXECUTE ON FUNCTION public.soft_delete_content(text, uuid, uuid) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.recover_content(text, uuid) TO anon, authenticated;
-- -- To restore the original function bodies (no caller check, 5-table
-- -- allow-list), re-run their CREATE OR REPLACE FUNCTION statements from
-- -- 20260905023326_remote_schema.sql.
--
-- DROP FUNCTION IF EXISTS public.is_admin();  -- only after the policies above no longer reference it
