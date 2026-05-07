import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import socket from '../api/socket.js';
import { clearStoredUser } from '../utils/auth.js';
import { useAppStore } from '../store/appStore.js';
import logger from '../utils/logger.js';

const RealtimeContext = createContext({
  socket,
  connected: false,
  socketId: '',
});

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const loginPath = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
  if (window.location.pathname !== loginPath) window.location.href = loginPath;
}

export function RealtimeProvider({ children }) {
  const session = useAppStore((state) => state.session);
  const [connected, setConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState(socket.id || '');

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setSocketId(socket.id || '');
    };
    const handleDisconnect = () => {
      setConnected(false);
      setSocketId('');
    };
    const handleAuthExpired = () => {
      logger.warn('realtime auth expired, clearing session');
      clearStoredUser();
      redirectToLogin();
    };

    const disposeConnect = socket.on('connect', handleConnect);
    const disposeDisconnect = socket.on('disconnect', handleDisconnect);
    const disposeAuthExpired = socket.on('auth_expired', handleAuthExpired);

    return () => {
      disposeConnect?.();
      disposeDisconnect?.();
      disposeAuthExpired?.();
    };
  }, []);

  useEffect(() => {
    if (session?.access_token || session?.token) {
      socket.syncAuth();
      socket.connect();
      return undefined;
    }
    socket.disconnect();
    return undefined;
  }, [session?.access_token, session?.token, session?.username, session?.role]);

  const value = useMemo(() => ({ socket, connected, socketId }), [connected, socketId]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

export default RealtimeProvider;
