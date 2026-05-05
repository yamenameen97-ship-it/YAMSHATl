import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { broadcastAdminNotification, getAdminNotifications } from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const notificationTemplates = [
  { label: 'صيانة مجدولة', title: 'تنبيه صيانة', body: 'سيتم تنفيذ صيانة سريعة على المنصة خلال وقت قصير.', type: 'ALERT' },
  { label: 'إطلاق ميزة', title: 'تحديث جديد', body: 'تم إطلاق تحسينات جديدة داخل التطبيق ولوحة التحكم.', type: 'UPDATE' },
  { label: 'إشعار عام', title: 'إشعار من الإدارة', body: 'يرجى مراجعة آخر التحديثات داخل التطبيق.', type: 'SYSTEM' },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ title: '', body: '', type: 'SYSTEM', target_role: '' });
  const { pushToast } = useToast();

  const loadNotifications = async () => {
    const { data } = await getAdminNotifications(60);
    setNotifications(data.items || []);
  };

  useEffect(() => {
    loadNotifications();
    const onAdminNotification = (payload) => {
      setNotifications((prev) => [{ id: `live-${Date.now()}`, ...payload, username: 'broadcast', is_read: false }, ...prev].slice(0, 60));
    };
    socket.on('admin:notification', onAdminNotification);
    return () => {
      socket.off('admin:notification', onAdminNotification);
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const typeMatch = filterType === 'ALL' || item.type === filterType;
      const text = `${item.title} ${item.body} ${item.username || ''}`.toLowerCase();
      const queryMatch = !query.trim() || text.includes(query.trim().toLowerCase());
      return typeMatch && queryMatch;
    });
  }, [filterType, notifications, query]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((item) => !item.is_read).length,
    system: notifications.filter((item) => item.type === 'SYSTEM').length,
    alert: notifications.filter((item) => item.type === 'ALERT').length,
    update: notifications.filter((item) => item.type === 'UPDATE').length,
  }), [notifications]);

  const handleSend = async () => {
    await broadcastAdminNotification({ ...form, target_role: form.target_role || null });
    pushToast({ title: 'تم إرسال الإشعار', description: form.title, type: 'success' });
    setForm({ title: '', body: '', type: 'SYSTEM', target_role: '' });
    loadNotifications();
  };

  return (
    <AdminLayout>
      <section className="two-column-grid">
        <Card>
          <div className="card-head split">
            <h3 className="section-title">إرسال إشعار جماعي</h3>
            <span className="live-pill"><span className="status-dot live-dot" />بث مباشر</span>
          </div>
          <div className="modal-stack">
            <div className="quick-template-row">
              {notificationTemplates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  className="mini-action"
                  onClick={() => setForm({ title: template.title, body: template.body, type: template.type, target_role: '' })}
                >
                  {template.label}
                </button>
              ))}
            </div>
            <Input label="العنوان" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="عنوان الإشعار" />
            <label className="field"><span className="field-label">الرسالة</span><textarea className="input textarea" rows="5" value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} placeholder="نص الإشعار" /></label>
            <div className="filters-row wrap">
              <label className="field select-field"><span className="field-label">النوع</span><select className="input" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}><option value="SYSTEM">SYSTEM</option><option value="ALERT">ALERT</option><option value="UPDATE">UPDATE</option></select></label>
              <label className="field select-field"><span className="field-label">الفئة المستهدفة</span><select className="input" value={form.target_role} onChange={(event) => setForm((prev) => ({ ...prev, target_role: event.target.value }))}><option value="">كل الأدوار</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="user">User</option></select></label>
            </div>
            <Button onClick={handleSend}>إرسال الآن</Button>
          </div>
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">مؤشرات المركز</h3></div>
          <div className="status-list compact-grid">
            <div><strong>{stats.total}</strong><span>الإجمالي</span></div>
            <div><strong>{stats.unread}</strong><span>غير مقروء</span></div>
            <div><strong>{stats.system}</strong><span>System</span></div>
            <div><strong>{stats.alert}</strong><span>Alert</span></div>
          </div>
          <div className="dashboard-mini-summary with-top-gap">
            <div><strong>{stats.update}</strong><span>Update</span></div>
            <div><strong>{filteredNotifications.length}</strong><span>بعد الفلترة</span></div>
            <div><strong>{notifications[0]?.created_at ? new Date(notifications[0].created_at).toLocaleTimeString('ar-EG') : '—'}</strong><span>آخر وصول</span></div>
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head split">
          <div>
            <h3 className="section-title">مركز الإشعارات</h3>
            <p className="muted no-margin">فلترة فورية، تحديث لحظي، وإدارة رسائل النظام كما في لوحات المنصات الحديثة.</p>
          </div>
          <div className="filters-row wrap">
            <Input label="بحث" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث في العنوان أو المحتوى" />
            <label className="field select-field"><span className="field-label">النوع</span><select className="input" value={filterType} onChange={(event) => setFilterType(event.target.value)}><option value="ALL">الكل</option><option value="SYSTEM">SYSTEM</option><option value="ALERT">ALERT</option><option value="UPDATE">UPDATE</option></select></label>
          </div>
        </div>
        <div className="timeline-list">
          {filteredNotifications.map((item) => (
            <div key={item.id} className="notification-row-card enhanced-notification-row">
              <div>
                <div className="notification-header-inline">
                  <strong>{item.title}</strong>
                  <span className={`role-pill ${item.type === 'ALERT' ? 'admin' : item.type === 'UPDATE' ? 'moderator' : 'neutral'}`}>{item.type}</span>
                </div>
                <p>{item.body}</p>
                <small>{item.username || 'system'} · {item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</small>
              </div>
              <span className={`status-pill ${item.is_read ? 'active' : 'banned'}`}>{item.is_read ? 'Read' : 'Unread'}</span>
            </div>
          ))}
          {!filteredNotifications.length ? <div className="table-empty">لا توجد نتائج مطابقة للفلاتر الحالية.</div> : null}
        </div>
      </Card>
    </AdminLayout>
  );
}
