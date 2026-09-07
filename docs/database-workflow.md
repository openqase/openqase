# Database workflow

How schema changes get from your editor to production. This is the only
sanctioned path. Do not run schema-changing SQL in the Supabase dashboard's
SQL editor against any hosted environment.

## Environments

| Environment | Supabase project | Who can write schema | Purpose |
|---|---|---|---|
| Local | Docker via `supabase start` | you | day-to-day development, throwaway |
| Dev | `openqase-dev` | any contributor with the dev credentials | shared integration, migration rehearsal, Vercel preview deployments |
| Prod | `openqase-prod` | maintainers only, manual gate | the live site |

Dev is a copy of prod that can be re-seeded at any time. Nothing on dev is
precious. Prod is.

## The migration ledger

Supabase keeps a table, `supabase_migrations.schema_migrations`, listing which
migration files have been applied to a database. The repo folder
`supabase/migrations/` and that table must agree on every environment.

On 2026-09-05 the history was squashed to a single baseline,
`20260905023326_remote_schema.sql`. Both dev and prod record exactly that one
entry. The pre-baseline files live in `supabase/migrations_archive/` for
reference and are never applied. See the README there for why.

## Making a schema change

### 1. Author

```bash
npx supabase migration new add_modality_to_quantum_hardware
```

This creates `supabase/migrations/<timestamp>_add_modality_to_quantum_hardware.sql`.
Always create files this way. Never hand-write a timestamp, and never edit a
migration after it has been pushed to dev or prod. Write a new one instead.

Rules for the SQL itself:

- **Separate schema from data.** A migration changes structure (`CREATE`,
  `ALTER`, `CREATE POLICY`) or it changes rows (`UPDATE`, `INSERT`). Not both.
  The July 2026 incident that nulled `technology_type` on every hardware row
  was a type change and a lossy `UPDATE` in one file.
- **Data migrations need a pre-flight and a snapshot.** Put the pre-flight
  query and its result in the PR description, for example
  `SELECT technology_type, count(*) FROM quantum_hardware GROUP BY 1`, and
  snapshot the affected column into a backup column or table before changing
  it. The reviewer checks for both.
- **No destructive defaults.** A `CASE ... ELSE NULL` or an unconditional
  overwrite is a red flag. Prefer `WHERE` clauses that only touch rows you
  have listed.
- **Explicit privileges.** New tables must enable RLS and must not grant
  `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` to `anon` or `authenticated`.
  The security tests in `src/__tests__/security/findings.test.ts` check the
  baseline; keep new migrations to the same standard.

### 2. Test locally

```bash
npx supabase start          # first time, or if not running
npx supabase db reset       # rebuilds from baseline + your migration + seed.sql
```

A clean `db reset` proves your migration applies from scratch. Run the app
against local and exercise the affected feature.

### 3. Apply to dev

```bash
npx supabase db push --db-url "$DEV_DB_URL"
```

`DEV_DB_URL` is the session-pooler connection string for `openqase-dev`, kept
in your shell environment or password manager, never in the repo. This records
your migration in dev's ledger. Vercel preview deployments use dev, so the
feature is now testable on a real URL.

If a data migration is involved, run the pre-flight on dev first and paste the
result into the PR.

### 4. Regenerate types

```bash
npx supabase gen types typescript --db-url "$DEV_DB_URL" > src/types/supabase.ts
```

Commit the result with the migration. CI fails if the committed types do not
match the schema produced by the migrations.

### 5. Open the PR

The PR includes the migration file, the regenerated types, and any app code.
A reviewer checks the SQL against the rules above. CI builds a throwaway
database from the baseline plus your migration, runs the seed, and diffs the
generated types.

### 6. Promote to prod

After merge, a maintainer runs:

```bash
npx supabase migration list --db-url "$PROD_DB_URL"   # confirm what is pending
npx supabase db push --db-url "$PROD_DB_URL"
```

This is deliberately manual. Prod credentials are held by maintainers only.
Contributors never need them.

## Re-seeding dev from prod

When dev has drifted or accumulated junk, a maintainer can rebuild it:

```bash
npx supabase db dump --db-url "$PROD_DB_URL" -f roles.sql --role-only
npx supabase db dump --db-url "$PROD_DB_URL" -f schema.sql
npx supabase db dump --db-url "$PROD_DB_URL" -f data.sql --use-copy --data-only --schema auth,public
```

Then reset dev's `public` and `auth` schemas and load the three files with
`psql --single-transaction --variable ON_ERROR_STOP=1`. After a restore into a
Supabase project, revoke `TRUNCATE` and `MAINTAIN` from `anon` and
`authenticated` on all public tables. Fresh projects grant those by default and
`pg_dump`'s `GRANT` lines do not remove them. Finally, repair the ledger so it
matches prod's.

## Recovering from mistakes

- **A migration failed halfway on dev.** Fix the SQL, then `db reset` locally
  to confirm, then re-push. If the ledger recorded it as applied, use
  `npx supabase migration repair --status reverted <version> --db-url "$DEV_DB_URL"`
  before re-pushing.
- **The ledger and the folder disagree.** `npx supabase migration list --db-url ...`
  shows both columns. Reconcile with `migration repair`, one version at a time,
  and understand why they diverged before marking anything applied.
- **Bad data change reached prod.** Stop. Restore from the Supabase dashboard's
  Point in Time Recovery or the daily backup rather than writing a corrective
  `UPDATE` by hand. If the values exist in a git-tracked seed or import script,
  a tracked recovery migration is acceptable, as was done in July 2026.

## Environment variables

The app reads three Supabase variables. Each environment points them at a
different project. The values are the new-format `sb_publishable_` and
`sb_secret_` keys from the project's API Keys page, not the legacy JWT keys,
which Supabase deletes at the end of 2026.

| Variable | Local | Vercel preview | Vercel production |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` or dev | dev | prod |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local or dev publishable key | dev publishable key | prod publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | local or dev secret key | dev secret key | prod secret key |

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must only ever be read on the
server. It is never prefixed `NEXT_PUBLIC_`.
