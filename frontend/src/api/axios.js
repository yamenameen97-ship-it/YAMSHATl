import axios from 'axios';
import { API_BASE } from './config.js';
import {
  clearStoredUser,
  getAuthToken,
  getStoredUserSnapshot,
  hasStoredSession,
  isTokenExpired,
} from '../utils/auth.js';
import { getCsrfToken } from '../utils/csrf.js';
import { useAppStore } from '../store/appStore.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs, isSafeRetryMethod, sleep } from '../utils/retry.js';
import sessionManager from '../auth/sessionManager.js';

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_CACHE_TTL_MS = 15_000;
const CACHEABLE_STATUS = new Set([200, 203]);
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const responseCache = new Map();
const pendingGetRequests = new Map();

const API = axios.create({
  baseURL: API_BASE,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Yamshat-Client': 'web',
  },
});

const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email', '/auth/resend-verification'];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function serializeParams(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
      return;
    }
    search.append(key, String(value));
  });
  return search.toString();
}

function buildRequestKey(config = {}) {
  const method = String(config.method || 'get').toUpperCase();
  const url = String(config.url || '');
  const params = serializeParams(config.params);
  return `${method}:${url}${params ? `?${params}` : ''}`;
}

function getCacheTtlMs(config = {}) {
  const ttl = Number(config.cacheTtlMs ?? config.meta?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_CACHE_TTL_MS;
}

function getCachedResponse(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return entry;
}

function cloneCachedResponse(entry, config) {
  return {
    data: entry.data,
    status: entry.status,
    statusText: entry.statusText,
    headers: entry.headers,
    config,
    request: undefined,
    cached: true,
  };
}

function storeCachedResponse(key, response, ttlMs) {
  if (!CACHEABLE_STATUS.has(Number(response?.status))) return;
  responseCache.set(key, {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    expiresAt: Date.now() + ttlMs,
  });
}

function invalidateMatchingCache(url = '') {
  const cleanUrl = String(url || '').split('?')[0];
  if (!cleanUrl) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(cleanUrl)) responseCache.delete(key);
  }
}

function fireToast(toast) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yamshat:toast', { detail: toast }));
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const loginPath = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
  if (window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  }
}

function attachCommonHeaders(config) {
  config.headers = {
    ...(config.headers || {}),
    'X-Requested-With': 'XMLHttpRequest',
    'X-Yamshat-Client': 'web',
  };
  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
  return config;
}

