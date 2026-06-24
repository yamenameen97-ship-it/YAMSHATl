import { memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * BottomNav (v59.11 — Unified Create Button)
 * ----------------------------------------------------------------
 * الترتيب البصري (RTL، من اليمين → اليسار على الشاشة):
 *   الرئيسية | الدردشات | (+) ديناميكي | الريلز | حسابي
 *
 * v59.11:
 *  - زر (+) أصبح بنفس بنية بقية الأزرار: أيقونة صغيرة بالأعلى داخل خلفية
 *    بنفسجية بحواف دائرية، ونص توصيفي بالأسفل (مثل جيرانه تماماً).
 *  - النص يتغيّر ديناميكياً حسب الصفحة الحالية:
 *      • الرئيسية → "منشور جديد"
 *      • المجموعات → "إنشاء مجموعة"
 *      • الريلز → "ريلز جديد"
 *      • الدردشات → "دردشة جديدة"
 *      • الستوري → "ستوري جديد"
 *  - منع القص/الاختفاء بضمان احتواء كامل داخل الهيدر السفلي.
 *  - تناسق الحجم والمحاذاة العمودية مع جميع العناصر المجاورة.
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
    isCenter: true,
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

/**
 * يحدد سلوك زر الإنشاء (+) بناءً على الصفحة الحالية.
 * يعيد: { label, kind: 'navigate'|'event', target?, event?, fallback?, iconKind }
 */
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

/**
 * أيقونة (+) موحدة بنفس حجم أيقونات بقية الأزرار (24x24).
 * نستخدم علامة + بسيطة بيضاء داخل الخلفية البنفسجية.
 */
function CenterPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const createAction = resolveCreateAction(location.pathname);

  const handleCreateClick = useCallback(() => {
    const action = resolveCreateAction(location.pathname);
    if (action.kind === 'navigate') {
      navigate(action.target);
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent(action.event, { detail: { from: location.pathname } }));
    } catch {
      // تجاهل أي خطأ في إطلاق الحدث
      if (action.fallback) navigate(action.fallback);
    }
  }, [location.pathname, navigate]);

  return (
    <nav
      className="ym-bottomnav"
      role="navigation"
      aria-label="التنقل الرئيسي"
      dir="rtl"
      style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
    >
      <div className="ym-bottomnav-inner">
        {NAV_ITEMS_LTR_ORDER.map((item) => {
          if (item.isCenter) {
            return (
              <button
                key={item.id}
                type="button"
                className="ym-nav-item ym-nav-item--create"
                aria-label={createAction.label}
                title={createAction.label}
                onClick={handleCreateClick}
              >
                <div className="ym-nav-icon ym-nav-icon--create">
                  <CenterPlusIcon />
                </div>
                <span className="ym-nav-label ym-nav-label--create" dir="rtl">
                  {createAction.label}
                </span>
              </button>
            );
          }

          const isActive = item.match ? item.match(location.pathname) : location.pathname === item.to;
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
        /* ============================================================
           v59.11 — هيدر سفلي موحّد وزر (+) متناسق مع جيرانه
           ============================================================ */
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
          direction: rtl;
          overflow: visible;
        }
        .ym-bottomnav-inner {
          display: flex;
          flex-direction: row-reverse; /* عرض من اليمين إلى اليسار: الرئيسية أولاً */
          justify-content: space-around;
          align-items: stretch;
          width: 100%;
          max-width: 600px;
          padding: 6px 4px;
          box-sizing: border-box;
          overflow: visible;
        }
        @media (min-width: 1024px) {
          .ym-bottomnav-inner { max-width: 900px; }
        }

        /* العنصر القاعدي — مشترك بين جميع الأزرار (بما فيها زر +) */
        .ym-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #9CA3AF;
          font-size: 0.72rem;
          gap: 4px;
          padding: 4px 6px;
          transition: color 0.2s;
          flex: 1 1 0;
          min-width: 0;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .ym-nav-item:hover { color: #C4B5FD; }
        .ym-nav-item.active { color: #8B5CF6; }

        .ym-nav-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        }
        .ym-nav-icon svg {
          width: 24px;
          height: 24px;
        }

        .ym-nav-label {
          font-size: 0.72rem;
          line-height: 1.15;
          max-width: 84px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: inherit;
          direction: rtl;
        }

        /* ✅ زر (+) المركزي — بنفس بنية بقية الأزرار، فقط الأيقونة داخل خلفية بنفسجية */
        .ym-nav-item--create {
          color: #E5E7EB;
        }
        .ym-nav-item--create:hover { color: #C4B5FD; }

        .ym-nav-icon--create {
          width: 34px;
          height: 28px;
          background-image: linear-gradient(180deg, #A78BFA 0%, #8B5CF6 55%, #7C3AED 100%);
          background-color: #8B5CF6;
          border-radius: 999px; /* شكل دائري ممدود مثل الصورة الأولى */
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.40);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .ym-nav-icon--create svg {
          width: 18px;
          height: 18px;
        }
        .ym-nav-item--create:hover .ym-nav-icon--create {
          background-color: #7C3AED;
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.55);
        }
        .ym-nav-item--create:active .ym-nav-icon--create {
          transform: scale(0.94);
        }

        .ym-nav-label--create {
          color: #E5E7EB;
          max-width: 96px;
          font-weight: 600;
        }

        /* =================== شاشات صغيرة =================== */
        @media (max-width: 400px) {
          .ym-bottomnav { height: calc(62px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 5px 2px; }
          .ym-nav-item { padding: 3px 3px; font-size: 0.68rem; gap: 3px; }
          .ym-nav-icon { width: 26px; height: 26px; }
          .ym-nav-icon svg { width: 22px; height: 22px; }
          .ym-nav-icon--create { width: 32px; height: 26px; }
          .ym-nav-icon--create svg { width: 17px; height: 17px; }
          .ym-nav-label { font-size: 0.68rem; max-width: 76px; }
          .ym-nav-label--create { max-width: 88px; }
        }
        @media (max-width: 360px) {
          .ym-bottomnav { height: calc(60px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 4px 2px; }
          .ym-nav-item { padding: 2px 2px; font-size: 0.64rem; gap: 2px; }
          .ym-nav-icon { width: 24px; height: 24px; }
          .ym-nav-icon svg { width: 21px; height: 21px; }
          .ym-nav-icon--create { width: 30px; height: 24px; }
          .ym-nav-icon--create svg { width: 16px; height: 16px; }
          .ym-nav-label { font-size: 0.64rem; max-width: 68px; }
          .ym-nav-label--create { max-width: 80px; }
        }
        @media (max-width: 320px) {
          .ym-bottomnav { height: calc(58px + env(safe-area-inset-bottom, 0px)); }
          .ym-bottomnav-inner { padding: 3px 1px; }
          .ym-nav-item { padding: 2px 1px; font-size: 0.58rem; gap: 2px; }
          .ym-nav-icon { width: 22px; height: 22px; }
          .ym-nav-icon svg { width: 19px; height: 19px; }
          .ym-nav-icon--create { width: 28px; height: 22px; }
          .ym-nav-icon--create svg { width: 15px; height: 15px; }
          .ym-nav-label { font-size: 0.58rem; max-width: 58px; }
          .ym-nav-label--create { max-width: 72px; }
        }

        /* Redmi Note 8 (393px) */
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-bottomnav { height: calc(63px + env(safe-area-inset-bottom, 0px)); }
          .ym-nav-icon--create { width: 32px; height: 26px; }
          .ym-nav-label { font-size: 0.7rem; }
        }

        /* أجهزة قديمة بدون env(safe-area-inset-bottom) */
        @supports not (padding: env(safe-area-inset-bottom)) {
          .ym-bottomnav { height: 64px; padding-bottom: 0; }
          @media (max-width: 400px) { .ym-bottomnav { height: 62px; } }
          @media (max-width: 360px) { .ym-bottomnav { height: 60px; } }
          @media (max-width: 320px) { .ym-bottomnav { height: 58px; } }
        }

        @media (min-width: 1024px) {
          .ym-nav-label { font-size: 0.85rem; }
          .ym-nav-icon--create { width: 40px; height: 32px; }
          .ym-nav-icon--create svg { width: 20px; height: 20px; }
        }
      `}</style>
    </nav>
  );
}

export default memo(BottomNav);
