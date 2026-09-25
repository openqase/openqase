'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import type { Tables } from '@/types/supabase'

// Shape sent by src/app/admin/quantum-software/[id]/client.tsx.
interface QuantumSoftwareFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  vendor?: string | null
  website_url?: string | null
  documentation_url?: string | null
  github_url?: string | null
  license_type?: string | null
  pricing_model?: string | null
  published?: boolean
  related_case_studies?: string[]
}

export const saveQuantumSoftware = withAdmin(async (values: QuantumSoftwareFormData): Promise<Tables<'quantum_software'>> => {
  const { id, related_case_studies, ...data } = values

  // Relationship keys match the relationship names in src/cms/types/<type>.ts.
  // Omitted (undefined) leaves existing links untouched; an array (even an
  // empty one) replaces them.
  const relationships = related_case_studies ? { case_studies: related_case_studies } : undefined
  if (id) {
    const result = await updateContent('quantum-software', id, data, relationships)
    if (result.error) throw new Error(result.error)
    return result.data as Tables<'quantum_software'>
  }
  const result = await createContent('quantum-software', data, relationships)
  if (result.error) throw new Error(result.error)
  return result.data as Tables<'quantum_software'>
})

export const publishQuantumSoftware = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('quantum-software', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishQuantumSoftware = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('quantum-software', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
