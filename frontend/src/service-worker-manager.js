/**
 * Service Worker Manager — Hardened (v2)
 *
 * إصلاحات لمشكلة "زر التحديث المتكرر كل 15 دقيقة":
 * 1) منع التسجيل المضاعف (إن استُدعي registerServiceWorker مرتين).
 * 2) منع إضافة مستمعي رسائل متكررين (كل مستمع كان يُضاف فوق القديم → الزر يظهر مرتين).
 * 3) إضافة Cooldown: لا نعرض إشعار التحديث أكثر من مرة كل ساعة لنفس النسخة.
 * 4) تذكّر النسخة التي عُرض إشعارها (localStorage) لتجنب إعادة الإظهار بعد reload.
 * 5) عرض شريط تحديث واحد فقط (نُزيل أي شريط قديم قبل إضافة الجديد).
 * 6) فترة الفحص الدوري أصبحت 30 دقيقة بدلاً من 5 (تخفيف الضغط).
 * 7) عند الضغط على "تحديث الآن" نمسح علامة الإصدار حتى يعمل الإشعار للنسخ المستقبلية.
 */

let swRegistration = null;
let updateCheckInterval = null;
let messageListenerAttached = false;
let onlineListenerAttached = false;
let registrationInProgress = false;
let lastNotifiedVersion = null;
let lastNotificationShownAt = 0;

const UPDATE_NOTIFICATION_ID = 'yamshat-update-notification';
const UPDATE_STYLES_ID = 'yamshat-update-styles';
const LS_KEY_DISMISSED_VERSION = 'yamshat:sw:dismissed-version';
const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // ساعة واحدة بين الإشعارات
const PERIODIC_CHECK_MS = 30 * 60 * 1000;        // فحص كل 30 دقيقة (بدلاً من 5)

/**
 * تسجيل Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SWM] Service Worker غير مدعوم في هذا المتصفح');
    return null;
  }

  // ✅ منع التسجيل المضاعف
  if (swRegistration) {
    console.log('[SWM] SW مسجَّل بالفعل، يُعاد استخدام التسجيل القائم');
    return swRegistration;
  }
  if (registrationInProgress) {
    console.log('[SWM] التسجيل جارٍ بالفعل، تخطّي الاستدعاء المتكرر');
    return null;
  }
  registrationInProgress = true;

  try {
    const swPath = '/sw-enhanced.js';

    swRegistration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[SWM] تم تسجيل Service Worker بنجاح');

    setupUpdateListener();
    startPeriodicUpdateCheck();

    return swRegistration;
  } catch (error) {
    console.error('[SWM] فشل تسجيل Service Worker:', error);
    return null;
  } finally {
    registrationInProgress = false;
  }
}

/**
 * إعداد مستمع لرسائل التحديث من Service Worker
 * ⚠️ نضمن أن المستمع يُضاف مرة واحدة فقط طوال عمر الصفحة
 */
function setupUpdateListener() {
  if (!navigator.serviceWorker) return;
  if (messageListenerAttached) {
    console.log('[SWM] مستمع الرسائل مضاف بالفعل، لن نُضيفه مجدداً');
    return;
  }

  navigator.serviceWorker.addEventListener('message', handleSWMessage);
  messageListenerAttached = true;
}

/**
 * معالج موحَّد لرسائل SW (مُسمَّى حتى لا يُكرَّر)
 */
