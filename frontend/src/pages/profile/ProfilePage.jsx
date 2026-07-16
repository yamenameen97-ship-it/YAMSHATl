import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import ProfileHeader from '../../components/profile/ProfileHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getProfileBundle, updateMyProfile, followUser } from '../../api/users.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { getCurrentUsername } from '../../utils/auth.js';

const TABS = {
  POSTS: 'posts',
  ARCHIVE: 'archive',
  SAVED: 'saved',
  PINNED: 'pinned',
  TAGGED: 'tagged',
};

const TAB_ITEMS = {
  [TABS.POSTS]: { key: TABS.POSTS, label: 'المنشورات' },
  [TABS.ARCHIVE]: { key: TABS.ARCHIVE, label: 'الأرشيف' },
  [TABS.SAVED]: { key: TABS.SAVED, label: 'المحفوظات' },
  [TABS.PINNED]: { key: TABS.PINNED, label: 'المثبتة', icon: '📌' },
  [TABS.TAGGED]: { key: TABS.TAGGED, label: 'المُعلَّمة', icon: '🏷️' },
};

const normalizeRequestedTab = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.values(TABS).includes(normalized) ? normalized : TABS.POSTS;
};

const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i;

const looksLikeVideoUrl = (value = '') => {
  const candidate = String(value || '').trim().toLowerCase();
  if (!candidate) return false;
  return VIDEO_MEDIA_RE.test(candidate)
    || /(^data:video\/)|([?&](resource_type|content_type|mime_type)=video)/i.test(candidate)
    || /\/video\/upload\//i.test(candidate)
    || /\b(video|reel|stream|playlist)\b/i.test(candidate);
};

const normalizeGalleryPost = (post) => {
  if (!post || typeof post !== 'object') return post;

  const rawMediaCandidates = [
    ...(Array.isArray(post.media_urls) ? post.media_urls : []),
    post.media_url,
    post.media,
    post.video_url,
    post.image_url,
    post.thumbnail_url,
    post.preview_url,
  ].filter(Boolean);

  const resolvedMedia = Array.from(new Set(rawMediaCandidates.map((item) => resolveMediaUrl(item)).filter(Boolean)));
  const primaryMediaUrl = resolvedMedia[0] || '';
  const hasVideo = Boolean(
    post.has_video
    || String(post.media_type || post.type || '').toLowerCase() === 'video'
    || resolvedMedia.some(looksLikeVideoUrl)
    || looksLikeVideoUrl(primaryMediaUrl)
  );

  const posterCandidates = [
    post.thumbnail_url,
    post.preview_url,
    post.image_url,
    ...resolvedMedia.slice(1),
  ]
    .map((item) => resolveMediaUrl(item))
    .filter(Boolean);

  const posterUrl = posterCandidates.find((item) => !looksLikeVideoUrl(item)) || '';

  return {
    ...post,
    media_url: primaryMediaUrl,
    media: primaryMediaUrl,
    image_url: hasVideo ? (posterUrl || '') : (posterUrl || primaryMediaUrl),
    thumbnail_url: posterUrl || '',
    preview_url: posterUrl || primaryMediaUrl,
    has_video: hasVideo,
  };
};

/**
 * ProfilePage Component
 * Features: Tabs optimization, Analytics, Pinned content, Profile customization, Followers insights
 */
