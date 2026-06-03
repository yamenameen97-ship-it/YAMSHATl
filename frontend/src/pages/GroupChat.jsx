import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessageApi } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';
import '../styles/group-chat.css';

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUser = getCurrentUsername();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        // جلب الرسائل من الباك إند باستخدام معرف المجموعة كـ receiver
        const response = await getMessages(`group:${groupId}`);
        const history = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        
        // تحويل البيانات لتناسب شكل المكون
        const formattedMessages = history.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.content || msg.text,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: msg.sender === currentUser,
          avatar: msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`
        }));
        
        setMessages(formattedMessages.reverse());
      } catch (err) {
        console.error('Error fetching group messages:', err);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    fetchChatData();

    // ربط السوكيت لاستقبال الرسائل الجديدة
    socketManager.connect();
    const handleNewMessage = (payload) => {
      if (payload.receiver === `group:${groupId}`) {
        const newMsg = {
          id: payload.id || Date.now(),
          sender: payload.sender,
          text: payload.content || payload.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: payload.sender === currentUser,
          avatar: payload.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.sender}`
        };
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      }
    };

    socketManager.on('new_message', handleNewMessage);

    return () => {
      socketManager.off('new_message', handleNewMessage);
    };
  }, [groupId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage(''); // مسح حقل الإدخال فوراً لتجربة مستخدم أفضل

    try {
      const payload = {
        receiver: `group:${groupId}`,
        content: content,
        type: 'text'
      };

      // إرسال للباك إند
      const response = await sendMessageApi(payload);
      
      // إذا لم يكن السوكيت سيعيد الرسالة لنا، نضيفها محلياً
      const sentMsg = {
        id: response.data?.id || Date.now(),
        sender: currentUser,
        text: content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`
      };
      
      // نتأكد من عدم تكرار الرسالة إذا وصلت عبر السوكيت
      setMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('فشل إرسال الرسالة. حاول مرة أخرى.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="yam-group-chat-container">
      {/* الهيدر العلوي */}
      <header className="yam-group-header">
        <div className="yam-group-info" onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>
          <div className="yam-group-icon-wrap">
            <span style={{fontSize: '24px'}}>⬅️</span>
          </div>
          <div className="yam-group-details">
            <h2>دردشة المجموعة <span className="yam-verified-badge">✔️</span></h2>
            <div className="yam-group-status">
              <span className="yam-status-dot"></span>
              متصل الآن
            </div>
          </div>
        </div>
        <div className="yam-header-actions">
          <button className="yam-action-btn">📞</button>
          <button className="yam-action-btn" onClick={() => navigate(`/groups/${groupId}/settings`)}>ℹ️</button>
        </div>
      </header>

      {/* منطقة الرسائل */}
      <main className="yam-group-messages">
        {loading ? (
          <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>جاري تحميل الرسائل...</div>
        ) : messages.length === 0 ? (
          <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>لا توجد رسائل بعد. ابدأ المحادثة!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`yam-message-group ${msg.isMe ? 'me' : ''}`}>
              <div className="yam-user-avatar-wrap">
                <img src={msg.avatar} alt={msg.sender} className="yam-user-avatar" />
              </div>
              <div className="yam-message-content-wrap">
                {!msg.isMe && <span className="yam-sender-name">{msg.sender}</span>}
                <div className="yam-message-bubble">
                  {msg.text}
                </div>
                <div className="yam-message-time">
                  {msg.time}
                  {msg.isMe && <span className="yam-read-receipt">✓✓</span>}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* منطقة الإدخال */}
      <footer className="yam-group-input-area">
        <button className="yam-plus-btn">+</button>
        <div className="yam-input-wrapper">
          <input 
            type="text" 
            className="yam-chat-input" 
            placeholder="اكتب رسالة..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <span className="yam-input-icon">😊</span>
        </div>
        <button className="yam-send-btn" onClick={handleSendMessage}>
          <span style={{transform: 'rotate(-45deg)', display: 'inline-block', marginLeft: '4px'}}>✈️</span>
        </button>
      </footer>
    </div>
  );
};

export default GroupChat;
