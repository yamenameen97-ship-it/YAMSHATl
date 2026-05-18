import { create } from 'zustand';
import { normalizeNotification } from '../utils/notificationCenter.js';

const STORAGE_KEY = 'yamshat_notifications';
const BATCH_DELAY_MS = 300;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_STORED_NOTIFICATIONS = 500;

/**
 * Sorts notifications by creation date (newest first)
 */
function sortNotifications(items = []) {
  return [...items].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
}

/**
 * Loads notifications from localStorage with TTL validation
 */
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const { items, timestamp } = JSON.parse(stored);
    const age = Date.now() - timestamp;

    // Check if cache is still valid
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return items || [];
  } catch (error) {
    console.warn('Failed to load notifications from storage:', error);
    return null;
  }
}

/**
 * Saves notifications to localStorage with timestamp
 */
function saveToStorage(items) {
  try {
    const limited = items.slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: limited,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to save notifications to storage:', error);
  }
}

/**
 * Deduplicates notifications in real-time using Map
 */
function deduplicateNotifications(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const normalized = normalizeNotification(item);
    const key = String(normalized.id);
    const existing = map.get(key);
    
    // Keep the most recent version with merged data
    if (existing) {
      map.set(key, {
        ...existing,
        ...normalized,
        // Preserve seen status if already marked as seen
        seen: existing.seen || normalized.seen,
        is_read: existing.is_read || normalized.is_read,
      });
    } else {
      map.set(key, normalized);
    }
  });
  return [...map.values()];
}

export const useNotificationStore = create((set, get) => {
  let batchTimer = null;
  let pendingBatch = [];

  /**
   * Processes batched notifications
   */
  const processBatch = () => {
    if (pendingBatch.length === 0) return;

    set((state) => {
      const allItems = [...state.items, ...pendingBatch];
      const deduplicated = deduplicateNotifications(allItems);
      const sorted = sortNotifications(deduplicated);
      
      // Save to storage for persistence
      saveToStorage(sorted);

      return {
        items: sorted,
        initialized: true,
        error: '',
      };
    });

    pendingBatch = [];
  };

  /**
   * Schedules a batch update with debouncing
   */
  const scheduleBatch = () => {
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(processBatch, BATCH_DELAY_MS);
  };

  return {
    initialized: false,
    loading: false,
    error: '',
    items: [],
    cacheTimestamp: null,

    /**
     * Sets loading state
     */
    setLoading: (loading) => set({ loading: Boolean(loading) }),

    /**
     * Sets error state
     */
    setError: (error = '') => set({ error }),

    /**
     * Hydrates notifications from API with deduplication and persistence
     */
    hydrateNotifications: (items = [], options = {}) => set((state) => {
      const replace = options.replace !== false;
      let allItems = [];

      if (!replace) {
        // Merge with existing items
        allItems = [...state.items, ...items];
      } else {
        // Replace all items
        allItems = items;
      }

      const deduplicated = deduplicateNotifications(allItems);
      const sorted = sortNotifications(deduplicated);

      // Save to storage for persistence
      saveToStorage(sorted);

      return {
        items: sorted,
        initialized: true,
        error: '',
        cacheTimestamp: Date.now(),
      };
    }),

    /**
     * Adds a single notification with batching
     */
    upsertNotification: (item) => {
      pendingBatch.push(item);
      scheduleBatch();
    },

    /**
     * Adds multiple notifications with batching
     */
    upsertNotifications: (items = []) => {
      pendingBatch.push(...items);
      scheduleBatch();
    },

    /**
     * Marks a single notification as read
     */
    markRead: (notificationId, nextValues = {}) => set((state) => {
      const updated = state.items.map((item) => (
        String(item.id) === String(notificationId)
          ? normalizeNotification({ ...item, ...nextValues, seen: true, is_read: true })
          : item
      ));
      saveToStorage(updated);
      return { items: updated };
    }),

    /**
     * Marks all notifications as read
     */
    markAllRead: () => set((state) => {
      const updated = state.items.map((item) => 
        normalizeNotification({ ...item, seen: true, is_read: true })
      );
      saveToStorage(updated);
      return { items: updated };
    }),

    /**
     * Removes a notification
     */
    removeNotification: (notificationId) => set((state) => {
      const updated = state.items.filter((item) => String(item.id) !== String(notificationId));
      saveToStorage(updated);
      return { items: updated };
    }),

    /**
     * Clears all notifications
     */
    clearAll: () => set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { items: [], initialized: true };
    }),

    /**
     * Restores notifications from storage
     */
    restoreFromStorage: () => set(() => {
      const stored = loadFromStorage();
      return {
        items: stored || [],
        initialized: true,
        cacheTimestamp: Date.now(),
      };
    }),

    /**
     * Gets cache validity status
     */
    isCacheValid: () => {
      const state = get();
      if (!state.cacheTimestamp) return false;
      return Date.now() - state.cacheTimestamp < CACHE_TTL_MS;
    },

    /**
     * Invalidates cache
     */
    invalidateCache: () => set({ cacheTimestamp: null }),
  };
});

/**
 * Selector for unread notifications count
 */
export function selectUnreadNotificationsCount(state) {
  return (state.items || []).filter((item) => !item?.seen).length;
}

/**
 * Selector for unread notifications
 */
export function selectUnreadNotifications(state) {
  return (state.items || []).filter((item) => !item?.seen);
}

/**
 * Selector for notifications by type
 */
export function selectNotificationsByType(type) {
  return (state) => (state.items || []).filter((item) => item?.type === type);
}

/**
 * Selector for recent notifications
 */
export function selectRecentNotifications(limit = 10) {
  return (state) => (state.items || []).slice(0, limit);
}
