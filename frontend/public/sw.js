const VERSION = 'yamshat-v20260603-184632-1780512392912';
const CACHE_NAMES = {
  SHELL: `${VERSION}:shell`,
  STATIC: `${VERSION}:static`,
  MEDIA: `${VERSION}:media`,
  API: `${VERSION}:api`,
  OFFLINE: `${VERSION}:offline`,
};

const SHARE_DB_NAME = 'yamshat-pwa-db';
const SHARE_STORE_NAME = 'shared-content';
const SHARE_KEY = 'latest';

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/badge-96.png',
  '/icons/apple-touch-icon.png',
  '/brand/yamshat-logo.png',
];

// قائمة المسارات التي لا يجب تخزينها في الذاكرة المؤقتة
const NO_CACHE_PATHS = [
  '/api/live',
  '/api/stream',
  '/api/socket',
  '/notifications',
  '/realtime',
];

function isRuntimeConfigPath(url) {
  return /^\/(?:app-config\.js|background-sync\.js|sw(?:-enhanced|-fixed)?\.js)$/i.test(url.pathname);
}

function isSignedMedia(url) {
  return /([?&])(sig|signature|token|expires)=/i.test(url.search);
}

function isLiveStreamPath(url) {
  return /\/(api\/)?(?:live|stream|realtime|socket|notifications)/i.test(url.pathname);
}

function isPartialResponse(response) {
  // تجنب تخزين الاستجابات الجزئية (206 Partial Content)
  return response?.status === 206;
}

function normalizeAppTarget(target = '/') {
  const raw = String(target || '/').trim();
  if (!raw) return '/#/';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/#/')) return raw;
  if (raw.startsWith('#/')) return `/${raw}`;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `/#${normalized}`;
}

function emptyResponse(status = 503, statusText = 'Service Unavailable') {
  return new Response(JSON.stringify({ error: 'offline', detail: 'الشبكة غير متاحة' }), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

function openShareDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SHARE_STORE_NAME)) {
        db.createObjectStore(SHARE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSharedPayload(payload) {
  const db = await openShareDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHARE_STORE_NAME, 'readwrite');
    tx.objectStore(SHARE_STORE_NAME).put(payload, SHARE_KEY);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('share tx failed'));
  });
}

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter(Boolean);
    const normalizedFiles = await Promise.all(
      files.map(async (file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name || `shared-${index + 1}`,
        type: file.type || 'application/octet-stream',
        size: Number(file.size || 0),
        blob: file,
      }))
    );

    await saveSharedPayload({
      id: Date.now(),
      receivedAt: new Date().toISOString(),
      title: formData.get('title') || '',
      text: formData.get('text') || '',
      url: formData.get('url') || '',
      files: normalizedFiles,
    });

    return Response.redirect('/#/share-target?shared=1', 303);
  } catch (error) {
    return Response.redirect('/#/share-target?shared=0', 303);
  }
}

