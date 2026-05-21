import { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '../feedback/EmptyState.jsx';
import VirtualMessageList from './VirtualMessageList.jsx';
import AudioWaveform from './AudioWaveform.jsx';
import Card from '../ui/Card.jsx';

/**
 * Enhanced ChatWindow Component
 * Professional WhatsApp-like chat interface with modern design
 */
export default function ChatWindowEnhanced({
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
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);

  // Close context menu on click outside
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handlePinMessage = (message) => {
    if (!pinnedMessages.find(m => m.id === message.id)) {
      setPinnedMessages([...pinnedMessages, message]);
    }
    setContextMenu(null);
  };

  const handleSelectMessage = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    onReply(message);
    setContextMenu(null);
  };

  const renderMessageStatus = (message) => {
    if (message.sender !== currentUser) return null;

    const statusMap = {
      'sending': { icon: '⏱', label: 'جاري الإرسال' },
      'sent': { icon: '✓', label: 'تم الإرسال' },
      'delivered': { icon: '✓✓', label: 'تم التسليم' },
      'read': { icon: '✓✓', label: 'تم القراءة', color: 'var(--color-secondary)' }
    };

    const status = statusMap[message.status] || statusMap['sent'];
    return (
      <span 
        className="message-status" 
        title={status.label}
        style={{ color: status.color }}
      >
        {status.icon}
      </span>
    );
  };

  const renderMediaPreview = (message) => {
    if (!message.media_url) return null;

    switch (message.type) {
      case 'image':
        return (
          <div className="message-media">
            <img 
              src={message.media_url} 
              alt="message-image"
              className="message-image"
              onClick={() => onOpenMediaViewer(message)}
            />
          </div>
        );

      case 'video':
        return (
          <div className="message-media">
            <video 
              src={message.media_url}
              className="message-video"
              onClick={() => onOpenMediaViewer(message)}
              controls
            />
          </div>
        );

      case 'audio':
        return (
          <div className="message-audio">
            <button className="message-audio-btn">▶</button>
            <audio src={message.media_url} controls style={{ flex: 1 }} />
          </div>
        );

      case 'file':
        const fileName = message.media_url.split('/').pop();
        const fileSize = message.fileSize ? `${(message.fileSize / 1024).toFixed(2)} KB` : 'Unknown';
        return (
          <div className="message-file">
            <div className="message-file-icon">📄</div>
            <div className="message-file-info">
              <div className="message-file-name">{fileName}</div>
              <div className="message-file-size">{fileSize}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderReplyThread = (message) => {
    if (!message.replyTo) return null;

    return (
      <div className="reply-thread-preview">
        <div className="reply-thread-preview-sender">
          {message.replyTo.sender}
        </div>
        <div className="reply-thread-preview-text">
          {message.replyTo.text?.slice(0, 50)}
          {message.replyTo.text?.length > 50 ? '...' : ''}
        </div>
      </div>
    );
  };

  const renderMessage = (message) => {
    const isMine = message.sender === currentUser;
    const isSelected = selectedMessages.has(message.id);

    return (
      <div 
        key={message.id}
        className={`message-row ${isMine ? 'sent' : 'received'}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, message });
        }}
      >
        {!isMine && (
          <div className="message-avatar">
            {message.sender.charAt(0).toUpperCase()}
          </div>
        )}

        <div 
          className={`message-bubble ${isMine ? 'sent' : 'received'} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleSelectMessage(message.id)}
        >
          {renderReplyThread(message)}
          {renderMediaPreview(message)}

          <div className="message-text">
            {message.text}
          </div>

          <div className="message-meta">
            <span className="message-time">
              {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {renderMessageStatus(message)}
          </div>
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    if (!typing) return null;

    return (
      <div className="message-row received">
        <div className="message-avatar">
          {typingNode?.sender?.charAt(0).toUpperCase()}
        </div>
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    );
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;

    const isMine = contextMenu.message.sender === currentUser;

    return (
      <div 
        className="context-menu"
        style={{
          top: `${contextMenu.y}px`,
          left: `${contextMenu.x}px`,
        }}
      >
        <button 
          className="context-menu-item"
          onClick={() => handleReply(contextMenu.message)}
        >
          💬 رد
        </button>

        <button 
          className="context-menu-item"
          onClick={() => {
            onForward(contextMenu.message);
            setContextMenu(null);
          }}
        >
          ↗️ تحويل
        </button>

        <button 
          className="context-menu-item"
          onClick={() => handlePinMessage(contextMenu.message)}
        >
          📌 تثبيت
        </button>

        {isMine && (
          <button 
            className="context-menu-item"
            onClick={() => {
              onToggleReaction(contextMenu.message, 'like');
              setContextMenu(null);
            }}
          >
            👍 إضافة تفاعل
          </button>
        )}

        {isMine && (
          <button 
            className="context-menu-item danger"
            onClick={() => {
              onDeleteForEveryone(contextMenu.message);
              setContextMenu(null);
            }}
          >
            🗑️ حذف للجميع
          </button>
        )}
      </div>
    );
  };

  const renderPinnedMessages = () => {
    if (pinnedMessages.length === 0) return null;

    const latestPinned = pinnedMessages[pinnedMessages.length - 1];

    return (
      <div className="pinned-messages-bar">
        <div className="pinned-messages-content">
          <div className="pinned-messages-icon">📌</div>
          <div className="pinned-messages-text">
            <div className="pinned-messages-label">رسالة مثبتة</div>
            <div className="pinned-messages-preview">
              {latestPinned.text?.slice(0, 40)}
              {latestPinned.text?.length > 40 ? '...' : ''}
            </div>
          </div>
        </div>
        <button 
          className="pinned-messages-close"
          onClick={() => setPinnedMessages([])}
        >
          ✕
        </button>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (messages.length > 0) return null;

    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 'var(--space-8)'
      }}>
        <EmptyState
          icon="💬"
          title="لا توجد رسائل"
          description="ابدأ محادثة جديدة بإرسال رسالة"
        />
      </div>
    );
  };

  return (
    <div className="chat-window-container">
      {renderPinnedMessages()}

      <div className="messages-scroll-area" ref={scrollRef}>
        <div ref={topSentinelRef} />

        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div className="loader">
              <div className="loader-spinner"></div>
              <div className="loader-text">جاري تحميل الرسائل...</div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {shouldVirtualize ? (
              <VirtualMessageList 
                messages={messages}
                renderMessage={renderMessage}
              />
            ) : (
              messages.map(renderMessage)
            )}
          </>
        )}

        {renderTypingIndicator()}
        <div ref={bottomRef} />
      </div>

      {renderContextMenu()}

      {/* Reply Thread Overlay */}
      {activeThread && (
        <div className="thread-overlay">
          <div style={{ 
            padding: 'var(--space-4)', 
            borderBottom: '1px solid var(--color-border-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>سلسلة الردود</h3>
            <button 
              onClick={() => setActiveThread(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--text-lg)'
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
            {/* Thread messages would go here */}
          </div>
        </div>
      )}
    </div>
  );
}
