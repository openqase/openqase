# OpenQase CMS Rebuild — Phase 2 Slice & Sequence Roadmap

**Date:** 2026-04-27
**Status:** Proposed (Phase 2 roadmap; awaits owner approval)
**Inputs:**
- Vision spec: `docs/superpowers/specs/2026-04-27-cms-vision-design.md` (Approved 2026-04-27)
- Discovery synthesis: `docs/superpowers/research/2026-04-27-cms-discovery-findings.md`
- Empirical follow-up: `docs/superpowers/research/2026-04-27-empirical-followup.md`

---

## Purpose

This document refines the synthesis's draft Phase A/B/C plan into a real implementation roadmap. It commits to:

1. The **v0.5 ship target** — the one decision the vision spec named as Phase 2's required deliverable.
2. Confirmed **slice boundaries** for what ships in each release (v0.5, v0.6, v0.7).
3. **Quality bars** specific to each slice — owner has committed sustained focus and prioritises quality over compressed timelines.
4. The **handoff to Phase 3** — which slice gets a per-slice design spec first, and what each per-slice spec must cover.

Phase 3 (per-slice design specs and implementation plans) takes this roadmap as input and produces the detailed task-level plans for each slice.

---

## Phase 2 decisions

These are the decisions made in this phase. They become inputs to Phase 3.

### Decision P2.1 — v0.5 ship target

**Combination chosen: A1.2 + A2.1** — all editors flipped to the new registry-driven admin form at v0.5; public site continues rendering from the old path.

| Axis | Value | Rationale |
|---|---|---|
| Admin path scope | **All editors use new form** (admin + editor roles) | Sustained-focus commitment makes the conservative "admins-only first" battle-test unnecessary. With one editor today (you) and 1–2 contributors expected, "everyone on new form" is barely riskier than "admins only" but provides much faster real-content stress test of A3. |
| Public rendering scope | **Old path** | Public site is statically generated and works today. Flipping public rendering at v0.5 would require Phase B work to land — by definition not v0.5. The new admin form writes back through the existing data shape; public path is unchanged. |

**A3 acceptance criteria implication:** the new admin form must reach feature parity with the old per-type forms across all 9 content types before A3 is considered done. No "internal-only narrower scope" exit. This is the more demanding interpretation, and matches the quality-over-speed steer.

### Decision P2.2 — Quality bars are non-negotiable

The owner has explicitly committed sustained focus and stated quality code is crucial. Concrete implications:

- Each slice has a **test coverage requirement** as part of acceptance, not a follow-up TODO.
- The `publicQuery()` invariant (vision spec Decision 2) is enforced by **a lint or grep CI check**, not just code review. This ships in A1.
- The **relationship-picker abstraction** (the highest-risk piece per Decision 6) gets a dedicated review checkpoint mid-A3, not just at A3's completion.
- The **B2 migration** is tested for **idempotency and reversibility** in CI before it's considered complete (already in the synthesis acceptance criteria; restated here for emphasis).
- **No silent code rot:** any TODO/FIXME/`// removed` comment introduced during the rebuild is either resolved before the slice ships or moved to a tracked issue. Carry-over debt does not accumulate across slices.

### Decision P2.3 — Estimate framing

Synthesis ranges were sized for stop-and-go attention. Under sustained focus, realistic actuals trend toward the **low end** of each range — the high end mostly priced in context-reload overhead from interruption. Day budget freed up by sustained focus is **reinvested in quality** (tests, review, polish), not used to compress the schedule below the quality floor.

This means: Phase A targets **~18 days** of working time, not 28. Phase B targets **~12 days**, not 18. Phase C targets **~7 days**, not 12. With slack absorbed by quality, not consumed.

---

## Release boundaries

The synthesis's slice numbering (A0–A7, B1–B5, C1–C3) is preserved so cross-references stay clean. Phase 2 confirms these boundaries and assigns each to a release.

### v0.5 — "The admin got better; the site is unchanged" (end of Phase A)

**Ships:**
- **A0** — Schema cross-check (pre-flight; gate to A2 if mismatches > 3)
- **A1** — Security PR (Tier 1 + Tier 2 findings; the named `publicQuery()` invariant + CI check to enforce it)
- **A2** — Finish `feature/cms-engine` (migrate personas, industries, blog_posts; resolve `supabase-new.ts`; update 8 importers off deprecated `supabase.ts`)
- **A3** — Generic admin form from registry (★ dominant; replaces all 9 per-type clients)
- **A4** — Consolidate relationship patterns (delete single-item pattern; standardise on batch)
- **A5** — Drafts + version history (`content_versions` table; `restore_version()` action; per-record `created_by`/`last_edited_by`)
- **A6** — Scheduled publishing (`publish_at` column + Vercel Cron)
- **A7** — Fix broken-in-production body-text search (trigger column-name bug; `.ilike` → `.textSearch`; backfill via `UPDATE table SET id = id` no-op)

