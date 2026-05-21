/**
 * Enhanced Mobile Dock Component
 * Bottom navigation for mobile devices
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MobileDockEnhanced() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/', icon: '🏠', label: 'الرئيسية' },
    { path: '/reels', icon: '🎬', label: 'الريلز' },
    { path: '/chat', icon: '💬', label: 'الرسائل' },
    { path: '/notifications', icon: '🔔', label: 'الإشعارات' },
    { path: '/profile', icon: '👤', label: 'الملف' },
  ];

  return (
    <nav className="mobile-dock">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`dock-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          title={item.label}
        >
          <span className="dock-icon">{item.icon}</span>
          <span className="dock-label">{item.label}</span>
        </button>
      ))}

      <button
        className={`dock-item menu ${showMenu ? 'active' : ''}`}
        onClick={() => setShowMenu(!showMenu)}
        title="More options"
      >
        <span className="dock-icon">⋯</span>
        <span className="dock-label">المزيد</span>
      </button>

      {showMenu && (
        <div className="dock-menu">
          <button className="dock-menu-item">
            <span>⚙️</span>
            <span>الإعدادات</span>
          </button>
          <button className="dock-menu-item">
            <span>🌙</span>
            <span>المظهر</span>
          </button>
          <button className="dock-menu-item">
            <span>🔒</span>
            <span>الخصوصية</span>
          </button>
          <button className="dock-menu-item logout">
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ==================== MOBILE DOCK ==================== */

          .mobile-dock {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: var(--mobile-nav-height);
            background-color: var(--color-surface-primary);
            border-top: 1px solid var(--color-border-secondary);
            display: flex;
            justify-content: space-around;
            align-items: center;
            z-index: var(--z-fixed);
            backdrop-filter: var(--backdrop-blur-sm);
            box-shadow: var(--shadow-lg);
          }

          /* ==================== DOCK ITEMS ==================== */

          .dock-item {
            flex: 1;
            height: 100%;
            border: none;
            background-color: transparent;
            color: var(--color-text-secondary);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-1);
            transition: var(--transition-colors);
            position: relative;
            font-family: var(--font-family-primary);
          }

          .dock-item:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .dock-item.active {
            background-color: var(--color-interactive-active);
            color: var(--color-primary-500);
          }

          .dock-icon {
            font-size: var(--font-size-lg);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dock-label {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }

          /* ==================== DOCK MENU ==================== */

          .dock-menu {
            position: absolute;
            bottom: 100%;
            right: 0;
            background-color: var(--color-surface-primary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            display: flex;
            flex-direction: column;
            min-width: 200px;
            z-index: var(--z-modal);
            animation: slideInUp var(--duration-fast) var(--ease-out);
            margin-right: var(--spacing-2);
            margin-bottom: var(--spacing-2);
          }

          .dock-menu-item {
            padding: var(--spacing-3) var(--spacing-4);
            border: none;
            background-color: transparent;
            color: var(--color-text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: var(--spacing-3);
            font-size: var(--font-size-sm);
            transition: var(--transition-colors);
            font-family: var(--font-family-primary);
            text-align: right;
          }

          .dock-menu-item:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .dock-menu-item:first-child {
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          }

          .dock-menu-item:last-child {
            border-radius: 0 0 var(--radius-lg) var(--radius-lg);
          }

          .dock-menu-item.logout {
            color: var(--color-error);
            border-top: 1px solid var(--color-border-secondary);
          }

          .dock-menu-item.logout:hover {
            background-color: rgba(239, 68, 68, 0.1);
          }

          /* ==================== ANIMATIONS ==================== */

          @keyframes slideInUp {
            from {
              transform: translateY(10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          /* ==================== RESPONSIVE ==================== */

          @media (min-width: 769px) {
            .mobile-dock {
              display: none;
            }
          }

          @media (max-width: 480px) {
            .dock-label {
              font-size: var(--font-size-2xs);
            }

            .dock-icon {
              font-size: var(--font-size-base);
            }
          }
        `
      }} />
    </nav>
  );
}
