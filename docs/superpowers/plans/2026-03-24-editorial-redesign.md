# Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform OpenQase's frontend into an editorial design with serif headings, sidebar faceted filters, featured case study hero, and text-list homepage sections.

**Architecture:** Six sequential commits on `feature/editorial-redesign` branch in the `.worktrees/editorial-redesign` worktree. Tasks 1-3 are independent; Task 4-5 depend on Task 2 (relationship queries). Each commit is a self-contained, testable unit.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3.4, `next/font/google`, Radix UI, shadcn/ui, Supabase, Vitest

**Spec:** `docs/superpowers/specs/2026-03-24-editorial-redesign-design.md`

**Worktree:** `.worktrees/editorial-redesign` (branch: `feature/editorial-redesign`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/layout.tsx` | Modify | Replace Montserrat with Source Serif 4 font loading |
| `src/app/globals.css:58-60` | Modify | Update `--font-heading` CSS variable to serif fallback |
| `public/fonts/montserrat-*.woff2` | Delete | Remove unused Montserrat font files |
| `src/lib/relationship-queries.ts` | Modify | Add `getRelatedIndustries`, `getRelatedAlgorithms`, `getRelatedPersonas`, `getCaseStudyRelationshipMap` |
| `src/app/page.tsx` | Modify | Featured case study, stats ribbon, text-list latest sections |
| `src/components/FeaturedCaseStudy.tsx` | Create | Accent-border featured case study card |
| `src/components/LatestList.tsx` | Create | Reusable text-list section with dividers |
| `src/app/case-study/page.tsx` | Modify | Fetch relationship data, pass to CaseStudiesList |
| `src/components/CaseStudiesList.tsx` | Modify | Sidebar layout, faceted filter state, filter logic |
| `src/components/FacetedFilters.tsx` | Create | Checkbox filter groups with counts |
| `src/components/ui/sheet.tsx` | Create | shadcn Sheet component for mobile filters |
| `src/components/ui/content-card.tsx` | Modify | Update badge styling to amber pills |
| `CHANGELOG.md` | Modify | Add entries for all changes |

---

### Task 1: Typography Swap — Source Serif 4

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css:58-60`
- Delete: `public/fonts/montserrat-400.woff2`, `public/fonts/montserrat-500.woff2`, `public/fonts/montserrat-600.woff2`, `public/fonts/montserrat-700.woff2`

**Context:** The heading font is controlled by the CSS variable `--font-heading`, set in `globals.css:60`. It currently references `var(--font-montserrat)` which is set by the `localFont` in `layout.tsx:16-41`. The Tailwind config already references `var(--font-heading)` via the `heading` font family key (`tailwind.config.js:18`), so no Tailwind changes are needed. All `h1-h6` elements use `font-heading` via `globals.css:250`.

- [ ] **Step 1: Replace Montserrat with Source Serif 4 in layout.tsx**

In `src/app/layout.tsx`, replace the Montserrat local font import with Google Fonts Source Serif 4:

```tsx
// REMOVE these lines (16-41):
const montserrat = localFont({
  src: [
    { path: '../../public/fonts/montserrat-400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/montserrat-500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/montserrat-600.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/montserrat-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-montserrat',
  display: 'swap',
});

// ADD this import at top of file:
import { Source_Serif_4 } from 'next/font/google';

// ADD this constant (replacing the montserrat const):
const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});
```

Also update the `<html>` className on line 116:

```tsx
// BEFORE:
<html lang="en" suppressHydrationWarning className={`${montserrat.variable} ${openSans.variable}`}>

// AFTER:
<html lang="en" suppressHydrationWarning className={`${sourceSerif4.variable} ${openSans.variable}`}>
```

Remove the unused `localFont` import if it's only used by Montserrat (Open Sans also uses it — check first). Open Sans still uses `localFont` on line 44, so keep the import.

- [ ] **Step 2: Update CSS variable in globals.css**

In `src/app/globals.css`, change line 60:

```css
/* BEFORE: */
--font-heading: var(--font-montserrat), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* AFTER: */
--font-heading: var(--font-source-serif), Georgia, 'Times New Roman', serif;
```

- [ ] **Step 3: Verify no remaining Montserrat references**

```bash
grep -r "montserrat" src/ --include="*.tsx" --include="*.ts" --include="*.css" -l
```

Expected: No results (or only this plan file if stored in repo).

- [ ] **Step 4: Run tests and type-check**

```bash
npx vitest run
npx tsc --noEmit --skipLibCheck
```

Expected: All tests pass, no type errors related to fonts.

- [ ] **Step 5: Commit**

Note: `git rm` handles both index removal and working tree file deletion.

```bash
git add src/app/layout.tsx src/app/globals.css
git rm public/fonts/montserrat-400.woff2 public/fonts/montserrat-500.woff2 public/fonts/montserrat-600.woff2 public/fonts/montserrat-700.woff2
git commit -m "feat: replace Montserrat with Source Serif 4 for editorial typography"
```

---

### Task 2: Relationship Query Helpers

**Files:**
- Modify: `src/lib/relationship-queries.ts`

**Context:** This file (`'use server'`) has a private `getRelatedEntities()` helper that queries junction tables with a hardcoded `case_study_id` source column. It has 4 exported wrappers for quantum software/hardware/companies. We need 3 more wrappers plus a `getCaseStudyRelationshipMap()` that returns per-case-study grouped relationships. The map function needs to query junction rows (not just unique entities) so we can associate entities back to specific case studies.

- [ ] **Step 1: Add the three entity wrapper functions**

Append to `src/lib/relationship-queries.ts`, before the closing of the file:

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

- [ ] **Step 2: Add the relationship map function**

This function fetches junction rows (with both IDs) plus entity details, then groups by case study ID. Add after the wrappers:

```ts
export interface CaseStudyRelationships {
  industries: RelatedEntity[];
  algorithms: RelatedEntity[];
  personas: RelatedEntity[];
}

export async function getCaseStudyRelationshipMap(
  caseStudyIds: string[]
): Promise<Record<string, CaseStudyRelationships>> {
  if (!caseStudyIds || caseStudyIds.length === 0) return {};

  const supabase = await createServiceRoleSupabaseClient();

  // Fetch all junction rows in parallel (we need both IDs to group by case_study_id)
  const [industryJunctions, algorithmJunctions, personaJunctions] = await Promise.all([
    fromTable(supabase, 'case_study_industry_relations')
      .select('case_study_id, industry_id')
      .in('case_study_id', caseStudyIds),
    fromTable(supabase, 'algorithm_case_study_relations')
      .select('case_study_id, algorithm_id')
      .in('case_study_id', caseStudyIds),
    fromTable(supabase, 'case_study_persona_relations')
      .select('case_study_id, persona_id')
      .in('case_study_id', caseStudyIds),
  ]);

  // Collect unique entity IDs
  const industryIds = [...new Set(
    (industryJunctions.data || []).map((r: any) => r.industry_id).filter(Boolean)
  )] as string[];
  const algorithmIds = [...new Set(
    (algorithmJunctions.data || []).map((r: any) => r.algorithm_id).filter(Boolean)
  )] as string[];
  const personaIds = [...new Set(
    (personaJunctions.data || []).map((r: any) => r.persona_id).filter(Boolean)
  )] as string[];

  // Fetch entity details in parallel
  const [industries, algorithms, personas] = await Promise.all([
    industryIds.length > 0
      ? fromTable(supabase, 'industries').select('id, name, slug, description').in('id', industryIds)
      : Promise.resolve({ data: [], error: null }),
    algorithmIds.length > 0
      ? fromTable(supabase, 'algorithms').select('id, name, slug, description').in('id', algorithmIds)
      : Promise.resolve({ data: [], error: null }),
    personaIds.length > 0
      ? fromTable(supabase, 'personas').select('id, name, slug, description').in('id', personaIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Build lookup maps
  const industryMap = new Map((industries.data || []).map((e: any) => [e.id, e as RelatedEntity]));
  const algorithmMap = new Map((algorithms.data || []).map((e: any) => [e.id, e as RelatedEntity]));
  const personaMap = new Map((personas.data || []).map((e: any) => [e.id, e as RelatedEntity]));

  // Group by case study ID
  const result: Record<string, CaseStudyRelationships> = {};
  for (const id of caseStudyIds) {
    result[id] = { industries: [], algorithms: [], personas: [] };
  }

  for (const row of (industryJunctions.data || []) as any[]) {
    const entity = industryMap.get(row.industry_id);
    if (entity && result[row.case_study_id]) {
      result[row.case_study_id].industries.push(entity);
    }
  }

  for (const row of (algorithmJunctions.data || []) as any[]) {
    const entity = algorithmMap.get(row.algorithm_id);
    if (entity && result[row.case_study_id]) {
      result[row.case_study_id].algorithms.push(entity);
    }
  }

  for (const row of (personaJunctions.data || []) as any[]) {
    const entity = personaMap.get(row.persona_id);
    if (entity && result[row.case_study_id]) {
      result[row.case_study_id].personas.push(entity);
    }
  }

  return result;
}
```

- [ ] **Step 3: Export the RelatedEntity type**

The `RelatedEntity` interface (line 6-11) is currently not exported. Add `export` to it:

```ts
// BEFORE:
interface RelatedEntity {

// AFTER:
export interface RelatedEntity {
```

- [ ] **Step 4: Run tests and type-check**

```bash
npx vitest run
npx tsc --noEmit --skipLibCheck
```

Expected: All tests pass. No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/relationship-queries.ts
git commit -m "feat: add relationship query helpers for case study filtering"
```

---

### Task 3: Homepage Redesign

**Files:**
- Create: `src/components/FeaturedCaseStudy.tsx`
- Create: `src/components/LatestList.tsx`
- Modify: `src/app/page.tsx`

**Context:** The homepage (`src/app/page.tsx`) is a server component with `export const dynamic = 'force-static'`. It fetches case studies, blog posts, and content counts. Currently it shows a hero with search, an 8-stat grid, card-based latest sections, and a newsletter/community section. We're redesigning the stats and latest sections, and adding a featured case study.

#### Step group A: FeaturedCaseStudy component

- [ ] **Step 1: Create FeaturedCaseStudy component**

Create `src/components/FeaturedCaseStudy.tsx`:

```tsx
import Link from 'next/link';

interface FeaturedCaseStudyProps {
  title: string;
  description: string;
  slug: string;
  pills?: string[];
}

export function FeaturedCaseStudy({ title, description, slug, pills = [] }: FeaturedCaseStudyProps) {
  return (
    <div className="border-l-4 border-primary rounded-r-lg bg-primary/[0.03] p-6 md:p-8">
      <div className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
        Featured
      </div>
      <h3 className="font-heading text-xl md:text-2xl font-semibold leading-tight mb-3">
        <Link href={`/case-study/${slug}`} className="hover:text-primary transition-colors">
          {title}
        </Link>
      </h3>
      <p className="text-muted-foreground text-sm md:text-base line-clamp-2 mb-4">
        {description}
      </p>
      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pills.slice(0, 4).map((pill) => (
            <span
              key={pill}
              className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25"
            >
              {pill}
            </span>
          ))}
        </div>
      )}
      <Link
        href={`/case-study/${slug}`}
        className="text-sm font-semibold text-primary hover:underline"
      >
        Read case study →
      </Link>
    </div>
  );
}
```

#### Step group B: LatestList component

- [ ] **Step 2: Create LatestList component**

Create `src/components/LatestList.tsx`:

```tsx
import Link from 'next/link';

