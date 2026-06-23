import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

/**
 * usePerformanceOptimization Hook
 * 
 * مجموعة من الـ hooks لتحسين الأداء
 */

/**
 * useDebounce - تأخير تنفيذ دالة
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useThrottle - تحديد معدل تنفيذ دالة
 */
export function useThrottle(callback, delay = 500) {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
}

/**
 * useIntersectionObserver - مراقبة ظهور العناصر
 */
export function useIntersectionObserver(ref, options = {}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, {
      rootMargin: '50px',
      ...options,
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}

/**
 * useResizeObserver - مراقبة تغيير حجم العنصر
 */
export function useResizeObserver(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/**
 * usePrevious - الحصول على القيمة السابقة
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * useAsync - معالجة العمليات غير المتزامنة
 */
export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}

/**
 * useLocalStorage - تخزين البيانات محلياً
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * useWindowSize - الحصول على حجم النافذة
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * useMediaQuery - مراقبة media queries
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * useFetch - جلب البيانات مع التخزين المؤقت
 */
export function useFetch(url, options = {}) {
  const cache = useRef({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const fetchData = async () => {
      if (cache.current[url]) {
        setData(cache.current[url]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        cache.current[url] = result;
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, options]);

  return { data, loading, error };
}

/**
 * usePerformanceMetrics - قياس الأداء
 */
export function usePerformanceMetrics(componentName) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 16.67) {
        // أكثر من frame واحد
        console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * useAnimationFrame - استخدام requestAnimationFrame
 */
export function useAnimationFrame(callback) {
  const requestRef = useRef();

  useEffect(() => {
    const animate = () => {
      callback();
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [callback]);
}

/**
 * useMemoCompare - مقارنة مخصصة للـ useMemo
 */
export function useMemoCompare(value, compare) {
  const ref = useRef();
  const signalRef = useRef(0);

  if (!compare(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  }

  return useMemo(() => ref.current, [signalRef.current]);
}

/**
 * useCallbackRef - دمج useCallback مع useRef
 */
export function useCallbackRef(callback) {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback((...args) => ref.current(...args), []);
}

export default {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useResizeObserver,
  usePrevious,
  useAsync,
  useLocalStorage,
  useWindowSize,
  useMediaQuery,
  useFetch,
  usePerformanceMetrics,
  useAnimationFrame,
  useMemoCompare,
  useCallbackRef,
};

