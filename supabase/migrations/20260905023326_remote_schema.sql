


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."hardware_modality" AS ENUM (
    'superconducting',
    'trapped_ion',
    'neutral_atom',
    'photonic',
    'annealer'
);


ALTER TYPE "public"."hardware_modality" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_slug"("name_text" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(name_text, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$;


ALTER FUNCTION "public"."create_slug"("name_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  allowed_tables TEXT[] := ARRAY['case_studies', 'blog_posts', 'algorithms', 'industries', 'personas'];
BEGIN
  -- Validate table name to prevent SQL injection
  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Validate content_id exists
  IF content_id IS NULL THEN
    RAISE EXCEPTION 'Content ID cannot be NULL';
  END IF;

  -- Perform the recovery
  EXECUTE format('
    UPDATE %I
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


COMMENT ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") IS 'Recovers soft-deleted content. Uses SECURITY DEFINER with empty search_path for security.';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_blog_posts_published_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.published = TRUE AND OLD.published = FALSE THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_blog_posts_published_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_published_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.published = TRUE AND OLD.published = FALSE THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_published_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_admin_role"("admin_email" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert or update user preferences with admin role
  INSERT INTO user_preferences (id, role)
  SELECT au.id, 'admin'
  FROM auth.users au
  WHERE au.email = admin_email
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END;
$$;


ALTER FUNCTION "public"."setup_admin_role"("admin_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  allowed_tables TEXT[] := ARRAY['case_studies', 'blog_posts', 'algorithms', 'industries', 'personas'];
BEGIN
  -- Validate table name to prevent SQL injection
  IF NOT (table_name = ANY(allowed_tables)) THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  -- Validate content_id exists
  IF content_id IS NULL THEN
    RAISE EXCEPTION 'Content ID cannot be NULL';
  END IF;

  -- Perform the soft delete
  EXECUTE format('
    UPDATE %I
    SET deleted_at = NOW(),
        deleted_by = %L,
        published = false
    WHERE id = %L
    AND deleted_at IS NULL',  -- Only delete if not already deleted
    table_name,
    deleted_by_user,
    content_id
  );

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") IS 'Soft deletes content by setting deleted_at timestamp. Uses SECURITY DEFINER with empty search_path for security.';



CREATE OR REPLACE FUNCTION "public"."update_blog_posts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_blog_posts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ts_content"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.ts_content = 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ts_content"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_initial_setup"() RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
    -- Verify all tables exist
    if not exists (
        select from information_schema.tables 
        where table_name in (
            'industries', 'personas', 'algorithms', 
            'user_preferences', 'case_studies', 
            'case_study_relations', 'stack_layers'
        )
    ) then
        return false;
    end if;

    -- Verify RLS is enabled
    if not exists (
        select from pg_tables 
        where tablename in ('case_studies', 'user_preferences', 'stack_layers')
        and rowsecurity = true
    ) then
        return false;
    end if;

    return true;
end;
$$;


ALTER FUNCTION "public"."verify_initial_setup"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."algorithm_case_study_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "algorithm_id" "uuid",
    "case_study_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."algorithm_case_study_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."algorithm_industry_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "algorithm_id" "uuid",
    "industry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."algorithm_industry_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."algorithms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "use_cases" "text"[],
    "quantum_advantage" "text",
    "published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "main_content" "text",
    "ts_content" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", ((COALESCE("description", ''::"text") || ' '::"text") || COALESCE("main_content", ''::"text")))) STORED,
    "published_at" timestamp with time zone,
    "steps" "text" DEFAULT '[]'::"jsonb",
    "academic_references" "text",
    "is_system_record" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."algorithms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "blog_post_id" "uuid",
    "related_blog_post_id" "uuid",
    "relation_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_post_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "content" "text",
    "author" "text",
    "featured_image" "text",
    "category" "text",
    "tags" "text"[],
    "published" boolean DEFAULT false,
    "featured" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ts_content" "tsvector",
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_studies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "main_content" "text",
    "partner_companies" "text"[],
    "quantum_companies" "text"[],
    "algorithms" "text"[],
    "quantum_hardware" "text"[],
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "academic_references" "text",
    "resource_links" "jsonb" DEFAULT '[]'::"jsonb",
    "quantum_software" "text"[],
    "year" smallint DEFAULT EXTRACT(year FROM "now"()) NOT NULL,
    "import_batch_name" character varying(10),
    "import_batch_id" "uuid",
    "import_source" "text",
    "import_timestamp" timestamp with time zone DEFAULT "now"(),
    "original_qookie_id" "text",
    "original_qookie_slug" "text",
    "featured" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "check_year_range" CHECK ((("year" >= 1990) AND ("year" <= 2030)))
);


ALTER TABLE "public"."case_studies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."case_studies"."featured" IS 'Whether this case study should be featured on the homepage';



CREATE TABLE IF NOT EXISTS "public"."case_study_industry_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "case_study_id" "uuid",
    "industry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."case_study_industry_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_study_partner_company_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "case_study_id" "uuid",
    "partner_company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."case_study_partner_company_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_study_persona_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "case_study_id" "uuid",
    "persona_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."case_study_persona_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_study_quantum_company_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "case_study_id" "uuid",
    "quantum_company_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."case_study_quantum_company_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_study_quantum_hardware_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "case_study_id" "uuid",
    "quantum_hardware_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."case_study_quantum_hardware_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_study_quantum_software_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "case_study_id" "uuid",
    "quantum_software_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."case_study_quantum_software_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_study_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "case_study_id" "uuid",
    "related_case_study_id" "uuid",
    "relation_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."case_study_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deletion_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_type" "text" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_name" "text",
    "action" "text" NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "performed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "deletion_audit_log_action_check" CHECK (("action" = ANY (ARRAY['soft_delete'::"text", 'restore'::"text", 'permanent_delete'::"text"])))
);


ALTER TABLE "public"."deletion_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."deletion_audit_log" IS 'Immutable audit trail for content deletion and restoration actions';



COMMENT ON COLUMN "public"."deletion_audit_log"."metadata" IS 'JSONB field for storing content snapshots and additional context';



CREATE TABLE IF NOT EXISTS "public"."hardware_spec_definitions" (
    "spec_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "modalities" "public"."hardware_modality"[] NOT NULL,
    "default_unit" "text",
    CONSTRAINT "hardware_spec_definitions_modalities_nonempty" CHECK (("cardinality"("modalities") > 0))
);


ALTER TABLE "public"."hardware_spec_definitions" OWNER TO "postgres";


COMMENT ON TABLE "public"."hardware_spec_definitions" IS 'Canonical preset hardware spec keys, labels, modalities, and default units.';



CREATE TABLE IF NOT EXISTS "public"."industries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "main_content" "text",
    "ts_content" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", ((COALESCE("description", ''::"text") || ' '::"text") || COALESCE("main_content", ''::"text")))) STORED,
    "published" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "is_system_record" boolean DEFAULT false,
    "sector" "text"[],
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."industries" OWNER TO "postgres";


COMMENT ON COLUMN "public"."industries"."sector" IS 'Array of sector/segment names for industry categorization';



CREATE TABLE IF NOT EXISTS "public"."partner_companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "main_content" "text",
    "industry" "text",
    "company_size" "text",
    "headquarters" "text",
    "website_url" "text",
    "linkedin_url" "text",
    "partnership_type" "text",
    "quantum_initiatives" "text",
    "is_system_record" boolean DEFAULT false,
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "ts_content" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", ((COALESCE("description", ''::"text") || ' '::"text") || COALESCE("main_content", ''::"text")))) STORED
);


ALTER TABLE "public"."partner_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."persona_algorithm_relations" (
    "persona_id" "uuid" NOT NULL,
    "algorithm_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."persona_algorithm_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."persona_industry_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "persona_id" "uuid",
    "industry_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."persona_industry_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "expertise" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "main_content" "text",
    "ts_content" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", ((COALESCE("description", ''::"text") || ' '::"text") || COALESCE("main_content", ''::"text")))) STORED,
    "published" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "published_at" timestamp with time zone,
    "recommended_reading" "text",
    "is_system_record" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."personas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quantum_companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "main_content" "text",
    "company_type" "text",
    "founded_year" integer,
    "headquarters" "text",
    "website_url" "text",
    "linkedin_url" "text",
    "funding_stage" "text",
    "key_products" "text"[],
    "key_partnerships" "text"[],
    "is_system_record" boolean DEFAULT false,
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "ts_content" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", ((COALESCE("description", ''::"text") || ' '::"text") || COALESCE("main_content", ''::"text")))) STORED
);


