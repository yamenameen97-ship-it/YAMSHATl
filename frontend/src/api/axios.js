import axios from 'axios';
import { API_BASE } from './config.js';
import { clearStoredUser, getAuthToken } from '../utils/auth.js';
import { getCsrfToken } from '../utils/csrf.js';
import sessionManager from '../auth/sessionManager.js';
import { redirectToAppPath } from '../utils/router.js';

// Render passe en état « cold » après 15 min d'inactivité, le premier appel
// peut prendre jusqu'à 30s. On augmente le timeout pour éviter d'avorter le
// chargement initial du profil قبل أن ينتهي الباك اند من الاستيقاظ.
const DEFAULT_TIMEOUT_MS = 45_000;
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options']);
const NON_RETRYABLE_PATH_PATTERNS = [
  /\/auth\/(login|register|captcha|verify-email|verify-2fa-login|forgot-password|verify-reset-code|reset-password|resend-verification|social-login|dev-login)(\/|$)/i,
];

function shouldRetryRequest(config = {}, responseStatus) {
  if (!RETRYABLE_STATUSES.has(responseStatus)) return false;
  if (config.retry === false) return false;

  const method = String(config.method || 'get').toLowerCase();
  if (config.retryable === true) return true;
  if (!IDEMPOTENT_METHODS.has(method)) return false;

  const url = String(config.url || '');
  if (NON_RETRYABLE_PATH_PATTERNS.some((pattern) => pattern.test(url))) {
    return false;
  }

  return true;
}

// v22: كشف الجوال لإعطائه timeout أعلى على الشبكات البطيئة
const IS_MOBILE_UA = typeof navigator !== 'undefined' &&
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

// Smart Cache Layer
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ✅ FIX: أنماط مسارات البث التي ترجع 403/404 بشكل طبيعي
// (غير مصرح / البث انتهى / لا توجد تعليقات) — لا تسجل أخطائها تلقائياً
const SILENT_404_403_PATTERNS = [
  /\/live\/[^/]+\/analytics$/i,
  /\/live_comments\/[^/]+/i,
  /\/live_room\/[^/]+/i,
  /\/live\/[^/]+\/viewers$/i,
];

const shouldSilenceError = (config = {}, status) => {
  if (status !== 403 && status !== 404) return false;
  if (config.silent === true) return true;
  const url = String(config.url || '');
  return SILENT_404_403_PATTERNS.some((re) => re.test(url));
};

function getCacheOptions(config = {}) {
  const useCache = Boolean(config.useCache ?? config.cache);
  const forceRefresh = Boolean(config.forceRefresh);
  const cacheTtlMs = Number(config.cacheTtlMs) > 0 ? Number(config.cacheTtlMs) : CACHE_TTL;
  const cacheKey = `${config.baseURL || ''}${config.url}${JSON.stringify(config.params || {})}`;
  return { useCache, forceRefresh, cacheTtlMs, cacheKey };
}

const API = axios.create({
  baseURL: API_BASE,
  // v22: timeout أعلى على الجوال لتحمل الشبكات الضعيفة (3G/4G)
  timeout: IS_MOBILE_UA ? 60_000 : DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    // مهم: تعريف الطلب كـ XMLHttpRequest عشان يعدي CSRF protection
    'X-Requested-With': 'XMLHttpRequest',
    // تعريف نوع العميل للـ backend (يفرق بين web/web-mobile)
    'X-Yamshat-Client': IS_MOBILE_UA ? 'web-mobile' : 'web',
    'Accept': 'application/json',
  },
});

API.interceptors.request.use(async (config) => {
  const token = getAuthToken();
  if (token && !config._skip_auth) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config._skip_auth) {
    delete config.headers.Authorization;
  }
  
  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;

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

    // معالجة خاصة لأخطاء 403 Forbidden على المسارات الصامتة
    if (response?.status === 403 && config && !config._retried_without_token) {
      const url = String(config.url || '');
      const isSilentPath = SILENT_404_403_PATTERNS.some(re => re.test(url));
      
      if (isSilentPath) {
        config._retried_without_token = true;
        config._skip_auth = true;
        return API(config);
      }
    }

    // Token Refresh Logic
    if (response?.status === 401 && config && !config._retry) {
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
    const retryCount = config?._retryCount || 0;
    if (config && shouldRetryRequest(config, response?.status) && retryCount < 3) {
      config._retryCount = retryCount + 1;
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return API(config);
    }

    // ✅ FIX: وسم الخطأ بأنه "صامت" حتى يعرف المستخدمون أنه لا داعي للسجل في الكونسول
    if (config && shouldSilenceError(config, response?.status)) {
      error.isSilent = true;
      error.silent = true;
    }

    return Promise.reject(error);
  }
);

export default API;
