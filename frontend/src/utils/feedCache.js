const FEED_CACHE_PREFIX = 'yamshat:feed:cache:';

function toTimestamp(post = {}) {
  const rawValue = post?.published_at || post?.created_at || post?.updated_at || 0;
  const parsed = new Date(rawValue).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortPostsNewestFirst(posts = []) {
  const seen = new Set();
  return [...posts]
    .filter(Boolean)
    .sort((left, right) => {
      const timeDelta = toTimestamp(right) - toTimestamp(left);
      if (timeDelta !== 0) return timeDelta;
      return Number(right?.id || 0) - Number(left?.id || 0);
    })
    .filter((post) => {
      const key = String(post?.id ?? `${post?.published_at || post?.created_at || ''}:${post?.content || ''}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function clearLocalFeedCaches() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(FEED_CACHE_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key));
}

export function injectPostIntoFeedCache(queryClient, post) {
  if (!queryClient || !post) return;

  queryClient.setQueriesData({ queryKey: ['feed-data'] }, (current) => {
    if (!current?.pages?.length) return current;
    return {
      ...current,
      pages: current.pages.map((page, index) => {
        if (index !== 0) return page;
        return {
          ...page,
          items: sortPostsNewestFirst([post, ...(Array.isArray(page?.items) ? page.items : [])]),
        };
      }),
    };
  });

  clearLocalFeedCaches();
}
