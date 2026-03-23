import { getContentType } from '../registry'
import { generateZodSchema } from '../schema'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { saveRelationships } from './relationships'
import { revalidateContentType } from './revalidate'

interface UpdateResult {
  data?: Record<string, unknown>
  error?: string
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
  const { data: result, error } = await supabase
    .from(ct.tableName)
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  const record = result as Record<string, unknown>

  if (relationships) {
    await saveRelationships(ct, id, relationships)
  }

  revalidateContentType(typeSlug, record.slug as string | undefined)
  return { data: record }
}
