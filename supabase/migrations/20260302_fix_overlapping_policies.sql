-- Fix Overlapping Permissive Policies
--
-- Splits FOR ALL admin policies into per-action policies so that no
-- role+action combination has more than one permissive policy.
--
-- Before (case_studies, authenticated SELECT):
--   "Admins can manage case studies" (ALL) + "Public can view published" (SELECT)
--   → both evaluated, results OR'd — wasteful
--
-- After: each role+action has exactly one policy.

-- ============================================================================
-- 1. CASE_STUDIES — replace 3 policies with 5 non-overlapping ones
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage case studies" ON "public"."case_studies";
DROP POLICY IF EXISTS "Public can view published case_studies" ON "public"."case_studies";
DROP POLICY IF EXISTS "Authenticated users can create case studies" ON "public"."case_studies";

-- SELECT for anon: published only
CREATE POLICY "Anon can view published case studies"
  ON "public"."case_studies"
  AS permissive
  FOR SELECT
  TO anon
  USING (published = true);

-- SELECT for authenticated: published OR admin (single policy, no overlap)
CREATE POLICY "Authenticated can view case studies"
  ON "public"."case_studies"
  AS permissive
  FOR SELECT
  TO authenticated
  USING (
    published = true
    OR EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE user_preferences.id = (SELECT auth.uid())
        AND user_preferences.role = 'admin'
    )
  );

-- INSERT for authenticated: any authenticated user (unchanged logic)
CREATE POLICY "Authenticated users can create case studies"
  ON "public"."case_studies"
  AS permissive
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE for authenticated: admins only
CREATE POLICY "Admins can update case studies"
  ON "public"."case_studies"
  AS permissive
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE user_preferences.id = (SELECT auth.uid())
        AND user_preferences.role = 'admin'
    )
  );

-- DELETE for authenticated: admins only
CREATE POLICY "Admins can delete case studies"
  ON "public"."case_studies"
  AS permissive
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_preferences
      WHERE user_preferences.id = (SELECT auth.uid())
        AND user_preferences.role = 'admin'
    )
  );

-- ============================================================================
-- 2. USER_PREFERENCES — replace 3 policies with 4 non-overlapping ones
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all preferences" ON "public"."user_preferences";
DROP POLICY IF EXISTS "Users can view own preferences" ON "public"."user_preferences";
DROP POLICY IF EXISTS "Users can update own preferences" ON "public"."user_preferences";

-- SELECT for authenticated: own row OR admin rows
CREATE POLICY "Authenticated can view preferences"
  ON "public"."user_preferences"
  AS permissive
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR role = 'admin');

-- UPDATE for authenticated: own row OR admin rows
CREATE POLICY "Authenticated can update preferences"
  ON "public"."user_preferences"
  AS permissive
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id OR role = 'admin');

-- INSERT for authenticated: admins only (user rows created via service role at signup)
CREATE POLICY "Admins can insert preferences"
  ON "public"."user_preferences"
  AS permissive
  FOR INSERT
  TO authenticated
  WITH CHECK (role = 'admin');

-- DELETE for authenticated: admins only
CREATE POLICY "Admins can delete preferences"
  ON "public"."user_preferences"
  AS permissive
  FOR DELETE
  TO authenticated
  USING (role = 'admin');
