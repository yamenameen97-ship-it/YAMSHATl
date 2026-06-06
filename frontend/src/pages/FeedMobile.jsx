import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MobileComposer from '../components/mobile/MobileComposer.jsx';
import MobileFilterPills from '../components/mobile/MobileFilterPills.jsx';
import MobilePostCard from '../components/mobile/MobilePostCard.jsx';
import MobileComposeModal from '../components/mobile/MobileComposeModal.jsx';
import MobileCommentsSheet from '../components/mobile/MobileCommentsSheet.jsx';
import useSmartFeed from '../hooks/useSmartFeed.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';
import { likePost, savePost, sharePost, deletePost } from '../api/posts.js';
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

function normalizePost(p, i) {
  const author = p.author_name || p.username || p.user || 'مستخدم يام شات';
  const handle = (p.username || p.user || `user${i}`).toString();
  const verified = Boolean(p.verified || p.is_verified || p.official);
  const bannerUrl = resolveMediaUrl(
    Array.isArray(p.media_urls) && p.media_urls.length
      ? p.media_urls[0]
      : (p.media_url || p.image_url || '')
  );
  return {
    id: p.id ?? `p-${i}`,
    rawId: p.id,
    authorName: author,
    handle: `@${handle.replace(/^@/, '')}`,
    timeText: timeAgoAr(p.created_at || p.published_at),
    verified,
    avatarUrl: resolveMediaUrl(p.user_avatar || p.avatar || p.author_avatar || ''),
    text: p.content || p.text || '',
    banner: bannerUrl
      ? { type: 'image', url: bannerUrl }
      : null,
    likes: Number(p.likes_count ?? p.like_count ?? p.likes ?? 0),
    comments: Number(p.comments_count ?? p.comment_count ?? p.comments ?? 0),
    reposts: Number(p.share_count ?? p.shares ?? p.reposts ?? 0),
    liked: Boolean(p.is_liked ?? p.liked_by_me ?? p.liked),
    reposted: Boolean(p.reposted ?? p.is_reposted),
    saved: Boolean(p.is_saved ?? p.saved_by_me ?? p.saved),
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

  // overlay فوري للحالة التفاعلية (optimistic UI) قبل وصول استجابة API
  const [overlay, setOverlay] = useState({}); // { [postId]: { liked, likes, saved, reposted, reposts } }

  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const session = useAppStore((s) => s.session);

  const smart = useSmartFeed?.({ filterType: activeFilter });
  const rawPosts = smart?.posts || smart?.data || smart?.items || [];
  const loading = smart?.isLoading || smart?.loading;
  const error = smart?.error;

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
    const list = (Array.isArray(rawPosts) && rawPosts.length)
      ? rawPosts.map((p, i) => normalizePost(p, i))
      : [WELCOME_POST];

    // دمج overlay (optimistic)
    return list.map((p) => {
      const o = overlay[p.id];
      return o ? { ...p, ...o } : p;
    });
  }, [rawPosts, overlay]);

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

  const handleMore = useCallback(async (post) => {
    // نسخ الرابط + خيار حذف للمنشور الخاص بالمستخدم
    const postUrl = `${window.location.origin}/#/post/${post.rawId || post.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        pushToast?.({ type: 'success', title: 'تم نسخ رابط المنشور' });
      } else {
        pushToast?.({ type: 'info', title: 'انسخ الرابط', description: postUrl });
      }
    } catch {
      pushToast?.({ type: 'info', title: 'تم فتح الخيارات' });
    }

    // إذا كان المنشور للمستخدم نفسه -> اعرض خيار الحذف (تأكيد بسيط)
    const myUsername = session?.username || session?.user_name || session?.handle;
    const handleNorm = String(post.handle || '').replace(/^@/, '');
    if (myUsername && post.rawId && handleNorm && handleNorm === myUsername) {
      // confirm بسيط — يمكن لاحقاً استبداله بـ bottom sheet
      const ok = window.confirm('هل تريد حذف هذا المنشور؟');
      if (ok) {
        try {
          await deletePost(post.rawId);
          pushToast?.({ type: 'success', title: 'تم حذف المنشور' });
          queryClient.invalidateQueries({ queryKey: ['feed-data'] });
        } catch (err) {
          pushToast?.({ type: 'error', title: 'تعذر حذف المنشور' });
        }
      }
    }
  }, [session, pushToast, queryClient]);

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
            onRepost={handleRepost}
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
    </>
  );
}

export default memo(FeedMobile);
