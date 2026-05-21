import { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '../feedback/EmptyState.jsx';
import VirtualMessageList from './VirtualMessageList.jsx';
import AudioWaveform from './AudioWaveform.jsx';
import Card from '../ui/Card.jsx';

export default function ChatWindow({
  messages,
  loading,
  loadingMore,
  searchQuery,
  typing,
  typingNode,
  language,
  currentUser,
  shouldVirtualize,
  scrollRef,
  topSentinelRef,
  bottomRef,
  onReply,
  onForward,
  onDeleteForEveryone,
  onToggleReaction,
  onOpenMediaViewer,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handlePinMessage = (message) => {
    if (!pinnedMessages.find(m => m.id === message.id)) {
      setPinnedMessages([...pinnedMessages, message]);
    }
    setContextMenu(null);
  };

  const renderMessage = (message) => {
    const isMine = message.sender === currentUser;
    
    return (
      <div 
        key={message.id} 
        className={`message-row ${isMine ? 'mine' : 'other'}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, message });
        }}
      >
        <div className="message-bubble">
          {/* Reply Thread UI */}
          {message.replyTo && (
            <div className="reply-thread-preview" style={{ background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 8, marginBottom: 8, fontSize: 12, borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontWeight: 'bold' }}>{message.replyTo.sender}</div>
              <div className="muted">{message.replyTo.text?.slice(0, 50)}...</div>
            </div>
          )}

          {/* Smart Media Previews */}
          {message.type === 'image' && (
            <div className="smart-media-preview" style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
              <img 
                src={message.media_url} 
                alt="preview" 
                style={{ width: '100%', maxHeight: 300, objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => onOpenMediaViewer(message)}
              />
            </div>
          )}

          <div className="message-text">{message.text}</div>
          
          <div className="message-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10 }}>
            <span className="muted">{message.time}</span>
            {isMine && <span className="status">✓✓</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-window-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Pinned Messages UI */}
      {pinnedMessages.length > 0 && (
        <div className="pinned-messages-bar" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📌</span>
            <div style={{ fontSize: 13 }}>
              <strong>رسالة مثبتة:</strong> {pinnedMessages[pinnedMessages.length - 1].text?.slice(0, 40)}...
            </div>
          </div>
          <button onClick={() => setPinnedMessages([])} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="messages-scroll-area" ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div ref={topSentinelRef} />
        {messages.map(renderMessage)}
        {typing && typingNode}
        <div ref={bottomRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu" 
          style={{ 
            position: 'fixed', 
            top: contextMenu.y, 
            left: contextMenu.x, 
            background: '#1a1a1a', 
            border: '1px solid #333', 
            borderRadius: 8, 
            padding: '8px 0', 
            zIndex: 1000,
            minWidth: 150,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <button onClick={() => onReply(contextMenu.message)} style={{ width: '100%', padding: '8px 16px', textAlign: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>رد</button>
          <button onClick={() => onForward(contextMenu.message)} style={{ width: '100%', padding: '8px 16px', textAlign: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>تحويل</button>
          <button onClick={() => handlePinMessage(contextMenu.message)} style={{ width: '100%', padding: '8px 16px', textAlign: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>تثبيت 📌</button>
          <button onClick={() => onDeleteForEveryone(contextMenu.message)} style={{ width: '100%', padding: '8px 16px', textAlign: 'right', background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>حذف للجميع</button>
        </div>
      )}

      {/* Reply Thread UI (Overlay) */}
      {activeThread && (
        <div className="thread-overlay" style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'var(--bg)', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
            <h3>سلسلة الردود</h3>
            <button onClick={() => setActiveThread(null)}>إغلاق</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Thread messages would go here */}
          </div>
        </div>
      )}
    </div>
  );
}
