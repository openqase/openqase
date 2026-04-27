# Security Audit — Raw Findings

**Date:** 2026-04-27 (revised after reviewer feedback)
**Scope:** OpenQase Next.js + Supabase application
**Method:** Code review of middleware, server actions, API routes, RLS policies, dependency tree
**Status:** Discovery — no code changes

---

## Two Tiers, Not One

The original "Top 5" framing conflated two different urgency profiles. Splitting them:

### Tier 1 — Exploitable today (3)

These have working exploit paths in the default configuration. Fix in the security PR.

1. **Public GET API leaks unpublished/soft-deleted content** (High, finding 1.1) — Anonymous request to `/api/case-studies?slug=<draft>` returns full draft content. **Direct data leak today.**
2. **`DEV_MODE_AUTH_BYPASS` not gated by `NODE_ENV`** (High, finding 1.4) — Becomes a full admin bypass if the env var ever lands in prod (Vercel mis-set, accidentally copied from `.env.local`). The substring `host` match (`includes('localhost')`) compounds the risk by accepting `evil-localhost.example.com`.
3. **Excessive table-level GRANTs to anon/authenticated** (High, finding 2.1) — RLS is the only line of defense. One disabled RLS or dropped policy → wide open. Compounds 1.1 because the data fetch already runs with service role; if RLS is the next defense and it's not, the leak surface is total.

### Tier 2 — Critical via misconfiguration (2)

These are real risks but the exploit chain requires a misconfiguration or a future routing change. Fix in the same PR (cheap insurance), but don't let the "Critical" label pull attention from Tier 1.

4. **Server actions don't re-check admin role** (finding 1.3) — Defense-in-depth gap. Middleware does block the route in the default path; the exploit chain runs through finding 1.4 or a Next.js middleware misconfiguration. Adding `requireAdmin()` is a one-line fix per file × 9 files.
5. **`deletion_audit_log` readable by every authenticated user** (Medium, finding 2.3) — `metadata` JSONB contains full content snapshots of deleted records. Authenticated, not anonymous, so signup is the gate. Important to fix; not a today-exploit.

### Architectural tradeoff, not a fix

Finding 2.2 (`USING (true)` on junction tables) is in real tension with CLAUDE.md's documented decision to filter relationships in JS for performance. See the dedicated section below — it does not belong on a "fix list."

---

## 1. Auth & Authorization

### 1.1 Public GET API leaks unpublished/soft-deleted content (High)
**Location:** `src/middleware.ts:61-63`; `src/cms/operations/fetch.ts:7-39`; GET handlers e.g. `src/app/api/case-studies/route.ts:9-38` (and 8 other content types).

Middleware short-circuits all `GET` requests under `/api` with a comment "(This maintains current behavior while we add protection incrementally)". Handlers call `fetchContentBySlug(typeSlug, slug)` which builds a service-role query with no `.eq('published', true)` or `.is('deleted_at', null)` filter. `listContent` defaults to `publishedOnly: true`, but the slug branch does not.

**Impact:** Any anonymous user can GET `/api/case-studies?slug=<draft-slug>` and receive the full record of unpublished, draft, or soft-deleted content — including `main_content`, `academic_references`, `deleted_at`, internal IDs, and all relationships. Admin RLS protections are bypassed because the query runs with the service role.

**Fix:** Add `.eq('published', true).is('deleted_at', null)` in `fetchContentBySlug` for non-preview reads, OR gate public GET handlers behind `requireAdmin()` for slug lookups, OR remove the GET-bypass in middleware.

### 1.3 Server actions don't re-check admin role (Critical via misconfiguration — see Tier 2)
**Location:** `src/app/admin/case-studies/[id]/actions.ts:26-64` (and parallel `actions.ts` for all 9 content types).

All `'use server'` functions call `createContent`/`updateContent`/`publishContent`/`unpublishContent` which use `createServiceRoleSupabaseClient()` to write directly. **No `requireAdmin()` call inside these actions.**

**Why this is Tier 2, not Tier 1:** server actions are invoked via POST to the originating page. The middleware matcher includes `/admin/:path*`, so the role check **does** run in the default path and **does** block unauthorised callers. The exploit chain only closes if (a) the middleware is misconfigured / future routes land outside `/admin/`, (b) Next.js mishandles `Response.redirect` in server-action context (a hypothetical, not an observed bug), or (c) finding 1.4 fires and `DEV_MODE_AUTH_BYPASS` is true with a spoofed Host. None of these is exploitable today in the default configuration.

