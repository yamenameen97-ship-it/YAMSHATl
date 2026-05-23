const VERSION = 'yamshat-v20260523-220423-1779573863651';
const STATIC_CACHE = `${VERSION}:static`;
const MEDIA_CACHE = `${VERSION}:media`;
const OFFLINE_FALLBACK_RESPONSE = new Response('Offline', { status: 503, statusText: 'Offline' });
let queuedNotifications = [];

async function clearLegacyCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
}

async function safeCacheMatch(request, fallback = null) {
  const matched = await caches.match(request);
  if (matched) return matched;
  return fallback;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || OFFLINE_FALLBACK_RESPONSE;
  }
}

async function cacheImages(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
    return response || OFFLINE_FALLBACK_RESPONSE;
  } catch {
    return cached || OFFLINE_FALLBACK_RESPONSE;
  }
}

async function broadcastMessage(message) {
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clientsList.forEach((client) => client.postMessage(message));
}

async function flushQueuedNotifications() {
  const batch = queuedNotifications.splice(0);
  if (!batch.length) return;

  const summary = batch[batch.length - 1]?.summary || null;
  if (summary) {
    await self.registration.showNotification(summary.title || 'إشعارات جديدة', {
      body: summary.body || 'لديك تحديثات جديدة.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `yamshat-batch-${Date.now()}`,
      data: { path: summary.path || '/notifications', summary: true },
      renotify: true,
    });
  }

  await broadcastMessage({ type: 'yamshat:notifications-flushed', payload: { count: batch.length } });
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clearLegacyCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(async () => {
        return (await safeCacheMatch('/index.html')) || OFFLINE_FALLBACK_RESPONSE;
      })
    );
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
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => OFFLINE_FALLBACK_RESPONSE));
    return;
  }

  event.respondWith(fetch(request, { cache: 'no-store' }).catch(async () => (await safeCacheMatch(request)) || OFFLINE_FALLBACK_RESPONSE));
});

self.addEventListener('message', (event) => {
  const type = event.data?.type;
  const payload = event.data?.payload || {};

  if (type === 'yamshat:queue-sync') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now' }));
    return;
  }

  if (type === 'yamshat:queue-notification') {
    queuedNotifications.push(payload);
    event.waitUntil(flushQueuedNotifications());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification?.data?.path || '/notifications';
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if ('focus' in client) {
        client.postMessage({ type: 'yamshat:notification-click', payload: { path } });
        await client.focus();
        return;
      }
    }
    if (self.clients.openWindow) {
      await self.clients.openWindow(path);
    }
  })());
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts' || event.tag === 'sync-messages' || event.tag === 'sync-notifications') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now' }));
  }
});
