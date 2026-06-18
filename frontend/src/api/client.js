/**
 * API Client للميزات الجديدة (Engagement / Voice Rooms)
 * ===================================================================
 * هذا الملف يوفر `apiClient` بصيغة:
 *   apiClient.get("/api/engagement/tasks")
 *
 * أي أن المسارات تبدأ بـ "/api/..." بشكل صريح.
 * لذلك baseURL هنا هو **origin** فقط (بدون /api) عكس axios.js الذي
 * يضع /api في الـ baseURL.
 *
 * يشترك مع axios.js في:
 *   - الكوكيز (withCredentials)
 *   - X-Requested-With
 *   - CSRF token
 *   - Auth Bearer (إن وُجد)
 *   - معالجة 401 -> session manager
 */
import axios from 'axios';
import { API_BASE } from './config.js';
import { getAuthToken, clearStoredUser } from '../utils/auth.js';
import { getCsrfToken } from '../utils/csrf.js';
import sessionManager from '../auth/sessionManager.js';
import { redirectToAppPath } from '../utils/router.js';

// API_BASE ينتهي بـ /api — نزيل /api لنحصل على الـ origin
const API_ORIGIN = String(API_BASE || '').replace(/\/api\/?$/, '');

export const apiClient = axios.create({
  baseURL: API_ORIGIN,
  timeout: 45_000,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

// Request interceptor — توكن JWT + CSRF
apiClient.interceptors.request.use((config) => {
  try {
    const token = getAuthToken?.();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}

  try {
    const method = String(config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrf = getCsrfToken?.();
      if (csrf) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = csrf;
      }
    }
  } catch (_) {}

  return config;
});

// Response interceptor — التعامل مع 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        clearStoredUser?.();
        sessionManager?.clearSession?.();
      } catch (_) {}
      try {
        if (typeof window !== 'undefined' && !/^\/(login|register|forgot-password|reset-password|verify-email)/.test(window.location.pathname)) {
          redirectToAppPath?.('/login');
        }
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
