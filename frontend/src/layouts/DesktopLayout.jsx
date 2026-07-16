import { memo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import MobileTopBar from '../components/mobile/MobileTopBar';
import BottomNav from '../components/mobile/BottomNav';
import PullToRefresh from '../components/common/PullToRefresh.jsx';

/**
 * DesktopLayout - التخطيط الموحد للابتوب
 * + ميزة "اسحب للتحديث" تعمل أيضاً على شاشات اللمس الكبيرة (تابلت/شاشات هجينة)
 *
 * 🔧 v59.13.18: mainRef يُمرّر مباشرة إلى PullToRefresh لضمان عمل السحب
 * في كل صفحات الديسكتوب التي تعمل على شاشات لمس.
 */
function DesktopLayout({
  children,
  hideNav = false,
  lockScroll = false,
  hideTopBar,
  hideBottomNav,
}) {
  const location = useLocation();
  // ⭐ v59.13.18: مرجع عنصر التمرير الفعلي
  const mainRef = useRef(null);
  const isReelsRoute = location.pathname === '/reels' || location.pathname.startsWith('/reels/');
  const isChatRoute = location.pathname.startsWith('/chat') || location.pathname.startsWith('/inbox');
  const shouldHideTopBar = Boolean(hideTopBar ?? hideNav);
  const shouldHideBottomNav = Boolean(hideBottomNav ?? hideNav);
  const disablePullToRefresh = isReelsRoute || isChatRoute || lockScroll;

  const onRefresh = useCallback(async () => {
    let handled = false;
    const ack = () => { handled = true; };
    window.addEventListener('yamshat:pull-refresh-ack', ack, { once: true });
    try {
      window.dispatchEvent(new CustomEvent('yamshat:pull-refresh', {
        detail: { path: location.pathname },
      }));
    } catch {
      /* ignore */
    }
    await new Promise((resolve) => setTimeout(resolve, 700));
    window.removeEventListener('yamshat:pull-refresh-ack', ack);
    if (!handled) {
      try {
        const qc = window.__yamshatQueryClient;
        if (qc && typeof qc.invalidateQueries === 'function') {
          await qc.invalidateQueries();
        }
      } catch {
        /* ignore */
      }
    }
  }, [location.pathname]);

  return (
    <div className={`desktop-layout-container ${shouldHideTopBar ? 'hide-topbar' : ''} ${shouldHideBottomNav ? 'hide-bottomnav' : ''} ${lockScroll ? 'lock-scroll' : ''}`.trim()} dir="rtl">
      {shouldHideTopBar ? null : <MobileTopBar />}

      <main className="desktop-main-content" ref={mainRef}>
        <PullToRefresh
          onRefresh={onRefresh}
          disabled={disablePullToRefresh}
          pullText="اسحب للتحديث"
          releaseText="اترك للتحديث"
          loadingText="جارٍ التحديث…"
          className="desktop-ptr"
          scrollContainerRef={mainRef}
        >
          <div className="content-wrapper">
            {children}
          </div>
        </PullToRefresh>
      </main>

      {shouldHideBottomNav ? null : <BottomNav />}

      <style>{`
        .desktop-layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #0A0D1A;
          color: white;
          padding-top: 60px;
          padding-bottom: 70px;
          font-family: "Noto Sans Arabic", "Cairo", system-ui, -apple-system, sans-serif;
        }

        .desktop-layout-container.hide-topbar {
          padding-top: 0;
        }

        .desktop-layout-container.hide-bottomnav {
          padding-bottom: 0;
        }

        .desktop-main-content {
          flex: 1;
          width: 100%;
          display: flex;
          justify-content: center;
          overflow: hidden;
        }

        .desktop-layout-container.lock-scroll .desktop-main-content {
          overflow: hidden;
        }

        .desktop-main-content > .ym-ptr-container.desktop-ptr {
          width: 100%;
          height: 100%;
        }

        .content-wrapper {
          width: 100%;
          max-width: 1200px;
          padding: 20px;
          margin: 0 auto;
        }

        @media (min-width: 1024px) {
          .ym-topbar-inner, .ym-bottomnav-inner {
            max-width: 1200px;
            margin: 0 auto;
          }
          .ym-nav-label { font-size: 0.85rem; }
          .ym-wordmark { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}

export default memo(DesktopLayout);
