import { memo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from '../components/mobile/BottomNav';
import MobileTopBar from '../components/mobile/MobileTopBar';
import PWAInstallBanner from '../components/mobile/PWAInstallBanner.jsx';
import PullToRefresh from '../components/common/PullToRefresh.jsx';

/**
 * MobileLayout - التخطيط الموحد للجوال
 * يضمن بقاء الهيدر والفوتر ثابتين في جميع صفحات الموقع
 * + ميزة "اسحب للتحديث" (Pull-to-Refresh) موحدة على كل الصفحات
 */
function MobileLayout({ children }) {
  const location = useLocation();

  // تعطيل ميزة السحب في صفحات يكون فيها التمرير العمودي جزءاً من تجربة الصفحة الأساسية
  // (مثل الريلز التي تستخدم snap عمودي، أو الدردشة التي قد تتعارض مع keyboard)
  const isReelsRoute = location.pathname === '/reels' || location.pathname.startsWith('/reels/');
  const isChatRoute = location.pathname.startsWith('/chat') || location.pathname.startsWith('/inbox');
  const disablePullToRefresh = isReelsRoute || isChatRoute;

  /**
   * onRefresh — سلوك التحديث الموحد:
   * 1) إطلاق حدث 'yamshat:pull-refresh' لتلتقطه الصفحة الحالية وتُعيد تحميل بياناتها بسلاسة
   * 2) كحلّ احتياطي: في حال لم تستجب أي صفحة خلال ~700ms، نُعيد جلب الـ router الحالي
   */
  const onRefresh = useCallback(async () => {
    let handled = false;
    const ack = () => { handled = true; };
    window.addEventListener('yamshat:pull-refresh-ack', ack, { once: true });

    try {
      window.dispatchEvent(new CustomEvent('yamshat:pull-refresh', {
        detail: { path: location.pathname },
      }));
    } catch {
      // ignore
    }

    // ننتظر مهلة قصيرة لمنح الصفحات التي تستمع للحدث فرصة لإعادة جلب بياناتها
    await new Promise((resolve) => setTimeout(resolve, 700));
    window.removeEventListener('yamshat:pull-refresh-ack', ack);

    // إن لم تتعامل أي صفحة مع الحدث → نُعيد تحميل الصفحة بشكل آمن (soft refresh)
    if (!handled) {
      try {
        // إعادة تحميل المسار الحالي عبر hash لتجنّب فقدان حالة التطبيق بالكامل
        const currentHash = window.location.hash;
        if (currentHash) {
          window.location.hash = currentHash;
        }
        // إعادة جلب أي query keys مرتبطة بالـ React Query (إن وجدت عبر window.__yamshatQueryClient)
        const qc = window.__yamshatQueryClient;
        if (qc && typeof qc.invalidateQueries === 'function') {
          await qc.invalidateQueries();
        }
      } catch {
        // ignore
      }
    }
  }, [location.pathname]);

  return (
    <div className="mobile-layout-container" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif" }}>
      <MobileTopBar />

      <main className="mobile-main-content">
        <PWAInstallBanner />
        <PullToRefresh
          onRefresh={onRefresh}
          disabled={disablePullToRefresh}
          pullText="اسحب للتحديث"
          releaseText="اترك للتحديث"
          loadingText="جارٍ التحديث…"
        >
          {children}
        </PullToRefresh>
      </main>

      <BottomNav />

      <style>{`
        /* v59.13.2: الحاوية الأم تثبّت ارتفاع الشاشة بالضبط ولا تتمرّر —
           التمرير يحدث داخل main.mobile-main-content وحدها. باقي التفاصيل
           في mobile-scroll-final-v59.13.2.css الذي يفوز بـ !important. */
        .mobile-layout-container {
          display: flex;
          flex-direction: column;
          /* ارتفاع الشاشة الديناميكي (يتجاوب مع شريط العنوان على iOS) */
          height: 100dvh;
          max-height: 100dvh;
          width: 100%;
          max-width: 100vw;
          background-color: #0A0D1A;
          color: white;
          font-family: "Noto Sans Arabic", "Cairo", system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          /* ⛔ لا تمرير على هذا المستوى — التمرير على main فقط */
          overflow: hidden;
          touch-action: pan-x pan-y pinch-zoom;
          -webkit-overflow-scrolling: touch;
          /* GPU acceleration */
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* v59.13.2: main هو الـ scroll container الوحيد.
           padding-top/bottom يحجزان مساحة لـ TopBar + BottomNav الـ fixed. */
        .mobile-main-content {
          flex: 1 1 auto;
          min-height: 0;          /* ⭐ ضروري لتمرير flex item */
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding-top: 56px;
          padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
          /* ✅ التمرير الفعلي داخل main */
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          touch-action: pan-y pinch-zoom;
          /* سلاسة GPU */
          transform: translateZ(0);
          will-change: scroll-position;
        }

        /* ✅ ضمان عدم خروج أي عنصر عن حدود الشاشة على الأجهزة القديمة */
        @media (max-width: 400px) {
          .mobile-main-content { padding-top: 54px; max-width: 100%; }
        }
        @media (max-width: 360px) {
          .mobile-main-content { padding-top: 52px; }
        }

        .mobile-main-content > .ym-ptr-container {
          flex: 1;
          min-height: 0;
        }

        .ym-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background-color: #0A0D1A;
          border-bottom: 1px solid #1F2937;
          z-index: 1000;
          display: flex;
          align-items: center;
          padding: 0 16px;
        }

        .ym-topbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .ym-topbar-right, .ym-topbar-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .ym-topbar-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          padding: 4px;
          cursor: pointer;
        }

        .ym-topbar-brand {
          text-decoration: none;
        }

        .ym-brand-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ym-wordmark {
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }

        .ym-topbar-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #8B5CF6;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1F2937;
        }

        .ym-topbar-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ym-bottomnav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background-color: #0A0D1A;
          border-top: 1px solid #1F2937;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ym-bottomnav-inner {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          width: 100%;
          max-width: 600px;
          padding-bottom: 8px;
        }

        .ym-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #9CA3AF;
          font-size: 0.7rem;
          gap: 4px;
        }

        .ym-nav-item.active {
          color: #8B5CF6;
        }

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
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          margin-bottom: 4px;
        }

        .ym-nav-label {
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
}

export default memo(MobileLayout);
