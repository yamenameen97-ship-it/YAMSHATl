class LiveAnalyticsTracker {
  constructor({ maxSamples = 120 } = {}) {
    this.maxSamples = maxSamples;
    this.samples = [];
  }

  ingest(sample = {}) {
    const normalized = {
      ts: Number(sample.ts || Date.now()),
      bitrate: Number(sample.bitrate || sample.avg_bitrate || sample.bitrate_kbps || 0),
      latency: Number(sample.latency || sample.latency_ms || 0),
      packetLoss: Number(sample.packetLoss || sample.packet_loss || 0),
      viewers: Number(sample.viewers || sample.viewer_count || 0),
      hearts: Number(sample.hearts || sample.hearts_count || 0),
      healthScore: Number(sample.healthScore || sample.health_score || 0),
      qualityProfile: sample.qualityProfile || sample.quality_profile || 'auto',
      reconnectAttempts: Number(sample.reconnectAttempts || sample.reconnect_attempts || 0),
    };
    this.samples.push(normalized);
    this.samples = this.samples.slice(-this.maxSamples);
    return normalized;
  }

  reset() {
    this.samples = [];
  }

  summarize() {
    if (!this.samples.length) {
      return {
        peakViewers: 0,
        averageBitrate: 0,
        averageLatency: 0,
        packetLossEvents: 0,
        dominantProfile: 'auto',
        trend: 'stable',
      };
    }

    const totals = this.samples.reduce((acc, sample) => ({
      bitrate: acc.bitrate + sample.bitrate,
      latency: acc.latency + sample.latency,
      packetLoss: acc.packetLoss + sample.packetLoss,
      peakViewers: Math.max(acc.peakViewers, sample.viewers),
    }), { bitrate: 0, latency: 0, packetLoss: 0, peakViewers: 0 });

    const profileCounts = this.samples.reduce((acc, sample) => {
      acc[sample.qualityProfile] = (acc[sample.qualityProfile] || 0) + 1;
      return acc;
    }, {});

    const dominantProfile = Object.entries(profileCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'auto';
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const trend = last.healthScore > first.healthScore + 5 ? 'improving' : last.healthScore < first.healthScore - 5 ? 'degrading' : 'stable';

    return {
      peakViewers: totals.peakViewers,
      averageBitrate: Math.round(totals.bitrate / this.samples.length),
      averageLatency: Math.round(totals.latency / this.samples.length),
      packetLossEvents: this.samples.filter((sample) => sample.packetLoss >= 2).length,
      dominantProfile,
      trend,
    };
  }
}

export const createLiveAnalyticsTracker = (options) => new LiveAnalyticsTracker(options);
export default createLiveAnalyticsTracker;
