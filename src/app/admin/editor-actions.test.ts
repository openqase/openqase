// src/app/admin/editor-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Every admin editor's server actions share one result contract
 * (src/lib/admin-action-result.ts): failures are returned, not thrown, and a
 * relationship-save warning comes back alongside the saved row so the editor
 * can show it and keep the new id.
 */

const createContent = vi.fn()
const updateContent = vi.fn()
const publishContent = vi.fn()
const unpublishContent = vi.fn()
const revalidateContentType = vi.fn()
const revalidatePath = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/auth', () => ({
  withAdmin: <A extends unknown[], R>(fn: (...args: A) => Promise<R>) => fn,
}))
vi.mock('@/cms/operations', () => ({
  createContent: (...args: unknown[]) => createContent(...args),
  updateContent: (...args: unknown[]) => updateContent(...args),
  publishContent: (...args: unknown[]) => publishContent(...args),
  unpublishContent: (...args: unknown[]) => unpublishContent(...args),
  revalidateContentType: (...args: unknown[]) => revalidateContentType(...args),
}))
vi.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }))
vi.mock('@/lib/supabase-server', () => ({ createServiceRoleSupabaseClient: () => ({ from: mockFrom }) }))

import * as algorithms from './algorithms/[id]/actions'
import * as blog from './blog/[id]/actions'
import * as caseStudies from './case-studies/[id]/actions'
import * as industries from './industries/[id]/actions'
import * as partnerCompanies from './partner-companies/[id]/actions'
import * as personas from './personas/[id]/actions'
import * as quantumCompanies from './quantum-companies/[id]/actions'
import * as quantumHardware from './quantum-hardware/[id]/actions'
import * as quantumSoftware from './quantum-software/[id]/actions'

type Save = (values: never) => Promise<unknown>
type Publish = (id: string, slug: string) => Promise<unknown>

interface Editor {
  type: string
  save: Save
  publish: Publish
  unpublish: Publish
  values: Record<string, unknown>
}

const editors: Editor[] = [
  { type: 'algorithms', save: algorithms.saveAlgorithm, publish: algorithms.publishAlgorithm, unpublish: algorithms.unpublishAlgorithm, values: { name: 'A', slug: 'a', related_case_studies: ['cs-1'] } },
  { type: 'blog-posts', save: blog.saveBlogPost, publish: blog.publishBlogPost, unpublish: blog.unpublishBlogPost, values: { title: 'A', slug: 'a', related_posts: ['bp-1'] } },
  { type: 'case-studies', save: caseStudies.saveCaseStudy, publish: caseStudies.publishCaseStudy, unpublish: caseStudies.unpublishCaseStudy, values: { title: 'A', slug: 'a', industries: ['ind-1'] } },
  { type: 'industries', save: industries.saveIndustry, publish: industries.publishIndustry, unpublish: industries.unpublishIndustry, values: { name: 'A', slug: 'a' } },
  { type: 'partner-companies', save: partnerCompanies.savePartnerCompany, publish: partnerCompanies.publishPartnerCompany, unpublish: partnerCompanies.unpublishPartnerCompany, values: { name: 'A', slug: 'a', related_case_studies: ['cs-1'] } },
  { type: 'personas', save: personas.savePersona, publish: personas.publishPersona, unpublish: personas.unpublishPersona, values: { name: 'A', slug: 'a', industry: ['ind-1'] } },
  { type: 'quantum-companies', save: quantumCompanies.saveQuantumCompany, publish: quantumCompanies.publishQuantumCompany, unpublish: quantumCompanies.unpublishQuantumCompany, values: { name: 'A', slug: 'a', related_case_studies: ['cs-1'] } },
  { type: 'quantum-hardware', save: quantumHardware.saveQuantumHardware, publish: quantumHardware.publishQuantumHardware, unpublish: quantumHardware.unpublishQuantumHardware, values: { name: 'A', slug: 'a', related_case_studies: ['cs-1'] } },
  { type: 'quantum-software', save: quantumSoftware.saveQuantumSoftware, publish: quantumSoftware.publishQuantumSoftware, unpublish: quantumSoftware.unpublishQuantumSoftware, values: { name: 'A', slug: 'a', related_case_studies: ['cs-1'] } },
]

