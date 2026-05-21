/**
 * Enhanced Main Layout Component
 * Unified grid-based layout with proper sidebar management
 */

import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Topbar from './Topbar.jsx';
import MobileDock from './MobileDock.jsx';
import { isNativeShell } from '../../utils/runtime.js';
import { getScrollPosition, prefetchCriticalRoutes, saveScrollPosition } from '../../utils/navigation.js';

export default function MainLayoutEnhanced({ children, hideNav = false }) {
  const nativeShell = isNativeShell();
  const location = useLocation();
  const mainRef = useRef(null);
  const frameRef = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isConversationRoute = /^\/chat\/[^/]+/.test(location.pathname);
  const isFeedRoute = location.pathname === '/' || location.pathname === '/home';
  const showTopbar = !hideNav && !nativeShell;
  const showDock = !hideNav && !nativeShell;
  const showLeftSidebar = !nativeShell && !isConversationRoute && sidebarOpen;
  const showRightSidebar = !nativeShell && !isConversationRoute && sidebarOpen;

  // Scroll position restoration
  useEffect(() => {
    const container = mainRef.current;
    if (!container || isConversationRoute) return undefined;

    const restore = () => {
      const cachedPosition = getScrollPosition(location.pathname);
      container.scrollTo({ top: cachedPosition, behavior: 'auto' });
      setIsTransitioning(true);
      window.clearTimeout(container.__yamshatTransitionTimer__);
      container.__yamshatTransitionTimer__ = window.setTimeout(() => setIsTransitioning(false), 260);
    };

    const rafId = window.requestAnimationFrame(restore);
    prefetchCriticalRoutes(location.pathname);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(container.__yamshatTransitionTimer__);
    };
  }, [isConversationRoute, location.pathname]);

  // Scroll position saving
  useEffect(() => {
    const container = mainRef.current;
    if (!container || isConversationRoute) return undefined;

    const handleScroll = () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        saveScrollPosition(location.pathname, container.scrollTop);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isConversationRoute, location.pathname]);

  // Toggle sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`
      app-shell-enhanced
      ${nativeShell ? 'native-shell' : ''}
      ${isConversationRoute ? 'conversation-mode' : ''}
      ${isFeedRoute ? 'feed-mode' : ''}
    `}>
      {showTopbar && <Topbar onToggleSidebar={toggleSidebar} />}

      <div className="main-container">
        {showLeftSidebar && <aside className="sidebar-left" />}

        <main
          className={`
            page-content
            ${isTransitioning ? 'is-transitioning' : ''}
            ${isConversationRoute ? 'conversation-mode' : ''}
          `}
          ref={mainRef}
        >
          <div className="page-shell-glow" key={location.pathname}>
            {children}
          </div>
        </main>

        {showRightSidebar && <aside className="sidebar-right" />}
      </div>

      {showDock && <MobileDock />}

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ==================== MAIN LAYOUT ==================== */

          .app-shell-enhanced {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            height: 100vh;
            background-color: var(--color-bg-primary);
            background-image: var(--gradient-bg);
            background-attachment: fixed;
            overflow: hidden;
          }

          .app-shell-enhanced.native-shell {
            background: none;
          }

          /* ==================== MAIN CONTAINER ==================== */

          .main-container {
            display: grid;
            grid-template-columns: auto 1fr auto;
            flex: 1;
            overflow: hidden;
            gap: 0;
          }

          .main-container.conversation-mode {
            grid-template-columns: 260px 1fr 320px;
          }

          .main-container.feed-mode {
            grid-template-columns: 260px 1fr 320px;
          }

          /* ==================== SIDEBARS ==================== */

          .sidebar-left,
          .sidebar-right {
            background-color: var(--color-surface-primary);
            border-right: 1px solid var(--color-border-secondary);
            overflow-y: auto;
            overflow-x: hidden;
            max-height: calc(100vh - var(--header-height));
            position: sticky;
            top: var(--header-height);
          }

          .sidebar-right {
            border-right: none;
            border-left: 1px solid var(--color-border-secondary);
          }

          .sidebar-left {
            width: var(--sidebar-width-left);
            padding: var(--spacing-4);
          }

          .sidebar-right {
            width: var(--sidebar-width-right);
            padding: var(--spacing-4);
          }

          /* ==================== PAGE CONTENT ==================== */

          .page-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            background-color: var(--color-bg-primary);
            display: flex;
            flex-direction: column;
          }

          .page-content.conversation-mode {
            background-color: var(--color-bg-primary);
          }

          .page-shell-glow {
            flex: 1;
            display: flex;
            flex-direction: column;
            animation: fadeIn var(--duration-normal) var(--ease-out);
          }

          .page-content.is-transitioning .page-shell-glow {
            opacity: 0.95;
          }

          /* ==================== SCROLLBAR ==================== */

          .page-content::-webkit-scrollbar,
          .sidebar-left::-webkit-scrollbar,
          .sidebar-right::-webkit-scrollbar {
            width: 8px;
          }

          .page-content::-webkit-scrollbar-track,
          .sidebar-left::-webkit-scrollbar-track,
          .sidebar-right::-webkit-scrollbar-track {
            background: transparent;
          }

          .page-content::-webkit-scrollbar-thumb,
          .sidebar-left::-webkit-scrollbar-thumb,
          .sidebar-right::-webkit-scrollbar-thumb {
            background: var(--color-border-primary);
            border-radius: var(--radius-full);
          }

          .page-content::-webkit-scrollbar-thumb:hover,
          .sidebar-left::-webkit-scrollbar-thumb:hover,
          .sidebar-right::-webkit-scrollbar-thumb:hover {
            background: var(--color-border-primary);
          }

          /* ==================== RESPONSIVE DESIGN ==================== */

          @media (max-width: 1024px) {
            .main-container {
              grid-template-columns: 1fr;
            }

            .sidebar-left,
            .sidebar-right {
              display: none;
            }

            .page-content {
              max-width: 100%;
            }
          }

          @media (max-width: 768px) {
            .app-shell-enhanced {
              height: 100vh;
            }

            .main-container {
              grid-template-columns: 1fr;
              height: calc(100vh - var(--header-height-mobile) - var(--mobile-nav-height));
            }

            .page-content {
              max-height: calc(100vh - var(--header-height-mobile) - var(--mobile-nav-height));
            }
          }

          /* ==================== ANIMATIONS ==================== */

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
}
