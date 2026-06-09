import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MobileComposer from '../components/mobile/MobileComposer.jsx';
import MobileFilterPills from '../components/mobile/MobileFilterPills.jsx';
import MobilePostCard from '../components/mobile/MobilePostCard.jsx';
import MobileLiveStreamCard from '../components/mobile/MobileLiveStreamCard.jsx';
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
 * - تدعم عرض منشورات البث المباشر عبر MobileLiveStreamCard
 */

function timeAgoAr(dateLike) {
  if (!dateLike) return 'الآن';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'الآن';
  const diffSec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return 'منذ لحظات';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const days = Math.floor(h / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
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
  return {
    id: p.id ?? `p-${i}`,
    rawId: p.id,
    authorName: author,
    handle: `@${handle.replace(/^@/, '')}`,
    timeText: timeAgoAr(p.created_at || p.published_at),
    verified,
    avatarUrl: resolveMediaUrl(p.user_avatar || p.avatar || p.author_avatar || ''),
    text: p.content || p.text || '',
    banner: buildBanner(p),
    likes: Number(p.likes_count ?? p.like_count ?? p.likes ?? 0),
    comments: Number(p.comments_count ?? p.comment_count ?? p.comments ?? 0),
    reposts: Number(p.share_count ?? p.shares ?? p.reposts ?? 0),
    liked: Boolean(p.is_liked ?? p.liked_by_me ?? p.liked),
    reposted: Boolean(p.reposted ?? p.is_reposted),
    saved: Boolean(p.is_saved ?? p.saved_by_me ?? p.saved),
    // حقول البث المباشر — نصنف المنشور كبث فقط إذا لم يتم إنهاؤه صراحةً
    isLive: (
      Boolean(p.is_live_stream || p.has_live_stream || p.type === 'live_stream')
      && p.is_live !== false
      && p.type !== 'video'
    ),
    liveStreamId: p.live_stream_id || p.stream_id || p.live_id || null,
    liveStream: p.live_stream,
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
  isLive: false,
  liveStreamId: null,
  liveStream: null,
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

  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const session = useAppStore((s) => s.session);

  const smart = useSmartFeed?.({ filterType: activeFilter });
  const rawPosts = smart?.posts || smart?.data || smart?.items || [];
  const loading = smart?.isLoading || smart?.loading;
  const error = smart?.error;

  // جلب البث المباشر النشط
  const [liveStreams, setLiveStreams] = useState([]);
  useEffect(() => {
    const fetchLives = async () => {
      try {
        const { getActiveLiveStreams } = await import('../services/api/liveStreamApi.js');
        const res = await getActiveLiveStreams({ limit: 5 });
        if (res?.data) setLiveStreams(res.data);
      } catch (err) {
        console.warn('Failed to fetch live streams for mobile feed', err);
      }
    };
    fetchLives();
    const timer = setInterval(fetchLives, 30000);
    return () => clearInterval(timer);
  }, []);

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
    const normalizedPosts = (Array.isArray(rawPosts) && rawPosts.length)
      ? rawPosts.map((p, i) => normalizePost(p, i))
      : [WELCOME_POST];

    // تحويل البث المباشر إلى منشورات
    const liveAsPosts = liveStreams.map((stream) => ({
      id: `live-${stream.id}`,
      rawId: null,
      authorName: stream.host_username || 'مستخدم',
      handle: `@${stream.host_username || 'مستخدم'}`,
      timeText: 'مباشر الآن',
      verified: true,
      avatarUrl: resolveMediaUrl(stream.host_avatar || ''),
      text: stream.title || 'بث مباشر جديد',
      banner: stream.thumbnail_url ? { type: 'image', url: resolveMediaUrl(stream.thumbnail_url) } : null,
      likes: stream.hearts_count || 0,
      comments: stream.comments_count || 0,
      reposts: 0,
      liked: false,
      reposted: false,
      saved: false,
      isLive: true,
      liveStreamId: stream.id,
      liveStream: stream,
    }));

    // دمج البث في البداية (أو تصفية المكرر إذا كان المنشور مرتبطاً ببث)
    const combined = [...liveAsPosts, ...normalizedPosts];

    // دمج overlay (optimistic)
    return combined.map((p) => {
      const o = overlay[p.id];
      return o ? { ...p, ...o } : p;
    });
  }, [rawPosts, liveStreams, overlay]);

  // فلترة محلية بسيطة (الفلترة الحقيقية تتم في backend عبر filterType)
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'updates') return posts.filter((p) => /تحديث|تطوير|إطلاق|جديد/.test(p.text));
    if (activeFilter === 'ads') return posts.filter((p) => /إعلان|عرض|خصم/.test(p.text));
    if (activeFilter === 'community') return posts.filter((p) => /مجتمع|عائلة|أعضاء|#/.test(p.text));
    return posts;
  }, [activeFilter, posts]);

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
      const key = 'yamshat:report-post';
      const event = new CustomEvent(key, { detail: { postId: moreMenuPost.rawId, authorHandle: moreMenuPost.handle } });
      window.dispatchEvent(event);
      closeMoreMenu();
    } catch (err) {
      console.error('Report error:', err);
    }
  }, [moreMenuPost, closeMoreMenu]);

  const handleMenuDeleteOwnPost = useCallback(async () => {
    if (!moreMenuPost?.rawId) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) return;
    setMoreMenuBusy(true);
    try {
      await deletePost(moreMenuPost.rawId);
      pushToast?.({ type: 'success', title: 'تم حذف المنشور' });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      closeMoreMenu();
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر حذف المنشور', description: error?.response?.data?.detail || error?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, pushToast, queryClient, closeMoreMenu]);

  const isOwnMoreMenuPost = moreMenuPost?.authorName === session?.username;

  return (
    <>
      <div className="ym-feed-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo192.png" alt="Y" style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
        <h1>المنشورات</h1>
      </div>

      {/* Composer Slot */}
      <div className="ym-composer-slot">
        <button
          type="button"
          className="ym-composer-trigger"
          onClick={() => { setComposerAction(null); setComposerOpen(true); }}
        >
          <span className="icon">✏️</span>
          <span>ما بالك؟</span>
        </button>
      </div>

      {/* Filter Pills */}
      <MobileFilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Posts Feed */}
      <div className="ym-feed">
        {filtered.map((post) => {
          // عرض منشورات البث المباشر
          if (post.isLive) {
            return (
              <MobileLiveStreamCard
                key={post.id}
                post={post}
                liveStream={{
                  // نبدأ من قيم البوست الأساسية كـ fallback ثم نطبق قيم liveStream فوقها
                  id: post.liveStreamId,
                  host_username: (post.handle || '').replace(/^@/, '') || 'مستخدم',
                  host_name: post.authorName || 'مستخدم',
                  title: post.text || 'بث مباشر',
                  viewer_count: post.views || 0,
                  hearts_count: post.likes || 0,
                  comments_count: post.comments || 0,
                  verified: post.verified,
                  // ادمج بيانات البث الحية (تعطي الأولوية للحقول الحقيقية إن وُجدت)
                  ...(post.liveStream || {}),
                  // تأكيد إن thumbnail_url يأخذ أول قيمة متوفرة (مهم: الـ banner من post يبقى fallback نهائي)
                  thumbnail_url:
                    post.liveStream?.thumbnail_url ||
                    post.liveStream?.cover_url ||
                    post.liveStream?.preview_url ||
                    post.banner?.url ||
                    '',
                  host_avatar: post.liveStream?.host_avatar || post.avatarUrl || '',
                }}
                onStreamEnd={() => queryClient.invalidateQueries({ queryKey: ['feed-data'] })}
              />
            );
          }
          // عرض المنشورات العادية
          return (
            <MobilePostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              onMore={handleMore}
            />
          );
        })}
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
