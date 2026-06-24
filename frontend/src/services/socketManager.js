import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/config.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs } from '../utils/retry.js';
import {
  buildQueuedEnvelope,
  loadOutbox,
  mergeQueuedEnvelopes,
  persistOutbox,
  removeQueuedEnvelope,
} from '../features/chat/reliability.js';
import { pushDeadLetter, prioritizeQueuedActions } from '../features/chat/offlineQueueRuntime.js';

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

function isVolatileEvent(eventName = '') {
  return [
    'chat_typing',
    'typing_update',
    'presence_update',
    'ping',
    'pong',
    'join_chat',
    'leave_chat',
  ].includes(String(eventName || ''));
}

// v22: كشف الجوال لتفعيل polling fallback
const IS_MOBILE_UA = typeof navigator !== 'undefined' &&
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

class SocketManager {
  constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      // v22: على الجوال نبدأ بـ polling لأن بعض شبكات 4G/الوايفاي تحجب WebSocket
      transports: IS_MOBILE_UA ? ['polling', 'websocket'] : ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      // v22: timeout أعلى على الجوال
      timeout: IS_MOBILE_UA ? 30000 : 20000,
      withCredentials: true,
      auth: this.buildAuthPayload(),
    });

    this.queueOwner = getCurrentUsername() || '';
    this.offlineQueue = loadOutbox(this.queueOwner);
    this.heartbeatInterval = null;
    this.queueReplayTimer = null;
    this.lastHeartbeatAt = 0;
    this.lastPongAt = 0;
    this.lastLatencyMs = null;
    this.eventDeduper = new Map();
    this.activeListeners = new Map();
    this.handleBrowserOnline = this.handleBrowserOnline.bind(this);
    this.handleBrowserOffline = this.handleBrowserOffline.bind(this);
    this.setupRobustListeners();
    this.setupBrowserListeners();
  }

  get connected() {
    return Boolean(this.socket?.connected);
  }

  get id() {
    return this.socket?.id || '';
  }

  getQueueOwner() {
    return getCurrentUsername() || this.queueOwner || 'guest';
  }

  rehydrateQueueForCurrentUser() {
    const nextOwner = this.getQueueOwner();
    if (nextOwner === this.queueOwner && Array.isArray(this.offlineQueue)) return;
    this.queueOwner = nextOwner;
    this.offlineQueue = loadOutbox(nextOwner);
    this.emitBrowserEvent('yamshat:socket-outbox', {
      owner: nextOwner,
      size: this.offlineQueue.length,
    });
  }

  persistOfflineQueue() {
    this.rehydrateQueueForCurrentUser();
    persistOutbox(this.queueOwner, this.offlineQueue);
    this.emitBrowserEvent('yamshat:socket-outbox', {
      owner: this.queueOwner,
      size: this.offlineQueue.length,
    });
  }

  scheduleQueueReplay(delayMs = 0) {
    if (this.queueReplayTimer) {
      clearTimeout(this.queueReplayTimer);
      this.queueReplayTimer = null;
    }
    if (!this.offlineQueue.length) return;
    const safeDelay = Math.max(0, Number(delayMs || 0));
    this.queueReplayTimer = setTimeout(() => {
      this.queueReplayTimer = null;
      this.processOfflineQueue();
    }, safeDelay);
  }

  emitBrowserEvent(name, detail = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  setupBrowserListeners() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', this.handleBrowserOnline);
    window.addEventListener('offline', this.handleBrowserOffline);
  }

  handleBrowserOnline() {
    this.emitBrowserEvent('yamshat:socket-state', {
      connected: this.connected,
      reconnecting: !this.connected,
      networkOnline: true,
      latencyMs: this.lastLatencyMs,
    });
    this.connect();
  }

  handleBrowserOffline() {
    this.stopHeartbeat();
    this.emitBrowserEvent('yamshat:socket-state', {
      connected: false,
      reconnecting: false,
      networkOnline: false,
      latencyMs: this.lastLatencyMs,
    });
  }

  setupRobustListeners() {
    this.socket.on('connect', () => {
      this.rehydrateQueueForCurrentUser();
      logger.info('Socket connected', { id: this.socket.id });
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: true,
        reconnecting: false,
        id: this.socket.id,
        latencyMs: this.lastLatencyMs,
        networkOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
      });
      this.processOfflineQueue();
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      // v59.7: أسباب طبيعية (transport close / ping timeout) لا نحتاج تسجيلها بـ warn
      //         حتى لا تغرق الكونسول عند تقلب الشبكة.
      const benignReasons = new Set([
        'transport close',
        'ping timeout',
        'transport error',
        'io client disconnect',
      ]);
      if (benignReasons.has(String(reason || ''))) {
        logger.info('Socket disconnected', { reason });
      } else {
        logger.warn('Socket disconnected', { reason });
      }
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: false,
        reconnecting: reason !== 'io client disconnect',
        reason,
        latencyMs: this.lastLatencyMs,
        networkOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
      });
      this.stopHeartbeat();
      if (reason === 'io server disconnect') this.socket.connect();
    });

    this.socket.on('connect_error', (error) => {
      // v59.7: خفيف الصوت — خطأ اتصال عادي أثناء تأرجح الشبكة
      logger.info('Socket connect error', { detail: error?.message });
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: false,
        reconnecting: true,
        error: error?.message || 'connect_error',
        latencyMs: this.lastLatencyMs,
      });
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      const delay = getBackoffDelayMs(attempt, { baseDelayMs: 1000, maxDelayMs: 30000 });
      this.socket.io.opts.reconnectionDelay = delay;
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: false,
        reconnecting: true,
        attempt,
        nextDelayMs: delay,
        latencyMs: this.lastLatencyMs,
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

    this.socket.on('pong', (payload = {}) => {
      this.lastPongAt = Date.now();
      const serverTs = Number(payload.server_ts || 0);
      this.lastLatencyMs = this.lastHeartbeatAt ? Math.max(Date.now() - this.lastHeartbeatAt, 0) : null;
      this.emitBrowserEvent('yamshat:socket-heartbeat', {
        latencyMs: this.lastLatencyMs,
        lastPongAt: this.lastPongAt,
        serverTs: Number.isFinite(serverTs) ? serverTs : null,
      });
      this.emitBrowserEvent('yamshat:socket-state', {
        connected: this.connected,
        reconnecting: false,
        id: this.id,
        latencyMs: this.lastLatencyMs,
      });
    });

    this.socket.on('auth_expired', (payload = {}) => {
      this.emitBrowserEvent('yamshat:toast', {
        type: 'error',
        title: 'انتهت الجلسة',
        description: payload.detail || 'سجّل الدخول مرة تانية.',
      });
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
    this.rehydrateQueueForCurrentUser();
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

  shouldQueue(eventName, options = {}) {
    if (typeof options?.queue === 'boolean') return options.queue;
    return !isVolatileEvent(eventName);
  }

  enqueue(eventName, payload = {}, options = {}) {
    if (!this.shouldQueue(eventName, options)) return null;
    this.rehydrateQueueForCurrentUser();
    const envelope = buildQueuedEnvelope(eventName, payload, {
      id: options?.id,
      maxAttempts: options?.maxAttempts || 5,
      volatile: false,
    });
    envelope.priority = options?.priority || payload?.priority || 'normal';
    this.offlineQueue = mergeQueuedEnvelopes(this.offlineQueue, envelope);
    this.persistOfflineQueue();
    this.scheduleQueueReplay(150);
    return envelope.id;
  }

  dispatchEnvelope(envelope) {
    if (!envelope?.eventName) return false;
    try {
      this.socket.emit(envelope.eventName, envelope.payload || {});
      return true;
    } catch (error) {
      logger.warn('socket emit failed, queueing retry', {
        event: envelope.eventName,
        detail: error?.message,
      });
      return false;
    }
  }

  processOfflineQueue() {
    if (!this.socket.connected || !this.offlineQueue.length) return;
    const now = Date.now();
    const queueSnapshot = prioritizeQueuedActions(this.offlineQueue);
    let nextReplayAt = 0;

    queueSnapshot.forEach((item) => {
      if (!item?.id) return;
      if (item.nextRetryAt && item.nextRetryAt > now) {
        nextReplayAt = nextReplayAt ? Math.min(nextReplayAt, item.nextRetryAt) : item.nextRetryAt;
        return;
      }

      const succeeded = this.dispatchEnvelope(item);
      if (succeeded) {
        this.offlineQueue = removeQueuedEnvelope(this.offlineQueue, item.id);
        this.persistOfflineQueue();
        this.emitBrowserEvent('yamshat:socket-queue-drained', {
          id: item.id,
          eventName: item.eventName,
        });
        return;
      }

      const nextAttempts = Number(item.attempts || 0) + 1;
      if (nextAttempts >= Number(item.maxAttempts || 5)) {
        this.offlineQueue = removeQueuedEnvelope(this.offlineQueue, item.id);
        this.persistOfflineQueue();
        const deadLetter = pushDeadLetter(this.queueOwner, {
          id: item.id,
          payload: item.payload,
          error: 'Socket queue exceeded max retry attempts',
          attempts: nextAttempts,
          type: item.eventName,
          priority: item.priority || 'normal',
        });
        this.emitBrowserEvent('yamshat:socket-dead-letter', deadLetter);
        return;
      }

      const delay = getBackoffDelayMs(nextAttempts, {
        baseDelayMs: 1000,
        maxDelayMs: 30000,
      });
      const retryAt = now + delay;
      nextReplayAt = nextReplayAt ? Math.min(nextReplayAt, retryAt) : retryAt;

      this.offlineQueue = mergeQueuedEnvelopes(this.offlineQueue, {
        ...item,
        attempts: nextAttempts,
        lastAttemptAt: now,
        nextRetryAt: retryAt,
      });
      this.persistOfflineQueue();
    });

    if (nextReplayAt > now) {
      this.scheduleQueueReplay(nextReplayAt - now + 50);
    }
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
    if (this.queueReplayTimer) {
      clearTimeout(this.queueReplayTimer);
      this.queueReplayTimer = null;
    }
    this.activeListeners.forEach((listeners, event) => {
      listeners.forEach((wrappedHandler) => this.socket.off(event, wrappedHandler));
    });
    this.activeListeners.clear();
    this.eventDeduper.clear();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleBrowserOnline);
      window.removeEventListener('offline', this.handleBrowserOffline);
    }
    if (this.socket.connected) this.socket.disconnect();
  }

  emit(eventName, payload = {}, options = {}) {
    const signedPayload = options?.skipSignature ? { ...(payload || {}) } : this.decoratePayload(eventName, payload);

    if (!this.socket.connected || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      return this.enqueue(eventName, signedPayload, options);
    }

    const succeeded = this.dispatchEnvelope({ eventName, payload: signedPayload });
    if (!succeeded && this.shouldQueue(eventName, options)) {
      return this.enqueue(eventName, signedPayload, options);
    }

    return null;
  }

  emitWithAck(eventName, payload = {}, options = {}) {
    const signedPayload = options?.skipSignature ? { ...(payload || {}) } : this.decoratePayload(eventName, payload);
    const timeout = Math.max(1000, Number(options?.timeoutMs || 8000));

    if (!this.socket.connected) {
      this.enqueue(eventName, signedPayload, { ...options, queue: true });
      return Promise.resolve({ queued: true });
    }

    return new Promise((resolve, reject) => {
      this.socket.timeout(timeout).emit(eventName, signedPayload, (error, response) => {
        if (error) {
          if (this.shouldQueue(eventName, options)) {
            this.enqueue(eventName, signedPayload, options);
          }
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  on(event, handler) {
    if (!this.activeListeners.has(event)) {
      this.activeListeners.set(event, new Map());
    }

    const listeners = this.activeListeners.get(event);
    if (listeners.has(handler)) {
      return () => this.off(event, handler);
    }

    const wrappedHandler = (data) => {
      const entityId = data?.id || data?.message_id || data?.client_id || data?._nonce || JSON.stringify(data || {});
      const eventId = `${event}:${entityId}`;
      const lastSeenAt = this.eventDeduper.get(eventId) || 0;
      const now = Date.now();
      if (now - lastSeenAt < 1200) return;

      this.eventDeduper.set(eventId, now);
      setTimeout(() => this.eventDeduper.delete(eventId), 1500);
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
