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
      // ⛔ تم حذف "إدارة البثوث" بناءً على طلب المالك (نظام البث ملغى).
      { to: '/admin/posts', label: 'إدارة المنشورات', icon: '✦', permission: 'posts.view' },
      { to: '/admin/chat', label: 'إدارة الشات', icon: '✉', permission: 'dashboard.view' },
      { to: '/admin/stories', label: 'إدارة الستوري', icon: '◎', permission: 'dashboard.view' },
      { to: '/admin/reels', label: 'إدارة الريلز', icon: '▶', permission: 'dashboard.view' },
      { to: '/admin/groups', label: 'إدارة المجموعات', icon: '◌', permission: 'dashboard.view' },
    ],
  },
  {
    title: 'إدارة المستخدمين',
    items: [
      { to: '/admin/users', label: 'المستخدمون', icon: '◍', permission: 'users.view' },
      { to: '/admin/rbac', label: 'المشرفون والصلاحيات', icon: '⌘', permission: 'rbac.view' },
      { to: '/admin/reports', label: 'التقارير والبلاغات', icon: '▣', permission: 'reports.view', badge: 'HOT' },
      { to: '/admin/notifications', label: 'الإشعارات', icon: '◔', permission: 'notifications.manage' },
      { to: '/admin/audit', label: 'سجل الأدمن', icon: '⧉', permission: 'dashboard.view' },
      { to: '/admin/settings', label: 'الإعدادات العامة', icon: '⚙', permission: 'settings.manage' },
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
