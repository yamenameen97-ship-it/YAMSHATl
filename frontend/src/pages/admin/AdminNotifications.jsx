import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { broadcastAdminNotification, getAdminNotifications } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({ delivered: 0, opened: 0, failed: 0 });
  const [form, setForm] = useState({ title: '', body: '', segment: 'all', schedule_time: '' });
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  const loadData = async () => {
    try {
      const { data } = await getAdminNotifications();
      setNotifications(data.items || []);
      setAnalytics(data.analytics || analytics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSchedule = async () => {
    try {
      await broadcastAdminNotification(form);
      pushToast({ title: 'Notification Scheduled', description: `Target: ${form.segment}`, type: 'success' });
      setForm({ title: '', body: '', segment: 'all', schedule_time: '' });
      loadData();
    } catch (err) {
      pushToast({ title: 'Scheduling Failed', type: 'error' });
    }
  };

  return (
    <AdminLayout>
      <section className="notifications-dashboard">
        <div className="two-column-grid">
          <Card title="Schedule Push Notification">
            <div className="modal-stack">
              <Input label="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <label className="field">
                <span className="field-label">Message Body</span>
                <textarea className="input" rows="3" value={form.body} onChange={e => setForm({...form, body: e.target.value})} />
              </label>
              <div className="filters-row">
                <label className="field select-field">
                  <span className="field-label">User Segmentation</span>
                  <select className="input" value={form.segment} onChange={e => setForm({...form, segment: e.target.value})}>
                    <option value="all">All Users</option>
                    <option value="active">Active (Last 7 days)</option>
                    <option value="inactive">Inactive</option>
                    <option value="premium">Premium Only</option>
                  </select>
                </label>
                <Input label="Schedule Time" type="datetime-local" value={form.schedule_time} onChange={e => setForm({...form, schedule_time: e.target.value})} />
              </div>
              <Button onClick={handleSchedule}>Schedule & Broadcast</Button>
            </div>
          </Card>

          <Card title="Delivery Analytics">
            <div className="analytics-grid">
              <div className="stat-item">
                <span className="label">Delivered</span>
                <span className="value success">{analytics.delivered}</span>
              </div>
              <div className="stat-item">
                <span className="label">Open Rate</span>
                <span className="value info">{((analytics.opened / analytics.delivered) * 100 || 0).toFixed(1)}%</span>
              </div>
              <div className="stat-item">
                <span className="label">Retry Queue</span>
                <span className="value warning">{analytics.failed}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Notification History & Queue">
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Target Segment</th>
                  <th>Scheduled For</th>
                  <th>Status</th>
                  <th>Analytics</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id}>
                    <td>{n.title}</td>
                    <td><span className="badge">{n.segment}</span></td>
                    <td>{new Date(n.schedule_time).toLocaleString()}</td>
                    <td><span className={`status-dot ${n.status}`}></span> {n.status}</td>
                    <td>{n.open_count} opens / {n.delivery_count} sent</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </AdminLayout>
  );
}
