import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts } from '../api/posts.js';
import { useEffect, useRef, useState } from 'react';
import { sortPostsNewestFirst } from '../utils/feedCache.js';
import { getAuthToken } from '../utils/auth.js';

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
    initialData,
  } = options;

  const effectiveFilter = String(filterType || tab || filter || 'all').trim().toLowerCase();
  const effectiveSort = String(sortBy || sort || (filter === 'latest' ? 'recent' : 'recent')).trim().toLowerCase();
  const pageSize = Math.max(Number(limit) || 10, 1);
  const lastFetchRef = useRef(Date.now());

  // ✅ تتبع توفر التوكن: إذا لم يكن موجوداً في المرة الأولى، ننتظر ثم نجلب
  const [authReady, setAuthReady] = useState(() => Boolean(getAuthToken()));
  useEffect(() => {
    if (authReady) return undefined;
    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled) return;
      if (getAuthToken()) {
        setAuthReady(true);
        clearInterval(interval);
      }
    }, 300);
    // حد أقصى 5 ثواني ثم نتوقف عن الانتظار (لو مفيش توكن نجرب الطلب على أي حال)
    const timeout = setTimeout(() => {
      cancelled = true;
      clearInterval(interval);
      setAuthReady(true);
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [authReady]);

  const query = useInfiniteQuery({
    queryKey: ['feed-data', effectiveFilter, effectiveSort, pageSize, Boolean(includeDrafts)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({
        page: pageParam,
        limit: pageSize,
        filterType: effectiveFilter,
        sortBy: effectiveSort,
        includeDrafts,
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
    enabled: authReady,
    // ✅ يجبر إعادة الجلب دائماً عند دخول الصفحة، حتى لو كان هناك كاش
    refetchOnMount: 'always',
    // تقليل staleTime لضمان رؤية المنشورات الجديدة بسرعة
    staleTime: 30 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    initialData,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchInterval: (data) => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false;
      return data?.pages?.length === 1 ? pollingInterval : false;
    },
  });

  const posts = sortPostsNewestFirst(query.data?.pages.flatMap((page) => page.items || []) || []);
  const meta = query.data?.pages?.[0]?.meta || {};

  return {
    posts,
    meta,
    ...query,
    lastFetched: lastFetchRef.current,
  };
}
