/**
 * CameraFilterCarousel.jsx — v59.9
 * ------------------------------------------------------------------
 * شريط فلاتر دائري سفلي على طريقة سناب شات لصفحة كاميرا الريلز.
 * - يعرض دوائر صغيرة تحت زر التسجيل، كل دائرة معاينة حيّة للكاميرا
 *   بفلتر مختلف (تجميل/جمالية/ألعاب/كلاسيكي/دافئ/بارد/سينمائي/...).
 * - اختيار فلتر يُطبّقه فوراً على المعاينة الرئيسية ويُفعّل تحسيناً
 *   خاصاً بالوجه (سطوع/تباين/تشبّع/تنعيم بشرة).
 * - يدعم RTL وخط 'Noto Sans Arabic'.
 *
 * Props:
 *   - stream:        MediaStream | null  — مصدر الكاميرا الحيّة (اختياري)
 *   - facing:        'user' | 'environment'
 *   - galleryUrl:    string | ''         — رابط فيديو من المعرض كبديل للستريم
 *   - activeId:      string              — معرّف الفلتر الفعّال
 *   - onSelect:      (filter) => void    — يُستدعى عند اختيار فلتر
 *   - onOpenMore:    () => void          — فتح شاشة المزيد من الفلاتر (اختياري)
 */

import { useEffect, useMemo, useRef } from 'react';

// ---- قائمة الفلاتر الموحّدة (مع تحسينات للوجه) ----
// كل فلتر يحمل:
//   id      : معرّف فريد
//   label   : الاسم الظاهر بالعربية
//   emoji   : أيقونة تعبيرية صغيرة تظهر فوق الدائرة (مثل القناع/الملصق)
//   filter  : سلسلة CSS filter تُطبَّق على عنصر <video>
//   beauty  : تحسين بشرة إضافي (يُضاف حين يكون مفعّلاً تلقائياً)
//   gradient: تدرّج خلفي لحلقة الدائرة لتمييزها بصرياً
export const CAMERA_FILTERS = [
  {
    id: 'none',
    label: 'عادي',
    emoji: '○',
    filter: 'none',
    beauty: '',
    gradient: 'linear-gradient(135deg,#444,#222)',
  },
  {
    id: 'beauty',
    label: 'جمالية',
    emoji: '✨',
    filter: 'brightness(1.10) contrast(1.04) saturate(1.10)',
    beauty: ' blur(0.45px) brightness(1.04) saturate(1.06)',
    gradient: 'linear-gradient(135deg,#ff7eb3,#ff65a3,#7afcff)',
  },
  {
    id: 'games',
    label: 'ألعاب',
    emoji: '🎮',
    filter: 'brightness(1.06) contrast(1.18) saturate(1.40) hue-rotate(-8deg)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#7afcff,#feff9c,#fff740)',
  },
  {
    id: 'cinematic',
    label: 'سينمائي',
    emoji: '🎬',
    filter: 'brightness(0.98) contrast(1.22) saturate(1.16) sepia(0.10)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#232526,#414345)',
  },
  {
    id: 'warm',
    label: 'دافئ',
    emoji: '🔥',
    filter: 'brightness(1.04) contrast(1.06) saturate(1.18) sepia(0.18) hue-rotate(-6deg)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#ff9966,#ff5e62)',
  },
  {
    id: 'cool',
    label: 'بارد',
    emoji: '❄️',
    filter: 'brightness(1.02) contrast(1.10) saturate(0.94) hue-rotate(14deg)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#36d1dc,#5b86e5)',
  },
  {
    id: 'vivid',
    label: 'حيوي',
    emoji: '🌈',
    filter: 'brightness(1.06) contrast(1.18) saturate(1.50)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#ff6a00,#ee0979,#9b51e0)',
  },
  {
    id: 'vintage',
    label: 'كلاسيكي',
    emoji: '📷',
    filter: 'sepia(0.50) contrast(1.10) brightness(0.96) saturate(0.85)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#c79081,#dfa579)',
  },
  {
    id: 'mono',
    label: 'مونو',
    emoji: '🖤',
    filter: 'grayscale(1) contrast(1.18)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#bdc3c7,#2c3e50)',
  },
  {
    id: 'soft',
    label: 'ناعم',
    emoji: '🌸',
    filter: 'brightness(1.10) contrast(0.94) saturate(1.10) blur(0.4px)',
    beauty: ' brightness(1.04)',
    gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
  },
  {
    id: 'sharp',
    label: 'حاد',
    emoji: '⚡',
    filter: 'contrast(1.28) brightness(1.02) saturate(1.20)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#f7971e,#ffd200)',
  },
  {
    id: 'neon',
    label: 'نيون',
    emoji: '💜',
    filter: 'contrast(1.20) saturate(1.55) hue-rotate(-22deg) brightness(1.06)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#7b2ff7,#f107a3)',
  },
  {
    id: 'sunset',
    label: 'غروب',
    emoji: '🌅',
    filter: 'sepia(0.20) saturate(1.30) brightness(1.06) hue-rotate(-12deg)',
    beauty: '',
    gradient: 'linear-gradient(135deg,#ff512f,#f09819)',
  },
  {
    id: 'dream',
    label: 'حلم',
    emoji: '☁️',
    filter: 'brightness(1.12) contrast(0.90) saturate(1.20) blur(0.6px)',
    beauty: ' brightness(1.05)',
    gradient: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  },
];

