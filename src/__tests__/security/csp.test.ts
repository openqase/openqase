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
    expect(scriptSrc).toContain('script-src')
    expect(scriptSrc).not.toContain('unsafe-eval')
  })

  it('keeps clickjacking and base/form protections', () => {
    expect(src).toContain("\"frame-ancestors 'none'\"")
    expect(src).toContain("\"base-uri 'self'\"")
    expect(src).toContain("\"form-action 'self'\"")
  })
})
