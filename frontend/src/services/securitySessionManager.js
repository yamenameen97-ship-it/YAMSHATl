/**
 * مدير الأمان والجلسات
 * توفر:
 * - إدارة الأجهزة الموثوقة
 * - عرض الجلسات النشطة
 * - تنبيهات تسجيل الدخول المريبة
 * - إدارة الجلسات المتقدمة
 * - تحديث التوكن التلقائي
 * - معالجة انتهاء الصلاحية
 * - استعادة الاتصال
 */

export class SecuritySessionManager {
  constructor() {
    this.currentSession = null;
    this.activeSessions = [];
    this.trustedDevices = [];
    this.suspiciousLogins = [];
    this.tokenRefreshInterval = null;
    this.listeners = new Map();
    this.config = {
      tokenRefreshTime: 15 * 60 * 1000, // 15 دقيقة
      sessionTimeout: 30 * 60 * 1000, // 30 دقيقة
      enableAutoRefresh: true,
      enableSuspiciousLoginDetection: true,
      enableDeviceTrust: true
    };

    this.initializeSessionManagement();
  }

  /**
   * تهيئة إدارة الجلسات
   */
  initializeSessionManagement() {
    // استعادة الجلسة من التخزين المحلي
    this.restoreSession();

    // بدء تحديث التوكن التلقائي
    if (this.config.enableAutoRefresh) {
      this.startAutoTokenRefresh();
    }

    // مراقبة نشاط المستخدم
    this.monitorUserActivity();

    // مراقبة الاتصال
    this.monitorConnection();
  }

  /**
   * استعادة الجلسة من التخزين
   */
  restoreSession() {
    try {
      const sessionData = sessionStorage.getItem('currentSession');
      if (sessionData) {
        this.currentSession = JSON.parse(sessionData);
        this.emit('sessionRestored', this.currentSession);
      }
    } catch (error) {
      console.error('Error restoring session:', error);
    }
  }

  /**
   * تعيين الجلسة الحالية
   */
  setCurrentSession(sessionData) {
    this.currentSession = {
      ...sessionData,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    // حفظ الجلسة
    try {
      sessionStorage.setItem('currentSession', JSON.stringify(this.currentSession));
    } catch (error) {
      console.warn('Error saving session:', error);
    }

    this.emit('sessionCreated', this.currentSession);
  }

  /**
   * بدء تحديث التوكن التلقائي
   */
  startAutoTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    this.tokenRefreshInterval = setInterval(() => {
      this.refreshToken();
    }, this.config.tokenRefreshTime);
  }

  /**
   * تحديث التوكن
   */
  async refreshToken() {
    if (!this.currentSession || !this.currentSession.refreshToken) {
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.currentSession.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.currentSession.accessToken = data.accessToken;
        this.currentSession.lastRefresh = Date.now();

        // حفظ الجلسة المحدثة
        sessionStorage.setItem('currentSession', JSON.stringify(this.currentSession));

        this.emit('tokenRefreshed', {
          timestamp: Date.now()
        });
      } else if (response.status === 401) {
        // انتهت صلاحية التوكن
        this.handleTokenExpiry();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.emit('tokenRefreshError', error);
    }
  }

  /**
   * معالجة انتهاء صلاحية التوكن
   */
  handleTokenExpiry() {
    this.emit('tokenExpired', {
      timestamp: Date.now()
    });

    // تنظيف الجلسة
    this.clearSession();
  }

