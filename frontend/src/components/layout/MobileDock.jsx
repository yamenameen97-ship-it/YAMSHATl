import { Link, NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/chatStore.js';
import { getUiText } from '../../utils/i18n.js';

export default function MobileDock() {
  const language = useAppStore((state) => state.language);
  const ui = getUiText(language);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const dockLinks = [
    { to: '/', label: ui.nav.home, icon: '⌂' },
    { to: '/reels', label: ui.nav.reels, icon: '▣' },
    { to: '/live', label: ui.nav.live, icon: '◉' },
    { to: '/inbox', label: ui.nav.inbox, icon: '✉' },
    { to: '/dashboard', label: ui.nav.dashboard, icon: '☰' },
  ];

  return (
    <nav className="mobile-dock mobile-dock-professional" aria-label={language === 'en' ? 'Quick navigation' : 'التنقل السريع'}>
      <div className="mobile-dock-inner mobile-dock-grid-5 mobile-dock-balanced-grid">
        {dockLinks.slice(0, 2).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `mobile-dock-link ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-dock-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}

        <Link to="/?compose=1#composer" className="mobile-dock-link mobile-dock-center" aria-label={ui.nav.publish}>
          <span className="mobile-dock-icon">＋</span>
          <span>{ui.nav.publish}</span>
        </Link>

        {dockLinks.slice(2).map((link) => {
          const badge = link.to === '/inbox' ? unreadInboxCount : 0;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mobile-dock-link ${isActive ? 'active' : ''}`}
            >
              <span className="mobile-dock-icon">{link.icon}</span>
              <span>{link.label}</span>
              {badge > 0 ? <strong className="topbar-badge">{badge}</strong> : null}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
