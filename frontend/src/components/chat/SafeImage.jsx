import { useState } from 'react';

/**
 * SafeImage
 * --------------------------------------------------------------------------
 * ✅ v87.6 REDESIGN — عرض الصور في الدردشة مثل WhatsApp تماماً:
 *   • الحاوية تتقلص لحجم الصورة (لا حواف/خلفية زائدة)
 *   • min-height ديناميكي فقط أثناء التحميل، صفر بعد النجاح
 *   • max-width ذكي (min(280px, 68vw)) لملاءمة الجوال والكمبيوتر
 *   • loading placeholder صغير ومضغوط أثناء التحميل فقط
 *   • decoding=async + loading=lazy لأداء أفضل
 *   • fallback واضح عند فشل التحميل مع زر إعادة المحاولة
 *
 * Props:
 *   src, alt, onOpen, onLongPress, maxHeight (default 340), className
 */
export default function SafeImage({
  src,
  alt = 'صورة',
  onOpen,
  onLongPress,
  maxHeight = 340,
  className = '',
}) {
  const [state, setState] = useState('loading'); // loading | ok | error
  const [retryKey, setRetryKey] = useState(0);

  const handleLoad = () => setState('ok');
  const handleError = () => setState('error');

  const handleRetry = (e) => {
    e.stopPropagation();
    setState('loading');
    setRetryKey((k) => k + 1);
  };

  // Long-press handling (touch + mouse)
  let pressTimer = null;
  const startPress = () => {
    if (!onLongPress) return;
    pressTimer = setTimeout(() => onLongPress(), 500);
  };
  const endPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  return (
    <div
      className={`yam-safe-image ${state} ${className}`}
      dir="rtl"
      style={{ maxHeight: `${maxHeight}px` }}
      onClick={() => state === 'ok' && onOpen?.()}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      role="button"
      tabIndex={0}
    >
      <style>{`
        /* ✅ v87.6: حاوية تتقلص لحجم الصورة تماماً (مثل واتساب) — بدون أي حواف زائدة */
        .yam-safe-image {
          position: relative;
          display: block;
          width: auto;
          max-width: min(280px, 68vw);
          min-width: 0;
          min-height: 0;
          height: auto;
          border-radius: 12px;
          overflow: hidden;
          background: transparent;
          padding: 0;
          margin: 0;
          line-height: 0;
          cursor: pointer;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
        }
        /* أثناء التحميل فقط: مربع مؤقت خفيف — سيختفي عند 'ok' */
        .yam-safe-image.loading {
          min-width: 160px;
          min-height: 120px;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .yam-safe-image.ok {
          background: transparent;
          min-width: 0;
          min-height: 0;
        }
        .yam-safe-image.error {
          min-width: 160px;
          min-height: 90px;
          background: rgba(239,68,68,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .yam-safe-image img {
          display: block;
          width: 100%;
          max-width: 100%;
          height: auto;
          max-height: inherit;
          object-fit: cover;
          object-position: center;
          border-radius: 12px;
          -webkit-user-drag: none;
          user-select: none;
        }
        .yam-safe-image.loading::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 70%);
          background-size: 200% 100%;
          animation: yam-shimmer 1.2s infinite linear;
          border-radius: 12px;
          pointer-events: none;
        }
        @keyframes yam-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .yam-safe-image .yam-img-fallback {
          padding: 14px 12px;
          display: flex; flex-direction: column; gap: 6px;
          align-items: center; justify-content: center;
          color: #fca5a5;
          font-size: 13px;
          text-align: center;
          line-height: 1.35;
        }
        .yam-safe-image .yam-img-fallback .icon { font-size: 24px; }
        .yam-safe-image .yam-img-fallback button {
          margin-top: 4px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.4);
          color: #fecaca;
          padding: 5px 12px;
          border-radius: 16px;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .yam-safe-image .yam-img-fallback button:hover {
          background: rgba(239,68,68,0.25);
        }
      `}</style>

      {state !== 'error' ? (
        <img
          key={retryKey}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          draggable={false}
        />
      ) : (
        <div className="yam-img-fallback" dir="rtl">
          <span className="icon" aria-hidden="true">🖼️</span>
          <span>تعذّر تحميل الصورة</span>
          <button type="button" onClick={handleRetry}>إعادة المحاولة</button>
        </div>
      )}
    </div>
  );
}
