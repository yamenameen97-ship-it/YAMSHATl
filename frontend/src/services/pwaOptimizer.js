/**
 * خدمة تحسين PWA
 * توفر:
 * - إدارة الحالة بلا اتصال (Offline State)
 * - قوائم إعادة المحاولة (Retry Queues)
 * - مؤشرات الحالة (Status Indicators)
 * - تحسين تجربة التثبيت
 */

export class PWAOptimizer {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.listeners = new Map();
    this.config = {
      enableOfflineMode: true,
      enableInstallPrompt: true,
      maxQueueSize: 100,
      retryAttempts: 3,
      retryDelay: 1000
    };
    this.installPrompt = null;
    this.isInstalled = false;

    this.initOnlineOfflineHandling();
    this.initInstallPrompt();
  }

  /**
   * تهيئة معالجة الاتصال والقطع
   */
  initOnlineOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });

    // مراقبة جودة الاتصال
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        const connection = navigator.connection;
        this.emit('connectionchange', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      });
    }
  }

  /**
   * تهيئة مطالبة التثبيت
   */
  initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.emit('installprompt');
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      this.emit('installed');
    });
  }

  /**
   * إضافة طلب إلى قائمة الانتظار بلا اتصال
   */
  queueRequest(request) {
    if (this.offlineQueue.length >= this.config.maxQueueSize) {
      console.warn('Offline queue is full, removing oldest request');
      this.offlineQueue.shift();
    }

    const queuedRequest = {
      id: Math.random().toString(36),
      ...request,
      timestamp: Date.now(),
      attempts: 0
    };

    this.offlineQueue.push(queuedRequest);
    this.emit('queueupdate', { size: this.offlineQueue.length });

    return queuedRequest.id;
  }

  /**
   * معالجة قائمة الانتظار بلا اتصال
   */
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} queued requests`);

    const requests = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of requests) {
      try {
        await this.retryRequest(request);
        this.emit('queuerequestsuccess', { requestId: request.id });
      } catch (error) {
        console.error(`Failed to process queued request ${request.id}:`, error);
        this.offlineQueue.push(request);
        this.emit('queuerequesterror', { requestId: request.id, error });
      }
    }

    this.emit('queueupdate', { size: this.offlineQueue.length });
  }

  /**
   * إعادة محاولة الطلب مع تأخير تدريجي
   */
  async retryRequest(request) {
    const { url, method = 'GET', body, attempts = 0 } = request;

    if (attempts >= this.config.retryAttempts) {
      throw new Error(`Max retry attempts reached for ${url}`);
    }

    try {
      const response = await fetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      const delay = this.config.retryDelay * Math.pow(2, attempts);
      await new Promise(resolve => setTimeout(resolve, delay));

      request.attempts = attempts + 1;
      return this.retryRequest(request);
    }
  }

  /**
   * عرض مطالبة التثبيت
   */
  async showInstallPrompt() {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.emit('installaccepted');
        return true;
      } else {
        this.emit('installdismissed');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * الحصول على حالة الاتصال
   */
  getConnectionStatus() {
    let connectionType = 'unknown';
    let effectiveType = 'unknown';
    let downlink = 0;
    let rtt = 0;
    let saveData = false;

    if ('connection' in navigator) {
      const connection = navigator.connection;
      connectionType = connection.type;
      effectiveType = connection.effectiveType;
      downlink = connection.downlink;
      rtt = connection.rtt;
      saveData = connection.saveData;
    }

    return {
      isOnline: this.isOnline,
      connectionType,
      effectiveType,
      downlink,
      rtt,
      saveData,
      queueSize: this.offlineQueue.length,
      isInstalled: this.isInstalled,
      canInstall: !!this.installPrompt
    };
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
   * تنظيف الخدمة
   */
  cleanup() {
    this.offlineQueue = [];
    this.listeners.clear();
  }
}

// إنشاء مثيل عام
export const pwaOptimizer = new PWAOptimizer();
