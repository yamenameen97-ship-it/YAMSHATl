import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostCard from '../components/feed/PostCard.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import FeedSkeleton from '../components/feed/FeedSkeleton.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { getRecommendedPosts, likePost } from '../api/posts.js';
import logger from '../utils/logger.js';

const FILTER_OPTIONS = [
  { key: 'all', label: 'الكل' },
  { key: 'following', label: 'المتابَعين' },
  { key: 'trending', label: 'الترند' },
];

const SORT_OPTIONS = [
  { key: 'recent', label: 'الأحدث' },
  { key: 'trending', label: 'الأكثر تفاعلاً' },
  { key: 'oldest', label: 'الأقدم' },
];

function countTags(posts = []) {
  const tagMap = new Map();

  posts.forEach((post) => {
    const explicitHashtags = Array.isArray(post?.hashtags) ? post.hashtags : [];
    const textHashtags = Array.from(String(post?.content || '').matchAll(/#([\p{L}\p{N}_-]+)/gu)).map((item) => item[1]);
    [...explicitHashtags, ...textHashtags].forEach((tag) => {
      const normalized = String(tag || '').trim().replace(/^#/, '');
      if (!normalized) return;
      tagMap.set(normalized, Number(tagMap.get(normalized) || 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));
}

function compact(value) {
  return new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

export default function FeedEnhanced() {
  const queryClient = useQueryClient();
  const loadMoreRef = useRef(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const {
    posts,
    meta,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useFeed({
    limit: 10,
    filterType,
    sortBy,
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed-data'] });
      queryClient.setQueriesData({ queryKey: ['feed-data'] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: (page?.items || []).map((post) => (
              post.id === postId
                ? {
                    ...post,
                    is_liked: !post.is_liked,
                    likes_count: Number(post.likes_count || 0) + (post.is_liked ? -1 : 1),
                  }
                : post
            )),
          })),
        };
      });
    },
    onError: (error, postId) => {
      logger.warn('Like failed', { postId, error: error?.message });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
  });

  const { data: recommendedPosts = [], isLoading: recommendedLoading } = useQuery({
    queryKey: ['recommended-feed-sidebar', filterType],
    queryFn: async () => {
      const response = await getRecommendedPosts({ limit: 4, filter_type: filterType });
      const payload = response?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.posts)) return payload.posts;
      return [];
    },
    staleTime: 45_000,
    retry: 1,
  });

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage().catch(() => null);
        }
      },
      { rootMargin: '500px 0px 500px 0px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, posts.length]);

  const trendingTags = useMemo(() => countTags(posts), [posts]);
  const feedStats = useMemo(() => {
    const totalLikes = posts.reduce((sum, post) => sum + Number(post?.likes_count || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + Number(post?.comments_count || 0), 0);
    const totalShares = posts.reduce((sum, post) => sum + Number(post?.share_count || 0), 0);
    const totalViews = posts.reduce((sum, post) => sum + Number(post?.views_count || 0), 0);
    return {
      totalLikes,
      totalComments,
      totalShares,
      totalViews,
    };
  }, [posts]);

  return (
    <MainLayout>
      <div className="feed-shell-enhanced">
        <div className="feed-main-column-enhanced">
          <PostComposer />

          <section className="feed-overview-grid">
            <div className="feed-overview-card primary">
              <span>الفلتر الحالي</span>
              <strong>{FILTER_OPTIONS.find((item) => item.key === filterType)?.label || 'الكل'}</strong>
              <small>{compact(posts.length)} منشور ظاهر حالياً</small>
            </div>
            <div className="feed-overview-card">
              <span>إجمالي التفاعل</span>
              <strong>{compact(feedStats.totalLikes + feedStats.totalComments + feedStats.totalShares)}</strong>
              <small>{compact(feedStats.totalViews)} مشاهدة</small>
            </div>
            <div className="feed-overview-card">
              <span>الرائج الآن</span>
              <strong>{trendingTags[0] ? `#${trendingTags[0].tag}` : 'لا يوجد'}</strong>
              <small>{trendingTags[0] ? `${trendingTags[0].count} تكرار` : 'ابدأ النشر ليظهر الترند'}</small>
            </div>
          </section>

          <section className="feed-toolbar-card">
            <div className="feed-toolbar-block">
              <span className="toolbar-label">نوع الخلاصة</span>
              <div className="toolbar-chip-row">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`toolbar-chip ${filterType === option.key ? 'active' : ''}`}
                    onClick={() => setFilterType(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="feed-toolbar-block">
              <span className="toolbar-label">الترتيب</span>
              <div className="toolbar-chip-row">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`toolbar-chip ${sortBy === option.key ? 'active' : ''}`}
                    onClick={() => setSortBy(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="toolbar-refresh-btn" onClick={() => refetch()}>
              تحديث الخلاصة
            </button>
          </section>

          <section className="feed-feature-note">
            <div>
              <strong>الواجهة دلوقتي بتُظهر مزايا المنشورات المتقدمة</strong>
              <p>
                حفظ، تعديل، حذف، مشاركة، نسخ الرابط، إعادة نشر، هاشتاج، منشن، تثبيت، أرشفة، إخفاء، إبلاغ، كتم المحتوى، التعليقات المتداخلة، وعدّادات المشاهدات والمشاركات والحفظ.
              </p>
            </div>
          </section>

          <section className="feed-posts-list">
            {isLoading ? <FeedSkeleton count={3} /> : null}
            {!isLoading && isError ? <ErrorState onRetry={refetch} /> : null}
            {!isLoading && !isError && posts.length === 0 ? <EmptyState title="لا توجد منشورات حالياً" /> : null}

            {!isLoading && !isError
              ? posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => likeMutation.mutate(post.id)}
                  />
                ))
              : null}

            <div ref={loadMoreRef} className="feed-loadmore-sentinel" aria-hidden="true" />

            {isFetchingNextPage ? (
              <div className="feed-loading-more-card">
                <div className="spinner-small" />
                <span>جاري تحميل المزيد من المنشورات…</span>
              </div>
            ) : null}

            {!isLoading && hasNextPage ? (
              <button type="button" className="manual-loadmore-btn" onClick={() => fetchNextPage()}>
                تحميل المزيد
              </button>
            ) : null}
          </section>
        </div>

        <aside className="feed-sidebar-enhanced">
          <section className="sidebar-card-enhanced">
            <div className="sidebar-card-head">
              <h3>الترند والهاشتاجات</h3>
              <span>{trendingTags.length} عناصر</span>
            </div>
            <div className="trending-chip-list">
              {trendingTags.length ? trendingTags.map((item) => (
                <button key={item.tag} type="button" className="trending-chip">
                  #{item.tag}
                  <small>{item.count}</small>
                </button>
              )) : <div className="sidebar-empty">سيظهر الترند بعد تحميل منشورات تحتوي على هاشتاجات.</div>}
            </div>
          </section>

          <section className="sidebar-card-enhanced">
            <div className="sidebar-card-head">
              <h3>خلاصة موصى بها</h3>
              <span>{recommendedPosts.length}</span>
            </div>
            <div className="recommended-list">
              {recommendedLoading ? <div className="sidebar-empty">جاري تحميل التوصيات…</div> : null}
              {!recommendedLoading && recommendedPosts.length === 0 ? <div className="sidebar-empty">لا توجد توصيات متاحة حالياً.</div> : null}
              {recommendedPosts.map((post) => (
                <div key={`recommended-${post.id}`} className="recommended-item-card">
                  <strong>@{post.username || 'user'}</strong>
                  <p>{String(post.content || 'منشور موصى به').slice(0, 110)}</p>
                  <div className="recommended-item-stats">
                    <span>❤️ {compact(post.likes_count)}</span>
                    <span>💬 {compact(post.comments_count)}</span>
                    <span>🔖 {compact(post.saved_count)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sidebar-card-enhanced compact-stats">
            <div className="sidebar-card-head">
              <h3>مؤشرات الخلاصة</h3>
              <span>{compact(meta?.pagination?.page || 1)}</span>
            </div>
            <div className="compact-metric-grid">
              <div>
                <span>الإعجابات</span>
                <strong>{compact(feedStats.totalLikes)}</strong>
              </div>
              <div>
                <span>التعليقات</span>
                <strong>{compact(feedStats.totalComments)}</strong>
              </div>
              <div>
                <span>المشاركات</span>
                <strong>{compact(feedStats.totalShares)}</strong>
              </div>
              <div>
                <span>المشاهدات</span>
                <strong>{compact(feedStats.totalViews)}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .feed-shell-enhanced {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px 14px 36px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 20px;
          align-items: start;
        }
        .feed-main-column-enhanced {
          display: grid;
          gap: 18px;
          min-width: 0;
        }
        .feed-sidebar-enhanced {
          display: grid;
          gap: 16px;
          position: sticky;
          top: 84px;
        }
        .feed-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .feed-overview-card,
        .feed-toolbar-card,
        .feed-feature-note,
        .sidebar-card-enhanced,
        .feed-loading-more-card {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(10px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }
        .feed-overview-card {
          padding: 16px;
          display: grid;
          gap: 8px;
        }
        .feed-overview-card.primary {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.24), rgba(139, 92, 246, 0.22));
          border-color: rgba(96, 165, 250, 0.28);
        }
        .feed-overview-card span,
        .toolbar-label,
        .recommended-item-stats,
        .sidebar-empty,
        .feed-feature-note p,
        .compact-metric-grid span {
          color: rgba(226, 232, 240, 0.75);
          font-size: 13px;
        }
        .feed-overview-card strong {
          font-size: 21px;
        }
        .feed-overview-card small {
          color: rgba(191, 219, 254, 0.92);
        }
        .feed-toolbar-card {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .feed-toolbar-block {
          display: grid;
          gap: 10px;
        }
        .toolbar-chip-row,
        .trending-chip-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .toolbar-chip,
        .trending-chip,
        .manual-loadmore-btn,
        .toolbar-refresh-btn {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(30, 41, 59, 0.85);
          color: #e2e8f0;
          border-radius: 999px;
          cursor: pointer;
          transition: 0.2s ease;
        }
        .toolbar-chip,
        .trending-chip {
          padding: 9px 14px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .toolbar-chip.active {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-color: transparent;
          color: #fff;
        }
        .toolbar-refresh-btn,
        .manual-loadmore-btn {
          padding: 11px 16px;
          font-weight: 700;
        }
        .toolbar-chip:hover,
        .trending-chip:hover,
        .manual-loadmore-btn:hover,
        .toolbar-refresh-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.45);
        }
        .feed-feature-note {
          padding: 16px 18px;
        }
        .feed-feature-note strong {
          display: block;
          margin-bottom: 6px;
        }
        .feed-feature-note p {
          margin: 0;
          line-height: 1.8;
        }
        .feed-posts-list {
          display: grid;
          gap: 16px;
        }
        .feed-loadmore-sentinel {
          width: 100%;
          height: 1px;
        }
        .feed-loading-more-card {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.18);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .sidebar-card-enhanced {
          padding: 16px;
          display: grid;
          gap: 14px;
        }
        .sidebar-card-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .sidebar-card-head h3 {
          margin: 0;
          font-size: 16px;
        }
        .recommended-list {
          display: grid;
          gap: 12px;
        }
        .recommended-item-card {
          border-radius: 16px;
          padding: 14px;
          background: rgba(30, 41, 59, 0.74);
          border: 1px solid rgba(148, 163, 184, 0.12);
          display: grid;
          gap: 8px;
        }
        .recommended-item-card p {
          margin: 0;
          line-height: 1.7;
          font-size: 13px;
          color: rgba(226, 232, 240, 0.86);
        }
        .recommended-item-stats {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .trending-chip small {
          color: #93c5fd;
        }
        .compact-metric-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .compact-metric-grid div {
          border-radius: 16px;
          padding: 14px;
          background: rgba(30, 41, 59, 0.72);
          border: 1px solid rgba(148, 163, 184, 0.12);
          display: grid;
          gap: 8px;
        }
        .compact-metric-grid strong {
          font-size: 18px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1080px) {
          .feed-shell-enhanced {
            grid-template-columns: minmax(0, 1fr);
          }
          .feed-sidebar-enhanced {
            position: static;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }
        }
        @media (max-width: 720px) {
          .feed-shell-enhanced {
            padding-inline: 10px;
          }
          .feed-overview-grid {
            grid-template-columns: 1fr;
          }
          .feed-toolbar-card {
            align-items: stretch;
          }
          .toolbar-refresh-btn,
          .manual-loadmore-btn {
            width: 100%;
          }
          .feed-sidebar-enhanced {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </MainLayout>
  );
}
