import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import AudioWaveform from '../components/chat/AudioWaveform.jsx';
import CallExperience from '../components/chat/CallExperience.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { deleteMessageApi, getMessages, markMessagesSeen, sendMessageApi } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import signalProtocolService from '../services/chat/signalProtocol.js';
import { currentMediaProviderLabel, resolveMediaUrl } from '../config/mediaConfig.js';
import { getCurrentUsername } from '../utils/auth.js';
import { useChatStore } from '../store/appStore.js';

const CALL_ACTIONS = [
  { id: 'voice', label: 'صوتي', icon: '📞', mode: 'voice' },
  { id: 'video', label: 'فيديو', icon: '🎥', mode: 'video' },
];

function formatTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function statusLabel(status) {
  if (status === 'seen') return 'تمت القراءة';
  if (status === 'delivered') return 'تم التسليم';
  if (status === 'sending') return 'جارٍ الإرسال';
  if (status === 'failed') return 'فشل الإرسال';
  return 'تم الإرسال';
}

function expirationLabel(value) {
  if (!value) return '';
  const expiresAt = new Date(value).getTime();
  const diff = Math.max(0, expiresAt - Date.now());
  const seconds = Math.ceil(diff / 1000);
  if (seconds <= 60) return `${seconds}ث`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 60) return `${minutes}د`;
  const hours = Math.ceil(minutes / 60);
  if (hours <= 24) return `${hours}س`;
  return `${Math.ceil(hours / 24)}ي`;
}

function normalizeMessageText(message) {
  return message?.content || message?.message || message?.text || '';
}

function messageMediaItems(message) {
  const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
  if (attachments.length) return attachments;
  const mediaUrls = Array.isArray(message?.media_urls) ? message.media_urls : [];
  if (mediaUrls.length) {
    return mediaUrls.map((url) => ({ mediaUrl: resolveMediaUrl(url), mediaType: message?.type || 'media' }));
  }
  if (message?.media_url) {
    return [{ mediaUrl: resolveMediaUrl(message.media_url), mediaType: message?.type || 'media' }];
  }
  return [];
}

