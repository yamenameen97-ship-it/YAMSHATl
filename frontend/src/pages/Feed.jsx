import MainLayout from '../components/layout/MainLayout.jsx';
import { avatarGradient, initialsFromName } from '../components/yamshat/YamshatDesign.js';
import YamshatIcon from '../components/yamshat/YamshatIcon.jsx';
import {
  desktopStories,
  feedPosts,
  mobilePosts,
  mobileStories,
  onlineFriends,
  suggestedUsers,
  trendingPosts,
} from '../components/yamshat/showcaseData.js';

function Avatar({ name, size = 46, ring = false }) {
  return (
    <div
      className={`yam-showcase-avatar ${ring ? 'ring' : ''}`}
      style={{ width: size, height: size, background: avatarGradient(name) }}
      aria-label={name}
    >
      {initialsFromName(name).slice(0, 1)}
    </div>
  );
}

function StatButton({ icon, value, className = '' }) {
  return (
    <button type="button" className={`yam-showcase-stat ${className}`.trim()}>
      <YamshatIcon name={icon} size={16} />
      <span>{value}</span>
    </button>
  );
}

function StoryItem({ story, mobile = false }) {
  if (story.kind === 'add') {
    return (
      <button type="button" className={`yam-story-add ${mobile ? 'mobile' : ''}`}>
        <span className="yam-story-add-plus"><YamshatIcon name="plus" size={mobile ? 18 : 20} /></span>
        <small>{story.username}</small>
      </button>
    );
  }

  return (
    <div className={`yam-story-item ${mobile ? 'mobile' : ''}`}>
      <div className={`yam-story-ring ${story.live ? 'live' : ''}`}>
        <Avatar name={story.username} size={mobile ? 52 : 58} />
      </div>
      {story.live ? <span className="yam-story-live">LIVE</span> : null}
      <small>{story.username}</small>
    </div>
  );
}

