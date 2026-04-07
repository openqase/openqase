import type { ContentTypeDefinition } from './define'
import { industries } from './types/industries'
import { personas } from './types/personas'
import { blogPosts } from './types/blog-posts'
import { quantumSoftware } from './types/quantum-software'
import { quantumHardware } from './types/quantum-hardware'
import { quantumCompanies } from './types/quantum-companies'
import { partnerCompanies } from './types/partner-companies'
import { algorithms } from './types/algorithms'
import { caseStudies } from './types/case-studies'

// Add content types here as they are migrated
const contentTypes: ContentTypeDefinition[] = [
  industries,
  personas,
  blogPosts,
  quantumSoftware,
  quantumHardware,
  quantumCompanies,
  partnerCompanies,
  algorithms,
  caseStudies,
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
