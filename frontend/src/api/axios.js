import axios from 'axios';
import { API_BASE } from './config.js';
import { clearStoredUser, getAuthToken } from '../utils/auth.js';
import { getCsrfToken } from '../utils/csrf.js';
import sessionManager from '../auth/sessionManager.js';
import { redirectToAppPath } from '../utils/router.js';

const DEFAULT_TIMEOUT_MS = 20_000;
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

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

const API = axios.create({
  baseURL: API_BASE,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
});

const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/captcha',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/verify-reset-code',
  '/auth/reset-password',
  '/auth/dev-login',
];

function isPublicAuthRequest(config = {}) {
  const explicitPublicFlag = config.public === true || config.skipAuth === true || config.skipCsrf === true;
  if (explicitPublicFlag) return true;

  const requestUrl = String(config.url || '').trim();
  if (!requestUrl) return false;

  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => requestUrl === endpoint || requestUrl.startsWith(`${endpoint}?`));
}

API.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  const isPublicRequest = isPublicAuthRequest(config);
  const token = getAuthToken();
  if (token && !isPublicRequest) config.headers.Authorization = `Bearer ${token}`;
  
  const csrfToken = getCsrfToken();
  if (csrfToken && !isPublicRequest) config.headers['X-CSRF-Token'] = csrfToken;

  // Smart Cache Check
  const { useCache, forceRefresh, cacheTtlMs, cacheKey } = getCacheOptions(config);
  config.metadata = { ...(config.metadata || {}), cacheKey, cacheTtlMs, useCache };

  if (config.method === 'get' && useCache && !forceRefresh) {
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < cacheTtlMs)) {
      config.adapter = () => Promise.resolve({
        data: cachedResponse.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      });
    }
  }

  return config;
});

API.interceptors.response.use(
  (response) => {
    const { cacheKey, useCache } = response.config.metadata || {};

    // Smart Cache Storage
    if (response.config.method === 'get' && useCache && cacheKey) {
      cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response;
  },
  async (error) => {
    const { config, response } = error;

    // Token Refresh Logic
    if (response?.status === 401 && config && !config._retry) {
      config._retry = true;
      try {
        const { data } = await sessionManager.refreshSession();
        const newToken = data.access_token;
        if (!isPublicAuthRequest(config)) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newToken}`;
        }
        return API(config);
      } catch (refreshError) {
        clearStoredUser();
        redirectToAppPath('/login');
        return Promise.reject(refreshError);
      }
    }

    // Advanced Retry Strategy (Exponential Backoff)
    const retryCount = config?._retryCount || 0;
    if (config && RETRYABLE_STATUSES.has(response?.status) && retryCount < 3) {
      config._retryCount = retryCount + 1;
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return API(config);
    }

    return Promise.reject(error);
  }
);

export default API;
