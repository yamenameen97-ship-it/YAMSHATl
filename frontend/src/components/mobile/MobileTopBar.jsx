import { memo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { logoutUser } from '../../api/auth.js';
import { clearStoredUser } from '../../utils/auth.js';
import YamServicesMenu from '../ui/YamServicesMenu.jsx';

/**
 * MobileTopBar
 * ------------
 * الهيدر العلوي الموحّد. تم إضافة قائمة خدمات منسدلة/جانبية تظهر
 * عند الضغط على زر القائمة أو على شعار المنصة، كما هو مطلوب.
 */
function MobileTopBar({ onMenuClick }) {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = useCallback(() => {
    if (typeof onMenuClick === 'function') {
      onMenuClick();
      return;
    }
    setMenuOpen(true);
  }, [onMenuClick]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // نتجاهل فشل الشبكة وننهي الجلسة محليًا
    }
    clearStoredUser();
    closeMenu();
    navigate('/login', { replace: true });
  }, [closeMenu, navigate]);

  return (
    <>
      <header className="ym-topbar fixed-top" role="banner">
        <div className="ym-topbar-inner">
          <div className="ym-topbar-left">
            <button
              type="button"
              className="ym-topbar-btn ym-topbar-menu-btn"
              aria-label="القائمة"
              onClick={openMenu}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <button type="button" className="ym-topbar-brand" aria-label="قائمة المنصة" onClick={openMenu}>
            <div className="ym-brand-container">
              <svg className="ym-logo-v" viewBox="0 0 100 100" width="32" height="32" aria-hidden="true">
                <defs>
                  <linearGradient id="ym-y-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <path d="M20 20 L50 60 L80 20 L70 20 L50 45 L30 20 Z" fill="url(#ym-y-grad)" />
                <path d="M45 60 L55 60 L55 85 L45 85 Z" fill="url(#ym-y-grad)" />
              </svg>
              <span className="ym-wordmark">YAMSHAT</span>
            </div>
          </button>

          <div className="ym-topbar-right">
            <button
              type="button"
              className="ym-topbar-btn"
              aria-label="الإشعارات"
              onClick={() => navigate('/notifications')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <button
              type="button"
              className="ym-topbar-btn"
              aria-label="البث المباشر"
              onClick={() => navigate('/live/control')}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="2" />
                <path d="M16.24 7.76a6 6 0 0 1 0 8.48m-8.48 0a6 6 0 0 1 0-8.48m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
              </svg>
            </button>

            <Link to="/profile" className="ym-topbar-profile-link" aria-label="الملف الشخصي">
              <div className="ym-topbar-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" />
                ) : (
                  <div className="ym-avatar-placeholder">Y</div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <YamServicesMenu open={menuOpen} onClose={closeMenu} onLogout={handleLogout} brandLabel="Yamshat" />

      <style>{`
        .ym-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background-color: #0A0D1A;
          border-bottom: 1px solid #1F2937;
          z-index: 1000;
          display: flex;
          align-items: center;
          padding: 0 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        }
        .ym-topbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .ym-topbar-right, .ym-topbar-left {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .ym-topbar-btn {
          background: none;
          border: none;
          color: #D1D5DB;
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
        }
        .ym-topbar-btn:hover,
        .ym-topbar-menu-btn:hover {
          background: rgba(139, 92, 246, 0.12);
          color: #C4B5FD;
          box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.12);
        }
        .ym-topbar-brand {
          text-decoration: none;
          display: inline-flex;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
        }
        .ym-brand-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ym-wordmark {
          color: #FFFFFF;
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: 2px;
        }
        @media (min-width: 1024px) {
          .ym-wordmark { font-size: 1.35rem; }
        }
        .ym-topbar-profile-link { display: inline-flex; }
        .ym-topbar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid #8B5CF6;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1F2937;
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.35);
        }
        .ym-topbar-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ym-avatar-placeholder {
          color: #8B5CF6;
          font-weight: 800;
          font-size: 1rem;
          line-height: 1;
        }
      `}</style>
    </>
  );
}

export default memo(MobileTopBar);
