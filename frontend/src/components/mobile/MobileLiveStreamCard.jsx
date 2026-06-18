import { memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * MobileLiveStreamCard - بطاقة البث المباشر داخل فيد المنشورات (موبايل)
 *
 * ✅ إعادة تصميم 2026-06-10 — مطابقة لشكل التغريدة (الصورة المرجعية الثالثة):
 *
 * ┌──────────────────────────────────────────┐
 * │ Y  المضيف ✓ @handle  ·  منذ X دقيقة  ⋮ │  ← هيدر شبيه بتويتر
 * │ نص بسيط للبث (سطر واحد)                  │
 * │ ┌──────────────────────────────────────┐ │
 * │ │ [غلاف 16:9] LIVE        2.4K مشاهد  │ │  ← ميديا مع شارة LIVE
 * │ └──────────────────────────────────────┘ │
 * │ 💬 0    🔁 0    💜 0           ↗        │  ← شريط أكشن نظيف
 * └──────────────────────────────────────────┘
 *
 * - بسيطة، خفيفة، تشبه بطاقة المنشور العادية تمامًا (للتجانس).
 * - أداء عالٍ على الأجهزة منخفضة الإمكانيات (CSS مقلّل، اعتماد على transform).
 * - لا overlay داكنة فوق الصورة، صورة الغلاف واضحة بالكامل.
 */
function MobileLiveStreamCard({ post, liveStream, onStreamEnd }) {
  const navigate = useNavigate();
  const [thumbnailError, setThumbnailError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const {
    id = '',
    host_username = 'مستخدم',
    host_name = 'مستخدم',
    title = '',
    viewer_count = 0,
    hearts_count = 0,
    comments_count = 0,
    thumbnail_url = '',
    cover_url = '',
    preview_url = '',
    host_avatar = '',
    avatar = '',
    started_at = '',
    verified = false,
  } = liveStream || {};

  const thumbnailUrl = useMemo(() => {
    const raw = thumbnail_url || cover_url || preview_url || post?.banner?.url || '';
    return raw ? resolveMediaUrl(raw) : '';
  }, [thumbnail_url, cover_url, preview_url, post?.banner?.url]);

  const avatarUrl = useMemo(() => {
    const raw = host_avatar || avatar || post?.avatarUrl || '';
    return raw ? resolveMediaUrl(raw) : '';
  }, [host_avatar, avatar, post?.avatarUrl]);

  const startedLabel = useMemo(() => {
    try {
      const dateSrc = started_at || post?.timeText;
      if (!dateSrc) return post?.timeText || 'الآن';
      if (typeof dateSrc === 'string' && /منذ|قبل/.test(dateSrc)) return dateSrc;
      const d = new Date(dateSrc);
      if (Number.isNaN(d.getTime())) return post?.timeText || 'الآن';
      const diffMin = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `قبل ${diffMin} د`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `قبل ${diffH} س`;
      return d.toLocaleDateString('ar-EG');
    } catch { return post?.timeText || 'الآن'; }
  }, [started_at, post?.timeText]);

  const formatNum = (n) => {
    const num = Number(n) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}ألف`;
    return num.toLocaleString('ar-EG');
  };

  const handleOpenStream = (e) => {
    e?.stopPropagation?.();
    if (!id) return;
    navigate(`/live/view/${id}`);
  };

  const handleShare = (e) => {
    e?.stopPropagation?.();
    try {
      const url = `${window.location.origin}/#/live/view/${id}`;
      const shareData = { title: `${host_name} في بث مباشر`, text: title || 'بث مباشر', url };
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
    <article className="ymlc" aria-label={`بث مباشر من ${host_name}`}>
      {/* ============ الهيدر (تويتر-style) ============ */}
      <header className="ymlc__head">
        <div className="ymlc__avatar" onClick={handleOpenStream} role="button" tabIndex={0}>
          {avatarUrl && !avatarError ? (
            <img src={avatarUrl} alt={host_name} loading="lazy" onError={() => setAvatarError(true)} />
          ) : (
            <span className="ymlc__avatar-fb">{(host_name?.charAt(0) || 'م').toUpperCase()}</span>
          )}
        </div>

        <div className="ymlc__head-info">
          <div className="ymlc__head-line1">
            <span className="ymlc__name">{host_name}</span>
            {verified && (
              <svg className="ymlc__verified" viewBox="0 0 24 24" fill="currentColor" aria-label="موثّق">
                <path d="M9 12.75l2.25 2.25 4.5-4.5M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
            )}
            <span className="ymlc__handle">@{host_username}</span>
            <span className="ymlc__sep">·</span>
            <span className="ymlc__time">{startedLabel}</span>
          </div>
          <div className="ymlc__head-line2">
            <span className="ymlc__live-pill">
              <span className="ymlc__live-dot" /> مباشر الآن
            </span>
          </div>
        </div>

        <button type="button" className="ymlc__more" aria-label="المزيد" onClick={(e) => e.stopPropagation()}>⋯</button>
      </header>

      {/* نص البث */}
      {title && (
        <div className="ymlc__body">
          <p className="ymlc__text">{title}</p>
        </div>
      )}

      {/* الميديا (الغلاف) */}
      <button type="button" className="ymlc__media" onClick={handleOpenStream} aria-label="فتح البث المباشر">
        {showThumbnail ? (
          <img src={thumbnailUrl} alt={title || 'غلاف البث'} className="ymlc__thumb" loading="lazy" onError={() => setThumbnailError(true)} />
        ) : (
          <div className="ymlc__thumb-ph" aria-hidden="true">
            <svg viewBox="0 0 120 120" fill="none" className="ymlc__thumb-logo">
              <defs>
                <linearGradient id={`ymG-${id || 'def'}`} x1="0" y1="0" x2="120" y2="120">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <path d="M25 22 L60 65 L95 22 M60 65 L60 100" stroke={`url(#ymG-${id || 'def'})`} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* شارة LIVE */}
        <span className="ymlc__badge-live">
          <span className="ymlc__badge-live-dot" /> LIVE
        </span>

        {/* عدد المشاهدين */}
        {viewer_count > 0 && (
          <span className="ymlc__badge-views">
            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/>
            </svg>
            {formatNum(viewer_count)} مشاهد
          </span>
        )}

        {/* زر تشغيل في المنتصف */}
        <span className="ymlc__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
      </button>

      {/* شريط الأكشن (تويتر-style) */}
      <footer className="ymlc__foot">
        <button type="button" className="ymlc__act" onClick={handleOpenStream} aria-label="تعليق">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          <span>{formatNum(comments_count)}</span>
        </button>

        <button type="button" className="ymlc__act" onClick={handleShare} aria-label="إعادة نشر">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          <span>0</span>
        </button>

        <button type="button" className="ymlc__act ymlc__act--heart" onClick={handleOpenStream} aria-label="إعجاب">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{formatNum(hearts_count)}</span>
        </button>

        <button type="button" className="ymlc__act ymlc__act--share" onClick={handleShare} aria-label="مشاركة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      </footer>

      <style>{`
        /* ===== بطاقة بث مباشر مدمجة (تويتر-style) — 2026-06-10 ===== */
        .ymlc {
          width: 100%;
          margin: 6px 0;
          padding: 0;
          background: var(--bg-card, transparent);
          color: var(--text, #e2e8f0);
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
          display: flex;
          flex-direction: column;
          contain: layout style;
        }
        .ymlc__head {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 14px 4px;
        }
        .ymlc__avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
        }
        .ymlc__avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ymlc__avatar-fb { color: #fff; font-weight: 800; font-size: 16px; }

        .ymlc__head-info { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .ymlc__head-line1 {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          font-size: 13.5px;
          line-height: 1.25;
        }
        .ymlc__name {
          font-weight: 700;
          color: var(--text, #f1f5f9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .ymlc__verified { width: 14px; height: 14px; color: #a78bfa; flex-shrink: 0; }
        .ymlc__handle, .ymlc__time, .ymlc__sep { color: var(--muted, #94a3b8); font-size: 12.5px; font-weight: 400; }

        .ymlc__live-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff;
          font-size: 10.5px;
          font-weight: 800;
          border-radius: 999px;
          line-height: 1.4;
        }
        .ymlc__live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #fff;
          animation: ymlcPulse 1.4s infinite;
        }
        @keyframes ymlcPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .ymlc__more {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: var(--muted, #94a3b8);
          font-size: 18px;
          line-height: 1;
          border-radius: 50%;
          cursor: pointer;
        }
        .ymlc__more:hover { background: rgba(148, 163, 184, 0.12); }

        .ymlc__body { padding: 0 14px 6px 60px; }
        .ymlc__text {
          margin: 0;
          font-size: 14px;
          line-height: 1.45;
          color: var(--text, #e2e8f0);
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* الميديا */
        .ymlc__media {
          position: relative;
          display: block;
          width: calc(100% - 14px - 60px);
          aspect-ratio: 16 / 9;
          margin: 4px 14px 4px 60px;
          padding: 0;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(135deg, #1a0f3f, #0a0e27);
          cursor: pointer;
          font: inherit;
          color: inherit;
          isolation: isolate;
        }
        .ymlc__thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          content-visibility: auto;
        }
        .ymlc__thumb-ph {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 30% 40%, rgba(124,58,237,.3), transparent 60%),
            linear-gradient(135deg, #1a0f3f, #0a0e27);
        }
        .ymlc__thumb-logo { width: 64px; height: 64px; filter: drop-shadow(0 4px 14px rgba(124,58,237,0.5)); }

        .ymlc__badge-live {
          position: absolute;
          top: 8px;
          inset-inline-start: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
          border-radius: 5px;
          box-shadow: 0 2px 8px rgba(239,68,68,0.5);
        }
        .ymlc__badge-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #fff;
          animation: ymlcPulse 1.4s infinite;
        }
        .ymlc__badge-views {
          position: absolute;
          top: 8px;
          inset-inline-end: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(0,0,0,0.55);
          color: #fff;
          font-size: 10.5px;
          font-weight: 700;
          border-radius: 999px;
        }
        .ymlc__play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          transition: transform .2s ease;
        }
        .ymlc__media:active .ymlc__play { transform: translate(-50%, -50%) scale(0.94); }

        /* شريط الأكشن */
        .ymlc__foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          padding: 6px 14px 10px 60px;
          color: var(--muted, #94a3b8);
          max-width: 420px;
        }
        .ymlc__act {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          background: transparent;
          border: none;
          border-radius: 999px;
          color: inherit;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }
        .ymlc__act:hover { background: rgba(124,58,237,0.1); color: #a78bfa; }
        .ymlc__act--heart:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
        .ymlc__act--share:hover { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .ymlc__act svg { flex-shrink: 0; }
        .ymlc__act span { font-variant-numeric: tabular-nums; }

        @media (prefers-color-scheme: light) {
          .ymlc { border-bottom-color: rgba(148,163,184,0.22); }
          .ymlc__name { color: #0f172a; }
          .ymlc__text { color: #0f172a; }
          .ymlc__handle, .ymlc__time, .ymlc__sep, .ymlc__foot { color: #64748b; }
        }

        @media (max-width: 380px) {
          .ymlc__body, .ymlc__foot { padding-inline-start: 56px; }
          .ymlc__media {
            width: calc(100% - 14px - 56px);
            margin-inline-start: 56px;
          }
          .ymlc__name { max-width: 110px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ymlc__live-dot, .ymlc__badge-live-dot { animation: none; }
        }
      `}</style>
    </article>
  );
}

export default memo(MobileLiveStreamCard);
