import { memo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Avatar from './Avatar.jsx';

function TopBar({
  brand = { to: '/', label: 'YAMSHAT', icon: '👑' },
  navItems = [],
  mobileQuickLinks = null,
  trailingActions = null,
  account = null,
  className = '',
}) {
  const location = useLocation();

  return (
    <header className={`ui-topbar ${className}`.trim()} dir="rtl">
      <div className="ui-topbar-track">
        <Link to={brand.to} className="ui-topbar-brand" aria-label={brand.label}>
          <span className="ui-topbar-brand-mark" aria-hidden="true">{brand.icon}</span>
          <span className="ui-topbar-brand-copy">{brand.label}</span>
        </Link>

        <nav className="ui-topbar-nav" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const matched = typeof item.match === 'function' ? item.match(location.pathname) : false;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `ui-topbar-link ${(isActive || matched) ? 'is-active' : ''}`.trim()}
              >
                <span className="ui-topbar-link-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge ? <strong className="ui-topbar-link-badge">{item.badge}</strong> : null}
              </NavLink>
            );
          })}
        </nav>

        {/* الأزرار السريعة على الموبايل */}
        {mobileQuickLinks ? <div className="ui-topbar-mobile-section">{mobileQuickLinks}</div> : null}

        <div className="ui-topbar-actions">{trailingActions}</div>

        {account ? <div className="ui-topbar-account">{account}</div> : null}
      </div>
    </header>
  );
}

export function TopBarAccount({ name = 'Y', subtitle = '', avatarSrc = '', menu = null, onClick }) {
  return (
    <div className="ui-topbar-account-shell">
      <button type="button" className="ui-topbar-account-button" onClick={onClick}>
        <Avatar src={avatarSrc} name={name} size="sm" />
        <span className="ui-topbar-account-copy">
          <strong>{name}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
        </span>
        <span aria-hidden="true">▾</span>
      </button>
      {menu}
    </div>
  );
}

export default memo(TopBar);
