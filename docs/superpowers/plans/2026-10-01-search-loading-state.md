# Search Loading State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the artificial 250 ms delay and skeleton swap from the five listing components (the filter is synchronous over in-memory data), keep results mounted while the user types, and keep the useful parts of PR #251: the empty state and the live result count.

**Architecture:** One hook, `useSearchQuery`, wraps `useState` + React's `useDeferredValue`; components filter on the deferred value so typing never blocks, and `isPending` (query ≠ deferred) drives only an `aria-busy` attribute and a subtle opacity on the results container. The skeleton branch, the `useDebounce(…, 250)` calls and the "Searching…" copy in the result counter go away. The GlobalSearch palette keeps its own 300 ms debounce (relevance scoring across all content) and gets only a consistency fix. User decision 2026-10-01: "Keep results visible, drop fake delay."

**Tech Stack:** React 19 (`useDeferredValue`), Next.js 16, Tailwind, Vitest (node, `renderToStaticMarkup`).

**Spec:** `docs/superpowers/plans/2026-10-01-review-fixes-roadmap.md` row 5.

## Global Constraints

- Branch `refactor/search-loading-state` from `main`.
- Every commit must leave `npm test`, `npm run typecheck`, `npm run lint` (0 errors) green; `npm run build` before the PR.
- The five list components are: `src/components/CaseStudiesList.tsx`, `AlgorithmList.tsx`, `IndustryList.tsx`, `PersonaList.tsx`, `src/components/ui/content-list.tsx`.
- Filtering semantics, sorting, pagination reset, view switcher, filter pills and the `SearchEmptyState` props each component passes must stay exactly as they are; only the query source and the loading presentation change.
- `useDebounce` stays (still used by `useGlobalSearch`). `src/components/ui/skeleton.tsx` stays (generic UI primitive).
- Commit messages: conventional, no attribution footer. Do not push or open the PR without the user's go-ahead.

## Review Focus

1. Typing into a list search must never unmount the results grid (no skeleton markup in the rendered output at any point) — Task 2 test asserts the grid container and `aria-busy` exist and no `animate-pulse` skeleton appears.
2. The empty state must still appear when the filtered list is empty — Task 2 keeps the existing CaseStudiesList empty-list test.
3. The result-count live region must stay mounted from first render and read "N … found" — Task 2 test.
4. Screen readers must not get a double announcement when the empty state appears — Task 3 removes the second live region and its test asserts the attributes are gone.
5. Two spaces in the GlobalSearch input must not open an empty dropdown — Task 3 test.

---

### Task 1: `useSearchQuery` hook

**Files:**
- Create: `src/hooks/useSearchQuery.ts`
- Create: `src/hooks/useSearchQuery.test.tsx`

**Interfaces:**
- Produces: `useSearchQuery(initial = ''): { query: string; deferredQuery: string; isPending: boolean; setQuery: (q: string) => void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/hooks/useSearchQuery.test.tsx
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { useSearchQuery } from './useSearchQuery'

function Probe({ initial }: { initial?: string }) {
  const { query, deferredQuery, isPending } = useSearchQuery(initial)
  return <output data-q={query} data-d={deferredQuery} data-p={String(isPending)} />
}

describe('useSearchQuery', () => {
  it('starts with the initial value, deferred value equal to it, and not pending', () => {
    const html = renderToStaticMarkup(<Probe initial="qaoa" />)
    expect(html).toContain('data-q="qaoa"')
    expect(html).toContain('data-d="qaoa"')
    expect(html).toContain('data-p="false"')
  })

  it('defaults to an empty query', () => {
    const html = renderToStaticMarkup(<Probe />)
    expect(html).toContain('data-q=""')
    expect(html).toContain('data-p="false"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useSearchQuery.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/hooks/useSearchQuery.ts
import { useDeferredValue, useState } from 'react';

/**
 * Search input state for in-memory filtered lists.
 *
 * The input is controlled by `query` so keystrokes are never delayed. Filtering
 * should read `deferredQuery`: React keeps rendering the previous results while
 * it computes the new ones, so the list never unmounts or flashes a skeleton.
 * `isPending` is true only during that (usually sub-frame) gap and is meant for
 * `aria-busy` and a subtle visual cue, not for replacing content.
 */
export function useSearchQuery(initial = '') {
  const [query, setQuery] = useState(initial);
  const deferredQuery = useDeferredValue(query);
  const isPending = query !== deferredQuery;
  return { query, deferredQuery, isPending, setQuery };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useSearchQuery.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSearchQuery.ts src/hooks/useSearchQuery.test.tsx
git commit -m "feat(search): add useSearchQuery hook with deferred value"
```

