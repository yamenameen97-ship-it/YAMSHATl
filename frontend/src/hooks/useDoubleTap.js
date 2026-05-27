import { useRef, useCallback } from 'react';

export function useDoubleTap(callback, threshold = 300) {
  const lastTap = useRef(0);

  return useCallback((event) => {
    const now = Date.now();
    if (now - lastTap.current < threshold) {
      callback(event);
    }
    lastTap.current = now;
  }, [callback, threshold]);
}
