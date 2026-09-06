-- A1 security PR: tighten deletion_audit_log SELECT policy to admins only.
--
-- The previous policy was `FOR SELECT TO authenticated USING (true)`, which
-- exposed full content snapshots of deleted records (in the metadata JSONB
-- column) to every authenticated user. Tightened to admin role only.
--
-- Atomic DROP + CREATE so there is no window in which the policy is missing
-- entirely. Supabase's migration runner wraps files in a transaction by
-- default, but the explicit BEGIN/COMMIT documents the atomicity intent and
-- survives any tooling change.

BEGIN;

DROP POLICY IF EXISTS "Authenticated users can view audit logs"
  ON public.deletion_audit_log;

CREATE POLICY "Admins read audit log"
  ON public.deletion_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

COMMIT;
