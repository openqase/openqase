'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'

export async function savePartnerCompany(values: any) {
  const { id, ...data } = values
  if (id) {
    const result = await updateContent('partner-companies', id, data)
    if (result.error) throw new Error(result.error)
    return result.data
  }
  const result = await createContent('partner-companies', data)
  if (result.error) throw new Error(result.error)
  return result.data
}

export async function publishPartnerCompany(id: string): Promise<void> {
  const result = await publishContent('partner-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
}

export async function unpublishPartnerCompany(id: string): Promise<void> {
  const result = await unpublishContent('partner-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
}
