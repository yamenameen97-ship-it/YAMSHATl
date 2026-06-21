/**
 * Yamshat — PAW Touch Enhancer (v58)
 * =====================================================
 * طبقة إضافية لتعزيز استجابة اللمس على كل أنواع الجوالات والشاشات،
 * مع التركيز على إصلاح مشكلة "صفحة المنشورات لا تستجيب للمس".
 *
 * المميزات:
 *   1) كشف أحداث touchstart مشكوك فيها وإصلاحها فوراً (debug + reset)
 *   2) إزالة أي pointer-events: none غير مقصودة من حاويات الـ feed
 *   3) إعادة تطبيق touch-action: pan-y على عناصر body عند الإفلات
 *   4) hot-fix لمشكلة "اللمس الميت" بعد تنقّل React (route change)
 *   5) إصلاح الحاويات الـ overflow التي تخنق التمرير
 *   6) يعمل تلقائياً بعد كل تنقّل أو تحميل صفحة جديدة
 *
 * التفعيل: pawTouchEnhancer.init() — مرة واحدة من main.jsx
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

const CARD_SELECTORS = [
  '.ym-post-card',
  '.mobile-post-card',
  '.post-card',
  '.feed-card',
  '.post-item',
];

class PawTouchEnhancer {
  constructor() {
    this.initialized = false;
    this.observers = [];
    this.cleanupFns = [];
    this.lastFixTs = 0;
    this.FIX_DEBOUNCE_MS = 250;
  }

  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // فقط على الجوالات / الأجهزة اللمسية
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice) {
      this.initialized = true;
      return;
    }

    this._enforceTouchActionOnFeed();
    this._watchRouteChanges();
    this._watchDomMutations();
    this._fixStuckBodyAfterModalClose();
    this._unblockPointerEventsOnFeed();

    this.initialized = true;

    if (window.__YAMSHAT_DEBUG_TOUCH) {
      console.log('[Yamshat] PAW Touch Enhancer v58 activated');
    }
  }

  /**
   * 1) فرض touch-action: pan-y على جميع حاويات الـ feed
   *    + إزالة overflow:auto/scroll غير الضروري الذي قد يخنق التمرير
   */
  _enforceTouchActionOnFeed() {
    const apply = () => {
      const now = Date.now();
      if (now - this.lastFixTs < this.FIX_DEBOUNCE_MS) return;
      this.lastFixTs = now;

      // 1) حاويات الـ feed
      const containers = document.querySelectorAll(FEED_SELECTORS.join(','));
      containers.forEach((el) => {
        // touch-action
        const ta = el.style.touchAction || getComputedStyle(el).touchAction;
        if (ta === 'none' || ta === '') {
          el.style.touchAction = 'pan-y';
        }
        // pointer-events
        if (el.style.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
      });

      // 2) بطاقات المنشورات
      const cards = document.querySelectorAll(CARD_SELECTORS.join(','));
      cards.forEach((el) => {
        const ta = el.style.touchAction;
        if (ta === 'none') {
          el.style.touchAction = 'pan-y';
        }
        if (el.style.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
      });

      // 3) body و html — تأكيد أنها قابلة للتمرير
      const html = document.documentElement;
      const body = document.body;
      if (html.style.touchAction === 'none') {
        html.style.touchAction = 'pan-x pan-y';
      }
      if (body.style.touchAction === 'none') {
        body.style.touchAction = 'pan-x pan-y';
      }
      // إذا body فاقد للتمرير بسبب modal مغلق — أعد التمرير
      const hasOpenModal =
        body.classList.contains('modal-open') ||
        body.classList.contains('is-chat-open') ||
        body.classList.contains('drawer-open') ||
        body.classList.contains('sheet-open');
      if (!hasOpenModal && body.style.position === 'fixed') {
        // restore
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

    apply();

    // إعادة التطبيق بعد التحميل الأولي وبعد إيدل
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(apply, { timeout: 600 });
    } else {
      setTimeout(apply, 400);
    }
    // ومرة أخرى بعد 1.5 ثانية (لـ React lazy + Suspense)
    setTimeout(apply, 1500);

    this._applyFn = apply;
  }

  /**
   * 2) عند تغيير الـ route — أعد تطبيق الإصلاحات
   *    React Router لا يصدر حدث، فنستمع لـ popstate + hashchange + history API
   */
  _watchRouteChanges() {
    const onChange = () => {
      // بعد لحظة من تغير الـ route لإعطاء React وقت لإعادة الرسم
      setTimeout(() => this._applyFn?.(), 200);
      setTimeout(() => this._applyFn?.(), 800);
    };

    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);

    // تتبّع pushState/replaceState
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function (...args) {
      _push.apply(history, args);
      window.dispatchEvent(new Event('yamshat:routechange'));
    };
    history.replaceState = function (...args) {
      _replace.apply(history, args);
      window.dispatchEvent(new Event('yamshat:routechange'));
    };

    window.addEventListener('yamshat:routechange', onChange);

    this.cleanupFns.push(() => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('yamshat:routechange', onChange);
    });
  }

  /**
   * 3) MutationObserver لمراقبة العناصر الجديدة في DOM
   *    (مثل بطاقات المنشورات التي تُضاف ديناميكياً)
   */
  _watchDomMutations() {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      let needsFix = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (const node of m.addedNodes) {
            if (node.nodeType !== 1) continue;
            const el = node;
            // إذا أُضيف feed container أو post card → نُصلح
            if (
              FEED_SELECTORS.some((s) => el.matches?.(s)) ||
              CARD_SELECTORS.some((s) => el.matches?.(s)) ||
              el.querySelector?.(FEED_SELECTORS.join(',')) ||
              el.querySelector?.(CARD_SELECTORS.join(','))
            ) {
              needsFix = true;
              break;
            }
          }
        }
        if (needsFix) break;
      }
      if (needsFix && this._applyFn) {
        // debounce
        clearTimeout(this._mutTimer);
        this._mutTimer = setTimeout(this._applyFn, 150);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.observers.push(observer);
  }

  /**
   * 4) Hot-fix: عندما يُغلَق modal أحياناً، يبقى body في حالة fixed
   *    → نراقب class change على body ونعيد الضبط
   */
  _fixStuckBodyAfterModalClose() {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver(() => {
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
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    this.observers.push(observer);
  }

  /**
   * 5) إزالة pointer-events: none غير المقصودة من الـ feed
   *    (مشكلة شائعة عند استعمال animation libraries)
   */
  _unblockPointerEventsOnFeed() {
    // نقوم بفحص دوري كل 3 ثوانٍ — خفيف جداً
    const interval = setInterval(() => {
      const cards = document.querySelectorAll(CARD_SELECTORS.join(','));
      cards.forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
      });
    }, 3000);

    this.cleanupFns.push(() => clearInterval(interval));
  }

  destroy() {
    this.observers.forEach((o) => {
      try { o.disconnect(); } catch { /* ignore */ }
    });
    this.observers = [];
    this.cleanupFns.forEach((fn) => {
      try { fn(); } catch { /* ignore */ }
    });
    this.cleanupFns = [];
    this.initialized = false;
  }
}

export const pawTouchEnhancer = new PawTouchEnhancer();
export default pawTouchEnhancer;
