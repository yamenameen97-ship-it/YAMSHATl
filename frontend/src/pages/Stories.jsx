import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import {
  getStories,
  getStoryAnalyticsSummary,
  getStoryArchive,
  getStoryHighlights,
  reactToStory,
  replyToStory,
  toggleStoryHighlight,
  uploadStory,
  viewStory,
} from '../api/stories.js';

const STORY_REACTIONS = ['🔥', '😍', '😂', '👏', '💯'];
const PRIVACY_OPTIONS = [
  { value: 'public', label: 'عام' },
  { value: 'close_friends', label: 'الأصدقاء المقرّبين' },
  { value: 'private', label: 'خاص' },
];

const initialMeta = {
  caption: '',
  privacy: 'public',
  music: '',
  stickers: '',
  mentions: '',
  poll_question: '',
  poll_options: '',
  countdown_at: '',
  filter_name: '',
  drawing_data: '',
  auto_delete_hours: 24,
};

const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));

function normalizeStory(item) {
  return {
    id: item?.id || `${item?.username}-${item?.media}-${item?.created_at}`,
    username: item?.username || 'user',
    media: item?.media_url || item?.media || '',
    created_at: item?.created_at || '',
    expires_at: item?.expires_at || '',
    caption: item?.caption || '',
    privacy: item?.privacy || 'public',
    music: item?.music || '',
    stickers: Array.isArray(item?.stickers) ? item.stickers : [],
    mentions: Array.isArray(item?.mentions) ? item.mentions : [],
    poll_question: item?.poll_question || '',
    poll_options: Array.isArray(item?.poll_options) ? item.poll_options : [],
    countdown_at: item?.countdown_at || '',
    filter_name: item?.filter_name || '',
    drawing_data: item?.drawing_data || '',
    auto_delete_hours: Number(item?.auto_delete_hours || 24),
    highlight: Boolean(item?.highlight),
    reactions: item?.reactions || {},
    replies: Array.isArray(item?.replies) ? item.replies : [],
    seen_by: Array.isArray(item?.seen_by) ? item.seen_by : [],
    views_count: Number(item?.views_count || 0),
    replies_count: Number(item?.replies_count || 0),
    reactions_count: Number(item?.reactions_count || 0),
    type: isVideo(item?.media_url || item?.media) ? 'video' : 'image',
  };
}

