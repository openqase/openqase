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
  fromContentTable(client, table)  → typed wrapper around client.from(table)
                                     The only safe way to access content tables.

src/lib/public-query.ts            (freely importable)
  publicQuery(client, table)       → calls fromContentTable(client, table)
                                     then chains .eq('published', true)
                                     and .is('deleted_at', null)
```

**Why two modules:** anonymous reads (which must filter) and admin/build-time reads (which must not, by design) need different defaults but the same underlying access. A single module that exports both makes the chokepoint diluted; two modules with one of them gated cleanly separates the two concerns.

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

### `publicQuery` signature

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { fromContentTable } from './internal-queries';
import type { Database } from '@/types/supabase';

type ContentTable =
  | 'case_studies' | 'algorithms' | 'industries' | 'personas'
  | 'blog_posts' | 'quantum_software' | 'quantum_hardware'
  | 'quantum_companies' | 'partner_companies';

export function publicQuery<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T
) {
  return fromContentTable(client, table)
    .eq('published', true)
    .is('deleted_at', null);
}
```

Returns a Supabase query builder with the two filters already chained. Callers can keep adding `.select()`, `.eq('slug', ...)`, `.order()`, etc. Drop-in for existing call sites.

The `ContentTable` union is a guardrail: only content tables (where `published`/`deleted_at` semantics apply) can be used here. Junction tables and lookup tables go through `fromContentTable` directly via the allow-list.

### Server-action `requireAdmin()` defense-in-depth

Each `'use server'` function under `src/app/admin/*/[id]/actions.ts` (×9) gets:

```ts
'use server';
import { requireAdmin } from '@/lib/auth';

export async function saveCaseStudy(...) {
  await requireAdmin();
  // existing logic
}
```

`requireAdmin()` already exists. No new abstraction; just enforce it at every server-action entry. This is Tier 2 (finding 1.3) — middleware blocks the route in the default path, but `requireAdmin()` adds a second line of defense for misconfigurations or future routing changes.

### Middleware hardening (`DEV_MODE_AUTH_BYPASS`)

Three changes to `src/middleware.ts:121-127`:

1. **`NODE_ENV` gate.** Bypass condition becomes `process.env.NODE_ENV === 'development' && process.env.DEV_MODE_AUTH_BYPASS === 'true' && ...`. Prod builds can never enter the bypass path.
2. **Exact host comparison.** `host?.includes('localhost')` becomes `host === 'localhost:3000' || host === 'localhost' || host === '127.0.0.1' || host === '127.0.0.1:3000'`. No substring match.
3. **Startup assertion.** A new `src/lib/env-assertions.ts` module exports `assertEnv()`. Called from `src/app/layout.tsx` (server-side initialization). Throws if `NODE_ENV === 'production' && DEV_MODE_AUTH_BYPASS === 'true'`. Vercel's build will fail rather than silently expose the bypass.

### SQL migrations

Three new SQL migration files. Order matters: REVOKE before policy changes to avoid races during deployment.

