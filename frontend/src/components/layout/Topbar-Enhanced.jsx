/**
 * Enhanced Topbar Component
 * Professional header with search, notifications, and user menu
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopbarEnhanced({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Handle search focus
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="header-enhanced">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          ☰
        </button>

        <div className="header-logo">
          <span className="logo-icon">💬</span>
          <span className="logo-text">Yamshat</span>
        </div>
      </div>

      <div className="header-center">
        <form className="header-search-form" onSubmit={handleSearch}>
          <div className={`header-search ${searchOpen ? 'active' : ''}`}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ابحث عن أشخاص أو محادثات..."
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
            />
            <span className="header-search-icon">🔍</span>
          </div>
        </form>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="header-action-group" ref={notificationsRef}>
          <button
            className={`header-icon-btn ${notificationsOpen ? 'active' : ''}`}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
            title="Notifications"
          >
            🔔
            <span className="header-badge">3</span>
          </button>

          {notificationsOpen && (
            <div className="header-dropdown notifications-dropdown">
              <div className="dropdown-header">
                <h3>الإشعارات</h3>
              </div>
              <div className="dropdown-content">
                <div className="notification-item unread">
                  <div className="notification-avatar">👤</div>
                  <div className="notification-content">
                    <p className="notification-text">
                      <strong>أحمد</strong> أضاف لك كصديق
                    </p>
                    <span className="notification-time">منذ 5 دقائق</span>
                  </div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-avatar">❤️</div>
                  <div className="notification-content">
                    <p className="notification-text">
                      <strong>فاطمة</strong> أعجبت برسالتك
                    </p>
                    <span className="notification-time">منذ ساعة</span>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-avatar">💬</div>
                  <div className="notification-content">
                    <p className="notification-text">
                      <strong>محمد</strong> رد على رسالتك
                    </p>
                    <span className="notification-time">منذ ساعتين</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-footer">
                <button className="dropdown-footer-btn">عرض الكل</button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <button
          className="header-icon-btn"
          onClick={() => navigate('/chat')}
          aria-label="Messages"
          title="Messages"
        >
          ✉️
          <span className="header-badge">2</span>
        </button>

        {/* User Menu */}
        <div className="header-action-group" ref={userMenuRef}>
          <button
            className={`header-icon-btn user-btn ${userMenuOpen ? 'active' : ''}`}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
            title="User menu"
          >
            <span className="user-avatar">👤</span>
          </button>

          {userMenuOpen && (
            <div className="header-dropdown user-dropdown">
              <div className="dropdown-header">
                <div className="user-info">
                  <div className="user-avatar-large">👤</div>
                  <div>
                    <p className="user-name">أحمد محمد</p>
                    <p className="user-handle">@ahmadmohammad</p>
                  </div>
                </div>
              </div>
              <div className="dropdown-content">
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">👤</span>
                  <span>الملف الشخصي</span>
                </button>
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">⚙️</span>
                  <span>الإعدادات</span>
                </button>
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">🌙</span>
                  <span>المظهر</span>
                </button>
                <button className="dropdown-item">
                  <span className="dropdown-item-icon">🔒</span>
                  <span>الخصوصية والأمان</span>
                </button>
              </div>
              <div className="dropdown-footer">
                <button className="dropdown-footer-btn logout">تسجيل الخروج</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ==================== HEADER ==================== */

          .header-enhanced {
            height: var(--header-height);
            background-color: var(--color-surface-primary);
            border-bottom: 1px solid var(--color-border-secondary);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 var(--spacing-4);
            position: sticky;
            top: 0;
            z-index: var(--z-sticky);
            backdrop-filter: var(--backdrop-blur-sm);
            box-shadow: var(--shadow-sm);
            gap: var(--spacing-6);
          }

          /* ==================== HEADER LEFT ==================== */

          .header-left {
            display: flex;
            align-items: center;
            gap: var(--spacing-3);
            flex-shrink: 0;
          }

          .header-menu-btn {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-lg);
            background-color: transparent;
            border: none;
            color: var(--color-text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            transition: var(--transition-colors);
          }

          .header-menu-btn:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .header-logo {
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            cursor: pointer;
            transition: var(--transition-colors);
          }

          .header-logo:hover {
            color: var(--color-primary-500);
          }

          .logo-icon {
            font-size: var(--font-size-2xl);
          }

          .logo-text {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-bold);
            color: var(--color-primary-500);
            display: none;
          }

          @media (min-width: 768px) {
            .logo-text {
              display: inline;
            }
          }

          /* ==================== HEADER CENTER ==================== */

          .header-center {
            flex: 1;
            max-width: 400px;
            display: flex;
            justify-content: center;
          }

          .header-search-form {
            width: 100%;
          }

          .header-search {
            position: relative;
            width: 100%;
            transition: var(--transition-colors);
          }

          .header-search.active {
            background-color: var(--color-surface-secondary);
            border-radius: var(--radius-full);
          }

          .header-search-input {
            width: 100%;
            height: 40px;
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-full);
            padding: 0 var(--spacing-4) 0 var(--spacing-10);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            font-family: var(--font-family-primary);
            transition: var(--transition-colors);
          }

          .header-search-input:focus {
            outline: none;
            border-color: var(--color-primary-500);
            background-color: var(--color-surface-secondary);
            box-shadow: 0 0 0 3px var(--color-interactive-focus);
          }

          .header-search-input::placeholder {
            color: var(--color-text-muted);
          }

          .header-search-icon {
            position: absolute;
            left: var(--spacing-3);
            top: 50%;
            transform: translateY(-50%);
            font-size: var(--font-size-base);
            pointer-events: none;
          }

          /* ==================== HEADER RIGHT ==================== */

          .header-right {
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            flex-shrink: 0;
          }

          .header-action-group {
            position: relative;
          }

          .header-icon-btn {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-lg);
            background-color: transparent;
            border: none;
            color: var(--color-text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            transition: var(--transition-colors);
            position: relative;
          }

          .header-icon-btn:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .header-icon-btn.active {
            background-color: var(--color-interactive-active);
            color: var(--color-primary-500);
          }

          .header-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 20px;
            height: 20px;
            background-color: var(--color-error);
            color: white;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-bold);
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-base);
          }

          /* ==================== DROPDOWN ==================== */

          .header-dropdown {
            position: absolute;
            top: calc(100% + var(--spacing-2));
            right: 0;
            width: 320px;
            background-color: var(--color-surface-primary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: var(--z-dropdown);
            animation: slideInDown var(--duration-fast) var(--ease-out);
          }

          .dropdown-header {
            padding: var(--spacing-4);
            border-bottom: 1px solid var(--color-border-secondary);
          }

          .dropdown-header h3 {
            font-size: var(--font-size-base);
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            margin: 0;
          }

          .dropdown-content {
            max-height: 300px;
            overflow-y: auto;
          }

          .notification-item {
            display: flex;
            gap: var(--spacing-3);
            padding: var(--spacing-3);
            border-bottom: 1px solid var(--color-border-secondary);
            cursor: pointer;
            transition: var(--transition-colors);
          }

          .notification-item:hover {
            background-color: var(--color-interactive-hover);
          }

          .notification-item.unread {
            background-color: var(--color-interactive-active);
          }

          .notification-avatar {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            flex-shrink: 0;
          }

          .notification-content {
            flex: 1;
            min-width: 0;
          }

          .notification-text {
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            margin: 0 0 var(--spacing-1) 0;
            line-height: var(--line-height-snug);
          }

          .notification-time {
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          }

          .user-info {
            display: flex;
            gap: var(--spacing-3);
            align-items: center;
          }

          .user-avatar-large {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-2xl);
          }

          .user-name {
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            margin: 0;
          }

          .user-handle {
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
            margin: 0;
          }

          .dropdown-item {
            width: 100%;
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
            text-align: right;
          }

          .dropdown-item:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .dropdown-item-icon {
            font-size: var(--font-size-lg);
            width: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dropdown-footer {
            padding: var(--spacing-3);
            border-top: 1px solid var(--color-border-secondary);
          }

          .dropdown-footer-btn {
            width: 100%;
            padding: var(--spacing-2) var(--spacing-4);
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-primary);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            transition: var(--transition-colors);
          }

          .dropdown-footer-btn:hover {
            background-color: var(--color-interactive-hover);
            border-color: var(--color-primary-500);
            color: var(--color-primary-500);
          }

          .dropdown-footer-btn.logout {
            background-color: rgba(239, 68, 68, 0.1);
            border-color: var(--color-error);
            color: var(--color-error);
          }

          .dropdown-footer-btn.logout:hover {
            background-color: var(--color-error);
            color: white;
          }

          /* ==================== ANIMATIONS ==================== */

          @keyframes slideInDown {
            from {
              transform: translateY(-10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          /* ==================== RESPONSIVE ==================== */

          @media (max-width: 768px) {
            .header-enhanced {
              height: var(--header-height-mobile);
              padding: 0 var(--spacing-3);
              gap: var(--spacing-3);
            }

            .header-center {
              display: none;
            }

            .header-dropdown {
              width: 280px;
            }

            .logo-text {
              display: none;
            }
          }
        `
      }} />
    </header>
  );
}
