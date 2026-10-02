# Sentry Wiring & CSP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Sentry server/edge config files actually load, tag events with the real deployment environment, drop the legacy Sentry ingest wildcard from the CSP, and make the rate-limiter's client identifier consistent across routes.

**Architecture:** `src/instrumentation.ts` becomes the documented Sentry-for-Next.js shape: `register()` dynamically imports `sentry.server.config.ts` / `sentry.edge.config.ts` by runtime instead of carrying its own slimmer `Sentry.init`. The three config files read `environment` from `VERCEL_ENV` with `NODE_ENV` as fallback. CSP keeps the regioned US ingest wildcard only. `getClientIdentifier` becomes the single place that derives a client key and the newsletter route uses it.

**Tech Stack:** Next.js 16 (Turbopack), @sentry/nextjs 10.57, Vitest (node), Vercel.

**Spec:** `docs/superpowers/plans/2026-10-01-review-fixes-roadmap.md` row 2.

## Global Constraints

- Branch `fix/sentry-wiring-and-csp` from `main` (e65bebe or later). No dependency on PR #253.
- Every commit must leave `npm test`, `npm run typecheck`, `npm run lint` (0 errors) green; `npm run build` must pass before the PR.
- Production behaviour that must NOT change: `tracesSampleRate` 0.1 in production / 0 otherwise; `enabled` only in production or when `SENTRY_DEV`/`NEXT_PUBLIC_SENTRY_DEV` is `'true'`; `debug` only when `SENTRY_DEBUG`/`NEXT_PUBLIC_SENTRY_DEBUG` is `'true'`; `dsn` fallback `SENTRY_DSN || NEXT_PUBLIC_SENTRY_DSN` on server/edge; client uses `NEXT_PUBLIC_SENTRY_DSN`; `replaysSessionSampleRate` 0, `replaysOnErrorSampleRate` 1.0 in production.
- CSP: `script-src` and every other directive stay byte-identical except the one `connect-src` entry removed.
- Commit messages: conventional, no attribution footer. Do not push or open the PR without the user's go-ahead.
- CHANGELOG `[Unreleased]` entries in the final task.

## Review Focus

1. `register()` with `NEXT_RUNTIME=nodejs` must initialise Sentry exactly once, with the full server options (the `beforeSend` filter present) — Task 1 test.
2. `register()` with `NEXT_RUNTIME=edge` must load the edge config and not the server one — Task 1 test.
3. A Vercel preview deployment (`NODE_ENV=production`, `VERCEL_ENV=preview`) must report `environment: 'preview'` — Task 2 test.
4. A request with `x-forwarded-for: "203.0.113.5, 10.0.0.1"` and `x-real-ip: 203.0.113.5` must map to `203.0.113.5`; a request with neither header must not share a bucket with every other anonymous request forever — Task 3 test.
5. The CSP must still allow the real ingest host shape `https://o<id>.ingest.us.sentry.io` — Task 2 test asserts the kept entry.

---

### Task 1: Load the Sentry config files from `instrumentation.ts`

**Files:**
- Modify: `src/instrumentation.ts` (whole file)
- Create: `src/instrumentation.test.ts`

**Interfaces:**
- Consumes: `sentry.server.config.ts` and `sentry.edge.config.ts` at the repo root (each calls `Sentry.init(...)` at module top level).
- Produces: `register(): Promise<void>` and `onRequestError` exports, unchanged names.

- [ ] **Step 1: Write the failing test**

```ts
// src/instrumentation.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const init = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  init: (...args: unknown[]) => init(...args),
  httpIntegration: () => ({ name: 'Http' }),
  captureRequestError: vi.fn(),
}))

const ORIGINAL_RUNTIME = process.env.NEXT_RUNTIME

describe('instrumentation.register', () => {
  beforeEach(() => {
    vi.resetModules()
    init.mockClear()
  })
  afterEach(() => {
    if (ORIGINAL_RUNTIME === undefined) delete process.env.NEXT_RUNTIME
    else process.env.NEXT_RUNTIME = ORIGINAL_RUNTIME
  })

  it('loads the full server config (with the beforeSend filter) for the nodejs runtime', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    const { register } = await import('./instrumentation')
    await register()
    expect(init).toHaveBeenCalledTimes(1)
    const options = init.mock.calls[0][0] as Record<string, unknown>
    expect(typeof options.beforeSend).toBe('function')
    expect(typeof options.beforeSendTransaction).toBe('function')
    expect(Array.isArray(options.integrations)).toBe(true)
  })

  it('loads the edge config (no beforeSend) for the edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    const { register } = await import('./instrumentation')
    await register()
    expect(init).toHaveBeenCalledTimes(1)
    const options = init.mock.calls[0][0] as Record<string, unknown>
    expect(options.beforeSend).toBeUndefined()
  })

  it('does nothing for an unknown runtime', async () => {
    delete process.env.NEXT_RUNTIME
    const { register } = await import('./instrumentation')
    await register()
    expect(init).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/instrumentation.test.ts`
