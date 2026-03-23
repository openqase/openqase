'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import type { TablesInsert } from '@/types/supabase'

interface AlgorithmFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  use_cases?: string | null
  steps?: string | null
  academic_references?: string | null
  quantum_advantage?: string | null
  published?: boolean
  related_case_studies?: string[]
  related_industries?: string[]
  related_personas?: string[]
}

export async function saveAlgorithm(values: AlgorithmFormData): Promise<TablesInsert<'algorithms'>> {
  const { id, related_case_studies, related_industries, related_personas, ...data } = values

  const relationships = {
    ...(related_industries ? { industries: related_industries } : {}),
    ...(related_case_studies ? { case_studies: related_case_studies } : {}),
    ...(related_personas ? { personas: related_personas } : {}),
  }

  if (id) {
    const result = await updateContent('algorithms', id, data, relationships)
    if (result.error) throw new Error(result.error)
    return result.data as TablesInsert<'algorithms'>
  }

  const result = await createContent('algorithms', data, relationships)
  if (result.error) throw new Error(result.error)
  return result.data as TablesInsert<'algorithms'>
}

export async function publishAlgorithm(id: string): Promise<void> {
  const result = await publishContent('algorithms', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
}

export async function unpublishAlgorithm(id: string): Promise<void> {
  const result = await unpublishContent('algorithms', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
}
