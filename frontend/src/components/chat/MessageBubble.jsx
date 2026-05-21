import { useState } from 'react';

/**
 * Enhanced MessageBubble Component
 * Professional message display with reactions, media, and interactions
 */
export default function MessageBubbleEnhanced({
  message,
  isMine,
  currentUser,
  onReply,
  onReact,
  onDelete,
  onOpenMedia,
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [hovering, setHovering] = useState(false);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  const handleReaction = (emoji) => {
    onReact(message.id, emoji);
    setShowReactions(false);
  };

  const renderMediaPreview = () => {
    if (!message.media_url) return null;

    const mediaType = message.type || 'image';

    switch (mediaType) {
      case 'image':
        return (
          <div className="message-media">
            <img 
              src={message.media_url}
              alt="message-image"
              className="message-image"
              onClick={() => onOpenMedia(message)}
              loading="lazy"
            />
          </div>
        );

      case 'video':
        return (
          <div className="message-media">
            <video 
              src={message.media_url}
              className="message-video"
              onClick={() => onOpenMedia(message)}
              preload="metadata"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="message-audio">
            <button className="message-audio-btn" onClick={(e) => e.currentTarget.nextSibling.play()}>
              ▶
            </button>
            <audio src={message.media_url} controls />
          </div>
        );

      case 'file':
        const fileName = message.media_url.split('/').pop();
        const fileSize = message.fileSize 
          ? `${(message.fileSize / 1024).toFixed(2)} KB`
          : 'Unknown';
        
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

  const renderReplyThread = () => {
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

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <div style={{
        display: 'flex',
        gap: 'var(--space-1)',
        marginTop: 'var(--space-2)',
        flexWrap: 'wrap'
      }}>
        {message.reactions.map((reaction, idx) => (
          <div 
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: 'var(--space-1) var(--space-2)',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <span>{reaction.emoji}</span>
            {reaction.count > 1 && <span style={{ fontSize: 'var(--text-xs)' }}>{reaction.count}</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderActions = () => {
    if (!hovering) return null;

    return (
      <div style={{
        display: 'flex',
        gap: 'var(--space-1)',
        marginTop: 'var(--space-2)',
        opacity: 0.8
      }}>
        <button
          className="message-action-btn"
          title="رد"
          onClick={() => onReply(message)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-md)',
            transition: 'all var(--transition-base)'
          }}
        >
          💬
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="message-action-btn"
            title="تفاعل"
            onClick={() => setShowReactions(!showReactions)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-md)',
              transition: 'all var(--transition-base)'
            }}
          >
            😊
          </button>

          {showReactions && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2)',
              display: 'flex',
              gap: 'var(--space-1)',
              zIndex: 100,
              marginBottom: 'var(--space-2)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--text-lg)',
                    transition: 'transform var(--transition-base)',
                    padding: 'var(--space-1)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {isMine && (
          <button
            className="message-action-btn"
            title="حذف"
            onClick={() => onDelete(message.id)}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-md)',
              transition: 'all var(--transition-base)'
            }}
          >
            🗑️
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`message-bubble ${isMine ? 'sent' : 'received'}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {renderReplyThread()}
      {renderMediaPreview()}

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
        {isMine && (
          <span className={`message-status ${message.status || 'sent'}`}>
            {message.status === 'read' && '✓✓'}
            {message.status === 'delivered' && '✓✓'}
            {message.status === 'sent' && '✓'}
            {message.status === 'sending' && '⏱'}
          </span>
        )}
      </div>

      {renderReactions()}
      {renderActions()}
    </div>
  );
}
