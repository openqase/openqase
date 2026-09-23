import { getContentType } from '../registry'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'
import { revalidateContentType } from './revalidate'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type TableWithPublishedAt = {
  [K in keyof Tables]: 'published_at' extends keyof Tables[K]['Row'] ? K : never
}[keyof Tables]

/**
 * Content tables that have a `published_at` column. The `satisfies` clause
 * makes listing a table without the column a type error (checked against
 * src/types/supabase.ts). As of 2026-09 all 9 CMS content tables have it.
 */
const TABLES_WITH_PUBLISHED_AT: ReadonlySet<string> = new Set([
  'algorithms',
  'blog_posts',
  'case_studies',
  'industries',
  'partner_companies',
  'personas',
  'quantum_companies',
  'quantum_hardware',
  'quantum_software',
] satisfies TableWithPublishedAt[])

interface PublishResult {
  success: boolean
  error?: string
}

export async function publishContent(typeSlug: string, id: string): Promise<PublishResult> {
  const ct = getContentType(typeSlug)
  if (!ct) return { success: false, error: `Unknown content type: ${typeSlug}` }

  const supabase = createServiceRoleSupabaseClient()

  // Refuse to publish soft-deleted (trashed) content: a row with deleted_at
  // set must be restored first. The `.is('deleted_at', null)` guard on the
  // update itself makes this race-free; the pre-check gives a clear error.
  //
  // The same read fetches published_at: only blog_posts and personas have a
  // DB trigger that sets it, so the CMS stamps it here for every type. An
  // existing value is kept so republishing never moves the original date.
  const hasPublishedAt = TABLES_WITH_PUBLISHED_AT.has(ct.tableName)
  const { data: existing, error: fetchError } = await fromTable(supabase, ct.tableName)
    .select(hasPublishedAt ? 'id, deleted_at, published_at' : 'id, deleted_at')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return { success: false, error: fetchError.message }
  if (!existing) return { success: false, error: `${ct.label.singular} not found` }
  const row = existing as Record<string, unknown>
  if (row.deleted_at) {
    return { success: false, error: `Cannot publish a deleted ${ct.label.singular.toLowerCase()}; restore it from the trash first` }
  }

  const payload: Record<string, unknown> = { published: true }
  if (hasPublishedAt && !row.published_at) {
    payload.published_at = new Date().toISOString()
  }

  const { data, error } = await fromTable(supabase, ct.tableName)
    .update(payload)
    .eq('id', id)
    .is('deleted_at', null)
    .select('slug')
    .single()

  if (error) return { success: false, error: error.message }

  revalidateContentType(typeSlug, (data as Record<string, unknown>)?.slug as string | undefined)
  return { success: true }
}

export async function unpublishContent(typeSlug: string, id: string): Promise<PublishResult> {
  const ct = getContentType(typeSlug)
  if (!ct) return { success: false, error: `Unknown content type: ${typeSlug}` }

  const supabase = createServiceRoleSupabaseClient()
  const { data, error } = await fromTable(supabase, ct.tableName)
    .update({ published: false })
    .eq('id', id)
    .select('slug')
    .single()

  if (error) return { success: false, error: error.message }

  revalidateContentType(typeSlug, (data as Record<string, unknown>)?.slug as string | undefined)
  return { success: true }
}
