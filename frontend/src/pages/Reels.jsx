import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { addComment, getComments } from '../api/posts.js';
import { addReelComment, getReelComments } from '../api/reels.js';
import API from '../api/axios.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';
import { getReelsCache, saveReelsCache } from '../services/reelsEngine.js';
// ✅ v59.13.16 FIX #1: ربط ReportModal بصفحة الريلز — كان موجوداً لكن غير مستخدم في الريلز
import ReportModal from '../components/reports/ReportModal.jsx';

/**
 * Reels.jsx — v58 (Touch Master + Centered Tabs + Avatar-Follow)
 * ---------------------------------------------------------------------------
 * - dir="rtl" + خط Noto Sans Arabic في كل مكان.
 * - تصميم موحّد للموبايل واللابتوب (يتمدّد ويلتزم بنفس الـ UI).
 * - الترتيب البصري من اليمين لليسار كما في الصورة:
 *     [العنوان: الريلز] (تابات: ريلز / متابعة / اكتشف)
 *     فيديو بالشاشة الكاملة + Overlay داكن.
 *     أزرار جانبية (يمين): إضافة (Y+), إعجاب, تعليق, مشاركة, شعار المستخدم.
 *     معلومات السطر السفلي: اسم المستخدم + الموثّق + منذ 5 دقائق + الوصف + الهاشتاج.
 * - نحتفظ بكل الـ API endpoints القديمة (/reels/feed, /reels/:id/like, ..).
 */

function fmtCount(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

// ✅ v85.8: وقت دقيق — يأخذ التوقيت المحلي للمتصفح ويحسب الفارق بدقة.
//   - يقبل ISO أو timestamp (ms).
//   - يتعامل مع الفوارق السلبية (وقت مستقبلي) ويرجع "الآن".
//   - طوال اليوم: يرجع دقائق/ساعات. بعدها: أيام/أسابيع/أشهر/سنوات.
function timeAgoAr(iso) {
  if (!iso) return 'الآن';
  let t;
  if (typeof iso === 'number') {
    // إذا كان بالثواني اضرب ×1000
    t = iso < 1e12 ? iso * 1000 : iso;
  } else {
    const s = String(iso);
    // دعم للأرقام كنص (Unix seconds/ms)
    if (/^\d+$/.test(s)) {
      const num = Number(s);
      t = num < 1e12 ? num * 1000 : num;
    } else {
      // إذا لم يكن منتهياً بـZ أو offset نفترض UTC لتجنب الإزاحة
      const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s);
      t = new Date(hasTz ? s : `${s}Z`).getTime();
    }
  }
  if (!Number.isFinite(t)) return 'الآن';
  const diffSec = Math.floor((Date.now() - t) / 1000);
  // وقت مستقبلي أو فرق أقل من 5ث: "الآن"
  if (diffSec < 5) return 'الآن';
  const sec = diffSec;
  if (sec < 60) return `قبل ${sec} ثانية`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `منذ ${min} دقيقة`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `منذ ${hr} ساعة`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `منذ ${d} يوم`;
  const w = Math.floor(d / 7);
  if (w < 5) return `منذ ${w} أسبوع`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `منذ ${mo} شهر`;
  const yr = Math.floor(d / 365);
  return `منذ ${yr} سنة`;
}

function normalizeReel(item = {}) {
  const rawVideoUrl = item.media_url || item.video_url || item.url || item.file_url || item.media || '';
  const rawPosterUrl = item.thumbnail_url || item.poster || item.image_url || item.preview_url || item.thumbnail || '';
  // ✅ v59.13.34 FIX: تصفير كل العدادات والقيم التجريبية fallback
  // المشكلة السابقة: عند فشل جلب البيانات (catch) أو غياب الحقول، كانت
  // تُعرض قيم وهمية (1200/128/356 + اسم/وصف/هاشتاجات افتراضية) تُربك
  // المستخدم بأنها أرقام/منشورات حقيقية. الآن نعرض الأرقام الفعلية من
  // قاعدة البيانات فقط؛ وإذا لم تكن موجودة نعرض 0.
  return {
    id: item.id || item._id || String(item.reel_id || Math.random()),
    username: item.username || item.user?.username || '',
    is_verified: Boolean(item.is_verified ?? item.user?.is_verified ?? false),
    // ✅ v85.8: التوقيت الدقيق — ندعم عدة أسماء حقول من الباك إند
    // (published_at / posted_at / created / timestamp) حتى لا يُرجع إلى Date.now()
    // الذي كان يجعل الريل المنشور منذ ساعات يظهر كأنه "الآن".
    created_at: item.created_at || item.createdAt || item.published_at || item.posted_at || item.created || item.timestamp || null,
    content: item.content || item.caption || item.description || '',
    hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
    media_url: resolveMediaUrl(rawVideoUrl),
    video_url: resolveMediaUrl(rawVideoUrl),
    poster: resolveMediaUrl(rawPosterUrl),
    thumbnail_url: resolveMediaUrl(rawPosterUrl),
    likes_count: Number(item.likes_count ?? 0) || 0,
    comments_count: Number(item.comments_count ?? 0) || 0,
    share_count: Number(item.share_count ?? item.shares_count ?? 0) || 0,
    views_count: Number(item.views_count ?? 0) || 0,
    is_liked: Boolean(item.is_liked),
    is_saved: Boolean(item.is_saved),
    is_following: Boolean(item.is_following ?? item.user?.is_following ?? false),
    avatar: resolveMediaUrl(item.user?.avatar || item.user?.avatar_url || item.user_avatar || item.avatar || ''),
  };
}

