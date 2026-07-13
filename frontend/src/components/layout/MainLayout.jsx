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
  const searchParams = new URLSearchParams(location.search);
  const isStoriesRoute = location.pathname === '/stories';
  const isGroupChatRoute = /^\/groups\/[^/]+\/chat$/.test(location.pathname);
  const isPostComposerRoute =
    location.pathname === '/post/compose' ||
    location.pathname === '/post/new' ||
    (location.pathname === '/compose' && String(searchParams.get('tab') || '').toLowerCase() === 'post');
  const pageRole = isStoriesRoute
    ? 'stories'
    : isGroupChatRoute
      ? 'group-chat'
      : isPostComposerRoute
        ? 'post-composer'
        : 'generic';
  // وضع الريلز: الهيدر العلوي مُخفي تمامًا (v44 — TikTok pure mode)
  // المحتوى يملأ كامل الشاشة، ويتم الاكتفاء بالشريط العائم الداخلي (استكشف/أتابعه/لك + بحث + LIVE)
  const isReelsRoute = location.pathname === '/reels' || location.pathname.startsWith('/reels/');
  // v50 — صفحة الإنشاء الموحّدة (رفع ريل/منشور/ستوري) تعمل بوضع fullscreen — إخفاء الهيدر العلوي والفوتر
  const isComposerRoute =
    location.pathname === '/compose' ||
    location.pathname.startsWith('/compose/') ||
    location.pathname.startsWith('/reels/compose') ||
    location.pathname.startsWith('/reels/new') ||
    location.pathname.startsWith('/post/compose') ||
    location.pathname.startsWith('/post/new');
  const showChrome = !hideNav && !isConversationRoute && !isComposerRoute; // إظهار الهيدر/الفوتر الموحّدين
  // v44: في الريلز نُخفي الهيدر العلوي بالكامل ونُبقي الفوتر فقط
  const showTopBar = showChrome && !isReelsRoute;
  const showBottomNav = showChrome;
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
      className={`app-shell yamshat-shell yamshat-unified ${nativeShell ? 'native-shell' : ''} ${isConversationRoute ? 'conversation-shell' : ''} ${isReelsRoute ? 'reels-shell' : ''} ${pageRole !== 'generic' ? `page-${pageRole}` : ''}`}
      data-page={pageRole}
    >
      {/* v44: الهيدر العلوي الموحّد مخفي بالكامل داخل الريلز (TikTok pure mode) */}
      {showTopBar ? <MobileTopBar transparent={false} /> : null}

      <div className={`main-shell ${nativeShell ? 'native-shell' : ''}`}>
        <main
          className={`page-content ${nativeShell ? 'native-shell' : ''} ${isTransitioning ? 'is-transitioning' : ''} ${isConversationRoute ? 'conversation-mode' : ''} ${lockScroll ? 'lock-scroll' : ''} ${showChrome ? 'with-fixed-chrome' : ''} ${isReelsRoute ? 'reels-mode' : ''} ${pageRole !== 'generic' ? `page-${pageRole}` : ''}`}
          data-page={pageRole}
          ref={mainRef}
        >
          <div className={`page-shell-glow ${isConversationRoute ? 'conversation-mode' : ''} ${isReelsRoute ? 'reels-mode' : ''} ${pageRole !== 'generic' ? `page-shell-${pageRole}` : ''}`} data-page-shell={pageRole} key={location.pathname}>
            {children}
          </div>
        </main>
      </div>

      {/* الشريط السفلي الموحّد — مثبّت في كل الصفحات (بما فيها الريلز) */}
      {showBottomNav ? <BottomNav /> : null}
      {showNotificationPrompt ? <NotificationPermissionPrompt /> : null}

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ✅ v59.13.26 — نفس بصمة .ym-reels-root بالضبط (position:fixed/inset:0)
             الهدف: نجعل .app-shell شاشة كاملة محصورة، وحاوية التمرير الفعلية
             (.page-content) تنشأ كـ position:absolute داخلها — مماثل تماماً
             للريلز الذي يعمل بسلاسة في كل المتصفحات والأجهزة. */
          .app-shell.yamshat-unified {
            display: flex;
            flex-direction: column;
            height: 100vh;
            height: 100dvh;
            min-height: 100vh;
            min-height: 100dvh;
            background: #0A0D1A;
            overflow: hidden;
            --yam-top-chrome-height: 54px;
            --yam-bottom-chrome-height: calc(64px + env(safe-area-inset-bottom, 0px));
            font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
            width: 100%;
            max-width: 100vw;
            position: relative;
            touch-action: pan-y pinch-zoom;
          }
          /* ✅ v47.4: ضمان عدم خروج أي عنصر عن حدود الشاشة */
          @media (max-width: 400px) {
            .app-shell.yamshat-unified {
              --yam-top-chrome-height: 52px;
              --yam-bottom-chrome-height: calc(60px + env(safe-area-inset-bottom, 0px));
            }
          }
          @media (max-width: 360px) {
            .app-shell.yamshat-unified {
              --yam-top-chrome-height: 50px;
              --yam-bottom-chrome-height: calc(58px + env(safe-area-inset-bottom, 0px));
            }
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

          /* ✅ v59.13.26 — .main-shell كحاوية شاشة كاملة (مثل .ym-reels-root) */
          .main-shell {
            position: relative;
            flex: 1 1 auto;
            min-width: 0;
            min-height: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          /* ⭐ v59.13.26 — "بصمة الريلز" الحقيقية:
             .page-content = position:absolute; inset:0; overflow-y:auto
             مطابقة 1:1 لـ .ym-reels-feed التي يشهد لها المستخدم بأنها سلسة.
             هذا يضمن:
             - حاوية التمرير لها أبعاد ثابتة (inset:0) → المتصفح يعرف بالضبط
               متى يفعّل momentum scroll بدلاً من الاعتماد على flex+height:100%
             - لا تحتاج إلى transform:translateZ(0) (التي تكسر position:fixed لأبنائها)
             - touch-action:pan-y فقط (نفس الريلز) — لا pan-x لأنها صفحات عمودية */
          .page-content {
            position: absolute;
            inset: 0;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
            transition: opacity var(--motion-fast, 180ms);
            overflow-anchor: none;
            /* ⭐ v78 ROOT FIX: تم إزالة scrollbar-gutter: stable
               لأنه في RTL يحجز 15px من الحافة اليمنى
               ويجعل كل المحتوى ينزاح لليسار. الـ v78 CSS
               يخفي scrollbar بديلاً على الموبايل. */
            scrollbar-gutter: auto;
            will-change: auto;
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

          /* lock-scroll: تعطيل تمرير الأم فقط — الأبناء (قوائم الشات، رسائل...)
             تبقى بـ touch-action:pan-y لتعمل scroll بشكل طبيعي */
          .page-content.lock-scroll {
            overflow: hidden;
            touch-action: pan-y;
          }

          .page-content.is-transitioning {
            opacity: 0.985;
          }

          /* ✅ v59.13.26 — page-shell-glow يجب أن لا يقيّد ارتفاع المحتوى
             ليحدث overflow الطبيعي على .page-content مثل .ym-reels-feed */
          .page-shell-glow {
            min-height: 100%;
            width: 100%;
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
