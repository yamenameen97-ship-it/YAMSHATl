/**
 * مهيّئ PWA الشامل
 * (PWA Initializer)
 * 
 * يقوم بـ:
 * - تسجيل Service Worker
 * - تفعيل الخدمات المختلفة
 * - معالجة التحديثات
 * - إدارة حالة PWA
 */

import { pwaInstallPrompt } from './pwaInstallPrompt';
import { smoothTouchLayer } from './smoothTouchLayer';

export class PWAInitializer {
  constructor(options = {}) {
    this.config = {
      swPath: '/sw-pwa-enhanced.js',
      enableTouchLayer: true,
      enableInstallPrompt: true,
      enableNotifications: true,
      enableBackgroundSync: true,
      autoUpdate: true,
      updateCheckInterval: 60 * 60 * 1000, // كل ساعة
      ...options
    };

    this.state = {
      isInitialized: false,
      swRegistration: null,
      updateAvailable: false,
      isOnline: navigator.onLine,
    };

    this.listeners = new Map();
  }

  /**
   * تهيئة PWA
   */
  async init() {
    if (this.state.isInitialized) {
      console.warn('[PWA] Already initialized');
      return;
    }

    try {
      console.log('[PWA] Initializing...');

      // التحقق من دعم PWA
      if (!this.checkPWASupport()) {
        console.warn('[PWA] PWA not supported in this browser');
        return;
      }

      // تسجيل Service Worker
      await this.registerServiceWorker();

      // تفعيل طبقة اللمس
      if (this.config.enableTouchLayer) {
        this.initTouchLayer();
      }

      // تفعيل رسالة التثبيت
      if (this.config.enableInstallPrompt) {
        this.initInstallPrompt();
      }

      // تفعيل الإشعارات
      if (this.config.enableNotifications) {
        this.initNotifications();
      }

      // تفعيل المزامنة الخلفية
      if (this.config.enableBackgroundSync) {
        this.initBackgroundSync();
      }

      // إعداد مستمعي الأحداث
      this.setupEventListeners();

      // بدء فحص التحديثات
      if (this.config.autoUpdate) {
        this.startUpdateCheck();
      }

      this.state.isInitialized = true;
      console.log('[PWA] Initialization completed');
      this.emit('initialized');
    } catch (error) {
      console.error('[PWA] Initialization error:', error);
      this.emit('error', error);
    }
  }

  /**
   * التحقق من دعم PWA
   */
  checkPWASupport() {
    return !!(
      'serviceWorker' in navigator &&
      'caches' in window &&
      'indexedDB' in window
    );
  }

  /**
   * تسجيل Service Worker
   */
  async registerServiceWorker() {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('[PWA] Service Worker not supported');
        return;
      }

      const registration = await navigator.serviceWorker.register(this.config.swPath, {
        scope: '/',
        updateViaCache: 'none'
      });

      this.state.swRegistration = registration;
      console.log('[PWA] Service Worker registered:', registration);

      // معالجة التحديثات
      registration.addEventListener('updatefound', () => {
        this.handleUpdateFound(registration);
      });

      // فحص التحديثات فوراً
      registration.update().catch((error) => {
        console.warn('[PWA] Update check error:', error);
      });

