# Dead Code & Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two orphaned CMS modules that carry a competing delete/relationship path, close the small hygiene gaps (`.gitignore`, CI pin comment, dependency range), and bring README, CLAUDE.md, docs and CHANGELOG back in line with what is on `main`.

**Architecture:** Pure deletion and documentation. No runtime behaviour changes. The ESLint `withAdmin` rule and the security regression test lose their reference to the deleted `src/cms/actions.ts`; a new regression test asserts the two dead modules stay gone.

**Tech Stack:** Next.js 16, Vitest, ESLint flat config, GitHub Actions.

**Spec:** `docs/superpowers/plans/2026-10-01-review-fixes-roadmap.md` row 3.

## Global Constraints

- Branch `chore/dead-code-and-docs` from `main`. Independent of PRs #253 and the Sentry branch; CHANGELOG hunks will conflict trivially at merge — that is expected.
- Every commit must leave `npm test`, `npm run typecheck`, `npm run lint` (0 errors) green; `npm run build` before the PR.
- Nothing under `docs/archive/`, `docs/superpowers/` or `docs/content-drafts/` is edited: those are historical records.
- Commit messages: conventional, no attribution footer. Do not push or open the PR without the user's go-ahead.

## Review Focus

1. Deleting `src/cms/actions.ts` must not remove the only `withAdmin` coverage for anything still live — the 9 per-type `actions.ts` files remain covered by the ESLint rule and the test — Task 1 test.
2. `src/utils/content-management.ts` has no importers; grep must be empty after deletion (test guards it) — Task 1 test.
3. `.local-handover/` must be ignored from a fresh clone, not only via `.git/info/exclude` — Task 2 verifies with `git check-ignore`.
4. The Supabase CLI version used by CI and the one in `package.json` must be the same string so `gen types` output cannot drift — Task 2 test.
5. README setup steps must not tell a new contributor to `supabase link` + `db pull` against a remote project — Task 3.

---

### Task 1: Delete the orphaned modules and re-point the guards

**Files:**
- Delete: `src/utils/content-management.ts`
- Delete: `src/cms/actions.ts`
- Modify: `eslint.config.mjs:75` (`files:` array of the `withAdmin` rule)
- Modify: `src/__tests__/security/findings.test.ts:217-221` (file list)
- Modify: `src/cms/operations/delete.ts:11-13` (comment mentioning `deleteContentItem`)
- Modify: `docs/api-relationships-architecture.md:30-45` (stale import example)
- Create: `src/__tests__/dead-modules.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/dead-modules.test.ts
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'

/**
 * Modules that were superseded by src/cms/operations and must not come back:
 * each carried its own delete / relationship-save path that bypassed the
 * single soft-delete and diffing implementation (see CLAUDE.md "Deletion System").
 */
const REMOVED = ['src/utils/content-management.ts', 'src/cms/actions.ts']

describe('superseded CMS modules stay deleted', () => {
  for (const file of REMOVED) {
    it(`${file} does not exist`, () => {
      expect(existsSync(file)).toBe(false)
    })
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dead-modules.test.ts`
Expected: 2 FAIL (both files exist).

- [ ] **Step 3: Delete the files and re-point the guards**

```bash
git rm src/utils/content-management.ts src/cms/actions.ts
```

`eslint.config.mjs:75` — change

```js
    files: ['src/app/admin/**/actions.ts', 'src/cms/actions.ts'],
```

to

```js
    files: ['src/app/admin/**/actions.ts'],
```

`src/__tests__/security/findings.test.ts` — change the file list to the glob only:

```ts
    const files = await glob('src/app/admin/*/[[]id[]]/actions.ts')
```

(keep the `expect(files.length).toBeGreaterThan(0)` sanity check and the loop unchanged).

`src/cms/operations/delete.ts:11-13` — the comment currently says the legacy `deleteContentItem` helper funnels through here. Reword so it no longer names a deleted helper, e.g.:

```ts
// Every delete route and admin action for all 9 content types funnels
// through here so that:
```

