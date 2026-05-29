import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import YamshatIcon from '../components/yamshat/YamshatIcon.jsx';
import useSmartFeed from '../hooks/useSmartFeed.js';
import { formatCompactNumber } from '../components/yamshat/YamshatDesign.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { useAppStore } from '../store/appStore.js';
import { BACKEND_ORIGIN } from '../api/config.js';
import { getCsrfToken } from '../utils/csrf.js';
import { clearStoredUser, getAuthToken, getCurrentUsername, getStoredUserSnapshot } from '../utils/auth.js';
import { redirectToAppPath } from '../utils/router.js';
import ReactionBar from '../components/social/ReactionBar.jsx';
import FollowControls from '../components/social/FollowControls.jsx';

const FEED_TABS = [
  { id: 'favorites', label: 'المفضلة' },
  { id: 'groups', label: 'المجموعات' },
  { id: 'friends', label: 'الأصدقاء' },
  { id: 'following', label: 'متابعين' },
  { id: 'all', label: 'الكل' },
];

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: 'home', exact: true },
  { to: '/reels', label: 'الريلز', icon: 'clips' },
  { to: '/live', label: 'البث', icon: 'live' },
  { to: '/groups', label: 'المجموعات', icon: 'groups' },
  { to: '/stories', label: 'الستوري', icon: 'bookmark' },
  { to: '/inbox', label: 'الدردشة', icon: 'message' },
  { to: '/notifications', label: 'الإشعارات', icon: 'bell', badge: '12' },
  { to: '/search', label: 'البحث الذكي', icon: 'search' },
  { to: '/settings', label: 'الإعدادات', icon: 'menu' },
];

const QUICK_ACTIONS = [
  { label: 'صورة', color: 'green' },
  { label: 'فيديو', color: 'violet' },
  { label: 'رأيك', color: 'rose' },
];

const PROFILE_HIGHLIGHTS = [
  { label: 'جديد', kind: 'add' },
  { label: 'السفر', kind: 'travel' },
  { label: 'تصميم', kind: 'design' },
  { label: 'لحظات', kind: 'moments' },
  { label: 'مشاريع', kind: 'projects' },
];

const SUMMARY_ITEMS = [
  { icon: 'profile', text: 'مصمم UI/UX' },
  { icon: 'groups', text: 'يعمل في Yamshat' },
  { icon: 'discover', text: 'من دمشق، سوريا' },
  { icon: 'bookmark', text: 'انضم في يناير 2023' },
];

const MOCK_POSTS = [
  {
    id: 'mock-1',
    authorName: 'أحمد محمد',
    handle: '@ahmed.mohammed',
    time: 'منذ 2 س',
    text: 'لحظات لا تُنسى من رحلتي اليوم ✨\nالطبيعة دائماً تمنحنا السلام الذي نبحث عنه.',
    likes: 1200,
    comments: 128,
    shares: 64,
    views: 2400,
    media: [
      { type: 'scenic-video' },
      { type: 'scenic-lake' },
      { type: 'scenic-forest' },
    ],
  },
  {
    id: 'mock-2',
    authorName: 'تصميم ملهم',
    handle: '@inspired.design',
    time: 'منذ 4 س',
    text: 'تصميم بسيط.. تأثير كبير. 🎨\nشارك رأيك في هذا العمل.',
    likes: 860,
    comments: 34,
    shares: 19,
    views: 1700,
    media: [{ type: 'portrait-purple' }],
    brandRing: true,
  },
];


function SocialEnhancements({ post }) {
  return (
    <div className="mt-4 space-y-3">
      <FollowControls userId={post.handle} username={post.handle.replace('@', '')} />
      <ReactionBar postId={post.id} />
    </div>
  );
}

function normalizeHandle(value = '') {
  const cleaned = String(value || '').trim().replace(/^@+/, '');
  return cleaned ? `@${cleaned}` : '@ahmed.mohammed';
}

function buildFeedPosts(posts = []) {
  if (Array.isArray(posts) && posts.length) {
    return posts.slice(0, 8).map((post, index) => ({
      id: post.id || `post-${index}`,
      authorName: post.author_name || post.username || post.user || 'مستخدم يامشات',
      handle: normalizeHandle(post.username || post.user || `user.${index + 1}`),
      time: 'الآن',
      text: post.content || 'منشور جديد على يامشات.',
      likes: Number(post.likes_count || post.like_count || post.likes || 0),
      comments: Number(post.comments_count || post.comment_count || 0),
      shares: Number(post.share_count || post.shares || 0),
      views: Number(post.views_count || post.view_count || 0),
      media: Array.isArray(post.media_urls) && post.media_urls.length
        ? post.media_urls.slice(0, 3).map((url, mediaIndex) => ({ type: mediaIndex === 0 ? 'image-primary' : 'image-secondary', url }))
        : [{ type: index % 2 === 0 ? 'scenic-lake' : 'portrait-purple' }],
    }));
  }

  return MOCK_POSTS;
}

