import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/auth.js';
import { getNotifications, markNotificationsRead } from '../../api/notifications.js';
import socket from '../../api/socket.js';
import { clearStoredUser, getAuthToken, getCurrentUsername, getStoredUser } from '../../utils/auth.js';

const titles = {
  '/': 'الصفحة الرئيسية',
  '/dashboard': 'لوحة النشاط',
  '/users': 'الأصدقاء',
  '/profile': 'الملف الشخصي',
  '/inbox': 'الدردشات',
  '/stories': 'الستوري',
  '/reels': 'الريلز',
  '/groups': 'المجموعات',
  '/live': 'البث المباشر',
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (location.pathname.startsWith('/chat/')) return 'المحادثة الخاصة';
    if (location.pathname.startsWith('/profile/')) return 'ملف المستخدم';
    return titles[location.pathname] || 'يمشات';
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
    socket.emit('register_user', { token, user: currentUsername });

    const handleNotification = (notification) => {
      setNotifications((prev) => [{ ...notification, seen: false }, ...prev]);
    };

    socket.on('new_notification', handleNotification);

    return () => {
      active = false;
      socket.off('new_notification', handleNotification);
    };
  }, [currentUsername, token]);

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
    <header className="topbar yamshat-topbar">
      <div>
        <div className="page-eyebrow">Yamshat mobile style</div>
        <h2 className="page-title">{title}</h2>
        <p className="muted no-margin topbar-note">واجهة مرتبة للجوال بألوان بنفسجية داكنة وتوزيع أقرب للصورة المرجعية.</p>
      </div>

      <div className="topbar-actions">
        <div className="search-shell">
          <span>⌕</span>
          <input placeholder="بحث في يمشات..." disabled />
        </div>

        <div className="glass-chip live-pill">LIVE</div>

        <div className="notification-shell">
          <button type="button" className="ghost-btn notification-trigger" onClick={() => setOpen((prev) => !prev)}>
            <span>🔔</span>
            <span>التنبيهات</span>
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
            <strong>{user?.user || user?.username || 'مستخدم'}</strong>
            <small>{user?.role || 'member'}</small>
          </div>
        </Link>
        <button type="button" className="ghost-btn" onClick={handleLogout}>
تسجيل الخروج
        </button>
      </div>
    </header>
  );
}
