import { getContentType } from '../registry'
import { generateZodSchema } from '../schema'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Json } from '@/types/supabase'
import { buildRelationshipPayload, SAVE_CONTENT_RPC } from './relationships'
import { revalidateContentType } from './revalidate'

interface CreateResult {
  data?: Record<string, unknown>
  /** Set when nothing was written (neither the row nor any link). */
  error?: string
  /**
   * Kept for callers that surface it. createContent no longer sets it: the
   * row and its links are written in one transaction, so a relationship
   * failure rolls back the row too and is reported as `error`.
   */
  warning?: string
}

export async function createContent(
  typeSlug: string,
  data: Record<string, unknown>,
  relationships?: Record<string, string[]>
): Promise<CreateResult> {
  const ct = getContentType(typeSlug)
  if (!ct) return { error: `Unknown content type: ${typeSlug}` }

  const schema = generateZodSchema(ct)
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join('; ') }
  }

  // Row + junction links in one transaction (all or nothing): a failed link
  // never leaves a half-saved item behind. On `error` nothing exists, so the
  // editor can retry without creating a duplicate row.
  const supabase = createServiceRoleSupabaseClient()
  const { data: result, error } = await supabase.rpc(SAVE_CONTENT_RPC, {
    p_table: ct.tableName,
    p_data: parsed.data as Json,
    p_relationships: buildRelationshipPayload(ct, relationships),
  })

  if (error) return { error: error.message }

  const record = result as Record<string, unknown>
  revalidateContentType(typeSlug, record.slug as string | undefined)
  return { data: record }
}
