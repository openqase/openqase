'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import type { Tables } from '@/types/supabase'

// Shape sent by src/app/admin/partner-companies/[id]/client.tsx.
interface PartnerCompanyFormData {
  id?: string
  name: string
  slug: string
  description?: string | null
  main_content?: string | null
  industry?: string | null
  company_size?: string | null
  headquarters?: string | null
  partnership_type?: string | null
  quantum_initiatives?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  published?: boolean
  related_case_studies?: string[]
}

export const savePartnerCompany = withAdmin(async (values: PartnerCompanyFormData): Promise<Tables<'partner_companies'>> => {
  const { id, related_case_studies, ...data } = values

  // Relationship keys match the relationship names in src/cms/types/<type>.ts.
  // Omitted (undefined) leaves existing links untouched; an array (even an
  // empty one) replaces them.
  const relationships = related_case_studies ? { case_studies: related_case_studies } : undefined
  if (id) {
    const result = await updateContent('partner-companies', id, data, relationships)
    if (result.error) throw new Error(result.error)
    return result.data as Tables<'partner_companies'>
  }
  const result = await createContent('partner-companies', data, relationships)
  if (result.error) throw new Error(result.error)
  return result.data as Tables<'partner_companies'>
})

export const publishPartnerCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('partner-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishPartnerCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('partner-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
