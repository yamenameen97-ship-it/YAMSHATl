/**
 * Yamshat — PAW Touch Enhancer (v71 — ROOT FIX)
 * =====================================================
 * إعادة كتابة جذرية للحل الذي كان يسبب:
 *   - بطء فتح النوافذ (Modal)
 *   - عدم استجابة اللمس بعد فترة
 *   - تأخر ظهور الملف الشخصي
 *
 * المشاكل في الإصدار السابق (v58):
 *   1) MutationObserver كان يراقب كل تغيير في DOM (subtree:true) → يطلق
 *      آلاف المرات أثناء التمرير/الكتابة → يستهلك Main Thread.
 *   2) Patch لـ history.pushState/replaceState → تعارض مع React Router.
 *   3) setInterval كل 3 ثواني يفحص getComputedStyle على كل بطاقة منشور →
 *      يسبب style recalc مكلف ويمنع رد الفعل الفوري للمس.
 *   4) MutationObserver ثانية على body attributes → تطلق على كل toggle لكلاس.
 *
 * الإصدار الجديد:
 *   - لا MutationObserver عام (نعتمد على CSS وأحداث route فقط).
 *   - لا setInterval — نُصلح pointer-events فقط على الطلب.
 *   - تطبيق واحد سريع عند load + بعد كل تنقل route (popstate/hashchange فقط).
 *   - استخدام querySelectorAll لمرة واحدة بدون subtree watching.
 * =====================================================
 */

const FEED_SELECTORS = [
  '.ym-feed',
  '.ym-feed-mobile',
  '.ym-posts-list',
  '.feed-container',
  '.feed-list',
  '.posts-list',
  '[data-page="feed"]',
  '[data-page="posts"]',
  '[data-page="home"]',
  '.ym-ptr-container',
  '.ym-ptr-content',
];

class PawTouchEnhancer {
  constructor() {
    this.initialized = false;
    this.cleanupFns = [];
  }

  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice) {
      this.initialized = true;
      return;
    }

    this._applyOnce();
    this._watchRouteChanges();
    this._fixStuckBodyAfterModalClose();

    this.initialized = true;
  }

  /**
   * تطبيق واحد سريع لإصلاح touch-action و pointer-events على حاويات الـ feed
   * فقط — بدون مراقبة مستمرة (لا MutationObserver، لا setInterval).
   */
  _applyOnce = () => {
    try {
      const containers = document.querySelectorAll(FEED_SELECTORS.join(','));
      containers.forEach((el) => {
        const ta = el.style.touchAction;
        if (ta === 'none' || ta === '') {
          el.style.touchAction = 'pan-y';
        }
        if (el.style.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
      });

      // التأكد أن body/html لا يحملون touchAction: none
      const html = document.documentElement;
      const body = document.body;
      if (html.style.touchAction === 'none') {
        html.style.touchAction = 'pan-x pan-y';
      }
      if (body.style.touchAction === 'none') {
        body.style.touchAction = 'pan-x pan-y';
      }
    } catch {
      /* ignore */
    }
  };

  /**
   * نراقب تغير الراوت فقط عبر popstate و hashchange — بدون patch لـ history API
   * (الـ patch السابق كان يسبب تعارضات مع React Router).
   */
  _watchRouteChanges() {
    let routeFixTimer = null;
    const scheduleFix = () => {
      if (routeFixTimer) clearTimeout(routeFixTimer);
      // تأخير صغير ليتم render الصفحة الجديدة أولاً
      routeFixTimer = setTimeout(this._applyOnce, 300);
    };

    window.addEventListener('popstate', scheduleFix);
    window.addEventListener('hashchange', scheduleFix);

    this.cleanupFns.push(() => {
      window.removeEventListener('popstate', scheduleFix);
      window.removeEventListener('hashchange', scheduleFix);
      if (routeFixTimer) clearTimeout(routeFixTimer);
    });
  }

  /**
   * إصلاح body العالق بعد إغلاق modal — نراقب class change فقط (بدون subtree).
   * هذا خفيف جداً ولا يضر بالأداء.
   */
  _fixStuckBodyAfterModalClose() {
    if (typeof MutationObserver === 'undefined') return;

    const fixIfStuck = () => {
      const body = document.body;
      const hasOpenModal =
        body.classList.contains('modal-open') ||
        body.classList.contains('is-chat-open') ||
        body.classList.contains('drawer-open') ||
        body.classList.contains('sheet-open');

      if (!hasOpenModal && body.style.position === 'fixed') {
        const scrollY = parseInt(body.style.top || '0', 10) || 0;
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        body.style.overflow = '';
        if (scrollY) {
          window.scrollTo(0, -scrollY);
        }
      }
    };

    const observer = new MutationObserver(fixIfStuck);
    // مراقبة class فقط على body — لا subtree، لا childList
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: false,
      childList: false,
    });

    this.cleanupFns.push(() => {
      try { observer.disconnect(); } catch { /* ignore */ }
    });
  }

  destroy() {
    this.cleanupFns.forEach((fn) => {
      try { fn(); } catch { /* ignore */ }
    });
    this.cleanupFns = [];
    this.initialized = false;
  }
}

export const pawTouchEnhancer = new PawTouchEnhancer();
export default pawTouchEnhancer;
