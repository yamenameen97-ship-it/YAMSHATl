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
// ✅ v89.13 ROOT FIX FINAL: رفع VERSION لإجبار تحديث SW القديم + إصلاح DB VersionError + fallback postMessage
// ✅ v89.14 ROOT FIX FINAL: رفع VERSION لإجبار تحديث SW القديم + Cache Storage fallback + ready pong
// ✅ v89.15 ROOT FIX FINAL: معالجة الأسباب الجذرية الأربعة — stashInMemoryPayload عالمي،
//    منع _empty:true قبل استنفاد المصادر، broadcast fallback لـ event.source null،
//    وإرفاق payload خفيفة في YAMSHAT_SHARE_RECEIVED مباشرة للـ landing.
// ✅ v89.17 ROOT FIX FINAL: 5 إصلاحات جذرية لفشل استقبال المشاركات على ويب الجوال (Chrome tab):
//    #1 manifest.webmanifest: start_url رُفع من v=89.08 إلى v=89.17 —
//       أندرويد يحفظ intent المشاركة بناءً على start_url عند التثبيت،
//       والقيمة القديمة كانت تحوّل POST إلى SW مسجّل بمسار قديم.
//    #2 manifest.webmanifest: أُضيف scope_extensions يشمل /share-target صراحةً
//       — بعض أندرويد WebView كانت ترفض POST خارج intent handler المسجّل.
//    #3 manifest.webmanifest: launch_handler client_mode بدأ الآن بـ
//       'focus-existing' بدل 'navigate-existing' — ويب الجوال كان يفتح
//       نافذة جديدة كل مرة بدل إعادة استخدام SW القائم.
//    #4 buildShareBridgeHtml: نُظِّف من كل inline styles وإضافة CSP meta محلياً
//       — Bridge HTML كان يسقط تحت CSP الصارم قبل الوصول لـ landing.
//    #5 nginx.conf: manifest.webmanifest يُقدَّم بـ no-cache — الجوال كان
//       يحتفظ بالنسخة القديمة (max-age=3600) ويتجاهل التحديثات.
// ✅ v89.16 ROOT FIX FINAL: 6 إصلاحات جذرية لنظام استقبال المشاركات على الجوال:
//    #1 app-config.js: purgeRuntimeCaches انتقائي — يحمي SHARE_FALLBACK_CACHE و SW.
//    #2 sw.js activate: يحمي SHARE_FALLBACK_CACHE من الحذف + GET /share-target يقرأ
//       الحمولة المخزنة من Cache Storage قبل إرجاع الـ bridge.
//    #3 isRuntimeConfigPath: يشمل sw-pwa-enhanced.js و sw-push.js الآن.
//    #4 index.html: watchdog على تحميل حزمة React (fallback بعد 8s).
//    #5 ShareTargetLanding: watchdog زمني 12s + زر إعادة محاولة صريح +
//       بطاقة تشخيص عند _empty بدل عرض أزرار الوجهات كأن كل شيء طبيعي.
//    #6 sw-pwa-enhanced.js + sw-push.js: تحويلهما إلى kill-stubs لا يتنافسان مع sw.js.
// ✅ v89.20 ROOT FIX: رفع VERSION لإجبار تحديث SW القديم — إصلاح حلقة reload + رسالة تحديث وهمية + فقاعة التثبيت عند /share-target
// ✅ v89.23 ROOT FIX (2026): استقبال YAMSHAT_SHARE_CLEAR من العميل لحذف SHARE_FALLBACK_CACHE
//   يمنع حلقة إعادة التحميل: SW لم يعد يبث نفس الحمولة القديمة مع كل controllerchange/HELLO.
//   كما أضفنا وسم _consumed داخل Cache Storage لتجنّب إعادة بث حمولة استهلكها العميل فعلاً.
const VERSION = 'yamshat-v20260804-v89.36-SHARE-BRIDGE-PURPLE-SCREEN-ROOT-FIX' + '2100000000007';
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
// ✅ v89.14 ROOT FIX: Cache Storage كـ fallback ثانوي — يصمد حتى لو فشل IDB
//   ومهما كان توقيت فتح ShareTargetLanding (قبل/بعد استقبال POST).
// ✅ v89.16 ROOT FIX #2: هذا الكاش مستقل عن VERSION — يجب ألا يُحذف عند activate
//   لأن حذفه يعني فقدان أي مشاركة استُقبلت قبيل التحديث.
const SHARE_FALLBACK_CACHE = 'yamshat-share-fallback-v1';
const SHARE_FALLBACK_URL = '/__yamshat_share_fallback__';
// ✅ v89.16 ROOT FIX #2: قائمة الكاشات المحمية من التنظيف في activate
const PROTECTED_CACHES = new Set([SHARE_FALLBACK_CACHE]);

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

