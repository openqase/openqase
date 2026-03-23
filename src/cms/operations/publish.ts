import { getContentType } from '../registry'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { revalidateContentType } from './revalidate'

interface PublishResult {
  success: boolean
  error?: string
}

export async function publishContent(typeSlug: string, id: string): Promise<PublishResult> {
  const ct = getContentType(typeSlug)
  if (!ct) return { success: false, error: `Unknown content type: ${typeSlug}` }

  const supabase = createServiceRoleSupabaseClient()
  const { data, error } = await supabase
    .from(ct.tableName)
    .update({ published: true })
    .eq('id', id)
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
  const { data, error } = await supabase
    .from(ct.tableName)
    .update({ published: false })
    .eq('id', id)
    .select('slug')
    .single()

  if (error) return { success: false, error: error.message }

  revalidateContentType(typeSlug, (data as Record<string, unknown>)?.slug as string | undefined)
  return { success: true }
}
