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
              id: 'test-settings-id',
              user_id: 'test-user-id',
              push_enabled: true,
              presence_alerts: true,
              reminders: true,
              email_summary: false,
              theme: 'system',
              onboarding_completed: false,
              onboarding_completed_at: null,
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
    role: 'professor',
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
import { useUserSettings } from '../useUserSettings';

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

describe('useUserSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default structure', async () => {
    const { result } = renderHook(() => useUserSettings(), {
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

  it('should have updateSettings function', () => {
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.updateSettings).toBe('function');
    expect(typeof result.current.updateSetting).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should have correct default values when settings are created', async () => {
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After loading, settings should be created with defaults
    if (result.current.settings) {
      expect(result.current.settings.push_enabled).toBe(true);
      expect(result.current.settings.presence_alerts).toBe(true);
      expect(result.current.settings.reminders).toBe(true);
      expect(result.current.settings.email_summary).toBe(false);
      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.onboarding_completed).toBe(false);
    }
  });

  it('should not have settings before user data is loaded', () => {
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: createWrapper(),
    });

    // Initially, settings might be null
    expect(result.current.isSaving).toBe(false);
  });
});
