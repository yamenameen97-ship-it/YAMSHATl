import { memo } from 'react';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';
import useIsMobile from '../hooks/useIsMobile.js';

/**
 * MainLayout
 * ----------
 * يستخدم useIsMobile (matchMedia) بدل resize listener
 * لتقليل rerenders. memo يمنع الإعادة عندما لا تتغير children.
 */
function MainLayout({ children }) {
  const mobile = useIsMobile();
  return mobile
    ? <MobileLayout>{children}</MobileLayout>
    : <DesktopLayout>{children}</DesktopLayout>;
}

export default memo(MainLayout);
