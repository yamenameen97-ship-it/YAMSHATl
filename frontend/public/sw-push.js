// ✅ v89.16 ROOT FIX #6 — Legacy Push SW Kill Stub
// السبب الجذري: sw-push.js (v47.6) كان SW كامل يُنافس sw.js على activate/claim.
// بعض الأجهزة سجّلت sw-push.js في وقت ما (v47.x)، وعند وجود سباق على السيطرة
// كان أول POST على /share-target يُوجّه إلى sw-push.js الذي لا يعرف الحدث →
// يفوت إلى nginx → شاشة بيضاء.
//
// الحل: نُحوّل هذا الملف إلى stub يُلغي تسجيل نفسه فور تفعيله + يمسح كل الكاش
// المرتبط به فقط (بدون لمس yamshat-share-fallback-v1) + يتنازل عن أي عميل.
// بعد ذلك سيتولّى sw.js الحقيقي التسجيل عبر main.jsx.

const LEGACY_TAG = 'yamshat-push-legacy-killed-v89.16';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      // ✅ لا نلمس yamshat-share-fallback-v1 مهما حدث
      await Promise.all(
        keys
          .filter((k) => !/^yamshat-share-fallback/i.test(k))
          .map((k) => caches.delete(k).catch(() => null))
      );
    } catch (_) { /* ignore */ }
    try {
      await self.registration.unregister();
      console.warn(`[${LEGACY_TAG}] Legacy push SW self-unregistered.`);
    } catch (_) { /* ignore */ }
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) { /* ignore */ }
  })());
});

// لا نلتقط أي fetch — نترك المتصفح يذهب مباشرةً إلى /sw.js الجديد
// (الذي هو المصدر الوحيد الحقيقي لمعالجة /share-target + push).
