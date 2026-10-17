'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'
import { runAction, toActionResult, toSaveResult, type ActionResult, type SaveActionResult } from '@/lib/admin-action-result'
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

export const savePartnerCompany = withAdmin(async (values: PartnerCompanyFormData): Promise<SaveActionResult<Tables<'partner_companies'>>> =>
  runAction('Failed to save partner company', async () => {
    const { id, related_case_studies, ...data } = values

    // Relationship keys match the relationship names in src/cms/types/<type>.ts.
    // Omitted (undefined) leaves existing links untouched; an array (even an
    // empty one) replaces them.
    const relationships = related_case_studies ? { case_studies: related_case_studies } : undefined
    const result = id
      ? await updateContent('partner-companies', id, data, relationships)
      : await createContent('partner-companies', data, relationships)
    return toSaveResult<Tables<'partner_companies'>>(result)
  })
)

export const publishPartnerCompany = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to publish', async () => toActionResult(await publishContent('partner-companies', id), 'Failed to publish'))
)

export const unpublishPartnerCompany = withAdmin(async (id: string): Promise<ActionResult> =>
  runAction('Failed to unpublish', async () => toActionResult(await unpublishContent('partner-companies', id), 'Failed to unpublish'))
)
