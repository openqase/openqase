// src/app/api/case-studies/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const publishContent = vi.fn()
const unpublishContent = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/auth', () => ({ requireAdmin: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, error: null }) }))
vi.mock('@/cms/operations', () => ({
  listContent: vi.fn(),
  fetchContentBySlug: vi.fn(),
  deleteContent: vi.fn(),
  deleteContentMany: vi.fn(),
  publishContent: (...args: unknown[]) => publishContent(...args),
  unpublishContent: (...args: unknown[]) => unpublishContent(...args),
  revalidateContentType: vi.fn(),
}))
vi.mock('@/lib/supabase-server', () => ({ createServiceRoleSupabaseClient: () => ({ from: mockFrom }) }))

import { PATCH } from './route'

const ID1 = '11111111-1111-4111-8111-111111111111'
const ID2 = '22222222-2222-4222-8222-222222222222'
const ID3 = '33333333-3333-4333-8333-333333333333'

function bulkRequest(operation: 'publish' | 'unpublish', ids: string[]) {
  return new NextRequest('http://localhost/api/case-studies', {
    method: 'PATCH',
    body: JSON.stringify({ bulk: true, operation, ids }),
    headers: { 'content-type': 'application/json' },
  })
}

describe('PATCH /api/case-studies bulk publish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('publishes each id through publishContent and never writes the table directly', async () => {
    publishContent.mockResolvedValue({ success: true })
    const res = await PATCH(bulkRequest('publish', [ID1, ID2]))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(publishContent).toHaveBeenCalledTimes(2)
    expect(publishContent).toHaveBeenCalledWith('case-studies', ID1)
    expect(publishContent).toHaveBeenCalledWith('case-studies', ID2)
    expect(mockFrom).not.toHaveBeenCalled()
    expect(body.updated).toBe(2)
    expect(body.failed).toEqual([])
  })

  it('reports ids that publishContent refused (e.g. trashed) without failing the others', async () => {
    publishContent.mockImplementation(async (_type: string, id: string) =>
      id === ID2 ? { success: false, error: 'trashed' } : { success: true }
    )
    const res = await PATCH(bulkRequest('publish', [ID1, ID2, ID3]))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.updated).toBe(2)
    expect(body.failed).toEqual([ID2])
  })

  it('reports every id as failed when publishContent refuses them all', async () => {
    publishContent.mockResolvedValue({ success: false, error: 'trashed' })
    const res = await PATCH(bulkRequest('publish', [ID1, ID2]))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.updated).toBe(0)
    expect(body.failed).toEqual([ID1, ID2])
    expect(body.message).toContain('could not be')
  })

  it('unpublishes through unpublishContent', async () => {
    unpublishContent.mockResolvedValue({ success: true })
    const res = await PATCH(bulkRequest('unpublish', [ID1]))
    expect(res.status).toBe(200)
    expect(unpublishContent).toHaveBeenCalledWith('case-studies', ID1)
    expect(publishContent).not.toHaveBeenCalled()
  })
})
