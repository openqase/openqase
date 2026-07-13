'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseSortPersistenceReturn<T> {
  sortBy: T;
  handleSortChange: (newSortBy: T) => void;
}

/**
 * Custom hook for managing sort state with localStorage persistence
 * 
 * @param storageKey - Unique key for localStorage (e.g., 'case-studies-sort')
 * @param defaultSort - Default sort option if no saved preference exists
 * @param validSortOptions - Array of valid sort options for validation
 * @returns Object containing sortBy state and change handler
 */
export function useSortPersistence<T extends string>(
  storageKey: string,
  defaultSort: T,
  validSortOptions: readonly T[]
): UseSortPersistenceReturn<T> {
  const [sortBy, setSortBy] = useState<T>(defaultSort);

  // Load sort preference from localStorage on mount
  useEffect(() => {
    try {
      const savedSortBy = localStorage.getItem(storageKey) as T;
      if (savedSortBy && validSortOptions.includes(savedSortBy)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSortBy(savedSortBy);
      }
    } catch (error) {
      // Graceful fallback if localStorage is unavailable (private browsing, etc.)
      console.warn('Failed to load sort preference from localStorage:', error);
    }
  }, [storageKey, validSortOptions]);

  // Save sort preference to localStorage when changed
  const handleSortChange = useCallback((newSortBy: T) => {
    setSortBy(newSortBy);
    try {
      localStorage.setItem(storageKey, newSortBy);
    } catch (error) {
      // Graceful fallback if localStorage is unavailable
      console.warn('Failed to save sort preference to localStorage:', error);
    }
  }, [storageKey]);

  return {
    sortBy,
    handleSortChange
  };
}