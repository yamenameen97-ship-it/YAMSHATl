import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import socketManager from '../../services/socketManager';
import notificationService from '../../services/notificationService';
import { useNotificationStore } from '../../store/notificationStore';

export default function NotificationList() {
  const { notifications } = useNotificationStore();
  const [filter, setFilter] = useState('all'); // all, unread, mentions

  // ✅ v59.13.12 FIX #1: حماية المكوّن من unmount أثناء استقبال إشعار socket
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ✅ v59.13.14 FIX #2: حساب عدد غير المقروءة لتفعيل/تعطيل زر "تحديد الكل كمقروء"
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // ✅ v59.13.15 FIX #2: إشعار النظام لم يكن له onclick → النقر عليه لا يفعل شيئاً.
  // أيضاً بلا `tag` → الإشعارات المتتابعة تتكدّس في مركز إشعارات النظام.
  // الحل: إضافة tag فريد + onclick يفتح صفحة الإشعارات عبر SPA navigation دون reload.
  useEffect(() => {
    const unsubscribe = socketManager.on('new_notification', (notification) => {
      if (!isMountedRef.current) return;
      useNotificationStore.getState().addNotification(notification);
      try {
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted' &&
          typeof document !== 'undefined' &&
          document.visibilityState === 'hidden'
        ) {
          const notif = new Notification(notification.title || 'تنبيه جديد', {
            body: notification.message || notification.body || '',
            icon: '/icons/icon-512.png',
            badge: '/icons/badge-96.png',
            // tag لدمج الإشعارات المتشابهة وتجنّب التكدّس
            tag: `yamshat-notif-${notification.type || 'generic'}-${notification.id || Date.now()}`,
            data: { url: notification.path || notification.url || '/notifications' },
          });
          // عند النقر على إشعار النظام: ركّز التبويب + افتح المسار عبر SPA (بلا reload)
          notif.onclick = () => {
            try { window.focus(); } catch { /* ignore */ }
            const targetPath = notification.path || notification.url || '/notifications';
            try {
              if (typeof window.history?.pushState === 'function') {
                window.history.pushState({}, '', targetPath);
                window.dispatchEvent(new PopStateEvent('popstate'));
              } else {
                window.location.assign(targetPath);
              }
            } catch {
              try { window.location.assign(targetPath); } catch { /* ignore */ }
            }
            try { notif.close(); } catch { /* ignore */ }
          };
          // عند خطأ إشعار النظام لا ترمِ خطأ للعميل
          notif.onerror = () => { /* ignore */ };
        }
      } catch { /* ignore */ }
    });
    return () => { try { unsubscribe?.(); } catch { /* ignore */ } };
  }, []);

  // ✅ v59.13.12 FIX #1: عدم استدعاء API إذا الإشعار مقروء بالفعل + دعم لوحة المفاتيح
  const handleNotificationClick = useCallback((n) => {
    if (n.read) return; // لا داعي لاستدعاء markRead على إشعار مقروء
    try { notificationService.markNotificationRead(n.id); } catch { /* ignore */ }
  }, []);

  // ✅ v59.13.14 FIX #2: معالج أجوف يمنع إرسال طلب إذا لا توجد إشعارات غير مقروءة +
  // يدعم toast للنجاح/الفشل عبر الحدث العالمي yamshat:toast
  const handleMarkAllRead = useCallback(() => {
    if (unreadCount === 0) return; // تجنّب طلب API لا فائدة منه
    try {
      const ret = notificationService.markAllNotificationsRead();
      if (ret && typeof ret.then === 'function') {
        ret.then(() => {
          if (!isMountedRef.current) return;
          try {
            window.dispatchEvent(new CustomEvent('yamshat:toast', {
              detail: { type: 'success', title: 'تمّ تحديد الكل كمقروء', duration: 2200 },
            }));
          } catch { /* ignore */ }
        }).catch(() => {
          if (!isMountedRef.current) return;
          try {
            window.dispatchEvent(new CustomEvent('yamshat:toast', {
              detail: { type: 'error', title: 'تعذّر تحديد الإشعارات', duration: 2800 },
            }));
          } catch { /* ignore */ }
        });
      }
    } catch { /* ignore */ }
  }, [unreadCount]);

  const handleKeyActivate = useCallback((e, n) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNotificationClick(n);
    }
  }, [handleNotificationClick]);

  const groupedNotifications = useMemo(() => {
    let filtered = notifications;
    if (filter === 'unread') filtered = notifications.filter(n => !n.read);
    if (filter === 'mentions') filtered = notifications.filter(n => n.type === 'mention');
    const groups = {};
    filtered.forEach(n => {
      const date = new Date(n.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(n);
    });
    return groups;
  }, [notifications, filter]);

  return (
    <div className="notification-container" style={{ padding: 20, color: 'white' }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          التنبيهات
          {unreadCount > 0 ? (
            <span
              aria-label={`${unreadCount} إشعارات غير مقروءة`}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginInlineStart: 8, minWidth: 22, height: 22, padding: '0 6px',
                borderRadius: 11, background: '#7c3aed', color: '#fff',
                fontSize: 12, fontWeight: 700, verticalAlign: 'middle',
              }}
            >{unreadCount}</span>
          ) : null}
        </h2>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          aria-disabled={unreadCount === 0}
          aria-label={
            unreadCount === 0
              ? 'لا توجد إشعارات غير مقروءة'
              : `تحديد جميع الإشعارات الـ${unreadCount} كمقروءة`
          }
          style={{
            background: 'none', border: 'none',
            color: unreadCount === 0 ? '#666' : 'var(--primary)',
            cursor: unreadCount === 0 ? 'not-allowed' : 'pointer',
            opacity: unreadCount === 0 ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          تحديد الكل كمقروء
        </button>
      </div>

      <div className="filters" role="tablist" aria-label="تصفية الإشعارات" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['all', 'unread', 'mentions'].map((f) => {
          const isActive = filter === f;
          const label = f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروء' : 'إشارات (Mentions)';
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-pressed={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 15px',
                borderRadius: 20,
                border: '1px solid #333',
                background: isActive ? 'var(--primary)' : '#222',
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="list">
        {Object.keys(groupedNotifications).length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>لا توجد تنبيهات</div>
        ) : (
          Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date} className="date-group">
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 10, marginTop: 20 }}>{date}</div>
              {items.map(n => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={n.read ? 'true' : 'false'}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => handleKeyActivate(e, n)}
                  style={{
                    padding: 15,
                    background: n.read ? 'transparent' : 'rgba(var(--primary-rgb), 0.1)',
                    borderRadius: 10,
                    marginBottom: 10,
                    cursor: n.read ? 'default' : 'pointer',
                    border: '1px solid #222',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.6)'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontWeight: 'bold' }}>{n.title}</div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>{n.message}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
