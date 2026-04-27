# A1 — Security PR Design Spec

**Date:** 2026-04-28
**Status:** Proposed (Phase 3 design spec; awaits owner approval)
**Slice:** A1 in `docs/superpowers/plans/2026-04-27-cms-rebuild-roadmap.md`
**Vision spec:** `docs/superpowers/specs/2026-04-27-cms-vision-design.md` (Approved 2026-04-27)
**Audit:** `docs/superpowers/research/2026-04-27-security-audit.md`
**Estimated duration:** 1–2 days

---

## Problem

Five security findings are exploitable today or one misconfiguration away from being exploitable. Two more are smaller hygiene issues bundled in opportunistically. The fixes are individually small but they collectively introduce a load-bearing architectural invariant — `publicQuery()` as the only sanctioned export for anonymous content reads — and that invariant needs structural enforcement, not code-review hopes.

A1 ships before any further architectural surface lands.

## Goals

- Close the five Tier 1 + Tier 2 findings from the security audit.
- Introduce the `publicQuery()` invariant from vision spec Decision 2 with **module-boundary enforcement** so it's hard to bypass accidentally.
- Bundle three smaller hygiene findings (`setup_admin_role` REVOKE; bulk-delete UUID validation; `DEV_MODE_AUTH_BYPASS` hardening) since they're security-adjacent and cheap.
- Establish the spec/plan format for subsequent Phase 3 slices.

## Non-goals

- Migrating existing fetcher logic to the new pattern wholesale. A1 introduces the chokepoint and routes the **public-content read paths** through it; admin/build-time paths keep their existing direct `.from()` access (legitimately, via the gated module). Other paths get migrated incrementally as A2/A3/A4 touch them.
- Adding rate limiting on admin write endpoints. Real change, separate PR (Medium severity, not load-bearing for the rebuild).
- Sentry PII / `sendDefaultPii` hygiene. Privacy-hygiene fix; defer to a small follow-up PR. Flagged in audit but not on the security path.
- Changing the "JS-side relationship filtering" architectural choice. Decision deferred to Phase 1 (now resolved as Option D); junction `USING (true)` policies stay.
- The CMS engine, generic admin form, drafts/versioning, etc. Those are A2–A6.

---

## Architecture

### The two-module chokepoint

Vision spec Decision 2 commits to: every public content read goes through a single `publicQuery()` chokepoint. The reviewer-refined enforcement mechanism (chosen 2026-04-28) is **module-boundary** rather than regex.

```
src/lib/internal-queries.ts        (RESTRICTED IMPORT — see allow-list)
  fromTable(client, table)         → typed wrapper around client.from(table)
                                     Accepts any table in the schema (content,
                                     junction, lookup) — admin/build-time code
                                     legitimately needs all of them.

src/lib/public-query.ts            (freely importable)
  publicQuery(client, table)       → calls fromTable(client, table)
                                     and chains .eq('published', true)
                                     and .is('deleted_at', null).
                                     Narrows table to ContentTable union —
                                     this is where the published/deleted_at
                                     semantics are meaningful.
  getPublishedBySlug(client, table, slug) → most-common-case helper.
```

**Why two modules:** anonymous reads (which must filter) and admin/build-time reads (which must not, by design) need different defaults but the same underlying access. A single module that exports both makes the chokepoint diluted; two modules with one of them gated cleanly separates the two concerns.

**Why `fromTable` accepts any table, not just `ContentTable`:** the chokepoint must be the *access primitive* — admin code legitimately calls `.from('algorithm_case_study_relations')` (junction) and `.from('user_preferences')` (lookup) just as much as `.from('case_studies')`. If `fromTable` were narrowed to content tables only, admin code would have to bypass it for everything else, which defeats the entire chokepoint purpose. The narrowing to `ContentTable` happens in `publicQuery` because that's the layer where `.eq('published', true)` semantically applies — junction tables don't have a `published` column.

**The allow-list** (paths that are permitted to import `internal-queries`):

