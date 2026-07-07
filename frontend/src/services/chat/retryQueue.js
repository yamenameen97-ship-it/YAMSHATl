import socketManager from '../socketManager.js';
import logger from '../../utils/logger.js';

const STORAGE_KEY = 'chat_retry_queue';

class RetryQueue {
  constructor() {
    this.queue = this._loadFromStorage();
    this.maxRetries = 5;
    this.retryInterval = 5000; // 5 seconds
    this.isProcessing = false;
    this.bootstrapped = false;
    this._boundOnline = this.processQueue.bind(this);
    this._boundSocketConnect = this.processQueue.bind(this);

    // v83.7 FIX #1 — إعادة تشغيل الطابور تلقائياً عند:
    //   1) توفر الاتصال من ناحية المتصفح (browser online event).
    //   2) اتصال الـ socket (بعد فقد الشبكة أو إعادة تحميل الصفحة).
    // بلا هذا، الطابور المُخزَّن في localStorage يبقى راكداً للأبد بعد الفشل الأول.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._boundOnline);
      if (socketManager?.socket?.on) {
        try {
          socketManager.socket.on('connect', this._boundSocketConnect);
        } catch (err) {
          logger?.warn?.('retryQueue: could not attach to socket connect', { detail: err?.message });
        }
      }
      // محاولة أولى فور التحميل إن كان هناك عناصر متبقّية من جلسة سابقة
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1500);
      }
    }
    this.bootstrapped = true;
  }

  _loadFromStorage() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  addToQueue(message) {
    const queueItem = {
      id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: message,
      retries: 0,
      timestamp: Date.now(),
    };

    this.queue.push(queueItem);
    this.saveQueue();
    this.processQueue();
  }

  saveQueue() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      logger?.warn?.('retryQueue: persist failed', { detail: err?.message });
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    const itemsToProcess = [...this.queue];
    for (const item of itemsToProcess) {
      try {
        await this.sendMessage(item);
        // نجح الإرسال — أزل العنصر من الطابور
        this.queue = this.queue.filter((q) => q.id !== item.id);
        this.saveQueue();
      } catch (error) {
        item.retries += 1;
        if (item.retries >= this.maxRetries) {
          logger.error(`Failed to send message after ${this.maxRetries} attempts`, item);
          this.queue = this.queue.filter((q) => q.id !== item.id);
          this.saveQueue();
        } else {
          // حدّث retries داخل الطابور المخزَّن
          this.saveQueue();
        }
      }
    }

    this.isProcessing = false;

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.retryInterval);
    }
  }

  sendMessage(item) {
    return new Promise((resolve, reject) => {
      const sock = socketManager?.socket;
      if (!sock || !sock.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      let settled = false;
      const finish = (fn, arg) => {
        if (settled) return;
        settled = true;
        fn(arg);
      };

      sock.emit('chat_message', item.data, (response) => {
        if (response && response.success) {
          finish(resolve, response);
        } else {
          finish(reject, new Error(response?.error || 'Failed to send message'));
        }
      });

      // مهلة 10 ثواني
      setTimeout(() => finish(reject, new Error('Send timeout')), 10000);
    });
  }
}

export const retryQueue = new RetryQueue();
export default retryQueue;
