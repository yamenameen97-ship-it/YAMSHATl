// v88.48 — Admin Stories page: بيانات حقيقية من endpoints الإدارية (/admin/stories/*)
// كان قبل ذلك يعتمد على getStories() الذي يجلب ستوريات المستخدم الحالي فقط.
// الآن المدير العام يستطيع رؤية كل الستوريات ومعالجة أي محتوى مسيء/مزعج.
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../../components/feedback/Skeleton.jsx';
import {
  banAdminStoryOwner,
  deleteAdminStory,
  getAdminStories,
  getAdminStoriesSummary,
  getAdminStoryDetail,
  toggleAdminStoryHighlight,
  warnAdminStoryOwner,
} from '../../api/admin.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import socket from '../../api/socket.js';

function isVideo(value, mediaType) {
  if ((mediaType || '').toLowerCase() === 'video') return true;
  return /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));
}

function normalizeStory(item) {
  const rawMedia = item?.media_url || item?.media || '';
  const absoluteMedia = resolveMediaUrl(rawMedia) || rawMedia;
  return {
    id: String(item?.id ?? ''),
    userId: Number(item?.user_id || 0),
    username: item?.username || 'user',
    userAvatar: resolveMediaUrl(item?.user_avatar || '') || '',
    userEmail: item?.user_email || '',
    isUserBanned: Boolean(item?.is_user_banned),
    media: absoluteMedia,
    mediaType: item?.media_type || 'image',
    created_at: item?.created_at || '',
    expires_at: item?.expires_at || '',
    caption: item?.caption || '',
    privacy: item?.privacy || 'friends',
    music: item?.music || '',
    filter_name: item?.filter_name || '',
    countdown_at: item?.countdown_at || '',
    highlight: Boolean(item?.highlight),
    highlight_title: item?.highlight_title || '',
    views_count: Number(item?.views_count || 0),
    replies_count: Number(item?.replies_count || 0),
    reactions_count: Number(item?.reactions_count || 0),
    reports_count: Number(item?.reports_count || 0),
    pending_reports_count: Number(item?.pending_reports_count || 0),
    type: isVideo(rawMedia, item?.media_type) ? 'video' : 'image',
  };
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ar-EG');
  } catch {
    return '—';
  }
}

