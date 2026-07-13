'use client';

import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'grid' | 'list';

interface UseViewSwitcherReturn {
  viewMode: ViewMode;
  handleViewModeChange: (newViewMode: ViewMode) => void;
}

/**
 * Custom hook for managing view mode state with localStorage persistence
 * 
 * @param storageKey - Unique key for localStorage (e.g., 'case-studies-view-mode')
 * @param defaultView - Default view mode if no saved preference exists
 * @returns Object containing viewMode state and change handler
 */
export function useViewSwitcher(
  storageKey: string, 
  defaultView: ViewMode = 'grid'
): UseViewSwitcherReturn {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Load view preference from localStorage on mount
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem(storageKey) as ViewMode;
      if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewMode(savedViewMode);
      }
    } catch (error) {
      // Graceful fallback if localStorage is unavailable (private browsing, etc.)
      console.warn('Failed to load view preference from localStorage:', error);
    }
  }, [storageKey]);

  // Save view preference to localStorage when changed
  const handleViewModeChange = useCallback((newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    try {
      localStorage.setItem(storageKey, newViewMode);
    } catch (error) {
      // Graceful fallback if localStorage is unavailable
      console.warn('Failed to save view preference to localStorage:', error);
    }
  }, [storageKey]);

  return {
    viewMode,
    handleViewModeChange
  };
}