**v0.5 acceptance:**
- All 9 content types managed via the same generic admin form. Feature parity with old per-type forms confirmed.
- All editors (admin + editor roles) use new form by default.
- Public site renders unchanged from old path; no user-visible change for readers.
- Tier 1 + Tier 2 security findings no longer reproducible.
- `publicQuery()` invariant has a CI check that fails the build if a public-content read bypasses it.
- Save action writes a `content_versions` row; `restore_version()` round-trip restores prior state.
- Scheduled `publish_at` triggers via cron in dev.
- Body-text search returns matching items via `.textSearch` against the now-correct `ts_content`.
- Schema cross-check artifact committed (lists every spec field + actual DB column status).
- ISR revalidation latency measured on deployed Vercel; **this number is the calibration baseline for Phase B's 2× check**.

**Estimated duration: ~18 days** of sustained focus.

### v0.6 — "Block-based authoring is live" (end of Phase B)

**Ships:**
- **B1** — BlockNote customisation spike (gates B3; pre-committed fallback per vision spec Decision 5: defer rich text, ship markdown editor in v0.6 if B1 fails)
- **B2** — Block-based content model (`body jsonb`; v1 block taxonomy: `RichTextBlock`, `HeadingBlock` *or* heading-as-style on text block, `CitationBlock`; one-shot migration; updated `update_ts_content` trigger; **`main_content` preserved for one release as rollback**)
- **B3** — BlockNote editor in admin form (slash menu, floating toolbar)
- **B4** — Inline relationship create ("+ Add new industry" inside relationship picker)
- **B5** — One OpenQase-specific block (most likely `algorithm-ref`; validates the slash-menu "card" UX with a real content type)

**v0.6 acceptance:**
- B1 result documented; editor decision either confirmed (BlockNote) or executed via fallback (markdown editor, blocks deferred).
- Migration script run against staging copy: every record has non-empty `body jsonb`; rendered output visually equivalent to markdown version (manual diff on 5 records).
- **Migration is idempotent** (re-run is no-op or fails loudly).
- **Migration is reversible**: `main_content` preserved; renderer feature flag flips back to markdown without restoring from backup. Rollback path tested before B2 is considered done.
- Editing a record in the new editor produces `Block[]` round-trip without lossy conversion.
- Body-text search continues to work after migration (tsvector now derives from block text).
- Re-measured ISR revalidation latency on deployed Vercel is **within 2× of the v0.5 baseline** (calibrated against actual deployed numbers, not local 18s build).
- Block contract validated: a one-off script can produce valid `Block[]` arrays without going through the editor (the design check from vision spec out-of-scope section).
- B5's custom block ships and is functional in admin.

**Estimated duration: ~12 days** of sustained focus.

### v0.7 — "Public site catches up; editorial polish lands" (end of Phase C)

