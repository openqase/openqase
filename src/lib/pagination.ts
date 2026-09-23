/**
 * Query-string pagination parsing for public list API routes.
 *
 * Policy (applied identically by every /api/<type> GET handler):
 *   - Missing param            -> route default (page 1, pageSize per route).
 *   - Not a positive integer   -> 400 (e.g. "abc", "0", "-5", "1.5", "10abc").
 *   - pageSize above the cap   -> clamped to MAX_PAGE_SIZE (100).
 */
export const MAX_PAGE_SIZE = 100

export type PaginationResult =
  | { ok: true; page: number; pageSize: number }
  | { ok: false; error: string }

function parsePositiveInt(raw: string | null, fallback: number): number | null {
  if (raw === null || raw.trim() === '') return fallback
  if (!/^\d+$/.test(raw.trim())) return null
  const value = Number(raw.trim())
  return Number.isSafeInteger(value) && value >= 1 ? value : null
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; pageSize?: number } = {}
): PaginationResult {
  const page = parsePositiveInt(searchParams.get('page'), defaults.page ?? 1)
  if (page === null) return { ok: false, error: 'page must be a positive integer' }

  const pageSize = parsePositiveInt(searchParams.get('pageSize'), defaults.pageSize ?? 10)
  if (pageSize === null) return { ok: false, error: 'pageSize must be a positive integer' }

  return { ok: true, page, pageSize: Math.min(pageSize, MAX_PAGE_SIZE) }
}
