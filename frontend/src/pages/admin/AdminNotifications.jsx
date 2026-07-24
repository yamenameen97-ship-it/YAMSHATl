import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import {
  broadcastAdminNotification,
  getAdminNotifications,
  sendAdminAlert,
} from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

// v88.54 — لوحة إشعارات المدير العام
// =====================================================
// دُعمت هنا ميزة جديدة: إرسال تنبيه رسمي باسم "ادارة النظام"
// لشخص محدد (بالمعرف أو اسم المستخدم) أو لجميع المشتركين.
// العنوان الذي يظهر عند المشترك ثابت: "ادارة النظام" — لا يظهر اسم
// حساب الأدمن أو اسم المدير العام إطلاقاً. عند المشترك يوجد زر "الرد"
// يفتح فقاعة كتابة الرد وزر "ارسال" — بعد الإرسال يختفي الإشعار من
// عنده. إن لم يرد يبقى الإشعار مقيداً لديه حتى يحذفه هو بنفسه.

const TARGET_ROLE_OPTIONS = [
  { value: '', label: 'كل المستخدمين' },
  { value: 'user', label: 'المستخدمون' },
  { value: 'moderator', label: 'المشرفون' },
  { value: 'admin', label: 'الإدارة' },
];

const ALERT_TARGET_OPTIONS = [
  { value: 'all', label: 'الكل (كل المشتركين)' },
  { value: 'user', label: 'مستخدم محدد' },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', targetRole: '' });
  const [alertForm, setAlertForm] = useState({ body: '', target: 'all', username: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
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
    const alerts = notifications.filter((item) => (item?.type === 'ADMIN_ALERT') || item?.data?.admin_alert).length;
    const today = notifications.filter((item) => {
      if (!item?.created_at) return false;
      const created = new Date(item.created_at);
      const now = new Date();
      return created.toDateString() === now.toDateString();
    }).length;
    return { total, unread, broadcasts, alerts, today };
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

  const handleSendAdminAlert = async () => {
    const body = alertForm.body.trim();
    if (!body) {
      pushToast({ title: 'اكتب نص التنبيه', description: 'حقل المحتوى مطلوب.', type: 'warning' });
      return;
    }
    if (alertForm.target === 'user' && !alertForm.username.trim()) {
      pushToast({ title: 'حدد المستخدم', description: 'اكتب اسم المستخدم أو المعرف.', type: 'warning' });
      return;
    }

    try {
      setSendingAlert(true);
      const rawTarget = alertForm.username.trim().replace(/^@/, '');
      const payload = {
        body,
        target: alertForm.target,
      };
      if (alertForm.target === 'user') {
        // إذا كان رقماً بحتاً نُرسله كـ user_id، وإلا كـ username
        if (/^\d+$/.test(rawTarget)) {
          payload.user_id = Number(rawTarget);
        } else {
          payload.username = rawTarget;
        }
      }
      const { data } = await sendAdminAlert(payload);
      pushToast({
        title: 'تم إرسال التنبيه',
        description: `وصل إلى ${data?.recipients ?? 0} مستخدم باسم "ادارة النظام".`,
        type: 'success',
      });
      setAlertForm({ body: '', target: 'all', username: '' });
      await loadData();
    } catch (error) {
      const detail = error?.response?.data?.detail || 'تحقق من البيانات أو أعد المحاولة.';
      pushToast({ title: 'فشل إرسال التنبيه', description: detail, type: 'error' });
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <AdminLayout>
      <section className="notifications-dashboard">
        <div className="two-column-grid">
          {/* v88.54 — بطاقة تنبيه "ادارة النظام" */}
          <Card title='إرسال تنبيه باسم "ادارة النظام"'>
            <div className="modal-stack">
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
                يظهر عند المشترك بعنوان ثابت <strong>"ادارة النظام"</strong> — لا يظهر
                اسم حسابك أو اسم المدير العام. المشترك يستطيع فتح التنبيه والرد عليه.
                بعد الرد يختفي الإشعار من عنده تلقائياً. إن لم يرد يبقى مقيداً لديه
                حتى يحذفه بنفسه.
              </div>

              <label className="field select-field">
                <span className="field-label">المستلم</span>
                <select
                  className="input"
                  value={alertForm.target}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, target: e.target.value }))}
                >
                  {ALERT_TARGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {alertForm.target === 'user' ? (
                <Input
                  label="اسم المستخدم أو المعرف"
                  placeholder="username أو 123"
                  value={alertForm.username}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              ) : null}

              <label className="field">
                <span className="field-label">محتوى التنبيه</span>
                <textarea
                  className="input"
                  rows="4"
                  maxLength={1000}
                  placeholder="اكتب نص التنبيه الذي سيصل المشترك..."
                  value={alertForm.body}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, body: e.target.value }))}
                />
              </label>

              <Button onClick={handleSendAdminAlert} loading={sendingAlert} disabled={sendingAlert}>
                {sendingAlert ? 'جارٍ الإرسال...' : 'إرسال التنبيه'}
              </Button>
            </div>
          </Card>

          {/* البطاقة الأصلية — إشعار عام (broadcast) */}
          <Card title="إرسال إشعار عام (Broadcast)">
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
        </div>

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
              <span className="label">تنبيهات إدارة النظام</span>
              <span className="value info">{analytics.alerts}</span>
            </div>
            <div className="stat-item">
              <span className="label">اليوم</span>
              <span className="value warning">{analytics.today}</span>
            </div>
          </div>
        </Card>

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
