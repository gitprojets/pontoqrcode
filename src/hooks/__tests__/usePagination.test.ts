import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePagination());
      
      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalPages).toBe(1);
    });

    it('should initialize with custom values', () => {
      const { result } = renderHook(() => 
        usePagination({ initialPage: 2, initialPageSize: 20, totalItems: 100 })
      );
      
      expect(result.current.currentPage).toBe(2);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.totalPages).toBe(5);
    });
  });

  describe('navigation', () => {
    it('should navigate to next page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 50 })
      );
      
      act(() => {
        result.current.nextPage();
      });
      
      expect(result.current.currentPage).toBe(2);
    });

    it('should not go past last page', () => {
      const { result } = renderHook(() => 
        usePagination({ initialPage: 5, totalItems: 50 })
      );
      
      act(() => {
        result.current.nextPage();
      });
      
      expect(result.current.currentPage).toBe(5);
    });

    it('should navigate to previous page', () => {
      const { result } = renderHook(() => 
        usePagination({ initialPage: 3, totalItems: 50 })
      );
      
      act(() => {
        result.current.prevPage();
      });
      
      expect(result.current.currentPage).toBe(2);
    });

    it('should not go before first page', () => {
      const { result } = renderHook(() => usePagination());
      
      act(() => {
        result.current.prevPage();
      });
      
      expect(result.current.currentPage).toBe(1);
    });

    it('should go to specific page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 100 })
      );
      
      act(() => {
        result.current.goToPage(5);
      });
      
      expect(result.current.currentPage).toBe(5);
    });

    it('should clamp page within valid range', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 50 })
      );
      
      act(() => {
        result.current.goToPage(100);
      });
      
      expect(result.current.currentPage).toBe(5); // Max page
      
      act(() => {
        result.current.goToPage(-5);
      });
      
      expect(result.current.currentPage).toBe(1); // Min page
    });
  });

  describe('page size', () => {
    it('should change page size and reset to first page', () => {
      const { result } = renderHook(() => 
        usePagination({ initialPage: 3, totalItems: 100 })
      );
      
      act(() => {
        result.current.setPageSize(25);
      });
      
      expect(result.current.pageSize).toBe(25);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(4);
    });
  });

  describe('pagination indicators', () => {
    it('should correctly indicate hasNextPage', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 30 })
      );
      
      expect(result.current.hasNextPage).toBe(true);
      
      act(() => {
        result.current.goToPage(3);
      });
      
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should correctly indicate hasPrevPage', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 30 })
      );
      
      expect(result.current.hasPrevPage).toBe(false);
      
      act(() => {
        result.current.nextPage();
      });
      
      expect(result.current.hasPrevPage).toBe(true);
    });
  });

  describe('data pagination', () => {
    it('should correctly paginate data array', () => {
      const { result } = renderHook(() => 
        usePagination({ initialPageSize: 3, totalItems: 10 })
      );
      
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      expect(result.current.paginatedData(data)).toEqual([1, 2, 3]);
      
      act(() => {
        result.current.nextPage();
      });
      
      expect(result.current.paginatedData(data)).toEqual([4, 5, 6]);
    });
  });

  describe('indices', () => {
    it('should calculate correct start and end indices', () => {
      const { result } = renderHook(() => 
        usePagination({ initialPageSize: 10, totalItems: 25 })
      );
      
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(10);
      
      act(() => {
        result.current.nextPage();
      });
      
      expect(result.current.startIndex).toBe(10);
      expect(result.current.endIndex).toBe(20);
      
      act(() => {
        result.current.nextPage();
      });
      
      expect(result.current.startIndex).toBe(20);
      expect(result.current.endIndex).toBe(25); // Clamped to totalItems
    });
  });

  describe('reset', () => {
    it('should reset to first page', () => {
      const { result } = renderHook(() => 
        usePagination({ initialPage: 5, totalItems: 100 })
      );
      
      act(() => {
        result.current.resetPage();
      });
      
      expect(result.current.currentPage).toBe(1);
    });
  });
});
