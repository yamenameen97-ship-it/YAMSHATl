/**
 * Performance Optimization Utilities
 * Provides caching, memoization, and performance monitoring
 */

/**
 * Simple memoization cache
 */
const memoCache = new Map();

/**
 * Memoize function results
 * @param {Function} fn - Function to memoize
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Function} Memoized function
 */
export function memoize(fn, ttl = 5 * 60 * 1000) {
  return function memoized(...args) {
    const key = JSON.stringify(args);
    const cached = memoCache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn.apply(this, args);
    memoCache.set(key, { value: result, timestamp: Date.now() });

    return result;
  };
}

/**
 * Clear memoization cache
 */
export function clearMemoCache() {
  memoCache.clear();
}

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function execution
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 1000) {
  let inThrottle;

  return function throttled(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request Animation Frame wrapper
 * @param {Function} fn - Function to execute
 * @returns {Function} RAF-wrapped function
 */
export function requestAnimationFrameThrottle(fn) {
  let rafId;

  return function throttled(...args) {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => fn.apply(this, args));
  };
}

/**
 * Lazy load a module
 * @param {Function} importFn - Import function
 * @returns {Promise} Module promise
 */
export function lazyLoad(importFn) {
  return importFn().catch((err) => {
    console.error('Failed to lazy load module:', err);
    throw err;
  });
}

/**
 * Preload images
 * @param {string[]} urls - Image URLs to preload
 * @returns {Promise} Preload promise
 */
export function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = () => reject(new Error(`Failed to preload ${url}`));
          img.src = url;
        })
    )
  );
}

/**
 * Preload fonts
 * @param {string} fontFamily - Font family name
 * @param {string[]} urls - Font URLs
 * @returns {Promise} Preload promise
 */
export function preloadFonts(fontFamily, urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'font';
          link.href = url;
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          link.onload = () => resolve(url);
          link.onerror = () => reject(new Error(`Failed to preload font ${url}`));
          document.head.appendChild(link);
        })
    )
  );
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
  }

  /**
   * Mark a point in time
   * @param {string} name - Mark name
   */
  mark(name) {
    performance.mark(name);
    this.marks.set(name, performance.now());
  }

  /**
   * Measure time between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @returns {number} Duration in milliseconds
   */
  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      this.measures.set(name, measure.duration);
      return measure.duration;
    } catch (err) {
      console.error('Failed to measure performance:', err);
      return 0;
    }
  }

  /**
   * Get all marks
   * @returns {object} Marks object
   */
  getMarks() {
    return Object.fromEntries(this.marks);
  }

  /**
   * Get all measures
   * @returns {object} Measures object
   */
  getMeasures() {
    return Object.fromEntries(this.measures);
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    this.marks.clear();
    this.measures.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Log performance summary
   */
  logSummary() {
    console.group('Performance Summary');
    console.table(this.getMeasures());
    console.groupEnd();
  }
}

/**
 * Virtual scrolling helper
 */
export class VirtualScroller {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 50;
    this.containerHeight = options.containerHeight || 500;
    this.items = options.items || [];
    this.buffer = options.buffer || 5;
  }

  /**
   * Get visible items
   * @param {number} scrollTop - Scroll position
   * @returns {object} Visible items info
   */
  getVisibleItems(scrollTop) {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(
      this.items.length,
      Math.ceil((scrollTop + this.containerHeight) / this.itemHeight) + this.buffer
    );

    return {
      startIndex,
      endIndex,
      offsetY: startIndex * this.itemHeight,
      visibleItems: this.items.slice(startIndex, endIndex),
    };
  }

  /**
   * Get total height
   * @returns {number} Total height
   */
  getTotalHeight() {
    return this.items.length * this.itemHeight;
  }
}

/**
 * Intersection Observer helper
 */
export class IntersectionObserverHelper {
  constructor(options = {}) {
    this.options = {
      root: options.root || null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0.1,
    };
    this.observer = null;
    this.callbacks = new Map();
  }