ALTER TABLE "public"."quantum_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quantum_company_hardware_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quantum_company_id" "uuid",
    "quantum_hardware_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."quantum_company_hardware_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quantum_company_software_relations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quantum_company_id" "uuid",
    "quantum_software_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."quantum_company_software_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quantum_hardware" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "main_content" "text",
    "vendor" "text",
    "technology_type" "text",
    "qubit_count" integer,
    "connectivity" "text",
    "gate_fidelity" numeric,
    "coherence_time" "text",
    "availability" "text",
    "access_model" "text",
    "website_url" "text",
    "documentation_url" "text",
    "is_system_record" boolean DEFAULT false,
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "ts_content" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", ((COALESCE("description", ''::"text") || ' '::"text") || COALESCE("main_content", ''::"text")))) STORED
);


ALTER TABLE "public"."quantum_hardware" OWNER TO "postgres";


COMMENT ON COLUMN "public"."quantum_hardware"."technology_type" IS 'Hardware modality (hardware_modality enum). Used for list/hero display and to filter preset specs.';



CREATE TABLE IF NOT EXISTS "public"."quantum_hardware_specs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hardware_id" "uuid" NOT NULL,
    "spec_key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "unit" "text",
    "source" "text",
    "verified_at" timestamp with time zone
);


ALTER TABLE "public"."quantum_hardware_specs" OWNER TO "postgres";


COMMENT ON TABLE "public"."quantum_hardware_specs" IS 'Hardware spec values. Custom keys allowed; preset vs custom is inferred by whether spec_key exists in hardware_spec_definitions.';



CREATE TABLE IF NOT EXISTS "public"."quantum_software" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "main_content" "text",
    "website_url" "text",
    "documentation_url" "text",
    "github_url" "text",
    "vendor" "text",
    "license_type" "text",
    "pricing_model" "text",
    "supported_hardware" "text"[],
    "programming_languages" "text"[],
    "is_system_record" boolean DEFAULT false,
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "ts_content" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", ((COALESCE("description", ''::"text") || ' '::"text") || COALESCE("main_content", ''::"text")))) STORED
);


ALTER TABLE "public"."quantum_software" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stack_layers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "parent_layer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stack_layers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" NOT NULL,
    "theme_preference" "text" DEFAULT 'system'::"text",
    "ui_preferences" "jsonb" DEFAULT "jsonb_build_object"('sidebar_collapsed', false, 'code_font_size', 'medium'),
    "email_preferences" "jsonb" DEFAULT "jsonb_build_object"('product_updates', false, 'newsletter', false, 'case_study_alerts', false),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text"
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


ALTER TABLE ONLY "public"."algorithm_case_study_relations"
    ADD CONSTRAINT "algorithm_case_study_relations_algorithm_id_case_study_id_key" UNIQUE ("algorithm_id", "case_study_id");



ALTER TABLE ONLY "public"."algorithm_case_study_relations"
    ADD CONSTRAINT "algorithm_case_study_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."algorithm_industry_relations"
    ADD CONSTRAINT "algorithm_industry_relations_algorithm_id_industry_id_key" UNIQUE ("algorithm_id", "industry_id");



ALTER TABLE ONLY "public"."algorithm_industry_relations"
    ADD CONSTRAINT "algorithm_industry_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."algorithms"
    ADD CONSTRAINT "algorithms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."algorithms"
    ADD CONSTRAINT "algorithms_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_post_relations"
    ADD CONSTRAINT "blog_post_relations_blog_post_id_related_blog_post_id_key" UNIQUE ("blog_post_id", "related_blog_post_id");



