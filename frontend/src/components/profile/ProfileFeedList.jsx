import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import MobilePostCard from '../mobile/MobilePostCard.jsx';
import MobileCommentsSheet from '../mobile/MobileCommentsSheet.jsx';
import Modal from '../ui/Modal.jsx';
import ReportModal from '../reports/ReportModal.jsx';
import { getUserPosts } from '../../api/users.js';
import { likePost, savePost, sharePost, deletePost } from '../../api/posts.js';
import { followUser, muteUser, unmuteUser } from '../../api/users.js';
import { blockUserApi, unblockUserApi } from '../../api/chat.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { useAppStore } from '../../store/appStore.js';
import { timeAgoAr as fmtTimeAgoAr, formatLocalDateTimeAr } from '../../utils/timeFormat.js';

/**
 * ProfileFeedList (v88.66)
 * ------------------------------------------------------------
 * ✅ عند الضغط على تبويب "صفحتي" في الملف الشخصي، تُعرض منشورات
 *    المستخدم بنفس تصميم بطاقات المنشورات في الصفحة الرئيسية
 *    (MobilePostCard) بدلاً من شبكة الصور الصغيرة.
 * ------------------------------------------------------------
 * - يجلب المنشورات عبر getUserPosts(username)
 * - يطبّع كل منشور لصيغة MobilePostCard (نفس منطق FeedMobile.normalizePost)
 * - يدعم: إعجاب، حفظ، مشاركة، تعليق، المزيد، إعادة نشر، حذف
 * - overlay optimistic UI للحالة التفاعلية الفورية
 */

function isVideoMediaUrl(value = '', post = {}) {
  const candidate = String(value || '');
  return Boolean(
    post.has_video
    || post.is_reel
    || String(post.media_type || '').toLowerCase() === 'video'
    || /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(candidate)
    || /\b(video|reel|stream)\b/i.test(candidate)
  );
}

function buildBanner(post = {}) {
  const rawMediaCandidates = Array.isArray(post.media_urls) && post.media_urls.length
    ? post.media_urls
    : [post.media_url || post.media || post.image_url || post.thumbnail_url].filter(Boolean);
  const firstMedia = rawMediaCandidates[0] || '';
  const isVideo =
    Boolean(post.has_video)
    || String(post.media_type || '').toLowerCase() === 'video'
    || Boolean(post.is_reel)
    || isVideoMediaUrl(firstMedia, post);

  if (isVideo) {
    const videoCandidate = String(post.media_url || post.media || firstMedia || '');
    const posterCandidate = String(post.thumbnail_url || post.preview_url || post.image_url || '');
    const resolvedVideo = resolveMediaUrl(videoCandidate);
    const resolvedPoster = resolveMediaUrl(posterCandidate);
    if (!resolvedVideo) return null;
    return { type: 'video', url: resolvedVideo, poster: resolvedPoster || '' };
  }

  const resolved = resolveMediaUrl(firstMedia);
  if (!resolved) return null;
  return { type: 'image', url: resolved };
}

function timeAgoAr(dateLike) {
  return fmtTimeAgoAr(dateLike);
}

/** طبّع منشور خام قادم من backend لصيغة MobilePostCard.
 *  نفس منطق FeedMobile.normalizePost مع تفضيل بيانات صاحب الملف
 *  (profileFallback) إن كان الحقل الخام فارغاً — لأن endpoint
 *  /users/user_posts/{username} أحياناً لا يعيد author_name/avatar. */
function normalizePost(p, i, profileFallback = {}) {
  const author = p.display_name
    || p.full_name
    || p.author_name
    || p.username
    || p.user
    || profileFallback.displayName
    || 'مستخدم يام شات';
  const handle = (p.username || p.user || profileFallback.username || `user${i}`).toString();
  const verified = Boolean(
    p.verified
    || p.is_verified
    || p.official
    || profileFallback.verified
  );
  const rawTime = p.created_at || p.published_at || null;
  const avatarUrl = resolveMediaUrl(
    p.user_avatar
    || p.avatar
    || p.author_avatar
    || profileFallback.avatar
    || ''
  );
  return {
    id: p.id ?? `p-${i}`,
    rawId: p.id,
    userId: p.user_id ?? p.author_id ?? p.userId ?? profileFallback.userId ?? null,
    username: handle.replace(/^@/, ''),
    authorName: author,
    handle: `@${handle.replace(/^@/, '')}`,
    timeText: timeAgoAr(rawTime),
    rawTime,
    timeTitle: formatLocalDateTimeAr(rawTime),
    verified,
    avatarUrl,
    text: p.content || p.text || '',
    banner: buildBanner(p),
    likes: Number(p.likes_count ?? p.like_count ?? p.likes ?? 0),
    comments: Number(p.comments_count ?? p.comment_count ?? p.comments ?? 0),
    reposts: Number(p.share_count ?? p.shares ?? p.reposts ?? 0),
    liked: Boolean(p.is_liked ?? p.liked_by_me ?? p.liked),
    reposted: Boolean(p.reposted ?? p.is_reposted),
    saved: Boolean(p.is_saved ?? p.saved_by_me ?? p.saved),
    poll: Array.isArray(p.poll) ? p.poll
        : (Array.isArray(p.poll_options) ? p.poll_options
        : (Array.isArray(p.options) ? p.options : [])),
    poll_question: p.poll_question || '',
  };
}

