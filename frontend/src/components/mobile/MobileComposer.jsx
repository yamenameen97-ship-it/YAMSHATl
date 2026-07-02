import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * MobileComposer (v73 — DEFINITIVE ROOT FIX)
 * --------------------------------------------------------------------------
 * 🔥 v73 يحل المشكلة المزمنة جذرياً عبر CSS Grid على الحاوية الأم
 * (.yam-home-mobile-page) — الأبناء يأخذون 100% تلقائياً بفضل
 * justify-items: stretch، بدون أي معركة specificity.
 *
 * هذا الملف:
 *   ✅ أزال inline-style guard القديم (wrapInlineGuard) الذي كان
 *      يفرض marginInline سالب — لم يعد ضرورياً لأن v60.9 تم تفريغه.
 *   ✅ أزال <style>{`...`}</style> المضمن الذي كان يكرر قواعد
 *      تتعارض مع v73. كل الستايل الآن مركزي في v73 CSS.
 *   ✅ أبقى فقط على الستايل الداخلي للأيقونات والأزرار (الذي
 *      لا يتعارض مع v73).
 *
 * الترتيب البصري RTL على الشاشة (يمين → يسار):
 *   |  ☺  GIF  🖼️                      بماذا تفكر؟   Y  |
 *   |(يسار: أيقونات الوسائط)           (يمين: نص+أفاتار) |
 */
