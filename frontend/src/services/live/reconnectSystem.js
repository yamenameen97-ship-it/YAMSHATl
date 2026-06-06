import livekitService from '../livekitService.js';
import logger from '../../utils/logger.js';

const STORAGE_KEY = 'yamshat_live_session_recovery';
const MAX_SESSION_AGE_MS = 15 * 60 * 1000;
const DEFAULT_BACKOFF = [0, 1200, 2500, 5000, 8000, 12000];

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ReconnectSystem {
  constructor() {
    this.isRecovering = false;
    this.recoveryPromise = null;
    this.recoveryData = null;
    this.listeners = new Set();
    this.onlineWaiters = new Set();
    this.recoveryAttempts = 0;
    this.handleBrowserOnline = this.handleBrowserOnline.bind(this);
    this.handleBrowserOffline = this.handleBrowserOffline.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleBrowserOnline);
      window.addEventListener('offline', this.handleBrowserOffline);
    }
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  emit(extra = {}) {
    const snapshot = { ...this.getState(), ...extra };
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        logger.warn('ReconnectSystem listener failed', { message: error?.message });
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamshat:live-recovery-state', { detail: snapshot }));
    }
  }

  getState() {
    return {
      isRecovering: this.isRecovering,
      recoveryAttempts: this.recoveryAttempts,
      recoveryData: this.recoveryData,
      hasSavedSession: Boolean(this.getSavedSession()),
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
    };
  }

  saveSession(data = {}) {
    const merged = {
      ...(this.getSavedSession() || {}),
      ...(this.recoveryData || {}),
      ...data,
      updatedAt: Date.now(),
      timestamp: data.timestamp || Date.now(),
      recoveryAttempts: 0,
    };
    this.recoveryData = merged;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    this.emit();
    return merged;
  }

  updateRecoveryPoint(partial = {}) {
    return this.saveSession({ ...(this.recoveryData || this.getSavedSession() || {}), ...partial, timestamp: Date.now() });
  }

  clearSession() {
    this.recoveryData = null;
    this.recoveryAttempts = 0;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.emit();
  }

  getSavedSession() {
    if (this.recoveryData) return this.recoveryData;
    if (typeof localStorage === 'undefined') return null;
    const parsed = safeJsonParse(localStorage.getItem(STORAGE_KEY));
    if (!parsed) return null;
    if (Date.now() - Number(parsed.timestamp || 0) > MAX_SESSION_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    this.recoveryData = parsed;
    return parsed;
  }

  markTrackState(trackState = {}) {
    return this.updateRecoveryPoint({ mediaState: { ...(this.getSavedSession()?.mediaState || {}), ...trackState } });
  }

  async handleDisconnect(reason, context = {}) {
    logger.warn('Live stream disconnected', { reason, roomId: context?.roomId || this.getSavedSession()?.roomId });
    const session = this.updateRecoveryPoint({
      ...(this.getSavedSession() || {}),
      ...context,
      lastDisconnectReason: reason,
      lastDisconnectAt: Date.now(),
    });
    return this.recoverStream(session);
  }

  async waitForOnline() {
    if (typeof navigator === 'undefined' || navigator.onLine) return true;
    return new Promise((resolve) => this.onlineWaiters.add(resolve));
  }

  handleBrowserOnline() {
    this.onlineWaiters.forEach((resolve) => resolve(true));
    this.onlineWaiters.clear();
    this.emit({ online: true });
    if (this.getSavedSession() && !this.isRecovering) {
      this.recoverStream(this.getSavedSession()).catch(() => {});
    }
  }

  handleBrowserOffline() {
    this.emit({ online: false });
  }

  async recoverStream(session = this.getSavedSession(), overrides = {}) {
    if (!session?.serverUrl || !session?.token) return false;
    if (this.recoveryPromise) return this.recoveryPromise;

    this.recoveryPromise = (async () => {
      this.isRecovering = true;
      this.emit({ phase: 'starting' });
      await this.waitForOnline();

      const backoff = Array.isArray(overrides.backoff) && overrides.backoff.length ? overrides.backoff : DEFAULT_BACKOFF;
      let lastError = null;

      for (let attempt = 0; attempt < backoff.length; attempt += 1) {
        this.recoveryAttempts = attempt + 1;
        const delay = Number(backoff[attempt] || 0);
        this.emit({ phase: delay ? 'backoff' : 'retrying', attempt: this.recoveryAttempts, nextDelayMs: delay });
        if (delay > 0) await wait(delay + Math.round(Math.random() * 350));

        try {
          const result = await livekitService.connect(
            session.serverUrl,
            session.token,
            session.roomName,
            session.userName,
            {
              autoSubscribe: session.autoSubscribe !== false,
              mediaState: session.mediaState,
              reconnecting: true,
            }
          );

          if (result?.success) {
            if (session.mediaState) {
              await livekitService.restoreState(session.mediaState).catch(() => {});
            }
            this.saveSession({
              ...session,
              recoveredAt: Date.now(),
              recoveryAttempts: this.recoveryAttempts,
              lastDisconnectReason: null,
            });
            this.emit({ phase: 'recovered', attempt: this.recoveryAttempts, roomId: session.roomId });
            this.isRecovering = false;
            this.recoveryPromise = null;
            return true;
          }
          lastError = new Error(result?.error || 'recovery_failed');
        } catch (error) {
          lastError = error;
          logger.warn('Live recovery attempt failed', {
            attempt: this.recoveryAttempts,
            message: error?.message,
          });
        }
      }

      this.emit({ phase: 'failed', attempt: this.recoveryAttempts, error: lastError?.message || 'recovery_failed' });
      this.isRecovering = false;
      this.recoveryPromise = null;
      return false;
    })();

    return this.recoveryPromise;
  }

  async recoverRoom(roomId, loader) {
    if (!roomId || typeof loader !== 'function') return null;
    const roomState = await loader(roomId);
    if (!roomState) return null;
    this.updateRecoveryPoint({ roomId, roomState, roomSnapshotAt: Date.now() });
    return roomState;
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleBrowserOnline);
      window.removeEventListener('offline', this.handleBrowserOffline);
    }
    this.listeners.clear();
    this.onlineWaiters.clear();
  }
}

export const reconnectSystem = new ReconnectSystem();
export default reconnectSystem;
