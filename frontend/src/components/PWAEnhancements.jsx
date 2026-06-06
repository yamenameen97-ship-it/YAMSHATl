/**
 * مكونات تحسين تجربة PWA
 */

import React, { useCallback } from 'react';
import {
  useConnectionStatus,
  useOfflineBanner,
  useInstallPrompt,
  useSyncStatus
} from '../hooks/usePWA';

/**
 * مكون شعار الأوفلاين
 */
export const OfflineBanner = () => {
  const { showBanner, bannerMessage, bannerType, closeBanner } = useOfflineBanner();

  if (!showBanner) return null;

  const colors = {
    warning: '#FF9500',
    success: '#34C759',
    error: '#FF3B30',
    info: '#007AFF'
  };

  return (
    <div style={{
      ...styles.banner,
      backgroundColor: colors[bannerType] || colors.warning
    }}>
      <span style={styles.bannerText}>{bannerMessage}</span>
      <button
        onClick={closeBanner}
        style={styles.bannerClose}
      >
        ✕
      </button>
    </div>
  );
};

/**
 * مكون مؤشر المزامنة
 */
export const SyncIndicator = () => {
  const { syncStatus, remainingItems, isSyncing } = useSyncStatus();

  if (syncStatus === 'idle') return null;

  return (
    <div style={styles.syncIndicator}>
      <div style={{
        ...styles.syncSpinner,
        animation: isSyncing ? 'spin 1s linear infinite' : 'none'
      }}>
        🔄
      </div>
      <span style={styles.syncText}>
        {isSyncing && `جاري المزامنة... (${remainingItems})`}
        {syncStatus === 'synced' && 'تمت المزامنة'}
        {syncStatus === 'partial' && `جزئي (${remainingItems} متبقي)`}
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * مكون زر التثبيت
 */
export const InstallPrompt = () => {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled || !canInstall) return null;

  const handleInstall = useCallback(async () => {
    const success = await promptInstall();
    if (success) {
      console.log('App installed successfully');
    }
  }, [promptInstall]);

  return (
    <button
      onClick={handleInstall}
      style={styles.installButton}
    >
      📲 تثبيت التطبيق
    </button>
  );
};

/**
 * مكون حالة الاتصال
 */
export const ConnectionStatus = () => {
  const { isOnline, queueSize } = useConnectionStatus();

  return (
    <div style={{
      ...styles.statusIndicator,
      backgroundColor: isOnline ? '#34C759' : '#FF3B30'
    }}>
      <span style={styles.statusDot}></span>
      <span style={styles.statusText}>
        {isOnline ? 'متصل' : 'غير متصل'}
        {!isOnline && queueSize > 0 && ` (${queueSize})`}
      </span>
    </div>
  );
};

/**
 * مكون شامل لتحسينات PWA
 */
export const PWAEnhancementsContainer = () => {
  return (
    <>
      <OfflineBanner />
      <SyncIndicator />
      <div style={styles.topRightContainer}>
        <ConnectionStatus />
        <InstallPrompt />
      </div>
    </>
  );
};

/**
 * الأنماط
 */
const styles = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '12px 20px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
    animation: 'slideDown 0.3s ease-out'
  },
  bannerText: {
    fontSize: '14px',
    fontWeight: '500'
  },
  bannerClose: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 10px'
  },
  syncIndicator: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 998
  },
  syncSpinner: {
    fontSize: '16px'
  },
  syncText: {
    fontSize: '12px',
    color: '#666'
  },
  installButton: {
    padding: '10px 16px',
    backgroundColor: '#007AFF',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 8px rgba(0,122,255,0.3)'
  },
  statusIndicator: {
    padding: '8px 12px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'inline-block'
  },
  statusText: {
    fontSize: '12px'
  },
  topRightContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    gap: '10px',
    zIndex: 997
  }
};

export default PWAEnhancementsContainer;
