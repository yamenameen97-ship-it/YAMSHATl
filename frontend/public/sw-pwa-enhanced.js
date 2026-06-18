/**
 * sw-pwa-enhanced.js — Yamshat Service Worker (Patched)
 *
 * إصلاحات هذا الإصدار:
 *  1) تجاهل استجابات Partial (206) و opaque و no-store قبل cache.put
 *     => يقضي على: TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
 *  2) تجاهل طلبات Range (الفيديو/الصوت/استئناف التحميل) من التخزين
 *  3) عدم تخزين الأخطاء (5xx/4xx) ولا الطلبات غير GET
 *  4) Fallback ذكي لـ /brand/yamshat-logo.png عند 404 على شعار قديم
 *  5) Fallback صامت (204) لطلبات /uploads/* الفاشلة لتقليل ضجيج الكونسول
 *  6) Background sync بدون رمي استثناءات غير مُعالجة
 */

const SW_VERSION = '1.0.4-pwa-v60-login-fix';

const CACHE_NAMES = {
  STATIC: `yamshat-static-${SW_VERSION}`,
  MEDIA: `yamshat-media-${SW_VERSION}`,
  API: `yamshat-api-${SW_VERSION}`,
  SHELL: `yamshat-shell-${SW_VERSION}`,
};

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/brand/yamshat-logo.png',
  '/brand/yamshat-logo.jpg',
  '/logo192.png',
  '/icons/icon-192.png',
];

const LOGO_FALLBACK = '/brand/yamshat-logo.png';

/**
 * هل الاستجابة قابلة للتخزين في الـ Cache؟
 * Cache API يرفض:
 *  - status 206 (Partial Content)
 *  - opaque responses with status 0 إذا قمنا بقراءتها كـ stream متعدد
 *  - الاستجابات الفاشلة
 */
function isCacheable(request, response) {
  if (!response) return false;
  if (request.method !== 'GET') return false;
  // 206 = Partial Content — السبب الرئيسي للخطأ في الكونسول
  if (response.status === 206) return false;
  // الاستجابات غير الناجحة
  if (!response.ok && response.type !== 'opaque') return false;
  // طلبات Range (فيديو/صوت)
  if (request.headers.get('range')) return false;
  // عدم تخزين streams
  const cacheControl = response.headers.get('cache-control') || '';
  if (cacheControl.includes('no-store')) return false;
  return true;
}

/**
 * تخزين آمن في الـ Cache لا يرمي استثناءات أبداً
 * ملاحظة مهمة: يستقبل نسخة (clone) جاهزة من الـ response بدلاً من استدعاء clone()
 * هنا، حتى نمنع خطأ "Response body is already used" عندما يكون المتصفح قد
 * استهلك الـ body بالفعل قبل أن يصل التنفيذ الى هذا السطر.
 */
async function safeCachePut(cacheName, request, responseClone) {
  try {
    if (!responseClone) return;
    if (!isCacheable(request, responseClone)) return;
    const cache = await caches.open(cacheName);
    await cache.put(request, responseClone);
  } catch (err) {
    // ابتلاع الخطأ بهدوء بدلاً من رميه كـ Uncaught (in promise)
    console.debug('[SW] safeCachePut skipped:', err?.message || err);
  }
}

/**
 * مساعد: يأخذ نسخة من الـ response بأمان قبل تخزينها.
 * إذا فشل clone (مثلاً لأن الـ body مستهلك)، نتجاهل بهدوء.
 */
function cloneSafe(response) {
  try {
    if (!response || typeof response.clone !== 'function') return null;
    if (response.bodyUsed) return null;
    return response.clone();
  } catch (err) {
    console.debug('[SW] cloneSafe failed:', err?.message || err);
    return null;
  }
}

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAMES.SHELL).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...', SW_VERSION);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const allowed = new Set(Object.values(CACHE_NAMES));
      await Promise.all(keys.filter((k) => !allowed.has(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;
  if (request.method !== 'GET') return;

  // تجاهل طلبات Range بشكل كامل من الـ SW (نتركها للمتصفح)
  if (request.headers.get('range')) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.STATIC));
  } else if (isMediaAsset(url)) {
    event.respondWith(mediaStrategy(request, CACHE_NAMES.MEDIA));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API));
  } else if (isHtmlRequest(request)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.SHELL));
  } else {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.STATIC));
  }
});

