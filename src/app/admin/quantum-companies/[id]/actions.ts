'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'

export const saveQuantumCompany = withAdmin(async (values: any) => {
  const { id, ...data } = values
  if (id) {
    const result = await updateContent('quantum-companies', id, data)
    if (result.error) throw new Error(result.error)
    return result.data
  }
  const result = await createContent('quantum-companies', data)
  if (result.error) throw new Error(result.error)
  return result.data
})

export const publishQuantumCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('quantum-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishQuantumCompany = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('quantum-companies', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
