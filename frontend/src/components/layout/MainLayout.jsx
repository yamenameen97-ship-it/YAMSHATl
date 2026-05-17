import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Topbar from './Topbar.jsx';
import MobileDock from './MobileDock.jsx';
import { isNativeShell } from '../../utils/runtime.js';
import { getScrollPosition, prefetchCriticalRoutes, saveScrollPosition } from '../../utils/navigation.js';

export default function MainLayout({ children }) {
  const nativeShell = isNativeShell();
  const location = useLocation();
  const mainRef = useRef(null);
  const frameRef = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isConversationRoute = /^\/chat\/[^/]+/.test(location.pathname);
  const showTopbar = !nativeShell && !isConversationRoute;
  const showDock = !nativeShell && !isConversationRoute;

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
          className={`page-content ${nativeShell ? 'native-shell' : ''} ${isTransitioning ? 'is-transitioning' : ''} ${isConversationRoute ? 'conversation-mode' : ''}`}
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
            height: 100vh;
            background:
              radial-gradient(circle at top, rgba(59,130,246,0.08), transparent 34%),
              linear-gradient(180deg, #07111f 0%, #0f172a 34%, #08101d 100%);
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
            transition: opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease;
            will-change: transform, opacity;
          }

          .page-content.conversation-mode {
            overflow: hidden;
            padding-bottom: 0;
          }

          .page-content.is-transitioning {
            opacity: 0.96;
            transform: translate3d(0, 8px, 0);
            filter: saturate(0.95);
          }

          .page-content.native-shell {
            padding-bottom: 68px;
          }

          .page-shell-glow {
            min-height: 100%;
            animation: pageFadeIn 260ms cubic-bezier(0.22, 1, 0.36, 1);
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
            background: rgba(148, 163, 184, 0.35);
            border-radius: 999px;
          }

          .page-content::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.55);
          }

          @keyframes pageFadeIn {
            from {
              opacity: 0;
              transform: translate3d(0, 12px, 0) scale(0.995);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @media (max-width: 768px) {
            .app-shell {
              flex-direction: column;
            }

            .page-content:not(.conversation-mode) {
              padding-bottom: 78px;
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
