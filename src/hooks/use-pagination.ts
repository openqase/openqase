"use client";

import { useState, useMemo, useRef } from "react";

interface UsePaginationProps<T> {
  items: T[];
  pageSize?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePagination<T>({
  items,
  pageSize = 12,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const prevItemsRef = useRef(items);

  // Reset to page 1 when items change
  if (prevItemsRef.current !== items) {
    prevItemsRef.current = items;
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize],
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    goToNextPage: () => goToPage(currentPage + 1),
    goToPreviousPage: () => goToPage(currentPage - 1),
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}
