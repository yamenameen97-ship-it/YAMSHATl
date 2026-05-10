import { useState, useMemo } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';

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

export default function PostCard({ post, onShowAnalytics }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSaved, setIsSaved] = useState(post?.is_saved || false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translation, setTranslation] = useState('');
  const [myReaction, setMyReaction] = useState(post?.my_reaction || null);

  const handleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    // Simulate Translation API
    setTranslation("This is an AI-powered translation of the post content to help with global accessibility.");
    setIsTranslated(true);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = post.content;
    
    const shares = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      copy: () => {
        navigator.clipboard.writeText(url);
        alert('تم نسخ الرابط!');
      }
    };

    if (typeof shares[platform] === 'function') {
      shares[platform]();
    } else {
      window.open(shares[platform], '_blank');
    }
    setShowShareModal(false);
  };

  return (
    <Card 
      className="post-card" 
      style={{ padding: 16 }}
      role="article"
      aria-label={`منشور بواسطة ${post.username}`}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {post.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{post.username}</div>
            <div className="muted" style={{ fontSize: 12 }}>{new Date(post.created_at).toLocaleString('ar-EG')}</div>
          </div>
        </div>
        <Button variant="secondary" onClick={onShowAnalytics} aria-label="عرض التحليلات">
          📊
        </Button>
      </div>

      {/* Content */}
      <div style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
        <p>{isTranslated ? translation : post.content}</p>
        <button 
          onClick={handleTranslate}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, padding: 0, marginTop: 8 }}
        >
          {isTranslated ? 'عرض النص الأصلي' : '🌐 ترجمة المنشور'}
        </button>
      </div>

      {/* Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 4, position: 'relative' }}>
          <Button 
            variant={myReaction ? 'primary' : 'secondary'}
            onClick={() => setShowReactions(!showReactions)}
            aria-haspopup="true"
            aria-expanded={showReactions}
          >
            {myReaction ? myReaction : '👍'} تفاعل
          </Button>
          
          {showReactions && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 30,
              padding: '8px 12px',
              display: 'flex',
              gap: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              zIndex: 10,
              marginBottom: 8
            }}>
              {ADVANCED_REACTIONS.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => { setMyReaction(r.emoji); setShowReactions(false); }}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="secondary" onClick={() => setShowShareModal(true)} aria-label="مشاركة المنشور">
          📤 مشاركة
        </Button>

        <Button 
          variant={isSaved ? 'primary' : 'secondary'} 
          onClick={() => setIsSaved(!isSaved)}
          aria-label={isSaved ? 'إلغاء حفظ المنشور' : 'حفظ المنشور'}
        >
          {isSaved ? '🔖 محفوظ' : '🔖 حفظ'}
        </Button>
      </div>

      {/* Share Modal */}
      <Modal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)}
        title="مشاركة المنشور"
      >
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <Button onClick={() => handleShare('whatsapp')} style={{ background: '#25D366', color: 'white' }}>
            WhatsApp
          </Button>
          <Button onClick={() => handleShare('twitter')} style={{ background: '#1DA1F2', color: 'white' }}>
            Twitter (X)
          </Button>
          <Button variant="secondary" onClick={() => handleShare('copy')}>
            نسخ الرابط
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
