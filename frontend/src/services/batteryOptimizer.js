/**
 * خدمة تحسين استهلاك البطارية
 * توفر:
 * - إدارة الفيديوهات في الخلفية
 * - تحسين تحديثات Socket
 * - منع إعادة التصيير غير الضرورية
 * - مراقبة حالة البطارية
 */

export class BatteryOptimizer {
  constructor() {
    this.isLowBattery = false;
    this.batteryLevel = 100;
    this.isCharging = false;
    this.videoElements = new Set();
    this.socketUpdateIntervals = new Map();
    this.renderOptimizations = new Map();
    this.listeners = new Map();
    this.config = {
      lowBatteryThreshold: 20,
      criticalBatteryThreshold: 10,
      videoFrameRate: 30,
      socketUpdateInterval: 1000,
      enableBackgroundOptimization: true,
      enableVideoOptimization: true,
      enableSocketOptimization: true
    };

    this.initBatteryMonitoring();
  }

  /**
   * تهيئة مراقبة البطارية
   */
  initBatteryMonitoring() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        this.updateBatteryStatus(battery);

        battery.addEventListener('levelchange', () => {
          this.updateBatteryStatus(battery);
        });

        battery.addEventListener('chargingchange', () => {
          this.updateBatteryStatus(battery);
        });

        battery.addEventListener('chargingtimechange', () => {
          this.updateBatteryStatus(battery);
        });

