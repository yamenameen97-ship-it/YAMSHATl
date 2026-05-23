import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/config.js';
import { getAuthToken } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs } from '../utils/retry.js';

const HEARTBEAT_INTERVAL_MS = 25_000;
const HEARTBEAT_TIMEOUT_MS = 70_000;
const OFFLINE_QUEUE_LIMIT = 100;
const DEDUPE_TTL_MS = 1_000;

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
      withCredentials: true,
      auth: this.buildAuthPayload(),
    });

    this.offlineQueue = this.readOfflineQueue();
    this.heartbeatInterval = null;
    this.heartbeatWatchdog = null;
    this.lastHeartbeatAt = 0;
    this.lastPongAt = 0;
    this.lastLatencyMs = null;
    this.eventDeduper = new Map(); // signature -> timestamp
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
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {
      // ignore CustomEvent failures (older runtimes)
    }
  }

  setupRobustListeners() {
    this.socket.on('connect', () => {
      this.lastHeartbeatAt = Date.now();
      this.lastPongAt = Date.now();
      logger.info?.('Socket connected', { id: this.socket.id });
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: true,
        id: this.socket.id,
        latencyMs: this.lastLatencyMs,
      });
      this.processOfflineQueue();
      this.startHeartbeat();
    });

    this.socket.on('connect_error', (err) => {
      const message = String(err?.message || 'connect_error');
      logger.warn?.('Socket connect_error', { message });
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: false,
        error: message,
      });

      const normalized = message.toLowerCase();
      if (normalized.includes('auth') || normalized.includes('jwt') || normalized.includes('unauthorized') || normalized.includes('401')) {
        this.emitBrowserEvent('yamshat:auth-expired', { detail: message });
      }

      // Refresh auth in case the token rotated since module load.
      this.syncAuth();
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn?.('Socket disconnected', { reason });
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: false,
        reason,
        latencyMs: this.lastLatencyMs,
      });
      this.stopHeartbeat();
      // Some disconnect reasons require manual reconnect (e.g. server kicked us).
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Refresh auth before reconnect to attach any new access token.
        this.syncAuth();
        if (getAuthToken()) this.socket.connect();
      }
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      // Always re-attach the latest auth before each reconnect attempt.
      this.syncAuth();
      const delay = getBackoffDelayMs(attempt, { baseDelayMs: 1000, maxDelayMs: 30000 });
      this.socket.io.opts.reconnectionDelay = delay;
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: false,
        reconnecting: true,
        attempt,
        nextDelayMs: delay,
      });
    });

    this.socket.io.on('reconnect', (attempt) => {
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: true,
        reconnecting: false,
        attempt,
        latencyMs: this.lastLatencyMs,
      });
    });

    this.socket.io.on('reconnect_failed', () => {
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: false,
        reconnecting: false,
        failed: true,
      });
    });

    this.socket.on('pong', (payload = {}) => {
      this.lastPongAt = Date.now();
      const serverTs = Number(payload.server_ts || 0);
      this.lastLatencyMs = this.lastHeartbeatAt
        ? Math.max(Date.now() - this.lastHeartbeatAt, 0)
        : null;
      this.emitBrowserEvent('yamshat:socket-heartbeat', {
        latencyMs: this.lastLatencyMs,
        lastPongAt: this.lastPongAt,
        serverTs: Number.isFinite(serverTs) ? serverTs : null,
      });
    });

    this.socket.on('auth_expired', (payload = {}) => {
      this.emitBrowserEvent('yamshat:toast', {
        type: 'error',
        title: 'انتهت الجلسة',
        description: payload.detail || 'سجّل الدخول مرة تانية.',
      });
      this.emitBrowserEvent('yamshat:auth-expired', payload || {});
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (!this.socket.connected) return;
      this.lastHeartbeatAt = Date.now();
      this.socket.emit('ping', this.decoratePayload('ping', { ts: this.lastHeartbeatAt }));
    }, HEARTBEAT_INTERVAL_MS);

    // Watchdog: force a reconnect if no pong is received for too long.
    this.heartbeatWatchdog = setInterval(() => {
      if (!this.socket.connected) return;
      const referenceTs = this.lastPongAt || this.lastHeartbeatAt;
      if (!referenceTs) return;
      if (Date.now() - referenceTs > HEARTBEAT_TIMEOUT_MS) {
        logger.warn?.('Socket heartbeat timeout, forcing reconnect');
        try { this.socket.disconnect(); } catch { /* ignore */ }
        this.syncAuth();
        if (getAuthToken()) this.socket.connect();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatWatchdog) {
      clearInterval(this.heartbeatWatchdog);
      this.heartbeatWatchdog = null;
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
    if (this.socket.connected) return;
    this.socket.connect();
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
      if (this.offlineQueue.length > OFFLINE_QUEUE_LIMIT) this.offlineQueue.shift();
      this.persistOfflineQueue();
    }
  }

  processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    logger.info?.(`Processing ${this.offlineQueue.length} offline messages`);
    const drained = this.offlineQueue.slice();
    this.offlineQueue = [];
    drained.forEach((item) => {
      try {
        this.socket.emit(item.eventName, item.payload || {});
      } catch (err) {
        logger.warn?.('Offline event flush failed', err);
        this.offlineQueue.push(item);
      }
    });
    if (typeof window !== 'undefined') {
      try {
        if (this.offlineQueue.length === 0) {
          window.localStorage.removeItem('socket_offline_queue');
        } else {
          this.persistOfflineQueue();
        }
      } catch {
        // ignore storage failures
      }
    }
  }

  // Enhanced event subscription with deduplication.
  on(event, handler) {
    if (!this.activeListeners.has(event)) {
      this.activeListeners.set(event, new Map());
    }

    const listeners = this.activeListeners.get(event);
    if (listeners.has(handler)) {
      return () => this.off(event, handler);
    }

    const wrappedHandler = (data) => {
      // Best-effort event deduplication.
      try {
        const signature = data && typeof data === 'object' && (data.id || data._sig || data._nonce);
        if (signature) {
          const key = `${event}:${signature}`;
          const previous = this.eventDeduper.get(key);
          if (previous && Date.now() - previous < DEDUPE_TTL_MS) return;
          this.eventDeduper.set(key, Date.now());
          if (this.eventDeduper.size > 500) {
            // Prune the oldest entries.
            const keys = Array.from(this.eventDeduper.keys()).slice(0, 100);
            keys.forEach((k) => this.eventDeduper.delete(k));
          }
        }
      } catch {
        // ignore dedup failures
      }
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

if (typeof window !== 'undefined') {
  // Reconnect automatically when the tab regains focus / online state.
  window.addEventListener('online', () => {
    if (getAuthToken() && !socketManager.connected) {
      socketManager.connect();
    }
  });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getAuthToken() && !socketManager.connected) {
      socketManager.connect();
    }
  });
}

export default socketManager;
