/**
 * useViewportHeight
 * ------------------
 * يثبّت متغير CSS `--yam-vh` ليطابق ارتفاع الـ viewport الفعلي
 * مع احترام لوحة المفاتيح على الموبايل (VisualViewport API)،
 * شريط URL الديناميكي في iOS Safari، وتدوير الجهاز.
 *
 * يُحقن مرة واحدة في `main.jsx` (initializeViewportTracker)
 * كما يمكن استدعاء useViewportHeight() داخل المكوّنات إن لزم.
 */

let initialized = false;

function syncViewportVar() {
  if (typeof window === 'undefined') return;

  // visualViewport يعطي قياساً دقيقاً عند ظهور keyboard
  const vv = window.visualViewport;
  const height = vv?.height ? vv.height : window.innerHeight;
  const offset = vv?.offsetTop ? vv.offsetTop : 0;

  document.documentElement.style.setProperty('--yam-vh', `${height}px`);
  document.documentElement.style.setProperty('--yam-vv-offset', `${offset}px`);

  // علامة تشير لوجود لوحة مفاتيح مفتوحة (تفيد في تعطيل bottom nav مثلاً)
  if (vv && window.innerHeight - vv.height > 150) {
    document.documentElement.dataset.keyboard = 'open';
  } else {
    delete document.documentElement.dataset.keyboard;
  }
}

export function initializeViewportTracker() {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  syncViewportVar();

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', syncViewportVar);
    vv.addEventListener('scroll', syncViewportVar);
  }

  window.addEventListener('resize', syncViewportVar, { passive: true });
  window.addEventListener('orientationchange', syncViewportVar, { passive: true });
}

export default function useViewportHeight() {
  // الـ hook يضمن التهيئة، لكنه آمن للاستدعاء المتكرر
  if (typeof window !== 'undefined' && !initialized) {
    initializeViewportTracker();
  }
}
