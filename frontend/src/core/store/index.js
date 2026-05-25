/**
 * Unified State Management with Zustand
 * 
 * This module provides a centralized state management system using Zustand
 * with support for:
 * - Multiple store slices
 * - Middleware for logging and persistence
 * - Devtools integration
 * - Type safety (with TypeScript)
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import authSlice from './slices/authSlice.js';
import appSlice from './slices/appSlice.js';
import chatSlice from './slices/chatSlice.js';
import notificationSlice from './slices/notificationSlice.js';
import uiSlice from './slices/uiSlice.js';

// ============================================
// Store Configuration
// ============================================

const STORE_VERSION = 1;
const STORAGE_KEY = 'yamshat_app_store';

// ============================================
// Create Main Store
// ============================================

/**
 * Main application store combining all slices
 */
export const useAppStore = create(
  devtools(
    persist(
      subscribeWithSelector(
        (set, get) => ({
          // Auth Slice
          ...authSlice(set, get),

          // App Slice
          ...appSlice(set, get),

          // Chat Slice
          ...chatSlice(set, get),

          // Notification Slice
          ...notificationSlice(set, get),

          // UI Slice
          ...uiSlice(set, get),
        })
      ),
      {
        name: STORAGE_KEY,
        version: STORE_VERSION,
        // Only persist specific parts of the store
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          user: state.user,
          authToken: state.authToken,
        }),
        // Custom storage adapter (optional)
        storage: {
          getItem: (name) => {
            try {
              const item = window.localStorage.getItem(name);
              return item ? JSON.parse(item) : null;
            } catch (error) {
              console.error(`Error reading from localStorage: ${name}`, error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              window.localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              console.error(`Error writing to localStorage: ${name}`, error);
            }
          },
          removeItem: (name) => {
            try {
              window.localStorage.removeItem(name);
            } catch (error) {
              console.error(`Error removing from localStorage: ${name}`, error);
            }
          },
        },
      }
    )
  )
);

// ============================================
// Store Selectors
// ============================================

/**
 * Auth Selectors
 */
export const useAuthStore = (selector) =>
  useAppStore((state) => selector({
    user: state.user,
    authToken: state.authToken,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    permissions: state.permissions,
    setUser: state.setUser,
    setAuthToken: state.setAuthToken,
    logout: state.logout,
  }));

/**
 * App Selectors
 */
export const useAppStateStore = (selector) =>
  useAppStore((state) => selector({
    theme: state.theme,
    language: state.language,
    isOnline: state.isOnline,
    activeRequests: state.activeRequests,
    setTheme: state.setTheme,
    setLanguage: state.setLanguage,
    setOnline: state.setOnline,
    incrementRequests: state.incrementRequests,
    decrementRequests: state.decrementRequests,
  }));

/**
 * Chat Selectors
 */
export const useChatStore = (selector) =>
  useAppStore((state) => selector({
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    messages: state.messages,
    isLoadingMessages: state.isLoadingMessages,
    setConversations: state.setConversations,
    setCurrentConversation: state.setCurrentConversation,
    addMessage: state.addMessage,
    updateMessage: state.updateMessage,
    deleteMessage: state.deleteMessage,
    clearMessages: state.clearMessages,
  }));

/**
 * Notification Selectors
 */
export const useNotificationStore = (selector) =>
  useAppStore((state) => selector({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    markAsRead: state.markAsRead,
    clearNotifications: state.clearNotifications,
  }));

/**
 * UI Selectors
 */
export const useUIStore = (selector) =>
  useAppStore((state) => selector({
    isModalOpen: state.isModalOpen,
    isSidebarOpen: state.isSidebarOpen,
    isLoading: state.isLoading,
    error: state.error,
    openModal: state.openModal,
    closeModal: state.closeModal,
    toggleSidebar: state.toggleSidebar,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  }));

// ============================================
// Store Utilities
// ============================================

/**
 * Reset entire store to initial state
 */
export function resetStore() {
  useAppStore.setState((state) => ({
    ...state,
    user: null,
    authToken: null,
    conversations: [],
    currentConversation: null,
    messages: [],
    notifications: [],
    isModalOpen: false,
    isSidebarOpen: true,
    isLoading: false,
    error: null,
  }));
}

/**
 * Clear persisted store data
 */
export function clearPersistedStore() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    resetStore();
  } catch (error) {
    console.error('Error clearing persisted store:', error);
  }
}

/**
 * Subscribe to store changes
 */
export function subscribeToStore(selector, callback) {
  return useAppStore.subscribe(
    (state) => selector(state),
    callback
  );
}

/**
 * Get current store state
 */
export function getStoreState() {
  return useAppStore.getState();
}

/**
 * Update store state
 */
export function updateStoreState(updates) {
  useAppStore.setState(updates);
}

// ============================================
// Store Middleware
// ============================================

/**
 * Logger middleware for debugging
 */
export function enableStoreLogging() {
  useAppStore.subscribe(
    (state) => state,
    (state) => {
      console.log('[Store Update]', state);
    }
  );
}

/**
 * Sync store with external services
 */
export function syncStoreWithServices() {
  // Subscribe to auth changes
  useAppStore.subscribe(
    (state) => state.user,
    (user) => {
      if (user) {
        console.log('[Auth] User logged in:', user.id);
      } else {
        console.log('[Auth] User logged out');
      }
    }
  );

  // Subscribe to online status changes
  useAppStore.subscribe(
    (state) => state.isOnline,
    (isOnline) => {
      console.log('[Network] Status changed:', isOnline ? 'online' : 'offline');
    }
  );
}

export default useAppStore;
