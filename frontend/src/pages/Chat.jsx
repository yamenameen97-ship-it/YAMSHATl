import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import CallExperience from '../components/chat/CallExperience.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getChatThreads, getMessages, markMessagesSeen, sendMessageApi } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';

function formatMessageTime(value) {
  if (!value) return 'الآن';
  try {
    return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'الآن';
  }
}

export default function Chat() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const peer = decodeURIComponent(userId || '').trim();
  const currentUser = getCurrentUsername();
  const { pushToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(Boolean(peer));
  const [presence, setPresence] = useState({ is_online: false, is_typing: false });
  const [callState, setCallState] = useState({ open: false, mode: 'voice', callType: 'direct', status: 'idle' });

  const { data: threads = [], refetch: refetchThreads } = useQuery({
    queryKey: ['chat-threads-sidebar'],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return data || [];
    },
  });

  const activeThread = useMemo(() => threads.find((thread) => String(thread.username) === String(peer)) || null, [threads, peer]);

  const loadMessages = async () => {
    if (!peer) return;
    setLoadingMessages(true);
    try {
      const { data } = await getMessages(peer, 80);
      const items = data?.items || data || [];
      setMessages(Array.isArray(items) ? items : []);
      await markMessagesSeen(peer);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل الرسائل', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [peer]);

  useEffect(() => {
    if (!peer) return undefined;
    socketManager.connect?.();

    const handleNewMessage = (payload) => {
      const sender = payload?.sender || payload?.username;
      const receiver = payload?.receiver;
      if (String(sender) === String(peer) || String(receiver) === String(peer)) {
        setMessages((prev) => [...prev, payload]);
        if (String(sender) === String(peer)) markMessagesSeen(peer).catch(() => null);
      }
    };

    const handlePresence = (payload) => {
      if (!payload || String(payload.username) !== String(peer)) return;
      setPresence({
        is_online: Boolean(payload.is_online),
        is_typing: Boolean(payload.is_typing),
      });
    };

    socketManager.on?.('new_private_message', handleNewMessage);
    socketManager.on?.('presence_update', handlePresence);

    return () => {
      socketManager.off?.('new_private_message', handleNewMessage);
      socketManager.off?.('presence_update', handlePresence);
    };
  }, [peer]);

  const handleSend = async (content) => {
    const text = typeof content === 'string' ? content.trim() : '';
    if (!peer || !text) return;

    const optimistic = {
      id: `temp-${Date.now()}`,
      sender: currentUser,
      receiver: peer,
      content: text,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessageApi({ receiver: peer, content: text });
      setMessages((prev) => prev.map((item) => item.id === optimistic.id ? { ...item, status: 'sent' } : item));
      refetchThreads();
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
      pushToast({ type: 'error', title: 'فشل إرسال الرسالة', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    }
  };

  const startCall = (mode, callType) => {
    setCallState({ open: true, mode, callType, status: 'connecting' });
  };

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide">
        <div className="yam-hero" style={{ marginBottom: 22 }}>
          <div className="yam-toolbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="yam-badge primary" style={{ marginBottom: 12 }}>💬 المحادثة</div>
              <h1 className="yam-section-title">واجهة الدردشة الجديدة</h1>
              <p className="yam-section-note" style={{ margin: '10px 0 0' }}>
                تم استبدال شكل شاشة المحادثة مع الحفاظ على نفس خدمات جلب الرسائل، الإرسال، وتحديث حالة القراءة.
              </p>
            </div>
            <div className="yam-action-row">
              <Button variant="secondary" onClick={() => loadMessages()} loading={loadingMessages} disabled={!peer}>تحديث</Button>
            </div>
          </div>
        </div>

        <div className="yam-split-chat">
          <aside className="yam-card">
            <div className="yam-toolbar">
              <h3 style={{ margin: 0 }}>المحادثات</h3>
              <span className="yam-badge">{threads.length}</span>
            </div>
            <div className="yam-list">
              {threads.length ? threads.map((thread) => (
                <button
                  key={thread.username}
                  type="button"
                  className={`yam-thread ${peer === thread.username ? 'active' : ''}`}
                  style={{ cursor: 'pointer', textAlign: 'inherit' }}
                  onClick={() => navigate(`/chat/${encodeURIComponent(thread.username)}`)}
                >
                  <div style={{ position: 'relative' }}>
                    <div className="yam-avatar">{thread.username?.slice(0, 1)?.toUpperCase() || 'U'}</div>
                    {thread.presence?.is_online ? (
                      <span style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#22c55e', bottom: 2, insetInlineEnd: 2, border: '2px solid #08111f' }} />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <strong>@{thread.username}</strong>
                      <span className="yam-meta" style={{ fontSize: 12 }}>{formatMessageTime(thread.last_message_at)}</span>
                    </div>
                    <div className="yam-meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.last_message || 'ابدأ المحادثة'}
                    </div>
                  </div>
                  {Number(thread.unread_count || 0) > 0 ? <span className="yam-pill-count">{thread.unread_count}</span> : null}
                </button>
              )) : <div className="yam-empty-copy">لا توجد محادثات حالياً.</div>}
            </div>
          </aside>

          <section className="yam-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 680 }}>
            {peer ? (
              <>
                <div className="yam-toolbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="yam-avatar">{peer.slice(0, 1).toUpperCase()}</div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>@{peer}</strong>
                      <span className="yam-meta">{presence.is_typing ? 'يكتب الآن...' : presence.is_online || activeThread?.presence?.is_online ? 'متصل الآن' : 'غير متصل'}</span>
                    </div>
                  </div>

                  <div className="yam-action-row">
                    <Button variant="secondary" size="small" onClick={() => startCall('voice', 'direct')}>📞 صوتي</Button>
                    <Button variant="secondary" size="small" onClick={() => startCall('video', 'direct')}>🎥 فيديو</Button>
                    <Button variant="secondary" size="small" onClick={() => startCall('video', 'group')}>👥 جماعي</Button>
                  </div>
                </div>

                <div className="yam-soft-divider" />

                <div className="yam-messages" style={{ flex: 1, maxHeight: 'none' }}>
                  {loadingMessages ? (
                    <div className="yam-empty-copy">جارٍ تحميل الرسائل...</div>
                  ) : messages.length ? messages.map((message) => {
                    const isMine = String(message.sender) === String(currentUser);
                    return (
                      <div key={message.id || `${message.sender}-${message.created_at}`} className={`yam-message ${isMine ? 'me' : 'peer'}`}>
                        <div>{message.content || message.message || message.text || ''}</div>
                        <div className="yam-meta" style={{ fontSize: 12, marginTop: 8 }}>
                          {formatMessageTime(message.created_at)}{message.status ? ` · ${message.status}` : ''}
                        </div>
                      </div>
                    );
                  }) : <div className="yam-empty-copy">ابدأ أول رسالة في هذه المحادثة.</div>}
                </div>

                <div className="yam-soft-divider" />

                <ChatInput onSend={handleSend} />
              </>
            ) : (
              <div className="yam-empty-state" style={{ minHeight: 420, display: 'grid', placeItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💭</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>اختر محادثة من القائمة الجانبية</div>
                  <div className="yam-empty-copy">أو افتح الإنبوكس لبدء رسالة جديدة.</div>
                </div>
              </div>
            )}
          </section>
        </div>

        <Modal
          open={callState.open}
          onClose={() => setCallState((prev) => ({ ...prev, open: false, status: 'ended' }))}
          title={callState.callType === 'group' ? 'مكالمة جماعية' : callState.mode === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}
          size="large"
        >
          <CallExperience
            open={callState.open}
            mode={callState.mode}
            callType={callState.callType}
            participantName={peer || 'مستخدم'}
            onClose={() => setCallState((prev) => ({ ...prev, open: false, status: 'ended' }))}
            onStatusChange={(status) => setCallState((prev) => ({ ...prev, status }))}
          />
        </Modal>
      </div>
    </MainLayout>
  );
}
