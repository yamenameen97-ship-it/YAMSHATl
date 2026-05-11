/**
 * Advanced Service Worker - Yamshat PWA
 * Features: Advanced Caching, Offline Sync, Stale-While-Revalidate, Media Cache
 */

const VERSION = 'yamshat-v8';
const CACHE_NAMES = {
  SHELL: `${VERSION}:shell`,
  STATIC: `${VERSION}:static`,
  MEDIA: `${VERSION}:media`,
  API: `${VERSION}:api`,
  OFFLINE: `${VERSION}:offline`
};

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html'
];

// --- Advanced Caching Strategies ---

// Stale-While-Revalidate: Serve from cache, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  return cachedResponse || fetchPromise;
}

// Network-First: Try network, fallback to cache
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || (request.mode === 'navigate' ? caches.match('/offline.html') : null);
  }
}

// Cache-First: Serve from cache, only fetch if missing (good for media/fonts)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return null;
  }
}

async function networkFirstNoStore(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request, { cache: 'no-store' });
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return cache.match(request);
  }
}

// --- Lifecycle Events ---

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.SHELL).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => !Object.values(CACHE_NAMES).includes(key)).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// --- Fetch Event Handling ---

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  if (url.pathname === '/app-config.js') {
    event.respondWith(networkFirstNoStore(request, CACHE_NAMES.STATIC));
    return;
  }

  // 1. Navigation (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_NAMES.SHELL));
    return;
  }

  // 2. Static Assets (JS, CSS, Fonts)
  if (/\.(?:js|css|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.STATIC));
    return;
  }

  // 3. Media Assets (Images, Videos)
  if (/\.(?:png|jpg|jpeg|svg|webp|gif|mp4|webm|mp3|wav)$/i.test(url.pathname) || url.host.includes('imagekit.io')) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.MEDIA));
    return;
  }

  // 4. API Requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE_NAMES.API));
    return;
  }

  // Default: Network first
  event.respondWith(networkFirst(request, CACHE_NAMES.OFFLINE));
});

// --- Offline Sync ---

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncOfflineData('posts'));
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineData('messages'));
  }
});

async function syncOfflineData(type) {
  console.log(`[SW] Syncing offline ${type}...`);
  // Implementation would typically involve reading from IndexedDB and sending to API
  // This is a placeholder for the logic that would be triggered
}

// --- Push Notifications ---

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Yamshat', body: 'New update!' };
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});
