import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockSingle = vi.fn()
const mockSelectAfterUpdate = vi.fn(() => ({ single: mockSingle }))
const mockEqAfterUpdate = vi.fn(() => ({ select: mockSelectAfterUpdate }))
const mockUpdate = vi.fn(() => ({ eq: mockEqAfterUpdate }))
const mockDeleteEq = vi.fn(() => Promise.resolve({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockFrom = vi.fn(() => ({ update: mockUpdate, delete: mockDelete }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

const { publishContent, unpublishContent } = await import('./publish')
const { deleteContent } = await import('./delete')

beforeEach(() => { vi.clearAllMocks() })

describe('publishContent', () => {
  it('sets published=true and returns success', async () => {
    mockSingle.mockResolvedValue({ data: { id: '1', slug: 'finance', published: true }, error: null })
    const result = await publishContent('industries', '1')
    expect(result.success).toBe(true)
  })

  it('returns error for unknown type', async () => {
    const result = await publishContent('nonexistent', '1')
    expect(result.error).toBeDefined()
  })
})

describe('unpublishContent', () => {
  it('sets published=false and returns success', async () => {
    mockSingle.mockResolvedValue({ data: { id: '1', slug: 'finance', published: false }, error: null })
    const result = await unpublishContent('industries', '1')
    expect(result.success).toBe(true)
  })
})

describe('deleteContent', () => {
  it('deletes the row and returns success', async () => {
    const result = await deleteContent('industries', '1')
    expect(result.success).toBe(true)
  })
})
