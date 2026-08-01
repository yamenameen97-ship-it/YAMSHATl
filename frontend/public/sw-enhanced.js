// ✅ v89.16 ROOT FIX #6 — Legacy SW Enhanced Kill Stub (بدون لمس share-fallback)
const LEGACY_TAG = 'yamshat-enhanced-legacy-killed-v89.16';

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
      console.warn(`[${LEGACY_TAG}] Legacy SW self-unregistered.`);
    } catch (_) { /* ignore */ }
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) { /* ignore */ }
  })());
});
