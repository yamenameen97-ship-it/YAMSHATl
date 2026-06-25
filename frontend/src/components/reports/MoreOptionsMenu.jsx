/**
 * قائمة الثلاث نقاط (•••) الموحّدة لكل أنواع المحتوى:
 * المنشورات، الريلز، الستوري، التعليقات، الرسائل، المجموعات، الملفات الشخصية.
 *
 * تحتوي على: حفظ / نسخ الرابط / مشاركة / كتم / حظر / إبلاغ / حذف (للمالك).
 *
 * Usage:
 *   <MoreOptionsMenu
 *     targetType="post"
 *     targetId={post.id}
 *     targetLabel={`منشور ${post.username}`}
 *     isOwner={post.user_id === currentUser.id}
 *     onDelete={() => deletePost(post.id)}
 *     onShare={() => sharePost(post)}
 *     onCopyLink={() => copyLink(post)}
 *     onMute={() => muteUser(post.user_id)}
 *     onBlock={() => blockUser(post.user_id)}
 *   />
 */
import React, { useState, useRef, useEffect } from 'react';
import ReportModal from './ReportModal.jsx';

export default function MoreOptionsMenu({
  targetType,
  targetId,
  targetLabel = '',
  isOwner = false,
  onDelete,
  onShare,
  onCopyLink,
  onSave,
  onMute,
  onBlock,
  onEdit,
  extraItems = [],
  buttonStyle = {},
  iconColor = '#fff',
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  // ✅ v59.13.15 FIX #5: مرجع لعناصر القائمة لدعم تركيز تلقائي + أسهم تنقّل WAI-ARIA menu
  const menuRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // ✅ v59.13.13 FIX #1: إغلاق عند النقر/اللمس خارجاً + ESC + إعادة التركيز للزر
  useEffect(() => {
    if (!openMenu) return undefined;
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpenMenu(false);
        // إعادة التركيز إلى زر الـ trigger ليُعرَف للمستخدم بلوحة المفاتيح
        try { triggerRef.current?.focus?.(); } catch { /* ignore */ }
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  // ✅ v59.13.15 FIX #5: عند فتح القائمة، ركّز على أول عنصر (WAI-ARIA menu pattern)
  useEffect(() => {
    if (!openMenu) { setActiveIdx(0); return; }
    const t = window.setTimeout(() => {
      const root = menuRef.current;
      if (!root) return;
      const first = root.querySelector('[role="menuitem"]');
      try { first?.focus?.(); } catch { /* ignore */ }
      setActiveIdx(0);
    }, 20);
    return () => window.clearTimeout(t);
  }, [openMenu]);

  const items = [];

  if (onSave) items.push({ icon: '🔖', label: 'حفظ', onClick: onSave });
  if (onCopyLink) items.push({ icon: '🔗', label: 'نسخ الرابط', onClick: onCopyLink });
  if (onShare) items.push({ icon: '↗️', label: 'مشاركة', onClick: onShare });

  // عناصر إضافية مخصصة
  extraItems.forEach((it) => items.push(it));

  if (!isOwner && onMute)
    items.push({ icon: '🔇', label: 'كتم هذا الحساب', onClick: onMute });
  if (!isOwner && onBlock)
    items.push({ icon: '🚫', label: 'حظر هذا الحساب', onClick: onBlock, danger: true });

  // زر الإبلاغ — يظهر دائماً لغير المالك
  if (!isOwner) {
    items.push({
      icon: '🚨',
      label: 'إبلاغ',
      onClick: () => {
        setOpenMenu(false);
        setOpenReport(true);
      },
      danger: true,
    });
  }

  // للمالك
  if (isOwner && onEdit) items.push({ icon: '✏️', label: 'تعديل', onClick: onEdit });
  if (isOwner && onDelete)
    items.push({ icon: '🗑️', label: 'حذف', onClick: onDelete, danger: true });

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-block' }}
      dir="rtl"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="المزيد"
        aria-haspopup="menu"
        aria-expanded={openMenu}
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenu((v) => !v);
        }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 8, borderRadius: 999, color: iconColor,
          fontSize: 20, lineHeight: 1, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          ...buttonStyle,
        }}
      >
        •••
      </button>

      {openMenu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="خيارات إضافية"
          aria-orientation="vertical"
          onKeyDown={(e) => {
            // ✅ v59.13.15 FIX #5: تنقّل أسهم اللوحة داخل القائمة حسب WAI-ARIA menu pattern
            const root = menuRef.current;
            if (!root) return;
            const itemEls = Array.from(root.querySelectorAll('[role="menuitem"]'));
            if (!itemEls.length) return;
            const curIdx = itemEls.indexOf(document.activeElement);
            let nextIdx = curIdx < 0 ? 0 : curIdx;
            if (e.key === 'ArrowDown') nextIdx = (curIdx + 1) % itemEls.length;
            else if (e.key === 'ArrowUp') nextIdx = (curIdx - 1 + itemEls.length) % itemEls.length;
            else if (e.key === 'Home') nextIdx = 0;
            else if (e.key === 'End') nextIdx = itemEls.length - 1;
            else return;
            e.preventDefault();
            e.stopPropagation();
            try { itemEls[nextIdx]?.focus(); } catch { /* ignore */ }
            setActiveIdx(nextIdx);
          }}
          style={{
            position: 'absolute', top: '100%', insetInlineEnd: 0,
            marginTop: 6, minWidth: 220, zIndex: 1000,
            background: 'linear-gradient(180deg,#1e1b3a,#14122a)',
            border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: 14, padding: 6,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
            color: '#fff',
          }}
        >
          {items.length === 0 && (
            <div style={{ padding: 10, fontSize: 13, opacity: 0.6 }}>
              لا توجد خيارات متاحة
            </div>
          )}
          {items.map((it, i) => (
            <button
              key={`${it.label}-${i}`}
              type="button"
              role="menuitem"
              // ✅ v59.13.15 FIX #5: roving tabindex — فقط العنصر النشط في Tab order
              tabIndex={activeIdx === i ? 0 : -1}
              onFocus={() => setActiveIdx(i)}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(false);
                it.onClick?.();
              }}
              style={{
                width: '100%', textAlign: 'start',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: activeIdx === i ? 'rgba(124,58,237,0.18)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: it.danger ? '#fca5a5' : '#fff',
                fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124,58,237,0.18)';
                setActiveIdx(i);
              }}
              onMouseLeave={(e) => {
                if (activeIdx !== i) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 18 }} aria-hidden="true">{it.icon}</span>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}

      <ReportModal
        open={openReport}
        onClose={() => setOpenReport(false)}
        targetType={targetType}
        targetId={targetId}
        targetLabel={targetLabel}
      />
    </div>
  );
}