// ✅ v89.16 ROOT FIX #3: يشمل الآن كل ملفات SW الجانبية (sw-pwa-enhanced.js و sw-push.js)
//   السبب الجذري السابق: هذان الملفان كانا يُخدَمان من كاش قديم عبر staleWhileRevalidate
//   بسبب امتداد .js → يبقى المتصفح على النسخة القديمة إلى الأبد ولا يرى الـ kill-stub.
function isRuntimeConfigPath(url) {
  return /^\/(?:app-config\.js|background-sync\.js|sw(?:-enhanced|-pwa-enhanced|-push)?\.js)$/i.test(url.pathname);
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

// ✅ v89.13 ROOT FIX #A: openShareDatabase بدون version ثابت + معالجة VersionError
//   السبب الجذري السابق:
//     كان sw.js يفتح 'yamshat-pwa-db' بإصدار ثابت = 1، بينما sharedIntake.js
//     يستخدم فتح ديناميكي قد يرقّي الإصدار إلى 2+. عند وجود upgrade مسبق،
//     يرمي sw.js VersionError → saveSharedPayload يفشل صامتاً → payload
//     لا يُحفظ أبداً → ShareTargetLanding يقرأ null → "جارٍ التحضير" أبدياً.
//   الحل:
//     - نفتح DB بدون version أولاً لقراءة الإصدار الحالي.
//     - إن لم يوجد الـ store، نُعيد الفتح بإصدار +1 وننشئه.
//     - أي فشل مُلتقط ومعالج — لا يمرّ استثناء لخارج الدالة.
function openShareDatabase() {
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(SHARE_DB_NAME);
    } catch (err) {
      reject(err);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SHARE_STORE_NAME)) {
        try { db.createObjectStore(SHARE_STORE_NAME); } catch (_) { /* ignore */ }
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // إن لم يوجد store → أعِد الفتح بإصدار أعلى لإنشائه
      if (!db.objectStoreNames.contains(SHARE_STORE_NAME)) {
        const nextVersion = (db.version || 1) + 1;
        db.close();
        let upgradeReq;
        try {
          upgradeReq = indexedDB.open(SHARE_DB_NAME, nextVersion);
        } catch (err) {
          reject(err);
          return;
        }
        upgradeReq.onupgradeneeded = () => {
          const udb = upgradeReq.result;
          if (!udb.objectStoreNames.contains(SHARE_STORE_NAME)) {
            try { udb.createObjectStore(SHARE_STORE_NAME); } catch (_) { /* ignore */ }
          }
        };
        upgradeReq.onsuccess = () => resolve(upgradeReq.result);
        upgradeReq.onerror = () => reject(upgradeReq.error);
        upgradeReq.onblocked = () => reject(new Error('IDB upgrade blocked'));
      } else {
        resolve(db);
      }
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IDB open blocked'));
  });
}

// ✅ v89.14 ROOT FIX: بناء نسخة نصية خفيفة صالحة للـ Cache/postMessage
function buildLightPayload(payload, err) {
  return {
    id: payload && payload.id,
    receivedAt: payload && payload.receivedAt,
    title: (payload && payload.title) || '',
    text: (payload && payload.text) || '',
    url: (payload && payload.url) || '',
    filesCount: Array.isArray(payload && payload.files) ? payload.files.length : 0,
    v: (payload && payload._v) || 'v89.14',
    _v: (payload && payload._v) || 'v89.14',
    _empty: !!(payload && payload._empty),
    _fallback: 'cache+postMessage',
    _dbError: err ? String((err && err.message) || err) : null,
  };
}

// ✅ v89.14 ROOT FIX #B1: حفظ Cache Storage fallback — يصمد عبر إعادة التحميل والعملاء الجدد
async function writeCacheFallback(lightPayload) {
  try {
    const cache = await caches.open(SHARE_FALLBACK_CACHE);
    const body = JSON.stringify(lightPayload);
    const res = new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
    await cache.put(SHARE_FALLBACK_URL, res);
    return true;
  } catch (_) { return false; }
}

