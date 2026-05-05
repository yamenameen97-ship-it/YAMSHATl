import { create } from 'zustand';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem('yamshat-theme') || 'dark';
};

export const useAppStore = create((set, get) => ({
  session: null,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastOfflineAt: null,
  activeRequests: 0,
  theme: getInitialTheme(),
  installPrompt: null,
  uploadProgress: {},
  queuedActions: [],
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
    if (typeof window !== 'undefined') window.localStorage.setItem('yamshat-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') window.localStorage.setItem('yamshat-theme', nextTheme);
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
  queueAction: (action) => set((state) => ({ queuedActions: [...state.queuedActions, action] })),
  flushQueue: () => set({ queuedActions: [] }),
}));
