# OpenQase CMS — Phase 0 Discovery Findings

**Date:** 2026-04-27 (revised after reviewer feedback + empirical follow-up)
**Author:** Claude Code (with parallel research agents)
**Status:** Discovery complete — vision conversation pending
**Audience:** Project owner (overnight read)
**Companion:** `2026-04-27-empirical-followup.md` — measured data on content shape and ISR baseline

---

## TL;DR

You have already specced the right architectural refactor. It's sitting on `feature/cms-engine` (March 23) and is ~70% migrated. The blocker was attention, not code: a parallel project (Marqov) pulled focus and the work paused. Resuming requires unblocking what exists, not redesigning it.

**Empirical follow-up materially de-risked Phase B.** Three of the larger Phase B risks collapsed once measured: the migration is genuinely a one-shot script (live content is plain prose, not the rich tangle the original framing assumed); the search/jsonb compatibility concern is now a strict improvement on existing broken behaviour; the ISR cost is a non-issue with substantial headroom. This Phase B is narrower and lower-risk than earlier framing implied.

Before any further architectural change, fix three security findings that are exploitable today (Tier 1: A, B, C). Two more are Critical-in-defense-in-depth terms but not exploitable in the default path — fix them too, but don't let them dominate the urgency.

Then **finish the existing engine work**, **add the editor + block-based content model the existing spec doesn't address**, and stop. Don't restart from scratch.

The destination — what the system should look like once shipped — resembles **Payload's authoring surface bolted onto your existing Supabase backend**. That's a description of where you're heading, not a constraint to design around. The actual goal is: editorial workflow that doesn't fight you, and structured content that's queryable.

---

## What's New Since You Last Looked

You wrote two design specs five weeks ago:

1. **`docs/superpowers/specs/2026-03-23-cms-engine-design.md`** — config-driven content types, shared CRUD, generic operations layer. Linked to GitHub Issue #201.
2. **`docs/superpowers/specs/2026-03-24-editorial-redesign-design.md`** — Source Serif 4 typography, faceted filters, tag pills. Visual only.

Both have implementation plans under `docs/superpowers/plans/`. Both have unmerged feature branches with substantial code. The CMS engine spec is genuinely good — it matches almost exactly what an independent architectural audit would propose today.

**Stall reason (now confirmed):** Marqov pulled focus, and the OpenQase rebuild was paused, not abandoned. Not a technical blocker. This matters because it means the existing specs are still valid inputs — we don't need to rederive the architecture, only to add the things they don't cover.

What the existing specs cover ✅
- Engine refactor: `defineContentType()` + registry + transport-agnostic operations
- Visual editorial polish (typography, listing layout, tag pills)
- Migration strategy: incremental, type by type
- Deletion plan: ~4,000 lines deleted, ~800 added

What the existing specs don't cover ❌
- **The editor.** Still plain `<Textarea>` + markdown. The visual redesign doesn't touch authoring.
- **The content model.** Body remains a markdown string. No blocks, no Portable Text, no typed embeds.
- **Drafts / versioning / scheduling.** No version history table; no `publish_at`.
- **Search.** Existing tsvector trigger has a column-name bug (see below) — not from the engine spec, but interacts directly with the content-model change.
- **Security.** Several findings live in middleware, RLS, and server actions independent of the engine.

---

## Security — Two Tiers, Not One

Full report: `2026-04-27-security-audit.md`. The headline urgency split:

### Exploitable today (fix in the security PR)

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| A | **Public GET API leaks unpublished/soft-deleted content.** `fetchContentBySlug` has no `published`/`deleted_at` filter; reachable anonymously via `/api/case-studies?slug=<draft>`. | High | `src/cms/operations/fetch.ts:7-39`; `src/middleware.ts:61-63` |
| B | **`DEV_MODE_AUTH_BYPASS` not gated by `NODE_ENV`.** Substring host check (`includes('localhost')`) matches `evil-localhost.example.com`. If env var ever leaks to prod → full admin bypass. | High | `src/middleware.ts:121-127` |
| C | **Excessive table-level GRANTs to `anon`/`authenticated`.** RLS is the only line of defense; one dropped policy or disabled RLS → wide open. | High | `migrations/20260110101340_remote_schema.sql:928+` |

