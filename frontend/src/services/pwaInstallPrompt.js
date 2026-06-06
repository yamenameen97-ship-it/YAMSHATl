/**
 * خدمة تثبيت PWA المحسّنة
 * (PWA Install Prompt Service)
 * 
 * المميزات:
 * - دعم جميع المتصفحات (Chrome, Firefox, Safari, Edge, Mi Browser)
 * - عرض رسالة التثبيت تلقائياً عند فتح الصفحة
 * - دعم الأجهزة القديمة (Redmi, Honor, Galaxy A32)
 * - واجهة مستخدم سلسة وناعمة
 * - معالجة الأخطاء والحالات الخاصة
 */

export class PWAInstallPrompt {
  constructor(options = {}) {
    this.config = {
      autoShowDelay: 2000, // عرض الرسالة بعد 2 ثانية
      showAfterDismiss: 7 * 24 * 60 * 60 * 1000, // 7 أيام
      minInteractionTime: 5000, // 5 ثواني تفاعل قبل العرض
      enableDebug: false,
      ...options
    };

    this.state = {
      deferredPrompt: null,
      isInstalled: false,
      isInstalling: false,
      hasBeenDismissed: false,
      lastDismissTime: null,
      userInteractionTime: 0,
      isUserInteracting: false,
    };

    this.listeners = new Map();
    this.init();
  }

  /**
   * تهيئة الخدمة
   */
  init() {
    this.detectInstalledState();
    this.setupEventListeners();
    this.checkStoredState();
    this.setupInteractionTracking();
  }

  /**
   * كشف حالة التثبيت الحالية
   */
  detectInstalledState() {
    // كشف إذا كان التطبيق مثبتاً بالفعل
    if (window.navigator.standalone === true) {
      // iOS PWA
      this.state.isInstalled = true;
      this.log('PWA مثبت على iOS');
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
      // Android PWA
      this.state.isInstalled = true;
      this.log('PWA مثبت على Android');
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      this.state.isInstalled = true;
      this.log('PWA مثبت بوضع minimal-ui');
    }

    // كشف إذا كان التطبيق قيد التشغيل في متصفح
    if (document.referrer.includes('android-app://')) {
      this.state.isInstalled = true;
      this.log('PWA يعمل من تطبيق Android');
    }
  }

