import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * GroupQuickLinks — شريط اختصارات لميزات المجموعة
 * يُعرض داخل GroupChat لينتقل المستخدم بسرعة بين:
 * المنشورات، الأحداث، الاستطلاعات، الإشارات، الوسائط، السجل، الإشعارات.
 */
const GroupQuickLinks = ({ groupId, role = 'member' }) => {
  const navigate = useNavigate();
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

  return (
    <div className="yamg-quicklinks" dir="rtl">
      {links.map((l) => (
        <button
          key={l.to}
          type="button"
          className="yamg-quicklink"
          onClick={() => navigate(l.to)}
        >
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
};

export default GroupQuickLinks;
