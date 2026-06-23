import { useState, useCallback, useRef, useEffect, memo } from 'react';
import HashtagRenderer from './HashtagRenderer.jsx';
import MentionRenderer from './MentionRenderer.jsx';

/**
 * RichTextEditor Component
 * 
 * محرر نصوص متقدم مع:
 * - تحديد الهاشتاجات والإشارات تلقائياً
 * - معاينة مباشرة
 * - عداد الأحرف
 * - اقتراحات الهاشتاجات والمستخدمين
 * - دعم الرموز التعبيرية
 */

// مكون اقتراحات الهاشتاجات
const HashtagSuggestions = memo(function HashtagSuggestions({
  suggestions = [],
  onSelect,
  isOpen = false,
}) {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        maxHeight: 200,
        overflowY: 'auto',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
        zIndex: 100,
        marginBottom: 4,
      }}
    >
      {suggestions.map((tag, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(tag)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            background: 'none',
            textAlign: 'right',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'background 0.2s ease',
            borderBottom: idx < suggestions.length - 1 ? '1px solid var(--line)' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <span style={{ color: 'var(--primary)', fontWeight: '500' }}>#{tag}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 11, marginRight: 8 }}>رائج</span>
        </button>
      ))}
    </div>
  );
});

HashtagSuggestions.displayName = 'HashtagSuggestions';

// مكون اقتراحات المستخدمين
const UserSuggestions = memo(function UserSuggestions({
  suggestions = [],
  onSelect,
  isOpen = false,
}) {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        maxHeight: 200,
        overflowY: 'auto',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.1)',
        zIndex: 100,
        marginBottom: 4,
      }}
    >
      {suggestions.map((user, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(user)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            background: 'none',
            textAlign: 'right',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'background 0.2s ease',
            borderBottom: idx < suggestions.length - 1 ? '1px solid var(--line)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <strong style={{ fontSize: 10 }}>{user[0]?.toUpperCase()}</strong>
          </div>
          <span style={{ color: 'var(--accent)', fontWeight: '500' }}>@{user}</span>
        </button>
      ))}
    </div>
  );
});

UserSuggestions.displayName = 'UserSuggestions';

/**
 * Main RichTextEditor Component
 */
