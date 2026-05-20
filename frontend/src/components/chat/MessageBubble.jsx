import React, { useState } from 'react';
import { motion } from 'framer-motion';

const REACTIONS = ['❤️', '🔥', '😂', '👏', '👍', '😮'];

/**
 * Enhanced Message Bubble
 * Features:
 * - Delivery Status (Sending, Delivered, Seen, Failed)
 * - Message Reactions & Actions
 * - Reply Support
 * - Avatar for received messages
 */
export default function MessageBubble({ message, isMine, onReply, onRetry, avatar }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const renderStatus = () => {
    if (!isMine) return null;

    switch (message.status) {
      case 'sending':
        return (
          <span style={{ fontSize: 10, opacity: 0.6, display: 'flex', alignItems: 'center', marginRight: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
        );
      case 'delivered':
        return (
          <span style={{ fontSize: 10, color: '#8696a0', marginRight: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        );
      case 'seen':
        return (
          <span style={{ fontSize: 10, color: '#53bdeb', marginRight: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
              padding: 0,
              marginRight: 4
            }}
            title="فشل الإرسال، اضغط لإعادة المحاولة"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>
        );
      default:
        return null;
    }
  };

  // الحصول على الحرف الأول للأفاتار
  const avatarLetter = avatar || (message.sender ? message.sender.charAt(0) : '?');

  return (
    <div 
      style={{ 
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 8,
        width: '100%'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* الأفاتار للرسائل الواردة فقط */}
      {!isMine && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#00a884',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          flexShrink: 0,
          marginBottom: 16
        }}>
          {avatarLetter.toUpperCase()}
        </div>
      )}

      {/* حاوية الرسالة */}
      <div style={{ 
        maxWidth: '75%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start'
      }}>
        
        {/* اسم المرسل للرسائل الواردة (اختياري) */}
        {!isMine && message.sender && message.sender !== 'system' && (
          <span style={{ fontSize: 11, color: '#8696a0', marginBottom: 2, marginRight: 8 }}>
            {message.sender}
          </span>
        )}

        {/* الرد على رسالة سابقة */}
        {message.replyTo && (
          <div style={{ 
            background: isMine ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
            padding: '5px 10px', 
            borderRadius: '10px 10px 0 0',
            fontSize: 12,
            borderRight: `3px solid ${isMine ? '#00a884' : '#53bdeb'}`,
            marginBottom: 2,
            opacity: 0.8,
            maxWidth: 260,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isMine ? '#111b21' : '#e9ecef'
          }}>
            ⬅ {message.replyTo.text}
          </div>
        )}

        {/* فقاعة الرسالة */}
        <div style={{ 
          background: isMine ? '#d9fdd3' : 'white',
          padding: '8px 12px',
          borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
          color: '#111b21',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          {/* نص الرسالة مع دعم الروابط */}
          <div style={{ 
            fontSize: 14, 
            lineHeight: 1.4,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {message.type === 'system' ? (
              <em style={{ opacity: 0.7 }}>{message.text}</em>
            ) : (
              message.text
            )}
          </div>
          
          {/* التوقيت والحالة */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            marginTop: 4, 
            justifyContent: 'flex-end',
            fontSize: 10,
            color: '#667781'
          }}>
            {message.isEdited && <span style={{ opacity: 0.6 }}>تم التعديل</span>}
            <span>{message.time}</span>
            {renderStatus()}
          </div>
        </div>

        {/* قائمة الإجراءات (رد، تفاعل) */}
        {showActions && message.type !== 'system' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              position: 'absolute', 
              top: -28, 
              [isMine ? 'right' : 'left']: 0, 
              display: 'flex', 
              gap: 4,
              background: '#1a1a1a',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 20,
              zIndex: 10,
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            <button 
              onClick={() => setShowReactions(!showReactions)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'white', padding: '2px 4px' }}
            >
              😀
            </button>
            <button 
              onClick={onReply} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'white', padding: '2px 4px' }}
            >
              ↩️
            </button>
          </motion.div>
        )}

        {/* لوحة التفاعلات (الإموجيات) */}
        {showReactions && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              position: 'absolute', 
              top: -55, 
              [isMine ? 'right' : 'left']: 0, 
              background: '#2a2a2a', 
              backdropFilter: 'blur(12px)',
              padding: '6px 12px', 
              borderRadius: 30, 
              display: 'flex', 
              gap: 8,
              zIndex: 11,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}>
            {REACTIONS.map(r => (
              <button 
                key={r} 
                onClick={() => {
                  setShowReactions(false);
                  // يمكن إضافة منطق حفظ التفاعل هنا
                }} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: 20, 
                  cursor: 'pointer',
                  padding: '4px',
                  transition: 'transform 0.1s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {r}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
