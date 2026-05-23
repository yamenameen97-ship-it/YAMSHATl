import { create } from 'zustand';
import { normalizeNotification } from '../utils/notificationCenter.js';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCES_KEY,
} from '../pages/notifications/notificationUtils.js';

const STORAGE_KEY = 'yamshat_notifications';
const BATCH_DELAY_MS = 300;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_STORED_NOTIFICATIONS = 500;

function sortNotifications(items = []) {
  return [...items].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const { items, timestamp } = JSON.parse(stored);
    const age = Date.now() - timestamp;
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

function loadPreferencesFromStorage() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(JSON.parse(raw) || {}),
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

function savePreferencesToStorage(preferences = {}) {
  try {
    localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // ignore storage failures
  }
}

function deduplicateNotifications(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const normalized = normalizeNotification(item);
    const key = String(normalized.id);
    const existing = map.get(key);

    if (existing) {
      map.set(key, {
        ...existing,
        ...normalized,
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

  const processBatch = () => {
    if (pendingBatch.length === 0) return;

    set((state) => {
      const allItems = [...state.items, ...pendingBatch];
      const deduplicated = deduplicateNotifications(allItems);
      const sorted = sortNotifications(deduplicated);
      saveToStorage(sorted);

      return {
        items: sorted,
        initialized: true,
        error: '',
      };
    });

    pendingBatch = [];
  };

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
    preferences: loadPreferencesFromStorage(),
    status: {
      socketConnected: false,
      isSyncing: false,
      lastSyncAt: null,
      lastBatchAt: null,
      lastSource: 'startup',
      unreadServerCount: 0,
      lastServerCount: 0,
      pushPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      pushSubscribed: false,
      backgroundSyncRegistered: false,
      pendingBatchSize: 0,
      syncError: '',
      lastSocketEventAt: null,
    },

    setLoading: (loading) => set({ loading: Boolean(loading) }),
    setError: (error = '') => set({ error }),

    hydrateNotifications: (items = [], options = {}) => set((state) => {
      const replace = options.replace !== false;
      const allItems = replace ? items : [...state.items, ...items];
      const deduplicated = deduplicateNotifications(allItems);
      const sorted = sortNotifications(deduplicated);
      saveToStorage(sorted);

      return {
        items: sorted,
        initialized: true,
        error: '',
        cacheTimestamp: Date.now(),
      };
    }),

    upsertNotification: (item) => {
      pendingBatch.push(item);
      scheduleBatch();
    },

    upsertNotifications: (items = []) => {
      pendingBatch.push(...items);
      scheduleBatch();
    },

    markRead: (notificationId, nextValues = {}) => set((state) => {
      const updated = state.items.map((item) => (
        String(item.id) === String(notificationId)
          ? normalizeNotification({ ...item, ...nextValues, seen: true, is_read: true })
          : item
      ));
      saveToStorage(updated);
      return { items: updated };
    }),

    markAllRead: () => set((state) => {
      const updated = state.items.map((item) => normalizeNotification({ ...item, seen: true, is_read: true }));
      saveToStorage(updated);
      return { items: updated };
    }),

    removeNotification: (notificationId) => set((state) => {
      const updated = state.items.filter((item) => String(item.id) !== String(notificationId));
      saveToStorage(updated);
      return { items: updated };
    }),

    clearAll: () => set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { items: [], initialized: true };
    }),

    restoreFromStorage: () => set(() => {
      const stored = loadFromStorage();
      return {
        items: stored || [],
        initialized: true,
        cacheTimestamp: Date.now(),
      };
    }),

    setPreferences: (patch = {}) => set((state) => {
      const nextPreferences = {
        ...state.preferences,
        ...(patch || {}),
      };
      savePreferencesToStorage(nextPreferences);
      return { preferences: nextPreferences };
    }),

    replacePreferences: (preferences = {}) => set(() => {
      const nextPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(preferences || {}),
      };
      savePreferencesToStorage(nextPreferences);
      return { preferences: nextPreferences };
    }),

    setStatus: (patch = {}) => set((state) => ({
      status: {
        ...state.status,
        ...(patch || {}),
      },
    })),

    isCacheValid: () => {
      const state = get();
      if (!state.cacheTimestamp) return false;
      return Date.now() - state.cacheTimestamp < CACHE_TTL_MS;
    },

    invalidateCache: () => set({ cacheTimestamp: null }),
  };
});

export function selectUnreadNotificationsCount(state) {
  return (state.items || []).filter((item) => !normalizeNotification(item).seen).length;
}

export function selectUnreadNotifications(state) {
  return (state.items || []).filter((item) => !normalizeNotification(item).seen);
}

export function selectNotificationPreferences(state) {
  return state.preferences || DEFAULT_NOTIFICATION_PREFERENCES;
}

export function selectNotificationStatus(state) {
  return state.status || {};
}
