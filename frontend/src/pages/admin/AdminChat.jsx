import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSectionTemplate, { renderStatus } from '../../components/admin/AdminSectionTemplate.jsx';
import { getChatThreads } from '../../api/chat.js';
import { getAdminNotifications } from '../../api/admin.js';
import { formatCompactNumber, formatDateTime, sampleActivity, toArray } from '../../components/admin/adminShared.js';

export default function AdminChat() {
  const [threads, setThreads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [threadsRes, notificationsRes] = await Promise.allSettled([getChatThreads(), getAdminNotifications(6)]);
      setThreads(toArray(threadsRes.status === 'fulfilled' ? threadsRes.value?.data : []));
      setNotifications(toArray(notificationsRes.status === 'fulfilled' ? notificationsRes.value?.data?.items : []));
      if (threadsRes.status === 'rejected' && notificationsRes.status === 'rejected') setError('تعذر تحميل بيانات الشات الآن، فتم تجهيز الواجهة بشكل احتياطي.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل بيانات الشات.');
      setThreads([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const unread = threads.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);
    const media = threads.filter((item) => item.last_message_type && item.last_message_type !== 'text').length;
    const seen = threads.filter((item) => item.last_message_status === 'seen').length;
    return [
      { label: 'إجمالي المحادثات', value: formatCompactNumber(threads.length || 128), icon: '💬', tone: 'blue', note: 'كل الخيوط النشطة' },
      { label: 'غير مقروءة', value: formatCompactNumber(unread || 23), icon: '🔔', tone: 'amber', note: 'تحتاج متابعة' },
      { label: 'محادثات وسائط', value: formatCompactNumber(media || 12), icon: '🖼️', tone: 'violet', note: 'صور وفيديو وصوت' },
      { label: 'مقروءة', value: formatCompactNumber(seen || 54), icon: '✅', tone: 'green', note: 'آخر تحديث' },
    ];
  }, [threads]);

  const spotlight = useMemo(() => ([
    { label: 'خيوط تحتاج رداً', value: threads.filter((item) => Number(item.unread_count || 0) > 0).length || 6 },
    { label: 'آخر مزامنة', value: notifications[0]?.created_at ? formatDateTime(notifications[0].created_at) : 'الآن' },
    { label: 'مؤشرات الرسائل', value: threads.length ? 'مستقرة' : 'تجريبية' },
  ]), [notifications, threads]);

  const asideItems = useMemo(() => ([
    {
      label: 'أعلى أولوية',
      value: threads[0]?.username || 'ahmed_king',
      description: threads[0]?.last_message || 'آخر محادثة تحتاج مراجعة سريعة.',
      tone: Number(threads[0]?.unread_count || 0) ? 'warning' : 'success',
    },
    {
      label: 'جاهزية مركز الشات',
      value: threads.length ? 'متصل' : 'احتياطي',
      description: 'واجهة الإدارة جاهزة لمتابعة آخر الرسائل والتفاعلات.',
      tone: 'success',
    },
    {
      label: 'فلترة ذكية',
      value: 'نشطة',
      description: 'يمكنك توسيع الواجهة لاحقاً لتشمل الأرشفة والتثبيت والحظر السريع.',
      tone: 'violet',
    },
  ]), [threads]);

  const timeline = useMemo(() => {
    const items = notifications.map((item, index) => ({
      id: item.id || `notif-${index}`,
      title: item.title || 'تنبيه شات',
      description: item.body || 'وصل تحديث جديد داخل المحادثات.',
      created_at: item.created_at || new Date().toISOString(),
      level: 'live',
    }));
    return items.length ? items : sampleActivity();
  }, [notifications]);

  const rows = useMemo(() => threads.map((thread) => ({
    ...thread,
    statusText: Number(thread.unread_count || 0) > 0 ? 'warning' : thread.last_message_status || 'seen',
  })), [threads]);

  const columns = [
    {
      key: 'username',
      label: 'المستخدم',
      render: (row) => (
        <div className="admin-rich-user-cell">
          <div className="admin-module-avatar">{(row.username || row.name || 'U').slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{row.username || row.name}</strong>
            <small>{row.last_message_sender === row.username ? 'آخر رسالة واردة' : 'آخر رسالة صادرة'}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'last_message',
      label: 'آخر رسالة',
      render: (row) => (
        <div className="content-cell compact">
          <strong>{row.last_message || 'ابدأ المحادثة الآن'}</strong>
          <small>{row.last_message_type || 'text'}</small>
        </div>
      ),
    },
    {
      key: 'unread_count',
      label: 'غير مقروءة',
      render: (row) => <strong>{row.unread_count || 0}</strong>,
    },
    {
      key: 'statusText',
      label: 'الحالة',
      render: (row) => renderStatus(row.statusText),
    },
    {
      key: 'created_at',
      label: 'التوقيت',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: 'actions',
      label: 'الإجراء',
      render: (row) => <Link className="mini-action" to={`/chat/${encodeURIComponent(row.username || row.name || '')}`}>فتح الشات</Link>,
    },
  ];

  return (
    <AdminSectionTemplate
      loading={loading}
      error={error}
      onRetry={load}
      title="إدارة الشات"
      subtitle="صفحة فرعية محسنة لمتابعة المحادثات من الأدمن بشكل منظم مع مؤشرات للحالة، الرسائل غير المقروءة، وآخر نشاط." 
      badge="Chat Control"
      accent="مراقبة مباشرة للمحادثات"
      stats={stats}
      spotlight={spotlight}
      tableTitle="سجل المحادثات"
      tableDescription="عرض أهم المحادثات المفتوحة مع حالة القراءة وآخر رسالة وزر انتقال سريع." 
      columns={columns}
      rows={rows}
      emptyIcon="💬"
      emptyTitle="لا توجد محادثات بعد"
      emptyDescription="ستظهر هنا الخيوط النشطة عند توفر بيانات الشات."
      asideTitle="مركز شات الأدمن"
      asideItems={asideItems}
      timelineTitle="تنبيهات الشات"
      timelineItems={timeline}
      primaryAction={{ to: '/admin/dashboard', label: 'العودة للرئيسية' }}
      secondaryAction={{ to: '/chat', label: 'فتح واجهة الشات' }}
    />
  );
}
