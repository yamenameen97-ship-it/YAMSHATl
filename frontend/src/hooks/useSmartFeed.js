import { useEffect, useMemo } from 'react';
import { useFeed } from './useFeed.js';

const FEED_CACHE_PREFIX = 'yamshat:feed:cache:v2';
const CACHE_TTL_MS = 10 * 60 * 1000;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildCacheKey({ filterType = 'all', sortBy = 'recent', limit = 12 }) {
  return `${FEED_CACHE_PREFIX}:${filterType}:${sortBy}:${limit}`;
}

function loadCachedFeed(key) {
  if (typeof window === 'undefined') return null;
  const parsed = safeParse(window.localStorage.getItem(key) || 'null');
  if (!parsed?.timestamp || !parsed?.data) return null;
  if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
  return parsed.data;
}

function persistCachedFeed(key, data) {
  if (typeof window === 'undefined' || !data?.pages?.length) return;
  const payload = {
    timestamp: Date.now(),
    data: {
      pages: data.pages.map((page) => ({
        items: Array.isArray(page?.items) ? page.items.slice(0, 24) : [],
        meta: page?.meta || {},
      })),
      pageParams: Array.isArray(data.pageParams) ? data.pageParams : [1],
    },
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function useSmartFeed(options = {}) {
  const {
    filterType = 'all',
    sortBy = 'recent',
    limit = 12,
    ...rest
  } = options;

  const cacheKey = useMemo(
    () => buildCacheKey({ filterType, sortBy, limit }),
    [filterType, sortBy, limit],
  );

  const initialData = useMemo(() => loadCachedFeed(cacheKey), [cacheKey]);

  const feed = useFeed({
    ...rest,
    filterType,
    sortBy,
    limit,
    initialData,
  });

  useEffect(() => {
    if (feed.data?.pages?.length) persistCachedFeed(cacheKey, feed.data);
  }, [cacheKey, feed.data]);

  return {
    ...feed,
    cacheKey,
    isHydratedFromCache: Boolean(initialData?.pages?.length),
  };
}

export default useSmartFeed;