/**
 * استراتيجية Stale While Revalidate محسّنة
 * تتجنب تخزين الاستجابات الجزئية والاستجابات غير الناجحة
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const network = fetch(request, { cache: 'no-store' })
    .then(async (response) => {
      // تجنب تخزين الاستجابات الجزئية أو غير الناجحة
      if (response?.status === 200 && !isPartialResponse(response)) {
        try {
          await cache.put(request, response.clone());
        } catch (error) {
          console.warn('Failed to cache response:', error);
        }
      }
      return response;
    })
    .catch((error) => {
      console.warn('Network request failed:', error);
      return null;
    });

  return cached || (await network) || emptyResponse();
}

/**
 * استراتيجية Network First محسّنة
 * تتجنب تخزين الاستجابات الجزئية والاستجابات غير الناجحة
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    
    // تجنب تخزين الاستجابات الجزئية أو غير الناجحة
    if (response?.status === 200 && !isPartialResponse(response)) {
      try {
        await cache.put(request, response.clone());
      } catch (error) {
        console.warn('Failed to cache response:', error);
      }
    }
    
    return response;
  } catch (error) {
    console.warn('Network request failed, falling back to cache:', error);
    const cached = await cache.match(request);
    return cached || emptyResponse();
  }
}

/**
 * استراتيجية Cache First محسّنة
 * تتجنب تخزين الاستجابات الجزئية والاستجابات غير الناجحة
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    
    // تجنب تخزين الاستجابات الجزئية أو غير الناجحة
    if (response?.status === 200 && !isPartialResponse(response)) {
      try {
        await cache.put(request, response.clone());
      } catch (error) {
        console.warn('Failed to cache response:', error);
      }
    }
    
    return response;
  } catch (error) {
    console.warn('Network request failed:', error);
    return emptyResponse();
  }
}

async function broadcastMessage(message) {
  try {
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    clientsList.forEach((client) => {
      try {
        client.postMessage(message);
      } catch (error) {
        console.warn('Failed to post message to client:', error);
      }
    });
  } catch (error) {
    console.warn('Failed to get clients:', error);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.SHELL)
      .then((cache) => {
        return Promise.allSettled(
          APP_SHELL.map(url => cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => !Object.values(CACHE_NAMES).includes(key))
            .map((key) => {
              console.log('Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
      .then(() => broadcastMessage({ type: 'yamshat:sw-activated', version: VERSION }))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // معالجة مشاركة الملفات
  if (request.method === 'POST' && url.origin === self.location.origin && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(request));
    return;
  }

  // تجاهل الطلبات غير GET
  if (request.method !== 'GET') return;

  // معالجة ملفات الإعدادات في الوقت الفعلي
  if (isRuntimeConfigPath(url)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => caches.match(request))
    );
    return;
  }

  // معالجة طلبات التنقل
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(async (response) => {
          const cache = await caches.open(CACHE_NAMES.SHELL);
          try {
            cache.put(request, response.clone()).catch(() => null);
          } catch (error) {
            console.warn('Failed to cache navigation response:', error);
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAMES.SHELL);
          const fallback = (await cache.match(request)) || (await cache.match('/offline.html')) || (await cache.match('/index.html'));
          return fallback || emptyResponse(503, 'Offline');
        })
    );
    return;
  }

  // تجاهل الطلبات من مصادر خارجية
  if (url.origin !== self.location.origin) return;

  // تجنب تخزين مسارات البث المباشر والاتصالات الفورية
  if (isLiveStreamPath(url)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => emptyResponse())
    );
    return;
  }

  // معالجة الملفات الثابتة (JS, CSS, Fonts)
  if (/\.(?:js|css|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.STATIC));
    return;
  }

  // معالجة طلبات API
  if (/\/(api|notifications)\//i.test(url.pathname)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.API));
    return;
  }

  // معالجة الصور
  if (/\.(?:png|jpg|jpeg|svg|webp|gif|avif)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.MEDIA));
    return;
  }

  // معالجة الوسائط (فيديو، صوت)
  if (/\.(?:mp4|webm|mp3|wav|m3u8)$/i.test(url.pathname)) {
    event.respondWith(
      isSignedMedia(url) 
        ? networkFirst(request, CACHE_NAMES.MEDIA) 
        : cacheFirst(request, CACHE_NAMES.MEDIA)
    );
    return;
  }

  // الاستراتيجية الافتراضية
  event.respondWith(networkFirst(request, CACHE_NAMES.OFFLINE));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'yamshat:queue-sync') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now' }));
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts' || event.tag === 'sync-messages' || event.tag === 'sync-notifications' || event.tag === 'offline-sync') {
    event.waitUntil(broadcastMessage({ type: 'yamshat:sync-now' }));
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Yamshat', body: 'لديك تحديث جديد', path: '/' };
  const targetPath = data.path || data.url || '/';
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-512.png',
    badge: data.badge || '/icons/badge-96.png',
    image: data.image,
    tag: data.tag || 'yamshat-push',
    renotify: Boolean(data.renotify),
    vibrate: [120, 60, 120],
    data: {
      path: targetPath,
      url: normalizeAppTarget(targetPath),
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
  const targetUrl = normalizeAppTarget(event.notification.data?.url || event.notification.data?.path || '/');
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
