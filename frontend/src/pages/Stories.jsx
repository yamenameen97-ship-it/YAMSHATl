import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { getStories, uploadStory } from '../api/stories.js';

const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));
const SEEN_STORAGE_KEY = 'yamshat:stories:seen';

function normalizeStory(item) {
  return {
    id: item?.id || `${item?.username}-${item?.media}-${item?.created_at}`,
    username: item?.username || 'user',
    media: item?.media_url || item?.media || '',
    created_at: item?.created_at || '',
    expires_at: item?.expires_at || '',
    type: isVideo(item?.media_url || item?.media) ? 'video' : 'image',
  };
}

function loadSeenStories() {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [activeStoryId, setActiveStoryId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [seenStories, setSeenStories] = useState(() => loadSeenStories());

  const persistSeen = (nextSeen) => {
    setSeenStories(nextSeen);
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(nextSeen));
  };

  const markSeen = (storyId) => {
    if (!storyId) return;
    const nextSeen = { ...seenStories, [storyId]: true };
    persistSeen(nextSeen);
  };

  const loadStories = async ({ preserveActive = true } = {}) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getStories();
      const nextStories = (Array.isArray(data) ? data : []).map(normalizeStory);
      setStories(nextStories);
      setActiveStoryId((previous) => {
        if (!nextStories.length) return '';
        if (preserveActive && previous && nextStories.some((story) => String(story.id) === String(previous))) {
          return previous;
        }
        return String(nextStories[0].id);
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل الستوري حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories({ preserveActive: false });
  }, []);

  const activeIndex = useMemo(
    () => stories.findIndex((story) => String(story.id) === String(activeStoryId)),
    [stories, activeStoryId]
  );

  const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;

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
      unseen: items.filter((item) => !seenStories[item.id]).length,
    }));
  }, [seenStories, stories]);

  const stats = useMemo(
    () => [
      { label: 'إجمالي الستوري', value: stories.length },
      { label: 'الحسابات النشطة', value: storyGroups.length },
      { label: 'غير المشاهَد', value: stories.filter((story) => !seenStories[story.id]).length },
      {
        label: 'ينتهي خلال',
        value: activeStory?.expires_at ? new Date(activeStory.expires_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—',
      },
    ],
    [activeStory?.expires_at, seenStories, stories, storyGroups]
  );

  useEffect(() => {
    if (!activeStory) {
      setProgress(0);
      return undefined;
    }
    markSeen(activeStory.id);
    if (!autoPlay) {
      setProgress(0);
      return undefined;
    }

    const duration = activeStory.type === 'video' ? 9000 : 6000;
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
    }, 120);

    return () => window.clearInterval(interval);
  }, [activeStory, autoPlay, stories]);

  const handleSelectStory = (storyId) => {
    setActiveStoryId(String(storyId));
    setProgress(0);
    markSeen(storyId);
  };

  const handleMove = (direction) => {
    if (!stories.length) return;
    const nextIndex = Math.max(0, Math.min(stories.length - 1, activeIndex + direction));
    handleSelectStory(stories[nextIndex].id);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('اختَر صورة أو فيديو قبل رفع الستوري.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await uploadStory(file);
      setFile(null);
      await loadStories({ preserveActive: false });
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر رفع الستوري.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <MainLayout>
      <section className="stories-page-grid">
        <div className="stories-main-column">
          <Card className="stories-hero-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">📸 الستوري</h3>
                <p className="muted">أضفت معاينة أقرب لتطبيقات السوشيال: تقدّم تلقائي، حفظ مشاهدة، انتقال سريع بين العناصر، وتجميع بالحسابات.</p>
              </div>
              <div className="story-viewer-actions">
                <span className="glass-chip">Auto Progress</span>
                <span className="glass-chip">Seen State</span>
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

          <Card className="story-viewer-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">معاينة الستوري</h3>
                <p className="muted">
                  {activeStory
                    ? `آخر ستوري مختارة من ${activeStory.username}`
                    : 'اختر أي ستوري من القائمة لعرضها هنا.'}
                </p>
              </div>
              <div className="story-viewer-actions">
                <button type="button" className="mini-action" onClick={() => setAutoPlay((prev) => !prev)}>
                  {autoPlay ? 'إيقاف التقدّم التلقائي' : 'تشغيل التقدّم التلقائي'}
                </button>
                {activeStory?.created_at ? (
                  <span className="glass-chip">{new Date(activeStory.created_at).toLocaleString('ar-EG')}</span>
                ) : null}
              </div>
            </div>

            {activeStory ? (
              <div className="story-viewer-shell">
                <div className="upload-progress-shell compact-upload-progress">
                  <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
                  <span>{Math.round(progress)}%</span>
                </div>

                {activeStory.type === 'video' ? (
                  <video className="story-viewer-media" src={activeStory.media} controls autoPlay muted={!autoPlay} playsInline />
                ) : (
                  <img className="story-viewer-media" src={activeStory.media} alt={`Story by ${activeStory.username}`} />
                )}

                <div className="story-viewer-meta">
                  <div className="story-viewer-user">
                    <div className="story-ring">
                      <div className="story-avatar">{activeStory.username.slice(0, 1).toUpperCase()}</div>
                    </div>
                    <div>
                      <strong>{activeStory.username}</strong>
                      <div className="muted">{activeStory.type === 'video' ? 'فيديو ستوري' : 'صورة ستوري'}</div>
                    </div>
                  </div>
                  <div className="story-viewer-actions">
                    <span className="glass-chip">{seenStories[activeStory.id] ? 'تمت المشاهدة' : 'جديدة'}</span>
                    {activeStory.expires_at ? <span className="glass-chip">تنتهي {new Date(activeStory.expires_at).toLocaleString('ar-EG')}</span> : null}
                  </div>
                </div>

                <div className="hero-actions-wrap">
                  <Button variant="secondary" onClick={() => handleMove(-1)} disabled={activeIndex <= 0}>السابق</Button>
                  <Button variant="secondary" onClick={() => markSeen(activeStory.id)}>تعليم كمشاهد</Button>
                  <Button onClick={() => handleMove(1)} disabled={activeIndex >= stories.length - 1}>التالي</Button>
                </div>
              </div>
            ) : (
              <div className="empty-state">لا توجد ستوري حالياً. ارفع أول ستوري من البطاقة الجانبية.</div>
            )}
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">كل الستوري</h3>
                <p className="muted">عرض سريع لكل العناصر القادمة من الباك إند مع اختيار مباشر للمعاينة وحفظ حالة المشاهدة.</p>
              </div>
            </div>

            {loading ? <div className="empty-state">جارٍ تحميل الستوري...</div> : null}
            {!loading && stories.length === 0 ? <div className="empty-state">لا توجد ستوري منشورة بعد.</div> : null}

            <div className="stories-feed-grid">
              {stories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  className={`story-feed-card ${String(activeStory?.id) === String(story.id) ? 'active' : ''}`}
                  onClick={() => handleSelectStory(story.id)}
                >
                  <div className="story-feed-thumb">
                    {story.type === 'video' ? (
                      <video src={story.media} muted playsInline />
                    ) : (
                      <img src={story.media} alt={`Story by ${story.username}`} />
                    )}
                  </div>
                  <div className="story-feed-copy">
                    <strong>{story.username}</strong>
                    <span>{story.created_at ? new Date(story.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
                    <span className="muted">{seenStories[story.id] ? 'شوهدت' : 'جديدة'}</span>
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
                <h3 className="section-title">رفع ستوري جديدة</h3>
                <p className="muted">ترفع الملف مباشرة إلى الباك إند باستخدام نفس التوكن المحفوظ في الواجهة.</p>
              </div>
            </div>

            <div className="stories-uploader">
              <label className="upload-label stories-upload-label">
                <span>🎞️ اختيار صورة أو فيديو</span>
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
              <div className="muted truncate">{file?.name || 'لم يتم اختيار ملف بعد'}</div>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'جارٍ الرفع...' : 'رفع الستوري'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">الحسابات النشطة</h3>
                <p className="muted">تجميع دائري يوضح من لديه ستوري جديدة ومن تمت مشاهدتها.</p>
              </div>
            </div>

            <div className="stories-users-grid">
              {storyGroups.map((group) => (
                <button
                  key={group.username}
                  type="button"
                  className="story-user-card"
                  onClick={() => handleSelectStory(group.latest.id)}
                >
                  <div className="story-ring">
                    <div className="story-avatar">{group.username.slice(0, 1).toUpperCase()}</div>
                  </div>
                  <strong>{group.username}</strong>
                  <span className="muted">{group.items.length} ستوري</span>
                  <span className="muted">{group.unseen ? `${group.unseen} جديدة` : 'تمت مشاهدتها'}</span>
                </button>
              ))}
              {!loading && storyGroups.length === 0 ? <div className="empty-mini">لا يوجد مستخدمون لديهم ستوري حالياً.</div> : null}
            </div>
          </Card>

          {error ? <div className="alert error">{error}</div> : null}
        </div>
      </section>
    </MainLayout>
  );
}
