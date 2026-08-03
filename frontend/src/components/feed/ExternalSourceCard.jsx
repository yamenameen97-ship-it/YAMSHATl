// components/feed/ExternalSourceCard.jsx — v89.25
// ---------------------------------------------------------------
// كارت المصدر الخارجي — يعمل بوضعين:
//
// 1) وضع الرابط (link mode) — عند مشاركة رابط فقط:
//    • شارة YouTube بأيقونة يوتيوب الحقيقية + شارة "محتوى خارجي"
//    • Thumbnail + مؤشر مدة (10:21)
//    • عنوان + وصف + سطر القناة (أفاتار + اسم + مشتركين)
//    • إحصائيات: 📅 التاريخ | 👁 المشاهدات | ⏱ المدة
//    • Footer: "تمت المشاركة من YouTube" + زر "فتح المصدر"
//
// 2) وضع الفيديو المُنزَّل (video mode) — عند تنزيل الفيديو ونشره:
//    • مشغّل فيديو حقيقي بزر ▶ في المنتصف
//    • شريط تقدّم بأسفل يسار: 00:00 / 10:21
//    • أيقونة صوت + أيقونة ملء الشاشة بأسفل يمين
//    • لا يوجد زر "فتح المصدر" ولا شارة "محتوى خارجي"
//    • Footer صغير: أيقونة YouTube + "تم تنزيل هذا الفيديو ومشاركته من YouTube"
//      وسطر ثانٍ "المصدر الأصلي موثق لدى Yamshat"
//
// منطق التفريق:
//   mode === 'video'  أو  وجود videoUrl  →  وضع الفيديو المُنزَّل
//   خلاف ذلك                              →  وضع الرابط (Rich Preview)
// ---------------------------------------------------------------

import { useState, useRef, useCallback, useEffect } from 'react';
import { openExternalSource } from '../../services/share/sourceOpener.js';

