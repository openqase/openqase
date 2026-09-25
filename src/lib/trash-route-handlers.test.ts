import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const requireAdmin = vi.fn()
const restoreContent = vi.fn()
const permanentlyDeleteContent = vi.fn()

vi.mock('@/lib/auth', () => ({ requireAdmin: () => requireAdmin() }))
vi.mock('@/cms/operations', () => ({
  restoreContent: (...args: unknown[]) => restoreContent(...args),
  permanentlyDeleteContent: (...args: unknown[]) => permanentlyDeleteContent(...args),
}))

import { createRestoreHandler, createPermanentDeleteHandler } from './trash-route-handlers'

const ID1 = '11111111-1111-4111-8111-111111111111'
const ID2 = '22222222-2222-4222-8222-222222222222'

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/x', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const asAdmin = () => requireAdmin.mockResolvedValue({ user: { id: 'admin-1' }, error: null })

const ALL_TYPES = [
  'case-studies',
  'algorithms',
  'industries',
  'personas',
  'blog-posts',
  'quantum-hardware',
  'quantum-software',
  'quantum-companies',
  'partner-companies',
]

describe('trash route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restoreContent.mockResolvedValue({ success: true })
    permanentlyDeleteContent.mockResolvedValue({ success: true, deleted: 1 })
  })

  describe('auth', () => {
    it.each([
      ['restore', createRestoreHandler('industries')],
      ['permanent-delete', createPermanentDeleteHandler('industries')],
    ])('%s rejects non-admins without touching the operations', async (_name, handler) => {
      requireAdmin.mockResolvedValue({
        user: null,
        error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
      })
      const res = await handler(post({ id: ID1 }))
      expect(res.status).toBe(403)
      expect(restoreContent).not.toHaveBeenCalled()
      expect(permanentlyDeleteContent).not.toHaveBeenCalled()
    })
  })

  describe('type allow-list', () => {
    it.each([
      ['restore', createRestoreHandler('users')],
      ['permanent-delete', createPermanentDeleteHandler('user_preferences')],
    ])('%s rejects a type that is not in the CMS registry', async (_name, handler) => {
      asAdmin()
      const res = await handler(post({ id: ID1 }))
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: expect.stringContaining('Unknown content type') })
      expect(restoreContent).not.toHaveBeenCalled()
      expect(permanentlyDeleteContent).not.toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it.each([{}, { id: 'not-a-uuid' }, { ids: [] }])('rejects %j with 400', async (body) => {
      asAdmin()
      const res = await createRestoreHandler('algorithms')(post(body))
      expect(res.status).toBe(400)
      expect(restoreContent).not.toHaveBeenCalled()
    })

    it('rejects a malformed JSON body with 400', async () => {
      asAdmin()
      const req = new NextRequest('http://localhost/api/x', { method: 'POST', body: '{nope' })
      const res = await createPermanentDeleteHandler('algorithms')(req)
      expect(res.status).toBe(400)
      expect(permanentlyDeleteContent).not.toHaveBeenCalled()
    })
  })

  describe('restore', () => {
    it('restores a single id with restoredBy = admin user id', async () => {
      asAdmin()
      const res = await createRestoreHandler('personas')(post({ id: ID1 }))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true, restored: 1 })
      expect(restoreContent).toHaveBeenCalledWith('personas', ID1, { restoredBy: 'admin-1' })
    })

    it('restores each id in a bulk request', async () => {
      asAdmin()
      const res = await createRestoreHandler('blog-posts')(post({ ids: [ID1, ID2] }))
      expect(await res.json()).toEqual({ success: true, restored: 2 })
      expect(restoreContent).toHaveBeenCalledTimes(2)
      expect(restoreContent).toHaveBeenNthCalledWith(1, 'blog-posts', ID1, { restoredBy: 'admin-1' })
      expect(restoreContent).toHaveBeenNthCalledWith(2, 'blog-posts', ID2, { restoredBy: 'admin-1' })
    })

    it('returns 500 listing the ids that failed', async () => {
      asAdmin()
      restoreContent.mockImplementation(async (_t: string, id: string) =>
        id === ID2 ? { success: false, error: 'not found in trash' } : { success: true }
      )
      const res = await createRestoreHandler('industries')(post({ ids: [ID1, ID2] }))
      expect(res.status).toBe(500)
      expect((await res.json()).error).toBe(`Failed to restore industries: ${ID2}`)
    })
  })

  describe('permanent delete', () => {
    it('passes the ids and extra junctions through', async () => {
      asAdmin()
      permanentlyDeleteContent.mockResolvedValue({ success: true, deleted: 2 })
      const extra = [{ junctionTable: 'case_study_relations', contentIdField: 'case_study_id' }]
      const res = await createPermanentDeleteHandler('case-studies', extra)(post({ ids: [ID1, ID2] }))
      expect(await res.json()).toEqual({ success: true, deleted: 2 })
      expect(permanentlyDeleteContent).toHaveBeenCalledWith('case-studies', [ID1, ID2], extra)
    })

    it('normalises a single id to an array with no extra junctions by default', async () => {
      asAdmin()
      await createPermanentDeleteHandler('quantum-hardware')(post({ id: ID1 }))
      expect(permanentlyDeleteContent).toHaveBeenCalledWith('quantum-hardware', [ID1], [])
    })

    it('returns 500 when the operation fails', async () => {
      asAdmin()
      permanentlyDeleteContent.mockResolvedValue({ success: false, error: 'boom', deleted: 0 })
      const res = await createPermanentDeleteHandler('quantum-companies')(post({ id: ID1 }))
      expect(res.status).toBe(500)
      expect((await res.json()).error).toBe('Failed to permanently delete quantum companies')
    })
  })

  describe('per-type route files', () => {
    it.each(ALL_TYPES)('/api/%s/restore and /permanent-delete are bound to their type', async (type) => {
      asAdmin()
      const restore = await import(`@/app/api/${type}/restore/route.ts`)
      const purge = await import(`@/app/api/${type}/permanent-delete/route.ts`)

      await restore.POST(post({ id: ID1 }))
      expect(restoreContent).toHaveBeenCalledWith(type, ID1, { restoredBy: 'admin-1' })

      await purge.POST(post({ id: ID1 }))
      expect(permanentlyDeleteContent).toHaveBeenCalledWith(type, [ID1], expect.any(Array))
    })

    it('case studies permanent delete keeps the case_study_relations junction', async () => {
      asAdmin()
      const purge = await import('@/app/api/case-studies/permanent-delete/route')
      await purge.POST(post({ id: ID1 }))
      expect(permanentlyDeleteContent).toHaveBeenCalledWith('case-studies', [ID1], [
        { junctionTable: 'case_study_relations', contentIdField: 'case_study_id' },
      ])
    })
  })
})
