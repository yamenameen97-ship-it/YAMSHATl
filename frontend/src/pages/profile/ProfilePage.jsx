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

        {/* Content Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 15,
            marginBottom: 30,
          }}
        >
          {tabContent.length > 0 ? (
            tabContent.map((post) => (
              <div
                key={post.id}
                style={{
                  aspectRatio: '1/1',
                  background: '#222',
                  borderRadius: 8,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <img
                  src={post.media_url || post.image_url}
                  alt="post"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {activeTab === TABS.ARCHIVE && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                    }}
                  >
                    📦 مؤرشف
                  </div>
                )}
                {activeTab === TABS.PINNED && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(59, 130, 246, 0.8)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                    }}
                  >
                    📌 مثبت
                  </div>
                )}
                {/* Engagement Stats Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    padding: '10px',
                    display: 'flex',
                    gap: 15,
                    fontSize: 12,
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  className="post-stats"
                >
                  <span>❤️ {post.likes_count || 0}</span>
                  <span>💬 {post.comments_count || 0}</span>
                  <span>↗️ {post.shares_count || 0}</span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px 20px',
                color: '#888',
              }}
            >
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
        .post-stats {
          opacity: 0 !important;
        }
        div:hover .post-stats {
          opacity: 1 !important;
        }
      `}</style>
    </MainLayout>
  );
}
