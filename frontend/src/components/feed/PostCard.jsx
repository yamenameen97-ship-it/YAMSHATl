import { useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addComment, deletePost, getComments, savePost, sharePost, updatePost } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';

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

const parseContent = (content) => {
  if (!content) return '';
  const parts = content.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return <span key={index} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}>{part}</span>;
    }
    if (part.startsWith('#')) {
      return <span key={index} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>{part}</span>;
    }
    return part;
  });
};

export default function PostCard({ post, onShowAnalytics, onLike }) {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translation] = useState('هذه ترجمة تجريبية للمحتوى باستخدام الذكاء الاصطناعي لتسهيل التواصل العالمي.');
  const [commentDraft, setCommentDraft] = useState('');
  const [comments, setComments] = useState([]);
  const [editContent, setEditContent] = useState(post?.content || '');
  const [myReaction, setMyReaction] = useState(post?.my_reaction || null);

  const isOwner = useMemo(() => currentUser && post?.username && currentUser === post.username, [currentUser, post?.username]);

  const refreshComments = async () => {
    try {
      const { data } = await getComments(post.id);
      setComments(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تحميل التعليقات', description: err?.response?.data?.detail || err?.message });
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => savePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-data']);
      pushToast({ type: 'success', title: post.is_saved ? 'تم إلغاء الحفظ' : 'تم حفظ المنشور' });
    },
    onError: (error) => {
      pushToast({ type: 'error', title: 'تعذر حفظ المنشور', description: error?.response?.data?.detail || error?.message });
    }
  });

  const shareMutation = useMutation({
    mutationFn: (platform) => sharePost(post.id, platform),
    onError: (error) => {
      pushToast({ type: 'error', title: 'تعذر مشاركة المنشور', description: error?.response?.data?.detail || error?.message });
    }
  });

  const handleTranslate = async () => {
    setIsTranslated((prev) => !prev);
  };

  const handleShare = async (platform) => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = post.content;
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(url);
        pushToast({ type: 'success', title: 'تم نسخ رابط المنشور' });
      } else {
        const shares = {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        };
        window.open(shares[platform], '_blank', 'noopener,noreferrer');
      }
      shareMutation.mutate(platform);
      setShowShareModal(false);
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر المشاركة', description: err?.message });
    }
  };

  const handleAddComment = async () => {
    if (!commentDraft.trim()) return;
    try {
      await addComment(post.id, commentDraft.trim());
      setCommentDraft('');
      await refreshComments();
      queryClient.invalidateQueries(['feed-data']);
      pushToast({ type: 'success', title: 'تم إضافة التعليق' });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر إضافة التعليق', description: err?.response?.data?.detail || err?.message });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      queryClient.invalidateQueries(['feed-data']);
      pushToast({ type: 'success', title: 'تم حذف المنشور' });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر حذف المنشور', description: err?.response?.data?.detail || err?.message });
    }
  };

  const handleEdit = async () => {
    try {
      await updatePost(post.id, { content: editContent });
      queryClient.invalidateQueries(['feed-data']);
      setShowEditModal(false);
      pushToast({ type: 'success', title: 'تم تعديل المنشور' });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تعديل المنشور', description: err?.response?.data?.detail || err?.message });
    }
  };

  return (
    <Card className={`post-card ${post.is_pinned ? 'pinned' : ''}`} style={{ padding: 16, position: 'relative', border: post.is_pinned ? '1px solid var(--accent)' : '1px solid var(--line)', background: post.is_pinned ? 'rgba(var(--accent-rgb), 0.02)' : 'var(--bg-card)' }}>
      {post.is_pinned ? (
        <div style={{ position: 'absolute', top: 12, left: 16, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 12, fontWeight: 'bold' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>
          منشور مثبت
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--line)' }}>
            {post.avatar ? <img src={post.avatar} alt={post.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <strong>{post.username?.[0]?.toUpperCase()}</strong>}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
              {post.username}
              {post.is_verified ? <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" /></svg> : null}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>{new Date(post.created_at).toLocaleString('ar-EG')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="secondary" onClick={onShowAnalytics} style={{ padding: '4px 8px', fontSize: 14 }}>📊</Button>
          {isOwner ? <Button variant="secondary" onClick={() => setShowEditModal(true)} style={{ padding: '4px 8px', fontSize: 14 }}>تعديل</Button> : null}
          {isOwner ? <Button variant="secondary" onClick={handleDelete} style={{ padding: '4px 8px', fontSize: 14 }}>حذف</Button> : null}
        </div>
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
        <div>{isTranslated ? translation : parseContent(post.content)}</div>
        {post.media_url ? (
          <div onClick={() => setShowMediaModal(true)} style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: '#000', maxHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {post.media_url.match(/\.(mp4|webm)$/i) ? (
              <video src={post.media_url} style={{ width: '100%', maxHeight: 400 }} muted loop autoPlay />
            ) : (
              <img src={post.media_url} alt="Post Media" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            )}
          </div>
        ) : null}
        <button onClick={handleTranslate} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, padding: 0, marginTop: 12, display: 'block' }}>
          {isTranslated ? 'عرض النص الأصلي' : '🌐 ترجمة ذكية'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={onLike} onContextMenu={(event) => { event.preventDefault(); setShowReactions((prev) => !prev); }} style={{ background: 'none', border: 'none', color: post.is_liked ? 'var(--accent)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <span style={{ fontSize: 18 }}>{post.is_liked ? myReaction || '❤️' : '🤍'}</span>
              <span>{post.likes_count || 0}</span>
            </button>
            {showReactions ? (
              <div className="reactions-popup" style={{ position: 'absolute', bottom: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 30, padding: '6px 10px', display: 'flex', gap: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 100, marginBottom: 10 }}>
                {ADVANCED_REACTIONS.map((reaction) => (
                  <button key={reaction.emoji} onClick={() => { setMyReaction(reaction.emoji); setShowReactions(false); onLike?.(); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>{reaction.emoji}</button>
                ))}
              </div>
            ) : null}
          </div>

          <button onClick={() => { setShowCommentsModal(true); refreshComments(); }} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span>{post.comments_count || 0}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => setShowShareModal(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 18 }} title="مشاركة">📤</button>
          <button onClick={() => saveMutation.mutate()} style={{ background: 'none', border: 'none', color: post.is_saved ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', fontSize: 18 }} title={post.is_saved ? 'إلغاء الحفظ' : 'حفظ'}>
            {post.is_saved ? '🔖' : '📑'}
          </button>
        </div>
      </div>

      <Modal open={showMediaModal} onClose={() => setShowMediaModal(false)} title="الوسائط">
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          {post.media_url?.match(/\.(mp4|webm)$/i) ? <video src={post.media_url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh' }} /> : <img src={post.media_url} alt="Full Media" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />}
        </div>
      </Modal>

      <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="مشاركة المنشور">
        <div style={{ display: 'grid', gap: 12 }}>
          <Button onClick={() => handleShare('whatsapp')} style={{ background: '#25D366', color: 'white' }}>WhatsApp</Button>
          <Button onClick={() => handleShare('twitter')} style={{ background: '#000', color: 'white' }}>X</Button>
          <Button variant="secondary" onClick={() => handleShare('copy')}>نسخ الرابط</Button>
        </div>
      </Modal>

      <Modal open={showCommentsModal} onClose={() => setShowCommentsModal(false)} title="التعليقات">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'grid', gap: 10 }}>
            {comments.length ? comments.map((comment) => (
              <div key={comment.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{comment.username || comment.user}</div>
                <div>{comment.content || comment.text || comment.comment}</div>
              </div>
            )) : <div>لا توجد تعليقات بعد.</div>}
          </div>
          <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows={3} placeholder="اكتب تعليقاً" style={{ width: '100%', borderRadius: 12, padding: 12 }} />
          <Button onClick={handleAddComment}>إرسال التعليق</Button>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="تعديل المنشور">
        <div style={{ display: 'grid', gap: 12 }}>
          <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={5} style={{ width: '100%', borderRadius: 12, padding: 12 }} />
          <Button onClick={handleEdit}>حفظ التعديلات</Button>
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
}
