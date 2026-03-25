'use server'

import { getContentType } from './registry'
import { parseFormData } from './parse-form-data'
import { createContent, updateContent, publishContent, unpublishContent, deleteContent } from './operations'

export async function saveContentAction(type: string, formData: FormData) {
  const contentType = getContentType(type)
  if (!contentType) return { error: `Unknown content type: ${type}` }

  const { data, relationships } = parseFormData(formData, contentType)
  const id = formData.get('id') as string | null

  if (id) {
    return updateContent(type, id, data, relationships)
  }
  return createContent(type, data, relationships)
}

export async function publishAction(type: string, id: string) {
  return publishContent(type, id)
}

export async function unpublishAction(type: string, id: string) {
  return unpublishContent(type, id)
}

export async function deleteAction(type: string, id: string) {
  return deleteContent(type, id)
}
