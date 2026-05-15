import logger from '../utils/logger.js';
import { defaultRetryManager } from './retryManager.js';

/**
 * Offline Queue Manager
 * 
 * نظام متقدم لإدارة قائمة الانتظار بلا اتصال مع:
 * - Persistence في localStorage
 * - Conflict Resolution
 * - Priority Handling
 * - Status Tracking
 * - Automatic Sync
 */
export class OfflineQueueManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'yamshat:offline-queue';
    this.maxQueueSize = options.maxQueueSize || 1000;
    this.maxRetries = options.maxRetries || 5;
    this.retryManager = options.retryManager || defaultRetryManager;
    this.queue = [];
    this.conflicts = [];
    this.syncCallbacks = new Map();
    this.listeners = new Set();
    this.isSyncing = false;

    this.load();
  }

  /**
   * تحميل قائمة الانتظار من التخزين المحلي
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info('Loaded offline queue', { size: this.queue.length });
      }
    } catch (error) {
      logger.warn('Failed to load offline queue', { error: error?.message });
      this.queue = [];
    }
  }

  /**
   * حفظ قائمة الانتظار في التخزين المحلي
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      logger.warn('Failed to save offline queue', { error: error?.message });
    }
  }

  /**
   * إضافة عنصر إلى قائمة الانتظار
   */
  enqueue(item) {
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn('Offline queue is full', { size: this.queue.length });
      return null;
    }

    const queueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: item.type,
      payload: item.payload,
      priority: item.priority || 'normal',
      timestamp: Date.now(),
      retries: 0,
      maxRetries: item.maxRetries || this.maxRetries,
      status: 'pending',
      lastError: null,
      nextRetryAt: null,
      metadata: item.metadata || {},
    };

    // إدراج حسب الأولوية
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const insertIndex = this.queue.findIndex(
      item => priorityOrder[item.priority] > priorityOrder[queueItem.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }

    this.save();
    this.notifyListeners('enqueued', queueItem);

    return queueItem.id;
  }

  /**
   * إزالة عنصر من قائمة الانتظار
   */
  dequeue(itemId) {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index === -1) return null;

    const [removed] = this.queue.splice(index, 1);
    this.save();
    this.notifyListeners('dequeued', removed);

    return removed;
  }

  /**
   * تحديث عنصر في قائمة الانتظار
   */
  updateItem(itemId, updates) {
    const item = this.queue.find(i => i.id === itemId);
    if (!item) return null;

    Object.assign(item, updates);
    this.save();
    this.notifyListeners('updated', item);

    return item;
  }

  /**
   * تسجيل دالة مزامنة لنوع معين
   */
  registerSyncHandler(type, handler) {
    this.syncCallbacks.set(type, handler);
  }

  /**
   * مزامنة قائمة الانتظار مع الخادم
   */
  async sync(options = {}) {
    if (this.isSyncing) {
      logger.debug('Sync already in progress');
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    const { onProgress = () => {} } = options;

    const result = {
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      const itemsToSync = [...this.queue];

      for (const item of itemsToSync) {
        if (item.status === 'synced') continue;

        try {
          const handler = this.syncCallbacks.get(item.type);
          if (!handler) {
            logger.warn('No sync handler for type', { type: item.type });
            this.dequeue(item.id);
            result.failed++;
            continue;
          }

          onProgress({ current: result.synced + result.failed, total: itemsToSync.length });

          // تنفيذ مع إعادة محاولة
          const syncResult = await this.retryManager.execute(
            () => handler(item.payload, item),
            { itemId: item.id, type: item.type }
          );

          // معالجة التعارضات
          if (syncResult?.conflict) {
            this.conflicts.push({
              id: `conflict-${item.id}`,
              itemId: item.id,
              localData: item.payload,
              remoteData: syncResult.remoteData,
              conflictType: syncResult.conflictType,
            });
            this.updateItem(item.id, { status: 'conflict' });
            result.conflicts++;
          } else {
            this.dequeue(item.id);
            result.synced++;
          }
        } catch (error) {
          logger.warn('Sync item failed', {
            itemId: item.id,
            error: error?.message,
            attempt: item.retries + 1,
          });

          if (item.retries < item.maxRetries) {
            const delayMs = this.retryManager.calculateDelay(item.retries);
            this.updateItem(item.id, {
              retries: item.retries + 1,
              lastError: error?.message,
              nextRetryAt: Date.now() + delayMs,
            });
          } else {
            this.updateItem(item.id, {
              status: 'failed',
              lastError: error?.message,
            });
          }

          result.failed++;
          result.errors.push({
            itemId: item.id,
            error: error?.message,
          });
        }
      }

      this.notifyListeners('synced', result);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * حل التعارضات
   */
  async resolveConflict(conflictId, resolution) {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    const item = this.queue.find(i => i.id === conflict.itemId);
    if (!item) return null;

    try {
      if (resolution.action === 'keep_local') {
        // إعادة المحاولة مع البيانات المحلية
        this.updateItem(item.id, {
          retries: 0,
          status: 'pending',
          nextRetryAt: null,
        });
      } else if (resolution.action === 'keep_remote') {
        // حذف العنصر المحلي
        this.dequeue(item.id);
      } else if (resolution.action === 'merge') {
        // دمج البيانات
        this.updateItem(item.id, {
          payload: resolution.mergedData,
          retries: 0,
          status: 'pending',
          nextRetryAt: null,
        });
      }

      // إزالة التعارض
      this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
      this.notifyListeners('conflict_resolved', { conflictId, resolution });

      return item;
    } catch (error) {
      logger.error('Failed to resolve conflict', { error: error?.message });
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات قائمة الانتظار
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      syncing: this.queue.filter(i => i.status === 'syncing').length,
      failed: this.queue.filter(i => i.status === 'failed').length,
      conflicts: this.conflicts.length,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * مسح قائمة الانتظار
   */
  clear() {
    this.queue = [];
    this.conflicts = [];
    this.save();
    this.notifyListeners('cleared', null);
  }

  /**
   * الاستماع إلى تغييرات قائمة الانتظار
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * إخطار المستمعين
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener({ event, data, stats: this.getStats() });
      } catch (error) {
        logger.warn('Listener error', { error: error?.message });
      }
    });
  }
}

/**
 * مثيل عام من Offline Queue Manager
 */
export const defaultOfflineQueueManager = new OfflineQueueManager();
