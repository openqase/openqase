import { notFound } from 'next/navigation'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { fromTable } from '@/lib/supabase-untyped'
import { getContentType } from '@/cms/registry'
import { TrashClient, type TrashItem } from './TrashClient'

/**
 * Shared server component for the per-type admin trash pages
 * (/admin/<type>/trash). Fetches soft-deleted rows for the given CMS content
 * type with the service-role client (admin access is enforced by the proxy
 * for /admin/*, same as the other admin listing pages) and hands them to the
 * shared TrashClient, which calls POST /api/<type>/restore and
 * POST /api/<type>/permanent-delete.
 */
export async function AdminTrashPage({ typeSlug }: { typeSlug: string }) {
  const ct = getContentType(typeSlug)
  if (!ct) notFound()

  const titleField = ct.metadata.titleField
  let items: TrashItem[] = []
  let errorMessage: string | null = null

  try {
    const supabase = createServiceRoleSupabaseClient()

    const { data: deletedItems, error } = await fromTable(supabase, ct.tableName)
      .select(`id, ${titleField}, deleted_at, deleted_by`)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error(`Error fetching deleted ${ct.label.plural}:`, error)
      errorMessage = `Error loading trash: ${error.message}`
    } else {
      const rows = (deletedItems ?? []) as Array<Record<string, string | null>>

      // Resolve deleted_by user ids to emails
      const userIds = new Set(rows.map(row => row.deleted_by).filter(Boolean))
      const userEmails: Record<string, string> = {}
      if (userIds.size > 0) {
        const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        users?.users.forEach(user => {
          if (user.id) userEmails[user.id] = user.email || 'Unknown'
        })
      }

      items = rows.map(row => ({
        id: row.id as string,
        title: row[titleField] || '(untitled)',
        deleted_at: row.deleted_at,
        deleted_by_email: row.deleted_by ? (userEmails[row.deleted_by] || 'Unknown') : 'Unknown',
      }))
    }
  } catch (err) {
    console.error('Unexpected error in AdminTrashPage:', err)
    errorMessage = 'Unexpected error loading trash'
  }

  if (errorMessage) return <div>{errorMessage}</div>

  return (
    <TrashClient
      data={items}
      label={ct.label}
      adminPath={ct.adminPath}
      apiBase={`/api/${ct.slug}`}
    />
  )
}