ALTER TABLE ONLY "public"."blog_post_relations"
    ADD CONSTRAINT "blog_post_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."case_studies"
    ADD CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_studies"
    ADD CONSTRAINT "case_studies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."case_study_industry_relations"
    ADD CONSTRAINT "case_study_industry_relations_case_study_id_industry_id_key" UNIQUE ("case_study_id", "industry_id");



ALTER TABLE ONLY "public"."case_study_industry_relations"
    ADD CONSTRAINT "case_study_industry_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_study_partner_company_relations"
    ADD CONSTRAINT "case_study_partner_company_re_case_study_id_partner_company_key" UNIQUE ("case_study_id", "partner_company_id");



ALTER TABLE ONLY "public"."case_study_partner_company_relations"
    ADD CONSTRAINT "case_study_partner_company_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_study_persona_relations"
    ADD CONSTRAINT "case_study_persona_relations_case_study_id_persona_id_key" UNIQUE ("case_study_id", "persona_id");



ALTER TABLE ONLY "public"."case_study_persona_relations"
    ADD CONSTRAINT "case_study_persona_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_study_quantum_company_relations"
    ADD CONSTRAINT "case_study_quantum_company_re_case_study_id_quantum_company_key" UNIQUE ("case_study_id", "quantum_company_id");



ALTER TABLE ONLY "public"."case_study_quantum_company_relations"
    ADD CONSTRAINT "case_study_quantum_company_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_study_quantum_hardware_relations"
    ADD CONSTRAINT "case_study_quantum_hardware_r_case_study_id_quantum_hardwar_key" UNIQUE ("case_study_id", "quantum_hardware_id");



ALTER TABLE ONLY "public"."case_study_quantum_hardware_relations"
    ADD CONSTRAINT "case_study_quantum_hardware_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_study_quantum_software_relations"
    ADD CONSTRAINT "case_study_quantum_software_r_case_study_id_quantum_softwar_key" UNIQUE ("case_study_id", "quantum_software_id");



ALTER TABLE ONLY "public"."case_study_quantum_software_relations"
    ADD CONSTRAINT "case_study_quantum_software_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_study_relations"
    ADD CONSTRAINT "case_study_relations_case_study_id_related_case_study_id_key" UNIQUE ("case_study_id", "related_case_study_id");



ALTER TABLE ONLY "public"."case_study_relations"
    ADD CONSTRAINT "case_study_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deletion_audit_log"
    ADD CONSTRAINT "deletion_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hardware_spec_definitions"
    ADD CONSTRAINT "hardware_spec_definitions_pkey" PRIMARY KEY ("spec_key");



ALTER TABLE ONLY "public"."industries"
    ADD CONSTRAINT "industries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."industries"
    ADD CONSTRAINT "industries_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."partner_companies"
    ADD CONSTRAINT "partner_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_companies"
    ADD CONSTRAINT "partner_companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."persona_algorithm_relations"
    ADD CONSTRAINT "persona_algorithm_relations_pkey" PRIMARY KEY ("persona_id", "algorithm_id");



ALTER TABLE ONLY "public"."persona_industry_relations"
    ADD CONSTRAINT "persona_industry_relations_persona_id_industry_id_key" UNIQUE ("persona_id", "industry_id");



ALTER TABLE ONLY "public"."persona_industry_relations"
    ADD CONSTRAINT "persona_industry_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personas"
    ADD CONSTRAINT "personas_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."quantum_companies"
    ADD CONSTRAINT "quantum_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quantum_companies"
    ADD CONSTRAINT "quantum_companies_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."quantum_company_hardware_relations"
    ADD CONSTRAINT "quantum_company_hardware_rela_quantum_company_id_quantum_ha_key" UNIQUE ("quantum_company_id", "quantum_hardware_id");



ALTER TABLE ONLY "public"."quantum_company_hardware_relations"
    ADD CONSTRAINT "quantum_company_hardware_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quantum_company_software_relations"
    ADD CONSTRAINT "quantum_company_software_rela_quantum_company_id_quantum_so_key" UNIQUE ("quantum_company_id", "quantum_software_id");



ALTER TABLE ONLY "public"."quantum_company_software_relations"
    ADD CONSTRAINT "quantum_company_software_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quantum_hardware"
    ADD CONSTRAINT "quantum_hardware_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quantum_hardware"
    ADD CONSTRAINT "quantum_hardware_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."quantum_hardware_specs"
    ADD CONSTRAINT "quantum_hardware_specs_hardware_id_spec_key_key" UNIQUE ("hardware_id", "spec_key");



ALTER TABLE ONLY "public"."quantum_hardware_specs"
    ADD CONSTRAINT "quantum_hardware_specs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quantum_software"
    ADD CONSTRAINT "quantum_software_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quantum_software"
    ADD CONSTRAINT "quantum_software_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."stack_layers"
    ADD CONSTRAINT "stack_layers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stack_layers"
    ADD CONSTRAINT "stack_layers_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



CREATE INDEX "algorithm_industry_relations_algorithm_id_idx" ON "public"."algorithm_industry_relations" USING "btree" ("algorithm_id");



CREATE INDEX "algorithm_industry_relations_industry_id_idx" ON "public"."algorithm_industry_relations" USING "btree" ("industry_id");



CREATE INDEX "algorithms_slug_idx" ON "public"."algorithms" USING "btree" ("slug");



CREATE INDEX "algorithms_ts_content_idx" ON "public"."algorithms" USING "gin" ("ts_content");



CREATE INDEX "blog_posts_slug_idx" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "blog_posts_tags_idx" ON "public"."blog_posts" USING "gin" ("tags");



CREATE INDEX "blog_posts_ts_content_idx" ON "public"."blog_posts" USING "gin" ("ts_content");



