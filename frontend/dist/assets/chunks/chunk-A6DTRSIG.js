import {
  BACKEND_ORIGIN,
  CDN_BASE
} from "./chunk-FJN4GIYV.js";
import {
  define_import_meta_env_default,
  init_define_import_meta_env
} from "./chunk-SOYW6UE7.js";

// src/utils/performance.js
init_define_import_meta_env();

// src/utils/featureFlags.js
init_define_import_meta_env();
function readFlag(name, fallback = true) {
  const value = define_import_meta_env_default[name];
  if (value === void 0) return fallback;
  return String(value).trim().toLowerCase() !== "false";
}
var featureFlags = {
  offlineQueue: readFlag("VITE_ENABLE_OFFLINE_QUEUE", true),
  chatCache: readFlag("VITE_ENABLE_CHAT_CACHE", true),
  frontendLogging: readFlag("VITE_ENABLE_FRONTEND_LOGGING", true),
  performanceMetrics: readFlag("VITE_ENABLE_PERFORMANCE_METRICS", true)
};
var featureFlags_default = featureFlags;

// src/utils/performance.js
var initialized = false;
function canUseWindow() {
  return typeof window !== "undefined";
}
function perfStore() {
  if (!canUseWindow()) return null;
  if (!window.__YAMSHAT_PERF__) {
    window.__YAMSHAT_PERF__ = {
      metrics: [],
      longTasks: 0,
      cdnHits: 0,
      lastMemorySample: null,
      startedAt: Date.now()
    };
  }
  return window.__YAMSHAT_PERF__;
}
function pushMetric(metric) {
  const store = perfStore();
  if (!store || !featureFlags_default.performanceMetrics) return;
  store.metrics.push({ ...metric, recordedAt: (/* @__PURE__ */ new Date()).toISOString() });
  if (store.metrics.length > 60) store.metrics.splice(0, store.metrics.length - 60);
  window.dispatchEvent(new CustomEvent("yamshat:performance-metric", { detail: metric }));
}
var getOptimizedImageUrl = (url, width = 800, quality = 80, format = "webp") => {
  if (!url) return "";
  const target = String(url);
  if (!CDN_BASE && !target.includes("cdn.")) return target;
  const separator = target.includes("?") ? "&" : "?";
  if (/[?&](w|width)=/i.test(target)) return target;
  return `${target}${separator}w=${width}&q=${quality}&fmt=${format}`;
};
var getMediaDeliveryProfile = (kind = "image") => {
  if (kind === "video") {
    return {
      preferredCdn: CDN_BASE || "https://cdn.yamshat.com",
      ttl: "7d",
      strategy: "edge-cache + adaptive bitrate + signed playback URLs"
    };
  }
  if (kind === "file") {
    return {
      preferredCdn: CDN_BASE || "https://cdn.yamshat.com",
      ttl: "24h",
      strategy: "download acceleration + regional edge caching"
    };
  }
  return {
    preferredCdn: CDN_BASE || "https://cdn.yamshat.com",
    ttl: "30d",
    strategy: "image resize on edge + webp/avif negotiation"
  };
};
var getCDNConfig = () => ({
  baseUrl: CDN_BASE || "https://cdn.yamshat.com",
  regions: ["mea", "eu", "us", "apac"],
  cacheControl: "public, max-age=31536000, stale-while-revalidate=86400, immutable",
  acceleration: ["images", "video segments", "downloads"],
  signedDelivery: true
});
function observePerformanceEntries() {
  if (!canUseWindow() || typeof PerformanceObserver === "undefined" || !featureFlags_default.performanceMetrics) return;
  const safeObserve = (type, handler) => {
    try {
      const observer = new PerformanceObserver((list) => handler(list.getEntries()));
      observer.observe({ type, buffered: true });
    } catch {
    }
  };
  safeObserve("largest-contentful-paint", (entries) => {
    const entry = entries.at(-1);
    if (entry) pushMetric({ type: "lcp", value: Math.round(entry.startTime) });
  });
  safeObserve("layout-shift", (entries) => {
    let score = 0;
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) score += entry.value || 0;
    });
    if (score > 0) pushMetric({ type: "cls", value: Number(score.toFixed(4)) });
  });
  safeObserve("resource", (entries) => {
    const cdnEntries = entries.filter((entry) => String(entry.name || "").includes(CDN_BASE || "cdn."));
    const store = perfStore();
    if (store) store.cdnHits += cdnEntries.length;
    if (cdnEntries.length) pushMetric({ type: "cdn-hit", count: cdnEntries.length });
  });
}
function sampleMemory() {
  if (!canUseWindow() || !featureFlags_default.performanceMetrics) return;
  const store = perfStore();
  const memory = window.performance?.memory;
  if (!store || !memory) return;
  store.lastMemorySample = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    recordedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
    window.dispatchEvent(new CustomEvent("yamshat:memory-critical"));
  }
}
function ensurePreconnect(url) {
  if (!canUseWindow()) return;
  const value = String(url || "").trim();
  if (!/^https?:\/\//i.test(value)) return;
  if (document.head.querySelector(`link[data-preconnect="${value}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = value;
  link.crossOrigin = "anonymous";
  link.dataset.preconnect = value;
  document.head.appendChild(link);
}
function initializePerformanceToolkit({ registration = null } = {}) {
  if (initialized || !canUseWindow()) return;
  initialized = true;
  ensurePreconnect(BACKEND_ORIGIN);
  ensurePreconnect(CDN_BASE || "https://cdn.yamshat.com");
  observePerformanceEntries();
  sampleMemory();
  if (registration?.active) {
    pushMetric({ type: "sw-active", value: 1 });
  }
  window.setInterval(sampleMemory, 6e4);
}

export {
  featureFlags_default,
  getOptimizedImageUrl,
  getMediaDeliveryProfile,
  getCDNConfig,
  initializePerformanceToolkit
};
