import * as LiveKit from 'livekit-client';
import logger from '../../utils/logger.js';

const DEFAULT_PROFILES = {
  ultra: { name: 'ultra', label: 'Ultra', width: 1920, height: 1080, frameRate: 30, maxBitrate: 4500 },
  hd: { name: 'hd', label: 'HD', width: 1280, height: 720, frameRate: 24, maxBitrate: 2500 },
  sd: { name: 'sd', label: 'SD', width: 960, height: 540, frameRate: 20, maxBitrate: 1400 },
  low: { name: 'low', label: 'Low', width: 640, height: 360, frameRate: 15, maxBitrate: 700 },
  audioOnly: { name: 'audioOnly', label: 'Audio only', width: 0, height: 0, frameRate: 0, maxBitrate: 64 },
};

function now() {
  return Date.now();
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

class StreamQualityManager {
  constructor(room = null, options = {}) {
    this.room = room;
    this.listeners = new Set();
    this.profiles = { ...DEFAULT_PROFILES, ...(options.profiles || {}) };
    this.profile = options.initialProfile || 'hd';
    this.autoMode = options.autoMode !== false;
    this.lastStats = null;
    this.lastReport = null;
    this.lastSampleAt = 0;
    this.healthScore = 100;
    this.state = {
      profile: this.profile,
      autoMode: this.autoMode,
      bitrate: 0,
      packetLoss: 0,
      latency: 0,
      jitter: 0,
      fps: 0,
      droppedFrames: 0,
      qualityLabel: 'excellent',
      connectionQuality: 'unknown',
      recommendedProfile: this.profile,
      lastUpdatedAt: 0,
    };
    this.boundConnectionChange = null;
    this.boundTrackPublish = null;
    this.boundReconnect = null;
    this.boundReconnected = null;
    this.setupQualityListeners();
  }

  attachRoom(room) {
    if (this.room === room) return;
    this.teardown();
    this.room = room;
    this.setupQualityListeners();
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
        logger.warn('StreamQuality listener failed', { message: error?.message });
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamshat:live-quality', { detail: snapshot }));
    }
  }

  getProfiles() {
    return Object.values(this.profiles);
  }

  getState() {
    return {
      ...this.state,
      healthScore: this.healthScore,
      profileConfig: this.profiles[this.profile] || null,
    };
  }

  setupQualityListeners() {
    if (!this.room?.on) return;

    this.boundTrackPublish = (publication) => {
      if (publication?.track?.kind === 'video') {
        this.applyProfile(this.profile).catch(() => {});
      }
    };

    this.boundConnectionChange = (quality, participant) => {
      if (!participant?.isLocal) return;
      const connectionQuality = typeof quality === 'string' ? quality.toLowerCase() : String(quality || '').toLowerCase();
      this.state.connectionQuality = connectionQuality || 'unknown';
      if (this.autoMode) {
        if (quality === LiveKit.ConnectionQuality.Poor || connectionQuality === 'poor') {
          this.applyProfile('low').catch(() => {});
        } else if (quality === LiveKit.ConnectionQuality.Good || connectionQuality === 'good') {
          this.applyProfile('sd').catch(() => {});
        } else if (quality === LiveKit.ConnectionQuality.Excellent || connectionQuality === 'excellent') {
          this.applyProfile('hd').catch(() => {});
        }
      }
      this.emit();
    };

    this.boundReconnect = () => this.emit({ reconnecting: true });
    this.boundReconnected = () => this.emit({ reconnecting: false });

    this.room.on(LiveKit.RoomEvent.LocalTrackPublished, this.boundTrackPublish);
    this.room.on(LiveKit.RoomEvent.ConnectionQualityChanged, this.boundConnectionChange);
    this.room.on(LiveKit.RoomEvent.Reconnecting, this.boundReconnect);
    this.room.on(LiveKit.RoomEvent.Reconnected, this.boundReconnected);
  }

  teardown() {
    if (!this.room?.off) return;
    if (this.boundTrackPublish) this.room.off(LiveKit.RoomEvent.LocalTrackPublished, this.boundTrackPublish);
    if (this.boundConnectionChange) this.room.off(LiveKit.RoomEvent.ConnectionQualityChanged, this.boundConnectionChange);
    if (this.boundReconnect) this.room.off(LiveKit.RoomEvent.Reconnecting, this.boundReconnect);
    if (this.boundReconnected) this.room.off(LiveKit.RoomEvent.Reconnected, this.boundReconnected);
  }

  async applyProfile(profileName = 'hd') {
    const target = this.profiles[profileName] || this.profiles.hd;
    this.profile = target.name;
    this.state.profile = target.name;
    this.state.recommendedProfile = target.name;

    if (!this.room?.localParticipant?.videoTrackPublications) {
      this.emit();
      return target;
    }

    const publications = Array.from(this.room.localParticipant.videoTrackPublications.values?.() || []);
    await Promise.all(publications.map(async (publication) => {
      const mediaTrack = publication?.track?.mediaStreamTrack;
      if (!mediaTrack?.applyConstraints || target.name === 'audioOnly') return;
      try {
        await mediaTrack.applyConstraints({
          width: target.width,
          height: target.height,
          frameRate: target.frameRate,
        });
      } catch (error) {
        logger.warn('Could not apply video constraints', {
          profile: target.name,
          message: error?.message,
        });
      }
    }));

    this.emit();
    return target;
  }

  calculateHealthScore(sample = {}) {
    const packetLossPenalty = Math.min(toNumber(sample.packetLoss) * 3, 45);
    const latencyPenalty = Math.min(Math.max(toNumber(sample.latency) - 80, 0) / 8, 30);
    const bitratePenalty = sample.bitrate && sample.bitrate < 800 ? Math.min((800 - sample.bitrate) / 20, 20) : 0;
    const framePenalty = sample.droppedFrames ? Math.min(toNumber(sample.droppedFrames) / 2, 10) : 0;
    return Math.max(5, Math.round(100 - packetLossPenalty - latencyPenalty - bitratePenalty - framePenalty));
  }

  getRecommendedProfile(sample = {}) {
    if (toNumber(sample.packetLoss) > 8 || toNumber(sample.latency) > 500 || toNumber(sample.bitrate) < 450) return 'audioOnly';
    if (toNumber(sample.packetLoss) > 5 || toNumber(sample.latency) > 320 || toNumber(sample.bitrate) < 700) return 'low';
    if (toNumber(sample.packetLoss) > 2 || toNumber(sample.latency) > 180 || toNumber(sample.bitrate) < 1400) return 'sd';
    if (toNumber(sample.packetLoss) > 1 || toNumber(sample.latency) > 120 || toNumber(sample.bitrate) < 2200) return 'hd';
    return 'ultra';
  }

  qualityLabelFromHealth(score) {
    if (score >= 85) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  ingestNetworkSample(sample = {}) {
    const next = {
      bitrate: toNumber(sample.bitrate),
      packetLoss: toNumber(sample.packetLoss),
      latency: toNumber(sample.latency),
      jitter: toNumber(sample.jitter),
      fps: toNumber(sample.fps),
      droppedFrames: toNumber(sample.droppedFrames),
      lastUpdatedAt: now(),
    };
    this.healthScore = this.calculateHealthScore(next);
    const recommendedProfile = this.getRecommendedProfile(next);
    this.state = {
      ...this.state,
      ...next,
      recommendedProfile,
      qualityLabel: this.qualityLabelFromHealth(this.healthScore),
    };

    if (this.autoMode && recommendedProfile !== this.profile) {
      this.applyProfile(recommendedProfile).catch(() => {});
    }

    this.emit();
    return this.getState();
  }

  async collectStats() {
    if (!this.room) return this.getState();

    const publisherPc = this.room.engine?.pcManager?.publisher;
    if (!publisherPc?.getStats) return this.getState();

    try {
      const report = await publisherPc.getStats();
      let outboundVideo = null;
      let remoteInboundVideo = null;
      let candidatePair = null;

      report.forEach((entry) => {
        if (entry.type === 'outbound-rtp' && entry.kind === 'video') outboundVideo = entry;
        if (entry.type === 'remote-inbound-rtp' && entry.kind === 'video') remoteInboundVideo = entry;
        if (entry.type === 'candidate-pair' && entry.state === 'succeeded' && (entry.nominated || entry.selected)) candidatePair = entry;
      });

      const ts = now();
      const prev = this.lastReport;
      const bytesSent = toNumber(outboundVideo?.bytesSent);
      const prevBytesSent = toNumber(prev?.bytesSent);
      const deltaBytes = Math.max(bytesSent - prevBytesSent, 0);
      const deltaMs = Math.max(ts - toNumber(prev?.timestamp, ts), 1);
      const bitrate = Math.round((deltaBytes * 8) / deltaMs);

      const packetLoss = Math.round((toNumber(remoteInboundVideo?.packetsLost) / Math.max(toNumber(remoteInboundVideo?.packetsSent) + toNumber(remoteInboundVideo?.packetsLost), 1)) * 1000) / 10;
      const latency = Math.round((toNumber(candidatePair?.currentRoundTripTime) || toNumber(remoteInboundVideo?.roundTripTime)) * 1000);
      const jitter = Math.round((toNumber(remoteInboundVideo?.jitter) || 0) * 1000);
      const fps = Math.round(toNumber(outboundVideo?.framesPerSecond));
      const droppedFrames = Math.round(toNumber(outboundVideo?.framesDropped));

      this.lastReport = { bytesSent, timestamp: ts };
      return this.ingestNetworkSample({ bitrate, packetLoss, latency, jitter, fps, droppedFrames });
    } catch (error) {
      logger.warn('Failed to collect RTC stats', { message: error?.message });
      return this.getState();
    }
  }

  async optimizeForPoorNetwork() {
    return this.applyProfile('low');
  }

  async restoreQuality() {
    return this.applyProfile('hd');
  }

  destroy() {
    this.teardown();
    this.listeners.clear();
    this.room = null;
  }
}

export default StreamQualityManager;
