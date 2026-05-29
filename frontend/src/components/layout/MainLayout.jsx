import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Topbar from './Topbar.jsx';
import MobileDock from './MobileDock.jsx';
import { isNativeShell } from '../../utils/runtime.js';
import { getScrollPosition, prefetchCriticalRoutes, saveScrollPosition } from '../../utils/navigation.js';

export default function MainLayout({ children, hideNav = false, lockScroll = false }) {
  const nativeShell = isNativeShell();
  const location = useLocation();
  const mainRef = useRef(null);
  const frameRef = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isConversationRoute = /^\/chat\/[^/]+/.test(location.pathname);
  const showTopbar = !hideNav && !nativeShell && !isConversationRoute;
  const showDock = !hideNav && !nativeShell && !isConversationRoute;

  useEffect(() => {
    const container = mainRef.current;
    if (!container || isConversationRoute) return undefined;

    const restore = () => {
      const cachedPosition = getScrollPosition(location.pathname);
      container.scrollTo({ top: cachedPosition, behavior: 'auto' });
      setIsTransitioning(true);
      window.clearTimeout(container.__yamshatTransitionTimer__);
      container.__yamshatTransitionTimer__ = window.setTimeout(() => setIsTransitioning(false), 180);
    };

    const rafId = window.requestAnimationFrame(restore);
    prefetchCriticalRoutes(location.pathname);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(container.__yamshatTransitionTimer__);
    };
  }, [isConversationRoute, location.pathname]);

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

  return (
    <div className={`app-shell yamshat-shell ${nativeShell ? 'native-shell' : ''} ${isConversationRoute ? 'conversation-shell' : ''}`}>
      <div className={`main-shell ${nativeShell ? 'native-shell' : ''}`}>
        {showTopbar ? <Topbar /> : null}

        <main
          className={`page-content ${nativeShell ? 'native-shell' : ''} ${isTransitioning ? 'is-transitioning' : ''} ${isConversationRoute ? 'conversation-mode' : ''} ${lockScroll ? 'lock-scroll' : ''}`}
          ref={mainRef}
        >
          <div className={`page-shell-glow ${isConversationRoute ? 'conversation-mode' : ''}`} key={location.pathname}>
            {children}
          </div>
        </main>
      </div>

      {showDock ? <MobileDock /> : null}

      <style dangerouslySetInnerHTML={{
        __html: `
          .app-shell {
            display: flex;
            min-height: 100vh;
            min-height: 100dvh;
            height: 100vh;
            height: 100dvh;
            background: var(--app-background);
            overflow: hidden;
          }

          .app-shell.native-shell,
          .app-shell.conversation-shell {
            flex-direction: column;
          }

          .main-shell {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
            min-width: 0;
          }

          .main-shell.native-shell {
            width: 100%;
          }

          .page-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            transition: opacity var(--motion-fast), transform var(--motion-fast), filter var(--motion-fast);
            will-change: transform, opacity;
          }

          .page-content.conversation-mode {
            overflow: hidden;
            padding-bottom: 0;
          }

          .page-content.lock-scroll {
            overflow: hidden;
          }

          .page-content.is-transitioning {
            opacity: 0.985;
            transform: translate3d(0, 4px, 0);
            filter: saturate(0.98);
          }

          .page-content.native-shell {
            padding-bottom: 68px;
          }

          .page-shell-glow {
            min-height: 100%;
            animation: pageFadeIn var(--motion-base) var(--ease-standard);
            content-visibility: auto;
            contain-intrinsic-size: 900px;
          }

          .page-shell-glow.conversation-mode {
            min-height: 100vh;
          }

          .page-content::-webkit-scrollbar {
            width: 8px;
          }

          .page-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .page-content::-webkit-scrollbar-thumb {
            background: color-mix(in srgb, var(--muted) 45%, transparent);
            border-radius: 999px;
          }

          .page-content::-webkit-scrollbar-thumb:hover {
            background: color-mix(in srgb, var(--muted) 70%, transparent);
          }

          @keyframes pageFadeIn {
            from {
              opacity: 0;
              transform: translate3d(0, 10px, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }

          @media (max-width: 1023px) {
            .page-content:not(.conversation-mode) {
              padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px));
              padding-top: calc(env(safe-area-inset-top, 0px));
              -webkit-overflow-scrolling: touch;
              overscroll-behavior-y: contain;
            }

            /* على الموبايل، الـ page-shell لا يأخذ مساحة أكبر من اللازم */
            .page-shell-glow {
              min-height: auto;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .page-content,
            .page-shell-glow {
              animation: none;
              transition: none;
              scroll-behavior: auto;
            }
          }
        `,
      }} />
    </div>
  );
}
