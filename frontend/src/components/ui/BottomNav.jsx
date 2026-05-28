import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

function BottomNav({ items = [], className = '' }) {
  const location = useLocation();

  if (!items.length) return null;

  return (
    <nav
      className={`ui-bottom-nav ${className}`.trim()}
      aria-label="التنقل السفلي"
      role="navigation"
    >
      {items.map((item) => {
        const isActive = typeof item.match === 'function'
          ? item.match(location.pathname)
          : location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`ui-bottom-nav-item ${isActive ? 'is-active' : ''}`.trim()}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="ui-bottom-nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="ui-bottom-nav-label">{item.label}</span>
            {item.badge === 'live' ? (
              <span className="mobile-live-dot" aria-hidden="true" />
            ) : item.badge ? (
              <strong className="ui-bottom-nav-badge" aria-label={`${item.badge} غير مقروء`}>
                {item.badge}
              </strong>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export default memo(BottomNav);
