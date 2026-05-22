import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getNotifications, markNotificationsRead } from '../../api/notifications.js';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '🔔' },
  { id: 'chat', label: 'الرسائل', icon: '💬' },
  { id: 'interaction', label: 'التفاعلات', icon: '❤️' },
  { id: 'system', label: 'النظام', icon: '⚙️' }
];

const PRIORITY_LEVELS = {
  high: { label: 'عالية', color: '#ff4444' },
  medium: { label: 'متوسطة', color: '#ffaa00' },
  low: { label: 'منخفضة', color: '#888888' }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [settings, setSettings] = useState({
    push_enabled: true,
    email_summary: false,
    chat_alerts: true,
    interaction_alerts: true,
    segmentation: 'personalized'
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  // Group notifications by date and category
  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter(n => {
      const categoryMatch = activeTab === 'all' || n.category === activeTab;
      const priorityMatch = priorityFilter === 'all' || n.priority === priorityFilter;
      return categoryMatch && priorityMatch;
    });

    const groups = {};
    filtered.forEach(n => {
      const date = new Date(n.created_at);
      const key = date.toLocaleDateString('ar-EG');
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [notifications, activeTab, priorityFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.seen).length;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.seen).map(n => n.id);
    if (unreadIds.length > 0) {
      try {
        await markNotificationsRead(unreadIds);
        setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
      } catch (err) {
        console.error('Failed to mark notifications as read', err);
      }
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>الإشعارات {unreadCount > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginLeft: 8 }}>{unreadCount}</span>}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <Button variant="secondary" size="small" onClick={handleMarkAllRead}>✓ قراءة الكل</Button>
            )}
            <Button variant="secondary" size="small" onClick={() => setShowSettings(true)}>⚙️</Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                background: activeTab === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: 'none',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: '0.2s'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {['all', 'high', 'medium', 'low'].map(priority => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                background: priorityFilter === priority ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                fontSize: 12,
                whiteSpace: 'nowrap'
              }}
            >
              {priority === 'all' ? 'الكل' : PRIORITY_LEVELS[priority]?.label}
            </button>
          ))}
        </div>

        {/* Notifications List - Grouped by Date */}
        <div style={{ display: 'grid', gap: 20 }}>
          <AnimatePresence>
            {groupedNotifications.length === 0 ? (
              <Card style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                <div style={{ opacity: 0.6 }}>لا توجد إشعارات</div>
              </Card>
            ) : (
              groupedNotifications.map(([date, dateNotifications]) => (
                <div key={date}>
                  <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 10, paddingLeft: 10 }}>{date}</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {dateNotifications.map((n, idx) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card 
                          style={{ 
                            padding: 16, 
                            display: 'flex', 
                            gap: 15, 
                            alignItems: 'flex-start',
                            opacity: n.seen ? 0.7 : 1,
                            borderLeft: `4px solid ${PRIORITY_LEVELS[n.priority]?.color || '#888888'}`,
                            background: !n.seen ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
                          }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {n.category === 'chat' ? '💬' : n.category === 'interaction' ? '❤️' : '⚙️'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
                              <div style={{ fontWeight: 'bold' }}>{n.title}</div>
                              {!n.seen && <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }} />}
                            </div>
                            <div style={{ opacity: 0.8, fontSize: 14, marginBottom: 8 }}>{n.body}</div>
                            <div style={{ display: 'flex', gap: 10, fontSize: 11, opacity: 0.6 }}>
                              <span>{new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span style={{ color: PRIORITY_LEVELS[n.priority]?.color }}>{PRIORITY_LEVELS[n.priority]?.label}</span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Advanced Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="إعدادات الإشعارات">
        <div style={{ padding: 20 }}>
          <section style={{ marginBottom: 30 }}>
            <h4 style={{ marginBottom: 15 }}>تقسيم الإشعارات</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { id: 'personalized', title: 'مخصص', desc: 'بناءً على اهتماماتك' },
                { id: 'essential', title: 'الأساسي', desc: 'الرسائل والتحذيرات فقط' },
                { id: 'all', title: 'الكل', desc: 'كافة التنبيهات' }
              ].map(seg => (
                <div 
                  key={seg.id} 
                  onClick={() => setSettings({...settings, segmentation: seg.id})}
                  style={{ 
                    padding: 15, 
                    borderRadius: 12, 
                    background: 'rgba(255,255,255,0.05)', 
                    border: settings.segmentation === seg.id ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{seg.title}</div>
                  <div style={{ opacity: 0.6, fontSize: 12 }}>{seg.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 style={{ marginBottom: 15 }}>تفضيلات القنوات</h4>
            <div style={{ display: 'grid', gap: 15 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div>إشعارات الدفع</div>
                  <div style={{ opacity: 0.6, fontSize: 12 }}>تنبيهات فورية</div>
                </div>
                <input type="checkbox" checked={settings.push_enabled} onChange={e => setSettings({...settings, push_enabled: e.target.checked})} />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div>ملخص البريد</div>
                  <div style={{ opacity: 0.6, fontSize: 12 }}>ملخص يومي</div>
                </div>
                <input type="checkbox" checked={settings.email_summary} onChange={e => setSettings({...settings, email_summary: e.target.checked})} />
              </label>
            </div>
          </section>

          <Button style={{ width: '100%', marginTop: 30 }} onClick={() => setShowSettings(false)}>حفظ</Button>
        </div>
      </Modal>
    </MainLayout>
  );
}