export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const pageRootRef = useRef(null);

  const requestedTab = normalizeRequestedTab(searchParams.get('tab'));
  const requestedPanel = String(searchParams.get('panel') || '').trim().toLowerCase();

  const availableTabs = useMemo(() => {
    if (!profile) return [TAB_ITEMS[TABS.POSTS]];

    const items = [TAB_ITEMS[TABS.POSTS]];

    if (Array.isArray(pinnedPosts) && pinnedPosts.length > 0) {
      items.push(TAB_ITEMS[TABS.PINNED]);
    }

    if (isOwnProfile && Array.isArray(profile.archived_posts) && profile.archived_posts.length > 0) {
      items.push(TAB_ITEMS[TABS.ARCHIVE]);
    }

    if (isOwnProfile && Array.isArray(profile.saved_posts) && profile.saved_posts.length > 0) {
      items.push(TAB_ITEMS[TABS.SAVED]);
    }

    items.push(TAB_ITEMS[TABS.TAGGED]);
    return items;
  }, [profile, pinnedPosts, isOwnProfile]);

  /**
   * Loads profile data
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getProfileBundle(username, { forceRefresh: true });
      setProfile(data);
      setPinnedPosts(Array.isArray(data.pinned_posts) ? data.pinned_posts : []);
      setAnalyticsData(data.analytics || {});
      setFollowersData(data.followers_insights || {});
      setTheme(
        data?.user?.profile?.profile_theme
        || data?.user?.profile?.theme
        || data?.profile_theme
        || 'midnight'
      );
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

  useEffect(() => {
    const allowedTabs = availableTabs.map((tab) => tab.key);
    if (allowedTabs.length === 0) return;

    setActiveTab((currentTab) => {
      if (allowedTabs.includes(requestedTab)) return requestedTab;
      if (allowedTabs.includes(currentTab)) return currentTab;
      return allowedTabs[0];
    });
  }, [availableTabs, requestedTab]);

  useEffect(() => {
    if (requestedPanel === 'themes' && isOwnProfile) {
      setShowCustomization(true);
    }
  }, [requestedPanel, isOwnProfile]);

  // ✅ v88.2 ROOT FIX: لا نضيف أي class على .page-content (كان ذلك يُطابق
  // الـselector العريض [class*="profile-page"] في v87.24 ويفرض height:auto
  // على .page-content فيكسر بنيتها (position:absolute; inset:0)
  // ويلغي التمرير تماماً). الآن التمرير يعمل تلقائياً على
  // .page-content مثل بقية الصفحات الناجحة (FeedMobile, Home...).
  // الـCSS المحدد في yamshat-fixes-v87.24 يفرض :has(.profile-page-wrap)
  // قواعد التمرير للمتصفحات الحديثة، وfallback JS أدناه للقديمة.
  useEffect(() => {
    const rootEl = pageRootRef.current;
    const pageContent = rootEl?.closest?.('.page-content');
    if (!pageContent) return undefined;

    // ✅ v88.2: fallback JS للمتصفحات التي لا تدعم :has() —
    // نضيف data-attribute بدل class (لا يُطابق الـselectors القديمة)
    pageContent.setAttribute('data-yam-profile-active', 'true');

    // ✅ إزالة class القديمة إن وجدت من إصدار سابق (منع للـlegacy leak)
    pageContent.classList.remove('profile-page-content-scroll');

    // ✅ فرض قواعد التمرير الاحتياطية مباشرة على element
    // (حيادية ضد أي legacy CSS يحاول override)
    const prev = {
      overflowY: pageContent.style.overflowY,
      overflowX: pageContent.style.overflowX,
      webkitOverflowScrolling: pageContent.style.webkitOverflowScrolling,
      touchAction: pageContent.style.touchAction,
      overscrollBehaviorY: pageContent.style.overscrollBehaviorY,
    };
    pageContent.style.overflowY = 'auto';
    pageContent.style.overflowX = 'hidden';
    pageContent.style.webkitOverflowScrolling = 'touch';
    pageContent.style.touchAction = 'pan-y';
    pageContent.style.overscrollBehaviorY = 'contain';

    return () => {
      pageContent.removeAttribute('data-yam-profile-active');
      // حاول إعادة القيم الأصلية
      pageContent.style.overflowY = prev.overflowY;
      pageContent.style.overflowX = prev.overflowX;
      pageContent.style.webkitOverflowScrolling = prev.webkitOverflowScrolling;
      pageContent.style.touchAction = prev.touchAction;
      pageContent.style.overscrollBehaviorY = prev.overscrollBehaviorY;
    };
  }, []);

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

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === TABS.POSTS) {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextTab);
    }

    setSearchParams(nextParams, { replace: true });
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const openCustomization = useCallback(() => {
    setShowCustomization(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('panel', 'themes');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeCustomization = useCallback(() => {
    setShowCustomization(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('panel');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  /**
   * Handles follow/unfollow action
   */
  const handleFollowClick = useCallback(async () => {
    const targetUsername = profile?.user?.username || '';
    if (!targetUsername) return;

    try {
      await followUser(targetUsername);
      setProfile((prev) => {
        if (!prev) return prev;
        const isFollowing = Boolean(prev.is_following);
        const currentFollowers = Number(prev.followers_count || 0);
        return {
          ...prev,
          is_following: !isFollowing,
          followers_count: isFollowing
            ? Math.max(0, currentFollowers - 1)
            : currentFollowers + 1,
        };
      });
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
  const tabContent = useMemo(() => getTabContent().map(normalizeGalleryPost), [getTabContent]);

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
      <div ref={pageRootRef} className="profile-page-wrap" style={{ maxWidth: 1000, margin: '0 auto', padding: '20px', width: '100%', boxSizing: 'border-box' }}>
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onAnalyticsClick={() => setShowAnalytics(true)}
          onCustomizationClick={openCustomization}
          onFollowClick={handleFollowClick}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={availableTabs}
        />

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
                  post.has_video ? (
                    <>
                      <video
                        src={post.media_url}
                        poster={post.thumbnail_url || post.image_url || undefined}
                        className="ym-profile-gallery__img ym-profile-gallery__video"
                        muted
                        playsInline
                        preload="metadata"
                        aria-label="معاينة فيديو المنشور"
                      />
                      <span className="ym-profile-gallery__play-badge" aria-hidden="true">▶</span>
                    </>
                  ) : (
                    <img
                      src={post.image_url || post.media_url}
                      alt="منشور"
                      className="ym-profile-gallery__img"
                      loading="lazy"
                      decoding="async"
                    />
                  )
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

      <style>{`
        /* ✅ v88.2 ROOT FIX — نمط "بوست البلاغات": تمرير يحدث على
           .page-content الأم (مثل باقي الصفحات الناجحة)
           و.profile-page-wrap تبقى حاوية flow طبيعية (overflow:visible).
           القواعد التفصيلية مفروضة في yamshat-fixes-v87.24 مع :has(). */

        /* fallback للمتصفحات القديمة دون :has() — نستخدم data-attribute */
        .app-shell .page-content[data-yam-profile-active="true"],
        .page-content[data-yam-profile-active="true"] {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
          overscroll-behavior-y: contain !important;
          overscroll-behavior-x: none !important;
        }

        .profile-page-wrap {
          min-height: 100%;
          padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px));
          touch-action: pan-y;
          overflow: visible;
          -webkit-overflow-scrolling: touch;
        }
        .profile-page-wrap,
        .profile-page-wrap * {
          box-sizing: border-box;
        }
        .profile-page-wrap .ym-profile-gallery {
          overflow: visible;
          touch-action: pan-y;
        }

        /* تأكيد: منع أي طفل من احتباس اللمس العمودي */
        .profile-page-wrap > *,
        .profile-page-wrap .ym-profile-gallery > * {
          touch-action: pan-y;
        }
      `}</style>

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
            {Array.isArray(analyticsData?.daily_stats) && analyticsData.daily_stats.length > 0 ? (
              analyticsData.daily_stats.map((stat, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(5, Number(stat.value || 0))}%`,
                    background: 'var(--primary)',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative',
                    minHeight: '5px',
                  }}
                  title={`${stat.date}: ${stat.value}`}
                />
              ))
            ) : (
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
        onClose={closeCustomization}
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
            {Array.isArray(followersData?.top_followers) && followersData.top_followers.length > 0 ? (
              followersData.top_followers.map((follower) => (
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
                    {String(follower.username || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{follower.username}</div>
                    <div style={{ color: '#888', fontSize: 12 }}>تفاعل: {follower.engagement_count}</div>
                  </div>
                </div>
              ))
            ) : (
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
          background: linear-gradient(135deg, rgba(19, 23, 42, 0.96), rgba(11, 16, 32, 0.92));
        }
        .ym-profile-gallery__video {
          pointer-events: none;
        }
        .ym-profile-gallery__play-badge {
          position: absolute;
          inset-inline-start: 10px;
          bottom: 10px;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.66);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
          font-size: 0.95rem;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
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
          .ym-profile-gallery__play-badge {
            width: 30px;
            height: 30px;
            inset-inline-start: 8px;
            bottom: 8px;
          }
        }
      `}</style>
    </MainLayout>
  );
}