(Open the file; keep the rest of the comment's bullet list as is.)

`docs/api-relationships-architecture.md:30-45` — replace the "Standardized API Pattern" import block with the current one:

```markdown
### Standardized API Pattern

All content APIs use the CMS operations layer, driven by the content-type registry:

```typescript
import {
  listContent,          // List content with pagination (published only for public reads)
  fetchContentBySlug,   // Get a single published item by slug
  deleteContent,        // Soft delete (sets deleted_at, unpublishes, revalidates)
  deleteContentMany,    // Bulk soft delete
  publishContent,       // Publish (refuses trashed rows, stamps published_at)
  unpublishContent,
} from '@/cms/operations'
```
```

Check `src/cms/operations/index.ts` exports exactly those names before writing them; adjust the list to what is actually exported.

- [ ] **Step 4: Verify**

Run: `npx vitest run src/__tests__/dead-modules.test.ts src/__tests__/security/findings.test.ts && npm run typecheck && npm run lint`
Expected: all pass; tsc clean (nothing imported the deleted files); lint 0 errors. Then `grep -rn "content-management\|cms/actions" src eslint.config.mjs` must return nothing.

- [ ] **Step 5: Commit**

```bash
git add -A src/utils src/cms/actions.ts src/__tests__ eslint.config.mjs src/cms/operations/delete.ts docs/api-relationships-architecture.md
git commit -m "chore: remove superseded content-management and cms/actions modules"
```

---

### Task 2: Repo hygiene — gitignore, CI pin comment, dependency range

**Files:**
- Modify: `.gitignore` (append)
- Modify: `.github/workflows/ci.yml:44-46`
- Modify: `package.json:85`
- Create: `src/__tests__/ci-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/ci-config.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

describe('Supabase CLI version is pinned identically in CI and package.json', () => {
  it('uses one exact version string in both places', () => {
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { devDependencies: Record<string, string> }
    const ciVersion = ci.match(/supabase\/setup-cli@v1[\s\S]*?version:\s*([\d.]+)/)?.[1]
    expect(ciVersion, 'ci.yml must pin supabase/setup-cli to an exact version').toBeDefined()
    expect(pkg.devDependencies.supabase).toBe(ciVersion)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/ci-config.test.ts`
Expected: FAIL — `^2.105.0` ≠ `2.117.0`.

- [ ] **Step 3: Implement**

`package.json:85` — change `"supabase": "^2.105.0",` to `"supabase": "2.117.0",` then run `npm install --package-lock-only` so the lockfile matches (commit the lockfile change if any).

`.github/workflows/ci.yml` — add a comment above the `version:` line:

```yaml
      - uses: supabase/setup-cli@v1
        with:
          # Pinned: 2.118.0 changed `supabase db start` to take no arguments and broke
          # this job. Keep in sync with devDependencies.supabase (enforced by
          # src/__tests__/ci-config.test.ts); bump both together after testing locally.
          version: 2.117.0
```

`.gitignore` — append:

```
# Local-only handover material (unpublished content analysis); never commit
.local-handover/
```

- [ ] **Step 4: Verify**

Run: `npx vitest run src/__tests__/ci-config.test.ts && git check-ignore -q .local-handover && echo ignored`
Expected: test passes; prints `ignored`.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .github/workflows/ci.yml package.json package-lock.json src/__tests__/ci-config.test.ts
git commit -m "chore: pin supabase CLI consistently and ignore local handover dir"
```

---

### Task 3: README, CLAUDE.md and docs drift

**Files:**
- Modify: `README.md:8,20-27,60`
- Modify: `CLAUDE.md:105`
- Modify: `docs/authentication.md:7,82,363,529`
- Modify: `docs/admin-cms-guide.md:34,270`
- Modify: `docs/app-structure.md:31`
- Modify: `docs/troubleshooting.md:535`

- [ ] **Step 1: README**

Line 8: `- Node.js 18+` → `- Node.js 20+ (CI uses 20)`.

Replace lines 20-27 (the "Start local Supabase and pull the schema" block) with:

```markdown
Start a local Supabase and build the schema from the tracked migrations:

```bash
npx supabase start
npx supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --single-transaction --variable ON_ERROR_STOP=1 --file supabase/seed.sql
```

See [docs/database-workflow.md](./docs/database-workflow.md) for how schema changes reach dev and prod.
```

Line 60: `| Testing | Vitest (235+ tests) |` → `| Testing | Vitest (570+ tests) |`.

- [ ] **Step 2: CLAUDE.md**

Line 105: `3. Use \`generateStaticParams()\` with \`generateStaticParamsForContentType()\` for build-time generation` → `3. Export \`generateStaticParams = generateStaticParamsFor('<type-slug>')\` from \`src/cms/page-helpers.ts\` for build-time generation`.

- [ ] **Step 3: docs**

In each listed line replace `src/middleware.ts` with `src/proxy.ts` (and `middleware.ts` with `proxy.ts` in `docs/troubleshooting.md:535`). In `docs/admin-cms-guide.md:34` also change "Next.js Middleware" to "the Next.js proxy (formerly middleware)". In `docs/app-structure.md:31` change the description to: "`src/proxy.ts`: Next.js proxy (the middleware convention in Next 16), handling authentication and route protection for `/admin`, `/auth`, `/profile` and `/api`." Do not touch files under `docs/superpowers/` or `docs/archive/`.

- [ ] **Step 4: Verify and commit**

Run: `grep -rn "src/middleware.ts" README.md CLAUDE.md docs --include='*.md' | grep -v "docs/superpowers\|docs/archive"` → must print nothing.

```bash
git add README.md CLAUDE.md docs/authentication.md docs/admin-cms-guide.md docs/app-structure.md docs/troubleshooting.md
git commit -m "docs: fix setup steps, Node version, proxy references"
```

---

### Task 4: CHANGELOG backfill and gates

**Files:**
- Modify: `CHANGELOG.md` (`[Unreleased]`)

- [ ] **Step 1: Add the missing entries**

Under `### Changed`, add (top of list):

```markdown
- **Middleware migrated to the Next.js 16 proxy convention** (`src/middleware.ts` → `src/proxy.ts`); matcher and auth checks unchanged (#241).
- **Next.js and eslint-config-next bumped to 16.3.6** (#245).
- **Lint cleanup across the codebase**: unused variables and imports removed, JSX entities escaped, explicit `any` replaced with typed or `unknown` signatures; no behaviour changes intended (#242, #244). One intentional side effect: case study structured data now includes persona names in `keywords`.
```

Under `### Fixed`, add (top of list):

```markdown
- **Detail page sidebars** share one structure and show explicit "None specified" placeholders instead of disappearing sections (#246).
- **Grid cards** no longer reserve empty space below short descriptions (#247).
- **/paths hub** has an eighth "All Case Studies" card and a 1/2/4-column responsive grid (#249).
- **Reference links** in the case study sidebar show a readable title or `domain — filename` instead of the raw URL (#250).
- **Sentry in development** no longer floods the console: debug off, traces off, CSP allows the project's ingest host (#252).
```

Under `### Added`:

```markdown
- **Search loading and empty states** on the homepage search palette and every listing page (#251).
```

Under `### Removed`:

```markdown
- **Superseded CMS modules** `src/utils/content-management.ts` and `src/cms/actions.ts` (no importers; each carried a delete/relationship path that bypassed `src/cms/operations`). The ESLint `withAdmin` rule and the security regression test now cover only the nine live admin action files.
```

Under `### Security` (bottom of list):

```markdown
- **Pinned Supabase CLI** to one exact version in CI and `package.json` so generated types cannot drift between the two; `.local-handover/` is now git-ignored from a fresh clone.
```

- [ ] **Step 2: Gates**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all green; build 383 pages.

- [ ] **Step 3: Commit, stop, report**

```bash
git add CHANGELOG.md
git commit -m "docs: backfill changelog for #241-#252 and this cleanup"
```

Do not push. Report branch, commit list and gate output.