| Path | Why allowed |
|---|---|
| `src/lib/public-query.ts` | Wraps `fromContentTable` with the published filter; the only intended caller. |
| `src/app/admin/**` | Admin server actions writing to content tables; legitimately need raw access via service role. |
| `src/cms/operations/**` | The CMS engine's create/update/publish/delete operations; legitimately need raw access. |
| `src/lib/build-time-fetchers.ts` *(new file)* | A new module dedicated to SSG-time fetches (`generateStaticParams`, `generateMetadata`). Currently those calls live scattered in `content-fetchers.ts`; A1 extracts the SSG-only ones. |

Any other file importing `internal-queries` fails the lint check.

### Enforcement: ESLint `no-restricted-imports`

```js
// eslint.config.* additions
{
  files: ['**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/lib/internal-queries', '@/lib/internal-queries'],
        message: 'Direct content-table access is restricted. ' +
                 'Use publicQuery() from @/lib/public-query for ' +
                 'anonymous reads, or move this code into the allow-list ' +
                 '(see docs/superpowers/specs/2026-04-28-a1-security-pr-design.md).'
      }]
    }]
  }
},
// Override for allow-list paths:
{
  files: [
    'src/lib/public-query.ts',
    'src/lib/build-time-fetchers.ts',
    'src/app/admin/**/*.{ts,tsx}',
    'src/cms/operations/**/*.{ts,tsx}'
  ],
  rules: {
    'no-restricted-imports': 'off'
  }
}
```

CI runs `npm run lint` as part of the build. A violation fails the build.

**Why ESLint over a custom CI grep script:** native editor integration (instant feedback in IDE), zero new tooling surface, allow-list is data not regex. The trade-off — ESLint is slower than a grep — is negligible for a single-rule check.

### Module signatures

```ts
// src/lib/internal-queries.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function fromTable<T extends keyof Database['public']['Tables']>(
  client: SupabaseClient<Database>,
  table: T
) {
  return client.from(table);
}
```

Note `fromTable` accepts any table in the schema. This is deliberate (see explanation above). The narrowing happens at the next layer.

```ts
// src/lib/public-query.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { fromTable } from './internal-queries';
import type { Database } from '@/types/supabase';

type ContentTable =
  | 'case_studies' | 'algorithms' | 'industries' | 'personas'
  | 'blog_posts' | 'quantum_software' | 'quantum_hardware'
  | 'quantum_companies' | 'partner_companies';

export function publicQuery<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T
) {
  return fromTable(client, table)
    .eq('published', true)
    .is('deleted_at', null);
}

// Most-common-case helper. Most public reads are by-slug.
export async function getPublishedBySlug<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T,
  slug: string
) {
  return publicQuery(client, table).eq('slug', slug).maybeSingle();
}
```

`publicQuery` returns a Supabase query builder with the two filters already chained — drop-in for call sites that need joins, ordering, multi-record fetches. `getPublishedBySlug` is the helper for the (very common) case of fetching one item by slug. Both are freely importable.

The `ContentTable` union is a guardrail: only content tables (where `published`/`deleted_at` semantics apply) can be used here. Junction tables and lookup tables go through `fromTable` directly via the allow-list (admin/build-time/operations paths).

### Server-action `withAdmin()` higher-order wrapper

Each `'use server'` function under `src/app/admin/*/[id]/actions.ts` (×9) gets wrapped in a higher-order `withAdmin()` helper:

```ts
'use server';
import { withAdmin } from '@/lib/auth';

export const saveCaseStudy = withAdmin(async (formData: FormData) => {
  // existing logic
});
```

`withAdmin(action)` returns an async function that calls `requireAdmin()` and then delegates to the wrapped action. Centralises the auth check, makes "forgot to add `requireAdmin()`" a syntax-level miss rather than a missing-line-in-body miss.

```ts
// src/lib/auth.ts (extended)
export function withAdmin<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    await requireAdmin();
    return action(...args);
  };
}
```

This is Tier 2 (finding 1.3) — middleware blocks the route in the default path, but `withAdmin` adds a second line of defense for misconfigurations or future routing changes.

**Why HOF over "remember to call `requireAdmin()` at the top of the body":** lint enforcement of "every export wraps in `withAdmin`" is a single AST selector matching `CallExpression` whose callee is `withAdmin`. Lint enforcement of "every export's body's first statement is `await requireAdmin()`" is a brittle multi-pattern selector that breaks the moment anyone adds an early `try`/`catch` or a destructured argument check. The HOF makes the rule trivially enforceable and harder to forget.

