import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...args: unknown[]) => captureException(...args) }))

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

const { generateStaticParamsFor, generateMetadataFor, reportContentQueryError } = await import('./page-helpers')

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
    mockIs.mockReturnValueOnce({ data: mockData })

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
    mockIs.mockReturnValueOnce({ data: [] })

    const fn = generateStaticParamsFor('industries')
    await fn()
    expect(mockEq).toHaveBeenCalledWith('published', true)
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })

  it('returns [] on a query error outside production', async () => {
    delete process.env.VERCEL_ENV
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockIs.mockReturnValueOnce({ data: null, error: { message: 'db down' } })
    const params = await generateStaticParamsFor('industries')()
    expect(params).toEqual([])
  })

  it('throws on a query error in Vercel production', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockIs.mockReturnValueOnce({ data: null, error: { message: 'db down' } })
    await expect(generateStaticParamsFor('industries')()).rejects.toThrow(/industries/)
    delete process.env.VERCEL_ENV
  })
})

describe('reportContentQueryError', () => {
  const ORIGINAL = process.env.VERCEL_ENV
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = ORIGINAL
    vi.restoreAllMocks()
  })

  it('does nothing when there is no error', () => {
    expect(() => reportContentQueryError('x', null)).not.toThrow()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('logs and reports but does not throw outside production', () => {
    delete process.env.VERCEL_ENV
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => reportContentQueryError('industries slugs', { message: 'boom' })).not.toThrow()
    expect(log).toHaveBeenCalled()
    expect(captureException).toHaveBeenCalledTimes(1)
  })

  it('throws in Vercel production so a build or ISR regeneration fails instead of shipping empty', () => {
    process.env.VERCEL_ENV = 'production'
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => reportContentQueryError('industries slugs', { message: 'boom' })).toThrow(/industries slugs: boom/)
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