function Avatar({ name, size = 46, accent = false, image = false }) {
  const firstLetter = String(name || 'Y').trim().charAt(0) || 'Y';
  return (
    <div
      className={`yam-laptop-avatar ${accent ? 'accent' : ''} ${image ? 'image' : ''}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden="true"
    >
      <span>{firstLetter}</span>
    </div>
  );
}

function MediaTile({ item, index }) {
  if (item?.url) {
    return (
      <div className={`yam-post-media-tile tile-${index}`}>
        <img src={item.url} alt="post media" className="yam-post-media-image" />
        {index === 0 ? (
          <div className="yam-post-play-overlay">
            <YamshatIcon name="play" size={24} filled />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`yam-post-media-tile tile-${index} ${item?.type || 'scenic-lake'}`}>
      {index === 0 ? (
        <div className="yam-post-play-overlay">
          <YamshatIcon name="play" size={24} filled />
        </div>
      ) : null}
    </div>
  );
}

function PostCard({ post }) {
  const { pushToast } = useToast();
  const mediaItems = Array.isArray(post.media) ? post.media.slice(0, 3) : [];
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes || 0));
  const [commentsCount, setCommentsCount] = useState(Number(post.comments || 0));
  const [sharesCount, setSharesCount] = useState(Number(post.shares || 0));
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [localComments, setLocalComments] = useState([]);

  const handleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikesCount((count) => Math.max(0, count + (next ? 1 : -1)));
      return next;
    });
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/#/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorName, text: post.text, url: postUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
      }
      setSharesCount((count) => count + 1);
      pushToast({ type: 'success', title: 'تمت مشاركة المنشور أو نسخ رابطه' });
    } catch {
      pushToast({ type: 'info', title: 'تعذر فتح نافذة المشاركة', description: 'تم تجاهل العملية بدون خطأ مؤثر.' });
    }
  };

  const handleSave = () => {
    setSaved((prev) => !prev);
    pushToast({ type: 'success', title: saved ? 'تمت إزالة المنشور من المحفوظات' : 'تم حفظ المنشور' });
  };

  const handleAddComment = () => {
    const content = commentDraft.trim();
    if (!content) return;
    setLocalComments((prev) => [{ id: `${post.id}-${Date.now()}`, author: 'أنت', content }, ...prev]);
    setCommentsCount((count) => count + 1);
    setCommentDraft('');
    if (!showComments) setShowComments(true);
    pushToast({ type: 'success', title: 'تمت إضافة التعليق' });
  };

  return (
    <article className="yam-post-card-v2">
      <div className="yam-post-head-v2">
        <div className="yam-post-author-v2">
          <Avatar name={post.authorName} size={48} accent={Boolean(post.brandRing)} image />
          <div className="yam-post-author-copy">
            <div className="yam-post-author-line">
              <strong>{post.authorName}</strong>
              <span className="yam-verified-badge">✓</span>
            </div>
            <div className="yam-post-handle">{post.handle}</div>
          </div>
        </div>
        <div className="yam-post-meta-v2">
          <span>{post.time}</span>
          <button type="button" className="yam-ghost-icon-btn" aria-label="خيارات المنشور">
            <YamshatIcon name="more" size={18} />
          </button>
        </div>
      </div>

      <p className="yam-post-copy-v2">{post.text}</p>

      <div className={`yam-post-media-grid-v2 media-count-${mediaItems.length || 1}`}>
        {mediaItems.map((item, index) => (
          <MediaTile key={`${post.id}-media-${index}`} item={item} index={index} />
        ))}
      </div>

      <div className="yam-post-stats-v2">
        <div className="yam-post-reactions-v2">
          <span className="reaction-bubble like">❤</span>
          <span className="reaction-bubble support">👍</span>
          <span className="reaction-bubble wow">💙</span>
          <strong>{formatCompactNumber(likesCount)}</strong>
        </div>
        <div className="yam-post-numbers-v2">
          <span>{formatCompactNumber(commentsCount)} تعليق</span>
          <span>{formatCompactNumber(sharesCount)} مشاركة</span>
          <span>{formatCompactNumber(post.views || 0)} مشاهدة</span>
        </div>
      </div>

      <div className="yam-post-actions-v2">
        <button type="button" className={liked ? 'active' : ''} onClick={handleLike}><YamshatIcon name="heart" size={17} />{liked ? 'تم الإعجاب' : 'أعجبني'}</button>
        <button type="button" className={showComments ? 'active' : ''} onClick={() => setShowComments((prev) => !prev)}><YamshatIcon name="comment" size={17} />تعليق</button>
        <button type="button" onClick={handleShare}><YamshatIcon name="repeat" size={17} />مشاركة</button>
        <button type="button" className={saved ? 'active' : ''} onClick={handleSave}><YamshatIcon name="bookmark" size={17} />{saved ? 'محفوظ' : 'حفظ'}</button>
      </div>

      {showComments ? (
        <div className="yam-post-comments-panel">
          <div className="yam-post-comment-composer">
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="اكتب تعليقك هنا..."
              rows={3}
            />
            <button type="button" className="yam-post-comment-send" onClick={handleAddComment}>إرسال التعليق</button>
          </div>

          <div className="yam-post-comment-list">
            {localComments.length ? localComments.map((comment) => (
              <div key={comment.id} className="yam-post-comment-item">
                <strong>{comment.author}</strong>
                <p>{comment.content}</p>
              </div>
            )) : <div className="yam-post-comment-empty">لا توجد تعليقات بعد، كن أول من يعلّق.</div>}
          </div>
        </div>
      ) : null}
    <SocialEnhancements post={post} />
                </article>
  );
}

export default function FeedEnhanced() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const [activeTab, setActiveTab] = useState('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profile = getStoredUserSnapshot();
  const username = getCurrentUsername() || profile?.username || 'ahmed.mohammed';
  const displayName = profile?.profile?.full_name || profile?.name || profile?.full_name || 'أحمد محمد';

  const { posts = [] } = useSmartFeed({
    filterType: activeTab === 'all' ? 'all' : 'following',
    sortBy: 'recent',
    limit: 8,
    pollingInterval: 25_000,
  });

  const feedPosts = useMemo(() => buildFeedPosts(posts), [posts]);
  const totalPosts = feedPosts.length ? Math.max(128, feedPosts.length) : 128;

  const handleThemeToggle = () => {
    toggleTheme();
    pushToast({ type: 'success', title: theme === 'dark' ? 'تم تفعيل الوضع النهاري' : 'تم تفعيل الوضع الليلي' });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      await fetch(`${BACKEND_ORIGIN}/api/auth/logout`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
      });
    } catch {
      // ignore transport errors and clear the session anyway
    } finally {
      clearStoredUser();
      setIsSettingsOpen(false);
      setLoggingOut(false);
      redirectToAppPath('/login');
    }
  };

  return (
    <MainLayout hideNav lockScroll>
      <div className="yam-laptop-page" dir="rtl">
        <div className="yam-page-noise" />
        <div className="yam-laptop-shell">
          <aside className="yam-left-rail">
            <div className="yam-logo-card">
              <div className="yam-logo-mark">Y</div>
              <div className="yam-logo-text">YAMSHAT</div>
            </div>

            <nav className="yam-main-nav-desktop">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={Boolean(item.exact)}
                  className={({ isActive }) => `yam-nav-link-desktop ${isActive ? 'active' : ''}`}
                >
                  <span className="yam-nav-link-icon"><YamshatIcon name={item.icon} size={18} /></span>
                  <span>{item.label}</span>
                  {item.badge ? <span className="yam-nav-link-badge">{item.badge}</span> : null}
                </NavLink>
              ))}
            </nav>

            <div className="yam-rail-footer">
              <button type="button" className="yam-dark-toggle-row yam-action-surface" onClick={handleThemeToggle} aria-label="تبديل الوضع الليلي">
                <div className="yam-dark-toggle-copy">
                  <YamshatIcon name="moon" size={18} />
                  <span>الوضع الليلي</span>
                </div>
                <span className={`yam-dark-toggle-switch ${theme === 'dark' ? 'active' : ''}`}><span /></span>
              </button>

              <button type="button" className="yam-logout-btn-desktop" onClick={handleLogout} disabled={loggingOut}>
                <YamshatIcon name="message" size={16} />
                <span>{loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل خروج'}</span>
              </button>
            </div>
          </aside>

          <main className="yam-center-stage">
            <section className="yam-feed-header-card">
              <div className="yam-feed-header-top">
                <h1>المنشورات</h1>
                <div className="yam-mobile-brand">YAMSHAT</div>
              </div>

              <div className="yam-composer-prompt-bar">
                <div className="yam-composer-actions-inline">
                  {QUICK_ACTIONS.map((item) => (
                    <button key={item.label} type="button" className={`yam-mini-action ${item.color}`}>
                      <span className="dot" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="yam-home-composer-slot">
                <PostComposer />
              </div>

              <div className="yam-feed-tabs">
                {FEED_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`yam-feed-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="yam-post-stack-v2">
              {feedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </main>

          <aside className="yam-right-rail">
            <section className="yam-profile-card-v2">
              <div className="yam-profile-cover-v2">
                <div className="yam-profile-cover-brand">YAMSHAT</div>
              </div>

              <div className="yam-profile-body-v2">
                <div className="yam-profile-avatar-wrap">
                  <Avatar name={displayName} size={96} accent image />
                  <button type="button" className="yam-avatar-camera-btn" aria-label="تغيير الصورة">
                    <YamshatIcon name="profile" size={16} />
                  </button>
                </div>

                <div className="yam-profile-name-v2">
                  <strong>{displayName}</strong>
                  <span className="yam-verified-badge">✓</span>
                </div>
                <div className="yam-profile-handle-v2">{normalizeHandle(username)}</div>

                <div className="yam-profile-stats-v2">
                  <div><strong>{totalPosts}</strong><span>المنشورات</span></div>
                  <div><strong>2.4K</strong><span>المتابعين</span></div>
                  <div><strong>320</strong><span>يتابع</span></div>
                </div>

                <p className="yam-profile-bio-v2">
                  مصمم ومطور واجهات مستخدم<br />
                  أحب التصميم والتقنية والسفر ✈️<br />
                  دمشق - سوريا
                </p>

                <div className="yam-profile-actions-v2">
                  <button type="button" className="yam-primary-action-btn" onClick={() => navigate('/profile')}>تعديل الملف الشخصي</button>
                  <div className="yam-settings-menu-wrap">
                    <button type="button" className="yam-settings-icon-btn" onClick={() => setIsSettingsOpen((prev) => !prev)} aria-expanded={isSettingsOpen} aria-label="فتح إعدادات سريعة"><YamshatIcon name="menu" size={18} /></button>
                    {isSettingsOpen ? (
                      <div className="yam-settings-popover">
                        <button type="button" className="yam-settings-popover-item" onClick={handleThemeToggle}>
                          <span>الوضع الليلي</span>
                          <span className={`yam-dark-toggle-switch small ${theme === 'dark' ? 'active' : ''}`}><span /></span>
                        </button>
                        <button type="button" className="yam-settings-popover-item danger" onClick={handleLogout} disabled={loggingOut}>
                          <span>{loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل خروج'}</span>
                          <YamshatIcon name="message" size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="yam-highlights-row-v2">
                  {PROFILE_HIGHLIGHTS.map((item) => (
                    <div key={item.label} className="yam-highlight-item-v2">
                      <div className={`yam-highlight-ring ${item.kind}`}>
                        {item.kind === 'add' ? <YamshatIcon name="plus" size={18} /> : null}
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="yam-summary-card-v2">
              <div className="yam-section-title-row">
                <h3>معلومات مختصرة</h3>
              </div>
              <div className="yam-summary-list-v2">
                {SUMMARY_ITEMS.map((item) => (
                  <div key={item.text} className="yam-summary-row-v2">
                    <span className="yam-summary-icon"><YamshatIcon name={item.icon} size={16} /></span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <style>{`
          .yam-laptop-page {
            position: relative;
            min-height: 100vh;
            background:
              radial-gradient(circle at top right, rgba(121, 40, 202, 0.22), transparent 18%),
              radial-gradient(circle at top left, rgba(96, 165, 250, 0.10), transparent 16%),
              linear-gradient(180deg, #040815 0%, #070d1d 48%, #060913 100%);
            color: #f5f7ff;
            overflow: hidden;
          }

          .yam-page-noise {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: radial-gradient(rgba(255,255,255,0.06) 0.5px, transparent 0.5px);
            background-size: 14px 14px;
            opacity: 0.14;
          }

          .yam-laptop-shell {
            position: relative;
            width: min(1800px, calc(100% - 28px));
            height: 100vh;
            margin: 0 auto;
            padding: 20px 0;
            display: grid;
            grid-template-columns: 250px minmax(0, 1fr) 360px;
            gap: 18px;
            align-items: start;
            overflow: hidden;
          }

          .yam-left-rail,
          .yam-center-stage,
          .yam-right-rail {
            min-width: 0;
          }

          .yam-left-rail,
          .yam-right-rail {
            position: sticky;
            top: 18px;
          }

          .yam-logo-card,
          .yam-feed-header-card,
          .yam-post-card-v2,
          .yam-profile-card-v2,
          .yam-summary-card-v2,
          .yam-main-nav-desktop,
          .yam-rail-footer {
            border: 1px solid rgba(255,255,255,0.07);
            background: linear-gradient(180deg, rgba(7, 12, 25, 0.96), rgba(6, 10, 20, 0.92));
            border-radius: 26px;
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.32);
            backdrop-filter: blur(22px);
          }

          .yam-left-rail {
            display: grid;
            gap: 16px;
            max-height: calc(100vh - 40px);
            overflow: auto;
            align-self: start;
          }

          .yam-logo-card {
            min-height: 190px;
            display: grid;
            place-items: center;
            text-align: center;
            padding: 22px;
            background:
              radial-gradient(circle at 50% 15%, rgba(152, 62, 255, 0.32), transparent 38%),
              linear-gradient(180deg, rgba(11, 14, 35, 0.98), rgba(5, 10, 20, 0.98));
          }

          .yam-logo-mark {
            width: 84px;
            height: 84px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            font-size: 46px;
            font-weight: 900;
            color: #dfc5ff;
            border: 1px solid rgba(178, 111, 255, 0.34);
            background: linear-gradient(180deg, rgba(119, 65, 245, 0.25), rgba(71, 27, 152, 0.1));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(103, 45, 221, 0.24);
          }

          .yam-logo-text {
            margin-top: 14px;
            letter-spacing: 0.24em;
            font-size: 15px;
            font-weight: 800;
            color: #e9ddff;
          }

          .yam-main-nav-desktop {
            padding: 14px;
            display: grid;
            gap: 8px;
          }

          .yam-nav-link-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 14px;
            color: #d7def6;
            transition: 0.22s ease;
            font-weight: 700;
          }

          .yam-nav-link-desktop:hover,
          .yam-nav-link-desktop.active {
            color: #fff;
            background: linear-gradient(90deg, rgba(114, 60, 240, 0.24), rgba(85, 73, 243, 0.08));
            box-shadow: var(--shadow-inset-soft);
          }

          .yam-nav-link-icon {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            color: #bda8ff;
          }

          .yam-nav-link-badge {
            margin-inline-start: auto;
            min-width: 26px;
            height: 26px;
            padding: 0 8px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }

          .yam-rail-footer {
            padding: 14px;
            display: grid;
            gap: 12px;
          }

          .yam-dark-toggle-row,
          .yam-logout-btn-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            background: rgba(255,255,255,0.03);
            color: #e5e7f8;
            border: 1px solid rgba(255,255,255,0.05);
          }

          .yam-action-surface {
            width: 100%;
            cursor: pointer;
          }

          .yam-dark-toggle-copy,
          .yam-logout-btn-desktop {
            font-weight: 700;
          }

          .yam-dark-toggle-copy {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .yam-dark-toggle-switch {
            width: 48px;
            height: 28px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            padding: 3px;
            display: flex;
            align-items: center;
          }

          .yam-dark-toggle-switch span {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.26);
            transition: transform 0.2s ease;
          }

          .yam-dark-toggle-switch.active {
            justify-content: flex-end;
            background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.9));
          }

          .yam-logout-btn-desktop {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.05);
            justify-content: center;
            cursor: pointer;
          }

          .yam-logout-btn-desktop:disabled {
            opacity: 0.7;
            cursor: wait;
          }

          .yam-center-stage {
            display: flex;
            flex-direction: column;
            gap: 18px;
            min-height: 0;
            max-height: calc(100vh - 40px);
            overflow: hidden;
          }

          .yam-feed-header-card {
            position: sticky;
            top: 0;
            z-index: 4;
            flex-shrink: 0;
            padding: 18px 20px 14px;
          }

          .yam-feed-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .yam-feed-header-top h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 900;
          }

          .yam-mobile-brand {
            display: none;
            font-size: 12px;
            letter-spacing: 0.22em;
            color: #bda8ff;
            font-weight: 800;
          }

          .yam-composer-prompt-bar {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            margin-bottom: 14px;
          }

          .yam-home-composer-slot {
            margin-bottom: 14px;
          }

          .yam-home-composer-slot > * {
            margin-bottom: 0 !important;
          }

          .yam-composer-actions-inline {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .yam-mini-action {
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            min-height: 44px;
            padding: 0 14px;
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
          }

          .yam-mini-action .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .yam-mini-action.green .dot { background: #22c55e; }
          .yam-mini-action.violet .dot { background: #8b5cf6; }
          .yam-mini-action.rose .dot { background: #f43f5e; }

          .yam-composer-input-surface {
            min-height: 52px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #95a0c7;
            font-weight: 600;
          }

          .yam-feed-tabs {
            display: flex;
            align-items: center;
            gap: 18px;
            overflow-x: auto;
            padding-bottom: 2px;
          }

          .yam-feed-tabs::-webkit-scrollbar { display: none; }

          .yam-feed-tab {
            position: relative;
            background: transparent;
            border: none;
            color: #97a2c6;
            padding: 10px 0;
            font-weight: 700;
            white-space: nowrap;
          }

          .yam-feed-tab.active {
            color: #fff;
          }

          .yam-feed-tab.active::after {
            content: '';
            position: absolute;
            inset-inline: 0;
            bottom: 0;
            height: 3px;
            border-radius: 999px;
            background: linear-gradient(90deg, #8b5cf6, #d946ef);
          }

          .yam-post-stack-v2 {
            flex: 1;
            min-height: 0;
            overflow: auto;
            overscroll-behavior-y: contain;
            scrollbar-gutter: stable both-edges;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.72) transparent;
            display: grid;
            gap: 18px;
            padding-inline-end: 4px;
            padding-bottom: 28px;
          }

          .yam-post-stack-v2::-webkit-scrollbar {
            width: 10px;
          }

          .yam-post-stack-v2::-webkit-scrollbar-track {
            background: transparent;
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.92), rgba(99, 102, 241, 0.88));
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(167, 139, 250, 1), rgba(129, 140, 248, 1));
          }

          .yam-post-card-v2 {
            padding: 18px;
            display: grid;
            gap: 14px;
          }

          .yam-post-head-v2,
          .yam-post-author-v2,
          .yam-post-meta-v2,
          .yam-post-stats-v2,
          .yam-post-reactions-v2,
          .yam-post-actions-v2,
          .yam-profile-name-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .yam-post-head-v2,
          .yam-post-stats-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            justify-content: space-between;
          }

          .yam-post-meta-v2 {
            color: #8894bd;
            font-size: 13px;
          }

          .yam-post-author-copy {
            min-width: 0;
          }

          .yam-post-author-line,
          .yam-profile-name-v2 {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .yam-post-author-line strong,
          .yam-profile-name-v2 strong {
            font-size: 18px;
          }

          .yam-post-handle,
          .yam-profile-handle-v2 {
            color: #8f9cc5;
            font-size: 14px;
            margin-top: 2px;
          }

          .yam-verified-badge {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            background: #3b82f6;
            color: #fff;
            font-size: 11px;
            font-weight: 900;
            flex-shrink: 0;
          }

          .yam-ghost-icon-btn,
          .yam-settings-icon-btn {
            width: 38px;
            height: 38px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.04);
            color: #e8ebff;
            display: grid;
            place-items: center;
          }

          .yam-settings-menu-wrap {
            position: relative;
          }

          .yam-settings-popover {
            position: absolute;
            top: calc(100% + 10px);
            inset-inline-end: 0;
            width: min(260px, 72vw);
            padding: 10px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(8, 12, 26, 0.96);
            box-shadow: 0 24px 50px rgba(0, 0, 0, 0.34);
            display: grid;
            gap: 8px;
            z-index: 20;
            backdrop-filter: blur(20px);
          }

          .yam-settings-popover-item {
            min-height: 48px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            font-weight: 800;
          }

          .yam-settings-popover-item.danger {
            color: #fda4af;
          }

          .yam-dark-toggle-switch.small {
            width: 42px;
            height: 24px;
          }

          .yam-dark-toggle-switch.small span {
            width: 18px;
            height: 18px;
          }

          .yam-post-copy-v2 {
            margin: 0;
            color: #edf2ff;
            line-height: 1.9;
            white-space: pre-line;
            font-size: 15px;
          }

          .yam-post-media-grid-v2 {
            display: grid;
            grid-template-columns: 1.05fr 1.25fr 0.72fr;
            gap: 10px;
            min-height: 318px;
          }

          .yam-post-media-grid-v2.media-count-1 {
            grid-template-columns: 1fr;
            min-height: 320px;
          }

          .yam-post-media-grid-v2.media-count-2 {
            grid-template-columns: 1.1fr 0.9fr;
          }

          .yam-post-media-tile {
            position: relative;
            overflow: hidden;
            border-radius: 22px;
            min-height: 318px;
            background: linear-gradient(180deg, rgba(99,102,241,0.18), rgba(15,23,42,0.9));
          }

          .yam-post-media-grid-v2.media-count-3 .tile-2 {
            min-height: 318px;
          }

          .yam-post-media-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .yam-post-play-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.24));
          }

          .yam-post-play-overlay svg {
            width: 64px !important;
            height: 64px !important;
            padding: 18px;
            border-radius: 50%;
            color: #fff;
            background: rgba(255,255,255,0.16);
            backdrop-filter: blur(10px);
            box-shadow: 0 16px 35px rgba(0,0,0,0.32);
          }

          .scenic-video {
            background:
              linear-gradient(180deg, rgba(10,18,37,0.05), rgba(3,7,18,0.3)),
              radial-gradient(circle at 50% 35%, rgba(255,255,255,0.18), transparent 24%),
              linear-gradient(180deg, #4b5d7d 0%, #1b2740 44%, #0b1224 100%);
          }

          .scenic-lake {
            background:
              radial-gradient(circle at 65% 12%, rgba(255, 196, 148, 0.46), transparent 16%),
              linear-gradient(180deg, #8978ab 0%, #3f4d7c 30%, #173257 56%, #0a1730 100%);
          }

          .scenic-forest {
            background:
              linear-gradient(180deg, rgba(240,240,255,0.24), rgba(18,43,48,0.12) 28%, rgba(7,19,26,0.96) 100%),
              linear-gradient(180deg, #6c768f 0%, #253349 32%, #0f1f2b 100%);
          }

          .portrait-purple {
            background:
              radial-gradient(circle at 45% 30%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(120deg, #081021 12%, #3a065f 55%, #0d0f29 100%);
          }

          .yam-post-reactions-v2 {
            color: #ecf1ff;
            font-size: 14px;
            font-weight: 800;
          }

          .reaction-bubble {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            font-size: 12px;
            margin-inline-end: -6px;
            border: 2px solid rgba(7,12,25,0.95);
          }

          .reaction-bubble.like { background: #fb7185; }
          .reaction-bubble.support { background: #60a5fa; }
          .reaction-bubble.wow { background: #818cf8; }

          .yam-post-numbers-v2 {
            display: inline-flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 14px;
            color: #8994ba;
            font-size: 13px;
          }

          .yam-post-actions-v2 {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 12px;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .yam-post-actions-v2 button {
            border: none;
            background: transparent;
            color: #dce2f8;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 12px;
            cursor: pointer;
          }

          .yam-post-actions-v2 button:hover,
          .yam-post-actions-v2 button.active {
            background: rgba(124,58,237,0.14);
            color: #fff;
          }

          .yam-post-comments-panel {
            display: grid;
            gap: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }

          .yam-post-comment-composer {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-composer textarea {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #eef2ff;
            border-radius: 16px;
            padding: 14px;
            resize: vertical;
            min-height: 96px;
          }

          .yam-post-comment-send {
            justify-self: flex-start;
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(167,139,250,0.24);
            background: linear-gradient(135deg, rgba(124,58,237,0.92), rgba(99,102,241,0.92));
            color: white;
            padding: 0 16px;
            font-weight: 800;
          }

          .yam-post-comment-list {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-item,
          .yam-post-comment-empty {
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 12px 14px;
          }

          .yam-post-comment-item p {
            margin: 6px 0 0;
            color: #cbd5f5;
            line-height: 1.8;
          }

          .yam-post-comment-empty {
            color: #94a3b8;
          }

          .yam-right-rail {
            display: grid;
            gap: 18px;
            max-height: calc(100vh - 40px);
            overflow: auto;
            align-self: start;
          }

          .yam-profile-card-v2 {
            overflow: hidden;
          }

          .yam-profile-cover-v2 {
            min-height: 146px;
            padding: 18px;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            background:
              radial-gradient(circle at 50% 0%, rgba(146, 71, 255, 0.34), transparent 34%),
              linear-gradient(180deg, #0f1230 0%, #0a0f21 100%);
          }

          .yam-profile-cover-brand {
            letter-spacing: 0.28em;
            color: #ede6ff;
            font-size: 14px;
            font-weight: 900;
            margin-top: 8px;
          }

          .yam-profile-body-v2 {
            position: relative;
            padding: 0 20px 20px;
            text-align: center;
          }

          .yam-profile-avatar-wrap {
            position: relative;
            width: fit-content;
            margin: -48px auto 12px;
          }

          .yam-avatar-camera-btn {
            position: absolute;
            inset-inline-end: 0;
            bottom: 4px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(10,15,30,0.92);
            color: #fff;
            display: grid;
            place-items: center;
          }

          .yam-profile-stats-v2 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin: 16px 0;
          }

          .yam-profile-stats-v2 div {
            display: grid;
            gap: 4px;
          }

          .yam-profile-stats-v2 strong {
            font-size: 24px;
          }

          .yam-profile-stats-v2 span,
          .yam-highlight-item-v2 span,
          .yam-summary-row-v2 span:last-child {
            color: #97a3ca;
            font-size: 13px;
          }

          .yam-profile-bio-v2 {
            margin: 0;
            color: #dbe3fc;
            line-height: 1.9;
            font-size: 14px;
          }

          .yam-primary-action-btn {
            flex: 1;
            min-height: 48px;
            border: none;
            border-radius: 16px;
            color: #fff;
            font-weight: 800;
            background: linear-gradient(135deg, #6d3cf0, #8b5cf6);
            box-shadow: 0 16px 34px rgba(109, 60, 240, 0.28);
          }

          .yam-highlights-row-v2 {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-top: 14px;
          }

          .yam-highlight-item-v2 {
            min-width: 64px;
            display: grid;
            justify-items: center;
            gap: 8px;
          }

          .yam-highlight-ring {
            width: 62px;
            height: 62px;
            border-radius: 50%;
            padding: 3px;
            display: grid;
            place-items: center;
            color: #fff;
            background: linear-gradient(135deg, #7c3aed, #d946ef);
          }

          .yam-highlight-ring::before {
            content: '';
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(180deg, #151a39, #090d1d);
            display: block;
          }

          .yam-highlight-ring.add {
            background: linear-gradient(135deg, #353f62, #1a2035);
            position: relative;
          }

          .yam-highlight-ring svg,
          .yam-highlight-ring.add svg {
            position: absolute;
            z-index: 1;
          }

          .yam-highlight-ring.travel,
          .yam-highlight-ring.design,
          .yam-highlight-ring.moments,
          .yam-highlight-ring.projects {
            position: relative;
          }

          .yam-highlight-ring.travel::after,
          .yam-highlight-ring.design::after,
          .yam-highlight-ring.moments::after,
          .yam-highlight-ring.projects::after {
            content: '';
            position: absolute;
            inset: 8px;
            border-radius: 50%;
            background:
              radial-gradient(circle at 55% 30%, rgba(255,255,255,0.14), transparent 18%),
              linear-gradient(180deg, #273657, #111931 70%, #0a1022);
          }

          .yam-summary-card-v2 {
            padding: 18px;
          }

          .yam-summary-card-v2 h3 {
            margin: 0;
            font-size: 20px;
          }

          .yam-summary-list-v2 {
            display: grid;
            gap: 14px;
            margin-top: 14px;
          }

          .yam-summary-row-v2 {
            justify-content: flex-start;
            gap: 12px;
            color: #dbe2fb;
          }

          .yam-summary-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            color: #c9b7ff;
            background: rgba(255,255,255,0.04);
          }

          .yam-laptop-avatar {
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 22px;
            font-weight: 900;
            background:
              radial-gradient(circle at 50% 28%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(140deg, #1b2340 10%, #6241a8 60%, #0f1428 100%);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 14px 24px rgba(0,0,0,0.24);
            overflow: hidden;
          }

          .yam-laptop-avatar.image span {
            transform: translateY(8px);
          }

          .yam-laptop-avatar.accent {
            box-shadow: 0 0 0 4px rgba(124,58,237,0.18), 0 14px 24px rgba(0,0,0,0.24);
          }

          @media (max-width: 1380px) {
            .yam-laptop-shell {
              grid-template-columns: 220px minmax(0, 1fr) 320px;
            }
          }

          @media (max-width: 1140px) {
            .yam-laptop-shell {
              grid-template-columns: minmax(0, 1fr);
            }

            .yam-left-rail,
            .yam-right-rail {
              position: static;
            }

            .yam-left-rail {
              order: 2;
            }

            .yam-right-rail {
              order: 3;
            }
          }

          @media (max-width: 768px) {
            .yam-laptop-shell {
              width: min(100%, calc(100% - 16px));
              padding: 10px 0 24px;
              gap: 14px;
            }

            .yam-left-rail,
            .yam-right-rail {
              display: none;
            }

            .yam-feed-header-card,
            .yam-post-card-v2,
            .yam-summary-card-v2,
            .yam-profile-card-v2 {
              border-radius: 22px;
            }

            .yam-feed-header-top h1 {
              font-size: 24px;
            }

            .yam-mobile-brand {
              display: block;
            }

            .yam-composer-prompt-bar {
              grid-template-columns: 1fr;
            }

            .yam-composer-actions-inline {
              width: 100%;
              overflow-x: auto;
              padding-bottom: 2px;
            }

            .yam-post-media-grid-v2,
            .yam-post-media-grid-v2.media-count-2,
            .yam-post-media-grid-v2.media-count-3 {
              grid-template-columns: 1fr;
              min-height: auto;
            }

            .yam-post-media-tile,
            .yam-post-media-grid-v2.media-count-3 .tile-2 {
              min-height: 220px;
            }

            .yam-post-stats-v2,
            .yam-post-actions-v2 {
              gap: 10px;
              flex-direction: column;
              align-items: flex-start;
            }

            .yam-post-numbers-v2 {
              justify-content: flex-start;
            }

            .yam-post-actions-v2 button {
              width: 100%;
              justify-content: center;
              background: rgba(255,255,255,0.03);
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
