import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { getReelsCache } from '../../services/reelsEngine.js';

/**
 * FeedReelsPair (v88.91)
 * ------------------------------------------------------------------
 * بطاقة زوج ريلز (Grid عمودَين) تُدرج داخل الفيد بعد كل 5 منشورات
 * بنمط شبيه بـ YouTube Shorts / Reels على Facebook.
 *
 * - تجلب قائمة الريلز من /reels/feed مع fallback على /reels ثم كاش localStorage.
 * - تعرض كل ريل كبطاقة عمودية 9:16 مع بوستر / فيديو خفيف (muted, autoplay,
 *   playsInline) لضمان أداء جيّد على الجوال.
 * - النقر يفتح صفحة الريلز عند العنصر المحدد (#/reels?reel=<id>).
 * - آمنة تماماً: إذا لم توجد ريلز لا يتم رسم شيء (لا تعطّل الفيد).
 * - تدعم الجوال والويب — نفس البطاقة مع تغييرات CSS بسيطة.
 *
 * البروب:
 *   startIndex : number - رقم مجموعة الزوج (0,1,2,…) لاختيار ريلز مختلفة كل مرة.
 */

function normalizeReel(entry, i) {
  if (!entry || typeof entry !== 'object') return null;
  const id = entry.id ?? entry.reel_id ?? entry.uuid ?? `r-${i}`;
  const rawVideo = entry.video_url || entry.media_url || entry.url || entry.media || '';
  const rawPoster = entry.thumbnail_url || entry.poster || entry.preview_url || entry.image_url || '';
  const author = entry.display_name || entry.full_name || entry.author_name || entry.username || entry.user || 'يام شات';
  const views = Number(entry.views_count ?? entry.views ?? entry.plays_count ?? 0);
  return {
    id: String(id),
    videoUrl: resolveMediaUrl(rawVideo),
    posterUrl: resolveMediaUrl(rawPoster),
    author,
    views,
    text: entry.content || entry.text || entry.caption || '',
  };
}

function formatViews(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}م`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}ك`;
  return String(v);
}

// كاش داخل الوحدة يمنع تكرار جلب الشبكة عند كل mount لبطاقات متعددة في نفس الجلسة
let _memoryReelsCache = null;
let _memoryReelsPromise = null;

async function fetchReelsOnce() {
  if (Array.isArray(_memoryReelsCache) && _memoryReelsCache.length) {
    return _memoryReelsCache;
  }
  if (_memoryReelsPromise) return _memoryReelsPromise;

  _memoryReelsPromise = (async () => {
    // 1) محاولة سريعة: قراءة كاش localStorage الحالي
    let bootstrap = [];
    try {
      const cached = getReelsCache?.()?.items || [];
      if (Array.isArray(cached) && cached.length) bootstrap = cached;
    } catch { /* ignore */ }

    // 2) الشبكة (اختيارية — تفشل صامتاً)
    try {
      let data;
      try {
        ({ data } = await API.get('/reels/feed', { params: { limit: 20, offset: 0 } }));
      } catch {
        ({ data } = await API.get('/reels', { params: { limit: 20, offset: 0 } }));
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
      if (items.length) {
        _memoryReelsCache = items;
        return items;
      }
    } catch { /* ignore network errors */ }

    _memoryReelsCache = bootstrap;
    return bootstrap;
  })();

  return _memoryReelsPromise;
}

function FeedReelsPair({ startIndex = 0 }) {
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const rootRef = useRef(null);
  const videoRefs = useRef([null, null]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchReelsOnce().then((items) => {
      if (cancelled) return;
      const normalized = (items || [])
        .map((it, i) => normalizeReel(it, i))
        .filter((r) => r && r.videoUrl); // نحتاج فيديو صالحاً على الأقل
      setReels(normalized);
    });
    return () => { cancelled = true; };
  }, []);

  // تشغيل الفيديو الخفيف فقط عندما يظهر ضمن الرؤية (توفير موارد)
  useEffect(() => {
    if (!rootRef.current || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => setIsVisible(entry.isIntersecting));
    }, { threshold: 0.25 });
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      if (isVisible) {
        v.play?.().catch(() => {});
      } else {
        v.pause?.();
      }
    });
  }, [isVisible, reels]);

  const openReel = useCallback((reelId) => {
    if (!reelId) return;
    // صفحة Reels تقرأ highlightReelId من location.state وتمرّر إليه تلقائياً
    try {
      navigate('/reels', { state: { highlightReelId: String(reelId) } });
    } catch {
      navigate('/reels');
    }
  }, [navigate]);

  // نختار زوجاً مختلفاً بناءً على startIndex
  if (!Array.isArray(reels) || reels.length < 2) return null;

  const total = reels.length;
  const a = reels[(startIndex * 2) % total];
  const b = reels[(startIndex * 2 + 1) % total];
  if (!a || !b || a.id === b.id) return null;

  const pair = [a, b];

  return (
    <div
      className="ym-feed-reels-pair"
      dir="rtl"
      ref={rootRef}
      role="region"
      aria-label="ريلز مقترحة"
    >
      <div className="ym-feed-reels-pair__header">
        <div className="ym-feed-reels-pair__title">
          <span className="ym-feed-reels-pair__title-icon" aria-hidden="true">🎬</span>
          <span>ريلز مقترحة</span>
        </div>
        <button
          type="button"
          className="ym-feed-reels-pair__more-btn"
          onClick={() => navigate('/reels')}
          aria-label="عرض كل الريلز"
        >
          عرض الكل
          <span aria-hidden="true">‹</span>
        </button>
      </div>

      <div className="ym-feed-reels-pair__grid">
        {pair.map((reel, idx) => (
          <button
            key={`${reel.id}-${idx}`}
            type="button"
            className="ym-feed-reels-pair__card"
            onClick={() => openReel(reel.id)}
            aria-label={`فتح ريل: ${reel.text?.slice(0, 40) || reel.author}`}
          >
            <div className="ym-feed-reels-pair__media">
              {reel.videoUrl ? (
                <video
                  ref={(el) => { videoRefs.current[idx] = el; }}
                  className="ym-feed-reels-pair__video"
                  src={reel.videoUrl}
                  poster={reel.posterUrl || undefined}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  autoPlay
                  disablePictureInPicture
                />
              ) : reel.posterUrl ? (
                <img
                  className="ym-feed-reels-pair__poster"
                  src={reel.posterUrl}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className="ym-feed-reels-pair__fallback">🎥</div>
              )}

              <div className="ym-feed-reels-pair__overlay" aria-hidden="true" />

              <div className="ym-feed-reels-pair__play-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              </div>

              <div className="ym-feed-reels-pair__meta">
                <div className="ym-feed-reels-pair__caption">
                  {reel.text ? reel.text.slice(0, 60) : `@${reel.author}`}
                </div>
                <div className="ym-feed-reels-pair__stats">
                  <span aria-hidden="true">▶</span>
                  <span>{formatViews(reel.views)} مشاهدة</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(FeedReelsPair);
