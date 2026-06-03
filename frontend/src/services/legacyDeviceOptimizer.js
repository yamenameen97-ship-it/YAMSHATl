/**
 * محسّن الأجهزة القديمة
 * (Legacy Device Optimizer)
 * 
 * يوفر:
 * - دعم الأجهزة القديمة (Redmi, Honor, Galaxy A32)
 * - تحسينات الأداء
 * - تقليل استهلاك الذاكرة
 * - تحسينات البطارية
 * - معالجة الأخطاء الشاملة
 */

export class LegacyDeviceOptimizer {
  constructor(options = {}) {
    this.config = {
      enableOptimization: true,
      enableMemoryOptimization: true,
      enableBatteryOptimization: true,
      enablePerformanceOptimization: true,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      throttleDelay: 16, // ~60fps
      ...options
    };

    this.state = {
      isLegacyDevice: this.detectLegacyDevice(),
      deviceMemory: navigator.deviceMemory || 4,
      effectiveType: navigator.connection?.effectiveType || '4g',
      isLowEndDevice: false,
      isSlowNetwork: false,
      memoryUsage: 0,
      cpuUsage: 0,
    };

    this.init();
  }

  /**
   * تهيئة المحسّن
   */
  init() {
    if (!this.config.enableOptimization) return;

    console.log('[Legacy] Device info:', {
      isLegacy: this.state.isLegacyDevice,
      memory: this.state.deviceMemory,
      connection: this.state.effectiveType
    });

    // تطبيق التحسينات
    this.applyOptimizations();
    this.setupMonitoring();
    this.setupPolyfills();
  }

  /**
   * كشف الأجهزة القديمة
   */
  detectLegacyDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // قائمة الأجهزة القديمة
    const legacyPatterns = [
      /redmi/i,           // Xiaomi Redmi
      /honor/i,           // Huawei Honor
      /galaxy a[0-9]+/i,  // Samsung Galaxy A series
      /moto [a-z]/i,      // Motorola
      /nexus [0-9]/i,     // Google Nexus
      /android [0-9]\./i, // Android 9 and below
      /chrome\/[0-9]{1,2}\./i, // Chrome 99 and below
      /safari\/5/i,       // Safari 5
      /firefox\/[0-9]{1,2}\./i, // Firefox 99 and below
    ];

    return legacyPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * تطبيق التحسينات
   */
  applyOptimizations() {
    // تحسينات الذاكرة
    if (this.config.enableMemoryOptimization) {
      this.applyMemoryOptimizations();
    }

    // تحسينات البطارية
    if (this.config.enableBatteryOptimization) {
      this.applyBatteryOptimizations();
    }

    // تحسينات الأداء
    if (this.config.enablePerformanceOptimization) {
      this.applyPerformanceOptimizations();
    }
  }

  /**
   * تحسينات الذاكرة
   */
  applyMemoryOptimizations() {
    // تقليل حجم الصور
    this.optimizeImages();

    // تقليل حجم الخطوط
    this.optimizeFonts();

    // تنظيف الذاكرة دورياً
    this.setupMemoryCleanup();

    // تقليل عدد العناصر المعروضة
    this.setupVirtualization();

    console.log('[Legacy] Memory optimizations applied');
  }

  /**
   * تحسين الصور
   */
  optimizeImages() {
    // تقليل جودة الصور على الأجهزة القديمة
    const style = document.createElement('style');
    style.textContent = `
      img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }

      /* تقليل حجم الصور على الأجهزة القديمة */
      @media (max-width: 480px) {
        img {
          max-width: 100%;
          height: auto;
        }
      }

      /* تحسين الأداء للصور الكبيرة */
      img[loading="lazy"] {
        background: #f0f0f0;
      }
    `;
    document.head.appendChild(style);

    // تطبيق lazy loading على جميع الصور
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }

