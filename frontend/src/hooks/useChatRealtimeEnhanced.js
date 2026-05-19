import { useEffect, useRef, useCallback } from 'react';
import { getChatThreads } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { useChatStore } from '../store/appStore.js';
import logger from '../utils/logger.js';

/**
 * useChatRealtimeEnhanced Hook
 * 
 * تحسينات متقدمة بناءً على تقرير الفحص:
 * - حل مشكلة Memory Leaks عبر تنظيف دقيق للمستمعين والـ Timeouts.
 * - منع Reconnect Storms باستخدام Exponential Backoff مع Jitter.
 * - حل Race Conditions باستخدام Refs لتتبع الحالة اللحظية.
 */
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
  const messageQueueRef = useRef(new Map());
  const presenceTimeoutRef = useRef(new Map());

  useEffect(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);

  // تحميل خيوط المحادثات الأولية
  useEffect(() => {
    if (!currentUser || initialized) return undefined;
    let isMounted = true;

    const bootstrap = async () => {
      setLoadingThreads(true);
      try {
        const { data } = await getChatThreads({});
        if (!isMounted) return;
        hydrateThreads(Array.isArray(data) ? data : [], { replace: true });
      } catch (error) {
        logger.warn('chat threads bootstrap failed', { 
          detail: error?.response?.data?.detail || error?.message 
        });
      } finally {
        if (isMounted) setLoadingThreads(false);
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [currentUser, hydrateThreads, initialized, setLoadingThreads]);

  // معالج الرسائل الجديدة
  const handleNewMessage = useCallback((message) => {
    const participants = [message?.sender, message?.receiver];
    if (!participants.includes(currentUser)) return;
    
    const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
    
    applyIncomingMessage(message, currentUser, {
      skipUnreadIncrement: message?.sender !== currentUser && activePeerRef.current === peer,
    });

    if (message?.sender !== currentUser && activePeerRef.current === peer) {
      markThreadRead(peer);
    }
  }, [currentUser, applyIncomingMessage, markThreadRead]);

  const handleDelivered = useCallback((payload) => {
    if (payload?.sender !== currentUser || !payload?.viewer) return;
    updateMessageStatus(payload.viewer, payload.message_ids || [], 'delivered');
  }, [currentUser, updateMessageStatus]);

  const handleSeen = useCallback((payload) => {
    if (payload?.sender === currentUser && payload?.viewer) {
      updateMessageStatus(payload.viewer, payload.message_ids || [], 'seen');
    }
    if (payload?.viewer === currentUser && payload?.sender) {
      markThreadRead(payload.sender);
    }
  }, [currentUser, updateMessageStatus, markThreadRead]);

  const handlePresence = useCallback((payload) => {
    if (!payload?.user) return;
    
    if (presenceTimeoutRef.current.has(payload.user)) {
      clearTimeout(presenceTimeoutRef.current.get(payload.user));
    }

    setPresence(payload.user, payload);

    if (payload.is_typing) {
      const timeout = setTimeout(() => {
        setPresence(payload.user, { is_typing: false });
        presenceTimeoutRef.current.delete(payload.user);
      }, 3000);
      presenceTimeoutRef.current.set(payload.user, timeout);
    }
  }, [setPresence]);

  const handleTyping = useCallback((payload) => {
    if (!payload?.sender) return;
    setPresence(payload.sender, {
      is_typing: Boolean(payload?.is_typing),
      typing_updated_at: new Date().toISOString(),
    });
  }, [setPresence]);

  const handleConnect = useCallback(() => {
    logger.info('Socket connected, syncing state...');
    reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    socketManager.emit('register_user', { token, user: currentUser }, { skipSignature: true });
    socketManager.emit('sync_chat_state', { peer: activePeerRef.current || undefined });
  }, [token, currentUser]);

  const handleDisconnect = useCallback((reason) => {
    logger.warn('Socket disconnected', { reason });
    
    if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
      const attempts = reconnectAttemptsRef.current;
      // Exponential Backoff with Jitter to prevent Reconnect Storms
      const baseDelay = Math.min(30000, 1000 * Math.pow(2, attempts));
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      reconnectAttemptsRef.current += 1;
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        logger.info(`Attempting reconnect #${reconnectAttemptsRef.current} after ${Math.round(delay)}ms...`);
        socketManager.connect();
      }, delay);
    }
  }, []);

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
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe?.());
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      presenceTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      presenceTimeoutRef.current.clear();
    };
  }, [
    currentUser, 
    handleConnect, 
    handleDisconnect,
    handleNewMessage, 
    handleDelivered, 
    handleSeen, 
    handlePresence, 
    handleTyping
  ]);
}
