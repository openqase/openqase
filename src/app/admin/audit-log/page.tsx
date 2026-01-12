import { createServiceRoleSupabaseClient } from '@/lib/supabase'
import { AuditLogClient } from './client'

export const dynamic = 'force-dynamic'

export type AuditLogEntry = {
  id: string
  content_type: string
  content_id: string
  content_name: string | null
  action: string
  performed_by: string
  performed_at: string
  metadata: any
  created_at: string
  user_email?: string
}

export default async function AuditLogPage() {
  const supabase = await createServiceRoleSupabaseClient()

  // Fetch audit log entries with user email
  const { data: auditLogs, error } = await supabase
    .from('deletion_audit_log')
    .select(`
      *,
      user_email:performed_by (
        email
      )
    `)
    .order('performed_at', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('Error fetching audit logs:', error)
  }

  // Flatten user email into the audit log entries
  const flattenedLogs = (auditLogs || []).map((log: any) => ({
    ...log,
    user_email: log.user_email?.email || 'Unknown'
  }))

  return <AuditLogClient data={flattenedLogs} />
}
