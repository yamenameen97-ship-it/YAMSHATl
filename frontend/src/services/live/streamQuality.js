import * as LiveKit from 'livekit-client';
import logger from '../../utils/logger';

function average(values = []) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

class StreamQualityManager {
  constructor(room = null, options = {}) {
    this.room = room;
    this.options = options;
    this.currentProfile = 'high';
    this.sampleTimer = null;
    this.listenersAttached = false;
    if (room) this.attachRoom(room);
  }

  attachRoom(room) {
    this.room = room;
    if (!room || this.listenersAttached) return;
    this.listenersAttached = true;
    this.setupQualityListeners();
    this.startSampling();
  }

  destroy() {
    if (this.sampleTimer) {
      window.clearInterval(this.sampleTimer);
      this.sampleTimer = null;
    }
    this.room = null;
    this.listenersAttached = false;
  }

  setupQualityListeners() {
    if (!this.room) return;

    this.room.on?.(LiveKit.RoomEvent.LocalTrackPublished, () => {
      this.options.onProfileChange?.(this.currentProfile);
    });

    this.room.on?.(LiveKit.RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      logger.info('Live connection quality changed', { quality, participant: participant?.identity });
      if (participant?.isLocal) {
        this.handleLocalQualityChange(quality);
      }
    });

    this.room.on?.(LiveKit.RoomEvent.Reconnecting, () => {
      this.options.onProfileChange?.('reconnecting');
    });
  }

  handleLocalQualityChange(quality) {
    if (quality === LiveKit.ConnectionQuality.Poor) {
      this.currentProfile = 'low';
      this.options.onProfileChange?.(this.currentProfile);
      return;
    }
    if (quality === LiveKit.ConnectionQuality.Good) {
      this.currentProfile = 'medium';
      this.options.onProfileChange?.(this.currentProfile);
      return;
    }
    if (quality === LiveKit.ConnectionQuality.Excellent) {
      this.currentProfile = 'high';
      this.options.onProfileChange?.(this.currentProfile);
    }
  }

  determineProfile(stats = {}) {
    const packetLoss = Number(stats.packetLoss || 0);
    const latency = Number(stats.latency || 0);
    const bitrate = Number(stats.bitrate || 0);
    if (packetLoss >= 5 || latency >= 2200 || bitrate < 900) return 'low';
    if (packetLoss >= 2 || latency >= 1400 || bitrate < 1800) return 'medium';
    return 'high';
  }

  async getNetworkStats() {
    if (!this.room?.getRTCStatsReport) {
      return {
        bitrate: 0,
        latency: 0,
        packetLoss: 0,
        profile: this.currentProfile,
      };
    }

    try {
      const report = await this.room.getRTCStatsReport();
      const allStats = [];
      if (report && typeof report.forEach === 'function') {
        report.forEach((entry) => allStats.push(entry));
      }

      const outbound = allStats.filter((item) => item.type === 'outbound-rtp' && item.kind === 'video');
      const candidates = allStats.filter((item) => item.type === 'candidate-pair' && item.state === 'succeeded');
      const bitrate = Math.round(average(outbound.map((item) => Number(item.bytesSent || 0))) / 1024);
      const packetLoss = average(outbound.map((item) => Number(item.packetsLost || 0)));
      const latency = Math.round(average(candidates.map((item) => Number(item.currentRoundTripTime || 0) * 1000)));
      const profile = this.determineProfile({ bitrate, packetLoss, latency });
      this.currentProfile = profile;
      return { bitrate, latency, packetLoss, profile };
    } catch (error) {
      logger.warn('Failed to sample live stats', { error: String(error?.message || error) });
      return {
        bitrate: 0,
        latency: 0,
        packetLoss: 0,
        profile: this.currentProfile,
      };
    }
  }

  startSampling() {
    if (this.sampleTimer || typeof window === 'undefined') return;
    this.sampleTimer = window.setInterval(async () => {
      const stats = await this.getNetworkStats();
      this.options.onStats?.(stats);
      if (stats.profile !== this.currentProfile) {
        this.currentProfile = stats.profile;
        this.options.onProfileChange?.(stats.profile);
      }
    }, 5000);
  }
}

export default StreamQualityManager;
