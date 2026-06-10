-- Remaining Lint Fixes
--
-- 1. search_path on two missed functions
-- 2. Tighten case_studies INSERT to admins only

-- ============================================================================
-- 1. FUNCTION search_path — missed from first migration
-- ============================================================================

ALTER FUNCTION public.create_slug(text) SET search_path = public;
ALTER FUNCTION public.setup_admin_role(text) SET search_path = public;

-- ============================================================================
-- 2. TIGHTEN case_studies INSERT — admins only (was WITH CHECK (true))
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create case studies" ON "public"."case_studies";
CREATE POLICY "Admins can create case studies"
  ON "public"."case_studies"
  AS permissive
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE user_preferences.id = (SELECT auth.uid())
        AND user_preferences.role = 'admin'
    )
  );
