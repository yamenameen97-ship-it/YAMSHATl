import { useEffect, useMemo, useRef, useState } from 'react';
import AdminSectionTemplate, { renderStatus } from '../../components/admin/AdminSectionTemplate.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getPosts } from '../../api/posts.js';
import { formatCompactNumber, formatDateTime, sampleActivity, toArray } from '../../components/admin/adminShared.js';

const reelUrl = (item) => item?.media_urls?.[0] || item?.media || item?.image_url || '';
const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));

export default function AdminReels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeReelId, setActiveReelId] = useState('');
  const [inlinePlayingId, setInlinePlayingId] = useState('');
  const [modalPlaying, setModalPlaying] = useState(false);
  const videoRefs = useRef({});
  const modalVideoRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getPosts({ skip: 0, limit: 30 });
      const items = toArray(data).filter((item) => isVideo(reelUrl(item)));
      setReels(items);
      setActiveReelId((previous) => {
        if (previous && items.some((item) => String(item.id) === String(previous))) return previous;
        return String(items[0]?.id || '');
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل بيانات الريلز.');
      setReels([]);
      setActiveReelId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeReel = useMemo(
    () => reels.find((item) => String(item.id) === String(activeReelId)) || null,
    [activeReelId, reels],
  );

  useEffect(() => {
    if (!activeReel || !modalVideoRef.current) {
      setModalPlaying(false);
      return undefined;
    }
    const video = modalVideoRef.current;
    video.currentTime = 0;
    video.play().then(() => setModalPlaying(true)).catch(() => setModalPlaying(false));
    return () => {
      video.pause();
      setModalPlaying(false);
    };
  }, [activeReel]);

  const stopAllInlineVideos = (exceptId = '') => {
    Object.entries(videoRefs.current).forEach(([id, node]) => {
      if (!node || String(id) === String(exceptId)) return;
      node.pause();
    });
  };

  const toggleInlinePlayback = async (reelId) => {
    const key = String(reelId);
    const video = videoRefs.current[key];
    if (!video) return;

    if (inlinePlayingId === key && !video.paused) {
      video.pause();
      setInlinePlayingId('');
      return;
    }

    stopAllInlineVideos(key);
    try {
      await video.play();
      setInlinePlayingId(key);
    } catch {
      setInlinePlayingId('');
    }
  };

  const openReelModal = (reel) => {
    setActiveReelId(String(reel?.id || ''));
  };

  const closeReelModal = () => {
    if (modalVideoRef.current) modalVideoRef.current.pause();
    setActiveReelId('');
    setModalPlaying(false);
  };

  const toggleModalPlayback = async () => {
    const video = modalVideoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      setModalPlaying(false);
      return;
    }
    try {
      await video.play();
      setModalPlaying(true);
    } catch {
      setModalPlaying(false);
    }
  };

  const engagementTotal = reels.reduce((sum, item) => sum + Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0), 0);
  const stats = [
    { label: 'إجمالي الريلز', value: formatCompactNumber(reels.length || 0), icon: '🎬', tone: 'violet', note: 'مقاطع فيديو قصيرة مربوطة ببيانات المنشورات.' },
    { label: 'التفاعل', value: formatCompactNumber(engagementTotal || 0), icon: '🔥', tone: 'green', note: 'إجمالي اللايكات والتعليقات والمشاركات.' },
    { label: 'أفضل منشئ', value: reels[0]?.username || '—', icon: '🏆', tone: 'amber', note: 'أعلى ظهور حالي داخل البيانات المحملة.' },
    { label: 'جاهز للمعاينة', value: formatCompactNumber(reels.length), icon: '🛡️', tone: 'blue', note: 'يمكن تشغيل الريل وفتحه داخل Modal مباشرة.' },
  ];

  const spotlight = [
    { label: 'أعلى تفاعل', value: formatCompactNumber(Math.max(...reels.map((item) => Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0)), 0)) },
    { label: 'أحدث ريل', value: reels[0]?.created_at ? formatDateTime(reels[0].created_at) : '—' },
    { label: 'حالة الربط', value: reels.length ? 'API متصل' : 'لا توجد فيديوهات' },
  ];

  const asideItems = [
    {
      label: 'الريل المتصدر',
      value: reels[0]?.username || '—',
      description: reels[0]?.content || 'سيظهر هنا وصف الريل الأعلى عند توفر البيانات.',
      tone: 'success',
    },
    {
      label: 'معاينة مباشرة',
      value: inlinePlayingId ? 'نشطة' : 'جاهزة',
      description: 'تمت إضافة تشغيل/إيقاف مباشر داخل الجدول مع Modal للعرض الكامل.',
      tone: 'violet',
    },
    {
      label: 'مصدر البيانات',
      value: 'Posts API',
      description: 'الصفحة تسحب الفيديوهات تلقائياً من نفس مصدر المنشورات وتفلتر الريلز فقط.',
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
    reelSrc: reelUrl(item),
  }));

  const columns = [
    {
      key: 'preview',
      label: 'المعاينة',
      render: (row) => (
        <div style={{ width: 120 }}>
          <video
            ref={(node) => {
              if (node) videoRefs.current[String(row.id)] = node;
              else delete videoRefs.current[String(row.id)];
            }}
            src={row.reelSrc}
            muted
            playsInline
            preload="metadata"
            poster={row.thumbnail_url || row.cover_url || ''}
            onPause={() => setInlinePlayingId((current) => (current === String(row.id) ? '' : current))}
            onPlay={() => setInlinePlayingId(String(row.id))}
            style={{ width: '100%', borderRadius: 14, background: '#111', maxHeight: 180, objectFit: 'cover' }}
          />
        </div>
      ),
    },
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
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (row) => (
        <div style={{ display: 'grid', gap: 8 }}>
          <Button variant="secondary" onClick={() => toggleInlinePlayback(row.id)}>
            {inlinePlayingId === String(row.id) ? 'إيقاف' : 'تشغيل'}
          </Button>
          <Button onClick={() => openReelModal(row)}>فتح الريل</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminSectionTemplate
        loading={loading}
        error={error}
        onRetry={load}
        title="إدارة الريلز"
        subtitle="تم ربط صفحة إدارة الريلز بمصدر البيانات الحقيقي مع معاينة فيديو مباشرة، أزرار تشغيل/إيقاف، وModal لعرض الريل بالكامل وتحليل محتواه بسرعة."
        badge="Reels Studio"
        accent="إدارة الفيديو القصير"
        stats={stats}
        spotlight={spotlight}
        tableTitle="أحدث الريلز"
        tableDescription="الجدول يسحب الريلز من Posts API، يفلتر الفيديوهات فقط، ويعرض معاينة فعلية مع إجراءات تشغيل وفتح Modal." 
        columns={columns}
        rows={rows}
        emptyIcon="🎬"
        emptyTitle="لا توجد ريلز حالياً"
        emptyDescription="عند توفر فيديوهات قصيرة سيتم عرضها هنا للإدارة والمعاينة الفعلية."
        asideTitle="استوديو الريلز"
        asideItems={asideItems}
        timelineTitle="تدفق الريلز"
        timelineItems={timeline}
        primaryAction={{ to: '/admin/dashboard', label: 'العودة للرئيسية' }}
        secondaryAction={{ to: '/reels', label: 'فتح الريلز' }}
      />

      <Modal open={Boolean(activeReel)} title={activeReel ? `ريل @${activeReel.username || 'creator'}` : 'Reel Viewer'} onClose={closeReelModal}>
        {activeReel ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <video
              ref={modalVideoRef}
              src={reelUrl(activeReel)}
              controls
              playsInline
              preload="auto"
              poster={activeReel.thumbnail_url || activeReel.cover_url || ''}
              onPause={() => setModalPlaying(false)}
              onPlay={() => setModalPlaying(true)}
              style={{ width: '100%', borderRadius: 18, background: '#111', maxHeight: '70vh' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Button onClick={toggleModalPlayback}>{modalPlaying ? 'إيقاف الريل' : 'تشغيل الريل'}</Button>
              <Button variant="secondary" onClick={closeReelModal}>إغلاق</Button>
            </div>
            <div className="queue-grid compact-cards">
              <div className="queue-card compact admin-tone-violet">
                <span className="queue-label">المنشئ</span>
                <strong>@{activeReel.username || 'creator'}</strong>
                <p>{activeReel.content || 'بدون وصف.'}</p>
              </div>
              <div className="queue-card compact admin-tone-success">
                <span className="queue-label">التفاعل</span>
                <strong>{formatCompactNumber(Number(activeReel.likes || activeReel.like_count || 0) + Number(activeReel.comments_count || 0) + Number(activeReel.share_count || 0))}</strong>
                <p>لايكات + تعليقات + مشاركات.</p>
              </div>
              <div className="queue-card compact admin-tone-amber">
                <span className="queue-label">تاريخ النشر</span>
                <strong>{formatDateTime(activeReel.created_at)}</strong>
                <p>تم ربط الـ Modal بنفس بيانات الـ API المحمّلة للصفحة.</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
