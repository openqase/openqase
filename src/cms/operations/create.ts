import { getContentType } from '../registry'
import { generateZodSchema } from '../schema'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'
import { saveRelationships } from './relationships'
import { revalidateContentType } from './revalidate'

interface CreateResult {
  data?: Record<string, unknown>
  error?: string
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

  const supabase = createServiceRoleSupabaseClient()
  const { data: result, error } = await fromTable(supabase, ct.tableName)
    .insert(parsed.data)
    .select()
    .single()

  if (error) return { error: error.message }

  const record = result as Record<string, unknown>

  let relError: string | undefined
  if (relationships && record.id) {
    relError = (await saveRelationships(ct, record.id as string, relationships)).error
  }

  revalidateContentType(typeSlug, record.slug as string | undefined)
  // The row itself was created, so return it alongside any relationship
  // error — callers check `error` first and surface it to the editor.
  return relError ? { data: record, error: relError } : { data: record }
}
