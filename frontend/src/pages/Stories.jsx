import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { getStories, uploadStory } from '../api/stories.js';

const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));

function normalizeStory(item) {
  return {
    id: item?.id || `${item?.username}-${item?.media}-${item?.created_at}`,
    username: item?.username || 'user',
    media: item?.media_url || item?.media || '',
    created_at: item?.created_at || '',
  };
}

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const loadStories = async ({ preserveActive = true } = {}) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getStories();
      const nextStories = (Array.isArray(data) ? data : []).map(normalizeStory);
      setStories(nextStories);

      setActiveStory((previous) => {
        if (!nextStories.length) return null;
        if (preserveActive && previous) {
          return nextStories.find((story) => String(story.id) === String(previous.id)) || nextStories[0];
        }
        return nextStories[0];
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
    }));
  }, [stories]);

  const stats = useMemo(
    () => [
      { label: 'إجمالي الستوري', value: stories.length },
      { label: 'الحسابات النشطة', value: storyGroups.length },
      {
        label: 'آخر تحديث',
        value: activeStory?.created_at ? new Date(activeStory.created_at).toLocaleDateString('ar-EG') : 'الآن',
      },
    ],
    [activeStory, stories.length, storyGroups.length]
  );

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
                <p className="muted">صفحة ستوري جديدة بنفس هوية التطبيق، متصلة مباشرة بالباك إند لعرض ورفع الصور والفيديوهات.</p>
              </div>
            </div>

            <div className="stories-stats-grid">
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
              {activeStory?.created_at ? (
                <span className="glass-chip">{new Date(activeStory.created_at).toLocaleString('ar-EG')}</span>
              ) : null}
            </div>

            {activeStory ? (
              <div className="story-viewer-shell">
                {isVideo(activeStory.media) ? (
                  <video className="story-viewer-media" src={activeStory.media} controls autoPlay muted playsInline />
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
                      <div className="muted">{isVideo(activeStory.media) ? 'فيديو ستوري' : 'صورة ستوري'}</div>
                    </div>
                  </div>
                  <div className="story-viewer-actions">
                    <span className="glass-chip">مشاهدة جاهزة</span>
                    <span className="glass-chip">API متصل</span>
                  </div>
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
                <p className="muted">عرض سريع لكل العناصر القادمة من الباك إند مع اختيار مباشر للمعاينة.</p>
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
                  onClick={() => setActiveStory(story)}
                >
                  <div className="story-feed-thumb">
                    {isVideo(story.media) ? (
                      <video src={story.media} muted playsInline />
                    ) : (
                      <img src={story.media} alt={`Story by ${story.username}`} />
                    )}
                  </div>
                  <div className="story-feed-copy">
                    <strong>{story.username}</strong>
                    <span>{story.created_at ? new Date(story.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
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
                <p className="muted">نفس شكل الستوري الدائري الموجود في التطبيقات الاجتماعية الحديثة.</p>
              </div>
            </div>

            <div className="stories-users-grid">
              {storyGroups.map((group) => (
                <button
                  key={group.username}
                  type="button"
                  className="story-user-card"
                  onClick={() => setActiveStory(group.latest)}
                >
                  <div className="story-ring">
                    <div className="story-avatar">{group.username.slice(0, 1).toUpperCase()}</div>
                  </div>
                  <strong>{group.username}</strong>
                  <span className="muted">{group.items.length} ستوري</span>
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
