import { memo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from '../components/mobile/BottomNav';
import MobileTopBar from '../components/mobile/MobileTopBar';
import MobileTabs from '../components/mobile/MobileTabs';

/**
 * MobileLayout — تخطيط الموبايل المحسّن (مطابق للمرجع)
 * - TopBar علوي ثابت بلوغو YAMSHAT
 * - تبويبات (الرئيسية/الرائج/المتابعون) — تظهر فقط في الصفحة الرئيسية
 * - محتوى متوسّط بعرض أقصى مناسب للموبايل
 * - BottomNav سفلي مع زر إنشاء مركزي بارز
 */
function MobileLayout({ children, showTabs }) {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/feed';
  const tabsVisible = showTabs ?? isHome;
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="mobile-layout">
      <MobileTopBar />
      {tabsVisible ? (
        <MobileTabs activeId={activeTab} onChange={setActiveTab} />
      ) : null}
      <main
        className="mobile-content"
        style={!tabsVisible ? { paddingTop: 'calc(var(--ym-topbar-h) + env(safe-area-inset-top, 0px) + 12px)' } : undefined}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default memo(MobileLayout);
