import { cache } from 'react'
import { draftMode } from 'next/headers'
import { getContentType } from '../registry'
import { buildRelationshipSelect, flattenRelationships, type FlattenOptions } from './relationships'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'

// ---------------------------------------------------------------------------
// Shared helper: run the relationship-flattening logic on a raw DB row.
// ---------------------------------------------------------------------------
function flattenContentRow(
  data: Record<string, unknown>,
  ct: ReturnType<typeof getContentType>,
  options: FlattenOptions = {}
): Record<string, unknown> {
  if (!ct) return data
  const relationships = flattenRelationships(data, ct, options)
  const base: Record<string, unknown> = { ...data }
  for (const rel of ct.relationships) {
    delete base[rel.junction]
  }
  Object.assign(base, relationships)
  return base
}

// ---------------------------------------------------------------------------
// SSG-friendly fetch — NEVER calls draftMode() or cookies().
// Used by all static detail pages and generateMetadata.
// Does NOT trigger Next.js dynamic rendering — pages remain ● (static/ISR).
//
// Uses the service-role client (no Dynamic API, no user-session overhead)
// but enforces published=true and deleted_at IS NULL explicitly so the
// RLS bypass does not expose draft or soft-deleted content.
// ---------------------------------------------------------------------------
async function _fetchContentBySlug(
  typeSlug: string,
  slug: string
): Promise<Record<string, unknown> | null> {
  const ct = getContentType(typeSlug)
  if (!ct) return null

  const selectStr = buildRelationshipSelect(ct)
  const supabase = createServiceRoleSupabaseClient()

  const { data, error } = await fromTable(supabase, ct.tableName)
    .select(selectStr)
    .eq('slug', slug)
    .eq('published', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  return flattenContentRow(data as Record<string, unknown>, ct, { publishedOnly: true })
}

// Wrap in React.cache() for request-scoped deduplication.
// This is the SINGLE caching layer — page-helpers does NOT add another.
export const fetchContentBySlug = cache(_fetchContentBySlug)

// ---------------------------------------------------------------------------
// Preview-aware fetch — calls draftMode() so Next.js marks the page as
// dynamic (ƒ). Use ONLY in pages that are redirect targets from /api/preview.
// The /api/preview route redirects to: case-study, algorithm, industry,
// persona, and blog pages.
//
// NOTE: This fix addresses the top-level public-content leak. Nested-
// relationship data is NOT protected by RLS here — the service-role client
// bypasses RLS entirely. Draft / soft-deleted related entities are filtered
// out in JS by flattenRelationships() (the long-standing JS-filtering
// pattern, see GitHub issue #143).
// ---------------------------------------------------------------------------
async function _fetchPreviewContentBySlug(
  typeSlug: string,
  slug: string
): Promise<Record<string, unknown> | null> {
  const { isEnabled: isPreview } = await draftMode()

  if (!isPreview) {
    // No active preview session — fall through to the SSG-safe path.
    // This avoids a duplicate Supabase call on the normal render path
    // because React.cache deduplicates _fetchContentBySlug per request.
    return _fetchContentBySlug(typeSlug, slug)
  }

  // Preview active: service-role client + skip published filter so drafts
  // are visible. Still filters out soft-deleted rows.
  const ct = getContentType(typeSlug)
  if (!ct) return null

  const selectStr = buildRelationshipSelect(ct)
  const supabase = createServiceRoleSupabaseClient()

  const { data, error } = await fromTable(supabase, ct.tableName)
    .select(selectStr)
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  return flattenContentRow(data as Record<string, unknown>, ct)
}

export const fetchPreviewContentBySlug = cache(_fetchPreviewContentBySlug)

interface ListOptions {
  page?: number
  pageSize?: number
  search?: string
  publishedOnly?: boolean
}

export async function listContent(
  typeSlug: string,
  options: ListOptions = {}
): Promise<{ items: Record<string, unknown>[]; total: number }> {
  const ct = getContentType(typeSlug)
  if (!ct) return { items: [], total: 0 }

  const { page = 1, pageSize = 50, search, publishedOnly = true } = options
  const supabase = createServiceRoleSupabaseClient()

  // Soft-deleted (trashed) rows are never listed. Every registered content
  // table has a deleted_at column (see src/types/supabase.ts).
  let query = fromTable(supabase, ct.tableName)
    .select('*', { count: 'exact' })
    .is('deleted_at', null)

  if (publishedOnly) {
    query = query.eq('published', true)
  }

  if (search) {
    const titleField = ct.metadata.titleField
    query = query.ilike(titleField, `%${search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { items: [], total: 0 }

  return { items: (data ?? []) as Record<string, unknown>[], total: count ?? 0 }
}
