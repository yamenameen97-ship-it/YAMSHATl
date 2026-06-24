import { useCallback, useEffect, useRef } from 'react';
import { getChatThreads, getMessages, markMessagesSeen } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { useChatStore } from '../store/appStore.js';
import logger from '../utils/logger.js';

/**
 * useChatRealtimeEnhanced Hook
 *
 * إنتاجي أكثر من النسخة القديمة:
 * - warm start من local persistence
 * - resync بعد reconnect / focus / online
 * - dedupe للرسائل وتثبيت read receipts
 * - التخلص من reconnect storms والاعتماد على socket.io manager
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
  const replaceConversationMessages = useChatStore((state) => state.replaceConversationMessages);
  const queuePendingReceipt = useChatStore((state) => state.queuePendingReceipt);
  const flushPendingReceipts = useChatStore((state) => state.flushPendingReceipts);
  const setSyncing = useChatStore((state) => state.setSyncing);
  const setLastSyncAt = useChatStore((state) => state.setLastSyncAt);

  const activePeerRef = useRef(activePeer);
  const currentUserRef = useRef(currentUser);
  const syncAbortRef = useRef(null);
  const typingTimeoutsRef = useRef(new Map());
  const bootstrapUserRef = useRef('');
  const syncingRef = useRef(false);

  useEffect(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const clearTypingTimeout = useCallback((username) => {
    const timeout = typingTimeoutsRef.current.get(username);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeoutsRef.current.delete(username);
    }
  }, []);

  const syncChatState = useCallback(async ({ includeActivePeer = true, reason = 'manual' } = {}) => {
    if (!currentUserRef.current || syncingRef.current) return;

    syncingRef.current = true;
    setSyncing(true);

    if (syncAbortRef.current) {
      syncAbortRef.current.abort();
    }

    const controller = new AbortController();
    syncAbortRef.current = controller;

    try {
      const activePeerUsername = includeActivePeer ? activePeerRef.current : null;
      const jobs = [
        getChatThreads({ signal: controller.signal }),
        activePeerUsername
          ? getMessages(activePeerUsername, 80, undefined, { signal: controller.signal })
          : Promise.resolve(null),
      ];

      const [threadsResponse, messagesResponse] = await Promise.all(jobs);
      if (controller.signal.aborted) return;

      const threads = Array.isArray(threadsResponse?.data) ? threadsResponse.data : [];
      hydrateThreads(threads, { replace: true });

      if (activePeerUsername) {
        const messageItems = Array.isArray(messagesResponse?.data?.items)
          ? messagesResponse.data.items
          : Array.isArray(messagesResponse?.data)
            ? messagesResponse.data
            : [];

        if (messageItems.length) {
          replaceConversationMessages(activePeerUsername, messageItems, {
            hasMore: Boolean(messagesResponse?.data?.has_more),
            oldestMessageId: messagesResponse?.data?.oldest_message_id,
            limit: 250,
          });
        }
      }

      const syncedAt = new Date().toISOString();
      setLastSyncAt(syncedAt);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yamshat:chat-sync', {
          detail: { at: syncedAt, reason },
        }));
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        logger.warn('chat sync failed', {
          reason,
          detail: error?.response?.data?.detail || error?.message,
        });
      }
    } finally {
      if (syncAbortRef.current === controller) {
        syncAbortRef.current = null;
      }
      syncingRef.current = false;
      setSyncing(false);
      setLoadingThreads(false);
    }
  }, [hydrateThreads, replaceConversationMessages, setLastSyncAt, setLoadingThreads, setSyncing]);

  const flushSeenReceipts = useCallback(async () => {
    const { pendingReceiptsByPeer } = useChatStore.getState();
    const peers = Object.entries(pendingReceiptsByPeer || {});
    if (!peers.length) return;

    await Promise.all(peers.map(async ([peer, bucket]) => {
      if (!bucket?.seen?.length) return;
      try {
        await markMessagesSeen(peer);
        flushPendingReceipts(peer, 'seen', bucket.seen);
        markThreadRead(peer);
      } catch (error) {
        logger.warn('failed to flush pending seen receipts', {
          peer,
          detail: error?.response?.data?.detail || error?.message,
        });
      }
    }));
  }, [flushPendingReceipts, markThreadRead]);

  const markPeerSeen = useCallback(async (peer, messageIds = []) => {
    if (!peer || !messageIds.length) return;
    queuePendingReceipt(peer, messageIds, 'seen');
    markThreadRead(peer);

    try {
      await markMessagesSeen(peer);
      flushPendingReceipts(peer, 'seen', messageIds);
    } catch (error) {
      logger.warn('mark seen deferred to retry queue', {
        peer,
        detail: error?.response?.data?.detail || error?.message,
      });
    }
  }, [flushPendingReceipts, markThreadRead, queuePendingReceipt]);

  const handleNewMessage = useCallback((message) => {
    const activeUser = currentUserRef.current;
    const participants = [message?.sender, message?.receiver];
    if (!activeUser || !participants.includes(activeUser)) return;

    const peer = message?.sender === activeUser ? message?.receiver : message?.sender;
    const isActivePeer = activePeerRef.current === peer;
    const messageId = message?.id ?? message?.message_id ?? message?.client_id;

    applyIncomingMessage(message, activeUser, {
      skipUnreadIncrement: message?.sender !== activeUser && isActivePeer,
      limit: 250,
    });

    if (message?.sender !== activeUser && isActivePeer && messageId) {
      markPeerSeen(peer, [messageId]);
    }
  }, [applyIncomingMessage, markPeerSeen]);

  const handleDelivered = useCallback((payload) => {
    const activeUser = currentUserRef.current;
    if (payload?.sender !== activeUser || !payload?.viewer) return;
    updateMessageStatus(payload.viewer, payload.message_ids || [], 'delivered');
  }, [updateMessageStatus]);

  const handleSeen = useCallback((payload) => {
    const activeUser = currentUserRef.current;
    if (payload?.sender === activeUser && payload?.viewer) {
      updateMessageStatus(payload.viewer, payload.message_ids || [], 'seen');
    }
    if (payload?.viewer === activeUser && payload?.sender) {
      markThreadRead(payload.sender);
      flushPendingReceipts(payload.sender, 'seen', payload.message_ids || []);
    }
  }, [flushPendingReceipts, markThreadRead, updateMessageStatus]);

  const handlePresence = useCallback((payload) => {
    if (!payload?.user) return;

    clearTypingTimeout(payload.user);
    setPresence(payload.user, {
      ...payload,
      is_online: Boolean(payload?.is_online ?? payload?.isOnline ?? false),
      last_seen: payload?.last_seen || payload?.timestamp || new Date().toISOString(),
    });

    if (payload.is_typing) {
      const timeout = setTimeout(() => {
        setPresence(payload.user, { is_typing: false });
        typingTimeoutsRef.current.delete(payload.user);
      }, 3200);
      typingTimeoutsRef.current.set(payload.user, timeout);
    }
  }, [clearTypingTimeout, setPresence]);

  const handleTyping = useCallback((payload) => {
    if (!payload?.sender) return;
    clearTypingTimeout(payload.sender);

    setPresence(payload.sender, {
      is_typing: Boolean(payload?.is_typing),
      typing_updated_at: new Date().toISOString(),
    });

    if (payload?.is_typing) {
      const timeout = setTimeout(() => {
        setPresence(payload.sender, { is_typing: false });
        typingTimeoutsRef.current.delete(payload.sender);
      }, 3200);
      typingTimeoutsRef.current.set(payload.sender, timeout);
    }
  }, [clearTypingTimeout, setPresence]);

  const handleConnect = useCallback(async () => {
    logger.info('chat realtime connected, syncing chat state');
    socketManager.emit('register_user', { token, user: currentUserRef.current }, {
      skipSignature: true,
      queue: true,
    });
    socketManager.emit('sync_chat_state', { peer: activePeerRef.current || undefined }, {
      queue: true,
    });
    await flushSeenReceipts();
    await syncChatState({ includeActivePeer: true, reason: 'connect' });
  }, [flushSeenReceipts, syncChatState, token]);

  const handleDisconnect = useCallback((reason) => {
    // v59.7: أسباب طبيعية لا تحتاج وسمها بـ warn في الكونسول
    const benignReasons = new Set([
      'transport close',
      'ping timeout',
      'transport error',
      'io client disconnect',
    ]);
    if (benignReasons.has(String(reason || ''))) {
      logger.info('chat realtime disconnected', { reason });
    } else {
      logger.warn('chat realtime disconnected', { reason });
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;

    if (bootstrapUserRef.current !== currentUser) {
      bootstrapUserRef.current = currentUser;
      setLoadingThreads(!initialized);
      syncChatState({ includeActivePeer: true, reason: initialized ? 'warm_start' : 'bootstrap' });
    }

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

    const handleWindowFocus = () => {
      syncChatState({ includeActivePeer: true, reason: 'focus' });
      flushSeenReceipts();
    };

    const handleOnline = () => {
      socketManager.connect();
      syncChatState({ includeActivePeer: true, reason: 'online' });
      flushSeenReceipts();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('online', handleOnline);
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('online', handleOnline);
      }
      if (syncAbortRef.current) {
        syncAbortRef.current.abort();
        syncAbortRef.current = null;
      }
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, [
    currentUser,
    flushSeenReceipts,
    handleConnect,
    handleDelivered,
    handleDisconnect,
    handleNewMessage,
    handlePresence,
    handleSeen,
    handleTyping,
    initialized,
    syncChatState,
    setLoadingThreads,
  ]);
}
