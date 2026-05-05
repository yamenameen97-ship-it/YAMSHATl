import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/auth.js';
import { getNotifications, markNotificationsRead } from '../../api/notifications.js';
import socket from '../../api/socket.js';
import { clearStoredUser, getAuthToken, getCurrentUsername, getStoredUser } from '../../utils/auth.js';
import { browserNotificationsSupported, normalizeNotification } from '../../utils/notificationCenter.js';
import { useAppStore } from '../../store/appStore.js';

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
  '/notifications': 'مركز الإشعارات',
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const isOnline = useAppStore((state) => state.isOnline);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState(
    browserNotificationsSupported() ? window.Notification.permission : 'unsupported'
  );

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
        setNotifications((Array.isArray(data) ? data : []).map(normalizeNotification));
      } catch {
        if (active) setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: currentUsername });

    const handleNotification = (incoming) => {
      const notification = normalizeNotification(incoming);
      setNotifications((prev) => [notification, ...prev]);

      if (
        active &&
        browserNotificationsSupported() &&
        window.Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        const nativeNotification = new window.Notification(notification.title, {
          body: notification.body,
          tag: String(notification.id),
        });
        nativeNotification.onclick = () => {
          window.focus();
          nativeNotification.close();
          navigate(notification.path);
        };
      }
    };

    socket.on('new_notification', handleNotification);

    return () => {
      active = false;
      socket.off('new_notification', handleNotification);
    };
  }, [currentUsername, navigate, token]);

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
      setNotifications((prev) => prev.map((item) => ({ ...item, seen: true, is_read: true })));
    } catch {
      // ignore marking errors in UI
    }
  };

  const handleEnableBrowserNotifications = async () => {
    if (!browserNotificationsSupported()) {
      setPermissionState('unsupported');
      return;
    }
    const permission = await window.Notification.requestPermission();
    setPermissionState(permission);
  };

  return (
    <header className="topbar yamshat-topbar">
      <div>
        <div className="page-eyebrow">Yamshat unified web/mobile style</div>
        <h2 className="page-title">{title}</h2>
        <p className="muted no-margin topbar-note">واجهة أسرع مع وضع داكن/فاتح، كاش مركزي، وتنبيهات فورية وتجربة موبايل أفضل.</p>
        <div className="topbar-shortcuts">
          <Link to="/live" className="mini-action">🔴 البث المباشر</Link>
          <Link to="/groups" className="mini-action">👥 المجموعات</Link>
          <Link to="/users" className="mini-action">🧑‍🤝‍🧑 الأصدقاء</Link>
          <Link to="/notifications" className="mini-action">🔔 الإشعارات</Link>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="search-shell" title="البحث المباشر داخل الصفحات المتاحة">
          <span>⌕</span>
          <input placeholder="استخدم البحث داخل الصفحات مثل المستخدمين والرسائل" disabled />
        </div>

        <div className={`glass-chip live-pill ${isOnline ? '' : 'offline'}`}>{isOnline ? 'LIVE' : 'OFFLINE'}</div>

        <button type="button" className="ghost-btn browser-push-btn" onClick={toggleTheme}>
          {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
        </button>

        <button type="button" className="ghost-btn browser-push-btn" onClick={handleEnableBrowserNotifications}>
          {permissionState === 'granted' ? 'إشعارات المتصفح مفعلة' : 'تفعيل إشعارات المتصفح'}
        </button>

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
                <div className="notifications-actions-wrap">
                  <button type="button" className="mini-action" onClick={() => navigate('/notifications')}>
                    فتح المركز
                  </button>
                  <button type="button" className="mini-action" onClick={handleMarkRead}>
                    تعليم كمقروء
                  </button>
                </div>
              </div>

              {loading ? <div className="muted">جارٍ تحميل الإشعارات...</div> : null}
              {!loading && notifications.length === 0 ? <div className="empty-mini">لا توجد إشعارات حالياً.</div> : null}

              <div className="notification-list">
                {notifications.slice(0, 6).map((notification) => (
                  <button
                    key={notification.id || `${notification.body}-${notification.created_at}`}
                    type="button"
                    className={`notification-item ${notification.seen ? 'seen' : 'unseen'}`}
                    onClick={() => {
                      setOpen(false);
                      navigate(notification.path);
                    }}
                  >
                    <div className="notification-dot" />
                    <div>
                      <div><strong>{notification.title}</strong></div>
                      <div>{notification.body}</div>
                      <small>{notification.created_at ? new Date(notification.created_at).toLocaleString('ar-EG') : 'الآن'}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <Link to="/profile" className="profile-pill">
          <span className={`status-dot ${isOnline ? 'active' : ''}`}></span>
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
