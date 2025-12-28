import { WifiOff, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { pendingCount } = useOfflineStorage('registros_frequencia');
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track reconnection
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Don't show anything if online and no pending items
  if (isOnline && !isSlowConnection && pendingCount === 0 && !showReconnected) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
      >
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border",
            !isOnline && "bg-destructive/90 text-destructive-foreground border-destructive/50",
            isOnline && isSlowConnection && "bg-yellow-500/90 text-yellow-950 border-yellow-500/50",
            isOnline && pendingCount > 0 && "bg-primary/90 text-primary-foreground border-primary/50",
            showReconnected && "bg-green-500/90 text-white border-green-500/50"
          )}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Modo Offline</span>
            </>
          ) : showReconnected ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Conectado!</span>
            </>
          ) : isSlowConnection ? (
            <>
              <CloudOff className="w-4 h-4" />
              <span className="text-sm font-medium">Conexão Lenta</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Sincronizando {pendingCount} {pendingCount === 1 ? 'item' : 'itens'}...
              </span>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