function renderMediaBlock(message) {
  const items = messageMediaItems(message);
  if (!items.length) return null;

  return (
    <div style={{ display: 'grid', gap: 8, marginBottom: normalizeMessageText(message) ? 10 : 0 }}>
      {items.map((item, index) => {
        const mediaUrl = resolveMediaUrl(item.mediaUrl || item.url || item.media_url || '');
        const mediaType = item.mediaType || item.type || message?.type || 'media';
        if (!mediaUrl) return null;
        if (mediaType === 'voice' || mediaType === 'audio' || /\.(ogg|mp3|wav|m4a|webm)$/i.test(mediaUrl)) {
          return (
            <div key={`${mediaUrl}-${index}`} style={{ display: 'grid', gap: 8, padding: 10, borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
              <AudioWaveform seed={message.waveform_seed || message.waveformSeed || mediaUrl} />
              <audio src={mediaUrl} controls preload="metadata" style={{ width: '100%' }} />
            </div>
          );
        }
        if (mediaType === 'image' || /\.(png|jpg|jpeg|gif|webp|avif)$/i.test(mediaUrl)) {
          return <img key={`${mediaUrl}-${index}`} src={mediaUrl} alt="media" loading="lazy" decoding="async" style={{ width: '100%', borderRadius: 12, maxHeight: 320, objectFit: 'cover' }} />;
        }
        if (mediaType === 'video' || mediaType === 'media' || /\.(mp4|webm|mov|m3u8)$/i.test(mediaUrl)) {
          return <video key={`${mediaUrl}-${index}`} src={mediaUrl} controls preload="metadata" style={{ width: '100%', borderRadius: 12, maxHeight: 360 }} />;
        }
        return (
          <a key={`${mediaUrl}-${index}`} href={mediaUrl} target="_blank" rel="noreferrer" style={{ color: '#c4b5fd', textDecoration: 'underline' }}>
            فتح الملف المرفق
          </a>
        );
      })}
    </div>
  );
}

function callStateLabel(callUi) {
  if (callUi.incoming) return 'مكالمة واردة';
  if (callUi.status === 'connected') return callUi.mode === 'video' ? 'في مكالمة فيديو' : 'في مكالمة صوتية';
  if (callUi.status === 'reconnecting') return 'جارٍ إعادة الاتصال';
  if (callUi.status === 'fallback') return 'وضع بديل';
  if (callUi.status === 'connecting') return 'جارٍ الاتصال';
  if (callUi.status === 'ended') return 'انتهت المكالمة';
  return 'جاهز للمكالمات';
}

export default function Chat() {
  const { userId } = useParams();
  const peer = decodeURIComponent(userId || '').trim();
  const currentUser = getCurrentUsername();
  const { pushToast } = useToast();
  const scrollRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(peer));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [presence, setPresence] = useState({ is_online: false, is_typing: false, is_recording: false, last_seen: null });
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [securitySnapshot, setSecuritySnapshot] = useState(null);
  const [callUi, setCallUi] = useState({ open: false, incoming: false, mode: 'voice', callType: 'direct', status: 'idle', caller: '' });
  const setActivePeer = useChatStore((state) => state.setActivePeer);

  const mergeMessages = useCallback((incoming, mode = 'append') => {
    setMessages((prev) => {
      const source = mode === 'prepend' ? [...incoming, ...prev] : [...prev, ...incoming];
      const map = new Map();
      source.forEach((item) => {
        const key = String(item.client_id || item.id || `${item.sender}-${item.created_at}`);
        map.set(key, item);
      });
      return Array.from(map.values()).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    });
  }, []);

  const pushCallEvent = useCallback((text) => {
    mergeMessages([{
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender: 'system',
      content: text,
      message: text,
      created_at: new Date().toISOString(),
      status: 'sent',
      type: 'system',
    }]);
  }, [mergeMessages]);

  const loadMessages = useCallback(async ({ beforeId = null, append = false } = {}) => {
    if (!peer) {
      setMessages([]);
      setLoading(false);
      return;
    }
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
    }
    try {
      const { data } = await getMessages(peer, 30, beforeId || undefined);
      const items = Array.isArray(data?.items) ? data.items : [];
      mergeMessages(items, append ? 'prepend' : 'append');
      setCursor(data?.paging?.next_before_id || null);
      setHasMore(Boolean(data?.paging?.has_more));
      await markMessagesSeen(peer);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'تعذر تحميل المحادثة';
      setError(detail);
      if (!append) pushToast({ type: 'error', title: 'فشل تحميل المحادثة', description: detail });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [mergeMessages, peer, pushToast]);

  useEffect(() => {
    setActivePeer(peer || null);
    return () => setActivePeer(null);
  }, [peer, setActivePeer]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!currentUser || !peer) {
      setSecuritySnapshot(null);
      return undefined;
    }

    let cancelled = false;

    const bootstrapSecurity = async () => {
      try {
        const [myBundle, peerBundle] = await Promise.all([
          signalProtocolService.exportPublicBundle(currentUser),
          signalProtocolService.exportPublicBundle(peer),
        ]);
        await Promise.all([
          signalProtocolService.registerPeerBundle(currentUser, peer, peerBundle),
          signalProtocolService.registerPeerBundle(peer, currentUser, myBundle),
        ]);
        const snapshot = await signalProtocolService.getSecuritySnapshot(currentUser, peer);
        if (!cancelled) setSecuritySnapshot(snapshot);
      } catch (securityError) {
        if (!cancelled) {
          setSecuritySnapshot({ enabled: false, status: 'failed', reason: securityError?.message || 'signal bootstrap failed' });
        }
      }
    };

    bootstrapSecurity();
    return () => {
      cancelled = true;
    };
  }, [currentUser, peer]);

  useEffect(() => {
    if (!peer || !currentUser) return undefined;

    socketManager.connect();
    socketManager.emit('register_user', { user: currentUser }, { skipSignature: true });
    socketManager.emit('join_chat', { peer });
    socketManager.emit('sync_chat_state', { peer });

    const handleNewMessage = async (message) => {
      const related = [message?.sender, message?.receiver].includes(peer) || [message?.sender, message?.receiver].includes(currentUser);
      if (!related) return;
      mergeMessages([message]);
      if (message?.sender === peer) {
        await markMessagesSeen(peer);
      }
    };

    const handleDelivered = (payload) => {
      if (payload?.viewer !== peer) return;
      setMessages((prev) => prev.map((message) => (
        (payload.message_ids || []).includes(message.id) ? { ...message, status: 'delivered' } : message
      )));
    };

    const handleSeen = (payload) => {
      if (payload?.viewer === currentUser && payload?.sender === peer) {
        setMessages((prev) => prev.map((message) => (
          (payload.message_ids || []).includes(message.id) ? { ...message, status: 'seen' } : message
        )));
      }
    };

    const handleTyping = (payload) => {
      if (payload?.sender !== peer) return;
      setPresence((prev) => ({ ...prev, is_typing: Boolean(payload?.is_typing) }));
    };

    const handleRecording = (payload) => {
      if (payload?.sender !== peer) return;
      setPresence((prev) => ({ ...prev, is_recording: Boolean(payload?.is_recording) }));
    };

    const handlePresence = (payload) => {
      if (payload?.user !== peer) return;
      setPresence((prev) => ({
        ...prev,
        is_online: Boolean(payload?.is_online),
        last_seen: payload?.last_seen || prev.last_seen,
      }));
    };

    socketManager.on('new_private_message', handleNewMessage);
    socketManager.on('messages_delivered', handleDelivered);
    socketManager.on('messages_seen', handleSeen);
    socketManager.on('typing_update', handleTyping);
    socketManager.on('recording_update', handleRecording);
    socketManager.on('presence_update', handlePresence);

    return () => {
      socketManager.emit('leave_chat', { peer });
      socketManager.off('new_private_message', handleNewMessage);
      socketManager.off('messages_delivered', handleDelivered);
      socketManager.off('messages_seen', handleSeen);
      socketManager.off('typing_update', handleTyping);
      socketManager.off('recording_update', handleRecording);
      socketManager.off('presence_update', handlePresence);
    };
  }, [currentUser, mergeMessages, peer]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, presence.is_typing, presence.is_recording]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((message) => {
        if (!message?.expires_at) return true;
        return new Date(message.expires_at).getTime() > now;
      }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleSendMessage = useCallback(async (payload) => {
    if (!peer) return;
    const clientId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = payload?.disappearing_in_seconds
      ? new Date(Date.now() + Number(payload.disappearing_in_seconds) * 1000).toISOString()
      : null;

    const optimistic = {
      id: clientId,
      client_id: clientId,
      sender: currentUser,
      receiver: peer,
      content: payload?.text || '',
      message: payload?.text || '',
      media_url: payload?.media_url || '',
      media_urls: payload?.media_urls || [],
      attachments: payload?.attachments || [],
      type: payload?.type || (payload?.media_url ? 'media' : 'text'),
      created_at: new Date().toISOString(),
      status: 'sending',
      replyTo: payload?.replyTo || null,
      security_payload: payload?.securityPayload || null,
      e2ee_state: payload?.securityPayload?.enabled ? 'signal-ready' : 'compat-mode',
      expires_at: expiresAt,
      waveform_seed: payload?.waveform_seed || '',
      audio_duration_seconds: payload?.audio_duration_seconds || null,
    };

    mergeMessages([optimistic]);
    setSending(true);
    try {
      const { data } = await sendMessageApi({
        receiver: peer,
        message: payload?.text || '',
        media_url: payload?.media_url || '',
        media_urls: payload?.media_urls || [],
        attachments: payload?.attachments || [],
        type: payload?.type || (payload?.media_url ? 'media' : 'text'),
        client_id: clientId,
        reply_to: payload?.replyTo?.id || null,
        security_payload: payload?.securityPayload || null,
        disappearing_in_seconds: payload?.disappearing_in_seconds || 0,
        expires_at: expiresAt,
        waveform_seed: payload?.waveform_seed || '',
        audio_duration_seconds: payload?.audio_duration_seconds || null,
      });
      mergeMessages([{ ...data, client_id: clientId, status: 'sent', expires_at: data?.expires_at || expiresAt }]);
      const snapshot = await signalProtocolService.getSecuritySnapshot(currentUser, peer);
      setSecuritySnapshot(snapshot);
    } catch (err) {
      setMessages((prev) => prev.map((message) => (
        String(message.client_id || message.id) === clientId ? { ...message, status: 'failed' } : message
      )));
      throw err;
    } finally {
      setSending(false);
    }
  }, [currentUser, mergeMessages, peer]);

  const handleDeleteForEveryone = async (message) => {
    if (!message?.id || String(message.id).startsWith('chat-')) return;
    try {
      await deleteMessageApi(message.id);
      setMessages((prev) => prev.map((item) => item.id === message.id ? { ...item, deleted: true, content: 'تم حذف الرسالة', message: 'تم حذف الرسالة' } : item));
      pushToast({ type: 'success', title: 'تم حذف الرسالة' });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر حذف الرسالة', description: err?.response?.data?.detail || err?.message });
    }
  };

  const startCall = (mode = 'voice') => {
    if (!peer) return;
    setCallUi({ open: true, incoming: false, mode, callType: 'direct', status: 'connecting', caller: peer });
    pushCallEvent(mode === 'video' ? 'بدأت محاولة مكالمة فيديو.' : 'بدأت محاولة مكالمة صوتية.');
    pushToast({
      type: 'info',
      title: mode === 'video' ? 'جارٍ تجهيز مكالمة الفيديو' : 'جارٍ تجهيز المكالمة الصوتية',
      description: 'واجهة المكالمة مع حالات الاتصال والكتم والكاميرا جاهزة.',
    });
  };

  const simulateIncomingCall = (mode = 'voice') => {
    if (!peer) return;
    setCallUi({ open: false, incoming: true, mode, callType: 'direct', status: 'ringing', caller: peer });
  };

  const acceptIncomingCall = () => {
    setCallUi((prev) => ({ ...prev, open: true, incoming: false, status: 'connecting' }));
    pushCallEvent(callUi.mode === 'video' ? 'تم قبول مكالمة فيديو واردة.' : 'تم قبول مكالمة صوتية واردة.');
  };

  const declineIncomingCall = () => {
    pushCallEvent('تم رفض المكالمة الواردة.');
    setCallUi((prev) => ({ ...prev, open: false, incoming: false, status: 'ended' }));
  };

  const closeCall = () => {
    pushCallEvent('تم إنهاء المكالمة.');
    setCallUi((prev) => ({ ...prev, open: false, incoming: false, status: 'ended' }));
  };

  const presenceLabel = useMemo(() => {
    if (!peer) return 'اختر محادثة';
    if (callUi.incoming) return 'مكالمة واردة الآن';
    if (presence.is_recording) return 'يسجل رسالة صوتية...';
    if (presence.is_typing) return 'يكتب الآن...';
    if (presence.is_online) return 'متصل الآن';
    return presence.last_seen ? `آخر ظهور ${new Date(presence.last_seen).toLocaleString('ar-EG')}` : 'غير متصل';
  }, [callUi.incoming, peer, presence]);

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: 940, margin: '0 auto', padding: 10, position: 'relative' }}>
        <Card style={{ padding: '12px 20px', marginBottom: 10, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                {(peer || '؟').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{peer || 'المحادثة'}</div>
                <div style={{ fontSize: 12, color: callUi.incoming || callUi.open || presence.is_online || presence.is_typing || presence.is_recording ? '#44ff44' : '#a7a7a7' }}>{presenceLabel}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="call-state-pill">{callStateLabel(callUi)}</span>
              {CALL_ACTIONS.map((action) => (
                <Button key={action.id} variant="secondary" onClick={() => startCall(action.mode)} disabled={!peer}>
                  {action.icon} {action.label}
                </Button>
              ))}
              <Button variant="secondary" onClick={() => simulateIncomingCall('voice')} disabled={!peer}>📲 واردة</Button>
              {hasMore ? (
                <Button variant="secondary" onClick={() => loadMessages({ beforeId: cursor, append: true })} loading={loadingMore}>
                  تحميل الأقدم
                </Button>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)' }}>
            <span>🔐 {securitySnapshot?.protocol || 'libsignal primitives'}</span>
            <span>•</span>
            <span>الحالة: {securitySnapshot?.status || 'initializing'}</span>
            <span>•</span>
            <span>PreKeys: {securitySnapshot?.availablePreKeys ?? '--'}</span>
            <span>•</span>
            <span>CDN: {currentMediaProviderLabel()}</span>
            {securitySnapshot?.fingerprint ? <span>• البصمة: {securitySnapshot.fingerprint}</span> : null}
          </div>
        </Card>

        <Card style={{ padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div className="chat-metric-card"><strong>Incoming UI</strong><span>قبول / رفض / رنين</span></div>
            <div className="chat-metric-card"><strong>Call screen</strong><span>حالة الاتصال + timer + network</span></div>
            <div className="chat-metric-card"><strong>Controls</strong><span>mute / speaker / camera / reconnect</span></div>
            <div className="chat-metric-card"><strong>States</strong><span>connecting / connected / fallback / ended</span></div>
          </div>
        </Card>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!peer ? <Card style={{ padding: 24 }}>افتح محادثة من صفحة المستخدمين أو صندوق الوارد.</Card> : null}
          {loading ? <Card style={{ padding: 24 }}>جارٍ تحميل الرسائل...</Card> : null}
          {!loading && error ? (
            <Card style={{ padding: 24 }}>
              <div style={{ marginBottom: 12 }}>{error}</div>
              <Button onClick={() => loadMessages()}>إعادة المحاولة</Button>
            </Card>
          ) : null}

          {!loading && !error && messages.map((msg) => {
            const isMine = msg.sender === currentUser;
            const isSystem = msg.sender === 'system' || msg.type === 'system';
            const messageText = normalizeMessageText(msg);
            return (
              <div key={String(msg.client_id || msg.id)} style={{ alignSelf: isSystem ? 'center' : isMine ? 'flex-end' : 'flex-start', maxWidth: isSystem ? '90%' : '78%' }}>
                <div style={{ background: isSystem ? 'rgba(59,130,246,0.12)' : isMine ? 'var(--primary)' : 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: isSystem ? '999px' : isMine ? '18px 18px 2px 18px' : '18px 18px 18px 2px', color: 'white', border: isSystem ? '1px solid rgba(59,130,246,0.22)' : 'none' }}>
                  {msg.replyTo ? <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6, borderInlineStart: '2px solid rgba(255,255,255,0.35)', paddingInlineStart: 8 }}>رد على رسالة</div> : null}
                  {renderMediaBlock(msg)}
                  <div style={{ fontSize: isSystem ? 13 : 15, whiteSpace: 'pre-wrap' }}>{messageText}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{formatTime(msg.created_at)}</div>
                    {!isSystem ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
                        {msg.e2ee_state ? <span style={{ opacity: 0.8 }}>🔐 {msg.e2ee_state}</span> : null}
                        {msg.expires_at ? <span style={{ color: '#fcd34d' }}>⏳ {expirationLabel(msg.expires_at)}</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                {!isSystem ? (
                  <div style={{ display: 'flex', gap: 8, justifyContent: isMine ? 'flex-end' : 'flex-start', marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setReplyTo(msg)} style={{ background: 'none', border: 'none', color: '#8f8f8f', cursor: 'pointer', fontSize: 12 }}>رد</button>
                    {isMine ? <span style={{ fontSize: 11, color: msg.status === 'failed' ? '#ff8a8a' : '#8f8f8f' }}>{statusLabel(msg.status)}</span> : null}
                    {isMine && !msg.deleted ? <button type="button" onClick={() => handleDeleteForEveryone(msg)} style={{ background: 'none', border: 'none', color: '#ff8888', cursor: 'pointer', fontSize: 12 }}>حذف للكل</button> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
          {presence.is_recording ? <div style={{ fontSize: 12, color: '#f9a8d4' }}>{peer} يسجل رسالة صوتية...</div> : null}
          {presence.is_typing ? <div style={{ fontSize: 12, color: '#8f8f8f' }}>{peer} يكتب الآن...</div> : null}
          <div ref={scrollRef} />
        </div>

        {peer ? (
          <ChatInput
            currentUser={currentUser}
            peer={peer}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onSend={handleSendMessage}
            sending={sending}
            securitySnapshot={securitySnapshot}
          />
        ) : null}

        {callUi.incoming ? (
          <div className="incoming-call-overlay">
            <div className="incoming-call-card">
              <div className="incoming-avatar">{(callUi.caller || peer || 'U').slice(0, 1).toUpperCase()}</div>
              <div style={{ fontSize: 13, opacity: 0.72 }}>Incoming call</div>
              <h3 style={{ margin: '4px 0 0', fontSize: 28 }}>{callUi.caller || peer}</h3>
              <div style={{ opacity: 0.84 }}>{callUi.mode === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة'}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <span className="call-state-pill">ringing</span>
                <span className="call-state-pill">swipe-like actions</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginTop: 18 }}>
                <Button variant="danger" onClick={declineIncomingCall}>رفض</Button>
                <Button variant="success" onClick={acceptIncomingCall}>قبول</Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={callUi.open}
        onClose={closeCall}
        title={callUi.mode === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}
        size="large"
      >
        <CallExperience
          open={callUi.open}
          mode={callUi.mode}
          callType={callUi.callType}
          participantName={callUi.caller || peer || 'المستخدم'}
          onClose={closeCall}
          onStatusChange={(status) => setCallUi((prev) => ({ ...prev, status, incoming: false }))}
        />
      </Modal>

      <style>{`
        .chat-metric-card {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.12);
          font-size: 13px;
        }
        .call-state-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 12px;
        }
        .incoming-call-overlay {
          position: fixed;
          inset: 0;
          z-index: 1600;
          background: rgba(2, 6, 23, 0.78);
          backdrop-filter: blur(16px);
          display: grid;
          place-items: center;
          padding: 20px;
        }
        .incoming-call-card {
          width: min(420px, 100%);
          border-radius: 28px;
          padding: 24px;
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96));
          color: white;
          display: grid;
          justify-items: center;
          gap: 10px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.34);
        }
        .incoming-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          box-shadow: 0 20px 50px rgba(59,130,246,0.3);
        }
        @media (max-width: 720px) {
          .chat-metric-card {
            flex-direction: column;
          }
        }
      `}</style>
    </MainLayout>
  );
}
