import React, { useState, useEffect, useMemo } from 'react';
import socketManager from '../../services/socketManager';
import notificationService from '../../services/notificationService';
import { useNotificationStore } from '../../store/notificationStore';

export default function NotificationList() {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const [filter, setFilter] = useState('all'); // all, unread, mentions, system

  useEffect(() => {
    // Live push updates via socket
    const unsubscribe = socketManager.on('new_notification', (notification) => {
      // Sync with store
      useNotificationStore.getState().addNotification(notification);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.message });
      }
    });

    return () => unsubscribe();
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
            {f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروء' : 'منشورات'}
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
