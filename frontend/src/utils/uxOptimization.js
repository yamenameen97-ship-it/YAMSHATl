/**
 * تحسينات تجربة المستخدم (UX Refinement)
 * - تحسين الأداء
 * - تحسين الاستجابة
 * - تحسين الوصول (Accessibility)
 * - تحسين التفاعل
 */

/**
 * مدير الأداء والتحسينات
 */
export class PerformanceOptimizer {
  constructor() {
    this.metrics = {};
    this.observers = new Map();
  }

  /**
   * قياس الأداء
   */
  measurePerformance(label) {
    return {
      start: () => performance.mark(`${label}-start`),
      end: () => {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        this.metrics[label] = measure.duration;
        return measure.duration;
      }
    };
  }

  /**
   * الحصول على تقرير الأداء
   */
  getPerformanceReport() {
    return {
      metrics: this.metrics,
      totalTime: Object.values(this.metrics).reduce((a, b) => a + b, 0),
      averageTime: Object.values(this.metrics).length > 0
        ? Object.values(this.metrics).reduce((a, b) => a + b, 0) / Object.values(this.metrics).length
        : 0
    };
  }

  /**
   * مراقبة الأداء الحية (Real-time Monitoring)
   */
  observePerformance() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`⏱️ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      this.observers.set('performance', observer);
    }
  }

  /**
   * تنظيف المراقبين
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * مدير الحالة المحسّن
 */
export class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Set();
    this.history = [];
    this.maxHistorySize = 50;
  }

  /**
   * تعيين الحالة
   */
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // تسجيل التغيير في السجل
    this.history.push({
      timestamp: Date.now(),
      key,
      oldValue,
      newValue: value
    });

    // الحفاظ على حجم السجل
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // إخطار المستمعين
    this.notifyListeners();
  }

  /**
   * الحصول على الحالة
   */
  getState(key) {
    return key ? this.state[key] : this.state;
  }

  /**
   * الاستماع للتغييرات
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * إخطار المستمعين
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * الحصول على السجل
   */
  getHistory() {
    return this.history;
  }
}

/**
 * مدير التخزين المؤقت (Caching Manager)
 */
export class CacheManager {
  constructor(ttl = 5 * 60 * 1000) { // 5 دقائق افتراضياً
    this.cache = new Map();
    this.ttl = ttl;
    this.timers = new Map();
  }

  /**
   * تخزين البيانات
   */
  set(key, value, customTtl = null) {
    // مسح المؤقت السابق إن وجد
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });

    // تعيين مؤقت للحذف التلقائي
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, customTtl || this.ttl);

    this.timers.set(key, timer);
  }

  /**
   * الحصول على البيانات المخزنة
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // التحقق من انتهاء الصلاحية
    const age = Date.now() - item.timestamp;
    if (age > (this.ttl)) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * مسح الكاش
   */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * الحصول على إحصائيات الكاش
   */
  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp
      }))
    };
  }
}

/**
 * مدير التحميل والتأخير (Loading & Debouncing)
 */
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.debounceTimers = new Map();
  }

  /**
   * تعيين حالة التحميل
   */
  setLoading(key, isLoading) {
    this.loadingStates.set(key, isLoading);
  }

  /**
   * الحصول على حالة التحميل
   */
  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }

  /**
   * تأخير الدالة (Debounce)
   */
  debounce(key, func, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * تقليل عدد الاستدعاءات (Throttle)
   */
  throttle(func, delay = 300) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    };
  }

  /**
   * تنظيف المؤقتات
   */
  cleanup() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.loadingStates.clear();
  }
}

/**
 * مدير الوصول (Accessibility Manager)
 */
export class AccessibilityManager {
  /**
   * إضافة ARIA labels
   */
  static addAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
  }

  /**
   * إضافة ARIA roles
   */
  static addAriaRole(element, role) {
    element.setAttribute('role', role);
  }

  /**
   * تحسين التركيز (Focus Management)
   */
  static manageFocus(element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * إضافة معلومات مساعدة
   */
  static addHelpText(element, text) {
    const helpId = `help-${Math.random().toString(36).substr(2, 9)}`;
    const helpElement = document.createElement('span');
    helpElement.id = helpId;
    helpElement.className = 'sr-only'; // Screen reader only
    helpElement.textContent = text;
    element.parentNode.appendChild(helpElement);
    element.setAttribute('aria-describedby', helpId);
  }

  /**
   * إضافة لوحة مفاتيح الاختصارات
   */
  static setupKeyboardShortcuts(shortcuts) {
    document.addEventListener('keydown', (e) => {
      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.key.toLowerCase()}`;
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    });
  }
}

/**
 * مدير التنبيهات والإخطارات (Notification Manager)
 */
export class NotificationManager {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
  }

  /**
   * إضافة تنبيه
   */
  addNotification(message, type = 'info', duration = 3000) {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      timestamp: Date.now()
    };

    this.notifications.push(notification);

    // الحفاظ على الحد الأقصى للتنبيهات
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift();
    }

    // إزالة التنبيه تلقائياً
    if (duration > 0) {
      setTimeout(() => this.removeNotification(id), duration);
    }

    return id;
  }

  /**
   * إزالة تنبيه
   */
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  /**
   * الحصول على التنبيهات
   */
  getNotifications() {
    return this.notifications;
  }

  /**
   * مسح جميع التنبيهات
   */
  clearAll() {
    this.notifications = [];
  }
}

/**
 * مدير الرسوميات والحركات (Animation Manager)
 */
export class AnimationManager {
  /**
   * تأثير التلاشي (Fade In)
   */
  static fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in`;
    setTimeout(() => {
      element.style.opacity = '1';
    }, 10);
  }

  /**
   * تأثير التلاشي للخارج (Fade Out)
   */
  static fadeOut(element, duration = 300) {
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms ease-out`;
    element.style.opacity = '0';
  }

  /**
   * تأثير الانزلاق (Slide)
   */
  static slide(element, direction = 'left', duration = 300) {
    const translateValue = direction === 'left' ? '-100%' : '100%';
    element.style.transform = `translateX(${translateValue})`;
    element.style.transition = `transform ${duration}ms ease-in-out`;
    setTimeout(() => {
      element.style.transform = 'translateX(0)';
    }, 10);
  }

  /**
   * تأثير الارتجاج (Shake)
   */
  static shake(element, duration = 300) {
    const keyframes = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    element.style.animation = `shake ${duration}ms`;
    setTimeout(() => {
      element.style.animation = 'none';
    }, duration);
  }
}

/**
 * إنشاء مثيلات عامة
 */
export const performanceOptimizer = new PerformanceOptimizer();
export const stateManager = new StateManager();
export const cacheManager = new CacheManager();
export const loadingManager = new LoadingManager();
export const notificationManager = new NotificationManager();
