# Architectural Audit — Raw Findings

**Date:** 2026-04-27 (revised after reviewer feedback + empirical follow-up)
**Scope:** OpenQase CMS codebase
**Method:** Deep-read of CMS engine, content fetchers, admin slice (case-studies), middleware, and half-finished rebuild artifacts. Empirical follow-up adds measured ISR baseline and content-shape sampling.
**Status:** Discovery — no code changes
**Companion:** `2026-04-27-empirical-followup.md`

---

## 1. Architectural Debt

**Two parallel relationship-fetching patterns.** `src/lib/content-fetchers.ts` (330 lines) and `src/lib/relationship-queries.ts` (236 lines) both fetch relationships, with subtly different semantics. Neither is canonical. CLAUDE.md justifies both as intentional; in practice, when adding a new content type, a developer must choose between two legitimate-looking patterns and will likely copy the wrong one. **Severity 2.**

**Plain `<Textarea>` + markdown for authoring.** Found in `src/app/admin/case-studies/[id]/client.tsx:50–70`. No formatting toolbar, no preview, no spellcheck integration in-editor. Works at 50 case studies; breaks at 500. **Severity 3.**

**Nine separate per-type admin client components, ~80% overlap.** 3,576 lines total across 9 files. The CMS engine (`src/cms/define.ts`, `src/cms/registry.ts`) exists and powers the API layer, but the admin UI ignores it — it duplicates the schema inside React components. Bug in one becomes a bug in all. **Severity 2.**

## 2. The Half-Finished Rebuild

**The existing CMS engine spec has at least one schema mismatch.** The March 2026 spec (`docs/superpowers/specs/2026-03-23-cms-engine-design.md`) lists `algorithms.technical_details` as a field. **That column does not exist in the database.** Empirically confirmed by sampling. If there's one mismatch, there are likely others. Pre-A2 work item: a 30-minute pass cross-checking every field declared in the spec against actual DB columns for all 9 content types. Cheap; prevents discovering schema drift mid-migration.

**Two active worktrees**, both unmerged:
- `/.worktrees/cms-engine` (`feature/cms-engine`) — the engine refactor, 70% migrated. Engine is *working*; tests pass at `src/cms/operations/*.test.ts`. 6 of 9 content types migrated (case-studies, algorithms, partner-companies, quantum-companies, quantum-hardware, quantum-software). Personas, industries, blog_posts not yet migrated.
- `/.worktrees/editorial-redesign` (`feature/editorial-redesign`) — frontend visual changes only, orthogonal to the engine work.

**State:** feature-complete in approach, but unbranched. Migrations are solid. The admin UI refactor was never started — still per-type client components on `develop`. **Severity 2.**

**Salvageable?** Yes. Migrate the last 3 types, then delete the 9 old client components and build ONE generic admin editor reading from the registry. Roughly a 2-week focused sprint, not a full rewrite.

## 3. Tight Coupling / Hard-to-Change Areas

**CMS engine tightly coupled to PostgREST FK-hint syntax.** `src/cms/operations/relationships.ts:9–28` builds complex multi-level PostgREST queries with `!fk_name` hints by string interpolation. If the schema changes (rename a junction table, change FK naming), the query-building code breaks silently. **Severity 2.**

**Admin pages bypass the engine for relationship loading.** `src/app/admin/case-studies/[id]/page.tsx:54–79` — 7 parallel Supabase queries, each hardcoded for one relationship. Same logic duplicated across all 9 admin pages. The CMS engine's `saveRelationships()` knows about `extraJunctionFields`; admin pages don't use it. **Severity 2.**

**Three Supabase client paths.** `src/lib/supabase-server.ts` (canonical, with separate RLS vs service-role functions). `src/lib/supabase.ts` (deprecated bridge, but 8 importers still use it — `src/app/admin/audit-log/page.tsx`, `src/app/auth/callback/route.ts`, etc.). `src/lib/supabase-browser.ts` (browser only). The deprecated comment says "being refactored according to the CMS refactoring plan" — cleanup never landed. **Severity 3.**

## 4. Dead / Duplicated / Deprecated Code

**`src/lib/dual-newsletter-service.ts` (414 lines).** Wraps both Beehiiv and Resend with switchable config. No A/B testing or rollout flag in the actual route handler. Looks like an incomplete migration from one newsletter service to another. `testConnections()` is never called. `preferredService: 'beehiiv'` config sets a default no code uses. **Severity 3.**

