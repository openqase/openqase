# OpenQase Health Check — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** General health check of the OpenQase project — audit security, engineering, design, SEO, and documentation; fix quick wins; create issues for larger work; record current status.

**Architecture:** 11 items split across 3 phases (audit → fix → document). Each task is a self-contained unit. Some tasks need user-provided screenshots of external dashboards (Supabase, Vercel, Google Search Console). Design review uses Playwright MCP for automated accessibility and visual audits.

**Tech Stack:** Next.js 15, Supabase, Tailwind CSS v3, next-themes (dark mode), Playwright MCP (browser automation), Lighthouse (performance/a11y), GitHub CLI

---

## Phase 1: Audit & Investigate

### Task 1: Security Check — Verify Clean State

**Files:**
- Read: `next.config.ts` (CSP config, lines 110-123)
- Read: `package.json` (dependencies)

**Step 1: Verify CSP is correct on production**

Run Playwright against `https://openqase.com`:
- Navigate to homepage
- Check page loads fully (not blank/spinner)
- Use `browser_evaluate` to read `document.querySelector('meta[http-equiv="Content-Security-Policy"]')` or check response headers

Expected: Page loads, `script-src` contains `'unsafe-inline'` but NOT `'unsafe-eval'`.

**Step 2: Run npm audit**

Run: `npm audit`
Expected: Only `serialize-javascript` HIGH (build-time, accepted risk). No new CVEs.

**Step 3: Confirm and note**

If clean, mark as done. If new issues, create GitHub issue.

---

### Task 2: Supabase Warnings Check

**Depends on:** User screenshots of Supabase dashboard

**Step 1: Request screenshots**

Ask user for screenshots of:
- Database → Advisor (index suggestions, performance)
- Authentication → Logs (recent activity)
- Settings → General (project health indicators)
- Any warnings/alerts visible in dashboard

**Step 2: Review screenshots**

Check for:
- Missing indexes on frequently queried columns
- Slow query warnings
- Failed auth attempts (brute force indicators)
- Storage/row count approaching limits
- Deprecated features or migration notices

**Step 3: Document findings**

Create GitHub issues for anything actionable. Note non-issues.

---

### Task 3: Vercel Analytics Check

**Depends on:** User screenshots of Vercel dashboard

**Step 1: Request screenshots**

Ask user for screenshots of:
- Project → Analytics (Web Vitals, page views)
- Project → Deployments (recent build logs, any failures)
- Project → Logs (runtime errors, edge function invocations)
- Project → Speed Insights (if enabled)

**Step 2: Review screenshots**

