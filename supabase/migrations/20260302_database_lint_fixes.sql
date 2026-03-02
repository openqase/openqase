-- Database Lint Fixes
--
-- Addresses 30 Supabase lint warnings from issue #161:
--   1. RLS initplan optimisation (auth.uid() wrapped in subselect)
--   2. Overlapping policy consolidation (role scoping + drop unused)
--   3. Function search_path hardening
--   4. Missing FK indexes on junction tables
--
-- Deferred: unused index cleanup (needs production pg_stat verification)

-- ============================================================================
-- 1. RLS INITPLAN FIX — wrap auth.uid() in subselect for per-query evaluation
-- ============================================================================

-- 1a. case_studies: "Admins can manage case studies"
--     Also fixes overlapping policy: change from `public` to `authenticated` role
--     (anon users can never be admin, so this is semantically identical but avoids
--     unnecessary policy evaluation for anonymous requests)
DROP POLICY IF EXISTS "Admins can manage case studies" ON "public"."case_studies";
CREATE POLICY "Admins can manage case studies"
  ON "public"."case_studies"
  AS permissive
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE user_preferences.id = (SELECT auth.uid())
        AND user_preferences.role = 'admin'
    )
  );

-- 1b. user_preferences: "Users can update own preferences"
DROP POLICY IF EXISTS "Users can update own preferences" ON "public"."user_preferences";
CREATE POLICY "Users can update own preferences"
  ON "public"."user_preferences"
  AS permissive
  FOR UPDATE
  TO public
  USING ((SELECT auth.uid()) = id);

-- 1c. user_preferences: "Users can view own preferences"
DROP POLICY IF EXISTS "Users can view own preferences" ON "public"."user_preferences";
CREATE POLICY "Users can view own preferences"
  ON "public"."user_preferences"
  AS permissive
  FOR SELECT
  TO public
  USING ((SELECT auth.uid()) = id);

-- ============================================================================
-- 2. OVERLAPPING POLICY CONSOLIDATION
-- ============================================================================

-- 2a. Drop "Allow anon access to user_preferences" — anon users should not
--     be able to read all user preferences. This was overly permissive.
DROP POLICY IF EXISTS "Allow anon access to user_preferences" ON "public"."user_preferences";

-- 2b. Scope "Admins can manage all preferences" to authenticated role
--     (anon users can never be admin)
DROP POLICY IF EXISTS "Admins can manage all preferences" ON "public"."user_preferences";
CREATE POLICY "Admins can manage all preferences"
  ON "public"."user_preferences"
  AS permissive
  FOR ALL
  TO authenticated
  USING (role = 'admin');

-- ============================================================================
-- 3. FUNCTION search_path HARDENING
-- ============================================================================

ALTER FUNCTION public.set_blog_posts_published_at() SET search_path = public;
ALTER FUNCTION public.set_published_at_column() SET search_path = public;
ALTER FUNCTION public.update_blog_posts_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_ts_content() SET search_path = public;
ALTER FUNCTION public.verify_initial_setup() SET search_path = public;

-- ============================================================================
-- 4. MISSING FK INDEXES on junction table reverse-side columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_blog_post_relations_related_blog_post_id
  ON public.blog_post_relations (related_blog_post_id);

CREATE INDEX IF NOT EXISTS idx_case_study_industry_relations_industry_id
  ON public.case_study_industry_relations (industry_id);

CREATE INDEX IF NOT EXISTS idx_case_study_partner_company_relations_partner_company_id
  ON public.case_study_partner_company_relations (partner_company_id);

CREATE INDEX IF NOT EXISTS idx_case_study_persona_relations_persona_id
  ON public.case_study_persona_relations (persona_id);

CREATE INDEX IF NOT EXISTS idx_case_study_quantum_company_relations_quantum_company_id
  ON public.case_study_quantum_company_relations (quantum_company_id);

CREATE INDEX IF NOT EXISTS idx_case_study_quantum_hardware_relations_quantum_hardware_id
  ON public.case_study_quantum_hardware_relations (quantum_hardware_id);

CREATE INDEX IF NOT EXISTS idx_case_study_quantum_software_relations_quantum_software_id
  ON public.case_study_quantum_software_relations (quantum_software_id);

CREATE INDEX IF NOT EXISTS idx_case_study_relations_related_case_study_id
  ON public.case_study_relations (related_case_study_id);

CREATE INDEX IF NOT EXISTS idx_persona_algorithm_relations_algorithm_id
  ON public.persona_algorithm_relations (algorithm_id);

CREATE INDEX IF NOT EXISTS idx_quantum_company_hardware_relations_quantum_hardware_id
  ON public.quantum_company_hardware_relations (quantum_hardware_id);

CREATE INDEX IF NOT EXISTS idx_quantum_company_software_relations_quantum_software_id
  ON public.quantum_company_software_relations (quantum_software_id);

CREATE INDEX IF NOT EXISTS idx_stack_layers_parent_layer_id
  ON public.stack_layers (parent_layer_id);
