import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import ProfileHeader from '../../components/profile/ProfileHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getProfileBundle, updateMyProfile, followUser } from '../../api/users.js';
import { getCurrentUsername } from '../../utils/auth.js';

const TABS = {
  POSTS: 'posts',
  ARCHIVE: 'archive',
  SAVED: 'saved',
  PINNED: 'pinned',
  TAGGED: 'tagged',
};

/**
 * ProfilePage Component
 * Features: Tabs optimization, Analytics, Pinned content, Profile customization, Followers insights
 */
export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;

  // State management
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.POSTS);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showFollowersInsights, setShowFollowersInsights] = useState(false);
  const [theme, setTheme] = useState('midnight');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [followersData, setFollowersData] = useState(null);

  /**
   * Loads profile data
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getProfileBundle(username);
      setProfile(data);
      setPinnedPosts(data.pinned_posts || []);
      setAnalyticsData(data.analytics || {});
      setFollowersData(data.followers_insights || {});
    } catch (err) {
      setError('فشل تحميل الملف الشخصي');
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  /**
   * Loads profile on mount or username change
   */
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * Handles theme change with persistence
   */
  const handleThemeChange = useCallback(async (newTheme) => {
    setTheme(newTheme);
    try {
      await updateMyProfile({ profile_theme: newTheme });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  }, []);

  /**
   * Handles follow/unfollow action
   */
  const handleFollowClick = useCallback(async () => {
    try {
      await followUser(profile?.user?.username || '');
      setProfile((prev) => ({
        ...prev,
        is_following: !prev.is_following,
        followers_count: prev.is_following
          ? prev.followers_count - 1
          : prev.followers_count + 1,
      }));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  }, [profile?.user?.username]);

  /**
   * Gets content based on active tab
   */
  const getTabContent = useCallback(() => {
    if (!profile) return [];
    
    switch (activeTab) {
      case TABS.POSTS:
        return profile.posts || [];
      case TABS.ARCHIVE:
        return profile.archived_posts || [];
      case TABS.SAVED:
        return profile.saved_posts || [];
      case TABS.PINNED:
        return pinnedPosts;
      case TABS.TAGGED:
        return profile.tagged_posts || [];
      default:
        return [];
    }
  }, [profile, activeTab, pinnedPosts]);

  /**
   * Memoized content to prevent unnecessary re-renders
   */
  const tabContent = useMemo(() => getTabContent(), [getTabContent]);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="page-loader-spinner" />
          <p>جارٍ التحميل...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#ff6b6b' }}>{error || 'حدث خطأ'}</p>
          <Button onClick={loadProfile}>إعادة محاولة</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onAnalyticsClick={() => setShowAnalytics(true)}
          onCustomizationClick={() => setShowCustomization(true)}
          onFollowClick={handleFollowClick}
        />

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 30,
            borderTop: '1px solid var(--line)',
            borderBottom: '1px solid var(--line)',
            marginBottom: 30,
            overflowX: 'auto',
            paddingBottom: 0,
          }}
        >
          {Object.entries(TABS).map(([key, tab]) => {
            // Hide pinned tab if no pinned posts
            if (tab === TABS.PINNED && pinnedPosts.length === 0) return null;

            const tabLabels = {
              posts: 'المنشورات',
              archive: 'الأرشيف',
              saved: 'المحفوظات',
              pinned: '📌 المثبتة',
              tagged: '🏷️ المُعلَّمة',
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '15px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === tab ? 'white' : '#888',
                  cursor: 'pointer',
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        {/* Content Grid — Mobile-first professional gallery (v86.8) */}
        <div className="ym-profile-gallery" dir="rtl">
          {tabContent.length > 0 ? (
            tabContent.map((post) => (
              <div
                key={post.id}
                className="ym-profile-gallery__item"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/post/${post.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/post/${post.id}`);
                  }
                }}
              >
                {post.media_url || post.image_url ? (
                  <img
                    src={post.media_url || post.image_url}
                    alt="منشور"
                    className="ym-profile-gallery__img"
                    loading="lazy"
                  />
                ) : (
                  <div className="ym-profile-gallery__empty">📝</div>
                )}

                {activeTab === TABS.ARCHIVE && (
                  <span className="ym-profile-gallery__badge ym-profile-gallery__badge--archive">
                    <span aria-hidden="true">📦</span>
                    <span>مؤرشف</span>
                  </span>
                )}
                {activeTab === TABS.PINNED && (
                  <span className="ym-profile-gallery__badge ym-profile-gallery__badge--pinned">
                    <span aria-hidden="true">📌</span>
                    <span>مثبت</span>
                  </span>
                )}

                {/* إحصائيات التفاعل — ظاهرة دائماً على الجوال، وعند التمرير على الديسكتوب */}
                <div className="ym-profile-gallery__stats" aria-hidden="true">
                  <span><span aria-hidden="true">❤️</span> {post.likes_count || 0}</span>
                  <span><span aria-hidden="true">💬</span> {post.comments_count || 0}</span>
                  <span><span aria-hidden="true">↗️</span> {post.shares_count || 0}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="ym-profile-gallery__empty-state">
              <p>لا توجد منشورات في هذا القسم</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Modal */}
      <Modal
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        title="تحليلات الحساب الشخصي"
        size="large"
      >
        <div style={{ padding: 20 }}>
          {/* Key Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 15,
              marginBottom: 30,
            }}
          >
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>
                {analyticsData?.profile_views || 0}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>زيارات الملف</div>
            </Card>
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#44ff44' }}>
                {analyticsData?.engagement_rate || 0}%
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>معدل التفاعل</div>
            </Card>
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff9800' }}>
                {analyticsData?.total_impressions || 0}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>الانطباعات</div>
            </Card>
          </div>

          {/* Performance Chart */}
          <h4 style={{ marginBottom: 15 }}>أداء المنشورات (آخر 30 يوم)</h4>
          <div
            style={{
              height: 200,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              padding: 20,
            }}
          >
            {analyticsData?.daily_stats?.map((stat, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${(stat.value / 100) * 100}%`,
                  background: 'var(--primary)',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  minHeight: '5px',
                }}
                title={`${stat.date}: ${stat.value}`}
              />
            )) || (
              <div style={{ width: '100%', textAlign: 'center', color: '#888' }}>
                لا توجد بيانات متاحة
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Customization Modal */}
      <Modal
        open={showCustomization}
        onClose={() => setShowCustomization(false)}
        title="تخصيص مظهر الملف الشخصي"
        size="medium"
      >
        <div style={{ padding: 20 }}>
          <h4 style={{ marginBottom: 15 }}>اختر السمة (Theme)</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: 10,
              marginBottom: 30,
            }}
          >
            {['midnight', 'ocean', 'sunset', 'forest', 'aurora'].map((t) => (
              <div
                key={t}
                onClick={() => handleThemeChange(t)}
                style={{
                  padding: 15,
                  borderRadius: 12,
                  background:
                    t === 'midnight'
                      ? '#0f172a'
                      : t === 'ocean'
                      ? '#0c4a6e'
                      : t === 'sunset'
                      ? '#7c2d12'
                      : t === 'forest'
                      ? '#064e3b'
                      : '#4c1d95',
                  border: theme === t ? '3px solid white' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                }}
              >
                {t.toUpperCase()}
              </div>
            ))}
          </div>

          <h4 style={{ marginBottom: 15 }}>إعدادات متقدمة</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>إظهار شارة التحقق</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>تخطيط الشبكة المتقدم</span>
              <input type="checkbox" />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>إظهار عدد المتابعين</span>
              <input type="checkbox" defaultChecked />
            </label>
          </div>
        </div>
      </Modal>

      {/* Followers Insights Modal */}
      <Modal
        open={showFollowersInsights}
        onClose={() => setShowFollowersInsights(false)}
        title="رؤى المتابعين"
        size="large"
      >
        <div style={{ padding: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 15,
              marginBottom: 30,
            }}
          >
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>
                {followersData?.total_followers || 0}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>إجمالي المتابعين</div>
            </Card>
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#44ff44' }}>
                {followersData?.new_followers_this_week || 0}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>متابعون جدد هذا الأسبوع</div>
            </Card>
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff9800' }}>
                {followersData?.top_follower_engagement || 0}%
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>أعلى تفاعل</div>
            </Card>
          </div>

          <h4 style={{ marginBottom: 15 }}>أكثر المتابعين تفاعلاً</h4>
          <div style={{ display: 'grid', gap: 10 }}>
            {followersData?.top_followers?.map((follower) => (
              <div
                key={follower.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {follower.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{follower.username}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>تفاعل: {follower.engagement_count}</div>
                </div>
              </div>
            )) || (
              <div style={{ color: '#888', textAlign: 'center' }}>لا توجد بيانات</div>
            )}
          </div>
        </div>
      </Modal>

      <style>{`
        /* ============================================================
           v86.8 — Professional Mobile Post Gallery (Profile Page)
           - Mobile first: 3 columns like Instagram
           - Tablet: 4 columns
           - Desktop: 5 columns
           - أحجام خط مرنة clamp()
           - حدود دائرية وظل ناعم
           - لا فيضان أبداً
           ============================================================ */
        .ym-profile-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(4px, 1.2vw, 8px);
          margin-bottom: 30px;
          font-family: 'Cairo', 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          max-width: 100%;
          overflow: hidden;
        }
        .ym-profile-gallery__item {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #1a1a1a;
          border-radius: clamp(6px, 1.8vw, 10px);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
          outline: none;
        }
        .ym-profile-gallery__item:hover,
        .ym-profile-gallery__item:focus-visible {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
          border-color: rgba(139, 92, 246, 0.35);
        }
        .ym-profile-gallery__item:active { transform: scale(0.98); }
        .ym-profile-gallery__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ym-profile-gallery__empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(1.4rem, 6vw, 2rem);
          color: rgba(255, 255, 255, 0.25);
          background: linear-gradient(135deg, #1a1a1a, #222);
        }

        /* شارات الأرشفة والتثبيت — حجم موحّد مرن */
        .ym-profile-gallery__badge {
          position: absolute;
          top: clamp(4px, 1.4vw, 8px);
          inset-inline-end: clamp(4px, 1.4vw, 8px);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: clamp(2px, 0.8vw, 4px) clamp(5px, 1.6vw, 8px);
          border-radius: 999px;
          font-size: clamp(0.58rem, 2.4vw, 0.7rem);
          font-weight: 700;
          color: #fff;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
          line-height: 1.2;
        }
        .ym-profile-gallery__badge--archive {
          background: rgba(0, 0, 0, 0.65);
        }
        .ym-profile-gallery__badge--pinned {
          background: rgba(59, 130, 246, 0.85);
        }

        /* إحصائيات التفاعل — مخفية افتراضياً، تظهر عند التمرير (ديسكتوب) */
        .ym-profile-gallery__stats {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: clamp(6px, 1.8vw, 10px) clamp(6px, 1.6vw, 10px);
          display: flex;
          justify-content: space-between;
          gap: clamp(4px, 1.4vw, 10px);
          background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
          color: #fff;
          font-size: clamp(0.62rem, 2.5vw, 0.78rem);
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          font-variant-numeric: tabular-nums;
        }
        .ym-profile-gallery__stats span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        /* على الديسكتوب: إظهار الإحصائيات عند التمرير */
        @media (hover: hover) {
          .ym-profile-gallery__item:hover .ym-profile-gallery__stats {
            opacity: 1;
          }
        }

        /* على الجوال (أجهزة اللمس): أظهر الإحصائيات دائماً بشفافية خفيفة حتى يراها المستخدم */
        @media (hover: none) {
          .ym-profile-gallery__stats {
            opacity: 0.95;
          }
        }

        /* حالة فارغة */
        .ym-profile-gallery__empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: clamp(24px, 8vw, 48px) 20px;
          color: #888;
          font-size: clamp(0.85rem, 3.4vw, 1rem);
        }

        /* تدرج الأعمدة حسب الشاشة */
        @media (min-width: 640px) {
          .ym-profile-gallery {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
        }
        @media (min-width: 1024px) {
          .ym-profile-gallery {
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
          }
        }

        /* شاشات ضيقة جداً (≤ 360px): اختصار الإحصائيات */
        @media (max-width: 360px) {
          .ym-profile-gallery {
            gap: 3px;
          }
          .ym-profile-gallery__stats {
            padding: 4px 5px;
            font-size: 0.6rem;
            gap: 3px;
          }
          .ym-profile-gallery__badge {
            font-size: 0.55rem;
            padding: 2px 5px;
          }
        }
      `}</style>
    </MainLayout>
  );
}
