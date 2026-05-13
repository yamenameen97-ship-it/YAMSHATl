/**
 * Performance Monitor Utility
 * Tracks key performance metrics (FCP, LCP, CLS, TBT) and reports them.
 * Integrates with Web Vitals for real-world performance monitoring.
 */

import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

const reportThreshold = 0.1; // Report if metric changes by more than 10%

const sendToAnalytics = (metric) => {
  const body = JSON.stringify(metric);
  // Replace with your actual analytics endpoint
  // navigator.sendBeacon('/api/analytics/web-vitals', body);
  console.log('[Performance Monitor] Web Vitals Metric:', metric);
};

let lastCLS = 0;
let lastLCP = 0;
let lastFCP = 0;
let lastTTFB = 0;

const monitorCLS = (metric) => {
  if (Math.abs(metric.value - lastCLS) / (lastCLS || 1) > reportThreshold) {
    sendToAnalytics(metric);
    lastCLS = metric.value;
  }
};

const monitorLCP = (metric) => {
  if (Math.abs(metric.value - lastLCP) / (lastLCP || 1) > reportThreshold) {
    sendToAnalytics(metric);
    lastLCP = metric.value;
  }
};

const monitorFCP = (metric) => {
  if (Math.abs(metric.value - lastFCP) / (lastFCP || 1) > reportThreshold) {
    sendToAnalytics(metric);
    lastFCP = metric.value;
  }
};

const monitorTTFB = (metric) => {
  if (Math.abs(metric.value - lastTTFB) / (lastTTFB || 1) > reportThreshold) {
    sendToAnalytics(metric);
    lastTTFB = metric.value;
  }
};

/**
 * Initializes the performance monitoring.
 * Call this once when your application starts.
 */
export const initPerformanceMonitor = () => {
  if (typeof window === 'undefined') return;

  // Ensure web-vitals is installed: npm install web-vitals
  // Then import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

  getCLS(monitorCLS);
  getFID(sendToAnalytics); // FID doesn't typically fluctuate much, report directly
  getLCP(monitorLCP);
  getFCP(monitorFCP);
  getTTFB(monitorTTFB);

  // Custom metrics example: Measure component render time
  const measureComponentRender = (componentName, callback) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    const duration = end - start;
    console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
    sendToAnalytics({ name: `Custom_${componentName}_Render`, value: duration, delta: duration, id: `${componentName}-${Date.now()}` });
  };

  // Example usage:
  // measureComponentRender('MyComponent', () => { /* render logic */ });
};

// Optional: Add a function to manually log custom events
export const logCustomPerformanceEvent = (name, value, extra = {}) => {
  sendToAnalytics({ name: `Custom_${name}`, value, delta: value, id: `${name}-${Date.now()}`, ...extra });
};
