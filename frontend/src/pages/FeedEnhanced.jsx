import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayoutEnhanced from '../components/layout/MainLayout-Enhanced.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import CreatePostEnhanced from '../components/feed/CreatePost-Enhanced.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import FeedSkeleton from '../components/feed/FeedSkeleton.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { likePost, deletePost } from '../api/posts.js';
import { getUsers, followUser } from '../api/users.js';
import { getLiveRooms } from '../api/live.js';
import { getNotifications } from '../api/notifications.js';
import { buildTrendingHashtags, rankSuggestedUsers } from '../services/recommendationService.js';
import { avatarGradient, formatCompactNumber, formatTimeAgo, initialsFromName } from '../components/yamshat/YamshatDesign.js';
import { getCurrentUsername } from '../utils/auth.js';
import { selectUnreadTotal, useChatStore } from '../store/appStore.js';
import logger from '../utils/logger.js';

const LEFT_NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: '⌂' },
  { to: '/search', label: 'الاستكشاف', icon: '⌕' },
  { to: '/groups', label: 'المجموعات', icon: '◫' },
  { to: '/inbox', label: 'الرسائل', icon: '✉', badgeType: 'messages' },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔', badgeType: 'notifications' },
  { to: '/profile', label: 'الملف الشخصي', icon: '◌' },
  { to: '/profile?tab=saved', label: 'الملفات المحفوظة', icon: '⌑' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙' },
];

const TOP_ACTIONS = [
  { to: '/', label: 'الرئيسية', icon: '⌂' },
  { to: '/users', label: 'الأصدقاء', icon: '👥' },
  { to: '/inbox', label: 'الرسائل', icon: '✉', badgeType: 'messages' },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔', badgeType: 'notifications' },
];

const SERVICE_SHORTCUTS = [
  { title: 'الدردشة', icon: '💬' },
  { title: 'المكالمات', icon: '📞' },
  { title: 'المجموعات', icon: '👥' },
  { title: 'الأخبار', icon: '📰' },
  { title: 'الفعاليات', icon: '🏟️' },
  { title: 'البث المباشر', icon: '📺' },
  { title: 'الملفات', icon: '📁' },
  { title: 'المدونة', icon: '✍️' },
  { title: 'السوق', icon: '🛍️' },
];

const SERVICE_TILE_TONES = [
  'tone-chat',
  'tone-calls',
  'tone-groups',
  'tone-news',
  'tone-events',
  'tone-live',
  'tone-files',
  'tone-blog',
  'tone-market',
];

const QUICK_COMPOSER_ACTIONS = ['صورة', 'فيديو', 'استطلاع', 'استطلاع/نشاط'];

const FALLBACK_SUGGESTIONS = [
  { username: 'UIUX.design', handle: '@uiux.design', followers_count: 12000, is_verified: true },
  { username: 'tech.arabic', handle: '@tech.arabic', followers_count: 8700, is_verified: false },
  { username: 'web.developer', handle: '@web.developer', followers_count: 6200, is_verified: true },
];

function Avatar({ name, src, size = 46, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    border: ring ? '2px solid rgba(139,92,246,0.78)' : '1px solid rgba(255,255,255,0.08)',
    boxShadow: ring ? '0 0 0 4px rgba(139,92,246,0.14)' : 'none',
    flexShrink: 0,
    background: 'rgba(15,23,42,0.8)',
  };

  return src
    ? <img src={src} alt={name} style={style} />
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(name) }}>{initialsFromName(name).slice(0, 1)}</div>;
}

function mediaListFromPost(post) {
  if (Array.isArray(post?.media_urls) && post.media_urls.length) return post.media_urls;
  if (Array.isArray(post?.images) && post.images.length) return post.images;
  if (post?.image_url) return [post.image_url];
  if (post?.media_url) return [post.media_url];
  if (post?.media) return [post.media];
  return [];
}

