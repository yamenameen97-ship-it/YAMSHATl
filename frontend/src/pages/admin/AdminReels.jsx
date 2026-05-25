import { useEffect, useMemo, useRef, useState } from 'react';
import AdminSectionTemplate, { renderStatus } from '../../components/admin/AdminSectionTemplate.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getPosts } from '../../api/posts.js';
import { formatCompactNumber, formatDateTime, sampleActivity, toArray } from '../../components/admin/adminShared.js';
import { getModerationReports, getReelsAnalyticsDashboard, getWatchHistory, getReelInsightsById } from '../../services/reelsEngine.js';

const reelUrl = (item) => item?.media_urls?.[0] || item?.media || item?.image_url || item?.media_url || '';
const isVideo = (value) => /\.(mp4|mov|webm|mkv|m3u8)/i.test(String(value || ''));

function useClientInsights() {
  const [snapshot, setSnapshot] = useState({ analytics: getReelsAnalyticsDashboard(), moderation: getModerationReports(), history: getWatchHistory() });

  useEffect(() => {
    const refresh = () => {
      setSnapshot({
        analytics: getReelsAnalyticsDashboard(),
        moderation: getModerationReports(),
        history: getWatchHistory(),
      });
    };
    refresh();
    window.addEventListener('storage', refresh);
    const timer = window.setInterval(refresh, 2500);
    return () => {
      window.removeEventListener('storage', refresh);
      window.clearInterval(timer);
    };
  }, []);

  return snapshot;
}

export default function AdminReels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeReelId, setActiveReelId] = useState('');
  const [inlinePlayingId, setInlinePlayingId] = useState('');
  const [modalPlaying, setModalPlaying] = useState(false);
  const videoRefs = useRef({});
  const modalVideoRef = useRef(null);
  const { analytics, moderation, history } = useClientInsights();

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

  const engagementTotal = reels.reduce((sum, item) => sum + Number(item.likes || item.like_count || item.likes_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0), 0);
  const stats = [
    { label: 'إجمالي الريلز', value: formatCompactNumber(reels.length || 0), icon: '🎬', tone: 'violet', note: 'مقاطع فيديو قصيرة مربوطة ببيانات المنشورات.' },
    { label: 'التفاعل', value: formatCompactNumber(engagementTotal || 0), icon: '🔥', tone: 'green', note: 'إجمالي اللايكات والتعليقات والمشاركات.' },
    { label: 'Qualified Views', value: formatCompactNumber(analytics.summary.qualifiedViews || 0), icon: '👁️', tone: 'blue', note: 'مشاهدات محققة من طبقة Analytics داخل الريلز.' },
    { label: 'بلاغات معلقة', value: formatCompactNumber(moderation.filter((item) => item.status === 'pending').length), icon: '🛡️', tone: 'amber', note: 'بلاغات تم تسجيلها من واجهة المستخدم وتحتاج مراجعة.' },
  ];

  const spotlight = [
    { label: 'إجمالي وقت المشاهدة', value: `${Math.round(Number(analytics.summary.totalWatchMs || 0) / 60000)} د` },
    { label: 'Buffer events', value: formatCompactNumber(analytics.summary.bufferEvents || 0) },
    { label: 'آخر تحديث', value: analytics.updatedAt ? formatDateTime(analytics.updatedAt) : '—' },
  ];

  const asideItems = [
    {
      label: 'سجل المشاهدة',
      value: formatCompactNumber(history.length),
      description: history[0] ? `آخر مشاهدة: @${history[0].username || 'creator'}` : 'لا يوجد سجل مشاهدة حتى الآن.',
      tone: 'success',
    },
    {
      label: 'الجودة التلقائية',
      value: formatCompactNumber(analytics.summary.autoQualityDowngrades || 0),
      description: 'عدد مرات خفض الجودة تلقائيًا بسبب الشبكة أو التخزين المؤقت.',
      tone: 'violet',
    },
    {
      label: 'المراجعة',
      value: moderation[0]?.reason || 'جاهزة',
      description: moderation[0] ? `أحدث بلاغ على @${moderation[0].username || 'creator'}` : 'لا توجد بلاغات جديدة حالياً.',
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

  const rows = reels.map((item) => {
    const insight = getReelInsightsById(item.id);
    const reports = moderation.filter((report) => String(report.reelId) === String(item.id)).length;
    return {
      ...item,
      adminStatus: reports > 0 ? 'review' : Number(item.comments_count || 0) > 0 ? 'active' : 'draft',
      engagement: Number(item.likes || item.like_count || item.likes_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0),
      reelSrc: reelUrl(item),
      insight,
      reports,
    };
  });

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
    { key: 'qualifiedViews', label: 'المشاهدات', render: (row) => <strong>{formatCompactNumber(row.insight?.qualifiedViews || 0)}</strong> },
    { key: 'avgWatchMs', label: 'متوسط المشاهدة', render: (row) => <strong>{Math.round(Number(row.insight?.avgWatchMs || 0) / 1000)}ث</strong> },
    { key: 'reports', label: 'بلاغات', render: (row) => <strong>{row.reports}</strong> },
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
        subtitle="تمت إضافة لوحات Analytics محلية للريلز، سجل مشاهدة، Queue للبلاغات، ومؤشرات جودة/Buffer فوق المعاينة والإدارة." 
        badge="Reels Studio"
        accent="إدارة الفيديو القصير"
        stats={stats}
        spotlight={spotlight}
        tableTitle="أحدث الريلز"
        tableDescription="الجدول يعرض مصدر الفيديو، التفاعل، المشاهدات المؤهلة، متوسط وقت المشاهدة، والبلاغات المسجلة من تجربة الريلز." 
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

      <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
        <section style={{ borderRadius: 20, padding: 18, background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Queue البلاغات</h3>
              <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>أحدث البلاغات الملتقطة من شاشة الريلز نفسها.</p>
            </div>
            <Button variant="secondary" onClick={load}>تحديث</Button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {moderation.length ? moderation.slice(0, 8).map((item) => (
              <div key={item.id} style={{ borderRadius: 16, padding: 14, background: 'rgba(255,255,255,0.04)', display: 'grid', gap: 6 }}>
                <strong>@{item.username || 'creator'} — {item.reason}</strong>
                <span style={{ color: '#cbd5e1' }}>{item.note || 'بدون ملاحظات إضافية'}</span>
                <small style={{ color: '#94a3b8' }}>{formatDateTime(item.createdAt)}</small>
              </div>
            )) : <div style={{ color: '#94a3b8' }}>لا توجد بلاغات مسجلة حالياً.</div>}
          </div>
        </section>
      </div>

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
                <strong>{formatCompactNumber(Number(activeReel.likes || activeReel.like_count || activeReel.likes_count || 0) + Number(activeReel.comments_count || 0) + Number(activeReel.share_count || 0))}</strong>
                <p>لايكات + تعليقات + مشاركات.</p>
              </div>
              <div className="queue-card compact admin-tone-amber">
                <span className="queue-label">Analytics</span>
                <strong>{formatCompactNumber(getReelInsightsById(activeReel.id)?.qualifiedViews || 0)} views</strong>
                <p>متوسط المشاهدة {Math.round(Number(getReelInsightsById(activeReel.id)?.avgWatchMs || 0) / 1000)} ثانية.</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