      this.emit('sw-registered', registration);
    } catch (error) {
      console.error('[PWA] Service Worker registration error:', error);
      this.emit('sw-error', error);
    }
  }

  /**
   * معالجة اكتشاف تحديث
   */
  handleUpdateFound(registration) {
    const newWorker = registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // تحديث متاح
        this.state.updateAvailable = true;
        console.log('[PWA] Update available');
        this.emit('update-available');

        // إظهار رسالة التحديث
        this.showUpdatePrompt(newWorker);
      }
    });
  }

  /**
   * عرض رسالة التحديث
   */
  showUpdatePrompt(newWorker) {
    // إنشاء عنصر الرسالة
    const prompt = document.createElement('div');
    prompt.id = 'pwa-update-prompt';
    prompt.className = 'pwa-update-prompt';
    prompt.dir = 'rtl';
    prompt.lang = 'ar';

    // الأنماط المضمنة
    const style = document.createElement('style');
    style.textContent = `
      #pwa-update-prompt {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        padding: 16px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        z-index: 9998;
        font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        animation: slideUp 0.3s ease-out forwards;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .pwa-update-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .pwa-update-text {
        flex: 1;
      }

      .pwa-update-text p {
        margin: 0;
        font-size: 14px;
      }

      .pwa-update-actions {
        display: flex;
        gap: 8px;
      }

      .pwa-update-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        -webkit-user-select: none;
        user-select: none;
        min-height: 36px;
      }

      .pwa-update-btn-update {
        background: white;
        color: #059669;
      }

      .pwa-update-btn-update:active {
        transform: scale(0.98);
        opacity: 0.9;
      }

      .pwa-update-btn-later {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .pwa-update-btn-later:active {
        background: rgba(255, 255, 255, 0.3);
      }

      @media (max-width: 480px) {
        .pwa-update-content {
          flex-direction: column;
          align-items: stretch;
        }

        .pwa-update-actions {
          width: 100%;
        }

        .pwa-update-btn {
          flex: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // محتوى الرسالة
    prompt.innerHTML = `
      <div class="pwa-update-content">
        <div class="pwa-update-text">
          <p>تحديث جديد متاح</p>
        </div>
        <div class="pwa-update-actions">
          <button class="pwa-update-btn pwa-update-btn-update" id="pwa-update-btn">
            تحديث الآن
          </button>
          <button class="pwa-update-btn pwa-update-btn-later" id="pwa-update-later-btn">
            لاحقاً
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(prompt);

    // إضافة مستمعي الأحداث
    document.getElementById('pwa-update-btn').addEventListener('click', () => {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });

    document.getElementById('pwa-update-later-btn').addEventListener('click', () => {
      prompt.remove();
    });

    // إزالة الرسالة تلقائياً بعد 10 ثواني
    setTimeout(() => {
      if (prompt.parentNode) {
        prompt.remove();
      }
    }, 10000);
  }

  /**
   * تهيئة طبقة اللمس
   */
  initTouchLayer() {
    try {
      smoothTouchLayer.attachToElement(document.documentElement);
      console.log('[PWA] Touch layer initialized');
      this.emit('touch-layer-ready');
    } catch (error) {
      console.error('[PWA] Touch layer error:', error);
    }
  }

  /**
   * تهيئة رسالة التثبيت
   */
  initInstallPrompt() {
    try {
      pwaInstallPrompt.on('installed', () => {
        console.log('[PWA] App installed');
        this.emit('app-installed');
      });

      pwaInstallPrompt.on('install-accepted', () => {
        console.log('[PWA] Install accepted');
        this.emit('install-accepted');
      });

      console.log('[PWA] Install prompt initialized');
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
    }
  }

  /**
   * تهيئة الإشعارات
   */
  async initNotifications() {
    try {
      if (!('Notification' in window)) {
        console.warn('[PWA] Notifications not supported');
        return;
      }

      // طلب إذن الإشعارات
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('[PWA] Notification permission:', permission);
      }

      console.log('[PWA] Notifications initialized');
      this.emit('notifications-ready');
    } catch (error) {
      console.error('[PWA] Notifications error:', error);
    }
  }

  /**
   * تهيئة المزامنة الخلفية
   */
  async initBackgroundSync() {
    try {
      if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
        console.warn('[PWA] Background Sync not supported');
        return;
      }

      const registration = this.state.swRegistration;
      if (registration && registration.sync) {
        await registration.sync.register('sync-data');
        console.log('[PWA] Background sync registered');
        this.emit('background-sync-ready');
      }
    } catch (error) {
      console.error('[PWA] Background sync error:', error);
    }
  }

  /**
   * إعداد مستمعي الأحداث
   */
  setupEventListeners() {
    // مراقبة حالة الاتصال
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      console.log('[PWA] Online');
      this.emit('online');
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      console.log('[PWA] Offline');
      this.emit('offline');
    });

    // مراقبة تغييرات Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed');
        this.emit('controller-changed');
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        if (type === 'SYNC_DATA') {
          console.log('[PWA] Sync data message received');
          this.emit('sync-data', data);
        }
      });
    }
  }

  /**
   * بدء فحص التحديثات
   */
  startUpdateCheck() {
    setInterval(() => {
      if (this.state.swRegistration) {
        this.state.swRegistration.update().catch((error) => {
          console.warn('[PWA] Update check error:', error);
        });
      }
    }, this.config.updateCheckInterval);
  }

  /**
   * تسجيل مستمع الحدث
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    return () => {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * إطلاق حدث
   */
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[PWA] Error in ${eventType} listener:`, error);
      }
    });
  }

  /**
   * الحصول على حالة PWA
   */
  getState() {
    return {
      isInitialized: this.state.isInitialized,
      isOnline: this.state.isOnline,
      updateAvailable: this.state.updateAvailable,
      swRegistration: this.state.swRegistration ? 'registered' : 'not-registered'
    };
  }

  /**
   * إلغاء تسجيل Service Worker (لأغراض الاختبار)
   */
  async unregister() {
    try {
      if (this.state.swRegistration) {
        await this.state.swRegistration.unregister();
        this.state.swRegistration = null;
        console.log('[PWA] Service Worker unregistered');
      }
    } catch (error) {
      console.error('[PWA] Unregister error:', error);
    }
  }
}

// إنشاء مثيل عام
export const pwaInitializer = new PWAInitializer();

// تهيئة تلقائية عند تحميل الصفحة
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaInitializer.init();
  });
} else {
  pwaInitializer.init();
}
