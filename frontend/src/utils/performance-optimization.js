/**
 * Performance Optimization Utilities
 * ==================================
 * أدوات لتحسين الأداء في التطبيق
 */

/**
 * debounce
 * --------
 * تأخير تنفيذ دالة حتى يتوقف المستخدم عن استدعاؤها
 * مفيد للبحث والـ scroll
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * throttle
 * --------
 * تنفيذ دالة بحد أقصى عدد مرات في فترة زمنية
 * مفيد للـ scroll و resize events
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function throttled(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * memoize
 * -------
 * تخزين نتائج الدوال لتجنب الحسابات المتكررة
 */
export function memoize(func) {
  const cache = new Map();
  return function memoized(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * requestIdleCallback polyfill
 * ----------------------------
 * تنفيذ مهام في أوقات الخمول
 */
export const requestIdleCallback = 
  typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback
    : (callback) => setTimeout(callback, 1);

/**
 * cancelIdleCallback polyfill
 * ---------------------------
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && window.cancelIdleCallback
    ? window.cancelIdleCallback
    : clearTimeout;

/**
 * batchUpdates
 * -----------
 * تجميع عدة تحديثات في عملية واحدة
 */
export function batchUpdates(updates = []) {
  return Promise.all(updates.map((update) => Promise.resolve(update)));
}

/**
 * lazyLoad
 * --------
 * تحميل كسول للمكونات والموارد
 */
export function lazyLoad(importFunc, delay = 0) {
  return new Promise((resolve) => {
    if (delay > 0) {
      setTimeout(() => resolve(importFunc()), delay);
    } else {
      resolve(importFunc());
    }
  });
}

/**
 * measurePerformance
 * -----------------
 * قياس أداء العمليات
 */
export function measurePerformance(label, func) {
  if (typeof window === 'undefined' || !window.performance) {
    return func();
  }

  const startMark = `${label}-start`;
  const endMark = `${label}-end`;
  const measureName = `${label}-duration`;

  try {
    performance.mark(startMark);
    const result = func();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const measure = performance.getEntriesByName(measureName)[0];
    console.log(`[Performance] ${label}: ${measure.duration.toFixed(2)}ms`);

    return result;
  } catch (error) {
    console.error(`[Performance Error] ${label}:`, error);
    throw error;
  }
}

/**
 * prefetchResource
 * ---------------
 * تحميل مسبق للموارد
 */
export function prefetchResource(url, type = 'script') {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  if (type === 'style') link.as = 'style';
  if (type === 'script') link.as = 'script';
  if (type === 'image') link.as = 'image';

  document.head.appendChild(link);
}

/**
 * preloadResource
 * ---------------
 * تحميل فوري للموارد
 */
export function preloadResource(url, type = 'script') {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  if (type === 'style') link.as = 'style';
  if (type === 'script') link.as = 'script';
  if (type === 'image') link.as = 'image';

  document.head.appendChild(link);
}

/**
 * observePerformance
 * -----------------
 * مراقبة مؤشرات الأداء
 */
export function observePerformance() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  try {
    // مراقبة الـ Long Tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('[Long Task]', entry.name, `${entry.duration.toFixed(2)}ms`);
      }
    });

    longTaskObserver.observe({ entryTypes: ['longtask'] });

    // مراقبة الـ Layout Shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          console.warn('[Layout Shift]', entry.value);
        }
      }
    });

    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

    return { longTaskObserver, layoutShiftObserver };
  } catch (error) {
    console.error('[Performance Observer Error]', error);
    return null;
  }
}

/**
 * getWebVitals
 * -----------
 * الحصول على مؤشرات الويب الحيوية
 */
export function getWebVitals() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const vitals = {};

  // Largest Contentful Paint
  try {
    const lcpEntries = performance.getEntriesByName('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      vitals.lcp = lcpEntries[lcpEntries.length - 1].renderTime || lcpEntries[lcpEntries.length - 1].loadTime;
    }
  } catch (error) {
    console.error('[Web Vitals Error - LCP]', error);
  }

  // First Input Delay
  try {
    const fid = performance.getEntriesByType('first-input')[0];
    if (fid) {
      vitals.fid = fid.processingDuration;
    }
  } catch (error) {
    console.error('[Web Vitals Error - FID]', error);
  }

  // Cumulative Layout Shift
  try {
    let cls = 0;
    const layoutShifts = performance.getEntriesByType('layout-shift');
    for (const entry of layoutShifts) {
      if (!entry.hadRecentInput) {
        cls += entry.value;
      }
    }
    vitals.cls = cls;
  } catch (error) {
    console.error('[Web Vitals Error - CLS]', error);
  }

  return vitals;
}

/**
 * enablePerformanceMonitoring
 * --------------------------
 * تفعيل مراقبة الأداء الشاملة
 */
export function enablePerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // تسجيل الأداء عند تحميل الصفحة
  window.addEventListener('load', () => {
    setTimeout(() => {
      const vitals = getWebVitals();
      if (vitals) {
        console.log('[Web Vitals]', vitals);
      }
    }, 0);
  });

  // مراقبة الأداء
  observePerformance();

  // تسجيل الأخطاء
  window.addEventListener('error', (event) => {
    console.error('[Runtime Error]', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]', event.reason);
  });
}

export default {
  debounce,
  throttle,
  memoize,
  requestIdleCallback,
  cancelIdleCallback,
  batchUpdates,
  lazyLoad,
  measurePerformance,
  prefetchResource,
  preloadResource,
  observePerformance,
  getWebVitals,
  enablePerformanceMonitoring,
};