### Middleware hardening (`DEV_MODE_AUTH_BYPASS`)

Three changes:

1. **`NODE_ENV` gate** in `src/middleware.ts:121-127`. Bypass condition becomes `process.env.NODE_ENV === 'development' && process.env.DEV_MODE_AUTH_BYPASS === 'true' && ...`. Prod builds can never enter the bypass path.
2. **Exact host comparison.** `host?.includes('localhost')` becomes `host === 'localhost:3000' || host === 'localhost' || host === '127.0.0.1' || host === '127.0.0.1:3000'`. No substring match.
3. **Build-time env assertion via `prebuild` npm script.** A new file `scripts/assert-env.js` runs as part of `npm run prebuild`. Vercel runs npm scripts in lifecycle order, so `prebuild` runs before `build`. The script `process.exit(1)`s if `NODE_ENV === 'production' && DEV_MODE_AUTH_BYPASS === 'true'`, which fails the deployment immediately — no successful build artefact is produced.

**Why a `prebuild` script over `src/app/layout.tsx`:** layout.tsx renders both at build time (during SSG) and at every request. The build-time render would catch the misconfiguration, but the per-request render is wasted work, and any post-deploy env change wouldn't be caught until the first request. A dedicated `prebuild` script is the cleaner primary mechanism: it runs exactly once per deployment, fails the build before artefacts are produced, and has zero runtime cost.

```js
// scripts/assert-env.js
if (process.env.NODE_ENV === 'production' &&
    process.env.DEV_MODE_AUTH_BYPASS === 'true') {
  console.error(
    'FATAL: DEV_MODE_AUTH_BYPASS=true is set with NODE_ENV=production.\n' +
    'This combination would expose admin endpoints without auth.\n' +
    'Remove DEV_MODE_AUTH_BYPASS from production env vars and redeploy.'
  );
  process.exit(1);
}
```

```json
// package.json scripts (additions)
{
  "prebuild": "node scripts/assert-env.js"
}
```

Vercel respects `prebuild` because it's an npm lifecycle hook. Local `npm run build` will also run it.

### SQL migrations

Three new SQL migration files. Order matters: REVOKE before policy changes to avoid races during deployment.

```sql
-- supabase/migrations/20260428_a1_revoke_anon_writes.sql

-- This is intentionally a denylist for the entire public schema.
-- Tables that legitimately need anon/authenticated writes must
-- explicitly GRANT in their own future migration. RLS still applies
-- on top of any GRANT — this REVOKE is defense-in-depth, not the
-- primary access control.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;
-- service_role retains full access (bypasses RLS anyway).
-- SELECT remains; existing RLS continues to gate it per-table.
```

```sql
-- supabase/migrations/20260428_a1_audit_log_admin_only.sql

-- Atomic DROP + CREATE so there is no window in which the policy
-- is missing entirely. Supabase's migration runner wraps files in
-- a transaction by default, but explicit BEGIN/COMMIT documents
-- the atomicity intent and survives any tooling change.
BEGIN;

DROP POLICY IF EXISTS "Authenticated users can read audit log"
  ON public.deletion_audit_log;

CREATE POLICY "Admins read audit log"
  ON public.deletion_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_preferences
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

COMMIT;
```

```sql
-- supabase/migrations/20260428_a1_revoke_setup_admin_role.sql

REVOKE EXECUTE ON FUNCTION public.setup_admin_role(text)
  FROM PUBLIC, anon, authenticated;
-- service_role can still call it for legitimate admin setup.
```

**Rollback:** each migration has a documented inverse (re-GRANT, re-create permissive policy, re-GRANT EXECUTE). Documented in commit message; not an automated rollback.

### Bulk-delete UUID validation

The 9 routes at `src/app/api/{type}/delete/route.ts` (and equivalent restore/permanent-delete for case studies) currently accept `{ id, ids }` from `request.json()` without validation. Add Zod:

```ts
const DeleteRequestSchema = z.object({
  id: z.string().uuid().optional(),
  ids: z.array(z.string().uuid()).max(100).optional(),
}).refine(d => d.id || d.ids, { message: 'id or ids required' });
```

Returns 400 on invalid input instead of leaking 500-stack traces.

