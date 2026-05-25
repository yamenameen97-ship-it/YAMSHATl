import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import CallExperience from '../components/chat/CallExperience.jsx';
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
import { MESSAGE_LIFECYCLE, normalizeMessageStatus, withLifecycle } from '../features/chat/messageLifecycle.js';
import { getChatPreferences, toggleChatPreference } from '../utils/chatPreferences.js';
import {
  avatarGradient,
  formatLastSeen,
  initialsFromName,
  statusColor,
  statusTicks,
} from '../components/yamshat/YamshatDesign.js';
import { CHAT_NAV_ITEMS, buildContacts, getContactDetails } from '../features/chat/chatShellFixtures.js';

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
    <img src={src} alt={name} style={style} />
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

function dedupeMessages(messages = []) {
  const merged = new Map();
  (Array.isArray(messages) ? messages : []).forEach((entry) => {
    const message = normalizeChatMessage(entry);
    const key = String(message?.id || message?.client_id || `${message?.sender}:${message?.receiver}:${message?.created_at}`);
    const previous = merged.get(key);
    merged.set(key, previous ? normalizeChatMessage({ ...previous, ...message, status: normalizeMessageStatus(message?.status || previous?.status) }) : message);
  });
  return Array.from(merged.values()).sort((left, right) => new Date(left?.created_at || 0).getTime() - new Date(right?.created_at || 0).getTime());
}

