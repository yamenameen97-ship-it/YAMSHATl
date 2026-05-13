import axios from 'axios';
import { API_BASE } from './config.js';
import { clearStoredUser, getAuthToken } from '../utils/auth.js';
import { getCsrfToken } from '../utils/csrf.js';
import sessionManager from '../auth/sessionManager.js';
import { redirectToAppPath } from '../utils/router.js';

const DEFAULT_TIMEOUT_MS = 20_000;
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const AUTH_REFRESH_SKIP_PATTERNS = [
  '/auth/login',
  '/auth/dev-login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/verify-2fa-login',
  '/auth/resend-verification',
  '/auth/captcha',
  '/auth/forgot-password',
  '/auth/verify-reset-code',
  '/auth/reset-password',
];

// Smart Cache Layer
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Request Deduplication Layer
const pendingRequests = new Map();

const API = axios.create({
  baseURL: API_BASE,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
});

const shouldSkipRefresh = (config = {}) => {
  const url = String(config?.url || '');
  return AUTH_REFRESH_SKIP_PATTERNS.some((pattern) => url.includes(pattern));
};

API.interceptors.request.use(async (config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;

  // Smart Cache Check
  if (config.method === 'get' && config.useCache) {
    const cacheKey = `${config.url}${JSON.stringify(config.params)}`;
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
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

  // Request Deduplication
  const requestKey = `${config.method}_${config.url}_${JSON.stringify(config.params || config.data)}`;
  if (pendingRequests.has(requestKey)) {
    return Promise.reject({ isDeduplicated: true, requestKey });
  }
  pendingRequests.set(requestKey, true);

  return config;
});

API.interceptors.response.use(
  (response) => {
    const requestKey = `${response.config.method}_${response.config.url}_${JSON.stringify(response.config.params || response.config.data)}`;
    pendingRequests.delete(requestKey);

    // Smart Cache Storage
    if (response.config.method === 'get' && response.config.useCache) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params)}`;
      cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response;
  },
  async (error) => {
    if (error.isDeduplicated) {
      console.log(`Request deduplicated: ${error.requestKey}`);
      return Promise.reject(error);
    }

    const { config, response } = error;
    if (config) {
      const requestKey = `${config.method}_${config.url}_${JSON.stringify(config.params || config.data)}`;
      pendingRequests.delete(requestKey);
    }

    // Token Refresh Logic
    if (response?.status === 401 && !config._retry && !shouldSkipRefresh(config)) {
      config._retry = true;
      try {
        const { data } = await sessionManager.refreshSession();
        const newToken = data.access_token;
        config.headers.Authorization = `Bearer ${newToken}`;
        return API(config);
      } catch (refreshError) {
        clearStoredUser();
        redirectToAppPath('/login');
        return Promise.reject(refreshError);
      }
    }

    // Advanced Retry Strategy (Exponential Backoff)
    const retryCount = config._retryCount || 0;
    if (RETRYABLE_STATUSES.has(response?.status) && retryCount < 3) {
      config._retryCount = retryCount + 1;
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return API(config);
    }

    return Promise.reject(error);
  }
);

export default API;
