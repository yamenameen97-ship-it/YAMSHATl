import { useEffect, useRef } from 'react';
import { getChatThreads } from '../api/chat.js';
import socket from '../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { useChatStore } from '../store/chatStore.js';
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
      socket.emit('register_user', { token, user: currentUser });
      socket.emit('sync_chat_state', { token, peer: activePeerRef.current || undefined });
    };

    if (!socket.connected) socket.connect();
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

    socket.on('connect', handleConnect);
    socket.on('new_private_message', handleNewMessage);
    socket.on('messages_delivered', handleDelivered);
    socket.on('messages_seen', handleSeen);
    socket.on('presence_update', handlePresence);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('new_private_message', handleNewMessage);
      socket.off('messages_delivered', handleDelivered);
      socket.off('messages_seen', handleSeen);
      socket.off('presence_update', handlePresence);
    };
  }, [activePeer, applyIncomingMessage, currentUser, markThreadRead, setPresence, token, updateMessageStatus]);
}
