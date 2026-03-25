import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockEqAfterUpdate = vi.fn(() => ({ select: mockSelect }))
const mockUpdate = vi.fn(() => ({ eq: mockEqAfterUpdate }))
const mockDeleteEq = vi.fn()
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

const { createContent } = await import('./create')
const { updateContent } = await import('./update')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createContent', () => {
  it('rejects invalid data with validation errors', async () => {
    // 'name' is required for industries but not provided
    const result = await createContent('industries', { slug: 'test' })
    expect(result.error).toBeDefined()
  })

  it('creates content and returns data on success', async () => {
    mockSingle.mockResolvedValue({
      data: { id: '1', name: 'Finance', slug: 'finance' },
      error: null,
    })
    const result = await createContent('industries', {
      name: 'Finance',
      slug: 'finance',
    })
    expect(result.data).toBeDefined()
    expect(result.data?.name).toBe('Finance')
  })

  it('returns error for unknown content type', async () => {
    const result = await createContent('nonexistent', { name: 'x' })
    expect(result.error).toBeDefined()
  })
})

describe('updateContent', () => {
  it('updates existing content by ID', async () => {
    mockSingle.mockResolvedValue({
      data: { id: '1', name: 'Updated Finance', slug: 'finance' },
      error: null,
    })
    const result = await updateContent('industries', '1', {
      name: 'Updated Finance',
      slug: 'finance',
    })
    expect(result.data).toBeDefined()
  })
})
