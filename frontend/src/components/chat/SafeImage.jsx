import { useState } from 'react';

/**
 * SafeImage
 * --------------------------------------------------------------------------
 * مكوّن صورة مع حماية شاملة من حالات الكسر التي تظهر في الجوال:
 *   - object-fit ثابت يمنع التشويه
 *   - حد أدنى وأقصى للارتفاع
 *   - placeholder للتحميل
 *   - fallback عند الفشل (عنصر بديل قابل للضغط لإعادة المحاولة)
 *   - دعم decoding="async" و loading="lazy"
 *   - حماية من CORS بـ referrerPolicy
 *
 * يستخدم في فقاعات الرسائل (Chat.jsx + GroupChat.jsx + MessageBubble.jsx).
 *
 * Props:
 *   src        : string
 *   alt        : string
 *   onOpen     : () => void   - عند الضغط (لفتح المعاينة الكاملة)
 *   onLongPress: () => void   - تمرير الضغط المطول
 *   maxHeight  : number       - الارتفاع الأقصى (افتراضي 320)
 */
export default function SafeImage({
  src,
  alt = 'صورة',
  onOpen,
  onLongPress,
  maxHeight = 320,
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
        .yam-safe-image {
          position: relative;
          width: 100%;
          max-width: 320px;
          min-height: 80px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
        }
        .yam-safe-image img {
          display: block;
          width: 100%;
          height: auto;
          max-height: inherit;
          object-fit: cover;
          object-position: center;
          /* يمنع الكسر / التشويه في WebView الجوال */
          -webkit-user-drag: none;
          user-select: none;
        }
        .yam-safe-image.loading::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 70%);
          background-size: 200% 100%;
          animation: yam-shimmer 1.2s infinite linear;
        }
        @keyframes yam-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .yam-safe-image .yam-img-fallback {
          padding: 18px 16px;
          display: flex; flex-direction: column; gap: 8px;
          align-items: center; justify-content: center;
          color: #fca5a5;
          font-size: 13px;
          text-align: center;
        }
        .yam-safe-image .yam-img-fallback .icon { font-size: 28px; }
        .yam-safe-image .yam-img-fallback button {
          margin-top: 4px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.4);
          color: #fecaca;
          padding: 6px 14px;
          border-radius: 18px;
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
          crossOrigin="anonymous"
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