function ProfileFeedList({ username, profile, isOwnProfile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const session = useAppStore((s) => s.session);

  const [rawPosts, setRawPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overlay, setOverlay] = useState({});
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [moreMenuPost, setMoreMenuPost] = useState(null);
  const [reportPostTarget, setReportPostTarget] = useState(null);
  const [moreMenuBusy, setMoreMenuBusy] = useState(false);
  const [moreMenuState, setMoreMenuState] = useState({ following: false, muted: false, blocked: false });

  // بيانات الملف الشخصي كـ fallback للمنشورات التي لا تحمل بيانات صاحبها
  const profileFallback = useMemo(() => ({
    displayName: profile?.user?.display_name || profile?.user?.full_name || profile?.user?.username || '',
    username: profile?.user?.username || username || '',
    verified: Boolean(profile?.user?.verified || profile?.user?.is_verified),
    avatar: profile?.user?.avatar || profile?.user?.profile?.avatar_url || '',
    userId: profile?.user?.id ?? profile?.user?.user_id ?? null,
  }), [profile, username]);

  // جلب منشورات المستخدم من backend
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!username) {
        setRawPosts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await getUserPosts(username);
        const payload = res?.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.posts || payload?.items || payload?.results || payload?.data || [];
        if (!cancelled) setRawPosts(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.detail || err?.message || 'فشل تحميل المنشورات');
          setRawPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [username]);

  // طبّع + طبّق overlay
  const posts = useMemo(() => {
    const normalized = (Array.isArray(rawPosts) ? rawPosts : [])
      .map((p, i) => normalizePost(p, i, profileFallback));
    return normalized.map((p) => {
      const o = overlay[p.id];
      return o ? { ...p, ...o } : p;
    });
  }, [rawPosts, overlay, profileFallback]);

  // ============== helpers ==============
  const requireAuth = useCallback(() => {
    if (!session) {
      pushToast?.({ type: 'info', title: 'يجب تسجيل الدخول', description: 'لتتمكن من التفاعل مع المنشورات.' });
      return false;
    }
    return true;
  }, [session, pushToast]);

  const setOverlayFor = useCallback((id, patch) => {
    setOverlay((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  }, []);

  const isOwnPost = useCallback((post) => {
    if (!post) return false;
    const sessionId = session?.id ?? session?.user_id ?? session?.userId ?? null;
    const postUserId = post.userId ?? post.user_id ?? null;
    if (sessionId != null && postUserId != null) {
      if (String(sessionId) === String(postUserId)) return true;
    }
    const myUsername = String(session?.username || session?.user || '').trim().toLowerCase().replace(/^@/, '');
    if (!myUsername) return false;
    const postUsername = String(post.username || (post.handle || '').replace(/^@/, '') || '').trim().toLowerCase();
    return Boolean(postUsername) && postUsername === myUsername;
  }, [session]);

  // ============== Handlers ==============
  const handleLike = useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newLiked = !post.liked;
    const newLikes = Math.max(0, Number(post.likes || 0) + (newLiked ? 1 : -1));
    setOverlayFor(post.id, { liked: newLiked, likes: newLikes });
    try {
      await likePost(post.rawId);
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    } catch (err) {
      setOverlayFor(post.id, { liked: post.liked, likes: Number(post.likes || 0) });
      pushToast?.({ type: 'error', title: 'تعذر تنفيذ الإعجاب' });
    }
  }, [requireAuth, setOverlayFor, queryClient, pushToast]);

  const handleSave = useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newSaved = !post.saved;
    setOverlayFor(post.id, { saved: newSaved });
    try {
      await savePost(post.rawId);
      pushToast?.({ type: 'success', title: newSaved ? 'تم الحفظ' : 'تمت إزالة الحفظ' });
    } catch (err) {
      setOverlayFor(post.id, { saved: post.saved });
      pushToast?.({ type: 'error', title: 'تعذر حفظ المنشور' });
    }
  }, [requireAuth, setOverlayFor, pushToast]);

  const handleShare = useCallback(async (post) => {
    const postUrl = `${window.location.origin}/#/post/${post.rawId || post.id}`;
    const shareData = {
      title: post.authorName,
      text: post.text?.slice(0, 200) || 'منشور على يام شات',
      url: postUrl,
    };
    let succeeded = false;
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        succeeded = true;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        pushToast?.({ type: 'success', title: 'تم نسخ رابط المنشور' });
        succeeded = true;
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        pushToast?.({ type: 'info', title: 'تم إلغاء المشاركة' });
      }
    }
    if (succeeded && post.rawId) {
      try {
        await sharePost(post.rawId, navigator.share ? 'native' : 'copy');
        const newReposts = Number(post.reposts || 0) + 1;
        setOverlayFor(post.id, { reposts: newReposts });
        queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      } catch (err) {
        console.warn('share tracking failed', err);
      }
    }
  }, [pushToast, setOverlayFor, queryClient]);

  const handleRepost = useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newReposted = !post.reposted;
    const newReposts = Math.max(0, Number(post.reposts || 0) + (newReposted ? 1 : -1));
    setOverlayFor(post.id, { reposted: newReposted, reposts: newReposts });
    try {
      await sharePost(post.rawId, 'repost');
      pushToast?.({ type: 'success', title: newReposted ? 'تمت إعادة النشر' : 'تم إلغاء إعادة النشر' });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    } catch (err) {
      setOverlayFor(post.id, { reposted: post.reposted, reposts: Number(post.reposts || 0) });
      pushToast?.({ type: 'error', title: 'تعذر إعادة النشر' });
    }
  }, [requireAuth, setOverlayFor, pushToast, queryClient]);

  const handleComment = useCallback((post) => {
    if (!post?.rawId) return;
    setCommentsPostId(post.rawId);
  }, []);

  const handleMore = useCallback((post) => {
    setMoreMenuPost(post);
    setMoreMenuState({
      following: Boolean(post?.following),
      muted: Boolean(post?.muted),
      blocked: Boolean(post?.blocked_by_me),
    });
  }, []);

  const closeMoreMenu = useCallback(() => {
    setMoreMenuPost(null);
    setMoreMenuBusy(false);
  }, []);

  const handleDelete = useCallback(async (post) => {
    if (!post?.rawId) return;
    try {
      await deletePost(post.rawId);
      pushToast?.({ type: 'success', title: 'تم حذف المنشور' });
      // إزالة محلية فورية
      setRawPosts((prev) => prev.filter((p) => String(p.id) !== String(post.rawId)));
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر حذف المنشور', description: error?.response?.data?.detail || error?.message });
    }
  }, [pushToast, queryClient]);

  const isOwnMoreMenuPost = useMemo(() => isOwnPost(moreMenuPost), [isOwnPost, moreMenuPost]);

  const handleMenuFollow = useCallback(async () => {
    if (!moreMenuPost || moreMenuBusy) return;
    setMoreMenuBusy(true);
    try {
      await followUser(moreMenuPost.username);
      setMoreMenuState((prev) => ({ ...prev, following: !prev.following }));
      pushToast?.({ type: 'success', title: 'تم التحديث' });
    } catch (err) {
      pushToast?.({ type: 'error', title: 'تعذر تنفيذ العملية' });
    } finally {
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuBusy, pushToast]);

  const handleMenuMute = useCallback(async () => {
    if (!moreMenuPost || moreMenuBusy) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.muted) await unmuteUser(moreMenuPost.username);
      else await muteUser(moreMenuPost.username);
      setMoreMenuState((prev) => ({ ...prev, muted: !prev.muted }));
      pushToast?.({ type: 'success', title: 'تم التحديث' });
    } catch (err) {
      pushToast?.({ type: 'error', title: 'تعذر تنفيذ العملية' });
    } finally {
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuBusy, moreMenuState.muted, pushToast]);

  const handleMenuBlock = useCallback(async () => {
    if (!moreMenuPost || moreMenuBusy) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.blocked) await unblockUserApi(moreMenuPost.username);
      else await blockUserApi(moreMenuPost.username);
      setMoreMenuState((prev) => ({ ...prev, blocked: !prev.blocked }));
      pushToast?.({ type: 'success', title: 'تم التحديث' });
    } catch (err) {
      pushToast?.({ type: 'error', title: 'تعذر تنفيذ العملية' });
    } finally {
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuBusy, moreMenuState.blocked, pushToast]);

  const handleMenuReport = useCallback(() => {
    if (!moreMenuPost) return;
    setReportPostTarget({ id: moreMenuPost.rawId, label: moreMenuPost.authorName });
    closeMoreMenu();
  }, [moreMenuPost, closeMoreMenu]);

  const handleMenuDeleteOwnPost = useCallback(async () => {
    if (!moreMenuPost) return;
    await handleDelete(moreMenuPost);
    closeMoreMenu();
  }, [moreMenuPost, handleDelete, closeMoreMenu]);

  const handleMenuEditOwnPost = useCallback(() => {
    if (!moreMenuPost?.rawId) return;
    navigate(`/compose?tab=post&edit=${encodeURIComponent(moreMenuPost.rawId)}`);
    closeMoreMenu();
  }, [moreMenuPost, navigate, closeMoreMenu]);

  // ============== UI ==============
  if (loading) {
    return (
      <div className="ym-profile-feed" dir="rtl">
        <div className="ym-profile-feed__loading">
          <div className="ym-profile-feed__spinner" />
          <p>جاري تحميل المنشورات...</p>
        </div>
        <style>{`
          .ym-profile-feed__loading {
            display: flex; flex-direction: column; align-items: center; gap: 12px;
            padding: 40px 20px; color: #a1a1aa;
          }
          .ym-profile-feed__spinner {
            width: 34px; height: 34px; border-radius: 50%;
            border: 3px solid rgba(139,92,246,0.25);
            border-top-color: #8B5CF6;
            animation: ymSpin 0.9s linear infinite;
          }
          @keyframes ymSpin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="ym-profile-feed" dir="rtl">
        <div className="ym-profile-feed__empty">
          <div className="ym-profile-feed__empty-icon">⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="ym-profile-feed" dir="rtl">
        <div className="ym-profile-feed__empty">
          <div className="ym-profile-feed__empty-icon">📭</div>
          <p>{isOwnProfile ? 'لم تنشر أي منشور بعد. ابدأ بنشر منشورك الأول!' : 'لا توجد منشورات لعرضها'}</p>
        </div>
        <style>{`
          .ym-profile-feed__empty {
            display: flex; flex-direction: column; align-items: center; gap: 12px;
            padding: 60px 20px; color: #a1a1aa; text-align: center;
          }
          .ym-profile-feed__empty-icon { font-size: 48px; opacity: 0.7; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ym-profile-feed" dir="rtl">
      <div className="ym-feed">
        {posts.map((post) => (
          <MobilePostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onSave={handleSave}
            onMore={handleMore}
            onRepost={handleRepost}
            onDelete={handleDelete}
            canDelete={isOwnPost(post)}
          />
        ))}
      </div>

      <MobileCommentsSheet
        open={Boolean(commentsPostId)}
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
      />

      <Modal isOpen={Boolean(moreMenuPost)} onClose={closeMoreMenu} title="خيارات المنشور">
        <div className="profile-modal-stack">
          {!isOwnMoreMenuPost ? (
            <>
              <button type="button" className="profile-tab active" onClick={handleMenuFollow} disabled={moreMenuBusy}>
                {moreMenuState.following ? 'إلغاء المتابعة' : 'متابعة'}
              </button>
              <button type="button" className="profile-tab" onClick={handleMenuMute} disabled={moreMenuBusy}>
                {moreMenuState.muted ? 'إلغاء الكتم' : 'كتم'}
              </button>
              <button type="button" className="profile-tab" onClick={handleMenuBlock} disabled={moreMenuBusy}>
                {moreMenuState.blocked ? 'إلغاء الحظر' : 'حظر'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="profile-tab active" onClick={handleMenuEditOwnPost} disabled={moreMenuBusy}>تعديل المنشور</button>
              <button type="button" className="profile-tab" onClick={handleMenuDeleteOwnPost} disabled={moreMenuBusy}>حذف المنشور</button>
            </>
          )}
          <button type="button" className="profile-tab" onClick={handleMenuReport} disabled={moreMenuBusy}>بلاغ</button>
        </div>
      </Modal>

      <ReportModal
        open={Boolean(reportPostTarget)}
        onClose={() => setReportPostTarget(null)}
        targetType="post"
        targetId={reportPostTarget?.id}
        targetLabel={reportPostTarget?.label}
      />

      <style>{`
        .ym-profile-feed {
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          padding: 8px 0 24px;
        }
        .ym-profile-feed .ym-feed {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

export default memo(ProfileFeedList);
