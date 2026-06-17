import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/auth.js';
import BrandLogo from '../ui/BrandLogo.jsx';
import { clearStoredUser, getStoredUser } from '../../utils/auth.js';
import { getAdminNavItems } from './adminNavigation.js';

export default function AdminSidebar({ collapsed, permissions = [], role = 'user', badges = {} }) {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const navGroups = useMemo(() => getAdminNavItems(role, permissions), [permissions, role]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore network logout errors and clear locally
    }
    clearStoredUser();
    navigate('/admin/login', { replace: true });
  };

  return (
    <aside className={`admin-sidebar admin-reference-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-brand admin-reference-brand">
        <div className="brand-logo brand-logo-reference">
          <BrandLogo size={38} alt="Yamshat Admin" className="brand-logo-reference-image" />
        </div>
        {!collapsed ? (
          <div>
            <strong>Yamshat Admin</strong>
            <span>لوحة تحكم موحّدة</span>
          </div>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="admin-sidebar-usercard">
          <div className="admin-sidebar-avatar">{(currentUser?.username || 'A').slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{currentUser?.full_name || currentUser?.username || 'المدير العام'}</strong>
            <span>{role === 'admin' ? 'Super Admin' : role || 'Admin'}</span>
          </div>
          <div className="admin-sidebar-status">متصل</div>
        </div>
      ) : null}

      <div className="admin-sidebar-scroll">
        {navGroups.map((group) => (
          <div key={group.title} className="admin-sidebar-group">
            {!collapsed ? <div className="admin-sidebar-group-title">{group.title}</div> : null}
            <nav className="admin-nav admin-reference-nav">
              {group.items.map((item) => {
                const dynamicBadge = badges[item.to];
                const showDynamic = typeof dynamicBadge === 'number' && dynamicBadge > 0;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={Boolean(item.exact)}
                    className={({ isActive }) => `admin-nav-link admin-reference-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="admin-nav-icon admin-reference-icon">{item.icon}</span>
                    {!collapsed ? <span>{item.label}</span> : null}
                    {!collapsed && showDynamic ? (
                      <em className="admin-nav-badge admin-nav-badge-live" title={`${dynamicBadge} عنصر بحاجة متابعة`}>
                        {dynamicBadge > 99 ? '99+' : dynamicBadge}
                      </em>
                    ) : (!collapsed && item.badge ? <em className="admin-nav-badge">{item.badge}</em> : null)}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="admin-sidebar-footer-block">
        {!collapsed ? (
          <div className="sidebar-promo admin-reference-promo compact">
            <span className="badge">واجهة واحدة</span>
            <p>تم تثبيت الشعار الرسمي في كامل واجهات الإدارة مع الحفاظ على نفس سرعة التنقّل والتنظيم.</p>
          </div>
        ) : null}
        <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
          <span>⇠</span>
          {!collapsed ? <span>تسجيل الخروج</span> : null}
        </button>
      </div>
    </aside>
  );
}
