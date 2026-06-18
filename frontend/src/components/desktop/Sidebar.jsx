import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo.jsx';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '🏠', label: 'الرئيسية' },
    { path: '/stories', icon: '📱', label: 'القصص' },
    { path: '/reels', icon: '🎬', label: 'الريلز' },
    { path: '/groups', icon: '👥', label: 'المجموعات' },
    { path: '/chat', icon: '💬', label: 'الرسائل' },
    { path: '/notifications', icon: '🔔', label: 'التنبيهات' },
    { path: '/profile', icon: '👤', label: 'الملف الشخصي' },
    { path: '/settings', icon: '⚙️', label: 'الإعدادات' },
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BrandLogo size={42} alt="Yamshat" className="desktop-sidebar-brand" />
        <h2 style={{ margin: 0 }}>YAMSHAT</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="item-icon">{item.icon}</span>
            <span className="item-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
