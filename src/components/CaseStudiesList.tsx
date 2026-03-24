'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Database } from '@/types/supabase';
import ContentCard from '@/components/ui/content-card';
import { ViewSwitcher } from '@/components/ui/view-switcher';
import { useViewSwitcher } from '@/hooks/useViewSwitcher';
import { useSortPersistence } from '@/hooks/useSortPersistence';
import { getContentMetadata } from '@/lib/content-metadata';
import { FacetedFilters } from '@/components/FacetedFilters';
import type { FilterGroup } from '@/components/FacetedFilters';
import type { CaseStudyRelationships } from '@/lib/relationship-queries';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SlidersHorizontal } from 'lucide-react';

type CaseStudy = Database['public']['Tables']['case_studies']['Row'];

interface CaseStudiesListProps {
  caseStudies: CaseStudy[];
  relationshipMap?: Record<string, CaseStudyRelationships>;
}

type SortOption = 'title-asc' | 'title-desc' | 'updated-asc' | 'updated-desc' | 'year-asc' | 'year-desc';

const CASE_STUDIES_SORT_OPTIONS = ['title-asc', 'title-desc', 'updated-asc', 'updated-desc', 'year-asc', 'year-desc'] as const;

export function CaseStudiesList({ caseStudies, relationshipMap = {} }: CaseStudiesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    industries: [],
    algorithms: [],
    personas: [],
  });

  const { viewMode, handleViewModeChange } = useViewSwitcher('case-studies-view-mode');
  const { sortBy, handleSortChange } = useSortPersistence('case-studies-sort', 'title-asc', CASE_STUDIES_SORT_OPTIONS);

  if (!caseStudies || caseStudies.length === 0) {
    return <div>No case studies found.</div>;
  }

  // Filter case studies by search and active faceted filters
  const filteredCaseStudies = useMemo(() => {
    return caseStudies
      .filter(cs => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            cs.title.toLowerCase().includes(query) ||
            (cs.description?.toLowerCase().includes(query) || false) ||
            (cs.year?.toString().includes(query) || false);
          if (!matchesSearch) return false;
        }

        // Faceted filters (AND between groups, OR within group)
        const rels = relationshipMap[cs.id];
        if (!rels) {
          // If no relationship data, only pass if no filters are active
          return Object.values(activeFilters).every(arr => arr.length === 0);
        }

        if (activeFilters.industries.length > 0) {
          const csIndustryIds = rels.industries.map(i => i.id);
          if (!activeFilters.industries.some(id => csIndustryIds.includes(id))) return false;
        }

        if (activeFilters.algorithms.length > 0) {
          const csAlgorithmIds = rels.algorithms.map(a => a.id);
          if (!activeFilters.algorithms.some(id => csAlgorithmIds.includes(id))) return false;
        }

        if (activeFilters.personas.length > 0) {
          const csPersonaIds = rels.personas.map(p => p.id);
          if (!activeFilters.personas.some(id => csPersonaIds.includes(id))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'title-asc': return a.title.localeCompare(b.title);
          case 'title-desc': return b.title.localeCompare(a.title);
          case 'updated-asc': return (new Date(a.updated_at || 0).getTime()) - (new Date(b.updated_at || 0).getTime());
          case 'updated-desc': return (new Date(b.updated_at || 0).getTime()) - (new Date(a.updated_at || 0).getTime());
          case 'year-asc': return (a.year || 0) - (b.year || 0) || a.title.localeCompare(b.title);
          case 'year-desc': return (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title);
          default: return a.title.localeCompare(b.title);
        }
      });
  }, [caseStudies, searchQuery, activeFilters, sortBy, relationshipMap]);

  // Compute cross-filtered counts for sidebar
  const filterGroups: FilterGroup[] = useMemo(() => {
    const computeCounts = (
      groupKey: string,
      getEntityIds: (rels: CaseStudyRelationships) => string[],
      getEntityName: (rels: CaseStudyRelationships, id: string) => string | undefined
    ): FilterGroup => {
      // Apply all filters EXCEPT the current group
      const otherFilteredStudies = caseStudies.filter(cs => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!cs.title.toLowerCase().includes(query) &&
              !(cs.description?.toLowerCase().includes(query)) &&
              !(cs.year?.toString().includes(query))) return false;
        }
        const rels = relationshipMap[cs.id];
        if (!rels) return Object.entries(activeFilters).every(([k, v]) => k === groupKey || v.length === 0);

        for (const [key, ids] of Object.entries(activeFilters)) {
          if (key === groupKey || ids.length === 0) continue;
          const csIds = key === 'industries' ? rels.industries.map(i => i.id)
            : key === 'algorithms' ? rels.algorithms.map(a => a.id)
            : rels.personas.map(p => p.id);
          if (!ids.some(id => csIds.includes(id))) return false;
        }
        return true;
      });

      // Count occurrences of each option
      const countMap = new Map<string, { name: string; count: number }>();
      for (const cs of otherFilteredStudies) {
        const rels = relationshipMap[cs.id];
        if (!rels) continue;
        for (const entityId of getEntityIds(rels)) {
          const name = getEntityName(rels, entityId);
          if (!name) continue;
          const existing = countMap.get(entityId);
          if (existing) existing.count++;
          else countMap.set(entityId, { name, count: 1 });
        }
      }

      const options = Array.from(countMap.entries())
        .map(([id, { name, count }]) => ({ id, name, count }))
        .sort((a, b) => b.count - a.count);

      const labels: Record<string, string> = {
        industries: 'Industry',
        algorithms: 'Algorithm',
        personas: 'Role',
      };

      return { key: groupKey, label: labels[groupKey] || groupKey, options };
    };

    return [
      computeCounts('industries',
        (rels) => rels.industries.map(i => i.id),
        (rels, id) => rels.industries.find(i => i.id === id)?.name
      ),
      computeCounts('algorithms',
        (rels) => rels.algorithms.map(a => a.id),
        (rels, id) => rels.algorithms.find(a => a.id === id)?.name
      ),
      computeCounts('personas',
        (rels) => rels.personas.map(p => p.id),
        (rels, id) => rels.personas.find(p => p.id === id)?.name
      ),
    ];
  }, [caseStudies, searchQuery, activeFilters, relationshipMap]);

  const handleFilterChange = useCallback((groupKey: string, optionId: string, checked: boolean) => {
    setActiveFilters(prev => ({
      ...prev,
      [groupKey]: checked
        ? [...(prev[groupKey] || []), optionId]
        : (prev[groupKey] || []).filter(id => id !== optionId),
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setActiveFilters({ industries: [], algorithms: [], personas: [] });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  const sidebarContent = (
    <FacetedFilters
      groups={filterGroups}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onClearAll={handleClearAll}
    />
  );

  return (
    <div className="flex gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Controls Row */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Mobile filter trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {Object.values(activeFilters).flat().length}
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetTitle>Filters</SheetTitle>
                  <div className="mt-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {sidebarContent}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1.5 block">
                Search case studies
              </Label>
              <Input
                id="search"
                type="search"
                placeholder="Search by title, description, or year..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
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
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="year-desc">Year (Newest First)</SelectItem>
                  <SelectItem value="year-asc">Year (Oldest First)</SelectItem>
                  <SelectItem value="updated-desc">Recently Updated</SelectItem>
                  <SelectItem value="updated-asc">Least Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter pills + results count */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                {filteredCaseStudies.length} case stud{filteredCaseStudies.length !== 1 ? 'ies' : 'y'} found
              </div>
              {hasActiveFilters && (
                <>
                  {Object.entries(activeFilters).flatMap(([groupKey, ids]) =>
                    ids.map(id => {
                      const group = filterGroups.find(g => g.key === groupKey);
                      const option = group?.options.find(o => o.id === id);
                      return option ? (
                        <button
                          key={`${groupKey}-${id}`}
                          onClick={() => handleFilterChange(groupKey, id, false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                          aria-label={`Remove ${option.name} filter`}
                        >
                          {option.name} ×
                        </button>
                      ) : null;
                    })
                  )}
                </>
              )}
            </div>
            <ViewSwitcher value={viewMode} onValueChange={handleViewModeChange} />
          </div>
        </div>

        {/* Results Grid/List */}
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredCaseStudies.map((caseStudy) => {
            const metadata = getContentMetadata('case-studies', caseStudy, viewMode);
            const rels = relationshipMap[caseStudy.id];
            const badges = rels
              ? [...rels.industries.map(i => i.name), ...rels.algorithms.map(a => a.name)].slice(0, 3)
              : [];

            return (
              <ContentCard
                key={caseStudy.id}
                variant={viewMode}
                title={caseStudy.title}
                description={caseStudy.description || ''}
                badges={badges}
                href={`/case-study/${caseStudy.slug}`}
                metadata={{
                  lastUpdated: metadata.join(' • ') || undefined
                }}
              />
            );
          })}
        </div>

        {filteredCaseStudies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No case studies found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
