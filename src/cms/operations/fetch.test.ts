import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock React cache to be a pass-through
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: (fn: Function) => fn }
})

// Mock Supabase client
const mockSingle = vi.fn()
const mockRange = vi.fn(() => ({ data: [], count: 0, error: null }))
const mockOrder = vi.fn(() => ({ range: mockRange }))
const mockIlike = vi.fn()
// mockEq is used for both single-item queries (returns { single, eq }) and list queries (returns chainable object with order)
const mockEq = vi.fn()
mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, order: mockOrder, ilike: mockIlike })
mockIlike.mockReturnValue({ order: mockOrder, eq: mockEq })
const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder, ilike: mockIlike }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

// Must import after mocks
const { fetchContentBySlug, listContent } = await import('./fetch')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchContentBySlug', () => {
  it('returns flattened item when found', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: '1', name: 'Finance', slug: 'finance',
        case_study_industry_relations: [
          { case_studies: { id: 'cs-1', title: 'Study 1', slug: 'study-1' } },
        ],
      },
      error: null,
    })
    const result = await fetchContentBySlug('industries', 'finance')
    expect(result).toBeDefined()
    expect(result!.case_studies).toEqual([{ id: 'cs-1', title: 'Study 1', slug: 'study-1' }])
  })

  it('returns null when not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    const result = await fetchContentBySlug('industries', 'nonexistent')
    expect(result).toBeNull()
  })

  it('returns null for unknown content type', async () => {
    const result = await fetchContentBySlug('nonexistent', 'slug')
    expect(result).toBeNull()
  })

  it('removes junction table keys from the returned object', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: '1', name: 'Finance', slug: 'finance',
        case_study_industry_relations: [],
        algorithm_industry_relations: [],
        persona_industry_relations: [],
      },
      error: null,
    })
    const result = await fetchContentBySlug('industries', 'finance')
    expect(result).toBeDefined()
    expect(result!.case_study_industry_relations).toBeUndefined()
    expect(result!.algorithm_industry_relations).toBeUndefined()
    expect(result!.persona_industry_relations).toBeUndefined()
  })
})

describe('listContent', () => {
  it('queries with published filter by default', async () => {
    await listContent('industries')
    expect(mockSelect).toHaveBeenCalled()
  })

  it('returns empty result for unknown content type', async () => {
    const result = await listContent('nonexistent')
    expect(result).toEqual({ items: [], total: 0 })
  })

  it('applies published filter when publishedOnly is true', async () => {
    await listContent('industries', { publishedOnly: true })
    expect(mockEq).toHaveBeenCalledWith('published', true)
  })

  it('skips published filter when publishedOnly is false', async () => {
    await listContent('industries', { publishedOnly: false })
    // eq should not be called with 'published'
    const publishedCall = mockEq.mock.calls.find(([field]) => field === 'published')
    expect(publishedCall).toBeUndefined()
  })
})
