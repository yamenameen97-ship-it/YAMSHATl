import React, { useState, useEffect } from 'react';
import { useFollowList } from '../../hooks/useFollow.js';
import FollowButton from './FollowButton.jsx';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * FollowersListModal — مودال لعرض قائمة المتابعين / المتابَعين / الأصدقاء المشتركين.
 *
 * ✅ v59.13.11 FIX #5:
 *   - إصلاح ترميز كل النصوص العربية المعطوبة (mojibake) — كانت تظهر
 *     في الملف الأصلي كرموز مكسورة مثل "ุงู„ู…ุชุงุจุนูˆู†" و "โœ•" بدلاً من
 *     "المتابِعون" و "✕" → كانت تُعرض للمستخدم رموزاً عشوائية غير مفهومة.
 *   - إضافة dir="rtl" + خط Noto Sans Arabic للحاوية والبطاقة.
 *   - إضافة دعم مفتاح Escape لإغلاق المودال (تجربة UX قياسية للمودالات).
 *   - منع تمرير صفحة الخلفية أثناء فتح المودال (body scroll lock).
 *
 * @param {string} username
 * @param {'followers'|'following'|'mutual'} initialTab
 * @param {function} onClose
 */
export default function FollowersListModal({
  username,
  initialTab = 'followers',
  onClose,
  currentUsername,
}) {
  const [tab, setTab] = useState(initialTab);
  const { items, loading, error } = useFollowList(username, tab);

  // ✅ v59.13.11 FIX #5: إغلاق بـ Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ✅ v59.13.11 FIX #5: منع تمرير الخلفية أثناء فتح المودال
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const tabs = [
    { key: 'followers', label: 'المتابِعون' },
    { key: 'following', label: 'المتابَعون' },
    { key: 'mutual',    label: 'أصدقاء مشتركون' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="قائمة المتابعين"
      dir="rtl"
      className="ym-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
      }}
    >
      <div
        className="ym-modal-content"
        dir="rtl"
        style={{
          background: '#0F172A',
          color: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #1F2937',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div style={{ padding: 16, borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{username}</h3>
          <button
            type="button"
            onClick={onClose}
            className="icon-only"
            style={{ background: 'transparent', border: 0, color: '#9CA3AF', fontSize: 22, cursor: 'pointer', fontFamily: 'inherit' }}
            aria-label="إغلاق"
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1F2937' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="no-unify"
              aria-pressed={tab === t.key}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: 'transparent',
                border: 0,
                borderBottom: tab === t.key ? '2px solid #8B5CF6' : '2px solid transparent',
                color: tab === t.key ? '#fff' : '#9CA3AF',
                fontWeight: tab === t.key ? 600 : 500,
                cursor: 'pointer',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>جاري التحميل…</div>
          )}
          {error && !loading && (
            <div style={{ padding: 24, textAlign: 'center', color: '#F87171' }}>تعذّر التحميل</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>لا يوجد</div>
          )}
          {!loading && items.map((user, idx) => {
            const name = user?.username || user?.name || user?.user?.username || `user-${idx}`;
            const avatar = resolveMediaUrl(user?.avatar || user?.user?.avatar || '');
            const isSelf = currentUsername && name === currentUsername;
            return (
              <div key={user?.id || name + idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                  background: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, flexShrink: 0,
                }}>
                  {avatar ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  {user?.bio || user?.tagline ? (
                    <div style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.bio || user.tagline}</div>
                  ) : null}
                </div>
                {!isSelf && (
                  <FollowButton
                    username={name}
                    initialIsFollowing={Boolean(user?.is_following ?? user?.following)}
                    size="small"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
