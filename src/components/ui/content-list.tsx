'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BaseContent } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchEmptyState } from '@/components/ui/search-empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface SortOption {
  value: string;
  label: string;
}

interface ContentListProps<T extends BaseContent> {
  items: T[];
  type: 'algorithm' | 'case-study' | 'industry' | 'persona';
  renderBadges?: (item: T) => React.ReactNode;
  renderExtraFilters?: () => React.ReactNode;
  basePath: string;
  sortOptions?: SortOption[];
}

export default function ContentList<T extends BaseContent>({ 
  items,
  type,
  renderBadges,
  renderExtraFilters,
  basePath,
  sortOptions = [
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'lastUpdated', label: 'Last Updated' }
  ]
}: ContentListProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(sortOptions[0].value);
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const isSearching = searchQuery !== debouncedSearchQuery;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) || false)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'lastUpdated':
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, debouncedSearchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filters and Sort Controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr,auto,auto]">
        <div className="w-full">
          <Label htmlFor="search" className="text-sm font-medium mb-1.5 block">
            Search
          </Label>
          <div className="relative">
            <Input
              id="search"
              type="search"
              placeholder={`Search ${type}s...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {renderExtraFilters?.()}

        <div className="w-full sm:max-w-[200px]">
          <Label htmlFor="sort" className="text-sm font-medium mb-1.5 block">
            Sort by
          </Label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
            <SelectTrigger id="sort" className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
        {isSearching ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            Searching {type}s...
          </span>
        ) : (
          `${filteredItems.length} ${type}${filteredItems.length !== 1 ? 's' : ''} found`
        )}
      </div>

      {/* Content Grid / Skeletons */}
      {isSearching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-border bg-card/60 p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Link key={item.slug} href={`${basePath}/${item.slug}`}>
              <Card className={cn(
                "h-full transition-all duration-200 hover:border-border-hover",
                "hover:shadow-sm hover:bg-accent/5"
              )}>
                <CardHeader className="h-full flex flex-col">
                  <div className="flex-grow">
                    <CardTitle className="text-lg sm:text-xl mb-2 line-clamp-2">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 mb-4">
                      {item.description || ''}
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {renderBadges?.(item)}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isSearching && filteredItems.length === 0 && (
        <SearchEmptyState
          query={debouncedSearchQuery}
          resourceName={`${type}s`}
          onClearSearch={() => setSearchQuery('')}
        />
      )}
    </div>
  );
} 