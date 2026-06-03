import { buildAppUrl, redirectToAppPath } from './router.js';

const shownNotificationIds = new Set();

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
  if (screen === 'live') return '/live';
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
  if (shownNotificationIds.has(String(notification.id))) return false;
  shownNotificationIds.add(String(notification.id));

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