CREATE INDEX "case_studies_algorithms_idx" ON "public"."case_studies" USING "gin" ("algorithms");



CREATE INDEX "case_studies_partner_companies_idx" ON "public"."case_studies" USING "gin" ("partner_companies");



CREATE INDEX "case_studies_quantum_companies_idx" ON "public"."case_studies" USING "gin" ("quantum_companies");



CREATE INDEX "case_studies_quantum_hardware_idx" ON "public"."case_studies" USING "gin" ("quantum_hardware");



CREATE INDEX "case_studies_slug_idx" ON "public"."case_studies" USING "btree" ("slug");



CREATE INDEX "idx_algorithm_case_study_algorithm_id" ON "public"."algorithm_case_study_relations" USING "btree" ("algorithm_id");



CREATE INDEX "idx_algorithm_case_study_case_study_id" ON "public"."algorithm_case_study_relations" USING "btree" ("case_study_id");



CREATE INDEX "idx_blog_post_relations_related_blog_post_id" ON "public"."blog_post_relations" USING "btree" ("related_blog_post_id");



CREATE INDEX "idx_blog_posts_featured" ON "public"."blog_posts" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_case_studies_featured" ON "public"."case_studies" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_case_studies_updated_at" ON "public"."case_studies" USING "btree" ("updated_at");



CREATE INDEX "idx_case_study_industry_relations_case_study_id" ON "public"."case_study_industry_relations" USING "btree" ("case_study_id");



CREATE INDEX "idx_case_study_industry_relations_industry_id" ON "public"."case_study_industry_relations" USING "btree" ("industry_id");



CREATE INDEX "idx_case_study_partner_company_relations_partner_company_id" ON "public"."case_study_partner_company_relations" USING "btree" ("partner_company_id");



CREATE INDEX "idx_case_study_persona_relations_case_study_id" ON "public"."case_study_persona_relations" USING "btree" ("case_study_id");



CREATE INDEX "idx_case_study_persona_relations_persona_id" ON "public"."case_study_persona_relations" USING "btree" ("persona_id");



CREATE INDEX "idx_case_study_quantum_company_relations_quantum_company_id" ON "public"."case_study_quantum_company_relations" USING "btree" ("quantum_company_id");



CREATE INDEX "idx_case_study_quantum_hardware_relations_quantum_hardware_id" ON "public"."case_study_quantum_hardware_relations" USING "btree" ("quantum_hardware_id");



CREATE INDEX "idx_case_study_quantum_software_relations_quantum_software_id" ON "public"."case_study_quantum_software_relations" USING "btree" ("quantum_software_id");



CREATE INDEX "idx_case_study_relations_related_case_study_id" ON "public"."case_study_relations" USING "btree" ("related_case_study_id");



CREATE INDEX "idx_deletion_audit_log_action" ON "public"."deletion_audit_log" USING "btree" ("action");



CREATE INDEX "idx_deletion_audit_log_content_id" ON "public"."deletion_audit_log" USING "btree" ("content_id");



CREATE INDEX "idx_deletion_audit_log_content_type" ON "public"."deletion_audit_log" USING "btree" ("content_type");



CREATE INDEX "idx_deletion_audit_log_performed_at" ON "public"."deletion_audit_log" USING "btree" ("performed_at" DESC);



CREATE INDEX "idx_deletion_audit_log_performed_by" ON "public"."deletion_audit_log" USING "btree" ("performed_by");



CREATE INDEX "idx_deletion_audit_log_type_action_date" ON "public"."deletion_audit_log" USING "btree" ("content_type", "action", "performed_at" DESC);



CREATE INDEX "idx_persona_algorithm_relations_algorithm_id" ON "public"."persona_algorithm_relations" USING "btree" ("algorithm_id");



CREATE INDEX "idx_quantum_company_hardware_relations_quantum_hardware_id" ON "public"."quantum_company_hardware_relations" USING "btree" ("quantum_hardware_id");



CREATE INDEX "idx_quantum_company_software_relations_quantum_software_id" ON "public"."quantum_company_software_relations" USING "btree" ("quantum_software_id");



CREATE INDEX "idx_stack_layers_parent_layer_id" ON "public"."stack_layers" USING "btree" ("parent_layer_id");



CREATE INDEX "industries_ts_content_idx" ON "public"."industries" USING "gin" ("ts_content");



CREATE INDEX "partner_companies_slug_idx" ON "public"."partner_companies" USING "btree" ("slug");



CREATE INDEX "partner_companies_ts_content_idx" ON "public"."partner_companies" USING "gin" ("ts_content");



CREATE INDEX "persona_industry_relations_industry_id_idx" ON "public"."persona_industry_relations" USING "btree" ("industry_id");



CREATE INDEX "persona_industry_relations_persona_id_idx" ON "public"."persona_industry_relations" USING "btree" ("persona_id");



CREATE INDEX "personas_ts_content_idx" ON "public"."personas" USING "gin" ("ts_content");



CREATE INDEX "quantum_companies_slug_idx" ON "public"."quantum_companies" USING "btree" ("slug");



CREATE INDEX "quantum_companies_ts_content_idx" ON "public"."quantum_companies" USING "gin" ("ts_content");



CREATE INDEX "quantum_hardware_slug_idx" ON "public"."quantum_hardware" USING "btree" ("slug");



CREATE INDEX "quantum_hardware_specs_hardware_id_idx" ON "public"."quantum_hardware_specs" USING "btree" ("hardware_id");



CREATE INDEX "quantum_hardware_ts_content_idx" ON "public"."quantum_hardware" USING "gin" ("ts_content");



CREATE INDEX "quantum_software_slug_idx" ON "public"."quantum_software" USING "btree" ("slug");



CREATE INDEX "quantum_software_ts_content_idx" ON "public"."quantum_software" USING "gin" ("ts_content");



CREATE OR REPLACE TRIGGER "blog_posts_ts_content_update" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_ts_content"();



CREATE OR REPLACE TRIGGER "set_blog_posts_published_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_blog_posts_published_at"();



