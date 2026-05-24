/**
 * مكون حاوية الحركات المحسّنة
 * يوفر:
 * - معالجة سلسة للحركات
 * - ردود فعل بصرية وحسية
 * - دعم السحب والنقر المزدوج
 * - تحسينات الأداء
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGesture, useTouchFeedback } from '../hooks/useGesture';
import '../styles/gestureContainer.css';

export const GestureContainer = ({
  children,
  onSwipe,
  onSwipeVertical,
  onDoubleTap,
  onLongPress,
  enableFeedback = true,
  enableHaptic = true,
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { triggerFeedback, triggerHaptic } = useTouchFeedback();

  // معالج السحب الأفقي
  const handleSwipe = useCallback((data) => {
    if (enableFeedback) {
      triggerFeedback(containerRef.current, 'medium');
    }
    if (enableHaptic) {
      triggerHaptic([15, 10, 15]);
    }
    onSwipe?.(data);
  }, [onSwipe, enableFeedback, enableHaptic, triggerFeedback, triggerHaptic]);

  // معالج السحب العمودي
  const handleSwipeVertical = useCallback((data) => {
    if (enableFeedback) {
      triggerFeedback(containerRef.current, 'light');
    }
    if (enableHaptic) {
      triggerHaptic([10, 5, 10]);
    }
    onSwipeVertical?.(data);
  }, [onSwipeVertical, enableFeedback, enableHaptic, triggerFeedback, triggerHaptic]);

  // معالج النقر المزدوج
  const handleDoubleTap = useCallback((data) => {
    if (enableFeedback) {
      triggerFeedback(containerRef.current, 'heavy');
    }
    if (enableHaptic) {
      triggerHaptic([10, 5, 10, 5, 10]);
    }
    onDoubleTap?.(data);
  }, [onDoubleTap, enableFeedback, enableHaptic, triggerFeedback, triggerHaptic]);

  // معالج الضغط الطويل
  const handleLongPress = useCallback((data) => {
    if (enableFeedback) {
      triggerFeedback(containerRef.current, 'heavy');
    }
    if (enableHaptic) {
      triggerHaptic([20, 10, 20]);
    }
    onLongPress?.(data);
  }, [onLongPress, enableFeedback, enableHaptic, triggerFeedback, triggerHaptic]);

  // معالج بداية اللمس
  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // معالج حركة اللمس
  const handleTouchMove = useCallback((data) => {
    if (isDragging) {
      setDragOffset({
        x: data.deltaX,
        y: data.deltaY
      });
    }
  }, [isDragging]);

  // معالج نهاية اللمس
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // إرفاق معالجات الحركات
  const gestureRef = useGesture({
    onSwipe: handleSwipe,
    onSwipeVertical: handleSwipeVertical,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  });

  // ربط المرجع
  useEffect(() => {
    if (gestureRef.current && containerRef.current) {
      containerRef.current = gestureRef.current;
    }
  }, [gestureRef]);

  return (
    <div
      ref={containerRef}
      className={`gesture-container ${isDragging ? 'dragging' : ''} ${className}`}
      style={{
        ...style,
        transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'translate(0, 0)',
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {children}
    </div>
  );
};

export default GestureContainer;
