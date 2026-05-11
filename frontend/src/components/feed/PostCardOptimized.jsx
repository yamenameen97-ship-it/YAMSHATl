import { useState, useMemo, useCallback, memo } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import OptimizedImage from '../media/OptimizedImage.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savePost, sharePost } from '../../api/posts.js';

const ADVANCED_REACTIONS = [
  { emoji: '❤️', label: 'حب' },
  { emoji: '😂', label: 'ضحك' },
  { emoji: '😮', label: 'مندهش' },
  { emoji: '😢', label: 'حزين' },
  { emoji: '🔥', label: 'حماس' },
  { emoji: '👏', label: 'تصفيق' },
  { emoji: '💡', label: 'فكرة' },
  { emoji: '🤔', label: 'تفكير' }
];

/**
 * Enhanced Content Parser with memoization
 */
const parseContent = memo(function ContentParser({ content }) {
  const parsedContent = useMemo(() => {
    if (!content) return '';
    const parts = content.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}>{part}</span>;
      }
      if (part.startsWith('#')) {
        return <span key={i} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>{part}</span>;
      }
      return part;
    });
  }, [content]);

  return <div>{parsedContent}</div>;
});

parseContent.displayName = 'ContentParser';

/**
 * PostCard Component - Optimized
 * 
 * تحسينات:
 * - React.memo لمنع rerenders
 * - useMemo للحسابات المعقدة
 * - useCallback للـ handlers
 * - OptimizedImage للصور
 * - Lazy loading للـ modals
 */
