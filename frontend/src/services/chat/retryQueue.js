import socketManager from '../socketManager.js';
import logger from '../../utils/logger.js';

class RetryQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('chat_retry_queue') || '[]');
    this.maxRetries = 5;
    this.retryInterval = 5000; // 5 seconds
    this.isProcessing = false;
  }

  addToQueue(message) {
    const queueItem = {
      id: message.id || Date.now().toString(),
      data: message,
      retries: 0,
      timestamp: Date.now()
    };
    
    this.queue.push(queueItem);
    this.saveQueue();
    this.processQueue();
  }

  saveQueue() {
    localStorage.setItem('chat_retry_queue', JSON.stringify(this.queue));
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    const itemsToProcess = [...this.queue];
    for (const item of itemsToProcess) {
      try {
        await this.sendMessage(item);
        // If successful, remove from queue
        this.queue = this.queue.filter(q => q.id !== item.id);
        this.saveQueue();
      } catch (error) {
        item.retries += 1;
        if (item.retries >= this.maxRetries) {
          logger.error(`Failed to send message after ${this.maxRetries} attempts`, item);
          this.queue = this.queue.filter(q => q.id !== item.id);
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
      if (!socketManager.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketManager.socket.emit('chat_message', item.data, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Send timeout')), 10000);
    });
  }
}

export const retryQueue = new RetryQueue();
export default retryQueue;
