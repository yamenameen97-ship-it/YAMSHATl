class StreamSyncManager {
  constructor() {
    this.hostCursor = 0;
    this.hostTimestamp = Date.now();
    this.viewerCheckpoints = new Map();
  }

  setHostCheckpoint({ cursor = 0, timestamp = Date.now(), metadata = {} } = {}) {
    this.hostCursor = Number(cursor || 0);
    this.hostTimestamp = Number(timestamp || Date.now());
    this.metadata = metadata;
    return this.getSnapshot();
  }

  ackViewer({ viewerId, cursor = 0, receivedAt = Date.now(), latencyMs = 0 } = {}) {
    if (!viewerId) return this.getSnapshot();
    this.viewerCheckpoints.set(viewerId, {
      viewerId,
      cursor: Number(cursor || 0),
      receivedAt: Number(receivedAt || Date.now()),
      latencyMs: Number(latencyMs || 0),
      lagMs: Math.max(this.hostCursor - Number(cursor || 0), 0),
    });
    return this.getSnapshot();
  }

  getSnapshot() {
    const viewers = Array.from(this.viewerCheckpoints.values());
    const averageLagMs = viewers.length ? Math.round(viewers.reduce((sum, item) => sum + item.lagMs, 0) / viewers.length) : 0;
    const maxLagMs = viewers.length ? Math.max(...viewers.map((item) => item.lagMs)) : 0;
    return {
      hostCursor: this.hostCursor,
      hostTimestamp: this.hostTimestamp,
      averageLagMs,
      maxLagMs,
      viewers,
    };
  }
}

export const streamSyncManager = new StreamSyncManager();
export default streamSyncManager;
