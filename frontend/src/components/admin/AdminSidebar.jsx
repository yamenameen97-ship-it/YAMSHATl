import { NavLink } from 'react-router-dom';

const groups = [
  {
    title: 'إدارة المحتوى',
    items: [
      { to: '/admin/dashboard', label: 'لوحة التحكم', icon: '⌂', permission: 'dashboard.view' },
      { to: '/admin/live', label: 'إدارة البثوث', icon: '◉', permission: 'live.manage', badge: 'LIVE' },
      { to: '/admin/posts', label: 'إدارة المنشورات', icon: '✦', permission: 'posts.view' },
      { to: '/admin/chat', label: 'إدارة الشات', icon: '✉', permission: 'dashboard.view' },
      { to: '/admin/stories', label: 'إدارة الستوري', icon: '◎', permission: 'dashboard.view' },
      { to: '/admin/reels', label: 'إدارة الريلز', icon: '▶', permission: 'dashboard.view' },
    ],
  },
  {
    title: 'إدارة المستخدمين',
    items: [
      { to: '/admin/users', label: 'المستخدمون', icon: '◍', permission: 'users.view' },
      { to: '/admin/groups', label: 'المجموعات', icon: '◌', permission: 'dashboard.view' },
      { to: '/admin/reports', label: 'التقارير والإحصائيات', icon: '▣', permission: 'reports.view', badge: 'HOT' },
      { to: '/admin/notifications', label: 'الإشعارات', icon: '◔', permission: 'notifications.manage' },
      { to: '/admin/audit', label: 'سجل النشاطات', icon: '⧉', permission: 'dashboard.view' },
      { to: '/admin/settings', label: 'الإعدادات العامة', icon: '⚙', permission: 'settings.manage' },
    ],
  },
];

export default function AdminSidebar({ collapsed, permissions = [], role = 'user' }) {
  const isAllowed = (permission) => !permission || role === 'admin' || permissions.includes(permission);

  return (
    <aside className={`admin-sidebar admin-reference-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-brand admin-reference-brand">
        <div className="brand-logo brand-logo-reference">◉</div>
        {!collapsed ? (
          <div>
            <strong>LiveStream</strong>
            <span>لوحة إدارة عربية احترافية</span>
          </div>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="admin-sidebar-usercard">
          <div className="admin-sidebar-avatar">A</div>
          <div>
            <strong>المدير العام</strong>
            <span>Super Admin</span>
          </div>
          <div className="admin-sidebar-status">● متصل</div>
        </div>
      ) : null}

      <div className="admin-sidebar-scroll">
        {groups.map((group) => (
          <div key={group.title} className="admin-sidebar-group">
            {!collapsed ? <div className="admin-sidebar-group-title">{group.title}</div> : null}
            <nav className="admin-nav admin-reference-nav">
              {group.items.filter((item) => isAllowed(item.permission)).map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-nav-link admin-reference-link ${isActive ? 'active' : ''}`}>
                  <span className="admin-nav-icon admin-reference-icon">{item.icon}</span>
                  {!collapsed ? <span>{item.label}</span> : null}
                  {!collapsed && item.badge ? <em className="admin-nav-badge">{item.badge}</em> : null}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
