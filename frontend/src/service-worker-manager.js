/**
 * Service Worker Manager
 * 
 * يدير تسجيل Service Worker وإخطار المستخدمين بالتحديثات الجديدة
 */

let swRegistration = null;
let updateCheckInterval = null;

/**
 * تسجيل Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SWM] Service Worker غير مدعوم في هذا المتصفح');
    return null;
  }

  try {
    // استخدام Service Worker المحسّن
    const swPath = '/sw-enhanced.js';
    
    swRegistration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
      updateViaCache: 'none', // تجاهل كاش المتصفح عند البحث عن تحديثات
    });

    console.log('[SWM] تم تسجيل Service Worker بنجاح');

    // الاستماع لرسائل التحديث
    setupUpdateListener();

    // بدء فحص التحديثات بشكل دوري
    startPeriodicUpdateCheck();

    return swRegistration;
  } catch (error) {
    console.error('[SWM] فشل تسجيل Service Worker:', error);
    return null;
  }
}

/**
 * إعداد مستمع لرسائل التحديث من Service Worker
 */
function setupUpdateListener() {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, version, message } = event.data || {};

    if (type === 'yamshat:update-available') {
      console.log('[SWM] تحديث جديد متاح:', version);

      // v88.11: نُطلق حدثين معاً:
      //   - update-available (توافق رجعي)
      //   - update-ready     (حدث موحد يلتقطه <AppUpdatePrompt />)
      const detail = { registration: swRegistration, version, message };
      window.dispatchEvent(new CustomEvent('yamshat:update-available', { detail }));
      window.dispatchEvent(new CustomEvent('yamshat:update-ready', { detail }));

      // ✅ لم نعد نستخدم showUpdateNotification (حقن HTML) —
      // مكوّن <AppUpdatePrompt /> React يتولّى العرض بأسلوب النظام.
    }

    if (type === 'yamshat:sync-now') {
      console.log('[SWM] طلب مزامنة من Service Worker');
      window.dispatchEvent(
        new CustomEvent('yamshat:sync-now', {
          detail: event.data,
        })
      );
    }
  });
}

/**
 * بدء فحص دوري للتحديثات
 * يتحقق من التحديثات كل 5 دقائق
 */
function startPeriodicUpdateCheck() {
  if (!swRegistration) return;

  // فحص فوري عند التسجيل
  checkForUpdates();

  // فحص دوري كل 5 دقائق
  updateCheckInterval = setInterval(() => {
    checkForUpdates();
  }, 5 * 60 * 1000);

  // فحص عند استعادة الاتصال بالإنترنت
  window.addEventListener('online', () => {
    console.log('[SWM] استعادة الاتصال بالإنترنت، جاري البحث عن تحديثات...');
    checkForUpdates();
  });
}

/**
 * البحث عن تحديثات
 */
async function checkForUpdates() {
  if (!swRegistration) return;

  try {
    console.log('[SWM] جاري البحث عن تحديثات...');
    await swRegistration.update();
  } catch (error) {
    console.warn('[SWM] فشل البحث عن تحديثات:', error);
  }
}

/**
 * إظهار إخطار التحديث للمستخدم
 *
 * v88.11 DEPRECATED: تمّ تعطيل حقن HTML الخارجي. العرض الرسمي
 * حالياً يتم عبر مكوّن React <AppUpdatePrompt /> ليظهر بأسلوب
 * نظام YAMSHAT الموحّد. نُبقي الدالة ك no-op حتّى لا تنكسر الاستدعاءات القديمة.
 */
// eslint-disable-next-line no-unused-vars
function showUpdateNotification(version, message) {
  console.log('[SWM] showUpdateNotification: deprecated — يُعرض الآن عبر <AppUpdatePrompt /> React.');
  return;
  // الكود القديم محفوظ للمرجعية فقط، لكن لا يعمل بسبب return أعلاه:
  // eslint-disable-next-line no-unreachable
  ((_v, _m) => {
  // إنشاء عنصر إخطار
  const notification = document.createElement('div');
  notification.id = 'yamshat-update-notification';
  notification.className = 'yamshat-update-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-message">
        <strong>تحديث جديد متاح!</strong>
        <p>${message}</p>
      </div>
      <div class="notification-actions">
        <button class="btn-update" onclick="window.location.reload()">
          تحديث الآن
        </button>
        <button class="btn-dismiss" onclick="this.parentElement.parentElement.parentElement.remove()">
          لاحقاً
        </button>
      </div>
    </div>
  `;

  // إضافة الأنماط
  if (!document.getElementById('yamshat-update-styles')) {
    const style = document.createElement('style');
    style.id = 'yamshat-update-styles';
    style.textContent = `
      .yamshat-update-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        max-width: 400px;
        animation: slideInUp 0.3s ease-out;
      }

      @keyframes slideInUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .notification-message {
        flex: 1;
      }

      .notification-message strong {
        display: block;
        margin-bottom: 4px;
      }

      .notification-message p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }

      .notification-actions {
        display: flex;
        gap: 8px;
        white-space: nowrap;
      }

      .btn-update,
      .btn-dismiss {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .btn-update {
        background: white;
        color: #667eea;
      }

      .btn-update:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .btn-dismiss {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .btn-dismiss:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      @media (max-width: 600px) {
        .yamshat-update-notification {
          bottom: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }

        .notification-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .notification-actions {
          width: 100%;
        }

        .btn-update,
        .btn-dismiss {
          flex: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // إضافة الإخطار إلى الصفحة
  document.body.appendChild(notification);

  // إزالة الإخطار تلقائياً بعد 10 ثوان إذا لم يتم الضغط على أي زر
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
  })(version, message);
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
  
  // إخبار Service Worker بتخطي الانتظار
  sendMessageToSW({ type: 'yamshat:skip-waiting' });

  // إعادة تحميل الصفحة بعد قليل
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

/**
 * مسح الكاش يدوياً
 */
export async function clearCache() {
  console.log('[SWM] مسح الكاش يدوياً...');
  
  sendMessageToSW({ type: 'yamshat:clear-cache' });

  // مسح كاش المتصفح أيضاً
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => caches.delete(name))
    );
    console.log('[SWM] تم مسح جميع الكاش بنجاح');
  }
}

/**
 * إيقاف فحص التحديثات
 */
export function stopUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
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
