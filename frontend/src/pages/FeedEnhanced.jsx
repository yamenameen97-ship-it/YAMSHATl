import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
// تم التبديل إلى layouts/MainLayout (الجديد) الذي يستخدم MobileLayout
// (MobileTopBar + BottomNav الجديدين) لتجنب التعارض مع Topbar و MobileDock القديمين.
import MainLayout from '../layouts/MainLayout.jsx';
import MainLayoutDesktop from '../components/layout/MainLayout.jsx';
import useIsMobile from '../hooks/useIsMobile.js';
import FeedMobile from './FeedMobile.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import YamshatIcon from '../components/yamshat/YamshatIcon.jsx';
import useSmartFeed from '../hooks/useSmartFeed.js';
import { formatCompactNumber } from '../components/yamshat/YamshatDesign.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { useAppStore } from '../store/appStore.js';
import { BACKEND_ORIGIN } from '../api/config.js';
import { getCsrfToken } from '../utils/csrf.js';
import { clearStoredUser, getAuthToken, getCurrentUsername, getStoredUserSnapshot } from '../utils/auth.js';
import { redirectToAppPath } from '../utils/router.js';
import { followUser, muteUser, unmuteUser } from '../api/users.js';
import { blockUserApi, unblockUserApi } from '../api/chat.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';
import { getActiveLiveStreams } from '../services/api/liveStreamApi.js';
import {
  likePost as apiLikePost,
  savePost as apiSavePost,
  sharePost as apiSharePost,
  addComment as apiAddComment,
  getComments as apiGetComments,
  deletePost as apiDeletePost,
} from '../api/posts.js';


const FEED_TABS = [
  { id: 'favorites', label: 'المفضلة' },
  { id: 'groups', label: 'المجموعات' },
  { id: 'friends', label: 'الأصدقاء' },
  { id: 'following', label: 'متابعين' },
  { id: 'all', label: 'الكل' },
];

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: 'home', exact: true },
  { to: '/reels', label: 'الريلز', icon: 'clips' },
  { to: '/live/control', label: 'البث', icon: 'live' },
  { to: '/groups', label: 'المجموعات', icon: 'groups' },
  { to: '/stories', label: 'الستوري', icon: 'bookmark' },
  { to: '/inbox', label: 'الدردشة', icon: 'message' },
  { to: '/notifications', label: 'الإشعارات', icon: 'bell' },
  { to: '/search', label: 'البحث الذكي', icon: 'search' },
  { to: '/settings', label: 'الإعدادات', icon: 'menu' },
];

const QUICK_ACTIONS = [
  { label: 'صورة', color: 'green', action: 'image' },
  { label: 'فيديو', color: 'violet', action: 'video' },
  { label: 'رأيك', color: 'rose', action: 'thought' },
];

const DEFAULT_PROFILE_HIGHLIGHTS = [
  { label: 'جديد', kind: 'add' },
];

function timeAgoAr(dateLike) {
  if (!dateLike) return 'الآن';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 'الآن';
  const diffSeconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return 'الآن';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
}

// دالة لتحويل البث المباشر إلى منشور
function convertLiveStreamToPost(stream) {
  if (!stream || !stream.id) return null;
  return {
    id: `live_${stream.id}`,
    type: 'live_stream',
    is_live_stream: true,
    live_stream_id: stream.id,
    title: stream.title || 'بث مباشر',
    content: stream.title || 'بث مباشر',
    text: stream.title || 'بث مباشر جديد',
    author: stream.host_username || 'مستخدم',
    username: stream.host_username || 'مستخدم',
    handle: `@${stream.host_username || 'مستخدم'}`,
    avatar: stream.host_avatar || '',
    user_avatar: stream.host_avatar || '',
    created_at: stream.started_at || new Date().toISOString(),
    media_type: 'live',
    media_url: stream.thumbnail_url || '',
    thumbnail_url: stream.thumbnail_url || '',
    preview_url: stream.thumbnail_url || '',
    viewers_count: stream.viewers_count || 0,
    likes_count: stream.hearts_count || 0,
    comments_count: stream.comments_count || 0,
    is_liked: false,
    is_saved: false,
    is_verified: false,
    is_reel: false,
    has_video: false,
    has_live_stream: true,
    live_stream: stream,
  };
}

const MOCK_POSTS = [];


function normalizeHandle(value = '') {
  const cleaned = String(value || '').trim().replace(/^@+/, '');
  return cleaned ? `@${cleaned}` : '@yamshat';
}

function isVideoMediaUrl(value = '', options = {}) {
  const candidate = String(value || '');
  if (options.forceVideo) return true;
  return /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i.test(candidate) || /\b(video|reel|stream)\b/i.test(candidate);
}

function extractFirstUrl(value = '') {
  const match = String(value || '').match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : '';
}

function stripFirstUrl(value = '') {
  return String(value || '').replace(/\s*https?:\/\/[^\s]+/i, '').trim();
}

function resolveLiveViewerUrl(post = {}) {
  if (post?.live_id) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/#/live/view/${post.live_id}`;
  }

  const directUrl = extractFirstUrl(post.content || post.text || '');
  if (!directUrl) return '';
  return /#\/live\/(watch|view)\//.test(directUrl) ? directUrl : '';
}

function buildFeedPosts(posts = []) {
  if (Array.isArray(posts) && posts.length) {
    return posts.map((post, index) => {
      const rawMedia = Array.isArray(post.media_urls) && post.media_urls.length
        ? post.media_urls
        : [post.media_url || post.image_url].filter(Boolean);

      const normalizedMedia = rawMedia.slice(0, 3).map((url, mediaIndex) => {
        const resolvedUrl = resolveMediaUrl(url);
        const isVideo = isVideoMediaUrl(resolvedUrl || url, {
          forceVideo: Boolean(post.has_video || post.is_reel || post.type === 'video' || post.media_type === 'video'),
        });

        return {
          type: isVideo
            ? 'video'
            : mediaIndex === 0
              ? 'image-primary'
              : 'image-secondary',
          kind: isVideo ? 'video' : 'image',
          url: resolvedUrl,
        };
      });

      return {
        id: post.id || `post-${index}`,
        rawId: post.id || null, // المعرف الحقيقي للمنشور من الـ backend (null للمنشورات الترحيبية)
        userId: post.user_id || null,
        rawUsername: post.username || post.user || '',
        isLive: Boolean(post.is_live_stream),
        liveStreamId: post.live_stream_id || null,
        authorName: post.author_name || post.username || post.user || 'مستخدم يام شات',
        authorAvatar: resolveMediaUrl(post.user_avatar || post.avatar || post.author_avatar || ''),
        handle: normalizeHandle(post.username || post.user || `user.${index + 1}`),
        time: timeAgoAr(post.created_at || post.published_at),
        text: stripFirstUrl(post.content || post.text || ''),
        liveUrl: resolveLiveViewerUrl(post),
        rawText: post.content || post.text || '',
        likes: Number(post.likes_count || post.like_count || post.likes || 0),
        comments: Number(post.comments_count || post.comment_count || 0),
        shares: Number(post.share_count || post.shares || 0),
        views: Number(post.views_count || post.view_count || 0),
        isLiked: Boolean(post.is_liked ?? post.liked_by_me),
        isSaved: Boolean(post.is_saved ?? post.saved_by_me),
        media: normalizedMedia,
      };
    });
  }

  return [];
}

