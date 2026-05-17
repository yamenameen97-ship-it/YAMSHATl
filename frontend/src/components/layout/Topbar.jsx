import { Link, NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../api/notifications.js';
import { getCurrentUsername, getStoredUserSnapshot } from '../../utils/auth.js';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';

const PRIMARY_ITEMS = [
  { to: '/', label: 'الرئيسية', match: (path) => path === '/' },
  { to: '/live', label: 'البث', match: (path) => path.startsWith('/live') },
  { to: '/groups', label: 'المجموعات', match: (path) => path.startsWith('/groups') },
  { to: '/reels', label: 'الريلز', match: (path) => path.startsWith('/reels') },
  { to: '/stories', label: 'الستوري', match: (path) => path.startsWith('/stories') },
  { to: '/inbox', label: 'الدردشة', match: (path) => path.startsWith('/inbox') || path.startsWith('/chat') },
  { to: '/notifications', label: 'الإشعارات', match: (path) => path.startsWith('/notifications'), badgeType: 'notifications' },
  { to: '/profile', label: 'الملف الشخصي', match: (path) => path.startsWith('/profile') },
  { to: '/settings', label: 'الإعدادات', match: (path) => path.startsWith('/settings') },
];

export default function Topbar() {
  const location = useLocation();
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const currentUsername = getCurrentUsername();
  const session = getStoredUserSnapshot();

  const { data: notifications = [] } = useQuery({
    queryKey: ['topbar-notifications-count'],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const unreadNotificationCount = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter((item) => !item.is_read).length : 0),
    [notifications],
  );

  const username = currentUsername || session?.username || 'Y';
  const profileInitial = String(username).trim().charAt(0).toUpperCase() || 'Y';

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
            const badge = item.badgeType === 'notifications' ? unreadNotificationCount : item.to === '/inbox' ? unreadInboxCount : 0;
            return (
              <NavLink key={item.to} to={item.to} className={`yam-topbar-pill ${isActive ? 'active' : ''}`}>
                <span>{item.label}</span>
                {badge > 0 ? <strong className="yam-topbar-badge">{badge}</strong> : null}
              </NavLink>
            );
          })}
        </nav>

        <button type="button" className={`yam-topbar-pill yam-theme-pill ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme}>
          <span>{theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
        </button>

        <Link to="/profile" className="yam-account-pill" title={username}>
          <span className="yam-account-avatar">{profileInitial}</span>
          <span className="yam-account-name">{username}</span>
        </Link>
      </div>

      <style>{`
        .yam-topbar-shell {
          position: sticky;
          top: 0;
          z-index: 40;
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
          overflow-y: hidden;
          padding-bottom: 2px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.28) transparent;
          white-space: nowrap;
        }

        .yam-topbar-track::-webkit-scrollbar {
          height: 4px;
        }

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
        }

        .yam-brand-pill {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(59,130,246,0.12));
          color: #fff;
        }

        .yam-brand-mark {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: inline-grid;
          place-items: center;
          background: rgba(255,255,255,0.08);
          font-size: 14px;
        }

        .yam-brand-name {
          letter-spacing: 0.06em;
        }

        .yam-topbar-pill {
          position: relative;
          transition: 0.18s ease;
        }

        .yam-topbar-pill:hover,
        .yam-topbar-pill.active,
        .yam-account-pill:hover {
          color: #fff;
          background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(99,102,241,0.14));
          border-color: rgba(167,139,250,0.24);
        }

        .yam-theme-pill {
          border: none;
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

        .yam-account-pill {
          margin-inline-start: auto;
        }

        .yam-account-avatar {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: inline-grid;
          place-items: center;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white;
          font-size: 13px;
        }

        .yam-account-name {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
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

          .yam-account-name {
            max-width: 92px;
          }
        }
      `}</style>
    </header>
  );
}
