import { Link } from 'react-router-dom';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../api/notifications.js';
import { getLiveRooms } from '../../api/live.js';
import { BACKEND_ORIGIN } from '../../api/config.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { clearStoredUser, getAuthToken, getCurrentUsername, getStoredUserSnapshot } from '../../utils/auth.js';
import { getCsrfToken } from '../../utils/csrf.js';
import { redirectToAppPath } from '../../utils/router.js';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import TopBarUI, { TopBarAccount } from '../ui/TopBar.jsx';

// مرجع مستقر (frozen) — لا يُعاد إنشاؤه مع كل render
const PRIMARY_ITEMS = Object.freeze([
  { to: '/', label: 'الرئيسية', icon: '⌂', match: (path) => path === '/' },
  { to: '/search', label: 'البحث', icon: '⌕', match: (path) => path.startsWith('/search') },
  { to: '/live', label: 'البث', icon: '◉', match: (path) => path.startsWith('/live') },
  { to: '/inbox', label: 'الدردشة', icon: '✉', match: (path) => path.startsWith('/inbox') || path.startsWith('/chat') },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔', match: (path) => path.startsWith('/notifications') },
  { to: '/settings', label: 'الإعدادات', icon: '⚙', match: (path) => path.startsWith('/settings') },
]);

// الأزرار السريعة في الهيدر العلوي
// ملاحظة: على الموبايل تُخفى عبر CSS (mobile-fixes.css) — تظهر فقط على الديسكتوب
const MOBILE_QUICK_LINKS = Object.freeze([
  { to: '/groups', label: 'المجموعات', icon: '👫', ariaLabel: 'المجموعات' },
  { to: '/reels', label: 'الريلز', icon: '🎬', ariaLabel: 'الريلز' },
  { to: '/stories', label: 'القصص', icon: '📖', ariaLabel: 'القصص' },
]);

const ACCOUNT_MENU_ITEMS = Object.freeze([
  { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  { to: '/users', label: 'اكتشاف أشخاص', icon: '👥' },
  { to: '/groups', label: 'المجموعات', icon: '👫' },
  { to: '/reels', label: 'الريلز', icon: '🎬' },
  { to: '/stories', label: 'القصص', icon: '📖' },
  { to: '/dashboard', label: 'التحليلات', icon: '📊' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
]);

function Topbar() {
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const currentUsername = getCurrentUsername();
  const session = getStoredUserSnapshot();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['topbar-notifications-count'],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const { data: liveRooms = [] } = useQuery({
    queryKey: ['topbar-live-rooms'],
    queryFn: async () => {
      try {
        return (await getLiveRooms()).data || [];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const unreadNotificationCount = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter((item) => !item.is_read).length : 0),
    [notifications],
  );

  const activeLiveCount = useMemo(
    () => (Array.isArray(liveRooms) ? liveRooms.filter((room) => room.is_active).length : 0),
    [liveRooms],
  );

  const navItems = useMemo(
    () => PRIMARY_ITEMS.map((item) => ({
      ...item,
      badge: item.to === '/notifications'
        ? unreadNotificationCount || null
        : item.to === '/inbox'
          ? unreadInboxCount || null
          : item.to === '/live'
            ? activeLiveCount || null
            : null,
    })),
    [activeLiveCount, unreadInboxCount, unreadNotificationCount],
  );

  const username = currentUsername || session?.username || 'Yamshat';
  const displayName = session?.profile?.full_name || session?.name || session?.full_name || username;
  const avatarSrc = resolveMediaUrl(session?.profile?.avatar || session?.avatar || session?.profile?.avatar_url || session?.avatar_url || '');

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    // listener نشط فقط حين تكون القائمة مفتوحة → أقل overhead
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      await fetch(`${BACKEND_ORIGIN}/api/auth/logout`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
      });
    } catch {
      // ignore logout transport errors and clear local session anyway
    } finally {
      clearStoredUser();
      setMenuOpen(false);
      setLoggingOut(false);
      redirectToAppPath('/login');
    }
  }, [loggingOut]);

  // الأزرار السريعة — تظهر فقط على الديسكتوب (>= 768px)
  // على الجوال يتم إخفاؤها بالكامل لأنها متوفرة في الـ BottomNav والـ Header المخصص
  const mobileQuickLinks = (
    <div className="topbar-mobile-quick-links topbar-desktop-only">
      {MOBILE_QUICK_LINKS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="topbar-quick-link"
          aria-label={item.ariaLabel}
          title={item.label}
        >
          <span className="topbar-quick-link-icon">{item.icon}</span>
        </Link>
      ))}
    </div>
  );

  const trailingActions = (
    <div className="topbar-trailing-actions">
      <div className="topbar-theme-toggle">
        <button type="button" className="btn btn-secondary btn-small" onClick={toggleTheme} aria-label="تبديل المظهر">
          <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
          <span>{theme === 'dark' ? 'ليلي' : 'نهاري'}</span>
        </button>
      </div>
    </div>
  );

  const account = (
    <div ref={menuRef} className="yam-topbar-account-wrap">
      <TopBarAccount
        name={displayName}
        subtitle={username ? `@${username}` : 'الحساب'}
        avatarSrc={avatarSrc}
        onClick={toggleMenu}
        menu={
          <div className={`yam-account-dropdown ${menuOpen ? 'open' : ''}`} role="menu">
            <div className="yam-account-dropdown-head">
              <div>
                <strong>{displayName}</strong>
                <p>{username ? `@${username}` : 'القائمة السريعة'}</p>
              </div>
            </div>
            <div className="yam-account-dropdown-list">
              {ACCOUNT_MENU_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="yam-account-link" role="menuitem" onClick={closeMenu}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <button type="button" className="yam-account-link logout" role="menuitem" onClick={handleLogout} disabled={loggingOut}>
                <span>🚪</span>
                <span>{loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}</span>
              </button>
            </div>
          </div>
        }
      />
    </div>
  );

  return (
    <TopBarUI
      brand={BRAND}
      navItems={navItems}
      mobileQuickLinks={mobileQuickLinks}
      trailingActions={trailingActions}
      account={account}
      className="yam-topbar-shell"
    />
  );
}

const BRAND = Object.freeze({ to: '/', label: 'YAMSHAT', icon: '👑' });

export default memo(Topbar);
