import { Link, NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadNotificationsCount, useNotificationStore } from '../../store/notificationStore.js';
import { getUiText } from '../../utils/i18n.js';
import { getPrefetchHandlers } from '../../utils/navigation.js';

export default function MobileDock() {
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const ui = getUiText(language);
  const unreadNotifications = useNotificationStore(selectUnreadNotificationsCount);

  const dockLinks = [
    { to: '/', label: ui.nav.home, icon: '⌂' },
    { to: '/reels', label: ui.nav.reels, icon: '▣' },
    { to: '/live', label: ui.nav.live, icon: '◉', badge: isOnline ? 'live' : null },
    { to: '/groups', label: ui.nav.groups, icon: '◍', badge: unreadNotifications > 0 ? unreadNotifications : null },
  ];

  return (
    <nav className="mobile-dock mobile-dock-professional" aria-label={language === 'en' ? 'Quick navigation' : 'التنقل السريع'}>
      <div className="mobile-dock-inner mobile-dock-grid-5 mobile-dock-balanced-grid mobile-dock-reference-grid">
        {dockLinks.slice(0, 2).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `mobile-dock-link ${isActive ? 'active' : ''}`}
            {...getPrefetchHandlers(link.to)}
          >
            <span className="mobile-dock-icon">{link.icon}</span>
            <span>{link.label}</span>
            {typeof link.badge === 'number' && link.badge > 0 ? <strong className="topbar-badge">{link.badge}</strong> : null}
          </NavLink>
        ))}

        <Link to={{ pathname: '/', search: '?compose=1', hash: '#composer' }} className="mobile-dock-link mobile-dock-center" aria-label={ui.nav.publish} {...getPrefetchHandlers('/')}>
          <span className="mobile-dock-icon">＋</span>
          <span>{ui.nav.publish}</span>
        </Link>

        {dockLinks.slice(2).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `mobile-dock-link ${isActive ? 'active' : ''}`}
            {...getPrefetchHandlers(link.to)}
          >
            <span className="mobile-dock-icon">{link.icon}</span>
            <span>{link.label}</span>
            {link.badge === 'live' ? <span className="mobile-live-dot" aria-hidden="true" /> : null}
            {typeof link.badge === 'number' && link.badge > 0 ? <strong className="topbar-badge">{link.badge}</strong> : null}
          </NavLink>
        ))}
      </div>

      <style>{`
        .mobile-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 5px rgba(34,197,94,0.18);
          animation: mobile-live-pulse 1.6s infinite;
        }

        .mobile-dock-reference-grid .mobile-dock-link {
          position: relative;
          overflow: hidden;
        }

        .mobile-dock-reference-grid .mobile-dock-link::after {
          content: '';
          position: absolute;
          inset: auto 18% 8px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(139,92,246,0), rgba(139,92,246,0.85), rgba(6,182,212,0));
          opacity: 0;
          transition: opacity 180ms ease;
        }

        .mobile-dock-reference-grid .mobile-dock-link.active::after,
        .mobile-dock-reference-grid .mobile-dock-center::after {
          opacity: 1;
        }

        @keyframes mobile-live-pulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.75; }
        }
      `}</style>
    </nav>
  );
}
