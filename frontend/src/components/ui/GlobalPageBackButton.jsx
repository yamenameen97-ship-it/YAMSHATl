import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * GlobalPageBackButton — v33+1
 * ----------------------------
 * زر رجوع عائم عالمي يظهر تلقائيًا في كل الصفحات التي تفتقد سهم رجوع،
 * بما في ذلك صفحات الشات على الدسكتوب/اللاب توب (التي كانت مستثناة سابقًا).
 *
 * التحسينات في هذه النسخة:
 *  ✓ إظهار الزر على جميع الأحجام (دسكتوب + جوال) ما لم يكن المسار في القائمة المستثناة.
 *  ✓ تمكين الزر داخل الشات على الويب (نقطة الإصلاح المطلوبة من المستخدم).
 *  ✓ سهم رجوع يحترم اتجاه RTL (chevron يشير للجهة المناسبة).
 *  ✓ خط Noto Sans Arabic + dir="rtl".
 */

// المسارات التي لا تحتاج زر رجوع عائم (لأنها صفحات جذرية أو لديها زر رجوع داخلي)
const HIDDEN_PATHS = [
  /^\/$/,
  /^\/inbox$/,
  /^\/groups$/,
  /^\/login$/,
  /^\/register$/,
  /^\/verify-email$/,
  /^\/forgot-password$/,
  /^\/reset-password$/,
  /^\/admin\/login$/,
  /^\/reels$/, // الريلز لها زر رجوع عائم خاص بها
];

function fallbackRoute(pathname) {
  if (/^\/chat\/[^/]+\/settings$/.test(pathname)) {
    return pathname.replace(/\/settings$/, '');
  }
  if (/^\/chat\/[^/]+$/.test(pathname)) return '/inbox';
  if (/^\/groups\/[^/]+\/settings$/.test(pathname)) {
    const match = pathname.match(/^\/groups\/([^/]+)\/settings$/);
    return match ? `/groups/${match[1]}/chat` : '/groups';
  }
  if (/^\/groups\/[^/]+\/chat$/.test(pathname)) return '/groups';
  if (/^\/groups\/create$/.test(pathname)) return '/groups';
  if (/^\/admin\//.test(pathname)) return '/admin/dashboard';
  if (/^\/profile\//.test(pathname)) return '/profile';
  if (/^\/notifications$/.test(pathname)) return '/';
  if (/^\/search$/.test(pathname)) return '/';
  return '/';
}

export default function GlobalPageBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const hidden = useMemo(
    () => HIDDEN_PATHS.some((pattern) => pattern.test(location.pathname)),
    [location.pathname],
  );

  if (hidden) return null;

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackRoute(location.pathname), { replace: true });
  };

  return (
    <>
      <button
        type="button"
        className="yam-global-back-btn"
        onClick={handleBack}
        aria-label="رجوع"
        title="رجوع"
        dir="rtl"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <style>{`
        .yam-global-back-btn {
          position: fixed;
          top: calc(14px + env(safe-area-inset-top, 0px));
          inset-inline-start: 14px;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          background: rgba(7,10,24,0.78);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          color: #f8fafc;
          /* ✅ v33+1: إظهار الزر دائمًا (دسكتوب + جوال) ما لم يكن المسار مستثنى */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          box-shadow: 0 10px 28px rgba(0,0,0,0.28);
          cursor: pointer;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
          transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
        }
        .yam-global-back-btn:hover {
          transform: scale(1.06);
          background: rgba(139, 92, 246, 0.42);
          border-color: rgba(167,139,250,0.45);
        }
        .yam-global-back-btn:active {
          transform: scale(0.96);
        }
        .yam-global-back-btn svg {
          display: block;
        }
        /* داخل الشات على الدسكتوب: ارفع الزر فوق هيدر الشات الموجود (sticky z-index 60) */
        body.is-chat-open .yam-global-back-btn {
          z-index: 1300;
          top: calc(20px + env(safe-area-inset-top, 0px));
          inset-inline-start: 326px; /* بعد سايدبار الشات (310px + padding) */
          background: rgba(15,23,42,0.92);
          border-color: rgba(255,255,255,0.18);
        }
        @media (max-width: 1024px) {
          body.is-chat-open .yam-global-back-btn {
            inset-inline-start: 14px;
          }
        }
      `}</style>
    </>
  );
}
