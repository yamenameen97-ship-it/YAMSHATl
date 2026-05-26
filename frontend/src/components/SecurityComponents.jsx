/**
 * مكونات الأمان والجلسات
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { securitySessionManager } from '../services/securitySessionManager';

/**
 * مكون عرض الأجهزة الموثوقة
 */
export const TrustedDevicesPanel = () => {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      setIsLoading(true);
      const loadedDevices = await securitySessionManager.getTrustedDevices();
      setDevices(loadedDevices);
      setIsLoading(false);
    };

    loadDevices();

    const unsubscribe = securitySessionManager.on('trustedDevicesLoaded', (newDevices) => {
      setDevices(newDevices);
    });

    return () => unsubscribe?.();
  }, []);

  const handleRemoveDevice = useCallback(async (deviceId) => {
    if (confirm('هل أنت متأكد من إزالة هذا الجهاز؟')) {
      await securitySessionManager.untrustDevice(deviceId);
    }
  }, []);

  if (isLoading) {
    return <div style={styles.container}>جاري التحميل...</div>;
  }

  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>الأجهزة الموثوقة</h3>
      <div style={styles.devicesList}>
        {devices.map(device => (
          <div key={device.id} style={styles.deviceItem}>
            <div style={styles.deviceInfo}>
              <div style={styles.deviceName}>
                {device.name} {device.isCurrent && '(الجهاز الحالي)'}
              </div>
              <div style={styles.deviceDetails}>
                {device.browser} • {device.os}
              </div>
              <div style={styles.deviceTime}>
                آخر استخدام: {formatDate(device.lastUsed)}
              </div>
            </div>
            {!device.isCurrent && (
              <button
                onClick={() => handleRemoveDevice(device.id)}
                style={styles.removeButton}
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * مكون عرض الجلسات النشطة
 */
export const ActiveSessionsPanel = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      const loadedSessions = await securitySessionManager.getActiveSessions();
      setSessions(loadedSessions);
      setIsLoading(false);
    };

    loadSessions();

    const unsubscribe = securitySessionManager.on('activeSessionsLoaded', (newSessions) => {
      setSessions(newSessions);
    });

    return () => unsubscribe?.();
  }, []);

  const handleTerminateSession = useCallback(async (sessionId) => {
    if (confirm('هل أنت متأكد من إنهاء هذه الجلسة؟')) {
      await securitySessionManager.terminateSession(sessionId);
    }
  }, []);

  if (isLoading) {
    return <div style={styles.container}>جاري التحميل...</div>;
  }

  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>الجلسات النشطة</h3>
      <div style={styles.sessionsList}>
        {sessions.map(session => (
          <div key={session.id} style={styles.sessionItem}>
            <div style={styles.sessionInfo}>
              <div style={styles.sessionLocation}>
                📍 {session.location}
              </div>
              <div style={styles.sessionDetails}>
                {session.device} • {session.browser}
              </div>
              <div style={styles.sessionTime}>
                آخر نشاط: {formatDate(session.lastActivity)}
              </div>
            </div>
            {!session.isCurrent && (
              <button
                onClick={() => handleTerminateSession(session.id)}
                style={styles.terminateButton}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * مكون تنبيهات تسجيلات الدخول المريبة
 */
export const SuspiciousLoginsAlert = () => {
  const [logins, setLogins] = useState([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const checkLogins = async () => {
      await securitySessionManager.checkSuspiciousLogins();
    };

    checkLogins();

    const unsubscribe = securitySessionManager.on('suspiciousLoginsDetected', (newLogins) => {
      setLogins(newLogins);
      setShowAlert(true);
    });

    return () => unsubscribe?.();
  }, []);

  const handleConfirmLogin = useCallback(async (loginId) => {
    await securitySessionManager.confirmLogin(loginId);
  }, []);

  const handleDenyLogin = useCallback(async (loginId) => {
    await securitySessionManager.denyLogin(loginId);
  }, []);

  if (!showAlert || logins.length === 0) {
    return null;
  }

  return (
    <div style={styles.alertContainer}>
      <div style={styles.alert}>
        <div style={styles.alertHeader}>
          <span style={styles.alertTitle}>⚠️ تنبيه أمان</span>
          <button
            onClick={() => setShowAlert(false)}
            style={styles.alertClose}
          >
            ✕
          </button>
        </div>

        <div style={styles.alertContent}>
          <p>تم كشف محاولات تسجيل دخول مريبة:</p>
          {logins.map(login => (
            <div key={login.id} style={styles.loginItem}>
              <div style={styles.loginInfo}>
                <div style={styles.loginLocation}>
                  📍 {login.location}
                </div>
                <div style={styles.loginTime}>
                  {formatDate(login.timestamp)}
                </div>
                <div style={styles.loginDevice}>
                  {login.device} • {login.browser}
                </div>
              </div>
              <div style={styles.loginActions}>
                <button
                  onClick={() => handleConfirmLogin(login.id)}
                  style={{...styles.actionButton, backgroundColor: '#34C759'}}
                >
                  ✓ تأكيد
                </button>
                <button
                  onClick={() => handleDenyLogin(login.id)}
                  style={{...styles.actionButton, backgroundColor: '#FF3B30'}}
                >
                  ✕ رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * مكون مؤشر انتهاء الجلسة
 */
export const SessionExpiryIndicator = () => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = securitySessionManager.getSessionTimeRemaining();
      setTimeRemaining(remaining);

      // عرض تحذير عندما يتبقى 5 دقائق
      if (remaining > 0 && remaining < 5 * 60 * 1000) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showWarning || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div style={styles.expiryWarning}>
      <span style={styles.expiryText}>
        ⏰ ستنتهي جلستك في {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

/**
 * مكون شامل للأمان والجلسات
 */
export const SecurityPanel = () => {
  const [activeTab, setActiveTab] = useState('devices');

  return (
    <div style={styles.securityPanel}>
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('devices')}
          style={{
            ...styles.tab,
            borderBottom: activeTab === 'devices' ? '2px solid #007AFF' : 'none'
          }}
        >
          الأجهزة الموثوقة
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            ...styles.tab,
            borderBottom: activeTab === 'sessions' ? '2px solid #007AFF' : 'none'
          }}
        >
          الجلسات النشطة
        </button>
      </div>

      <div style={styles.tabContent}>
        {activeTab === 'devices' && <TrustedDevicesPanel />}
        {activeTab === 'sessions' && <ActiveSessionsPanel />}
      </div>

      <SuspiciousLoginsAlert />
      <SessionExpiryIndicator />
    </div>
  );
};

/**
 * تنسيق التاريخ
 */
function formatDate(date) {
  return new Date(date).toLocaleString('ar-SA');
}

/**
 * الأنماط
 */
const styles = {
  container: {
    padding: '20px',
    textAlign: 'center'
  },
  securityPanel: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  tabs: {
    display: 'flex',
    gap: '20px',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '10px 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666'
  },
  tabContent: {
    marginTop: '20px'
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px'
  },
  panelTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  devicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  deviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    borderLeft: '3px solid #007AFF'
  },
  deviceInfo: {
    flex: 1
  },
  deviceName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  deviceDetails: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px'
  },
  deviceTime: {
    fontSize: '12px',
    color: '#999'
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px'
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    borderLeft: '3px solid #34C759'
  },
  sessionInfo: {
    flex: 1
  },
  sessionLocation: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  sessionDetails: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px'
  },
  sessionTime: {
    fontSize: '12px',
    color: '#999'
  },
  terminateButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    color: '#FF3B30'
  },
  alertContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    maxWidth: '400px'
  },
  alert: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    overflow: 'hidden'
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#FF3B30',
    color: '#fff'
  },
  alertTitle: {
    fontWeight: '600'
  },
  alertClose: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px'
  },
  alertContent: {
    padding: '16px'
  },
  loginItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    marginTop: '12px'
  },
  loginInfo: {
    flex: 1
  },
  loginLocation: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  loginTime: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px'
  },
  loginDevice: {
    fontSize: '12px',
    color: '#999'
  },
  loginActions: {
    display: 'flex',
    gap: '8px',
    marginLeft: '12px'
  },
  actionButton: {
    padding: '6px 12px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  expiryWarning: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#FF9500',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 999
  },
  expiryText: {
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default SecurityPanel;
