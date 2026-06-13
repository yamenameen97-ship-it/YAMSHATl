import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MobileTopBar from '../mobile/MobileTopBar.jsx';
import BottomNav from '../mobile/BottomNav.jsx';
import { isNativeShell } from '../../utils/runtime.js';
import { getScrollPosition, prefetchCriticalRoutes, saveScrollPosition } from '../../utils/navigation.js';
import NotificationPermissionPrompt from '../notifications/NotificationPermissionPrompt.jsx';

/**
 * MainLayout (Unified Yamshat Shell)
 * -----------------------------------
 * - الهيدر العلوي (MobileTopBar) والشريط السفلي (BottomNav) يظهران
 *   في كل صفحة من صفحات التطبيق (الرئيسية، الدردشة، الريلز، الستوري،
 *   المجموعات، الإشعارات، الملف الشخصي ...) سواء على الموبايل أو على
 *   الويب/اللابتوب — تنفيذًا لمتطلب التثبيت الموحّد.
 * - يُسمح بإخفائهما فقط داخل شاشات المحادثة الفردية (/chat/:id) أو
 *   عند تمرير hideNav=true (مثل صفحات البث الكامل) لتجنب تضارب الـ UI.
 * - وضع الريلز (/reels): الهيدر السفلي يبقى مثبّتاً، أما الهيدر العلوي
 *   فيظهر شفافاً Overlay فوق المحتوى كي يملأ المحتوى الشاشة بالكامل
 *   (TikTok-style) كما طُلب.
 */
export default function MainLayout({ children, hideNav = false, lockScroll = false }) {
  const nativeShell = isNativeShell();
  const location = useLocation();
  const mainRef = useRef(null);
  const frameRef = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isConversationRoute = /^\/chat\/[^/]+/.test(location.pathname);
  // وضع الريلز: الهيدر العلوي شفّاف Overlay، والمحتوى يملأ كامل الشاشة
  const isReelsRoute = location.pathname === '/reels' || location.pathname.startsWith('/reels/');
  const showChrome = !hideNav && !isConversationRoute; // إظهار الهيدر/الفوتر الموحّدين
  const showNotificationPrompt = !isConversationRoute;

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
    <div
      dir="rtl"
      style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      className={`app-shell yamshat-shell yamshat-unified ${nativeShell ? 'native-shell' : ''} ${isConversationRoute ? 'conversation-shell' : ''} ${isReelsRoute ? 'reels-shell' : ''}`}
    >
      {/* الهيدر العلوي الموحّد — مثبّت في كل الصفحات (شفّاف داخل الريلز) */}
      {showChrome ? <MobileTopBar transparent={isReelsRoute} /> : null}

      <div className={`main-shell ${nativeShell ? 'native-shell' : ''}`}>
        <main
          className={`page-content ${nativeShell ? 'native-shell' : ''} ${isTransitioning ? 'is-transitioning' : ''} ${isConversationRoute ? 'conversation-mode' : ''} ${lockScroll ? 'lock-scroll' : ''} ${showChrome ? 'with-fixed-chrome' : ''} ${isReelsRoute ? 'reels-mode' : ''}`}
          ref={mainRef}
        >
          <div className={`page-shell-glow ${isConversationRoute ? 'conversation-mode' : ''} ${isReelsRoute ? 'reels-mode' : ''}`} key={location.pathname}>
            {children}
          </div>
        </main>
      </div>

      {/* الشريط السفلي الموحّد — مثبّت في كل الصفحات (بما فيها الريلز) */}
      {showChrome ? <BottomNav /> : null}
      {showNotificationPrompt ? <NotificationPermissionPrompt /> : null}

      <style dangerouslySetInnerHTML={{
        __html: `
          .app-shell.yamshat-unified {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            min-height: 100dvh;
            height: auto;
            background: #0A0D1A;
            overflow-x: hidden;
            overflow-y: visible;
            --yam-top-chrome-height: 60px;
            --yam-bottom-chrome-height: calc(70px + env(safe-area-inset-bottom, 0px));
            font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          }
          /* أي filter/transform على الجذر يكسر position:fixed لأبنائه */
          .app-shell.yamshat-unified,
          .app-shell.yamshat-unified .main-shell,
          .app-shell.yamshat-unified .page-content,
          .app-shell.yamshat-unified .page-shell-glow {
            transform: none !important;
            filter: none !important;
            perspective: none !important;
          }

          .app-shell.yamshat-unified.conversation-shell {
            --yam-top-chrome-height: 0px;
            --yam-bottom-chrome-height: 0px;
          }

          /* داخل الريلز: نُلغي بادينج المحتوى من الأعلى لأن الهيدر العلوي شفّاف فوق المحتوى */
          .app-shell.yamshat-unified.reels-shell {
            --yam-top-chrome-height: 0px;
            background: #000;
          }

          .main-shell {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
            min-width: 0;
            min-height: 0;
          }

          .page-content {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            transition: opacity var(--motion-fast, 180ms);
            /* تمّ إزالة will-change/transform لأنها تصنع containing block جديد وتكسر position:fixed للعناصر الداخلية (الهيدر/الفوتر) */
          }

          /* عند وجود هيدر/فوتر مثبّتين أضف هوامش حتى لا يختفي المحتوى تحتهما */
          .page-content.with-fixed-chrome {
            padding-top: var(--yam-top-chrome-height);
            padding-bottom: var(--yam-bottom-chrome-height);
          }

          /* وضع الريلز: لا بادينج علوي (الهيدر شفّاف فوق المحتوى) لكن نُبقي البادينج السفلي حتى لا يحجب الفوتر الفيديو */
          .page-content.reels-mode {
            padding-top: 0 !important;
          }

          .page-content.conversation-mode {
            overflow: hidden;
            padding-bottom: 0;
            padding-top: 0;
            /* داخل المحادثة أيضاً لا نريد أي transform حتى يعمل position:fixed للهيدر/الإدخال بشكل صحيح */
            transform: none !important;
            filter: none !important;
            will-change: auto !important;
          }

          .page-content.lock-scroll {
            overflow: hidden;
          }

          .page-content.is-transitioning {
            opacity: 0.985;
          }

          .page-shell-glow {
            min-height: 100%;
            animation: pageFadeIn var(--motion-base, 240ms) var(--ease-standard, ease-out);
            content-visibility: auto;
            contain-intrinsic-size: 900px;
          }

          .page-shell-glow.conversation-mode,
          .page-shell-glow.reels-mode {
            min-height: 100vh;
            min-height: 100dvh;
          }

          .page-content::-webkit-scrollbar { width: 8px; }
          .page-content::-webkit-scrollbar-track { background: transparent; }
          .page-content::-webkit-scrollbar-thumb {
            background: color-mix(in srgb, #6b7280 45%, transparent);
            border-radius: 999px;
          }
          .page-content::-webkit-scrollbar-thumb:hover {
            background: color-mix(in srgb, #6b7280 70%, transparent);
          }

          @keyframes pageFadeIn {
            from { opacity: 0; transform: translate3d(0, 10px, 0); }
            to   { opacity: 1; transform: translate3d(0, 0, 0); }
          }

          @media (min-width: 1024px) {
            .app-shell.yamshat-unified .page-content.with-fixed-chrome {
              max-width: 1200px;
              margin: 0 auto;
              width: 100%;
            }
            /* في الريلز اجعل المسرح يأخذ كامل العرض */
            .app-shell.yamshat-unified.reels-shell .page-content.with-fixed-chrome {
              max-width: 100%;
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
