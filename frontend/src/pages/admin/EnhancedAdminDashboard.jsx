import React from 'react';

/**
 * ⚠️ تم تعطيل EnhancedAdminDashboard لمنع تراكب صفحات لوحة المدير العام.
 * الواجهة المعتمدة الوحيدة الآن هي: src/pages/admin/AdminDashboard.jsx
 * يبقى هذا الـ shim موجوداً لأي استيراد قديم محتمل، ويعيد div فارغ
 * بسمات RTL وخط Noto Sans Arabic لضمان عدم كسر أي صفحة قد تستدعيه.
 */

export const EnhancedAdminDashboard = () => (
  <div
    dir="rtl"
    style={{
      fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
      direction: 'rtl',
      display: 'none',
    }}
    data-yamshat-legacy="enhanced-admin-dashboard-disabled"
  />
);

export default EnhancedAdminDashboard;
