import { memo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { logoutUser } from '../../api/auth.js';
import { clearStoredUser } from '../../utils/auth.js';
import YamServicesMenu from '../ui/YamServicesMenu.jsx';

/**
 * MobileTopBar (v28)
 * ------------------
 * - الهيدر العلوي الموحّد المثبّت في كل صفحات التطبيق (dir=rtl).
 * - تم تصغير شعار "YAMSHAT" وإزاحته إلى أقصى اليمين بجوار زر القائمة.
 * - أضِيف زرّان جديدان داخل الهيدر العلوي على جميع الصفحات:
 *     1) زر "الستوري"      → ينتقل إلى /stories
 *     2) زر "المجموعات"     → ينتقل إلى /groups
 * - الخط الافتراضي: Noto Sans Arabic / Tajawal.
 */
function MobileTopBar({ onMenuClick, transparent = false }) {
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
      // نتجاهل فشل الشبكة وننهي الجلسة محلياً
    }
    clearStoredUser();
    closeMenu();
    navigate('/login', { replace: true });
  }, [closeMenu, navigate]);

  return (
    <>
      <header
        className={`ym-topbar fixed-top ${transparent ? 'ym-topbar-transparent' : ''}`}
        role="banner"
        dir="rtl"
        style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      >
        <div className="ym-topbar-inner">
          {/* أقصى اليمين: زر القائمة + شعار YAMSHAT مصغّر ومُزاح لليمين */}
          <div className="ym-topbar-right-cluster">
            <button
              type="button"
              className="ym-topbar-btn ym-topbar-menu-btn"
              aria-label="القائمة"
              onClick={openMenu}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>

            <button type="button" className="ym-topbar-brand" aria-label="قائمة المنصة" onClick={openMenu}>
              <div className="ym-brand-container">
                <svg className="ym-logo-v" viewBox="0 0 100 100" width="22" height="22" aria-hidden="true">
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
          </div>

          {/* وسط الهيدر: أزرار الوصول السريع (ستوري + مجموعات) — تظهر في كل الصفحات */}
          <div className="ym-topbar-center">
            <button
              type="button"
              className="ym-quick-btn"
              aria-label="الستوري"
              title="الستوري"
              onClick={() => navigate('/stories')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span>ستوري</span>
            </button>

            <button
              type="button"
              className="ym-quick-btn"
              aria-label="المجموعات"
              title="المجموعات"
              onClick={() => navigate('/groups')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="9" r="3" />
                <circle cx="17" cy="10" r="2.4" />
                <path d="M3 19c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5" strokeLinecap="round" />
                <path d="M15 19c.4-2 2-3.2 3.7-3.2 1 0 2 .35 2.7 1" strokeLinecap="round" />
              </svg>
              <span>مجموعات</span>
            </button>
          </div>

          {/* أقصى اليسار: الإشعارات + الصورة الشخصية */}
          <div className="ym-topbar-left">
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
          padding: 0 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          /* تثبيت كامل بدون أي transform يكسر position:fixed */
          transform: none !important;
          will-change: auto;
          backface-visibility: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        }
        .ym-topbar.ym-topbar-transparent {
          background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%);
          border-bottom: none;
          box-shadow: none;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }
        .ym-topbar.ym-topbar-transparent .ym-topbar-btn,
        .ym-topbar.ym-topbar-transparent .ym-wordmark,
        .ym-topbar.ym-topbar-transparent .ym-quick-btn {
          color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .ym-topbar.ym-topbar-transparent .ym-topbar-avatar {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.35), 0 0 10px rgba(0,0,0,0.55);
        }
        .ym-topbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          gap: 6px;
        }
        .ym-topbar-right-cluster {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .ym-topbar-center {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          justify-content: center;
          min-width: 0;
        }
        .ym-topbar-left {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
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
        }
        .ym-topbar-brand {
          text-decoration: none;
          display: inline-flex;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0 4px;
        }
        .ym-brand-container {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .ym-wordmark {
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.78rem;        /* تصغير الكلمة */
          letter-spacing: 1.2px;
        }
        @media (min-width: 1024px) {
          .ym-wordmark { font-size: 0.9rem; }
        }
        /* أزرار الوصول السريع (ستوري + مجموعات) */
        .ym-quick-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.18);
          color: #D8C8FF;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, color 0.15s, transform 0.12s;
          white-space: nowrap;
        }
        .ym-quick-btn:hover {
          background: rgba(139, 92, 246, 0.22);
          color: #EFE6FF;
          transform: translateY(-1px);
        }
        .ym-quick-btn:active { transform: scale(0.96); }
        .ym-quick-btn svg { flex-shrink: 0; }
        @media (max-width: 360px) {
          .ym-quick-btn span { display: none; }
          .ym-quick-btn { padding: 6px 8px; }
        }
        .ym-topbar-profile-link { display: inline-flex; }
        .ym-topbar-avatar {
          width: 32px;
          height: 32px;
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
          font-size: 0.95rem;
          line-height: 1;
        }
      `}</style>
    </>
  );
}

export default memo(MobileTopBar);
