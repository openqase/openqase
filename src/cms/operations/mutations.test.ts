import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

// Row + links are written by one RPC (save_content_with_relationships); the
// only direct table access left is updateContent's pre-read of the old slug.
const mockRpc = vi.fn()
const mockSlugMaybeSingle = vi.fn()
const mockSlugSelect = vi.fn(() => ({ eq: () => ({ maybeSingle: mockSlugMaybeSingle }) }))
const mockFrom = vi.fn((_table: string) => ({ select: mockSlugSelect }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))

const { createContent } = await import('./create')
const { updateContent } = await import('./update')

beforeEach(() => {
  vi.clearAllMocks()
  mockSlugMaybeSingle.mockResolvedValue({ data: null, error: null })
})

describe('createContent', () => {
  it('rejects invalid data with validation errors', async () => {
    // 'name' is required for industries but not provided
    const result = await createContent('industries', { slug: 'test' })
    expect(result.error).toBeDefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('creates content and returns data on success', async () => {
    mockRpc.mockResolvedValue({
      data: { id: '1', name: 'Finance', slug: 'finance' },
      error: null,
    })
    const result = await createContent('industries', {
      name: 'Finance',
      slug: 'finance',
    })
    expect(result.data).toBeDefined()
    expect(result.data?.name).toBe('Finance')
    expect(mockRpc).toHaveBeenCalledWith('save_content_with_relationships', {
      p_table: 'industries',
      p_data: { name: 'Finance', slug: 'finance' },
      p_relationships: [],
    })
  })

  it('returns error for unknown content type', async () => {
    const result = await createContent('nonexistent', { name: 'x' })
    expect(result.error).toBeDefined()
  })
})

describe('updateContent', () => {
  it('updates existing content by ID', async () => {
    mockRpc.mockResolvedValue({
      data: { id: '1', name: 'Updated Finance', slug: 'finance' },
      error: null,
    })
    const result = await updateContent('industries', '1', {
      name: 'Updated Finance',
      slug: 'finance',
    })
    expect(result.data).toBeDefined()
    expect(mockRpc).toHaveBeenCalledWith('save_content_with_relationships', {
      p_table: 'industries',
      p_id: '1',
      p_data: { name: 'Updated Finance', slug: 'finance' },
      p_relationships: [],
    })
  })
})

describe('relationship saving (one transaction with the row)', () => {
  const personaRow = { id: 'p1', name: 'Dev', slug: 'dev' }

  it('sends the row and only the relationships the form provided in one RPC call', async () => {
    mockRpc.mockResolvedValue({ data: personaRow, error: null })
    const result = await updateContent(
      'personas',
      'p1',
      { name: 'Dev', slug: 'dev' },
      { industries: [], algorithms: ['alg-1', '', 'alg-2'] }
    )
    expect(result.error).toBeUndefined()
    expect(mockRpc).toHaveBeenCalledTimes(1)
    const [fn, args] = mockRpc.mock.calls[0]
    expect(fn).toBe('save_content_with_relationships')
    expect(args.p_relationships).toEqual([
      // empty array is passed through: it clears the links
      {
        name: 'industries',
        junction: 'persona_industry_relations',
        foreign_key: 'persona_id',
        target_key: 'industry_id',
        target_ids: [],
        extra_fields: {},
      },
      // falsy ids are dropped
      {
        name: 'algorithms',
        junction: 'persona_algorithm_relations',
        foreign_key: 'persona_id',
        target_key: 'algorithm_id',
        target_ids: ['alg-1', 'alg-2'],
        extra_fields: {},
      },
    ])
    // case_studies was not sent, so it is left untouched
    expect(args.p_relationships.map((r: { name: string }) => r.name)).not.toContain('case_studies')
  })

  it('passes extra junction fields for the self-referential blog relation', async () => {
    mockRpc.mockResolvedValue({ data: { id: 'b1', title: 'Post', slug: 'post' }, error: null })
    await createContent('blog-posts', { title: 'Post', slug: 'post' }, { related_posts: ['b2'] })
    expect(mockRpc.mock.calls[0][1].p_relationships).toEqual([
      {
        name: 'related_posts',
        junction: 'blog_post_relations',
        foreign_key: 'blog_post_id',
        target_key: 'related_blog_post_id',
        target_ids: ['b2'],
        extra_fields: { relation_type: 'related' },
      },
    ])
  })

  it('reports a failed link on update as an error with no data (row change rolled back)', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'industries: could not save links, nothing was saved (fk violation)' },
    })
    const result = await updateContent('personas', 'p1', { name: 'Dev', slug: 'dev' }, { industries: ['ind-9'] })
    expect(result.error).toContain('fk violation')
    expect(result.data).toBeUndefined()
    expect(result.warning).toBeUndefined()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('reports a failed link on create as an error with no data (row not created)', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'industries: could not save links, nothing was saved (fk violation)' },
    })
    const result = await createContent('personas', { name: 'Dev', slug: 'dev' }, { industries: ['ind-1'] })
    expect(result.error).toContain('nothing was saved')
    expect(result.data).toBeUndefined()
    expect(result.warning).toBeUndefined()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns error and no data when the row insert itself fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'duplicate key' } })
    const result = await createContent('personas', { name: 'Dev', slug: 'dev' })
    expect(result.error).toContain('duplicate key')
    expect(result.data).toBeUndefined()
    expect(result.warning).toBeUndefined()
  })

  it('revalidates both the old and the new slug page when the slug changes', async () => {
    mockSlugMaybeSingle.mockResolvedValue({ data: { slug: 'old-slug' }, error: null })
    mockRpc.mockResolvedValue({ data: { id: '1', name: 'Finance', slug: 'new-slug' }, error: null })
    await updateContent('industries', '1', { name: 'Finance', slug: 'new-slug' })
    expect(revalidatePath).toHaveBeenCalledWith('/paths/industry/old-slug')
    expect(revalidatePath).toHaveBeenCalledWith('/paths/industry/new-slug')
  })
})
