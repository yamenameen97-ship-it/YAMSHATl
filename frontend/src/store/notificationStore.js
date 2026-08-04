import { create } from 'zustand';
import { normalizeNotification } from '../utils/notificationCenter.js';

const STORAGE_KEY = 'yamshat_notifications';
// ✅ v89.33 (State Management sync fix): كان التأخير 300ms كافياً لجعل جرس Navbar
//    يتأخر عن صفحة الإشعارات بشكل مرئي. خفّضناه إلى 60ms + flushBatch فوري
//    عند فتح الإشعار / markRead — كي يبقى الاشتراكان (Navbar + الصفحة) على نفس
//    مصدر الحقيقة في نفس الـ tick.
const BATCH_DELAY_MS = 60;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_STORED_NOTIFICATIONS = 500;

// ✅ v89.33: ناقل حدث خفيف لإجبار مستهلكي React Query (شارة Topbar) على
//    إبطال الكاش فوراً عند أي تغيير في المتجر الرسمي — يضمن التزامن اللحظي.
function broadcastNotificationsChanged(reason = 'store-update') {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('yamshat:notifications-changed', {
      detail: { reason, at: Date.now() },
    }));
  } catch { /* noop */ }
}

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
    if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
    if (pendingBatch.length === 0) return;

    // نلتقط الدفعة الحالية محلياً لتفادي أي سباق مع upserts متتالية
    const drained = pendingBatch;
    pendingBatch = [];

    set((state) => {
      const allItems = [...state.items, ...drained];
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

    // ✅ v89.33: بثّ حدث تغيير حتى تتزامن الشارة (React Query) مع المتجر
    broadcastNotificationsChanged('batch-flush');
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
    hydrateNotifications: (items = [], options = {}) => {
      // ✅ v89.33: نُفرغ أي دفعة مؤجّلة قبل الاستبدال حتى لا تتسرّب upserts قديمة
      //   بعد hydrate → مصدر واحد للحقيقة في نفس اللحظة.
      if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
      pendingBatch = [];

      set((state) => {
        const replace = options.replace !== false;
        let allItems = [];

        if (!replace) {
          allItems = [...state.items, ...items];
        } else {
          allItems = items;
        }

        const deduplicated = deduplicateNotifications(allItems);
        const sorted = sortNotifications(deduplicated);

        saveToStorage(sorted);

        return {
          items: sorted,
          initialized: true,
          error: '',
          cacheTimestamp: Date.now(),
        };
      });
      broadcastNotificationsChanged('hydrate');
    },

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
     * Flushes any pending batched notifications immediately.
     * ✅ v89.33: يُستدعى قبل قراءة العدّاد في مسارات حساسة زمنياً
     *    (فتح قائمة الإشعارات، markRead) لضمان التزامن اللحظي بين
     *    Navbar وصفحة الإشعارات.
     */
    flushBatch: () => {
      processBatch();
    },

    /**
     * Marks a single notification as read
     */
    markRead: (notificationId, nextValues = {}) => {
      // إفراغ أي دفعة مؤجّلة أولاً حتى لا يُدهس markRead بواسطة upsert لاحق.
      processBatch();
      set((state) => {
        const updated = state.items.map((item) => (
          String(item.id) === String(notificationId)
            ? normalizeNotification({ ...item, ...nextValues, seen: true, is_read: true })
            : item
        ));
        saveToStorage(updated);
        return { items: updated };
      });
      broadcastNotificationsChanged('mark-read');
    },

    /**
     * Marks all notifications as read
     */
    markAllRead: () => {
      processBatch();
      set((state) => {
        const updated = state.items.map((item) =>
          normalizeNotification({ ...item, seen: true, is_read: true })
        );
        saveToStorage(updated);
        });
      broadcastNotificationsChanged('mark-all-read');
    },

    /**
     * Removes a notification
     */
    removeNotification: (notificationId) => {
      processBatch();
      set((state) => {
        const updated = state.items.filter((item) => String(item.id) !== String(notificationId));
        saveToStorage(updated);
        return { items: updated };
      });
      broadcastNotificationsChanged('remove');
    },

    /**
     * Clears all notifications
     */
    clearAll: () => {
      if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
      pendingBatch = [];
      set(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        return { items: [], initialized: true };
      });
      broadcastNotificationsChanged('clear-all');
    },

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
