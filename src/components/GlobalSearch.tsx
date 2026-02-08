'use client';

import { memo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { useGlobalSearch, GroupedSearchResults, SearchResult } from '@/hooks/useGlobalSearch';
import { SearchableItem } from '@/lib/content-fetchers';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  searchData: SearchableItem[];
  className?: string;
}

export interface GlobalSearchRef {
  focus: () => void;
}

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: () => void;
}

interface SearchResultGroupProps {
  title: string;
  results: SearchResult[];
  maxResults?: number;
  onSelect: () => void;
}

// Individual search result item component
const SearchResultItem = memo(function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  const { item } = result;
  
  // Determine the link path based on content type
  const getHref = () => {
    switch (item.type) {
      case 'case_studies':
        return `/case-study/${item.slug}`;
      case 'algorithms':
        return `/paths/algorithm/${item.slug}`;
      case 'industries':
        return `/paths/industry/${item.slug}`;
      case 'personas':
        return `/paths/persona/${item.slug}`;
      default:
        return `/${item.slug}`;
    }
  };

  // Get display badges for the item
  const getBadges = () => {
    switch (item.type) {
      case 'case_studies':
        return item.metadata.companies?.slice(0, 2) || [];
      case 'algorithms':
        return item.metadata.quantum_advantage ? [item.metadata.quantum_advantage] : [];
      default:
        return [];
    }
  };

  return (
    <Link
      href={getHref()}
      onClick={onSelect}
      className="block p-3 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight mb-1 truncate">
            {item.title}
          </h4>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {item.description}
            </p>
          )}
          {getBadges().length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {getBadges().map((badge, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="w-3 h-3 text-muted-foreground ml-2 flex-shrink-0" />
      </div>
    </Link>
  );
});

// Search result group component
const SearchResultGroup = memo(function SearchResultGroup({ title, results, maxResults = 3, onSelect }: SearchResultGroupProps) {
  if (results.length === 0) return null;

  const displayResults = results.slice(0, maxResults);
  const hasMore = results.length > maxResults;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-3 py-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title} ({results.length})
        </h3>
        {hasMore && (
          <span className="text-xs text-muted-foreground">
            +{results.length - maxResults} more
          </span>
        )}
      </div>
      <div className="space-y-1">
        {displayResults.map((result) => (
          <SearchResultItem
            key={result.item.id}
            result={result}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
});

// Main search component
const GlobalSearch = forwardRef<GlobalSearchRef, GlobalSearchProps>(
  ({ searchData, className }, ref) => {
  const {
    searchQuery,
    searchResults,
    totalResults,
    isOpen,
    handleSearchChange,
    closeSearch,
    clearSearch
  } = useGlobalSearch(searchData);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose focus method through ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }), []);

  // Handle click outside to close search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        closeSearch();
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search case studies, algorithms, companies..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-background border border-border focus:outline-none focus:border-primary focus:ring-0 transition-colors duration-200 placeholder:text-muted-foreground text-foreground"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl z-[100] max-h-96 overflow-y-auto">
          {totalResults > 0 ? (
            <div className="py-2">
              <SearchResultGroup
                title="Case Studies"
                results={searchResults.case_studies}
                onSelect={closeSearch}
              />
              <SearchResultGroup
                title="Algorithms"
                results={searchResults.algorithms}
                onSelect={closeSearch}
              />
              <SearchResultGroup
                title="Industries"
                results={searchResults.industries}
                onSelect={closeSearch}
              />
              <SearchResultGroup
                title="Professional Roles"
                results={searchResults.personas}
                onSelect={closeSearch}
              />
              
              {/* View All Results Footer */}
              {totalResults > 9 && (
                <div className="border-t border-border mt-2 pt-2 px-3">
                  <button
                    onClick={closeSearch}
                    className="w-full text-left text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    View all {totalResults} results →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-muted-foreground mb-2">No results found</p>
              <p className="text-sm text-muted-foreground">
                Try searching for "HSBC", "optimization", or "finance"
              </p>
              <div className="mt-3">
                <Link
                  href="/case-study"
                  onClick={closeSearch}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Browse all case studies →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

GlobalSearch.displayName = 'GlobalSearch';

export default GlobalSearch;