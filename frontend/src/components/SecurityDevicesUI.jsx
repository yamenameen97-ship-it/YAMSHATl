/**
 * مكون واجهة الأمان - عرض الأجهزة والجلسات
 * يوفر:
 * - عرض الأجهزة الموثوقة
 * - عرض الجلسات النشطة
 * - تنبيهات تسجيل الدخول المريب
 * - إدارة الجلسات
 */

import React, { useState, useEffect, useCallback } from 'react';
import { securitySessionManager } from '../services/securitySessionManager';
import API from '../api/axios.js';

export const SecurityDevicesUI = () => {
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [suspiciousLogins, setSuspiciousLogins] = useState([]);
  const [selectedTab, setSelectedTab] = useState('devices');
  const [loading, setLoading] = useState(true);

  /**
   * جلب البيانات الأمنية
   */
  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);

      // جلب الأجهزة الموثوقة
      const devicesResponse = await API.get('/security/trusted-devices');
      setTrustedDevices(devicesResponse.data);

      // جلب الجلسات النشطة
      const sessionsResponse = await API.get('/security/active-sessions');
      setActiveSessions(sessionsResponse.data);

      // جلب تسجيلات الدخول المريبة
      const loginsResponse = await API.get('/security/suspicious-logins');
      setSuspiciousLogins(loginsResponse.data);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * إزالة جهاز موثوق
   */
  const removeDevice = useCallback(async (deviceId) => {
    try {
      await API.delete(`/security/trusted-devices/${deviceId}`);
      setTrustedDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (error) {
      console.error('Error removing device:', error);
    }
  }, []);

  /**
   * إنهاء جلسة
   */
  const terminateSession = useCallback(async (sessionId) => {
    try {
      await API.post(`/security/sessions/${sessionId}/terminate`);
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }, []);

  /**
   * تأكيد تسجيل دخول مريب
   */
  const confirmSuspiciousLogin = useCallback(async (loginId) => {
    try {
      await API.post(`/security/suspicious-logins/${loginId}/confirm`);
      setSuspiciousLogins(prev => prev.filter(l => l.id !== loginId));
    } catch (error) {
      console.error('Error confirming login:', error);
    }
  }, []);

  /**
   * رفض تسجيل دخول مريب
   */
  const denySuspiciousLogin = useCallback(async (loginId) => {
    try {
      await API.post(`/security/suspicious-logins/${loginId}/deny`);
      setSuspiciousLogins(prev => prev.filter(l => l.id !== loginId));
    } catch (error) {
      console.error('Error denying login:', error);
    }
  }, []);

  // جلب البيانات عند التحميل
  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, [fetchSecurityData]);

  if (loading) {
    return <div style={styles.loading}>جاري التحميل...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>الأمان والخصوصية</h1>

      {/* التنبيهات */}
      {suspiciousLogins.length > 0 && (
        <div style={styles.alertSection}>
          <h2 style={styles.alertTitle}>⚠️ تنبيهات أمنية</h2>
          <div style={styles.alertsList}>
            {suspiciousLogins.map(login => (
              <div key={login.id} style={styles.alertItem}>
                <div style={styles.alertContent}>
                  <p style={styles.alertMessage}>
                    تسجيل دخول من {login.location || 'موقع غير معروف'} في {formatTime(login.timestamp)}
                  </p>
                  <p style={styles.alertDetails}>
                    الجهاز: {login.deviceName || 'جهاز غير معروف'} | الخطورة: {login.severity}%
                  </p>
                </div>
                <div style={styles.alertActions}>
                  <button
                    onClick={() => confirmSuspiciousLogin(login.id)}
                    style={{...styles.alertButton, backgroundColor: '#4CAF50'}}
                  >
                    هذا أنا
                  </button>
                  <button
                    onClick={() => denySuspiciousLogin(login.id)}
                    style={{...styles.alertButton, backgroundColor: '#F44336'}}
                  >
                    ليس أنا
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* التبويبات */}
      <div style={styles.tabs}>
        <button
          onClick={() => setSelectedTab('devices')}
          style={{...styles.tab, ...( selectedTab === 'devices' ? styles.tabActive : {})}}
        >
          الأجهزة الموثوقة ({trustedDevices.length})
        </button>
        <button
          onClick={() => setSelectedTab('sessions')}
          style={{...styles.tab, ...(selectedTab === 'sessions' ? styles.tabActive : {})}}
        >
          الجلسات النشطة ({activeSessions.length})
        </button>
      </div>

      {/* محتوى التبويبات */}
      {selectedTab === 'devices' && (
        <div style={styles.tabContent}>
          <h2 style={styles.sectionTitle}>الأجهزة الموثوقة</h2>
          <p style={styles.sectionDescription}>
            هذه الأجهزة لن تحتاج إلى التحقق الثنائي عند تسجيل الدخول
          </p>

          {trustedDevices.length === 0 ? (
            <div style={styles.emptyState}>
              <p>لا توجد أجهزة موثوقة</p>
            </div>
          ) : (
            <div style={styles.devicesList}>
              {trustedDevices.map(device => (
                <div key={device.id} style={styles.deviceCard}>
                  <div style={styles.deviceHeader}>
                    <span style={styles.deviceIcon}>{getDeviceIcon(device.type)}</span>
                    <div style={styles.deviceInfo}>
                      <h3 style={styles.deviceName}>{device.name}</h3>
                      <p style={styles.deviceMeta}>
                        {device.type} • {device.os} • {device.browser}
                      </p>
                    </div>
                  </div>

                  <div style={styles.deviceDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>آخر استخدام:</span>
                      <span style={styles.detailValue}>{formatTime(device.lastUsed)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>موثوق منذ:</span>
                      <span style={styles.detailValue}>{formatDate(device.trustedAt)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>الموقع:</span>
                      <span style={styles.detailValue}>{device.location || 'غير محدد'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeDevice(device.id)}
                    style={styles.removeButton}
                  >
                    إزالة الثقة
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'sessions' && (
        <div style={styles.tabContent}>
          <h2 style={styles.sectionTitle}>الجلسات النشطة</h2>
          <p style={styles.sectionDescription}>
            جميع الأجهزة التي تم تسجيل الدخول فيها حالياً
          </p>

          {activeSessions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>لا توجد جلسات نشطة</p>
            </div>
          ) : (
            <div style={styles.sessionsList}>
              {activeSessions.map(session => (
                <div key={session.id} style={styles.sessionCard}>
                  <div style={styles.sessionHeader}>
                    <span style={styles.sessionIcon}>{getDeviceIcon(session.deviceType)}</span>
                    <div style={styles.sessionInfo}>
                      <h3 style={styles.sessionName}>{session.deviceName}</h3>
                      <p style={styles.sessionMeta}>
                        {session.browser} • {session.os}
                      </p>
                    </div>
                    {session.isCurrent && (
                      <span style={styles.currentBadge}>الجهاز الحالي</span>
                    )}
                  </div>

                  <div style={styles.sessionDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>تسجيل الدخول:</span>
                      <span style={styles.detailValue}>{formatTime(session.loginTime)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>آخر نشاط:</span>
                      <span style={styles.detailValue}>{formatTime(session.lastActivity)}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>الموقع:</span>
                      <span style={styles.detailValue}>{session.location || 'غير محدد'}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>عنوان IP:</span>
                      <span style={styles.detailValue}>{session.ipAddress}</span>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      onClick={() => terminateSession(session.id)}
                      style={styles.terminateButton}
                    >
                      إنهاء الجلسة
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * دوال مساعدة
 */
function getDeviceIcon(type) {
  const iconMap = {
    'mobile': '📱',
    'tablet': '📱',
    'desktop': '💻',
    'laptop': '💻',
    'other': '🖥️'
  };
  return iconMap[type] || '🖥️';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  if (diffDays < 7) return `قبل ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * الأنماط
 */
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#999'
  },
  alertSection: {
    marginBottom: '30px',
    backgroundColor: '#FFF3CD',
    border: '1px solid #FFC107',
    borderRadius: '8px',
    padding: '20px'
  },
  alertTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#856404'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  alertItem: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeft: '4px solid #FFC107'
  },
  alertContent: {
    flex: 1
  },
  alertMessage: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  alertDetails: {
    margin: 0,
    fontSize: '12px',
    color: '#666'
  },
  alertActions: {
    display: 'flex',
    gap: '10px',
    marginLeft: '15px'
  },
  alertButton: {
    padding: '8px 12px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #ddd'
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s'
  },
  tabActive: {
    color: '#2196F3',
    borderBottomColor: '#2196F3'
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  sectionDescription: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999'
  },
  devicesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  deviceCard: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '15px'
  },
  deviceHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    alignItems: 'flex-start'
  },
  deviceIcon: {
    fontSize: '28px'
  },
  deviceInfo: {
    flex: 1
  },
  deviceName: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  deviceMeta: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  deviceDetails: {
    marginBottom: '12px'
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sessionCard: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '15px'
  },
  sessionHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    alignItems: 'center'
  },
  sessionIcon: {
    fontSize: '28px'
  },
  sessionInfo: {
    flex: 1
  },
  sessionName: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  sessionMeta: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  sessionDetails: {
    marginBottom: '12px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px'
  },
  detailLabel: {
    fontWeight: '500',
    color: '#666'
  },
  detailValue: {
    color: '#333'
  },
  removeButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  terminateButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default SecurityDevicesUI;