Expected: first test FAILS — `options.beforeSend` is undefined because the inline init in `instrumentation.ts` has no filter.

- [ ] **Step 3: Replace `src/instrumentation.ts`**

```ts
import * as Sentry from '@sentry/nextjs';

/**
 * Next.js instrumentation hook. The Sentry SDK does not auto-load the root
 * sentry.*.config.ts files; they must be imported here per runtime, which is
 * the documented @sentry/nextjs setup. Keeping a second inline Sentry.init
 * here previously meant the real server options (error filtering, profiling,
 * HTTP integration) never took effect.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/instrumentation.test.ts && npm run typecheck`
Expected: 3 passed; tsc clean. If tsc complains about the relative import of a root `.ts` file, confirm `tsconfig.json` `include` has `**/*.ts` (it does) and that the file is not excluded.

- [ ] **Step 5: Commit**

```bash
git add src/instrumentation.ts src/instrumentation.test.ts
git commit -m "fix(sentry): load server and edge config files from instrumentation"
```

---

### Task 2: Deployment environment tag and CSP narrowing

**Files:**
- Modify: `sentry.server.config.ts:9`, `sentry.edge.config.ts:9`, `src/instrumentation-client.ts:9` (the `environment:` line in each)
- Modify: `next.config.ts:23-24` (remove the `'https://*.ingest.sentry.io'` entry)
- Create: `src/__tests__/security/csp.test.ts`

**Interfaces:**
- Produces: `environment` is `process.env.VERCEL_ENV || process.env.NODE_ENV` in all three inits.

- [ ] **Step 1: Write the failing tests**

Environment test — append to `src/instrumentation.test.ts` inside the `describe` block:

```ts
  it('tags events with VERCEL_ENV when set, so previews are not reported as production', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    const original = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'preview'
    try {
      const { register } = await import('./instrumentation')
      await register()
      const options = init.mock.calls[0][0] as Record<string, unknown>
      expect(options.environment).toBe('preview')
    } finally {
      if (original === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = original
    }
  })
```

CSP test — source-level guard in the style of `src/__tests__/security/findings.test.ts`:

```ts
// src/__tests__/security/csp.test.ts
/**
 * Security regression tests — Content-Security-Policy in next.config.ts.
 * The config exports withSentryConfig(...) which is heavy to import under
 * vitest, so these assert against the source text.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const src = readFileSync('next.config.ts', 'utf8')

describe('Content-Security-Policy source guard', () => {
  it('keeps the regioned Sentry ingest host and drops the legacy unregioned wildcard', () => {
    expect(src).toContain("'https://*.ingest.us.sentry.io'")
    expect(src).not.toContain("'https://*.ingest.sentry.io'")
  })

  it('never allows unsafe-eval in script-src', () => {
    const scriptSrc = src.match(/"script-src[^"]*"/)?.[0] ?? ''
    expect(scriptSrc).not.toContain('unsafe-eval')
  })

  it('keeps clickjacking and base/form protections', () => {
    expect(src).toContain("\"frame-ancestors 'none'\"")
    expect(src).toContain("\"base-uri 'self'\"")
    expect(src).toContain("\"form-action 'self'\"")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/instrumentation.test.ts src/__tests__/security/csp.test.ts`
Expected: environment test FAILS (`'production'`/`'test'` instead of `'preview'`); CSP first test FAILS (legacy wildcard present). The other CSP tests pass already.

- [ ] **Step 3: Implement**

In each of `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`, change

```ts
  environment: process.env.NODE_ENV,
```

to

```ts
  // Vercel sets VERCEL_ENV to production | preview | development; NODE_ENV is
  // 'production' for preview builds too, so it cannot distinguish them.
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
```

For the client file, `VERCEL_ENV` is only inlined at build time if referenced as `process.env.VERCEL_ENV` literally (Next.js inlines `NEXT_PUBLIC_*` only). Use `process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV` in `src/instrumentation-client.ts` instead, and add `NEXT_PUBLIC_VERCEL_ENV=` under the Sentry block in `.env.example` with a comment: "Set by Vercel automatically when 'Automatically expose System Environment Variables' is on; used to tag client Sentry events."

