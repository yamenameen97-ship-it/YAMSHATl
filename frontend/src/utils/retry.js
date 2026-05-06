export function getBackoffDelayMs(attempt = 0, options = {}) {
  const {
    baseDelayMs = 900,
    maxDelayMs = 30_000,
    jitterRatio = 0.35,
  } = options;

  const safeAttempt = Math.max(0, Number(attempt) || 0);
  const exponential = Math.min(maxDelayMs, baseDelayMs * (2 ** safeAttempt));
  const jitterWindow = Math.max(0, Math.round(exponential * jitterRatio));
  const jitter = jitterWindow ? Math.round((Math.random() * 2 - 1) * jitterWindow) : 0;
  return Math.max(baseDelayMs, Math.min(maxDelayMs, exponential + jitter));
}

export function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function isSafeRetryMethod(method = 'get') {
  return ['get', 'head', 'options'].includes(String(method).toLowerCase());
}

export function isTransientStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}
