import { create } from 'zustand';

const THEME_KEY = 'yamshat-theme';
const QUEUE_KEY = 'yamshat-offline-queue';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem(THEME_KEY) || 'dark';
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

export const useAppStore = create((set, get) => ({
  session: null,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastOfflineAt: null,
  activeRequests: 0,
  theme: getInitialTheme(),
  installPrompt: null,
  uploadProgress: {},
  queuedActions: loadQueuedActions(),
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
  setOnlineStatus: (isOnline) =>
    set({
      isOnline,
      lastOfflineAt: isOnline ? null : new Date().toISOString(),
    }),
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
