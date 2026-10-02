'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Plus, Search, Trash, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useMemo } from 'react'
import type { CaseStudy } from './page'

const createColumns = (
  selectedItems: Set<string>,
  onSelectItem: (id: string, selected: boolean) => void,
  onSelectAll: (selected: boolean) => void,
  allSelected: boolean,
  onDeleteItem: (id: string) => void
): ColumnDef<CaseStudy>[] => [
  {
    id: 'select',
    header: () => (
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
    accessorKey: 'published',
    header: 'Status',
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.published 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.original.published ? 'Published' : 'Draft'}
        </span>
      </div>
    )
  },
  {
    accessorKey: 'import_batch_name',
    header: 'Import Batch',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.import_batch_name || 'Manual'}
      </span>
    )
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.created_at || '').toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        })}
      </span>
    )
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: ({ row }) => {
      return (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/case-studies/${row.original.id}`}>
              Edit
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDeleteItem(row.original.id)}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      );
    }
  }
]

interface CaseStudiesClientProps {
  data: CaseStudy[]
}

export function CaseStudiesClient({ data }: CaseStudiesClientProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get unique batch names for filter dropdown
  const uniqueBatches = useMemo(() => {
    const batches = [...new Set(data.map(item => item.import_batch_name).filter(Boolean))] as string[]
    return batches.sort()
  }, [data])

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Status filter
      if (statusFilter === 'published' && !item.published) return false
      if (statusFilter === 'draft' && item.published) return false
      
      // Batch filter
      if (batchFilter !== 'all') {
        if (batchFilter === 'manual' && item.import_batch_name) return false
        if (batchFilter !== 'manual' && item.import_batch_name !== batchFilter) return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          (item.title || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [data, statusFilter, batchFilter, searchQuery])

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
      setSelectedItems(new Set(filteredData.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleBulkOperation = async (operation: 'publish' | 'unpublish' | 'delete') => {
    if (selectedItems.size === 0) return
    
    const confirmMessage = operation === 'delete' 
      ? `Are you sure you want to delete ${selectedItems.size} case studies? They will be moved to trash.`
      : `Are you sure you want to ${operation} ${selectedItems.size} case studies?`
    if (!confirm(confirmMessage)) return
    
    setIsLoading(true)
    try {
      if (operation === 'delete') {
        // Use our new delete endpoint for bulk delete
        const response = await fetch('/api/case-studies/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedItems) })
        })
        
        if (response.ok) {
          alert(`Successfully moved ${selectedItems.size} case studies to trash`)
          setSelectedItems(new Set())
          window.location.reload()
        } else {
          const error = await response.text()
          alert(`Failed to delete case studies: ${error}`)
        }
      } else {
        // Existing bulk operations for publish/unpublish
        const response = await fetch('/api/case-studies', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bulk: true,
            operation,
            ids: Array.from(selectedItems)
          })
        })
        
        if (response.ok) {
          const body = await response.json().catch(() => null)
          if (body?.failed?.length > 0) {
            alert(body.message)
          } else {
            alert(`Successfully ${operation}ed ${selectedItems.size} case studies`)
          }
          setSelectedItems(new Set())
          window.location.reload()
        } else {
          alert(`Failed to ${operation} case studies`)
        }
      }
    } catch (error) {
      console.error('Bulk operation error:', error)
      alert(`Error performing ${operation} operation`)
    }
    setIsLoading(false)
  }

  const handleDeleteItem = async (id: string) => {
    const confirmMessage = 'Are you sure you want to delete this case study? It will be moved to trash.'
    if (!confirm(confirmMessage)) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/case-studies/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      if (response.ok) {
        alert('Case study moved to trash')
        window.location.reload()
      } else {
        const error = await response.text()
        alert(`Failed to delete case study: ${error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Error deleting case study')
    }
    setIsLoading(false)
  }

  const allSelected = filteredData.length > 0 && selectedItems.size === filteredData.length
  const columns = createColumns(selectedItems, handleSelectItem, handleSelectAll, allSelected, handleDeleteItem)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Case Studies</h1>
          <p className="text-muted-foreground">
            Create and manage case studies showcasing quantum computing applications.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/case-studies/trash">
              <Trash2 className="w-4 h-4 mr-2" />
              Trash
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/case-studies/new">
              <Plus className="w-4 h-4 mr-2" />
              New Case Study
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 p-4 bg-card rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search case studies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Import Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              {uniqueBatches.map(batch => (
                <SelectItem key={batch} value={batch}>{batch}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                onClick={() => handleBulkOperation('publish')}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkOperation('unpublish')}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Unpublish
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkOperation('delete')}
                disabled={isLoading}
              >
                <Trash className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border">
        <DataTable 
          columns={columns} 
          data={filteredData} 
        />
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredData.length} of {data.length} case studies
      </div>
    </div>
  )
} 