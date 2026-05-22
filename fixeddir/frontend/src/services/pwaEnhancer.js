/**
 * خدمة تحسين تجربة PWA
 * توفر:
 * - إدارة الحالة الأوفلاين
 * - تحسين تجربة التثبيت
 * - إشعارات الحالة
 * - مؤشرات إعادة المحاولة
 * - قائمة الرفع الأوفلاين
 * - مزامنة الحالة
 */

export class PWAEnhancer {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.syncStatus = 'idle';
    this.listeners = new Map();
    this.installPrompt = null;
    this.isInstalled = false;
    this.config = {
      enableOfflineQueue: true,
      enableSyncStatus: true,
      enableInstallPrompt: true,
      maxQueueSize: 100,
      syncInterval: 5000,
      retryAttempts: 3,
      retryDelay: 1000
    };

    this.initializeOnlineOfflineHandling();
    this.initializeInstallPrompt();
    this.initializeSync();
  }

  /**
   * تهيئة معالجة الحالة الأوفلاين/الأونلاين
   */
  initializeOnlineOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
  }

  /**
   * تهيئة مطالبة التثبيت
   */
  initializeInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.emit('installPromptReady', e);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      this.emit('appInstalled');
    });

    // التحقق من التثبيت الحالي
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  /**
   * تهيئة المزامنة
   */
  initializeSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('offline-sync').catch(err => {
          console.warn('Background sync not available:', err);
        });
      });
    }
  }

  /**
   * إضافة عملية إلى قائمة الانتظار الأوفلاين
   */
  queueOfflineAction(action, data) {
    if (this.offlineQueue.length >= this.config.maxQueueSize) {
      console.warn('Offline queue is full');
      return false;
    }

    const queueItem = {
      id: Math.random().toString(36),
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineQueue.push(queueItem);
    this.emit('queueUpdated', {
      queueSize: this.offlineQueue.length,
      item: queueItem
    });

    return true;
  }

  /**
   * معالجة قائمة الانتظار الأوفلاين
   */
  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    this.syncStatus = 'syncing';
    this.emit('syncStatusChanged', { status: 'syncing' });

    const failedItems = [];

    for (const item of this.offlineQueue) {
      try {
        await this.processQueueItem(item);
      } catch (error) {
        console.error('Error processing queue item:', error);
        failedItems.push(item);
      }
    }

    // إزالة العناصر المعالجة بنجاح
    this.offlineQueue = failedItems;

    this.syncStatus = this.offlineQueue.length === 0 ? 'synced' : 'partial';
    this.emit('syncStatusChanged', { 
      status: this.syncStatus,
      remainingItems: this.offlineQueue.length
    });
  }

  /**
   * معالجة عنصر من قائمة الانتظار
   */
  async processQueueItem(item) {
    const maxRetries = this.config.retryAttempts;

    while (item.retryCount < maxRetries) {
      try {
        // محاكاة معالجة العنصر
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.emit('queueItemProcessed', {
          itemId: item.id,
          action: item.action,
          success: true
        });

        return;
      } catch (error) {
        item.retryCount++;
        
        if (item.retryCount < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, item.retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to process queue item after ${maxRetries} attempts`);
  }

  /**
   * طلب التثبيت
   */
  async promptInstall() {
    if (!this.installPrompt) {
      console.warn('Install prompt is not available');
      return false;
    }

    try {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      this.emit('installPromptResult', { outcome });

      if (outcome === 'accepted') {
        this.isInstalled = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }

  /**
   * عرض شعار الأوفلاين
   */
  showOfflineBanner() {
    this.emit('showOfflineBanner', {
      message: 'أنت غير متصل بالإنترنت. سيتم حفظ التغييرات محلياً.',
      type: 'warning'
    });
  }

  /**
   * عرض مؤشر إعادة المحاولة
   */
  showRetryIndicator(itemId, attempt, maxAttempts) {
    this.emit('showRetryIndicator', {
      itemId,
      attempt,
      maxAttempts,
      message: `محاولة ${attempt} من ${maxAttempts}...`
    });
  }

  /**
   * الحصول على حالة الاتصال
   */
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      queueSize: this.offlineQueue.length,
      syncStatus: this.syncStatus,
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
export const pwaEnhancer = new PWAEnhancer();
