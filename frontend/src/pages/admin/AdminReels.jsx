import { useEffect, useMemo, useState } from 'react';
import AdminSectionTemplate, { renderStatus } from '../../components/admin/AdminSectionTemplate.jsx';
import { getPosts } from '../../api/posts.js';
import { formatCompactNumber, formatDateTime, sampleActivity, toArray } from '../../components/admin/adminShared.js';

const reelUrl = (item) => item?.media_urls?.[0] || item?.media || item?.image_url || '';
const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));

export default function AdminReels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getPosts({ skip: 0, limit: 30 });
      const items = toArray(data).filter((item) => isVideo(reelUrl(item)));
      setReels(items);
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل بيانات الريلز.');
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const engagementTotal = reels.reduce((sum, item) => sum + Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0), 0);
  const stats = [
    { label: 'إجمالي الريلز', value: formatCompactNumber(reels.length || 22), icon: '🎬', tone: 'violet', note: 'مقاطع فيديو قصيرة' },
    { label: 'التفاعل', value: formatCompactNumber(engagementTotal || 2500), icon: '🔥', tone: 'green', note: 'إجمالي اللايكات والتعليقات والمشاركات' },
    { label: 'أفضل منشئ', value: reels[0]?.username || 'KhaledGamer', icon: '🏆', tone: 'amber', note: 'أعلى ظهور حالي' },
    { label: 'محتوى قابل للمراجعة', value: formatCompactNumber(reels.slice(0, 4).length || 4), icon: '🛡️', tone: 'blue', note: 'جاهز للمراجعة' },
  ];

  const spotlight = [
    { label: 'أعلى تفاعل', value: formatCompactNumber(Math.max(...reels.map((item) => Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0)), 1800)) },
    { label: 'أحدث ريل', value: reels[0]?.created_at ? formatDateTime(reels[0].created_at) : 'الآن' },
    { label: 'حالة النشر', value: reels.length ? 'نشطة' : 'احتياطية' },
  ];

  const asideItems = [
    {
      label: 'الريل المتصدر',
      value: reels[0]?.username || 'PlayerOne',
      description: reels[0]?.content || 'أفضل لقطات هذا الأسبوع.',
      tone: 'success',
    },
    {
      label: 'فيديوهات عالية الجاهزية',
      value: reels.filter((item) => Number(item.comments_count || 0) > 0).length || 7,
      description: 'يمكنك ربطها لاحقاً بإجراءات تثبيت أو إخفاء أو مراجعة.',
      tone: 'violet',
    },
    {
      label: 'قناة نمو سريع',
      value: '+19%',
      description: 'واجهة الريلز مصممة لتعكس طبيعة المحتوى القصير عالي التفاعل.',
      tone: 'amber',
    },
  ];

  const timeline = reels.length ? reels.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.username || 'creator',
    description: item.content || 'تم نشر ريل جديد.',
    created_at: item.created_at,
    level: 'featured',
  })) : sampleActivity();

  const rows = reels.map((item) => ({
    ...item,
    adminStatus: Number(item.comments_count || 0) > 0 ? 'active' : 'review',
    engagement: Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0),
  }));

  const columns = [
    {
      key: 'content',
      label: 'الريل',
      render: (row) => (
        <div className="admin-rich-user-cell">
          <div className="admin-module-avatar">🎬</div>
          <div>
            <strong>{row.content?.slice(0, 36) || 'ريل جديد'}</strong>
            <small>@{row.username || 'creator'}</small>
          </div>
        </div>
      ),
    },
    { key: 'engagement', label: 'التفاعل', render: (row) => <strong>{formatCompactNumber(row.engagement)}</strong> },
    { key: 'comments_count', label: 'التعليقات', render: (row) => <strong>{row.comments_count || 0}</strong> },
    { key: 'share_count', label: 'المشاركات', render: (row) => <strong>{row.share_count || 0}</strong> },
    { key: 'adminStatus', label: 'الحالة', render: (row) => renderStatus(row.adminStatus) },
    { key: 'created_at', label: 'التاريخ', render: (row) => formatDateTime(row.created_at) },
  ];

  return (
    <AdminSectionTemplate
      loading={loading}
      error={error}
      onRetry={load}
      title="إدارة الريلز"
      subtitle="صفحة فرعية حديثة لمراجعة الريلز القصيرة وتحليل التفاعل وحصر المقاطع الجاهزة للمراجعة أو التثبيت." 
      badge="Reels Studio"
      accent="إدارة الفيديو القصير"
      stats={stats}
      spotlight={spotlight}
      tableTitle="أحدث الريلز"
      tableDescription="جدول مخصص للمحتوى القصير مع التفاعل والتعليقات والمشاركات والحالة." 
      columns={columns}
      rows={rows}
      emptyIcon="🎬"
      emptyTitle="لا توجد ريلز حالياً"
      emptyDescription="عند توفر فيديوهات قصيرة سيتم عرضها هنا للإدارة."
      asideTitle="استوديو الريلز"
      asideItems={asideItems}
      timelineTitle="تدفق الريلز"
      timelineItems={timeline}
      primaryAction={{ to: '/admin/dashboard', label: 'العودة للرئيسية' }}
      secondaryAction={{ to: '/reels', label: 'فتح الريلز' }}
    />
  );
}
