import { useState, useEffect, useCallback } from 'react';

/**
 * useNetworkRecovery Hook
 * Monitors network status and provides callbacks for online/offline events.
 * Useful for re-syncing data or re-establishing connections when network comes back.
 *
 * @param {Function} onOnline - Callback function to execute when network comes online.
 * @param {Function} onOffline - Callback function to execute when network goes offline.
 */
const useNetworkRecovery = (onOnline, onOffline) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (onOnline) {
      onOnline();
    }
  }, [onOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    if (onOffline) {
      onOffline();
    }
  }, [onOffline]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline };
};

export default useNetworkRecovery;
