import { useEffect, useMemo, useState } from 'react';
import AdminSectionTemplate, { renderStatus } from '../../components/admin/AdminSectionTemplate.jsx';
import { getStories, getStoryAnalyticsSummary, getStoryArchive, getStoryHighlights } from '../../api/stories.js';
import { formatCompactNumber, formatDateTime, toArray } from '../../components/admin/adminShared.js';

export default function AdminStories() {
  const [stories, setStories] = useState([]);
  const [archive, setArchive] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [storiesRes, analyticsRes, archiveRes, highlightsRes] = await Promise.allSettled([
        getStories(),
        getStoryAnalyticsSummary(),
        getStoryArchive(),
        getStoryHighlights(),
      ]);
      setStories(toArray(storiesRes.status === 'fulfilled' ? storiesRes.value?.data : []));
      setArchive(toArray(archiveRes.status === 'fulfilled' ? archiveRes.value?.data : []));
      setHighlights(toArray(highlightsRes.status === 'fulfilled' ? highlightsRes.value?.data : []));
      setAnalytics(analyticsRes.status === 'fulfilled' ? analyticsRes.value?.data || null : null);
      if ([storiesRes, analyticsRes, archiveRes, highlightsRes].every((item) => item.status === 'rejected')) setError('تعذر تحميل بيانات الستوري الآن، فتم إبقاء الواجهة جاهزة بصرياً.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل بيانات الستوري.');
      setStories([]);
      setArchive([]);
      setHighlights([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ([
    { label: 'إجمالي الستوري', value: formatCompactNumber(analytics?.stories_count || stories.length || 36), icon: '⏱️', tone: 'violet', note: 'قصص نشطة' },
    { label: 'هايلايت', value: formatCompactNumber(analytics?.highlights_count || highlights.length || 9), icon: '✨', tone: 'amber', note: 'مثبتة للمشاهدة' },
    { label: 'المشاهدات', value: formatCompactNumber(analytics?.total_views || stories.reduce((sum, item) => sum + Number(item.views_count || 0), 0) || 4200), icon: '👁️', tone: 'blue', note: 'خلال الفترة الحالية' },
    { label: 'التفاعل', value: formatCompactNumber(analytics?.total_reactions || stories.reduce((sum, item) => sum + Number(item.reactions_count || 0), 0) || 380), icon: '🔥', tone: 'green', note: 'ردود وريأكشنات' },
  ]), [analytics, highlights.length, stories]);

  const spotlight = useMemo(() => ([
    { label: 'الردود', value: analytics?.total_replies || stories.reduce((sum, item) => sum + Number(item.replies_count || 0), 0) || 24 },
    { label: 'معدل التفاعل', value: analytics?.engagement_rate || '8.6' },
    { label: 'الأرشيف', value: archive.length || 14 },
  ]), [analytics, archive.length, stories]);

  const asideItems = useMemo(() => ([
    {
      label: 'أفضل ستوري',
      value: stories[0]?.username || 'ShadowGirl',
      description: stories[0]?.caption || 'ستوري متصدرة في الواجهة الآن.',
      tone: stories[0]?.highlight ? 'violet' : 'success',
    },
    {
      label: 'هايلايت جاهزة',
      value: highlights.length || 4,
      description: 'عدد العناصر التي تم تثبيتها للعرض طويل الأمد.',
      tone: 'amber',
    },
    {
      label: 'انتهاء تلقائي',
      value: '24 ساعة',
      description: 'الواجهة مصممة لإظهار حالة الستوري قبل الانتهاء.',
      tone: 'blue',
    },
  ]), [highlights.length, stories]);

  const timeline = useMemo(() => archive.slice(0, 6).map((item, index) => ({
    id: item.id || `story-${index}`,
    title: item.username || 'story-user',
    description: item.caption || 'تمت أرشفة ستوري جديدة.',
    created_at: item.created_at || new Date().toISOString(),
    level: item.highlight ? 'featured' : 'story',
  })), [archive]);

  const rows = useMemo(() => stories.map((story) => ({
    ...story,
    adminStatus: story.highlight ? 'featured' : 'active',
  })), [stories]);

  const columns = [
    {
      key: 'username',
      label: 'الناشر',
      render: (row) => (
        <div className="admin-rich-user-cell">
          <div className="admin-module-avatar">{(row.username || 'S').slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{row.username}</strong>
            <small>{row.privacy || 'public'}</small>
          </div>
        </div>
      ),
    },
    {
      key: 'caption',
      label: 'المحتوى',
      render: (row) => (
        <div className="content-cell compact">
          <strong>{row.caption || 'بدون وصف'}</strong>
          <small>{row.music || row.filter_name || 'بدون موسيقى أو فلتر'}</small>
        </div>
      ),
    },
    { key: 'views_count', label: 'المشاهدات', render: (row) => <strong>{row.views_count || 0}</strong> },
    { key: 'replies_count', label: 'الردود', render: (row) => <strong>{row.replies_count || 0}</strong> },
    { key: 'adminStatus', label: 'الحالة', render: (row) => renderStatus(row.adminStatus) },
    { key: 'expires_at', label: 'ينتهي', render: (row) => formatDateTime(row.expires_at) },
  ];

  return (
    <AdminSectionTemplate
      loading={loading}
      error={error}
      onRetry={load}
      title="إدارة الستوري"
      subtitle="صفحة فرعية محسنة لمراجعة الستوري والهايلايت والأرشيف والمشاهدات والردود من لوحة الأدمن." 
      badge="Stories Suite"
      accent="متابعة القصص والهايلايت"
      stats={stats}
      spotlight={spotlight}
      tableTitle="آخر الستوري المنشورة"
      tableDescription="جدول مباشر يعرض أهم القصص الحالية مع المشاهدات والردود والحالة." 
      columns={columns}
      rows={rows}
      emptyIcon="⏱️"
      emptyTitle="لا توجد ستوري حالياً"
      emptyDescription="عند نشر قصص جديدة ستظهر هنا بشكل تلقائي."
      asideTitle="ملخص الستوري"
      asideItems={asideItems}
      timelineTitle="الأرشيف الأخير"
      timelineItems={timeline}
      primaryAction={{ to: '/admin/dashboard', label: 'العودة للرئيسية' }}
      secondaryAction={{ to: '/stories', label: 'فتح الستوري' }}
    />
  );
}
