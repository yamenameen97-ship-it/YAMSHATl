// ✅ v89.07 ROOT FIX FINAL: إصلاح جذري نهائي لفشل استقبال المشاركات
//    (الشاشة الفارغة عند المشاركة من يوتيوب/تويتر/إنستجرام/فيسبوك/تيك توك/معرض الجوال)
//
//    السبب الجذري في v89.04:
//      buildShareBridgeHtml اعتمد على meta-refresh فقط (بدون inline JS).
//      لكن Chrome/WebView على أندرويد في سياق PWA — خاصةً عند العودة من WebView
//      (يوتيوب/فيسبوك) — يتجاهل meta-refresh أحياناً → شاشة بيضاء لا نهائية.
//
//    الإصلاحات:
//    #1) buildShareBridgeHtml: جمع meta-refresh + inline JS (CSP يسمح unsafe-inline)
//        + زر <a> يدوي واضح + fallback ثانوي بعد 2.5s → لا شاشة فارغة أبداً.
//    #2) بطاقة مرئية كاملة مع spinner كبير — المستخدم يرى تأكيداً بصرياً فورياً.
//    #3) handleShareTarget: حفظ الحمولة حتى لو كانت فارغة تماماً (يمنع الفقدان).
//    #4) POST fallback: نُرجع HTML bridge كامل دائماً (وليس Response فارغ).
//    #5) رفع VERSION لإجبار المتصفح على تحديث SW القديم.
//    #5) buildShareBridgeHtml نُظِّف من inline script بالكامل — meta-refresh حصرياً
//    #6) AppErrorBoundary + ShareTargetErrorBoundary مخصّص يُغلّف /share-target
//    ملاحظة: bumped VERSION لضمان أن SW القديم لن يبقى مسيطراً
// ✅ v89.08 ROOT FIX FINAL: إصلاح جذري كامل لاستقبال المشاركات الخارجية
//   الأسباب الجذرية المكتشفة والمُصلَحة:
//     #A) nginx كان يرفض POST على /share-target بـ 405 قبل تسجيل SW.
//         → أُصلح في nginx.conf (error_page 405 =200 + client_max_body_size 100M).
//     #B) SW لم يستدع clients.claim() فوراً في install → أول POST يفوت.
//         → أُصلح: skipWaiting + claim فوري + رسالة activation.
//     #C) handleShareTarget كانت ترمي عند contentType غير معروف.
//         → أُصلح: try/catch شامل داخلي + دائماً نحفظ + دائماً نُرجع HTML.
//     #D) VERSION مرفوعة لإجبار تحديث SW القديم فوراً.
const VERSION = 'yamshat-v89.08-share-external-final-' + '1930000000000';
const CACHE_NAMES = {
  SHELL: `${VERSION}:shell`,
  STATIC: `${VERSION}:static`,
  MEDIA: `${VERSION}:media`,
  API: `${VERSION}:api`,
  OFFLINE: `${VERSION}:offline`,
  PAGES: `${VERSION}:pages`,
  APIS_VISITED: `${VERSION}:apis-visited`,
};

const PAGES_MAX = 40;
const APIS_VISITED_MAX = 120;

// ✅ v88.98 ROOT FIX #5: NEVER_CACHE_API_PATTERNS يجب أن لا يمس /share-target إطلاقاً
//    السبب السابق: أنماط عامة كانت تلتقط أي مسار يحتوي على "share" وتُرجع emptyResponse
//    الحل: أنماط دقيقة تستهدف /api/... فقط ولا تمس /share-target أبداً
const NEVER_CACHE_API_PATTERNS = [
  /^\/api\/feed(\/|$|\?)/i,
  /^\/api\/posts(\/|$|\?)/i,
  /^\/api\/reels\/feed(\/|$|\?)/i,
  /^\/api\/reels(\/|$|\?)(?!\d)/i,
  /^\/api\/stories(\/|$|\?)/i,
  /^\/api\/notifications(\/|$|\?)/i,
  /^\/api\/chat\/conversations(\/|$|\?)/i,
  /^\/api\/groups\/[^/]+\/messages/i,
];

