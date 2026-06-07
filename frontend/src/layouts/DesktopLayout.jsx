import { memo } from 'react';
import MobileTopBar from '../components/mobile/MobileTopBar';
import BottomNav from '../components/mobile/BottomNav';

/**
 * DesktopLayout - التخطيط الموحد للابتوب
 * بناءً على طلب المستخدم، سنستخدم نفس الهيدر والفوتر الموحدين لتسهيل التنقل
 * مع الحفاظ على عرض مناسب للمحتوى في المنتصف
 */
function DesktopLayout({ children }) {
  return (
    <div className="desktop-layout-container">
      {/* استخدام نفس الهيدر العلوي لتوحيد التجربة */}
      <MobileTopBar />
      
      <main className="desktop-main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* استخدام نفس الفوتر السفلي لتوحيد التجربة كما طلب المستخدم */}
      <BottomNav />

      <style>{`
        .desktop-layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #0A0D1A;
          color: white;
          padding-top: 60px;
          padding-bottom: 70px;
        }

        .desktop-main-content {
          flex: 1;
          width: 100%;
          display: flex;
          justify-content: center;
          overflow-y: auto;
        }

        .content-wrapper {
          width: 100%;
          max-width: 1200px; /* عرض أكبر للابتوب */
          padding: 20px;
        }

        /* تعديلات للهيدر والفوتر في اللابتوب */
        @media (min-width: 1024px) {
          .ym-topbar-inner, .ym-bottomnav-inner {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .ym-nav-label {
            font-size: 0.85rem;
          }
          
          .ym-wordmark {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(DesktopLayout);
