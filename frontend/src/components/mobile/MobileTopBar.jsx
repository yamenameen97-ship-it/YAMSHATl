import { memo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { logoutUser } from '../../api/auth.js';
import { clearStoredUser } from '../../utils/auth.js';
import YamServicesMenu from '../ui/YamServicesMenu.jsx';

/**
 * MobileTopBar (v47.2 — mobile web layout swap)
 * ---------------------------------------------
 * إعادة ترتيب الهيدر للويب الجوال ليطابق التصميم المعلّم بالأسهم:
 * - أقصى اليمين (RTL start): شعار Y + كلمة YAMSHAT (مكان زر القائمة سابقاً)
 * - المنتصف: جرس الإشعارات + رمز الستوري + رمز المجموعات
 * - أقصى اليسار (RTL end): الصورة الشخصية + زر القائمة (☰)
 * - تم الحفاظ على كل المنطق الأصلي (RTL، خطوط Noto Sans Arabic، استجابة الشاشات
 *   الصغيرة Redmi Note 8 ≈ 360px) دون أي تعديل على الصفحات الأخرى.
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
          {/* === أقصى اليمين (RTL start): شعار Y + كلمة YAMSHAT === */}
          <div className="ym-topbar-side ym-topbar-side-start">
            <button
              type="button"
              className="ym-topbar-brand"
              aria-label="الصفحة الرئيسية"
              onClick={() => navigate('/')}
            >
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
            </button>
          </div>

          {/* === المنتصف: جرس + ستوري + مجموعات === */}
          <div className="ym-topbar-center">
            {/* جرس الإشعارات */}
            <button
              type="button"
              className="ym-topbar-btn"
              aria-label="الإشعارات"
              title="الإشعارات"
              onClick={() => navigate('/notifications')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* رمز الستوري */}
            <button
              type="button"
              className="ym-topbar-btn ym-topbar-btn-story"
              aria-label="الستوري"
              title="الستوري"
              onClick={() => navigate('/stories')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
                <circle cx="12" cy="12" r="3.6" />
              </svg>
            </button>

            {/* رمز المجموعات */}
            <button
              type="button"
              className="ym-topbar-btn ym-topbar-btn-groups"
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
            </button>
          </div>

          {/* === أقصى اليسار (RTL end): الصورة الشخصية + زر القائمة (☰) === */}
          <div className="ym-topbar-side ym-topbar-side-end">
            {/* الصورة الشخصية */}
            <Link to="/profile" className="ym-topbar-profile-link" aria-label="الملف الشخصي">
              <div className="ym-topbar-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" />
                ) : (
                  <svg viewBox="0 0 100 100" width="18" height="18" aria-hidden="true">
                    <path d="M20 20 L50 60 L80 20 L70 20 L50 45 L30 20 Z" fill="#8B5CF6" />
                    <path d="M45 60 L55 60 L55 85 L45 85 Z" fill="#8B5CF6" />
                  </svg>
                )}
              </div>
            </Link>

            {/* زر القائمة (☰) — أصبح في الجهة المقابلة */}
            <button
              type="button"
              className="ym-topbar-btn ym-topbar-menu-btn"
              aria-label="القائمة"
              onClick={openMenu}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
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
          height: 56px;
          background-color: #0A0D1A;
          border-bottom: 1px solid #1F2937;
          z-index: 1000;
          display: flex;
          align-items: center;
          padding: 0 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
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
        .ym-topbar.ym-topbar-transparent .ym-wordmark {
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
          max-width: 600px;
          margin: 0 auto;
          gap: 4px;
        }
        .ym-topbar-side {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .ym-topbar-side-end {
          gap: 4px;
        }
        .ym-topbar-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1 1 auto;
          min-width: 0;
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
        .ym-topbar-btn:active { transform: scale(0.94); }
        .ym-topbar-brand {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px 8px;
          color: #fff;
          flex-shrink: 1;
          min-width: 0;
        }
        .ym-wordmark {
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.85rem;
          letter-spacing: 1.5px;
          white-space: nowrap;
        }
        .ym-topbar-profile-link {
          display: inline-flex;
          margin-inline-start: 2px;
        }
        .ym-topbar-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1.5px solid #8B5CF6;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #14172a;
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.35);
        }
        .ym-topbar-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        /* ====== استجابة للشاشات الصغيرة (Redmi Note 8 ≈ 360px) ====== */
        @media (max-width: 400px) {
          .ym-topbar { padding: 0 6px; height: 54px; }
          .ym-topbar-inner { gap: 2px; }
          .ym-topbar-side-end { gap: 2px; }
          .ym-topbar-center { gap: 2px; }
          .ym-topbar-btn { padding: 5px; }
          .ym-topbar-btn svg { width: 18px; height: 18px; }
          .ym-wordmark { font-size: 0.78rem; letter-spacing: 1.1px; }
          .ym-topbar-brand { padding: 4px 4px; gap: 4px; }
          .ym-topbar-brand .ym-logo-v { width: 18px; height: 18px; }
          .ym-topbar-avatar { width: 28px; height: 28px; }
        }
        @media (max-width: 340px) {
          .ym-wordmark { font-size: 0.7rem; letter-spacing: 0.8px; }
          .ym-topbar-btn { padding: 4px; }
        }
        @media (min-width: 1024px) {
          .ym-wordmark { font-size: 0.95rem; }
        }
      `}</style>
    </>
  );
}

export default memo(MobileTopBar);