interface LatestListItem {
  title: string;
  description: string;
  href: string;
  pills?: string[];
  meta?: string;
}

interface LatestListProps {
  title: string;
  viewAllHref: string;
  viewAllCount?: number;
  items: LatestListItem[];
}

export function LatestList({ title, viewAllHref, viewAllCount, items }: LatestListProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline pb-3 mb-4 border-b-2 border-foreground">
        <h2 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          View all{viewAllCount ? ` ${viewAllCount}` : ''} →
        </Link>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">Coming soon.</p>
      )}
      <div className="divide-y divide-border">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block group py-3 first:pt-0">
            <h3 className="font-heading text-base md:text-lg font-semibold leading-snug mb-1 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">
              {item.description}
            </p>
            {item.pills && item.pills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.pills.slice(0, 3).map((pill) => (
                  <span
                    key={pill}
                    className="inline-block text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}
            {item.meta && (
              <span className="text-xs text-muted-foreground">{item.meta}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

#### Step group C: Rewrite page.tsx

- [ ] **Step 3: Update page.tsx — imports and data fetching**

In `src/app/page.tsx`, update imports. Remove unused Lucide icons and add new component imports:

```tsx
// REMOVE these unused icon imports:
// User, Building2, CircuitBoard, Github, Users, BookOpen, Database, ExternalLink, Code, Cpu, Factory, Handshake

// KEEP:
import Link from 'next/link';
import { ArrowRight, Github, Users } from 'lucide-react';
import { AutoSchema } from '@/components/AutoSchema';
import { SOCIAL_LINKS } from '@/lib/external-links';
import SearchCard from '@/components/SearchCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getBuildTimeContentList, fetchSearchData } from '@/lib/content-fetchers';
import type { BlogPost, DbCaseStudy } from '@/lib/types';
import { draftMode } from 'next/headers';

// ADD:
import { FeaturedCaseStudy } from '@/components/FeaturedCaseStudy';
import { LatestList } from '@/components/LatestList';
import { getCaseStudyRelationshipMap } from '@/lib/relationship-queries';
```

Add relationship data fetching after the existing `Promise.all` block:

```tsx
// After the existing data fetching and typing (lines 48-74)...

// Fetch relationships for latest case studies (for tag pills)
const caseStudyIds = latestCaseStudies.map(cs => cs.id);
const relationshipMap = caseStudyIds.length > 0
  ? await getCaseStudyRelationshipMap(caseStudyIds)
  : {};
```

- [ ] **Step 4: Update page.tsx — remove ecosystemStats and simplify primaryStats**

Remove the `ecosystemStats` array entirely (lines 105-130). The `primaryStats` array (lines 77-101) stays but will be rendered differently. Remove the `CategoryStats` interface and icon imports since we no longer need icons.

Replace the stats section with a simpler data structure:

```tsx
// Replace CategoryStats interface and primaryStats array with:
const stats = [
  { label: 'Case Studies', count: caseStudies.length },
  { label: 'Algorithms', count: algorithms.length },
  { label: 'Industries', count: industries.length },
  { label: 'Roles', count: personas.length },
];
```

Remove the data fetching for `quantumSoftware`, `quantumHardware`, `quantumCompanies`, `partnerCompanies` from the `Promise.all` (lines 54-58) since they're no longer used.

- [ ] **Step 5: Update page.tsx — rewrite JSX**

Replace the entire return JSX (from `return (` to the closing `);`). The new structure:

```tsx
return (
  <div className="flex flex-col">
    <AutoSchema type="organization" />
    <AutoSchema type="website" />
    <AutoSchema type="faq" />

    {/* Hero Section - Search First */}
    <section className="relative bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-4">
            Quantum Computing Case Studies
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            How industry leaders use quantum computing to solve real business problems.
            Open-source documentation with technical details.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-10">
          <SearchCard searchData={searchData} />
        </div>

        {/* Stats Ribbon — horizontal row between rules */}
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-8 md:gap-12 py-4 border-y border-border">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {stat.count}
                </div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Featured Case Study */}
    {latestCaseStudies.length > 0 && (
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <FeaturedCaseStudy
            title={latestCaseStudies[0].title}
            description={latestCaseStudies[0].description || 'Explore this quantum computing implementation.'}
            slug={latestCaseStudies[0].slug}
            pills={(() => {
              const rels = relationshipMap[latestCaseStudies[0].id];
              if (!rels) return [];
              return [
                ...rels.industries.map(i => i.name),
                ...rels.algorithms.map(a => a.name),
              ].slice(0, 4);
            })()}
          />
        </div>
      </section>
    )}

    {/* Latest Sections — text lists */}
    <section className="py-12 md:py-16 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <LatestList
            title="Latest Case Studies"
            viewAllHref="/case-study"
            viewAllCount={caseStudies.length}
            items={latestCaseStudies.slice(1).map((cs) => {
              const rels = relationshipMap[cs.id];
              const pills = rels
                ? [...rels.industries.map(i => i.name), ...rels.algorithms.map(a => a.name)].slice(0, 3)
                : [];
              return {
                title: cs.title,
                description: cs.description || 'Explore this quantum computing implementation.',
                href: `/case-study/${cs.slug}`,
                pills,
              };
            })}
          />

          <LatestList
            title="Latest Blog Posts"
            viewAllHref="/blog"
            items={blogPosts.map((post) => ({
              title: post.title,
              description: post.description || 'Read more about this topic.',
              href: `/blog/${post.slug}`,
              meta: post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : undefined,
            }))}
          />
        </div>
      </div>
    </section>

    {/* Newsletter & Community — unchanged */}
    <section className="py-12 md:py-16 px-4 bg-muted/30 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div>
            <NewsletterSignup />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-6">Open Source & Community</h2>
            <div className="space-y-4">
              <Link
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-card rounded-lg border border-border px-5 py-4 elevation-interactive hover:border-primary group"
              >
                <Github className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">Contribute on GitHub</h3>
                  <p className="text-sm text-muted-foreground">All code and content is open source</p>
                </div>
                <span className="sr-only">(opens in new tab)</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-4 bg-card rounded-lg border border-border px-5 py-4 elevation-interactive hover:border-primary group"
              >
                <Users className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">Submit a Case Study</h3>
                  <p className="text-sm text-muted-foreground">Share your quantum computing implementation</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);
```

- [ ] **Step 6: Run tests and type-check**

```bash
npx vitest run
npx tsc --noEmit --skipLibCheck
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/FeaturedCaseStudy.tsx src/components/LatestList.tsx src/app/page.tsx
git commit -m "feat: redesign homepage with featured case study, stats ribbon, and text lists"
```

---

### Task 4: Case Study Sidebar Faceted Filters

**Files:**
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/FacetedFilters.tsx`
- Modify: `src/app/case-study/page.tsx`
- Modify: `src/components/CaseStudiesList.tsx`

**Context:** The case study listing page (`/case-study`) is a server component that fetches flat `case_studies` rows and passes them to `CaseStudiesList` (a client component). Currently `CaseStudiesList` handles search, year filter, sort, and grid/list view. We need to add a sidebar with faceted checkbox filters for Industry, Algorithm, and Persona with cross-filtering counts.

**Note: Year filter removal.** The existing year filter dropdown is intentionally removed. The new faceted filters (Industry, Algorithm, Role) provide more useful filtering dimensions. A year-based filter can be added as a faceted group later if needed, but for now search covers year queries (e.g., typing "2024").

#### Step group A: Sheet component

- [ ] **Step 1: Create Sheet component**

Create `src/components/ui/sheet.tsx` using the standard shadcn pattern built on `@radix-ui/react-dialog` (already in `package.json`):

```tsx
'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: 'top' | 'bottom' | 'left' | 'right' }
>(({ side = 'left', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
        side === 'left' && 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        side === 'right' && 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
```

#### Step group B: FacetedFilters component

- [ ] **Step 2: Create FacetedFilters component**

Create `src/components/FacetedFilters.tsx`:

```tsx
'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useCallback } from 'react';

export interface FilterOption {
  id: string;
  name: string;
  count: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FacetedFiltersProps {
  groups: FilterGroup[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (groupKey: string, optionId: string, checked: boolean) => void;
  onClearAll: () => void;
}

const MAX_VISIBLE = 5;

export function FacetedFilters({ groups, activeFilters, onFilterChange, onClearAll }: FacetedFiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Clear all filters
        </button>
      )}

      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        const visibleOptions = isExpanded ? group.options : group.options.slice(0, MAX_VISIBLE);
        const hasMore = group.options.length > MAX_VISIBLE;

        return (
          <div key={group.key} role="group" aria-labelledby={`filter-group-${group.key}`}>
            <div
              id={`filter-group-${group.key}`}
              className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground mb-3"
            >
              {group.label}
            </div>
            <div className="space-y-2">
              {visibleOptions.map((option) => {
                const isChecked = (activeFilters[group.key] || []).includes(option.id);
                return (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-${group.key}-${option.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        onFilterChange(group.key, option.id, checked === true);
                      }}
                    />
                    <Label
                      htmlFor={`filter-${group.key}-${option.id}`}
                      className="text-sm flex-1 cursor-pointer leading-tight"
                    >
                      {option.name}
                    </Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {option.count}
                    </span>
                  </div>
                );
              })}
            </div>
            {hasMore && (
              <button
                onClick={() => toggleExpanded(group.key)}
                className="text-xs font-semibold text-primary hover:underline mt-2"
              >
                {isExpanded ? 'Show less' : `Show ${group.options.length - MAX_VISIBLE} more`}
              </button>
            )}
            {group !== groups[groups.length - 1] && (
              <hr className="border-border mt-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

#### Step group C: Wire up the server component

- [ ] **Step 3: Update case-study/page.tsx to fetch relationships**

Replace the contents of `src/app/case-study/page.tsx`:

```tsx
import { Metadata } from 'next';
import { getStaticContentList } from '@/lib/content-fetchers';
import { CaseStudiesList } from '@/components/CaseStudiesList';
import { getCaseStudyRelationshipMap } from '@/lib/relationship-queries';
import type { Database } from '@/types/supabase';
import type { CaseStudyRelationships } from '@/lib/relationship-queries';

export const metadata: Metadata = {
  title: 'Quantum Computing Case Studies | Real-World Business Applications - OpenQase',
  description: 'Explore real quantum computing implementations across industries. See how companies like HSBC, Google, and Mitsui apply quantum algorithms to solve business challenges.',
};

type CaseStudy = Database['public']['Tables']['case_studies']['Row'];

export const revalidate = 86400;

export default async function CaseStudyPage() {
  const caseStudies = await getStaticContentList<CaseStudy>('case_studies', {
    orderBy: 'updated_at',
    orderDirection: 'desc'
  });

  // Fetch relationships for all case studies (for sidebar filters and tag pills)
  const caseStudyIds = caseStudies.map(cs => cs.id);
  const relationshipMap = caseStudyIds.length > 0
    ? await getCaseStudyRelationshipMap(caseStudyIds)
    : {};

  return (
    <div className="min-h-screen">
      <div className="container-outer section-spacing">
        <div className="max-w-2xl mb-8 md:mb-12">
          <h1 className="mb-4">
            Case Studies
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Explore real-world applications of quantum computing across different industries and use cases.
          </p>
        </div>
        <CaseStudiesList
          caseStudies={caseStudies}
          relationshipMap={relationshipMap}
        />
      </div>
    </div>
  );
}
```

#### Step group D: Rewrite CaseStudiesList with sidebar

- [ ] **Step 4: Rewrite CaseStudiesList.tsx**

This is the largest change. Replace the contents of `src/components/CaseStudiesList.tsx`:

```tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Database } from '@/types/supabase';
import ContentCard from '@/components/ui/content-card';
import { ViewSwitcher } from '@/components/ui/view-switcher';
import { useViewSwitcher } from '@/hooks/useViewSwitcher';
import { useSortPersistence } from '@/hooks/useSortPersistence';
import { getContentMetadata } from '@/lib/content-metadata';
import { FacetedFilters } from '@/components/FacetedFilters';
import type { FilterGroup } from '@/components/FacetedFilters';
import type { CaseStudyRelationships } from '@/lib/relationship-queries';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SlidersHorizontal } from 'lucide-react';

type CaseStudy = Database['public']['Tables']['case_studies']['Row'];

interface CaseStudiesListProps {
  caseStudies: CaseStudy[];
  relationshipMap?: Record<string, CaseStudyRelationships>;
}

type SortOption = 'title-asc' | 'title-desc' | 'updated-asc' | 'updated-desc' | 'year-asc' | 'year-desc';

const CASE_STUDIES_SORT_OPTIONS = ['title-asc', 'title-desc', 'updated-asc', 'updated-desc', 'year-asc', 'year-desc'] as const;

export function CaseStudiesList({ caseStudies, relationshipMap = {} }: CaseStudiesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    industries: [],
    algorithms: [],
    personas: [],
  });

  const { viewMode, handleViewModeChange } = useViewSwitcher('case-studies-view-mode');
  const { sortBy, handleSortChange } = useSortPersistence('case-studies-sort', 'title-asc', CASE_STUDIES_SORT_OPTIONS);

  if (!caseStudies || caseStudies.length === 0) {
    return <div>No case studies found.</div>;
  }

  // Filter case studies by search and active faceted filters
  const filteredCaseStudies = useMemo(() => {
    return caseStudies
      .filter(cs => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            cs.title.toLowerCase().includes(query) ||
            (cs.description?.toLowerCase().includes(query) || false) ||
            (cs.year?.toString().includes(query) || false);
          if (!matchesSearch) return false;
        }

        // Faceted filters (AND between groups, OR within group)
        const rels = relationshipMap[cs.id];
        if (!rels) {
          // If no relationship data, only pass if no filters are active
          return Object.values(activeFilters).every(arr => arr.length === 0);
        }

        if (activeFilters.industries.length > 0) {
          const csIndustryIds = rels.industries.map(i => i.id);
          if (!activeFilters.industries.some(id => csIndustryIds.includes(id))) return false;
        }

        if (activeFilters.algorithms.length > 0) {
          const csAlgorithmIds = rels.algorithms.map(a => a.id);
          if (!activeFilters.algorithms.some(id => csAlgorithmIds.includes(id))) return false;
        }

        if (activeFilters.personas.length > 0) {
          const csPersonaIds = rels.personas.map(p => p.id);
          if (!activeFilters.personas.some(id => csPersonaIds.includes(id))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'title-asc': return a.title.localeCompare(b.title);
          case 'title-desc': return b.title.localeCompare(a.title);
          case 'updated-asc': return (new Date(a.updated_at || 0).getTime()) - (new Date(b.updated_at || 0).getTime());
          case 'updated-desc': return (new Date(b.updated_at || 0).getTime()) - (new Date(a.updated_at || 0).getTime());
          case 'year-asc': return (a.year || 0) - (b.year || 0) || a.title.localeCompare(b.title);
          case 'year-desc': return (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title);
          default: return a.title.localeCompare(b.title);
        }
      });
  }, [caseStudies, searchQuery, activeFilters, sortBy, relationshipMap]);

  // Compute cross-filtered counts for sidebar
  const filterGroups: FilterGroup[] = useMemo(() => {
    const computeCounts = (
      groupKey: string,
      getEntityIds: (rels: CaseStudyRelationships) => string[],
      getEntityName: (rels: CaseStudyRelationships, id: string) => string | undefined
    ): FilterGroup => {
      // Apply all filters EXCEPT the current group
      const otherFilteredStudies = caseStudies.filter(cs => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!cs.title.toLowerCase().includes(query) &&
              !(cs.description?.toLowerCase().includes(query)) &&
              !(cs.year?.toString().includes(query))) return false;
        }
        const rels = relationshipMap[cs.id];
        if (!rels) return Object.entries(activeFilters).every(([k, v]) => k === groupKey || v.length === 0);

        for (const [key, ids] of Object.entries(activeFilters)) {
          if (key === groupKey || ids.length === 0) continue;
          const csIds = key === 'industries' ? rels.industries.map(i => i.id)
            : key === 'algorithms' ? rels.algorithms.map(a => a.id)
            : rels.personas.map(p => p.id);
          if (!ids.some(id => csIds.includes(id))) return false;
        }
        return true;
      });

      // Count occurrences of each option
      const countMap = new Map<string, { name: string; count: number }>();
      for (const cs of otherFilteredStudies) {
        const rels = relationshipMap[cs.id];
        if (!rels) continue;
        for (const entityId of getEntityIds(rels)) {
          const name = getEntityName(rels, entityId);
          if (!name) continue;
          const existing = countMap.get(entityId);
          if (existing) existing.count++;
          else countMap.set(entityId, { name, count: 1 });
        }
      }

      const options = Array.from(countMap.entries())
        .map(([id, { name, count }]) => ({ id, name, count }))
        .sort((a, b) => b.count - a.count);

      const labels: Record<string, string> = {
        industries: 'Industry',
        algorithms: 'Algorithm',
        personas: 'Role',
      };

      return { key: groupKey, label: labels[groupKey] || groupKey, options };
    };

    return [
      computeCounts('industries',
        (rels) => rels.industries.map(i => i.id),
        (rels, id) => rels.industries.find(i => i.id === id)?.name
      ),
      computeCounts('algorithms',
        (rels) => rels.algorithms.map(a => a.id),
        (rels, id) => rels.algorithms.find(a => a.id === id)?.name
      ),
      computeCounts('personas',
        (rels) => rels.personas.map(p => p.id),
        (rels, id) => rels.personas.find(p => p.id === id)?.name
      ),
    ];
  }, [caseStudies, searchQuery, activeFilters, relationshipMap]);

  const handleFilterChange = useCallback((groupKey: string, optionId: string, checked: boolean) => {
    setActiveFilters(prev => ({
      ...prev,
      [groupKey]: checked
        ? [...(prev[groupKey] || []), optionId]
        : (prev[groupKey] || []).filter(id => id !== optionId),
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setActiveFilters({ industries: [], algorithms: [], personas: [] });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  const sidebarContent = (
    <FacetedFilters
      groups={filterGroups}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onClearAll={handleClearAll}
    />
  );

  return (
    <div className="flex gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Controls Row */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Mobile filter trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {Object.values(activeFilters).flat().length}
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetTitle>Filters</SheetTitle>
                  <div className="mt-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {sidebarContent}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1.5 block">
                Search case studies
              </Label>
              <Input
                id="search"
                type="search"
                placeholder="Search by title, description, or year..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>

            <div className="w-full sm:w-[200px]">
              <Label htmlFor="sort" className="text-sm font-medium mb-1.5 block">
                Sort by
              </Label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger id="sort" className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="year-desc">Year (Newest First)</SelectItem>
                  <SelectItem value="year-asc">Year (Oldest First)</SelectItem>
                  <SelectItem value="updated-desc">Recently Updated</SelectItem>
                  <SelectItem value="updated-asc">Least Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter pills + results count */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                {filteredCaseStudies.length} case stud{filteredCaseStudies.length !== 1 ? 'ies' : 'y'} found
              </div>
              {hasActiveFilters && (
                <>
                  {Object.entries(activeFilters).flatMap(([groupKey, ids]) =>
                    ids.map(id => {
                      const group = filterGroups.find(g => g.key === groupKey);
                      const option = group?.options.find(o => o.id === id);
                      return option ? (
                        <button
                          key={`${groupKey}-${id}`}
                          onClick={() => handleFilterChange(groupKey, id, false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                          aria-label={`Remove ${option.name} filter`}
                        >
                          {option.name} ×
                        </button>
                      ) : null;
                    })
                  )}
                </>
              )}
            </div>
            <ViewSwitcher value={viewMode} onValueChange={handleViewModeChange} />
          </div>
        </div>

        {/* Results Grid/List */}
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredCaseStudies.map((caseStudy) => {
            const metadata = getContentMetadata('case-studies', caseStudy, viewMode);
            const rels = relationshipMap[caseStudy.id];
            const badges = rels
              ? [...rels.industries.map(i => i.name), ...rels.algorithms.map(a => a.name)].slice(0, 3)
              : [];

            return (
              <ContentCard
                key={caseStudy.id}
                variant={viewMode}
                title={caseStudy.title}
                description={caseStudy.description || ''}
                badges={badges}
                href={`/case-study/${caseStudy.slug}`}
                metadata={{
                  lastUpdated: metadata.join(' • ') || undefined
                }}
              />
            );
          })}
        </div>

        {filteredCaseStudies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No case studies found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests and type-check**

```bash
npx vitest run
npx tsc --noEmit --skipLibCheck
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/sheet.tsx src/components/FacetedFilters.tsx src/app/case-study/page.tsx src/components/CaseStudiesList.tsx
git commit -m "feat: add sidebar faceted filters to case study listing"
```

---

### Task 5: Tag Pill Styling on Content Cards

**Files:**
- Modify: `src/components/ui/content-card.tsx`

**Context:** `ContentCard` already renders badges via the `badges` prop and `Badge` component. Task 4 already wires relationship data as badge strings. This task updates the visual styling from subtle outline badges to amber pill badges. Note: badges are now being passed from `CaseStudiesList` (wired in Task 4).

- [ ] **Step 1: Update badge styling in content-card.tsx**

In `src/components/ui/content-card.tsx`, replace all `Badge` usage with styled spans. The current code uses `Badge variant="outline"` with custom classes. Replace with the amber pill style.

In the grid variant (around line 116), replace:

```tsx
// BEFORE:
<Badge
  key={badge}
  variant="outline"
  className="text-[var(--text-secondary)] border-[var(--border)]"
>
  {badge}
</Badge>

// AFTER:
<span
  key={badge}
  className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25"
>
  {badge}
</span>
```

Apply the same change in the list variant (around line 79) and for the "+N more" badges.

For the "+N more" badges, use a slightly muted version:

```tsx
// BEFORE:
<Badge
  variant="outline"
  className="text-[var(--text-secondary)] border-[var(--border)]"
>
  +{remainingCount} more
</Badge>

// AFTER:
<span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
  +{remainingCount} more
</span>
```

After this change, the `Badge` import can be removed from the file.

- [ ] **Step 2: Run tests and type-check**

```bash
npx vitest run
npx tsc --noEmit --skipLibCheck
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/content-card.tsx
git commit -m "feat: update content card badges to amber pill style"
```

---

### Task 6: CHANGELOG and Final Verification

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update CHANGELOG.md**

Add entries to the `[Unreleased]` section:

```markdown
### Changed
- **Typography**: Replaced Montserrat with Source Serif 4 serif font for headings, giving the site an editorial feel
- **Homepage**: Redesigned stats ribbon as horizontal row, added featured case study card, replaced card grids with text lists
- **Case Study Listing**: Added sidebar faceted filters with checkbox filtering by Industry, Algorithm, and Role with counts
- **Content Cards**: Updated badge styling to amber pill design showing related industries and algorithms
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
npx tsc --noEmit --skipLibCheck
```

Expected: All 277+ tests pass. No type errors.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for editorial redesign"
```

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] `npx vitest run` — all tests pass
- [ ] `npx tsc --noEmit --skipLibCheck` — no type errors
- [ ] Homepage renders with serif headings, stats ribbon, featured card, text lists
- [ ] Case study listing shows sidebar filters on desktop, sheet on mobile
- [ ] Filtering works: select checkboxes, counts update, results filter
- [ ] Tag pills appear on content cards
- [ ] Dark mode works correctly (all new components use CSS variable colors)
- [ ] No Montserrat references remain in the codebase
