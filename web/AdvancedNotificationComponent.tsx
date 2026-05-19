import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * مكون الإشعارات المتقدم - Advanced Notification Component
 * يوفر:
 * - تجميع الإشعارات
 * - تصنيف الإشعارات
 * - شارات حية
 * - تحريكات احترافية
 * - WebSocket للإشعارات الفورية
 */

interface NotificationGroup {
  id: string;
  category: string;
  type: string;
  count: number;
  first_actor: string;
  other_actors_count: number;
  summary: string;
  notifications: Notification[];
}

interface Notification {
  id: string;
  title: string;
  body: string;
  actor_name: string;
  actor_avatar: string;
  timestamp: string;
  is_read: boolean;
  animation: string;
}

interface Badge {
  count: number;
  category: string;
  is_animated: boolean;
  last_updated: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

export const AdvancedNotificationComponent: React.FC<{ userId: string }> = ({ userId }) => {
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [badges, setBadges] = useState<Record<string, Badge>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  /**
   * تحميل الإشعارات المجمعة
   */
  const loadGroupedNotifications = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/${userId}/grouped`
      );

      if (response.data.success) {
        setGroups(response.data.groups);
      }
    } catch (error) {
      console.error('Error loading grouped notifications:', error);
    }
  };

  /**
   * تحميل الشارات
   */
  const loadBadges = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/badges/${userId}`);

      if (response.data.success) {
        setBadges(response.data.badges);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  /**
   * الاتصال بـ WebSocket
   */
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications/${userId}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('New notification:', data);

        // إعادة تحميل الإشعارات والشارات
        loadGroupedNotifications();
        loadBadges();

        // عرض إشعار نظام التشغيل
        if (Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.body,
            icon: data.actor_avatar
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId]);

  /**
   * تحميل البيانات الأولية
   */
  useEffect(() => {
    loadGroupedNotifications();
    loadBadges();

    // طلب الإذن لإشعارات النظام
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [userId]);

  /**
   * وضع علامة على الفئة كمقروءة
   */
  const markCategoryAsRead = async (category: string) => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/${userId}/category/${category}/read`
      );

      loadGroupedNotifications();
      loadBadges();
    } catch (error) {
      console.error('Error marking category as read:', error);
    }
  };

  /**
   * حذف جميع إشعارات الفئة
   */
  const clearCategory = async (category: string) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/notifications/${userId}/category/${category}`
      );

