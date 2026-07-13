'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import type { QuantumSoftware } from './page'
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

interface QuantumSoftwareClientProps {
  data: QuantumSoftware[]
}

export function QuantumSoftwareClient({ data }: QuantumSoftwareClientProps) {
  const [quantumSoftware, setQuantumSoftware] = useState<QuantumSoftware[]>(data)
  const [prevData, setPrevData] = useState(data)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [softwareToDelete, setSoftwareToDelete] = useState<QuantumSoftware | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (prevData !== data) {
    setPrevData(data)
    setQuantumSoftware(data)
  }

  // Filtering logic in parent
  const filteredSoftware = useMemo(() => {
    return quantumSoftware.filter(item => {
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
  }, [quantumSoftware, searchQuery, statusFilter])

  const handleDelete = async (software: QuantumSoftware) => {
    setSoftwareToDelete(software)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!softwareToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch('/api/quantum-software/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: softwareToDelete.id })
      })

      if (response.ok) {
        setQuantumSoftware(prev => prev.filter(s => s.id !== softwareToDelete.id))
      } else {
        console.error('Failed to delete quantum software')
      }
    } catch (error) {
      console.error('Error deleting quantum software:', error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSoftwareToDelete(null)
    }
  }

  const columns: ColumnDef<QuantumSoftware>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'vendor',
      header: 'Vendor',
    },
    {
      accessorKey: 'published',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.original.published 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.original.published ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Link href={`/admin/quantum-software/${row.original.id}`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quantum Software</h1>
          <p className="text-muted-foreground">
            Create and manage quantum software platforms showcasing quantum computing tools.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/quantum-software/new">
              <Plus className="w-4 h-4 mr-2" />
              New Software
            </Link>
          </Button>
        </div>
      </div>

      <AdminListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search quantum software..."
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
        resultCount={filteredSoftware.length}
        totalCount={quantumSoftware.length}
        itemName="quantum software"
      />

      <div className="bg-card rounded-lg border">
        <DataTable columns={columns} data={filteredSoftware} />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Quantum Software
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{softwareToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}