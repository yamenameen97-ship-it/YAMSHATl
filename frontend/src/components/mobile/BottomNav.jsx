import { memo, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useChatStore, selectUnreadTotal } from '../../store/appStore.js';

/**
 * BottomNav (Mobile) — تصميم محدّث مطابق للمرجع
 * - 5 عناصر: الرئيسية / الاستكشاف / [زر + مركزي] / الرسائل / الملف الشخصي
 * - زرّ + بنفسجي بارز في المنتصف يطفو لأعلى قليلاً
 * - أيقونات SVG حديثة بدلاً من الإيموجي
 * - دعم بادج عدد الرسائل غير المقروءة
 */

const Icon = {
  home: (active) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 L12 4 L21 11.5 V20 a1 1 0 0 1-1 1 h-5 v-6 h-4 v6 H4 a1 1 0 0 1-1-1 Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeLinejoin="round" />
    </svg>
  ),
  search: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" fill="none" />
      <path d="M20 20 L16.5 16.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5 V19 M5 12 H19" strokeLinecap="round" />
    </svg>
  ),
  inbox: (active) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7 a2 2 0 0 1 2-2 h14 a2 2 0 0 1 2 2 v10 a2 2 0 0 1-2 2 H5 a2 2 0 0 1-2-2 Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeLinejoin="round" />
      <path d="M4 7 L12 13 L20 7" stroke={active ? '#0A0D1A' : 'currentColor'} fill="none" strokeLinejoin="round" />
    </svg>
  ),
  profile: (active) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill={active ? 'currentColor' : 'none'} stroke="currentColor" />
      <path d="M4 21 a8 8 0 0 1 16 0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
};

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadTotal = useChatStore(selectUnreadTotal);

  const items = useMemo(() => ([
    {
      key: 'home',
      to: '/',
      label: 'الرئيسية',
      match: (p) => p === '/' || p === '/feed',
      icon: Icon.home,
    },
    {
      key: 'search',
      to: '/search',
      label: 'الاستكشاف',
      match: (p) => p.startsWith('/search') || p.startsWith('/explore'),
      icon: Icon.search,
    },
    {
      key: 'create',
      label: 'إنشاء',
      isCenter: true,
      onClick: () => {
        // 1) إذا كنا في الصفحة الرئيسية: أطلق حدث فتح المُنشئ مباشرة
        // 2) وإلا: انتقل للرئيسية مع علم ?compose=1 ليفتح FeedMobile المودال
        const onHome = location.pathname === '/' || location.pathname === '/feed';
        if (onHome) {
          window.dispatchEvent(new CustomEvent('yamshat:open-composer', { detail: { action: null } }));
        } else {
          navigate('/?compose=1');
        }
      },
    },
    {
      key: 'inbox',
      to: '/inbox',
      label: 'الرسائل',
      match: (p) => p.startsWith('/inbox') || p.startsWith('/chat'),
      icon: Icon.inbox,
      badge: unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : unreadTotal) : null,
    },
    {
      key: 'profile',
      to: '/profile',
      label: 'الملف الشخصي',
      match: (p) => p.startsWith('/profile'),
      icon: Icon.profile,
    },
  ]), [unreadTotal, navigate]);

  return (
    <nav className="ym-bottomnav" aria-label="التنقل السفلي" role="navigation">
      <div className="ym-bottomnav-inner">
        {items.map((item) => {
          if (item.isCenter) {
            return (
              <div key={item.key} className="ym-nav-plus-wrap">
                <button
                  type="button"
                  className="ym-nav-plus"
                  aria-label={item.label}
                  onClick={item.onClick}
                >
                  {Icon.plus()}
                </button>
              </div>
            );
          }
          const active = item.match?.(location.pathname);
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`ym-nav-item ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon(active)}
              <span>{item.label}</span>
              {item.badge ? <span className="badge">{item.badge}</span> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(BottomNav);
