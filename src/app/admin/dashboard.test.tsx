// src/app/admin/dashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { contentTypes } from '@/cms/registry'

/**
 * The dashboard counts must include drafts for every content type (#285) and
 * leave out trashed rows (#269). Under RLS most tables only show published rows
 * to the user's session, so the counts go through the service-role client, as
 * the admin list pages do.
 */

type Op = [method: string, ...args: unknown[]]
interface Query {
  table: string
  ops: Op[]
}

const queries: Query[] = []
const counts: Record<string, number> = Object.fromEntries(
  contentTypes.map((ct, i) => [ct.tableName, 9001 + i]),
)

// Records each chained call and resolves to { count } when awaited.
function queryBuilder(query: Query): unknown {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) =>
            resolve({ data: null, error: null, count: counts[query.table] })
        }
        return (...args: unknown[]) => {
          query.ops.push([String(prop), ...args])
          return queryBuilder(query)
        }
      },
    },
  )
}

const createServiceRoleSupabaseClient = vi.fn(() => ({
  from: (table: string) => {
    const query: Query = { table, ops: [] }
    queries.push(query)
    return queryBuilder(query)
  },
}))
const createServerSupabaseClient = vi.fn(() => {
  throw new Error('dashboard must not count with the RLS-scoped session client')
})

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => createServiceRoleSupabaseClient(),
  createServerSupabaseClient: () => createServerSupabaseClient(),
}))

import AdminDashboard, { dynamic } from './page'

describe('admin dashboard counts', () => {
  beforeEach(() => {
    queries.length = 0
    createServiceRoleSupabaseClient.mockClear()
    createServerSupabaseClient.mockClear()
  })

  it('counts with the service-role client, not the session client', async () => {
    await AdminDashboard()
    expect(createServiceRoleSupabaseClient).toHaveBeenCalled()
    expect(createServerSupabaseClient).not.toHaveBeenCalled()
  })

  it('counts every content type, excluding trash but not drafts', async () => {
    await AdminDashboard()

    expect(queries.map((q) => q.table).sort()).toEqual(contentTypes.map((ct) => ct.tableName).sort())
    for (const { table, ops } of queries) {
      expect(ops, table).toContainEqual(['select', 'id', { count: 'exact', head: true }])
      expect(ops, table).toContainEqual(['is', 'deleted_at', null])
      const filtersPublished = ops.some(([, column]) => column === 'published')
      expect(filtersPublished, `${table} must not filter on published`).toBe(false)
    }
  })

  it('renders each count', async () => {
    const html = renderToStaticMarkup(await AdminDashboard())
    for (const count of Object.values(counts)) {
      expect(html).toContain(`>${count}<`)
    }
  })

  it('renders per request, not once at build time', () => {
    expect(dynamic).toBe('force-dynamic')
  })
})
