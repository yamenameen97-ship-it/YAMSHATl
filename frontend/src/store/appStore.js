import { create } from 'zustand';
import sessionManager from '../auth/sessionManager.js';
export { useChatStore, selectUnreadTotal } from '../stores/chatStore.js';

const THEME_KEY = 'yamshat-theme';
const LANGUAGE_KEY = 'yamshat-language';
const TRANSLATION_KEY = 'yamshat-chat-translation';
const QUEUE_KEY = 'yamshat-offline-queue';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem(THEME_KEY) || 'dark';
};

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'ar';
  return window.localStorage.getItem(LANGUAGE_KEY) || 'ar';
};

const getInitialTranslationSetting = () => {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage.getItem(TRANSLATION_KEY);
  if (raw === null) return true;
  return raw === '1';
};

const loadQueuedActions = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistQueuedActions = (actions) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
  } catch {
    // ignore storage failures
  }
};

const sessionFingerprint = (session) => {
  if (!session || typeof session !== 'object') return '';
  return [
    session.id,
    session.user_id,
    session.username,
    session.email,
    session.token,
    session.access_token,
    session.updated_at,
    session.expires_at,
  ].filter(Boolean).join('|');
};

export const useAppStore = create((set, get) => ({
  session: null,
  authHydrated: false,
  authLoading: false,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  isReconnecting: false,
  lastOfflineAt: null,
  activeRequests: 0,
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  chatTranslationEnabled: getInitialTranslationSetting(),
  installPrompt: null,
  uploadProgress: {},
  queuedActions: loadQueuedActions(),
  
  setSession: (session) => set({ session, authHydrated: true }),
  clearSession: () => set({ session: null, authHydrated: true }),
  setAuthHydrated: (authHydrated = true) => set({ authHydrated: Boolean(authHydrated) }),
  setAuthLoading: (authLoading = false) => set({ authLoading: Boolean(authLoading) }),
  
  setOnlineStatus: (isOnline) => {
    const wasOffline = !get().isOnline;
    set({
      isOnline,
      lastOfflineAt: isOnline ? null : new Date().toISOString(),
    });
    
    // Reconnect Auth Recovery
    if (wasOffline && isOnline) {
      get().recoverSession();
    }
  },

  recoverSession: async () => {
    if (get().isReconnecting) return;
    set({ isReconnecting: true });
    try {
      console.log('[AppStore] Connection restored, attempting session recovery...');
      await sessionManager.refreshSession({ reason: 'reconnect' });
    } catch (err) {
      console.warn('[AppStore] Session recovery failed after reconnect.');
    } finally {
      set({ isReconnecting: false });
    }
  },

  syncFromStorage: (userData) => {
    if (sessionFingerprint(userData) !== sessionFingerprint(get().session)) {
      set({ session: userData, authHydrated: true });
    }
  },

  startRequest: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
  finishRequest: () => set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, nextTheme);
    set({ theme: nextTheme });
  },
  setLanguage: (language) => {
    const nextLanguage = language === 'en' ? 'en' : 'ar';
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
      document.documentElement.setAttribute('lang', nextLanguage);
      document.documentElement.setAttribute('dir', nextLanguage === 'ar' ? 'rtl' : 'ltr');
    }
    set({ language: nextLanguage });
  },
  setChatTranslationEnabled: (enabled) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(TRANSLATION_KEY, enabled ? '1' : '0');
    set({ chatTranslationEnabled: Boolean(enabled) });
  },
  setInstallPrompt: (installPrompt) => set({ installPrompt }),
  clearInstallPrompt: () => set({ installPrompt: null }),
  setUploadProgress: (key, value) =>
    set((state) => ({ uploadProgress: { ...state.uploadProgress, [key]: value } })),
  clearUploadProgress: (key) =>
    set((state) => {
      const next = { ...state.uploadProgress };
      delete next[key];
      return { uploadProgress: next };
    }),
  queueAction: (action) =>
    set((state) => {
      const next = [
        ...state.queuedActions,
        {
          id: action?.id || `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: action?.createdAt || new Date().toISOString(),
          attempts: Number(action?.attempts || 0),
          lastAttemptAt: action?.lastAttemptAt || null,
          nextRetryAt: action?.nextRetryAt || null,
          ...action,
        },
      ];
      persistQueuedActions(next);
      return { queuedActions: next };
    }),
  dequeueAction: (actionId) =>
    set((state) => {
      const next = state.queuedActions.filter((item) => item.id !== actionId);
      persistQueuedActions(next);
      return { queuedActions: next };
    }),
  updateQueuedAction: (actionId, patch) =>
    set((state) => {
      const next = state.queuedActions.map((item) => item.id === actionId ? { ...item, ...(patch || {}) } : item);
      persistQueuedActions(next);
      return { queuedActions: next };
    }),
  replaceQueuedActions: (actions) => {
    const safe = Array.isArray(actions) ? actions : [];
    persistQueuedActions(safe);
    set({ queuedActions: safe });
  },
  flushQueue: () => {
    persistQueuedActions([]);
    set({ queuedActions: [] });
  },
}));

// Global Event Listeners for Multi-tab Sync and Connection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useAppStore.getState().setOnlineStatus(true));
  window.addEventListener('offline', () => useAppStore.getState().setOnlineStatus(false));
  
  window.addEventListener('storage', (event) => {
    if (['yamshat_user_session', 'yamshatAuth', 'user'].includes(event.key)) {
      try {
        const userData = event.newValue ? JSON.parse(event.newValue) : null;
        useAppStore.getState().syncFromStorage(userData);
      } catch (e) {
        // ignore malformed data
      }
    }
  });
}
