import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { logoutUser } from '../api/auth.js';
import { getUsers, getUserPreferences, updateUserPreferences } from '../api/users.js';
import { getChatThreads, updateOnline } from '../api/chat.js';
import { clearStoredUser, getStoredUser } from '../utils/auth.js';
import { browserNotificationsSupported } from '../utils/notificationCenter.js';
import { useAppStore } from '../store/appStore.js';
import { PRIMARY_ADMIN_EMAIL } from '../utils/access.js';
import { getUiText } from '../utils/i18n.js';

export default function Dashboard() {
  const [usersCount, setUsersCount] = useState(0);
  const [threadsCount, setThreadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState('');
  const [permissionState, setPermissionState] = useState(
    browserNotificationsSupported() ? window.Notification.permission : 'unsupported'
  );
  const [preferencesForm, setPreferencesForm] = useState({ language: 'ar', chat_translation_enabled: true });
  const user = getStoredUser();
  const navigate = useNavigate();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const chatTranslationEnabled = useAppStore((state) => state.chatTranslationEnabled);
  const setChatTranslationEnabled = useAppStore((state) => state.setChatTranslationEnabled);
  const isOnline = useAppStore((state) => state.isOnline);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const ui = getUiText(language);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [usersRes, threadsRes, prefsRes] = await Promise.all([getUsers(), getChatThreads(), getUserPreferences(), updateOnline(true)]);
        if (!mounted) return;
        setUsersCount(Array.isArray(usersRes.data) ? usersRes.data.length : 0);
        setThreadsCount(Array.isArray(threadsRes.data) ? threadsRes.data.length : 0);
        const nextPrefs = {
          language: prefsRes?.data?.language === 'en' ? 'en' : 'ar',
          chat_translation_enabled: Boolean(prefsRes?.data?.chat_translation_enabled),
        };
        setPreferencesForm(nextPrefs);
        setLanguage(nextPrefs.language);
        setChatTranslationEnabled(nextPrefs.chat_translation_enabled);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'تعذر تحميل بيانات القائمة.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [setChatTranslationEnabled, setLanguage]);

  const stats = useMemo(
    () => [
      { title: language === 'en' ? 'Users' : 'المستخدمون', value: loading ? '...' : usersCount, meta: language === 'en' ? 'Available accounts' : 'عدد الحسابات المتاحة' },
      { title: language === 'en' ? 'Chats' : 'المحادثات', value: loading ? '...' : threadsCount, meta: language === 'en' ? 'Current private threads' : 'قائمة الدردشة الحالية' },
      { title: language === 'en' ? 'Sync queue' : 'المزامنة', value: queuedActions.length, meta: language === 'en' ? 'Saved offline actions' : 'عمليات محفوظة أوفلاين' },
      { title: language === 'en' ? 'Status' : 'الحالة', value: isOnline ? (language === 'en' ? 'Online' : 'متصل') : (language === 'en' ? 'Offline' : 'غير متصل'), meta: user?.user || user?.username || 'member' },
    ],
    [isOnline, language, loading, queuedActions.length, threadsCount, user, usersCount]
  );

  const shortcuts = [
    { to: '/profile', title: language === 'en' ? 'Profile' : 'الملف الشخصي', desc: language === 'en' ? 'Account, stats, and posts' : 'الحساب والإحصائيات والمنشورات', icon: '◎' },
    { to: '/notifications', title: language === 'en' ? 'Notifications' : 'الإشعارات', desc: language === 'en' ? 'All alerts in one page' : 'كل التنبيهات في شاشة مستقلة', icon: '🔔' },
    { to: '/users', title: language === 'en' ? 'Users' : 'المستخدمون', desc: language === 'en' ? 'Start following or direct chat' : 'ابدأ متابعة أو تواصل مباشر', icon: '🧑‍🤝‍🧑' },
    { to: '/groups', title: language === 'en' ? 'Groups' : 'المجموعات', desc: language === 'en' ? 'Create or join communities' : 'أنشئ مجموعة أو انضم إليها', icon: '👥' },
  ];

  const readinessCards = [
    { title: 'Responsive', value: language === 'en' ? 'Improved' : 'محسّن', desc: language === 'en' ? 'Top and bottom navigation are now more balanced on web and mobile.' : 'تم ضبط الشريط العلوي والسفلي بشكل أدق للجوال والويب.' },
    { title: 'Database', value: language === 'en' ? 'Connected' : 'مرتبط', desc: language === 'en' ? 'Preferences and chat blocking now persist in the database.' : 'تم ربط إعدادات اللغة والحظر بقاعدة البيانات.' },
    { title: 'Chat', value: language === 'en' ? 'Upgraded' : 'مطوّرة', desc: language === 'en' ? 'Online status, last seen, translation, voice and video call entry points are ready.' : 'حالة الاتصال والترجمة والمكالمات الصوتية والمرئية أصبحت جاهزة.' },
    { title: 'Admin Access', value: '/admin/login', desc: language === 'en' ? 'Use the admin screen directly when needed.' : 'استخدم شاشة الأدمن مباشرة عند الحاجة.' },
  ];

  const handleEnableBrowserNotifications = async () => {
    if (!browserNotificationsSupported()) {
      setPermissionState('unsupported');
      return;
    }
    const permission = await window.Notification.requestPermission();
    setPermissionState(permission);
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPrefs(true);
      const payload = {
        language: preferencesForm.language,
        chat_translation_enabled: preferencesForm.chat_translation_enabled,
      };
      await updateUserPreferences(payload);
      setLanguage(payload.language);
      setChatTranslationEnabled(payload.chat_translation_enabled);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر حفظ الإعدادات.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore logout api failures and clear session locally
    }
    clearStoredUser();
    navigate('/login', { replace: true });
  };

  return (
    <MainLayout>
      <section className="menu-page-grid menu-page-grid-enhanced">
        <Card className="menu-hero-card">
          <div className="menu-hero-copy">
            <span className="badge">Yamshat Settings</span>
            <h3>{ui.dashboard.title}</h3>
            <p>{ui.dashboard.description}</p>
          </div>

          <div className="menu-user-summary">
            <div className="avatar-circle large">{(user?.user || user?.username || 'U').slice(0, 1).toUpperCase()}</div>
            <div className="user-meta">
              <strong>{user?.user || user?.username || 'User'}</strong>
              <span className="muted">{isOnline ? (language === 'en' ? 'Online now' : 'متصل الآن') : (language === 'en' ? 'Currently offline' : 'غير متصل حالياً')}</span>
              <span className="muted">{language === 'en' ? 'Primary admin email' : 'البريد الإداري الأساسي'}: {PRIMARY_ADMIN_EMAIL}</span>
            </div>
          </div>
        </Card>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="quick-actions-grid">
          {shortcuts.map((item) => (
            <Link key={item.to} to={item.to} className="quick-action-card card">
              <div className="quick-action-icon">{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <p className="muted no-margin">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <section className="stats-grid compact-stats menu-stats-grid menu-stats-grid-4">
          {stats.map((item) => (
            <Card key={item.title}>
              <div className="stat-title">{item.title}</div>
              <div className="stat-value">{item.value}</div>
              <div className="muted">{item.meta}</div>
            </Card>
          ))}
        </section>

        <Card className="menu-settings-card setting-surface">
          <div className="section-head compact">
            <div>
              <h3 className="section-title">{language === 'en' ? 'Quick settings' : 'إعدادات سريعة'}</h3>
              <p className="muted no-margin">{language === 'en' ? 'Professional web settings with database persistence.' : 'إعدادات ويب أكثر احترافية مع حفظ مباشر في قاعدة البيانات.'}</p>
            </div>
          </div>

          <div className="menu-preferences-grid">
            <label className="field">
              <span className="field-label">{ui.dashboard.languageLabel}</span>
              <select
                className="input"
                value={preferencesForm.language}
                onChange={(event) => setPreferencesForm((prev) => ({ ...prev, language: event.target.value === 'en' ? 'en' : 'ar' }))}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <small className="muted">{ui.dashboard.languageHint}</small>
            </label>

            <label className="field checkbox-field">
              <span className="field-label">{ui.dashboard.translationLabel}</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={preferencesForm.chat_translation_enabled}
                  onChange={(event) => setPreferencesForm((prev) => ({ ...prev, chat_translation_enabled: event.target.checked }))}
                />
                <span>{preferencesForm.chat_translation_enabled ? (language === 'en' ? 'Enabled' : 'مفعلة') : (language === 'en' ? 'Disabled' : 'متوقفة')}</span>
              </label>
              <small className="muted">{ui.dashboard.translationHint}</small>
            </label>
          </div>

          <div className="menu-settings-actions menu-settings-actions-rich">
            <Button variant="secondary" onClick={toggleTheme}>
              {theme === 'dark'
                ? (language === 'en' ? 'Switch to light mode' : 'تبديل للوضع الفاتح')
                : (language === 'en' ? 'Switch to dark mode' : 'تبديل للوضع الداكن')}
            </Button>
            <Button variant="secondary" onClick={handleEnableBrowserNotifications}>
              {permissionState === 'granted'
                ? (language === 'en' ? 'Browser notifications enabled' : 'إشعارات المتصفح مفعلة')
                : permissionState === 'denied'
                  ? (language === 'en' ? 'Notifications blocked' : 'الإشعارات مرفوضة')
                  : permissionState === 'unsupported'
                    ? (language === 'en' ? 'Browser notifications unsupported' : 'المتصفح لا يدعم الإشعارات')
                    : (language === 'en' ? 'Enable browser notifications' : 'تفعيل إشعارات المتصفح')}
            </Button>
            <Button onClick={handleSavePreferences} disabled={savingPrefs}>
              {savingPrefs ? ui.dashboard.saving : ui.dashboard.save}
            </Button>
            <a href="/admin.html" className="btn btn-secondary">{language === 'en' ? 'Admin panel' : 'دخول لوحة الأدمن'}</a>
            <Button onClick={handleLogout}>{language === 'en' ? 'Logout' : 'تسجيل الخروج'}</Button>
          </div>
        </Card>

        <Card className="setting-surface">
          <div className="section-head compact">
            <div>
              <h3 className="section-title">{language === 'en' ? 'Readiness center' : 'مركز الاختبار والجاهزية'}</h3>
              <p className="muted no-margin">{language === 'en' ? 'Quick summary of layout, chat, database, and admin readiness.' : 'ملخص سريع لتحسينات الواجهة والدردشة والربط بقاعدة البيانات.'}</p>
            </div>
          </div>
          <div className="testing-grid">
            {readinessCards.map((item) => (
              <div key={item.title} className="queue-card compact">
                <span className="queue-label">{item.title}</span>
                <strong>{item.value}</strong>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </MainLayout>
  );
}
