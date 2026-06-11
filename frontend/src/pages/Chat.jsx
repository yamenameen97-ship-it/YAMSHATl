import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import CallExperience from '../components/chat/CallExperience.jsx';
import MediaViewerModal from '../components/chat/MediaViewerModal.jsx';
import { Avatar, ChatBubble } from '../components/ui/index.js';
import useViewportHeight from '../hooks/useViewportHeight.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  blockUserApi,
  deleteMessageApi,
  getBlockStatus,
  getChatThreads,
  getMessages,
  getPresence,
  markMessagesSeen,
  sendMessageApi,
  unblockUserApi,
} from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';
import { useAppStore, useChatStore } from '../store/appStore.js';
import { MESSAGE_LIFECYCLE, normalizeMessageStatus, withLifecycle } from '../features/chat/messageLifecycle.js';
import { getChatPreferences, toggleChatPreference } from '../utils/chatPreferences.js';
import { formatLastSeen } from '../components/yamshat/YamshatDesign.js';
import { CHAT_NAV_ITEMS, buildContacts, getContactDetails } from '../features/chat/chatShellFixtures.js';
import BrandLogo from '../components/ui/BrandLogo.jsx';

const EMPTY_MESSAGES = [];
const REACTION_STORAGE_KEY = 'yamshat-message-reactions-v2';

function formatDayKey(value) {
  if (!value) return 'unknown';
  try {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  } catch {
    return 'unknown';
  }
}

function formatDayLabel(value) {
  if (!value) return 'اليوم';
  try {
    const date = new Date(value);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((startOfToday - startOfDate) / 86400000);
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    return date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return 'اليوم';
  }
}

function extractFileName(message) {
  if (message.attachment_name) return message.attachment_name;
  if (Array.isArray(message.attachments) && message.attachments[0]?.fileName) return message.attachments[0].fileName;
  const mediaUrl = message.media_url || '';
  if (!mediaUrl) return 'ملف مرفق';
  try {
    const clean = mediaUrl.split('?')[0];
    return decodeURIComponent(clean.split('/').pop() || 'ملف مرفق');
  } catch {
    return 'ملف مرفق';
  }
}

function messageMatchesSearch(message, query) {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return true;
  return [
    message.content,
    message.message,
    message.sender,
    extractFileName(message),
  ].some((value) => String(value || '').toLowerCase().includes(lowered));
}

function normalizeChatMessage(message = {}) {
  return withLifecycle({
    ...message,
    id: message?.id ?? message?.message_id ?? message?.client_id,
    client_id: message?.client_id ?? message?.id ?? message?.message_id,
  }, message?.status || message?.lifecycle?.status || MESSAGE_LIFECYCLE.SENT);
}

function normalizeMessages(messages = []) {
  const merged = new Map();
  (Array.isArray(messages) ? messages : []).forEach((entry) => {
    const message = normalizeChatMessage(entry);
    const key = String(message?.id || message?.client_id || `${message?.sender}:${message?.receiver}:${message?.created_at}`);
    const previous = merged.get(key);
    merged.set(
      key,
      previous
        ? normalizeChatMessage({
            ...previous,
            ...message,
            status: normalizeMessageStatus(message?.status || previous?.status),
          })
        : message,
    );
  });
  return Array.from(merged.values()).sort(
    (left, right) => new Date(left?.created_at || 0).getTime() - new Date(right?.created_at || 0).getTime(),
  );
}

function areGrouped(firstMessage, secondMessage) {
  if (!firstMessage || !secondMessage) return false;
  if (firstMessage.sender !== secondMessage.sender) return false;
  const firstStamp = new Date(firstMessage.created_at || 0).getTime();
  const secondStamp = new Date(secondMessage.created_at || 0).getTime();
  return Math.abs(secondStamp - firstStamp) <= 5 * 60 * 1000;
}

function resolveMediaType(message = {}) {
  const mediaUrl = String(message?.media_url || '');
  if (message?.type === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(mediaUrl)) return 'video';
  return 'image';
}

function readReactionStore() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(REACTION_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeReactionStore(store) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(store || {}));
}

function loadPeerReactions(peer) {
  const store = readReactionStore();
  return store?.[peer] || {};
}

