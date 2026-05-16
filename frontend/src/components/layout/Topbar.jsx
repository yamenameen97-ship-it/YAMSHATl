import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const isOnline = useAppStore((state) => state.isOnline);
  const currentUsername = getCurrentUsername();
  const session = getStoredUserSnapshot();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (location.pathname.startsWith('/dashboard')) return 'القائمة';
    return 'YAMSHAT';
  }, [location.pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  const handleSearchSubmit = (event) => {
    event?.preventDefault?.();
    const value = searchQuery.trim();
    if (typeof window !== 'undefined') {
      if (value) window.sessionStorage.setItem('yamshat.topbarSearch', value);
      else window.sessionStorage.removeItem('yamshat.topbarSearch');
    }
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
    setSearchOpen(false);
  };

  return (
    <header className="yam-topbar-shell">
      <div className="yam-topbar-left">
        <Link to="/" className="yam-logo-lockup" aria-label="YAMSHAT">
          <div className="yam-logo-mark">👑</div>
          <div className="yam-logo-copy">
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

      <div className="yam-topbar-center yam-desktop-only">
        <form className="yam-search-box" onSubmit={handleSearchSubmit}>
          <button type="submit" className="yam-search-trigger" aria-label="ابحث في يامشات">⌕</button>
          <input
            type="search"
            placeholder="ابحث في يامشات"
            aria-label="ابحث في يامشات"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
      </div>

      <div className="yam-topbar-right">
        <button type="button" className="yam-icon-btn yam-mobile-only" onClick={() => setSearchOpen((prev) => !prev)} title="البحث">
          ⌕
        </button>
        <button type="button" className="yam-icon-btn" onClick={toggleTheme} title="تبديل النمط">
          {theme === 'dark' ? '☾' : '☀'}
        </button>
        <Link to="/notifications" className="yam-icon-btn with-badge" title="الإشعارات">
          🔔
          {unreadNotificationCount > 0 ? <span className="yam-count-badge">{unreadNotificationCount}</span> : null}
        </Link>
        <Link to="/dashboard" className="yam-icon-btn" title="القائمة">
          ☰
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

      {searchOpen ? (
        <form className="yam-mobile-search-sheet yam-mobile-only" onSubmit={handleSearchSubmit}>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="ابحث في يامشات"
            aria-label="ابحث في يامشات"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit" className="yam-mobile-search-btn">بحث</button>
        </form>
      ) : null}

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
        .yam-topbar-left,
        .yam-topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .yam-topbar-left {
          min-width: 0;
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
          color: #f5d0fe;
          font-size: 20px;
          border: 1px solid rgba(167,139,250,0.22);
        }
        .yam-logo-copy {
          display: grid;
          gap: 2px;
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
          padding: 8px 10px;
          border-radius: 18px;
          background: rgba(15,23,42,0.76);
          border: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
        }
        .yam-search-trigger {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          color: #cbd5e1;
          display: grid;
          place-items: center;
          font-size: 18px;
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
        .yam-mobile-only { display: none; }
        .yam-mobile-search-sheet {
          display: none;
        }
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
          .yam-main-tabs,
          .yam-presence-pill,
          .yam-desktop-only {
            display: none;
          }
          .yam-mobile-only {
            display: inline-grid;
          }
          .yam-topbar-shell {
            grid-template-columns: 1fr auto;
            gap: 10px;
            padding: 12px 14px;
          }
          .yam-topbar-left {
            justify-content: flex-start;
          }
          .yam-topbar-right {
            gap: 8px;
            flex-wrap: nowrap;
            justify-content: flex-end;
          }
          .yam-logo-copy {
            display: none;
          }
          .yam-logo-mark {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            font-size: 18px;
          }
          .yam-icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
          .yam-mobile-search-sheet {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 8px;
            padding-top: 4px;
          }
          .yam-mobile-search-sheet input {
            min-height: 42px;
            border-radius: 14px;
            padding: 0 14px;
            background: rgba(15,23,42,0.82);
            border: 1px solid rgba(255,255,255,0.06);
            color: white;
          }
          .yam-mobile-search-btn {
            min-width: 72px;
            border: 1px solid rgba(167,139,250,0.22);
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(124,58,237,0.36), rgba(99,102,241,0.22));
            color: white;
            font-weight: 700;
          }
        }
      `}</style>
    </header>
  );
}
