import { memo } from 'react';

/**
 * MobileComposer
 * صندوق "بماذا تفكر؟" — يفتح MobileComposeModal عبر event/onFocus
 * الأزرار (صورة / GIF / إيموجي) تطلق الحدث مع action معيّن لاختيار الملف فوراً.
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
    <div className="ym-composer" role="button" tabIndex={0}
         onClick={() => open(null)}
         onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(null)}>
      <span className="ym-composer-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6 3 L12 12 L18 3 L15 3 L12 7 L9 3 Z M10 12 L14 12 L14 21 L10 21 Z" fill="#fff" />
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
        <button type="button" className="ym-composer-action" aria-label="إضافة صورة"
                onClick={() => (onMedia ? onMedia() : open('image'))}>
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" fill="none" strokeWidth="1.8" />
            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
            <path d="M21 17 L15 11 L5 19" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="ym-composer-action" aria-label="إضافة GIF"
                onClick={() => (onGif ? onGif() : open(null))}>
          <span className="ym-gif-pill">GIF</span>
        </button>
        <button type="button" className="ym-composer-action" aria-label="إضافة إيموجي"
                onClick={() => (onEmoji ? onEmoji() : open('emoji'))}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="1.8" />
            <circle cx="9" cy="10" r="1.2" fill="currentColor" />
            <circle cx="15" cy="10" r="1.2" fill="currentColor" />
            <path d="M8 14.5 C9.5 16.5, 14.5 16.5, 16 14.5" stroke="currentColor" fill="none"
                  strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(MobileComposer);