---

### Task 2: Migrate the five list components (one batched change)

**Files:**
- Modify: `src/components/CaseStudiesList.tsx:19-22,40-42,58,102,115,169,249-253,280-288,315-338,367,382`
- Modify: `src/components/AlgorithmList.tsx` (same shape; `filteredAlgorithms`, "algorithms")
- Modify: `src/components/IndustryList.tsx` (same shape; `filteredIndustries`, "industries")
- Modify: `src/components/PersonaList.tsx` (same shape; `filteredPersonas`, "personas")
- Modify: `src/components/ui/content-list.tsx` (same shape; `filteredItems`)
- Modify: `src/components/CaseStudiesList.test.tsx`

**Interfaces:**
- Consumes: `useSearchQuery` from Task 1.

The full transformation, shown on CaseStudiesList; apply the identical transformation to the other four (their line numbers differ; search for the same identifiers).

- [ ] **Step 1: Write the failing test**

Add to `src/components/CaseStudiesList.test.tsx` (it already renders the component with `renderToStaticMarkup`; reuse its fixture/props):

```tsx
  it('renders results in a grid that is never replaced by skeletons and exposes aria-busy', () => {
    const html = renderToStaticMarkup(<CaseStudiesList caseStudies={[fixtureCaseStudy]} />)
    expect(html).toContain('aria-busy="false"')
    expect(html).not.toContain('animate-pulse')
    expect(html).toContain('1 case study found')
    expect(html).not.toContain('Searching case studies')
  })
```

