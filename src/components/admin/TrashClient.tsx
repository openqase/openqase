'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'

export interface TrashItem {
  id: string
  title: string
  deleted_at: string | null
  deleted_by_email?: string
}

interface TrashClientProps {
  data: TrashItem[]
  label: { singular: string; plural: string }
  /** Admin listing page, e.g. /admin/case-studies */
  adminPath: string
  /** API base, e.g. /api/case-studies (…/restore, …/permanent-delete) */
  apiBase: string
}

const createColumns = (
  selectedItems: Set<string>,
  onSelectItem: (id: string, selected: boolean) => void,
  onSelectAll: (selected: boolean) => void,
  allSelected: boolean,
  onRestore: (id: string) => void,
  onPermanentDelete: (id: string) => void
): ColumnDef<TrashItem>[] => [
  {
    id: 'select',
    header: () => (
      <Checkbox
        checked={allSelected}
        onCheckedChange={(checked) => onSelectAll(!!checked)}
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
    cell: ({ row }) => (
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
    )
  }
]

/**
 * Shared trash UI for every CMS content type. Rendered by AdminTrashPage;
 * see src/app/admin/<type>/trash/page.tsx.
 */
export function TrashClient({ data, label, adminPath, apiBase }: TrashClientProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const singular = label.singular.toLowerCase()
  const plural = label.plural.toLowerCase()
  const noun = (count: number) => (count === 1 ? singular : plural)
  const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
    setSelectedItems(selected ? new Set(data.map(item => item.id)) : new Set())
  }

  /** POST ids to /restore or /permanent-delete, then reload on success. */
  const runAction = async (
    action: 'restore' | 'permanent-delete',
    ids: string[],
    messages: { confirm: string; success: string; failure: string; error: string }
  ) => {
    if (ids.length === 0) return
    if (!confirm(messages.confirm)) return

    setIsLoading(true)
    try {
      const response = await fetch(`${apiBase}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids.length === 1 ? { id: ids[0] } : { ids })
      })

      if (response.ok) {
        alert(messages.success)
        setSelectedItems(new Set())
        window.location.reload()
      } else {
        const error = await response.text()
        alert(`${messages.failure}: ${error}`)
      }
    } catch (error) {
      console.error(`${action} error:`, error)
      alert(messages.error)
    }
    setIsLoading(false)
  }

  const handleRestore = (id: string) =>
    runAction('restore', [id], {
      confirm: `Restore this ${singular}?`,
      success: `${capitalise(singular)} restored`,
      failure: 'Failed to restore',
      error: `Error restoring ${singular}`,
    })

  const handlePermanentDelete = (id: string) =>
    runAction('permanent-delete', [id], {
      confirm: `PERMANENTLY delete this ${singular}? This cannot be undone!`,
      success: `${capitalise(singular)} permanently deleted`,
      failure: 'Failed to delete',
      error: `Error deleting ${singular}`,
    })

  const handleBulkRestore = () => {
    const ids = Array.from(selectedItems)
    return runAction('restore', ids, {
      confirm: `Restore ${ids.length} ${noun(ids.length)}?`,
      success: `Restored ${ids.length} ${noun(ids.length)}`,
      failure: 'Failed to restore',
      error: `Error restoring ${plural}`,
    })
  }

  const handleBulkPermanentDelete = () => {
    const ids = Array.from(selectedItems)
    return runAction('permanent-delete', ids, {
      confirm: `PERMANENTLY delete ${ids.length} ${noun(ids.length)}? This cannot be undone!`,
      success: `Permanently deleted ${ids.length} ${noun(ids.length)}`,
      failure: 'Failed to delete',
      error: `Error deleting ${plural}`,
    })
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
              <Link href={adminPath}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to {label.plural}
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Trash</h1>
          <p className="text-muted-foreground">
            {data.length} deleted {noun(data.length)}.
            Restore or permanently delete items here. Restored items come back as drafts.
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
