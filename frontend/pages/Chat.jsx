import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getCurrentUsername } from '../utils/auth.js';

const REACTIONS = ['❤️', '🔥', '😂', '👏', '👍', '😮', '😢'];

export default function Chat() {
  const { userId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const otherUser = userId || 'User';

  const [messages, setMessages] = useState([
    { id: 1, sender: otherUser, text: 'أهلاً بك في يمشات!', time: '10:00 ص', type: 'text' },
    { id: 2, sender: currentUser, text: 'شكراً لك، التطبيق رائع.', time: '10:01 ص', type: 'text' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isE2EEnabled, setIsE2EEnabled] = useState(true);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: currentUser,
      text: isE2EEnabled ? `🔒 ${inputText}` : inputText,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      isE2E: isE2EEnabled
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleDeleteForEveryone = (messageId) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, text: '🚫 تم حذف هذه الرسالة للجميع', isDeleted: true } : msg
    ));
    pushToast({ type: 'info', message: 'تم حذف الرسالة للجميع' });
  };

  const handleForward = (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
  };

  const confirmForward = (targetUser) => {
    pushToast({ type: 'success', message: `تم إعادة توجيه الرسالة إلى ${targetUser}` });
    setShowForwardModal(false);
    setForwardingMessage(null);
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: 800, margin: '0 auto', padding: 10 }}>
        
        {/* Chat Header */}
        <Card style={{ padding: '12px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {otherUser[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>{otherUser}</div>
              <div style={{ fontSize: 12, color: '#44ff44' }}>متصل الآن</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: isE2EEnabled ? '#44ff44' : '#888' }}>
              {isE2EEnabled ? '🔒 مشفر تماماً' : '🔓 غير مشفر'}
            </span>
            <button 
              onClick={() => setIsE2EEnabled(!isE2EEnabled)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
              title="تبديل التشفير"
            >
              {isE2EEnabled ? '🛡️' : '🔓'}
            </button>
          </div>
        </Card>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map(msg => (
            <div 
              key={msg.id} 
              style={{ 
                alignSelf: msg.sender === currentUser ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                position: 'relative'
              }}
            >
              <div style={{ 
                background: msg.sender === currentUser ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                padding: '10px 14px',
                borderRadius: msg.sender === currentUser ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                color: 'white',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                {msg.type === 'voice' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 150 }}>
                    <span>▶️</span>
                    <div style={{ flex: 1, height: 20, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {[2, 5, 8, 4, 6, 9, 3, 7, 5, 8].map((h, i) => (
                        <div key={i} style={{ width: 3, height: `${h * 2}px`, background: 'white', borderRadius: 2 }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 10 }}>0:12</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 15 }}>{msg.text}</div>
                )}
                <div style={{ fontSize: 10, textAlign: 'left', marginTop: 4, opacity: 0.7 }}>
                  {msg.time} {msg.isE2E && '🔒'}
                </div>
              </div>

              {/* Message Actions */}
              {!msg.isDeleted && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: msg.sender === currentUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {REACTIONS.slice(0, 3).map(r => (
                      <button key={r} style={{ background: 'none', border: 'none', fontSize: 12, cursor: 'pointer' }}>{r}</button>
                    ))}
                  </div>
                  <button onClick={() => handleForward(msg)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 11, cursor: 'pointer' }}>توجيه</button>
                  {msg.sender === currentUser && (
                    <button onClick={() => handleDeleteForEveryone(msg.id)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: 11, cursor: 'pointer' }}>حذف للكل</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <Card style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>📎</button>
          <input 
            type="text" 
            placeholder="اكتب رسالة مشفرة..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px 15px', borderRadius: 20, color: 'white', outline: 'none' }}
          />
          {inputText ? (
            <Button onClick={handleSendMessage}>إرسال</Button>
          ) : (
            <button style={{ background: 'var(--primary)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: 'white', cursor: 'pointer' }}>🎤</button>
          )}
        </Card>
      </div>

      {/* Forward Modal */}
      {showForwardModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: 300, padding: 20 }}>
            <h3>إعادة توجيه الرسالة</h3>
            <div style={{ display: 'grid', gap: 10, marginTop: 15 }}>
              {['أحمد', 'سارة', 'خالد'].map(user => (
                <button 
                  key={user} 
                  onClick={() => confirmForward(user)}
                  style={{ padding: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: 8, color: 'white', cursor: 'pointer', textAlign: 'right' }}
                >
                  {user}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={() => setShowForwardModal(false)} style={{ marginTop: 15, width: '100%' }}>إلغاء</Button>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
