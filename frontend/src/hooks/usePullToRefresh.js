/**
 * usePullToRefresh — v57 (Smart Passive)
 * --------------------------------------
 * Hook عام للسحب من أعلى لتحديث الصفحة (Pull-to-Refresh)
 *
 * 🔧 إصلاح v57:
 *   • يستخدم passive listeners افتراضياً (لا يخنق التمرير)
 *   • preventDefault يُستدعى فقط عند سحب فعلي من scrollTop=0
 *   • تتبّع scroll الـ window بدلاً من حاوية داخلية (يصلح صفحة المنشورات)
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

    // نتتبّع scroll الـ window بدلاً من حاوية محددة
    // هذا يُصلح صفحة المنشورات وأي صفحة لا يكون فيها overflow:auto داخلي
    const getScrollTop = () => window.scrollY || document.documentElement.scrollTop || 0;

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

    window.addEventListener('touchstart', onTouchStart, passiveOpts);
    window.addEventListener('touchmove', onTouchMove, opts);
    window.addEventListener('touchend', onTouchEnd, passiveOpts);
    window.addEventListener('touchcancel', onTouchEnd, passiveOpts);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
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
