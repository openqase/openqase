import type { ContentTypeDefinition } from '../define'
import { getContentType } from '../registry'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import type { Json } from '@/types/supabase'

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

/**
 * Postgres function that writes a content row and its junction links in one
 * transaction (migration *_atomic_content_save.sql). Service role only.
 */
export const SAVE_CONTENT_RPC = 'save_content_with_relationships'

/** One entry of the `p_relationships` argument of SAVE_CONTENT_RPC. */
export interface RelationshipPayload {
  [key: string]: Json
  name: string
  junction: string
  foreign_key: string
  target_key: string
  target_ids: string[]
  extra_fields: { [key: string]: Json }
}

/**
 * Turn the `{ relationshipName: ids[] }` map from an admin form into the
 * `p_relationships` argument for SAVE_CONTENT_RPC.
 *
 * - A key that is `undefined` (or absent) is left out, so the function leaves
 *   that relationship untouched (form didn't edit it).
 * - An empty array is passed through and clears all links.
 * - Falsy ids (e.g. '') are dropped, as before.
 *
 * The junction/column names come from the content type definition; the SQL
 * function only accepts tuples on its own allow-list, so a definition that
 * drifts from the migration fails loudly instead of writing elsewhere.
 */
export function buildRelationshipPayload(
  contentType: ContentTypeDefinition,
  relationships: Record<string, string[] | undefined> | undefined
): RelationshipPayload[] {
  if (!relationships) return []

  const payload: RelationshipPayload[] = []
  for (const rel of contentType.relationships) {
    const ids = relationships[rel.name]
    if (ids === undefined) continue

    payload.push({
      name: rel.name,
      junction: rel.junction,
      foreign_key: rel.foreignKey,
      target_key: rel.targetKey,
      target_ids: ids.filter(Boolean),
      extra_fields: (rel.extraJunctionFields ?? {}) as { [key: string]: Json },
    })
  }
  return payload
}

export interface SaveRelationshipsResult {
  error?: string
}

/**
 * Sync junction rows for each relationship present in `relationships`,
 * without touching the parent row.
 *
 * - A key that is `undefined` is left untouched (form didn't edit it).
 * - An empty array clears all links for that relationship.
 *
 * All relationships are applied in one database transaction via
 * SAVE_CONTENT_RPC (insert-diff: only removed ids are deleted, only added
 * ids are inserted). If any link fails (e.g. a target id that doesn't
 * exist), nothing is changed in any junction table and the error is
 * returned. createContent / updateContent call the same function with the
 * row data so the row and its links are saved together.
 */
export async function saveRelationships(
  contentType: ContentTypeDefinition,
  contentId: string,
  relationships: Record<string, string[]>
): Promise<SaveRelationshipsResult> {
  const payload = buildRelationshipPayload(contentType, relationships)
  if (payload.length === 0) return {}

  const supabase = createServiceRoleSupabaseClient()
  const { error } = await supabase.rpc(SAVE_CONTENT_RPC, {
    p_table: contentType.tableName,
    p_id: contentId,
    p_relationships: payload,
  })

  if (error) {
    return { error: `Relationship update failed — ${error.message}` }
  }
  return {}
}
