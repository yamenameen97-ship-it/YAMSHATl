import React, { useState } from 'react';
import { motion } from 'framer-motion';

const REACTIONS = ['❤️', '🔥', '😂', '👏', '👍', '😮'];

/**
 * Enhanced Message Bubble
 * Features:
 * - Delivery Status (Sending, Delivered, Seen, Failed)
 * - Message Reactions & Actions
 * - Reply Support
 */
export default function MessageBubble({ message, isMine, onReply, onRetry }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const renderStatus = () => {
    if (!isMine) return null;

    switch (message.status) {
      case 'sending':
        return (
          <span style={{ fontSize: 10, opacity: 0.6, display: 'flex', alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
        );
      case 'delivered':
        return (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        );
      case 'seen':
        return (
          <span style={{ fontSize: 10, color: '#44ff44' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="7 13 12 18 22 8" />
              <polyline points="2 13 7 18 17 8" />
            </svg>
          </span>
        );
      case 'failed':
        return (
          <button 
            onClick={() => onRetry && onRetry(message)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#ff4444', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
            title="فشل الإرسال، اضغط لإعادة المحاولة"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      style={{ 
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        maxWidth: '75%',
        position: 'relative',
        marginBottom: 4
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Reply Preview */}
      {message.replyTo && (
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '5px 10px', 
          borderRadius: '10px 10px 0 0',
          fontSize: 11,
          borderLeft: '3px solid var(--primary)',
          marginBottom: -5,
          opacity: 0.8,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {message.replyTo.text}
        </div>
      )}

      <div style={{ 
        background: isMine ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
        padding: '8px 12px',
        borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
        color: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        <div style={{ fontSize: 14, lineHeight: 1.4 }}>{message.text}</div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4, 
          marginTop: 2, 
          justifyContent: 'flex-end',
          minWidth: 60
        }}>
          {message.isEdited && <span style={{ fontSize: 9, opacity: 0.5 }}>معدلة</span>}
          <span style={{ fontSize: 9, opacity: 0.6 }}>{message.time}</span>
          {renderStatus()}
        </div>
      </div>

      {/* Actions Menu */}
      {showActions && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            position: 'absolute', 
            top: -28, 
            [isMine ? 'right' : 'left']: 0, 
            display: 'flex', 
            gap: 4,
            background: 'rgba(34, 34, 34, 0.9)',
            backdropFilter: 'blur(4px)',
            padding: '2px 6px',
            borderRadius: 12,
            zIndex: 10,
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <button onClick={() => setShowReactions(!showReactions)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>😀</button>
          <button onClick={onReply} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>↩️</button>
        </motion.div>
      )}

      {/* Reactions Picker */}
      {showReactions && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ 
            position: 'absolute', 
            top: -60, 
            [isMine ? 'right' : 'left']: 0, 
            background: 'rgba(51, 51, 51, 0.95)', 
            backdropFilter: 'blur(8px)',
            padding: '4px 8px', 
            borderRadius: 20, 
            display: 'flex', 
            gap: 6,
            zIndex: 11,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
          {REACTIONS.map(r => (
            <button 
              key={r} 
              onClick={() => setShowReactions(false)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: 18, 
                cursor: 'pointer',
                padding: '2px',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.3)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {r}
            </button>
          ))}
        </motion.div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