const ROW = { id: 'new-id', slug: 'a' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe.each(editors)('$type editor actions', ({ type, save, publish, unpublish, values }) => {
  const saveWith = (v: Record<string, unknown>) => save(v as never)

  it('create: returns the new row', async () => {
    createContent.mockResolvedValue({ data: ROW })
    await expect(saveWith(values)).resolves.toEqual({ success: true, data: ROW })
    expect(createContent).toHaveBeenCalledWith(type, expect.any(Object), ...(type === 'industries' ? [] : [expect.any(Object)]))
    expect(updateContent).not.toHaveBeenCalled()
  })

  it('create: keeps the new row (and its id) when relationship links fail', async () => {
    createContent.mockResolvedValue({ data: ROW, warning: 'Failed to link industries' })
    await expect(saveWith(values)).resolves.toEqual({
      success: true,
      data: ROW,
      warning: 'Failed to link industries',
    })
  })

  it('create: returns the error instead of throwing when the row was not written', async () => {
    createContent.mockResolvedValue({ error: 'duplicate key value violates unique constraint' })
    await expect(saveWith(values)).resolves.toEqual({
      success: false,
      error: 'duplicate key value violates unique constraint',
    })
  })

  it('update: returns the row and warning', async () => {
    updateContent.mockResolvedValue({ data: { ...ROW, id: 'existing' }, warning: 'links failed' })
    await expect(saveWith({ ...values, id: 'existing' })).resolves.toEqual({
      success: true,
      data: { ...ROW, id: 'existing' },
      warning: 'links failed',
    })
    expect(updateContent.mock.calls[0][0]).toBe(type)
    expect(updateContent.mock.calls[0][1]).toBe('existing')
    expect(createContent).not.toHaveBeenCalled()
  })

  it('update: returns the error instead of throwing', async () => {
    updateContent.mockResolvedValue({ error: 'validation failed' })
    await expect(saveWith({ ...values, id: 'existing' })).resolves.toEqual({ success: false, error: 'validation failed' })
  })

  it('save: turns an unexpected throw into an error result', async () => {
    createContent.mockRejectedValue(new Error('network down'))
    await expect(saveWith(values)).resolves.toEqual({ success: false, error: 'network down' })
  })

  it('publish / unpublish: return success', async () => {
    publishContent.mockResolvedValue({ success: true })
    unpublishContent.mockResolvedValue({ success: true })
    await expect(publish('existing', 'a')).resolves.toEqual({ success: true })
    await expect(unpublish('existing', 'a')).resolves.toEqual({ success: true })
    expect(publishContent).toHaveBeenCalledWith(type, 'existing')
    expect(unpublishContent).toHaveBeenCalledWith(type, 'existing')
  })

  it('publish / unpublish: return the error instead of throwing', async () => {
    publishContent.mockResolvedValue({ success: false, error: 'Cannot publish a deleted item' })
    unpublishContent.mockResolvedValue({ success: false })
    await expect(publish('existing', 'a')).resolves.toEqual({ success: false, error: 'Cannot publish a deleted item' })
    await expect(unpublish('existing', 'a')).resolves.toEqual({ success: false, error: 'Failed to unpublish' })
  })

  it('publish: turns an unexpected throw into an error result', async () => {
    publishContent.mockRejectedValue(new Error('network down'))
    await expect(publish('existing', 'a')).resolves.toEqual({ success: false, error: 'network down' })
  })
})

describe('blog editor revalidates the homepage', () => {
  it('after a save, including one with a warning', async () => {
    createContent.mockResolvedValue({ data: ROW, warning: 'links failed' })
    await blog.saveBlogPost({ title: 'A', slug: 'a' })
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('not after a failed save', async () => {
    createContent.mockResolvedValue({ error: 'nope' })
    await blog.saveBlogPost({ title: 'A', slug: 'a' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('after publish and unpublish succeed, not after they fail', async () => {
    publishContent.mockResolvedValue({ success: true })
    unpublishContent.mockResolvedValue({ success: true })
    await blog.publishBlogPost('existing')
    await blog.unpublishBlogPost('existing')
    expect(revalidatePath).toHaveBeenCalledTimes(2)

    revalidatePath.mockClear()
    publishContent.mockResolvedValue({ success: false, error: 'x' })
    unpublishContent.mockResolvedValue({ success: false, error: 'x' })
    await blog.publishBlogPost('existing')
    await blog.unpublishBlogPost('existing')
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

/**
 * Minimal chainable Supabase query mock: every builder method returns the
 * builder, and awaiting it (or calling maybeSingle) resolves to the result
 * registered for the table and the first operation called on it.
 */
function mockSupabase(results: Record<string, { data?: unknown; error?: { message: string } | null }>) {
  const calls: Array<{ table: string; op: string; args: unknown[] }> = []
  mockFrom.mockImplementation((table: string) => {
    let op: string | undefined
    const resolve = () => Promise.resolve(results[`${table}.${op}`] ?? { data: null, error: null })
    const chain = (method: string) => (...args: unknown[]): unknown => {
      if (!op) op = method
      calls.push({ table, op: method, args })
      return builder
    }
    const builder: Record<string, unknown> = {
      select: chain('select'),
      delete: chain('delete'),
      upsert: chain('upsert'),
      eq: chain('eq'),
      in: chain('in'),
      order: chain('order'),
      maybeSingle: resolve,
      then: (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
        resolve().then(onFulfilled, onRejected),
    }
    return builder
  })
  return calls
}

describe('saveHardwareSpecs', () => {
  const rows = [
    { spec_key: 'Qubit Count', value: ' 127 ', unit: null },
    { spec_key: 'T1', value: '100', unit: ' us ' },
  ]

  it('upserts the cleaned rows and revalidates the hardware pages', async () => {
    const calls = mockSupabase({
      'quantum_hardware_specs.select': { data: [{ spec_key: 'old_key' }], error: null },
      'quantum_hardware.select': { data: { slug: 'hw-slug' }, error: null },
    })
    await expect(quantumHardware.saveHardwareSpecs('hw-1', rows)).resolves.toEqual({ success: true })
    const upsert = calls.find((c) => c.op === 'upsert')
    expect(upsert?.args[0]).toEqual([
      { hardware_id: 'hw-1', spec_key: 'qubit_count', value: '127', unit: null },
      { hardware_id: 'hw-1', spec_key: 't1', value: '100', unit: 'us' },
    ])
    expect(calls.some((c) => c.op === 'in' && (c.args[1] as string[]).includes('old_key'))).toBe(true)
    expect(revalidateContentType).toHaveBeenCalledWith('quantum-hardware', 'hw-slug')
  })

  it('deletes every spec when no rows remain, and revalidates', async () => {
    const calls = mockSupabase({ 'quantum_hardware.select': { data: { slug: 'hw-slug' }, error: null } })
    await expect(quantumHardware.saveHardwareSpecs('hw-1', [])).resolves.toEqual({ success: true })
    expect(calls.some((c) => c.table === 'quantum_hardware_specs' && c.op === 'delete')).toBe(true)
    expect(revalidateContentType).toHaveBeenCalledWith('quantum-hardware', 'hw-slug')
  })

  it('returns a duplicate-key error without touching the database', async () => {
    mockSupabase({})
    const result = await quantumHardware.saveHardwareSpecs('hw-1', [
      { spec_key: 'T1', value: '1', unit: null },
      { spec_key: 't1', value: '2', unit: null },
    ])
    expect(result).toEqual({ success: false, error: expect.stringContaining('Duplicate spec key "t1"') })
    expect(mockFrom).not.toHaveBeenCalled()
    expect(revalidateContentType).not.toHaveBeenCalled()
  })

  it('returns a database error and does not revalidate', async () => {
    mockSupabase({
      'quantum_hardware_specs.select': { data: [], error: null },
      'quantum_hardware_specs.upsert': { error: { message: 'permission denied' } },
    })
    await expect(quantumHardware.saveHardwareSpecs('hw-1', rows)).resolves.toEqual({
      success: false,
      error: 'permission denied',
    })
    expect(revalidateContentType).not.toHaveBeenCalled()
  })
})