> **Before deleting:** verify no env-toggled code path reaches it in production. Incomplete migrations sometimes have one live caller hidden behind a feature flag. `git grep dual-newsletter` plus a check that `BEEHIIV_API_KEY` and `RESEND_API_KEY` are not both set in any production deployment.

**`src/types/supabase.ts` (1443 lines) vs `src/types/supabase-new.ts` (1444 lines).** Both define `Database` type. Neither has comments explaining the difference. Classic abandoned migration artifact. **Severity 2.**

> **When picking one to keep:** add a short header comment explaining why. Otherwise the next person hitting this re-asks the same question and spends an hour re-deriving the answer. The comment is the deliverable, not just deletion.

**Nine archived rebuild documents in `/docs/archive/`.** Propose solutions never executed. The transitive-relationship bug was diagnosed in `fix-relationship-pattern-plan.md` and still exists in the live code. **Severity 3.**

## 5. Editor & Authoring UX

No rich-text editor. No markdown preview. No syntax highlighting. No autosave. No word count. Field validation is client-side JavaScript surfaced as a warning overlay, not in-editor.

`src/lib/content-validation.ts` runs offline linting (spelling, schema rules) but the output isn't integrated into the editor surface. **Severity 3 today, will become Severity 2 as content volume grows.**

## 6. Content Model Concerns

**Bidirectional junction tables conflate direction.** `case_study_quantum_company_relations` reads as "case study mentions quantum company" from one side and "quantum company is mentioned in case study" from the other. The engine's `RelationshipDefinition` allows direction-specific keys but the admin pages don't use them. If you later want typed relationships ("provider" vs "user" vs "competitor"), the current pattern won't disambiguate. **Severity 2.**

**Inconsistent dedup across fetchers.** `src/lib/relationship-queries.ts:204–215` deduplicates via Set. `src/lib/content-fetchers.ts:113–122` does not. If a relationship is accidentally inserted twice, some queries show duplicates, others don't. **Severity 2.**

**Engine `selectFields` config exists but is ignored by admin pages.** `src/cms/define.ts:20` declares it; `src/app/admin/case-studies/[id]/page.tsx:91–98` hardcodes `id, slug, name`. There are effectively two schemas — engine config and React component. **Severity 2.**

## 7. Performance / Scale

**ISR baseline (measured 2026-04-27):** full clean build is 18s; static generation of 367 pages takes 4.1s with 9 parallel workers (~100 ms per-page CPU). Single-page revalidation should land in 100 ms – 1 s, dominated by the Supabase round-trip rather than rendering. Not a constraint for any current or proposed Phase B work. Re-measure on the deployed Vercel environment as a Phase A acceptance check.

Future watch (no current issues):