function formatCountdown(value) {
  if (!value) return 'بدون عد تنازلي';
  const delta = new Date(value).getTime() - Date.now();
  if (Number.isNaN(delta)) return 'بدون عد تنازلي';
  if (delta <= 0) return 'انتهى العد التنازلي';
  const hours = Math.floor(delta / (1000 * 60 * 60));
  const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}س ${minutes}د`;
}

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [archive, setArchive] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeStoryId, setActiveStoryId] = useState('');
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(initialMeta);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);

  const loadStories = async ({ preserveActive = true } = {}) => {
    try {
      setLoading(true);
      setError('');
      const [storiesRes, highlightsRes, archiveRes, analyticsRes] = await Promise.all([
        getStories(),
        getStoryHighlights(),
        getStoryArchive(),
        getStoryAnalyticsSummary(),
      ]);
      const nextStories = (Array.isArray(storiesRes.data) ? storiesRes.data : []).map(normalizeStory);
      const nextHighlights = (Array.isArray(highlightsRes.data) ? highlightsRes.data : []).map(normalizeStory);
      const nextArchive = (Array.isArray(archiveRes.data) ? archiveRes.data : []).map(normalizeStory);
      setStories(nextStories);
      setHighlights(nextHighlights);
      setArchive(nextArchive);
      setAnalytics(analyticsRes.data || null);
      setActiveStoryId((previous) => {
        if (!nextStories.length) return '';
        if (preserveActive && previous && nextStories.some((story) => String(story.id) === String(previous))) return previous;
        return String(nextStories[0].id);
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر تحميل نظام الستوري حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories({ preserveActive: false });
  }, []);

  const activeIndex = useMemo(() => stories.findIndex((story) => String(story.id) === String(activeStoryId)), [stories, activeStoryId]);
  const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;

  useEffect(() => {
    if (!activeStory) {
      setProgress(0);
      return undefined;
    }

    viewStory(activeStory.id).catch(() => null);

    if (!autoPlay) {
      setProgress(0);
      return undefined;
    }

    const duration = activeStory.type === 'video' ? 9000 : 6500;
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const nextProgress = Math.min(((Date.now() - startedAt) / duration) * 100, 100);
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(interval);
        setActiveStoryId((previous) => {
          const currentIndex = stories.findIndex((story) => String(story.id) === String(previous));
          const nextStory = stories[currentIndex + 1];
          return nextStory ? String(nextStory.id) : String(stories[0]?.id || '');
        });
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [activeStory, autoPlay, stories]);

  const storyGroups = useMemo(() => {
    const grouped = new Map();
    stories.forEach((story) => {
      const current = grouped.get(story.username) || [];
      current.push(story);
      grouped.set(story.username, current);
    });

    return Array.from(grouped.entries()).map(([username, items]) => ({
      username,
      items,
      latest: items[0],
      totalViews: items.reduce((sum, item) => sum + item.views_count, 0),
    }));
  }, [stories]);

  const stats = useMemo(() => ([
    { label: 'إجمالي الستوري', value: analytics?.stories_count ?? stories.length },
    { label: 'Story Highlights', value: analytics?.highlights_count ?? highlights.length },
    { label: 'Views', value: analytics?.total_views ?? stories.reduce((sum, item) => sum + item.views_count, 0) },
    { label: 'Engagement', value: analytics?.engagement_rate ?? 0 },
  ]), [analytics, highlights.length, stories]);

  const handleSelectStory = (storyId) => {
    setActiveStoryId(String(storyId));
    setProgress(0);
  };

  const handleMove = (direction) => {
    if (!stories.length) return;
    const nextIndex = Math.max(0, Math.min(stories.length - 1, activeIndex + direction));
    handleSelectStory(stories[nextIndex].id);
  };

  const handleMetaChange = (key, value) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async () => {
    if (!file) {
      setError('اختَر صورة أو فيديو قبل رفع الستوري.');
      return;
    }
    try {
      setUploading(true);
      setError('');
      await uploadStory(file, meta);
      setFile(null);
      setMeta(initialMeta);
      await loadStories({ preserveActive: false });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر رفع الستوري.');
    } finally {
      setUploading(false);
    }
  };

  const handleReact = async (emoji) => {
    if (!activeStory) return;
    try {
      await reactToStory(activeStory.id, emoji);
      await loadStories();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر إضافة الريأكشن.');
    }
  };

  const handleReply = async () => {
    if (!activeStory || !replyText.trim()) return;
    try {
      await replyToStory(activeStory.id, replyText.trim());
      setReplyText('');
      await loadStories();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر إرسال الرد على الستوري.');
    }
  };

  const handleToggleHighlight = async () => {
    if (!activeStory) return;
    try {
      await toggleStoryHighlight(activeStory.id);
      await loadStories();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر تحديث الـ Highlight.');
    }
  };

  return (
    <MainLayout>
      <section className="stories-page-grid stories-page-pro-grid">
        <div className="stories-main-column">
          <Card className="stories-hero-card stories-hero-pro-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">✨ Story Suite Pro</h3>
                <p className="muted">تم تجهيز تجربة ستوري احترافية فيها Progress Bars، Viewer منظم، Reactions، Replies، Seen List، Privacy، Highlights، Archive، Music، Stickers، Mentions، Polls، Countdown، Drawing Notes، Filters، Auto Delete، وتحليلات سريعة.</p>
              </div>
              <div className="story-viewer-actions wrap-composer-actions">
                <span className="glass-chip">Story Viewer</span>
                <span className="glass-chip">Analytics</span>
                <span className="glass-chip">Privacy</span>
              </div>
            </div>

            <div className="stories-stats-grid notification-stats-grid-4">
              {stats.map((item) => (
                <div key={item.label} className="mini-stat stories-stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {error ? <ErrorState title="تعذر إكمال تجربة الستوري" description={error} onRetry={() => loadStories({ preserveActive: false })} /> : null}

          <Card className="story-viewer-card story-viewer-pro-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">Story Viewer احترافي</h3>
                <p className="muted">مع Story Progress Bar، Music/Filter metadata، عد تنازلي، Poll metadata، Seen list، Reactions، Replies، وتحكم في الـ Highlights.</p>
              </div>
              <div className="story-viewer-actions wrap-composer-actions">
                <button type="button" className="mini-action" onClick={() => setAutoPlay((prev) => !prev)}>
                  {autoPlay ? 'إيقاف التقدّم التلقائي' : 'تشغيل التقدّم التلقائي'}
                </button>
                {activeStory ? <button type="button" className="mini-action" onClick={handleToggleHighlight}>{activeStory.highlight ? 'إزالة من Highlights' : 'إضافة إلى Highlights'}</button> : null}
              </div>
            </div>

            {loading ? <ListSkeleton count={2} /> : null}
            {!loading && activeStory ? (
              <div className="story-viewer-shell story-viewer-shell-pro">
                <div className="story-segments-bar" aria-hidden="true">
                  {storyGroups.find((item) => item.username === activeStory.username)?.items?.map((item) => (
                    <span
                      key={item.id}
                      className={`story-segment ${String(item.id) === String(activeStory.id) ? 'active' : ''}`}
                      style={{ opacity: item.views_count ? 1 : 0.55 }}
                    />
                  ))}
                </div>
                <div className="upload-progress-shell compact-upload-progress">
                  <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                  <span>{Math.round(progress)}%</span>
                </div>

                {activeStory.type === 'video' ? (
                  <video className="story-viewer-media" src={activeStory.media} controls autoPlay muted={!autoPlay} playsInline />
                ) : (
                  <img className="story-viewer-media" src={activeStory.media} alt={`Story by ${activeStory.username}`} />
                )}

                <div className="story-viewer-meta story-viewer-meta-pro">
                  <div className="story-viewer-user">
                    <div className="story-ring">
                      <div className="story-avatar">{activeStory.username.slice(0, 1).toUpperCase()}</div>
                    </div>
                    <div>
                      <strong>{activeStory.username}</strong>
                      <div className="muted">{activeStory.caption || 'بدون كابشن'}</div>
                    </div>
                  </div>
                  <div className="story-viewer-actions wrap-composer-actions">
                    <span className="glass-chip">{activeStory.privacy}</span>
                    {activeStory.music ? <span className="glass-chip">🎵 {activeStory.music}</span> : null}
                    {activeStory.filter_name ? <span className="glass-chip">🎨 {activeStory.filter_name}</span> : null}
                    <span className="glass-chip">Auto Delete {activeStory.auto_delete_hours}h</span>
                  </div>
                </div>

                <div className="story-tags-row">
                  {activeStory.mentions.map((mention) => <span key={mention} className="glass-chip">@{mention}</span>)}
                  {activeStory.stickers.map((sticker) => <span key={sticker} className="glass-chip">{sticker}</span>)}
                  {activeStory.countdown_at ? <span className="glass-chip">⏳ {formatCountdown(activeStory.countdown_at)}</span> : null}
                  {activeStory.highlight ? <span className="glass-chip">⭐ Highlight</span> : null}
                </div>

                {activeStory.poll_question ? (
                  <div className="story-poll-card">
                    <strong>{activeStory.poll_question}</strong>
                    <div className="story-poll-options">
                      {activeStory.poll_options.map((option) => (
                        <button key={option} type="button" className="mini-action">{option}</button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeStory.drawing_data ? <div className="story-drawing-note">🖍️ Drawing Layer: {activeStory.drawing_data}</div> : null}

                <div className="story-reactions-row">
                  {STORY_REACTIONS.map((emoji) => (
                    <button key={emoji} type="button" className="reaction-btn" onClick={() => handleReact(emoji)}>
                      <span>{emoji}</span>
                      <span>{activeStory.reactions?.[emoji] || 0}</span>
                    </button>
                  ))}
                </div>

                <div className="hero-actions-wrap">
                  <Button variant="secondary" onClick={() => handleMove(-1)} disabled={activeIndex <= 0}>السابق</Button>
                  <Button variant="secondary" onClick={handleToggleHighlight}>{activeStory.highlight ? '⭐ إزالة Highlight' : '⭐ حفظ Highlight'}</Button>
                  <Button onClick={() => handleMove(1)} disabled={activeIndex >= stories.length - 1}>التالي</Button>
                </div>

                <div className="story-feedback-grid">
                  <div className="story-feedback-card">
                    <strong>Seen List</strong>
                    <div className="story-seen-list">
                      {activeStory.seen_by.length ? activeStory.seen_by.map((username) => <span key={username} className="glass-chip">{username}</span>) : <span className="muted">لا توجد مشاهدات بعد</span>}
                    </div>
                  </div>
                  <div className="story-feedback-card">
                    <strong>Replies</strong>
                    <div className="story-replies-list">
                      {activeStory.replies.length ? activeStory.replies.slice(-4).reverse().map((reply) => (
                        <div key={`${reply.username}-${reply.created_at}`} className="story-reply-item">
                          <strong>{reply.username}</strong>
                          <p>{reply.text}</p>
                        </div>
                      )) : <span className="muted">لا توجد ردود حتى الآن</span>}
                    </div>
                    <div className="story-reply-composer">
                      <Input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="رد سريع على الستوري..." />
                      <Button onClick={handleReply}>إرسال Reply</Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {!loading && !activeStory ? <EmptyState icon="📸" title="لا توجد ستوري حالياً" description="ارفع أول ستوري من البطاقة الجانبية أو أعد التحديث." actionLabel="تحديث" onAction={() => loadStories({ preserveActive: false })} /> : null}
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">Story Feed & Users</h3>
                <p className="muted">قائمة منظمة للحسابات النشطة مع rings، counts، والتنقل السريع بين كل Story Group.</p>
              </div>
            </div>
            {loading ? <ListSkeleton count={4} /> : null}
            {!loading && stories.length === 0 ? <EmptyState icon="🎞️" title="لا توجد ستوري منشورة بعد" description="لما يتم نشر ستوري هتظهر هنا فوراً." /> : null}
            <div className="stories-users-grid stories-users-grid-pro">
              {storyGroups.map((group) => (
                <button key={group.username} type="button" className="story-user-card" onClick={() => handleSelectStory(group.latest.id)}>
                  <div className="story-ring"><div className="story-avatar">{group.username.slice(0, 1).toUpperCase()}</div></div>
                  <strong>{group.username}</strong>
                  <span className="muted">{group.items.length} Story</span>
                  <span className="muted">{group.totalViews} Views</span>
                </button>
              ))}
            </div>
            <div className="stories-feed-grid">
              {stories.map((story) => (
                <button key={story.id} type="button" className={`story-feed-card ${String(activeStory?.id) === String(story.id) ? 'active' : ''}`} onClick={() => handleSelectStory(story.id)}>
                  <div className="story-feed-thumb">
                    {story.type === 'video' ? <video src={story.media} muted playsInline /> : <img src={story.media} alt={`Story by ${story.username}`} />}
                  </div>
                  <div className="story-feed-copy">
                    <strong>{story.username}</strong>
                    <span>{story.created_at ? new Date(story.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
                    <span className="muted">{story.views_count} views • {story.reactions_count} reacts</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="stories-side-column">
          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">رفع Story جديدة</h3>
                <p className="muted">يدعم Story Music، Stickers، Mentions، Polls، Countdown، Drawing Notes، Filters، Privacy، وAuto Delete.</p>
              </div>
            </div>
            <div className="stories-uploader stories-uploader-pro">
              <label className="upload-label stories-upload-label">
                <span>🎞️ اختيار صورة أو فيديو</span>
                <input type="file" hidden accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
              <div className="muted truncate">{file?.name || 'لم يتم اختيار ملف بعد'}</div>
              <Input label="Caption" value={meta.caption} onChange={(event) => handleMetaChange('caption', event.target.value)} placeholder="كابشن مختصر" />
              <label className="field">
                <span className="field-label">Privacy</span>
                <select className="input" value={meta.privacy} onChange={(event) => handleMetaChange('privacy', event.target.value)}>
                  {PRIVACY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <Input label="Music" value={meta.music} onChange={(event) => handleMetaChange('music', event.target.value)} placeholder="اسم الأغنية أو التراك" />
              <Input label="Stickers" value={meta.stickers} onChange={(event) => handleMetaChange('stickers', event.target.value)} placeholder="🔥, 😍, VIP" />
              <Input label="Mentions" value={meta.mentions} onChange={(event) => handleMetaChange('mentions', event.target.value)} placeholder="ahmed, sara" />
              <Input label="Poll Question" value={meta.poll_question} onChange={(event) => handleMetaChange('poll_question', event.target.value)} placeholder="تسأل المتابعين عن إيه؟" />
              <Input label="Poll Options" value={meta.poll_options} onChange={(event) => handleMetaChange('poll_options', event.target.value)} placeholder="نعم, لا, لاحقاً" />
              <Input label="Countdown" type="datetime-local" value={meta.countdown_at} onChange={(event) => handleMetaChange('countdown_at', event.target.value)} />
              <Input label="Filter Name" value={meta.filter_name} onChange={(event) => handleMetaChange('filter_name', event.target.value)} placeholder="Golden Hour / Neon Glow" />
              <Input label="Drawing Notes" value={meta.drawing_data} onChange={(event) => handleMetaChange('drawing_data', event.target.value)} placeholder="خطوط يدوية / سهم على المنتج" />
              <Input label="Auto Delete Hours" type="number" min="1" max="72" value={meta.auto_delete_hours} onChange={(event) => handleMetaChange('auto_delete_hours', event.target.value)} />
              <Button onClick={handleUpload} disabled={uploading}>{uploading ? 'جارٍ الرفع...' : 'رفع الستوري'}</Button>
            </div>
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">Highlights</h3>
                <p className="muted">أرشفة مميزة للستوري المهمة.</p>
              </div>
            </div>
            <div className="story-mini-list">
              {highlights.length ? highlights.map((story) => (
                <button key={story.id} type="button" className="story-mini-item" onClick={() => handleSelectStory(story.id)}>
                  <strong>{story.caption || story.username}</strong>
                  <span className="muted">⭐ Highlight</span>
                </button>
              )) : <div className="empty-mini">لا توجد Highlights بعد.</div>}
            </div>
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">Story Archive</h3>
                <p className="muted">كل الستوري اللي رفعتها محفوظة هنا للرجوع والتحليل.</p>
              </div>
            </div>
            <div className="story-mini-list">
              {archive.length ? archive.slice(0, 6).map((story) => (
                <button key={story.id} type="button" className="story-mini-item" onClick={() => handleSelectStory(story.id)}>
                  <strong>{story.caption || story.username}</strong>
                  <span className="muted">{story.created_at ? new Date(story.created_at).toLocaleDateString('ar-EG') : 'الآن'}</span>
                </button>
              )) : <div className="empty-mini">الأرشيف فارغ حالياً.</div>}
            </div>
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">Story Analytics</h3>
                <p className="muted">ملخص سريع للأداء والمشاهدة والتفاعل.</p>
              </div>
            </div>
            <div className="story-analytics-list">
              <div className="mini-stat stories-stat-card"><strong>{analytics?.total_replies ?? 0}</strong><span>Replies</span></div>
              <div className="mini-stat stories-stat-card"><strong>{analytics?.total_reactions ?? 0}</strong><span>Reactions</span></div>
              <div className="mini-stat stories-stat-card"><strong>{analytics?.total_views ?? 0}</strong><span>Seen</span></div>
              <div className="mini-stat stories-stat-card"><strong>{analytics?.engagement_rate ?? 0}</strong><span>ER</span></div>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
