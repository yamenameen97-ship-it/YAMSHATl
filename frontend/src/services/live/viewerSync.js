import logger from '../../utils/logger.js';

const STORAGE_KEY = 'yamshat_live_viewer_sync_queue';

class ViewerSyncService {
  constructor({ minIntervalMs = 2500 } = {}) {
    this.minIntervalMs = minIntervalMs;
    this.lastDispatchByRoom = new Map();
    this.queue = this.readQueue();
  }

  readQueue() {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  persist() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue.slice(-50)));
    } catch {
      // ignore storage failures
    }
  }

  shouldThrottle(roomId) {
    const lastTs = Number(this.lastDispatchByRoom.get(roomId) || 0);
    return Date.now() - lastTs < this.minIntervalMs;
  }

  markDispatched(roomId) {
    this.lastDispatchByRoom.set(roomId, Date.now());
  }

  enqueue(payload) {
    this.queue.push({ ...payload, queuedAt: Date.now() });
    this.queue = this.queue.slice(-50);
    this.persist();
  }

  async dispatch(dispatchFn, roomId, payload, { allowQueue = true } = {}) {
    if (!roomId || typeof dispatchFn !== 'function') return null;
    const request = { roomId, payload: { ...(payload || {}) } };

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (allowQueue) this.enqueue(request);
      return { queued: true, reason: 'offline' };
    }

    if (this.shouldThrottle(roomId)) {
      if (allowQueue) this.enqueue(request);
      return { queued: true, reason: 'throttled' };
    }

    this.markDispatched(roomId);
    return dispatchFn(roomId, payload);
  }

  async flush(dispatchFn) {
    if (typeof dispatchFn !== 'function' || !this.queue.length) return [];
    const queue = [...this.queue];
    this.queue = [];
    this.persist();

    const results = [];
    for (const item of queue) {
      try {
        if (this.shouldThrottle(item.roomId)) {
          this.enqueue(item);
          continue;
        }
        this.markDispatched(item.roomId);
        // eslint-disable-next-line no-await-in-loop
        const result = await dispatchFn(item.roomId, item.payload);
        results.push(result);
      } catch (error) {
        logger.warn('viewer sync flush failed', { roomId: item.roomId, error: String(error?.message || error) });
        this.enqueue(item);
      }
    }
    return results;
  }
}

export const viewerSyncService = new ViewerSyncService();
export default viewerSyncService;