function MobileComposer({ onFocus, onMedia, onGif, onEmoji }) {
  const navigate = useNavigate();

  const open = (action) => {
    if (onFocus) {
      onFocus(action);
      return;
    }
    const tab = action === 'image' ? 'photo'
      : action === 'video' ? 'reel'
      : 'post';
    navigate(`/compose?tab=${tab}`);
  };

  /* ⭐ v78 RTL FULL-BLEED ROOT FIX: تم إفراغ الـ inline-style
     تماماً — كل الأحجام والمواقع تُعرَّف الآن في
     yamshat-fixes-v78-RTL-FULLBLEED-ROOT.css عبر تقنية
     Full-Bleed: width:100vw + margin-inline: calc(50% - 50vw).
     أي inline hint يتعارض مع الحل، لذا نتركه فارغاً.
     نُبقي فقط dir + fontFamily لضمان RTL على مستوى العنصر. */
  const wrapInlineGuard = {
    /* فارغ عمداً — v78 يعتمد على CSS خارجي بالكامل */
  };

  /* ⭐ v78: inline guard للـ .ym-composer الداخلي
     نُبقي فقط ما لا يتعارض مع Full-Bleed للأب.
     لا left/right فيزيائي، لا width بقيمة صريحة. */
  const composerInlineGuard = {
    /* فارغ — v78 CSS يدير كل شيء */
  };

  return (
    <div className="ym-composer-wrap" dir="rtl" style={wrapInlineGuard}>
      <div
        className="ym-composer"
        role="button"
        tabIndex={0}
        dir="rtl"
        style={composerInlineGuard}
        onClick={() => open(null)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(null)}
      >
        {/* === Avatar شعار Y === */}
        <span className="ym-composer-avatar" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="ym-cmp-grad" x1="0" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
            </defs>
            <line x1="22" y1="20" x2="50" y2="55" stroke="url(#ym-cmp-grad)" strokeWidth="12" strokeLinecap="round" />
            <line x1="78" y1="20" x2="50" y2="55" stroke="url(#ym-cmp-grad)" strokeWidth="12" strokeLinecap="round" />
            <line x1="50" y1="55" x2="50" y2="85" stroke="url(#ym-cmp-grad)" strokeWidth="12" strokeLinecap="round" />
          </svg>
        </span>

        {/* === نص الـ placeholder === */}
        <span
          className="ym-composer-input"
          aria-label="بماذا تفكر؟"
          dir="rtl"
          onClick={(e) => { e.stopPropagation(); open(null); }}
        >
          بماذا تفكر؟
        </span>

        {/* === أزرار الأكشن === */}
        <div
          className="ym-composer-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="ym-composer-action ym-composer-action-media"
            aria-label="إضافة صورة"
            title="صورة"
            onClick={() => (onMedia ? onMedia() : open('image'))}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.4" fill="currentColor" stroke="none" />
              <path d="M21 17 L15 11 L5 19" />
            </svg>
          </button>
          <button
            type="button"
            className="ym-composer-action ym-composer-action-gif"
            aria-label="إضافة GIF"
            title="GIF"
            onClick={() => (onGif ? onGif() : open('gif'))}
          >
            <span className="ym-gif-pill">GIF</span>
          </button>
          <button
            type="button"
            className="ym-composer-action ym-composer-action-emoji"
            aria-label="إضافة إيموجي"
            title="إيموجي"
            onClick={() => (onEmoji ? onEmoji() : open('emoji'))}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
              <path d="M8 14.5 C9.5 16.5, 14.5 16.5, 16 14.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ⭐ v73 — Internal styles محدودة فقط للعناصر الداخلية
          (الأفاتار، الأزرار، البيل) التي لا تتعارض مع v73 CSS.
          القواعد الخاصة بـ .ym-composer-wrap و .ym-composer
          (العرض، الـ sticky، الـ padding) كلها مركزية في v73. */}
      <style>{`
        .ym-composer-wrap .ym-composer {
          background: #14172a;
          border: 1px solid #1F2937;
          border-radius: 14px;
          padding: 7px 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          overflow: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        }
        .ym-composer-wrap .ym-composer:hover {
          border-color: rgba(139,92,246,0.45);
        }
        .ym-composer-wrap .ym-composer:focus { outline: none; }
        .ym-composer-wrap .ym-composer:focus-visible {
          border-color: #A78BFA;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.35);
        }
        .ym-composer-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1F2937;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          flex-grow: 0;
          border: 1px solid rgba(139,92,246,0.4);
          padding: 4px;
          box-sizing: border-box;
        }
        .ym-composer-input {
          flex: 1 1 auto;
          background: transparent;
          border: none;
          outline: none;
          color: #6B7280;
          font-size: 0.86rem;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          min-width: 0;
          padding: 4px 6px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: right;
          direction: rtl;
        }
        .ym-composer-actions {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          flex-grow: 0;
        }
        .ym-composer-action {
          background: none;
          border: none;
          color: #9CA3AF;
          padding: 5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
          min-width: 28px;
          min-height: 28px;
        }
        .ym-composer-action svg {
          width: 19px;
          height: 19px;
          display: block;
        }
        .ym-composer-action:hover {
          background: rgba(139, 92, 246, 0.12);
          color: #C4B5FD;
        }
        .ym-composer-action:active { transform: scale(0.93); }
        .ym-composer-action:focus { outline: none; }
        .ym-composer-action:focus-visible {
          outline: 2px solid #A78BFA;
          outline-offset: 2px;
          color: #C4B5FD;
          background: rgba(139, 92, 246, 0.15);
        }
        .ym-gif-pill {
          font-weight: 700;
          font-size: 0.66rem;
          letter-spacing: 0.5px;
          padding: 1.5px 4px;
          border: 1.5px solid currentColor;
          border-radius: 4px;
          line-height: 1;
          display: inline-block;
        }

        @media (max-width: 400px) {
          .ym-composer-wrap .ym-composer { gap: 6px; padding: 6px 8px; border-radius: 12px; }
          .ym-composer-avatar { width: 30px; height: 30px; padding: 3px; }
          .ym-composer-input { font-size: 0.82rem; padding: 3px 5px; }
          .ym-composer-actions { gap: 3px; }
          .ym-composer-action { padding: 4px; min-width: 26px; min-height: 26px; }
          .ym-composer-action svg { width: 18px; height: 18px; }
          .ym-gif-pill { font-size: 0.62rem; padding: 1px 3px; }
        }
        @media (max-width: 360px) {
          .ym-composer-wrap .ym-composer { gap: 5px; padding: 5px 7px; }
          .ym-composer-avatar { width: 28px; height: 28px; padding: 3px; }
          .ym-composer-input { font-size: 0.76rem; padding: 3px 4px; }
          .ym-composer-actions { gap: 2px; }
          .ym-composer-action { padding: 3px; min-width: 24px; min-height: 24px; }
          .ym-composer-action svg { width: 16px; height: 16px; }
          .ym-gif-pill { font-size: 0.58rem; padding: 1px 3px; }
        }
        @media (max-width: 320px) {
          .ym-composer-wrap .ym-composer { gap: 3px; padding: 4px 5px; border-radius: 10px; }
          .ym-composer-avatar { width: 24px; height: 24px; padding: 2px; }
          .ym-composer-input { font-size: 0.66rem; padding: 2px 3px; }
          .ym-composer-actions { gap: 1px; }
          .ym-composer-action { padding: 2px; min-width: 20px; min-height: 20px; }
          .ym-composer-action svg { width: 13px; height: 13px; }
          .ym-gif-pill { font-size: 0.5rem; padding: 1px 2px; border-width: 1px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ym-composer-wrap .ym-composer,
          .ym-composer-action {
            transition: none !important;
          }
          .ym-composer-action:active { transform: none !important; }
        }
      `}</style>
    </div>
  );
}

export default memo(MobileComposer);
