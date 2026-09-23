import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Mock Supabase: an in-memory table store whose query builder records filters
// and applies eq / is(null) against the rows, so we can assert that draft and
// soft-deleted rows never reach the sitemap.
// ---------------------------------------------------------------------------
type Row = { slug: string; updated_at: string | null; published: boolean; deleted_at: string | null }

const tables: Record<string, Row[]> = {}
const calls: Array<{ table: string; filters: Array<[string, string, unknown]> }> = []

function makeBuilder(table: string) {
  const filters: Array<[string, string, unknown]> = []
  calls.push({ table, filters })
  const builder = {
    select: () => builder,
    eq: (col: string, val: unknown) => {
      filters.push(['eq', col, val])
      return builder
    },
    is: (col: string, val: unknown) => {
      filters.push(['is', col, val])
      return builder
    },
    then: (resolve: (v: { data: Row[]; error: null }) => unknown) => {
      const data = (tables[table] ?? []).filter((row) =>
        filters.every(([, col, val]) => (row as Record<string, unknown>)[col] === val)
      )
      return Promise.resolve({ data, error: null }).then(resolve)
    },
  }
  return builder
}

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: (table: string) => makeBuilder(table) }),
}))

import sitemap from './sitemap'
import { getAllContentTypes } from '@/cms/registry'

const APP_DIR = path.resolve(__dirname)
const BASE_URL = 'https://openqase.com'

/** True if `urlPath` (e.g. /paths/industry/foo) resolves to a page in src/app. */
function routeExists(urlPath: string): boolean {
  const segments = urlPath.split('/').filter(Boolean)
  const walk = (dir: string, rest: string[]): boolean => {
    if (rest.length === 0) return fs.existsSync(path.join(dir, 'page.tsx'))
    const [head, ...tail] = rest
    if (fs.existsSync(path.join(dir, head)) && walk(path.join(dir, head), tail)) return true
    const slugDir = path.join(dir, '[slug]')
    return fs.existsSync(slugDir) && walk(slugDir, tail)
  }
  return walk(APP_DIR, segments)
}

describe('sitemap', () => {
  beforeEach(() => {
    calls.length = 0
    for (const key of Object.keys(tables)) delete tables[key]
    for (const ct of getAllContentTypes()) {
      tables[ct.tableName] = [
        { slug: `${ct.slug}-live`, updated_at: '2026-01-01T00:00:00Z', published: true, deleted_at: null },
        { slug: `${ct.slug}-draft`, updated_at: null, published: false, deleted_at: null },
        { slug: `${ct.slug}-deleted`, updated_at: null, published: true, deleted_at: '2026-02-01T00:00:00Z' },
      ]
    }
  })

  it('only emits URLs that map to an existing route directory', async () => {
    const entries = await sitemap()
    expect(entries.length).toBeGreaterThan(0)
    for (const entry of entries) {
      expect(entry.url.startsWith(BASE_URL)).toBe(true)
      const urlPath = entry.url.slice(BASE_URL.length) || '/'
      expect(routeExists(urlPath), `no route for ${urlPath}`).toBe(true)
    }
  })

  it('uses plural company paths', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toContain(`${BASE_URL}/paths/quantum-companies/quantum-companies-live`)
    expect(urls).toContain(`${BASE_URL}/paths/partner-companies/partner-companies-live`)
    expect(urls.some((u) => u.includes('/paths/quantum-company/'))).toBe(false)
    expect(urls.some((u) => u.includes('/paths/partner-company/'))).toBe(false)
  })

  it('includes one published detail page per content type', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    for (const ct of getAllContentTypes()) {
      expect(urls).toContain(`${BASE_URL}${ct.basePath}/${ct.slug}-live`)
      expect(urls).toContain(`${BASE_URL}${ct.basePath}`)
    }
  })

  it('filters out unpublished and soft-deleted rows', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls.some((u) => u.endsWith('-draft'))).toBe(false)
    expect(urls.some((u) => u.endsWith('-deleted'))).toBe(false)

    expect(calls).toHaveLength(getAllContentTypes().length)
    for (const call of calls) {
      expect(call.filters).toContainEqual(['eq', 'published', true])
      expect(call.filters).toContainEqual(['is', 'deleted_at', null])
    }
  })

  it('has no duplicate URLs', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
