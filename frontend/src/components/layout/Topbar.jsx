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
  { to: '/', label: 'الرئيسية', match: (path) => path === '/' },
  { to: '/search', label: 'البحث', match: (path) => path.startsWith('/search'), icon: '🔍' },
  { to: '/live', label: 'البث', match: (path) => path.startsWith('/live'), badgeType: 'live' },
  { to: '/groups', label: 'المجموعات', match: (path) => path.startsWith('/groups') },
  { to: '/reels', label: 'الريلز', match: (path) => path.startsWith('/reels') },
  { to: '/stories', label: 'الستوري', match: (path) => path.startsWith('/stories') },
  { to: '/inbox', label: 'الدردشة', match: (path) => path.startsWith('/inbox') || path.startsWith('/chat'), badgeType: 'inbox' },
  { to: '/notifications', label: 'الإشعارات', match: (path) => path.startsWith('/notifications'), badgeType: 'notifications' },
  { to: '/users', label: 'الأشخاص', match: (path) => path.startsWith('/users'), icon: '👥' },
  { to: '/dashboard', label: 'التحليلات', match: (path) => path.startsWith('/dashboard'), icon: '📊' },
  { to: '/settings', label: 'الإعدادات', match: (path) => path.startsWith('/settings') },
];

const ACCOUNT_MENU_ITEMS = [
  { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  { to: '/', label: 'الرئيسية', icon: '🏠' },
  { to: '/search', label: 'البحث', icon: '🔍' },
  { to: '/users', label: 'اكتشاف أشخاص', icon: '👥' },
  { to: '/inbox', label: 'الدردشة', icon: '💬' },
  { to: '/groups', label: 'المجموعات', icon: '👫' },
  { to: '/reels', label: 'الريلز', icon: '🎬' },
  { to: '/stories', label: 'القصص', icon: '📖' },
  { to: '/live', label: 'البث المباشر', icon: '📡' },
  { to: '/dashboard', label: 'التحليلات', icon: '📊' },
  { to: '/livestream-dashboard', label: 'لوحة البث', icon: '🎥' },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔' },
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
  const closeTimerRef = useRef(null);

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

  const username = currentUsername || session?.username || 'Y';
  const profileInitial = String(username).trim().charAt(0).toUpperCase() || 'Y';

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  const openMenu = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setMenuOpen(true);
  };

  const closeMenuSoon = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setMenuOpen(false), 120);
  };

  const closeMenuNow = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setMenuOpen(false);
  };

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
      closeMenuNow();
      setLoggingOut(false);
      redirectToAppPath('/login');
    }
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
            let badge = 0;
            if (item.badgeType === 'notifications') badge = unreadNotificationCount;
            else if (item.badgeType === 'inbox') badge = unreadInboxCount;
            else if (item.badgeType === 'live') badge = activeLiveCount;
            return (
              <NavLink key={item.to} to={item.to} className={`yam-topbar-pill ${isActive ? 'active' : ''}`} title={item.label}>
                {item.icon ? <span>{item.icon}</span> : null}
                <span>{item.label}</span>
                {badge > 0 ? <strong className="yam-topbar-badge">{badge}</strong> : null}
              </NavLink>
            );
          })}
        </nav>

        <button type="button" className={`yam-topbar-pill yam-theme-pill ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme}>
          <span>{theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
        </button>

        <div className="yam-account-menu-wrap" onMouseEnter={openMenu} onMouseLeave={closeMenuSoon}>
          <button
            type="button"
            className={`yam-account-pill ${menuOpen ? 'open' : ''}`}
            title={username}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="yam-account-chevron" aria-hidden="true">☰</span>
            <span className="yam-account-avatar">{profileInitial}</span>
            <span className="yam-account-chevron">▾</span>
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
                <Link key={item.to} to={item.to} className="yam-account-link" role="menuitem" onClick={closeMenuNow}>
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
          z-index: 50;
          padding: 8px 12px 6px;
          background: rgba(4, 8, 18, 0.86);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
        }

        .yam-topbar-track {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 2px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.28) transparent;
          white-space: nowrap;
        }

        .yam-topbar-track::-webkit-scrollbar { height: 4px; }
        .yam-topbar-track::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.28);
          border-radius: 999px;
        }

        .yam-topbar-nav {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .yam-brand-pill,
        .yam-topbar-pill,
        .yam-account-pill {
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,23,42,0.74);
          color: #dbe4ff;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .yam-brand-pill {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(59,130,246,0.12));
          color: #fff;
        }

        .yam-brand-mark,
        .yam-account-avatar,
        .yam-account-dropdown-avatar {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: inline-grid;
          place-items: center;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white;
          font-size: 13px;
          font-weight: 900;
        }

        .yam-topbar-pill {
          position: relative;
          transition: 0.18s ease;
        }

        .yam-topbar-pill:hover,
        .yam-topbar-pill.active,
        .yam-account-pill:hover,
        .yam-account-pill.open {
          color: #fff;
          background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(99,102,241,0.14));
          border-color: rgba(167,139,250,0.24);
        }

        .yam-theme-pill,
        .yam-account-pill {
          cursor: pointer;
        }

        .yam-topbar-badge {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          line-height: 1;
        }

        .yam-account-menu-wrap {
          position: relative;
          margin-inline-start: auto;
          flex-shrink: 0;
        }

        .yam-account-pill {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.82);
          padding: 0 12px;
        }

        .yam-account-chevron {
          font-size: 12px;
          opacity: 0.88;
        }

        .yam-account-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          inset-inline-end: 0;
          width: min(280px, 90vw);
          background: rgba(10,16,31,0.98);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 28px 60px rgba(2,6,23,0.46);
          padding: 12px;
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          transition: opacity 160ms ease, transform 180ms ease;
          backdrop-filter: blur(20px);
        }

        .yam-account-dropdown.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .yam-account-dropdown-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
        }

        .yam-account-dropdown-head strong {
          display: block;
          color: #fff;
          font-size: 15px;
        }

        .yam-account-dropdown-head p {
          margin: 2px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .yam-account-dropdown-list {
          display: grid;
          gap: 4px;
        }

        .yam-account-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: none;
          background: transparent;
          color: #e2e8f0;
          padding: 11px 12px;
          border-radius: 14px;
          text-decoration: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          text-align: start;
        }

        .yam-account-link:hover {
          background: rgba(124,58,237,0.14);
          color: #fff;
        }

        .yam-account-link.logout {
          color: #fca5a5;
        }

        .yam-account-link.logout:hover {
          background: rgba(239,68,68,0.12);
        }

        @media (max-width: 768px) {
          .yam-topbar-shell {
            padding: 8px 10px 6px;
          }

          .yam-brand-pill,
          .yam-topbar-pill,
          .yam-account-pill {
            min-height: 38px;
            border-radius: 12px;
            padding: 0 12px;
            font-size: 13px;
          }

          .yam-account-dropdown {
            width: min(240px, 88vw);
          }
        }
      `}</style>
    </header>
  );
}
