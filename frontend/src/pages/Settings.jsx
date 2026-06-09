import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { logoutUser } from '../api/auth.js';
import SoundSettingsPanel from '../components/audio/SoundSettingsPanel.jsx';
import LanguageSettings from '../components/settings/LanguageSettings.jsx';
import YamServicesMenu from '../components/ui/YamServicesMenu.jsx';
import { MEDIA_SECURITY, SIGNED_URL_TTL_SECONDS, currentMediaProviderLabel } from '../config/mediaConfig.js';
import { CooldownUI, RateLimitUI, createAntiSpamReport } from '../security/spam.js';
import deviceTrustService from '../services/deviceTrustService.js';
import notificationService from '../services/notificationService.js';
import { clearStoredUser } from '../utils/auth.js';
import { getCDNConfig, getMediaDeliveryProfile } from '../utils/performance.js';

const TABS = [
  { key: 'language', label: 'اللغة 🌐' },
  { key: 'security', label: 'الأمان' },
  { key: 'devices', label: 'الأجهزة الموثوقة' },
  { key: 'media', label: 'حماية الوسائط' },
  { key: 'notifications', label: 'الإشعارات' },
  { key: 'sync', label: 'تعدد الأجهزة' },
  { key: 'sounds', label: 'الأصوات' },
];

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('security');
  const [menuOpen, setMenuOpen] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pushState, setPushState] = useState(notificationService.getPushReadiness());
  const [syncState, setSyncState] = useState(deviceTrustService.getSyncState());
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  const antiSpam = useMemo(() => createAntiSpamReport({
    actionKey: 'settings-preview',
    content: 'preview',
    behavior: { pointerMoves: 6, keyStrokes: 14, typingDurationMs: 4200, pasteRatio: 0.1, retryBursts: 0, formFillMs: 4200 },
  }), []);

  const cdnConfig = useMemo(() => getCDNConfig(), []);
  const imageDelivery = useMemo(() => getMediaDeliveryProfile('image'), []);
  const videoDelivery = useMemo(() => getMediaDeliveryProfile('video'), []);
  const fileDelivery = useMemo(() => getMediaDeliveryProfile('file'), []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get('tab');
    if (requestedTab && TABS.some((tab) => tab.key === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [location.search]);

  useEffect(() => {
    let unsubscribe = () => {};
    const load = async () => {
      const [devicesResult, sessionsResult, alertsResult] = await Promise.all([
        deviceTrustService.getTrustedDevices(),
        deviceTrustService.getSessions(),
        deviceTrustService.getLoginAlerts(),
      ]);
      setTrustedDevices(Array.isArray(devicesResult) ? devicesResult : devicesResult?.items || []);
      setSessions(Array.isArray(sessionsResult) ? sessionsResult : sessionsResult?.items || []);
      setAlerts(Array.isArray(alertsResult) ? alertsResult : alertsResult?.items || []);
      setPushState(notificationService.getPushReadiness());
      setSyncState(deviceTrustService.getSyncState());
      unsubscribe = deviceTrustService.subscribe((payload) => setSyncState((prev) => ({ ...prev, ...(payload || {}) })));
    };
    load();
    return () => unsubscribe();
  }, []);

  const setSuccess = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  };

  const handleTrustCurrentDevice = async () => {
    setBusy('trust-device');
    await deviceTrustService.trustCurrentDevice();
    setTrustedDevices(await deviceTrustService.getTrustedDevices());
    setSuccess('تم اعتبار الجهاز الحالي موثوق.');
    setBusy('');
  };

  const handleRemoveDevice = async (deviceId) => {
    setBusy(deviceId);
    await deviceTrustService.untrustDevice(deviceId);
    setTrustedDevices(await deviceTrustService.getTrustedDevices());
    setSuccess('تم إزالة الجهاز من قائمة الأجهزة الموثوقة.');
    setBusy('');
  };

  const handleRevokeSession = async (sessionId) => {
    setBusy(sessionId);
    await deviceTrustService.revokeSession(sessionId);
    setSessions(await deviceTrustService.getSessions());
    setSuccess('تم إنهاء الجلسة المحددة.');
    setBusy('');
  };

  const handleEnablePush = async () => {
    setBusy('push');
    await notificationService.initialize();
    await notificationService.subscribeToPushNotifications().catch(() => null);
    setPushState(notificationService.getPushReadiness());
    setSuccess('تم تجهيز إشعارات الـ Push للجهاز الحالي.');
    setBusy('');
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

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // تجاهل فشل الشبكة والاعتماد على إنهاء الجلسة محليًا
    }
    clearStoredUser();
    setMenuOpen(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const openQuickMenu = () => setMenuOpen(true);

  const updateActiveTab = (nextTab) => {
    setActiveTab(nextTab);
    const params = new URLSearchParams(location.search);
    params.set('tab', nextTab);
    navigate({ pathname: '/settings', search: `?${params.toString()}` }, { replace: true });
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 20 }}>
        <div className="settings-hero">
          <div>
            <h1 style={{ marginBottom: 8 }}>إعدادات الأمان والتوسّع</h1>
            <p className="muted" style={{ margin: 0 }}>تم إضافة طبقات Frontend للأمان، الأجهزة الموثوقة، الروابط الموقعة، المزامنة متعددة الأجهزة، وإشعارات الـ Push الاحترافية.</p>
          </div>
          <button type="button" className="settings-quick-menu-btn" aria-label="القائمة السريعة" onClick={openQuickMenu}>
            <span />
            <span />
            <span />
          </button>
        </div>

        {message ? <div className="settings-banner">{message}</div> : null}

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
          <aside style={{ display: 'grid', gap: 10, alignSelf: 'start' }}>
            {TABS.map((tab) => (
              <Button key={tab.key} variant={activeTab === tab.key ? 'primary' : 'secondary'} onClick={() => updateActiveTab(tab.key)} fullWidth>
                {tab.label}
              </Button>
            ))}
          </aside>

          <main style={{ display: 'grid', gap: 16 }}>
            {activeTab === 'language' ? (
              <LanguageSettings />
            ) : null}
            {activeTab === 'security' ? (
              <>
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
                    <div className="muted">المنظومة دلوقتي بتدعم rate limits على مستوى الإجراء، تقييم سلوك الـ bot من سرعة التفاعل، وإمكانية shadow ban للمراجعة الهادية.</div>
                  </div>
                </Card>

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Login Alerts</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {alerts.map((alert) => (
                      <div key={alert.id} className="list-row">
                        <div>
                          <strong>{alert.title}</strong>
                          <div className="muted">{alert.description}</div>
                        </div>
                        <span className="score-pill">{alert.severity}</span>
                      </div>
                    ))}
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
                      <div className="muted">إدارة الأجهزة الموثوقة ومدير الجلسات والتنبيهات وقت تسجيل الدخول.</div>
                    </div>
                    <Button onClick={handleTrustCurrentDevice} loading={busy === 'trust-device'}>توثيق الجهاز الحالي</Button>
                  </div>
                  <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                    {trustedDevices.map((device) => (
                      <div key={device.id || device.device_id} className="list-row">
                        <div>
                          <strong>{device.label || device.device_label || 'Device'}</strong>
                          <div className="muted">آخر ظهور: {new Date(device.lastSeenAt || device.last_active_at || Date.now()).toLocaleString('ar-EG')}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="score-pill">{device.current ? 'Current' : 'Trusted'}</span>
                          {!device.current ? <Button variant="secondary" size="small" onClick={() => handleRemoveDevice(device.id || device.device_id)} loading={busy === (device.id || device.device_id)}>إزالة</Button> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Session Manager</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {sessions.map((session) => (
                      <div key={session.id} className="list-row">
                        <div>
                          <strong>{session.device_label || session.label || 'Session'}</strong>
                          <div className="muted">آخر نشاط: {new Date(session.last_active_at || Date.now()).toLocaleString('ar-EG')}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="score-pill">{session.sync_state || 'healthy'}</span>
                          {!session.current ? <Button variant="secondary" size="small" onClick={() => handleRevokeSession(session.id)} loading={busy === session.id}>إنهاء</Button> : null}
                        </div>
                      </div>
                    ))}
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
                  <div className="muted" style={{ marginBottom: 12 }}>الصور والفيديو والملفات بيتم تحضيرهم للتسريع من خلال CDN عالمي وسياسات edge caching.</div>
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
              <>
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
              </>
            ) : null}

            {activeTab === 'sounds' ? (
              <Card style={{ padding: 18 }}>
                <SoundSettingsPanel />
              </Card>
            ) : null}

            {activeTab === 'sync' ? (
              <>
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
              </>
            ) : null}
          </main>
        </div>
      </div>

      <YamServicesMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} brandLabel="Yamshat" />

      <style>{`
        .settings-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        .settings-quick-menu-btn {
          width: 52px;
          height: 52px;
          padding: 0;
          flex-shrink: 0;
          border-radius: 16px;
          border: 1px solid rgba(167,139,250,0.25);
          background: rgba(15,23,42,0.78);
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.28);
        }
        .settings-quick-menu-btn span {
          display: block;
          width: 20px;
          height: 2.5px;
          border-radius: 999px;
          background: #e2e8f0;
        }
        .settings-banner {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 18px;
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
        @media (max-width: 920px) {
          .settings-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .settings-hero { align-items: center; }
          main, aside { width: 100%; }
          div[style*='grid-template-columns: 240px 1fr'] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </MainLayout>
  );
}
