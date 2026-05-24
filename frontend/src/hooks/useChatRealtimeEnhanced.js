import { useEffect, useRef, useCallback } from 'react';
import { getChatThreads } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { useChatStore } from '../store/appStore.js';
import logger from '../utils/logger.js';
import {
  markPendingAck,
  persistConversationSnapshot,
  resolvePendingAck,
} from '../features/chat/chatReliability.js';

const RESYNC_INTERVAL_MS = 15_000;
const TYPING_TTL_MS = 3_200;

function emitWindowEvent(name, detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export default function useChatRealtimeEnhanced() {
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const initialized = useChatStore((state) => state.initialized);
  const activePeer = useChatStore((state) => state.activePeer);
  const hydrateThreads = useChatStore((state) => state.hydrateThreads);
  const applyIncomingMessage = useChatStore((state) => state.applyIncomingMessage);
  const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);
  const setPresence = useChatStore((state) => state.setPresence);
  const markThreadRead = useChatStore((state) => state.markThreadRead);
  const setLoadingThreads = useChatStore((state) => state.setLoadingThreads);

  const activePeerRef = useRef(activePeer);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const presenceTimeoutRef = useRef(new Map());
  const lastResyncAtRef = useRef(0);

  useEffect(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);

  useEffect(() => {
    if (!currentUser || initialized) return undefined;
    let active = true;

    const bootstrap = async () => {
      setLoadingThreads(true);
      try {
        const { data } = await getChatThreads({});
        if (!active) return;
        hydrateThreads(Array.isArray(data) ? data : [], { replace: true });
      } catch (error) {
        logger.warn('chat threads bootstrap failed', {
          detail: error?.response?.data?.detail || error?.message,
        });
      } finally {
        if (active) setLoadingThreads(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [currentUser, hydrateThreads, initialized, setLoadingThreads]);

  const resyncActivePeer = useCallback((reason = 'manual') => {
    if (!currentUser || !activePeerRef.current) return;
    const now = Date.now();
    if (reason !== 'connect' && now - lastResyncAtRef.current < 1200) return;
    lastResyncAtRef.current = now;
    socketManager.emit('sync_chat_state', { peer: activePeerRef.current });
    emitWindowEvent('yamshat:chat-resync-requested', {
      peer: activePeerRef.current,
      reason,
      at: new Date(now).toISOString(),
    });
  }, [currentUser]);

  const handleNewMessage = useCallback((message) => {
    const participants = [message?.sender, message?.receiver];
    if (!participants.includes(currentUser)) return;

    const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
    const normalizedStatus = message?.sender === currentUser
      ? (message?.status || (message?.is_seen ? 'seen' : message?.is_delivered ? 'delivered' : 'sent'))
      : (message?.status || 'delivered');

    applyIncomingMessage({ ...message, status: normalizedStatus }, currentUser, {
      skipUnreadIncrement: message?.sender !== currentUser && activePeerRef.current === peer,
    });

    persistConversationSnapshot(currentUser, peer, {
      messages: [{ ...message, status: normalizedStatus }],
    });

    if (message?.client_id) {
      markPendingAck(currentUser, peer, {
        client_id: message.client_id,
        created_at: message.created_at,
        status: normalizedStatus,
        id: message.id,
      });
      if (message?.sender === currentUser) {
        resolvePendingAck(currentUser, message.client_id);
      }
    }

    if (message?.sender !== currentUser && activePeerRef.current === peer) {
      markThreadRead(peer);
      resyncActivePeer('incoming-message');
    }
  }, [applyIncomingMessage, currentUser, markThreadRead, resyncActivePeer]);

  const handleDelivered = useCallback((payload) => {
    if (payload?.sender !== currentUser || !payload?.viewer) return;
    updateMessageStatus(payload.viewer, payload.message_ids || [], 'delivered');
    (payload?.client_ids || []).forEach((clientId) => resolvePendingAck(currentUser, clientId));
    emitWindowEvent('yamshat:delivery-ack', payload);
  }, [currentUser, updateMessageStatus]);

  const handleSeen = useCallback((payload) => {
    if (payload?.sender === currentUser && payload?.viewer) {
      updateMessageStatus(payload.viewer, payload.message_ids || [], 'seen');
    }
    if (payload?.viewer === currentUser && payload?.sender) {
      markThreadRead(payload.sender);
    }
    (payload?.client_ids || []).forEach((clientId) => resolvePendingAck(currentUser, clientId));
    emitWindowEvent('yamshat:seen-ack', payload);
  }, [currentUser, markThreadRead, updateMessageStatus]);

  const handlePresence = useCallback((payload) => {
    if (!payload?.user) return;

    if (presenceTimeoutRef.current.has(payload.user)) {
      clearTimeout(presenceTimeoutRef.current.get(payload.user));
      presenceTimeoutRef.current.delete(payload.user);
    }

    setPresence(payload.user, payload);

    if (payload.is_typing || payload.is_recording) {
      const timeout = window.setTimeout(() => {
        setPresence(payload.user, { is_typing: false, is_recording: false });
        presenceTimeoutRef.current.delete(payload.user);
      }, TYPING_TTL_MS);
      presenceTimeoutRef.current.set(payload.user, timeout);
    }
  }, [setPresence]);

  const handleTyping = useCallback((payload) => {
    if (!payload?.sender) return;
    handlePresence({
      user: payload.sender,
      is_typing: Boolean(payload?.is_typing),
      typing_updated_at: new Date().toISOString(),
    });
  }, [handlePresence]);

  const handleConnect = useCallback(() => {
    logger.info('socket connected, chat resync start');
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    socketManager.emit('register_user', { token, user: currentUser }, { skipSignature: true });
    resyncActivePeer('connect');
    emitWindowEvent('yamshat:chat-realtime-connected', {
      user: currentUser,
      socketId: socketManager.id,
    });
  }, [currentUser, resyncActivePeer, token]);

  const handleDisconnect = useCallback((reason) => {
    logger.warn('socket disconnected', { reason });

    if (!getAuthToken()) return;

    const transientReasons = new Set([
      'io server disconnect',
      'transport close',
      'ping timeout',
      'transport error',
    ]);

    if (!transientReasons.has(reason)) return;

    const attempts = reconnectAttemptsRef.current;
    const baseDelay = Math.min(30_000, 1_000 * (2 ** attempts));
    const jitter = Math.floor(Math.random() * 900);
    const delay = baseDelay + jitter;
    reconnectAttemptsRef.current += 1;

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      logger.info('socket reconnect scheduled', {
        attempt: reconnectAttemptsRef.current,
        delay,
      });
      socketManager.connect();
      resyncActivePeer('scheduled-reconnect');
    }, delay);
  }, [resyncActivePeer]);

  useEffect(() => {
    if (!currentUser) return undefined;

    socketManager.connect();

    const unsubscribers = [
      socketManager.on('connect', handleConnect),
      socketManager.on('disconnect', handleDisconnect),
      socketManager.on('new_private_message', handleNewMessage),
      socketManager.on('messages_delivered', handleDelivered),
      socketManager.on('messages_seen', handleSeen),
      socketManager.on('presence_update', handlePresence),
      socketManager.on('typing_update', handleTyping),
      socketManager.on('recording_update', handlePresence),
    ];

    const handleOnline = () => {
      socketManager.connect();
      resyncActivePeer('online');
    };
    const handleFocus = () => resyncActivePeer('focus');
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') resyncActivePeer('visibility');
    };
    const resyncTimer = window.setInterval(() => resyncActivePeer('interval'), RESYNC_INTERVAL_MS);

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      window.clearInterval(resyncTimer);
      presenceTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      presenceTimeoutRef.current.clear();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    currentUser,
    handleConnect,
    handleDelivered,
    handleDisconnect,
    handleNewMessage,
    handlePresence,
    handleSeen,
    handleTyping,
    resyncActivePeer,
  ]);
}
