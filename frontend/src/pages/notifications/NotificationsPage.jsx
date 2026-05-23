import { useMemo, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import notificationService from '../../services/notificationService.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { normalizeNotification } from '../../utils/notificationCenter.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { requestNotificationSync } from './notificationRuntime.js';
import {
  BATCH_WINDOW_OPTIONS,
  SYNC_INTERVAL_OPTIONS,
  buildNotificationMetrics,
  buildRealtimeHealth,
  formatBatchWindowLabel,
  formatIntervalLabel,
  getUnreadCount,
  groupNotificationsForDisplay,
  saveNotificationPreferences,
} from './notificationUtils.js';

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'unread', label: 'غير مقروء' },
  { id: 'messages', label: 'الرسائل' },
  { id: 'mention', label: 'المنشنات' },
  { id: 'live', label: 'البث' },
];

function getTypeTone(type) {
  switch (String(type || '').toLowerCase()) {
    case 'mention':
    case 'mentions':
      return { icon: '@', color: '#f59e0b' };
    case 'chat':
    case 'message':
    case 'messages':
      return { icon: '💬', color: '#06b6d4' };
    case 'live':
      return { icon: '🔴', color: '#22c55e' };
    case 'follow':
      return { icon: '👥', color: '#8b5cf6' };
    default:
      return { icon: '🔔', color: '#3b82f6' };
  }
}

function MetricCard({ label, value, helper, tone }) {
  return (
    <Card style={{ padding: 18, background: `linear-gradient(135deg, ${tone}18, rgba(15,23,42,0.88))`, border: `1px solid ${tone}33` }}>
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>{helper}</div>
    </Card>
  );
}

