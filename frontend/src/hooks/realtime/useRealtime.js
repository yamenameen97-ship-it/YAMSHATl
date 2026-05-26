import { useCallback, useEffect } from 'react';
import socketManager from '../../services/socketManager.js';
import { useRealtime as useRealtimeContext } from '../../realtime/RealtimeProvider.jsx';

/**
 * Compatibility hook يعتمد على المزود المركزي RealtimeProvider
 * بدل إنشاء listeners / queues إضافية داخل كل شاشة.
 */
export const useRealtime = (event, callback) => {
  const realtime = useRealtimeContext();

  useEffect(() => {
    if (!event || !callback) return undefined;
    const unsubscribe = socketManager.on(event, callback);
    return () => unsubscribe?.();
  }, [event, callback]);

  const emitWithRetry = useCallback((eventName, payload = {}, options = {}) => (
    socketManager.emit(eventName, payload, { queue: true, ...(options || {}) })
  ), []);

  const updatePresence = useCallback((status, extra = {}) => {
    socketManager.emit('presence_update', { status, ...(extra || {}) }, { queue: false });
  }, []);

  return {
    isConnected: Boolean(realtime.connected),
    isOffline: typeof navigator === 'undefined' ? false : !navigator.onLine,
    presence: [],
    reconnecting: Boolean(realtime.reconnecting),
    latencyMs: realtime.latencyMs ?? null,
    outboxSize: Number(realtime.outboxSize || 0),
    socket: realtime.socket,
    emitWithRetry,
    updatePresence,
  };
};

export default useRealtime;
