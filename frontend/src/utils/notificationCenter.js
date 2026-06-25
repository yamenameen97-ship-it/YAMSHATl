import { buildAppUrl, redirectToAppPath } from './router.js';

// ✅ FIX (v59.13.3): منع تسرّب الذاكرة
// المشكلة السابقة: الـ Set كان يكبر بلا حدود لأن الإدخالات في maybeShowBrowserNotification
// لا تُحذف أبداً. الحل: (1) سقف أعلى للحجم مع إزالة أقدم إدخال (FIFO)
// (2) TTL للإدخالات بحيث تنتهي صلاحيتها تلقائياً.
const SHOWN_NOTIFICATIONS_MAX = 500;
const SHOWN_NOTIFICATIONS_TTL_MS = 10 * 60 * 1000; // 10 دقائق

// نستخدم Map بدل Set لتخزين وقت الإدخال (لـ TTL) وللحفاظ على ترتيب الإدراج (لـ FIFO)
const shownNotificationIds = new Map(); // id -> timestamp

function rememberShownNotification(id) {
  const key = String(id);
  const now = Date.now();

  // تنظيف الإدخالات المنتهية صلاحيتها
  for (const [k, ts] of shownNotificationIds) {
    if (now - ts > SHOWN_NOTIFICATIONS_TTL_MS) {
      shownNotificationIds.delete(k);
    } else {
      // Map يحافظ على ترتيب الإدخال، أول مفتاح هو الأقدم
      break;
    }
  }

  // سقف أعلى للحجم (FIFO)
  while (shownNotificationIds.size >= SHOWN_NOTIFICATIONS_MAX) {
    const oldestKey = shownNotificationIds.keys().next().value;
    if (oldestKey === undefined) break;
    shownNotificationIds.delete(oldestKey);
  }

  shownNotificationIds.set(key, now);
}

function hasShownNotification(id) {
  const key = String(id);
  const ts = shownNotificationIds.get(key);
  if (ts === undefined) return false;
  if (Date.now() - ts > SHOWN_NOTIFICATIONS_TTL_MS) {
    shownNotificationIds.delete(key);
    return false;
  }
  return true;
}

export function resolveNotificationPath(notification) {
  const payload = notification?.payload || notification?.data || {};
  if (typeof payload?.path === 'string' && payload.path.trim()) return payload.path.trim();
  if (typeof notification?.path === 'string' && notification.path.trim()) return notification.path.trim();

  const peer = payload?.username || payload?.target_username || payload?.peer || payload?.chat_with || notification?.username;
  const screen = String(payload?.screen || notification?.screen || notification?.category || notification?.type || '').toLowerCase();

  if (screen === 'chat' || screen === 'message' || screen === 'messages' || screen === 'dm') {
    return peer ? `/chat/${encodeURIComponent(peer)}` : '/inbox';
  }
  if (screen === 'notifications') return '/notifications';
  if (screen === 'groups') return '/groups';
  if (screen === 'users') return '/users';
  if (screen === 'profile') {
    return peer ? `/profile/${encodeURIComponent(peer)}` : '/profile';
  }
  return '/notifications';
}

export function normalizeNotification(item) {
  if (!item) {
    return {
      id: 'temp-empty',
      title: 'إشعار',
      body: 'لا توجد بيانات متاحة.',
      seen: true,
      created_at: null,
      payload: {},
      path: '/notifications',
    };
  }

  const payload = item?.payload || item?.data || {};
  const title = item?.title || payload?.title || 'إشعار جديد';
  const body = item?.body || item?.message || item?.text || payload?.body || 'وصلك تحديث جديد داخل يام شات.';
  const seen = Boolean(item?.seen ?? item?.is_read ?? item?.read);

  const path = resolveNotificationPath({ ...item, payload });

  return {
    ...item,
    id: item?.id || `${title}-${body}-${item?.created_at || Date.now()}`,
    title,
    body,
    seen,
    payload,
    path,
    url: buildAppUrl(path),
  };
}

export function browserNotificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

async function serviceWorkerNotification(notification) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(notification.title, {
    body: notification.body,
    icon: '/icons/icon-512.png',
    badge: '/icons/badge-96.png',
    tag: `yamshat:${notification.id}`,
    renotify: !notification.seen,
    timestamp: notification.created_at ? new Date(notification.created_at).getTime() : Date.now(),
    data: {
      path: notification.path,
      url: notification.url,
      notification,
    },
  });
  return true;
}

export async function maybeShowBrowserNotification(item) {
  if (!browserNotificationsSupported()) return false;
  if (document.visibilityState === 'visible') return false;
  if (window.Notification.permission !== 'granted') return false;

  const notification = normalizeNotification(item);
  if (hasShownNotification(notification.id)) return false;
  rememberShownNotification(notification.id);

  try {
    await serviceWorkerNotification(notification);
    return true;
  } catch {
    const native = new window.Notification(notification.title, {
      body: notification.body,
      icon: '/icons/icon-512.png',
      tag: `yamshat:${notification.id}`,
      data: { path: notification.path, url: notification.url },
    });
    native.onclick = () => {
      window.focus();
      redirectToAppPath(notification.path || '/notifications', { replace: false });
      native.close();
    };
    return true;
  }
}

// ============================================================
// 🔔 إضافات v22: helpers لطلب الإذن وعرض إشعار محلي للمجموعات
// ============================================================

export async function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'default';
  }
}

export function showLocalNotification({ title, body, icon, tag, data } = {}) {
  if (typeof Notification === 'undefined') return null;
  if (Notification.permission !== 'granted') return null;
  // إزالة التكرار خلال 3 ثواني لنفس الـ tag
  const dedupeKey = `${tag || title}:${body}`;
  if (shownNotificationIds.has(dedupeKey)) return null;
  shownNotificationIds.set(dedupeKey, Date.now());
  setTimeout(() => shownNotificationIds.delete(dedupeKey), 3000);

  try {
    const n = new Notification(title || 'يام شات', {
      body: body || '',
      icon: icon || '/favicon.ico',
      tag: tag || 'yamshat',
      data: data || {},
      dir: 'rtl',
      lang: 'ar',
    });
    n.onclick = () => {
      try {
        window.focus();
        if (data?.groupId) {
          redirectToAppPath(`/groups/${data.groupId}`);
        }
        n.close();
      } catch { /* noop */ }
    };
    return n;
  } catch {
    return null;
  }
}
