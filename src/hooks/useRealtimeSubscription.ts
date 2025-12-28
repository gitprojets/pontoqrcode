import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'registros_frequencia' | 'justificativas' | 'school_events' | 'support_tickets' | 'profiles' | 'unidades' | 'dispositivos';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  onInsert?: (payload: RealtimePayload) => void;
  onUpdate?: (payload: RealtimePayload) => void;
  onDelete?: (payload: RealtimePayload) => void;
  onChange?: (payload: RealtimePayload) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  table,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true
}: UseRealtimeSubscriptionOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handlePayload = useCallback((payload: RealtimePayload) => {
    console.log(`[Realtime] ${table} - ${payload.eventType}:`, payload);
    
    onChange?.(payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        onInsert?.(payload);
        break;
      case 'UPDATE':
        onUpdate?.(payload);
        break;
      case 'DELETE':
        onDelete?.(payload);
        break;
    }
  }, [table, onChange, onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table
        },
        (payload) => handlePayload(payload as unknown as RealtimePayload)
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${table} subscription status:`, status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from ${table}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, enabled, handlePayload]);

  return {
    channel: channelRef.current,
    isSubscribed: channelRef.current !== null
  };
}

// Hook for dashboard realtime updates - uses existing pattern from useDashboardStats
export function useDashboardRealtime(onUpdate: () => void, enabled = true) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`dashboard-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_frequencia' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unidades' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispositivos' }, onUpdate)
      .subscribe((status) => {
        console.log('[Dashboard Realtime] Status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, onUpdate]);

  return { isSubscribed: channelRef.current !== null };
}
