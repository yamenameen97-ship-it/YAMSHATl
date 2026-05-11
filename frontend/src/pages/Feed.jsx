import { useEffect, useRef, useMemo } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import PostCard from '../components/feed/PostCard.jsx';
import PostComposer from '../components/feed/PostComposer.jsx';
import FeedSkeleton from '../components/feed/FeedSkeleton.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useFeed } from '../hooks/useFeed.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost } from '../api/posts.js';

export default function Feed() {
  const queryClient = useQueryClient();
  const observerTarget = useRef(null);
  
  const { 
    posts, 
    isLoading, 
    isError, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage, 
    refetch 
  } = useFeed({ limit: 10 });

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // Preload before reaching bottom
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Optimistic Like Mutation
  const likeMutation = useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries(['feed-data']);
      const previousData = queryClient.getQueryData(['feed-data']);
      
      queryClient.setQueryData(['feed-data'], old => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => 
            page.map(post => 
              post.id === postId 
                ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 } 
                : post
            )
          )
        };
      });
      return { previousData };
    },
    onError: (err, postId, context) => {
      queryClient.setQueryData(['feed-data'], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['feed-data']);
    }
  });

  // Memoized posts to prevent unnecessary re-renders
  const renderedPosts = useMemo(() => {
    return posts.map(post => (
      <PostCard 
        key={post.id} 
        post={post} 
        onLike={() => likeMutation.mutate(post.id)}
      />
    ));
  }, [posts, likeMutation]);

  return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 10px' }}>
        
        {/* Composer */}
        <PostComposer />

        {/* Feed Content */}
        {isLoading && !isFetchingNextPage ? (
          <FeedSkeleton count={3} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : posts.length === 0 ? (
          <EmptyState title="لا توجد منشورات حالياً" />
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {renderedPosts}
            
            {/* Infinite Scroll Sentinel */}
            <div ref={observerTarget} style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isFetchingNextPage && <div className="spinner-small"></div>}
              {!hasNextPage && posts.length > 0 && <p className="muted" style={{ fontSize: 13 }}>لقد وصلت إلى نهاية المنشورات</p>}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .spinner-small { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .muted { color: var(--text-muted); }
      `}</style>
    </MainLayout>
  );
}
