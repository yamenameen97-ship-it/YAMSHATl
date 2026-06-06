import { memo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

const HOME_SHORTCUTS = Object.freeze([
  { to: '/live/control', label: 'البث' },
  { to: '/groups', label: 'المجموعات' },
  { to: '/stories', label: 'الستوري' },
  { to: '/reels', label: 'الريلز' },
]);

/**
 * MobileTopBar
 * شريط علوي للجوال مع شعار في الزاوية واختصارات سريعة في الهيدر العلوي.
 */
function MobileTopBar({ onMenuClick, hasNotifications = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/feed';

  return (
    <header className={`ym-topbar ${isHome ? 'has-shortcuts' : ''}`} role="banner">
      <div className="ym-topbar-inner">
        <div className="ym-topbar-actions">
          <button
            type="button"
            className="ym-topbar-btn"
            aria-label="الإشعارات"
            onClick={() => navigate('/notifications')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" strokeLinejoin="round" />
              <path d="M10 21a2 2 0 0 0 4 0" strokeLinecap="round" />
            </svg>
            {hasNotifications ? <span className="ym-topbar-bell-dot" aria-hidden="true" /> : null}
          </button>

          <button
            type="button"
            className="ym-topbar-btn"
            aria-label="فتح القائمة"
            onClick={onMenuClick || (() => navigate('/settings'))}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isHome ? (
          <nav className="ym-topbar-shortcuts" aria-label="اختصارات الصفحة الرئيسية">
            {HOME_SHORTCUTS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `ym-topbar-shortcut ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : <div className="ym-topbar-shortcuts-spacer" aria-hidden="true" />}

        <Link to="/" className="ym-topbar-brand" aria-label="الرئيسية - يام شات">
          <span className="ym-topbar-wordmark">YAMSHAT</span>
          <span className="ym-topbar-logo" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <defs>
                <linearGradient id="ym-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>
              <path
                d="M6 4 L16 18 L26 4 L21 4 L16 11 L11 4 Z M14 18 L18 18 L18 28 L14 28 Z"
                fill="url(#ym-logo-grad)"
              />
            </svg>
          </span>
        </Link>
      </div>
    </header>
  );
}

export default memo(MobileTopBar);
