import { useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import FeedSkeleton from '../components/feed/FeedSkeleton.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import VirtualizedInfiniteFeed from '../components/feed/VirtualizedInfiniteFeed.jsx';
import ProFeedPostCard from '../components/feed/ProFeedPostCard.jsx';
import useSmartFeed from '../hooks/useSmartFeed.js';
import { buildTrendingHashtags } from '../services/recommendationService.js';
import { formatCompactNumber } from '../components/yamshat/YamshatDesign.js';

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'following', label: 'أتابعهم' },
  { id: 'trending', label: 'ترند' },
  { id: 'mine', label: 'منشوراتي' },
];

const SORTS = [
  { id: 'recent', label: 'الأحدث' },
  { id: 'trending', label: 'الأكثر تفاعلاً' },
  { id: 'oldest', label: 'الأقدم' },
];

export default function FeedEnhanced() {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const {
    posts = [],
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isHydratedFromCache,
    data,
  } = useSmartFeed({
    filterType,
    sortBy,
    limit: 12,
    pollingInterval: 25_000,
  });

  const stats = useMemo(() => {
    const totalLikes = posts.reduce((sum, post) => sum + Number(post?.likes_count || post?.like_count || 0), 0);
    const totalSaves = posts.reduce((sum, post) => sum + Number(post?.saved_count || post?.save_count || 0), 0);
    const totalShares = posts.reduce((sum, post) => sum + Number(post?.share_count || 0), 0);
    const pinnedCount = posts.filter((post) => post?.is_pinned).length;
    const pollCount = posts.filter((post) => Array.isArray(post?.poll) && post.poll.length).length;
    return { totalLikes, totalSaves, totalShares, pinnedCount, pollCount };
  }, [posts]);

  const trendingTags = useMemo(() => {
    const built = buildTrendingHashtags(posts).slice(0, 8);
    if (built.length) return built;
    return [
      { tag: '#feed', count: 420 },
      { tag: '#uiux', count: 310 },
      { tag: '#yamshat', count: 260 },
    ];
  }, [posts]);

  const cachedPagesCount = data?.pages?.length || 0;

  return (
    <MainLayout hideNav>
      <div className="feed-pro-page" dir="rtl">
        <div className="feed-pro-shell">
          <section className="feed-pro-main">
            <div className="feed-pro-hero">
              <div>
                <div className="feed-pro-eyebrow">Feed Pro</div>
                <h1>صفحة المنشورات المطوّرة</h1>
                <p>
                  Infinite scroll + virtualization + smart caching + poll posts + advanced reactions + share/save/pin/report + analytics + edit history + mentions + hashtags.
                </p>
              </div>
              <div className="feed-pro-hero-badges">
                <span className="feed-chip">{isHydratedFromCache ? 'Cache جاهز' : 'Cache مباشر'}</span>
                <span className="feed-chip soft">Pages {cachedPagesCount}</span>
                <span className="feed-chip soft">Posts {formatCompactNumber(posts.length)}</span>
              </div>
            </div>

            <div className="feed-top-controls">
              <div className="feed-chip-row">
                {FILTERS.map((item) => (
                  <button key={item.id} type="button" className={`feed-chip-btn ${filterType === item.id ? 'active' : ''}`} onClick={() => setFilterType(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="feed-chip-row">
                {SORTS.map((item) => (
                  <button key={item.id} type="button" className={`feed-chip-btn ${sortBy === item.id ? 'active alt' : ''}`} onClick={() => setSortBy(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="feed-stats-strip">
              <div className="feed-stat-box"><strong>{formatCompactNumber(stats.totalLikes)}</strong><span>إجمالي الإعجابات</span></div>
              <div className="feed-stat-box"><strong>{formatCompactNumber(stats.totalSaves)}</strong><span>المحفوظات</span></div>
              <div className="feed-stat-box"><strong>{formatCompactNumber(stats.totalShares)}</strong><span>المشاركات</span></div>
              <div className="feed-stat-box"><strong>{formatCompactNumber(stats.pinnedCount)}</strong><span>منشورات مثبتة</span></div>
              <div className="feed-stat-box"><strong>{formatCompactNumber(stats.pollCount)}</strong><span>استطلاعات</span></div>
            </div>

            <PostComposer />

            {isLoading ? <FeedSkeleton count={3} /> : null}
            {isError ? <ErrorState onRetry={refetch} /> : null}
            {!isLoading && !isError && !posts.length ? <EmptyState title="لا توجد منشورات الآن" description="ابدأ بنشر أول منشور في الفيد الجديد." /> : null}

            {!isLoading && !isError && posts.length ? (
              <div className="feed-virtual-shell">
                <VirtualizedInfiniteFeed
                  items={posts}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  estimatedItemHeight={620}
                  renderItem={(post) => <ProFeedPostCard key={post.id} post={post} onRefresh={refetch} />}
                />
              </div>
            ) : null}

            {isFetchingNextPage ? <div className="feed-loading-more">جاري تحميل المزيد من المنشورات...</div> : null}
          </section>

          <aside className="feed-pro-side">
            <div className="feed-side-card">
              <h3>Smart feed caching</h3>
              <ul>
                <li>Hydration من الكاش المحلي لأول صفحات الفيد</li>
                <li>تخزين الصفحات حسب الفلتر والترتيب</li>
                <li>تحديث تلقائي مع React Query</li>
              </ul>
            </div>

            <div className="feed-side-card">
              <h3>المميزات المفعلة</h3>
              <div className="feed-feature-list">
                {['Infinite scroll', 'Feed virtualization', 'Poll posts', 'Advanced reactions', 'Share system', 'Save posts', 'Pin posts', 'Report system', 'Post analytics', 'Edit history', 'Mention system', 'Hashtag system'].map((item) => (
                  <span key={item} className="feed-feature-pill">✓ {item}</span>
                ))}
              </div>
            </div>

            <div className="feed-side-card">
              <h3>الهاشتاجات الرائجة</h3>
              <div className="feed-trending-tags">
                {trendingTags.map((item) => (
                  <div key={item.tag} className="feed-trend-row">
                    <strong>{item.tag}</strong>
                    <span>{formatCompactNumber(item.count || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .feed-pro-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(124, 58, 237, 0.18), transparent 28%),
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 24%),
            linear-gradient(180deg, #020617 0%, #0f172a 100%);
          color: #e2e8f0;
        }
        .feed-pro-shell {
          width: min(1440px, calc(100% - 32px));
          margin: 0 auto;
          padding: 28px 0 40px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 20px;
        }
        .feed-pro-main,
        .feed-side-card,
        .feed-pro-hero,
        .feed-stats-strip {
          border: 1px solid rgba(148,163,184,0.14);
          border-radius: 26px;
          background: rgba(15,23,42,0.72);
          backdrop-filter: blur(14px);
        }
        .feed-pro-main {
          padding: 18px;
        }
        .feed-pro-hero {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .feed-pro-hero h1 {
          margin: 8px 0;
          font-size: clamp(26px, 3vw, 40px);
        }
        .feed-pro-hero p {
          margin: 0;
          color: rgba(226,232,240,0.78);
          line-height: 1.8;
          max-width: 920px;
        }
        .feed-pro-eyebrow {
          color: #c4b5fd;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 12px;
        }
        .feed-pro-hero-badges,
        .feed-chip-row,
        .feed-feature-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .feed-chip,
        .feed-feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(139,92,246,0.16);
          color: #e9d5ff;
          font-weight: 700;
          font-size: 12px;
        }
        .feed-chip.soft {
          background: rgba(148,163,184,0.12);
          color: #cbd5e1;
        }
        .feed-top-controls {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .feed-chip-btn {
          min-height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.84);
          color: #e2e8f0;
          cursor: pointer;
          font-weight: 700;
        }
        .feed-chip-btn.active {
          background: linear-gradient(135deg, rgba(139,92,246,0.32), rgba(59,130,246,0.22));
          border-color: rgba(139,92,246,0.58);
        }
        .feed-chip-btn.active.alt {
          border-color: rgba(56,189,248,0.58);
        }
        .feed-stats-strip {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .feed-stat-box {
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(2,6,23,0.42);
          padding: 14px;
          display: grid;
          gap: 6px;
        }
        .feed-stat-box strong {
          font-size: 22px;
        }
        .feed-stat-box span,
        .feed-side-card li,
        .feed-side-card p {
          color: rgba(226,232,240,0.74);
          line-height: 1.8;
        }
        .feed-virtual-shell {
          margin-top: 12px;
          border-radius: 24px;
          overflow: hidden;
        }
        .feed-loading-more {
          margin-top: 14px;
          text-align: center;
          color: #cbd5e1;
        }
        .feed-pro-side {
          display: grid;
          align-content: start;
          gap: 16px;
          position: sticky;
          top: 20px;
          height: fit-content;
        }
        .feed-side-card {
          padding: 18px;
        }
        .feed-side-card h3 {
          margin: 0 0 12px;
          font-size: 18px;
        }
        .feed-side-card ul {
          margin: 0;
          padding-inline-start: 18px;
        }
        .feed-trending-tags {
          display: grid;
          gap: 10px;
        }
        .feed-trend-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(2,6,23,0.42);
          border: 1px solid rgba(148,163,184,0.14);
        }
        @media (max-width: 1180px) {
          .feed-pro-shell {
            grid-template-columns: minmax(0, 1fr);
          }
          .feed-pro-side {
            position: static;
          }
        }
        @media (max-width: 900px) {
          .feed-stats-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .feed-pro-shell {
            width: min(100%, calc(100% - 20px));
            padding-top: 16px;
          }
          .feed-pro-main {
            padding: 12px;
          }
          .feed-pro-hero {
            padding: 16px;
            flex-direction: column;
          }
        }
      `}</style>
    </MainLayout>
  );
}
