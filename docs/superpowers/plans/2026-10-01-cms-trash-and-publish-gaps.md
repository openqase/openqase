# CMS Trash & Publish Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the verified correctness gaps left by PR #243 and #250 in one small PR: trashed rows hidden from every admin list, creates that survive a relationship failure keep their id, bulk publish goes through the single publish path, and four unguarded inputs stop crashing or mis-rendering pages.

**Architecture:** All fixes stay inside the existing layers. The operations layer (`src/cms/operations/*`) gains a `warning` field so "row saved, links failed" is distinguishable from "row not saved". Admin list pages get the same `deleted_at` filter the case-studies page already has. Public pages share one null-safe date formatter. No new abstractions beyond a 10-line helper.

**Tech Stack:** Next.js 16 App Router, Supabase JS, Vitest (node environment, `renderToStaticMarkup` for components), TypeScript.

**Spec:** `docs/superpowers/plans/2026-10-01-review-fixes-roadmap.md` row 1, which summarises the verified findings from the 2026-10-01 review.

## Global Constraints

- Branch from `main` at e65bebe or later: `git checkout -b fix/cms-trash-and-publish-gaps`.
- Every commit must leave `npm test`, `npm run typecheck`, `npm run lint` green. `npm run build` must pass before the PR is opened.
- No `supabase db push`, no SQL changes in this PR. (Trigger idempotency is roadmap row 6.)
- Follow CLAUDE.md: all deletes/publishes go through `src/cms/operations`; service-role client only in server code.
- Commit messages: conventional, no attribution footer. Do not push or open the PR without the user's go-ahead.
- Add CHANGELOG entries under `[Unreleased]` → `### Fixed` as part of the final task.

## Review Focus

Inputs the spec implies but no existing test exercises; each has a pinned test in the task that owns the code:

1. A soft-deleted algorithm (`deleted_at` set, `published=false`) must not appear in `/admin/algorithms` — Task 1.
2. A create where the row inserts but a junction insert fails must still return the new row's id and no `error` — Task 2.
3. Bulk publish of 3 ids where one is trashed must publish the other 2 and report the failure, never write `published` directly — Task 3.
4. A related case study with `published_at = null` must render without "01/01/1970" — Task 4.
5. A `?secret=` of equal character length but different byte length must return 401, not throw — Task 7.

---

### Task 1: Hide trashed rows from the eight admin list pages

**Files:**
- Modify: `src/app/admin/algorithms/page.tsx:18-21`
- Modify: `src/app/admin/blog/page.tsx:9-13`
- Modify: `src/app/admin/industries/page.tsx:16-19`
- Modify: `src/app/admin/personas/page.tsx:16-19`
- Modify: `src/app/admin/partner-companies/page.tsx:18-21`
- Modify: `src/app/admin/quantum-companies/page.tsx:18-21`
- Modify: `src/app/admin/quantum-hardware/page.tsx:18-21`
- Modify: `src/app/admin/quantum-software/page.tsx:18-21`
- Create: `src/app/admin/admin-list-pages.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing; behavioural fix only.

- [ ] **Step 1: Write the failing test**

This follows the source-text style already used in `src/__tests__/security/findings.test.ts` (Finding 1.3), because the admin pages import heavy client components that cannot be rendered under the node test environment.

```ts
// src/app/admin/admin-list-pages.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { contentTypes } from '@/cms/registry'

/**
 * Every admin list page must hide soft-deleted rows; those live in the
 * per-type trash page instead. Soft delete also sets published=false, so a
 * missing filter makes a "deleted" item reappear in the main list as a draft.
 */
describe('admin list pages hide trashed rows', () => {
  for (const ct of contentTypes) {
    it(`${ct.adminPath}/page.tsx filters deleted_at IS NULL`, () => {
      const file = `src/app${ct.adminPath}/page.tsx`
      const src = readFileSync(file, 'utf8')
      expect(src, `${file} is missing .is('deleted_at', null)`).toMatch(/\.is\(\s*'deleted_at'\s*,\s*null\s*\)/)
    })
  }
})
```

Check that `contentTypes` is exported from `src/cms/registry.ts` (it is the array the `byTable` map is built from at line 26). If it is not exported, add `export` to its declaration.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/admin/admin-list-pages.test.ts`
Expected: 8 failures (one per type without the filter), 1 pass (case-studies).

