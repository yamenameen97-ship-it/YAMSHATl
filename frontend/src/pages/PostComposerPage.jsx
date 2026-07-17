import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PostComposer from '../components/feed/PostComposer.jsx';

/**
 * PostComposerPage — v88.3 (ROOT FIX: السحب لأعلى وأسفل يعمل بسلاسة على ويب الجوال)
 * ----------------------------------------------------------------
 * سبب الفشل السابق (v88.2 وأقدم):
 *   الصفحة كانت تُعرض داخل شجرة `.page-content` (position:absolute;inset:0;overflow-y:auto)
 *   داخل `MainLayout`. عندما وضعنا `.ympc-page` بـ position:fixed;inset:0 داخل هذه
 *   الحاوية، على WebView الجوال (Chrome Android / Samsung Internet / WebView داخل
 *   التطبيق) تحدث ظاهرة "double scroll container" — الحاوية الأم تلتقط touchmove
 *   الأول وتلغيه قبل أن تصل إلى الحاوية الداخلية، فيتجمّد السحب رأسياً.
 *
 * الحل الجذري (مأخوذ من ReportModal.jsx الذي يعمل بنجاح 100%):
 *   1) استخدام createPortal لعرض الصفحة مباشرة كطفل لـ document.body — بذلك تخرج
 *      كلياً من شجرة `.app-shell/.page-content` ولا تتأثر بأي overflow أو contain
 *      أو transform من الطبقات الأم.
 *   2) بنية flex-column ثابتة:
 *        - الهيدر (flex:0 0 auto) — sticky بصرياً بلا أي CSS معقد
 *        - منطقة التمرير (flex:1 1 auto; overflow-y:auto; -webkit-overflow-scrolling:touch)
 *        - shell خارجي position:fixed;inset:0;overflow:hidden — يمنع body من التمرير
 *   3) قفل تمرير body أثناء فتح الصفحة (مثل المودال) لضمان أن المتصفح يوجّه كل
 *      touchmove العمودي إلى منطقة التمرير الداخلية فقط.
 *   4) touch-action:pan-y صريح + overscroll-behavior-y:contain لمنع pull-to-refresh
 *      ومنع أي bubbling للأعلى.
 *
 * النتيجة: نفس بصمة السحب الناجحة في ReportModal — يعمل على iOS Safari و Chrome
 * Android و Samsung Internet و WebView داخل التطبيق و Firefox Mobile.
 *
 * RTL كامل + Noto Sans Arabic.
 */
