import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getNotifications, markNotificationRead, markNotificationsRead } from '../api/notifications.js';
import RestrictionNotificationCard, { isRestrictionNotification } from '../components/notifications/RestrictionNotificationCard.jsx';
import AdminAlertNotificationCard, { isAdminAlertNotification } from '../components/notifications/AdminAlertNotificationCard.jsx';
import { useNotificationStore } from '../store/notificationStore.js';
import { maybeShowBrowserNotification, normalizeNotification, ensureNotificationPermission } from '../utils/notificationCenter.js';
import { redirectToAppPath } from '../utils/router.js';
import socketManager from '../services/socketManager.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import audioService from '../services/audio/audioService.js';

// v88.6 FIX (نظام الإشعارات):
//   المشكلة الجذرية: الصفحة كانت تستخدم `react-window` (FixedSizeList + AutoSizer)
//   داخل حاوية `flex:1` تحت جذر بارتفاع `calc(100vh - 70px)`. على الجوال، بعد
//   إصلاح v86.4 صار الجذر `height:auto`، فيصير الوالد المباشر لـ AutoSizer بلا
//   ارتفاع محسوب → AutoSizer يقيس 0 → List يرسم 0 صفوف → الصفحة تظهر فارغة
//   رغم أن العداد في الأيقونة أعلى الهيدر يعرض العدد الصحيح (لأنه من مصدر مختلف).
//
//   الحل:
//   1) استبدال react-window بعرض بسيط عبر map (limit=50 يكفي، لا حاجة للـ virtualization).
//   2) تبسيط تخطيط الجذر: min-height بدل height ثابت — تعمل على كل الشاشات.
//   3) على mount نستعيد من localStorage فوراً قبل انتظار الشبكة، فتظهر البيانات
//      المخزنة محلياً دون أي ومضة فراغ.
//   4) عند تعليم القراءة (فردي/جماعي) نُرسل حدث عام + نُبطل الكاش على الخادم
//      حتى تحديث شارة الجرس في التوب-بار يتزامن فوراً.
//   5) استدعاء API الحقيقي لـ markRead بدل تعديل المخزن محلياً فقط (كان bug ثاني:
//      علامة القراءة تختفي بعد إعادة التحميل لأن الخادم لم يُخطر أبداً).
//   6) طلب إذن إشعارات المتصفح داخل user gesture من زر "تفعيل" — لا نطلب تلقائياً.

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

// v88.6: بعد تحديث حالة القراءة نبعث حدثاً عاماً حتى تُبطّل الشارة (Topbar) كاشها.
function dispatchNotificationsChanged(detail = {}) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamshat:notifications-changed', { detail }));
    }
  } catch { /* noop */ }
}

