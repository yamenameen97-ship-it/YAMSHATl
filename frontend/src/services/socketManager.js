import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/config.js';
import { getAuthToken } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs } from '../utils/retry.js';

class SocketManager {
  constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      auth: this.buildAuthPayload(),
    });

    this.offlineQueue = this.readOfflineQueue();
    this.heartbeatInterval = null;
    this.setupRobustListeners();
  }

  get connected() {
    return Boolean(this.socket?.connected);
  }

  get id() {
    return this.socket?.id || '';
  }

  readOfflineQueue() {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('socket_offline_queue') || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  persistOfflineQueue() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('socket_offline_queue', JSON.stringify(this.offlineQueue));
    } catch {
      // ignore storage failures
    }
  }

  setupRobustListeners() {
    this.socket.on('connect', () => {
      logger.info('Socket connected', { id: this.socket.id });
      this.processOfflineQueue();
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected', { reason });
      this.stopHeartbeat();
      if (reason === 'io server disconnect') this.socket.connect();
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      const delay = getBackoffDelayMs(attempt, { baseDelayMs: 1000, maxDelayMs: 30000 });
      this.socket.io.opts.reconnectionDelay = delay;
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket.connected) {
        this.socket.emit('ping', { ts: Date.now() });
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  buildAuthPayload() {
    const token = getAuthToken();
    return token ? { token } : {};
  }

  syncAuth() {
    const authPayload = this.buildAuthPayload();
    this.socket.auth = authPayload;
    if (this.socket.io?.opts) {
      this.socket.io.opts.auth = authPayload;
    }
    return authPayload;
  }

  connect() {
    if (!getAuthToken()) return;
    this.syncAuth();
    if (!this.socket.connected) this.socket.connect();
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket.connected) this.socket.disconnect();
  }

  emit(eventName, payload = {}) {
    if (this.socket.connected) {
      this.socket.emit(eventName, payload);
    } else {
      this.offlineQueue.push({ eventName, payload, ts: Date.now() });
      if (this.offlineQueue.length > 100) this.offlineQueue.shift(); // Limit queue size
      this.persistOfflineQueue();
    }
  }

  processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    logger.info(`Processing ${this.offlineQueue.length} offline messages`);
    this.offlineQueue.forEach(item => {
      this.socket.emit(item.eventName, item.payload);
    });
    this.offlineQueue = [];
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('socket_offline_queue');
      } catch {
        // ignore storage failures
      }
    }
  }

  on(event, handler) {
    this.socket.on(event, handler);
    return () => this.socket.off(event, handler);
  }

  off(event, handler) {
    this.socket.off(event, handler);
  }
}

const socketManager = new SocketManager();
export default socketManager;
