import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getNotifications } from '../api/notifications.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { maybeShowBrowserNotification, normalizeNotification } from '../utils/notificationCenter.js';
import { redirectToAppPath } from '../utils/router.js';
import socket from '../api/socket.js';
import { useToast } from '../components/admin/ToastProvider.jsx';

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'unread', label: 'غير مقروء' },
  { id: 'mention', label: 'Mentions' },
  { id: 'chat', label: 'الرسائل' },
  { id: 'live', label: 'البث' },
];

function getNotificationBucket(item) {
  if (item.type === 'mention' || item.category === 'mention') return 'mentions';
  if (item.type === 'chat' || item.category === 'chat') return 'messages';
  if (item.type === 'live' || item.category === 'live') return 'live';
  return 'general';
}

function getNotificationMeta(item) {
  const bucket = getNotificationBucket(item);
  if (bucket === 'mentions') return { icon: '@', label: 'منشنات', tone: '#f59e0b' };
  if (bucket === 'messages') return { icon: '💬', label: 'رسائل', tone: '#06b6d4' };
  if (bucket === 'live') return { icon: '🔴', label: 'بث حي', tone: '#22c55e' };
  return { icon: '🔔', label: 'عامة', tone: '#8b5cf6' };
}

function groupNotifications(items = [], grouped = true) {
  if (!grouped) {
    return [{ id: 'all', title: 'كل الإشعارات', items }];
  }

  const groups = new Map();
  items.forEach((item) => {
    const dateKey = new Date(item.created_at || Date.now()).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const bucket = getNotificationBucket(item);
    const key = `${dateKey}-${bucket}`;
    if (!groups.has(key)) groups.set(key, { id: key, title: `${getNotificationMeta(item).label} • ${dateKey}`, items: [] });
    groups.get(key).items.push(item);
  });
  return Array.from(groups.values());
}

