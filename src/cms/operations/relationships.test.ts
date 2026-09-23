import { describe, it, expect, vi, beforeEach } from 'vitest'

// Junction-table mock for saveRelationships. Each builder method is a spy so
// tests can assert which deletes/inserts happened and inject errors.
const mockSelectEq = vi.fn()
const mockDeleteIn = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn((_table: string) => ({
  select: () => ({ eq: mockSelectEq }),
  delete: () => ({ eq: () => ({ in: mockDeleteIn }) }),
  insert: mockInsert,
}))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

import { buildRelationshipSelect, flattenRelationships, saveRelationships } from './relationships'
import { defineContentType } from '../define'

const testType = defineContentType({
  slug: 'test',
  tableName: 'test',
  label: { singular: 'Test', plural: 'Tests' },
  basePath: '/test',
  adminPath: '/admin/test',
  fields: [{ name: 'name', type: 'text', required: true }],
  relationships: [
    { name: 'industries', targetType: 'industries', junction: 'test_industry_relations', foreignKey: 'test_id', targetKey: 'industry_id' },
    { name: 'case_studies', targetType: 'case-studies', junction: 'test_case_study_relations', foreignKey: 'test_id', targetKey: 'case_study_id' },
  ],
  metadata: { titleField: 'name', descriptionField: 'name' },
})

describe('buildRelationshipSelect', () => {
  it('builds a Supabase select string with nested joins', () => {
    const select = buildRelationshipSelect(testType)
    expect(select).toContain('test_industry_relations(industries(id, name, slug, published, deleted_at))')
    expect(select).toContain('test_case_study_relations(case_studies(id, title, slug, published, deleted_at))')
    expect(select.startsWith('*,')).toBe(true)
  })

  it('uses custom selectFields when specified', () => {
    const customType = defineContentType({
      slug: 'custom',
      tableName: 'custom',
      label: { singular: 'Custom', plural: 'Customs' },
      basePath: '/custom',
      adminPath: '/admin/custom',
      fields: [{ name: 'name', type: 'text', required: true }],
      relationships: [
        {
          name: 'algorithms',
          targetType: 'algorithms',
          junction: 'custom_algorithm_relations',
          foreignKey: 'custom_id',
          targetKey: 'algorithm_id',
          selectFields: ['id', 'name', 'slug', 'quantum_advantage', 'use_cases'],
        },
      ],
      metadata: { titleField: 'name', descriptionField: 'name' },
    })
    const select = buildRelationshipSelect(customType)
    expect(select).toContain('custom_algorithm_relations(algorithms(id, name, slug, quantum_advantage, use_cases, published, deleted_at))')
  })

  it('handles self-referential relationships with FK hints', () => {
    const blogType = defineContentType({
      slug: 'blog-posts',
      tableName: 'blog_posts',
      label: { singular: 'Blog Post', plural: 'Blog Posts' },
      basePath: '/blog',
      adminPath: '/admin/blog-posts',
      fields: [{ name: 'title', type: 'text', required: true }],
      relationships: [
        {
          name: 'related_posts',
          targetType: 'blog-posts',
          junction: 'blog_post_relations',
          foreignKey: 'blog_post_id',
          targetKey: 'related_blog_post_id',
          junctionForeignKeyHint: 'blog_post_relations_blog_post_id_fkey',
          targetForeignKeyHint: 'blog_post_relations_related_blog_post_id_fkey',
          selectFields: ['id', 'title', 'slug', 'published_at', 'author', 'category'],
        },
      ],
      metadata: { titleField: 'title', descriptionField: 'title' },
    })
    const select = buildRelationshipSelect(blogType)
    expect(select).toContain('blog_post_relations!blog_post_relations_blog_post_id_fkey')
    expect(select).toContain('blog_posts!blog_post_relations_related_blog_post_id_fkey')
  })

  it('returns just * for types with no relationships', () => {
    const noRels = defineContentType({
      slug: 'simple',
      tableName: 'simple',
      label: { singular: 'Simple', plural: 'Simples' },
      basePath: '/simple',
      adminPath: '/admin/simple',
      fields: [{ name: 'name', type: 'text', required: true }],
      relationships: [],
      metadata: { titleField: 'name', descriptionField: 'name' },
    })
    expect(buildRelationshipSelect(noRels)).toBe('*')
  })
})

describe('flattenRelationships', () => {
  it('extracts related entities from nested Supabase join shape', () => {
    const raw = {
      id: '1',
      name: 'Test',
      test_industry_relations: [
        { industries: { id: 'ind-1', name: 'Finance', slug: 'finance' } },
        { industries: { id: 'ind-2', name: 'Healthcare', slug: 'healthcare' } },
      ],
      test_case_study_relations: [
        { case_studies: { id: 'cs-1', title: 'Study 1', slug: 'study-1' } },
      ],
    }

    const result = flattenRelationships(raw, testType)
    expect(result.industries).toEqual([
      { id: 'ind-1', name: 'Finance', slug: 'finance' },
      { id: 'ind-2', name: 'Healthcare', slug: 'healthcare' },
    ])
    expect(result.case_studies).toEqual([
      { id: 'cs-1', title: 'Study 1', slug: 'study-1' },
    ])
  })

  it('returns empty arrays when junction data is missing', () => {
    const raw = { id: '1', name: 'Test' }
    const result = flattenRelationships(raw, testType)
    expect(result.industries).toEqual([])
    expect(result.case_studies).toEqual([])
  })
})

