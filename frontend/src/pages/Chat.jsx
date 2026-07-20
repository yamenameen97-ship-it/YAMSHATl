import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import CallExperience from '../components/chat/CallExperience.jsx';
import MediaViewerModal from '../components/chat/MediaViewerModal.jsx';
import MediaPreviewModal from '../components/chat/MediaPreviewModal.jsx';
import MessageActionsToolbar from '../components/chat/MessageActionsToolbar.jsx';
import MessageReactionPicker from '../components/chat/MessageReactionPicker.jsx';
import CallBubble from '../components/chat/CallBubble.jsx';
/* v61: تم حذف chat-mobile-fixes.css. التنسيقات الآن في chat-redesign-v61.css
   المُحمّل عبر main.jsx ليفوز في cascade. */
import { Avatar, ChatBubble } from '../components/ui/index.js';
import useViewportHeight from '../hooks/useViewportHeight.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  blockUserApi,
  deleteMessageApi,
  editMessage as editMessageApi,
  getBlockStatus,
  getChatThreads,
  getMessages,
  getPresence,
  markMessagesSeen,
  reactToMessage,
  sendMessageApi,
  unblockUserApi,
  unreactToMessage,
} from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';
import { useAppStore, useChatStore } from '../store/appStore.js';
import { MESSAGE_LIFECYCLE, normalizeMessageStatus, withLifecycle } from '../features/chat/messageLifecycle.js';
import { getChatPreferences, toggleChatPreference } from '../utils/chatPreferences.js';
import { formatLastSeen } from '../components/yamshat/YamshatDesign.js';
import { CHAT_NAV_ITEMS, buildContacts, getContactDetails } from '../features/chat/chatShellFixtures.js';
import BrandLogo from '../components/ui/BrandLogo.jsx';
// ✅ v59.13.17 FIX #1+#2: ReportModal الموحّد بدلاً من window.prompt للإبلاغ، ومحرّر تعديل داخلي بدلاً من window.prompt للتعديل
import ReportModal from '../components/reports/ReportModal.jsx';
// ✅ v59.13.36 FIX: socketManager للاستماع المباشر لحدث typing_update داخل الصفحة
// كألية احتياطية تضمن ظهور مؤشر “يكتب الآن...” حتى لو فشل تحديث useChatStore
import socketManager from '../services/socketManager.js';

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

const IMAGE_MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic|heif)(?:$|\?)/i;
const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|mkv)(?:$|\?)/i;
const AUDIO_MEDIA_RE = /\.(mp3|wav|ogg|oga|m4a|aac|opus|webm)(?:$|\?)/i;

function getPrimaryAttachment(message = {}) {
  return Array.isArray(message?.attachments) && message.attachments.length ? (message.attachments[0] || {}) : {};
}

function resolveMessageMediaUrl(message = {}) {
  const attachment = getPrimaryAttachment(message);
  return String(
    message?.media_url
    || message?.media_urls?.[0]
    || attachment?.url
    || attachment?.mediaUrl
    || attachment?.media_url
    || ''
  ).trim();
}

