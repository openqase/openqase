import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const enable = vi.fn()
const requireAdmin = vi.fn()
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})

vi.mock('next/headers', () => ({
  draftMode: async () => ({ enable, disable: vi.fn() }),
}))
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }))
vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdmin() }))

import { GET } from './route'

const req = (qs: string) => new NextRequest(`http://localhost/api/preview?${qs}`)

describe('GET /api/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PREVIEW_SECRET = 'test-secret'
  })

  it('enables draft mode with a valid secret without checking the session', async () => {
    await expect(GET(req('secret=test-secret&type=case-study&slug=foo'))).rejects.toThrow('REDIRECT:/case-study/foo')
    expect(enable).toHaveBeenCalled()
    expect(requireAdmin).not.toHaveBeenCalled()
  })

  it('enables draft mode for a signed-in admin without a secret', async () => {
    requireAdmin.mockResolvedValue({ user: { id: 'u1' }, error: null })
    await expect(GET(req('type=algorithm&slug=bar'))).rejects.toThrow('REDIRECT:/paths/algorithm/bar')
    expect(enable).toHaveBeenCalled()
  })

  it('rejects a wrong secret when the caller is not an admin', async () => {
    requireAdmin.mockResolvedValue({ user: null, error: new Response(null, { status: 401 }) })
    const res = await GET(req('secret=wrong-secret&slug=foo'))
    expect(res?.status).toBe(401)
    expect(enable).not.toHaveBeenCalled()
  })

  it('rejects a non-admin with no secret even when PREVIEW_SECRET is unset', async () => {
    delete process.env.PREVIEW_SECRET
    requireAdmin.mockResolvedValue({ user: null, error: new Response(null, { status: 401 }) })
    const res = await GET(req('slug=foo'))
    expect(res?.status).toBe(401)
    expect(enable).not.toHaveBeenCalled()
  })

  it.each([
    ['case-study', '/case-study/'],
    ['algorithm', '/paths/algorithm/'],
    ['industry', '/paths/industry/'],
    ['persona', '/paths/persona/'],
    ['blog', '/blog/'],
    ['quantum-hardware', '/paths/quantum-hardware/'],
    ['quantum-software', '/paths/quantum-software/'],
    ['quantum-companies', '/paths/quantum-companies/'],
    ['partner-companies', '/paths/partner-companies/'],
  ])('redirects type=%s to %s<slug>', async (type, basePath) => {
    await expect(GET(req(`secret=test-secret&type=${type}&slug=my-item`))).rejects.toThrow(
      `REDIRECT:${basePath}my-item`
    )
    expect(enable).toHaveBeenCalled()
  })

  it('URL-encodes the slug so it stays within one path segment', async () => {
    const slug = encodeURIComponent('../admin?x=1')
    await expect(GET(req(`secret=test-secret&type=quantum-hardware&slug=${slug}`))).rejects.toThrow(
      'REDIRECT:/paths/quantum-hardware/..%2Fadmin%3Fx%3D1'
    )
  })

  it('redirects unknown types to the homepage', async () => {
    await expect(GET(req('secret=test-secret&type=nope&slug=foo'))).rejects.toThrow(/^REDIRECT:\/$/)
    await expect(GET(req('secret=test-secret&type=__proto__&slug=foo'))).rejects.toThrow(/^REDIRECT:\/$/)
  })

  it('redirects to the homepage when no slug is given', async () => {
    await expect(GET(req('secret=test-secret&type=quantum-software'))).rejects.toThrow(/^REDIRECT:\/$/)
  })
})
