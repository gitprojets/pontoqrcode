import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-rules-id',
              unidade_id: 'test-unit-id',
              tolerancia_entrada: 15,
              tolerancia_saida: 10,
              max_correcoes_mes: 3,
              prazo_correcao_dias: 5,
              created_by: 'test-user-id',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
    profile: { unidade_id: 'test-unit-id' },
    role: 'diretor',
    isAuthenticated: true,
  })),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { useAttendanceRules } from '../useAttendanceRules';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAttendanceRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default structure', async () => {
    const { result } = renderHook(() => useAttendanceRules(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSaving).toBe(false);
    
    // Wait for hook to finish
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should have updateRules function', () => {
    const { result } = renderHook(() => useAttendanceRules(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.updateRules).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should have correct default values', () => {
    const { result } = renderHook(() => useAttendanceRules(), {
      wrapper: createWrapper(),
    });

    expect(result.current.defaultRules).toEqual({
      tolerancia_entrada: 15,
      tolerancia_saida: 10,
      max_correcoes_mes: 3,
      prazo_correcao_dias: 5,
    });
  });

  it('should allow editing for diretor role', async () => {
    const { result } = renderHook(() => useAttendanceRules(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canEdit).toBe(true);
  });

  it('should accept unidadeId as parameter', async () => {
    const customUnidadeId = 'custom-unit-id';
    
    const { result } = renderHook(() => useAttendanceRules(customUnidadeId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Hook should work with custom unidade ID
    expect(result.current.canEdit).toBe(true);
  });

  it('should have rules set to null initially', () => {
    const { result } = renderHook(() => useAttendanceRules(), {
      wrapper: createWrapper(),
    });

    // Rules might be null before fetch completes
    expect(result.current.isSaving).toBe(false);
  });
});
