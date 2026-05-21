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
import { useChatStore } from '../store/appStore.js';
import { getChatPreferences, toggleChatPreference } from '../utils/chatPreferences.js';
import {
  avatarGradient,
  formatLastSeen,
  initialsFromName,
  statusColor,
  statusTicks,
} from '../components/yamshat/YamshatDesign.js';

function Avatar({ name = '', src, size = 44, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: ring ? 18 : '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: ring ? '1px solid rgba(139,92,246,0.42)' : 'none',
    boxShadow: ring ? '0 0 0 4px rgba(139,92,246,0.12)' : 'none',
  };
  return src
    ? <img src={src} alt={name} style={style} />
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(name), fontSize: size * 0.34 }}>{initialsFromName(name).slice(0, 1)}</div>;
}

function PresenceDot({ isOnline }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: isOnline ? '#22c55e' : '#64748b',
      boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.22)' : 'none',
      flexShrink: 0,
    }} />
  );
}

function MessageBubble({ message, isMe, onReply, onDelete }) {
  const hasMedia = Boolean(message.media_url);
  const isVoice = message.type === 'voice';
  const isImage = message.type === 'image' || (hasMedia && /\.(jpg|jpeg|png|gif|webp)/i.test(message.media_url || ''));
  const isVideo = message.type === 'video' || (hasMedia && /\.(mp4|webm|mov)/i.test(message.media_url || ''));
  const content = message.content || message.message || '';

  return (
    <div className={`yam-bubble-wrap ${isMe ? 'me' : 'them'}`}>
      {!isMe && <Avatar name={message.sender} size={34} />}
      <div className={`yam-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
        {message.reply_to ? (
          <div className="bubble-reply-banner">
            <strong>↩ الرد على:</strong> {message.reply_to?.content || '...'}
          </div>
        ) : null}

        {isVoice && message.media_url ? <audio src={message.media_url} controls style={{ width: '100%', maxWidth: 320, display: 'block' }} /> : null}
        {isImage && message.media_url ? <img src={message.media_url} alt="media" style={{ maxWidth: 320, width: '100%', borderRadius: 16, display: 'block' }} /> : null}
        {isVideo && message.media_url ? <video src={message.media_url} controls style={{ maxWidth: 320, width: '100%', borderRadius: 16, display: 'block' }} /> : null}

        {content && !message.deleted ? <div className="bubble-text">{content}</div> : null}
        {message.deleted ? <div className="bubble-deleted">🗑 تم حذف الرسالة</div> : null}

        <div className="bubble-meta">
          <span className="bubble-time">
            {new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
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
  const initialChatPrefs = useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = useState(initialChatPrefs.muted.has(peer));
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const messagesEndRef = useRef(null);
  const setActivePeer = useChatStore((state) => state.setActivePeer);

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
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    loadMessages();
    setShowDetailsDrawer(false);
    setActivePeer(peer);

    getPresence(peer).then(({ data }) => {
      setPresence((prev) => ({ ...prev, [peer]: { ...(prev[peer] || {}), ...(data || {}) } }));
    }).catch(() => {});

    getBlockStatus(peer).then(({ data }) => {
      setBlockStatus(data || {});
    }).catch(() => {});

    return () => setActivePeer(null);
  }, [peer, loadMessages, setActivePeer]);

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
          next[existingIndex] = { ...next[existingIndex], ...msg };
          return next.filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id || (candidate.client_id && candidate.client_id === item.client_id)));
        }
        return [...prev, msg].filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id || (candidate.client_id && candidate.client_id === item.client_id)));
      });
      setThreads((prev) => prev.map((item) => item.username === msg.sender || item.username === msg.receiver
        ? { ...item, last_message: msg.content || msg.message, created_at: msg.created_at }
        : item));
      if (msg.sender === peer) markMessagesSeen(peer).catch(() => {});
    };

    const onDelivered = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? { ...item, status: 'delivered' } : item));
    };

    const onSeen = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? { ...item, status: 'seen' } : item));
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
      setMessages((prev) => prev.map((item) => String(item.id) === String(payload.id) ? { ...item, ...payload, deleted: true } : item));
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

  const handleSend = async (payload) => {
    const text = payload?.text?.trim() || '';
    const mediaUrl = payload?.media_url || '';
    if (!text && !mediaUrl) return;

    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      client_id: tempId,
      sender: currentUser,
      receiver: peer,
      content: text,
      message: text,
      media_url: mediaUrl,
      type: mediaUrl ? (payload.type || 'media') : 'text',
      created_at: new Date().toISOString(),
      status: 'sending',
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content || replyTo.message } : null,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setReplyTo(null);

    try {
      const { data } = await sendMessageApi({
        receiver: peer,
        message: text,
        media_url: mediaUrl,
        type: tempMsg.type,
        reply_to_id: replyTo?.id || null,
        client_id: tempId,
      });
      setMessages((prev) => {
        const merged = prev.map((item) => (
          item.id === tempId || item.client_id === tempId
            ? { ...item, ...(data || {}), status: (data || {}).status || 'sent' }
            : item
        ));
        return merged.filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id || (candidate.client_id && candidate.client_id === item.client_id)));
      });
    } catch {
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
      pushToast({ type: 'error', title: 'خطأ', description: 'فشل إرسال الرسالة' });
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

  const handleDeleteConversation = () => {
    const nextSet = toggleChatPreference('archived', peer);
    setMessages([]);
    pushToast({ type: 'success', title: nextSet.has(peer) ? 'تمت أرشفة المحادثة' : 'تم إلغاء الأرشفة', description: 'تقدر تلاقيها من تبويب المؤرشفة.' });
  };

  const spawnHeart = () => {
    const id = Date.now();
    setFlyingHearts((prev) => [...prev, id]);
    setTimeout(() => setFlyingHearts((prev) => prev.filter((item) => item !== id)), 1800);
  };

  const peerPresence = presence[peer] || {};
  const isOnline = peerPresence.is_online;
  const isTyping = peerPresence.is_typing;
  const lastSeen = peerPresence.last_seen;
  const peerThread = useMemo(() => threads.find((item) => item.username === peer) || {}, [threads, peer]);
  const mediaMessages = useMemo(() => messages.filter((item) => item.media_url), [messages]);

  if (!peer) {
    return <Navigate to="/inbox" replace />;
  }

  return (
    <MainLayout hideNav>
      <section className="yam-chat-screen" dir="rtl">
        <aside className="yam-chat-sidebar">
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #c026d3)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>Y</div>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>YAMSHAT</span>
             </div>
             <nav style={{ display: 'grid', gap: '8px' }}>
                {['الدردشات', 'المجموعات', 'الأصدقاء', 'الإشعارات', 'الإعدادات'].map((item, idx) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: idx === 0 ? 'rgba(124,58,237,0.15)' : 'transparent', color: idx === 0 ? '#a78bfa' : '#94a3b8', cursor: 'pointer' }}>
                    <span style={{ fontSize: '18px' }}>{['💬', '👥', '👤', '🔔', '⚙️'][idx]}</span>
                    <span style={{ fontWeight: 'bold' }}>{item}</span>
                  </div>
                ))}
             </nav>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', color: 'white' }}>
                <span style={{ fontWeight: 'bold' }}>جهات الاتصال</span>
                <span style={{ cursor: 'pointer', fontSize: '20px' }}>+</span>
             </div>
             <div style={{ display: 'grid', gap: '12px' }}>
                {threads.map((thread) => (
                  <div key={thread.username} onClick={() => navigate(`/chat/${thread.username}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', background: thread.username === peer ? 'rgba(124,58,237,0.1)' : 'transparent', cursor: 'pointer' }}>
                    <Avatar name={thread.username} src={thread.avatar} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{thread.username}</div>
                      <div style={{ color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.last_message || 'متصل الآن'}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </aside>

        <div className="yam-chat-stage">
          <header className="yam-chat-stage-header">
            <div className="yam-chat-stage-peer">
              <Avatar name={peer} src={peerThread.avatar} size={48} ring />
              <div className="yam-chat-stage-peer-copy">
                <strong style={{ color: 'white' }}>{peer}</strong>
                <span style={{ color: '#64748b' }}>
                  {isTyping ? 'يكتب الآن...' : formatLastSeen(lastSeen, isOnline)}
                </span>
              </div>
            </div>

            <div className="yam-chat-stage-actions">
              <button type="button" className="yam-stage-icon" style={{ background: 'transparent', border: 'none', fontSize: '20px' }} onClick={() => setCallMode('voice')}>📞</button>
              <button type="button" className="yam-stage-icon" style={{ background: 'transparent', border: 'none', fontSize: '20px' }} onClick={() => setCallMode('video')}>📹</button>
              <button type="button" className="yam-stage-icon" style={{ background: 'transparent', border: 'none', fontSize: '20px' }}>⋮</button>
            </div>
          </header>

          {showDetailsDrawer ? (
            <div className="yam-chat-details-drawer">
              <div className="yam-details-grid">
                <button type="button" className="yam-detail-action" onClick={handleMuteConversation}>{isMutedConversation ? '🔔 إلغاء الكتم' : '🔕 كتم المحادثة'}</button>
                <button type="button" className="yam-detail-action" onClick={spawnHeart}>💜 تفاعل سريع</button>
                <button type="button" className={`yam-detail-action ${blockStatus.blocked_by_me ? 'danger' : ''}`} onClick={handleBlock}>{blockStatus.blocked_by_me ? 'رفع الحظر' : 'حظر المستخدم'}</button>
                <button type="button" className="yam-detail-action danger" onClick={handleDeleteConversation}>تنظيف الشاشة</button>
              </div>

              <div className="yam-details-section">
                <div className="yam-details-head">الوسائط المشتركة</div>
                <div className="yam-media-strip">
                  {mediaMessages.filter((item) => item.type === 'image').slice(-5).map((item) => (
                    <img key={item.id} src={item.media_url} alt="media" className="yam-media-thumb" />
                  ))}
                  {!mediaMessages.length ? <span className="yam-muted-note">لا توجد وسائط مشتركة بعد</span> : null}
                </div>
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
              لقد حظرت هذا المستخدم. <button type="button" onClick={handleBlock}>رفع الحظر</button>
            </div>
          ) : null}
          {!blockStatus.can_chat && blockStatus.blocked_me ? <div className="yam-block-banner blocked">هذا المستخدم حظرك.</div> : null}

          <div className="yam-messages-area">
            {threadsLoading && !peerThread.username ? <div className="yam-empty-state">جارٍ تجهيز بيانات المحادثة...</div> : null}
            {msgLoading ? <div className="yam-empty-state">جارٍ تحميل الرسائل...</div> : null}
            {!msgLoading && !messages.length ? <div className="yam-empty-state">لا توجد رسائل بعد. ابدأ المحادثة الآن.</div> : null}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.sender === currentUser}
                onReply={(message) => setReplyTo(message)}
                onDelete={handleDelete}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="yam-chat-input-wrap" style={{ padding: '16px 24px', background: '#050816' }}>
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
        </div>

        <aside style={{ background: '#0b0f1a', borderInlineStart: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
           <Avatar name={peer} src={peerThread.avatar} size={120} ring />
           <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>{peer}</div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>{formatLastSeen(lastSeen, isOnline)}</div>
           </div>
           <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center' }}>
              {['📞', '📹', '🔍', '⋮'].map((icon, i) => (
                <div key={i} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', color: 'white', cursor: 'pointer' }}>{icon}</div>
              ))}
           </div>
           <div style={{ width: '100%', marginTop: '24px', display: 'grid', gap: '20px' }}>
              <div>
                 <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>اسم المستخدم</div>
                 <div style={{ color: '#a78bfa', fontWeight: 'bold' }}>@{peer.toLowerCase()}</div>
              </div>
              <div>
                 <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>البريد الإلكتروني</div>
                 <div style={{ color: 'white' }}>{peer.toLowerCase()}@example.com</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', pt: '20px', display: 'grid', gap: '16px' }}>
                 {['الوسائط المشتركة', 'الملفات', 'الروابط', 'المحادثات المثبتة'].map((item, i) => (
                   <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <span>{['🖼️', '📁', '🔗', '📌'][i]}</span>
                         <span>{item}</span>
                      </div>
                      <span style={{ color: '#64748b' }}>›</span>
                   </div>
                 ))}
              </div>
              <button style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 <span>🚫</span> حظر المستخدم
              </button>
           </div>
        </aside>

        <style>{`
          .yam-chat-screen {
            min-height: 100vh;
            height: 100vh;
            padding: 0;
            background: #050816;
            display: grid;
            grid-template-columns: 320px 1fr 340px;
            overflow: hidden;
          }

          .yam-chat-sidebar {
            background: #0b0f1a;
            border-inline-end: 1px solid rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .yam-chat-stage {
            position: relative;
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #050816;
          }

          .yam-chat-stage-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: #050816;
            flex-shrink: 0;
          }

          .yam-chat-stage-peer {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .yam-chat-stage-peer-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
          }

          .yam-chat-stage-peer-copy strong {
            font-size: 17px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-chat-stage-peer-copy span {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #94a3b8;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-chat-stage-actions {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .yam-stage-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.78);
            color: white;
            display: grid;
            place-items: center;
            font-size: 17px;
          }

          .yam-stage-icon.active,
          .yam-stage-icon:hover {
            background: rgba(124,58,237,0.18);
            border-color: rgba(167,139,250,0.24);
          }

          .yam-chat-details-drawer {
            padding: 12px 16px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: rgba(7,12,24,0.92);
            display: grid;
            gap: 12px;
            flex-shrink: 0;
          }

          .yam-details-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .yam-detail-action {
            min-height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.72);
            color: white;
            font-weight: 800;
            padding: 0 12px;
          }

          .yam-detail-action.danger {
            color: #fecaca;
            border-color: rgba(239,68,68,0.18);
            background: rgba(127,29,29,0.2);
          }

          .yam-details-section {
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 12px;
          }

          .yam-details-head {
            font-weight: 900;
            margin-bottom: 10px;
          }

          .yam-media-strip {
            display: flex;
            gap: 8px;
            overflow-x: auto;
          }

          .yam-media-thumb {
            width: 72px;
            height: 72px;
            border-radius: 16px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .yam-muted-note {
            color: #94a3b8;
            font-size: 13px;
          }

          .flying-hearts-layer {
            position: absolute;
            bottom: 96px;
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

          .yam-block-banner {
            padding: 10px 16px;
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

          .yam-block-banner.blocked {
            background: rgba(127,29,29,0.24);
          }

          .yam-messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px 14px 14px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .yam-messages-area::-webkit-scrollbar { width: 5px; }
          .yam-messages-area::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.22); border-radius: 999px; }

          .yam-empty-state {
            color: #64748b;
            font-size: 14px;
            padding: 20px;
            text-align: center;
          }

          .yam-bubble-wrap {
            display: flex;
            align-items: flex-end;
            gap: 8px;
          }

          .yam-bubble-wrap.me { flex-direction: row-reverse; }

          .yam-bubble {
            max-width: min(74%, 560px);
            padding: 12px 15px;
            border-radius: 22px;
            position: relative;
            line-height: 1.6;
          }

          .bubble-me {
            background: #3b22a1;
            color: white;
            border-bottom-right-radius: 4px;
          }

          .bubble-them {
            background: #1a1f2e;
            color: #e2e8f0;
            border: none;
            border-bottom-left-radius: 4px;
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
            margin-top: 6px;
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
          }

          @media (max-width: 920px) {
            .yam-details-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 768px) {
            .yam-chat-stage-header {
              padding: 10px 12px;
            }

            .yam-chat-stage-peer-copy strong {
              font-size: 15px;
            }

            .yam-stage-icon {
              width: 40px;
              height: 40px;
              border-radius: 12px;
            }

            .yam-messages-area {
              padding: 16px 10px 10px;
            }

            .yam-bubble {
              max-width: 86%;
            }

            .yam-details-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    </MainLayout>
  );
}
