import axios from 'axios';
import { API_BASE } from '../api/config.js';
import { getCsrfToken } from '../utils/csrf.js';
import { clearStoredUser, getSessionTtlMs, mergeStoredUser } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs } from '../utils/retry.js';

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

function createRefreshError(message, code = 'REFRESH_BLOCKED') {
  const error = new Error(message);
  error.code = code;
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

export async function refreshSession(options = {}) {
  const { reason = 'manual', force = false } = options;

  if (state.refreshPromise) return state.refreshPromise;
  if (isOffline()) throw createRefreshError('Cannot refresh while offline', 'OFFLINE');

  const now = currentTime();
  if (!force && state.circuitOpenUntil > now) {
    throw createRefreshError('Refresh circuit breaker is open', 'CIRCUIT_OPEN');
  }
  if (!force && state.cooldownUntil > now) {
    throw createRefreshError('Refresh cooldown is active', 'COOLDOWN_ACTIVE');
  }

  logger.info('refresh session requested', { reason });
  state.refreshPromise = plainHttp.post('/auth/refresh', {}, { headers: csrfHeaders() });
  notify();

  try {
    const response = await state.refreshPromise;
    mergeStoredUser(response.data);
    resetFailureState();
    state.lastSuccessAt = currentTime();
    return response;
  } catch (error) {
    registerFailure(error);
    const status = Number(error?.response?.status || 0);
    if ([400, 401, 403, 404].includes(status)) {
      clearStoredUser();
    }
    throw error;
  } finally {
    state.refreshPromise = null;
    notify();
  }
}

const sessionManager = {
  refreshSession,
  shouldRefreshSoon,
  subscribeToRefreshState,
  getRefreshState,
};

export default sessionManager;
