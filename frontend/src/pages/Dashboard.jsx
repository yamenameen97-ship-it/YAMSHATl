import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { logoutUser } from '../api/auth.js';
import { getUsers } from '../api/users.js';
import { getChatThreads, updateOnline } from '../api/chat.js';
import { clearStoredUser, getStoredUser } from '../utils/auth.js';
import { browserNotificationsSupported } from '../utils/notificationCenter.js';
import { useAppStore } from '../store/appStore.js';

export default function Dashboard() {
  const [usersCount, setUsersCount] = useState(0);
  const [threadsCount, setThreadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissionState, setPermissionState] = useState(
    browserNotificationsSupported() ? window.Notification.permission : 'unsupported'
  );
  const user = getStoredUser();
  const navigate = useNavigate();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const isOnline = useAppStore((state) => state.isOnline);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [usersRes, threadsRes] = await Promise.all([getUsers(), getChatThreads(), updateOnline(true)]);
        if (!mounted) return;
        setUsersCount(Array.isArray(usersRes.data) ? usersRes.data.length : 0);
        setThreadsCount(Array.isArray(threadsRes.data) ? threadsRes.data.length : 0);
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
  }, []);

  const stats = useMemo(
    () => [
      { title: 'الأصدقاء', value: loading ? '...' : usersCount, meta: 'عدد الحسابات المتاحة' },
      { title: 'المحادثات', value: loading ? '...' : threadsCount, meta: 'قائمة الدردشة الحالية' },
      { title: 'الحالة', value: isOnline ? 'متصل' : 'غير متصل', meta: user?.user || user?.username || 'member' },
    ],
    [isOnline, loading, threadsCount, user, usersCount]
  );

  const shortcuts = [
    { to: '/profile', title: 'الملف الشخصي', desc: 'الحساب والإحصائيات والمنشورات', icon: '◎' },
    { to: '/notifications', title: 'الإشعارات', desc: 'كل التنبيهات في شاشة مستقلة', icon: '🔔' },
    { to: '/users', title: 'الأصدقاء', desc: 'ابدأ دردشة أو تابع مستخدمين', icon: '🧑‍🤝‍🧑' },
    { to: '/groups', title: 'المجموعات', desc: 'أنشئ مجموعة أو انضم إليها', icon: '👥' },
  ];

  const handleEnableBrowserNotifications = async () => {
    if (!browserNotificationsSupported()) {
      setPermissionState('unsupported');
      return;
    }
    const permission = await window.Notification.requestPermission();
    setPermissionState(permission);
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
      <section className="menu-page-grid">
        <Card className="menu-hero-card">
          <div className="menu-hero-copy">
            <span className="badge">القائمة الرئيسية</span>
            <h3>واجهة مرتبة بدون تراكب</h3>
            <p>
              هنا جمعنا الأقسام الثانوية وإعدادات الحساب في شاشة مستقلة، عشان تفضل الصفحة الرئيسية خاصة بالمنشورات والقصص فقط.
            </p>
          </div>

          <div className="menu-user-summary">
            <div className="avatar-circle large">{(user?.user || user?.username || 'U').slice(0, 1).toUpperCase()}</div>
            <div className="user-meta">
              <strong>{user?.user || user?.username || 'مستخدم'}</strong>
              <span className="muted">{isOnline ? 'متصل الآن' : 'غير متصل حالياً'}</span>
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

        <section className="stats-grid compact-stats menu-stats-grid">
          {stats.map((item) => (
            <Card key={item.title}>
              <div className="stat-title">{item.title}</div>
              <div className="stat-value">{item.value}</div>
              <div className="muted">{item.meta}</div>
            </Card>
          ))}
        </section>

        <Card className="menu-settings-card">
          <div className="section-head compact">
            <div>
              <h3 className="section-title">إعدادات سريعة</h3>
              <p className="muted no-margin">هذه الخيارات اتنقلت للقائمة بدل ما تكون متكدسة فوق الرئيسية.</p>
            </div>
          </div>

          <div className="menu-settings-actions">
            <Button variant="secondary" onClick={toggleTheme}>
              {theme === 'dark' ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'}
            </Button>
            <Button variant="secondary" onClick={handleEnableBrowserNotifications}>
              {permissionState === 'granted'
                ? 'إشعارات المتصفح مفعلة'
                : permissionState === 'denied'
                  ? 'الإشعارات مرفوضة'
                  : permissionState === 'unsupported'
                    ? 'المتصفح لا يدعم الإشعارات'
                    : 'تفعيل إشعارات المتصفح'}
            </Button>
            <Button onClick={handleLogout}>تسجيل الخروج</Button>
          </div>
        </Card>
      </section>
    </MainLayout>
  );
}
