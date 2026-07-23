import { Link } from 'react-router-dom';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications } from '../../api/notifications.js';
import { useNotificationStore, selectUnreadNotificationsCount } from '../../store/notificationStore.js';
import socketManager from '../../services/socketManager.js';
import { normalizeNotification } from '../../utils/notificationCenter.js';
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
  { to: '/inbox', label: 'الدردشة', icon: '✉', match: (path) => path.startsWith('/inbox') || path.startsWith('/chat') },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔', match: (path) => path.startsWith('/notifications') },
  { to: '/settings', label: 'الإعدادات', icon: '⚙', match: (path) => path.startsWith('/settings') },
]);

// الأزرار السريعة في الهيدر العلوي (الستوري + المجموعات + الإشعارات)
// v46: زر الإشعارات يظهر رمز فقط بدون نص
const MOBILE_QUICK_LINKS = Object.freeze([
  { to: '/stories', label: 'القصص', icon: '📖', ariaLabel: 'القصص' },
  { to: '/groups', label: 'المجموعات', icon: '👫', ariaLabel: 'المجموعات' },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔', ariaLabel: 'الإشعارات', isNotifications: true },
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
  const liveSession = useAppStore((state) => state.session);
  const session = liveSession || getStoredUserSnapshot();
  const currentUsername = session?.username || session?.user || getCurrentUsername();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['topbar-notifications-count'],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  // v88.6 FIX (نظام الإشعارات): كان العدّاد في الجرس يقرأ من React Query فقط،
  // بينما صفحة الإشعارات + الـ zustand store مصدر مختلف تماماً. النتيجة:
  // بعد تعليم إشعار كمقروء، الشارة تبقى تعرض الرقم القديم لدقائق. الحل:
  //   1) نقرأ العدّاد من مصدرين ونأخذ الحدّ الأدنى الحقيقي:
  //      - React Query (server truth)
  //      - zustand store (client truth after optimistic updates)
  //   2) نستمع لحدث 'yamshat:notifications-changed' لإبطال الكاش فوراً.
  //   3) نستمع لسوكت 'new_notification' حتى تظهر الشارة فوراً دون انتظار polling.
  const storeUnreadCount = useNotificationStore(selectUnreadNotificationsCount);

  const serverUnreadCount = useMemo(
    () => (Array.isArray(notifications)
      ? notifications.filter((item) => !item.is_read && !item.seen).length
      : 0),
    [notifications],
  );

  // نأخذ storeUnreadCount عندما يكون المخزن مُهيّئاً (فيه بيانات)، وإلا نعتمد على السيرفر.
  const unreadNotificationCount = useMemo(() => {
    if (Array.isArray(notifications) && notifications.length > 0) {
      // إذا كان لدينا بيانات من الطرفين، نأخذ الأصغر منطقياً (ربما المستخدم قرأ بعضها)
      return Math.min(serverUnreadCount, storeUnreadCount || serverUnreadCount);
    }
    return storeUnreadCount || serverUnreadCount;
  }, [notifications, serverUnreadCount, storeUnreadCount]);

  const invalidateBadge = useCallback(() => {
    try { queryClient.invalidateQueries({ queryKey: ['topbar-notifications-count'] }); } catch { /* noop */ }
  }, [queryClient]);

  useEffect(() => {
    const handler = () => invalidateBadge();
    window.addEventListener('yamshat:notifications-changed', handler);
    return () => window.removeEventListener('yamshat:notifications-changed', handler);
  }, [invalidateBadge]);

  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  useEffect(() => {
    const unsubscribe = socketManager.on('new_notification', (incoming) => {
      try { upsertNotification(normalizeNotification(incoming)); } catch { /* noop */ }
      invalidateBadge();
    });
    return () => {
      try { unsubscribe?.(); } catch { /* noop */ }
    };
  }, [invalidateBadge, upsertNotification]);

  const navItems = useMemo(
    () => PRIMARY_ITEMS.map((item) => ({
      ...item,
      badge: item.to === '/notifications'
        ? unreadNotificationCount || null
        : item.to === '/inbox'
          ? unreadInboxCount || null
          : null,
    })),
    [unreadInboxCount, unreadNotificationCount],
  );

  const username = currentUsername || session?.username || 'Yamshat';
  // ✅ FIX v45 (الاسم لا يُحفظ): قراءة الاسم مع fallback للتخزين المحلي
  const localFullName = (() => {
    try { return username ? (window.localStorage.getItem(`yamshat:profile:fullname:${username}`) || '') : ''; }
    catch { return ''; }
  })();
  const displayName = session?.profile?.full_name || session?.name || session?.full_name || localFullName || username;
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

  // ✅ FIX v46: الأزرار السريعة (الستوري/المجموعات/الإشعارات) منسّقة بدون تراكب
  // زر الإشعارات يظهر برمز فقط بدون نص + شارة العداد
  const mobileQuickLinks = (
    <div className="topbar-mobile-quick-links" dir="rtl">
      {MOBILE_QUICK_LINKS.map((item) => {
        const badge = item.isNotifications && unreadNotificationCount > 0 ? unreadNotificationCount : null;
        const extraClass = item.isNotifications ? 'topbar-quick-link--notifications' : '';
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`topbar-quick-link ${extraClass}`.trim()}
            aria-label={item.ariaLabel}
            title={item.label}
          >
            <span className="topbar-quick-link-icon" aria-hidden="true">{item.icon}</span>
            {!item.isNotifications ? (
              <span className="topbar-quick-link-label">{item.label}</span>
            ) : null}
            {badge ? (
              <span className="topbar-quick-link-badge" aria-label={`${badge} إشعارات جديدة`}>
                {badge > 99 ? '99+' : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
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
