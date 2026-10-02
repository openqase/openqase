import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

const mockSingle = vi.fn()
const mockSlugMaybeSingle = vi.fn()
const mockSlugSelect = vi.fn(() => ({ eq: () => ({ maybeSingle: mockSlugMaybeSingle }) }))
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockEqAfterUpdate = vi.fn(() => ({ select: mockSelect }))
const mockUpdate = vi.fn(() => ({ eq: mockEqAfterUpdate }))
const mockDeleteEq = vi.fn()
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
// Junction-table mocks (tables ending in _relations) used by saveRelationships
const mockJunctionSelectEq = vi.fn()
const mockJunctionDeleteIn = vi.fn()
const mockJunctionInsert = vi.fn()
const mockFrom = vi.fn((table: string) =>
  table.endsWith('_relations')
    ? {
        select: () => ({ eq: mockJunctionSelectEq }),
        delete: () => ({ eq: () => ({ in: mockJunctionDeleteIn }) }),
        insert: mockJunctionInsert,
      }
    : {
        select: mockSlugSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      }
)

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

const { createContent } = await import('./create')
const { updateContent } = await import('./update')

beforeEach(() => {
  vi.clearAllMocks()
  mockSlugMaybeSingle.mockResolvedValue({ data: null, error: null })
  mockJunctionSelectEq.mockResolvedValue({ data: [], error: null })
  mockJunctionDeleteIn.mockResolvedValue({ error: null })
  mockJunctionInsert.mockResolvedValue({ error: null })
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

describe('relationship saving', () => {
  const personaRow = { id: 'p1', name: 'Dev', slug: 'dev' }

  it('clears links when an empty array is passed on update', async () => {
    mockSingle.mockResolvedValue({ data: personaRow, error: null })
    mockJunctionSelectEq.mockResolvedValue({ data: [{ industry_id: 'ind-1' }], error: null })
    const result = await updateContent('personas', 'p1', { name: 'Dev', slug: 'dev' }, { industries: [] })
    expect(result.error).toBeUndefined()
    expect(mockFrom).toHaveBeenCalledWith('persona_industry_relations')
    expect(mockJunctionDeleteIn).toHaveBeenCalledWith('industry_id', ['ind-1'])
  })

  it('reports junction insert errors from updateContent as a warning, not an error', async () => {
    mockSingle.mockResolvedValue({ data: personaRow, error: null })
    mockJunctionInsert.mockResolvedValue({ error: { message: 'insert failed' } })
    const result = await updateContent('personas', 'p1', { name: 'Dev', slug: 'dev' }, { industries: ['ind-9'] })
    expect(result.error).toBeUndefined()
    expect(result.warning).toContain('insert failed')
    expect(result.data?.id).toBe('p1')
  })

  it('reports junction errors from createContent as a warning and still returns the new row', async () => {
    mockSingle.mockResolvedValue({ data: personaRow, error: null })
    mockJunctionSelectEq.mockResolvedValue({ data: null, error: { message: 'read failed' } })
    const result = await createContent('personas', { name: 'Dev', slug: 'dev' }, { industries: ['ind-1'] })
    expect(result.error).toBeUndefined()
    expect(result.warning).toContain('read failed')
    expect(result.data?.id).toBe('p1')
  })

  it('returns error and no data when the row insert itself fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'duplicate key' } })
    const result = await createContent('personas', { name: 'Dev', slug: 'dev' })
    expect(result.error).toContain('duplicate key')
    expect(result.data).toBeUndefined()
    expect(result.warning).toBeUndefined()
  })

  it('revalidates both the old and the new slug page when the slug changes', async () => {
    mockSlugMaybeSingle.mockResolvedValue({ data: { slug: 'old-slug' }, error: null })
    mockSingle.mockResolvedValue({ data: { id: '1', name: 'Finance', slug: 'new-slug' }, error: null })
    await updateContent('industries', '1', { name: 'Finance', slug: 'new-slug' })
    expect(revalidatePath).toHaveBeenCalledWith('/paths/industry/old-slug')
    expect(revalidatePath).toHaveBeenCalledWith('/paths/industry/new-slug')
  })
})
