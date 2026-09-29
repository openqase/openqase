import * as Sentry from '@sentry/nextjs'
import { getContentType } from '../registry'
import type { ContentTypeDefinition } from '../define'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/internal-queries'
import { revalidateContentType } from './revalidate'

// ---------------------------------------------------------------------------
// Single soft-delete / restore / permanent-delete path for ALL CMS content
// types. Every delete route (`/api/<type>/delete`, `DELETE /api/<type>`,
// bulk delete, the `deleteAction` server action and the legacy
// `deleteContentItem` helper) funnels through here so that:
//
//   1. soft delete always sets deleted_at, deleted_by and published = false
//      (public listings filter on `published`, detail pages on `deleted_at`),
//   2. the admin listing, public listing and slug page are revalidated
//      immediately instead of waiting for the 24h ISR safety net,
//   3. the 30-day trash / restore flow keeps working (nothing is hard-deleted
//      except via `permanentlyDeleteContent`, which only touches rows that
//      are already in the trash).
//
// Uses direct updates via the service-role client. The `soft_delete_content`
// / `recover_content` RPCs are intentionally NOT used.
// ---------------------------------------------------------------------------

export interface DeleteResult {
  success: boolean
  error?: string
}

export interface JunctionRef {
  junctionTable: string
  contentIdField: string
}

interface SoftDeleteOptions {
  /** auth user id of the admin performing the delete (for deleted_by + audit log) */
  deletedBy?: string | null
}

interface RestoreOptions {
  /** auth user id of the admin performing the restore (for audit log) */
  restoredBy?: string | null
}

/**
 * Junction tables that have a `deleted_at` column (see src/types/supabase.ts).
 * Only these can be soft-deleted alongside their parent; the others are left
 * untouched by soft delete (and hard-deleted by permanent delete).
 */
const JUNCTIONS_WITH_DELETED_AT = new Set([
  'case_study_partner_company_relations',
  'case_study_quantum_company_relations',
  'case_study_quantum_hardware_relations',
  'case_study_quantum_software_relations',
  'quantum_company_hardware_relations',
  'quantum_company_software_relations',
])

function junctionsFor(ct: ContentTypeDefinition): JunctionRef[] {
  const seen = new Set<string>()
  const refs: JunctionRef[] = []
  for (const rel of ct.relationships) {
    const key = `${rel.junction}:${rel.foreignKey}`
    if (seen.has(key)) continue
    seen.add(key)
    refs.push({ junctionTable: rel.junction, contentIdField: rel.foreignKey })
  }
  return refs
}

function softDeletableJunctionsFor(ct: ContentTypeDefinition): JunctionRef[] {
  return junctionsFor(ct).filter(j => JUNCTIONS_WITH_DELETED_AT.has(j.junctionTable))
}

function displayName(row: Record<string, unknown> | null): string | null {
  if (!row) return null
  return (row.title as string) || (row.name as string) || null
}

type ServiceClient = ReturnType<typeof createServiceRoleSupabaseClient>

async function writeAuditLog(
  supabase: ServiceClient,
  entry: {
    tableName: string
    id: string
    name: string | null
    action: 'soft_delete' | 'restore'
    performedBy: string
    metadata: Record<string, unknown>
  }
): Promise<void> {
  try {
    const { error } = await fromTable(supabase, 'deletion_audit_log').insert({
      content_type: entry.tableName,
      content_id: entry.id,
      content_name: entry.name,
      action: entry.action,
      performed_by: entry.performedBy,
      performed_at: new Date().toISOString(),
      metadata: entry.metadata,
    })
    if (error) throw error
  } catch (auditError) {
    // Never fail the delete/restore because audit logging failed.
    console.error(`Failed to log ${entry.action} to audit trail:`, auditError)
    Sentry.captureException(auditError, {
      tags: { operation: 'audit_log', action: entry.action, content_type: entry.tableName },
      extra: { content_id: entry.id, content_name: entry.name },
    })
  }
}

/**
 * Soft-delete a content item (moves it to the trash).
 *
 * Sets deleted_at = now(), deleted_by, published = false, soft-deletes any
 * junction rows that support it, writes an audit log entry (when the actor is
 * known) and revalidates the admin list, public list and slug page.
 *
 * Idempotent: deleting an already-trashed item succeeds without resetting
 * its deleted_at (so the 30-day retention clock is not restarted).
 */