API.interceptors.request.use(async (config) => {
  useAppStore.getState().startRequest();
  attachCommonHeaders(config);

  const requestPath = config?.url || '';
  const shouldSkipRefresh = AUTH_EXCLUDED_PATHS.some((path) => requestPath.includes(path));
  const session = getStoredUserSnapshot();
  const token = getAuthToken();
  const hasExpiredAccessToken = Boolean(session?.access_token) && isTokenExpired(session.access_token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (!shouldSkipRefresh && hasStoredSession() && hasExpiredAccessToken) {
    try {
      const { data } = await sessionManager.refreshSession({ reason: 'request-interceptor' });
      config.headers.Authorization = `Bearer ${data.access_token}`;
      fireToast({ type: 'info', title: 'تمت استعادة الجلسة', description: 'تم تجديد الجلسة تلقائياً قبل تنفيذ الطلب.' });
    } catch (error) {
      clearStoredUser();
      fireToast({ type: 'warning', title: 'انتهت صلاحية الجلسة', description: 'سيتم تحويلك لتسجيل الدخول من جديد.' });
      redirectToLogin();
      return Promise.reject(new axios.Cancel(error?.message || 'Session refresh failed'));
    }
  }

  const method = String(config.method || 'get').toLowerCase();
  if (method !== 'get' || config.cache === false) {
    if (method !== 'get') invalidateMatchingCache(config.url || '');
    return config;
  }

  const key = buildRequestKey(config);
  config.meta = {
    ...(config.meta || {}),
    requestKey: key,
    cacheTtlMs: getCacheTtlMs(config),
  };

  if (!config.forceRefresh) {
    const cached = getCachedResponse(key);
    if (cached) {
      config.adapter = () => Promise.resolve(cloneCachedResponse(cached, config));
      config.meta.fromCache = true;
      return config;
    }
  }

  const existingPending = pendingGetRequests.get(key);
  if (existingPending && config.dedupe !== false) {
    config.adapter = () => existingPending.promise.then((response) => ({ ...response, config }));
    config.meta.fromPending = true;
    return config;
  }

  pendingGetRequests.set(key, deferred());
  return config;
});

API.interceptors.response.use(
  (response) => {
    useAppStore.getState().finishRequest();
    const requestKey = response?.config?.meta?.requestKey;
    if (requestKey && !response?.cached && !response?.config?.meta?.fromPending) {
      const ttlMs = getCacheTtlMs(response.config);
      storeCachedResponse(requestKey, response, ttlMs);
      const pending = pendingGetRequests.get(requestKey);
      if (pending) {
        pending.resolve(cloneCachedResponse({
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          expiresAt: Date.now() + ttlMs,
        }, response.config));
        pendingGetRequests.delete(requestKey);
      }
    }
    return response;
  },
  async (error) => {
    useAppStore.getState().finishRequest();
    if (axios.isCancel(error)) {
      logger.debug('request cancelled', { url: error?.config?.url });
      return Promise.reject(error);
    }

    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const requestPath = originalRequest?.url || '';
    const shouldSkipRefresh = AUTH_EXCLUDED_PATHS.some((path) => requestPath.includes(path));
    const requestKey = originalRequest?.meta?.requestKey;

    const retryCount = Number(originalRequest._networkRetryCount || 0);
    const method = String(originalRequest?.method || 'get').toLowerCase();
    const canAutoRetry = typeof navigator !== 'undefined'
      && navigator.onLine
      && (isSafeRetryMethod(method) || originalRequest?.allowAutoRetry === true);
    const isTransientError = !status || RETRYABLE_STATUSES.has(Number(status));

    if (error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout')) {
      fireToast({ type: 'warning', title: 'تأخر في الشبكة', description: 'الطلب أخذ وقتاً أطول من المتوقع. سنحاول مجدداً إذا كان ذلك آمناً.' });
    }

    if (isTransientError && canAutoRetry && retryCount < 3) {
      originalRequest._networkRetryCount = retryCount + 1;
      const delay = getBackoffDelayMs(retryCount, {
        baseDelayMs: status === 429 ? 1200 : 700,
        maxDelayMs: status === 429 ? 12000 : 8000,
        jitterRatio: 0.45,
      });
      logger.warn('retrying transient request', { url: requestPath, status, attempt: retryCount + 1, delay });
      await sleep(delay);
      return API(originalRequest);
    }

    if (status !== 401 || originalRequest._retry || shouldSkipRefresh || !hasStoredSession()) {
      if (requestKey) {
        const pending = pendingGetRequests.get(requestKey);
        if (pending) {
          pending.reject(error);
          pendingGetRequests.delete(requestKey);
        }
      }
      logger.error('api request failed', {
        url: requestPath,
        status,
        detail: error?.response?.data?.detail || error?.message,
      });
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const { data } = await sessionManager.refreshSession({ reason: '401-retry' });
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${data.access_token}`,
      };
      attachCommonHeaders(originalRequest);
      fireToast({ type: 'info', title: 'تم تجديد الجلسة', description: 'استمر العمل بدون الحاجة لتسجيل الدخول مجدداً.' });
      return API(originalRequest);
    } catch (refreshError) {
      if (requestKey) {
        const pending = pendingGetRequests.get(requestKey);
        if (pending) {
          pending.reject(refreshError);
          pendingGetRequests.delete(requestKey);
        }
      }
      clearStoredUser();
      logger.warn('session refresh failed', { detail: refreshError?.response?.data?.detail || refreshError?.message });
      fireToast({ type: 'warning', title: 'انتهت صلاحية الجلسة', description: 'سيتم تسجيل الخروج تلقائياً لحماية الحساب.' });
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);

export default API;
