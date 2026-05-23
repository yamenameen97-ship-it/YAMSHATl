import axios from 'axios';
import { API_BASE } from './config.js';
import { clearStoredUser, getAuthToken } from '../utils/auth.js';
import { getCsrfToken } from '../utils/csrf.js';
import sessionManager from '../auth/sessionManager.js';
import { redirectToAppPath } from '../utils/router.js';

const DEFAULT_TIMEOUT_MS = 20_000;
const SAFE_METHODS = new Set(['get', 'head', 'options']);
// 5xx is retried only for safe methods; 408/425/429 retried for everything.
const TRANSIENT_ANY_METHOD_STATUSES = new Set([408, 425, 429]);
const TRANSIENT_SAFE_METHOD_STATUSES = new Set([500, 502, 503, 504]);
const MAX_RETRIES = 3;

// Smart Cache Layer
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheOptions(config = {}) {
  const useCache = Boolean(config.useCache ?? config.cache);
  const forceRefresh = Boolean(config.forceRefresh);
  const cacheTtlMs = Number(config.cacheTtlMs) > 0 ? Number(config.cacheTtlMs) : CACHE_TTL;
  const cacheKey = `${config.baseURL || ''}${config.url}${JSON.stringify(config.params || {})}`;
  return { useCache, forceRefresh, cacheTtlMs, cacheKey };
}

function isRetryable(method, status, config) {
  const normalizedMethod = String(method || 'get').toLowerCase();
  if (config?.noRetry) return false;
  if (!status) {
    // Network / timeout errors retried only for safe methods unless explicitly opted-in
    return SAFE_METHODS.has(normalizedMethod) || Boolean(config?.retryOnNetworkError);
  }
  if (TRANSIENT_ANY_METHOD_STATUSES.has(status)) return true;
  if (TRANSIENT_SAFE_METHOD_STATUSES.has(status) && SAFE_METHODS.has(normalizedMethod)) return true;
  return false;
}

function computeBackoff(attempt) {
  // Exponential backoff with jitter, capped to ~10s.
  const base = Math.min(8000, 2 ** attempt * 500);
  const jitter = Math.floor(Math.random() * 400);
  return base + jitter;
}

const API = axios.create({
  baseURL: API_BASE,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Yamshat-Client': 'web',
  },
});

API.interceptors.request.use(async (config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;

  // Smart Cache Check
  const { useCache, forceRefresh, cacheTtlMs, cacheKey } = getCacheOptions(config);
  config.metadata = { ...(config.metadata || {}), cacheKey, cacheTtlMs, useCache };

  if (String(config.method).toLowerCase() === 'get' && useCache && !forceRefresh) {
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < cacheTtlMs)) {
      config.adapter = () => Promise.resolve({
        data: cachedResponse.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      });
    }
  }

  return config;
});

API.interceptors.response.use(
  (response) => {
    const { cacheKey, useCache } = response.config.metadata || {};

    // Smart Cache Storage
    if (String(response.config.method).toLowerCase() === 'get' && useCache && cacheKey) {
      cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response;
  },
  async (error) => {
    const { config, response } = error || {};
    if (!config) return Promise.reject(error);

    const status = response?.status;

    // ---- Token Refresh Logic ----
    // We only attempt a refresh once per request, and skip it entirely for
    // the refresh / login endpoints to avoid recursion.
    const url = String(config.url || '');
    const isAuthFlow = /\/auth\/(login|register|refresh|verify-|forgot-password|reset-password|captcha|resend-)/.test(url);

    if (status === 401 && !config._retry && !isAuthFlow) {
      config._retry = true;
      try {
        const refreshResponse = await sessionManager.refreshSession({ reason: 'axios_401' });
        const newToken = refreshResponse?.data?.access_token || refreshResponse?.data?.token || getAuthToken();
        if (newToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newToken}`;
        }
        const csrfAfterRefresh = getCsrfToken();
        if (csrfAfterRefresh) config.headers['X-CSRF-Token'] = csrfAfterRefresh;
        return API(config);
      } catch (refreshError) {
        clearStoredUser();
        redirectToAppPath('/login');
        return Promise.reject(refreshError);
      }
    }

    // ---- Advanced Retry Strategy (Exponential Backoff) ----
    config._retryCount = config._retryCount || 0;
    if (isRetryable(config.method, status, config) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      const delay = computeBackoff(config._retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return API(config);
    }

    return Promise.reject(error);
  },
);

export function clearApiCache() {
  cache.clear();
}

export default API;
