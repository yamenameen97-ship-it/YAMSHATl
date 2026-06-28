import { useEffect, useRef, useState, useLayoutEffect } from 'react';

/**
 * MessageContextPopup (v60)
 * --------------------------------------------------------------------------
 * قائمة منبثقة موحّدة لأوامر الرسالة على الجوال - تطابق التصميم المرجعي:
 *
 *  ┌───────────────────────────────────────┐
 *  │  ❤️  😂  😮  😢  👍   +              │  ← شريط الإيموجي
 *  ├───────────────────────────────────────┤
 *  │  رد   نسخ   تعديل   حذف   المزيد  │  ← شريط الأوامر الأفقي
 *  └───────────────────────────────────────┘
 *           │
 *           ▼
 *  ┌─────────────────────────────┐
 *  │  تعديل لدى الجميع    ✏️    │   ← القائمة الفرعية للمزيد
 *  │  تعديل لدي           ✏️    │
 *  │  حذف لدى الجميع      🗑    │
 *  │  حذف لدي             🗑    │
 *  └─────────────────────────────┘
 *
 * Props:
 *   anchorRect : DOMRect | null  — موقع الرسالة المحددة
 *   isMe       : boolean         — هل الرسالة من المرسل (لتحديد الأذونات)
 *   message    : object          — كائن الرسالة الكامل
 *   onClose    : () => void
 *   onReact    : (emoji) => void
 *   onReply    : () => void
 *   onCopy     : () => void
 *   onEdit     : () => void
 *   onDelete   : () => void
 *   onDeleteForMe : () => void
 *   onDeleteForEveryone : () => void
 */

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '👍'];

