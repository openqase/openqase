'use server'

import { createContent, updateContent, publishContent, unpublishContent } from '@/cms/operations'

export async function saveQuantumSoftware(values: any) {
  const { id, ...data } = values
  if (id) {
    const result = await updateContent('quantum-software', id, data)
    if (result.error) throw new Error(result.error)
    return result.data
  }
  const result = await createContent('quantum-software', data)
  if (result.error) throw new Error(result.error)
  return result.data
}

export async function publishQuantumSoftware(id: string): Promise<void> {
  const result = await publishContent('quantum-software', id)
  if (!result.success) throw new Error(result.error || 'Failed to publish')
}

export async function unpublishQuantumSoftware(id: string): Promise<void> {
  const result = await unpublishContent('quantum-software', id)
  if (!result.success) throw new Error(result.error || 'Failed to unpublish')
}
