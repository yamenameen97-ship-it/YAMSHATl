/**
 * Yamshat — Instant Touch Feedback (v52)
 * =====================================================
 * يُحوّل تجربة الجوال من "صفحة ويب" إلى "تطبيق أصلي" عبر:
 *
 *  1) إزالة تأخير 300ms على المتصفحات القديمة (FastClick-like)
 *  2) إضافة كلاس .is-scrolling على <html> أثناء السحب
 *     → يُمكّن CSS من إيقاف backdrop-filter ديناميكياً
 *  3) ضمان passive listeners عالمية للأداء (60fps scrolling)
 *  4) منع double-tap zoom على iOS عبر event.preventDefault الذكي
 *  5) معالج لمنع contextmenu غير المرغوب من long-press على Android
 *  6) تحسين الـ rubber-band عند الوصول لطرفي الصفحة
 *  7) رد فعل haptic خفيف عند النقر على عناصر مهمة (إذا متاح)
 *
 * التفعيل: instantTouchFeedback.init()  — مرة واحدة من main.jsx
 * =====================================================
 */

const SCROLLING_CLASS = 'is-scrolling';
const TOUCH_ACTIVE_CLASS = 'ym-touch-active';
const SCROLL_END_DELAY = 140; // ms — بعد توقف السحب نزيل الكلاس
const TAP_THRESHOLD_PX = 10;   // أقصى حركة مسموحة لاعتبار اللمس "نقرة"
const TAP_THRESHOLD_MS = 250;  // أقصى مدة لاعتبار اللمس "نقرة"
const DOUBLE_TAP_PREVENT_MS = 350; // فترة منع double-tap zoom على iOS

class InstantTouchFeedback {
  constructor() {
    this.initialized = false;
    this.scrollEndTimer = null;
    this.lastTouchEnd = 0;
    this.touchStart = null;
    this.cleanupFns = [];
  }

  init(options = {}) {
    if (this.initialized) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // فقط على الأجهزة اللمسية
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice && !options.force) {
      // على أجهزة الديسكتوب نكتفي بالنقرة العادية
      this.initialized = true;
      return;
    }

    this._setupScrollDetection();
    this._setupDoubleTapPrevention();
    this._setupContextMenuPrevention();
    this._setupActiveStateBoost();
    this._setupGlobalPassiveDefaults();
    this._setupPWAGestures();
    this._setupHapticOnImportantTaps();

    this.initialized = true;

