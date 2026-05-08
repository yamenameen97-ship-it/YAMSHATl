import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { getNotifications, markNotificationsRead } from '../api/notifications.js';
import socket from '../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { browserNotificationsSupported } from '../utils/notificationCenter.js';
import { selectUnreadNotificationsCount, useNotificationStore } from '../store/notificationStore.js';

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'chat', label: 'الدردشة' },
  { key: 'follow', label: 'المتابعة' },
  { key: 'interaction', label: 'التفاعل' },
  { key: 'live', label: 'البث' },
  { key: 'system', label: 'النظام' },
  { key: 'unread', label: 'غير المقروء' },
];

const CATEGORY_KEYS = ['chat', 'follow', 'interaction', 'live', 'system'];
const SOUND_OPTIONS = [
  { value: 'classic', label: 'Classic Bell' },
  { value: 'pulse', label: 'Pulse Ping' },
  { value: 'soft', label: 'Soft Chime' },
  { value: 'silent', label: 'Silent Mode' },
];
const PREFERENCES_STORAGE_KEY = 'yamshat.notification.preferences';

const defaultPreferences = {
  push_enabled: true,
  browser_enabled: true,
  mobile_enabled: true,
  smart_notifications: true,
  grouped_notifications: true,
  silent_notifications: false,
  realtime_notifications: true,
  sound: 'classic',
  categories: {
    chat: true,
    follow: true,
    interaction: true,
    live: true,
    system: true,
  },
};

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

