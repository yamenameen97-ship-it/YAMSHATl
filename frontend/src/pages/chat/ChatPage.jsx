import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import MessageBubble from '../../components/chat/MessageBubble.jsx';
import ChatInput from '../../components/chat/ChatInput.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';

export default function ChatPage() {
  const { userId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const otherUser = userId || 'User';

  const [messages, setMessages] = useState([
    { id: 1, sender: otherUser, text: 'أهلاً بك في يمشات!', time: '10:00 ص', type: 'text', status: 'seen' },
    { id: 2, sender: currentUser, text: 'شكراً لك، التطبيق رائع.', time: '10:01 ص', type: 'text', status: 'seen' }
  ]);
  const [isE2EEnabled, setIsE2EEnabled] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text, type = 'text', metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      sender: currentUser,
      text: isE2EEnabled && type === 'text' ? `🔒 ${text}` : text,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type,
      isE2E: isE2EEnabled,
      replyTo: replyTo,
      status: 'sending',
      ...metadata
    };

    setMessages([...messages, newMessage]);
    setReplyTo(null);

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 1000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleSendMessage(`أرسل ${files.length} ملفات`, 'media', { fileCount: files.length });
    }
  };

  return (
    <MainLayout>
      <div 
        style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: 800, margin: '0 auto', padding: 10, position: 'relative' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Chat Header */}
        <Card style={{ padding: '12px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={`https://ui-avatars.com/api/?name=${otherUser}`} style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
            <div>
              <div style={{ fontWeight: 'bold' }}>{otherUser}</div>
              <div style={{ fontSize: 12, color: '#44ff44' }}>متصل الآن</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setShowGallery(!showGallery)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>🖼️</button>
            <button 
              onClick={() => setIsE2EEnabled(!isE2EEnabled)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
            >
              {isE2EEnabled ? '🛡️' : '🔓'}
            </button>
          </div>
        </Card>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 15 }}>
          {messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isMine={msg.sender === currentUser}
              onReply={() => setReplyTo(msg)}
            />
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <ChatInput 
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={handleSendMessage}
        />

        {/* Media Gallery */}
        {showGallery && (
          <div style={{ position: 'absolute', right: 0, top: 70, bottom: 0, width: 250, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', borderLeft: '1px solid #333', padding: 15, zIndex: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ margin: 0 }}>الوسائط</h3>
              <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', color: 'white' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ aspectRatio: '1', background: '#222', borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
