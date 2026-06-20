import { useCallback, useRef } from 'react';

/**
 * useLongPress — Hook موحّد لاكتشاف الضغط المطول (touch + mouse)
 *
 * @param {Function} onLongPress  — يستدعى عند تجاوز delay
 * @param {Function} onClick      — يستدعى عند نقرة قصيرة (اختياري)
 * @param {number}   delay        — افتراضي 500ms
 * @returns props جاهزة للنشر على عنصر JSX
 */
export default function useLongPress(onLongPress, onClick, delay = 500) {
  const timerRef = useRef(null);
  const triggeredRef = useRef(false);

  const start = useCallback((event) => {
    triggeredRef.current = false;
    if (event?.persist) event.persist();
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onLongPress?.(event);
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((event, shouldTriggerClick = true) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (shouldTriggerClick && !triggeredRef.current && onClick) {
      onClick(event);
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: (e) => clear(e, true),
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: (e) => clear(e, true),
    onTouchCancel: (e) => clear(e, false),
  };
}
