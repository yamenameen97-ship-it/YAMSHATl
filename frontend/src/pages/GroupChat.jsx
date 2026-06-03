import React, { useState, useEffect, useRef } from 'react';
import '../styles/group-chat.css';

const GroupChat = () => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const messages = [
    {
      id: 1,
      sender: "أحمد",
      text: "مرحباً بالجميع! كيف تقدم المشروع؟",
      time: "10:30 AM",
      isMe: false,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed"
    },
    {
      id: 2,
      sender: "سارة",
      text: "أهلاً أحمد، نحن نعمل على التصميم الآن 🚀",
      time: "10:32 AM",
      isMe: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara",
      read: true
    },
    {
      id: 3,
      sender: "محمد",
      text: "تم الانتهاء من صفحة الدردشة ما رأيكم؟ 😄",
      time: "10:35 AM",
      isMe: false,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed",
      attachment: {
        name: "chat-ui-design.png",
        size: "2.4 MB"
      }
    },
    {
      id: 4,
      sender: "يوسف",
      text: "رائع جداً! التصميم احترافي 😍",
      time: "10:36 AM",
      isMe: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef",
      read: true
    },
    {
      id: 5,
      sender: "نورة",
      text: "متى سيكون الإصدار التجريبي؟ 🤔",
      time: "10:37 AM",
      isMe: false,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noura"
    }
  ];

  return (
    <div className="yam-group-chat-container">
      {/* الهيدر العلوي */}
      <header className="yam-group-header">
        <div className="yam-group-info">
          <div className="yam-group-icon-wrap">
            <span style={{fontSize: '24px'}}>👥</span>
          </div>
          <div className="yam-group-details">
            <h2>مجموعة المطورين <span className="yam-verified-badge">✔️</span></h2>
            <div className="yam-group-status">
              <span className="yam-status-dot"></span>
              128 عضواً متصلون
            </div>
          </div>
        </div>
        <div className="yam-header-actions">
          <button className="yam-action-btn">📞</button>
          <button className="yam-action-btn">ℹ️</button>
        </div>
      </header>

      {/* منطقة الرسائل */}
      <main className="yam-group-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`yam-message-group ${msg.isMe ? 'me' : ''}`}>
            <div className="yam-user-avatar-wrap">
              <img src={msg.avatar} alt={msg.sender} className="yam-user-avatar" />
              <div className="yam-user-status-indicator"></div>
            </div>
            <div className="yam-message-content-wrap">
              {!msg.isMe && <span className="yam-sender-name">{msg.sender}</span>}
              <div className="yam-message-bubble">
                {msg.text}
                {msg.attachment && (
                  <div className="yam-attachment-card">
                    <div className="yam-file-icon">📄</div>
                    <div className="yam-file-info">
                      <span className="yam-file-name">{msg.attachment.name}</span>
                      <span className="yam-file-size">{msg.attachment.size}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="yam-message-time">
                {msg.time}
                {msg.isMe && msg.read && <span className="yam-read-receipt">✓✓</span>}
              </div>
            </div>
          </div>
        ))}
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
          />
          <span className="yam-input-icon">😊</span>
        </div>
        <button className="yam-send-btn">
          <span style={{transform: 'rotate(-45deg)', display: 'inline-block', marginLeft: '4px'}}>✈️</span>
        </button>
      </footer>
    </div>
  );
};

export default GroupChat;
