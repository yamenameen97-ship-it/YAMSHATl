/**
 * YAMSHAT — authStore.js (v89.10 DEEP FIX)
 * ✅ تم إصلاح الملف — كان بدائياً جداً (10 أسطر فقط)
 * ✅ يدير حالة المصادقة بشكل كامل مع Zustand
 * ✅ يدعم hydrate من الخادم، تحديث الجلسة، تسجيل الخروج
 */
import { create } from 'zustand';
import API from '../api/axios.js';
import {
  getStoredUser,
  mergeStoredUser,
  clearStoredUser,
  hasStoredSession,
  getToken,
  isAuthenticated,
} from '../utils/auth.js';
import { refreshSession } from '../auth/sessionManager.js';
import logger from '../utils/logger.js';

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: getToken(),
  isAuthenticated: isAuthenticated(),
  loading: false,
  error: null,

  // تسجيل الدخول
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/login', credentials);
      const userData = mergeStoredUser(data);
      set({
        user: userData,
        token: data.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      logger.info('Login successful', { username: userData?.username });
      return userData;
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'فشل تسجيل الدخول';
      set({ loading: false, error: message, isAuthenticated: false });
      logger.warn('Login failed', { error: message });
      throw new Error(message);
    }
  },

  // تسجيل حساب جديد
  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/register', userData);
      const merged = mergeStoredUser(data);
      set({
        user: merged,
        token: data.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      logger.info('Registration successful', { username: userData?.username });
      return merged;
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'فشل التسجيل';
      set({ loading: false, error: message });
      throw new Error(message);
    }
  },

  // تحديث الجلسة من الخادم
  hydrate: async () => {
    if (!hasStoredSession()) {
      set({ isAuthenticated: false, user: null, token: '' });
      return;
    }
    try {
      await refreshSession({ reason: 'hydrate' });
      const user = getStoredUser();
      set({ user, token: getToken(), isAuthenticated: true });
    } catch (err) {
      logger.warn('Auth hydrate failed', { error: err?.message });
      // لا نمسح الجلسة عند فشل الشبكة — قد تكون مشكلة مؤقتة
    }
  },

  // تحديث بيانات المستخدم
  updateUser: (patch) => {
    const merged = mergeStoredUser(patch);
    set({ user: merged });
  },

  // تسجيل الخروج
  logout: async () => {
    try {
      await API.post('/auth/logout', {}).catch(() => {});
    } catch {}
    clearStoredUser();
    set({ user: null, token: '', isAuthenticated: false, error: null });
    logger.info('Logout successful');
    window.location.hash = '#/login';
  },

  // مسح الخطأ
  clearError: () => set({ error: null }),
}));

// تصدير بسيط متوافق مع الاستخدام القديم
export const authStore = {
  saveSession(data) {
    mergeStoredUser(data);
    useAuthStore.setState({
      user: getStoredUser(),
      token: data.token,
      isAuthenticated: true,
    });
  },
  logout() {
    clearStoredUser();
    useAuthStore.setState({ user: null, token: '', isAuthenticated: false });
    window.location.hash = '#/login';
  },
};
