import { useEffect, useRef, useState } from 'react';

/**
 * MessageActionsToolbar
 * --------------------------------------------------------------------------
 * يظهر في الـ Header العلوي للدردشة عند تحديد رسالة بالضغط المطول.
 *
 * الأزرار من اليسار لليمين (RTL):
 *   - ×          إلغاء التحديد
 *   - ⤴          إعادة إرسال / Forward
 *   - 🗑          حذف
 *   - ⭐          تمييز
 *   - ↩          رد (Reply)
 *   - ⋮          المزيد (قائمة منسدلة)
 *
 * Props:
 *   selectedMessage  : object | null
 *   onClose          : () => void
 *   onForward        : (msg) => void
 *   onDelete         : (msg) => void
 *   onStar           : (msg) => void
 *   onReply          : (msg) => void
 *   onCopy           : (msg) => void
 *   onPin            : (msg) => void
 *   onInfo           : (msg) => void
 *   onReport         : (msg) => void
 */
export default function MessageActionsToolbar({
  selectedMessage,
  onClose,
  onForward,
  onDelete,
  onStar,
  onReply,
  onCopy,
  onPin,
  onInfo,
  onReport,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  if (!selectedMessage) return null;

  const wrap = (fn) => () => {
    setMenuOpen(false);
    fn?.(selectedMessage);
    onClose?.();
  };

  return (
    <div
      className="yam-msg-actions-toolbar"
      dir="rtl"
      role="toolbar"
      aria-label="إجراءات الرسالة"
    >
      <style>{`
        .yam-msg-actions-toolbar {
          position: absolute; top: 0; inset-inline: 0;
          height: 56px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: #fff;
          display: flex; align-items: center;
          padding: 0 12px;
          gap: 4px;
          z-index: 50;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          animation: yam-slide-down 0.18s ease;
        }
        @keyframes yam-slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        .yam-msg-actions-toolbar .icon-btn {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 19px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .yam-msg-actions-toolbar .icon-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .yam-msg-actions-toolbar .spacer { flex: 1; }
        .yam-msg-actions-toolbar .count-label {
          font-size: 15px; font-weight: 600;
          margin-inline-start: 8px;
        }
        .yam-msg-actions-menu {
          position: absolute;
          top: 56px;
          inset-inline-end: 8px;
          background: #1e293b;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          min-width: 200px;
          padding: 6px;
          z-index: 60;
          animation: yam-pop 0.15s ease;
        }
        @keyframes yam-pop {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .yam-msg-actions-menu button {
          width: 100%;
          text-align: start;
          background: transparent;
          border: none;
          color: #fff;
          padding: 10px 14px;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          display: flex; align-items: center; gap: 10px;
          transition: background 0.12s;
        }
        .yam-msg-actions-menu button:hover { background: rgba(255,255,255,0.08); }
        .yam-msg-actions-menu button .em { font-size: 17px; width: 22px; text-align: center; }
        .yam-msg-actions-menu button.danger { color: #fca5a5; }
        .yam-msg-actions-menu .divider {
          height: 1px; background: rgba(255,255,255,0.08);
          margin: 4px 0;
        }
      `}</style>

      <button
        type="button"
        className="icon-btn"
        onClick={onClose}
        aria-label="إلغاء التحديد"
        title="إلغاء"
      >×</button>

      <span className="count-label">1</span>

      <div className="spacer" />

      <button
        type="button"
        className="icon-btn"
        onClick={wrap(onForward)}
        aria-label="إعادة إرسال"
        title="إعادة إرسال"
      >↪</button>

      <button
        type="button"
        className="icon-btn"
        onClick={wrap(onDelete)}
        aria-label="حذف"
        title="حذف"
      >🗑</button>

      <button
        type="button"
        className="icon-btn"
        onClick={wrap(onStar)}
        aria-label="تمييز"
        title="تمييز"
      >⭐</button>

      <button
        type="button"
        className="icon-btn"
        onClick={wrap(onReply)}
        aria-label="رد"
        title="رد"
      >↩</button>

      <button
        type="button"
        className="icon-btn"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="المزيد"
        aria-expanded={menuOpen}
        title="المزيد"
      >⋮</button>

      {menuOpen ? (
        <div className="yam-msg-actions-menu" ref={menuRef} role="menu" dir="rtl">
          <button type="button" onClick={wrap(onReply)} role="menuitem">
            <span className="em">↩</span> رد
          </button>
          <button type="button" onClick={wrap(onForward)} role="menuitem">
            <span className="em">↪</span> إعادة توجيه
          </button>
          <button type="button" onClick={wrap(onCopy)} role="menuitem">
            <span className="em">📋</span> نسخ
          </button>
          <button type="button" onClick={wrap(onStar)} role="menuitem">
            <span className="em">⭐</span> تمييز بنجمة
          </button>
          <button type="button" onClick={wrap(onPin)} role="menuitem">
            <span className="em">📌</span> تثبيت
          </button>
          <button type="button" onClick={wrap(onInfo)} role="menuitem">
            <span className="em">ⓘ</span> معلومات
          </button>
          <div className="divider" />
          <button type="button" onClick={wrap(onReport)} role="menuitem" className="danger">
            <span className="em">⚠</span> إبلاغ
          </button>
          <button type="button" onClick={wrap(onDelete)} role="menuitem" className="danger">
            <span className="em">🗑</span> حذف
          </button>
        </div>
      ) : null}
    </div>
  );
}
