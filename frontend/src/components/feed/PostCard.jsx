import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import NestedComments from './NestedComments.jsx';

/* v86.7 — إصلاح احترافي جذري لعرض البستة على الجوال:
   • نقل كل أزرار الإدارة (نسخ/إخفاء/أرشفة/كتم/إبلاغ/تعديل/تثبيت/حذف) من صف
     متناثر في الهيدر إلى قائمة منسدلة موحّدة (⋯) لمنع الفيضان والتناثر.
   • إعادة تصميم الهيدر والفوتر بشبكة موحّدة تعمل من 320px حتى 768px+.
   • خطوط أصغر أنيقة، ظلال ناعمة، حواف دائرية موحّدة مع MobilePostCard.
   • overflow مقفول على البطاقة لمنع أي عنصر من الخروج عن حدود الشاشة. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  deleteComment,
  deletePost,
  getComments,
  hideComment,
  likeComment,
  pinComment,
  reactToComment,
  reportComment,
  reportPost,
  savePost,
  sharePost,
  togglePostArchived,
  togglePostHidden,
  toggleMutePostAuthor,
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
  const navigate = useNavigate();
  const prefs = useMemo(() => loadPostPrefs(), []);

  /* ✅ فتح الملف الشخصي لمؤلف المنشور عند الضغط على الاسم أو الأفاتار */
  const goToAuthorProfile = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const u = String(post?.username || '').trim().replace(/^@/, '');
    if (!u) return;
    navigate(`/profile/${encodeURIComponent(u)}`);
  };
  const onKeyGoToAuthorProfile = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToAuthorProfile(e); }
  };

  const [showReactions, setShowReactions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  // ✅ v88.3 ROOT FIX: fallback للفيديو إذا فشل UniversalPlayer
  const [videoPlayerFailed, setVideoPlayerFailed] = useState(false);
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

  // v83.8: تم التحويل من localStorage إلى API سحابي يحفظ في قاعدة البيانات.
  // نحتفظ بنسخة محلية mirror فقط لتقليل الوميض (optimistic) ثم نزامن مع الخادم.
  const persistPostPref = async (key, value, targetType = 'post') => {
    const currentPrefs = loadPostPrefs();
    let nextPrefs = currentPrefs;
    let apiCall = null;
    let optimisticFlag = null;

    if (targetType === 'author') {
      const nextList = toggleListValue(currentPrefs.mutedAuthors, value);
      nextPrefs = { ...currentPrefs, mutedAuthors: nextList };
      optimisticFlag = nextList.includes(value);
      setPostPrefsState((prev) => ({ ...prev, muted: optimisticFlag }));
      apiCall = () => toggleMutePostAuthor(post.id, optimisticFlag);
    } else if (key === 'hidden') {
      const nextList = toggleListValue(currentPrefs.hiddenPosts, value);
      nextPrefs = { ...currentPrefs, hiddenPosts: nextList };
      optimisticFlag = nextList.includes(value);
      setPostPrefsState((prev) => ({ ...prev, hidden: optimisticFlag }));
      apiCall = () => togglePostHidden(value, optimisticFlag);
    } else if (key === 'archived') {
      const nextList = toggleListValue(currentPrefs.archivedPosts, value);
      nextPrefs = { ...currentPrefs, archivedPosts: nextList };
      optimisticFlag = nextList.includes(value);
      setPostPrefsState((prev) => ({ ...prev, archived: optimisticFlag }));
      apiCall = () => togglePostArchived(value, optimisticFlag);
    } else if (key === 'reported') {
      const nextList = toggleListValue(currentPrefs.reportedPosts, value);
      nextPrefs = { ...currentPrefs, reportedPosts: nextList };
      optimisticFlag = nextList.includes(value);
      setPostPrefsState((prev) => ({ ...prev, reported: optimisticFlag }));
      apiCall = () => reportPost(value, 'abuse');
    }

    savePostPrefs(nextPrefs); // mirror محلي offline-friendly

    if (apiCall) {
      try {
        await apiCall();
      } catch (error) {
        // Rollback optimistic UI on failure
        savePostPrefs(currentPrefs);
        setPostPrefsState((prev) => ({
          ...prev,
          hidden: currentPrefs.hiddenPosts.includes(value),
          archived: currentPrefs.archivedPosts.includes(value),
          muted: currentPrefs.mutedAuthors.includes(value),
          reported: currentPrefs.reportedPosts.includes(value),
        }));
        pushToast({ type: 'error', title: 'تعذر حفظ التفضيل', description: error?.response?.data?.detail || error?.message || 'فشل الاتصال' });
      }
    }
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

  // ✅ v59.13.5 FIX #1: تتبّع كل setTimeout يُحرّك state للـ comments
  // كي نلغيها عند unmount / إغلاق المودال — لمنع "setState على مكوّن مُزال" + تسرّب ذاكرة.
  const justArrivedTimersRef = useRef(new Set());

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
      const timerId = window.setTimeout(() => {
        justArrivedTimersRef.current.delete(timerId);
        setComments((prev) => mapCommentsTree(prev, (item) => String(item.id) === String(payload.id) ? { ...item, justArrived: false } : item));
      }, 2600);
      justArrivedTimersRef.current.add(timerId);
    };
    socketManager.on('post_comment', handleIncomingComment);
    return () => {
      socketManager.off('post_comment', handleIncomingComment);
      // إلغاء كل المؤقتات المعلّقة عند إغلاق المودال أو unmount
      justArrivedTimersRef.current.forEach((id) => window.clearTimeout(id));
      justArrivedTimersRef.current.clear();
    };
  }, [post.id, showCommentsModal]);

  // cleanup احتياطي عند unmount — يغطّي حالة unmount أثناء إغلاق المودال
  useEffect(() => () => {
    justArrivedTimersRef.current.forEach((id) => window.clearTimeout(id));
    justArrivedTimersRef.current.clear();
  }, []);

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
      // ✅ v59.13.5 FIX #1: تتبّع المؤقّت حتّى نُلغيه عند unmount
      const tId = window.setTimeout(() => {
        justArrivedTimersRef.current.delete(tId);
        setComments((prev) => mapCommentsTree(prev, (item) => String(item.id) === String(confirmedComment.id) ? { ...item, justArrived: false } : item));
      }, 2600);
      justArrivedTimersRef.current.add(tId);
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

  // v83.8: حفظ تفاعلات التعليق في قاعدة البيانات السحابية (كانت محلية فقط)
  const handleCommentReaction = async (commentId, emoji) => {
    // Optimistic update
    setComments((prev) => mapCommentsTree(prev, (item) => (
      String(item.id) === String(commentId)
        ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } }
        : item
    )));
    try {
      const { data } = await reactToComment(commentId, emoji);
      // Sync with server's authoritative counts
      setComments((prev) => mapCommentsTree(prev, (item) => (
        String(item.id) === String(commentId)
          ? { ...item, reactions: data?.reactions || {}, my_reaction: data?.my_reaction || null }
          : item
      )));
    } catch (error) {
      // Revert optimistic increment on failure
      setComments((prev) => mapCommentsTree(prev, (item) => (
        String(item.id) === String(commentId)
          ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Math.max(0, Number(item.reactions?.[emoji] || 1) - 1) } }
          : item
      )));
      pushToast({ type: 'error', title: 'تعذر حفظ التفاعل', description: error?.response?.data?.detail || error?.message });
    }
  };

  /* v86.7 — قائمة الإدارة المنسدلة (⋯) */
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef(null);

  useEffect(() => {
    if (!showActionsMenu) return undefined;
    const handleClickOutside = (e) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
        setShowActionsMenu(false);
      }
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setShowActionsMenu(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showActionsMenu]);

  if (postPrefsState.hidden || postPrefsState.archived || postPrefsState.muted) {
    const label = postPrefsState.hidden ? 'مخفي' : postPrefsState.archived ? 'مؤرشف' : 'مكتوم';
    return (
      <Card className="post-card-hidden" style={{ padding: 14, border: '1px dashed var(--line)', background: 'rgba(148,163,184,0.04)', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong style={{ fontSize: 14 }}>تم إخفاء هذا المنشور من العرض</strong>
            <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>السبب: {label} · @{post.username}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {postPrefsState.hidden ? <Button variant="secondary" onClick={() => persistPostPref('hidden', post.id)}>إلغاء الإخفاء</Button> : null}
            {postPrefsState.archived ? <Button variant="secondary" onClick={() => persistPostPref('archived', post.id)}>إلغاء الأرشفة</Button> : null}
            {postPrefsState.muted ? <Button variant="secondary" onClick={() => persistPostPref('muted', post.username, 'author')}>إلغاء كتم المحتوى</Button> : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`post-card ym-pc ${isPinned ? 'pinned' : ''}`} style={{ position: 'relative', border: isPinned ? '1px solid var(--accent)' : '1px solid var(--line)', background: isPinned ? 'rgba(59,130,246,0.03)' : 'var(--bg-card)' }}>
      {isPinned ? (
        <div className="ym-pc-pin">📌 منشور مثبت</div>
      ) : null}

      {/* ============ الهيدر ============ */}
      <div className="ym-pc-header" dir="rtl">
        <div className="ym-pc-identity">
          <div
            role="link"
            tabIndex={0}
            onClick={goToAuthorProfile}
            onKeyDown={onKeyGoToAuthorProfile}
            aria-label={`فتح الملف الشخصي لـ ${post.username || ''}`}
            title={`فتح ملف ${post.username || ''}`}
            className="ym-pc-avatar"
          >
            {post.avatar ? <img src={post.avatar} alt={post.username} /> : <strong>{post.username?.[0]?.toUpperCase()}</strong>}
          </div>
          <div className="ym-pc-meta">
            <div
              role="link"
              tabIndex={0}
              onClick={goToAuthorProfile}
              onKeyDown={onKeyGoToAuthorProfile}
              aria-label={`فتح الملف الشخصي لـ ${post.username || ''}`}
              title={`فتح ملف ${post.username || ''}`}
              className="ym-pc-username"
            >
              <span className="ym-pc-uname-text">{post.username}</span>
              {post.is_verified ? <span title="حساب موثق" aria-hidden="true">✅</span> : null}
            </div>
            <div className="ym-pc-time">
              {post.created_at ? new Date(post.created_at).toLocaleString('ar-EG') : 'الآن'}
              {post.mentions?.length ? <span className="ym-pc-dot">•</span> : null}
              {post.mentions?.length ? <span>ذكر {post.mentions.length}</span> : null}
            </div>
          </div>
        </div>

        {/* زر ⋯ الوحيد بدل صف الأزرار المتناثرة */}
        <div className="ym-pc-menu-wrap" ref={actionsMenuRef}>
          <button
            type="button"
            className="ym-pc-more-btn"
            aria-label="خيارات المنشور"
            aria-expanded={showActionsMenu ? 'true' : 'false'}
            aria-haspopup="menu"
            onClick={() => setShowActionsMenu((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
          {showActionsMenu ? (
            <div className="ym-pc-menu" role="menu" dir="rtl">
              <button role="menuitem" className="ym-pc-menu-item" onClick={() => { setShowActionsMenu(false); handleShare('copy'); }}>
                <span aria-hidden="true">🔗</span> نسخ الرابط
              </button>
              <button role="menuitem" className="ym-pc-menu-item" onClick={() => { setShowActionsMenu(false); persistPostPref('hidden', post.id); }}>
                <span aria-hidden="true">🙈</span> {postPrefsState.hidden ? 'إظهار' : 'إخفاء'}
              </button>
              <button role="menuitem" className="ym-pc-menu-item" onClick={() => { setShowActionsMenu(false); persistPostPref('archived', post.id); }}>
                <span aria-hidden="true">📦</span> {postPrefsState.archived ? 'إلغاء الأرشفة' : 'أرشفة'}
              </button>
              <button role="menuitem" className="ym-pc-menu-item" onClick={() => { setShowActionsMenu(false); persistPostPref('muted', post.username, 'author'); }}>
                <span aria-hidden="true">🔕</span> {postPrefsState.muted ? 'إلغاء الكتم' : 'كتم المحتوى'}
              </button>
              <button role="menuitem" className="ym-pc-menu-item ym-pc-menu-danger" onClick={() => { setShowActionsMenu(false); persistPostPref('reported', post.id); pushToast({ type: 'success', title: 'تم إرسال بلاغ المنشور' }); }}>
                <span aria-hidden="true">🚩</span> إبلاغ
              </button>
              {typeof onShowAnalytics === 'function' ? (
                <button role="menuitem" className="ym-pc-menu-item" onClick={() => { setShowActionsMenu(false); onShowAnalytics(); }}>
                  <span aria-hidden="true">📊</span> الإحصائيات
                </button>
              ) : null}
              {isOwner ? (
                <>
                  <div className="ym-pc-menu-sep" role="separator" />
                  <button role="menuitem" className="ym-pc-menu-item" onClick={() => { setShowActionsMenu(false); setShowEditModal(true); }}>
                    <span aria-hidden="true">✏️</span> تعديل
                  </button>
                  <button role="menuitem" className="ym-pc-menu-item" onClick={() => { setShowActionsMenu(false); handleTogglePin(); }}>
                    <span aria-hidden="true">📌</span> {isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                  </button>
                  <button role="menuitem" className="ym-pc-menu-item ym-pc-menu-danger" onClick={() => { setShowActionsMenu(false); handleDelete(); }}>
                    <span aria-hidden="true">🗑️</span> حذف المنشور
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* ============ جسم المنشور ============ */}
      <div className="ym-pc-body" dir="rtl">
        <div className="ym-pc-text">{renderRichText(post.content || '')}</div>
        {post.hashtags?.length ? (
          <div className="ym-pc-hashtags">{post.hashtags.map((item) => `#${item}`).join(' · ')}</div>
        ) : null}
        {mediaUrl ? (
          <div
            className="ym-pc-media"
            dir="rtl"
            onClick={() => setShowMediaModal(true)}
            style={{ minHeight: hasVideoMedia ? 220 : 180, fontFamily: "'Noto Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
          >
            {hasVideoMedia ? (
              <div style={{ width: '100%' }} onClick={(event) => event.stopPropagation()}>
                {videoPlayerFailed ? (
                  /* ✅ v88.3 ROOT FIX: native <video> مع source+type كـ fallback مماثل لـ MobilePostCard */
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    poster={posterUrl || undefined}
                    style={{ width: '100%', maxHeight: '80vh', background: '#000', borderRadius: 8 }}
                    onError={(e) => {
                      try {
                        const el = e.currentTarget;
                        const parent = el.parentNode;
                        el.style.display = 'none';
                        if (parent && !parent.querySelector('.ym-pc-video-fallback')) {
                          const fb = document.createElement('div');
                          fb.className = 'ym-pc-video-fallback';
                          fb.style.cssText = 'padding:24px;text-align:center;color:#9CA3AF;background:linear-gradient(135deg,#1a1f33,#0f1422);border-radius:8px;';
                          fb.textContent = 'تعذّر تشغيل الفيديو';
                          parent.appendChild(fb);
                        }
                      } catch { /* ignore */ }
                    }}
                  >
                    <source src={mediaUrl} type={(() => {
                      const u = String(mediaUrl || '').toLowerCase();
                      if (u.endsWith('.webm')) return 'video/webm';
                      if (u.endsWith('.mov') || u.endsWith('.m4v')) return 'video/quicktime';
                      if (u.endsWith('.mkv')) return 'video/x-matroska';
                      if (u.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
                      return 'video/mp4';
                    })()} />
                    متصفحك لا يدعم تشغيل الفيديو.
                  </video>
                ) : (
                  <UniversalPlayer
                    src={mediaUrl}
                    poster={posterUrl}
                    variant="post"
                    muted
                    className="post-media-player"
                    onError={() => setVideoPlayerFailed(true)}
                  />
                )}
              </div>
            ) : (
              /* ✅ v87.22 FIX #2: إضافة onError → يُظهر placeholder جميل بدل "تعذّر تحميل الصورة".
                 و loading="lazy" + decoding="async" لأداء أفضل. */
              <img
                src={posterUrl || mediaUrl}
                alt="وسائط المنشور"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={(e) => { e.currentTarget.parentElement?.classList.remove('is-broken'); }}
                onError={(e) => {
                  e.currentTarget.setAttribute('data-broken', 'true');
                  e.currentTarget.parentElement?.classList.add('is-broken');
                }}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* ============ إحصاءات صغيرة ============ */}
      <div className="ym-pc-stats muted" dir="rtl">
        <span>تفاعل: {interactionCount}</span>
        <span className="ym-pc-dot">•</span>
        <span>حفظ {Number(post.saved_count || 0)}</span>
        <span className="ym-pc-dot">•</span>
        <span>مشاركة {Number(post.share_count || 0)}</span>
        <span className="ym-pc-dot">•</span>
        <span>مشاهدات {Number(post.views_count || 0)}</span>
      </div>

      {/* ============ الفوتر: شبكة موحّدة 5 أزرار ============ */}
      <div className="ym-pc-footer" dir="rtl">
        <div className="ym-pc-actions">
          <div className="ym-pc-action-wrap">
            <button
              type="button"
              onClick={onLike}
              onContextMenu={(event) => { event.preventDefault(); setShowReactions((prev) => !prev); }}
              className={`ym-pc-action ${post.is_liked ? 'is-liked' : ''}`}
              aria-label="إعجاب"
            >
              <span className="ym-pc-emoji">{post.is_liked ? myReaction || '❤️' : '🤍'}</span>
              <span className="ym-pc-count">{post.likes_count || 0}</span>
            </button>
            {showReactions ? (
              <div className="ym-pc-reactions-popup">
                {ADVANCED_REACTIONS.map((reaction) => (
                  <button key={reaction.emoji} type="button" onClick={() => { setMyReaction(reaction.emoji); setShowReactions(false); onLike?.(); }} className="ym-pc-reaction-btn" aria-label={reaction.label}>
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="ym-pc-action"
            aria-label="تعليق"
            onClick={() => { setShowCommentsModal(true); refreshComments({ page: 1, append: false, sortBy: commentsSortBy }); }}
          >
            <span className="ym-pc-emoji">💬</span>
            <span className="ym-pc-count">{post.comments_count || commentsPagination.total_count || 0}</span>
          </button>

          <button type="button" className="ym-pc-action" aria-label="إعادة نشر" onClick={handleQuote}>
            <span className="ym-pc-emoji">❝</span>
            <span className="ym-pc-action-label">نشر</span>
          </button>

          <button type="button" className="ym-pc-action" aria-label="مشاركة" onClick={() => setShowShareModal(true)}>
            <span className="ym-pc-emoji">📤</span>
            <span className="ym-pc-action-label">مشاركة</span>
          </button>

          <button
            type="button"
            className={`ym-pc-action ${post.is_saved ? 'is-saved' : ''}`}
            aria-label={post.is_saved ? 'محفوظ' : 'حفظ'}
            onClick={() => saveMutation.mutate()}
          >
            <span className="ym-pc-emoji">{post.is_saved ? '🔖' : '📑'}</span>
            <span className="ym-pc-action-label">{post.is_saved ? 'محفوظ' : 'حفظ'}</span>
          </button>
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
        /* ============================================================
           v86.7 — PostCard احترافي متجاوب (متغيرات + clamp)
           يعمل بأناقة من 320px حتى 1200px+ بدون تناثر أو overflow.
           ============================================================ */
        .ym-pc {
          --pc-radius: clamp(12px, 2.4vw, 16px);
          --pc-pad-x: clamp(10px, 3vw, 16px);
          --pc-pad-y: clamp(10px, 2.6vw, 14px);
          --pc-gap: clamp(6px, 1.8vw, 10px);
          --pc-avatar: clamp(38px, 10vw, 46px);
          --pc-name: clamp(0.85rem, 3.4vw, 0.98rem);
          --pc-meta: clamp(0.68rem, 2.6vw, 0.76rem);
          --pc-body: clamp(0.86rem, 3.4vw, 0.96rem);
          --pc-btn: clamp(0.72rem, 2.9vw, 0.84rem);
          --pc-emoji: clamp(1rem, 4vw, 1.15rem);

          border-radius: var(--pc-radius) !important;
          padding: var(--pc-pad-y) var(--pc-pad-x) !important;
          overflow: hidden;
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ym-pc:hover { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.09); }

        .ym-pc-pin {
          position: absolute;
          top: 10px;
          left: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
        }

        /* ============ الهيدر ============ */
        .ym-pc-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: var(--pc-gap);
          margin-bottom: var(--pc-gap);
          min-width: 0;
        }
        .ym-pc-identity {
          display: flex;
          flex-direction: row-reverse;
          align-items: center;
          gap: var(--pc-gap);
          min-width: 0;
          flex: 1 1 auto;
          overflow: hidden;
        }
        .ym-pc-avatar {
          width: var(--pc-avatar);
          height: var(--pc-avatar);
          border-radius: 50%;
          background: var(--bg-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid var(--line);
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }
        .ym-pc-avatar:active { transform: scale(0.96); }
        .ym-pc-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ym-pc-meta {
          display: flex;
          flex-direction: column;
          text-align: right;
          min-width: 0;
          flex: 1 1 auto;
          overflow: hidden;
        }
        .ym-pc-username {
          font-weight: 700;
          font-size: var(--pc-name);
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: flex-end;
          cursor: pointer;
          line-height: 1.25;
          max-width: 100%;
          overflow: hidden;
        }
        .ym-pc-uname-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ym-pc-time {
          color: var(--muted, #9ca3af);
          font-size: var(--pc-meta);
          margin-top: 2px;
          display: flex;
          gap: 4px;
          justify-content: flex-end;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ym-pc-dot { opacity: 0.6; }

        /* ============ زر ⋯ + القائمة ============ */
        .ym-pc-menu-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .ym-pc-more-btn {
          background: none;
          border: none;
          color: var(--muted, #9ca3af);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          min-height: 34px;
          transition: background 0.15s ease, color 0.15s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .ym-pc-more-btn:hover { background: rgba(139, 92, 246, 0.08); color: var(--accent, #8B5CF6); }
        .ym-pc-more-btn:active { transform: scale(0.94); }

        .ym-pc-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 180px;
          background: var(--bg-card, #14172a);
          border: 1px solid var(--line, #1F2937);
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
          padding: 6px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: ym-pc-menu-in 0.14s ease-out;
        }
        @keyframes ym-pc-menu-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ym-pc-menu-item {
          background: none;
          border: none;
          color: inherit;
          font-family: inherit;
          font-size: 0.85rem;
          text-align: right;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-start;
          direction: rtl;
          transition: background 0.12s ease, color 0.12s ease;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
        }
        .ym-pc-menu-item:hover {
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent, #8B5CF6);
        }
        .ym-pc-menu-item:active { background: rgba(139, 92, 246, 0.18); }
        .ym-pc-menu-danger { color: #ef4444; }
        .ym-pc-menu-danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .ym-pc-menu-sep {
          height: 1px;
          background: var(--line, #1F2937);
          margin: 4px 0;
        }

        /* ============ جسم المنشور ============ */
        .ym-pc-body {
          margin-bottom: var(--pc-gap);
          max-width: 100%;
        }
        .ym-pc-text {
          font-size: var(--pc-body);
          line-height: 1.65;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          text-align: right;
        }
        .ym-pc-hashtags {
          margin-top: 6px;
          font-size: 0.8rem;
          color: var(--primary, #8B5CF6);
          word-wrap: break-word;
        }
        .ym-pc-media {
          margin-top: 10px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          background: #000;
          max-height: 460px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.06);
          max-width: 100%;
        }
        .ym-pc-media img {
          width: 100%;
          max-height: 460px;
          object-fit: contain;
          display: block;
          background: #000;
        }

        /* ============ إحصاءات ============ */
        .ym-pc-stats {
          font-size: 0.72rem;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--line, rgba(148,163,184,0.15));
          margin-bottom: 6px;
        }

        /* ============ الفوتر: شبكة موحّدة ============ */
        .ym-pc-footer {
          padding-top: 4px;
        }
        .ym-pc-actions {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2px;
          width: 100%;
          align-items: center;
        }
        .ym-pc-action-wrap {
          position: relative;
          display: flex;
          justify-content: center;
        }
        .ym-pc-action {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          background: transparent;
          color: var(--muted, #9ca3af);
          cursor: pointer;
          font-size: calc(var(--pc-btn) + 0.04rem);
          padding: 10px 8px;
          border-radius: 12px;
          transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
          font-family: inherit;
          min-height: 48px;
          width: 100%;
          line-height: 1;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ym-pc-action:hover { background: rgba(139, 92, 246, 0.08); color: var(--accent, #8B5CF6); }
        .ym-pc-action:active { transform: scale(0.94); background: rgba(139, 92, 246, 0.15); }
        .ym-pc-action.is-liked { color: #ef4444; }
        .ym-pc-action.is-saved { color: var(--accent, #8B5CF6); }
        .ym-pc-emoji {
          font-size: calc(var(--pc-emoji) + 0.08rem);
          line-height: 1;
        }
        .ym-pc-count,
        .ym-pc-action-label {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        /* Reactions popup */
        .ym-pc-reactions-popup {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-card, #14172a);
          border: 1px solid var(--line, #1F2937);
          border-radius: 24px;
          padding: 4px 8px;
          display: flex;
          gap: 4px;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
          z-index: 40;
          animation: ym-pc-menu-in 0.14s ease-out;
        }
        .ym-pc-reaction-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          padding: 4px 6px;
          cursor: pointer;
          border-radius: 50%;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .ym-pc-reaction-btn:hover { transform: scale(1.25); background: rgba(139, 92, 246, 0.08); }

        /* ============ شاشات صغيرة (≤400px): أخفِ التسميات ============ */
        @media (max-width: 400px) {
          .ym-pc-action { padding: 9px 5px; gap: 4px; font-size: 0.76rem; min-height: 44px; }
          .ym-pc-action-label { display: none; }
          .ym-pc-stats { font-size: 0.66rem; gap: 3px; }
        }
        @media (max-width: 340px) {
          .ym-pc { --pc-pad-x: 8px; --pc-pad-y: 9px; }
          .ym-pc-action { min-height: 42px; padding: 7px 4px; }
          .ym-pc-emoji { font-size: 0.95rem; }
          .ym-pc-menu { min-width: 160px; }
        }

        /* ============ التوافق الخلفي ============ */
        .post-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
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
        .post-inline-btn:hover { background: rgba(59, 130, 246, 0.08); }
        .post-media-player { min-height: 240px; }
        .post-media-modal-player { min-height: min(70vh, 720px); }
      `}</style>
    </Card>
  );
}
