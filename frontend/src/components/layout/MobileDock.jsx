import { Link, NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import { getUiText } from '../../utils/i18n.js';
import { getPrefetchHandlers } from '../../utils/navigation.js';

export default function MobileDock() {
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const ui = getUiText(language);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const dockLinks = [
    { to: '/', label: ui.nav.home, icon: '⌂', badge: 0 },
    { to: '/reels', label: ui.nav.reels, icon: '▣', badge: 0 },
    { to: '/live', label: ui.nav.live, icon: '◉', badge: isOnline ? 'live' : 0 },
    { to: '/inbox', label: ui.nav.inbox, icon: '✉', badge: unreadInboxCount },
  ];

  return (
    <nav className="mobile-dock mobile-dock-professional" aria-label={language === 'en' ? 'Quick navigation' : 'التنقل السريع'}>
      <div className="mobile-dock-inner mobile-dock-grid-5 mobile-dock-balanced-grid">
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
        @keyframes mobile-live-pulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.75; }
        }
      `}</style>
    </nav>
  );
}