CREATE OR REPLACE TRIGGER "set_personas_published_at" BEFORE UPDATE ON "public"."personas" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();



CREATE OR REPLACE TRIGGER "update_algorithms_updated_at" BEFORE UPDATE ON "public"."algorithms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_posts_updated_at"();



CREATE OR REPLACE TRIGGER "update_case_studies_updated_at" BEFORE UPDATE ON "public"."case_studies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_industries_updated_at" BEFORE UPDATE ON "public"."industries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_partner_companies_updated_at" BEFORE UPDATE ON "public"."partner_companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_personas_updated_at" BEFORE UPDATE ON "public"."personas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quantum_companies_updated_at" BEFORE UPDATE ON "public"."quantum_companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quantum_hardware_updated_at" BEFORE UPDATE ON "public"."quantum_hardware" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quantum_software_updated_at" BEFORE UPDATE ON "public"."quantum_software" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."algorithm_case_study_relations"
    ADD CONSTRAINT "algorithm_case_study_relations_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "public"."algorithms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."algorithm_case_study_relations"
    ADD CONSTRAINT "algorithm_case_study_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."algorithm_industry_relations"
    ADD CONSTRAINT "algorithm_industry_relations_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "public"."algorithms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."algorithm_industry_relations"
    ADD CONSTRAINT "algorithm_industry_relations_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_relations"
    ADD CONSTRAINT "blog_post_relations_blog_post_id_fkey" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_relations"
    ADD CONSTRAINT "blog_post_relations_related_blog_post_id_fkey" FOREIGN KEY ("related_blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_industry_relations"
    ADD CONSTRAINT "case_study_industry_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_industry_relations"
    ADD CONSTRAINT "case_study_industry_relations_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_partner_company_relations"
    ADD CONSTRAINT "case_study_partner_company_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_partner_company_relations"
    ADD CONSTRAINT "case_study_partner_company_relations_partner_company_id_fkey" FOREIGN KEY ("partner_company_id") REFERENCES "public"."partner_companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_persona_relations"
    ADD CONSTRAINT "case_study_persona_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_persona_relations"
    ADD CONSTRAINT "case_study_persona_relations_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_quantum_company_relations"
    ADD CONSTRAINT "case_study_quantum_company_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_quantum_company_relations"
    ADD CONSTRAINT "case_study_quantum_company_relations_quantum_company_id_fkey" FOREIGN KEY ("quantum_company_id") REFERENCES "public"."quantum_companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_quantum_hardware_relations"
    ADD CONSTRAINT "case_study_quantum_hardware_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_quantum_hardware_relations"
    ADD CONSTRAINT "case_study_quantum_hardware_relations_quantum_hardware_id_fkey" FOREIGN KEY ("quantum_hardware_id") REFERENCES "public"."quantum_hardware"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_quantum_software_relations"
    ADD CONSTRAINT "case_study_quantum_software_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_quantum_software_relations"
    ADD CONSTRAINT "case_study_quantum_software_relations_quantum_software_id_fkey" FOREIGN KEY ("quantum_software_id") REFERENCES "public"."quantum_software"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_relations"
    ADD CONSTRAINT "case_study_relations_case_study_id_fkey" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."case_study_relations"
    ADD CONSTRAINT "case_study_relations_related_case_study_id_fkey" FOREIGN KEY ("related_case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deletion_audit_log"
    ADD CONSTRAINT "deletion_audit_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."persona_algorithm_relations"
    ADD CONSTRAINT "persona_algorithm_relations_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "public"."algorithms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."persona_algorithm_relations"
    ADD CONSTRAINT "persona_algorithm_relations_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."persona_industry_relations"
    ADD CONSTRAINT "persona_industry_relations_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."persona_industry_relations"
    ADD CONSTRAINT "persona_industry_relations_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quantum_company_hardware_relations"
    ADD CONSTRAINT "quantum_company_hardware_relations_quantum_company_id_fkey" FOREIGN KEY ("quantum_company_id") REFERENCES "public"."quantum_companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quantum_company_hardware_relations"
    ADD CONSTRAINT "quantum_company_hardware_relations_quantum_hardware_id_fkey" FOREIGN KEY ("quantum_hardware_id") REFERENCES "public"."quantum_hardware"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quantum_company_software_relations"
    ADD CONSTRAINT "quantum_company_software_relations_quantum_company_id_fkey" FOREIGN KEY ("quantum_company_id") REFERENCES "public"."quantum_companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quantum_company_software_relations"
    ADD CONSTRAINT "quantum_company_software_relations_quantum_software_id_fkey" FOREIGN KEY ("quantum_software_id") REFERENCES "public"."quantum_software"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quantum_hardware_specs"
    ADD CONSTRAINT "quantum_hardware_specs_hardware_id_fkey" FOREIGN KEY ("hardware_id") REFERENCES "public"."quantum_hardware"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stack_layers"
    ADD CONSTRAINT "stack_layers_parent_layer_id_fkey" FOREIGN KEY ("parent_layer_id") REFERENCES "public"."stack_layers"("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can create case studies" ON "public"."case_studies" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_preferences"
  WHERE (("user_preferences"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_preferences"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete case studies" ON "public"."case_studies" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_preferences"
  WHERE (("user_preferences"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_preferences"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete preferences" ON "public"."user_preferences" FOR DELETE TO "authenticated" USING (("role" = 'admin'::"text"));



CREATE POLICY "Admins can insert preferences" ON "public"."user_preferences" FOR INSERT TO "authenticated" WITH CHECK (("role" = 'admin'::"text"));



CREATE POLICY "Admins can update case studies" ON "public"."case_studies" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_preferences"
  WHERE (("user_preferences"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_preferences"."role" = 'admin'::"text")))));



CREATE POLICY "Admins read audit log" ON "public"."deletion_audit_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_preferences"
  WHERE (("user_preferences"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_preferences"."role" = 'admin'::"text")))));



CREATE POLICY "Anon can view published case studies" ON "public"."case_studies" FOR SELECT TO "anon" USING (("published" = true));



CREATE POLICY "Anyone can read hardware spec definitions" ON "public"."hardware_spec_definitions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read specs for published hardware" ON "public"."quantum_hardware_specs" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."quantum_hardware" "h"
  WHERE (("h"."id" = "quantum_hardware_specs"."hardware_id") AND ("h"."published" = true) AND ("h"."deleted_at" IS NULL)))));



CREATE POLICY "Authenticated can update preferences" ON "public"."user_preferences" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("role" = 'admin'::"text")));



CREATE POLICY "Authenticated can view case studies" ON "public"."case_studies" FOR SELECT TO "authenticated" USING ((("published" = true) OR (EXISTS ( SELECT 1
   FROM "public"."user_preferences"
  WHERE (("user_preferences"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_preferences"."role" = 'admin'::"text"))))));



CREATE POLICY "Authenticated can view preferences" ON "public"."user_preferences" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("role" = 'admin'::"text")));



CREATE POLICY "Enable read access for all users" ON "public"."algorithm_case_study_relations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."case_study_industry_relations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."case_study_persona_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view algorithm_industry_relations" ON "public"."algorithm_industry_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view company-hardware relations" ON "public"."quantum_company_hardware_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view company-software relations" ON "public"."quantum_company_software_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view partner_company relations" ON "public"."case_study_partner_company_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view persona_algorithm_relations" ON "public"."persona_algorithm_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view persona_industry_relations for published person" ON "public"."persona_industry_relations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."personas"
  WHERE (("personas"."id" = "persona_industry_relations"."persona_id") AND ("personas"."published" = true)))));



CREATE POLICY "Public can view published algorithms" ON "public"."algorithms" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view published blog_posts" ON "public"."blog_posts" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view published industries" ON "public"."industries" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view published partner_companies" ON "public"."partner_companies" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view published personas" ON "public"."personas" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view published quantum_companies" ON "public"."quantum_companies" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view published quantum_hardware" ON "public"."quantum_hardware" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view published quantum_software" ON "public"."quantum_software" FOR SELECT USING (("published" = true));



CREATE POLICY "Public can view quantum_company relations" ON "public"."case_study_quantum_company_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view quantum_hardware relations" ON "public"."case_study_quantum_hardware_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view quantum_software relations" ON "public"."case_study_quantum_software_relations" FOR SELECT USING (true);



CREATE POLICY "Public can view stack layers" ON "public"."stack_layers" FOR SELECT USING (true);



CREATE POLICY "Service role can insert audit logs" ON "public"."deletion_audit_log" FOR INSERT TO "service_role" WITH CHECK (true);



ALTER TABLE "public"."algorithm_case_study_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."algorithm_industry_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."algorithms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_post_relations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_post_relations_public_read_policy" ON "public"."blog_post_relations" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."blog_posts"
  WHERE (("blog_posts"."id" = "blog_post_relations"."blog_post_id") AND ("blog_posts"."published" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."blog_posts"
  WHERE (("blog_posts"."id" = "blog_post_relations"."related_blog_post_id") AND ("blog_posts"."published" = true))))));



ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_studies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_study_industry_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_study_partner_company_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_study_persona_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_study_quantum_company_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_study_quantum_hardware_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_study_quantum_software_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_study_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deletion_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hardware_spec_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."industries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."persona_algorithm_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."persona_industry_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantum_companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantum_company_hardware_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantum_company_software_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantum_hardware" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantum_hardware_specs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quantum_software" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stack_layers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





















































































































































































































GRANT ALL ON FUNCTION "public"."create_slug"("name_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_slug"("name_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_slug"("name_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recover_content"("table_name" "text", "content_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_blog_posts_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_blog_posts_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_blog_posts_published_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_published_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_published_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_published_at_column"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."setup_admin_role"("admin_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."setup_admin_role"("admin_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_content"("table_name" "text", "content_id" "uuid", "deleted_by_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blog_posts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blog_posts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blog_posts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ts_content"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ts_content"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ts_content"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_initial_setup"() TO "anon";
GRANT ALL ON FUNCTION "public"."verify_initial_setup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_initial_setup"() TO "service_role";




































GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."algorithm_case_study_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."algorithm_case_study_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."algorithm_case_study_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."algorithm_industry_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."algorithm_industry_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."algorithm_industry_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."algorithms" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."algorithms" TO "authenticated";
GRANT ALL ON TABLE "public"."algorithms" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."blog_post_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."blog_post_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."blog_posts" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_studies" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_studies" TO "authenticated";
GRANT ALL ON TABLE "public"."case_studies" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_industry_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_industry_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_industry_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_partner_company_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_partner_company_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_partner_company_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_persona_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_persona_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_persona_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_quantum_company_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_quantum_company_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_quantum_company_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_quantum_hardware_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_quantum_hardware_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_quantum_hardware_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_quantum_software_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_quantum_software_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_quantum_software_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."case_study_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."deletion_audit_log" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."deletion_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."deletion_audit_log" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."hardware_spec_definitions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."hardware_spec_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."hardware_spec_definitions" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."industries" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."industries" TO "authenticated";
GRANT ALL ON TABLE "public"."industries" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."partner_companies" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."partner_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_companies" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."persona_algorithm_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."persona_algorithm_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."persona_algorithm_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."persona_industry_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."persona_industry_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."persona_industry_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."personas" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."personas" TO "authenticated";
GRANT ALL ON TABLE "public"."personas" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_companies" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."quantum_companies" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_company_hardware_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_company_hardware_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."quantum_company_hardware_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_company_software_relations" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_company_software_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."quantum_company_software_relations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_hardware" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_hardware" TO "authenticated";
GRANT ALL ON TABLE "public"."quantum_hardware" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_hardware_specs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_hardware_specs" TO "authenticated";
GRANT ALL ON TABLE "public"."quantum_hardware_specs" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_software" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."quantum_software" TO "authenticated";
GRANT ALL ON TABLE "public"."quantum_software" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."stack_layers" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."stack_layers" TO "authenticated";
GRANT ALL ON TABLE "public"."stack_layers" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."user_preferences" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

drop policy "Anyone can read hardware spec definitions" on "public"."hardware_spec_definitions";

drop policy "Anyone can read specs for published hardware" on "public"."quantum_hardware_specs";

revoke delete on table "public"."algorithm_case_study_relations" from "anon";

revoke insert on table "public"."algorithm_case_study_relations" from "anon";

revoke update on table "public"."algorithm_case_study_relations" from "anon";

revoke delete on table "public"."algorithm_case_study_relations" from "authenticated";

revoke insert on table "public"."algorithm_case_study_relations" from "authenticated";

revoke update on table "public"."algorithm_case_study_relations" from "authenticated";

revoke delete on table "public"."algorithm_industry_relations" from "anon";

revoke insert on table "public"."algorithm_industry_relations" from "anon";

revoke update on table "public"."algorithm_industry_relations" from "anon";

revoke delete on table "public"."algorithm_industry_relations" from "authenticated";

revoke insert on table "public"."algorithm_industry_relations" from "authenticated";

revoke update on table "public"."algorithm_industry_relations" from "authenticated";

revoke delete on table "public"."algorithms" from "anon";

revoke insert on table "public"."algorithms" from "anon";

revoke update on table "public"."algorithms" from "anon";

revoke delete on table "public"."algorithms" from "authenticated";

revoke insert on table "public"."algorithms" from "authenticated";

revoke update on table "public"."algorithms" from "authenticated";

revoke delete on table "public"."blog_post_relations" from "anon";

revoke insert on table "public"."blog_post_relations" from "anon";

revoke update on table "public"."blog_post_relations" from "anon";

revoke delete on table "public"."blog_post_relations" from "authenticated";

revoke insert on table "public"."blog_post_relations" from "authenticated";

revoke update on table "public"."blog_post_relations" from "authenticated";

revoke delete on table "public"."blog_posts" from "anon";

revoke insert on table "public"."blog_posts" from "anon";

revoke update on table "public"."blog_posts" from "anon";

revoke delete on table "public"."blog_posts" from "authenticated";

revoke insert on table "public"."blog_posts" from "authenticated";

revoke update on table "public"."blog_posts" from "authenticated";

revoke delete on table "public"."case_studies" from "anon";

revoke insert on table "public"."case_studies" from "anon";

revoke update on table "public"."case_studies" from "anon";

revoke delete on table "public"."case_studies" from "authenticated";

revoke insert on table "public"."case_studies" from "authenticated";

revoke update on table "public"."case_studies" from "authenticated";

revoke delete on table "public"."case_study_industry_relations" from "anon";

revoke insert on table "public"."case_study_industry_relations" from "anon";

revoke update on table "public"."case_study_industry_relations" from "anon";

revoke delete on table "public"."case_study_industry_relations" from "authenticated";

revoke insert on table "public"."case_study_industry_relations" from "authenticated";

revoke update on table "public"."case_study_industry_relations" from "authenticated";

revoke delete on table "public"."case_study_partner_company_relations" from "anon";

revoke insert on table "public"."case_study_partner_company_relations" from "anon";

revoke update on table "public"."case_study_partner_company_relations" from "anon";

revoke delete on table "public"."case_study_partner_company_relations" from "authenticated";

revoke insert on table "public"."case_study_partner_company_relations" from "authenticated";

revoke update on table "public"."case_study_partner_company_relations" from "authenticated";

revoke delete on table "public"."case_study_persona_relations" from "anon";

revoke insert on table "public"."case_study_persona_relations" from "anon";

revoke update on table "public"."case_study_persona_relations" from "anon";

revoke delete on table "public"."case_study_persona_relations" from "authenticated";

revoke insert on table "public"."case_study_persona_relations" from "authenticated";

revoke update on table "public"."case_study_persona_relations" from "authenticated";

revoke delete on table "public"."case_study_quantum_company_relations" from "anon";

revoke insert on table "public"."case_study_quantum_company_relations" from "anon";

revoke update on table "public"."case_study_quantum_company_relations" from "anon";

revoke delete on table "public"."case_study_quantum_company_relations" from "authenticated";

revoke insert on table "public"."case_study_quantum_company_relations" from "authenticated";

revoke update on table "public"."case_study_quantum_company_relations" from "authenticated";

revoke delete on table "public"."case_study_quantum_hardware_relations" from "anon";

revoke insert on table "public"."case_study_quantum_hardware_relations" from "anon";

revoke update on table "public"."case_study_quantum_hardware_relations" from "anon";

revoke delete on table "public"."case_study_quantum_hardware_relations" from "authenticated";

revoke insert on table "public"."case_study_quantum_hardware_relations" from "authenticated";

revoke update on table "public"."case_study_quantum_hardware_relations" from "authenticated";

revoke delete on table "public"."case_study_quantum_software_relations" from "anon";

revoke insert on table "public"."case_study_quantum_software_relations" from "anon";

revoke update on table "public"."case_study_quantum_software_relations" from "anon";

revoke delete on table "public"."case_study_quantum_software_relations" from "authenticated";

revoke insert on table "public"."case_study_quantum_software_relations" from "authenticated";

revoke update on table "public"."case_study_quantum_software_relations" from "authenticated";

revoke delete on table "public"."case_study_relations" from "anon";

revoke insert on table "public"."case_study_relations" from "anon";

revoke update on table "public"."case_study_relations" from "anon";

revoke delete on table "public"."case_study_relations" from "authenticated";

revoke insert on table "public"."case_study_relations" from "authenticated";

revoke update on table "public"."case_study_relations" from "authenticated";

revoke delete on table "public"."deletion_audit_log" from "anon";

revoke insert on table "public"."deletion_audit_log" from "anon";

revoke update on table "public"."deletion_audit_log" from "anon";

revoke delete on table "public"."deletion_audit_log" from "authenticated";

revoke insert on table "public"."deletion_audit_log" from "authenticated";

revoke update on table "public"."deletion_audit_log" from "authenticated";

revoke delete on table "public"."hardware_spec_definitions" from "anon";

revoke insert on table "public"."hardware_spec_definitions" from "anon";

revoke update on table "public"."hardware_spec_definitions" from "anon";

revoke delete on table "public"."hardware_spec_definitions" from "authenticated";

revoke insert on table "public"."hardware_spec_definitions" from "authenticated";

revoke update on table "public"."hardware_spec_definitions" from "authenticated";

revoke delete on table "public"."industries" from "anon";

revoke insert on table "public"."industries" from "anon";

revoke update on table "public"."industries" from "anon";

revoke delete on table "public"."industries" from "authenticated";

revoke insert on table "public"."industries" from "authenticated";

revoke update on table "public"."industries" from "authenticated";

revoke delete on table "public"."partner_companies" from "anon";

revoke insert on table "public"."partner_companies" from "anon";

revoke update on table "public"."partner_companies" from "anon";

revoke delete on table "public"."partner_companies" from "authenticated";

revoke insert on table "public"."partner_companies" from "authenticated";

revoke update on table "public"."partner_companies" from "authenticated";

revoke delete on table "public"."persona_algorithm_relations" from "anon";

revoke insert on table "public"."persona_algorithm_relations" from "anon";

revoke update on table "public"."persona_algorithm_relations" from "anon";

revoke delete on table "public"."persona_algorithm_relations" from "authenticated";

revoke insert on table "public"."persona_algorithm_relations" from "authenticated";

revoke update on table "public"."persona_algorithm_relations" from "authenticated";

revoke delete on table "public"."persona_industry_relations" from "anon";

revoke insert on table "public"."persona_industry_relations" from "anon";

revoke update on table "public"."persona_industry_relations" from "anon";

revoke delete on table "public"."persona_industry_relations" from "authenticated";

revoke insert on table "public"."persona_industry_relations" from "authenticated";

revoke update on table "public"."persona_industry_relations" from "authenticated";

revoke delete on table "public"."personas" from "anon";

revoke insert on table "public"."personas" from "anon";

revoke update on table "public"."personas" from "anon";

revoke delete on table "public"."personas" from "authenticated";

revoke insert on table "public"."personas" from "authenticated";

revoke update on table "public"."personas" from "authenticated";

revoke delete on table "public"."quantum_companies" from "anon";

revoke insert on table "public"."quantum_companies" from "anon";

revoke update on table "public"."quantum_companies" from "anon";

revoke delete on table "public"."quantum_companies" from "authenticated";

revoke insert on table "public"."quantum_companies" from "authenticated";

revoke update on table "public"."quantum_companies" from "authenticated";

revoke delete on table "public"."quantum_company_hardware_relations" from "anon";

revoke insert on table "public"."quantum_company_hardware_relations" from "anon";

revoke update on table "public"."quantum_company_hardware_relations" from "anon";

revoke delete on table "public"."quantum_company_hardware_relations" from "authenticated";

revoke insert on table "public"."quantum_company_hardware_relations" from "authenticated";

revoke update on table "public"."quantum_company_hardware_relations" from "authenticated";

revoke delete on table "public"."quantum_company_software_relations" from "anon";

revoke insert on table "public"."quantum_company_software_relations" from "anon";

revoke update on table "public"."quantum_company_software_relations" from "anon";

revoke delete on table "public"."quantum_company_software_relations" from "authenticated";

revoke insert on table "public"."quantum_company_software_relations" from "authenticated";

revoke update on table "public"."quantum_company_software_relations" from "authenticated";

revoke delete on table "public"."quantum_hardware" from "anon";

revoke insert on table "public"."quantum_hardware" from "anon";

revoke update on table "public"."quantum_hardware" from "anon";

revoke delete on table "public"."quantum_hardware" from "authenticated";

revoke insert on table "public"."quantum_hardware" from "authenticated";

revoke update on table "public"."quantum_hardware" from "authenticated";

revoke delete on table "public"."quantum_hardware_specs" from "anon";

revoke insert on table "public"."quantum_hardware_specs" from "anon";

revoke update on table "public"."quantum_hardware_specs" from "anon";

revoke delete on table "public"."quantum_hardware_specs" from "authenticated";

revoke insert on table "public"."quantum_hardware_specs" from "authenticated";

revoke update on table "public"."quantum_hardware_specs" from "authenticated";

revoke delete on table "public"."quantum_software" from "anon";

revoke insert on table "public"."quantum_software" from "anon";

revoke update on table "public"."quantum_software" from "anon";

revoke delete on table "public"."quantum_software" from "authenticated";

revoke insert on table "public"."quantum_software" from "authenticated";

revoke update on table "public"."quantum_software" from "authenticated";

revoke delete on table "public"."stack_layers" from "anon";

revoke insert on table "public"."stack_layers" from "anon";

revoke update on table "public"."stack_layers" from "anon";

revoke delete on table "public"."stack_layers" from "authenticated";

revoke insert on table "public"."stack_layers" from "authenticated";

revoke update on table "public"."stack_layers" from "authenticated";

revoke delete on table "public"."user_preferences" from "anon";

revoke insert on table "public"."user_preferences" from "anon";

revoke update on table "public"."user_preferences" from "anon";

revoke delete on table "public"."user_preferences" from "authenticated";

revoke insert on table "public"."user_preferences" from "authenticated";

revoke update on table "public"."user_preferences" from "authenticated";


  create policy "Anyone can read hardware spec definitions"
  on "public"."hardware_spec_definitions"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Anyone can read specs for published hardware"
  on "public"."quantum_hardware_specs"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.quantum_hardware h
  WHERE ((h.id = quantum_hardware_specs.hardware_id) AND (h.published = true) AND (h.deleted_at IS NULL)))));




-- Explicit deny for API roles on every public table (A1 security posture).
-- Fresh Supabase projects grant ALL to anon/authenticated by default; the GRANT
-- statements above are additive, so revoke the write privileges outright.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, MAINTAIN ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated";