- [ ] **Step 3: Add the filter to each page**

In each of the eight files, insert `.is('deleted_at', null)` between `.select('*')` and the first `.order(...)`. Example for `src/app/admin/algorithms/page.tsx`:

```ts
  const { data: algorithms, error } = await supabase
    .from('algorithms')
    .select('*')
    .is('deleted_at', null)
    .order('name')
```

For `src/app/admin/blog/page.tsx` the chain has two `.order` calls; put the `.is` before both:

```ts
    .from('blog_posts')
    .select('*')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/admin/admin-list-pages.test.ts`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/*/page.tsx src/app/admin/admin-list-pages.test.ts src/cms/registry.ts
git commit -m "fix(admin): hide trashed rows from all admin list pages"
```

---

### Task 2: Distinguish "row saved, links failed" from "save failed"

**Files:**
- Modify: `src/cms/operations/create.ts:8-11,37-45`
- Modify: `src/cms/operations/update.ts:8-11,37-45`
- Modify: `src/cms/operations/mutations.test.ts:100-116`
- Modify: `src/app/admin/case-studies/[id]/actions.ts:28-57`
- Modify: `src/app/admin/case-studies/[id]/client.tsx:187-220`
- Modify: the eight throw-style action files (`src/app/admin/{algorithms,blog,industries,personas,partner-companies,quantum-companies,quantum-hardware,quantum-software}/[id]/actions.ts`), the `save*` export only.

**Interfaces:**
- Produces: `createContent` / `updateContent` return `{ data?: Record<string, unknown>; error?: string; warning?: string }`. `error` is set only when the row itself was not written. `warning` is set when the row was written but `saveRelationships` reported errors.
- Produces: `saveCaseStudy` returns `{ caseStudy?, success, error?, warning? }`.

- [ ] **Step 1: Update the two existing tests to the new contract and add a third**

In `src/cms/operations/mutations.test.ts`, replace the two "surfaces junction …" tests:

```ts
  it('reports junction insert errors from updateContent as a warning, not an error', async () => {
    mockSingle.mockResolvedValue({ data: personaRow, error: null })
    mockJunctionInsert.mockResolvedValue({ error: { message: 'insert failed' } })
    const result = await updateContent('personas', 'p1', { name: 'Dev', slug: 'dev' }, { industries: ['ind-9'] })
    expect(result.error).toBeUndefined()
    expect(result.warning).toContain('insert failed')
    expect(result.data?.id).toBe('p1')
  })

  it('reports junction errors from createContent as a warning and still returns the new row', async () => {
    mockSingle.mockResolvedValue({ data: personaRow, error: null })
    mockJunctionSelectEq.mockResolvedValue({ data: null, error: { message: 'read failed' } })
    const result = await createContent('personas', { name: 'Dev', slug: 'dev' }, { industries: ['ind-1'] })
    expect(result.error).toBeUndefined()
    expect(result.warning).toContain('read failed')
    expect(result.data?.id).toBe('p1')
  })

  it('returns error and no data when the row insert itself fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'duplicate key' } })
    const result = await createContent('personas', { name: 'Dev', slug: 'dev' })
    expect(result.error).toContain('duplicate key')
    expect(result.data).toBeUndefined()
    expect(result.warning).toBeUndefined()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/operations/mutations.test.ts`
Expected: the two warning tests FAIL (`result.error` is defined); the third passes already.

- [ ] **Step 3: Change the operations**

`src/cms/operations/create.ts` — replace the result interface and the tail:

```ts
interface CreateResult {
  data?: Record<string, unknown>
  /** Set only when the row itself was not written. */
  error?: string
  /** Set when the row was written but one or more relationship links failed. */
  warning?: string
}
```

```ts
  let relError: string | undefined
  if (relationships && record.id) {
    relError = (await saveRelationships(ct, record.id as string, relationships)).error
  }

  revalidateContentType(typeSlug, record.slug as string | undefined)
  // The row exists regardless of the relationship outcome, so never report
  // a relationship failure as `error`: callers treat `error` as "nothing was
  // saved" and would make the editor retry, creating a duplicate row.
  return relError ? { data: record, warning: relError } : { data: record }
