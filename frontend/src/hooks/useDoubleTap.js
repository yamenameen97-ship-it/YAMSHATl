import { useRef, useCallback } from 'react';

function getPoint(event) {
  const touch = event?.touches?.[0] || event?.changedTouches?.[0];
  if (touch) {
    return { x: touch.clientX, y: touch.clientY };
  }

  return {
    x: Number(event?.clientX ?? 0),
    y: Number(event?.clientY ?? 0),
  };
}

export function useDoubleTap(callback, threshold = 280, maxDistance = 28) {
  const lastTapRef = useRef({ time: 0, x: 0, y: 0, target: null });

  return useCallback((event) => {
    if (event?.touches?.length > 1) return;

    const now = window.performance?.now?.() ?? Date.now();
    const point = getPoint(event);
    const previous = lastTapRef.current;
    const deltaTime = now - previous.time;
    const deltaX = point.x - previous.x;
    const deltaY = point.y - previous.y;
    const distance = Math.hypot(deltaX, deltaY);
    const currentTarget = event?.currentTarget || event?.target || null;

    const sameSurface = !previous.target || !currentTarget || previous.target === currentTarget || previous.target.contains?.(currentTarget) || currentTarget.contains?.(previous.target);
    const isDoubleTap = deltaTime > 40 && deltaTime <= threshold && distance <= maxDistance && sameSurface;

    lastTapRef.current = {
      time: now,
      x: point.x,
      y: point.y,
      target: currentTarget,
    };

    if (!isDoubleTap) return;

    if (typeof event?.preventDefault === 'function') {
      event.preventDefault();
    }

    callback?.(event, {
      x: point.x,
      y: point.y,
      deltaTime,
      distance,
    });
  }, [callback, threshold, maxDistance]);
}