1. `flattenRelationships()` loads *all* related entities per page. With 50 related items × 7 relationship types per case study × thousands of case studies, ISR revalidation degrades.
2. `src/lib/content-fetchers.ts:349–387` does full-text ilike searches across all content types with no DB index strategy noted (see Section 7a — the index strategy already exists, it's just unused and partly broken).
3. Newsletter dual service makes calls to Beehiiv AND Resend AND DB on every subscribe — a viral moment could overload.

## 7a. Body-Content Search Is Broken in Production — Severity 1

This is not a "latent bug to clean up." This is a production regression that has been silently affecting 8 of 9 content types for an unknown period and nobody has noticed.

Empirical finding (full detail in `2026-04-27-empirical-followup.md`):

**Every content table has a `ts_content tsvector` column with a GIN index** and a `BEFORE INSERT OR UPDATE` trigger calling `update_ts_content()`:

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

**The bug:** the trigger reads `NEW.content`, but only `blog_posts` has a column named `content`. Every other content type uses `main_content`. So 8 of 9 content types have GIN indexes that contain only title + description text. Body content has been silently un-indexed for the lifetime of the trigger. **Severity 1 — production regression.**

**The compounding fact:** `src/lib/content-fetchers.ts:366` ignores the tsvector entirely and runs `.ilike` against `title`, `description`, and `main_content` directly — slow, unindexed, no relevance ranking. So:

1. The fast indexed path exists but is unused.
2. The slow ilike path produces correct results because it queries the live columns directly.
3. The combination silently masks the trigger bug — search "works" because the unindexed path is the only one running.

**Why nobody noticed:** the `.ilike` fallback against `main_content` means search results are correct, just slow. Title/description matches probably cover most actual queries (case studies have descriptive titles). The fact that this hasn't been caught is a useful prior on **how much editorial weight body-text search currently carries** — likely not much. Worth keeping in mind when scoping search UX in Phase B/C.

**Implication for the proposed Phase B body→jsonb change:** this is a pre-existing problem the migration solves rather than introduces. The search story becomes:

1. Fix the trigger to derive text from the new `body jsonb` column when present (else fall back to `main_content`/`content`). Use `jsonb_path_query_array` to walk the block tree and concatenate text leaves.
2. Switch search code from `.ilike` to `.textSearch('ts_content', ...)`.
3. Backfill `ts_content` for legacy rows.

All three steps are part of the migration with no extra cost, and the result is strictly better than today: indexed, ranked, and now actually covering body content.

This finding alone should be on the Phase A fix list independent of the block migration; the Phase B work then absorbs steps 2 and 3 with the trigger update merging into the body-format change.

## 8. Testability

19 test files. Coverage:
- `src/cms/define.test.ts` (basic registration tests)
- `src/cms/schema.test.ts` (Zod schema generation)
- `src/cms/operations/*.test.ts` (CRUD, relationships, publish)
- `src/lib/*.test.ts` (utilities, cache, validation, schemas)

Missing:
- No E2E tests for admin workflows (create → relate → publish → view)
- No integration tests for the full CMS engine across all 9 types
- No tests for admin-page data fetching (`src/app/admin/case-studies/[id]/page.tsx`)
- No tests for the deprecated `supabase.ts` bridge
- No tests for `dual-newsletter-service` configuration paths

The engine is well-tested in isolation but not in the context of the admin UI or API routes. A regression in relationship handling will surface in admin 5 days after merge.

## 9. DX / Build & Deploy

`package.json` is clean — no duplicate-purpose deps. Build scripts are standard.

Environment configuration is implicit. No `.env.example`. `DEV_MODE_AUTH_BYPASS` (middleware:121) is undocumented. Newsletter service checks 4 env vars (`BEEHIIV_API_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `RESEND_FROM_EMAIL`) without setup docs. **Severity 3.**

## 10. What's Actually Good — Keep In Any Rebuild

- **The CMS engine's design** (`src/cms/define.ts`, `src/cms/registry.ts`, `src/cms/operations/*`). Declarative config, Zod-derived schemas, separated concerns, decent test coverage. **Keep this. Finish it.**
- **Supabase client factories** (`src/lib/supabase-server.ts`, `src/lib/supabase-browser.ts`). Correct separation of RLS vs service-role; proper cookie handling; singleton browser client. **No refactor needed.**
- **Batch relationship pattern** (`src/lib/relationship-queries.ts`). Underdocumented but correct — Set-based dedup, junction-aware. **Make this canonical; delete the single-item pattern.**
- **Soft-delete infrastructure** (`soft_delete_content()` / `recover_content()` RPCs, audit log). Enterprise-grade practice.
- **Content validation** (`src/lib/content-validation.ts`). Good UX scaffolding; expand to in-editor.

---

## Owner's Verdict

**Recommendation: Incremental refactor, not full rebuild.**

Estimates as ranges (low / expected / high). Single-point estimates on items that span unknowns are the kind of thing that bites at the high end.

1. **Finish the CMS engine.** Migrate personas, industries, blog_posts. Engine itself is sound. **3–5 days.**
2. **Generic admin editor (★ dominant budget).** One generic `<SchemaForm>` reading from the registry; delete the 9 old per-type client components. Must support per-type validation, custom field types (the engine's `selectFields` admin pages currently ignore), the relationship-picker abstraction (per-relationship inline create), and an injection point for the future block editor. **8–12 days.** High end if the relationship picker proves messy.
3. **Consolidate relationship patterns.** Delete the single-entity pattern; standardise on the batch pattern with Set-based dedup. **1–2 days.**
4. **Search migration to the existing tsvector** (see Section 7a). Fix the column-name bug; switch from `.ilike` to `.textSearch`. **1–2 days.** Independently valuable; sets up the Phase B body-format change.
5. **Don't** rebuild Supabase layer, middleware, or soft-delete. Solid as-is.
6. **Don't** add rich-text editing yet. Phase B work, after the engine + admin form land.

**Cost of ignoring:** Each new content type adds 500+ lines of duplicated admin code. Each relationship change requires edits to 9 places. Feature velocity degrades 10–15% per new type. Within 2 years, the codebase is unmaintainable.
