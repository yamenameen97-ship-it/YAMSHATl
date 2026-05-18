/**
 * Application State Slice
 * 
 * Manages:
 * - Theme and language settings
 * - Network status
 * - Active requests count
 * - Global app settings
 */

export default function appSlice(set, get) {
  return {
    // State
    theme: 'dark',
    language: 'ar',
    isOnline: true,
    activeRequests: 0,
    appVersion: '1.0.0',
    lastSyncTime: null,
    isInitialized: false,
    maintenanceMode: false,

    // Theme Actions
    setTheme: (theme) => {
      set((state) => ({
        ...state,
        theme,
      }));
      // Apply theme to DOM
      if (typeof window !== 'undefined') {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      }
    },

    toggleTheme: () => {
      const state = get();
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      get().setTheme(newTheme);
    },

    // Language Actions
    setLanguage: (language) => {
      set((state) => ({
        ...state,
        language,
      }));
      // Apply language to DOM
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('lang', language);
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
      }
    },

    // Network Status Actions
    setOnline: (isOnline) => {
      set((state) => ({
        ...state,
        isOnline,
      }));
    },

    // Request Tracking Actions
    incrementRequests: () => {
      set((state) => ({
        ...state,
        activeRequests: state.activeRequests + 1,
      }));
    },

    decrementRequests: () => {
      set((state) => ({
        ...state,
        activeRequests: Math.max(0, state.activeRequests - 1),
      }));
    },

    resetRequests: () => {
      set((state) => ({
        ...state,
        activeRequests: 0,
      }));
    },

    // Sync Actions
    setLastSyncTime: (timestamp) => {
      set((state) => ({
        ...state,
        lastSyncTime: timestamp,
      }));
    },

    // Initialization Actions
    setInitialized: (isInitialized) => {
      set((state) => ({
        ...state,
        isInitialized,
      }));
    },

    // Maintenance Mode
    setMaintenanceMode: (maintenanceMode) => {
      set((state) => ({
        ...state,
        maintenanceMode,
      }));
    },

    // Utility Selectors
    isLoading: () => {
      return get().activeRequests > 0;
    },

    getAppStatus: () => {
      const state = get();
      return {
        isOnline: state.isOnline,
        isLoading: state.isLoading(),
        theme: state.theme,
        language: state.language,
        isInitialized: state.isInitialized,
        maintenanceMode: state.maintenanceMode,
      };
    },
  };
}
