import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { getPosts } from '../api/posts.js';
import { getCurrentUsername } from '../utils/auth.js';
import { getFeedCache, setFeedCache } from '../features/feed/cache.js';
import { dedupePosts } from '../features/feed/deduplication.js';
import { buildFeedProfile } from '../features/feed/personalization.js';
import { rankFeedPosts } from '../features/feed/ranking.js';
import { buildPostRecommendations } from '../features/feed/recommendations.js';
import { buildTrendingHashtags } from '../features/feed/trending.js';
import { serializeFeedCacheKey } from '../features/feed/utils.js';

/**
 * Enhanced Feed Hook with local ranking, persistent page cache,
 * deduplication, personalization, and stable infinite pagination.
 */
export function useFeed(options = {}) {
  const {
    tab,
    filter,
    filterType,
    sort,
    sortBy,
    limit = 10,
    includeDrafts = false,
    pollingInterval = 30_000,
  } = options;

  const currentUsername = getCurrentUsername();
  const effectiveFilter = String(filterType || tab || filter || 'all').trim().toLowerCase();
  const effectiveSort = String(sortBy || sort || (filter === 'latest' ? 'recent' : 'recent')).trim().toLowerCase();
  const pageSize = Math.max(Number(limit) || 10, 1);
  const lastFetchRef = useRef(Date.now());

  const query = useInfiniteQuery({
    queryKey: ['feed-data', effectiveFilter, effectiveSort, pageSize, Boolean(includeDrafts)],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const cacheKey = serializeFeedCacheKey(['feed', effectiveFilter, effectiveSort, pageSize, includeDrafts, pageParam]);
      const freshCachedPage = getFeedCache(cacheKey, { maxAgeMs: pageParam === 1 ? 60_000 : 3 * 60_000 });
      if (freshCachedPage) return freshCachedPage;

      try {
        const response = await getPosts({
          page: pageParam,
          limit: pageSize,
          filterType: effectiveFilter,
          sortBy: effectiveSort,
          include_drafts: includeDrafts,
          cache: false,
          forceRefresh: pageParam === 1,
        });

        const pageData = {
          items: response.data || [],
          meta: response.meta || {},
        };

        setFeedCache(cacheKey, pageData, { ttlMs: pageParam === 1 ? 90_000 : 4 * 60_000 });
        lastFetchRef.current = Date.now();
        return pageData;
      } catch (error) {
        const stalePage = getFeedCache(cacheKey, { allowStale: true, maxAgeMs: 24 * 60 * 60_000 });
        if (stalePage) return stalePage;
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = Boolean(
        lastPage?.meta?.pagination?.has_more
          ?? lastPage?.meta?.has_more
          ?? (Array.isArray(lastPage?.items) && lastPage.items.length === pageSize)
      );
      return hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (queryState) => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false;
      return queryState?.pages?.length === 1 ? pollingInterval : false;
    },
  });

  const rawPosts = useMemo(
    () => query.data?.pages.flatMap((page) => page.items || []) || [],
    [query.data],
  );

  const dedupedPosts = useMemo(() => dedupePosts(rawPosts), [rawPosts]);
  const profile = useMemo(
    () => buildFeedProfile({ posts: dedupedPosts, currentUsername }),
    [currentUsername, dedupedPosts],
  );

  const posts = useMemo(
    () => rankFeedPosts(dedupedPosts, { profile }),
    [dedupedPosts, profile],
  );

  const meta = query.data?.pages?.[0]?.meta || {};
  const trendingTopics = useMemo(() => buildTrendingHashtags(posts, { limit: 10 }), [posts]);
  const recommendations = useMemo(() => buildPostRecommendations(posts, { profile }).slice(0, 8), [posts, profile]);

  return {
    posts,
    rawPosts: dedupedPosts,
    meta,
    profile,
    trendingTopics,
    recommendations,
    ...query,
    lastFetched: lastFetchRef.current,
  };
}
