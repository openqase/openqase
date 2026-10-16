'use client';

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Loader2, SearchX } from 'lucide-react';
import { useGlobalSearch, shouldOpenResults, SearchResult, GroupedSearchResults } from '@/hooks/useGlobalSearch';
import { SearchableItem } from '@/lib/content-fetchers';
import { cn } from '@/lib/utils';

// Result groups in display order. Keyboard navigation follows the same order.
const RESULT_GROUPS: { key: keyof GroupedSearchResults; title: string }[] = [
  { key: 'case_studies', title: 'Case Studies' },
  { key: 'algorithms', title: 'Algorithms' },
  { key: 'industries', title: 'Industries' },
  { key: 'personas', title: 'Professional Roles' },
  { key: 'quantum_hardware', title: 'Quantum Hardware' },
  { key: 'quantum_software', title: 'Quantum Software' },
  { key: 'quantum_companies', title: 'Quantum Companies' },
  { key: 'partner_companies', title: 'Partner Companies' },
  { key: 'blog_posts', title: 'Blog' },
];

const MAX_RESULTS_PER_GROUP = 3;

// Stable DOM id for a result option, used by aria-activedescendant.
function getOptionId(listboxId: string, item: SearchableItem) {
  return `${listboxId}-${item.type}-${item.id}`;
}

interface GlobalSearchProps {
  searchData: SearchableItem[];
  className?: string;
}

export interface GlobalSearchRef {
  focus: () => void;
}

interface SearchResultItemProps {
  id: string;
  result: SearchResult;
  isActive: boolean;
  onSelect: () => void;
}

interface SearchResultGroupProps {
  id: string;
  listboxId: string;
  title: string;
  results: SearchResult[];
  maxResults?: number;
  activeOptionId?: string;
  onSelect: () => void;
}

