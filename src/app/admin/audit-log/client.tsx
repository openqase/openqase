'use client'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import type { AuditLogEntry } from './page'
import { useState, useMemo } from 'react'
import { AdminListFilters } from '@/components/admin/AdminListFilters'
import { Download, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface AuditLogClientProps {
  data: AuditLogEntry[]
}

export function AuditLogClient({ data }: AuditLogClientProps) {
  const [auditLogs] = useState<AuditLogEntry[]>(data)
  const [searchQuery, setSearchQuery] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [isExporting, setIsExporting] = useState(false)

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          (log.content_name || '').toLowerCase().includes(query) ||
          (log.user_email || '').toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Content type filter
      if (contentTypeFilter !== 'all') {
        if (log.content_type !== contentTypeFilter) return false
      }

      // Action filter
      if (actionFilter !== 'all') {
        if (log.action !== actionFilter) return false
      }

      return true
    })
  }, [auditLogs, searchQuery, contentTypeFilter, actionFilter])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/audit-log/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {} // We'll add filter support later
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to export audit log')
        alert('Failed to export audit log')
      }
    } catch (error) {
      console.error('Error exporting audit log:', error)
      alert('Error exporting audit log')
    } finally {
      setIsExporting(false)
    }
  }

  // Get unique content types for filter
  const contentTypes = useMemo(() => {
    const types = new Set(auditLogs.map(log => log.content_type))
    return [
      { value: 'all', label: 'All Types' },
      ...Array.from(types).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    ]
  }, [auditLogs])

  // Get unique actions for filter
  const actions = useMemo(() => {
    const acts = new Set(auditLogs.map(log => log.action))
    return [
      { value: 'all', label: 'All Actions' },
      ...Array.from(acts).map(action => ({
        value: action,
        label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    ]
  }, [auditLogs])

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'performed_at',
      header: 'Date & Time',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.performed_at), 'MMM d, yyyy h:mm a')}
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.original.action === 'soft_delete'
            ? 'bg-red-100 text-red-800'
            : row.original.action === 'restore'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.action === 'soft_delete' ? 'Deleted' :
           row.original.action === 'restore' ? 'Restored' :
           row.original.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ),
    },
    {
      accessorKey: 'content_type',
      header: 'Content Type',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.content_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
      ),
    },
    {
      accessorKey: 'content_name',
      header: 'Content Name',
      cell: ({ row }) => (
        <div className="text-sm font-medium max-w-xs truncate">
          {row.original.content_name || <span className="text-muted-foreground italic">Untitled</span>}
        </div>
      ),
    },
    {
      accessorKey: 'user_email',
      header: 'Performed By',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.user_email}
        </div>
      ),
    },
    {
      id: 'snapshot',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          {row.original.metadata?.content_snapshot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Show snapshot in a modal or console for now
                console.log('Content snapshot:', row.original.metadata.content_snapshot)
                alert('Content snapshot logged to console. Modal view coming soon!')
              }}
              title="View content snapshot"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all content deletion and restoration actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={isExporting} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      <AdminListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by content name or user..."
        filters={[
          {
            key: 'content_type',
            label: 'Content Type',
            value: contentTypeFilter,
            onChange: setContentTypeFilter,
            options: contentTypes,
          },
          {
            key: 'action',
            label: 'Action',
            value: actionFilter,
            onChange: setActionFilter,
            options: actions,
          },
        ]}
        resultCount={filteredLogs.length}
        totalCount={auditLogs.length}
        itemName="audit log entries"
      />

      <div className="bg-card rounded-lg border">
        <DataTable columns={columns} data={filteredLogs} />
      </div>
    </div>
  )
}
