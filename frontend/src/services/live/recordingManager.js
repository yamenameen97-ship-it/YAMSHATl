import logger from '../../utils/logger.js';

class RecordingManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = 'idle';
    this.startedAt = null;
    this.stoppedAt = null;
    this.segments = [];
    this.dropouts = [];
    this.currentSegment = null;
  }

  start(meta = {}) {
    if (this.state === 'recording') return this.snapshot();
    this.state = 'recording';
    this.startedAt = this.startedAt || Date.now();
    this.currentSegment = {
      id: `segment-${Date.now()}`,
      startedAt: Date.now(),
      meta,
    };
    return this.snapshot();
  }

  pause(reason = 'manual') {
    if (this.state !== 'recording') return this.snapshot();
    this.closeSegment({ reason, paused: true });
    this.state = 'paused';
    return this.snapshot();
  }

  resume(meta = {}) {
    if (this.state === 'recording') return this.snapshot();
    this.state = 'recording';
    this.currentSegment = {
      id: `segment-${Date.now()}`,
      startedAt: Date.now(),
      resumed: true,
      meta,
    };
    return this.snapshot();
  }

  stop(reason = 'manual') {
    if (this.state === 'idle') return this.snapshot();
    this.closeSegment({ reason });
    this.state = 'stopped';
    this.stoppedAt = Date.now();
    return this.snapshot();
  }

  markDropout(reason = 'network_gap') {
    const event = { reason, at: Date.now() };
    this.dropouts.push(event);
    logger.warn('Recording dropout detected', event);
    if (this.state === 'recording') {
      this.closeSegment({ reason, dropout: true });
      this.currentSegment = {
        id: `segment-${Date.now()}`,
        startedAt: Date.now(),
        recoveredAfterDropout: true,
      };
    }
    return event;
  }

  closeSegment(extra = {}) {
    if (!this.currentSegment) return;
    this.segments.push({
      ...this.currentSegment,
      endedAt: Date.now(),
      durationMs: Date.now() - this.currentSegment.startedAt,
      ...extra,
    });
    this.currentSegment = null;
  }

  snapshot() {
    const openSegmentDuration = this.currentSegment ? Date.now() - this.currentSegment.startedAt : 0;
    const totalClosedDuration = this.segments.reduce((sum, segment) => sum + Number(segment.durationMs || 0), 0);
    return {
      state: this.state,
      startedAt: this.startedAt,
      stoppedAt: this.stoppedAt,
      segments: this.segments,
      dropouts: this.dropouts,
      openSegment: this.currentSegment,
      totalDurationMs: totalClosedDuration + openSegmentDuration,
      continuityScore: Math.max(0, 100 - this.dropouts.length * 12),
    };
  }
}

export const recordingManager = new RecordingManager();
export default recordingManager;