const STORAGE_KEY = 'yamshat-reels-cam-filter-v1';

export function getSavedCamFilter() {
  try {
    if (typeof window === 'undefined') return 'none';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return CAMERA_FILTERS.find((f) => f.id === saved) ? saved : 'none';
  } catch {
    return 'none';
  }
}

export function saveCamFilter(id) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, String(id || 'none'));
  } catch { /* ignore */ }
}

export function getCamFilterCss(id, withBeauty = false) {
  const f = CAMERA_FILTERS.find((x) => x.id === id) || CAMERA_FILTERS[0];
  let css = f.filter === 'none' ? '' : f.filter;
  if (withBeauty && f.beauty) css = `${css} ${f.beauty}`.trim();
  return css || 'none';
}

// ---- مكوّن دائرة فلتر واحدة ----
function FilterThumb({ filter, isActive, stream, galleryUrl, facing, onClick }) {
  const vidRef = useRef(null);

  // اربط الـ stream الحيّ بكل دائرة (نفس المصدر، فلتر مختلف)
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    if (stream) {
      try {
        if (v.srcObject !== stream) v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } catch { /* ignore */ }
    } else if (galleryUrl) {
      try {
        v.srcObject = null;
        if (v.src !== galleryUrl) v.src = galleryUrl;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } catch { /* ignore */ }
    } else {
      try { v.srcObject = null; v.removeAttribute('src'); v.load(); } catch { /* ignore */ }
    }
  }, [stream, galleryUrl]);

  const hasMedia = Boolean(stream || galleryUrl);

  return (
    <button
      type="button"
      className={`ymrc-fchip ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      aria-label={`فلتر ${filter.label}`}
      aria-pressed={isActive}
      title={filter.label}
    >
      <span
        className="ymrc-fchip-ring"
        style={{ background: filter.gradient }}
        aria-hidden
      />
      <span className="ymrc-fchip-circle">
        {hasMedia ? (
          <video
            ref={vidRef}
            className="ymrc-fchip-video"
            style={{
              filter: filter.filter === 'none' ? 'none' : filter.filter,
              transform: stream && facing === 'user' ? 'scaleX(-1)' : 'none',
            }}
            muted
            playsInline
            autoPlay
          />
        ) : (
          <span
            className="ymrc-fchip-fallback"
            style={{ background: filter.gradient }}
            aria-hidden
          >
            <span className="ymrc-fchip-emoji">{filter.emoji}</span>
          </span>
        )}
        {hasMedia ? (
          <span className="ymrc-fchip-emoji is-overlay" aria-hidden>{filter.emoji}</span>
        ) : null}
      </span>
      <span className="ymrc-fchip-label">{filter.label}</span>
    </button>
  );
}

// ---- الكاروسيل الأساسي ----
export default function CameraFilterCarousel({
  stream = null,
  facing = 'user',
  galleryUrl = '',
  activeId = 'none',
  onSelect,
  onOpenMore,
}) {
  const scrollerRef = useRef(null);
  const filters = useMemo(() => CAMERA_FILTERS, []);

  // مرّر الفلتر النشط أوتوماتيكياً لمنتصف الشريط
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const idx = filters.findIndex((f) => f.id === activeId);
    if (idx < 0) return;
    const node = root.querySelector(`[data-fid="${activeId}"]`);
    if (node && typeof node.scrollIntoView === 'function') {
      try {
        node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch { /* ignore */ }
    }
  }, [activeId, filters]);

  return (
    <div className="ymrc-fcar" dir="rtl">
      <div className="ymrc-fcar-fade ymrc-fcar-fade-r" aria-hidden />
      <div className="ymrc-fcar-fade ymrc-fcar-fade-l" aria-hidden />
      <div className="ymrc-fcar-scroll" ref={scrollerRef}>
        {filters.map((f) => (
          <div key={f.id} data-fid={f.id} className="ymrc-fcar-cell">
            <FilterThumb
              filter={f}
              isActive={activeId === f.id}
              stream={stream}
              galleryUrl={galleryUrl}
              facing={facing}
              onClick={() => onSelect && onSelect(f)}
            />
          </div>
        ))}
        {onOpenMore ? (
          <div className="ymrc-fcar-cell">
            <button
              type="button"
              className="ymrc-fchip ymrc-fchip-more"
              onClick={onOpenMore}
              aria-label="مزيد من الفلاتر"
              title="مزيد من الفلاتر"
            >
              <span className="ymrc-fchip-ring" style={{ background: 'linear-gradient(135deg,#555,#222)' }} aria-hidden />
              <span className="ymrc-fchip-circle">
                <span className="ymrc-fchip-fallback" style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
              </span>
              <span className="ymrc-fchip-label">المزيد</span>
            </button>
          </div>
        ) : null}
      </div>

      <style>{`
        .ymrc-fcar {
          position: relative;
          width: 100%;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          direction: rtl;
          pointer-events: auto;
        }
        .ymrc-fcar-scroll {
          display: flex;
          flex-direction: row-reverse;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 6px 14px 8px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .ymrc-fcar-scroll::-webkit-scrollbar { display: none; }
        .ymrc-fcar-cell {
          flex: 0 0 auto;
          scroll-snap-align: center;
        }
        .ymrc-fcar-fade {
          position: absolute;
          top: 0; bottom: 0;
          width: 32px;
          pointer-events: none;
          z-index: 2;
        }
        .ymrc-fcar-fade-r {
          right: 0;
          background: linear-gradient(270deg, rgba(0,0,0,0.55), transparent);
        }
        .ymrc-fcar-fade-l {
          left: 0;
          background: linear-gradient(90deg, rgba(0,0,0,0.55), transparent);
        }
        .ymrc-fchip {
          appearance: none;
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          display: grid;
          justify-items: center;
          gap: 6px;
          color: #fff;
          transition: transform 140ms ease;
        }
        .ymrc-fchip:hover { transform: translateY(-1px); }
        .ymrc-fchip-ring {
          display: none;
        }
        .ymrc-fchip-circle {
          position: relative;
          width: 52px; height: 52px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,0.18);
          background: #1a1a22;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          transition: width 160ms ease, height 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .ymrc-fchip.is-active .ymrc-fchip-circle {
          width: 64px; height: 64px;
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.35), 0 6px 18px rgba(255,255,255,0.18);
          transform: translateY(-2px);
        }
        .ymrc-fchip-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #0a0a14;
        }
        .ymrc-fchip-fallback {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 22px;
        }
        .ymrc-fchip-emoji {
          font-size: 20px;
          line-height: 1;
        }
        .ymrc-fchip-emoji.is-overlay {
          position: absolute;
          right: 4px;
          bottom: 4px;
          width: 22px;
          height: 22px;
          background: rgba(0,0,0,0.55);
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 13px;
          backdrop-filter: blur(4px);
        }
        .ymrc-fchip-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.7);
          max-width: 72px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.92;
        }
        .ymrc-fchip.is-active .ymrc-fchip-label {
          opacity: 1;
          color: #fff;
        }
        .ymrc-fchip-more .ymrc-fchip-circle {
          background: rgba(0,0,0,0.55);
          border-color: rgba(255,255,255,0.22);
          backdrop-filter: blur(6px);
        }
      `}</style>
    </div>
  );
}
