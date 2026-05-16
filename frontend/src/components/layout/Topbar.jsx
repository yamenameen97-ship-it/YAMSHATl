import { Link, NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../api/notifications.js';
import { getCurrentUsername, getStoredUserSnapshot } from '../../utils/auth.js';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import { avatarGradient, initialsFromName } from '../yamshat/YamshatDesign.js';

const MAIN_TABS = [
  { to: '/', label: 'الرئيسية' },
  { to: '/live', label: 'البث المباشر' },
  { to: '/groups', label: 'المجموعات' },
  { to: '/reels', label: 'المقاطع' },
  { to: '/stories', label: 'القصص' },
];

function Avatar({ username, avatar }) {
  return avatar ? (
    <img src={avatar} alt={username} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
  ) : (
    <div style={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(username) }}>
      {initialsFromName(username).slice(0, 1)}
    </div>
  );
}

export default function Topbar() {
  const location = useLocation();
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const isOnline = useAppStore((state) => state.isOnline);
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

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/live')) return 'البث المباشر';
    if (location.pathname.startsWith('/inbox') || location.pathname.startsWith('/chat')) return 'الدردشات';
    if (location.pathname.startsWith('/notifications')) return 'الإشعارات';
    if (location.pathname.startsWith('/groups')) return 'المجموعات';
    return 'YAMSHAT';
  }, [location.pathname]);

  return (
    <header className="yam-topbar-shell">
      <div className="yam-topbar-left">
        <Link to="/" className="yam-logo-lockup">
          <div className="yam-logo-mark">🜲</div>
          <div>
            <div className="yam-logo-title">YAMSHAT</div>
            <div className="yam-logo-subtitle">{pageTitle}</div>
          </div>
        </Link>

        <nav className="yam-main-tabs">
          {MAIN_TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `yam-main-tab ${isActive ? 'active' : ''}`}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="yam-topbar-center">
        <label className="yam-search-box">
          <span>⌕</span>
          <input type="search" placeholder="ابحث في يامشات" aria-label="ابحث في يامشات" />
        </label>
      </div>

      <div className="yam-topbar-right">
        <button type="button" className="yam-icon-btn" onClick={toggleTheme} title="تبديل النمط">
          {theme === 'dark' ? '☾' : '☀'}
        </button>
        <Link to="/notifications" className="yam-icon-btn with-badge" title="الإشعارات">
          🔔
          {unreadNotificationCount > 0 ? <span className="yam-count-badge">{unreadNotificationCount}</span> : null}
        </Link>
        <Link to="/inbox" className="yam-icon-btn with-badge" title="الرسائل">
          💬
          {unreadInboxCount > 0 ? <span className="yam-count-badge">{unreadInboxCount}</span> : null}
        </Link>
        <div className="yam-presence-pill">
          <span className={`presence-dot ${isOnline ? 'online' : 'offline'}`} />
          {isOnline ? 'متصل' : 'غير متصل'}
        </div>
        <Link to="/profile" className="yam-profile-pill" title="الملف الشخصي">
          <Avatar username={currentUsername || session?.username || 'Y'} avatar={session?.avatar || session?.profile?.avatar} />
        </Link>
      </div>

      <style>{`
        .yam-topbar-shell {
          position: sticky;
          top: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: auto minmax(280px, 1fr) auto;
          align-items: center;
          gap: 18px;
          padding: 14px 22px;
          background: rgba(4, 8, 18, 0.88);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
        }
        .yam-topbar-left, .yam-topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .yam-logo-lockup {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: max-content;
        }
        .yam-logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.36), rgba(99,102,241,0.2));
          color: #d8b4fe;
          font-size: 22px;
          border: 1px solid rgba(167,139,250,0.22);
        }
        .yam-logo-title { font-weight: 900; letter-spacing: 0.08em; }
        .yam-logo-subtitle { color: #64748b; font-size: 12px; }
        .yam-main-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .yam-main-tab {
          padding: 10px 14px;
          border-radius: 14px;
          color: #94a3b8;
          font-weight: 700;
          transition: 0.2s ease;
        }
        .yam-main-tab.active,
        .yam-main-tab:hover {
          color: white;
          background: rgba(124,58,237,0.18);
        }
        .yam-topbar-center { display: flex; justify-content: center; }
        .yam-search-box {
          width: min(620px, 100%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 18px;
          background: rgba(15,23,42,0.76);
          border: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
        }
        .yam-search-box input {
          width: 100%;
          border: none;
          outline: none;
          color: white;
          background: transparent;
        }
        .yam-icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(15,23,42,0.72);
          color: white;
          display: grid;
          place-items: center;
          font-size: 17px;
          position: relative;
        }
        .yam-count-badge {
          position: absolute;
          top: -4px;
          inset-inline-end: -4px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid rgba(4,8,18,0.92);
        }
        .yam-presence-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 700;
        }
        .presence-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
        }
        .presence-dot.online { background: #22c55e; box-shadow: 0 0 0 5px rgba(34,197,94,0.12); }
        .presence-dot.offline { background: #f97316; }
        .yam-profile-pill { display: flex; align-items: center; }
        @media (max-width: 1180px) {
          .yam-topbar-shell {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .yam-topbar-left,
          .yam-topbar-right { justify-content: space-between; flex-wrap: wrap; }
          .yam-topbar-center { order: 3; }
        }
        @media (max-width: 768px) {
          .yam-main-tabs { display: none; }
          .yam-presence-pill { display: none; }
          .yam-topbar-shell { padding: 14px; }
        }
      `}</style>
    </header>
  );
}
