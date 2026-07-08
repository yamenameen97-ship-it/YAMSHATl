import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { logoutUser } from '../api/auth.js';
import SoundSettingsPanel from '../components/audio/SoundSettingsPanel.jsx';
import LanguageSettings from '../components/settings/LanguageSettings.jsx';
import FontSizeSettings, { applyFontSize } from '../components/settings/FontSizeSettings.jsx';
import TranslationSettings from '../components/settings/TranslationSettings.jsx';
import { SettingsToggle, SettingsRow } from '../components/settings/SettingsShell.jsx';
import YamServicesMenu from '../components/ui/YamServicesMenu.jsx';
import { MEDIA_SECURITY, SIGNED_URL_TTL_SECONDS, currentMediaProviderLabel } from '../config/mediaConfig.js';
import { CooldownUI, RateLimitUI, createAntiSpamReport } from '../security/spam.js';
import deviceTrustService from '../services/deviceTrustService.js';
import notificationService from '../services/notificationService.js';
import { clearStoredUser } from '../utils/auth.js';
import { getCDNConfig, getMediaDeliveryProfile } from '../utils/performance.js';

/**
 * v76 — إعدادات مضغوطة على صفحة واحدة
 * - إزالة روابط الخروج لصفحات فرعية من التبويبات الأساسية.
 * - كل قسم يعرض ملخصه داخل نفس الصفحة + زر "فتح كامل" اختياري للصفحة الفرعية إن وُجدت.
 * - أزرار مصغّرة جداً (mini) لتخفيض الارتفاع.
 * - Padding مدمج + font-size مصغّر لعرض أكبر عدد من الإعدادات في viewport واحد.
 */

// مجموعات الإعدادات — كلها تُعرض في نفس الصفحة (لا links تخرج المستخدم إلا اختيارياً)
const TAB_GROUPS = [
  {
    label: 'الحساب',
    tabs: [
      { key: 'account', label: '👤 الحساب' },
      { key: 'profile', label: '🪪 الملف الشخصي' },
      { key: 'privacy', label: '🔒 الخصوصية' },
      { key: 'security', label: '🛡️ الأمان' },
      { key: 'two-factor', label: '🔑 المصادقة الثنائية' },
      { key: 'devices', label: '💻 الأجهزة الموثوقة' },
      { key: 'sessions', label: '🪟 الجلسات' },
      { key: 'connected-apps', label: '🔗 التطبيقات المرتبطة' },
      { key: 'blocked', label: '🚫 المحظورون' },
      { key: 'muted', label: '🔇 المكتومون' },
    ],
  },
  {
    label: 'المحتوى والخدمات',
    tabs: [
      { key: 'feed', label: '📰 الخلاصة' },
      { key: 'reels', label: '🎬 الريلز' },
      { key: 'stories', label: '📖 الستوريز' },
      { key: 'inbox', label: '✉️ الرسائل' },
      { key: 'voice', label: '🎙️ الغرف الصوتية' },
      { key: 'engagement', label: '⚔️ التفاعل والمعارك' },
      { key: 'wallet', label: '💰 المحفظة' },
    ],
  },
  {
    label: 'التطبيق',
    tabs: [
      { key: 'appearance', label: '🎨 المظهر' },
      { key: 'language', label: '🌐 اللغة' },
      { key: 'font-size', label: '🔤 حجم الخط' },
      { key: 'translation', label: '🌍 الترجمة' },
      { key: 'accessibility', label: '♿ سهولة الوصول' },
      { key: 'notifications', label: '🔔 الإشعارات' },
      { key: 'sounds', label: '🔊 الأصوات' },
      { key: 'data-storage', label: '💾 البيانات' },
      { key: 'media', label: '🎞️ حماية الوسائط' },
      { key: 'sync', label: '🔄 المزامنة' },
      { key: 'performance', label: '⚡ الأداء' },
    ],
  },
  {
    label: 'الدعم',
    tabs: [
      { key: 'download-data', label: '📥 تنزيل بياناتي' },
      { key: 'help', label: '❓ المساعدة' },
      { key: 'feedback', label: '💬 ملاحظات' },
      { key: 'about', label: 'ℹ️ عن التطبيق' },
      { key: 'legal', label: '📜 القانوني' },
    ],
  },
];

// خريطة تبويب → رابط صفحة كاملة (لزر "فتح كامل" الاختياري)
const FULL_PAGE_LINKS = {
  profile: '/settings/profile',
  feed: '/settings/feed',
  reels: '/settings/reels',
  stories: '/settings/stories',
  inbox: '/settings/inbox',
  voice: '/settings/voice',
  engagement: '/settings/engagement',
  wallet: '/settings/wallet',
  notifications: '/settings/notifications',
};

const PREFS_KEY = 'yamshat:app-prefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch { return {}; } };
const savePrefs = (p) => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {} };

