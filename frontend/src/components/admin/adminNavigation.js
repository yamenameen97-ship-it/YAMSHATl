// ======================================================================
// Yamshat Admin Navigation — v88.51
// ----------------------------------------------------------------------
// - أُلغيت "إدارة البثوث" نهائياً.
// - أُضيفت "إدارة التريندات" 🔥 في مجموعة إدارة المحتوى.
// ======================================================================
export const ADMIN_NAV_GROUPS = [
  {
    title: 'لوحة التحكم',
    items: [
      { to: '/admin/dashboard', label: 'لوحة التحكم', icon: '⌂', permission: 'dashboard.view', exact: true },
    ],
  },
  {
    title: 'إدارة المحتوى',
    items: [
      // ⛔ حُذفت "إدارة البثوث" — نظام البث ملغى.
      // 🔥 v88.51 — تم استبدالها بـ "إدارة التريندات" مع بادج LIVE للإشارات اللحظية.
      { to: '/admin/trending', label: 'إدارة التريندات', icon: '🔥', permission: 'dashboard.view', badge: 'LIVE' },
      { to: '/admin/posts',    label: 'إدارة المنشورات', icon: '✦', permission: 'posts.view' },
      { to: '/admin/chat',     label: 'إدارة الشات',     icon: '✉', permission: 'dashboard.view' },
      { to: '/admin/stories',  label: 'إدارة الستوري',   icon: '◎', permission: 'dashboard.view' },
      { to: '/admin/reels',    label: 'إدارة الريلز',    icon: '▶', permission: 'dashboard.view' },
      { to: '/admin/groups',   label: 'إدارة المجموعات', icon: '◌', permission: 'dashboard.view' },
    ],
  },
  {
    title: 'إدارة المستخدمين',
    items: [
      { to: '/admin/users',         label: 'المستخدمون',            icon: '◍', permission: 'users.view' },
      { to: '/admin/rbac',          label: 'المشرفون والصلاحيات',    icon: '⌘', permission: 'rbac.view' },
      { to: '/admin/reports',       label: 'التقارير والبلاغات',     icon: '▣', permission: 'reports.view', badge: 'HOT' },
      { to: '/admin/notifications', label: 'الإشعارات',              icon: '◔', permission: 'notifications.manage' },
      { to: '/admin/audit',         label: 'سجل الأدمن',             icon: '⧉', permission: 'dashboard.view' },
      { to: '/admin/settings',      label: 'الإعدادات العامة',       icon: '⚙', permission: 'settings.manage' },
    ],
  },
];

export function canAccessAdminItem(item, role = 'user', permissions = []) {
  return !item.permission || role === 'admin' || permissions.includes(item.permission);
}

export function getAdminNavItems(role = 'user', permissions = []) {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessAdminItem(item, role, permissions)),
  })).filter((group) => group.items.length);
}

export function getFlattenedAdminItems(role = 'user', permissions = []) {
  return getAdminNavItems(role, permissions).flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })));
}
