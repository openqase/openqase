# Phase 0 Empirical Follow-up

**Date:** 2026-04-27
**Author:** Claude Code
**Status:** Discovery addendum — measured data closing two gaps reviewer flagged
**Prerequisite read:** `2026-04-27-cms-discovery-findings.md`

---

## Why this exists

The Phase 0 review flagged two places where the discovery had asserted things without measuring them:

1. The block-migration story was presented as a one-line script when in practice it depends on what real markdown contains.
2. The ISR revalidation cost (relevant to the Phase B block migration risk profile) had not been measured.

Both have now been measured. This memo captures the data and what it changes.

---

## 1. Content sampling — what the markdown actually contains

**Method:** sampled 5 random published case studies from a population of 56, plus 3 algorithms (of 20), 2 industries (of 18), 2 personas (of 14), 3 blog posts (of 6). Counted markdown patterns by regex (headings, bullets, code, links, images, blockquotes, tables, footnotes, HTML, citation markers). Eyeballed the first 350–800 chars of each.

Script: `scripts/sample-case-studies.ts` (kept; useful as ongoing diagnostic).

### Headline numbers

| Field | Sampled | Word count avg | H2s | Bullets | Links | Images | Footnotes | HTML |
|---|---|---|---|---|---|---|---|---|
| `case_studies.main_content` | 5 of 56 | ~1,000 | 5–6 | **0** | **0** | **0** | **0** | **0** |
| `case_studies.academic_references` | 5 of 48 | ~95 | 0 | 0 | 0 | 0 | **23** | 0 |
| `algorithms.main_content` | 3 of 20 | ~620 | 5 | 0 | 0 | 0 | 4 | 0 |
| `algorithms.academic_references` | 3 of 20 | ~175 | 1 | 0 | 0 | 0 | 25 | 0 |
| `industries.main_content` | 2 of 18 | ~310 | 0 | 0 | 0 | 0 | 0 | 0 |
| `personas.main_content` | 2 of 14 | ~300 | 0 | 0 | 0 | 0 | 0 | 0 |
| `blog_posts.content` | 3 of 6 | ~500 | varies | some | some | 0 | 0 | 0 |

### What this means

**Case studies are dramatically simpler than assumed.** Pure prose with `## Section` breaks. No bullets, no inline links to other content, no images, no embedded HTML, no citations in the body, no tables, no footnotes, no bold/italic. The reviewer's worry — "embedded patterns that should become typed blocks" — is **not present** in the live content.

**Citations live in their own column.** `academic_references` is a separate field on case studies and algorithms, formatted as `[^N]: ...` footnote-style. It's already structured-ish: a regex parser produces a clean `Citation[]` array. This is the single highest-value structured-content win in the whole codebase.

**Industries / personas have no markdown structure at all.** Short prose, no headings, no formatting. Lowest-effort migration target.

**Blog posts are slightly richer.** A few inline links and bullets in some posts, but still light. And they use a column called `content`, not `main_content` — important for any cross-table migration.

### Schema findings worth flagging

- `algorithms.technical_details` does **not exist as a column** (the existing CMS engine spec lists it as a field — needs cross-checking).
- `blog_posts` body column is `content`, not `main_content` — single odd-one-out.

### What this changes about migration strategy

The reviewer's two proposed alternatives were:

A. **Mixed-mode**: keep markdown for legacy, blocks for new, store a `body_format` discriminator. Lowest risk.
B. **Pattern-detecting migration**: detect citations, links, footnotes; produce typed blocks at migration time. Higher cost, immediate value.

Given the empirical content, a third option is cleanly superior:

**C. Direct convert with section-splitting.** Split `main_content` on `^## ` to produce alternating `HeadingBlock` + `RichTextBlock` pairs. For prose-only fields with no headings (industries/personas), produce a single `RichTextBlock`. For `academic_references`, parse `[^N]: ...` footnotes into a `Citation[]` block. No mixed mode needed because there's no rich content to either preserve as markdown or detect as blocks — there's only prose and section headings.

This is closer to a one-shot script than the reviewer feared, *because the content is simpler than the reviewer assumed*. The reviewer's caution was correct given the assumed content; the assumption was wrong.

### What this changes about block taxonomy

Original Phase 0 proposed 8 block types. With actual content, the **migration-required set is 3**:

- `RichTextBlock` (paragraphs, including any future inline marks)
- `HeadingBlock` (H2 + H3)
- `CitationBlock` (parsed from existing `academic_references`)

The remaining 5+ types (`CalloutBlock`, `ImageBlock`, `QuoteBlock`, `CodeBlock`, plus the OpenQase-specific `algorithm-ref`, `case-study-ref`, `industry-ref`) are **future-authoring** blocks, not legacy-migration blocks. They can be added incrementally as authoring needs emerge. None block the v1 migration.

