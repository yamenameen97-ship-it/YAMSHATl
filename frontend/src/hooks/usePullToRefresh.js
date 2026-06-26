/**
 * usePullToRefresh — v59.13.22 (Mobile Pull Anywhere Edition)
 * ----------------------------------------------------------------------
 * Hook عام للسحب من أعلى لتحديث الصفحة (Pull-to-Refresh)
 *
 * 🔴 إصلاح v59.13.22 — مشكلة "السحب يعمل فقط من حواف الشاشة":
 *
 *   السبب الجذري:
 *   - في v59.13.20/21 كانت المعالجات تُلصق على `main.mobile-main-content`
 *     فقط (مع capture:true).
 *   - أي عنصر فرعي يستخدم stopPropagation أو touch-action مخالف
 *     (بطاقات منشورات، صور، فيديو، أزرار، sliders) كان يستهلك الحدث
 *     قبل أن يصل إلى main → السحب يعمل فقط من الحواف الفارغة.
 *
 *   الحل في v59.13.22:
 *   - نُلصق المعالجات على `document` (capture:true) → نضمن استلام
 *     الـ touchstart/touchmove قبل أي عنصر فرعي مهما فعل.
 *   - نستخدم `scrollContainer.scrollTop` لمعرفة هل نحن في القمة قبل
 *     تفعيل السحب — هذا يحفظ السلوك الصحيح: السحب يبدأ فقط عند top=0.
 *   - النتيجة: المستخدم يستطيع السحب من أي موضع في الصفحة (بطاقة منشور،
 *     صورة، نص...) ما دامت الصفحة في القمة.
 *
 * 🔧 إصلاحات سابقة محفوظة (v59.13.20):
 *   • Stable refs (لا re-attach storm)
 *   • passive opportunistic
 *   • Stale closure مُحلولة
 *   • Race condition عند mount مُحلولة
 *
 * 🔧 إصلاحات أقدم (v59.13.18):
 *   • passive listeners افتراضياً
 *   • preventDefault فقط عند سحب فعلي من scrollTop=0
 *   • تعطيل تلقائي إذا لم يكن الجهاز touch
 *   • تجاهل multi-touch (pinch zoom)
 *   • RTL آمن — السحب عمودي فقط
 *   • Resistance لتجربة شبيهة بالتطبيقات الأصلية
 *   • Haptic feedback خفيف عند التفعيل
 *   • تنظيف آمن لمستمعي الأحداث
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_THRESHOLD = 70;
const DEFAULT_MAX_PULL = 140;
const RESISTANCE = 2.4;
const HORIZONTAL_TOLERANCE = 12;
const ACTIVATION_DELTA = 6;

export default function usePullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  maxPull = DEFAULT_MAX_PULL,
  disabled = false,
  hapticOnTrigger = true,
  scrollContainerRef = null,
} = {}) {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // refs مستقرة — تجنّب re-attach storm
  const isRefreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const thresholdRef = useRef(threshold);
  const maxPullRef = useRef(maxPull);
  const hapticOnTriggerRef = useRef(hapticOnTrigger);

  useEffect(() => { isRefreshingRef.current = isRefreshing; }, [isRefreshing]);
  useEffect(() => { pullDistanceRef.current = pullDistance; }, [pullDistance]);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);
  useEffect(() => { maxPullRef.current = maxPull; }, [maxPull]);
  useEffect(() => { hapticOnTriggerRef.current = hapticOnTrigger; }, [hapticOnTrigger]);

  const stateRef = useRef({
    startY: 0,
    startX: 0,
    active: false,
    locked: false,
    triggered: false,
    cancelled: false,
  });

  const triggerHaptic = useCallback(() => {
    if (!hapticOnTriggerRef.current) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const finishRefresh = useCallback(async () => {
    setIsRefreshing(true);
    isRefreshingRef.current = true;
    try {
      if (typeof onRefreshRef.current === 'function') {
        await onRefreshRef.current();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[usePullToRefresh] onRefresh failed:', err);
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (disabled) return undefined;
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice) return undefined;

    const isScrollable = (el) => {
      if (!el || el.nodeType !== 1) return false;
      try {
        const style = window.getComputedStyle(el);
        return /(auto|scroll)/.test(style.overflowY);
      } catch {
        return false;
      }
    };

    // ──────────────────────────────────────────────────────────────
    // إيجاد حاوية التمرير الفعلية (main.mobile-main-content)
    // ──────────────────────────────────────────────────────────────
    const resolveScrollContainer = () => {
      if (scrollContainerRef && scrollContainerRef.current) {
        const refEl = scrollContainerRef.current;
        if (isScrollable(refEl)) return refEl;
        for (const child of refEl.children) {
          if (isScrollable(child) && child.scrollHeight > child.clientHeight) {
            return child;
          }
        }
        if (refEl.tagName === 'MAIN' || refEl.classList.contains('mobile-main-content')) {
          return refEl;
        }
        return null;
      }

      const mainEl = document.querySelector(
        'main.mobile-main-content, .mobile-main-content, main.page-content, .page-content'
      );
      if (mainEl) return mainEl;

      let node = containerRef.current;
      while (node && node !== document.body && node !== document.documentElement) {
        if (isScrollable(node) && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }

      return null;
    };

    let scrollContainer = resolveScrollContainer();

    const getScrollTop = () => {
      if (scrollContainer && scrollContainer !== window) {
        return scrollContainer.scrollTop || 0;
      }
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    // ⭐ v59.13.22: نتحقق أن النقطة التي بدأ منها اللمس داخل المنطقة
    // القابلة للتمرير (main) — وليس داخل الشريط العلوي أو السفلي أو drawer.
    const isPointInsideScrollArea = (clientX, clientY) => {
      if (!scrollContainer) return true;
      try {
        const rect = scrollContainer.getBoundingClientRect();
        // النقطة يجب أن تكون داخل الـ rect (مع هامش بسيط)
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      } catch {
        return true;
      }
    };

    // ⭐ v59.13.22: تجاهل اللمس إذا بدأ داخل modal/drawer/overlay مفتوح
    // أو داخل عنصر فيه data-no-pull أو أي scroller داخلي.
    const isInsideInteractiveOverlay = (target) => {
      if (!target || target.nodeType !== 1) return false;
      try {
        // overlays مفتوحة
        if (target.closest('[role="dialog"]:not([aria-hidden="true"])')) return true;
        if (target.closest('.modal:not([hidden]):not([aria-hidden="true"])')) return true;
        if (target.closest('.drawer:not([aria-hidden="true"])')) return true;
        if (target.closest('.bottom-sheet:not([aria-hidden="true"])')) return true;
        // ⭐ v59.13.22: عناصر تستثني نفسها من PTR صراحةً
        if (target.closest('[data-no-pull-to-refresh="true"]')) return true;
        // عناصر input/textarea (الكيبورد)
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (target.isContentEditable) return true;
        // ⭐ كاروسيلات/sliders/horizontal scrollers أفقية تستهلك اللمس
        // (شريط التصفية، قصص، ريلز sliders) — تجاهل السحب إذا بدأ داخلها
        const horizontalScroller = target.closest(
          '[data-horizontal-scroll="true"], .ym-filters, .stories-row, .reels-snap, [data-reels]'
        );
        if (horizontalScroller) return true;
        // ⭐ video element — يستهلك touch لتشغيل/إيقاف
        if (tag === 'VIDEO') return true;
        return false;
      } catch {
        return false;
      }
    };

    const reset = () => {
      stateRef.current.active = false;
      stateRef.current.locked = false;
      stateRef.current.triggered = false;
      stateRef.current.cancelled = false;
    };

    const onTouchStart = (e) => {
      if (isRefreshingRef.current) return;
      if (!e.touches || e.touches.length !== 1) {
        stateRef.current.cancelled = true;
        return;
      }
      // إعادة محاولة حلّ scroll container إن لم يكن جاهزاً
      if (!scrollContainer) {
        scrollContainer = resolveScrollContainer();
      }
      const t = e.touches[0];

      // ⭐ v59.13.22: تحقق صريح من أن اللمس داخل منطقة التمرير
      if (!isPointInsideScrollArea(t.clientX, t.clientY)) {
        stateRef.current.cancelled = true;
        return;
      }
      // ⭐ v59.13.22: تجاهل overlay/dialog/input/horizontal-scroller
      if (isInsideInteractiveOverlay(e.target)) {
        stateRef.current.cancelled = true;
        return;
      }
      // يجب أن نكون في قمة التمرير
      if (getScrollTop() > 0) {
        stateRef.current.cancelled = true;
        return;
      }

      stateRef.current.startY = t.clientY;
      stateRef.current.startX = t.clientX;
      stateRef.current.active = true;
      stateRef.current.locked = false;
      stateRef.current.triggered = false;
      stateRef.current.cancelled = false;
    };

    const onTouchMove = (e) => {
      if (stateRef.current.cancelled) return;
      if (!stateRef.current.active || isRefreshingRef.current) return;
      if (!e.touches || e.touches.length !== 1) {
        stateRef.current.cancelled = true;
        if (pullDistanceRef.current !== 0) {
          setPullDistance(0);
          pullDistanceRef.current = 0;
        }
        return;
      }

      const t = e.touches[0];
      const deltaY = t.clientY - stateRef.current.startY;
      const deltaX = t.clientX - stateRef.current.startX;

      if (!stateRef.current.locked) {
        if (Math.abs(deltaX) > HORIZONTAL_TOLERANCE || deltaY < ACTIVATION_DELTA) {
          if (deltaY < 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
            stateRef.current.cancelled = true;
            if (pullDistanceRef.current !== 0) {
              setPullDistance(0);
              pullDistanceRef.current = 0;
            }
            return;
          }
        }
        if (deltaY >= ACTIVATION_DELTA) {
          if (getScrollTop() > 0) {
            stateRef.current.cancelled = true;
            if (pullDistanceRef.current !== 0) {
              setPullDistance(0);
              pullDistanceRef.current = 0;
            }
            return;
          }
          stateRef.current.locked = true;
        } else {
          return;
        }
      }

      if (deltaY <= 0) {
        if (pullDistanceRef.current !== 0) {
          setPullDistance(0);
          pullDistanceRef.current = 0;
        }
        return;
      }

      if (e.cancelable) {
        try { e.preventDefault(); } catch { /* ignore */ }
      }

      const resisted = Math.min(maxPullRef.current, deltaY / RESISTANCE);
      pullDistanceRef.current = resisted;
      setPullDistance(resisted);

      const curThreshold = thresholdRef.current;
      if (!stateRef.current.triggered && resisted >= curThreshold) {
        stateRef.current.triggered = true;
        triggerHaptic();
      } else if (stateRef.current.triggered && resisted < curThreshold) {
        stateRef.current.triggered = false;
      }
    };

    const onTouchEnd = () => {
      if (!stateRef.current.active) {
        reset();
        return;
      }
      const wasTriggered = stateRef.current.triggered && stateRef.current.locked;
      reset();
      if (wasTriggered && !isRefreshingRef.current) {
        finishRefresh();
      } else {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    };

    // ⭐⭐⭐ v59.13.22: إلصاق المعالجات على document مع capture:true
    // - capture:true: نلتقط الحدث في مرحلة capture قبل أي child handler
    // - target=document: لا child يستطيع منعنا من استلام الحدث
    // - passive:false على touchmove (للتمكن من preventDefault بشكل شرطي)
    // - passive:true على touchstart/touchend (لا حاجة لـ preventDefault)
    //
    // النتيجة: السحب يعمل من أي موضع في الصفحة (بطاقة، صورة، نص...)
    // ما دامت الصفحة في القمة واللمس داخل main.
    const target = document;
    const moveOpts = { passive: false, capture: true };
    const passiveOpts = { passive: true, capture: true };

    target.addEventListener('touchstart', onTouchStart, passiveOpts);
    target.addEventListener('touchmove', onTouchMove, moveOpts);
    target.addEventListener('touchend', onTouchEnd, passiveOpts);
    target.addEventListener('touchcancel', onTouchEnd, passiveOpts);

    return () => {
      target.removeEventListener('touchstart', onTouchStart, passiveOpts);
      target.removeEventListener('touchmove', onTouchMove, moveOpts);
      target.removeEventListener('touchend', onTouchEnd, passiveOpts);
      target.removeEventListener('touchcancel', onTouchEnd, passiveOpts);
    };
  }, [disabled, scrollContainerRef, triggerHaptic, finishRefresh]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= threshold,
    progress: Math.min(1, pullDistance / threshold),
  };
}
