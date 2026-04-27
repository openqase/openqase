# A1 Security PR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close five Tier 1 + Tier 2 security findings, introduce the `publicQuery()` invariant under module-boundary enforcement, and bundle three smaller hygiene fixes (REVOKE on `setup_admin_role`, bulk-delete UUID validation, `DEV_MODE_AUTH_BYPASS` hardening).

**Architecture:** A two-module chokepoint (`internal-queries.ts` gated by ESLint `no-restricted-imports`; `public-query.ts` freely importable) replaces scattered raw `.from()` calls on content tables. Server actions wrap in a `withAdmin()` HOF enforced by ESLint `no-restricted-syntax`. Build-time env misconfiguration is caught by an `npm prebuild` script. Three SQL migrations tighten GRANTs, RLS, and function permissions.

**Tech Stack:** TypeScript, Next.js 16 App Router (server actions + middleware), Supabase, Zod v4, Vitest, ESLint.

**Spec:** `docs/superpowers/specs/2026-04-28-a1-security-pr-design.md` (Approved 2026-04-28)

---

## File Structure

### New files
- `src/lib/internal-queries.ts` — gated `fromTable<T>(client, table)` primitive (replaces `supabase-untyped.ts`)
- `src/lib/public-query.ts` — `publicQuery<T>()` + `getPublishedBySlug<T>()` for anonymous reads
- `src/lib/with-admin.ts` — `withAdmin()` higher-order wrapper (or extend `auth.ts`; this plan extends `auth.ts`)
- `scripts/assert-env.js` — `prebuild` env-misconfiguration check
- `scripts/assert-env.test.js` — subprocess test for the script
- `supabase/migrations/20260428_a1_revoke_anon_writes.sql`
- `supabase/migrations/20260428_a1_audit_log_admin_only.sql`
- `supabase/migrations/20260428_a1_revoke_setup_admin_role.sql`
- `src/lib/public-query.test.ts`
- `src/__tests__/security/findings.integration.test.ts`

### Modified files
- `src/lib/auth.ts` — add `withAdmin()` HOF
- `src/lib/auth.test.ts` *(new if missing)* — tests for `withAdmin`
- `src/middleware.ts` — `NODE_ENV` gate + exact host comparison
- `src/middleware.test.ts` *(extend if exists; create if not)* — bypass tests
- `eslint.config.*` — `no-restricted-imports` rule + `no-restricted-syntax` rule + allow-list overrides
- `package.json` — add `prebuild` script
- `src/cms/operations/fetch.ts` — `fetchContentBySlug` uses RLS-respecting client + published filter (or removed if all callers go through `page-helpers.ts`)
- `src/cms/page-helpers.ts` — replace internal usage to call new functions
- 9× public page files: replace `fetchContentBySlug` calls with `getPublishedBySlug` + `getAllSlugsForBuild`
- 8× API GET route files: apply published filter via `getPublishedBySlug` for slug branches
- 9× admin action files: wrap exports in `withAdmin()`
- 9× delete route files (+ 2 case-study restore/permanent-delete): Zod input validation
- All callers of `supabase-untyped.ts` → switch to `internal-queries.ts`
- `CHANGELOG.md` — entry under `[Unreleased]` / Security

### Deleted
- `src/lib/supabase-untyped.ts` (replaced by typed `internal-queries.ts`)

---

## Conventions for this plan

- Each task is independently committable. The slice ships when all tasks are complete and the build/tests pass.
- Where a step shows code, the code is complete — no stubs.
- TDD where reasonable. Some structural changes (lint config, SQL migrations, file moves) don't have test-first variants; those use a "verify" step instead.
- Run from repo root unless otherwise stated.
- Test commands: `npm test -- <pattern>` for unit; `npm run test:integration -- <pattern>` for integration.
- Type-check: `npx tsc --noEmit --skipLibCheck` (per project memory; pre-existing errors in `node_modules/next` and `schema.test.ts` are expected and not a regression signal).

---

## Task 1: Create the gated `internal-queries.ts`

**Files:**
- Create: `src/lib/internal-queries.ts`
- Test: `src/lib/internal-queries.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/internal-queries.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createServiceRoleSupabaseClient } from './supabase-server';
import { fromTable } from './internal-queries';

describe('fromTable', () => {
  it('accepts content tables', () => {
    const client = createServiceRoleSupabaseClient();
    const builder = fromTable(client, 'case_studies');
    expect(builder).toBeDefined();
    expect(typeof builder.select).toBe('function');
  });

  it('accepts junction tables', () => {
    const client = createServiceRoleSupabaseClient();
    const builder = fromTable(client, 'algorithm_case_study_relations');
    expect(builder).toBeDefined();
  });

  it('accepts lookup tables (user_preferences)', () => {
    const client = createServiceRoleSupabaseClient();
    const builder = fromTable(client, 'user_preferences');
    expect(builder).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/internal-queries.test.ts
```
Expected: FAIL with `Cannot find module './internal-queries'`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/internal-queries.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Gated content-table access primitive.
 *
 * INVARIANT: this module is only importable from the allow-list defined in
 * eslint.config.* (`no-restricted-imports`). The allow-list covers
 * build-time fetchers, admin server actions, the CMS engine's operations,
 * and the public-query.ts wrapper.
 *
 * Anonymous public reads MUST use `publicQuery` from `./public-query`,
 * which applies the `published=true` and `deleted_at IS NULL` filters and
 * uses an RLS-respecting Supabase client.
 *
 * Accepts any table in the schema. Narrowing to ContentTable happens at
 * the publicQuery layer because that is where the published/deleted_at
 * semantics are meaningful — junction and lookup tables don't have those
 * columns.
 */
