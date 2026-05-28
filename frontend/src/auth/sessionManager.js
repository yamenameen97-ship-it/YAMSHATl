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

/**
 * Centralized Error Normalization
 */
export function normalizeAuthError(error) {
  if (!error.response) {
    return {
      message: 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.',
      type: 'NETWORK_ERROR',
      status: 0
    };
  }
  const status = error.response.status;
  const detail = error.response.data?.detail;
  let message = 'حدث خطأ غير متوقع في المصادقة.';
  
  if (typeof detail === 'string') message = detail;
  else if (detail?.message) message = detail.message;
  
  return {
    message,
    status,
    type: status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
    original: error
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

/**
 * Multi-tab Session Sync
 */
export function initMultiTabSync() {
  if (typeof window === 'undefined') return;
  window.addEventListener('storage', (event) => {
    if (event.key === 'yamshat_auth_user' || event.key === 'yamshat_session_active') {
      logger.info('Auth storage changed in another tab, syncing state...');
      // Usually the store or app-level hook will react to this
      // We can also force a refresh if needed
      if (!event.newValue) {
        window.location.reload(); // Session cleared elsewhere
      }
    }
  });
}

/**
 * Enhanced Refresh with Retry Logic
 */
export async function refreshSession(options = {}) {
  const { reason = 'manual', force = false, retryCount = 0 } = options;

  if (state.refreshPromise) return state.refreshPromise;
  if (isOffline()) throw createRefreshError('لا يمكن التحديث أثناء عدم الاتصال بالإنترنت', 'OFFLINE');

  const now = currentTime();
  if (!force && state.circuitOpenUntil > now) {
    throw createRefreshError('نظام الحماية مفعل حالياً، حاول مجدداً لاحقاً', 'CIRCUIT_OPEN');
  }
  if (!force && state.cooldownUntil > now) {
    throw createRefreshError('يرجى الانتظار قليلاً قبل المحاولة مجدداً', 'COOLDOWN_ACTIVE');
  }

  if (!hasStoredSession()) {
    throw createRefreshError('لا توجد جلسة محفوظة لتحديثها', 'NO_SESSION');
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
      
      // Retry logic for transient errors
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
  initMultiTabSync
};

export default sessionManager;
