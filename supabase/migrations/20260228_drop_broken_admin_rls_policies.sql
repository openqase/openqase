-- Drop broken admin write RLS policies
--
-- These 6 policies check `auth.jwt() ->> 'role' = 'admin'` but the JWT
-- never contains a role claim (admin role is stored in user_preferences).
-- They always evaluate to false and are never executed anyway because all
-- admin writes use the service role client which bypasses RLS.
--
-- Removing them eliminates dead code that gives a false sense of security.
-- Public SELECT policies are unaffected and remain in place.
--
-- See: docs/authentication.md "Why Admin Policies Are Broken"

DROP POLICY IF EXISTS "Admins can manage algorithm_industry_relations" ON "public"."algorithm_industry_relations";
DROP POLICY IF EXISTS "Admins can manage blog posts" ON "public"."blog_posts";
DROP POLICY IF EXISTS "Admins can manage case_study_industry_relations" ON "public"."case_study_industry_relations";
DROP POLICY IF EXISTS "Admins can manage case_study_persona_relations" ON "public"."case_study_persona_relations";
DROP POLICY IF EXISTS "Admins can manage persona_industry_relations" ON "public"."persona_industry_relations";
DROP POLICY IF EXISTS "Admins can manage stack layers" ON "public"."stack_layers";