    if (window.console && window.__YAMSHAT_DEBUG_TOUCH) {
      console.log('[Yamshat] Instant Touch Feedback v52 activated');
    }
  }

  /**
   * 1) إضافة .is-scrolling على <html> أثناء السحب
   *    يسمح للـ CSS بإيقاف backdrop-filter لتحسين الأداء
   */
  _setupScrollDetection() {
    const html = document.documentElement;

    const onScrollOrTouchMove = () => {
      if (!html.classList.contains(SCROLLING_CLASS)) {
        html.classList.add(SCROLLING_CLASS);
      }
      if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = setTimeout(() => {
        html.classList.remove(SCROLLING_CLASS);
      }, SCROLL_END_DELAY);
    };

    // passive: true → لا يحجب الـ thread الرئيسي
    window.addEventListener('scroll', onScrollOrTouchMove, { passive: true, capture: true });
    window.addEventListener('touchmove', onScrollOrTouchMove, { passive: true, capture: true });
    window.addEventListener('wheel', onScrollOrTouchMove, { passive: true, capture: true });

    this.cleanupFns.push(() => {
      window.removeEventListener('scroll', onScrollOrTouchMove, true);
      window.removeEventListener('touchmove', onScrollOrTouchMove, true);
      window.removeEventListener('wheel', onScrollOrTouchMove, true);
    });
  }

  /**
   * 2) منع double-tap zoom على iOS (يسبب تأخير 300ms في بعض النسخ القديمة)
   *    نمنع zoom فقط عند تكرار اللمس السريع، ولا نمنع pinch-zoom.
   */
  _setupDoubleTapPrevention() {
    const onTouchEnd = (e) => {
      const now = Date.now();
      if (now - this.lastTouchEnd <= DOUBLE_TAP_PREVENT_MS) {
        // التحقق أن العنصر ليس input أو area قابل للتحرير
        const target = e.target;
        if (
          target &&
          !target.closest('input, textarea, [contenteditable="true"], select')
        ) {
          // منع الـ zoom المزدوج فقط
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
      this.lastTouchEnd = now;
    };

    document.addEventListener('touchend', onTouchEnd, { passive: false });
    this.cleanupFns.push(() => {
      document.removeEventListener('touchend', onTouchEnd);
    });
  }

  /**
   * 3) منع قائمة contextmenu من long-press على الصور والأيقونات
   *    (لكن نسمح بها في الحقول والنصوص)
   */
  _setupContextMenuPrevention() {
    const onContextMenu = (e) => {
      const target = e.target;
      if (!target) return;

      // السماح بـ contextmenu في الحقول والنصوص القابلة للاختيار
      if (
        target.closest(
          'input, textarea, [contenteditable="true"], select, .selectable, .message-text, .post-text, .user-content, code, pre'
        )
      ) {
        return;
      }

      // منع contextmenu على الصور والأزرار والروابط (يشبه التطبيق الأصلي)
      if (
        target.closest(
          'img, button, a, [role="button"], .yam-action-btn, .ym-btn, .story-circle'
        )
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', onContextMenu, false);
    this.cleanupFns.push(() => {
      document.removeEventListener('contextmenu', onContextMenu);
    });
  }

  /**
   * 4) رد فعل بصري فوري عند اللمس على عناصر بدون :active مرئي
   *    (نضيف data-touch-active فوراً عند touchstart)
   */
  _setupActiveStateBoost() {
    const selectorList = [
      'button',
      'a',
      '[role="button"]',
      '[role="tab"]',
      '.btn',
      '.ym-btn',
      '.ym-filter-pill-new',
      '.ym-footer-btn',
      '.yam-bottom-nav-item',
      '.yam-action-btn',
      '.yam-list-row',
      '.story-circle',
      '.tab-pill',
      '.clickable',
      '[data-clickable="true"]',
    ];
    const selector = selectorList.join(',');

    const setActive = (el) => {
      if (!el || el.dataset.touchActive === '1') return;
      el.dataset.touchActive = '1';
    };
    const clearActive = (el) => {
      if (!el) return;
      el.dataset.touchActive = '0';
    };

    let currentActive = null;

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      if (!touch) return;

      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        t: Date.now(),
      };

      const target = e.target && e.target.closest && e.target.closest(selector);
      if (target) {
        currentActive = target;
        setActive(target);
      }
    };

    const onTouchMove = (e) => {
      if (!this.touchStart || !currentActive) return;
      const touch = e.touches[0];
      if (!touch) return;

      const dx = Math.abs(touch.clientX - this.touchStart.x);
      const dy = Math.abs(touch.clientY - this.touchStart.y);

      // إذا تحرك المستخدم — يبدو أنها عملية سحب، نلغي حالة active
      if (dx > TAP_THRESHOLD_PX || dy > TAP_THRESHOLD_PX) {
        clearActive(currentActive);
        currentActive = null;
      }
    };

    const onTouchEndOrCancel = () => {
      if (currentActive) {
        // تأخير بسيط لإظهار رد الفعل البصري قبل الإزالة
        const el = currentActive;
        setTimeout(() => clearActive(el), 80);
      }
      currentActive = null;
      this.touchStart = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    document.addEventListener('touchend', onTouchEndOrCancel, { passive: true, capture: true });
    document.addEventListener('touchcancel', onTouchEndOrCancel, { passive: true, capture: true });

    this.cleanupFns.push(() => {
      document.removeEventListener('touchstart', onTouchStart, true);
      document.removeEventListener('touchmove', onTouchMove, true);
      document.removeEventListener('touchend', onTouchEndOrCancel, true);
      document.removeEventListener('touchcancel', onTouchEndOrCancel, true);
    });
  }

  /**
   * 5) تفعيل passive listeners كافتراضي لتسريع التمرير على المتصفحات
   *    التي لا تدعم الافتراض الجديد. نُخبر المتصفح أن معالجاتنا لا تستدعي preventDefault
   */
  _setupGlobalPassiveDefaults() {
    // متصفحات حديثة: touchstart/touchmove على document = passive افتراضياً
    // لكن بعض المكتبات تُسجّل listeners بـ passive: false → نراقبها

    // لا نُعدّل addEventListener عالمياً (مخاطرة)، نضيف فقط hint عبر CSS touch-action
    // (تم في mobile-touch-app-feel-v52.css)
  }

  /**
   * 6) تحسين تجربة PWA — منع navigation gestures الجانبية على Android
   */
  _setupPWAGestures() {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (!isStandalone) return;

    document.documentElement.classList.add('ym-pwa-mode');

    // منع السحب الجانبي للرجوع داخل PWA
    let startX = 0;
    const onTouchStart = (e) => {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 0) return;
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;

      // إذا بدأ السحب من حافة الشاشة (< 20px) وتحرك للداخل، نمنعه
      // (يمنع gesture back على Android)
      if (startX < 20 && deltaX > 30 && e.cancelable) {
        e.preventDefault();
      }
      // ومن الحافة اليمنى (RTL)
      const innerWidth = window.innerWidth;
      if (startX > innerWidth - 20 && deltaX < -30 && e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    this.cleanupFns.push(() => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
    });
  }

  /**
   * 7) Haptic خفيف جداً (5ms) عند النقر على أزرار رئيسية
   *    — فقط إذا كان الجهاز يدعم vibrate وداخل PWA
   */
  _setupHapticOnImportantTaps() {
    if (!('vibrate' in navigator)) return;
    if (!window.matchMedia('(display-mode: standalone)').matches) return;

    const importantSelectors = [
      '.yam-send-btn',
      '.yam-bottom-nav-item',
      '.ym-footer-btn[data-haptic="true"]',
      '[data-haptic="true"]',
    ].join(',');

    const onClick = (e) => {
      const target = e.target && e.target.closest && e.target.closest(importantSelectors);
      if (!target) return;

      try {
        navigator.vibrate(5); // 5ms فقط — غير محسوس لكن يعطي إحساس "تطبيق"
      } catch {
        // ignore
      }
    };

    document.addEventListener('click', onClick, { passive: true, capture: false });
    this.cleanupFns.push(() => {
      document.removeEventListener('click', onClick);
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

export const instantTouchFeedback = new InstantTouchFeedback();
export default instantTouchFeedback;
