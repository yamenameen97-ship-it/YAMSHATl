import API from '../api/axios.js';
import { useAppStore } from '../store/appStore.js';

const DEVICE_STORE_KEY = 'yamshat.trusted.devices';
const SESSION_STORE_KEY = 'yamshat.device.sessions';
const ALERTS_STORE_KEY = 'yamshat.device.alerts';
const SYNC_STORE_KEY = 'yamshat.device.sync';
const CHANNEL_NAME = 'yamshat-multi-device';

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}

export function getCurrentDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server-device';
  const platform = navigator.userAgentData?.platform || navigator.platform || 'unknown';
  const seed = [
    navigator.userAgent,
    platform,
    navigator.language,
    window.screen?.width || 0,
    window.screen?.height || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  ].join('|');
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index);
    hash |= 0;
  }
  return `device_${Math.abs(hash)}`;
}

export function getCurrentDeviceLabel() {
  if (typeof navigator === 'undefined') return 'Unknown device';
  const ua = navigator.userAgent;
  const platform = /android/i.test(ua)
    ? 'Android'
    : /iphone|ipad|ipod/i.test(ua)
      ? 'iPhone / iPad'
      : /mac/i.test(ua)
        ? 'macOS'
        : /win/i.test(ua)
          ? 'Windows'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'Web';
  const browser = /edg/i.test(ua)
    ? 'Edge'
    : /chrome/i.test(ua)
      ? 'Chrome'
      : /firefox/i.test(ua)
        ? 'Firefox'
        : /safari/i.test(ua)
          ? 'Safari'
          : 'Browser';
  return `${browser} • ${platform}`;
}

function fallbackTrustedDevices() {
  const currentId = getCurrentDeviceFingerprint();
  const list = read(DEVICE_STORE_KEY, []);
  if (list.length) return list;
  const initial = [{
    id: currentId,
    label: getCurrentDeviceLabel(),
    trusted: true,
    current: true,
    lastSeenAt: new Date().toISOString(),
    trustedAt: new Date().toISOString(),
    ipLabel: 'Current network',
  }];
  persist(DEVICE_STORE_KEY, initial);
  return initial;
}

function fallbackSessions() {
  const currentId = getCurrentDeviceFingerprint();
  const sessions = read(SESSION_STORE_KEY, []);
  if (sessions.length) return sessions;
  const initial = [{
    id: `session-${currentId}`,
    device_id: currentId,
    device_label: getCurrentDeviceLabel(),
    current: true,
    trusted: true,
    last_active_at: new Date().toISOString(),
    sync_state: 'healthy',
    push_enabled: 'Notification' in window ? Notification.permission === 'granted' : false,
  }];
  persist(SESSION_STORE_KEY, initial);
  return initial;
}

function fallbackAlerts() {
  const alerts = read(ALERTS_STORE_KEY, []);
  if (alerts.length) return alerts;
  const initial = [{
    id: 'alert-current-login',
    severity: 'info',
    title: 'تم التحقق من الجهاز الحالي',
    description: 'تم تمييز هذا الجهاز كجهاز موثوق ويمكنه استلام تنبيهات الدخول والجلسات.',
    created_at: new Date().toISOString(),
  }];
  persist(ALERTS_STORE_KEY, initial);
  return initial;
}

function updateCollection(collection, predicate, updater) {
  return collection.map((item) => predicate(item) ? (typeof updater === 'function' ? updater(item) : { ...item, ...updater }) : item);
}

async function attemptRemote(method, url, config) {
  try {
    const response = await API[method](url, ...(Array.isArray(config) ? config : [config].filter((value) => value !== undefined)));
    return response?.data;
  } catch {
    return null;
  }
}