function Avatar({ name, size = 46, accent = false, image = false, src = '' }) {
  const firstLetter = String(name || 'Y').trim().charAt(0) || 'Y';
  return (
    <div
      className={`yam-laptop-avatar ${accent ? 'accent' : ''} ${image ? 'image' : ''}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{firstLetter}</span>}
    </div>
  );
}

function MediaTile({ item, index }) {
  const [renderAsVideo, setRenderAsVideo] = useState(item?.kind === 'video');

  useEffect(() => {
    setRenderAsVideo(item?.kind === 'video');
  }, [item?.kind, item?.url]);

  if (item?.url) {
    return (
      <div className={`yam-post-media-tile tile-${index}`}>
        {renderAsVideo ? (
          <video
            src={item.url}
            className="yam-post-media-video"
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            controls
          />
        ) : (
          <img src={item.url} alt="post media" className="yam-post-media-image" onError={() => setRenderAsVideo(true)} />
        )}
        {index === 0 && renderAsVideo ? (
          <div className="yam-post-play-overlay">
            <YamshatIcon name="play" size={24} filled />
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

function PostCard({ post }) {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const postUrl = `${window.location.origin}/#/post/${post.rawId || post.id}`;
  const mediaItems = Array.isArray(post.media) ? post.media.slice(0, 3) : [];
  // ✅ تهيئة الحالة من البيانات القادمة من الـ backend (is_liked / is_saved)
  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [saved, setSaved] = useState(Boolean(post.isSaved));
  const [likesCount, setLikesCount] = useState(Number(post.likes || 0));
  const [commentsCount, setCommentsCount] = useState(Number(post.comments || 0));
  const [sharesCount, setSharesCount] = useState(Number(post.shares || 0));
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [busyAction, setBusyAction] = useState(null); // 'like' | 'save' | 'share' | null
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const authorUsername = String(post.rawUsername || post.handle || '').replace(/^@/, '');
  const currentUsername = getCurrentUsername();
  const isOwnPost = Boolean(authorUsername && currentUsername && authorUsername === currentUsername);
  // المنشورات الترحيبية أو منشورات البث المباشر لا تملك rawId صحيحًا
  const canCallBackend = Boolean(post.rawId) && !post.isLive;
  const invalidateFeed = useCallback(() => {
    try { queryClient.invalidateQueries({ queryKey: ['feed-data'] }); } catch (_) { /* ignore */ }
  }, [queryClient]);

  const handleOpenLiveAnnouncement = () => {
    if (post.isLive && post.liveStreamId) {
      navigate(`/live/view/${post.liveStreamId}`);
      return;
    }
    if (!post.liveUrl) return;
    const hashRoute = post.liveUrl.includes('/#/') ? post.liveUrl.split('/#/')[1] : '';
    if (hashRoute) {
      navigate(`/${hashRoute.replace(/^\/+/, '')}`);
      return;
    }
    window.location.href = post.liveUrl;
  };

  // ===== ربط الإعجاب بـ backend =====
  const handleLike = async () => {
    if (busyAction === 'like') return;
    const prevLiked = liked;
    const prevCount = likesCount;
    // تحديث متفائل فوري
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    if (!canCallBackend) return;
    setBusyAction('like');
    try {
      const response = await apiLikePost(post.rawId);
      const data = response?.data || {};
      if (typeof data.is_liked === 'boolean') setLiked(data.is_liked);
      if (typeof data.likes_count === 'number') setLikesCount(data.likes_count);
      else if (typeof data.like_count === 'number') setLikesCount(data.like_count);
      invalidateFeed();
    } catch (error) {
      // تراجع عند الفشل
      setLiked(prevLiked);
      setLikesCount(prevCount);
      pushToast({ type: 'error', title: 'تعذر تنفيذ الإعجاب', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction(null);
    }
  };

  // ===== ربط المشاركة بـ backend =====
  const handleShare = async () => {
    if (busyAction === 'share') return;
    let platform = 'copy';
    let succeeded = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorName, text: post.text, url: postUrl });
        platform = 'native';
        succeeded = true;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        platform = 'copy';
        succeeded = true;
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        pushToast({ type: 'info', title: 'تعذر فتح نافذة المشاركة' });
      }
      return;
    }

    if (!succeeded) return;

    // تحديث متفائل
    setSharesCount((count) => count + 1);
    pushToast({ type: 'success', title: 'تمت مشاركة المنشور' });

    if (!canCallBackend) return;
    setBusyAction('share');
    try {
      const response = await apiSharePost(post.rawId, platform);
      const data = response?.data || {};
      if (typeof data.share_count === 'number') setSharesCount(data.share_count);
      else if (typeof data.shares === 'number') setSharesCount(data.shares);
      invalidateFeed();
    } catch (error) {
      // مشاركة الـ UI نجحت بالفعل، فقط نسجّل التحذير
      console.warn('share tracking failed', error);
    } finally {
      setBusyAction(null);
    }
  };

  // ===== ربط الحفظ بـ backend =====
  const handleSave = async () => {
    if (busyAction === 'save') return;
    const prevSaved = saved;
    const nextSaved = !prevSaved;
    setSaved(nextSaved);
    if (!canCallBackend) {
      pushToast({ type: 'success', title: nextSaved ? 'تم حفظ المنشور' : 'تمت إزالة المنشور من المحفوظات' });
      return;
    }
    setBusyAction('save');
    try {
      const response = await apiSavePost(post.rawId);
      const data = response?.data || {};
      if (typeof data.is_saved === 'boolean') setSaved(data.is_saved);
      pushToast({ type: 'success', title: (data.is_saved ?? nextSaved) ? 'تم حفظ المنشور' : 'تمت إزالة المنشور من المحفوظات' });
      invalidateFeed();
    } catch (error) {
      setSaved(prevSaved);
      pushToast({ type: 'error', title: 'تعذر حفظ المنشور', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction(null);
    }
  };

  // ===== حذف المنشور (للمالك فقط) =====
  const handleDeletePost = async () => {
    if (!isOwnPost || !canCallBackend) return;
    if (!window.confirm('هل تريد حذف هذا المنشور نهائيًا؟')) return;
    try {
      await apiDeletePost(post.rawId);
      setIsDeleted(true);
      setShowMoreMenu(false);
      pushToast({ type: 'success', title: 'تم حذف المنشور' });
      invalidateFeed();
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر حذف المنشور', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleMoreOptions = () => {
    setShowMoreMenu((prev) => !prev);
  };

  const handleFollowAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      const response = await followUser(authorUsername);
      const nextFollowing = Boolean(response?.data?.following ?? !isFollowing);
      setIsFollowing(nextFollowing);
      setShowMoreMenu(false);
      pushToast({ type: 'success', title: nextFollowing ? 'تمت المتابعة' : 'تم إلغاء المتابعة' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث المتابعة', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleMuteAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      if (isMuted) await unmuteUser(authorUsername);
      else await muteUser(authorUsername);
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      setShowMoreMenu(false);
      pushToast({ type: 'success', title: nextMuted ? 'تم الكتم' : 'تم إلغاء الكتم' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث الكتم', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleBlockAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      if (isBlocked) await unblockUserApi(authorUsername);
      else await blockUserApi(authorUsername);
      const nextBlocked = !isBlocked;
      setIsBlocked(nextBlocked);
      setShowMoreMenu(false);
      pushToast({ type: 'success', title: nextBlocked ? 'تم الحظر' : 'تم إلغاء الحظر' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث الحظر', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleReportPost = () => {
    try {
      const key = 'yamshat_reported_posts';
      const current = JSON.parse(window.localStorage.getItem(key) || '[]');
      const next = Array.isArray(current) ? current : [];
      next.unshift({ id: post.id, username: authorUsername, created_at: new Date().toISOString() });
      window.localStorage.setItem(key, JSON.stringify(next.slice(0, 100)));
    } catch {
      // ignore storage failures
    }
    setShowMoreMenu(false);
    pushToast({ type: 'success', title: 'تم إرسال البلاغ للمراجعة' });
  };

  // ===== تحميل التعليقات من backend عند فتح القسم لأول مرة =====
  const loadComments = useCallback(async () => {
    if (!canCallBackend || commentsLoaded || commentsLoading) return;
    setCommentsLoading(true);
    try {
      const response = await apiGetComments(post.rawId, { page: 1, limit: 20, sort_by: 'newest' });
      const data = response?.data;
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const mapped = items.map((item) => ({
        id: item.id,
        author: item.username || item.user || item.author_name || 'مستخدم',
        content: item.content || item.text || '',
      }));
      setLocalComments(mapped);
      if (typeof data?.total === 'number') setCommentsCount(data.total);
      else if (typeof data?.total_count === 'number') setCommentsCount(data.total_count);
      setCommentsLoaded(true);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل التعليقات', description: error?.response?.data?.detail || error?.message });
    } finally {
      setCommentsLoading(false);
    }
  }, [canCallBackend, commentsLoaded, commentsLoading, post.rawId, pushToast]);

  // تحميل التعليقات عند فتح اللوحة لأول مرة
  useEffect(() => {
    if (showComments && !commentsLoaded && canCallBackend) {
      loadComments();
    }
  }, [showComments, commentsLoaded, canCallBackend, loadComments]);

  // ===== ربط إضافة تعليق بـ backend =====
  const handleAddComment = async () => {
    const content = commentDraft.trim();
    if (!content || sendingComment) return;

    // منشورات ترحيبية / بث مباشر: تعليق محلي فقط
    if (!canCallBackend) {
      setLocalComments((prev) => [{ id: `${post.id}-${Date.now()}`, author: 'أنت', content }, ...prev]);
      setCommentsCount((count) => count + 1);
      setCommentDraft('');
      if (!showComments) setShowComments(true);
      pushToast({ type: 'success', title: 'تمت إضافة التعليق' });
      return;
    }

    setSendingComment(true);
    // تحديث متفائل
    const tempId = `temp-${Date.now()}`;
    const tempComment = { id: tempId, author: currentUsername || 'أنت', content, pending: true };
    setLocalComments((prev) => [tempComment, ...prev]);
    setCommentsCount((count) => count + 1);
    setCommentDraft('');
    if (!showComments) setShowComments(true);

    try {
      const response = await apiAddComment(post.rawId, content);
      const data = response?.data || {};
      const finalComment = {
        id: data.id || tempId,
        author: data.username || data.user || currentUsername || 'أنت',
        content: data.content || content,
      };
      setLocalComments((prev) => prev.map((c) => (c.id === tempId ? finalComment : c)));
      pushToast({ type: 'success', title: 'تمت إضافة التعليق' });
      invalidateFeed();
    } catch (error) {
      // تراجع
      setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentsCount((count) => Math.max(0, count - 1));
      setCommentDraft(content);
      pushToast({ type: 'error', title: 'تعذر إرسال التعليق', description: error?.response?.data?.detail || error?.message });
    } finally {
      setSendingComment(false);
    }
  };

  if (isDeleted) return null;

  return (
    <article className="yam-post-card-v2">
      <div className="yam-post-head-v2">
        <div className="yam-post-author-v2">
          <Avatar name={post.authorName} size={48} accent={Boolean(post.brandRing)} image src={post.authorAvatar} />
          <div className="yam-post-author-copy">
            <div className="yam-post-author-line">
              <strong>{post.authorName}</strong>
              <span className="yam-verified-badge">✓</span>
            </div>
            <div className="yam-post-handle">{post.handle}</div>
          </div>
        </div>
        <div className="yam-post-meta-v2">
          <span>{post.time}</span>
          <div className="yam-settings-menu-wrap">
            <button type="button" className="yam-ghost-icon-btn" aria-label="خيارات المنشور" onClick={handleMoreOptions} title="خيارات المنشور">
              <YamshatIcon name="more" size={18} />
            </button>
            {showMoreMenu ? (
              <div className="yam-settings-popover">
                {!isOwnPost ? (
                  <>
                    <button type="button" className="yam-settings-popover-item" onClick={handleFollowAuthor}>{isFollowing ? 'إلغاء المتابعة' : 'متابعة'}</button>
                    <button type="button" className="yam-settings-popover-item" onClick={handleMuteAuthor}>{isMuted ? 'إلغاء الكتم' : 'كتم'}</button>
                    <button type="button" className="yam-settings-popover-item danger" onClick={handleBlockAuthor}>{isBlocked ? 'إلغاء الحظر' : 'حظر'}</button>
                    <button type="button" className="yam-settings-popover-item danger" onClick={handleReportPost}>بلاغ</button>
                  </>
                ) : (
                  <button type="button" className="yam-settings-popover-item danger" onClick={handleDeletePost}>حذف المنشور</button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {post.isLive ? (
        <div 
          className="live-stream-card-special" 
          onClick={handleOpenLiveAnnouncement}
          style={{ 
            cursor: 'pointer', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            position: 'relative',
            border: '2px solid #0047ff',
            background: '#000',
            margin: '12px 0'
          }}
        >
          {mediaItems[0]?.url ? (
            <img src={mediaItems[0].url} alt="Cover" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px' }}>📺</span>
            </div>
          )}
          
          <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
            <span className="live-badge" style={{ 
              background: '#0047ff', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 'bold',
              boxShadow: '0 0 15px #0047ff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', display: 'inline-block' }}></span>
              مباشر
            </span>
          </div>
          
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            padding: '16px', 
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            color: 'white'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{post.authorName} بدأ البث</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>👁 {post.viewers || 0} مشاهد</p>
          </div>
        </div>
      ) : (
        <>
          <p className="yam-post-copy-v2">{post.text}</p>

          {post.liveUrl ? (
            <button
              type="button"
              className="yam-post-live-cta"
              onClick={handleOpenLiveAnnouncement}
            >
              🎥 متابعة البث المباشر
            </button>
          ) : null}

          {mediaItems.length ? (
            <div className={`yam-post-media-grid-v2 media-count-${mediaItems.length}`}>
              {mediaItems.map((item, index) => (
                <MediaTile key={`${post.id}-media-${index}`} item={item} index={index} />
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className="yam-post-actions-v2">
        <button type="button" className={liked ? 'active' : ''} onClick={handleLike} disabled={busyAction === 'like'} aria-label="إعجاب">
          <YamshatIcon name="heart" size={17} />{liked ? `تم الإعجاب${likesCount ? ` (${likesCount})` : ''}` : `أعجبني${likesCount ? ` (${likesCount})` : ''}`}
        </button>
        <button type="button" className={showComments ? 'active' : ''} onClick={() => setShowComments((prev) => !prev)} aria-label="تعليق">
          <YamshatIcon name="comment" size={17} />تعليق{commentsCount ? ` (${commentsCount})` : ''}
        </button>
        <button type="button" onClick={handleShare} disabled={busyAction === 'share'} aria-label="مشاركة">
          <YamshatIcon name="repeat" size={17} />مشاركة{sharesCount ? ` (${sharesCount})` : ''}
        </button>
        <button type="button" className={saved ? 'active' : ''} onClick={handleSave} disabled={busyAction === 'save'} aria-label="حفظ">
          <YamshatIcon name="bookmark" size={17} />{saved ? 'محفوظ' : 'حفظ'}
        </button>
      </div>

      {showComments ? (
        <div className="yam-post-comments-panel">
          <div className="yam-post-comment-composer">
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="اكتب تعليقك هنا..."
              rows={3}
              disabled={sendingComment}
            />
            <button type="button" className="yam-post-comment-send" onClick={handleAddComment} disabled={sendingComment || !commentDraft.trim()}>
              {sendingComment ? 'جارٍ الإرسال...' : 'إرسال التعليق'}
            </button>
          </div>

          <div className="yam-post-comment-list">
            {commentsLoading ? (
              <div className="yam-post-comment-empty">جارٍ تحميل التعليقات...</div>
            ) : localComments.length ? localComments.map((comment) => (
              <div key={comment.id} className="yam-post-comment-item" style={comment.pending ? { opacity: 0.6 } : undefined}>
                <strong>{comment.author}</strong>
                <p>{comment.content}</p>
              </div>
            )) : <div className="yam-post-comment-empty">لا توجد تعليقات بعد، كن أول من يعلّق.</div>}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function FeedEnhanced() {
  // التحويل إلى تصميم الموبايل الجديد (مطابق للنموذج المرجعي)
  // الموبايل: استخدام layouts/MainLayout (الجديد) الذي يلفّ MobileLayout (TopBar + BottomNav الجديدين)
  // الديسكتوب: استخدام MainLayoutDesktop القديم (Topbar) - لم يـمس.
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MainLayout>
        <FeedMobile />
      </MainLayout>
    );
  }
  return (
    <MainLayoutDesktop>
      <FeedDesktopInner />
    </MainLayoutDesktop>
  );
}

function FeedDesktopInner() {
  const navigate = useNavigate();
  const centerStageRef = useRef(null);
  const postStackRef = useRef(null);
  const { pushToast } = useToast();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const [activeTab, setActiveTab] = useState('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);
  const [loadingLiveStreams, setLoadingLiveStreams] = useState(false);
  const profile = getStoredUserSnapshot();
  const profileDetails = profile?.profile || {};
  const username = getCurrentUsername() || profile?.username || profile?.user || '';
  const displayName = profileDetails.full_name || profile?.name || profile?.full_name || username || 'مستخدم يام شات';
  const profileAvatar = resolveMediaUrl(profileDetails.avatar || profile?.avatar || profileDetails.avatar_url || profile?.avatar_url || '');
  const isVerified = Boolean(profile?.is_verified || profile?.verified || profileDetails.is_verified || profileDetails.verified);
  const followersCount = Number(profile?.followers_count || profileDetails.followers_count || profile?.followers || 0);
  const followingCount = Number(profile?.following_count || profileDetails.following_count || profile?.following || 0);
  const profileBio = [profileDetails.activity_tagline, profileDetails.bio, profileDetails.location || profile?.location]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('\n') || 'حدّث ملفك الشخصي ليظهر وصفك الحقيقي هنا.';
  const joinedAt = profile?.created_at || profileDetails.created_at || profileDetails.joined_at || '';
  const joinedLabel = joinedAt
    ? new Date(joinedAt).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
    : '';
  const dynamicHighlightValues = Array.isArray(profileDetails.highlights)
    ? profileDetails.highlights
    : Array.isArray(profileDetails.interests)
      ? profileDetails.interests
      : [];
  const profileHighlights = [
    ...DEFAULT_PROFILE_HIGHLIGHTS,
    ...dynamicHighlightValues.filter(Boolean).slice(0, 4).map((item, index) => ({
      label: String(item).slice(0, 18),
      kind: ['travel', 'design', 'moments', 'projects'][index % 4],
    })),
  ];
  const summaryItems = [
    profileDetails.profession ? { icon: 'profile', text: profileDetails.profession } : null,
    profileDetails.company ? { icon: 'groups', text: profileDetails.company } : null,
    (profileDetails.location || profile?.location) ? { icon: 'discover', text: profileDetails.location || profile?.location } : null,
    joinedLabel ? { icon: 'bookmark', text: `انضم في ${joinedLabel}` } : null,
  ].filter(Boolean);

  const {
    posts = [],
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useSmartFeed({
    filterType: activeTab === 'all' ? 'all' : 'following',
    sortBy: 'recent',
    limit: 12,
    pollingInterval: 25_000,
  });

  // جلب البثوث المباشرة النشطة وإضافتها إلى المنشورات
  useEffect(() => {
    const fetchActiveLiveStreams = async () => {
      try {
        setLoadingLiveStreams(true);
        const response = await getActiveLiveStreams({ limit: 10 });
        const streams = Array.isArray(response?.data) ? response.data : [];
        setLiveStreams(streams);
      } catch (error) {
        console.error('Error fetching live streams:', error);
        setLiveStreams([]);
      } finally {
        setLoadingLiveStreams(false);
      }
    };

    fetchActiveLiveStreams();
    const interval = setInterval(fetchActiveLiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveStreamPosts = liveStreams.map(convertLiveStreamToPost).filter(Boolean);
  const feedPosts = useMemo(() => {
    const allPosts = buildFeedPosts(posts);
    return [...liveStreamPosts, ...allPosts];
  }, [posts, liveStreamPosts]);

  const totalPosts = feedPosts.length;
  const profilePostsCount = Number(profile?.posts_count || profileDetails.posts_count || profileDetails.posts || profile?.posts || totalPosts || 0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const pageContent = document.querySelector('.page-content');
    if (!pageContent) return undefined;

    const mediaQuery = window.matchMedia('(min-width: 1141px)');
    const syncScrollMode = () => {
      pageContent.classList.toggle('yam-feed-page-locked', mediaQuery.matches);
    };

    syncScrollMode();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncScrollMode);
      return () => {
        pageContent.classList.remove('yam-feed-page-locked');
        mediaQuery.removeEventListener('change', syncScrollMode);
      };
    }

    mediaQuery.addListener(syncScrollMode);
    return () => {
      pageContent.classList.remove('yam-feed-page-locked');
      mediaQuery.removeListener(syncScrollMode);
    };
  }, []);

  useEffect(() => {
    const scroller = centerStageRef.current;
    if (!scroller) return undefined;

    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;
      const remainingDistance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      if (remainingDistance <= 320) fetchNextPage();
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const scroller = centerStageRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const handleQuickAction = (action) => {
    document.querySelector('.yam-home-composer-slot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new CustomEvent('yamshat:composer-action', { detail: { action } }));
  };

  const handleThemeToggle = () => {
    toggleTheme();
    pushToast({ type: 'success', title: theme === 'dark' ? 'تم تفعيل الوضع النهاري' : 'تم تفعيل الوضع الليلي' });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      await fetch(`${BACKEND_ORIGIN}/api/auth/logout`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
      });
    } catch {
      // ignore transport errors and clear the session anyway
    } finally {
      clearStoredUser();
      setIsSettingsOpen(false);
      setLoggingOut(false);
      redirectToAppPath('/login');
    }
  };

  return (
    <>
      <div className="yam-laptop-page" dir="rtl">
        <div className="yam-page-noise" />
        <div className="yam-laptop-shell">
          <aside className="yam-left-rail">
            <div className="yam-logo-card">
              <div className="yam-logo-mark">Y</div>
              <div className="yam-logo-text">YAMSHAT</div>
            </div>

            <nav className="yam-main-nav-desktop">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={Boolean(item.exact)}
                  className={({ isActive }) => `yam-nav-link-desktop ${isActive ? 'active' : ''}`}
                >
                  <span className="yam-nav-link-icon"><YamshatIcon name={item.icon} size={18} /></span>
                  <span>{item.label}</span>
                  {item.badge ? <span className="yam-nav-link-badge">{item.badge}</span> : null}
                </NavLink>
              ))}
            </nav>

            <div className="yam-rail-footer">
              <button type="button" className="yam-dark-toggle-row yam-action-surface" onClick={handleThemeToggle} aria-label="تبديل الوضع الليلي">
                <div className="yam-dark-toggle-copy">
                  <YamshatIcon name="moon" size={18} />
                  <span>الوضع الليلي</span>
                </div>
                <span className={`yam-dark-toggle-switch ${theme === 'dark' ? 'active' : ''}`}><span /></span>
              </button>

              <button type="button" className="yam-logout-btn-desktop" onClick={handleLogout} disabled={loggingOut}>
                <YamshatIcon name="message" size={16} />
                <span>{loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل خروج'}</span>
              </button>
            </div>
          </aside>

          <main className="yam-center-stage" ref={centerStageRef}>
            <section className="yam-feed-header-card">
              <div className="yam-feed-header-top">
                <h1>المنشورات</h1>
                <div className="yam-mobile-brand">YAMSHAT</div>
              </div>

              <div className="yam-composer-prompt-bar">
                <div className="yam-composer-actions-inline">
                  {QUICK_ACTIONS.map((item) => (
                    <button key={item.label} type="button" className={`yam-mini-action ${item.color}`} onClick={() => handleQuickAction(item.action)}>
                      <span className="dot" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="yam-home-composer-slot">
                <PostComposer />
              </div>

              <div className="yam-feed-tabs">
                {FEED_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`yam-feed-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="yam-post-stack-v2" ref={postStackRef}>
              {feedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              <div className="yam-feed-status-row">
                {isFetchingNextPage
                  ? 'جارٍ تحميل المنشورات الأقدم...'
                  : hasNextPage
                    ? 'اسحب شريط التمرير لأسفل لإظهار منشورات أكثر.'
                    : isFetching && !feedPosts.length
                      ? 'جارٍ تحميل المنشورات...'
                      : 'تم عرض كل المنشورات الحالية.'}
              </div>
            </div>
          </main>

          <aside className="yam-right-rail">
            <section className="yam-profile-card-v2">
              <div className="yam-profile-cover-v2">
                <div className="yam-profile-cover-brand">YAMSHAT</div>
              </div>

              <div className="yam-profile-body-v2">
                <div className="yam-profile-avatar-wrap">
                  <Avatar name={displayName} size={96} accent image src={profileAvatar} />
                  <button type="button" className="yam-avatar-camera-btn" aria-label="تغيير الصورة" onClick={() => navigate('/profile')} title="الانتقال إلى الملف الشخصي">
                    <YamshatIcon name="profile" size={16} />
                  </button>
                </div>

                <div className="yam-profile-name-v2">
                  <strong>{displayName}</strong>
                  {isVerified ? <span className="yam-verified-badge">✓</span> : null}
                </div>
                <div className="yam-profile-handle-v2">{normalizeHandle(username || displayName)}</div>

                <div className="yam-profile-stats-v2">
                  <div><strong>{formatCompactNumber(profilePostsCount)}</strong><span>المنشورات</span></div>
                  <div><strong>{formatCompactNumber(followersCount)}</strong><span>المتابعين</span></div>
                  <div><strong>{formatCompactNumber(followingCount)}</strong><span>يتابع</span></div>
                </div>

                <p className="yam-profile-bio-v2">{profileBio}</p>

                <div className="yam-profile-actions-v2">
                  <button type="button" className="yam-primary-action-btn" onClick={() => navigate('/profile')}>تعديل الملف الشخصي</button>
                  <div className="yam-settings-menu-wrap">
                    <button type="button" className="yam-settings-icon-btn" onClick={() => setIsSettingsOpen((prev) => !prev)} aria-expanded={isSettingsOpen} aria-label="فتح إعدادات سريعة"><YamshatIcon name="menu" size={18} /></button>
                    {isSettingsOpen ? (
                      <div className="yam-settings-popover">
                        <button type="button" className="yam-settings-popover-item" onClick={handleThemeToggle}>
                          <span>الوضع الليلي</span>
                          <span className={`yam-dark-toggle-switch small ${theme === 'dark' ? 'active' : ''}`}><span /></span>
                        </button>
                        <button type="button" className="yam-settings-popover-item danger" onClick={handleLogout} disabled={loggingOut}>
                          <span>{loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل خروج'}</span>
                          <YamshatIcon name="message" size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="yam-highlights-row-v2">
                  {profileHighlights.map((item) => (
                    <div key={item.label} className="yam-highlight-item-v2">
                      <div className={`yam-highlight-ring ${item.kind}`}>
                        {item.kind === 'add' ? <YamshatIcon name="plus" size={18} /> : null}
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {summaryItems.length ? (
              <section className="yam-summary-card-v2">
                <div className="yam-section-title-row">
                  <h3>معلومات مختصرة</h3>
                </div>
                <div className="yam-summary-list-v2">
                  {summaryItems.map((item) => (
                    <div key={item.text} className="yam-summary-row-v2">
                      <span className="yam-summary-icon"><YamshatIcon name={item.icon} size={16} /></span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>

        <style>{`
          .yam-laptop-page {
            position: relative;
            min-height: 100%;
            width: 100%;
            max-width: 100%;
            background:
              radial-gradient(circle at top right, rgba(121, 40, 202, 0.22), transparent 18%),
              radial-gradient(circle at top left, rgba(96, 165, 250, 0.10), transparent 16%),
              linear-gradient(180deg, #040815 0%, #070d1d 48%, #060913 100%);
            color: #f5f7ff;
            /* السماح بالتمرير العمودي الكامل على كل الأجهزة */
            overflow-x: hidden;
            overflow-y: visible;
          }

          .yam-page-noise {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: radial-gradient(rgba(255,255,255,0.06) 0.5px, transparent 0.5px);
            background-size: 14px 14px;
            opacity: 0.14;
          }

          .yam-laptop-shell {
            position: relative;
            width: min(1800px, 100%);
            max-width: 100%;
            min-height: 100%;
            margin: 0 auto;
            padding: 20px 14px 32px;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 250px minmax(0, 1fr) 360px;
            gap: 18px;
            align-items: start;
            /* على الديسكتوب: نجعل الـ shell بالكامل يملأ الشاشة لتعمل آلية sticky بشكل صحيح */
            min-height: calc(100vh - 24px);
          }

          .yam-left-rail,
          .yam-center-stage,
          .yam-right-rail {
            min-width: 0;
          }

          .yam-left-rail,
          .yam-right-rail {
            position: sticky !important;
            top: 18px;
            align-self: start;
            /* الأشرطة الجانبية ثابتة عند التمرير ولها تمريرها الداخلي الخاص إذا طال محتواها */
            max-height: calc(100vh - 36px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
            z-index: 10;
            contain: layout style paint;
          }

          .yam-left-rail::-webkit-scrollbar,
          .yam-right-rail::-webkit-scrollbar {
            width: 6px;
          }

          .yam-left-rail::-webkit-scrollbar-thumb,
          .yam-right-rail::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 999px;
          }

          .yam-logo-card,
          .yam-feed-header-card,
          .yam-post-card-v2,
          .yam-profile-card-v2,
          .yam-summary-card-v2,
          .yam-main-nav-desktop,
          .yam-rail-footer {
            border: 1px solid rgba(255,255,255,0.07);
            background: linear-gradient(180deg, rgba(7, 12, 25, 0.96), rgba(6, 10, 20, 0.92));
            border-radius: 26px;
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.32);
            backdrop-filter: blur(22px);
          }

          .yam-left-rail {
            display: grid;
            gap: 16px;
          }

          /* على الجوال والتابلت، شيل القيود المتعلقة بالـ rail اليساري */
          @media (max-width: 1140px) {
            .yam-left-rail {
              max-height: none;
              overflow: visible;
            }
          }

          .yam-logo-card {
            min-height: 190px;
            display: grid;
            place-items: center;
            text-align: center;
            padding: 22px;
            background:
              radial-gradient(circle at 50% 15%, rgba(152, 62, 255, 0.32), transparent 38%),
              linear-gradient(180deg, rgba(11, 14, 35, 0.98), rgba(5, 10, 20, 0.98));
          }

          .yam-logo-mark {
            width: 84px;
            height: 84px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            font-size: 46px;
            font-weight: 900;
            color: #dfc5ff;
            border: 1px solid rgba(178, 111, 255, 0.34);
            background: linear-gradient(180deg, rgba(119, 65, 245, 0.25), rgba(71, 27, 152, 0.1));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(103, 45, 221, 0.24);
          }

          .yam-logo-text {
            margin-top: 14px;
            letter-spacing: 0.24em;
            font-size: 15px;
            font-weight: 800;
            color: #e9ddff;
          }

          .yam-main-nav-desktop {
            padding: 14px;
            display: grid;
            gap: 8px;
          }

          .yam-nav-link-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 14px;
            color: #d7def6;
            transition: 0.22s ease;
            font-weight: 700;
          }

          .yam-nav-link-desktop:hover,
          .yam-nav-link-desktop.active {
            color: #fff;
            background: linear-gradient(90deg, rgba(114, 60, 240, 0.24), rgba(85, 73, 243, 0.08));
            box-shadow: var(--shadow-inset-soft);
          }

          .yam-nav-link-icon {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            color: #bda8ff;
          }

          .yam-nav-link-badge {
            margin-inline-start: auto;
            min-width: 26px;
            height: 26px;
            padding: 0 8px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }

          .yam-rail-footer {
            padding: 14px;
            display: grid;
            gap: 12px;
          }

          .yam-dark-toggle-row,
          .yam-logout-btn-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            background: rgba(255,255,255,0.03);
            color: #e5e7f8;
            border: 1px solid rgba(255,255,255,0.05);
          }

          .yam-action-surface {
            width: 100%;
            cursor: pointer;
          }

          .yam-dark-toggle-copy,
          .yam-logout-btn-desktop {
            font-weight: 700;
          }

          .yam-dark-toggle-copy {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .yam-dark-toggle-switch {
            width: 48px;
            height: 28px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            padding: 3px;
            display: flex;
            align-items: center;
          }

          .yam-dark-toggle-switch span {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.26);
            transition: transform 0.2s ease;
          }

          .yam-dark-toggle-switch.active {
            justify-content: flex-end;
            background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.9));
          }

          .yam-logout-btn-desktop {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.05);
            justify-content: center;
            cursor: pointer;
          }

          .yam-logout-btn-desktop:disabled {
            opacity: 0.7;
            cursor: wait;
          }

          .page-content.yam-feed-page-locked {
            overflow-y: hidden;
          }

          /* منطقة المنشورات المركزية: تأخذ ارتفاع كامل للشاشة وتسمح بالتمرير الداخلي للـ post-stack
             فقط، دون أن تؤثر على ثبات الأشرطة الجانبية */
          .yam-center-stage {
            position: sticky;
            top: 18px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            min-height: 0;
            height: calc(100vh - 36px);
            max-height: calc(100vh - 36px);
            overflow-x: hidden;
            overflow-y: auto;
            align-self: start;
            direction: rtl;
            scrollbar-gutter: stable both-edges;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.92) rgba(255,255,255,0.06);
            padding-inline-start: 4px;
            padding-inline-end: 10px;
            scroll-behavior: smooth;
            overscroll-behavior-y: contain;
          }

          .yam-center-stage > * {
            direction: rtl;
          }

          .yam-center-stage::-webkit-scrollbar {
            width: 14px;
            -webkit-appearance: none;
          }

          .yam-center-stage::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.06);
            border-radius: 999px;
            box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.18);
          }

          .yam-center-stage::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.92), rgba(99, 102, 241, 0.88));
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .yam-center-stage::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(167, 139, 250, 1), rgba(129, 140, 248, 1));
          }

          .yam-feed-header-card {
            position: relative;
            top: auto;
            z-index: 1;
            flex-shrink: 0;
            padding: 18px 20px 14px;
          }

          .yam-feed-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .yam-feed-header-top h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 900;
          }

          .yam-mobile-brand {
            display: none;
            font-size: 12px;
            letter-spacing: 0.22em;
            color: #bda8ff;
            font-weight: 800;
          }

          .yam-composer-prompt-bar {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            margin-bottom: 14px;
          }

          .yam-home-composer-slot {
            margin-bottom: 14px;
          }

          .yam-home-composer-slot > * {
            margin-bottom: 0 !important;
          }

          .yam-composer-actions-inline {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .yam-mini-action {
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            min-height: 44px;
            padding: 0 14px;
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            cursor: pointer;
          }

          .yam-mini-action:hover {
            background: rgba(139, 92, 246, 0.12);
            border-color: rgba(167, 139, 250, 0.24);
          }

          .yam-mini-action .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .yam-mini-action.green .dot { background: #22c55e; }
          .yam-mini-action.violet .dot { background: #8b5cf6; }
          .yam-mini-action.rose .dot { background: #f43f5e; }

          .yam-composer-input-surface {
            min-height: 52px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #95a0c7;
            font-weight: 600;
          }

          .yam-feed-tabs {
            display: flex;
            align-items: center;
            gap: 18px;
            overflow-x: auto;
            padding-bottom: 2px;
          }

          .yam-feed-tabs::-webkit-scrollbar { display: none; }

          .yam-feed-tab {
            position: relative;
            background: transparent;
            border: none;
            color: #97a2c6;
            padding: 10px 0;
            font-weight: 700;
            white-space: nowrap;
          }

          .yam-feed-tab.active {
            color: #fff;
          }

          .yam-feed-tab.active::after {
            content: '';
            position: absolute;
            inset-inline: 0;
            bottom: 0;
            height: 3px;
            border-radius: 999px;
            background: linear-gradient(90deg, #8b5cf6, #d946ef);
          }

          .yam-post-stack-v2 {
            flex: 0 0 auto;
            min-height: min-content;
            position: relative;
            overflow: visible !important;
            display: grid;
            gap: 18px;
            direction: rtl;
            padding-inline-start: 0;
            padding-inline-end: 0;
            padding-bottom: 28px;
            border: 0;
            -webkit-overflow-scrolling: touch;
            contain: none;
          }


          .yam-post-stack-v2 > * {
            direction: rtl;
          }

          .yam-post-stack-v2::-webkit-scrollbar {
            width: 14px;
            -webkit-appearance: none;
          }

          .yam-post-stack-v2::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.06);
            border-radius: 999px;
            box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.18);
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.92), rgba(99, 102, 241, 0.88));
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(167, 139, 250, 1), rgba(129, 140, 248, 1));
          }


          .yam-feed-status-row {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 54px;
            padding: 0 16px;
            border-radius: 18px;
            border: 1px dashed rgba(167, 139, 250, 0.22);
            background: rgba(139, 92, 246, 0.06);
            color: #c4b5fd;
            font-size: 13px;
            font-weight: 700;
          }

          .yam-post-card-v2 {
            padding: 18px;
            display: grid;
            gap: 14px;
          }

          .yam-post-head-v2,
          .yam-post-author-v2,
          .yam-post-meta-v2,
          .yam-post-stats-v2,
          .yam-post-reactions-v2,
          .yam-post-actions-v2,
          .yam-profile-name-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .yam-post-head-v2,
          .yam-post-stats-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            justify-content: space-between;
          }

          .yam-post-meta-v2 {
            color: #8894bd;
            font-size: 13px;
          }

          .yam-post-author-copy {
            min-width: 0;
          }

          .yam-post-author-line,
          .yam-profile-name-v2 {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .yam-post-author-line strong,
          .yam-profile-name-v2 strong {
            font-size: 18px;
          }

          .yam-post-handle,
          .yam-profile-handle-v2 {
            color: #8f9cc5;
            font-size: 14px;
            margin-top: 2px;
          }

          .yam-verified-badge {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            background: #3b82f6;
            color: #fff;
            font-size: 11px;
            font-weight: 900;
            flex-shrink: 0;
          }

          .yam-ghost-icon-btn,
          .yam-settings-icon-btn {
            width: 38px;
            height: 38px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.04);
            color: #e8ebff;
            display: grid;
            place-items: center;
          }

          .yam-settings-menu-wrap {
            position: relative;
          }

          .yam-settings-popover {
            position: absolute;
            top: calc(100% + 10px);
            inset-inline-end: 0;
            width: min(260px, 72vw);
            padding: 10px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(8, 12, 26, 0.96);
            box-shadow: 0 24px 50px rgba(0, 0, 0, 0.34);
            display: grid;
            gap: 8px;
            z-index: 20;
            backdrop-filter: blur(20px);
          }

          .yam-settings-popover-item {
            min-height: 48px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            font-weight: 800;
          }

          .yam-settings-popover-item.danger {
            color: #fda4af;
          }

          .yam-dark-toggle-switch.small {
            width: 42px;
            height: 24px;
          }

          .yam-dark-toggle-switch.small span {
            width: 18px;
            height: 18px;
          }

          .yam-post-copy-v2 {
            margin: 0;
            color: #edf2ff;
            line-height: 1.9;
            white-space: pre-line;
            font-size: 15px;
          }

          .yam-post-media-grid-v2 {
            display: grid;
            grid-template-columns: 1.05fr 1.25fr 0.72fr;
            gap: 10px;
            min-height: 318px;
          }

          .yam-post-media-grid-v2.media-count-1 {
            grid-template-columns: 1fr;
            min-height: 320px;
          }

          .yam-post-media-grid-v2.media-count-2 {
            grid-template-columns: 1.1fr 0.9fr;
          }

          .yam-post-media-tile {
            position: relative;
            overflow: hidden;
            border-radius: 22px;
            min-height: 318px;
            background: linear-gradient(180deg, rgba(99,102,241,0.18), rgba(15,23,42,0.9));
          }

          .yam-post-media-grid-v2.media-count-3 .tile-2 {
            min-height: 318px;
          }

          .yam-post-media-image,
          .yam-post-media-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .yam-post-media-video {
            background: #000;
          }

          .yam-post-play-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.24));
          }

          .yam-post-play-overlay svg {
            width: 64px !important;
            height: 64px !important;
            padding: 18px;
            border-radius: 50%;
            color: #fff;
            background: rgba(255,255,255,0.16);
            backdrop-filter: blur(10px);
            box-shadow: 0 16px 35px rgba(0,0,0,0.32);
          }

          .scenic-video {
            background:
              linear-gradient(180deg, rgba(10,18,37,0.05), rgba(3,7,18,0.3)),
              radial-gradient(circle at 50% 35%, rgba(255,255,255,0.18), transparent 24%),
              linear-gradient(180deg, #4b5d7d 0%, #1b2740 44%, #0b1224 100%);
          }

          .scenic-lake {
            background:
              radial-gradient(circle at 65% 12%, rgba(255, 196, 148, 0.46), transparent 16%),
              linear-gradient(180deg, #8978ab 0%, #3f4d7c 30%, #173257 56%, #0a1730 100%);
          }

          .scenic-forest {
            background:
              linear-gradient(180deg, rgba(240,240,255,0.24), rgba(18,43,48,0.12) 28%, rgba(7,19,26,0.96) 100%),
              linear-gradient(180deg, #6c768f 0%, #253349 32%, #0f1f2b 100%);
          }

          .portrait-purple {
            background:
              radial-gradient(circle at 45% 30%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(120deg, #081021 12%, #3a065f 55%, #0d0f29 100%);
          }

          .yam-post-reactions-v2 {
            color: #ecf1ff;
            font-size: 14px;
            font-weight: 800;
          }

          .reaction-bubble {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            font-size: 12px;
            margin-inline-end: -6px;
            border: 2px solid rgba(7,12,25,0.95);
          }

          .reaction-bubble.like { background: #fb7185; }
          .reaction-bubble.support { background: #60a5fa; }
          .reaction-bubble.wow { background: #818cf8; }

          .yam-post-numbers-v2 {
            display: inline-flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 14px;
            color: #8994ba;
            font-size: 13px;
          }

          .yam-post-actions-v2 {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 12px;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .yam-post-actions-v2 button {
            border: none;
            background: transparent;
            color: #dce2f8;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 12px;
            cursor: pointer;
          }

          .yam-post-actions-v2 button:hover,
          .yam-post-actions-v2 button.active {
            background: rgba(124,58,237,0.14);
            color: #fff;
          }

          .yam-post-comments-panel {
            display: grid;
            gap: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }

          .yam-post-comment-composer {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-composer textarea {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #eef2ff;
            border-radius: 16px;
            padding: 14px;
            resize: vertical;
            min-height: 96px;
          }

          .yam-post-comment-send {
            justify-self: flex-start;
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(167,139,250,0.24);
            background: linear-gradient(135deg, rgba(124,58,237,0.92), rgba(99,102,241,0.92));
            color: white;
            padding: 0 16px;
            font-weight: 800;
          }

          .yam-post-comment-list {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-item,
          .yam-post-comment-empty {
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 12px 14px;
          }

          .yam-post-comment-item p {
            margin: 6px 0 0;
            color: #cbd5f5;
            line-height: 1.8;
          }

          .yam-post-comment-empty {
            color: #94a3b8;
          }

          .yam-right-rail {
            display: grid;
            gap: 18px;
            max-height: calc(100vh - 40px);
            overflow: auto;
            align-self: start;
          }

          .yam-profile-card-v2 {
            overflow: hidden;
          }

          .yam-profile-cover-v2 {
            min-height: 146px;
            padding: 18px;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            background:
              radial-gradient(circle at 50% 0%, rgba(146, 71, 255, 0.34), transparent 34%),
              linear-gradient(180deg, #0f1230 0%, #0a0f21 100%);
          }

          .yam-profile-cover-brand {
            letter-spacing: 0.28em;
            color: #ede6ff;
            font-size: 14px;
            font-weight: 900;
            margin-top: 8px;
          }

          .yam-profile-body-v2 {
            position: relative;
            padding: 0 20px 20px;
            text-align: center;
          }

          .yam-profile-avatar-wrap {
            position: relative;
            width: fit-content;
            margin: -48px auto 12px;
          }

          .yam-avatar-camera-btn {
            position: absolute;
            inset-inline-end: 0;
            bottom: 4px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(10,15,30,0.92);
            color: #fff;
            display: grid;
            place-items: center;
          }

          .yam-profile-stats-v2 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin: 16px 0;
          }

          .yam-profile-stats-v2 div {
            display: grid;
            gap: 4px;
          }

          .yam-profile-stats-v2 strong {
            font-size: 24px;
          }

          .yam-profile-stats-v2 span,
          .yam-highlight-item-v2 span,
          .yam-summary-row-v2 span:last-child {
            color: #97a3ca;
            font-size: 13px;
          }

          .yam-profile-bio-v2 {
            margin: 0;
            color: #dbe3fc;
            line-height: 1.9;
            font-size: 14px;
          }

          .yam-primary-action-btn {
            flex: 1;
            min-height: 48px;
            border: none;
            border-radius: 16px;
            color: #fff;
            font-weight: 800;
            background: linear-gradient(135deg, #6d3cf0, #8b5cf6);
            box-shadow: 0 16px 34px rgba(109, 60, 240, 0.28);
          }

          .yam-highlights-row-v2 {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-top: 14px;
          }

          .yam-highlight-item-v2 {
            min-width: 64px;
            display: grid;
            justify-items: center;
            gap: 8px;
          }

          .yam-highlight-ring {
            width: 62px;
            height: 62px;
            border-radius: 50%;
            padding: 3px;
            display: grid;
            place-items: center;
            color: #fff;
            background: linear-gradient(135deg, #7c3aed, #d946ef);
          }

          .yam-highlight-ring::before {
            content: '';
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(180deg, #151a39, #090d1d);
            display: block;
          }

          .yam-highlight-ring.add {
            background: linear-gradient(135deg, #353f62, #1a2035);
            position: relative;
          }

          .yam-highlight-ring svg,
          .yam-highlight-ring.add svg {
            position: absolute;
            z-index: 1;
          }

          .yam-highlight-ring.travel,
          .yam-highlight-ring.design,
          .yam-highlight-ring.moments,
          .yam-highlight-ring.projects {
            position: relative;
          }

          .yam-highlight-ring.travel::after,
          .yam-highlight-ring.design::after,
          .yam-highlight-ring.moments::after,
          .yam-highlight-ring.projects::after {
            content: '';
            position: absolute;
            inset: 8px;
            border-radius: 50%;
            background:
              radial-gradient(circle at 55% 30%, rgba(255,255,255,0.14), transparent 18%),
              linear-gradient(180deg, #273657, #111931 70%, #0a1022);
          }

          .yam-summary-card-v2 {
            padding: 18px;
          }

          .yam-summary-card-v2 h3 {
            margin: 0;
            font-size: 20px;
          }

          .yam-summary-list-v2 {
            display: grid;
            gap: 14px;
            margin-top: 14px;
          }

          .yam-summary-row-v2 {
            justify-content: flex-start;
            gap: 12px;
            color: #dbe2fb;
          }

          .yam-summary-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            color: #c9b7ff;
            background: rgba(255,255,255,0.04);
          }

          .yam-laptop-avatar {
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 22px;
            font-weight: 900;
            background:
              radial-gradient(circle at 50% 28%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(140deg, #1b2340 10%, #6241a8 60%, #0f1428 100%);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 14px 24px rgba(0,0,0,0.24);
            overflow: hidden;
          }

          .yam-laptop-avatar.image span {
            transform: translateY(8px);
          }

          .yam-laptop-avatar.accent {
            box-shadow: 0 0 0 4px rgba(124,58,237,0.18), 0 14px 24px rgba(0,0,0,0.24);
          }

          @media (max-width: 1380px) {
            .yam-laptop-shell {
              grid-template-columns: 220px minmax(0, 1fr) 320px;
            }
          }

          @media (max-width: 1140px) {
            .yam-laptop-shell {
              grid-template-columns: minmax(0, 1fr);
            }

            .yam-left-rail,
            .yam-right-rail {
              position: static;
            }

            .yam-left-rail {
              order: 2;
            }

            .yam-right-rail {
              order: 3;
            }
          }

          @media (max-width: 1024px) {
            .page-content.yam-feed-page-locked {
              overflow-y: auto;
            }

            .yam-laptop-page {
              min-height: auto;
              overflow-x: hidden;
              overflow-y: visible;
            }

            .yam-laptop-shell {
              width: 100%;
              padding: 8px 10px calc(96px + env(safe-area-inset-bottom, 0px));
              gap: 14px;
              min-height: auto;
              grid-template-columns: 1fr;
            }

            .yam-left-rail,
            .yam-right-rail {
              display: none;
            }

            .yam-feed-header-card,
            .yam-post-card-v2,
            .yam-summary-card-v2,
            .yam-profile-card-v2 {
              border-radius: 22px;
            }

            .yam-feed-header-top h1 {
              font-size: 24px;
            }

            .yam-mobile-brand {
              display: block;
            }

            .yam-composer-prompt-bar {
              grid-template-columns: 1fr;
            }

            .yam-composer-actions-inline {
              width: 100%;
              overflow-x: auto;
              padding-bottom: 2px;
            }

            .yam-post-media-grid-v2,
            .yam-post-media-grid-v2.media-count-2,
            .yam-post-media-grid-v2.media-count-3 {
              grid-template-columns: 1fr;
              min-height: auto;
            }

            .yam-post-media-tile,
            .yam-post-media-grid-v2.media-count-3 .tile-2 {
              min-height: 220px;
            }

            .yam-feed-header-card,
            .yam-post-card-v2,
            .yam-home-composer-slot,
            .yam-post-comments-panel {
              width: 100%;
              max-width: 100%;
              overflow: hidden;
            }

            .yam-post-head-v2,
            .yam-post-author-v2,
            .yam-post-meta-v2 {
              min-width: 0;
              flex-wrap: wrap;
            }

            .yam-post-author-copy,
            .yam-post-copy-v2,
            .yam-post-handle {
              min-width: 0;
              overflow-wrap: anywhere;
            }

            .yam-post-stats-v2 {
              gap: 10px;
              flex-direction: column;
              align-items: flex-start;
            }

            .yam-post-numbers-v2 {
              justify-content: flex-start;
            }

            .yam-post-actions-v2 {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              align-items: stretch;
              width: 100%;
              gap: 8px;
            }

            .yam-post-actions-v2 button {
              width: 100%;
              min-width: 0;
              justify-content: center;
              flex-direction: row;
              gap: 6px;
              padding: 10px 6px;
              background: rgba(255,255,255,0.03);
              font-size: 11px;
              text-align: center;
              white-space: nowrap;
            }

            .yam-post-actions-v2 button svg {
              width: 18px !important;
              height: 18px !important;
            }

            .yam-center-stage,
            .yam-post-stack-v2 {
              max-height: none;
              overflow: visible !important;
              height: auto !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}