/**
 * Cache First — للأصول الثابتة
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    // ننسخ الـ response فوراً قبل تسليمه للمتصفح حتى لا يُستهلك الـ body
    const copy = cloneSafe(response);
    if (copy) safeCachePut(cacheName, request, copy);
    return response;
  } catch (error) {
    console.debug('[SW] cacheFirst fallback:', error?.message || error);
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

/**
 * استراتيجية مخصصة للوسائط: تتعامل مع 404 الخاصة بالشعار + uploads
 */
async function mediaStrategy(request, cacheName) {
  const url = new URL(request.url);

  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);

    // 404 على شعار قديم أو logo192 => خادم الـ fallback المحلي
    // ⚠️ مهم: لا نُطبّق هذا الـ fallback على ملفات /uploads/ أبداً حتى
    //         لا يظهر شعار Yamshat فوق فيديوهات الريلز عند فشل التحميل.
    if (
      response.status === 404 &&
      !url.pathname.startsWith('/uploads/') &&
      (/yamshat-logo\.(png|jpe?g|webp)$/i.test(url.pathname)
        || /^\/logo192\.png$/i.test(url.pathname))
    ) {
      const fallbackPath = /^\/logo192\.png$/i.test(url.pathname) ? '/icons/icon-192.png' : LOGO_FALLBACK;
      const fallback = await caches.match(fallbackPath);
      if (fallback) return fallback;
      try {
        return await fetch(fallbackPath);
      } catch {
        // ✅ FIX: status 204 لا يسمح بـ body → نمرر null بدل ''
        return new Response(null, { status: 204 });
      }
    }

    // 404 على ملفات الرفع => رد صامت 204 لمنع ضجيج الكونسول
    // ✅ FIX: status 204 لا يسمح بـ body → null بدل ''
    if (response.status === 404 && url.pathname.startsWith('/uploads/')) {
      return new Response(null, { status: 204, statusText: 'Asset removed' });
    }

    const copy = cloneSafe(response);
    if (copy) safeCachePut(cacheName, request, copy);
    return response;
  } catch (error) {
    console.debug('[SW] media fetch failed:', error?.message || error);
    // ⚠️ لا نستبدل أصول /uploads/ بشعار Yamshat — نتركها 204 صامتة
    if (
      !url.pathname.startsWith('/uploads/') &&
      /yamshat-logo\.(png|jpe?g|webp)$/i.test(url.pathname)
    ) {
      const fallback = await caches.match(LOGO_FALLBACK);
      if (fallback) return fallback;
    }
    // ✅ FIX: 204 must have null body
    return new Response(null, { status: 204 });
  }
}

/**
 * Network First — مع safeCachePut
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    const copy = cloneSafe(response);
    if (copy) safeCachePut(cacheName, request, copy);
    return response;
  } catch (error) {
    console.debug('[SW] networkFirst fallback:', error?.message || error);
    const cached = await caches.match(request);
    if (cached) return cached;
    if (isHtmlRequest(request)) {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
    }
    return new Response('Offline', { status: 503 });
  }
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

function isMediaAsset(url) {
  const mediaExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mp3', '.wav', '.m4a', '.ogg'];
  return mediaExtensions.some((ext) => url.pathname.endsWith(ext));
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/graphql');
}

function isHtmlRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'CLEAR_CACHES') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      })()
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'yamshat-sync') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[SW] Data synced');
        } catch (err) {
          console.debug('[SW] sync failed:', err?.message || err);
        }
      })()
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Yamshat', {
        body: data.body || '',
        icon: '/brand/yamshat-logo.png',
        badge: '/brand/yamshat-logo.png',
        data: data.url ? { url: data.url } : undefined,
      })
    );
  } catch {
    // ignore malformed push payloads
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(self.clients.openWindow(url));
});
