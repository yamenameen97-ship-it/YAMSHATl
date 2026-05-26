import { Link, useLocation } from 'react-router-dom';

export default function BottomNav({ items = [], className = '' }) {
  const location = useLocation();

  if (!items.length) return null;

  return (
    <nav className={`ui-bottom-nav ${className}`.trim()} aria-label="التنقل السفلي">
      {items.map((item) => {
        const isActive = typeof item.match === 'function'
          ? item.match(location.pathname)
          : location.pathname === item.to;
        return (
          <Link key={item.to} to={item.to} className={`ui-bottom-nav-item ${isActive ? 'is-active' : ''}`.trim()}>
            <span className="ui-bottom-nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="ui-bottom-nav-label">{item.label}</span>
            {item.badge ? <strong className="ui-bottom-nav-badge">{item.badge}</strong> : null}
          </Link>
        );
      })}
    </nav>
  );
}
