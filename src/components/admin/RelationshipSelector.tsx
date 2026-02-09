'use client';

import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X, Search, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Item {
  id: string;
  [key: string]: any;
}

interface RelationshipSelectorProps {
  items: Item[];
  selectedItems: string[];
  onChange: (selectedItems: string[]) => void;
  itemLabelKey?: string;
  itemValueKey?: string;
  label: string;
  placeholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxItems?: number;
}

/**
 * RelationshipSelector Component
 * 
 * A component for selecting relationships with other content types.
 * 
 * @param items - Array of items to select from
 * @param selectedItems - Array of selected item values
 * @param onChange - Function to call when selection changes
 * @param itemLabelKey - Key to use for item labels (default: 'name')
 * @param itemValueKey - Key to use for item values (default: 'id')
 * @param label - Label for the selector
 * @param placeholder - Placeholder text when no items are selected
 * @param emptyMessage - Message to show when no items match the search
 * @param required - Whether the field is required
 * @param disabled - Whether the selector is disabled
 * @param className - Additional CSS classes
 * @param maxItems - Maximum number of items that can be selected
 */
export function RelationshipSelector({
  items,
  selectedItems,
  onChange,
  itemLabelKey = 'name',
  itemValueKey = 'id',
  label,
  placeholder = 'Select items...',
  emptyMessage = 'No items found.',
  required = false,
  disabled = false,
  className,
  maxItems
}: RelationshipSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Memoize filtered items — only recomputes when search, items, or label key changes
  const filteredItems = useMemo(() => {
    if (!searchValue) return items;
    const lower = searchValue.toLowerCase();
    return items.filter(item =>
      String(item[itemLabelKey]).toLowerCase().includes(lower)
    );
  }, [searchValue, items, itemLabelKey]);

  // Memoize selected items data — only recomputes when selection changes
  const selectedItemsData = useMemo(() =>
    items.filter(item => selectedItems.includes(item[itemValueKey])),
    [items, selectedItems, itemValueKey]
  );
  
  const handleSelect = (value: string) => {
    if (selectedItems.includes(value)) {
      // Remove item if already selected
      onChange(selectedItems.filter(item => item !== value));
    } else {
      // Add item if not at max capacity
      if (maxItems && selectedItems.length >= maxItems) {
        return;
      }
      onChange([...selectedItems, value]);
    }
  };
  
  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedItems.filter(item => item !== value));
  };


  const handleSelectAll = () => {
    const allItemIds = items.map(item => item[itemValueKey]);
    onChange(allItemIds);
  };

  const handleSelectNone = () => {
    onChange([]);
  };
  
  const isMaxReached = maxItems ? selectedItems.length >= maxItems : false;
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
          <div className="text-xs text-muted-foreground space-x-2">
            <button 
              type="button" 
              className="hover:underline" 
              onClick={handleSelectAll}
              disabled={disabled}
            >
              Select All
            </button>
            <span>|</span>
            <button 
              type="button" 
              className="hover:underline" 
              onClick={handleSelectNone}
              disabled={disabled}
            >
              None
            </button>
          </div>
        </div>
        {maxItems && (
          <div className="text-xs text-muted-foreground">
            {selectedItems.length}/{maxItems} selected
          </div>
        )}
      </div>

      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between h-auto min-h-10 py-2',
              !selectedItems.length && 'text-muted-foreground'
            )}
            disabled={disabled || isMaxReached}
            onClick={() => {
              if (items.length === 0) {
                console.warn(`No items available for "${label}" selector`);
              }
            }}
          >
            <div className="flex flex-wrap gap-1 mr-2">
              {selectedItems.length > 0 ? (
                selectedItemsData.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedItemsData.map(item => (
                      <Badge
                        key={item[itemValueKey]}
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {item[itemLabelKey]}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  `${selectedItems.length} selected`
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 bg-white dark:bg-gray-900 border border-border shadow-lg"
          align="start"
          sideOffset={4}
        >
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            
            {items.length === 0 ? (
              <div className="py-6 text-center text-sm">
                <div className="mb-2 text-muted-foreground">No items available</div>
                <div className="text-xs text-muted-foreground">
                  Please add some {label.toLowerCase()} first
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm">
                <div className="text-muted-foreground">{emptyMessage}</div>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-1">
                  {filteredItems.map(item => (
                    <div
                      key={item[itemValueKey]}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        selectedItems.includes(item[itemValueKey]) && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(item[itemValueKey])}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedItems.includes(item[itemValueKey])
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <span>{item[itemLabelKey]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </PopoverContent>
      </Popover>
      
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {selectedItemsData.map(item => (
            <Badge
              key={item[itemValueKey]}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 rounded-md"
            >
              {item[itemLabelKey]}
              <X
                className="h-3.5 w-3.5 cursor-pointer ml-1 hover:text-destructive"
                onClick={(e) => handleRemove(item[itemValueKey], e)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default RelationshipSelector;