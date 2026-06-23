/**
 * Performance Utilities
 * 
 * دوال مساعدة لتحسين الأداء
 */

/**
 * قياس أداء الدالة
 */
export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * تحويل الصور إلى WebP
 */
export async function convertToWebP(file, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(resolve, 'image/webp', quality);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * ضغط الصور
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // حساب الأبعاد الجديدة
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * إنشاء blur placeholder
 */
export async function generateBlurPlaceholder(src, size = 10) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.filter = `blur(${size}px)`;
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL());
    };

    img.src = src;
  });
}

/**
 * تحسين الأداء باستخدام requestIdleCallback
 */
export function scheduleIdleTask(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  }
  // Fallback
  return setTimeout(callback, 1);
}

/**
 * تحسين الأداء باستخدام requestAnimationFrame
 */
export function scheduleAnimationFrame(callback) {
  return requestAnimationFrame(callback);
}

/**
 * تحسين الأداء باستخدام MessageChannel
 */
export function scheduleTask(callback) {
  const channel = new MessageChannel();
  channel.port2.onmessage = callback;
  channel.port1.postMessage(null);
}

/**
 * قياس Core Web Vitals
 */
export function measureWebVitals(callback) {
  // LCP - Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    callback('LCP', lastEntry.renderTime || lastEntry.loadTime);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // FID - First Input Delay
  const fidObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      callback('FID', entry.processingDuration);
    });
  });
  fidObserver.observe({ entryTypes: ['first-input'] });

  // CLS - Cumulative Layout Shift
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        callback('CLS', clsValue);
      }
    });
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  return () => {
    lcpObserver.disconnect();
    fidObserver.disconnect();
    clsObserver.disconnect();
  };
}

/**
 * قياس FPS
 */
export function measureFPS(callback, duration = 5000) {
  let frameCount = 0;
  let lastTime = performance.now();
  let lastFrameTime = lastTime;

  const measureFrame = () => {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastFrameTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));
      callback(fps);
      frameCount = 0;
      lastFrameTime = currentTime;
    }

    if (currentTime - lastTime < duration) {
      requestAnimationFrame(measureFrame);
    }
  };

  requestAnimationFrame(measureFrame);
}

/**
 * تحسين الأداء باستخدام Web Workers
 */
export function createWorker(fn) {
  const blob = new Blob([`self.onmessage = function(e) { self.postMessage((${fn.toString()})(e.data)); }`], {
    type: 'application/javascript',
  });
  const worker = new Worker(URL.createObjectURL(blob));
  return worker;
}

/**
 * تخزين مؤقت ذكي
 */
export class SmartCache {
  constructor(maxSize = 100, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * تحسين الأداء باستخدام Intersection Observer
 */
export function observeElements(selector, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px',
    ...options,
  });

  document.querySelectorAll(selector).forEach((element) => {
    observer.observe(element);
  });

  return observer;
}

/**
 * تحسين الأداء باستخدام Resize Observer
 */
export function observeResize(element, callback) {
  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      callback({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
  });

  observer.observe(element);
  return observer;
}

/**
 * تحسين الأداء باستخدام Mutation Observer
 */
export function observeMutations(element, callback, options = {}) {
  const observer = new MutationObserver((mutations) => {
    callback(mutations);
  });

  observer.observe(element, {
    childList: true,
    subtree: true,
    attributes: true,
    ...options,
  });

  return observer;
}

/**
 * تحسين الأداء باستخدام Visibility API
 */
export function onVisibilityChange(callback) {
  document.addEventListener('visibilitychange', () => {
    callback(document.hidden);
  });
}

export default {
  measurePerformance,
  convertToWebP,
  compressImage,
  generateBlurPlaceholder,
  scheduleIdleTask,
  scheduleAnimationFrame,
  scheduleTask,
  measureWebVitals,
  measureFPS,
  createWorker,
  SmartCache,
  observeElements,
  observeResize,
  observeMutations,
  onVisibilityChange,
};