function reelIdentity(reel = {}) {
  return String(reel.id || reel._id || reel.reel_id || reel.media_url || reel.video_url || `${reel.username || 'user'}-${reel.created_at || ''}`);
}

function mergeReelLists(primary = [], secondary = []) {
  const merged = [];
  const seen = new Set();
  [...primary, ...secondary]
    .map((item) => normalizeReel(item))
    .filter((item) => item.media_url)
    .forEach((item) => {
      const key = reelIdentity(item);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
  merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return merged;
}

export default function Reels() {
  const navigate = useNavigate();
  const location = useLocation();
  const { push: pushToast } = useToast() || {};

  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [topTab, setTopTab] = useState('reels'); // reels | following | explore
  const [muted, setMuted] = useState(true);
  // ✅ v59.13.34 FIX: progress يبدأ من 0 (لا قيمة تجريبية 0.42)
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [activeComments, setActiveComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  // ✅ v59.13.16 FIX #1: هدف الإبلاغ لـ ReportModal
  const [reportTarget, setReportTarget] = useState(null);

  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  // ✅ FIX v59.13.8 (#3): isMountedRef لحماية setState داخل الـ handlers الـ async
  //    (handleLike / handleShare / openComments / sendComment) عند مغادرة الصفحة.
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Load feed + merge freshly published local cache so new reels appear instantly
  useEffect(() => {
    let cancelled = false;
    const cachedItems = getReelsCache()?.items || [];
    const cachedNormalized = mergeReelLists(cachedItems, []);
    if (cachedNormalized.length) {
      setReels(cachedNormalized);
    }
    (async () => {
      setIsLoading(true);
      try {
        let data;
        try {
          ({ data } = await API.get('/reels/feed', { params: { limit: 40, offset: 0 } }));
        } catch {
          ({ data } = await API.get('/reels', { params: { limit: 40, offset: 0 } }));
        }
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.reels)
            ? data.reels
            : Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                  ? data
                  : [];
        if (cancelled) return;
        const merged = mergeReelLists(items, cachedItems);
        setReels(merged);
        saveReelsCache(merged);
      } catch {
        if (!cancelled) setReels(cachedNormalized);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleReelsUpdated = () => {
      const cached = getReelsCache()?.items || [];
      setReels((prev) => mergeReelLists(cached, prev));
    };
    window.addEventListener('yamshat:reels-updated', handleReelsUpdated);
    return () => window.removeEventListener('yamshat:reels-updated', handleReelsUpdated);
  }, []);

  const currentReel = reels[activeIndex] || null;

  useEffect(() => {
    const highlightReelId = location?.state?.highlightReelId;
    const container = containerRef.current;
    if (!highlightReelId || !container || !Array.isArray(reels) || reels.length === 0) return;
    const targetIndex = reels.findIndex((item) => String(item?.id) === String(highlightReelId));
    if (targetIndex < 0) return;
    setActiveIndex(targetIndex);
    const scrollTop = targetIndex * container.clientHeight;
    if (Number.isFinite(scrollTop)) {
      container.scrollTo({ top: scrollTop, behavior: 'auto' });
    }
  }, [location?.state, reels]);

  // Snap scroll: detect active reel
  // ✅ v59.13.5 FIX #5: throttle عبر rAF + حماية من clientHeight===0 → NaN
  // المشكلة السابقة: المعالج كان يُطلق 60+ مرّة/ثانية أثناء السكرول الزخمي
  // (momentum)، وإذا كان الحاوي مخفيًا (clientHeight=0) تحول النتيجة إلى NaN
  // → setActiveIndex(NaN) يكسر تشغيل الفيديو بصمت.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    let rafId = 0;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafId = window.requestAnimationFrame(() => {
        pending = false;
        const h = el.clientHeight;
        if (!h) return; // حماية من القسمة على صفر
        const raw = el.scrollTop / h;
        if (!Number.isFinite(raw)) return;
        const idx = Math.round(raw);
        if (idx !== activeIndex && idx >= 0 && idx < reels.length) {
          setActiveIndex(idx);
        }
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [activeIndex, reels.length]);

  // Play / pause based on active
  // ✅ FIX (v59.13.3): إزالة اعتمادية reels الكاملة من الـ effect.
  // المشكلة السابقة: أي تحديث للـ reels (إعجاب/تعليق/مشاركة) كان يعيد تشغيل
  // الـ effect → استدعاء .play() غير ضروري + إعادة تشغيل الفيديو من البداية
  // + ترك مراجع فيديوهات معلّقة في videoRefs بعد إعادة العرض.
  // الحل: نعتمد فقط على activeIndex و muted و reels.length
  // (لإعادة التشغيل فقط عند تغير العدد الفعلي للريلز)
  useEffect(() => {
    // تنظيف المراجع المعلّقة: إذا صغر المصفوف بعد حذف
    if (videoRefs.current.length > reels.length) {
      videoRefs.current.length = reels.length;
    }

    // v85.5 FIX: محاولة تشغيل قوية مع إعادة المحاولة على iOS/Chrome mobile
    // المشكلة السابقة: play() قد يفشل بصمت إذا كان الفيديو لم يُحمَّل بعد
    // الحل: نضبط muted أولاً ثم load() إذا لزم ثم play()، مع إعادة محاولة عبر canplay
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIndex) {
        v.muted = muted;
        v.defaultMuted = muted;
        v.playsInline = true;
        v.setAttribute('playsinline', 'true');
        v.setAttribute('webkit-playsinline', 'true');
        if (!v.src && v.dataset.src) {
          v.src = v.dataset.src;
        }
        if (v.readyState < 2) {
          try { v.load?.(); } catch {}
        }
        if (v.paused) {
          const tryPlay = () => v.play?.().catch(() => {});
          const p = tryPlay();
          if (p && typeof p.then === 'function') {
            p.catch(() => {
              // في حالة الفشل، محاولة أخرى بعد canplay / loadeddata
              const once = () => {
                tryPlay();
                v.removeEventListener('canplay', once);
                v.removeEventListener('loadeddata', once);
              };
              v.addEventListener('canplay', once, { once: true });
              v.addEventListener('loadeddata', once, { once: true });
            });
          }
        }
      } else {
        if (!v.paused) v.pause?.();
        try { v.currentTime = 0; } catch {}
      }
    });
  }, [activeIndex, muted, reels.length]);

  const handleLike = useCallback(async (reel) => {
    if (!reel) return;
    const nextLiked = !reel.is_liked;
    const delta = nextLiked ? 1 : -1;
    setReels((prev) => prev.map((r) => (r.id === reel.id
      ? { ...r, is_liked: nextLiked, likes_count: Math.max(0, r.likes_count + delta) }
      : r)));
    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/like`);
    } catch {
      // ✅ FIX v59.13.8 (#3): تجنّب rollback / toast بعد unmount
      if (!isMountedRef.current) return;
      setReels((prev) => prev.map((r) => (r.id === reel.id
        ? { ...r, is_liked: !nextLiked, likes_count: Math.max(0, r.likes_count - delta) }
        : r)));
      pushToast?.({ type: 'error', title: 'تعذّر تحديث الإعجاب' });
    }
  }, [pushToast]);

  const handleShare = useCallback(async (reel) => {
    if (!reel) return;
    const url = `${window.location.origin}/reels/${encodeURIComponent(reel.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Yamshat Reel', url });
      } else {
        await navigator.clipboard.writeText(url);
        // ✅ FIX v59.13.8 (#3): فحص mount قبل toast (قد يغادر المستخدم أثناء نسخ الرابط)
        if (!isMountedRef.current) return;
        pushToast?.({ type: 'success', title: 'تم نسخ الرابط' });
      }
      if (!isMountedRef.current) return;
      setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, share_count: r.share_count + 1 } : r)));
      API.post(`/reels/${encodeURIComponent(reel.id)}/share`).catch(() => {});
    } catch {}
  }, [pushToast]);

  /*
    v85.5 FIX (تعليقات الريلز تختفي بعد الإرسال):
    - المشكلة السابقة: كانت addComment/getComments تستخدم endpoints خاصة
      بالمنشورات (posts) مما أدّى إلى تخزين التعليق في مجدول خاطئ أو فشل صامت.
    - الحل: نستخدم addReelComment/getReelComments الجديدة مع fallback لمرة واحدة
      لـ /posts/{id}/comment لدعم النسخ الأقدم إن لم يكن الباك-إند محدّثًا بعد.
  */
  const openComments = useCallback(async (reel) => {
    if (!reel) return;
    setShowComments(true);
    let items = [];
    try {
      const { data } = await getReelComments(reel.id);
      items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    } catch {
      // fallback: المسار القديم (إن لم يكن الباك-إند محدّثًا بعد)
      try {
        const { data } = await getComments(reel.id);
        items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      } catch {
        items = [];
      }
    }
    if (!isMountedRef.current) return;
    setActiveComments(items);
  }, []);

  const sendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !currentReel) return;
    // تفاؤلي: أضف التعليق فورًا للواجهة
    const tempId = `tmp_${Date.now()}`;
    const optimistic = { id: tempId, content: text, username: 'me', _pending: true };
    setActiveComments((prev) => [optimistic, ...prev]);
    setCommentText('');

    try {
      const { data } = await addReelComment(currentReel.id, text);
      if (!isMountedRef.current) return;
      // استبدال التعليق المؤقت بالحقيقي
      setActiveComments((prev) => prev.map((c) => (c.id === tempId ? (data || { ...c, _pending: false }) : c)));
      setReels((prev) => prev.map((r) => (r.id === currentReel.id ? { ...r, comments_count: r.comments_count + 1 } : r)));
    } catch {
      // محاولة fallback على المسار القديم
      try {
        const { data } = await addComment(currentReel.id, text);
        if (!isMountedRef.current) return;
        setActiveComments((prev) => prev.map((c) => (c.id === tempId ? (data || { ...c, _pending: false }) : c)));
        setReels((prev) => prev.map((r) => (r.id === currentReel.id ? { ...r, comments_count: r.comments_count + 1 } : r)));
      } catch {
        if (!isMountedRef.current) return;
        // إزالة التعليق التفاؤلي وإعادة النص للحقل
        setActiveComments((prev) => prev.filter((c) => c.id !== tempId));
        setCommentText(text);
        pushToast?.({ type: 'error', title: 'تعذّر إرسال التعليق' });
      }
    }
  }, [commentText, currentReel, pushToast]);

  const handleTimeUpdate = useCallback((e) => {
    const v = e.currentTarget;
    if (!v.duration) return;
    setProgress(v.currentTime / v.duration);
  }, []);

  return (
    <MainLayout hideNav={false} lockScroll>
      <div className="ym-reels-root" dir="rtl">
        {/* ===== Top header — التابات فقط (تم حذف العنوان لتوفير المساحة v55) ===== */}
        <div className="ym-reels-top" dir="rtl">
          <div className="ym-reels-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={topTab === 'reels'}
              className={`ym-reels-tab ${topTab === 'reels' ? 'is-active' : ''}`}
              onClick={() => setTopTab('reels')}
            >
              ريلز
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={topTab === 'following'}
              className={`ym-reels-tab ${topTab === 'following' ? 'is-active' : ''}`}
              onClick={() => setTopTab('following')}
            >
              متابعة
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={topTab === 'explore'}
              className={`ym-reels-tab ${topTab === 'explore' ? 'is-active' : ''}`}
              onClick={() => setTopTab('explore')}
            >
              اكتشف
            </button>
          </div>
        </div>

        {/* ===== Feed (snap) ===== */}
        <div className="ym-reels-feed" ref={containerRef} dir="rtl">
          {isLoading && (
            <div className="ym-reels-loader">جاري التحميل…</div>
          )}

          {!isLoading && reels.map((reel, i) => (
            <section key={reel.id} className="ym-reels-slide" aria-label="ريل">
              {/* Video / poster */}
              <div className="ym-reels-media">
                {reel.media_url ? (
                  /*
                    v85.5 FIX (مشكلة الريلز لا يشتغل):
                    - autoPlay + muted (مطلوبان لتشغيل تلقائي على الموبايل).
                    - preload="auto" للريل النشط، metadata للغير نشط.
                    - webkit-playsinline لـ iOS القديم.
                    - controls=false + معالجة أخطاء التحميل لإظهار البوستر.
                    - defaultMuted لضمان التشغيل التلقائي في Chrome/Safari.
                  */
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    className="ym-reels-video"
                    src={reel.media_url}
                    data-src={reel.media_url}
                    poster={reel.poster || undefined}
                    playsInline
                    webkit-playsinline="true"
                    x5-playsinline="true"
                    loop
                    muted={muted}
                    defaultMuted
                    autoPlay={i === activeIndex}
                    preload={i === activeIndex ? 'auto' : 'metadata'}
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    onLoadedMetadata={(e) => {
                      // ضمان بدء التشغيل للريل النشط
                      if (i === activeIndex && e.currentTarget.paused) {
                        e.currentTarget.muted = muted;
                        e.currentTarget.defaultMuted = muted;
                        e.currentTarget.play?.().catch(() => {});
                      }
                    }}
                    onLoadedData={(e) => {
                      if (i === activeIndex && e.currentTarget.paused) {
                        e.currentTarget.muted = muted;
                        e.currentTarget.defaultMuted = muted;
                        e.currentTarget.play?.().catch(() => {});
                      }
                    }}
                    onCanPlay={(e) => {
                      if (i === activeIndex && e.currentTarget.paused) {
                        e.currentTarget.muted = muted;
                        e.currentTarget.defaultMuted = muted;
                        e.currentTarget.play?.().catch(() => {});
                      }
                    }}
                    onError={(e) => {
                      // في حالة فشل تحميل الفيديو، إظهار رسالة خطأ في الكونسول
                      // eslint-disable-next-line no-console
                      console.warn('Reel video load error', reel.id, e.currentTarget?.error);
                    }}
                    onTimeUpdate={i === activeIndex ? handleTimeUpdate : undefined}
                    onClick={() => {
                      const v = videoRefs.current[i];
                      if (!v) return;
                      if (v.paused) v.play?.().catch(() => {}); else v.pause?.();
                    }}
                  />
                ) : (
                  <div
                    className="ym-reels-poster"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.0) 0%, rgba(0,0,0,.45) 70%, rgba(0,0,0,.85) 100%), url(${reel.poster || ''})`,
                    }}
                  >
                    {!reel.poster && (
                      <div className="ym-reels-fallback">
                        <div className="ym-reels-fallback-y" aria-hidden>Y</div>
                        <div className="ym-reels-fallback-brand">YAMSHAT</div>
                      </div>
                    )}
                  </div>
                )}
                <div className="ym-reels-vignette" aria-hidden />
              </div>

              {/* Mute button (يسار-أعلى) */}
              <button
                type="button"
                className="ym-reels-mute"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>

              {/* More button (يمين-أعلى) — ثلاث نقاط */}
              <button type="button" className="ym-reels-more" aria-label="المزيد">
                <span /><span /><span />
              </button>

              {/* Right side actions */}
              <aside className="ym-reels-actions" aria-label="إجراءات الريل">
                {/* Avatar + Follow (+) — v58: avatar circle مع زر + للمتابعة (كما في الصورة المرجعية) */}
                <div className="ym-action-group ym-action-author">
                  <button
                    type="button"
                    className="ym-author-avatar-btn"
                    onClick={() => navigate(`/profile/${encodeURIComponent(reel.username)}`)}
                    aria-label={`ملف ${reel.username}`}
                  >
                    {reel.avatar ? (
                      <img
                        src={reel.avatar}
                        alt={reel.username}
                        className="ym-author-avatar-img"
                        loading="lazy"
                        draggable="false"
                      />
                    ) : (
                      <span className="ym-author-avatar-fallback" aria-hidden>
                        {(reel.username || 'Y')[0]?.toUpperCase()}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`ym-author-follow-plus ${reel.is_following ? 'is-following' : ''}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      const wasFollowing = reel.is_following;
                      // التحديث التفاؤلي
                      setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, is_following: !wasFollowing } : r)));
                      try {
                        // v59.6: توحيد الاستدعاء على endpoint واحد فعلي في الباك اند:
                        // POST /api/users/follow { following: <username> } — يعمل toggle تلقائياً
                        // ثم fallback للمسارات المتاحة الأخرى احتياطاً
                        let serverFollowing = !wasFollowing;
                        try {
                          const { data } = await API.post('/users/follow', { following: reel.username });
                          if (data && typeof data.following === 'boolean') {
                            serverFollowing = data.following;
                          }
                        } catch (primaryErr) {
                          // fallback: profile_v2 (Flask) بـ username في المسار
                          try {
                            if (wasFollowing) {
                              await API.post(`/unfollow/${encodeURIComponent(reel.username)}`);
                              serverFollowing = false;
                            } else {
                              await API.post(`/follow/${encodeURIComponent(reel.username)}`);
                              serverFollowing = true;
                            }
                          } catch (secondaryErr) {
                            throw primaryErr;
                          }
                        }
                        // مزامنة الحالة مع الخادم
                        setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, is_following: serverFollowing } : r)));
                        pushToast?.({ type: 'success', title: serverFollowing ? 'تمت المتابعة' : 'تم إلغاء المتابعة' });
                      } catch (err) {
                        // rollback عند فشل حقيقي
                        setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, is_following: wasFollowing } : r)));
                        const status = err?.response?.status;
                        if (status === 401 || status === 403) {
                          pushToast?.({ type: 'error', title: 'يلزم تسجيل الدخول للمتابعة' });
                        } else {
                          pushToast?.({ type: 'error', title: 'تعذّر تحديث المتابعة' });
                        }
                      }
                    }}
                    aria-label={reel.is_following ? 'إلغاء المتابعة' : 'متابعة'}
                  >
                    {reel.is_following ? '✓' : '+'}
                  </button>
                </div>

                {/* Like */}
                <div className="ym-action-group">
                  <button
                    type="button"
                    className={`ym-action-btn ${reel.is_liked ? 'is-liked' : ''}`}
                    onClick={() => handleLike(reel)}
                    aria-label="إعجاب"
                  >
                    <svg viewBox="0 0 24 24" width="32" height="32" fill={reel.is_liked ? '#ff3b6b' : 'none'} stroke={reel.is_liked ? '#ff3b6b' : '#fff'} strokeWidth="2" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <div className="ym-action-label">{fmtCount(reel.likes_count)}</div>
                </div>

                {/* Comments */}
                <div className="ym-action-group">
                  <button type="button" className="ym-action-btn" onClick={() => openComments(reel)} aria-label="التعليقات">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </button>
                  <div className="ym-action-label">{fmtCount(reel.comments_count)}</div>
                </div>

                {/* Share */}
                <div className="ym-action-group">
                  <button type="button" className="ym-action-btn" onClick={() => handleShare(reel)} aria-label="مشاركة">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                  <div className="ym-action-label">{fmtCount(reel.share_count)}</div>
                </div>

                {/* ✅ v59.13.16 FIX #1: زر إبلاغ على الريل */}
                <div className="ym-action-group">
                  <button
                    type="button"
                    className="ym-action-btn"
                    onClick={() => setReportTarget({ id: reel.id, label: `ريل @${reel.username || ''}` })}
                    aria-label="إبلاغ عن الريل"
                    title="إبلاغ"
                  >
                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 21V4h12l-2 4 2 4H4" />
                      <line x1="4" y1="21" x2="4" y2="4" />
                    </svg>
                  </button>
                  <div className="ym-action-label">إبلاغ</div>
                </div>

                {/* Brand small button — v58: تم نقله إلى الأعلى مع الأفاتار */}
              </aside>

              {/* Music orb (bottom-left small circle) */}
              <div className="ym-reels-orb" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                  <path d="M9 17V5l12-2v12" stroke="#fff" strokeWidth="2" fill="none" />
                  <circle cx="6" cy="17" r="3" />
                  <circle cx="18" cy="15" r="3" />
                </svg>
              </div>

              {/* Bottom info: username + meta + caption */}
              {/* ✅ v85.8: اسم المستخدم أسفل الريل قابل للضغط → يفتح الملف الشخصي */}
              <div className="ym-reels-info">
                <button
                  type="button"
                  className="ym-reels-userline ym-reels-userlink"
                  onClick={() => reel.username && navigate(`/profile/${encodeURIComponent(reel.username)}`)}
                  aria-label={`فتح ملف ${reel.username || 'المستخدم'}`}
                >
                  <span className="ym-reels-username">{reel.username}</span>
                  {reel.is_verified && (
                    <span className="ym-reels-verified" aria-label="موثّق">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#8b5cf6">
                        <path d="M12 2l2.39 2.06 3.18-.34.72 3.12 2.71 1.7-1.36 2.9 1.36 2.9-2.71 1.7-.72 3.12-3.18-.34L12 22l-2.39-2.06-3.18.34-.72-3.12L3 15.46l1.36-2.9L3 9.66l2.71-1.7.72-3.12 3.18.34L12 2z" />
                        <path d="M9 12.5l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
                <div className="ym-reels-time">{timeAgoAr(reel.created_at)}</div>
                <div className="ym-reels-caption">
                  <span className="ym-heart">♥</span>
                  <span>{reel.content}</span>
                </div>
                <div className="ym-reels-hashtags">
                  {reel.hashtags.map((tag) => (
                    <span key={tag} className="ym-reels-tag">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Progress bar (bottom) */}
              <div className="ym-reels-progress" aria-hidden>
                <div className="ym-reels-progress-fill" style={{ width: `${(i === activeIndex ? progress : 0) * 100}%` }} />
              </div>
            </section>
          ))}
        </div>

        {/* ===== Comments drawer ===== */}
        {showComments && (
          <div className="ym-reels-drawer" dir="rtl" role="dialog" aria-modal="true">
            <div className="ym-reels-drawer-backdrop" onClick={() => setShowComments(false)} />
            <div className="ym-reels-drawer-panel">
              <div className="ym-reels-drawer-head">
                <span>التعليقات</span>
                <button type="button" onClick={() => setShowComments(false)} aria-label="إغلاق">✕</button>
              </div>
              <div className="ym-reels-drawer-body">
                {activeComments.length === 0 && (
                  <div className="ym-reels-drawer-empty">لا توجد تعليقات بعد. كن أول من يعلّق ✨</div>
                )}
                {activeComments.map((c, i) => (
                  <div key={c.id || i} className="ym-reels-comment">
                    <div className="ym-reels-comment-avatar" aria-hidden>{(c.username || '?')[0]}</div>
                    <div className="ym-reels-comment-body">
                      <div className="ym-reels-comment-name">{c.username || 'مستخدم'}</div>
                      <div className="ym-reels-comment-text">{c.content || c.text || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ym-reels-drawer-input">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendComment(); }}
                  placeholder="اكتب تعليقك…"
                />
                <button type="button" onClick={sendComment}>إرسال</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Styles ===== */}
        <style>{`
          .ym-reels-root {
            position: fixed;
            inset: 0;
            background: #0a0612;
            color: #fff;
            font-family: 'Noto Sans Arabic', 'Tajawal', 'Cairo', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            direction: rtl;
            overflow: hidden;
            z-index: 1;
          }
          .ym-reels-top {
            position: absolute;
            top: env(safe-area-inset-top, 0px);
            inset-inline-start: 0;
            inset-inline-end: 0;
            /* v58: تم توسيط التابات أفقيّاً في عرض الشاشة (ريلز/متابعة/اكتشف) */
            padding: 18px 18px 10px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 10px;
            z-index: 6;
            pointer-events: none;
          }
          .ym-reels-tabs {
            display: flex;
            /* v58: توسيط التابات في منتصف الشاشة (مطابق للصورة المرجعية الثانية) */
            flex-direction: row;
            gap: 22px;
            pointer-events: auto;
            margin: 0 auto;
            padding: 4px 8px;
            /* لمس سريع وسلس */
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          .ym-reels-tab {
            background: transparent;
            border: 0;
            color: rgba(255,255,255,.78);
            font-size: 14px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 999px;
            cursor: pointer;
            transition: all .2s ease;
            font-family: inherit;
          }
          .ym-reels-tab:hover { color: #fff; }
          .ym-reels-tab.is-active {
            background: #8b5cf6;
            color: #fff;
            box-shadow: 0 6px 18px rgba(139,92,246,.45);
          }

          .ym-reels-feed {
            position: absolute;
            inset: 0;
            overflow-y: auto;
            scroll-snap-type: y mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .ym-reels-feed::-webkit-scrollbar { display: none; }

          .ym-reels-loader {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            color: #c4b5fd;
            font-weight: 600;
          }

          .ym-reels-slide {
            position: relative;
            height: 100vh;
            width: 100%;
            scroll-snap-align: start;
            overflow: hidden;
          }
          .ym-reels-media {
            position: absolute;
            inset: 0;
          }
          .ym-reels-video,
          .ym-reels-poster {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            background: #0a0612;
          }
          .ym-reels-poster {
            background-size: cover;
            background-position: center;
            display: grid;
            place-items: center;
          }
          .ym-reels-fallback {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            filter: drop-shadow(0 8px 32px rgba(139,92,246,.55));
          }
          .ym-reels-fallback-y {
            font-size: 96px;
            font-weight: 900;
            background: linear-gradient(180deg, #c4b5fd, #8b5cf6 70%, #6d28d9);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            letter-spacing: -4px;
          }
          .ym-reels-fallback-brand {
            font-size: 18px;
            letter-spacing: 4px;
            color: #c4b5fd;
            font-weight: 700;
          }
          .ym-reels-vignette {
            position: absolute;
            inset: 0;
            background:
              linear-gradient(180deg, rgba(10,6,18,.55) 0%, rgba(10,6,18,0) 18%, rgba(10,6,18,0) 60%, rgba(10,6,18,.85) 100%);
            pointer-events: none;
          }

          .ym-reels-mute {
            position: absolute;
            /* v55: رفع زر كتم الصوت ليكون بمستوى التابات */
            top: calc(env(safe-area-inset-top, 0px) + 18px);
            inset-inline-start: 18px;
            width: 38px;
            height: 38px;
            border-radius: 999px;
            background: rgba(0,0,0,.45);
            border: 1px solid rgba(255,255,255,.18);
            display: grid;
            place-items: center;
            cursor: pointer;
            color: #fff;
            z-index: 5;
            backdrop-filter: blur(8px);
          }
          .ym-reels-more {
            position: absolute;
            /* v55: رفع زر الثلاث نقاط إلى الأعلى (مكان كلمة الريلز سابقاً) */
            top: calc(env(safe-area-inset-top, 0px) + 18px);
            inset-inline-end: 18px;
            width: 32px;
            height: 32px;
            border: 0;
            background: transparent;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            cursor: pointer;
            z-index: 5;
          }
          .ym-reels-more span {
            display: block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,.6);
          }

          .ym-reels-actions {
            position: absolute;
            inset-inline-end: 14px;
            bottom: 200px;
            display: flex;
            flex-direction: column;
            gap: 22px;
            z-index: 5;
          }
          .ym-action-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }
          .ym-action-btn {
            background: transparent;
            border: 0;
            cursor: pointer;
            color: #fff;
            display: grid;
            place-items: center;
            padding: 0;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,.55));
            transition: transform .15s ease;
          }
          .ym-action-btn:active { transform: scale(.9); }
          .ym-action-btn.is-liked svg { animation: ym-pop .25s ease; }
          @keyframes ym-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.25); }
            100% { transform: scale(1); }
          }
          /* v58: أفاتار المؤلف الدائري + زر متابعة (+) تحته — مطابق لتيكتوك/انستغرام */
          .ym-action-author {
            position: relative;
            padding-bottom: 10px;
          }
          .ym-author-avatar-btn {
            position: relative;
            width: 48px;
            height: 48px;
            border-radius: 999px;
            padding: 0;
            border: 2.5px solid #fff;
            background: linear-gradient(180deg, #8b5cf6, #6d28d9);
            overflow: hidden;
            cursor: pointer;
            display: grid;
            place-items: center;
            box-shadow: 0 6px 18px rgba(139,92,246,.5);
            /* لمس فوري */
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition: transform .15s ease;
          }
          .ym-author-avatar-btn:active { transform: scale(0.92); }
          .ym-author-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            -webkit-user-drag: none;
            user-drag: none;
          }
          .ym-author-avatar-fallback {
            color: #fff;
            font-weight: 900;
            font-size: 22px;
            line-height: 1;
          }
          /* ✅ v85.8: تصغير زر المتابعة — لم يعد يغطي صورة الملف الشخصي.
             من 22px → 15px مع إزاحة خفيفة تحت الأفاتار لتجنب تغطية الوجه */
          .ym-author-follow-plus {
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 16px;
            border-radius: 999px;
            background: #ff3b6b;
            color: #fff;
            font-weight: 900;
            font-size: 10px;
            line-height: 1;
            display: grid;
            place-items: center;
            border: 1.5px solid #0a0612;
            cursor: pointer;
            padding: 0;
            box-shadow: 0 2px 6px rgba(255,59,107,.55);
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition: transform .15s ease, background .2s ease;
          }
          .ym-author-follow-plus:active { transform: translateX(-50%) scale(0.85); }
          .ym-author-follow-plus.is-following {
            background: #8b5cf6;
            box-shadow: 0 2px 6px rgba(139,92,246,.55);
            font-size: 9px;
          }
          .ym-action-label {
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0,0,0,.7);
          }

          .ym-reels-orb {
            position: absolute;
            bottom: 96px;
            inset-inline-start: 18px;
            width: 36px;
            height: 36px;
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139,92,246,.85), rgba(109,40,217,.85));
            display: grid;
            place-items: center;
            box-shadow: 0 6px 16px rgba(139,92,246,.5);
            z-index: 5;
            animation: ym-spin 6s linear infinite;
          }
          @keyframes ym-spin { to { transform: rotate(360deg); } }

          .ym-reels-info {
            position: absolute;
            bottom: 96px;
            inset-inline-end: 70px;
            inset-inline-start: 70px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            z-index: 4;
            text-align: start;
          }
          .ym-reels-userline {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 6px;
          }
          /* ✅ v85.8: اسم المستخدم كزر — يفتح الملف الشخصي عند الضغط */
          .ym-reels-userlink {
            background: transparent;
            border: none;
            padding: 0;
            margin: 0;
            cursor: pointer;
            color: inherit;
            font: inherit;
            text-align: start;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition: opacity .15s ease;
          }
          .ym-reels-userlink:hover .ym-reels-username,
          .ym-reels-userlink:active .ym-reels-username {
            text-decoration: underline;
            opacity: .92;
          }
          .ym-reels-username {
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 1px 4px rgba(0,0,0,.7);
          }
          .ym-reels-verified { display: inline-flex; align-items: center; }
          .ym-reels-time {
            font-size: 12px;
            color: rgba(255,255,255,.75);
            text-shadow: 0 1px 3px rgba(0,0,0,.7);
          }
          .ym-reels-caption {
            font-size: 14px;
            color: #fff;
            line-height: 1.5;
            text-shadow: 0 1px 4px rgba(0,0,0,.75);
            margin-top: 2px;
            display: flex;
            gap: 6px;
            align-items: center;
            flex-direction: row-reverse;
            justify-content: flex-end;
          }
          .ym-heart { color: #c4b5fd; }
          .ym-reels-hashtags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 2px;
          }
          .ym-reels-tag {
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            text-shadow: 0 1px 3px rgba(0,0,0,.7);
          }

          .ym-reels-progress {
            position: absolute;
            bottom: 82px;
            inset-inline-start: 14px;
            inset-inline-end: 14px;
            height: 3px;
            border-radius: 999px;
            background: rgba(255,255,255,.18);
            overflow: hidden;
            z-index: 4;
          }
          .ym-reels-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #c4b5fd);
            transition: width .15s linear;
          }

          /* Comments drawer */
          /* ✅ v74 FIX #1 (DEFINITIVE): درج التعليقات يجلس فوق BottomNav بالكامل
             بحيث يظهر صندوق الإدخال مرئياً دون اختباء خلف شريط التنقل السفلي.
             الإصلاح الجذري: padding-bottom على الحاوية .ym-reels-drawer يرفع البانل بأكمله. */
          .ym-reels-drawer {
            position: fixed;
            inset: 0;
            z-index: 2147483600;
            display: flex;
            align-items: flex-end;
            /* ✅ v74: دفع الدرج بالكامل فوق BottomNav (ارتفاعه ≈64-72px + safe-area) */
            padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
          }
          .ym-reels-drawer-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.55);
            backdrop-filter: blur(2px);
          }
          .ym-reels-panel-anchor { width: 100%; }
          .ym-reels-drawer-panel {
            position: relative;
            width: 100%;
            /* ✅ v74 FIX #1: ارتفاع ثابت بدون safe-area (لأن .ym-reels-drawer يتكفل بالرفع فوق BottomNav).
               صندوق الإدخال أصبح عضواً راسخاً في flex column. */
            height: 60dvh;
            max-height: 60dvh;
            min-height: 320px;
            background: #150f24;
            border-top-left-radius: 22px;
            border-top-right-radius: 22px;
            display: flex;
            flex-direction: column;
            border-top: 1px solid rgba(139,92,246,.4);
            overflow: hidden;
            z-index: 1;
          }
          .ym-reels-drawer-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 18px;
            font-weight: 700;
            color: #fff;
            border-bottom: 1px solid rgba(255,255,255,.08);
          }
          .ym-reels-drawer-head button {
            background: transparent; border: 0; color: #fff; font-size: 18px; cursor: pointer;
          }
          .ym-reels-drawer-body {
            padding: 12px 16px;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .ym-reels-drawer-empty {
            text-align: center;
            color: rgba(255,255,255,.6);
            padding: 30px 0;
          }
          .ym-reels-comment {
            display: flex;
            gap: 10px;
            flex-direction: row-reverse;
            align-items: flex-start;
          }
          .ym-reels-comment-avatar {
            width: 34px; height: 34px; border-radius: 999px;
            background: linear-gradient(180deg, #8b5cf6, #6d28d9);
            display: grid; place-items: center; color: #fff; font-weight: 700;
            flex-shrink: 0;
          }
          .ym-reels-comment-body { flex: 1; text-align: start; }
          .ym-reels-comment-name { font-weight: 700; color: #c4b5fd; font-size: 13px; }
          .ym-reels-comment-text { color: #fff; font-size: 14px; line-height: 1.5; }
          .ym-reels-drawer-input {
            display: flex;
            gap: 8px;
            padding: 14px 14px;
            /* ✅ v74 FIX #1 (DEFINITIVE): البانل بأكمله أصبح فوق BottomNav
               عبر padding-bottom على .ym-reels-drawer. لذلك لا حاجة لـ safe-area هنا. */
            border-top: 1px solid rgba(255,255,255,.08);
            background: #0f0a1c;
            flex-shrink: 0;
            position: relative;
            z-index: 2;
          }
          .ym-reels-drawer-input input {
            flex: 1;
            background: #1f1635;
            border: 1px solid rgba(139,92,246,.3);
            border-radius: 999px;
            color: #fff;
            padding: 10px 16px;
            font-family: inherit;
            font-size: 14px;
            outline: none;
          }
          .ym-reels-drawer-input input:focus { border-color: #8b5cf6; }
          .ym-reels-drawer-input button {
            background: linear-gradient(180deg, #8b5cf6, #6d28d9);
            color: #fff;
            border: 0;
            border-radius: 999px;
            padding: 10px 18px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
          }

          /* ===== Desktop / Laptop layout — نفس التصميم بإطار موبايل في الوسط ===== */
          @media (min-width: 900px) {
            .ym-reels-root {
              background:
                radial-gradient(ellipse at top, rgba(139,92,246,.25), transparent 50%),
                radial-gradient(ellipse at bottom, rgba(109,40,217,.18), transparent 60%),
                #06030d;
            }
            .ym-reels-feed {
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              scroll-snap-type: y mandatory;
            }
            .ym-reels-slide {
              position: relative;
              width: min(440px, 90vw);
              height: min(820px, 92vh);
              margin: 4vh auto;
              border-radius: 28px;
              overflow: hidden;
              box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.2);
              scroll-snap-align: center;
            }
            .ym-reels-top {
              /* v58: توسيط التابات أيضاً في تجربة الديسكتوب */
              padding: 16px 32px 12px;
              inset-inline-start: 0;
              inset-inline-end: 0;
              width: 100%;
              max-width: 1280px;
              margin: 0 auto;
              left: 0;
              right: 0;
              transform: none;
              justify-content: center;
            }
          }

          @media (min-width: 1400px) {
            .ym-reels-slide {
              width: 460px;
              height: 860px;
            }
          }
        `}</style>
      </div>
      {/* ✅ v59.13.16 FIX #1: مودال الإبلاغ متصل بصفحة الريلز */}
      <ReportModal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetType="reel"
        targetId={reportTarget?.id}
        targetLabel={reportTarget?.label}
      />
    </MainLayout>
  );
}
