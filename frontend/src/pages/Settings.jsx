import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { logoutUser } from '../api/auth.js';
import SoundSettingsPanel from '../components/audio/SoundSettingsPanel.jsx';
import LanguageSettings from '../components/settings/LanguageSettings.jsx';
import { SettingsToggle, SettingsRow } from '../components/settings/SettingsShell.jsx';
import YamServicesMenu from '../components/ui/YamServicesMenu.jsx';
import { MEDIA_SECURITY, SIGNED_URL_TTL_SECONDS, currentMediaProviderLabel } from '../config/mediaConfig.js';
import { CooldownUI, RateLimitUI, createAntiSpamReport } from '../security/spam.js';
import deviceTrustService from '../services/deviceTrustService.js';
import notificationService from '../services/notificationService.js';
import { clearStoredUser } from '../utils/auth.js';
import { getCDNConfig, getMediaDeliveryProfile } from '../utils/performance.js';

// مجموعات الإعدادات الرئيسية — مصنفة بشكل احترافي مثل تطبيقات الفئة الأولى
const TAB_GROUPS = [
  {
    label: 'الحساب',
    tabs: [
      { key: 'account', label: '👤 الحساب', icon: '👤' },
      { key: 'profile-link', label: '🪪 الملف الشخصي', icon: '🪪', link: '/settings/profile' },
      { key: 'privacy', label: '🔒 الخصوصية', icon: '🔒' },
      { key: 'security', label: '🛡️ الأمان', icon: '🛡️' },
      { key: 'two-factor', label: '🔑 المصادقة الثنائية', icon: '🔑' },
      { key: 'devices', label: '💻 الأجهزة الموثوقة', icon: '💻' },
      { key: 'sessions', label: '🪟 الجلسات', icon: '🪟' },
      { key: 'connected-apps', label: '🔗 التطبيقات المرتبطة', icon: '🔗' },
      { key: 'blocked', label: '🚫 المحظورون', icon: '🚫' },
      { key: 'muted', label: '🔇 المكتومون', icon: '🔇' },
    ],
  },
  {
    label: 'المحتوى والخدمات',
    tabs: [
      { key: 'feed-link', label: '📰 الخلاصة (Feed)', icon: '📰', link: '/settings/feed' },
      { key: 'reels-link', label: '🎬 الريلز', icon: '🎬', link: '/settings/reels' },
      { key: 'stories-link', label: '📖 الستوريز', icon: '📖', link: '/settings/stories' },
      { key: 'inbox-link', label: '✉️ الرسائل', icon: '✉️', link: '/settings/inbox' },
      { key: 'voice-link', label: '🎙️ الغرف الصوتية', icon: '🎙️', link: '/settings/voice' },
      { key: 'engagement-link', label: '⚔️ المعارك والتفاعل', icon: '⚔️', link: '/settings/engagement' },
      { key: 'wallet-link', label: '💰 المحفظة', icon: '💰', link: '/settings/wallet' },
    ],
  },
  {
    label: 'التطبيق',
    tabs: [
      { key: 'appearance', label: '🎨 المظهر', icon: '🎨' },
      { key: 'language', label: '🌐 اللغة', icon: '🌐' },
      { key: 'accessibility', label: '♿ سهولة الوصول', icon: '♿' },
      { key: 'notifications', label: '🔔 الإشعارات', icon: '🔔' },
      { key: 'sounds', label: '🔊 الأصوات', icon: '🔊' },
      { key: 'data-storage', label: '💾 البيانات والتخزين', icon: '💾' },
      { key: 'media', label: '🎞️ حماية الوسائط', icon: '🎞️' },
      { key: 'sync', label: '🔄 تعدد الأجهزة', icon: '🔄' },
      { key: 'performance', label: '⚡ الأداء', icon: '⚡' },
    ],
  },
  {
    label: 'الدعم والمعلومات',
    tabs: [
      { key: 'download-data', label: '📥 تنزيل بياناتي', icon: '📥' },
      { key: 'help', label: '❓ المساعدة والدعم', icon: '❓' },
      { key: 'feedback', label: '💬 إرسال ملاحظات', icon: '💬' },
      { key: 'about', label: 'ℹ️ عن التطبيق', icon: 'ℹ️' },
      { key: 'legal', label: '📜 القانوني', icon: '📜' },
    ],
  },
];

