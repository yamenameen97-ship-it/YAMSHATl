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

// قائمة جهات الاتصال (مثل تصميمك)
const CONTACTS = [
  { id: 1, name: 'سارة احمد', status: 'online', lastSeen: null, avatar: 'س', username: '@sara_ahmed', email: 'sara.a@example.com', phone: '+966 50 123 4567' },
  { id: 2, name: 'محمد علي', status: 'online', lastSeen: null, avatar: 'م', username: '@mohamed_ali', email: 'mohamed.a@example.com', phone: '+966 50 234 5678' },
  { id: 3, name: 'فاطمة خالد', status: 'offline', lastSeen: 'منذ دقيقة', avatar: 'ف', username: '@fatima_khaled', email: 'fatima.k@example.com', phone: '+966 50 123 4567' },
  { id: 4, name: 'أحمد وليد', status: 'offline', lastSeen: 'منذ 10 دقائق', avatar: 'أ', username: '@ahmed_waleed', email: 'ahmed.w@example.com', phone: '+966 50 345 6789' },
  { id: 5, name: 'نور ياسر', status: 'offline', lastSeen: 'منذ ساعة', avatar: 'ن', username: '@noor_yasser', email: 'noor.y@example.com', phone: '+966 50 456 7890' },
];

export default function ChatPage() {
  const { userId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername() || 'أنا';
  const otherUser = userId || 'سارة احمد';
  const scrollRef = useRef(null);
  const [messages, setMessages] = useState([
    { id: 1, sender: otherUser, text: 'أهلاً بك في يمشات! جاهز للمكالمات الصوتية والفيديو.', time: '10:00 ص', type: 'text', status: 'seen' },
    { id: 2, sender: currentUser, text: 'تمام، خلّينا نجهز الاتصال مع إعادة اتصال تلقائي.', time: '10:01 ص', type: 'text', status: 'seen' },
  ]);
  const [isE2EEnabled, setIsE2EEnabled] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // شريط المعلومات الجانبي
  const [selectedContact, setSelectedContact] = useState(CONTACTS.find(c => c.name === otherUser) || CONTACTS[0]);
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

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    // هنا يمكنك إضافة منطق تغيير المحادثة
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: 0, background: '#f0f2f5' }}>
        
        {/* القائمة الجانبية لجهات الاتصال (محسنة حسب تصميمك) */}
        <div style={{ width: 320, background: 'white', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid #f0f2f5' }}>
            <h2 style={{ fontSize: 24, marginBottom: 15, color: '#1a1a1a' }}>الدرشات</h2>
            <div style={{ display: 'flex', gap: 20 }}>
              {['المجموعات', 'الأصدقاء', 'الإشعارات', 'الإعدادات'].map(tab => (
                <span key={tab} style={{ color: '#667781', cursor: 'pointer', fontSize: 14 }}>{tab}</span>
              ))}
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            <h4 style={{ color: '#667781', fontSize: 14, margin: '15px 10px 10px' }}>جهات الاتصال</h4>
            
            {/* المتصلون الآن */}
            {CONTACTS.filter(c => c.status === 'online').map(contact => (
              <div 
                key={contact.id} 
                onClick={() => handleContactClick(contact)}
                style={{ 
                  display: 'flex', alignItems: 'center', padding: 12, borderRadius: 10, cursor: 'pointer',
                  background: selectedContact?.id === contact.id ? '#e9f2ef' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ position: 'relative', marginLeft: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#00a884', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
                    {contact.avatar}
                  </div>
                  <span style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, background: '#25d366', borderRadius: '50%', border: '2px solid white' }}></span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#111b21', marginBottom: 4 }}>{contact.name}</div>
                  <div style={{ fontSize: 13, color: '#25d366' }}>متصل الآن</div>
                </div>
              </div>
            ))}
            
            {/* غير المتصلين */}
            {CONTACTS.filter(c => c.status === 'offline').map(contact => (
              <div 
                key={contact.id} 
                onClick={() => handleContactClick(contact)}
                style={{ 
                  display: 'flex', alignItems: 'center', padding: 12, borderRadius: 10, cursor: 'pointer',
                  background: selectedContact?.id === contact.id ? '#e9f2ef' : 'transparent'
                }}
              >
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#a0a0a0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, marginLeft: 12 }}>
                  {contact.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#111b21', marginBottom: 4 }}>{contact.name}</div>
                  <div style={{ fontSize: 13, color: '#8696a0' }}>آخر ظهور {contact.lastSeen}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* منطقة المحادثة الرئيسية */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f2f5', position: 'relative' }}>
          
          {/* رأس المحادثة - قابل للنقر لإظهار ملف المستخدم */}
          <div 
            onClick={() => setShowProfile(true)}
            style={{ padding: '12px 18px', background: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          >
            <img src={`https://ui-avatars.com/api/?name=${selectedContact?.name || otherUser}`} style={{ width: 46, height: 46, borderRadius: '50%' }} alt={selectedContact?.name || otherUser} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 17 }}>{selectedContact?.name || otherUser}</div>
              <div style={{ fontSize: 12, color: selectedContact?.status === 'online' ? '#22c55e' : '#8696a0' }}>
                {selectedContact?.status === 'online' ? 'متصل الآن' : `آخر ظهور ${selectedContact?.lastSeen || 'غير معروف'}`}
              </div>
            </div>
          </div>

          {/* منطقة الرسائل */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'url("https://i.imgur.com/jkOfWzK.png") repeat', display: 'flex', flexDirection: 'column', gap: 8 }}>
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

          {/* مدخل الرسالة */}
          <ChatInput replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSend={handleSendMessage} />
        </div>

        {/* شريط معلومات المستخدم الجانبي (المنزلق) */}
        {showProfile && selectedContact && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }} onClick={() => setShowProfile(false)}>
            <div style={{
              width: 320,
              background: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.2s ease',
              overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', padding: 20, borderBottom: '1px solid #e9ecef' }}>
                <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', marginLeft: 15 }}>✕</button>
                <h3 style={{ margin: 0 }}>معلومات</h3>
              </div>
              
              <div style={{ width: 100, height: 100, background: '#00a884', borderRadius: '50%', margin: '30px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'white' }}>
                {selectedContact.avatar}
              </div>
              
              <div>
                <p style={{ padding: '12px 20px', borderBottom: '1px solid #f0f2f5', margin: 0 }}>
                  <strong style={{ display: 'block', fontSize: 12, color: '#8696a0', marginBottom: 5 }}>اسم المستخدم</strong>
                  {selectedContact.username}
                </p>
                <p style={{ padding: '12px 20px', borderBottom: '1px solid #f0f2f5', margin: 0 }}>
                  <strong style={{ display: 'block', fontSize: 12, color: '#8696a0', marginBottom: 5 }}>البريد الإلكتروني</strong>
                  {selectedContact.email}
                </p>
                <p style={{ padding: '12px 20px', borderBottom: '1px solid #f0f2f5', margin: 0 }}>
                  <strong style={{ display: 'block', fontSize: 12, color: '#8696a0', marginBottom: 5 }}>الهاتف</strong>
                  {selectedContact.phone}
                </p>
              </div>
              
              <div style={{ marginTop: 20 }}>
                {['الوسائل المشتركة', 'الملفات', 'الروابط', 'المحادثات المثبتة'].map(btn => (
                  <button key={btn} style={{ width: '100%', padding: 15, textAlign: 'right', background: 'none', border: 'none', borderBottom: '1px solid #f0f2f5', cursor: 'pointer', fontSize: 16 }}>
                    {btn}
                  </button>
                ))}
                <button style={{ width: '100%', padding: 15, textAlign: 'right', background: 'none', border: 'none', borderBottom: '1px solid #f0f2f5', cursor: 'pointer', fontSize: 16, color: '#ff4d4f' }}>
                  حظر المستخدم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* باقي المكونات كما هي */}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
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
