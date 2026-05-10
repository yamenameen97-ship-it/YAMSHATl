import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../../components/feedback/Skeleton.jsx';
import { getStories, getStoryAnalyticsSummary, getStoryArchive, getStoryHighlights, toggleStoryHighlight, viewStory } from '../../api/stories.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

function isVideo(value) {
  return /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));
}

function normalizeStory(item) {
  return {
    id: item?.id || `${item?.username}-${item?.media_url}-${item?.created_at}`,
    username: item?.username || 'user',
    media: item?.media_url || item?.media || '',
    created_at: item?.created_at || '',
    expires_at: item?.expires_at || '',
    caption: item?.caption || '',
    privacy: item?.privacy || 'public',
    music: item?.music || '',
    stickers: Array.isArray(item?.stickers) ? item.stickers : [],
    mentions: Array.isArray(item?.mentions) ? item.mentions : [],
    filter_name: item?.filter_name || '',
    countdown_at: item?.countdown_at || '',
    highlight: Boolean(item?.highlight),
    replies: Array.isArray(item?.replies) ? item.replies : [],
    seen_by: Array.isArray(item?.seen_by) ? item.seen_by : [],
    views_count: Number(item?.views_count || 0),
    replies_count: Number(item?.replies_count || 0),
    reactions_count: Number(item?.reactions_count || 0),
    type: isVideo(item?.media_url || item?.media) ? 'video' : 'image',
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
  const [archive, setArchive] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStoryId, setActiveStoryId] = useState('');
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [togglingHighlight, setTogglingHighlight] = useState(false);
  const { pushToast } = useToast();

  const load = async ({ preserveActive = true } = {}) => {
    try {
      setLoading(true);
      setError('');
      const [storiesRes, analyticsRes, archiveRes, highlightsRes] = await Promise.all([
        getStories(),
        getStoryAnalyticsSummary(),
        getStoryArchive(),
        getStoryHighlights(),
      ]);
      const nextStories = (Array.isArray(storiesRes.data) ? storiesRes.data : []).map(normalizeStory);
      const nextArchive = (Array.isArray(archiveRes.data) ? archiveRes.data : []).map(normalizeStory);
      const nextHighlights = (Array.isArray(highlightsRes.data) ? highlightsRes.data : []).map(normalizeStory);
      setStories(nextStories);
      setArchive(nextArchive);
      setHighlights(nextHighlights);
      setAnalytics(analyticsRes.data || null);
      setActiveStoryId((previous) => {
        if (!nextStories.length) return '';
        if (preserveActive && previous && nextStories.some((story) => String(story.id) === String(previous))) return previous;
        return String(nextStories[0].id);
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل القصص الحية.');
      setStories([]);
      setArchive([]);
      setHighlights([]);
      setAnalytics(null);
      setActiveStoryId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ preserveActive: false });
  }, []);

  const activeIndex = useMemo(() => stories.findIndex((story) => String(story.id) === String(activeStoryId)), [stories, activeStoryId]);
  const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;

  useEffect(() => {
    if (!storyModalOpen || !activeStory) return;
    viewStory(activeStory.id).catch(() => null);
  }, [activeStory, storyModalOpen]);

  const stats = useMemo(() => ([
    { label: 'القصص الحالية', value: analytics?.stories_count ?? stories.length },
    { label: 'Highlights', value: analytics?.highlights_count ?? highlights.length },
    { label: 'المشاهدات', value: analytics?.total_views ?? stories.reduce((sum, item) => sum + item.views_count, 0) },
    { label: 'الردود', value: analytics?.total_replies ?? stories.reduce((sum, item) => sum + item.replies_count, 0) },
  ]), [analytics, highlights.length, stories]);

  const openStory = (storyId) => {
    setActiveStoryId(String(storyId));
    setStoryModalOpen(true);
  };

  const moveStory = (direction) => {
    if (!stories.length) return;
    const nextIndex = Math.max(0, Math.min(stories.length - 1, activeIndex + direction));
    setActiveStoryId(String(stories[nextIndex].id));
  };

  const handleToggleHighlight = async () => {
    if (!activeStory) return;
    try {
      setTogglingHighlight(true);
      await toggleStoryHighlight(activeStory.id);
      await load();
      pushToast({ title: activeStory.highlight ? 'تمت إزالة الهايلايت' : 'تمت إضافة الهايلايت', description: `@${activeStory.username}`, type: 'success' });
    } catch (err) {
      pushToast({ title: 'تعذر تحديث الهايلايت', description: err?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setTogglingHighlight(false);
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">Stories Control</h3>
              <p className="muted">التالي/السابق والـ Story Modal بقوا مربوطين مباشرة بالـ backend وبيعرضوا الوسائط الفعلية.</p>
            </div>
            <Button variant="secondary" onClick={() => load()} loading={loading}>{loading ? 'جارٍ التحديث...' : 'تحديث'}</Button>
          </div>
          <div className="status-list compact-grid">
            {stats.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
          </div>
        </Card>
        <Card>
          <div className="queue-grid compact-cards">
            <div className="queue-card compact admin-tone-violet">
              <span className="queue-label">أفضل قصة الآن</span>
              <strong>{stories[0]?.username || '—'}</strong>
              <p>{stories[0]?.caption || 'هتظهر هنا أعلى قصة مباشرة من الـ API.'}</p>
            </div>
            <div className="queue-card compact admin-tone-amber">
              <span className="queue-label">الأرشيف</span>
              <strong>{archive.length}</strong>
              <p>آخر القصص المؤرشفة المتاحة للحساب الحالي.</p>
            </div>
            <div className="queue-card compact admin-tone-blue">
              <span className="queue-label">Highlights</span>
              <strong>{highlights.length}</strong>
              <p>قصص محفوظة للعرض الطويل داخل الواجهة.</p>
            </div>
          </div>
        </Card>
      </section>

      {error ? <ErrorState title="تعذر تحميل الستوري" description={error} onRetry={() => load({ preserveActive: false })} /> : null}
      {loading ? <ListSkeleton count={6} /> : null}

      {!loading && stories.length === 0 ? (
        <EmptyState icon="🎞️" title="لا توجد قصص منشورة الآن" description="عند وصول قصص جديدة من الـ backend هتظهر هنا تلقائياً." actionLabel="تحديث" onAction={() => load({ preserveActive: false })} />
      ) : null}

      {!loading && stories.length > 0 ? (
        <section className="admin-deep-grid">
          <Card className="admin-rich-table-card">
            <div className="card-head split">
              <div>
                <h3 className="section-title">القصص الحية</h3>
                <p className="muted no-margin">اضغط على أي قصة لفتح الـ modal والتنقل بين القصص الفعلية.</p>
              </div>
              {activeStory ? <Button onClick={() => openStory(activeStory.id)}>فتح القصة الحالية</Button> : null}
            </div>
            <div className="table-shell admin-rich-table-shell">
              <table className="admin-table admin-rich-table">
                <thead>
                  <tr>
                    <th>الناشر</th>
                    <th>المحتوى</th>
                    <th>المشاهدات</th>
                    <th>الردود</th>
                    <th>النوع</th>
                    <th>ينتهي</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id}>
                      <td>
                        <div className="admin-rich-user-cell">
                          <div className="admin-module-avatar">{story.username.slice(0, 1).toUpperCase()}</div>
                          <div>
                            <strong>{story.username}</strong>
                            <small>{story.privacy}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="content-cell compact">
                          <strong>{story.caption || 'بدون كابشن'}</strong>
                          <small>{story.music || story.filter_name || 'بدون ميتاداتا إضافية'}</small>
                        </div>
                      </td>
                      <td><strong>{story.views_count}</strong></td>
                      <td><strong>{story.replies_count}</strong></td>
                      <td><span className={`status-pill ${story.type === 'video' ? 'warning-soft' : 'active'}`}>{story.type === 'video' ? 'فيديو' : 'صورة'}</span></td>
                      <td>{formatDate(story.expires_at)}</td>
                      <td><button type="button" className="mini-action" onClick={() => openStory(story.id)}>عرض القصة</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="admin-side-stack">
            <Card className="admin-mini-list-card">
              <div className="card-head split">
                <h3 className="section-title">آخر أرشيف</h3>
                <span className="badge">{archive.length}</span>
              </div>
              <div className="admin-activity-list">
                {archive.slice(0, 6).map((item) => (
                  <div key={item.id} className="admin-activity-item">
                    <span className="admin-activity-dot tone-story" />
                    <div>
                      <strong>@{item.username}</strong>
                      <p>{item.caption || 'قصة مؤرشفة'}</p>
                      <small>{formatDate(item.created_at)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="admin-mini-list-card">
              <div className="card-head split">
                <h3 className="section-title">Highlights الحالية</h3>
                <span className="badge">{highlights.length}</span>
              </div>
              <div className="queue-grid compact-cards">
                {highlights.length ? highlights.map((item) => (
                  <button key={item.id} type="button" className="queue-card compact admin-tone-violet" style={{ textAlign: 'inherit', cursor: 'pointer' }} onClick={() => openStory(item.id)}>
                    <span className="queue-label">@{item.username}</span>
                    <strong>{item.caption || 'Story Highlight'}</strong>
                    <p>{item.views_count} مشاهدة • {item.replies_count} رد</p>
                  </button>
                )) : <div className="empty-state compact">لا توجد Highlights حالياً.</div>}
              </div>
            </Card>
          </div>
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
                  {activeStory.highlight ? <span className="glass-chip">⭐ Highlight</span> : null}
                  {activeStory.music ? <span className="glass-chip">🎵 {activeStory.music}</span> : null}
                </div>
              </div>
            </div>
            <div className="stats-inline-grid">
              <div><strong>{activeStory.views_count}</strong><span>مشاهدة</span></div>
              <div><strong>{activeStory.replies_count}</strong><span>رد</span></div>
              <div><strong>{activeStory.reactions_count}</strong><span>تفاعل</span></div>
              <div><strong>{formatDate(activeStory.expires_at)}</strong><span>انتهاء</span></div>
            </div>
            {activeStory.mentions.length || activeStory.stickers.length ? (
              <div className="badge-wrap compact">
                {activeStory.mentions.map((item) => <span key={`mention-${item}`} className="glass-chip">@{item}</span>)}
                {activeStory.stickers.map((item) => <span key={`sticker-${item}`} className="glass-chip">{item}</span>)}
              </div>
            ) : null}
            {activeStory.replies.length ? (
              <div className="story-feedback-card">
                <strong>آخر الردود</strong>
                <div className="admin-activity-list" style={{ marginTop: 10 }}>
                  {activeStory.replies.slice(0, 5).map((reply, index) => (
                    <div key={`${reply.username}-${index}`} className="admin-activity-item">
                      <span className="admin-activity-dot tone-live" />
                      <div>
                        <strong>@{reply.username}</strong>
                        <p>{reply.text}</p>
                        <small>{formatDate(reply.created_at)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => moveStory(-1)} disabled={activeIndex <= 0}>القصة السابقة</Button>
              <Button variant="secondary" onClick={handleToggleHighlight} loading={togglingHighlight}>{activeStory.highlight ? 'إزالة Highlight' : 'إضافة Highlight'}</Button>
              <Button onClick={() => moveStory(1)} disabled={activeIndex >= stories.length - 1}>القصة التالية</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