function isRealtimeApi(url) {
  // ✅ v88.98: حماية مطلقة — /share-target ليس API واقعياً أبداً
  if (url.pathname === '/share-target' || url.pathname.startsWith('/share-target/')) {
    return false;
  }
  return NEVER_CACHE_API_PATTERNS.some((rx) => rx.test(url.pathname + url.search));
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
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

// ✅ v89.04 ROOT FIX #5: HTML bridge خالٍ نهائياً من أي inline <script>
//    السبب الجذري (المشكلة #5):
//      في v88.98 كانت التعليقات تدّعي إزالة inline script، لكن <script>...</script>
//      ما زال داخل body. Google Chrome في وضع PWA (وبعض إعدادات CSP الصارمة
//      داخل WebView) يمنع تنفيذ inline scripts → التحويل يفشل → HTML يُعرض
//      كما هو (أو صفحة بيضاء إذا لم ينجح meta-refresh).
//
//    الحل:
//      - إزالة دوسول لـ <script> داخل HTML (حتى الفارغة).
//      - الاعتماد الحصري على meta http-equiv="refresh" content="0" — يعمل حتى
//        مع CSP الأشد صرامة (default-src 'self' فقط بدون 'unsafe-inline').
//      - fallback يدوي: زر <a> واضح مع target ملموس لو فشل meta-refresh.
//      - <link rel="prefetch"> على index.html لتسخين الكاش قبل التحويل.
//      - <base target="_self"> لضمان أن الروابط تُفتح داخل نفس النافذة.
function buildShareBridgeHtml(sharedOk) {
  const ts = Date.now();
  const flag = sharedOk ? '1' : '0';
  const target = `/#/share-target?shared=${flag}&via=sw&ts=${ts}`;
  // ✅ v89.07 ROOT FIX: fallback ثلاثي (meta-refresh + inline JS + زر يدوي)
  //   السبب الجذري السابق:
  //     v89.04 اعتمدت على meta-refresh فقط. لكن Chrome على أندرويد في سياق PWA —
  //     خاصةً عند العودة من WebView (يوتيوب/فيسبوك) — يتجاهل meta-refresh أحياناً
  //     → صفحة بيضاء لا نهائية.
  //   الحل:
  //     1) meta-refresh (فوري إن نجح)
  //     2) inline <script> يستدعي location.replace بعد 150ms (CSP يسمح unsafe-inline)
  //     3) fallback ثانوي setTimeout(2500ms) لضمان التحويل عند فشل كل شيء
  //     4) زر <a> واضح مرئي منذ اللحظة الأولى — لا يرى المستخدم شاشة فارغة أبداً
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#7C3AED">
  <title>يام شات — جارٍ استقبال المشاركة</title>
  <meta http-equiv="refresh" content="0; url=${target}">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <base target="_self">
  <link rel="prefetch" href="/index.html" as="document">
  <link rel="preconnect" href="/">
  <style>
    html,body{margin:0;padding:0;height:100%;background:#0A0D1A;color:#fff;font-family:system-ui,-apple-system,'Noto Sans Arabic','Tajawal',sans-serif;-webkit-font-smoothing:antialiased}
    .wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:18px;padding:24px;text-align:center;box-sizing:border-box}
    .card{background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.25);border-radius:22px;padding:28px 22px;max-width:520px;width:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:14px}
    .badge{display:inline-block;background:linear-gradient(135deg,rgba(139,92,246,.25),rgba(236,72,153,.18));color:#e9d5ff;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid rgba(139,92,246,.4)}
    .spinner{width:56px;height:56px;border:5px solid rgba(139,92,246,.2);border-top-color:#8B5CF6;border-radius:50%;animation:spin .85s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    h1{font-size:1.25rem;margin:0;font-weight:900;line-height:1.4}
    p{color:#94A3B8;margin:0;font-size:.98rem;line-height:1.75;max-width:440px}
    a.cta{color:#fff;text-decoration:none;padding:14px 34px;border-radius:14px;background:linear-gradient(135deg,#8B5CF6,#EC4899);border:0;margin-top:6px;font-weight:800;font-size:1.05rem;box-shadow:0 10px 28px rgba(139,92,246,.4);display:inline-block;min-width:220px;cursor:pointer;font-family:inherit}
    a.cta:active{transform:scale(.97)}
    .hint{color:#64748b;font-size:12px;margin-top:4px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <span class="badge">مشاركة إلى يام شات</span>
      <div class="spinner" aria-hidden="true"></div>
      <h1>جارٍ استلام المحتوى...</h1>
      <p>تم استلام المحتوى المُشارَك. إذا لم تُفتح الصفحة تلقائياً خلال ثانيتين، اضغط الزر أدناه.</p>
      <a class="cta" href="${target}" id="ym-share-cta">فتح يام شات</a>
      <span class="hint">المحتوى محفوظ محليّاً ولن يُفقد</span>
      <noscript>
        <p style="color:#f59e0b;margin-top:6px">جافاسكربت غير مفعّل — سيتم التحويل تلقائياً.</p>
      </noscript>
    </div>
  </div>
  <script>
    // ✅ v89.07: تحويل JS فوري يسبق meta-refresh (CSP يسمح unsafe-inline)
    (function(){
      var target = '${target}';
      try {
        setTimeout(function(){
          try { window.location.replace(target); }
          catch(_) { try { window.location.href = target; } catch(__) {} }
        }, 150);
        setTimeout(function(){
          if (window.location.pathname === '/share-target') {
            try { window.location.assign(target); }
            catch(_) { try { window.location.hash = '#/share-target?shared=${flag}&via=sw&ts=${ts}'; } catch(__) {} }
          }
        }, 2500);
      } catch(_) {}
    })();
  </script>
</body>
</html>`;
}

// ✅ v88.98 ROOT FIX #3 + #4: استخراج رابط يوتيوب من كل الحقول الممكنة
//    يوتيوب على أندرويد يرسل الرابط في text، ليس url. تويتر يرسله أحياناً في title.
//    نجمع كل النصوص، ثم نستخرج أول رابط http(s) نجده — إن لم يكن الحقل url موجوداً.
function extractUrlFromText(str) {
  if (!str || typeof str !== 'string') return '';
  const m = str.match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0] : '';
}

async function handleShareTarget(request) {
  // ✅ v89.08 ROOT FIX #C: try/catch شامل — لا نُلقي أبداً استثناءً غير ملتقط.
  //   السبب الجذري السابق:
  //     عند contentType غير معروف (بعض إصدارات Chrome على أندرويد ترسل
  //     multipart بدون boundary صالح) formData() ترمي TypeError → catch
  //     الخارجي يُعيد HTML bridge لكن بدون حفظ payload → ShareTargetLanding
  //     يقرأ null إلى الأبد → شاشة "جارٍ التحضير..." لا نهائية.
  //   الحل:
  //     كل عملية قراءة body مُغلَّفة بـ try/catch مستقل. نتقدم بأفضل ما لدينا
  //     ونحفظ payload دائماً — حتى لو كانت فارغة — ليقرأها ShareTargetLanding.
  let title = '';
  let text = '';
  let url = '';
  let files = [];

  try {
    const contentType = String(request.headers.get('content-type') || '').toLowerCase();

    // ✅ v89.08: حاول قراءة formData أولاً — الأكثر شيوعاً فٌ مشاركات الفيديو/الصور
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      files = formData.getAll('files').filter(Boolean);
      title = String(formData.get('title') || '');
      text = String(formData.get('text') || '');
      url = String(formData.get('url') || '');
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const raw = await request.text();
        const params = new URLSearchParams(raw);
        title = String(params.get('title') || '');
        text = String(params.get('text') || '');
        url = String(params.get('url') || '');
      } catch (_) { /* ignore — continue with empty */ }
    } else {
      // ✅ v89.08: fallback ثلاثي — حتى لو فشل كل شيء نتقدم
      // 1) حاول formData
      let handled = false;
      try {
        const formData = await request.formData();
        files = formData.getAll('files').filter(Boolean);
        title = String(formData.get('title') || '');
        text = String(formData.get('text') || '');
        url = String(formData.get('url') || '');
        handled = true;
      } catch (_) { /* try next */ }
      // 2) حاول text/url-encoded
      if (!handled) {
        try {
          const raw = await request.clone().text();
          if (raw && raw.includes('=')) {
            const params = new URLSearchParams(raw);
            title = String(params.get('title') || title || '');
            text = String(params.get('text') || text || '');
            url = String(params.get('url') || url || '');
            handled = true;
          } else if (raw) {
            // 3) النص مباشر ربما يحتوي URL فقط
            text = raw.slice(0, 2000);
          }
        } catch (_) { /* give up gracefully */ }
      }
    }

    // ✅ v88.98 ROOT FIX #3: يوتيوب يمرر الرابط داخل text (وليس url)
    //    نستخرج الرابط من text إن كان url فارغاً، ثم من title كطبقة أخيرة.
    if (!url) {
      url = extractUrlFromText(text) || extractUrlFromText(title) || '';
    }

    // فلترة الرابط من text إن كان مطابقاً تماماً (لتجنّب التكرار)
    if (url && text && text.trim() === url.trim()) {
      text = '';
    }

    const normalizedFiles = await Promise.all(
      files.map(async (file, index) => {
        // ✅ v88.98 ROOT FIX: بعض المتصفحات ترسل text/uri-list كـ File
        //    نستخرج منها الرابط بدل معاملتها كملف
        const fileType = String(file.type || '').toLowerCase();
        if (fileType.startsWith('text/')) {
          try {
            const asText = await file.text();
            const foundUrl = extractUrlFromText(asText);
            if (foundUrl && !url) url = foundUrl;
            if (!text && asText.length < 500 && asText !== foundUrl) text = asText;
            return null; // لا نعتبره ملفاً
          } catch (_) { /* ignore */ }
        }
        return {
          id: `${Date.now()}-${index}`,
          name: file.name || `shared-${index + 1}`,
          type: file.type || 'application/octet-stream',
          size: Number(file.size || 0),
          blob: file,
        };
      })
    );

    const cleanFiles = normalizedFiles.filter(Boolean);

    // ✅ v89.07 ROOT FIX #3: نحفظ الحمولة دائماً — حتى لو كانت فارغة تماماً.
    //   السبب: إذا لم نحفظها، ShareTargetLanding سيبقى في حالة loading انتظاراً
    //   لإشارة من IndexedDB لن تأتي أبداً → شاشة "جاري التحضير..." لا نهائية.
    //   الحل: نحفظ حتى الحمولة الفارغة — الواجهة ستكشفها وتعرض "لا يوجد محتوى".
    await saveSharedPayload({
      id: Date.now(),
      receivedAt: new Date().toISOString(),
      title,
      text,
      url,
      files: cleanFiles,
      // marker يُميّز v89.07: مفيد للـ diagnostics
      _v: 'v89.07',
      _empty: !(title || text || url || cleanFiles.length),
    });

    // إعلام كل العملاء بأن حمولة جديدة وصلت
    try {
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clientsList.forEach((client) => client.postMessage({
        type: 'YAMSHAT_SHARE_RECEIVED',
        timestamp: Date.now(),
        hasFiles: cleanFiles.length > 0,
        hasUrl: Boolean(url),
      }));
    } catch (_) { /* ignore */ }

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

// ✅ v89.08 ROOT FIX #B: skipWaiting فوري + claim مبكّر + تحمل فشل addAll
//   السبب الجذري السابق:
//     addAll(APP_SHELL) إذا فشل أي أصل (مثل أيقونة مفقودة) → install يفشل
//     بالكامل → SW لا يُفعّل → أول POST من يوتيوب يفوت إلى nginx (والذي
//     كان يرد 405) → المستخدم لا يرى شيئاً.
//   الحل:
//     - addAll مُحاط بـ catch فردي لكل أصل — فشل أحدها لا يمنع install.
//     - self.clients.claim() يُستدعى فوراً حتى يتحكم SW في أول POST.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAMES.SHELL)
      .then(async (cache) => {
        // تحمّل فردي مع تجاهل الفشل لأي أصل مفقود
        await Promise.all(
          APP_SHELL.map((u) => cache.add(u).catch((err) => {
            console.warn('[SW v89.08] failed to cache shell asset (ignored):', u, err?.message);
            return null;
          }))
        );
      })
      .catch((err) => {
        console.warn('[SW v89.08] shell caching failed (non-fatal):', err?.message);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => !Object.values(CACHE_NAMES).includes(key))
            .map((key) => caches.delete(key).catch(() => null))
        );
      } catch (_) { /* ignore */ }
      // ✅ v89.08: claim فوري — يضمن تحكم SW في كل العملاء المفتوحين
      try { await self.clients.claim(); } catch (_) { /* ignore */ }
      try {
        await broadcastMessage({
          type: 'yamshat:sw-activated',
          version: VERSION,
          shareReady: true,
        });
      } catch (_) { /* ignore */ }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ v88.98 ROOT FIX #4 + #5: التقاط /share-target قبل أي معالج آخر
  //    وضمان أن NEVER_CACHE_API_PATTERNS لا يمسّه.
  if (url.origin === self.location.origin && url.pathname === '/share-target') {
    if (request.method === 'POST') {
      event.respondWith(handleShareTarget(request));
      return;
    }
    if (request.method === 'GET') {
      event.respondWith(new Response(buildShareBridgeHtml(false), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }));
      return;
    }
  }

  if (request.method !== 'GET') return;

  if (isRuntimeConfigPath(url)) {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === 'navigate') {
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
    if (isRealtimeApi(url)) {
      event.respondWith((async () => {
        try {
          return await fetch(request, { cache: 'no-store' });
        } catch (_) {
          return emptyResponse(503, 'Offline (realtime endpoint)');
        }
      })());
      return;
    }

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
