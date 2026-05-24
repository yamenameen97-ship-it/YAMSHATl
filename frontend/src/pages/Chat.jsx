import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import CallExperience from '../components/chat/CallExperience.jsx';
import MediaViewerModal from '../components/chat/MediaViewerModal.jsx';
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
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';
import { useAppStore, useChatStore } from '../store/appStore.js';
import {
  buildQueuedChatAction,
  loadConversationSnapshot,
  markPendingAck,
  mergeMessages,
  mergePaging,
  persistConversationSnapshot,
  replaceConversationSnapshot,
  resolvePendingAck,
} from '../features/chat/chatReliability.js';
import { getChatPreferences, toggleChatPreference } from '../utils/chatPreferences.js';
import {
  avatarGradient,
  formatLastSeen,
  initialsFromName,
  statusColor,
  statusTicks,
} from '../components/yamshat/YamshatDesign.js';
import { CHAT_NAV_ITEMS, buildContacts, getContactDetails } from '../features/chat/chatShellFixtures.js';

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '👍', '😍'];
const REACTION_STORAGE_KEY = 'yamshat.chat.reactions.v2';

function Avatar({ name = '', src, size = 44, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: size > 56 ? 24 : 18,
    objectFit: 'cover',
    flexShrink: 0,
    border: ring ? '1px solid rgba(139,92,246,0.35)' : 'none',
    boxShadow: ring ? '0 0 0 5px rgba(139,92,246,0.14)' : 'none',
  };

  return src ? (
    <img src={src} alt={name} style={style} loading="lazy" decoding="async" />
  ) : (
    <div
      style={{
        ...style,
        display: 'grid',
        placeItems: 'center',
        color: 'white',
        fontWeight: 900,
        background: avatarGradient(name),
        fontSize: size * 0.34,
      }}
    >
      {initialsFromName(name).slice(0, 1)}
    </div>
  );
}

function PresenceDot({ isOnline, size = 14, borderColor = '#070b1b' }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: isOnline ? '#22c55e' : '#64748b',
        border: `3px solid ${borderColor}`,
        boxShadow: isOnline ? '0 0 0 4px rgba(34,197,94,0.18)' : 'none',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

function formatMessageTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function readReactions(peer) {
  if (typeof window === 'undefined' || !peer) return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REACTION_STORAGE_KEY) || '{}');
    return parsed?.[peer] || {};
  } catch {
    return {};
  }
}

function persistReactions(peer, payload) {
  if (typeof window === 'undefined' || !peer) return;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REACTION_STORAGE_KEY) || '{}');
    parsed[peer] = payload;
    window.localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
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
    message.reply_to?.content,
  ].some((value) => String(value || '').toLowerCase().includes(lowered));
}

function isImageMessage(message) {
  return message.type === 'image' || Boolean(message.media_url && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(message.media_url));
}

function isVideoMessage(message) {
  return message.type === 'video' || Boolean(message.media_url && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(message.media_url));
}

function isVoiceMessage(message) {
  return message.type === 'voice' || Boolean(message.media_url && /\.(mp3|wav|ogg|webm)(\?.*)?$/i.test(message.media_url) && message.type === 'voice');
}

function getThreadReplyCount(messages, rootId) {
  return messages.filter((item) => String(item.reply_to?.id || '') === String(rootId)).length;
}

