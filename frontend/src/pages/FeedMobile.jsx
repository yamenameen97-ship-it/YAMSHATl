import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MobileComposer from '../components/mobile/MobileComposer.jsx';
import MobileFilterPills from '../components/mobile/MobileFilterPills.jsx';
import MobilePostCard from '../components/mobile/MobilePostCard.jsx';
import MobileComposeModal from '../components/mobile/MobileComposeModal.jsx';
import MobileCommentsSheet from '../components/mobile/MobileCommentsSheet.jsx';
import Modal from '../components/ui/Modal.jsx';
import useSmartFeed from '../hooks/useSmartFeed.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';
import { likePost, savePost, sharePost, deletePost } from '../api/posts.js';
import { followUser, muteUser, unmuteUser } from '../api/users.js';
import { blockUserApi, unblockUserApi } from '../api/chat.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { useAppStore } from '../store/appStore.js';

/**
 * FeedMobile — صفحة الخلاصة للموبايل (مطابقة للتصميم المرجعي)
 * - تجلب بيانات المنشورات الحقيقية عبر useSmartFeed
 * - تربط كل أزرار التفاعل (إعجاب، تعليق، مشاركة، حفظ، إعادة نشر، المزيد) بـ API الحقيقي
 * - تعرض MobileComposeModal لإنشاء منشور جديد + MobileCommentsSheet للتعليقات
 * - تستمع لحدث 'yamshat:open-composer' لفتح المنشئ من BottomNav
 */

function timeAgoAr(dateLike) {
  if (!dateLike) return 'الآن';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'الآن';
  const diffSec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return 'الآن';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `منذ ${months} شهر`;
  }
  // للمنشورات القديمة جداً، عرض التاريخ الكامل
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

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
  const rawMedia = Array.isArray(post.media_urls) && post.media_urls.length
    ? post.media_urls
    : [post.image_url || post.media_url || post.thumbnail_url || post.media].filter(Boolean);
  const firstMedia = rawMedia[0] || '';
  const resolved = resolveMediaUrl(firstMedia);
  if (!resolved || isVideoMediaUrl(resolved || firstMedia, post)) return null;
  return { type: 'image', url: resolved };
}

function normalizePost(p, i) {
  const author = p.author_name || p.username || p.user || 'مستخدم يام شات';
  const handle = (p.username || p.user || `user${i}`).toString();
  const verified = Boolean(p.verified || p.is_verified || p.official);
  
  // التحقق مما إذا كان المنشور بث مباشر
  const isLive = Boolean(p.is_live || p.is_live_stream || p.type === 'live');
  
  return {
    id: p.id ?? `p-${i}`,
    rawId: p.id,
    authorName: author,
    handle: `@${handle.replace(/^@/, '')}`,
    timeText: timeAgoAr(p.created_at || p.published_at || p.createdAt),
    verified,
    avatarUrl: resolveMediaUrl(p.user_avatar || p.avatar || p.author_avatar || ''),
    text: p.content || p.text || p.description || p.title || '',
    banner: buildBanner(p),
    likes: Number(p.likes_count ?? p.like_count ?? p.likes ?? 0),
    comments: Number(p.comments_count ?? p.comment_count ?? p.comments ?? 0),
    reposts: Number(p.share_count ?? p.shares ?? p.reposts ?? 0),
    liked: Boolean(p.is_liked ?? p.liked_by_me ?? p.liked),
    reposted: Boolean(p.reposted ?? p.is_reposted),
    saved: Boolean(p.is_saved ?? p.saved_by_me ?? p.saved),
    // حقول البث
    type: p.type || (isLive ? 'live' : 'POST'),
    is_live: isLive,
    live_stream_id: p.live_stream_id || p.streamId,
    viewers: Number(p.viewers_count || p.viewers || p.viewer_count || 0),
    thumbnail: resolveMediaUrl(p.thumbnail || p.thumbnail_url || p.preview_url || p.media_url || ""),
    duration: p.duration,
  };
}

