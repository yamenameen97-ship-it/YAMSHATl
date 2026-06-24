import { memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * BottomNav (v59.8 — Create Button Always Visible Fix)
 * ----------------------------------------------------------------
 * الترتيب البصري كما في الصورة (من اليسار→اليمين على الشاشة):
 *   حسابي | الريلز | (+) منشور جديد | الدردشات | الرئيسية (نشط)
 *
 * v59.8: زر (+) الإنشاء يظهر كاملاً وبارزاً في جميع الصفحات (منشورات، ريلز،
 * ستوري، دردشات، مجموعات). تم توحيد المظهر ومنع القطع/الاختفاء السفلي.
 */

const NAV_ITEMS_LTR_ORDER = [
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
    icon: (ctx) => {
      const kind = ctx?.kind || 'post';
      if (kind === 'reel' || kind === 'story') {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
            <path d="M10 9.2v5.6a.5.5 0 0 0 .75.43l4.8-2.8a.5.5 0 0 0 0-.86l-4.8-2.8A.5.5 0 0 0 10 9.2z" fill="white" stroke="none" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    },
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
    return { label: 'إنشاء مجموعة', kind: 'navigate', target: '/groups/create', iconKind: 'group' };
  }
  if (pathname.startsWith('/inbox') || pathname.startsWith('/chat')) {
    return { label: 'دردشة جديدة', kind: 'event', event: 'yamshat:open-new-chat', fallback: '/inbox', iconKind: 'chat' };
  }
  if (pathname.startsWith('/reels')) {
    return { label: 'ريلز جديد', kind: 'navigate', target: '/compose?tab=reel', iconKind: 'reel' };
  }
  if (pathname.startsWith('/stories')) {
    return { label: 'ستوري جديد', kind: 'navigate', target: '/compose?tab=story', iconKind: 'story' };
  }
  return { label: 'منشور جديد', kind: 'navigate', target: '/compose?tab=post', iconKind: 'post' };
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
                  {item.icon({ kind: createAction.iconKind })}
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
          /* v59.8: زيادة الارتفاع قليلاً لاحتواء زر (+) كاملاً بدون قص */
          height: calc(72px + env(safe-area-inset-bottom, 0px));
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
          /* v59.8: السماح للزر بالظهور بشكل كامل دون قطع */
          overflow: visible;
        }
        .ym-bottomnav-inner {
          display: flex;
          flex-direction: row;
          justify-content: space-around;
          align-items: center;
          width: 100%;
          max-width: 600px;
          padding: 8px 4px 8px;
          box-sizing: border-box;
          overflow: visible;
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

        /* ✅ v59.8 — زر (+) المركزي يظهر كاملاً وبارزاً في جميع الصفحات */
        .ym-nav-center-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 4px;
          padding: 0 4px;
          background: none;
          border: none;
          cursor: pointer;
          flex: 1.2 1 0;
          min-width: 0;
          font-family: inherit;
          color: #E5E7EB;
          font-size: 0.72rem;
          transition: color 0.2s;
          position: relative;
          overflow: visible;
        }
        .ym-nav-center-item:hover { color: #C4B5FD; }

        /* v59.8: زر (+) موحّد — مربع بحواف دائرية، بارز وكامل في كل الصفحات */
        .ym-nav-plus-btn {
          width: 48px;
          height: 48px;
          background-color: #8B5CF6;
          background-image: linear-gradient(180deg, #A78BFA 0%, #8B5CF6 55%, #7C3AED 100%);
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: transform 0.15s, background-color 0.15s, box-shadow 0.15s;
          box-shadow: 0 6px 16px rgba(139,92,246,.45);
          flex-shrink: 0;
        }
        .ym-nav-plus-btn svg {
          width: 26px;
          height: 26px;
        }
        .ym-nav-center-item:hover .ym-nav-plus-btn {
          background-color: #7C3AED;
        }
        .ym-nav-center-item:active .ym-nav-plus-btn { transform: scale(0.94); }

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
          max-width: 100px;
          font-weight: 600;
        }

        @media (max-width: 400px) {
          .ym-bottomnav { height: calc(68px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 6px 2px; }
          .ym-nav-item, .ym-nav-center-item { padding: 3px 3px; font-size: 0.68rem; gap: 2px; }
          .ym-nav-icon svg { width: 22px; height: 22px; }
          .ym-nav-plus-btn { width: 44px; height: 44px; border-radius: 13px; }
          .ym-nav-plus-btn svg { width: 24px; height: 24px; }
          .ym-nav-label { font-size: 0.68rem; max-width: 68px; }
          .ym-nav-label-center { max-width: 90px; }
        }
        @media (max-width: 360px) {
          .ym-bottomnav { height: calc(66px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 5px 2px; }
          .ym-nav-item, .ym-nav-center-item { padding: 2px 2px; font-size: 0.64rem; }
          .ym-nav-icon svg { width: 21px; height: 21px; }
          .ym-nav-plus-btn { width: 42px; height: 42px; border-radius: 12px; }
          .ym-nav-plus-btn svg { width: 23px; height: 23px; }
          .ym-nav-label { font-size: 0.64rem; max-width: 62px; }
          .ym-nav-label-center { max-width: 82px; }
        }
        @media (max-width: 320px) {
          .ym-bottomnav { height: calc(62px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 4px 1px; }
          .ym-nav-item, .ym-nav-center-item { padding: 2px 1px; font-size: 0.58rem; gap: 1px; }
          .ym-nav-icon svg { width: 19px; height: 19px; }
          .ym-nav-plus-btn { width: 38px; height: 38px; border-radius: 11px; }
          .ym-nav-plus-btn svg { width: 21px; height: 21px; }
          .ym-nav-label { font-size: 0.56rem; max-width: 52px; }
          .ym-nav-label-center { max-width: 72px; }
        }
        /* دعم Redmi Note 8 (393px) */
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-bottomnav { height: calc(70px + env(safe-area-inset-bottom, 0px)); }
          .ym-nav-plus-btn { width: 44px; height: 44px; }
          .ym-nav-label { font-size: 0.7rem; }
        }
        /* دعم الأجهزة القديمة بدون env(safe-area-inset-bottom) */
        @supports not (padding: env(safe-area-inset-bottom)) {
          .ym-bottomnav {
            height: 72px;
            padding-bottom: 0;
          }
          @media (max-width: 400px) { .ym-bottomnav { height: 68px; } }
          @media (max-width: 360px) { .ym-bottomnav { height: 66px; } }
          @media (max-width: 320px) { .ym-bottomnav { height: 62px; } }
        }
        @media (min-width: 1024px) {
          .ym-nav-label { font-size: 0.85rem; }
        }
      `}</style>
    </nav>
  );
}

export default memo(BottomNav);
