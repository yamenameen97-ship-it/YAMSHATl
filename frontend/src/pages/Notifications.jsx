import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { getNotifications, markNotificationsRead } from '../api/notifications.js';
import socket from '../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { browserNotificationsSupported, normalizeNotification } from '../utils/notificationCenter.js';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'chat', label: 'الدردشة' },
  { key: 'follow', label: 'المتابعة' },
  { key: 'interaction', label: 'التفاعل' },
  { key: 'live', label: 'البث' },
  { key: 'system', label: 'النظام' },
  { key: 'unread', label: 'غير المقروء' },
];

function detectCategory(notification) {
  const title = `${notification?.title || ''} ${notification?.body || ''}`.toLowerCase();
  const path = String(notification?.path || '').toLowerCase();
  if (path.includes('/inbox') || title.includes('رسال') || title.includes('chat')) return 'chat';
  if (title.includes('متابع') || title.includes('follow')) return 'follow';
  if (path.includes('/live') || title.includes('بث') || title.includes('live')) return 'live';
  if (title.includes('إعجاب') || title.includes('تعليق') || title.includes('mention') || title.includes('like') || title.includes('comment')) return 'interaction';
  return 'system';
}

function detectTimeGroup(dateValue) {
  if (!dateValue) return 'بدون وقت';
  const now = new Date();
  const target = new Date(dateValue);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return 'اليوم';
  if (diffDays <= 7) return 'آخر 7 أيام';
  return 'أقدم';
}

export default function Notifications() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filterKey, setFilterKey] = useState('all');
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

  const enriched = useMemo(
    () => notifications.map((notification) => ({
      ...notification,
      category: detectCategory(notification),
      timeGroup: detectTimeGroup(notification.created_at),
    })),
    [notifications]
  );

  const unreadCount = useMemo(
    () => enriched.filter((notification) => !notification.seen).length,
    [enriched]
  );

  const stats = useMemo(
    () => [
      { label: 'كل الإشعارات', value: enriched.length },
      { label: 'غير المقروء', value: unreadCount },
      { label: 'الدردشة', value: enriched.filter((item) => item.category === 'chat').length },
      { label: 'التفاعل', value: enriched.filter((item) => item.category === 'interaction').length },
    ],
    [enriched, unreadCount]
  );

  const filteredNotifications = useMemo(() => {
    if (filterKey === 'all') return enriched;
    if (filterKey === 'unread') return enriched.filter((item) => !item.seen);
    return enriched.filter((item) => item.category === filterKey);
  }, [enriched, filterKey]);

  const groupedNotifications = useMemo(() => {
    const grouped = new Map();
    filteredNotifications.forEach((notification) => {
      const items = grouped.get(notification.timeGroup) || [];
      items.push(notification);
      grouped.set(notification.timeGroup, items);
    });
    return Array.from(grouped.entries());
  }, [filteredNotifications]);

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
      <section className="notifications-page-grid notifications-page-grid-enhanced">
        <div className="notifications-main-column">
          <Card className="notifications-hero-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🔔 مركز الإشعارات</h3>
                <p className="muted">تم تجميع الإشعارات حسب النوع والزمن لتكون أوضح على الويب والجوال.</p>
              </div>
              <div className="story-viewer-actions">
                <span className="glass-chip">Realtime</span>
                <span className="glass-chip">Grouped</span>
              </div>
            </div>

            <div className="stories-stats-grid notification-stats-grid notification-stats-grid-4">
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
                <p className="muted">اضغط على أي إشعار للانتقال للصفحة المرتبطة به فوراً.</p>
              </div>
              <div className="notifications-actions-wrap notifications-actions-inline">
                <Button variant="secondary" onClick={handleEnableBrowserNotifications}>
                  {permissionState === 'granted' ? 'إشعارات المتصفح مفعلة' : 'تفعيل إشعارات المتصفح'}
                </Button>
                <Button onClick={handleMarkAllRead} disabled={markingAll || notifications.length === 0}>
                  {markingAll ? 'جارٍ التحديث...' : 'تعليم الكل كمقروء'}
                </Button>
              </div>
            </div>

            <div className="notifications-filter-row">
              {FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`mini-action ${filterKey === filter.key ? 'active-filter-chip' : ''}`}
                  onClick={() => setFilterKey(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {loading ? <div className="empty-state">جارٍ تحميل الإشعارات...</div> : null}
            {!loading && filteredNotifications.length === 0 ? (
              <div className="empty-state">لا توجد إشعارات ضمن هذا التصنيف حالياً.</div>
            ) : null}

            <div className="notifications-group-stack">
              {groupedNotifications.map(([groupLabel, items]) => (
                <section key={groupLabel} className="notification-group-section">
                  <div className="notification-group-head">
                    <strong>{groupLabel}</strong>
                    <span className="muted">{items.length} إشعار</span>
                  </div>

                  <div className="notifications-center-list">
                    {items.map((notification) => (
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
                            <span className="glass-chip">{FILTERS.find((item) => item.key === notification.category)?.label || 'النظام'}</span>
                            <span className="glass-chip">فتح الوجهة</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
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
