const VERSION = 'yamshat-v20260519-035705-1779163025708';
const STATIC_CACHE = `${VERSION}:static`;
const MEDIA_CACHE = `${VERSION}:media`;

async function clearLegacyCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
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
    return cache.match(request);
  }
}

async function cacheImages(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || Response.error();
  }
}

async function broadcastMessage(message) {
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clientsList.forEach((client) => client.postMessage(message));
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearLegacyCaches().then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match('/index.html')));
    return;
  }

  if (/\.(?:js|css|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  if (/\.(?:png|jpg|jpeg|svg|webp|gif|avif|mp4|webm|mp3|wav|m3u8)$/i.test(url.pathname)) {
    event.respondWith(cacheImages(request));
    return;
  }

  if (/\/(api|notifications)\//i.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => Response.error()));
    return;
  }

  event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match(request)));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'yamshat:queue-sync') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now' }));
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts' || event.tag === 'sync-messages' || event.tag === 'sync-notifications') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now' }));
  }
});