**Why fix it anyway:** the cost is one line per file × 9 files. The defense-in-depth value is real — middleware is one matcher edit away from gapping. Pair this fix with 1.4 in the same PR.

**Fix:** Add `await requireAdmin()` at the top of every `'use server'` function. `auth.ts` already exists for this.

### 1.4 `DEV_MODE_AUTH_BYPASS` not gated by `NODE_ENV` (High)
**Location:** `src/middleware.ts:121-127`; `scripts/enable-dev-mode.js`.

Bypass condition is `process.env.DEV_MODE_AUTH_BYPASS === 'true' && (host?.includes('localhost') || host?.includes('127.0.0.1'))`. No `process.env.NODE_ENV !== 'production'` guard. The Host header is client-controlled. `host?.includes('localhost')` matches any host whose name *contains* "localhost" — e.g. `evil-localhost.example.com`.

**Impact:** Full admin bypass on production if env var is ever set (accidentally in Vercel project settings, copied from `.env.local`).

**Fix:** Guard with `process.env.NODE_ENV === 'development'`, change to exact host comparison, add a server-startup assertion that the flag cannot be true in prod.

### 1.2 `setup_admin_role(text)` SQL function not permission-revoked (Low / Info)
**Location:** `migrations/20260110101340_remote_schema.sql:845-858`.

Function is `LANGUAGE plpgsql` with `search_path = public` set, but no `SECURITY DEFINER` and no permission revocation. If `EXECUTE` is granted to `anon`/`authenticated` (default in Postgres unless revoked), an authenticated user could call `setup_admin_role('attacker@example.com')` to grant themselves admin.

**Fix:** `REVOKE EXECUTE ON FUNCTION public.setup_admin_role(text) FROM PUBLIC, anon, authenticated;` or mark `SECURITY DEFINER` with explicit caller auth check.

---

## 2. RLS Policies

### 2.1 Excessive table-level GRANTs to anon/authenticated (High)
**Location:** `migrations/20260110101340_remote_schema.sql:928-1598+`.

Every public table grants all CRUD privileges to `anon`, `authenticated`, `service_role`. Postgres `GRANT all` paired with RLS is dangerous — if any table accidentally has RLS disabled or policies are dropped (as happened in `20260228_drop_broken_admin_rls_policies.sql`), the table becomes wide open.

After the cleanup migration, several tables (`algorithm_industry_relations`, `case_study_industry_relations`, `case_study_persona_relations`, etc.) have only public SELECT policies — no policy gating INSERT/UPDATE/DELETE. RLS denies-by-default, but defense is one configuration mistake from collapse. There's also policy sprawl: `case_studies` has duplicate "Admins can manage" `FOR ALL` *and* per-action "Admins can update / delete / create" policies in `20260302_fix_overlapping_policies.sql`.

**Fix:** `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;`. Keep only `SELECT, REFERENCES`. Service role bypasses RLS, so admin writes go through it via the API.

### 2.2 Junction-table SELECT policies are `USING (true)` — architectural tradeoff, not a fix
**Location:** `migrations/20260110101340_remote_schema.sql:1979-2170`.

All junction tables have `for select to public using (true)`. Junction tables have `deleted_at` columns; parent content tables have `published`/`deleted_at`. Public SELECT exposes relationships of soft-deleted or unpublished items — UUID-to-UUID rows that confirm a relationship exists, but no content fields.

**Why this is a tradeoff, not a one-line fix:**

CLAUDE.md documents an explicit decision to filter relationships in JS rather than at the database, citing PostgREST limits on filtering joined entities. The RLS-side fix proposed in earlier review notes (a subquery into the parent table per relationship row) directly contradicts that decision. It's not wrong; it's a different architectural choice with a different cost profile.

**Two positions:**

- **Position 1 — RLS-side filtering.** Defense-in-depth via the database. The `USING` clause becomes `(deleted_at IS NULL AND EXISTS (SELECT 1 FROM <parent_table> p WHERE p.id = <fk> AND p.published = true AND p.deleted_at IS NULL))`. Adds a subquery on every relationship read. Performance cost depends on join cardinality and index coverage — unmeasured. Strictly safer.

