import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Feed', icon: '🏠' },
  { to: '/live', label: 'Live', icon: '🔴' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/inbox', label: 'Inbox', icon: '📥' },
  { to: '/users', label: 'Users', icon: '🫂' },
  { to: '/stories', label: 'Stories', icon: '📸' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand-mark">Y</div>
        <h1 className="brand-title">YAMSHAT</h1>
        <p className="brand-subtitle">Feed احترافي، تفاعل لحظي، إشعارات، متابعة، وبث مباشر.</p>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="glass-chip">Realtime Feed</div>
        <div className="glass-chip">Socket + LiveKit</div>
      </div>
    </aside>
  );
}
