import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/auth.js';
import { searchAdmin } from '../../api/admin.js';
import { clearStoredUser, getStoredUser } from '../../utils/auth.js';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import { getFlattenedAdminItems } from './adminNavigation.js';

export default function AdminTopbar({ title, subtitle, onToggleSidebar, notifications = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = user?.role || 'admin';
  const permissions = user?.permissions || [];
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const debouncedQuery = useDebouncedValue(query, 350);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);
  const adminLinks = useMemo(() => getFlattenedAdminItems(role, permissions), [permissions, role]);

  useEffect(() => {
    let active = true;
    if (!debouncedQuery.trim()) {
      setResults({ users: [], posts: [] });
      return undefined;
    }

    searchAdmin(debouncedQuery)
      .then(({ data }) => {
        if (active) setResults(data || { users: [], posts: [] });
      })
      .catch(() => {
        if (active) setResults({ users: [], posts: [] });
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore network failure, local cleanup is enough for UX
    }
    clearStoredUser();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="admin-topbar admin-reference-topbar admin-topbar-modern">
      <div className="admin-topbar-leading">
        <button type="button" className="ghost-btn icon-btn admin-menu-toggle" onClick={onToggleSidebar}>☰</button>
        <div className="admin-search-box admin-reference-search-box">
          <div className="admin-search-input-wrap">
            <span className="admin-search-icon">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث عن مستخدم، بث، منشور..." />
          </div>
          {/* Inline page heading next to search to save vertical space */}
          <div className="admin-topbar-inline-heading">
            <strong className="admin-topbar-inline-title">{title}</strong>
            {subtitle ? <span className="admin-topbar-inline-sub">{subtitle}</span> : null}
          </div>
          {(results.users.length || results.posts.length) ? (
            <div className="search-results-panel">
              {results.users.length ? (
                <div>
                  <strong>المستخدمون</strong>
                  {results.users.map((item) => (
                    <button key={item.id} type="button" className="search-result-item" onClick={() => navigate('/admin/users')}>
                      <span>{item.username}</span>
                      <small>{item.role}</small>
                    </button>
                  ))}
                </div>
              ) : null}
              {results.posts.length ? (
                <div>
                  <strong>المنشورات</strong>
                  {results.posts.map((item) => (
                    <button key={item.id} type="button" className="search-result-item" onClick={() => navigate('/admin/posts')}>
                      <span>{item.username}</span>
                      <small>{item.content?.slice(0, 42)}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="topbar-controls admin-reference-controls">
        <div className="topbar-popover-wrap" ref={notificationRef}>
          <button type="button" className="ghost-btn notification-button admin-reference-utility" onClick={() => setOpenNotifications((prev) => !prev)}>
            🔔
            <span>{unreadCount}</span>
          </button>
          {openNotifications ? (
            <div className="notification-popover admin-header-popover">
              <div className="notification-popover-head">
                <strong>آخر الإشعارات</strong>
                <Link to="/admin/notifications">عرض الكل</Link>
              </div>
              <div className="notification-popover-list">
                {notifications.slice(0, 5).map((item) => (
                  <div key={item.id} className="notification-popover-item">
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </div>
                ))}
                {!notifications.length ? <div className="empty-state compact">لا توجد إشعارات حالياً.</div> : null}
              </div>
            </div>
          ) : null}
        </div>

        <Link className="ghost-btn admin-reference-utility" to="/admin/reports" title="التقارير">📈</Link>
        <Link className="ghost-btn admin-reference-utility" to="/admin/notifications" title="الإشعارات">✉</Link>

        <div className="admin-profile-dropdown-wrap" ref={profileMenuRef}>
          <button type="button" className="profile-pill admin-profile-pill admin-reference-profile admin-profile-trigger" onClick={() => setOpenMenu((prev) => !prev)}>
            <div className="admin-reference-profile-avatar">{(user?.username || 'A').slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user?.username || 'admin'}</strong>
              <small>{user?.role || 'admin'}</small>
            </div>
            <span className={`admin-dropdown-caret ${openMenu ? 'open' : ''}`}>⌄</span>
          </button>

          {openMenu ? (
            <div className="admin-profile-dropdown admin-header-popover">
              <div className="admin-profile-dropdown-head">
                <strong>أقسام الإدارة</strong>
                <small>اختر القسم المطلوب بسرعة</small>
              </div>
              <div className="admin-profile-dropdown-list">
                {adminLinks.map((item) => (
                  <NavLink key={item.to} to={item.to} end={Boolean(item.exact)} className="admin-profile-dropdown-item" onClick={() => setOpenMenu(false)}>
                    <span className="admin-profile-dropdown-icon">{item.icon}</span>
                    <span className="admin-profile-dropdown-copy">
                      <strong>{item.label}</strong>
                      <small>{item.group}</small>
                    </span>
                    {item.badge ? <em className="admin-nav-badge">{item.badge}</em> : null}
                  </NavLink>
                ))}
              </div>
              <button type="button" className="admin-profile-dropdown-logout" onClick={handleLogout}>تسجيل الخروج</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
