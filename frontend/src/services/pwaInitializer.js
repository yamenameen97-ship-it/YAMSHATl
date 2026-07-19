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
  async init(options = {}) {
    if (this.state.isInitialized) {
      console.warn('[PWA] Already initialized');
      return;
    }

    // دمج الخيارات الجديدة
    this.config = { ...this.config, ...options };

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
   *
   * v88.11: بدلاً من حقن HTML خام (بانر أخضر متصفح)،
   * نُطلق حدث window لكي يلتقطه مكوّن React الرسمي
   * <AppUpdatePrompt /> الذي يعرض النافذة بأسلوب النظام الأصلي.
   */
  handleUpdateFound(registration) {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // تحديث متاح
        this.state.updateAvailable = true;
        console.log('[PWA] Update available — dispatching yamshat:update-ready');
        this.emit('update-available');

        // v88.11: نُطلق الحدث بدلاً من حقن HTML — يستقبله <AppUpdatePrompt />
        try {
          window.dispatchEvent(
            new CustomEvent('yamshat:update-ready', {
              detail: { registration, worker: newWorker },
            })
          );
        } catch (err) {
          console.warn('[PWA] Failed to dispatch update-ready event:', err);
        }
      }
    });
  }

  /**
   * v88.11: تم إلغاء حقن HTML القديم لعرض بانر التحديث.
   * صار العرض يتم عبر مكوّن React الرسمي <AppUpdatePrompt />
   * الذي يستمع لحدث 'yamshat:update-ready'.
   * نُبقي الدالة موجودة كـ no-op لضمان التوافق الرجعي إن استُدعيت من مكان آخر.
   */
  showUpdatePrompt(newWorker) {
    // Deprecated in v88.11 — النافذة تُعرض الآن عبر <AppUpdatePrompt /> بأسلوب نظام YAMSHAT.
    // نُطلق الحدث فقط للتأكد من الظهور في حال تم استدعاء الدالة من مسار قديم.
    try {
      const registration = this.state.swRegistration;
      window.dispatchEvent(
        new CustomEvent('yamshat:update-ready', {
          detail: { registration, worker: newWorker },
        })
      );
    } catch (err) {
      console.warn('[PWA] showUpdatePrompt legacy dispatch failed:', err);
    }
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
   *
   * ✅ v83.6 FIX #1: لا نطلب Notification.requestPermission() تلقائياً هنا.
   * قبل الإصلاح: عند بدء التطبيق مباشرة (بلا أي user gesture) كنّا نستدعي
   *   `Notification.requestPermission()` — وهو ما تعتبره متصفحات Chrome/Firefox/Edge
   *   الحديثة بمثابة "permission spam" وترفضه تلقائياً (Firefox يعرض 'default'
   *   دون سؤال المستخدم أصلاً، Chrome يسجّل تحذير 'Permission request ignored').
   *   نتيجة الخلل:
   *     - المستخدم لا يرى نافذة الإذن أبداً حتى لو ضغط لاحقاً على زر التفعيل.
   *     - Chrome قد يحظر جميع طلبات الإذن اللاحقة بسبب abuse heuristics.
   *     - يخالف نفس القاعدة التي أُصلحت في GlobalNotificationListener
   *       (v59.13.14 FIX #4) وفي NotificationPermissionPrompt.
   *
   * الحل: نكتفي بفحص القدرات فقط. الطلب الفعلي محصور في
   *   NotificationPermissionPrompt.handleEnable الذي يعمل داخل user gesture.
   */
  async initNotifications() {
    try {
      if (!('Notification' in window)) {
        console.warn('[PWA] Notifications not supported');
        return;
      }

      // ✅ v83.6 FIX #1: لا نستدعي requestPermission() هنا — يتم فقط عبر
      // ضغطة زر المستخدم في NotificationPermissionPrompt.
      console.log('[PWA] Notifications capability detected. permission =', Notification.permission);
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

      // ✅ FIX: إصلاح خطأ "Registration failed - no active Service Worker"
      //   بالانتظار حتى يصبح الـService Worker في حالة active قبل تسجيل sync.
      const registration = this.state.swRegistration || (
        navigator.serviceWorker?.ready ? await navigator.serviceWorker.ready : null
      );
      if (!registration) {
        console.warn('[PWA] Background sync skipped: no SW registration');
        return;
      }
      // إذا لم يكن هناك active worker بعد، انتظر حدث activate أو controllerchange
      if (!registration.active) {
        await new Promise((resolve) => {
          let resolved = false;
          const done = () => { if (!resolved) { resolved = true; resolve(); } };
          const installing = registration.installing || registration.waiting;
          if (installing) {
            installing.addEventListener('statechange', () => {
              if (installing.state === 'activated') done();
            });
          }
          // fallback: لا ننتظر للأبد
          setTimeout(done, 5000);
        });
      }
      if (!registration.active) {
        console.warn('[PWA] Background sync skipped: SW still not active');
        return;
      }
      if (registration.sync && typeof registration.sync.register === 'function') {
        try {
          await registration.sync.register('sync-data');
          console.log('[PWA] Background sync registered');
          this.emit('background-sync-ready');
        } catch (regErr) {
          // لا ترفع الخطأ للأعلى — هذا أمر اختياري، تجنباً لإفساد تهيئة PWA
          console.warn('[PWA] Background sync register failed (ignored):', regErr?.message || regErr);
        }
      }
    } catch (error) {
      console.warn('[PWA] Background sync error (non-fatal):', error?.message || error);
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
