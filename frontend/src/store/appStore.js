import { create } from 'zustand';

export const useAppStore = create((set) => ({
  session: null,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastOfflineAt: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
  setOnlineStatus: (isOnline) =>
    set({
      isOnline,
      lastOfflineAt: isOnline ? null : new Date().toISOString(),
    }),
}));
