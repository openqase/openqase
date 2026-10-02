# Build Fail-Loud Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A database failure during a production build or production ISR regeneration must fail loudly (build error / stale page kept / Sentry event) instead of silently producing an empty site, and the Vercel production build must refuse to deploy if the static page count collapses.

**Architecture:** One helper, `reportContentQueryError(context, error)` in `src/cms/page-helpers.ts`, is the single policy point: it logs, captures to Sentry, and throws when `VERCEL_ENV === 'production'` (Vercel sets this at build and runtime; CI and local builds never set it, so their stub-DB builds keep today's empty-fallback behaviour). The build-time slug fetcher, the sitemap, and the public list fetcher call it. `scripts/assert-build-pages.js` stops re-running `next build` and instead counts routes in `.next/prerender-manifest.json`, and `vercel.json` runs it after the build.

**Tech Stack:** Next.js 16 (Turbopack), Supabase JS, @sentry/nextjs, Vitest, Vercel.

**Spec:** `docs/superpowers/plans/2026-10-01-review-fixes-roadmap.md` row 4.

## Global Constraints

- Branch `fix/build-fail-loud` from `main`. CHANGELOG hunks may conflict with other open PRs; expected.
- Every commit must leave `npm test`, `npm run typecheck`, `npm run lint` (0 errors) green; `npm run build` before the PR (locally `VERCEL_ENV` is unset, so the build must still succeed with the fallback path).
- Behaviour when `VERCEL_ENV` is not `'production'` must be unchanged: errors logged, empty arrays returned.
- `scripts/assert-build-pages.js` must exit 0 when the manifest cannot be read in a non-production environment and must never run `next build` itself.
- Commit messages: conventional, no attribution footer. Do not push or open the PR without the user's go-ahead.

## Review Focus

1. `generateStaticParamsFor` with a query error and `VERCEL_ENV=production` must throw with the type slug in the message — Task 1 test.
2. The same call with `VERCEL_ENV` unset must return `[]` (CI/local behaviour) — Task 1 test.
3. The sitemap with one failing table in production must throw rather than emit a sitemap missing that type — Task 2 test.
4. `countPrerenderedRoutes` must count only static routes from `routes`, not `dynamicRoutes` — Task 3 test.
5. `getStaticContentList` on error in production must throw (ISR keeps the previous page) and otherwise return `[]` — Task 1 test on the helper plus a direct call-site check in Task 1 Step 4.

---

### Task 1: The policy helper, used by the slug fetcher and the public list fetcher

**Files:**
- Modify: `src/cms/page-helpers.ts:1-47`
- Modify: `src/lib/content-fetchers.ts:56-61` (the error branch of `getStaticContentList`)
- Modify: `src/cms/page-helpers.test.ts`

**Interfaces:**
- Produces: `reportContentQueryError(context: string, error: { message: string } | null | undefined): void` — no-op when `error` is falsy; otherwise `console.error`, `Sentry.captureException`, and `throw new Error(\`${context}: ${error.message}\`)` when `process.env.VERCEL_ENV === 'production'`.
- Removes: `getAllSlugsForBuild` and `getByIdForBuild` (no importers anywhere in `src`; confirmed by grep before writing this plan).

- [ ] **Step 1: Write the failing tests**

`src/cms/page-helpers.test.ts` already mocks `@/lib/supabase-server`, `next/cache`, `next/headers` and `react`. Add a Sentry mock next to them at the top of the file:

```ts
const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...args: unknown[]) => captureException(...args) }))
```

Change the import line to also pull the helper:

```ts
const { generateStaticParamsFor, generateMetadataFor, reportContentQueryError } = await import('./page-helpers')
```

Add a new `describe` block:

```ts
describe('reportContentQueryError', () => {
  const ORIGINAL = process.env.VERCEL_ENV
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = ORIGINAL
    vi.restoreAllMocks()
  })

  it('does nothing when there is no error', () => {
    expect(() => reportContentQueryError('x', null)).not.toThrow()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('logs and reports but does not throw outside production', () => {
    delete process.env.VERCEL_ENV
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => reportContentQueryError('industries slugs', { message: 'boom' })).not.toThrow()
    expect(log).toHaveBeenCalled()
    expect(captureException).toHaveBeenCalledTimes(1)
  })

  it('throws in Vercel production so a build or ISR regeneration fails instead of shipping empty', () => {
    process.env.VERCEL_ENV = 'production'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => reportContentQueryError('industries slugs', { message: 'boom' })).toThrow(/industries slugs: boom/)
  })
})
```

And inside the existing `describe('generateStaticParamsFor')`:

```ts
  it('returns [] on a query error outside production', async () => {
    delete process.env.VERCEL_ENV
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockIs.mockReturnValueOnce({ data: null, error: { message: 'db down' } })
    const params = await generateStaticParamsFor('industries')()
    expect(params).toEqual([])
  })

  it('throws on a query error in Vercel production', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockIs.mockReturnValueOnce({ data: null, error: { message: 'db down' } })
    await expect(generateStaticParamsFor('industries')()).rejects.toThrow(/industries/)
    delete process.env.VERCEL_ENV
  })
```

(`afterEach` is imported from vitest; add it to the existing import line. The existing `generateStaticParamsFor` tests return data from `mockIs` already — if the branch you are on predates PR #253 and they return from `mockEq`, keep whichever chain the file uses and mirror it in the new tests.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/page-helpers.test.ts`
Expected: FAIL — `reportContentQueryError` is not exported; the production-throw test fails.

- [ ] **Step 3: Implement**

Replace the top of `src/cms/page-helpers.ts` (imports through `getByIdForBuild`) with:

```ts
import * as Sentry from '@sentry/nextjs'
import { getContentType } from './registry'
import { fetchContentBySlug } from './operations'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'

/**
 * Single policy for content queries that feed static generation, ISR
 * regeneration and the sitemap. Outside Vercel production (local, CI with a
 * stub database, preview) a failure is logged and the caller falls back to an
 * empty result, as before. In Vercel production the error is thrown so that a
 * build fails instead of shipping a site with zero pages, and an ISR
 * regeneration keeps serving the previous page instead of replacing it with
 * an empty list. Every path also reports to Sentry.
 */
export function reportContentQueryError(
  context: string,
  error: { message: string } | null | undefined
): void {
  if (!error) return
  console.error(`[content] ${context}: ${error.message}`)
  Sentry.captureException(new Error(`${context}: ${error.message}`))
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error(`${context}: ${error.message}`)
  }
}

export function generateStaticParamsFor(typeSlug: string) {
  return async function generateStaticParams() {
    const ct = getContentType(typeSlug)
    if (!ct) return []

    const supabase = createServiceRoleSupabaseClient()
    const { data, error } = await fromTable(supabase, ct.tableName)
      .select('slug')
      .eq('published', true)
      .is('deleted_at', null)

    reportContentQueryError(`${typeSlug} slugs for static generation`, error)
    return (data ?? []).map((item: { slug: string }) => ({ slug: item.slug }))
  }
}
```

Delete the `getAllSlugsForBuild` and `getByIdForBuild` functions and the now-unused `ContentTable` import. Keep `generateMetadataFor` and everything after it unchanged. If the branch predates PR #253 and the `.is('deleted_at', null)` line is not there yet, add it (the test chain `select → eq → is` expects it).

In `src/lib/content-fetchers.ts`, import the helper (`import { reportContentQueryError } from '@/cms/page-helpers'`) and replace the error branch of `getStaticContentList`:

```ts
  const { data, error } = await query;

  // Logs + Sentry everywhere; throws only in Vercel production so an ISR
  // regeneration keeps the previous page rather than replacing it with [].
  reportContentQueryError(`${contentType} list`, error);
  if (error) return [];
```

Check for an import cycle: `page-helpers.ts` imports `./operations` and `content-fetchers.ts` is imported by pages, not by `page-helpers`. If `tsc` or vitest reports a circular import, move `reportContentQueryError` to a new file `src/cms/query-errors.ts` and import it from both places instead (update the test import accordingly).

- [ ] **Step 4: Verify**

Run: `npx vitest run src/cms/page-helpers.test.ts && npm run typecheck && npm run lint`
Expected: all pass; tsc clean (removing the two unused helpers breaks nothing); lint 0 errors. Then `grep -rn "getAllSlugsForBuild\|getByIdForBuild" src` → nothing.

- [ ] **Step 5: Commit**

```bash
git add src/cms/page-helpers.ts src/cms/page-helpers.test.ts src/lib/content-fetchers.ts
git commit -m "fix(build): fail loudly on content query errors in production"
```

---

### Task 2: Sitemap uses the same policy

**Files:**
- Modify: `src/app/sitemap.ts:52-60`
- Modify: `src/app/sitemap.test.ts`

- [ ] **Step 1: Write the failing test**

`src/app/sitemap.test.ts` has an in-memory `makeBuilder(table)` whose `then` resolves `{ data, error: null }`. Add a module-level switch and an error path:

```ts
let failingTable: string | null = null
```

and in `makeBuilder`'s `then`, before computing `data`:

```ts
      if (table === failingTable) {
        return Promise.resolve({ data: null, error: { message: 'db down' } }).then(resolve)
      }
```

Add a Sentry mock next to the Supabase mock:

```ts
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
```

Then add tests (inside the existing top-level `describe`, after the others):

```ts
  it('throws in Vercel production when any content table query fails', async () => {
    process.env.VERCEL_ENV = 'production'
    failingTable = 'industries'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(sitemap()).rejects.toThrow(/industries/)
    } finally {
      delete process.env.VERCEL_ENV
      failingTable = null
      vi.restoreAllMocks()
    }
  })

  it('omits the failing type but still returns the rest outside production', async () => {
    failingTable = 'industries'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const entries = await sitemap()
      expect(entries.some((e) => e.url.includes('/paths/industry/'))).toBe(false)
      expect(entries.some((e) => e.url.endsWith('/paths/industry'))).toBe(true)
    } finally {
      failingTable = null
      vi.restoreAllMocks()
    }
  })
```

(Check how the existing tests obtain `sitemap` — they import the default export after the mocks; reuse the same binding. If the existing tests seed `tables` in a `beforeEach`, these two run with that seed.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: production test FAILS (no throw).

- [ ] **Step 3: Implement**

In `src/app/sitemap.ts`, import the helper and check the error per table:

```ts
import { reportContentQueryError } from '@/cms/page-helpers'
```

```ts
  const results = await Promise.all(
    contentTypes.map(async (ct) => {
      const { data, error } = await supabase
        .from(ct.tableName as ContentTable)
        .select('slug, updated_at')
        .eq('published', true)
        .is('deleted_at', null)
      reportContentQueryError(`${ct.slug} sitemap rows`, error)
      return { ct, rows: (data ?? []) as Array<{ slug: string | null; updated_at: string | null }> }
    })
  )
```

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/app/sitemap.test.ts && npm run typecheck`
Expected: all pass.

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "fix(sitemap): fail loudly on query errors in production"
```

---

### Task 3: Page-count guard from the build manifest, run on Vercel

**Files:**
- Modify: `scripts/assert-build-pages.js` (whole file)
- Create: `scripts/assert-build-pages.test.js`
- Modify: `vercel.json` (add `buildCommand`)

**Interfaces:**
- Produces: `countPrerenderedRoutes(manifest: { routes?: Record<string, unknown> }): number` exported from the script; CLI behaviour: reads `.next/prerender-manifest.json`, exits 1 when count < `EXPECTED_MIN` and `VERCEL_ENV === 'production'`, exits 0 with a warning otherwise.

- [ ] **Step 1: Write the failing test**

```js
// scripts/assert-build-pages.test.js
import { describe, it, expect } from 'vitest'
import { countPrerenderedRoutes, EXPECTED_MIN } from './assert-build-pages.js'

describe('countPrerenderedRoutes', () => {
  it('counts static routes only, ignoring dynamic route patterns', () => {
    const manifest = {
      routes: { '/': {}, '/about': {}, '/case-study/a': {} },
      dynamicRoutes: { '/case-study/[slug]': {} },
    }
    expect(countPrerenderedRoutes(manifest)).toBe(3)
  })

  it('returns 0 for a manifest with no routes', () => {
    expect(countPrerenderedRoutes({})).toBe(0)
  })

  it('has a floor below the current production count but far above an empty site', () => {
    expect(EXPECTED_MIN).toBeGreaterThan(200)
    expect(EXPECTED_MIN).toBeLessThanOrEqual(340)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/assert-build-pages.test.js`
Expected: FAIL — importing the script runs `next build` / exports nothing.

- [ ] **Step 3: Rewrite the script**

```js
#!/usr/bin/env node
/**
 * Post-build guard: count the statically prerendered routes in
 * .next/prerender-manifest.json and fail if the count collapsed. A database
 * outage at build time otherwise yields a green build with almost no pages.
 *
 * Runs after `next build` (see vercel.json buildCommand, and `npm run
 * verify:build`). Never runs the build itself.
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Static routes on 2026-10-01: 340. Floor leaves headroom for content removal
// while catching a collapse. Raise when content grows.
export const EXPECTED_MIN = 300

export function countPrerenderedRoutes(manifest) {
  return Object.keys(manifest?.routes ?? {}).length
}

function main() {
  const strict = process.env.VERCEL_ENV === 'production'
  let manifest
  try {
    manifest = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'))
  } catch (err) {
    const msg = `could not read .next/prerender-manifest.json (${err.message})`
    if (strict) { console.error(`ERROR: ${msg}`); process.exit(1) }
    console.warn(`WARN: ${msg}; page-count check skipped.`)
    process.exit(0)
  }
  const count = countPrerenderedRoutes(manifest)
  if (count < EXPECTED_MIN) {
    const msg = `static page count ${count} is below the floor ${EXPECTED_MIN} — likely a content query failure during the build`
    if (strict) { console.error(`ERROR: ${msg}`); process.exit(1) }
    console.warn(`WARN: ${msg} (not failing outside Vercel production)`)
    process.exit(0)
  }
  console.log(`Static page count OK: ${count} >= ${EXPECTED_MIN}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
```

`vercel.json` — add at the top level (keep the existing `headers` array):

```json
  "buildCommand": "npm run build && npm run verify:build",
```

`package.json` `verify:build` already runs `node scripts/assert-build-pages.js`; leave it.

- [ ] **Step 4: Verify**

Run: `npx vitest run scripts/assert-build-pages.test.js && npm run lint`
Expected: 3 passed; lint 0 errors (the script is ESM; if eslint flags `import.meta` or the `.js` extension, follow the repo's existing `scripts/*.js` lint config rather than disabling rules inline). Then after `npm run build` (Task 4) run `npm run verify:build` and confirm it prints `Static page count OK: 340 >= 300`.

- [ ] **Step 5: Commit**

```bash
git add scripts/assert-build-pages.js scripts/assert-build-pages.test.js vercel.json
git commit -m "chore(build): guard static page count from the prerender manifest on Vercel"
```

---

### Task 4: CHANGELOG and gates

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: CHANGELOG**

Under `### Fixed`:

```markdown
- **Silent empty builds**: A database error while listing content for static generation, the sitemap or a public list now fails the Vercel production build (or keeps the previous page during ISR regeneration) and reports to Sentry, instead of producing a green build with no pages. Local and CI builds keep the empty fallback.
```

Under `### Added`:

```markdown
- **Static page-count guard**: Vercel production builds run `npm run verify:build`, which fails the deploy if the prerendered route count drops below a floor.
```

Under `### Removed`:

```markdown
- Unused build helpers `getAllSlugsForBuild` and `getByIdForBuild` from `src/cms/page-helpers.ts`.
```

- [ ] **Step 2: Gates**

Run: `npm test && npm run typecheck && npm run lint && npm run build && npm run verify:build`
Expected: all green; build 383 pages; verify prints `Static page count OK: 340 >= 300`.

- [ ] **Step 3: Commit, stop, report**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for fail-loud build guards"
```

Do not push. Report branch, commit list and gate output.