export default function AdminStories() {
  const [stories, setStories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', privacy: 'all', media_type: 'all', highlight: 'all', only_reported: false });
  const [activeStoryId, setActiveStoryId] = useState('');
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [detail, setDetail] = useState(null); // { viewers, replies, reports }
  const [detailLoading, setDetailLoading] = useState(false);
  const { pushToast } = useToast();

  const load = useCallback(async ({ preserveActive = true } = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search: filters.search || undefined,
        privacy: filters.privacy === 'all' ? undefined : filters.privacy,
        media_type: filters.media_type === 'all' ? undefined : filters.media_type,
        highlight: filters.highlight === 'all' ? undefined : filters.highlight === 'yes',
        only_reported: filters.only_reported ? true : undefined,
        page_size: 100,
      };
      const [storiesRes, summaryRes] = await Promise.all([
        getAdminStories(params),
        getAdminStoriesSummary(),
      ]);
      const raw = Array.isArray(storiesRes?.data?.items) ? storiesRes.data.items : [];
      const nextStories = raw.map(normalizeStory);
      setStories(nextStories);
      setSummary(summaryRes?.data || null);
      setActiveStoryId((previous) => {
        if (!nextStories.length) return '';
        if (preserveActive && previous && nextStories.some((s) => s.id === previous)) return previous;
        return nextStories[0].id;
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل الستوريات من الـ backend.');
      setStories([]);
      setSummary(null);
      setActiveStoryId('');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load({ preserveActive: false });
  }, [load]);

  // اشتراك بـ socket لتحديث القائمة عند حذف/تعديل ستوري من مدير آخر
  useEffect(() => {
    const refresh = () => load();
    socket.on('admin:story_deleted', refresh);
    socket.on('admin:story_updated', refresh);
    return () => {
      socket.off('admin:story_deleted', refresh);
      socket.off('admin:story_updated', refresh);
    };
  }, [load]);

  const activeStory = useMemo(
    () => stories.find((s) => s.id === activeStoryId) || null,
    [stories, activeStoryId],
  );

  // عند فتح الـ modal لستوري ما — نجلب تفاصيل كاملة (viewers/replies/reports)
  useEffect(() => {
    if (!storyModalOpen || !activeStory) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setDetailLoading(true);
        const { data } = await getAdminStoryDetail(activeStory.id);
        if (!cancelled) setDetail(data || null);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [storyModalOpen, activeStory]);

  const stats = useMemo(() => ([
    { label: 'الستوريات الحالية', value: summary?.stories_count ?? stories.length },
    { label: 'Highlights', value: summary?.highlights_count ?? stories.filter((s) => s.highlight).length },
    { label: 'المشاهدات الكلية', value: summary?.total_views ?? stories.reduce((sum, i) => sum + i.views_count, 0) },
    { label: 'الردود الكلية', value: summary?.total_replies ?? stories.reduce((sum, i) => sum + i.replies_count, 0) },
    { label: 'التفاعلات الكلية', value: summary?.total_reactions ?? stories.reduce((sum, i) => sum + i.reactions_count, 0) },
    { label: 'بلاغات مفتوحة', value: summary?.reported_open ?? 0 },
  ]), [summary, stories]);

  const openStory = (storyId) => {
    setActiveStoryId(String(storyId));
    setStoryModalOpen(true);
  };

  const moveStory = (direction) => {
    if (!stories.length) return;
    const idx = stories.findIndex((s) => s.id === activeStoryId);
    const nextIndex = Math.max(0, Math.min(stories.length - 1, idx + direction));
    setActiveStoryId(stories[nextIndex].id);
  };

  const handleToggleHighlight = async () => {
    if (!activeStory) return;
    try {
      setBusyId(activeStory.id);
      const { data } = await toggleAdminStoryHighlight(activeStory.id);
      const highlightNow = Boolean(data?.story?.highlight);
      setStories((prev) => prev.map((s) => s.id === activeStory.id ? { ...s, highlight: highlightNow, highlight_title: data?.story?.highlight_title || '' } : s));
      pushToast({ title: highlightNow ? 'تم تفعيل Highlight' : 'تمت إزالة Highlight', description: `@${activeStory.username}`, type: 'success' });
    } catch (err) {
      pushToast({ title: 'تعذر تحديث Highlight', description: err?.response?.data?.detail || 'حاول مرة أخرى.', type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const handleDeleteStory = async (story = activeStory) => {
    if (!story) return;
    const reason = typeof window !== 'undefined'
      ? (window.prompt('سبب حذف الستوري (اختياري):', 'محتوى مخالف أو مسيء') || '')
      : '';
    // إذا الضغط على إلغاء prompt يرجّع null، هنا نتعامل مع فارغ = تخطى
    if (typeof window !== 'undefined' && reason === null) return;
    try {
      setBusyId(story.id);
      await deleteAdminStory(story.id, reason);
      setStories((prev) => prev.filter((s) => s.id !== story.id));
      setStoryModalOpen(false);
      pushToast({ title: 'تم حذف الستوري', description: `@${story.username}`, type: 'success' });
      load();
    } catch (err) {
      pushToast({ title: 'تعذر حذف الستوري', description: err?.response?.data?.detail || 'حاول مرة أخرى.', type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const handleWarnOwner = async () => {
    if (!activeStory) return;
    const reason = typeof window !== 'undefined'
      ? (window.prompt('نص التحذير الذي سيصل لصاحب الستوري:', 'تم رصد مخالفة على ستوريك من الإدارة.') || '')
      : 'تم رصد مخالفة على ستوريك من الإدارة.';
    if (!reason) return;
    try {
      setBusyId(activeStory.id);
      await warnAdminStoryOwner(activeStory.id, reason);
      pushToast({ title: 'تم إرسال التحذير', description: `@${activeStory.username}`, type: 'success' });
    } catch (err) {
      pushToast({ title: 'تعذر إرسال التحذير', description: err?.response?.data?.detail || 'حاول مرة أخرى.', type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const handleBanOwner = async () => {
    if (!activeStory) return;
    const confirmed = typeof window === 'undefined' || window.confirm(`سيتم حظر @${activeStory.username} نهائياً. هل أنت متأكد؟`);
    if (!confirmed) return;
    const reason = typeof window !== 'undefined'
      ? (window.prompt('سبب الحظر:', 'مخالفة سياسة المحتوى') || '')
      : '';
    try {
      setBusyId(activeStory.id);
      await banAdminStoryOwner(activeStory.id, reason);
      setStories((prev) => prev.map((s) => s.userId === activeStory.userId ? { ...s, isUserBanned: true } : s));
      pushToast({ title: 'تم حظر صاحب الستوري', description: `@${activeStory.username}`, type: 'warning' });
    } catch (err) {
      pushToast({ title: 'تعذر حظر المستخدم', description: err?.response?.data?.detail || 'حاول مرة أخرى.', type: 'error' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">تحكم القصص — إدارة عامة</h3>
              <p className="muted">
                هذه الصفحة تجلب <strong>كل الستوريات</strong> لكل المستخدمين من <code>/admin/stories</code>. المدير العام
                يستطيع حذف أي ستوري مسيء أو مزعج، أو تحذير صاحبه، أو حظره مباشرة.
              </p>
            </div>
            <Button variant="secondary" onClick={() => load()} loading={loading}>{loading ? 'جارٍ التحديث...' : 'تحديث'}</Button>
          </div>
          <div className="status-list compact-grid">
            {stats.map((item) => (
              <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="queue-grid compact-cards">
            <div className="queue-card compact admin-tone-violet">
              <span className="queue-label">أكثر مستخدم نشراً</span>
              <strong>{summary?.top_users?.[0]?.username || '—'}</strong>
              <p>{summary?.top_users?.[0] ? `${summary.top_users[0].stories} ستوري` : 'لا توجد بيانات كافية.'}</p>
            </div>
            <div className="queue-card compact admin-tone-amber">
              <span className="queue-label">بلاغات مفتوحة</span>
              <strong>{summary?.reported_open || 0}</strong>
              <p>ستوريات عليها بلاغات في انتظار الفصل.</p>
            </div>
            <div className="queue-card compact admin-tone-blue">
              <span className="queue-label">المميزة</span>
              <strong>{summary?.highlights_count || 0}</strong>
              <p>قصص محفوظة كمميزة للعرض المطول.</p>
            </div>
          </div>
        </Card>
      </section>

      <Card style={{ padding: 14, marginTop: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, alignItems: 'end' }}>
          <Input
            label="بحث"
            placeholder="اسم المستخدم / التعليق"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          />
          <label className="field select-field">
            <span className="field-label">الخصوصية</span>
            <select className="input" value={filters.privacy} onChange={(e) => setFilters((p) => ({ ...p, privacy: e.target.value }))}>
              <option value="all">الكل</option>
              <option value="friends">أصدقاء</option>
              <option value="close_friends">أصدقاء مقربون</option>
              <option value="private">خاص</option>
            </select>
          </label>
          <label className="field select-field">
            <span className="field-label">النوع</span>
            <select className="input" value={filters.media_type} onChange={(e) => setFilters((p) => ({ ...p, media_type: e.target.value }))}>
              <option value="all">الكل</option>
              <option value="image">صور</option>
              <option value="video">فيديو</option>
            </select>
          </label>
          <label className="field select-field">
            <span className="field-label">مميزة</span>
            <select className="input" value={filters.highlight} onChange={(e) => setFilters((p) => ({ ...p, highlight: e.target.value }))}>
              <option value="all">الكل</option>
              <option value="yes">المميزة فقط</option>
              <option value="no">بدون تمييز</option>
            </select>
          </label>
          <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={filters.only_reported}
              onChange={(e) => setFilters((p) => ({ ...p, only_reported: e.target.checked }))}
            />
            <span>فقط عليها بلاغات مفتوحة</span>
          </label>
        </div>
      </Card>

      {error ? <ErrorState title="تعذر تحميل الستوريات" description={error} onRetry={() => load({ preserveActive: false })} /> : null}
      {loading ? <ListSkeleton count={6} /> : null}

      {!loading && stories.length === 0 && !error ? (
        <EmptyState icon="🎞️" title="لا توجد ستوريات مطابقة" description="جرّب تغيير الفلاتر أو الانتظار حتى يقوم أحد المستخدمين بنشر ستوري جديد." actionLabel="تحديث" onAction={() => load({ preserveActive: false })} />
      ) : null}

      {!loading && stories.length > 0 ? (
        <section className="admin-deep-grid" style={{ marginTop: 14 }}>
          <Card className="admin-rich-table-card">
            <div className="card-head split">
              <div>
                <h3 className="section-title">جميع الستوريات ({stories.length})</h3>
                <p className="muted no-margin">اضغط على أي ستوري لفتح النافذة والتنقل والمعالجة الإدارية.</p>
              </div>
              {activeStory ? <Button onClick={() => openStory(activeStory.id)}>فتح الستوري الحالي</Button> : null}
            </div>
            <div className="table-shell admin-rich-table-shell">
              <table className="admin-table admin-rich-table">
                <thead>
                  <tr>
                    <th>الناشر</th>
                    <th>المحتوى</th>
                    <th>المشاهدات</th>
                    <th>الردود</th>
                    <th>البلاغات</th>
                    <th>النوع</th>
                    <th>ينتهي</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id} style={story.isUserBanned ? { opacity: 0.55 } : undefined}>
                      <td>
                        <div className="admin-rich-user-cell">
                          <div className="admin-module-avatar">{story.username.slice(0, 1).toUpperCase()}</div>
                          <div>
                            <strong>@{story.username}</strong>
                            <small>
                              {story.privacy}
                              {story.isUserBanned ? ' • محظور' : ''}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="content-cell compact">
                          <strong>{story.caption || 'بدون كابشن'}</strong>
                          <small>{story.music || story.filter_name || (story.highlight ? '⭐ Highlight' : 'بدون ميتاداتا إضافية')}</small>
                        </div>
                      </td>
                      <td><strong>{story.views_count}</strong></td>
                      <td><strong>{story.replies_count}</strong></td>
                      <td>
                        <span className={`status-pill ${story.pending_reports_count > 0 ? 'warning-soft' : ''}`}>
                          {story.reports_count}
                          {story.pending_reports_count > 0 ? ` (⚠ ${story.pending_reports_count})` : ''}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${story.type === 'video' ? 'warning-soft' : 'active'}`}>
                          {story.type === 'video' ? 'فيديو' : 'صورة'}
                        </span>
                      </td>
                      <td>{formatDate(story.expires_at)}</td>
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" className="mini-action" onClick={() => openStory(story.id)}>عرض</button>
                        <button
                          type="button"
                          className="mini-action"
                          style={{ background: 'rgba(239,68,68,0.16)', color: '#fca5a5' }}
                          disabled={busyId === story.id}
                          onClick={() => handleDeleteStory(story)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ) : null}

      <Modal open={storyModalOpen && Boolean(activeStory)} title={activeStory ? `Story • @${activeStory.username}` : 'Story Viewer'} onClose={() => setStoryModalOpen(false)}>
        {activeStory ? (
          <div className="modal-stack">
            {activeStory.type === 'video' ? (
              <video src={activeStory.media} controls autoPlay className="media-viewer-asset" />
            ) : (
              <img src={activeStory.media} alt={`story-${activeStory.username}`} className="media-viewer-asset" />
            )}
            <div className="profile-summary-card">
              <div className="avatar-circle large">{activeStory.username.slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>@{activeStory.username}</strong>
                <div className="muted">{activeStory.caption || 'بدون كابشن'}</div>
                <div className="action-row" style={{ marginTop: 8 }}>
                  <span className="glass-chip">{activeStory.privacy}</span>
                  {activeStory.highlight ? <span className="glass-chip">⭐ مميزة</span> : null}
                  {activeStory.music ? <span className="glass-chip">🎵 {activeStory.music}</span> : null}
                  {activeStory.isUserBanned ? <span className="glass-chip" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>محظور</span> : null}
                </div>
              </div>
            </div>
            <div className="stats-inline-grid">
              <div><strong>{activeStory.views_count}</strong><span>مشاهدة</span></div>
              <div><strong>{activeStory.replies_count}</strong><span>رد</span></div>
              <div><strong>{activeStory.reactions_count}</strong><span>تفاعل</span></div>
              <div><strong>{activeStory.reports_count}</strong><span>بلاغ</span></div>
              <div><strong>{formatDate(activeStory.expires_at)}</strong><span>انتهاء</span></div>
            </div>

            {detailLoading ? <div className="muted">جارٍ تحميل التفاصيل...</div> : null}

            {detail?.reports?.length ? (
              <div className="story-feedback-card" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
                <strong style={{ color: '#fca5a5' }}>البلاغات على هذا الستوري ({detail.reports.length})</strong>
                <div className="admin-activity-list" style={{ marginTop: 10 }}>
                  {detail.reports.slice(0, 8).map((r) => (
                    <div key={r.id} className="admin-activity-item">
                      <span className="admin-activity-dot" style={{ background: '#ef4444' }} />
                      <div>
                        <strong>{r.reason_label || r.reason || 'بلاغ'}</strong>
                        <p>{r.details || 'بدون تفاصيل إضافية.'}</p>
                        <small>@{r.reporter?.username || '—'} • {formatDate(r.created_at)} • {r.status}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detail?.replies?.length ? (
              <div className="story-feedback-card">
                <strong>آخر الردود ({detail.replies.length})</strong>
                <div className="admin-activity-list" style={{ marginTop: 10 }}>
                  {detail.replies.slice(0, 6).map((reply) => (
                    <div key={reply.id} className="admin-activity-item">
                      <span className="admin-activity-dot tone-live" />
                      <div>
                        <strong>@{reply.username}</strong>
                        <p>{reply.content}</p>
                        <small>{formatDate(reply.created_at)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detail?.viewers?.length ? (
              <div className="story-feedback-card">
                <strong>آخر المشاهدين ({detail.viewers.length})</strong>
                <div className="admin-activity-list" style={{ marginTop: 10 }}>
                  {detail.viewers.slice(0, 6).map((v) => (
                    <div key={`${v.user_id}-${v.viewed_at}`} className="admin-activity-item">
                      <span className="admin-activity-dot" />
                      <div>
                        <strong>@{v.username}</strong>
                        <small>{formatDate(v.viewed_at)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="modal-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Button variant="secondary" onClick={() => moveStory(-1)}>الستوري السابق</Button>
              <Button variant="secondary" onClick={handleToggleHighlight} loading={busyId === activeStory.id}>
                {activeStory.highlight ? 'إزالة Highlight' : 'إضافة Highlight'}
              </Button>
              <Button variant="warning" onClick={handleWarnOwner} loading={busyId === activeStory.id}>تحذير المستخدم</Button>
              <Button variant="danger" onClick={() => handleDeleteStory()} loading={busyId === activeStory.id}>حذف الستوري</Button>
              <Button variant="danger" onClick={handleBanOwner} loading={busyId === activeStory.id}>حظر صاحب الستوري</Button>
              <Button onClick={() => moveStory(1)}>الستوري التالي</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
