'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import type { TablesInsert } from '@/types/supabase'

interface IndustryFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  published?: boolean
}

export const saveIndustry = withAdmin(async (values: IndustryFormData): Promise<TablesInsert<'industries'>> => {
  const { id, ...data } = values

  if (id) {
    const result = await updateContent('industries', id, data)
    if (result.error) throw new Error(result.error)
    return result.data as TablesInsert<'industries'>
  }

  const result = await createContent('industries', data)
  if (result.error) throw new Error(result.error)
  return result.data as TablesInsert<'industries'>
})

export const publishIndustry = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('industries', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishIndustry = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('industries', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
