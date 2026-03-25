# Editorial Redesign — Design Spec

## Goal

Transform the OpenQase frontend from its current generic aesthetic into an editorial, McKinsey/HBR-style design through typography, layout, and component changes.

## Decisions

| Question | Decision |
|----------|----------|
| Heading font | Source Serif 4 (Google Fonts, variable, optical sizing) |
| Serif scope | Broad: hero titles, section headings (H1-H3), and card titles |
| Body font | Open Sans (unchanged) |
| Case study listing filters | Sidebar faceted filters with checkboxes and counts |
| Homepage featured case study | Accent border card (left amber border, subtle background tint) |
| Stats ribbon | Horizontal 4-stat row between thin rules (trimmed from 8 stats) |
| Homepage "Latest" sections | Text lists with dividers and tag pills (replaces card grids) |
| Tag pills | Shown throughout — case study cards, listing items, homepage |

## Architecture

Four commits on a single feature branch (`feature/editorial-redesign`). Changes 1-3 are independent and revertable. Change 4 depends on change 3 (needs relationship data).

1. **Typography swap** — font loading + CSS variables + Tailwind config (independent)
2. **Homepage redesign** — featured hero, stats ribbon, latest sections (independent)
3. **Case study sidebar filters** — faceted filter component + listing layout + relationship data fetching (independent)
4. **Tag pills on content cards** — passes relationship data from #3 as badges on ContentCard + pill styling update (depends on #3)

**Note:** The pill styling update in #4 (changing Badge appearance) is independent, but wiring relationship data to badges requires #3's data plumbing. These are combined in one commit for simplicity.

## 1. Typography Swap

### What changes

Replace Montserrat with Source Serif 4 as the heading font. Source Serif 4 is a variable font with optical sizing (8-60pt) — it adjusts letter shapes based on the rendered size, improving readability at both display and text sizes.

### Loading strategy

Switch from `next/font/local` (Montserrat WOFF2) to `next/font/google` for Source Serif 4. This gives us:
- Automatic subsetting by Google Fonts
- Variable font with weight range 400-700 and optical sizing
- `font-display: swap` for performance

Open Sans stays as a local font (already loaded).

### Files to modify

- **`src/app/layout.tsx`**:
  - Remove Montserrat `localFont` import and `src` array
  - Add `import { Source_Serif_4 } from 'next/font/google'`
  - Configure as variable font: `Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', display: 'swap' })` — no explicit weight list needed; as a variable font, all weights (including 500 used by `font-medium` headings) are available via interpolation
  - Replace `montserrat.variable` with `sourceSerif4.variable` in `<html>` className

- **`src/app/globals.css`**:
  - Change `--font-heading` from `var(--font-montserrat), system-ui, ...sans-serif` to `var(--font-source-serif), Georgia, 'Times New Roman', serif`
  - Note: fallback stack changes from sans-serif to serif. The `var(--font-source-serif)` resolves to `next/font`'s generated font-family name, so a named `'Source Serif 4'` fallback is not needed.

- **`tailwind.config.js`**: No changes needed — already references `var(--font-heading)` via the `heading` font family.

### What NOT to change

- Open Sans loading (stays as local WOFF2)
- `--font-sans` CSS variable
- Any component classes — they already use `font-heading` via Tailwind or the CSS `h1-h6` rules

### Cleanup

The Montserrat WOFF2 files in `public/fonts/` (`montserrat-400.woff2`, `montserrat-500.woff2`, `montserrat-600.woff2`, `montserrat-700.woff2`) can be deleted after the swap since nothing will reference them.

## 2. Homepage Redesign

### 2a. Featured Case Study (new component)

An accent-border card below the search area, above the stats ribbon. Shows one prominent case study to draw readers in.

**Component:** `src/components/FeaturedCaseStudy.tsx` (server component)

**Layout:**
- Left border: 4px solid, amber/primary color
- Background: subtle primary tint (`bg-primary/[0.03]`)
- Border radius: right side only (`rounded-r-lg`)
- Content: "FEATURED" uppercase label, serif title, description (2-line clamp), tag pills, "Read case study →" link

**Data source:** The first case study from the existing `latestCaseStudiesData` fetch in `page.tsx`. No new database queries needed. Later, a `featured` boolean flag could be added to the CMS, but that's out of scope.

**Relationship data for pills:** Currently `page.tsx` fetches case studies via `getBuildTimeContentList('case_studies')` which returns flat rows without relationships. To show tag pills on the featured card, we need to fetch relationships for the featured case study. Options:
- Use `getStaticContentWithRelationships()` for just the first case study (adds one query)
- Or pass empty pills initially and add them in a follow-up

**Recommendation:** Fetch relationships for the featured case study using `getStaticContentWithRelationships()` by slug. This is one additional query at build time, cached by `React.cache()`.

### 2b. Stats Ribbon (redesign)

Replace the current 8-stat interactive grid with a static horizontal row of 4 primary stats.

**Current:** 8 stats in a 2×4 grid, each a clickable `<Link>` with icon + count + label in a bordered card.

