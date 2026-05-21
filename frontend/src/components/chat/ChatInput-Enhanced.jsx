/**
 * Enhanced Chat Input Component
 * Auto-growing textarea with media support and action buttons
 */

import { useState, useRef, useEffect } from 'react';

export default function ChatInputEnhanced({
  onSend = null,
  onAttachMedia = null,
  placeholder = 'اكتب رسالة...',
  disabled = false,
}) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, [message]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleMediaClick = (type) => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && onAttachMedia) {
      Array.from(files).forEach((file) => {
        onAttachMedia(file);
      });
    }
  };

  return (
    <div className={`chat-input-container ${isFocused ? 'focused' : ''}`}>
      <div className="chat-input-wrapper">
        <div className="chat-input-actions-left">
          <button
            className="chat-action-btn"
            onClick={() => handleMediaClick('image')}
            title="صورة"
            disabled={disabled}
          >
            🖼️
          </button>
          <button
            className="chat-action-btn"
            onClick={() => handleMediaClick('file')}
            title="ملف"
            disabled={disabled}
          >
            📎
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          rows={1}
        />

        <div className="chat-input-actions-right">
          <button
            className="chat-action-btn send"
            onClick={handleSend}
            title="إرسال"
            disabled={!message.trim() || disabled}
          >
            ✈️
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ==================== CHAT INPUT CONTAINER ==================== */

          .chat-input-container {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-2);
            padding: var(--spacing-4);
            background-color: var(--color-surface-primary);
            border-top: 1px solid var(--color-border-secondary);
            transition: var(--transition-colors);
          }

          .chat-input-container.focused {
            background-color: var(--color-surface-secondary);
          }

          /* ==================== CHAT INPUT WRAPPER ==================== */

          .chat-input-wrapper {
            display: flex;
            gap: var(--spacing-3);
            align-items: flex-end;
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-primary);
            border-radius: var(--radius-full);
            padding: var(--spacing-2) var(--spacing-3);
            transition: var(--transition-colors);
          }

          .chat-input-container.focused .chat-input-wrapper {
            border-color: var(--color-primary-500);
            background-color: var(--color-surface-secondary);
            box-shadow: 0 0 0 3px var(--color-interactive-focus);
          }

          /* ==================== CHAT INPUT ==================== */

          .chat-input {
            flex: 1;
            background-color: transparent;
            border: none;
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            font-family: var(--font-family-primary);
            resize: none;
            outline: none;
            min-height: var(--chat-input-height);
            max-height: 120px;
            padding: 0;
            line-height: var(--line-height-relaxed);
          }

          .chat-input::placeholder {
            color: var(--color-text-muted);
          }

          .chat-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* ==================== CHAT ACTION BUTTONS ==================== */

          .chat-input-actions-left,
          .chat-input-actions-right {
            display: flex;
            gap: var(--spacing-2);
          }

          .chat-action-btn {
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            border-radius: var(--radius-lg);
            background-color: transparent;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            transition: var(--transition-colors);
            flex-shrink: 0;
          }

          .chat-action-btn:hover:not(:disabled) {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .chat-action-btn:active:not(:disabled) {
            background-color: var(--color-interactive-active);
          }

          .chat-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .chat-action-btn.send {
            background: var(--gradient-primary);
            color: white;
          }

          .chat-action-btn.send:hover:not(:disabled) {
            background: var(--gradient-primary-hover);
          }

          .chat-action-btn.send:disabled {
            background: var(--color-border-primary);
            opacity: 0.5;
          }

          /* ==================== RESPONSIVE ==================== */

          @media (max-width: 768px) {
            .chat-input-container {
              padding: var(--spacing-2) var(--spacing-3);
            }

            .chat-input-wrapper {
              padding: var(--spacing-2);
            }

            .chat-input {
              font-size: var(--font-size-xs);
              min-height: 36px;
            }

            .chat-action-btn {
              width: 32px;
              height: 32px;
              min-width: 32px;
              min-height: 32px;
              font-size: var(--font-size-base);
            }
          }
        `
      }} />
    </div>
  );
}
