'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ExternalLink, ArrowUpDown } from 'lucide-react'
import { useState, useMemo } from 'react'

interface BaseContentItem {
  id: string
  name: string
  slug: string
  description?: string | null
  published: boolean | null
  website_url?: string | null
  documentation_url?: string | null
  github_url?: string | null
}

interface QuantumSoftware extends BaseContentItem {
  vendor?: string | null
  license_type?: string | null
  pricing_model?: string | null
}

interface QuantumHardware extends BaseContentItem {
  vendor?: string | null
  technology_type?: string | null
}

interface QuantumCompany extends BaseContentItem {
  industry?: string | null
  company_type?: string | null
}

interface PartnerCompany extends BaseContentItem {
  industry?: string | null
  company_size?: string | null
}

type ContentItem = QuantumSoftware | QuantumHardware | QuantumCompany | PartnerCompany

interface TableViewProps {
  items: ContentItem[]
  contentType: 'quantum-software' | 'quantum-hardware' | 'quantum-companies' | 'partner-companies'
  basePath: string
}

type SortField = 'name' | 'secondary'
type SortDirection = 'asc' | 'desc'

function getSecondaryInfo(item: ContentItem, contentType: string) {
  switch (contentType) {
    case 'quantum-software':
      return (item as QuantumSoftware).vendor || 'Unknown'
    case 'quantum-hardware':
      return (item as QuantumHardware).vendor || 'Unknown'
    case 'quantum-companies':
    case 'partner-companies':
      return (item as QuantumCompany | PartnerCompany).industry || 'Various'
    default:
      return 'Unknown'
  }
}

function getSecondaryLabel(contentType: string) {
  switch (contentType) {
    case 'quantum-software':
      return 'Vendor'
    case 'quantum-hardware':
      return 'Vendor'
    case 'quantum-companies':
    case 'partner-companies':
      return 'Industry'
    default:
      return 'Category'
  }
}

export function TableView({ items, contentType, basePath }: TableViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSecondaryInfo(item, contentType).toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aValue: string
      let bValue: string

      if (sortField === 'name') {
        aValue = a.name
        bValue = b.name
      } else {
        aValue = getSecondaryInfo(a, contentType)
        bValue = getSecondaryInfo(b, contentType)
      }

      const comparison = aValue.localeCompare(bValue)
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [items, searchTerm, sortField, sortDirection, contentType])

  const secondaryLabel = getSecondaryLabel(contentType)

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filteredAndSortedItems.length} of {items.length} items
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('secondary')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  {secondaryLabel}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link 
                    href={`${basePath}/${item.slug}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getSecondaryInfo(item, contentType)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md">
                  <div className="line-clamp-2">
                    {item.description}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.website_url && (
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                        title="Website"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}