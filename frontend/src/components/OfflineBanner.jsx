/**
 * مكون شعار الاتصال بلا اتصال
 * يوفر:
 * - إشعارات الاتصال والقطع
 * - مؤشرات إعادة المحاولة
 * - عرض حالة قائمة الانتظار
 * - حالة المزامنة
 */

import React, { useState, useEffect } from 'react';
import { useConnectionStatus, useOfflineQueue } from '../hooks/usePWA';

export const OfflineBanner = () => {
  const connectionStatus = useConnectionStatus();
  const offlineQueue = useOfflineQueue();
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState('info');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!connectionStatus.isOnline) {
      setShowBanner(true);
      setBannerType('warning');
      setMessage('أنت غير متصل بالإنترنت. سيتم حفظ التغييرات محلياً.');
    } else if (offlineQueue.queueSize > 0) {
      setShowBanner(true);
      setBannerType('info');
      setMessage(`جاري مزامنة ${offlineQueue.queueSize} عنصر...`);
    } else {
      setShowBanner(true);
      setBannerType('success');
      setMessage('تم استعادة الاتصال بنجاح ✓');
      setTimeout(() => setShowBanner(false), 3000);
    }
  }, [connectionStatus.isOnline, offlineQueue.queueSize]);

  if (!showBanner) return null;

  return (
    <div style={{...styles.banner, ...styles[bannerType]}}>
      <div style={styles.bannerContent}>
        <span style={styles.bannerIcon}>
          {bannerType === 'warning' && '📡'}
          {bannerType === 'success' && '✓'}
          {bannerType === 'info' && '🔄'}
        </span>
        <span style={styles.bannerMessage}>{message}</span>
        {offlineQueue.queueSize > 0 && (
          <button
            onClick={offlineQueue.processQueue}
            style={styles.retryButton}
            disabled={offlineQueue.isProcessing}
          >
            {offlineQueue.isProcessing ? 'جاري المزامنة...' : 'مزامنة الآن'}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * مكون مؤشر الاتصال
 */
export const ConnectionIndicator = () => {
  const connectionStatus = useConnectionStatus();

  const getConnectionText = () => {
    if (!connectionStatus.isOnline) return 'بلا اتصال';
    
    const typeMap = {
      '4g': '4G',
      '3g': '3G',
      '2g': '2G',
      'wifi': 'WiFi',
      'ethernet': 'Ethernet'
    };

    return typeMap[connectionStatus.effectiveType] || connectionStatus.effectiveType;
  };

  const getConnectionColor = () => {
    if (!connectionStatus.isOnline) return '#F44336';
    if (connectionStatus.effectiveType === '4g') return '#4CAF50';
    if (connectionStatus.effectiveType === '3g') return '#FF9800';
    return '#FFC107';
  };

  return (
    <div style={{...styles.indicator, backgroundColor: getConnectionColor()}}>
      <span style={styles.indicatorDot} />
      <span style={styles.indicatorText}>{getConnectionText()}</span>
      {connectionStatus.saveData && <span style={styles.saveDataBadge}>💾</span>}
    </div>
  );
};

/**
 * مكون حالة قائمة الانتظار
 */
export const QueueStatus = () => {
  const offlineQueue = useOfflineQueue();

  if (offlineQueue.queueSize === 0) return null;

  return (
    <div style={styles.queueStatus}>
      <span style={styles.queueIcon}>📦</span>
      <span style={styles.queueText}>
        {offlineQueue.queueSize} عنصر في الانتظار
      </span>
      <div style={styles.queueProgress}>
        <div style={{...styles.queueProgressBar, width: '30%'}} />
      </div>
    </div>
  );
};

/**
 * مكون شاشة التثبيت
 */
export const InstallPromptScreen = () => {
  const { canInstall, isInstalled, showInstallPrompt } = require('../hooks/usePWA').useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);

  if (!canInstall || isInstalled) return null;

  return (
    <div style={styles.installPromptOverlay}>
      <div style={styles.installPromptCard}>
        <h2 style={styles.installPromptTitle}>تثبيت التطبيق</h2>
        <p style={styles.installPromptText}>
          يمكنك تثبيت التطبيق على جهازك للوصول السريع والعمل بلا اتصال
        </p>
        <div style={styles.installPromptButtons}>
          <button
            onClick={async () => {
              await showInstallPrompt();
              setShowPrompt(false);
            }}
            style={{...styles.installButton, backgroundColor: '#2196F3'}}
          >
            تثبيت الآن
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            style={{...styles.installButton, backgroundColor: '#999'}}
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * الأنماط
 */
const styles = {
  banner: {
    position: 'fixed',
    top: 'env(safe-area-inset-top, 0px)',
    left: 0,
    right: 0,
    padding: '8px 16px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'slideDown 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  warning: {
    backgroundColor: 'rgba(255, 243, 205, 0.9)',
    color: '#856404',
    borderBottom: '1px solid rgba(255, 193, 7, 0.3)'
  },
  success: {
    backgroundColor: 'rgba(212, 237, 218, 0.9)',
    color: '#155724',
    borderBottom: '1px solid rgba(76, 175, 80, 0.3)'
  },
  info: {
    backgroundColor: 'rgba(209, 236, 241, 0.9)',
    color: '#0C5460',
    borderBottom: '1px solid rgba(23, 162, 184, 0.3)'
  },
  error: {
    backgroundColor: '#F8D7DA',
    color: '#721C24',
    borderBottom: '2px solid #F44336'
  },
  bannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '1200px',
    width: '100%'
  },
  bannerIcon: {
    fontSize: '18px'
  },
  bannerMessage: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500'
  },
  retryButton: {
    padding: '6px 12px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  },
  indicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  indicatorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    animation: 'pulse 2s infinite'
  },
  indicatorText: {
    marginRight: '4px'
  },
  saveDataBadge: {
    marginLeft: '4px'
  },
  queueStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#E3F2FD',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#1976D2'
  },
  queueIcon: {
    fontSize: '14px'
  },
  queueText: {
    fontWeight: '500'
  },
  queueProgress: {
    width: '60px',
    height: '4px',
    backgroundColor: 'rgba(25, 118, 210, 0.2)',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  queueProgressBar: {
    height: '100%',
    backgroundColor: '#1976D2',
    animation: 'progress 1s ease-in-out infinite'
  },
  installPromptOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  installPromptCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '400px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'slideUp 0.3s ease-out'
  },
  installPromptTitle: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333'
  },
  installPromptText: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5'
  },
  installPromptButtons: {
    display: 'flex',
    gap: '12px'
  },
  installButton: {
    flex: 1,
    padding: '12px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s'
  }
};

// إضافة الرسوميات
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes progress {
    0% {
      width: 0;
    }
    50% {
      width: 100%;
    }
    100% {
      width: 0;
    }
  }
`;
document.head.appendChild(styleSheet);

export default OfflineBanner;
