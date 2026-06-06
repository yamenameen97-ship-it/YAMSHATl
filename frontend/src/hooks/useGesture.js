/**
 * Hook لمعالجة الحركات واللمس
 * توفر:
 * - معالجة سلسة للحركات
 * - ردود فعل اللمس والاهتزاز
 * - كشف السحب والنقر المزدوج
 */

import { useEffect, useRef, useCallback } from 'react';
import { gestureService } from '../services/gestureService';

export const useGesture = (callbacks = {}) => {
  const elementRef = useRef(null);
  const unsubscribeRef = useRef([]);

  // معالجات الحركات
  const handleSwipe = useCallback((data) => {
    callbacks.onSwipe?.(data);
  }, [callbacks]);

  const handleSwipeVertical = useCallback((data) => {
    callbacks.onSwipeVertical?.(data);
  }, [callbacks]);

  const handleDoubleTap = useCallback((data) => {
    callbacks.onDoubleTap?.(data);
  }, [callbacks]);

  const handleLongPress = useCallback((data) => {
    callbacks.onLongPress?.(data);
  }, [callbacks]);

  const handleTouchStart = useCallback((data) => {
    callbacks.onTouchStart?.(data);
  }, [callbacks]);

  const handleTouchMove = useCallback((data) => {
    callbacks.onTouchMove?.(data);
  }, [callbacks]);

  const handleTouchEnd = useCallback((data) => {
    callbacks.onTouchEnd?.(data);
  }, [callbacks]);

  // تسجيل المستمعين
  useEffect(() => {
    if (!elementRef.current) return;

    // إرفاق خدمة الحركات بالعنصر
    gestureService.attachToElement(elementRef.current);

    // تسجيل المستمعين
    const unsubscribers = [
      gestureService.on('swipe', handleSwipe),
      gestureService.on('swipeVertical', handleSwipeVertical),
      gestureService.on('doubletap', handleDoubleTap),
      gestureService.on('longpress', handleLongPress),
      gestureService.on('touchstart', handleTouchStart),
      gestureService.on('touchmove', handleTouchMove),
      gestureService.on('touchend', handleTouchEnd)
    ];

    unsubscribeRef.current = unsubscribers;

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe?.());
    };
  }, [
    handleSwipe,
    handleSwipeVertical,
    handleDoubleTap,
    handleLongPress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ]);

  return elementRef;
};

/**
 * Hook لتفعيل ردود فعل اللمس
 */
export const useTouchFeedback = () => {
  const triggerFeedback = useCallback((element, type = 'light') => {
    gestureService.triggerTouchFeedback(element, type);
  }, []);

  const triggerHaptic = useCallback((pattern = 10) => {
    gestureService.triggerHaptic(pattern);
  }, []);

  return { triggerFeedback, triggerHaptic };
};

/**
 * Hook لمعالجة السحب مع الحركة السلسة
 */
export const useSmoothedSwipe = (onSwipe) => {
  const elementRef = useRef(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const unsubscribe = gestureService.on('swipe', (data) => {
      // حساب السرعة المتجانسة
      const smoothingFactor = 0.3;
      velocityRef.current.x = velocityRef.current.x * (1 - smoothingFactor) + data.speed * smoothingFactor;

      // تطبيق الحركة السلسة
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const animate = () => {
        if (Math.abs(velocityRef.current.x) > 0.1) {
          onSwipe?.(data);
          velocityRef.current.x *= 0.95; // تقليل السرعة تدريجياً
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      unsubscribe?.();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onSwipe]);

  return elementRef;
};

/**
 * Hook لكشف الحركات المتعددة
 */
export const useMultiGesture = (config = {}) => {
  const elementRef = useRef(null);
  const gestureStateRef = useRef({
    isScrolling: false,
    isZooming: false,
    isRotating: false
  });

  useEffect(() => {
    if (!elementRef.current) return;

    let touchCount = 0;

    const handleTouchStart = (e) => {
      touchCount = e.touches.length;

      if (touchCount === 2) {
        gestureStateRef.current.isZooming = true;
        config.onPinchStart?.();
      } else if (touchCount === 3) {
        gestureStateRef.current.isRotating = true;
        config.onRotateStart?.();
      }
    };

    const handleTouchMove = (e) => {
      if (touchCount === 2 && gestureStateRef.current.isZooming) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        config.onPinch?.({ distance });
      }
    };

    const handleTouchEnd = (e) => {
      touchCount = e.touches.length;

      if (touchCount < 2) {
        gestureStateRef.current.isZooming = false;
        config.onPinchEnd?.();
      }

      if (touchCount < 3) {
        gestureStateRef.current.isRotating = false;
        config.onRotateEnd?.();
      }
    };

    elementRef.current.addEventListener('touchstart', handleTouchStart);
    elementRef.current.addEventListener('touchmove', handleTouchMove);
    elementRef.current.addEventListener('touchend', handleTouchEnd);

    return () => {
      elementRef.current?.removeEventListener('touchstart', handleTouchStart);
      elementRef.current?.removeEventListener('touchmove', handleTouchMove);
      elementRef.current?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [config]);

  return elementRef;
};
