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
function MainLayout({
  children,
  hideNav = false,
  lockScroll = false,
  hideTopBar,
  hideBottomNav,
}) {
  const mobile = useIsMobile();
  const sharedProps = {
    hideNav,
    lockScroll,
    hideTopBar,
    hideBottomNav,
  };

  return mobile
    ? <MobileLayout {...sharedProps}>{children}</MobileLayout>
    : <DesktopLayout {...sharedProps}>{children}</DesktopLayout>;
}

export default memo(MainLayout);
