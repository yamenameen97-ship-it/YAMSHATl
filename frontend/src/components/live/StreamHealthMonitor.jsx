import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';

function meterColor(level) {
  if (level >= 85) return tokens.colors.success;
  if (level >= 65) return tokens.colors.warning;
  if (level >= 40) return '#f97316';
  return tokens.colors.error;
}

function healthFromStats(stats = {}) {
  if (Number.isFinite(Number(stats.healthScore))) return Number(stats.healthScore);
  let score = 100;
  score -= Math.min(Number(stats.packetLoss || 0) * 3, 40);
  score -= Math.min(Math.max(Number(stats.latency || 0) - 100, 0) / 10, 20);
  score -= Math.min(Math.max(Number(stats.viewerSyncMs || stats.syncLag || 0) - 1000, 0) / 120, 20);
  score -= stats.bitrate && Number(stats.bitrate) < 900 ? Math.min((900 - Number(stats.bitrate)) / 20, 20) : 0;
  return Math.max(5, Math.round(score));
}

function healthLabel(score) {
  if (score >= 85) return 'ممتاز';
  if (score >= 65) return 'جيد';
  if (score >= 40) return 'ضعيف';
  return 'حرج';
}

const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 8 };

const StreamHealthMonitor = ({ stats }) => {
  const [health, setHealth] = useState(healthFromStats(stats));

  useEffect(() => {
    setHealth(healthFromStats(stats));
  }, [stats]);

  const derived = useMemo(() => ({
    bitrate: Math.round(Number(stats?.bitrate || 0)),
    latency: Math.round(Number(stats?.latency || 0)),
    packetLoss: Math.round(Number(stats?.packetLoss || 0) * 10) / 10,
    fps: Math.round(Number(stats?.fps || 0)),
    droppedFrames: Math.round(Number(stats?.droppedFrames || 0)),
    reconnectAttempts: Math.round(Number(stats?.reconnectAttempts || 0)),
    viewerSyncMs: Math.round(Number(stats?.viewerSyncMs || stats?.syncLag || 0)),
    recordingState: stats?.recordingState || 'idle',
    activeViewers: Math.round(Number(stats?.activeViewers || stats?.viewerCount || 0)),
  }), [stats]);

  const color = meterColor(health);

  return (
    <div style={{
      padding: tokens.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.64)',
      borderRadius: 16,
      color: 'white',
      fontSize: tokens.typography.sizes.xs,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 220,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>حالة البث</span>
        <strong style={{ color }}>{healthLabel(health)}</strong>
      </div>

      <div style={{ height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${health}%`, backgroundColor: color, transition: 'width 0.35s ease' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ color: 'rgba(255,255,255,0.64)' }}>Bitrate</div>
          <strong>{derived.bitrate} kbps</strong>
        </div>
        <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ color: 'rgba(255,255,255,0.64)' }}>Latency</div>
          <strong>{derived.latency} ms</strong>
        </div>
      </div>

      <div style={rowStyle}><span>Packet Loss</span><span>{derived.packetLoss}%</span></div>
      <div style={rowStyle}><span>FPS</span><span>{derived.fps || '—'}</span></div>
      <div style={rowStyle}><span>Dropped Frames</span><span>{derived.droppedFrames}</span></div>
      <div style={rowStyle}><span>Viewer Sync</span><span>{derived.viewerSyncMs} ms</span></div>
      <div style={rowStyle}><span>Reconnections</span><span>{derived.reconnectAttempts}</span></div>
      <div style={rowStyle}><span>Recording</span><span>{derived.recordingState}</span></div>
      <div style={rowStyle}><span>Active Viewers</span><span>{derived.activeViewers}</span></div>
    </div>
  );
};

StreamHealthMonitor.propTypes = {
  stats: PropTypes.shape({
    bitrate: PropTypes.number,
    packetLoss: PropTypes.number,
    latency: PropTypes.number,
    fps: PropTypes.number,
    droppedFrames: PropTypes.number,
    reconnectAttempts: PropTypes.number,
    viewerSyncMs: PropTypes.number,
    syncLag: PropTypes.number,
    recordingState: PropTypes.string,
    activeViewers: PropTypes.number,
    viewerCount: PropTypes.number,
    healthScore: PropTypes.number,
  }),
};

export default StreamHealthMonitor;
