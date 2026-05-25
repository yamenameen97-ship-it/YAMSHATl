import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../api/notifications.js';
import { getLiveRooms } from '../../api/live.js';
import { BACKEND_ORIGIN } from '../../api/config.js';
import { clearStoredUser, getAuthToken, getCurrentUsername, getStoredUserSnapshot } from '../../utils/auth.js';
import { getCsrfToken } from '../../utils/csrf.js';
import { redirectToAppPath } from '../../utils/router.js';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';

const PRIMARY_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: '⌂', match: (path) => path === '/' },
  { to: '/search', label: 'البحث', icon: '⌕', match: (path) => path.startsWith('/search') },
  { to: '/live', label: 'البث', icon: '◉', match: (path) => path.startsWith('/live'), badgeType: 'live' },
  { to: '/inbox', label: 'الدردشة', icon: '✉', match: (path) => path.startsWith('/inbox') || path.startsWith('/chat'), badgeType: 'inbox' },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔', match: (path) => path.startsWith('/notifications'), badgeType: 'notifications' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙', match: (path) => path.startsWith('/settings') },
];

const ACCOUNT_MENU_ITEMS = [
  { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  { to: '/users', label: 'اكتشاف أشخاص', icon: '👥' },
  { to: '/groups', label: 'المجموعات', icon: '👫' },
  { to: '/reels', label: 'الريلز', icon: '🎬' },
  { to: '/stories', label: 'القصص', icon: '📖' },
  { to: '/dashboard', label: 'التحليلات', icon: '📊' },
  { to: '/livestream-dashboard', label: 'لوحة البث', icon: '🎥' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function Topbar() {
  const location = useLocation();
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

  const username = currentUsername || session?.username || 'Yamshat';
  const profileInitial = String(username).trim().charAt(0).toUpperCase() || 'Y';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
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
  };

  const badgeFor = (item) => {
    if (item.badgeType === 'notifications') return unreadNotificationCount;
    if (item.badgeType === 'inbox') return unreadInboxCount;
    if (item.badgeType === 'live') return activeLiveCount;
    return 0;
  };

  return (
    <header className="yam-topbar-shell" dir="rtl">
      <div className="yam-topbar-track">
        <Link to="/" className="yam-brand-pill" aria-label="YAMSHAT">
          <span className="yam-brand-mark">👑</span>
          <span className="yam-brand-name">YAMSHAT</span>
        </Link>

        <nav className="yam-topbar-nav" aria-label="التنقل الرئيسي">
          {PRIMARY_ITEMS.map((item) => {
            const isActive = item.match(location.pathname);
            const badge = badgeFor(item);
            return (
              <NavLink key={item.to} to={item.to} className={`yam-topbar-pill ${isActive ? 'active' : ''}`} title={item.label}>
                <span className="yam-nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {badge > 0 ? <strong className="yam-topbar-badge">{badge}</strong> : null}
              </NavLink>
            );
          })}
        </nav>

        <button type="button" className="yam-topbar-pill yam-theme-pill" onClick={toggleTheme} aria-label="تبديل المظهر">
          <span className="yam-nav-icon" aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
          <span>{theme === 'dark' ? 'ليلي' : 'نهاري'}</span>
        </button>

        <div className="yam-account-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className={`yam-account-pill ${menuOpen ? 'open' : ''}`}
            title={username}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="yam-account-avatar">{profileInitial}</span>
            <span className="yam-account-copy">
              <strong>{username}</strong>
              <small>الحساب</small>
            </span>
            <span className="yam-account-chevron" aria-hidden="true">▾</span>
          </button>

          <div className={`yam-account-dropdown ${menuOpen ? 'open' : ''}`} role="menu">
            <div className="yam-account-dropdown-head">
              <div className="yam-account-dropdown-avatar">{profileInitial}</div>
              <div>
                <strong>{username}</strong>
                <p>القائمة السريعة</p>
              </div>
            </div>

            <div className="yam-account-dropdown-list">
              {ACCOUNT_MENU_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="yam-account-link" role="menuitem" onClick={() => setMenuOpen(false)}>
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
        </div>
      </div>

      <style>{`
        .yam-topbar-shell {
          position: sticky;
          top: 0;
          z-index: 70;
          padding: 10px 14px;
          background: color-mix(in srgb, var(--bg) 82%, transparent);
          border-bottom: 1px solid var(--line);
          backdrop-filter: blur(22px);
        }

        .yam-topbar-track {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          gap: 12px;
          width: min(100%, 1440px);
          margin: 0 auto;
        }

        .yam-topbar-nav {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .yam-topbar-nav::-webkit-scrollbar {
          display: none;
        }

        .yam-brand-pill,
        .yam-topbar-pill,
        .yam-account-pill {
          min-height: 46px;
          border-radius: 18px;
          border: 1px solid color-mix(in srgb, var(--line) 86%, transparent);
          background: color-mix(in srgb, var(--panel) 90%, transparent);
          color: var(--text);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 800;
          box-shadow: var(--shadow-sm);
          transition: transform var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast), color var(--motion-fast);
        }

        .yam-brand-pill {
          background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, var(--panel)), color-mix(in srgb, var(--secondary) 14%, var(--panel)));
          color: var(--text);
        }

        .yam-brand-mark,
        .yam-account-avatar,
        .yam-account-dropdown-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: var(--text-on-accent);
          font-weight: 900;
        }

        .yam-topbar-pill.active,
        .yam-account-pill.open,
        .yam-topbar-pill:hover,
        .yam-account-pill:hover,
        .yam-brand-pill:hover {
          border-color: color-mix(in srgb, var(--primary) 45%, var(--line));
          background: color-mix(in srgb, var(--panel-strong) 90%, transparent);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .yam-theme-pill {
          justify-content: center;
        }

        .yam-nav-icon {
          line-height: 1;
          font-size: 16px;
        }

        .yam-topbar-badge {
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: var(--danger);
          color: #fff;
          font-size: 11px;
          line-height: 1;
        }

        .yam-account-menu-wrap {
          position: relative;
        }

        .yam-account-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .yam-account-copy small {
          color: var(--muted);
          font-size: 11px;
          font-weight: 700;
        }

        .yam-account-chevron {
          color: var(--muted);
          font-size: 12px;
        }

        .yam-account-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          inset-inline-end: 0;
          width: min(320px, calc(100vw - 28px));
          padding: 14px;
          border-radius: 24px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--panel-strong) 96%, transparent);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(22px);
          opacity: 0;
          transform: translateY(8px);
          pointer-events: none;
          transition: opacity var(--motion-fast), transform var(--motion-fast);
        }

        .yam-account-dropdown.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .yam-account-dropdown-head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 0 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }

        .yam-account-dropdown-head p {
          margin: 4px 0 0;
          color: var(--muted);
          font-size: 13px;
        }

        .yam-account-dropdown-list {
          display: grid;
          gap: 8px;
        }

        .yam-account-link {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text);
          font-size: 14px;
          font-weight: 700;
          text-align: start;
        }

        .yam-account-link:hover {
          background: color-mix(in srgb, var(--panel) 84%, transparent);
          border-color: color-mix(in srgb, var(--line) 90%, transparent);
        }

        .yam-account-link.logout {
          color: var(--danger);
        }

        @media (max-width: 1023px) {
          .yam-topbar-track {
            grid-template-columns: 1fr auto auto;
          }

          .yam-topbar-nav {
            display: none;
          }

          .yam-theme-pill span:last-child,
          .yam-account-copy {
            display: none;
          }

          .yam-topbar-pill,
          .yam-account-pill,
          .yam-brand-pill {
            padding-inline: 14px;
          }
        }

        @media (max-width: 640px) {
          .yam-topbar-shell {
            padding: 10px 12px;
          }

          .yam-brand-name {
            font-size: 13px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .yam-brand-pill,
          .yam-topbar-pill,
          .yam-account-pill,
          .yam-account-dropdown {
            transition: none;
          }
        }
      `}</style>
    </header>
  );
}
