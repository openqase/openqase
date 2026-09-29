'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import type { Industry } from './page'
import { useState, useMemo } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AdminListFilters } from '@/components/admin/AdminListFilters'

interface IndustriesClientProps {
  data: Industry[]
}

export function IndustriesClient({ data }: IndustriesClientProps) {
  const [industries, setIndustries] = useState<Industry[]>(data)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [industryToDelete, setIndustryToDelete] = useState<Industry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtering logic in parent
  const filteredIndustries = useMemo(() => {
    return industries.filter(item => {
      // Search logic
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          (item.name || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Status filter logic
      if (statusFilter !== 'all') {
        if (String(item.published) !== statusFilter) return false
      }

      return true
    })
  }, [industries, searchQuery, statusFilter])

  const handleDelete = async (industry: Industry) => {
    setIndustryToDelete(industry)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!industryToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch('/api/industries/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: industryToDelete.id })
      })
      
      if (response.ok) {
        // Remove the deleted industry from the state
        setIndustries(industries.filter(i => i.id !== industryToDelete.id))
        alert('Industry moved to trash')
      } else {
        const error = await response.text()
        alert(`Failed to delete industry: ${error}`)
        console.error('Failed to delete industry')
      }
    } catch (error) {
      console.error('Error deleting industry:', error)
      alert('Error deleting industry')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setIndustryToDelete(null)
    }
  }

  const columns: ColumnDef<Industry>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.description ?
            (row.original.description.length > 50 ?
              `${row.original.description.substring(0, 50)}...` :
              row.original.description) :
            'N/A'}
        </div>
      )
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/industries/${row.original.id}`}>
              Edit
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleDelete(row.original)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Industries</h1>
          <p className="text-muted-foreground">
            Create and manage industry categories and their relationships.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/industries/trash">
              <Trash2 className="w-4 h-4 mr-2" />
              Trash
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/industries/new">
              <Plus className="w-4 h-4 mr-2" />
              New Industry
            </Link>
          </Button>
        </div>
      </div>

      <AdminListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search industries..."
        filters={[
          {
            key: 'published',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'true', label: 'Published' },
              { value: 'false', label: 'Draft' },
            ],
          },
        ]}
        resultCount={filteredIndustries.length}
        totalCount={industries.length}
        itemName="industries"
      />

      <div className="bg-card rounded-lg border">
        <DataTable columns={columns} data={filteredIndustries} />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Delete Industry
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{industryToDelete?.name}&quot;? It will be moved to trash and can be recovered later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}