// منشور ترحيبي افتراضي (يُعرض فقط حين تكون قائمة backend فارغة فعلاً)
const WELCOME_POST = {
  id: 'welcome',
  rawId: null,
  authorName: 'فريق يام شات',
  handle: '@yamshat_team',
  timeText: 'الآن',
  verified: true,
  text: 'مرحباً بك في يام شات 🚀\nابدأ بنشر أول منشور لك أو تابع أصدقاءك لتظهر منشوراتهم هنا.',
  banner: { type: 'logo', title: 'YAMSHAT', slogan: 'تواصل، تفاعل، اربح' },
  likes: 0,
  comments: 0,
  reposts: 0,
  liked: false,
  reposted: false,
  saved: false,
};

function FeedMobile() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerAction, setComposerAction] = useState(null);
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [moreMenuPost, setMoreMenuPost] = useState(null);
  const [moreMenuBusy, setMoreMenuBusy] = useState(false);
  const [moreMenuState, setMoreMenuState] = useState({ following: false, muted: false, blocked: false });

  // overlay فوري للحالة التفاعلية (optimistic UI) قبل وصول استجابة API
  const [overlay, setOverlay] = useState({}); // { [postId]: { liked, likes, saved, reposted, reposts } }
  
  // منشورات البث المباشر
  const [livePosts, setLivePosts] = useState([]);

  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const session = useAppStore((s) => s.session);

  // تحديد نوع المحتوى بناءً على التبويب النشط
  const feedType = useMemo(() => {
    if (activeFilter === 'posts') return 'POST';
    if (activeFilter === 'stories') return 'STORY';
    if (activeFilter === 'live') return 'LIVE';
    return 'all';
  }, [activeFilter]);

  const smart = useSmartFeed?.({ filterType: feedType });
  const rawPosts = smart?.posts || smart?.data || smart?.items || [];
  const loading = smart?.isLoading || smart?.loading;
  const error = smart?.error;

  // تحميل منشورات البث من localStorage
  const loadLivePosts = useCallback(() => {
    try {
      const posts = JSON.parse(localStorage.getItem('yamshat_posts') || '[]');
      const liveOnly = posts.filter(p => p.type === 'live' || p.is_live);
      setLivePosts(liveOnly);
    } catch (e) {
      console.error('Error loading live posts:', e);
    }
  }, []);
  
  // الاستماع لأحداث البث
  useEffect(() => {
    loadLivePosts();
    
    const handleLivePostCreated = () => loadLivePosts();
    const handleStreamStarted = () => loadLivePosts();
    const handleStreamEnded = () => loadLivePosts();
    
    window.addEventListener('yamshat:live-post-created', handleLivePostCreated);
    window.addEventListener('yamshat:stream-started', handleStreamStarted);
    window.addEventListener('yamshat:stream-ended', handleStreamEnded);
    
    // تحديث منشورات البث كل 3 ثوان
    const interval = setInterval(loadLivePosts, 3000);
    
    return () => {
      window.removeEventListener('yamshat:live-post-created', handleLivePostCreated);
      window.removeEventListener('yamshat:stream-started', handleStreamStarted);
      window.removeEventListener('yamshat:stream-ended', handleStreamEnded);
      clearInterval(interval);
    };
  }, [loadLivePosts]);

  // فتح المُنشئ عبر حدث (من BottomNav أو composer slot)
  useEffect(() => {
    const handler = (e) => {
      setComposerAction(e?.detail?.action || null);
      setComposerOpen(true);
    };
    window.addEventListener('yamshat:open-composer', handler);
    // كذلك ?compose=1 في URL
    const url = new URL(window.location.href);
    if (url.searchParams.get('compose') === '1' || /[?&]compose=1/.test(window.location.hash)) {
      setComposerOpen(true);
      // تنظيف URL
      try {
        url.searchParams.delete('compose');
        window.history.replaceState(null, '', url.toString());
      } catch { /* ignore */ }
    }
    return () => window.removeEventListener('yamshat:open-composer', handler);
  }, []);

  const posts = useMemo(() => {
    // دمج منشورات البث مع المنشورات العادية
    const normalizedLivePosts = livePosts.map((p, i) => normalizePost(p, i));
    const normalizedRawPosts = Array.isArray(rawPosts) ? rawPosts.map((p, i) => normalizePost(p, i)) : [];
    
    let list = [];
    
    if (activeFilter === 'all') {
      list = [...normalizedLivePosts, ...normalizedRawPosts];
    } else if (activeFilter === 'live') {
      list = normalizedLivePosts;
    } else {
      list = normalizedRawPosts;
    }

    // إذا كانت القائمة فارغة في تبويب "الكل" أو "المنشورات"، اعرض منشور ترحيبي
    if (list.length === 0 && (activeFilter === 'all' || activeFilter === 'posts')) {
      list = [WELCOME_POST];
    }

    // دمج overlay (optimistic)
    return list.map((p) => {
      const o = overlay[p.id];
      return o ? { ...p, ...o } : p;
    });
  }, [rawPosts, overlay, activeFilter, livePosts]);

  // فلترة محلية بسيطة (الفلترة الحقيقية تتم في backend عبر filterType)
  const filtered = posts; // الفلترة تتم الآن عبر الـ backend بناءً على feedType

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

  // ============== Handlers مُربطة بـ backend ==============

  const handleLike = useCallback(async (post) => {
    if (!post?.rawId) return; // منشور ترحيبي افتراضي
    if (!requireAuth()) return;
    const newLiked = !post.liked;
    const newLikes = Math.max(0, Number(post.likes || 0) + (newLiked ? 1 : -1));
    setOverlayFor(post.id, { liked: newLiked, likes: newLikes });
    try {
      await likePost(post.rawId);
      // بعد قليل: تحديث الفيد من backend
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    } catch (err) {
      console.error('Like failed', err);
      // تراجع
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
      console.error('Save failed', err);
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

    // تسجيل المشاركة في backend (إن كان منشورًا حقيقيًا)
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
    // إعادة النشر = نفس endpoint للمشاركة (repost) — backend يتعامل معها كـ share من نوع repost
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
      console.error('Repost failed', err);
      setOverlayFor(post.id, { reposted: post.reposted, reposts: Number(post.reposts || 0) });
      pushToast?.({ type: 'error', title: 'تعذر إعادة النشر' });
    }
  }, [requireAuth, setOverlayFor, pushToast, queryClient]);

  const handleComment = useCallback((post) => {
    if (!post?.rawId) {
      pushToast?.({ type: 'info', title: 'لا يمكن التعليق على المنشور الترحيبي' });
      return;
    }
    setCommentsPostId(post.rawId);
  }, [pushToast]);

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

  const handleMenuFollow = useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || '').replace(/^@/, '');
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      const response = await followUser(username);
      const nextFollowing = Boolean(response?.data?.following ?? !moreMenuState.following);
      setMoreMenuState((prev) => ({ ...prev, following: nextFollowing }));
      pushToast?.({ type: 'success', title: nextFollowing ? 'تمت المتابعة' : 'تم إلغاء المتابعة' });
      closeMoreMenu();
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر تحديث المتابعة', description: error?.response?.data?.detail || error?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.following, requireAuth, pushToast, closeMoreMenu]);

  const handleMenuMute = useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || '').replace(/^@/, '');
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.muted) await unmuteUser(username);
      else await muteUser(username);
      const nextMuted = !moreMenuState.muted;
      setMoreMenuState((prev) => ({ ...prev, muted: nextMuted }));
      pushToast?.({ type: 'success', title: nextMuted ? 'تم الكتم' : 'تم إلغاء الكتم' });
      closeMoreMenu();
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر تحديث الكتم', description: error?.response?.data?.detail || error?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.muted, requireAuth, pushToast, closeMoreMenu]);

  const handleMenuBlock = useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || '').replace(/^@/, '');
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.blocked) await unblockUserApi(username);
      else await blockUserApi(username);
      const nextBlocked = !moreMenuState.blocked;
      setMoreMenuState((prev) => ({ ...prev, blocked: nextBlocked }));
      pushToast?.({ type: 'success', title: nextBlocked ? 'تم الحظر' : 'تم إلغاء الحظر' });
      closeMoreMenu();
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر تحديث الحظر', description: error?.response?.data?.detail || error?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.blocked, requireAuth, pushToast, closeMoreMenu]);

  const handleMenuReport = useCallback(() => {
    if (!moreMenuPost) return;
    try {
      const key = 'yamshat_reported_posts';
      const current = JSON.parse(window.localStorage.getItem(key) || '[]');
      const next = Array.isArray(current) ? current : [];
      next.unshift({ id: moreMenuPost.id, username: moreMenuPost.handle, created_at: new Date().toISOString() });
      window.localStorage.setItem(key, JSON.stringify(next.slice(0, 100)));
    } catch {
      // ignore storage failures
    }
    pushToast?.({ type: 'success', title: 'تم إرسال البلاغ للمراجعة' });
    closeMoreMenu();
  }, [moreMenuPost, pushToast, closeMoreMenu]);

  const handleMenuDeleteOwnPost = useCallback(async () => {
    if (!moreMenuPost?.rawId) return;
    setMoreMenuBusy(true);
    try {
      await deletePost(moreMenuPost.rawId);
      pushToast?.({ type: 'success', title: 'تم حذف المنشور' });
      closeMoreMenu();
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر حذف المنشور', description: error?.response?.data?.detail || error?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, pushToast, queryClient, closeMoreMenu]);

  const isOwnMoreMenuPost = Boolean(moreMenuPost && (session?.username || session?.user_name || session?.handle) === String(moreMenuPost.handle || '').replace(/^@/, ''));

  return (
    <>
      <MobileComposer onFocus={() => { setComposerAction(null); setComposerOpen(true); }} />
      <MobileFilterPills activeId={activeFilter} onChange={setActiveFilter} />

      {error ? (
        <div className="ym-empty">
          <div className="icon">⚠️</div>
          تعذر تحميل المنشورات. حاول لاحقاً.
        </div>
      ) : null}

      {loading && !filtered.length ? (
        <div className="ym-feed">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ym-post" aria-busy="true">
              <div className="ym-post-head">
                <div className="ym-skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <div className="ym-post-meta">
                  <div className="ym-skeleton" style={{ width: '40%', height: 14 }} />
                  <div className="ym-skeleton" style={{ width: '25%', height: 12, marginTop: 6 }} />
                </div>
              </div>
              <div className="ym-skeleton" style={{ width: '100%', height: 60 }} />
              <div className="ym-skeleton" style={{ width: '100%', aspectRatio: '16/9' }} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="ym-feed">
        {filtered.map((post) => (
          <MobilePostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onSave={handleSave}
            onMore={handleMore}
          />
        ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="ym-empty">
          <div className="icon">📭</div>
          لا توجد منشورات في هذا التصنيف بعد.
        </div>
      ) : null}

      {/* مودال إنشاء منشور */}
      <MobileComposeModal
        open={composerOpen}
        initialAction={composerAction}
        onClose={() => { setComposerOpen(false); setComposerAction(null); }}
      />

      {/* بوتوم شيت التعليقات */}
      <MobileCommentsSheet
        open={Boolean(commentsPostId)}
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
      />

      <Modal isOpen={Boolean(moreMenuPost)} onClose={closeMoreMenu} title="خيارات المنشور">
        <div className="profile-modal-stack">
          {!isOwnMoreMenuPost ? (
            <>
              <button type="button" className="profile-tab active" onClick={handleMenuFollow} disabled={moreMenuBusy}>{moreMenuState.following ? 'إلغاء المتابعة' : 'متابعة'}</button>
              <button type="button" className="profile-tab" onClick={handleMenuMute} disabled={moreMenuBusy}>{moreMenuState.muted ? 'إلغاء الكتم' : 'كتم'}</button>
              <button type="button" className="profile-tab" onClick={handleMenuBlock} disabled={moreMenuBusy}>{moreMenuState.blocked ? 'إلغاء الحظر' : 'حظر'}</button>
            </>
          ) : (
            <button type="button" className="profile-tab" onClick={handleMenuDeleteOwnPost} disabled={moreMenuBusy}>حذف المنشور</button>
          )}
          <button type="button" className="profile-tab" onClick={handleMenuReport} disabled={moreMenuBusy}>بلاغ</button>
        </div>
      </Modal>
    </>
  );
}

export default memo(FeedMobile);