(`fixtureCaseStudy` = whatever the file's existing non-empty test passes; name it accordingly.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/CaseStudiesList.test.tsx`
Expected: FAIL on `aria-busy="false"`.

- [ ] **Step 3: Transform CaseStudiesList.tsx**

Imports (lines 19-22): remove `Loader2` from the lucide import if it is no longer used after this change (it is used only by the two spinners below, so remove it); remove `import { useDebounce } from '@/hooks/useDebounce';` and `import { Skeleton } from '@/components/ui/skeleton';`; add `import { useSearchQuery } from '@/hooks/useSearchQuery';` and, if not already imported, `import { cn } from '@/lib/utils';`.

State (lines 40-42): replace

```ts
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const isSearching = searchQuery !== debouncedSearchQuery;
```

with

```ts
  const { query: searchQuery, deferredQuery, isPending, setQuery: setSearchQuery } = useSearchQuery();
```

Everywhere the file reads `debouncedSearchQuery` (the two `useMemo` filters at ~58/115, their dependency arrays at ~102/169, and the `SearchEmptyState query=` prop at ~369) use `deferredQuery` instead.

Input spinner (lines 249-253): delete the `{isSearching && (<div …><Loader2 …/></div>)}` block entirely.

Result counter (lines 280-288): replace the ternary so the live region always shows the count:

```tsx
              <div className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                {`${filteredCaseStudies.length} case stud${filteredCaseStudies.length !== 1 ? 'ies' : 'y'} found`}
              </div>
```

Results (lines 315-338): delete the whole `{isSearching ? ( …skeleton grid… ) : (` branch and its closing `)}` so that only the real grid remains, and give that grid `aria-busy` plus a subtle pending cue:

```tsx
        {/* Results Grid/List */}
        <div
          aria-busy={isPending}
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4',
            isPending && 'opacity-70 transition-opacity'
          )}
        >
          {paginatedItems.map((caseStudy) => {
            …unchanged…
          })}
        </div>
```

Empty state and pagination (lines 367, 382): change `{!isSearching && filteredCaseStudies.length === 0 && (` to `{filteredCaseStudies.length === 0 && (` and `{!isSearching && filteredCaseStudies.length > 0 && (` to `{filteredCaseStudies.length > 0 && (`.

Then confirm with `grep -n "isSearching\|debouncedSearchQuery\|Skeleton\|useDebounce\|Loader2" src/components/CaseStudiesList.tsx` → nothing.

- [ ] **Step 4: Apply the same transformation to the other four**

For each of `AlgorithmList.tsx`, `IndustryList.tsx`, `PersonaList.tsx`, `src/components/ui/content-list.tsx`:
- same import changes (`Loader2` only if it becomes unused — check each file; `IndustryList` may use other lucide icons on the same import line);
- same state replacement (`useSearchQuery()`), `debouncedSearchQuery` → `deferredQuery` everywhere;
- delete the input spinner block;
- counter shows only the count (keep each file's own noun and pluralisation);
- delete the skeleton branch, keep the real grid with `aria-busy={isPending}` and the `cn(..., isPending && 'opacity-70 transition-opacity')` wrapper, preserving each file's own grid classes (`lg:grid-cols-3` in Algorithm/Industry/Persona, `md:grid-cols-2 lg:grid-cols-3` in content-list — do not "fix" them);
- drop the `!isSearching &&` guards on the empty state and pagination.

Run the grep from Step 3 against all five files → nothing.

- [ ] **Step 5: Verify**

Run: `npx vitest run src/components && npm run typecheck && npm run lint`
Expected: all pass; lint 0 errors (unused imports would fail lint — fix any). Then run `npx vitest run` (full).

- [ ] **Step 6: Commit**

```bash
git add src/components/CaseStudiesList.tsx src/components/AlgorithmList.tsx src/components/IndustryList.tsx src/components/PersonaList.tsx src/components/ui/content-list.tsx src/components/CaseStudiesList.test.tsx
git commit -m "refactor(search): keep results mounted and drop artificial delay on list pages"
```

---

### Task 3: Single live region, and GlobalSearch trim consistency

**Files:**
- Modify: `src/components/ui/search-empty-state.tsx` (the root element with `role="status" aria-live="polite"`)
- Modify: `src/components/ui/search-empty-state.test.tsx` (the test asserting those attributes)
- Modify: `src/hooks/useGlobalSearch.ts:136`
- Modify: `src/components/GlobalSearch.test.tsx` or `src/hooks/useGlobalSearch.test.ts` (whichever exists; create `src/hooks/useGlobalSearch.test.tsx` if neither covers the hook)

- [ ] **Step 1: Write the failing tests**

In `search-empty-state.test.tsx`, replace the test that asserts `role="status"` / `aria-live="polite"` with:

```tsx
  it('is not a second live region (the result counter already announces changes)', () => {
    const html = renderToStaticMarkup(<SearchEmptyState query="x" resourceName="items" />)
    expect(html).not.toContain('role="status"')
    expect(html).not.toContain('aria-live')
  })
```

For GlobalSearch, add a hook-level test (node env, `renderToStaticMarkup` cannot drive events, so test the pure decision): export a helper from `useGlobalSearch.ts`:

```ts
/** Whether a raw input value should open the results dropdown. */
export function shouldOpenResults(value: string): boolean {
  return value.trim().length >= 2;
}
```

and test it:

```ts
// src/hooks/useGlobalSearch.test.ts (create if absent; otherwise append)
import { describe, it, expect } from 'vitest'
import { shouldOpenResults } from './useGlobalSearch'

describe('shouldOpenResults', () => {
  it('ignores whitespace-only input', () => {
    expect(shouldOpenResults('  ')).toBe(false)
    expect(shouldOpenResults(' a ')).toBe(false)
    expect(shouldOpenResults(' ab')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ui/search-empty-state.test.tsx src/hooks/useGlobalSearch.test.ts`
Expected: both FAIL.

- [ ] **Step 3: Implement**

`search-empty-state.tsx`: remove `role="status"` and `aria-live="polite"` from the root element; add a one-line comment above it: `{/* Not a live region: the list's result counter (always mounted) announces "0 … found". */}`.

`useGlobalSearch.ts`: add the exported `shouldOpenResults` above the hook and change line 136 from `setIsOpen(query.length >= 2);` to `setIsOpen(shouldOpenResults(query));`.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/components/ui/search-empty-state.test.tsx src/hooks/useGlobalSearch.test.ts src/components/GlobalSearch.test.tsx && npm run typecheck && npm run lint`
Expected: all pass.

```bash
git add src/components/ui/search-empty-state.tsx src/components/ui/search-empty-state.test.tsx src/hooks/useGlobalSearch.ts src/hooks/useGlobalSearch.test.ts
git commit -m "fix(search): single live region and whitespace-safe open check"
```

---

### Task 4: CHANGELOG and gates

- [ ] **Step 1: CHANGELOG** — under `### Changed`:

```markdown
- **Listing page search** no longer waits 250 ms or swaps the results for skeleton cards while you type; results stay visible and update as you type (the filter is instant). The empty state and result count from the previous release are kept.
```

Under `### Fixed`:

```markdown
- **Search accessibility**: the empty-state panel is no longer a second live region (the result counter already announces changes), and the header search no longer opens an empty dropdown for whitespace-only input.
```

- [ ] **Step 2: Gates** — `npm test && npm run typecheck && npm run lint && npm run build`; all green, 383 pages.

- [ ] **Step 3: Commit, stop, report** — `git commit -m "docs: changelog for search loading-state rework"`. Do not push.
