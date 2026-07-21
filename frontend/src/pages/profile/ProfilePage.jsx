import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MobileTopBar from '../../components/mobile/MobileTopBar.jsx';
import BottomNav from '../../components/mobile/BottomNav.jsx';
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
 * ProfilePage — v88.4 (ROOT FIX: السحب لأعلى وأسفل يعمل بسلاسة على ويب الجوال)
 * ----------------------------------------------------------------
 * سبب الفشل السابق (v88.2 وأقدم):
 *   الصفحة كانت تُعرض داخل شجرة `.app-shell/.page-content` عبر <MainLayout>.
 *   هذه الشجرة لديها:
 *     .app-shell.yamshat-unified  → height:100dvh; overflow:hidden
 *       .main-shell               → overflow:hidden; height:100%
 *         .page-content           → position:absolute; inset:0; overflow-y:auto  ← ⚠️ scroll container
 *           .profile-page-wrap    → محتوى الصفحة
 *
 *   على WebView الجوال (Chrome Android / Samsung Internet / iOS WebView) تحدث ظاهرة
 *   "double scroll container" أو تعارض قواعد CSS (v87.24 كان يفرض height:auto على
 *   .page-content فيكسر بنيتها). النتيجة: touchmove العمودي لا يصل إلى الحاوية الصحيحة
 *   ويتجمّد السحب.
 *
 * ✅ الحل الجذري v88.4 (مأخوذ حرفياً من PostComposerPage.jsx / ReportModal.jsx):
 *   1) استخدام createPortal لعرض الصفحة مباشرة كطفل لـ document.body — بذلك تخرج
 *      كلياً من شجرة `.app-shell/.page-content` ولا تتأثر بأي overflow أو contain
 *      أو transform أو height:auto من الطبقات الأم.
 *   2) بنية flex-column ثابتة (نفس بصمة PostComposerPage الناجحة):
 *        - MobileTopBar (flex:0 0 auto) — الهيدر الموحّد للتطبيق يبقى ظاهراً
 *        - منطقة التمرير (flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch)
 *        - BottomNav (flex:0 0 auto) — الشريط السفلي يبقى ثابتاً
 *        - shell خارجي position:fixed;inset:0;overflow:hidden — يمنع body من التمرير
 *   3) قفل تمرير body أثناء فتح الصفحة (مثل المودال) لضمان أن المتصفح يوجّه كل
 *      touchmove العمودي إلى منطقة التمرير الداخلية فقط.
 *   4) touch-action:pan-y صريح + overscroll-behavior-y:contain لمنع pull-to-refresh
 *      ومنع أي bubbling للأعلى.
 *   5) كسر أي contain/transform/filter موروثة قد تعطل position:fixed.
 *
 * ⚠️ ملاحظة مهمة: صفحة الملف الشخصي لا تُلف بـ <MainLayout> بعد الآن. بدلاً من ذلك،
 * الـ Portal يحتوي على MobileTopBar و BottomNav داخلياً — نفس النمط الذي جعل
 * PostComposerPage تعمل بسلاسة.
 *
 * النتيجة: نفس بصمة السحب الناجحة في PostComposerPage/ReportModal — يعمل على iOS
 * Safari و Chrome Android و Samsung Internet و WebView داخل التطبيق و Firefox Mobile.
 *
 * RTL كامل + Noto Sans Arabic.
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
  const [isFollowPending, setIsFollowPending] = useState(false);
  const scrollRef = useRef(null);

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

  // ✅ v88.20 FIX: تسريع ظهور صفحة الملف الشخصي على ويب الموبايل
  //  المشكلة السابقة: كنا نمرر forceRefresh:true في كل مرة → الطلب يتجاوز الكاش دائماً
  //  وينتظر رد الخادم (قد يصل لـ 3-5 ثواني على 3G/4G أو cold start لـ Render).
  //  الحل: SWR-style → (1) إظهار أي نسخة مخزّنة فوراً (localStorage + memory cache)
  //  (2) إخفاء مؤشر التحميل إذا وجدت بيانات (3) إعادة التحقق في الخلفية.
  const PROFILE_CACHE_KEY = username ? `yamshat:profile-bundle:${username}` : '';

  const readCachedProfile = useCallback(() => {
    if (!PROFILE_CACHE_KEY) return null;
    try {
      const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // صلاحية 24 ساعة للنسخة المخزّنة — مجرد إظهار فوري ثم يتم التحديث خلفياً
      if (Date.now() - Number(parsed?._ts || 0) > 24 * 60 * 60 * 1000) return null;
      return parsed?.data || null;
    } catch { return null; }
  }, [PROFILE_CACHE_KEY]);

  const writeCachedProfile = useCallback((data) => {
    if (!PROFILE_CACHE_KEY || !data) return;
    try {
      window.localStorage.setItem(
        PROFILE_CACHE_KEY,
        JSON.stringify({ _ts: Date.now(), data })
      );
    } catch { /* ignore quota errors */ }
  }, [PROFILE_CACHE_KEY]);

  const applyProfileData = useCallback((data) => {
    if (!data) return;
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
  }, []);

  const loadProfile = useCallback(async ({ background = false } = {}) => {
    try {
      if (!background) setError('');
      // ✅ الأهم: لا نمرر forceRefresh دائماً → نسمح للميموري-كاش (30ث) بالعمل
      const { data } = await getProfileBundle(username, { forceRefresh: background });
      applyProfileData(data);
      writeCachedProfile(data);
    } catch (err) {
      if (!background) {
        // إذا لم تكن لدينا أي نسخة مخزّنة نسجل خطأ مرئياً
        setError('فشل تحميل الملف الشخصي');
      }
      console.error('Failed to load profile:', err);
    } finally {
      if (!background) setLoading(false);
    }
  }, [username, applyProfileData, writeCachedProfile]);

  // ✅ المرحلة الأولى: إظهار فوري من الكاش ثم تحديث في الخلفية (SWR pattern)
  useEffect(() => {
    let cancelled = false;
    const cached = readCachedProfile();
    if (cached) {
      applyProfileData(cached);
      setLoading(false); // لا نعرض مؤشر التحميل — المحتوى جاهز فوراً
      // تحديث خلفي صامت من الخادم (stale-while-revalidate)
      loadProfile({ background: true });
    } else {
      setLoading(true);
      loadProfile({ background: false });
    }
    return () => { cancelled = true; void cancelled; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // ✅ v88.12 FIX: إعادة تحميل بيانات الملف الشخصي فور تحديث الأفاتار أو الغلاف
  // من داخل ProfileHeader، حتى لا تختفي الصورة عند التنقل إلى الرئيسية والعودة.
  // v88.20: تحديث إجباري من الخادم (ليس من الكاش) لأن الميديا تغيرت للتو.
  useEffect(() => {
    const handler = () => { loadProfile({ background: true }); };
    window.addEventListener('yamshat:profile-media-updated', handler);
    return () => window.removeEventListener('yamshat:profile-media-updated', handler);
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

  // ✅ v88.4: عنوان الصفحة
  useEffect(() => {
    const prev = document.title;
    const label = profile?.user?.username ? `@${profile.user.username}` : 'الملف الشخصي';
    document.title = `${label} · YAMSHAT`;
    return () => { document.title = prev; };
  }, [profile?.user?.username]);

  // ✅ v88.4: قفل تمرير body أثناء فتح الصفحة — مثل المودال بالضبط.
  // هذا يمنع المتصفح من محاولة تمرير .page-content الأم عندما يلمس المستخدم الشاشة،
  // ويضمن توجيه كل touchmove العمودي إلى منطقة التمرير الداخلية للصفحة.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // ✅ v88.4: عند فتح الصفحة، نُصعّد التمرير الداخلي إلى الأعلى
  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      try { node.scrollTop = 0; } catch { /* ignore */ }
    }
  }, [username]);

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
    // ✅ v88.4: نُمرّر منطقة التمرير الداخلية للـ portal (وليس window)
    const node = scrollRef.current;
    if (node) {
      try { node.scrollTo({ top: 0, behavior: 'smooth' }); } catch { node.scrollTop = 0; }
    }
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

  const handleFollowClick = useCallback(async () => {
    const targetUsername = profile?.user?.username || '';
    if (!targetUsername || isFollowPending) return;

    setIsFollowPending(true);
    try {
      // لا نعكس الحالة محلياً بالتخمين: الخادم يعيد following النهائي بعد toggle.
      const response = await followUser(targetUsername);
      const following = Boolean(response?.data?.following);
      const followers = Number(response?.data?.followers);

      setProfile((prev) => {
        if (!prev) return prev;
        const nextFollowers = Number.isFinite(followers)
          ? followers
          : Math.max(0, Number(prev?.counts?.followers ?? prev?.followers_count ?? 0) + (following ? 1 : -1));
        const next = {
          ...prev,
          is_following: following,
          following,
          followers_count: nextFollowers,
          counts: { ...(prev.counts || {}), followers: nextFollowers },
          relationship: { ...(prev.relationship || {}), following },
          user: { ...(prev.user || {}), followers_count: nextFollowers, following },
        };
        writeCachedProfile(next);
        return next;
      });
    } catch (error) {
      console.error('Failed to follow user:', error);
      setError('تعذر حفظ حالة المتابعة. حاول مرة أخرى.');
    } finally {
      setIsFollowPending(false);
    }
  }, [profile?.user?.username, isFollowPending, writeCachedProfile]);

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

  const tabContent = useMemo(() => getTabContent().map(normalizeGalleryPost), [getTabContent]);

  // ============================================================
  // ⭐ محتوى الـ Portal (نفس بصمة PostComposerPage الناجحة)
  // ============================================================
  const content = (
    <div
      dir="rtl"
      className="ymp-portal-shell"
      data-yam-profile-portal="true"
      style={{
        // ⭐ position:fixed;inset:0 يعزل الصفحة كلياً عن أي scroll container أم.
        position: 'fixed',
        inset: 0,
        zIndex: 10030,
        display: 'flex',
        flexDirection: 'column',
        background: '#0A0A0F',
        color: '#F4F4F5',
        fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif",
        // منع تمرير الـ shell نفسه (فقط الابن الداخلي يتمرر) — بصمة ReportModal.
        overflow: 'hidden',
        // منع pull-to-refresh على الجوال والسحب الأفقي.
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        // كسر أي contain/transform موروثة قد تعطل position:fixed.
        transform: 'none',
        filter: 'none',
        perspective: 'none',
        contain: 'none',
        willChange: 'auto',
        pointerEvents: 'auto',
      }}
    >
      {/* ============================================================
          الشريط العلوي الموحّد — flex:0 0 auto — ثابت لا يتمرر
          ============================================================ */}
      <div
        className="ymp-top-fixed"
        style={{
          flex: '0 0 auto',
          touchAction: 'manipulation',
          zIndex: 5,
        }}
      >
        <MobileTopBar transparent={false} />
      </div>

      {/* ============================================================
          ⭐ منطقة التمرير الداخلية — نفس بصمة PostComposerPage/ReportModal
          هذا هو العنصر الوحيد الذي يستقبل touchmove العمودي ويتمرر.
          ============================================================ */}
      <main
        ref={scrollRef}
        className="ymp-scroll-area"
        style={{
          flex: '1 1 auto',
          minHeight: 0, // ⭐ حرج داخل flex-column على iOS Safari
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          overscrollBehaviorX: 'none',
          touchAction: 'pan-y',
          scrollBehavior: 'smooth',
          contain: 'none',
          willChange: 'scroll-position',
          transform: 'none',
          filter: 'none',
          perspective: 'none',
          pointerEvents: 'auto',
          // padding سفلي كافٍ ليتنفس المحتوى فوق BottomNav
          paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {loading && !profile ? (
          /* ✅ v88.20: skeleton خفيف بدلاً من spinner فارغ — يقلّل إحساس التأخير */
          <div className="ymp-skeleton-wrap" aria-busy="true" aria-live="polite">
            <div className="ymp-sk-cover" />
            <div className="ymp-sk-avatar" />
            <div className="ymp-sk-line ymp-sk-line--name" />
            <div className="ymp-sk-line ymp-sk-line--bio" />
            <div className="ymp-sk-stats">
              <div className="ymp-sk-stat" />
              <div className="ymp-sk-stat" />
              <div className="ymp-sk-stat" />
            </div>
            <div className="ymp-sk-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="ymp-sk-tile" />
              ))}
            </div>
          </div>
        ) : (error && !profile) ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#ff6b6b' }}>{error || 'حدث خطأ'}</p>
            <Button onClick={() => loadProfile()}>إعادة محاولة</Button>
          </div>
        ) : profile ? (
          <div
            className="profile-page-wrap"
            style={{
              maxWidth: 1000,
              margin: '0 auto',
              padding: '20px',
              width: '100%',
              boxSizing: 'border-box',
              touchAction: 'pan-y',
            }}
          >
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
              onAnalyticsClick={() => setShowAnalytics(true)}
              onCustomizationClick={openCustomization}
              onFollowClick={handleFollowClick}
              isFollowPending={isFollowPending}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              tabs={availableTabs}
            />

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
        ) : null}
      </main>

      {/* ============================================================
          الشريط السفلي الموحّد — flex:0 0 auto — ثابت لا يتمرر
          ============================================================ */}
      <div
        className="ymp-bottom-fixed"
        style={{
          flex: '0 0 auto',
          touchAction: 'manipulation',
          zIndex: 5,
        }}
      >
        <BottomNav />
      </div>

      {/* Analytics Modal */}
      <Modal
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        title="تحليلات الحساب الشخصي"
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

      {/* ============================================================
          حقن CSS مضاد: نضمن أن أي طبقة legacy لا تكسر السحب داخل الصفحة
          ============================================================ */}
      <style>{`
        /* ✅ v88.4 — Portal shell محصّن ضد أي CSS legacy (نفس بصمة v88.3 الناجحة) */
        .ymp-portal-shell,
        .ymp-portal-shell * {
          -webkit-tap-highlight-color: transparent;
        }
        .ymp-portal-shell .ymp-scroll-area {
          -webkit-overflow-scrolling: touch !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          touch-action: pan-y !important;
          overscroll-behavior-y: contain !important;
          overscroll-behavior-x: none !important;
          contain: none !important;
          transform: none !important;
          filter: none !important;
          perspective: none !important;
          min-height: 0 !important;
          pointer-events: auto !important;
        }
        /* الحاوية الداخلية: لا تحبس اللمس العمودي */
        .ymp-portal-shell .profile-page-wrap,
        .ymp-portal-shell .profile-page-wrap * {
          box-sizing: border-box;
        }
        .ymp-portal-shell .profile-page-wrap {
          touch-action: pan-y !important;
          overflow: visible !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .ymp-portal-shell .ym-profile-gallery {
          overflow: visible !important;
          touch-action: pan-y !important;
        }
        .ymp-portal-shell .profile-page-wrap > *,
        .ymp-portal-shell .ym-profile-gallery > * {
          touch-action: pan-y;
        }
        /* الأزرار والروابط: manipulation لتفعيل النقر السريع */
        .ymp-portal-shell button,
        .ymp-portal-shell a,
        .ymp-portal-shell label,
        .ymp-portal-shell [role="button"] {
          touch-action: manipulation;
          pointer-events: auto !important;
        }
        /* scrollbar لطيف على الديسكتوب فقط */
        .ymp-portal-shell .ymp-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .ymp-portal-shell .ymp-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .ymp-portal-shell .ymp-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.45);
          border-radius: 999px;
        }
        @media (max-width: 768px) {
          .ymp-portal-shell .ymp-scroll-area {
            scrollbar-width: none;
          }
          .ymp-portal-shell .ymp-scroll-area::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
        }
        /* iOS Safari: momentum scroll تفعيل قوي */
        @supports (-webkit-touch-callout: none) {
          .ymp-portal-shell .ymp-scroll-area {
            -webkit-overflow-scrolling: touch !important;
            overflow-y: auto !important;
            touch-action: pan-y !important;
          }
        }

        /* ============================================================
           v86.8 — Professional Mobile Post Gallery (Profile Page)
           ============================================================ */
        .ymp-portal-shell .ym-profile-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(4px, 1.2vw, 8px);
          margin-bottom: 30px;
          font-family: 'Cairo', 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          max-width: 100%;
        }
        .ymp-portal-shell .ym-profile-gallery__item {
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
        .ymp-portal-shell .ym-profile-gallery__item:hover,
        .ymp-portal-shell .ym-profile-gallery__item:focus-visible {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
          border-color: rgba(139, 92, 246, 0.35);
        }
        .ymp-portal-shell .ym-profile-gallery__item:active { transform: scale(0.98); }
        .ymp-portal-shell .ym-profile-gallery__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: linear-gradient(135deg, rgba(19, 23, 42, 0.96), rgba(11, 16, 32, 0.92));
        }
        .ymp-portal-shell .ym-profile-gallery__video { pointer-events: none; }
        .ymp-portal-shell .ym-profile-gallery__play-badge {
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
        .ymp-portal-shell .ym-profile-gallery__empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(1.4rem, 6vw, 2rem);
          color: rgba(255, 255, 255, 0.25);
          background: linear-gradient(135deg, #1a1a1a, #222);
        }
        .ymp-portal-shell .ym-profile-gallery__badge {
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
        .ymp-portal-shell .ym-profile-gallery__badge--archive { background: rgba(0, 0, 0, 0.65); }
        .ymp-portal-shell .ym-profile-gallery__badge--pinned { background: rgba(59, 130, 246, 0.85); }
        .ymp-portal-shell .ym-profile-gallery__stats {
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
        .ymp-portal-shell .ym-profile-gallery__stats span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        @media (hover: hover) {
          .ymp-portal-shell .ym-profile-gallery__item:hover .ym-profile-gallery__stats { opacity: 1; }
        }
        @media (hover: none) {
          .ymp-portal-shell .ym-profile-gallery__stats { opacity: 0.95; }
        }
        .ymp-portal-shell .ym-profile-gallery__empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: clamp(24px, 8vw, 48px) 20px;
          color: #888;
          font-size: clamp(0.85rem, 3.4vw, 1rem);
        }
        @media (min-width: 640px) {
          .ymp-portal-shell .ym-profile-gallery {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
        }
        @media (min-width: 1024px) {
          .ymp-portal-shell .ym-profile-gallery {
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
          }
        }
        @media (max-width: 360px) {
          .ymp-portal-shell .ym-profile-gallery { gap: 3px; }
          .ymp-portal-shell .ym-profile-gallery__stats {
            padding: 4px 5px;
            font-size: 0.6rem;
            gap: 3px;
          }
          .ymp-portal-shell .ym-profile-gallery__badge {
            font-size: 0.55rem;
            padding: 2px 5px;
          }
          .ymp-portal-shell .ym-profile-gallery__play-badge {
            width: 30px;
            height: 30px;
            inset-inline-start: 8px;
            bottom: 8px;
          }
        }

        /* ✅ v88.4: تحييد أي قواعد legacy من v87.24 قد تحاول لمس .page-content
           (لم نعد نستخدمها — الصفحة الآن في portal مباشرة على body). */
        body > .ymp-portal-shell {
          isolation: isolate;
        }

        /* ✅ v88.20 — Skeleton Screen للملف الشخصي أثناء التحميل الأولي.
           يقلّل إحساس التأخر على ويب الموبايل ويُظهر هيكل الصفحة مباشرة. */
        .ymp-portal-shell .ymp-skeleton-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
        }
        .ymp-portal-shell .ymp-sk-cover,
        .ymp-portal-shell .ymp-sk-avatar,
        .ymp-portal-shell .ymp-sk-line,
        .ymp-portal-shell .ymp-sk-stat,
        .ymp-portal-shell .ymp-sk-tile {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.09) 50%,
            rgba(255,255,255,0.04) 100%
          );
          background-size: 200% 100%;
          animation: ymp-shimmer 1.4s ease-in-out infinite;
          border-radius: 12px;
        }
        .ymp-portal-shell .ymp-sk-cover {
          height: clamp(120px, 28vw, 180px);
          border-radius: 16px;
          margin-bottom: 12px;
        }
        .ymp-portal-shell .ymp-sk-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          margin: -60px auto 12px;
          border: 4px solid #0A0A0F;
        }
        .ymp-portal-shell .ymp-sk-line {
          height: 14px;
          margin: 10px auto;
        }
        .ymp-portal-shell .ymp-sk-line--name {
          width: 40%;
          height: 18px;
        }
        .ymp-portal-shell .ymp-sk-line--bio {
          width: 70%;
          height: 12px;
        }
        .ymp-portal-shell .ymp-sk-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 18px 0 22px;
        }
        .ymp-portal-shell .ymp-sk-stat {
          height: 58px;
        }
        .ymp-portal-shell .ymp-sk-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(4px, 1.2vw, 8px);
        }
        .ymp-portal-shell .ymp-sk-tile {
          aspect-ratio: 1 / 1;
          border-radius: clamp(6px, 1.8vw, 10px);
        }
        @keyframes ymp-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ymp-portal-shell .ymp-sk-cover,
          .ymp-portal-shell .ymp-sk-avatar,
          .ymp-portal-shell .ymp-sk-line,
          .ymp-portal-shell .ymp-sk-stat,
          .ymp-portal-shell .ymp-sk-tile {
            animation: none;
          }
        }
      `}</style>
    </div>
  );

  // ⭐ createPortal → document.body: الصفحة تخرج كلياً من شجرة .app-shell/.page-content
  // ولا يمكن لأي CSS من طبقات الـ layout أن يكسر السحب داخلها.
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
