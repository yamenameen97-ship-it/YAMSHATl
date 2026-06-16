import { memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * BottomNav (v47.7 — pixel-perfect — مطابق تماماً للصورة المرجعية)
 * ----------------------------------------------------------------
 * الترتيب البصري كما في الصورة (من اليسار→اليمين على الشاشة):
 *   حسابي | الريلز | (+) منشور جديد | الدردشات | الرئيسية (نشط)
 *  (يسار)                                                  (يمين)
 *
 * - زر (+) في المنتصف: مربع بحواف دائرية باللون البنفسجي الممتلئ.
 * - "الرئيسية" نشط (لون بنفسجي) في أقصى اليمين على الشاشة.
 * - الأيقونات بأنماط outline.
 */

const NAV_ITEMS_LTR_ORDER = [
  // الترتيب أدناه يطابق ترتيب الظهور البصري من اليسار إلى اليمين على الشاشة
  {
    id: 'profile',
    label: 'حسابي',
    to: '/profile',
    match: (p) => p.startsWith('/profile'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'reels',
    label: 'الريلز',
    to: '/reels',
    match: (p) => p.startsWith('/reels'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M10 9l5 3-5 3z" fill={active ? '#0A0D1A' : 'currentColor'} />
      </svg>
    ),
  },
  {
    id: 'create',
    label: 'منشور جديد',
    isCenter: true,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'الدردشات',
    to: '/inbox',
    match: (p) => p.startsWith('/inbox') || p.startsWith('/chat'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'home',
    label: 'الرئيسية',
    to: '/',
    match: (p) => p === '/',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

function resolveCreateAction(pathname) {
  if (pathname.startsWith('/groups')) {
    return { label: 'إنشاء مجموعة', kind: 'navigate', target: '/groups/create' };
  }
  if (pathname.startsWith('/inbox') || pathname.startsWith('/chat')) {
    return { label: 'دردشة جديدة', kind: 'event', event: 'yamshat:open-new-chat', fallback: '/inbox' };
  }
  if (pathname.startsWith('/reels')) {
    return { label: 'ريل جديد', kind: 'event', event: 'yamshat:open-reel-composer', fallback: '/reels' };
  }
  if (pathname.startsWith('/stories')) {
    return { label: 'ستوري جديد', kind: 'event', event: 'yamshat:open-story-composer', fallback: '/stories' };
  }
  return { label: 'منشور جديد', kind: 'event', event: 'yamshat:open-composer', fallback: '/' };
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleCreateClick = useCallback(() => {
    const action = resolveCreateAction(location.pathname);
    if (action.kind === 'navigate') {
      navigate(action.target);
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent(action.event, { detail: { from: location.pathname } }));
    } catch {
      // تجاهل
    }
  }, [location.pathname, navigate]);

  const createAction = resolveCreateAction(location.pathname);

  return (
    <nav
      className="ym-bottomnav"
      role="navigation"
      aria-label="التنقل الرئيسي"
      dir="ltr"
      style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
    >
      <div className="ym-bottomnav-inner">
        {NAV_ITEMS_LTR_ORDER.map((item) => {
          const isActive = item.match ? item.match(location.pathname) : location.pathname === item.to;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                type="button"
                className="ym-nav-center-item"
                aria-label={createAction.label}
                title={createAction.label}
                onClick={handleCreateClick}
              >
                <span className="ym-nav-plus-btn">
                  {item.icon()}
                </span>
                <span className="ym-nav-label ym-nav-label-center" dir="rtl">{createAction.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.to}
              className={`ym-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="ym-nav-icon">{item.icon(isActive)}</div>
              <span className="ym-nav-label" dir="rtl">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <style>{`
        .ym-bottomnav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(64px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background-color: #0A0D1A;
          border-top: 1px solid #1F2937;
          z-index: 1001;
          display: flex;
          align-items: stretch;
          justify-content: center;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
          transform: none !important;
          will-change: auto;
          backface-visibility: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          box-sizing: border-box;
          direction: ltr;
        }
        .ym-bottomnav-inner {
          display: flex;
          flex-direction: row;
          justify-content: space-around;
          align-items: center;
          width: 100%;
          max-width: 600px;
          padding: 6px 4px 6px;
          box-sizing: border-box;
        }
        @media (min-width: 1024px) {
          .ym-bottomnav-inner { max-width: 900px; }
        }
        .ym-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #9CA3AF;
          font-size: 0.72rem;
          gap: 3px;
          padding: 4px 6px;
          transition: color 0.2s;
          flex: 1 1 0;
          min-width: 0;
        }
        .ym-nav-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ym-nav-icon svg {
          width: 24px;
          height: 24px;
        }
        .ym-nav-item.active { color: #8B5CF6; }
        .ym-nav-item:hover { color: #C4B5FD; }

        /* زر المنتصف (+) — مربع بحواف دائرية */
        .ym-nav-center-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          flex: 1 1 0;
          min-width: 0;
          font-family: inherit;
        }
        .ym-nav-plus-btn {
          width: 46px;
          height: 38px;
          background-color: #8B5CF6;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.5);
          color: #fff;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .ym-nav-plus-btn svg {
          width: 22px;
          height: 22px;
        }
        .ym-nav-center-item:hover .ym-nav-plus-btn {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(139, 92, 246, 0.65);
        }
        .ym-nav-center-item:active .ym-nav-plus-btn { transform: scale(0.95); }
        .ym-nav-label {
          font-size: 0.72rem;
          line-height: 1.1;
          max-width: 76px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: inherit;
          direction: rtl;
        }
        .ym-nav-label-center {
          color: #E5E7EB;
        }

        @media (max-width: 400px) {
          .ym-bottomnav { height: calc(60px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 4px 2px; }
          .ym-nav-item { padding: 3px 3px; font-size: 0.68rem; gap: 2px; }
          .ym-nav-icon svg { width: 22px; height: 22px; }
          .ym-nav-plus-btn { width: 42px; height: 34px; border-radius: 10px; }
          .ym-nav-plus-btn svg { width: 20px; height: 20px; }
          .ym-nav-label { font-size: 0.68rem; max-width: 68px; }
        }
        @media (max-width: 360px) {
          .ym-bottomnav { height: calc(58px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 3px 2px; }
          .ym-nav-item { padding: 2px 2px; font-size: 0.64rem; }
          .ym-nav-icon svg { width: 21px; height: 21px; }
          .ym-nav-plus-btn { width: 38px; height: 30px; border-radius: 9px; }
          .ym-nav-plus-btn svg { width: 19px; height: 19px; }
          .ym-nav-label { font-size: 0.64rem; max-width: 62px; }
        }
        @media (max-width: 320px) {
          .ym-nav-item { padding: 2px 1px; }
          .ym-nav-icon svg { width: 20px; height: 20px; }
          .ym-nav-plus-btn { width: 36px; height: 28px; border-radius: 8px; }
          .ym-nav-plus-btn svg { width: 18px; height: 18px; }
          .ym-nav-label { font-size: 0.6rem; max-width: 56px; }
        }
        @media (min-width: 1024px) {
          .ym-nav-label { font-size: 0.85rem; }
        }
      `}</style>
    </nav>
  );
}

export default memo(BottomNav);
