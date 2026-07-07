import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import socketManager from '../../services/socketManager';
import notificationService from '../../services/notificationService';
import { useNotificationStore } from '../../store/notificationStore';

export default function NotificationList() {
  // ✅ v83.5 FIX #1: كان الكود يقرأ `notifications` من المتجر بينما المتجر الفعلي يعرّض
  // `items` فقط (انظر store/notificationStore.js). النتيجة: `notifications` كان دائماً
  // `undefined` → كل الفلاتر و`filter(n => !n.read)` كان يرمي `TypeError: Cannot read`
  // ضمن ErrorBoundary → صفحة الإشعارات فارغة والجرس لا يعمل. الآن نقرأ `items`
  // ونعرّف alias آمن `notifications` بمصفوفة افتراضية.
  const notifications = useNotificationStore((s) => s.items) || [];
  const [filter, setFilter] = useState('all'); // all, unread, mentions

  // ✅ v59.13.12 FIX #1: حماية المكوّن من unmount أثناء استقبال إشعار socket
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ✅ v59.13.14 FIX #2 + v83.5 FIX #1: حساب عدد غير المقروءة لتفعيل/تعطيل زر "تحديد الكل كمقروء".
  // ملاحظة: المتجر ينتج `seen`/`is_read` عبر normalizeNotification — لم يعد يوجد حقل `read`
  // على مستوى المتجر، لذا نتحقق من الحقلين لتوافق خلفي مع أي مزوّد قديم.
  const unreadCount = useMemo(
    () => notifications.filter((n) => !(n.seen || n.is_read || n.read)).length,
    [notifications]
  );

  // ✅ v59.13.15 FIX #2: إشعار النظام لم يكن له onclick → النقر عليه لا يفعل شيئاً.
  // ✅ v83.6 FIX #5: إلغاء إنشاء Notification النظامي من هنا تماماً.
  //
  // الخلل المكتشف: NotificationList (مميَّز فقط عندما يكون المستخدم في صفحة الإشعارات)
  //   يشترك في نفس حدث socket 'new_notification' الذي يشترك فيه GlobalNotificationListener
  //   المركّب طوال الوقت. الإشعار الواحد يُعالَج مرتين:
  //     - تحديث المتجر: مُقبول (deduplicateNotifications يدمج حسب id)
  //     - Notification API النظامي: يُطلق مرتين! رغم tag متطابق (لأنّ كلّ مكوّن
  //       يولُد مثيلاً منفصلاً من Notification في نفس الإطار الزمني).
  //       وفي Chrome iOS/Safari: dedupe حسب tag غير موثوق → يظهر إشعاران متطابقان.
  //     - أيضاً beep الذي يديره GlobalNotificationListener يتقاطع مع طلب إشعار أخر
  //       من هنا دون توافق حول أي منهما يفتح SPA route.
  //
  // الحل: لا نقدّم sub́criptions موازية. في NotificationList نكتفي بتحديث المتجر
  //   (كخط دفاعي لو unmount GlobalListener لفترة وجيزة) دون دفع Notification/beep/toast
  //   — فهذه مسؤولية GlobalNotificationListener فقط وتمتلك dedupe TTL في shownNotificationIds.
  useEffect(() => {
    const unsubscribe = socketManager.on('new_notification', (notification) => {
      if (!isMountedRef.current) return;
      // ✅ v83.5 FIX #1: `addNotification` غير موجود في المتجر — الدالة الصحيحة هي
      // `upsertNotification` (تدعم de-dupe + batching + persistence).
      useNotificationStore.getState().upsertNotification(notification);
      // ✅ v83.6 FIX #5: تم حذف new Notification(...) المزدوج — GlobalNotificationListener
      // يتولّى ذلك مركزيّا مع dedupe.
      // الكود القديم أُبقي موثّقاً تحته للمرجعة فقط (غير مفعّل).
    });
    return () => { try { unsubscribe?.(); } catch { /* ignore */ } };
  }, []);

  // ✅ v83.6 FIX #5 (المرجعية المُعطّلة أدناه متروكة للتوثيق ولن تُنفّذ):
  // كانت هذه الكتلة تقوم بإنشاء Notification من NotificationList أيضاً، ممّا يؤدي
  // إلى إشعار مزدوج (هذا المكوّن + GlobalListener) عندما يكون المستخدم
  // في صفحة الإشعارات. تُحتفظ كمرجع فقط.
  const _DISABLED_LEGACY_NOTIFICATION_EFFECT = () => {
    // eslint-disable-next-line no-unused-vars
    const legacyBlock = (notification) => {
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
    };
    return legacyBlock;
  };

  // ✅ v59.13.12 FIX #1 + v83.5 FIX #1: عدم استدعاء API إذا الإشعار مقروء بالفعل + دعم لوحة المفاتيح.
  // نفحص `seen || is_read || read` لتفادي تكرار الطلبات عندما يكون المتجر قد طبَّع الحقل.
  const handleNotificationClick = useCallback((n) => {
    if (n.seen || n.is_read || n.read) return; // لا داعي لاستدعاء markRead على إشعار مقروء
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
    // ✅ v83.5 FIX #1: نفس علة `read` — نستخدم مفاتيح `seen`/`is_read` المُطبَّعة.
    // كذلك نعتمد `created_at` أولاً (الحقل القياسي في المتجر) ونعود إلى `timestamp` كخيار احتياطي.
    if (filter === 'unread') filtered = notifications.filter((n) => !(n.seen || n.is_read || n.read));
    if (filter === 'mentions') filtered = notifications.filter((n) => n.type === 'mention');
    const groups = {};
    filtered.forEach((n) => {
      const raw = n.created_at || n.timestamp;
      const d = raw ? new Date(raw) : new Date();
      const date = Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
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
                  aria-pressed={(n.seen || n.is_read || n.read) ? 'true' : 'false'}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => handleKeyActivate(e, n)}
                  style={{
                    padding: 15,
                    background: (n.seen || n.is_read || n.read) ? 'transparent' : 'rgba(var(--primary-rgb), 0.1)',
                    borderRadius: 10,
                    marginBottom: 10,
                    cursor: (n.seen || n.is_read || n.read) ? 'default' : 'pointer',
                    border: '1px solid #222',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.6)'; }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontWeight: 'bold' }}>{n.title}</div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>{n.body || n.message}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
