import { useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import socket from '../api/socket.js';

export default function useNetworkStatus() {
  const setOnlineStatus = useAppStore((state) => state.setOnlineStatus);

  useEffect(() => {
    const updateStatus = (online) => {
      setOnlineStatus(Boolean(online));
      if (online) {
        if (!socket.connected) socket.connect();
        return;
      }
      if (socket.connected) socket.disconnect();
    };

    updateStatus(typeof navigator === 'undefined' ? true : navigator.onLine);

    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);
}