export default function MessageContextPopup({
  anchorRect,
  isMe = false,
  message,
  onClose,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onResend,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone,
}) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, submenuTop: 0, submenuLeft: 0 });
  const popupRef = useRef(null);
  const submenuRef = useRef(null);
  const moreBtnRef = useRef(null);

  // حساب موضع القائمة المنبثقة بناءً على موقع الرسالة
  useLayoutEffect(() => {
    if (!anchorRect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const POPUP_WIDTH = Math.min(vw - 24, 340);
    const POPUP_HEIGHT = 130; // تقدير الارتفاع

    // افتراضياً: ضع القائمة فوق الرسالة
    let top = anchorRect.top - POPUP_HEIGHT - 8;
    if (top < 70) {
      // لا توجد مساحة في الأعلى → ضعها تحت الرسالة
      top = anchorRect.bottom + 8;
    }

    // المحاذاة الأفقية: لتطابق RTL، نحاذي الرسالة
    let left = anchorRect.left + (anchorRect.width / 2) - (POPUP_WIDTH / 2);
    left = Math.max(12, Math.min(left, vw - POPUP_WIDTH - 12));

    setPosition((prev) => ({ ...prev, top, left }));
  }, [anchorRect]);

  // إغلاق عند النقر خارج القائمة
  useEffect(() => {
    const handler = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        (!submenuRef.current || !submenuRef.current.contains(e.target))
      ) {
        onClose?.();
      }
    };
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    // تأخير صغير لتجنّب الإغلاق الفوري بسبب نفس النقرة التي فتحت القائمة
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler);
      document.addEventListener('keydown', esc);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  const handleEmojiClick = (emoji) => {
    onReact?.(emoji);
    onClose?.();
  };

  const handleAction = (fn) => () => {
    fn?.();
    onClose?.();
  };

  const toggleSubmenu = () => {
    if (!showSubmenu && moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const SUBMENU_WIDTH = 220;
      let subLeft = rect.right - SUBMENU_WIDTH;
      subLeft = Math.max(12, Math.min(subLeft, vw - SUBMENU_WIDTH - 12));
      setPosition((p) => ({
        ...p,
        submenuTop: rect.bottom + 6,
        submenuLeft: subLeft,
      }));
    }
    setShowSubmenu((v) => !v);
  };

  return (
    <>
      {/* الـ overlay للخلفية */}
      <div className="yam-msg-overlay" onClick={() => onClose?.()} />

      {/* الحاوية الرئيسية: إيموجي + شريط أوامر */}
      <div
        ref={popupRef}
        className="yam-msg-popup-container"
        dir="rtl"
        role="dialog"
        aria-label="خيارات الرسالة"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontFamily: "'Noto Sans Arabic', 'Cairo', sans-serif",
          animation: 'ymPopIn 0.16s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* شريط الإيموجي السريع */}
        <div
          className="yam-reaction-picker v60"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: '#1F2230',
            borderRadius: 999,
            boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            gap: 2,
          }}
        >
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="emoji-btn"
              onClick={() => handleEmojiClick(e)}
              aria-label={`تفاعل ${e}`}
              style={{
                width: 40,
                height: 40,
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {e}
            </button>
          ))}
          <button
            type="button"
            className="more-btn"
            onClick={() => handleEmojiClick('🎉')}
            aria-label="المزيد من الإيموجي"
            style={{
              width: 32,
              height: 32,
              background: '#2a2d3e',
              color: '#d1d5db',
              border: 'none',
              borderRadius: '50%',
              fontSize: 20,
              cursor: 'pointer',
              marginInlineStart: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>

        {/* شريط الأوامر: رد، نسخ، تعديل، حذف، المزيد */}
        <div className="yam-msg-action-bar">
          <button type="button" className="ym-action-btn" onClick={handleAction(onReply)}>
            <span className="icon" aria-hidden="true">↩</span>
            <span className="label">رد</span>
          </button>
          <button type="button" className="ym-action-btn" onClick={handleAction(onCopy)}>
            <span className="icon" aria-hidden="true">⎘</span>
            <span className="label">نسخ</span>
          </button>
          {isMe ? (
            <button type="button" className="ym-action-btn" onClick={handleAction(onEdit)}>
              <span className="icon" aria-hidden="true">✎</span>
              <span className="label">تعديل</span>
            </button>
          ) : null}
          {isMe && onResend ? (
            <button type="button" className="ym-action-btn" onClick={handleAction(onResend)}>
              <span className="icon" aria-hidden="true">↻</span>
              <span className="label">إعادة إرسال</span>
            </button>
          ) : null}
          <button type="button" className="ym-action-btn" onClick={handleAction(onDelete || onDeleteForMe)}>
            <span className="icon" aria-hidden="true">🗑</span>
            <span className="label">حذف</span>
          </button>
          <button
            ref={moreBtnRef}
            type="button"
            className="ym-action-btn"
            onClick={(e) => { e.stopPropagation(); toggleSubmenu(); }}
            aria-expanded={showSubmenu}
          >
            <span className="icon" aria-hidden="true">⋯</span>
            <span className="label">المزيد</span>
          </button>
        </div>
      </div>

      {/* القائمة الفرعية المنسدلة */}
      {showSubmenu ? (
        <div
          ref={submenuRef}
          className="yam-msg-submenu"
          dir="rtl"
          role="menu"
          style={{
            top: `${position.submenuTop}px`,
            left: `${position.submenuLeft}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isMe ? (
            <button type="button" role="menuitem" onClick={handleAction(onEdit)}>
              <span>تعديل لدى الجميع</span>
              <span className="icon" aria-hidden="true">✎</span>
            </button>
          ) : null}
          {isMe ? (
            <button type="button" role="menuitem" onClick={handleAction(onEdit)}>
              <span>تعديل لدي</span>
              <span className="icon" aria-hidden="true">✎</span>
            </button>
          ) : null}
          {isMe && onResend ? (
            <button type="button" role="menuitem" onClick={handleAction(onResend)}>
              <span>إعادة إرسال</span>
              <span className="icon" aria-hidden="true">↻</span>
            </button>
          ) : null}
          {isMe ? (
            <button type="button" role="menuitem" className="danger" onClick={handleAction(onDeleteForEveryone)}>
              <span>حذف لدى الجميع</span>
              <span className="icon" aria-hidden="true">🗑</span>
            </button>
          ) : null}
          <button type="button" role="menuitem" className="danger" onClick={handleAction(onDeleteForMe)}>
            <span>حذف لدي</span>
            <span className="icon" aria-hidden="true">🗑</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