function handleSWMessage(event) {
  const { type, version, message } = event.data || {};

  if (type === 'yamshat:update-available') {
    console.log('[SWM] تحديث جديد متاح:', version);

    // ✅ لا نُعيد إظهار الإشعار لنفس النسخة التي رفضها المستخدم سابقاً
    const dismissedVersion = (() => {
      try { return localStorage.getItem(LS_KEY_DISMISSED_VERSION); } catch { return null; }
    })();
    if (version && dismissedVersion && dismissedVersion === String(version)) {
      console.log('[SWM] تم تجاهل هذه النسخة سابقاً، لن نُعيد الإظهار:', version);
      return;
    }

    // ✅ Cooldown: لا نعرض الإشعار أكثر من مرة كل ساعة لنفس النسخة
    const now = Date.now();
    if (
      lastNotifiedVersion === version &&
      now - lastNotificationShownAt < NOTIFICATION_COOLDOWN_MS
    ) {
      console.log('[SWM] الإشعار ضمن فترة Cooldown، تخطّي');
      return;
    }

    lastNotifiedVersion = version;
    lastNotificationShownAt = now;

    window.dispatchEvent(
      new CustomEvent('yamshat:update-available', {
        detail: { version, message },
      })
    );

    showUpdateNotification(version, message);
  }

  if (type === 'yamshat:sync-now') {
    console.log('[SWM] طلب مزامنة من Service Worker');
    window.dispatchEvent(
      new CustomEvent('yamshat:sync-now', { detail: event.data })
    );
  }
}

/**
 * بدء فحص دوري للتحديثات (كل 30 دقيقة)
 */
function startPeriodicUpdateCheck() {
  if (!swRegistration) return;

  // إن كان هناك مؤقت سابق فأوقفه أولاً (نظافة)
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }

  // فحص فوري عند التسجيل
  checkForUpdates();

  // فحص دوري كل 30 دقيقة
  updateCheckInterval = setInterval(checkForUpdates, PERIODIC_CHECK_MS);

  // فحص عند استعادة الاتصال — مستمع واحد فقط
  if (!onlineListenerAttached) {
    window.addEventListener('online', () => {
      console.log('[SWM] استعادة الاتصال بالإنترنت، جاري البحث عن تحديثات...');
      checkForUpdates();
    });
    onlineListenerAttached = true;
  }
}

/**
 * البحث عن تحديثات
 */
async function checkForUpdates() {
  if (!swRegistration) return;
  try {
    await swRegistration.update();
  } catch (error) {
    console.warn('[SWM] فشل البحث عن تحديثات:', error);
  }
}

/**
 * إظهار إخطار التحديث للمستخدم
 * ⚠️ نضمن وجود شريط واحد فقط في DOM (نُزيل أي شريط قديم قبل الإضافة)
 */
