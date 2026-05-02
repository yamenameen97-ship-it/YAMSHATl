import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/auth.js';
import { getNotifications, markNotificationsRead } from '../../api/notifications.js';
import socket from '../../api/socket.js';
import { clearStoredUser, getCurrentUsername, getStoredUser } from '../../utils/auth.js';

const titles = {
  '/': 'Feed',
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/profile': 'Profile',
  '/inbox': 'Inbox',
  '/chat': 'Chat',
  '/stories': 'Stories',
  '/live': 'Live Streaming',
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const currentUsername = getCurrentUsername();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (location.pathname.startsWith('/chat/')) return 'Private Chat';
    if (location.pathname.startsWith('/profile/')) return 'Profile';
    return titles[location.pathname] || 'YAMSHAT';
  }, [location.pathname]);

  const unreadCount = notifications.filter((item) => !item?.seen).length;

  useEffect(() => {
    if (!currentUsername) return undefined;

    let active = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const { data } = await getNotifications();
        if (!active) return;
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        if (active) setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { user: currentUsername });

    const handleNotification = (notification) => {
      setNotifications((prev) => [{ ...notification, seen: false }, ...prev]);
    };

    socket.on('new_notification', handleNotification);

    return () => {
      active = false;
      socket.off('new_notification', handleNotification);
    };
  }, [currentUsername]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore logout API errors and clear local session anyway
    }
    clearStoredUser();
    navigate('/login', { replace: true });
  };

  const handleMarkRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, seen: true })));
    } catch {
      // ignore marking errors in UI
    }
  };

  return (
    <header className="topbar">
      <div>
        <div className="page-eyebrow">منصة اجتماعية حديثة</div>
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="topbar-actions">
        <div className="search-shell">
          <span>🔎</span>
          <input placeholder="بحث سريع..." disabled />
        </div>

        <div className="notification-shell">
          <button type="button" className="ghost-btn notification-trigger" onClick={() => setOpen((prev) => !prev)}>
            <span>🔔</span>
            <span>الإشعارات</span>
            <strong className="notif-count">{unreadCount}</strong>
          </button>

          {open ? (
            <div className="notification-dropdown card">
              <div className="notification-head">
                <strong>آخر الإشعارات</strong>
                <button type="button" className="mini-action" onClick={handleMarkRead}>
                  تعليم كمقروء
                </button>
              </div>

              {loading ? <div className="muted">جارٍ تحميل الإشعارات...</div> : null}
              {!loading && notifications.length === 0 ? <div className="empty-mini">لا توجد إشعارات حالياً.</div> : null}

              <div className="notification-list">
                {notifications.map((notification) => (
                  <div key={notification.id || `${notification.message}-${notification.created_at}`} className={`notification-item ${notification.seen ? 'seen' : 'unseen'}`}>
                    <div className="notification-dot" />
                    <div>
                      <div>{notification.message || notification.text}</div>
                      <small>{notification.created_at ? new Date(notification.created_at).toLocaleString('ar-EG') : 'الآن'}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <Link to="/profile" className="profile-pill">
          <span className="status-dot active"></span>
          <div>
            <strong>{user?.user || 'User'}</strong>
            <small>{user?.role || 'member'}</small>
          </div>
        </Link>
        <button type="button" className="ghost-btn" onClick={handleLogout}>
          خروج
        </button>
      </div>
    </header>
  );
}