export const deviceTrustService = {
  async getTrustedDevices() {
    const remote = await attemptRemote('get', '/users/trusted-devices');
    if (Array.isArray(remote?.items || remote)) return remote.items || remote;
    return fallbackTrustedDevices();
  },

  async trustCurrentDevice() {
    const payload = {
      device_id: getCurrentDeviceFingerprint(),
      label: getCurrentDeviceLabel(),
      trusted: true,
    };
    const remote = await attemptRemote('post', '/users/trusted-devices', payload);
    if (remote) return remote;

    const list = fallbackTrustedDevices();
    const currentId = payload.device_id;
    const existing = list.find((item) => item.id === currentId || item.device_id === currentId);
    const next = existing
      ? updateCollection(list, (item) => (item.id === currentId || item.device_id === currentId), { trusted: true, current: true, trustedAt: new Date().toISOString(), lastSeenAt: new Date().toISOString() })
      : [{ ...payload, id: currentId, current: true, trustedAt: new Date().toISOString(), lastSeenAt: new Date().toISOString() }, ...list];
    persist(DEVICE_STORE_KEY, next);
    return next;
  },

  async untrustDevice(deviceId) {
    const remote = await attemptRemote('delete', `/users/trusted-devices/${encodeURIComponent(deviceId)}`);
    if (remote) return remote;
    const next = fallbackTrustedDevices().filter((item) => (item.id || item.device_id) !== deviceId);
    persist(DEVICE_STORE_KEY, next);
    return next;
  },

  async getSessions() {
    const remote = await attemptRemote('get', '/users/sessions');
    const list = Array.isArray(remote?.items || remote) ? (remote.items || remote) : fallbackSessions();
    persist(SESSION_STORE_KEY, list);
    return list;
  },

  async revokeSession(sessionId) {
    const remote = await attemptRemote('delete', `/users/sessions/${encodeURIComponent(sessionId)}`);
    if (remote) return remote;
    const next = fallbackSessions().filter((item) => item.id !== sessionId);
    persist(SESSION_STORE_KEY, next);
    return next;
  },

  async getLoginAlerts() {
    const remote = await attemptRemote('get', '/users/login-alerts');
    if (Array.isArray(remote?.items || remote)) return remote.items || remote;
    return fallbackAlerts();
  },

  async createLoginAlert(alert) {
    const payload = {
      id: `alert-${Date.now()}`,
      severity: alert?.severity || 'warning',
      title: alert?.title || 'تنبيه تسجيل دخول',
      description: alert?.description || 'تم رصد محاولة دخول جديدة وتحتاج لمراجعتك.',
      created_at: new Date().toISOString(),
    };
    await attemptRemote('post', '/users/login-alerts', payload);
    const next = [payload, ...fallbackAlerts()].slice(0, 20);
    persist(ALERTS_STORE_KEY, next);
    return payload;
  },

  getSyncState() {
    const session = useAppStore.getState().session;
    const snapshot = read(SYNC_STORE_KEY, {
      profile_revision: 1,
      notifications_revision: 1,
      inbox_revision: 1,
      last_sync_at: new Date().toISOString(),
      session_id: session?.session_id || session?.id || null,
      strategy: 'broadcast-channel + storage event fallback',
      conflicts: 0,
      devices_online: 1,
    });
    return snapshot;
  },

  updateSyncState(patch = {}) {
    const next = {
      ...this.getSyncState(),
      ...patch,
      last_sync_at: new Date().toISOString(),
    };
    persist(SYNC_STORE_KEY, next);
    this.broadcastSyncState(next);
    return next;
  },

  broadcastSyncState(payload = {}) {
    if (typeof window === 'undefined') return;
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'sync-state', payload });
      channel.close();
    } catch {
      window.localStorage.setItem(`${SYNC_STORE_KEY}.broadcast`, JSON.stringify({ payload, sentAt: Date.now() }));
    }
  },

  subscribe(handler) {
    if (typeof window === 'undefined' || typeof handler !== 'function') return () => {};

    const onStorage = (event) => {
      if (event.key !== `${SYNC_STORE_KEY}.broadcast`) return;
      const payload = safeParse(event.newValue, null);
      if (payload?.payload) handler(payload.payload);
    };
    window.addEventListener('storage', onStorage);

    let channel = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event?.data?.type === 'sync-state') handler(event.data.payload);
      };
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close?.();
    };
  },
};

export default deviceTrustService;