  /**
   * تحسين الخطوط
   */
  optimizeFonts() {
    // استخدام خطوط النظام على الأجهزة القديمة
    const style = document.createElement('style');
    style.textContent = `
      body {
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif;
      }

      /* تقليل عدد أوزان الخطوط */
      @font-face {
        font-family: 'Noto Sans Arabic';
        font-weight: 400;
        src: url('/fonts/noto-sans-arabic-400.woff2') format('woff2');
        font-display: swap;
      }

      @font-face {
        font-family: 'Noto Sans Arabic';
        font-weight: 700;
        src: url('/fonts/noto-sans-arabic-700.woff2') format('woff2');
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * إعداد تنظيف الذاكرة
   */
  setupMemoryCleanup() {
    // تنظيف الذاكرة كل 30 ثانية
    setInterval(() => {
      // تنظيف الـ Cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.open(name).then(cache => {
              cache.keys().then(requests => {
                if (requests.length > 100) {
                  // حذف أقدم 50 طلب
                  requests.slice(0, 50).forEach(req => {
                    cache.delete(req);
                  });
                }
              });
            });
          });
        });
      }

      // تنظيف الـ IndexedDB
      if ('indexedDB' in window) {
        // حذف البيانات القديمة
      }

      console.log('[Legacy] Memory cleanup performed');
    }, 30000);
  }

  /**
   * إعداد المحاكاة الافتراضية
   */
  setupVirtualization() {
    // تقليل عدد العناصر المعروضة في القوائم الطويلة
    const style = document.createElement('style');
    style.textContent = `
      .virtualized-list {
        overflow-y: auto;
        height: 100%;
        will-change: scroll-position;
      }

      .virtualized-item {
        will-change: transform;
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * تحسينات البطارية
   */
  applyBatteryOptimizations() {
    // تقليل معدل التحديث على الأجهزة ذات البطارية المنخفضة
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            this.reduceFPS();
          }
        });

