import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostCard from '../components/feed/PostCard.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import FeedSkeleton from '../components/feed/FeedSkeleton.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, deletePost } from '../api/posts.js';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import logger from '../utils/logger.js';

/**
 * FeedEnhanced Component
 * 
 * تحسينات على صفحة Feed:
 * - تحسين الأداء مع Virtual Scrolling
 * - تحسين تجربة المستخدم
 * - معالجة أفضل للأخطاء
 * - دعم الفلترة والبحث
 * - تحسين استجابة الهاتف
 */

const PostItem = ({ index, style, data }) => {
  const { posts, onLike, onDelete } = data;
  const post = posts[index];
  if (!post) return null;

  return (
    <div style={{ ...style, paddingBottom: '20px' }}>
      <PostCard 
        post={post} 
        onLike={() => onLike(post.id)}
        onDelete={() => onDelete(post.id)}
      />
    </div>
  );
};

export default function FeedEnhanced() {
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(typeof window === 'undefined' ? false : window.innerWidth < 768);
  const [filterType, setFilterType] = useState('all'); // all, following, trending
  const [sortBy, setSortBy] = useState('recent'); // recent, trending, oldest
  const listRef = useRef(null);
  const observerRef = useRef(null);

  // معالجة تغيير حجم النافذة
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    posts,
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

  // Mutation لـ Like
  const likeMutation = useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed-data'] });
      const previousData = queryClient.getQueryData(['feed-data']);

      queryClient.setQueryData(['feed-data'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((post) =>
              post.id === postId
                ? { 
                    ...post, 
                    is_liked: !post.is_liked, 
                    likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 
                  }
                : post
            )
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(['feed-data'], context?.previousData);
      logger.warn('Like failed', { postId: _postId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
  });

  // Mutation لـ Delete
  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed-data'] });
      const previousData = queryClient.getQueryData(['feed-data']);

      queryClient.setQueryData(['feed-data'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.filter((post) => post.id !== postId)
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(['feed-data'], context?.previousData);
      logger.warn('Delete failed', { postId: _postId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
  });

  // معالج التمرير
  const handleScroll = useCallback(({ visibleStopIndex }) => {
    if (visibleStopIndex >= posts.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [posts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const itemSize = isMobile ? 560 : 620;

  const listData = useMemo(() => ({
    posts,
    onLike: (id) => likeMutation.mutate(id),
    onDelete: (id) => deleteMutation.mutate(id),
  }), [posts, likeMutation, deleteMutation]);

  return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 10px', height: 'calc(100vh - 70px)' }}>
        <PostComposer />

        {/* خيارات الفلترة والترتيب */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '20px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'var(--bg-card)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <option value="all">الكل</option>
            <option value="following">المتابعون</option>
            <option value="trending">الأكثر تفاعلاً</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'var(--bg-card)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <option value="recent">الأحدث</option>
            <option value="trending">الأكثر تفاعلاً</option>
            <option value="oldest">الأقدم</option>
          </select>

          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--primary)',
              background: 'transparent',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            تحديث
          </button>
        </div>

        <div style={{ marginTop: 20, height: 'calc(100% - 200px)' }}>
          {isLoading && !isFetchingNextPage ? (
            <FeedSkeleton count={3} />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : posts.length === 0 ? (
            <EmptyState title="لا توجد منشورات حالياً" />
          ) : (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  width={width}
                  itemCount={posts.length}
                  itemSize={itemSize}
                  onItemsRendered={handleScroll}
                  itemData={listData}
                  className="no-scrollbar"
                >
                  {PostItem}
                </List>
              )}
            </AutoSizer>
          )}
          
          {isFetchingNextPage && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div className="spinner-small" />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </MainLayout>
  );
}
