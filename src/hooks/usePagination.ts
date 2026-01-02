import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems?: number;
}

type UsePaginationReturn<T> = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  paginatedData: (data: T[]) => T[];
  resetPage: () => void;
};

export function usePagination<T = unknown>({
  initialPage = 1,
  initialPageSize = 10,
  totalItems = 0,
}: UsePaginationOptions = {}): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const startIndex = useMemo(() => 
    (currentPage - 1) * pageSize,
    [currentPage, pageSize]
  );

  const endIndex = useMemo(() => 
    Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const hasNextPage = useMemo(() => 
    currentPage < totalPages,
    [currentPage, totalPages]
  );

  const hasPrevPage = useMemo(() => 
    currentPage > 1,
    [currentPage]
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const paginatedData = useCallback((data: T[]): T[] => {
    return data.slice(startIndex, startIndex + pageSize);
  }, [startIndex, pageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    paginatedData,
    resetPage,
  };
}
