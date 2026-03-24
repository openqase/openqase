'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useCallback } from 'react';

export interface FilterOption {
  id: string;
  name: string;
  count: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FacetedFiltersProps {
  groups: FilterGroup[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (groupKey: string, optionId: string, checked: boolean) => void;
  onClearAll: () => void;
}

const MAX_VISIBLE = 5;

export function FacetedFilters({ groups, activeFilters, onFilterChange, onClearAll }: FacetedFiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Clear all filters
        </button>
      )}

      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        const visibleOptions = isExpanded ? group.options : group.options.slice(0, MAX_VISIBLE);
        const hasMore = group.options.length > MAX_VISIBLE;

        return (
          <div key={group.key} role="group" aria-labelledby={`filter-group-${group.key}`}>
            <div
              id={`filter-group-${group.key}`}
              className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground mb-3"
            >
              {group.label}
            </div>
            <div className="space-y-2">
              {visibleOptions.map((option) => {
                const isChecked = (activeFilters[group.key] || []).includes(option.id);
                return (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-${group.key}-${option.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        onFilterChange(group.key, option.id, checked === true);
                      }}
                    />
                    <Label
                      htmlFor={`filter-${group.key}-${option.id}`}
                      className="text-sm flex-1 cursor-pointer leading-tight"
                    >
                      {option.name}
                    </Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {option.count}
                    </span>
                  </div>
                );
              })}
            </div>
            {hasMore && (
              <button
                onClick={() => toggleExpanded(group.key)}
                className="text-xs font-semibold text-primary hover:underline mt-2"
              >
                {isExpanded ? 'Show less' : `Show ${group.options.length - MAX_VISIBLE} more`}
              </button>
            )}
            {group !== groups[groups.length - 1] && (
              <hr className="border-border mt-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}
