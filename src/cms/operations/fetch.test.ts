import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock React cache to be a pass-through
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn }
})

// Mock next/headers draftMode — return isEnabled: false so tests exercise
// the non-preview (published-filter) path by default.
vi.mock('next/headers', () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
  cookies: vi.fn().mockResolvedValue({}),
}))

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...args: unknown[]) => captureException(...args) }))

// Mock Supabase client
const mockMaybeSingle = vi.fn()
const mockSingle = vi.fn()
type RangeResult = { data: unknown[] | null; count: number | null; error: { message: string } | null }
const mockRange = vi.fn((): RangeResult => ({ data: [], count: 0, error: null }))
const mockOrder = vi.fn(() => ({ range: mockRange }))
const mockIlike = vi.fn()
const mockIs = vi.fn()
// mockEq chains through eq, is, maybeSingle, single, order, ilike
const mockEq = vi.fn()
mockEq.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs, order: mockOrder, ilike: mockIlike })
mockIs.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs, order: mockOrder, ilike: mockIlike })
mockIlike.mockReturnValue({ order: mockOrder, eq: mockEq })
const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder, ilike: mockIlike, is: mockIs }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
  createServerSupabaseClient: async () => ({ from: mockFrom }),
}))

// Must import after mocks
const { fetchContentBySlug, fetchPreviewContentBySlug, listContent } = await import('./fetch')
const { draftMode } = await import('next/headers')

beforeEach(() => {
  vi.clearAllMocks()
  // Re-establish default chain after clearAllMocks
  mockEq.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs, order: mockOrder, ilike: mockIlike })
  mockIs.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs, order: mockOrder, ilike: mockIlike })
  mockIlike.mockReturnValue({ order: mockOrder, eq: mockEq })
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, ilike: mockIlike, is: mockIs })
  mockFrom.mockReturnValue({ select: mockSelect })
})

describe('fetchContentBySlug', () => {
  it('returns flattened item when found', async () => {
    mockMaybeSingle.mockResolvedValue({
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
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await fetchContentBySlug('industries', 'nonexistent')
    expect(result).toBeNull()
  })

  it('returns null for unknown content type', async () => {
    const result = await fetchContentBySlug('nonexistent', 'slug')
    expect(result).toBeNull()
  })

  it('removes junction table keys from the returned object', async () => {
    mockMaybeSingle.mockResolvedValue({
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

  it('always excludes soft-deleted rows (deleted_at IS NULL)', async () => {
    await listContent('industries')
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })

  it('excludes soft-deleted rows even when publishedOnly is false', async () => {
    await listContent('industries', { publishedOnly: false })
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })
})

// Query errors follow the same policy as the build/list fetchers (#256, #260):
// a real error goes through reportContentQueryError (Sentry outside Vercel
// production, thrown in production) instead of being treated as "not found",
// so ISR never caches a 404 or an empty list because of a transient failure.
// No row is not an error: these queries use .maybeSingle(), which resolves
// { data: null, error: null } when nothing matches.
describe('query error handling', () => {
  const ORIGINAL_ENV = process.env.VERCEL_ENV
  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = ORIGINAL_ENV
    vi.restoreAllMocks()
  })

  const dbDown = { data: null, error: { message: 'db down', code: '57014' } }

  describe('fetchContentBySlug', () => {
    it('reports the error and returns null outside production', async () => {
      delete process.env.VERCEL_ENV
      vi.spyOn(console, 'error').mockImplementation(() => {})
      mockMaybeSingle.mockResolvedValueOnce(dbDown)
      await expect(fetchContentBySlug('industries', 'finance')).resolves.toBeNull()
      expect(captureException).toHaveBeenCalledTimes(1)
      expect(captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/industries.*finance.*db down/) })
      )
    })

    it('throws in Vercel production instead of rendering a 404', async () => {
      process.env.VERCEL_ENV = 'production'
      vi.spyOn(console, 'error').mockImplementation(() => {})
      mockMaybeSingle.mockResolvedValueOnce(dbDown)
      await expect(fetchContentBySlug('industries', 'finance')).rejects.toThrow(/industries.*finance.*db down/)
    })

    it('still returns null for a missing row in production, without reporting', async () => {
      process.env.VERCEL_ENV = 'production'
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
      await expect(fetchContentBySlug('industries', 'missing')).resolves.toBeNull()
      expect(captureException).not.toHaveBeenCalled()
    })
  })

  describe('fetchPreviewContentBySlug (preview active)', () => {
    beforeEach(() => {
      vi.mocked(draftMode).mockResolvedValueOnce({ isEnabled: true } as Awaited<ReturnType<typeof draftMode>>)
    })

    it('reports the error and returns null outside production', async () => {
      delete process.env.VERCEL_ENV
      vi.spyOn(console, 'error').mockImplementation(() => {})
      mockMaybeSingle.mockResolvedValueOnce(dbDown)
      await expect(fetchPreviewContentBySlug('industries', 'finance')).resolves.toBeNull()
      expect(captureException).toHaveBeenCalledTimes(1)
      expect(captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/industries.*preview.*finance.*db down/) })
      )
    })

    it('throws in Vercel production', async () => {
      process.env.VERCEL_ENV = 'production'
      vi.spyOn(console, 'error').mockImplementation(() => {})
      mockMaybeSingle.mockResolvedValueOnce(dbDown)
      await expect(fetchPreviewContentBySlug('industries', 'finance')).rejects.toThrow(/industries.*finance.*db down/)
    })

    it('still returns null for a missing row in production, without reporting', async () => {
      process.env.VERCEL_ENV = 'production'
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
      await expect(fetchPreviewContentBySlug('industries', 'missing')).resolves.toBeNull()
      expect(captureException).not.toHaveBeenCalled()
    })

    it('does not filter on published (drafts are visible in preview)', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
      await fetchPreviewContentBySlug('industries', 'draft')
      expect(mockEq.mock.calls.find(([field]) => field === 'published')).toBeUndefined()
    })
  })

  describe('listContent', () => {
    it('reports the error and returns an empty list outside production', async () => {
      delete process.env.VERCEL_ENV
      vi.spyOn(console, 'error').mockImplementation(() => {})
      mockRange.mockReturnValueOnce({ data: null, count: null, error: { message: 'db down' } })
      await expect(listContent('industries')).resolves.toEqual({ items: [], total: 0 })
      expect(captureException).toHaveBeenCalledTimes(1)
      expect(captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/industries.*db down/) })
      )
    })

    it('throws in Vercel production instead of returning an empty list', async () => {
      process.env.VERCEL_ENV = 'production'
      vi.spyOn(console, 'error').mockImplementation(() => {})
      mockRange.mockReturnValueOnce({ data: null, count: null, error: { message: 'db down' } })
      await expect(listContent('industries')).rejects.toThrow(/industries.*db down/)
    })

    it('returns an empty list without reporting when there are no rows', async () => {
      process.env.VERCEL_ENV = 'production'
      await expect(listContent('industries')).resolves.toEqual({ items: [], total: 0 })
      expect(captureException).not.toHaveBeenCalled()
    })
  })
})
