import { NavLink } from 'react-router-dom';

const dockLinks = [
  { to: '/', label: 'الرئيسية', icon: '⌂' },
  { to: '/stories', label: 'ستوري', icon: '◌' },
  { to: '/reels', label: 'ريلز', icon: '▣' },
  { to: '/inbox', label: 'الرسائل', icon: '✉' },
  { to: '/notifications', label: 'تنبيهات', icon: '🔔' },
  { to: '/profile', label: 'حسابي', icon: '◎' },
];

export default function MobileDock() {
  return (
    <nav className="mobile-dock" aria-label="التنقل السريع">
      <div className="mobile-dock-inner mobile-dock-grid-6">
        {dockLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `mobile-dock-link ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-dock-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
