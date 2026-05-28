import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import socket from '../api/socket.js';
import { clearStoredUser } from '../utils/auth.js';
import { useAppStore } from '../store/appStore.js';
import logger from '../utils/logger.js';
import { getCurrentAppPathname, redirectToAppPath } from '../utils/router.js';

const RealtimeContext = createContext({
  socket,
  connected: false,
  reconnecting: false,
  socketId: '',
  latencyMs: null,
  lastSyncAt: null,
  outboxSize: 0,
});

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const currentPath = getCurrentAppPathname();
  const loginPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login';
  redirectToAppPath(loginPath);
}

export function RealtimeProvider({ children }) {
  const session = useAppStore((state) => state.session);
  const isOnline = useAppStore((state) => state.isOnline);
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);
  const [socketId, setSocketId] = useState(socket.id || '');
  const [latencyMs, setLatencyMs] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [outboxSize, setOutboxSize] = useState(0);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setReconnecting(false);
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

    const handleSocketState = (event) => {
      const detail = event?.detail || {};
      if (typeof detail.connected === 'boolean') setConnected(detail.connected);
      if (typeof detail.reconnecting === 'boolean') setReconnecting(detail.reconnecting);
      if (typeof detail.id === 'string') setSocketId(detail.id);
      if (Object.prototype.hasOwnProperty.call(detail, 'latencyMs')) setLatencyMs(detail.latencyMs ?? null);
    };

    const handleHeartbeat = (event) => {
      const detail = event?.detail || {};
      setLatencyMs(detail.latencyMs ?? null);
    };

    const handleChatSync = (event) => {
      const detail = event?.detail || {};
      setLastSyncAt(detail.at || null);
    };

    const handleOutbox = (event) => {
      const detail = event?.detail || {};
      setOutboxSize(Number(detail.size || 0));
    };

    const disposeConnect = socket.on('connect', handleConnect);
    const disposeDisconnect = socket.on('disconnect', handleDisconnect);
    const disposeAuthExpired = socket.on('auth_expired', handleAuthExpired);

    if (typeof window !== 'undefined') {
      window.addEventListener('yamshat:socket-state', handleSocketState);
      window.addEventListener('yamshat:socket-heartbeat', handleHeartbeat);
      window.addEventListener('yamshat:chat-sync', handleChatSync);
      window.addEventListener('yamshat:socket-outbox', handleOutbox);
    }

    return () => {
      disposeConnect?.();
      disposeDisconnect?.();
      disposeAuthExpired?.();
      if (typeof window !== 'undefined') {
        window.removeEventListener('yamshat:socket-state', handleSocketState);
        window.removeEventListener('yamshat:socket-heartbeat', handleHeartbeat);
        window.removeEventListener('yamshat:chat-sync', handleChatSync);
        window.removeEventListener('yamshat:socket-outbox', handleOutbox);
      }
    };
  }, []);

  useEffect(() => {
    if ((session?.access_token || session?.token) && isOnline) {
      socket.syncAuth();
      socket.connect();
      return undefined;
    }
    socket.disconnect();
    setConnected(false);
    setReconnecting(false);
    return undefined;
  }, [session?.access_token, session?.token, session?.username, session?.role, isOnline]);

  const value = useMemo(() => ({
    socket,
    connected,
    reconnecting,
    socketId,
    latencyMs,
    lastSyncAt,
    outboxSize,
  }), [connected, reconnecting, socketId, latencyMs, lastSyncAt, outboxSize]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

export default RealtimeProvider;
