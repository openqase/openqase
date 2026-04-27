'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'

export const saveQuantumSoftware = withAdmin(async (values: any) => {
  const { id, ...data } = values
  if (id) {
    const result = await updateContent('quantum-software', id, data)
    if (result.error) throw new Error(result.error)
    return result.data
  }
  const result = await createContent('quantum-software', data)
  if (result.error) throw new Error(result.error)
  return result.data
})

export const publishQuantumSoftware = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('quantum-software', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishQuantumSoftware = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('quantum-software', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
