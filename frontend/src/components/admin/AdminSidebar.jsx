import { NavLink } from 'react-router-dom';

const items = [
  { to: '/admin/dashboard', label: 'نظرة عامة', icon: '📊', permission: 'dashboard.view' },
  { to: '/admin/users', label: 'المستخدمون', icon: '👥', permission: 'users.view' },
  { to: '/admin/rbac', label: 'الصلاحيات', icon: '🔐', permission: 'rbac.view' },
  { to: '/admin/content', label: 'المحتوى', icon: '📝', permission: 'posts.view' },
  { to: '/admin/notifications', label: 'الإشعارات', icon: '🔔', permission: 'notifications.manage' },
  { to: '/admin/reports', label: 'التقارير', icon: '📈', permission: 'reports.view' },
  { to: '/admin/settings', label: 'الإعدادات', icon: '⚙️', permission: 'settings.manage' },
];

export default function AdminSidebar({ collapsed, permissions = [], role = 'user' }) {
  const isAllowed = (permission) => role === 'admin' || permissions.includes(permission);

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-brand">
        <div className="brand-logo">YA</div>
        {!collapsed ? (
          <div>
            <strong>Yamshat Admin</strong>
            <span>مركز تحكم لحظي احترافي</span>
          </div>
        ) : null}
      </div>

      <nav className="admin-nav">
        {items.filter((item) => isAllowed(item.permission)).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">{item.icon}</span>
            {!collapsed ? <span>{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>

      {!collapsed ? (
        <div className="sidebar-promo">
          <span className="badge">Realtime</span>
          <p>لوحة موحدة للمراقبة، CRUD كامل، تقارير تصدير، إشعارات جماعية، وربط مباشر مع الويب والموبايل.</p>
        </div>
      ) : null}
    </aside>
  );
}
