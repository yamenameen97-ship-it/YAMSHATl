/**
 * Enhanced Message Bubble Component
 * Professional message display with reactions, status, and media support
 */

import { useState } from 'react';

export default function MessageBubbleEnhanced({
  message = {},
  isSent = false,
  showAvatar = true,
  showTime = true,
  onReact = null,
  onReply = null,
  onDelete = null,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const {
    id = '',
    text = '',
    timestamp = new Date(),
    status = 'sent', // sent, delivered, read
    reactions = [],
    media = null,
    mediaType = null, // image, video, audio, file
    sender = {},
    edited = false,
  } = message;

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return '⏱️';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    return status === 'read' ? 'var(--color-primary-500)' : 'var(--color-text-muted)';
  };

  const renderMedia = () => {
    if (!media) return null;

    switch (mediaType) {
      case 'image':
        return (
          <img
            src={media}
            alt="Message image"
            className="message-image"
            loading="lazy"
          />
        );

      case 'video':
        return (
          <div className="message-video-container">
            <video
              src={media}
              className="message-video"
              controls
              preload="metadata"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="message-audio-container">
            <audio
              src={media}
              className="message-audio"
              controls
              preload="metadata"
            />
          </div>
        );

      case 'file':
        return (
          <div className="message-file">
            <div className="message-file-icon">📄</div>
            <div className="message-file-info">
              <div className="message-file-name">{media.name || 'File'}</div>
              <div className="message-file-size">{media.size || ''}</div>
            </div>
            <div className="message-file-download">⬇️</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`message-bubble ${isSent ? 'sent' : 'received'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isSent && showAvatar && (
        <div className="message-avatar">
          {sender?.avatar || '👤'}
        </div>
      )}

      <div className="message-content-wrapper">
        <div className="message-content">
          {text && <p className="message-text">{text}</p>}

          {renderMedia()}

          {reactions && reactions.length > 0 && (
            <div className="message-reactions">
              {reactions.map((reaction, idx) => (
                <div key={idx} className="reaction" title={reaction.user}>
                  {reaction.emoji}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="message-footer">
          {showTime && (
            <span className="message-time">{formatTime(timestamp)}</span>
          )}
          {isSent && (
            <span
              className="message-status"
              style={{ color: getStatusColor() }}
              title={status}
            >
              {getStatusIcon()}
            </span>
          )}
          {edited && <span className="message-edited">تم التعديل</span>}
        </div>
      </div>

      {showActions && (
        <div className="message-actions">
          <button
            className="message-action-btn"
            onClick={() => setShowReactions(!showReactions)}
            title="Add reaction"
          >
            😊
          </button>
          {onReply && (
            <button
              className="message-action-btn"
              onClick={() => onReply(message)}
              title="Reply"
            >
              ↩️
            </button>
          )}
          {onDelete && isSent && (
            <button
              className="message-action-btn delete"
              onClick={() => onDelete(id)}
              title="Delete"
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {showReactions && (
        <div className="reactions-picker">
          {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
            <button
              key={emoji}
              className="reaction-picker-btn"
              onClick={() => {
                onReact?.(id, emoji);
                setShowReactions(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ==================== MESSAGE BUBBLE ==================== */

          .message-bubble {
            display: flex;
            gap: var(--spacing-3);
            margin-bottom: var(--spacing-3);
            animation: slideInUp var(--duration-fast) var(--ease-out);
            align-items: flex-end;
          }

          .message-bubble.sent {
            justify-content: flex-end;
          }

          .message-bubble.received {
            justify-content: flex-start;
          }

          /* ==================== MESSAGE AVATAR ==================== */

          .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: var(--font-size-base);
            flex-shrink: 0;
          }

          /* ==================== MESSAGE CONTENT ==================== */

          .message-content-wrapper {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-1);
            max-width: var(--chat-message-max-width);
          }

          .message-content {
            word-break: break-word;
            overflow-wrap: break-word;
          }

          .message-bubble.sent .message-content {
            background: var(--gradient-primary);
            color: white;
            border-radius: 18px 18px 4px 18px;
            padding: var(--spacing-3) var(--spacing-4);
            box-shadow: var(--shadow-sm);
          }

          .message-bubble.received .message-content {
            background-color: var(--color-surface-secondary);
            color: var(--color-text-primary);
            border-radius: 18px 18px 18px 4px;
            padding: var(--spacing-3) var(--spacing-4);
            border: 1px solid var(--color-border-secondary);
          }

          /* ==================== MESSAGE TEXT ==================== */

          .message-text {
            font-size: var(--font-size-sm);
            line-height: var(--line-height-relaxed);
            margin: 0;
          }

          /* ==================== MESSAGE MEDIA ==================== */

          .message-image {
            max-width: 100%;
            max-height: 300px;
            border-radius: var(--radius-lg);
            margin-top: var(--spacing-2);
            cursor: pointer;
            transition: var(--transition-normal);
            display: block;
          }

          .message-image:hover {
            transform: scale(1.02);
          }

          .message-video-container,
          .message-audio-container {
            margin-top: var(--spacing-2);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }

          .message-video {
            width: 100%;
            max-height: 300px;
            border-radius: var(--radius-lg);
          }

          .message-audio {
            width: 100%;
            margin-top: var(--spacing-2);
          }

          .message-file {
            display: flex;
            align-items: center;
            gap: var(--spacing-3);
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-3);
            margin-top: var(--spacing-2);
            cursor: pointer;
            transition: var(--transition-colors);
          }

          .message-file:hover {
            background-color: var(--color-bg-hover);
            border-color: var(--color-primary-500);
          }

          .message-file-icon {
            font-size: var(--font-size-2xl);
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--color-primary-500);
            color: white;
            border-radius: var(--radius-lg);
            flex-shrink: 0;
          }

          .message-file-info {
            flex: 1;
            min-width: 0;
          }

          .message-file-name {
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .message-file-size {
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          }

          .message-file-download {
            font-size: var(--font-size-lg);
            cursor: pointer;
          }

          /* ==================== MESSAGE REACTIONS ==================== */

          .message-reactions {
            display: flex;
            gap: var(--spacing-1);
            margin-top: var(--spacing-2);
            flex-wrap: wrap;
          }

          .reaction {
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-primary);
            border-radius: var(--radius-full);
            padding: var(--spacing-1) var(--spacing-2);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: var(--transition-colors);
          }

          .reaction:hover {
            background-color: var(--color-interactive-hover);
            border-color: var(--color-primary-500);
          }

          /* ==================== MESSAGE FOOTER ==================== */

          .message-footer {
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            font-size: var(--font-size-xs);
            padding: 0 var(--spacing-2);
          }

          .message-time {
            color: var(--color-text-muted);
          }

          .message-status {
            font-weight: var(--font-weight-bold);
          }

          .message-edited {
            color: var(--color-text-muted);
            font-style: italic;
          }

          /* ==================== MESSAGE ACTIONS ==================== */

          .message-actions {
            display: flex;
            gap: var(--spacing-1);
            margin-left: var(--spacing-2);
            background-color: var(--color-surface-secondary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-1);
            animation: slideInUp var(--duration-fast) var(--ease-out);
          }

          .message-action-btn {
            width: 32px;
            height: 32px;
            border-radius: var(--radius-md);
            background-color: transparent;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-base);
            transition: var(--transition-colors);
          }

          .message-action-btn:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .message-action-btn.delete:hover {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--color-error);
          }

          /* ==================== REACTIONS PICKER ==================== */

          .reactions-picker {
            display: flex;
            gap: var(--spacing-1);
            background-color: var(--color-surface-secondary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-2);
            margin-top: var(--spacing-2);
            animation: slideInUp var(--duration-fast) var(--ease-out);
          }

          .reaction-picker-btn {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-md);
            background-color: transparent;
            border: 1px solid var(--color-border-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            transition: var(--transition-colors);
          }

          .reaction-picker-btn:hover {
            background-color: var(--color-interactive-hover);
            border-color: var(--color-primary-500);
            transform: scale(1.2);
          }

          /* ==================== ANIMATIONS ==================== */

          @keyframes slideInUp {
            from {
              transform: translateY(10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          /* ==================== RESPONSIVE ==================== */

          @media (max-width: 768px) {
            .message-bubble {
              gap: var(--spacing-2);
            }

            .message-content-wrapper {
              max-width: 85vw;
            }

            .message-avatar {
              width: 32px;
              height: 32px;
              font-size: var(--font-size-sm);
            }

            .message-actions {
              margin-left: 0;
            }
          }
        `
      }} />
    </div>
  );
}