function showUpdateNotification(version, message) {
  // ✅ إزالة أي إشعار قديم لمنع ظهور شريطين فوق بعض
  const existing = document.getElementById(UPDATE_NOTIFICATION_ID);
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = UPDATE_NOTIFICATION_ID;
  notification.className = 'yamshat-update-notification';
  notification.setAttribute('dir', 'rtl');
  notification.dataset.version = version || '';

  // نبني المحتوى عبر DOM (بدون onclick HTML لتجنب أي حقن)
  const content = document.createElement('div');
  content.className = 'notification-content';

  const msgWrap = document.createElement('div');
  msgWrap.className = 'notification-message';
  const strong = document.createElement('strong');
  strong.textContent = 'تحديث جديد متاح!';
  const p = document.createElement('p');
  p.textContent = message || 'يوجد إصدار جديد. هل تريد التحديث الآن؟';
  msgWrap.appendChild(strong);
  msgWrap.appendChild(p);

  const actions = document.createElement('div');
  actions.className = 'notification-actions';

  const updateBtn = document.createElement('button');
  updateBtn.type = 'button';
  updateBtn.className = 'btn-update';
  updateBtn.textContent = 'تحديث الآن';
  updateBtn.addEventListener('click', () => {
    // ✅ عند التحديث: نمسح علامة "النسخة المُتجاهَلة" لأن المستخدم وافق
    try { localStorage.removeItem(LS_KEY_DISMISSED_VERSION); } catch {}
    // نخبر SW بتفعيل الإصدار الجديد ثم نعيد التحميل مرة واحدة
    sendMessageToSW({ type: 'SKIP_WAITING' });
    setTimeout(() => window.location.reload(), 300);
  });

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.className = 'btn-dismiss';
  dismissBtn.textContent = 'لاحقاً';
  dismissBtn.addEventListener('click', () => {
    // ✅ نُسجّل أن المستخدم رفض هذه النسخة → لا نُزعجه بها مجدداً
    try {
      if (version) localStorage.setItem(LS_KEY_DISMISSED_VERSION, String(version));
    } catch {}
    notification.remove();
  });

  actions.appendChild(updateBtn);
  actions.appendChild(dismissBtn);

  content.appendChild(msgWrap);
  content.appendChild(actions);
  notification.appendChild(content);

  // إضافة الأنماط مرة واحدة فقط
  if (!document.getElementById(UPDATE_STYLES_ID)) {
    const style = document.createElement('style');
    style.id = UPDATE_STYLES_ID;
    style.textContent = `
      .yamshat-update-notification {
        position: fixed;
        bottom: 20px;
        inset-inline-start: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        max-width: 400px;
        font-family: 'Noto Sans Arabic', system-ui, -apple-system, sans-serif;
        animation: slideInUp 0.3s ease-out;
      }

      @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }

      .yamshat-update-notification .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .yamshat-update-notification .notification-message { flex: 1; }
      .yamshat-update-notification .notification-message strong { display: block; margin-bottom: 4px; }
      .yamshat-update-notification .notification-message p { margin: 0; font-size: 14px; opacity: 0.9; }

      .yamshat-update-notification .notification-actions {
        display: flex; gap: 8px; white-space: nowrap;
      }

      .yamshat-update-notification .btn-update,
      .yamshat-update-notification .btn-dismiss {
        padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;
        font-size: 14px; font-weight: 500; transition: all 0.2s ease;
        font-family: inherit;
      }

      .yamshat-update-notification .btn-update { background: white; color: #667eea; }
      .yamshat-update-notification .btn-update:hover { transform: scale(1.05); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }

      .yamshat-update-notification .btn-dismiss { background: rgba(255, 255, 255, 0.2); color: white; }
      .yamshat-update-notification .btn-dismiss:hover { background: rgba(255, 255, 255, 0.3); }

      @media (max-width: 600px) {
        .yamshat-update-notification {
          bottom: 10px; inset-inline-start: 10px; inset-inline-end: 10px; max-width: none;
        }
        .yamshat-update-notification .notification-content { flex-direction: column; align-items: flex-start; }
        .yamshat-update-notification .notification-actions { width: 100%; }
        .yamshat-update-notification .btn-update,
        .yamshat-update-notification .btn-dismiss { flex: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // إزالة الإخطار تلقائياً بعد 15 ثانية إذا لم يضغط المستخدم شيئاً
  setTimeout(() => {
    if (notification.parentElement) notification.remove();
  }, 15000);
}

/**
 * إرسال رسالة إلى Service Worker
 */
export function sendMessageToSW(message) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('[SWM] لا يوجد Service Worker نشط');
    return;
  }
  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * إجبار تحديث فوري
 */
export async function forceUpdate() {
  console.log('[SWM] إجبار تحديث فوري...');
  try { localStorage.removeItem(LS_KEY_DISMISSED_VERSION); } catch {}
  sendMessageToSW({ type: 'SKIP_WAITING' });
  setTimeout(() => window.location.reload(), 300);
}

/**
 * مسح الكاش يدوياً
 */
export async function clearCache() {
  console.log('[SWM] مسح الكاش يدوياً...');
  sendMessageToSW({ type: 'yamshat:clear-cache' });

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[SWM] تم مسح جميع الكاش بنجاح');
  }
}

/**
 * إيقاف فحص التحديثات + تنظيف كامل (مفيد عند الإغلاق/التبديل)
 */
export function stopUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
  if (messageListenerAttached && navigator.serviceWorker) {
    navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    messageListenerAttached = false;
  }
}

/**
 * الحصول على معلومات Service Worker الحالي
 */
export function getServiceWorkerInfo() {
  return {
    registered: !!swRegistration,
    registration: swRegistration,
    active: !!navigator.serviceWorker?.controller,
    lastNotifiedVersion,
    lastNotificationShownAt,
  };
}

export default {
  registerServiceWorker,
  sendMessageToSW,
  forceUpdate,
  clearCache,
  stopUpdateCheck,
  getServiceWorkerInfo,
};
