import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  blockUserApi,
  deleteMessageApi,
  getBlockStatus,
  getMessages,
  getPresence,
  markMessagesSeen,
  sendMessageApi,
  translateMessageApi,
  unblockUserApi,
  updateOnline,
  uploadMediaWithResume,
} from '../api/chat.js';
import { createCallToken } from '../api/live.js';
import socket from '../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { useAppStore } from '../store/appStore.js';
import { useChatStore } from '../store/chatStore.js';
import { getUiText } from '../utils/i18n.js';
import { getConversationCache, setConversationCache } from '../utils/cache.js';
import logger from '../utils/logger.js';
import featureFlags from '../utils/featureFlags.js';
import { trackEvent } from '../utils/analytics.js';
import VirtualMessageList from '../components/chat/VirtualMessageList.jsx';

const QUICK_REPLIES = ['تمام ✅', 'أنا معاك', 'أرسل التفاصيل', 'هراجع وأرد عليك', 'خلينا نكمل هنا'];
const VIRTUALIZATION_THRESHOLD = 120;
const PAGE_SIZE = 40;
const TYPING_IDLE_MS = 1200;
const REMOTE_TYPING_STALE_MS = 2400;
const livekitCache = { module: null };

async function loadLiveKit() {
  if (!livekitCache.module) livekitCache.module = await import('livekit-client');
  return livekitCache.module;
}

function mergeMessages(current, incoming) {
  const map = new Map();
  [...current, ...incoming].forEach((message) => {
    const key = message?.id || message?.client_id;
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...message });
  });
  return [...map.values()].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

