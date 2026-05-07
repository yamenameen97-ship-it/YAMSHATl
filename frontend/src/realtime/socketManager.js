import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/config.js';
import { getAuthToken } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs } from '../utils/retry.js';

const SOCKET_EVENT_LIMITS = {
  chat_typing: { throttleMs: 350 },
  send_comment: { throttleMs: 700 },
  send_heart: { throttleMs: 900 },
  follow_user: { throttleMs: 1200 },
  join_live: { throttleMs: 1000 },
  leave_live: { throttleMs: 1000 },
};


function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(normalized)
      : Buffer.from(normalized, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function fnv1aHash(input) {
  let hash = 0x811c9dc5;
  const value = String(input || '');
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function generateNonce() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

function buildEventEnvelope(eventName, payload, token) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const timestamp = Date.now();
  const nonce = generateNonce();
  const tokenJti = decodeJwtPayload(token)?.jti || '';
  const signature = fnv1aHash(`${eventName}|${nonce}|${timestamp}|${tokenJti}`);
  return {
    ...payload,
    _ts: timestamp,
    _nonce: nonce,
    _sig: signature,
  };
}

class SocketManager {
  constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.25,
      timeout: 12_000,
      auth: (cb) => cb(this.buildAuthPayload()),
    });

    this.listenerStats = new Map();
    this.emitState = new Map();
    this.idleTimer = null;
    this.activityCount = 0;
    this.boundOnline = () => {
      this.socket.io.opts.reconnectionAttempts = 8;
      if (!this.socket.connected) this.connect();
    };
    this.boundOffline = () => {
      if (this.socket.connected) this.socket.disconnect();
    };
    this.boundVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') {
        this.armIdleDisconnect();
      } else {
        this.clearIdleDisconnect();
        if (!this.socket.connected) this.connect();
      }
    };

    this.socket.io.on('reconnect_attempt', (attempt) => {
      const retryAttempt = Math.max(0, Number(attempt || 1) - 1);
      const delay = getBackoffDelayMs(retryAttempt, {
        baseDelayMs: 1_000,
        maxDelayMs: 30_000,
        jitterRatio: 0.4,
      });
      this.socket.io.opts.reconnectionDelay = delay;
      logger.info('socket reconnect attempt scheduled', { attempt, delay });
    });

    this.socket.on('connect', () => {
      this.clearIdleDisconnect();
      logger.info('socket connected', { id: this.socket.id });
      this.trackDiagnostics('connect');
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('socket disconnected', { reason });
      this.armIdleDisconnect();
    });

    this.socket.on('connect_error', (error) => {
      logger.warn('socket connection error', { message: error?.message || 'unknown socket error' });
    });

    this.socket.on('auth_expired', () => {
      logger.warn('socket auth expired');
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.boundOnline);
      window.addEventListener('offline', this.boundOffline);
      document.addEventListener('visibilitychange', this.boundVisibility);
    }
  }

  buildAuthPayload() {
    const token = getAuthToken();
    return token ? { token } : {};
  }

  syncAuth() {
    this.socket.auth = this.buildAuthPayload();
    if (this.socket.connected) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  connect() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return this.socket;
    if (!getAuthToken()) return this.socket;
    this.socket.auth = this.buildAuthPayload();
    if (!this.socket.connected) this.socket.connect();
    return this.socket;
  }

  disconnect() {
    this.clearIdleDisconnect();
    if (this.socket.connected) this.socket.disconnect();
  }

  armIdleDisconnect() {
    if (typeof document === 'undefined' || document.visibilityState !== 'hidden') return;
    this.clearIdleDisconnect();
    this.idleTimer = window.setTimeout(() => {
      if (document.visibilityState === 'hidden' && this.socket.connected) {
        logger.info('socket idle disconnect triggered');
        this.socket.disconnect();
      }
    }, 120_000);
  }

  clearIdleDisconnect() {
    if (this.idleTimer) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  on(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return () => {};
    this.socket.off(eventName, handler);
    this.socket.on(eventName, handler);
    const nextCount = Number(this.listenerStats.get(eventName) || 0) + 1;
    this.listenerStats.set(eventName, nextCount);
    this.trackDiagnostics(eventName);
    return () => this.off(eventName, handler);
  }

  once(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return () => {};
    this.socket.once(eventName, handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    if (!eventName) return;
    if (handler) this.socket.off(eventName, handler);
    else this.socket.off(eventName);
    const current = Number(this.listenerStats.get(eventName) || 0);
    this.listenerStats.set(eventName, Math.max(0, current - 1));
  }

  emit(eventName, payload = {}, options = {}) {
    if (eventName === 'register_user') return true;
    const token = getAuthToken();
    this.connect();
    const normalizedPayload = payload && typeof payload === 'object'
      ? Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'token'))
      : payload;
    const securedPayload = buildEventEnvelope(eventName, normalizedPayload, token);
    const limit = SOCKET_EVENT_LIMITS[eventName] || {};
    const throttleMs = Number(options.throttleMs ?? limit.throttleMs ?? 0);
    const throttleKey = String(options.throttleKey || `${eventName}:${JSON.stringify(securedPayload || {})}`);

    if (throttleMs > 0) {
      const state = this.emitState.get(throttleKey) || { lastAt: 0 };
      const now = Date.now();
      if (now - Number(state.lastAt || 0) < throttleMs) {
        return false;
      }
      this.emitState.set(throttleKey, { lastAt: now });
    }

    this.socket.emit(eventName, securedPayload, options.ack);
    this.activityCount += 1;
    return true;
  }

  emitWithAck(eventName, payload = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Socket acknowledgment timeout')), Number(options.timeoutMs || 8_000));
      const sent = this.emit(eventName, payload, {
        ...options,
        ack: (response) => {
          window.clearTimeout(timeout);
          resolve(response);
        },
      });
      if (!sent) {
        window.clearTimeout(timeout);
        reject(new Error('Socket event throttled'));
      }
    });
  }

  isConnected() {
    return Boolean(this.socket.connected);
  }

  get id() {
    return this.socket.id || '';
  }

  get connected() {
    return this.socket.connected;
  }

  trackDiagnostics(eventName) {
    const totalListeners = Array.from(this.listenerStats.values()).reduce((sum, value) => sum + Number(value || 0), 0);
    if (totalListeners > 30) {
      logger.warn('socket listener count is high', { eventName, totalListeners });
    }
  }
}

const socketManager = new SocketManager();

export default socketManager;
