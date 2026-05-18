import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import logger from '../../utils/logger.js';

/**
 * PostCardAdvanced Component
 * 
 * مكون متقدم لعرض المنشورات مع:
 * - معالجة الوسائط المتعددة
 * - تفاعلات محسّنة
 * - معالجة الأخطاء
 * - تحسين الأداء
 * - دعم الإجراءات المخصصة
 */
export default function PostCardAdvanced({ 
  post, 
  onLike, 
  onDelete, 
  onShare,
  onReply,
  currentUser,
}) {
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // معالج الإعجاب
  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike?.();
    } catch (error) {
      logger.warn('Like failed', { error: error?.message });
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, onLike]);

  // معالج الحذف
  const handleDelete = useCallback(async () => {
    if (!window.confirm('هل تريد حذف هذا المنشور؟')) return;
    
    setIsDeleting(true);
    try {
      await onDelete?.();
    } catch (error) {
      logger.warn('Delete failed', { error: error?.message });
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete]);

  // معالج المشاركة
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'يمشات',
          text: post.content || post.message,
          url: window.location.href,
        });
      } else {
        // Fallback: نسخ الرابط
        const url = `${window.location.origin}/post/${post.id}`;
        await navigator.clipboard.writeText(url);
        logger.info('Link copied to clipboard');
      }
      await onShare?.();
    } catch (error) {
      logger.warn('Share failed', { error: error?.message });
    }
  }, [post, onShare]);

  // حساب الوقت المنقضي
  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(post.created_at), {
        locale: ar,
        addSuffix: true,
      });
    } catch {
      return 'منذ قليل';
    }
  }, [post.created_at]);

  // التحقق من ملكية المنشور
  const isOwner = post.user_id === currentUser?.id || post.username === currentUser?.username;

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      border: '1px solid var(--line)',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {/* رأس المنشور */}
      <div style={{
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={post.avatar || '/default-avatar.png'}
            alt={post.username}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {post.username}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {timeAgo}
            </div>
          </div>
        </div>

        {isOwner && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowActions(!showActions)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: 'var(--text-muted)',
              }}
            >
              ⋮
            </button>

            {showActions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                minWidth: '150px',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                <button
                  onClick={() => {
                    handleDelete();
                    setShowActions(false);
                  }}
                  disabled={isDeleting}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'right',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {isDeleting ? 'جاري الحذف...' : 'حذف'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* محتوى المنشور */}
      <div style={{ padding: '16px' }}>
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '15px',
          lineHeight: '1.5',
          color: 'var(--text)',
        }}>
          {post.content || post.message}
        </p>

        {/* الوسائط */}
        {post.media_url && (
          <img
            src={post.media_url}
            alt="post media"
            style={{
              width: '100%',
              borderRadius: '8px',
              marginBottom: '12px',
              maxHeight: '400px',
              objectFit: 'cover',
            }}
          />
        )}

        {post.media && Array.isArray(post.media) && post.media.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(post.media.length, 2)}, 1fr)`,
            gap: '8px',
            marginBottom: '12px',
          }}>
            {post.media.map((media, idx) => (
              <img
                key={idx}
                src={media.url || media}
                alt={`media ${idx}`}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  objectFit: 'cover',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* الإحصائيات والإجراءات */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        color: 'var(--text-muted)',
        marginBottom: '12px',
      }}>
        <span>{post.likes_count || 0} إعجاب</span>
        <span>{post.comments_count || 0} تعليق</span>
        <span>{post.shares_count || 0} مشاركة</span>
      </div>

      {/* أزرار الإجراءات */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0',
        borderTop: '1px solid var(--line)',
      }}>
        <button
          onClick={handleLike}
          disabled={isLiking}
          style={{
            padding: '12px',
            background: post.is_liked ? 'rgba(239, 68, 68, 0.1)' : 'none',
            border: 'none',
            borderRight: '1px solid var(--line)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: post.is_liked ? '#ef4444' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          {isLiking ? '...' : (post.is_liked ? '❤️' : '🤍')} إعجاب
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            padding: '12px',
            background: 'none',
            border: 'none',
            borderRight: '1px solid var(--line)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-muted)',
          }}
        >
          💬 تعليق
        </button>

        <button
          onClick={handleShare}
          style={{
            padding: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-muted)',
          }}
        >
          📤 مشاركة
        </button>
      </div>

      {/* قسم التعليقات */}
      {showComments && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--line)',
          background: 'rgba(0,0,0,0.05)',
        }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '20px',
          }}>
            التعليقات قريباً
          </div>
        </div>
      )}
    </div>
  );
}