### `fetchContentBySlug` published filter — split into two named functions

The single most important behavior change in A1: `src/cms/operations/fetch.ts:7-39` (function `fetchContentBySlug`) currently builds a service-role query without `.eq('published', true)` or `.is('deleted_at', null)`. This is finding 1.1 — the actual exploit path.

The function is called from three contexts with genuinely different requirements:

| Caller context | Wants service role? | Wants published filter? | Wants RLS? |
|---|---|---|---|
| `generateStaticParams` (SSG, build-time) | Yes (no session) | Sometimes — depends on whether you want SSG paths for drafts | No (service role bypasses anyway) |
| Page component render at request time (ISR revalidation) | No | Yes | Yes |
| `generateMetadata` at request time | No | Yes | Yes |
| Admin-side read in admin server actions | Yes (admin paths use service role) | No (admin needs to see drafts) | No |

A single function with a `mode` flag would re-introduce the chokepoint problem inside the function body. Instead, **split into two named functions at call sites:**

```ts
// src/lib/build-time-fetchers.ts (allow-listed for internal-queries)
import { fromTable } from './internal-queries';
import { createServiceRoleSupabaseClient } from './supabase-server';

export async function getAllSlugsForBuild<T extends ContentTable>(table: T) {
  const client = createServiceRoleSupabaseClient();
  return fromTable(client, table).select('slug').is('deleted_at', null);
  // Note: includes drafts deliberately — generateStaticParams pre-builds
  // pages for everything, but ISR-revalidated requests apply the published
  // filter. Choosing to pre-build draft slugs avoids per-publish cache misses.
}

export async function getByIdForBuild<T extends ContentTable>(
  table: T, id: string
) { /* admin/build-time service-role read */ }
```

```ts
// src/lib/public-query.ts (already shown above)
export async function getPublishedBySlug<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T,
  slug: string
) {
  return publicQuery(client, table).eq('slug', slug).maybeSingle();
}
```

**Caller pattern (public page):**

```ts
// src/app/case-study/[slug]/page.tsx
import { getAllSlugsForBuild } from '@/lib/build-time-fetchers';
import { getPublishedBySlug } from '@/lib/public-query';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function generateStaticParams() {
  return getAllSlugsForBuild('case_studies');
}

export default async function Page({ params }) {
  const client = await createServerSupabaseClient();
  const item = await getPublishedBySlug(client, 'case_studies', params.slug);
  if (!item.data) notFound();
  // ...
}
```

Two named functions, two purposes, no flag. The reader of any call site immediately knows which path is in play. The chokepoint stays clean because each function lives in its appropriate module: build-time fetchers in the allow-listed `build-time-fetchers.ts`, runtime fetchers in `public-query.ts`.

`fetchContentBySlug` itself can either (a) be deleted and replaced at every call site, or (b) become a thin compatibility shim during the migration that delegates to one path or the other. The implementation plan picks one — likely (a) since A1 is also doing the migration.

---

## File structure

### New files

| File | Purpose |
|---|---|
| `src/lib/internal-queries.ts` | `fromTable(client, table)` — gated raw access; accepts any table |
| `src/lib/public-query.ts` | `publicQuery(client, table)` + `getPublishedBySlug(client, table, slug)` — sanctioned anonymous-read API; `ContentTable` union narrowing |
| `src/lib/build-time-fetchers.ts` | `getAllSlugsForBuild`, `getByIdForBuild` — SSG / service-role fetchers, allow-listed |
| `scripts/assert-env.js` | Build-time `prebuild` env-misconfiguration check |
| `supabase/migrations/20260428_a1_revoke_anon_writes.sql` | REVOKE writes from anon/authenticated; comment documents denylist intent |
| `supabase/migrations/20260428_a1_audit_log_admin_only.sql` | Tighten `deletion_audit_log` RLS; explicit BEGIN/COMMIT |
| `supabase/migrations/20260428_a1_revoke_setup_admin_role.sql` | REVOKE EXECUTE on `setup_admin_role` |

### Modified files

