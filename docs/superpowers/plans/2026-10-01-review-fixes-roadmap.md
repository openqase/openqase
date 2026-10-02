# Review Fixes Roadmap (2026-10-01)

Source: the 2026-10-01 code review of `main` @ e65bebe (PRs #240–#252 plus a
project-health pass). Every finding below was verified against the code before
being listed. The work is split into PR-sized plans so each lands green on its
own. Plans are written just-in-time; only the first exists yet.

| # | Branch | Scope | Plan |
|---|---|---|---|
| 0 | — | Merge dependabot PR #248 (fixes both `npm audit` items: dompurify, markdown-it). | user action |
| 1 | `fix/cms-trash-and-publish-gaps` | Trashed rows visible in 8 admin lists; create-with-relationship-error discards the new id; bulk publish bypasses `publishContent`; `published_at` rendered unguarded; `generateStaticParamsFor` lacks `deleted_at`; slug change leaves old page stale; hardware spec save never revalidates; preview secret compare can throw on multi-byte input; `formatResourceLink` unguarded against non-string JSON. | `2026-10-01-cms-trash-and-publish-gaps.md` |
| 2 | `fix/sentry-wiring-and-csp` | `sentry.server.config.ts` / `sentry.edge.config.ts` are dead; inline init in `src/instrumentation.ts` lacks error filtering and profiling; CSP Sentry ingest wildcards wider than needed; `environment` should come from `VERCEL_ENV`; rate limiter trusts first `x-forwarded-for` hop. | to write |
| 3 | `chore/dead-code-and-docs` | Delete `src/utils/content-management.ts` and `src/cms/actions.ts` (update eslint rule + security test); add `.local-handover/` to `.gitignore`; CHANGELOG backfill for #241–#252; docs `middleware.ts` → `proxy.ts`; README (Node 20, setup via `docs/database-workflow.md`, test count); comment the Supabase CLI pin in `ci.yml` and align `package.json` range. | to write |
| 4 | `fix/build-fail-loud` | `generateStaticParamsFor` / `getAllSlugsForBuild` / sitemap ignore query errors → throw in production; wire `scripts/assert-build-pages.js` into CI build job; `Sentry.captureException` in public fetchers' catch blocks. | to write |
| 5 | `refactor/search-loading-state` | Replace the cosmetic 250 ms skeleton swap with `useDeferredValue` + `aria-busy` (results stay mounted); extract `useDebouncedSearch` hook and `ResultsSkeleton`; mount the empty-state live region persistently; `query.trim()` consistency in GlobalSearch. Decision needed: keep the debounce at all? | to write |
| 6 | `fix/published-at-trigger-idempotent` | New migration: `DROP TRIGGER IF EXISTS` for all 9 triggers and switch to `BEFORE INSERT OR UPDATE`. Only after the #243 migrations' apply-status on dev/prod is known. | to write |
| later | — | Unify the 8 throw-style admin action contracts with the case-studies `{ success, data, error, warning }` shape so relationship warnings reach every editor; GlobalSearch keyboard nav / combobox ARIA; integration smoke test in CI `db` job; `newsletter_subscriptions` migration (issue #173); CI step for prod migration-ledger drift (needs read-only prod credential). | issues |

Rejected reviewer claims (do not re-raise): Tailwind `grid-cols-[1fr,300px]` is
valid; CodeQL is enabled via GitHub default setup; `draftMode()` does not make
slug pages dynamic (build shows all ● SSG).
