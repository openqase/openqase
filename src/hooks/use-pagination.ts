"use client";

import { useState, useMemo } from "react";

interface UsePaginationProps<T> {
  items: T[];
  pageSize?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
}

export function usePagination<T>({
  items,
  pageSize = 12,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevItems, setPrevItems] = useState(items);

  if (prevItems !== items) {
    setPrevItems(items);
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
  };
}
