import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore as useCanonicalChatStore } from '../../stores/chatStore.js';

/**
 * Compatibility bridge:
 * يمنع وجود State management مزدوج داخل المشروع.
 * أي import قديم من core/store سيستخدم الآن الـ stores الرسمية فقط.
 */

export { useAppStore, selectUnreadTotal };

export const useAuthStore = (selector = (state) => state) =>
  useAppStore((state) => selector({
    session: state.session,
    authHydrated: state.authHydrated,
    authLoading: state.authLoading,
    setSession: state.setSession,
    clearSession: state.clearSession,
    setAuthHydrated: state.setAuthHydrated,
    setAuthLoading: state.setAuthLoading,
  }));

export const useAppStateStore = (selector = (state) => state) =>
  useAppStore((state) => selector({
    theme: state.theme,
    language: state.language,
    isOnline: state.isOnline,
    isReconnecting: state.isReconnecting,
    lastOfflineAt: state.lastOfflineAt,
    activeRequests: state.activeRequests,
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    setLanguage: state.setLanguage,
    setOnlineStatus: state.setOnlineStatus,
    startRequest: state.startRequest,
    finishRequest: state.finishRequest,
  }));

export const useChatStore = (selector = (state) => state) =>
  useCanonicalChatStore((state) => selector(state));

export const useNotificationStore = (selector = (state) => state) =>
  useAppStore((state) => selector(state));

export const useUIStore = (selector = (state) => state) =>
  useAppStore((state) => selector({
    theme: state.theme,
    language: state.language,
    installPrompt: state.installPrompt,
    uploadProgress: state.uploadProgress,
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    setLanguage: state.setLanguage,
    setInstallPrompt: state.setInstallPrompt,
    clearInstallPrompt: state.clearInstallPrompt,
    setUploadProgress: state.setUploadProgress,
    clearUploadProgress: state.clearUploadProgress,
  }));

export function resetStore() {
  useCanonicalChatStore.getState().invalidateCache?.();
  useAppStore.setState({
    session: null,
    authHydrated: true,
    authLoading: false,
    activeRequests: 0,
    uploadProgress: {},
    queuedActions: [],
  });
}

export function clearPersistedStore() {
  try {
    window.localStorage.removeItem('yamshat_app_store');
    resetStore();
  } catch {
    resetStore();
  }
}

export function subscribeToStore(selector, callback) {
  return useAppStore.subscribe((state) => selector(state), callback);
}

export function getStoreState() {
  return {
    app: useAppStore.getState(),
    chat: useCanonicalChatStore.getState(),
  };
}

export function updateStoreState(updates = {}) {
  if (updates?.app) useAppStore.setState(updates.app);
  if (updates?.chat) useCanonicalChatStore.setState(updates.chat);
}