const PostCardOptimized = memo(function PostCard({ post, onShowAnalytics, onLike }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translation, setTranslation] = useState('');
  const [myReaction, setMyReaction] = useState(post?.my_reaction || null);
  
  const queryClient = useQueryClient();

  // Memoize mutations
  const saveMutation = useMutation({
    mutationFn: () => savePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-data']);
    }
  });

  const shareMutation = useMutation({
    mutationFn: (platform) => sharePost(post.id, { platform }),
  });

  // Memoize handlers with useCallback
  const handleTranslate = useCallback(() => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    setTranslation("هذه ترجمة تجريبية للمحتوى باستخدام الذكاء الاصطناعي لتسهيل التواصل العالمي.");
    setIsTranslated(true);
  }, [isTranslated]);

  const handleShare = useCallback((platform) => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = post.content;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط!');
    } else {
      const shares = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      };
      window.open(shares[platform], '_blank');
    }
    shareMutation.mutate(platform);
    setShowShareModal(false);
  }, [post.id, post.content, shareMutation]);

  const handleToggleReactions = useCallback(() => {
    setShowReactions(prev => !prev);
  }, []);

  const handleSelectReaction = useCallback((emoji) => {
    setMyReaction(emoji);
    setShowReactions(false);
  }, []);

  const handleSave = useCallback(() => {
    saveMutation.mutate();
  }, [saveMutation]);

  // Memoize computed values
  const isMediaVideo = useMemo(() => {
    return post.media_url?.match(/\.(mp4|webm)$/i);
  }, [post.media_url]);

  const cardStyles = useMemo(() => ({
    padding: 16,
    position: 'relative',
    border: post.is_pinned ? '1px solid var(--accent)' : '1px solid var(--line)',
    background: post.is_pinned ? 'rgba(var(--accent-rgb), 0.02)' : 'var(--bg-card)'
  }), [post.is_pinned]);

  const formattedDate = useMemo(() => {
    return new Date(post.created_at).toLocaleString('ar-EG');
  }, [post.created_at]);

  return (
    <Card 
      className={`post-card ${post.is_pinned ? 'pinned' : ''}`} 
      style={cardStyles}
    >
      {/* Pinned Badge */}
      {post.is_pinned && (
        <div style={{ 
          position: 'absolute', 
          top: 12, 
          left: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4, 
          color: 'var(--accent)',
          fontSize: 12,
          fontWeight: 'bold'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>
          منشور مثبت
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: '50%', 
            background: 'var(--bg-soft)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden',
            border: '2px solid var(--line)'
          }}>
            {post.avatar ? (
              <OptimizedImage
                src={post.avatar}
                alt={post.username}
                width={44}
                height={44}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <strong>{post.username?.[0]?.toUpperCase()}</strong>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
              {post.username}
              {post.is_verified && <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" /></svg>}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>{formattedDate}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onShowAnalytics} style={{ padding: '4px 8px', fontSize: 14 }}>📊</Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
        <parseContent content={isTranslated ? translation : post.content} />
        
        {post.media_url && (
          <div 
            onClick={() => setShowMediaModal(true)}
            style={{ 
              marginTop: 12, 
              borderRadius: 12, 
              overflow: 'hidden', 
              cursor: 'pointer',
              background: '#000',
              maxHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isMediaVideo ? (
              <video src={post.media_url} style={{ width: '100%', maxHeight: 400 }} muted loop autoPlay />
            ) : (
              <OptimizedImage
                src={post.media_url}
                alt="Post Media"
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                priority={false}
              />
            )}
          </div>
        )}

        <button 
          onClick={handleTranslate}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, padding: 0, marginTop: 12, display: 'block' }}
        >
          {isTranslated ? 'عرض النص الأصلي' : '🌐 ترجمة ذكية'}
        </button>
      </div>

      {/* Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={onLike}
              onContextMenu={(e) => { e.preventDefault(); handleToggleReactions(); }}
              style={{ background: 'none', border: 'none', color: post.is_liked ? 'var(--accent)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
            >
              <span style={{ fontSize: 18 }}>{post.is_liked ? '❤️' : '🤍'}</span>
              <span>{post.likes_count || 0}</span>
            </button>
            
            {showReactions && (
              <div className="reactions-popup" style={{ position: 'absolute', bottom: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 30, padding: '6px 10px', display: 'flex', gap: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 100, marginBottom: 10 }}>
                {ADVANCED_REACTIONS.map(r => (
                  <button 
                    key={r.emoji} 
                    onClick={() => handleSelectReaction(r.emoji)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', transition: '0.2s' }} 
                    onMouseEnter={e => e.target.style.transform = 'scale(1.3)'} 
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span>{post.comments_count || 0}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => setShowShareModal(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 18 }} title="مشاركة">📤</button>
          <button 
            onClick={handleSave}
            style={{ background: 'none', border: 'none', color: post.is_saved ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', fontSize: 18 }} 
            title={post.is_saved ? "إلغاء الحفظ" : "حفظ"}
          >
            {post.is_saved ? '🔖' : '📑'}
          </button>
        </div>
      </div>

      {/* Media Viewer Modal */}
      <Modal isOpen={showMediaModal} onClose={() => setShowMediaModal(false)} fullScreen>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          {isMediaVideo ? (
            <video src={post.media_url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
          ) : (
            <OptimizedImage
              src={post.media_url}
              alt="Full Media"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              priority={true}
            />
          )}
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="مشاركة المنشور">
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <Button onClick={() => handleShare('whatsapp')} style={{ background: '#25D366', color: 'white' }}>WhatsApp</Button>
          <Button onClick={() => handleShare('twitter')} style={{ background: '#000', color: 'white' }}>X (Twitter)</Button>
          <Button variant="secondary" onClick={() => handleShare('copy')}>نسخ الرابط</Button>
        </div>
      </Modal>

      <style>{`
        .post-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .post-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .reactions-popup { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes popIn { from { opacity: 0; transform: translateY(10px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.post?.id === nextProps.post?.id &&
    prevProps.post?.likes_count === nextProps.post?.likes_count &&
    prevProps.post?.comments_count === nextProps.post?.comments_count &&
    prevProps.post?.is_liked === nextProps.post?.is_liked &&
    prevProps.post?.is_saved === nextProps.post?.is_saved &&
    prevProps.onShowAnalytics === nextProps.onShowAnalytics &&
    prevProps.onLike === nextProps.onLike
  );
});

PostCardOptimized.displayName = 'PostCardOptimized';

export default PostCardOptimized;
