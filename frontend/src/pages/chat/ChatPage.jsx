import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import MessageBubble from '../../components/chat/MessageBubble.jsx';
import ChatInput from '../../components/chat/ChatInput.jsx';
import { getCurrentUsername } from '../../utils/auth.js';

const DEMO_CHATS = [
  { id: 1, name: 'KhaledGamer', msg: 'متى بنسوي بث مشترك؟', time: '10:30 PM', unread: 2 },
  { id: 2, name: 'ShadowGirl', msg: 'ارسلت لك صورة', time: '10:25 PM', unread: 1 },
  { id: 3, name: 'MaxX', msg: 'المقطع نار 🔥', time: '9:40 PM', unread: 0 },
  { id: 4, name: 'Lina_Music', msg: 'تم إرسال مقطع 🎵', time: '9:20 PM', unread: 0 },
];

export default function ChatPage() {
  const { userId } = useParams();
  const currentUser = getCurrentUsername() || 'أنا';
  const otherUser = userId || 'KhaledGamer';
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([
    { id: 1, sender: otherUser, text: 'السلام عليكم!', time: '10:20 PM', type: 'text', status: 'seen' },
    { id: 2, sender: currentUser, text: 'وعليكم السلام', time: '10:20 PM', type: 'text', status: 'seen' },
    { id: 3, sender: otherUser, text: 'كيف الحال؟', time: '10:21 PM', type: 'text', status: 'seen' },
    { id: 4, sender: currentUser, text: 'الحمد لله تمام', time: '10:21 PM', type: 'text', status: 'seen' },
  ]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text, type = 'text') => {
    if (!text?.trim?.()) return;

    setMessages((prev) => ([
      ...prev,
      {
        id: Date.now(),
        sender: currentUser,
        text,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type,
        status: 'sent',
      },
    ]));
  };

  const galleryItems = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <MainLayout>
      <div className="yamshat-chat-layout">
        <aside className="chat-left-sidebar">
          <div className="sidebar-header">
            <h3>الدردشات</h3>
            <button className="new-chat-btn">+ دردشة جديدة</button>
          </div>

          <input className="chat-search" placeholder="ابحث في الدردشات" />

          <div className="chat-list">
            {DEMO_CHATS.map((chat) => (
              <div key={chat.id} className={`chat-list-item ${chat.name === otherUser ? 'active' : ''}`}>
                <img src={`https://ui-avatars.com/api/?name=${chat.name}`} alt={chat.name} />
                <div className="chat-list-content">
                  <div className="chat-top-row">
                    <strong>{chat.name}</strong>
                    <span>{chat.time}</span>
                  </div>
                  <div className="chat-bottom-row">
                    <p>{chat.msg}</p>
                    {chat.unread ? <span className="badge">{chat.unread}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="chat-center-area">
          <header className="chat-main-header">
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${otherUser}`} alt={otherUser} />
              <div>
                <h2>{otherUser}</h2>
                <span>متصل الآن</span>
              </div>
            </div>

            <div className="header-actions">
              <button>📞</button>
              <button>🎥</button>
              <button>🔍</button>
              <button>⋯</button>
            </div>
          </header>

          <div className="messages-area">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={message.sender === currentUser}
              />
            ))}
            <div ref={scrollRef} />
          </div>

          <div className="chat-input-wrapper">
            <ChatInput onSend={handleSendMessage} />
          </div>
        </main>

        <aside className="chat-right-sidebar">
          <div className="profile-card">
            <img src={`https://ui-avatars.com/api/?name=${otherUser}`} alt={otherUser} />
            <h3>{otherUser}</h3>
            <span>متصل الآن</span>
          </div>

          <div className="media-box">
            <div className="section-title">
              <h4>الوسائط والملفات</h4>
              <span>عرض الكل</span>
            </div>

            <div className="media-grid">
              {galleryItems.map((_, index) => (
                <div key={index} className="media-item">🎮</div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .yamshat-chat-layout {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 260px;
          gap: 12px;
          height: calc(100vh - 90px);
          padding: 12px;
          background: #050816;
        }

        .chat-left-sidebar,
        .chat-right-sidebar,
        .chat-center-area {
          background: rgba(8, 12, 30, 0.95);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 22px;
          backdrop-filter: blur(16px);
          overflow: hidden;
        }

        .chat-center-area {
          display: flex;
          flex-direction: column;
        }

        .sidebar-header,
        .chat-main-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h3,
        .profile-card h3,
        .chat-main-header h2,
        .section-title h4 {
          margin: 0;
          color: white;
        }

        .new-chat-btn {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          border: none;
          color: white;
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
        }

        .chat-search {
          margin: 12px;
          width: calc(100% - 24px);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 12px;
          color: white;
        }

        .chat-list {
          padding: 6px;
          overflow-y: auto;
        }

        .chat-list-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          cursor: pointer;
          margin-bottom: 8px;
          transition: 0.2s ease;
        }

        .chat-list-item.active,
        .chat-list-item:hover {
          background: rgba(124,58,237,0.14);
        }

        .chat-list-item img,
        .user-info img,
        .profile-card img {
          width: 52px;
          height: 52px;
          border-radius: 50%;
        }

        .chat-list-content,
        .user-info {
          flex: 1;
        }

        .chat-top-row,
        .chat-bottom-row,
        .section-title,
        .chat-main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-top-row strong,
        .chat-bottom-row p,
        .chat-top-row span,
        .chat-main-header span,
        .profile-card span,
        .section-title span {
          color: rgba(255,255,255,0.7);
        }

        .chat-bottom-row p {
          margin: 4px 0 0;
          font-size: 13px;
        }

        .badge {
          background: #7c3aed;
          color: white;
          min-width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .header-actions button {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: white;
          cursor: pointer;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-input-wrapper {
          padding: 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .chat-right-sidebar {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .profile-card {
          text-align: center;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .profile-card img {
          width: 90px;
          height: 90px;
          margin-bottom: 10px;
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 14px;
        }

        .media-item {
          aspect-ratio: 1;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(76,29,149,0.9), rgba(30,64,175,0.8));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
        }

        @media (max-width: 1200px) {
          .yamshat-chat-layout {
            grid-template-columns: 240px minmax(0, 1fr);
          }

          .chat-right-sidebar {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .yamshat-chat-layout {
            grid-template-columns: 1fr;
            height: auto;
          }

          .chat-left-sidebar {
            display: none;
          }
        }
      `}</style>
    </MainLayout>
  );
}
