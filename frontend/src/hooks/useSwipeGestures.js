import { useEffect, useRef } from 'react';

/**
 * useSwipeGestures
 * ================
 * Hook لمعالجة حركات Swipe على الأجهزة المحمولة
 * 
 * الحركات المدعومة:
 * - swipeLeft: سحب لليسار (للرد أو الحذف)
 * - swipeRight: سحب لليمين (لفتح الخيارات)
 * - swipeUp: سحب لأعلى (لإغلاق)
 * - swipeDown: سحب لأسفل (لتحديث)
 */
function useSwipeGestures(
  elementRef,
  {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    enableVertical = true,
    enableHorizontal = true,
  } = {}
) {
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!elementRef?.current) return undefined;

    const element = elementRef.current;

    const handleTouchStart = (event) => {
      touchStartRef.current = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
    };

    const handleTouchEnd = (event) => {
      touchEndRef.current = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };

      const { x: startX, y: startY } = touchStartRef.current;
      const { x: endX, y: endY } = touchEndRef.current;

      const deltaX = startX - endX;
      const deltaY = startY - endY;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // تحديد الاتجاه الأساسي
      const isHorizontal = absDeltaX > absDeltaY;

      // معالجة الحركات الأفقية
      if (enableHorizontal && isHorizontal && absDeltaX > threshold) {
        if (deltaX > 0 && onSwipeLeft) {
          onSwipeLeft({ deltaX, deltaY });
        } else if (deltaX < 0 && onSwipeRight) {
          onSwipeRight({ deltaX, deltaY });
        }
      }

      // معالجة الحركات العمودية
      if (enableVertical && !isHorizontal && absDeltaY > threshold) {
        if (deltaY > 0 && onSwipeUp) {
          onSwipeUp({ deltaX, deltaY });
        } else if (deltaY < 0 && onSwipeDown) {
          onSwipeDown({ deltaX, deltaY });
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, enableVertical, enableHorizontal]);
}

export default useSwipeGestures;

/**
 * مثال الاستخدام في مكون:
 * 
 * import useSwipeGestures from './hooks/useSwipeGestures';
 * 
 * function ChatBubble({ message, onReply, onDelete }) {
 *   const bubbleRef = useRef(null);
 * 
 *   useSwipeGestures(bubbleRef, {
 *     onSwipeLeft: () => onDelete(message),
 *     onSwipeRight: () => onReply(message),
 *   });
 * 
 *   return (
 *     <div ref={bubbleRef} className="chat-bubble">
 *       {message.text}
 *     </div>
 *   );
 * }
 */
