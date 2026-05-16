/**
 * YAMSHAT Chat Page – Full Redesign
 * Three-column layout: sidebar (threads) + conversation + info panel
 * Features: real-time messages, typing/recording status, last seen,
 *           read receipts (✓✓ blue), reply, block/unblock, video/voice calls,
 *           voice messages, media attachments
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { useChatStore } from '../store/appStore.js';
import {
  avatarGradient,
  formatLastSeen,
  formatTimeAgo,
  initialsFromName,
  statusColor,
  statusTicks,
} from '../components/yamshat/YamshatDesign.js';

/* ─── tiny helpers ───────────────────────────────────────────────────── */
function Avatar({ name = '', src, size = 44, ring = false, live = false }) {
  const style = {
    width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
    border: ring ? '2px solid rgba(139,92,246,0.88)' : 'none',
    boxShadow: ring ? '0 0 0 4px rgba(139,92,246,0.14)' : 'none',
  };
  return src
    ? <img src={src} alt={name} style={style} />
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(name), fontSize: size * 0.38 }}>{initialsFromName(name).slice(0, 1)}</div>;
}

function PresenceDot({ isOnline }) {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: isOnline ? '#22c55e' : '#64748b',
      boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.22)' : 'none',
    }} />
  );
}

/* ─── single thread row in left sidebar ─────────────────────────────── */
function ThreadRow({ thread, active, presence, onClick }) {
  const isOnline = presence?.is_online;
  const isTyping = presence?.is_typing;
  return (
    <button
      type="button"
      onClick={() => onClick(thread.username)}
      className={`yam-thread-row ${active ? 'active' : ''}`}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={thread.username} src={thread.avatar} size={50} />
        <span className={`thread-online-dot ${isOnline ? 'on' : 'off'}`} />
      </div>
      <div className="thread-meta">
        <div className="thread-top-line">
          <strong>{thread.username}</strong>
          <span className="thread-time">{formatTimeAgo(thread.created_at)}</span>
        </div>
        <div className="thread-preview-line">
          <span className="thread-preview-text">
            {isTyping ? <em className="typing-indicator">✏ يكتب...</em> : (thread.last_message || 'لا توجد رسائل بعد')}
          </span>
          {thread.unread_count > 0 && <span className="unread-badge">{thread.unread_count}</span>}
        </div>
      </div>
    </button>
  );
}

