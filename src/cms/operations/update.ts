import { getContentType } from '../registry'
import { generateZodSchema } from '../schema'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'
import { saveRelationships } from './relationships'
import { revalidateContentType } from './revalidate'

interface UpdateResult {
  data?: Record<string, unknown>
  /** Set only when the row itself was not written. */
  error?: string
  /** Set when the row was written but one or more relationship links failed. */
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
  const { data: result, error } = await fromTable(supabase, ct.tableName)
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  const record = result as Record<string, unknown>

  let relError: string | undefined
  if (relationships) {
    relError = (await saveRelationships(ct, id, relationships)).error
  }

  revalidateContentType(typeSlug, record.slug as string | undefined)
  // The row exists regardless of the relationship outcome, so never report
  // a relationship failure as `error`: callers treat `error` as "nothing was
  // saved" and would make the editor retry, creating a duplicate row.
  return relError ? { data: record, warning: relError } : { data: record }
}
