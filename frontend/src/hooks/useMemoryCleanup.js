import { useEffect, useRef, useCallback } from 'react';

/**
 * useMemoryCleanup Hook
 * 
 * تنظيف تسرب الذاكرة من خلال:
 * - إزالة event listeners تلقائياً
 * - إيقاف الـ intervals والـ timeouts
 * - إغلاق الـ WebSocket connections
 * - تنظيف الـ observers (IntersectionObserver, ResizeObserver, etc)
 * - تنظيف الـ timers والـ promises المعلقة
 */
export function useMemoryCleanup() {
  const cleanupFunctionsRef = useRef([]);
  const intervalsRef = useRef([]);
  const timeoutsRef = useRef([]);
  const listenersRef = useRef([]);
  const observersRef = useRef([]);

  // Register cleanup function
  const registerCleanup = useCallback((cleanupFn) => {
    if (typeof cleanupFn === 'function') {
      cleanupFunctionsRef.current.push(cleanupFn);
    }
  }, []);

  // Register interval for automatic cleanup
  const registerInterval = useCallback((callback, delay) => {
    const id = setInterval(callback, delay);
    intervalsRef.current.push(id);
    return id;
  }, []);

  // Register timeout for automatic cleanup
  const registerTimeout = useCallback((callback, delay) => {
    const id = setTimeout(callback, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  // Register event listener for automatic cleanup
  const registerListener = useCallback((element, event, handler, options) => {
    if (!element) return;
    
    element.addEventListener(event, handler, options);
    listenersRef.current.push({ element, event, handler, options });
    
    // Return function to remove listener
    return () => {
      element.removeEventListener(event, handler, options);
    };
  }, []);

  // Register observer for automatic cleanup
  const registerObserver = useCallback((observer) => {
    if (observer && typeof observer.disconnect === 'function') {
      observersRef.current.push(observer);
    }
    return observer;
  }, []);

  // Execute all cleanup functions
  const cleanup = useCallback(() => {
    // Clear all intervals
    intervalsRef.current.forEach(id => clearInterval(id));
    intervalsRef.current = [];

    // Clear all timeouts
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];

    // Remove all event listeners
    listenersRef.current.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (e) {
        console.warn('Error removing event listener:', e);
      }
    });
    listenersRef.current = [];

    // Disconnect all observers
    observersRef.current.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn('Error disconnecting observer:', e);
      }
    });
    observersRef.current = [];

    // Execute all cleanup functions
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.warn('Error in cleanup function:', e);
      }
    });
    cleanupFunctionsRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    registerCleanup,
    registerInterval,
    registerTimeout,
    registerListener,
    registerObserver,
    cleanup,
  };
}

/**
 * useEventListener Hook
 * 
 * إضافة event listener مع تنظيف تلقائي
 */
export function useEventListener(eventName, handler, element = window) {
  const { registerListener } = useMemoryCleanup();

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    registerListener(element, eventName, handler);
  }, [eventName, handler, element, registerListener]);
}

/**
 * useInterval Hook
 * 
 * إنشاء interval مع تنظيف تلقائي
 */
export function useInterval(callback, delay) {
  const { registerInterval } = useMemoryCleanup();

  useEffect(() => {
    if (delay === null || delay === undefined) return;

    registerInterval(callback, delay);
  }, [callback, delay, registerInterval]);
}

/**
 * useTimeout Hook
 * 
 * إنشاء timeout مع تنظيف تلقائي
 */
export function useTimeout(callback, delay) {
  const { registerTimeout } = useMemoryCleanup();

  useEffect(() => {
    if (delay === null || delay === undefined) return;

    registerTimeout(callback, delay);
  }, [callback, delay, registerTimeout]);
}

/**
 * useWebSocketCleanup Hook
 * 
 * تنظيف WebSocket connections
 */
export function useWebSocketCleanup(socket) {
  const { registerCleanup } = useMemoryCleanup();

  useEffect(() => {
    if (!socket) return;

    registerCleanup(() => {
      try {
        if (socket.connected) {
          socket.disconnect();
        }
      } catch (e) {
        console.warn('Error disconnecting socket:', e);
      }
    });
  }, [socket, registerCleanup]);
}

/**
 * useResizeObserver Hook
 * 
 * استخدام ResizeObserver مع تنظيف تلقائي
 */
export function useResizeObserver(callback, element) {
  const { registerObserver } = useMemoryCleanup();

  useEffect(() => {
    if (!element || !callback) return;

    const observer = new ResizeObserver(callback);
    observer.observe(element);
    registerObserver(observer);
  }, [element, callback, registerObserver]);
}

/**
 * useIntersectionObserver Hook
 * 
 * استخدام IntersectionObserver مع تنظيف تلقائي
 */
export function useIntersectionObserver(callback, element, options = {}) {
  const { registerObserver } = useMemoryCleanup();

  useEffect(() => {
    if (!element || !callback) return;

    const observer = new IntersectionObserver(callback, options);
    observer.observe(element);
    registerObserver(observer);
  }, [element, callback, options, registerObserver]);
}
