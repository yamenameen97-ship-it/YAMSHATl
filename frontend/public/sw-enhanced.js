const VERSION = 'yamshat-v20260525-r4-domain-fix-enhanced';
const STATIC_CACHE = `${VERSION}:static`;
const MEDIA_CACHE = `${VERSION}:media`;
const API_CACHE = `${VERSION}:api`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

function isRuntimeConfigPath(url) {
  return /^\/(?:app-config\.js|background-sync\.js|sw(?:-enhanced)?\.js)$/i.test(url.pathname);
}

async function clearLegacyCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
}

async function precacheAssets() {
  const cache = await caches.open(STATIC_CACHE);
  try {
    await cache.addAll(PRECACHE_URLS);
  } catch (_) {}
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request, { cache: 'no-store' }).then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
    }).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request, { cache: 'no-store' })
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || Response.error());

  return cached || fetchPromise;
}

async function broadcastMessage(message) {
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clientsList.forEach((client) => client.postMessage(message));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAssets().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clearLegacyCaches().then(() => self.clients.claim()).then(() => broadcastMessage({ type: 'yamshat:update-available', version: VERSION })));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isRuntimeConfigPath(url)) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE).catch(() => caches.match('/index.html')));
    return;
  }

  if (/\.(?:js|css|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  if (/\.(?:png|jpg|jpeg|svg|webp|gif|avif|mp4|webm|mp3|wav|m3u8)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  if (/\/(api|notifications|socket\.io)\//i.test(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  if (type === 'yamshat:queue-sync') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now', data }));
  }
  if (type === 'yamshat:clear-cache') {
    event.waitUntil(clearLegacyCaches());
  }
  if (type === 'yamshat:skip-waiting') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts' || event.tag === 'sync-messages' || event.tag === 'sync-notifications') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now', tag: event.tag }));
  }
});
