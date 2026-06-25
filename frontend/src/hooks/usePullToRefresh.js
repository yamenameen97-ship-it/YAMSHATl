/**
 * usePullToRefresh — v59.13.2 (Scroll-Container Aware)
 * ----------------------------------------------------
 * Hook عام للسحب من أعلى لتحديث الصفحة (Pull-to-Refresh)
 *
 * 🔧 إصلاح v59.13.2 (السبب الجذري لـ "الصفحات لا تستجيب للسحب"):
 *   • منذ v59.10 أصبح body/#root مقفول بـ overflow:hidden،
 *     والتمرير الفعلي يحدث داخل main.mobile-main-content فقط.
 *   • النسخة القديمة كانت تستمع على window و تفحص window.scrollY
 *     → window.scrollY = 0 دائماً → الـ hook يظنّ أن المستخدم
 *     في القمة في كل لمسة → يستدعي preventDefault على touchmove
 *     → يمنع التمرير الفعلي داخل main. (هذا هو سبب "لا يستجيب للسحب").
 *
 *   ✅ الحل: الاستماع على الـ scroll container الفعلي وفحص
 *      scrollTop الخاص به. نبحث عن:
 *        1) أقرب أب يحقّق overflow-y: auto/scroll (انطلاقاً من containerRef)
 *        2) إن لم يوجد → fallback إلى window.scrollY (سلوك v57 القديم)
 *
 * 🔧 إصلاح v57 (محفوظ):
 *   • يستخدم passive listeners افتراضياً (لا يخنق التمرير)
 *   • preventDefault يُستدعى فقط عند سحب فعلي من scrollTop=0
 *   • تعطيل تلقائي إذا لم يكن الجهاز touch
 *   • تجاهل multi-touch (pinch zoom)
 *
 * المميزات:
 *  ✓ يعمل فقط عندما يكون window scrollY = 0
 *  ✓ يدعم Touch events فقط (Pointer events تتداخل مع scroll)
 *  ✓ RTL آمن — السحب عمودي فقط
 *  ✓ مقاومة (resistance) لتجربة شبيهة بالتطبيقات الأصلية
 *  ✓ Haptic feedback خفيف عند التفعيل
 *  ✓ تنظيف آمن لمستمعي الأحداث
 *  ✓ آمن على iOS notch + Android safe-area
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
} = {}) {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const stateRef = useRef({
    startY: 0,
    startX: 0,
    active: false,
    locked: false,        // قُفل كسحب فعلي
    triggered: false,
    cancelled: false,
  });

  const triggerHaptic = useCallback(() => {
    if (!hapticOnTrigger) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
    } catch {
      /* ignore */
    }
  }, [hapticOnTrigger]);

  const finishRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[usePullToRefresh] onRefresh failed:', err);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

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
    // v59.13.2: إيجاد الـ scroll container الفعلي
    // ──────────────────────────────────────────────────────────────
    // نبدأ من containerRef الذي مرّره PullToRefresh component،
    // ثم نصعد لأعلى لإيجاد أوّل أب overflow-y فيه auto/scroll.
    // هذا يصلح حالة v59.10+ حيث body مقفول والتمرير على main.
    const findScrollContainer = () => {
      // 1) جرّب البحث المباشر عن main.mobile-main-content (سيناريو الجوال)
      const mainEl = document.querySelector('main.mobile-main-content, .mobile-main-content');
      if (mainEl) {
        const style = window.getComputedStyle(mainEl);
        if (/(auto|scroll)/.test(style.overflowY)) {
          return mainEl;
        }
      }

      // 2) ابدأ من containerRef واصعد لأعلى
      let node = containerRef.current;
      while (node && node !== document.body && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }

      // 3) Fallback: window/document
      return null;
    };

    // نُخزّن المرجع لتجنّب البحث في كل touchmove (مكلف)
    let scrollContainer = findScrollContainer();

    // نُعيد البحث على onTouchStart فقط (الـ DOM قد يتغيّر بين التنقّلات)
    const refreshScrollContainer = () => {
      scrollContainer = findScrollContainer();
    };

    const getScrollTop = () => {
      if (scrollContainer) {
        return scrollContainer.scrollTop || 0;
      }
      // Fallback القديم — يعمل في صفحات الـ Desktop
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    const reset = () => {
      stateRef.current.active = false;
      stateRef.current.locked = false;
      stateRef.current.triggered = false;
      stateRef.current.cancelled = false;
    };

    const onTouchStart = (e) => {
      if (isRefreshing) return;
      if (!e.touches || e.touches.length !== 1) {
        // pinch / multi-touch → تجاهل
        stateRef.current.cancelled = true;
        return;
      }
      // v59.13.2: حدّث مرجع الـ scroll container في حال تغيّر الـ DOM
      if (!scrollContainer) refreshScrollContainer();
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
      if (!stateRef.current.active || isRefreshing) return;
      if (!e.touches || e.touches.length !== 1) {
        stateRef.current.cancelled = true;
        if (pullDistance !== 0) setPullDistance(0);
        return;
      }

      const t = e.touches[0];
      const deltaY = t.clientY - stateRef.current.startY;
      const deltaX = t.clientX - stateRef.current.startX;

      // لم نقفل بعد كسحب — افحص الاتجاه أولاً
      if (!stateRef.current.locked) {
        // إذا كانت الحركة أفقية أو لأعلى → ألغِ
        if (Math.abs(deltaX) > HORIZONTAL_TOLERANCE || deltaY < ACTIVATION_DELTA) {
          // ربما swipe جانبي أو scroll لأعلى → دعه
          if (deltaY < 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
            stateRef.current.cancelled = true;
            if (pullDistance !== 0) setPullDistance(0);
            return;
          }
        }
        // إذا تجاوز deltaY الحد الأدنى → اقفل كسحب
        if (deltaY >= ACTIVATION_DELTA) {
          // تأكد مرة أخرى من scrollTop = 0
          if (getScrollTop() > 0) {
            stateRef.current.cancelled = true;
            if (pullDistance !== 0) setPullDistance(0);
            return;
          }
          stateRef.current.locked = true;
        } else {
          return;
        }
      }

      // الآن نحن في وضع سحب مؤكد
      if (deltaY <= 0) {
        if (pullDistance !== 0) setPullDistance(0);
        return;
      }

      // الآن فقط يُسمح بـ preventDefault لمنع scroll الافتراضي
      if (e.cancelable) {
        try { e.preventDefault(); } catch { /* ignore */ }
      }

      const resisted = Math.min(maxPull, deltaY / RESISTANCE);
      setPullDistance(resisted);

      if (!stateRef.current.triggered && resisted >= threshold) {
        stateRef.current.triggered = true;
        triggerHaptic();
      } else if (stateRef.current.triggered && resisted < threshold) {
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
      if (wasTriggered && !isRefreshing) {
        finishRefresh();
      } else {
        setPullDistance(0);
      }
    };

    // ⚠️ touchmove يجب أن يكون non-passive حتى يستطيع preventDefault
    //    لكن نتأكد من عدم استدعاء preventDefault إلا في وضع locked
    const opts = { passive: false };
    const passiveOpts = { passive: true };

    // v59.13.2: نُرفِق المستمعين على الـ scroll container الفعلي إن وُجد،
    // وإلا نقع على window (Desktop fallback). هذا يضمن أن الـ hook
    // لا يخنق التمرير في صفحات الجوال (حيث body مقفول overflow:hidden).
    const target = scrollContainer || window;

    target.addEventListener('touchstart', onTouchStart, passiveOpts);
    target.addEventListener('touchmove', onTouchMove, opts);
    target.addEventListener('touchend', onTouchEnd, passiveOpts);
    target.addEventListener('touchcancel', onTouchEnd, passiveOpts);

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
      target.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [disabled, isRefreshing, threshold, maxPull, pullDistance, finishRefresh, triggerHaptic]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= threshold,
    progress: Math.min(1, pullDistance / threshold),
  };
}