function readPreferences() {
  if (typeof window === 'undefined') return defaultPreferences;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw);
    return {
      ...defaultPreferences,
      ...parsed,
      categories: {
        ...defaultPreferences.categories,
        ...(parsed?.categories || {}),
      },
    };
  } catch {
    return defaultPreferences;
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const notifications = useNotificationStore((state) => state.items);
  const loading = useNotificationStore((state) => state.loading);
  const storeError = useNotificationStore((state) => state.error);
  const initialized = useNotificationStore((state) => state.initialized);
  const setLoading = useNotificationStore((state) => state.setLoading);
  const setError = useNotificationStore((state) => state.setError);
  const hydrateNotifications = useNotificationStore((state) => state.hydrateNotifications);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const markAllReadLocal = useNotificationStore((state) => state.markAllRead);
  const unreadCount = useNotificationStore(selectUnreadNotificationsCount);
  const [markingAll, setMarkingAll] = useState(false);
  const [filterKey, setFilterKey] = useState('all');
  const [preferences, setPreferences] = useState(readPreferences);
  const [permissionState, setPermissionState] = useState(
    browserNotificationsSupported() ? window.Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getNotifications();
      hydrateNotifications(Array.isArray(data) ? data : [], { replace: true });
    } catch (error) {
      setError(error?.response?.data?.detail || error?.response?.data?.message || 'تعذر تحميل الإشعارات حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    if (!initialized) loadNotifications();

    if (currentUsername) {
      if (!socket.connected) socket.connect();
      socket.emit('register_user', { token, user: currentUsername });

      const handleNotification = (notification) => {
        if (!active) return;
        upsertNotification(notification);
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
  }, [currentUsername, initialized, token, upsertNotification]);

  const enriched = useMemo(
    () => notifications.map((notification) => ({
      ...notification,
      category: detectCategory(notification),
      timeGroup: detectTimeGroup(notification.created_at),
    })),
    [notifications]
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

  const channelCards = useMemo(() => ([
    {
      key: 'push_enabled',
      label: 'Push Notifications',
      value: preferences.push_enabled ? 'مفعّل' : 'متوقف',
      description: 'تنبيهات فورية من الخادم للخدمات المرتبطة.',
    },
    {
      key: 'browser_enabled',
      label: 'Browser Notifications',
      value: permissionState === 'granted' && preferences.browser_enabled ? 'جاهز' : permissionState === 'denied' ? 'محظور' : 'يحتاج إذن',
      description: 'عرض إشعارات مباشرة داخل المتصفح عند وصول تحديثات جديدة.',
    },
    {
      key: 'mobile_enabled',
      label: 'Mobile Notifications',
      value: preferences.mobile_enabled ? 'مفعّل' : 'متوقف',
      description: 'مهيّأ للربط مع Firebase أو أي قناة موبايل لاحقاً.',
    },
    {
      key: 'realtime_notifications',
      label: 'Real-time Notifications',
      value: preferences.realtime_notifications ? 'Live' : 'Digest',
      description: 'إرسال الحدث بمجرد وصوله بدل الانتظار للتحديثات المجمعة.',
    },
  ]), [permissionState, preferences]);

  const automationCards = useMemo(() => ([
    {
      key: 'smart_notifications',
      label: 'Smart Notifications',
      value: preferences.smart_notifications ? 'ON' : 'OFF',
      description: 'ترتيب الأولويات وتخفيف الضوضاء بناءً على التصنيف والنشاط.',
    },
    {
      key: 'grouped_notifications',
      label: 'Grouped Notifications',
      value: preferences.grouped_notifications ? 'ON' : 'OFF',
      description: 'جمع الإشعارات المتشابهة في مجموعات زمنية وتصنيفية.',
    },
    {
      key: 'silent_notifications',
      label: 'Silent Notifications',
      value: preferences.silent_notifications ? 'Enabled' : 'Disabled',
      description: 'استقبال الإشعارات بدون صوت مع بقاء الشارات والعدادات.',
    },
    {
      key: 'sound',
      label: 'Notification Sounds',
      value: SOUND_OPTIONS.find((item) => item.value === preferences.sound)?.label || 'Classic Bell',
      description: 'اختيار صوت التنبيه الافتراضي لمتصفحك أو للموبايل لاحقاً.',
    },
  ]), [preferences]);

  const categoryStats = useMemo(() => CATEGORY_KEYS.map((key) => ({
    key,
    label: FILTERS.find((item) => item.key === key)?.label || key,
    count: enriched.filter((item) => item.category === key).length,
    enabled: Boolean(preferences.categories?.[key]),
  })), [enriched, preferences.categories]);

  const handleEnableBrowserNotifications = async () => {
    if (!browserNotificationsSupported()) {
      setPermissionState('unsupported');
      setPreferences((prev) => ({ ...prev, browser_enabled: false }));
      return;
    }
    const result = await window.Notification.requestPermission();
    setPermissionState(result);
    setPreferences((prev) => ({ ...prev, browser_enabled: result === 'granted' }));
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markNotificationsRead();
      markAllReadLocal();
      setError('');
    } catch (error) {
      setError(error?.response?.data?.detail || error?.response?.data?.message || 'تعذر تحديث حالة الإشعارات.');
    } finally {
      setMarkingAll(false);
    }
  };

  const togglePreference = async (key) => {
    if (key === 'browser_enabled' && (!preferences.browser_enabled || permissionState !== 'granted')) {
      await handleEnableBrowserNotifications();
      return;
    }
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (key) => {
    setPreferences((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [key]: !prev.categories?.[key],
      },
    }));
  };

  return (
    <MainLayout>
      <section className="notifications-page-grid notifications-page-grid-enhanced">
        <div className="notifications-main-column">
          <Card className="notifications-hero-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🔔 مركز الإشعارات</h3>
                <p className="muted">دلوقتي الصفحة فيها Push و Browser و Mobile preferences مع Smart / Grouped / Silent / Real-time controls بشكل عملي وسريع.</p>
              </div>
              <div className="story-viewer-actions">
                <span className="glass-chip">Push</span>
                <span className="glass-chip">Browser</span>
                <span className="glass-chip">Mobile</span>
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

            {loading ? <ListSkeleton count={6} /> : null}
            {!loading && storeError ? <ErrorState title="تعذر تحميل الإشعارات" description={storeError} onRetry={loadNotifications} /> : null}
            {!loading && !storeError && filteredNotifications.length === 0 ? (
              <EmptyState icon="🔕" title="لا توجد إشعارات ضمن هذا التصنيف" description="جرّب فلتر مختلف أو أعد التحديث." actionLabel="تحديث" onAction={loadNotifications} />
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
                        onClick={() => navigate(notification.path || '/dashboard')}
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
                <h3 className="section-title">قنوات الإشعار</h3>
                <p className="muted">تفعيل Push / Browser / Mobile وتخصيص السلوك الذكي من مكان واحد.</p>
              </div>
            </div>
            <div className="queue-grid compact-cards">
              {channelCards.map((item) => (
                <div key={item.key} className="queue-card compact">
                  <span className="queue-label">{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.description}</p>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(preferences[item.key])}
                      onChange={() => togglePreference(item.key)}
                    />
                    <span>تبديل الحالة</span>
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">Notification Settings</h3>
                <p className="muted">Smart و Grouped و Silent و Notification Sounds بشكل مباشر للمستخدم.</p>
              </div>
            </div>
            <div className="queue-grid compact-cards">
              {automationCards.map((item) => (
                <div key={item.key} className="queue-card compact">
                  <span className="queue-label">{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.description}</p>
                  {item.key === 'sound' ? (
                    <label className="field select-field">
                      <span className="field-label">الصوت</span>
                      <select className="input" value={preferences.sound} onChange={(event) => setPreferences((prev) => ({ ...prev, sound: event.target.value }))}>
                        {SOUND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  ) : (
                    <label className="checkbox-row">
                      <input type="checkbox" checked={Boolean(preferences[item.key])} onChange={() => togglePreference(item.key)} />
                      <span>تفعيل</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">Notification Categories</h3>
                <p className="muted">تحكم سريع في التصنيفات المهمة مع عداد فوري لكل نوع.</p>
              </div>
            </div>
            <div className="queue-grid compact-cards">
              {categoryStats.map((item) => (
                <div key={item.key} className="queue-card compact">
                  <span className="queue-label">{item.label}</span>
                  <strong>{item.count}</strong>
                  <p>{item.enabled ? 'هذا التصنيف نشط ضمن التنبيهات الذكية.' : 'هذا التصنيف مستبعد حالياً من التفضيلات.'}</p>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={item.enabled} onChange={() => toggleCategory(item.key)} />
                    <span>{item.enabled ? 'مفعّل' : 'متوقف'}</span>
                  </label>
                </div>
              ))}
            </div>
          </Card>

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
