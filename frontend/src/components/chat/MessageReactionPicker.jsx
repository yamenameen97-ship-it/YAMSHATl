import { useEffect, useRef, useState } from 'react';

/**
 * MessageReactionPicker
 * --------------------------------------------------------------------------
 * شريط إيموجي عائم يظهر فوق الرسالة المحددة (نمط واتساب).
 * يعرض 7 تفاعلات سريعة + زر "+" لفتح لوحة موسّعة.
 *
 * Props:
 *   anchorRect   : DOMRect | null   — إطار الرسالة المحددة (يستخدم لتحديد الموقع)
 *   onPick       : (emoji) => void
 *   onClose      : () => void
 *   onOpenMore   : () => void       — عند الضغط على "+"
 */
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];
const EXTENDED_EMOJIS = [
  '👍','👎','❤️','🔥','😂','😍','😮','😢','😡','🙏',
  '👏','💯','🎉','🤔','😎','😱','🥰','😭','🤣','💔',
  '✨','💪','🙌','👌','✅','❌','⭐','💜','💙','💚',
];

export default function MessageReactionPicker({
  anchorRect,
  onPick,
  onClose,
  onOpenMore,
}) {
  const [showExtended, setShowExtended] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  // الموضع: فوق الرسالة المحددة (مع هامش 12px)
  const top = Math.max(70, anchorRect.top - 60);
  const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - 360));

  return (
    <div
      ref={ref}
      className="yam-reaction-picker"
      dir="rtl"
      role="dialog"
      aria-label="اختر تفاعلاً"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      <style>{`
        .yam-reaction-picker {
          position: fixed;
          background: #1e293b;
          border-radius: 28px;
          padding: 8px 12px;
          display: flex; align-items: center; gap: 4px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          z-index: 70;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          animation: yam-pop-in 0.16s ease;
          max-width: calc(100vw - 24px);
        }
        @keyframes yam-pop-in {
          from { transform: scale(0.6) translateY(8px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        .yam-reaction-picker .emoji-btn {
          background: transparent;
          border: none;
          font-size: 24px;
          width: 38px; height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s, background 0.15s;
          padding: 0;
        }
        .yam-reaction-picker .emoji-btn:hover {
          transform: scale(1.25);
          background: rgba(255,255,255,0.08);
        }
        .yam-reaction-picker .more-btn {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 18px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          margin-inline-start: 4px;
          transition: background 0.15s;
        }
        .yam-reaction-picker .more-btn:hover {
          background: rgba(255,255,255,0.16);
        }

        .yam-reaction-extended {
          position: fixed;
          background: #1e293b;
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.55);
          z-index: 75;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
          max-width: 320px;
        }
        .yam-reaction-extended .emoji-btn {
          background: transparent;
          border: none;
          font-size: 22px;
          width: 40px; height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
          padding: 0;
        }
        .yam-reaction-extended .emoji-btn:hover {
          transform: scale(1.2);
          background: rgba(255,255,255,0.08);
        }
      `}</style>

      {!showExtended ? (
        <>
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="emoji-btn"
              onClick={() => { onPick?.(e); onClose?.(); }}
              aria-label={`تفاعل ${e}`}
            >{e}</button>
          ))}
          <button
            type="button"
            className="more-btn"
            onClick={() => {
              if (onOpenMore) { onOpenMore(); onClose?.(); }
              else setShowExtended(true);
            }}
            aria-label="المزيد من الإيموجي"
          >+</button>
        </>
      ) : (
        <div
          className="yam-reaction-extended"
          dir="rtl"
          style={{ position: 'static', boxShadow: 'none', padding: 0, background: 'transparent' }}
        >
          {EXTENDED_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="emoji-btn"
              onClick={() => { onPick?.(e); onClose?.(); }}
              aria-label={`تفاعل ${e}`}
            >{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}
