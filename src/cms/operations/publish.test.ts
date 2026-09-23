import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

// Real registry plus one synthetic type whose table has no published_at
// column (all 9 real content tables have it).
vi.mock('../registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../registry')>()
  const { defineContentType } = await import('../define')
  const legacy = defineContentType({
    slug: 'legacy-things',
    tableName: 'legacy_things',
    label: { singular: 'Legacy Thing', plural: 'Legacy Things' },
    basePath: '/legacy',
    adminPath: '/admin/legacy',
    fields: [{ name: 'title', type: 'text' }],
    relationships: [],
    metadata: { titleField: 'title', descriptionField: 'title' },
  })
  return {
    ...actual,
    getContentType: (slug: string) => (slug === legacy.slug ? legacy : actual.getContentType(slug)),
  }
})

// ---------------------------------------------------------------------------
// Chainable Supabase mock. Every `from(table)` returns a query builder that
// records each method call; terminal calls (single / maybeSingle / await)
// resolve via `respond(table, ops)`, which each test can override.
// ---------------------------------------------------------------------------
type Op = [string, unknown[]]
interface QueryRecord { table: string; ops: Op[] }
type Result = { data?: unknown; error: unknown; count?: number }

let queries: QueryRecord[] = []
let respond: (q: QueryRecord) => Result = () => ({ data: null, error: null })

const CHAIN_METHODS = ['select', 'update', 'insert', 'delete', 'eq', 'is', 'in', 'not', 'order', 'range', 'ilike']

function makeQuery(table: string) {
  const rec: QueryRecord = { table, ops: [] }
  queries.push(rec)
  const q: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    q[m] = (...args: unknown[]) => { rec.ops.push([m, args]); return q }
  }
  const terminal = (name: string) => (...args: unknown[]) => {
    rec.ops.push([name, args])
    return Promise.resolve(respond(rec))
  }
  q.single = terminal('single')
  q.maybeSingle = terminal('maybeSingle')
  q.then = (resolve: (v: Result) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(respond(rec)).then(resolve, reject)
  return q
}

const mockFrom = vi.fn((table: string) => makeQuery(table))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
}))

const { revalidatePath } = await import('next/cache')
const { publishContent, unpublishContent } = await import('./publish')
const { deleteContent, restoreContent, permanentlyDeleteContent } = await import('./delete')

const has = (q: QueryRecord, method: string, ...args: unknown[]) =>
  q.ops.some(([m, a]) => m === method && JSON.stringify(a) === JSON.stringify(args))
const isUpdate = (q: QueryRecord) => q.ops.some(([m]) => m === 'update')
const isDelete = (q: QueryRecord) => q.ops.some(([m]) => m === 'delete')
const updatePayload = (q: QueryRecord) =>
  q.ops.find(([m]) => m === 'update')?.[1][0] as Record<string, unknown>
const revalidated = () => vi.mocked(revalidatePath).mock.calls.map(([p]) => p)

beforeEach(() => {
  vi.clearAllMocks()
  queries = []
  respond = () => ({ data: null, error: null })
})

describe('publishContent', () => {
  it('sets published=true, guards deleted_at and revalidates', async () => {
    respond = (q) => isUpdate(q)
      ? { data: { slug: 'finance' }, error: null }
      : { data: { id: '1', deleted_at: null }, error: null }

    const result = await publishContent('industries', '1')

    expect(result.success).toBe(true)
    const update = queries.find(isUpdate)!
    expect(updatePayload(update)).toMatchObject({ published: true })
    expect(has(update, 'is', 'deleted_at', null)).toBe(true)
    expect(revalidated()).toEqual(expect.arrayContaining([
      '/admin/industries', '/paths/industry', '/paths/industry/finance',
    ]))
  })

  it('sets published_at when the row has none, reusing the pre-check read', async () => {
    respond = (q) => isUpdate(q)
      ? { data: { slug: 'my-study' }, error: null }
      : { data: { id: '1', deleted_at: null, published_at: null }, error: null }

    const before = Date.now()
    const result = await publishContent('case-studies', '1')

    expect(result.success).toBe(true)
    expect(queries).toHaveLength(2)
    const read = queries.find(q => !isUpdate(q))!
    expect(has(read, 'select', 'id, deleted_at, published_at')).toBe(true)
    const payload = updatePayload(queries.find(isUpdate)!)
    expect(payload.published).toBe(true)
    expect(typeof payload.published_at).toBe('string')
    expect(Date.parse(payload.published_at as string)).toBeGreaterThanOrEqual(before - 1000)
  })

  it('preserves an existing published_at when republishing', async () => {
    respond = (q) => isUpdate(q)
      ? { data: { slug: 'my-study' }, error: null }
      : { data: { id: '1', deleted_at: null, published_at: '2025-01-01T00:00:00Z' }, error: null }

    const result = await publishContent('case-studies', '1')

    expect(result.success).toBe(true)
    expect(updatePayload(queries.find(isUpdate)!)).toEqual({ published: true })
  })

  it('omits published_at for tables without the column', async () => {
    respond = (q) => isUpdate(q)
      ? { data: { slug: 'thing' }, error: null }
      : { data: { id: '1', deleted_at: null }, error: null }

    const result = await publishContent('legacy-things', '1')

    expect(result.success).toBe(true)
    const read = queries.find(q => !isUpdate(q))!
    expect(has(read, 'select', 'id, deleted_at')).toBe(true)
    expect(updatePayload(queries.find(isUpdate)!)).toEqual({ published: true })
  })

  it('refuses to publish a soft-deleted row', async () => {
    respond = () => ({ data: { id: '1', deleted_at: '2026-09-01T00:00:00Z' }, error: null })

    const result = await publishContent('industries', '1')

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/deleted/i)
    expect(queries.some(isUpdate)).toBe(false)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns an error when the row does not exist', async () => {
    respond = () => ({ data: null, error: null })
    const result = await publishContent('industries', 'missing')
    expect(result.success).toBe(false)
    expect(queries.some(isUpdate)).toBe(false)
  })

  it('returns error for unknown type', async () => {
    const result = await publishContent('nonexistent', '1')
    expect(result.error).toBeDefined()
  })
})