function extractFileName(message) {
  const attachment = getPrimaryAttachment(message);
  if (message.attachment_name) return message.attachment_name;
  if (attachment?.fileName) return attachment.fileName;
  if (attachment?.file_name) return attachment.file_name;
  if (attachment?.name) return attachment.name;
  const mediaUrl = resolveMessageMediaUrl(message);
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
  const attachment = getPrimaryAttachment(message);
  const mediaUrl = resolveMessageMediaUrl(message);
  const resolvedType = String(
    message?.type
    || message?.message_type
    || attachment?.kind
    || attachment?.type
    || attachment?.mediaType
    || attachment?.media_type
    || ''
  ).trim().toLowerCase();

  return withLifecycle({
    ...message,
    id: message?.id ?? message?.message_id ?? message?.client_id,
    client_id: message?.client_id ?? message?.id ?? message?.message_id,
    media_url: mediaUrl || message?.media_url || '',
    type: resolvedType || message?.type || (mediaUrl ? 'media' : 'text'),
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
  const attachment = getPrimaryAttachment(message);
  const mediaUrl = resolveMessageMediaUrl(message).toLowerCase();
  const rawType = String(
    message?.type
    || message?.message_type
    || attachment?.kind
    || attachment?.type
    || attachment?.mediaType
    || attachment?.media_type
    || ''
  ).trim().toLowerCase();
  const mime = String(attachment?.mime_type || attachment?.mimeType || '').trim().toLowerCase();

  if (['video', 'media_video'].includes(rawType) || mime.startsWith('video/') || VIDEO_MEDIA_RE.test(mediaUrl)) return 'video';
  if (['voice', 'audio', 'audio_message', 'voice_message'].includes(rawType) || mime.startsWith('audio/') || AUDIO_MEDIA_RE.test(mediaUrl)) return 'audio';
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
  // ✅ v59.13.37 FIX #3: تحميل صفحات الرسائل الأقدم عبر store.prependConversationPage
  const prependConversationPage = useChatStore((state) => state.prependConversationPage);
  const applyIncomingMessage = useChatStore((state) => state.applyIncomingMessage);
  const reconcileOptimisticMessage = useChatStore((state) => state.reconcileOptimisticMessage);
  const applyMessagePatch = useChatStore((state) => state.applyMessagePatch);
  const setPresenceStore = useChatStore((state) => state.setPresence);
  const markThreadRead = useChatStore((state) => state.markThreadRead);
  const queueAction = useAppStore((state) => state.queueAction);

  // ✅ v59.13.37 FIX #3: حالة وعلامات تحميل صفحات الرسائل الأقدم
  const hasMoreOlder = Boolean(conversationState?.hasMore);
  const oldestMessageId = conversationState?.oldestMessageId || '';
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);

  const [threadsLoading, setThreadsLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [replyTo, setReplyTo] = useState(null);

  // ✅ حالات Long-Press Toolbar + Reaction Picker + Media Preview
  const [chatSelectedMessage, setChatSelectedMessage] = useState(null);
  const [chatReactionAnchor, setChatReactionAnchor] = useState(null);
  const [chatPreviewFiles, setChatPreviewFiles] = useState([]);
  const [callMode, setCallMode] = useState(null);
  const [flyingHearts, setFlyingHearts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  // ✅ v88.22 — قائمة النقاط الثلاث (Popup) + فقاعة البحث + فقاعة حذف الدردشة
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showSearchBubble, setShowSearchBubble] = useState(false);
  const [showDeleteBubble, setShowDeleteBubble] = useState(false);
  const [deleteSelectedIds, setDeleteSelectedIds] = useState(() => new Set());
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [showChatSettingsPanel, setShowChatSettingsPanel] = useState(false);
  const [settingsPanelData, setSettingsPanelData] = useState({ loading: true, mediaItems: [], sharedLinks: [], fileItems: [], blockStatus: { can_chat: true, blocked_by_me: false, blocked_me: false } });
  const [mediaViewerState, setMediaViewerState] = useState({ open: false, index: 0 });
  const initialChatPrefs = useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = useState(initialChatPrefs.muted.has(peer));
  const [isPinnedConversation, setIsPinnedConversation] = useState(initialChatPrefs.pinned.has(peer));
  const [reactionsByMessage, setReactionsByMessage] = useState(() => loadPeerReactions(peer));
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  // ✅ v59.13.17 FIX #1: هدف الإبلاغ عن رسالة (يفتح ReportModal بـ targetType="message")
  const [reportTarget, setReportTarget] = useState(null);
  // ✅ v59.13.17 FIX #2: تحرير الرسالة عبر مودال داخلي بدلاً من window.prompt المتزامن
  const [editingMessage, setEditingMessage] = useState(null); // { id, content }
  const [editingDraft, setEditingDraft] = useState('');
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
    setShowChatSettingsPanel(true);
    // تحميل بيانات الإعدادات
    setSettingsPanelData((prev) => ({ ...prev, loading: true }));
    Promise.allSettled([
      getMessages(peer, 120),
      getBlockStatus(peer),
    ]).then(([msgsRes, blockRes]) => {
      const msgs = Array.isArray(msgsRes?.value?.data) ? msgsRes.value.data : [];
      const block = blockRes?.value?.data || { can_chat: true, blocked_by_me: false, blocked_me: false };
      const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)(?:$|\?)/i;
      const VIDEO_RE = /\.(mp4|webm|mov|m4v|mkv)(?:$|\?)/i;
      const URL_RE = /(https?:\/\/[^\s]+)/g;
      const mediaItems = [];
      const sharedLinks = [];
      const fileItems = [];
      msgs.forEach((m) => {
        const url = m?.media_url || m?.media_urls?.[0] || m?.attachments?.[0]?.url || '';
        const t = String(m?.type || '').toLowerCase();
        if (url && (IMAGE_RE.test(url) || t === 'image' || t === 'photo')) {
          mediaItems.push({ id: m.id || m.client_id, url, type: 'image', caption: m.content || '' });
        } else if (url && (VIDEO_RE.test(url) || t === 'video')) {
          mediaItems.push({ id: m.id || m.client_id, url, type: 'video', caption: m.content || '' });
        } else if (t === 'voice' || t === 'audio' || (url && /\.(mp3|wav|ogg|m4a|opus)(?:$|\?)/i.test(url))) {
          fileItems.push({ ...m, _resolvedUrl: url });
        } else if (url) {
          fileItems.push({ ...m, _resolvedUrl: url });
        }
        const text = m?.content || m?.message || '';
        const links = text.match(URL_RE) || [];
        links.forEach((link) => sharedLinks.push({ id: `${m.id}-${link}`, url: link, sender: m.sender || '' }));
      });
      setSettingsPanelData({ loading: false, mediaItems: mediaItems.slice(0, 30), sharedLinks: sharedLinks.slice(0, 20), fileItems: fileItems.slice(0, 20), blockStatus: block });
    }).catch(() => {
      setSettingsPanelData((prev) => ({ ...prev, loading: false }));
    });
  }, [peer]);

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

  // ✅ FIX v59.13.4: حماية من race condition عند التنقل السريع بين المحادثات.
  // السلوك السابق: فتح محادثة A ثم بسرعة فتح محادثة B، فتصل استجابة A متأخرة
  // وتكتب رسائل A / presence A / block A فوق بيانات B.
  // الحل: رقم تسلسلي + التقاط peer وقت الإطلاق، وفحصهما بعد await.
  const peerLoadSeqRef = useRef(0);

  const loadMessages = useCallback(async (forPeer, mySeq) => {
    if (!forPeer) return;
    setMsgLoading(true);
    try {
      const { data } = await getMessages(forPeer, 60);
      // تجاهل الاستجابة إذا تغيّر peer أو أُطلق تحميل أحدث
      if (mySeq !== peerLoadSeqRef.current) return;
      replaceConversationMessages(forPeer, data?.items || [], {
        hasMore: Boolean(data?.paging?.has_more),
        oldestMessageId: data?.paging?.next_before_id,
        limit: 250,
      });
      await markMessagesSeen(forPeer);
      if (mySeq !== peerLoadSeqRef.current) return;
      markThreadRead(forPeer);
    } catch {
      if (mySeq !== peerLoadSeqRef.current) return;
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحميل الرسائل' });
    } finally {
      if (mySeq === peerLoadSeqRef.current) setMsgLoading(false);
    }
  }, [markThreadRead, pushToast, replaceConversationMessages]);

  useEffect(() => {
    if (!peer) return undefined;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
    setShowDetailsDrawer(false);
    setActivePeer(peer);

    const mySeq = ++peerLoadSeqRef.current;
    const localPeer = peer;
    loadMessages(localPeer, mySeq);

    getPresence(localPeer)
      .then(({ data }) => {
        if (mySeq !== peerLoadSeqRef.current) return;
        setPresenceStore(localPeer, data || {});
      })
      .catch(() => {});

    getBlockStatus(localPeer)
      .then(({ data }) => {
        if (mySeq !== peerLoadSeqRef.current) return;
        setBlockStatus(data || {});
      })
      .catch(() => {});

    return () => {
      // أي استجابة أبطأ ستُرفض لأن mySeq لن يساوي peerLoadSeqRef.current
      setActivePeer(null);
    };
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
      waveform_seed: payload?.waveform_seed || null,
      audio_duration_seconds: Number(payload?.audio_duration_seconds || 0) || null,
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
      attachment_name: payload?.attachments?.[0]?.file_name || payload?.attachments?.[0]?.fileName || payload?.attachments?.[0]?.originalName || '',
      type: requestPayload.type,
      waveform_seed: payload?.waveform_seed || null,
      audio_duration_seconds: Number(payload?.audio_duration_seconds || 0) || undefined,
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

  // ✅ v59.13.37 FIX #2: مزامنة التفاعلات مع الباك إند (reactToMessage / unreactToMessage)
  // السلوك السابق: التفاعل كان يُحفظ في localStorage فقط، لذا الطرف الآخر لا يرى التفاعل.
  // الحل: تحديث متفائل (optimistic) محلي ثم استدعاء API؛ في حال الفشل نعكس التغيير ونعرض Toast.
  const handleReact = useCallback((message, emoji) => {
    const messageId = String(message?.id || message?.client_id || '');
    if (!messageId || !emoji) return;

    let previousState = null; // لقطة قبل التحديث لاستخدامها في الـ rollback
    let action = 'add'; // 'add' | 'remove' | 'switch'
    let previousEmoji = null;

    setReactionsByMessage((prev) => {
      previousState = prev;
      const current = prev[messageId] || { counts: {}, myReaction: null };
      const nextCounts = { ...(current.counts || {}) };

      if (current.myReaction === emoji) {
        // إزالة التفاعل
        action = 'remove';
        nextCounts[emoji] = Math.max(0, Number(nextCounts[emoji] || 0) - 1);
        if (!nextCounts[emoji]) delete nextCounts[emoji];
        return { ...prev, [messageId]: { counts: nextCounts, myReaction: null } };
      }

      if (current.myReaction) {
        // تبديل من emoji لآخر
        action = 'switch';
        previousEmoji = current.myReaction;
        nextCounts[current.myReaction] = Math.max(0, Number(nextCounts[current.myReaction] || 0) - 1);
        if (!nextCounts[current.myReaction]) delete nextCounts[current.myReaction];
      } else {
        action = 'add';
      }
      nextCounts[emoji] = Number(nextCounts[emoji] || 0) + 1;
      return { ...prev, [messageId]: { counts: nextCounts, myReaction: emoji } };
    });

    // طلبات الـ API — بدون انتظار للـ UI (optimistic)
    (async () => {
      try {
        if (action === 'remove') {
          await unreactToMessage(messageId, emoji);
        } else if (action === 'switch') {
          // أزل القديم ثم أضف الجديد
          try { await unreactToMessage(messageId, previousEmoji); } catch (_) { /* تجاهل */ }
          await reactToMessage(messageId, emoji);
        } else {
          await reactToMessage(messageId, emoji);
        }
      } catch (err) {
        // rollback
        if (previousState) setReactionsByMessage(previousState);
        pushToast({ type: 'error', title: 'تعذر إرسال التفاعل', description: 'حدث خطأ أثناء مزامنة التفاعل مع الخادم' });
      }
    })();
  }, [pushToast]);

  // ✅ v59.13.37 FIX #3: تحميل صفحة من الرسائل الأقدم وحقنها في المتجر
  const loadOlderMessages = useCallback(async () => {
    if (!peer) return;
    if (loadingOlderRef.current) return;
    if (!hasMoreOlder) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);

    // الاحتفاظ بموقع التمرير قبل الحقن
    const area = messagesAreaRef.current;
    const previousScrollHeight = area ? area.scrollHeight : 0;
    const previousScrollTop = area ? area.scrollTop : 0;

    try {
      const { data } = await getMessages(peer, 60, oldestMessageId || undefined);
      const olderItems = Array.isArray(data?.items) ? data.items : [];
      prependConversationPage(peer, olderItems, {
        hasMore: Boolean(data?.paging?.has_more),
        oldestMessageId: data?.paging?.next_before_id || '',
        limit: 250,
      });

      // بعد الـ render نعيد ضبط التمرير ليبقى المستخدم عند نفس الرسالة
      window.requestAnimationFrame(() => {
        const node = messagesAreaRef.current;
        if (!node) return;
        const delta = node.scrollHeight - previousScrollHeight;
        node.scrollTop = previousScrollTop + delta;
        // عطّل الالتصاق التلقائي بالأسفل لأنّ المستخدم يستعرض السجل القديم
        shouldAutoScrollRef.current = false;
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذّر تحميل الرسائل الأقدم' });
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [peer, hasMoreOlder, oldestMessageId, prependConversationPage, pushToast]);

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

  // ✅ v59.13.36 FIX (typing indicator): حالة محلية لل“يكتب الآن”
  // السبب: في بعض الحالات لم تكن تحديثات useChatStore تصل للبيانات بسبب فروق
  // في حالة الأحرف بين peer المحفوظ في المتجر و payload.sender الوارد من السوكت.
  // الحل: نستمع مباشرة لـ typing_update ونقارن بدون حساسية للحالة + trim.
  const [localTyping, setLocalTyping] = useState(false);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    // عند تبديل المحادثة أعد ضبط الحالة
    setLocalTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [peer]);

  useEffect(() => {
    if (!peer) return undefined;
    const normalizedPeer = String(peer).trim().toLowerCase();

    const handleTypingUpdate = (payload) => {
      const sender = String(payload?.sender || '').trim().toLowerCase();
      // المرسل لابد أن يكون الطرف الآخر في المحادثة المفتوحة
      if (!sender || sender !== normalizedPeer) return;
      const typing = Boolean(payload?.is_typing);

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }

      setLocalTyping(typing);

      // ✅ v86.9: تعطيل تلقائي بعد 3ث في حال لم يصل is_typing:false — مطابق لواتساب.
      // (المُرسِل يُرسل stop تلقائياً بعد 1.8ث، لذا يكفي 3ث كأمان).
      if (typing) {
        typingTimerRef.current = setTimeout(() => {
          setLocalTyping(false);
          typingTimerRef.current = null;
        }, 3000);
      }
    };

    // تأكد أن الاتصال قائم
    try { socketManager.connect(); } catch (_) { /* ignore */ }
    const unsubscribe = socketManager.on('typing_update', handleTypingUpdate);

    return () => {
      try { unsubscribe?.(); } catch (_) { /* ignore */ }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [peer]);

  // دمج مصدرين: المتجر (store) + المستمع المحلي (fallback)
  const isTyping = Boolean(peerPresence.is_typing) || localTyping;
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
      {/* ✅ Long-Press Toolbar (فوق الهيدر) */}
      {chatSelectedMessage ? (
        <MessageActionsToolbar
          selectedMessage={chatSelectedMessage}
          onClose={() => { setChatSelectedMessage(null); setChatReactionAnchor(null); try { document.body.classList.remove('yam-long-press-active'); } catch {} }}
          onForward={(m) => pushToast({ type: 'info', title: 'إعادة توجيه', description: 'اختر جهة الوجهة لإعادة توجيه الرسالة' })}
          /* ✅ v59.13.37 FIX #1: استبدال setMessages غير المعرَّف باستدعاء handleDelete (API + store) */
          onDelete={(m) => { const id = m?.id || m?.client_id; if (id) handleDelete(id, false); setChatSelectedMessage(null); setChatReactionAnchor(null); }}
          /* ✅ v59.13.37 FIX #1: التنجيم عبر applyMessagePatch بدل setMessages غير المعرَّف */
          onStar={(m) => { const id = m?.id || m?.client_id; if (!id) return; applyMessagePatch(peer, [id], { starred: !m?.starred }); pushToast({ type: 'success', title: m?.starred ? 'تم إلغاء تنجيم الرسالة' : 'تم تنجيم الرسالة' }); }}
          onReply={(m) => setReplyTo(m)}
          onCopy={(m) => { try { navigator.clipboard.writeText(m?.text || m?.content || ''); } catch {} }}
          onPin={(m) => pushToast({ type: 'success', title: 'تم تثبيت الرسالة', description: 'ستظهر في أعلى المحادثة' })}
          onInfo={(m) => pushToast({ type: 'info', title: 'تفاصيل الرسالة', description: `المرسل: ${m?.sender || 'غير معروف'} · الوقت: ${m?.time || m?.created_at || 'غير متوفر'}` })}
          /* ✅ v59.13.37 FIX #4: فتح ReportModal الموحّد بدلاً من Toast كاذب (مطابق لإصلاح v59.13.17) */
          onReport={(m) => {
            setReportTarget({
              id: m?.id || m?.client_id,
              label: `رسالة من @${m?.sender || m?.author || peer}`,
            });
            setChatSelectedMessage(null);
            setChatReactionAnchor(null);
          }}
        />
      ) : null}

      {/* ✅ Reaction Picker */}
      {chatSelectedMessage && chatReactionAnchor ? (
        <MessageReactionPicker
          anchorRect={chatReactionAnchor}
          /* ✅ v59.13.37 FIX #1+#2: استدعاء handleReact (مزامنة مع الـ API + تخزين موحّد) بدل setMessages غير المعرَّف */
          onPick={(emoji) => { handleReact(chatSelectedMessage, emoji); setChatReactionAnchor(null); }}
          onClose={() => setChatReactionAnchor(null)}
        />
      ) : null}

      {/* ✅ Media Preview Modal (قبل الإرسال في الدردشة الخاصة — تتلقى ملفات عبر event) */}
      {chatPreviewFiles.length > 0 ? (
        <MediaPreviewModal
          files={chatPreviewFiles}
          onCancel={() => setChatPreviewFiles([])}
          onSend={(files, caption) => {
            window.dispatchEvent(new CustomEvent('yamshat:chat-send-files', { detail: { files, caption } }));
            setChatPreviewFiles([]);
          }}
          onRemove={(idx) => setChatPreviewFiles((p) => p.filter((_, i) => i !== idx))}
        />
      ) : null}

      <section className="yam-conversation-screen" dir="rtl" data-yam-chat-root="true" style={{ fontFamily: "'Noto Sans Arabic', 'Cairo', 'Tajawal', 'Tahoma', system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <style>{`
          .yam-conversation-screen {
            /* ⭐ v59.13.31 — لا transform/filter يكسر إطار التمرير لأبنائه (.yam-messages-area) */
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
            /* ✅ الجذر لا يتمرّر بنفسه لكن يسمح لأبنائه بالتمرير */
            transform: none;
            -webkit-transform: none;
            filter: none;
            perspective: none;
            touch-action: pan-y;
            pointer-events: auto;
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
            padding: 14px 18px;
            flex-shrink: 0;
            position: sticky;
            top: 0;
            z-index: 60;
            background: linear-gradient(180deg, rgba(7,10,24,0.97), rgba(4,7,18,0.95));
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            min-height: 64px;
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
            /* ✅ v86.9: انتقال أنيق بين "متصل" ↔ "جاري الكتابة" */
            transition: color 200ms ease, opacity 200ms ease;
            display: inline-flex; align-items: center; gap: 6px;
          }
          .yam-chat-stage-peer-copy span.online { color: #4ade80; }
          .yam-chat-stage-peer-copy span.typing { color: #a78bfa; font-weight: 700; }
          .yam-chat-stage-peer-copy span.typing::before {
            content: '';
            width: 6px; height: 6px; border-radius: 50%;
            background: #a78bfa;
            box-shadow: 10px 0 0 #a78bfa, 20px 0 0 #a78bfa;
            animation: yam-typing-dots 1.1s infinite ease-in-out;
            margin-inline-end: 22px;
          }
          @keyframes yam-typing-dots {
            0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
            30%           { opacity: 1;    transform: translateY(-2px); }
          }
          .yam-chat-stage-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: nowrap;
          }
          .yam-chat-stage-actions .yam-stage-icon {
            width: 40px;
            height: 40px;
            min-width: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.6);
            color: #e5e7eb;
            font-size: 18px;
            cursor: pointer;
            transition: transform .15s ease, background .15s ease;
          }
          .yam-chat-stage-actions .yam-stage-icon:hover {
            background: rgba(124,58,237,0.18);
            transform: translateY(-1px);
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

          /* ✅ v88.22 — قائمة (Popup) خيارات الدردشة من النقاط الثلاث */
          .yam-header-menu-backdrop {
            position: fixed;
            inset: 0;
            background: transparent;
            z-index: 60;
          }
          .yam-header-menu-popup {
            position: absolute;
            top: calc(100% + 8px);
            inset-inline-start: 0;
            z-index: 70;
            min-width: 220px;
            background: rgba(15,18,32,0.98);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 14px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.55);
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            backdrop-filter: blur(14px);
            animation: yamMenuFadeIn 0.16s ease-out both;
          }
          @keyframes yamMenuFadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .yam-header-menu-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 10px;
            border: none;
            background: transparent;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            text-align: right;
            transition: background 0.15s ease;
          }
          .yam-header-menu-item:hover {
            background: rgba(124,58,237,0.16);
          }
          .yam-header-menu-item.danger {
            color: #f87171;
          }
          .yam-header-menu-item.danger:hover {
            background: rgba(239,68,68,0.14);
          }
          .yam-header-menu-icon {
            width: 22px;
            text-align: center;
            font-size: 16px;
          }
          .yam-header-menu-sep {
            height: 1px;
            background: rgba(255,255,255,0.08);
            margin: 4px 6px;
          }

          /* ✅ v88.22 — فقاعات (Modal) البحث والحذف */
          .yam-chat-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9998;
            background: rgba(0,0,0,0.62);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            backdrop-filter: blur(6px);
            animation: yamOverlayFade 0.18s ease-out both;
          }
          @keyframes yamOverlayFade {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .yam-chat-modal {
            width: min(560px, 100%);
            max-height: min(80vh, 720px);
            background: radial-gradient(circle at top right, rgba(124,58,237,0.16), transparent 30%), #0b0f1e;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px;
            box-shadow: 0 24px 60px rgba(0,0,0,0.65);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            color: #f5f7ff;
            font-family: 'Noto Sans Arabic','Cairo','Tahoma',sans-serif;
            animation: yamModalPop 0.22s cubic-bezier(0.22,1,0.36,1) both;
          }
          @keyframes yamModalPop {
            from { opacity: 0; transform: scale(0.94); }
            to   { opacity: 1; transform: scale(1); }
          }
          .yam-chat-modal-head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 18px;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            background: rgba(255,255,255,0.03);
          }
          .yam-chat-modal-head strong { font-size: 15.5px; font-weight: 900; }
          .yam-chat-modal-close {
            width: 34px; height: 34px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            color: #fff;
            font-size: 18px; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .yam-chat-modal-close:hover { background: rgba(239,68,68,0.18); border-color: rgba(248,113,113,0.3); }
          .yam-chat-modal-body {
            flex: 1;
            padding: 14px 18px 18px;
            display: flex; flex-direction: column; gap: 12px;
            overflow-y: auto;
          }

          /* — فقاعة البحث — */
          .yam-chat-search-inputwrap {
            display: flex; align-items: center; gap: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 10px 14px;
          }
          .yam-chat-search-inputwrap span { opacity: 0.55; font-size: 16px; }
          .yam-chat-search-inputwrap input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: #fff;
            font-size: 14.5px;
            font-family: inherit;
            text-align: right;
          }
          .yam-chat-search-clear {
            width: 26px; height: 26px;
            border-radius: 8px;
            border: none; background: rgba(255,255,255,0.08);
            color: #fff; cursor: pointer;
            font-size: 14px;
          }
          .yam-chat-search-summary {
            font-size: 12.5px; opacity: 0.65;
            padding: 0 4px;
          }
          .yam-chat-search-results {
            display: flex; flex-direction: column; gap: 6px;
            max-height: 46vh; overflow-y: auto;
            padding-inline-end: 4px;
          }
          .yam-chat-search-empty {
            text-align: center; padding: 22px 8px;
            font-size: 13px; opacity: 0.6;
          }
          .yam-chat-search-item {
            display: flex; flex-direction: column; gap: 3px;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.03);
            color: #fff;
            font-family: inherit;
            text-align: right;
            cursor: pointer;
            transition: background 0.15s ease;
          }
          .yam-chat-search-item:hover { background: rgba(124,58,237,0.14); }
          .yam-chat-search-item-sender { font-size: 11.5px; opacity: 0.6; font-weight: 700; }
          .yam-chat-search-item-text { font-size: 13.5px; line-height: 1.5; }

          /* — فقاعة الحذف — */
          .yam-chat-delete-hint {
            font-size: 13px; opacity: 0.75; line-height: 1.6;
            padding: 8px 12px;
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(248,113,113,0.18);
            border-radius: 12px;
          }
          .yam-chat-delete-toolbar {
            display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
            padding: 4px 2px;
          }
          .yam-chat-delete-checkbox {
            display: inline-flex; align-items: center; gap: 8px;
            font-size: 13px; font-weight: 700; cursor: pointer;
            user-select: none;
          }
          .yam-chat-delete-checkbox input { width: 16px; height: 16px; accent-color: #a78bfa; cursor: pointer; }
          .yam-chat-delete-list {
            display: flex; flex-direction: column; gap: 4px;
            max-height: 40vh; overflow-y: auto;
            padding: 4px;
            background: rgba(0,0,0,0.22);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 12px;
          }
          .yam-chat-delete-empty {
            text-align: center; padding: 22px 8px;
            font-size: 13px; opacity: 0.6;
          }
          .yam-chat-delete-item {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 9px 10px;
            border-radius: 10px;
            border: 1px solid transparent;
            cursor: pointer;
            transition: background 0.14s ease, border-color 0.14s ease;
          }
          .yam-chat-delete-item:hover { background: rgba(255,255,255,0.04); }
          .yam-chat-delete-item.checked {
            background: rgba(239,68,68,0.10);
            border-color: rgba(248,113,113,0.24);
          }
          .yam-chat-delete-item input { margin-top: 3px; width: 16px; height: 16px; accent-color: #f87171; cursor: pointer; flex-shrink: 0; }
          .yam-chat-delete-item-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
          .yam-chat-delete-item-copy strong { font-size: 12px; opacity: 0.75; font-weight: 800; }
          .yam-chat-delete-item-copy span {
            font-size: 13px; line-height: 1.5;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .yam-chat-delete-actions {
            display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;
            padding-top: 6px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }
          .yam-chat-delete-btn {
            min-height: 40px;
            padding: 0 16px;
            border-radius: 12px;
            font-size: 13.5px; font-weight: 800;
            cursor: pointer;
            font-family: inherit;
            border: 1px solid transparent;
            transition: transform 0.12s ease, background 0.14s ease;
          }
          .yam-chat-delete-btn:disabled { opacity: 0.45; cursor: not-allowed; }
          .yam-chat-delete-btn.ghost {
            background: rgba(255,255,255,0.05);
            border-color: rgba(255,255,255,0.1);
            color: #fff;
          }
          .yam-chat-delete-btn.primary {
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            color: #fff;
          }
          .yam-chat-delete-btn.primary:not(:disabled):hover { transform: translateY(-1px); }
          .yam-chat-delete-btn.danger {
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            color: #fff;
          }
          .yam-chat-delete-btn.danger:not(:disabled):hover { transform: translateY(-1px); }

          /* — تأثير تمييز الرسالة عند القفز إليها من البحث — */
          .yam-flash-highlight {
            animation: yamFlashHL 1.6s ease-out both;
          }
          @keyframes yamFlashHL {
            0%   { box-shadow: 0 0 0 0 rgba(124,58,237,0.0); background-color: rgba(124,58,237,0.0); }
            30%  { box-shadow: 0 0 0 6px rgba(124,58,237,0.35); background-color: rgba(124,58,237,0.18); }
            100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.0); background-color: rgba(124,58,237,0.0); }
          }

          @media (max-width: 640px) {
            .yam-chat-modal { max-height: 88vh; border-radius: 16px; }
            .yam-chat-modal-body { padding: 12px 14px 16px; }
            .yam-chat-search-results { max-height: 52vh; }
            .yam-chat-delete-list { max-height: 44vh; }
            .yam-header-menu-popup { min-width: 200px; }
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
            /* ⭐ v59.13.31 — بصمة .yam-groups-page على منطقة الرسائل:
               السحب يستجيب فوراً من منتصف الشاشة على ويب الجوال. */
            min-height: 0;
            flex: 1;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            overscroll-behavior-y: contain;
            overscroll-behavior-x: none;
            -webkit-overflow-scrolling: touch !important;
            /* ✅ touch-action: pan-y صريح — يجبر المتصفح على التحرك فوراً */
            touch-action: pan-y !important;
            -ms-touch-action: pan-y !important;
            scroll-behavior: smooth;
            scroll-padding-bottom: 140px;
            scrollbar-gutter: stable both-edges;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.5) rgba(255,255,255,0.04);
            padding: 18px 18px calc(96px + var(--yam-keyboard-offset, 0px));
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.06), transparent 22%),
              radial-gradient(circle at bottom left, rgba(59,130,246,0.05), transparent 22%),
              linear-gradient(180deg, rgba(7,10,24,0.95), rgba(4,7,18,0.98));
            /* ⚠️ أزلنا contain: layout style paint لأنه يكسر momentum scroll على iOS Safari */
            direction: rtl;
            /* ✅ لا transform/filter يكسر momentum */
            transform: none;
            -webkit-transform: none;
            filter: none;
            perspective: none;
            pointer-events: auto;
            overflow-anchor: none;
            will-change: scroll-position;
          }
          /* ✅ فقاعات/صفوف داخل منطقة الرسائل: لا تبتلع pan-y */
          .yam-messages-area .yam-message-row,
          .yam-messages-area .yam-message-stack,
          .yam-messages-area .yam-bubble,
          .yam-messages-area .yam-day-divider {
            touch-action: pan-y;
            pointer-events: auto;
          }
          /* ✅ الصور/الفيديو داخل الفقاعات: pan-y عمودي فقط + منع السحب الأصلي */
          .yam-messages-area img {
            touch-action: pan-y;
            -webkit-user-drag: none;
            user-drag: none;
          }
          .yam-messages-area video {
            touch-action: manipulation;
          }
          /* ✅ الأزرار داخل الفقاعات: manipulation (تسمح بـ pan-y عند البدء) */
          .yam-messages-area button,
          .yam-messages-area a,
          .yam-messages-area [role="button"] {
            touch-action: manipulation;
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
          .yam-bubble.is-media-only {
            min-width: 0;
            padding: 0;
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            overflow: visible;
          }
          .yam-bubble.is-media-only:hover {
            transform: none;
            box-shadow: none !important;
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
          .yam-bubble.is-media-only .yam-media-button {
            width: auto;
            max-width: min(280px, 68vw);
            margin: 0;
            border-radius: 14px;
            background: transparent;
            box-shadow: none;
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
          .yam-bubble.is-media-only .yam-bubble-media-overlay {
            display: none;
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
          .yam-bubble.is-media-only .bubble-meta {
            margin-top: 6px;
            padding-inline: 4px;
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
            padding: 12px 14px;
            position: sticky;
            bottom: 0;
            inset-inline: 0;
            z-index: 70;
            background: linear-gradient(180deg, rgba(4,7,18,0.92), rgba(4,7,18,1));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 26px 26px 0 0;
            border-top: 1px solid rgba(167,139,250,0.14);
            box-shadow: 0 -14px 34px rgba(0, 0, 0, 0.42), 0 -2px 0 rgba(167, 139, 250, 0.10);
            padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
            transform: translateZ(0);
            will-change: transform;
            min-height: 72px;
            display: flex;
            align-items: center;
          }
          .yam-chat-input-wrap > * {
            width: 100%;
            min-width: 0;
          }
          .yam-chat-input-wrap textarea,
          .yam-chat-input-wrap input[type="text"] {
            min-height: 44px;
            font-size: 16px;
            line-height: 1.5;
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
          /* 🔧 v59.13.32 FIX #1: ألغي دور yam-call-overlay لأن CallExperience أصبح
             يعرض نفسه عبر fixed overlay خاص به. أبقينا الصنف للتوافق فقط. */
          .yam-call-overlay { display: contents; }
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
          /* 🔧 v59.13.32 FIX #3: توحيد أزرار الإجراءات السريعة بستايل النظام */
          .yam-quick-actions {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }
          .yam-quick-card {
            position: relative;
            min-height: 92px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.08);
            background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
            color: white;
            display: grid;
            place-items: center;
            gap: 6px;
            cursor: pointer;
            transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
            overflow: hidden;
          }
          .yam-quick-card::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: 0;
            background: radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 60%);
            transition: opacity 0.2s ease;
            pointer-events: none;
          }
          .yam-quick-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255,255,255,0.18);
            background: linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04));
            box-shadow: 0 12px 28px rgba(0,0,0,0.32);
          }
          .yam-quick-card:hover::before { opacity: 1; }
          .yam-quick-card:active { transform: translateY(0); }
          .yam-quick-card:focus-visible {
            outline: 2px solid rgba(167,139,250,0.7);
            outline-offset: 2px;
          }
          .yam-quick-card > span:first-child {
            font-size: 22px;
            line-height: 1;
            display: inline-grid;
            place-items: center;
            width: 44px;
            height: 44px;
            border-radius: 14px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1);
            transition: background 0.2s ease, transform 0.2s ease;
          }
          .yam-quick-card:hover > span:first-child { transform: scale(1.06); }
          .yam-quick-card.call-action > span:first-child {
            background: linear-gradient(135deg, rgba(34,197,94,0.35), rgba(16,185,129,0.18));
            border-color: rgba(34,197,94,0.45);
            color: #d1fae5;
          }
          .yam-quick-card.video-action > span:first-child {
            background: linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.18));
            border-color: rgba(59,130,246,0.45);
            color: #dbeafe;
          }
          .yam-quick-card.search-action > span:first-child {
            background: linear-gradient(135deg, rgba(168,85,247,0.32), rgba(217,70,239,0.18));
            border-color: rgba(168,85,247,0.45);
            color: #f3e8ff;
          }
          .yam-quick-card.more-action > span:first-child {
            background: linear-gradient(135deg, rgba(234,179,8,0.32), rgba(249,115,22,0.18));
            border-color: rgba(234,179,8,0.45);
            color: #fef3c7;
          }
          .yam-quick-card small {
            color: #e2e8f0;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.02em;
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
            /* hide duplicate mobile topbar — using yam-chat-stage-header as the unified fixed header */
            .yam-mobile-topbar {
              display: none !important;
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
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
              border-radius: 12px;
              border: 1px solid rgba(255,255,255,0.06);
              background: rgba(15,23,42,0.55);
              color: #a78bfa;
              font-size: 18px;
              display: grid;
              place-items: center;
              cursor: pointer;
              transition: transform .15s ease, background .15s ease;
            }
            .yam-mobile-action-btn:hover {
              background: rgba(124,58,237,0.12);
            }
            /* keep header visible & fixed on mobile (تثبيت حقيقي لا يتحرك مع سحب الشاشة) — v31 */
            .yam-stage-top-search {
              display: none !important;
            }
            .yam-chat-stage-header {
              display: flex !important;
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              inset-inline: 0 !important;
              z-index: 1000 !important;
              padding: 10px 14px;
              padding-top: calc(10px + env(safe-area-inset-top, 0px));
              min-height: 56px;
              border-radius: 0;
              border-left: none;
              border-right: none;
              border-top: none;
              border-bottom: 1px solid rgba(255,255,255,0.08);
              background: linear-gradient(180deg, rgba(7,10,24,0.98), rgba(4,7,18,0.96));
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              box-shadow: 0 6px 18px rgba(0,0,0,0.34);
              /* ❌ أزلنا translateZ و will-change لأنهما يكسران position:fixed على Mobile WebView
                 ويسببان تحرك الهيدر مع سحب الصفحة (containing block issue). */
              transform: none !important;
              will-change: auto !important;
              backface-visibility: hidden;
              -webkit-transform: none !important;
            }
            .yam-chat-stage-header .yam-chat-stage-peer-copy strong {
              font-size: 17px;
            }
            .yam-chat-stage-header .yam-chat-stage-peer-copy span {
              font-size: 12px;
            }
            .yam-chat-stage-actions .yam-stage-icon {
              width: 38px;
              height: 38px;
              min-width: 38px;
              font-size: 16px;
            }
            .yam-chat-stage {
              padding: 0;
              gap: 0;
              grid-template-rows: auto minmax(0, 1fr) auto;
              height: 100dvh;
              min-height: 0;
              /* مساحة علوية تعوّض الهيدر المثبّت (fixed) حتى لا تختفي أول رسالة تحته */
              padding-top: calc(56px + env(safe-area-inset-top, 0px));
              /* ✅ منع إنشاء containing block جديد للأبناء الموضوعين position:fixed
                 (transform/will-change/filter على .yam-chat-stage كانت تكسر التثبيت) */
              transform: none !important;
              will-change: auto !important;
              filter: none !important;
              perspective: none !important;
              contain: none !important;
            }
            /* ضمان أن body/html لا يحتويان transform يكسر position:fixed */
            html, body {
              transform: none !important;
              -webkit-transform: none !important;
              overflow-anchor: none;
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
              /* مساحة علوية وسفلية كبيرة تضمن ألاّ تختفي الرسائل خلف الهيدر أو صندوق الإدخال */
              padding: 18px 12px calc(180px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
              scroll-padding-top: 80px;
              scroll-padding-bottom: 200px;
              background:
                radial-gradient(circle at top right, rgba(124,58,237,0.05), transparent 30%),
                radial-gradient(circle at bottom left, rgba(59,130,246,0.04), transparent 30%),
                #040714;
            }
            .yam-chat-input-wrap {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              inset-inline: 0 !important;
              z-index: 1000 !important;
              border-radius: 18px 18px 0 0;
              border-left: none;
              border-right: none;
              border-bottom: none;
              border-top: 1px solid rgba(167,139,250,0.14);
              padding: 8px 10px;
              padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
              background: linear-gradient(180deg, rgba(7,10,24,0.96), rgba(4,7,18,1));
              backdrop-filter: blur(22px);
              -webkit-backdrop-filter: blur(22px);
              box-shadow: 0 -16px 36px rgba(0,0,0,0.5), 0 -2px 0 rgba(167, 139, 250, 0.12);
              /* ❌ أزلنا translateZ/will-change حتى لا يتحرك الفوتر مع سحب الصفحة
                 على بعض متصفحات الموبايل (Chrome Android / iOS Safari) */
              transform: none !important;
              -webkit-transform: none !important;
              will-change: auto !important;
              backface-visibility: hidden;
              min-height: 60px;
              display: flex;
              align-items: center;
            }
            .yam-chat-input-wrap textarea,
            .yam-chat-input-wrap input[type="text"] {
              min-height: 40px;
              max-height: 110px;
              font-size: 16px; /* prevent iOS zoom */
            }
            .yam-chat-input-wrap button {
              min-width: 38px;
              min-height: 38px;
              border-radius: 12px;
            }
            .yam-messages-area {
              /* مساحة سفلية أكبر حتى لا تختفي آخر رسالة خلف صندوق الإدخال المثبّت */
              padding-bottom: calc(160px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px)) !important;
              scroll-padding-bottom: 180px !important;
            }
            .yam-message-stack {
              max-width: 82%;
            }
            .yam-bubble {
              padding: 10px 14px 8px;
              border-radius: 20px;
            }
            .yam-bubble.is-media-only {
              padding: 0;
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
                  <span>{contact.username === peer ? (isTyping ? 'جاري الكتابة...' : (peerDetails.preview || contact.preview)) : contact.preview}</span>
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
              <span>نشط الآن</span>
            </div>
            <button type="button" className="yam-icon-action subtle" onClick={() => navigate('/settings')}>⋮</button>
          </div>
        </aside>

        <main className="yam-chat-stage" dir="rtl" data-yam-chat-root="true" style={{ fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}>
          {/* Mobile topbar disabled — using unified yam-chat-stage-header (fixed on top) */}

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
            {/* v60.2 — زر الرجوع على الجوال (يخفى على سطح المكتب عبر CSS) */}
            <button
              type="button"
              className="yam-stage-back-btn"
              onClick={() => navigate('/chat')}
              aria-label="رجوع"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="yam-chat-stage-peer">
              <button type="button" className="yam-chat-stage-peer-button" onClick={openChatSettings} aria-label="إعدادات المحادثة">
                <div className="yam-avatar-wrap">
                  {/* v60.3 — تصغير حجم الأفاتار ليطابق الصورة المرجعية (40 بدل 56) */}
                  <Avatar name={peer} src={peerDetails.avatar} size={40} ring showStatus status={isOnline ? 'online' : 'offline'} />
                </div>
                <div className="yam-chat-stage-peer-copy">
                  {/* v67 — ضمان ظهور الاسم حتى لو كان peer مؤقتاً فارغ (أثناء التحميل). */}
                  <strong>{peer || peerDetails?.username || peerDetails?.handle || 'جارٍ التحميل...'}</strong>
                  {/*
                    v86.9 — مؤشّر الكتابة بأسلوب واتساب:
                    - عندما يبدأ الصديق بالكتابة → تتحول كلمة "متصل" إلى "جاري الكتابة..."
                    - عندما يتوقّف → تعود إلى "متصل" أو آخر ظهور.
                    - اللون والنقاط المتحرّكة تُضفى تلقائياً من خلال class typing.
                  */}
                  <span className={isTyping ? 'typing' : (isOnline ? 'online' : 'offline')} aria-live="polite">
                    {isTyping ? 'جاري الكتابة…' : (isOnline ? 'متصل الآن' : formatLastSeen(lastSeen, false))}
                  </span>
                </div>
              </button>
            </div>

            <div className="yam-chat-stage-actions" style={{ position: 'relative' }}>
              <button type="button" className="yam-stage-icon" onClick={() => setCallMode('voice')} aria-label="اتصال صوتي">📞</button>
              <button type="button" className="yam-stage-icon" onClick={() => setCallMode('video')} aria-label="اتصال فيديو">🎥</button>
              <button type="button" className="yam-stage-icon" onClick={() => setShowHeaderMenu((prev) => !prev)} aria-label="خيارات الدردشة" aria-haspopup="menu" aria-expanded={showHeaderMenu}>⋮</button>

              {/* ✅ v88.22 — قائمة (Popup / فقاعة) خيارات الدردشة عند الضغط على النقاط الثلاث */}
              {showHeaderMenu ? (
                <>
                  <div className="yam-header-menu-backdrop" onClick={() => setShowHeaderMenu(false)} />
                  <div className="yam-header-menu-popup" role="menu" dir="rtl">
                    <button
                      type="button"
                      role="menuitem"
                      className="yam-header-menu-item"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setShowSearchBubble(true);
                        setTimeout(() => { try { searchInputRef.current?.focus(); } catch { /* noop */ } }, 40);
                      }}
                    >
                      <span className="yam-header-menu-icon" aria-hidden="true">🔍</span>
                      <span>البحث</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="yam-header-menu-item danger"
                      onClick={() => {
                        setShowHeaderMenu(false);
                        setDeleteSelectedIds(new Set());
                        setDeleteForEveryone(false);
                        setShowDeleteBubble(true);
                      }}
                    >
                      <span className="yam-header-menu-icon" aria-hidden="true">🗑</span>
                      <span>حذف الدردشة</span>
                    </button>
                    <div className="yam-header-menu-sep" />
                    <button
                      type="button"
                      role="menuitem"
                      className="yam-header-menu-item"
                      onClick={() => { setShowHeaderMenu(false); setShowDetailsDrawer((prev) => !prev); }}
                    >
                      <span className="yam-header-menu-icon" aria-hidden="true">⚙</span>
                      <span>المزيد من الخيارات</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </header>

          {/* ✅ v88.22 — فقاعة (Modal) البحث داخل الدردشة عن رسالة/كلمة معينة */}
          {showSearchBubble ? (
            <div
              className="yam-chat-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="البحث داخل الدردشة"
              onClick={(e) => { if (e.target === e.currentTarget) setShowSearchBubble(false); }}
            >
              <div className="yam-chat-modal yam-chat-search-modal" dir="rtl">
                <header className="yam-chat-modal-head">
                  <strong>🔍 البحث داخل الدردشة</strong>
                  <button type="button" className="yam-chat-modal-close" onClick={() => setShowSearchBubble(false)} aria-label="إغلاق">×</button>
                </header>
                <div className="yam-chat-modal-body">
                  <div className="yam-chat-search-inputwrap">
                    <span aria-hidden="true">⌕</span>
                    <input
                      ref={searchInputRef}
                      type="search"
                      autoFocus
                      placeholder="ابحث عن كلمة أو رسالة معينة..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                    {searchQuery ? (
                      <button type="button" className="yam-chat-search-clear" onClick={() => setSearchQuery('')} aria-label="مسح">×</button>
                    ) : null}
                  </div>
                  <div className="yam-chat-search-summary">
                    {searchQuery.trim()
                      ? `عدد النتائج: ${visibleMessages.length}`
                      : 'اكتب كلمة أو جزءاً من الرسالة لعرض النتائج مباشرة داخل الدردشة.'}
                  </div>
                  <div className="yam-chat-search-results">
                    {searchQuery.trim() && visibleMessages.length === 0 ? (
                      <div className="yam-chat-search-empty">لا توجد رسائل مطابقة لعبارة البحث.</div>
                    ) : null}
                    {searchQuery.trim() && visibleMessages.length > 0 ? (
                      visibleMessages.slice(0, 40).map((m) => {
                        const mid = String(m.id || m.client_id || '');
                        const text = String(m.content || m.message || extractFileName(m) || '').slice(0, 160);
                        return (
                          <button
                            key={mid}
                            type="button"
                            className="yam-chat-search-item"
                            onClick={() => {
                              setShowSearchBubble(false);
                              try {
                                const node = messageNodesRef.current[mid];
                                if (node && node.scrollIntoView) {
                                  node.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  node.classList?.add('yam-flash-highlight');
                                  setTimeout(() => node.classList?.remove('yam-flash-highlight'), 1600);
                                }
                              } catch { /* noop */ }
                            }}
                          >
                            <span className="yam-chat-search-item-sender">@{m.sender || m.author || peer}</span>
                            <span className="yam-chat-search-item-text">{text || '— (رسالة بدون نص)'}</span>
                          </button>
                        );
                      })
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* ✅ v88.22 — فقاعة (Modal) حذف الدردشة: تحديد رسائل معينة أو حذف الكل */}
          {showDeleteBubble ? (
            <div
              className="yam-chat-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="حذف الدردشة"
              onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteBubble(false); }}
            >
              <div className="yam-chat-modal yam-chat-delete-modal" dir="rtl">
                <header className="yam-chat-modal-head">
                  <strong>🗑 حذف الدردشة</strong>
                  <button type="button" className="yam-chat-modal-close" onClick={() => setShowDeleteBubble(false)} aria-label="إغلاق">×</button>
                </header>
                <div className="yam-chat-modal-body">
                  <div className="yam-chat-delete-hint">
                    حدد الرسائل التي تريد حذفها، أو اضغط "حذف الكل" لمسح كامل الدردشة.
                  </div>

                  <div className="yam-chat-delete-toolbar">
                    <label className="yam-chat-delete-checkbox">
                      <input
                        type="checkbox"
                        checked={messages.length > 0 && deleteSelectedIds.size === messages.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDeleteSelectedIds(new Set(messages.map((m) => String(m.id || m.client_id))));
                          } else {
                            setDeleteSelectedIds(new Set());
                          }
                        }}
                      />
                      <span>تحديد الكل ({messages.length})</span>
                    </label>
                    <label className="yam-chat-delete-checkbox">
                      <input
                        type="checkbox"
                        checked={deleteForEveryone}
                        onChange={(e) => setDeleteForEveryone(e.target.checked)}
                      />
                      <span>حذف للجميع</span>
                    </label>
                  </div>

                  <div className="yam-chat-delete-list">
                    {messages.length === 0 ? (
                      <div className="yam-chat-delete-empty">لا توجد رسائل لحذفها.</div>
                    ) : (
                      messages.map((m) => {
                        const mid = String(m.id || m.client_id || '');
                        const checked = deleteSelectedIds.has(mid);
                        const text = String(m.content || m.message || extractFileName(m) || '(بدون نص)').slice(0, 120);
                        return (
                          <label key={mid} className={`yam-chat-delete-item${checked ? ' checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setDeleteSelectedIds((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(mid); else next.delete(mid);
                                  return next;
                                });
                              }}
                            />
                            <div className="yam-chat-delete-item-copy">
                              <strong>@{m.sender || m.author || peer}</strong>
                              <span>{text}</span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className="yam-chat-delete-actions">
                    <button
                      type="button"
                      className="yam-chat-delete-btn ghost"
                      onClick={() => setShowDeleteBubble(false)}
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      className="yam-chat-delete-btn primary"
                      disabled={deleteSelectedIds.size === 0}
                      onClick={async () => {
                        const ids = Array.from(deleteSelectedIds);
                        if (!ids.length) return;
                        try {
                          for (const id of ids) {
                            // eslint-disable-next-line no-await-in-loop
                            await handleDelete(id, deleteForEveryone);
                          }
                          pushToast({ type: 'success', title: `تم حذف ${ids.length} رسالة`, description: deleteForEveryone ? 'حُذفت للجميع' : 'حُذفت عندك' });
                        } catch { /* handleDelete already toasts */ }
                        setDeleteSelectedIds(new Set());
                        setShowDeleteBubble(false);
                      }}
                    >
                      حذف المحدد ({deleteSelectedIds.size})
                    </button>
                    <button
                      type="button"
                      className="yam-chat-delete-btn danger"
                      disabled={messages.length === 0}
                      onClick={async () => {
                        if (!messages.length) return;
                        // eslint-disable-next-line no-alert
                        const ok = window.confirm(`سيتم حذف كل رسائل هذه الدردشة (${messages.length})${deleteForEveryone ? ' للجميع' : ''}. متابعة؟`);
                        if (!ok) return;
                        const ids = messages.map((m) => String(m.id || m.client_id));
                        try {
                          for (const id of ids) {
                            // eslint-disable-next-line no-await-in-loop
                            await handleDelete(id, deleteForEveryone);
                          }
                          pushToast({ type: 'success', title: 'تم حذف الدردشة بالكامل' });
                        } catch { /* handleDelete already toasts */ }
                        setDeleteSelectedIds(new Set());
                        setShowDeleteBubble(false);
                      }}
                    >
                      حذف الكل
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

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

          {/* ✅ FIX v88.1: Chat Settings Panel — Drawer ثابت داخل الصفحة بدلاً من route منفصل */}
          {showChatSettingsPanel ? (
            <div
              className="yam-settings-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="إعدادات المحادثة"
              onClick={(e) => { if (e.target === e.currentTarget) setShowChatSettingsPanel(false); }}
            >
              <div className="yam-settings-panel" dir="rtl">
                <style>{`
                  .yam-settings-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: rgba(0,0,0,0.55);
                    display: flex;
                    align-items: stretch;
                    justify-content: flex-end;
                  }
                  .yam-settings-panel {
                    width: min(400px, 100vw);
                    max-height: 100dvh;
                    height: 100dvh;
                    background: radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%),
                      radial-gradient(circle at bottom left, rgba(59,130,246,0.08), transparent 22%), #040714;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    overflow-x: hidden;
                    -webkit-overflow-scrolling: touch;
                    touch-action: pan-y;
                    animation: yamPanelSlideIn 0.26s cubic-bezier(0.22,1,0.36,1) both;
                    box-shadow: -8px 0 40px rgba(0,0,0,0.55);
                    font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', system-ui, sans-serif;
                  }
                  @keyframes yamPanelSlideIn {
                    from { transform: translateX(100%); opacity: 0.6; }
                    to   { transform: translateX(0);    opacity: 1; }
                  }
                  .yam-sp-header {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: calc(16px + env(safe-area-inset-top,0px)) 18px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    background: rgba(7,10,24,0.94);
                    backdrop-filter: blur(16px);
                  }
                  .yam-sp-back {
                    width: 40px; height: 40px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.04);
                    color: #fff;
                    display: inline-flex; align-items: center; justify-content: center;
                    font-size: 18px; cursor: pointer; flex-shrink: 0;
                  }
                  .yam-sp-header-copy { flex: 1; min-width: 0; }
                  .yam-sp-header-copy strong { display: block; font-size: 16px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                  .yam-sp-header-copy span { display: block; font-size: 12px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                  .yam-sp-body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
                  .yam-sp-hero {
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                    padding: 24px 16px 18px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 18px;
                    border: 1px solid rgba(255,255,255,0.07);
                    text-align: center;
                  }
                  .yam-sp-hero h1 { font-size: 20px; font-weight: 900; margin: 0; }
                  .yam-sp-hero p { font-size: 13px; opacity: 0.65; margin: 0; }
                  .yam-sp-stats {
                    display: grid; grid-template-columns: 1fr 1fr;
                    gap: 8px; width: 100%; margin-top: 4px;
                  }
                  .yam-sp-stat {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 10px 12px;
                    display: flex; flex-direction: column; gap: 2px;
                  }
                  .yam-sp-stat span { font-size: 11px; opacity: 0.55; }
                  .yam-sp-stat strong { font-size: 18px; font-weight: 900; }
                  .yam-sp-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 18px;
                    overflow: hidden;
                  }
                  .yam-sp-card-title {
                    display: flex; align-items: baseline; justify-content: space-between;
                    padding: 14px 16px 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                  }
                  .yam-sp-card-title h2 { font-size: 15px; font-weight: 800; margin: 0; }
                  .yam-sp-card-title small { font-size: 11px; opacity: 0.5; }
                  .yam-sp-actions { display: flex; flex-direction: column; }
                  .yam-sp-action-btn {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 14px 16px;
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                    text-align: right;
                  }
                  .yam-sp-action-btn:last-child { border-bottom: none; }
                  .yam-sp-action-btn:hover { background: rgba(255,255,255,0.04); }
                  .yam-sp-action-btn.danger { color: #f87171; }
                  .yam-sp-empty { padding: 16px; font-size: 13px; opacity: 0.5; text-align: center; }
                  .yam-sp-media-strip { display: flex; gap: 6px; flex-wrap: wrap; padding: 12px; }
                  .yam-sp-media-thumb {
                    width: 80px; height: 80px;
                    border-radius: 10px;
                    overflow: hidden;
                    background: rgba(255,255,255,0.05);
                    flex-shrink: 0;
                  }
                  .yam-sp-media-thumb img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    display: block;
                  }
                  .yam-sp-video-ph {
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 24px;
                  }
                  .yam-sp-link-list, .yam-sp-file-list { display: flex; flex-direction: column; padding: 4px 0; }
                  .yam-sp-link-item, .yam-sp-file-item {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 8px;
                    padding: 10px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                  }
                  .yam-sp-link-item:last-child, .yam-sp-file-item:last-child { border-bottom: none; }
                  .yam-sp-link-copy strong, .yam-sp-file-copy strong {
                    display: block; font-size: 12.5px;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;
                  }
                  .yam-sp-link-copy span, .yam-sp-file-copy span { font-size: 11px; opacity: 0.55; }
                  .yam-sp-open-link {
                    flex-shrink: 0;
                    padding: 5px 12px;
                    border-radius: 10px;
                    background: rgba(99,102,241,0.18);
                    color: #a5b4fc;
                    font-size: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    border: 1px solid rgba(99,102,241,0.3);
                  }
                `}</style>

                {/* هيدر الباند */}
                <header className="yam-sp-header">
                  <button type="button" className="yam-sp-back" onClick={() => setShowChatSettingsPanel(false)} aria-label="إغلاق">←</button>
                  <Avatar name={peer} src={peerDetails.avatar} size={40} ring showStatus status={isOnline ? 'online' : 'offline'} />
                  <div className="yam-sp-header-copy">
                    <strong>{peer}</strong>
                    <span>{isTyping ? 'جاري الكتابة…' : (isOnline ? 'متصل الآن' : formatLastSeen(lastSeen, false))}</span>
                  </div>
                </header>

                {/* جسم الباند */}
                <div className="yam-sp-body">
                  {/* بطاقة المعلومات */}
                  <section className="yam-sp-hero">
                    <Avatar name={peer} src={peerDetails.avatar} size={96} ring showStatus status={isOnline ? 'online' : 'offline'} />
                    <h1>{peer}</h1>
                    <p>{isTyping ? 'يكتب الآن...' : (isOnline ? 'متصل الآن' : formatLastSeen(lastSeen, false))}</p>
                    <div className="yam-sp-stats">
                      <div className="yam-sp-stat"><span>الوسائط المشتركة</span><strong>{settingsPanelData.mediaItems.length}</strong></div>
                      <div className="yam-sp-stat"><span>الروابط</span><strong>{settingsPanelData.sharedLinks.length}</strong></div>
                      <div className="yam-sp-stat"><span>الملفات والصوتيات</span><strong>{settingsPanelData.fileItems.length}</strong></div>
                      <div className="yam-sp-stat"><span>حالة المحادثة</span><strong>{settingsPanelData.blockStatus?.blocked_by_me ? 'محظور' : (isMutedConversation ? 'مكتومة' : 'نشطة')}</strong></div>
                    </div>
                  </section>

                  {/* إجراءات المحادثة */}
                  <section className="yam-sp-card">
                    <div className="yam-sp-card-title"><h2>إجراءات المحادثة</h2><small>بنفس أسلوب واتساب تقريبًا</small></div>
                    <div className="yam-sp-actions">
                      <button type="button" className="yam-sp-action-btn" onClick={() => { handleMuteConversation(); }}>
                        <strong>{isMutedConversation ? 'إلغاء كتم المحادثة' : 'كتم المحادثة'}</strong>
                        <span>{isMutedConversation ? '🔔' : '🔕'}</span>
                      </button>
                      <button type="button" className="yam-sp-action-btn" onClick={() => { handlePinConversation(); }}>
                        <strong>{isPinnedConversation ? 'إلغاء تثبيت المحادثة' : 'تثبيت المحادثة'}</strong>
                        <span>📌</span>
                      </button>
                      <button type="button" className={`yam-sp-action-btn${settingsPanelData.blockStatus?.blocked_by_me ? '' : ' danger'}`} onClick={() => { handleBlock(); setShowChatSettingsPanel(false); }}>
                        <strong>{settingsPanelData.blockStatus?.blocked_by_me ? 'رفع الحظر' : 'حظر المستخدم'}</strong>
                        <span>{settingsPanelData.blockStatus?.blocked_by_me ? '✅' : '🚫'}</span>
                      </button>
                    </div>
                  </section>

                  {/* الوسائط المشتركة */}
                  <section className="yam-sp-card">
                    <div className="yam-sp-card-title"><h2>الوسائط المشتركة</h2><small>{settingsPanelData.mediaItems.length} عنصر</small></div>
                    {settingsPanelData.loading ? <div className="yam-sp-empty">جاري تحميل الوسائط...</div> : null}
                    {!settingsPanelData.loading && !settingsPanelData.mediaItems.length ? <div className="yam-sp-empty">لا توجد وسائط مشتركة حالياً.</div> : null}
                    {!settingsPanelData.loading && settingsPanelData.mediaItems.length ? (
                      <div className="yam-sp-media-strip">
                        {settingsPanelData.mediaItems.map((item) => (
                          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="yam-sp-media-thumb">
                            {item.type === 'image'
                              ? <img src={item.url} alt={item.caption || 'وسائط'} />
                              : <div className="yam-sp-video-ph">🎬</div>}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  {/* الروابط المشتركة */}
                  <section className="yam-sp-card">
                    <div className="yam-sp-card-title"><h2>الروابط المشتركة</h2><small>{settingsPanelData.sharedLinks.length} رابط</small></div>
                    {!settingsPanelData.sharedLinks.length ? <div className="yam-sp-empty">لا توجد روابط مشتركة.</div> : null}
                    {settingsPanelData.sharedLinks.length ? (
                      <div className="yam-sp-link-list">
                        {settingsPanelData.sharedLinks.map((item) => (
                          <div key={item.id} className="yam-sp-link-item">
                            <div className="yam-sp-link-copy"><strong>{item.url}</strong><span>أرسله {item.sender}</span></div>
                            <a className="yam-sp-open-link" href={item.url} target="_blank" rel="noreferrer">فتح</a>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  {/* الملفات والصوتيات */}
                  <section className="yam-sp-card">
                    <div className="yam-sp-card-title"><h2>الملفات والصوتيات</h2><small>{settingsPanelData.fileItems.length} ملف</small></div>
                    {!settingsPanelData.fileItems.length ? <div className="yam-sp-empty">لا توجد ملفات أو رسائل صوتية.</div> : null}
                    {settingsPanelData.fileItems.length ? (
                      <div className="yam-sp-file-list">
                        {settingsPanelData.fileItems.map((item, idx) => (
                          <div key={String(item?.id || item?.client_id || idx)} className="yam-sp-file-item">
                            <div className="yam-sp-file-copy">
                              <strong>{item?.attachment_name || item?.attachments?.[0]?.file_name || item?.attachments?.[0]?.name || 'ملف مرفق'}</strong>
                              <span>{String(item?.type || '').toLowerCase().includes('voice') || String(item?.type || '').toLowerCase().includes('audio') ? 'رسالة صوتية' : 'ملف مرفق'}</span>
                            </div>
                            {item?._resolvedUrl ? <a className="yam-sp-open-link" href={item._resolvedUrl} target="_blank" rel="noreferrer">فتح</a> : <span>📎</span>}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flying-hearts-layer" aria-hidden>
            {flyingHearts.map((id) => (
              <span key={id} className="flying-heart">💜</span>
            ))}
          </div>

          {/* 🔧 v59.13.32 FIX #1: CallExperience يتولّى العرض fixed overlay داخليّاً */}
          {callMode ? (
            <CallExperience
              open={Boolean(callMode)}
              mode={callMode}
              callType="direct"
              participantName={peer}
              onClose={() => setCallMode(null)}
              onStatusChange={() => {}}
            />
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
            {/* ✅ v59.13.37 FIX #3: زر "تحميل رسائل أقدم" في أعلى منطقة الرسائل */}
            {!msgLoading && messages.length > 0 && hasMoreOlder ? (
              <div className="yam-load-older-row" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px' }}>
                <button
                  type="button"
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                  aria-label="تحميل رسائل أقدم"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'inherit',
                    border: '1px solid rgba(255,255,255,0.14)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: loadingOlder ? 'progress' : 'pointer',
                    opacity: loadingOlder ? 0.7 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {loadingOlder ? '⏳ جارٍ تحميل الأقدم…' : '⤴ تحميل رسائل أقدم'}
                </button>
              </div>
            ) : null}
            {!msgLoading && messages.length > 0 && !hasMoreOlder ? (
              <div className="yam-load-older-end" aria-hidden="true" style={{ textAlign: 'center', padding: '6px 0', fontSize: 11, opacity: 0.5 }}>
                — بداية المحادثة —
              </div>
            ) : null}
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
                  // ✅ FIX v85.6 (زر التعديل يختفي عند الضغط على رسالتي):
                  // المقارنة الصارمة كانت تفشل بسبب اختلافات الحالة (case) أو المسافات
                  // أو الرمز @ أو حقول sender_username البديلة. نُطبِّع كلا الطرفين قبل المقارنة.
                  isMe={(() => {
                    const me = String(currentUser || '').trim().toLowerCase().replace(/^@/, '');
                    const sender = String(
                      msg?.sender_username || msg?.sender || msg?.author || msg?.from || ''
                    ).trim().toLowerCase().replace(/^@/, '');
                    if (msg?.isMe === true) return true;
                    return Boolean(me) && Boolean(sender) && me === sender;
                  })()}
                  prevMessage={item.prevMessage}
                  nextMessage={item.nextMessage}
                  onReply={(message) => setReplyTo(message)}
                  onDelete={handleDelete}
                  onDeleteForMe={(id) => handleDelete(id, false)}
                  onDeleteForEveryone={(id) => handleDelete(id, true)}
                  onEdit={(message) => {
                    // ✅ v59.13.17 FIX #2: استبدال window.prompt بمودال داخلي (UX أفضل على الموبايل ولا يحجبه أي متصفّح)
                    const current = message?.content || message?.message || '';
                    setEditingMessage({ id: message.id || message.client_id, original: current });
                    setEditingDraft(current);
                  }}
                  onResend={(message) => {
                    setReplyTo(null);
                    handleSend({
                      content: message?.content || message?.message || '',
                      media_url: message?.media_url,
                      type: message?.type,
                    });
                    pushToast({ type: 'success', title: 'جاري إعادة الإرسال…' });
                  }}
                  onReport={(message) => {
                    // ✅ v59.13.17 FIX #1: فتح ReportModal الموحّد بدلاً من window.prompt + Toast كاذب لا يصل للسيرفر
                    setReportTarget({
                      id: message?.id || message?.client_id,
                      label: `رسالة من @${message?.sender || message?.author || peer}`,
                    });
                  }}
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
              { key: 'call', label: 'اتصال', icon: '📞', cls: 'call-action', aria: 'بدء مكالمة صوتية', action: () => setCallMode('voice') },
              { key: 'video', label: 'فيديو', icon: '🎥', cls: 'video-action', aria: 'بدء مكالمة فيديو', action: () => setCallMode('video') },
              { key: 'search', label: 'بحث', icon: '⌕', cls: 'search-action', aria: 'بحث في الرسائل', action: () => searchInputRef.current?.focus() },
              { key: 'more', label: 'المزيد', icon: '⋯', cls: 'more-action', aria: 'خيارات إضافية', action: () => setShowDetailsDrawer((prev) => !prev) },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`yam-quick-card ${item.cls}`}
                onClick={item.action}
                aria-label={item.aria}
                title={item.aria}
              >
                <span aria-hidden="true">{item.icon}</span>
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

      {/* ✅ v59.13.17 FIX #1: مودال الإبلاغ الموحّد لرسائل الشات 1‑1 */}
      <ReportModal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetType="message"
        targetId={reportTarget?.id}
        targetLabel={reportTarget?.label}
      />

      {/* ✅ v59.13.17 FIX #2: مودال تعديل الرسالة (بدلاً عن window.prompt) */}
      {editingMessage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="yam-edit-msg-title"
          dir="rtl"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif",
          }}
          onClick={(e) => {
            // إغلاق عند النقر على الخلفية
            if (e.target === e.currentTarget) {
              setEditingMessage(null);
              setEditingDraft('');
            }
          }}
        >
          <div style={{
            background: 'var(--bg-elevated, #1f2233)', color: 'var(--text, #fff)',
            borderRadius: 14, width: '100%', maxWidth: 480,
            padding: 18, boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 id="yam-edit-msg-title" style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 700 }}>
              ✏️ تعديل الرسالة
            </h3>
            <textarea
              autoFocus
              value={editingDraft}
              onChange={(e) => setEditingDraft(e.target.value)}
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: 10, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                color: 'inherit', border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: 'inherit', fontSize: 15, resize: 'vertical',
              }}
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingMessage(null);
                  setEditingDraft('');
                }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{editingDraft.length}/2000</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setEditingMessage(null); setEditingDraft(''); }}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  background: 'transparent', color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.16)', fontWeight: 600,
                }}
              >إلغاء</button>
              <button
                type="button"
                disabled={!editingDraft.trim() || editingDraft.trim() === (editingMessage?.original || '').trim() || editingMessage?.saving}
                onClick={async () => {
                  /* ✅ v59.13.37 FIX #5: استدعاء editMessage() API + تحديث متفائل + rollback عند الفشل */
                  const newText = editingDraft.trim();
                  if (!newText || !editingMessage?.id) return;
                  const messageId = editingMessage.id;
                  const originalText = editingMessage.original || '';

                  // علامة "جارٍ الحفظ" لتعطيل الزر أثناء الطلب
                  setEditingMessage((prev) => (prev ? { ...prev, saving: true } : prev));

                  // تحديث متفائل
                  applyMessagePatch(peer, [messageId], {
                    content: newText,
                    message: newText,
                    edited: true,
                    edited_at: new Date().toISOString(),
                  });

                  try {
                    await editMessageApi(messageId, newText);
                    pushToast({ type: 'success', title: 'تم تعديل الرسالة' });
                    setEditingMessage(null);
                    setEditingDraft('');
                  } catch (err) {
                    // rollback في حال الفشل
                    applyMessagePatch(peer, [messageId], {
                      content: originalText,
                      message: originalText,
                      edited: false,
                      edited_at: null,
                    });
                    pushToast({
                      type: 'error',
                      title: 'تعذر تعديل الرسالة',
                      description: err?.response?.data?.detail || 'حدث خطأ أثناء حفظ التعديل، حاول مجددًا',
                    });
                    setEditingMessage((prev) => (prev ? { ...prev, saving: false } : prev));
                  }
                }}
                style={{
                  padding: '9px 18px', borderRadius: 10, cursor: editingMessage?.saving ? 'progress' : 'pointer',
                  background: 'var(--primary, #6f53ff)', color: '#fff',
                  border: 'none', fontWeight: 700,
                  opacity: (!editingDraft.trim() || editingDraft.trim() === (editingMessage?.original || '').trim() || editingMessage?.saving) ? 0.5 : 1,
                }}
              >{editingMessage?.saving ? '⏳ جارٍ الحفظ…' : 'حفظ التعديل'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
