import { Link, NavLink } from 'react-router-dom';

const dockLinks = [
  { to: '/', label: 'الرئيسية', icon: '⌂' },
  { to: '/reels', label: 'ريلز', icon: '▣' },
  { to: '/live', label: 'مباشر', icon: '◉' },
  { to: '/inbox', label: 'الدردشة', icon: '✉' },
  { to: '/dashboard', label: 'القائمة', icon: '☰' },
];

export default function MobileDock() {
  return (
    <nav className="mobile-dock" aria-label="التنقل السريع">
      <div className="mobile-dock-inner mobile-dock-grid-5">
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

        <Link to="/?compose=1#composer" className="mobile-dock-link mobile-dock-center" aria-label="إنشاء منشور">
          <span className="mobile-dock-icon">＋</span>
          <span>نشر</span>
        </Link>

        {dockLinks.slice(2).map((link) => (
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
