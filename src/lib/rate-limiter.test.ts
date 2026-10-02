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
