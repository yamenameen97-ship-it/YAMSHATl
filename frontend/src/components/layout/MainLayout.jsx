import { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileDock from './MobileDock.jsx';
import { isNativeShell } from '../../utils/runtime.js';

/**
 * MainLayout Component
 * Features: Transitions, Scroll restoration, Responsive polish, Adaptive navigation
 */
export default function MainLayout({ children }) {
  const nativeShell = isNativeShell();
  const mainRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  /**
   * Handles scroll restoration
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Restores scroll position on page navigation
   */
  useEffect(() => {
    // Restore scroll position
    window.scrollTo(0, scrollPosition);

    // Add transition animation
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);

    return () => clearTimeout(timer);
  }, [children]);

  /**
   * Handles responsive layout changes
   */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Handles page transitions
   */
  const handlePageTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div className={`app-shell yamshat-shell ${nativeShell ? 'native-shell' : ''}`}>
      {!nativeShell && <Sidebar onNavigate={handlePageTransition} />}

      <div className={`main-shell ${nativeShell ? 'native-shell' : ''}`}>
        {!nativeShell && <Topbar />}

        <main
          className={`page-content ${nativeShell ? 'native-shell' : ''} ${isTransitioning ? 'is-transitioning' : ''}`}
          ref={mainRef}
        >
          <div className="page-shell-glow">{children}</div>
        </main>
      </div>

      {!nativeShell && <MobileDock onNavigate={handlePageTransition} />}

      <style dangerouslySetInnerHTML={{
        __html: `
          /* App Shell */
          .app-shell {
            display: flex;
            height: 100vh;
            background: #ffffff;
            overflow: hidden;
          }

          .app-shell.native-shell {
            flex-direction: column;
          }

          /* Main Shell */
          .main-shell {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
          }

          .main-shell.native-shell {
            width: 100%;
          }

          /* Page Content */
          .page-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            transition: opacity 0.3s ease-out;
          }

          .page-content.is-transitioning {
            opacity: 0.95;
          }

          .page-content.native-shell {
            padding-bottom: 60px;
          }

          /* Page Shell Glow */
          .page-shell-glow {
            min-height: 100%;
            animation: fadeIn 0.3s ease-out;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .app-shell {
              flex-direction: column;
            }

            .main-shell {
              width: 100%;
            }

            .page-content {
              padding-bottom: 60px;
            }
          }

          /* Smooth scroll behavior */
          html {
            scroll-behavior: smooth;
          }

          /* Scrollbar styling */
          .page-content::-webkit-scrollbar {
            width: 8px;
          }

          .page-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .page-content::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }

          .page-content::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }

          /* Animations */
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideInUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideInDown {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .page-content,
            .page-shell-glow {
              animation: none;
              transition: none;
            }

            html {
              scroll-behavior: auto;
            }
          }

          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .app-shell {
              background: #111827;
            }

            .page-content::-webkit-scrollbar-thumb {
              background: #4b5563;
            }

            .page-content::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
            }
          }
        `,
      }}
      />
    </div>
  );
}