      loadGroupedNotifications();
      loadBadges();
    } catch (error) {
      console.error('Error clearing category:', error);
    }
  };

  /**
   * إغلاق الإشعارات عند النقر خارجها
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * حساب العدد الإجمالي للإشعارات
   */
  const totalUnread = Object.values(badges).reduce(
    (sum, badge) => sum + badge.count,
    0
  );

  /**
   * تصفية الإشعارات حسب الفئة المختارة
   */
  const filteredGroups = selectedCategory
    ? groups.filter(g => g.category === selectedCategory)
    : groups;

  return (
    <div ref={notificationRef} style={styles.container}>
      {/* زر الإشعارات مع الشارة */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={styles.notificationButton}
      >
        🔔
        {totalUnread > 0 && (
          <span
            style={{
              ...styles.badge,
              animation: Object.values(badges).some(b => b.is_animated)
                ? 'pulse 1s infinite'
                : 'none'
            }}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* لوحة الإشعارات */}
      {showNotifications && (
        <div style={styles.notificationPanel}>
          {/* رؤوس الفئات */}
          <div style={styles.categoryTabs}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                ...styles.categoryTab,
                ...(selectedCategory === null ? styles.categoryTabActive : {})
              }}
            >
              الكل ({totalUnread})
            </button>

            {Object.entries(badges).map(([category, badge]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  ...styles.categoryTab,
                  ...(selectedCategory === category ? styles.categoryTabActive : {})
                }}
              >
                {getCategoryLabel(category)} ({badge.count})
              </button>
            ))}
          </div>

          {/* قائمة الإشعارات */}
          <div style={styles.notificationList}>
            {filteredGroups.length === 0 ? (
              <div style={styles.emptyState}>
                <p>لا توجد إشعارات جديدة</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group.id}
                  style={{
                    ...styles.notificationGroup,
                    animation: `${group.notifications[0]?.animation || 'slideIn'} 0.3s ease-out`
                  }}
                >
                  <div style={styles.groupHeader}>
                    <img
                      src={group.notifications[0]?.actor_avatar}
                      alt={group.first_actor}
                      style={styles.avatar}
                    />
                    <div style={styles.groupContent}>
                      <p style={styles.groupSummary}>{group.summary}</p>
                      <p style={styles.groupTime}>
                        {getTimeAgo(group.notifications[0]?.timestamp)}
                      </p>
                    </div>
                    {group.count > 1 && (
                      <span style={styles.groupCount}>{group.count}</span>
                    )}
                  </div>

                  {/* أزرار الإجراء */}
                  <div style={styles.groupActions}>
                    <button
                      onClick={() => markCategoryAsRead(group.category)}\n                      style={styles.actionButton}\n                    >\n                      ✓ وضع علامة كمقروء\n                    </button>\n                    <button\n                      onClick={() => clearCategory(group.category)}\n                      style={styles.actionButton}\n                    >\n                      🗑️ حذف\n                    </button>\n                  </div>\n                </div>\n              ))\n            )}\n          </div>\n        </div>\n      )}\n\n      {/* أنماط CSS */}\n      <style>{`\n        @keyframes slideIn {\n          from {\n            opacity: 0;\n            transform: translateX(-20px);\n          }\n          to {\n            opacity: 1;\n            transform: translateX(0);\n          }\n        }\n\n        @keyframes fadeIn {\n          from {\n            opacity: 0;\n          }\n          to {\n            opacity: 1;\n          }\n        }\n\n        @keyframes bounce {\n          0%, 100% {\n            transform: scale(1);\n          }\n          50% {\n            transform: scale(1.1);\n          }\n        }\n\n        @keyframes pulse {\n          0%, 100% {\n            opacity: 1;\n          }\n          50% {\n            opacity: 0.5;\n          }\n        }\n      `}</style>\n    </div>\n  );\n};\n\n/**\n * الحصول على تسمية الفئة\n */\nfunction getCategoryLabel(category: string): string {\n  const labels: Record<string, string> = {\n    social: '👍 اجتماعي',\n    messages: '💬 رسائل',\n    stories: '📖 قصص',\n    mentions: '@️ إشارات',\n    system: '⚙️ نظام'\n  };\n  return labels[category] || category;\n}\n\n/**\n * حساب الوقت المنقضي\n */\nfunction getTimeAgo(timestamp: string): string {\n  const now = new Date();\n  const then = new Date(timestamp);\n  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);\n\n  if (seconds < 60) return 'للتو';\n  if (seconds < 3600) return `قبل ${Math.floor(seconds / 60)} دقيقة`;\n  if (seconds < 86400) return `قبل ${Math.floor(seconds / 3600)} ساعة`;\n  return `قبل ${Math.floor(seconds / 86400)} يوم`;\n}\n\n/**\n * الأنماط\n */\nconst styles = {\n  container: {\n    position: 'relative' as const,\n    display: 'inline-block'\n  },\n  notificationButton: {\n    position: 'relative' as const,\n    fontSize: '24px',\n    background: 'none',\n    border: 'none',\n    cursor: 'pointer',\n    padding: '8px'\n  },\n  badge: {\n    position: 'absolute' as const,\n    top: '-5px',\n    right: '-5px',\n    backgroundColor: '#f44336',\n    color: 'white',\n    borderRadius: '50%',\n    width: '24px',\n    height: '24px',\n    display: 'flex',\n    alignItems: 'center',\n    justifyContent: 'center',\n    fontSize: '12px',\n    fontWeight: 'bold'\n  },\n  notificationPanel: {\n    position: 'absolute' as const,\n    top: '100%',\n    right: 0,\n    width: '400px',\n    maxHeight: '600px',\n    backgroundColor: 'white',\n    borderRadius: '8px',\n    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',\n    zIndex: 1000,\n    marginTop: '10px',\n    overflow: 'hidden',\n    display: 'flex',\n    flexDirection: 'column' as const\n  },\n  categoryTabs: {\n    display: 'flex',\n    borderBottom: '1px solid #eee',\n    overflowX: 'auto' as const\n  },\n  categoryTab: {\n    flex: 1,\n    padding: '12px',\n    border: 'none',\n    background: 'none',\n    cursor: 'pointer',\n    fontSize: '14px',\n    color: '#666',\n    borderBottom: '2px solid transparent',\n    whiteSpace: 'nowrap' as const\n  },\n  categoryTabActive: {\n    color: '#2196F3',\n    borderBottomColor: '#2196F3'\n  },\n  notificationList: {\n    flex: 1,\n    overflowY: 'auto' as const\n  },\n  emptyState: {\n    padding: '40px 20px',\n    textAlign: 'center' as const,\n    color: '#999'\n  },\n  notificationGroup: {\n    padding: '12px',\n    borderBottom: '1px solid #f0f0f0',\n    cursor: 'pointer',\n    transition: 'background-color 0.2s'\n  },\n  groupHeader: {\n    display: 'flex',\n    alignItems: 'center',\n    gap: '12px',\n    marginBottom: '8px'\n  },\n  avatar: {\n    width: '40px',\n    height: '40px',\n    borderRadius: '50%',\n    objectFit: 'cover' as const\n  },\n  groupContent: {\n    flex: 1\n  },\n  groupSummary: {\n    margin: '0',\n    fontSize: '14px',\n    fontWeight: '500',\n    color: '#333'\n  },\n  groupTime: {\n    margin: '4px 0 0 0',\n    fontSize: '12px',\n    color: '#999'\n  },\n  groupCount: {\n    backgroundColor: '#2196F3',\n    color: 'white',\n    borderRadius: '50%',\n    width: '24px',\n    height: '24px',\n    display: 'flex',\n    alignItems: 'center',\n    justifyContent: 'center',\n    fontSize: '12px',\n    fontWeight: 'bold'\n  },\n  groupActions: {\n    display: 'flex',\n    gap: '8px'\n  },\n  actionButton: {\n    flex: 1,\n    padding: '6px 12px',\n    fontSize: '12px',\n    border: '1px solid #ddd',\n    borderRadius: '4px',\n    background: 'white',\n    cursor: 'pointer',\n    transition: 'all 0.2s'\n  }\n};\n\nexport default AdvancedNotificationComponent;\n
