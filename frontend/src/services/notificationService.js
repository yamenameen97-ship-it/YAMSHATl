import API from '../api/axios.js';
import { getAuthToken } from '../utils/auth.js';
import { useNotificationStore } from '../store/notificationStore.js';

const DEVICE_ID_KEY = 'yamshat_device_id';
const OFFLINE_QUEUE_KEY = 'yamshat_offline_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const OFFLINE_QUEUE_MAX_SIZE = 100;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

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

export const notificationService = {
  async initialize() {
    try {
      if (getAuthToken()) {
        await this.registerDevice();
      }
      await this.processOfflineQueue();
      window.addEventListener('online', () => this.processOfflineQueue());
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
    if (getAuthToken()) {
      await this.registerDevice();
    }
    return permission;
  },

  async registerDevice() {
    if (!getAuthToken()) return null;

    const payload = {
      device_id: getOrCreateDeviceId(),
      platform: getPlatform(),
      user_agent: navigator.userAgent,
      notification_enabled: 'Notification' in window && Notification.permission === 'granted',
      pwa_installed: window.matchMedia?.('(display-mode: standalone)')?.matches || false,
      service_worker_ready: 'serviceWorker' in navigator,
    };

    try {
      await retryWithBackoff(() => API.post('/notifications/register-device', payload));
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

  async fetchNotifications(limit = 50) {
    const store = useNotificationStore.getState();
    store.setLoading(true);
    try {
      const response = await retryWithBackoff(() => API.get('/notifications', { params: { limit }, cache: true, cacheTtlMs: 20_000 }));
      store.hydrateNotifications(response.data || []);
      store.setError('');
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

  // ✅ v83.6 FIX #3: توحيد سلوك "تحديد الكل كمقروء" مع markNotificationsRead(ids)
  // في api/notifications.js. سابقاً هذه الدالة كانت ترسل PUT /notifications/read
  // بلا body، بينما api/notifications.js تم تحديثه في v83.5 FIX #2 ليقبل ids.
  // النتيجة: تناقض داخلي — الاستدعاءات عبر notificationService لا تستفيد من
  // التحسينات، وأي مستدعي جديد يمرّر ids يحصل على over-mark. الآن نقبل ids
  // اختياريّة ونحدّث المتجر بالطريقة المناسبة.
  async markAllNotificationsRead(notificationIds) {
    const store = useNotificationStore.getState();
    const hasIds = Array.isArray(notificationIds) && notificationIds.length > 0;

    if (hasIds) {
      // تحديث المتجر بشكل انتقائي
      notificationIds.forEach((id) => {
        try { store.markRead(id); } catch { /* ignore */ }
      });
    } else {
      store.markAllRead();
    }

    try {
      await retryWithBackoff(() => {
        if (hasIds) {
          const ids = notificationIds.map((id) => String(id)).filter(Boolean);
          return API.put('/notifications/read', { ids }, { params: { ids: ids.join(',') } });
        }
        return API.put('/notifications/read');
      });
    } catch (error) {
      if (!navigator.onLine) {
        addToOfflineQueue('markAllRead', hasIds ? { ids: notificationIds } : {});
      }
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
        const next = loadOfflineQueue().map((queued) => queued.id === item.id ? { ...queued, retries: Number(queued.retries || 0) + 1 } : queued).filter((queued) => Number(queued.retries || 0) < MAX_RETRY_ATTEMPTS);
        saveOfflineQueue(next);
      }
    }
  },

  async processOfflineQueueItem(item) {
    switch (item.action) {
      case 'markRead':
        return this.markNotificationRead(item.payload.notificationId);
      case 'markAllRead':
        // ✅ v83.6 FIX #3: مرّر ids إذا كانت مخزّنة في offline queue
        return this.markAllNotificationsRead(item.payload?.ids);
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
