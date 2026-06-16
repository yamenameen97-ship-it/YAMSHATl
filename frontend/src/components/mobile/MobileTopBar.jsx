import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { logoutUser } from '../../api/auth.js';
import { clearStoredUser } from '../../utils/auth.js';
import YamServicesMenu from '../ui/YamServicesMenu.jsx';

/**
 * MobileTopBar (v47.3 — pixel-perfect mobile web layout)
 * ------------------------------------------------------
 * مطابقة كاملة للصورة المرجعية للويب الجوال:
 * - RTL start (أقصى اليمين): شعار Y + كلمة YAMSHAT
 * - الوسط (RTL): جرس إشعارات | رمز المجموعات + نص "المجموعات" | رمز ستوري + نص "ستوري"
 * - RTL end (أقصى اليسار): زر القائمة ☰
 * - تم الحفاظ على التوافق مع الشاشات الصغيرة (Redmi Note 8 ≈ 360px) والقديمة
 *   باستخدام clamp() و media queries متدرجة (400px / 360px / 320px).
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

  // إخفاء الصورة الشخصية إذا لم تكن متاحة (مطابقة للصورة المرجعية التي لا تُظهرها في الهيدر)
  const _avatarHasImage = Boolean(user?.avatar);

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
              <svg className="ym-logo-v" viewBox="0 0 100 100" aria-hidden="true">
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

          {/* === الوسط (RTL): جرس | المجموعات | ستوري === */}
          <div className="ym-topbar-center">
            {/* جرس الإشعارات */}
            <button
              type="button"
              className="ym-topbar-btn ym-topbar-bell"
              aria-label="الإشعارات"
              title="الإشعارات"
              onClick={() => navigate('/notifications')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* المجموعات (أيقونة + نص) */}
            <button
              type="button"
              className="ym-topbar-link ym-topbar-link-groups"
              aria-label="المجموعات"
              onClick={() => navigate('/groups')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8.5" r="3" />
                <circle cx="17" cy="9.5" r="2.2" />
                <path d="M3 19c1-3.2 3.5-4.8 6-4.8s5 1.6 6 4.8" />
                <path d="M15 19c.5-2 2-3.2 3.6-3.2 1 0 1.9.3 2.6.9" />
              </svg>
              <span className="ym-topbar-link-text">المجموعات</span>
            </button>

            {/* ستوري (دائرة + داخلها +) */}
            <button
              type="button"
              className="ym-topbar-link ym-topbar-link-story"
              aria-label="ستوري"
              onClick={() => navigate('/stories')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="ym-topbar-link-text">ستوري</span>
            </button>
          </div>

          {/* === أقصى اليسار (RTL end): زر القائمة ☰ === */}
          <div className="ym-topbar-side ym-topbar-side-end">
            <button
              type="button"
              className="ym-topbar-btn ym-topbar-menu-btn"
              aria-label="القائمة"
              onClick={openMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
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
          box-sizing: border-box;
        }
        .ym-topbar.ym-topbar-transparent {
          background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%);
          border-bottom: none;
          box-shadow: none;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }
        .ym-topbar.ym-topbar-transparent .ym-topbar-btn,
        .ym-topbar.ym-topbar-transparent .ym-topbar-link,
        .ym-topbar.ym-topbar-transparent .ym-wordmark {
          color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .ym-topbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          gap: 4px;
          height: 100%;
        }
        .ym-topbar-side {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .ym-topbar-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(4px, 1.8vw, 10px);
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
        }
        .ym-topbar-btn {
          background: none;
          border: none;
          color: #E5E7EB;
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .ym-topbar-btn svg {
          width: 22px;
          height: 22px;
        }
        .ym-topbar-btn:hover { background: rgba(139, 92, 246, 0.12); color: #C4B5FD; }
        .ym-topbar-btn:active { transform: scale(0.94); }

        /* رابط (أيقونة + نص) في الوسط */
        .ym-topbar-link {
          background: none;
          border: none;
          color: #E5E7EB;
          padding: 4px 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 1;
          min-width: 0;
        }
        .ym-topbar-link svg {
          width: 20px;
          height: 20px;
          color: #A78BFA;
          flex-shrink: 0;
        }
        .ym-topbar-link-text {
          font-size: 0.78rem;
          font-weight: 600;
          color: #E5E7EB;
          white-space: nowrap;
        }
        .ym-topbar-link:hover { background: rgba(139, 92, 246, 0.12); }
        .ym-topbar-link:active { transform: scale(0.96); }

        .ym-topbar-brand {
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px 4px;
          color: #fff;
          flex-shrink: 1;
          min-width: 0;
        }
        .ym-logo-v {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }
        .ym-wordmark {
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.88rem;
          letter-spacing: 1.4px;
          white-space: nowrap;
        }

        /* ====== استجابة للشاشات الصغيرة ====== */
        /* الجوالات المتوسطة (Redmi Note 8 ≈ 393px) */
        @media (max-width: 400px) {
          .ym-topbar { padding: 0 6px; height: 54px; }
          .ym-topbar-inner { gap: 2px; }
          .ym-topbar-center { gap: 4px; }
          .ym-topbar-btn { padding: 4px; }
          .ym-topbar-btn svg { width: 20px; height: 20px; }
          .ym-topbar-link { padding: 3px 3px; gap: 3px; }
          .ym-topbar-link svg { width: 18px; height: 18px; }
          .ym-topbar-link-text { font-size: 0.72rem; }
          .ym-wordmark { font-size: 0.78rem; letter-spacing: 1.1px; }
          .ym-logo-v { width: 20px; height: 20px; }
        }
        /* جوالات قديمة صغيرة جداً */
        @media (max-width: 360px) {
          .ym-topbar { padding: 0 4px; height: 52px; }
          .ym-topbar-center { gap: 2px; }
          .ym-topbar-btn { padding: 3px; }
          .ym-topbar-btn svg { width: 18px; height: 18px; }
          .ym-topbar-link svg { width: 17px; height: 17px; }
          .ym-topbar-link-text { font-size: 0.68rem; }
          .ym-wordmark { font-size: 0.72rem; letter-spacing: 0.9px; }
          .ym-logo-v { width: 18px; height: 18px; }
          .ym-topbar-brand { gap: 4px; padding: 3px 2px; }
        }
        @media (max-width: 320px) {
          .ym-topbar-link-text { font-size: 0.64rem; }
          .ym-wordmark { font-size: 0.66rem; letter-spacing: 0.6px; }
          .ym-topbar-btn svg { width: 17px; height: 17px; }
          .ym-topbar-link svg { width: 16px; height: 16px; }
        }
        @media (min-width: 1024px) {
          .ym-wordmark { font-size: 0.95rem; }
        }
      `}</style>
    </>
  );
}

export default memo(MobileTopBar);