In `next.config.ts`, delete the line `'https://*.ingest.sentry.io',` (keep `'https://*.ingest.us.sentry.io',`). Rationale for the brief: the project's DSNs are `o45093…ingest.us.sentry.io` (regioned); the unregioned host was never used, and the browser mostly reports via the `/monitoring` tunnel anyway.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/instrumentation.test.ts src/__tests__/security/csp.test.ts && npm run typecheck`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add sentry.server.config.ts sentry.edge.config.ts src/instrumentation-client.ts src/instrumentation.test.ts next.config.ts src/__tests__/security/csp.test.ts .env.example
git commit -m "fix(sentry): tag deployment environment and narrow CSP ingest host"
```

---

### Task 3: One client identifier for rate limiting

**Files:**
- Modify: `src/lib/rate-limiter.ts:175-198` (`getClientIdentifier`)
- Modify: `src/app/api/newsletter/route.ts:4,25-27`
- Create: `src/lib/rate-limiter.test.ts`

**Interfaces:**
- Produces: `getClientIdentifier(request: Request): string` — prefers `x-real-ip` (set by the platform), then the first `x-forwarded-for` hop, then a per-request-unique fallback `anon:<random>` so header-less requests are never pooled into one shared bucket.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/rate-limiter.test.ts
import { describe, it, expect } from 'vitest'
import { getClientIdentifier } from './rate-limiter'

const req = (headers: Record<string, string>) => new Request('http://localhost/api/x', { headers })

describe('getClientIdentifier', () => {
  it('prefers the platform-set x-real-ip over x-forwarded-for', () => {
    expect(getClientIdentifier(req({ 'x-real-ip': '203.0.113.5', 'x-forwarded-for': '198.51.100.9, 203.0.113.5' }))).toBe('203.0.113.5')
  })

  it('falls back to the first x-forwarded-for hop', () => {
    expect(getClientIdentifier(req({ 'x-forwarded-for': ' 203.0.113.5 , 10.0.0.1' }))).toBe('203.0.113.5')
  })

  it('does not pool header-less requests into one shared bucket', () => {
    const a = getClientIdentifier(req({}))
    const b = getClientIdentifier(req({}))
    expect(a).toMatch(/^anon:/)
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/rate-limiter.test.ts`
Expected: first test FAILS (returns `198.51.100.9`); third FAILS (returns `'unknown'` twice).

- [ ] **Step 3: Implement**

Replace `getClientIdentifier`:

```ts
/**
 * Client key for rate limiting.
 *
 * Vercel sets both x-real-ip and x-forwarded-for from the connecting client
 * and does not forward externally supplied values, so x-real-ip is the most
 * direct signal; the first x-forwarded-for hop is the conventional fallback
 * behind other proxies. A request with neither header gets a unique key so
 * that one abusive anonymous client cannot exhaust a bucket shared by every
 * other header-less request (and so the limiter fails open per request
 * rather than closed for everyone).
 */
export function getClientIdentifier(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  const firstHop = forwarded?.split(',')[0]?.trim();
  if (firstHop) return firstHop;

  return `anon:${crypto.randomUUID()}`;
}
```

`crypto.randomUUID()` is the Web Crypto global, available in Node 20 and the edge runtime; no import needed. If lint objects to the bare global under the security plugin, use `globalThis.crypto.randomUUID()`.

In `src/app/api/newsletter/route.ts`, change the import on line 4 to

```ts
import { rateLimiter, RATE_LIMITS, getClientIdentifier } from '@/lib/rate-limiter'
```

and replace lines 25-27

```ts
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
```

with

```ts
    const clientIP = getClientIdentifier(request)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/rate-limiter.test.ts && npm run lint`
Expected: 3 passed; lint 0 errors. If importing `rate-limiter.ts` in the test starts the in-memory cleanup `setInterval` and vitest warns about open handles, add `.unref()` to the `setInterval(...)` call in the `InMemoryRateLimiter` constructor (`this.cleanupInterval = setInterval(() => { this.cleanup(); }, ...)` → append `.unref()` if the returned timer has it: `this.cleanupInterval.unref?.()` on the next line).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limiter.ts src/lib/rate-limiter.test.ts src/app/api/newsletter/route.ts
git commit -m "fix(api): derive rate-limit client key consistently"
```

---

### Task 4: CHANGELOG and gates

**Files:**
- Modify: `CHANGELOG.md` (`[Unreleased]`)

- [ ] **Step 1: CHANGELOG**

Under `## [Unreleased]`, add to `### Fixed` (top of the list):

```markdown
- **Sentry server config**: The server and edge Sentry configuration files are now actually loaded by the instrumentation hook, so error filtering, HTTP integration and profiling settings take effect; the duplicate inline configuration was removed.
- **Sentry environment**: Events are tagged with the Vercel deployment environment (production / preview / development) instead of reporting every preview as production.
- **Rate limiting**: Client identification now prefers the platform-set IP header, and requests with no IP headers are no longer pooled into one shared limit.
```

and to `### Security`:

```markdown
- **CSP**: Removed the unused legacy `*.ingest.sentry.io` connect-src entry; only the regioned Sentry ingest host remains.
```

- [ ] **Step 2: Gates**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all green; build 383 pages; no CSP-related build warnings.

- [ ] **Step 3: Commit, then stop and report**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for Sentry wiring and CSP fixes"
```

Do not push. Report branch, `git log --oneline main..HEAD`, and gate output.
