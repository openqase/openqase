-- A1 security PR: revoke INSERT/UPDATE/DELETE/TRUNCATE from anon and
-- authenticated on every table in the public schema.
--
-- This is intentionally a DENYLIST for the entire public schema.
-- Tables that legitimately need anon/authenticated writes must explicitly
-- GRANT in their own future migration. RLS still applies on top of any
-- GRANT — this REVOKE is defense-in-depth, not the primary access control.
--
-- service_role retains full access (it bypasses RLS anyway).
-- SELECT remains; existing RLS policies continue to gate per-table reads.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;
