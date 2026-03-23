import type { ContentTypeDefinition } from './define'
import { industries } from './types/industries'
import { personas } from './types/personas'

// Add content types here as they are migrated
const contentTypes: ContentTypeDefinition[] = [
  industries,
  personas,
]

const bySlug = new Map(contentTypes.map(ct => [ct.slug, ct]))
const byTable = new Map(contentTypes.map(ct => [ct.tableName, ct]))

export function getContentType(slug: string): ContentTypeDefinition | undefined {
  return bySlug.get(slug)
}

export function getAllContentTypes(): ContentTypeDefinition[] {
  return contentTypes
}

export function getContentTypeByTableName(tableName: string): ContentTypeDefinition | undefined {
  return byTable.get(tableName)
}