**Ships:**
- **C1** — Land `feature/editorial-redesign` (Source Serif 4 typography + faceted filters + tag pills)
- **C2** — Block rendering on public pages (per-block React components map typed `Block[]`; public path catches up to the new content model; `main_content` becomes droppable after this release)
- **C3** — Live preview (split-pane iframe; **stretch:** click-to-edit overlays Sanity-style if A and B landed cleanly with budget remaining — owner's commitment makes this a real possibility, but it stays a stretch goal)

**v0.7 acceptance:**
- Editorial redesign visually shipped on production (Source Serif 4, faceted filters, tag pills).
- Each v1 block type has a public renderer; no record falls back to "raw markdown" on the live site.
- Editor preview and live render diverge by no more than typography styling.
- `main_content` deprecated (kept for one more release as final safety net, then removed in v0.8).
- C3 stretch: if shipped, split-pane preview shows live re-render on save with sub-2s latency.

**Estimated duration: ~7 days** of sustained focus (excludes C3 stretch).

---

## Order rationale and dependencies

| Slice | Depends on | Why this order |
|---|---|---|
| A0 | — | Pre-flight; cheap; gates A2 if mismatches found. |
| A1 | — | Security is independent; ship first to close exploitable findings before further surface area lands. |
| A2 | A0 | Schema cross-check de-risks the migration of remaining 3 content types onto the engine. |
| A3 | A2 | Generic admin form reads from the completed registry; pointless before all 9 types are on the engine. |
| A4 | A2 | Consolidating relationship patterns is safer once everything is on one engine. |
| A5, A6 | A3 (loose) | Drafts/scheduling can technically land before A3, but live cleaner with the new admin form. |
| A7 | — | Independent infrastructure fix; can land any time in Phase A. Schedule near the end so it doesn't block other work. |
| B1 | A3 | Spike a custom block inside the new admin form's editor injection point. |
| B2 | A2, A4 | Block model migration touches the registry + the consolidated fetcher; both must be stable. |
| B3 | B1, B2 | Editor integrated only after spike result + block model both exist. |
| B4 | A3 | Relationship-picker exists in the new admin form; this enhances it. |
| B5 | B3 | Validates the editor's customisation surface; needs the editor to exist. |
| C1 | — | Editorial redesign is independent; ships when convenient. Already specced. |
| C2 | B2 | Public renderers consume the block shape introduced by B2. |
| C3 | C2 | Live preview needs both editor and renderer to exist. |

The critical path is **A0 → A2 → A3 → B1 → B3 → C2**. Everything else can slot in around it. A1, A7, A5, A6 are independent enough to land in parallel windows when the critical-path item is in review or testing.

---

## Risks restated for the slice plan

The synthesis already identifies these; here they're restated with their slice ownership.

| Risk | Owned by | Mitigation |
|---|---|---|
| **A3 dominant-budget item; relationship-picker is the hardest abstraction** | A3 | Mid-A3 review checkpoint specifically on the relationship picker before completing the rest of A3. Abandonment threshold: if A3 exceeds 15 days, stop and re-evaluate the registry-driven approach (per synthesis). |
| **Schema mismatches discovered during A2 mid-migration** | A0 | A0 cross-check pre-flight; if > 3 mismatches, pause A2 to revise the engine spec before resuming. |
| **B1 spike fails for OpenQase-specific blocks** | B1 | Pre-committed fallback per vision spec Decision 5: defer rich text and ship v0.6 with markdown editor. Block model + storage shape still ship. TipTap requires a separate spike confirming budget. |
| **B2 migration produces non-equivalent rendering on > 5% of records** | B2 | Pause B2; revise block taxonomy or migration script. Rollback path tested means we can flip back without data loss. |
| **publicQuery() invariant regression** | A1 (sets up CI check), ongoing | CI lint/grep check fails the build. Vision spec flags any regression as Sev-1. |
| **ISR latency degrades > 2× from v0.5 baseline at v0.6** | B2 | Re-measure on deployed Vercel as B2 acceptance; pause shipping if breached. |
| **Marqov returns and pulls focus** (low under current commitment) | meta | The "3 weeks of silence" tripwire is retained as insurance. Phases are independently shippable; partial completion still produces a usable v0.5 or v0.6. |

---

## Phase 3 handoff

Phase 3's job is to produce per-slice design specs + implementation plans, in the order they will ship. The format follows the existing March 2026 plans (`docs/superpowers/plans/2026-03-23-cms-engine.md` style) with task-level checkboxes for execution by `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

**Recommended Phase 3 sequencing:**

1. **First spec to write: A1 — Security PR.** Independent, ships first, sets up the `publicQuery()` invariant that everything else relies on. Smallest scope; useful for calibrating the per-slice plan format.
2. **Next: A0 + A2 combined.** A0 is small enough to live inside the A2 plan rather than as its own document. The A0 cross-check gates the A2 migration of the remaining 3 content types.
3. **Next: A3.** Largest single slice; deserves a thorough design spec. The relationship-picker abstraction warrants its own design section within the A3 plan.
4. **In parallel with A3 implementation: A4, A5, A6, A7 plans.** These are smaller and can be specced as a batch. Implementation slots in around A3.
5. **At end of Phase A: ship v0.5.** Re-measure ISR latency on deployed Vercel; that number is the input to Phase B planning.
6. **Phase B specs after v0.5 ships, not before.** This avoids over-committing to Phase B details before A3's actual scope is known. Lessons from A3 — especially how the relationship picker landed — inform B1 and B3's editor injection point.
7. **Phase C specs after v0.6 ships.** C1 (editorial redesign) is already mostly specced from March; reuse where possible.

**What each per-slice spec must cover** (per Phase 3 conventions):
- Goal and scope
- Files to create / modify (with file:line if relevant)
- Test plan with coverage targets
- Acceptance criteria (testable, not feelings)
- Risks specific to the slice + their mitigations
- Cross-references to vision spec's load-bearing decisions where the slice touches them

---

## Living-document discipline

This roadmap, like the vision spec, is **edited in place** when reality diverges. Specifically:

- **After v0.5 ships:** update the v0.6 estimates with the actuals from Phase A. Re-confirm v0.6 slice boundaries.
- **If B1 fails:** update Decision 5's fallback path in the vision spec *and* this roadmap's v0.6 ship contents.
- **If a slice's actual duration exceeds its synthesis high end:** that's a signal-to-watch (per vision spec). Re-examine whether the abstraction is right, not just whether the schedule is right.

The discipline is the same as the vision spec's: edit in place, version with git history, treat the doc as load-bearing rather than supplementary.

---

## Status

| Phase | Output | Status |
|---|---|---|
| 0 — Discovery | Findings + audits + competitive research + empirical follow-up | ✅ Complete |
| 1 — Vision | Vision spec | ✅ Approved (2026-04-27) |
| 2 — Slice & sequence | This document | 🟡 Proposed |
| 3 — Per-slice design specs + implementation plans | Starting with A1 (security PR), then A0+A2 (engine completion), then A3 (admin form), etc. | ⏳ Next |

Status flips to ✅ Approved when owner signs off — same edit-in-place discipline as the vision spec.
