import { create } from 'zustand';
import { normalizeNotification } from '../utils/notificationCenter.js';

function sortNotifications(items = []) {
  return [...items].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
}

export const useNotificationStore = create((set) => ({
  initialized: false,
  loading: false,
  error: '',
  items: [],
  setLoading: (loading) => set({ loading: Boolean(loading) }),
  setError: (error = '') => set({ error }),
  hydrateNotifications: (items = [], options = {}) => set((state) => {
    const replace = options.replace !== false;
    const map = new Map();
    if (!replace) {
      state.items.forEach((item) => {
        const normalized = normalizeNotification(item);
        map.set(String(normalized.id), normalized);
      });
    }
    (Array.isArray(items) ? items : []).forEach((item) => {
      const normalized = normalizeNotification(item);
      map.set(String(normalized.id), { ...(map.get(String(normalized.id)) || {}), ...normalized });
    });
    return {
      items: sortNotifications([...map.values()]),
      initialized: true,
      error: '',
    };
  }),
  upsertNotification: (item) => set((state) => {
    const normalized = normalizeNotification(item);
    const map = new Map(state.items.map((entry) => [String(entry.id), entry]));
    map.set(String(normalized.id), { ...(map.get(String(normalized.id)) || {}), ...normalized });
    return { items: sortNotifications([...map.values()]), initialized: true };
  }),
  markAllRead: () => set((state) => ({
    items: state.items.map((item) => ({ ...item, seen: true, is_read: true })),
  })),
}));

export function selectUnreadNotificationsCount(state) {
  return (state.items || []).filter((item) => !item?.seen).length;
}
