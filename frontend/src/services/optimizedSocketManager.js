import socketManager from './socketManager.js';

/**
 * واجهة توافقية تمنع تعدد مديري الـ socket داخل المشروع.
 * أي استخدام قديم لـ optimizedSocketManager سيتم توجيهه إلى
 * الـ singleton المركزي socketManager بدل إنشاء اتصال جديد.
 */
class OptimizedSocketManagerFacade {
  constructor(url = '', options = {}) {
    this.url = url;
    this.options = options;
  }

  connect() {
    socketManager.connect();
    return Promise.resolve(socketManager);
  }

  disconnect() {
    socketManager.disconnect();
  }

  cleanup() {
    // no-op: لا ننظف الـ singleton المركزي من هنا حتى لا نكسر بقية الواجهة.
  }

  emit(eventName, payload = {}, options = {}) {
    return socketManager.emit(eventName, payload, options);
  }

  emitWithAck(eventName, payload = {}, options = {}) {
    return socketManager.emitWithAck(eventName, payload, options);
  }

  on(eventName, handler) {
    return socketManager.on(eventName, handler);
  }

  once(eventName, handler) {
    let unsubscribe = () => {};
    unsubscribe = socketManager.on(eventName, (payload) => {
      unsubscribe();
      handler?.(payload);
    });
    return unsubscribe;
  }

  off(eventName, handler) {
    socketManager.off(eventName, handler);
  }

  flushQueue() {
    socketManager.processOfflineQueue?.();
  }

  getStatus() {
    return {
      isConnected: socketManager.connected,
      socketId: socketManager.id,
      queueLength: Array.isArray(socketManager.offlineQueue) ? socketManager.offlineQueue.length : 0,
      latencyMs: socketManager.lastLatencyMs ?? null,
    };
  }
}

const defaultOptimizedSocketManager = new OptimizedSocketManagerFacade();

export class OptimizedSocketManager extends OptimizedSocketManagerFacade {}

export function getOptimizedSocketManager() {
  return defaultOptimizedSocketManager;
}

export function createOptimizedSocketManager() {
  return defaultOptimizedSocketManager;
}

export default defaultOptimizedSocketManager;
