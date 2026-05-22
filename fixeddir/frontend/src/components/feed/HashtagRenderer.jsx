import { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../admin/ToastProvider.jsx';

/**
 * HashtagRenderer Component
 * 
 * مكون متخصص لعرض ومعالجة الهاشتاجات مع:
 * - تحديد الهاشتاجات تلقائياً في النصوص
 * - رابط للبحث عن الهاشتاج
 * - عرض إحصائيات الهاشتاج
 * - دعم الهاشتاجات المتعددة
 */

// مكون الهاشتاج الفردي
const HashtagBadge = memo(function HashtagBadge({ 
  tag, 
  onClick, 
  count = 0,
  trending = false 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hashtag-badge ${trending ? 'trending' : ''}`}
      title={count ? `${count} منشور` : 'البحث عن هاشتاج'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 12px',
        borderRadius: 16,
        border: 'none',
        background: trending ? 'rgba(255, 69, 0, 0.1)' : 'rgba(var(--primary-rgb), 0.1)',
        color: trending ? '#FF4500' : 'var(--primary)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = trending ? 'rgba(255, 69, 0, 0.2)' : 'rgba(var(--primary-rgb), 0.2)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = trending ? 'rgba(255, 69, 0, 0.1)' : 'rgba(var(--primary-rgb), 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span>#{tag}</span>
      {count > 0 && <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>}
      {trending && <span title="رائج">🔥</span>}
    </button>
  );
});

HashtagBadge.displayName = 'HashtagBadge';

// مكون معاينة الهاشتاج
const HashtagPreview = memo(function HashtagPreview({ 
  tag, 
  count = 0,
  onClose,
  onNavigate,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        minWidth: 200,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        zIndex: 100,
        animation: 'popIn 0.2s ease-out',
      }}
    >
      <div style={{ fontWeight: '600', marginBottom: 8 }}>#{tag}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {count > 0 ? `${count} منشور` : 'لا توجد منشورات'}
      </div>
      <button
        type="button"
        onClick={onNavigate}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: '500',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        عرض المنشورات
      </button>
    </div>
  );
});

HashtagPreview.displayName = 'HashtagPreview';

/**
 * Main HashtagRenderer Component
 */
const HashtagRenderer = memo(function HashtagRenderer({
  text = '',
  hashtags = [],
  onHashtagClick,
  showCounts = true,
  showTrending = true,
  inline = false,
}) {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [hoveredTag, setHoveredTag] = useState(null);
  const [hashtagCounts, setHashtagCounts] = useState({});

  // استخراج الهاشتاجات من النص
  const extractedHashtags = useMemo(() => {
    if (!text) return hashtags;
    
    const hashtagRegex = /#[\w\u0600-\u06FF]+/g;
    const matches = text.match(hashtagRegex) || [];
    const tags = matches.map(tag => tag.substring(1)); // إزالة #
    
    return [...new Set([...tags, ...hashtags])]; // دمج مع الهاشتاجات المعطاة وإزالة التكرار
  }, [text, hashtags]);

  // معالجة النقر على الهاشتاج
  const handleHashtagClick = useCallback((tag) => {
    if (onHashtagClick) {
      onHashtagClick(tag);
    } else {
      navigate(`/search?q=%23${tag}`);
      pushToast({ type: 'info', title: `البحث عن #${tag}` });
    }
  }, [navigate, onHashtagClick, pushToast]);

  // إذا كان inline، عرض الهاشتاجات بشكل مضمن في النص
  if (inline && text) {
    const parts = text.split(/(\s+|#[\w\u0600-\u06FF]+)/);
    return (
      <div style={{ lineHeight: 1.6 }}>
        {parts.map((part, idx) => {
          if (part.startsWith('#')) {
            const tag = part.substring(1);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleHashtagClick(tag)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: 'inherit',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                {part}
              </button>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  }

  // عرض الهاشتاجات كشارات (badges)
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
      }}
    >
      {extractedHashtags.map((tag, idx) => (
        <div
          key={idx}
          style={{ position: 'relative' }}
          onMouseEnter={() => setHoveredTag(tag)}
          onMouseLeave={() => setHoveredTag(null)}
        >
          <HashtagBadge
            tag={tag}
            onClick={() => handleHashtagClick(tag)}
            count={showCounts ? hashtagCounts[tag] || 0 : 0}
            trending={showTrending && (hashtagCounts[tag] || 0) > 100}
          />
          {hoveredTag === tag && showCounts && (
            <HashtagPreview
              tag={tag}
              count={hashtagCounts[tag] || 0}
              onNavigate={() => handleHashtagClick(tag)}
            />
          )}
        </div>
      ))}
    </div>
  );
});

HashtagRenderer.displayName = 'HashtagRenderer';

export default HashtagRenderer;
export { HashtagBadge, HashtagPreview };
