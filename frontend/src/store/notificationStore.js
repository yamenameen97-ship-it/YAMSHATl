import { create } from 'zustand';
import { normalizeNotification } from '../utils/notificationCenter.js';

const STORAGE_KEY = 'yamshat_notifications';
const BATCH_DELAY_MS = 300;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_STORED_NOTIFICATIONS = 1000;

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



function buildMeta(items = []) {
  const unread = items.filter((item) => !item?.seen && !item?.archived).length;
  const grouped = items.reduce((acc, item) => {
    const type = item?.type || 'general';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return { unread, grouped };
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
    filters: { type: 'all', unreadOnly: false, archived: false },
    meta: { unread: 0, grouped: {} },

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
        meta: buildMeta(sorted),
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
      return { items: updated, meta: buildMeta(updated) };
    }),

    /**
     * Marks all notifications as read
     */
    markAllRead: () => set((state) => {
      const updated = state.items.map((item) => 
        normalizeNotification({ ...item, seen: true, is_read: true })
      );
      saveToStorage(updated);
      return { items: updated, meta: buildMeta(updated) };
    }),

    /**
     * Removes a notification
     */
    removeNotification: (notificationId) => set((state) => {
      const updated = state.items.filter((item) => String(item.id) !== String(notificationId));
      saveToStorage(updated);
      return { items: updated, meta: buildMeta(updated) };
    }),

    /**
     * Clears all notifications
     */
    clearAll: () => set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { items: [], initialized: true, meta: buildMeta([]) };
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
        meta: buildMeta(sorted),
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

    archiveNotification: (notificationId) => set((state) => {
      const updated = state.items.map((item) => String(item.id) === String(notificationId)
        ? { ...item, archived: true }
        : item);
      saveToStorage(updated);
      return { items: updated, meta: buildMeta(updated) };
    }),

    restoreNotification: (notificationId) => set((state) => {
      const updated = state.items.map((item) => String(item.id) === String(notificationId)
        ? { ...item, archived: false }
        : item);
      saveToStorage(updated);
      return { items: updated, meta: buildMeta(updated) };
    }),

    setFilters: (filters = {}) => set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

    getFilteredNotifications: () => {
      const state = get();
      return state.items.filter((item) => {
        if (state.filters.unreadOnly && item?.seen) return false;
        if (state.filters.archived !== Boolean(item?.archived)) return false;
        if (state.filters.type !== 'all' && item?.type !== state.filters.type) return false;
        return true;
      });
    },

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
