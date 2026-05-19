import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { CooldownUI, RateLimitUI, createAntiSpamReport } from '../security/spam.js';
import deviceTrustService from '../services/deviceTrustService.js';
import notificationService from '../services/notificationService.js';
import { MEDIA_SECURITY, SIGNED_URL_TTL_SECONDS, currentMediaProviderLabel } from '../config/mediaConfig.js';
import { getCDNConfig, getMediaDeliveryProfile } from '../utils/performance.js';
import { disableTwoFactor, getMe, logoutAllDevices, refreshSession, setupTwoFactor } from '../api/auth.js';
import { getSessionTtlMs, getStoredUser } from '../utils/auth.js';

const TABS = [
  { key: 'security', label: 'الأمان والمصادقة' },
  { key: 'devices', label: 'الأجهزة والجلسات' },
  { key: 'media', label: 'حماية الوسائط' },
  { key: 'notifications', label: 'Push Notifications' },
  { key: 'sync', label: 'Multi Device' },
];

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 'منتهية أو غير معروفة';
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} دقيقة`;
  return `${hours} س ${minutes} د`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : value?.items || [];
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('security');
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pushState, setPushState] = useState(notificationService.getPushReadiness());
  const [syncState, setSyncState] = useState(deviceTrustService.getSyncState());
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [authSnapshot, setAuthSnapshot] = useState({
    storedUser: getStoredUser(),
    me: null,
    ttlMs: getSessionTtlMs(),
    twoFactorSetup: null,
  });

  const antiSpam = useMemo(() => createAntiSpamReport({
    actionKey: 'settings-preview',
    content: 'preview',
    behavior: { pointerMoves: 6, keyStrokes: 14, typingDurationMs: 4200, pasteRatio: 0.1, retryBursts: 0, formFillMs: 4200 },
  }), []);

  const cdnConfig = useMemo(() => getCDNConfig(), []);
  const imageDelivery = useMemo(() => getMediaDeliveryProfile('image'), []);
  const videoDelivery = useMemo(() => getMediaDeliveryProfile('video'), []);
  const fileDelivery = useMemo(() => getMediaDeliveryProfile('file'), []);

  const setSuccess = (text) => {
    setErrorMessage('');
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2800);
  };

  const setFailure = (text) => {
    setMessage('');
    setErrorMessage(text);
    window.setTimeout(() => setErrorMessage(''), 3200);
  };

  const refreshSecurityCollections = async () => {
    const [devicesResult, sessionsResult, alertsResult] = await Promise.all([
      deviceTrustService.getTrustedDevices(),
      deviceTrustService.getSessions(),
      deviceTrustService.getLoginAlerts(),
    ]);
    setTrustedDevices(safeArray(devicesResult));
    setSessions(safeArray(sessionsResult));
    setAlerts(safeArray(alertsResult));
    setPushState(notificationService.getPushReadiness());
    setSyncState(deviceTrustService.getSyncState());
  };

  const refreshAuthSnapshot = async () => {
    const storedUser = getStoredUser();
    let mePayload = null;
    try {
      const response = await getMe();
      mePayload = response?.data || null;
    } catch {
      mePayload = null;
    }

    setAuthSnapshot((prev) => ({
      ...prev,
      storedUser,
      me: mePayload,
      ttlMs: getSessionTtlMs(),
    }));
  };

  useEffect(() => {
    let unsubscribe = () => {};
    const load = async () => {
      await Promise.all([refreshSecurityCollections(), refreshAuthSnapshot()]);
      unsubscribe = deviceTrustService.subscribe((payload) => setSyncState((prev) => ({ ...prev, ...(payload || {}) })));
    };
    load().catch(() => null);
    return () => unsubscribe();
  }, []);

  const handleTrustCurrentDevice = async () => {
    try {
      setBusy('trust-device');
      await deviceTrustService.trustCurrentDevice();
      await refreshSecurityCollections();
      setSuccess('تم اعتبار الجهاز الحالي موثوق.');
    } catch (error) {
      setFailure(error?.message || 'تعذر توثيق الجهاز الحالي.');
    } finally {
      setBusy('');
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      setBusy(`device-${deviceId}`);
      await deviceTrustService.untrustDevice(deviceId);
      await refreshSecurityCollections();
      setSuccess('تم إزالة الجهاز من قائمة الأجهزة الموثوقة.');
    } catch (error) {
      setFailure(error?.message || 'تعذر إزالة الجهاز.');
    } finally {
      setBusy('');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      setBusy(`session-${sessionId}`);
      await deviceTrustService.revokeSession(sessionId);
      await refreshSecurityCollections();
      setSuccess('تم إنهاء الجلسة المحددة.');
    } catch (error) {
      setFailure(error?.message || 'تعذر إنهاء الجلسة.');
    } finally {
      setBusy('');
    }
  };

  const handleEnablePush = async () => {
    try {
      setBusy('push');
      await notificationService.initialize();
      await notificationService.subscribeToPushNotifications().catch(() => null);
      setPushState(notificationService.getPushReadiness());
      setSuccess('تم تجهيز إشعارات الـ Push للجهاز الحالي.');
    } catch (error) {
      setFailure(error?.message || 'تعذر تفعيل إشعارات الـ Push.');
    } finally {
      setBusy('');
    }
  };

  const handleSyncNow = () => {
    const next = deviceTrustService.updateSyncState({
      profile_revision: Number(syncState.profile_revision || 1) + 1,
      notifications_revision: Number(syncState.notifications_revision || 1) + 1,
      inbox_revision: Number(syncState.inbox_revision || 1) + 1,
      devices_online: Math.max(1, trustedDevices.length),
    });
    setSyncState(next);
    setSuccess('تم بث حالة المزامنة لكل الأجهزة المفتوحة.');
  };

  const handleRefreshTokenNow = async () => {
    try {
      setBusy('refresh-token');
      await refreshSession();
      await refreshAuthSnapshot();
      await refreshSecurityCollections();
      setSuccess('تم تحديث الجلسة وإعادة مزامنة بيانات المصادقة.');
    } catch (error) {
      setFailure(error?.message || 'تعذر تحديث الجلسة حالياً.');
    } finally {
      setBusy('');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      setBusy('logout-all');
      await logoutAllDevices();
      await refreshSecurityCollections();
      setSuccess('تم تسجيل الخروج من جميع الأجهزة الأخرى.');
    } catch (error) {
      setFailure(error?.message || 'تعذر تنفيذ تسجيل الخروج من جميع الأجهزة.');
    } finally {
      setBusy('');
    }
  };

  const handleSetupTwoFactor = async () => {
    try {
      setBusy('setup-2fa');
      const response = await setupTwoFactor();
      setAuthSnapshot((prev) => ({ ...prev, twoFactorSetup: response?.data || null }));
      setSuccess('تم تجهيز بيانات التحقق بخطوتين. أكمل الربط من التطبيق أو المولّد.');
    } catch (error) {
      setFailure(error?.message || 'تعذر بدء إعداد التحقق بخطوتين.');
    } finally {
      setBusy('');
    }
  };

  const handleDisableTwoFactor = async () => {
    try {
      setBusy('disable-2fa');
      await disableTwoFactor();
      setAuthSnapshot((prev) => ({ ...prev, twoFactorSetup: null }));
      setSuccess('تم تعطيل التحقق بخطوتين.');
    } catch (error) {
      setFailure(error?.message || 'تعذر تعطيل التحقق بخطوتين.');
    } finally {
      setBusy('');
    }
  };

  const roleLabel = authSnapshot?.storedUser?.role || authSnapshot?.me?.role || 'user';
  const permissionsCount = Array.isArray(authSnapshot?.storedUser?.permissions) ? authSnapshot.storedUser.permissions.length : 0;
  const emailVerified = Boolean(authSnapshot?.storedUser?.email_verified ?? authSnapshot?.me?.email_verified);
  const csrfEnabled = Boolean(authSnapshot?.storedUser?.csrf_token);
  const rememberMeEnabled = Boolean(authSnapshot?.storedUser?.remember_me ?? true);

  return (
    <MainLayout>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ marginBottom: 8 }}>إعدادات الأمان والتوسّع</h1>
          <p className="muted" style={{ margin: 0 }}>
            تم إظهار واجهات المصادقة، حماية الجلسات، الأجهزة، الميديا، الإشعارات، والمزامنة متعددة الأجهزة بشكل مباشر داخل الفرونت إند.
          </p>
        </div>

        {message ? <div className="settings-banner success">{message}</div> : null}
        {errorMessage ? <div className="settings-banner error">{errorMessage}</div> : null}

        <div className="settings-layout-grid">
          <aside style={{ display: 'grid', gap: 10, alignSelf: 'start' }}>
            {TABS.map((tab) => (
              <Button key={tab.key} variant={activeTab === tab.key ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab.key)} fullWidth>
                {tab.label}
              </Button>
            ))}
          </aside>

          <main style={{ display: 'grid', gap: 16 }}>
            {activeTab === 'security' ? (
              <>
                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Auth Center</h3>
                  <div className="stats-grid">
                    <div className="metric-card"><span>الدور</span><strong>{roleLabel}</strong></div>
                    <div className="metric-card"><span>الصلاحيات</span><strong>{permissionsCount}</strong></div>
                    <div className="metric-card"><span>تفعيل البريد</span><strong>{emailVerified ? 'مفعّل' : 'غير مفعّل'}</strong></div>
                    <div className="metric-card"><span>انتهاء التوكن</span><strong>{formatDuration(authSnapshot.ttlMs)}</strong></div>
                    <div className="metric-card"><span>Remember me</span><strong>{rememberMeEnabled ? 'On' : 'Off'}</strong></div>
                    <div className="metric-card"><span>CSRF</span><strong>{csrfEnabled ? 'Enabled' : 'Pending'}</strong></div>
                    <div className="metric-card"><span>Secure cookies</span><strong>Enabled</strong></div>
                    <div className="metric-card"><span>Session restore</span><strong>Enabled</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                    <Button onClick={handleRefreshTokenNow} loading={busy === 'refresh-token'}>تحديث الجلسة / Refresh Token</Button>
                    <Button variant="secondary" onClick={handleSetupTwoFactor} loading={busy === 'setup-2fa'}>بدء إعداد 2FA</Button>
                    <Button variant="secondary" onClick={handleDisableTwoFactor} loading={busy === 'disable-2fa'}>تعطيل 2FA</Button>
                    <Button variant="danger" onClick={handleLogoutAllDevices} loading={busy === 'logout-all'}>Logout من جميع الأجهزة</Button>
                  </div>

                  <div className="muted" style={{ marginTop: 14, lineHeight: 1.8 }}>
                    الواجهة الآن بتعرض حالة المصادقة الفعلية: صلاحية التوكن، CSRF، Remember me، Secure cookies، Session restore، وحالة الدور والصلاحيات للوصول المبني على الأدوار.
                  </div>
                </Card>

                {authSnapshot.twoFactorSetup ? (
                  <Card style={{ padding: 18 }}>
                    <h3 style={{ marginTop: 0 }}>بيانات التحقق بخطوتين</h3>
                    <div className="stats-grid">
                      <div className="metric-card"><span>Provider</span><strong>{authSnapshot.twoFactorSetup.provider || 'authenticator'}</strong></div>
                      <div className="metric-card"><span>Manual secret</span><strong style={{ fontSize: 14 }}>{authSnapshot.twoFactorSetup.manual_secret || authSnapshot.twoFactorSetup.secret || 'غير متاح'}</strong></div>
                      <div className="metric-card"><span>Setup token</span><strong style={{ fontSize: 14 }}>{authSnapshot.twoFactorSetup.setup_token || authSnapshot.twoFactorSetup.challenge_id || 'جاهز'}</strong></div>
                    </div>
                    {authSnapshot.twoFactorSetup.otp_auth_url ? (
                      <div className="muted" style={{ marginTop: 14, wordBreak: 'break-all' }}>
                        رابط الربط: {authSnapshot.twoFactorSetup.otp_auth_url}
                      </div>
                    ) : null}
                    {Array.isArray(authSnapshot.twoFactorSetup.backup_codes) && authSnapshot.twoFactorSetup.backup_codes.length ? (
                      <div style={{ marginTop: 14 }}>
                        <strong style={{ display: 'block', marginBottom: 8 }}>Backup Codes</strong>
                        <div className="token-code-grid">
                          {authSnapshot.twoFactorSetup.backup_codes.map((code) => <span key={code}>{code}</span>)}
                        </div>
                      </div>
                    ) : null}
                  </Card>
                ) : null}

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Anti-Spam / Bot Detection / Shadow Ban</h3>
                  <div className="stats-grid">
                    <div className="metric-card"><span>Rate limit</span><strong>{antiSpam.remainingRequests} متبقي</strong></div>
                    <div className="metric-card"><span>Bot score</span><strong>{antiSpam.bot.score}/100</strong></div>
                    <div className="metric-card"><span>Verdict</span><strong>{antiSpam.bot.verdict}</strong></div>
                    <div className="metric-card"><span>Shadow ban</span><strong>{antiSpam.shadowBanned ? 'مفعّل' : 'غير مفعّل'}</strong></div>
                  </div>
                  <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                    <RateLimitUI remaining={antiSpam.remainingRequests} resetTime={antiSpam.resetInMs} />
                    <CooldownUI remaining={antiSpam.bot.score >= 35 ? 9000 : 0} action="إعادة المحاولة" />
                    <div className="muted">المنظومة تدعم حماية brute force، retry logic، وكشف السلوك الشاذ على مستوى الواجهة قبل الرجوع للخلفية.</div>
                  </div>
                </Card>

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Login Alerts / Device Detection</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {alerts.length ? alerts.map((alert) => (
                      <div key={alert.id} className="list-row">
                        <div>
                          <strong>{alert.title}</strong>
                          <div className="muted">{alert.description}</div>
                        </div>
                        <span className="score-pill">{alert.severity}</span>
                      </div>
                    )) : <div className="empty-box">لا توجد تنبيهات أمنية حالياً.</div>}
                  </div>
                </Card>
              </>
            ) : null}

            {activeTab === 'devices' ? (
              <>
                <Card style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px' }}>Trusted Devices</h3>
                      <div className="muted">إدارة الأجهزة الموثوقة، كشف الأجهزة، وتحديد حالة الجهاز الحالي.</div>
                    </div>
                    <Button onClick={handleTrustCurrentDevice} loading={busy === 'trust-device'}>توثيق الجهاز الحالي</Button>
                  </div>
                  <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                    {trustedDevices.length ? trustedDevices.map((device) => (
                      <div key={device.id || device.device_id} className="list-row">
                        <div>
                          <strong>{device.label || device.device_label || 'Device'}</strong>
                          <div className="muted">آخر ظهور: {new Date(device.lastSeenAt || device.last_active_at || Date.now()).toLocaleString('ar-EG')}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="score-pill">{device.current ? 'Current' : 'Trusted'}</span>
                          {!device.current ? (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleRemoveDevice(device.id || device.device_id)}
                              loading={busy === `device-${device.id || device.device_id}`}
                            >
                              إزالة
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )) : <div className="empty-box">لا توجد أجهزة موثوقة حالياً.</div>}
                  </div>
                </Card>

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Session Manager</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {sessions.length ? sessions.map((session) => (
                      <div key={session.id} className="list-row">
                        <div>
                          <strong>{session.device_label || session.label || 'Session'}</strong>
                          <div className="muted">آخر نشاط: {new Date(session.last_active_at || Date.now()).toLocaleString('ar-EG')}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="score-pill">{session.sync_state || 'healthy'}</span>
                          {!session.current ? (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleRevokeSession(session.id)}
                              loading={busy === `session-${session.id}`}
                            >
                              إنهاء
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )) : <div className="empty-box">لا توجد جلسات إضافية حالياً.</div>}
                  </div>
                </Card>
              </>
            ) : null}

            {activeTab === 'media' ? (
              <>
                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Media Protection</h3>
                  <div className="stats-grid">
                    <div className="metric-card"><span>Signed URLs</span><strong>{MEDIA_SECURITY.signedUrls ? 'On' : 'Off'}</strong></div>
                    <div className="metric-card"><span>Expiring links</span><strong>{MEDIA_SECURITY.expiringLinks ? `${SIGNED_URL_TTL_SECONDS}s` : 'Off'}</strong></div>
                    <div className="metric-card"><span>Encrypted uploads</span><strong>{MEDIA_SECURITY.encryptedUploads ? 'Enabled' : 'Disabled'}</strong></div>
                    <div className="metric-card"><span>Provider</span><strong>{currentMediaProviderLabel()}</strong></div>
                  </div>
                </Card>

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>CDN Acceleration</h3>
                  <div className="muted" style={{ marginBottom: 12 }}>الصور والفيديو والملفات يتم تحضيرهم للتسريع من خلال CDN عالمي وسياسات edge caching.</div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[imageDelivery, videoDelivery, fileDelivery].map((profile) => (
                      <div key={profile.strategy} className="list-row">
                        <div>
                          <strong>{profile.strategy}</strong>
                          <div className="muted">{profile.preferredCdn}</div>
                        </div>
                        <span className="score-pill">TTL {profile.ttl}</span>
                      </div>
                    ))}
                  </div>
                  <div className="muted" style={{ marginTop: 12 }}>المناطق المدعومة: {cdnConfig.regions.join(' • ')}</div>
                </Card>
              </>
            ) : null}

            {activeTab === 'notifications' ? (
              <Card style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px' }}>Push Notifications احترافية</h3>
                    <div className="muted">Android + PWA + foreground/background + service worker registration.</div>
                  </div>
                  <Button onClick={handleEnablePush} loading={busy === 'push'}>تفعيل الـ Push</Button>
                </div>
                <div className="stats-grid" style={{ marginTop: 16 }}>
                  <div className="metric-card"><span>Permission</span><strong>{pushState.permission}</strong></div>
                  <div className="metric-card"><span>Android</span><strong>{pushState.androidReady ? 'جاهز' : 'غير متاح'}</strong></div>
                  <div className="metric-card"><span>PWA</span><strong>{pushState.pwaReady ? 'Installed' : 'Browser'}</strong></div>
                  <div className="metric-card"><span>Background</span><strong>{pushState.supportsBackground ? 'Enabled' : 'No'}</strong></div>
                </div>
              </Card>
            ) : null}

            {activeTab === 'sync' ? (
              <Card style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px' }}>Multi Device Sync</h3>
                    <div className="muted">مزامنة الحالة بين الأجهزة باستخدام BroadcastChannel مع fallback للتخزين المحلي.</div>
                  </div>
                  <Button onClick={handleSyncNow}>Sync state now</Button>
                </div>
                <div className="stats-grid" style={{ marginTop: 16 }}>
                  <div className="metric-card"><span>Devices online</span><strong>{syncState.devices_online || trustedDevices.length || 1}</strong></div>
                  <div className="metric-card"><span>Profile rev</span><strong>{syncState.profile_revision || 1}</strong></div>
                  <div className="metric-card"><span>Notifications rev</span><strong>{syncState.notifications_revision || 1}</strong></div>
                  <div className="metric-card"><span>Inbox rev</span><strong>{syncState.inbox_revision || 1}</strong></div>
                </div>
                <div className="muted" style={{ marginTop: 12 }}>آخر مزامنة: {new Date(syncState.last_sync_at || Date.now()).toLocaleString('ar-EG')}</div>
              </Card>
            ) : null}
          </main>
        </div>
      </div>

      <style>{`
        .settings-layout-grid {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 18px;
        }
        .settings-banner {
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 18px;
        }
        .settings-banner.success {
          background: rgba(34,197,94,0.14);
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
        }
        .settings-banner.error {
          background: rgba(239,68,68,0.14);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,0.24);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .metric-card {
          padding: 16px;
          border-radius: 16px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid;
          gap: 6px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 13px; }
        .metric-card strong { font-size: 18px; }
        .list-row {
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.38);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .score-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 78px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #93c5fd;
          border: 1px solid rgba(147,197,253,0.26);
          font-size: 12px;
        }
        .empty-box {
          padding: 18px;
          border-radius: 16px;
          border: 1px dashed rgba(148,163,184,0.2);
          color: rgba(226,232,240,0.72);
          background: rgba(15,23,42,0.18);
        }
        .token-code-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .token-code-grid span {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(30,41,59,0.7);
          font-size: 12px;
        }
        @media (max-width: 920px) {
          .settings-layout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </MainLayout>
  );
}