function inferMessageType(file) {
  if (!file) return 'text';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

function statusText(message, language) {
  if (message.status === 'failed') return language === 'en' ? 'Failed' : 'فشل';
  if (message.status === 'queued') return language === 'en' ? 'Queued' : 'مؤجلة';
  if (message.status === 'sending') return '...';
  if (message.status === 'seen') return '✔✔';
  if (message.status === 'delivered') return '✔✔';
  return '✔';
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const otherUser = decodeURIComponent(userId || '');
  const isOnline = useAppStore((state) => state.isOnline);
  const language = useAppStore((state) => state.language);
  const chatTranslationEnabled = useAppStore((state) => state.chatTranslationEnabled);
  const queueAction = useAppStore((state) => state.queueAction);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const setUploadProgress = useAppStore((state) => state.setUploadProgress);
  const clearUploadProgress = useAppStore((state) => state.clearUploadProgress);
  const uploadProgress = useAppStore((state) => state.uploadProgress.chatComposer || 0);
  const ui = getUiText(language);
  const markThreadRead = useChatStore((state) => state.markThreadRead);
  const setChatPresence = useChatStore((state) => state.setPresence);
  const setConversation = useChatStore((state) => state.setConversation);
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const { pushToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(Boolean(otherUser));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [presence, setPresence] = useState({ is_online: false, last_seen: null });
  const [typing, setTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showJumpLatest, setShowJumpLatest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [blockState, setBlockState] = useState({ blocked_by_me: false, blocked_me: false, can_chat: true });
  const [translations, setTranslations] = useState({});
  const [translatingIds, setTranslatingIds] = useState({});
  const [callState, setCallState] = useState({ open: false, type: 'audio', status: '', fallback: false, room_id: '' });
  const [incomingCall, setIncomingCall] = useState(null);

  const typingTimeout = useRef(null);
  const remoteTypingTimeout = useRef(null);
  const typingActiveRef = useRef(false);
  const bottomRef = useRef(null);
  const topSentinelRef = useRef(null);
  const messagesRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const loadAbortRef = useRef(null);
  const messageStateRef = useRef([]);
  const roomRef = useRef(null);
  const localMediaRef = useRef(null);
  const remoteMediaRef = useRef(null);
  const sendLockRef = useRef(false);
  const blockLockRef = useRef(false);

  const headerState = useMemo(() => {
    if (!otherUser) return language === 'en' ? 'Choose a conversation from inbox or users.' : 'اختر محادثة من صندوق الوارد أو من صفحة المستخدمين.';
    if (typing) return language === 'en' ? 'Typing now...' : 'يكتب الآن...';
    if (presence?.is_online) return language === 'en' ? '🟢 Online now' : '🟢 متصل الآن';
    if (presence?.last_seen) {
      return language === 'en'
        ? `Last seen ${new Date(presence.last_seen).toLocaleString('en-US')}`
        : `آخر ظهور ${new Date(presence.last_seen).toLocaleString('ar-EG')}`;
    }
    return language === 'en' ? '⚫ Offline' : '⚫ غير متصل';
  }, [language, otherUser, presence, typing]);

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((message) => `${message.message || message.content || ''}`.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  const shouldVirtualize = useMemo(
    () => filteredMessages.length >= VIRTUALIZATION_THRESHOLD && !searchQuery.trim(),
    [filteredMessages.length, searchQuery],
  );

  const stats = useMemo(() => [
    { label: language === 'en' ? 'Messages' : 'إجمالي الرسائل', value: messages.length },
    { label: language === 'en' ? 'Visible now' : 'الظاهرة الآن', value: filteredMessages.length },
    { label: language === 'en' ? 'Media' : 'وسائط', value: messages.filter((message) => message.type && message.type !== 'text').length },
    { label: language === 'en' ? 'Status' : 'الحالة', value: presence?.is_online ? (language === 'en' ? 'Online' : 'متصل') : (language === 'en' ? 'Offline' : 'غير متصل') },
  ], [filteredMessages.length, language, messages, presence?.is_online]);

  const clearCallMedia = useCallback(() => {
    [localMediaRef.current, remoteMediaRef.current].forEach((container) => {
      if (!container) return;
      container.replaceChildren();
    });
  }, []);

  const disconnectCall = useCallback((nextStatus = '') => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    clearCallMedia();
    setCallState({ open: false, type: 'audio', status: nextStatus, fallback: false, room_id: '' });
  }, [clearCallMedia]);

  const attachTrack = useCallback((track, identity, isLocal = false) => {
    const container = isLocal ? localMediaRef.current : remoteMediaRef.current;
    if (!container || !track) return;
    const element = track.attach();
    element.autoplay = true;
    element.playsInline = true;
    if (isLocal) element.muted = true;

    const wrapper = document.createElement('div');
    wrapper.className = `call-media-tile ${isLocal ? 'local' : 'remote'}`;
    const label = document.createElement('span');
    label.className = 'call-media-label';
    label.textContent = identity;
    wrapper.appendChild(element);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  }, []);

  const connectToCall = useCallback(async (session) => {
    const callType = session?.call_type === 'video' ? 'video' : 'audio';
    if (!session?.token || !session?.livekit_url) {
      setCallState({ open: true, type: callType, status: ui.chat.callFallback, fallback: true, room_id: session?.room_id || '' });
      pushToast({ type: 'info', title: 'LiveKit', description: ui.chat.callFallback });
      return;
    }

    try {
      setCallState({ open: true, type: callType, status: ui.chat.preparingCall, fallback: false, room_id: session.room_id || '' });
      clearCallMedia();
      const { connect, RoomEvent } = await loadLiveKit();
      const room = await connect(session.livekit_url, session.token);
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        attachTrack(track, participant.identity || otherUser, false);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
      });

      room.on(RoomEvent.Disconnected, () => {
        setCallState((prev) => ({ ...prev, status: language === 'en' ? 'Call disconnected.' : 'تم إنهاء الاتصال.' }));
      });

      await room.localParticipant.setMicrophoneEnabled(true);
      await room.localParticipant.setCameraEnabled(callType === 'video');

      room.localParticipant.trackPublications.forEach((publication) => {
        if (publication.track && publication.kind === 'video') attachTrack(publication.track, currentUser, true);
      });

      room.participants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) attachTrack(publication.track, participant.identity || otherUser, false);
        });
      });

      setIncomingCall(null);
      setCallState({
        open: true,
        type: callType,
        status: callType === 'video'
          ? (language === 'en' ? 'Video call connected.' : 'تم بدء المكالمة المرئية.')
          : (language === 'en' ? 'Audio call connected.' : 'تم بدء المكالمة الصوتية.'),
        fallback: false,
        room_id: session.room_id || '',
      });
    } catch (err) {
      setCallState({
        open: true,
        type: callType,
        status: err?.response?.data?.detail || err?.message || (language === 'en' ? 'Call connection failed.' : 'تعذر الاتصال بالمكالمة.'),
        fallback: true,
        room_id: session?.room_id || '',
      });
    }
  }, [attachTrack, clearCallMedia, currentUser, language, otherUser, pushToast, ui.chat.callFallback, ui.chat.preparingCall]);

  const loadMessages = useCallback(async ({ reset = false } = {}) => {
    if (!otherUser) return;
    if (loadAbortRef.current) loadAbortRef.current.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const shell = messagesRef.current;
    const previousHeight = !reset && shell ? shell.scrollHeight : 0;
    const previousTop = !reset && shell ? shell.scrollTop : 0;

    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError('');
      await updateOnline(true);
      const currentMessages = messageStateRef.current || [];
      const beforeId = !reset && currentMessages.length ? currentMessages[0]?.id : undefined;
      const [messagesRes, presenceRes, blockRes] = await Promise.all([
        getMessages(otherUser, PAGE_SIZE, beforeId, { signal: controller.signal }),
        getPresence(otherUser, { signal: controller.signal }),
        getBlockStatus(otherUser, { signal: controller.signal }),
      ]);
      const rawPayload = messagesRes.data;
      const nextMessages = Array.isArray(rawPayload) ? rawPayload : (Array.isArray(rawPayload?.items) ? rawPayload.items : []);
      const mergedMessages = reset ? nextMessages : mergeMessages(nextMessages, currentMessages);
      const nextHasMore = Boolean(rawPayload?.paging ? rawPayload.paging.has_more : nextMessages.length >= PAGE_SIZE);
      const nextPresence = presenceRes.data || { is_online: false, last_seen: null };
      setMessages(mergedMessages);
      setHasMore(nextHasMore);
      setPresence(nextPresence);
      setChatPresence(otherUser, nextPresence);
      setConversation(otherUser, {
        messages: mergedMessages,
        hasMore: nextHasMore,
        currentUser,
        presence: nextPresence,
      });
      setBlockState(blockRes.data || { blocked_by_me: false, blocked_me: false, can_chat: true });
      await markMessagesSeen(otherUser);
      markThreadRead(otherUser);
      if (!reset && shell) {
        requestAnimationFrame(() => {
          const nextHeight = shell.scrollHeight;
          shell.scrollTop = Math.max(0, nextHeight - previousHeight + previousTop);
        });
      }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        logger.debug('chat request cancelled', { otherUser });
        return;
      }
      if (err?.response?.status === 403) {
        try {
          const { data } = await getBlockStatus(otherUser);
          setBlockState(data || { blocked_by_me: false, blocked_me: false, can_chat: false });
        } catch {
          // ignore
        }
      }
      logger.warn('chat load failed', { otherUser, detail: err?.response?.data?.detail || err?.message });
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر تحميل المحادثة.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
      if (loadAbortRef.current === controller) loadAbortRef.current = null;
    }
  }, [currentUser, markThreadRead, otherUser, setChatPresence, setConversation]);

  useEffect(() => {
    setActivePeer(otherUser || '');
    setMessages([]);
    setText('');
    setAttachment(null);
    setError('');
    setTyping(false);
    setSearchQuery('');
    setTranslations({});
    setIncomingCall(null);
    disconnectCall();

    if (featureFlags.chatCache && currentUser && otherUser) {
      const cachedConversation = getConversationCache(currentUser, otherUser);
      if (cachedConversation) {
        setMessages(Array.isArray(cachedConversation.messages) ? cachedConversation.messages : []);
        setPresence(cachedConversation.presence || { is_online: false, last_seen: null });
        setBlockState(cachedConversation.blockState || { blocked_by_me: false, blocked_me: false, can_chat: true });
        setLoading(false);
      }
    }

    return () => setActivePeer('');
  }, [currentUser, disconnectCall, otherUser, setActivePeer]);

  useEffect(() => {
    if (!otherUser) return undefined;

    const emitJoin = () => {
      socket.emit('register_user', { token, user: currentUser });
      socket.emit('join_chat', { token, user: currentUser, peer: otherUser });
      socket.emit('sync_chat_state', { token, peer: otherUser });
    };

    if (!socket.connected) socket.connect();
    emitJoin();

    const handleNewMessage = (message) => {
      const participants = [message?.sender, message?.receiver];
      if (!participants.includes(currentUser) || !participants.includes(otherUser)) return;
      setMessages((prev) => mergeMessages(prev, [message]));
      if (message?.sender === otherUser) markMessagesSeen(otherUser).catch(() => {});
    };

    const handleDelivered = (payload) => {
      if (payload?.sender !== currentUser || payload?.viewer !== otherUser) return;
      setMessages((prev) => prev.map((message) => payload.message_ids?.includes(message.id) ? { ...message, status: 'delivered' } : message));
    };

    const handleSeen = (payload) => {
      if (payload?.sender !== currentUser || payload?.viewer !== otherUser) return;
      setMessages((prev) => prev.map((message) => payload.message_ids?.includes(message.id) ? { ...message, status: 'seen' } : message));
    };

    const handlePresence = (payload) => {
      if (payload?.user !== otherUser) return;
      setPresence(payload);
      setChatPresence(otherUser, payload);
    };

    const handleTyping = (payload) => {
      if (payload?.sender !== otherUser || payload?.receiver !== currentUser) return;
      if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current);
      const nextTyping = Boolean(payload?.is_typing);
      setTyping(nextTyping);
      if (nextTyping) {
        remoteTypingTimeout.current = setTimeout(() => setTyping(false), REMOTE_TYPING_STALE_MS);
      }
    };

    const handleConnect = () => {
      emitJoin();
    };

    const handleDeleted = (payload) => {
      if (![payload?.sender, payload?.receiver].includes(currentUser)) return;
      setMessages((prev) => prev.map((message) => (message.id === payload.id ? { ...message, ...payload } : message)));
    };

    const handleIncomingCall = (payload) => {
      if (payload?.receiver !== currentUser || payload?.caller !== otherUser) return;
      setIncomingCall(payload);
      pushToast({
        type: 'info',
        title: payload.call_type === 'video' ? ui.chat.incomingVideo : ui.chat.incomingAudio,
        description: `${payload.caller}`,
      });
    };

    const handleQueuedSent = (event) => {
      const detail = event?.detail || {};
      if (detail?.payload?.receiver !== otherUser) return;
      setMessages((prev) => mergeMessages(prev.filter((item) => item.client_id !== detail.client_id), [detail.response]));
    };

    const handleQueuedFailed = (event) => {
      const detail = event?.detail || {};
      if (detail?.payload?.receiver !== otherUser) return;
      setMessages((prev) => prev.map((item) => item.client_id === detail.client_id ? { ...item, status: 'failed', error: true } : item));
    };

    socket.on('connect', handleConnect);
    socket.on('new_private_message', handleNewMessage);
    socket.on('messages_delivered', handleDelivered);
    socket.on('messages_seen', handleSeen);
    socket.on('presence_update', handlePresence);
    socket.on('typing_update', handleTyping);
    socket.on('message_deleted', handleDeleted);
    socket.on('incoming_call', handleIncomingCall);
    window.addEventListener('yamshat:queued-message-sent', handleQueuedSent);
    window.addEventListener('yamshat:queued-message-failed', handleQueuedFailed);

    loadMessages({ reset: true });

    return () => {
      socket.emit('leave_chat', { user: currentUser, peer: otherUser });
      socket.off('connect', handleConnect);
      socket.off('new_private_message', handleNewMessage);
      socket.off('messages_delivered', handleDelivered);
      socket.off('messages_seen', handleSeen);
      socket.off('presence_update', handlePresence);
      socket.off('typing_update', handleTyping);
      socket.off('message_deleted', handleDeleted);
      socket.off('incoming_call', handleIncomingCall);
      window.removeEventListener('yamshat:queued-message-sent', handleQueuedSent);
      window.removeEventListener('yamshat:queued-message-failed', handleQueuedFailed);
      if (loadAbortRef.current) loadAbortRef.current.abort();
    };
  }, [currentUser, loadMessages, otherUser, pushToast, setChatPresence, token, ui.chat.incomingAudio, ui.chat.incomingVideo]);

  useEffect(() => {
    messageStateRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const shell = messagesRef.current;
    if (!shell) return undefined;

    const handleScroll = () => {
      const isNearBottom = shell.scrollHeight - shell.scrollTop - shell.clientHeight < 140;
      setShowJumpLatest(!isNearBottom);
    };

    shell.addEventListener('scroll', handleScroll);
    return () => shell.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const shell = messagesRef.current;
    const sentinel = topSentinelRef.current;
    if (!shell || !sentinel || searchQuery || loading || loadingMore || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && !loadingMore && hasMore) {
          loadMessages({ reset: false });
        }
      },
      { root: shell, threshold: 0.05 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMessages, loading, loadingMore, searchQuery]);

  useEffect(() => {
    if (!showJumpLatest && !searchQuery) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, showJumpLatest, searchQuery]);

  useEffect(() => {
    if (!featureFlags.chatCache || !currentUser || !otherUser || messages.length === 0) return;
    setConversationCache(currentUser, otherUser, {
      messages,
      presence,
      blockState,
    });
  }, [blockState, currentUser, messages, otherUser, presence]);

  useEffect(() => () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (remoteTypingTimeout.current) clearTimeout(remoteTypingTimeout.current);
    if (typingActiveRef.current && otherUser) socket.emit('chat_typing', { sender: currentUser, receiver: otherUser, is_typing: false });
    if (loadAbortRef.current) loadAbortRef.current.abort();
    disconnectCall();
  }, [currentUser, disconnectCall, otherUser]);

  const handleTypingChange = (value) => {
    setText(value);
    if (!otherUser || !blockState.can_chat) return;
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      socket.emit('chat_typing', { sender: currentUser, receiver: otherUser, is_typing: true });
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      typingActiveRef.current = false;
      socket.emit('chat_typing', { sender: currentUser, receiver: otherUser, is_typing: false });
    }, TYPING_IDLE_MS);
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError('الحد الأقصى للمرفق 25MB.');
      return;
    }
    setError('');
    setAttachment(file);
    trackEvent('chat_attachment_selected', { size_bytes: file.size, mime_type: file.type || 'unknown' }, { category: 'chat' }).catch(() => null);
  };

  const clearComposerMedia = () => {
    setAttachment(null);
    clearUploadProgress('chatComposer');
  };

  const handleComposerKeyDown = async (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    await handleSend();
  };

  const sendPayload = async (preparedAttachment = attachment) => {
    let mediaUrl = '';
    let type = preparedAttachment ? inferMessageType(preparedAttachment) : 'text';

    if (preparedAttachment) {
      const { data } = await uploadMediaWithResume(preparedAttachment, (progress) => {
        setUploadProgress('chatComposer', progress);
      });
      mediaUrl = data?.file_url || data?.url || '';
    }

    const client_id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const payload = {
      receiver: otherUser,
      message: sanitizeInputText(text, { maxLength: 2000 }),
      media_url: mediaUrl,
      type,
      client_id,
    };

    const optimisticMessage = {
      ...payload,
      sender: currentUser,
      created_at: new Date().toISOString(),
      status: 'sending',
      preview_url: preparedAttachment?.type ? URL.createObjectURL(preparedAttachment) : '',
    };

    setMessages((prev) => mergeMessages(prev, [optimisticMessage]));

    try {
      const { data } = await sendMessageApi(payload);
      const saved = data?.data || data;
      setMessages((prev) => mergeMessages(prev.filter((item) => item.client_id !== client_id), [saved]));
      setText('');
      clearComposerMedia();
      typingActiveRef.current = false;
      socket.emit('chat_typing', { sender: currentUser, receiver: otherUser, is_typing: false });
      trackEvent('chat_message_sent', { message_type: type, has_media: Boolean(mediaUrl) }, { category: 'chat', route: `/chat/${encodeURIComponent(otherUser)}` }).catch(() => null);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message;
      const shouldQueueForRetry = !err?.response || err?.response?.status >= 500 || err?.response?.status === 429;
      setMessages((prev) => prev.map((item) => item.client_id === client_id ? { ...item, status: shouldQueueForRetry ? 'queued' : 'failed', error: !shouldQueueForRetry } : item));
      if (shouldQueueForRetry && featureFlags.offlineQueue) {
        queueAction({ type: 'chat:send_message', payload });
      }
      logger.warn('message send failed', { otherUser, detail });
      trackEvent('chat_message_failed', { message_type: type, reason: detail || 'unknown' }, { category: 'chat', route: `/chat/${encodeURIComponent(otherUser)}` }).catch(() => null);
      pushToast({
        type: shouldQueueForRetry ? 'info' : 'warning',
        title: shouldQueueForRetry ? (language === 'en' ? 'Queued for retry' : 'تمت إضافتها لطابور إعادة المحاولة') : (language === 'en' ? 'Send failed' : 'فشل الإرسال'),
        description: shouldQueueForRetry
          ? (language === 'en' ? 'The message will retry automatically when the connection stabilizes.' : 'سيتم إعادة المحاولة تلقائياً عند استقرار الاتصال.')
          : (language === 'en' ? 'You can retry from the same message.' : 'يمكنك إعادة المحاولة من نفس الرسالة.'),
      });
    } finally {
      sendLockRef.current = false;
      setSending(false);
      clearUploadProgress('chatComposer');
    }
  };

  const handleSend = async () => {
    if (!otherUser || sending || sendLockRef.current || !blockState.can_chat) return;
     sendLockRef.current = true;
    if (!text.trim() && !attachment) return;
    setSending(true);
    setError('');

    if (!isOnline) {
      if (attachment) {
        sendLockRef.current = false;
        setSending(false);
        pushToast({ type: 'warning', title: language === 'en' ? 'Offline attachment blocked' : 'لا يمكن رفع المرفقات الآن', description: language === 'en' ? 'Reconnect first, then upload the attachment.' : 'ارجع للاتصال بالإنترنت أولاً ثم أرسل المرفق.' });
        return;
      }

      const client_id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const queuedPayload = {
        receiver: otherUser,
        message: sanitizeInputText(text, { maxLength: 2000 }),
        media_url: '',
        type: 'text',
        client_id,
      };
      setMessages((prev) => mergeMessages(prev, [{ ...queuedPayload, sender: currentUser, created_at: new Date().toISOString(), status: 'queued' }]));
      if (featureFlags.offlineQueue) {
        queueAction({ type: 'chat:send_message', payload: queuedPayload });
      }
      setText('');
      sendLockRef.current = false;
      setSending(false);
      pushToast({ type: 'info', title: 'Offline', description: language === 'en' ? 'Message queued until connection returns.' : 'تم تجهيز الرسالة للإرسال تلقائياً عند رجوع الإنترنت.' });
      return;
    }

    await sendPayload(attachment);
  };

  const retryMessage = async (message) => {
    const retryPayload = {
      receiver: otherUser,
      message: sanitizeInputText(message.message || message.content || '', { maxLength: 2000 }),
      media_url: message.media_url || '',
      type: message.type || 'text',
      client_id: message.client_id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    };

    if (!isOnline) {
      setMessages((prev) => prev.map((item) => item.client_id === message.client_id ? { ...item, ...retryPayload, status: 'queued', error: false } : item));
      if (featureFlags.offlineQueue) queueAction({ type: 'chat:send_message', payload: retryPayload });
      pushToast({ type: 'info', title: language === 'en' ? 'Queued again' : 'تمت الإضافة للطابور مرة أخرى', description: language === 'en' ? 'The message will retry automatically once you are back online.' : 'سيتم إرسال الرسالة تلقائياً بمجرد عودة الإنترنت.' });
      return;
    }

    setMessages((prev) => prev.map((item) => item.client_id === message.client_id ? { ...item, ...retryPayload, status: 'sending', error: false } : item));
    try {
      const { data } = await sendMessageApi(retryPayload);
      const saved = data?.data || data;
      setMessages((prev) => mergeMessages(prev.filter((item) => item.client_id !== message.client_id), [saved]));
      pushToast({ type: 'success', title: language === 'en' ? 'Message sent' : 'تم إرسال الرسالة', description: language === 'en' ? 'Retry succeeded.' : 'نجحت إعادة المحاولة.' });
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message;
      const shouldQueueForRetry = !err?.response || err?.response?.status >= 500 || err?.response?.status === 429;
      setMessages((prev) => prev.map((item) => item.client_id === message.client_id ? { ...item, status: shouldQueueForRetry ? 'queued' : 'failed', error: !shouldQueueForRetry } : item));
      if (shouldQueueForRetry && featureFlags.offlineQueue) queueAction({ type: 'chat:send_message', payload: retryPayload });
      pushToast({
        type: shouldQueueForRetry ? 'info' : 'warning',
        title: shouldQueueForRetry ? (language === 'en' ? 'Queued for retry' : 'تمت إضافتها لطابور إعادة المحاولة') : (language === 'en' ? 'Retry failed' : 'فشلت إعادة المحاولة'),
        description: detail || (language === 'en' ? 'Please try again.' : 'حاول مرة أخرى.'),
      });
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessageApi(messageId);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حذف الرسالة.');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setAttachment(file);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      pushToast({ type: 'warning', title: language === 'en' ? 'Microphone unavailable' : 'تعذر الوصول للمايك', description: language === 'en' ? 'Please allow microphone access.' : 'تأكد من صلاحيات التسجيل.' });
    }
  };

  const handleBlockToggle = async () => {
    if (blockLockRef.current) return;
    blockLockRef.current = true;
    try {
      const { data } = blockState.blocked_by_me ? await unblockUserApi(otherUser) : await blockUserApi(otherUser);
      setBlockState(data || { blocked_by_me: false, blocked_me: false, can_chat: true });
      if (!blockState.blocked_by_me) {
        setText('');
        clearComposerMedia();
      }
    } catch (err) {
      pushToast({ type: 'warning', title: language === 'en' ? 'Block action failed' : 'تعذر تحديث الحظر', description: err?.response?.data?.detail || err?.response?.data?.message || 'حاول مرة أخرى.' });
    } finally {
      blockLockRef.current = false;
    }
  };

  const handleTranslateMessage = async (message) => {
    const key = message.id || message.client_id;
    if (!key || !chatTranslationEnabled) {
      pushToast({ type: 'info', title: language === 'en' ? 'Translation' : 'الترجمة', description: ui.chat.translatorOff });
      return;
    }
    if (translations[key]) {
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    try {
      setTranslatingIds((prev) => ({ ...prev, [key]: true }));
      const target_lang = language === 'en' ? 'en' : 'ar';
      const { data } = await translateMessageApi({ text: message.message || message.content || '', source_lang: 'auto', target_lang });
      setTranslations((prev) => ({ ...prev, [key]: data?.translated_text || '' }));
    } catch (err) {
      pushToast({ type: 'warning', title: language === 'en' ? 'Translation failed' : 'تعذر الترجمة', description: err?.response?.data?.detail || err?.response?.data?.message || 'حاول مرة أخرى.' });
    } finally {
      setTranslatingIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const startCall = async (callType) => {
    if (!blockState.can_chat) return;
    try {
      setCallState({ open: true, type: callType, status: ui.chat.preparingCall, fallback: false, room_id: '' });
      const { data } = await createCallToken({ receiver: otherUser, call_type: callType });
      await connectToCall(data);
    } catch (err) {
      setCallState({ open: true, type: callType, status: err?.response?.data?.detail || err?.message || (language === 'en' ? 'Unable to start call.' : 'تعذر بدء المكالمة.'), fallback: true, room_id: '' });
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      const { data } = await createCallToken({ receiver: incomingCall.caller, call_type: incomingCall.call_type, room_id: incomingCall.room_id });
      await connectToCall(data);
    } catch (err) {
      pushToast({ type: 'warning', title: language === 'en' ? 'Call failed' : 'تعذر بدء المكالمة', description: err?.response?.data?.detail || err?.message || 'Call error' });
    }
  };

  const renderMessageRow = (message) => {
    const mine = message.sender === currentUser;
    const content = message.message || message.content;
    const mediaUrl = message.media_url || message.preview_url;
    const translationKey = message.id || message.client_id;
    return (
      <div key={translationKey} className={`message-row ${mine ? 'mine' : ''}`}>
        <div className={`message-bubble ${mine ? 'mine' : 'other'} ${message.deleted ? 'deleted' : ''}`}>
          {content ? <p>{content}</p> : null}
          {message.type === 'image' && mediaUrl ? <img src={mediaUrl} alt="attachment" className="message-image" /> : null}
          {message.type === 'audio' && mediaUrl ? <audio src={mediaUrl} controls className="message-audio" /> : null}
          {message.type === 'video' && mediaUrl ? <video src={mediaUrl} controls className="message-video" /> : null}
          {message.type === 'file' && mediaUrl ? <a href={mediaUrl} target="_blank" rel="noreferrer" className="mini-action">{language === 'en' ? 'Open attachment' : 'فتح المرفق'}</a> : null}

          {translations[translationKey] ? (
            <div className="message-translation-box">
              <span className="message-translation-label">{language === 'en' ? ui.chat.translatedToEnglish : ui.chat.translatedToArabic}</span>
              <p>{translations[translationKey]}</p>
            </div>
          ) : null}

          <div className="message-meta message-meta-pro">
            <span>
              {message.created_at ? new Date(message.created_at).toLocaleTimeString(language === 'en' ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
            {message.type === 'text' && content && !message.deleted ? (
              <button type="button" className="mini-action" onClick={() => handleTranslateMessage(message)} disabled={Boolean(translatingIds[translationKey])}>
                {translatingIds[translationKey] ? '...' : ui.chat.translate}
              </button>
            ) : null}
            {mine ? <span className={`status-text ${message.status || 'sent'}`}>{statusText(message, language)}</span> : null}
            {message.status === 'failed' ? <button type="button" className="mini-action" onClick={() => retryMessage(message)}>{language === 'en' ? 'Retry' : 'إعادة المحاولة'}</button> : null}
            {mine && message.id && !message.deleted ? <button type="button" className="mini-action" onClick={() => handleDelete(message.id)}>{language === 'en' ? 'Delete' : 'حذف'}</button> : null}
          </div>
        </div>
      </div>
    );
  };

  const typingNode = <div className="typing-indicator">✍️ {language === 'en' ? 'User is typing...' : 'المستخدم يكتب الآن...'}</div>;

  if (!otherUser) {
    return (
      <MainLayout>
        <Card className="empty-card">
          <h3 className="section-title">{language === 'en' ? 'Choose a chat' : 'اختر محادثة'}</h3>
          <p className="muted">{language === 'en' ? 'Start from inbox or user list to open a private conversation.' : 'ابدأ من صندوق الوارد أو افتح صفحة المستخدمين لاختيار شخص للمحادثة الخاصة.'}</p>
          <Button onClick={() => navigate('/inbox')}>{language === 'en' ? 'Open inbox' : 'فتح Inbox'}</Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="chat-layout">
        <Card className="chat-panel chat-panel-pro">
          <div className="chat-header chat-header-pro">
            <div className="chat-user-block">
              <div className="avatar-circle large">{otherUser.slice(0, 1).toUpperCase()}</div>
              <div>
                <h3 className="section-title no-margin">{otherUser}</h3>
                <div className="muted">{headerState}</div>
              </div>
            </div>
            <div className="chat-header-actions chat-header-actions-pro">
              <Button variant="secondary" onClick={() => startCall('audio')} disabled={!blockState.can_chat}>{ui.chat.audioCall}</Button>
              <Button variant="secondary" onClick={() => startCall('video')} disabled={!blockState.can_chat}>{ui.chat.videoCall}</Button>
              <Button variant="secondary" onClick={handleBlockToggle}>{blockState.blocked_by_me ? ui.chat.unblock : ui.chat.block}</Button>
              <Button variant="secondary" onClick={() => navigate(`/profile/${encodeURIComponent(otherUser)}`)}>{language === 'en' ? 'Profile' : 'الملف الشخصي'}</Button>
              <Button variant="secondary" onClick={() => navigate('/inbox')}>{language === 'en' ? 'Back to inbox' : 'الرجوع للـ Inbox'}</Button>
              {showJumpLatest ? <Button onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}>{language === 'en' ? 'Latest' : 'أحدث رسالة'}</Button> : null}
            </div>
          </div>

          <div className="stories-stats-grid notification-stats-grid-4">
            {stats.map((item) => (
              <div key={item.label} className="mini-stat stories-stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {blockState.blocked_by_me ? <div className="alert warning">{ui.chat.blockedByMe}</div> : null}
          {blockState.blocked_me ? <div className="alert warning">{ui.chat.blockedMe}</div> : null}
          {incomingCall ? (
            <div className="call-incoming-banner">
              <div>
                <strong>{incomingCall.call_type === 'video' ? ui.chat.incomingVideo : ui.chat.incomingAudio}</strong>
                <p className="muted no-margin">{incomingCall.caller}</p>
              </div>
              <div className="call-banner-actions">
                <Button onClick={acceptIncomingCall}>{ui.chat.accept}</Button>
                <Button variant="secondary" onClick={() => setIncomingCall(null)}>{ui.chat.decline}</Button>
              </div>
            </div>
          ) : null}
          {error ? <div className="alert error">{error}</div> : null}
          {!isOnline ? <div className="alert warning">{language === 'en' ? 'You are offline. Messages will retry automatically when connection returns.' : 'أنت حالياً بدون إنترنت. سيتم تأجيل الإرسال وإعادة المحاولة تلقائياً.'}</div> : null}
          {queuedActions.length ? <div className="alert info">{language === 'en' ? `${queuedActions.length} message(s) waiting in retry queue.` : `يوجد ${queuedActions.length} رسالة في طابور إعادة المحاولة.`}</div> : null}

          <div className="live-toolbar wrap-composer-actions">
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={language === 'en' ? 'Search conversation...' : 'ابحث داخل المحادثة...'} />
            <Button variant="secondary" onClick={() => setSearchQuery('')}>{language === 'en' ? 'Clear search' : 'مسح البحث'}</Button>
          </div>

          <div className="story-viewer-actions chat-quick-replies" style={{ marginBottom: 12 }}>
            {QUICK_REPLIES.map((reply) => (
              <button key={reply} type="button" className="mini-action" onClick={() => handleTypingChange(reply)}>{reply}</button>
            ))}
          </div>

          <div className="messages-shell messages-shell-pro" ref={messagesRef}>
            <div ref={topSentinelRef} className="chat-top-sentinel" aria-hidden="true" style={{ height: 1 }} />
            {loadingMore ? <div className="load-more-btn">{language === 'en' ? 'Loading older messages...' : 'جارٍ تحميل الرسائل الأقدم تلقائياً...'}</div> : null}
            {loading ? <div className="empty-state">{language === 'en' ? 'Loading messages...' : 'جارٍ تحميل الرسائل...'}</div> : null}
            {!loading && filteredMessages.length === 0 ? (
              <EmptyState icon="✉️" title={searchQuery ? (language === 'en' ? 'No matches' : 'لا يوجد تطابق') : (language === 'en' ? 'Start the first message' : 'ابدأ أول رسالة')} description={searchQuery ? (language === 'en' ? 'Try a different keyword.' : 'جرّب كلمة بحث مختلفة.') : (language === 'en' ? 'This chat is empty for now.' : 'المحادثة فارغة حتى الآن.')} />
            ) : null}

            {shouldVirtualize ? (
              <VirtualMessageList
                items={filteredMessages}
                scrollRef={messagesRef}
                renderItem={renderMessageRow}
                typing={typing}
                typingNode={typingNode}
                bottomRef={bottomRef}
              />
            ) : (
              <>
                {filteredMessages.map((message) => renderMessageRow(message))}
                {typing ? typingNode : null}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {callState.open ? (
            <div className="call-session-shell">
              <div className="call-session-head">
                <div>
                  <strong>{callState.type === 'video' ? ui.chat.videoCall : ui.chat.audioCall}</strong>
                  <p className="muted no-margin">{callState.status}</p>
                  {callState.room_id ? <small className="muted">Room: {callState.room_id}</small> : null}
                </div>
                <Button variant="secondary" onClick={() => disconnectCall(language === 'en' ? 'Call ended.' : 'تم إنهاء المكالمة.')}>{ui.chat.hangup}</Button>
              </div>
              <div className="call-session-grid">
                <div className="call-session-media remote" ref={remoteMediaRef} />
                <div className="call-session-media local" ref={localMediaRef} />
              </div>
            </div>
          ) : null}

          <div className="composer composer-pro">
            {attachment ? (
              <div className="attachment-preview-card">
                <strong>{attachment.name}</strong>
                <div className="muted">{inferMessageType(attachment)} • {(attachment.size / (1024 * 1024)).toFixed(2)} MB</div>
                <button type="button" className="mini-action" onClick={clearComposerMedia}>{language === 'en' ? 'Remove' : 'إزالة'}</button>
              </div>
            ) : null}

            {uploadProgress > 0 ? (
              <div className="upload-progress-shell compact-upload-progress">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span>{uploadProgress}%</span>
              </div>
            ) : null}

            <Input
              value={text}
              onChange={(event) => handleTypingChange(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={language === 'en' ? 'Type a message and press Enter' : 'اكتب رسالة... واضغط Enter للإرسال'}
              disabled={!blockState.can_chat}
            />
            <div className="composer-actions wrap-composer-actions">
              <label className="upload-label">
                📎 {language === 'en' ? 'Attach' : 'مرفق'}
                <input type="file" hidden accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleAttachmentChange} disabled={!blockState.can_chat} />
              </label>
              <button type="button" className={`mini-action ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} disabled={!blockState.can_chat}>
                {isRecording ? (language === 'en' ? '⏹ Stop recording' : '⏹ إيقاف التسجيل') : (language === 'en' ? '🎙 Voice note' : '🎙 تسجيل صوتي')}
              </button>
              <Button onClick={handleSend} disabled={sending || !blockState.can_chat}>{sending ? (language === 'en' ? 'Sending...' : 'جارٍ الإرسال...') : (language === 'en' ? 'Send' : 'إرسال')}</Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
