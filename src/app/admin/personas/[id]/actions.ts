'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'

interface PersonaFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  recommended_reading?: string | null
  published?: boolean
  industry?: string[]  // relationship IDs sent from admin form
}

export async function savePersona(values: PersonaFormData) {
  const { id, industry, ...data } = values
  const relationships = industry ? { industries: industry } : undefined

  if (id) {
    const result = await updateContent('personas', id, data, relationships)
    if (result.error) throw new Error(result.error)
    return result.data
  }

  const result = await createContent('personas', data, relationships)
  if (result.error) throw new Error(result.error)
  return result.data
}

export async function publishPersona(id: string): Promise<void> {
  const result = await publishContent('personas', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
}

export async function unpublishPersona(id: string): Promise<void> {
  const result = await unpublishContent('personas', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
}
