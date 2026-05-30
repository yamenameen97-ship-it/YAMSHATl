import API from '../api/axios.js';
import { getAuthToken } from '../utils/auth.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { maybeShowBrowserNotification, normalizeNotification } from '../utils/notificationCenter.js';

const DEVICE_ID_KEY = 'yamshat_device_id';
const OFFLINE_QUEUE_KEY = 'yamshat_offline_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const OFFLINE_QUEUE_MAX_SIZE = 100;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const DEVICE_REGISTRATION_COOLDOWN_MS = 30_000;
const NOTIFICATION_SYNC_COOLDOWN_MS = 5_000;
const REALTIME_EVENT_NAMES = [
  'notification',
  'new_notification',
  'notification:new',
  'notification_created',
  'push_notification',
  'chat_notification',
  'chat_message',
  'message_received',
  'message:received',
  'inbox:new_message',
];

let lifecycleBound = false;
let realtimeBound = false;
let realtimeDisposers = [];
let lastDeviceRegistrationAt = 0;
let lastNotificationSyncAt = 0;

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function loadOfflineQueue() {
  return safeJsonParse(localStorage.getItem(OFFLINE_QUEUE_KEY), []);
}

function saveOfflineQueue(queue) {
  const limited = Array.isArray(queue) ? queue.slice(0, OFFLINE_QUEUE_MAX_SIZE) : [];
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(limited));
}

function addToOfflineQueue(action, payload) {
  const queue = loadOfflineQueue();
  queue.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    payload,
    timestamp: Date.now(),
    retries: 0,
  });
  saveOfflineQueue(queue);
  return queue;
}

function removeFromOfflineQueue(itemId) {
  const filtered = loadOfflineQueue().filter((item) => item.id !== itemId);
  saveOfflineQueue(filtered);
  return filtered;
}

async function retryWithBackoff(fn, maxAttempts = MAX_RETRY_ATTEMPTS) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (2 ** attempt)));
      }
    }
  }
  throw lastError;
}

function getPlatform() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/windows/i.test(ua)) return 'windows';
  if (/mac/i.test(ua)) return 'macos';
  if (/linux/i.test(ua)) return 'linux';
  return 'web';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function normalizeRealtimeNotification(payload = {}, eventName = '') {
  const raw = payload?.notification || payload?.data?.notification || payload?.data || payload || {};
  const typeHint = String(raw?.type || raw?.screen || eventName || '').toLowerCase();
  const username = raw?.username || raw?.sender_username || raw?.from_username || raw?.peer || raw?.chat_with || raw?.target_username || '';
  const isChatLike = typeHint.includes('chat') || typeHint.includes('message') || Boolean(raw?.message || raw?.text || raw?.body) && Boolean(username);

  const title = raw?.title
    || raw?.sender_name
    || raw?.display_name
    || (isChatLike ? `رسالة جديدة${username ? ` من ${username}` : ''}` : 'إشعار جديد');

  const body = raw?.body
    || raw?.message
    || raw?.text
    || raw?.content
    || (isChatLike ? 'وصلكت رسالة جديدة داخل يمشات.' : 'وصلك تحديث جديد داخل يمشات.');

  const path = raw?.path
    || raw?.url
    || (isChatLike && username ? `/chat/${encodeURIComponent(username)}` : raw?.screen === 'live' ? '/live' : '/notifications');

  return normalizeNotification({
    ...raw,
    id: raw?.id || raw?.notification_id || raw?.message_id || `${eventName || 'notification'}-${Date.now()}`,
    type: raw?.type || (isChatLike ? 'message' : 'system'),
    title,
    body,
    message: body,
    text: body,
    created_at: raw?.created_at || raw?.timestamp || new Date().toISOString(),
    data: {
      ...(raw?.data || {}),
      path,
      screen: raw?.screen || (isChatLike ? 'chat' : 'notifications'),
      username,
    },
    path,
  });
}

