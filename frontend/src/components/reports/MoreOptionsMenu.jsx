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

  // إغلاق عند النقر خارجاً
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    }
    if (openMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
        type="button"
        aria-label="المزيد"
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
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(false);
                it.onClick?.();
              }}
              style={{
                width: '100%', textAlign: 'start',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: it.danger ? '#fca5a5' : '#fff',
                fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(124,58,237,0.18)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <span style={{ fontSize: 18 }}>{it.icon}</span>
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
