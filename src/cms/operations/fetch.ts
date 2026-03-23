import { cache } from 'react'
import { getContentType } from '../registry'
import { buildRelationshipSelect, flattenRelationships } from './relationships'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/supabase-untyped'

async function _fetchContentBySlug(
  typeSlug: string,
  slug: string
): Promise<Record<string, unknown> | null> {
  const ct = getContentType(typeSlug)
  if (!ct) return null

  const supabase = createServiceRoleSupabaseClient()
  const selectStr = buildRelationshipSelect(ct)

  const { data, error } = await fromTable(supabase, ct.tableName)
    .select(selectStr)
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  // Flatten nested relationship data and merge with base fields
  const relationships = flattenRelationships(data as Record<string, unknown>, ct)
  const base: Record<string, unknown> = { ...(data as Record<string, unknown>) }

  // Remove raw junction data, add flattened relationships
  for (const rel of ct.relationships) {
    delete base[rel.junction]
  }
  Object.assign(base, relationships)

  return base
}

// Wrap in React.cache() for request-scoped deduplication
// This is the SINGLE caching layer — page-helpers does NOT add another
export const fetchContentBySlug = cache(_fetchContentBySlug)

async function _fetchContent(
  typeSlug: string,
  id: string
): Promise<Record<string, unknown> | null> {
  const ct = getContentType(typeSlug)
  if (!ct) return null

  const supabase = createServiceRoleSupabaseClient()
  const selectStr = buildRelationshipSelect(ct)

  const { data, error } = await fromTable(supabase, ct.tableName)
    .select(selectStr)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const relationships = flattenRelationships(data as Record<string, unknown>, ct)
  const base: Record<string, unknown> = { ...(data as Record<string, unknown>) }
  for (const rel of ct.relationships) {
    delete base[rel.junction]
  }
  Object.assign(base, relationships)
  return base
}

export const fetchContent = cache(_fetchContent)

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

  let query = fromTable(supabase, ct.tableName)
    .select('*', { count: 'exact' })

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
