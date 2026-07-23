/**
 * AdminReels.jsx — v88.45
 * ----------------------------------------------------------------
 * إدارة الريلز الكاملة في لوحة التحكم:
 * - يعرض الريلز الفعلية من جدول Reel (وليس Posts)
 * - المدير يستطيع مشاهدة كل ريل من داخل اللوحة
 * - المدير يستطيع الاطلاع على تعليقات كل ريل + حذفها + إخفاؤها
 * - المدير يستطيع مراجعة البلاغات المرتبطة بكل ريل + اتخاذ إجراء
 * - المدير يستطيع حذف الريل / استعادته / حذفه نهائياً
 * - يعتمد كلياً على endpoints الأدمن الحقيقية (لا localStorage)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminSectionTemplate, { renderStatus } from '../../components/admin/AdminSectionTemplate.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { formatCompactNumber, formatDateTime, toArray } from '../../components/admin/adminShared.js';
import {
  getAdminReels,
  deleteAdminReel,
  restoreAdminReel,
  getAdminReelComments,
  deleteAdminReelComment,
  toggleHideAdminReelComment,
  getAdminReelReports,
  takeReportAction,
} from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const REASON_LABELS = {
  abuse: 'إساءة وتنمر',
  impersonation: 'انتحال شخصية',
  inappropriate: 'محتوى غير لائق',
  spam: 'محتوى مزعج',
  unwanted: 'غير مرغوب فيه',
  hate_speech: 'خطاب كراهية',
  violence: 'عنف',
  nudity: 'عُري',
  self_harm: 'إيذاء النفس',
  misinformation: 'معلومات مضللة',
  scam: 'احتيال',
  copyright: 'انتهاك حقوق',
  other: 'أخرى',
};

const STATUS_LABELS = {
  pending: 'قيد المراجعة',
  reviewing: 'تحت المراجعة',
  resolved: 'تمت المعالجة',
  dismissed: 'مرفوض',
  escalated: 'مُصعّد',
};

export default function AdminReels() {
  const [reels, setReels] = useState([]);
  const [counts, setCounts] = useState({ active: 0, deleted: 0, all: 0, with_reports: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [hasReportsFilter, setHasReportsFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [actionBusyKey, setActionBusyKey] = useState('');

  // Reel viewer modal
  const [viewerReel, setViewerReel] = useState(null);
  const [modalPlaying, setModalPlaying] = useState(false);
  const modalVideoRef = useRef(null);

  // Inline previews
  const videoRefs = useRef({});
  const [inlinePlayingId, setInlinePlayingId] = useState('');

  // Comments modal
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsReel, setCommentsReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsIncludeHidden, setCommentsIncludeHidden] = useState(true);
  const [commentBusy, setCommentBusy] = useState('');

  // Reports modal
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [reportsReel, setReportsReel] = useState(null);
  const [reelReports, setReelReports] = useState([]);
  const [commentReports, setCommentReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportBusy, setReportBusy] = useState('');

  const { pushToast } = useToast();

  // ---------- Load reels ----------
  const load = async (targetPage = page) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getAdminReels({
        status: statusFilter,
        category,
        search,
        has_reports: hasReportsFilter,
        page: targetPage,
        page_size: pageSize,
      });
      setReels(toArray(data?.items));
      setCounts(data?.counts || { active: 0, deleted: 0, all: 0, with_reports: 0 });
      setTotal(Number(data?.total || 0));
      setPage(targetPage);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'تعذر تحميل بيانات الريلز.';
      setError(msg);
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, category, hasReportsFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(1), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Live updates via socket
  useEffect(() => {
    const refresh = () => load(page);
    socket.on('admin:reel_deleted', refresh);
    socket.on('admin:reel_restored', refresh);
    socket.on('admin:reel_comment_deleted', refresh);
    socket.on('admin:reel_comment_updated', refresh);
    socket.on('admin:report_updated', refresh);
    return () => {
      socket.off('admin:reel_deleted', refresh);
      socket.off('admin:reel_restored', refresh);
      socket.off('admin:reel_comment_deleted', refresh);
      socket.off('admin:reel_comment_updated', refresh);
      socket.off('admin:report_updated', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ---------- Inline preview control ----------
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

  // ---------- Viewer modal ----------
  const openReelViewer = (reel) => setViewerReel(reel);
  const closeReelViewer = () => {
    if (modalVideoRef.current) modalVideoRef.current.pause();
    setViewerReel(null);
    setModalPlaying(false);
  };

  useEffect(() => {
    if (!viewerReel || !modalVideoRef.current) {
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
  }, [viewerReel]);

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

  // ---------- Delete / Restore reel ----------
  const handleDeleteReel = async (reel, hard = false) => {
    const confirmMsg = hard
      ? `حذف نهائي للريل رقم ${reel.id} مع كل تعليقاته وبلاغاته؟ لا يمكن التراجع.`
      : `إخفاء الريل رقم ${reel.id} من التطبيق؟ يمكن استعادته لاحقاً.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      setActionBusyKey(`del-${reel.id}`);
      await deleteAdminReel(reel.id, hard);
      pushToast({ title: hard ? 'تم حذف الريل نهائياً' : 'تم إخفاء الريل', type: 'success' });
      load(page);
    } catch (err) {
      pushToast({ title: 'فشل حذف الريل', description: err?.response?.data?.detail || err?.message, type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const handleRestoreReel = async (reel) => {
    try {
      setActionBusyKey(`res-${reel.id}`);
      await restoreAdminReel(reel.id);
      pushToast({ title: 'تم استعادة الريل', type: 'success' });
      load(page);
    } catch (err) {
      pushToast({ title: 'فشل استعادة الريل', description: err?.response?.data?.detail || err?.message, type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  // ---------- Comments modal ----------
  const openCommentsModal = async (reel) => {
    setCommentsReel(reel);
    setCommentsModalOpen(true);
    await loadReelComments(reel.id, commentsIncludeHidden);
  };

  const loadReelComments = async (reelId, includeHidden = commentsIncludeHidden) => {
    try {
      setCommentsLoading(true);
      const { data } = await getAdminReelComments(reelId, { include_hidden: includeHidden, page_size: 200 });
      setComments(toArray(data?.items));
    } catch (err) {
      pushToast({ title: 'تعذر تحميل تعليقات الريل', description: err?.response?.data?.detail || err?.message, type: 'error' });
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeCommentsModal = () => {
    setCommentsModalOpen(false);
    setCommentsReel(null);
    setComments([]);
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm(`حذف التعليق رقم ${comment.id}؟ سيتم حذف كل الردود عليه أيضاً.`)) return;
    try {
      setCommentBusy(`del-${comment.id}`);
      await deleteAdminReelComment(comment.id);
      pushToast({ title: 'تم حذف التعليق', type: 'success' });
      setComments((prev) => prev.filter((c) => c.id !== comment.id && c.parent_id !== comment.id));
      load(page);
    } catch (err) {
      pushToast({ title: 'فشل حذف التعليق', description: err?.response?.data?.detail || err?.message, type: 'error' });
    } finally {
      setCommentBusy('');
    }
  };

  const handleToggleHideComment = async (comment) => {
    const newHidden = !comment.is_hidden;
    try {
      setCommentBusy(`hide-${comment.id}`);
      await toggleHideAdminReelComment(comment.id, newHidden);
      pushToast({ title: newHidden ? 'تم إخفاء التعليق' : 'تم إظهار التعليق', type: 'success' });
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, is_hidden: newHidden } : c)));
    } catch (err) {
      pushToast({ title: 'فشل تحديث التعليق', description: err?.response?.data?.detail || err?.message, type: 'error' });
    } finally {
      setCommentBusy('');
    }
  };

  // ---------- Reports modal ----------
  const openReportsModal = async (reel) => {
    setReportsReel(reel);
    setReportsModalOpen(true);
    setReelReports([]);
    setCommentReports([]);
    setReportsLoading(true);
    try {
      const { data } = await getAdminReelReports(reel.id, { include_resolved: true });
      setReelReports(toArray(data?.reel_reports));
      setCommentReports(toArray(data?.comment_reports));
    } catch (err) {
      pushToast({ title: 'تعذر تحميل البلاغات', description: err?.response?.data?.detail || err?.message, type: 'error' });
    } finally {
      setReportsLoading(false);
    }
  };

  const closeReportsModal = () => {
    setReportsModalOpen(false);
    setReportsReel(null);
    setReelReports([]);
    setCommentReports([]);
  };

  const handleReportAction = async (report, action) => {
    const labels = {
      dismiss: 'رفض البلاغ',
      remove_content: 'إزالة المحتوى',
      warn_user: 'تحذير المستخدم',
      mute_user: 'كتم المستخدم',
      suspend_user: 'إيقاف مؤقت',
      ban_user: 'حظر المستخدم',
      escalate: 'تصعيد البلاغ',
    };
    if (!window.confirm(`تنفيذ إجراء "${labels[action] || action}" على البلاغ رقم ${report.id}؟`)) return;
    try {
      setReportBusy(`${report.id}-${action}`);
      await takeReportAction(report.id, action);
      pushToast({ title: 'تم تنفيذ الإجراء', type: 'success' });
      if (reportsReel) await openReportsModal(reportsReel);
      load(page);
    } catch (err) {
      pushToast({ title: 'فشل تنفيذ الإجراء', description: err?.response?.data?.detail || err?.message, type: 'error' });
    } finally {
      setReportBusy('');
    }
  };

  // ---------- Stats / spotlight ----------
  const engagementTotal = reels.reduce(
    (sum, r) => sum + Number(r.likes_count || 0) + Number(r.comments_count || 0) + Number(r.shares_count || 0),
    0,
  );
  const totalViews = reels.reduce((sum, r) => sum + Number(r.views_count || 0), 0);
  const totalPendingReports = reels.reduce((sum, r) => sum + Number(r.pending_reports_count || 0), 0);

  const stats = [
    { label: 'إجمالي الريلز', value: formatCompactNumber(counts.all || 0), icon: '🎬', tone: 'violet', note: `${counts.active || 0} نشط · ${counts.deleted || 0} محذوف` },
    { label: 'التفاعل (الصفحة)', value: formatCompactNumber(engagementTotal), icon: '🔥', tone: 'green', note: 'لايكات + تعليقات + مشاركات' },
    { label: 'المشاهدات (الصفحة)', value: formatCompactNumber(totalViews), icon: '👁️', tone: 'blue', note: 'إجمالي مشاهدات الريلز المعروضة' },
    { label: 'بلاغات معلقة', value: formatCompactNumber(totalPendingReports), icon: '🛡️', tone: 'amber', note: `${counts.with_reports || 0} ريل عليه بلاغات` },
  ];

  const spotlight = [
    { label: 'الحالة النشطة', value: formatCompactNumber(counts.active || 0) },
    { label: 'المحذوفة', value: formatCompactNumber(counts.deleted || 0) },
    { label: 'عليها بلاغات', value: formatCompactNumber(counts.with_reports || 0) },
  ];

  const asideItems = [
    {
      label: 'إجمالي البلاغات المعلقة',
      value: formatCompactNumber(totalPendingReports),
      description: totalPendingReports > 0 ? 'يوجد بلاغات تحتاج مراجعة عاجلة.' : 'لا توجد بلاغات معلقة حالياً.',
      tone: totalPendingReports > 0 ? 'amber' : 'success',
    },
    {
      label: 'الريلز المحذوفة',
      value: formatCompactNumber(counts.deleted || 0),
      description: 'يمكن استعادتها من فلتر "المحذوفة".',
      tone: 'violet',
    },
    {
      label: 'الريلز عليها بلاغات',
      value: formatCompactNumber(counts.with_reports || 0),
      description: 'استخدم فلتر "عليها بلاغات" لعرضها فقط.',
      tone: 'amber',
    },
  ];

  const rows = reels.map((item) => ({
    ...item,
    adminStatus: item.is_deleted
      ? 'archived'
      : item.pending_reports_count > 0
      ? 'review'
      : item.comments_count > 0
      ? 'active'
      : 'draft',
    engagement: Number(item.likes_count || 0) + Number(item.comments_count || 0) + Number(item.shares_count || 0),
  }));

  const columns = [
    {
      key: 'preview',
      label: 'المعاينة',
      render: (row) => (
        <div style={{ width: 120 }}>
          {row.video_url ? (
            <video
              ref={(node) => {
                if (node) videoRefs.current[String(row.id)] = node;
                else delete videoRefs.current[String(row.id)];
              }}
              src={row.video_url}
              muted
              playsInline
              preload="metadata"
              poster={row.thumbnail_url || ''}
              onPause={() => setInlinePlayingId((c) => (c === String(row.id) ? '' : c))}
              onPlay={() => setInlinePlayingId(String(row.id))}
              style={{ width: '100%', borderRadius: 14, background: '#111', maxHeight: 180, objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => openReelViewer(row)}
            />
          ) : (
            <div style={{ height: 160, borderRadius: 14, background: '#111', display: 'grid', placeItems: 'center', color: '#64748b' }}>
              لا يوجد فيديو
            </div>
          )}
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
            <strong>{(row.caption || row.content || 'ريل جديد').slice(0, 50)}</strong>
            <small>@{row.username || 'creator'} · #{row.id}</small>
          </div>
        </div>
      ),
    },
    { key: 'engagement', label: 'التفاعل', render: (row) => <strong>{formatCompactNumber(row.engagement)}</strong> },
    { key: 'views', label: 'المشاهدات', render: (row) => <strong>{formatCompactNumber(row.views_count || 0)}</strong> },
    {
      key: 'comments',
      label: 'التعليقات',
      render: (row) => (
        <div style={{ display: 'grid', gap: 2 }}>
          <strong>{formatCompactNumber(row.comments_count || 0)}</strong>
          {row.hidden_comments_count > 0 ? (
            <small style={{ color: '#f59e0b' }}>مخفي: {row.hidden_comments_count}</small>
          ) : null}
        </div>
      ),
    },
    {
      key: 'reports',
      label: 'البلاغات',
      render: (row) => (
        <div style={{ display: 'grid', gap: 2 }}>
          <strong style={{ color: row.pending_reports_count > 0 ? '#ef4444' : '#10b981' }}>
            {formatCompactNumber(row.reports_count || 0)}
          </strong>
          {row.pending_reports_count > 0 ? (
            <small style={{ color: '#ef4444' }}>معلق: {row.pending_reports_count}</small>
          ) : null}
        </div>
      ),
    },
    { key: 'adminStatus', label: 'الحالة', render: (row) => renderStatus(row.adminStatus) },
    { key: 'created_at', label: 'التاريخ', render: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (row) => (
        <div style={{ display: 'grid', gap: 6 }}>
          <Button variant="secondary" onClick={() => toggleInlinePlayback(row.id)}>
            {inlinePlayingId === String(row.id) ? '⏸ إيقاف' : '▶ تشغيل'}
          </Button>
          <Button onClick={() => openReelViewer(row)}>🎬 مشاهدة</Button>
          <Button variant="secondary" onClick={() => openCommentsModal(row)}>
            💬 التعليقات ({row.comments_count || 0})
          </Button>
          <Button
            variant="secondary"
            onClick={() => openReportsModal(row)}
            style={row.pending_reports_count > 0 ? { borderColor: '#ef4444', color: '#ef4444' } : undefined}
          >
            🚩 البلاغات ({row.reports_count || 0})
          </Button>
          {row.is_deleted ? (
            <>
              <Button
                variant="secondary"
                loading={actionBusyKey === `res-${row.id}`}
                onClick={() => handleRestoreReel(row)}
              >
                ♻ استعادة
              </Button>
              <Button
                variant="secondary"
                className="danger"
                loading={actionBusyKey === `del-${row.id}`}
                onClick={() => handleDeleteReel(row, true)}
              >
                🗑 حذف نهائي
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="danger"
              loading={actionBusyKey === `del-${row.id}`}
              onClick={() => handleDeleteReel(row, false)}
            >
              🚫 إخفاء
            </Button>
          )}
        </div>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminSectionTemplate
        loading={loading}
        error={error}
        onRetry={() => load(page)}
        title="إدارة الريلز"
        subtitle="مراجعة كاملة للريلز مع تعليقاتها وبلاغاتها من قاعدة البيانات الفعلية. المدير العام يستطيع مشاهدة كل ريل، حذف/إخفاء/استعادة الريلز، إدارة التعليقات، ومعالجة البلاغات."
        badge="Reels Studio v88.45"
        accent="إدارة كاملة للفيديو القصير"
        stats={stats}
        spotlight={spotlight}
        tableTitle={`الريلز (${total})`}
        tableDescription="مصدر البيانات: جدول reels + reel_comments + reports (target_type=reel/reel_comment)."
        columns={columns}
        rows={rows}
        emptyIcon="🎬"
        emptyTitle="لا توجد ريلز حالياً"
        emptyDescription="عند رفع ريلز جديدة ستظهر هنا للمراجعة والإدارة."
        asideTitle="نظرة سريعة"
        asideItems={asideItems}
        timelineTitle=""
        timelineItems={[]}
        primaryAction={{ to: '/admin/dashboard', label: 'العودة للرئيسية' }}
        secondaryAction={{ to: '/reels', label: 'فتح الريلز' }}
      />

      {/* Filter bar */}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <section style={{ borderRadius: 20, padding: 16, background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.18)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <label className="field" style={{ display: 'grid', gap: 4 }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>الحالة</span>
              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="active">النشطة ({counts.active || 0})</option>
                <option value="deleted">المحذوفة ({counts.deleted || 0})</option>
                <option value="all">الكل ({counts.all || 0})</option>
              </select>
            </label>
            <label className="field" style={{ display: 'grid', gap: 4 }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>التصنيف</span>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">الكل</option>
                <option value="general">عام</option>
                <option value="entertainment">ترفيه</option>
                <option value="sports">رياضة</option>
                <option value="education">تعليم</option>
                <option value="news">أخبار</option>
              </select>
            </label>
            <label className="field" style={{ display: 'grid', gap: 4, flex: 1, minWidth: 200 }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>بحث</span>
              <input
                className="input"
                type="text"
                placeholder="ابحث في الوصف أو اسم المستخدم"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasReportsFilter}
                onChange={(e) => setHasReportsFilter(e.target.checked)}
              />
              <span>عليها بلاغات فقط</span>
            </label>
            <Button variant="secondary" onClick={() => load(page)}>تحديث</Button>
          </div>
        </section>

        {/* Pagination */}
        {totalPages > 1 ? (
          <section style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <Button variant="secondary" disabled={page <= 1} onClick={() => load(page - 1)}>السابق</Button>
            <span style={{ color: '#94a3b8' }}>صفحة {page} من {totalPages}</span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => load(page + 1)}>التالي</Button>
          </section>
        ) : null}
      </div>

      {/* Reel viewer modal */}
      <Modal
        open={Boolean(viewerReel)}
        title={viewerReel ? `ريل @${viewerReel.username || 'creator'} · #${viewerReel.id}` : 'Reel Viewer'}
        onClose={closeReelViewer}
      >
        {viewerReel ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <video
              ref={modalVideoRef}
              src={viewerReel.video_url}
              controls
              playsInline
              preload="auto"
              poster={viewerReel.thumbnail_url || ''}
              onPause={() => setModalPlaying(false)}
              onPlay={() => setModalPlaying(true)}
              style={{ width: '100%', borderRadius: 18, background: '#111', maxHeight: '70vh' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Button onClick={toggleModalPlayback}>{modalPlaying ? '⏸ إيقاف' : '▶ تشغيل'}</Button>
              <Button variant="secondary" onClick={() => { openCommentsModal(viewerReel); closeReelViewer(); }}>
                💬 عرض التعليقات ({viewerReel.comments_count || 0})
              </Button>
              <Button variant="secondary" onClick={() => { openReportsModal(viewerReel); closeReelViewer(); }}>
                🚩 البلاغات ({viewerReel.reports_count || 0})
              </Button>
              <Button variant="secondary" onClick={closeReelViewer}>إغلاق</Button>
            </div>
            <div className="queue-grid compact-cards">
              <div className="queue-card compact admin-tone-violet">
                <span className="queue-label">المنشئ</span>
                <strong>@{viewerReel.username || 'creator'}</strong>
                <p>{viewerReel.caption || viewerReel.content || 'بدون وصف.'}</p>
              </div>
              <div className="queue-card compact admin-tone-success">
                <span className="queue-label">التفاعل</span>
                <strong>{formatCompactNumber((viewerReel.likes_count || 0) + (viewerReel.comments_count || 0) + (viewerReel.shares_count || 0))}</strong>
                <p>👍 {viewerReel.likes_count || 0} · 💬 {viewerReel.comments_count || 0} · 🔁 {viewerReel.shares_count || 0}</p>
              </div>
              <div className="queue-card compact admin-tone-amber">
                <span className="queue-label">المشاهدات</span>
                <strong>{formatCompactNumber(viewerReel.views_count || 0)} views</strong>
                <p>المدة: {viewerReel.duration || 0} ثانية</p>
              </div>
              <div className="queue-card compact" style={{ background: viewerReel.pending_reports_count > 0 ? 'rgba(239,68,68,0.1)' : undefined }}>
                <span className="queue-label">البلاغات</span>
                <strong>{viewerReel.reports_count || 0}</strong>
                <p>معلقة: {viewerReel.pending_reports_count || 0}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Comments modal */}
      <Modal
        open={commentsModalOpen}
        title={commentsReel ? `تعليقات ريل @${commentsReel.username} (${comments.length})` : 'تعليقات الريل'}
        onClose={closeCommentsModal}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
              <input
                type="checkbox"
                checked={commentsIncludeHidden}
                onChange={(e) => {
                  setCommentsIncludeHidden(e.target.checked);
                  if (commentsReel) loadReelComments(commentsReel.id, e.target.checked);
                }}
              />
              <span>عرض التعليقات المخفية</span>
            </label>
            <Button
              variant="secondary"
              onClick={() => commentsReel && loadReelComments(commentsReel.id, commentsIncludeHidden)}
              loading={commentsLoading}
            >
              تحديث
            </Button>
          </div>

          {commentsLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>جاري تحميل التعليقات...</div>
          ) : comments.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>لا توجد تعليقات على هذا الريل.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10, maxHeight: '55vh', overflowY: 'auto' }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: c.is_hidden ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                    border: c.is_hidden ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(148,163,184,0.1)',
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ color: '#e2e8f0' }}>@{c.username}</strong>
                      <small style={{ color: '#64748b', marginRight: 8 }}>#{c.id}</small>
                      {c.parent_id ? <small style={{ color: '#a78bfa' }}>↳ رد على #{c.parent_id}</small> : null}
                      {c.is_hidden ? <small style={{ color: '#ef4444', marginRight: 8 }}>🚫 مخفي</small> : null}
                    </div>
                    <small style={{ color: '#64748b' }}>{formatDateTime(c.created_at)}</small>
                  </div>
                  <div style={{ color: '#cbd5e1', wordBreak: 'break-word' }}>{c.content}</div>
                  <div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: 12, flexWrap: 'wrap' }}>
                    <span>👍 {c.likes_count || 0}</span>
                    <span>💬 ردود: {c.replies_count || 0}</span>
                    {c.reports_count > 0 ? <span style={{ color: '#ef4444' }}>🚩 بلاغات: {c.reports_count}</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Button
                      variant="secondary"
                      loading={commentBusy === `hide-${c.id}`}
                      onClick={() => handleToggleHideComment(c)}
                    >
                      {c.is_hidden ? '👁 إظهار' : '🚫 إخفاء'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="danger"
                      loading={commentBusy === `del-${c.id}`}
                      onClick={() => handleDeleteComment(c)}
                    >
                      🗑 حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeCommentsModal}>إغلاق</Button>
          </div>
        </div>
      </Modal>

      {/* Reports modal */}
      <Modal
        open={reportsModalOpen}
        title={reportsReel ? `بلاغات ريل @${reportsReel.username} (${reelReports.length + commentReports.length})` : 'بلاغات الريل'}
        onClose={closeReportsModal}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {reportsLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>جاري تحميل البلاغات...</div>
          ) : reelReports.length === 0 && commentReports.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>لا توجد بلاغات على هذا الريل.</div>
          ) : (
            <>
              {reelReports.length > 0 ? (
                <div>
                  <h4 style={{ color: '#e2e8f0', marginBottom: 8 }}>🎬 بلاغات على الريل ({reelReports.length})</h4>
                  <div style={{ display: 'grid', gap: 10, maxHeight: '35vh', overflowY: 'auto' }}>
                    {reelReports.map((r) => (
                      <ReportRow key={r.id} report={r} busy={reportBusy} onAction={handleReportAction} />
                    ))}
                  </div>
                </div>
              ) : null}
              {commentReports.length > 0 ? (
                <div>
                  <h4 style={{ color: '#e2e8f0', marginBottom: 8 }}>💬 بلاغات على تعليقات هذا الريل ({commentReports.length})</h4>
                  <div style={{ display: 'grid', gap: 10, maxHeight: '35vh', overflowY: 'auto' }}>
                    {commentReports.map((r) => (
                      <ReportRow key={r.id} report={r} busy={reportBusy} onAction={handleReportAction} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeReportsModal}>إغلاق</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ReportRow({ report, busy, onAction }) {
  const statusColors = {
    pending: '#f59e0b',
    reviewing: '#3b82f6',
    resolved: '#10b981',
    dismissed: '#64748b',
    escalated: '#ef4444',
  };
  const canAct = ['pending', 'reviewing'].includes(report.status);
  return (
    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148,163,184,0.1)', display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ color: '#e2e8f0' }}>
          🚩 {REASON_LABELS[report.reason] || report.reason}
          <span style={{ color: '#64748b', fontWeight: 'normal', marginRight: 6 }}>· #{report.id}</span>
        </strong>
        <span style={{ color: statusColors[report.status] || '#94a3b8', fontSize: 12 }}>
          {STATUS_LABELS[report.status] || report.status}
        </span>
      </div>
      {report.details ? (
        <div style={{ color: '#cbd5e1', fontSize: 13, wordBreak: 'break-word' }}>{report.details}</div>
      ) : null}
      <div style={{ display: 'flex', gap: 10, color: '#64748b', fontSize: 12, flexWrap: 'wrap' }}>
        <span>المُبلِّغ: {report.reporter?.username ? `@${report.reporter.username}` : `#${report.reporter_user_id || '?'}`}</span>
        {report.duplicate_count > 1 ? <span style={{ color: '#f59e0b' }}>تكرار: {report.duplicate_count}×</span> : null}
        <span>{formatDateTime(report.created_at)}</span>
      </div>
      {canAct ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <Button variant="secondary" loading={busy === `${report.id}-dismiss`} onClick={() => onAction(report, 'dismiss')}>رفض</Button>
          <Button variant="secondary" loading={busy === `${report.id}-remove_content`} onClick={() => onAction(report, 'remove_content')}>إزالة المحتوى</Button>
          <Button variant="secondary" loading={busy === `${report.id}-warn_user`} onClick={() => onAction(report, 'warn_user')}>تحذير المستخدم</Button>
          <Button variant="secondary" loading={busy === `${report.id}-mute_user`} onClick={() => onAction(report, 'mute_user')}>كتم</Button>
          <Button variant="secondary" loading={busy === `${report.id}-suspend_user`} onClick={() => onAction(report, 'suspend_user')}>إيقاف</Button>
          <Button variant="secondary" className="danger" loading={busy === `${report.id}-ban_user`} onClick={() => onAction(report, 'ban_user')}>حظر</Button>
          <Button variant="secondary" loading={busy === `${report.id}-escalate`} onClick={() => onAction(report, 'escalate')}>تصعيد</Button>
        </div>
      ) : null}
      {report.action_taken ? (
        <small style={{ color: '#10b981' }}>الإجراء المتخذ: {report.action_taken}</small>
      ) : null}
    </div>
  );
}
