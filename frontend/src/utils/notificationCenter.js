export function resolveNotificationPath(notification) {
  const payload = notification?.payload || notification?.data || {};
  if (typeof payload?.path === 'string' && payload.path.trim()) return payload.path.trim();
  if (typeof notification?.path === 'string' && notification.path.trim()) return notification.path.trim();

  const screen = String(payload?.screen || notification?.screen || '').toLowerCase();
  if (screen === 'chat') return '/inbox';
  if (screen === 'notifications') return '/notifications';
  if (screen === 'live') return '/live';
  if (screen === 'groups') return '/groups';
  if (screen === 'users') return '/users';
  if (screen === 'profile') {
    const username = payload?.username || payload?.target_username || notification?.username;
    return username ? `/profile/${encodeURIComponent(username)}` : '/profile';
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
  const body = item?.body || item?.message || item?.text || payload?.body || 'وصلك تحديث جديد داخل يمشات.';
  const seen = Boolean(item?.seen ?? item?.is_read ?? item?.read);

  return {
    ...item,
    id: item?.id || `${title}-${body}-${item?.created_at || Date.now()}`,
    title,
    body,
    seen,
    payload,
    path: resolveNotificationPath({ ...item, payload }),
  };
}

export function browserNotificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}
