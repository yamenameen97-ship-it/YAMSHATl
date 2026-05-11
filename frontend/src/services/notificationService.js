import API from '../api/axios.js';
import { useNotificationStore } from '../store/notificationStore.js';

const DEVICE_ID_KEY = 'yamshat_device_id';
const OFFLINE_QUEUE_KEY = 'yamshat_offline_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const OFFLINE_QUEUE_MAX_SIZE = 100;

/**
 * Generates or retrieves device ID for push notifications
 */
function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Loads offline queue from storage
 */
function loadOfflineQueue() {
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load offline queue:', error);
    return [];
  }
}

/**
 * Saves offline queue to storage
 */
function saveOfflineQueue(queue) {
  try {
    const limited = queue.slice(0, OFFLINE_QUEUE_MAX_SIZE);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Failed to save offline queue:', error);
  }
}

/**
 * Adds a notification to offline queue
 */
function addToOfflineQueue(action, payload) {
  const queue = loadOfflineQueue();
  queue.push({
    id: `${Date.now()}_${Math.random()}`,
    action,
    payload,
    timestamp: Date.now(),
    retries: 0,
  });
  saveOfflineQueue(queue);
  return queue;
}

/**
 * Removes item from offline queue
 */
function removeFromOfflineQueue(itemId) {
  const queue = loadOfflineQueue();
  const filtered = queue.filter((item) => item.id !== itemId);
  saveOfflineQueue(filtered);
  return filtered;
}

/**
 * Retries a failed request with exponential backoff
 */
async function retryWithBackoff(fn, maxAttempts = MAX_RETRY_ATTEMPTS) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Notification Service - Handles push notifications, device registration, retry logic, and offline queue
 */
export const notificationService = {
  /**
   * Initializes the notification service
   */
  async initialize() {
    try {
      // Register device for push notifications
      await this.registerDevice();

      // Request notification permission if available
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Process offline queue
      await this.processOfflineQueue();

      // Setup online/offline listeners
      window.addEventListener('online', () => this.processOfflineQueue());
      window.addEventListener('offline', () => console.log('App is offline'));

      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  },

  /**
   * Registers device for push notifications
   */
  async registerDevice() {
    try {
      const deviceId = getOrCreateDeviceId();
      const deviceInfo = {
        device_id: deviceId,
        platform: this.getPlatform(),
        user_agent: navigator.userAgent,
        notification_enabled: 'Notification' in window && Notification.permission === 'granted',
      };

      await retryWithBackoff(async () => {
        return await API.post('/notifications/register-device', deviceInfo);
      });

      return deviceId;
    } catch (error) {
      console.error('Failed to register device:', error);
      throw error;
    }
  },

  /**
   * Unregisters device from push notifications
   */
  async unregisterDevice() {
    try {
      const deviceId = getOrCreateDeviceId();
      await retryWithBackoff(async () => {
        return await API.post('/notifications/unregister-device', { device_id: deviceId });
      });
    } catch (error) {
      console.error('Failed to unregister device:', error);
    }
  },

  /**
   * Fetches notifications with retry logic
   */
  async fetchNotifications(limit = 50) {
    const store = useNotificationStore.getState();
    store.setLoading(true);

    try {
      const response = await retryWithBackoff(async () => {
        return await API.get('/notifications', {
          params: { limit },
          cache: true,
          cacheTtlMs: 20_000,
        });
      });

      store.hydrateNotifications(response.data || []);
      store.setError('');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      store.setError('Failed to load notifications');
      
      // Try to restore from storage if fetch fails
      store.restoreFromStorage();
      throw error;
    } finally {
      store.setLoading(false);
    }
  },

  /**
   * Marks notification as read with offline queue support
   */
  async markNotificationRead(notificationId) {
    const store = useNotificationStore.getState();
    
    // Optimistic update
    store.markRead(notificationId);

    try {
      await retryWithBackoff(async () => {
        return await API.post(`/notifications/${encodeURIComponent(notificationId)}/read`);
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      
      // Add to offline queue if online request fails
      if (!navigator.onLine) {
        addToOfflineQueue('markRead', { notificationId });
      }
      throw error;
    }
  },

  /**
   * Marks all notifications as read with offline queue support
   */
  async markAllNotificationsRead() {
    const store = useNotificationStore.getState();
    
    // Optimistic update
    store.markAllRead();

    try {
      await retryWithBackoff(async () => {
        return await API.put('/notifications/read');
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      
      // Add to offline queue if online request fails
      if (!navigator.onLine) {
        addToOfflineQueue('markAllRead', {});
      }
      throw error;
    }
  },

  /**
   * Deletes a notification with offline queue support
   */
  async deleteNotification(notificationId) {
    const store = useNotificationStore.getState();
    
    // Optimistic update
    store.removeNotification(notificationId);

    try {
      await retryWithBackoff(async () => {
        return await API.delete(`/notifications/${encodeURIComponent(notificationId)}`);
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      
      // Add to offline queue if online request fails
      if (!navigator.onLine) {
        addToOfflineQueue('deleteNotification', { notificationId });
      }
      throw error;
    }
  },

  /**
   * Processes offline queue when connection is restored
   */
  async processOfflineQueue() {
    if (!navigator.onLine) return;

    const queue = loadOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline notifications`);

    for (const item of queue) {
      try {
        await this.processOfflineQueueItem(item);
        removeFromOfflineQueue(item.id);
      } catch (error) {
        console.error(`Failed to process offline item ${item.id}:`, error);
        
        // Increment retry count
        const queue = loadOfflineQueue();
        const updated = queue.map((q) =>
          q.id === item.id ? { ...q, retries: (q.retries || 0) + 1 } : q
        );
        
        // Remove if max retries exceeded
        const filtered = updated.filter((q) => q.retries < MAX_RETRY_ATTEMPTS);
        saveOfflineQueue(filtered);
      }
    }
  },

  /**
   * Processes a single offline queue item
   */
  async processOfflineQueueItem(item) {
    switch (item.action) {
      case 'markRead':
        return await this.markNotificationRead(item.payload.notificationId);
      case 'markAllRead':
        return await this.markAllNotificationsRead();
      case 'deleteNotification':
        return await this.deleteNotification(item.payload.notificationId);
      default:
        console.warn(`Unknown offline action: ${item.action}`);
    }
  },

  /**
   * Sends a push notification (for testing/admin purposes)
   */
  async sendPushNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        ...options,
      });
    }
  },

  /**
   * Subscribes to push notifications (Service Worker)
   */
  async subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Send subscription to server
      await API.post('/notifications/subscribe-push', {
        subscription: subscription.toJSON(),
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  },

  /**
   * Converts VAPID public key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  /**
   * Gets platform information
   */
  getPlatform() {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'windows';
    if (ua.includes('Mac')) return 'macos';
    if (ua.includes('Linux')) return 'linux';
    if (ua.includes('Android')) return 'android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'ios';
    return 'unknown';
  },

  /**
   * Gets offline queue status
   */
  getOfflineQueueStatus() {
    const queue = loadOfflineQueue();
    return {
      size: queue.length,
      items: queue,
      isOnline: navigator.onLine,
    };
  },

  /**
   * Clears offline queue
   */
  clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
};

export default notificationService;