  /**
   * مراقبة نشاط المستخدم
   */
  monitorUserActivity() {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.currentSession) {
          this.currentSession.lastActivity = Date.now();
        }
      }, { passive: true });
    });
  }

  /**
   * مراقبة الاتصال
   */
  monitorConnection() {
    window.addEventListener('online', () => {
      this.emit('connectionRestored');
      // محاولة تحديث التوكن عند استعادة الاتصال
      if (this.currentSession) {
        this.refreshToken();
      }
    });

    window.addEventListener('offline', () => {
      this.emit('connectionLost');
    });
  }

  /**
   * إضافة جهاز موثوق
   */
  async trustDevice(deviceInfo) {
    try {
      const response = await fetch('/api/security/trust-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        },
        body: JSON.stringify(deviceInfo)
      });

      if (response.ok) {
        const data = await response.json();
        this.trustedDevices.push(data);
        this.emit('deviceTrusted', data);
        return true;
      }
    } catch (error) {
      console.error('Error trusting device:', error);
    }

    return false;
  }

  /**
   * الحصول على الأجهزة الموثوقة
   */
  async getTrustedDevices() {
    try {
      const response = await fetch('/api/security/trusted-devices', {
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        }
      });

      if (response.ok) {
        this.trustedDevices = await response.json();
        this.emit('trustedDevicesLoaded', this.trustedDevices);
        return this.trustedDevices;
      }
    } catch (error) {
      console.error('Error fetching trusted devices:', error);
    }

    return [];
  }

  /**
   * إزالة جهاز موثوق
   */
  async untrustDevice(deviceId) {
    try {
      const response = await fetch(`/api/security/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        }
      });

      if (response.ok) {
        this.trustedDevices = this.trustedDevices.filter(d => d.id !== deviceId);
        this.emit('deviceUntrusted', { deviceId });
        return true;
      }
    } catch (error) {
      console.error('Error untrusting device:', error);
    }

    return false;
  }

  /**
   * الحصول على الجلسات النشطة
   */
  async getActiveSessions() {
    try {
      const response = await fetch('/api/security/active-sessions', {
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        }
      });

      if (response.ok) {
        this.activeSessions = await response.json();
        this.emit('activeSessionsLoaded', this.activeSessions);
        return this.activeSessions;
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }

    return [];
  }

  /**
   * إنهاء جلسة
   */
  async terminateSession(sessionId) {
    try {
      const response = await fetch(`/api/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        }
      });

      if (response.ok) {
        this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
        this.emit('sessionTerminated', { sessionId });
        return true;
      }
    } catch (error) {
      console.error('Error terminating session:', error);
    }

    return false;
  }

  /**
   * كشف تسجيلات دخول مريبة
   */
  async checkSuspiciousLogins() {
    if (!this.config.enableSuspiciousLoginDetection) return;

    try {
      const response = await fetch('/api/security/suspicious-logins', {
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        }
      });

      if (response.ok) {
        this.suspiciousLogins = await response.json();
        if (this.suspiciousLogins.length > 0) {
          this.emit('suspiciousLoginsDetected', this.suspiciousLogins);
        }
      }
    } catch (error) {
      console.error('Error checking suspicious logins:', error);
    }
  }

  /**
   * تأكيد تسجيل دخول
   */
  async confirmLogin(loginId) {
    try {
      const response = await fetch(`/api/security/suspicious-logins/${loginId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        }
      });

      if (response.ok) {
        this.suspiciousLogins = this.suspiciousLogins.filter(l => l.id !== loginId);
        this.emit('loginConfirmed', { loginId });
        return true;
      }
    } catch (error) {
      console.error('Error confirming login:', error);
    }

    return false;
  }

  /**
   * رفض تسجيل دخول
   */
  async denyLogin(loginId) {
    try {
      const response = await fetch(`/api/security/suspicious-logins/${loginId}/deny`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentSession.accessToken}`
        }
      });

      if (response.ok) {
        this.suspiciousLogins = this.suspiciousLogins.filter(l => l.id !== loginId);
        this.emit('loginDenied', { loginId });
        return true;
      }
    } catch (error) {
      console.error('Error denying login:', error);
    }

    return false;
  }

  /**
   * الحصول على معلومات الجلسة الحالية
   */
  getCurrentSessionInfo() {
    return {
      ...this.currentSession,
      isValid: this.isSessionValid(),
      timeRemaining: this.getSessionTimeRemaining()
    };
  }

  /**
   * التحقق من صحة الجلسة
   */
  isSessionValid() {
    if (!this.currentSession) return false;

    const now = Date.now();
    const lastActivity = this.currentSession.lastActivity || 0;
    const timeSinceLastActivity = now - lastActivity;

    return timeSinceLastActivity < this.config.sessionTimeout;
  }

  /**
   * الحصول على الوقت المتبقي للجلسة
   */
  getSessionTimeRemaining() {
    if (!this.currentSession) return 0;

    const now = Date.now();
    const lastActivity = this.currentSession.lastActivity || 0;
    const timeSinceLastActivity = now - lastActivity;
    const timeRemaining = this.config.sessionTimeout - timeSinceLastActivity;

    return Math.max(0, timeRemaining);
  }

  /**
   * تنظيف الجلسة
   */
  clearSession() {
    this.currentSession = null;
    sessionStorage.removeItem('currentSession');
    this.emit('sessionCleared');
  }

  /**
   * تسجيل الخروج
   */
  async logout() {
    try {
      if (this.currentSession) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentSession.accessToken}`
          }
        });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      this.clearSession();
      if (this.tokenRefreshInterval) {
        clearInterval(this.tokenRefreshInterval);
      }
    }
  }

  /**
   * تسجيل مستمع
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    return () => {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * إطلاق حدث
   */
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => callback(data));
  }

  /**
   * تنظيف الخدمة
   */
  cleanup() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
    this.listeners.clear();
  }
}

// إنشاء مثيل عام
export const securitySessionManager = new SecuritySessionManager();