const PLATFORM_LOGOS = {
  youtube:   { icon: '▶',  label: 'YouTube',    color: '#FF0000', bg: 'rgba(255,0,0,0.12)' },
  tiktok:    { icon: '♪',  label: 'TikTok',     color: '#25F4EE', bg: 'rgba(37,244,238,0.10)' },
  twitter:   { icon: '𝕏',  label: 'X',          color: '#ffffff', bg: 'rgba(255,255,255,0.10)' },
  instagram: { icon: '◈',  label: 'Instagram',  color: '#E1306C', bg: 'rgba(225,48,108,0.12)' },
  facebook:  { icon: 'f',  label: 'Facebook',   color: '#1877F2', bg: 'rgba(24,119,242,0.12)' },
  snapchat:  { icon: '👻', label: 'Snapchat',   color: '#FFFC00', bg: 'rgba(255,252,0,0.10)' },
  reddit:    { icon: '🅡', label: 'Reddit',     color: '#FF4500', bg: 'rgba(255,69,0,0.12)' },
  telegram:  { icon: '✈',  label: 'Telegram',   color: '#26A5E4', bg: 'rgba(38,165,228,0.12)' },
  whatsapp:  { icon: '🟢', label: 'WhatsApp',   color: '#25D366', bg: 'rgba(37,211,102,0.12)' },
  web:       { icon: '🌐', label: 'موقع ويب',   color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  unknown:   { icon: '🔗', label: 'مصدر خارجي', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
};

// أيقونة YouTube الحقيقية (SVG) — للاستخدام في الشارة وفي الفوتر
function YouTubeGlyph({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 20" aria-hidden="true" focusable="false">
      <path
        d="M27.4 3.1a3.5 3.5 0 0 0-2.5-2.5C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1C0 5.3 0 10 0 10s0 4.7.6 6.9a3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5C28 14.7 28 10 28 10s0-4.7-.6-6.9z"
        fill="#FF0000"
      />
      <path d="M11.2 14.3 18.4 10l-7.2-4.3v8.6z" fill="#fff" />
    </svg>
  );
}

function formatCount(n) {
  const v = Number(n || 0);
  if (!v) return null;
  if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1)} مليون`;
  if (v >= 1_000)     return `${(v/1_000).toFixed(1)}K`;
  return String(v);
}

function formatDate(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return null; }
}

function formatSeconds(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// حوّل "10:21" أو ثوانٍ إلى ثوانٍ
function durationToSeconds(dur) {
  if (dur == null) return 0;
  if (typeof dur === 'number') return Math.max(0, Math.floor(dur));
  const s = String(dur).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(':').map(p => parseInt(p, 10) || 0);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return 0;
}

// نص المدة كما يظهر (10:21)
function displayDuration(dur) {
  if (dur == null || dur === '') return null;
  if (typeof dur === 'number') return formatSeconds(dur);
  const s = String(dur).trim();
  if (/^\d+$/.test(s)) return formatSeconds(parseInt(s, 10));
  return s; // مثل "10:21"
}

// ---------------------------------------------------------------
// وضع الفيديو المُنزَّل — الصورة الأولى
// ---------------------------------------------------------------
function VideoPlayerCard({ linkCard, logo }) {
  const videoRef = useRef(null);
  const wrapRef  = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [muted, setMuted]       = useState(false);
  const [currentT, setCurrentT] = useState(0);
  const totalDurStr = displayDuration(linkCard.duration) || '00:00';
  const totalDurSec = durationToSeconds(linkCard.duration);
  const src = linkCard.videoUrl || linkCard.localVideoUrl || linkCard.mediaUrl || '';

  const handleTogglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); }
    else          { v.pause(); }
  }, []);

  const handleToggleMute = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleFullscreen = useCallback((e) => {
    e.stopPropagation();
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime  = () => setCurrentT(v.currentTime || 0);
    v.addEventListener('play',  onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    return () => {
      v.removeEventListener('play',  onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
    };
  }, []);

  const pct = totalDurSec > 0 ? Math.min(100, (currentT / totalDurSec) * 100) : 0;

  return (
    <div className="ym-ext-card ym-ext-card--video" dir="rtl">
      {/* مشغّل الفيديو */}
      <div className="ym-vplayer" ref={wrapRef} onClick={handleTogglePlay}>
        {src ? (
          <video
            ref={videoRef}
            className="ym-vplayer-el"
            src={src}
            poster={linkCard.thumbnail || undefined}
            playsInline
            preload="metadata"
          />
        ) : linkCard.thumbnail ? (
          <img className="ym-vplayer-poster" src={linkCard.thumbnail} alt={linkCard.title || 'video'} />
        ) : (
          <div className="ym-vplayer-poster ym-vplayer-poster--empty" />
        )}

        {/* Overlay Play */}
        {!playing && (
          <button
            type="button"
            className="ym-vplayer-play"
            onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}
            aria-label="تشغيل"
          >
            <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.55)" />
              <path d="M26 20 L46 32 L26 44 Z" fill="#fff" />
            </svg>
          </button>
        )}

        {/* شريط تقدّم (سفلي كامل) */}
        <div className="ym-vplayer-progress">
          <div className="ym-vplayer-progress-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* الوقت: 00:00 / 10:21 (بأسفل اليسار في LTR — أي بداية السطر) */}
        <div className="ym-vplayer-time">
          {formatSeconds(currentT)} / {totalDurStr}
        </div>

        {/* أزرار: صوت + ملء الشاشة (بأسفل اليمين في LTR) */}
        <div className="ym-vplayer-controls">
          <button
            type="button"
            className="ym-vplayer-ctrl"
            onClick={handleToggleMute}
            aria-label={muted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3-2.5-2.5-1.4 1.4L15.1 13l-2.5 2.5 1.4 1.4L16.5 14.4l2.5 2.5 1.4-1.4L17.9 13l2.5-2.5-1.4-1.4L16.5 11.6z" fill="#fff"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM13 3.2v2.06a7 7 0 0 1 0 13.48v2.06a9 9 0 0 0 0-17.6z" fill="#fff"/>
              </svg>
            )}
          </button>
          <button
            type="button"
            className="ym-vplayer-ctrl"
            onClick={handleFullscreen}
            aria-label="ملء الشاشة"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="#fff"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Footer صغير — بدون زر فتح المصدر */}
      <div className="ym-ext-card-footer ym-ext-card-footer--video">
        <span className="ym-ext-card-footer-icon" aria-hidden="true">
          <YouTubeGlyph size={18} />
        </span>
        <div className="ym-ext-card-footer-text">
          <div>تم تنزيل هذا الفيديو ومشاركته من YouTube</div>
          <div className="ym-ext-card-footer-sub">
            المصدر الأصلي موثق لدى Yamshat
          </div>
        </div>
      </div>

      <VideoCardStyles />
    </div>
  );
}

// ---------------------------------------------------------------
// وضع الرابط — الصورة الثانية (Rich Preview)
// ---------------------------------------------------------------
function LinkPreviewCard({ linkCard, logo }) {
  const [unsupportedMsg, setUnsupportedMsg] = useState('');
  const [opening, setOpening] = useState(false);
  const supportsOpen = Boolean(linkCard?.sourceUrl);

  const handleOpenSource = useCallback(async () => {
    if (!linkCard?.sourceUrl || opening) return;
    setOpening(true);
    setUnsupportedMsg('');
    try {
      await openExternalSource(linkCard.sourceUrl, {
        onUnsupported: (msg) => setUnsupportedMsg(msg || 'هذا المصدر غير مدعوم'),
      });
    } finally {
      setTimeout(() => setOpening(false), 500);
    }
  }, [linkCard, opening]);

  const viewsText = formatCount(linkCard.viewsCount);
  const subsText  = formatCount(linkCard.subscribersCount);
  const dateText  = formatDate(linkCard.publishedAt);
  const durText   = displayDuration(linkCard.duration);
  const isYouTube = String(linkCard?.platform || '').toLowerCase() === 'youtube';

  return (
    <div className="ym-ext-card" dir="rtl">
      {/* شارة أعلى الكارت */}
      <div className="ym-ext-card-topbar">
        <span className="ym-ext-card-platform-badge" style={{ background: logo.bg, color: logo.color }}>
          {isYouTube ? (
            <YouTubeGlyph size={14} />
          ) : (
            <span className="ym-ext-card-platform-icon" aria-hidden="true">{logo.icon}</span>
          )}
          <span>{logo.label}</span>
        </span>
        <span className="ym-ext-card-external-tag">محتوى خارجي</span>
      </div>

      {/* الجزء الرئيسي */}
      <div className="ym-ext-card-main">
        <div className="ym-ext-card-thumb-wrap">
          {linkCard.thumbnail ? (
            <img src={linkCard.thumbnail} alt={linkCard.title || 'thumbnail'} loading="lazy" />
          ) : (
            <div className="ym-ext-card-thumb-fallback" style={{ background: logo.bg, color: logo.color }}>
              <span style={{ fontSize: 42, lineHeight: 1 }}>{logo.icon}</span>
            </div>
          )}
          {durText ? (
            <span className="ym-ext-card-duration">{durText}</span>
          ) : null}
        </div>

        <div className="ym-ext-card-body">
          <strong className="ym-ext-card-title">{linkCard.title || 'مصدر خارجي'}</strong>
          {linkCard.description ? (
            <p className="ym-ext-card-desc">{linkCard.description}</p>
          ) : null}

          {(linkCard.authorName || linkCard.sourceName || subsText) ? (
            <div className="ym-ext-card-author">
              {linkCard.authorAvatar ? (
                <img
                  className="ym-ext-card-author-avatar"
                  src={linkCard.authorAvatar}
                  alt={linkCard.authorName || linkCard.sourceName || ''}
                  loading="lazy"
                />
              ) : (
                <span className="ym-ext-card-author-logo" style={{ background: logo.bg, color: logo.color }}>
                  {logo.icon}
                </span>
              )}
              <div className="ym-ext-card-author-meta">
                <strong>{linkCard.authorName || linkCard.sourceName || logo.label}</strong>
                {subsText ? <span>{subsText} مشترك</span>
                  : (linkCard.authorName && linkCard.sourceName && linkCard.authorName !== linkCard.sourceName)
                    ? <span>{linkCard.sourceName}</span>
                    : null}
              </div>
            </div>
          ) : null}

          {(viewsText || dateText || durText) ? (
            <div className="ym-ext-card-stats">
              {dateText ? <span>📅 {dateText}</span> : null}
              {viewsText ? <span>👁 {viewsText} مشاهدة</span> : null}
              {durText ? <span>⏱ {durText}</span> : null}
            </div>
          ) : null}
        </div>
      </div>

      {unsupportedMsg ? (
        <div className="ym-ext-card-unsupported" role="alert">
          ⚠️ {unsupportedMsg}
        </div>
      ) : null}

      <div className="ym-ext-card-footer">
        <span className="ym-ext-card-shared-note">
          📎 تمت المشاركة من {logo.label}
        </span>
        <button
          type="button"
          className="ym-ext-card-open-btn"
          onClick={handleOpenSource}
          disabled={!supportsOpen || opening}
        >
          {opening ? '⏳ جارٍ الفتح…' : '↗ فتح المصدر'}
        </button>
      </div>

      <LinkCardStyles />
    </div>
  );
}

// ---------------------------------------------------------------
// المكوّن الرئيسي — يختار الوضع
// ---------------------------------------------------------------
export default function ExternalSourceCard({ linkCard }) {
  if (!linkCard) return null;

  const platform = String(linkCard?.platform || 'unknown').toLowerCase();
  const logo = PLATFORM_LOGOS[platform] || PLATFORM_LOGOS.unknown;

  // منطق التفريق:
  //  - mode === 'video'  → مشغّل فيديو
  //  - أو videoUrl/localVideoUrl/mediaUrl موجود → فيديو مُنزَّل
  //  - أو isDownloaded === true → فيديو
  const isVideoMode =
       linkCard.mode === 'video'
    || linkCard.type === 'video'
    || Boolean(linkCard.videoUrl)
    || Boolean(linkCard.localVideoUrl)
    || linkCard.isDownloaded === true;

  return isVideoMode
    ? <VideoPlayerCard   linkCard={linkCard} logo={logo} />
    : <LinkPreviewCard   linkCard={linkCard} logo={logo} />;
}

// ---------------------------------------------------------------
// أنماط CSS
// ---------------------------------------------------------------
function LinkCardStyles() {
  return (
    <style>{`
      .ym-ext-card {
        margin-top: 10px;
        border-radius: 18px;
        background: linear-gradient(180deg, #0f172a, #0b1220);
        border: 1px solid rgba(148,163,184,0.16);
        overflow: hidden;
        color: #f1f5f9;
        font-family: 'Noto Sans Arabic','Tajawal','Cairo',system-ui,sans-serif;
      }
      .ym-ext-card-topbar {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(148,163,184,0.08);
        background: rgba(255,255,255,0.02);
      }
      .ym-ext-card-platform-badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 12px; border-radius: 999px;
        font-size: 0.82rem; font-weight: 800;
      }
      .ym-ext-card-platform-icon { font-size: 1rem; line-height: 1; }
      .ym-ext-card-external-tag {
        font-size: 0.72rem; padding: 3px 10px; border-radius: 999px;
        background: rgba(255,255,255,0.05); color: #94a3b8;
        border: 1px solid rgba(255,255,255,0.06); font-weight: 700;
      }
      .ym-ext-card-main {
        display: grid; grid-template-columns: 130px 1fr; gap: 12px; padding: 14px;
      }
      @media (max-width: 480px) {
        .ym-ext-card-main { grid-template-columns: 110px 1fr; gap: 10px; padding: 12px; }
      }
      .ym-ext-card-thumb-wrap {
        position: relative; width: 100%; aspect-ratio: 4/3;
        border-radius: 12px; overflow: hidden;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.05);
      }
      .ym-ext-card-thumb-wrap img {
        width: 100%; height: 100%; object-fit: cover; display: block;
      }
      .ym-ext-card-thumb-fallback {
        width: 100%; height: 100%;
        display: grid; place-items: center;
      }
      .ym-ext-card-duration {
        position: absolute; bottom: 6px; inset-inline-end: 6px;
        padding: 2px 8px; border-radius: 6px;
        background: rgba(0,0,0,0.75); color: #fff;
        font-size: 0.72rem; font-weight: 700;
      }
      .ym-ext-card-body {
        display: flex; flex-direction: column; gap: 6px; min-width: 0;
      }
      .ym-ext-card-title {
        font-size: 0.98rem; font-weight: 900; color: #f8fafc; line-height: 1.4;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ym-ext-card-desc {
        margin: 0; font-size: 0.82rem; color: #94a3b8; line-height: 1.55;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ym-ext-card-author {
        display: flex; align-items: center; gap: 8px; margin-top: 4px;
      }
      .ym-ext-card-author-logo {
        width: 30px; height: 30px; border-radius: 50%;
        display: grid; place-items: center;
        font-size: 0.9rem; font-weight: 900; flex-shrink: 0;
      }
      .ym-ext-card-author-avatar {
        width: 30px; height: 30px; border-radius: 50%;
        object-fit: cover; flex-shrink: 0;
        background: rgba(255,255,255,0.05);
      }
      .ym-ext-card-author-meta {
        display: flex; flex-direction: column; gap: 1px; min-width: 0;
      }
      .ym-ext-card-author-meta strong { font-size: 0.85rem; font-weight: 800; color: #e2e8f0; }
      .ym-ext-card-author-meta span { font-size: 0.72rem; color: #94a3b8; }
      .ym-ext-card-stats {
        display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px;
        font-size: 0.75rem; color: #94a3b8;
      }
      .ym-ext-card-unsupported {
        margin: 0 14px 12px; padding: 10px 12px; border-radius: 10px;
        background: rgba(239,68,68,0.10);
        border: 1px solid rgba(239,68,68,0.28);
        color: #fca5a5; font-size: 0.85rem; text-align: center;
      }
      .ym-ext-card-footer {
        display: flex; justify-content: space-between; align-items: center;
        gap: 10px; padding: 10px 14px;
        border-top: 1px solid rgba(148,163,184,0.08);
        background: rgba(255,255,255,0.02);
        flex-wrap: wrap;
      }
      .ym-ext-card-shared-note {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 0.78rem; color: #cbd5e1;
      }
      .ym-ext-card-open-btn {
        padding: 8px 18px; border-radius: 12px;
        border: 1px solid rgba(139,92,246,0.4);
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: #fff; font-weight: 800; font-size: 0.88rem;
        cursor: pointer; font-family: inherit;
        transition: transform .15s ease, box-shadow .2s ease;
        box-shadow: 0 6px 16px rgba(99,102,241,0.25);
      }
      .ym-ext-card-open-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 10px 22px rgba(99,102,241,0.4);
      }
      .ym-ext-card-open-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    `}</style>
  );
}

function VideoCardStyles() {
  return (
    <style>{`
      .ym-ext-card--video {
        margin-top: 10px;
        border-radius: 18px;
        background: linear-gradient(180deg, #0f172a, #0b1220);
        border: 1px solid rgba(148,163,184,0.16);
        overflow: hidden;
        color: #f1f5f9;
        font-family: 'Noto Sans Arabic','Tajawal','Cairo',system-ui,sans-serif;
      }
      .ym-vplayer {
        position: relative;
        width: 100%;
        aspect-ratio: 16/9;
        background: #000;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
      }
      .ym-vplayer-el,
      .ym-vplayer-poster {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: cover;
        display: block;
        background: #000;
      }
      .ym-vplayer-poster--empty {
        background: linear-gradient(135deg, #1e293b, #0f172a);
      }
      .ym-vplayer-play {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: transparent; border: 0; padding: 0;
        cursor: pointer;
        transition: transform .15s ease;
      }
      .ym-vplayer-play:hover { transform: translate(-50%, -50%) scale(1.06); }
      .ym-vplayer-progress {
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: 3px;
        background: rgba(255,255,255,0.15);
      }
      .ym-vplayer-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #8b5cf6, #ec4899);
        transition: width .2s linear;
      }
      /* الوقت: LTR أرقام، وأسفل يسار المشغّل */
      .ym-vplayer-time {
        position: absolute;
        bottom: 12px; left: 12px;
        direction: ltr;
        padding: 3px 8px; border-radius: 6px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 0.78rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.3px;
      }
      /* الأزرار: أسفل اليمين */
      .ym-vplayer-controls {
        position: absolute;
        bottom: 8px; right: 10px;
        display: inline-flex; align-items: center; gap: 6px;
      }
      .ym-vplayer-ctrl {
        width: 32px; height: 32px;
        display: grid; place-items: center;
        border: 0; border-radius: 8px;
        background: rgba(0,0,0,0.55);
        color: #fff;
        cursor: pointer;
        transition: background .15s ease, transform .15s ease;
      }
      .ym-vplayer-ctrl:hover {
        background: rgba(0,0,0,0.8);
        transform: translateY(-1px);
      }
      /* Footer وضع الفيديو */
      .ym-ext-card-footer--video {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        border-top: 1px solid rgba(148,163,184,0.08);
        background: rgba(255,255,255,0.02);
        justify-content: flex-start;
      }
      .ym-ext-card-footer-icon {
        display: inline-grid; place-items: center;
        width: 28px; height: 28px;
        border-radius: 8px;
        background: rgba(255,255,255,0.04);
        flex-shrink: 0;
      }
      .ym-ext-card-footer-text {
        display: flex; flex-direction: column; gap: 2px;
        font-size: 0.82rem;
        color: #cbd5e1;
        line-height: 1.5;
      }
      .ym-ext-card-footer-sub {
        font-size: 0.76rem;
        color: #94a3b8;
      }
    `}</style>
  );
}
