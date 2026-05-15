import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts } from '../api/posts.js';
import { useEffect, useRef } from 'react';

/**
 * Advanced Feed Hook with Caching, Polling, and Stale Data Handling
 */
export function useFeed(options = {}) {
  const { 
    tab = 'all', 
    filter = 'latest', 
    limit = 10,
    pollingInterval = 30000 // 30 seconds polling
  } = options;

  const lastFetchRef = useRef(Date.now());

  const query = useInfiniteQuery({
    queryKey: ['feed-data', tab, filter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({ tab, filter, page: pageParam, limit });
      lastFetchRef.current = Date.now();
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === limit ? allPages.length + 1 : undefined;
    },
    // Stale data handling
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    // Polling fallback for real-time updates
    refetchInterval: (data) => {
      // Only poll if on the first page and window is focused
      return (data?.pages?.length === 1 && document.visibilityState === 'visible') ? pollingInterval : false;
    }
  });

  // Handle pagination optimization
  const posts = query.data?.pages.flatMap(page => page) || [];

  return {
    posts,
    ...query,
    lastFetched: lastFetchRef.current
  };
}
