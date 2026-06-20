/**
 * Yamshat Realtime Push Service Worker (v47.6)
 * -------------------------------------------------
 * يتولّى استقبال إشعارات Web Push من الخادم وعرضها على نظام التشغيل
 * حتى لو كان التبويب مغلقاً (تماماً مثل Instagram/Twitter/WhatsApp Web).
 *
 * الأحداث:
 *   - push       : عند وصول إشعار من الخادم (مُشفَّر VAPID).
 *   - notificationclick : عند نقر المستخدم على الإشعار.
 *   - pushsubscriptionchange : عند تغيّر اشتراك المتصفح.
 */

const SW_VERSION = 'yamshat-push-v47.6';
const DEFAULT_ICON = '/icons/icon-512.png';
const DEFAULT_BADGE = '/icons/badge-96.png';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * استقبال إشعار من الخادم وعرضه على المستخدم.
 * الـ payload المتوقع:
 * {
 *   id, type, category, title, body,
 *   actor_username, actor_avatar,
 *   action_url, target_id
 * }
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    try {
      data = { title: 'إشعار جديد', body: event.data ? event.data.text() : '' };
    } catch (_) {
      data = { title: 'إشعار جديد', body: '' };
    }
  }

  const title = data.title || 'إشعار جديد';
  const body  = data.body  || data.message || '';
  const url   = data.action_url || data.url || '/notifications';
  const tag   = `yamshat-${data.type || 'generic'}-${data.id || Date.now()}`;

  const options = {
    body,
    icon: data.icon || data.actor_avatar || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag,
    // renotify=true يجعل الإشعارات الجديدة من نفس النوع تُنبّه المستخدم مجدداً
    renotify: true,
    // الحفاظ على الاتجاه العربي
    dir: 'rtl',
    lang: 'ar',
    // الإشعار يبقى حتى يتفاعل معه المستخدم (مثل WhatsApp)
    requireInteraction: data.priority === 'high',
    // اهتزاز عند الوصول (موبايل)
    vibrate: [120, 60, 120],
    timestamp: Date.now(),
    data: {
      url,
      notification_id: data.id,
      type: data.type,
      category: data.category,
    },
    actions: [
      { action: 'open',    title: 'فتح' },
      { action: 'dismiss', title: 'تجاهل' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * عند نقر المستخدم على الإشعار:
 *   - إن كان التبويب مفتوحاً نُركّز عليه.
 *   - وإلا نفتح نافذة جديدة على رابط الإجراء.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/notifications';

  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    // ابحث عن تبويب Yamshat مفتوح وأعد توجيهه
    for (const client of allClients) {
      if (client.url.includes(self.location.origin)) {
        client.postMessage({
          type: 'yamshat:notification-click',
          notification_id: event.notification.data && event.notification.data.notification_id,
          url: targetUrl,
        });
        try { await client.focus(); } catch (_) {}
        try { await client.navigate(targetUrl); } catch (_) {}
        return;
      }
    }

    // لا يوجد تبويب مفتوح → افتح جديداً
    await self.clients.openWindow(targetUrl);
  })());
});

/**
 * عند تغيّر اشتراك Push (انتهاء صلاحية VAPID أو رفض المستخدم)،
 * نُعلم الخادم لإلغاء التسجيل القديم.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const oldEndpoint = event.oldSubscription && event.oldSubscription.endpoint;
      const newSubscription = await self.registration.pushManager.subscribe(
        event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true }
      );
      await fetch('/api/devices/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: oldEndpoint || crypto.randomUUID(),
          push_token: newSubscription.endpoint,
          platform: 'web',
          provider: 'webpush',
        }),
      });
    } catch (_) { /* noop */ }
  })());
});

console.log(`[SW] ${SW_VERSION} loaded`);
