import logger from '../../utils/logger.js';

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function boundedPush(list, item, maxSize = 240) {
  list.push(item);
  if (list.length > maxSize) list.splice(0, list.length - maxSize);
}

class LiveAnalyticsService {
  constructor() {
    this.reset();
  }

  reset() {
    this.startedAt = Date.now();
    this.series = {
      bitrate: [],
      viewers: [],
      latency: [],
      packetLoss: [],
      syncLag: [],
      commentsPerMinute: [],
    };
    this.counters = {
      comments: 0,
      gifts: 0,
      hearts: 0,
      joins: 0,
      leaves: 0,
      reconnects: 0,
      moderationActions: 0,
      recordingDropouts: 0,
      guestRequests: 0,
      guestPromotions: 0,
    };
    this.viewerSessions = new Map();
    this.commentWindow = [];
    this.lastSnapshot = null;
  }

  trackViewerJoin(viewerId, payload = {}) {
    if (!viewerId) return;
    this.counters.joins += 1;
    this.viewerSessions.set(viewerId, {
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
      role: payload.role || 'viewer',
      deviceType: payload.deviceType || 'unknown',
    });
  }

  trackViewerLeave(viewerId) {
    const session = this.viewerSessions.get(viewerId);
    if (session) {
      session.leftAt = Date.now();
      session.lastSeenAt = Date.now();
      this.viewerSessions.set(viewerId, session);
    }
    this.counters.leaves += 1;
  }

  touchViewer(viewerId) {
    const session = this.viewerSessions.get(viewerId);
    if (!session) return;
    session.lastSeenAt = Date.now();
    this.viewerSessions.set(viewerId, session);
  }

  trackComment(payload = {}) {
    this.counters.comments += 1;
    this.commentWindow.push(Date.now());
    this.commentWindow = this.commentWindow.filter((timestamp) => Date.now() - timestamp <= 60_000);
    boundedPush(this.series.commentsPerMinute, {
      ts: Date.now(),
      value: this.commentWindow.length,
    });
  }

  trackGift() {
    this.counters.gifts += 1;
  }

  trackHeart() {
    this.counters.hearts += 1;
  }

  trackReconnect() {
    this.counters.reconnects += 1;
  }

  trackModeration() {
    this.counters.moderationActions += 1;
  }

  trackRecordingDropout() {
    this.counters.recordingDropouts += 1;
  }

  trackGuestRequest() {
    this.counters.guestRequests += 1;
  }

  trackGuestPromotion() {
    this.counters.guestPromotions += 1;
  }

  ingestStreamStats(stats = {}) {
    const pointTs = Date.now();
    boundedPush(this.series.bitrate, { ts: pointTs, value: Number(stats.bitrate || 0) });
    boundedPush(this.series.latency, { ts: pointTs, value: Number(stats.latency || 0) });
    boundedPush(this.series.packetLoss, { ts: pointTs, value: Number(stats.packetLoss || 0) });
    boundedPush(this.series.syncLag, { ts: pointTs, value: Number(stats.syncLag || 0) });
    boundedPush(this.series.viewers, { ts: pointTs, value: Number(stats.viewerCount || this.getActiveViewers()) });
    this.lastSnapshot = this.snapshot();
    return this.lastSnapshot;
  }

  getActiveViewers() {
    const staleBefore = Date.now() - 70_000;
    return Array.from(this.viewerSessions.values()).filter((session) => (session.leftAt ? session.leftAt > staleBefore : session.lastSeenAt > staleBefore)).length;
  }

  getPeakViewers() {
    return this.series.viewers.reduce((peak, point) => Math.max(peak, Number(point.value || 0)), 0);
  }

  getAverageWatchTimeMs() {
    const sessions = Array.from(this.viewerSessions.values());
    if (!sessions.length) return 0;
    return Math.round(average(sessions.map((session) => {
      const end = session.leftAt || session.lastSeenAt || Date.now();
      return Math.max(end - session.joinedAt, 0);
    })));
  }

  getEngagementPerMinute() {
    const runtimeMinutes = Math.max((Date.now() - this.startedAt) / 60_000, 1);
    return Math.round(((this.counters.comments + this.counters.hearts + this.counters.gifts) / runtimeMinutes) * 10) / 10;
  }

  snapshot() {
    const healthInput = {
      bitrate: average(this.series.bitrate.slice(-6).map((item) => item.value)),
      latency: average(this.series.latency.slice(-6).map((item) => item.value)),
      packetLoss: average(this.series.packetLoss.slice(-6).map((item) => item.value)),
      syncLag: average(this.series.syncLag.slice(-6).map((item) => item.value)),
    };

    const healthScore = Math.max(
      5,
      Math.round(
        100
        - Math.min((healthInput.packetLoss || 0) * 3, 40)
        - Math.min(Math.max((healthInput.latency || 0) - 100, 0) / 10, 25)
        - Math.min(Math.max((healthInput.syncLag || 0) - 1200, 0) / 120, 20)
      )
    );

    return {
      startedAt: this.startedAt,
      healthScore,
      currentViewers: this.getActiveViewers(),
      peakViewers: this.getPeakViewers(),
      averageWatchTimeMs: this.getAverageWatchTimeMs(),
      engagementPerMinute: this.getEngagementPerMinute(),
      counters: { ...this.counters },
      current: {
        bitrate: Math.round(healthInput.bitrate || 0),
        latency: Math.round(healthInput.latency || 0),
        packetLoss: Math.round((healthInput.packetLoss || 0) * 10) / 10,
        syncLag: Math.round(healthInput.syncLag || 0),
        commentsPerMinute: this.commentWindow.length,
      },
      series: this.series,
    };
  }

  exportSnapshot() {
    const snapshot = this.snapshot();
    logger.info('Live analytics snapshot exported', {
      viewers: snapshot.currentViewers,
      engagementPerMinute: snapshot.engagementPerMinute,
    });
    return snapshot;
  }
}

export const liveAnalyticsService = new LiveAnalyticsService();
export default liveAnalyticsService;
