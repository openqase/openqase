'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'
import { withAdmin } from '@/lib/auth'

export const saveQuantumHardware = withAdmin(async (values: any) => {
  const { id, ...data } = values
  if (id) {
    const result = await updateContent('quantum-hardware', id, data)
    if (result.error) throw new Error(result.error)
    return result.data
  }
  const result = await createContent('quantum-hardware', data)
  if (result.error) throw new Error(result.error)
  return result.data
})

export const publishQuantumHardware = withAdmin(async (id: string): Promise<void> => {
  const result = await publishContent('quantum-hardware', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
})

export const unpublishQuantumHardware = withAdmin(async (id: string): Promise<void> => {
  const result = await unpublishContent('quantum-hardware', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
})