export default function PostComposerPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Page-level title
  useEffect(() => {
    const prev = document.title;
    document.title = 'منشور جديد · YAMSHAT';
    return () => { document.title = prev; };
  }, []);

  // ✅ v88.3: قفل تمرير body أثناء فتح الصفحة — مثل المودال بالضبط.
  // هذا يمنع المتصفح من محاولة تمرير .page-content الأم عندما يلمس المستخدم الشاشة،
  // ويضمن توجيه كل touchmove العمودي إلى منطقة التمرير الداخلية للصفحة.
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // ✅ v88.3: عند فتح الصفحة، نُصعّد التمرير الداخلي إلى الأعلى (كي لا يبدأ من موضع
  // متبقٍ من صفحة أخرى — سلوك متوقع من صفحة إنشاء منشور جديد).
  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      try { node.scrollTop = 0; } catch { /* ignore */ }
    }
  }, []);

  const content = (
    <div
      dir="rtl"
      className="ympc-portal-shell"
      data-yam-post-composer="true"
      style={{
        // ⭐ position:fixed;inset:0 يعزل الصفحة كلياً عن أي scroll container أم.
        position: 'fixed',
        inset: 0,
        zIndex: 10040,
        display: 'flex',
        flexDirection: 'column',
        background: '#0A0A0F',
        color: '#F4F4F5',
        fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif",
        // منع تمرير الـ shell نفسه (فقط الابن الداخلي يتمرر) — بصمة ReportModal.
        overflow: 'hidden',
        // منع pull-to-refresh على الجوال والسحب الأفقي.
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        // كسر أي contain/transform موروثة قد تعطل position:fixed.
        transform: 'none',
        filter: 'none',
        perspective: 'none',
        contain: 'none',
        willChange: 'auto',
        pointerEvents: 'auto',
      }}
    >
      {/* الشريط العلوي — flex:0 0 auto — لا يتمرر ولا يختفي */}
      <header
        className="ympc-top-fixed"
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px',
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          background: 'rgba(10, 10, 15, 0.96)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 5,
          touchAction: 'manipulation',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="رجوع"
          title="رجوع"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(139, 92, 246, 0.10)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            color: '#E5E7EB',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: 'scaleX(-1)' }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#F4F4F5',
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          منشور جديد
        </h1>
        <div style={{ width: 40, height: 40 }} aria-hidden />
      </header>

      {/* ⭐ منطقة التمرير الداخلية — نفس بصمة ReportModal بالضبط.
          هذا هو العنصر الوحيد الذي يستقبل touchmove العمودي ويتمرر. */}
      <main
        ref={scrollRef}
        className="ympc-scroll-area"
        style={{
          flex: '1 1 auto',
          minHeight: 0, // ⭐ حرج داخل flex-column على iOS Safari
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          overscrollBehaviorX: 'none',
          touchAction: 'pan-y',
          scrollBehavior: 'smooth',
          // كسر أي contain موروثة قد تعطل momentum scroll
          contain: 'none',
          willChange: 'scroll-position',
          transform: 'none',
          filter: 'none',
          perspective: 'none',
          pointerEvents: 'auto',
          // padding سفلي كافٍ ليتنفس زر النشر فوق BottomNav لو كان ظاهراً
          paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          className="ympc-wrap-inner"
          style={{
            width: 'min(100%, 720px)',
            margin: '0 auto',
            padding: '14px 12px 24px',
            boxSizing: 'border-box',
            touchAction: 'pan-y',
            pointerEvents: 'auto',
          }}
        >
          <PostComposer />
        </div>
      </main>

      {/* حقن CSS مضاد: نضمن أن أي طبقة legacy لا تكسر السحب داخل الصفحة */}
      <style>{`
        /* ✅ v88.3 — Portal shell محصّن ضد أي CSS legacy */
        .ympc-portal-shell,
        .ympc-portal-shell * {
          -webkit-tap-highlight-color: transparent;
        }
        .ympc-portal-shell .ympc-scroll-area {
          -webkit-overflow-scrolling: touch !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          touch-action: pan-y !important;
          overscroll-behavior-y: contain !important;
          contain: none !important;
          transform: none !important;
          filter: none !important;
          perspective: none !important;
        }
        /* textarea و contenteditable لا يبتلعان السحب العمودي — pan-y فقط */
        .ympc-portal-shell textarea,
        .ympc-portal-shell [contenteditable="true"],
        .ympc-portal-shell .composer-textarea {
          touch-action: pan-y !important;
          overscroll-behavior: contain !important;
          pointer-events: auto !important;
        }
        /* الأزرار والروابط داخل الصفحة: manipulation لتفعيل النقر السريع */
        .ympc-portal-shell button,
        .ympc-portal-shell a,
        .ympc-portal-shell label,
        .ympc-portal-shell [role="button"] {
          touch-action: manipulation;
          pointer-events: auto !important;
        }
        /* scrollbar لطيف على الديسكتوب فقط */
        .ympc-portal-shell .ympc-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .ympc-portal-shell .ympc-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .ympc-portal-shell .ympc-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.45);
          border-radius: 999px;
        }
        @media (max-width: 768px) {
          .ympc-portal-shell .ympc-scroll-area {
            scrollbar-width: none;
          }
          .ympc-portal-shell .ympc-scroll-area::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
        }
        /* iOS Safari: momentum scroll تفعيل قوي */
        @supports (-webkit-touch-callout: none) {
          .ympc-portal-shell .ympc-scroll-area {
            -webkit-overflow-scrolling: touch !important;
            overflow-y: auto !important;
            touch-action: pan-y !important;
          }
        }
        /* حماية قصوى: أي طبقة CSS قديمة تضع touch-action:none أو pointer-events:none
           على أطفال الـ portal — نبطلها بلطف. */
        .ympc-portal-shell:not(.ympc-force-no-touch),
        .ympc-portal-shell:not(.ympc-force-no-touch) .ympc-scroll-area {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );

  // ⭐ createPortal → document.body: الصفحة تخرج كلياً من شجرة .app-shell/.page-content
  // ولا يمكن لأي CSS من طبقات الـ layout أن يكسر السحب داخلها.
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