function FeedMedia({ post, media }) {
  if (post.id === 'yamshat-featured-brand-post') {
    return (
      <div className="desktop-brand-hero">
        <div className="desktop-brand-hero-mark-wrap">
          <img src="/brand/yamshat-logo.jpg" alt="Yamshat" className="desktop-brand-hero-logo" />
        </div>
        <div className="desktop-brand-hero-wordmark">YAMSHAT</div>
        <strong>{post.content || 'هيا لنجرب منصة يام شات'}</strong>
      </div>
    );
  }

  if (!media.length) {
    return (
      <div className="desktop-brand-fallback">
        <div className="desktop-brand-symbol">Y</div>
        <strong>{post.content || 'YAMSHAT'}</strong>
      </div>
    );
  }

  return <img src={media[0]} alt={post.content || post.username || 'Yamshat post'} className="desktop-post-media" />;
}

function DesktopPostCard({ post, onLike, onDelete, localLikeState, onToggleLocalLike }) {
  const media = mediaListFromPost(post);
  const isLocalBrandPost = post.id === 'yamshat-featured-brand-post';
  const likes = isLocalBrandPost ? localLikeState.likes : Number(post.likes_count ?? post.like_count ?? post.likes ?? 0);
  const comments = Number(post.comments_count ?? post.comment_count ?? Math.max(12, Math.floor(likes / 4.2)));
  const shares = Number(post.share_count ?? post.shares ?? Math.max(6, Math.floor(likes / 8.3)));
  const userAvatar = post.user_avatar || post.avatar || '';

  return (
    <article className={`desktop-post-card ${isLocalBrandPost ? 'featured' : ''}`}>
      <div className="desktop-post-head">
        <div className="desktop-post-author">
          <Avatar name={post.username || 'Yamshat'} src={userAvatar} size={50} ring={Boolean(post.is_brand_seed)} />
          <div>
            <div className="desktop-post-author-line">
              <strong>{post.username || 'Yamshat'}</strong>
              {post.is_verified || post.is_brand_seed ? <span className="verify-dot">✓</span> : null}
            </div>
            <small>{post.created_at ? formatTimeAgo(post.created_at) : 'الآن'}</small>
          </div>
        </div>

        <div className="desktop-post-tools">
          {post.is_brand_seed ? <span className="desktop-post-badge">منشور مثبت</span> : null}
          {!isLocalBrandPost ? <button type="button" className="desktop-ghost-btn" onClick={() => onDelete(post.id)}>⋯</button> : <button type="button" className="desktop-ghost-btn">⋯</button>}
        </div>
      </div>

      <div className="desktop-post-copy">{post.content || 'شارك أفكارك مع مجتمع يام شات.'}</div>

      <FeedMedia post={post} media={media} />

      <div className="desktop-post-meta-row">
        <div className="desktop-post-reactions">🟣 💜 🔥 <span>{formatCompactNumber(likes)}</span></div>
        <div className="desktop-post-stats">
          <span>{formatCompactNumber(comments)} تعليق</span>
          <span>{formatCompactNumber(shares)} مشاركة</span>
        </div>
      </div>

      <div className="desktop-post-actions">
        <button type="button" className={`desktop-action-btn ${isLocalBrandPost && localLikeState.liked ? 'active' : ''}`} onClick={() => (isLocalBrandPost ? onToggleLocalLike() : onLike(post.id))}>
          ❤ <span>{formatCompactNumber(likes)}</span>
        </button>
        <button type="button" className="desktop-action-btn">💬 <span>{formatCompactNumber(comments)}</span></button>
        <button type="button" className="desktop-action-btn">⤴ <span>{formatCompactNumber(shares)}</span></button>
        <button type="button" className="desktop-action-btn bookmark">⌑</button>
      </div>
    </article>
  );
}

