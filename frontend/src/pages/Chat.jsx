import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  deleteMessageApi,
  getMessages,
  getPresence,
  markMessagesSeen,
  sendMessageApi,
  updateOnline,
  uploadMedia,
} from '../api/chat.js';
import socket from '../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { useAppStore } from '../store/appStore.js';

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

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const otherUser = decodeURIComponent(userId || '');
  const isOnline = useAppStore((state) => state.isOnline);
  const setUploadProgress = useAppStore((state) => state.setUploadProgress);
  const clearUploadProgress = useAppStore((state) => state.clearUploadProgress);
  const uploadProgress = useAppStore((state) => state.uploadProgress.chatComposer || 0);
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
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const retryQueueRef = useRef([]);

  const headerState = useMemo(() => {
    if (!otherUser) return 'اختر محادثة من صندوق الوارد أو من صفحة المستخدمين.';
    if (typing) return 'يكتب الآن...';
    if (presence?.is_online) return '🟢 متصل الآن';
    if (presence?.last_seen) return `آخر ظهور ${new Date(presence.last_seen).toLocaleString('ar-EG')}`;
    return '⚫ غير متصل';
  }, [otherUser, presence, typing]);

  const loadMessages = async ({ reset = false } = {}) => {
    if (!otherUser) return;
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError('');
      await updateOnline(true);
      const beforeId = !reset && messages.length ? messages[0]?.id : undefined;
      const [messagesRes, presenceRes] = await Promise.all([
        getMessages(otherUser, 40, beforeId),
        getPresence(otherUser),
      ]);
      const nextMessages = Array.isArray(messagesRes.data) ? messagesRes.data : [];
      setMessages((prev) => (reset ? nextMessages : mergeMessages(nextMessages, prev)));
      setHasMore(nextMessages.length >= 40);
      setPresence(presenceRes.data || { is_online: false, last_seen: null });
      await markMessagesSeen(otherUser);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل المحادثة.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!otherUser) return undefined;

    if (!socket.connected) socket.connect();
    socket.emit('join_chat', { token, user: currentUser, peer: otherUser });

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
    };

    const handleTyping = (payload) => {
      if (payload?.sender === otherUser && payload?.receiver === currentUser) setTyping(Boolean(payload?.is_typing));
    };

    const handleDeleted = (payload) => {
      if (![payload?.sender, payload?.receiver].includes(currentUser)) return;
      setMessages((prev) => prev.map((message) => (message.id === payload.id ? { ...message, ...payload } : message)));
    };

    socket.on('new_private_message', handleNewMessage);
    socket.on('messages_delivered', handleDelivered);
    socket.on('messages_seen', handleSeen);
    socket.on('presence_update', handlePresence);
    socket.on('typing_update', handleTyping);
    socket.on('message_deleted', handleDeleted);

    loadMessages({ reset: true });

    return () => {
      socket.emit('leave_chat', { user: currentUser, peer: otherUser });
      socket.off('new_private_message', handleNewMessage);
      socket.off('messages_delivered', handleDelivered);
      socket.off('messages_seen', handleSeen);
      socket.off('presence_update', handlePresence);
      socket.off('typing_update', handleTyping);
      socket.off('message_deleted', handleDeleted);
    };
  }, [currentUser, otherUser, token]);

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
    if (!showJumpLatest) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, showJumpLatest]);

  useEffect(() => {
    if (!isOnline || retryQueueRef.current.length === 0) return;
    const queued = [...retryQueueRef.current];
    retryQueueRef.current = [];
    queued.forEach((job) => job());
  }, [isOnline]);

  const handleTypingChange = (value) => {
    setText(value);
    if (!otherUser) return;
    socket.emit('chat_typing', { sender: currentUser, receiver: otherUser, is_typing: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('chat_typing', { sender: currentUser, receiver: otherUser, is_typing: false });
    }, 1200);
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
  };

  const clearComposerMedia = () => {
    setAttachment(null);
    clearUploadProgress('chatComposer');
  };

  const sendPayload = async (preparedAttachment = attachment) => {
    let mediaUrl = '';
    let type = preparedAttachment ? inferMessageType(preparedAttachment) : 'text';

    if (preparedAttachment) {
      const formData = new FormData();
      formData.append('file', preparedAttachment);
      const { data } = await uploadMedia(formData, (event) => {
        const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
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
      socket.emit('chat_typing', { sender: currentUser, receiver: otherUser, is_typing: false });
    } catch (err) {
      setMessages((prev) => prev.map((item) => item.client_id === client_id ? { ...item, status: 'failed', error: true } : item));
      pushToast({ type: 'warning', title: 'فشل الإرسال', description: 'يمكنك إعادة المحاولة من نفس الرسالة.' });
    } finally {
      setSending(false);
      clearUploadProgress('chatComposer');
    }
  };

  const handleSend = async () => {
    if (!otherUser || sending) return;
    if (!text.trim() && !attachment) return;
    setSending(true);
    setError('');

    if (!isOnline) {
      retryQueueRef.current.push(() => sendPayload(attachment));
      setSending(false);
      pushToast({ type: 'info', title: 'أوفلاين', description: 'تم تجهيز الرسالة للإرسال تلقائياً عند رجوع الإنترنت.' });
      return;
    }

    await sendPayload(attachment);
  };

  const retryMessage = async (message) => {
    setMessages((prev) => prev.filter((item) => item.client_id !== message.client_id));
    setText(message.message || '');
    pushToast({ type: 'info', title: 'إعادة المحاولة', description: 'تمت إعادة الرسالة إلى صندوق الكتابة.' });
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
      pushToast({ type: 'warning', title: 'تعذر الوصول للمايك', description: 'تأكد من صلاحيات التسجيل.' });
    }
  };

  if (!otherUser) {
    return (
      <MainLayout>
        <Card className="empty-card">
          <h3 className="section-title">اختر محادثة</h3>
          <p className="muted">ابدأ من صندوق الوارد أو افتح صفحة المستخدمين لاختيار شخص للمحادثة الخاصة.</p>
          <Button onClick={() => navigate('/inbox')}>فتح Inbox</Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="chat-layout">
        <Card className="chat-panel">
          <div className="chat-header">
            <div className="chat-user-block">
              <div className="avatar-circle large">{otherUser.slice(0, 1).toUpperCase()}</div>
              <div>
                <h3 className="section-title no-margin">{otherUser}</h3>
                <div className="muted">{headerState}</div>
              </div>
            </div>
            <div className="chat-header-actions">
              <Button variant="secondary" onClick={() => navigate('/inbox')}>الرجوع للـ Inbox</Button>
              {showJumpLatest ? <Button onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}>أحدث رسالة</Button> : null}
            </div>
          </div>

          {error ? <div className="alert error">{error}</div> : null}
          {!isOnline ? <div className="alert warning">أنت حالياً بدون إنترنت. سيتم تأجيل الإرسال وإعادة المحاولة تلقائياً.</div> : null}

          <div className="messages-shell" ref={messagesRef}>
            {hasMore ? <button type="button" className="mini-action load-more-btn" onClick={() => loadMessages()} disabled={loadingMore}>{loadingMore ? 'جارٍ التحميل...' : 'تحميل رسائل أقدم'}</button> : null}
            {loading ? <div className="empty-state">جارٍ تحميل الرسائل...</div> : null}
            {!loading && messages.length === 0 ? (
              <EmptyState icon="✉️" title="ابدأ أول رسالة" description="المحادثة فارغة حتى الآن." />
            ) : null}

            {messages.map((message) => {
              const mine = message.sender === currentUser;
              const content = message.message || message.content;
              const mediaUrl = message.media_url || message.preview_url;
              return (
                <div key={message.id || message.client_id} className={`message-row ${mine ? 'mine' : ''}`}>
                  <div className={`message-bubble ${mine ? 'mine' : 'other'} ${message.deleted ? 'deleted' : ''}`}>
                    {content ? <p>{content}</p> : null}
                    {message.type === 'image' && mediaUrl ? <img src={mediaUrl} alt="attachment" className="message-image" /> : null}
                    {message.type === 'audio' && mediaUrl ? <audio src={mediaUrl} controls className="message-audio" /> : null}
                    {message.type === 'video' && mediaUrl ? <video src={mediaUrl} controls className="message-video" /> : null}
                    {message.type === 'file' && mediaUrl ? <a href={mediaUrl} target="_blank" rel="noreferrer" className="mini-action">فتح المرفق</a> : null}
                    <div className="message-meta">
                      <span>
                        {message.created_at ? new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {mine ? (
                        <span className={`status-text ${message.status || 'sent'}`}>
                          {message.status === 'failed' ? 'فشل' : message.status === 'seen' ? '✔✔' : message.status === 'delivered' ? '✔✔' : message.status === 'sending' ? '...' : '✔'}
                        </span>
                      ) : null}
                      {message.status === 'failed' ? <button type="button" className="mini-action" onClick={() => retryMessage(message)}>إعادة المحاولة</button> : null}
                      {mine && message.id && !message.deleted ? <button type="button" className="mini-action" onClick={() => handleDelete(message.id)}>حذف</button> : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {typing ? <div className="typing-indicator">✍️ المستخدم يكتب الآن...</div> : null}
            <div ref={bottomRef} />
          </div>

          <div className="composer">
            {attachment ? (
              <div className="attachment-preview-card">
                <strong>{attachment.name}</strong>
                <div className="muted">{inferMessageType(attachment)}</div>
                <button type="button" className="mini-action" onClick={clearComposerMedia}>إزالة</button>
              </div>
            ) : null}

            {uploadProgress > 0 ? (
              <div className="upload-progress-shell compact-upload-progress">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span>{uploadProgress}%</span>
              </div>
            ) : null}

            <Input value={text} onChange={(event) => handleTypingChange(event.target.value)} placeholder="اكتب رسالة..." />
            <div className="composer-actions wrap-composer-actions">
              <label className="upload-label">
                📎 مرفق
                <input type="file" hidden accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleAttachmentChange} />
              </label>
              <button type="button" className={`mini-action ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
                {isRecording ? '⏹ إيقاف التسجيل' : '🎙 تسجيل صوتي'}
              </button>
              <Button onClick={handleSend} disabled={sending}>{sending ? 'جارٍ الإرسال...' : 'إرسال'}</Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
