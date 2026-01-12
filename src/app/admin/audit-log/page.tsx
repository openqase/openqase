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

  // Fetch audit log entries
  const { data: auditLogs, error } = await supabase
    .from('deletion_audit_log')
    .select('*')
    .order('performed_at', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('Error fetching audit logs:', error)
  }

  // Fetch user emails for performed_by users
  const userIds = [...new Set(auditLogs?.map(log => log.performed_by).filter(Boolean) || [])]
  const userEmails: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: users } = await supabase.auth.admin.listUsers()
    users?.users.forEach(user => {
      if (user.id) {
        userEmails[user.id] = user.email || 'Unknown'
      }
    })
  }

  // Add user_email to each log entry
  const logsWithEmails = (auditLogs || []).map(log => ({
    ...log,
    user_email: log.performed_by ? (userEmails[log.performed_by] || 'Unknown') : 'Unknown'
  }))

  return <AuditLogClient data={logsWithEmails} />
}