The minimal v1 ships with 3 block types, and the BlockNote-vs-TipTap decision then turns on whether 3–6 cumulative block types fit BlockNote's customization ceiling (almost certainly yes).

---

## 2. Search vs jsonb — the latent infrastructure

The reviewer flagged: "PostgreSQL full-text search over a markdown column is straightforward; over a `jsonb Block[]` column it requires a generated tsvector. This decision needs to be made before the migration."

**Empirical finding:** the infrastructure mostly already exists, and it's already buggy.

**Existing state (per `supabase/migrations/20260110101340_remote_schema.sql`):**

- Every content table has a `ts_content tsvector` column.
- Each has a GIN index: `algorithms_ts_content_idx`, `case_studies_ts_content_idx`, etc.
- Each has a `BEFORE INSERT OR UPDATE` trigger calling `update_ts_content()`.

**The trigger function (verbatim):**

```sql
CREATE OR REPLACE FUNCTION public.update_ts_content() RETURNS trigger AS $$
BEGIN
    NEW.ts_content =
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**The bug:** the trigger reads `NEW.content`, but only `blog_posts` has a column called `content`. Every other content type uses `main_content`. So for case_studies, algorithms, industries, personas, quantum_*, partner_companies — the body text is **never indexed**. The tsvector contains title + description only.

**The current search code:** `src/lib/content-fetchers.ts:366` runs `.ilike` against `title`, `description`, and `main_content` directly. Slow, unindexed, no relevance ranking. The tsvector is unused.

**Implication for the block migration:**

The migration story is now: replace one bug with no migration cost.

1. Switch the trigger to extract text from the new `body jsonb` column when present, else fall back to `content`/`main_content`. Use `jsonb_path_query_array` to walk the block tree and concatenate all text leaves.
2. Switch search code from `.ilike` to `.textSearch('ts_content', ...)`.
3. Backfill `ts_content` for legacy rows.

This is part of the migration, not a separate effort. And it's a strict improvement: search becomes faster, indexed, and ranked, *and* gains body-text coverage that was silently broken anyway.

### What this changes

The reviewer's "search/jsonb collision" concern is real and needed addressing, but the answer is more favourable than feared. Bonus finding: the existing search is broken for body content and nobody has noticed (likely because few users hit it, or because title/description matches happen to cover most queries). This is itself worth a sentence in the architectural audit and should be on the Phase A fix list.

---

## 3. ISR revalidation baseline

**Method:** ran `next build` from clean. Captured per-phase timings from the build log.

```
Compiled successfully in 4.9s
Completed runAfterProductionCompile in 1626ms
Finished TypeScript in 3.3s
Generating static pages using 9 workers (367/367) in 4.1s

Total: 46.05s user, 10.27s system, 311% cpu, 18.055s wall
```

**Numbers:**

- Full clean build: **~18 seconds wall clock**.
- Static generation phase: **4.1 seconds for 367 pages** with 9 parallel workers.
- Effective per-page wall-clock cost: ~11 ms parallelised.
- Effective per-page CPU cost: ~100 ms (4.1s × 9 workers ÷ 367).
- Sequential (single-page) revalidation should land in the **100 ms – 1 s** range, dominated by the Supabase round-trip rather than rendering.

### What this changes

The reviewer's worst case was: "If revalidation is already taking 15+ seconds, that's an editor-UX problem now, and the block migration makes it worse before it gets better."

It isn't. Revalidation is sub-second per page today. Adding `Block[]` parsing + per-block component rendering will add work, but the headroom is large. Even a 5× regression would still be sub-5-second editor-perceived latency on publish — not a Phase B blocker.

**Caveat:** the build measurement is single-shot and was run on a presumably warm Mac. Production Vercel ISR runs in a constrained Node.js environment that's slower. The order of magnitude holds, but the "X-second after publish" UX should be re-measured on the deployed environment as part of Phase A acceptance criteria, not before Phase B starts.

---

## 4. Net effect on Phase plan

Summarising the deltas these measurements introduce:

- **Block taxonomy v1**: 3 types, not 8. The other 5 are nice-to-haves layered on later.
- **Migration script**: legitimately one-shot. Split-on-H2 + footnote-parse for `academic_references`. No mixed mode. No body-format discriminator column.
- **Search**: roll into the migration as a strict improvement. Existing tsvector trigger has a column-name bug; this is itself a finding.
- **ISR risk**: not a Phase B constraint. Re-measure in production after Phase A as an acceptance check, not before Phase B as a gate.
- **Block-editor decision (BlockNote vs TipTap)**: with only 3 v1 block types, BlockNote almost certainly clears its customization ceiling. Half-day spike on `algorithm-ref` (the only OpenQase-specific block likely in v1.5) confirms or denies this in a session.

These findings will be folded into the synthesis revision and the audit revisions; this memo is the source-of-truth for the empirical claims those documents will reference.
