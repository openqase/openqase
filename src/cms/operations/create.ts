import { getContentType } from '../registry'
import { generateZodSchema } from '../schema'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/supabase-untyped'
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

  if (relationships && record.id) {
    await saveRelationships(ct, record.id as string, relationships)
  }

  revalidateContentType(typeSlug, record.slug as string | undefined)
  return { data: record }
}
