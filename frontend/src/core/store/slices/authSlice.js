/**
 * Authentication State Slice
 * 
 * Manages:
 * - User authentication state
 * - Auth tokens
 * - User permissions
 * - Admin status
 */

export default function authSlice(set, get) {
  return {
    // State
    user: null,
    authToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isAdmin: false,
    permissions: [],
    tokenExpiry: null,
    lastAuthCheck: null,

    // Actions
    setUser: (user) => {
      set((state) => ({
        ...state,
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        permissions: user?.permissions || [],
      }));
    },

    setAuthToken: (token, refreshToken, expiryTime) => {
      set((state) => ({
        ...state,
        authToken: token,
        refreshToken,
        tokenExpiry: expiryTime,
        isAuthenticated: !!token,
      }));
    },

    setPermissions: (permissions) => {
      set((state) => ({
        ...state,
        permissions,
      }));
    },

    logout: () => {
      set((state) => ({
        ...state,
        user: null,
        authToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isAdmin: false,
        permissions: [],
        tokenExpiry: null,
      }));
    },

    updateUserProfile: (updates) => {
      set((state) => ({
        ...state,
        user: state.user ? { ...state.user, ...updates } : null,
      }));
    },

    hasPermission: (permission) => {
      const state = get();
      return state.permissions.includes(permission);
    },

    hasAnyPermission: (permissions) => {
      const state = get();
      return permissions.some(p => state.permissions.includes(p));
    },

    hasAllPermissions: (permissions) => {
      const state = get();
      return permissions.every(p => state.permissions.includes(p));
    },

    isTokenExpired: () => {
      const state = get();
      if (!state.tokenExpiry) return false;
      return Date.now() > state.tokenExpiry;
    },

    setLastAuthCheck: (timestamp) => {
      set((state) => ({
        ...state,
        lastAuthCheck: timestamp,
      }));
    },
  };
}