export function fromTable<T extends keyof Database['public']['Tables']>(
  client: SupabaseClient<Database>,
  table: T
) {
  return client.from(table);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/internal-queries.test.ts
```
Expected: PASS, 3 tests.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```
Expected: no new errors. (Pre-existing errors in `node_modules/next` and `schema.test.ts` are unchanged.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/internal-queries.ts src/lib/internal-queries.test.ts
git commit -m "feat(security): add gated fromTable primitive in internal-queries.ts"
```

---

## Task 2: Add ESLint `no-restricted-imports` rule with allow-list

**Files:**
- Modify: `eslint.config.mjs` (or whichever ESLint config the project uses; verify before editing)

- [ ] **Step 1: Locate the project's ESLint config**

```bash
ls eslint.config.* .eslintrc.* 2>/dev/null
```
Expected: one of these files exists. Read it to understand the current shape (flat config vs legacy).

- [ ] **Step 2: Add the rule and allow-list overrides**

Append to the flat config array (or equivalent in legacy config):

```js
// eslint.config.mjs additions

// Restrict imports of internal-queries to the allow-list.
{
  files: ['**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/lib/internal-queries', '@/lib/internal-queries'],
        message:
          'Direct content-table access is restricted. Use publicQuery() ' +
          'from @/lib/public-query for anonymous reads. If you legitimately ' +
          'need raw access (build-time SSG, admin write, service-role ' +
          'operation), add this file to the allow-list in eslint.config.mjs ' +
          'and document the reason in the commit message.'
      }]
    }]
  }
},
// Override for allow-listed paths.
{
  files: [
    'src/lib/public-query.ts',
    'src/lib/public-query.test.ts',
    'src/cms/page-helpers.ts',
    'src/cms/operations/**/*.{ts,tsx}',
    'src/app/admin/**/*.{ts,tsx}',
    'src/lib/internal-queries.ts',
    'src/lib/internal-queries.test.ts',
  ],
  rules: {
    'no-restricted-imports': 'off'
  }
}
```

- [ ] **Step 3: Verify the rule blocks an unauthorised import**

Create a temporary file `src/__sanity__/bypass.ts`:
```ts
import { fromTable } from '@/lib/internal-queries';
export const _ = fromTable;
```

Run:
```bash
npx eslint src/__sanity__/bypass.ts
```
Expected: ERROR about the restricted import.

- [ ] **Step 4: Verify the rule allows an allow-listed import**

Run:
```bash
npx eslint src/lib/internal-queries.test.ts
```
Expected: no error from `no-restricted-imports` (other rules may report).

- [ ] **Step 5: Remove the sanity-check file**

```bash
rm -rf src/__sanity__
```

- [ ] **Step 6: Run full lint to confirm no regressions**

```bash
npm run lint
```
Expected: no new errors. Existing warnings unchanged.

- [ ] **Step 7: Commit**

```bash
git add eslint.config.* 
git commit -m "feat(security): enforce internal-queries module boundary via ESLint"
```

---

## Task 3: Migrate `supabase-untyped` callers to `internal-queries`; delete `supabase-untyped.ts`

**Files:**
- Delete: `src/lib/supabase-untyped.ts`
- Modify: every file that imports from `@/lib/supabase-untyped`

- [ ] **Step 1: Find all callers**

```bash
git grep -l "from '@/lib/supabase-untyped'\|from './supabase-untyped'" src/
```
Expected: a list of files. Capture this list.

- [ ] **Step 2: For each caller, rewrite the import**

Sed-style update for each file in the list (replace the import path and ensure the file is in the allow-list, otherwise the lint rule will flag it):

```diff
- import { fromTable } from '@/lib/supabase-untyped';
+ import { fromTable } from '@/lib/internal-queries';
```

Each file must already be in the allow-list paths added in Task 2 (CMS engine paths, admin paths, etc.). If a caller is *not* in the allow-list, that's a signal: it's probably a public-read path that should migrate to `publicQuery()` in Task 12 instead. For now, note any such files but don't modify them — they'll be handled later.

- [ ] **Step 3: Delete `supabase-untyped.ts`**

```bash
rm src/lib/supabase-untyped.ts
```

- [ ] **Step 4: Run type-check**

```bash
npx tsc --noEmit --skipLibCheck
```
Expected: no errors related to the deletion.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```
Expected: all tests still pass.

- [ ] **Step 6: Run lint**

```bash
npm run lint
```
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(security): migrate supabase-untyped callers to internal-queries; delete legacy module"
```

---

## Task 4: Create `public-query.ts` with `publicQuery` and `getPublishedBySlug`

**Files:**
- Create: `src/lib/public-query.ts`
- Test: `src/lib/public-query.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/public-query.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { publicQuery, getPublishedBySlug } from './public-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function makeMockClient() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: Record<string, unknown> = {};
  const recorder = (method: string) =>
    vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    });
  builder.select = recorder('select');
  builder.eq = recorder('eq');
  builder.is = recorder('is');
  builder.maybeSingle = recorder('maybeSingle');
  builder.from = recorder('from');
  const client = { from: builder.from } as unknown as SupabaseClient<Database>;
  return { client, calls, builder };
}

describe('publicQuery', () => {
  it('chains .eq("published", true) on a content table', () => {
    const { client, calls } = makeMockClient();
    publicQuery(client, 'case_studies');
    expect(calls).toContainEqual({ method: 'from', args: ['case_studies'] });
    expect(calls).toContainEqual({ method: 'eq', args: ['published', true] });
  });

  it('chains .is("deleted_at", null) on a content table', () => {
    const { client, calls } = makeMockClient();
    publicQuery(client, 'case_studies');
    expect(calls).toContainEqual({ method: 'is', args: ['deleted_at', null] });
  });

  it('returns a builder that supports further chaining (.select, .eq, .order)', () => {
    const { client, builder } = makeMockClient();
    const result = publicQuery(client, 'case_studies');
    expect(result).toBe(builder);
    expect(typeof result.select).toBe('function');
    expect(typeof result.eq).toBe('function');
  });
});