        battery.addEventListener('dischargingtimechange', () => {
          this.updateBatteryStatus(battery);
        });
      });
    } else if ('getBatteryStatus' in navigator) {
      // Fallback للمتصفحات الأخرى
      navigator.getBatteryStatus().then(
        battery => {
          this.updateBatteryStatus(battery);
          battery.addEventListener('levelchange', () => {
            this.updateBatteryStatus(battery);
          });
        }
      );
    }
  }

  /**
   * تحديث حالة البطارية
   */
  updateBatteryStatus(battery) {
    this.batteryLevel = Math.round(battery.level * 100);
    this.isCharging = battery.charging;
    this.isLowBattery = this.batteryLevel <= this.config.lowBatteryThreshold;

    // تطبيق التحسينات بناءً على مستوى البطارية
    this.applyOptimizations();

    this.emit('batterychange', {
      level: this.batteryLevel,
      isCharging: this.isCharging,
      isLowBattery: this.isLowBattery
    });
  }

  /**
   * تطبيق التحسينات بناءً على مستوى البطارية
   */
  applyOptimizations() {
    if (this.isLowBattery) {
      this.optimizeForLowBattery();
    } else if (this.isCharging) {
      this.normalizeOptimizations();
    }
  }

  /**
   * تحسين الأداء للبطارية المنخفضة
   */
  optimizeForLowBattery() {
    // تقليل معدل الإطارات للفيديوهات
    this.videoElements.forEach(video => {
      this.reduceVideoFrameRate(video, 15);
    });

    // زيادة فترات تحديث Socket
    this.socketUpdateIntervals.forEach((interval, key) => {
      this.updateSocketInterval(key, interval * 2);
    });

    // تعطيل الرسوميات المعقدة
    this.disableComplexAnimations();

    this.emit('optimizationApplied', {
      level: 'low',
      reason: 'low_battery'
    });
  }

  /**
   * تطبيع التحسينات
   */
  normalizeOptimizations() {
    // استعادة معدل الإطارات الطبيعي
    this.videoElements.forEach(video => {
      this.reduceVideoFrameRate(video, this.config.videoFrameRate);
    });

    // استعادة فترات تحديث Socket الطبيعية
    this.socketUpdateIntervals.forEach((interval, key) => {
      this.updateSocketInterval(key, interval);
    });

    // إعادة تفعيل الرسوميات
    this.enableComplexAnimations();

    this.emit('optimizationNormalized', {
      level: 'normal',
      reason: 'charging'
    });
  }

  /**
   * تقليل معدل إطارات الفيديو
   */
  reduceVideoFrameRate(videoElement, frameRate) {
    if (!videoElement) return;

    const interval = 1000 / frameRate;
    let lastFrameTime = 0;

    const updateFrame = () => {
      const now = Date.now();
      if (now - lastFrameTime >= interval) {
        videoElement.style.opacity = videoElement.style.opacity === '0' ? '1' : '0';
        lastFrameTime = now;
      }
      requestAnimationFrame(updateFrame);
    };

    updateFrame();
  }

  /**
   * تحديث فترة تحديث Socket
   */
  updateSocketInterval(key, interval) {
    const currentInterval = this.socketUpdateIntervals.get(key);
    if (currentInterval === interval) return;

    this.socketUpdateIntervals.set(key, interval);
    this.emit('socketIntervalUpdated', { key, interval });
  }

  /**
   * تعطيل الرسوميات المعقدة
   */
  disableComplexAnimations() {
    document.documentElement.style.setProperty('--animation-duration', '0s');
    document.documentElement.style.setProperty('--transition-duration', '0s');
  }

  /**
   * إعادة تفعيل الرسوميات
   */
  enableComplexAnimations() {
    document.documentElement.style.setProperty('--animation-duration', 'auto');
    document.documentElement.style.setProperty('--transition-duration', 'auto');
  }

  /**
   * تسجيل عنصر فيديو
   */
  registerVideoElement(videoElement) {
    if (!videoElement) return;

    this.videoElements.add(videoElement);

    // تطبيق التحسينات الحالية
    if (this.isLowBattery) {
      this.reduceVideoFrameRate(videoElement, 15);
    }

    return () => {
      this.videoElements.delete(videoElement);
    };
  }

  /**
   * تسجيل تحديث Socket
   */
  registerSocketUpdate(key, interval = this.config.socketUpdateInterval) {
    this.socketUpdateIntervals.set(key, interval);

    // تطبيق التحسينات الحالية
    if (this.isLowBattery) {
      this.updateSocketInterval(key, interval * 2);
    }

    return () => {
      this.socketUpdateIntervals.delete(key);
    };
  }

  /**
   * منع إعادة التصيير غير الضرورية
   */
  shouldRender(componentKey, dependencies) {
    const lastRender = this.renderOptimizations.get(componentKey);

    if (!lastRender) {
      this.renderOptimizations.set(componentKey, {
        dependencies,
        timestamp: Date.now()
      });
      return true;
    }

    // التحقق من تغيير التبعيات
    const dependenciesChanged = !this.dependenciesEqual(lastRender.dependencies, dependencies);

    if (dependenciesChanged) {
      this.renderOptimizations.set(componentKey, {
        dependencies,
        timestamp: Date.now()
      });
      return true;
    }

    // تأخير إعادة التصيير إذا كانت البطارية منخفضة
    if (this.isLowBattery) {
      const timeSinceLastRender = Date.now() - lastRender.timestamp;
      if (timeSinceLastRender < 1000) {
        return false;
      }
    }

    return false;
  }

  /**
   * مقارنة التبعيات
   */
  dependenciesEqual(deps1, deps2) {
    if (!deps1 || !deps2) return deps1 === deps2;
    if (deps1.length !== deps2.length) return false;

    for (let i = 0; i < deps1.length; i++) {
      if (deps1[i] !== deps2[i]) return false;
    }

    return true;
  }

  /**
   * تسجيل مستمع
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
    callbacks.forEach(callback => callback(data));
  }

  /**
   * الحصول على حالة البطارية
   */
  getBatteryStatus() {
    return {
      level: this.batteryLevel,
      isCharging: this.isCharging,
      isLowBattery: this.isLowBattery,
      isCritical: this.batteryLevel <= this.config.criticalBatteryThreshold
    };
  }

  /**
   * تنظيف الخدمة
   */
  cleanup() {
    this.videoElements.clear();
    this.socketUpdateIntervals.clear();
    this.renderOptimizations.clear();
    this.listeners.clear();
  }
}

// إنشاء مثيل عام
export const batteryOptimizer = new BatteryOptimizer();
