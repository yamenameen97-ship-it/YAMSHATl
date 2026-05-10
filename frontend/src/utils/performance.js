import { BACKEND_ORIGIN, CDN_BASE } from '../api/config.js';
import featureFlags from './featureFlags.js';

let initialized = false;

function canUseWindow() {
  return typeof window !== 'undefined';
}

function perfStore() {
  if (!canUseWindow()) return null;
  if (!window.__YAMSHAT_PERF__) {
    window.__YAMSHAT_PERF__ = {
      metrics: [],
      longTasks: 0,
      lastMemorySample: null,
      startedAt: Date.now(),
    };
  }
  return window.__YAMSHAT_PERF__;
}

function pushMetric(metric) {
  const store = perfStore();
  if (!store || !featureFlags.performanceMetrics) return;
  store.metrics.push({ ...metric, recordedAt: new Date().toISOString() });
  if (store.metrics.length > 40) store.metrics.splice(0, store.metrics.length - 40);
  window.dispatchEvent(new CustomEvent('yamshat:performance-metric', { detail: metric }));
}

// 1. Image Optimization Helper
export const getOptimizedImageUrl = (url, width = 800, quality = 80) => {
  if (!url) return '';
  if (url.includes('cdn.yamshat.com') || url.includes(CDN_BASE)) {
    return `${url}?w=${width}&q=${quality}&fmt=webp`;
  }
  return url;
};

// 2. Memory Optimization: Clear heavy objects from large lists
export const optimizeMemoryUsage = (list, threshold = 500) => {
  if (list.length > threshold) {
    console.log(`[Performance] Optimizing memory for list of size ${list.length}`);
    return list.slice(0, threshold);
  }
  return list;
};

// 3. CDN Caching Strategy Helper
export const getCDNConfig = () => ({
  cacheControl: 'public, max-age=31536000, immutable',
  headers: { 'X-CDN-Cache-Strategy': 'Yamshat-Edge-v1' }
});

function observePerformanceEntries() {
  if (!canUseWindow() || typeof PerformanceObserver === 'undefined' || !featureFlags.performanceMetrics) return;

  const safeObserve = (type, handler) => {
    try {
      const observer = new PerformanceObserver((list) => handler(list.getEntries()));
      observer.observe({ type, buffered: true });
    } catch {
      // unsupported entry type
    }
  };

  safeObserve('largest-contentful-paint', (entries) => {
    const entry = entries.at(-1);
    if (entry) pushMetric({ type: 'lcp', value: Math.round(entry.startTime) });
  });

  safeObserve('layout-shift', (entries) => {
    let score = 0;
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) score += entry.value || 0;
    });
    if (score > 0) pushMetric({ type: 'cls', value: Number(score.toFixed(4)) });
  });

  safeObserve('longtask', (entries) => {
    const total = entries.reduce((sum, entry) => sum + Math.round(entry.duration || 0), 0);
    const store = perfStore();
    if (store) store.longTasks += entries.length;
    if (entries.length) pushMetric({ type: 'longtask', value: total, count: entries.length });
  });
}

function sampleMemory() {
  if (!canUseWindow() || !featureFlags.performanceMetrics) return;
  const store = perfStore();
  const memory = window.performance?.memory;
  if (!store || !memory) return;
  store.lastMemorySample = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    recordedAt: new Date().toISOString(),
  };
  
  // Advanced Memory Protection
  if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
    console.warn('[Performance] Memory usage critical. Triggering emergency cleanup.');
    window.dispatchEvent(new CustomEvent('yamshat:memory-critical'));
  }
}

function ensurePreconnect(url) {
  if (!canUseWindow()) return;
  const value = String(url || '').trim();
  if (!/^https?:\/\//i.test(value)) return;
  if (document.head.querySelector(`link[data-preconnect="${value}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = value;
  link.crossOrigin = 'anonymous';
  link.dataset.preconnect = value;
  document.head.appendChild(link);
}

export function initializePerformanceToolkit({ registration = null } = {}) {
  if (initialized || !canUseWindow()) return;
  initialized = true;
  ensurePreconnect(BACKEND_ORIGIN);
  ensurePreconnect(CDN_BASE);
  observePerformanceEntries();
  sampleMemory();
  window.setInterval(sampleMemory, 60_000);
}
