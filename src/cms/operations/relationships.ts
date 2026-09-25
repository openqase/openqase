import type { ContentTypeDefinition } from '../define'
import { getContentType } from '../registry'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'

/**
 * Visibility columns always selected on the related (target) entity so that
 * flattenRelationships() can drop draft / soft-deleted related rows. Every
 * CMS content table has both columns (see src/types/supabase.ts).
 */
const VISIBILITY_FIELDS = ['published', 'deleted_at'] as const

export function buildRelationshipSelect(contentType: ContentTypeDefinition): string {
  if (contentType.relationships.length === 0) return '*'

  const joins = contentType.relationships.map(rel => {
    const targetType = getContentType(rel.targetType)
    const targetTable = targetType?.tableName ?? rel.targetType.replace(/-/g, '_')

    const defaultTitleField = targetTable === 'case_studies' || targetTable === 'blog_posts' ? 'title' : 'name'
    const baseFields = rel.selectFields ?? ['id', defaultTitleField, 'slug']
    const fields = [
      ...baseFields,
      ...VISIBILITY_FIELDS.filter(f => !baseFields.includes(f)),
    ].join(', ')

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

export interface FlattenOptions {
  /**
   * Drop related rows that are drafts or soft-deleted. Use for public
   * fetches (the service-role client bypasses RLS, so the nested join
   * returns drafts too). Preview fetches leave this off so editors see
   * draft relations.
   */
  publishedOnly?: boolean
}

/**
 * A related row is hidden from public pages when it is explicitly
 * unpublished (`published === false`) or soft-deleted (`deleted_at` set).
 *
 * `published` is nullable in the DB. CLAUDE.md notes relationship published
 * filtering was historically disabled "due to inconsistent data", so we only
 * drop an explicit `false` and keep `null` (legacy rows) rather than risk
 * silently emptying relationship lists. Rows whose `published` key is absent
 * (e.g. a select that didn't include it) are also kept.
 */
function isPubliclyVisible(row: Record<string, unknown>): boolean {
  if (row.published === false) return false
  if (row.deleted_at !== null && row.deleted_at !== undefined) return false
  return true
}

export function flattenRelationships(
  raw: Record<string, unknown>,
  contentType: ContentTypeDefinition,
  options: FlattenOptions = {}
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

    const rows = junctionData
      .map(row => row[targetTable] as Record<string, unknown>)
      .filter(Boolean)

    result[rel.name] = options.publishedOnly ? rows.filter(isPubliclyVisible) : rows
  }

  return result
}

export interface SaveRelationshipsResult {
  error?: string
}

/**
 * Sync junction rows for each relationship present in `relationships`.
 *
 * - A key that is `undefined` is left untouched (form didn't edit it).
 * - An empty array clears all links for that relationship.
 *
 * Uses an insert-diff: reads the current target ids, deletes only removed
 * ids and inserts only added ids. This avoids the window where all links
 * are gone, and a failed insert no longer wipes unchanged links.
 *
 * Errors are collected (other relationships are still attempted) and
 * returned as a single message. The parent row is already saved at this
 * point, so callers should surface the error to the editor.
 */
export async function saveRelationships(
  contentType: ContentTypeDefinition,
  contentId: string,
  relationships: Record<string, string[]>
): Promise<SaveRelationshipsResult> {
  const supabase = createServiceRoleSupabaseClient()
  const errors: string[] = []

  for (const rel of contentType.relationships) {
    const ids = relationships[rel.name]
    if (ids === undefined) continue

    const desired = new Set(ids.filter(Boolean))

    // Read current links
    const { data: existingRows, error: selectError } = await fromTable(supabase, rel.junction)
      .select(rel.targetKey)
      .eq(rel.foreignKey, contentId)

    if (selectError) {
      errors.push(`${rel.name}: failed to read existing links (${selectError.message}); links not changed`)
      continue
    }

    const existing = new Set(
      ((existingRows ?? []) as Record<string, unknown>[])
        .map(row => row[rel.targetKey])
        .filter((v): v is string => typeof v === 'string')
    )

    const toDelete = [...existing].filter(id => !desired.has(id))
    const toInsert = [...desired].filter(id => !existing.has(id))

    if (toDelete.length > 0) {
      const { error: deleteError } = await fromTable(supabase, rel.junction)
        .delete()
        .eq(rel.foreignKey, contentId)
        .in(rel.targetKey, toDelete)

      if (deleteError) {
        errors.push(`${rel.name}: failed to remove links (${deleteError.message}); links not changed`)
        continue
      }
    }

    if (toInsert.length > 0) {
      const rows = toInsert.map(targetId => ({
        [rel.foreignKey]: contentId,
        [rel.targetKey]: targetId,
        ...(rel.extraJunctionFields ?? {}),
      }))
      const { error: insertError } = await fromTable(supabase, rel.junction).insert(rows)

      if (insertError) {
        errors.push(
          toDelete.length > 0
            ? `${rel.name}: removed links were deleted but adding new links failed (${insertError.message})`
            : `${rel.name}: failed to add links (${insertError.message})`
        )
      }
    }
  }

  if (errors.length > 0) {
    return { error: `Saved, but relationship update failed — ${errors.join('; ')}` }
  }
  return {}
}
