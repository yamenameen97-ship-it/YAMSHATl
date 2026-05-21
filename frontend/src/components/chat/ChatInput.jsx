import { useRef, useState, useEffect } from 'react';

/**
 * Enhanced ChatInput Component
 * Professional message input with file upload, emoji picker, and auto-grow textarea
 */
export default function ChatInputEnhanced({
  onSendMessage,
  onUploadFile,
  onTyping,
  disabled,
  placeholder = 'اكتب رسالة...',
  replyingTo,
  onCancelReply,
}) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [message]);

  // Trigger typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    onTyping?.(true);
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 3000);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage({
        text: message.trim(),
        replyTo: replyingTo,
        timestamp: new Date().toISOString(),
      });
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (onCancelReply) {
        onCancelReply();
      }
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        onUploadFile?.(file);
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(message + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const commonEmojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '😢', '😡', '👌', '💯'];

  const handleStartRecording = () => {
    setIsRecording(true);
    // Voice recording logic would go here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Send voice message logic would go here
  };

  return (
    <div className="message-input-container">
      {/* Reply Preview */}
      {replyingTo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(139, 92, 246, 0.1)',
          borderLeft: '3px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-3)'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
              رد على: {replyingTo.sender}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              {replyingTo.text?.slice(0, 50)}
              {replyingTo.text?.length > 50 ? '...' : ''}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-lg)',
              transition: 'all var(--transition-base)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Wrapper */}
      <div className="message-input-wrapper">
        <div className="message-input-field">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              maxHeight: '100px',
              minHeight: '40px',
              lineHeight: 'var(--leading-relaxed)',
              padding: 0,
            }}
          />

          {/* Emoji Picker Button */}
          <div style={{ position: 'relative' }}>
            <button
              className="message-input-btn secondary"
              title="إضافة emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              😊
            </button>

            {showEmojiPicker && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-2)',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 'var(--space-1)',
                zIndex: 100,
                marginBottom: 'var(--space-2)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '200px'
              }}>
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--text-lg)',
                      transition: 'transform var(--transition-base)',
                      padding: 'var(--space-1)',
                      borderRadius: 'var(--radius-md)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.3)';
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="message-input-actions">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <button
            className="message-input-btn secondary"
            title="إرسال ملف"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            📎
          </button>

          {/* Voice Message */}
          <button
            className={`message-input-btn ${isRecording ? 'primary' : 'secondary'}`}
            title={isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={disabled}
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🎤
          </button>

          {/* Send Button */}
          <button
            className="message-input-btn"
            title="إرسال"
            onClick={handleSendMessage}
            disabled={disabled || !message.trim()}
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✈️
          </button>
        </div>
      </div>

      {/* Character Count */}
      {message.length > 0 && (
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          marginTop: 'var(--space-2)',
          textAlign: 'right'
        }}>
          {message.length} حرف
        </div>
      )}
    </div>
  );
}
