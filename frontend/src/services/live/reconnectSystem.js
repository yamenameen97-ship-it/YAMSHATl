import livekitService from '../livekitService';
import logger from '../../utils/logger';

const STORAGE_KEY = 'live_session_recovery';
const MAX_RECOVERY_WINDOW_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

class ReconnectSystem {
  constructor() {
    this.isRecovering = false;
    this.recoveryData = null;
    this.listenersAttached = false;
    this.activeRoom = null;
    this.callbacks = {};
    this.recoveryTimer = null;
    this.attachBrowserListeners();
  }

  attachBrowserListeners() {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;
    window.addEventListener('online', () => {
      if (this.recoveryData) {
        this.scheduleRecovery('browser_online', 600);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.recoveryData?.roomId) {
        this.scheduleRecovery('tab_visible', 400);
      }
    });
  }

  saveSession(data = {}) {
    this.recoveryData = {
      reconnectAttempts: 0,
      ...data,
      timestamp: Date.now(),
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recoveryData));
    }
  }

  readSession() {
    if (this.recoveryData) return this.recoveryData;
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      this.recoveryData = raw ? JSON.parse(raw) : null;
      return this.recoveryData;
    } catch {
      return null;
    }
  }

  clearSession() {
    this.recoveryData = null;
    this.activeRoom = null;
    this.callbacks = {};
    if (this.recoveryTimer) {
      window.clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  attachRoom(room, session = {}, callbacks = {}) {
    if (!room?.on) return;
    this.activeRoom = room;
    this.callbacks = callbacks;
    this.saveSession(session);

    const stateEvent = session.roomEvent?.ConnectionStateChanged;
    const reconnectingEvent = session.roomEvent?.Reconnecting;
    const reconnectedEvent = session.roomEvent?.Reconnected;
    const disconnectedEvent = session.roomEvent?.Disconnected;

    if (stateEvent) {
      room.on(stateEvent, (state) => {
        callbacks.onStateChange?.(state);
        if (String(state).toLowerCase() === 'disconnected') {
          this.handleDisconnect('room_disconnected');
        }
      });
    }
    if (reconnectingEvent) {
      room.on(reconnectingEvent, () => callbacks.onReconnecting?.());
    }
    if (reconnectedEvent) {
      room.on(reconnectedEvent, () => {
        this.isRecovering = false;
        if (this.recoveryData) {
          this.recoveryData.reconnectAttempts = 0;
          this.recoveryData.timestamp = Date.now();
        }
        callbacks.onRecovered?.();
      });
    }
    if (disconnectedEvent) {
      room.on(disconnectedEvent, () => this.handleDisconnect('room_disconnected'));
    }
  }

  scheduleRecovery(reason = 'scheduled', delayMs = 1000) {
    if (typeof window === 'undefined') return;
    if (this.recoveryTimer) window.clearTimeout(this.recoveryTimer);
    this.recoveryTimer = window.setTimeout(() => {
      this.handleDisconnect(reason).catch(() => {});
    }, delayMs);
  }

  async handleDisconnect(reason = 'disconnect') {
    logger.warn('Live stream disconnected', { reason });
    const savedSession = this.readSession();
    if (!savedSession) return false;
    if (Date.now() - Number(savedSession.timestamp || 0) > MAX_RECOVERY_WINDOW_MS) {
      this.clearSession();
      return false;
    }
    if (this.isRecovering) return false;
    return this.recoverStream(savedSession, reason);
  }

  async recoverStream(session, reason = 'disconnect') {
    if (!session) return false;
    this.isRecovering = true;
    const attempts = Number(session.reconnectAttempts || 0);
    if (attempts >= MAX_ATTEMPTS) {
      this.callbacks.onRecoveryFailed?.('max_attempts_reached');
      this.isRecovering = false;
      return false;
    }

    const nextAttempts = attempts + 1;
    session.reconnectAttempts = nextAttempts;
    session.timestamp = Date.now();
    this.saveSession(session);

    const delay = Math.min(8000, 700 * 2 ** (nextAttempts - 1)) + Math.floor(Math.random() * 500);
    logger.info('Attempting stream recovery', { roomId: session.roomId, attempt: nextAttempts, reason, delay });
    this.callbacks.onRecoveryAttempt?.({ attempt: nextAttempts, delay, reason });

    await new Promise((resolve) => window.setTimeout(resolve, delay));

    try {
      const reconnect = session.reconnect;
      const result = typeof reconnect === 'function'
        ? await reconnect(session)
        : await livekitService.connect(session.serverUrl, session.token, session.roomName, session.userName);

      if (result?.success !== false) {
        this.isRecovering = false;
        session.reconnectAttempts = 0;
        this.saveSession(session);
        this.callbacks.onRecovered?.();
        return true;
      }
    } catch (error) {
      logger.error('Stream recovery failed', { error: error?.message || error, roomId: session.roomId });
    }

    this.isRecovering = false;
    this.callbacks.onRecoveryNeeded?.();
    return false;
  }
}

export const reconnectSystem = new ReconnectSystem();
export default reconnectSystem;
