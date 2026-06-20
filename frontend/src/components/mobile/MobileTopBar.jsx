import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { logoutUser } from '../../api/auth.js';
import { clearStoredUser } from '../../utils/auth.js';
import YamServicesMenu from '../ui/YamServicesMenu.jsx';

/**
 * MobileTopBar (v47.7 — pixel-perfect mobile web layout — مطابق تماماً للصورة المرجعية)
 * ----------------------------------------------------------------------------------
 * الترتيب البصري كما في الصورة (من اليسار إلى اليمين فعلياً على الشاشة):
 *
 *   |  Y YAMSHAT   🔔   👥 المجموعات   ⊕ ستوري       ☰  |
 *   |  (يسار)                                       (يمين) |
 *
 * - الشعار + كلمة YAMSHAT في **أقصى اليسار** الفعلي على الشاشة.
 * - زر القائمة ☰ في **أقصى اليمين** الفعلي على الشاشة.
 * - في الوسط (يسار→يمين): جرس → المجموعات → ستوري.
 *
 * ✅ يستخدم direction: ltr للحاوية لحماية ترتيب flex من الانعكاس،
 *    والنصوص العربية تستخدم direction: rtl محلياً.
 * ✅ استجابة كاملة لشاشات: 320 / 360 / 400 / 480px.
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

  const _avatarHasImage = Boolean(user?.avatar);

  return (
    <>
      <header
        className={`ym-topbar fixed-top ${transparent ? 'ym-topbar-transparent' : ''}`}
        role="banner"
        dir="ltr"
        style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      >
        <div className="ym-topbar-inner">
          {/* === أقصى اليسار الفعلي على الشاشة: شعار Y + كلمة YAMSHAT === */}
          <button
            type="button"
            className="ym-topbar-brand"
            aria-label="الصفحة الرئيسية"
            onClick={() => navigate('/')}
          >
            <svg className="ym-logo-v" viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient id="ym-y-grad" x1="0" y1="0" x2="0.5" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>
              <line x1="22" y1="20" x2="50" y2="55" stroke="url(#ym-y-grad)" strokeWidth="12" strokeLinecap="round" />
              <line x1="78" y1="20" x2="50" y2="55" stroke="url(#ym-y-grad)" strokeWidth="12" strokeLinecap="round" />
              <line x1="50" y1="55" x2="50" y2="85" stroke="url(#ym-y-grad)" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <span className="ym-wordmark">YAMSHAT</span>
          </button>

          {/* === الوسط (يسار→يمين على الشاشة): جرس | المجموعات | ستوري === */}
          <nav className="ym-topbar-center" aria-label="روابط سريعة" dir="ltr">
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

            {/* المجموعات: أيقونة (يسار) + نص (يمين) */}
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

            {/* ستوري: دائرة + (يسار) + نص "ستوري" (يمين) */}
            <button
              type="button"
              className="ym-topbar-link ym-topbar-link-story"
              aria-label="ستوري"
              onClick={() => navigate('/stories')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="ym-topbar-link-text">ستوري</span>
            </button>
          </nav>

          {/* === أقصى اليمين الفعلي على الشاشة: زر القائمة ☰ === */}
          <button
            type="button"
            className="ym-topbar-btn ym-topbar-menu-btn"
            aria-label="القائمة"
            onClick={openMenu}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.4" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <YamServicesMenu open={menuOpen} onClose={closeMenu} onLogout={handleLogout} brandLabel="Yamshat" />

      <style>{`
        .ym-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 54px;
          background-color: #0A0D1A;
          border-bottom: 1px solid #1F2937;
          z-index: 1000;
          display: flex;
          align-items: center;
          padding: 0 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          transform: none !important;
          will-change: auto;
          backface-visibility: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          box-sizing: border-box;
          direction: ltr;
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
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          gap: 4px;
          height: 100%;
        }
        .ym-topbar-center {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          direction: ltr;
        }
        .ym-topbar-btn {
          background: none;
          border: none;
          color: #A78BFA;
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
          flex-grow: 0;
        }
        .ym-topbar-btn svg {
          width: 22px;
          height: 22px;
          display: block;
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
          flex-direction: row;
          align-items: center;
          gap: 4px;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
          min-width: 0;
        }
        .ym-topbar-link svg {
          width: 19px;
          height: 19px;
          color: #A78BFA;
          flex-shrink: 0;
          display: block;
        }
        .ym-topbar-link-text {
          font-size: 0.78rem;
          font-weight: 600;
          color: #E5E7EB;
          white-space: nowrap;
          direction: rtl;
        }
        .ym-topbar-link:hover { background: rgba(139, 92, 246, 0.12); }
        .ym-topbar-link:active { transform: scale(0.96); }

        .ym-topbar-brand {
          text-decoration: none;
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px 4px;
          color: #fff;
          flex-shrink: 0;
          min-width: 0;
        }
        .ym-logo-v {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          display: block;
        }
        .ym-wordmark {
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.86rem;
          letter-spacing: 1.2px;
          white-space: nowrap;
          line-height: 1;
        }

        /* ====== استجابة للشاشات الصغيرة ====== */
        @media (max-width: 400px) {
          .ym-topbar { padding: 0 8px; height: 52px; }
          .ym-topbar-inner { gap: 2px; }
          .ym-topbar-center { gap: 7px; }
          .ym-topbar-btn { padding: 5px; }
          .ym-topbar-btn svg { width: 20px; height: 20px; }
          .ym-topbar-link { padding: 3px 3px; gap: 3px; }
          .ym-topbar-link svg { width: 17px; height: 17px; }
          .ym-topbar-link-text { font-size: 0.72rem; }
          .ym-wordmark { font-size: 0.78rem; letter-spacing: 1px; }
          .ym-logo-v { width: 20px; height: 20px; }
        }
        @media (max-width: 360px) {
          .ym-topbar { padding: 0 6px; height: 50px; }
          .ym-topbar-center { gap: 5px; }
          .ym-topbar-btn { padding: 4px; }
          .ym-topbar-btn svg { width: 19px; height: 19px; }
          .ym-topbar-link { padding: 3px 2px; gap: 2px; }
          .ym-topbar-link svg { width: 16px; height: 16px; }
          .ym-topbar-link-text { font-size: 0.68rem; }
          .ym-wordmark { font-size: 0.72rem; letter-spacing: 0.8px; }
          .ym-logo-v { width: 18px; height: 18px; }
          .ym-topbar-brand { gap: 3px; padding: 3px 2px; }
        }
        @media (max-width: 340px) {
          .ym-topbar-link-text { display: none; }
          .ym-topbar-center { gap: 5px; }
        }
        @media (max-width: 320px) {
          .ym-topbar { padding: 0 4px; height: 48px; }
          .ym-wordmark { font-size: 0.64rem; letter-spacing: 0.4px; }
          .ym-topbar-btn { padding: 3px; }
          .ym-topbar-btn svg { width: 17px; height: 17px; }
          .ym-topbar-link svg { width: 15px; height: 15px; }
          .ym-logo-v { width: 16px; height: 16px; }
          .ym-topbar-brand { gap: 2px; padding: 2px 1px; }
          .ym-topbar-inner { gap: 1px; }
          .ym-topbar-center { gap: 3px; }
        }
        /* دعم أجهزة Redmi Note 8 وما شابهها (393x873 @ DPR 2.75) */
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-topbar { padding: 0 7px; height: 53px; }
          .ym-topbar-center { gap: 8px; }
          .ym-topbar-link-text { font-size: 0.74rem; }
        }
        /* دعم الأجهزة القديمة بدون backdrop-filter */
        @supports not (backdrop-filter: blur(2px)) {
          .ym-topbar.ym-topbar-transparent {
            background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%);
          }
        }
        @media (min-width: 1024px) {
          .ym-wordmark { font-size: 0.95rem; }
        }
      `}</style>
    </>
  );
}

export default memo(MobileTopBar);
