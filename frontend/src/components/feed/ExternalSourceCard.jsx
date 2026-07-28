// components/feed/ExternalSourceCard.jsx — v88.85
// ---------------------------------------------------------------
// كارت غني (Rich Preview) لعرض المنشور المُشارك كرابط في الفيد.
// يعرض بيانات المصدر كما في الصورة الثانية:
// • شعار المنصة (YouTube/TikTok/…)، اسم المصدر
// • Thumbnail، عنوان، وصف
// • اسم الناشر، عدد المشتركين، تاريخ النشر، عدد المشاهدات، مدة الفيديو
// • شارة "تمت المشاركة من {المنصة}" + شارة "محتوى خارجي"
// • زر رئيسي "فتح المصدر" — يستدعي openExternalSource (deep-link ذكي)
// ---------------------------------------------------------------

import { useState, useCallback } from 'react';
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

export default function ExternalSourceCard({ linkCard }) {
  const [unsupportedMsg, setUnsupportedMsg] = useState('');
  const [opening, setOpening] = useState(false);

  const platform = String(linkCard?.platform || 'unknown').toLowerCase();
  const logo = PLATFORM_LOGOS[platform] || PLATFORM_LOGOS.unknown;
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

  if (!linkCard) return null;

  const viewsText = formatCount(linkCard.viewsCount);
  const subsText  = formatCount(linkCard.subscribersCount);
  const dateText  = formatDate(linkCard.publishedAt);

  return (
    <div className="ym-ext-card" dir="rtl">
      {/* شارة أعلى الكارت */}
      <div className="ym-ext-card-topbar">
        <span className="ym-ext-card-platform-badge" style={{ background: logo.bg, color: logo.color }}>
          <span className="ym-ext-card-platform-icon" aria-hidden="true">{logo.icon}</span>
          <span>{logo.label}</span>
        </span>
        <span className="ym-ext-card-external-tag">محتوى خارجي</span>
      </div>

      {/* الجزء الرئيسي: صورة + بيانات */}
      <div className="ym-ext-card-main">
        {/* Thumbnail */}
        <div className="ym-ext-card-thumb-wrap">
          {linkCard.thumbnail ? (
            <img src={linkCard.thumbnail} alt={linkCard.title || 'thumbnail'} loading="lazy" />
          ) : (
            <div className="ym-ext-card-thumb-fallback" style={{ background: logo.bg, color: logo.color }}>
              <span style={{ fontSize: 42, lineHeight: 1 }}>{logo.icon}</span>
            </div>
          )}
          {linkCard.duration ? (
            <span className="ym-ext-card-duration">{linkCard.duration}</span>
          ) : null}
        </div>

        {/* بيانات */}
        <div className="ym-ext-card-body">
          <strong className="ym-ext-card-title">{linkCard.title || 'مصدر خارجي'}</strong>
          {linkCard.description ? (
            <p className="ym-ext-card-desc">{linkCard.description}</p>
          ) : null}

          {/* اسم الناشر + مشتركين */}
          {(linkCard.sourceName || subsText) ? (
            <div className="ym-ext-card-author">
              <span className="ym-ext-card-author-logo" style={{ background: logo.bg, color: logo.color }}>
                {logo.icon}
              </span>
              <div className="ym-ext-card-author-meta">
                <strong>{linkCard.sourceName || logo.label}</strong>
                {subsText ? <span>{subsText} مشترك</span> : null}
              </div>
            </div>
          ) : null}

          {/* سطر إحصاءات: مشاهدات + تاريخ + مدة */}
          {(viewsText || dateText || linkCard.duration) ? (
            <div className="ym-ext-card-stats">
              {dateText  ? <span>📅 {dateText}</span> : null}
              {viewsText ? <span>👁 {viewsText} مشاهدة</span> : null}
              {linkCard.duration ? <span>⏱ {linkCard.duration}</span> : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* رسالة عدم دعم */}
      {unsupportedMsg ? (
        <div className="ym-ext-card-unsupported" role="alert">
          ⚠️ {unsupportedMsg}
        </div>
      ) : null}

      {/* أزرار سفلية */}
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
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 12px;
          padding: 14px;
        }
        @media (max-width: 480px) {
          .ym-ext-card-main { grid-template-columns: 110px 1fr; gap: 10px; padding: 12px; }
        }
        .ym-ext-card-thumb-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
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
          display: flex; flex-direction: column; gap: 6px;
          min-width: 0;
        }
        .ym-ext-card-title {
          font-size: 0.98rem; font-weight: 900; color: #f8fafc;
          line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ym-ext-card-desc {
          margin: 0;
          font-size: 0.82rem; color: #94a3b8; line-height: 1.55;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ym-ext-card-author {
          display: flex; align-items: center; gap: 8px; margin-top: 4px;
        }
        .ym-ext-card-author-logo {
          width: 30px; height: 30px; border-radius: 50%;
          display: grid; place-items: center;
          font-size: 0.9rem; font-weight: 900;
          flex-shrink: 0;
        }
        .ym-ext-card-author-meta {
          display: flex; flex-direction: column; gap: 1px;
          min-width: 0;
        }
        .ym-ext-card-author-meta strong {
          font-size: 0.85rem; font-weight: 800; color: #e2e8f0;
        }
        .ym-ext-card-author-meta span {
          font-size: 0.72rem; color: #94a3b8;
        }
        .ym-ext-card-stats {
          display: flex; flex-wrap: wrap; gap: 12px;
          margin-top: 4px;
          font-size: 0.75rem; color: #94a3b8;
        }
        .ym-ext-card-unsupported {
          margin: 0 14px 12px;
          padding: 10px 12px; border-radius: 10px;
          background: rgba(239,68,68,0.10);
          border: 1px solid rgba(239,68,68,0.28);
          color: #fca5a5; font-size: 0.85rem; text-align: center;
        }
        .ym-ext-card-footer {
          display: flex; justify-content: space-between; align-items: center;
          gap: 10px;
          padding: 10px 14px;
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
    </div>
  );
}