**New:** 4 stats (Case Studies, Algorithms, Industries, Roles) in a centered flex row between thin horizontal rules (`border-t`). Each stat: large number (accent color, font-bold) + small uppercase label below. No icons, no links, no cards.

**Ecosystem stats (Software, Hardware, Companies, Partners):** Removed from the ribbon. These are secondary and can be discovered through navigation. If needed later, they could appear in the footer or a separate section.

**Data:** Same `primaryStats` array already computed in `page.tsx`, just rendered differently.

### 2c. Latest Sections (redesign)

Replace card-based latest sections with editorial text lists.

**Current:** Two-column grid, each column has `space-y-3` of bordered cards with fixed 140px height.

**New:** Two-column grid with:
- **Section header:** Serif title with bold 2px bottom border + "View all N →" link aligned right
- **List items:** Separated by 1px rules. Each item:
  - Serif title (Source Serif 4, `font-heading`)
  - One-line description in muted text
  - Case studies: tag pills (industries/algorithms)
  - Blog posts: date string instead of pills

**Responsive:** On mobile (`< lg`), columns stack vertically.

**Data:** Same data already fetched. For tag pills on case study items, we need relationship data. Similar to the featured card, we can batch-fetch relationships for the 5 latest case studies using `getRelatedEntities` from `relationship-queries.ts`, or use the single-item fetcher per slug.

**Recommendation:** Add new exported wrapper functions to `relationship-queries.ts` for fetching industry and algorithm relations by case study IDs (see section 3 for details), then call them for the 5 latest case study IDs in parallel. This matches the existing pattern.

### Files to modify

- **`src/app/page.tsx`**: Major restructure of the JSX. Remove ecosystem stats, add featured card, redesign stats and latest sections.
- **New `src/components/FeaturedCaseStudy.tsx`**: Server component for the accent-border featured card.
- **`src/lib/relationship-queries.ts`**: Add new exported wrappers `getRelatedIndustries(caseStudyIds)` and `getRelatedAlgorithms(caseStudyIds)` — see section 3 for details.

### Compatibility notes

- `page.tsx` has `export const dynamic = 'force-static'`. The new relationship queries are server-side fetches during SSG, same as the existing `getBuildTimeContentList` calls. `force-static` is compatible.
- Pill styling uses `bg-primary/10`, `text-primary`, `border-primary/25` which adapt automatically in dark mode via the CSS variable system (primary color differs between themes). No dark-mode-specific overrides needed.

### What NOT to change

- Search bar component (`SearchCard`)
- Newsletter/community section at the bottom
- Data fetching strategy (still static generation)

## 3. Case Study Listing — Sidebar Faceted Filters

### Layout change

Convert from full-width content to sidebar + content layout:
- Sidebar: 240px fixed width on desktop
- Content area: fills remaining space
- Mobile: sidebar collapses to a toggleable panel (button to show/hide)

### Sidebar content

Three filter groups, each with checkboxes:

1. **Industry** — checkbox list with counts (e.g., "Finance (12)")
2. **Algorithm** — checkbox list with counts
3. **Role (Persona)** — checkbox list with counts

Each group:
- Uppercase label header (0.7rem, `tracking-wider`)
- Checkbox items sorted by count descending
- Separated by thin rules between groups
- "Show more" toggle if > 5 items in a group

### Active filters

Above the results grid: removable pill chips showing active filters (e.g., "Finance ×", "QAOA ×"). Clicking × removes that filter. "Clear all" link when any filters active.

### Results area

- Results count: "Showing N of M case studies"
- Existing search bar, sort dropdown, and view switcher stay
- Card grid/list view unchanged

### Data requirements

The current `case-study/page.tsx` fetches flat `case_studies` rows. For faceted filters with counts, we need relationship data for all case studies.

**Approach:** In the server component (`case-study/page.tsx`), fetch relationships alongside the case studies using the batch pattern:
1. Fetch all published case studies (existing)
2. Extract all case study IDs
3. Batch-fetch from junction tables: `algorithm_case_study_relations`, `case_study_industry_relations`, `case_study_persona_relations`
4. Fetch entity names/slugs for each related ID set
5. Pass a relationship map to `CaseStudiesList` as a new prop: `relationships: Record<string, { industries: {id, name, slug}[], algorithms: {id, name, slug}[], personas: {id, name, slug}[] }>`

This adds 3 junction queries + 3 entity lookups at build time (6 queries total), all parallelizable. With ISR at 24h, this is negligible.

### Client-side filtering

`CaseStudiesList.tsx` currently handles search, year filter, and sort client-side. Add:
- State: `activeFilters: { industries: string[], algorithms: string[], personas: string[] }` (storing IDs)
- Filter logic: case study passes if it matches ALL active filter groups (AND between groups, OR within a group)
- Count computation: **true cross-filtering** — when computing counts for a filter group, apply all other active filters but NOT the current group's filters. Example: if "Finance" and "QAOA" are active, the Industry counts reflect only QAOA-related case studies, while the Algorithm counts reflect only Finance-related case studies. This gives users accurate feedback about what combinations exist.

