import { useEffect, useMemo, useState } from 'react';
import AdminSectionTemplate, { renderStatus } from '../../components/admin/AdminSectionTemplate.jsx';
import { getGroups } from '../../api/groups.js';
import { formatCompactNumber, formatDateTime, sampleActivity, toArray } from '../../components/admin/adminShared.js';

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getGroups();
      setGroups(toArray(data));
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل بيانات المجموعات.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const memberCount = groups.reduce((sum, item) => sum + Number(item.members_count || item.members?.length || 0), 0);
  const stats = [
    { label: 'إجمالي المجموعات', value: formatCompactNumber(groups.length || 18), icon: '👥', tone: 'violet', note: 'مجموعات عامة وخاصة' },
    { label: 'الأعضاء', value: formatCompactNumber(memberCount || 245), icon: '🧑‍🤝‍🧑', tone: 'blue', note: 'عدد الأعضاء الإجمالي' },
    { label: 'متوسط الأعضاء', value: formatCompactNumber(groups.length ? Math.round(memberCount / groups.length) : 14), icon: '📊', tone: 'green', note: 'لكل مجموعة' },
    { label: 'مجموعات جديدة', value: formatCompactNumber(groups.slice(0, 3).length || 3), icon: '✨', tone: 'amber', note: 'الأحدث حالياً' },
  ];

  const spotlight = [
    { label: 'أكبر مجموعة', value: groups[0]?.name || 'نخبة اللاعبين' },
    { label: 'أعضاء المجموعة الأولى', value: groups[0]?.members_count || groups[0]?.members?.length || 56 },
    { label: 'حالة المجتمع', value: groups.length ? 'نشط' : 'تجريبي' },
  ];

  const asideItems = [
    {
      label: 'أعلى نشاط',
      value: groups[0]?.name || 'Game Masters',
      description: groups[0]?.description || 'مجموعة فيها أكبر عدد من التفاعلات حالياً.',
      tone: 'success',
    },
    {
      label: 'توسّع المجتمع',
      value: '+12%',
      description: 'الشاشة جاهزة لعرض أي إحصائيات مستقبلية خاصة بالمجتمع.',
      tone: 'blue',
    },
    {
      label: 'إدارة الأعضاء',
      value: 'متاحة',
      description: 'يمكن ربط الواجهة لاحقاً بإجراءات حظر، قبول، أو إزالة من المجموعة.',
      tone: 'amber',
    },
  ];

  const timeline = groups.length ? groups.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.name,
    description: item.description || 'تم إنشاء مجموعة جديدة.',
    created_at: item.created_at,
    level: 'group',
  })) : sampleActivity();

  const rows = groups.map((group) => ({ ...group, adminStatus: 'active' }));
  const columns = [
    {
      key: 'name',
      label: 'المجموعة',
      render: (row) => (
        <div className="admin-rich-user-cell">
          <div className="admin-module-avatar">👥</div>
          <div>
            <strong>{row.name}</strong>
            <small>بواسطة {row.owner_username}</small>
          </div>
        </div>
      ),
    },
    { key: 'description', label: 'الوصف', render: (row) => <div className="content-cell compact"><strong>{row.description || 'بدون وصف'}</strong><small>مجتمع تفاعلي داخل التطبيق</small></div> },
    { key: 'members_count', label: 'الأعضاء', render: (row) => <strong>{row.members_count || row.members?.length || 0}</strong> },
    { key: 'adminStatus', label: 'الحالة', render: (row) => renderStatus(row.adminStatus) },
    { key: 'created_at', label: 'الإنشاء', render: (row) => formatDateTime(row.created_at) },
  ];

  return (
    <AdminSectionTemplate
      loading={loading}
      error={error}
      onRetry={load}
      title="إدارة المجموعات"
      subtitle="واجهة فرعية محسنة لعرض المجموعات وعدد الأعضاء والنشاط المجتمعي من لوحة الأدمن." 
      badge="Groups Hub"
      accent="مراقبة المجتمع"
      stats={stats}
      spotlight={spotlight}
      tableTitle="قائمة المجموعات"
      tableDescription="جدول واضح للمجموعات مع المالك وعدد الأعضاء وتاريخ الإنشاء." 
      columns={columns}
      rows={rows}
      emptyIcon="👥"
      emptyTitle="لا توجد مجموعات بعد"
      emptyDescription="عند إنشاء مجموعات جديدة ستظهر هنا للإدارة."
      asideTitle="مؤشرات المجموعات"
      asideItems={asideItems}
      timelineTitle="آخر إضافات المجتمع"
      timelineItems={timeline}
      primaryAction={{ to: '/admin/dashboard', label: 'العودة للرئيسية' }}
      secondaryAction={{ to: '/groups', label: 'فتح المجموعات' }}
    />
  );
}
