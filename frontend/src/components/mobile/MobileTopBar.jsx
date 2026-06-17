import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { logoutUser } from '../../api/auth.js';
import { clearStoredUser } from '../../utils/auth.js';
import YamServicesMenu from '../ui/YamServicesMenu.jsx';

/**
 * MobileTopBar (v47.10 — pixel-perfect — مطابق 1:1 للصورة المرجعية)
 * ----------------------------------------------------------------------------------
 * الترتيب البصري المطلوب (مطابق للصورة المرجعية):
 *
 *   |  Y YAMSHAT ▼      👥 المجموعات       ⊕ ي   |
 *   |  (يسار)            (وسط)            (يمين) |
 *
 * - الشعار + كلمة YAMSHAT + سهم ▼ في **أقصى اليسار**.
 * - "المجموعات" + أيقونة في **الوسط**.
 * - زر الإضافة (دائرة +) + حرف "ي" (المستخدم) في **أقصى اليمين** — هو زر القائمة.
 *
 * ✅ تم إزالة: زر الجرس، زر "ستوري"، أيقونة ☰ القديمة — لمطابقة الصورة بدقة.
 * ✅ direction: ltr للحاوية لحماية ترتيب flex من الانعكاس.
 * ✅ استجابة كاملة لشاشات: 320 / 360 / 393 / 400 / 480px.
 * ✅ كل العناصر داخل حدود الشاشة (لا توجد عناصر تخرج خارج الحاوية).
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

  // الحرف الأول من اسم المستخدم أو "ي" افتراضياً
  const userInitial = (user?.username || user?.name || 'ي').toString().trim().charAt(0) || 'ي';

  return (
    <>
      <header
        className={`ym-topbar fixed-top ${transparent ? 'ym-topbar-transparent' : ''}`}
        role="banner"
        dir="ltr"
        style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      >
        <div className="ym-topbar-inner">
          {/* === أقصى اليسار: شعار Y + كلمة YAMSHAT + سهم لأسفل === */}
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
            <svg className="ym-chevron" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* === الوسط: المجموعات === */}
          <button
            type="button"
            className="ym-topbar-link ym-topbar-link-groups"
            aria-label="المجموعات"
            onClick={() => navigate('/groups')}
            dir="rtl"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="8.5" r="3" />
              <circle cx="17" cy="9.5" r="2.2" />
              <path d="M3 19c1-3.2 3.5-4.8 6-4.8s5 1.6 6 4.8" />
              <path d="M15 19c.5-2 2-3.2 3.6-3.2 1 0 1.9.3 2.6.9" />
            </svg>
            <span className="ym-topbar-link-text">المجموعات</span>
          </button>

          {/* === أقصى اليمين: زر دائرة (+) + حرف ي (مستخدم/قائمة) === */}
          <div className="ym-topbar-right">
            <button
              type="button"
              className="ym-topbar-plus"
              aria-label="إنشاء جديد"
              onClick={() => {
                try {
                  window.dispatchEvent(new CustomEvent('yamshat:open-composer'));
                } catch { /* ignore */ }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>

            <button
              type="button"
              className="ym-topbar-user"
              aria-label="القائمة"
              onClick={openMenu}
            >
              <span className="ym-topbar-user-letter">{userInitial}</span>
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
          overflow: hidden;
        }
        .ym-topbar.ym-topbar-transparent {
          background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%);
          border-bottom: none;
          box-shadow: none;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }
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
          box-sizing: border-box;
          padding: 0;
        }

        /* === الشعار (أقصى اليسار) === */
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
        .ym-chevron {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          display: block;
        }

        /* === الرابط الأوسط (المجموعات) === */
        .ym-topbar-link {
          background: none;
          border: none;
          color: #E5E7EB;
          padding: 4px 6px;
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

        /* === الجانب الأيمن: زر + + حرف المستخدم === */
        .ym-topbar-right {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .ym-topbar-plus {
          background: none;
          border: none;
          color: #A78BFA;
          padding: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .ym-topbar-plus svg {
          width: 22px;
          height: 22px;
          display: block;
        }
        .ym-topbar-plus:hover { background: rgba(139, 92, 246, 0.12); }
        .ym-topbar-plus:active { transform: scale(0.94); }

        .ym-topbar-user {
          background: transparent;
          border: 1.5px solid #A78BFA;
          color: #A78BFA;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
          transition: background 0.15s;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        }
        .ym-topbar-user-letter {
          font-size: 0.85rem;
          font-weight: 700;
          line-height: 1;
          direction: rtl;
        }
        .ym-topbar-user:hover { background: rgba(139, 92, 246, 0.12); }
        .ym-topbar-user:active { transform: scale(0.94); }

        /* ====== استجابة الشاشات الصغيرة ====== */
        @media (max-width: 400px) {
          .ym-topbar { padding: 0 10px; height: 52px; }
          .ym-topbar-inner { gap: 2px; }
          .ym-wordmark { font-size: 0.8rem; letter-spacing: 1px; }
          .ym-logo-v { width: 20px; height: 20px; }
          .ym-chevron { width: 12px; height: 12px; }
          .ym-topbar-link { padding: 3px 4px; gap: 4px; }
          .ym-topbar-link svg { width: 18px; height: 18px; }
          .ym-topbar-link-text { font-size: 0.76rem; }
          .ym-topbar-plus, .ym-topbar-user { width: 26px; height: 26px; }
          .ym-topbar-plus svg { width: 20px; height: 20px; }
          .ym-topbar-user-letter { font-size: 0.78rem; }
          .ym-topbar-right { gap: 5px; }
        }
        @media (max-width: 360px) {
          .ym-topbar { padding: 0 8px; height: 50px; }
          .ym-wordmark { font-size: 0.74rem; letter-spacing: 0.8px; }
          .ym-logo-v { width: 18px; height: 18px; }
          .ym-chevron { width: 11px; height: 11px; }
          .ym-topbar-link { padding: 2px 3px; gap: 3px; }
          .ym-topbar-link svg { width: 16px; height: 16px; }
          .ym-topbar-link-text { font-size: 0.7rem; }
          .ym-topbar-plus, .ym-topbar-user { width: 24px; height: 24px; }
          .ym-topbar-plus svg { width: 18px; height: 18px; }
          .ym-topbar-user-letter { font-size: 0.72rem; }
          .ym-topbar-brand { gap: 3px; padding: 3px 2px; }
          .ym-topbar-right { gap: 4px; }
        }
        @media (max-width: 320px) {
          .ym-topbar { padding: 0 6px; height: 48px; }
          .ym-wordmark { font-size: 0.66rem; letter-spacing: 0.5px; }
          .ym-logo-v { width: 16px; height: 16px; }
          .ym-chevron { width: 10px; height: 10px; }
          .ym-topbar-link svg { width: 15px; height: 15px; }
          .ym-topbar-link-text { font-size: 0.64rem; }
          .ym-topbar-plus, .ym-topbar-user { width: 22px; height: 22px; }
          .ym-topbar-plus svg { width: 16px; height: 16px; }
          .ym-topbar-user-letter { font-size: 0.68rem; }
          .ym-topbar-brand { gap: 2px; padding: 2px 1px; }
          .ym-topbar-right { gap: 3px; }
        }
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-topbar { padding: 0 9px; height: 53px; }
          .ym-wordmark { font-size: 0.78rem; }
          .ym-topbar-link-text { font-size: 0.74rem; }
        }
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
