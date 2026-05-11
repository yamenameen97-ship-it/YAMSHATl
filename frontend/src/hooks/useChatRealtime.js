import { useEffect, useRef } from 'react';
import { getChatThreads } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { useChatStore } from '../store/appStore.js';
import logger from '../utils/logger.js';

export default function useChatRealtime() {
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
        logger.warn('chat threads bootstrap failed', { detail: error?.response?.data?.detail || error?.message });
      } finally {
        if (active) setLoadingThreads(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [currentUser, hydrateThreads, initialized, setLoadingThreads]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const emitRegister = () => {
      socketManager.emit('register_user', { token, user: currentUser }, { skipSignature: true });
      socketManager.emit('sync_chat_state', { peer: activePeerRef.current || undefined });
    };

    socketManager.connect();
    emitRegister();

    const handleConnect = () => emitRegister();

    const handleNewMessage = (message) => {
      const participants = [message?.sender, message?.receiver];
      if (!participants.includes(currentUser)) return;
      const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
      applyIncomingMessage(message, currentUser, {
        skipUnreadIncrement: message?.sender !== currentUser && activePeerRef.current === peer,
      });
      if (message?.sender !== currentUser && activePeerRef.current === peer) {
        markThreadRead(peer);
      }
    };

    const handleDelivered = (payload) => {
      if (payload?.sender !== currentUser || !payload?.viewer) return;
      updateMessageStatus(payload.viewer, payload.message_ids || [], 'delivered');
    };

    const handleSeen = (payload) => {
      if (payload?.sender === currentUser && payload?.viewer) {
        updateMessageStatus(payload.viewer, payload.message_ids || [], 'seen');
      }
      if (payload?.viewer === currentUser && payload?.sender) {
        markThreadRead(payload.sender);
      }
    };

    const handlePresence = (payload) => {
      if (!payload?.user) return;
      setPresence(payload.user, payload);
    };

    const handleTyping = (payload) => {
      if (!payload?.sender) return;
      setPresence(payload.sender, {
        is_typing: Boolean(payload?.is_typing),
        typing_updated_at: new Date().toISOString(),
      });
    };

    socketManager.on('connect', handleConnect);
    socketManager.on('new_private_message', handleNewMessage);
    socketManager.on('messages_delivered', handleDelivered);
    socketManager.on('messages_seen', handleSeen);
    socketManager.on('presence_update', handlePresence);
    socketManager.on('typing_update', handleTyping);

    return () => {
      socketManager.off('connect', handleConnect);
      socketManager.off('new_private_message', handleNewMessage);
      socketManager.off('messages_delivered', handleDelivered);
      socketManager.off('messages_seen', handleSeen);
      socketManager.off('presence_update', handlePresence);
      socketManager.off('typing_update', handleTyping);
    };
  }, [activePeer, applyIncomingMessage, currentUser, markThreadRead, setPresence, token, updateMessageStatus]);
}
