# OpenQase CMS — Phase 0 Discovery Findings

**Date:** 2026-04-27
**Author:** Claude Code (with parallel research agents)
**Status:** Discovery complete — vision conversation pending
**Audience:** Project owner (overnight read)

---

## TL;DR

You have already specced the right architectural refactor. It's sitting on `feature/cms-engine` (March 23) and is ~70% migrated. The blocker is not what to build — it's that the work never landed. Before any further architectural change, fix five specific security findings (one Critical, three High). Then **finish the existing engine work**, **add a real editor + block-based content model** (the existing spec doesn't address this), and stop. Don't restart from scratch.

The competitive research and codebase audit converge on one recommendation: **OpenQase needs a Payload-class authoring surface bolted onto its existing Supabase backend, not a CMS migration.**

---

## What's New Since You Last Looked

You wrote two design specs five weeks ago:

1. **`docs/superpowers/specs/2026-03-23-cms-engine-design.md`** — config-driven content types, shared CRUD, generic operations layer. Linked to GitHub Issue #201.
2. **`docs/superpowers/specs/2026-03-24-editorial-redesign-design.md`** — Source Serif 4 typography, faceted filters, tag pills. Visual only.

Both have implementation plans under `docs/superpowers/plans/`. Both have unmerged feature branches with substantial code. The CMS engine spec is genuinely good — it matches almost exactly what an independent architectural audit would propose today. **You don't need a new architecture spec; you need to finish the one you have, plus three things it doesn't cover.**

What the existing specs cover ✅
- Engine refactor: `defineContentType()` + registry + transport-agnostic operations
- Visual editorial polish (typography, listing layout, tag pills)
- Migration strategy: incremental, type by type
- Deletion plan: ~4,000 lines deleted, ~800 added

What the existing specs don't cover ❌
- **The editor.** Still plain `<Textarea>` + markdown. The visual redesign doesn't touch authoring.
- **The content model.** Body remains a markdown string. No blocks, no Portable Text, no typed embeds.
- **Drafts / versioning / scheduling.** No version history table; no `publish_at`.
- **Security.** Several findings live in middleware, RLS, and server actions independent of the engine.
- **Why the rebuild stalled.** Process question, not technical.

---

## CRITICAL — Fix Before Anything Else

These are the security findings the owner should see first. Full report: `2026-04-27-security-audit.md`.

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| 1 | **Server actions don't re-check admin role.** All `'use server'` functions write via service-role client with no `requireAdmin()` inside. | Critical | `src/app/admin/*/[id]/actions.ts` (×9) |
| 2 | **Public GET API leaks unpublished/soft-deleted content.** `fetchContentBySlug` has no `published`/`deleted_at` filter; reachable anonymously via `/api/case-studies?slug=<draft>`. | High | `src/cms/operations/fetch.ts:7-39`; `src/middleware.ts:61-63` |
| 3 | **`DEV_MODE_AUTH_BYPASS` not gated by `NODE_ENV`.** Substring host check (`includes('localhost')`) matches `evil-localhost.example.com`. If env var ever leaks to prod → full admin bypass. | High | `src/middleware.ts:121-127` |
| 4 | **Excessive table-level GRANTs to `anon`/`authenticated`.** RLS is the only line of defense; one dropped policy or disabled RLS → wide open. | High | `migrations/20260110101340_remote_schema.sql:928+` |
| 5 | **`deletion_audit_log` readable by every authenticated user.** RLS policy `USING (true)`. Audit `metadata` JSONB contains full content snapshots of deleted records. | Medium | `migrations/20260111_create_deletion_audit_log.sql:29-33` |

These are independent of the engine work and can be fixed today as a small dedicated PR. Recommend doing this first.

Additional findings (Medium/Low) in the full audit:
- Junction-table SELECT policies are `USING (true)` (leaks soft-deleted relationship data)
- `setup_admin_role(text)` SQL function lacks REVOKE
- Public GET handlers use service-role client (single missed filter = exposure)
- Bulk delete endpoints accept arbitrary `id`/`ids` without UUID validation
- 5 moderate npm advisories (transitive postcss / GHSA-qx2v-qp2m-jg93)
- Email PII may reach Sentry (`sendDefaultPii` not set to false)
- No rate limiting on admin write endpoints

---

## What the Codebase Looks Like Today

Full report: `2026-04-27-architectural-audit.md`. Headline findings:

**The half-finished rebuild is real and salvageable.**
- `feature/cms-engine` worktree: engine is *working*, tests pass, 6 of 9 content types migrated. Personas, industries, blog_posts not yet migrated. Estimated 3–5 days to finish migration.
- `feature/editorial-redesign` worktree: orthogonal frontend work, also unmerged.
- The admin UI rewrite (Issue #202 referenced in the spec) was never started. Still 9 per-type client components, ~3,576 lines, ~80% overlap.

**Two parallel patterns coexist that should be one.**
- `src/lib/content-fetchers.ts` (single-item nested) and `src/lib/relationship-queries.ts` (batch). CLAUDE.md justifies both as intentional. In practice they confuse new code paths and the batch one (with proper Set-based dedup) is strictly better. Standardize on it.

**Clear dead/duplicate code to remove.**
- `src/types/supabase.ts` vs `src/types/supabase-new.ts` (1443 / 1444 lines, both define `Database`)
- `src/lib/supabase.ts` marked `@deprecated` — 8 importers still use it
- `src/lib/dual-newsletter-service.ts` (414 lines) — likely an incomplete migration; `testConnections()` never called, `preferredService` config unused
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

Full report: `2026-04-27-competitive-research.md`. Patterns worth stealing, ranked:

1. **Typed-blocks content model.** Replace markdown body with `Block[]` stored as `jsonb`. Steal Payload's Blocks pattern or Sanity's Portable Text. Unlocks structured rendering, queryability, per-block UI. **Single highest-leverage change.**
2. **Notion-style block editor.** Slash menu, drag handles, floating toolbar. Use **BlockNote** to ship in weeks; **TipTap** for fully custom (4–6 weeks). Skip Lexical.
3. **Schema-as-code drives admin forms too.** OpenQase already has `RELATIONSHIP_MAPS`. The existing engine spec extends this to the API layer; extend further to drive admin UI from the same registry. Directus's strongest idea — done right.
4. **Drafts / autosave / version history.** A `content_versions` table + `restore_version()` RPC. A weekend's work, changes editorial confidence dramatically.
5. **Slash-menu "cards" for typed embeds.** `/case-study` inserts a styled reference card; `/algorithm` embeds an algorithm card; `/figure` adds a captioned image. Maps directly onto your relationship graph.
6. **Scheduled publishing.** `publish_at` timestamp + cron worker. Cheap, high editorial value.
7. **Inline create from relationships.** Editing a case study → create a missing industry without navigating away.
8. **Click-to-edit live preview.** Sanity Presentation pattern. Higher effort, defer.
9. **Reusable shared blocks (Citation, Author bio, etc.)** across content types. Payload Blocks idea.
10. **Components for repeating field groups.** Strapi Components.

**Editor stack recommendation:** **BlockNote** for v1.

**Don't:**
- Adopt Ghost — its content model can't represent OpenQase's relational shape.
- Self-host Directus on top of Supabase — two admin tools fighting.
- Migrate to Payload wholesale — rewrites your content layer when you only need to upgrade the authoring surface.

---

## Synthesized Recommendation: Refactor → Author → Polish

This isn't a rebuild. It's three sequenced, independently shippable phases on top of what you have.

### Phase A — Land what you've already specced (2 weeks)

**Goal:** unblock the existing rebuild work and remove debt.

1. **Security PR first** — top 5 findings above. Independent of everything else. Day 1–2.
2. **Finish `feature/cms-engine`** — migrate the last 3 content types (personas, industries, blog_posts). Resolve `supabase-new.ts`. Update 8 importers off the deprecated `supabase.ts`. Days 3–7.
3. **Generic admin form from registry** — the unstarted Issue #202. Replace 9 per-type client components with one generic `<SchemaForm config={...}>` reading from the registry. Days 8–12.
4. **Consolidate relationship patterns** — delete `content-fetchers.ts` single-item pattern; standardize on the batch pattern. Day 13–14.

Outcome: ~4,000 lines deleted, security holes closed, one admin form drives all 9 content types, adding a 10th type is a config file + migration.

### Phase B — Make authoring excellent (2–3 weeks)

**Goal:** turn the CMS into a tool writers want to use.

5. **Block-based content model.** Schema change: `main_content` becomes `body jsonb` storing `Block[]`. Migrate existing markdown into a single `RichTextBlock` per record (one-shot script). Define ~8 block types: rich-text, callout, image, quote, citation, code, plus 3 OpenQase-specific (algorithm-ref, case-study-ref, industry-ref).
6. **BlockNote editor** in the generic admin form. Slash menu inserts the block types above. Floating toolbar for inline formatting.
7. **Drafts + version history.** `content_versions` table; every save writes a version; `restore_version()` action.
8. **Scheduled publishing.** `publish_at` column + Vercel Cron job; revalidation already wired.
9. **Inline relationship create.** "+ Add new industry" inside the relationship picker.

Outcome: editorial workflow on par with Ghost/Payload; structured body content is queryable; drafts are non-destructive.

### Phase C — Polish & visual (1–2 weeks)

10. **Land `feature/editorial-redesign`** (Source Serif 4 + faceted filters + tag pills). Unblocks the frontend work that was ready in March.
11. **Block rendering on public pages** (per-block React components map to the typed `Block[]`).
12. **Live preview** (split-pane iframe; click-to-edit deferred to v3).

Outcome: site looks editorial; admin and public side both consume the same typed content model.

---

## Open Questions — For the Phase 1 Vision Conversation

These shape the spec we'd write next. Not asking now — listing so the owner can mull them overnight.

1. **Authoring audience.** Just you for the foreseeable future, or a wider editorial team / contributors?
2. **Block model ambition.** Conservative (markdown + a couple of typed embeds) or full Notion-style (every paragraph is a block)?
3. **Editor effort budget.** BlockNote (ship in 1–2 weeks, less customizable) or TipTap (4–6 weeks, fully custom)?
4. **Drafts model.** Linear version history (Payload) or branchable (Sanity-style `drafts.foo` shadow documents)?
5. **Migration appetite.** Are existing case studies "good enough" as one big `RichTextBlock` after migration, or would you re-author them into proper blocks (algorithm-ref, citation, etc.)?
6. **What "excellent" feels like to you.** Pure writing surface (Ghost taste) or rich structured editor (Notion / Sanity)?
7. **Why did the March rebuild stall?** Time? Confidence in the spec? An unforeseen blocker? Knowing this changes how we de-risk the next attempt.

---

## Appendices

- `2026-04-27-architectural-audit.md` — full architectural audit
- `2026-04-27-security-audit.md` — full security audit, all 15 categories
- `2026-04-27-competitive-research.md` — Ghost / Sanity / Payload / Strapi / Directus / editor stacks

Existing specs (referenced, not duplicated):
- `docs/superpowers/specs/2026-03-23-cms-engine-design.md`
- `docs/superpowers/specs/2026-03-24-editorial-redesign-design.md`
- `docs/superpowers/plans/2026-03-23-cms-engine.md`
- `docs/superpowers/plans/2026-03-24-editorial-redesign.md`
