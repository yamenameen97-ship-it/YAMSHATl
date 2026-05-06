const VERSION = 'yamshat-shell-v4';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/admin.html', '/admin/', '/admin/login/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

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
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === 'navigate';
  const isStaticAsset = /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/i.test(requestUrl.pathname);

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(VERSION).then((cache) => cache.put('/index.html', cloned)).catch(() => null);
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(VERSION);
          return (await cache.match('/index.html')) || (await cache.match('/'));
        })
    );
    return;
  }

  if (isSameOrigin && isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            const cloned = response.clone();
            caches.open(VERSION).then((cache) => cache.put(event.request, cloned)).catch(() => null);
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
