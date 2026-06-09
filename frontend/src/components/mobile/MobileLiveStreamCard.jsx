import { memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * MobileLiveStreamCard - بطاقة البث المباشر في صفحة المنشورات (موبايل)
 *
 * إعادة تصميم 2026 — مطابقة لمنصة X/Twitter وفيسبوك:
 * ┌─────────────────────────────────────────┐
 * │ 👤 اسم المضيف ✓ @handle · مباشر  🔴LIVE│  ← هيدر
 * │ عنوان البث / نص المنشور                  │  ← محتوى نصي
 * │ ┌─────────────────────────────────────┐ │
 * │ │ [صورة الغلاف بوضوح كامل]            │ │  ← media (cover)
 * │ │  🔴LIVE              👁 2.4K مشاهد  │ │
 * │ │            [دخول البث]               │ │
 * │ └─────────────────────────────────────┘ │
 * │ 💬 0   🔁 0   💜 0   👁 0       📤      │  ← شريط أكشن
 * └─────────────────────────────────────────┘
 *
 * أهم الإصلاحات:
 * - صورة الغلاف (thumbnail) تظهر بوضوح بدون overlay مظلم يغطيها.
 * - في حال عدم وجود صورة، يُعرض placeholder احترافي بشعار Y بدلاً من خلفية سوداء.
 * - النصوص والإحصائيات في مناطق منفصلة (مش فوق الصورة) عشان البطاقة ما تبانش مكتظة.
 * - متناسق تماماً مع تصميم بطاقات المنشورات الأخرى (twitter-like layout).
 */
function MobileLiveStreamCard({ post, liveStream, onStreamEnd }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const {
    id = '',
    host_username = 'مستخدم',
    host_name = 'مستخدم',
    title = 'بث مباشر',
    viewer_count = 0,
    hearts_count = 0,
    comments_count = 0,
    thumbnail_url = '',
    cover_url = '',
    preview_url = '',
    host_avatar = '',
    avatar = '',
    started_at = '',
    verified = true,
  } = liveStream || {};

  // معالجة صور الغلاف والأفاتار — جرّب أكثر من حقل
  const thumbnailUrl = useMemo(() => {
    const raw = thumbnail_url || cover_url || preview_url || post?.banner?.url || '';
    return raw ? resolveMediaUrl(raw) : '';
  }, [thumbnail_url, cover_url, preview_url, post?.banner?.url]);

  const avatarUrl = useMemo(() => {
    const raw = host_avatar || avatar || post?.avatarUrl || '';
    return raw ? resolveMediaUrl(raw) : '';
  }, [host_avatar, avatar, post?.avatarUrl]);

  // وقت البث بشكل نسبي
  const startedLabel = useMemo(() => {
    try {
      if (!started_at) return 'الآن';
      const d = new Date(started_at);
      const diffMin = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `قبل ${diffMin} د`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `قبل ${diffH} س`;
      return d.toLocaleDateString('ar-EG');
    } catch { return 'الآن'; }
  }, [started_at]);

  // تنسيق الأرقام (1.2K, 2.4K)
  const formatNum = (n) => {
    const num = Number(n) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}ألف`;
    return num.toLocaleString('ar-EG');
  };

  const handleOpenStream = (e) => {
    e?.stopPropagation?.();
    if (!id) return;
    setIsLoading(true);
    navigate(`/live/view/${id}`);
  };

  const handleShare = (e) => {
    e?.stopPropagation?.();
    try {
      const url = `${window.location.origin}/#/live/view/${id}`;
      const shareData = {
        title: `${host_name} في بث مباشر`,
        text: title,
        url,
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        window.dispatchEvent(new CustomEvent('yamshat:toast', {
          detail: { type: 'success', title: 'تم نسخ رابط البث', duration: 2000 },
        }));
      }
    } catch (_) { /* noop */ }
  };

  const showThumbnail = thumbnailUrl && !thumbnailError;

  return (
    <article className="ym-live-card" aria-label={`بث مباشر من ${host_name}`}>
      {/* ============ الهيدر ============ */}
      <header className="ym-live-card__header">
        <div className="ym-live-card__author" onClick={handleOpenStream} role="button" tabIndex={0}>
          {/* الأفاتار مع حلقة LIVE */}
          <div className="ym-live-card__avatar-wrap">
            <div className="ym-live-card__avatar">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={host_name}
                  loading="lazy"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="ym-live-card__avatar-fallback">
                  {(host_name?.charAt(0) || 'م').toUpperCase()}
                </span>
              )}
            </div>
            <span className="ym-live-card__avatar-ring" aria-hidden="true" />
            <span className="ym-live-card__avatar-live-pill" aria-hidden="true">LIVE</span>
          </div>

          {/* اسم + handle + ميتا */}
          <div className="ym-live-card__author-info">
            <div className="ym-live-card__author-line">
              <span className="ym-live-card__name">{host_name}</span>
              {verified && (
                <svg className="ym-live-card__verified" viewBox="0 0 24 24" aria-label="موثّق" fill="currentColor">
                  <path d="M9 12.75l2.25 2.25 4.5-4.5M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
              )}
              <span className="ym-live-card__handle">@{host_username}</span>
              <span className="ym-live-card__dot">·</span>
              <span className="ym-live-card__time">{startedLabel}</span>
            </div>
            <div className="ym-live-card__sub">
              <span className="ym-live-card__pulse-dot" />
              مباشر الآن
            </div>
          </div>
        </div>

        {/* شارة LIVE + المزيد */}
        <div className="ym-live-card__top-actions">
          <span className="ym-live-card__live-badge">
            <span className="ym-live-card__live-badge-dot" />
            مباشر
          </span>
          <button
            type="button"
            className="ym-live-card__more"
            aria-label="المزيد"
            onClick={(e) => e.stopPropagation()}
          >
            ⋯
          </button>
        </div>
      </header>

      {/* ============ نص البث ============ */}
      {title && (
        <div className="ym-live-card__body">
          <p className="ym-live-card__title">{title}</p>
        </div>
      )}

      {/* ============ الميديا (صورة الغلاف) ============ */}
      <button
        type="button"
        className="ym-live-card__media"
        onClick={handleOpenStream}
        aria-label="فتح البث المباشر"
      >
        {showThumbnail ? (
          <img
            src={thumbnailUrl}
            alt={title || 'غلاف البث'}
            className="ym-live-card__thumb"
            loading="lazy"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          /* Placeholder احترافي بشعار Y كبير في المنتصف (تصميم 2026) */
          <div className="ym-live-card__thumb-placeholder" aria-hidden="true">
            <div className="ym-live-card__thumb-glow" />
            <svg className="ym-live-card__thumb-logo" viewBox="0 0 120 120" fill="none">
              <defs>
                <linearGradient id={`ymGrad-${id || 'def'}`} x1="0" y1="0" x2="120" y2="120">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path
                d="M25 22 L60 65 L95 22 M60 65 L60 100"
                stroke={`url(#ymGrad-${id || 'def'})`}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ym-live-card__thumb-label">YAMSHAT LIVE</span>
          </div>
        )}

        {/* تدرج خفيف من الأسفل فقط لقراءة الشارات (مش overlay كامل) */}
        <div className="ym-live-card__media-shade" aria-hidden="true" />

        {/* شارة LIVE في أعلى الصورة */}
        <span className="ym-live-card__media-live">
          <span className="ym-live-card__media-live-dot" />
          LIVE
        </span>

        {/* عدد المشاهدين */}
        <span className="ym-live-card__media-views">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/>
          </svg>
          {formatNum(viewer_count)} مشاهد
        </span>

        {/* زر تشغيل وسط الصورة */}
        <span className="ym-live-card__media-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>

        {/* CTA دخول البث (أسفل الصورة) */}
        <span className="ym-live-card__media-cta">
          {isLoading ? 'جاري الفتح...' : 'دخول البث'}
        </span>
      </button>

      {/* ============ شريط الأكشن (تويتر/X style) ============ */}
      <footer className="ym-live-card__footer">
        <button
          type="button"
          className="ym-live-card__action"
          onClick={handleOpenStream}
          aria-label="تعليق"
        >
          <span className="ym-live-card__action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </span>
          <span className="ym-live-card__action-num">{formatNum(comments_count)}</span>
        </button>

        <button
          type="button"
          className="ym-live-card__action"
          onClick={handleShare}
          aria-label="إعادة نشر"
        >
          <span className="ym-live-card__action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </span>
          <span className="ym-live-card__action-num">0</span>
        </button>

        <button
          type="button"
          className="ym-live-card__action ym-live-card__action--heart"
          onClick={handleOpenStream}
          aria-label="إعجاب"
        >
          <span className="ym-live-card__action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </span>
          <span className="ym-live-card__action-num">{formatNum(hearts_count)}</span>
        </button>

        <button
          type="button"
          className="ym-live-card__action"
          onClick={handleOpenStream}
          aria-label="مشاهدات"
        >
          <span className="ym-live-card__action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M3 3v18h18"/>
              <path d="M7 12l4-4 4 4 6-6"/>
            </svg>
          </span>
          <span className="ym-live-card__action-num">{formatNum(viewer_count)}</span>
        </button>

        <button
          type="button"
          className="ym-live-card__action ym-live-card__action--share"
          onClick={handleShare}
          aria-label="مشاركة"
        >
          <span className="ym-live-card__action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </span>
        </button>
      </footer>

      <style>{`
        /* ============ بطاقة بث مباشر بتصميم X/Twitter (موبايل) ============ */
        .ym-live-card {
          width: 100%;
          margin: 10px 0;
          background: var(--bg-card, #0b1020);
          color: var(--text, #e2e8f0);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
          contain: layout style;
          /* تحسين الأداء على الأجهزة منخفضة الإمكانيات */
          will-change: auto;
        }
        .ym-live-card:hover {
          border-color: rgba(124, 58, 237, 0.45);
          box-shadow: 0 8px 22px rgba(124, 58, 237, 0.18);
        }

        /* ============ الهيدر ============ */
        .ym-live-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          padding: 12px 14px 6px;
        }
        .ym-live-card__author {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }
        .ym-live-card__avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .ym-live-card__avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ym-live-card__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ym-live-card__avatar-fallback {
          color: #fff;
          font-weight: 800;
          font-size: 18px;
        }
        .ym-live-card__avatar-ring {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 2px solid #ef4444;
          animation: ymLivePulse 1.6s infinite;
          pointer-events: none;
        }
        .ym-live-card__avatar-live-pill {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          padding: 1px 6px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.5px;
          border-radius: 4px;
          line-height: 1.2;
          box-shadow: 0 2px 6px rgba(239,68,68,0.5);
        }
        @keyframes ymLivePulse {
          0%   { box-shadow: 0 0 0 0   rgba(239,68,68,.7); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0   rgba(239,68,68,0); }
        }
        .ym-live-card__author-info {
          min-width: 0;
          flex: 1;
        }
        .ym-live-card__author-line {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          font-size: 13.5px;
          line-height: 1.3;
        }
        .ym-live-card__name {
          font-weight: 800;
          color: var(--text, #f1f5f9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .ym-live-card__verified {
          width: 14px;
          height: 14px;
          color: #a78bfa;
          flex-shrink: 0;
        }
        .ym-live-card__handle,
        .ym-live-card__time,
        .ym-live-card__dot {
          color: var(--muted, #94a3b8);
          font-size: 12px;
          font-weight: 500;
        }
        .ym-live-card__sub {
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #ef4444;
        }
        .ym-live-card__pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          animation: ymLivePulse 1.6s infinite;
        }

        /* الجزء الأيسر من الهيدر: شارة LIVE + المزيد */
        .ym-live-card__top-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .ym-live-card__live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
          box-shadow: 0 3px 10px rgba(239,68,68,0.4);
        }
        .ym-live-card__live-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
          animation: ymLivePulse 1.6s infinite;
        }
        .ym-live-card__more {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--muted, #94a3b8);
          font-size: 20px;
          line-height: 1;
          border-radius: 50%;
          cursor: pointer;
          transition: background .2s ease;
        }
        .ym-live-card__more:hover {
          background: rgba(148,163,184,0.12);
          color: #a78bfa;
        }

        /* ============ نص البث ============ */
        .ym-live-card__body {
          padding: 4px 14px 10px;
        }
        .ym-live-card__title {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.55;
          color: var(--text, #e2e8f0);
          font-weight: 500;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ============ الميديا (الغلاف) ============ */
        .ym-live-card__media {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          padding: 0;
          margin: 0 14px;
          width: calc(100% - 28px);
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          background: linear-gradient(135deg, #1a0f3f 0%, #0a0e27 100%);
          font: inherit;
          color: inherit;
          isolation: isolate;
        }
        .ym-live-card__thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          /* تحسين أداء الصور على الأجهزة منخفضة الإمكانيات */
          content-visibility: auto;
        }
        .ym-live-card__thumb-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background:
            radial-gradient(circle at 30% 35%, rgba(124,58,237,.35), transparent 55%),
            radial-gradient(circle at 70% 65%, rgba(59,130,246,.25), transparent 55%),
            linear-gradient(135deg, #1a0f3f 0%, #0a0e27 100%);
        }
        .ym-live-card__thumb-glow {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle, rgba(167,139,250,0.25), transparent 60%);
          animation: ymLiveGlow 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ymLiveGlow {
          0%, 100% { transform: scale(1); opacity: .7; }
          50%      { transform: scale(1.12); opacity: 1; }
        }
        .ym-live-card__thumb-logo {
          position: relative;
          width: 96px;
          height: 96px;
          filter: drop-shadow(0 6px 22px rgba(167,139,250,0.6));
          animation: ymLogoFloat 4s ease-in-out infinite;
        }
        @keyframes ymLogoFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-4px) scale(1.04); }
        }
        .ym-live-card__thumb-label {
          position: relative;
          color: rgba(255,255,255,0.9);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 3px;
          text-shadow: 0 2px 8px rgba(124,58,237,0.6);
        }

        /* تدرج خفيف من الأسفل فقط (مش يغطي الصورة) */
        .ym-live-card__media-shade {
          position: absolute;
          inset: auto 0 0 0;
          height: 45%;
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%);
          pointer-events: none;
        }

        /* شارة LIVE في أعلى يسار الصورة (RTL: يمين) */
        .ym-live-card__media-live {
          position: absolute;
          top: 10px;
          inset-inline-start: 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          border-radius: 6px;
          box-shadow: 0 3px 12px rgba(239,68,68,0.5);
        }
        .ym-live-card__media-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
          animation: ymLivePulse 1.6s infinite;
        }

        /* عدد المشاهدين أعلى يمين (RTL: يسار) */
        .ym-live-card__media-views {
          position: absolute;
          top: 10px;
          inset-inline-end: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 999px;
        }

        /* زر تشغيل في المنتصف */
        .ym-live-card__media-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 22px rgba(0,0,0,0.4);
          transition: transform .25s ease, background .25s ease;
        }
        .ym-live-card__media:hover .ym-live-card__media-play,
        .ym-live-card__media:active .ym-live-card__media-play {
          transform: translate(-50%, -50%) scale(1.08);
          background: #fff;
        }

        /* زر CTA "دخول البث" (أسفل الصورة) */
        .ym-live-card__media-cta {
          position: absolute;
          bottom: 10px;
          inset-inline-end: 10px;
          padding: 7px 14px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          border-radius: 10px;
          box-shadow: 0 6px 16px rgba(124,58,237,0.5);
        }

        /* ============ شريط الأكشن (footer مثل X) ============ */
        .ym-live-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          padding: 10px 14px 12px;
          margin-top: 8px;
          color: var(--muted, #94a3b8);
        }
        .ym-live-card__action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: transparent;
          border: none;
          border-radius: 999px;
          color: inherit;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background .2s ease, color .2s ease, transform .15s ease;
        }
        .ym-live-card__action:hover {
          background: rgba(124, 58, 237, 0.12);
          color: #a78bfa;
        }
        .ym-live-card__action--heart:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .ym-live-card__action--share:hover {
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
        }
        .ym-live-card__action:active {
          transform: scale(0.92);
        }
        .ym-live-card__action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ym-live-card__action-num {
          font-variant-numeric: tabular-nums;
          min-width: 12px;
          text-align: start;
        }

        /* ============ الوضع الفاتح ============ */
        @media (prefers-color-scheme: light) {
          .ym-live-card {
            background: #ffffff;
            color: #0f172a;
            border-color: rgba(148, 163, 184, 0.22);
          }
          .ym-live-card__name { color: #0f172a; }
          .ym-live-card__title { color: #0f172a; }
          .ym-live-card__handle,
          .ym-live-card__time,
          .ym-live-card__dot,
          .ym-live-card__footer { color: #64748b; }
        }

        /* ============ تجاوب الجوال الصغير ============ */
        @media (max-width: 380px) {
          .ym-live-card__media { aspect-ratio: 4 / 3; }
          .ym-live-card__name { max-width: 110px; }
          .ym-live-card__media-play { width: 46px; height: 46px; }
          .ym-live-card__media-cta { font-size: 11px; padding: 6px 12px; }
          .ym-live-card__action-num { font-size: 11.5px; }
        }

        /* ============ تقليل الحركة ============ */
        @media (prefers-reduced-motion: reduce) {
          .ym-live-card__avatar-ring,
          .ym-live-card__pulse-dot,
          .ym-live-card__media-live-dot,
          .ym-live-card__live-badge-dot,
          .ym-live-card__thumb-glow {
            animation: none;
          }
        }
      `}</style>
    </article>
  );
}

export default memo(MobileLiveStreamCard);
