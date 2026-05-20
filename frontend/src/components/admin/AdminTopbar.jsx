import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/auth.js';
import { searchAdmin } from '../../api/admin.js';
import { clearStoredUser, getStoredUser } from '../../utils/auth.js';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';

export default function AdminTopbar({ title, onToggleSidebar, notifications = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();
  const debouncedQuery = useDebouncedValue(query, 350);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

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

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    clearStoredUser();
    navigate('/login', { replace: true });
  };

  return (
    <header className="admin-topbar admin-reference-topbar">
      <div className="admin-topbar-search-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="ghost-btn icon-btn admin-menu-toggle" onClick={onToggleSidebar}>☰</button>
          <div className="admin-search-box admin-reference-search-box">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث عن مستخدم، بث، منشور..." />
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
      </div>

      <div className="admin-topbar-meta-block">
        <div style={{ textAlign: 'end' }}>
          <div className="page-eyebrow">مرحباً بك داخل</div>
          <h1 className="page-title admin-reference-title" style={{ margin: '4px 0 0' }}>{title}</h1>
          <div className="topbar-meta-row">
            <span className="live-pill"><span className="status-dot live-dot" />واجهة موحّدة</span>
            <span className="deploy-pill">RTL • Dark • Live</span>
          </div>
        </div>
      </div>

      <div className="topbar-controls admin-reference-controls">
        <button type="button" className="ghost-btn admin-reference-utility" aria-label="theme switch">☾</button>
        <button type="button" className="ghost-btn notification-button admin-reference-utility" onClick={() => setOpen((prev) => !prev)}>
          🔔
          <span>{unreadCount}</span>
        </button>
        <Link className="ghost-btn admin-reference-utility" to="/admin/notifications">✉</Link>
        <div className="profile-pill admin-profile-pill admin-reference-profile">
          <div className="admin-reference-profile-avatar">{(user?.username || 'A').slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user?.username || 'admin'}</strong>
            <small>{user?.role || 'admin'}</small>
          </div>
        </div>
        <button type="button" className="ghost-btn" onClick={handleLogout}>خروج</button>

        {open ? (
          <div className="notification-popover">
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
    </header>
  );
}
