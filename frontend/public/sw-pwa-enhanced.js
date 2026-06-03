/**
 * Service Worker محسّن لـ PWA
 * (Enhanced PWA Service Worker)
 * 
 * المميزات:
 * - دعم جميع المتصفحات والأجهزة القديمة
 * - تخزين مؤقت ذكي للملفات
 * - دعم العمل بلا اتصال
 * - تحديثات تلقائية
 * - دعم الإشعارات
 */

const VERSION = '1.0.0-pwa-enhanced';
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
  '/icons/apple-touch-icon.png',
];

const STATIC_ASSETS = [
  '/app-config.js',
  '/background-sync.js',
];

/**
 * حدث التثبيت
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...', VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // تخزين مؤقت لـ App Shell
        const shellCache = await caches.open(CACHE_NAMES.SHELL);
        await shellCache.addAll(APP_SHELL);
        
        // تخزين مؤقت للموارد الثابتة
        const staticCache = await caches.open(CACHE_NAMES.STATIC);
        await staticCache.addAll(STATIC_ASSETS);
        
        console.log('[SW] Installation completed');
        self.skipWaiting(); // تفعيل الـ Service Worker الجديد فوراً
      } catch (error) {
        console.error('[SW] Installation error:', error);
      }
    })()
  );
});

/**
 * حدث التفعيل
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...', VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        // حذف الـ Caches القديمة
        const cacheNames = await caches.keys();
        const cachesToDelete = cacheNames.filter((name) => {
          return !Object.values(CACHE_NAMES).includes(name);
        });
        
        await Promise.all(
          cachesToDelete.map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
        );
        
        console.log('[SW] Activation completed');
        self.clients.claim(); // السيطرة على جميع الـ Clients
      } catch (error) {
        console.error('[SW] Activation error:', error);
      }
    })()
  );
});

/**
 * حدث الجلب (Fetch)
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل الطلبات غير الـ HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // معالجة الطلبات المختلفة بناءً على نوعها
  if (request.method === 'GET') {
    // معالجة طلبات الملفات الثابتة
    if (isStaticAsset(url)) {
      event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.STATIC));
    }
    // معالجة طلبات الصور والفيديو
    else if (isMediaAsset(url)) {
      event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.MEDIA));
    }
    // معالجة طلبات API
    else if (isApiRequest(url)) {
      event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API));
    }
    // معالجة طلبات HTML
    else if (isHtmlRequest(request)) {
      event.respondWith(networkFirstStrategy(request, CACHE_NAMES.SHELL));
    }
    // معالجة الطلبات الأخرى
    else {
      event.respondWith(networkFirstStrategy(request, CACHE_NAMES.STATIC));
    }
  }
});

/**
 * استراتيجية Cache First (استخدام الـ Cache أولاً)
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // البحث في الـ Cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // إذا لم يكن في الـ Cache، جلب من الشبكة
    const response = await fetch(request);
    
    // حفظ في الـ Cache إذا كان الرد ناجحاً
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Cache first error:', error);
    
    // محاولة إرجاع نسخة مخزنة مؤقتاً
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // إذا لم تكن هناك نسخة مخزنة، إرجاع صفحة offline
    return caches.match('/offline.html');
  }
}

/**
 * استراتيجية Network First (استخدام الشبكة أولاً)
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // محاولة الجلب من الشبكة
    const response = await fetch(request);
    
    // حفظ في الـ Cache إذا كان الرد ناجحاً
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Network first error:', error);
    
    // إذا فشلت الشبكة، البحث في الـ Cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // إذا لم تكن هناك نسخة مخزنة، إرجاع صفحة offline
    if (isHtmlRequest(request)) {
      return caches.match('/offline.html');
    }

    // إرجاع رد فارغ للطلبات الأخرى
    return new Response('Offline', { status: 503 });
  }
}

/**
 * التحقق من أن الطلب هو لملف ثابت
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * التحقق من أن الطلب هو لملف وسائط
 */
function isMediaAsset(url) {
  const mediaExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mp3', '.wav'];
  return mediaExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * التحقق من أن الطلب هو لـ API
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/graphql');
}

/**
 * التحقق من أن الطلب هو لـ HTML
 */
function isHtmlRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

/**
 * معالجة الرسائل من الـ Client
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CLEAR_CACHE') {
    clearAllCaches();
  } else if (type === 'CACHE_URLS') {
    cacheUrls(data);
  }
});

/**
 * حذف جميع الـ Caches
 */
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => caches.delete(name))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Error clearing caches:', error);
  }
}

/**
 * تخزين مؤقت لعناوين URL محددة
 */
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_NAMES.STATIC);
    await cache.addAll(urls);
    console.log('[SW] URLs cached:', urls);
  } catch (error) {
    console.error('[SW] Error caching URLs:', error);
  }
}

/**
 * معالجة الإشعارات
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'إشعار جديد',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || 'notification',
    requireInteraction: false,
    ...data.options,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'يمشات', options)
  );
});

/**
 * معالجة نقر الإشعار
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // البحث عن نافذة مفتوحة بالفعل
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // فتح نافذة جديدة إذا لم تكن هناك نافذة مفتوحة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * معالجة خلفية المزامنة
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

/**
 * مزامنة البيانات
 */
async function syncData() {
  try {
    // محاولة مزامنة البيانات المعلقة
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_DATA',
        data: { timestamp: Date.now() }
      });
    });
    console.log('[SW] Data synced');
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

console.log('[SW] Service Worker loaded:', VERSION);
