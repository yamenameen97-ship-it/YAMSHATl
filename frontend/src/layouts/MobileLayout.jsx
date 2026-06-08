import { memo } from 'react';
import BottomNav from '../components/mobile/BottomNav';
import MobileTopBar from '../components/mobile/MobileTopBar';

/**
 * MobileLayout - التخطيط الموحد للجوال
 * يضمن بقاء الهيدر والفوتر ثابتين في جميع صفحات الموقع
 */
function MobileLayout({ children }) {
  return (
    <div className="mobile-layout-container">
      <MobileTopBar />
      
      <main className="mobile-main-content">
        {children}
      </main>

      <BottomNav />

      <style>{`
        .mobile-layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #0A0D1A; /* لون الخلفية الداكن كما في الصورة */
          color: white;
          padding-top: 60px; /* مساحة للهيدر العلوي */
          padding-bottom: 70px; /* مساحة للفوتر السفلي */
        }

        .mobile-main-content {
          flex: 1;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          overflow-y: auto;
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
          margin-top: -30px; /* جعل زر الإضافة يبرز للأعلى */
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