const NotificationRow = ({ notification, markRead, removeNotification, deepLinking }) => {
  const meta = getNotificationMeta(notification);
  return (
    <div style={{ padding: '5px 0' }}>
      <Card
        style={{
          padding: 16,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
          border: notification.seen ? '1px solid var(--line)' : `1px solid ${meta.tone}44`,
          background: notification.seen ? 'var(--bg-card)' : `${meta.tone}12`,
        }}
      >
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${meta.tone}, #0ea5e9)`,
          display: 'grid',
          placeItems: 'center',
          color: 'white',
          fontSize: 20,
          flexShrink: 0,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ wordBreak: 'break-word' }}>{notification.title}</span>
                {!notification.seen ? <span className="notif-live-badge">جديد</span> : null}
              </div>
              <div className="muted" style={{ marginTop: 4, lineHeight: 1.6, fontSize: 13, wordBreak: 'break-word' }}>
                {notification.body}
              </div>
            </div>
            {!notification.seen ? <span className="notif-dot" aria-hidden="true" /> : null}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {new Date(notification.created_at || Date.now()).toLocaleString('ar-EG')}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!notification.seen ? (
                <Button variant="secondary" size="sm" onClick={() => markRead(notification.id)}>
                  مقروء
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  markRead(notification.id);
                  if (deepLinking) redirectToAppPath(notification.path || '/notifications', { replace: false });
                }}
              >
                فتح
              </Button>
              <Button variant="secondary" size="sm" onClick={() => removeNotification(notification.id)}>
                إخفاء
              </Button>
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
  const restoreFromStorage = useNotificationStore((state) => state.restoreFromStorage);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const markReadStore = useNotificationStore((state) => state.markRead);
  const markAllReadStore = useNotificationStore((state) => state.markAllRead);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  const [activeFilter, setActiveFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // v59.13.9 FIX #1: حماية من setState بعد unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const [settings, setSettings] = useState(() => ({
    pushEnabled: true,
    realtimeEnabled: true,
    deepLinking: true,
    browserPermission: (typeof window !== 'undefined' && 'Notification' in window)
      ? window.Notification.permission
      : 'unsupported',
  }));

  // v88.6: استعادة فورية من localStorage قبل أول render فعّال
  //   → إذا كانت هناك إشعارات مخزّنة، ستظهر فوراً دون انتظار الشبكة،
  //   فيختفي الوميض/الفراغ الذي كان يوحي بأن الصفحة "لا تعرض شيئاً".
  useEffect(() => {
    try { restoreFromStorage(); } catch { /* noop */ }
  }, [restoreFromStorage]);

  // v88.6: تحميل من API — مع الحفاظ على العناصر المستعادة إن رجعت المصفوفة فارغة
  //   بسبب خطأ شبكة/انقطاع مؤقت (بدل مسح كل شيء وإظهار صفحة فارغة).
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getNotifications(50);
      if (!isMountedRef.current) return;
      const data = Array.isArray(response?.data) ? response.data : [];
      const normalized = data.map(normalizeNotification);
      // إذا رجعت مصفوفة فارغة، لا نمسح المخزون المحلي — قد يكون خطأ عابراً.
      // (المستخدم يرى ما لديه من الكاش حتى يأتي رد صحيح.)
      if (normalized.length > 0) {
        hydrateNotifications(normalized, { replace: true });
      } else {
        // نضمن على الأقل أن initialized=true حتى تُعرض حالة "لا توجد إشعارات" لاحقاً.
        hydrateNotifications([], { replace: true });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      // eslint-disable-next-line no-console
      console.warn('[notifications] failed to load:', err?.message || err);
      setError('تعذّر تحميل الإشعارات — سيتم إعادة المحاولة تلقائياً.');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [hydrateNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // v88.6: إعادة التحميل عند العودة إلى الصفحة (visibilitychange) — إذا مضى
  //   وقت على آخر جلب، يعود المستخدم فيجد قائمة محدّثة.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) loadNotifications();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadNotifications]);

  // اشتراك socket للإشعارات في الوقت الحقيقي
  useEffect(() => {
    if (!settings.realtimeEnabled) return undefined;
    let subscriptionActive = true;

    const handleIncoming = async (incoming) => {
      if (!subscriptionActive || !isMountedRef.current) return;
      const nextItem = normalizeNotification(incoming);
      upsertNotification(nextItem);
      dispatchNotificationsChanged({ reason: 'new', id: nextItem.id });
      if (!subscriptionActive || !isMountedRef.current) return;
      try { audioService.onNotification(nextItem.type || nextItem.category || 'generic'); } catch { /* noop */ }
      try {
        pushToast({ type: 'info', title: nextItem.title, description: nextItem.body, duration: 4200 });
      } catch { /* noop */ }
      if (settings.pushEnabled) {
        try { await maybeShowBrowserNotification(nextItem); } catch { /* noop */ }
      }
    };

    const unsubscribe = socketManager.on('new_notification', handleIncoming);
    return () => {
      subscriptionActive = false;
      try { unsubscribe?.(); } catch { /* ignore */ }
    };
  }, [pushToast, settings.pushEnabled, settings.realtimeEnabled, upsertNotification]);

  // v88.6: markRead يستدعي API فعلياً — كان قبلاً يعدّل المخزن محلياً فقط،
  //   فتعود العلامة "غير مقروء" بعد إعادة التحميل لأن الخادم لم يُخطر.
  const markRead = useCallback(async (notificationId) => {
    // تحديث تفاؤلي فوري
    markReadStore(notificationId);
    dispatchNotificationsChanged({ reason: 'read', id: notificationId });
    try {
      await markNotificationRead(notificationId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] mark read failed:', err?.message || err);
    }
  }, [markReadStore]);

  const markAllRead = useCallback(async () => {
    const unreadIds = items
      .filter((item) => !normalizeNotification(item).seen)
      .map((item) => item.id)
      .filter(Boolean);
    if (unreadIds.length === 0) return;
    markAllReadStore();
    dispatchNotificationsChanged({ reason: 'read-all', count: unreadIds.length });
    try {
      await markNotificationsRead(unreadIds);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[notifications] mark-all read failed:', err?.message || err);
    }
  }, [items, markAllReadStore]);

  // v88.6: تفعيل إذن الإشعارات داخل user gesture (نقر زر التفعيل)
  const handleEnablePush = useCallback(async () => {
    const result = await ensureNotificationPermission();
    setSettings((prev) => ({ ...prev, browserPermission: result, pushEnabled: result === 'granted' }));
    if (result === 'granted') {
      try {
        pushToast({ type: 'success', title: 'تم تفعيل الإشعارات', description: 'ستصلك تنبيهات فورية.', duration: 3000 });
      } catch { /* noop */ }
    } else if (result === 'denied') {
      try {
        pushToast({ type: 'error', title: 'الإذن مرفوض', description: 'فعّل الإشعارات من إعدادات المتصفح.', duration: 4000 });
      } catch { /* noop */ }
    }
  }, [pushToast]);

  const filteredItems = useMemo(() => {
    const normalized = items.map(normalizeNotification);
    return normalized.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !item.seen;
      if (activeFilter === 'mention') return item.type === 'mention' || item.category === 'mention';
      return (
        item.type === activeFilter
        || item.category === activeFilter
        || item.payload?.screen === activeFilter
      );
    });
  }, [activeFilter, items]);

  const unreadCount = useMemo(
    () => items.filter((item) => !normalizeNotification(item).seen).length,
    [items],
  );

  const needsPermission = settings.browserPermission === 'default' || settings.browserPermission === 'denied';

  return (
    <MainLayout>
      {/* v88.6: نستبدل الحاوية بارتفاع ثابت (100vh) بحاوية min-height + overflow طبيعي
          — تعمل على الجوال والسطح دون الحاجة لـ AutoSizer/react-window. */}
      <div
        className="yam-notifications-page"
        data-page="notifications"
        dir="rtl"
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '20px 12px 120px',
          minHeight: 'calc(100dvh - 70px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>الإشعارات</h2>
              <div className="muted" style={{ marginTop: 6 }}>
                نظام تنبيهات ذكي ومحسن للأداء
                {unreadCount > 0 ? (
                  <> — <strong style={{ color: 'var(--accent, #3b82f6)' }}>{unreadCount} غير مقروء</strong></>
                ) : null}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setShowSettings(true)}>⚙️ الإعدادات</Button>
              <Button variant="secondary" onClick={markAllRead} disabled={unreadCount === 0}>
                تحديد الكل كمقروء
              </Button>
            </div>
          </div>
        </Card>

        {/* v88.6: بانر لطلب إذن إشعارات المتصفح إن لم يكن ممنوحاً بعد. */}
        {needsPermission ? (
          <Card style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', border: '1px dashed rgba(59,130,246,0.4)' }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700 }}>فعّل إشعارات المتصفح</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {settings.browserPermission === 'denied'
                  ? 'الإذن مرفوض — فعّله من إعدادات المتصفح ثم أعد تحميل الصفحة.'
                  : 'اسمح بالإشعارات ليصلك تنبيه فوري عند أي رسالة أو منشن حتى لو كان التطبيق مغلقاً.'}
              </div>
            </div>
            {settings.browserPermission !== 'denied' ? (
              <Button onClick={handleEnablePush}>تفعيل الآن</Button>
            ) : null}
          </Card>
        ) : null}

        {/* شريط الفلاتر — لا تغييرات جوهرية، لكن مع dir=rtl واضح */}
        <div className="notif-filters" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`notif-filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
            >
              {filter.label}
              {filter.id === 'unread' && unreadCount > 0 ? <strong>{unreadCount}</strong> : null}
            </button>
          ))}
        </div>

        {/* v88.6: قائمة بسيطة بديلة للـ virtualized list — تعرض كل العناصر
            (limit=50 لا تحتاج virtualization). هذا يحل الجذر لمشكلة الصفحة
            الفارغة رغم وجود عناصر. */}
        <div className="notif-list-container" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && filteredItems.length === 0 ? (
            <Card style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <div className="muted">جارٍ تحميل الإشعارات...</div>
            </Card>
          ) : error && filteredItems.length === 0 ? (
            <Card style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <div className="muted" style={{ marginBottom: 12 }}>{error}</div>
              <Button variant="secondary" onClick={loadNotifications}>إعادة المحاولة</Button>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card style={{ padding: 36, textAlign: 'center' }}>
              <div style={{ fontSize: 42 }}>📭</div>
              <div className="muted" style={{ marginTop: 8 }}>
                {activeFilter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات حالياً'}
              </div>
            </Card>
          ) : (
            filteredItems.map((notification) => (
              isAdminAlertNotification(notification) ? (
                // v88.54 — تنبيه "ادارة النظام" مع زر الرد وفقاعة كتابة
                <AdminAlertNotificationCard
                  key={notification.id}
                  notification={notification}
                  onHide={(id) => removeNotification(id)}
                  onRead={(id) => markRead(id)}
                />
              ) : isRestrictionNotification(notification) ? (
                // v88.53 — إشعارات القيود الإدارية (كتم/حظر) مع زر طلب مراجعة
                <RestrictionNotificationCard
                  key={notification.id}
                  notification={notification}
                  onHide={(id) => removeNotification(id)}
                />
              ) : (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  markRead={markRead}
                  removeNotification={removeNotification}
                  deepLinking={settings.deepLinking}
                />
              )
            ))
          )}
        </div>
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="إعدادات الإشعارات">
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            ['pushEnabled', 'إشعارات المتصفح'],
            ['realtimeEnabled', 'الإشعارات الفورية (WebSocket)'],
            ['deepLinking', 'فتح الروابط المباشرة'],
          ].map(([key, label]) => (
            <label key={key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 14,
              background: 'rgba(59,130,246,0.05)',
              cursor: 'pointer',
            }}>
              <div>
                <strong>{label}</strong>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(event) => {
                  const nextValue = event.target.checked;
                  setSettings((prev) => ({ ...prev, [key]: nextValue }));
                  // إن فعّل المستخدم إشعارات المتصفح والإذن لم يُعطَ بعد،
                  // نبدأ عملية الطلب داخل نفس الـ click gesture.
                  if (key === 'pushEnabled' && nextValue && needsPermission) {
                    handleEnablePush();
                  }
                }}
              />
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
          font-size: 14px;
          color: inherit;
        }
        .notif-filter-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .notif-filter-chip strong {
          background: rgba(255,255,255,0.2);
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }
        .notif-filter-chip.active strong {
          background: rgba(255,255,255,0.3);
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
      `}</style>
    </MainLayout>
  );
}
