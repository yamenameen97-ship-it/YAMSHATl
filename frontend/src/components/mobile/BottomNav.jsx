import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * BottomNav - شريط التنقل السفلي المحدث بناءً على الصورة
 * العناصر: الرئيسية، الدردشة، إنشاء (+)، الريلز، البث، حسابي
 */
// يدعم matching للمسارات الفرعية مثل /chat/:id
const NAV_ITEMS = [
  {
    id: 'home',
    label: 'الرئيسية',
    to: '/',
    match: (p) => p === '/',
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    id: 'chat',
    label: 'الدردشة',
    to: '/inbox',
    match: (p) => p.startsWith('/inbox') || p.startsWith('/chat'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    id: 'create',
    label: 'إنشاء',
    isCenter: true,
    to: '/create',
    icon: () => (
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="white" strokeWidth="3">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
  },
  {
    id: 'reels',
    label: 'الريلز',
    to: '/reels',
    match: (p) => p.startsWith('/reels'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M10 9l5 3-5 3z" />
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'حسابي',
    to: '/profile',
    match: (p) => p.startsWith('/profile'),
    icon: (active) => (
      <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
];

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="ym-bottomnav" role="navigation" aria-label="التنقل الرئيسي">
      <div className="ym-bottomnav-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match ? item.match(location.pathname) : location.pathname === item.to;

          if (item.isCenter) {
            return (
              <div key={item.id} className="ym-nav-center-item">
                <button
                  type="button"
                  className="ym-nav-plus-btn"
                  aria-label="إنشاء منشور جديد"
                  onClick={() => window.dispatchEvent(new CustomEvent('yamshat:open-composer'))}
                >
                  {item.icon()}
                </button>
                <span className="ym-nav-label">{item.label}</span>
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
              <div className="ym-nav-icon">
                {item.icon(isActive)}
              </div>
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
          /* ضمان عدم تحرّك الشريط مع سحب الصفحة في أي صفحة */
          transform: none;
          will-change: auto;
          backface-visibility: hidden;
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
        .ym-nav-label { font-size: 0.7rem; line-height: 1.2; }
        @media (min-width: 1024px) {
          .ym-nav-label { font-size: 0.85rem; }
        }
      `}</style>
    </nav>
  );
}

export default memo(BottomNav);
