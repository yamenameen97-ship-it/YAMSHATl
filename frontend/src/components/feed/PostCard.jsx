import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import NestedComments from './NestedComments.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  deleteComment,
  deletePost,
  getComments,
  hideComment,
  likeComment,
  pinComment,
  reportComment,
  savePost,
  sharePost,
  updateComment,
  updatePost,
} from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';
import socketManager from '../../services/socketManager.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import UniversalPlayer from '../video/UniversalPlayer.jsx';

const ADVANCED_REACTIONS = [
  { emoji: '❤️', label: 'حب' },
  { emoji: '😂', label: 'ضحك' },
  { emoji: '😮', label: 'مندهش' },
  { emoji: '🔥', label: 'حماس' },
  { emoji: '👏', label: 'تصفيق' },
  { emoji: '💡', label: 'فكرة' },
];

const POST_PREFS_KEY = 'yamshat_post_preferences_v1';

function renderRichText(content = '') {
  return content.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('@')) return <span key={index} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>{part}</span>;
    if (part.startsWith('#')) return <span key={index} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>{part}</span>;
    return part;
  });
}

function loadPostPrefs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(POST_PREFS_KEY) || '{}');
    return {
      hiddenPosts: Array.isArray(parsed.hiddenPosts) ? parsed.hiddenPosts : [],
      archivedPosts: Array.isArray(parsed.archivedPosts) ? parsed.archivedPosts : [],
      mutedAuthors: Array.isArray(parsed.mutedAuthors) ? parsed.mutedAuthors : [],
      reportedPosts: Array.isArray(parsed.reportedPosts) ? parsed.reportedPosts : [],
    };
  } catch {
    return { hiddenPosts: [], archivedPosts: [], mutedAuthors: [], reportedPosts: [] };
  }
}

function savePostPrefs(next) {
  localStorage.setItem(POST_PREFS_KEY, JSON.stringify(next));
}

function toggleListValue(list = [], value) {
  const set = new Set(list);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set);
}

function mapCommentsTree(items = [], updater) {
  return items.map((item) => {
    const next = updater(item);
    return {
      ...next,
      replies: Array.isArray(item.replies) ? mapCommentsTree(item.replies, updater) : [],
    };
  });
}

function replaceCommentInTree(items = [], updatedComment) {
  return items.map((item) => {
    if (String(item.id) === String(updatedComment.id)) {
      return { ...item, ...updatedComment, replies: item.replies || updatedComment.replies || [] };
    }
    return {
      ...item,
      replies: Array.isArray(item.replies) ? replaceCommentInTree(item.replies, updatedComment) : [],
    };
  });
}

function removeCommentFromTree(items = [], commentId) {
  return items
    .filter((item) => String(item.id) !== String(commentId))
    .map((item) => ({
      ...item,
      replies: Array.isArray(item.replies) ? removeCommentFromTree(item.replies, commentId) : [],
    }));
}

function insertCommentIntoTree(items = [], comment) {
  if (!comment?.parent_id) return [comment, ...items];
  return items.map((item) => {
    if (String(item.id) === String(comment.parent_id)) {
      return {
        ...item,
        reply_count: Number(item.reply_count || 0) + 1,
        replies: [comment, ...(item.replies || [])],
      };
    }
    return {
      ...item,
      replies: Array.isArray(item.replies) ? insertCommentIntoTree(item.replies, comment) : [],
    };
  });
}

function looksLikeVideoCandidate(value = '') {
  const candidate = String(value || '').toLowerCase();
  if (!candidate) return false;
  return /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(candidate)
    || /(^data:video\/)|([?&](resource_type|content_type|mime_type)=video)/i.test(candidate)
    || /\/video\/upload\//i.test(candidate)
    || /\b(video|reel|stream|playlist)\b/i.test(candidate);
}

function getPrimaryMediaUrl(post = {}) {
  const candidates = [
    ...(Array.isArray(post.media_urls) ? post.media_urls : []),
    post.media_url,
    post.media,
    post.image_url,
    post.preview_url,
  ].map((item) => resolveMediaUrl(item)).filter(Boolean);
  return candidates[0] || '';
}

function getPosterUrl(post = {}) {
  const candidates = [post.thumbnail_url, post.preview_url, post.image_url]
    .map((item) => resolveMediaUrl(item))
    .filter(Boolean);
  return candidates.find((item) => !looksLikeVideoCandidate(item)) || candidates[0] || '';
}

