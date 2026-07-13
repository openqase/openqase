-- A1 security PR: revoke EXECUTE on setup_admin_role from anon and
-- authenticated.
--
-- The function is plpgsql with no SECURITY DEFINER and no permission
-- revocation. If EXECUTE is granted to anon/authenticated by default,
-- any authenticated user can call it to grant themselves admin role.

REVOKE EXECUTE ON FUNCTION public.setup_admin_role(text)
  FROM PUBLIC, anon, authenticated;

-- service_role can still call it for legitimate admin setup.