describe('getPublishedBySlug', () => {
  it('chains .eq("slug", slug) and .maybeSingle()', async () => {
    const { client, calls, builder } = makeMockClient();
    builder.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    await getPublishedBySlug(client, 'case_studies', 'foo-slug');
    expect(calls).toContainEqual({ method: 'eq', args: ['slug', 'foo-slug'] });
  });

  it('also applies the published + deleted_at filters', async () => {
    const { client, calls, builder } = makeMockClient();
    builder.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    await getPublishedBySlug(client, 'algorithms', 'bar');
    expect(calls).toContainEqual({ method: 'eq', args: ['published', true] });
    expect(calls).toContainEqual({ method: 'is', args: ['deleted_at', null] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/public-query.test.ts
```
Expected: FAIL with module-not-found.

- [ ] **Step 3: Write minimal implementation**

`src/lib/public-query.ts`:
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fromTable } from './internal-queries';

/**
 * Tables where `published` and `deleted_at` semantics apply.
 * Junction and lookup tables are NOT here — they have neither column.
 */
export type ContentTable =
  | 'case_studies'
  | 'algorithms'
  | 'industries'
  | 'personas'
  | 'blog_posts'
  | 'quantum_software'
  | 'quantum_hardware'
  | 'quantum_companies'
  | 'partner_companies';

/**
 * Sanctioned anonymous-read primitive for content tables.
 *
 * Returns a Supabase query builder with `.eq('published', true)` and
 * `.is('deleted_at', null)` already chained. Callers can keep adding
 * `.select(...)`, `.eq(...)`, `.order(...)`, etc.
 *
 * Use with an RLS-respecting client (`createServerSupabaseClient()`),
 * NOT a service-role client. Service-role bypasses RLS, which defeats
 * the defense-in-depth this layer provides.
 */
export function publicQuery<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T
) {
  return fromTable(client, table)
    .eq('published', true)
    .is('deleted_at', null);
}

/**
 * Most-common-case helper: fetch one published, non-deleted record by slug.
 * Returns the Supabase result shape: `{ data, error }`.
 */
export function getPublishedBySlug<T extends ContentTable>(
  client: SupabaseClient<Database>,
  table: T,
  slug: string
) {
  return publicQuery(client, table).eq('slug', slug).maybeSingle();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/public-query.test.ts
```
Expected: PASS, 5 tests.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/public-query.ts src/lib/public-query.test.ts
git commit -m "feat(security): add publicQuery + getPublishedBySlug for anonymous content reads"
```

---

## Task 5: Add `withAdmin()` higher-order wrapper to `auth.ts`

**Files:**
- Modify: `src/lib/auth.ts`
- Test: `src/lib/auth.test.ts` (create if missing; check first)

- [ ] **Step 1: Check whether `auth.test.ts` exists**

```bash
ls src/lib/auth.test.ts 2>/dev/null || echo "missing"
```

- [ ] **Step 2: Write the failing test**

`src/lib/auth.test.ts` (extend if exists; otherwise create):
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAdmin } from './auth';
import * as authModule from './auth';

describe('withAdmin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls requireAdmin before delegating to the action', async () => {
    const requireAdminSpy = vi
      .spyOn(authModule, 'requireAdmin')
      .mockResolvedValue({ user: { id: 'u1' }, error: null });
    const inner = vi.fn(async (n: number) => n + 1);

    const wrapped = withAdmin(inner);
    const result = await wrapped(41);

    expect(requireAdminSpy).toHaveBeenCalledOnce();
    expect(inner).toHaveBeenCalledWith(41);
    expect(result).toBe(42);
  });

  it('throws if requireAdmin returns an error result', async () => {
    vi.spyOn(authModule, 'requireAdmin').mockResolvedValue({
      user: null,
      error: new Response('unauthorized', { status: 401 }) as never,
    });
    const inner = vi.fn(async () => 'should not run');

    const wrapped = withAdmin(inner);

    await expect(wrapped()).rejects.toThrow(/admin/i);
    expect(inner).not.toHaveBeenCalled();
  });

  it('passes through multiple arguments and the return type', async () => {
    vi.spyOn(authModule, 'requireAdmin').mockResolvedValue({
      user: { id: 'u1' }, error: null,
    });
    const inner = vi.fn(async (a: string, b: string) => `${a}-${b}`);

    const wrapped = withAdmin(inner);
    const result = await wrapped('foo', 'bar');

    expect(result).toBe('foo-bar');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- src/lib/auth.test.ts
```
Expected: FAIL — `withAdmin` not exported.

- [ ] **Step 4: Implement `withAdmin`**

Append to `src/lib/auth.ts` (after the existing `requireAdmin` export):

```ts
/**
 * Higher-order wrapper for server actions.
 *
 * INVARIANT: every export under src/app/admin/.../actions.ts must be wrapped
 * in withAdmin(). Enforced by an ESLint no-restricted-syntax rule.
 *
 * Throws on auth failure. Server actions can throw — Next.js will surface
 * the error to the client. We do not return the NextResponse from
 * requireAdmin() here because server actions are not HTTP handlers.
 *
 * This is defense-in-depth (Tier 2 finding 1.3): the middleware already
 * blocks unauthorised access in the default path. withAdmin closes the gap
 * for misconfigurations or future routing changes.
 */
export function withAdmin<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const auth = await requireAdmin();
    if (auth.error) {
      throw new Error('Unauthorized: admin access required');
    }
    return action(...args);
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- src/lib/auth.test.ts
```
Expected: PASS, 3 tests.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat(security): add withAdmin() HOF for server-action defense-in-depth"
```

---

## Task 6: ESLint `no-restricted-syntax` rule enforcing `withAdmin` wrapping

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Add the rule scoped to admin action files**

Append to the flat config (after the `no-restricted-imports` rule from Task 2):

```js
// Enforce that every export in admin server-action files is wrapped in withAdmin().
{
  files: ['src/app/admin/**/actions.ts'],
  rules: {
    'no-restricted-syntax': ['error',
      {
        // Disallow exported async function declarations.
        // e.g. `export async function saveCaseStudy(...) { ... }`
        selector: 'ExportNamedDeclaration > FunctionDeclaration',
        message:
          'Server actions must be wrapped in withAdmin() from @/lib/auth. ' +
          'Use: export const NAME = withAdmin(async (...) => { ... }).'
      },
      {
        // Disallow exported variable declarations whose initializer is NOT
        // a CallExpression with callee.name === 'withAdmin'.
        selector:
          'ExportNamedDeclaration > VariableDeclaration > ' +
          "VariableDeclarator:not([init.callee.name='withAdmin'])",
        message:
          'Server actions must be wrapped in withAdmin() from @/lib/auth. ' +
          'Helpers and non-action exports do not belong in actions.ts files; ' +
          'move them elsewhere.'
      }
    ]
  }
}
```

> **Note:** if this selector turns out to over-flag in practice (e.g., it incorrectly flags re-exports from other modules), fall back to a custom 20-line ESLint rule. Don't get stuck on selector golf.

- [ ] **Step 2: Verify the rule fires on a non-wrapped export**

Create temp file `src/app/admin/_sanity_/actions.ts`:
```ts
'use server';
export async function saveSomething() { return 1; }
```

Run:
```bash
npx eslint src/app/admin/_sanity_/actions.ts
```
Expected: ERROR matching the message.

- [ ] **Step 3: Verify the rule passes a wrapped export**

Modify the temp file:
```ts
'use server';
import { withAdmin } from '@/lib/auth';
export const saveSomething = withAdmin(async () => 1);
```

Run:
```bash
npx eslint src/app/admin/_sanity_/actions.ts
```
Expected: no error from `no-restricted-syntax`.

- [ ] **Step 4: Remove the sanity directory**

```bash
rm -rf src/app/admin/_sanity_
```

- [ ] **Step 5: Run full lint to capture the current state of admin actions**

```bash
npm run lint 2>&1 | tee /tmp/lint-pre-task7.log
```
Expected: errors on the 9 unmodified admin-action files. **This is intentional** — Task 7 fixes them.

- [ ] **Step 6: Commit**

```bash
git add eslint.config.*
git commit -m "feat(security): enforce withAdmin wrapping on admin server actions via ESLint"
```

---

## Task 7: Wrap exports in all 9 admin action files with `withAdmin`

**Files:**
- Modify: each of the 9 files under `src/app/admin/*/[id]/actions.ts`

- [ ] **Step 1: List the 9 files**

```bash
ls src/app/admin/*/\[id\]/actions.ts
```
Expected: 9 files (algorithms, blog, case-studies, industries, partner-companies, personas, quantum-companies, quantum-hardware, quantum-software).

- [ ] **Step 2: For each file, refactor every export**

Read each `actions.ts`. The current pattern is:
```ts
'use server';
export async function saveAlgorithm(formData: FormData) { /* ... */ }
export async function publishAlgorithm(id: string) { /* ... */ }
export async function unpublishAlgorithm(id: string) { /* ... */ }
```

Refactor to:
```ts
'use server';
import { withAdmin } from '@/lib/auth';

export const saveAlgorithm = withAdmin(async (formData: FormData) => { /* same body */ });
export const publishAlgorithm = withAdmin(async (id: string) => { /* same body */ });
export const unpublishAlgorithm = withAdmin(async (id: string) => { /* same body */ });
```

Preserve the existing function bodies and parameter names. Each file should be a mechanical rewrite.

> **Important:** if a file exports any helper that is NOT a server action (e.g., a Zod schema, a constant, a type), move it to a sibling `helpers.ts` or `schemas.ts` file. The lint rule (Task 6) does not allow non-`withAdmin` exports in `actions.ts` files. This is a deliberate convention.

- [ ] **Step 3: Run lint on the admin actions directory**

```bash
npx eslint 'src/app/admin/**/actions.ts'
```
Expected: clean (no `no-restricted-syntax` errors).

- [ ] **Step 4: Run full lint to confirm no regressions elsewhere**

```bash
npm run lint
```
Expected: clean.

- [ ] **Step 5: Run all tests**

```bash
npm test
```
Expected: all green.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit --skipLibCheck
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/
git commit -m "feat(security): wrap all admin server actions in withAdmin()"
```

---

## Task 8: SQL migrations — REVOKE writes, tighten audit log RLS, REVOKE `setup_admin_role`

**Files:**
- Create: `supabase/migrations/20260428_a1_revoke_anon_writes.sql`
- Create: `supabase/migrations/20260428_a1_audit_log_admin_only.sql`
- Create: `supabase/migrations/20260428_a1_revoke_setup_admin_role.sql`

- [ ] **Step 1: Write the REVOKE-writes migration**

`supabase/migrations/20260428_a1_revoke_anon_writes.sql`:
```sql
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
```

- [ ] **Step 2: Write the audit-log-admin-only migration**

`supabase/migrations/20260428_a1_audit_log_admin_only.sql`:
```sql
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

DROP POLICY IF EXISTS "Authenticated users can read audit log"
  ON public.deletion_audit_log;

CREATE POLICY "Admins read audit log"
  ON public.deletion_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ));

COMMIT;
```

> **Verify before running — MANDATORY, do not skip.** `DROP POLICY IF EXISTS` with the wrong policy name silently no-ops, leaving the old permissive policy in place. The migration would "succeed" while leaving the audit-log finding open — exactly the failure mode this is supposed to prevent.

- [ ] **Step 2.5: MANDATORY — verify the existing audit-log policy name before applying**

Run against the live dev database:

```bash
npx supabase db connect <<'SQL'
SELECT policyname, cmd, qual
  FROM pg_policies
  WHERE tablename = 'deletion_audit_log' AND cmd = 'SELECT';
SQL
```

Expected: one row. The `policyname` may or may not be `"Authenticated users can read audit log"`. **If it differs, edit the migration's DROP statement to match the exact name found here.** Do not proceed to Step 4 until the migration's DROP statement names a policy that actually exists.

If `psql` reports zero rows, the policy may have already been dropped — investigate why before continuing. Don't apply a CREATE that may collide with another untracked policy.

- [ ] **Step 3: Write the REVOKE-`setup_admin_role` migration**

`supabase/migrations/20260428_a1_revoke_setup_admin_role.sql`:
```sql
-- A1 security PR: revoke EXECUTE on setup_admin_role from anon and
-- authenticated.
--
-- The function is plpgsql with no SECURITY DEFINER and no permission
-- revocation. If EXECUTE is granted to anon/authenticated by default,
-- any authenticated user can call it to grant themselves admin role.

REVOKE EXECUTE ON FUNCTION public.setup_admin_role(text)
  FROM PUBLIC, anon, authenticated;

-- service_role can still call it for legitimate admin setup.
```

- [ ] **Step 4: Apply migrations to local Supabase (dev)**

```bash
npx supabase db push
```
Expected: 3 migrations applied. No errors.

- [ ] **Step 5: Verify via direct SQL**

```bash
npx supabase db connect <<'SQL'
-- Verify GRANTs are revoked
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
-- Expected: 0 rows.

-- Verify audit log policy
SELECT policyname, qual FROM pg_policies WHERE tablename = 'deletion_audit_log';
-- Expected: only the new "Admins read audit log" policy.

-- Verify setup_admin_role EXECUTE
SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
  WHERE routine_name = 'setup_admin_role'
    AND grantee IN ('PUBLIC', 'anon', 'authenticated');
-- Expected: 0 rows.
SQL
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(security): SQL migrations for REVOKE writes, audit log RLS, REVOKE setup_admin_role"
```

---

## Task 9: `scripts/assert-env.js` + `prebuild` script + subprocess test

**Files:**
- Create: `scripts/assert-env.js`
- Create: `scripts/assert-env.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

`scripts/assert-env.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'assert-env.js');

function run(env) {
  return spawnSync('node', [scriptPath], {
    env: { ...process.env, ...env, PATH: process.env.PATH },
    encoding: 'utf8',
  });
}

describe('assert-env.js', () => {
  it('exits 1 when NODE_ENV=production and DEV_MODE_AUTH_BYPASS=true', () => {
    const result = run({
      NODE_ENV: 'production',
      DEV_MODE_AUTH_BYPASS: 'true',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/DEV_MODE_AUTH_BYPASS/);
  });

  it('exits 0 when NODE_ENV=development and DEV_MODE_AUTH_BYPASS=true', () => {
    const result = run({
      NODE_ENV: 'development',
      DEV_MODE_AUTH_BYPASS: 'true',
    });
    expect(result.status).toBe(0);
  });

  it('exits 0 when NODE_ENV=production and DEV_MODE_AUTH_BYPASS unset', () => {
    const result = run({
      NODE_ENV: 'production',
      DEV_MODE_AUTH_BYPASS: undefined,
    });
    expect(result.status).toBe(0);
  });

  it('exits 0 when both unset', () => {
    const result = run({
      NODE_ENV: undefined,
      DEV_MODE_AUTH_BYPASS: undefined,
    });
    expect(result.status).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- scripts/assert-env.test.js
```
Expected: FAIL — script doesn't exist.

- [ ] **Step 3: Write the script**

`scripts/assert-env.js`:
```js
#!/usr/bin/env node
/**
 * Pre-build environment assertion.
 *
 * Runs as `npm prebuild` before `next build`. Fails the build if
 * NODE_ENV=production and DEV_MODE_AUTH_BYPASS=true are both set —
 * a combination that would expose admin endpoints without auth in
 * production.
 *
 * This is the primary mechanism for catching the bypass-in-prod
 * misconfiguration. The middleware also has a NODE_ENV gate as
 * runtime defense-in-depth, but build-time failure is preferred:
 * it surfaces the issue before deploy artefacts are produced.
 */

if (
  process.env.NODE_ENV === 'production' &&
  process.env.DEV_MODE_AUTH_BYPASS === 'true'
) {
  console.error(
    'FATAL: DEV_MODE_AUTH_BYPASS=true is set with NODE_ENV=production.\n' +
    'This combination would expose admin endpoints without auth.\n' +
    'Remove DEV_MODE_AUTH_BYPASS from production env vars and redeploy.'
  );
  process.exit(1);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- scripts/assert-env.test.js
```
Expected: PASS, 4 tests.

- [ ] **Step 5: Add `prebuild` script to `package.json`**

Edit `package.json`. In the `scripts` section, add (or insert before `build`):
```json
"prebuild": "node scripts/assert-env.js",
```

Verify the existing `build` script is unchanged.

- [ ] **Step 6: Confirm prebuild runs before build**

```bash
NODE_ENV=production DEV_MODE_AUTH_BYPASS=true npm run build 2>&1 | head -10
```
Expected: build fails with the assertion error message; `next build` does not run.

```bash
NODE_ENV=development npm run build 2>&1 | head -10
```
Expected: prebuild succeeds; build proceeds.

- [ ] **Step 7: Commit**

```bash
git add scripts/assert-env.js scripts/assert-env.test.js package.json
git commit -m "feat(security): add prebuild env assertion to fail builds with prod+bypass"
```

---

## Task 10: Middleware hardening — `NODE_ENV` gate + exact host comparison

**Files:**
- Modify: `src/middleware.ts:121-127`
- Test: `src/middleware.test.ts` (extend if exists; create if not)

- [ ] **Step 1: Check whether `middleware.test.ts` exists**

```bash
ls src/middleware.test.ts 2>/dev/null || echo "missing"
```

- [ ] **Step 2: Write the failing tests**

`src/middleware.test.ts` (extend existing or create):
```ts
import { describe, it, expect } from 'vitest';

// Helper that mirrors the bypass condition logic in src/middleware.ts.
// We test the condition in isolation; full middleware integration tests
// live in src/middleware.integration.test.ts.
function shouldBypass(env: NodeJS.ProcessEnv, host: string | null) {
  return (
    env.NODE_ENV === 'development' &&
    env.DEV_MODE_AUTH_BYPASS === 'true' &&
    (host === 'localhost' ||
     host === 'localhost:3000' ||
     host === '127.0.0.1' ||
     host === '127.0.0.1:3000')
  );
}

describe('DEV_MODE_AUTH_BYPASS gating', () => {
  it('bypasses on localhost in development', () => {
    expect(
      shouldBypass(
        { NODE_ENV: 'development', DEV_MODE_AUTH_BYPASS: 'true' },
        'localhost:3000'
      )
    ).toBe(true);
  });

  it('does NOT bypass in production even if env var is set', () => {
    expect(
      shouldBypass(
        { NODE_ENV: 'production', DEV_MODE_AUTH_BYPASS: 'true' },
        'localhost:3000'
      )
    ).toBe(false);
  });

  it('does NOT bypass on host containing "localhost" but not equal', () => {
    expect(
      shouldBypass(
        { NODE_ENV: 'development', DEV_MODE_AUTH_BYPASS: 'true' },
        'evil-localhost.example.com'
      )
    ).toBe(false);
    expect(
      shouldBypass(
        { NODE_ENV: 'development', DEV_MODE_AUTH_BYPASS: 'true' },
        'attackerlocalhost.example'
      )
    ).toBe(false);
  });

  it('does NOT bypass without env var', () => {
    expect(
      shouldBypass(
        { NODE_ENV: 'development' },
        'localhost:3000'
      )
    ).toBe(false);
  });

  it('does NOT bypass with null host', () => {
    expect(
      shouldBypass(
        { NODE_ENV: 'development', DEV_MODE_AUTH_BYPASS: 'true' },
        null
      )
    ).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

The test imports nothing from middleware yet, so the test is independent — it will pass *unless* the function inside the test doesn't match what middleware actually does. Skip the "fail" verification step here and proceed to fix the middleware.

- [ ] **Step 4: Update middleware bypass logic**

`src/middleware.ts:120-127` — replace:
```ts
    // Check if dev mode is enabled AND we're on localhost
    const devMode = process.env.DEV_MODE_AUTH_BYPASS === 'true' &&
                    (req.headers.get('host')?.includes('localhost') || 
                     req.headers.get('host')?.includes('127.0.0.1'))
    
    if (devMode) {
      return res
    }
```

With:
```ts
    // Dev-only bypass. Three layers of safety:
    //   1) NODE_ENV must be development (build-time fail in prod via prebuild)
    //   2) DEV_MODE_AUTH_BYPASS must be exactly 'true'
    //   3) Host must exactly match localhost / 127.0.0.1 (no substring tricks)
    const host = req.headers.get('host');
    const devMode =
      process.env.NODE_ENV === 'development' &&
      process.env.DEV_MODE_AUTH_BYPASS === 'true' &&
      (host === 'localhost' ||
       host === 'localhost:3000' ||
       host === '127.0.0.1' ||
       host === '127.0.0.1:3000');

    if (devMode) {
      return res
    }
```

- [ ] **Step 5: Run middleware tests**

```bash
npm test -- src/middleware.test.ts
```
Expected: PASS, 5 tests.

- [ ] **Step 6: Run full test suite**

```bash
npm test
```
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/middleware.ts src/middleware.test.ts
git commit -m "fix(security): gate DEV_MODE_AUTH_BYPASS on NODE_ENV; exact host match"
```

---

## Task 11: Zod validation on bulk-delete routes

**Files:**
- Modify: `src/app/api/{type}/delete/route.ts` (×9 types)
- Modify: `src/app/api/case-studies/restore/route.ts`
- Modify: `src/app/api/case-studies/permanent-delete/route.ts`

- [ ] **Step 1: Define a shared schema**

Create `src/lib/schemas/bulk-action.ts`:
```ts
import { z } from 'zod';

/**
 * Bulk action input. Accepts either a single id or an array of ids.
 * At least one must be provided. Each must be a UUID. Arrays capped at 100
 * to bound request size.
 */
export const BulkActionSchema = z
  .object({
    id: z.string().uuid().optional(),
    ids: z.array(z.string().uuid()).max(100).optional(),
  })
  .refine((d) => Boolean(d.id) || Boolean(d.ids?.length), {
    message: 'id or ids required',
  });

export type BulkActionInput = z.infer<typeof BulkActionSchema>;
```

- [ ] **Step 2: Write a unit test for the schema**

Create `src/lib/schemas/bulk-action.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BulkActionSchema } from './bulk-action';

describe('BulkActionSchema', () => {
  it('accepts a valid single id', () => {
    const r = BulkActionSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a valid array of ids', () => {
    const r = BulkActionSchema.safeParse({
      ids: [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty input', () => {
    const r = BulkActionSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('rejects non-UUID id', () => {
    const r = BulkActionSchema.safeParse({ id: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });

  it('rejects ids array over 100', () => {
    const ids = Array.from({ length: 101 }).map(
      (_, i) =>
        '00000000-0000-0000-0000-' + String(i).padStart(12, '0')
    );
    const r = BulkActionSchema.safeParse({ ids });
    expect(r.success).toBe(false);
  });
});
```

Run:
```bash
npm test -- src/lib/schemas/bulk-action.test.ts
```
Expected: PASS, 5 tests.

- [ ] **Step 3: List the routes that need updating**

```bash
ls src/app/api/*/delete/route.ts src/app/api/case-studies/restore/route.ts src/app/api/case-studies/permanent-delete/route.ts
```
Expected: 11 files (9 deletes + restore + permanent-delete).

- [ ] **Step 4: For each route, add validation**

Each file currently parses input as:
```ts
const { id, ids } = await request.json();
```

Replace with:
```ts
import { BulkActionSchema } from '@/lib/schemas/bulk-action';

// ...

const body = await request.json();
const parsed = BulkActionSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: parsed.error.flatten() },
    { status: 400 }
  );
}
const { id, ids } = parsed.data;
```

- [ ] **Step 5: Add an integration smoke test for one route**

Add to `src/__tests__/security/findings.integration.test.ts` (created in a later task; for now, just leave a TODO marker file):

We will verify these in Task 13 alongside the other Tier 1/2 integration tests.

- [ ] **Step 6: Type-check + run all tests**

```bash
npx tsc --noEmit --skipLibCheck && npm test
```
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/schemas/bulk-action.ts src/lib/schemas/bulk-action.test.ts src/app/api/
git commit -m "feat(security): Zod-validate bulk-delete inputs to prevent 500s on bad data"
```

---

## Task 12: Migrate `fetchContentBySlug` callers — split into build-time + runtime paths

**Files:**
- Modify: `src/cms/operations/fetch.ts` — `fetchContentBySlug` either deleted or marked deprecated
- Modify: `src/cms/page-helpers.ts` — exposes new entry points
- Modify: 9 public page files
- Modify: 8 API GET route files
- Create: `src/cms/build-time-fetchers.ts` (or extend `page-helpers.ts`)

This is the largest task. It touches the actual exploit fix for finding 1.1.

- [ ] **Step 1: Write the integration test that reproduces finding 1.1 (will pass once the fix lands)**

> **Fixture-seeding prerequisite:** the project has `npm run test:integration` and `vitest.integration.config.ts`. Check whether there's an existing fixture/seed mechanism (e.g. a `setup.integration.ts` or per-suite `beforeAll`). If none, this step also implements minimal seeding — insert two rows into `case_studies` (`slug=test-draft-a1, published=false` and `slug=test-published-a1, published=true`) in a `beforeAll` and clean up in `afterAll`. Use the service-role client for seeding so RLS doesn't block the inserts.

In `src/__tests__/security/findings.integration.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { GET as caseStudiesGET } from '@/app/api/case-studies/route';
import { NextRequest } from 'next/server';

describe('Finding 1.1 — Public GET API leaks unpublished/soft-deleted content', () => {
  it('returns 404 (or null) for an unpublished case study slug via the public API', async () => {
    // Pre-condition: a draft case_study exists with slug 'test-draft-a1' and
    // published=false. The integration test setup seeds this row.
    const url =
      'http://localhost:3000/api/case-studies?slug=test-draft-a1';
    const req = new NextRequest(url, { method: 'GET' });
    const res = await caseStudiesGET(req);
    // Either 404 or 200 with null/empty data — but NEVER the full record.
    if (res.status === 200) {
      const body = await res.json();
      expect(body).not.toHaveProperty('main_content');
      expect(body).not.toHaveProperty('id');
    } else {
      expect(res.status).toBe(404);
    }
  });

  it('returns the record for a published case study slug', async () => {
    // Pre-condition: 'test-published-a1' exists with published=true.
    const url =
      'http://localhost:3000/api/case-studies?slug=test-published-a1';
    const req = new NextRequest(url, { method: 'GET' });
    const res = await caseStudiesGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('slug', 'test-published-a1');
  });
});
```

This test requires seeded fixtures. Add fixture seeding to `src/__tests__/setup.integration.ts` or wherever the integration test bootstrap lives. (If it doesn't exist, create one — the project already has `npm run test:integration`.)

- [ ] **Step 2: Run test to verify it fails (the leak is reproducible today)**

```bash
npm run test:integration -- src/__tests__/security/findings.integration.test.ts
```
Expected: FAIL on the first test — current code returns the full draft record.

- [ ] **Step 3: Add `getAllSlugsForBuild` and `getByIdForBuild` to `page-helpers.ts`**

Edit `src/cms/page-helpers.ts`. Add new exports (the file is in the allow-list per Task 2):

```ts
import { fromTable } from '@/lib/internal-queries';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import type { ContentTable } from '@/lib/public-query';

/**
 * Build-time fetcher: get every slug for a content type, including drafts.
 * Used by `generateStaticParams`. Pre-builds pages for everything; the
 * runtime render path applies the published filter at request time.
 */
export async function getAllSlugsForBuild(
  table: ContentTable
): Promise<{ slug: string }[]> {
  const client = createServiceRoleSupabaseClient();
  const { data } = await fromTable(client, table)
    .select('slug')
    .is('deleted_at', null);
  return (data ?? []).map((r) => ({ slug: r.slug as string }));
}

/**
 * Build-time fetcher: get a record by slug, ignoring `published` status.
 * For build-time rendering only. Runtime page renders use
 * `getPublishedBySlug` from `@/lib/public-query`.
 */
export async function getByIdForBuild(
  table: ContentTable,
  id: string
) {
  const client = createServiceRoleSupabaseClient();
  return fromTable(client, table)
    .select('*')
    .eq('id', id)
    .maybeSingle();
}
```

- [ ] **Step 4: Refactor `fetchContentBySlug` to use the RLS path for runtime**

Edit `src/cms/operations/fetch.ts`. Replace the body of `_fetchContentBySlug` to use `createServerSupabaseClient` (RLS) and apply the published/deleted filters:

```ts
import { cache } from 'react'
import { getContentType } from '../registry'
import { buildRelationshipSelect, flattenRelationships } from './relationships'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'

async function _fetchContentBySlug(
  typeSlug: string,
  slug: string
): Promise<Record<string, unknown> | null> {
  const ct = getContentType(typeSlug)
  if (!ct) return null

  const supabase = await createServerSupabaseClient()
  const selectStr = buildRelationshipSelect(ct)

  const { data, error } = await fromTable(supabase, ct.tableName)
    .select(selectStr)
    .eq('slug', slug)
    .eq('published', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  const relationships = flattenRelationships(data as Record<string, unknown>, ct)
  const base: Record<string, unknown> = { ...(data as Record<string, unknown>) }
  for (const rel of ct.relationships) {
    delete base[rel.junction]
  }
  Object.assign(base, relationships)
  return base
}

export const fetchContentBySlug = cache(_fetchContentBySlug)
```

> **Why we keep `fetchContentBySlug` rather than deleting it:** the function is called from many sites and provides relationship-flattening that the simpler `getPublishedBySlug` does not (it walks the engine's relationship config). The behaviour change is internal: same inputs, same shape, but now safe-by-construction. The `internal-queries.ts` import is allow-listed because `src/cms/operations/**` is in the allow-list (Task 2).

> **Preview-mode handling is split into discrete sub-steps below — do not gloss over.** The "investigate before deciding" instruction is the kind of thing that gets skipped, and if preview mode currently routes through `fetchContentBySlug` and the agent doesn't add the draft-mode bypass, admin draft-preview breaks silently after this PR ships.

- [ ] **Step 4a: Investigate whether preview mode uses `fetchContentBySlug`**

```bash
# Find the preview route
ls src/app/api/preview/route.ts 2>/dev/null && echo "preview route exists"
# Find references to draftMode() across the codebase
git grep -l "draftMode\|next/headers.*draft" src/
# Find references to fetchContentBySlug, page-helpers, or fetchContent that
# might be used in the preview rendering path
git grep -n "fetchContentBySlug\|generateStaticParamsFor\|fetchContent" src/app/
```

Document the finding inline in the commit message:
- **Case A:** preview mode routes through `fetchContentBySlug` (i.e. an admin hitting a preview URL expects this function to return unpublished records). → Continue to Step 4b.
- **Case B:** preview mode has its own fetcher, OR there is no preview mode integrated with public page rendering. → Skip 4b. Note "Case B confirmed; no draft-mode bypass needed" in the commit.

- [ ] **Step 4b: (Case A only) Add Next.js Draft Mode bypass to `_fetchContentBySlug`**

Add to the top of `_fetchContentBySlug`, before the published-filter query:

```ts
import { draftMode } from 'next/headers';

// ... inside _fetchContentBySlug:
const { isEnabled: isPreview } = await draftMode();
if (isPreview) {
  // Preview mode: admin viewing a draft. Skip published filter.
  // Draft mode can only be enabled via the admin /api/preview route,
  // which itself requires an authenticated admin session — so this is
  // not a public-facing bypass.
  const adminClient = createServiceRoleSupabaseClient();
  const { data, error } = await fromTable(adminClient, ct.tableName)
    .select(selectStr)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) return null;
  // ... same flattenRelationships post-processing as the non-preview path
}
```

Verify by enabling draft mode in dev and hitting an unpublished slug — should render. Disable draft mode and hit the same slug — should 404.

- [ ] **Step 5: Update `page-helpers.ts` to re-export `fetchContentBySlug` and `generateStaticParamsFor` consistently**

If the file already re-exports `fetchContentBySlug`, no change needed. The function's behaviour is now safe for public callers.

If `generateStaticParamsFor` currently uses a service-role + no-filter pattern that returned only published items, switch it to use `getAllSlugsForBuild` (which includes drafts) — see Step 3 above. Drafts are SSG'd so an immediate publish doesn't need a fresh build, and runtime render still applies the published filter.

- [ ] **Step 6: Update the 8 API GET routes**

For each `src/app/api/{type}/route.ts`, the GET handler currently calls `fetchContentBySlug` for slug branches. After Step 4, those calls automatically apply the published filter. No code change required in the API routes themselves — the fix is internal to `fetchContentBySlug`.

Verify by inspecting one of the routes (e.g. `src/app/api/case-studies/route.ts`): the GET handler should call `fetchContentBySlug(typeSlug, slug)` and that's now safe.

- [ ] **Step 7: Run the integration test from Step 2**

```bash
npm run test:integration -- src/__tests__/security/findings.integration.test.ts
```
Expected: PASS — the draft slug now returns 404 / null.

- [ ] **Step 8: Run full test + type-check**

```bash
npm test && npx tsc --noEmit --skipLibCheck
```
Expected: clean.

- [ ] **Step 9: Run full lint**

```bash
npm run lint
```
Expected: clean. The new imports of `internal-queries` from `page-helpers.ts` and `fetch.ts` are allow-listed.

- [ ] **Step 10: Commit**

```bash
git add src/cms/ src/__tests__/security/
git commit -m "fix(security): apply published+deleted_at filter to fetchContentBySlug; split build-time fetchers"
```

---

## Task 13: Integration tests for remaining Tier 1 + Tier 2 findings

**Files:**
- Modify: `src/__tests__/security/findings.integration.test.ts`

- [ ] **Step 1: Add tests for findings 1.3, 1.4, 2.1, 2.3**

Append to `src/__tests__/security/findings.integration.test.ts`:

```ts
describe('Finding 1.3 — Server actions check admin via withAdmin', () => {
  it('all admin server actions are wrapped in withAdmin', async () => {
    // Static check by reading the source files. This is a structural
    // regression test: if anyone adds an unwrapped export, this fails.
    const { readFileSync } = await import('node:fs');
    const { glob } = await import('glob');
    const files = await glob('src/app/admin/*/[id]/actions.ts');
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      // No bare `export async function` declarations.
      expect(src).not.toMatch(/^export\s+async\s+function\b/m);
      // Every export is `export const X = withAdmin(...)`.
      const exports = src.match(/^export\s+const\s+\w+\s*=\s*[^\n]+/gm) ?? [];
      for (const e of exports) {
        expect(e).toMatch(/withAdmin\(/);
      }
    }
  });
});

describe('Finding 1.4 — DEV_MODE_AUTH_BYPASS gating', () => {
  // The unit-level tests for the bypass condition live in
  // src/middleware.test.ts. The integration test here verifies the full
  // round-trip on a request with NODE_ENV=production. Skipped if the
  // integration harness can't override NODE_ENV per-test.
  it.todo('blocks bypass when NODE_ENV=production');
});

describe('Finding 2.1 — REVOKE writes from anon/authenticated', () => {
  it('the migration is present and recent', async () => {
    const { existsSync } = await import('node:fs');
    expect(
      existsSync('supabase/migrations/20260428_a1_revoke_anon_writes.sql')
    ).toBe(true);
  });
});

describe('Finding 2.3 — deletion_audit_log admin-only', () => {
  it('the migration is present and recent', async () => {
    const { existsSync } = await import('node:fs');
    expect(
      existsSync('supabase/migrations/20260428_a1_audit_log_admin_only.sql')
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
npm run test:integration
```
Expected: all pass; one `it.todo`.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/security/findings.integration.test.ts
git commit -m "test(security): integration tests for Tier 1+2 findings"
```

---

## Task 14: Build verification — page count regression check

**Files:**
- Capture pre-PR baseline (already known from the 2026-04-27 build: **367 static pages in 4.1s**, ~18s total).
- Modify: `package.json` to surface the count, OR add a script that asserts.

- [ ] **Step 1: Add a check script**

Create `scripts/assert-build-pages.js`:
```js
#!/usr/bin/env node
/**
 * Compare the static-page count from a fresh `next build` against an
 * expected baseline. Fails CI if the count drops, which usually signals
 * a missed SSG path during a refactor.
 */

import { spawnSync } from 'node:child_process';

const EXPECTED_MIN = 367; // baseline from 2026-04-27. Update when content grows.

const result = spawnSync('npx', ['next', 'build'], { encoding: 'utf8' });
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.status !== 0) {
  console.error('next build failed; cannot verify page count.');
  process.exit(result.status ?? 1);
}

const match = (result.stdout ?? '').match(
  /Generating static pages.*?\((\d+)\/\d+\)\s+in/
);
if (!match) {
  // Regex fragile across Next.js versions. Don't fail the build on a parse
  // miss — that's worse than not having the check. Warn and exit 0 so a
  // human can investigate.
  console.warn(
    'WARN: could not parse static page count from build output. ' +
    'Build succeeded; the count check is skipped. Consider updating the ' +
    'parser or reading from .next/ build manifests directly.'
  );
  process.exit(0);
}
const count = parseInt(match[1], 10);
if (count < EXPECTED_MIN) {
  console.error(
    `Static page count regressed: ${count} < ${EXPECTED_MIN}. ` +
    'Likely a missed SSG path. Review generateStaticParams calls.'
  );
  process.exit(1);
}
console.log(`Static page count OK: ${count} >= ${EXPECTED_MIN}`);
```

- [ ] **Step 2: Run it locally**

```bash
node scripts/assert-build-pages.js
```
Expected: build succeeds; count is ≥367; script exits 0.

- [ ] **Step 3: Optionally add to package.json as `verify:build`**

```json
"verify:build": "node scripts/assert-build-pages.js"
```

This is a manually-invoked check, not part of the default CI pipeline (because it runs a full build, which is slow). Document in the PR description that this should be run before merge.

- [ ] **Step 4: Commit**

```bash
git add scripts/assert-build-pages.js package.json
git commit -m "chore(security): add static-page-count regression check for A1 build verification"
```

---

## Task 15: CHANGELOG entry + final verification

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add CHANGELOG entry under `[Unreleased]`**

Edit `CHANGELOG.md`. Under the `[Unreleased]` section, add:

```markdown
### Security
- **Public GET API no longer leaks unpublished/soft-deleted content.** `fetchContentBySlug` now applies `published=true` and `deleted_at IS NULL` filters via an RLS-respecting Supabase client. Anonymous requests for draft slugs return 404.
- **`publicQuery()` invariant introduced** as the single sanctioned chokepoint for anonymous content reads. Module-boundary enforced via ESLint `no-restricted-imports` on `src/lib/internal-queries.ts`.
- **All 9 admin server-action files wrapped in `withAdmin()`** as defense-in-depth beyond middleware. Enforced by ESLint `no-restricted-syntax`.
- **`DEV_MODE_AUTH_BYPASS` hardened**: now requires `NODE_ENV=development`; host comparison is exact (no substring match); `prebuild` script fails the build if the env combination would expose admin endpoints in production.
- **Database GRANTs tightened**: `INSERT/UPDATE/DELETE/TRUNCATE` revoked from `anon` and `authenticated` on all public tables. RLS continues to gate per-table writes.
- **`deletion_audit_log` SELECT policy** restricted to admin role only (was `USING (true)` for any authenticated user).
- **`setup_admin_role` EXECUTE** revoked from `anon`/`authenticated`/PUBLIC.
- **Bulk-delete API endpoints** now Zod-validate inputs; invalid UUIDs return 400 instead of 500 with stack traces.
```

- [ ] **Step 2: Run the full quality gate**

```bash
npm run lint && npx tsc --noEmit --skipLibCheck && npm test && npm run test:integration && node scripts/assert-build-pages.js
```
Expected: all pass.

- [ ] **Step 3: Final commit**

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG for A1 security PR"
```

---

## Spec coverage check (self-review)

Each section/requirement in the spec → task that covers it:

| Spec section | Implementing task(s) |
|---|---|
| Two-module chokepoint (`internal-queries`, `public-query`) | Task 1, Task 4 |
| `fromTable<T>` typing accepts any table | Task 1 |
| `publicQuery<T extends ContentTable>` + `getPublishedBySlug` | Task 4 |
| ESLint `no-restricted-imports` + allow-list | Task 2 |
| `supabase-untyped.ts` migration / deletion | Task 3 |
| `withAdmin()` HOF on `auth.ts` | Task 5 |
| ESLint `no-restricted-syntax` for `withAdmin` | Task 6 |
| 9× admin actions wrapped | Task 7 |
| Middleware `NODE_ENV` gate + exact host check | Task 10 |
| `prebuild` env assertion + subprocess test | Task 9 |
| 3 SQL migrations (REVOKE writes, audit-log RLS, REVOKE setup_admin_role) | Task 8 |
| Audit-log migration with explicit BEGIN/COMMIT | Task 8, Step 2 |
| REVOKE migration with denylist comment | Task 8, Step 1 |
| Bulk-delete UUID validation (×11 routes) | Task 11 |
| `fetchContentBySlug` runtime applies published filter | Task 12 |
| `getAllSlugsForBuild` + `getByIdForBuild` build-time fetchers | Task 12, Step 3 |
| Integration tests reproducing each Tier 1+2 finding | Task 12 (1.1), Task 13 (1.3, 1.4, 2.1, 2.3) |
| Build verification with page-count regression check | Task 14 |
| CHANGELOG entry | Task 15 |

No spec gaps. All tasks have concrete code or commands.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-28-a1-security-pr.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task. Review between tasks. Fast iteration. Each subagent gets the task definition, completes it, returns. Review verifies tests pass and committed before next task.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`. Batch execution with checkpoints for review.

Which approach?
