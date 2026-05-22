import logger from './logger.js';
import featureFlags from './featureFlags.js';

let initialized = false;

function report(kind, payload = {}) {
  if (!featureFlags.frontendLogging) return;
  logger.error(`frontend runtime ${kind}`, payload);
}

export function initializeRuntimeErrorCapture() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    report('error', {
      message: event?.message,
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
      stack: event?.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    report('unhandledrejection', {
      reason: event?.reason?.message || String(event?.reason || ''),
      stack: event?.reason?.stack,
    });
  });
}