**Cross-filter algorithm (pseudocode):**
```
for each filterGroup (e.g., "industries"):
  otherFilters = activeFilters excluding this group
  baseSet = caseStudies filtered by search + otherFilters
  for each option in filterGroup:
    count = baseSet.filter(cs => cs has this option).length
```

### Relationship data fetching

`src/lib/relationship-queries.ts` has a private `getRelatedEntities()` helper that hardcodes `case_study_id` as the source junction column. This works for our use case. Add three new exported wrappers following the existing pattern (e.g., `getRelatedQuantumSoftware`):

```ts
export async function getRelatedIndustries(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'case_study_industry_relations',
    foreignKey: 'industry_id',
    targetTable: 'industries',
    selectFields: 'id, name, slug, description',
    label: 'industries',
  });
}

export async function getRelatedAlgorithms(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'algorithm_case_study_relations',
    foreignKey: 'algorithm_id',
    targetTable: 'algorithms',
    selectFields: 'id, name, slug, description',
    label: 'algorithms',
  });
}

export async function getRelatedPersonas(caseStudyIds: string[]): Promise<RelatedEntity[]> {
  return getRelatedEntities<RelatedEntity>(caseStudyIds, {
    junctionTable: 'case_study_persona_relations',
    foreignKey: 'persona_id',
    targetTable: 'personas',
    selectFields: 'id, name, slug, description',
    label: 'personas',
  });
}
```

**Note:** These are Server Action functions (file has `'use server'`). They can be called from server components at build time — Server Actions are regular async functions on the server side; the RPC mechanism only activates when called from client components. This is consistent with the existing usage in API routes.

**Note:** `getRelatedEntities` hardcodes `case_study_id` as the source junction column. Expanding it for other source entity types (e.g., algorithm-centric queries) is out of scope.

Additionally, we need per-case-study junction data (not just unique entities) for building the relationship map. Add a helper that returns junction rows with both IDs:

```ts
export async function getCaseStudyRelationshipMap(
  caseStudyIds: string[]
): Promise<Record<string, { industries: RelatedEntity[], algorithms: RelatedEntity[], personas: RelatedEntity[] }>> {
  // Fetch all junction rows + entity details in parallel, then group by case_study_id
}
```

### Files to modify

- **`src/app/case-study/page.tsx`**: Add relationship data fetching via `getCaseStudyRelationshipMap()`, pass to component
- **`src/components/CaseStudiesList.tsx`**: Add sidebar layout, filter state, filter logic
- **New `src/components/FacetedFilters.tsx`**: Reusable sidebar filter component (checkbox groups with counts)
- **`src/lib/relationship-queries.ts`**: Add `getRelatedIndustries`, `getRelatedAlgorithms`, `getRelatedPersonas`, and `getCaseStudyRelationshipMap`

### Responsive behavior

- **Desktop (≥ 1024px):** Sidebar visible, content area beside it
- **Tablet/Mobile (< 1024px):** Sidebar hidden. A "Filters" button in the toolbar opens a Sheet (slide-in panel from the left) using the existing `@radix-ui/react-dialog` dependency via shadcn's Sheet component. The sheet overlays with a backdrop scrim, traps focus, and closes on backdrop click or Escape.

### Accessibility

- Filter groups use `role="group"` with `aria-labelledby` pointing to the group title
- Checkboxes are native `<input type="checkbox">` with associated `<label>` elements
- Active filter pills have an accessible "Remove filter" button with `aria-label="Remove {filterName} filter"`
- Mobile filter sheet traps focus and returns focus to trigger button on close
- Results count region uses `aria-live="polite"` (already present in existing code)

### What NOT to change

- Sort options and persistence hooks
- View switcher (grid/list)
- ContentCard component internals (pills handled in change #4)
- URL/routing — filters are client-state only (no URL params for now)

## 4. Tag Pills on Content Cards

### What changes

Show up to 3 relationship pills on each case study card. Currently `badges` prop is passed as `[]` in `CaseStudiesList.tsx`.

### Implementation

With relationship data now available from change #3, pass industry and algorithm names as badges:

```tsx
// In CaseStudiesList.tsx
const relationships = relationshipMap[caseStudy.id] || { industries: [], algorithms: [] };
const badges = [
  ...relationships.industries.map(i => i.name),
  ...relationships.algorithms.map(a => a.name),
].slice(0, 3);
```

### Pill styling

Update `ContentCard` badge styling to use the amber pill style:
- Background: `bg-primary/10`
- Text: `text-primary`
- Border: `border border-primary/25`
- Border radius: `rounded-full`
- Size: `text-xs font-semibold px-2.5 py-0.5`

This replaces the current outline badge style which is subtle and hard to read.

### Files to modify

- **`src/components/CaseStudiesList.tsx`**: Pass relationship data as badges
- **`src/components/ui/content-card.tsx`**: Update badge styling to amber pill style

## Out of Scope

- CMS `featured` flag for case studies
- URL-based filter state (shareable filter URLs)
- Algorithm/industry/persona listing page redesigns (same pattern can be applied later)
- Dark mode color tweaks beyond what naturally follows from the theme system
- Mobile-specific design refinements beyond responsive breakpoints
- Navigation redesign
- Footer redesign