| File | Change |
|---|---|
| `src/lib/auth.ts` | Add `withAdmin<TArgs, TResult>(action)` higher-order wrapper |
| `src/cms/operations/fetch.ts` | `fetchContentBySlug` deleted (or thin compatibility shim); call sites migrate to `getPublishedBySlug` (runtime) or `getByIdForBuild` (build-time) |
| `src/middleware.ts` | `NODE_ENV` gate on bypass; exact host comparison |
| `src/app/admin/*/[id]/actions.ts` (×9) | Each `'use server'` export wrapped in `withAdmin(...)` |
| `src/app/api/{type}/delete/route.ts` (×9) + case-study restore/permanent-delete | Zod validation on `{ id, ids }` |
| `eslint.config.*` | `no-restricted-imports` rule + allow-list overrides; `no-restricted-syntax` rule for server-action `withAdmin` enforcement |
| `package.json` | Add `prebuild` script: `node scripts/assert-env.js` |
| Public page files calling `fetchContentBySlug` (e.g. `src/app/case-study/[slug]/page.tsx`, all `[slug]/page.tsx` under `src/app/paths/**`, `src/app/blog/[slug]/page.tsx`) | Replace single function call with explicit `generateStaticParams` → `getAllSlugsForBuild` and page render → `getPublishedBySlug` |

### Test files (new)

| File | Tests |
|---|---|
| `src/lib/public-query.test.ts` | `publicQuery` applies both filters; passes through other chained calls; `getPublishedBySlug` returns `maybeSingle` shape; types reject non-content tables (compile-time) |
| `src/lib/auth.test.ts` *(extend existing)* | `withAdmin` calls `requireAdmin` before delegate; passes args/return through; throws if requireAdmin throws |
| `scripts/assert-env.test.js` | Script exits 1 when prod + bypass=true; exits 0 in other combinations |
| `src/middleware.test.ts` *(extend existing)* | Bypass is rejected when `NODE_ENV=production`; exact-host comparison rejects `evil-localhost.example.com` |
| `src/__tests__/security/findings.test.ts` *(new)* | Integration tests reproducing each Tier 1 + Tier 2 finding pre-fix and confirming non-reproducibility post-fix |

---

## Migration strategy

**Big-bang within A1, scoped to public-content read paths.** All current public-content read paths route through `publicQuery()` in this PR. Admin/build-time paths keep their existing `.from()` access patterns; they're already legitimate consumers of raw access.

Why big-bang: A1 introduces the chokepoint *and* its enforcement. Allowing both old and new patterns simultaneously dilutes the security guarantee — Finding 1.1 happened because the old pattern existed. The CI check (which lands in the same PR) prevents regressions from the moment the PR merges.

Out-of-A1 migration: A2 (engine completion), A3 (admin form), A4 (relationship pattern consolidation) will touch fetcher code as part of their normal scope. Where they do, they should adopt `publicQuery()` for any public-read paths they introduce or refactor. Pre-existing call sites that A1 didn't touch (e.g., obscure analytics queries) get migrated when those code paths are next opened.

---

## Risks specific to A1

| Risk | Mitigation |
|---|---|
| **Migration of `fetchContentBySlug` callers misses an SSG path; build-time pages break.** | Run the local production build (`next build`) as part of A1 acceptance. Build failure = SSG path missing. Tested before merge. |
| **The allow-list path patterns over- or under-match real call sites.** | Path patterns reviewed against `git ls-files src/` output during the PR. ESLint dry-run (`npm run lint -- --no-fix`) on full tree before merge. Any unexpected file in violation list is either added to allow-list (with explicit justification in commit) or refactored. |
| **Server-action `withAdmin()` wrapping was easy to miss in one of 9 files.** | A second ESLint rule (`no-restricted-syntax`) checks that every export in `src/app/admin/*/[id]/actions.ts` is a `CallExpression` whose callee is `withAdmin`. Single-selector AST check; bundled with the main lint rule. The HOF pattern makes "forgot to wrap" a syntax-level miss rather than a missing-line-in-body miss. |
| **SQL migration on `deletion_audit_log` policy: existing rows remain readable to authenticated users until the new policy applies.** | Migration runs DROP + CREATE in a single transaction. Verified via Supabase migration tooling (`supabase db push` in dev first). |
| **`assert-env.js` `prebuild` check fires for Vercel preview branches that have `DEV_MODE_AUTH_BYPASS=true` set in shared env.** | Document in commit message: Vercel project's *production* env vars must not include `DEV_MODE_AUTH_BYPASS=true`. Preview branches typically have `NODE_ENV=production` in Vercel's default config, so any `DEV_MODE_AUTH_BYPASS=true` there will fail the build correctly — that's the intended behaviour. Local dev (`NODE_ENV=development`) is unaffected. |

