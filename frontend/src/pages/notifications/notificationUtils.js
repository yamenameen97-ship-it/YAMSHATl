import { normalizeNotification } from '../../utils/notificationCenter.js';

export const NOTIFICATION_PREFERENCES_KEY = 'yamshat_notification_preferences';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  realtimeEnabled: true,
  pushEnabled: false,
  groupedNotifications: true,
  backgroundSyncEnabled: true,
  unreadSyncEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  batchingEnabled: true,
  deepLinking: true,
  batchWindowMs: 900,
  syncIntervalMs: 30000,
};

export const BATCH_WINDOW_OPTIONS = [300, 900, 1500, 3000];
export const SYNC_INTERVAL_OPTIONS = [15000, 30000, 60000, 180000];

export function readNotificationPreferences() {
  if (typeof window === 'undefined') return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    const stored = window.localStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (!stored) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(JSON.parse(stored) || {}),
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPreferences(preferences = {}) {
  const nextPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(preferences || {}),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(nextPreferences));
      window.dispatchEvent(new CustomEvent('yamshat:notification-preferences', { detail: nextPreferences }));
    } catch {
      // ignore storage failures
    }
  }

  return nextPreferences;
}

export function getUnreadCount(items = []) {
  return items.filter((item) => !normalizeNotification(item).seen).length;
}

export function dedupeNotifications(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const normalized = normalizeNotification(item);
    const key = String(normalized.id || `${normalized.title}:${normalized.created_at || normalized.body}`);
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        ...normalized,
        seen: existing.seen || normalized.seen,
        is_read: existing.is_read || normalized.is_read,
      });
      return;
    }
    map.set(key, normalized);
  });
  return [...map.values()].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export function buildBatchSummary(items = []) {
  const normalizedItems = dedupeNotifications(items);
  const unreadCount = getUnreadCount(normalizedItems);
  const byType = normalizedItems.reduce((acc, item) => {
    const key = String(item.type || item.category || 'general').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const strongestType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
  const summaryBody = normalizedItems.slice(0, 3).map((item) => item.title).join(' • ');

  return {
    id: `batch-${Date.now()}`,
    title: normalizedItems.length === 1 ? normalizedItems[0].title : `لديك ${normalizedItems.length} إشعارات جديدة`,
    body: normalizedItems.length === 1
      ? normalizedItems[0].body
      : `${summaryBody}${normalizedItems.length > 3 ? ' ...' : ''}`,
    count: normalizedItems.length,
    unreadCount,
    type: strongestType,
    category: strongestType,
    path: '/notifications',
    created_at: new Date().toISOString(),
    payload: {
      items: normalizedItems,
      summary: true,
      count: normalizedItems.length,
    },
  };
}

export function groupNotificationsForDisplay(items = [], grouped = true) {
  const normalizedItems = dedupeNotifications(items);
  if (!grouped) {
    return [{
      id: 'all',
      label: 'كل الإشعارات',
      items: normalizedItems,
      unreadCount: getUnreadCount(normalizedItems),
    }];
  }

  const now = new Date();
  const sections = new Map();

  normalizedItems.forEach((item) => {
    const date = new Date(item.created_at || Date.now());
    const diffDays = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000);
    let timeBucket = 'الأقدم';
    if (diffDays <= 0) timeBucket = 'اليوم';
    else if (diffDays === 1) timeBucket = 'أمس';
    else if (diffDays <= 7) timeBucket = 'هذا الأسبوع';

    const typeBucket = String(item.type || item.category || 'general').toLowerCase();
    const key = `${timeBucket}:${typeBucket}`;
    if (!sections.has(key)) {
      sections.set(key, {
        id: key,
        label: `${timeBucket} · ${translateBucket(typeBucket)}`,
        items: [],
        unreadCount: 0,
      });
    }
    const entry = sections.get(key);
    entry.items.push(item);
    if (!item.seen) entry.unreadCount += 1;
  });

  return [...sections.values()].sort((a, b) => {
    const aDate = new Date(a.items[0]?.created_at || 0).getTime();
    const bDate = new Date(b.items[0]?.created_at || 0).getTime();
    return bDate - aDate;
  });
}

export function translateBucket(bucket) {
  switch (bucket) {
    case 'mention':
    case 'mentions':
      return 'المنشنات';
    case 'chat':
    case 'message':
    case 'messages':
      return 'الرسائل';
    case 'live':
      return 'البث';
    case 'follow':
      return 'المتابعات';
    default:
      return 'العامة';
  }
}

export function buildNotificationMetrics(items = []) {
  const normalizedItems = dedupeNotifications(items);
  const unread = getUnreadCount(normalizedItems);
  const live = normalizedItems.filter((item) => String(item.type || item.category || '').toLowerCase() === 'live').length;
  const messages = normalizedItems.filter((item) => ['chat', 'message', 'messages'].includes(String(item.type || item.category || '').toLowerCase())).length;
  const mentions = normalizedItems.filter((item) => ['mention', 'mentions'].includes(String(item.type || item.category || '').toLowerCase())).length;

  return {
    total: normalizedItems.length,
    unread,
    read: Math.max(normalizedItems.length - unread, 0),
    live,
    messages,
    mentions,
  };
}

export function playNotificationFeedback(preferences = {}, intensity = 1) {
  if (typeof window === 'undefined') return;
  if (preferences.vibrationEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    const pattern = intensity > 1 ? [30, 40, 30] : [18];
    navigator.vibrate(pattern);
  }

  if (!preferences.soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = intensity > 1 ? 740 : 620;
    gainNode.gain.value = 0.0001;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;
    gainNode.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.start(now);
    oscillator.stop(now + 0.25);
    oscillator.onended = () => audioContext.close().catch(() => null);
  } catch {
    // ignore audio feedback failures
  }
}

export async function postServiceWorkerMessage(type, payload = {}) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const target = registration.active || navigator.serviceWorker.controller;
    if (!target) return false;
    target.postMessage({ type, payload });
    return true;
  } catch {
    return false;
  }
}

