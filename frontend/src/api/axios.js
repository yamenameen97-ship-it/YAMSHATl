import axios from 'axios';
import { API_BASE } from './config.js';
import { clearStoredUser, getAuthToken, getRefreshToken, isTokenExpired, mergeStoredUser } from '../utils/auth.js';
import { useAppStore } from '../store/appStore.js';

const API = axios.create({
  baseURL: API_BASE,
  timeout: 20_000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

let refreshPromise = null;
const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email', '/auth/resend-verification'];
const plainHttp = axios.create({
  baseURL: API_BASE,
  timeout: 20_000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

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

async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('Cannot refresh while offline');
  return plainHttp.post('/auth/refresh', { refresh_token: refreshToken });
}

API.interceptors.request.use((config) => {
  useAppStore.getState().startRequest();
  const token = getAuthToken();
  if (token) {
    if (isTokenExpired(token)) {
      clearStoredUser();
      fireToast({ type: 'warning', title: 'انتهت الجلسة', description: 'سيتم تحويلك لتسجيل الدخول من جديد.' });
      redirectToLogin();
      return Promise.reject(new axios.Cancel('Session expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

API.interceptors.response.use(
  (response) => {
    useAppStore.getState().finishRequest();
    return response;
  },
  async (error) => {
    useAppStore.getState().finishRequest();
    if (axios.isCancel(error)) return Promise.reject(error);

    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const requestPath = originalRequest?.url || '';
    const shouldSkipRefresh = AUTH_EXCLUDED_PATHS.some((path) => requestPath.includes(path));

    if (!status && !originalRequest._networkRetry && typeof navigator !== 'undefined' && navigator.onLine) {
      originalRequest._networkRetry = true;
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      return API(originalRequest);
    }

    if (status === 429) {
      fireToast({ type: 'warning', title: 'تم الوصول لحد الطلبات', description: 'هدّئ السرعة ثانية واحدة ثم أعد المحاولة.' });
    }

    if (status !== 401 || originalRequest._retry || shouldSkipRefresh) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      if (!refreshPromise) refreshPromise = refreshSession();
      const { data } = await refreshPromise;
      mergeStoredUser(data);
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${data.access_token}`,
        'X-Requested-With': 'XMLHttpRequest',
      };
      fireToast({ type: 'info', title: 'تم تجديد الجلسة', description: 'استمر العمل بدون الحاجة لتسجيل الدخول مجدداً.' });
      return API(originalRequest);
    } catch (refreshError) {
      clearStoredUser();
      fireToast({ type: 'warning', title: 'انتهت صلاحية الجلسة', description: 'سيتم تسجيل الخروج تلقائياً لحماية الحساب.' });
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);

export default API;
