import { describe, it, expect, vi, beforeEach } from 'vitest'

import { readFileSync } from 'node:fs'
import { glob } from 'glob'

// saveRelationships applies every junction diff in one RPC call
// (save_content_with_relationships). mockFrom must never be used.
const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))

import {
  buildRelationshipPayload,
  buildRelationshipSelect,
  flattenRelationships,
  saveRelationships,
  SAVE_CONTENT_RPC,
} from './relationships'
import { defineContentType } from '../define'
import { getAllContentTypes } from '../registry'

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

describe('buildRelationshipPayload', () => {
  it('returns [] when no relationships map is given', () => {
    expect(buildRelationshipPayload(testType, undefined)).toEqual([])
  })

  it('skips undefined keys, keeps empty arrays, drops falsy ids', () => {
    expect(buildRelationshipPayload(testType, { industries: [], case_studies: ['cs', ''] })).toEqual([
      { name: 'industries', junction: 'test_industry_relations', foreign_key: 'test_id', target_key: 'industry_id', target_ids: [], extra_fields: {} },
      { name: 'case_studies', junction: 'test_case_study_relations', foreign_key: 'test_id', target_key: 'case_study_id', target_ids: ['cs'], extra_fields: {} },
    ])
    expect(buildRelationshipPayload(testType, { industries: ['a'] }).map(r => r.name)).toEqual(['industries'])
  })
})

describe('saveRelationships', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: { id: 'c1' }, error: null })
  })

  it('leaves relationships untouched when the key is undefined', async () => {
    const result = await saveRelationships(testType, 'c1', {})
    expect(result.error).toBeUndefined()
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('applies all relationships in a single RPC call without touching the row', async () => {
    const result = await saveRelationships(testType, 'c1', { industries: [], case_studies: ['cs'] })
    expect(result.error).toBeUndefined()
    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith(SAVE_CONTENT_RPC, {
      p_table: 'test',
      p_id: 'c1',
      p_relationships: [
        { name: 'industries', junction: 'test_industry_relations', foreign_key: 'test_id', target_key: 'industry_id', target_ids: [], extra_fields: {} },
        { name: 'case_studies', junction: 'test_case_study_relations', foreign_key: 'test_id', target_key: 'case_study_id', target_ids: ['cs'], extra_fields: {} },
      ],
    })
    // no p_data: the function only syncs links
    expect(mockRpc.mock.calls[0][1]).not.toHaveProperty('p_data')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns the database error (nothing was changed) when the RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'industries: could not save links, nothing was saved (fk violation)' },
    })
    const result = await saveRelationships(testType, 'c1', { industries: ['x'] })
    expect(result.error).toContain('industries')
    expect(result.error).toContain('fk violation')
    expect(result.error).not.toMatch(/^Saved/)
  })
})

// The SQL function only accepts (table, junction, foreign key, target key)
// tuples on its hard-coded allow-list. Keep it identical to the registry so a
// new relationship in src/cms/types/*.ts can't silently fail at save time,
// and the SQL can't allow more than the app declares.
describe('save_content_with_relationships allow-list matches the content types', () => {
  function latestFunctionSql(): string {
    const files = glob.sync('supabase/migrations/*.sql').sort()
    const defining = files.filter(f =>
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+"?public"?\."?save_content_with_relationships"?/i.test(readFileSync(f, 'utf8'))
    )
    expect(defining.length, 'no migration defines save_content_with_relationships').toBeGreaterThan(0)
    return readFileSync(defining[defining.length - 1], 'utf8')
  }

  const sql = latestFunctionSql()

  it('lists exactly the relationships declared in src/cms/types', () => {
    const tupleRe = /\('(\w+)',\s*'(\w+)',\s*'(\w+)',\s*'(\w+)',\s*ARRAY\[([^\]]*)\]::text\[\]\)/g
    const fromSql = [...sql.matchAll(tupleRe)]
      .map(m => {
        const extra = m[5].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean).sort().join('+')
        return `${m[1]}|${m[2]}|${m[3]}|${m[4]}|${extra}`
      })
      .sort()

    const fromRegistry = getAllContentTypes()
      .flatMap(ct =>
        ct.relationships.map(rel => {
          const extra = Object.keys(rel.extraJunctionFields ?? {}).sort().join('+')
          return `${ct.tableName}|${rel.junction}|${rel.foreignKey}|${rel.targetKey}|${extra}`
        })
      )
      .sort()

    expect(fromRegistry.length).toBeGreaterThan(0)
    expect(fromSql).toEqual(fromRegistry)
  })

  it('allows exactly the registry content tables', () => {
    const m = sql.match(/allowed_tables\s+CONSTANT\s+text\[\]\s*:=\s*ARRAY\[([^\]]*)\]/i)
    expect(m).not.toBeNull()
    const fromSql = m![1].split(',').map(s => s.trim().replace(/'/g, '')).sort()
    expect(fromSql).toEqual(getAllContentTypes().map(ct => ct.tableName).sort())
  })

  it('is service-role only and SECURITY INVOKER with an empty search_path', () => {
    expect(sql).toMatch(/SECURITY INVOKER/)
    expect(sql).not.toMatch(/SECURITY DEFINER/)
    expect(sql).toMatch(/SET "search_path" TO ''/)
    for (const role of ['PUBLIC', '"anon"', '"authenticated"']) {
      expect(sql).toMatch(new RegExp(`REVOKE ALL ON FUNCTION "public"\\."save_content_with_relationships"\\([^)]*\\) FROM ${role};`))
    }
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION "public"\."save_content_with_relationships"\([^)]*\) TO "service_role";/)
  })
})
