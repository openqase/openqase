import { createServiceRoleSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

export async function POST(request: Request) {
  try {
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

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }

    // Convert to CSV
    const csvRows: string[] = []

    // Header row
    csvRows.push(
      'Timestamp,Content Type,Content Name,Action,Performed By,Content ID,Metadata'
    )

    // Data rows
    for (const log of auditLogs || []) {
      const userEmail = (log as any).user_email?.email || 'Unknown'
      const contentType = log.content_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      const contentName = log.content_name || 'Untitled'
      const action = log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      const timestamp = format(new Date(log.performed_at), 'yyyy-MM-dd HH:mm:ss')

      // Escape CSV fields (handle commas and quotes)
      const escape = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      }

      // Include metadata summary (not full snapshot to keep CSV readable)
      const metadata = log.metadata as any
      const metadataSummary = metadata?.content_snapshot
        ? 'Snapshot available'
        : 'No snapshot'

      csvRows.push([
        escape(timestamp),
        escape(contentType),
        escape(contentName),
        escape(action),
        escape(userEmail),
        escape(log.content_id),
        escape(metadataSummary)
      ].join(','))
    }

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-log-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
