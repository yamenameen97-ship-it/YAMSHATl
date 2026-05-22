/**
 * مدير Socket محسّن
 * توفر:
 * - تجميع التحديثات (Batching)
 * - تقليل عدد الرسائل
 * - إدارة الاتصالات الفعّالة
 * - التعافي من الأخطاء
 */

import io from 'socket.io-client';
import { batteryOptimizer } from './batteryOptimizer';

export class OptimizedSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.socket = null;
    this.options = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      ...options
    };

    this.messageQueue = [];
    this.batchTimeout = null;
    this.batchInterval = 500; // ms
    this.listeners = new Map();
    this.eventHandlers = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.config = {
      enableBatching: true,
      enableCompression: true,
      enableDebouncing: true,
      maxBatchSize: 50,
      debounceDelay: 300
    };

    this.lastEventTime = new Map();
    this.debouncedEvents = new Map();
  }

  /**
   * الاتصال بـ Socket
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, this.options);

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Socket connected');
          this.emit('connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          this.isConnected = false;
          console.log('❌ Socket disconnected');
          this.emit('disconnected');
        });

        this.socket.on('error', (error) => {
          console.error('Socket error:', error);
          this.emit('error', error);
        });

        this.socket.on('reconnect_attempt', () => {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
          this.emit('reconnecting', { attempt: this.reconnectAttempts });
        });

        // تسجيل معالجات الأحداث
        this.registerEventHandlers();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * تسجيل معالجات الأحداث
   */
  registerEventHandlers() {
    // معالج عام للأحداث
    this.socket.onAny((eventName, ...args) => {
      this.handleEvent(eventName, args);
    });
  }

  /**
   * معالجة الحدث
   */
  handleEvent(eventName, args) {
    const callbacks = this.eventHandlers.get(eventName) || [];
    
    // تطبيق التصفية والتجميع
    if (this.config.enableDebouncing && this.shouldDebounce(eventName)) {
      this.debounceEvent(eventName, args, callbacks);
    } else {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }

    this.emit('event', { eventName, args });
  }

  /**
   * التحقق من الحاجة للتصفية
   */
  shouldDebounce(eventName) {
    const debouncedEvents = ['user:typing', 'scroll', 'mousemove', 'resize'];
    return debouncedEvents.includes(eventName);
  }

  /**
   * تصفية الحدث
   */
  debounceEvent(eventName, args, callbacks) {
    // إلغاء التصفية السابقة
    if (this.debouncedEvents.has(eventName)) {
      clearTimeout(this.debouncedEvents.get(eventName));
    }

    // تعيين تصفية جديدة
    const timeoutId = setTimeout(() => {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in debounced event handler for ${eventName}:`, error);
        }
      });
      this.debouncedEvents.delete(eventName);
    }, this.config.debounceDelay);

    this.debouncedEvents.set(eventName, timeoutId);
  }

  /**
   * الاستماع لحدث
   */
  on(eventName, callback) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(callback);

    return () => {
      const callbacks = this.eventHandlers.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * إرسال رسالة مع التجميع
   */
  emit(eventName, data) {
    if (!this.isConnected) {
      console.warn(`Socket not connected, queueing event: ${eventName}`);
      this.messageQueue.push({ eventName, data });
      return;
    }

    if (this.config.enableBatching) {
      this.queueMessage(eventName, data);
    } else {
      this.sendMessage(eventName, data);
    }
  }

  /**
   * إضافة رسالة إلى قائمة الانتظار
   */
  queueMessage(eventName, data) {
    this.messageQueue.push({ eventName, data });

    // إرسال إذا تجاوزنا حد التجميع
    if (this.messageQueue.length >= this.config.maxBatchSize) {
      this.flushQueue();
    } else if (!this.batchTimeout) {
      // إرسال بعد تأخير
      this.batchTimeout = setTimeout(() => {
        this.flushQueue();
      }, this.batchInterval);
    }
  }

  /**
   * إرسال قائمة الانتظار
   */
  flushQueue() {
    if (this.messageQueue.length === 0) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // ضغط الرسائل
    const compressedMessages = this.config.enableCompression 
      ? this.compressMessages(messages)
      : messages;

    // إرسال الرسائل
    if (compressedMessages.length === 1) {
      const msg = compressedMessages[0];
      this.sendMessage(msg.eventName, msg.data);
    } else {
      this.sendMessage('batch', { messages: compressedMessages });
    }
  }

  /**
   * ضغط الرسائل
   */
  compressMessages(messages) {
    const compressed = {};

    messages.forEach(msg => {
      if (!compressed[msg.eventName]) {
        compressed[msg.eventName] = [];
      }
      compressed[msg.eventName].push(msg.data);
    });

    return Object.entries(compressed).map(([eventName, dataArray]) => ({
      eventName,
      data: dataArray.length === 1 ? dataArray[0] : dataArray
    }));
  }

  /**
   * إرسال رسالة
   */
  sendMessage(eventName, data) {
    if (!this.isConnected || !this.socket) {
      console.warn(`Cannot send message, socket not connected: ${eventName}`);
      return;
    }

    try {
      this.socket.emit(eventName, data);
    } catch (error) {
      console.error(`Error sending message ${eventName}:`, error);
    }
  }

  /**
   * الاستماع لحدث مرة واحدة
   */
  once(eventName, callback) {
    const unsubscribe = this.on(eventName, (...args) => {
      callback(...args);
      unsubscribe();
    });

    return unsubscribe;
  }

  /**
   * إلغاء الاستماع
   */
  off(eventName, callback) {
    const callbacks = this.eventHandlers.get(eventName);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * الحصول على حالة الاتصال
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      queueLength: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }

  /**
   * قطع الاتصال
   */
  disconnect() {
    if (this.socket) {
      this.flushQueue();
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * تنظيف الخدمة
   */
  cleanup() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.debouncedEvents.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });

    this.messageQueue = [];
    this.eventHandlers.clear();
    this.listeners.clear();
    this.debouncedEvents.clear();

    this.disconnect();
  }
}

// إنشاء مثيل عام
let socketManager = null;

export const getSocketManager = (url, options) => {
  if (!socketManager) {
    socketManager = new OptimizedSocketManager(url, options);
  }
  return socketManager;
};

export const createSocketManager = (url, options) => {
  return new OptimizedSocketManager(url, options);
};