export async function registerBackgroundNotificationSync(enabled = true) {
  if (!enabled || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await registration.sync.register('sync-notifications');
      return true;
    }
  } catch {
    // ignore unsupported background sync
  }
  return false;
}

export function formatIntervalLabel(ms) {
  if (ms < 60000) return `${Math.round(ms / 1000)} ثانية`;
  return `${Math.round(ms / 60000)} دقيقة`;
}

export function formatBatchWindowLabel(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)} ثانية`;
}

export function buildRealtimeHealth(status = {}) {
  return [
    {
      key: 'realtime',
      label: 'Realtime',
      value: status.socketConnected ? 'متصل' : 'غير متصل',
      tone: status.socketConnected ? '#22c55e' : '#f59e0b',
      helper: status.lastSocketEventAt ? `آخر حدث: ${new Date(status.lastSocketEventAt).toLocaleTimeString('ar-EG')}` : 'بانتظار أول تحديث',
    },
    {
      key: 'push',
      label: 'Push',
      value: status.pushPermission === 'granted' ? 'مفعل' : status.pushPermission === 'denied' ? 'مرفوض' : 'بحاجة إذن',
      tone: status.pushPermission === 'granted' ? '#3b82f6' : '#f97316',
      helper: status.pushSubscribed ? 'الاشتراك محفوظ' : 'لم يتم الاشتراك بعد',
    },
    {
      key: 'sync',
      label: 'Background sync',
      value: status.backgroundSyncRegistered ? 'جاهز' : 'محدود',
      tone: status.backgroundSyncRegistered ? '#14b8a6' : '#a855f7',
      helper: status.lastSyncAt ? `آخر مزامنة: ${new Date(status.lastSyncAt).toLocaleTimeString('ar-EG')}` : 'لم تتم مزامنة بعد',
    },
    {
      key: 'batch',
      label: 'Batching',
      value: status.pendingBatchSize > 0 ? `${status.pendingBatchSize} قيد الانتظار` : 'فوري',
      tone: status.pendingBatchSize > 0 ? '#8b5cf6' : '#64748b',
      helper: status.lastBatchAt ? `آخر دفعة: ${new Date(status.lastBatchAt).toLocaleTimeString('ar-EG')}` : 'لا توجد دفعات سابقة',
    },
  ];
}
