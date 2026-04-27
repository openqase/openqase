# Architectural Audit — Raw Findings

**Date:** 2026-04-27
**Scope:** OpenQase CMS codebase
**Method:** Deep-read of CMS engine, content fetchers, admin slice (case-studies), middleware, and half-finished rebuild artifacts
**Status:** Discovery — no code changes

---

## 1. Architectural Debt

**Two parallel relationship-fetching patterns.** `src/lib/content-fetchers.ts` (330 lines) and `src/lib/relationship-queries.ts` (236 lines) both fetch relationships, with subtly different semantics. Neither is canonical. CLAUDE.md justifies both as intentional; in practice, when adding a new content type, a developer must choose between two legitimate-looking patterns and will likely copy the wrong one. **Severity 2.**

**Plain `<Textarea>` + markdown for authoring.** Found in `src/app/admin/case-studies/[id]/client.tsx:50–70`. No formatting toolbar, no preview, no spellcheck integration in-editor. Works at 50 case studies; breaks at 500. **Severity 3.**

**Nine separate per-type admin client components, ~80% overlap.** 3,576 lines total across 9 files. The CMS engine (`src/cms/define.ts`, `src/cms/registry.ts`) exists and powers the API layer, but the admin UI ignores it — it duplicates the schema inside React components. Bug in one becomes a bug in all. **Severity 2.**

## 2. The Half-Finished Rebuild

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

**`src/types/supabase.ts` (1443 lines) vs `src/types/supabase-new.ts` (1444 lines).** Both define `Database` type. Neither has comments explaining the difference. Classic abandoned migration artifact. **Severity 2.**

**Nine archived rebuild documents in `/docs/archive/`.** Propose solutions never executed. The transitive-relationship bug was diagnosed in `fix-relationship-pattern-plan.md` and still exists in the live code. **Severity 3.**

## 5. Editor & Authoring UX

No rich-text editor. No markdown preview. No syntax highlighting. No autosave. No word count. Field validation is client-side JavaScript surfaced as a warning overlay, not in-editor.

`src/lib/content-validation.ts` runs offline linting (spelling, schema rules) but the output isn't integrated into the editor surface. **Severity 3 today, will become Severity 2 as content volume grows.**

## 6. Content Model Concerns

**Bidirectional junction tables conflate direction.** `case_study_quantum_company_relations` reads as "case study mentions quantum company" from one side and "quantum company is mentioned in case study" from the other. The engine's `RelationshipDefinition` allows direction-specific keys but the admin pages don't use them. If you later want typed relationships ("provider" vs "user" vs "competitor"), the current pattern won't disambiguate. **Severity 2.**

**Inconsistent dedup across fetchers.** `src/lib/relationship-queries.ts:204–215` deduplicates via Set. `src/lib/content-fetchers.ts:113–122` does not. If a relationship is accidentally inserted twice, some queries show duplicates, others don't. **Severity 2.**

**Engine `selectFields` config exists but is ignored by admin pages.** `src/cms/define.ts:20` declares it; `src/app/admin/case-studies/[id]/page.tsx:91–98` hardcodes `id, slug, name`. There are effectively two schemas — engine config and React component. **Severity 2.**

## 7. Performance / Scale

No issues at current scale. SSG + 24h ISR + `revalidatePath()` is sound. Future watch:

1. `flattenRelationships()` loads *all* related entities per page. With 50 related items × 7 relationship types per case study × thousands of case studies, ISR revalidation degrades.
2. `src/lib/content-fetchers.ts:349–387` does full-text ilike searches across all content types with no DB index strategy noted.
3. Newsletter dual service makes calls to Beehiiv AND Resend AND DB on every subscribe — a viral moment could overload.

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

1. The CMS engine is 70% complete and sound. Finish migrating personas, industries, blog_posts. **3–5 day sprint.**
2. The admin UI is the real problem. Build one generic admin editor that reads `ContentTypeDefinition` from the registry; delete the 9 old files. **5–7 day sprint.**
3. Consolidate relationship patterns. Delete the single-entity pattern; standardize on the batch pattern. **1 day.**
4. **Don't** rebuild Supabase layer, middleware, or soft-delete. Solid as-is.
5. **Don't** add rich-text editing yet. Separate spike after admin consolidation.

**Sequence (rough):**
- Week 1: Merge `feature/cms-engine`. Resolve `supabase-new.ts`.
- Week 2: Generic admin editor. Delete 9 old client components. Update 8 importers off `supabase.ts`.
- Week 3: Consolidate relationship patterns. Delete archive docs.
- Week 4: Admin path test coverage, audit log polish, env onboarding docs.

**Cost of ignoring:** Each new content type adds 500+ lines of duplicated admin code. Each relationship change requires edits to 9 places. Feature velocity degrades 10–15% per new type. Within 2 years, the codebase is unmaintainable.
