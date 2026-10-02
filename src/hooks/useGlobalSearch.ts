'use client';

import { useState, useMemo, useCallback } from 'react';
import { SearchableItem } from '@/lib/content-fetchers';
import { useDebounce } from './useDebounce';

export interface SearchResult {
  item: SearchableItem;
  relevanceScore: number;
}

export interface GroupedSearchResults {
  case_studies: SearchResult[];
  algorithms: SearchResult[];
  industries: SearchResult[];
  personas: SearchResult[];
  blog_posts: SearchResult[];
  quantum_software: SearchResult[];
  quantum_hardware: SearchResult[];
  quantum_companies: SearchResult[];
  partner_companies: SearchResult[];
}

/** Whether a raw input value should open the results dropdown. */
export function shouldOpenResults(value: string): boolean {
  return value.trim().length >= 2;
}

/**
 * Custom hook for global search functionality
 * Provides client-side search with debouncing and relevance scoring
 */
export function useGlobalSearch(searchData: SearchableItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Calculate relevance score for search results
  const calculateRelevance = useCallback((item: SearchableItem, query: string): number => {
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    // Title match (highest priority)
    if (item.title.toLowerCase().includes(normalizedQuery)) {
      score += item.title.toLowerCase().indexOf(normalizedQuery) === 0 ? 100 : 50;
    }

    // Description match
    if (item.description?.toLowerCase().includes(normalizedQuery)) {
      score += 25;
    }

    // Company match (for case studies)
    if (item.metadata.companies?.some(company => 
      company.toLowerCase().includes(normalizedQuery)
    )) {
      score += 30;
    }

    // Year match (exact)
    if (item.metadata.year?.toString() === query) {
      score += 20;
    }

    // Quantum advantage match (for algorithms)
    if (item.metadata.quantum_advantage?.toLowerCase().includes(normalizedQuery)) {
      score += 20;
    }

    // Use cases match (for algorithms)
    if (item.metadata.use_cases?.some(useCase => 
      useCase.toLowerCase().includes(normalizedQuery)
    )) {
      score += 15;
    }

    return score;
  }, []);

  // Perform client-side search with relevance scoring
  const searchResults = useMemo(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return {
        case_studies: [],
        algorithms: [],
        industries: [],
        personas: [],
        blog_posts: [],
        quantum_software: [],
        quantum_hardware: [],
        quantum_companies: [],
        partner_companies: []
      } as GroupedSearchResults;
    }

    const results: SearchResult[] = [];

    // Filter and score all items
    searchData.forEach(item => {
      const relevanceScore = calculateRelevance(item, trimmedQuery);
      if (relevanceScore > 0) {
        results.push({ item, relevanceScore });
      }
    });

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Group by content type
    const grouped: GroupedSearchResults = {
      case_studies: [],
      algorithms: [],
      industries: [],
      personas: [],
      blog_posts: [],
      quantum_software: [],
      quantum_hardware: [],
      quantum_companies: [],
      partner_companies: []
    };

    results.forEach(result => {
      if (grouped[result.item.type]) {
        grouped[result.item.type].push(result);
      }
    });

    return grouped;
  }, [searchData, debouncedSearchQuery, calculateRelevance]);

  // Get total result count
  const totalResults = useMemo(() => {
    return Object.values(searchResults).reduce((total, group) => total + group.length, 0);
  }, [searchResults]);

  // Handle search query change with debouncing logic
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setIsOpen(shouldOpenResults(query));
  }, []);

  // Close search results
  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsOpen(false);
  }, []);

  // Check if search is currently pending debounce
  const isSearching = searchQuery.trim().length >= 2 && searchQuery !== debouncedSearchQuery;

  return {
    searchQuery,
    debouncedSearchQuery,
    searchResults,
    totalResults,
    isOpen,
    isSearching,
    handleSearchChange,
    closeSearch,
    clearSearch
  };
}