export default function FeedEnhanced() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUsername = getCurrentUsername();
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const [searchText, setSearchText] = useState('');
  const [localBrandPost, setLocalBrandPost] = useState({ likes: 532, liked: false });

  const { posts = [], isLoading, isError, refetch } = useFeed({ limit: 10, pollingInterval: 25_000 });

  const { data: users = [] } = useQuery({
    queryKey: ['feed-desktop-users'],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 60_000,
  });

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['feed-desktop-live'],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 20_000,
    refetchInterval: 25_000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['feed-desktop-notifications'],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const unreadNotificationCount = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter((item) => !item.is_read).length : 0),
    [notifications],
  );

  const suggestedUsers = useMemo(() => {
    const ranked = rankSuggestedUsers(Array.isArray(users) && users.length ? users : FALLBACK_SUGGESTIONS, currentUsername);
    return ranked.slice(0, 3);
  }, [users, currentUsername]);

  const trendingTopics = useMemo(() => {
    const localTopics = buildTrendingHashtags(posts).slice(0, 3);
    if (localTopics.length) return localTopics;
    return [
      { tag: '#يام_شات', count: 12400 },
      { tag: '#تقنية', count: 8700 },
      { tag: '#تصميم', count: 6200 },
    ];
  }, [posts]);

  const stats = useMemo(() => ({
    posts: Number(posts.length || 128),
    followers: Number((users?.length || 15200)),
    following: Number(Math.max(342, Math.floor((users?.length || 342) / 2))),
  }), [posts.length, users]);

  const featuredBrandPost = useMemo(() => ({
    id: 'yamshat-featured-brand-post',
    username: 'Yamshat',
    user_avatar: '/icons/icon-192.png',
    content: 'هيا لنجرب منصة يام شات',
    media_urls: ['/brand/yamshat-logo.jpg'],
    created_at: new Date().toISOString(),
    likes_count: localBrandPost.likes,
    comments_count: 128,
    share_count: 64,
    is_verified: true,
    is_brand_seed: true,
    hashtags: ['يام_شات', 'واجهة', 'تصميم'],
  }), [localBrandPost.likes]);

  const displayPosts = useMemo(() => {
    const uniquePosts = posts.filter((post) => post.id !== featuredBrandPost.id);
    return [featuredBrandPost, ...uniquePosts];
  }, [featuredBrandPost, posts]);

  const liveHighlights = useMemo(() => {
    const rooms = Array.isArray(liveRooms) ? liveRooms.slice(0, 3) : [];
    if (rooms.length) return rooms;
    return [
      { id: 'yam-live-1', title: 'Yamshat Community Space', host: 'Yamshat', viewer_count: 482 },
      { id: 'yam-live-2', title: 'Design Review', host: 'UIUX.design', viewer_count: 219 },
    ];
  }, [liveRooms]);

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed-data'] }),
    onError: (error, postId) => logger.warn('Like failed', { postId, error: error?.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed-data'] }),
    onError: (error, postId) => logger.warn('Delete failed', { postId, error: error?.message }),
  });

  const followMutation = useMutation({
    mutationFn: followUser,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed-desktop-users'] }),
  });

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchText.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  };

  const handleToggleLocalLike = () => {
    setLocalBrandPost((prev) => ({
      liked: !prev.liked,
      likes: prev.liked ? prev.likes - 1 : prev.likes + 1,
    }));
  };

  return (
    <MainLayout hideNav>
      <div className="desktop-feed-shell" dir="rtl">
        <aside className="desktop-feed-left-rail">
          <div className="desktop-left-brand-card">
            <div className="desktop-left-brand-mark">Y</div>
            <div>
              <div className="desktop-left-brand-title">YAMSHAT</div>
              <div className="desktop-left-brand-subtitle">منصة اجتماعية بطابع عصري</div>
            </div>
          </div>

          <nav className="desktop-left-nav">
            {LEFT_NAV_ITEMS.map((item) => {
              const badge = item.badgeType === 'messages' ? unreadInboxCount : item.badgeType === 'notifications' ? unreadNotificationCount : 0;
              return (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `desktop-left-link ${isActive ? 'active' : ''}`}>
                  <span className="desktop-left-icon">{item.icon}</span>
                  <span className="desktop-left-label">{item.label}</span>
                  {badge > 0 ? <span className="desktop-left-badge">{badge}</span> : null}
                </NavLink>
              );
            })}
          </nav>

          <button type="button" className="desktop-new-post-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ＋ منشور جديد
          </button>

          <div className="desktop-profile-summary-card">
            <div className="desktop-profile-head">
              <Avatar name={currentUsername || 'Yamshat'} src="/icons/icon-192.png" size={48} ring />
              <div>
                <strong>{currentUsername || 'Yamshat'}</strong>
                <small>@{currentUsername || 'yamshat'}</small>
              </div>
            </div>
            <div className="desktop-profile-stats">
              <div><strong>{formatCompactNumber(stats.posts)}</strong><span>المنشورات</span></div>
              <div><strong>{formatCompactNumber(stats.followers)}</strong><span>المتابعون</span></div>
              <div><strong>{formatCompactNumber(stats.following)}</strong><span>المتابَعون</span></div>
            </div>
          </div>
        </aside>

        <section className="desktop-feed-center-column">
          <header className="desktop-feed-topbar">
            <form className="desktop-search-box" onSubmit={handleSearchSubmit}>
              <span className="desktop-search-icon">⌕</span>
              <input
                type="search"
                placeholder="بحث في يام شات"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </form>

            <div className="desktop-top-actions">
              {TOP_ACTIONS.map((item) => {
                const badge = item.badgeType === 'messages' ? unreadInboxCount : item.badgeType === 'notifications' ? unreadNotificationCount : 0;
                return (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `desktop-top-action ${isActive ? 'active' : ''}`} title={item.label}>
                    <span>{item.icon}</span>
                    {badge > 0 ? <small>{badge}</small> : null}
                  </NavLink>
                );
              })}
              <NavLink to="/profile" className="desktop-top-profile-pill">
                <Avatar name={currentUsername || 'Y'} size={36} />
                <span>{currentUsername || 'Yamshat'}</span>
              </NavLink>
            </div>
          </header>

          <div className="desktop-composer-hero-card">
            <div className="desktop-composer-hero-head">
              <Avatar name={currentUsername || 'You'} size={54} ring />
              <div>
                <strong>ماذا يحدث يا مبدع؟</strong>
                <span>صمّم منشورك ليظهر بشكل أنيق على نسخة الويب للكمبيوتر.</span>
              </div>
              <button type="button" className="desktop-publish-glow" onClick={() => window.scrollTo({ top: 280, behavior: 'smooth' })}>نشر</button>
            </div>
            <div className="desktop-composer-hero-actions">
              {QUICK_COMPOSER_ACTIONS.map((item) => (
                <button key={item} type="button" className="desktop-mini-chip">{item}</button>
              ))}
            </div>
            <PostComposer />
          </div>

          <div className="desktop-feed-posts-stack">
            {isLoading ? <FeedSkeleton count={3} /> : null}
            {isError ? <ErrorState onRetry={refetch} /> : null}
            {!isLoading && !isError && !displayPosts.length ? <EmptyState title="لا توجد منشورات حالياً" description="ابدأ بنشر أول محتوى لك." /> : null}
            {!isLoading && !isError && displayPosts.map((post) => (
              <DesktopPostCard
                key={post.id}
                post={post}
                onLike={(postId) => likeMutation.mutate(postId)}
                onDelete={(postId) => deleteMutation.mutate(postId)}
                localLikeState={localBrandPost}
                onToggleLocalLike={handleToggleLocalLike}
              />
            ))}
          </div>
        </section>

        <aside className="desktop-feed-right-rail">
          <section className="desktop-side-card">
            <div className="desktop-side-head">
              <h3>الخدمات</h3>
              <NavLink to="/search" style={{ fontSize: '12px', color: '#8b5cf6', textDecoration: 'none' }}>عرض الكل</NavLink>
            </div>
            <div className="desktop-services-grid">
              {SERVICE_SHORTCUTS.map((service) => {
                const getServiceRoute = (title) => {
                  switch(title) {
                    case 'الدردشة': return '/inbox';
                    case 'المكالمات': return '/inbox';
                    case 'المجموعات': return '/groups';
                    case 'البث المباشر': return '/live';
                    default: return '/search';
                  }
                };
                return (
                  <NavLink key={service.title} to={getServiceRoute(service.title)} className={`desktop-service-tile ${SERVICE_TILE_TONES[SERVICE_SHORTCUTS.indexOf(service)] || ''}`} style={{ textDecoration: 'none' }}>
                    <span className="desktop-service-icon">{service.icon}</span>
                    <strong>{service.title}</strong>
                  </NavLink>
                );
              })}
            </div>
          </section>

          <section className="desktop-side-card">
            <div className="desktop-side-head">
              <h3>اقتراحات المتابعة</h3>
              <span>عرض الكل</span>
            </div>
            <div className="desktop-suggest-list">
              {suggestedUsers.map((user) => (
                <div key={user.username} className="desktop-suggest-item">
                  <div className="desktop-suggest-meta">
                    <Avatar name={user.username} src={user.avatar} size={44} />
                    <div>
                      <strong>{user.username}</strong>
                      <small>{user.handle || user.email || user.recommendation_reason || '@yamshat.creator'}</small>
                    </div>
                  </div>
                  <button type="button" className="desktop-follow-btn" onClick={() => followMutation.mutate(user.username)}>
                    تابع
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="desktop-side-card">
            <div className="desktop-side-head">
              <h3>المواضيع الرائجة</h3>
              <span>عرض الكل</span>
            </div>
            <div className="desktop-trend-list">
              {trendingTopics.map((topic) => (
                <div key={topic.tag} className="desktop-trend-item">
                  <div>
                    <strong>{topic.tag}</strong>
                    <small>{formatCompactNumber(topic.count || 0)} منشور</small>
                  </div>
                  <span className="desktop-trend-pulse" />
                </div>
              ))}
            </div>
          </section>

          <section className="desktop-side-card compact">
            <div className="desktop-side-head">
              <h3>نشاط مباشر</h3>
              <span>{liveHighlights.length} الآن</span>
            </div>
            <div className="desktop-live-list">
              {liveHighlights.map((room) => (
                <div key={room.id} className="desktop-live-item">
                  <div>
                    <strong>{room.title || room.host || room.username || 'Yamshat Live'}</strong>
                    <small>{room.host || room.username || 'Yamshat'}</small>
                  </div>
                  <span className="desktop-live-pill">{formatCompactNumber(room.viewer_count || 0)} LIVE</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .desktop-feed-shell {
          min-height: 100vh;
          width: min(1660px, calc(100vw - 28px));
          max-width: 1660px;
          margin: 0 auto;
          overflow-x: hidden;
          display: grid;
          grid-template-columns: 238px minmax(0, 1fr) 318px;
          gap: 18px;
          padding: 18px 16px 24px;
          box-sizing: border-box;
          background:
            radial-gradient(circle at top left, rgba(139,92,246,0.20), transparent 28%),
            radial-gradient(circle at bottom right, rgba(91,33,182,0.16), transparent 24%),
            linear-gradient(180deg, #04060c 0%, #070a12 38%, #05070f 100%);
          color: #eff4ff;
        }



        .desktop-feed-left-rail,
        .desktop-feed-right-rail {
          position: sticky;
          top: 18px;
          align-self: start;
          display: grid;
          gap: 14px;
        }

        .desktop-feed-center-column {
          min-width: 0;
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .desktop-left-brand-card,
        .desktop-composer-hero-card,
        .desktop-post-card,
        .desktop-side-card,
        .desktop-profile-summary-card,
        .desktop-feed-topbar {
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(7, 10, 18, 0.92);
          box-shadow: 0 22px 48px rgba(2, 6, 23, 0.42);
          backdrop-filter: blur(18px);
        }

        .desktop-feed-topbar {
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          justify-content: space-between;
          position: sticky;
          top: 14px;
          z-index: 12;
        }

        .desktop-search-box {
          flex: 1;
          min-width: 0;
          max-width: 480px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          min-height: 48px;
          border-radius: 16px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .desktop-search-box input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #eff4ff;
          font-size: 14px;
          font-family: inherit;
        }

        .desktop-search-box input::placeholder,
        .desktop-search-icon,
        .desktop-left-brand-subtitle,
        .desktop-post-author small,
        .desktop-suggest-item small,
        .desktop-trend-item small,
        .desktop-live-item small,
        .desktop-profile-head small,
        .desktop-profile-stats span,
        .desktop-composer-hero-head span,
        .desktop-post-stats span {
          color: #94a3b8;
        }

        .desktop-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .desktop-top-action,
        .desktop-top-profile-pill,
        .desktop-ghost-btn,
        .desktop-new-post-btn,
        .desktop-action-btn,
        .desktop-follow-btn,
        .desktop-publish-glow,
        .desktop-mini-chip,
        .desktop-service-tile {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.04);
          color: #eff4ff;
          border-radius: 16px;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .desktop-top-action {
          width: 46px;
          height: 46px;
          display: inline-grid;
          place-items: center;
          position: relative;
          font-size: 18px;
          text-decoration: none;
          overflow: visible;
        }

        .desktop-top-action.active::after {
          content: '';
          position: absolute;
          inset-inline: 12px;
          bottom: -12px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, #7c3aed, #a855f7);
          box-shadow: 0 0 18px rgba(139,92,246,0.5);
        }

        .desktop-top-action.active,
        .desktop-top-action:hover,
        .desktop-left-link.active,
        .desktop-left-link:hover,
        .desktop-service-tile:hover,
        .desktop-action-btn:hover,
        .desktop-follow-btn:hover,
        .desktop-new-post-btn:hover,
        .desktop-mini-chip:hover,
        .desktop-publish-glow:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(99,102,241,0.14));
          border-color: rgba(167,139,250,0.34);
          box-shadow: 0 16px 28px rgba(124,58,237,0.16);
          transform: translateY(-1px);
        }

        .desktop-top-action small {
          position: absolute;
          top: -4px;
          inset-inline-start: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 800;
        }

        .desktop-top-profile-pill {
          min-height: 48px;
          padding: 0 12px 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-weight: 700;
        }

        .desktop-left-brand-card {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .desktop-left-brand-mark,
        .desktop-brand-symbol {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          color: white;
          font-size: 25px;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6 55%, #a855f7);
          box-shadow: 0 18px 28px rgba(124,58,237,0.26);
        }

        .desktop-left-brand-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .desktop-left-nav,
        .desktop-feed-posts-stack,
        .desktop-suggest-list,
        .desktop-trend-list,
        .desktop-live-list {
          display: grid;
          gap: 10px;
        }

        .desktop-left-link {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 52px;
          padding: 0 14px;
          text-decoration: none;
          color: #dbe4ff;
          border-radius: 16px;
          border: 1px solid transparent;
          background: transparent;
        }

        .desktop-left-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          font-size: 17px;
          flex-shrink: 0;
        }

        .desktop-left-label {
          font-weight: 800;
        }

        .desktop-left-badge {
          margin-inline-start: auto;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: #8b5cf6;
          display: grid;
          place-items: center;
          color: white;
          font-size: 12px;
          font-weight: 800;
        }

        .desktop-new-post-btn {
          min-height: 50px;
          padding: 0 16px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 18px 26px rgba(124,58,237,0.24);
        }

        .desktop-profile-summary-card {
          padding: 18px;
          display: grid;
          gap: 16px;
        }

        .desktop-profile-head,
        .desktop-profile-stats,
        .desktop-post-head,
        .desktop-post-author,
        .desktop-post-author-line,
        .desktop-post-tools,
        .desktop-post-meta-row,
        .desktop-post-actions,
        .desktop-composer-hero-head,
        .desktop-side-head,
        .desktop-suggest-item,
        .desktop-suggest-meta,
        .desktop-live-item,
        .desktop-trend-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .desktop-profile-stats {
          justify-content: space-between;
        }

        .desktop-profile-stats div {
          display: grid;
          gap: 4px;
          text-align: center;
          flex: 1;
          padding: 12px 8px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
        }

        .desktop-profile-stats strong {
          font-size: 18px;
        }

        .desktop-composer-hero-card {
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .desktop-composer-hero-card .card {
          margin-bottom: 0 !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 20px !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .desktop-composer-hero-card .composer-header-row,
        .desktop-composer-hero-card .composer-toolbar {
          display: none;
        }

        .desktop-composer-hero-card .composer-actions-row {
          margin: 0;
          padding: 0;
          justify-content: space-between;
        }

        .desktop-composer-hero-card .composer-action-btn,
        .desktop-composer-hero-card .btn {
          min-height: 42px;
          border-radius: 14px !important;
        }

        .desktop-composer-hero-card .btn-primary {
          background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%) !important;
          box-shadow: 0 10px 24px rgba(124,58,237,0.24) !important;
        }

        .desktop-composer-hero-card .btn-secondary {
          background: rgba(255,255,255,0.08) !important;
          color: #eef2ff !important;
        }

        .desktop-composer-hero-card .composer-editor-shell {
          background: rgba(255,255,255,0.025);
          border-radius: 20px;
          padding: 16px;
        }

        .desktop-composer-hero-card .composer-editor-topline {
          margin-bottom: 8px;
        }

        .desktop-composer-hero-card .composer-drop-hint {
          background: rgba(139, 92, 246, 0.08);
        }

        .desktop-composer-hero-card .composer-textarea {
          min-height: 94px;
          font-size: 15px;
        }

        .desktop-composer-hero-card .composer-tags-preview,
        .desktop-composer-hero-card .composer-scheduler-box,
        .desktop-composer-hero-card .composer-media-preview {
          margin-top: 10px;
        }

        .desktop-composer-hero-head {
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        .desktop-composer-hero-head strong {
          display: block;
          font-size: 20px;
          margin-bottom: 4px;
        }

        .desktop-publish-glow {
          min-height: 46px;
          padding: 0 18px;
          cursor: pointer;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 18px 28px rgba(124,58,237,0.22);
        }

        .desktop-composer-hero-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .desktop-mini-chip {
          min-height: 40px;
          padding: 0 14px;
          cursor: pointer;
          font-weight: 700;
        }

        .desktop-post-card {
          padding: 16px;
          display: grid;
          gap: 14px;
        }

        .desktop-post-card.featured {
          background:
            radial-gradient(circle at top, rgba(124,58,237,0.18), transparent 42%),
            rgba(7, 10, 18, 0.94);
        }

        .verify-dot,
        .desktop-post-badge,
        .desktop-live-pill {
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          font-weight: 900;
        }

        .verify-dot {
          width: 18px;
          height: 18px;
          background: #3b82f6;
          color: white;
          font-size: 11px;
        }

        .desktop-post-badge {
          min-height: 30px;
          padding: 0 12px;
          background: rgba(139,92,246,0.14);
          color: #d8b4fe;
          border: 1px solid rgba(167,139,250,0.22);
          font-size: 12px;
        }

        .desktop-ghost-btn {
          width: 42px;
          height: 42px;
          display: inline-grid;
          place-items: center;
          cursor: pointer;
        }

        .desktop-post-head,
        .desktop-post-meta-row,
        .desktop-side-head,
        .desktop-suggest-item,
        .desktop-live-item,
        .desktop-trend-item {
          justify-content: space-between;
        }

        .desktop-post-copy {
          font-size: 16px;
          line-height: 1.9;
          color: #eef2ff;
          white-space: pre-wrap;
        }

        .desktop-post-media,
        .desktop-brand-fallback,
        .desktop-brand-hero {
          width: 100%;
          min-height: 340px;
          max-height: 620px;
          border-radius: 22px;
          overflow: hidden;
          object-fit: cover;
          display: block;
          background: linear-gradient(180deg, rgba(15,18,31,0.96), rgba(4,7,14,1));
        }

        .desktop-brand-hero {
          position: relative;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 12px;
          padding: 36px 24px;
          text-align: center;
          background:
            radial-gradient(circle at 50% 28%, rgba(139,92,246,0.26), transparent 24%),
            linear-gradient(180deg, #090b12 0%, #070912 100%);
        }

        .desktop-brand-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(167,139,250,0.12);
          border-radius: inherit;
          pointer-events: none;
        }

        .desktop-brand-hero-mark-wrap {
          width: 100%;
          display: grid;
          place-items: center;
        }

        .desktop-brand-hero-logo {
          width: min(86%, 500px);
          max-width: 500px;
          object-fit: contain;
          filter: drop-shadow(0 24px 60px rgba(139,92,246,0.34));
        }

        .desktop-brand-hero-wordmark {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0.34em;
          color: #f5f3ff;
        }

        .desktop-brand-hero strong {
          font-size: clamp(26px, 2vw, 38px);
          line-height: 1.4;
          color: #ffffff;
        }

        .desktop-brand-fallback {
          display: grid;
          place-items: center;
          gap: 14px;
          padding: 30px;
          text-align: center;
        }

        .desktop-brand-fallback strong {
          font-size: 28px;
          letter-spacing: 0.08em;
        }

        .desktop-post-meta-row {
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 0;
          color: #cbd5e1;
          flex-wrap: wrap;
        }

        .desktop-post-reactions,
        .desktop-post-stats {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .desktop-post-actions {
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        .desktop-action-btn {
          min-height: 44px;
          padding: 0 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
        }

        .desktop-action-btn.active {
          background: rgba(236,72,153,0.16);
          border-color: rgba(236,72,153,0.28);
          color: #f9a8d4;
        }

        .desktop-action-btn.bookmark {
          margin-inline-start: auto;
        }

        .desktop-side-card {
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .desktop-side-card.compact {
          gap: 12px;
        }

        .desktop-side-head h3 {
          margin: 0;
          font-size: 19px;
        }

        .desktop-side-head span {
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 800;
        }

        .desktop-services-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .desktop-service-tile {
          min-height: 92px;
          padding: 12px 10px;
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 8px;
          cursor: pointer;
          background: rgba(255,255,255,0.025);
        }

        .desktop-service-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 21px;
          background: rgba(124,58,237,0.14);
          color: #d8b4fe;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
        }

        .desktop-service-tile.tone-chat .desktop-service-icon { background: rgba(96,165,250,0.16); color: #93c5fd; }
        .desktop-service-tile.tone-calls .desktop-service-icon { background: rgba(34,197,94,0.16); color: #86efac; }
        .desktop-service-tile.tone-groups .desktop-service-icon { background: rgba(168,85,247,0.18); color: #d8b4fe; }
        .desktop-service-tile.tone-news .desktop-service-icon { background: rgba(59,130,246,0.18); color: #bfdbfe; }
        .desktop-service-tile.tone-events .desktop-service-icon { background: rgba(250,204,21,0.16); color: #fde68a; }
        .desktop-service-tile.tone-live .desktop-service-icon { background: rgba(248,113,113,0.18); color: #fca5a5; }
        .desktop-service-tile.tone-files .desktop-service-icon { background: rgba(251,146,60,0.18); color: #fdba74; }
        .desktop-service-tile.tone-blog .desktop-service-icon { background: rgba(125,211,252,0.18); color: #bae6fd; }
        .desktop-service-tile.tone-market .desktop-service-icon { background: rgba(244,114,182,0.18); color: #f9a8d4; }

        .desktop-service-tile strong {
          font-size: 13px;
          text-align: center;
        }

        .desktop-suggest-item,
        .desktop-trend-item,
        .desktop-live-item {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
        }

        .desktop-follow-btn {
          min-height: 40px;
          padding: 0 14px;
          cursor: pointer;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
        }

        .desktop-trend-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 0 8px rgba(139,92,246,0.14);
          flex-shrink: 0;
        }

        .desktop-live-pill {
          min-height: 30px;
          padding: 0 10px;
          background: rgba(239,68,68,0.12);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,0.18);
          font-size: 12px;
        }

        @media (max-width: 1380px) {
          .desktop-feed-shell {
            width: min(1520px, calc(100vw - 22px));
            grid-template-columns: 220px minmax(0, 1fr) 290px;
            gap: 16px;
            padding: 16px 12px 22px;
          }
        }

        @media (max-width: 1180px) {
          .desktop-feed-shell {
            width: min(1120px, calc(100vw - 18px));
            grid-template-columns: 220px minmax(0, 1fr);
          }

          .desktop-feed-right-rail {
            display: none;
          }
        }

        @media (max-width: 920px) {
          .desktop-feed-shell {
            width: min(100%, calc(100vw - 8px));
            grid-template-columns: 1fr;
            padding: 10px;
          }

          .desktop-feed-left-rail,
          .desktop-feed-right-rail {
            display: none;
          }

          .desktop-feed-topbar {
            position: static;
            flex-direction: column;
            align-items: stretch;
          }

          .desktop-top-actions {
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .desktop-composer-hero-head {
            align-items: flex-start;
          }
        }

        @media (max-width: 640px) {
          .desktop-feed-shell {
            width: 100%;
            padding: 8px;
          }

          .desktop-post-action.bookmark,
          .desktop-action-btn.bookmark {
            margin-inline-start: 0;
          }

          .desktop-post-card,
          .desktop-side-card,
          .desktop-composer-hero-card,
          .desktop-feed-topbar {
            border-radius: 22px;
          }

          .desktop-top-profile-pill span {
            display: none;
          }

          .desktop-post-media,
          .desktop-brand-fallback {
            min-height: 240px;
          }
        }
      `}</style>
    </MainLayout>
  );
}
