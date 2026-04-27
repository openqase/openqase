import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock React.cache as pass-through
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn }
})

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Mock next/headers draftMode — return isEnabled: false so tests exercise
// the non-preview (published-filter) path by default.
vi.mock('next/headers', () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
  cookies: vi.fn().mockResolvedValue({}),
}))

// Mock Supabase
const mockMaybeSingle = vi.fn()
const mockSingle = vi.fn()
const mockIs = vi.fn()
const mockEq = vi.fn()
mockEq.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs })
mockIs.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs })
const mockSelect = vi.fn(() => ({ eq: mockEq, is: mockIs }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
  createServerSupabaseClient: async () => ({ from: mockFrom }),
}))

const { generateStaticParamsFor, generateMetadataFor } = await import('./page-helpers')

beforeEach(() => {
  vi.clearAllMocks()
  // Reset default chain behaviour after clearAllMocks
  mockEq.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs })
  mockIs.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle, eq: mockEq, is: mockIs })
  mockSelect.mockReturnValue({ eq: mockEq, is: mockIs })
  mockFrom.mockReturnValue({ select: mockSelect })
})

describe('generateStaticParamsFor', () => {
  it('returns a function that produces slug params', async () => {
    const mockData = [{ slug: 'finance' }, { slug: 'healthcare' }]
    mockEq.mockReturnValueOnce({ data: mockData })

    const fn = generateStaticParamsFor('industries')
    const params = await fn()
    expect(params).toEqual([{ slug: 'finance' }, { slug: 'healthcare' }])
  })

  it('returns empty array for unknown type', async () => {
    const fn = generateStaticParamsFor('nonexistent')
    const params = await fn()
    expect(params).toEqual([])
  })

  it('queries only published items', async () => {
    mockEq.mockReturnValueOnce({ data: [] })

    const fn = generateStaticParamsFor('industries')
    await fn()
    expect(mockEq).toHaveBeenCalledWith('published', true)
  })
})

describe('generateMetadataFor', () => {
  it('returns metadata with title and description', async () => {
    // fetchContentBySlug calls: .from(tableName).select(selectStr).eq('slug', slug)
    //   .eq('published', true).is('deleted_at', null).maybeSingle()
    // The data must include junction keys so flattenRelationships can process them
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: '1',
        name: 'Finance',
        slug: 'finance',
        description: 'Financial services',
        algorithm_industry_relations: [],
        case_study_industry_relations: [],
        persona_industry_relations: [],
      },
      error: null,
    })

    const fn = generateMetadataFor('industries')
    const metadata = await fn({ params: Promise.resolve({ slug: 'finance' }) })

    expect(metadata.title).toBe('Finance | OpenQase')
    expect(metadata.description).toBe('Financial services')
    expect((metadata as Record<string, unknown>).openGraph).toEqual({
      title: 'Finance',
      description: 'Financial services',
    })
  })

  it('returns empty object for unknown content type', async () => {
    const fn = generateMetadataFor('nonexistent')
    const metadata = await fn({ params: Promise.resolve({ slug: 'anything' }) })
    expect(metadata).toEqual({})
  })

  it('returns empty object when item not found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const fn = generateMetadataFor('industries')
    const metadata = await fn({ params: Promise.resolve({ slug: 'missing' }) })
    expect(metadata).toEqual({})
  })

  it('returns empty string description when description field is falsy', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: '2',
        name: 'Tech',
        slug: 'tech',
        description: null,
        algorithm_industry_relations: [],
        case_study_industry_relations: [],
        persona_industry_relations: [],
      },
      error: null,
    })

    const fn = generateMetadataFor('industries')
    const metadata = await fn({ params: Promise.resolve({ slug: 'tech' }) })

    expect(metadata.title).toBe('Tech | OpenQase')
    expect(metadata.description).toBe('')
  })
})