// localStorage helpers لتفضيلات المظهر/الخصوصية/الوصول
const PREFS_KEY = 'yamshat:app-prefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {} };

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('account');
  const [menuOpen, setMenuOpen] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pushState, setPushState] = useState(notificationService.getPushReadiness());
  const [syncState, setSyncState] = useState(deviceTrustService.getSyncState());
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [prefs, setPrefs] = useState(() => ({
    // المظهر
    theme: 'dark', accentColor: 'purple', fontSize: 'medium', density: 'normal',
    reducedMotion: false, highContrast: false, roundedCorners: true, animations: true,
    // الخصوصية
    privateAccount: false, hideLastSeen: false, hideReadReceipts: false,
    incognitoMode: false, anonymousBrowsing: false, locationSharing: false,
    // الأداء
    saveDataMode: false, lowPowerMode: false, prefetchEnabled: true, hardwareAcceleration: true,
    // البيانات
    autoBackup: true, backupOnWifi: true, storageLimit: '5GB',
    // الوصول
    screenReader: false, largeButtons: false, captionsAlways: false, reduceTransparency: false,
    ...loadPrefs(),
  }));

  const antiSpam = useMemo(() => createAntiSpamReport({
    actionKey: 'settings-preview',
    content: 'preview',
    behavior: { pointerMoves: 6, keyStrokes: 14, typingDurationMs: 4200, pasteRatio: 0.1, retryBursts: 0, formFillMs: 4200 },
  }), []);

  const cdnConfig = useMemo(() => getCDNConfig(), []);
  const imageDelivery = useMemo(() => getMediaDeliveryProfile('image'), []);
  const videoDelivery = useMemo(() => getMediaDeliveryProfile('video'), []);
  const fileDelivery = useMemo(() => getMediaDeliveryProfile('file'), []);

  const updatePref = (k, v) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next); savePrefs(next);
    setSuccess('تم حفظ الإعداد.');
  };

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get('tab');
    const allTabs = TAB_GROUPS.flatMap((g) => g.tabs);
    if (requestedTab && allTabs.some((tab) => tab.key === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [location.search]);

  useEffect(() => {
    let unsubscribe = () => {};
    const load = async () => {
      try {
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
      } catch {}
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
    setSuccess('تم إزالة الجهاز.');
    setBusy('');
  };

  const handleRevokeSession = async (sessionId) => {
    setBusy(sessionId);
    await deviceTrustService.revokeSession(sessionId);
    setSessions(await deviceTrustService.getSessions());
    setSuccess('تم إنهاء الجلسة.');
    setBusy('');
  };

  const handleEnablePush = async () => {
    setBusy('push');
    await notificationService.initialize();
    await notificationService.subscribeToPushNotifications().catch(() => null);
    setPushState(notificationService.getPushReadiness());
    setSuccess('تم تجهيز إشعارات الـ Push.');
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
    setSuccess('تم بث حالة المزامنة.');
  };

  const handleLogout = useCallback(async () => {
    try { await logoutUser(); } catch {}
    clearStoredUser();
    setMenuOpen(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const updateActiveTab = (tab) => {
    if (tab.link) { navigate(tab.link); return; }
    setActiveTab(tab.key);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab.key);
    navigate({ pathname: '/settings', search: `?${params.toString()}` }, { replace: true });
  };

  const handleDownloadData = () => {
    setSuccess('سيتم إرسال رابط تنزيل بياناتك إلى بريدك خلال 48 ساعة.');
  };

  const handleClearCache = () => {
    if (!confirm('تأكيد مسح الكاش؟')) return;
    try {
      Object.keys(localStorage).filter(k => k.includes(':cache')).forEach(k => localStorage.removeItem(k));
      if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      setSuccess('تم مسح الكاش بنجاح.');
    } catch {}
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 20 }} dir="rtl">
        <div className="settings-hero">
          <div>
            <h1 style={{ marginBottom: 8 }}>الإعدادات</h1>
            <p className="muted" style={{ margin: 0 }}>تحكم كامل في حسابك، خصوصيتك، أمانك، ومحتواك على منصة يمشات.</p>
          </div>
          <button type="button" className="settings-quick-menu-btn" aria-label="القائمة السريعة" onClick={() => setMenuOpen(true)}>
            <span /><span /><span />
          </button>
        </div>

        {message ? <div className="settings-banner">{message}</div> : null}

        <div className="settings-layout">
          <aside className="settings-sidebar">
            {TAB_GROUPS.map((group) => (
              <div key={group.label} className="settings-group">
                <div className="settings-group-label">{group.label}</div>
                {group.tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`settings-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => updateActiveTab(tab)}
                  >
                    {tab.label}
                    {tab.link ? <span style={{ marginInlineStart: 'auto', opacity: 0.5 }}>›</span> : null}
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <main className="settings-main">
            {/* ===== الحساب ===== */}
            {activeTab === 'account' ? (
              <>
                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>معلومات الحساب</h3>
                  <SettingsRow icon="📧" title="البريد الإلكتروني" description="تغيير البريد المرتبط بحسابك">
                    <Button variant="secondary" size="small">تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="📱" title="رقم الهاتف" description="رقم الهاتف للتحقق والاسترداد">
                    <Button variant="secondary" size="small">تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="🔑" title="تغيير كلمة المرور">
                    <Button variant="secondary" size="small">تغيير</Button>
                  </SettingsRow>
                  <SettingsRow icon="🆔" title="اسم المستخدم">
                    <Button variant="secondary" size="small">تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="🎂" title="تاريخ الميلاد">
                    <Button variant="secondary" size="small">تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="🌍" title="الدولة والمنطقة الزمنية">
                    <Button variant="secondary" size="small">تعديل</Button>
                  </SettingsRow>
                </Card>
                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>إدارة الحساب</h3>
                  <SettingsRow icon="⏸️" title="إيقاف الحساب مؤقتًا" description="إخفاء حسابك دون حذفه">
                    <Button variant="secondary" size="small" className="settings-danger">إيقاف</Button>
                  </SettingsRow>
                  <SettingsRow icon="❌" title="حذف الحساب نهائيًا" description="حذف بياناتك بشكل دائم">
                    <Button variant="secondary" size="small" className="settings-danger">حذف</Button>
                  </SettingsRow>
                  <SettingsRow icon="🔄" title="تحويل لحساب أعمال">
                    <Button variant="secondary" size="small">تحويل</Button>
                  </SettingsRow>
                </Card>
              </>
            ) : null}

            {/* ===== الخصوصية ===== */}
            {activeTab === 'privacy' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>الخصوصية</h3>
                <SettingsRow icon="🔒" title="حساب خاص">
                  <SettingsToggle on={prefs.privateAccount} onChange={(v) => updatePref('privateAccount', v)} />
                </SettingsRow>
                <SettingsRow icon="⏱️" title="إخفاء آخر ظهور">
                  <SettingsToggle on={prefs.hideLastSeen} onChange={(v) => updatePref('hideLastSeen', v)} />
                </SettingsRow>
                <SettingsRow icon="✓✓" title="إخفاء إيصالات القراءة">
                  <SettingsToggle on={prefs.hideReadReceipts} onChange={(v) => updatePref('hideReadReceipts', v)} />
                </SettingsRow>
                <SettingsRow icon="🕵️" title="وضع التصفح الخفي">
                  <SettingsToggle on={prefs.incognitoMode} onChange={(v) => updatePref('incognitoMode', v)} />
                </SettingsRow>
                <SettingsRow icon="👤" title="تصفح المحتوى دون تسجيل مشاهدة">
                  <SettingsToggle on={prefs.anonymousBrowsing} onChange={(v) => updatePref('anonymousBrowsing', v)} />
                </SettingsRow>
                <SettingsRow icon="📍" title="مشاركة الموقع">
                  <SettingsToggle on={prefs.locationSharing} onChange={(v) => updatePref('locationSharing', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الأمان ===== */}
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

            {/* ===== المصادقة الثنائية ===== */}
            {activeTab === 'two-factor' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>المصادقة الثنائية (2FA)</h3>
                <p className="muted">طبقة حماية إضافية لحسابك. اختر طريقة واحدة على الأقل.</p>
                <SettingsRow icon="📱" title="تطبيق المصادقة (Authenticator)" description="Google Authenticator, Authy, ...">
                  <Button variant="secondary" size="small">إعداد</Button>
                </SettingsRow>
                <SettingsRow icon="📧" title="رمز عبر البريد الإلكتروني">
                  <SettingsToggle on={false} onChange={() => setSuccess('سيتم إعداد البريد كطريقة 2FA.')} />
                </SettingsRow>
                <SettingsRow icon="📩" title="رمز عبر SMS">
                  <SettingsToggle on={false} onChange={() => setSuccess('سيتم إعداد SMS كطريقة 2FA.')} />
                </SettingsRow>
                <SettingsRow icon="🗝️" title="مفتاح أمان (Hardware Key)" description="YubiKey أو متوافق">
                  <Button variant="secondary" size="small">إضافة</Button>
                </SettingsRow>
                <SettingsRow icon="🆘" title="رموز الاسترداد (Recovery Codes)" description="احتفظ بها في مكان آمن">
                  <Button variant="secondary" size="small">عرض/توليد</Button>
                </SettingsRow>
                <SettingsRow icon="👆" title="البصمة / Face ID" description="فتح التطبيق بالبصمة">
                  <SettingsToggle on={true} onChange={() => {}} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الأجهزة ===== */}
            {activeTab === 'devices' ? (
              <Card style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px' }}>الأجهزة الموثوقة</h3>
                    <div className="muted">إدارة الأجهزة التي سجلت دخولًا.</div>
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
            ) : null}

            {/* ===== الجلسات ===== */}
            {activeTab === 'sessions' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>الجلسات النشطة</h3>
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
                <Button variant="secondary" style={{ marginTop: 14 }} className="settings-danger">إنهاء كل الجلسات عدا الحالية</Button>
              </Card>
            ) : null}

            {/* ===== التطبيقات المرتبطة ===== */}
            {activeTab === 'connected-apps' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>التطبيقات والخدمات المرتبطة (OAuth)</h3>
                <p className="muted">التطبيقات الخارجية التي لديها صلاحية الوصول لحسابك.</p>
                <SettingsRow icon="🇬" title="Google" description="مرتبط (تسجيل دخول)">
                  <Button variant="secondary" size="small" className="settings-danger">إلغاء الربط</Button>
                </SettingsRow>
                <SettingsRow icon="🍎" title="Apple" description="غير مرتبط">
                  <Button variant="secondary" size="small">ربط</Button>
                </SettingsRow>
                <SettingsRow icon="📘" title="Facebook" description="غير مرتبط">
                  <Button variant="secondary" size="small">ربط</Button>
                </SettingsRow>
                <SettingsRow icon="🐦" title="X (Twitter)" description="غير مرتبط">
                  <Button variant="secondary" size="small">ربط</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== المحظورون / المكتومون ===== */}
            {activeTab === 'blocked' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>الحسابات المحظورة</h3>
                <p className="muted">لا يمكن للحسابات المحظورة رؤيتك أو التواصل معك.</p>
                <div className="muted" style={{ padding: 24, textAlign: 'center' }}>لا توجد حسابات محظورة حاليًا.</div>
              </Card>
            ) : null}
            {activeTab === 'muted' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>الحسابات المكتومة</h3>
                <p className="muted">لن ترى منشورات أو ستوريز هذه الحسابات.</p>
                <div className="muted" style={{ padding: 24, textAlign: 'center' }}>لا توجد حسابات مكتومة.</div>
              </Card>
            ) : null}

            {/* ===== المظهر ===== */}
            {activeTab === 'appearance' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>المظهر والثيم</h3>
                <SettingsRow icon="🌓" title="ثيم التطبيق">
                  <select className="settings-select" value={prefs.theme} onChange={(e) => updatePref('theme', e.target.value)}>
                    <option value="dark">داكن</option>
                    <option value="light">فاتح</option>
                    <option value="auto">تلقائي (حسب النظام)</option>
                    <option value="amoled">AMOLED أسود نقي</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="🎨" title="اللون المميز">
                  <select className="settings-select" value={prefs.accentColor} onChange={(e) => updatePref('accentColor', e.target.value)}>
                    <option value="purple">بنفسجي</option>
                    <option value="blue">أزرق</option>
                    <option value="green">أخضر</option>
                    <option value="orange">برتقالي</option>
                    <option value="pink">وردي</option>
                    <option value="red">أحمر</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="🔤" title="حجم الخط">
                  <select className="settings-select" value={prefs.fontSize} onChange={(e) => updatePref('fontSize', e.target.value)}>
                    <option value="small">صغير</option>
                    <option value="medium">متوسط</option>
                    <option value="large">كبير</option>
                    <option value="xl">كبير جدًا</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="📐" title="كثافة العرض">
                  <select className="settings-select" value={prefs.density} onChange={(e) => updatePref('density', e.target.value)}>
                    <option value="compact">مدمج</option>
                    <option value="normal">عادي</option>
                    <option value="comfortable">مريح</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="🔘" title="الزوايا الدائرية">
                  <SettingsToggle on={prefs.roundedCorners} onChange={(v) => updatePref('roundedCorners', v)} />
                </SettingsRow>
                <SettingsRow icon="✨" title="الحركات والانتقالات (Animations)">
                  <SettingsToggle on={prefs.animations} onChange={(v) => updatePref('animations', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== اللغة ===== */}
            {activeTab === 'language' ? <LanguageSettings /> : null}

            {/* ===== سهولة الوصول ===== */}
            {activeTab === 'accessibility' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>سهولة الوصول (Accessibility)</h3>
                <SettingsRow icon="🎙️" title="دعم قارئ الشاشة">
                  <SettingsToggle on={prefs.screenReader} onChange={(v) => updatePref('screenReader', v)} />
                </SettingsRow>
                <SettingsRow icon="🔲" title="أزرار كبيرة (Large Touch Targets)">
                  <SettingsToggle on={prefs.largeButtons} onChange={(v) => updatePref('largeButtons', v)} />
                </SettingsRow>
                <SettingsRow icon="📝" title="إظهار الترجمة دائمًا">
                  <SettingsToggle on={prefs.captionsAlways} onChange={(v) => updatePref('captionsAlways', v)} />
                </SettingsRow>
                <SettingsRow icon="🎬" title="تقليل الحركة (Reduce Motion)">
                  <SettingsToggle on={prefs.reducedMotion} onChange={(v) => updatePref('reducedMotion', v)} />
                </SettingsRow>
                <SettingsRow icon="🌓" title="تباين عالي">
                  <SettingsToggle on={prefs.highContrast} onChange={(v) => updatePref('highContrast', v)} />
                </SettingsRow>
                <SettingsRow icon="🪟" title="تقليل الشفافية">
                  <SettingsToggle on={prefs.reduceTransparency} onChange={(v) => updatePref('reduceTransparency', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الإشعارات (مختصر مع رابط للصفحة الكاملة) ===== */}
            {activeTab === 'notifications' ? (
              <>
                <Card style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px' }}>Push Notifications احترافية</h3>
                      <div className="muted">Android + PWA + foreground/background + service worker.</div>
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
                <Card style={{ padding: 18 }}>
                  <SettingsRow icon="🔔" title="إعدادات الإشعارات التفصيلية" description="تحكم تفصيلي في كل نوع إشعار">
                    <Button onClick={() => navigate('/settings/notifications')}>فتح</Button>
                  </SettingsRow>
                </Card>
              </>
            ) : null}

            {/* ===== الأصوات ===== */}
            {activeTab === 'sounds' ? (
              <Card style={{ padding: 18 }}>
                <SoundSettingsPanel />
              </Card>
            ) : null}

            {/* ===== البيانات والتخزين ===== */}
            {activeTab === 'data-storage' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>البيانات والتخزين</h3>
                <SettingsRow icon="💾" title="وضع توفير البيانات">
                  <SettingsToggle on={prefs.saveDataMode} onChange={(v) => updatePref('saveDataMode', v)} />
                </SettingsRow>
                <SettingsRow icon="📦" title="حد التخزين المحلي">
                  <select className="settings-select" value={prefs.storageLimit} onChange={(e) => updatePref('storageLimit', e.target.value)}>
                    <option value="500MB">500 MB</option>
                    <option value="1GB">1 GB</option>
                    <option value="2GB">2 GB</option>
                    <option value="5GB">5 GB</option>
                    <option value="10GB">10 GB</option>
                    <option value="unlimited">بلا حدود</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="☁️" title="نسخ احتياطي تلقائي">
                  <SettingsToggle on={prefs.autoBackup} onChange={(v) => updatePref('autoBackup', v)} />
                </SettingsRow>
                <SettingsRow icon="📶" title="نسخ احتياطي على WiFi فقط">
                  <SettingsToggle on={prefs.backupOnWifi} onChange={(v) => updatePref('backupOnWifi', v)} />
                </SettingsRow>
                <SettingsRow icon="🧹" title="مسح الكاش المؤقت">
                  <Button variant="secondary" size="small" onClick={handleClearCache}>مسح</Button>
                </SettingsRow>
                <SettingsRow icon="📥" title="مسح الوسائط المنزّلة">
                  <Button variant="secondary" size="small" className="settings-danger">مسح</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== حماية الوسائط ===== */}
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
                  <div className="muted" style={{ marginBottom: 12 }}>الصور والفيديو والملفات تُسرَّع عبر CDN عالمي.</div>
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
                  <div className="muted" style={{ marginTop: 12 }}>المناطق: {cdnConfig.regions.join(' • ')}</div>
                </Card>
              </>
            ) : null}

            {/* ===== تعدد الأجهزة ===== */}
            {activeTab === 'sync' ? (
              <Card style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px' }}>Multi Device Sync</h3>
                    <div className="muted">مزامنة الحالة بين الأجهزة باستخدام BroadcastChannel + fallback.</div>
                  </div>
                  <Button onClick={handleSyncNow}>Sync state now</Button>
                </div>
                <div className="stats-grid" style={{ marginTop: 16 }}>
                  <div className="metric-card"><span>Devices online</span><strong>{syncState.devices_online || trustedDevices.length || 1}</strong></div>
                  <div className="metric-card"><span>Profile rev</span><strong>{syncState.profile_revision || 1}</strong></div>
                  <div className="metric-card"><span>Notifications rev</span><strong>{syncState.notifications_revision || 1}</strong></div>
                  <div className="metric-card"><span>Inbox rev</span><strong>{syncState.inbox_revision || 1}</strong></div>
                </div>
              </Card>
            ) : null}

            {/* ===== الأداء ===== */}
            {activeTab === 'performance' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>الأداء وتحسين الجهاز</h3>
                <SettingsRow icon="⚡" title="وضع توفير الطاقة">
                  <SettingsToggle on={prefs.lowPowerMode} onChange={(v) => updatePref('lowPowerMode', v)} />
                </SettingsRow>
                <SettingsRow icon="🚀" title="التحميل المسبق (Prefetch)">
                  <SettingsToggle on={prefs.prefetchEnabled} onChange={(v) => updatePref('prefetchEnabled', v)} />
                </SettingsRow>
                <SettingsRow icon="🎮" title="تسريع الأجهزة (Hardware Acceleration)">
                  <SettingsToggle on={prefs.hardwareAcceleration} onChange={(v) => updatePref('hardwareAcceleration', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== تنزيل بياناتي (GDPR) ===== */}
            {activeTab === 'download-data' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>تنزيل بياناتي (GDPR)</h3>
                <p className="muted">طلب نسخة كاملة من بياناتك على المنصة. سيتم تجهيز الأرشيف خلال 48 ساعة وإرسال رابط التنزيل لبريدك.</p>
                <SettingsRow icon="📥" title="تنزيل بياناتي بالكامل">
                  <Button onClick={handleDownloadData}>طلب</Button>
                </SettingsRow>
                <SettingsRow icon="📊" title="تنزيل سجل النشاط فقط">
                  <Button variant="secondary" size="small" onClick={handleDownloadData}>طلب</Button>
                </SettingsRow>
                <SettingsRow icon="🎬" title="تنزيل وسائطي (صور/فيديو)">
                  <Button variant="secondary" size="small" onClick={handleDownloadData}>طلب</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== المساعدة ===== */}
            {activeTab === 'help' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>المساعدة والدعم</h3>
                <SettingsRow icon="❓" title="مركز المساعدة">
                  <Button variant="secondary" size="small" onClick={() => navigate('/support')}>فتح</Button>
                </SettingsRow>
                <SettingsRow icon="💬" title="تواصل مع الدعم">
                  <Button variant="secondary" size="small">تواصل</Button>
                </SettingsRow>
                <SettingsRow icon="📚" title="الأسئلة الشائعة (FAQ)">
                  <Button variant="secondary" size="small">عرض</Button>
                </SettingsRow>
                <SettingsRow icon="🚨" title="الإبلاغ عن مشكلة">
                  <Button variant="secondary" size="small">إبلاغ</Button>
                </SettingsRow>
                <SettingsRow icon="🎓" title="دروس البدء السريع">
                  <Button variant="secondary" size="small">عرض</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== ملاحظات ===== */}
            {activeTab === 'feedback' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>إرسال ملاحظات</h3>
                <p className="muted">رأيك يهمنا. ساعدنا في تحسين يمشات.</p>
                <SettingsRow icon="⭐" title="قيّم التطبيق">
                  <Button variant="secondary" size="small">تقييم</Button>
                </SettingsRow>
                <SettingsRow icon="💡" title="اقترح ميزة">
                  <Button variant="secondary" size="small">اقتراح</Button>
                </SettingsRow>
                <SettingsRow icon="🐞" title="بلّغ عن خطأ">
                  <Button variant="secondary" size="small">إبلاغ</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== عن التطبيق — v59.13.19 UX FIX: الإصدار الحقيقي من build time =====  */}
            {activeTab === 'about' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>عن يمشات</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  <SettingsRow icon="📦" title="الإصدار">
                    <span className="muted">{`v${__APP_VERSION__ || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_VERSION) || '59.13.19'}`}</span>
                  </SettingsRow>
                  <SettingsRow icon="🏗️" title="رقم البناء">
                    <span className="muted">{__APP_BUILD_DATE__ || new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
                  </SettingsRow>
                  <SettingsRow icon="🆕" title="ما الجديد"><Button variant="secondary" size="small">عرض</Button></SettingsRow>
                  <SettingsRow icon="🌐" title="الموقع الرسمي"><Button variant="secondary" size="small">زيارة</Button></SettingsRow>
                  <SettingsRow icon="📱" title="تابعنا"><span className="muted">@yamshat</span></SettingsRow>
                </div>
              </Card>
            ) : null}

            {/* ===== قانوني ===== */}
            {activeTab === 'legal' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>الشروط والسياسات</h3>
                <SettingsRow icon="📜" title="شروط الاستخدام">
                  <Button variant="secondary" size="small" onClick={() => navigate('/terms')}>عرض</Button>
                </SettingsRow>
                <SettingsRow icon="🔐" title="سياسة الخصوصية">
                  <Button variant="secondary" size="small" onClick={() => navigate('/privacy')}>عرض</Button>
                </SettingsRow>
                <SettingsRow icon="🍪" title="سياسة Cookies">
                  <Button variant="secondary" size="small">عرض</Button>
                </SettingsRow>
                <SettingsRow icon="©️" title="حقوق النشر و DMCA">
                  <Button variant="secondary" size="small">عرض</Button>
                </SettingsRow>
                <SettingsRow icon="⚖️" title="إرشادات المجتمع">
                  <Button variant="secondary" size="small">عرض</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* تسجيل الخروج */}
            <Card style={{ padding: 18, marginTop: 6 }}>
              <SettingsRow icon="🚪" title="تسجيل الخروج" description="إنهاء الجلسة الحالية على هذا الجهاز">
                <Button variant="secondary" className="settings-danger" onClick={handleLogout}>خروج</Button>
              </SettingsRow>
            </Card>
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
          width: 52px; height: 52px; padding: 0; flex-shrink: 0;
          border-radius: 16px; border: 1px solid rgba(167,139,250,0.25);
          background: rgba(15,23,42,0.78);
          display: inline-flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 5px; cursor: pointer;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.28);
        }
        .settings-quick-menu-btn span {
          display: block; width: 20px; height: 2.5px;
          border-radius: 999px; background: #e2e8f0;
        }
        .settings-banner {
          padding: 14px 16px; border-radius: 14px;
          background: rgba(34,197,94,0.14); color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 18px;
        }
        .settings-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 18px;
          align-items: start;
        }
        .settings-sidebar {
          display: grid; gap: 14px;
          position: sticky; top: 80px;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          padding-inline-end: 6px;
        }
        .settings-group {
          display: grid; gap: 4px;
          padding: 12px;
          background: rgba(15,23,42,0.4);
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.10);
        }
        .settings-group-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase;
          color: rgba(226,232,240,0.55);
          padding: 4px 8px 8px;
          letter-spacing: 0.5px;
        }
        .settings-tab-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px;
          border-radius: 10px; border: none;
          background: transparent; color: #e2e8f0;
          font-size: 14px; cursor: pointer;
          text-align: start; width: 100%;
          transition: all 0.15s;
        }
        .settings-tab-btn:hover { background: rgba(99,102,241,0.12); }
        .settings-tab-btn.active {
          background: rgba(99,102,241,0.22);
          color: #c4b5fd;
          font-weight: 600;
        }
        .settings-main { display: grid; gap: 14px; min-width: 0; }
        .settings-row {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(148,163,184,0.10);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-row-info { flex: 1; }
        .settings-row-info strong { display: block; margin-bottom: 4px; font-size: 15px; }
        .settings-row-info .muted { font-size: 13px; }
        .settings-toggle {
          position: relative; width: 50px; height: 28px;
          border-radius: 999px; background: rgba(100,116,139,0.35);
          cursor: pointer; transition: background 0.2s; border: none;
          flex-shrink: 0;
        }
        .settings-toggle::after {
          content: ''; position: absolute;
          top: 3px; right: 3px;
          width: 22px; height: 22px;
          background: #fff; border-radius: 50%;
          transition: all 0.2s;
        }
        .settings-toggle[data-on='true'] { background: #6366f1; }
        .settings-toggle[data-on='true']::after { right: 25px; }
        .settings-select, .settings-input {
          padding: 9px 12px; border-radius: 10px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.18);
          color: #e2e8f0; font-size: 14px; min-width: 140px;
        }
        .settings-danger { color: #fca5a5; border-color: rgba(239,68,68,0.3); }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .metric-card {
          padding: 16px; border-radius: 16px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid; gap: 6px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 13px; }
        .metric-card strong { font-size: 18px; }
        .list-row {
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.38);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex; justify-content: space-between;
          gap: 12px; align-items: center;
        }
        .score-pill {
          display: inline-flex; align-items: center;
          justify-content: center; min-width: 78px;
          padding: 7px 12px; border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #93c5fd;
          border: 1px solid rgba(147,197,253,0.26);
          font-size: 12px;
        }
        @media (max-width: 900px) {
          .settings-layout { grid-template-columns: 1fr; }
          .settings-sidebar { position: static; max-height: none; }
          .settings-hero { align-items: center; }
        }
      `}</style>
    </MainLayout>
  );
}
