import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';

/**
 * StreamHealthMonitor Component
 * Monitors and displays the health status of a live stream
 */
const StreamHealthMonitor = ({ stats }) => {
  const [health, setHealth] = useState('excellent'); // excellent, good, poor, critical

  useEffect(() => {
    if (!stats) return;

    // Logic to determine health based on bitrate, packet loss, and latency
    const { bitrate, packetLoss, latency } = stats;
    
    if (packetLoss > 10 || latency > 500) {
      setHealth('critical');
    } else if (packetLoss > 5 || latency > 300 || bitrate < 500) {
      setHealth('poor');
    } else if (packetLoss > 1 || latency > 150 || bitrate < 1000) {
      setHealth('good');
    } else {
      setHealth('excellent');
    }
  }, [stats]);

  const getHealthColor = () => {
    switch (health) {
      case 'excellent': return tokens.colors.success;
      case 'good': return tokens.colors.warning;
      case 'poor': return '#f97316'; // orange
      case 'critical': return tokens.colors.error;
      default: return tokens.colors.secondary[500];
    }
  };

  const getHealthLabel = () => {
    switch (health) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'poor': return 'ضعيف';
      case 'critical': return 'سيء جداً';
      default: return 'غير معروف';
    }
  };

  return (
    <div style={{
      padding: tokens.spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: tokens.borderRadius.md,
      color: 'white',
      fontSize: tokens.typography.sizes.xs,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '120px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>حالة البث:</span>
        <span style={{ color: getHealthColor(), fontWeight: 'bold' }}>{getHealthLabel()}</span>
      </div>
      
      {stats && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bitrate:</span>
            <span>{stats.bitrate} kbps</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Latency:</span>
            <span>{stats.latency} ms</span>
          </div>
          <div style={{ 
            height: '4px', 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: '2px',
            marginTop: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              width: health === 'excellent' ? '100%' : health === 'good' ? '70%' : health === 'poor' ? '40%' : '15%',
              backgroundColor: getHealthColor(),
              transition: 'width 0.5s ease'
            }} />
          </div>
        </>
      )}
    </div>
  );
};

StreamHealthMonitor.propTypes = {
  stats: PropTypes.shape({
    bitrate: PropTypes.number,
    packetLoss: PropTypes.number,
    latency: PropTypes.number,
  }),
};

export default StreamHealthMonitor;
