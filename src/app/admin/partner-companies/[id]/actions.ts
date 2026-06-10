'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'

export const savePartnerCompany = withAdmin(async (values: any) => {
  const { id, ...data } = values
  if (id) {
    const result = await updateContent('partner-companies', id, data)
    if (result.error) throw new Error(result.error)
    return result.data
  }
  const result = await createContent('partner-companies', data)
  if (result.error) throw new Error(result.error)
  return result.data
})

export const publishPartnerCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('partner-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishPartnerCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('partner-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
