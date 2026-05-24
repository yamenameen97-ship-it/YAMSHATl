import FeedErrorState from './FeedErrorState.jsx';
import FeedSkeleton from './FeedSkeleton.jsx';
import EmptyFeedState from './EmptyFeedState.jsx';
import { useFeed } from '../../hooks/useFeed.js';
import useInfiniteScroll from '../../hooks/feed/useInfiniteScroll.js';

function DefaultPostRenderer({ post }) {
  return (
    <article
      key={post.id}
      className="feed-basic-card"
      style={{
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(148,163,184,0.12)',
        background: 'rgba(15,23,42,0.62)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <strong>{post.username || 'مستخدم'}</strong>
        <span style={{ opacity: 0.7, fontSize: 12 }}>Score {Math.round(post.feed_score || 0)}</span>
      </div>
      <div style={{ lineHeight: 1.8 }}>{post.content || post.description || 'بدون محتوى نصي'}</div>
      {post.ranking_reason ? <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>{post.ranking_reason}</div> : null}
    </article>
  );
}

export default function InfiniteFeed({
  renderPost,
  limit = 10,
  pollingInterval = 25_000,
  emptyTitle = 'لا توجد منشورات حتى الآن',
}) {
  const {
    posts,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed({ limit, pollingInterval });

  const loadMoreRef = useInfiniteScroll({
    hasMore: hasNextPage,
    isLoading: isLoading || isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  if (isLoading && !posts.length) return <FeedSkeleton count={3} />;
  if (isError && !posts.length) return <FeedErrorState onRetry={refetch} />;
  if (!posts.length) return <EmptyFeedState title={emptyTitle} />;

  return (
    <div>
      {posts.map((post) => (
        renderPost ? renderPost(post) : <DefaultPostRenderer key={post.id} post={post} />
      ))}
      <div ref={loadMoreRef} style={{ height: 4 }} />
      {isFetchingNextPage ? <FeedSkeleton count={1} /> : null}
    </div>
  );
}
