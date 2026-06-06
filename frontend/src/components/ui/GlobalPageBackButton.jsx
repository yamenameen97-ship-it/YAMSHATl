import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  /^\/chat\/[^/]+$/,
  /^\/chat\/[^/]+\/settings$/,
  /^\/groups\/[^/]+\/chat$/,
  /^\/groups\/[^/]+\/settings$/,
  /^\/groups\/create$/, 
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
      >
        <span aria-hidden="true">←</span>
      </button>
      <style>{`
        .yam-global-back-btn {
          position: fixed;
          top: calc(14px + env(safe-area-inset-top, 0px));
          inset-inline-start: 14px;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          background: rgba(7,10,24,0.78);
          backdrop-filter: blur(12px);
          color: #f8fafc;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          box-shadow: 0 10px 28px rgba(0,0,0,0.28);
        }
        .yam-global-back-btn span {
          font-size: 24px;
          line-height: 1;
        }
        @media (max-width: 980px) {
          .yam-global-back-btn {
            display: inline-flex;
          }
        }
      `}</style>
    </>
  );
}
