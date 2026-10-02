-- =============================================================================
-- published_at triggers: fire on INSERT too, and be safe to re-apply
-- =============================================================================
--
-- Supersedes 20260923161000_published_at_triggers_all_types.sql, which
--   (a) guarded only 2 of its 9 trigger definitions with DROP IF EXISTS,
--       so re-applying it by hand fails with "trigger already exists"; and
--   (b) attached the triggers BEFORE UPDATE only, so a row inserted already
--       published (imports, SQL console) never received a published_at, and
--       the function body would raise on INSERT because OLD is unassigned.
--
-- Safe whether or not 20260923161000 was applied: the function is replaced
-- and every trigger is dropped-if-exists then created.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."set_published_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- New row created already published: stamp it unless a date was supplied.
        IF NEW.published IS TRUE AND NEW.published_at IS NULL THEN
            NEW.published_at = NOW();
        END IF;
    ELSIF NEW.published IS TRUE AND OLD.published IS DISTINCT FROM TRUE THEN
        -- First publish (or re-publish): keep the original date if there is one.
        NEW.published_at = COALESCE(OLD.published_at, NEW.published_at, NOW());
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_published_at_column"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."set_published_at_column"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."set_published_at_column"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."set_published_at_column"() FROM "authenticated";
GRANT ALL ON FUNCTION "public"."set_published_at_column"() TO "service_role";

DROP TRIGGER IF EXISTS "set_case_studies_published_at" ON "public"."case_studies";
CREATE TRIGGER "set_case_studies_published_at" BEFORE INSERT OR UPDATE ON "public"."case_studies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_algorithms_published_at" ON "public"."algorithms";
CREATE TRIGGER "set_algorithms_published_at" BEFORE INSERT OR UPDATE ON "public"."algorithms" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_industries_published_at" ON "public"."industries";
CREATE TRIGGER "set_industries_published_at" BEFORE INSERT OR UPDATE ON "public"."industries" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_personas_published_at" ON "public"."personas";
CREATE TRIGGER "set_personas_published_at" BEFORE INSERT OR UPDATE ON "public"."personas" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_blog_posts_published_at" ON "public"."blog_posts";
CREATE TRIGGER "set_blog_posts_published_at" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_quantum_hardware_published_at" ON "public"."quantum_hardware";
CREATE TRIGGER "set_quantum_hardware_published_at" BEFORE INSERT OR UPDATE ON "public"."quantum_hardware" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_quantum_software_published_at" ON "public"."quantum_software";
CREATE TRIGGER "set_quantum_software_published_at" BEFORE INSERT OR UPDATE ON "public"."quantum_software" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_quantum_companies_published_at" ON "public"."quantum_companies";
CREATE TRIGGER "set_quantum_companies_published_at" BEFORE INSERT OR UPDATE ON "public"."quantum_companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();

DROP TRIGGER IF EXISTS "set_partner_companies_published_at" ON "public"."partner_companies";
CREATE TRIGGER "set_partner_companies_published_at" BEFORE INSERT OR UPDATE ON "public"."partner_companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