function MediaArtwork({ type, mobile = false }) {
  if (type === 'collage-gaming') {
    return (
      <div className={`yam-media-collage ${mobile ? 'mobile' : ''}`}>
        <div className="yam-scene scene-main monitor-city" />
        <div className="yam-collage-stack">
          <div className="yam-scene scene-side neon-desk" />
          <div className="yam-scene scene-side city-room">
            <span className="yam-overlay-count">+3</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'video-studio') {
    return (
      <div className={`yam-scene wide studio-room ${mobile ? 'mobile' : ''}`}>
        <button type="button" className="yam-play-chip" aria-label="تشغيل">
          <YamshatIcon name="play" size={18} filled />
        </button>
      </div>
    );
  }

  if (type === 'victory-banner') {
    return (
      <div className={`yam-scene wide victory-room ${mobile ? 'mobile' : ''}`}>
        <div className="yam-victory-copy">
          <span>#1</span>
          <strong>VICTORY</strong>
        </div>
      </div>
    );
  }

  if (type === 'wide-live') {
    return (
      <div className={`yam-scene wide live-monitor ${mobile ? 'mobile' : ''}`}>
        <div className="yam-live-corner">
          <span className="live-pill">LIVE</span>
          <span className="viewer-pill">1.2K</span>
        </div>
      </div>
    );
  }

  if (type === 'wide-music') {
    return <div className={`yam-scene wide music-room ${mobile ? 'mobile' : ''}`} />;
  }

  if (type === 'wide-victory') {
    return (
      <div className={`yam-scene wide victory-card ${mobile ? 'mobile' : ''}`}>
        <div className="yam-victory-copy compact">
          <span>#1</span>
          <strong>VICTORY</strong>
        </div>
      </div>
    );
  }

  if (type === 'thumb-squad' || type === 'thumb-studio' || type === 'thumb-friends') {
    return <div className={`yam-scene ${type}`} />;
  }

  return <div className={`yam-scene wide neon-desk ${mobile ? 'mobile' : ''}`} />;
}

function PostCard({ post, mobile = false }) {
  return (
    <article className={`yam-post-card ${mobile ? 'mobile' : ''}`}>
      <div className="yam-post-head">
        <div className="yam-post-author-block">
          <Avatar name={post.author} size={mobile ? 42 : 46} />
          <div>
            <div className="yam-post-author-line">
              <strong>{post.author}</strong>
              {post.verified !== false ? <span className="yam-verified">✓</span> : null}
            </div>
            <small>{post.time}</small>
          </div>
        </div>
        <button type="button" className="yam-more-btn" aria-label="المزيد">
          <YamshatIcon name="more" size={17} />
        </button>
      </div>

      <div className="yam-post-content">{post.content}</div>
      <MediaArtwork type={post.mediaType} mobile={mobile} />

      <div className="yam-post-actions">
        <StatButton icon="heart" value={post.likes} className="liked" />
        <StatButton icon="comment" value={post.comments} />
        <StatButton icon="repeat" value={post.shares} />
        {!mobile ? <StatButton icon="bookmark" value="" className="save" /> : null}
      </div>
    </article>
  );
}

export default function Feed() {
  return (
    <MainLayout>
      <div className="yam-showcase-page">
        <section className="yam-main-feed-column">
          <section id="composer" className="yam-composer-card">
            <div className="yam-composer-top">
              <Avatar name="Ahmed_King" size={52} ring />
              <div className="yam-composer-prompt">
                <strong>بم تفكر اليوم؟</strong>
                <span>نص • صورة • مقطع قصير • لايف مباشر</span>
              </div>
            </div>
            <div className="yam-composer-actions">
              <button type="button"><span><YamshatIcon name="forum" size={16} /></span>نص</button>
              <button type="button"><span><YamshatIcon name="discover" size={16} /></span>صورة</button>
              <button type="button"><span><YamshatIcon name="clips" size={16} /></span>مقطع قصير</button>
              <button type="button"><span><YamshatIcon name="live" size={16} /></span>لايف مباشر</button>
            </div>
          </section>

          <section className="yam-mobile-stories-card">
            <div className="yam-mobile-stories-row">
              {mobileStories.map((story) => (
                <StoryItem key={story.id} story={story} mobile />
              ))}
            </div>
          </section>

          <div className="yam-feed-sort-bar">
            <span>عرض حسب</span>
            <strong>أحدث المنشورات</strong>
          </div>

          <div className="yam-desktop-posts">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="yam-mobile-posts">
            {mobilePosts.map((post) => (
              <PostCard key={post.id} post={post} mobile />
            ))}
          </div>
        </section>

        <aside className="yam-right-panel">
          <section className="yam-right-card">
            <div className="yam-panel-head">
              <h3>القصص</h3>
              <span>عرض الكل</span>
            </div>
            <div className="yam-story-strip">
              {desktopStories.map((story) => (
                <StoryItem key={story.id} story={story} />
              ))}
            </div>
          </section>

          <section className="yam-right-card">
            <div className="yam-panel-head">
              <h3>المنشورات الرائجة</h3>
            </div>
            <div className="yam-trending-stack">
              {trendingPosts.map((item) => (
                <div key={item.id} className="yam-trending-row">
                  <div className="yam-trending-copy">
                    <div className="yam-trending-meta">
                      <strong>{item.author}</strong>
                      <small>{item.time}</small>
                    </div>
                    <p>{item.title}</p>
                    <div className="yam-trending-stats">
                      <span><YamshatIcon name="heart" size={13} /> {item.likes}</span>
                      <span><YamshatIcon name="comment" size={13} /> {item.comments}</span>
                    </div>
                  </div>
                  <MediaArtwork type={item.mediaType} />
                </div>
              ))}
            </div>
            <button type="button" className="yam-link-button">عرض المزيد</button>
          </section>

          <section className="yam-right-card">
            <div className="yam-panel-head">
              <h3>الأصدقاء المتصلون</h3>
              <span>عرض الكل</span>
            </div>
            <div className="yam-online-stack">
              {onlineFriends.map((friend) => (
                <div key={friend.id} className="yam-online-row">
                  <div className="yam-online-main">
                    <div className="yam-online-avatar-wrap">
                      <Avatar name={friend.username} size={40} />
                      <span className="yam-online-dot" />
                    </div>
                    <div>
                      <strong>{friend.username}</strong>
                      <small>{friend.activity}</small>
                    </div>
                  </div>
                  <button type="button" className="yam-chat-btn">
                    <YamshatIcon name="message" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="yam-right-card yam-join-card">
            <div className="yam-join-gamepad">🎮</div>
            <h3>انضم إلى مجتمع يامشات</h3>
            <p>اكتشف محتوى جديد، تعرّف على أصدقاء جدد، واستمتع بتجربة تفاعلية فريدة.</p>
            <button type="button">استكشف الآن</button>
          </section>

          <section className="yam-right-card yam-mobile-hidden-card">
            <div className="yam-panel-head">
              <h3>اقتراحات سريعة</h3>
              <span>عرض الكل</span>
            </div>
            <div className="yam-suggested-stack">
              {suggestedUsers.map((user) => (
                <div key={user.id} className="yam-online-row">
                  <div className="yam-online-main">
                    <Avatar name={user.username} size={40} />
                    <div>
                      <strong>{user.username}</strong>
                      <small>{user.tagline}</small>
                    </div>
                  </div>
                  <button type="button" className="yam-follow-btn">متابعة</button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .yam-showcase-page {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 18px;
          padding: 18px;
        }
        .yam-main-feed-column,
        .yam-right-panel,
        .yam-desktop-posts,
        .yam-mobile-posts,
        .yam-trending-stack,
        .yam-online-stack,
        .yam-suggested-stack {
          display: grid;
          gap: 16px;
        }
        .yam-right-panel {
          align-content: start;
        }
        .yam-composer-card,
        .yam-right-card,
        .yam-post-card,
        .yam-mobile-stories-card {
          border-radius: 28px;
          background: rgba(8, 13, 24, 0.92);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 24px 54px rgba(2, 6, 23, 0.24);
        }
        .yam-composer-card {
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .yam-composer-top,
        .yam-composer-actions,
        .yam-post-head,
        .yam-post-actions,
        .yam-post-author-block,
        .yam-panel-head,
        .yam-trending-row,
        .yam-online-row,
        .yam-online-main,
        .yam-trending-meta,
        .yam-story-strip,
        .yam-mobile-stories-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .yam-panel-head,
        .yam-post-head,
        .yam-trending-row,
        .yam-online-row {
          justify-content: space-between;
        }
        .yam-composer-prompt strong {
          display: block;
          font-size: 18px;
        }
        .yam-composer-prompt span,
        .yam-post-head small,
        .yam-online-main small,
        .yam-trending-meta small {
          color: #94a3b8;
          font-size: 13px;
        }
        .yam-composer-actions {
          flex-wrap: wrap;
        }
        .yam-composer-actions button {
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 11px 14px;
          color: #e2e8f0;
          background: rgba(255,255,255,0.03);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }
        .yam-composer-actions button span {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: #d8b4fe;
          background: rgba(124,58,237,0.16);
        }
        .yam-feed-sort-bar {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px;
          color: #94a3b8;
          font-size: 14px;
        }
        .yam-feed-sort-bar strong {
          color: #f8fafc;
        }
        .yam-mobile-posts,
        .yam-mobile-stories-card {
          display: none;
        }
        .yam-post-card {
          padding: 18px;
          display: grid;
          gap: 16px;
        }
        .yam-post-author-line {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .yam-post-author-line strong {
          font-size: 16px;
        }
        .yam-verified {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          display: inline-grid;
          place-items: center;
          background: #3b82f6;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
        }
        .yam-showcase-avatar {
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: white;
          font-weight: 900;
          flex-shrink: 0;
        }
        .yam-showcase-avatar.ring {
          border: 2px solid rgba(168, 85, 247, 0.78);
          box-shadow: 0 0 0 4px rgba(139,92,246,0.14);
        }
        .yam-more-btn,
        .yam-chat-btn,
        .yam-follow-btn {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.03);
          color: #e2e8f0;
          display: grid;
          place-items: center;
        }
        .yam-follow-btn {
          width: auto;
          padding: 0 14px;
          background: linear-gradient(135deg, #6d28d9, #8b5cf6);
          border: none;
          font-weight: 800;
        }
        .yam-post-content {
          color: #e5e7eb;
          line-height: 1.95;
          white-space: pre-line;
        }
        .yam-post-actions {
          justify-content: flex-start;
          flex-wrap: wrap;
        }
        .yam-showcase-stat {
          min-width: 66px;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 10px 14px;
          color: #e2e8f0;
          background: rgba(255,255,255,0.03);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
        }
        .yam-showcase-stat.liked {
          color: #fca5a5;
        }
        .yam-showcase-stat.save {
          min-width: 44px;
          margin-inline-start: auto;
        }
        .yam-media-collage {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(210px, 0.9fr);
          gap: 10px;
          min-height: 320px;
        }
        .yam-collage-stack {
          display: grid;
          gap: 10px;
        }
        .yam-scene,
        .yam-trending-row .yam-scene {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background:
            radial-gradient(circle at 18% 18%, rgba(255,255,255,0.16), transparent 18%),
            radial-gradient(circle at 78% 25%, rgba(59,130,246,0.28), transparent 24%),
            radial-gradient(circle at 46% 76%, rgba(168,85,247,0.34), transparent 28%),
            linear-gradient(140deg, #070c19 4%, #13072f 48%, #071425 100%);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .yam-scene::before,
        .yam-scene::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          filter: blur(0px);
        }
        .yam-scene::before {
          width: 62%;
          height: 58%;
          inset-inline-start: -10%;
          bottom: -16%;
          background: radial-gradient(circle, rgba(59,130,246,0.38), rgba(59,130,246,0) 70%);
        }
        .yam-scene::after {
          width: 46%;
          height: 44%;
          inset-inline-end: -4%;
          top: -10%;
          background: radial-gradient(circle, rgba(168,85,247,0.4), rgba(168,85,247,0) 72%);
        }
        .yam-media-collage .scene-main,
        .yam-scene.wide {
          min-height: 320px;
        }
        .yam-media-collage .scene-side {
          min-height: 155px;
        }
        .monitor-city {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.2), rgba(6,8,18,0.55)),
            radial-gradient(circle at 50% 35%, rgba(56,189,248,0.95), rgba(56,189,248,0.05) 28%),
            linear-gradient(135deg, #0f172a 8%, #1d4ed8 42%, #7c3aed 88%);
        }
        .monitor-city::before {
          width: 70%;
          height: 2px;
          left: 15%;
          top: 52%;
          border-radius: 4px;
          background: rgba(255,255,255,0.22);
          box-shadow: 0 -80px 0 18px rgba(15,23,42,0.66), 0 -80px 0 20px rgba(255,255,255,0.06), 140px -80px 0 18px rgba(15,23,42,0.62), 140px -80px 0 20px rgba(255,255,255,0.05), 70px 44px 0 16px rgba(2,6,23,0.9);
        }
        .monitor-city::after {
          width: 24%;
          height: 48%;
          left: 38%;
          bottom: -8%;
          border-radius: 24px 24px 0 0;
          background: linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,0.94) 58%);
          box-shadow: 0 -36px 0 10px rgba(15,23,42,0.85);
        }
        .neon-desk {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.24), rgba(6,8,18,0.46)),
            radial-gradient(circle at 56% 32%, rgba(96,165,250,0.82), rgba(96,165,250,0.08) 22%),
            linear-gradient(135deg, #060913 5%, #111827 40%, #4c1d95 100%);
        }
        .neon-desk::before {
          width: 64%;
          height: 18%;
          left: 18%;
          bottom: 14%;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(59,130,246,0.22), rgba(59,130,246,0.04));
          box-shadow: 0 -72px 0 16px rgba(15,23,42,0.72), 48px -72px 0 16px rgba(15,23,42,0.72);
        }
        .city-room {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.2), rgba(6,8,18,0.56)),
            radial-gradient(circle at 50% 22%, rgba(168,85,247,0.78), rgba(168,85,247,0.06) 24%),
            linear-gradient(135deg, #050816 0%, #111827 45%, #312e81 100%);
        }
        .city-room::before {
          width: 86%;
          height: 36%;
          left: 7%;
          bottom: 8%;
          border-radius: 22px 22px 10px 10px;
          background: linear-gradient(180deg, rgba(99,102,241,0.14), rgba(2,6,23,0.8));
        }
        .studio-room {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.18), rgba(6,8,18,0.42)),
            radial-gradient(circle at 26% 50%, rgba(244,114,182,0.54), rgba(244,114,182,0.05) 24%),
            radial-gradient(circle at 72% 34%, rgba(96,165,250,0.54), rgba(96,165,250,0.03) 22%),
            linear-gradient(135deg, #040712 0%, #15162f 44%, #3b0764 100%);
        }
        .studio-room::before {
          width: 58%;
          height: 58%;
          left: 12%;
          bottom: -2%;
          border-radius: 46% 54% 20% 20%;
          background: radial-gradient(circle at 44% 28%, rgba(255,255,255,0.35), rgba(255,255,255,0.02) 26%), linear-gradient(180deg, rgba(148,163,184,0.24), rgba(15,23,42,0.76));
        }
        .studio-room::after {
          width: 22%;
          height: 56%;
          right: 16%;
          bottom: -10%;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(15,23,42,0.8));
        }
        .victory-room,
        .victory-card {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.28), rgba(6,8,18,0.55)),
            radial-gradient(circle at 72% 24%, rgba(251,191,36,0.42), rgba(251,191,36,0.02) 22%),
            linear-gradient(135deg, #07121f 0%, #1d1b4b 42%, #312e81 100%);
        }
        .victory-room::before,
        .victory-card::before {
          width: 68%;
          height: 56%;
          left: 9%;
          bottom: -12%;
          border-radius: 34px;
          background: linear-gradient(180deg, rgba(59,130,246,0.16), rgba(2,6,23,0.84));
        }
        .victory-room::after,
        .victory-card::after {
          width: 36%;
          height: 42%;
          right: 6%;
          top: 12%;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(168,85,247,0.22), rgba(2,6,23,0.08));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        .live-monitor {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.18), rgba(6,8,18,0.44)),
            radial-gradient(circle at 49% 26%, rgba(56,189,248,0.9), rgba(56,189,248,0.05) 24%),
            linear-gradient(135deg, #050816 0%, #172554 44%, #7c3aed 100%);
        }
        .live-monitor::before {
          width: 70%;
          height: 6px;
          left: 15%;
          top: 56%;
          border-radius: 999px;
          background: rgba(255,255,255,0.22);
          box-shadow: 0 -74px 0 15px rgba(15,23,42,0.82), -62px -74px 0 15px rgba(15,23,42,0.72), 62px -74px 0 15px rgba(15,23,42,0.72);
        }
        .live-monitor::after {
          width: 26%;
          height: 44%;
          left: 37%;
          bottom: -8%;
          border-radius: 26px 26px 0 0;
          background: linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,0.94) 56%);
        }
        .music-room {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.18), rgba(6,8,18,0.42)),
            radial-gradient(circle at 30% 44%, rgba(244,114,182,0.58), rgba(244,114,182,0.02) 24%),
            radial-gradient(circle at 76% 22%, rgba(168,85,247,0.56), rgba(168,85,247,0.02) 22%),
            linear-gradient(135deg, #050816 0%, #1f1235 44%, #312e81 100%);
        }
        .music-room::before {
          width: 54%;
          height: 56%;
          left: 10%;
          bottom: -4%;
          border-radius: 44% 48% 18% 18%;
          background: radial-gradient(circle at 44% 28%, rgba(255,255,255,0.34), rgba(255,255,255,0.02) 24%), linear-gradient(180deg, rgba(148,163,184,0.2), rgba(15,23,42,0.86));
        }
        .music-room::after {
          width: 28%;
          height: 20%;
          right: 14%;
          bottom: 16%;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(59,130,246,0.24), rgba(15,23,42,0.12));
          box-shadow: 0 -30px 0 8px rgba(15,23,42,0.72);
        }
        .yam-live-corner {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .live-pill,
        .viewer-pill,
        .yam-story-live {
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          color: white;
        }
        .live-pill {
          padding: 5px 9px;
          background: #ef4444;
        }
        .viewer-pill {
          padding: 5px 9px;
          background: rgba(15,23,42,0.72);
        }
        .yam-overlay-count {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 34px;
          font-weight: 900;
          background: rgba(4,8,18,0.42);
          backdrop-filter: blur(4px);
        }
        .yam-play-chip {
          position: absolute;
          inset: 50% auto auto 50%;
          transform: translate(-50%, -50%);
          width: 58px;
          height: 58px;
          border: none;
          border-radius: 50%;
          color: #fff;
          display: grid;
          place-items: center;
          background: rgba(15,23,42,0.64);
          box-shadow: 0 12px 24px rgba(2,6,23,0.35);
        }
        .yam-victory-copy {
          position: absolute;
          right: 18px;
          top: 18px;
          display: grid;
          justify-items: end;
          gap: 4px;
          color: #fff;
          text-shadow: 0 10px 20px rgba(2,6,23,0.42);
        }
        .yam-victory-copy span {
          color: #fbbf24;
          font-size: 24px;
          font-weight: 900;
        }
        .yam-victory-copy strong {
          font-size: 34px;
          letter-spacing: 0.08em;
        }
        .yam-victory-copy.compact {
          top: auto;
          bottom: 16px;
          right: 16px;
        }
        .yam-victory-copy.compact strong {
          font-size: 24px;
        }
        .yam-panel-head h3,
        .yam-join-card h3 {
          margin: 0;
        }
        .yam-panel-head span,
        .yam-link-button {
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 700;
          background: none;
          border: none;
          padding: 0;
        }
        .yam-right-card {
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .yam-story-strip,
        .yam-mobile-stories-row {
          overflow-x: auto;
          align-items: flex-start;
          padding-bottom: 4px;
        }
        .yam-story-strip::-webkit-scrollbar,
        .yam-mobile-stories-row::-webkit-scrollbar {
          height: 6px;
        }
        .yam-story-item,
        .yam-story-add {
          min-width: 74px;
          display: grid;
          justify-items: center;
          gap: 8px;
          color: #e2e8f0;
          background: transparent;
          border: none;
          padding: 0;
        }
        .yam-story-item.mobile,
        .yam-story-add.mobile {
          min-width: 66px;
        }
        .yam-story-item small,
        .yam-story-add small {
          font-size: 12px;
          white-space: nowrap;
        }
        .yam-story-ring {
          position: relative;
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(236,72,153,0.92), rgba(124,58,237,0.86), rgba(59,130,246,0.84));
        }
        .yam-story-ring.live {
          background: linear-gradient(135deg, rgba(239,68,68,0.94), rgba(168,85,247,0.9));
        }
        .yam-story-live {
          margin-top: -18px;
          padding: 4px 8px;
          background: #ef4444;
          z-index: 1;
        }
        .yam-story-add-plus {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #ddd6fe;
          border: 1px dashed rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.03);
        }
        .yam-story-add.mobile .yam-story-add-plus {
          width: 58px;
          height: 58px;
          position: relative;
        }
        .yam-story-add.mobile .yam-story-add-plus::after {
          content: '+';
          position: absolute;
          bottom: 0;
          right: -2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #7c3aed;
          color: white;
          font-size: 12px;
          font-weight: 900;
          border: 2px solid rgba(6,11,22,0.94);
        }
        .yam-trending-row {
          gap: 12px;
          align-items: stretch;
          padding: 10px 0;
        }
        .yam-trending-copy {
          min-width: 0;
          display: grid;
          gap: 6px;
          flex: 1;
        }
        .yam-trending-copy p,
        .yam-join-card p {
          margin: 0;
          color: #dbe4ff;
          line-height: 1.8;
        }
        .yam-trending-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #94a3b8;
          font-size: 12px;
        }
        .yam-trending-stats span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .yam-trending-row .yam-scene {
          width: 112px;
          min-width: 112px;
          min-height: 86px;
          border-radius: 18px;
        }
        .thumb-squad {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.2), rgba(6,8,18,0.42)),
            radial-gradient(circle at 60% 28%, rgba(59,130,246,0.52), rgba(59,130,246,0.03) 22%),
            linear-gradient(135deg, #08111f 0%, #1e1b4b 48%, #2563eb 100%);
        }
        .thumb-studio {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.16), rgba(6,8,18,0.42)),
            radial-gradient(circle at 24% 50%, rgba(244,114,182,0.48), rgba(244,114,182,0.04) 22%),
            linear-gradient(135deg, #070b16 0%, #312e81 46%, #7c3aed 100%);
        }
        .thumb-friends {
          background:
            linear-gradient(180deg, rgba(6,8,18,0.16), rgba(6,8,18,0.42)),
            radial-gradient(circle at 72% 40%, rgba(96,165,250,0.48), rgba(96,165,250,0.03) 22%),
            linear-gradient(135deg, #07121f 0%, #312e81 46%, #9333ea 100%);
        }
        .yam-online-row {
          padding: 10px 0;
        }
        .yam-online-avatar-wrap {
          position: relative;
        }
        .yam-online-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid rgba(8,13,24,0.94);
          bottom: 0;
          right: 1px;
        }
        .yam-chat-btn {
          color: #c4b5fd;
        }
        .yam-join-card {
          text-align: center;
        }
        .yam-join-gamepad {
          width: 96px;
          height: 96px;
          border-radius: 28px;
          margin: 0 auto;
          display: grid;
          place-items: center;
          font-size: 42px;
          background: linear-gradient(135deg, rgba(109,40,217,0.28), rgba(59,130,246,0.14));
        }
        .yam-join-card button {
          border: none;
          border-radius: 16px;
          padding: 14px 18px;
          color: white;
          font-weight: 800;
          background: linear-gradient(135deg, #6d28d9, #8b5cf6);
          box-shadow: 0 14px 26px rgba(109, 40, 217, 0.26);
        }
        @media (max-width: 1180px) {
          .yam-showcase-page {
            grid-template-columns: 1fr 320px;
          }
        }
        @media (max-width: 1023px) {
          .yam-showcase-page {
            grid-template-columns: 1fr;
          }
          .yam-right-panel {
            display: none;
          }
        }
        @media (max-width: 767px) {
          .yam-showcase-page {
            padding: 10px 10px 88px;
          }
          .yam-composer-card,
          .yam-feed-sort-bar,
          .yam-desktop-posts {
            display: none;
          }
          .yam-mobile-stories-card {
            display: block;
            padding: 14px 10px 12px;
            border-radius: 26px;
            background: transparent;
            border: none;
            box-shadow: none;
          }
          .yam-mobile-posts {
            display: grid;
          }
          .yam-post-card {
            border-radius: 22px;
            padding: 14px;
          }
          .yam-post-card.mobile {
            gap: 14px;
          }
          .yam-post-card.mobile .yam-post-content {
            font-size: 14px;
          }
          .yam-post-card.mobile .yam-post-actions {
            justify-content: space-between;
          }
          .yam-post-card.mobile .yam-showcase-stat {
            min-width: auto;
            border: none;
            background: transparent;
            padding: 0;
            color: #94a3b8;
            font-weight: 600;
          }
          .yam-post-card.mobile .yam-showcase-stat.liked {
            color: #94a3b8;
          }
          .yam-media-collage.mobile,
          .yam-scene.wide.mobile {
            min-height: 210px;
          }
          .yam-scene.wide.mobile {
            border-radius: 18px;
          }
          .yam-victory-copy.compact strong {
            font-size: 20px;
          }
        }
      `}</style>
    </MainLayout>
  );
}
