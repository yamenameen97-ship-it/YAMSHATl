import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostCard from '../components/feed/PostCard.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import FeedSkeleton from '../components/feed/FeedSkeleton.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost } from '../api/posts.js';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

const PostItem = ({ index, style, data }) => {
  const { posts, onLike } = data;
  const post = posts[index];
  if (!post) return null;

  return (
    <div style={{ ...style, paddingBottom: '20px' }}>
      <PostCard post={post} onLike={() => onLike(post.id)} />
    </div>
  );
};

export default function Feed() {
  const queryClient = useQueryClient();
  const [isMobile] = useState(typeof window === 'undefined' ? false : window.innerWidth < 768);

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useFeed({ limit: 10 });

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
                ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 }
                : post
            )
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(['feed-data'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
  });

  const handleScroll = ({ visibleStopIndex }) => {
    if (visibleStopIndex >= posts.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const itemSize = isMobile ? 560 : 620;

  const listData = useMemo(() => ({
    posts,
    onLike: (id) => likeMutation.mutate(id)
  }), [posts, likeMutation]);

  return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 10px', height: 'calc(100vh - 70px)' }}>
        <PostComposer />

        <div style={{ marginTop: 20, height: 'calc(100% - 120px)' }}>
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
