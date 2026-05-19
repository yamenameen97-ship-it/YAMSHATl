/**
 * Enhanced Service Worker with Automatic Cache Busting
 * 
 * يوفر:
 * 1. تحديث تلقائي للكاش عند كل نشر جديد
 * 2. مسح الكاش القديم تلقائياً
 * 3. إخطار المستخدمين بالتحديثات الجديدة
 * 4. استراتيجيات كاش ذكية لأنواع ملفات مختلفة
 */

const VERSION = 'yamshat-v20260518-143022-1716033622';
const STATIC_CACHE = `${VERSION}:static`;
const MEDIA_CACHE = `${VERSION}:media`;
const API_CACHE = `${VERSION}:api`;

// قائمة الملفات الأساسية التي يجب تخزينها مسبقاً
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app-config.js',
  '/manifest.webmanifest',
];

/**
 * مسح الكاش القديم
 * يحذف جميع نسخ الكاش التي لا تتطابق مع الإصدار الحالي
 */
async function clearLegacyCaches() {
  const keys = await caches.keys();
  const cachePromises = keys
    .filter((key) => !key.startsWith(VERSION))
    .map((key) => {
      console.log(`[SW] حذف كاش قديم: ${key}`);
      return caches.delete(key);
    });
  
  await Promise.all(cachePromises);
}

/**
 * تخزين الملفات الأساسية مسبقاً
 */
async function precacheAssets() {
  const cache = await caches.open(STATIC_CACHE);
  try {
    await cache.addAll(PRECACHE_URLS);
    console.log('[SW] تم تخزين الملفات الأساسية مسبقاً');
  } catch (error) {
    console.warn('[SW] فشل تخزين بعض الملفات الأساسية:', error);
  }
}

/**
 * استراتيجية Network-First
 * محاولة الحصول على الملف من الشبكة أولاً، ثم من الكاش
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.status === 200) {
      // تخزين النسخة الجديدة في الكاش
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // في حالة فشل الشبكة، استخدام النسخة المخزنة
    const cached = await cache.match(request);
    if (cached) {
      console.log(`[SW] استخدام نسخة مخزنة: ${request.url}`);
      return cached;
    }
    throw error;
  }
}

/**
 * استراتيجية Cache-First
 * استخدام النسخة المخزنة أولاً، ثم محاولة الحصول على نسخة جديدة في الخلفية
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // تحديث النسخة في الخلفية بدون انتظار
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {
        // تجاهل الأخطاء في التحديث الخلفي
      });
    
    return cached;
  }
  
  // إذا لم تكن هناك نسخة مخزنة، جلب من الشبكة
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return Response.error();
  }
}

/**
 * استراتيجية Stale-While-Revalidate
 * إرجاع النسخة المخزنة فوراً وتحديثها في الخلفية
 */
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

/**
 * بث رسالة إلى جميع العملاء
 */
async function broadcastMessage(message) {
  const clientsList = await self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window',
  });
  
  clientsList.forEach((client) => {
    client.postMessage(message);
  });
}

/**
 * إخطار المستخدم بتحديث جديد
 */
async function notifyUpdate() {
  await broadcastMessage({
    type: 'yamshat:update-available',
    version: VERSION,
    message: 'تحديث جديد متاح! يرجى تحديث الصفحة.',
  });
}

// ============================================
// Service Worker Lifecycle Events
// ============================================

/**
 * حدث التثبيت
 * يتم تشغيله عند تثبيت Service Worker الجديد
 */
self.addEventListener('install', (event) => {
  console.log(`[SW] تثبيت Service Worker: ${VERSION}`);
  event.waitUntil(
    precacheAssets().then(() => {
      // تخطي انتظار التفعيل الفوري
      self.skipWaiting();
    })
  );
});

/**
 * حدث التفعيل
 * يتم تشغيله عند تفعيل Service Worker الجديد
 */
self.addEventListener('activate', (event) => {
  console.log(`[SW] تفعيل Service Worker: ${VERSION}`);
  event.waitUntil(
    clearLegacyCaches()
      .then(() => {
        // السيطرة على جميع العملاء الحاليين
        return self.clients.claim();
      })
      .then(() => {
        // إخطار المستخدمين بالتحديث الجديد
        return notifyUpdate();
      })
  );
});

/**
 * حدث الجلب
 * يتم تشغيله عند كل طلب شبكة
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // تجاهل الطلبات غير GET
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // طلبات الملاحة (HTML)
  // استخدام Network-First للحصول على أحدث نسخة
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, STATIC_CACHE).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // ملفات الأنماط والسكريبتات والخطوط
  // Network-First: محاولة الحصول على أحدث نسخة
  if (/\.(?:js|css|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // ملفات الصور والفيديو والصوت
  // Cache-First: استخدام النسخة المخزنة للأداء الأفضل
  if (/\.(?:png|jpg|jpeg|svg|webp|gif|avif|mp4|webm|mp3|wav|m3u8)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  // طلبات API
  // Network-First مع تخزين مؤقت للاستجابات الناجحة
  if (/\/(api|notifications|socket\.io)\//i.test(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // الطلبات الأخرى
  // Stale-While-Revalidate: إرجاع النسخة المخزنة فوراً وتحديثها في الخلفية
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

/**
 * حدث الرسالة
 * يتم تشغيله عند استقبال رسالة من الصفحة
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  if (type === 'yamshat:queue-sync') {
    event.waitUntil(
      broadcastMessage({
        type: 'yamshat:sync-now',
        data,
      })
    );
  }

  if (type === 'yamshat:clear-cache') {
    event.waitUntil(clearLegacyCaches());
  }

  if (type === 'yamshat:skip-waiting') {
    self.skipWaiting();
  }
});

/**
 * حدث المزامنة في الخلفية
 * يتم تشغيله عند تفعيل مزامنة في الخلفية
 */
self.addEventListener('sync', (event) => {
  if (
    event.tag === 'sync-posts' ||
    event.tag === 'sync-messages' ||
    event.tag === 'sync-notifications'
  ) {
    event.waitUntil(
      broadcastMessage({
        type: 'yamshat:sync-now',
        tag: event.tag,
      })
    );
  }
});

console.log(`[SW] Service Worker محسّن جاهز: ${VERSION}`);