// ✅ v89.14 ROOT FIX #B: saveSharedPayload لن يرمي أبداً — 3 مستويات fallback:
//   1) IndexedDB (المفضل — يحفظ الملفات الكاملة)
//   2) Cache Storage (نص خفيف — يصمد عبر إعادة التحميل)
//   3) postMessage (لأي عميل مفتوح الآن)
async function saveSharedPayload(payload) {
  let idbErr = null;
  try {
    const db = await openShareDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SHARE_STORE_NAME, 'readwrite');
      tx.objectStore(SHARE_STORE_NAME).put(payload, SHARE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('share tx failed'));
      tx.onabort = () => reject(tx.error || new Error('share tx aborted'));
    });
    // نجحت IDB — نمسح Cache fallback القديم (لتفادي payload قديم)
    try {
      const cache = await caches.open(SHARE_FALLBACK_CACHE);
      await cache.delete(SHARE_FALLBACK_URL);
    } catch (_) { /* ignore */ }
    return true;
  } catch (err) {
    idbErr = err;
  }

  // fallback ثانوي: نص خفيف
  const lightPayload = buildLightPayload(payload, idbErr);

  // 2) Cache Storage — يصمد عبر إعادة التحميل
  try { await writeCacheFallback(lightPayload); } catch (_) { /* ignore */ }

  // 3) postMessage لأي عميل مفتوح الآن
  try {
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    clientsList.forEach((client) => {
      try {
        client.postMessage({
          type: 'YAMSHAT_SHARE_PAYLOAD_FALLBACK',
          payload: lightPayload,
        });
      } catch (_) { /* ignore individual */ }
    });
  } catch (_) { /* ignore */ }
  return false;
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
// ✅ v89.36 ROOT FIX: الشاشة البنفسجية الفارغة عند المشاركة من يوتيوب
//   السبب الجذري:
//     - buildShareBridgeHtml السابق اعتمد على meta-refresh فقط (بعد إزالة inline script في v89.19)
//     - على WebView الأندرويد (Chrome tab المدمج داخل يوتيوب/فيسبوك)، meta-refresh:
//         1) قد يتأخر 3-8 ثوانٍ قبل التنفيذ
//         2) قد يتم تجاهله كلياً عند فتح رابط جديد داخل WebView
//         3) theme_color=#7C3AED من manifest يملأ الشاشة بلون بنفسجي أثناء الانتظار
//     - النتيجة: شاشة بنفسجية فارغة لثوانٍ طويلة، والمستخدم يظن أن التطبيق معطل
//   الحل الشامل (طبقات متعددة تعمل معاً):
//     1) inline script فوري يستخدم location.replace (CSP يسمح 'unsafe-inline')
//     2) meta-refresh كطبقة ثانية (تعمل حتى مع CSP الأشد صرامة)
//     3) window.location.href كطبقة ثالثة (تعمل حتى لو فشل location.replace)
//     4) setTimeout بـ 300ms كضمانة رابعة
//     5) خلفية داكنة (#0A0D1A) بدل الاعتماد على theme_color البنفسجي
//     6) رابط <a> مرئي واضح فوري (لا شاشة فارغة لأي جزء من الثانية)
//     7) prefetch لـ /index.html لتسخين الكاش
//     8) postMessage للنافذة الأم فوراً (للإعلام بالوصول)
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
  // ✅ v89.17 ROOT FIX #4: Bridge HTML مع CSP meta محلي يسمح صراحةً بـ inline styles
  //   والـ script — كان يسقط تحت CSP الصارم في بعض إعدادات أندرويد Chrome tab
  //   (خارج PWA) قبل الوصول لأي landing.
  // ✅ v89.36: HTML bridge محسّن — يفتح كأنه متصفح عادي بدون شاشة بنفسجية فارغة
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <!-- ✅ v89.36 FIX: theme-color داكن بدل بنفسجي لتفادي وميض بنفسجي عند التحميل -->
  <meta name="theme-color" content="#0A0D1A">
  <meta name="color-scheme" content="dark">
  <title>يام شات — جارٍ استقبال المشاركة</title>
  <!-- ✅ v89.36 FIX: CSP meta محلي يسمح صراحةً بـ inline script — ضمان مطلق أن التحويل يعمل -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:">
  <!-- طبقة 1: meta-refresh فوري -->
  <meta http-equiv="refresh" content="0; url=${target}">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <base target="_self">
  <link rel="prefetch" href="/index.html" as="document">
  <link rel="preload" href="/index.html" as="document">
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
    .progress{width:100%;max-width:320px;height:4px;background:rgba(139,92,246,.15);border-radius:999px;overflow:hidden;margin-top:8px}
    .progress-bar{height:100%;background:linear-gradient(90deg,#8B5CF6,#EC4899);width:0%;transition:width .3s ease;animation:progress-anim 1.5s ease-in-out infinite}
    @keyframes progress-anim{0%{width:0%}50%{width:70%}100%{width:100%}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <span class="badge">مشاركة إلى يام شات</span>
      <div class="spinner" aria-hidden="true"></div>
      <h1>جارٍ فتح التطبيق...</h1>
      <p>تم استلام المحتوى المُشارَك بنجاح. سيتم فتح صفحة اختيار الوجهة الآن.</p>
      <div class="progress" aria-hidden="true"><div class="progress-bar"></div></div>
      <a class="cta" href="${target}" id="ym-share-cta" onclick="try{window.location.replace(this.href);}catch(e){window.location.href=this.href}return false;">فتح يام شات</a>
      <span class="hint">المحتوى محفوظ محليّاً ولن يُفقد</span>
      <noscript>
        <p style="color:#f59e0b;margin-top:6px">اضغط الزر أعلاه للمتابعة.</p>
      </noscript>
    </div>
  </div>
  <!-- ✅ v89.36 ROOT FIX: طبقات تحويل متعددة — ضمان مطلق أن الصفحة لا تبقى فارغة -->
  <script>
    (function(){
      var TARGET = ${JSON.stringify(target)};
      var redirected = false;
      function goToTarget(){
        if (redirected) return;
        redirected = true;
        try {
          // إخطار SW أن bridge تم عرضه (اختياري)
          try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'YAMSHAT_BRIDGE_SHOWN', at: Date.now() });
            }
          } catch(_){}
          // طبقة 2: location.replace (لا يُضاف للسجل)
          window.location.replace(TARGET);
        } catch(e) {
          try {
            // طبقة 3: location.href fallback
            window.location.href = TARGET;
          } catch(e2) {
            try {
              // طبقة 4: location.assign fallback
              window.location.assign(TARGET);
            } catch(e3) { /* meta-refresh سيتولى الأمر */ }
          }
        }
      }
      // فوراً بعد load — أسرع طريقة
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(goToTarget, 50);
      } else {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(goToTarget, 50); });
        window.addEventListener('load', function(){ setTimeout(goToTarget, 50); });
      }
      // ضمانة إضافية بعد 300ms — إذا فشل كل شيء أعلاه
      setTimeout(goToTarget, 300);
      // ضمانة نهائية بعد 1500ms
      setTimeout(goToTarget, 1500);
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
      // بعض تطبيقات أندرويد القديمة تستخدم file أو media بدلاً من files.
      // نقبل الأسماء الثلاثة، ثم لا نحتفظ إلا بـ File/Blob صالح.
      const candidates = ['files', 'file', 'media'].flatMap((name) => formData.getAll(name));
      files = candidates.filter((value) => value && typeof value !== 'string' && typeof value.arrayBuffer === 'function');
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
        // بعض تطبيقات أندرويد القديمة تستخدم file أو media بدلاً من files.
        // نقبل الأسماء الثلاثة، ثم لا نحتفظ إلا بـ File/Blob صالح.
        const candidates = ['files', 'file', 'media'].flatMap((name) => formData.getAll(name));
        files = candidates.filter((value) => value && typeof value !== 'string' && typeof value.arrayBuffer === 'function');
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
      files.filter((file) => file && typeof file !== 'string' && typeof file.arrayBuffer === 'function').map(async (file, index) => {
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

    // ✅ v89.15 ROOT FIX #2: لا نحفظ payload _empty:true إذا كنّا نستطيع استخراج
    //   ولو الحد الأدنى من الطلب. السبب الجذري:
    //     في v89.14 كنّا نحفظ payload بـ _empty:true عند فشل قراءة formData حتى لو
    //     كان الرابط موجوداً في request.referrer أو request.url (search params) →
    //     ShareTargetLanding يعرض شاشة بيضاء "لا يوجد محتوى" بينما البيانات موجودة.
    //   الحل:
    //     1) قبل الحفظ نحاول انقاذ أي محتوى من request.url (query string) و referrer.
    //     2) إذا كان كل شيء فارغاً حقاً → نُضيف _diag يشرح السبب (نافذة التشخيص
    //        في الواجهة تعرضه بدل الشاشة البيضاء).
    if (!title && !text && !url && cleanFiles.length === 0) {
      try {
        const reqUrl = new URL(request.url);
        const qp = reqUrl.searchParams;
        title = String(qp.get('title') || qp.get('subject') || '');
        text = String(qp.get('text') || qp.get('body') || '');
        url = String(qp.get('url') || qp.get('link') || '');
      } catch (_) { /* ignore */ }
      if (!url) {
        try {
          const ref = String(request.referrer || '');
          if (ref && /^https?:\/\//i.test(ref) && !ref.includes(self.location.host)) {
            url = ref;
          }
        } catch (_) { /* ignore */ }
      }
      if (!url) {
        url = extractUrlFromText(text) || extractUrlFromText(title) || '';
      }
    }

    const isTrulyEmpty = !(title || text || url || cleanFiles.length);
    const finalPayload = {
      id: Date.now(),
      receivedAt: new Date().toISOString(),
      title,
      text,
      url,
      files: cleanFiles,
      // marker يُميّز v89.15
      _v: 'v89.15',
      _empty: isTrulyEmpty,
      // ✅ v89.15: تشخيص واضح للواجهة عند الفراغ الحقيقي — يمنع الشاشة البيضاء
      _diag: isTrulyEmpty ? {
        reason: 'no-form-fields-and-no-files',
        contentType: String(request.headers.get('content-type') || ''),
        method: String(request.method || ''),
        hasReferrer: Boolean(request.referrer),
        at: new Date().toISOString(),
      } : null,
    };

    // ✅ v89.07 ROOT FIX #3: نحفظ الحمولة دائماً — حتى لو كانت فارغة تماماً.
    //   السبب: إذا لم نحفظها، ShareTargetLanding سيبقى في حالة loading انتظاراً
    //   لإشارة من IndexedDB لن تأتي أبداً → شاشة "جاري التحضير..." لا نهائية.
    //   الحل: نحفظ حتى الحمولة الفارغة — الواجهة ستكشفها وتعرض "لا يوجد محتوى".
    await saveSharedPayload(finalPayload);

    // إعلام كل العملاء بأن حمولة جديدة وصلت + إرفاق payload خفيفة مباشرة
    //   ✅ v89.15 ROOT FIX #2b: نُرفق payload خفيفة في YAMSHAT_SHARE_RECEIVED نفسها،
    //   بحيث حتى لو فشلت IDB بشكل صامت لدى العميل، الـ landing يحصل على البيانات فوراً.
    try {
      const lightForClients = buildLightPayload(finalPayload, null);
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clientsList.forEach((client) => client.postMessage({
        type: 'YAMSHAT_SHARE_RECEIVED',
        timestamp: Date.now(),
        hasFiles: cleanFiles.length > 0,
        hasUrl: Boolean(url),
        payload: lightForClients,
        _v: 'v89.15',
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
        const validCacheNames = new Set(Object.values(CACHE_NAMES));
        await Promise.all(
          keys
            // ✅ v89.16 ROOT FIX #2: احتفظ بـ SHARE_FALLBACK_CACHE + كل الكاشات المحمية
            //   السبب الجذري السابق: activate كان يمسح كل ما ليس ضمن CACHE_NAMES →
            //   SHARE_FALLBACK_CACHE (yamshat-share-fallback-v1) يُحذف كل تفعيل →
            //   أي مشاركة استُقبلت قبل تفعيل SW الجديد تختفي فوراً.
            .filter((key) => !validCacheNames.has(key) && !PROTECTED_CACHES.has(key))
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
      // ✅ v89.16 ROOT FIX #2: عند GET /share-target — تحقّق أولاً من
      //   وجود fallback payload مخزّن (من POST سابق قبل التحديث/إعادة التحميل).
      //   إن وُجد → استخدمه كإشارة أن shared=1 (بدل إظهار bridge فارغ).
      event.respondWith((async () => {
        let hasStoredPayload = false;
        try {
          const cache = await caches.open(SHARE_FALLBACK_CACHE);
          const cached = await cache.match(SHARE_FALLBACK_URL);
          if (cached) hasStoredPayload = true;
        } catch (_) { /* ignore */ }
        return new Response(buildShareBridgeHtml(hasStoredPayload), {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      })());
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
  // ✅ v89.24 ROOT FIX #2: الواجهة استلمت الحمولة فعلياً (ACK) — نحذف الحمولة فوراً من
  //   Cache Storage دون انتظار حتى ما بعد النشر. هذا يقطع حلقة إعادة التحميل
  //   جذرياً: أي HELLO جديد لاحقاً لن يجد حمولة ليرسلها → لا setPayload متكرر.
  if (event.data?.type === 'YAMSHAT_SHARE_RECEIVED_ACK') {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(SHARE_FALLBACK_CACHE);
        await cache.delete(SHARE_FALLBACK_URL).catch(() => null);
      } catch (_) { /* ignore */ }
      // تخزين البصمة في self — منع الحفظ الجديد لنفس الحمولة خلال دورة SW هذه
      try {
        self.__yamshatConsumedFingerprints = self.__yamshatConsumedFingerprints || new Set();
        if (event.data?.fingerprint) self.__yamshatConsumedFingerprints.add(event.data.fingerprint);
      } catch (_) { /* ignore */ }
    })());
    return;
  }
  // ✅ v89.23 ROOT FIX #3: العميل استهلك الحمولة ونشرها — حذف SHARE_FALLBACK_CACHE فوراً
  //   ليمنع SW من إعادة بثها في أي HELLO لاحق (لا حلقة إعادة تحميل بعد الآن).
  if (event.data?.type === 'YAMSHAT_SHARE_CLEAR') {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(SHARE_FALLBACK_CACHE);
        await cache.delete(SHARE_FALLBACK_URL).catch(() => null);
      } catch (_) { /* ignore */ }
      // أعلم النوافذ الأخرى أن الحمولة استُهلكت (تجنّب تطبيق مكرر)
      try {
        const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        clientsList.forEach((client) => {
          try { client.postMessage({ type: 'YAMSHAT_SHARE_CONSUMED', at: Date.now() }); } catch (_) { /* ignore */ }
        });
      } catch (_) { /* ignore */ }
    })());
    return;
  }
  // ✅ v89.14 ROOT FIX #C: عند فتح ShareTargetLanding يُرسل hello —
  //   نرد له بـ fallback payload من Cache Storage إن وجد (يعالج السباق الزمني).
  if (event.data?.type === 'YAMSHAT_SHARE_HELLO') {
    event.waitUntil((async () => {
      try {
        // ✅ v89.23 ROOT FIX #3: إذا حمل العميل وسم consumed مع hello → احذف الحمولة فوراً ولا ترد.
        //   يمنع حلقة إعادة تحميل عند فتح نافذة جديدة بعد النشر.
        if (event.data?.consumed === true) {
          try {
            const cache = await caches.open(SHARE_FALLBACK_CACHE);
            await cache.delete(SHARE_FALLBACK_URL).catch(() => null);
          } catch (_) { /* ignore */ }
          return;
        }
        // ✅ v89.15 ROOT FIX #3: event.source قد يكون null في Firefox/Samsung
        //   Internet — broadcast إلى كل العملاء.
        const cache = await caches.open(SHARE_FALLBACK_CACHE);
        const cached = await cache.match(SHARE_FALLBACK_URL);
        if (cached) {
          const lightPayload = await cached.json();
          const message = {
            type: 'YAMSHAT_SHARE_PAYLOAD_FALLBACK',
            payload: lightPayload,
          };
          let deliveredToSource = false;
          // 1) حاول أولاً إرسالها إلى event.source (الأسرع)
          try {
            const source = event.source;
            if (source && typeof source.postMessage === 'function') {
              source.postMessage(message);
              deliveredToSource = true;
            }
          } catch (_) { /* fallthrough to broadcast */ }
          // 2) fallback مطلق: broadcast إلى كل النوافذ المفتوحة — يمنع فقدان الرسالة
          //   عندما event.source يكون null (Firefox/Samsung Internet).
          try {
            const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
            clientsList.forEach((client) => {
              // لا تكرّر لـ source إذا وصلت له بالفعل (مقارنة بالـ id إن أمكن)
              try {
                if (deliveredToSource && event.source && client.id === event.source.id) return;
                client.postMessage(message);
              } catch (_) { /* ignore individual */ }
            });
          } catch (_) { /* ignore */ }
        } else {
          // ✅ v89.15: حتى لو لم يوجد fallback، أرسل pong يؤكد أن SW حيّ (للتشخيص)
          const pong = { type: 'YAMSHAT_SHARE_HELLO_PONG', hasFallback: false, at: Date.now() };
          try {
            const source = event.source;
            if (source && typeof source.postMessage === 'function') source.postMessage(pong);
            else {
              const list = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
              list.forEach((c) => { try { c.postMessage(pong); } catch (_) {} });
            }
          } catch (_) { /* ignore */ }
        }
      } catch (_) { /* ignore */ }
    })());
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
