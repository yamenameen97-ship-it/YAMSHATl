import axios from 'axios';
import { API_BASE } from './config.js';
import { clearStoredUser, getAuthToken, getRefreshToken, mergeStoredUser } from '../utils/auth.js';

const API = axios.create({
  baseURL: API_BASE,
});

let refreshPromise = null;
const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email', '/auth/resend-verification'];
const plainHttp = axios.create({ baseURL: API_BASE });

async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  return plainHttp.post('/auth/refresh', { refresh_token: refreshToken });
}

API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const requestPath = originalRequest?.url || '';
    const shouldSkipRefresh = AUTH_EXCLUDED_PATHS.some((path) => requestPath.includes(path));

    if (status !== 401 || originalRequest._retry || shouldSkipRefresh) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshSession();
      }
      const { data } = await refreshPromise;
      mergeStoredUser(data);
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${data.access_token}`,
      };
      return API(originalRequest);
    } catch (refreshError) {
      clearStoredUser();
      if (typeof window !== 'undefined') {
        const loginPath = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
      }
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);

export default API;
