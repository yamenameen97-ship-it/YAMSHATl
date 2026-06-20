import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { broadcastAdminNotification, getAdminNotifications } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const TARGET_ROLE_OPTIONS = [
  { value: '', label: 'كل المستخدمين' },
  { value: 'user', label: 'المستخدمون' },
  { value: 'moderator', label: 'المشرفون' },
  { value: 'admin', label: 'الإدارة' },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', targetRole: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { pushToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminNotifications(50);
      setNotifications(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      setNotifications([]);
      pushToast({ title: 'تعذر تحميل الإشعارات', description: 'حاول مرة أخرى بعد قليل.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analytics = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((item) => !item?.is_read).length;
    const broadcasts = notifications.filter((item) => item?.data?.broadcast).length;
    const today = notifications.filter((item) => {
      if (!item?.created_at) return false;
      const created = new Date(item.created_at);
      const now = new Date();
      return created.toDateString() === now.toDateString();
    }).length;
    return { total, unread, broadcasts, today };
  }, [notifications]);

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      pushToast({ title: 'البيانات ناقصة', description: 'اكتب العنوان والمحتوى أولاً.', type: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await broadcastAdminNotification({
        title: form.title.trim(),
        body: form.body.trim(),
        type: 'SYSTEM',
        target_role: form.targetRole || null,
      });
      pushToast({
        title: 'تم إرسال الإشعار',
        description: `تمت المعالجة لـ ${data?.recipients ?? 0} مستخدم.`,
        type: 'success',
      });
      setForm({ title: '', body: '', targetRole: '' });
      await loadData();
    } catch (error) {
      pushToast({ title: 'فشل إرسال الإشعار', description: 'تحقق من الصلاحيات أو أعد المحاولة.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <section className="notifications-dashboard">
        <div className="two-column-grid">
          <Card title="إرسال إشعار فوري">
            <div className="modal-stack">
              <Input label="العنوان" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
              <label className="field">
                <span className="field-label">محتوى الإشعار</span>
                <textarea className="input" rows="4" value={form.body} onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))} />
              </label>
              <label className="field select-field">
                <span className="field-label">الفئة المستهدفة</span>
                <select className="input" value={form.targetRole} onChange={(e) => setForm((prev) => ({ ...prev, targetRole: e.target.value }))}>
                  {TARGET_ROLE_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <Button onClick={handleBroadcast} loading={submitting} disabled={submitting}>
                {submitting ? 'جارٍ الإرسال...' : 'إرسال الآن'}
              </Button>
            </div>
          </Card>

          <Card title="ملخص الإشعارات">
            <div className="analytics-grid">
              <div className="stat-item">
                <span className="label">إجمالي الإشعارات</span>
                <span className="value">{analytics.total}</span>
              </div>
              <div className="stat-item">
                <span className="label">غير مقروء</span>
                <span className="value info">{analytics.unread}</span>
              </div>
              <div className="stat-item">
                <span className="label">إشعارات جماعية</span>
                <span className="value success">{analytics.broadcasts}</span>
              </div>
              <div className="stat-item">
                <span className="label">اليوم</span>
                <span className="value warning">{analytics.today}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card title="سجل الإشعارات">
          {loading ? (
            <div className="empty-state">جارٍ تحميل السجل...</div>
          ) : !notifications.length ? (
            <div className="empty-state">لا توجد إشعارات متاحة حالياً.</div>
          ) : (
            <div className="table-shell">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>المحتوى</th>
                    <th>المستخدم</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                    <th>التوقيت</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.body}</td>
                      <td>{item.username || `#${item.user_id}`}</td>
                      <td><span className="badge">{item.type}</span></td>
                      <td>
                        <span className={`status-dot ${item.is_read ? 'sent' : 'scheduled'}`} />
                        {item.is_read ? 'تمت القراءة' : 'غير مقروء'}
                      </td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </AdminLayout>
  );
}
