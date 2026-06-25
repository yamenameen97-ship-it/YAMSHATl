import React, { useState, useEffect, useMemo, useRef } from 'react';
import socketManager from '../../services/socketManager';
import notificationService from '../../services/notificationService';
import { useNotificationStore } from '../../store/notificationStore';

export default function NotificationList() {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const [filter, setFilter] = useState('all'); // all, unread, mentions, system

  // ✅ v59.13.9 FIX #2: حماية المكوّن من unmount أثناء استقبال إشعار socket
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Live push updates via socket
    const unsubscribe = socketManager.on('new_notification', (notification) => {
      if (!isMountedRef.current) return;
      // Sync with store (store عالمي وآمن)
      useNotificationStore.getState().addNotification(notification);

      // ✅ v59.13.9 FIX #2: فحص دعم المتصفّح لـ Notification API (لا يوجد في SSR/iOS Safari < 16.4)
      // + عدم إظهار إشعار OS إذا المستخدم بالفعل فاتح صفحة الإشعارات
      try {
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted' &&
          typeof document !== 'undefined' &&
          document.visibilityState === 'hidden'
        ) {
          new Notification(notification.title, { body: notification.message });
        }
      } catch {
        /* بعض المتصفّحات المحمولة ترفض البناء المباشر — تجاهل */
      }
    });

    return () => { try { unsubscribe?.(); } catch { /* ignore */ } };
  }, []);

  // Grouped notifications logic
  const groupedNotifications = useMemo(() => {
    let filtered = notifications;
    if (filter === 'unread') filtered = notifications.filter(n => !n.read);
    if (filter === 'mentions') filtered = notifications.filter(n => n.type === 'mention');
    
    // Group by date
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
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>التنبيهات</h2>
        <button onClick={() => notificationService.markAllNotificationsRead()} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
          تحديد الكل كمقروء
        </button>
      </div>

      <div className="filters" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['all', 'unread', 'mentions'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{ 
              padding: '5px 15px', 
              borderRadius: 20, 
              border: '1px solid #333',
              background: filter === f ? 'var(--primary)' : '#222',
              color: 'white'
            }}
          >
            {/* ✅ v59.13.9 FIX #2: تصحيح ترجمة mentions (كانت خطأه 'منشورات' = posts) */}
            {f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروء' : 'إشارات (Mentions)'}
          </button>
        ))}
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
                  onClick={() => notificationService.markNotificationRead(n.id)}
                  style={{ 
                    padding: 15, 
                    background: n.read ? 'transparent' : 'rgba(var(--primary-rgb), 0.1)', 
                    borderRadius: 10,
                    marginBottom: 10,
                    cursor: 'pointer',
                    border: '1px solid #222'
                  }}
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
