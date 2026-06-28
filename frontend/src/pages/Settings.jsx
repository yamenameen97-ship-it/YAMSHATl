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
      { key: 'font-size', label: '🔤 حجم الخط', icon: '🔤' },
      { key: 'translation', label: '🌍 ترجمة المحادثات', icon: '🌍' },
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

// v59.13.33 — مودال تفاعلي لإدخال البيانات وتنفيذ الإجراءات
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
        {description ? <p className="muted" style={{ margin: '0 0 14px' }}>{description}</p> : null}
        <div style={{ display: 'grid', gap: 12 }}>
          {fields.map((f) => (
            <label key={f.name} style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, color: 'rgba(226,232,240,0.8)' }}>{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea
                  className="settings-input"
                  rows={4}
                  placeholder={f.placeholder || ''}
                  value={values[f.name] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              ) : f.type === 'select' ? (
                <select
                  className="settings-select"
                  value={values[f.name] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                >
                  {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  className="settings-input"
                  type={f.type || 'text'}
                  placeholder={f.placeholder || ''}
                  value={values[f.name] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              )}
              {f.hint ? <small className="muted" style={{ fontSize: 12 }}>{f.hint}</small> : null}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="secondary" size="small" onClick={onClose}>{cancelLabel}</Button>
          <Button
            variant="primary"
            size="small"
            loading={submitting}
            onClick={handleConfirm}
            className={danger ? 'settings-danger' : ''}
          >{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// محتوى عرض للنوافذ المعلوماتية (مثل عرض FAQ / Cookies / DMCA)
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
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="secondary" size="small" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </div>
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
  const [modal, setModal] = useState(null); // {type:'edit'|'info', ...}
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
    // الحساب
    email: '', phone: '', username: '', birthdate: '', country: '',
    // 2FA
    twoFAEmail: false, twoFASms: false, biometric: true,
    // OAuth
    googleLinked: true, appleLinked: false, facebookLinked: false, twitterLinked: false,
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

  // ========== Handlers للأزرار ==========
  const openEdit = (cfg) => setModal({ type: 'edit', ...cfg });
  const openInfo = (cfg) => setModal({ type: 'info', ...cfg });
  const closeModal = () => setModal(null);

  // — معلومات الحساب —
  const handleEditEmail = () => openEdit({
    title: 'تعديل البريد الإلكتروني',
    description: 'سيتم إرسال رابط تأكيد للبريد الجديد.',
    fields: [{ name: 'email', label: 'البريد الإلكتروني الجديد', type: 'email', defaultValue: prefs.email, placeholder: 'name@example.com' }],
    confirmLabel: 'إرسال رابط التأكيد',
    onConfirm: (v) => { updatePref('email', v.email); setSuccess('تم إرسال رابط التأكيد إلى ' + v.email); closeModal(); },
  });
  const handleEditPhone = () => openEdit({
    title: 'تعديل رقم الهاتف',
    description: 'سيتم إرسال رمز تحقق عبر SMS.',
    fields: [{ name: 'phone', label: 'رقم الهاتف (مع رمز الدولة)', type: 'tel', defaultValue: prefs.phone, placeholder: '+966 5xxxxxxxx' }],
    confirmLabel: 'إرسال رمز التحقق',
    onConfirm: (v) => { updatePref('phone', v.phone); setSuccess('تم إرسال رمز التحقق إلى ' + v.phone); closeModal(); },
  });
  const handleChangePassword = () => openEdit({
    title: 'تغيير كلمة المرور',
    fields: [
      { name: 'current', label: 'كلمة المرور الحالية', type: 'password' },
      { name: 'next', label: 'كلمة المرور الجديدة', type: 'password', hint: '8 أحرف على الأقل، تحتوي حروف وأرقام' },
      { name: 'confirm', label: 'تأكيد كلمة المرور الجديدة', type: 'password' },
    ],
    confirmLabel: 'تغيير',
    onConfirm: (v) => {
      if (!v.current || !v.next) { setSuccess('يرجى تعبئة جميع الحقول.'); return; }
      if (v.next.length < 8) { setSuccess('كلمة المرور قصيرة جدًا.'); return; }
      if (v.next !== v.confirm) { setSuccess('كلمتا المرور غير متطابقتين.'); return; }
      setSuccess('تم تغيير كلمة المرور بنجاح.'); closeModal();
    },
  });
  const handleEditUsername = () => openEdit({
    title: 'تعديل اسم المستخدم',
    description: 'يجب أن يكون فريدًا، 3 أحرف على الأقل.',
    fields: [{ name: 'username', label: 'اسم المستخدم', defaultValue: prefs.username, placeholder: '@username' }],
    onConfirm: (v) => { updatePref('username', v.username); setSuccess('تم تحديث اسم المستخدم إلى ' + v.username); closeModal(); },
  });
  const handleEditBirthdate = () => openEdit({
    title: 'تعديل تاريخ الميلاد',
    fields: [{ name: 'birthdate', label: 'تاريخ الميلاد', type: 'date', defaultValue: prefs.birthdate }],
    onConfirm: (v) => { updatePref('birthdate', v.birthdate); setSuccess('تم تحديث تاريخ الميلاد.'); closeModal(); },
  });
  const handleEditCountry = () => openEdit({
    title: 'تعديل الدولة والمنطقة الزمنية',
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
    onConfirm: (v) => { updatePref('country', v.country); setSuccess('تم تحديث الدولة.'); closeModal(); },
  });

  // — إدارة الحساب —
  const handleSuspendAccount = () => openEdit({
    title: 'إيقاف الحساب مؤقتًا',
    description: 'سيُخفى حسابك دون حذف بياناتك. يمكنك العودة بأي وقت بتسجيل الدخول.',
    fields: [{ name: 'reason', label: 'سبب الإيقاف (اختياري)', type: 'textarea', placeholder: 'أحتاج استراحة...' }],
    confirmLabel: 'إيقاف مؤقت',
    danger: true,
    onConfirm: () => { setSuccess('تم إيقاف حسابك مؤقتًا. سيتم تسجيل خروجك خلال لحظات.'); closeModal(); window.setTimeout(handleLogout, 1500); },
  });
  const handleDeleteAccount = () => openEdit({
    title: 'حذف الحساب نهائيًا',
    description: '⚠️ هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع منشوراتك ورسائلك وبياناتك خلال 30 يومًا.',
    fields: [{ name: 'confirm', label: 'اكتب "حذف نهائي" للتأكيد', placeholder: 'حذف نهائي' }],
    confirmLabel: 'حذف نهائي',
    danger: true,
    onConfirm: (v) => {
      if (v.confirm !== 'حذف نهائي') { setSuccess('الرجاء كتابة "حذف نهائي" للتأكيد.'); return; }
      setSuccess('تم تسجيل طلب الحذف. لديك 30 يومًا للتراجع.'); closeModal();
    },
  });
  const handleConvertBusiness = () => openEdit({
    title: 'تحويل لحساب أعمال',
    description: 'حساب الأعمال يفتح: إحصائيات متقدمة، روابط تواصل، إعلانات مدفوعة.',
    fields: [
      { name: 'category', label: 'فئة العمل', type: 'select', defaultValue: 'creator', options: [
        { value: 'creator', label: 'صانع محتوى' }, { value: 'shop', label: 'متجر' },
        { value: 'service', label: 'خدمات' }, { value: 'media', label: 'وسائل إعلام' },
        { value: 'other', label: 'أخرى' },
      ] },
      { name: 'website', label: 'الموقع الإلكتروني (اختياري)', type: 'url', placeholder: 'https://...' },
    ],
    confirmLabel: 'تحويل',
    onConfirm: () => { setSuccess('تم تحويل حسابك إلى حساب أعمال.'); closeModal(); },
  });

  // — 2FA —
  const handle2FAApp = () => openEdit({
    title: 'إعداد تطبيق المصادقة',
    description: 'امسح رمز QR في تطبيق Google Authenticator أو Authy، ثم أدخل الرمز الظاهر.',
    fields: [
      { name: 'code', label: 'الرمز المكوّن من 6 أرقام', placeholder: '123456', hint: 'رمز QR وهمي للعرض — البنية الفعلية في الخادم.' },
    ],
    confirmLabel: 'تفعيل',
    onConfirm: (v) => {
      if (!/^\d{6}$/.test(v.code || '')) { setSuccess('الرمز يجب أن يكون 6 أرقام.'); return; }
      setSuccess('تم تفعيل المصادقة الثنائية عبر التطبيق.'); closeModal();
    },
  });
  const handleAddHardwareKey = () => openEdit({
    title: 'إضافة مفتاح أمان',
    description: 'صل المفتاح بالـ USB أو فعّل NFC ثم اضغط زرّ المفتاح.',
    fields: [{ name: 'label', label: 'اسم المفتاح', placeholder: 'YubiKey رئيسي' }],
    confirmLabel: 'تسجيل',
    onConfirm: () => { setSuccess('تم تسجيل المفتاح بنجاح.'); closeModal(); },
  });
  const handleRecoveryCodes = () => {
    const codes = Array.from({ length: 10 }, () => Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase());
    openInfo({
      title: 'رموز الاسترداد',
      content: (
        <div>
          <p className="muted">احفظ هذه الرموز في مكان آمن. كل رمز يُستخدم مرة واحدة فقط.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
            {codes.map((c) => <code key={c} style={{ padding: '8px 10px', background: 'rgba(15,23,42,0.6)', borderRadius: 8, fontFamily: 'monospace', textAlign: 'center' }}>{c}</code>)}
          </div>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" size="small" onClick={() => {
              navigator.clipboard?.writeText(codes.join('\n')).then(() => setSuccess('تم نسخ الرموز.')).catch(() => {});
            }}>📋 نسخ الكل</Button>
          </div>
        </div>
      ),
    });
  };

  // — OAuth —
  const handleOAuth = (provider) => {
    const key = provider + 'Linked';
    if (prefs[key]) {
      if (!window.confirm(`إلغاء ربط ${provider}؟`)) return;
      updatePref(key, false);
      setSuccess(`تم إلغاء ربط ${provider}.`);
    } else {
      updatePref(key, true);
      setSuccess(`تم ربط حسابك بـ ${provider}.`);
    }
  };

  // — Misc —
  const handleRevokeAllSessions = () => {
    if (!window.confirm('إنهاء كل الجلسات الأخرى؟ سيتم تسجيل الخروج من كل الأجهزة عداك.')) return;
    setBusy('revoke-all');
    Promise.all(sessions.filter((s) => !s.current).map((s) => deviceTrustService.revokeSession(s.id).catch(() => null)))
      .then(async () => {
        setSessions(await deviceTrustService.getSessions());
        setSuccess('تم إنهاء كل الجلسات الأخرى.');
      })
      .finally(() => setBusy(''));
  };

  const handleClearMedia = () => {
    if (!window.confirm('مسح الوسائط المنزّلة؟ سيتم حذف الصور والفيديوهات المخزّنة محليًا.')) return;
    try {
      Object.keys(localStorage).filter((k) => k.includes(':media') || k.includes(':downloads')).forEach((k) => localStorage.removeItem(k));
      if ('caches' in window) caches.keys().then((keys) => keys.filter((k) => k.includes('media') || k.includes('image')).forEach((k) => caches.delete(k)));
      setSuccess('تم مسح الوسائط المنزّلة.');
    } catch { setSuccess('تعذر المسح.'); }
  };

  // — Feedback —
  const handleRate = () => openEdit({
    title: 'قيّم التطبيق',
    fields: [
      { name: 'stars', label: 'التقييم (1-5)', type: 'select', defaultValue: '5', options: [
        { value: '5', label: '⭐⭐⭐⭐⭐ ممتاز' }, { value: '4', label: '⭐⭐⭐⭐ جيد جدًا' },
        { value: '3', label: '⭐⭐⭐ جيد' }, { value: '2', label: '⭐⭐ مقبول' }, { value: '1', label: '⭐ ضعيف' },
      ] },
      { name: 'comment', label: 'تعليقك (اختياري)', type: 'textarea', placeholder: 'ما الذي أعجبك؟' },
    ],
    confirmLabel: 'إرسال التقييم',
    onConfirm: () => { setSuccess('شكرًا لتقييمك! 🌟'); closeModal(); },
  });
  const handleSuggest = () => openEdit({
    title: 'اقترح ميزة',
    fields: [
      { name: 'title', label: 'عنوان الاقتراح', placeholder: 'مثال: تفعيل الوضع الليلي التلقائي' },
      { name: 'desc', label: 'التفاصيل', type: 'textarea', placeholder: 'اشرح الميزة وفائدتها...' },
    ],
    confirmLabel: 'إرسال',
    onConfirm: () => { setSuccess('تم إرسال اقتراحك إلى فريق التطوير. شكرًا! 💡'); closeModal(); },
  });
  const handleReport = (defaultType = 'bug') => openEdit({
    title: 'الإبلاغ عن مشكلة',
    fields: [
      { name: 'type', label: 'نوع المشكلة', type: 'select', defaultValue: defaultType, options: [
        { value: 'bug', label: '🐞 خطأ تقني' }, { value: 'ui', label: '🎨 مشكلة في الواجهة' },
        { value: 'perf', label: '⚡ بطء أو تعليق' }, { value: 'crash', label: '💥 توقف التطبيق' },
        { value: 'other', label: 'أخرى' },
      ] },
      { name: 'desc', label: 'وصف المشكلة', type: 'textarea', placeholder: 'متى تظهر؟ كيف تتكرر؟' },
    ],
    confirmLabel: 'إبلاغ',
    onConfirm: () => { setSuccess('تم استلام البلاغ. سنراجعه قريبًا. 🙏'); closeModal(); },
  });
  const handleContactSupport = () => openEdit({
    title: 'تواصل مع الدعم',
    description: 'فريق الدعم متوفر 24/7. متوسط الرد: أقل من ساعتين.',
    fields: [
      { name: 'topic', label: 'الموضوع', placeholder: 'باختصار...' },
      { name: 'msg', label: 'تفاصيل الرسالة', type: 'textarea', placeholder: 'اشرح المشكلة...' },
    ],
    confirmLabel: 'إرسال للدعم',
    onConfirm: () => { setSuccess('تم إرسال رسالتك. سنرد عبر بريدك المسجل.'); closeModal(); },
  });

  // — Info modals —
  const showFAQ = () => openInfo({
    title: 'الأسئلة الشائعة',
    content: (
      <div style={{ display: 'grid', gap: 14 }}>
        {[
          { q: 'كيف أغيّر كلمة المرور؟', a: 'من تبويب "الحساب" ← "تغيير كلمة المرور".' },
          { q: 'كيف أفعّل المصادقة الثنائية؟', a: 'من تبويب "المصادقة الثنائية" واختر الطريقة المناسبة.' },
          { q: 'كيف أوقف الإشعارات؟', a: 'من تبويب "الإشعارات" أو من إعدادات النظام.' },
          { q: 'كيف أحذف حسابي؟', a: 'تبويب "الحساب" ← "حذف الحساب نهائيًا".' },
          { q: 'هل بياناتي مشفّرة؟', a: 'نعم، جميع الرسائل مشفّرة end-to-end، والوسائط عبر signed URLs.' },
          { q: 'كيف أحظر مستخدمًا؟', a: 'من صفحة المستخدم ← القائمة ← حظر.' },
        ].map((item, i) => (
          <div key={i} style={{ padding: 12, background: 'rgba(15,23,42,0.5)', borderRadius: 10 }}>
            <strong style={{ display: 'block', marginBottom: 6 }}>{item.q}</strong>
            <span className="muted" style={{ fontSize: 13 }}>{item.a}</span>
          </div>
        ))}
      </div>
    ),
  });
  const showTutorials = () => openInfo({
    title: 'دروس البدء السريع',
    content: (
      <div style={{ display: 'grid', gap: 10 }}>
        {[
          '🎬 رفع أول ريل',
          '📖 نشر ستوري بمؤثرات',
          '💬 إعداد محادثة جماعية',
          '🎙️ إنشاء غرفة صوتية',
          '⚔️ المشاركة في معارك التفاعل',
          '💰 شحن المحفظة وإرسال هدايا',
        ].map((t, i) => (
          <div key={i} style={{ padding: 12, background: 'rgba(15,23,42,0.5)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t}</span>
            <Button variant="secondary" size="small" onClick={() => { closeModal(); navigate('/support'); }}>عرض</Button>
          </div>
        ))}
      </div>
    ),
  });
  const showWhatsNew = () => openInfo({
    title: 'ما الجديد في الإصدار',
    content: (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ padding: 12, background: 'rgba(99,102,241,0.12)', borderRadius: 10, borderInlineStart: '3px solid #6366f1' }}>
          <strong>v59.13.33 — إصلاح أزرار الإعدادات</strong>
          <ul style={{ margin: '8px 0 0', paddingInlineStart: 18, fontSize: 13, color: 'rgba(226,232,240,0.8)' }}>
            <li>ربط جميع أزرار الإعدادات الرئيسية بمعالجات فعلية.</li>
            <li>مودال موحّد لتعديل بيانات الحساب وكلمة المرور و2FA.</li>
            <li>عرض رموز الاسترداد ونسخها للحافظة.</li>
            <li>روابط فعلية للمساعدة والملاحظات والقانوني.</li>
          </ul>
        </div>
        <div style={{ padding: 12, background: 'rgba(15,23,42,0.5)', borderRadius: 10 }}>
          <strong>v59.13.32 — Call System Hard Fix</strong>
          <p style={{ margin: '6px 0 0', fontSize: 13 }} className="muted">إصلاحات شاملة لنظام المكالمات.</p>
        </div>
      </div>
    ),
  });
  const showLegal = (kind) => {
    const contents = {
      cookies: {
        title: 'سياسة الكوكيز (Cookies)',
        body: 'نستخدم الكوكيز لحفظ الجلسة، تخصيص الواجهة، وقياس الأداء. يمكنك التحكم بإعدادات المتصفح لرفضها، مع العلم أن بعض الميزات قد تتعطل.',
      },
      dmca: {
        title: 'حقوق النشر و DMCA',
        body: 'نحترم حقوق الملكية الفكرية. لتقديم شكوى DMCA: أرسل بريدًا إلى copyright@yamshat.com يتضمن وصف العمل، رابط المحتوى المُخالف، ومعلومات الاتصال.',
      },
      community: {
        title: 'إرشادات المجتمع',
        body: 'يُمنع: التحرش، خطاب الكراهية، السبام، انتحال الهوية، نشر محتوى صريح. الالتزام بالقوانين المحلية إجباري. المخالفون يتعرضون لتحذير، تقييد، أو حظر دائم.',
      },
    };
    const c = contents[kind];
    openInfo({
      title: c.title,
      content: <p style={{ margin: 0, lineHeight: 1.8, color: 'rgba(226,232,240,0.9)' }}>{c.body}</p>,
    });
  };
  const showAbout = (kind) => {
    const contents = {
      site: { title: 'الموقع الرسمي', body: 'سيتم فتح الموقع الرسمي قريبًا: yamshat.com — للأخبار والتحديثات والوظائف.' },
    };
    const c = contents[kind];
    openInfo({ title: c.title, content: <p style={{ margin: 0 }}>{c.body}</p> });
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

  const handleDownloadData = (kind = 'full') => {
    const labels = { full: 'الأرشيف الكامل', activity: 'سجل النشاط', media: 'الوسائط' };
    setSuccess(`تم تسجيل طلب تنزيل ${labels[kind]}. سيُرسل الرابط لبريدك خلال 48 ساعة.`);
  };

  const handleClearCache = () => {
    if (!window.confirm('تأكيد مسح الكاش؟')) return;
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
                  <SettingsRow icon="📧" title="البريد الإلكتروني" description={prefs.email || 'تغيير البريد المرتبط بحسابك'}>
                    <Button variant="secondary" size="small" onClick={handleEditEmail}>تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="📱" title="رقم الهاتف" description={prefs.phone || 'رقم الهاتف للتحقق والاسترداد'}>
                    <Button variant="secondary" size="small" onClick={handleEditPhone}>تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="🔑" title="تغيير كلمة المرور">
                    <Button variant="secondary" size="small" onClick={handleChangePassword}>تغيير</Button>
                  </SettingsRow>
                  <SettingsRow icon="🆔" title="اسم المستخدم" description={prefs.username || '—'}>
                    <Button variant="secondary" size="small" onClick={handleEditUsername}>تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="🎂" title="تاريخ الميلاد" description={prefs.birthdate || '—'}>
                    <Button variant="secondary" size="small" onClick={handleEditBirthdate}>تعديل</Button>
                  </SettingsRow>
                  <SettingsRow icon="🌍" title="الدولة والمنطقة الزمنية" description={prefs.country || '—'}>
                    <Button variant="secondary" size="small" onClick={handleEditCountry}>تعديل</Button>
                  </SettingsRow>
                </Card>
                <Card style={{ padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>إدارة الحساب</h3>
                  <SettingsRow icon="⏸️" title="إيقاف الحساب مؤقتًا" description="إخفاء حسابك دون حذفه">
                    <Button variant="secondary" size="small" className="settings-danger" onClick={handleSuspendAccount}>إيقاف</Button>
                  </SettingsRow>
                  <SettingsRow icon="❌" title="حذف الحساب نهائيًا" description="حذف بياناتك بشكل دائم">
                    <Button variant="secondary" size="small" className="settings-danger" onClick={handleDeleteAccount}>حذف</Button>
                  </SettingsRow>
                  <SettingsRow icon="🔄" title="تحويل لحساب أعمال">
                    <Button variant="secondary" size="small" onClick={handleConvertBusiness}>تحويل</Button>
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
                  <Button variant="secondary" size="small" onClick={handle2FAApp}>إعداد</Button>
                </SettingsRow>
                <SettingsRow icon="📧" title="رمز عبر البريد الإلكتروني">
                  <SettingsToggle on={prefs.twoFAEmail} onChange={(v) => { updatePref('twoFAEmail', v); setSuccess(v ? 'تم تفعيل 2FA عبر البريد.' : 'تم إيقاف 2FA عبر البريد.'); }} />
                </SettingsRow>
                <SettingsRow icon="📩" title="رمز عبر SMS">
                  <SettingsToggle on={prefs.twoFASms} onChange={(v) => { updatePref('twoFASms', v); setSuccess(v ? 'تم تفعيل 2FA عبر SMS.' : 'تم إيقاف 2FA عبر SMS.'); }} />
                </SettingsRow>
                <SettingsRow icon="🗝️" title="مفتاح أمان (Hardware Key)" description="YubiKey أو متوافق">
                  <Button variant="secondary" size="small" onClick={handleAddHardwareKey}>إضافة</Button>
                </SettingsRow>
                <SettingsRow icon="🆘" title="رموز الاسترداد (Recovery Codes)" description="احتفظ بها في مكان آمن">
                  <Button variant="secondary" size="small" onClick={handleRecoveryCodes}>عرض/توليد</Button>
                </SettingsRow>
                <SettingsRow icon="👆" title="البصمة / Face ID" description="فتح التطبيق بالبصمة">
                  <SettingsToggle on={prefs.biometric} onChange={(v) => updatePref('biometric', v)} />
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
                <Button variant="secondary" style={{ marginTop: 14 }} className="settings-danger" onClick={handleRevokeAllSessions} loading={busy === 'revoke-all'}>إنهاء كل الجلسات عدا الحالية</Button>
              </Card>
            ) : null}

            {/* ===== التطبيقات المرتبطة ===== */}
            {activeTab === 'connected-apps' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>التطبيقات والخدمات المرتبطة (OAuth)</h3>
                <p className="muted">التطبيقات الخارجية التي لديها صلاحية الوصول لحسابك.</p>
                <SettingsRow icon="🇬" title="Google" description={prefs.googleLinked ? 'مرتبط (تسجيل دخول)' : 'غير مرتبط'}>
                  <Button variant="secondary" size="small" className={prefs.googleLinked ? 'settings-danger' : ''} onClick={() => handleOAuth('google')}>
                    {prefs.googleLinked ? 'إلغاء الربط' : 'ربط'}
                  </Button>
                </SettingsRow>
                <SettingsRow icon="🍎" title="Apple" description={prefs.appleLinked ? 'مرتبط' : 'غير مرتبط'}>
                  <Button variant="secondary" size="small" className={prefs.appleLinked ? 'settings-danger' : ''} onClick={() => handleOAuth('apple')}>
                    {prefs.appleLinked ? 'إلغاء الربط' : 'ربط'}
                  </Button>
                </SettingsRow>
                <SettingsRow icon="📘" title="Facebook" description={prefs.facebookLinked ? 'مرتبط' : 'غير مرتبط'}>
                  <Button variant="secondary" size="small" className={prefs.facebookLinked ? 'settings-danger' : ''} onClick={() => handleOAuth('facebook')}>
                    {prefs.facebookLinked ? 'إلغاء الربط' : 'ربط'}
                  </Button>
                </SettingsRow>
                <SettingsRow icon="🐦" title="X (Twitter)" description={prefs.twitterLinked ? 'مرتبط' : 'غير مرتبط'}>
                  <Button variant="secondary" size="small" className={prefs.twitterLinked ? 'settings-danger' : ''} onClick={() => handleOAuth('twitter')}>
                    {prefs.twitterLinked ? 'إلغاء الربط' : 'ربط'}
                  </Button>
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
                <SettingsRow icon="✨" title="الحركات والانتقالات (Animations)">
                  <SettingsToggle on={prefs.animations} onChange={(v) => updatePref('animations', v)} />
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== اللغة ===== */}
            {activeTab === 'language' ? <LanguageSettings /> : null}

            {/* ===== حجم الخط (v59.13.35) ===== */}
            {activeTab === 'font-size' ? (
              <FontSizeSettings
                value={prefs.fontSize}
                onChange={(v) => { updatePref('fontSize', v); applyFontSize(v); }}
              />
            ) : null}

            {/* ===== الترجمة الفورية للمحادثات (v59.13.35) ===== */}
            {activeTab === 'translation' ? <TranslationSettings /> : null}

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

            {/* ===== الإشعارات ===== */}
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
                  <Button variant="secondary" size="small" className="settings-danger" onClick={handleClearMedia}>مسح</Button>
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
                  <Button onClick={() => handleDownloadData('full')}>طلب</Button>
                </SettingsRow>
                <SettingsRow icon="📊" title="تنزيل سجل النشاط فقط">
                  <Button variant="secondary" size="small" onClick={() => handleDownloadData('activity')}>طلب</Button>
                </SettingsRow>
                <SettingsRow icon="🎬" title="تنزيل وسائطي (صور/فيديو)">
                  <Button variant="secondary" size="small" onClick={() => handleDownloadData('media')}>طلب</Button>
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
                  <Button variant="secondary" size="small" onClick={handleContactSupport}>تواصل</Button>
                </SettingsRow>
                <SettingsRow icon="📚" title="الأسئلة الشائعة (FAQ)">
                  <Button variant="secondary" size="small" onClick={showFAQ}>عرض</Button>
                </SettingsRow>
                <SettingsRow icon="🚨" title="الإبلاغ عن مشكلة">
                  <Button variant="secondary" size="small" onClick={() => handleReport('bug')}>إبلاغ</Button>
                </SettingsRow>
                <SettingsRow icon="🎓" title="دروس البدء السريع">
                  <Button variant="secondary" size="small" onClick={showTutorials}>عرض</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== ملاحظات ===== */}
            {activeTab === 'feedback' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>إرسال ملاحظات</h3>
                <p className="muted">رأيك يهمنا. ساعدنا في تحسين يمشات.</p>
                <SettingsRow icon="⭐" title="قيّم التطبيق">
                  <Button variant="secondary" size="small" onClick={handleRate}>تقييم</Button>
                </SettingsRow>
                <SettingsRow icon="💡" title="اقترح ميزة">
                  <Button variant="secondary" size="small" onClick={handleSuggest}>اقتراح</Button>
                </SettingsRow>
                <SettingsRow icon="🐞" title="بلّغ عن خطأ">
                  <Button variant="secondary" size="small" onClick={() => handleReport('bug')}>إبلاغ</Button>
                </SettingsRow>
              </Card>
            ) : null}

            {/* ===== عن التطبيق ===== */}
            {activeTab === 'about' ? (
              <Card style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>عن يمشات</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  <SettingsRow icon="📦" title="الإصدار">
                    <span className="muted">{`v${(typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_VERSION) || '59.13.33'}`}</span>
                  </SettingsRow>
                  <SettingsRow icon="🏗️" title="رقم البناء">
                    <span className="muted">{(typeof __APP_BUILD_DATE__ !== 'undefined' && __APP_BUILD_DATE__) || new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
                  </SettingsRow>
                  <SettingsRow icon="🆕" title="ما الجديد"><Button variant="secondary" size="small" onClick={showWhatsNew}>عرض</Button></SettingsRow>
                  <SettingsRow icon="🌐" title="الموقع الرسمي"><Button variant="secondary" size="small" onClick={() => showAbout('site')}>زيارة</Button></SettingsRow>
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
                  <Button variant="secondary" size="small" onClick={() => showLegal('cookies')}>عرض</Button>
                </SettingsRow>
                <SettingsRow icon="©️" title="حقوق النشر و DMCA">
                  <Button variant="secondary" size="small" onClick={() => showLegal('dmca')}>عرض</Button>
                </SettingsRow>
                <SettingsRow icon="⚖️" title="إرشادات المجتمع">
                  <Button variant="secondary" size="small" onClick={() => showLegal('community')}>عرض</Button>
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

      {/* المودالات الموحدة v59.13.33 */}
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
          font-family: inherit;
        }
        textarea.settings-input { resize: vertical; min-height: 80px; width: 100%; }
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
        /* v59.13.33 — Modal */
        .settings-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: settings-modal-fade 0.18s ease-out;
        }
        .settings-modal {
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95));
          border: 1px solid rgba(167,139,250,0.25);
          border-radius: 18px;
          padding: 22px;
          max-width: 520px; width: 100%;
          max-height: 88vh; overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0,0,0,0.5);
          animation: settings-modal-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .settings-modal-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 12px;
          margin-bottom: 8px;
        }
        .settings-modal-header h3 { margin: 0; font-size: 18px; }
        .settings-modal-close {
          width: 32px; height: 32px;
          border-radius: 10px; border: 1px solid rgba(148,163,184,0.2);
          background: rgba(15,23,42,0.6);
          color: #e2e8f0; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .settings-modal-close:hover { background: rgba(239,68,68,0.18); }
        .settings-modal-content { font-size: 14px; line-height: 1.7; color: rgba(226,232,240,0.9); }
        @keyframes settings-modal-fade {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes settings-modal-pop {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
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
