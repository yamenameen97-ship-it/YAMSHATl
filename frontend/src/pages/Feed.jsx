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

const MOBILE_CARD_ESTIMATE = 560;
const DESKTOP_CARD_ESTIMATE = 620;

export default function Feed() {
  const queryClient = useQueryClient();
  const observerTarget = useRef(null);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const [viewportState, setViewportState] = useState({
    isMobile: typeof window === 'undefined' ? false : window.innerWidth < 768,
    scrollTop: 0,
    viewportHeight: typeof window === 'undefined' ? 800 : window.innerHeight,
  });

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useFeed({ limit: 10 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '220px' }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  useEffect(() => {
    const rootNode = rootRef.current;
    const scrollContainer = rootNode?.closest('.page-content') || window;

    const updateViewport = () => {
      const nextScrollTop = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
      const nextViewportHeight = scrollContainer === window ? window.innerHeight : scrollContainer.clientHeight;
      setViewportState({
        isMobile: window.innerWidth < 768,
        scrollTop: nextScrollTop,
        viewportHeight: nextViewportHeight,
      });
    };

    updateViewport();
    scrollContainer.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

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

  const estimateHeight = viewportState.isMobile ? MOBILE_CARD_ESTIMATE : DESKTOP_CARD_ESTIMATE;
  const shouldVirtualize = viewportState.isMobile && posts.length > 8;

  const virtualization = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        endIndex: posts.length,
        topSpacer: 0,
        bottomSpacer: 0,
        items: posts,
      };
    }

    const listOffsetTop = listRef.current?.offsetTop || 0;
    const relativeScrollTop = Math.max(0, viewportState.scrollTop - listOffsetTop + 80);
    const startIndex = Math.max(0, Math.floor(relativeScrollTop / estimateHeight) - 2);
    const endIndex = Math.min(
      posts.length,
      Math.ceil((relativeScrollTop + viewportState.viewportHeight) / estimateHeight) + 3,
    );

    return {
      startIndex,
      endIndex,
      topSpacer: startIndex * estimateHeight,
      bottomSpacer: Math.max(0, (posts.length - endIndex) * estimateHeight),
      items: posts.slice(startIndex, endIndex),
    };
  }, [estimateHeight, posts, shouldVirtualize, viewportState.scrollTop, viewportState.viewportHeight]);

  const renderedPosts = useMemo(() => {
    return virtualization.items.map((post, index) => {
      const actualIndex = virtualization.startIndex + index;
      return (
        <div
          key={post.id}
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: `${estimateHeight}px`,
            willChange: 'transform',
          }}
          data-post-index={actualIndex}
        >
          <PostCard post={post} onLike={() => likeMutation.mutate(post.id)} />
        </div>
      );
    });
  }, [estimateHeight, likeMutation, virtualization.items, virtualization.startIndex]);

  return (
    <MainLayout>
      <div ref={rootRef} style={{ maxWidth: 700, margin: '0 auto', padding: '20px 10px' }}>
        <PostComposer />

        {isLoading && !isFetchingNextPage ? (
          <FeedSkeleton count={3} />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : posts.length === 0 ? (
          <EmptyState title="لا توجد منشورات حالياً" />
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="feed-info-chip">lazy loading</span>
              <span className="feed-info-chip">re-render أقل</span>
              <span className="feed-info-chip">{shouldVirtualize ? 'mobile virtualization on' : 'desktop full render'}</span>
            </div>

            <div ref={listRef} style={{ display: 'grid', gap: 20 }}>
              {virtualization.topSpacer > 0 ? <div aria-hidden="true" style={{ height: virtualization.topSpacer }} /> : null}
              {renderedPosts}
              {virtualization.bottomSpacer > 0 ? <div aria-hidden="true" style={{ height: virtualization.bottomSpacer }} /> : null}

              <div ref={observerTarget} style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isFetchingNextPage && <div className="spinner-small" />}
                {!hasNextPage && posts.length > 0 && <p className="muted" style={{ fontSize: 13 }}>لقد وصلت إلى نهاية المنشورات</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .feed-info-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.14);
          font-size: 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .muted { color: var(--text-muted); }
      `}</style>
    </MainLayout>
  );
}