describe('buildRelationshipSelect visibility fields', () => {
  it('does not duplicate published when selectFields already include it', () => {
    const t = defineContentType({
      slug: 'dup',
      tableName: 'dup',
      label: { singular: 'Dup', plural: 'Dups' },
      basePath: '/dup',
      adminPath: '/admin/dup',
      fields: [{ name: 'name', type: 'text', required: true }],
      relationships: [
        {
          name: 'case_studies',
          targetType: 'case-studies',
          junction: 'dup_case_study_relations',
          foreignKey: 'dup_id',
          targetKey: 'case_study_id',
          selectFields: ['id', 'title', 'slug', 'published'],
        },
      ],
      metadata: { titleField: 'name', descriptionField: 'name' },
    })
    expect(buildRelationshipSelect(t)).toContain(
      'dup_case_study_relations(case_studies(id, title, slug, published, deleted_at))'
    )
  })
})

describe('flattenRelationships draft filtering', () => {
  const raw = {
    id: '1',
    name: 'Test',
    test_industry_relations: [
      { industries: { id: 'pub', name: 'Pub', slug: 'pub', published: true, deleted_at: null } },
      { industries: { id: 'draft', name: 'Draft', slug: 'draft', published: false, deleted_at: null } },
      { industries: { id: 'deleted', name: 'Del', slug: 'del', published: true, deleted_at: '2026-01-01T00:00:00Z' } },
      { industries: { id: 'legacy', name: 'Legacy', slug: 'legacy', published: null, deleted_at: null } },
    ],
  }

  it('keeps drafts and soft-deleted rows when not filtering (preview)', () => {
    const result = flattenRelationships(raw, testType)
    expect(result.industries.map(r => r.id)).toEqual(['pub', 'draft', 'deleted', 'legacy'])
  })

  it('drops explicit drafts and soft-deleted rows when publishedOnly', () => {
    const result = flattenRelationships(raw, testType, { publishedOnly: true })
    // published: null is kept (nullable legacy column) — only explicit false is dropped
    expect(result.industries.map(r => r.id)).toEqual(['pub', 'legacy'])
  })
})

describe('saveRelationships', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectEq.mockResolvedValue({ data: [], error: null })
    mockDeleteIn.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ error: null })
  })

  it('leaves relationships untouched when the key is undefined', async () => {
    const result = await saveRelationships(testType, 'c1', {})
    expect(result.error).toBeUndefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('clears all links when given an empty array', async () => {
    mockSelectEq.mockResolvedValue({
      data: [{ industry_id: 'ind-1' }, { industry_id: 'ind-2' }],
      error: null,
    })
    const result = await saveRelationships(testType, 'c1', { industries: [] })
    expect(result.error).toBeUndefined()
    expect(mockDeleteIn).toHaveBeenCalledWith('industry_id', ['ind-1', 'ind-2'])
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('only deletes removed ids and inserts added ids', async () => {
    mockSelectEq.mockResolvedValue({
      data: [{ industry_id: 'keep' }, { industry_id: 'remove' }],
      error: null,
    })
    const result = await saveRelationships(testType, 'c1', { industries: ['keep', 'add'] })
    expect(result.error).toBeUndefined()
    expect(mockDeleteIn).toHaveBeenCalledWith('industry_id', ['remove'])
    expect(mockInsert).toHaveBeenCalledWith([{ test_id: 'c1', industry_id: 'add' }])
  })

  it('does nothing when links are unchanged', async () => {
    mockSelectEq.mockResolvedValue({ data: [{ industry_id: 'a' }], error: null })
    await saveRelationships(testType, 'c1', { industries: ['a'] })
    expect(mockDeleteIn).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns an error when the insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'fk violation' } })
    const result = await saveRelationships(testType, 'c1', { industries: ['x'] })
    expect(result.error).toContain('industries')
    expect(result.error).toContain('fk violation')
  })

  it('reports clearly when delete succeeded but insert failed', async () => {
    mockSelectEq.mockResolvedValue({ data: [{ industry_id: 'old' }], error: null })
    mockInsert.mockResolvedValue({ error: { message: 'boom' } })
    const result = await saveRelationships(testType, 'c1', { industries: ['new'] })
    expect(result.error).toMatch(/removed links were deleted but adding new links failed/)
  })

  it('returns an error and skips insert when the delete fails', async () => {
    mockSelectEq.mockResolvedValue({ data: [{ industry_id: 'old' }], error: null })
    mockDeleteIn.mockResolvedValue({ error: { message: 'delete denied' } })
    const result = await saveRelationships(testType, 'c1', { industries: ['new'] })
    expect(result.error).toContain('delete denied')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('still processes other relationships after one fails', async () => {
    mockSelectEq
      .mockResolvedValueOnce({ data: null, error: { message: 'read failed' } })
      .mockResolvedValueOnce({ data: [], error: null })
    const result = await saveRelationships(testType, 'c1', { industries: ['a'], case_studies: ['cs'] })
    expect(result.error).toContain('read failed')
    expect(mockInsert).toHaveBeenCalledWith([{ test_id: 'c1', case_study_id: 'cs' }])
  })
})
