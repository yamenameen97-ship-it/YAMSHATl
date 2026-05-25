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

const EMPTY_MESSAGES = [];

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
  const initialChatPrefs = useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = useState(initialChatPrefs.muted.has(peer));
  const [isPinnedConversation, setIsPinnedConversation] = useState(initialChatPrefs.pinned.has(peer));
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);

  const threadList = useMemo(() => Object.values(threadsMap || {}), [threadsMap]);
  const messages = useMemo(() => normalizeMessages(conversationState?.messages || EMPTY_MESSAGES), [conversationState?.messages]);
  const peerPresence = threadsMap?.[peer]?.presence || {};

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            <div className="yam-info-row"><span>البريد</span><strong>{peerDetails.email}</strong></div>
            <div className="yam-info-row"><span>الهاتف</span><strong>{peerDetails.phone}</strong></div>
            <div className="yam-info-row"><span>الوسائط</span><strong>{mediaMessages.length}</strong></div>
            <div className="yam-info-row"><span>الملفات والصوتيات</span><strong>{fileMessages.length}</strong></div>
          </div>
        </aside>
      </section>
    </MainLayout>
  );
}
