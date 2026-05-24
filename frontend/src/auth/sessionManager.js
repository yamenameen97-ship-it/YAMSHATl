import axios from 'axios';
import { API_BASE } from '../api/config.js';
import { getCsrfToken } from '../utils/csrf.js';
import { clearStoredUser, getSessionTtlMs, hasStoredSession, mergeStoredUser } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs, sleep } from '../utils/retry.js';

const plainHttp = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Yamshat-Client': 'web',
  },
});

const listeners = new Set();
const state = {
  refreshPromise: null,
  consecutiveFailures: 0,
  lastSuccessAt: 0,
  cooldownUntil: 0,
  circuitOpenUntil: 0,
  lastFailureReason: '',
};

let multiTabSyncInitialized = false;
let lastLifecycleRefreshAt = 0;
const LIFECYCLE_REFRESH_WINDOW_MS = 120_000;
const LIFECYCLE_REFRESH_THROTTLE_MS = 20_000;

function notify() {
  const snapshot = getRefreshState();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore listener failures
    }
  });
}

function createRefreshError(message, code = 'REFRESH_BLOCKED', status = 0) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function currentTime() {
  return Date.now();
}

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function resetFailureState() {
  state.consecutiveFailures = 0;
  state.cooldownUntil = 0;
  state.circuitOpenUntil = 0;
  state.lastFailureReason = '';
}

function registerFailure(error) {
  state.consecutiveFailures += 1;
  state.lastFailureReason = error?.response?.data?.detail || error?.message || 'refresh_failed';
  const cooldownDelay = getBackoffDelayMs(state.consecutiveFailures - 1, {
    baseDelayMs: 1200,
    maxDelayMs: 30_000,
    jitterRatio: 0.35,
  });
  state.cooldownUntil = currentTime() + cooldownDelay;
  if (state.consecutiveFailures >= 3) {
    state.circuitOpenUntil = currentTime() + Math.max(15_000, cooldownDelay);
  }
}

function csrfHeaders() {
  const csrfToken = getCsrfToken();
  return csrfToken ? { 'X-CSRF-Token': csrfToken } : {};
}

function hasRefreshContext() {
  return Boolean(getCsrfToken());
}

export function normalizeAuthError(error) {
  if (!error?.response) {
    return {
      message: 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.',
      type: 'NETWORK_ERROR',
      status: 0,
      original: error,
    };
  }

  const status = Number(error.response.status || 0);
  const detail = error.response.data?.detail;
  let message = 'حدث خطأ غير متوقع في المصادقة.';

  if (typeof detail === 'string' && detail.trim()) message = detail.trim();
  else if (detail?.message) message = String(detail.message);

  return {
    message,
    status,
    type: status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
    original: error,
  };
}

export function getRefreshState() {
  return {
    inFlight: Boolean(state.refreshPromise),
    consecutiveFailures: state.consecutiveFailures,
    cooldownUntil: state.cooldownUntil,
    circuitOpenUntil: state.circuitOpenUntil,
    lastSuccessAt: state.lastSuccessAt,
    lastFailureReason: state.lastFailureReason,
  };
}

export function subscribeToRefreshState(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function shouldRefreshSoon(windowMs = 60_000) {
  const ttl = getSessionTtlMs();
  return ttl !== null && ttl <= windowMs;
}

function maybeLifecycleRefresh(reason, { force = false } = {}) {
  if (!hasStoredSession()) return;
  const now = currentTime();
  if (!force && now - lastLifecycleRefreshAt < LIFECYCLE_REFRESH_THROTTLE_MS) return;
  if (!force && !shouldRefreshSoon(LIFECYCLE_REFRESH_WINDOW_MS)) return;

  lastLifecycleRefreshAt = now;
  refreshSession({ reason, force }).catch((error) => {
    logger.warn('lifecycle session refresh skipped', {
      reason,
      detail: error?.message || 'refresh_failed',
    });
  });
}

export function initMultiTabSync() {
  if (typeof window === 'undefined' || multiTabSyncInitialized) return;
  multiTabSyncInitialized = true;

  window.addEventListener('online', () => {
    maybeLifecycleRefresh('online', { force: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      maybeLifecycleRefresh('visibility');
    }
  });
}

export async function refreshSession(options = {}) {
  const { reason = 'manual', force = false, retryCount = 0 } = options;

  if (state.refreshPromise) return state.refreshPromise;
  if (isOffline()) throw createRefreshError('لا يمكن التحديث أثناء عدم الاتصال بالإنترنت', 'OFFLINE');

  const now = currentTime();
  if (!hasRefreshContext()) {
    clearStoredUser();
    throw createRefreshError('لا توجد جلسة صالحة للتحديث، سجل الدخول من جديد', 'NO_REFRESH_CONTEXT', 400);
  }
  if (!force && state.circuitOpenUntil > now) {
    throw createRefreshError('نظام الحماية مفعل حالياً، حاول مجدداً لاحقاً', 'CIRCUIT_OPEN');
  }
  if (!force && state.cooldownUntil > now) {
    throw createRefreshError('يرجى الانتظار قليلاً قبل المحاولة مجدداً', 'COOLDOWN_ACTIVE');
  }

  logger.info('refresh session requested', { reason, retryCount });

  state.refreshPromise = (async () => {
    try {
      const response = await plainHttp.post('/auth/refresh', {}, { headers: csrfHeaders() });
      mergeStoredUser(response.data);
      resetFailureState();
      state.lastSuccessAt = currentTime();
      return response;
    } catch (error) {
      const normalized = normalizeAuthError(error);

      if (retryCount < 2 && (normalized.type === 'NETWORK_ERROR' || normalized.status >= 500)) {
        const delay = getBackoffDelayMs(retryCount);
        await sleep(delay);
        state.refreshPromise = null;
        return refreshSession({ ...options, retryCount: retryCount + 1, force: true });
      }

      registerFailure(error);
      const status = Number(error?.response?.status || 0);
      if ([400, 401, 403, 404].includes(status)) {
        clearStoredUser();
      }
      throw normalized;
    } finally {
      state.refreshPromise = null;
      notify();
    }
  })();

  notify();
  return state.refreshPromise;
}

const sessionManager = {
  refreshSession,
  shouldRefreshSoon,
  subscribeToRefreshState,
  getRefreshState,
  normalizeAuthError,
  initMultiTabSync,
};

export default sessionManager;