function savePeerReactions(peer, reactions) {
  const store = readReactionStore();
  store[peer] = reactions || {};
  writeReactionStore(store);
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const peer = decodeURIComponent(userId || '').trim();
  const currentUser = getCurrentUsername();
  const { pushToast } = useToast();

  const threadsMap = useChatStore((state) => state.threadsByUsername);
  const conversationState = useChatStore((state) => (peer ? state.conversationsByPeer[peer] : null));
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const hydrateThreads = useChatStore((state) => state.hydrateThreads);
  const replaceConversationMessages = useChatStore((state) => state.replaceConversationMessages);
  const applyIncomingMessage = useChatStore((state) => state.applyIncomingMessage);
  const reconcileOptimisticMessage = useChatStore((state) => state.reconcileOptimisticMessage);
  const applyMessagePatch = useChatStore((state) => state.applyMessagePatch);
  const setPresenceStore = useChatStore((state) => state.setPresence);
  const markThreadRead = useChatStore((state) => state.markThreadRead);
  const queueAction = useAppStore((state) => state.queueAction);

  const [threadsLoading, setThreadsLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [replyTo, setReplyTo] = useState(null);
  const [callMode, setCallMode] = useState(null);
  const [flyingHearts, setFlyingHearts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [mediaViewerState, setMediaViewerState] = useState({ open: false, index: 0 });
  const initialChatPrefs = useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = useState(initialChatPrefs.muted.has(peer));
  const [isPinnedConversation, setIsPinnedConversation] = useState(initialChatPrefs.pinned.has(peer));
  const [reactionsByMessage, setReactionsByMessage] = useState(() => loadPeerReactions(peer));
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const searchInputRef = useRef(null);
  const messageNodesRef = useRef({});
  const shouldAutoScrollRef = useRef(true);
  const scrollMetricsRef = useRef({ height: 0, lastMessageId: '' });

  const handleSidebarNavigation = useCallback((key) => {
    const routeMap = {
      chats: '/inbox',
      groups: '/groups',
      friends: '/users',
      notifications: '/notifications',
      settings: '/settings',
    };
    const target = routeMap[key] || '/inbox';
    navigate(target);
    if (target !== '/inbox') {
      pushToast({ type: 'info', title: 'تم فتح القسم', description: 'تم تحويلك إلى القسم المطلوب من شريط المحادثة.' });
    }
  }, [navigate, pushToast]);

  const openChatSettings = useCallback(() => {
    if (!peer) return;
    navigate(`/chat/${encodeURIComponent(peer)}/settings`);
  }, [navigate, peer]);

  useViewportHeight();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('is-chat-open');
    return () => {
      document.body.classList.remove('is-chat-open');
    };
  }, []);

  const threadList = useMemo(() => Object.values(threadsMap || {}), [threadsMap]);
  const messages = useMemo(() => normalizeMessages(conversationState?.messages || EMPTY_MESSAGES), [conversationState?.messages]);
  const visibleMessages = useMemo(
    () => messages.filter((item) => messageMatchesSearch(item, searchQuery)),
    [messages, searchQuery],
  );
  const peerPresence = threadsMap?.[peer]?.presence || {};

  useEffect(() => {
    setReactionsByMessage(loadPeerReactions(peer));
  }, [peer]);

  useEffect(() => {
    if (!peer) return;
    savePeerReactions(peer, reactionsByMessage);
  }, [peer, reactionsByMessage]);

  useEffect(() => {
    let active = true;
    setThreadsLoading(true);
    getChatThreads()
      .then(({ data }) => {
        if (!active) return;
        const threads = Array.isArray(data) ? data : [];
        hydrateThreads(threads, { replace: true });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setThreadsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hydrateThreads]);

  const loadMessages = useCallback(async () => {
    if (!peer) return;
    setMsgLoading(true);
    try {
      const { data } = await getMessages(peer, 60);
      replaceConversationMessages(peer, data?.items || [], {
        hasMore: Boolean(data?.paging?.has_more),
        oldestMessageId: data?.paging?.next_before_id,
        limit: 250,
      });
      await markMessagesSeen(peer);
      markThreadRead(peer);
    } catch {
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحميل الرسائل' });
    } finally {
      setMsgLoading(false);
    }
  }, [markThreadRead, peer, pushToast, replaceConversationMessages]);

  useEffect(() => {
    if (!peer) return undefined;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
    setShowDetailsDrawer(false);
    setActivePeer(peer);
    loadMessages();

    getPresence(peer)
      .then(({ data }) => {
        setPresenceStore(peer, data || {});
      })
      .catch(() => {});

    getBlockStatus(peer)
      .then(({ data }) => {
        setBlockStatus(data || {});
      })
      .catch(() => {});

    return () => setActivePeer(null);
  }, [loadMessages, peer, setActivePeer, setPresenceStore]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const node = messagesAreaRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.clientHeight - node.scrollTop;
    const nearBottom = distanceFromBottom <= 120;
    shouldAutoScrollRef.current = nearBottom;
    setShowJumpToBottom(!nearBottom && messages.length > 0);
  }, [messages.length]);

  useLayoutEffect(() => {
    const node = messagesAreaRef.current;
    const latestMessage = visibleMessages[visibleMessages.length - 1];
    if (!node) return;

    const currentHeight = node.scrollHeight;
    const previousHeight = scrollMetricsRef.current.height;
    const previousLastMessageId = scrollMetricsRef.current.lastMessageId;
    const latestMessageId = String(latestMessage?.id || latestMessage?.client_id || '');
    const heightDelta = currentHeight - previousHeight;
    const shouldStickToBottom = previousHeight === 0 || shouldAutoScrollRef.current || latestMessage?.sender === currentUser || Boolean(replyTo);

    if (shouldStickToBottom) {
      window.requestAnimationFrame(() => scrollToBottom(previousHeight === 0 ? 'auto' : 'smooth'));
    } else if (heightDelta > 0 && previousLastMessageId !== latestMessageId) {
      node.scrollTop += heightDelta;
    }

    scrollMetricsRef.current = { height: currentHeight, lastMessageId: latestMessageId };
  }, [currentUser, replyTo, scrollToBottom, visibleMessages]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return undefined;
    const syncViewportWithConversation = () => {
      if (!shouldAutoScrollRef.current) return;
      window.requestAnimationFrame(() => scrollToBottom('auto'));
    };

    window.visualViewport.addEventListener('resize', syncViewportWithConversation);
    window.visualViewport.addEventListener('scroll', syncViewportWithConversation);
    return () => {
      window.visualViewport.removeEventListener('resize', syncViewportWithConversation);
      window.visualViewport.removeEventListener('scroll', syncViewportWithConversation);
    };
  }, [scrollToBottom]);

  useEffect(() => {
    const handleQueuedSent = (event) => {
      const detail = event?.detail || {};
      const serverMessage = detail?.response || {};
      if (!peer) return;
      const peerName = serverMessage?.sender === currentUser ? serverMessage?.receiver : serverMessage?.sender;
      if (peerName && peerName !== peer) return;
      reconcileOptimisticMessage(peer, detail.client_id || detail.queuedId, serverMessage);
    };

    const handleQueuedFailed = (event) => {
      const detail = event?.detail || {};
      applyMessagePatch(peer, [detail.client_id || detail.queuedId], withLifecycle({
        queue_error: detail.error || 'فشل دائم في مزامنة الرسالة',
      }, detail.permanent ? MESSAGE_LIFECYCLE.FAILED_PERMANENT : MESSAGE_LIFECYCLE.FAILED));
    };

    window.addEventListener('yamshat:queued-message-sent', handleQueuedSent);
    window.addEventListener('yamshat:queued-message-failed', handleQueuedFailed);
    return () => {
      window.removeEventListener('yamshat:queued-message-sent', handleQueuedSent);
      window.removeEventListener('yamshat:queued-message-failed', handleQueuedFailed);
    };
  }, [applyMessagePatch, peer, reconcileOptimisticMessage, currentUser]);

  const handleSend = async (payload) => {
    const text = payload?.text?.trim() || '';
    const mediaUrl = payload?.media_url || '';
    if (!text && !mediaUrl) return;

    const tempId = `tmp-${Date.now()}`;
    const requestPayload = {
      receiver: peer,
      message: text,
      media_url: mediaUrl,
      media_urls: payload?.media_urls || [],
      type: mediaUrl ? (payload.type || 'media') : 'text',
      reply_to_id: replyTo?.id || null,
      client_id: tempId,
      security_payload: payload?.securityPayload || null,
      disappearing_in_seconds: Number(payload?.disappearing_in_seconds || 0),
      attachments: payload?.attachments || [],
    };

    const initialStatus = typeof navigator !== 'undefined' && navigator.onLine === false
      ? MESSAGE_LIFECYCLE.QUEUED
      : MESSAGE_LIFECYCLE.SYNCING;

    const tempMsg = normalizeChatMessage({
      id: tempId,
      client_id: tempId,
      sender: currentUser,
      receiver: peer,
      content: text,
      message: text,
      media_url: mediaUrl,
      attachments: payload?.attachments || [],
      attachment_name: payload?.attachments?.[0]?.fileName || payload?.attachments?.[0]?.originalName || '',
      type: requestPayload.type,
      created_at: new Date().toISOString(),
      status: initialStatus,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content || replyTo.message } : null,
    });

    applyIncomingMessage(tempMsg, currentUser, { peer, skipUnreadIncrement: true, limit: 250 });
    hydrateThreads([
      {
        username: peer,
        last_message: text || '📎 مرفق',
        last_message_type: requestPayload.type,
        last_message_at: tempMsg.created_at,
      },
    ]);
    setReplyTo(null);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      queueAction({
        type: 'chat:send_message',
        priority: 'high',
        payload: requestPayload,
        client_id: tempId,
      });
      pushToast({ type: 'info', title: 'تمت جدولة الرسالة', description: 'الرسالة محفوظة وسيتم إرسالها عند عودة الاتصال.' });
      return;
    }

    try {
      const { data } = await sendMessageApi(requestPayload);
      reconcileOptimisticMessage(peer, tempId, data || {});
    } catch (error) {
      const statusCode = Number(error?.response?.status || 0);
      const shouldQueue = !statusCode || statusCode >= 500 || statusCode === 429;
      if (shouldQueue) {
        queueAction({
          type: 'chat:send_message',
          priority: 'high',
          payload: requestPayload,
          client_id: tempId,
          attempts: 0,
        });
        applyMessagePatch(
          peer,
          [tempId],
          withLifecycle({}, MESSAGE_LIFECYCLE.RETRYING, { queuedAt: new Date().toISOString() }),
        );
        pushToast({ type: 'warning', title: 'تعذر الإرسال الآن', description: 'تم نقل الرسالة إلى طابور المزامنة.' });
        return;
      }

      applyMessagePatch(
        peer,
        [tempId],
        withLifecycle({}, MESSAGE_LIFECYCLE.FAILED_PERMANENT, { error: error?.response?.data?.detail || 'فشل إرسال الرسالة' }),
      );
      pushToast({ type: 'error', title: 'خطأ', description: error?.response?.data?.detail || 'فشل إرسال الرسالة' });
    }
  };

  const handleDelete = async (msgId, deleteForEveryone = false) => {
    try {
      await deleteMessageApi(msgId, { delete_for_everyone: deleteForEveryone });
      applyMessagePatch(
        peer,
        [msgId],
        withLifecycle(
          {
            deleted: true,
            deleted_for_everyone: deleteForEveryone,
            content: '',
            message: '',
          },
          MESSAGE_LIFECYCLE.DELETED,
        ),
      );
      pushToast({ type: 'success', title: deleteForEveryone ? 'تم الحذف للجميع' : 'تم الحذف عندك' });
    } catch {
      pushToast({ type: 'error', title: 'تعذر الحذف' });
    }
  };

  const handleBlock = async () => {
    try {
      if (blockStatus.blocked_by_me) {
        await unblockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: false, can_chat: true }));
        pushToast({ type: 'success', title: 'تم رفع الحظر' });
      } else {
        await blockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: true, can_chat: false }));
        pushToast({ type: 'success', title: 'تم الحظر' });
      }
    } catch {
      pushToast({ type: 'error', title: 'تعذرت العملية' });
    }
  };

  const handleMuteConversation = () => {
    const nextSet = toggleChatPreference('muted', peer);
    const next = nextSet.has(peer);
    setIsMutedConversation(next);
    pushToast({ type: 'success', title: next ? 'تم كتم المحادثة' : 'تم إلغاء كتم المحادثة' });
  };

  const handlePinConversation = () => {
    const nextSet = toggleChatPreference('pinned', peer);
    const next = nextSet.has(peer);
    setIsPinnedConversation(next);
    pushToast({ type: 'success', title: next ? 'تم تثبيت المحادثة' : 'تم إلغاء التثبيت' });
  };

  const handleArchiveConversation = () => {
    toggleChatPreference('archived', peer);
    pushToast({ type: 'success', title: 'تم أرشفة المحادثة', description: 'يمكنك إظهارها من تبويب المؤرشفة في الصفحة الرئيسية.' });
  };

  const spawnHeart = () => {
    const id = Date.now();
    setFlyingHearts((prev) => [...prev, id]);
    setTimeout(() => setFlyingHearts((prev) => prev.filter((item) => item !== id)), 1800);
  };

  const handleReact = useCallback((message, emoji) => {
    const messageId = String(message?.id || message?.client_id);
    setReactionsByMessage((prev) => {
      const current = prev[messageId] || { counts: {}, myReaction: null };
      const nextCounts = { ...(current.counts || {}) };
      if (current.myReaction === emoji) {
        nextCounts[emoji] = Math.max(0, Number(nextCounts[emoji] || 0) - 1);
        if (!nextCounts[emoji]) delete nextCounts[emoji];
        return { ...prev, [messageId]: { counts: nextCounts, myReaction: null } };
      }
      if (current.myReaction) {
        nextCounts[current.myReaction] = Math.max(0, Number(nextCounts[current.myReaction] || 0) - 1);
        if (!nextCounts[current.myReaction]) delete nextCounts[current.myReaction];
      }
      nextCounts[emoji] = Number(nextCounts[emoji] || 0) + 1;
      return { ...prev, [messageId]: { counts: nextCounts, myReaction: emoji } };
    });
  }, []);

  const registerMessageNode = useCallback((id, node) => {
    if (!id) return;
    if (node) messageNodesRef.current[id] = node;
    else delete messageNodesRef.current[id];
  }, []);

  const jumpToReply = useCallback((messageId) => {
    if (!messageId) return;
    const target = messageNodesRef.current[String(messageId)];
    if (!target) {
      pushToast({ type: 'info', title: 'الرسالة المرجعية غير ظاهرة حالياً' });
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('reply-highlight');
    window.setTimeout(() => target.classList.remove('reply-highlight'), 1600);
  }, [pushToast]);

  const contacts = useMemo(() => buildContacts(threadList, peer), [peer, threadList]);
  const peerDetails = useMemo(() => getContactDetails(threadList, peer), [peer, threadList]);
  const filteredContacts = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    if (!lowered) return contacts;
    return contacts.filter((contact) => String(contact.username).toLowerCase().includes(lowered) || String(contact.preview).toLowerCase().includes(lowered));
  }, [contacts, searchQuery]);

  const isOnline = Boolean(peerPresence.is_online ?? peerDetails.isOnline);
  const isTyping = Boolean(peerPresence.is_typing);
  const lastSeen = peerPresence.last_seen;
  const mediaMessages = useMemo(() => messages.filter((item) => item.media_url), [messages]);
  const fileMessages = useMemo(() => messages.filter((item) => item.type === 'file' || item.type === 'voice'), [messages]);
  const mediaGallery = useMemo(() => mediaMessages.map((item, index) => ({
    id: String(item.id || item.client_id || index),
    type: resolveMediaType(item),
    url: item.media_url,
    title: extractFileName(item),
    caption: item.content || item.message || '',
  })), [mediaMessages]);
  const handleOpenMedia = useCallback((message) => {
    const id = String(message?.id || message?.client_id || '');
    const nextIndex = Math.max(0, mediaGallery.findIndex((entry) => entry.id === id));
    setMediaViewerState({ open: true, index: nextIndex });
  }, [mediaGallery]);
  const messageResultsCount = searchQuery.trim() ? visibleMessages.length : messages.length;
  const renderableItems = useMemo(() => {
    let lastDayKey = '';
    return visibleMessages.flatMap((message, index) => {
      const currentDayKey = formatDayKey(message.created_at);
      const items = [];
      if (currentDayKey !== lastDayKey) {
        items.push({ kind: 'day', id: `day-${currentDayKey}-${index}`, label: formatDayLabel(message.created_at) });
        lastDayKey = currentDayKey;
      }
      items.push({ kind: 'message', id: String(message.id || message.client_id || index), message, prevMessage: visibleMessages[index - 1], nextMessage: visibleMessages[index + 1] });
      return items;
    });
  }, [visibleMessages]);

  if (!peer) {
    return <Navigate to="/inbox" replace />;
  }

  return (
    <MainLayout hideNav lockScroll>
      <section className="yam-conversation-screen" dir="rtl">
        <style>{`
          .yam-conversation-screen {
            min-height: 100%;
            height: min(100dvh, var(--yam-vh, 100dvh));
            display: grid;
            grid-template-columns: 310px minmax(0, 1fr) 320px;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%),
              radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 20%),
              #040714;
            color: #fff;
            overflow: hidden;
          }
          .yam-chat-sidebar,
          .yam-side-profile-panel {
            background: linear-gradient(180deg, rgba(7,10,24,0.98), rgba(5,8,18,0.98));
            border-color: rgba(255,255,255,0.05);
            border-style: solid;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }
          .yam-chat-sidebar {
            border-inline-end-width: 1px;
            padding: 20px 16px 18px;
            gap: 18px;
          }
          .yam-side-profile-panel {
            border-inline-start-width: 1px;
            padding: 24px 18px;
            gap: 16px;
            overflow: auto;
          }
          .yam-sidebar-brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .yam-brand-mark {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            display: grid;
            place-items: center;
            font-weight: 900;
            font-size: 20px;
            color: white;
            background: linear-gradient(135deg, #8b5cf6, #4f46e5);
            box-shadow: 0 18px 30px rgba(91,33,182,0.35);
          }
          .yam-brand-name {
            letter-spacing: 0.36em;
            font-size: 18px;
            font-weight: 900;
          }
          .yam-primary-nav,
          .yam-contact-list {
            display: grid;
            gap: 10px;
          }
          .yam-nav-item {
            min-height: 54px;
            padding: 0 16px;
            border-radius: 18px;
            border: 1px solid transparent;
            background: transparent;
            color: #cbd5e1;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 800;
            text-align: right;
          }
          .yam-nav-item.active {
            color: #fff;
            background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(67,56,202,0.22));
            border-color: rgba(167,139,250,0.24);
          }
          .yam-nav-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.04);
            flex-shrink: 0;
          }
          .yam-sidebar-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-inline: 4px;
            font-weight: 800;
          }
          .yam-icon-action,
          .yam-stage-icon,
          .yam-detail-action,
          .yam-mini-stat,
          .yam-quick-card,
          .yam-list-pill {
            transition: all 180ms ease;
          }
          .yam-icon-action,
          .yam-stage-icon {
            width: 40px;
            height: 40px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: #fff;
          }
          .yam-contact-list {
            overflow: auto;
            min-height: 0;
          }
          .yam-contact-row,
          .yam-self-card {
            padding: 12px;
            border-radius: 22px;
            border: 1px solid transparent;
            background: rgba(255,255,255,0.02);
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
            text-align: right;
          }
          .yam-contact-row.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(79,70,229,0.1));
            border-color: rgba(167,139,250,0.2);
          }
          .yam-avatar-wrap {
            position: relative;
            flex-shrink: 0;
          }
          .yam-avatar-wrap.large {
            margin-inline: auto;
          }
          .yam-presence-pin {
            position: absolute;
            right: -2px;
            bottom: -2px;
          }
          .yam-contact-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
            flex: 1;
          }
          .yam-contact-copy strong,
          .yam-contact-copy span,
          .yam-side-profile-copy h2,
          .yam-side-profile-copy p {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-contact-copy span,
          .yam-side-profile-copy p {
            color: #94a3b8;
            font-size: 13px;
          }
          .yam-self-card {
            margin-top: auto;
            border-color: rgba(255,255,255,0.05);
          }
          .yam-chat-stage {
            min-width: 0;
            min-height: 0;
            display: grid;
            grid-template-rows: auto auto auto auto minmax(0, 1fr) auto;
            gap: 14px;
            padding: 20px 20px calc(16px + env(safe-area-inset-bottom, 0px));
            height: 100%;
            overflow: hidden;
          }
          .yam-stage-top-search,
          .yam-chat-stage-header,
          .yam-chat-details-drawer,
          .yam-block-banner,
          .yam-search-summary,
          .yam-messages-area,
          .yam-chat-input-wrap,
          .yam-info-card {
            border-radius: 26px;
            border: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(180deg, rgba(7,10,24,0.95), rgba(4,7,18,0.98));
          }
          .yam-chat-input-wrap {
            flex-shrink: 0;
            position: sticky;
            bottom: 0;
            z-index: 50;
            border-radius: 26px 26px 0 0;
            border-bottom: none !important;
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
            box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.32);
            transform: translateZ(0);
            will-change: transform;
          }
          .yam-stage-top-search {
            min-height: 60px;
            padding: 0 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #94a3b8;
          }
          .yam-stage-top-search input {
            flex: 1;
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            color: #fff;
            font-size: 15px;
          }
          .yam-clear-search {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            border: none;
            background: rgba(255,255,255,0.06);
            color: #fff;
          }
          .yam-chat-stage-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 16px 18px;
            flex-shrink: 0;
            position: relative;
            z-index: 20;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .yam-chat-stage-peer {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
          }
          .yam-chat-stage-peer-button,
          .yam-mobile-peer-button {
            all: unset;
            display: flex;
            align-items: center;
            gap: inherit;
            min-width: 0;
            cursor: pointer;
            text-align: right;
          }
          .yam-chat-stage-peer-button {
            flex: 1;
          }
          .yam-chat-stage-peer-copy {
            min-width: 0;
            display: grid;
            gap: 6px;
          }
          .yam-chat-stage-peer-copy strong {
            font-size: 20px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-chat-stage-peer-copy span {
            color: #94a3b8;
            font-size: 13px;
          }
          .yam-chat-stage-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .yam-chat-details-drawer {
            padding: 16px;
          }
          .yam-details-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 10px;
          }
          .yam-detail-action {
            min-height: 44px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #fff;
            padding: 0 10px;
          }
          .yam-detail-action.danger,
          .yam-block-banner.blocked {
            background: rgba(239,68,68,0.14);
            border-color: rgba(248,113,113,0.24);
          }
          .yam-block-banner,
          .yam-search-summary {
            min-height: 52px;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #f8fafc;
          }
          .yam-block-banner button {
            min-height: 34px;
            padding: 0 12px;
            border-radius: 999px;
            border: none;
            background: rgba(255,255,255,0.08);
            color: #fff;
          }
          .yam-messages-area {
            min-height: 0;
            flex: 1;
            overflow-y: auto !important;
            overflow-x: hidden;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            scroll-padding-bottom: 132px;
            scrollbar-gutter: stable both-edges;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.5) rgba(255,255,255,0.04);
            padding: 18px 18px calc(26px + var(--yam-keyboard-offset, 0px));
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.06), transparent 22%),
              radial-gradient(circle at bottom left, rgba(59,130,246,0.05), transparent 22%),
              linear-gradient(180deg, rgba(7,10,24,0.95), rgba(4,7,18,0.98));
            contain: layout style paint;
          }
          .yam-day-divider {
            align-self: center;
            margin: 8px 0 14px;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: #cbd5e1;
            font-size: 12px;
          }
          .yam-message-row {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            margin-bottom: 8px;
            animation: message-slide-up 0.3s ease-out;
            contain: layout style;
          }
          @keyframes message-slide-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .yam-message-row.me {
            justify-content: flex-start;
            flex-direction: row-reverse;
          }
          .yam-message-row.them {
            justify-content: flex-start;
          }
          .yam-message-row.grouped-prev {
            margin-top: -4px;
          }
          .yam-message-row.grouped-next {
            margin-bottom: 2px;
          }
          .yam-message-avatar {
            width: 34px;
            min-width: 34px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            opacity: 0;
          }
          .yam-message-avatar.visible {
            opacity: 1;
          }
          .yam-message-stack {
            display: grid;
            gap: 4px;
            min-width: 0;
            max-width: min(76%, 760px);
          }
          .yam-message-row.me .yam-message-stack {
            justify-items: end;
          }
          .yam-message-row.them .yam-message-stack {
            justify-items: start;
          }
          .yam-bubble {
            position: relative;
            min-width: 118px;
            padding: 13px 15px 10px;
            border-radius: 26px;
            box-shadow: 0 14px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05);
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
            border: 1px solid rgba(255,255,255,0.08);
          }
          .bubble-me {
            background: linear-gradient(135deg, rgba(124,58,237,0.96), rgba(79,70,229,0.92));
            border-top-left-radius: 18px;
          }
          .bubble-them {
            background: rgba(255,255,255,0.07);
            border-top-right-radius: 18px;
          }
          .yam-message-row.grouped-prev .bubble-me {
            border-top-left-radius: 26px;
          }
          .yam-message-row.grouped-next .bubble-me {
            border-bottom-left-radius: 14px;
          }
          .yam-message-row.grouped-prev .bubble-them {
            border-top-right-radius: 26px;
          }
          .yam-message-row.grouped-next .bubble-them {
            border-bottom-right-radius: 14px;
          }
          .yam-bubble.search-hit,
          .yam-message-row.reply-highlight .yam-bubble,
          .reply-highlight .yam-bubble {
            border-color: rgba(167,139,250,0.38);
            box-shadow: 0 0 0 3px rgba(167,139,250,0.14), 0 18px 40px rgba(79,70,229,0.18);
          }
          .yam-bubble:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 34px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
          }
          .yam-bubble-more {
            position: absolute;
            inset-inline-end: 10px;
            top: 10px;
            width: 26px;
            height: 26px;
            border-radius: 999px;
            border: none;
            background: rgba(255,255,255,0.08);
            color: inherit;
            opacity: 0;
            transform: translateY(4px);
            transition: all 160ms ease;
          }
          .yam-bubble.toolbar-open .yam-bubble-more,
          .yam-bubble:hover .yam-bubble-more,
          .yam-bubble:focus-within .yam-bubble-more {
            opacity: 1;
            transform: translateY(0);
          }
          .yam-bubble-toolbar {
            position: absolute;
            inset-inline-end: 10px;
            top: -20px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(7,12,25,0.96);
            box-shadow: 0 18px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
            backdrop-filter: blur(18px);
            z-index: 3;
          }
          .yam-bubble-toolbar button,
          .yam-reaction-chip,
          .yam-reply-preview,
          .yam-file-card {
            transition: all 160ms ease;
          }
          .yam-bubble-toolbar button {
            border: none;
            background: rgba(255,255,255,0.06);
            color: #fff;
            min-width: 34px;
            height: 34px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          }
          .yam-bubble-toolbar button:hover {
            background: rgba(255,255,255,0.12);
            transform: translateY(-1px);
          }
          .yam-reply-preview {
            width: 100%;
            border: none;
            margin-bottom: 10px;
            padding: 10px 12px;
            border-radius: 16px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            text-align: right;
            display: grid;
            gap: 4px;
            border-right: 3px solid rgba(196,181,253,0.88);
          }
          .yam-reply-preview span,
          .yam-file-copy small {
            color: #dbe4ff;
            opacity: 0.8;
          }
          .yam-media-button {
            width: 100%;
            border: none;
            padding: 0;
            margin-bottom: 10px;
            border-radius: 20px;
            overflow: hidden;
            background: rgba(255,255,255,0.04);
            position: relative;
            cursor: zoom-in;
          }
          .yam-video-preview-shell::after {
            content: '▶';
            position: absolute;
            inset: 50% auto auto 50%;
            transform: translate(-50%, -50%);
            width: 58px;
            height: 58px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: rgba(0,0,0,0.44);
            color: #fff;
            font-size: 22px;
            backdrop-filter: blur(14px);
            box-shadow: 0 18px 34px rgba(0,0,0,0.34);
          }
          .yam-bubble-media {
            width: min(100%, 340px);
            max-height: 320px;
            object-fit: cover;
            border-radius: 18px;
            display: block;
          }
          .yam-bubble-media-overlay {
            position: absolute;
            inset-inline-end: 12px;
            bottom: 12px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(0,0,0,0.48);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            backdrop-filter: blur(10px);
          }
          .yam-voice-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          }
          .yam-voice-header {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .yam-voice-play {
            width: 42px;
            height: 42px;
            border-radius: 999px;
            border: none;
            background: linear-gradient(135deg, rgba(129,140,248,0.88), rgba(168,85,247,0.86));
            color: #fff;
            font-size: 16px;
            box-shadow: 0 12px 24px rgba(79,70,229,0.24);
          }
          .yam-voice-copy {
            min-width: 0;
            display: grid;
            gap: 2px;
            flex: 1;
          }
          .yam-voice-copy span {
            color: rgba(255,255,255,0.74);
            font-size: 12px;
          }
          .yam-voice-rates {
            display: inline-flex;
            gap: 6px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .yam-speed-pill {
            min-height: 28px;
            padding: 0 10px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.06);
            color: #fff;
            font-size: 11px;
            font-weight: 800;
          }
          .yam-speed-pill.active {
            background: rgba(167,139,250,0.22);
            border-color: rgba(196,181,253,0.34);
          }
          .yam-voice-seek {
            border: none;
            padding: 0;
            background: transparent;
            text-align: inherit;
            width: 100%;
            cursor: pointer;
          }
          .yam-file-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 18px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            text-decoration: none;
          }
          .yam-file-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.08);
            flex-shrink: 0;
          }
          .yam-file-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
          }
          .yam-file-copy strong {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .bubble-text {
            font-size: 15px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .bubble-deleted {
            font-size: 14px;
            color: #cbd5e1;
            font-style: italic;
          }
          .bubble-meta {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            margin-top: 8px;
            color: rgba(255,255,255,0.78);
            font-size: 11px;
          }
          .yam-reaction-summary {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            min-height: 28px;
          }
          .yam-reaction-summary.me {
            justify-content: flex-end;
          }
          .yam-reaction-chip {
            min-height: 32px;
            padding: 0 12px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.07);
            color: #fff;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            box-shadow: 0 10px 24px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.05);
          }
          .yam-reaction-chip:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.11);
          }
          .yam-reaction-chip.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.32), rgba(79,70,229,0.26));
            border-color: rgba(167,139,250,0.28);
          }
          .yam-typing-row {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            align-self: flex-start;
            margin: 6px 0 12px;
            color: rgba(255,255,255,0.82);
          }
          .yam-typing-avatar {
            width: 34px;
            display: grid;
            place-items: center;
          }
          .yam-typing-bubble {
            min-height: 42px;
            padding: 0 14px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 16px 34px rgba(0,0,0,0.18);
          }
          .yam-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(180deg, #c4b5fd, #60a5fa);
            animation: yamTypingPulse 900ms ease-in-out infinite;
          }
          .yam-typing-dot:nth-child(2) { animation-delay: 120ms; }
          .yam-typing-dot:nth-child(3) { animation-delay: 240ms; }
          @keyframes yamTypingPulse {
            0%, 100% { transform: translateY(0); opacity: 0.45; }
            50% { transform: translateY(-4px); opacity: 1; }
          }
          .yam-chat-input-wrap {
            padding: 12px;
            position: sticky;
            bottom: 0;
            z-index: 50;
            background: linear-gradient(180deg, rgba(4,7,18,0.86), rgba(4,7,18,0.99));
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border-radius: 26px 26px 0 0;
            box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.34), 0 -2px 0 rgba(167, 139, 250, 0.08);
            padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
            transform: translateZ(0);
            will-change: transform;
          }
          .yam-scroll-jump {
            position: sticky;
            bottom: 10px;
            margin-inline-start: auto;
            margin-top: auto;
            align-self: flex-end;
            min-height: 38px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid rgba(167,139,250,0.24);
            background: rgba(15,23,42,0.9);
            color: #fff;
            box-shadow: 0 16px 32px rgba(0,0,0,0.22);
            z-index: 5;
          }
          .yam-scroll-jump:hover {
            transform: translateY(-1px);
          }
          .yam-call-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            z-index: 40;
            background: rgba(2,6,23,0.48);
            backdrop-filter: blur(10px);
          }
          .yam-empty-state {
            min-height: 180px;
            display: grid;
            place-items: center;
            text-align: center;
            color: #94a3b8;
          }
          .yam-empty-state.rich {
            gap: 8px;
            align-content: center;
          }
          .flying-hearts-layer {
            pointer-events: none;
            position: absolute;
            inset: 0;
            overflow: hidden;
          }
          .flying-heart {
            position: absolute;
            bottom: 20px;
            left: calc(50% + (var(--random, 0) * 1px));
            animation: yam-heart-rise 1.8s ease forwards;
            font-size: 24px;
          }
          @keyframes yam-heart-rise {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translateY(-180px) translateX(30px) scale(1.2); opacity: 0; }
          }
          .yam-side-profile-top {
            display: grid;
            gap: 18px;
            justify-items: center;
          }
          .yam-side-profile-copy {
            text-align: center;
          }
          .yam-side-profile-copy h2 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
          }
          .yam-quick-actions {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }
          .yam-quick-card {
            min-height: 82px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.03);
            color: white;
            display: grid;
            place-items: center;
            gap: 6px;
          }
          .yam-quick-card small {
            color: #cbd5e1;
            font-size: 12px;
          }
          .yam-info-card {
            padding: 18px;
            display: grid;
            gap: 14px;
          }
          .yam-info-title {
            font-size: 18px;
            font-weight: 900;
          }
          .yam-info-row {
            display: grid;
            gap: 6px;
          }
          .yam-info-row span {
            color: #94a3b8;
            font-size: 12px;
          }
          .yam-info-row strong {
            color: #a78bfa;
            font-size: 15px;
            word-break: break-word;
          }
          /* ============ Mobile Header (visible only on mobile) ============ */
          .yam-mobile-topbar {
            display: none;
          }
          @media (max-width: 1280px) {
            .yam-conversation-screen {
              grid-template-columns: 290px minmax(0, 1fr);
            }
            .yam-side-profile-panel {
              display: none;
            }
          }
          @media (max-width: 980px) {
            .yam-conversation-screen {
              grid-template-columns: minmax(0, 1fr);
              background: #040714;
              height: 100dvh;
              max-height: 100dvh;
            }
            .yam-chat-sidebar {
              display: none;
            }
            /* show mobile topbar */
            .yam-mobile-topbar {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px 14px;
              padding-top: calc(10px + env(safe-area-inset-top, 0px));
              background: linear-gradient(180deg, rgba(7,10,24,0.98), rgba(5,8,18,0.96));
              border-bottom: 1px solid rgba(255,255,255,0.06);
              position: sticky;
              top: 0;
              z-index: 20;
            }
            .yam-mobile-back-btn {
              width: 38px;
              height: 38px;
              border-radius: 12px;
              border: none;
              background: transparent;
              color: #a78bfa;
              font-size: 22px;
              display: grid;
              place-items: center;
              cursor: pointer;
              flex-shrink: 0;
            }
            .yam-mobile-peer-button {
              flex: 1;
              min-width: 0;
            }
            .yam-mobile-peer-info {
              display: flex;
              align-items: center;
              gap: 10px;
              flex: 1;
              min-width: 0;
            }
            .yam-mobile-peer-copy {
              min-width: 0;
              display: grid;
              gap: 2px;
            }
            .yam-mobile-peer-copy strong {
              font-size: 15px;
              font-weight: 800;
              color: #fff;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .yam-mobile-peer-copy span {
              font-size: 11px;
              color: #94a3b8;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .yam-mobile-peer-copy span.online {
              color: #4ade80;
            }
            .yam-mobile-actions {
              display: flex;
              align-items: center;
              gap: 4px;
              flex-shrink: 0;
            }
            .yam-mobile-action-btn {
              width: 38px;
              height: 38px;
              border-radius: 12px;
              border: none;
              background: transparent;
              color: #a78bfa;
              font-size: 18px;
              display: grid;
              place-items: center;
              cursor: pointer;
            }
            .yam-mobile-action-btn:hover {
              background: rgba(124,58,237,0.12);
            }
            /* hide desktop header & top search on mobile */
            .yam-stage-top-search,
            .yam-chat-stage-header {
              display: none !important;
            }
            .yam-chat-stage {
              padding: 0;
              gap: 0;
              grid-template-rows: auto auto minmax(0, 1fr) auto;
              height: 100%;
              min-height: 0;
            }
            .yam-chat-details-drawer {
              border-radius: 0;
              border-left: none;
              border-right: none;
              border-top: none;
            }
            .yam-details-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .yam-block-banner,
            .yam-search-summary {
              border-radius: 0;
              border-left: none;
              border-right: none;
              border-top: none;
            }
            .yam-messages-area {
              border-radius: 0;
              border: none;
              padding: 14px 12px calc(150px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
              scroll-padding-top: 72px;
              scroll-padding-bottom: 170px;
              background:
                radial-gradient(circle at top right, rgba(124,58,237,0.05), transparent 30%),
                radial-gradient(circle at bottom left, rgba(59,130,246,0.04), transparent 30%),
                #040714;
            }
            .yam-chat-input-wrap {
              position: sticky;
              bottom: 0;
              z-index: 60;
              border-radius: 22px 22px 0 0;
              border-left: none;
              border-right: none;
              border-bottom: none;
              padding: 10px 10px;
              padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
              background: linear-gradient(180deg, rgba(7,10,24,0.94), rgba(5,8,18,0.99));
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              box-shadow: 0 -16px 36px rgba(0,0,0,0.42), 0 -2px 0 rgba(167, 139, 250, 0.1);
              transform: translateZ(0);
              will-change: transform;
            }
            .yam-message-stack {
              max-width: 82%;
            }
            .yam-bubble {
              padding: 10px 14px 8px;
              border-radius: 20px;
            }
            .yam-bubble-toolbar {
              inset-inline-end: 8px;
              top: -14px;
              gap: 4px;
              padding: 4px;
            }
          }
          @media (max-width: 480px) {
            .yam-message-stack {
              max-width: 86%;
            }
            .yam-mobile-topbar {
              padding: 8px 10px;
              padding-top: calc(8px + env(safe-area-inset-top, 0px));
            }
          }
        `}</style>

        <aside className="yam-chat-sidebar">
          <div className="yam-sidebar-brand">
            <div className="yam-brand-mark">
              <BrandLogo size={30} alt="Yamshat" className="yam-brand-mark-image" />
            </div>
            <div className="yam-brand-name">YAMSHAT</div>
          </div>

          <nav className="yam-primary-nav">
            {CHAT_NAV_ITEMS.map((item, index) => (
              <button key={item.key} type="button" className={`yam-nav-item ${item.key === 'chats' ? 'active' : ''}`} onClick={() => handleSidebarNavigation(item.key)}>
                <span className="yam-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="yam-sidebar-head">
            <span>جهات الاتصال</span>
            <button type="button" className="yam-icon-action" onClick={() => navigate('/users')}>＋</button>
          </div>

          <div className="yam-contact-list">
            {filteredContacts.map((contact) => (
              <button
                key={contact.username}
                type="button"
                className={`yam-contact-row ${contact.username === peer ? 'active' : ''}`}
                onClick={() => navigate(`/chat/${encodeURIComponent(contact.username)}`)}
              >
                <div className="yam-avatar-wrap">
                  <Avatar
                    name={contact.username}
                    src={contact.avatar}
                    size={54}
                    showStatus
                    status={(contact.username === peer ? isOnline : contact.isOnline) ? 'online' : 'offline'}
                  />
                </div>
                <div className="yam-contact-copy">
                  <strong>{contact.username}</strong>
                  <span>{contact.username === peer ? (isTyping ? 'يكتب الآن...' : (peerDetails.preview || contact.preview)) : contact.preview}</span>
                </div>
                {Number(contact.unreadCount || 0) > 0 ? <span className="yam-mini-stat">{contact.unreadCount}</span> : null}
              </button>
            ))}
          </div>

          <div className="yam-self-card">
            <div className="yam-avatar-wrap">
              <Avatar name={currentUser || 'يوسف محمد'} size={52} showStatus status="online" />
            </div>
            <div className="yam-contact-copy">
              <strong>{currentUser || 'يوسف محمد'}</strong>
              <span>متصل الآن</span>
            </div>
            <button type="button" className="yam-icon-action subtle" onClick={() => navigate('/settings')}>⋮</button>
          </div>
        </aside>

        <main className="yam-chat-stage">
          {/* Mobile-only topbar (matches reference mobile design) */}
          <div className="yam-mobile-topbar">
            <button type="button" className="yam-mobile-back-btn" onClick={() => navigate('/inbox')} aria-label="رجوع">←</button>
            <button type="button" className="yam-mobile-peer-button" onClick={openChatSettings} aria-label="إعدادات المحادثة">
              <div className="yam-mobile-peer-info">
                <div className="yam-avatar-wrap">
                  <Avatar name={peer} src={peerDetails.avatar} size={40} showStatus status={isOnline ? 'online' : 'offline'} />
                </div>
                <div className="yam-mobile-peer-copy">
                  <strong>{peer}</strong>
                  <span className={isOnline ? 'online' : ''}>
                    {isTyping ? 'يكتب الآن...' : formatLastSeen(lastSeen, isOnline)}
                  </span>
                </div>
              </div>
            </button>
            <div className="yam-mobile-actions">
              <button type="button" className="yam-mobile-action-btn" onClick={() => setCallMode('voice')} aria-label="اتصال">📞</button>
              <button type="button" className="yam-mobile-action-btn" onClick={() => setCallMode('video')} aria-label="فيديو">🎥</button>
              <button type="button" className="yam-mobile-action-btn" onClick={() => setShowDetailsDrawer((prev) => !prev)} aria-label="المزيد">⋮</button>
            </div>
          </div>

          <div className="yam-stage-top-search">
            <span>⌕</span>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="بحث داخل الرسائل أو المرفقات..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery ? <button type="button" className="yam-clear-search" onClick={() => setSearchQuery('')}>×</button> : null}
          </div>

          <header className="yam-chat-stage-header">
            <div className="yam-chat-stage-peer">
              <button type="button" className="yam-chat-stage-peer-button" onClick={openChatSettings} aria-label="إعدادات المحادثة">
                <div className="yam-avatar-wrap">
                  <Avatar name={peer} src={peerDetails.avatar} size={56} ring showStatus status={isOnline ? 'online' : 'offline'} />
                </div>
                <div className="yam-chat-stage-peer-copy">
                  <strong>{peer}</strong>
                  <span>{isTyping ? 'يكتب الآن...' : formatLastSeen(lastSeen, isOnline)}</span>
                </div>
              </button>
            </div>

            <div className="yam-chat-stage-actions">
              <button type="button" className="yam-stage-icon" onClick={() => setCallMode('voice')}>📞</button>
              <button type="button" className="yam-stage-icon" onClick={() => setCallMode('video')}>🎥</button>
              <button type="button" className="yam-stage-icon" onClick={() => searchInputRef.current?.focus()}>⌕</button>
              <button type="button" className="yam-stage-icon" onClick={() => setShowDetailsDrawer((prev) => !prev)}>⋮</button>
            </div>
          </header>

          {showDetailsDrawer ? (
            <div className="yam-chat-details-drawer">
              <div className="yam-details-grid">
                <button type="button" className="yam-detail-action" onClick={handleMuteConversation}>{isMutedConversation ? 'إلغاء الكتم' : 'كتم المحادثة'}</button>
                <button type="button" className="yam-detail-action" onClick={handlePinConversation}>{isPinnedConversation ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}</button>
                <button type="button" className="yam-detail-action" onClick={spawnHeart}>تفاعل سريع</button>
                <button type="button" className="yam-detail-action" onClick={handleArchiveConversation}>أرشفة المحادثة</button>
                <button type="button" className="yam-detail-action danger" onClick={handleBlock}>{blockStatus.blocked_by_me ? 'رفع الحظر' : 'حظر المستخدم'}</button>
              </div>
            </div>
          ) : null}

          <div className="flying-hearts-layer" aria-hidden>
            {flyingHearts.map((id) => (
              <span key={id} className="flying-heart">💜</span>
            ))}
          </div>

          {callMode ? (
            <div className="yam-call-overlay">
              <CallExperience
                open={Boolean(callMode)}
                mode={callMode}
                callType="direct"
                participantName={peer}
                onClose={() => setCallMode(null)}
                onStatusChange={() => {}}
              />
            </div>
          ) : null}

          {!blockStatus.can_chat && blockStatus.blocked_by_me ? (
            <div className="yam-block-banner">
              لقد حظرت هذا المستخدم.
              <button type="button" onClick={handleBlock}>رفع الحظر</button>
            </div>
          ) : null}
          {!blockStatus.can_chat && blockStatus.blocked_me ? <div className="yam-block-banner blocked">هذا المستخدم حظرك.</div> : null}

          {searchQuery.trim() ? (
            <div className="yam-search-summary">نتائج البحث: {messageResultsCount}</div>
          ) : null}

          <div className="yam-messages-area" ref={messagesAreaRef} onScroll={handleMessagesScroll}>
            {threadsLoading && !peerDetails.username ? <div className="yam-empty-state">جارٍ تجهيز بيانات المحادثة...</div> : null}
            {msgLoading ? <div className="yam-empty-state">جارٍ تحميل الرسائل...</div> : null}
            {!msgLoading && !messages.length ? (
              <div className="yam-empty-state rich">
                <strong>ابدأ المحادثة مع {peer}</strong>
                <span>تم تحسين الفقاعات، الردود، التفاعلات، ومنطقة الكتابة من نفس الشاشة.</span>
              </div>
            ) : null}
            {!msgLoading && messages.length > 0 && !visibleMessages.length ? (
              <div className="yam-empty-state">لا توجد رسائل تطابق عبارة البحث.</div>
            ) : null}

            {renderableItems.map((item) => {
              if (item.kind === 'day') {
                return <div key={item.id} className="yam-day-divider">{item.label}</div>;
              }
              const msg = item.message;
              return (
                <ChatBubble
                  key={item.id}
                  message={msg}
                  isMe={msg.sender === currentUser}
                  prevMessage={item.prevMessage}
                  nextMessage={item.nextMessage}
                  onReply={(message) => setReplyTo(message)}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  reactionState={reactionsByMessage[String(msg.id || msg.client_id)] || { counts: {}, myReaction: null }}
                  onJumpToReply={jumpToReply}
                  highlightQuery={searchQuery}
                  registerMessageNode={registerMessageNode}
                  onOpenMedia={handleOpenMedia}
                />
              );
            })}
            {isTyping ? (
              <div className="yam-typing-row">
                <div className="yam-typing-avatar">
                  <Avatar name={peer} src={peerDetails.avatar} size="sm" showStatus status="online" />
                </div>
                <div className="yam-typing-bubble">
                  <span className="yam-typing-dot" />
                  <span className="yam-typing-dot" />
                  <span className="yam-typing-dot" />
                </div>
                <small>{peer} بيكتب دلوقتي…</small>
              </div>
            ) : null}
            {showJumpToBottom ? (
              <button
                type="button"
                className="yam-scroll-jump"
                onClick={() => {
                  shouldAutoScrollRef.current = true;
                  setShowJumpToBottom(false);
                  scrollToBottom('smooth');
                }}
              >
                أحدث الرسائل ↓
              </button>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="yam-chat-input-wrap">
            <ChatInput
              peer={peer}
              currentUser={currentUser}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onSend={handleSend}
              disabled={!blockStatus.can_chat}
              compact
            />
          </div>
        </main>

        <aside className="yam-side-profile-panel">
          <div className="yam-side-profile-top">
            <div className="yam-avatar-wrap large">
              <Avatar name={peer} src={peerDetails.avatar} size={120} ring showStatus status={isOnline ? 'online' : 'offline'} />
            </div>
            <div className="yam-side-profile-copy">
              <h2>{peer}</h2>
              <p>{formatLastSeen(lastSeen, isOnline)}</p>
            </div>
          </div>

          <div className="yam-quick-actions">
            {[
              { key: 'call', label: 'اتصال', icon: '📞', action: () => setCallMode('voice') },
              { key: 'video', label: 'فيديو', icon: '🎥', action: () => setCallMode('video') },
              { key: 'search', label: 'بحث', icon: '⌕', action: () => searchInputRef.current?.focus() },
              { key: 'more', label: 'المزيد', icon: '⋯', action: () => setShowDetailsDrawer((prev) => !prev) },
            ].map((item) => (
              <button key={item.key} type="button" className="yam-quick-card" onClick={item.action}>
                <span>{item.icon}</span>
                <small>{item.label}</small>
              </button>
            ))}
          </div>

          <div className="yam-info-card">
            <div className="yam-info-title">نظرة سريعة</div>
            <div className="yam-info-row"><span>اسم المستخدم</span><strong>{peerDetails.handle || 'غير متوفر'}</strong></div>
            <div className="yam-info-row"><span>البريد</span><strong>{peerDetails.email || 'غير متوفر'}</strong></div>
            <div className="yam-info-row"><span>الهاتف</span><strong>{peerDetails.phone || 'غير متوفر'}</strong></div>
            <div className="yam-info-row"><span>الوسائط</span><strong>{mediaMessages.length}</strong></div>
            <div className="yam-info-row"><span>الملفات والصوتيات</span><strong>{fileMessages.length}</strong></div>
          </div>
        </aside>
      </section>
      <MediaViewerModal
        items={mediaViewerState.open ? mediaGallery : []}
        initialIndex={mediaViewerState.index}
        onClose={() => setMediaViewerState({ open: false, index: 0 })}
      />
    </MainLayout>
  );
}
