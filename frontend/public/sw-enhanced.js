// v89.10 — Legacy SW Kill Stub
// هذا الملف كان يحتوي على Service Worker قديم بدون معالج /share-target.
// الآن يقوم ذاتيّاً بإلغاء تسجيل نفسه ومسح الكاش القديم فور تحميله.
// أي جهاز عالق على هذا SW سيقوم بتنظيف نفسه تلقائياً عند أول تحميل.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => null)));
    } catch (_) { /* ignore */ }
    try {
      await self.registration.unregister();
      console.warn('[Yamshat v89.10] Legacy SW self-unregistered.');
    } catch (_) { /* ignore */ }
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) { /* ignore */ }
  })());
});

// لا نلتقط أي fetch — نترك المتصفح يعود إلى الشبكة/nginx حتى يتم تسجيل /sw.js الجديد.
