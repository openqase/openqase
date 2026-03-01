# OpenQase Health Check — March 2026

General health check across security, engineering, design, SEO, documentation, and project status. Medium depth: investigate properly, fix what we can, create issues for bigger work.

## Phase 1: Audit & Investigate

### 1. Security Check

Already completed in this session (Feb 28 security audit). Verify:
- CSP fix deployed and working (`unsafe-inline` restored, `unsafe-eval` removed)
- `npm audit` shows only the known `serialize-javascript` build-time CVE (accepted risk)
- No new vulnerabilities introduced

### 2. Supabase Warnings Check

User shares screenshots of:
- **Database Advisor** — index suggestions, slow queries, table bloat
- **Auth logs** — failed logins, suspicious activity
- **API usage** — rate limits, error rates
- **Storage** — database size, row counts
- **Warnings/alerts** — any dashboard warnings

Review findings together, create issues for anything actionable.

### 3. Vercel Analytics Check

User shares screenshots of:
- **Build logs** — warnings, bundle size trends
- **Analytics** — page views, bounce rates, Core Web Vitals
- **Error logs** — any runtime errors or 500s
- **Edge config** — caching behaviour, function invocations

Review findings together, create issues for anything actionable.

### 4. General Software Engineering Check

Automated audit of codebase health:
- **TypeScript strictness** — how many `any` casts remain, strict mode status
- **Dead code** — unused exports, unreachable files, stale imports
- **Test coverage** — run coverage report, identify gaps in critical paths
- **Build health** — warnings during `npm run build`, bundle size
- **Error handling** — catch blocks, error boundaries, graceful degradation
- **Performance patterns** — unnecessary re-renders, missing memoisation, N+1 queries

Output: findings list with severity, fix quick wins, create issues for larger items.

### 5. SEO Check

Audit of search engine optimisation:
- **Meta tags** — title, description, OG tags on all page types
- **Structured data** — JSON-LD schemas, validate with Google's tool
- **Sitemap** — `/sitemap.xml` exists, covers all public pages, excludes admin
- **Robots.txt** — correct allow/disallow rules
- **Canonical URLs** — no duplicate content issues
- **Performance** — Core Web Vitals (LCP, FID, CLS) via Lighthouse
- **Google Search Console** — user shares screenshots of coverage, errors, indexing

Output: findings list, fix what we can, document recommendations.

### 6. Backlinks & Affiliate Links Check

- Grep codebase for all external URLs, verify they're alive (no 404s/redirects)
- User shares Google Search Console backlink data or Ahrefs report
- Check for broken internal links across the site
- Verify any affiliate/partner links are correct and tracked

Output: link health report.

## Phase 2: Clean & Fix

### 7. Clean Up the Repo

- Remove dead files (unused components, stale configs, orphaned tests)
- Consolidate/deduplicate docs
- Prune stale git branches (remote and local)
- Clean up `.gitignore`, remove committed artifacts
- Review and close stale GitHub issues

### 8. Review the Design

Three-part design review covering accessibility, visual polish, and UX.

#### 8a. Accessibility (WCAG AA target)

**Automated testing:**
- Run Lighthouse accessibility audit on 5+ key pages via Playwright
- Run axe-core accessibility scans for WCAG AA violations
- Capture specific violations: contrast ratios, missing ARIA labels, heading hierarchy, landmark regions, alt text, form labels

**Manual testing:**
- Keyboard navigation walkthrough (tab order, focus visibility, skip links, focus traps in modals)
- Screen reader semantics check via Playwright accessibility snapshots
- Check all interactive elements are keyboard-accessible

**Output:** Accessibility score per page, categorised violations, fix plan.

#### 8b. Visual Polish & Dark/Light Mode

**Systematic screenshots:**
- Capture every key page type at 3 breakpoints (mobile 375px, tablet 768px, desktop 1440px)
- Capture each in both light and dark mode (6 screenshots per page)
- Key pages: homepage, case study listing, case study detail, algorithm listing, algorithm detail, blog listing, blog post, about, sign in, admin dashboard

**Dark mode audit:**
- Investigate current dark mode implementation (Tailwind `dark:` classes, theme provider)
- Identify what's broken: missing dark variants, hard-coded colours, images without dark alternatives
- Check colour token consistency across components

**Visual consistency:**
- Typography scale: are heading sizes, body text, and spacing consistent?
- Colour palette: are colours from the design system or ad-hoc?
- Component consistency: do cards, buttons, inputs look the same everywhere?
- Spacing: consistent padding/margins, no visual "jumps"

**Output:** Screenshot gallery with annotations, list of inconsistencies, dark mode fix plan.

#### 8c. UX Flow

**Page-by-page review:**
- Navigation: is the menu clear, does it work on mobile?
- Information hierarchy: can you find what you're looking for?
- CTAs: are call-to-action buttons clear and well-placed?
- Empty states: what happens when there's no content?
- Loading states: are there proper loading indicators?
- Error states: what happens when things go wrong?

**User journey mapping:**
- Homepage → Case study listing → Case study detail → Related content
- Homepage → Algorithm → Related case studies
- Homepage → Blog → Blog post
- Sign in → Admin dashboard → Edit content → Publish

**Mobile responsiveness:**
- Test all journeys at mobile breakpoint
- Check touch targets are large enough (44x44px minimum)
- Verify no horizontal overflow or hidden content

**Output:** UX findings with severity, improvement recommendations.

## Phase 3: Document & Record

### 9. Clean Up the README

Rewrite README.md to reflect current state:
- Clear project description and value proposition
- Tech stack overview
- Quick start / local development setup
- Architecture overview (static generation, ISR, admin CMS)
- Link to detailed docs
- Contributing guidelines (or link to CONTRIBUTING.md)
- License

Keep it concise — detailed docs live in `docs/`.

### 10. Document the Technical Setup

Ensure `docs/` covers:
- **Local development setup** — step by step, from clone to running
- **Environment variables** — complete list with descriptions
- **Deployment** — Vercel config, build process, env var setup
- **Architecture** — data flow, static generation, revalidation, auth
- **Database** — Supabase setup, migrations, RLS policies

Review existing docs for accuracy, remove outdated information, fill gaps.

### 11. Record Current Status

Three deliverables:

**a) Project health report** (`docs/project-health-report-2026-03.md`):
- Test coverage stats
- Open issue summary by category
- Tech debt inventory
- Content quality status (scores, publish-ready count)
- Dependency health (outdated, CVEs)
- Performance metrics (build time, bundle size, page load)

**b) Update project plan** (`docs/openqase-project-plan.md`):
- Revise v0.6.0 milestone based on actual progress
- Update timeline estimates
- Note completed work and remaining gaps

**c) Update GitHub milestones:**
- Ensure issues are assigned to correct milestones
- Close completed items
- Add new issues discovered during this health check

## Execution Order

Items within each phase can be partially parallelised:

```
Phase 1 (audit):
  [1. Security ✓] → already done
  [2. Supabase] ← needs user screenshots
  [3. Vercel]   ← needs user screenshots
  [4. Engineering] ← I can start immediately
  [5. SEO]         ← I can start immediately
  [6. Backlinks]   ← I can start, user adds external data

Phase 2 (fix):
  [7. Repo cleanup]    ← after Phase 1 findings
  [8. Design review]   ← after Phase 1, uses Playwright

Phase 3 (document):
  [9. README]          ← after cleanup
  [10. Technical docs] ← after cleanup
  [11. Status report]  ← last, captures everything
```

Items 4, 5, and 6 can run in parallel at the start while waiting for Supabase/Vercel screenshots.