// Individual search result item component
const SearchResultItem = memo(function SearchResultItem({ id, result, isActive, onSelect }: SearchResultItemProps) {
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
      case 'blog_posts':
        return `/blog/${item.slug}`;
      case 'quantum_hardware':
        return `/paths/quantum-hardware/${item.slug}`;
      case 'quantum_software':
        return `/paths/quantum-software/${item.slug}`;
      case 'quantum_companies':
        return `/paths/quantum-companies/${item.slug}`;
      case 'partner_companies':
        return `/paths/partner-companies/${item.slug}`;
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
      case 'quantum_hardware':
      case 'quantum_software':
        return item.metadata.companies?.slice(0, 1) || [];
      default:
        return [];
    }
  };

  return (
    <Link
      id={id}
      href={getHref()}
      onClick={onSelect}
      role="option"
      aria-selected={isActive}
      // Focus stays on the combobox input; options are reached with the arrow keys.
      tabIndex={-1}
      className={cn(
        "block p-3 hover:bg-muted/50 transition-colors rounded-lg",
        isActive && "bg-muted/50 ring-1 ring-inset ring-primary/40"
      )}
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
const SearchResultGroup = memo(function SearchResultGroup({
  id,
  listboxId,
  title,
  results,
  maxResults = MAX_RESULTS_PER_GROUP,
  activeOptionId,
  onSelect,
}: SearchResultGroupProps) {
  if (results.length === 0) return null;

  const displayResults = results.slice(0, maxResults);
  const hasMore = results.length > maxResults;
  const labelId = `${id}-label`;

  return (
    <div className="py-2" role="group" aria-labelledby={labelId}>
      <div className="flex items-center justify-between px-3 py-1" role="presentation">
        <h3 id={labelId} role="presentation" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title} ({results.length})
        </h3>
        {hasMore && (
          <span className="text-xs text-muted-foreground">
            +{results.length - maxResults} more
          </span>
        )}
      </div>
      <div className="space-y-1">
        {displayResults.map((result) => {
          const optionId = getOptionId(listboxId, result.item);
          return (
            <SearchResultItem
              key={result.item.id}
              id={optionId}
              result={result}
              isActive={optionId === activeOptionId}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
});

// Main search component
const GlobalSearch = forwardRef<GlobalSearchRef, GlobalSearchProps>(
  ({ searchData, className }, ref) => {
  const {
    searchQuery,
    debouncedSearchQuery,
    searchResults,
    totalResults,
    isOpen,
    isSearching,
    handleSearchChange,
    closeSearch,
    clearSearch,
  } = useGlobalSearch(searchData);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Index into visibleResults of the keyboard-active option (-1 = none).
  const [activeIndex, setActiveIndex] = useState(-1);

  // The options actually rendered, flattened in display order.
  const visibleResults = useMemo(
    () => RESULT_GROUPS.flatMap(({ key }) => searchResults[key].slice(0, MAX_RESULTS_PER_GROUP)),
    [searchResults]
  );

  const showListbox = isOpen && !isSearching && totalResults > 0;
  const activeResult = showListbox ? visibleResults[activeIndex] : undefined;
  const activeOptionId = activeResult ? getOptionId(listboxId, activeResult.item) : undefined;

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
        setActiveIndex(-1);
        closeSearch();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeSearch]);

  // Handle Escape: close results but keep focus on the input (WAI-ARIA combobox)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setActiveIndex(-1);
        closeSearch();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  // Keep the keyboard-active option visible inside the scrollable dropdown
  useEffect(() => {
    if (activeOptionId) {
      document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeOptionId]);

  const selectResult = useCallback(() => {
    setActiveIndex(-1);
    closeSearch();
  }, [closeSearch]);

  // WAI-ARIA combobox keyboard handling. Focus stays on the input; the active
  // option is conveyed with aria-activedescendant. ArrowDown/ArrowUp wrap
  // around at either end. Home/End are left to the text field (caret movement).
  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!isOpen) {
          // ArrowDown reopens results for the current query (e.g. after Escape)
          if (event.key === 'ArrowDown' && shouldOpenResults(searchQuery)) {
            event.preventDefault();
            handleSearchChange(searchQuery);
            setActiveIndex(0);
          }
          return;
        }
        if (!showListbox) return;

        event.preventDefault();
        const count = visibleResults.length;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((index) => {
          if (index < 0) return step === 1 ? 0 : count - 1;
          return (index + step + count) % count;
        });
        return;
      }
      case 'Enter': {
        if (!activeOptionId) return;
        // Click the option so Enter follows exactly the same path as a mouse click
        event.preventDefault();
        document.getElementById(activeOptionId)?.click();
        return;
      }
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 w-5 h-5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search case studies, algorithms, companies..."
          value={searchQuery}
          onChange={(e) => {
            setActiveIndex(-1);
            handleSearchChange(e.target.value);
          }}
          onKeyDown={handleInputKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showListbox}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-label="Search case studies, algorithms, and companies"
          className="w-full pl-10 pr-10 py-3 bg-background border border-border focus:outline-none focus:border-primary focus:ring-0 transition-colors duration-200 placeholder:text-muted-foreground text-foreground"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center" aria-hidden="true">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isSearching && searchQuery.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl z-[100] max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="py-8 px-4 text-center" role="status" aria-live="polite">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Searching for &ldquo;{searchQuery}&rdquo;...</span>
              </div>
              <div className="space-y-2.5 max-w-md mx-auto px-4">
                <div className="h-8 bg-muted/60 rounded-md animate-pulse" />
                <div className="h-8 bg-muted/40 rounded-md animate-pulse" />
                <div className="h-8 bg-muted/30 rounded-md animate-pulse" />
              </div>
            </div>
          ) : totalResults > 0 ? (
            <div className="py-2">
              <div role="listbox" id={listboxId} aria-label="Search results">
                {RESULT_GROUPS.map(({ key, title }) => (
                  <SearchResultGroup
                    key={key}
                    id={`${listboxId}-${key}`}
                    listboxId={listboxId}
                    title={title}
                    results={searchResults[key]}
                    activeOptionId={activeOptionId}
                    onSelect={selectResult}
                  />
                ))}
              </div>

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
            <div className="py-8 px-4 text-center" role="status" aria-live="polite">
              <div className="w-10 h-10 rounded-full bg-muted/70 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <SearchX className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="font-semibold text-foreground mb-1">
                No results found for &ldquo;{debouncedSearchQuery || searchQuery}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                Try searching for keywords like &ldquo;HSBC&rdquo;, &ldquo;optimization&rdquo;, or &ldquo;finance&rdquo;, or check your spelling.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Clear search
                </button>
                <span className="text-muted-foreground/40">•</span>
                <Link
                  href="/case-study"
                  onClick={closeSearch}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
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