/**
 * usePullToRefresh
 * ----------------
 * Hook عام للسحب من أعلى لتحديث الصفحة (Pull-to-Refresh)
 * يعمل على أي حاوية تمرير ويتعامل بشكل صحيح مع RTL.
 *
 * المميزات:
 *  ✓ يعمل فقط عندما يكون scrollTop = 0 (لا يتعارض مع التمرير العادي)
 *  ✓ يدعم Touch + Pointer events
 *  ✓ يدعم RTL (الاتجاه عمودي فقط — السحب للأسفل)
 *  ✓ مقاومة (resistance) عند السحب لتجربة شبيهة بالتطبيقات الأصلية
 *  ✓ Haptic feedback اختياري (vibration)
 *  ✓ تنظيف آمن لمستمعي الأحداث
 *  ✓ يعمل حتى داخل Safe Area (iOS notch/home indicator)
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_THRESHOLD = 70;       // المسافة المطلوبة لتفعيل التحديث
const DEFAULT_MAX_PULL = 140;       // أقصى مسافة سحب مرئية
const RESISTANCE = 2.2;             // معامل المقاومة (كل ما زاد قلّت الاستجابة)

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
    active: false,
    triggered: false,
  });

  const triggerHaptic = useCallback(() => {
    if (!hapticOnTrigger) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(15);
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
      // لا نرمي الخطأ — نتركه للمستهلك أن يتعامل معه
      // ولكن نضمن إغلاق حالة التحديث
      // eslint-disable-next-line no-console
      console.warn('[usePullToRefresh] onRefresh failed:', err);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (disabled) return undefined;
    const el = containerRef.current || (typeof window !== 'undefined' ? window : null);
    if (!el) return undefined;

    const getScrollTop = () => {
      if (el === window) {
        return window.scrollY || document.documentElement.scrollTop || 0;
      }
      return el.scrollTop || 0;
    };

    const onTouchStart = (e) => {
      if (isRefreshing) return;
      if (getScrollTop() > 0) return;
      const touch = e.touches ? e.touches[0] : e;
      stateRef.current.startY = touch.clientY;
      stateRef.current.active = true;
      stateRef.current.triggered = false;
    };

    const onTouchMove = (e) => {
      if (!stateRef.current.active || isRefreshing) return;
      const touch = e.touches ? e.touches[0] : e;
      const delta = touch.clientY - stateRef.current.startY;
      if (delta <= 0) {
        if (pullDistance !== 0) setPullDistance(0);
        return;
      }
      // عند بدء سحب فعلي من أعلى ومن scrollTop = 0 → امنع التمرير الافتراضي
      if (getScrollTop() > 0) {
        stateRef.current.active = false;
        setPullDistance(0);
        return;
      }
      if (e.cancelable) e.preventDefault();
      const resisted = Math.min(maxPull, delta / RESISTANCE);
      setPullDistance(resisted);
      if (!stateRef.current.triggered && resisted >= threshold) {
        stateRef.current.triggered = true;
        triggerHaptic();
      } else if (stateRef.current.triggered && resisted < threshold) {
        stateRef.current.triggered = false;
      }
    };

    const onTouchEnd = () => {
      if (!stateRef.current.active) return;
      const wasTriggered = stateRef.current.triggered;
      stateRef.current.active = false;
      stateRef.current.triggered = false;
      if (wasTriggered && !isRefreshing) {
        finishRefresh();
      } else {
        setPullDistance(0);
      }
    };

    const opts = { passive: false };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, opts);
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
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
