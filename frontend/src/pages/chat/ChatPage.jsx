import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
import MessageBubble from '../../components/chat/MessageBubble.jsx';
import ChatInput from '../../components/chat/ChatInput.jsx';
import CallExperience from '../../components/chat/CallExperience.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';

const GROUP_MEMBERS = ['أنت', 'سارة', 'أحمد', 'نور'];

export default function ChatPage() {
  const { userId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername() || 'أنا';
  const otherUser = userId || 'User';
  const scrollRef = useRef(null);
  const [messages, setMessages] = useState([
    { id: 1, sender: otherUser, text: 'أهلاً بك في يمشات! جاهز للمكالمات الصوتية والفيديو.', time: '10:00 ص', type: 'text', status: 'seen' },
    { id: 2, sender: currentUser, text: 'تمام، خلّينا نجهز الاتصال مع إعادة اتصال تلقائي.', time: '10:01 ص', type: 'text', status: 'seen' },
  ]);
  const [isE2EEnabled, setIsE2EEnabled] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [callState, setCallState] = useState({ open: false, mode: 'voice', callType: 'direct', status: 'idle' });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const smartActions = useMemo(() => [
    { id: 'voice', label: 'Voice', icon: '📞', mode: 'voice', callType: 'direct' },
    { id: 'video', label: 'Video', icon: '🎥', mode: 'video', callType: 'direct' },
    { id: 'group', label: 'Group', icon: '👥', mode: 'video', callType: 'group' },
  ], []);

  const pushSystemMessage = (text) => {
    setMessages((prev) => ([
      ...prev,
      {
        id: Date.now(),
        sender: 'system',
        text,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
        status: 'sent',
      },
    ]));
  };

  const handleSendMessage = (text, type = 'text', metadata = {}) => {
    if (!text?.trim?.() && type === 'text') return;
    const nextMessage = {
      id: Date.now(),
      sender: currentUser,
      text: isE2EEnabled && type === 'text' ? `🔒 ${text}` : text,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type,
      isE2E: isE2EEnabled,
      replyTo,
      status: 'sending',
      ...metadata,
    };

    setMessages((prev) => [...prev, nextMessage]);
    setReplyTo(null);

    window.setTimeout(() => {
      setMessages((prev) => prev.map((item) => (item.id === nextMessage.id ? { ...item, status: 'delivered' } : item)));
    }, 600);
  };

  const startCall = (mode, callType) => {
    setCallState({ open: true, mode, callType, status: 'connecting' });
    pushToast({
      type: 'info',
      title: callType === 'group' ? 'جارٍ تجهيز المكالمة الجماعية' : mode === 'video' ? 'جارٍ تجهيز مكالمة الفيديو' : 'جارٍ تجهيز المكالمة الصوتية',
      description: 'WebRTC + STUN/TURN + reconnect UI جاهزين على الواجهة.',
    });
    pushSystemMessage(callType === 'group'
      ? 'تم إنشاء غرفة مكالمة جماعية مع جاهزية mute / speaker / camera switch / reconnect.'
      : mode === 'video'
        ? 'تم إنشاء جلسة مكالمة فيديو جديدة.'
        : 'تم إنشاء جلسة مكالمة صوتية جديدة.');
  };

  const closeCall = () => {
    setCallState((prev) => ({ ...prev, open: false, status: 'ended' }));
    pushSystemMessage('تم إنهاء المكالمة.');
  };

  return (
    <MainLayout>
      <div
        style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: 980, margin: '0 auto', padding: 10, position: 'relative', gap: 12 }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const files = event.dataTransfer.files;
          if (files?.length) handleSendMessage(`أرسلت ${files.length} ملف`, 'media', { fileCount: files.length });
        }}
      >
        <Card style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={`https://ui-avatars.com/api/?name=${otherUser}`} style={{ width: 46, height: 46, borderRadius: '50%' }} alt={otherUser} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 17 }}>{otherUser}</div>
              <div style={{ fontSize: 12, color: '#22c55e' }}>{callState.status === 'connected' ? 'في مكالمة حالياً' : 'متصل الآن'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {smartActions.map((action) => (
              <Button key={action.id} variant="secondary" onClick={() => startCall(action.mode, action.callType)}>
                {action.icon} {action.label}
              </Button>
            ))}
            <Button variant="secondary" onClick={() => setShowGallery((prev) => !prev)}>🖼️ الوسائط</Button>
            <Button variant={isE2EEnabled ? 'success' : 'warning'} onClick={() => setIsE2EEnabled((prev) => !prev)}>
              {isE2EEnabled ? '🛡️ E2E On' : '🔓 E2E Off'}
            </Button>
          </div>
        </Card>

        <Card style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div className="chat-metric-card"><strong>Voice / Video</strong><span>جاهزين للـ UI</span></div>
            <div className="chat-metric-card"><strong>Group calls</strong><span>{GROUP_MEMBERS.length} أعضاء تجريبيين</span></div>
            <div className="chat-metric-card"><strong>WebRTC</strong><span>STUN + TURN config</span></div>
            <div className="chat-metric-card"><strong>Recovery</strong><span>Reconnect + fallback state</span></div>
          </div>
        </Card>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 15 }}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.sender === currentUser}
              onReply={() => setReplyTo(message)}
            />
          ))}
          <div ref={scrollRef} />
        </div>

        <ChatInput replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSend={handleSendMessage} />

        {showGallery ? (
          <div style={{ position: 'absolute', insetInlineEnd: 0, top: 80, bottom: 0, width: 280, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)', borderInlineStart: '1px solid rgba(255,255,255,0.08)', padding: 16, zIndex: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>الوسائط المشتركة</h3>
              <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} style={{ aspectRatio: '1 / 1', borderRadius: 14, background: `linear-gradient(135deg, rgba(59,130,246,${0.2 + index * 0.04}), rgba(168,85,247,0.45))`, display: 'grid', placeItems: 'center' }}>
                  📎
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={callState.open}
        onClose={closeCall}
        title={callState.callType === 'group' ? 'غرفة مكالمة جماعية' : callState.mode === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}
        size="large"
      >
        <CallExperience
          open={callState.open}
          mode={callState.mode}
          callType={callState.callType}
          participantName={otherUser}
          onClose={closeCall}
          onStatusChange={(status) => setCallState((prev) => ({ ...prev, status }))}
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
        @media (max-width: 720px) {
          .chat-metric-card {
            flex-direction: column;
          }
        }
      `}</style>
    </MainLayout>
  );
}
