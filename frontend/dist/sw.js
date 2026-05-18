const VERSION = 'yamshat-v20260518-143953-1779115193064';
const CACHE_NAMES = {
  SHELL: `${VERSION}:shell`,
  STATIC: `${VERSION}:static`,
  MEDIA: `${VERSION}:media`,
  API: `${VERSION}:api`,
  OFFLINE: `${VERSION}:offline`,
};

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then(async (response) => {
    if (response?.status === 200) await cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || network;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response?.status === 200) await cache.put(request, response.clone());
    return response;
  } catch {
    return cache.match(request);
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response?.status === 200) await cache.put(request, response.clone());
    return response;
  } catch {
    return null;
  }
}

async function broadcastMessage(message) {
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clientsList.forEach((client) => client.postMessage(message));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.SHELL).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => !Object.values(CACHE_NAMES).includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

function isSignedMedia(url) {
  return /([?&])(sig|signature|token|expires)=/i.test(url.search);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          const cache = await caches.open(CACHE_NAMES.SHELL);
          cache.put(request, response.clone()).catch(() => null);
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAMES.SHELL);
          return cache.match(request) || cache.match('/offline.html') || cache.match('/index.html');
        })
    );
    return;
  }

  if (/\.(?:js|css|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.STATIC));
    return;
  }

  if (/\/(api|notifications)\//i.test(url.pathname)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.API));
    return;
  }

  if (/\.(?:png|jpg|jpeg|svg|webp|gif|avif)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.MEDIA));
    return;
  }

  if (/\.(?:mp4|webm|mp3|wav|m3u8)$/i.test(url.pathname)) {
    event.respondWith(isSignedMedia(url) ? networkFirst(request, CACHE_NAMES.MEDIA) : cacheFirst(request, CACHE_NAMES.MEDIA));
    return;
  }

  event.respondWith(networkFirst(request, CACHE_NAMES.OFFLINE));
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

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Yamshat', body: 'لديك تحديث جديد', url: '/' };
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    image: data.image,
    tag: data.tag || 'yamshat-push',
    renotify: Boolean(data.renotify),
    vibrate: [120, 60, 120],
    data: {
      url: data.url || '/',
      channel: data.channel || 'default',
    },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'mute', title: 'كتم' },
    ],
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Yamshat', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'mute') return;
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => 'focus' in client);
      if (existing) {
        existing.navigate?.(targetUrl);
        return existing.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
