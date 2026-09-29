-- =============================================================================
-- published_at: set once on first publish, for every content type
-- =============================================================================
--
-- WHAT
--   1. Redefine public.set_published_at_column() so that when a row becomes
--      published (published goes from false/NULL to true), published_at is set
--      to the ORIGINAL publish date if one exists, otherwise NOW().
--   2. Point blog_posts at the same function (its bespoke
--      set_blog_posts_published_at() had identical, overwriting logic) and drop
--      the bespoke function.
--   3. Attach the trigger to all 9 content tables. Previously only blog_posts
--      and personas had one.
--   4. Trigger functions are never called directly: revoke EXECUTE from
--      anon/authenticated (the baseline granted ALL).
--
-- WHY
--   - The old triggers set published_at = NOW() on every false -> true change,
--     so unpublishing and republishing a post moved its publish date to today.
--     The app (src/cms/operations/publish.ts) now preserves an existing
--     published_at; the triggers were overriding that.
--   - They did not fire when published was NULL (OLD.published = FALSE is
--     NULL for NULL rows).
--   - Case studies, algorithms, industries, hardware, software and companies
--     had no trigger, so paths that bypass publishContent (e.g. case-study bulk
--     publish) never set published_at.
--
-- Run 20260923160000_backfill_published_at.sql first (it fills historical
-- NULLs); this migration only affects future publishes.
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."set_published_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    IF NEW.published IS TRUE AND OLD.published IS DISTINCT FROM TRUE THEN
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

-- blog_posts: switch to the shared function, then drop the bespoke one
DROP TRIGGER IF EXISTS "set_blog_posts_published_at" ON "public"."blog_posts";
DROP FUNCTION IF EXISTS "public"."set_blog_posts_published_at"();

DROP TRIGGER IF EXISTS "set_personas_published_at" ON "public"."personas";

CREATE TRIGGER "set_case_studies_published_at" BEFORE UPDATE ON "public"."case_studies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_algorithms_published_at" BEFORE UPDATE ON "public"."algorithms" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_industries_published_at" BEFORE UPDATE ON "public"."industries" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_personas_published_at" BEFORE UPDATE ON "public"."personas" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_blog_posts_published_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_quantum_hardware_published_at" BEFORE UPDATE ON "public"."quantum_hardware" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_quantum_software_published_at" BEFORE UPDATE ON "public"."quantum_software" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_quantum_companies_published_at" BEFORE UPDATE ON "public"."quantum_companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();
CREATE TRIGGER "set_partner_companies_published_at" BEFORE UPDATE ON "public"."partner_companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_published_at_column"();


-- =============================================================================
-- ROLLBACK (manual)
-- =============================================================================
-- DROP TRIGGER IF EXISTS set_case_studies_published_at ON public.case_studies;
-- DROP TRIGGER IF EXISTS set_algorithms_published_at ON public.algorithms;
-- DROP TRIGGER IF EXISTS set_industries_published_at ON public.industries;
-- DROP TRIGGER IF EXISTS set_quantum_hardware_published_at ON public.quantum_hardware;
-- DROP TRIGGER IF EXISTS set_quantum_software_published_at ON public.quantum_software;
-- DROP TRIGGER IF EXISTS set_quantum_companies_published_at ON public.quantum_companies;
-- DROP TRIGGER IF EXISTS set_partner_companies_published_at ON public.partner_companies;
-- To restore the old overwrite-on-republish behaviour and the bespoke blog
-- function, re-run their definitions from 20260905023326_remote_schema.sql.
