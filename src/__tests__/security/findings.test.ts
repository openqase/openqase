/**
 * Security regression tests — Finding 1.1
 *
 * Tests that fetchContentBySlug correctly filters:
 *   - unpublished content (draft rows) → returns null
 *   - soft-deleted content (deleted_at IS NOT NULL) → returns null
 *   - published, not-deleted content → returns the record
 *
 * Also tests the preview branch:
 *   - when isEnabled: true, fetchPreviewContentBySlug returns drafts
 *   - when isEnabled: true, fetchPreviewContentBySlug still excludes
 *     soft-deleted rows
 *
 * These are unit tests that mock Supabase and next/headers — no running
 * database required. The test file uses the .integration.test.ts suffix
 * for historical reasons; it is excluded from the default vitest run
 * (see vitest.config.ts exclude list) and must be run explicitly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { glob } from 'glob'

// Mock React cache as pass-through so the cache wrapper is transparent.
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return { ...actual, cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn }
})

// ---------------------------------------------------------------------------
// Mocks for next/headers — default to preview disabled (normal public path).
// Individual tests override this via mockResolvedValueOnce.
// ---------------------------------------------------------------------------
const mockDraftMode = vi.fn().mockResolvedValue({ isEnabled: false })
vi.mock('next/headers', () => ({
  draftMode: mockDraftMode,
  cookies: vi.fn().mockResolvedValue({}),
}))

// ---------------------------------------------------------------------------
// Supabase mock chain — models the fluent query builder.
// The chain: .from().select().eq().eq().is().maybeSingle()
// ---------------------------------------------------------------------------
const mockMaybeSingle = vi.fn()
const mockIs = vi.fn()
const mockEq = vi.fn()
mockEq.mockReturnValue({ eq: mockEq, is: mockIs, maybeSingle: mockMaybeSingle })
mockIs.mockReturnValue({ eq: mockEq, is: mockIs, maybeSingle: mockMaybeSingle })
const mockSelect = vi.fn(() => ({ eq: mockEq, is: mockIs }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom }),
  createServerSupabaseClient: async () => ({ from: mockFrom }),
}))

vi.mock('@/lib/internal-queries', () => ({
  fromTable: (_client: unknown, _table: string) => ({ select: mockSelect }),
}))

// Import under test — after mocks are in place.
const { fetchContentBySlug } = await import('@/cms/operations/fetch')
const { fetchPreviewContentBySlug } = await import('@/cms/operations/fetch')

// ---------------------------------------------------------------------------
// Helpers to produce typical DB rows
// ---------------------------------------------------------------------------
function makeIndustryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'industry-1',
    name: 'Finance',
    slug: 'finance',
    description: 'Financial services',
    published: true,
    deleted_at: null,
    algorithm_industry_relations: [],
    case_study_industry_relations: [],
    persona_industry_relations: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Re-establish default chain after clearAllMocks
  mockDraftMode.mockResolvedValue({ isEnabled: false })
  mockEq.mockReturnValue({ eq: mockEq, is: mockIs, maybeSingle: mockMaybeSingle })
  mockIs.mockReturnValue({ eq: mockEq, is: mockIs, maybeSingle: mockMaybeSingle })
  mockSelect.mockReturnValue({ eq: mockEq, is: mockIs })
  mockFrom.mockReturnValue({ select: mockSelect })
})

// ---------------------------------------------------------------------------
// Finding 1.1 — published filter
// ---------------------------------------------------------------------------
describe('Finding 1.1 — fetchContentBySlug: published/deleted_at filters', () => {
  it('returns null for an unpublished (draft) row — exploit path blocked', async () => {
    // Simulate DB returning null because the published=true filter excludes the draft.
    // The Supabase mock always returns what we tell it; asserting null here confirms
    // that our code surfaces the null correctly and doesn't bypass it.
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await fetchContentBySlug('industries', 'draft-slug')

    expect(result).toBeNull()
  })

  it('returns the record for a published, non-deleted row', async () => {
    const row = makeIndustryRow()
    mockMaybeSingle.mockResolvedValueOnce({ data: row, error: null })

    const result = await fetchContentBySlug('industries', 'finance')

    expect(result).not.toBeNull()
    expect(result!.slug).toBe('finance')
    expect(result!.name).toBe('Finance')
  })

  it('returns null for a soft-deleted row (deleted_at IS NOT NULL)', async () => {
    // Simulate DB returning null because the .is('deleted_at', null) filter
    // excludes rows where deleted_at is set.
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await fetchContentBySlug('industries', 'soft-deleted-slug')

    expect(result).toBeNull()
  })

  it('applies published=true filter to the query', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    await fetchContentBySlug('industries', 'anything')

    // The eq mock should have been called with ('published', true)
    expect(mockEq).toHaveBeenCalledWith('published', true)
  })

  it('applies deleted_at IS NULL filter to the query', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    await fetchContentBySlug('industries', 'anything')

    // The is mock should have been called with ('deleted_at', null)
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })

  it('returns null for an unknown content type', async () => {
    const result = await fetchContentBySlug('nonexistent-type', 'any-slug')
    expect(result).toBeNull()
  })

  it('returns null when Supabase returns an error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB error') })

    const result = await fetchContentBySlug('industries', 'finance')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Preview branch — fetchPreviewContentBySlug
// ---------------------------------------------------------------------------
describe('fetchPreviewContentBySlug: preview mode branch', () => {
  it('falls through to the public path when preview is disabled (isEnabled: false)', async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false })
    const row = makeIndustryRow()
    mockMaybeSingle.mockResolvedValueOnce({ data: row, error: null })

    const result = await fetchPreviewContentBySlug('industries', 'finance')

    expect(result).not.toBeNull()
    // published=true filter MUST be applied on the non-preview path
    expect(mockEq).toHaveBeenCalledWith('published', true)
  })

  it('returns a draft row when preview is enabled (isEnabled: true)', async () => {
    // Preview mode: service role client used, published filter skipped.
    mockDraftMode.mockResolvedValue({ isEnabled: true })
    const draftRow = makeIndustryRow({ published: false })
    mockMaybeSingle.mockResolvedValueOnce({ data: draftRow, error: null })

    const result = await fetchPreviewContentBySlug('industries', 'draft-finance')

    expect(result).not.toBeNull()
    expect(result!.slug).toBe('finance')
    // published=true filter must NOT be applied on the preview path
    const publishedCall = mockEq.mock.calls.find(
      ([field, value]) => field === 'published' && value === true
    )
    expect(publishedCall).toBeUndefined()
  })

  it('still applies deleted_at IS NULL filter even in preview mode', async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true })
    // Simulate DB returning null because deleted_at filter excluded the row
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await fetchPreviewContentBySlug('industries', 'soft-deleted-draft')

    expect(result).toBeNull()
    // is('deleted_at', null) must be applied in preview mode too
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })

  it('returns null for unknown content type even in preview mode', async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true })

    const result = await fetchPreviewContentBySlug('nonexistent-type', 'slug')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Finding 1.3 — Server actions wrapped in withAdmin
// ---------------------------------------------------------------------------
describe('Finding 1.3 — Server actions wrapped in withAdmin', () => {
  it('all admin server actions are wrapped in withAdmin', async () => {
    const files = await glob('src/app/admin/*/[[]id[]]/actions.ts')
    expect(files.length).toBeGreaterThan(0)  // sanity check the glob is picking up files
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      // No bare `export async function` declarations.
      expect(src, `${file}: bare 'export async function' found`).not.toMatch(/^export\s+async\s+function\b/m)
      // Every exported `const` should be wrapped in withAdmin(.
      const exports = src.match(/^export\s+const\s+\w+\s*=\s*[^\n]+/gm) ?? []
      for (const e of exports) {
        expect(e, `${file}: export not wrapped in withAdmin: ${e}`).toMatch(/withAdmin\(/)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Finding 1.4 — DEV_MODE_AUTH_BYPASS gating
// ---------------------------------------------------------------------------
describe('Finding 1.4 — DEV_MODE_AUTH_BYPASS gating', () => {
  it.todo('blocks bypass when NODE_ENV=production (covered by middleware unit tests + scripts/assert-env.test.js)')
})

// ---------------------------------------------------------------------------
// Helpers for migration assertions
// ---------------------------------------------------------------------------
function readMigrationBySuffix(suffix: string): string {
  const files = glob.sync(`supabase/migrations/*_${suffix}`)
  expect(files, `expected one migration matching *_${suffix}, found: ${files.join(', ')}`).toHaveLength(1)
  return readFileSync(files[0], 'utf8')
}

// ---------------------------------------------------------------------------
// Finding 2.1 — REVOKE writes from anon/authenticated migration present
// ---------------------------------------------------------------------------
describe('Finding 2.1 — REVOKE writes from anon/authenticated migration present', () => {
  it('migration file exists', () => {
    const files = glob.sync('supabase/migrations/*_a1_revoke_anon_writes.sql')
    expect(files).toHaveLength(1)
  })
  it('migration content includes REVOKE INSERT, UPDATE, DELETE, TRUNCATE', () => {
    const sql = readMigrationBySuffix('a1_revoke_anon_writes.sql')
    expect(sql).toMatch(/REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE/i)
    expect(sql).toMatch(/FROM\s+anon,\s*authenticated/i)
  })
})

// ---------------------------------------------------------------------------
// Finding 2.3 — deletion_audit_log admin-only migration present
// ---------------------------------------------------------------------------
describe('Finding 2.3 — deletion_audit_log admin-only migration present', () => {
  it('migration file exists', () => {
    const files = glob.sync('supabase/migrations/*_a1_audit_log_admin_only.sql')
    expect(files).toHaveLength(1)
  })
  it('migration drops the old permissive policy and creates the admin-only one', () => {
    const sql = readMigrationBySuffix('a1_audit_log_admin_only.sql')
    expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"Authenticated users can view audit logs"/)
    expect(sql).toMatch(/CREATE\s+POLICY\s+"Admins read audit log"/)
    expect(sql).toMatch(/role\s*=\s*'admin'/)
  })
})
