import { describe, it, expect, vi } from 'vitest'
import { buildRelationshipSelect, flattenRelationships } from './relationships'
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
    expect(select).toContain('test_industry_relations(industries(id, name, slug))')
    expect(select).toContain('test_case_study_relations(case_studies(id, title, slug))')
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
    expect(select).toContain('custom_algorithm_relations(algorithms(id, name, slug, quantum_advantage, use_cases))')
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