  /**
   * إعداد مستمعي الأحداث
   */
  setupEventListeners() {
    // حدث beforeinstallprompt (Chrome, Edge, Opera)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.state.deferredPrompt = e;
      this.log('beforeinstallprompt event captured');
      
      // عرض الرسالة تلقائياً بعد التأخير
      if (!this.state.isInstalled && !this.state.hasBeenDismissed) {
        setTimeout(() => this.showInstallPrompt(), this.config.autoShowDelay);
      }
    });

    // حدث appinstalled (Chrome, Edge, Opera)
    window.addEventListener('appinstalled', () => {
      this.state.isInstalled = true;
      this.state.deferredPrompt = null;
      this.log('PWA تم تثبيته بنجاح');
      this.emit('installed');
      this.clearStoredState();
    });

    // كشف تغيير حالة العرض
    window.matchMedia('(display-mode: standalone)').addListener((e) => {
      if (e.matches) {
        this.state.isInstalled = true;
        this.log('تم التبديل إلى وضع standalone');
      }
    });

    // كشف تغيير حالة العرض (minimal-ui)
    window.matchMedia('(display-mode: minimal-ui)').addListener((e) => {
      if (e.matches) {
        this.state.isInstalled = true;
        this.log('تم التبديل إلى وضع minimal-ui');
      }
    });
  }

  /**
   * إعداد تتبع التفاعل
   */
  setupInteractionTracking() {
    const events = ['touchstart', 'mousedown', 'click', 'scroll', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (!this.state.isUserInteracting) {
          this.state.isUserInteracting = true;
          this.state.userInteractionTime = Date.now();
        }
      }, { passive: true });
    });
  }

  /**
   * التحقق من حالة التخزين المحلي
   */
  checkStoredState() {
    try {
      const stored = localStorage.getItem('yamshat_pwa_state');
      if (stored) {
        const state = JSON.parse(stored);
        this.state.hasBeenDismissed = state.dismissed || false;
        this.state.lastDismissTime = state.lastDismissTime || null;

        // التحقق من انقضاء فترة الانتظار
        if (this.state.lastDismissTime) {
          const timeSinceDismiss = Date.now() - this.state.lastDismissTime;
          if (timeSinceDismiss > this.config.showAfterDismiss) {
            this.state.hasBeenDismissed = false;
            this.clearStoredState();
          }
        }
      }
    } catch (error) {
      this.log('خطأ في قراءة حالة التخزين:', error);
    }
  }

  /**
   * حفظ حالة التخزين المحلي
   */
  saveStoredState() {
    try {
      localStorage.setItem('yamshat_pwa_state', JSON.stringify({
        dismissed: this.state.hasBeenDismissed,
        lastDismissTime: this.state.lastDismissTime
      }));
    } catch (error) {
      this.log('خطأ في حفظ حالة التخزين:', error);
    }
  }

  /**
   * مسح حالة التخزين المحلي
   */
  clearStoredState() {
    try {
      localStorage.removeItem('yamshat_pwa_state');
    } catch (error) {
      this.log('خطأ في مسح حالة التخزين:', error);
    }
  }

  /**
   * عرض رسالة التثبيت
   */
  async showInstallPrompt() {
    if (this.state.isInstalled || this.state.isInstalling) {
      return;
    }

    // التحقق من وقت التفاعل
    if (this.state.isUserInteracting) {
      const interactionDuration = Date.now() - this.state.userInteractionTime;
      if (interactionDuration < this.config.minInteractionTime) {
        this.log('وقت التفاعل غير كافي، تأجيل العرض');
        return;
      }
    }

    // محاولة عرض الرسالة الأصلية
    if (this.state.deferredPrompt) {
      try {
        this.state.deferredPrompt.prompt();
        const { outcome } = await this.state.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          this.log('المستخدم قبل التثبيت');
          this.emit('install-accepted');
        } else {
          this.log('المستخدم رفض التثبيت');
          this.handleDismiss();
        }
        
        this.state.deferredPrompt = null;
      } catch (error) {
        this.log('خطأ في عرض رسالة التثبيت الأصلية:', error);
        // عرض رسالة مخصصة كبديل
        this.showCustomInstallPrompt();
      }
    } else {
      // عرض رسالة مخصصة للمتصفحات الأخرى
      this.showCustomInstallPrompt();
    }
  }

  /**
   * عرض رسالة تثبيت مخصصة
   */
  showCustomInstallPrompt() {
    this.log('عرض رسالة التثبيت المخصصة');
    this.emit('show-custom-prompt');
    
    // إنشاء عنصر الرسالة
    const prompt = this.createCustomPromptElement();
    document.body.appendChild(prompt);

    // إظهار الرسالة بتأثير سلس
    setTimeout(() => {
      prompt.classList.add('visible');
    }, 100);
  }

  /**
   * إنشاء عنصر الرسالة المخصصة
   */
  createCustomPromptElement() {
    const container = document.createElement('div');
    container.id = 'yamshat-install-prompt';
    container.className = 'pwa-install-prompt';
    container.dir = 'rtl';
    container.lang = 'ar';

    // الأنماط المضمنة
    const style = document.createElement('style');
    style.textContent = `
      #yamshat-install-prompt {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
        color: white;
        padding: 16px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideUp 0.3s ease-out forwards;
      }

      #yamshat-install-prompt.visible {
        transform: translateY(0);
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

      .pwa-install-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        max-width: 100%;
      }

      .pwa-install-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .pwa-install-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .pwa-install-description {
        font-size: 14px;
        opacity: 0.95;
        margin: 0;
      }

      .pwa-install-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .pwa-install-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pwa-install-btn-install {
        background: white;
        color: #7C3AED;
      }

      .pwa-install-btn-install:active {
        transform: scale(0.98);
        opacity: 0.9;
      }

      .pwa-install-btn-close {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        width: 36px;
        height: 36px;
        padding: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pwa-install-btn-close:active {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0.95);
      }

      @media (max-width: 480px) {
        #yamshat-install-prompt {
          padding: 12px;
        }

        .pwa-install-content {
          flex-direction: column;
          align-items: stretch;
        }

        .pwa-install-actions {
          width: 100%;
        }

        .pwa-install-btn {
          flex: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #yamshat-install-prompt,
        .pwa-install-btn {
          transition: none;
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);

    // محتوى الرسالة
    container.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-text">
          <h3 class="pwa-install-title">تثبيت يام شات</h3>
          <p class="pwa-install-description">احصل على تطبيق يام شات على جهازك للوصول السريع</p>
        </div>
        <div class="pwa-install-actions">
          <button class="pwa-install-btn pwa-install-btn-install" id="pwa-install-btn">
            تثبيت
          </button>
          <button class="pwa-install-btn pwa-install-btn-close" id="pwa-close-btn">
            ✕
          </button>
        </div>
      </div>
    `;

    // إضافة مستمعي الأحداث
    const installBtn = container.querySelector('#pwa-install-btn');
    const closeBtn = container.querySelector('#pwa-close-btn');

    installBtn.addEventListener('click', () => {
      this.handleInstallClick();
      container.remove();
    });

    closeBtn.addEventListener('click', () => {
      this.handleDismiss();
      container.classList.remove('visible');
      setTimeout(() => container.remove(), 300);
    });

    return container;
  }

  /**
   * معالجة نقر زر التثبيت
   */
  async handleInstallClick() {
    if (this.state.deferredPrompt) {
      this.state.isInstalling = true;
      try {
        this.state.deferredPrompt.prompt();
        const { outcome } = await this.state.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          this.log('تم تثبيت التطبيق بنجاح');
          this.emit('install-accepted');
        } else {
          this.log('تم إلغاء التثبيت من قبل المستخدم');
          this.handleDismiss();
        }
      } catch (error) {
        this.log('خطأ في التثبيت:', error);
        this.emit('install-error', error);
      } finally {
        this.state.isInstalling = false;
        this.state.deferredPrompt = null;
      }
    } else {
      // عرض تعليمات يدوية للمتصفحات الأخرى
      this.showManualInstallInstructions();
    }
  }

  /**
   * عرض تعليمات التثبيت اليدوية
   */
  showManualInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (userAgent.includes('chrome') || userAgent.includes('edge')) {
      instructions = 'انقر على قائمة المتصفح (⋮) ثم اختر "تثبيت التطبيق"';
    } else if (userAgent.includes('firefox')) {
      instructions = 'انقر على القائمة (☰) ثم اختر "تثبيت التطبيق"';
    } else if (userAgent.includes('safari')) {
      instructions = 'انقر على مشاركة ثم اختر "إضافة إلى الشاشة الرئيسية"';
    } else if (userAgent.includes('mi browser') || userAgent.includes('xiaomi')) {
      instructions = 'انقر على القائمة ثم اختر "إضافة إلى الشاشة الرئيسية"';
    } else {
      instructions = 'استخدم قائمة المتصفح لتثبيت التطبيق';
    }

    this.emit('show-manual-instructions', { instructions });
    alert(instructions);
  }

  /**
   * معالجة الرفض
   */
  handleDismiss() {
    this.state.hasBeenDismissed = true;
    this.state.lastDismissTime = Date.now();
    this.saveStoredState();
    this.log('تم رفض رسالة التثبيت');
    this.emit('dismissed');
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
        this.log(`خطأ في مستمع الحدث ${eventType}:`, error);
      }
    });
  }

  /**
   * تسجيل الرسائل
   */
  log(...args) {
    if (this.config.enableDebug) {
      console.log('[PWA Install]', ...args);
    }
  }

  /**
   * الحصول على حالة التثبيت
   */
  getState() {
    return {
      isInstalled: this.state.isInstalled,
      isInstalling: this.state.isInstalling,
      hasBeenDismissed: this.state.hasBeenDismissed,
      canPrompt: !this.state.isInstalled && this.state.deferredPrompt !== null
    };
  }

  /**
   * إعادة تعيين الحالة (لأغراض الاختبار)
   */
  resetState() {
    this.state.hasBeenDismissed = false;
    this.state.lastDismissTime = null;
    this.clearStoredState();
    this.log('تم إعادة تعيين الحالة');
  }
}

// إنشاء مثيل عام
export const pwaInstallPrompt = new PWAInstallPrompt({ enableDebug: false });
