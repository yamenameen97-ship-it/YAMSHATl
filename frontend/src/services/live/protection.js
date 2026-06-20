import logger from '../../utils/logger.js';

function prune(entries = [], windowMs) {
  const threshold = Date.now() - windowMs;
  return entries.filter((entry) => entry >= threshold);
}

class StreamProtection {
  constructor() {
    this.reconnectAttempts = new Map();
    this.commentRate = new Map();
    this.viewerSessions = new Map();
    this.MAX_RECONNECTS_PER_MIN = 6;
    this.MAX_COMMENTS_PER_10S = 6;
    this.MAX_HEARTBEAT_SKEW_MS = 45_000;
  }

  canReconnect(userId) {
    const key = String(userId || 'anonymous');
    const attempts = prune(this.reconnectAttempts.get(key) || [], 60_000);
    if (attempts.length >= this.MAX_RECONNECTS_PER_MIN) {
      logger.warn('Reconnect abuse detected', { userId: key, attempts: attempts.length });
      this.reconnectAttempts.set(key, attempts);
      return false;
    }
    attempts.push(Date.now());
    this.reconnectAttempts.set(key, attempts);
    return true;
  }

  isSpamming(userId) {
    const key = String(userId || 'anonymous');
    const attempts = prune(this.commentRate.get(key) || [], 10_000);
    attempts.push(Date.now());
    this.commentRate.set(key, attempts);
    return attempts.length > this.MAX_COMMENTS_PER_10S;
  }

  validateViewer({ viewerId, viewerToken, sessionId, clientTs } = {}) {
    if (!viewerId || !viewerToken || !sessionId) return false;
    const drift = Math.abs(Date.now() - Number(clientTs || Date.now()));
    if (drift > this.MAX_HEARTBEAT_SKEW_MS) return false;
    return true;
  }

  registerViewerJoin({ viewerId, sessionId, role = 'viewer', joinedAt = Date.now() } = {}) {
    if (!viewerId || !sessionId) return null;
    const current = this.viewerSessions.get(viewerId);
    const snapshot = {
      viewerId,
      sessionId,
      role,
      joinedAt,
      lastHeartbeatAt: Date.now(),
      presenceState: 'active',
      version: (current?.version || 0) + 1,
    };
    this.viewerSessions.set(viewerId, snapshot);
    return snapshot;
  }

  acknowledgeViewer({ viewerId, syncCursor, latencyMs } = {}) {
    const current = this.viewerSessions.get(viewerId);
    if (!current) return null;
    const snapshot = {
      ...current,
      syncCursor: syncCursor ?? current.syncCursor ?? 0,
      latencyMs: Number.isFinite(Number(latencyMs)) ? Number(latencyMs) : current.latencyMs,
      lastHeartbeatAt: Date.now(),
      presenceState: 'active',
    };
    this.viewerSessions.set(viewerId, snapshot);
    return snapshot;
  }

  markViewerStale(viewerId) {
    const current = this.viewerSessions.get(viewerId);
    if (!current) return null;
    const snapshot = { ...current, presenceState: 'stale' };
    this.viewerSessions.set(viewerId, snapshot);
    return snapshot;
  }

  buildViewerSyncSnapshot() {
    const staleBefore = Date.now() - 30_000;
    const viewers = Array.from(this.viewerSessions.values()).map((viewer) => ({
      ...viewer,
      presenceState: viewer.lastHeartbeatAt < staleBefore ? 'stale' : viewer.presenceState,
    }));
    return {
      total: viewers.length,
      active: viewers.filter((viewer) => viewer.presenceState === 'active').length,
      stale: viewers.filter((viewer) => viewer.presenceState !== 'active').length,
      viewers,
    };
  }
}

export const streamProtection = new StreamProtection();
export default streamProtection;
