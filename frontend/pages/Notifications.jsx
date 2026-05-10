import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getNotifications, markNotificationsRead } from '../api/notifications.js';

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '🔔' },
  { id: 'chat', label: 'الرسائل', icon: '💬' },
  { id: 'interaction', label: 'التفاعلات', icon: '❤️' },
  { id: 'system', label: 'النظام', icon: '⚙️' }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    push_enabled: true,
    email_summary: false,
    chat_alerts: true,
    interaction_alerts: true,
    segmentation: 'personalized' // personalized, all, essential
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data } = await getNotifications();
    setNotifications(data || []);
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>الإشعارات</h2>
          <Button variant="secondary" size="small" onClick={() => setShowSettings(true)}>⚙️ الإعدادات المتقدمة</Button>
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
                gap: 8
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.length === 0 ? (
            <Card style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div className="muted">لا توجد إشعارات حالياً</div>
            </Card>
          ) : (
            filtered.map(n => (
              <Card key={n.id} style={{ padding: 16, display: 'flex', gap: 15, alignItems: 'flex-start', opacity: n.seen ? 0.7 : 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {n.category === 'chat' ? '💬' : n.category === 'interaction' ? '❤️' : '⚙️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{n.title}</div>
                  <div className="muted" style={{ fontSize: 14 }}>{n.body}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>{new Date(n.created_at).toLocaleString('ar-EG')}</div>
                </div>
                {!n.seen && <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', marginTop: 6 }} />}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Advanced Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="إعدادات الإشعارات المتقدمة">
        <div style={{ padding: 20 }}>
          <section style={{ marginBottom: 30 }}>
            <h4 style={{ marginBottom: 15 }}>تقسيم الإشعارات (Push Segmentation)</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { id: 'personalized', title: 'مخصص (Personalized)', desc: 'إشعارات بناءً على اهتماماتك وتفاعلاتك فقط' },
                { id: 'essential', title: 'الأساسي فقط (Essential)', desc: 'الرسائل والتحذيرات الأمنية فقط' },
                { id: 'all', title: 'الكل (All)', desc: 'استلام كافة التنبيهات دون استثناء' }
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
                  <div className="muted" style={{ fontSize: 12 }}>{seg.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 style={{ marginBottom: 15 }}>تفضيلات القنوات</h4>
            <div style={{ display: 'grid', gap: 15 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div>إشعارات الدفع (Push)</div>
                  <div className="muted" style={{ fontSize: 12 }}>تنبيهات فورية على المتصفح/الجهاز</div>
                </div>
                <input type="checkbox" checked={settings.push_enabled} onChange={e => setSettings({...settings, push_enabled: e.target.checked})} />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div>ملخص البريد الإلكتروني</div>
                  <div className="muted" style={{ fontSize: 12 }}>إرسال ملخص يومي للنشاط الفائت</div>
                </div>
                <input type="checkbox" checked={settings.email_summary} onChange={e => setSettings({...settings, email_summary: e.target.checked})} />
              </label>
            </div>
          </section>

          <Button style={{ width: '100%', marginTop: 30 }} onClick={() => setShowSettings(false)}>حفظ الإعدادات</Button>
        </div>
      </Modal>
    </MainLayout>
  );
}
