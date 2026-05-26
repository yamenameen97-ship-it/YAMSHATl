import { memo } from 'react';
import BottomNav from '../components/mobile/BottomNav';

function MobileLayout({ children }) {
  return (
    <div className="mobile-layout">
      <main className="mobile-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default memo(MobileLayout);
