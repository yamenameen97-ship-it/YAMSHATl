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
      // ✅ v89.10 ROOT FIX #1: الافتراضي كان '/sw-pwa-enhanced.js' وهو SW قديم
      //   بدون معالج /share-target. إذا فشل killLegacyServiceWorkers() لأي سبب
      //   (وضع خفي/بلا صلاحيات/getRegistrations معطّل) → يُسجَّل SW القديم
      //   من جديد → أول POST من يوتيوب يفوّت المعالج → شاشة بيضاء.
      //   الحل: الافتراضي الآن '/sw.js' الحديث الذي يحتوي على handleShareTarget.
      swPath: '/sw.js',
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
      initPromise: null,
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
    if (this.state.isInitialized) return this.state.swRegistration;
    if (this.state.initPromise) return this.state.initPromise;

    // Merge options once and serialize initialization to prevent duplicate listeners.
    this.config = { ...this.config, ...options };
    this.state.initPromise = (async () => {
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
      return this.state.swRegistration;
    } catch (error) {
      console.error('[PWA] Initialization error:', error);
      this.emit('error', error);
      return null;
    } finally {
      this.state.initPromise = null;
    }
    })();
    return this.state.initPromise;
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

      // ✅ v89.10 ROOT FIX #2: حماية ذاتية — لا نسمح أبداً بتسجيل SW قديم
      //   حتى لو تم استدعاء init() بـ swPath: '/sw-pwa-enhanced.js' من كود قديم
      //   عالق في bundler cache، نُجبره على /sw.js. هذا خط الدفاع الأخير.
      let effectiveSwPath = this.config.swPath || '/sw.js';
      if (/sw-pwa-enhanced\.js|sw-enhanced\.js/i.test(effectiveSwPath)) {
        console.warn('[PWA v89.10] Refusing to register legacy SW:', effectiveSwPath, '→ forcing /sw.js');
        effectiveSwPath = '/sw.js';
        this.config.swPath = '/sw.js';
      }

      // ✅ v89.10 ROOT FIX #3: تنظيف SW القديم مباشرة قبل التسجيل (متزامن)
      //   killLegacyServiceWorkers() في main.jsx غير حاجب — قد يتسابق مع هذا التسجيل.
      //   هنا نضمن الحذف قبل أي register().
      try {
        const existing = await navigator.serviceWorker.getRegistrations();
        for (const reg of existing) {
          try {
            const url = reg?.active?.scriptURL || reg?.waiting?.scriptURL || reg?.installing?.scriptURL || '';
            if (/sw-pwa-enhanced\.js|sw-enhanced\.js/i.test(url)) {
              console.warn('[PWA v89.10] Unregistering legacy SW before new registration:', url);
              await reg.unregister().catch(() => null);
            }
          } catch (_) { /* ignore individual */ }
        }
      } catch (_) { /* ignore — proceed with registration */ }

      const registration = await navigator.serviceWorker.register(effectiveSwPath, {
        scope: '/',
        updateViaCache: 'none'
      });

      this.state.swRegistration = registration;
      console.log('[PWA] Service Worker registered:', registration);

      // معالجة التحديثات
      registration.addEventListener('updatefound', () => {
        this.handleUpdateFound(registration);
      });

      // ✅ v89.20 ROOT FIX #1: منع registration.update() الفوري عند /share-target
      //   السبب الجذري:
      //     registration.update() يُجبر المتصفح على فحص نسخة SW من الخادم.
      //     إذا وُجدت نسخة جديدة → updatefound → installing → installed →
      //     controllerchange أثناء معالجة POST من يوتيوب → SW يفوّت الطلب →
      //     صفحة بيضاء / حلقة reload.
      //     حتى لو لم توجد نسخة جديدة، الاستدعاء الفوري يُضيف overhead
      //     غير ضروري في لحظة استقبال المشاركة.
      //   الحل:
      //     - عند /share-target: نتخطى update() الفوري تماماً. التحديث سيُكتشف
      //       لاحقاً عبر startUpdateCheck() الدورية (كل ساعة) أو عند reload عادي.
      //     - خارج /share-target: نُبقي السلوك كما هو (فحص فوري طبيعي).
      try {
        const path = (window.location && window.location.pathname) || '';
        const hash = (window.location && window.location.hash) || '';
        const inShareTarget = path === '/share-target'
          || path.startsWith('/share-target/')
          || hash.startsWith('#/share-target')
          || hash.includes('/share-target');
        if (inShareTarget) {
          console.log('[PWA v89.20] Skipping immediate registration.update() — inside /share-target flow');
        } else {
          registration.update().catch((error) => {
            console.warn('[PWA] Update check error:', error);
          });
        }
      } catch (_) {
        // fallback: إذا فشل الفحص، نُجري update() (سلوك آمن خارج share-target)
        registration.update().catch((error) => {
          console.warn('[PWA] Update check error:', error);
        });
      }

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
   *
   * ✅ v89.20 ROOT FIX #1: منع إطلاق حدث التحديث أثناء /share-target
   *   السبب الجذري:
   *     حتى لو حدث updatefound أثناء استقبال مشاركة (مثلاً من update دوري)،
   *     إطلاق yamshat:update-ready → AppUpdatePrompt يظهر → controllerchange
   *     → reload → فقدان الحمولة → صفحة بيضاء.
   *   الحل: نتخطى إطلاق الحدث بالكامل أثناء /share-target.
   */
  handleUpdateFound(registration) {
    const newWorker = registration.installing;
    if (!newWorker) return;

    // ✅ v89.20: منع معالجة التحديث أثناء /share-target
    let inShareTarget = false;
    try {
      const path = (window.location && window.location.pathname) || '';
      const hash = (window.location && window.location.hash) || '';
      inShareTarget = path === '/share-target'
        || path.startsWith('/share-target/')
        || hash.startsWith('#/share-target')
        || hash.includes('/share-target');
    } catch (_) { /* ignore */ }

    if (inShareTarget) {
      console.log('[PWA v89.20] updatefound ignored — inside /share-target flow');
      return;
    }

    // ✅ v89.48 ROOT FIX: منع معالجة التحديث أثناء صفحات المصادقة العامة
    //   السبب الجذري: إطلاق update-ready → AppUpdatePrompt يظهر فوق login → SKIP_WAITING
    //   → controllerchange → reload → المستخدم يعود إلى login → الدورة تتكرر بلا نهاية.
    //   الحل: لا نُطلق update-ready إلا بعد دخول المستخدم إلى التطبيق الفعلي.
    let onPublicAuthPage = false;
    try {
      const hash = (window.location && window.location.hash) || '';
      const hashPath = hash.replace(/^#/, '').split('?')[0] || '/';
      const PUBLIC_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/admin/login'];
      onPublicAuthPage = PUBLIC_ROUTES.some((r) => hashPath === r || hashPath.startsWith(r + '/'));
    } catch (_) { /* ignore */ }

    if (onPublicAuthPage) {
      console.log('[PWA v89.48] updatefound ignored — on public/auth page (breaks login reload loop)');
      return;
    }

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller && registration.waiting === newWorker) {
        // ✅ v89.20: تحقق إضافي أثناء statechange (المسار قد تغيّر)
        let stillInShareTarget = false;
        try {
          const p = (window.location && window.location.pathname) || '';
          const h = (window.location && window.location.hash) || '';
          stillInShareTarget = p === '/share-target'
            || p.startsWith('/share-target/')
            || h.startsWith('#/share-target')
            || h.includes('/share-target');
        } catch (_) { /* ignore */ }
        if (stillInShareTarget) {
          console.log('[PWA v89.20] update-ready suppressed — inside /share-target flow (statechange)');
          return;
        }

        // ✅ v89.48 ROOT FIX: تحقق من صفحة المصادقة أيضاً أثناء statechange
        let stillOnAuthPage = false;
        try {
          const h = (window.location && window.location.hash) || '';
          const hashPath = h.replace(/^#/, '').split('?')[0] || '/';
          const PUBLIC_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/admin/login'];
          stillOnAuthPage = PUBLIC_ROUTES.some((r) => hashPath === r || hashPath.startsWith(r + '/'));
        } catch (_) { /* ignore */ }
        if (stillOnAuthPage) {
          console.log('[PWA v89.48] update-ready suppressed — on public/auth page (statechange)');
          return;
        }

        // ✅ v89.41 ROOT FIX: تحقق من أن waiting.scriptURL != active.scriptURL
        // حتى لا نُطلق update-ready لنفس نسخة السكربت (تحديث وهمي).
        try {
          const waitingURL = registration.waiting?.scriptURL || newWorker.scriptURL || '';
          const activeURL = registration.active?.scriptURL || '';
          if (waitingURL && activeURL && waitingURL === activeURL) {
            console.log('[PWA v89.41] statechange installed لكن scriptURL مطابق — تحديث وهمي، تجاهل.');
            return;
          }
        } catch (_) { /* ignore */ }

        // A real update is waiting for explicit user approval.
        this.state.updateAvailable = true;
        console.log('[PWA v89.41] Update available — dispatching yamshat:update-ready (real, scriptURL differs)');
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
    //
    // ✅ v89.41 ROOT FIX: لا نُطلق الحدث إلا إذا وُجد waiting worker حقيقي
    // بـ scriptURL مختلف عن active. استدعاء هذه الدالة من مسار قديم بدون
    // تحقق كان يسبّب ظهور النافذة مع أي controllerchange أو broadcast رخو.
    try {
      const registration = this.state.swRegistration;
      const waitingURL = registration?.waiting?.scriptURL || newWorker?.scriptURL || '';
      const activeURL = registration?.active?.scriptURL || '';
      if (!waitingURL) {
        console.log('[PWA v89.41] showUpdatePrompt تجاهل — لا waiting worker.');
        return;
      }
      if (waitingURL && activeURL && waitingURL === activeURL) {
        console.log('[PWA v89.41] showUpdatePrompt تجاهل — scriptURL مطابق.');
        return;
      }
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
    //
    // ✅ v89.01 ROOT FIX #1 (تعارض تسجيل Service Worker — السبب الرئيسي للصفحة البيضاء):
    //   قبل هذا الإصلاح كان هذا المستمع + مستمع مماثل في main.jsx يستدعيان
    //   window.location.reload() عند أول تغيّر controller. وعندما يصل المستخدم
    //   إلى /share-target عبر meta-refresh، يُفعَّل SW جديد → controllerchange
    //   → reload لا نهائي → صفحة بيضاء. الحل: إلغاء reload تماماً من هذا المستمع،
    //   والاكتفاء بإطلاق حدث window ليعالجه من يحتاجه (invalidateQueries)،
    //   مع تخطي الإطلاق أثناء مسار /share-target حتى لا يتداخل مع استقبال المشاركة.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed');
        this.emit('controller-changed');

        // v89.01: أثناء استقبال المشاركة الخارجية لا نُطلق أي حدث قد يُسبّب reload/refetch
        try {
          const path = (window.location && window.location.pathname) || '';
          const hash = (window.location && window.location.hash) || '';
          const inShareTarget = path === '/share-target'
            || hash.startsWith('#/share-target')
            || hash.includes('/share-target');
          if (inShareTarget) {
            console.log('[PWA] controllerchange skipped inside /share-target flow');
            return;
          }
          // ✅ v89.48 ROOT FIX: تخطي حدث sw-controlling أثناء صفحة المصادقة
          //   حتّى لا يُطلق refresh للاستعلامات الحيّة ويدفع useSessionGuard إلى حلقة refresh.
          const hashPath = hash.replace(/^#/, '').split('?')[0] || '/';
          const PUBLIC_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/admin/login'];
          if (PUBLIC_ROUTES.some((r) => hashPath === r || hashPath.startsWith(r + '/'))) {
            console.log('[PWA v89.48] controllerchange sw-controlling skipped on public/auth page');
            return;
          }
        } catch (_) { /* ignore */ }

        // ✅ v88.94 ROOT FIX: عند تغير controller (أول مرة يسيطر SW على الصفحة)
        //   نُطلق حدث window يُبطل كاش React Query للبيانات الحيّة فقط.
        //   ⚠️ ممنوع منعاً باتاً استدعاء window.location.reload() هنا.
        try {
          window.dispatchEvent(new CustomEvent('yamshat:sw-controlling', {
            detail: { at: Date.now() },
          }));
        } catch (_) { /* ignore */ }
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        const data = event?.data || {};
        const { type } = data;
        if (type === 'SYNC_DATA') {
          console.log('[PWA] Sync data message received');
          this.emit('sync-data', data.data);
          return;
        }
        // ✅ v88.94 ROOT FIX #1: التقاط رسالة تفعيل SW الجديدة من public/sw.js:291
        //   (broadcastMessage({ type: 'yamshat:sw-activated', version: VERSION }))
        //   قبل هذا الإصلاح: الرسالة كانت تُرسل بلا مستمع (grep يعيد صفر نتائج)
        //   بعده: نُطلق حدث window ليلتقطه main.jsx ويُبطل استعلامات الفيد الحيّ.
        if (type === 'yamshat:sw-activated') {
          console.log('[PWA] Service Worker activated:', data.version);
          this.emit('sw-activated', data);
          try {
            window.dispatchEvent(new CustomEvent('yamshat:sw-activated', {
              detail: { version: data.version, at: Date.now() },
            }));
          } catch (_) { /* ignore */ }
        }
      });
    }
  }

  /**
   * بدء فحص التحديثات
   *
   * ✅ v89.20 ROOT FIX #1: تخطي فحص التحديث الدوري أثناء /share-target
   *   نفس المنطق: لا نريد updatefound أثناء استقبال مشاركة.
   */
  startUpdateCheck() {
    // ⚠️ v89.41 ROOT FIX: تم تعطيل setInterval تماماً — لا يوجد فحص دوري.
    //   السبب الجذري لتكرار رسالة "تحديث متاح":
    //   فحص update() دورياً (كل ساعة + كل 5 دقائق من service-worker-manager) يجلب
    //   نسخة SW من الخادم، وإذا تغيّرت byte-واحد (حتى لو من أدوات build
    //   تضع timestamp) → updatefound → waiting worker → نافذة تحديث.
    //   الحل: نعتمد فقط على الفحص المدمج في المتصفح عند navigation + updateViaCache:'none'
    //   + فحص واحد فوري عند registerServiceWorker (مرة واحدة فقط لكل تشغيل تطبيق).
    //   AppUpdatePrompt + SHOWN/APPLIED signatures تضمن أن النافذة لا تظهر إلا مرة
    //   واحدة لكل نسخة حقيقية.
    console.log('[PWA v89.41] Periodic update check DISABLED — relying on browser navigation-triggered SW check only.');
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
