import { useState, useCallback, useMemo, memo } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import OptimizedImage from '../media/OptimizedImage.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sharePost } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';

/**
 * RepostUI Component
 * 
 * مكون متخصص لإعادة النشر والاقتباسات مع:
 * - Repost animation
 * - Quote preview
 * - Share sheet
 * - Repost counter
 */
const RepostUI = memo(function RepostUI({ post, onRepost }) {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [repostType, setRepostType] = useState('repost'); // 'repost' or 'quote'
  const [quoteText, setQuoteText] = useState('');
  const [isReposting, setIsReposting] = useState(false);

  const repostMutation = useMutation({
    mutationFn: (data) => sharePost(post.id, { ...data, type: 'repost' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-data']);
      setShowRepostModal(false);
      setQuoteText('');
      pushToast({ type: 'success', title: 'تم إعادة النشر بنجاح' });
      onRepost?.();
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'تعذر إعادة النشر', description: error?.response?.data?.detail || error?.message });
    },
  });

  const handleRepost = useCallback(async () => {
    setIsReposting(true);
    try {
      if (repostType === 'quote' && !quoteText.trim()) {
        pushToast({ type: 'error', title: 'الرجاء إدخال نص الاقتباس' });
        setIsReposting(false);
        return;
      }
      repostMutation.mutate({
        type: repostType,
        quote_text: quoteText,
      });
    } finally {
      setIsReposting(false);
    }
  }, [repostType, quoteText, repostMutation, pushToast]);

  const handleShareSheet = useCallback((platform) => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = post.content;

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      pushToast({ type: 'success', title: 'تم نسخ الرابط' });
    } else {
      const shares = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      };
      window.open(shares[platform], '_blank', 'noopener,noreferrer');
    }
    setShowShareSheet(false);
  }, [post.id, post.content, pushToast]);

  const shareOptions = useMemo(() => [
    { icon: '💬', label: 'WhatsApp', value: 'whatsapp', color: '#25D366' },
    { icon: '𝕏', label: 'X (Twitter)', value: 'twitter', color: '#000' },
    { icon: '👍', label: 'Facebook', value: 'facebook', color: '#1877F2' },
    { icon: '✈️', label: 'Telegram', value: 'telegram', color: '#0088cc' },
    { icon: '🔗', label: 'نسخ الرابط', value: 'copy', color: 'var(--primary)' },
  ], []);

  return (
    <>
      {/* Repost Button */}
      <button
        type="button"
        onClick={() => setShowRepostModal(true)}
        className="repost-btn"
        title="إعادة نشر"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          padding: 0,
          transition: 'color 0.2s ease',
        }}
      >
        <span style={{ fontSize: 18 }}>🔄</span>
        <span>{post.repost_count || 0}</span>
      </button>

      {/* Repost Modal */}
      <Modal open={showRepostModal} onClose={() => setShowRepostModal(false)} title="إعادة النشر">
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Type Selection */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => setRepostType('repost')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: repostType === 'repost' ? '2px solid var(--primary)' : '1px solid var(--line)',
                borderRadius: 8,
                background: repostType === 'repost' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-soft)',
                cursor: 'pointer',
                fontWeight: repostType === 'repost' ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              🔄 إعادة نشر مباشرة
            </button>
            <button
              type="button"
              onClick={() => setRepostType('quote')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: repostType === 'quote' ? '2px solid var(--primary)' : '1px solid var(--line)',
                borderRadius: 8,
                background: repostType === 'quote' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-soft)',
                cursor: 'pointer',
                fontWeight: repostType === 'quote' ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              ❝ اقتباس
            </button>
          </div>

          {/* Original Post Preview */}
          <Card style={{ padding: 12, background: 'var(--bg-soft)', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {post.avatar ? (
                  <OptimizedImage
                    src={post.avatar}
                    alt={post.username}
                    width={32}
                    height={32}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <strong style={{ fontSize: 12 }}>{post.username?.[0]?.toUpperCase()}</strong>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: 13 }}>{post.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4, wordBreak: 'break-word' }}>{post.content}</div>
              </div>
            </div>
          </Card>

          {/* Quote Text Input (only for quote type) */}
          {repostType === 'quote' && (
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="أضف تعليقك على هذا المنشور..."
              rows={4}
              style={{
                width: '100%',
                borderRadius: 8,
                padding: 12,
                border: '1px solid var(--line)',
                background: 'var(--bg-soft)',
                color: 'var(--text)',
                fontFamily: 'inherit',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          )}

          {/* Action Buttons */}
          <div style={{ display: 'grid', gap: 10 }}>
            <Button
              onClick={handleRepost}
              disabled={isReposting || (repostType === 'quote' && !quoteText.trim())}
              style={{
                opacity: isReposting ? 0.6 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {isReposting ? '⏳ جاري الإرسال...' : '✅ تأكيد الإعادة'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowShareSheet(true)}
            >
              📤 مشاركة بدلاً من ذلك
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Sheet Modal */}
      <Modal open={showShareSheet} onClose={() => setShowShareSheet(false)} title="مشاركة المنشور">
        <div style={{ display: 'grid', gap: 10 }}>
          {shareOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleShareSheet(option.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: 'var(--bg-soft)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = option.color;
                e.currentTarget.style.color = option.value === 'twitter' ? 'white' : 'white';
                e.currentTarget.style.borderColor = option.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-soft)';
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.borderColor = 'var(--line)';
              }}
            >
              <span style={{ fontSize: 18 }}>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      <style>{`
        .repost-btn {
          transition: color 0.2s ease;
        }
        .repost-btn:hover {
          color: var(--primary);
        }
      `}</style>
    </>
  );
});

RepostUI.displayName = 'RepostUI';

export default RepostUI;