export const notificationService = {
  bindLifecycleListeners() {
    if (lifecycleBound || typeof window === 'undefined') return;
    lifecycleBound = true;

    window.addEventListener('online', () => {
      this.processOfflineQueue();
      this.syncRemoteNotifications({ force: true, limit: 30 }).catch(() => null);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && getAuthToken()) {
        this.syncRemoteNotifications({ force: true, limit: 20 }).catch(() => null);
      }
    });
  },

  bindRealtime(socketManager) {
    if (realtimeBound || !socketManager?.on) return false;
    realtimeBound = true;

    const bind = (eventName, handler) => {
      const dispose = socketManager.on(eventName, handler);
      if (typeof dispose === 'function') realtimeDisposers.push(dispose);
    };

    bind('connect', async () => {
      if (!getAuthToken()) return;
      await this.registerDevice({ force: true }).catch(() => null);
      await this.subscribeGrantedPushIfPossible().catch(() => null);
      await this.syncRemoteNotifications({ force: true, limit: 20 }).catch(() => null);
    });

    REALTIME_EVENT_NAMES.forEach((eventName) => {
      bind(eventName, async (payload) => {
        const normalized = normalizeRealtimeNotification(payload, eventName);
        useNotificationStore.getState().upsertNotification(normalized);
        await maybeShowBrowserNotification(normalized).catch(() => null);
      });
    });

    return true;
  },

  unbindRealtime() {
    realtimeDisposers.forEach((dispose) => dispose?.());
    realtimeDisposers = [];
    realtimeBound = false;
  },

  async initialize({ socketManager } = {}) {
    try {
      this.bindLifecycleListeners();
      if (socketManager) this.bindRealtime(socketManager);

      if (getAuthToken()) {
        await this.registerDevice().catch(() => null);
        await this.subscribeGrantedPushIfPossible().catch(() => null);
        await this.syncRemoteNotifications({ force: true, limit: 20 }).catch(() => null);
      }

      await this.processOfflineQueue();
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  },

  getCapabilities() {
    const platform = getPlatform();
    return {
      platform,
      supportsBrowserNotifications: 'Notification' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsPushManager: 'PushManager' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window,
      supportsForeground: true,
      supportsBackground: 'serviceWorker' in navigator,
      androidReady: platform === 'android' && 'serviceWorker' in navigator,
      pwaReady: window.matchMedia?.('(display-mode: standalone)')?.matches || false,
      permission: 'Notification' in window ? Notification.permission : 'unsupported',
    };
  },

  getPushReadiness() {
    const capabilities = this.getCapabilities();
    return {
      ...capabilities,
      subscribed: Boolean(localStorage.getItem('yamshat_push_subscription')),
      deviceId: getOrCreateDeviceId(),
      queueSize: loadOfflineQueue().length,
    };
  },

  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      if (getAuthToken()) {
        await this.registerDevice({ force: true }).catch(() => null);
      }
      await this.subscribeGrantedPushIfPossible().catch(() => null);
    }
    return permission;
  },

  async subscribeGrantedPushIfPossible() {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;
    if (Notification.permission !== 'granted') return null;
    try {
      return await this.subscribeToPushNotifications();
    } catch {
      return null;
    }
  },

  async registerDevice(options = {}) {
    if (!getAuthToken()) return null;

    const now = Date.now();
    if (!options.force && now - lastDeviceRegistrationAt < DEVICE_REGISTRATION_COOLDOWN_MS) {
      return getOrCreateDeviceId();
    }

    const storedSubscription = safeJsonParse(localStorage.getItem('yamshat_push_subscription'), null);
    const payload = {
      device_id: getOrCreateDeviceId(),
      platform: getPlatform(),
      user_agent: navigator.userAgent,
      notification_enabled: 'Notification' in window && Notification.permission === 'granted',
      pwa_installed: window.matchMedia?.('(display-mode: standalone)')?.matches || false,
      service_worker_ready: 'serviceWorker' in navigator,
      push_subscription_endpoint: storedSubscription?.endpoint || '',
    };

    try {
      await retryWithBackoff(() => API.post('/notifications/register-device', payload));
      lastDeviceRegistrationAt = now;
    } catch {
      localStorage.setItem('yamshat_device_registration', JSON.stringify({ ...payload, fallback: true, registered_at: new Date().toISOString() }));
    }
    return payload.device_id;
  },

  async unregisterDevice() {
    try {
      await retryWithBackoff(() => API.post('/notifications/unregister-device', { device_id: getOrCreateDeviceId() }));
    } catch (error) {
      console.error('Failed to unregister device:', error);
    }
  },

  async subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      localStorage.setItem('yamshat_push_subscription', JSON.stringify(existing.toJSON()));
      return existing;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') throw new Error('لم يتم منح إذن الإشعارات.');

    const subscribeOptions = {
      userVisibleOnly: true,
    };
    if (VAPID_PUBLIC_KEY) subscribeOptions.applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    localStorage.setItem('yamshat_push_subscription', JSON.stringify(subscription.toJSON()));

    try {
      await API.post('/notifications/subscribe-push', {
        device_id: getOrCreateDeviceId(),
        subscription: subscription.toJSON(),
      });
    } catch {
      // keep local subscription for graceful fallback
    }

    await this.registerDevice({ force: true }).catch(() => null);
    return subscription;
  },

  async unsubscribePushNotifications() {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;
    await subscription.unsubscribe();
    localStorage.removeItem('yamshat_push_subscription');
    try {
      await API.post('/notifications/unsubscribe-push', { device_id: getOrCreateDeviceId() });
    } catch {
      // ignore network failures
    }
    return true;
  },

  async syncRemoteNotifications({ force = false, limit = 30 } = {}) {
    if (!getAuthToken()) return [];
    const now = Date.now();
    if (!force && now - lastNotificationSyncAt < NOTIFICATION_SYNC_COOLDOWN_MS) {
      return useNotificationStore.getState().items || [];
    }
    lastNotificationSyncAt = now;
    try {
      return await this.fetchNotifications(limit);
    } catch {
      return useNotificationStore.getState().items || [];
    }
  },

  async fetchNotifications(limit = 50) {
    const store = useNotificationStore.getState();
    store.setLoading(true);
    try {
      const response = await retryWithBackoff(() => API.get('/notifications', { params: { limit }, cache: true, cacheTtlMs: 20_000 }));
      store.hydrateNotifications(response.data || []);
      store.setError('');
      lastNotificationSyncAt = Date.now();
      return response.data;
    } catch (error) {
      store.setError('Failed to load notifications');
      store.restoreFromStorage();
      throw error;
    } finally {
      store.setLoading(false);
    }
  },

  async markNotificationRead(notificationId) {
    const store = useNotificationStore.getState();
    store.markRead(notificationId);
    try {
      await retryWithBackoff(() => API.post(`/notifications/${encodeURIComponent(notificationId)}/read`));
    } catch (error) {
      if (!navigator.onLine) addToOfflineQueue('markRead', { notificationId });
      throw error;
    }
  },

  async markAllNotificationsRead() {
    const store = useNotificationStore.getState();
    store.markAllRead();
    try {
      await retryWithBackoff(() => API.put('/notifications/read'));
    } catch (error) {
      if (!navigator.onLine) addToOfflineQueue('markAllRead', {});
      throw error;
    }
  },

  async deleteNotification(notificationId) {
    const store = useNotificationStore.getState();
    store.removeNotification(notificationId);
    try {
      await retryWithBackoff(() => API.delete(`/notifications/${encodeURIComponent(notificationId)}`));
    } catch (error) {
      if (!navigator.onLine) addToOfflineQueue('deleteNotification', { notificationId });
      throw error;
    }
  },

  async processOfflineQueue() {
    if (!navigator.onLine) return;
    const queue = loadOfflineQueue();
    for (const item of queue) {
      try {
        await this.processOfflineQueueItem(item);
        removeFromOfflineQueue(item.id);
      } catch {
        const next = loadOfflineQueue()
          .map((queued) => queued.id === item.id ? { ...queued, retries: Number(queued.retries || 0) + 1 } : queued)
          .filter((queued) => Number(queued.retries || 0) < MAX_RETRY_ATTEMPTS);
        saveOfflineQueue(next);
      }
    }
  },

  async processOfflineQueueItem(item) {
    switch (item.action) {
      case 'markRead':
        return this.markNotificationRead(item.payload.notificationId);
      case 'markAllRead':
        return this.markAllNotificationsRead();
      case 'deleteNotification':
        return this.deleteNotification(item.payload.notificationId);
      default:
        return null;
    }
  },

  async sendPushNotification(title, options = {}) {
    const readiness = this.getPushReadiness();
    if (readiness.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, {
          icon: '/icons/icon-512.png',
          badge: '/icons/badge-96.png',
          tag: options.tag || 'yamshat-local-push',
          data: { url: options.url || '/' },
          ...options,
        });
      }
      return new Notification(title, {
        icon: '/icons/icon-512.png',
        badge: '/icons/badge-96.png',
        ...options,
      });
    }
    return null;
  },

  getOfflineQueueStatus() {
    return {
      size: loadOfflineQueue().length,
      items: loadOfflineQueue(),
      isOnline: navigator.onLine,
    };
  },

  clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
};

export default notificationService;