  /**
   * Observe element
   * @param {Element} element - Element to observe
   * @param {Function} callback - Callback function
   */
  observe(element, callback) {
    if (!this.observer) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const cb = this.callbacks.get(entry.target);
          if (cb) cb(entry);
        });
      }, this.options);
    }

    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  /**
   * Unobserve element
   * @param {Element} element - Element to unobserve
   */
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
      this.callbacks.delete(element);
    }
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.callbacks.clear();
    }
  }
}

/**
 * Resource timing helper
 */
export class ResourceTiming {
  /**
   * Get resource timing entries
   * @returns {object[]} Resource timing entries
   */
  static getEntries() {
    return performance.getEntriesByType('resource');
  }

  /**
   * Get resource by name
   * @param {string} name - Resource name
   * @returns {object} Resource timing entry
   */
  static getByName(name) {
    return performance.getEntriesByName(name)[0];
  }

  /**
   * Get total resource time
   * @returns {number} Total time in milliseconds
   */
  static getTotalTime() {
    const entries = this.getEntries();
    return entries.reduce((total, entry) => total + entry.duration, 0);
  }

  /**
   * Get resources by type
   * @param {string} type - Resource type (script, link, img, etc.)
   * @returns {object[]} Resource entries
   */
  static getByType(type) {
    return this.getEntries().filter((entry) => entry.initiatorType === type);
  }

  /**
   * Get slow resources
   * @param {number} threshold - Threshold in milliseconds
   * @returns {object[]} Slow resource entries
   */
  static getSlow(threshold = 1000) {
    return this.getEntries().filter((entry) => entry.duration > threshold);
  }
}

/**
 * Memory monitoring
 */
export class MemoryMonitor {
  /**
   * Get memory usage
   * @returns {object} Memory info
   */
  static getMemory() {
    if (!performance.memory) {
      return null;
    }

    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
    };
  }

  /**
   * Check if memory usage is high
   * @param {number} threshold - Threshold percentage
   * @returns {boolean} Whether memory usage is high
   */
  static isHighMemory(threshold = 80) {
    const memory = this.getMemory();
    return memory ? memory.usagePercent > threshold : false;
  }

  /**
   * Log memory usage
   */
  static logMemory() {
    const memory = this.getMemory();
    if (memory) {
      console.log('Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        percent: `${memory.usagePercent.toFixed(2)}%`,
      });
    }
  }
}

/**
 * Network information
 */
export class NetworkInfo {
  /**
   * Get connection type
   * @returns {string} Connection type
   */
  static getConnectionType() {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType;
    }
    return 'unknown';
  }

  /**
   * Is slow connection
   * @returns {boolean} Whether connection is slow
   */
  static isSlowConnection() {
    const type = this.getConnectionType();
    return type === '2g' || type === '3g' || type === 'slow-2g';
  }

  /**
   * Get downlink speed
   * @returns {number} Downlink speed in Mbps
   */
  static getDownlink() {
    if ('connection' in navigator) {
      return navigator.connection.downlink;
    }
    return null;
  }

  /**
   * Get round trip time
   * @returns {number} RTT in milliseconds
   */
  static getRTT() {
    if ('connection' in navigator) {
      return navigator.connection.rtt;
    }
    return null;
  }

  /**
   * Get save data preference
   * @returns {boolean} Whether user prefers reduced data
   */
  static getSaveData() {
    if ('connection' in navigator) {
      return navigator.connection.saveData;
    }
    return false;
  }
}

export default {
  memoize,
  clearMemoCache,
  debounce,
  throttle,
  requestAnimationFrameThrottle,
  lazyLoad,
  preloadImages,
  preloadFonts,
  PerformanceMonitor,
  VirtualScroller,
  IntersectionObserverHelper,
  ResourceTiming,
  MemoryMonitor,
  NetworkInfo,
};
