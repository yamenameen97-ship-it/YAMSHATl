import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { getNotifications, markNotificationsRead } from '../api/notifications.js';
import socket from '../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { browserNotificationsSupported, normalizeNotification } from '../utils/notificationCenter.js';

export default function Notifications() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [permissionState, setPermissionState] = useState(
    browserNotificationsSupported() ? window.Notification.permission : 'unsupported'
  );

  useEffect(() => {
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

    if (currentUsername) {
      if (!socket.connected) socket.connect();
      socket.emit('register_user', { token, user: currentUsername });

      const handleNotification = (notification) => {
        if (!active) return;
        setNotifications((prev) => [normalizeNotification(notification), ...prev]);
      };

      socket.on('new_notification', handleNotification);
      return () => {
        active = false;
        socket.off('new_notification', handleNotification);
      };
    }

    return () => {
      active = false;
    };
  }, [currentUsername, token]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.seen).length,
    [notifications]
  );

  const stats = useMemo(
    () => [
      { label: 'كل الإشعارات', value: notifications.length },
      { label: 'غير المقروء', value: unreadCount },
      {
        label: 'إشعارات المتصفح',
        value:
          permissionState === 'granted'
            ? 'مفعلة'
            : permissionState === 'denied'
              ? 'مرفوضة'
              : permissionState === 'unsupported'
                ? 'غير مدعومة'
                : 'تحتاج تفعيل',
      },
    ],
    [notifications.length, permissionState, unreadCount]
  );

  const handleEnableBrowserNotifications = async () => {
    if (!browserNotificationsSupported()) {
      setPermissionState('unsupported');
      return;
    }
    const result = await window.Notification.requestPermission();
    setPermissionState(result);
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markNotificationsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, seen: true, is_read: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <MainLayout>
      <section className="notifications-page-grid">
        <div className="notifications-main-column">
          <Card className="notifications-hero-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🔔 مركز الإشعارات</h3>
                <p className="muted">كل التنبيهات في صفحة مستقلة للويب والجوال مع نفس الهوية الداكنة البنفسجية.</p>
              </div>
              <div className="story-viewer-actions">
                <span className="glass-chip">Realtime</span>
                <span className="glass-chip">Push Ready</span>
              </div>
            </div>

            <div className="stories-stats-grid notification-stats-grid">
              {stats.map((item) => (
                <div key={item.label} className="mini-stat notifications-stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="notifications-list-card">
            <div className="notification-header-inline notifications-toolbar">
              <div>
                <h3 className="section-title">آخر التنبيهات</h3>
                <p className="muted">اضغط على أي إشعار للانتقال مباشرةً للصفحة المرتبطة به.</p>
              </div>
              <div className="notifications-actions-wrap">
                <Button variant="secondary" onClick={handleEnableBrowserNotifications}>
                  {permissionState === 'granted' ? 'إشعارات المتصفح مفعلة' : 'تفعيل إشعارات المتصفح'}
                </Button>
                <Button onClick={handleMarkAllRead} disabled={markingAll || notifications.length === 0}>
                  {markingAll ? 'جارٍ التحديث...' : 'تعليم الكل كمقروء'}
                </Button>
              </div>
            </div>

            {loading ? <div className="empty-state">جارٍ تحميل الإشعارات...</div> : null}
            {!loading && notifications.length === 0 ? (
              <div className="empty-state">لا توجد إشعارات حالياً. عند وصول أي تفاعل جديد ستظهر هنا فوراً.</div>
            ) : null}

            <div className="notifications-center-list">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-center-item ${notification.seen ? 'seen' : 'unseen'}`}
                  onClick={() => navigate(notification.path)}
                >
                  <div className="notification-center-badge">🔔</div>
                  <div className="notification-center-copy">
                    <div className="notification-center-headline">
                      <strong>{notification.title}</strong>
                      <span>{notification.created_at ? new Date(notification.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
                    </div>
                    <p>{notification.body}</p>
                    <div className="notification-center-meta">
                      <span className={`status-pill ${notification.seen ? 'active' : 'neutral'}`}>
                        {notification.seen ? 'مقروء' : 'جديد'}
                      </span>
                      <span className="glass-chip">فتح الوجهة</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="notifications-side-column">
          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">اختصارات الخدمات</h3>
                <p className="muted">تنقّل سريع بين أكثر الصفحات المرتبطة بالإشعارات.</p>
              </div>
            </div>
            <div className="notifications-shortcuts-grid">
              <button type="button" className="story-user-card" onClick={() => navigate('/inbox')}>
                <div className="story-ring"><div className="story-avatar">💬</div></div>
                <strong>الرسائل</strong>
                <span className="muted">محادثاتك الخاصة</span>
              </button>
              <button type="button" className="story-user-card" onClick={() => navigate('/live')}>
                <div className="story-ring"><div className="story-avatar">🔴</div></div>
                <strong>البث المباشر</strong>
                <span className="muted">الغرف الحالية</span>
              </button>
              <button type="button" className="story-user-card" onClick={() => navigate('/groups')}>
                <div className="story-ring"><div className="story-avatar">👥</div></div>
                <strong>المجموعات</strong>
                <span className="muted">الأنشطة الجماعية</span>
              </button>
              <button type="button" className="story-user-card" onClick={() => navigate('/profile')}>
                <div className="story-ring"><div className="story-avatar">👤</div></div>
                <strong>الملف الشخصي</strong>
                <span className="muted">متابعاتك وإحصاءاتك</span>
              </button>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
