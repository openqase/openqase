'use client'

import { GridView, TableView, LayoutToggle, useLayoutPreference } from '@/components/content-list'
import { usePagination } from '@/hooks/use-pagination'
import { PaginationControls } from '@/components/ui/pagination-controls'
import type { QuantumCompany } from './page'

interface QuantumCompaniesClientProps {
  items: QuantumCompany[]
  totalCount: number
}

export function QuantumCompaniesClient({ items, totalCount }: QuantumCompaniesClientProps) {
  const { layout, toggleLayout, isClient } = useLayoutPreference('grid')
  const { currentPage, totalPages, paginatedItems, goToPage, hasNextPage, hasPreviousPage } = usePagination({ items })

  if (!isClient) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Quantum Companies</h1>
          <p className="text-xl text-muted-foreground">
            Learn about companies building quantum computing solutions featured in case studies.
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            {totalCount} companies available
          </div>
        </div>
        <GridView
          items={paginatedItems}
          contentType="quantum-companies"
          basePath="/paths/quantum-companies"
        />
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quantum Companies</h1>
            <p className="text-xl text-muted-foreground">
              Learn about companies building quantum computing solutions featured in case studies.
            </p>
          </div>
          <LayoutToggle layout={layout} onToggle={toggleLayout} />
        </div>
        <div className="text-sm text-muted-foreground">
          {totalCount} companies available
        </div>
      </div>

      {layout === 'grid' ? (
        <GridView
          items={paginatedItems}
          contentType="quantum-companies"
          basePath="/paths/quantum-companies"
        />
      ) : (
        <TableView
          items={paginatedItems}
          contentType="quantum-companies"
          basePath="/paths/quantum-companies"
        />
      )}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </div>
  )
}