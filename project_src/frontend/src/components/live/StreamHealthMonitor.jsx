import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';

const HEALTH_COLORS = {
  excellent: tokens.colors.success,
  good: tokens.colors.warning,
  poor: '#f97316',
  critical: tokens.colors.error,
};

function getHealthStatus(stats = {}) {
  const packetLoss = Number(stats.packetLoss || 0);
  const latency = Number(stats.latency || 0);
  const bitrate = Number(stats.bitrate || 0);
  const score = Number(stats.healthScore || 0);

  if (score <= 45 || packetLoss > 8 || latency > 2200 || bitrate < 700) return 'critical';
  if (score <= 65 || packetLoss > 4 || latency > 1500 || bitrate < 1400) return 'poor';
  if (score <= 82 || packetLoss > 1.5 || latency > 900 || bitrate < 2400) return 'good';
  return 'excellent';
}

function getArabicLabel(status) {
  switch (status) {
    case 'excellent': return 'ممتاز';
    case 'good': return 'جيد';
    case 'poor': return 'ضعيف';
    case 'critical': return 'حرج';
    default: return 'غير معروف';
  }
}

export default function StreamHealthMonitor({ stats }) {
  const health = useMemo(() => getHealthStatus(stats), [stats]);
  const healthColor = HEALTH_COLORS[health] || tokens.colors.secondary[500];
  const qualityLabel = stats?.qualityProfile === 'low' ? 'منخفض' : stats?.qualityProfile === 'medium' ? 'متوسط' : stats?.qualityProfile === 'high' ? 'عالي' : 'تلقائي';

  return (
    <div style={{
      padding: tokens.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.56)',
      borderRadius: tokens.borderRadius.lg,
      color: 'white',
      fontSize: tokens.typography.sizes.xs,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 190,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${healthColor}30`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#cbd5e1' }}>صحة البث</span>
        <span style={{ color: healthColor, fontWeight: 'bold' }}>{getArabicLabel(health)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <Metric label="Bitrate" value={`${Number(stats?.bitrate || 0)} kbps`} />
        <Metric label="Latency" value={`${Number(stats?.latency || 0)} ms`} />
        <Metric label="Packet loss" value={`${Number(stats?.packetLoss || 0).toFixed(1)}%`} />
        <Metric label="Profile" value={qualityLabel} />
        <Metric label="Sync" value={String(stats?.syncSessions ?? 0)} />
        <Metric label="Recovery" value={String(stats?.reconnectAttempts ?? 0)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
        <span>المشاهدين {Number(stats?.viewerCount || 0)}</span>
        <span>التسجيل {stats?.recordingStatus || 'idle'}</span>
      </div>

      <div style={{ height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(8, Math.min(100, Number(stats?.healthScore || 0)))}%`, backgroundColor: healthColor, transition: 'width 0.35s ease' }} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

StreamHealthMonitor.propTypes = {
  stats: PropTypes.shape({
    bitrate: PropTypes.number,
    packetLoss: PropTypes.number,
    latency: PropTypes.number,
    reconnectAttempts: PropTypes.number,
    syncSessions: PropTypes.number,
    recordingStatus: PropTypes.string,
    qualityProfile: PropTypes.string,
    viewerCount: PropTypes.number,
    healthScore: PropTypes.number,
  }),
};

StreamHealthMonitor.defaultProps = {
  stats: null,
};
