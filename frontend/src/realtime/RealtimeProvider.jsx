import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import socket from '../api/socket.js';
import sessionManager from '../auth/sessionManager.js';
import { clearStoredUser } from '../utils/auth.js';
import { useAppStore } from '../store/appStore.js';
import logger from '../utils/logger.js';
import { getCurrentAppPathname, redirectToAppPath } from '../utils/router.js';

const RealtimeContext = createContext({
  socket,
  connected: false,
  socketId: '',
  reconnecting: false,
  lastError: '',
});

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const currentPath = getCurrentAppPathname();
  const loginPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login';
  redirectToAppPath(loginPath);
}

export function RealtimeProvider({ children }) {
  const session = useAppStore((state) => state.session);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const [connected, setConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState(socket.id || '');
  const [reconnecting, setReconnecting] = useState(false);
  const [lastError, setLastError] = useState('');
  const recoveringAuthRef = useRef(false);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setSocketId(socket.id || '');
      setReconnecting(false);
      setLastError('');
    };

    const handleDisconnect = () => {
      setConnected(false);
      setSocketId('');
    };

    const handleAuthExpired = async () => {
      if (recoveringAuthRef.current) return;
      recoveringAuthRef.current = true;

      try {
        logger.warn?.('realtime auth expired, attempting recovery');
        await sessionManager.refreshSession({ reason: 'socket_auth_expired', force: true });
        socket.syncAuth();
        socket.connect();
      } catch (error) {
        logger.warn?.('realtime auth recovery failed, clearing session', {
          detail: error?.message || 'socket_auth_expired',
        });
        clearStoredUser();
        redirectToLogin();
      } finally {
        recoveringAuthRef.current = false;
      }
    };

    const handleSocketState = (event) => {
      const detail = event?.detail || {};
      if (typeof detail.connected === 'boolean') setConnected(detail.connected);
      if (typeof detail.reconnecting === 'boolean') setReconnecting(detail.reconnecting);
      if (typeof detail.error === 'string' && detail.error) setLastError(detail.error);
      if (typeof detail.id === 'string') setSocketId(detail.id);
    };

    const handleChatResyncRequested = (event) => {
      const detail = event?.detail || {};
      if (!(session?.access_token || session?.token)) return;
      socket.syncAuth();
      socket.connect();
      if (detail?.peer) {
        socket.emit('sync_chat_state', { peer: detail.peer });
      }
    };

    const disposeConnect = socket.on('connect', handleConnect);
    const disposeDisconnect = socket.on('disconnect', handleDisconnect);
    const disposeAuthExpired = socket.on('auth_expired', handleAuthExpired);

    if (typeof window !== 'undefined') {
      window.addEventListener('yamshat:socket-state', handleSocketState);
      window.addEventListener('yamshat:auth-expired', handleAuthExpired);
      window.addEventListener('yamshat:chat-resync-requested', handleChatResyncRequested);
    }

    return () => {
      disposeConnect?.();
      disposeDisconnect?.();
      disposeAuthExpired?.();
      if (typeof window !== 'undefined') {
        window.removeEventListener('yamshat:socket-state', handleSocketState);
        window.removeEventListener('yamshat:auth-expired', handleAuthExpired);
        window.removeEventListener('yamshat:chat-resync-requested', handleChatResyncRequested);
      }
    };
  }, [session?.access_token, session?.token]);

  useEffect(() => {
    if (session?.access_token || session?.token) {
      socket.syncAuth();
      socket.connect();
      return undefined;
    }
    socket.disconnect();
    return undefined;
  }, [session?.access_token, session?.token, session?.username, session?.role]);

  const value = useMemo(
    () => ({ socket, connected, socketId, reconnecting, lastError, queuedCount: queuedActions.length }),
    [connected, socketId, reconnecting, lastError, queuedActions.length],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

export default RealtimeProvider;
