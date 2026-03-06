'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Database } from '@/types/supabase';
import ContentCard from '@/components/ui/content-card';
import { ViewSwitcher } from '@/components/ui/view-switcher';
import { useViewSwitcher } from '@/hooks/useViewSwitcher';
import { useSortPersistence } from '@/hooks/useSortPersistence';
import { getContentMetadata } from '@/lib/content-metadata';

// Use the exact Industry type from Database
type Industry = Database['public']['Tables']['industries']['Row'];

interface IndustryListProps {
  industries: Industry[];
}

type SortOption = 'name-asc' | 'name-desc' | 'updated-asc' | 'updated-desc';

const INDUSTRIES_SORT_OPTIONS = ['name-asc', 'name-desc', 'updated-asc', 'updated-desc'] as const;

export default function IndustryList({ industries }: IndustryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  
  // Use hooks for persistence
  const { viewMode, handleViewModeChange } = useViewSwitcher('industries-view-mode');
  const { sortBy, handleSortChange } = useSortPersistence('industries-sort', 'name-asc', INDUSTRIES_SORT_OPTIONS);

  // Memoize unique sectors for filtering (hardcoded as industries don't have sectors)
  const sectors = useMemo(() => {
    return ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Other'];
  }, []);

  // Memoize expensive filtering and sorting operations
  const filteredIndustries = useMemo(() => {
    return industries
    .filter(industry => {
      // Skip sector filtering as industries don't have sectors
      if (sectorFilter !== 'all') return false;
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        industry.name.toLowerCase().includes(query) ||
        industry.description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'updated-asc':
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateA - dateB;
        case 'updated-desc':
          const dateC = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateD = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateD - dateC;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [industries, sectorFilter, searchQuery, sortBy]);

  // Memoize event handlers to prevent child re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSectorFilterChange = useCallback((value: string) => {
    setSectorFilter(value);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm font-medium mb-1.5 block">
              Search industries
            </Label>
            <Input
              id="search"
              type="search"
              placeholder="Search by name, description, or sector..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
          
          <div className="w-full sm:w-[200px]">
            <Label htmlFor="sector" className="text-sm font-medium mb-1.5 block">
              Sector
            </Label>
            <Select value={sectorFilter} onValueChange={handleSectorFilterChange}>
              <SelectTrigger id="sector" className="w-full">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[200px]">
            <Label htmlFor="sort" className="text-sm font-medium mb-1.5 block">
              Sort by
            </Label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger id="sort" className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="updated-desc">Recently Updated</SelectItem>
                <SelectItem value="updated-asc">Least Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Switcher and Results Count Row */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
            {filteredIndustries.length} industr{filteredIndustries.length !== 1 ? 'ies' : 'y'} found
          </div>
          <ViewSwitcher value={viewMode} onValueChange={handleViewModeChange} />
        </div>
      </div>

      {/* Industry Grid/List */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        : "space-y-4"
      }>
        {filteredIndustries.map((industry) => {
          // Get metadata using the new system
          const metadata = getContentMetadata('industries', industry, viewMode);
          
          return (
            <ContentCard
              key={industry.slug}
              variant={viewMode}
              title={industry.name}
              description={industry.description || ''}
              badges={[]}
              href={`/paths/industry/${industry.slug}`}
              metadata={{
                lastUpdated: metadata.join(' • ') || undefined
              }}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredIndustries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            No industries found matching your search.
          </p>
        </div>
      )}
    </div>
  );
} 