---

## Test plan

| Layer | Coverage |
|---|---|
| **Unit** | `publicQuery` applies filters (3 tests: no-filter chain, with .eq, with .order); `assertEnv` throws on prod+bypass (1 test); type-level: `publicQuery` rejects non-content tables (compile-time, no runtime test needed) |
| **Integration** | One test per Tier 1 + Tier 2 finding (5 tests). Each test reproduces the exploit path against a local Supabase, then re-runs against the post-fix code and confirms 404 / denial. |
| **Build-time** | `next build` completes successfully with all migrations applied. No TypeScript errors. ESLint passes on full tree. |
| **Manual smoke** | (a) `curl /api/case-studies?slug=<published>` returns content; same with `?slug=<draft>` returns 404. (b) `curl /api/case-studies/delete -X POST -d '{"id":"not-a-uuid"}'` returns 400. (c) Vercel deploy with `DEV_MODE_AUTH_BYPASS=true` and `NODE_ENV=production` (preview branch) fails with assertion error. |

**Coverage target:** new code in `public-query.ts`, `env-assertions.ts` is ≥90% line coverage. Migration of `fetchContentBySlug` does not lower the coverage of `src/cms/operations/fetch.ts`.

---

## Acceptance criteria

A1 is complete when:

1. All five findings (Tier 1: 1.1, 1.4, 2.1; Tier 2: 1.3, 2.3) are no longer reproducible against the dev server.
2. The `setup_admin_role` REVOKE migration is applied.
3. ESLint `no-restricted-imports` rule is active. Deliberately introducing a violation (test commit) fails CI; reverting it passes.
4. ESLint `no-restricted-syntax` rule for server actions is active and enforces the `withAdmin(...)` wrapping pattern.
5. `prebuild` script `scripts/assert-env.js` runs as part of `npm run build`. A test deployment with `NODE_ENV=production` + `DEV_MODE_AUTH_BYPASS=true` fails the build with the expected error.
6. All 9 server-action files have every export wrapped in `withAdmin(...)`.
7. Bulk-delete routes return 400 on invalid UUIDs; previously they returned 500.
8. Public page render paths use `getPublishedBySlug` from `public-query.ts` with an RLS-respecting client; `generateStaticParams` paths use `getAllSlugsForBuild` from `build-time-fetchers.ts`. `fetchContentBySlug` is deleted.
9. `next build` succeeds end-to-end with no SSG regressions.
10. Test plan is fully implemented; coverage targets met.

---

## Out of scope (deferred to follow-ups)

- **Sentry PII / `sendDefaultPii: false`** — small follow-up; not in A1.
- **Search content sanitisation** (audit finding 5.2) — being replaced by tsvector in A7.
- **Rate limiting on admin write endpoints** (audit finding 11.1) — separate Medium-severity PR.
- **Migrating non-public read paths to the new pattern** — picked up incrementally as A2/A3/A4 touch them.
- **Junction-table `USING (true)` revision** — vision spec Decision 2 commits to leaving these; revisit only if real-time / client-side reads enter the roadmap.

---

## Phase 3 handoff

This spec is the input to the A1 implementation plan, which will be written next via `superpowers:writing-plans`. The implementation plan converts each section above into task-level checkboxes (one per modified file or per logical step), executable via `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

The plan must cover:
- Setup (lint config, allow-list paths)
- Module creation (`internal-queries.ts`, `public-query.ts`, `build-time-fetchers.ts`, `env-assertions.ts`)
- Migration of `fetchContentBySlug`
- Server-action `requireAdmin()` insertion (×9 files)
- Middleware hardening
- SQL migrations (×3)
- Bulk-delete validation (×9 routes)
- Test implementation
- Build verification
- Documentation update (CHANGELOG, possibly a new section in `docs/security.md`)

Order: lint config and modules first (so subsequent code can use them); then the SQL migrations (independent); then the application changes; then tests; then build verification.
