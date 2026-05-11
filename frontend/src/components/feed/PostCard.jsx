import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import NestedComments from './NestedComments.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addComment, deletePost, getComments, savePost, sharePost, updatePost } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';
import socketManager from '../../services/socketManager.js';

const ADVANCED_REACTIONS = [
  { emoji: '❤️', label: 'حب' },
  { emoji: '😂', label: 'ضحك' },
  { emoji: '😮', label: 'مندهش' },
  { emoji: '🔥', label: 'حماس' },
  { emoji: '👏', label: 'تصفيق' },
  { emoji: '💡', label: 'فكرة' },
];

function renderRichText(content = '') {
  return content.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('@')) return <span key={index} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>{part}</span>;
    if (part.startsWith('#')) return <span key={index} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>{part}</span>;
    return part;
  });
}

export default function PostCard({ post, onShowAnalytics, onLike }) {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [comments, setComments] = useState([]);
  const [editContent, setEditContent] = useState(post?.content || '');
  const [myReaction, setMyReaction] = useState(post?.my_reaction || null);
  const [isPinned, setIsPinned] = useState(Boolean(post?.is_pinned));

  const isOwner = useMemo(() => currentUser && post?.username && currentUser === post.username, [currentUser, post?.username]);
  const interactionCount = useMemo(() => {
    const reactionCounts = Object.values(post?.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    return reactionCounts + Number(post?.likes_count || 0) + Number(post?.comments_count || 0) + Number(post?.share_count || 0);
  }, [post?.comments_count, post?.likes_count, post?.reactions, post?.share_count]);

  const refreshComments = async () => {
    try {
      const { data } = await getComments(post.id);
      setComments(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل التعليقات', description: error?.response?.data?.detail || error?.message });
    }
  };

  useEffect(() => {
    if (!showCommentsModal) return undefined;
    socketManager.connect();
    const handleIncomingComment = (payload) => {
      if (String(payload?.post_id) !== String(post.id)) return;
      setComments((prev) => {
        const exists = prev.some((item) => String(item.id) === String(payload.id));
        if (exists) return prev;
        const next = [...prev, { ...payload, justArrived: true }];
        window.setTimeout(() => {
          setComments((current) => current.map((item) => String(item.id) === String(payload.id) ? { ...item, justArrived: false } : item));
        }, 2600);
        return next;
      });
    };
    socketManager.on('post_comment', handleIncomingComment);
    return () => socketManager.off('post_comment', handleIncomingComment);
  }, [post.id, showCommentsModal]);

  const saveMutation = useMutation({
    mutationFn: () => savePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-data']);
      pushToast({ type: 'success', title: post.is_saved ? 'تم إلغاء الحفظ' : 'تم حفظ المنشور' });
    },
    onError: (error) => pushToast({ type: 'error', title: 'تعذر حفظ المنشور', description: error?.response?.data?.detail || error?.message }),
  });

  const shareMutation = useMutation({
    mutationFn: (platform) => sharePost(post.id, platform),
    onError: (error) => pushToast({ type: 'error', title: 'تعذر مشاركة المنشور', description: error?.response?.data?.detail || error?.message }),
  });

  const handleShare = async (platform) => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(url);
      } else {
        const shares = {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(`${post.content} ${url}`)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content)}&url=${encodeURIComponent(url)}`,
        };
        window.open(shares[platform], '_blank', 'noopener,noreferrer');
      }
      shareMutation.mutate(platform);
      setShowShareModal(false);
      pushToast({ type: 'success', title: 'تمت مشاركة المنشور' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر المشاركة', description: error?.message });
    }
  };

  const handleAddComment = async ({ content, parentId = null }) => {
    if (!content?.trim()) return;
    const cleanContent = content.trim();
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticComment = {
      id: optimisticId,
      username: currentUser,
      content: cleanContent,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      reactions: {},
      optimistic: true,
      justArrived: true,
    };

    setComments((prev) => [...prev, optimisticComment]);
    setCommentDraft('');

    try {
      const { data } = await addComment(post.id, cleanContent, parentId);
      const confirmedComment = {
        ...(data || optimisticComment),
        optimistic: false,
        justArrived: true,
      };

      setComments((prev) => prev.map((item) => (
        String(item.id) === optimisticId
          ? { ...confirmedComment, id: data?.id || optimisticId }
          : item
      )));
      queryClient.invalidateQueries(['feed-data']);
      socketManager.emit?.('post_comment', { ...confirmedComment, post_id: post.id });
      window.setTimeout(() => {
        setComments((prev) => prev.map((item) => item.id === (data?.id || optimisticId) ? { ...item, justArrived: false } : item));
      }, 2600);
    } catch (error) {
      setComments((prev) => prev.filter((item) => String(item.id) !== optimisticId));
      pushToast({ type: 'error', title: 'تعذر إضافة التعليق', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      queryClient.invalidateQueries(['feed-data']);
      pushToast({ type: 'success', title: 'تم حذف المنشور' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر حذف المنشور', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleEdit = async () => {
    try {
      await updatePost(post.id, { content: editContent });
      queryClient.invalidateQueries(['feed-data']);
      setShowEditModal(false);
      pushToast({ type: 'success', title: 'تم تعديل المنشور' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تعديل المنشور', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleTogglePin = async () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    try {
      await updatePost(post.id, { is_pinned: nextPinned });
      queryClient.invalidateQueries(['feed-data']);
      pushToast({ type: 'success', title: nextPinned ? 'تم تثبيت المنشور' : 'تم إلغاء التثبيت' });
    } catch (error) {
      setIsPinned(!nextPinned);
      pushToast({ type: 'error', title: 'تعذر تحديث التثبيت', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleQuote = () => {
    localStorage.setItem('yamshat_quote_draft', JSON.stringify({ id: post.id, username: post.username, content: post.content }));
    window.dispatchEvent(new Event('yamshat:quote-post'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    pushToast({ type: 'success', title: 'تم تجهيز الاقتباس في صندوق النشر' });
  };

  const handleCommentReaction = (commentId, emoji) => {
    setComments((prev) => prev.map((item) => (
      String(item.id) === String(commentId)
        ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } }
        : item
    )));
  };

  return (
    <Card className={`post-card ${isPinned ? 'pinned' : ''}`} style={{ padding: 16, position: 'relative', border: isPinned ? '1px solid var(--accent)' : '1px solid var(--line)', background: isPinned ? 'rgba(59,130,246,0.03)' : 'var(--bg-card)' }}>
      {isPinned ? (
        <div style={{ position: 'absolute', top: 12, left: 16, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 12, fontWeight: 'bold' }}>
          📌 منشور مثبت
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--line)' }}>
            {post.avatar ? <img src={post.avatar} alt={post.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <strong>{post.username?.[0]?.toUpperCase()}</strong>}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {post.username}
              {post.is_verified ? <span title="حساب موثق">✅</span> : null}
              {post.mentions?.length ? <span className="muted" style={{ fontSize: 12 }}>ذكر {post.mentions.length} مستخدم</span> : null}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>{post.created_at ? new Date(post.created_at).toLocaleString('ar-EG') : 'الآن'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {typeof onShowAnalytics === 'function' ? <Button variant="secondary" onClick={onShowAnalytics}>📊</Button> : null}
          {isOwner ? <Button variant="secondary" onClick={() => setShowEditModal(true)}>تعديل</Button> : null}
          {isOwner ? <Button variant="secondary" onClick={handleTogglePin}>{isPinned ? 'إلغاء التثبيت' : 'تثبيت'}</Button> : null}
          {isOwner ? <Button variant="secondary" onClick={handleDelete}>حذف</Button> : null}
        </div>
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
        <div>{renderRichText(post.content || '')}</div>
        {post.hashtags?.length ? <div style={{ marginTop: 8, fontSize: 13, color: 'var(--primary)' }}>{post.hashtags.map((item) => `#${item}`).join(' · ')}</div> : null}
        {post.media_url ? (
          <div onClick={() => setShowMediaModal(true)} style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: '#000', maxHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {post.media_url.match(/\.(mp4|webm|mov|m3u8)$/i)
              ? <video src={post.media_url} style={{ width: '100%', maxHeight: 420 }} muted loop autoPlay playsInline />
              : <img src={post.media_url} alt="Post Media" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div className="muted" style={{ fontSize: 13 }}>إجمالي التفاعل: {interactionCount} · حفظ {Number(post.saved_count || 0)} · مشاركة {Number(post.share_count || 0)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 12, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={onLike} onContextMenu={(event) => { event.preventDefault(); setShowReactions((prev) => !prev); }} className="post-inline-btn">
                <span style={{ fontSize: 18 }}>{post.is_liked ? myReaction || '❤️' : '🤍'}</span>
                <span>{post.likes_count || 0}</span>
              </button>
              {showReactions ? (
                <div className="reactions-popup" style={{ position: 'absolute', bottom: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 30, padding: '6px 10px', display: 'flex', gap: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 100, marginBottom: 10 }}>
                  {ADVANCED_REACTIONS.map((reaction) => (
                    <button key={reaction.emoji} type="button" onClick={() => { setMyReaction(reaction.emoji); setShowReactions(false); onLike?.(); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>{reaction.emoji}</button>
                  ))}
                </div>
              ) : null}
            </div>

            <button type="button" onClick={() => { setShowCommentsModal(true); refreshComments(); }} className="post-inline-btn">
              <span style={{ fontSize: 18 }}>💬</span>
              <span>{post.comments_count || comments.length || 0}</span>
            </button>

            <button type="button" onClick={handleQuote} className="post-inline-btn">
              <span style={{ fontSize: 18 }}>❝</span>
              <span>اقتباس</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowShareModal(true)} className="post-inline-btn">📤 مشاركة</button>
            <button type="button" onClick={() => saveMutation.mutate()} className="post-inline-btn">{post.is_saved ? '🔖 محفوظ' : '📑 حفظ'}</button>
          </div>
        </div>
      </div>

      <Modal open={showMediaModal} onClose={() => setShowMediaModal(false)} title="الوسائط">
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          {post.media_url?.match(/\.(mp4|webm|mov|m3u8)$/i)
            ? <video src={post.media_url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh' }} />
            : <img src={post.media_url} alt="Full Media" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />}
        </div>
      </Modal>

      <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="مشاركة المنشور">
        <div style={{ display: 'grid', gap: 12 }}>
          <Button onClick={() => handleShare('whatsapp')} style={{ background: '#25D366', color: 'white' }}>WhatsApp</Button>
          <Button onClick={() => handleShare('twitter')} style={{ background: '#000', color: 'white' }}>X</Button>
          <Button variant="secondary" onClick={() => handleShare('copy')}>نسخ الرابط</Button>
        </div>
      </Modal>

      <Modal open={showCommentsModal} onClose={() => setShowCommentsModal(false)} title="التعليقات اللحظية" size="large">
        <NestedComments
          comments={comments}
          onAddComment={handleAddComment}
          onReply={(parentId, content) => handleAddComment({ content, parentId })}
          onToggleReaction={handleCommentReaction}
        />
        <div style={{ display: 'grid', gap: 10, marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows={3} placeholder="تعليق سريع" style={{ width: '100%', borderRadius: 12, padding: 12 }} />
          <Button onClick={() => handleAddComment({ content: commentDraft })}>إرسال سريع</Button>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="تعديل المنشور">
        <div style={{ display: 'grid', gap: 12 }}>
          <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={6} style={{ width: '100%', borderRadius: 12, padding: 12 }} />
          <Button onClick={handleEdit}>حفظ التعديلات</Button>
        </div>
      </Modal>

      <style>{`
        .post-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .post-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .post-inline-btn {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          padding: 0;
        }
      `}</style>
    </Card>
  );
}
