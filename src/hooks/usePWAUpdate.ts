import { useState, useEffect, useCallback } from 'react';

interface PWAUpdateState {
  needsUpdate: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function usePWAUpdate() {
  const [state, setState] = useState<PWAUpdateState>({
    needsUpdate: false,
    isUpdating: false,
    registration: null,
  });

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!state.registration) return;
    
    try {
      await state.registration.update();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, [state.registration]);

  // Apply update
  const applyUpdate = useCallback(() => {
    if (!state.registration?.waiting) return;
    
    setState(prev => ({ ...prev, isUpdating: true }));
    
    // Tell the waiting service worker to skip waiting
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [state.registration]);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    setState(prev => ({ ...prev, needsUpdate: false }));
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      // Service worker has taken control - reload to get new version
      window.location.reload();
    };

    const handleStateChange = (registration: ServiceWorkerRegistration) => {
      return () => {
        if (registration.waiting) {
          setState(prev => ({
            ...prev,
            needsUpdate: true,
            registration,
          }));
        }
      };
    };

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        setState(prev => ({ ...prev, registration }));

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setState(prev => ({ ...prev, needsUpdate: true }));
        }

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', handleStateChange(registration));
        });

        // Detect controller change (new SW took over)
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        // Check for updates every 5 minutes
        const intervalId = setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);

        return () => {
          clearInterval(intervalId);
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  return {
    needsUpdate: state.needsUpdate,
    isUpdating: state.isUpdating,
    applyUpdate,
    dismissUpdate,
    checkForUpdates,
  };
}
