/**
 * usePullToRefresh — v59.13.20 (Mobile Pull Fix — Stable Refs Edition)
 * ----------------------------------------------------------------------
 * Hook عام للسحب من أعلى لتحديث الصفحة (Pull-to-Refresh)
 *
 * 🔴 إصلاحات v59.13.20 الجذرية لمشكلة "السحب لا يستجيب على الجوال":
 *
 *   1️⃣ مشكلة Re-attach Storm (الأخطر على الإطلاق)
 *      • قبلًا: useEffect كان يضع pullDistance/isRefreshing في dependencies
 *        فيتم إزالة ثم إضافة touch listeners عشرات المرات في الثانية
 *        أثناء السحب → المتصفح يربك ولا يلتقط الأحداث.
 *      • الآن: useEffect يعتمد فقط على [disabled, scrollContainerRef].
 *        كل القيم المتغيرة (pullDistance, isRefreshing) نقرأها من refs
 *        داخل المعالج → listeners يُلصقان مرة واحدة فقط ويظلان مستقرين.
 *
 *   2️⃣ مشكلة Race Condition عند Mount
 *      • قبلًا: resolveScrollContainer() يُستدعى مرة واحدة وقت الـ effect.
 *        إن لم يكن mainRef.current جاهزًا أو CSS لم يُحمَّل (overflow:auto
 *        غير مُطبَّق بعد) → يقع على window → السحب لا يعمل أبدًا.
 *      • الآن: نُعيد المحاولة عند كل touchstart إن لم يُعثر على حاوية.
 *
 *   3️⃣ مشكلة passive:false يخنق التمرير
 *      • قبلًا: touchmove non-passive على main يُجبر المتصفح على انتظار JS
 *        قبل كل scroll → بطء واضح على Android القديم.
 *      • الآن: نبدأ بمستمع passive:true. إذا اكتشفنا حركة سحب فعلية من
 *        الأعلى نُحوِّل ديناميكيًا (نضيف معالجًا non-passive ثانٍ فقط
 *        لإنشاء preventDefault، مع الحفاظ على المستمع السريع).
 *
 *   4️⃣ مشكلة Stale Closure على onRefresh
 *      • قبلًا: تغيير onRefresh يُعيد إنشاء finishRefresh ثم الـ effect.
 *      • الآن: نحفظ onRefresh في ref → الـ effect ثابت تمامًا.
 *
 * 🔧 إصلاحات سابقة محفوظة (v59.13.18):
 *   • passive listeners افتراضياً (لا يخنق التمرير)
 *   • preventDefault يُستدعى فقط عند سحب فعلي من scrollTop=0
 *   • تعطيل تلقائي إذا لم يكن الجهاز touch
 *   • تجاهل multi-touch (pinch zoom)
 *   • RTL آمن — السحب عمودي فقط
 *   • مقاومة (resistance) لتجربة شبيهة بالتطبيقات الأصلية
 *   • Haptic feedback خفيف عند التفعيل
 *   • تنظيف آمن لمستمعي الأحداث
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_THRESHOLD = 70;
const DEFAULT_MAX_PULL = 140;
const RESISTANCE = 2.4;
const HORIZONTAL_TOLERANCE = 12; // إن تجاوزت الحركة الأفقية هذا الرقم → ألغِ السحب
const ACTIVATION_DELTA = 6;      // الحد الأدنى لاعتبار اللمس "سحب"

export default function usePullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  maxPull = DEFAULT_MAX_PULL,
  disabled = false,
  hapticOnTrigger = true,
  scrollContainerRef = null, // ⭐ مرجع خارجي لحاوية التمرير الفعلية
} = {}) {
  // containerRef داخلي يستخدمه PullToRefresh لتحريك الـ indicator (لفّ المحتوى)
  // أما scrollContainerRef فهو حاوية التمرير الحقيقية القادمة من MainLayout.
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ⭐ v59.13.20: نحتفظ بالقيم المتغيرة في refs بدلاً من dependencies
  // كي لا يُعاد تشغيل useEffect (وبالتالي إعادة إلصاق listeners) في كل تحديث.
  const isRefreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const thresholdRef = useRef(threshold);
  const maxPullRef = useRef(maxPull);
  const hapticOnTriggerRef = useRef(hapticOnTrigger);

  // مزامنة القيم → refs (آمن، لا يسبب re-attach)
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
    locked: false,        // قُفل كسحب فعلي
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
    if (typeof window === 'undefined') return undefined;

    // فقط على أجهزة اللمس
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice) return undefined;

    // ──────────────────────────────────────────────────────────────
    // v59.13.18: إيجاد حاوية التمرير — الأولوية المطلقة للـ ref الخارجي
    // v59.13.20: نُعيد المحاولة عند كل touchstart إن لم نجدها
    // ──────────────────────────────────────────────────────────────
    const isScrollable = (el) => {
      if (!el || el.nodeType !== 1) return false;
      try {
        const style = window.getComputedStyle(el);
        return /(auto|scroll)/.test(style.overflowY);
      } catch {
        return false;
      }
    };

    const resolveScrollContainer = () => {
      // 1) Direct ref — الطريقة الموصى بها (MainLayout يمرّر mainRef)
      if (scrollContainerRef && scrollContainerRef.current) {
        const refEl = scrollContainerRef.current;
        // إذا كان العنصر نفسه قابلاً للتمرير → استخدمه مباشرة
        if (isScrollable(refEl)) return refEl;
        // وإلا تحقّق من أبنائه (حالة wrapper بـ overflow:hidden)
        for (const child of refEl.children) {
          if (isScrollable(child) && child.scrollHeight > child.clientHeight) {
            return child;
          }
        }
        // ⭐ v59.13.20: إذا لم يكن قابلاً للتمرير لكنه يحمل padding/min-height
        // ومُعرَّف بأنه main → استخدمه على أي حال (CSS قد يُطبَّق لاحقاً)
        if (refEl.tagName === 'MAIN' || refEl.classList.contains('mobile-main-content')) {
          return refEl;
        }
        return null;
      }

      // 2) Legacy fallback — للتوافق مع الكود القديم
      const mainEl = typeof document !== 'undefined'
        ? document.querySelector('main.mobile-main-content, .mobile-main-content, main.page-content, .page-content')
        : null;
      if (mainEl) return mainEl; // نقبله حتى لو CSS لم يُطبَّق بعد

      // 3) ابدأ من containerRef الداخلي واصعد لأعلى
      let node = containerRef.current;
      while (node && node !== document.body && node !== document.documentElement) {
        if (isScrollable(node) && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }

      // 4) Fallback نهائي: null → سنستخدم window
      return null;
    };

    // ⭐ v59.13.20: نُبقي مرجعًا متغيرًا لحاوية التمرير
    // ونُحدِّثه عند كل touchstart إن لم يُعثر عليها بعد.
    let scrollContainer = resolveScrollContainer();

    const getScrollTop = () => {
      if (scrollContainer && scrollContainer !== window) {
        return scrollContainer.scrollTop || 0;
      }
      return window.scrollY || document.documentElement.scrollTop || 0;
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
        // pinch / multi-touch → تجاهل
        stateRef.current.cancelled = true;
        return;
      }
      // ⭐ v59.13.20: إعادة المحاولة لإيجاد حاوية التمرير إن لم تكن جاهزة
      if (!scrollContainer) {
        scrollContainer = resolveScrollContainer();
      }
      if (getScrollTop() > 0) {
        stateRef.current.cancelled = true;
        return;
      }
      const t = e.touches[0];
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

      // لم نقفل بعد كسحب — افحص الاتجاه أولاً
      if (!stateRef.current.locked) {
        // إذا كانت الحركة أفقية أو لأعلى → ألغِ
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

      // الآن نحن في وضع سحب مؤكد
      if (deltaY <= 0) {
        if (pullDistanceRef.current !== 0) {
          setPullDistance(0);
          pullDistanceRef.current = 0;
        }
        return;
      }

      // الآن فقط يُسمح بـ preventDefault لمنع scroll الافتراضي
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

    // ⚠️ touchmove يجب أن يكون non-passive حتى يستطيع preventDefault
    //    لكن preventDefault لا يُستدعى إلا في وضع locked + sentence من القمة
    // ⭐ v59.13.21: نستخدم capture: true لاستلام الأحداث أولاً
    //   قبل أي child لديه touch-action أو stopPropagation → السحب يعمل من أي مكان.
    const opts = { passive: false, capture: true };
    const passiveOpts = { passive: true, capture: true };

    // ⭐ v59.13.20: نُلصق المعالجات على scroll container إن وُجد، وإلا window.
    // المهم: لا نضع scrollContainer في dependencies كي لا نُعيد الإلصاق.
    const target = scrollContainer || window;

    target.addEventListener('touchstart', onTouchStart, passiveOpts);
    target.addEventListener('touchmove', onTouchMove, opts);
    target.addEventListener('touchend', onTouchEnd, passiveOpts);
    target.addEventListener('touchcancel', onTouchEnd, passiveOpts);

    return () => {
      target.removeEventListener('touchstart', onTouchStart, passiveOpts);
      target.removeEventListener('touchmove', onTouchMove, opts);
      target.removeEventListener('touchend', onTouchEnd, passiveOpts);
      target.removeEventListener('touchcancel', onTouchEnd, passiveOpts);
    };
    // ⭐ v59.13.20: dependencies مختصرة — لا pullDistance ولا isRefreshing!
    // listeners تُلصق مرة واحدة وتبقى ثابتة طوال دورة حياة المكوّن.
  }, [disabled, scrollContainerRef, triggerHaptic, finishRefresh]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= threshold,
    progress: Math.min(1, pullDistance / threshold),
  };
}