```
supabase/migrations/20260428_a1_revoke_anon_writes.sql
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE
    ON ALL TABLES IN SCHEMA public
    FROM anon, authenticated;
  -- service_role retains full access (bypasses RLS anyway)
  -- SELECT remains; existing RLS continues to gate it.

supabase/migrations/20260428_a1_audit_log_admin_only.sql
  DROP POLICY IF EXISTS "Authenticated users can read audit log"
    ON public.deletion_audit_log;
  CREATE POLICY "Admins read audit log"
    ON public.deletion_audit_log
    FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM user_preferences
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    ));

supabase/migrations/20260428_a1_revoke_setup_admin_role.sql
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

### `fetchContentBySlug` published filter

The single most important behavior change in A1: `src/cms/operations/fetch.ts:7-39` (function `fetchContentBySlug`) currently builds a service-role query without `.eq('published', true)` or `.is('deleted_at', null)`. This is finding 1.1 — the actual exploit path.

Two paths to fix:

1. **Apply the filter inside `fetchContentBySlug`** for non-preview reads. Preview mode (existing) bypasses by passing a flag.
2. **Migrate the function to use `publicQuery()`** so it's enforced architecturally.

Option 2 is the load-bearing fix. The function moves from `createServiceRoleSupabaseClient()` to `createServerSupabaseClient()` + `publicQuery(client, table)`. RLS-respecting client + the published/deleted filter + the wrapper all land together. Service-role access (build-time SSG, admin reads) goes through `build-time-fetchers.ts` instead.

This is a non-trivial refactor: `fetchContentBySlug` is called from public API routes, build-time SSG, and `generateMetadata`. Callers need to be split: build-time / SSG callers move to `build-time-fetchers.ts`; runtime public callers use the new `publicQuery`-based path.

---

## File structure

### New files

| File | Purpose |
|---|---|
| `src/lib/internal-queries.ts` | `fromContentTable(client, table)` — gated raw access |
| `src/lib/public-query.ts` | `publicQuery(client, table)` — sanctioned anonymous-read wrapper |
| `src/lib/build-time-fetchers.ts` | SSG-only content fetchers using service-role client |
| `src/lib/env-assertions.ts` | `assertEnv()` — startup checks, called from root layout |
| `supabase/migrations/20260428_a1_revoke_anon_writes.sql` | REVOKE INSERT/UPDATE/DELETE/TRUNCATE |
| `supabase/migrations/20260428_a1_audit_log_admin_only.sql` | Tighten `deletion_audit_log` RLS |
| `supabase/migrations/20260428_a1_revoke_setup_admin_role.sql` | REVOKE EXECUTE on `setup_admin_role` |

### Modified files

| File | Change |
|---|---|
| `src/cms/operations/fetch.ts` | `fetchContentBySlug` migrates to `publicQuery()`; build-time variant moves to `build-time-fetchers.ts` |
| `src/middleware.ts` | NODE_ENV gate; exact host check; calls `assertEnv()` indirectly via root layout |
| `src/app/layout.tsx` | Calls `assertEnv()` on server-side render init |
| `src/app/admin/*/[id]/actions.ts` (×9) | Add `await requireAdmin()` at top of every `'use server'` function |
| `src/app/api/{type}/delete/route.ts` (×9) + restore/permanent-delete | Zod validation on `{ id, ids }` |
| `eslint.config.*` | `no-restricted-imports` rule + allow-list overrides |

### Test files (new)

| File | Tests |
|---|---|
| `src/lib/public-query.test.ts` | `publicQuery` applies both filters; passes through other chained calls; types reject non-content tables |
| `src/lib/env-assertions.test.ts` | `assertEnv` throws on prod + bypass=true; allows other combinations |
| `src/middleware.test.ts` *(extend existing)* | Bypass is rejected when NODE_ENV=production; exact-host comparison rejects evil-localhost.example.com |
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
| **Server-action `requireAdmin()` was easy to miss in one of 9 files.** | A second ESLint rule (`no-restricted-syntax`) checks that every exported `async function` in `src/app/admin/*/[id]/actions.ts` includes a `requireAdmin()` call. AST-level check. Bundled with the main rule. |
| **SQL migration on `deletion_audit_log` policy: existing rows remain readable to authenticated users until the new policy applies.** | Migration runs DROP + CREATE in a single transaction. Verified via Supabase migration tooling (`supabase db push` in dev first). |
| **`assertEnv()` startup check on Vercel deployments fires for dev preview branches that have `DEV_MODE_AUTH_BYPASS=true` set in shared env.** | Document in commit message: dev/preview branches must not set `DEV_MODE_AUTH_BYPASS` in Vercel env. Verify Vercel project env vars don't include this in production. |

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
4. ESLint `no-restricted-syntax` rule for server actions is active and enforces the `requireAdmin()` call pattern.
5. `assertEnv()` is called from the root layout. A test environment with `NODE_ENV=production` + `DEV_MODE_AUTH_BYPASS=true` throws on startup.
6. All 9 server-action files have `await requireAdmin()` at the top of every `'use server'` function.
7. Bulk-delete routes return 400 on invalid UUIDs; previously they returned 500.
8. `fetchContentBySlug` non-preview path runs through `publicQuery()` and uses `createServerSupabaseClient()` (RLS-respecting). Build-time variant lives in `build-time-fetchers.ts`.
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