// مودال إدخال بيانات
function SettingsModal({ open, title, description, fields = [], confirmLabel = 'حفظ', cancelLabel = 'إلغاء', danger = false, onConfirm, onClose }) {
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const init = {};
      fields.forEach((f) => { init[f.name] = f.defaultValue ?? ''; });
      setValues(init);
      setSubmitting(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try { await onConfirm?.(values); } finally { setSubmitting(false); }
  };

  return (
    <div className="settings-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h3>{title}</h3>
          <button type="button" className="settings-modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        {description ? <p className="muted" style={{ margin: '0 0 10px', fontSize: 12 }}>{description}</p> : null}
        <div style={{ display: 'grid', gap: 8 }}>
          {fields.map((f) => (
            <label key={f.name} style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 11.5, color: 'rgba(226,232,240,0.8)' }}>{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea className="settings-input" rows={3} placeholder={f.placeholder || ''}
                  value={values[f.name] || ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
              ) : f.type === 'select' ? (
                <select className="settings-select" value={values[f.name] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}>
                  {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input className="settings-input" type={f.type || 'text'} placeholder={f.placeholder || ''}
                  value={values[f.name] || ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} />
              )}
              {f.hint ? <small className="muted" style={{ fontSize: 10.5 }}>{f.hint}</small> : null}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="settings-btn-mini" onClick={onClose}>{cancelLabel}</button>
          <button type="button" className={`settings-btn-mini settings-btn-mini--primary ${danger ? 'settings-btn-mini--danger' : ''}`}
            disabled={submitting} onClick={handleConfirm}>
            {submitting ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoModal({ open, title, content, onClose }) {
  if (!open) return null;
  return (
    <div className="settings-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h3>{title}</h3>
          <button type="button" className="settings-modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="settings-modal-content">{content}</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="settings-btn-mini" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

// زر مصغّر موحّد (بديل عن <Button size="small" /> الأكبر حجماً)
function MiniBtn({ children, onClick, variant = 'secondary', danger = false, disabled = false, loading = false, ...rest }) {
  const cls = [
    'settings-btn-mini',
    variant === 'primary' ? 'settings-btn-mini--primary' : '',
    danger ? 'settings-btn-mini--danger' : '',
    loading ? 'is-busy' : '',
  ].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled || loading} {...rest}>
      {loading ? '...' : children}
    </button>
  );
}

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
  const [modal, setModal] = useState(null);
  const [prefs, setPrefs] = useState(() => ({
    theme: 'dark', accentColor: 'purple', fontSize: 'medium', density: 'normal',
    reducedMotion: false, highContrast: false, roundedCorners: true, animations: true,
    privateAccount: false, hideLastSeen: false, hideReadReceipts: false,
    incognitoMode: false, anonymousBrowsing: false, locationSharing: false,
    saveDataMode: false, lowPowerMode: false, prefetchEnabled: true, hardwareAcceleration: true,
    autoBackup: true, backupOnWifi: true, storageLimit: '5GB',
    screenReader: false, largeButtons: false, captionsAlways: false, reduceTransparency: false,
    email: '', phone: '', username: '', birthdate: '', country: '',
    twoFAEmail: false, twoFASms: false, biometric: true,
    googleLinked: true, appleLinked: false, facebookLinked: false, twitterLinked: false,
    // profile / content quick prefs
    showOnlineStatus: true, allowMentions: 'everyone', allowDMs: 'followers',
    // feed
    feedAlgo: 'smart', autoplayVideos: true, showSensitive: false,
    // reels
    reelsAutoplay: true, reelsSaveData: false,
    // stories
    storiesReplies: 'everyone', storiesShareable: true,
    // inbox
    inboxRequestFilter: 'known', readReceipts: true,
    // voice rooms
    voiceAutoJoin: false, voiceNoiseSuppress: true,
    // engagement
    battleNotifs: true, streakReminders: true,
    // wallet
    walletPin: true, walletAutoConfirm: false,
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
    setSuccess('تم الحفظ.');
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
    window.setTimeout(() => setMessage(''), 2000);
  };

  const openEdit = (cfg) => setModal({ type: 'edit', ...cfg });
  const openInfo = (cfg) => setModal({ type: 'info', ...cfg });
  const closeModal = () => setModal(null);

  // ===== الحساب =====
  const handleEditEmail = () => openEdit({
    title: 'تعديل البريد الإلكتروني',
    description: 'سيتم إرسال رابط تأكيد للبريد الجديد.',
    fields: [{ name: 'email', label: 'البريد الجديد', type: 'email', defaultValue: prefs.email, placeholder: 'name@example.com' }],
    confirmLabel: 'إرسال',
    onConfirm: (v) => { updatePref('email', v.email); setSuccess('تم إرسال التأكيد.'); closeModal(); },
  });
  const handleEditPhone = () => openEdit({
    title: 'تعديل رقم الهاتف',
    description: 'سيتم إرسال رمز تحقق عبر SMS.',
    fields: [{ name: 'phone', label: 'رقم الهاتف', type: 'tel', defaultValue: prefs.phone, placeholder: '+966 5xxxxxxxx' }],
    confirmLabel: 'إرسال',
    onConfirm: (v) => { updatePref('phone', v.phone); setSuccess('تم إرسال الرمز.'); closeModal(); },
  });
  const handleChangePassword = () => openEdit({
    title: 'تغيير كلمة المرور',
    fields: [
      { name: 'current', label: 'الحالية', type: 'password' },
      { name: 'next', label: 'الجديدة', type: 'password', hint: '8 أحرف على الأقل' },
      { name: 'confirm', label: 'تأكيد الجديدة', type: 'password' },
    ],
    confirmLabel: 'تغيير',
    onConfirm: (v) => {
      if (!v.current || !v.next) { setSuccess('يرجى تعبئة الحقول.'); return; }
      if (v.next.length < 8) { setSuccess('كلمة المرور قصيرة.'); return; }
      if (v.next !== v.confirm) { setSuccess('غير متطابقتين.'); return; }
      setSuccess('تم التغيير.'); closeModal();
    },
  });
  const handleEditUsername = () => openEdit({
    title: 'اسم المستخدم',
    fields: [{ name: 'username', label: 'اسم المستخدم', defaultValue: prefs.username, placeholder: '@username' }],
    onConfirm: (v) => { updatePref('username', v.username); setSuccess('تم التحديث.'); closeModal(); },
  });
  const handleEditBirthdate = () => openEdit({
    title: 'تاريخ الميلاد',
    fields: [{ name: 'birthdate', label: 'التاريخ', type: 'date', defaultValue: prefs.birthdate }],
    onConfirm: (v) => { updatePref('birthdate', v.birthdate); setSuccess('تم التحديث.'); closeModal(); },
  });
  const handleEditCountry = () => openEdit({
    title: 'الدولة',
    fields: [
      { name: 'country', label: 'الدولة', type: 'select', defaultValue: prefs.country || 'SA', options: [
        { value: 'SA', label: 'السعودية' }, { value: 'AE', label: 'الإمارات' }, { value: 'EG', label: 'مصر' },
        { value: 'JO', label: 'الأردن' }, { value: 'KW', label: 'الكويت' }, { value: 'QA', label: 'قطر' },
        { value: 'OM', label: 'عُمان' }, { value: 'BH', label: 'البحرين' }, { value: 'IQ', label: 'العراق' },
        { value: 'MA', label: 'المغرب' }, { value: 'DZ', label: 'الجزائر' }, { value: 'TN', label: 'تونس' },
        { value: 'LY', label: 'ليبيا' }, { value: 'YE', label: 'اليمن' }, { value: 'SY', label: 'سوريا' },
        { value: 'LB', label: 'لبنان' }, { value: 'PS', label: 'فلسطين' }, { value: 'SD', label: 'السودان' },
        { value: 'OTHER', label: 'أخرى' },
      ] },
    ],
    onConfirm: (v) => { updatePref('country', v.country); setSuccess('تم التحديث.'); closeModal(); },
  });

  const handleSuspendAccount = () => openEdit({
    title: 'إيقاف مؤقت',
    description: 'سيُخفى حسابك دون حذف بياناتك.',
    fields: [{ name: 'reason', label: 'السبب (اختياري)', type: 'textarea', placeholder: 'أحتاج استراحة...' }],
    confirmLabel: 'إيقاف', danger: true,
    onConfirm: () => { setSuccess('تم الإيقاف.'); closeModal(); window.setTimeout(handleLogout, 1200); },
  });
  const handleDeleteAccount = () => openEdit({
    title: 'حذف الحساب',
    description: '⚠️ لا يمكن التراجع. سيتم حذف بياناتك خلال 30 يومًا.',
    fields: [{ name: 'confirm', label: 'اكتب "حذف نهائي"', placeholder: 'حذف نهائي' }],
    confirmLabel: 'حذف', danger: true,
    onConfirm: (v) => {
      if (v.confirm !== 'حذف نهائي') { setSuccess('اكتب "حذف نهائي".'); return; }
      setSuccess('تم تسجيل الطلب.'); closeModal();
    },
  });
  const handleConvertBusiness = () => openEdit({
    title: 'حساب أعمال',
    fields: [
      { name: 'category', label: 'الفئة', type: 'select', defaultValue: 'creator', options: [
        { value: 'creator', label: 'صانع محتوى' }, { value: 'shop', label: 'متجر' },
        { value: 'service', label: 'خدمات' }, { value: 'media', label: 'وسائل إعلام' }, { value: 'other', label: 'أخرى' },
      ] },
      { name: 'website', label: 'الموقع (اختياري)', type: 'url', placeholder: 'https://...' },
    ],
    confirmLabel: 'تحويل',
    onConfirm: () => { setSuccess('تم التحويل.'); closeModal(); },
  });

  // ===== 2FA =====
  const handle2FAApp = () => openEdit({
    title: 'تطبيق المصادقة',
    description: 'امسح QR ثم أدخل الرمز.',
    fields: [{ name: 'code', label: 'رمز 6 أرقام', placeholder: '123456' }],
    confirmLabel: 'تفعيل',
    onConfirm: (v) => {
      if (!/^\d{6}$/.test(v.code || '')) { setSuccess('6 أرقام مطلوبة.'); return; }
      setSuccess('تم التفعيل.'); closeModal();
    },
  });
  const handleAddHardwareKey = () => openEdit({
    title: 'مفتاح أمان',
    fields: [{ name: 'label', label: 'اسم المفتاح', placeholder: 'YubiKey' }],
    confirmLabel: 'تسجيل',
    onConfirm: () => { setSuccess('تم التسجيل.'); closeModal(); },
  });
  const handleRecoveryCodes = () => {
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    );
    openInfo({
      title: 'رموز الاسترداد',
      content: (
        <div>
          <p className="muted" style={{ fontSize: 12 }}>احفظ الرموز — كل رمز يُستخدم مرة واحدة.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 8 }}>
            {codes.map((c) => <code key={c} style={{ padding: '5px 7px', background: 'rgba(15,23,42,0.6)', borderRadius: 6, fontFamily: 'monospace', textAlign: 'center', fontSize: 11.5 }}>{c}</code>)}
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="settings-btn-mini" onClick={() => {
              navigator.clipboard?.writeText(codes.join('\n')).then(() => setSuccess('تم النسخ.')).catch(() => {});
            }}>📋 نسخ الكل</button>
          </div>
        </div>
      ),
    });
  };

  const handleOAuth = (provider) => {
    const key = provider + 'Linked';
    if (prefs[key]) {
      if (!window.confirm(`إلغاء ربط ${provider}؟`)) return;
      updatePref(key, false); setSuccess(`أُلغي ربط ${provider}.`);
    } else {
      updatePref(key, true); setSuccess(`تم ربط ${provider}.`);
    }
  };

  const handleRevokeAllSessions = () => {
    if (!window.confirm('إنهاء كل الجلسات الأخرى؟')) return;
    setBusy('revoke-all');
    Promise.all(sessions.filter((s) => !s.current).map((s) => deviceTrustService.revokeSession(s.id).catch(() => null)))
      .then(async () => { setSessions(await deviceTrustService.getSessions()); setSuccess('تم الإنهاء.'); })
      .finally(() => setBusy(''));
  };

  const handleClearMedia = () => {
    if (!window.confirm('مسح الوسائط المنزّلة؟')) return;
    try {
      Object.keys(localStorage).filter((k) => k.includes(':media') || k.includes(':downloads')).forEach((k) => localStorage.removeItem(k));
      if ('caches' in window) caches.keys().then((keys) => keys.filter((k) => k.includes('media') || k.includes('image')).forEach((k) => caches.delete(k)));
      setSuccess('تم المسح.');
    } catch { setSuccess('تعذّر المسح.'); }
  };

  const handleRate = () => openEdit({
    title: 'قيّم التطبيق',
    fields: [
      { name: 'stars', label: 'التقييم', type: 'select', defaultValue: '5', options: [
        { value: '5', label: '⭐⭐⭐⭐⭐' }, { value: '4', label: '⭐⭐⭐⭐' },
        { value: '3', label: '⭐⭐⭐' }, { value: '2', label: '⭐⭐' }, { value: '1', label: '⭐' },
      ] },
      { name: 'comment', label: 'تعليق (اختياري)', type: 'textarea' },
    ],
    confirmLabel: 'إرسال',
    onConfirm: () => { setSuccess('شكراً! 🌟'); closeModal(); },
  });
  const handleSuggest = () => openEdit({
    title: 'اقترح ميزة',
    fields: [
      { name: 'title', label: 'العنوان' },
      { name: 'desc', label: 'التفاصيل', type: 'textarea' },
    ],
    confirmLabel: 'إرسال',
    onConfirm: () => { setSuccess('تم الإرسال. 💡'); closeModal(); },
  });
  const handleReport = (defaultType = 'bug') => openEdit({
    title: 'الإبلاغ عن مشكلة',
    fields: [
      { name: 'type', label: 'النوع', type: 'select', defaultValue: defaultType, options: [
        { value: 'bug', label: '🐞 خطأ تقني' }, { value: 'ui', label: '🎨 واجهة' },
        { value: 'perf', label: '⚡ بطء' }, { value: 'crash', label: '💥 توقف' }, { value: 'other', label: 'أخرى' },
      ] },
      { name: 'desc', label: 'الوصف', type: 'textarea' },
    ],
    confirmLabel: 'إبلاغ',
    onConfirm: () => { setSuccess('تم الاستلام. 🙏'); closeModal(); },
  });
  const handleContactSupport = () => openEdit({
    title: 'الدعم الفني',
    description: 'متوسط الرد: أقل من ساعتين.',
    fields: [
      { name: 'topic', label: 'الموضوع' },
      { name: 'msg', label: 'التفاصيل', type: 'textarea' },
    ],
    confirmLabel: 'إرسال',
    onConfirm: () => { setSuccess('تم الإرسال.'); closeModal(); },
  });

  const showFAQ = () => openInfo({
    title: 'الأسئلة الشائعة',
    content: (
      <div style={{ display: 'grid', gap: 8 }}>
        {[
          { q: 'كيف أغيّر كلمة المرور؟', a: 'من "الحساب" ← "تغيير كلمة المرور".' },
          { q: 'كيف أفعّل 2FA؟', a: 'من "المصادقة الثنائية".' },
          { q: 'كيف أوقف الإشعارات؟', a: 'من "الإشعارات".' },
          { q: 'كيف أحذف حسابي؟', a: '"الحساب" ← "حذف نهائي".' },
          { q: 'هل بياناتي مشفّرة؟', a: 'نعم، جميع الرسائل E2E.' },
        ].map((item, i) => (
          <div key={i} style={{ padding: 8, background: 'rgba(15,23,42,0.5)', borderRadius: 8 }}>
            <strong style={{ display: 'block', marginBottom: 4, fontSize: 12.5 }}>{item.q}</strong>
            <span className="muted" style={{ fontSize: 11.5 }}>{item.a}</span>
          </div>
        ))}
      </div>
    ),
  });
  const showTutorials = () => openInfo({
    title: 'دروس البدء',
    content: (
      <div style={{ display: 'grid', gap: 6 }}>
        {['🎬 رفع أول ريل', '📖 نشر ستوري', '💬 محادثة جماعية', '🎙️ غرفة صوتية', '⚔️ معارك التفاعل', '💰 شحن المحفظة'].map((t, i) => (
          <div key={i} style={{ padding: 8, background: 'rgba(15,23,42,0.5)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5 }}>{t}</span>
            <button className="settings-btn-mini" onClick={() => { closeModal(); navigate('/support'); }}>عرض</button>
          </div>
        ))}
      </div>
    ),
  });
  const showWhatsNew = () => openInfo({
    title: 'ما الجديد',
    content: (
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ padding: 10, background: 'rgba(99,102,241,0.12)', borderRadius: 8, borderInlineStart: '3px solid #6366f1' }}>
          <strong style={{ fontSize: 12.5 }}>v76 — إعدادات مضغوطة</strong>
          <ul style={{ margin: '4px 0 0', paddingInlineStart: 16, fontSize: 11.5, color: 'rgba(226,232,240,0.8)' }}>
            <li>كل الأقسام في صفحة واحدة.</li>
            <li>أزرار مصغّرة وخط مدمج.</li>
            <li>لا تنقل بين الصفحات إلا اختيارياً.</li>
          </ul>
        </div>
      </div>
    ),
  });
  const showLegal = (kind) => {
    const contents = {
      cookies: { title: 'الكوكيز', body: 'نستخدم الكوكيز لحفظ الجلسة وتخصيص الواجهة وقياس الأداء.' },
      dmca: { title: 'DMCA', body: 'لشكوى: copyright@yamshat.com يتضمن وصف العمل ورابط المحتوى.' },
      community: { title: 'إرشادات المجتمع', body: 'يُمنع: التحرش، خطاب الكراهية، السبام، انتحال الهوية.' },
    };
    const c = contents[kind];
    openInfo({ title: c.title, content: <p style={{ margin: 0, lineHeight: 1.7, fontSize: 12.5 }}>{c.body}</p> });
  };
  const showAbout = (kind) => {
    const contents = { site: { title: 'الموقع', body: 'yamshat.com — الأخبار والتحديثات.' } };
    const c = contents[kind];
    openInfo({ title: c.title, content: <p style={{ margin: 0, fontSize: 12.5 }}>{c.body}</p> });
  };

  const handleTrustCurrentDevice = async () => {
    setBusy('trust-device');
    await deviceTrustService.trustCurrentDevice();
    setTrustedDevices(await deviceTrustService.getTrustedDevices());
    setSuccess('تم توثيق الجهاز.'); setBusy('');
  };
  const handleRemoveDevice = async (deviceId) => {
    setBusy(deviceId);
    await deviceTrustService.untrustDevice(deviceId);
    setTrustedDevices(await deviceTrustService.getTrustedDevices());
    setSuccess('تم الحذف.'); setBusy('');
  };
  const handleRevokeSession = async (sessionId) => {
    setBusy(sessionId);
    await deviceTrustService.revokeSession(sessionId);
    setSessions(await deviceTrustService.getSessions());
    setSuccess('تم الإنهاء.'); setBusy('');
  };
  const handleEnablePush = async () => {
    setBusy('push');
    await notificationService.initialize();
    await notificationService.subscribeToPushNotifications().catch(() => null);
    setPushState(notificationService.getPushReadiness());
    setSuccess('تم التفعيل.'); setBusy('');
  };
  const handleSyncNow = () => {
    const next = deviceTrustService.updateSyncState({
      profile_revision: Number(syncState.profile_revision || 1) + 1,
      notifications_revision: Number(syncState.notifications_revision || 1) + 1,
      inbox_revision: Number(syncState.inbox_revision || 1) + 1,
      devices_online: Math.max(1, trustedDevices.length),
    });
    setSyncState(next); setSuccess('تمت المزامنة.');
  };
  const handleLogout = useCallback(async () => {
    try { await logoutUser(); } catch {}
    clearStoredUser(); setMenuOpen(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const updateActiveTab = (tabKey) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(location.search);
    params.set('tab', tabKey);
    navigate({ pathname: '/settings', search: `?${params.toString()}` }, { replace: true });
  };

  const handleDownloadData = (kind = 'full') => {
    const labels = { full: 'الأرشيف الكامل', activity: 'سجل النشاط', media: 'الوسائط' };
    setSuccess(`تم تسجيل طلب تنزيل ${labels[kind]}.`);
  };
  const handleClearCache = () => {
    if (!window.confirm('مسح الكاش؟')) return;
    try {
      Object.keys(localStorage).filter(k => k.includes(':cache')).forEach(k => localStorage.removeItem(k));
      if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      setSuccess('تم المسح.');
    } catch {}
  };

  // زر "فتح الصفحة الكاملة" — اختياري لكل قسم له صفحة فرعية
  const FullPageLink = ({ tabKey }) => {
    const link = FULL_PAGE_LINKS[tabKey];
    if (!link) return null;
    return (
      <MiniBtn onClick={() => navigate(link)}>فتح الصفحة الكاملة ›</MiniBtn>
    );
  };

  return (
    <MainLayout>
      <div className="settings-wrap" dir="rtl">
        <div className="settings-hero">
          <div>
            <h1>الإعدادات</h1>
            <p className="muted">تحكم كامل في حسابك، خصوصيتك، أمانك، ومحتواك.</p>
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
                <div className="settings-group-tabs">
                  {group.tabs.map((tab) => (
                    <button key={tab.key} type="button"
                      className={`settings-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => updateActiveTab(tab.key)}
                      title={tab.label}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <main className="settings-main">
            {/* ===== الحساب ===== */}
            {activeTab === 'account' ? (
              <>
                <Card className="s-card">
                  <h3 className="s-h3">معلومات الحساب</h3>
                  <SettingsRow icon="📧" title="البريد الإلكتروني" description={prefs.email || 'تغيير البريد المرتبط'}>
                    <MiniBtn onClick={handleEditEmail}>تعديل</MiniBtn>
                  </SettingsRow>
                  <SettingsRow icon="📱" title="رقم الهاتف" description={prefs.phone || 'رقم للتحقق والاسترداد'}>
                    <MiniBtn onClick={handleEditPhone}>تعديل</MiniBtn>
                  </SettingsRow>
                  <SettingsRow icon="🔑" title="كلمة المرور">
                    <MiniBtn onClick={handleChangePassword}>تغيير</MiniBtn>
                  </SettingsRow>
                  <SettingsRow icon="🆔" title="اسم المستخدم" description={prefs.username || '—'}>
                    <MiniBtn onClick={handleEditUsername}>تعديل</MiniBtn>
                  </SettingsRow>
                  <SettingsRow icon="🎂" title="تاريخ الميلاد" description={prefs.birthdate || '—'}>
                    <MiniBtn onClick={handleEditBirthdate}>تعديل</MiniBtn>
                  </SettingsRow>
                  <SettingsRow icon="🌍" title="الدولة" description={prefs.country || '—'}>
                    <MiniBtn onClick={handleEditCountry}>تعديل</MiniBtn>
                  </SettingsRow>
                </Card>
                <Card className="s-card">
                  <h3 className="s-h3">إدارة الحساب</h3>
                  <SettingsRow icon="⏸️" title="إيقاف مؤقت" description="إخفاء دون حذف">
                    <MiniBtn danger onClick={handleSuspendAccount}>إيقاف</MiniBtn>
                  </SettingsRow>
                  <SettingsRow icon="❌" title="حذف نهائي" description="حذف دائم لجميع البيانات">
                    <MiniBtn danger onClick={handleDeleteAccount}>حذف</MiniBtn>
                  </SettingsRow>
                  <SettingsRow icon="🔄" title="تحويل لحساب أعمال">
                    <MiniBtn onClick={handleConvertBusiness}>تحويل</MiniBtn>
                  </SettingsRow>
                </Card>
              </>
            ) : null}

            {/* ===== الملف الشخصي ===== */}
            {activeTab === 'profile' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">الملف الشخصي</h3>
                  <FullPageLink tabKey="profile" />
                </div>
                <SettingsRow icon="🔒" title="حساب خاص">
                  <SettingsToggle on={prefs.privateAccount} onChange={(v) => updatePref('privateAccount', v)} />
                </SettingsRow>
                <SettingsRow icon="🟢" title="إظهار حالة الاتصال">
                  <SettingsToggle on={prefs.showOnlineStatus} onChange={(v) => updatePref('showOnlineStatus', v)} />
                </SettingsRow>
                <SettingsRow icon="@" title="من يمكنه الإشارة إليك">
                  <select className="settings-select" value={prefs.allowMentions} onChange={(e) => updatePref('allowMentions', e.target.value)}>
                    <option value="everyone">الجميع</option>
                    <option value="followers">المتابعون</option>
                    <option value="nobody">لا أحد</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="✉️" title="من يمكنه مراسلتك">
                  <select className="settings-select" value={prefs.allowDMs} onChange={(e) => updatePref('allowDMs', e.target.value)}>
                    <option value="everyone">الجميع</option>
                    <option value="followers">المتابعون</option>
                    <option value="nobody">لا أحد</option>
                  </select>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الخصوصية ===== */}
            {activeTab === 'privacy' ? (
              <Card className="s-card">
                <h3 className="s-h3">الخصوصية</h3>
                <SettingsRow icon="🔒" title="حساب خاص">
                  <SettingsToggle on={prefs.privateAccount} onChange={(v) => updatePref('privateAccount', v)} />
                </SettingsRow>
                <SettingsRow icon="⏱️" title="إخفاء آخر ظهور">
                  <SettingsToggle on={prefs.hideLastSeen} onChange={(v) => updatePref('hideLastSeen', v)} />
                </SettingsRow>
                <SettingsRow icon="✓✓" title="إخفاء إيصالات القراءة">
                  <SettingsToggle on={prefs.hideReadReceipts} onChange={(v) => updatePref('hideReadReceipts', v)} />
                </SettingsRow>
                <SettingsRow icon="🕵️" title="التصفح الخفي">
                  <SettingsToggle on={prefs.incognitoMode} onChange={(v) => updatePref('incognitoMode', v)} />
                </SettingsRow>
                <SettingsRow icon="👤" title="تصفح دون تسجيل مشاهدة">
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
                <Card className="s-card">
                  <h3 className="s-h3">مكافحة السبام والبوتات</h3>
                  <div className="stats-grid">
                    <div className="metric-card"><span>Rate limit</span><strong>{antiSpam.remainingRequests}</strong></div>
                    <div className="metric-card"><span>Bot score</span><strong>{antiSpam.bot.score}/100</strong></div>
                    <div className="metric-card"><span>Verdict</span><strong>{antiSpam.bot.verdict}</strong></div>
                    <div className="metric-card"><span>Shadow ban</span><strong>{antiSpam.shadowBanned ? 'ON' : 'OFF'}</strong></div>
                  </div>
                  <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    <RateLimitUI remaining={antiSpam.remainingRequests} resetTime={antiSpam.resetInMs} />
                    <CooldownUI remaining={antiSpam.bot.score >= 35 ? 9000 : 0} action="إعادة المحاولة" />
                  </div>
                </Card>
                <Card className="s-card">
                  <h3 className="s-h3">تنبيهات تسجيل الدخول</h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {alerts.length === 0 ? <div className="muted" style={{ padding: 12, textAlign: 'center', fontSize: 12 }}>لا تنبيهات.</div> : null}
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

            {/* ===== 2FA ===== */}
            {activeTab === 'two-factor' ? (
              <Card className="s-card">
                <h3 className="s-h3">المصادقة الثنائية</h3>
                <p className="muted s-p">طبقة حماية إضافية. اختر طريقة واحدة على الأقل.</p>
                <SettingsRow icon="📱" title="تطبيق مصادقة" description="Google Authenticator, Authy">
                  <MiniBtn onClick={handle2FAApp}>إعداد</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="📧" title="عبر البريد">
                  <SettingsToggle on={prefs.twoFAEmail} onChange={(v) => { updatePref('twoFAEmail', v); }} />
                </SettingsRow>
                <SettingsRow icon="📩" title="عبر SMS">
                  <SettingsToggle on={prefs.twoFASms} onChange={(v) => { updatePref('twoFASms', v); }} />
                </SettingsRow>
                <SettingsRow icon="🗝️" title="مفتاح أمان" description="YubiKey">
                  <MiniBtn onClick={handleAddHardwareKey}>إضافة</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🆘" title="رموز الاسترداد">
                  <MiniBtn onClick={handleRecoveryCodes}>عرض</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="👆" title="البصمة / Face ID">
                  <SettingsToggle on={prefs.biometric} onChange={(v) => updatePref('biometric', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الأجهزة ===== */}
            {activeTab === 'devices' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <div>
                    <h3 className="s-h3">الأجهزة الموثوقة</h3>
                    <div className="muted s-p">إدارة الأجهزة المسجل دخولها.</div>
                  </div>
                  <MiniBtn variant="primary" onClick={handleTrustCurrentDevice} loading={busy === 'trust-device'}>توثيق الحالي</MiniBtn>
                </div>
                <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                  {trustedDevices.length === 0 ? <div className="muted" style={{ padding: 12, textAlign: 'center', fontSize: 12 }}>لا أجهزة.</div> : null}
                  {trustedDevices.map((device) => (
                    <div key={device.id || device.device_id} className="list-row">
                      <div>
                        <strong>{device.label || device.device_label || 'Device'}</strong>
                        <div className="muted">آخر ظهور: {new Date(device.lastSeenAt || device.last_active_at || Date.now()).toLocaleString('ar-EG')}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="score-pill">{device.current ? 'حالي' : 'موثوق'}</span>
                        {!device.current ? <MiniBtn onClick={() => handleRemoveDevice(device.id || device.device_id)} loading={busy === (device.id || device.device_id)}>إزالة</MiniBtn> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* ===== الجلسات ===== */}
            {activeTab === 'sessions' ? (
              <Card className="s-card">
                <h3 className="s-h3">الجلسات النشطة</h3>
                <div style={{ display: 'grid', gap: 6 }}>
                  {sessions.length === 0 ? <div className="muted" style={{ padding: 12, textAlign: 'center', fontSize: 12 }}>لا جلسات.</div> : null}
                  {sessions.map((session) => (
                    <div key={session.id} className="list-row">
                      <div>
                        <strong>{session.device_label || session.label || 'Session'}</strong>
                        <div className="muted">آخر نشاط: {new Date(session.last_active_at || Date.now()).toLocaleString('ar-EG')}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="score-pill">{session.sync_state || 'صحية'}</span>
                        {!session.current ? <MiniBtn onClick={() => handleRevokeSession(session.id)} loading={busy === session.id}>إنهاء</MiniBtn> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <MiniBtn danger onClick={handleRevokeAllSessions} loading={busy === 'revoke-all'}>إنهاء الكل عدا الحالية</MiniBtn>
                </div>
              </Card>
            ) : null}

            {/* ===== OAuth ===== */}
            {activeTab === 'connected-apps' ? (
              <Card className="s-card">
                <h3 className="s-h3">التطبيقات المرتبطة (OAuth)</h3>
                <SettingsRow icon="G" title="Google" description={prefs.googleLinked ? 'مرتبط' : 'غير مرتبط'}>
                  <MiniBtn danger={prefs.googleLinked} onClick={() => handleOAuth('google')}>{prefs.googleLinked ? 'إلغاء' : 'ربط'}</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🍎" title="Apple" description={prefs.appleLinked ? 'مرتبط' : 'غير مرتبط'}>
                  <MiniBtn danger={prefs.appleLinked} onClick={() => handleOAuth('apple')}>{prefs.appleLinked ? 'إلغاء' : 'ربط'}</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="📘" title="Facebook" description={prefs.facebookLinked ? 'مرتبط' : 'غير مرتبط'}>
                  <MiniBtn danger={prefs.facebookLinked} onClick={() => handleOAuth('facebook')}>{prefs.facebookLinked ? 'إلغاء' : 'ربط'}</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="X" title="X (Twitter)" description={prefs.twitterLinked ? 'مرتبط' : 'غير مرتبط'}>
                  <MiniBtn danger={prefs.twitterLinked} onClick={() => handleOAuth('twitter')}>{prefs.twitterLinked ? 'إلغاء' : 'ربط'}</MiniBtn>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== المحظورون / المكتومون ===== */}
            {activeTab === 'blocked' ? (
              <Card className="s-card">
                <h3 className="s-h3">المحظورون</h3>
                <p className="muted s-p">لا يمكن للمحظورين رؤيتك أو التواصل معك.</p>
                <div className="muted" style={{ padding: 16, textAlign: 'center', fontSize: 12 }}>لا حسابات محظورة.</div>
              </Card>
            ) : null}
            {activeTab === 'muted' ? (
              <Card className="s-card">
                <h3 className="s-h3">المكتومون</h3>
                <p className="muted s-p">لن ترى منشورات أو ستوريز هذه الحسابات.</p>
                <div className="muted" style={{ padding: 16, textAlign: 'center', fontSize: 12 }}>لا حسابات مكتومة.</div>
              </Card>
            ) : null}

            {/* ===== المحتوى: الخلاصة ===== */}
            {activeTab === 'feed' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">الخلاصة (Feed)</h3>
                  <FullPageLink tabKey="feed" />
                </div>
                <SettingsRow icon="🧠" title="خوارزمية الخلاصة">
                  <select className="settings-select" value={prefs.feedAlgo} onChange={(e) => updatePref('feedAlgo', e.target.value)}>
                    <option value="smart">ذكية</option>
                    <option value="chronological">زمنية</option>
                    <option value="following">المتابعون فقط</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="▶️" title="تشغيل الفيديو تلقائياً">
                  <SettingsToggle on={prefs.autoplayVideos} onChange={(v) => updatePref('autoplayVideos', v)} />
                </SettingsRow>
                <SettingsRow icon="⚠️" title="إظهار المحتوى الحساس">
                  <SettingsToggle on={prefs.showSensitive} onChange={(v) => updatePref('showSensitive', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الريلز ===== */}
            {activeTab === 'reels' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">الريلز</h3>
                  <FullPageLink tabKey="reels" />
                </div>
                <SettingsRow icon="▶️" title="التشغيل التلقائي">
                  <SettingsToggle on={prefs.reelsAutoplay} onChange={(v) => updatePref('reelsAutoplay', v)} />
                </SettingsRow>
                <SettingsRow icon="💾" title="توفير البيانات">
                  <SettingsToggle on={prefs.reelsSaveData} onChange={(v) => updatePref('reelsSaveData', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الستوريز ===== */}
            {activeTab === 'stories' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">الستوريز</h3>
                  <FullPageLink tabKey="stories" />
                </div>
                <SettingsRow icon="💬" title="من يمكنه الرد">
                  <select className="settings-select" value={prefs.storiesReplies} onChange={(e) => updatePref('storiesReplies', e.target.value)}>
                    <option value="everyone">الجميع</option>
                    <option value="followers">المتابعون</option>
                    <option value="nobody">لا أحد</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="↗️" title="السماح بمشاركة الستوري">
                  <SettingsToggle on={prefs.storiesShareable} onChange={(v) => updatePref('storiesShareable', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الرسائل ===== */}
            {activeTab === 'inbox' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">الرسائل</h3>
                  <FullPageLink tabKey="inbox" />
                </div>
                <SettingsRow icon="🔍" title="فلترة طلبات الرسائل">
                  <select className="settings-select" value={prefs.inboxRequestFilter} onChange={(e) => updatePref('inboxRequestFilter', e.target.value)}>
                    <option value="all">الكل</option>
                    <option value="known">المعروفون</option>
                    <option value="followers">المتابعون فقط</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="✓✓" title="إيصالات القراءة">
                  <SettingsToggle on={prefs.readReceipts} onChange={(v) => updatePref('readReceipts', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== الغرف الصوتية ===== */}
            {activeTab === 'voice' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">الغرف الصوتية</h3>
                  <FullPageLink tabKey="voice" />
                </div>
                <SettingsRow icon="🎙️" title="الانضمام التلقائي">
                  <SettingsToggle on={prefs.voiceAutoJoin} onChange={(v) => updatePref('voiceAutoJoin', v)} />
                </SettingsRow>
                <SettingsRow icon="🔇" title="إلغاء الضوضاء">
                  <SettingsToggle on={prefs.voiceNoiseSuppress} onChange={(v) => updatePref('voiceNoiseSuppress', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== التفاعل والمعارك ===== */}
            {activeTab === 'engagement' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">التفاعل والمعارك</h3>
                  <FullPageLink tabKey="engagement" />
                </div>
                <SettingsRow icon="⚔️" title="إشعارات المعارك">
                  <SettingsToggle on={prefs.battleNotifs} onChange={(v) => updatePref('battleNotifs', v)} />
                </SettingsRow>
                <SettingsRow icon="🔥" title="تذكير السلاسل اليومية">
                  <SettingsToggle on={prefs.streakReminders} onChange={(v) => updatePref('streakReminders', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== المحفظة ===== */}
            {activeTab === 'wallet' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <h3 className="s-h3">المحفظة</h3>
                  <FullPageLink tabKey="wallet" />
                </div>
                <SettingsRow icon="🔐" title="حماية بـ PIN">
                  <SettingsToggle on={prefs.walletPin} onChange={(v) => updatePref('walletPin', v)} />
                </SettingsRow>
                <SettingsRow icon="⚡" title="تأكيد تلقائي للمبالغ الصغيرة">
                  <SettingsToggle on={prefs.walletAutoConfirm} onChange={(v) => updatePref('walletAutoConfirm', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== المظهر ===== */}
            {activeTab === 'appearance' ? (
              <Card className="s-card">
                <h3 className="s-h3">المظهر والثيم</h3>
                <SettingsRow icon="🌓" title="ثيم التطبيق">
                  <select className="settings-select" value={prefs.theme} onChange={(e) => updatePref('theme', e.target.value)}>
                    <option value="dark">داكن</option>
                    <option value="light">فاتح</option>
                    <option value="auto">تلقائي</option>
                    <option value="amoled">AMOLED</option>
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
                  <select className="settings-select" value={prefs.fontSize} onChange={(e) => { updatePref('fontSize', e.target.value); applyFontSize(e.target.value); }}>
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
                <SettingsRow icon="✨" title="الحركات والانتقالات">
                  <SettingsToggle on={prefs.animations} onChange={(v) => updatePref('animations', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== اللغة ===== */}
            {activeTab === 'language' ? <LanguageSettings /> : null}

            {/* ===== حجم الخط ===== */}
            {activeTab === 'font-size' ? (
              <FontSizeSettings value={prefs.fontSize} onChange={(v) => { updatePref('fontSize', v); applyFontSize(v); }} />
            ) : null}

            {/* ===== الترجمة ===== */}
            {activeTab === 'translation' ? <TranslationSettings /> : null}

            {/* ===== سهولة الوصول ===== */}
            {activeTab === 'accessibility' ? (
              <Card className="s-card">
                <h3 className="s-h3">سهولة الوصول</h3>
                <SettingsRow icon="🎙️" title="قارئ الشاشة">
                  <SettingsToggle on={prefs.screenReader} onChange={(v) => updatePref('screenReader', v)} />
                </SettingsRow>
                <SettingsRow icon="🔲" title="أزرار كبيرة">
                  <SettingsToggle on={prefs.largeButtons} onChange={(v) => updatePref('largeButtons', v)} />
                </SettingsRow>
                <SettingsRow icon="📝" title="ترجمة دائماً">
                  <SettingsToggle on={prefs.captionsAlways} onChange={(v) => updatePref('captionsAlways', v)} />
                </SettingsRow>
                <SettingsRow icon="🎬" title="تقليل الحركة">
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

            {/* ===== الإشعارات ===== */}
            {activeTab === 'notifications' ? (
              <>
                <Card className="s-card">
                  <div className="s-card-header">
                    <div>
                      <h3 className="s-h3">إشعارات Push</h3>
                      <div className="muted s-p">Android + PWA + service worker.</div>
                    </div>
                    <MiniBtn variant="primary" onClick={handleEnablePush} loading={busy === 'push'}>تفعيل</MiniBtn>
                  </div>
                  <div className="stats-grid" style={{ marginTop: 10 }}>
                    <div className="metric-card"><span>Permission</span><strong>{pushState.permission}</strong></div>
                    <div className="metric-card"><span>Android</span><strong>{pushState.androidReady ? 'جاهز' : 'لا'}</strong></div>
                    <div className="metric-card"><span>PWA</span><strong>{pushState.pwaReady ? 'ثابت' : 'متصفح'}</strong></div>
                    <div className="metric-card"><span>Background</span><strong>{pushState.supportsBackground ? 'On' : 'Off'}</strong></div>
                  </div>
                </Card>
                <Card className="s-card">
                  <SettingsRow icon="🔔" title="إعدادات تفصيلية" description="تحكم كامل بأنواع الإشعارات">
                    <FullPageLink tabKey="notifications" />
                  </SettingsRow>
                </Card>
              </>
            ) : null}

            {/* ===== الأصوات ===== */}
            {activeTab === 'sounds' ? (
              <Card className="s-card">
                <SoundSettingsPanel />
              </Card>
            ) : null}

            {/* ===== البيانات ===== */}
            {activeTab === 'data-storage' ? (
              <Card className="s-card">
                <h3 className="s-h3">البيانات والتخزين</h3>
                <SettingsRow icon="💾" title="توفير البيانات">
                  <SettingsToggle on={prefs.saveDataMode} onChange={(v) => updatePref('saveDataMode', v)} />
                </SettingsRow>
                <SettingsRow icon="📦" title="حد التخزين">
                  <select className="settings-select" value={prefs.storageLimit} onChange={(e) => updatePref('storageLimit', e.target.value)}>
                    <option value="500MB">500 MB</option>
                    <option value="1GB">1 GB</option>
                    <option value="2GB">2 GB</option>
                    <option value="5GB">5 GB</option>
                    <option value="10GB">10 GB</option>
                    <option value="unlimited">بلا حد</option>
                  </select>
                </SettingsRow>
                <SettingsRow icon="☁️" title="نسخ احتياطي تلقائي">
                  <SettingsToggle on={prefs.autoBackup} onChange={(v) => updatePref('autoBackup', v)} />
                </SettingsRow>
                <SettingsRow icon="📶" title="على WiFi فقط">
                  <SettingsToggle on={prefs.backupOnWifi} onChange={(v) => updatePref('backupOnWifi', v)} />
                </SettingsRow>
                <SettingsRow icon="🧹" title="مسح الكاش">
                  <MiniBtn onClick={handleClearCache}>مسح</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="📥" title="مسح الوسائط المنزّلة">
                  <MiniBtn danger onClick={handleClearMedia}>مسح</MiniBtn>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== حماية الوسائط ===== */}
            {activeTab === 'media' ? (
              <>
                <Card className="s-card">
                  <h3 className="s-h3">حماية الوسائط</h3>
                  <div className="stats-grid">
                    <div className="metric-card"><span>Signed URLs</span><strong>{MEDIA_SECURITY.signedUrls ? 'On' : 'Off'}</strong></div>
                    <div className="metric-card"><span>Expiring</span><strong>{MEDIA_SECURITY.expiringLinks ? `${SIGNED_URL_TTL_SECONDS}s` : 'Off'}</strong></div>
                    <div className="metric-card"><span>Encrypted</span><strong>{MEDIA_SECURITY.encryptedUploads ? 'On' : 'Off'}</strong></div>
                    <div className="metric-card"><span>Provider</span><strong>{currentMediaProviderLabel()}</strong></div>
                  </div>
                </Card>
                <Card className="s-card">
                  <h3 className="s-h3">تسريع CDN</h3>
                  <div className="muted s-p">الوسائط تُسرَّع عبر CDN عالمي.</div>
                  <div style={{ display: 'grid', gap: 6 }}>
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
                  <div className="muted" style={{ marginTop: 8, fontSize: 11 }}>المناطق: {cdnConfig.regions.join(' • ')}</div>
                </Card>
              </>
            ) : null}

            {/* ===== مزامنة ===== */}
            {activeTab === 'sync' ? (
              <Card className="s-card">
                <div className="s-card-header">
                  <div>
                    <h3 className="s-h3">مزامنة الأجهزة</h3>
                    <div className="muted s-p">BroadcastChannel + fallback.</div>
                  </div>
                  <MiniBtn variant="primary" onClick={handleSyncNow}>مزامنة الآن</MiniBtn>
                </div>
                <div className="stats-grid" style={{ marginTop: 10 }}>
                  <div className="metric-card"><span>Devices</span><strong>{syncState.devices_online || trustedDevices.length || 1}</strong></div>
                  <div className="metric-card"><span>Profile</span><strong>{syncState.profile_revision || 1}</strong></div>
                  <div className="metric-card"><span>Notifs</span><strong>{syncState.notifications_revision || 1}</strong></div>
                  <div className="metric-card"><span>Inbox</span><strong>{syncState.inbox_revision || 1}</strong></div>
                </div>
              </Card>
            ) : null}

            {/* ===== الأداء ===== */}
            {activeTab === 'performance' ? (
              <Card className="s-card">
                <h3 className="s-h3">الأداء</h3>
                <SettingsRow icon="⚡" title="توفير الطاقة">
                  <SettingsToggle on={prefs.lowPowerMode} onChange={(v) => updatePref('lowPowerMode', v)} />
                </SettingsRow>
                <SettingsRow icon="🚀" title="التحميل المسبق">
                  <SettingsToggle on={prefs.prefetchEnabled} onChange={(v) => updatePref('prefetchEnabled', v)} />
                </SettingsRow>
                <SettingsRow icon="🎮" title="تسريع الأجهزة">
                  <SettingsToggle on={prefs.hardwareAcceleration} onChange={(v) => updatePref('hardwareAcceleration', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== تنزيل بياناتي ===== */}
            {activeTab === 'download-data' ? (
              <Card className="s-card">
                <h3 className="s-h3">تنزيل بياناتي (GDPR)</h3>
                <p className="muted s-p">سيتم تجهيز الأرشيف خلال 48 ساعة وإرسال رابط لبريدك.</p>
                <SettingsRow icon="📥" title="بياناتي الكاملة">
                  <MiniBtn variant="primary" onClick={() => handleDownloadData('full')}>طلب</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="📊" title="سجل النشاط">
                  <MiniBtn onClick={() => handleDownloadData('activity')}>طلب</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🎬" title="وسائطي">
                  <MiniBtn onClick={() => handleDownloadData('media')}>طلب</MiniBtn>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== المساعدة ===== */}
            {activeTab === 'help' ? (
              <Card className="s-card">
                <h3 className="s-h3">المساعدة والدعم</h3>
                <SettingsRow icon="❓" title="مركز المساعدة">
                  <MiniBtn onClick={() => navigate('/support')}>فتح</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="💬" title="تواصل مع الدعم">
                  <MiniBtn onClick={handleContactSupport}>تواصل</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="📚" title="الأسئلة الشائعة">
                  <MiniBtn onClick={showFAQ}>عرض</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🚨" title="الإبلاغ عن مشكلة">
                  <MiniBtn onClick={() => handleReport('bug')}>إبلاغ</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🎓" title="دروس البدء">
                  <MiniBtn onClick={showTutorials}>عرض</MiniBtn>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== ملاحظات ===== */}
            {activeTab === 'feedback' ? (
              <Card className="s-card">
                <h3 className="s-h3">إرسال ملاحظات</h3>
                <p className="muted s-p">رأيك يهمنا.</p>
                <SettingsRow icon="⭐" title="قيّم التطبيق">
                  <MiniBtn onClick={handleRate}>تقييم</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="💡" title="اقترح ميزة">
                  <MiniBtn onClick={handleSuggest}>اقتراح</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🐞" title="بلّغ عن خطأ">
                  <MiniBtn onClick={() => handleReport('bug')}>إبلاغ</MiniBtn>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== عن التطبيق ===== */}
            {activeTab === 'about' ? (
              <Card className="s-card">
                <h3 className="s-h3">عن يمشات</h3>
                <SettingsRow icon="📦" title="الإصدار">
                  <span className="muted s-p" style={{ fontSize: 11.5 }}>{`v${(typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_VERSION) || '76.0.0'}`}</span>
                </SettingsRow>
                <SettingsRow icon="🏗️" title="رقم البناء">
                  <span className="muted" style={{ fontSize: 11.5 }}>{(typeof __APP_BUILD_DATE__ !== 'undefined' && __APP_BUILD_DATE__) || new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
                </SettingsRow>
                <SettingsRow icon="🆕" title="ما الجديد">
                  <MiniBtn onClick={showWhatsNew}>عرض</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🌐" title="الموقع الرسمي">
                  <MiniBtn onClick={() => showAbout('site')}>زيارة</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="📱" title="تابعنا">
                  <span className="muted" style={{ fontSize: 11.5 }}>@yamshat</span>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== قانوني ===== */}
            {activeTab === 'legal' ? (
              <Card className="s-card">
                <h3 className="s-h3">الشروط والسياسات</h3>
                <SettingsRow icon="📜" title="شروط الاستخدام">
                  <MiniBtn onClick={() => navigate('/terms')}>عرض</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🔐" title="سياسة الخصوصية">
                  <MiniBtn onClick={() => navigate('/privacy')}>عرض</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="🍪" title="سياسة Cookies">
                  <MiniBtn onClick={() => showLegal('cookies')}>عرض</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="©️" title="DMCA">
                  <MiniBtn onClick={() => showLegal('dmca')}>عرض</MiniBtn>
                </SettingsRow>
                <SettingsRow icon="⚖️" title="إرشادات المجتمع">
                  <MiniBtn onClick={() => showLegal('community')}>عرض</MiniBtn>
                </SettingsRow>
              </Card>
            ) : null}

            {/* تسجيل الخروج */}
            <Card className="s-card">
              <SettingsRow icon="🚪" title="تسجيل الخروج" description="إنهاء الجلسة على هذا الجهاز">
                <MiniBtn danger onClick={handleLogout}>خروج</MiniBtn>
              </SettingsRow>
            </Card>
          </main>
        </div>
      </div>

      <YamServicesMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} brandLabel="Yamshat" />

      <SettingsModal
        open={modal?.type === 'edit'}
        title={modal?.title}
        description={modal?.description}
        fields={modal?.fields}
        confirmLabel={modal?.confirmLabel}
        cancelLabel={modal?.cancelLabel}
        danger={modal?.danger}
        onConfirm={modal?.onConfirm}
        onClose={closeModal}
      />
      <InfoModal
        open={modal?.type === 'info'}
        title={modal?.title}
        content={modal?.content}
        onClose={closeModal}
      />

      {/* =========================
          v76 — CSS مضغوط
          - أحجام مصغّرة لكل شيء
          - الأزرار: min-height 26px بدل 40+
          - Padding مدمج
          - Cards بحواف صغيرة
      ========================= */}
      <style>{`
        .settings-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 12px 14px 40px;
          font-size: 13px;
        }
        .settings-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .settings-hero h1 { margin: 0 0 3px; font-size: 20px; }
        .settings-hero p { margin: 0; font-size: 12px; }
        .settings-quick-menu-btn {
          width: 38px; height: 38px; padding: 0; flex-shrink: 0;
          border-radius: 10px; border: 1px solid rgba(167,139,250,0.25);
          background: rgba(15,23,42,0.78);
          display: inline-flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px; cursor: pointer;
        }
        .settings-quick-menu-btn span {
          display: block; width: 16px; height: 2px;
          border-radius: 999px; background: #e2e8f0;
        }
        .settings-banner {
          padding: 8px 10px; border-radius: 10px;
          background: rgba(34,197,94,0.14); color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 10px; font-size: 12px;
        }
        .settings-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 12px;
          align-items: start;
        }
        .settings-sidebar {
          display: grid; gap: 8px;
          position: sticky; top: 70px;
          max-height: calc(100vh - 90px);
          overflow-y: auto;
          padding-inline-end: 4px;
        }
        /* ✅ v85.8: عرض التبويبات داخل كل مجموعة على 3 أعمدة لتقليل الارتفاع
           بدل عمود واحد يشغل مساحة كبيرة. الخط أصغر و padding مضغوط. */
        .settings-group {
          display: block;
          padding: 6px 6px 7px;
          background: rgba(15,23,42,0.4);
          border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.10);
        }
        .settings-group-label {
          font-size: 9.5px; font-weight: 700;
          text-transform: uppercase;
          color: rgba(226,232,240,0.55);
          padding: 2px 4px 4px;
          letter-spacing: 0.35px;
        }
        .settings-group-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 3px;
        }
        .settings-tab-btn {
          display: flex; align-items: center; gap: 3px;
          padding: 5px 5px;
          border-radius: 6px; border: none;
          background: transparent; color: #e2e8f0;
          font-size: 10.5px; cursor: pointer;
          text-align: start; width: 100%;
          transition: all 0.12s;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .settings-tab-btn:hover { background: rgba(99,102,241,0.12); }
        .settings-tab-btn.active {
          background: rgba(99,102,241,0.22);
          color: #c4b5fd; font-weight: 600;
        }

        .settings-main { display: grid; gap: 10px; min-width: 0; }

        /* Cards مضغوطة */
        .s-card {
          padding: 12px 14px !important;
        }
        .s-h3 {
          margin: 0 0 8px;
          font-size: 14.5px;
          font-weight: 700;
        }
        .s-p { font-size: 11.5px !important; margin: 0 0 8px !important; }
        .s-card-header {
          display: flex; align-items: center;
          justify-content: space-between; gap: 8px;
          margin-bottom: 4px;
        }
        .s-card-header h3 { margin: 0; }

        /* Rows مضغوطة */
        .settings-row {
          display: flex; align-items: center;
          justify-content: space-between; gap: 8px;
          padding: 7px 0 !important;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-row-info { flex: 1; min-width: 0; }
        .settings-row-info strong {
          display: block; margin-bottom: 1px;
          font-size: 12.5px !important; font-weight: 600;
        }
        .settings-row-info .muted { font-size: 11px !important; line-height: 1.35; }

        /* Toggle مصغّر */
        .settings-toggle {
          position: relative; width: 36px; height: 20px;
          border-radius: 999px; background: rgba(100,116,139,0.35);
          cursor: pointer; transition: background 0.2s; border: none;
          flex-shrink: 0;
        }
        .settings-toggle::after {
          content: ''; position: absolute;
          top: 2px; right: 2px;
          width: 16px; height: 16px;
          background: #fff; border-radius: 50%;
          transition: all 0.2s;
        }
        .settings-toggle[data-on='true'] { background: #6366f1; }
        .settings-toggle[data-on='true']::after { right: 18px; }

        /* Selects / Inputs مصغّرة */
        .settings-select, .settings-input {
          padding: 4px 8px;
          border-radius: 7px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.18);
          color: #e2e8f0;
          font-size: 12px !important;
          min-width: 110px;
          min-height: 26px;
          font-family: inherit;
        }
        textarea.settings-input { resize: vertical; min-height: 60px; width: 100%; padding: 6px 8px; }

        /* =========================
           الأزرار المصغّرة الأساسية
           ========================= */
        .settings-btn-mini {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 3px 10px;
          min-height: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid rgba(148,163,184,0.25);
          background: rgba(15,23,42,0.65);
          color: #e2e8f0;
          font-size: 11.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.12s;
          line-height: 1;
        }
        .settings-btn-mini:hover:not(:disabled) {
          background: rgba(99,102,241,0.18);
          border-color: rgba(167,139,250,0.4);
        }
        .settings-btn-mini:disabled {
          opacity: 0.55; cursor: not-allowed;
        }
        .settings-btn-mini--primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: rgba(139,92,246,0.6);
          color: #fff;
        }
        .settings-btn-mini--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
        .settings-btn-mini--danger {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.35);
          background: rgba(239,68,68,0.08);
        }
        .settings-btn-mini--danger:hover:not(:disabled) {
          background: rgba(239,68,68,0.18);
        }
        .settings-btn-mini.is-busy { opacity: 0.6; pointer-events: none; }

        /* Grid statistics مضغوطة */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 6px;
        }
        .metric-card {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid; gap: 2px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 11px; }
        .metric-card strong { font-size: 13.5px; }

        /* Lists مضغوطة */
        .list-row {
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.38);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex; justify-content: space-between;
          gap: 8px; align-items: center;
          font-size: 12px;
        }
        .list-row strong { font-size: 12.5px; display: block; margin-bottom: 1px; }
        .list-row .muted { font-size: 11px; }
        .score-pill {
          display: inline-flex; align-items: center;
          justify-content: center; min-width: 52px;
          padding: 3px 7px; border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #93c5fd;
          border: 1px solid rgba(147,197,253,0.26);
          font-size: 10.5px;
        }

        /* Modals */
        .settings-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 12px;
          animation: settings-modal-fade 0.15s ease-out;
        }
        .settings-modal {
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95));
          border: 1px solid rgba(167,139,250,0.25);
          border-radius: 14px;
          padding: 16px;
          max-width: 460px; width: 100%;
          max-height: 88vh; overflow-y: auto;
          box-shadow: 0 22px 60px rgba(0,0,0,0.5);
          animation: settings-modal-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .settings-modal-header {
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px;
          margin-bottom: 6px;
        }
        .settings-modal-header h3 { margin: 0; font-size: 15px; }
        .settings-modal-close {
          width: 26px; height: 26px;
          border-radius: 7px; border: 1px solid rgba(148,163,184,0.2);
          background: rgba(15,23,42,0.6);
          color: #e2e8f0; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0;
        }
        .settings-modal-close:hover { background: rgba(239,68,68,0.18); }
        .settings-modal-content { font-size: 12.5px; line-height: 1.55; color: rgba(226,232,240,0.9); }

        @keyframes settings-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes settings-modal-pop {
          from { opacity: 0; transform: scale(0.94) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .settings-layout { grid-template-columns: 1fr; }
          .settings-sidebar {
            position: static; max-height: none;
            display: grid; gap: 8px;
          }
        }
        /* ✅ v85.8: على الموبايل — 3 أعمدة داخل كل مجموعة (كما طلب المستخدم) */
        @media (max-width: 600px) {
          .settings-wrap { padding: 10px 10px 30px; }
          .s-card { padding: 10px 12px !important; }
          .settings-row { flex-wrap: wrap; gap: 6px; }
          .settings-group-tabs {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .settings-tab-btn {
            font-size: 10px;
            padding: 5px 4px;
          }
        }
        @media (max-width: 380px) {
          .settings-tab-btn { font-size: 9.5px; }
        }

        /* Overrides قوية لتصغير أي أزرار قديمة داخل الإعدادات */
        .settings-main .btn,
        .settings-main button.btn,
        .settings-main .btn-small,
        .settings-main .btn-medium {
          min-height: 24px !important;
          height: 24px !important;
          padding: 3px 10px !important;
          font-size: 11.5px !important;
          border-radius: 6px !important;
        }
        .settings-main .btn-large {
          min-height: 28px !important;
          height: 28px !important;
          padding: 4px 12px !important;
          font-size: 12px !important;
        }
      `}</style>
    </MainLayout>
  );
}
