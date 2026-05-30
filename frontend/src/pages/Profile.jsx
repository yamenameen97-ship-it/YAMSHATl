import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getProfileBundle, updateMyProfile } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

const TAB_LABELS = {
  posts: 'المنشورات',
  archive: 'الأرشيف',
  saved: 'المحفوظات',
};

const PROFILE_THEMES = [
  { key: 'midnight', label: 'Midnight', color: '#0f172a' },
  { key: 'ocean', label: 'Ocean', color: '#0c4a6e' },
  { key: 'sunset', label: 'Sunset', color: '#7c2d12' },
  { key: 'forest', label: 'Forest', color: '#065f46' },
  { key: 'aurora', label: 'Aurora', color: '#4c1d95' },
];

export default function Profile() {
  const { username: routeUsername } = useParams();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [theme, setTheme] = useState('midnight');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const { data } = await getProfileBundle(username);
      setProfile(data);
      setTheme(data?.profile_insights?.theme || data?.user?.profile?.profile_theme || 'midnight');
    } catch (error) {
      console.error('Failed to load profile', error);
      setProfile({
        user: { username, avatar: '', profile: { bio: '' } },
        counts: { posts: 0, followers: 0, following: 0 },
        posts: [],
        archived_posts: [],
        saved_posts: [],
      });
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    await updateMyProfile({ profile_theme: newTheme });
  };

  if (!profile) {
    return (
      <MainLayout>
        <div className="profile-page profile-page-loading">
          <Card className="profile-loading-card">جارٍ تحميل الملف الشخصي...</Card>
        </div>
      </MainLayout>
    );
  }

  const galleryItems = activeTab === 'posts'
    ? profile.posts
    : activeTab === 'archive'
      ? profile.archived_posts || []
      : profile.saved_posts || [];

  const bio = profile.user.profile?.bio || 'لا يوجد نبذة شخصية';
  const stats = [
    { label: 'منشور', value: profile.counts?.posts ?? profile.posts_count ?? 0 },
    { label: 'متابع', value: profile.counts?.followers ?? profile.followers_count ?? 0 },
    { label: 'يتابع', value: profile.counts?.following ?? profile.following_count ?? 0 },
  ];

  return (
    <MainLayout>
      <section className="profile-page desktop-post mobile-post">
        <Card className="profile-hero-card">
          <div className="profile-hero-grid">
            <div className="profile-avatar-shell">
              {profile.user.avatar ? (
                <img src={profile.user.avatar} alt={profile.user.username} className="profile-avatar-image" />
              ) : (
                <span>{profile.user.username?.[0]?.toUpperCase() || 'Y'}</span>
              )}
            </div>

            <div className="profile-summary-block">
              <div className="profile-header-row">
                <div>
                  <p className="page-eyebrow no-margin">Profile</p>
                  <h2 className="page-title">{profile.user.username}</h2>
                </div>

                <div className="profile-actions-row">
                  {isOwnProfile ? (
                    <>
                      <Button variant="secondary" size="small" onClick={() => setShowCustomization(true)}>تخصيص المظهر</Button>
                      <Button variant="secondary" size="small" onClick={() => setShowAnalytics(true)}>التحليلات</Button>
                    </>
                  ) : (
                    <Button size="small">متابعة</Button>
                  )}
                </div>
              </div>

              <div className="profile-stats-grid">
                {stats.map((item) => (
                  <div key={item.label} className="profile-stat-item">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="profile-bio-copy">{bio}</p>
            </div>
          </div>
        </Card>

        <div className="profile-tabs-row" role="tablist" aria-label="أقسام الملف الشخصي">
          {Object.entries(TAB_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`profile-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="profile-gallery-grid">
          {galleryItems?.length ? galleryItems.map((post) => (
            <article key={post.id} className="profile-gallery-card">
              {post.media_url || post.image_url ? (
                <img src={post.media_url || post.image_url} alt="post" className="profile-gallery-image" />
              ) : (
                <div className="profile-gallery-empty">لا توجد معاينة</div>
              )}
              {activeTab === 'archive' ? <span className="profile-gallery-badge">مؤرشف</span> : null}
            </article>
          )) : (
            <Card className="profile-empty-card">لا توجد عناصر في هذا القسم حالياً.</Card>
          )}
        </div>
      </section>

      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="تحليلات الحساب الشخصي">
        <div className="profile-modal-stack">
          <div className="profile-modal-kpis">
            <Card className="profile-kpi-card">
              <strong>12.5k</strong>
              <span className="muted">زيارات الملف الشخصي</span>
            </Card>
            <Card className="profile-kpi-card accent-success">
              <strong>+15%</strong>
              <span className="muted">معدل التفاعل</span>
            </Card>
          </div>

          <div className="profile-chart-card">
            <div className="card-head">
              <h3>أداء المنشورات خلال 30 يوم</h3>
            </div>
            <div className="profile-chart-bars">
              {[30, 50, 40, 80, 60, 95, 70].map((height, index) => (
                <div key={index} className="profile-chart-column">
                  <span>{height}%</span>
                  <div className="profile-chart-bar" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCustomization} onClose={() => setShowCustomization(false)} title="تخصيص مظهر الملف الشخصي">
        <div className="profile-modal-stack">
          <div>
            <h4 className="section-title">اختر الثيم</h4>
            <div className="profile-theme-grid">
              {PROFILE_THEMES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`profile-theme-option ${theme === item.key ? 'active' : ''}`}
                  onClick={() => handleThemeChange(item.key)}
                  style={{ '--theme-color': item.color }}
                >
                  <span className="profile-theme-swatch" />
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </div>

          <Card className="profile-settings-card">
            <h4 className="section-title">إعدادات متقدمة</h4>
            <label className="profile-setting-row">
              <span>إظهار شارة التحقق</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="profile-setting-row">
              <span>تخطيط الشبكة المتقدم</span>
              <input type="checkbox" />
            </label>
          </Card>
        </div>
      </Modal>

      <style>{`
        .profile-page {
          width: min(100%, 1120px);
          margin: 0 auto;
          padding: clamp(20px, 3vw, 32px);
          display: grid;
          gap: 24px;
        }

        .profile-page-loading {
          min-height: 70vh;
          align-items: center;
        }

        .profile-loading-card,
        .profile-empty-card {
          text-align: center;
          padding: 32px;
        }

        .profile-hero-card {
          padding: clamp(20px, 3vw, 28px);
        }

        .profile-hero-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 28px;
          align-items: center;
        }

        .profile-avatar-shell {
          width: clamp(112px, 16vw, 156px);
          aspect-ratio: 1;
          border-radius: 50%;
          overflow-y:auto;
          display: grid;
          place-items: center;
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 900;
          color: var(--text-on-accent);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          box-shadow: 0 24px 44px rgba(124, 58, 237, 0.24);
        }

        .profile-avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-summary-block {
          display: grid;
          gap: 18px;
        }

        .profile-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .profile-actions-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .profile-stat-item {
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
          display: grid;
          gap: 6px;
        }

        .profile-stat-item strong {
          font-size: clamp(20px, 3vw, 28px);
        }

        .profile-stat-item span {
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
        }

        .profile-bio-copy {
          margin: 0;
          color: var(--text-soft);
          white-space: pre-wrap;
        }

        .profile-tabs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 6px;
          border-radius: 22px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 90%, transparent);
        }

        .profile-tab {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          font-weight: 800;
        }

        .profile-tab.active {
          background: linear-gradient(135deg, var(--primary), var(--primary-strong));
          color: var(--text-on-accent);
          box-shadow: 0 16px 32px rgba(124, 58, 237, 0.2);
        }

        .profile-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .profile-gallery-card {
          position: relative;
          aspect-ratio: 1;
          overflow-y:auto;
          border-radius: 24px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 88%, transparent);
          box-shadow: var(--shadow-sm);
        }

        .profile-gallery-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-gallery-empty {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: var(--muted);
          font-weight: 700;
        }

        .profile-gallery-badge {
          position: absolute;
          top: 12px;
          inset-inline-end: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.72);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
        }

        .profile-modal-stack {
          display: grid;
          gap: 20px;
          padding: 8px 0 4px;
        }

        .profile-modal-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .profile-kpi-card {
          text-align: center;
          padding: 24px;
        }

        .profile-kpi-card strong {
          display: block;
          margin-bottom: 8px;
          font-size: 32px;
          color: var(--primary);
        }

        .profile-kpi-card.accent-success strong {
          color: var(--success);
        }

        .profile-chart-card {
          padding: 20px;
          border-radius: 24px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
        }

        .profile-chart-bars {
          height: 220px;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 12px;
          align-items: end;
          margin-top: 18px;
        }

        .profile-chart-column {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: end;
          align-items: center;
          gap: 8px;
        }

        .profile-chart-column span {
          font-size: 11px;
          color: var(--muted);
          font-weight: 700;
        }

        .profile-chart-bar {
          width: 100%;
          max-width: 42px;
          border-radius: 14px 14px 6px 6px;
          background: linear-gradient(180deg, var(--secondary), var(--primary));
        }

        .profile-theme-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .profile-theme-option {
          display: grid;
          gap: 10px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel) 92%, transparent);
          color: var(--text);
          text-align: start;
        }

        .profile-theme-option.active {
          border-color: color-mix(in srgb, var(--primary) 55%, white 8%);
          box-shadow: 0 16px 32px rgba(124, 58, 237, 0.18);
        }

        .profile-theme-swatch {
          width: 100%;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--theme-color), color-mix(in srgb, var(--theme-color) 55%, white 12%));
        }

        .profile-settings-card {
          display: grid;
          gap: 14px;
        }

        .profile-setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (max-width: 860px) {
          .profile-hero-grid,
          .profile-modal-kpis,
          .profile-theme-grid {
            grid-template-columns: 1fr;
          }

          .profile-header-row {
            flex-direction: column;
          }
        }

        @media (max-width: 640px) {
          .profile-gallery-grid,
          .profile-stats-grid {
            grid-template-columns: 1fr;
          }

          .profile-tabs-row {
            display: grid;
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </MainLayout>
  );
}
