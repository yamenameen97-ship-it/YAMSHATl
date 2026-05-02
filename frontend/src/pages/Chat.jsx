import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Card from '../components/ui/Card.jsx';
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

function mergeMessages(current, incoming) {
  const map = new Map();
  [...current, ...incoming].forEach((message) => {
    const key = message?.id || message?.client_id;
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...message });
  });
  return [...map.values()].sort((a, b) => (a.id || 0) - (b.id || 0));
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const otherUser = decodeURIComponent(userId || '');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(Boolean(otherUser));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [presence, setPresence] = useState({ is_online: false, last_seen: null });
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

  const headerState = useMemo(() => {
    if (!otherUser) return 'اختر محادثة من صندوق الوارد أو من صفحة المستخدمين.';
    if (typing) return 'يكتب الآن...';
    if (presence?.is_online) return '🟢 متصل الآن';
    if (presence?.last_seen) {
      return `آخر ظهور ${new Date(presence.last_seen).toLocaleString('ar-EG')}`;
    }
    return '⚫ غير متصل';
  }, [otherUser, presence, typing]);

  useEffect(() => {
    if (!otherUser) return undefined;

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        await updateOnline(true);
        const [messagesRes, presenceRes] = await Promise.all([
          getMessages(otherUser, 100),
          getPresence(otherUser),
        ]);
        if (!mounted) return;
        setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
        setPresence(presenceRes.data || { is_online: false, last_seen: null });
        await markMessagesSeen(otherUser);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'تعذر تحميل المحادثة.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!socket.connected) socket.connect();
    socket.emit('join_chat', { token, user: currentUser, peer: otherUser });

    const handleNewMessage = (message) => {
      const participants = [message?.sender, message?.receiver];
      if (!participants.includes(currentUser) || !participants.includes(otherUser)) return;
      setMessages((prev) => mergeMessages(prev, [message]));
      if (message?.sender === otherUser) {
        markMessagesSeen(otherUser).catch(() => {});
      }
    };

    const handleDelivered = (payload) => {
      if (payload?.sender !== currentUser || payload?.viewer !== otherUser) return;
      setMessages((prev) =>
        prev.map((message) =>
          payload.message_ids?.includes(message.id)
            ? { ...message, status: 'delivered' }
            : message
        )
      );
    };

    const handleSeen = (payload) => {
      if (payload?.sender !== currentUser || payload?.viewer !== otherUser) return;
      setMessages((prev) =>
        prev.map((message) =>
          payload.message_ids?.includes(message.id) ? { ...message, status: 'seen' } : message
        )
      );
    };

    const handlePresence = (payload) => {
      if (payload?.user !== otherUser) return;
      setPresence(payload);
    };

    const handleTyping = (payload) => {
      if (payload?.sender === otherUser && payload?.receiver === currentUser) {
        setTyping(Boolean(payload?.is_typing));
      }
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

    load();

    return () => {
      mounted = false;
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleTypingChange = (value) => {
    setText(value);
    if (!otherUser) return;

    socket.emit('chat_typing', {
      sender: currentUser,
      receiver: otherUser,
      is_typing: true,
    });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('chat_typing', {
        sender: currentUser,
        receiver: otherUser,
        is_typing: false,
      });
    }, 1200);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('مسموح فقط برفع الصور داخل هذه الواجهة.');
      return;
    }
    setError('');
    setImage(file);
  };

  const handleSend = async () => {
    if (!otherUser || sending) return;
    if (!text.trim() && !image) return;

    setSending(true);
    setError('');

    try {
      let mediaUrl = '';
      let type = 'text';

      if (image) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', image);
        const { data } = await uploadMedia(formData);
        mediaUrl = data?.file_url || data?.url || '';
        type = 'image';
      }

      const client_id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const payload = {
        receiver: otherUser,
        message: text.trim(),
        media_url: mediaUrl,
        type,
        client_id,
      };

      const { data } = await sendMessageApi(payload);
      const saved = data?.data || data;
      setMessages((prev) => mergeMessages(prev, [saved]));
      setText('');
      setImage(null);
      socket.emit('chat_typing', {
        sender: currentUser,
        receiver: otherUser,
        is_typing: false,
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إرسال الرسالة.');
    } finally {
      setUploading(false);
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessageApi(messageId);
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر حذف الرسالة.');
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
            <Button variant="secondary" onClick={() => navigate('/inbox')}>
              الرجوع للـ Inbox
            </Button>
          </div>

          {error ? <div className="alert error">{error}</div> : null}

          <div className="messages-shell">
            {loading ? <div className="empty-state">جارٍ تحميل الرسائل...</div> : null}
            {!loading && messages.length === 0 ? (
              <div className="empty-state">ابدأ أول رسالة الآن.</div>
            ) : null}

            {messages.map((message) => {
              const mine = message.sender === currentUser;
              const content = message.message || message.content;
              return (
                <div key={message.id || message.client_id} className={`message-row ${mine ? 'mine' : ''}`}>
                  <div className={`message-bubble ${mine ? 'mine' : 'other'} ${message.deleted ? 'deleted' : ''}`}>
                    {content ? <p>{content}</p> : null}
                    {message.media_url ? (
                      <img src={message.media_url} alt="attachment" className="message-image" />
                    ) : null}
                    <div className="message-meta">
                      <span>
                        {message.created_at
                          ? new Date(message.created_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                      {mine ? (
                        <span className={`status-text ${message.status || 'sent'}`}>
                          {message.status === 'seen' ? '✔✔' : message.status === 'delivered' ? '✔✔' : '✔'}
                        </span>
                      ) : null}
                      {mine && !message.deleted ? (
                        <button type="button" className="mini-action" onClick={() => handleDelete(message.id)}>
                          حذف
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {typing ? <div className="typing-indicator">✍️ المستخدم يكتب الآن...</div> : null}
            <div ref={bottomRef} />
          </div>

          <div className="composer">
            {image ? (
              <div className="preview-box">
                <img src={URL.createObjectURL(image)} alt="preview" className="preview-image" />
                <button type="button" className="mini-action" onClick={() => setImage(null)}>
                  إزالة
                </button>
              </div>
            ) : null}

            <Input
              label="نص الرسالة"
              placeholder="اكتب رسالتك هنا..."
              value={text}
              onChange={(e) => handleTypingChange(e.target.value)}
            />

            <div className="composer-actions">
              <label className="upload-label">
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                إضافة صورة
              </label>
              <Button onClick={handleSend} disabled={sending || uploading}>
                {uploading ? 'جارٍ رفع الصورة...' : sending ? 'جارٍ الإرسال...' : 'إرسال'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
