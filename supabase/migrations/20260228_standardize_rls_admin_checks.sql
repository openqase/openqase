-- Migration: Standardize RLS admin policies to use database lookup
-- instead of JWT role claim (auth.jwt() ->> 'role')
--
-- The JWT role claim can be spoofed if JWT signing is compromised.
-- Database lookups via user_preferences are more secure because they
-- verify the role at query time against the actual database state.
--
-- Also tightens deletion_audit_log to admin-only read access.

-- Helper: consistent admin check subquery
-- Pattern: EXISTS (SELECT 1 FROM public.user_preferences WHERE id = auth.uid() AND role = 'admin')

-- 1. algorithm_industry_relations: replace JWT check with DB lookup
DROP POLICY IF EXISTS "Admins can manage algorithm_industry_relations" ON "public"."algorithm_industry_relations";
CREATE POLICY "Admins can manage algorithm_industry_relations"
  ON "public"."algorithm_industry_relations"
  AS permissive
  FOR ALL
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_preferences.id = auth.uid() AND user_preferences.role = 'admin'
  )));

-- 2. blog_posts: replace JWT check with DB lookup
DROP POLICY IF EXISTS "Admins can manage blog posts" ON "public"."blog_posts";
CREATE POLICY "Admins can manage blog posts"
  ON "public"."blog_posts"
  AS permissive
  FOR ALL
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_preferences.id = auth.uid() AND user_preferences.role = 'admin'
  )));

-- 3. case_study_industry_relations: replace JWT check with DB lookup
DROP POLICY IF EXISTS "Admins can manage case_study_industry_relations" ON "public"."case_study_industry_relations";
CREATE POLICY "Admins can manage case_study_industry_relations"
  ON "public"."case_study_industry_relations"
  AS permissive
  FOR ALL
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_preferences.id = auth.uid() AND user_preferences.role = 'admin'
  )));

-- 4. case_study_persona_relations: replace JWT check with DB lookup
DROP POLICY IF EXISTS "Admins can manage case_study_persona_relations" ON "public"."case_study_persona_relations";
CREATE POLICY "Admins can manage case_study_persona_relations"
  ON "public"."case_study_persona_relations"
  AS permissive
  FOR ALL
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_preferences.id = auth.uid() AND user_preferences.role = 'admin'
  )));

-- 5. persona_industry_relations: replace JWT check with DB lookup
DROP POLICY IF EXISTS "Admins can manage persona_industry_relations" ON "public"."persona_industry_relations";
CREATE POLICY "Admins can manage persona_industry_relations"
  ON "public"."persona_industry_relations"
  AS permissive
  FOR ALL
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_preferences.id = auth.uid() AND user_preferences.role = 'admin'
  )));

-- 6. stack_layers: replace JWT check with DB lookup
DROP POLICY IF EXISTS "Admins can manage stack layers" ON "public"."stack_layers";
CREATE POLICY "Admins can manage stack layers"
  ON "public"."stack_layers"
  AS permissive
  FOR ALL
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_preferences.id = auth.uid() AND user_preferences.role = 'admin'
  )));

-- 7. Tighten deletion_audit_log: restrict to admin-only reads
-- Currently allows all authenticated users to read audit logs
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON "public"."deletion_audit_log";
CREATE POLICY "Admins can view audit logs"
  ON "public"."deletion_audit_log"
  AS permissive
  FOR SELECT
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_preferences.id = auth.uid() AND user_preferences.role = 'admin'
  )));
