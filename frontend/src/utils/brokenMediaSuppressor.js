/**
 * brokenMediaSuppressor.js — v59.12 fullscreen-top-fix
 * --------------------------------------------------------------
 * معالج عالمي يحتوي أخطاء تحميل الوسائط التالفة (صور / فيديو)
 * التي ترجع 404 من الباكيند (خصوصاً مسارات /uploads/*)، ويستبدلها
 * بـ placeholder محلي بصمت دون إعادة محاولة تحميل لاحقة.
 *
 * لماذا؟
 *  - بعض الصور/الفيديوهات في قاعدة البيانات تشير إلى ملفات حذفت من
 *    التخزين (Render disk persistence محدود) فتعطي 404.
 *  - المتصفح يسجل "Failed to load resource" لكل فشل تحميل، مما يلوث
 *    الكونسول بشكل مزعج.
 *  - بالاستبدال بـ data: URI عند أول فشل نمنع تكرار الطلب على نفس المورد
 *    ونوفر بديلاً بصرياً لطيفاً.
 */

const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const FALLBACK_AVATAR_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
      <rect width='80' height='80' fill='#1f2433'/>
      <circle cx='40' cy='32' r='14' fill='#3b4459'/>
      <path d='M14 72c4-14 14-22 26-22s22 8 26 22z' fill='#3b4459'/>
    </svg>`,
  );

const FALLBACK_IMAGE_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'>
      <rect width='160' height='100' fill='#1f2433'/>
      <path d='M30 78l30-36 22 26 14-18 26 28H30z' fill='#3b4459'/>
      <circle cx='52' cy='34' r='8' fill='#3b4459'/>
    </svg>`,
  );

// أنماط المسارات التي نعتبرها "وسائط مرفوعة محتمل تلفها"
const BROKEN_MEDIA_PATTERNS = [
  /\/uploads\//i,
  /\/static\/uploads\//i,
  /\/media\/uploads\//i,
];

function isBrokenMediaUrl(rawUrl) {
  if (!rawUrl) return false;
  const url = String(rawUrl);
  if (url.startsWith('data:') || url.startsWith('blob:')) return false;
  return BROKEN_MEDIA_PATTERNS.some((re) => re.test(url));
}

function pickImageFallback(el) {
  const alt = (el.getAttribute('alt') || '').trim();
  const cls = (el.className && typeof el.className === 'string' ? el.className : '').toLowerCase();
  if (
    alt.includes('حساب') ||
    alt.includes('مستخدم') ||
    alt.includes('avatar') ||
    cls.includes('avatar') ||
    cls.includes('user') ||
    cls.includes('profile')
  ) {
    return FALLBACK_AVATAR_SVG;
  }
  return FALLBACK_IMAGE_SVG;
}

function handleImageError(event) {
  const el = event.target;
  if (!el || el.tagName !== 'IMG') return;

  // تجنب الحلقات اللانهائية
  if (el.dataset.brokenMediaHandled === '1') return;

  const src = el.currentSrc || el.src || '';
  if (!isBrokenMediaUrl(src)) return;

  el.dataset.brokenMediaHandled = '1';
  el.dataset.brokenMediaOriginal = src;
  el.removeAttribute('srcset');
  try {
    el.src = pickImageFallback(el);
  } catch {
    el.src = TRANSPARENT_PIXEL;
  }
}

function handleVideoError(event) {
  const el = event.target;
  if (!el || (el.tagName !== 'VIDEO' && el.tagName !== 'SOURCE')) return;

  const videoEl = el.tagName === 'SOURCE' ? el.parentElement : el;
  if (!videoEl || videoEl.dataset.brokenMediaHandled === '1') return;

  const candidateUrl =
    (el.tagName === 'SOURCE' ? el.src : videoEl.currentSrc || videoEl.src) || '';
  if (!isBrokenMediaUrl(candidateUrl)) return;

  videoEl.dataset.brokenMediaHandled = '1';
  videoEl.dataset.brokenMediaOriginal = candidateUrl;

  try {
    videoEl.pause();
  } catch {
    /* ignore */
  }
  videoEl.removeAttribute('src');
  Array.from(videoEl.querySelectorAll('source')).forEach((source) => {
    source.removeAttribute('src');
  });
  try {
    videoEl.load();
  } catch {
    /* ignore */
  }
  if (!videoEl.poster || isBrokenMediaUrl(videoEl.poster)) {
    videoEl.poster = FALLBACK_IMAGE_SVG;
  }
}

let installed = false;

/**
 * تفعيل المعالج العالمي. يجب استدعاؤه مرة واحدة عند البدء.
 */
export function installBrokenMediaSuppressor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  // useCapture=true لأن حدث error لا ينتشر (bubble) بشكل افتراضي
  window.addEventListener(
    'error',
    (event) => {
      const target = event && event.target;
      if (!target || target === window) return;
      if (target.tagName === 'IMG') handleImageError(event);
      else if (target.tagName === 'VIDEO' || target.tagName === 'SOURCE') handleVideoError(event);
    },
    true,
  );
}

export default installBrokenMediaSuppressor;
