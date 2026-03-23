import { getContentType } from '../registry'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { revalidateContentType } from './revalidate'

interface DeleteResult {
  success: boolean
  error?: string
}

export async function deleteContent(typeSlug: string, id: string): Promise<DeleteResult> {
  const ct = getContentType(typeSlug)
  if (!ct) return { success: false, error: `Unknown content type: ${typeSlug}` }

  const supabase = createServiceRoleSupabaseClient()
  const { error } = await supabase
    .from(ct.tableName)
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidateContentType(typeSlug)
  return { success: true }
}