function StatusCard({ label, value, helper, tone }) {
  return (
    <Card style={{ padding: 16, border: `1px solid ${tone}33`, background: `linear-gradient(135deg, ${tone}12, rgba(15,23,42,0.92))` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <strong>{label}</strong>
        <span style={{ padding: '6px 10px', borderRadius: 999, background: `${tone}22`, color: tone, fontWeight: 700, fontSize: 12 }}>{value}</span>
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{helper}</div>
    </Card>
  );
}

function NotificationItem({ item, onMarkRead, onHide, deepLinkingEnabled }) {
  const tone = getTypeTone(item.type || item.category);
  return (
    <div style={{ padding: '8px 0' }}>
      <Card style={{ padding: 16, border: item.seen ? '1px solid var(--line)' : `1px solid ${tone.color}55`, background: item.seen ? 'var(--bg-card)' : `${tone.color}12` }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${tone.color}, #0f172a)`, display: 'grid', placeItems: 'center', fontSize: 22, color: '#fff', flexShrink: 0 }}>
            {tone.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 16 }}>{item.title}</strong>
                  {!item.seen ? <span className="notif-unread-pill">جديد</span> : null}
                </div>
                <div className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>{item.body}</div>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>{new Date(item.created_at || Date.now()).toLocaleString('ar-EG')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {!item.seen ? <Button variant="secondary" size="small" onClick={() => onMarkRead(item.id)}>تعليم كمقروء</Button> : null}
              {deepLinkingEnabled ? (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    onMarkRead(item.id, { silent: true });
                    if (typeof window !== 'undefined') window.location.hash = `#${item.path || '/notifications'}`;
                  }}
                >
                  فتح
                </Button>
              ) : null}
              <Button variant="secondary" size="small" onClick={() => onHide(item.id)}>إخفاء من القائمة</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  const { pushToast } = useToast();
  const items = useNotificationStore((state) => state.items);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const preferences = useNotificationStore((state) => state.preferences);
  const setPreferences = useNotificationStore((state) => state.setPreferences);
  const status = useNotificationStore((state) => state.status);

  const [activeFilter, setActiveFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const normalizedItems = useMemo(() => items.map(normalizeNotification), [items]);
  const metrics = useMemo(() => buildNotificationMetrics(normalizedItems), [normalizedItems]);
  const healthCards = useMemo(() => buildRealtimeHealth(status), [status]);

  const filteredItems = useMemo(() => normalizedItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !item.seen;
    if (activeFilter === 'messages') return ['chat', 'message', 'messages'].includes(String(item.type || item.category || '').toLowerCase());
    if (activeFilter === 'mention') return ['mention', 'mentions'].includes(String(item.type || item.category || '').toLowerCase());
    return String(item.type || item.category || '').toLowerCase() === activeFilter;
  }), [activeFilter, normalizedItems]);

  const groupedSections = useMemo(() => groupNotificationsForDisplay(filteredItems, preferences.groupedNotifications), [filteredItems, preferences.groupedNotifications]);

  const updatePreference = (patch) => {
    const next = saveNotificationPreferences({ ...preferences, ...(patch || {}) });
    setPreferences(next);
  };

  const handleSyncNow = async () => {
    requestNotificationSync('manual');
    pushToast({ type: 'info', title: 'جاري المزامنة', description: 'بيتم تحديث الإشعارات والحالة غير المقروءة الآن.' });
  };

  const handleTogglePush = async (enabled) => {
    try {
      if (enabled) {
        await notificationService.subscribeToPushNotifications();
        updatePreference({ pushEnabled: true });
        pushToast({ type: 'success', title: 'تم تفعيل Push', description: 'الإشعارات ستوصلك حتى أثناء الخلفية حسب دعم المتصفح.' });
      } else {
        await notificationService.unsubscribePushNotifications();
        updatePreference({ pushEnabled: false });
        pushToast({ type: 'info', title: 'تم إيقاف Push', description: 'تم إلغاء الاشتراك من الجهاز الحالي.' });
      }
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث Push', description: error?.message || 'حاول مرة أخرى بعد السماح بالإشعارات من المتصفح.' });
    }
  };

  const handleMarkRead = async (notificationId, options = {}) => {
    markRead(notificationId);
    if (options.silent) return;
    try {
      await notificationService.markNotificationRead(notificationId);
    } catch {
      pushToast({ type: 'warning', title: 'تم الحفظ محلياً', description: 'لو كنت أوفلاين هتتم المزامنة أول ما الاتصال يرجع.' });
    }
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    try {
      await notificationService.markAllNotificationsRead();
    } catch {
      pushToast({ type: 'warning', title: 'تم تعليم الكل محلياً', description: 'سيتم استكمال المزامنة مع السيرفر عند رجوع الاتصال.' });
    }
  };

  const quickSettings = [
    ['realtimeEnabled', 'Realtime notifications'],
    ['groupedNotifications', 'Grouped notifications'],
    ['backgroundSyncEnabled', 'Background sync'],
    ['unreadSyncEnabled', 'Unread sync'],
    ['soundEnabled', 'Sound'],
    ['vibrationEnabled', 'Vibration'],
    ['batchingEnabled', 'Notification batching'],
    ['deepLinking', 'Deep linking'],
  ];

  return (
    <MainLayout>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 12px 42px', display: 'grid', gap: 18 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>مركز الإشعارات المتطور</h2>
              <div className="muted" style={{ marginTop: 8 }}>
                Realtime + Push + Grouping + Background sync + Unread sync + Sound/Vibration + Batching
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={handleSyncNow}>مزامنة الآن</Button>
              <Button variant="secondary" onClick={handleMarkAllRead}>تحديد الكل كمقروء</Button>
              <Button onClick={() => setShowSettings(true)}>إعدادات الإشعارات</Button>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <MetricCard label="إجمالي الإشعارات" value={metrics.total} helper="كل العناصر المتاحة محلياً" tone="#3b82f6" />
          <MetricCard label="غير مقروء" value={metrics.unread} helper="يتحدث تلقائياً مع السيرفر" tone="#ef4444" />
          <MetricCard label="رسائل" value={metrics.messages} helper="دردشة ورسائل مباشرة" tone="#06b6d4" />
          <MetricCard label="منشنات" value={metrics.mentions} helper="تنبيهات التفاعل والإشارات" tone="#f59e0b" />
          <MetricCard label="بث مباشر" value={metrics.live} helper="دعوات وتنبيهات البث" tone="#22c55e" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {healthCards.map((card) => <StatusCard key={card.key} {...card} />)}
        </div>

        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {FILTERS.map((filter) => {
              const badge = filter.id === 'unread' ? getUnreadCount(normalizedItems) : null;
              return (
                <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={`notif-filter-chip ${activeFilter === filter.id ? 'active' : ''}`}>
                  <span>{filter.label}</span>
                  {badge ? <strong>{badge}</strong> : null}
                </button>
              );
            })}
          </div>
        </Card>

        {groupedSections.length === 0 ? (
          <Card style={{ padding: 34, textAlign: 'center' }}>
            <div style={{ fontSize: 42 }}>📭</div>
            <div className="muted" style={{ marginTop: 8 }}>لا توجد إشعارات مطابقة للفلاتر الحالية</div>
          </Card>
        ) : (
          groupedSections.map((section) => (
            <Card key={section.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{section.label}</h3>
                  <div className="muted" style={{ marginTop: 5, fontSize: 12 }}>
                    {section.items.length} عنصر{section.unreadCount ? ` • ${section.unreadCount} غير مقروء` : ''}
                  </div>
                </div>
              </div>
              <div>
                {section.items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkRead}
                    onHide={removeNotification}
                    deepLinkingEnabled={preferences.deepLinking}
                  />
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="إعدادات ومزامنة الإشعارات" size="large">
        <div style={{ display: 'grid', gap: 16 }}>
          <Card style={{ padding: 16, background: 'rgba(59,130,246,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <strong>Push notifications</strong>
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  الحالة الحالية: {status.pushPermission === 'granted' ? 'مسموح' : status.pushPermission === 'denied' ? 'مرفوض من المتصفح' : 'بحاجة سماح'}
                </div>
              </div>
              <Button variant={preferences.pushEnabled ? 'secondary' : 'primary'} onClick={() => handleTogglePush(!preferences.pushEnabled)}>
                {preferences.pushEnabled ? 'إيقاف Push' : 'تفعيل Push'}
              </Button>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {quickSettings.map(([key, label]) => (
              <label key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.65)' }}>
                <div>
                  <strong>{label}</strong>
                  <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>{preferences[key] ? 'مفعل' : 'متوقف'}</div>
                </div>
                <input type="checkbox" checked={Boolean(preferences[key])} onChange={(event) => updatePreference({ [key]: event.target.checked })} />
              </label>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <strong>نافذة التجميع</strong>
              <select value={preferences.batchWindowMs} onChange={(event) => updatePreference({ batchWindowMs: Number(event.target.value) })}>
                {BATCH_WINDOW_OPTIONS.map((value) => (
                  <option key={value} value={value}>{formatBatchWindowLabel(value)}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <strong>فاصل مزامنة Unread</strong>
              <select value={preferences.syncIntervalMs} onChange={(event) => updatePreference({ syncIntervalMs: Number(event.target.value) })}>
                {SYNC_INTERVAL_OPTIONS.map((value) => (
                  <option key={value} value={value}>{formatIntervalLabel(value)}</option>
                ))}
              </select>
            </label>
          </div>

          <Card style={{ padding: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <strong>تشخيص سريع</strong>
              <div className="muted" style={{ fontSize: 13 }}>آخر مزامنة: {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('ar-EG') : 'لم تتم بعد'}</div>
              <div className="muted" style={{ fontSize: 13 }}>آخر مصدر: {status.lastSource || 'startup'}</div>
              <div className="muted" style={{ fontSize: 13 }}>عدد غير المقروء من السيرفر: {status.unreadServerCount ?? metrics.unread}</div>
              <div className="muted" style={{ fontSize: 13 }}>Batch pending: {status.pendingBatchSize || 0}</div>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={handleSyncNow}>مزامنة الآن</Button>
            <Button onClick={() => setShowSettings(false)}>حفظ وإغلاق</Button>
          </div>
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
          color: inherit;
        }
        .notif-filter-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .notif-unread-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(239,68,68,0.15);
          color: #fca5a5;
          font-size: 11px;
          font-weight: 800;
        }
      `}</style>
    </MainLayout>
  );
}