function MessageBubble({ message, isMe, onReply, onDelete, highlightQuery = '' }) {
  const hasMedia = Boolean(message.media_url);
  const isVoice = message.type === 'voice';
  const isImage = message.type === 'image' || (hasMedia && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(message.media_url || ''));
  const isVideo = message.type === 'video' || (hasMedia && /\.(mp4|webm|mov|m4v)$/i.test(message.media_url || ''));
  const isFile = message.type === 'file' || (hasMedia && !isVoice && !isImage && !isVideo);
  const content = message.content || message.message || '';
  const fileName = extractFileName(message);
  const shouldGlow = highlightQuery.trim() && messageMatchesSearch(message, highlightQuery);

  return (
    <div className={`yam-bubble-wrap ${isMe ? 'me' : 'them'}`}>
      {!isMe ? (
        <div className="yam-bubble-avatar-slot">
          <Avatar name={message.sender} size={36} />
        </div>
      ) : null}

      <div className={`yam-bubble ${isMe ? 'bubble-me' : 'bubble-them'} ${shouldGlow ? 'search-hit' : ''}`}>
        {message.reply_to ? (
          <div className="bubble-reply-banner">
            <strong>↩ الرد على</strong>
            <span>{message.reply_to?.content || '...'}</span>
          </div>
        ) : null}

        {isVoice && message.media_url ? (
          <div className="yam-audio-wrap">
            <audio src={message.media_url} controls style={{ width: '100%' }} />
          </div>
        ) : null}

        {isImage && message.media_url ? (
          <img src={message.media_url} alt="media" style={{ maxWidth: 320, width: '100%', borderRadius: 18, display: 'block' }} />
        ) : null}

        {isVideo && message.media_url ? (
          <video src={message.media_url} controls style={{ maxWidth: 320, width: '100%', borderRadius: 18, display: 'block' }} />
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

        <div className="bubble-meta">
          <span className="bubble-time">{formatMessageTime(message.created_at)}</span>
          {isMe ? (
            <span style={{ color: statusColor(message.status), fontSize: 13, fontWeight: 700 }}>
              {statusTicks(message.status)}
            </span>
          ) : null}
        </div>

        <div className="bubble-actions">
          <button type="button" onClick={() => onReply(message)}>↩</button>
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
  const initialChatPrefs = useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = useState(initialChatPrefs.muted.has(peer));
  const [isPinnedConversation, setIsPinnedConversation] = useState(initialChatPrefs.pinned.has(peer));
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const queueAction = useAppStore((state) => state.queueAction);

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

  const loadMessages = useCallback(async () => {
    if (!peer) return;
    setMsgLoading(true);
    try {
      const { data } = await getMessages(peer, 60);
      setMessages(dedupeMessages(data?.items || []));
      await markMessagesSeen(peer);
    } catch {
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحميل الرسائل' });
    } finally {
      setMsgLoading(false);
    }
  }, [peer, pushToast]);

  useEffect(() => {
    if (!peer) return;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
    loadMessages();
    setShowDetailsDrawer(false);
    setActivePeer(peer);

    getPresence(peer)
      .then(({ data }) => {
        setPresence((prev) => ({ ...prev, [peer]: { ...(prev[peer] || {}), ...(data || {}) } }));
      })
      .catch(() => {});

    getBlockStatus(peer)
      .then(({ data }) => {
        setBlockStatus(data || {});
      })
      .catch(() => {});

    return () => setActivePeer(null);
  }, [loadMessages, peer, setActivePeer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    socketManager.connect();
    socketManager.emit('register_user', { user: currentUser }, { skipSignature: true });
    if (peer) {
      socketManager.emit('join_chat', { peer });
      socketManager.emit('sync_chat_state', { peer });
    }

    const onMsg = (msg) => {
      const participants = [msg?.sender, msg?.receiver];
      if (!participants.includes(currentUser)) return;
      setMessages((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === msg.id || (item.client_id && item.client_id === msg.client_id));
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = normalizeChatMessage({ ...next[existingIndex], ...msg });
          return dedupeMessages(next);
        }
        return dedupeMessages([...prev, normalizeChatMessage(msg)]);
      });
      setThreads((prev) => prev.map((item) => item.username === msg.sender || item.username === msg.receiver
        ? { ...item, last_message: msg.content || msg.message, created_at: msg.created_at }
        : item));
      if (msg.sender === peer) markMessagesSeen(peer).catch(() => {});
    };

    const onDelivered = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? withLifecycle(item, MESSAGE_LIFECYCLE.DELIVERED) : item));
    };

    const onSeen = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? withLifecycle(item, MESSAGE_LIFECYCLE.SEEN) : item));
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

    socketManager.on('new_private_message', onMsg);
    socketManager.on('messages_delivered', onDelivered);
    socketManager.on('messages_seen', onSeen);
    socketManager.on('presence_update', onPresence);
    socketManager.on('typing_update', onTyping);

    const onDeleted = (payload) => {
      if (!payload?.id) return;
      setMessages((prev) => prev.map((item) => String(item.id) === String(payload.id) ? withLifecycle({ ...item, ...payload, deleted: true }, MESSAGE_LIFECYCLE.DELETED) : item));
    };

    socketManager.on('message_deleted', onDeleted);

    return () => {
      if (peer) socketManager.emit('leave_chat', { peer });
      socketManager.off('new_private_message', onMsg);
      socketManager.off('messages_delivered', onDelivered);
      socketManager.off('messages_seen', onSeen);
      socketManager.off('presence_update', onPresence);
      socketManager.off('typing_update', onTyping);
      socketManager.off('message_deleted', onDeleted);
    };
  }, [currentUser, peer]);

  useEffect(() => {
    const handleQueuedSent = (event) => {
      const detail = event?.detail || {};
      const serverMessage = detail?.response || {};
      setMessages((prev) => dedupeMessages(prev.map((item) => (
        String(item.client_id || item.id) === String(detail.client_id || detail.queuedId)
          ? normalizeChatMessage({ ...item, ...serverMessage, status: serverMessage?.status || MESSAGE_LIFECYCLE.SENT })
          : item
      ))));
    };

    const handleQueuedFailed = (event) => {
      const detail = event?.detail || {};
      setMessages((prev) => prev.map((item) => (
        String(item.client_id || item.id) === String(detail.client_id || detail.queuedId)
          ? withLifecycle({ ...item, queue_error: detail.error || 'فشل دائم في مزامنة الرسالة' }, detail.permanent ? MESSAGE_LIFECYCLE.FAILED_PERMANENT : MESSAGE_LIFECYCLE.FAILED)
          : item
      )));
    };

    window.addEventListener('yamshat:queued-message-sent', handleQueuedSent);
    window.addEventListener('yamshat:queued-message-failed', handleQueuedFailed);
    return () => {
      window.removeEventListener('yamshat:queued-message-sent', handleQueuedSent);
      window.removeEventListener('yamshat:queued-message-failed', handleQueuedFailed);
    };
  }, []);

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

    setMessages((prev) => dedupeMessages([...prev, tempMsg]));
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
      setMessages((prev) => dedupeMessages(prev.map((item) => (
        item.id === tempId || item.client_id === tempId
          ? normalizeChatMessage({ ...item, ...(data || {}), status: (data || {}).status || MESSAGE_LIFECYCLE.SENT })
          : item
      ))));
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
        setMessages((prev) => prev.map((item) => (
          item.id === tempId || item.client_id === tempId
            ? withLifecycle(item, MESSAGE_LIFECYCLE.RETRYING, { queuedAt: new Date().toISOString() })
            : item
        )));
        pushToast({ type: 'warning', title: 'تعذر الإرسال الآن', description: 'تم نقل الرسالة إلى طابور المزامنة.' });
        return;
      }

      setMessages((prev) => prev.map((item) => (
        item.id === tempId || item.client_id === tempId
          ? withLifecycle(item, MESSAGE_LIFECYCLE.FAILED_PERMANENT, { error: error?.response?.data?.detail || 'فشل إرسال الرسالة' })
          : item
      )));
      pushToast({ type: 'error', title: 'خطأ', description: error?.response?.data?.detail || 'فشل إرسال الرسالة' });
    }
  };

  const handleDelete = async (msgId, deleteForEveryone = false) => {

    try {
      await deleteMessageApi(msgId, { delete_for_everyone: deleteForEveryone });
      setMessages((prev) => prev.map((item) => item.id === msgId ? withLifecycle({ ...item, deleted: true, deleted_for_everyone: deleteForEveryone, content: '', message: '' }, MESSAGE_LIFECYCLE.DELETED) : item));
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
  const lastSeen = peerPresence.last_seen;
  const mediaMessages = useMemo(() => messages.filter((item) => item.media_url), [messages]);
  const fileMessages = useMemo(() => messages.filter((item) => item.type === 'file' || item.type === 'voice'), [messages]);
  const visibleMessages = useMemo(
    () => messages.filter((item) => messageMatchesSearch(item, searchQuery)),
    [messages, searchQuery],
  );
  const messageResultsCount = searchQuery.trim() ? visibleMessages.length : messages.length;

  if (!peer) {
    return <Navigate to="/inbox" replace />;
  }

  return (
    <MainLayout hideNav lockScroll>
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
            <button type="button" className="yam-icon-action">＋</button>
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
                  <span>{contact.username === peer ? (isTyping ? 'يكتب الآن...' : (peerDetails.preview || contact.preview)) : contact.statusText}</span>
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
              placeholder="بحث في المحادثات..."
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
                <span>{isTyping ? 'يكتب الآن...' : formatLastSeen(lastSeen, isOnline)}</span>
              </div>
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

          <div className="yam-messages-area">
            {threadsLoading && !peerDetails.username ? <div className="yam-empty-state">جارٍ تجهيز بيانات المحادثة...</div> : null}
            {msgLoading ? <div className="yam-empty-state">جارٍ تحميل الرسائل...</div> : null}
            {!msgLoading && !messages.length ? (
              <div className="yam-empty-state rich">
                <strong>ابدأ المحادثة مع {peer}</strong>
                <span>المكالمات الصوتية، الفيديو، الرسائل الصوتية، المرفقات، والبحث داخل المحادثة كلها متاحة من هذه الشاشة.</span>
              </div>
            ) : null}
            {!msgLoading && messages.length > 0 && !visibleMessages.length ? (
              <div className="yam-empty-state">لا توجد رسائل تطابق عبارة البحث.</div>
            ) : null}

            {visibleMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.sender === currentUser}
                onReply={(message) => setReplyTo(message)}
                onDelete={handleDelete}
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
              { label: 'المحادثات المثبتة', icon: '📌', count: isPinnedConversation ? 1 : 0 },
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
            {(mediaMessages.length ? mediaMessages.slice(-4) : peerDetails.sharedMedia).map((item, index) => {
              const imageUrl = item?.media_url || '';
              const tone = item?.tone || ['purple', 'blue', 'pink', 'teal'][index % 4];
              return imageUrl ? (
                <img key={item.id || imageUrl} src={imageUrl} alt="media" className="yam-media-thumb" />
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

          .yam-chat-sidebar {
            border-inline-end-width: 1px;
            display: flex;
            flex-direction: column;
            padding: 22px 16px 18px;
            gap: 16px;
            overflow: auto;
          }

          .yam-side-profile-panel {
            border-inline-start-width: 1px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 28px 20px 20px;
            overflow: auto;
          }

          .yam-sidebar-brand,
          .yam-sidebar-head,
          .yam-self-card,
          .yam-chat-stage-header,
          .yam-chat-stage-peer,
          .yam-chat-stage-actions,
          .yam-details-grid,
          .yam-info-card.compact,
          .yam-panel-actions {
            display: flex;
            align-items: center;
          }

          .yam-sidebar-brand {
            gap: 14px;
            padding: 0 6px 12px;
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
            box-shadow: 0 18px 30px rgba(91, 33, 182, 0.35);
          }

          .yam-brand-name {
            letter-spacing: 0.34em;
            font-size: 20px;
            font-weight: 900;
          }

          .yam-primary-nav {
            display: grid;
            gap: 10px;
          }

          .yam-nav-item {
            min-height: 56px;
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
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(76, 29, 149, 0.18);
          }

          .yam-nav-icon,
          .yam-icon-action,
          .yam-stage-icon {
            display: inline-grid;
            place-items: center;
          }

          .yam-nav-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            flex-shrink: 0;
          }

          .yam-sidebar-head {
            justify-content: space-between;
            padding: 0 6px;
            font-weight: 900;
          }

          .yam-icon-action,
          .yam-stage-icon,
          .yam-clear-search {
            width: 40px;
            height: 40px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: white;
          }

          .yam-icon-action.subtle {
            width: 36px;
            height: 36px;
          }

          .yam-contact-list {
            flex: 1;
            min-height: 0;
            overflow: auto;
            display: grid;
            gap: 10px;
          }

          .yam-contact-row {
            padding: 10px 12px;
            border-radius: 18px;
            border: 1px solid transparent;
            background: transparent;
            color: white;
            display: flex;
            align-items: center;
            gap: 12px;
            text-align: right;
          }

          .yam-contact-row.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(124,58,237,0.1));
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

          .yam-contact-copy,
          .yam-chat-stage-peer-copy,
          .yam-side-profile-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
          }

          .yam-contact-copy strong,
          .yam-chat-stage-peer-copy strong {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-contact-copy span,
          .yam-chat-stage-peer-copy span,
          .yam-side-profile-copy p {
            color: #94a3b8;
            font-size: 13px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-self-card {
            margin-top: auto;
            gap: 12px;
            padding: 14px 10px 0;
            border-top: 1px solid rgba(255,255,255,0.05);
          }

          .yam-chat-stage {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            background: #040714;
            padding: 18px 22px 0;
            gap: 14px;
            overflow: hidden;
          }

          .yam-stage-top-search {
            min-height: 64px;
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(10, 15, 30, 0.92);
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 18px;
            color: #94a3b8;
            flex-shrink: 0;
            position: sticky;
            top: 0;
            z-index: 6;
          }

          .yam-stage-top-search input {
            flex: 1;
            border: none;
            background: transparent;
            color: white;
            outline: none;
            font-size: 16px;
          }

          .yam-clear-search {
            border: none;
            background: rgba(124,58,237,0.18);
          }

          .yam-chat-stage-header {
            justify-content: space-between;
            gap: 16px;
            padding: 0 4px 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            flex-shrink: 0;
            position: sticky;
            top: 78px;
            z-index: 5;
            background: #040714;
          }

          .yam-chat-stage-peer {
            gap: 12px;
            min-width: 0;
          }

          .yam-chat-stage-peer-copy strong {
            font-size: 20px;
            font-weight: 900;
          }

          .yam-chat-stage-actions {
            gap: 10px;
          }

          .yam-stage-icon:hover,
          .yam-stage-icon:focus-visible {
            background: rgba(124,58,237,0.18);
            border-color: rgba(167,139,250,0.24);
          }

          .yam-chat-details-drawer {
            padding: 2px 4px 12px;
            flex-shrink: 0;
          }

          .yam-details-grid {
            gap: 10px;
            flex-wrap: wrap;
          }

          .yam-detail-action {
            min-height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.04);
            color: white;
            font-weight: 800;
            padding: 0 14px;
          }

          .yam-detail-action.danger {
            background: rgba(239,68,68,0.1);
            color: #fca5a5;
            border-color: rgba(239,68,68,0.2);
          }

          .yam-search-summary,
          .yam-block-banner {
            flex-shrink: 0;
            text-align: center;
            border-radius: 16px;
            padding: 10px 14px;
            font-size: 13px;
          }

          .yam-search-summary {
            background: rgba(124,58,237,0.12);
            color: #d8b4fe;
          }

          .yam-block-banner {
            background: rgba(239,68,68,0.12);
            color: #fca5a5;
          }

          .yam-block-banner button {
            background: none;
            border: none;
            color: #fdba74;
            font-weight: 800;
            margin-inline-start: 8px;
          }

          .yam-block-banner.blocked {
            background: rgba(127,29,29,0.24);
          }

          .yam-messages-area {
            flex: 1;
            min-height: 0;
            overflow: auto;
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 4px 6px 18px;
          }

          .yam-empty-state {
            color: #94a3b8;
            font-size: 14px;
            padding: 24px;
            text-align: center;
          }

          .yam-empty-state.rich {
            display: grid;
            gap: 8px;
            align-self: center;
            max-width: 480px;
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.03);
            margin-top: 32px;
          }

          .yam-bubble-wrap {
            display: flex;
            align-items: flex-end;
            gap: 10px;
          }

          .yam-bubble-wrap.me {
            flex-direction: row-reverse;
          }

          .yam-bubble-avatar-slot {
            width: 38px;
            flex-shrink: 0;
          }

          .yam-bubble {
            max-width: min(72%, 560px);
            padding: 14px 16px;
            border-radius: 24px;
            position: relative;
            line-height: 1.75;
            display: grid;
            gap: 10px;
          }

          .yam-bubble.search-hit {
            box-shadow: 0 0 0 1px rgba(192,132,252,0.3), 0 0 0 10px rgba(124,58,237,0.08);
          }

          .bubble-me {
            background: linear-gradient(135deg, #6d28d9, #4f46e5);
            color: white;
            border-bottom-right-radius: 6px;
          }

          .bubble-them {
            background: rgba(24, 31, 48, 0.98);
            color: #e2e8f0;
            border: 1px solid rgba(255,255,255,0.04);
            border-bottom-left-radius: 6px;
          }

          .bubble-reply-banner {
            font-size: 12px;
            padding: 8px 10px;
            border-radius: 12px;
            background: rgba(255,255,255,0.08);
            display: grid;
            gap: 4px;
            border-inline-start: 3px solid rgba(255,255,255,0.4);
          }

          .yam-audio-wrap {
            width: min(320px, 100%);
          }

          .yam-file-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 18px;
            background: rgba(255,255,255,0.08);
            color: inherit;
            text-decoration: none;
          }

          .yam-file-icon {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.12);
            flex-shrink: 0;
          }

          .yam-file-copy {
            min-width: 0;
            display: grid;
            gap: 3px;
          }

          .yam-file-copy strong,
          .yam-file-copy small {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-file-copy small {
            opacity: 0.72;
          }

          .bubble-text {
            font-size: 14px;
            word-break: break-word;
          }

          .bubble-deleted {
            font-size: 13px;
            opacity: 0.6;
            font-style: italic;
          }

          .bubble-meta {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
          }

          .bubble-time {
            font-size: 11px;
            opacity: 0.7;
          }

          .bubble-actions {
            display: none;
            gap: 6px;
            position: absolute;
            top: -32px;
            inset-inline-end: 0;
            background: rgba(15,23,42,0.92);
            border-radius: 12px;
            padding: 4px 8px;
            border: 1px solid rgba(255,255,255,0.08);
          }

          .yam-bubble:hover .bubble-actions {
            display: flex;
          }

          .bubble-actions button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 14px;
            padding: 2px 4px;
          }

          .yam-chat-input-wrap {
            flex-shrink: 0;
            padding: 0 0 18px;
          }

          .flying-hearts-layer {
            position: absolute;
            bottom: 120px;
            left: 22px;
            pointer-events: none;
            z-index: 6;
          }

          .flying-heart {
            position: absolute;
            font-size: 28px;
            animation: fly-up 1.8s ease-out forwards;
            left: 0;
          }

          @keyframes fly-up {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            60% { transform: translateY(-120px) scale(1.4); opacity: 0.9; }
            100% { transform: translateY(-240px) scale(0.5); opacity: 0; }
          }

          .yam-call-overlay {
            position: absolute;
            inset: 0;
            background: rgba(4,8,18,0.92);
            backdrop-filter: blur(8px);
            z-index: 20;
            overflow-y: auto;
            padding: 20px;
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

          .yam-side-profile-copy p {
            margin: 6px 0 0;
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
            border-radius: 22px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.03);
            padding: 18px;
            display: grid;
            gap: 14px;
          }

          .yam-info-card.compact {
            padding: 10px;
            gap: 8px;
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

          .yam-info-row strong,
          .yam-list-link strong {
            color: #a78bfa;
            word-break: break-word;
          }

          .yam-list-link {
            min-height: 48px;
            padding: 0 10px;
            border-radius: 16px;
            border: none;
            background: transparent;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .yam-list-link > div {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .yam-media-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .yam-media-thumb {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 18px;
            object-fit: cover;
            display: grid;
            place-items: center;
            font-size: 12px;
            font-weight: 800;
            color: white;
          }

          .yam-media-thumb.placeholder.purple { background: linear-gradient(135deg, rgba(124,58,237,0.55), rgba(91,33,182,0.18)); }
          .yam-media-thumb.placeholder.blue { background: linear-gradient(135deg, rgba(59,130,246,0.55), rgba(37,99,235,0.18)); }
          .yam-media-thumb.placeholder.pink { background: linear-gradient(135deg, rgba(236,72,153,0.5), rgba(168,85,247,0.16)); }
          .yam-media-thumb.placeholder.teal { background: linear-gradient(135deg, rgba(20,184,166,0.5), rgba(6,182,212,0.16)); }

          .yam-panel-actions {
            display: grid;
            gap: 10px;
          }

          .yam-secondary-btn,
          .yam-danger-btn,
          .yam-reaction-btn {
            min-height: 50px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: white;
            font-weight: 900;
          }

          .yam-reaction-btn {
            background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(67,56,202,0.18));
            border-color: rgba(167,139,250,0.18);
          }

          .yam-danger-btn {
            background: rgba(239,68,68,0.1);
            color: #f87171;
            border-color: rgba(239,68,68,0.2);
          }

          @media (max-width: 1240px) {
            .yam-conversation-screen {
              grid-template-columns: 280px minmax(0, 1fr);
            }

            .yam-side-profile-panel {
              display: none;
            }
          }

          @media (max-width: 860px) {
            .yam-conversation-screen {
              grid-template-columns: 1fr;
            }

            .yam-chat-sidebar {
              display: none;
            }

            .yam-chat-stage {
              padding: 14px 14px 0;
            }

            .yam-stage-top-search {
              min-height: 56px;
            }

            .yam-chat-stage-header {
              padding: 0 2px 10px;
            }

            .yam-chat-stage-peer-copy strong {
              font-size: 17px;
            }

            .yam-bubble {
              max-width: 88%;
            }

            .yam-details-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
        `}</style>
      </section>
    </MainLayout>
  );
}
