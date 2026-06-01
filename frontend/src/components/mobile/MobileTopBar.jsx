import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * MobileTopBar
 * شريط علوي للموبايل مطابق للتصميم المرجعي:
 * - زر قائمة على اليسار (LTR) / اليمين (RTL)
 * - لوغو YAMSHAT في الوسط
 * - زر إشعارات مع نقطة بنفسجية
 */
function MobileTopBar({ onMenuClick, hasNotifications = true }) {
  const navigate = useNavigate();

  return (
    <header className="ym-topbar" role="banner">
      <div className="ym-topbar-inner">
        <button
          type="button"
          className="ym-topbar-btn"
          aria-label="فتح القائمة"
          onClick={onMenuClick || (() => navigate('/settings'))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>

        <Link to="/" className="ym-topbar-brand" aria-label="الرئيسية - يمشات">
          <span className="ym-topbar-logo" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <defs>
                <linearGradient id="ym-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>
              <path
                d="M6 4 L16 18 L26 4 L21 4 L16 11 L11 4 Z M14 18 L18 18 L18 28 L14 28 Z"
                fill="url(#ym-logo-grad)"
              />
            </svg>
          </span>
          <span className="ym-topbar-wordmark">YAMSHAT</span>
        </Link>

        <button
          type="button"
          className="ym-topbar-btn"
          aria-label="الإشعارات"
          onClick={() => navigate('/notifications')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" strokeLinejoin="round" />
            <path d="M10 21a2 2 0 0 0 4 0" strokeLinecap="round" />
          </svg>
          {hasNotifications ? <span className="ym-topbar-bell-dot" aria-hidden="true" /> : null}
        </button>
      </div>
    </header>
  );
}

export default memo(MobileTopBar);