/* ─── single message bubble ─────────────────────────────────────────── */
function MessageBubble({ message, isMe, onReply, onDelete }) {
  const hasMedia = Boolean(message.media_url);
  const isVoice = message.type === 'voice';
  const isImage = message.type === 'image' || (hasMedia && /\.(jpg|jpeg|png|gif|webp)/i.test(message.media_url || ''));
  const isVideo = message.type === 'video' || (hasMedia && /\.(mp4|webm|mov)/i.test(message.media_url || ''));
  const content = message.content || message.message || '';

  return (
    <div className={`yam-bubble-wrap ${isMe ? 'me' : 'them'}`}>
      {!isMe && <Avatar name={message.sender} size={32} />}
      <div className={`yam-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
        {message.reply_to && (
          <div className="bubble-reply-banner">
            <strong>↩ الرد على:</strong> {message.reply_to?.content || '...'}
          </div>
        )}
        {isVoice && message.media_url && (
          <audio src={message.media_url} controls style={{ maxWidth: 260, display: 'block' }} />
        )}
        {isImage && message.media_url && (
          <img src={message.media_url} alt="media" style={{ maxWidth: 260, borderRadius: 12, display: 'block' }} />
        )}
        {isVideo && message.media_url && (
          <video src={message.media_url} controls style={{ maxWidth: 260, borderRadius: 12, display: 'block' }} />
        )}
        {content && !message.deleted && <div className="bubble-text">{content}</div>}
        {message.deleted && <div className="bubble-deleted">🗑 تم حذف الرسالة</div>}
        <div className="bubble-meta">
          <span className="bubble-time">
            {new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMe && (
            <span style={{ color: statusColor(message.status), fontSize: 13, fontWeight: 700 }}>
              {statusTicks(message.status)}
            </span>
          )}
        </div>
        <div className="bubble-actions">
          <button type="button" onClick={() => onReply(message)}>↩</button>
          {isMe && !message.deleted && <button type="button" onClick={() => onDelete(message.id)}>🗑</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN CHAT COMPONENT ────────────────────────────────────────────── */
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
  const [presence, setPresence] = useState({});            // { [username]: { is_online, is_typing, last_seen } }
  const [blockStatus, setBlockStatus] = useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [replyTo, setReplyTo] = useState(null);
  const [callMode, setCallMode] = useState(null);          // null | 'voice' | 'video'
  const [searchQuery, setSearchQuery] = useState('');
  const [flyingHearts, setFlyingHearts] = useState([]);
  const messagesEndRef = useRef(null);
  const setActivePeer = useChatStore((state) => state.setActivePeer);

  /* load threads */
  useEffect(() => {
    let active = true;
    setThreadsLoading(true);
    getChatThreads()
      .then(({ data }) => { if (active) setThreads(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (active) setThreadsLoading(false); });
    return () => { active = false; };
  }, []);

  /* load messages when peer changes */
  const loadMessages = useCallback(async () => {
    if (!peer) return;
    setMsgLoading(true);
    try {
      const { data } = await getMessages(peer, 50);
      setMessages(data?.items || []);
      await markMessagesSeen(peer);
    } catch {
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحميل الرسائل' });
    } finally {
      setMsgLoading(false);
    }
  }, [peer, pushToast]);

  useEffect(() => {
    if (!peer) return;
    loadMessages();
    setActivePeer(peer);

    /* Presence */
    getPresence(peer).then(({ data }) => {
      setPresence(prev => ({ ...prev, [peer]: { ...(prev[peer] || {}), ...(data || {}) } }));
    }).catch(() => {});

    /* Block status */
    getBlockStatus(peer).then(({ data }) => {
      setBlockStatus(data || {});
    }).catch(() => {});

    return () => setActivePeer(null);
  }, [peer, loadMessages, setActivePeer]);

  /* scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* socket subscriptions */
  useEffect(() => {
    if (!currentUser) return;
    socketManager.connect();
    socketManager.emit('register_user', { user: currentUser }, { skipSignature: true });

    const onMsg = (msg) => {
      const participants = [msg?.sender, msg?.receiver];
      if (!participants.includes(currentUser)) return;
      setMessages(prev => {
        const existingIndex = prev.findIndex(item => item.id === msg.id || (item.client_id && item.client_id === msg.client_id));
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], ...msg };
          return next;
        }
        return [...prev, msg];
      });
      /* update thread preview */
      setThreads(prev => prev.map(t => t.username === msg.sender || t.username === msg.receiver
        ? { ...t, last_message: msg.content || msg.message, created_at: msg.created_at }
        : t));
      if (msg.sender === peer) markMessagesSeen(peer).catch(() => {});
    };

    const onDelivered = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages(prev => prev.map(m =>
        payload.message_ids?.includes(m.id) ? { ...m, status: 'delivered' } : m));
    };

    const onSeen = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages(prev => prev.map(m =>
        payload.message_ids?.includes(m.id) ? { ...m, status: 'seen' } : m));
    };

    const onPresence = (payload) => {
      if (!payload?.user) return;
      setPresence(prev => ({ ...prev, [payload.user]: { ...(prev[payload.user] || {}), ...payload } }));
    };

    const onTyping = (payload) => {
      if (!payload?.sender) return;
      setPresence(prev => ({
        ...prev,
        [payload.sender]: { ...(prev[payload.sender] || {}), is_typing: payload.is_typing },
      }));
      if (payload.is_typing) {
        setTimeout(() => setPresence(prev => ({
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

    return () => {
      socketManager.off('new_private_message', onMsg);
      socketManager.off('messages_delivered', onDelivered);
      socketManager.off('messages_seen', onSeen);
      socketManager.off('presence_update', onPresence);
      socketManager.off('typing_update', onTyping);
    };
  }, [currentUser, peer]);

  /* send message */
  const handleSend = async (payload) => {
    const text = payload?.text?.trim() || '';
    const mediaUrl = payload?.media_url || '';
    if (!text && !mediaUrl) return;

    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId, sender: currentUser, receiver: peer,
      content: text, message: text, media_url: mediaUrl,
      type: mediaUrl ? (payload.type || 'media') : 'text',
      created_at: new Date().toISOString(), status: 'sending',
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content || replyTo.message } : null,
    };
    setMessages(prev => [...prev, tempMsg]);
    setReplyTo(null);

    try {
      const { data } = await sendMessageApi({
        receiver: peer, message: text, media_url: mediaUrl,
        type: tempMsg.type,
        reply_to_id: replyTo?.id || null,
        client_id: tempId,
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, ...(data || {}), status: (data || {}).status || 'sent' } : m));
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      pushToast({ type: 'error', title: 'خطأ', description: 'فشل إرسال الرسالة' });
    }
  };

  /* delete message */
  const handleDelete = async (msgId) => {
    try {
      await deleteMessageApi(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true, content: '', message: '' } : m));
    } catch { pushToast({ type: 'error', title: 'تعذر الحذف' }); }
  };

  /* block / unblock */
  const handleBlock = async () => {
    try {
      if (blockStatus.blocked_by_me) {
        await unblockUserApi(peer);
        setBlockStatus(prev => ({ ...prev, blocked_by_me: false, can_chat: true }));
        pushToast({ type: 'success', title: 'تم رفع الحظر' });
      } else {
        await blockUserApi(peer);
        setBlockStatus(prev => ({ ...prev, blocked_by_me: true, can_chat: false }));
        pushToast({ type: 'success', title: 'تم الحظر' });
      }
    } catch { pushToast({ type: 'error', title: 'تعذرت العملية' }); }
  };

  /* flying hearts */
  const spawnHeart = () => {
    const id = Date.now();
    setFlyingHearts(prev => [...prev, id]);
    setTimeout(() => setFlyingHearts(prev => prev.filter(h => h !== id)), 1800);
  };

  const peerPresence = presence[peer] || {};
  const isOnline = peerPresence.is_online;
  const isTyping = peerPresence.is_typing;
  const lastSeen = peerPresence.last_seen;

  const filteredThreads = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return threads.filter(t => !q || t.username.toLowerCase().includes(q));
  }, [threads, searchQuery]);

  const peerThread = threads.find(t => t.username === peer) || {};

  return (
    <MainLayout>
      <div className="yam-chat-shell">

        {/* ── LEFT: Thread list ─────────────────────────────────────── */}
        <aside className="yam-chat-sidebar">
          <div className="yam-chat-sidebar-head">
            <h2>المحادثات</h2>
            <Link to="/users" className="yam-new-chat-btn">＋ جديد</Link>
          </div>
          <div className="yam-thread-search">
            <input
              type="search"
              placeholder="بحث في المحادثات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="yam-thread-list">
            {threadsLoading && <div className="yam-empty-state">جارٍ التحميل...</div>}
            {!threadsLoading && !filteredThreads.length && <div className="yam-empty-state">لا توجد محادثات</div>}
            {filteredThreads.map(t => (
              <ThreadRow
                key={t.username}
                thread={t}
                active={t.username === peer}
                presence={presence[t.username]}
                onClick={u => navigate(`/chat/${encodeURIComponent(u)}`)}
              />
            ))}
          </div>
          {/* YAMSHAT PRO promo */}
          <div className="yam-pro-promo">
            <div className="yam-pro-mark">🜲</div>
            <div>
              <strong>YAMSHAT PRO</strong>
              <p>ترقية لتجربة أفضل بدون إعلانات</p>
              <button type="button" className="yam-pro-btn">ترقية الآن</button>
            </div>
          </div>
        </aside>

        {/* ── CENTER: Active conversation ───────────────────────────── */}
        {!peer ? (
          <div className="yam-chat-no-peer">
            <div className="no-peer-icon">💬</div>
            <h3>اختر محادثة للبدء</h3>
            <p>اختر من القائمة الجانبية أو ابدأ محادثة جديدة</p>
          </div>
        ) : (
          <div className="yam-chat-conversation">
            {/* Header */}
            <div className="yam-conv-header">
              <div className="yam-conv-peer-info">
                <Avatar name={peer} src={peerThread.avatar} size={46} />
                <div>
                  <div className="yam-conv-peer-name">
                    {peer} <span className="verify-badge">✓</span>
                  </div>
                  <div className="yam-conv-peer-status">
                    {isTyping ? <em className="typing-pulse">✏ يكتب...</em>
                      : <span><PresenceDot isOnline={isOnline} /> {formatLastSeen(lastSeen, isOnline)}</span>}
                  </div>
                </div>
              </div>
              <div className="yam-conv-actions">
                <button type="button" className="yam-icon-ghost" onClick={() => setCallMode('video')} title="مكالمة فيديو">📹</button>
                <button type="button" className="yam-icon-ghost" onClick={() => setCallMode('voice')} title="مكالمة صوتية">📞</button>
                <button type="button" className="yam-icon-ghost" title="بحث">⌕</button>
                <button type="button" className="yam-icon-ghost" onClick={spawnHeart} title="قلب طائر">💜</button>
              </div>
            </div>

            {/* Flying hearts */}
            <div className="flying-hearts-layer" aria-hidden>
              {flyingHearts.map(id => (
                <span key={id} className="flying-heart">💜</span>
              ))}
            </div>

            {/* Active call */}
            {callMode && (
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
            )}

            {/* Block banner */}
            {!blockStatus.can_chat && blockStatus.blocked_by_me && (
              <div className="yam-block-banner">
                لقد حظرت هذا المستخدم. <button type="button" onClick={handleBlock}>رفع الحظر</button>
              </div>
            )}
            {!blockStatus.can_chat && blockStatus.blocked_me && (
              <div className="yam-block-banner blocked">هذا المستخدم حظرك.</div>
            )}

            {/* Messages */}
            <div className="yam-messages-area">
              {msgLoading && <div className="yam-empty-state">جارٍ تحميل الرسائل...</div>}
              {!msgLoading && !messages.length && <div className="yam-empty-state">لا توجد رسائل بعد. أرسل الأولى!</div>}
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMe={msg.sender === currentUser}
                  onReply={m => setReplyTo(m)}
                  onDelete={handleDelete}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="yam-chat-input-wrap">
              <ChatInput
                peer={peer}
                currentUser={currentUser}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSend={handleSend}
                disabled={!blockStatus.can_chat}
              />
            </div>
          </div>
        )}

        {/* ── RIGHT: Conversation info panel ───────────────────────── */}
        {peer && (
          <aside className="yam-chat-info-panel">
            <div className="yam-info-avatar-block">
              <Avatar name={peer} src={peerThread.avatar} size={80} ring />
              <h3>{peer} <span className="verify-badge">✓</span></h3>
              <p>{isTyping ? '✏ يكتب...' : formatLastSeen(lastSeen, isOnline)}</p>
            </div>
            <div className="yam-info-actions">
              <button type="button" className="yam-info-action-btn" title="بحث">⌕ بحث</button>
              <button type="button" className="yam-info-action-btn" title="كتم">🔔 كتم</button>
              <button
                type="button"
                className={`yam-info-action-btn ${blockStatus.blocked_by_me ? 'danger' : ''}`}
                onClick={handleBlock}
              >
                {blockStatus.blocked_by_me ? '🚫 رفع الحظر' : '🚫 حظر'}
              </button>
            </div>
            <div className="yam-info-section">
              <div className="yam-info-section-head">الوسائط المشتركة</div>
              <div className="yam-media-grid">
                {messages.filter(m => m.media_url && m.type === 'image').slice(-6).map(m => (
                  <img key={m.id} src={m.media_url} alt="media" className="yam-media-thumb" />
                ))}
                {!messages.some(m => m.media_url) && <span className="muted">لا توجد وسائط</span>}
              </div>
            </div>
            <div className="yam-info-section">
              <div className="yam-info-section-head">الروابط المشتركة</div>
              <div className="muted" style={{ fontSize: 13 }}>لا توجد روابط</div>
            </div>
            <button type="button" className="yam-delete-conv-btn">🗑 حذف المحادثة</button>
          </aside>
        )}
      </div>

      <style>{`
        /* ── Layout ──────────────────────────────────────────────────── */
        .yam-chat-shell {
          display: grid;
          grid-template-columns: 320px minmax(0,1fr) 300px;
          height: calc(100vh - 66px);
          background: #060e1e;
          overflow: hidden;
          direction: rtl;
        }
        @media (max-width: 1100px) {
          .yam-chat-shell { grid-template-columns: 280px minmax(0,1fr); }
          .yam-chat-info-panel { display: none; }
        }
        @media (max-width: 700px) {
          .yam-chat-shell { grid-template-columns: 1fr; }
          .yam-chat-sidebar { display: ${peer ? 'none' : 'flex'}; }
        }

        /* ── Left sidebar ──────────────────────────────────────────── */
        .yam-chat-sidebar {
          display: flex;
          flex-direction: column;
          border-inline-end: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,10,22,0.96);
          overflow: hidden;
        }
        .yam-chat-sidebar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 16px 10px;
          flex-shrink: 0;
        }
        .yam-chat-sidebar-head h2 { margin: 0; font-size: 20px; font-weight: 900; }
        .yam-new-chat-btn {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }
        .yam-thread-search {
          padding: 8px 16px;
          flex-shrink: 0;
        }
        .yam-thread-search input {
          width: 100%;
          background: rgba(15,23,42,0.78);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 10px 14px;
          color: white;
          font-size: 14px;
        }
        .yam-thread-list {
          flex: 1;
          overflow-y: auto;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .yam-thread-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 12px;
          border-radius: 16px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          text-align: start;
          transition: background 0.2s;
        }
        .yam-thread-row:hover { background: rgba(139,92,246,0.1); }
        .yam-thread-row.active { background: rgba(139,92,246,0.18); border: 1px solid rgba(139,92,246,0.3); }
        .thread-online-dot {
          position: absolute;
          bottom: 1px;
          inset-inline-end: 1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(5,10,22,0.96);
        }
        .thread-online-dot.on { background: #22c55e; }
        .thread-online-dot.off { background: #475569; }
        .thread-meta { flex: 1; min-width: 0; }
        .thread-top-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .thread-top-line strong { font-weight: 800; font-size: 14px; }
        .thread-time { font-size: 11px; color: #64748b; flex-shrink: 0; }
        .thread-preview-line { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .thread-preview-text { font-size: 13px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .typing-indicator { color: #22c55e; font-style: italic; font-size: 12px; }
        .unread-badge {
          min-width: 20px; height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #7c3aed;
          color: white;
          font-size: 11px;
          font-weight: 800;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .yam-pro-promo {
          margin: 8px;
          padding: 14px;
          border-radius: 20px;
          background: radial-gradient(circle at top, rgba(139,92,246,0.25), transparent 70%), rgba(12,18,34,0.9);
          border: 1px solid rgba(139,92,246,0.2);
          display: flex;
          gap: 12px;
          align-items: flex-start;
          flex-shrink: 0;
        }
        .yam-pro-mark {
          width: 46px; height: 46px;
          border-radius: 14px;
          display: grid; place-items: center;
          background: rgba(139,92,246,0.2);
          font-size: 22px;
          color: #d8b4fe;
          flex-shrink: 0;
        }
        .yam-pro-promo strong { font-size: 15px; font-weight: 900; }
        .yam-pro-promo p { margin: 4px 0 10px; font-size: 12px; color: #94a3b8; }
        .yam-pro-btn {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 8px 14px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
        }
        .yam-empty-state { color: #64748b; font-size: 14px; padding: 20px; text-align: center; }

        /* ── Center conversation ──────────────────────────────────── */
        .yam-chat-no-peer {
          display: grid;
          place-items: center;
          text-align: center;
          color: #64748b;
        }
        .no-peer-icon { font-size: 72px; margin-bottom: 18px; }
        .yam-chat-conversation {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        .yam-conv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,10,22,0.96);
          flex-shrink: 0;
        }
        .yam-conv-peer-info { display: flex; align-items: center; gap: 12px; }
        .yam-conv-peer-name { font-size: 16px; font-weight: 900; display: flex; align-items: center; gap: 6px; }
        .verify-badge { color: #3b82f6; font-size: 12px; }
        .yam-conv-peer-status { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .typing-pulse { color: #22c55e; font-style: italic; animation: pulse-text 1s ease-in-out infinite; }
        @keyframes pulse-text { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .yam-conv-actions { display: flex; align-items: center; gap: 8px; }
        .yam-icon-ghost {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          color: white;
          font-size: 16px;
          display: grid; place-items: center;
          cursor: pointer;
        }
        .yam-icon-ghost:hover { background: rgba(139,92,246,0.18); }

        .flying-hearts-layer {
          position: absolute;
          bottom: 80px;
          right: 18px;
          pointer-events: none;
          z-index: 10;
        }
        .flying-heart {
          position: absolute;
          font-size: 28px;
          animation: fly-up 1.8s ease-out forwards;
          right: 0;
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

        .yam-block-banner {
          padding: 12px 18px;
          background: rgba(239,68,68,0.12);
          border-bottom: 1px solid rgba(239,68,68,0.22);
          color: #fca5a5;
          font-size: 13px;
          text-align: center;
          flex-shrink: 0;
        }
        .yam-block-banner button {
          background: none;
          border: none;
          color: #f97316;
          cursor: pointer;
          font-weight: 700;
          margin-inline-start: 8px;
        }

        .yam-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .yam-messages-area::-webkit-scrollbar { width: 4px; }
        .yam-messages-area::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.22); border-radius: 999px; }

        /* ── Bubbles ─────────────────────────────────────────────── */
        .yam-bubble-wrap {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .yam-bubble-wrap.me { flex-direction: row-reverse; }
        .yam-bubble {
          max-width: 72%;
          padding: 10px 14px;
          border-radius: 20px;
          position: relative;
          line-height: 1.5;
        }
        .bubble-me {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          border-bottom-right-radius: 6px;
        }
        .bubble-them {
          background: rgba(30,41,59,0.88);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom-left-radius: 6px;
        }
        .bubble-reply-banner {
          font-size: 12px;
          padding: 6px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          margin-bottom: 8px;
          border-inline-start: 2px solid rgba(255,255,255,0.4);
        }
        .bubble-text { font-size: 14px; word-break: break-word; }
        .bubble-deleted { font-size: 13px; opacity: 0.5; font-style: italic; }
        .bubble-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          margin-top: 5px;
        }
        .bubble-time { font-size: 11px; opacity: 0.65; }
        .bubble-actions {
          display: none;
          gap: 6px;
          position: absolute;
          top: -28px;
          inset-inline-end: 0;
          background: rgba(15,23,42,0.92);
          border-radius: 10px;
          padding: 4px 8px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .yam-bubble:hover .bubble-actions { display: flex; }
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
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Right info panel ─────────────────────────────────────── */
        .yam-chat-info-panel {
          border-inline-start: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,10,22,0.94);
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          padding: 24px 16px;
        }
        .yam-info-avatar-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 16px;
          gap: 8px;
        }
        .yam-info-avatar-block h3 { margin: 0; font-size: 18px; font-weight: 900; }
        .yam-info-avatar-block p { margin: 0; font-size: 13px; color: #94a3b8; }
        .yam-info-actions { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .yam-info-action-btn {
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(15,23,42,0.78);
          border: 1px solid rgba(255,255,255,0.06);
          color: #cbd5e1;
          text-align: start;
          font-size: 14px;
          cursor: pointer;
        }
        .yam-info-action-btn.danger { color: #fca5a5; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.07); }
        .yam-info-section { margin-bottom: 20px; }
        .yam-info-section-head { font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 10px; }
        .yam-media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .yam-media-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
        .yam-delete-conv-btn {
          margin-top: auto;
          padding: 12px;
          border-radius: 14px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          cursor: pointer;
          font-weight: 700;
        }
      `}</style>
    </MainLayout>
  );
}
