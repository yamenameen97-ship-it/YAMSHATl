const SCROLL_CACHE_KEY = 'yamshat-scroll-cache-v1';
const prefetchedRoutes = new Set();

const routePrefetchers = {
  '/': () => import('../pages/Feed.jsx'),
  '/dashboard': () => import('../pages/Dashboard.jsx'),
  '/stories': () => import('../pages/Stories.jsx'),
  '/reels': () => import('../pages/Reels.jsx'),
  '/groups': () => import('../pages/Groups.jsx'),
  '/live': () => import('../pages/Live.jsx'),
  '/inbox': () => import('../pages/Inbox.jsx'),
  '/users': () => import('../pages/Users.jsx'),
  '/profile': () => import('../pages/Profile.jsx'),
  '/notifications': () => import('../pages/Notifications.jsx'),
  '/search': () => import('../pages/Search.jsx'),
  '/settings': () => import('../pages/Settings.jsx'),
  '/chat': () => import('../pages/Chat.jsx'),
};

function normalizePath(pathname = '/') {
  if (!pathname) return '/';
  if (pathname.startsWith('/profile/')) return '/profile';
  if (pathname.startsWith('/chat/')) return '/chat';
  return pathname;
}

function readScrollCache() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(SCROLL_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeScrollCache(cache) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SCROLL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

export function saveScrollPosition(pathname, position = 0) {
  if (typeof window === 'undefined') return;
  const key = normalizePath(pathname);
  const cache = readScrollCache();
  cache[key] = Math.max(0, Number(position || 0));
  writeScrollCache(cache);
}

export function getScrollPosition(pathname) {
  const key = normalizePath(pathname);
  const cache = readScrollCache();
  return Math.max(0, Number(cache[key] || 0));
}

export async function prefetchRoute(pathname) {
  const key = normalizePath(pathname);
  if (prefetchedRoutes.has(key)) return;
  const prefetcher = routePrefetchers[key];
  if (!prefetcher) return;
  prefetchedRoutes.add(key);
  try {
    await prefetcher();
  } catch {
    prefetchedRoutes.delete(key);
  }
}

export function prefetchCriticalRoutes(currentPathname = '/') {
  const current = normalizePath(currentPathname);
  const neighbors = {
    '/': ['/reels', '/stories', '/inbox'],
    '/reels': ['/', '/stories', '/live'],
    '/stories': ['/', '/reels', '/profile'],
    '/inbox': ['/chat', '/notifications', '/'],
    '/chat': ['/inbox', '/profile'],
    '/profile': ['/', '/stories'],
  };

  (neighbors[current] || ['/reels', '/stories']).forEach((route) => {
    const idle = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? window.requestIdleCallback(() => prefetchRoute(route), { timeout: 1200 })
      : window.setTimeout(() => prefetchRoute(route), 180);

    return idle;
  });
}

export function getPrefetchHandlers(pathname) {
  return {
    onMouseEnter: () => prefetchRoute(pathname),
    onFocus: () => prefetchRoute(pathname),
    onTouchStart: () => prefetchRoute(pathname),
  };
}

export function isVideoAsset(url = '') {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(url);
}
