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
  const deployMode = window.YAMSHAT_DEPLOY_MODE === 'split-services' ? 'split-services' : 'single-service';

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
    <header className="admin-topbar">
      <div className="topbar-main">
        <button type="button" className="ghost-btn icon-btn" onClick={onToggleSidebar}>☰</button>
        <div>
          <div className="page-eyebrow">لوحة تحكم احترافية</div>
          <h1 className="page-title">{title}</h1>
          <div className="topbar-meta-row">
            <span className="live-pill"><span className="status-dot live-dot" />تحديث لحظي</span>
            <span className="deploy-pill">{deployMode === 'split-services' ? 'Web + Backend منفصلان' : 'نشر موحد'}</span>
          </div>
        </div>
      </div>

      <div className="topbar-controls">
        <div className="admin-search-box">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث فوري في المستخدمين والمنشورات" />
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
                  <strong>المحتوى</strong>
                  {results.posts.map((item) => (
                    <button key={item.id} type="button" className="search-result-item" onClick={() => navigate('/admin/content')}>
                      <span>{item.username}</span>
                      <small>{item.content.slice(0, 42)}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <button type="button" className="ghost-btn notification-button" onClick={() => setOpen((prev) => !prev)}>
          🔔
          <span>{unreadCount}</span>
        </button>

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

        <div className="profile-pill admin-profile-pill">
          <div>
            <strong>{user?.username || 'admin'}</strong>
            <small>{user?.role || 'admin'}</small>
          </div>
        </div>
        <button type="button" className="ghost-btn" onClick={handleLogout}>خروج</button>
      </div>
    </header>
  );
}
