import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts } from '../api/posts.js';
import { useRef } from 'react';

/**
 * Advanced Feed Hook with backend-aware filtering, sorting, and pagination.
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
    pollingInterval = 30000,
  } = options;

  const effectiveFilter = String(filterType || tab || filter || 'all').trim().toLowerCase();
  const effectiveSort = String(sortBy || sort || (filter === 'latest' ? 'recent' : 'recent')).trim().toLowerCase();
  const pageSize = Math.max(Number(limit) || 10, 1);
  const lastFetchRef = useRef(Date.now());

  const query = useInfiniteQuery({
    queryKey: ['feed-data', effectiveFilter, effectiveSort, pageSize, Boolean(includeDrafts)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({
        page: pageParam,
        limit: pageSize,
        filterType: effectiveFilter,
        sortBy: effectiveSort,
        include_drafts: includeDrafts,
      });
      lastFetchRef.current = Date.now();
      return {
        items: response.data || [],
        meta: response.meta || {},
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = Boolean(
        lastPage?.meta?.pagination?.has_more
          ?? lastPage?.meta?.has_more
          ?? (Array.isArray(lastPage?.items) && lastPage.items.length === pageSize)
      );
      return hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: (data) => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false;
      return data?.pages?.length === 1 ? pollingInterval : false;
    },
  });

  const posts = query.data?.pages.flatMap((page) => page.items || []) || [];
  const meta = query.data?.pages?.[0]?.meta || {};

  return {
    posts,
    meta,
    ...query,
    lastFetched: lastFetchRef.current,
  };
}
