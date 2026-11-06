import { getContentType } from '../registry'
import { generateZodSchema } from '../schema'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'
import type { Json } from '@/types/supabase'
import { buildRelationshipPayload, SAVE_CONTENT_RPC } from './relationships'
import { revalidateContentType } from './revalidate'

interface UpdateResult {
  data?: Record<string, unknown>
  /** Set when nothing was written (neither the row nor any link). */
  error?: string
  /**
   * Kept for callers that surface it. updateContent no longer sets it: the
   * row and its links are written in one transaction, so a relationship
   * failure rolls back the row change too and is reported as `error`.
   */
  warning?: string
}

export async function updateContent(
  typeSlug: string,
  id: string,
  data: Record<string, unknown>,
  relationships?: Record<string, string[]>
): Promise<UpdateResult> {
  const ct = getContentType(typeSlug)
  if (!ct) return { error: `Unknown content type: ${typeSlug}` }

  const schema = generateZodSchema(ct)
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join('; ') }
  }

  const supabase = createServiceRoleSupabaseClient()

  // If the slug is changing, the page at the old slug must be revalidated
  // too, otherwise it keeps serving the renamed content for up to 24h (ISR).
  let previousSlug: string | undefined
  if (typeof (parsed.data as Record<string, unknown>).slug === 'string') {
    const { data: current } = await fromTable(supabase, ct.tableName)
      .select('slug')
      .eq('id', id)
      .maybeSingle()
    previousSlug = (current as { slug?: string } | null)?.slug
  }

  // Row + junction links in one transaction (all or nothing): if any link
  // fails, the row and every link stay as they were and `error` is set.
  const { data: result, error } = await supabase.rpc(SAVE_CONTENT_RPC, {
    p_table: ct.tableName,
    p_id: id,
    p_data: parsed.data as Json,
    p_relationships: buildRelationshipPayload(ct, relationships),
  })

  if (error) return { error: error.message }

  const record = result as Record<string, unknown>

  const newSlug = record.slug as string | undefined
  const slugs =
    previousSlug && previousSlug !== newSlug
      ? [newSlug, previousSlug].filter((s): s is string => typeof s === 'string')
      : newSlug
  revalidateContentType(typeSlug, slugs)
  return { data: record }
}
