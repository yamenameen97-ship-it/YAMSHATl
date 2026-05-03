import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { broadcastAdminNotification, getAdminNotifications } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', type: 'SYSTEM', target_role: '' });
  const { pushToast } = useToast();

  const loadNotifications = async () => {
    const { data } = await getAdminNotifications(50);
    setNotifications(data.items || []);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

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
          <div className="card-head"><h3 className="section-title">إرسال إشعار جماعي</h3></div>
          <div className="modal-stack">
            <Input label="Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="عنوان الإشعار" />
            <label className="field"><span className="field-label">Body</span><textarea className="input textarea" rows="5" value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} placeholder="نص الإشعار" /></label>
            <div className="filters-row wrap">
              <label className="field select-field"><span className="field-label">Type</span><select className="input" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}><option value="SYSTEM">SYSTEM</option><option value="ALERT">ALERT</option><option value="UPDATE">UPDATE</option></select></label>
              <label className="field select-field"><span className="field-label">Target role</span><select className="input" value={form.target_role} onChange={(event) => setForm((prev) => ({ ...prev, target_role: event.target.value }))}><option value="">All roles</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="user">User</option></select></label>
            </div>
            <Button onClick={handleSend}>إرسال الآن</Button>
          </div>
        </Card>

        <Card>
          <div className="card-head"><h3 className="section-title">ملخص المركز</h3></div>
          <div className="status-list compact-grid">
            <div><strong>{notifications.length}</strong><span>إشعار</span></div>
            <div><strong>{notifications.filter((item) => !item.is_read).length}</strong><span>غير مقروء</span></div>
            <div><strong>{notifications.filter((item) => item.type === 'SYSTEM').length}</strong><span>System</span></div>
            <div><strong>{notifications.filter((item) => item.type === 'ALERT').length}</strong><span>Alert</span></div>
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head"><h3 className="section-title">Notifications Center</h3></div>
        <div className="timeline-list">
          {notifications.map((item) => (
            <div key={item.id} className="notification-row-card">
              <div>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>{item.username} · {new Date(item.created_at).toLocaleString('ar-EG')}</small>
              </div>
              <span className={`status-pill ${item.is_read ? 'active' : 'banned'}`}>{item.is_read ? 'Read' : 'Unread'}</span>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