export default function Notifications() {
  const { pushToast } = useToast();
  const items = useNotificationStore((state) => state.items);
  const hydrateNotifications = useNotificationStore((state) => state.hydrateNotifications);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    realtimeEnabled: true,
    groupedNotifications: true,
    deepLinking: true,
    browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getNotifications();
        if (!active) return;
        hydrateNotifications(Array.isArray(data) ? data.map(normalizeNotification) : [], { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [hydrateNotifications]);

  useEffect(() => {
    if (!settings.realtimeEnabled) return undefined;
    if (!socket.connected) socket.connect();
    const handleIncoming = async (incoming) => {
      const nextItem = normalizeNotification(incoming);
      upsertNotification(nextItem);
      pushToast({ type: 'info', title: nextItem.title, description: nextItem.body, duration: 4200 });
      if (settings.pushEnabled) await maybeShowBrowserNotification(nextItem).catch(() => null);
    };
    socket.on('new_notification', handleIncoming);
    return () => socket.off('new_notification', handleIncoming);
  }, [pushToast, settings.pushEnabled, settings.realtimeEnabled, upsertNotification]);

  const filteredItems = useMemo(() => {
    const normalized = items.map(normalizeNotification);
    return normalized.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !item.seen;
      if (activeFilter === 'mention') return item.type === 'mention' || item.category === 'mention';
      return item.type === activeFilter || item.category === activeFilter || item.payload?.screen === activeFilter;
    });
  }, [activeFilter, items]);

  const grouped = useMemo(() => groupNotifications(filteredItems, settings.groupedNotifications), [filteredItems, settings.groupedNotifications]);
  const unreadCount = useMemo(() => items.filter((item) => !normalizeNotification(item).seen).length, [items]);
  const summary = useMemo(() => {
    const normalized = items.map(normalizeNotification);
    return {
      total: normalized.length,
      unread: normalized.filter((item) => !item.seen).length,
      live: normalized.filter((item) => getNotificationBucket(item) === 'live').length,
      mentions: normalized.filter((item) => getNotificationBucket(item) === 'mentions').length,
    };
  }, [items]);

  const enablePush = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setSettings((prev) => ({ ...prev, browserPermission: permission, pushEnabled: permission === 'granted' }));
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 10px', display: 'grid', gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>الإشعارات داخل التطبيق</h2>
              <div className="muted" style={{ marginTop: 6 }}>Toast system + live badges + grouped notifications + deep linking</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setShowSettings(true)}>⚙️ الإعدادات</Button>
              <Button variant="secondary" onClick={() => markAllRead()}>تحديد الكل كمقروء</Button>
              <Button onClick={enablePush}>{settings.browserPermission === 'granted' ? 'Push مفعّل' : 'تفعيل Push'}</Button>
            </div>
          </div>

          <div className="notifications-summary-grid">
            {[
              ['إجمالي الإشعارات', summary.total, '#8b5cf6'],
              ['غير مقروء', summary.unread, '#06b6d4'],
              ['Live badges', summary.live, '#22c55e'],
              ['Mentions', summary.mentions, '#f59e0b'],
            ].map(([label, value, tone]) => (
              <div key={label} className="notif-stat-card" style={{ '--notif-tone': tone }}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map((filter) => (
            <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={`notif-filter-chip ${activeFilter === filter.id ? 'active' : ''}`}>
              {filter.label}
              {filter.id === 'unread' && unreadCount > 0 ? <strong>{unreadCount}</strong> : null}
            </button>
          ))}
        </div>

        {loading ? <Card style={{ padding: 24 }}>جارٍ تحميل الإشعارات...</Card> : null}

        {!loading && grouped.length === 0 ? (
          <Card style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 42 }}>📭</div>
            <div className="muted">لا توجد إشعارات مطابقة للفلاتر الحالية</div>
          </Card>
        ) : null}

        <div style={{ display: 'grid', gap: 18 }}>
          {grouped.map((group) => (
            <div key={group.id}>
              <div className="notifications-group-head">
                <strong>{group.title}</strong>
                <span className="muted">{group.items.length} عنصر</span>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {group.items.map((notification) => {
                  const meta = getNotificationMeta(notification);
                  return (
                    <Card key={notification.id} style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'start', border: notification.seen ? '1px solid var(--line)' : `1px solid ${meta.tone}44`, background: notification.seen ? 'var(--bg-card)' : `${meta.tone}12` }}>
                      <div style={{ width: 46, height: 46, borderRadius: 16, background: `linear-gradient(135deg, ${meta.tone}, #0ea5e9)`, display: 'grid', placeItems: 'center', color: 'white', fontSize: 20 }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              {notification.title}
                              {!notification.seen ? <span className="notif-live-badge">Live</span> : null}
                            </div>
                            <div className="muted" style={{ marginTop: 4, lineHeight: 1.6 }}>{notification.body}</div>
                          </div>
                          {!notification.seen ? <span className="notif-dot" /> : null}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="muted" style={{ fontSize: 12 }}>{new Date(notification.created_at || Date.now()).toLocaleString('ar-EG')}</span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {!notification.seen ? <Button variant="secondary" onClick={() => markRead(notification.id)}>مقروء</Button> : null}
                            <Button variant="secondary" onClick={() => {
                              markRead(notification.id);
                              if (settings.deepLinking) redirectToAppPath(notification.path || '/notifications', { replace: false });
                            }}>فتح</Button>
                            <Button variant="secondary" onClick={() => removeNotification(notification.id)}>إخفاء</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="إعدادات الإشعارات الحقيقية">
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            ['pushEnabled', 'Push notifications'],
            ['realtimeEnabled', 'Realtime notifications'],
            ['groupedNotifications', 'Grouped notifications'],
            ['deepLinking', 'Deep linking'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(59,130,246,0.05)' }}>
              <div>
                <strong>{label}</strong>
                <div className="muted" style={{ fontSize: 12 }}>{key === 'pushEnabled' ? 'Browser / Service Worker alerts' : key === 'deepLinking' ? 'فتح الشاشة المستهدفة مباشرة' : 'تحسين التجربة الاجتماعية اللحظية'}</div>
              </div>
              <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.checked }))} />
            </label>
          ))}

          <Card style={{ padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Browser permission</div>
            <div className="muted">{settings.browserPermission}</div>
          </Card>

          <Button onClick={() => setShowSettings(false)}>تم</Button>
        </div>
      </Modal>

      <style>{`
        .notifications-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 16px;
        }
        .notif-stat-card {
          --notif-tone: #8b5cf6;
          padding: 14px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--notif-tone) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--notif-tone) 24%, transparent);
          display: grid;
          gap: 6px;
        }
        .notif-filter-chip {
          border: none;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(59,130,246,0.08);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .notif-filter-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .notif-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2563eb;
          flex-shrink: 0;
          margin-top: 6px;
        }
        .notifications-group-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;
        }
        .notif-live-badge {
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          font-size: 11px;
          font-weight: 800;
        }
      `}</style>
    </MainLayout>
  );
}