A is a direct data-leak today. B is a misconfiguration risk that becomes a full admin bypass if it ever fires. C is a defense-in-depth weakening that compounds any missed RLS policy. All three are short to fix.

### Critical in defense-in-depth terms (fix in the same PR; don't let "Critical" framing pull attention from A/B/C)

| # | Finding | Severity | Notes |
|---|---------|----------|-------|
| D | **Server actions don't re-check admin role.** Defense-in-depth gap. Middleware does block the route in the default path; the exploit chain requires B or a Next.js middleware misconfiguration. | Critical via misconfig | `src/app/admin/*/[id]/actions.ts` (×9) |
| E | **`deletion_audit_log` readable by every authenticated user.** RLS policy `USING (true)`. Audit `metadata` JSONB contains full content snapshots of deleted records — but only authenticated users; signup is gated. | Medium | `migrations/20260111_create_deletion_audit_log.sql:29-33` |

D is the kind of finding that's "Critical" because the impact is admin-level data write *if* the chain ever closes — but the chain doesn't close in the default path. Worth fixing immediately as cheap insurance, not panic.

### Architectural choice, not a fix — `USING (true)` on junction tables

The audit also flagged that all junction tables have `for select to public using (true)`, leaking soft-deleted relationship data. The "fix" is RLS-side filtering via subquery into the parent table — but this contradicts CLAUDE.md's explicit decision to filter relationships in JS for performance reasons.

This is an **architectural tradeoff, not a one-line fix:**

- **Option 1 — RLS-side filtering.** Defense-in-depth via the database. Adds a subquery on every relationship read. Performance cost depends on join cardinality; unmeasured.
- **Option 2 — Keep JS filtering, document the leak surface.** Accept that junction rows leak (they only contain IDs, not content), and prevent dereferencing via finding A. The data exposed is "this UUID relates to this UUID," which is meaningful but not catastrophic if A is fixed.

This decision belongs in Phase 1, not Phase A. Surface in the vision conversation.

### Smaller findings (not in the urgency table)

- `setup_admin_role(text)` SQL function lacks `REVOKE` on EXECUTE
- Public GET handlers use service-role client (single missed filter = exposure; same root cause as A)
- Bulk delete endpoints accept arbitrary `id`/`ids` without UUID validation
- 5 moderate npm advisories (transitive postcss / GHSA-qx2v-qp2m-jg93)
- Email PII may reach Sentry (`sendDefaultPii` not set to false)
- No rate limiting on admin write endpoints

---

## What the Codebase Looks Like Today

Full report: `2026-04-27-architectural-audit.md`. Headline findings:

