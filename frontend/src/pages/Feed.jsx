import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { likePost } from '../api/posts.js';
import { getUsers, followUser } from '../api/users.js';
import { getLiveRooms } from '../api/live.js';
import { avatarGradient, formatCompactNumber, formatTimeAgo, initialsFromName } from '../components/yamshat/YamshatDesign.js';
import { getCurrentUsername } from '../utils/auth.js';

function Avatar({ name, src, size = 46, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    border: ring ? '2px solid rgba(139,92,246,0.8)' : 'none',
    boxShadow: ring ? '0 0 0 4px rgba(139,92,246,0.14)' : 'none',
    flexShrink: 0,
  };

  return src
    ? <img src={src} alt={name} style={style} />
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(name) }}>{initialsFromName(name).slice(0, 1)}</div>;
}

function mediaListFromPost(post) {
  if (Array.isArray(post?.media_urls) && post.media_urls.length) return post.media_urls;
  if (Array.isArray(post?.images) && post.images.length) return post.images;
  if (post?.image_url) return [post.image_url];
  if (post?.media) return [post.media];
  return [];
}

function PostGallery({ media, title }) {
  const items = media.slice(0, 3);
  if (!items.length) {
    return (
      <div className="yam-feed-fallback-media">
        <div className="monitor-grid">
          <div />
          <div />
          <div />
        </div>
        <strong>{title || 'Gaming vibes'}</strong>
      </div>
    );
  }

  if (items.length === 1) {
    return <img src={items[0]} alt={title} className="yam-feed-main-media" />;
  }

  return (
    <div className={`yam-feed-media-grid ${items.length === 2 ? 'two' : 'three'}`}>
      <img src={items[0]} alt={title} className="primary" />
      <div className="secondary-stack">
        {items.slice(1).map((item, index) => (
          <div key={`${item}-${index}`} className="secondary-cell">
            <img src={item} alt={`${title}-${index}`} />
            {index === 1 && media.length > 3 ? <span className="media-overlay">+{media.length - 3}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedPostCard({ post, onLike }) {
  const media = mediaListFromPost(post);
  const likes = post.likes_count ?? post.like_count ?? post.likes ?? 0;
  const comments = post.comments_count ?? post.comment_count ?? Math.max(12, Math.floor(likes / 9));
  const shares = post.share_count ?? post.shares ?? Math.max(6, Math.floor(likes / 18));

  return (
    <article className="yam-feed-post-card">
      <div className="yam-post-header">
        <div className="yam-post-author">
          <Avatar name={post.username || 'User'} src={post.avatar} />
          <div>
            <div className="yam-post-author-line">
              <strong>{post.username || 'Creator'}</strong>
              <span className="verify-dot">✓</span>
            </div>
            <small>{formatTimeAgo(post.created_at)}</small>
          </div>
        </div>
        <button type="button" className="yam-icon-ghost">⋯</button>
      </div>

      <div className="yam-post-copy">{post.content || 'جلسة ممتعة اليوم مع المتابعين! شكراً لكل من كان موجود.'}</div>
      <PostGallery media={media} title={post.content || post.username} />

      <div className="yam-post-actions">
        <button type="button" className="yam-react-btn" onClick={() => onLike(post.id)}>
          ❤ <span>{formatCompactNumber(likes)}</span>
        </button>
        <button type="button" className="yam-react-btn">💬 <span>{formatCompactNumber(comments)}</span></button>
        <button type="button" className="yam-react-btn">⤴ <span>{formatCompactNumber(shares)}</span></button>
        <button type="button" className="yam-react-btn save">⌑</button>
      </div>
    </article>
  );
}

export default function Feed() {
  const queryClient = useQueryClient();
  const currentUsername = getCurrentUsername();
  const { posts = [], isLoading, refetch } = useFeed({ limit: 10, pollingInterval: 25_000 });

  const { data: users = [] } = useQuery({
    queryKey: ['feed-users-sidebar'],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 60_000,
  });

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['feed-live-sidebar'],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed-data'] }),
  });

  const followMutation = useMutation({
    mutationFn: followUser,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed-users-sidebar'] }),
  });

  const stories = useMemo(() => {
    const liveStories = Array.isArray(liveRooms) ? liveRooms.slice(0, 2).map((room) => ({
      id: `live-${room.id}`,
      username: room.host || room.username || 'PlayerOne',
      avatar: room.avatar,
      live: true,
    })) : [];
    const userStories = Array.isArray(users) ? users.slice(0, 4).map((user) => ({
      id: user.username,
      username: user.username,
      avatar: user.avatar,
      live: false,
    })) : [];
    return [...liveStories, ...userStories].slice(0, 5);
  }, [liveRooms, users]);

  const trendingPosts = useMemo(
    () => [...posts].sort((a, b) => Number((b.likes_count ?? b.like_count ?? b.likes ?? 0)) - Number((a.likes_count ?? a.like_count ?? a.likes ?? 0))).slice(0, 3),
    [posts],
  );

  const onlineFriends = useMemo(
    () => users.filter((user) => user.username !== currentUsername).slice(0, 5),
    [users, currentUsername],
  );

  const suggestedUsers = useMemo(
    () => users.filter((user) => user.username !== currentUsername).slice(0, 3),
    [users, currentUsername],
  );

  return (
    <MainLayout>
      <div className="yam-feed-page desktop-post mobile-post">
        <div className="yam-feed-main-column">
          <section className="yam-feed-composer-shell">
            <div className="yam-feed-composer-head">
              <Avatar name={currentUsername || 'You'} size={54} ring />
              <div className="yam-feed-composer-prompt">
                <strong>بم تفكر اليوم؟</strong>
                <span>نص • صورة • مقطع قصير • لايف مباشر</span>
              </div>
            </div>
            <PostComposer />
          </section>

          <div className="yam-feed-sort-row">
            <span>عرض حسب</span>
            <strong>أحدث المنشورات</strong>
            <button type="button" className="yam-refresh-btn" onClick={() => refetch()}>تحديث</button>
          </div>

          <div className="yam-feed-posts-stack">
            {isLoading ? <div className="yam-empty-block">جارٍ تحميل المنشورات...</div> : null}
            {!isLoading && !posts.length ? <div className="yam-empty-block">لا توجد منشورات حالياً.</div> : null}
            {posts.map((post) => (
              <FeedPostCard key={post.id} post={post} onLike={(postId) => likeMutation.mutate(postId)} />
            ))}
          </div>
        </div>

        <aside className="yam-feed-right-column">
          <section className="yam-side-card">
            <div className="yam-side-card-head">
              <h3>القصص</h3>
              <span>عرض الكل</span>
            </div>
            <div className="yam-story-row">
              <button type="button" className="yam-add-story">＋<small>إضافة قصة</small></button>
              {stories.map((story) => (
                <div key={story.id} className="yam-story-user">
                  <div className={`yam-story-ring ${story.live ? 'live' : ''}`}>
                    <Avatar name={story.username} src={story.avatar} size={58} />
                  </div>
                  {story.live ? <span className="yam-story-live">LIVE</span> : null}
                  <small>{story.username}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="yam-side-card">
            <div className="yam-side-card-head">
              <h3>المنشورات الرائجة</h3>
              <span>عرض المزيد</span>
            </div>
            <div className="yam-trending-list">
              {trendingPosts.map((post) => (
                <div key={post.id} className="yam-trending-item">
                  <div>
                    <strong>{post.username}</strong>
                    <p>{(post.content || 'منشور مميز').slice(0, 70)}</p>
                    <div className="yam-trending-stats">❤ {formatCompactNumber(post.likes_count ?? post.like_count ?? post.likes ?? 0)} · 💬 {formatCompactNumber(post.comments_count ?? 0)}</div>
                  </div>
                  <div className="yam-trending-thumb">
                    {mediaListFromPost(post)[0] ? <img src={mediaListFromPost(post)[0]} alt={post.username} /> : <span>🎮</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="yam-side-card">
            <div className="yam-side-card-head">
              <h3>الأصدقاء المتصلون</h3>
              <span>عرض الكل</span>
            </div>
            <div className="yam-online-list">
              {onlineFriends.map((user) => (
                <div key={user.username} className="yam-online-item">
                  <div className="yam-online-meta">
                    <div className="yam-online-avatar-wrap">
                      <Avatar name={user.username} src={user.avatar} size={42} />
                      <span className="online-indicator" />
                    </div>
                    <div>
                      <strong>{user.username}</strong>
                      <small>{user.profile?.activity_tagline || 'متصل الآن'}</small>
                    </div>
                  </div>
                  <button type="button" className="yam-chat-shortcut">💬</button>
                </div>
              ))}
            </div>
          </section>

          <section className="yam-side-card promo">
            <div className="promo-visual">🎮</div>
            <h3>انضم إلى مجتمع يامشات</h3>
            <p>اكتشف محتوى جديد وتعرّف على أصدقاء جدد واستمتع بتجربة تفاعلية فريدة.</p>
            <button type="button" className="yam-primary-wide">استكشف الآن</button>
          </section>

          <section className="yam-side-card">
            <div className="yam-side-card-head">
              <h3>اقتراحات للمتابعة</h3>
              <span>عرض الكل</span>
            </div>
            <div className="yam-suggest-list">
              {suggestedUsers.map((user) => (
                <div key={user.username} className="yam-suggest-row">
                  <div className="yam-online-meta">
                    <Avatar name={user.username} src={user.avatar} size={42} />
                    <div>
                      <strong>{user.username}</strong>
                      <small>{user.email || 'Gaming creator'}</small>
                    </div>
                  </div>
                  <button type="button" className="yam-follow-inline" onClick={() => followMutation.mutate(user.username)}>متابعة</button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .yam-feed-page {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 18px;
          padding: 18px;
        }
        @media (max-width: 1023px) {
          .yam-feed-page {
            grid-template-columns: 1fr;
            padding: 10px;
          }
          .yam-feed-right-column {
            display: none;
          }
        }
        .yam-feed-main-column { min-width: 0; display: grid; gap: 16px; }
        .yam-feed-right-column { display: grid; gap: 16px; align-content: start; }
        .yam-feed-composer-shell,
        .yam-side-card,
        .yam-feed-post-card {
          border-radius: 28px;
          background: rgba(7, 12, 24, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 24px 50px rgba(2,6,23,0.24);
          overflow: hidden;
        }
        .yam-feed-composer-shell { padding: 18px; }
        .yam-feed-composer-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .yam-feed-composer-prompt strong { display: block; font-size: 18px; }
        .yam-feed-composer-prompt span { color: #94a3b8; font-size: 13px; }
        .yam-feed-sort-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          padding: 0 8px;
          font-size: 14px;
        }
        .yam-refresh-btn {
          margin-inline-start: auto;
          border: none;
          background: rgba(124,58,237,0.18);
          color: white;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 700;
        }
        .yam-feed-posts-stack { display: grid; gap: 16px; }
        .yam-feed-post-card { padding: 18px; display: grid; gap: 16px; }
        .yam-post-header,
        .yam-post-actions,
        .yam-side-card-head,
        .yam-online-item,
        .yam-suggest-row,
        .yam-trending-item,
        .yam-post-author,
        .yam-online-meta { display: flex; align-items: center; gap: 12px; }
        .yam-post-header, .yam-side-card-head, .yam-trending-item, .yam-suggest-row, .yam-online-item {
          justify-content: space-between;
        }
        .yam-post-author-line { display: flex; align-items: center; gap: 6px; font-size: 16px; }
        .verify-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #3b82f6;
          color: white;
          font-size: 11px;
          font-weight: 900;
        }
        .yam-post-copy {
          color: #dbe4ff;
          line-height: 1.9;
          white-space: pre-wrap;
        }
        .yam-feed-main-media {
          width: 100%;
          max-height: 430px;
          object-fit: cover;
          border-radius: 24px;
          display: block;
        }
        .yam-feed-media-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(200px, 0.9fr);
          gap: 10px;
          min-height: 320px;
        }
        .yam-feed-media-grid.two .secondary-stack { grid-template-rows: 1fr; }
        .yam-feed-media-grid img,
        .yam-feed-media-grid video,
        .yam-trending-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .yam-feed-media-grid .primary,
        .yam-feed-fallback-media { border-radius: 22px; min-height: 320px; }
        .secondary-stack { display: grid; gap: 10px; }
        .secondary-cell { position: relative; border-radius: 22px; overflow: hidden; min-height: 155px; }
        .media-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(6,10,18,0.46);
          color: white;
          font-size: 30px;
          font-weight: 900;
          backdrop-filter: blur(4px);
        }
        .yam-feed-fallback-media {
          padding: 28px;
          background: radial-gradient(circle at top, rgba(139,92,246,0.26), transparent 50%), linear-gradient(135deg, rgba(10,18,38,0.96), rgba(7,12,24,1));
          display: grid;
          align-content: center;
          gap: 18px;
          color: white;
        }
        .monitor-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .monitor-grid div { min-height: 110px; border-radius: 18px; background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.34)); border: 1px solid rgba(255,255,255,0.08); }
        .yam-post-actions { justify-content: flex-start; flex-wrap: wrap; }
        .yam-react-btn, .yam-icon-ghost, .yam-chat-shortcut, .yam-follow-inline {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.04);
          color: white;
          border-radius: 14px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }
        .yam-icon-ghost, .yam-chat-shortcut { width: 42px; height: 42px; padding: 0; justify-content: center; }
        .yam-react-btn.save { margin-inline-start: auto; }
        .yam-side-card { padding: 18px; display: grid; gap: 14px; }
        .yam-side-card-head h3 { margin: 0; font-size: 18px; }
        .yam-side-card-head span { color: #8b5cf6; font-size: 13px; font-weight: 700; }
        .yam-story-row { display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
        .yam-story-row::-webkit-scrollbar { height: 5px; }
        .yam-story-user { display: grid; justify-items: center; gap: 8px; min-width: 72px; }
        .yam-story-user small { color: #cbd5e1; }
        .yam-story-ring {
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(236,72,153,0.88), rgba(124,58,237,0.88));
        }
        .yam-story-ring.live { background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(168,85,247,0.88)); }
        .yam-story-live {
          padding: 4px 8px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 900;
          margin-top: -16px;
          z-index: 1;
        }
        .yam-add-story {
          min-width: 72px;
          min-height: 72px;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.02);
          color: white;
          display: grid;
          place-items: center;
          gap: 4px;
          padding: 0;
          font-size: 26px;
        }
        .yam-add-story small { font-size: 12px; color: #94a3b8; }
        .yam-trending-list, .yam-online-list, .yam-suggest-list { display: grid; gap: 12px; }
        .yam-trending-item, .yam-online-item, .yam-suggest-row {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
          gap: 12px;
        }
        .yam-trending-item p { margin: 6px 0 8px; color: #cbd5e1; line-height: 1.7; }
        .yam-trending-thumb {
          width: 92px;
          height: 92px;
          border-radius: 18px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.22));
          display: grid;
          place-items: center;
          font-size: 24px;
        }
        .yam-trending-stats, .yam-online-item small, .yam-suggest-row small { color: #94a3b8; font-size: 13px; }
        .yam-online-avatar-wrap { position: relative; }
        .online-indicator {
          position: absolute;
          bottom: 1px;
          inset-inline-end: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid rgba(7,12,24,0.94);
        }
        .promo { text-align: center; }
        .promo-visual {
          width: 92px;
          height: 92px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          margin: 0 auto 8px;
          font-size: 42px;
          background: linear-gradient(135deg, rgba(124,58,237,0.26), rgba(99,102,241,0.14));
        }
        .promo p { margin: 0; color: #94a3b8; line-height: 1.8; }
        .yam-primary-wide, .yam-follow-inline {
          border: none;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
        }
        .yam-follow-inline { padding: 10px 14px; }
        .yam-empty-block {
          border-radius: 24px;
          background: rgba(7,12,24,0.88);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 24px;
          text-align: center;
          color: #94a3b8;
        }
        @media (max-width: 1280px) {
          .yam-feed-page { grid-template-columns: minmax(0, 1fr) 320px; }
        }
        @media (max-width: 1024px) {
          .yam-feed-page { grid-template-columns: 1fr; }
          .yam-feed-right-column { order: -1; }
        }
        @media (max-width: 680px) {
          .yam-feed-page { padding: 12px; }
          .yam-feed-media-grid { grid-template-columns: 1fr; }
          .yam-react-btn.save { margin-inline-start: 0; }
          .yam-trending-thumb { width: 74px; height: 74px; }
        }
      `}</style>
    </MainLayout>
  );
}
