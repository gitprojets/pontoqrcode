import { useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineDB } from './useOfflineStorage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface SyncConfig {
  table: TableName;
  enabled?: boolean;
}

export function useOfflineSync(config: SyncConfig) {
  const { isOnline } = useNetworkStatus();
  const isSyncing = useRef(false);
  const lastSyncRef = useRef<number>(0);

  const syncPendingActions = useCallback(async () => {
    if (isSyncing.current || !isOnline) return;
    
    // Debounce syncs
    const now = Date.now();
    if (now - lastSyncRef.current < 5000) return;
    lastSyncRef.current = now;

    try {
      isSyncing.current = true;
      const pendingActions = await offlineDB.getPendingActions();
      const tableActions = pendingActions.filter(a => a.table === config.table);

      if (tableActions.length === 0) return;

      let syncedCount = 0;
      let errorCount = 0;

      for (const action of tableActions) {
        try {
          const data = action.data as Record<string, unknown>;
          const id = data.id as string;
          
          switch (action.type) {
            case 'create':
              // Use raw fetch for dynamic table insertion
              const { error: createError } = await supabase
                .from(config.table)
                .insert(data as never);
              if (createError) throw createError;
              break;
              
            case 'update':
              const { error: updateError } = await supabase
                .from(config.table)
                .update(data as never)
                .eq('id', id as never);
              if (updateError) throw updateError;
              break;
              
            case 'delete':
              const { error: deleteError } = await supabase
                .from(config.table)
                .delete()
                .eq('id', id as never);
              if (deleteError) throw deleteError;
              break;
          }

          await offlineDB.removePendingAction(action.id);
          syncedCount++;
        } catch (error) {
          console.error('Sync error for action:', action.id, error);
          errorCount++;
        }
      }

      if (syncedCount > 0) {
        toast.success(`${syncedCount} ${syncedCount === 1 ? 'registro sincronizado' : 'registros sincronizados'}!`);
      }

      if (errorCount > 0) {
        toast.error(`Falha ao sincronizar ${errorCount} ${errorCount === 1 ? 'registro' : 'registros'}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      isSyncing.current = false;
    }
  }, [isOnline, config.table]);

  // Sync when coming online
  useEffect(() => {
    if (isOnline && config.enabled !== false) {
      syncPendingActions();
    }
  }, [isOnline, syncPendingActions, config.enabled]);

  // Sync periodically when online
  useEffect(() => {
    if (!isOnline || config.enabled === false) return;

    const interval = setInterval(() => {
      syncPendingActions();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, syncPendingActions, config.enabled]);

  return {
    syncNow: syncPendingActions,
    isSyncing: isSyncing.current,
  };
}
