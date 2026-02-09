'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import type { CaseStudy as BaseCaseStudy } from './page'

type CaseStudy = BaseCaseStudy & { deleted_by_email?: string }

const createColumns = (
  selectedItems: Set<string>,
  onSelectItem: (id: string, selected: boolean) => void,
  onSelectAll: (selected: boolean) => void,
  allSelected: boolean,
  onRestore: (id: string) => void,
  onPermanentDelete: (id: string) => void
): ColumnDef<CaseStudy>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={allSelected}
        onCheckedChange={onSelectAll}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedItems.has(row.original.id)}
        onCheckedChange={(checked) => onSelectItem(row.original.id, !!checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'deleted_at',
    header: 'Deleted',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.deleted_at
          ? new Date(row.original.deleted_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '-'
        }
      </span>
    )
  },
  {
    accessorKey: 'deleted_by_email',
    header: 'Deleted By',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.deleted_by_email || 'Unknown'}
      </span>
    )
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => {
      return (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRestore(row.original.id)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onPermanentDelete(row.original.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Forever
          </Button>
        </div>
      );
    }
  }
]

interface TrashClientProps {
  data: CaseStudy[]
}

export function TrashClient({ data }: TrashClientProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectItem = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedItems)
    if (selected) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    setSelectedItems(newSelection)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(data.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleRestore = async (id: string) => {
    if (!confirm('Restore this case study?')) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/case-studies/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        alert('Case study restored')
        window.location.reload()
      } else {
        const error = await response.text()
        alert(`Failed to restore: ${error}`)
      }
    } catch (error) {
      console.error('Restore error:', error)
      alert('Error restoring case study')
    }
    setIsLoading(false)
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('PERMANENTLY delete this case study? This cannot be undone!')) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/case-studies/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        alert('Case study permanently deleted')
        window.location.reload()
      } else {
        const error = await response.text()
        alert(`Failed to delete: ${error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error deleting case study')
    }
    setIsLoading(false)
  }

  const handleBulkRestore = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Restore ${selectedItems.size} case studies?`)) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/case-studies/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) })
      })

      if (response.ok) {
        alert(`Restored ${selectedItems.size} case studies`)
        setSelectedItems(new Set())
        window.location.reload()
      } else {
        const error = await response.text()
        alert(`Failed to restore: ${error}`)
      }
    } catch (error) {
      console.error('Bulk restore error:', error)
      alert('Error restoring case studies')
    }
    setIsLoading(false)
  }

  const handleBulkPermanentDelete = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`PERMANENTLY delete ${selectedItems.size} case studies? This cannot be undone!`)) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/case-studies/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) })
      })

      if (response.ok) {
        alert(`Permanently deleted ${selectedItems.size} case studies`)
        setSelectedItems(new Set())
        window.location.reload()
      } else {
        const error = await response.text()
        alert(`Failed to delete: ${error}`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('Error deleting case studies')
    }
    setIsLoading(false)
  }

  const allSelected = data.length > 0 && selectedItems.size === data.length
  const columns = createColumns(
    selectedItems,
    handleSelectItem,
    handleSelectAll,
    allSelected,
    handleRestore,
    handlePermanentDelete
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/case-studies">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Case Studies
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Trash</h1>
          <p className="text-muted-foreground">
            {data.length} deleted case {data.length === 1 ? 'study' : 'studies'}.
            Restore or permanently delete items here.
          </p>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      {selectedItems.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkRestore}
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restore Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkPermanentDelete}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Trash is empty</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <DataTable
            columns={columns}
            data={data}
          />
        </div>
      )}
    </div>
  )
}
