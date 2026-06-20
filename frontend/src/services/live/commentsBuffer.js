import logger from '../../utils/logger.js';

class LiveCommentsBuffer {
  constructor({ flushIntervalMs = 350, maxBatchSize = 25, maxItems = 500 } = {}) {
    this.flushIntervalMs = flushIntervalMs;
    this.maxBatchSize = maxBatchSize;
    this.maxItems = maxItems;
    this.items = [];
    this.listeners = new Set();
    this.timer = null;
    this.lastFlushAt = 0;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  push(comment) {
    if (!comment) return;
    this.items.push({
      ...comment,
      _bufferedAt: Date.now(),
    });
    if (this.items.length > this.maxItems) {
      this.items.splice(0, this.items.length - this.maxItems);
    }
    this.scheduleFlush();
  }

  pushMany(comments = []) {
    comments.forEach((comment) => this.push(comment));
  }

  scheduleFlush() {
    if (this.timer) return;
    this.timer = setTimeout(() => this.flush(), this.flushIntervalMs);
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.items.length) return [];

    const batch = this.items.splice(0, this.maxBatchSize);
    this.lastFlushAt = Date.now();

    this.listeners.forEach((listener) => {
      try {
        listener(batch, {
          remaining: this.items.length,
          lastFlushAt: this.lastFlushAt,
        });
      } catch (error) {
        logger.warn('Live comments buffer listener failed', { message: error?.message });
      }
    });

    if (this.items.length) {
      this.scheduleFlush();
    }

    return batch;
  }

  clear() {
    this.items = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const liveCommentsBuffer = new LiveCommentsBuffer();
export default liveCommentsBuffer;
