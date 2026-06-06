/**
 * Notification State Slice
 * 
 * Manages:
 * - System notifications
 * - Unread count
 * - Notification preferences
 */

export default function notificationSlice(set, get) {
  return {
    // State
    notifications: [],
    unreadCount: 0,
    notificationPreferences: {
      enableSound: true,
      enableDesktop: true,
      enableEmail: false,
      muteUntil: null,
    },

    // Notification Actions
    addNotification: (notification) => {
      const id = `notif_${Date.now()}_${Math.random()}`;
      const newNotification = {
        id,
        timestamp: Date.now(),
        read: false,
        ...notification,
      };

      set((state) => ({
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));

      return id;
    },

    removeNotification: (notificationId) => {
      set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        return {
          ...state,
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
        };
      });
    },

    markAsRead: (notificationId) => {
      set((state) => ({
        ...state,
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    },

    markAllAsRead: () => {
      set((state) => ({
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    },

    clearNotifications: () => {
      set((state) => ({
        ...state,
        notifications: [],
        unreadCount: 0,
      }));
    },

    clearReadNotifications: () => {
      set((state) => ({
        ...state,
        notifications: state.notifications.filter(n => !n.read),
      }));
    },

    // Preference Actions
    setNotificationPreferences: (preferences) => {
      set((state) => ({
        ...state,
        notificationPreferences: {
          ...state.notificationPreferences,
          ...preferences,
        },
      }));
    },

    toggleNotificationSound: () => {
      set((state) => ({
        ...state,
        notificationPreferences: {
          ...state.notificationPreferences,
          enableSound: !state.notificationPreferences.enableSound,
        },
      }));
    },

    toggleDesktopNotifications: () => {
      set((state) => ({
        ...state,
        notificationPreferences: {
          ...state.notificationPreferences,
          enableDesktop: !state.notificationPreferences.enableDesktop,
        },
      }));
    },

    muteNotificationsUntil: (duration) => {
      const muteUntil = Date.now() + duration;
      set((state) => ({
        ...state,
        notificationPreferences: {
          ...state.notificationPreferences,
          muteUntil,
        },
      }));
    },

    unmuteNotifications: () => {
      set((state) => ({
        ...state,
        notificationPreferences: {
          ...state.notificationPreferences,
          muteUntil: null,
        },
      }));
    },

    // Utility Selectors
    getUnreadNotifications: () => {
      return get().notifications.filter(n => !n.read);
    },

    getNotificationsByType: (type) => {
      return get().notifications.filter(n => n.type === type);
    },

    getRecentNotifications: (limit = 10) => {
      return get().notifications.slice(0, limit);
    },

    isNotificationsMuted: () => {
      const state = get();
      const muteUntil = state.notificationPreferences.muteUntil;
      return muteUntil && Date.now() < muteUntil;
    },

    shouldShowNotification: (notification) => {
      const state = get();
      const prefs = state.notificationPreferences;

      // Check if muted
      if (state.isNotificationsMuted()) {
        return false;
      }

      // Check notification type preferences
      if (notification.type === 'sound' && !prefs.enableSound) {
        return false;
      }

      if (notification.type === 'desktop' && !prefs.enableDesktop) {
        return false;
      }

      if (notification.type === 'email' && !prefs.enableEmail) {
        return false;
      }

      return true;
    },
  };
}