```

`src/cms/operations/update.ts` — same two edits (interface named `UpdateResult`, tail identical except there is no `record.id` guard):

```ts
  let relError: string | undefined
  if (relationships) {
    relError = (await saveRelationships(ct, id, relationships)).error
  }

  revalidateContentType(typeSlug, record.slug as string | undefined)
  return relError ? { data: record, warning: relError } : { data: record }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/operations/mutations.test.ts`
Expected: all pass.

- [ ] **Step 5: Surface the warning in the case-studies action and client**

`src/app/admin/case-studies/[id]/actions.ts` — change the return type and the two branches:

```ts
export const saveCaseStudy = withAdmin(async (values: CaseStudyFormData): Promise<{ caseStudy?: TablesInsert<'case_studies'>; success: boolean; error?: string; warning?: string }> => {
```

```ts
    if (id) {
      const result = await updateContent('case-studies', id, data, relationships)
      if (result.error) return { success: false, error: result.error }
      return { caseStudy: result.data as TablesInsert<'case_studies'>, success: true, warning: result.warning }
    }

    const result = await createContent('case-studies', data, relationships)
    if (result.error) return { success: false, error: result.error }
    return { caseStudy: result.data as TablesInsert<'case_studies'>, success: true, warning: result.warning }
```

`src/app/admin/case-studies/[id]/client.tsx` — in `handleSave`, replace the success toast block (currently lines ~204-209):

```tsx
        setIsDirty(false);

        if (result.warning) {
          toast({
            variant: 'destructive',
            title: 'Saved, but some links were not updated',
            description: result.warning,
            duration: 8000,
          });
        } else {
          toast({
            title: 'Saved',
            description: 'Case study saved successfully',
            duration: 3000,
          });
        }
```

- [ ] **Step 6: Log the warning in the eight throw-style actions**

These actions return the bare record, so the editor cannot see a warning yet (unifying their contract is a roadmap follow-up). With the new contract they no longer throw on a relationship-only failure, which already fixes the duplicate-retry trap. Add a server log so the failure is not silent. In each `save*` export, after each `if (result.error) throw new Error(result.error)` line, add:

```ts
  if (result.warning) console.error('[cms] relationship save warning:', result.warning)
```

Example, `src/app/admin/algorithms/[id]/actions.ts`:

```ts
  if (id) {
    const result = await updateContent('algorithms', id, data, relationships)
    if (result.error) throw new Error(result.error)
    if (result.warning) console.error('[cms] relationship save warning:', result.warning)
    return result.data as TablesInsert<'algorithms'>
  }

  const result = await createContent('algorithms', data, relationships)
  if (result.error) throw new Error(result.error)
  if (result.warning) console.error('[cms] relationship save warning:', result.warning)
  return result.data as TablesInsert<'algorithms'>
```

Repeat in blog, industries, personas, partner-companies, quantum-companies, quantum-hardware, quantum-software. Open each file; the create/update branches have the same shape.

- [ ] **Step 7: Typecheck, full tests, commit**

Run: `npm run typecheck && npx vitest run`
Expected: clean, all green.

```bash
git add src/cms/operations/create.ts src/cms/operations/update.ts src/cms/operations/mutations.test.ts "src/app/admin/case-studies/[id]/actions.ts" "src/app/admin/case-studies/[id]/client.tsx" src/app/admin/*/\[id\]/actions.ts
git commit -m "fix(cms): keep new row id when relationship save fails"
```

---

### Task 3: Route bulk publish through `publishContent`

**Files:**
- Modify: `src/app/api/case-studies/route.ts:115-144`
- Create: `src/app/api/case-studies/route.test.ts`

**Interfaces:**
- Consumes: `publishContent(typeSlug, id)` / `unpublishContent(typeSlug, id)` → `{ success: boolean; error?: string }` from `src/cms/operations/publish.ts`.
- Produces: PATCH bulk response `{ success: true, updated: number, failed: string[], message: string }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/case-studies/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const publishContent = vi.fn()
const unpublishContent = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/auth', () => ({ requireAdmin: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, error: null }) }))
vi.mock('@/cms/operations', () => ({
  listContent: vi.fn(),
  fetchContentBySlug: vi.fn(),
  deleteContent: vi.fn(),
  deleteContentMany: vi.fn(),
  publishContent: (...args: unknown[]) => publishContent(...args),
  unpublishContent: (...args: unknown[]) => unpublishContent(...args),
  revalidateContentType: vi.fn(),
}))
vi.mock('@/lib/supabase-server', () => ({ createServiceRoleSupabaseClient: () => ({ from: mockFrom }) }))

import { PATCH } from './route'

const ID1 = '11111111-1111-4111-8111-111111111111'
const ID2 = '22222222-2222-4222-8222-222222222222'
const ID3 = '33333333-3333-4333-8333-333333333333'

function bulkRequest(operation: 'publish' | 'unpublish', ids: string[]) {
  return new NextRequest('http://localhost/api/case-studies', {
    method: 'PATCH',
    body: JSON.stringify({ bulk: true, operation, ids }),
    headers: { 'content-type': 'application/json' },
  })
}

describe('PATCH /api/case-studies bulk publish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('publishes each id through publishContent and never writes the table directly', async () => {
    publishContent.mockResolvedValue({ success: true })
    const res = await PATCH(bulkRequest('publish', [ID1, ID2]))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(publishContent).toHaveBeenCalledTimes(2)
    expect(publishContent).toHaveBeenCalledWith('case-studies', ID1)
    expect(publishContent).toHaveBeenCalledWith('case-studies', ID2)
    expect(mockFrom).not.toHaveBeenCalled()
    expect(body.updated).toBe(2)
    expect(body.failed).toEqual([])
  })

  it('reports ids that publishContent refused (e.g. trashed) without failing the others', async () => {
    publishContent.mockImplementation(async (_type: string, id: string) =>
      id === ID2 ? { success: false, error: 'trashed' } : { success: true }
    )
    const res = await PATCH(bulkRequest('publish', [ID1, ID2, ID3]))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.updated).toBe(2)
    expect(body.failed).toEqual([ID2])
  })

  it('unpublishes through unpublishContent', async () => {
    unpublishContent.mockResolvedValue({ success: true })
    const res = await PATCH(bulkRequest('unpublish', [ID1]))
    expect(res.status).toBe(200)
    expect(unpublishContent).toHaveBeenCalledWith('case-studies', ID1)
    expect(publishContent).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/case-studies/route.test.ts`
Expected: first test FAILS (`mockFrom` was called; `publishContent` not called).

- [ ] **Step 3: Replace `handleBulkPublish`**

In `src/app/api/case-studies/route.ts`, replace the whole `handleBulkPublish` function with:

```ts
/**
 * Bulk publish/unpublish goes through the single publish path so every row
 * gets the same guards (never publish a trashed row), the same published_at
 * stamping, and the same per-slug revalidation as the single-item action.
 */
async function handleBulkPublish(ids: string[], published: boolean) {
  const failed: string[] = []
  for (const id of ids) {
    const result = published
      ? await publishContent('case-studies', id)
      : await unpublishContent('case-studies', id)
    if (!result.success) failed.push(id)
  }

  const updated = ids.length - failed.length
  const verb = published ? 'published' : 'unpublished'
  return NextResponse.json({
    success: true,
    updated,
    failed,
    message: failed.length === 0
      ? `Successfully ${verb} ${updated} case studies`
      : `${verb} ${updated} case studies; ${failed.length} could not be ${verb}`,
  })
}
```

Then check whether `createServiceRoleSupabaseClient` and `revalidateContentType` are still used elsewhere in the file (`handleBulkDelete` or others). Remove whichever import is now unused so lint stays clean.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/case-studies/route.test.ts && npm run lint`
Expected: 3 passed; lint 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/case-studies/route.ts src/app/api/case-studies/route.test.ts
git commit -m "fix(api): route bulk publish through publishContent"
```

---

### Task 4: Null-safe `published_at` rendering on the four entity detail pages

**Files:**
- Create: `src/lib/format-date.ts`
- Create: `src/lib/format-date.test.ts`
- Modify: `src/app/paths/quantum-hardware/[slug]/page.tsx:350-354`
- Modify: `src/app/paths/quantum-software/[slug]/page.tsx:327-331`
- Modify: `src/app/paths/quantum-companies/[slug]/page.tsx:303-307`
- Modify: `src/app/paths/partner-companies/[slug]/page.tsx:322-326`

**Interfaces:**
- Produces: `formatPublishedDate(value: string | null | undefined, locale?: string, options?: Intl.DateTimeFormatOptions): string | null`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/format-date.test.ts
import { describe, it, expect } from 'vitest'
import { formatPublishedDate } from './format-date'

describe('formatPublishedDate', () => {
  it('formats an ISO timestamp with the default en-GB numeric style', () => {
    expect(formatPublishedDate('2026-03-05T10:00:00Z')).toBe('05/03/2026')
  })

  it('returns null for null, undefined and empty string instead of the Unix epoch', () => {
    expect(formatPublishedDate(null)).toBeNull()
    expect(formatPublishedDate(undefined)).toBeNull()
    expect(formatPublishedDate('')).toBeNull()
  })

  it('returns null for an unparseable value', () => {
    expect(formatPublishedDate('not-a-date')).toBeNull()
  })

  it('accepts a locale and options', () => {
    expect(formatPublishedDate('2026-03-05T10:00:00Z', 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })).toBe('Mar 5, 2026')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/format-date.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/format-date.ts
const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

/**
 * Format a nullable timestamp for display. Returns null (renders as nothing
 * in JSX) for null/empty/invalid input instead of `new Date(null)`'s
 * 1 January 1970.
 */
export function formatPublishedDate(
  value: string | null | undefined,
  locale = 'en-GB',
  options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS
): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale, options)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/format-date.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Use it on the four pages**

In each of the four files, replace the block

```tsx
                <div className="text-xs text-muted-foreground">
                  {new Date(caseStudy.published_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  })}
                </div>
```

with

```tsx
                <div className="text-xs text-muted-foreground">
                  {formatPublishedDate(caseStudy.published_at)}
                </div>
```

and add `import { formatPublishedDate } from '@/lib/format-date'` to the file's imports.

- [ ] **Step 6: Typecheck and commit**

Run: `npm run typecheck && npx vitest run src/lib`
Expected: clean.

```bash
git add src/lib/format-date.ts src/lib/format-date.test.ts "src/app/paths/quantum-hardware/[slug]/page.tsx" "src/app/paths/quantum-software/[slug]/page.tsx" "src/app/paths/quantum-companies/[slug]/page.tsx" "src/app/paths/partner-companies/[slug]/page.tsx"
git commit -m "fix(ui): guard published_at rendering against null"
```

---

### Task 5: `generateStaticParamsFor` excludes trashed rows

**Files:**
- Modify: `src/cms/page-helpers.ts:13-18`
- Modify: `src/cms/page-helpers.test.ts:49-66`

- [ ] **Step 1: Update the tests**

The mock chain is `select → eq → is`. Change the first and third `generateStaticParamsFor` tests so the data comes back from `mockIs`, and assert the new filter:

```ts
  it('returns a function that produces slug params', async () => {
    const mockData = [{ slug: 'finance' }, { slug: 'healthcare' }]
    mockIs.mockReturnValueOnce({ data: mockData })

    const fn = generateStaticParamsFor('industries')
    const params = await fn()
    expect(params).toEqual([{ slug: 'finance' }, { slug: 'healthcare' }])
  })
```

```ts
  it('queries only published, non-deleted items', async () => {
    mockIs.mockReturnValueOnce({ data: [] })

    const fn = generateStaticParamsFor('industries')
    await fn()
    expect(mockEq).toHaveBeenCalledWith('published', true)
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/cms/page-helpers.test.ts`
Expected: the two edited tests FAIL (`mockIs` not called; params empty).

- [ ] **Step 3: Add the filter**

```ts
    const supabase = createServiceRoleSupabaseClient()
    const { data } = await fromTable(supabase, ct.tableName)
      .select('slug')
      .eq('published', true)
      .is('deleted_at', null)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/page-helpers.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/cms/page-helpers.ts src/cms/page-helpers.test.ts
git commit -m "fix(cms): exclude trashed rows from static params"
```

---

### Task 6: Revalidate the old slug on rename, and revalidate after hardware spec saves

**Files:**
- Modify: `src/cms/operations/update.ts:28-44`
- Modify: `src/cms/operations/mutations.test.ts` (add to `describe('updateContent')`)
- Modify: `src/app/admin/quantum-hardware/[id]/actions.ts:104-170`

**Interfaces:**
- Consumes: `revalidateContentType(typeSlug, slug | slug[])` from `src/cms/operations/revalidate.ts`.

- [ ] **Step 1: Write the failing test for slug rename**

The mutations test file mocks `next/cache`'s `revalidatePath`. Import it at the top of the file (after the `vi.mock('next/cache', ...)` call):

```ts
import { revalidatePath } from 'next/cache'
```

The update mock chain today is `update → eq → select → single`. The new code first reads the current slug with `select('slug') → eq('id', id) → maybeSingle()`. Extend the non-junction branch of `mockFrom` to support that read:

```ts
const mockSlugMaybeSingle = vi.fn()
const mockSlugSelect = vi.fn(() => ({ eq: () => ({ maybeSingle: mockSlugMaybeSingle }) }))
```

and in the non-junction object add `select: mockSlugSelect,` alongside `insert`, `update`, `delete`. In `beforeEach` add `mockSlugMaybeSingle.mockResolvedValue({ data: null, error: null })`.

Then add the test:

```ts
  it('revalidates both the old and the new slug page when the slug changes', async () => {
    mockSlugMaybeSingle.mockResolvedValue({ data: { slug: 'old-slug' }, error: null })
    mockSingle.mockResolvedValue({ data: { id: '1', name: 'Finance', slug: 'new-slug' }, error: null })
    await updateContent('industries', '1', { name: 'Finance', slug: 'new-slug' })
    expect(revalidatePath).toHaveBeenCalledWith('/paths/industry/old-slug')
    expect(revalidatePath).toHaveBeenCalledWith('/paths/industry/new-slug')
  })
```

(Confirm the industries `basePath` in `src/cms/types/industries.ts` is `/paths/industry`; adjust the expected paths if not.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/cms/operations/mutations.test.ts`
Expected: new test FAILS on the `old-slug` expectation.

- [ ] **Step 3: Implement in `update.ts`**

Replace the body from the `const supabase = ...` line to the end:

```ts
  const supabase = createServiceRoleSupabaseClient()

  // If the slug is changing, the page at the old slug must be revalidated
  // too, otherwise it keeps serving the renamed content for up to 24h (ISR).
  let previousSlug: string | undefined
  if (typeof parsed.data.slug === 'string') {
    const { data: current } = await fromTable(supabase, ct.tableName)
      .select('slug')
      .eq('id', id)
      .maybeSingle()
    previousSlug = (current as { slug?: string } | null)?.slug
  }

  const { data: result, error } = await fromTable(supabase, ct.tableName)
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  const record = result as Record<string, unknown>

  let relError: string | undefined
  if (relationships) {
    relError = (await saveRelationships(ct, id, relationships)).error
  }

  const newSlug = record.slug as string | undefined
  const slugs = previousSlug && previousSlug !== newSlug ? [newSlug, previousSlug] : newSlug
  revalidateContentType(typeSlug, slugs)
  return relError ? { data: record, warning: relError } : { data: record }
```

`parsed.data` is typed from the generated Zod schema; if `parsed.data.slug` does not typecheck, use `(parsed.data as Record<string, unknown>).slug`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/cms/operations/mutations.test.ts`
Expected: all pass (the existing update tests still pass because `mockSlugMaybeSingle` returns `data: null`).

- [ ] **Step 5: Revalidate after hardware spec saves**

In `src/app/admin/quantum-hardware/[id]/actions.ts`, add the import:

```ts
import { revalidateContentType } from '@/cms/operations'
```

(Check the file's existing imports; `createContent` etc. are imported from `@/cms/operations` already, so extend that line.)

Then add a small helper above `saveHardwareSpecs`:

```ts
async function revalidateHardwarePages(supabase: ReturnType<typeof createServiceRoleSupabaseClient>, hardwareId: string) {
  const { data } = await supabase.from('quantum_hardware').select('slug').eq('id', hardwareId).maybeSingle()
  revalidateContentType('quantum-hardware', data?.slug ?? undefined)
}
```

Call it at both exit points of `saveHardwareSpecs`: immediately before the early `return` in the `keys.length === 0` branch, and as the last statement after the upsert error check:

```ts
    if (keys.length === 0) {
      const { error: deleteAllError } = await supabase
        .from('quantum_hardware_specs')
        .delete()
        .eq('hardware_id', hardwareId)
      if (deleteAllError) throw new Error(deleteAllError.message)
      await revalidateHardwarePages(supabase, hardwareId)
      return
    }
```

```ts
    if (upsertError) throw new Error(upsertError.message)
    await revalidateHardwarePages(supabase, hardwareId)
```

- [ ] **Step 6: Typecheck, lint, commit**

Run: `npm run typecheck && npm run lint && npx vitest run src/cms`
Expected: clean.

```bash
git add src/cms/operations/update.ts src/cms/operations/mutations.test.ts "src/app/admin/quantum-hardware/[id]/actions.ts"
git commit -m "fix(cms): revalidate old slug on rename and after spec saves"
```

---

### Task 7: Preview secret compare that cannot throw

**Files:**
- Modify: `src/app/api/preview/route.ts:17-22`
- Modify: `src/app/api/preview/route.test.ts`

- [ ] **Step 1: Write the failing test**

Add to the `describe('GET /api/preview')` block:

```ts
  it('returns 401 (not 500) for a secret with equal character length but different byte length', async () => {
    process.env.PREVIEW_SECRET = 'ab'          // 2 chars, 2 bytes
    requireAdmin.mockResolvedValue({ user: null, error: new Response(null, { status: 401 }) })
    const res = await GET(req('secret=%C3%A9a&slug=foo'))   // 'éa': 2 chars, 3 bytes
    expect(res.status).toBe(401)
    expect(enable).not.toHaveBeenCalled()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/preview/route.test.ts`
Expected: FAIL with `RangeError: Input buffers must have the same byte length`.

- [ ] **Step 3: Compare byte buffers**

Replace the `hasValidSecret` expression:

```ts
  const validSecret = process.env.PREVIEW_SECRET;
  const secretBytes = secret ? Buffer.from(secret) : null;
  const validBytes = validSecret ? Buffer.from(validSecret) : null;
  const hasValidSecret =
    !!secretBytes &&
    !!validBytes &&
    secretBytes.length === validBytes.length &&
    crypto.timingSafeEqual(secretBytes, validBytes);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/api/preview/route.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/preview/route.ts src/app/api/preview/route.test.ts
git commit -m "fix(preview): compare secret by byte length"
```

---

### Task 8: Harden `formatResourceLink` against untrusted JSON

**Files:**
- Modify: `src/components/ui/professional-case-study-layout.tsx:21-43`
- Modify: `src/components/ui/professional-case-study-layout.test.tsx` (inside `describe('formatResourceLink')`)

- [ ] **Step 1: Write the failing tests**

```ts
  it('ignores a whitespace-only title and falls through to the label', () => {
    expect(formatResourceLink({ url: 'https://example.com/x', title: '   ', label: 'Example' })).toBe('Example');
  });

  it('treats an upper-case scheme as a raw URL, not a title', () => {
    expect(formatResourceLink({ url: 'https://example.com/report.pdf', title: 'HTTPS://example.com/report.pdf' })).toBe('example.com — report.pdf');
  });

  it('does not throw when title or label is not a string', () => {
    const link = { url: 'https://example.com/report.pdf', title: 42, label: { bad: true } } as unknown as Parameters<typeof formatResourceLink>[0];
    expect(formatResourceLink(link)).toBe('example.com — report.pdf');
  });

  it('returns a placeholder when url is missing', () => {
    expect(formatResourceLink({} as Parameters<typeof formatResourceLink>[0])).toBe('Resource Link');
  });

  it('keeps the raw URL when the last path segment has a malformed percent-escape', () => {
    expect(formatResourceLink({ url: 'https://example.com/%E0%A4%A' })).toBe('https://example.com/%E0%A4%A');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ui/professional-case-study-layout.test.tsx`
Expected: whitespace test FAILS (returns `''`), upper-case test FAILS (returns the URL text), non-string test FAILS with `startsWith is not a function`. The other two may already pass.

- [ ] **Step 3: Implement**

Replace `formatResourceLink` with:

```ts
/** A trimmed, human-readable string, or null if the value is empty, not a string, or itself a URL. */
function descriptiveText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function formatResourceLink(link: ResourceLink): string {
  // 1-2. Prefer a descriptive title, then a descriptive label. resource_links
  // is free-form JSON from the CMS, so never assume field types.
  const text = descriptiveText(link.title) ?? descriptiveText(link.label);
  if (text) return text;

  if (typeof link.url !== 'string' || !link.url) return 'Resource Link';

  // 3. Otherwise extract domain and filename/last path segment from URL
  try {
    const parsed = new URL(link.url);
    const domain = parsed.hostname.replace(/^www\./, '');
    const segments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment) {
      return `${domain} — ${decodeURIComponent(lastSegment)}`;
    }
    return domain;
  } catch {
    return link.url;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ui/professional-case-study-layout.test.tsx`
Expected: all pass, including the five pre-existing `formatResourceLink` tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/professional-case-study-layout.tsx src/components/ui/professional-case-study-layout.test.tsx
git commit -m "fix(ui): harden resource link formatting against bad JSON"
```

---

### Task 9: CHANGELOG, full gates, build

**Files:**
- Modify: `CHANGELOG.md` (`[Unreleased]` → `### Fixed`)

- [ ] **Step 1: Add CHANGELOG entries**

Under `## [Unreleased]`, in (or creating) a `### Fixed` section, add:

```markdown
- **Admin trash**: Soft-deleted items no longer appear in the main admin lists for algorithms, blog posts, industries, personas, partner companies, quantum companies, hardware and software (they were already hidden for case studies).
- **CMS create**: When a new item saves but one of its relationship links fails, the editor is now taken to the saved item with a warning instead of being told the save failed (which led to duplicate-slug errors on retry).
- **Bulk publish**: Bulk publish/unpublish of case studies now goes through the same publish path as single items, so trashed rows are refused and `published_at` is stamped consistently.
- **Detail pages**: Related case studies without a publish date no longer show 01/01/1970 on hardware, software and company pages.
- **Static generation**: Trashed rows are excluded from build-time slug lists.
- **Slug rename**: Renaming an item's slug now also refreshes the page at the old slug.
- **Hardware specs**: Saving hardware specs now refreshes the public hardware page immediately.
- **Preview**: A malformed preview secret returns 401 instead of a server error.
- **Reference links**: Case study reference links no longer crash the page when the stored link JSON has a non-string title.
```

- [ ] **Step 2: Run all four gates**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all tests pass; tsc clean; lint 0 errors; build completes with the same 383-page count (check the build summary; `/paths/quantum-hardware/[slug]` etc. still show ● SSG).

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for CMS trash and publish fixes"
```

- [ ] **Step 4: Stop and report**

Do not push. Report the branch name, the commit list (`git log --oneline main..HEAD`), and the gate output to the user, and wait for approval to push and open the PR.
