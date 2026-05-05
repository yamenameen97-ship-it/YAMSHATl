import axios from 'axios';
import { API_BASE } from './config.js';
import { clearStoredUser, getAuthToken, getRefreshToken, isTokenExpired, mergeStoredUser } from '../utils/auth.js';

const API = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

let refreshPromise = null;
const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email', '/auth/resend-verification'];
const plainHttp = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

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
  const token = getAuthToken();
  if (token) {
    if (isTokenExpired(token)) {
      clearStoredUser();
      redirectToLogin();
      return Promise.reject(new axios.Cancel('Session expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const requestPath = originalRequest?.url || '';
    const shouldSkipRefresh = AUTH_EXCLUDED_PATHS.some((path) => requestPath.includes(path));

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
      return API(originalRequest);
    } catch (refreshError) {
      clearStoredUser();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);

export default API;