const RichTextEditor = memo(function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'ما الذي يشغل بالك؟',
  maxLength = 280,
  minLength = 1,
  onSubmit,
  submitLabel = 'نشر',
  showPreview = true,
  showCharCount = true,
  trendingHashtags = [],
  suggestedUsers = [],
  disabled = false,
}) {
  const [content, setContent] = useState(value);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // معالجة تغيير المحتوى
  const handleChange = useCallback((e) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
      onChange?.(newContent);
      setCursorPosition(e.target.selectionStart);

      // التحقق من الهاشتاجات
      const lastWord = newContent.substring(0, e.target.selectionStart).split(/\s/).pop();
      if (lastWord.startsWith('#')) {
        const query = lastWord.substring(1).toLowerCase();
        const filtered = trendingHashtags.filter(tag => 
          tag.toLowerCase().includes(query)
        ).slice(0, 5);
        setHashtagSuggestions(filtered);
        setShowHashtagSuggestions(filtered.length > 0);
      } else {
        setShowHashtagSuggestions(false);
      }

      // التحقق من الإشارات
      if (lastWord.startsWith('@')) {
        const query = lastWord.substring(1).toLowerCase();
        const filtered = suggestedUsers.filter(user => 
          user.toLowerCase().includes(query)
        ).slice(0, 5);
        setUserSuggestions(filtered);
        setShowUserSuggestions(filtered.length > 0);
      } else {
        setShowUserSuggestions(false);
      }
    }
  }, [maxLength, onChange, trendingHashtags, suggestedUsers]);

  // معالجة اختيار هاشتاج
  const handleHashtagSelect = useCallback((tag) => {
    const lastWord = content.substring(0, cursorPosition).split(/\s/).pop();
    const beforeTag = content.substring(0, cursorPosition - lastWord.length);
    const afterTag = content.substring(cursorPosition);
    const newContent = `${beforeTag}#${tag} ${afterTag}`;
    
    setContent(newContent);
    onChange?.(newContent);
    setShowHashtagSuggestions(false);
    
    // تحديث موضع المؤشر
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = beforeTag.length + tag.length + 2;
        textareaRef.current.selectionEnd = beforeTag.length + tag.length + 2;
        textareaRef.current.focus();
      }
    }, 0);
  }, [content, cursorPosition, onChange]);

  // معالجة اختيار مستخدم
  const handleUserSelect = useCallback((user) => {
    const lastWord = content.substring(0, cursorPosition).split(/\s/).pop();
    const beforeMention = content.substring(0, cursorPosition - lastWord.length);
    const afterMention = content.substring(cursorPosition);
    const newContent = `${beforeMention}@${user} ${afterMention}`;
    
    setContent(newContent);
    onChange?.(newContent);
    setShowUserSuggestions(false);
    
    // تحديث موضع المؤشر
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = beforeMention.length + user.length + 2;
        textareaRef.current.selectionEnd = beforeMention.length + user.length + 2;
        textareaRef.current.focus();
      }
    }, 0);
  }, [content, cursorPosition, onChange]);

  // معالجة الإرسال
  const handleSubmit = useCallback(() => {
    if (content.trim().length < minLength) {
      return;
    }
    onSubmit?.(content);
  }, [content, minLength, onSubmit]);

  // معالجة لوحة المفاتيح
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  }, [handleSubmit]);

  const charCount = content.length;
  const charPercentage = (charCount / maxLength) * 100;
  const isValid = charCount >= minLength && charCount <= maxLength;

  return (
    <div style={{ position: 'relative' }}>
      {/* Textarea */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            minHeight: 100,
            padding: 12,
            border: `2px solid ${isValid ? 'var(--line)' : 'var(--error)'}`,
            borderRadius: 8,
            background: 'var(--bg-soft)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = isValid ? 'var(--line)' : 'var(--error)';
          }}
        />

        {/* Hashtag Suggestions */}
        <HashtagSuggestions
          suggestions={hashtagSuggestions}
          onSelect={handleHashtagSelect}
          isOpen={showHashtagSuggestions}
        />

        {/* User Suggestions */}
        <UserSuggestions
          suggestions={userSuggestions}
          onSelect={handleUserSelect}
          isOpen={showUserSuggestions}
        />
      </div>

      {/* Character Counter */}
      {showCharCount && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: charPercentage > 80 ? 'var(--error)' : 'var(--text-secondary)' }}>
            {charCount} / {maxLength}
          </div>
          <div style={{
            width: 100,
            height: 4,
            background: 'var(--bg-soft)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(charPercentage, 100)}%`,
                background: charPercentage > 80 ? 'var(--error)' : 'var(--primary)',
                transition: 'width 0.2s ease, background 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && content.trim() && (
        <div style={{
          marginBottom: 12,
          padding: 12,
          background: 'var(--bg-soft)',
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: '500', marginBottom: 8, color: 'var(--text-secondary)' }}>معاينة:</div>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
          </div>
          <HashtagRenderer
            text={content}
            inline={true}
            onHashtagClick={(tag) => {
              // v58.1 — توجيه إلى صفحة الوسم بدلاً من console.log
              try {
                window.location.hash = `#/search?tag=${encodeURIComponent(tag)}`;
              } catch { /* ignore */ }
            }}
          />
          <MentionRenderer
            text={content}
            inline={true}
            onMentionClick={(user) => {
              // v58.1 — توجيه إلى الملف الشخصي بدلاً من console.log
              try {
                const u = String(user || '').replace(/^@/, '');
                if (u) window.location.hash = `#/profile/${encodeURIComponent(u)}`;
              } catch { /* ignore */ }
            }}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !isValid}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: isValid && !disabled ? 'var(--primary)' : 'var(--bg-soft)',
          color: isValid && !disabled ? 'white' : 'var(--text-secondary)',
          border: 'none',
          borderRadius: 8,
          cursor: isValid && !disabled ? 'pointer' : 'not-allowed',
          fontSize: 14,
          fontWeight: '600',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (isValid && !disabled) {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (isValid && !disabled) {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        {submitLabel}
      </button>

      <style>{`
        textarea::placeholder {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
export { HashtagSuggestions, UserSuggestions };
