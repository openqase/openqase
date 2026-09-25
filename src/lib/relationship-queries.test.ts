import { describe, it, expect, vi, beforeEach } from 'vitest'

// Table-keyed mock: each table returns a fixed dataset. `.in(col, values)`
// filters rows by that column so junction and entity lookups behave like
// PostgREST for the purposes of these tests. Select strings are recorded so
// we can assert the visibility columns are requested.
let tableData: Record<string, Record<string, unknown>[]> = {}
const selectCalls: Record<string, string[]> = {}

const mockFrom = vi.fn((table: string) => ({
  select: (fields: string) => {
    ;(selectCalls[table] ||= []).push(fields)
    return {
      in: async (col: string, values: unknown[]) => ({
        data: (tableData[table] || []).filter((r) => values.includes(r[col])),
        error: null,
      }),
    }
  },
}))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: async () => ({ from: mockFrom }),
}))

import {
  filterVisibleEntities,
  getRelatedQuantumSoftware,
  getRelatedPartnerCompanies,
  getCaseStudyRelationshipMap,
} from './relationship-queries'

const entity = (id: string, published: boolean | null, deleted_at: string | null = null) => ({
  id,
  name: `Name ${id}`,
  slug: `slug-${id}`,
  description: null,
  published,
  deleted_at,
})

beforeEach(() => {
  tableData = {}
  for (const k of Object.keys(selectCalls)) delete selectCalls[k]
  mockFrom.mockClear()
})

describe('filterVisibleEntities', () => {
  it('drops drafts and soft-deleted rows, keeps published=null and true, strips visibility fields', () => {
    const result = filterVisibleEntities([
      entity('draft', false),
      entity('deleted', true, '2026-01-01T00:00:00Z'),
      entity('legacy', null),
      entity('live', true),
    ])
    expect(result).toEqual([
      { id: 'legacy', name: 'Name legacy', slug: 'slug-legacy', description: null },
      { id: 'live', name: 'Name live', slug: 'slug-live', description: null },
    ])
  })

  it('handles null/undefined input', () => {
    expect(filterVisibleEntities(null)).toEqual([])
    expect(filterVisibleEntities(undefined)).toEqual([])
  })
})

describe('getRelatedEntities (via getRelated* helpers)', () => {
  beforeEach(() => {
    tableData.case_study_quantum_software_relations = [
      { case_study_id: 'cs1', quantum_software_id: 'draft' },
      { case_study_id: 'cs1', quantum_software_id: 'deleted' },
      { case_study_id: 'cs1', quantum_software_id: 'legacy' },
      { case_study_id: 'cs2', quantum_software_id: 'live' },
    ]
    tableData.quantum_software = [
      entity('draft', false),
      entity('deleted', true, '2026-01-01T00:00:00Z'),
      entity('legacy', null),
      entity('live', true),
    ]
  })

  it('excludes draft and soft-deleted related entities', async () => {
    const result = await getRelatedQuantumSoftware(['cs1', 'cs2'])
    expect(result.map((e) => e.id).sort()).toEqual(['legacy', 'live'])
  })

  it('requests visibility columns and preserves the return shape', async () => {
    const result = await getRelatedQuantumSoftware(['cs1', 'cs2'])
    expect(selectCalls.quantum_software[0]).toContain('published')
    expect(selectCalls.quantum_software[0]).toContain('deleted_at')
    for (const e of result) {
      expect(Object.keys(e).sort()).toEqual(['description', 'id', 'name', 'slug'])
    }
  })

  it('keeps extra type-specific fields (partner company industry)', async () => {
    tableData.case_study_partner_company_relations = [
      { case_study_id: 'cs1', partner_company_id: 'p1' },
      { case_study_id: 'cs1', partner_company_id: 'p2' },
    ]
    tableData.partner_companies = [
      { ...entity('p1', true), industry: 'Finance' },
      { ...entity('p2', false), industry: 'Pharma' },
    ]
    const result = await getRelatedPartnerCompanies(['cs1'])
    expect(result).toEqual([
      { id: 'p1', name: 'Name p1', slug: 'slug-p1', description: null, industry: 'Finance' },
    ])
  })

  it('returns [] for empty input without querying', async () => {
    expect(await getRelatedQuantumSoftware([])).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('getCaseStudyRelationshipMap', () => {
  beforeEach(() => {
    tableData.case_study_industry_relations = [
      { case_study_id: 'cs1', industry_id: 'i-draft' },
      { case_study_id: 'cs1', industry_id: 'i-live' },
      { case_study_id: 'cs2', industry_id: 'i-legacy' },
    ]
    tableData.algorithm_case_study_relations = [
      { case_study_id: 'cs1', algorithm_id: 'a-deleted' },
      { case_study_id: 'cs2', algorithm_id: 'a-live' },
    ]
    tableData.case_study_persona_relations = [
      { case_study_id: 'cs1', persona_id: 'p-draft' },
      { case_study_id: 'cs1', persona_id: 'p-legacy' },
    ]
    tableData.industries = [entity('i-draft', false), entity('i-live', true), entity('i-legacy', null)]
    tableData.algorithms = [entity('a-deleted', true, '2026-01-01T00:00:00Z'), entity('a-live', true)]
    tableData.personas = [entity('p-draft', false), entity('p-legacy', null)]
  })

  it('excludes draft and soft-deleted chips, keeps published=null and true', async () => {
    const map = await getCaseStudyRelationshipMap(['cs1', 'cs2'])
    const ids = (xs: { id: string }[]) => xs.map((x) => x.id)

    expect(ids(map.cs1.industries)).toEqual(['i-live'])
    expect(ids(map.cs1.algorithms)).toEqual([])
    expect(ids(map.cs1.personas)).toEqual(['p-legacy'])
    expect(ids(map.cs2.industries)).toEqual(['i-legacy'])
    expect(ids(map.cs2.algorithms)).toEqual(['a-live'])
    expect(ids(map.cs2.personas)).toEqual([])
  })

  it('returns entities without visibility fields', async () => {
    const map = await getCaseStudyRelationshipMap(['cs1'])
    expect(map.cs1.industries[0]).toEqual({ id: 'i-live', name: 'Name i-live', slug: 'slug-i-live', description: null })
    for (const t of ['industries', 'algorithms', 'personas']) {
      expect(selectCalls[t][0]).toContain('deleted_at')
    }
  })
})