function MessageBubble({
  message,
  isMe,
  onReply,
  onDelete,
  onPreview,
  onReact,
  reactions = {},
  threadReplyCount = 0,
  onOpenThread,
  highlightQuery = '',
}) {
  const hasMedia = Boolean(message.media_url);
  const isVoice = isVoiceMessage(message);
  const isImage = isImageMessage(message);
  const isVideo = isVideoMessage(message);
  const isFile = message.type === 'file' || (hasMedia && !isVoice && !isImage && !isVideo);
  const content = message.content || message.message || '';
  const fileName = extractFileName(message);
  const shouldGlow = highlightQuery.trim() && messageMatchesSearch(message, highlightQuery);
  const reactionEntries = Object.entries(reactions || {}).filter(([, count]) => Number(count) > 0);

  const previewPayload = isImage
    ? { type: 'image', url: message.media_url, title: fileName || 'صورة' }
    : isVideo
      ? { type: 'video', url: message.media_url, title: fileName || 'فيديو' }
      : null;

  return (
    <div className={`yam-bubble-wrap ${isMe ? 'me' : 'them'}`}>
      {!isMe ? (
        <div className="yam-bubble-avatar-slot">
          <Avatar name={message.sender} size={36} />
        </div>
      ) : null}

      <div className={`yam-bubble ${isMe ? 'bubble-me' : 'bubble-them'} ${shouldGlow ? 'search-hit' : ''}`}>
        {message.reply_to ? (
          <button type="button" className="bubble-reply-banner" onClick={() => onOpenThread?.(message.reply_to?.id)}>
            <strong>↩ الرد على</strong>
            <span>{message.reply_to?.content || '...'}</span>
          </button>
        ) : null}

        {isVoice && message.media_url ? (
          <div className="yam-audio-wrap">
            <audio src={message.media_url} controls preload="metadata" style={{ width: '100%' }} />
          </div>
        ) : null}

        {isImage && message.media_url ? (
          <button type="button" className="media-preview-btn" onClick={() => onPreview(previewPayload)}>
            <img src={message.media_url} alt="media" loading="lazy" decoding="async" style={{ maxWidth: 320, width: '100%', borderRadius: 18, display: 'block' }} />
          </button>
        ) : null}

        {isVideo && message.media_url ? (
          <button type="button" className="media-preview-btn" onClick={() => onPreview(previewPayload)}>
            <video src={message.media_url} controls preload="metadata" style={{ maxWidth: 320, width: '100%', borderRadius: 18, display: 'block' }} />
          </button>
        ) : null}

        {isFile && message.media_url ? (
          <a href={message.media_url} target="_blank" rel="noreferrer" className="yam-file-card">
            <span className="yam-file-icon">📄</span>
            <span className="yam-file-copy">
              <strong>{fileName}</strong>
              <small>{(message.attachments?.[0]?.mediaType || message.type || 'FILE').toUpperCase()}</small>
            </span>
          </a>
        ) : null}

        {content && !message.deleted ? <div className="bubble-text">{content}</div> : null}
        {message.deleted ? <div className="bubble-deleted">تم حذف الرسالة</div> : null}

        {threadReplyCount > 0 ? (
          <button type="button" className="thread-chip" onClick={() => onOpenThread?.(message.id)}>
            {threadReplyCount} رد في نفس السلسلة
          </button>
        ) : null}

        {reactionEntries.length ? (
          <div className="reaction-stack">
            {reactionEntries.map(([emoji, count]) => <span key={emoji} className="reaction-pill">{emoji} {count}</span>)}
          </div>
        ) : null}

        <div className="bubble-meta">
          <span className="bubble-time">{formatMessageTime(message.created_at)}</span>
          {isMe ? (
            <span style={{ color: statusColor(message.status), fontSize: 13, fontWeight: 700 }}>
              {statusTicks(message.status)}
            </span>
          ) : null}
        </div>

        <div className="bubble-actions bubble-actions--rich">
          <button type="button" onClick={() => onReply(message)}>↩ رد</button>
          {REACTION_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => onReact(message.id, emoji)}>{emoji}</button>
          ))}
          {previewPayload ? <button type="button" onClick={() => onPreview(previewPayload)}>معاينة</button> : null}
          {isMe && !message.deleted ? <button type="button" onClick={() => onDelete(message.id, false)}>🗑</button> : null}
          {isMe && !message.deleted ? <button type="button" onClick={() => onDelete(message.id, true)}>🧹</button> : null}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const peer = decodeURIComponent(userId || '').trim();
  const currentUser = getCurrentUsername();
  const { pushToast } = useToast();

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [presence, setPresence] = useState({});
  const [blockStatus, setBlockStatus] = useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [replyTo, setReplyTo] = useState(null);
  const [callMode, setCallMode] = useState(null);
  const [flyingHearts, setFlyingHearts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [threadRootId, setThreadRootId] = useState('');
  const [reactionMap, setReactionMap] = useState({});
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const initialChatPrefs = useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = useState(initialChatPrefs.muted.has(peer));
  const [isPinnedConversation, setIsPinnedConversation] = useState(initialChatPrefs.pinned.has(peer));
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const pagingRef = useRef({ has_more: true, next_before_id: null, limit: 80 });
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const queueAction = useAppStore((state) => state.queueAction);
  const appIsOnline = useAppStore((state) => state.isOnline);

  useEffect(() => {
    setReactionMap(readReactions(peer));
  }, [peer]);

  useEffect(() => {
    persistReactions(peer, reactionMap);
  }, [peer, reactionMap]);

  useEffect(() => {
    if (!currentUser || !peer) return;
    const cached = loadConversationSnapshot(currentUser, peer);
    pagingRef.current = mergePaging(pagingRef.current, cached?.paging || {});
    if (Array.isArray(cached?.messages) && cached.messages.length) {
      setMessages(cached.messages);
    }
  }, [currentUser, peer]);

  useEffect(() => {
    if (!currentUser || !peer) return;
    persistConversationSnapshot(currentUser, peer, {
      messages,
      paging: pagingRef.current,
    });
  }, [currentUser, messages, peer]);

  useEffect(() => {
    let active = true;
    setThreadsLoading(true);
    getChatThreads()
      .then(({ data }) => {
        if (active) setThreads(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setThreadsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const syncChatState = useCallback(async () => {
    if (!peer) return;
    try {
      socketManager.emit('sync_chat_state', { peer });
      await markMessagesSeen(peer);
      setLastSyncedAt(new Date().toISOString());
    } catch {
      // silent sync failures
    }
  }, [peer]);

  const loadMessages = useCallback(async () => {
    if (!peer || !currentUser) return;
    setMsgLoading(true);
    try {
      const { data } = await getMessages(peer, 80);
      const mergedItems = mergeMessages(loadConversationSnapshot(currentUser, peer)?.messages || [], data?.items || []);
      pagingRef.current = mergePaging(pagingRef.current, data?.paging || {});
      replaceConversationSnapshot(currentUser, peer, {
        messages: mergedItems,
        paging: pagingRef.current,
      });
      setMessages(mergedItems);
      await syncChatState();
    } catch {
      const cached = loadConversationSnapshot(currentUser, peer);
      if (cached?.messages?.length) {
        setMessages(cached.messages);
      } else {
        pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحميل الرسائل' });
      }
    } finally {
      setMsgLoading(false);
    }
  }, [currentUser, peer, pushToast, syncChatState]);

  useEffect(() => {
    if (!peer) return undefined;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
    setShowDetailsDrawer(false);
    setThreadRootId('');
    loadMessages();
    setActivePeer(peer);

    getPresence(peer)
      .then(({ data }) => {
        setPresence((prev) => ({ ...prev, [peer]: { ...(prev[peer] || {}), ...(data || {}) } }));
      })
      .catch(() => {});

    getBlockStatus(peer)
      .then(({ data }) => setBlockStatus(data || {}))
      .catch(() => {});

    return () => setActivePeer(null);
  }, [loadMessages, peer, setActivePeer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, threadRootId]);

  useEffect(() => {
    if (!currentUser) return undefined;
    socketManager.connect();
    socketManager.emit('register_user', { user: currentUser }, { skipSignature: true });
    if (peer) socketManager.emit('join_chat', { peer });

    const onMsg = (msg) => {
      const participants = [msg?.sender, msg?.receiver];
      if (!participants.includes(currentUser)) return;
      const normalized = {
        ...msg,
        status: msg?.status || (msg?.sender === currentUser ? (msg?.is_seen ? 'seen' : msg?.is_delivered ? 'delivered' : 'sent') : 'delivered'),
      };
      setMessages((prev) => mergeMessages(prev, [normalized]));
      setThreads((prev) => prev.map((item) => item.username === msg.sender || item.username === msg.receiver
        ? { ...item, last_message: msg.content || msg.message, created_at: msg.created_at }
        : item));
      if (msg?.client_id && msg?.sender === currentUser) {
        resolvePendingAck(currentUser, msg.client_id);
      }
      if (msg.sender === peer) syncChatState();
    };

    const onDelivered = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? { ...item, status: 'delivered' } : item));
      (payload?.client_ids || []).forEach((clientId) => resolvePendingAck(currentUser, clientId));
    };

    const onSeen = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? { ...item, status: 'seen' } : item));
      (payload?.client_ids || []).forEach((clientId) => resolvePendingAck(currentUser, clientId));
    };

    const onPresence = (payload) => {
      if (!payload?.user) return;
      setPresence((prev) => ({ ...prev, [payload.user]: { ...(prev[payload.user] || {}), ...payload } }));
    };

    const onTyping = (payload) => {
      if (!payload?.sender) return;
      setPresence((prev) => ({
        ...prev,
        [payload.sender]: { ...(prev[payload.sender] || {}), is_typing: payload.is_typing },
      }));
      if (payload.is_typing) {
        setTimeout(() => setPresence((prev) => ({
          ...prev,
          [payload.sender]: { ...(prev[payload.sender] || {}), is_typing: false },
        })), 3200);
      }
    };

    const onRecording = (payload) => {
      if (!payload?.sender) return;
      setPresence((prev) => ({
        ...prev,
        [payload.sender]: { ...(prev[payload.sender] || {}), is_recording: Boolean(payload.is_recording) },
      }));
      if (payload.is_recording) {
        setTimeout(() => setPresence((prev) => ({
          ...prev,
          [payload.sender]: { ...(prev[payload.sender] || {}), is_recording: false },
        })), 2600);
      }
    };

    const onDeleted = (payload) => {
      if (!payload?.id) return;
      setMessages((prev) => prev.map((item) => String(item.id) === String(payload.id) ? { ...item, ...payload, deleted: true } : item));
    };

    const onQueuedSent = (event) => {
      const detail = event?.detail || {};
      const response = detail?.response || {};
      const clientId = detail?.client_id;
      if (!clientId) return;
      resolvePendingAck(currentUser, clientId);
      setMessages((prev) => mergeMessages(prev, [{
        ...response,
        client_id: response?.client_id || clientId,
        status: response?.status || 'sent',
      }]));
    };

    const onQueuedFailed = (event) => {
      const detail = event?.detail || {};
      const clientId = detail?.client_id;
      if (!clientId) return;
      setMessages((prev) => prev.map((item) => item.client_id === clientId || item.id === clientId
        ? { ...item, status: 'failed', error: detail?.error || 'فشل الإرسال' }
        : item));
    };

    socketManager.on('new_private_message', onMsg);
    socketManager.on('messages_delivered', onDelivered);
    socketManager.on('messages_seen', onSeen);
    socketManager.on('presence_update', onPresence);
    socketManager.on('typing_update', onTyping);
    socketManager.on('recording_update', onRecording);
    socketManager.on('message_deleted', onDeleted);

    const interval = window.setInterval(() => syncChatState(), 12000);
    const onWindowFocus = () => syncChatState();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncChatState();
    };

    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('yamshat:queued-message-sent', onQueuedSent);
    window.addEventListener('yamshat:queued-message-failed', onQueuedFailed);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('yamshat:queued-message-sent', onQueuedSent);
      window.removeEventListener('yamshat:queued-message-failed', onQueuedFailed);
      if (peer) socketManager.emit('leave_chat', { peer });
      socketManager.off('new_private_message', onMsg);
      socketManager.off('messages_delivered', onDelivered);
      socketManager.off('messages_seen', onSeen);
      socketManager.off('presence_update', onPresence);
      socketManager.off('typing_update', onTyping);
      socketManager.off('recording_update', onRecording);
      socketManager.off('message_deleted', onDeleted);
    };
  }, [currentUser, peer, syncChatState]);

  const handleSend = async (payload) => {
    const text = payload?.text?.trim() || '';
    const mediaUrl = payload?.media_url || '';
    if (!text && !mediaUrl) return;

    const tempId = `tmp-${Date.now()}`;
    const outgoingPayload = {
      receiver: peer,
      message: text,
      media_url: mediaUrl,
      type: mediaUrl ? (payload?.type || 'media') : 'text',
      reply_to_id: replyTo?.id || null,
      client_id: tempId,
      attachments: payload?.attachments || [],
      media_urls: payload?.media_urls || [],
      securityPayload: payload?.securityPayload || null,
      disappearing_in_seconds: Number(payload?.disappearing_in_seconds || 0),
    };
    const tempMsg = {
      id: tempId,
      client_id: tempId,
      local_id: tempId,
      sender: currentUser,
      receiver: peer,
      content: text,
      message: text,
      media_url: mediaUrl,
      attachments: payload?.attachments || [],
      attachment_name: payload?.attachments?.[0]?.fileName || payload?.attachments?.[0]?.originalName || '',
      type: outgoingPayload.type,
      created_at: new Date().toISOString(),
      status: appIsOnline ? 'sending' : 'queued',
      pending_sync: !appIsOnline,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content || replyTo.message } : null,
    };

    markPendingAck(currentUser, peer, tempMsg);
    setMessages((prev) => mergeMessages(prev, [tempMsg]));
    setReplyTo(null);

    if (!appIsOnline) {
      queueAction(buildQueuedChatAction(outgoingPayload));
      pushToast({ type: 'info', title: 'تم حفظ الرسالة', description: 'هتتبعث تلقائياً أول ما الإنترنت يرجع.' });
      return;
    }

    try {
      const { data } = await sendMessageApi(outgoingPayload);
      resolvePendingAck(currentUser, tempId);
      setMessages((prev) => mergeMessages(prev, [{ ...tempMsg, ...(data || {}), status: (data || {}).status || 'sent', pending_sync: false }]));
      syncChatState();
    } catch (error) {
      const status = error?.response?.status;
      const shouldQueue = !status || status >= 500 || status === 429;
      if (shouldQueue) {
        queueAction(buildQueuedChatAction(outgoingPayload));
        setMessages((prev) => prev.map((item) => item.id === tempId || item.client_id === tempId
          ? { ...item, status: 'queued', pending_sync: true }
          : item));
        pushToast({ type: 'info', title: 'تم حفظ الرسالة محلياً', description: 'سيتم إعادة المحاولة تلقائياً.' });
        return;
      }

      resolvePendingAck(currentUser, tempId, { remove: false, status: 'failed' });
      setMessages((prev) => prev.map((item) => item.id === tempId || item.client_id === tempId
        ? { ...item, status: 'failed', pending_sync: false }
        : item));
      pushToast({ type: 'error', title: 'خطأ', description: error?.response?.data?.detail || 'فشل إرسال الرسالة' });
    }
  };

  const handleDelete = async (msgId, deleteForEveryone = false) => {
    try {
      await deleteMessageApi(msgId, { delete_for_everyone: deleteForEveryone });
      setMessages((prev) => prev.map((item) => item.id === msgId ? { ...item, deleted: true, deleted_for_everyone: deleteForEveryone, content: '', message: '' } : item));
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

  const handleToggleReaction = (messageId, emoji) => {
    setReactionMap((prev) => {
      const messageReactions = { ...(prev?.[messageId] || {}) };
      messageReactions[emoji] = messageReactions[emoji] ? 0 : 1;
      const next = { ...prev, [messageId]: messageReactions };
      persistReactions(peer, next);
      return next;
    });
  };

  const spawnHeart = () => {
    const id = Date.now();
    setFlyingHearts((prev) => [...prev, id]);
    setTimeout(() => setFlyingHearts((prev) => prev.filter((item) => item !== id)), 1800);
  };

  const contacts = useMemo(() => buildContacts(threads, peer), [peer, threads]);
  const peerDetails = useMemo(() => getContactDetails(threads, peer), [peer, threads]);
  const filteredContacts = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    if (!lowered) return contacts;
    return contacts.filter((contact) => String(contact.username).toLowerCase().includes(lowered) || String(contact.preview).toLowerCase().includes(lowered));
  }, [contacts, searchQuery]);

  const peerPresence = presence[peer] || {};
  const isOnline = Boolean(peerPresence.is_online ?? peerDetails.isOnline);
  const isTyping = Boolean(peerPresence.is_typing);
  const isRecording = Boolean(peerPresence.is_recording);
  const lastSeen = peerPresence.last_seen;
  const mediaMessages = useMemo(() => messages.filter((item) => item.media_url), [messages]);
  const fileMessages = useMemo(() => messages.filter((item) => item.type === 'file' || item.type === 'voice'), [messages]);
  const activeThreadRoot = useMemo(() => messages.find((item) => String(item.id) === String(threadRootId)), [messages, threadRootId]);
  const visibleMessages = useMemo(() => {
    const searched = messages.filter((item) => messageMatchesSearch(item, searchQuery));
    if (!threadRootId) return searched;
    return searched.filter((item) => String(item.id) === String(threadRootId) || String(item.reply_to?.id || '') === String(threadRootId));
  }, [messages, searchQuery, threadRootId]);
  const messageResultsCount = searchQuery.trim() ? visibleMessages.length : messages.length;

  if (!peer) {
    return <Navigate to="/inbox" replace />;
  }

  return (
    <MainLayout hideNav>
      <section className="yam-conversation-screen" dir="rtl">
        <aside className="yam-chat-sidebar">
          <div className="yam-sidebar-brand">
            <div className="yam-brand-mark">Y</div>
            <div className="yam-brand-name">YAMSHAT</div>
          </div>

          <nav className="yam-primary-nav">
            {CHAT_NAV_ITEMS.map((item, index) => (
              <button key={item.key} type="button" className={`yam-nav-item ${index === 0 ? 'active' : ''}`} onClick={() => navigate(index === 0 ? '/inbox' : '#')}>
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
                  <Avatar name={contact.username} src={contact.avatar} size={54} />
                  <div className="yam-presence-pin">
                    <PresenceDot isOnline={contact.username === peer ? isOnline : contact.isOnline} />
                  </div>
                </div>
                <div className="yam-contact-copy">
                  <strong>{contact.username}</strong>
                  <span>{contact.username === peer ? (isTyping ? 'يكتب الآن…' : (peerDetails.preview || contact.preview)) : contact.statusText}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="yam-self-card">
            <div className="yam-avatar-wrap">
              <Avatar name={currentUser || 'يوسف محمد'} size={52} />
              <div className="yam-presence-pin"><PresenceDot isOnline /></div>
            </div>
            <div className="yam-contact-copy">
              <strong>{currentUser || 'يوسف محمد'}</strong>
              <span>متصل الآن</span>
            </div>
            <button type="button" className="yam-icon-action subtle">⋮</button>
          </div>
        </aside>

        <main className="yam-chat-stage">
          <div className="yam-stage-top-search">
            <span>⌕</span>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="بحث في الرسائل أو الأشخاص..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery ? <button type="button" className="yam-clear-search" onClick={() => setSearchQuery('')}>×</button> : null}
          </div>

          <header className="yam-chat-stage-header">
            <div className="yam-chat-stage-peer">
              <div className="yam-avatar-wrap">
                <Avatar name={peer} src={peerDetails.avatar} size={56} ring />
                <div className="yam-presence-pin"><PresenceDot isOnline={isOnline} size={16} borderColor="#050816" /></div>
              </div>
              <div className="yam-chat-stage-peer-copy">
                <strong>{peer}</strong>
                <span>
                  {isRecording ? 'يسجّل رسالة صوتية…' : isTyping ? 'يكتب الآن…' : formatLastSeen(lastSeen, isOnline)}
                </span>
              </div>
            </div>

            <div className="yam-chat-stage-actions">
              <button type="button" className="yam-stage-icon" onClick={() => setCallMode('voice')}>📞</button>
              <button type="button" className="yam-stage-icon" onClick={() => setCallMode('video')}>🎥</button>
              <button type="button" className="yam-stage-icon" onClick={() => syncChatState()}>⟳</button>
              <button type="button" className="yam-stage-icon" onClick={() => setShowDetailsDrawer((prev) => !prev)}>⋮</button>
            </div>
          </header>

          {showDetailsDrawer ? (
            <div className="yam-chat-details-drawer">
              <div className="yam-details-grid">
                <button type="button" className="yam-detail-action" onClick={handleMuteConversation}>{isMutedConversation ? 'إلغاء الكتم' : 'كتم المحادثة'}</button>
                <button type="button" className="yam-detail-action" onClick={handlePinConversation}>{isPinnedConversation ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}</button>
                <button type="button" className="yam-detail-action" onClick={spawnHeart}>تفاعل سريع</button>
                <button type="button" className="yam-detail-action danger" onClick={handleBlock}>{blockStatus.blocked_by_me ? 'رفع الحظر' : 'حظر المستخدم'}</button>
              </div>
            </div>
          ) : null}

          <div className="flying-hearts-layer" aria-hidden>
            {flyingHearts.map((id) => <span key={id} className="flying-heart">💜</span>)}
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

          {(searchQuery.trim() || threadRootId) ? (
            <div className="yam-search-summary">
              <span>نتائج البحث: {messageResultsCount}</span>
              {threadRootId && activeThreadRoot ? (
                <span>
                  السلسلة: {activeThreadRoot.content || activeThreadRoot.message || 'رسالة'}
                  <button type="button" className="inline-clear" onClick={() => setThreadRootId('')}>إنهاء العرض</button>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="yam-inline-status-row">
            <span className={`status-chip ${isTyping ? 'active' : ''}`}>{isTyping ? 'Typing indicator' : 'Typing idle'}</span>
            <span className="status-chip">Read receipts مفعلة</span>
            <span className="status-chip">آخر مزامنة {lastSyncedAt ? formatMessageTime(lastSyncedAt) : 'الآن'}</span>
          </div>

          <div className="yam-messages-area">
            {threadsLoading && !peerDetails.username ? <div className="yam-empty-state">جارٍ تجهيز بيانات المحادثة...</div> : null}
            {msgLoading ? <div className="yam-empty-state">جارٍ تحميل الرسائل...</div> : null}
            {!msgLoading && !messages.length ? (
              <div className="yam-empty-state rich">
                <strong>ابدأ المحادثة مع {peer}</strong>
                <span>تم إضافة typing indicator و read receipts و reactions و reply threads و voice messages و media preview و status sync.</span>
              </div>
            ) : null}
            {!msgLoading && messages.length > 0 && !visibleMessages.length ? (
              <div className="yam-empty-state">لا توجد رسائل تطابق عبارة البحث أو السلسلة المحددة.</div>
            ) : null}

            {visibleMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.sender === currentUser}
                onReply={(message) => setReplyTo(message)}
                onDelete={handleDelete}
                onPreview={(payload) => setPreviewItem(payload)}
                onReact={handleToggleReaction}
                reactions={reactionMap?.[msg.id] || {}}
                threadReplyCount={getThreadReplyCount(messages, msg.id)}
                onOpenThread={(rootId) => setThreadRootId(String(rootId || ''))}
                highlightQuery={searchQuery}
              />
            ))}
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
              <Avatar name={peer} src={peerDetails.avatar} size={120} ring />
              <div className="yam-presence-pin"><PresenceDot isOnline={isOnline} size={18} borderColor="#090d1d" /></div>
            </div>
            <div className="yam-side-profile-copy">
              <h2>{peer}</h2>
              <p>{isRecording ? 'يسجّل الآن' : formatLastSeen(lastSeen, isOnline)}</p>
            </div>
          </div>

          <div className="yam-quick-actions">
            {[
              { key: 'call', label: 'اتصال', icon: '📞', action: () => setCallMode('voice') },
              { key: 'video', label: 'فيديو', icon: '🎥', action: () => setCallMode('video') },
              { key: 'search', label: 'بحث', icon: '⌕', action: () => searchInputRef.current?.focus() },
              { key: 'sync', label: 'مزامنة', icon: '⟳', action: () => syncChatState() },
            ].map((item) => (
              <button key={item.key} type="button" className="yam-quick-card" onClick={item.action}>
                <span>{item.icon}</span>
                <small>{item.label}</small>
              </button>
            ))}
          </div>

          <div className="yam-info-card">
            <div className="yam-info-title">معلومات</div>
            <div className="yam-info-row"><span>اسم المستخدم</span><strong>{peerDetails.handle}</strong></div>
            <div className="yam-info-row"><span>البريد الإلكتروني</span><strong>{peerDetails.email}</strong></div>
            <div className="yam-info-row"><span>الهاتف</span><strong>{peerDetails.phone}</strong></div>
          </div>

          <div className="yam-info-card compact">
            {[
              { label: 'الوسائط المشتركة', icon: '🖼️', count: mediaMessages.length },
              { label: 'الملفات', icon: '📁', count: fileMessages.length },
              { label: 'الروابط', icon: '🔗', count: messages.filter((item) => /https?:\/\//.test(item.content || item.message || '')).length },
              { label: 'سلاسل الردود', icon: '🧵', count: messages.filter((item) => item.reply_to?.id).length },
            ].map((item) => (
              <button key={item.label} type="button" className="yam-list-link" onClick={() => setShowDetailsDrawer(true)}>
                <div>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <strong>{item.count}</strong>
              </button>
            ))}
          </div>

          <div className="yam-media-grid">
            {(mediaMessages.length ? mediaMessages.slice(-6) : peerDetails.sharedMedia).map((item, index) => {
              const mediaUrl = item?.media_url || '';
              const tone = item?.tone || ['purple', 'blue', 'pink', 'teal'][index % 4];
              return mediaUrl ? (
                isVideoMessage(item) ? (
                  <button key={item.id || mediaUrl} type="button" className="media-tile-btn" onClick={() => setPreviewItem({ type: 'video', url: mediaUrl, title: extractFileName(item) })}>
                    <video src={mediaUrl} className="yam-media-thumb" preload="metadata" />
                  </button>
                ) : (
                  <button key={item.id || mediaUrl} type="button" className="media-tile-btn" onClick={() => setPreviewItem({ type: 'image', url: mediaUrl, title: extractFileName(item) })}>
                    <img src={mediaUrl} alt="media" className="yam-media-thumb" loading="lazy" decoding="async" />
                  </button>
                )
              ) : (
                <div key={item.id || `${tone}-${index}`} className={`yam-media-thumb placeholder ${tone}`}>{item.label || 'وسائط'}</div>
              );
            })}
          </div>

          <div className="yam-panel-actions">
            <button type="button" className="yam-secondary-btn" onClick={handleMuteConversation}>{isMutedConversation ? 'إلغاء كتم المحادثة' : 'كتم المحادثة'}</button>
            <button type="button" className="yam-secondary-btn" onClick={handleArchiveConversation}>أرشفة المحادثة</button>
            <button type="button" className="yam-reaction-btn" onClick={spawnHeart}>إرسال ❤️ سريع</button>
            <button type="button" className="yam-danger-btn" onClick={handleBlock}>{blockStatus.blocked_by_me ? 'رفع الحظر' : 'حظر المستخدم'}</button>
          </div>
        </aside>

        <MediaViewerModal item={previewItem} onClose={() => setPreviewItem(null)} />

        <style>{`
          .yam-conversation-screen {
            min-height: 100vh;
            height: 100vh;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.15), transparent 26%),
              radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 22%),
              #040714;
            display: grid;
            grid-template-columns: 300px minmax(0, 1fr) 320px;
            overflow: hidden;
            color: white;
          }
          .yam-chat-sidebar,
          .yam-side-profile-panel {
            background: linear-gradient(180deg, rgba(7, 10, 24, 0.98), rgba(5, 8, 18, 0.98));
            border-color: rgba(255,255,255,0.05);
            border-style: solid;
            min-width: 0;
          }
          .yam-chat-sidebar { border-inline-end-width: 1px; display: flex; flex-direction: column; padding: 22px 16px 18px; gap: 16px; }
          .yam-side-profile-panel { border-inline-start-width: 1px; display: flex; flex-direction: column; gap: 16px; padding: 28px 20px 20px; overflow: auto; }
          .yam-sidebar-brand, .yam-sidebar-head, .yam-self-card, .yam-chat-stage-header, .yam-chat-stage-peer, .yam-chat-stage-actions, .yam-details-grid, .yam-panel-actions { display: flex; align-items: center; }
          .yam-sidebar-brand { gap: 14px; padding: 0 6px 12px; }
          .yam-brand-mark { width: 42px; height: 42px; border-radius: 16px; display: grid; place-items: center; font-weight: 900; font-size: 20px; color: white; background: linear-gradient(135deg, #8b5cf6, #4f46e5); box-shadow: 0 18px 30px rgba(91, 33, 182, 0.35); }
          .yam-brand-name { font-size: 20px; font-weight: 800; letter-spacing: 0.06em; }
          .yam-primary-nav { display: grid; gap: 8px; }
          .yam-nav-item { width: 100%; display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 16px; border: 1px solid transparent; background: rgba(255,255,255,0.03); color: white; cursor: pointer; }
          .yam-nav-item.active, .yam-nav-item:hover { border-color: rgba(139,92,246,0.28); background: rgba(139,92,246,0.12); }
          .yam-sidebar-head { justify-content: space-between; color: #cbd5f5; }
          .yam-icon-action, .yam-stage-icon { border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: white; border-radius: 14px; padding: 10px 12px; cursor: pointer; }
          .yam-contact-list { display: grid; gap: 10px; overflow: auto; }
          .yam-contact-row, .yam-self-card { display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.03); color: white; }
          .yam-contact-row.active { border-color: rgba(139,92,246,0.36); background: rgba(139,92,246,0.12); }
          .yam-contact-copy { display: grid; gap: 3px; text-align: right; flex: 1; min-width: 0; }
          .yam-contact-copy strong, .yam-contact-copy span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .yam-contact-copy span { color: #94a3b8; font-size: 12px; }
          .yam-avatar-wrap { position: relative; }
          .yam-avatar-wrap.large { width: fit-content; margin: 0 auto; }
          .yam-presence-pin { position: absolute; bottom: -2px; inset-inline-end: -2px; }
          .yam-chat-stage { display: grid; grid-template-rows: auto auto auto auto 1fr auto; gap: 14px; padding: 22px; min-width: 0; }
          .yam-stage-top-search { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 18px; background: rgba(9,12,26,0.82); border: 1px solid rgba(255,255,255,0.06); }
          .yam-stage-top-search input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 14px; }
          .yam-clear-search, .inline-clear, .media-preview-btn, .media-tile-btn { background: transparent; border: none; color: inherit; cursor: pointer; padding: 0; }
          .yam-chat-stage-header { justify-content: space-between; gap: 12px; border-radius: 24px; padding: 18px 20px; background: rgba(9,12,26,0.78); border: 1px solid rgba(255,255,255,0.05); }
          .yam-chat-stage-peer { gap: 14px; min-width: 0; }
          .yam-chat-stage-peer-copy { display: grid; gap: 4px; }
          .yam-chat-stage-peer-copy span { color: #94a3b8; font-size: 13px; }
          .yam-chat-stage-actions { gap: 10px; flex-wrap: wrap; }
          .yam-chat-details-drawer { border-radius: 20px; padding: 14px; background: rgba(9,12,26,0.75); border: 1px solid rgba(255,255,255,0.05); }
          .yam-details-grid { gap: 10px; flex-wrap: wrap; }
          .yam-detail-action { padding: 10px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: white; cursor: pointer; }
          .yam-detail-action.danger { color: #fecaca; border-color: rgba(248,113,113,0.3); }
          .yam-inline-status-row, .yam-search-summary { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; color: #cbd5e1; }
          .yam-search-summary { justify-content: space-between; padding: 0 8px; font-size: 13px; }
          .status-chip, .thread-chip, .reaction-pill {
            display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.72); color: #cbd5e1; font-size: 12px;
          }
          .status-chip.active { color: #bbf7d0; border-color: rgba(34,197,94,0.3); }
          .yam-block-banner { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 12px 16px; border-radius: 16px; background: rgba(251,191,36,0.14); color: #fde68a; }
          .yam-block-banner.blocked { background: rgba(248,113,113,0.16); color: #fecaca; }
          .yam-messages-area {
            min-height: 0; overflow: auto; padding: 18px; border-radius: 24px; background: rgba(9,12,26,0.62); border: 1px solid rgba(255,255,255,0.05);
            display: grid; align-content: start; gap: 14px;
          }
          .yam-empty-state { color: #94a3b8; text-align: center; padding: 24px; }
          .yam-empty-state.rich { display: grid; gap: 8px; }
          .yam-bubble-wrap { display: flex; gap: 10px; max-width: 86%; }
          .yam-bubble-wrap.me { justify-self: end; }
          .yam-bubble-wrap.them { justify-self: start; }
          .yam-bubble { border-radius: 22px; padding: 14px; background: rgba(15,23,42,0.92); border: 1px solid rgba(255,255,255,0.06); display: grid; gap: 10px; }
          .bubble-me { background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.16)); }
          .search-hit { box-shadow: 0 0 0 1px rgba(96,165,250,0.35), 0 0 24px rgba(59,130,246,0.12); }
          .bubble-text { line-height: 1.7; white-space: pre-wrap; }
          .bubble-deleted { color: #94a3b8; font-style: italic; }
          .bubble-reply-banner {
            text-align: right; padding: 10px 12px; border-radius: 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.06);
            display: grid; gap: 4px; color: #dbeafe;
          }
          .bubble-meta, .bubble-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
          .bubble-meta { justify-content: space-between; color: #cbd5e1; font-size: 12px; }
          .bubble-actions--rich button {
            border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); color: white; border-radius: 999px; padding: 8px 10px; cursor: pointer; font-size: 12px;
          }
          .yam-file-card { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 18px; color: white; background: rgba(255,255,255,0.04); text-decoration: none; }
          .yam-file-copy { display: grid; }
          .yam-file-copy small { color: #94a3b8; }
          .reaction-stack { display: flex; gap: 8px; flex-wrap: wrap; }
          .yam-chat-input-wrap { border-radius: 24px; padding: 14px; background: rgba(9,12,26,0.78); border: 1px solid rgba(255,255,255,0.05); }
          .yam-side-profile-top { display: grid; gap: 14px; text-align: center; }
          .yam-side-profile-copy h2 { margin: 0; }
          .yam-side-profile-copy p { margin: 0; color: #94a3b8; }
          .yam-quick-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
          .yam-quick-card, .yam-list-link, .yam-secondary-btn, .yam-reaction-btn, .yam-danger-btn {
            border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: white; border-radius: 18px; cursor: pointer;
          }
          .yam-quick-card { padding: 12px 10px; display: grid; gap: 6px; place-items: center; }
          .yam-info-card { padding: 16px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); display: grid; gap: 12px; }
          .yam-info-title { font-weight: 800; }
          .yam-info-row, .yam-list-link { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
          .yam-info-row span { color: #94a3b8; }
          .yam-info-card.compact { gap: 10px; }
          .yam-list-link { padding: 12px; }
          .yam-list-link > div { display: flex; gap: 8px; align-items: center; }
          .yam-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .yam-media-thumb { width: 100%; aspect-ratio: 1 / 1; border-radius: 18px; object-fit: cover; background: rgba(255,255,255,0.04); display: block; }
          .yam-media-thumb.placeholder { display: grid; place-items: center; font-weight: 700; }
          .yam-media-thumb.placeholder.purple { background: linear-gradient(135deg, rgba(124,58,237,0.38), rgba(76,29,149,0.52)); }
          .yam-media-thumb.placeholder.blue { background: linear-gradient(135deg, rgba(59,130,246,0.38), rgba(30,64,175,0.52)); }
          .yam-media-thumb.placeholder.pink { background: linear-gradient(135deg, rgba(236,72,153,0.38), rgba(157,23,77,0.52)); }
          .yam-media-thumb.placeholder.teal { background: linear-gradient(135deg, rgba(20,184,166,0.38), rgba(15,118,110,0.52)); }
          .yam-panel-actions { gap: 10px; flex-wrap: wrap; }
          .yam-secondary-btn, .yam-reaction-btn, .yam-danger-btn { padding: 12px 14px; }
          .yam-reaction-btn { background: rgba(239,68,68,0.12); }
          .yam-danger-btn { background: rgba(248,113,113,0.12); color: #fecaca; }
          .flying-hearts-layer { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
          .flying-heart { position: absolute; bottom: 120px; left: 50%; animation: float-heart 1.8s ease-out forwards; }
          @keyframes float-heart {
            0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(calc(-50% + 80px), -220px) scale(1.4); opacity: 0; }
          }
          @media (max-width: 1200px) {
            .yam-conversation-screen { grid-template-columns: 280px minmax(0, 1fr); }
            .yam-side-profile-panel { display: none; }
          }
          @media (max-width: 900px) {
            .yam-conversation-screen { grid-template-columns: 1fr; }
            .yam-chat-sidebar { display: none; }
            .yam-chat-stage { padding: 14px; }
            .yam-chat-stage-header { padding: 14px; }
            .yam-bubble-wrap { max-width: 100%; }
          }
        `}</style>
      </section>
    </MainLayout>
  );
}
