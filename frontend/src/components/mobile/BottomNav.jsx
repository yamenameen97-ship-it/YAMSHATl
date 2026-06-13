import { memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * BottomNav (v28) — شريط التنقل السفلي الموحّد
 * --------------------------------------------
 * - مثبّت بالكامل (position: fixed) ولا يتحرك مع تمرير الصفحة في أي مكان.
 * - زر "إنشاء (+)" أصبح ذكياً يتغير سلوكه حسب الصفحة الحالية:
 *     • الرئيسية (/)          → إنشاء منشور جديد (yamshat:open-composer)
 *     • المجموعات (/groups)   → إنشاء مجموعة جديدة (/groups/create)
 *     • الدردشة (/inbox|/chat)→ فتح حوار "دردشة جديدة" (yamshat:open-new-chat)
 *     • الريلز (/reels)       → إنشاء ريل/فيديو جديد (yamshat:open-reel-composer)
 *     • أي صفحة أخرى          → إنشاء منشور افتراضياً
 * - dir=rtl وخط Noto Sans Arabic مطبّقان.
 */

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'الرئيسية',
    to: '/',
    match: (p) => p === '/',
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'الدردشة',
    to: '/inbox',
    match: (p) => p.startsWith('/inbox') || p.startsWith('/chat'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'create',
    label: 'إنشاء',
    isCenter: true,
    icon: () => (
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="white" strokeWidth="3">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: 'reels',
    label: 'الريلز',
    to: '/reels',
    match: (p) => p.startsWith('/reels'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M10 9l5 3-5 3z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'حسابي',
    to: '/profile',
    match: (p) => p.startsWith('/profile'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

/**
 * يحدد سياق زر "+" الذكي بناءً على المسار الحالي.
 * يُرجع كائناً يحتوي على label للسياق وحدث/مسار التنفيذ.
 */
function resolveCreateAction(pathname) {
  if (pathname.startsWith('/groups')) {
    return {
      label: 'إنشاء مجموعة',
      kind: 'navigate',
      target: '/groups/create',
    };
  }
  if (pathname.startsWith('/inbox') || pathname.startsWith('/chat')) {
    return {
      label: 'دردشة جديدة',
      kind: 'event',
      event: 'yamshat:open-new-chat',
      fallback: '/inbox',
    };
  }
  if (pathname.startsWith('/reels')) {
    return {
      label: 'ريل جديد',
      kind: 'event',
      event: 'yamshat:open-reel-composer',
      fallback: '/reels',
    };
  }
  if (pathname.startsWith('/stories')) {
    return {
      label: 'ستوري جديد',
      kind: 'event',
      event: 'yamshat:open-story-composer',
      fallback: '/stories',
    };
  }
  // الافتراضي (الرئيسية وأي صفحة أخرى): إنشاء منشور
  return {
    label: 'منشور جديد',
    kind: 'event',
    event: 'yamshat:open-composer',
    fallback: '/',
  };
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
    // إطلاق حدث عام يلتقطه المكوّن المختص بالصفحة الحالية
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
      dir="rtl"
      style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
    >
      <div className="ym-bottomnav-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match ? item.match(location.pathname) : location.pathname === item.to;

          if (item.isCenter) {
            return (
              <div key={item.id} className="ym-nav-center-item">
                <button
                  type="button"
                  className="ym-nav-plus-btn"
                  aria-label={createAction.label}
                  title={createAction.label}
                  onClick={handleCreateClick}
                >
                  {item.icon()}
                </button>
                <span className="ym-nav-label">{createAction.label}</span>
              </div>
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
              <span className="ym-nav-label">{item.label}</span>
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
          height: calc(70px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background-color: #0A0D1A;
          border-top: 1px solid #1F2937;
          z-index: 1001;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
          /* تثبيت كامل: لا transform ولا will-change حتى لا يكسر position:fixed */
          transform: none !important;
          will-change: auto;
          backface-visibility: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        }
        .ym-bottomnav-inner {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          width: 100%;
          max-width: 600px;
          padding-bottom: 8px;
        }
        @media (min-width: 1024px) {
          .ym-bottomnav-inner { max-width: 900px; }
        }
        .ym-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #9CA3AF;
          font-size: 0.7rem;
          gap: 4px;
          padding: 4px 8px;
          transition: color 0.2s;
        }
        .ym-nav-item.active { color: #8B5CF6; }
        .ym-nav-item:hover { color: #C4B5FD; }
        .ym-nav-center-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: -30px;
        }
        .ym-nav-plus-btn {
          width: 56px;
          height: 56px;
          background-color: #8B5CF6;
          border-radius: 50%;
          border: 4px solid #0A0D1A;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          margin-bottom: 4px;
          cursor: pointer;
          color: #fff;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .ym-nav-plus-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(139, 92, 246, 0.6);
        }
        .ym-nav-plus-btn:active { transform: scale(0.95); }
        .ym-nav-label {
          font-size: 0.7rem;
          line-height: 1.2;
          max-width: 80px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 1024px) {
          .ym-nav-label { font-size: 0.85rem; }
        }
      `}</style>
    </nav>
  );
}

export default memo(BottomNav);