Check for:
- Core Web Vitals status (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Build warnings or increasing build times
- Runtime errors (500s, unhandled exceptions)
- Function invocation counts (cost implications)
- Bundle size trends

**Step 3: Document findings**

Create GitHub issues for anything actionable. Note non-issues.

---

### Task 4: General Software Engineering Check

**Files:**
- Read: `tsconfig.json` (strictness settings)
- Read: `vitest.config.ts` (test config)
- Grep: entire `src/` directory

**Step 1: Count remaining `any` casts**

Run: `grep -r "as any\|: any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test." | wc -l`

Document count and categorise (Supabase `fromTable()` helper vs real `any` usage).

**Step 2: Check TypeScript strictness**

Read `tsconfig.json`. Check if `strict: true` is enabled. If not, note which strict flags are missing.

**Step 3: Run test coverage report**

Run: `npx vitest run --coverage`

Document:
- Overall line/branch/function coverage percentages
- Files with 0% coverage (critical paths)
- Files below 80% threshold

**Step 4: Check for dead code**

Grep for unused exports, files not imported anywhere:
- Check `src/components/` for components not imported in any page
- Check `src/lib/` for utility functions not referenced
- Check `src/app/api/` for unused route files

**Step 5: Run build and check warnings**

Run: `npm run build 2>&1 | tee /tmp/build-output.txt`

Document:
- Any TypeScript warnings
- Bundle size of key pages
- Build time
- Deprecation warnings

**Step 6: Document findings**

Create summary of engineering health. Fix quick wins (< 5 min each). Create issues for larger items.

**Step 7: Commit any quick fixes**

```bash
git add -A
git commit -m "chore: engineering health check quick fixes"
```

---

### Task 5: SEO Check

**Files:**
- Read: `src/app/sitemap.ts` or `public/sitemap.xml`
- Read: `public/robots.txt`
- Read: `src/app/layout.tsx` (root metadata)
- Read: `src/lib/schema.ts` (structured data)

**Step 1: Check sitemap**

Read sitemap file. Verify:
- All public content types are included (case studies, algorithms, personas, industries, blog)
- Admin routes are excluded
- URLs are absolute and correct
- `lastmod` dates are present

**Step 2: Check robots.txt**

Read `public/robots.txt`. Verify:
- `Disallow: /admin`
- `Disallow: /api/` (or selective)
- `Allow: /` for public content
- Sitemap URL is listed

**Step 3: Audit meta tags via Playwright**

Navigate to 5 key pages and check:
- `<title>` exists and is descriptive (not "OpenQase" on every page)
- `<meta name="description">` exists and is unique per page
- `og:title`, `og:description`, `og:image` present
- `canonical` URL is set and correct

Pages to check:
1. Homepage (`/`)
2. Case study listing (`/case-study`)
3. Case study detail (any published case study)
4. Algorithm detail (any published algorithm)
5. Blog post (any published post)

**Step 4: Validate structured data**

Read `src/lib/schema.ts`. Check JSON-LD output for:
- Valid schema.org types (Article, Organization, BreadcrumbList, etc.)
- Required fields present
- No `</script>` injection risk (already fixed with `\u003c` encoding)

Optionally validate via Google Rich Results Test URL on a live page.

**Step 5: Run Lighthouse performance audit**

Use Playwright to navigate to homepage, then evaluate Lighthouse scores or check Core Web Vitals:
- LCP (Largest Contentful Paint) < 2.5s
- CLS (Cumulative Layout Shift) < 0.1
- FID/INP (Interaction to Next Paint) < 200ms

**Step 6: Document findings**

Create SEO findings report. Fix quick wins (missing meta tags, robots.txt issues). Create issues for larger items.

---

### Task 6: Backlinks & Affiliate Links Check

**Files:**
- Grep: all `https://` URLs in `src/` and `docs/`

**Step 1: Extract all external URLs from codebase**

Run: `grep -roh "https://[^\"' )\`]*" src/ docs/ public/ | sort -u > /tmp/external-urls.txt`

**Step 2: Check for dead links**

For each URL, use `curl -sI` to check HTTP status. Flag:
- 404 (dead)
- 301/302 (redirected — update to final URL)
- 5xx (server error — may be transient)

Skip known-good domains (github.com, supabase.com, vercel.com, etc.) to reduce noise.

**Step 3: Check internal links via Playwright**

Navigate the site and check for broken internal links:
- Click through main navigation items
- Check footer links
- Verify case study → algorithm → industry cross-links work

**Step 4: Request external link data from user**

Ask user for Google Search Console backlink report if available.

**Step 5: Document findings**

Create link health report. Fix broken links. Note any affiliate/partner link opportunities.

---

## Phase 2: Clean & Fix

### Task 7: Clean Up the Repo

**Step 1: Prune stale git branches**

Run: `git branch -r --merged origin/main | grep -v main | grep -v develop`

List branches that are merged and can be deleted. Ask user before deleting.

**Step 2: Review docs for outdated content**

Check each file in `docs/`:
- Is the information still accurate?
- Does it reference removed features or old patterns?
- Should it be archived to `docs/archive/`?

Key files to review:
- `docs/view-switcher-feature.md` — is this implemented?
- `docs/release-notes.md` — is it current?
- `docs/overview.md` — does it match README?
- `docs/component-library.md` — is it accurate?
- `docs/app-structure.md` — does it match actual structure?
- `docs/schema-overview.md` — is it current?

**Step 3: Check for dead files in src/**

Based on Task 4 dead code findings, remove:
- Unused components
- Orphaned test files
- Stale configuration files
- Empty or placeholder files

**Step 4: Review and triage GitHub issues**

Run: `gh issue list --limit 50 --state open`

For each issue:
- Is it still relevant?
- Has it been addressed but not closed?
- Should it be re-labelled or re-prioritised?

Close any that are done. Comment on stale ones.

**Step 5: Commit cleanup**

```bash
git add -A
git commit -m "chore: repo cleanup — remove dead files and outdated docs"
```

---

### Task 8: Design Review

This is the most involved task. Split into three sub-tasks.

#### Task 8a: Accessibility Audit

**Step 1: Set up Playwright for audit**

Navigate to `https://openqase.com` via Playwright MCP.

**Step 2: Take accessibility snapshots of key pages**

For each page below, use `browser_snapshot` to capture the full accessibility tree:
1. Homepage (`/`)
2. Case study listing (`/case-study`)
3. A case study detail page
4. Algorithm listing (`/paths/algorithm`)
5. An algorithm detail page
6. Blog listing (`/blog`)
7. A blog post
8. Sign in page (`/auth`)

Review each snapshot for:
- Heading hierarchy (h1 → h2 → h3, no skips)
- Landmark regions (nav, main, footer, aside)
- All images have alt text
- All form inputs have labels
- All interactive elements have accessible names
- ARIA attributes are used correctly

**Step 3: Keyboard navigation test**

On homepage, use `browser_press_key` with Tab to walk through:
- Can you reach all navigation items?
- Is focus visible on every element?
- Can you activate buttons/links with Enter?
- Does focus order make logical sense?
- Are there any focus traps?

**Step 4: Contrast and colour check**

Use `browser_evaluate` to run a basic contrast check or visually inspect screenshots for:
- Text on background contrast ratio ≥ 4.5:1 (WCAG AA)
- Large text ≥ 3:1
- Interactive element boundaries visible
- Focus indicators have sufficient contrast

**Step 5: Document accessibility findings**

Create categorised list:
- **Critical**: Blocks access for some users (missing labels, keyboard traps)
- **Major**: Significant usability issue (low contrast, missing headings)
- **Minor**: Best practice violations (redundant ARIA, inconsistent landmarks)

Create GitHub issue for accessibility fixes (links to existing #121).

---

#### Task 8b: Visual Polish & Dark/Light Mode Audit

**Step 1: Screenshot key pages in light mode at 3 breakpoints**

For each key page (homepage, case study listing, case study detail, algorithm detail, blog listing, blog post):

```
browser_resize(375, 812)   → screenshot as page-name-mobile-light.png
browser_resize(768, 1024)  → screenshot as page-name-tablet-light.png
browser_resize(1440, 900)  → screenshot as page-name-desktop-light.png
```

**Step 2: Switch to dark mode and repeat**

Use `browser_evaluate` to switch theme:
```javascript
document.documentElement.setAttribute('data-theme', 'dark')
```

Repeat screenshots:
```
page-name-mobile-dark.png
page-name-tablet-dark.png
page-name-desktop-dark.png
```

**Step 3: Audit dark mode issues**

Review dark mode screenshots for:
- Hard-coded white/light backgrounds that don't switch
- Text that becomes invisible (dark on dark)
- Images/icons that don't adapt (dark icons on dark background)
- Border/divider colours that disappear
- Card or container backgrounds that don't have dark variants
- Inconsistent dark mode application (some components dark, some light)

Note: Theme provider uses `attribute="data-theme"` and Tailwind uses `darkMode: ['selector', '[data-theme="dark"]']`. Check that components use `dark:` Tailwind classes consistently.

**Step 4: Audit visual consistency**

Review all screenshots for:
- Typography: consistent font sizes, line heights, font weights
- Spacing: consistent padding/margins, no visual jumps
- Colours: from design system or ad-hoc hex values?
- Components: do cards, buttons, badges look the same everywhere?
- Responsive: does layout adapt cleanly at each breakpoint?

**Step 5: Document visual findings**

Create categorised list with screenshot references:
- **Dark mode broken**: elements that don't adapt
- **Inconsistencies**: visual mismatches across pages
- **Responsive issues**: layout problems at specific breakpoints
- **Polish**: spacing, alignment, typography issues

Create GitHub issue for design fixes.

---

#### Task 8c: UX Flow Review

**Step 1: Walk user journey — content discovery**

Via Playwright, simulate:
1. Land on homepage → What do you see? Is the value proposition clear?
2. Navigate to Case Studies → Is the listing useful? Can you filter/sort?
3. Click a case study → Is the content well-structured? Are related items shown?
4. Navigate to related algorithm → Does the cross-reference work?
5. Back to homepage → Is it easy?

At each step, take a snapshot and note:
- Is the next action obvious?
- Is there enough context to understand what you're looking at?
- Are CTAs clear?

**Step 2: Walk user journey — blog**

1. Navigate to Blog from nav
2. Click a blog post
3. Can you navigate to related content from the post?
4. Can you get back to the blog listing?

**Step 3: Check mobile navigation**

Resize to 375px. Navigate the site:
- Does the hamburger menu work?
- Are touch targets big enough (44x44px)?
- Any horizontal scroll?
- Does content reflow properly?

**Step 4: Check empty/error states**

- Navigate to a non-existent page (e.g., `/case-study/does-not-exist`) — is there a 404 page?
- Check what happens with no search results
- Check loading states on dynamic pages

**Step 5: Document UX findings**

Create categorised list:
- **Broken**: Things that don't work
- **Confusing**: User would get lost or frustrated
- **Missing**: Expected functionality not present
- **Enhancement**: Would improve experience

Create GitHub issue for UX improvements.

---

## Phase 3: Document & Record

### Task 9: Clean Up the README

**Files:**
- Modify: `README.md`

**Step 1: Read current README**

Already read above. Issues to fix:
- Roadmap dates are outdated (v0.6.0 said "Feb 1" — it's now March)
- References `v040-quick-reference.md` in contributing section (may not exist)
- Emojis everywhere (user didn't request this style)
- Performance metrics from v0.5.0 may be outdated
- Import system details are too verbose for README
- Soft delete details are too verbose for README

**Step 2: Rewrite README**

Structure:
1. **Project description** — 2-3 sentences, value proposition
2. **Tech stack** — bullet list, no emojis
3. **Quick start** — clone, install, env, run (4 steps)
4. **Architecture** — 1 paragraph + link to docs
5. **Documentation** — categorised links to docs/
6. **Contributing** — link to CONTRIBUTING.md
7. **Roadmap** — current status + link to project plan
8. **License**

Keep it under 150 lines. Move verbose content to docs/.

**Step 3: Verify all doc links are valid**

Check every `./docs/` link in the new README resolves to an actual file.

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for clarity and accuracy"
```

---

### Task 10: Document the Technical Setup

**Files:**
- Modify: `docs/installation.md`
- Modify: `docs/environment-variables.md`
- Modify: `docs/deployment.md`
- Modify: various other docs

**Step 1: Audit docs/ for accuracy**

Read each key doc and check against actual codebase:
- `installation.md` — does the setup process still work as described?
- `environment-variables.md` — are all env vars listed? Any new ones missing?
- `deployment.md` — does it match current Vercel setup?
- `authentication.md` — already updated in security audit
- `tech-stack.md` — does it list current versions?

**Step 2: Fix inaccuracies**

Update any docs that reference:
- Old file paths
- Removed features
- Changed configuration
- Wrong version numbers

**Step 3: Fill gaps**

Check if these topics are documented:
- How ISR/revalidation works (documented in CLAUDE.md, may need a standalone doc)
- How to run tests (`npm test`, `npm run test:coverage`)
- How to add a new content type (end-to-end guide)
- Common development workflows

**Step 4: Clean up docs/README.md**

The docs index (`docs/README.md`) should list all docs with accurate descriptions. Remove links to docs that no longer exist.

**Step 5: Commit**

```bash
git add docs/
git commit -m "docs: update technical documentation for accuracy"
```

---

### Task 11: Record Current Status

**Step 1: Gather metrics**

Run these commands and record output:
```bash
# Test count
npx vitest run 2>&1 | tail -5

# Test coverage
npx vitest run --coverage 2>&1 | tail -30

# Build time and size
npm run build 2>&1 | tail -20

# Open issues by label
gh issue list --limit 100 --state open --json labels,title

# Dependency health
npm audit 2>&1
npm outdated 2>&1

# TypeScript health
npx tsc --noEmit --skipLibCheck 2>&1 | tail -10

# Lines of code
find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | tail -1
```

**Step 2: Write project health report**

Create: `docs/project-health-report-2026-03.md`

Sections:
- **Summary** — one paragraph overall assessment
- **Test Coverage** — stats from coverage report
- **Build Health** — build time, bundle size, warnings
- **TypeScript Health** — strict mode status, remaining `any` casts
- **Dependency Health** — CVE status, outdated packages
- **Open Issues** — count by category, priorities
- **Content Quality** — case study scores, publish-ready count
- **Design & Accessibility** — findings from Task 8
- **SEO** — findings from Task 5
- **Action Items** — prioritised list of what to tackle next

**Step 3: Update project plan**

Modify: `docs/openqase-project-plan.md`
- Update v0.6.0 milestone description with actual progress
- Adjust timeline estimates based on reality
- Note work completed in Feb (security audit, type safety, testing)
- Update v0.7.0+ milestones if needed

**Step 4: Update GitHub milestones and issues**

```bash
# Add new issues discovered during health check
gh issue create --title "..." --body "..." --label "..."

# Close any resolved issues
gh issue close N --comment "Resolved in ..."

# Update milestone assignments if needed
gh issue edit N --milestone "v0.7.0"
```

**Step 5: Commit**

```bash
git add docs/
git commit -m "docs: March 2026 project health report and status update"
```

---

## Execution Notes

### Parallelisation

In Phase 1, Tasks 4, 5, and 6 can run as parallel subagents since they're independent code audits. Tasks 2 and 3 block on user screenshots.

In Phase 2, Tasks 7 and 8 are sequential (cleanup before design review makes sense, but not strictly required).

In Phase 3, Tasks 9 and 10 can run in parallel. Task 11 must be last.

### Session Boundaries

This plan spans multiple sessions:
- **Session 1**: Tasks 1-6 (audits) — most can start immediately
- **Session 2**: Tasks 7-8 (cleanup + design review) — depends on Phase 1 findings
- **Session 3**: Tasks 9-11 (documentation + status) — depends on everything above

Tasks 2 and 3 may interleave with other work while waiting for user screenshots.

### Commits

Each task should produce its own commit(s). Create a single PR per session/phase for review.
