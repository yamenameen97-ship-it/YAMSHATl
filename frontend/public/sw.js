const VERSION = 'yamshat-v88.92-share-target-root-fix-1917100000000';
const CACHE_NAMES = {
  SHELL: `${VERSION}:shell`,
  STATIC: `${VERSION}:static`,
  MEDIA: `${VERSION}:media`,
  API: `${VERSION}:api`,
  OFFLINE: `${VERSION}:offline`,
  // ✅ v88.76 Offline PWA: كاش منفصل للصفحات الديناميكية المُتصفّحة
  PAGES: `${VERSION}:pages`,
  APIS_VISITED: `${VERSION}:apis-visited`,
};

// ✅ v88.76: حدود تقليم كاش الجلسات (لتجنّب التخمة)
const PAGES_MAX = 40;
const APIS_VISITED_MAX = 120;

// ✅ v88.92: قائمة مسارات API التي لا نُحفظ استجاباتها إطلاقاً في الكاش
// (الفيد + المنشورات + الريلز + الستوريز) — لضمان أن كل تحميل يجلب المنشورات الجديدة
// من الخادم مباشرة. المشكلة السابقة: بعد نشر منشور جديد، الحساب الآخر لا يراه لأن SW
// كان يُرجع نسخة مخبأة من `/api/feed` أو `/api/posts`.
const NEVER_CACHE_API_PATTERNS = [
  /\/api\/feed(\/|$|\?)/i,
  /\/api\/posts(\/|$|\?)/i,
  /\/api\/reels\/feed(\/|$|\?)/i,
  /\/api\/reels(\/|$|\?)(?!\d)/i,
  /\/api\/stories(\/|$|\?)/i,
  /\/api\/notifications(\/|$|\?)/i,
  /\/api\/chat\/conversations(\/|$|\?)/i,
  /\/api\/groups\/[^/]+\/messages/i,
];

function isRealtimeApi(url) {
  return NEVER_CACHE_API_PATTERNS.some((rx) => rx.test(url.pathname + url.search));
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    // حذف الأقدم (FIFO حسب ترتيب keys)
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  } catch (_) { /* ignore */ }
}

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

function isRuntimeConfigPath(url) {
  return /^\/(?:app-config\.js|background-sync\.js|sw(?:-enhanced)?\.js)$/i.test(url.pathname);
}

