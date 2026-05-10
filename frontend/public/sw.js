
const VERSION = 'yamshat-shell-v6';
const SHELL_CACHE = `${VERSION}:shell`;
const STATIC_CACHE = `${VERSION}:static`;
const MEDIA_CACHE = `${VERSION}:media`;
const API_CACHE = `${VERSION}:api`;
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/admin.html', '/admin/', '/admin/login/', '/app-config.js'];
const API_CACHE_ALLOWLIST = ['/api/posts', '/api/notifications', '/api/admin/overview', '/api/users/profile'];

// Import background sync logic
importScripts('/background-sync.js');

function shouldCacheApi(requestUrl) {
  return API_CACHE_ALLOWLIST.some((item) => requestUrl.pathname.startsWith(item));
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone()).catch(() => null);
      return response;
    })
    .catch(() => cached);
  return cached || networkFetch;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => null);
    return response;
  } catch {
    return cache.match(request);
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

async function notifyClients(type) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  await Promise.all(clients.map((client) => client.postMessage({ type })));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ![SHELL_CACHE, STATIC_CACHE, MEDIA_CACHE, API_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'yamshat:queue-sync') {
    event.waitUntil(notifyClients('yamshat:sync-now'));
  }
});

// Background Sync event listener - now handled by background-sync.js
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'yamshat-background-sync') {
//     event.waitUntil(notifyClients('yamshat:sync-now'));
//   }
// });

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload?.title || 'Yamshat';
  const body = payload?.body || payload?.message || 'وصلك تحديث جديد.';
  const path = payload?.path || payload?.data?.path || '/notifications';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `yamshat:push:${payload?.id || Date.now()}`,
      data: { path },
      // Add renotify and requireInteraction for better reliability
      renotify: true,
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = event.notification?.data?.path || '/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const matched = clients.find((client) => 'focus' in client);
      if (matched) {
        matched.focus();
        if ('navigate' in matched) return matched.navigate(targetPath);
        return matched;
      }
      return self.clients.openWindow(targetPath);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    // For non-GET requests, if offline, store in IndexedDB for background sync
    if (!navigator.onLine) {
      event.waitUntil(storeRequest(event.request.clone()));
    }
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === 'navigate';
  const isStaticAsset = /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/i.test(requestUrl.pathname);
  const isMedia = /\.(?:mp4|webm|mov|m4v)$/i.test(requestUrl.pathname);
  const isApiRequest = requestUrl.pathname.startsWith('/api/');

  if (isNavigation) {
    event.respondWith(
      networkFirst(event.request, SHELL_CACHE).then(async (response) => {
        if (response) return response;
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('/index.html')) || (await cache.match('/'));
      })
    );
    return;
  }

  if ((isSameOrigin && isStaticAsset) || requestUrl.pathname === '/app-config.js') {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
    return;
  }

  if (isMedia || /imagekit\.io|cloudinary\.com/i.test(requestUrl.host)) {
    event.respondWith(staleWhileRevalidate(event.request, MEDIA_CACHE));
    return;
  }

  if (isSameOrigin && isApiRequest && shouldCacheApi(requestUrl)) {
    // Use networkFirst for API requests to ensure fresh data, but fallback to cache
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // For other requests, try network first, then cache (advanced offline cache)
  event.respondWith(networkFirst(event.request, 'fallback-cache'));
});
