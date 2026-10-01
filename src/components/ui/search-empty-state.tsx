'use client';

import * as React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SearchEmptyStateProps {
  title?: string;
  query?: string;
  resourceName?: string;
  description?: string;
  hasFilters?: boolean;
  onClearSearch?: () => void;
  onClearAll?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

export function SearchEmptyState({
  title,
  query,
  resourceName = 'items',
  description,
  hasFilters = false,
  onClearSearch,
  onClearAll,
  actionLabel,
  onAction,
  suggestions,
  onSuggestionClick,
  className,
}: SearchEmptyStateProps) {
  const computedTitle = title || (
    query && hasFilters
      ? `No ${resourceName} found matching "${query}" with current filters`
      : query
      ? `No ${resourceName} found matching "${query}"`
      : hasFilters
      ? `No ${resourceName} found matching your filters`
      : `No ${resourceName} found`
  );

  const computedDescription = description || (
    query || hasFilters
      ? 'Try checking your spelling, using more general search terms, or clearing active filters.'
      : `Try adjusting your search criteria to find what you're looking for.`
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'text-center py-12 px-4 rounded-xl border border-dashed border-border bg-card/40 my-6 flex flex-col items-center justify-center max-w-2xl mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-muted/80 flex items-center justify-center mb-4 text-muted-foreground">
        <SearchX className="w-6 h-6" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1.5">
        {computedTitle}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {computedDescription}
      </p>

      {/* Suggestion pills if provided */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 max-w-md">
          <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick?.(suggestion)}
              className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onClearAll && hasFilters && query && (
          <Button
            variant="default"
            size="sm"
            onClick={onClearAll}
            className="gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters & search
          </Button>
        )}

        {onClearSearch && query && (
          <Button
            variant={onClearAll && hasFilters ? "outline" : "default"}
            size="sm"
            onClick={onClearSearch}
            className="gap-1.5"
          >
            Clear search
          </Button>
        )}

        {onClearAll && hasFilters && !query && (
          <Button
            variant="default"
            size="sm"
            onClick={onClearAll}
            className="gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset filters
          </Button>
        )}

        {onAction && actionLabel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