function isSignedMedia(url) {
  return /([?&])(sig|signature|token|expires)=/i.test(url.search);
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

// ✅ v88.92 ROOT FIX: HTML بديل يعرض شاشة تحميل + يحوّل إلى المسار الصحيح
//   يضمن أن Yamshat يستقبل الحمولة حتى لو المتصفح لم ينفذ 303 redirect بشكل صحيح
//   (مثل Chrome على أندرويد الذي فتح صفحة بيضاء في v88.84).
function buildShareBridgeHtml(sharedOk) {
  const target = sharedOk ? '/#/share-target?shared=1' : '/#/share-target?shared=0';
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>يام شات — جارٍ استقبال المشاركة</title>
  <meta http-equiv="refresh" content="0; url=${target}">
  <style>
    html,body{margin:0;padding:0;height:100%;background:#0A0D1A;color:#fff;font-family:system-ui,-apple-system,sans-serif}
    .wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:16px;padding:24px;text-align:center}
    .spinner{width:52px;height:52px;border:4px solid rgba(139,92,246,.2);border-top-color:#8B5CF6;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    h1{font-size:1.15rem;margin:0;font-weight:800}
    p{color:#94A3B8;margin:0;font-size:.95rem;line-height:1.6}
    a{color:#c4b5fd;text-decoration:none;padding:10px 18px;border-radius:12px;background:rgba(139,92,246,.14);border:1px solid rgba(139,92,246,.35);margin-top:8px;font-weight:700}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <h1>جارٍ استلام المحتوى في يام شات...</h1>
    <p>إذا لم تُفتح الصفحة تلقائياً خلال ثانيتين، اضغط الزر أدناه.</p>
    <a href="${target}">فتح يام شات</a>
  </div>
  <script>
    // ✅ v88.92: تحويل فوري عبر JS مع إبلاغ SW ليعلم أن الصفحة جاهزة لاستهلاك الحمولة
    try {
      if (window.location.hash !== '${target.substring(1)}') {
        window.location.replace('${target}');
      }
    } catch(_) { window.location.href = '${target}'; }
  </script>
</body>
</html>`;
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

    // ✅ v88.92 ROOT FIX: في السابق كنا نستخدم Response.redirect('/#/share-target?shared=1')
    //   لكن Chrome على أندرويد لا يحترم الـ hash عند 303 redirect من SW في سياق PWA،
    //   فتظهر صفحة بيضاء (index.html بدون المسار الصحيح في hash).
    //   الحل الجذري: إرجاع HTML صريح يحتوي على meta-refresh + window.location.replace
    //   يضمن الوصول إلى /#/share-target?shared=1 في كل الأجهزة والمتصفحات.
    return new Response(buildShareBridgeHtml(true), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return new Response(buildShareBridgeHtml(false), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request, { cache: 'no-store' })
    .then(async (response) => {
      if (response?.status === 200) await cache.put(request, response.clone()).catch(() => null);
      return response;
    })
    .catch(() => null);
  return cached || (await network) || emptyResponse();
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response?.status === 200) await cache.put(request, response.clone()).catch(() => null);
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || emptyResponse();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response?.status === 200) await cache.put(request, response.clone()).catch(() => null);
    return response;
  } catch {
    return emptyResponse();
  }
}

async function broadcastMessage(message) {
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clientsList.forEach((client) => client.postMessage(message));
}

self.addEventListener('install', (event) => {
  // ✅ v88.92: تفعيل SW الجديد فوراً بدون انتظار إغلاق التبويبات القديمة
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAMES.SHELL).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      // ✅ v88.92: حذف كل الكاشات القديمة (كل ما ليس ضمن CACHE_NAMES الحالية)
      //   هذا يشمل كاشات v88.84 و v88.85 و v88.91 التي كانت تحمل استجابات فيد قديمة
      //   وتمنع ظهور المنشورات الجديدة.
      .then((keys) => Promise.all(keys.filter((key) => !Object.values(CACHE_NAMES).includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => broadcastMessage({ type: 'yamshat:sw-activated', version: VERSION }))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.origin === self.location.origin && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(request));
    return;
  }

  if (request.method !== 'GET') return;

  if (isRuntimeConfigPath(url)) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === 'navigate') {
    // ✅ v88.76 Offline PWA: حفظ كل تنقل إلى صفحة في كاش PAGES
    //   (HashRouter SPA → المسارات في hash، لذا index.html يخدم الجميع)
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(async (response) => {
          const shellCache = await caches.open(CACHE_NAMES.SHELL);
          shellCache.put(request, response.clone()).catch(() => null);
          const pagesCache = await caches.open(CACHE_NAMES.PAGES);
          pagesCache.put(request, response.clone()).catch(() => null);
          trimCache(CACHE_NAMES.PAGES, PAGES_MAX);
          return response;
        })
        .catch(async () => {
          // ارتداد للصفحة المحددة إن كانت في الكاش، وإلا index.html للـSPA
          const pagesCache = await caches.open(CACHE_NAMES.PAGES);
          const pageHit = await pagesCache.match(request);
          if (pageHit) return pageHit;
          const shellCache = await caches.open(CACHE_NAMES.SHELL);
          const fallback = (await shellCache.match(request))
            || (await shellCache.match('/index.html'))
            || (await shellCache.match('/offline.html'));
          return fallback || emptyResponse(503, 'Offline');
        })
    );
    return;
  }

  if (url.origin !== self.location.origin && !url.hostname.includes('cloudinary.com')) return;

  if (/\.(?:js|css|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.STATIC));
    return;
  }

  if (/\/(api|notifications)\//i.test(url.pathname)) {
    // ✅ v88.92 ROOT FIX: بعض مسارات الـ API (الفيد، المنشورات، الريلز، الستوريز، الرسائل)
    //   يجب أن لا تُخزَّن أبداً في الكاش — وإلا يظل المستخدم يرى نسخة قديمة ولا تظهر
    //   المنشورات الجديدة التي رفعها حساب آخر. نستخدم network-only لهذه المسارات.
    if (isRealtimeApi(url)) {
      event.respondWith((async () => {
        try {
          return await fetch(request, { cache: 'no-store' });
        } catch (_) {
          // في وضع Offline نُرجع خطأ 503 صريح — لا نُلوث الفيد بنسخة قديمة.
          return emptyResponse(503, 'Offline (realtime endpoint)');
        }
      })());
      return;
    }

    // ✅ v88.76 Offline PWA: باقي مسارات API — network-first مع ارتداد إلى الكاش
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAMES.APIS_VISITED);
          cache.put(request, response.clone()).catch(() => null);
          trimCache(CACHE_NAMES.APIS_VISITED, APIS_VISITED_MAX);
        }
        return response;
      } catch (_) {
        // ارتداد: الرد من كاش الويزت ثم من كاش API القديم
        const visitedCache = await caches.open(CACHE_NAMES.APIS_VISITED);
        const hit = await visitedCache.match(request);
        if (hit) return hit;
        const apiCache = await caches.open(CACHE_NAMES.API);
        const legacy = await apiCache.match(request);
        if (legacy) return legacy;
        return emptyResponse(503, 'Offline');
      }
    })());
    return;
  }

  // ✅ v88.24 FIX: كاش وسائط المنشورات يشمل الآن:
  //   1) الملفات ذات الامتداد الصريح (png/jpg/mp4/...)
  //   2) روابط Cloudinary بدون امتداد (مثل /image/upload/v123/abc)
  //   3) روابط /uploads/* المحلية بدون امتداد
  //   4) request.destination === 'image' | 'video' | 'audio' (يغطي أي رابط تولّده الـ<img>/<video>)
  const isImageAsset = /\.(?:png|jpg|jpeg|svg|webp|gif|avif|heic|heif)$/i.test(url.pathname)
    || request.destination === 'image'
    || /\/image\/upload\//i.test(url.pathname);

  const isVideoOrAudioAsset = /\.(?:mp4|webm|mp3|wav|m3u8|mov|m4v|mkv|ogg|opus|m4a|aac)$/i.test(url.pathname)
    || request.destination === 'video'
    || request.destination === 'audio'
    || /\/video\/upload\//i.test(url.pathname);

  const isUploadedMedia = /^\/uploads?\//i.test(url.pathname);

  if (isImageAsset || (isUploadedMedia && !isVideoOrAudioAsset)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.MEDIA));
    return;
  }

  if (isVideoOrAudioAsset) {
    event.respondWith(isSignedMedia(url) ? networkFirst(request, CACHE_NAMES.MEDIA) : cacheFirst(request, CACHE_NAMES.MEDIA));
    return;
  }

  event.respondWith(networkFirst(request, CACHE_NAMES.OFFLINE));
});

// ✅ v88.24 FIX: استقبال أمر warm-up للوسائط بعد الرفع مباشرة
async function warmMediaUrls(urls = []) {
  const cache = await caches.open(CACHE_NAMES.MEDIA);
  await Promise.all(
    urls
      .filter((u) => typeof u === 'string' && u.trim())
      .map(async (u) => {
        try {
          const req = new Request(u, { mode: 'no-cors', credentials: 'include' });
          const cached = await cache.match(req);
          if (cached) return;
          const res = await fetch(req);
          if (res && (res.status === 200 || res.type === 'opaque')) {
            await cache.put(req, res.clone()).catch(() => null);
          }
        } catch { /* ignore individual failures */ }
      })
  );
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  // ✅ v88.92: أمر جديد يسمح للفرونت بمسح كاش الفيد يدوياً بعد نشر منشور جديد
  if (event.data?.type === 'YAMSHAT_INVALIDATE_FEED') {
    event.waitUntil((async () => {
      try {
        const visitedCache = await caches.open(CACHE_NAMES.APIS_VISITED);
        const keys = await visitedCache.keys();
        await Promise.all(keys.map((k) => {
          try {
            const u = new URL(k.url);
            if (isRealtimeApi(u)) return visitedCache.delete(k);
          } catch (_) {}
          return null;
        }));
      } catch (_) {}
    })());
    return;
  }
  if (event.data?.type === 'WARM_MEDIA' && Array.isArray(event.data.urls)) {
    event.waitUntil(warmMediaUrls(event.data.urls));
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { title: event.data?.text?.() || 'Yamshat' }; }
  const targetPath = data.path || data.url || '/';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || 'yamshat',
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
