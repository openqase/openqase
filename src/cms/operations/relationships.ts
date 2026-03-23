import type { ContentTypeDefinition } from '../define'
import { getContentType } from '../registry'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/supabase-untyped'

export function buildRelationshipSelect(contentType: ContentTypeDefinition): string {
  if (contentType.relationships.length === 0) return '*'

  const joins = contentType.relationships.map(rel => {
    const targetType = getContentType(rel.targetType)
    const targetTable = targetType?.tableName ?? rel.targetType.replace(/-/g, '_')

    const defaultTitleField = targetTable === 'case_studies' || targetTable === 'blog_posts' ? 'title' : 'name'
    const fields = rel.selectFields?.join(', ') ?? `id, ${defaultTitleField}, slug`

    // Handle self-referential joins needing PostgREST FK disambiguation
    if (rel.junctionForeignKeyHint) {
      const junctionRef = `${rel.junction}!${rel.junctionForeignKeyHint}`
      const targetRef = rel.targetForeignKeyHint
        ? `${targetTable}!${rel.targetForeignKeyHint}`
        : targetTable
      return `${junctionRef}(${rel.targetKey}, ${targetRef}(${fields}))`
    }

    return `${rel.junction}(${targetTable}(${fields}))`
  })

  return `*, ${joins.join(', ')}`
}

export function flattenRelationships(
  raw: Record<string, unknown>,
  contentType: ContentTypeDefinition
): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {}

  for (const rel of contentType.relationships) {
    const targetType = getContentType(rel.targetType)
    const targetTable = targetType?.tableName ?? rel.targetType.replace(/-/g, '_')
    const junctionData = raw[rel.junction] as Array<Record<string, unknown>> | undefined

    if (!junctionData || !Array.isArray(junctionData)) {
      result[rel.name] = []
      continue
    }

    result[rel.name] = junctionData
      .map(row => row[targetTable] as Record<string, unknown>)
      .filter(Boolean)
  }

  return result
}

export async function saveRelationships(
  contentType: ContentTypeDefinition,
  contentId: string,
  relationships: Record<string, string[]>
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient()

  for (const rel of contentType.relationships) {
    const ids = relationships[rel.name]
    if (ids === undefined) continue

    // Delete existing
    await fromTable(supabase, rel.junction)
      .delete()
      .eq(rel.foreignKey, contentId)

    // Insert new
    if (ids.length > 0) {
      const rows = ids.map(targetId => ({
        [rel.foreignKey]: contentId,
        [rel.targetKey]: targetId,
        ...(rel.extraJunctionFields ?? {}),
      }))
      await fromTable(supabase, rel.junction).insert(rows)
    }
  }
}
