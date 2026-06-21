import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { logoutUser } from '../../api/auth.js';
import { clearStoredUser } from '../../utils/auth.js';
import YamServicesMenu from '../ui/YamServicesMenu.jsx';

/**
 * MobileTopBar (v47.11 — مطابق 1:1 للصورة المرجعية الأولى)
 * ----------------------------------------------------------------------------------
 * الترتيب البصري المطلوب (من اليسار لليمين كما في الصورة الأولى):
 *
 *  | Y YAMSHAT  🔔  👥 المجموعات   ⊕  ستوري   ☰ |
 *
 * - أقصى اليسار: شعار Y + كلمة YAMSHAT
 * - بعده: جرس الإشعارات 🔔
 * - بعده: أيقونة المجموعات 👥 + كلمة "المجموعات"
 * - بعده: زر الإضافة ⊕
 * - بعده: كلمة "ستوري"
 * - أقصى اليمين: زر القائمة ☰
 *
 * ✅ كل الأزرار تظهر على جميع الشاشات (320px ↑ → 1920px ↑)
 * ✅ زر القائمة ☰ + "ستوري" يظهران بوضوح على الشاشات الكبيرة والصغيرة
 * ✅ direction: ltr لحماية ترتيب flex من الانعكاس بالـ RTL
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
        dir="ltr"
        style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      >
        <div className="ym-topbar-inner">
          {/* === 1) أقصى اليسار: شعار Y + كلمة YAMSHAT === */}
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

          {/* === العناصر الوسطى/اليمنى === */}
          <div className="ym-topbar-actions">
            {/* 2) جرس الإشعارات */}
            <button
              type="button"
              className="ym-topbar-icon ym-topbar-bell"
              aria-label="الإشعارات"
              onClick={() => navigate('/notifications')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>

            {/* 3) المجموعات */}
            <button
              type="button"
              className="ym-topbar-link"
              aria-label="المجموعات"
              onClick={() => navigate('/groups')}
              dir="rtl"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8.5" r="3" />
                <circle cx="17" cy="9.5" r="2.2" />
                <path d="M3 19c1-3.2 3.5-4.8 6-4.8s5 1.6 6 4.8" />
                <path d="M15 19c.5-2 2-3.2 3.6-3.2 1 0 1.9.3 2.6.9" />
              </svg>
              <span className="ym-topbar-link-text">المجموعات</span>
            </button>

            {/* 4) زر الستوري — v51: ينقل لصفحة الستوري /stories بدلاً من صفحة المنشورات */}
            <button
              type="button"
              className="ym-topbar-link ym-topbar-story"
              aria-label="الستوري"
              onClick={() => {
                // v51 — الانتقال إلى صفحة الستوري المخصصة
                navigate('/stories');
              }}
              dir="rtl"
            >
              <svg className="ym-story-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="ym-topbar-link-text">ستوري</span>
            </button>

            {/* 5) زر القائمة ☰ — مهم: يظهر دائماً على كل المقاسات */}
            <button
              type="button"
              className="ym-topbar-menu"
              aria-label="القائمة"
              onClick={openMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
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
        .ym-topbar.ym-topbar-transparent .ym-topbar-link,
        .ym-topbar.ym-topbar-transparent .ym-wordmark,
        .ym-topbar.ym-topbar-transparent .ym-topbar-icon,
        .ym-topbar.ym-topbar-transparent .ym-topbar-menu {
          color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .ym-topbar-inner {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          gap: 6px;
          height: 100%;
          box-sizing: border-box;
          padding: 0;
        }

        /* === الشعار (أقصى اليسار) === */
        .ym-topbar-brand {
          text-decoration: none;
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 4px 4px;
          color: #fff;
          flex-shrink: 0;
          min-width: 0;
        }
        .ym-logo-v {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          display: block;
        }
        .ym-wordmark {
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: 1.2px;
          white-space: nowrap;
          line-height: 1;
        }

        /* === مجموعة الأزرار اليمنى === */
        .ym-topbar-actions {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 4px;
          flex-shrink: 1;
          flex-wrap: nowrap;
          min-width: 0;
        }

        /* === الجرس + أيقونات منفردة === */
        .ym-topbar-icon {
          background: none;
          border: none;
          color: #A78BFA;
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .ym-topbar-icon svg {
          width: 22px;
          height: 22px;
          display: block;
        }
        .ym-topbar-icon:hover { background: rgba(139, 92, 246, 0.12); }
        .ym-topbar-icon:active { transform: scale(0.94); }

        /* === الروابط (المجموعات + ستوري) === */
        .ym-topbar-link {
          background: none;
          border: none;
          color: #E5E7EB;
          padding: 5px 6px;
          cursor: pointer;
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 5px;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 1;
          flex-grow: 0;
          min-width: 0;
          direction: rtl;
        }
        .ym-topbar-link svg {
          width: 20px;
          height: 20px;
          color: #A78BFA;
          flex-shrink: 0;
          display: block;
        }
        .ym-topbar-link-text {
          font-size: 0.82rem;
          font-weight: 600;
          color: #E5E7EB;
          white-space: nowrap;
        }
        .ym-topbar-link:hover { background: rgba(139, 92, 246, 0.12); }
        .ym-topbar-link:active { transform: scale(0.96); }
        .ym-topbar-story .ym-story-plus { width: 20px; height: 20px; }

        /* === زر القائمة ☰ (أقصى اليمين) === */
        .ym-topbar-menu {
          background: none;
          border: none;
          color: #A78BFA;
          padding: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .ym-topbar-menu svg {
          width: 24px;
          height: 24px;
          display: block;
        }
        .ym-topbar-menu:hover { background: rgba(139, 92, 246, 0.12); }
        .ym-topbar-menu:active { transform: scale(0.94); }

        /* ====== استجابة الشاشات الكبيرة (تابلت + ديسكتوب + وضع الويب على الموبايل) ====== */
        @media (min-width: 768px) {
          .ym-topbar { height: 60px; padding: 0 20px; }
          .ym-wordmark { font-size: 1rem; letter-spacing: 1.4px; }
          .ym-logo-v { width: 26px; height: 26px; }
          .ym-topbar-actions { gap: 8px; }
          .ym-topbar-icon svg { width: 24px; height: 24px; }
          .ym-topbar-link { padding: 6px 10px; gap: 6px; }
          .ym-topbar-link svg { width: 22px; height: 22px; }
          .ym-topbar-link-text { font-size: 0.92rem; }
          .ym-topbar-menu svg { width: 26px; height: 26px; }
        }
        @media (min-width: 1024px) {
          .ym-topbar { height: 64px; }
          .ym-wordmark { font-size: 1.05rem; }
          .ym-topbar-actions { gap: 10px; }
          .ym-topbar-link-text { font-size: 0.95rem; }
        }

        /* ====== استجابة الشاشات الصغيرة ====== */
        @media (max-width: 480px) {
          .ym-topbar { padding: 0 10px; height: 54px; }
          .ym-topbar-inner { gap: 3px; }
          .ym-wordmark { font-size: 0.82rem; letter-spacing: 1px; }
          .ym-logo-v { width: 22px; height: 22px; }
          .ym-topbar-icon { padding: 5px; }
          .ym-topbar-icon svg { width: 20px; height: 20px; }
          .ym-topbar-link { padding: 4px 5px; gap: 4px; }
          .ym-topbar-link svg { width: 18px; height: 18px; }
          .ym-topbar-link-text { font-size: 0.78rem; }
          .ym-topbar-menu { padding: 5px; }
          .ym-topbar-menu svg { width: 22px; height: 22px; }
          .ym-topbar-actions { gap: 2px; }
        }
        @media (max-width: 400px) {
          .ym-topbar { padding: 0 8px; height: 52px; }
          .ym-wordmark { font-size: 0.78rem; }
          .ym-logo-v { width: 20px; height: 20px; }
          .ym-topbar-icon svg { width: 19px; height: 19px; }
          .ym-topbar-link svg { width: 17px; height: 17px; }
          .ym-topbar-link-text { font-size: 0.72rem; }
          .ym-topbar-link { padding: 3px 4px; gap: 3px; }
          .ym-topbar-menu svg { width: 21px; height: 21px; }
        }
        @media (max-width: 360px) {
          .ym-topbar { padding: 0 6px; height: 50px; }
          .ym-wordmark { font-size: 0.72rem; letter-spacing: 0.6px; }
          .ym-logo-v { width: 18px; height: 18px; }
          .ym-topbar-icon { padding: 4px; }
          .ym-topbar-icon svg { width: 18px; height: 18px; }
          .ym-topbar-link svg { width: 16px; height: 16px; }
          .ym-topbar-link-text { font-size: 0.68rem; }
          .ym-topbar-link { padding: 2px 3px; gap: 2px; }
          .ym-topbar-menu { padding: 4px; }
          .ym-topbar-menu svg { width: 20px; height: 20px; }
          .ym-topbar-brand { gap: 3px; padding: 2px; }
        }
        /* للشاشات الصغيرة جداً 320px — نُخفي نص "ستوري" فقط لتوفير المساحة، لكن الأيقونة + باقي الأزرار تظل ظاهرة */
        @media (max-width: 340px) {
          .ym-topbar { padding: 0 5px; height: 48px; }
          .ym-wordmark { font-size: 0.66rem; letter-spacing: 0.4px; }
          .ym-logo-v { width: 16px; height: 16px; }
          .ym-topbar-icon svg { width: 16px; height: 16px; }
          .ym-topbar-link svg { width: 15px; height: 15px; }
          .ym-topbar-link-text { font-size: 0.62rem; }
          .ym-topbar-story .ym-topbar-link-text { display: none; } /* نُخفي نص ستوري فقط */
          .ym-topbar-menu svg { width: 18px; height: 18px; }
        }

        @supports not (backdrop-filter: blur(2px)) {
          .ym-topbar.ym-topbar-transparent {
            background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%);
          }
        }
      `}</style>
    </>
  );
}

export default memo(MobileTopBar);
