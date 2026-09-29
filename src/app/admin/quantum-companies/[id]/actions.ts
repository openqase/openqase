'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import type { Tables } from '@/types/supabase'

// Shape sent by src/app/admin/quantum-companies/[id]/client.tsx. founded_year
// arrives as a string ('' when empty); the CMS schema coerces it.
interface QuantumCompanyFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  company_type?: string | null
  founded_year?: number | string | null
  funding_stage?: string | null
  headquarters?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  published?: boolean
  related_case_studies?: string[]
}

export const saveQuantumCompany = withAdmin(async (values: QuantumCompanyFormData): Promise<Tables<'quantum_companies'>> => {
  const { id, related_case_studies, ...data } = values

  // Relationship keys match the relationship names in src/cms/types/<type>.ts.
  // Omitted (undefined) leaves existing links untouched; an array (even an
  // empty one) replaces them.
  const relationships = related_case_studies ? { case_studies: related_case_studies } : undefined
  if (id) {
    const result = await updateContent('quantum-companies', id, data, relationships)
    if (result.error) throw new Error(result.error)
    return result.data as Tables<'quantum_companies'>
  }
  const result = await createContent('quantum-companies', data, relationships)
  if (result.error) throw new Error(result.error)
  return result.data as Tables<'quantum_companies'>
})

export const publishQuantumCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('quantum-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishQuantumCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('quantum-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