- **Position 2 — Keep JS filtering, depend on finding 1.1's fix.** Accept that junction rows leak (UUIDs only, not content). Prevent dereferencing via the Tier 1 fix to `fetchContentBySlug`. Performance unchanged. Single line of defense; if the Tier 1 fix regresses, junction enumeration becomes useful again to attackers.

**This decision belongs in Phase 1**, not Phase A. It interacts with: how often relationships are read on hot paths, how confident we are in the Tier 1 fix holding over time, and the team's broader stance on database-level vs. application-level enforcement.

The right next step is **measure**: run a sample query both ways against a realistic dataset, see what the cost actually is, then choose. Treating it as "just a Medium finding to tick off" loses information.

### 2.3 `deletion_audit_log` readable by every authenticated user (Medium — Tier 2)
**Location:** `migrations/20260111_create_deletion_audit_log.sql:29-33`.

Policy is `FOR SELECT TO authenticated USING (true)`. Comment says "Admin checking is done at application level." Any logged-in user can SELECT all audit rows, including `metadata` JSONB which contains full content snapshots of deleted records.

**Why Tier 2:** the gate is signup. An anonymous attacker cannot reach this; they must register an account first. If signup is open and no rate limit / verification gate exists, this becomes Tier 1. (Open question: is signup open? It's worth confirming as part of the security PR.)

**Impact:** Privilege escalation post-signup — any account can read draft/unpublished content via `metadata->'content_snapshot'`, plus admin user IDs.

**Fix:** `USING (EXISTS (SELECT 1 FROM user_preferences WHERE id = (SELECT auth.uid()) AND role = 'admin'))`.

---

## 3. Service-role usage

### 3.1 Public GET handlers use service role to fetch content (High)
**Location:** `src/cms/operations/fetch.ts:14, 48, 84`; `src/lib/content-fetchers.ts:21,73,169,253,359`; `src/utils/content-management.ts:46,109,128,169,252,384,474,501`.

Every fetch path uses `createServiceRoleSupabaseClient()`, including code reachable from anonymous public API routes. Service role bypasses RLS, so the only protection is the explicit `.eq('published', true)` filter in JS code — and `fetchContentBySlug` lacks it.

**Impact:** Single missed published-filter = exposure of any draft or system-internal record.

**Fix:** Switch public-reachable read paths to `createServerSupabaseClient()` so RLS handles the filtering. Keep service role only for build-time and admin-write paths.

---

## 4. CSRF & origin validation

CSRF checks are correctly applied to POST/PUT/PATCH/DELETE on API routes. Server actions rely on Next.js framework CSRF (Next-Action header + same-origin policy at framework level). Manual check is bypassed for server actions but framework provides equivalent.

**Action:** Document that server actions rely on Next.js framework CSRF. Add per-action `requireAdmin()` for defense-in-depth (see 1.3).

---

## 5. Input validation

### 5.1 Bulk delete/restore endpoints accept arbitrary `id`/`ids` without UUID validation (Low)
**Location:** `src/app/api/case-studies/delete/route.ts:11-23`, restore, permanent-delete; all 9 content-type delete routes.

`const { id, ids } = await request.json()` — no Zod validation. Strings flow into Supabase queries (parameterized, so no SQL injection), but invalid types may produce 500s leaking stack traces.

**Fix:** `z.object({ id: z.string().uuid().optional(), ids: z.array(z.string().uuid()).max(MAX_BULK_IDS).optional() })`.

### 5.2 `searchContent` interpolates user input into PostgREST `.or()` filter (Low)
**Location:** `src/lib/content-fetchers.ts:354-366`; `src/utils/content-management.ts:71-75`.

`sanitizeSearchTerm` strips `,.()"\\` and slices to 200 chars. Reasonable. `fetchContentItems` at `content-management.ts:71-75` does *not* sanitize. Negligible — Supabase escapes ilike server-side — but inconsistent.

**Fix:** Use the sanitize helper everywhere; consider `.textSearch()` against existing tsvector columns.

---

## 6. XSS

### 6.1 Markdown rendering correctly sanitizes — good (Info)
**Location:** `src/lib/markdown-server.ts:65-76`. `markdown-it` with `html: true`, but every render passes through `DOMPurify.sanitize` with whitelisted tags/attrs. CSP `frame-src 'self' https://vercel.live` in `next.config.ts:119` constrains iframes.

**Concern:** `iframe` with `src` allowed, so admin can embed arbitrary iframe URLs. Mitigated by CSP. Worth verifying the `frame-src` is intentional.

### 6.2 `AutoSchema.tsx` injects JSON-LD via `dangerouslySetInnerHTML` (Low)
**Location:** `src/components/AutoSchema.tsx:63`. Likely `JSON.stringify(schema)` content. JSON.stringify alone does not escape `</script>`.

**Fix:** Replace `</` with `<\\/` after `JSON.stringify`.

---

## 7. SQL injection / RPC abuse

### 7.1 `soft_delete_content` / `recover_content` validate table names against allow-list — good (Info)
Functions use `format(%I, table_name)` only after validation against `ARRAY['case_studies', 'blog_posts', 'algorithms', 'industries', 'personas']`. Note: the list does **not** include `quantum_software`, `quantum_hardware`, `quantum_companies`, `partner_companies`. Their delete API routes don't call this RPC — but if added later, they'd silently fail.

---

## 8. Dependency vulnerabilities

### 8.1 5 moderate-severity npm advisories (Medium)
All stem from transitive `postcss <8.5.10` (GHSA-qx2v-qp2m-jg93, CWE-79). Affects `next`, `@sentry/nextjs`, `@vercel/analytics`, `@vercel/speed-insights`. No High/Critical.

**Fix:** `npm update next` once a patch is available, or add a `postcss` override (overrides already exist for `serialize-javascript`, `tar`, `vite`, `uuid`).

---

## 9. Secrets & env handling

### 9.1 Service role key is server-only — confirmed clean (Info)
`SUPABASE_SERVICE_ROLE_KEY` only via `process.env`, never exposed via `NEXT_PUBLIC_*`. `supabase-server.ts` only imported from server contexts. No hardcoded secrets in source.

---

## 10. Public API surface & data leakage

See 1.1 for primary finding. Additionally:

### 10.1 Inconsistent response shape (Low)
`partner-companies` and `quantum-software` GET return raw arrays without pagination wrapper when `page` not specified. Encourages clients to dump full datasets.

---

## 11. Rate limiting

### 11.1 No rate limiting on auth/login or admin write endpoints (Medium)
Login flows use Supabase Auth client-side (Supabase rate limits apply, but no app-level limit). Admin API write routes — none. Newsletter signup and search-data routes have it.

**Impact:** Authenticated admin endpoints protected by `requireAdmin`, so abuse requires stolen admin session. Subscription-status endpoint at `src/app/api/newsletter/subscription/route.ts` has no rate limit — reveals subscription state for any email if combined with another vuln.

**Fix:** Add `applyRateLimit` per identifier on all write paths.

---

## 12. Cookie & session security

Cookies use Supabase SSR defaults — generally secure (HttpOnly, SameSite lax, Secure in prod) but not explicitly verified. Worth checking no override in `src/lib/supabase-server.ts:31-43` or `src/lib/supabase-middleware.ts:25-36`.

---

## 13. CORS

No custom CORS configured — Next.js default same-origin only. (Info — positive.)

---

## 14. Logging & PII

### 14.1 Email addresses logged via console.error and Sentry on newsletter failures (Low)
**Location:** `src/app/api/newsletter/route.ts:84,141,186`; `src/lib/dual-newsletter-service.ts:98,120,134`.

Errors from Beehiiv/Resend/database often include the email in the error object and propagate to Sentry. Sentry server config does not set `sendDefaultPii: false`.

**Fix:** Set `sendDefaultPii: false` in `sentry.server.config.ts` and `sentry.edge.config.ts`; scrub email in `beforeSend`.

---

## 15. Build-time concerns

`revalidatePath` invocations are admin-gated, low risk. No `eval`, no dynamic `Function()`, no user-controlled `import()`. The `fromTable(client, table as any)` cast at `src/lib/supabase-untyped.ts:9-12` always supplies `table` from registered content-type names, never user input. (Info — clean.)
