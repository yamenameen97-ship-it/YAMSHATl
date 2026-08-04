/**
 * mediaWarmup.js — v89.32
 * =================================================================
 * الطبقة الناقصة المُكمِّلة لـ Offline PWA:
 *   - `offlineSessionCache` يحفظ الميتاداتا فقط (بيانات منشورات، ريلز، إلخ)
 *   - لكن الصور المصغّرة (Thumbnails) وملفات الريلز (mp4) لم تكن تُخزَّن
 *     داخل Cache Storage الخاص بـ Service Worker.
 *   - النتيجة: عند فتح التطبيق دون إنترنت كانت الصور المصغّرة تظهر
 *     كمربعات فارغة والريلز لا تشتغل → غياب "التصفح السلس" رغم
 *     وجود الميتاداتا.
 *
 * هذا الملف يسدّ الثغرة:
 *   1) يجمع كل روابط الوسائط (poster/thumbnail/video/image) من مصادر
 *      متعددة (منشورات الرئيسية، ريلز، ستوريات، بروفايلات).
 *   2) يرسلها إلى Service Worker عبر رسالة `WARM_MEDIA` ليضعها
 *      داخل كاش MEDIA (staleWhileRevalidate).
 *   3) يعمل مع debounce (800ms) لتجنّب إغراق الشبكة عند وصول
 *      دفعات كبيرة من العناصر.
 *   4) يحترم اتصال المستخدم: يتوقّف تلقائياً على `save-data` أو
 *      على شبكات 2G/slow-2g، ولا يشتغل إلا عند وجود اتصال.
 *
 * كل الدوال آمنة: تفشل صامتاً ولا تكسر الواجهة.
 * =================================================================
 */

const WARM_DEBOUNCE_MS = 800;
const MAX_URLS_PER_BATCH = 60;

// حقول محتملة لروابط الوسائط داخل كائن منشور/ريل/ستوري/بروفايل
const MEDIA_URL_KEYS = [
  'poster', 'thumbnail_url', 'thumbnail', 'image_url', 'preview_url',
  'media_url', 'video_url', 'url', 'file_url', 'media',
  'avatar', 'user_avatar', 'profile_picture', 'picture',
  'cover', 'cover_url', 'banner', 'banner_url',
];

// حقول قد تحتوي مصفوفة صور (منشور بأكثر من صورة)
const MEDIA_ARRAY_KEYS = ['images', 'photos', 'media_items', 'attachments', 'files'];

let _pending = new Set();
let _debounceTimer = null;

function _canWarm() {
  if (typeof navigator === 'undefined') return false;
  if (navigator.onLine === false) return false;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    if (conn.saveData === true) return false;
    const bad = ['slow-2g', '2g'];
    if (bad.includes(conn.effectiveType)) return false;
  }
  return typeof navigator.serviceWorker !== 'undefined'
    && !!navigator.serviceWorker.controller;
}

function _isUsableUrl(u) {
  if (!u || typeof u !== 'string') return false;
  const s = u.trim();
  if (!s) return false;
  if (s.startsWith('data:') || s.startsWith('blob:')) return false;
  // نقبل روابط مطلقة أو تبدأ بـ /
  return s.startsWith('http') || s.startsWith('/');
}

/**
 * يستخرج كل روابط الوسائط من كائن واحد.
 */
function _extractFromItem(item) {
  if (!item || typeof item !== 'object') return [];
  const out = [];

  for (const k of MEDIA_URL_KEYS) {
    if (_isUsableUrl(item[k])) out.push(item[k]);
  }

  for (const k of MEDIA_ARRAY_KEYS) {
    const arr = item[k];
    if (Array.isArray(arr)) {
      for (const el of arr) {
        if (_isUsableUrl(el)) out.push(el);
        else if (el && typeof el === 'object') {
          for (const key of MEDIA_URL_KEYS) {
            if (_isUsableUrl(el[key])) out.push(el[key]);
          }
        }
      }
    }
  }

  // بعض الـ APIs تُغلّف صاحب المنشور داخل `user` أو `author`
  const nested = item.user || item.author || item.owner;
  if (nested && typeof nested === 'object') {
    for (const k of MEDIA_URL_KEYS) {
      if (_isUsableUrl(nested[k])) out.push(nested[k]);
    }
  }

  return out;
}

/**
 * يضيف مصفوفة عناصر إلى قائمة الانتظار للتسخين.
 * @param {Array<object>} items - مصفوفة منشورات/ريلز/ستوريات/بروفايلات.
 */
export function queueItemsForWarmup(items) {
  if (!Array.isArray(items) || !items.length) return;
  if (!_canWarm()) return;
  for (const item of items) {
    for (const url of _extractFromItem(item)) {
      _pending.add(url);
    }
  }
  _scheduleFlush();
}

/**
 * يضيف روابط جاهزة مباشرة (لو استخرجتها بنفسك).
 */
export function queueUrlsForWarmup(urls) {
  if (!Array.isArray(urls) || !urls.length) return;
  if (!_canWarm()) return;
  for (const u of urls) {
    if (_isUsableUrl(u)) _pending.add(u);
  }
  _scheduleFlush();
}

function _scheduleFlush() {
  if (_debounceTimer) return;
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null;
    _flush();
  }, WARM_DEBOUNCE_MS);
}

function _flush() {
  if (!_canWarm()) { _pending.clear(); return; }
  if (!_pending.size) return;

  const all = Array.from(_pending);
  _pending.clear();

  // نُقسّم إلى دفعات لتجنّب رسائل ضخمة إلى SW
  for (let i = 0; i < all.length; i += MAX_URLS_PER_BATCH) {
    const batch = all.slice(i, i + MAX_URLS_PER_BATCH);
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'WARM_MEDIA',
        urls: batch,
      });
    } catch { /* ignore */ }
  }
}

/**
 * يبدأ استماعاً عاماً: عند رجوع الاتصال يُعيد محاولة أي شيء متبقٍ.
 * يُستدعى مرة واحدة من `main.jsx`.
 */
export function initMediaWarmup() {
  if (typeof window === 'undefined') return;
  try {
    window.addEventListener('online', () => {
      if (_pending.size) _scheduleFlush();
    });
    // عند تسجيل SW لأول مرة، أعد المحاولة
    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(() => {
        if (_pending.size) _scheduleFlush();
      }).catch(() => {});
    }
  } catch { /* ignore */ }
}

export default {
  queueItemsForWarmup,
  queueUrlsForWarmup,
  initMediaWarmup,
};
