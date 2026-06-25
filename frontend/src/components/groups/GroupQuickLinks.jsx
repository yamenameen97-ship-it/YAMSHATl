import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * GroupQuickLinks — شريط اختصارات لميزات المجموعة
 * يُعرض داخل GroupChat لينتقل المستخدم بسرعة بين:
 * المنشورات، الأحداث، الاستطلاعات، الإشارات، الوسائط، السجل، الإشعارات.
 *
 * ✅ v59.13.14 FIX #3:
 *  - الإيموجي صار `aria-hidden="true"` حتى لا تنطقها قارئات الشاشة بشكل مزعج.
 *  - كل زر صار له `aria-label` صريح بالنص العربي بدل قراءة الإيموجي + النص.
 *  - تمييز الرابط النشط بصرياً وعبر `aria-current="page"` بناءً على المسار الحالي.
 *  - دعم Arrow keys (يمين/يسار/أعلى/أسفل) للتنقل بين الأزرار داخل الشريط.
 *  - إضافة `data-testid` و `dir="rtl"` على كل زر لاتساق RTL.
 */
const GroupQuickLinks = ({ groupId, role = 'member' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = role === 'owner' || role === 'admin';

  const links = [
    { to: `/groups/${groupId}/posts`,         icon: '📝', label: 'المنشورات' },
    { to: `/groups/${groupId}/events`,        icon: '📅', label: 'الأحداث' },
    { to: `/groups/${groupId}/polls`,         icon: '📊', label: 'الاستطلاعات' },
    { to: `/groups/${groupId}/mentions`,      icon: '@',  label: 'الإشارات' },
    { to: `/groups/${groupId}/media`,         icon: '🖼️', label: 'الوسائط' },
    ...(isAdmin ? [{ to: `/groups/${groupId}/audit`, icon: '📜', label: 'سجل التدقيق' }] : []),
    { to: `/groups/${groupId}/notifications`, icon: '🔔', label: 'الإشعارات' },
  ];

  // ✅ v59.13.14 FIX #3: تنقل بأسهم لوحة المفاتيح بين أزرار الشريط
  const handleKey = (e, idx) => {
    const isRTL = (e.currentTarget.closest('[dir="rtl"]') || document.documentElement).getAttribute('dir') === 'rtl';
    const next = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const prev = isRTL ? 'ArrowRight' : 'ArrowLeft';
    let target = -1;
    if (e.key === next || e.key === 'ArrowDown') target = (idx + 1) % links.length;
    else if (e.key === prev || e.key === 'ArrowUp') target = (idx - 1 + links.length) % links.length;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = links.length - 1;
    if (target >= 0) {
      e.preventDefault();
      const root = e.currentTarget.parentElement;
      const btns = root?.querySelectorAll('.yamg-quicklink');
      if (btns && btns[target]) {
        try { btns[target].focus(); } catch { /* ignore */ }
      }
    }
  };

  return (
    <div className="yamg-quicklinks" dir="rtl" role="navigation" aria-label="اختصارات أقسام المجموعة">
      {links.map((l, idx) => {
        const isActive = location?.pathname === l.to;
        return (
          <button
            key={l.to}
            type="button"
            className={`yamg-quicklink${isActive ? ' is-active' : ''}`}
            onClick={() => navigate(l.to)}
            onKeyDown={(e) => handleKey(e, idx)}
            aria-label={l.label}
            aria-current={isActive ? 'page' : undefined}
            data-testid={`group-quicklink-${l.to.split('/').pop()}`}
            style={isActive ? {
              outline: '2px solid rgba(139, 92, 246, 0.6)',
              outlineOffset: 1,
              borderRadius: 10,
            } : undefined}
          >
            <span aria-hidden="true">{l.icon}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default GroupQuickLinks;