function isVideoPost(post = {}) {
  if (post.has_video || String(post.media_type || '').toLowerCase() === 'video') return true;
  return [
    ...(Array.isArray(post.media_urls) ? post.media_urls : []),
    post.media_url,
    post.media,
    post.image_url,
  ].some((item) => looksLikeVideoCandidate(item));
}

export default function PostCard({ post, onShowAnalytics, onLike }) {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const queryClient = useQueryClient();
  const prefs = useMemo(() => loadPostPrefs(), []);

  const [showReactions, setShowReactions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsPagination, setCommentsPagination] = useState({ page: 1, limit: 20, has_more: false, total_count: 0 });
  const [commentsSortBy, setCommentsSortBy] = useState('newest');
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || '');
  const [myReaction, setMyReaction] = useState(post?.my_reaction || null);
  const [isPinned, setIsPinned] = useState(Boolean(post?.is_pinned));
  const [postPrefsState, setPostPrefsState] = useState({
    hidden: prefs.hiddenPosts.includes(post.id),
    archived: prefs.archivedPosts.includes(post.id),
    muted: prefs.mutedAuthors.includes(post.username),
    reported: prefs.reportedPosts.includes(post.id),
  });

  const isOwner = useMemo(() => currentUser && post?.username && currentUser === post.username, [currentUser, post?.username]);
  const interactionCount = useMemo(() => {
    const reactionCounts = Object.values(post?.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    return reactionCounts + Number(post?.likes_count || 0) + Number(post?.comments_count || 0) + Number(post?.share_count || 0);
  }, [post?.comments_count, post?.likes_count, post?.reactions, post?.share_count]);

  const mediaUrl = useMemo(() => getPrimaryMediaUrl(post), [post]);
  const posterUrl = useMemo(() => getPosterUrl(post), [post]);
  const hasVideoMedia = useMemo(() => isVideoPost(post), [post]);

  const persistPostPref = (key, value, targetType = 'post') => {
    const currentPrefs = loadPostPrefs();
    let nextPrefs = currentPrefs;

    if (targetType === 'author') {
      nextPrefs = { ...currentPrefs, mutedAuthors: toggleListValue(currentPrefs.mutedAuthors, value) };
      setPostPrefsState((prev) => ({ ...prev, muted: nextPrefs.mutedAuthors.includes(value) }));
    } else if (key === 'hidden') {
      nextPrefs = { ...currentPrefs, hiddenPosts: toggleListValue(currentPrefs.hiddenPosts, value) };
      setPostPrefsState((prev) => ({ ...prev, hidden: nextPrefs.hiddenPosts.includes(value) }));
    } else if (key === 'archived') {
      nextPrefs = { ...currentPrefs, archivedPosts: toggleListValue(currentPrefs.archivedPosts, value) };
      setPostPrefsState((prev) => ({ ...prev, archived: nextPrefs.archivedPosts.includes(value) }));
    } else if (key === 'reported') {
      nextPrefs = { ...currentPrefs, reportedPosts: toggleListValue(currentPrefs.reportedPosts, value) };
      setPostPrefsState((prev) => ({ ...prev, reported: nextPrefs.reportedPosts.includes(value) }));
    }

    savePostPrefs(nextPrefs);
  };

  const refreshComments = async ({ page = 1, append = false, sortBy = commentsSortBy } = {}) => {
    if (append) setCommentsLoadingMore(true);
    try {
      const { data } = await getComments(post.id, { page, limit: 20, sort_by: sortBy });
      const incomingItems = Array.isArray(data) ? data : data?.items || [];
      const incomingPagination = data?.pagination || { page, limit: 20, has_more: false, total_count: incomingItems.length };
      setComments((prev) => append ? [...prev, ...incomingItems] : incomingItems);
      setCommentsPagination(incomingPagination);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل التعليقات', description: error?.response?.data?.detail || error?.message });
    } finally {
      setCommentsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!showCommentsModal) return undefined;
    socketManager.connect();
    const handleIncomingComment = (payload) => {
      if (String(payload?.post_id) !== String(post.id)) return;
      setComments((prev) => {
        const exists = JSON.stringify(prev).includes(`\"id\":${JSON.stringify(payload.id)}`);
        if (exists) return prev;
        return insertCommentIntoTree(prev, { ...payload, justArrived: true, replies: payload.replies || [] });
      });
      setCommentsPagination((prev) => ({ ...prev, total_count: Number(prev.total_count || 0) + 1 }));
      window.setTimeout(() => {
        setComments((prev) => mapCommentsTree(prev, (item) => String(item.id) === String(payload.id) ? { ...item, justArrived: false } : item));
      }, 2600);
    };
    socketManager.on('post_comment', handleIncomingComment);
    return () => socketManager.off('post_comment', handleIncomingComment);
  }, [post.id, showCommentsModal]);

  const saveMutation = useMutation({
    mutationFn: () => savePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
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
      pushToast({ type: 'success', title: platform === 'copy' ? 'تم نسخ الرابط' : 'تمت مشاركة المنشور' });
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
      likes_count: 0,
      is_liked: false,
      optimistic: true,
      justArrived: true,
      replies: [],
    };

    setComments((prev) => insertCommentIntoTree(prev, optimisticComment));
    setCommentDraft('');

    try {
      const { data } = await addComment(post.id, cleanContent, parentId);
      const confirmedComment = { ...(data || optimisticComment), optimistic: false, justArrived: true, replies: data?.replies || [] };
      setComments((prev) => {
        const withoutOptimistic = removeCommentFromTree(prev, optimisticId);
        return insertCommentIntoTree(withoutOptimistic, confirmedComment);
      });
      setCommentsPagination((prev) => ({ ...prev, total_count: Number(prev.total_count || 0) + 1 }));
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      socketManager.emit?.('post_comment', { ...confirmedComment, post_id: post.id });
      window.setTimeout(() => {
        setComments((prev) => mapCommentsTree(prev, (item) => String(item.id) === String(confirmedComment.id) ? { ...item, justArrived: false } : item));
      }, 2600);
    } catch (error) {
      setComments((prev) => removeCommentFromTree(prev, optimisticId));
      pushToast({ type: 'error', title: 'تعذر إضافة التعليق', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      const { data } = await updateComment(commentId, content);
      setComments((prev) => replaceCommentInTree(prev, data || { id: commentId, content, updated_at: new Date().toISOString() }));
      pushToast({ type: 'success', title: 'تم تعديل التعليق' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تعديل التعليق', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => removeCommentFromTree(prev, commentId));
      setCommentsPagination((prev) => ({ ...prev, total_count: Math.max(0, Number(prev.total_count || 0) - 1) }));
      pushToast({ type: 'success', title: 'تم حذف التعليق' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر حذف التعليق', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleLikeComment = async (commentId) => {
    setComments((prev) => mapCommentsTree(prev, (item) => String(item.id) === String(commentId)
      ? { ...item, is_liked: !item.is_liked, likes_count: Number(item.likes_count || 0) + (item.is_liked ? -1 : 1) }
      : item));
    try {
      const { data } = await likeComment(commentId);
      setComments((prev) => mapCommentsTree(prev, (item) => String(item.id) === String(commentId)
        ? { ...item, is_liked: Boolean(data?.liked), likes_count: Number(data?.likes_count || 0) }
        : item));
    } catch (error) {
      setComments((prev) => mapCommentsTree(prev, (item) => String(item.id) === String(commentId)
        ? { ...item, is_liked: !item.is_liked, likes_count: Number(item.likes_count || 0) + (item.is_liked ? -1 : 1) }
        : item));
      pushToast({ type: 'error', title: 'تعذر تحديث الإعجاب', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handlePinComment = async (commentId, pinned) => {
    try {
      const { data } = await pinComment(commentId, pinned);
      setComments((prev) => replaceCommentInTree(prev, data || { id: commentId, is_pinned: pinned }));
      pushToast({ type: 'success', title: pinned ? 'تم تثبيت التعليق' : 'تم إلغاء تثبيت التعليق' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث التثبيت', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleHideComment = async (commentId, hidden) => {
    try {
      const { data } = await hideComment(commentId, hidden);
      setComments((prev) => replaceCommentInTree(prev, data || { id: commentId, is_hidden: hidden }));
      pushToast({ type: 'success', title: hidden ? 'تم إخفاء التعليق' : 'تم إظهار التعليق' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث حالة التعليق', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleReportComment = async (commentId) => {
    try {
      await reportComment(commentId, 'abuse');
      pushToast({ type: 'success', title: 'تم إرسال البلاغ للمراجعة' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إرسال البلاغ', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleCopyComment = async (comment) => {
    try {
      await navigator.clipboard.writeText(comment?.content || '');
      pushToast({ type: 'success', title: 'تم نسخ التعليق' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر النسخ', description: error?.message });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      pushToast({ type: 'success', title: 'تم حذف المنشور' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر حذف المنشور', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleEdit = async () => {
    try {
      await updatePost(post.id, { content: editContent });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
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
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
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
    setComments((prev) => mapCommentsTree(prev, (item) => (
      String(item.id) === String(commentId)
        ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } }
        : item
    )));
  };

  // عرض خاص للبثوث المباشرة النشطة فقط
  // ملاحظة: لا نعرض بطاقة البث إلا إذا لم يتم إنهاؤه صراحة حتى لا تتحول المنشورات السابقة لبث
  const isExplicitLivePost = (post?.is_live_stream === true || post?.type === 'live_stream');
  const liveExplicitlyEnded = post?.is_live === false || post?.type === 'video';
  if (isExplicitLivePost && !liveExplicitlyEnded) {
    // نجرب عدة حقول لصورة الغلاف لتجنب فوات الحقل
    const coverImage = post.thumbnail_url || post.preview_url || post.cover_url
      || post.image_url || post.media_url
      || (Array.isArray(post.media_urls) && post.media_urls[0])
      || (Array.isArray(post.media) && post.media[0]?.url) || '';
    const streamId = post.live_stream_id || post.stream_id || post.live_id || post.liveStreamId;
    return (
      <Card style={{ padding: 16, border: '2px solid var(--accent)', background: 'rgba(59,130,246,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 24 }}>🔴</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>بث مباشر</div>
            <div style={{ color: 'var(--accent)', fontSize: 12 }}>نشط الآن</div>
          </div>
        </div>
        <div style={{ fontSize: 16, marginBottom: 12 }}>{post.content || post.text || post.title}</div>
        {coverImage ? (
          <div
            onClick={() => streamId && (window.location.href = `/live/view/${streamId}`)}
            style={{
              marginBottom: 12,
              borderRadius: 16,
              overflow: 'hidden',
              cursor: streamId ? 'pointer' : 'default',
              background: '#000',
              height: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--accent)',
              position: 'relative',
            }}
          >
            <img
              src={coverImage}
              alt="Live Stream"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 48 }}>▶️</div>
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {streamId ? (
            <Button onClick={() => window.location.href = `/live/view/${streamId}`} style={{ flex: 1 }}>مشاهدة البث</Button>
          ) : null}
          <Button variant="secondary" onClick={() => window.location.href = `/live/studio`}>التحكم بالبث</Button>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
          👁 {post.viewers_count || 0} مشاهد · 💜 {post.likes_count || 0} إعجاب
        </div>
      </Card>
    );
  }

  if (postPrefsState.hidden || postPrefsState.archived || postPrefsState.muted) {
    const label = postPrefsState.hidden ? 'مخفي' : postPrefsState.archived ? 'مؤرشف' : 'مكتوم';
    return (
      <Card style={{ padding: 16, border: '1px dashed var(--line)', background: 'rgba(148,163,184,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <strong>تم إخفاء هذا المنشور من العرض</strong>
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>السبب: {label} · @{post.username}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {postPrefsState.hidden ? <Button variant="secondary" onClick={() => persistPostPref('hidden', post.id)}>إلغاء الإخفاء</Button> : null}
            {postPrefsState.archived ? <Button variant="secondary" onClick={() => persistPostPref('archived', post.id)}>إلغاء الأرشفة</Button> : null}
            {postPrefsState.muted ? <Button variant="secondary" onClick={() => persistPostPref('muted', post.username, 'author')}>إلغاء كتم المحتوى</Button> : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`post-card ${isPinned ? 'pinned' : ''}`} style={{ padding: 16, position: 'relative', border: isPinned ? '1px solid var(--accent)' : '1px solid var(--line)', background: isPinned ? 'rgba(59,130,246,0.03)' : 'var(--bg-card)' }}>
      {isPinned ? (
        <div style={{ position: 'absolute', top: 12, left: 16, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 12, fontWeight: 'bold' }}>
          📌 منشور مثبت
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
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
          <Button variant="secondary" onClick={() => handleShare('copy')}>نسخ الرابط</Button>
          <Button variant="secondary" onClick={() => persistPostPref('hidden', post.id)}>{postPrefsState.hidden ? 'إظهار' : 'إخفاء'}</Button>
          <Button variant="secondary" onClick={() => persistPostPref('archived', post.id)}>{postPrefsState.archived ? 'إلغاء الأرشفة' : 'أرشفة'}</Button>
          <Button variant="secondary" onClick={() => persistPostPref('muted', post.username, 'author')}>{postPrefsState.muted ? 'إلغاء الكتم' : 'كتم المحتوى'}</Button>
          <Button variant="secondary" onClick={() => { persistPostPref('reported', post.id); pushToast({ type: 'success', title: 'تم إرسال بلاغ المنشور' }); }}>إبلاغ</Button>
          {typeof onShowAnalytics === 'function' ? <Button variant="secondary" onClick={onShowAnalytics}>📊</Button> : null}
          {isOwner ? <Button variant="secondary" onClick={() => setShowEditModal(true)}>تعديل</Button> : null}
          {isOwner ? <Button variant="secondary" onClick={handleTogglePin}>{isPinned ? 'إلغاء التثبيت' : 'تثبيت'}</Button> : null}
          {isOwner ? <Button variant="secondary" onClick={handleDelete}>حذف</Button> : null}
        </div>
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
        <div>{renderRichText(post.content || '')}</div>
        {post.hashtags?.length ? <div style={{ marginTop: 8, fontSize: 13, color: 'var(--primary)' }}>{post.hashtags.map((item) => `#${item}`).join(' · ')}</div> : null}
        {mediaUrl ? (
          <div
            onClick={() => setShowMediaModal(true)}
            style={{
              marginTop: 12,
              borderRadius: 16,
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#000',
              minHeight: hasVideoMedia ? 280 : 220,
              maxHeight: 460,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {hasVideoMedia ? (
              <div style={{ width: '100%', minHeight: 280 }} onClick={(event) => event.stopPropagation()}>
                <UniversalPlayer
                  src={mediaUrl}
                  poster={posterUrl}
                  variant="post"
                  muted
                  className="post-media-player"
                />
              </div>
            ) : (
              <img
                src={posterUrl || mediaUrl}
                alt="Post Media"
                style={{ width: '100%', maxHeight: 460, objectFit: 'contain', display: 'block', background: '#000' }}
              />
            )}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div className="muted" style={{ fontSize: 13 }}>
          إجمالي التفاعل: {interactionCount} · حفظ {Number(post.saved_count || 0)} · مشاركة {Number(post.share_count || 0)} · مشاهدات {Number(post.views_count || 0)}
        </div>
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

            <button type="button" onClick={() => { setShowCommentsModal(true); refreshComments({ page: 1, append: false, sortBy: commentsSortBy }); }} className="post-inline-btn">
              <span style={{ fontSize: 18 }}>💬</span>
              <span>{post.comments_count || commentsPagination.total_count || 0}</span>
            </button>

            <button type="button" onClick={handleQuote} className="post-inline-btn">
              <span style={{ fontSize: 18 }}>❝</span>
              <span>إعادة نشر</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowShareModal(true)} className="post-inline-btn">📤 مشاركة</button>
            <button type="button" onClick={() => saveMutation.mutate()} className="post-inline-btn">{post.is_saved ? '🔖 محفوظ' : '📑 حفظ'}</button>
          </div>
        </div>
      </div>

      <Modal open={showMediaModal} onClose={() => setShowMediaModal(false)} title="الوسائط">
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', minHeight: 320 }}>
          {hasVideoMedia ? (
            <div style={{ width: '100%' }}>
              <UniversalPlayer
                src={mediaUrl}
                poster={posterUrl}
                variant="post"
                autoplay
                className="post-media-modal-player"
              />
            </div>
          ) : (
            <img src={posterUrl || mediaUrl} alt="Full Media" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
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
          pagination={commentsPagination}
          sortBy={commentsSortBy}
          loadingMore={commentsLoadingMore}
          onSortChange={(nextSort) => {
            setCommentsSortBy(nextSort);
            refreshComments({ page: 1, append: false, sortBy: nextSort });
          }}
          onLoadMore={() => refreshComments({ page: Number(commentsPagination.page || 1) + 1, append: true, sortBy: commentsSortBy })}
          onAddComment={handleAddComment}
          onReply={(parentId, content) => handleAddComment({ content, parentId })}
          onToggleReaction={handleCommentReaction}
          onLikeComment={handleLikeComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onPinComment={handlePinComment}
          onHideComment={handleHideComment}
          onReportComment={handleReportComment}
          onCopyComment={handleCopyComment}
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
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 14px;
          padding: 8px 10px;
          border-radius: 12px;
          transition: background 0.2s ease;
        }
        .post-inline-btn:hover {
          background: rgba(59,130,246,0.08);
        }
        .post-media-player {
          min-height: 280px;
        }
        .post-media-modal-player {
          min-height: min(70vh, 720px);
        }
      `}</style>
    </Card>
  );
}
