import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const createContent = vi.fn()
const DUPLICATE = { error: 'duplicate key value violates unique constraint "case_studies_slug_key"' }

vi.mock('@/cms/operations', () => ({ createContent: (...args: unknown[]) => createContent(...args) }))

import { POST } from './route'

const TOKEN = 'test-token'
const VALID = { title: 'Bank X Prices Bonds With QAOA!', year: 2026, source_url: 'https://example.com/paper' }

function draftRequest(body: unknown, token: string | null = TOKEN) {
  return new NextRequest('http://localhost/api/case-studies/drafts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  })
}

describe('POST /api/case-studies/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SCRAPER_API_TOKEN', TOKEN)
    createContent.mockResolvedValue({ data: { id: 'cs-1', slug: 'bank-x-prices-bonds-with-qaoa' } })
  })
  afterEach(() => vi.unstubAllEnvs())

  it('is disabled when no token is configured', async () => {
    vi.stubEnv('SCRAPER_API_TOKEN', '')
    expect((await POST(draftRequest(VALID))).status).toBe(503)
    expect(createContent).not.toHaveBeenCalled()
  })

  it.each([null, 'wrong-token'])('rejects a missing or wrong token (%s)', async token => {
    expect((await POST(draftRequest(VALID, token))).status).toBe(401)
    expect(createContent).not.toHaveBeenCalled()
  })

  it('rejects a body without the required fields', async () => {
    expect((await POST(draftRequest({ title: 'No year' }))).status).toBe(400)
    expect(createContent).not.toHaveBeenCalled()
  })

  it('creates a draft with a generated slug and the source as a reference', async () => {
    const res = await POST(draftRequest(VALID))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 'cs-1', slug: 'bank-x-prices-bonds-with-qaoa', admin_url: '/admin/case-studies/cs-1' })
    expect(createContent).toHaveBeenCalledWith('case-studies', expect.objectContaining({
      title: VALID.title, year: 2026, slug: 'bank-x-prices-bonds-with-qaoa', academic_references: '- https://example.com/paper',
    }))
  })

  it('never publishes, even if the caller asks to', async () => {
    await POST(draftRequest({ ...VALID, published: true }))
    expect(createContent.mock.calls[0][1]).not.toHaveProperty('published')
  })

  it('retries with a suffix when the slug is already taken', async () => {
    createContent.mockResolvedValueOnce(DUPLICATE).mockResolvedValueOnce(DUPLICATE)
    expect((await POST(draftRequest(VALID))).status).toBe(201)
    expect(createContent.mock.calls.map(call => call[1].slug)).toEqual([
      'bank-x-prices-bonds-with-qaoa', 'bank-x-prices-bonds-with-qaoa-2', 'bank-x-prices-bonds-with-qaoa-3',
    ])
  })

  it('gives up with a conflict when every slug is taken', async () => {
    createContent.mockResolvedValue(DUPLICATE)
    expect((await POST(draftRequest(VALID))).status).toBe(409)
    expect(createContent).toHaveBeenCalledTimes(20)
  })

  it('reports other save failures as a server error', async () => {
    createContent.mockResolvedValue({ error: 'connection refused' })
    expect((await POST(draftRequest(VALID))).status).toBe(500)
    expect(createContent).toHaveBeenCalledTimes(1)
  })
})