**The half-finished rebuild is real and salvageable.**
- `feature/cms-engine` worktree: engine is *working*, tests pass, 6 of 9 content types migrated. Personas, industries, blog_posts not yet migrated. Estimated **3–5 days** to finish migration.
- `feature/editorial-redesign` worktree: orthogonal frontend work, also unmerged.
- The admin UI rewrite (Issue #202 referenced in the spec) was never started. Still 9 per-type client components, ~3,576 lines, ~80% overlap.

**Two parallel patterns coexist that should be one.**
- `src/lib/content-fetchers.ts` (single-item nested) and `src/lib/relationship-queries.ts` (batch). CLAUDE.md justifies both as intentional. In practice they confuse new code paths and the batch one (with proper Set-based dedup) is strictly better. Standardise on it.

**Body-content search is broken in production.** Not "infrastructure to improve" — broken. Empirical finding (full detail in the follow-up memo): every content table has a `ts_content tsvector` column with a GIN index and a `BEFORE INSERT OR UPDATE` trigger. The trigger reads `NEW.content`, but only `blog_posts` has a column named `content`. Every other content type uses `main_content`. So for 8 of 9 content types, GIN indexes contain only title + description text — body content has been silently un-indexed for the lifetime of the trigger. Search code at `src/lib/content-fetchers.ts:366` runs `.ilike` against `main_content` directly, which masks the bug because the slow path returns correct results. **Nobody has noticed,** which itself is a useful prior on how much editorial weight body-text search carries today. The fix is part of Phase A (item A7) and the trigger update folds into the Phase B body-format change at no extra cost.

**The existing CMS engine spec has at least one schema mismatch.** The spec lists `algorithms.technical_details` as a field, but that column doesn't exist in the database. If there's one mismatch, there are likely others. Worth a 30-minute cross-check of every field declared in the spec against actual DB columns before A2 starts. Cheap; prevents discovering schema drift mid-migration.

**Clear dead/duplicate code to remove.**
- `src/types/supabase.ts` vs `src/types/supabase-new.ts` (1443 / 1444 lines, both define `Database`). When picking one, write a comment explaining why so the next person doesn't re-ask the question.
- `src/lib/supabase.ts` marked `@deprecated` — 8 importers still use it
- `src/lib/dual-newsletter-service.ts` (414 lines) — likely an incomplete migration; `testConnections()` never called, `preferredService` config unused. **Verify no env-toggled live caller before deleting.**
- `/docs/archive/` rebuild docs documenting bugs that still exist

**Plain textarea + markdown for authoring.** Single biggest editorial weakness. Not addressed by either existing spec.

**What's actually good — keep:**
- The CMS engine design (`src/cms/`) — declarative, Zod-derived, well-tested in isolation
- Both Supabase client factories (`src/lib/supabase-server.ts`)
- The batch relationship pattern (`src/lib/relationship-queries.ts`) — once the duplicate is gone
- Soft-delete RPCs + audit log infrastructure
- `src/lib/content-validation.ts` — good UX scaffold; expand to in-editor

---

## What "Excellent" Looks Like — Competitive Insights

Full report: `2026-04-27-competitive-research.md`. Patterns worth stealing, ranked by leverage:

1. **Typed-blocks content model.** Replace markdown body with `Block[]` stored as `jsonb`. Steal Payload's Blocks pattern or Sanity's Portable Text. Unlocks structured rendering, queryability, per-block UI. **Single highest-leverage change.** Empirical evidence (see follow-up memo) suggests the v1 block taxonomy needs only **3 types** (RichText, Heading, Citation), not the 8 originally listed.
2. **Notion-style block editor.** Slash menu, drag handles, floating toolbar. Use **BlockNote** to ship in weeks; **TipTap** for fully custom (4–6 weeks). Skip Lexical. **First task in Phase B is a half-day BlockNote spike** prototyping one OpenQase-specific custom block (e.g. `algorithm-ref`) to confirm the customisation ceiling clears before committing to the editor choice.
3. **Schema-as-code drives admin forms too.** OpenQase already has `RELATIONSHIP_MAPS`. The existing engine spec extends this to the API layer; extend further to drive admin UI from the same registry.
4. **Drafts / autosave / version history.** A `content_versions` table + `restore_version()` RPC. Backend-only change with no editor dependencies. Doubles as a safety net for the Phase B block migration.
5. **Slash-menu "cards" for typed embeds.** `/case-study` inserts a styled reference card; `/algorithm` embeds an algorithm card; `/figure` adds a captioned image. Maps directly onto your relationship graph. Future-authoring, not legacy-migration.
6. **Scheduled publishing.** `publish_at` timestamp + cron worker. No editor dependencies.
7. **Inline create from relationships.** Editing a case study → create a missing industry without navigating away.
8. **Click-to-edit live preview.** Sanity Presentation pattern. Higher effort, defer to Phase C or later.
9. **Reusable shared blocks (Citation, etc.)** across content types. Payload Blocks idea.
10. **Components for repeating field groups.** Strapi Components.

**Editor stack recommendation:** **BlockNote** for v1, contingent on the Phase B spike clearing.

**Don't:**
- Adopt Ghost — its content model can't represent OpenQase's relational shape.
- Self-host Directus on top of Supabase — two admin tools fighting.
- Migrate to Payload wholesale — rewrites your content layer when you only need to upgrade the authoring surface.

---

## Synthesised Recommendation: Refactor → Author → Polish

This isn't a rebuild. It's three sequenced, independently shippable phases on top of what you have.

Estimates are ranges (low / expected / high) with the dominant-budget item per phase called out. **Note (2026-04-27):** the ranges were sized for stop-and-go attention competing with Marqov. With the owner's sustained-focus commitment, realistic actuals trend toward the low end of each range — the high-end values mostly priced in context-reload overhead from interruption. The day budget freed up by sustained focus is **reinvested in quality** (test coverage, code review for the `publicQuery()` invariant, polish on the relationship-picker abstraction), not used to compress the schedule below the quality floor.

### Phase A — Land what you've already specced + de-risking pieces

**Goal:** unblock the existing rebuild work, close the security gaps, and ship two visible improvements (drafts + scheduling) before touching the editor.

| # | Item | Range (days) | Notes |
|---|---|---|---|
| A0 | **Schema cross-check (pre-flight for A2).** Walk every field declared in `docs/superpowers/specs/2026-03-23-cms-engine-design.md` against actual DB columns for all 9 content types. We already know `algorithms.technical_details` is missing; find the rest before A2 hits a surprise. | 0.5 | Block A2 if mismatches > 3. |
| A1 | **Security PR.** Findings A, B, C, D, E above. Plus `setup_admin_role` REVOKE. | 1–2 | Independent of everything; ship first. |
| A2 | **Finish `feature/cms-engine`.** Migrate personas, industries, blog_posts. Resolve `supabase-new.ts` (with explanatory comment). Update 8 importers off deprecated `supabase.ts`. | 3–5 | Engine work mostly done; risk is in the import surgery. |
| A3 | **Generic admin form from registry.** ★ Dominant budget. Replace 9 per-type client components with one generic `<SchemaForm config={...}>` reading from the registry. Must support per-type validation, custom field types (the engine's `selectFields` admin pages currently ignore), and an injection point for the future block editor. | **8–12** | High end if the relationship picker abstraction proves messy. |
| A4 | **Consolidate relationship patterns.** Delete `content-fetchers.ts` single-item pattern; standardise on the batch pattern. | 1–2 | Mostly mechanical. |
| A5 | **Drafts + version history.** `content_versions` table; every save writes a version; `restore_version()` action. **Pulled forward from Phase B** because it has no editor dependency and provides a safety net for Phase B's migration. | 2–3 | |
| A6 | **Scheduled publishing.** `publish_at` column + Vercel Cron job; revalidation already wired. **Pulled forward from Phase B.** | 1–2 | |
| A7 | **Fix broken-in-production body-text search.** Not a migration — a regression fix. Fix the `update_ts_content` trigger column-name bug so 8 of 9 content types finally index body content. Switch search code from `.ilike` to `.textSearch('ts_content', ...)`. **Backfill method (refined 2026-04-28):** compute `ts_content` directly in a single SQL statement using the same `setweight(...) || setweight(...) || setweight(...)` expression as the (now-fixed) trigger, scoped `WHERE deleted_at IS NULL`. **Do not** use the no-op-update pattern (`SET id = id`) — the existing `update_updated_at_column` trigger on these tables would bump `updated_at` and cascade into ISR revalidation noise plus audit-log churn. Direct UPDATE is also safer because it doesn't depend on the trigger logic that's about to change. | 1–2 | Trigger update folds into Phase B's block-derived text extraction. |

**Phase A total: ~18–29 days** (single dev). Dominant items: A3 (admin form) and A2 (engine completion). **Phase A is the longest and riskiest of the three phases; A3 alone is the single largest item across the whole plan.** Where attention should focus first: the relationship-picker abstraction inside A3 — that's the part most likely to push to the high end of the range. Phase B and Phase C are now well-defined and shorter; the project succeeds or fails primarily on whether A3 lands cleanly.

**Acceptance criteria (testable, not a feeling):**
- A0 schema cross-check completed; spec divergences documented or repaired before A2 starts.
- Findings A, B, C, D, E no longer reproducible against the dev server.
- All 9 content types managed via the same generic admin form.
- `git grep "from '@/lib/supabase'"` returns zero results outside the deprecated file's own re-exports (or the file is deleted).
- A save action writes a row to `content_versions`; `restore_version()` round-trip restores prior state.
- A scheduled `publish_at` time triggers publication via cron in dev.
- Search query for body-only text returns matching items via `.textSearch`.
- ISR revalidation latency measured on the deployed Vercel environment (not local). Whatever number this produces becomes the **baseline** for Phase B's "within 2× of baseline" check — the 2× threshold is calibrated against deployed reality, not the local 18s build.

### Phase B — Make authoring excellent

**Goal:** turn the CMS into a tool writers want to use.

| # | Item | Range (days) | Notes |
|---|---|---|---|
| B1 | **BlockNote customisation spike.** Half-day prototype of one OpenQase-specific block (e.g. `algorithm-ref`) to confirm customisation ceiling. **Gates the rest of Phase B.** | 0.5 | If the spike fails, decision is BlockNote-with-fewer-custom-blocks vs TipTap-from-scratch. |
| B2 | **Block-based content model.** Schema change: `body jsonb` storing `Block[]`. v1 block types: `RichTextBlock`, `HeadingBlock` (or heading-as-style on text block — see note), `CitationBlock`. Migration: split-on-H2 for `main_content`; parse `[^N]:` footnotes from `academic_references` into `Citation[]`. Update `update_ts_content` trigger to derive text from blocks. Keep `main_content` populated for one release post-migration; renderer reads from `body` if non-empty, else falls back to `main_content`. | 4–7 | |
| B3 | **BlockNote editor in admin form.** Slash menu inserts the v1 block types. Floating toolbar for inline formatting. | 4–6 | Range depends on B1 outcome. |
| B4 | **Inline relationship create.** "+ Add new industry" inside the relationship picker. | 1–2 | |
| B5 | **One Phase 1 OpenQase-specific block** (most likely `algorithm-ref` or `case-study-ref`). Validates the slash-menu "card" UX with a real content type. | 2–3 | |

**Phase B total: 12–18 days.** Dominant items: B2 (model + migration) and B3 (editor integration).

**Acceptance criteria:**
- Spike (B1) result documented; editor decision either confirmed or revised.
- Migration script run against a staging copy: every record has a non-empty `body jsonb`; rendered output on public pages is visually equivalent to the markdown version (manual diff on 5 records).
- **Migration is idempotent**: re-running the script against already-migrated data leaves rows unchanged (or fails loudly), no data loss either way.
- **Migration is reversible** for one release: `main_content` is preserved; a renderer feature flag flips back to markdown without restoring from backup. Rollback path tested before B2 is considered done.
- Editing a record in the new editor produces a `Block[]` round-trip without lossy conversion.
- Search for body-only text still works after migration (tsvector now derives from block text).
- Re-measured ISR revalidation latency on the deployed environment is within 2× of the Phase A baseline (whatever that turned out to be — calibrated against the A-phase deployed measurement, not the local 18s build).

> **Modeling note for B2:** `HeadingBlock` as a separate type vs. heading-as-style on a text block (a `level` attribute) is a small modeling choice, not a settled answer. Both Portable Text and BlockNote use the latter. Migration regex is identical either way. Decide during B1 based on which the editor's slash-menu UX expresses more naturally.

### Phase C — Polish & visual

| # | Item | Range (days) | Notes |
|---|---|---|---|
| C1 | **Land `feature/editorial-redesign`** (Source Serif 4 + faceted filters + tag pills). | 2–4 | Spec already complete; this is execution. |
| C2 | **Block rendering on public pages.** Per-block React components map to the typed `Block[]`. | 3–5 | |
| C3 | **Live preview** (split-pane iframe). Click-to-edit deferred to v3. | 2–3 | |

**Phase C total: 7–12 days.**

**Acceptance criteria:**
- Editorial redesign visually shipped on production.
- Each v1 block type has a public renderer; no record falls back to "raw markdown" on the live site.
- Editor preview and live render diverge by no more than typography styling.

---

## Open Questions — For the Phase 1 Vision Conversation

The original list had 7. Three are now answered or resolved by empirical data; four remain for the vision conversation.

**Resolved:**
- ~~Why did the March rebuild stall?~~ → Marqov pulled focus; not technical.
- ~~Migration appetite (one big RichTextBlock vs proper blocks)?~~ → Empirical content shape says split-on-H2 + parse academic_references is the right migration; no need for a "good enough" fallback.
- ~~Block model ambition (8 types vs minimal)?~~ → 3 types for v1, layer more as authoring needs emerge.

**Remaining for Phase 1:**
1. **Authoring audience + drafts model** (merged — they're conditional). Just you for the foreseeable future, or a wider editorial team / contributors? If solo: linear version history is fine (Payload-style). If team: branching becomes worth its cost (Sanity-style `drafts.foo` shadow documents) and concurrent-edit prevention matters. Answer the audience question first; the drafts model falls out of it.
2. **`USING (true)` on junctions** — RLS-side filtering (defense-in-depth, perf cost) or keep JS filtering with finding A patched (perf, narrower defense)? **Measure before deciding** — a sample query both ways against realistic data tells you what the cost actually is.

The "BlockNote vs TipTap" question that previously lived here is folded into B1's spike outcome. Default path: BlockNote (the spike confirms or revises). If B1 fails, the choice between TipTap (4–6 week custom build) and deferring rich text entirely is a contingent decision spelled out in the abandonment-thresholds table below — not an open question for the vision conversation.

---

## Decision Points & Abandonment Thresholds

This is a side project competing with Marqov for attention. To avoid sunk-cost momentum if any phase goes sideways, here are the pre-committed thresholds for stopping and re-planning rather than pushing through.

| Trigger | Action |
|---|---|
| **A3 (generic admin form) exceeds 15 days** | Stop. Re-evaluate whether a registry-driven generic form is the right abstraction at this scale, or whether a less ambitious "shared form components, per-type wrapper" pattern is better suited to OpenQase's content-type count. |
| **A0 schema cross-check finds >3 mismatches** | Pause A2. The existing engine spec needs a focused revision pass before the migration restarts. |
| **B1 (BlockNote spike) fails for OpenQase-specific blocks** | **Default: defer rich text — ship v1 with a markdown editor.** Block model and storage shape still ship; only the in-editor surface defers. Per the vision spec (Decision 5), TipTap is *not* the default fallback because a 4–6 week custom-editor build doesn't fit a side-project budget. TipTap only viable after a follow-up spike confirms 6-week budget — by definition, only when Marqov is in a quiet phase. |
| **B2 migration produces non-equivalent rendering on >5% of sampled records** | Pause Phase B. The block model needs more types or the migration needs a richer parser. Re-spec before continuing. |
| **Three weeks pass with zero progress on the active phase** | Originally written as a soft-pause tripwire when Marqov competed for attention. **Updated 2026-04-27: owner has committed sustained focus to this work.** The tripwire is retained as insurance but is no longer load-bearing. If it ever fires, treat it as a signal that something has *changed* — re-evaluate whether attention budget shifted or a real blocker emerged, rather than auto-pausing. The phases are still independently shippable; the safety still applies. |
| **Phase A finishes but Phase B still feels too big** | Ship Phase A as v0.5 (engine + admin + drafts/scheduling + security). Phase B becomes its own scoped project with a fresh spec and budget. |

These aren't binding rules. They're tripwires. The point is to make the "should we stop and re-plan?" question concrete and pre-decided, instead of relying on in-the-moment judgment when momentum is hardest.

---

## Appendices

- `2026-04-27-empirical-followup.md` — measured content shape + ISR baseline + search-trigger bug
- `2026-04-27-architectural-audit.md` — full architectural audit
- `2026-04-27-security-audit.md` — full security audit, all 15 categories
- `2026-04-27-competitive-research.md` — Ghost / Sanity / Payload / Strapi / Directus / editor stacks

Existing specs (referenced, not duplicated):
- `docs/superpowers/specs/2026-03-23-cms-engine-design.md`
- `docs/superpowers/specs/2026-03-24-editorial-redesign-design.md`
- `docs/superpowers/plans/2026-03-23-cms-engine.md`
- `docs/superpowers/plans/2026-03-24-editorial-redesign.md`