describe('unpublishContent', () => {
  it('sets published=false and returns success', async () => {
    respond = () => ({ data: { id: '1', slug: 'finance', published: false }, error: null })
    const result = await unpublishContent('industries', '1')
    expect(result.success).toBe(true)
    expect(updatePayload(queries.find(isUpdate)!)).toEqual({ published: false })
  })
})

describe('deleteContent (soft delete)', () => {
  it('sets deleted_at, deleted_by and published=false, never hard-deletes', async () => {
    respond = (q) => isUpdate(q)
      ? { data: null, error: null }
      : { data: { id: '1', slug: 'finance', name: 'Finance' }, error: null }

    const result = await deleteContent('industries', '1', { deletedBy: 'user-1' })

    expect(result.success).toBe(true)
    const update = queries.find(q => q.table === 'industries' && isUpdate(q))!
    const payload = updatePayload(update)
    expect(payload.published).toBe(false)
    expect(payload.deleted_by).toBe('user-1')
    expect(typeof payload.deleted_at).toBe('string')
    expect(has(update, 'eq', 'id', '1')).toBe(true)
    expect(queries.some(isDelete)).toBe(false)
  })

  it('revalidates admin list, public list and the slug page', async () => {
    respond = (q) => isUpdate(q)
      ? { data: null, error: null }
      : { data: { id: '1', slug: 'my-study', title: 'My Study' }, error: null }

    await deleteContent('case-studies', '1')

    expect(revalidated()).toEqual(expect.arrayContaining([
      '/admin/case-studies', '/case-study', '/case-study/my-study',
    ]))
  })

  it('soft-deletes junction rows that support deleted_at', async () => {
    respond = (q) => isUpdate(q)
      ? { data: null, error: null }
      : { data: { id: '1', slug: 'qs' }, error: null }

    await deleteContent('quantum-software', '1')

    const junction = queries.find(q => q.table === 'case_study_quantum_software_relations')!
    expect(isUpdate(junction)).toBe(true)
    expect(has(junction, 'eq', 'quantum_software_id', '1')).toBe(true)
  })

  it('writes an audit log entry when the actor is known', async () => {
    respond = (q) => isUpdate(q)
      ? { data: null, error: null }
      : { data: { id: '1', slug: 'finance', name: 'Finance' }, error: null }

    await deleteContent('industries', '1', { deletedBy: 'user-1' })

    expect(queries.some(q => q.table === 'deletion_audit_log')).toBe(true)
  })

  it('returns an error and does not revalidate when the row is missing', async () => {
    respond = () => ({ data: null, error: null })
    const result = await deleteContent('industries', 'missing')
    expect(result.success).toBe(false)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns an error when the update fails', async () => {
    respond = (q) => isUpdate(q)
      ? { data: null, error: { message: 'boom' } }
      : { data: { id: '1', slug: 'finance' }, error: null }
    const result = await deleteContent('industries', '1')
    expect(result).toEqual({ success: false, error: 'boom' })
  })
})

describe('restoreContent', () => {
  it('clears deleted_at/deleted_by, keeps published=false, only for trashed rows, and revalidates', async () => {
    respond = () => ({ data: { id: '1', slug: 'finance', name: 'Finance' }, error: null })

    const result = await restoreContent('industries', '1')

    expect(result.success).toBe(true)
    const update = queries.find(q => q.table === 'industries' && isUpdate(q))!
    expect(updatePayload(update)).toEqual({ deleted_at: null, deleted_by: null, published: false })
    expect(has(update, 'not', 'deleted_at', 'is', null)).toBe(true)
    expect(revalidated()).toContain('/paths/industry/finance')
  })

  it('fails when the row is not in the trash', async () => {
    respond = () => ({ data: null, error: null })
    const result = await restoreContent('industries', '1')
    expect(result.success).toBe(false)
  })
})

describe('permanentlyDeleteContent', () => {
  it('only hard-deletes rows already in the trash and revalidates', async () => {
    respond = (q) => isDelete(q)
      ? { data: null, error: null }
      : { data: [{ id: '1', slug: 'old-study' }], error: null }

    const result = await permanentlyDeleteContent('case-studies', ['1', '2'])

    expect(result).toEqual({ success: true, deleted: 1 })
    const lookup = queries.find(q => q.table === 'case_studies' && !isDelete(q))!
    expect(has(lookup, 'not', 'deleted_at', 'is', null)).toBe(true)
    const del = queries.find(q => q.table === 'case_studies' && isDelete(q))!
    expect(has(del, 'in', 'id', ['1'])).toBe(true)
    expect(revalidated()).toEqual(expect.arrayContaining(['/admin/case-studies', '/case-study/old-study']))
  })

  it('does nothing when none of the ids are trashed', async () => {
    respond = () => ({ data: [], error: null })
    const result = await permanentlyDeleteContent('case-studies', ['1'])
    expect(result).toEqual({ success: true, deleted: 0 })
    expect(queries.some(isDelete)).toBe(false)
  })
})
