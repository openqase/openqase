# Archived migrations (pre-baseline)

These files are the migration history of the original `openqase-site` Supabase
project, up to 2026-09-05. They are **kept for reference only** and are **not
applied** by `supabase db push` or `supabase db reset`.

## Why they were archived

OpenQase was built with a mix of CLI migrations and hand-applied SQL. By
September 2026 the production migration ledger no longer matched this folder:
the three A1 security migrations, `20260710_hardware_specs_normalized`, and the
two July 2026 `technology_type` recovery migrations were all applied but never
recorded, while `20260714_technology_type_hardware_modality` was recorded but
later reverted. Replaying these files in order onto a fresh database did not
reliably reproduce production.

When production moved to the OpenQase-owned Supabase organisation, the true
schema was captured with `supabase db pull` as a single baseline:

    supabase/migrations/20260905023326_remote_schema.sql

That baseline is the only entry in the migration ledger on `openqase-prod` and
`openqase-dev`. Every schema change after it is a new, numbered migration in
`supabase/migrations/`.

## Notes

- `20260714_technology_type_hardware_modality.sql` is lossy. It was applied to
  production, nulled `quantum_hardware.technology_type` on every row, and was
  reverted by `20260717` / `20260718`. Do not run it anywhere.
- The `hardware_spec_definitions` preset rows originally inserted by
  `20260710_hardware_specs_normalized.sql` now live in `supabase/seed.sql`.
- Full git history for each file is preserved (`git log --follow`).
