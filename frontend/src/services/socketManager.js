import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/config.js';
import { getAuthToken } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs } from '../utils/retry.js';

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(normalized)
      : Buffer.from(normalized, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function randomNonce() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function eventSignature(eventName, nonce, timestamp, tokenJti) {
  const value = `${eventName}|${nonce}|${timestamp}|${tokenJti}`;
  let hashed = 0x811c9dc5;
  for (const char of value) {
    hashed ^= char.charCodeAt(0);
    hashed = Math.imul(hashed, 0x01000193) >>> 0;
  }
  return hashed.toString(16).padStart(8, '0');
}

class SocketManager {
  constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      auth: this.buildAuthPayload(),
    });

    this.offlineQueue = this.readOfflineQueue();
    this.heartbeatInterval = null;
    this.lastHeartbeatAt = 0;
    this.lastPongAt = 0;
    this.lastLatencyMs = null;
    this.eventDeduper = new Set();
    this.activeListeners = new Map();
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

  emitBrowserEvent(name, detail = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  setupRobustListeners() {
    this.socket.on('connect', () => {
      logger.info('Socket connected', { id: this.socket.id });
      this.emitBrowserEvent('yamshat:socket-state', { connected: true, id: this.socket.id, latencyMs: this.lastLatencyMs });
      this.processOfflineQueue();
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected', { reason });
      this.emitBrowserEvent('yamshat:socket-state', { connected: false, reason, latencyMs: this.lastLatencyMs });
      this.stopHeartbeat();
      if (reason === 'io server disconnect') this.socket.connect();
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      const delay = getBackoffDelayMs(attempt, { baseDelayMs: 1000, maxDelayMs: 30000 });
      this.socket.io.opts.reconnectionDelay = delay;
      this.emitBrowserEvent('yamshat:socket-state', { connected: false, reconnecting: true, attempt, nextDelayMs: delay });
    });

    this.socket.io.on('reconnect', (attempt) => {
      this.emitBrowserEvent('yamshat:socket-state', { connected: true, reconnecting: false, attempt, latencyMs: this.lastLatencyMs });
    });

    this.socket.on('pong', (payload = {}) => {
      this.lastPongAt = Date.now();
      const serverTs = Number(payload.server_ts || 0);
      this.lastLatencyMs = this.lastHeartbeatAt ? Math.max(Date.now() - this.lastHeartbeatAt, 0) : null;
      this.emitBrowserEvent('yamshat:socket-heartbeat', {
        latencyMs: this.lastLatencyMs,
        lastPongAt: this.lastPongAt,
        serverTs: Number.isFinite(serverTs) ? serverTs : null,
      });
    });

    this.socket.on('auth_expired', (payload = {}) => {
      this.emitBrowserEvent('yamshat:toast', { type: 'error', title: 'انتهت الجلسة', description: payload.detail || 'سجّل الدخول مرة تانية.' });
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (!this.socket.connected) return;
      this.lastHeartbeatAt = Date.now();
      this.socket.emit('ping', this.decoratePayload('ping', { ts: this.lastHeartbeatAt }));
    }, 25000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
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

  decoratePayload(eventName, payload = {}) {
    const token = getAuthToken();
    const basePayload = { ...(payload || {}) };
    if (token && !basePayload.token) basePayload.token = token;

    const jwtPayload = decodeJwtPayload(token);
    const tokenJti = String(jwtPayload?.jti || '').trim();
    if (!tokenJti) return basePayload;

    const timestamp = Date.now();
    const nonce = randomNonce();
    return {
      ...basePayload,
      _ts: timestamp,
      _nonce: nonce,
      _sig: eventSignature(eventName, nonce, timestamp, tokenJti),
    };
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

  cleanup() {
    this.stopHeartbeat();
    this.activeListeners.forEach((listeners, event) => {
      listeners.forEach((wrappedHandler) => this.socket.off(event, wrappedHandler));
    });
    this.activeListeners.clear();
    this.eventDeduper.clear();
    if (this.socket.connected) this.socket.disconnect();
  }

  emit(eventName, payload = {}, options = {}) {
    const signedPayload = options?.skipSignature ? payload : this.decoratePayload(eventName, payload);
    if (this.socket.connected) {
      this.socket.emit(eventName, signedPayload);
    } else {
      this.offlineQueue.push({ eventName, payload: signedPayload, ts: Date.now() });
      if (this.offlineQueue.length > 100) this.offlineQueue.shift();
      this.persistOfflineQueue();
    }
  }

  processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    logger.info(`Processing ${this.offlineQueue.length} offline messages`);
    this.offlineQueue.forEach((item) => {
      this.socket.emit(item.eventName, item.payload || {});
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

  // Enhanced event subscription with deduplication
  on(event, handler) {
    if (!this.activeListeners.has(event)) {
      this.activeListeners.set(event, new Map());
    }

    const listeners = this.activeListeners.get(event);
    if (listeners.has(handler)) {
      return () => this.off(event, handler);
    }

    const wrappedHandler = (data) => {
      // Event Deduplication
      const eventId = `${event}-${JSON.stringify(data)}`;
      if (this.eventDeduper.has(eventId)) return;

      this.eventDeduper.add(eventId);
      setTimeout(() => this.eventDeduper.delete(eventId), 1000);

      handler(data);
    };

    listeners.set(handler, wrappedHandler);
    this.socket.on(event, wrappedHandler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const listeners = this.activeListeners.get(event);
    const wrappedHandler = listeners?.get(handler);
    if (wrappedHandler) {
      this.socket.off(event, wrappedHandler);
      listeners.delete(handler);
      if (listeners.size === 0) this.activeListeners.delete(event);
      return;
    }
    this.socket.off(event, handler);
  }
}

const socketManager = new SocketManager();
export default socketManager;