export async function deleteContent(
  typeSlug: string,
  id: string,
  options: SoftDeleteOptions = {}
): Promise<DeleteResult> {
  const ct = getContentType(typeSlug)
  if (!ct) return { success: false, error: `Unknown content type: ${typeSlug}` }

  const deletedBy = options.deletedBy ?? null
  const supabase = createServiceRoleSupabaseClient()

  // Fetch the row first: we need the slug for revalidation and the snapshot
  // for the audit log.
  const { data: existing, error: fetchError } = await fromTable(supabase, ct.tableName)
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return { success: false, error: fetchError.message }
  if (!existing) return { success: false, error: `${ct.label.singular} not found` }

  const snapshot = existing as Record<string, unknown>
  const now = new Date().toISOString()

  // Soft delete junction rows (non-critical — log and continue on error).
  const junctions = softDeletableJunctionsFor(ct)
  for (const { junctionTable, contentIdField } of junctions) {
    const { error: relError } = await fromTable(supabase, junctionTable)
      .update({ deleted_at: now })
      .eq(contentIdField, id)
      .is('deleted_at', null)
    if (relError) {
      console.error(`Error soft deleting relationships in ${junctionTable}:`, relError)
    }
  }

  const { error: deleteError } = await fromTable(supabase, ct.tableName)
    .update({ deleted_at: now, deleted_by: deletedBy, published: false })
    .eq('id', id)
    .is('deleted_at', null) // don't restart the retention clock on re-delete

  if (deleteError) return { success: false, error: deleteError.message }

  if (deletedBy) {
    await writeAuditLog(supabase, {
      tableName: ct.tableName,
      id,
      name: displayName(snapshot),
      action: 'soft_delete',
      performedBy: deletedBy,
      metadata: { content_snapshot: snapshot, relationship_configs: junctions.length },
    })
  }

  revalidateContentType(typeSlug, snapshot.slug as string | undefined)
  return { success: true }
}

/**
 * Soft-delete several items. Returns the ids that failed (empty = all ok).
 */
export async function deleteContentMany(
  typeSlug: string,
  ids: string[],
  options: SoftDeleteOptions = {}
): Promise<{ failed: string[]; errors: Array<{ id: string; error: string }> }> {
  const failed: string[] = []
  const errors: Array<{ id: string; error: string }> = []
  for (const id of ids) {
    const result = await deleteContent(typeSlug, id, options)
    if (!result.success) {
      failed.push(id)
      errors.push({ id, error: result.error ?? 'Unknown error' })
    }
  }
  return { failed, errors }
}

/**
 * Restore a soft-deleted item from the trash.
 *
 * Clears deleted_at / deleted_by and keeps published = false (restored
 * content always comes back as a draft), restores junction rows, writes an
 * audit log entry and revalidates.
 */
export async function restoreContent(
  typeSlug: string,
  id: string,
  options: RestoreOptions = {}
): Promise<DeleteResult & { data?: Record<string, unknown> }> {
  const ct = getContentType(typeSlug)
  if (!ct) return { success: false, error: `Unknown content type: ${typeSlug}` }

  const supabase = createServiceRoleSupabaseClient()

  const { data, error } = await fromTable(supabase, ct.tableName)
    .update({ deleted_at: null, deleted_by: null, published: false })
    .eq('id', id)
    // Only rows actually in the trash — never unpublish live content.
    .not('deleted_at', 'is', null)
    .select()
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: `${ct.label.singular} not found in trash` }

  const record = data as Record<string, unknown>

  const junctions = softDeletableJunctionsFor(ct)
  for (const { junctionTable, contentIdField } of junctions) {
    const { error: relError } = await fromTable(supabase, junctionTable)
      .update({ deleted_at: null })
      .eq(contentIdField, id)
    if (relError) {
      console.error(`Error recovering relationships in ${junctionTable}:`, relError)
    }
  }

  if (options.restoredBy) {
    await writeAuditLog(supabase, {
      tableName: ct.tableName,
      id,
      name: displayName(record),
      action: 'restore',
      performedBy: options.restoredBy,
      metadata: { relationship_configs: junctions.length },
    })
  }

  revalidateContentType(typeSlug, record.slug as string | undefined)
  return { success: true, data: record }
}

/**
 * Permanently delete items that are ALREADY in the trash (deleted_at set).
 * Items that are not soft-deleted are ignored, so this can never be used to
 * bypass the trash. Removes junction rows first (registry junctions plus any
 * `extraJunctions`), then the rows themselves, then revalidates.
 */
export async function permanentlyDeleteContent(
  typeSlug: string,
  ids: string[],
  extraJunctions: JunctionRef[] = []
): Promise<DeleteResult & { deleted: number }> {
  const ct = getContentType(typeSlug)
  if (!ct) return { success: false, error: `Unknown content type: ${typeSlug}`, deleted: 0 }
  if (ids.length === 0) return { success: true, deleted: 0 }

  const supabase = createServiceRoleSupabaseClient()

  const { data: trashed, error: fetchError } = await fromTable(supabase, ct.tableName)
    .select('id, slug')
    .in('id', ids)
    .not('deleted_at', 'is', null)

  if (fetchError) return { success: false, error: fetchError.message, deleted: 0 }

  const rows = (trashed ?? []) as Array<{ id: string; slug?: string | null }>
  const trashedIds = rows.map(r => r.id)
  if (trashedIds.length === 0) return { success: true, deleted: 0 }

  const junctions = [...junctionsFor(ct), ...extraJunctions]
  await Promise.all(
    junctions.map(async ({ junctionTable, contentIdField }) => {
      const { error } = await fromTable(supabase, junctionTable)
        .delete()
        .in(contentIdField, trashedIds)
      if (error) console.warn(`Error deleting from ${junctionTable}:`, error)
    })
  )

  const { error: deleteError } = await fromTable(supabase, ct.tableName)
    .delete()
    .in('id', trashedIds)
    .not('deleted_at', 'is', null)

  if (deleteError) return { success: false, error: deleteError.message, deleted: 0 }

  revalidateContentType(
    typeSlug,
    rows.map(r => r.slug).filter((s): s is string => !!s)
  )

  return { success: true, deleted: trashedIds.length }
}
