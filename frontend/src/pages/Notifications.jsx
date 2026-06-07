import { useEffect, useMemo, useState, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getNotifications, markNotificationRead, markNotificationsRead } from '../api/notifications.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { extractNotificationPeer, getNotificationFamily, maybeShowBrowserNotification, normalizeNotification } from '../utils/notificationCenter.js';
import { redirectToAppPath } from '../utils/router.js';
import socketManager from '../services/socketManager.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import audioService from '../services/audio/audioService.js';

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

function groupNotifications(items = []) {
  const map = new Map();

  (Array.isArray(items) ? items : []).forEach((rawItem) => {
    const item = normalizeNotification(rawItem);
    const peer = extractNotificationPeer(item);
    const family = getNotificationFamily(item);
    const key = family === 'chat' && peer ? `chat:${peer}` : `${family}:${item.id}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...item,
        peer,
        family,
        groupedIds: [item.id].filter(Boolean),
        unreadCount: item.seen ? 0 : 1,
        lastBody: item.body,
      });
      return;
    }

    const existingTime = new Date(existing.created_at || 0).getTime();
    const itemTime = new Date(item.created_at || 0).getTime();
    const latest = itemTime >= existingTime ? item : existing;

    map.set(key, {
      ...existing,
      ...latest,
      peer: existing.peer || peer,
      family: existing.family || family,
      groupedIds: [...new Set([...(existing.groupedIds || []), item.id].filter(Boolean))],
      unreadCount: Number(existing.unreadCount || 0) + (item.seen ? 0 : 1),
      title: family === 'chat' && (existing.peer || peer) ? (existing.peer || peer) : (latest.title || existing.title),
      body: latest.body || existing.body,
      lastBody: latest.body || existing.lastBody || existing.body,
      seen: Boolean(existing.seen && item.seen),
      path: latest.path || existing.path,
    });
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

const NotificationRow = ({ index, style, data }) => {
  const { items, markRead, removeNotification, settings, handleOpen } = data;
  const notification = items[index];
  if (!notification) return null;

  const meta = getNotificationMeta(notification);
  return (
    <div style={{ ...style, padding: '5px 10px' }}>
      <Card style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'start', border: notification.seen ? '1px solid var(--line)' : `1px solid ${meta.tone}44`, background: notification.seen ? 'var(--bg-card)' : `${meta.tone}12`, height: '100%' }}>
        <div style={{ width: 46, height: 46, borderRadius: 16, background: `linear-gradient(135deg, ${meta.tone}, #0ea5e9)`, display: 'grid', placeItems: 'center', color: 'white', fontSize: 20 }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {notification.title}
                {Number(notification.unreadCount || 0) > 1 ? <span className="notif-live-badge">{notification.unreadCount}</span> : (!notification.seen ? <span className="notif-live-badge">جديد</span> : null)}
              </div>
              <div className="muted" style={{ marginTop: 4, lineHeight: 1.6, fontSize: 13 }}>{notification.lastBody || notification.body}</div>
            </div>
            {!notification.seen ? <span className="notif-dot" /> : null}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 12 }}>{new Date(notification.created_at || Date.now()).toLocaleString('ar-EG')}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!notification.seen ? <Button variant="secondary" size="sm" onClick={() => markRead(notification)}>مقروء</Button> : null}
              <Button variant="secondary" size="sm" onClick={() => {
                if (settings.deepLinking) data.handleOpen(notification);
              }}>فتح</Button>
              <Button variant="secondary" size="sm" onClick={() => removeNotification(notification)}>إخفاء</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

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
    groupedNotifications: false, // Virtualization works better without grouping in this simple implementation
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
    
    const handleIncoming = async (incoming) => {
      const nextItem = normalizeNotification(incoming);
      upsertNotification(nextItem);
      audioService.onNotification(nextItem.type || nextItem.category || 'generic');
      pushToast({ type: 'info', title: nextItem.title, description: nextItem.body, duration: 4200 });
      if (settings.pushEnabled) await maybeShowBrowserNotification(nextItem).catch(() => null);
    };

    const unsubscribe = socketManager.on('new_notification', handleIncoming);
    return () => unsubscribe();
  }, [pushToast, settings.pushEnabled, settings.realtimeEnabled, upsertNotification]);

  const filteredItems = useMemo(() => {
    const grouped = groupNotifications(items);
    return grouped.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return Number(item.unreadCount || 0) > 0;
      if (activeFilter === 'mention') return item.type === 'mention' || item.category === 'mention' || item.family === 'mention';
      return item.type === activeFilter || item.category === activeFilter || item.payload?.screen === activeFilter || item.family === activeFilter;
    });
  }, [activeFilter, items]);

  const handleMarkGroupedNotificationRead = useCallback(async (notification) => {
    const ids = Array.isArray(notification?.groupedIds) && notification.groupedIds.length
      ? notification.groupedIds
      : [notification?.id].filter(Boolean);

    if (!ids.length) return;

    await Promise.all(ids.map((id) => markNotificationRead(id).catch(() => null)));
    ids.forEach((id) => markRead(id));
  }, [markRead]);

  const handleHideGroupedNotification = useCallback((notification) => {
    const ids = Array.isArray(notification?.groupedIds) && notification.groupedIds.length
      ? notification.groupedIds
      : [notification?.id].filter(Boolean);

    ids.forEach((id) => removeNotification(id));
  }, [removeNotification]);

  const handleOpenGroupedNotification = useCallback(async (notification) => {
    await handleMarkGroupedNotificationRead(notification);

    if (notification?.family === 'chat' && notification?.peer) {
      redirectToAppPath(`/chat/${encodeURIComponent(notification.peer)}`, { replace: false });
      return;
    }

    redirectToAppPath(notification?.path || '/notifications', { replace: false });
  }, [handleMarkGroupedNotificationRead]);

  const listData = useMemo(() => ({
    items: filteredItems,
    markRead: handleMarkGroupedNotificationRead,
    removeNotification: handleHideGroupedNotification,
    settings,
    handleOpen: handleOpenGroupedNotification,
  }), [filteredItems, handleHideGroupedNotification, handleMarkGroupedNotificationRead, handleOpenGroupedNotification, settings]);

  const handleMarkAllAsReadRemote = useCallback(async () => {
    try {
      await markNotificationsRead();
    } catch (_) {
      // ignore backend sync failures, local state still updated below
    }
    markAllRead();
  }, [markAllRead]);

  const unreadCount = useMemo(() => items.filter((item) => !normalizeNotification(item).seen).length, [items]);

  return (
    <MainLayout>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 10px', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>الإشعارات</h2>
              <div className="muted" style={{ marginTop: 6 }}>نظام تنبيهات ذكي ومحسن للأداء</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setShowSettings(true)}>⚙️ الإعدادات</Button>
              <Button variant="secondary" onClick={handleMarkAllAsReadRemote}>تحديد الكل كمقروء</Button>
            </div>
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

        <div style={{ flex: 1 }}>
          {loading ? (
            <Card style={{ padding: 24 }}>جارٍ تحميل الإشعارات...</Card>
          ) : filteredItems.length === 0 ? (
            <Card style={{ padding: 36, textAlign: 'center' }}>
              <div style={{ fontSize: 42 }}>📭</div>
              <div className="muted">لا توجد إشعارات حالياً</div>
            </Card>
          ) : (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  width={width}
                  itemCount={filteredItems.length}
                  itemSize={160}
                  itemData={listData}
                  className="no-scrollbar"
                >
                  {NotificationRow}
                </List>
              )}
            </AutoSizer>
          )}
        </div>
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="إعدادات الإشعارات">
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            ['pushEnabled', 'Push notifications'],
            ['realtimeEnabled', 'Realtime notifications'],
            ['deepLinking', 'Deep linking'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(59,130,246,0.05)' }}>
              <div>
                <strong>{label}</strong>
              </div>
              <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.checked }))} />
            </label>
          ))}
          <Button onClick={() => setShowSettings(false)}>تم</Button>
        </div>
      </Modal>

      <style>{`
        .notif-filter-chip {
          border: none;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(59,130,246,0.08);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
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
        .notif-live-badge {
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          font-size: 11px;
          font-weight: 800;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </MainLayout>
  );
}
