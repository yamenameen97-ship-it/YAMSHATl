import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import {
  broadcastAdminNotification,
  getAdminNotifications,
  markAdminNotificationRead,
} from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const TARGET_ROLE_OPTIONS = [
  { value: '', label: 'كل المستخدمين' },
  { value: 'user', label: 'المستخدمون' },
  { value: 'moderator', label: 'المشرفون' },
  { value: 'admin', label: 'الإدارة' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'الكل' },
  { value: 'unread', label: 'غير مقروء' },
  { value: 'read', label: 'مقروء' },
];

const TYPE_BADGE_COLORS = {
  SYSTEM: { bg: 'rgba(14, 165, 233, 0.18)', fg: '#7dd3fc' },
  ALERT:  { bg: 'rgba(239, 68, 68, 0.18)', fg: '#fca5a5' },
  REPORT: { bg: 'rgba(249, 115, 22, 0.18)', fg: '#fdba74' },
  MESSAGE:{ bg: 'rgba(139, 92, 246, 0.18)', fg: '#c4b5fd' },
  LIKE:   { bg: 'rgba(236, 72, 153, 0.18)', fg: '#f9a8d4' },
  COMMENT:{ bg: 'rgba(34, 197, 94, 0.18)', fg: '#86efac' },
  FOLLOW: { bg: 'rgba(168, 85, 247, 0.18)', fg: '#d8b4fe' },
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', targetRole: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const { pushToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminNotifications(100);
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
    // إعادة تحميل دورية كل 30 ثانية للحفاظ على التحديث الحي
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // قائمة الأنواع المتوفرة (مستخرجة من البيانات الحالية لبناء فلتر ديناميكي)
  const typesAvailable = useMemo(() => {
    const set = new Set();
    notifications.forEach((n) => { if (n?.type) set.add(n.type); });
    return ['all', ...Array.from(set)];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let list = notifications;
    if (statusFilter === 'unread') list = list.filter((n) => !n?.is_read);
    if (statusFilter === 'read') list = list.filter((n) => n?.is_read);
    if (typeFilter !== 'all') list = list.filter((n) => (n?.type || '').toUpperCase() === typeFilter);
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((n) => {
        const haystack = `${n?.title || ''} ${n?.body || ''} ${n?.username || ''}`.toLowerCase();
        return haystack.includes(term);
      });
    }
    return list;
  }, [notifications, statusFilter, typeFilter, searchTerm]);

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
    // توزيع حسب النوع لإحصاء سريع
    const byType = notifications.reduce((acc, n) => {
      const t = n?.type || 'OTHER';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    return { total, unread, broadcasts, today, byType };
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

  const handleMarkRead = async (notification) => {
    if (!notification?.id || notification.is_read) return;
    try {
      setMarkingId(notification.id);
      await markAdminNotificationRead(notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
    } catch {
      pushToast({ title: 'تعذر تحديث الحالة', description: 'يرجى المحاولة لاحقاً.', type: 'error' });
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n?.is_read);
    if (!unread.length) {
      pushToast({ title: 'لا يوجد غير مقروء', description: 'كل الإشعارات معلَّمة كمقروءة.', type: 'info' });
      return;
    }
    try {
      // متوازي
      await Promise.allSettled(unread.map((n) => markAdminNotificationRead(n.id)));
      pushToast({ title: 'تم تحديث الحالة', description: `${unread.length} إشعارات تم تعليمها كمقروءة.`, type: 'success' });
      await loadData();
    } catch {
      pushToast({ title: 'فشل التحديث', description: 'بعض الإشعارات لم تُحدّث.', type: 'error' });
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

            {/* توزيع سريع حسب النوع */}
            {Object.keys(analytics.byType).length > 0 ? (
              <div className="notif-type-distribution" style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(analytics.byType)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([t, c]) => {
                    const tone = TYPE_BADGE_COLORS[t] || { bg: 'rgba(148,163,184,0.18)', fg: '#cbd5e1' };
                    return (
                      <span
                        key={t}
                        style={{
                          background: tone.bg,
                          color: tone.fg,
                          padding: '3px 9px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {t} · {c}
                      </span>
                    );
                  })}
              </div>
            ) : null}

            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="ghost" onClick={handleMarkAllRead} disabled={analytics.unread === 0}>
                تعليم كل غير المقروءة كمقروءة
              </Button>
              <Button variant="ghost" onClick={loadData}>تحديث الآن</Button>
            </div>
          </Card>
        </div>

        <Card title="سجل الإشعارات">
          {/* شريط الفلاتر */}
          <div
            className="notif-filters"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  style={{
                    background: statusFilter === s.value ? 'rgba(139,92,246,0.18)' : 'transparent',
                    color: statusFilter === s.value ? '#c4b5fd' : '#94a3b8',
                    border: '1px solid rgba(148,163,184,0.15)',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
              style={{ maxWidth: 200, padding: '5px 10px', fontSize: 12 }}
            >
              {typesAvailable.map((t) => (
                <option key={t} value={t}>{t === 'all' ? 'كل الأنواع' : t}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="بحث في العنوان/المحتوى/المستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ flex: 1, minWidth: 200, padding: '5px 10px', fontSize: 12 }}
            />

            <span style={{ color: '#94a3b8', fontSize: 12, marginInlineStart: 'auto' }}>
              يظهر {filteredNotifications.length} من {notifications.length}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">جارٍ تحميل السجل...</div>
          ) : !filteredNotifications.length ? (
            <div className="empty-state">
              {notifications.length === 0
                ? 'لا توجد إشعارات متاحة حالياً.'
                : 'لا توجد نتائج تطابق الفلاتر الحالية.'}
            </div>
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
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((item) => {
                    const tone = TYPE_BADGE_COLORS[item.type] || { bg: 'rgba(148,163,184,0.18)', fg: '#cbd5e1' };
                    return (
                      <tr key={item.id} style={{ opacity: item.is_read ? 0.75 : 1 }}>
                        <td><strong>{item.title}</strong></td>
                        <td>{item.body}</td>
                        <td>{item.username || `#${item.user_id}`}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ background: tone.bg, color: tone.fg, fontWeight: 700 }}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td>
                          <span className={`status-dot ${item.is_read ? 'sent' : 'scheduled'}`} />
                          {item.is_read ? 'تمت القراءة' : 'غير مقروء'}
                        </td>
                        <td>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : '—'}</td>
                        <td>
                          {!item.is_read ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkRead(item)}
                              loading={markingId === item.id}
                              disabled={markingId === item.id}
                            >
                              تعليم كمقروء
                            </Button>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: 11 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </AdminLayout>
  );
}
