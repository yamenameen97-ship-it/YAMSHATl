import { memo } from 'react';

/**
 * MobileComposer (v47)
 * --------------------
 * صندوق "بماذا تفكر؟" — يطابق الصورة المرجعية:
 *   - أيقونة Y بنفسجية على اليمين
 *   - حقل نص للمكان المخصص لكتابة المنشور (يفتح المُنشئ الكامل عند الضغط)
 *   - أزرار: صورة، GIF، إيموجي على اليسار
 *
 * الأبعاد والمسافات مُحسّنة للأجهزة القديمة (Redmi Note 8 ≈ 360px)
 * بحيث يبقى الصندوق متوسطاً وغير خارج عن حدود الشاشة.
 */
function MobileComposer({ onFocus, onMedia, onGif, onEmoji }) {
  const open = (action) => {
    if (onFocus) {
      onFocus(action);
      return;
    }
    // fallback: حدث عام يستمع له FeedMobile
    window.dispatchEvent(new CustomEvent('yamshat:open-composer', { detail: { action } }));
  };

  return (
    <div className="ym-composer-wrap" dir="rtl">
      <div
        className="ym-composer"
        role="button"
        tabIndex={0}
        onClick={() => open(null)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(null)}
      >
        <span className="ym-composer-avatar" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="22" height="22">
            <defs>
              <linearGradient id="ym-cmp-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <path d="M20 20 L50 60 L80 20 L70 20 L50 45 L30 20 Z" fill="url(#ym-cmp-grad)" />
            <path d="M45 60 L55 60 L55 85 L45 85 Z" fill="url(#ym-cmp-grad)" />
          </svg>
        </span>

        <input
          className="ym-composer-input"
          placeholder="بماذا تفكر؟"
          readOnly
          aria-label="بماذا تفكر؟"
          onFocus={(e) => { e.target.blur(); open(null); }}
        />

        <div className="ym-composer-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ym-composer-action"
            aria-label="إضافة صورة"
            title="صورة"
            onClick={() => (onMedia ? onMedia() : open('image'))}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" fill="none" strokeWidth="1.8" />
              <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
              <path d="M21 17 L15 11 L5 19" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="ym-composer-action"
            aria-label="إضافة GIF"
            title="GIF"
            onClick={() => (onGif ? onGif() : open('gif'))}
          >
            <span className="ym-gif-pill">GIF</span>
          </button>
          <button
            type="button"
            className="ym-composer-action"
            aria-label="إضافة إيموجي"
            title="إيموجي"
            onClick={() => (onEmoji ? onEmoji() : open('emoji'))}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="1.8" />
              <circle cx="9" cy="10" r="1.2" fill="currentColor" />
              <circle cx="15" cy="10" r="1.2" fill="currentColor" />
              <path d="M8 14.5 C9.5 16.5, 14.5 16.5, 16 14.5" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .ym-composer-wrap {
          padding: 12px 14px 6px;
          background-color: #0A0D1A;
          box-sizing: border-box;
          max-width: 100%;
        }
        .ym-composer {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #14172a;
          border: 1px solid #1F2937;
          border-radius: 999px;
          padding: 8px 12px 8px 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
          max-width: 100%;
        }
        .ym-composer:hover { border-color: rgba(139,92,246,0.45); }
        .ym-composer-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #1F2937;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(139,92,246,0.35);
        }
        .ym-composer-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #D1D5DB;
          font-size: 0.92rem;
          font-family: inherit;
          min-width: 0;
          padding: 4px 0;
          cursor: pointer;
        }
        .ym-composer-input::placeholder { color: #6B7280; }
        .ym-composer-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .ym-composer-action {
          background: none;
          border: none;
          color: #9CA3AF;
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
        }
        .ym-composer-action:hover {
          background: rgba(139, 92, 246, 0.12);
          color: #C4B5FD;
        }
        .ym-composer-action:active { transform: scale(0.93); }
        .ym-gif-pill {
          font-weight: 800;
          font-size: 0.72rem;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border: 1.5px solid currentColor;
          border-radius: 4px;
          line-height: 1;
        }
        /* === الأجهزة الصغيرة (Redmi Note 8 ≈ 360px) === */
        @media (max-width: 400px) {
          .ym-composer-wrap { padding: 10px 10px 6px; }
          .ym-composer { gap: 6px; padding: 6px 10px 6px 6px; }
          .ym-composer-avatar { width: 30px; height: 30px; }
          .ym-composer-input { font-size: 0.85rem; }
          .ym-composer-actions { gap: 2px; }
          .ym-composer-action { padding: 5px; }
          .ym-composer-action svg { width: 17px; height: 17px; }
          .ym-gif-pill { font-size: 0.66rem; padding: 1.5px 4px; }
        }
        @media (max-width: 340px) {
          .ym-composer-input { font-size: 0.8rem; }
          .ym-composer-action svg { width: 16px; height: 16px; }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileComposer);
