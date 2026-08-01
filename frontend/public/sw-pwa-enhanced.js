// ✅ v89.16 ROOT FIX #6 — Legacy PWA Enhanced SW Kill Stub
// نفس المنطق: يُلغي تسجيل نفسه فوراً ويمسح الكاش القديم بدون لمس
// yamshat-share-fallback-v1 (كاش المشاركات المحمي).

const LEGACY_TAG = 'yamshat-pwa-enhanced-legacy-killed-v89.16';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !/^yamshat-share-fallback/i.test(k))
          .map((k) => caches.delete(k).catch(() => null))
      );
    } catch (_) { /* ignore */ }
    try {
      await self.registration.unregister();
      console.warn(`[${LEGACY_TAG}] Legacy PWA enhanced SW self-unregistered.`);
    } catch (_) { /* ignore */ }
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) { /* ignore */ }
  })());
});