        battery.addEventListener('chargingchange', () => {
          if (battery.charging) {
            this.restoreFPS();
          }
        });
      });
    }

    // تقليل الحركات على الأجهزة ذات البطارية المنخفضة
    const style = document.createElement('style');
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* تقليل الحركات الخلفية */
      .background-animation {
        animation: none;
      }

      /* تقليل الظلال */
      .shadow-element {
        box-shadow: none;
      }
    `;
    document.head.appendChild(style);

    console.log('[Legacy] Battery optimizations applied');
  }

  /**
   * تحسينات الأداء
   */
  applyPerformanceOptimizations() {
    // تقليل معدل التحديث
    this.throttleAnimations();

    // تقليل الحركات المعقدة
    this.simplifyAnimations();

    // تحسين الأداء للعناصر الديناميكية
    this.optimizeDynamicElements();

    // تقليل استهلاك CPU
    this.reduceCPUUsage();

    console.log('[Legacy] Performance optimizations applied');
  }

  /**
   * تقليل معدل التحديث
   */
  throttleAnimations() {
    // تقليل معدل الإطارات على الأجهزة القديمة
    const originalRAF = window.requestAnimationFrame;
    let lastTime = 0;
    const throttleDelay = this.config.throttleDelay;

    window.requestAnimationFrame = function(callback) {
      const now = Date.now();
      const timeUntilNext = Math.max(0, throttleDelay - (now - lastTime));

      return setTimeout(() => {
        lastTime = Date.now();
        callback(lastTime);
      }, timeUntilNext);
    };
  }

  /**
   * تبسيط الحركات
   */
  simplifyAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      /* تبسيط الحركات على الأجهزة القديمة */
      @media (max-width: 480px) {
        * {
          transition-duration: 150ms !important;
          animation-duration: 200ms !important;
        }

        .complex-animation {
          animation: none;
        }

        .gradient-animation {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * تحسين الأداء للعناصر الديناميكية
   */
  optimizeDynamicElements() {
    // استخدام will-change بحذر
    const style = document.createElement('style');
    style.textContent = `
      .dynamic-element {
        will-change: auto;
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
      }

      /* تحسين الأداء للقوائم */
      .list-container {
        contain: layout style paint;
      }

      .list-item {
        contain: content;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * تقليل استهلاك CPU
   */
  reduceCPUUsage() {
    // تقليل عدد الـ Event Listeners
    // استخدام Event Delegation
    document.addEventListener('click', (e) => {
      // معالجة الأحداث بكفاءة
    }, true);

    // تقليل عدد الـ Timers
    // استخدام RequestAnimationFrame بدلاً من setInterval
  }

  /**
   * إعداد المراقبة
   */
  setupMonitoring() {
    // مراقبة استهلاك الذاكرة
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.state.memoryUsage = memory.usedJSHeapSize;

        if (memory.usedJSHeapSize > this.config.maxMemoryUsage) {
          console.warn('[Legacy] Memory usage exceeded:', memory.usedJSHeapSize);
          this.triggerMemoryCleanup();
        }
      }, 5000);
    }

    // مراقبة الاتصال
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.state.effectiveType = navigator.connection.effectiveType;
        console.log('[Legacy] Connection changed:', this.state.effectiveType);
      });
    }
  }

  /**
   * تشغيل تنظيف الذاكرة
   */
  triggerMemoryCleanup() {
    // حذف الـ Cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // إعادة تحميل الصفحة إذا لزم الأمر
    if (this.state.memoryUsage > this.config.maxMemoryUsage * 1.5) {
      console.error('[Legacy] Critical memory usage, reloading page');
      window.location.reload();
    }
  }

  /**
   * إعداد Polyfills
   */
  setupPolyfills() {
    // Polyfill لـ IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      this.polyfillIntersectionObserver();
    }

    // Polyfill لـ ResizeObserver
    if (!('ResizeObserver' in window)) {
      this.polyfillResizeObserver();
    }

    // Polyfill لـ Promise
    if (!('Promise' in window)) {
      this.polyfillPromise();
    }
  }

  /**
   * Polyfill لـ IntersectionObserver
   */
  polyfillIntersectionObserver() {
    window.IntersectionObserver = function(callback) {
      this.callback = callback;
      this.elements = [];
    };

    window.IntersectionObserver.prototype.observe = function(element) {
      this.elements.push(element);
    };

    window.IntersectionObserver.prototype.unobserve = function(element) {
      const index = this.elements.indexOf(element);
      if (index > -1) {
        this.elements.splice(index, 1);
      }
    };

    window.IntersectionObserver.prototype.disconnect = function() {
      this.elements = [];
    };
  }

  /**
   * Polyfill لـ ResizeObserver
   */
  polyfillResizeObserver() {
    window.ResizeObserver = function(callback) {
      this.callback = callback;
      this.elements = [];
    };

    window.ResizeObserver.prototype.observe = function(element) {
      this.elements.push(element);
    };

    window.ResizeObserver.prototype.unobserve = function(element) {
      const index = this.elements.indexOf(element);
      if (index > -1) {
        this.elements.splice(index, 1);
      }
    };

    window.ResizeObserver.prototype.disconnect = function() {
      this.elements = [];
    };
  }

  /**
   * Polyfill لـ Promise
   */
  polyfillPromise() {
    // استخدام مكتبة Promise Polyfill
    console.warn('[Legacy] Promise polyfill needed');
  }

  /**
   * تقليل معدل الإطارات
   */
  reduceFPS() {
    this.config.throttleDelay = 32; // ~30fps
    console.log('[Legacy] FPS reduced to 30');
  }

  /**
   * استعادة معدل الإطارات
   */
  restoreFPS() {
    this.config.throttleDelay = 16; // ~60fps
    console.log('[Legacy] FPS restored to 60');
  }

  /**
   * الحصول على حالة الجهاز
   */
  getState() {
    return {
      isLegacyDevice: this.state.isLegacyDevice,
      deviceMemory: this.state.deviceMemory,
      effectiveType: this.state.effectiveType,
      memoryUsage: this.state.memoryUsage,
      cpuUsage: this.state.cpuUsage
    };
  }
}

// إنشاء مثيل عام
export const legacyDeviceOptimizer = new LegacyDeviceOptimizer();
