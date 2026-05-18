/**
 * Unified Socket Manager
 * 
 * Provides:
 * - Centralized Socket.io connection management
 * - Automatic reconnection
 * - Offline queue for messages
 * - Event deduplication
 * - Heartbeat monitoring
 * - Memory leak prevention
 */

import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/constants.js';
import { getAuthToken } from '../../infrastructure/auth/tokenManager.js';
import logger from '../utils/logger.js';

// ============================================
// Constants
// ============================================

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const OFFLINE_QUEUE_KEY = 'socket_offline_queue';
const MAX_OFFLINE_QUEUE_SIZE = 100;
const EVENT_DEDUP_TIMEOUT = 5000; // 5 seconds

// ============================================
// Socket Manager
// ============================================

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.offlineQueue = [];
    this.eventDeduper = new Map();
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = Infinity;
  }

  // ============================================
  // Connection Management
  // ============================================

  connect() {
    if (this.socket?.connected) {
      logger.warn('[Socket] Already connected');
      return;
    }

    try {
      const token = getAuthToken();

      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        autoConnect: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        timeout: 20000,
      });

      this.setupEventListeners();
      logger.info('[Socket] Connecting...');
    } catch (error) {
      logger.error('[Socket] Connection failed', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.clearHeartbeat();
      logger.info('[Socket] Disconnected');
    }
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  // ============================================
  // Event Listeners Setup
  // ============================================

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => this.handleConnect());
    this.socket.on('disconnect', () => this.handleDisconnect());
    this.socket.on('connect_error', (error) => this.handleConnectError(error));
    this.socket.on('error', (error) => this.handleError(error));

    // Heartbeat
    this.socket.on('pong', () => this.handlePong());
  }

  handleConnect() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    logger.info('[Socket] Connected', { socketId: this.socket.id });

    // Start heartbeat
    this.startHeartbeat();

    // Process offline queue
    this.processOfflineQueue();

    // Emit connect event to listeners
    this.emit('socket:connected', { socketId: this.socket.id });
  }

  handleDisconnect(reason) {
    this.isConnected = false;
    this.clearHeartbeat();
    logger.warn('[Socket] Disconnected', { reason });

    // Emit disconnect event to listeners
    this.emit('socket:disconnected', { reason });
  }

  handleConnectError(error) {
    this.reconnectAttempts++;
    logger.error('[Socket] Connection error', {
      error: error.message,
      attempt: this.reconnectAttempts,
    });

    this.emit('socket:error', { error });
  }

  handleError(error) {
    logger.error('[Socket] Error', error);
    this.emit('socket:error', { error });
  }

  handlePong() {
    logger.debug('[Socket] Pong received');
  }

  // ============================================
  // Heartbeat Management
  // ============================================

  startHeartbeat() {
    this.clearHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, HEARTBEAT_INTERVAL);

    logger.debug('[Socket] Heartbeat started');
  }

  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ============================================
  // Event Emission
  // ============================================

  emit(event, data) {
    if (!this.socket) {
      logger.warn(`[Socket] Cannot emit event "${event}" - not connected`);
      this.queueOfflineEvent(event, data);
      return;
    }

    if (!this.socket.connected) {
      logger.warn(`[Socket] Cannot emit event "${event}" - disconnected`);
      this.queueOfflineEvent(event, data);
      return;
    }

    // Check for duplicate events
    if (this.isDuplicateEvent(event, data)) {
      logger.debug(`[Socket] Duplicate event ignored: ${event}`);
      return;
    }

    try {
      this.socket.emit(event, data);
      logger.debug(`[Socket] Event emitted: ${event}`, data);
    } catch (error) {
      logger.error(`[Socket] Failed to emit event "${event}"`, error);
    }
  }

  isDuplicateEvent(event, data) {
    const key = `${event}:${JSON.stringify(data)}`;
    const lastEmit = this.eventDeduper.get(key);

    if (lastEmit && Date.now() - lastEmit < EVENT_DEDUP_TIMEOUT) {
      return true;
    }

    this.eventDeduper.set(key, Date.now());
    return false;
  }

  // ============================================
  // Event Listeners
  // ============================================

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);

    // Also register with socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }

    logger.debug(`[Socket] Listener registered for "${event}"`);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }

    logger.debug(`[Socket] Listener removed for "${event}"`);
  }

  once(event, callback) {
    const wrappedCallback = (...args) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };

    this.on(event, wrappedCallback);
  }

  // ============================================
  // Offline Queue Management
  // ============================================

  queueOfflineEvent(event, data) {
    if (this.offlineQueue.length >= MAX_OFFLINE_QUEUE_SIZE) {
      this.offlineQueue.shift(); // Remove oldest event
    }

    this.offlineQueue.push({ event, data, timestamp: Date.now() });
    this.persistOfflineQueue();

    logger.debug(`[Socket] Event queued for offline: ${event}`);
  }

  processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    logger.info(`[Socket] Processing ${this.offlineQueue.length} offline events`);

    while (this.offlineQueue.length > 0) {
      const { event, data } = this.offlineQueue.shift();
      this.emit(event, data);
    }

    this.persistOfflineQueue();
  }

  persistOfflineQueue() {
    try {
      window.localStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      logger.error('[Socket] Failed to persist offline queue', error);
    }
  }

  loadOfflineQueue() {
    try {
      const stored = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('[Socket] Failed to load offline queue', error);
    }
  }

  clearOfflineQueue() {
    this.offlineQueue = [];
    try {
      window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (error) {
      logger.error('[Socket] Failed to clear offline queue', error);
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      offlineQueueSize: this.offlineQueue.length,
      listenersCount: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
    };
  }

  cleanup() {
    this.disconnect();
    this.listeners.clear();
    this.eventDeduper.clear();
    this.clearOfflineQueue();
    logger.info('[Socket] Cleanup completed');
  }

  // ============================================
  // Memory Leak Prevention
  // ============================================

  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.removeAllListeners(event);
      }
    } else {
      this.listeners.clear();
      if (this.socket) {
        this.socket.removeAllListeners();
      }
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const socketManager = new SocketManager();

export default socketManager;
