import { useEffect, useState, useCallback } from 'react';

/**
 * ScrollToTopFab — زر «العودة إلى الأعلى» يظهر فقط في شاشة المنشورات الرئيسية.
 *
 * ✨ ميزة فرونت-إند 100% — لا تتصل بأي API ولا تحتاج جداول قاعدة بيانات.
 *  - تظهر تلقائيًا عند تمرير المستخدم لأسفل أكثر من 600 بكسل.
 *  - عند النقر تُعيد السكرول إلى أعلى الصفحة بسلاسة.
 *  - تختفي عند الوصول لأعلى الصفحة.
 *  - تدعم RTL وتتجنّب التداخل مع الشريط السفلي للجوال.
 *
 * استخدام: <ScrollToTopFab /> داخل صفحة Feed فقط.
 */
export default function ScrollToTopFab({ threshold = 600, targetSelector = null }) {
  const [visible, setVisible] = useState(false);

  const getScrollContainer = useCallback(() => {
    if (targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el) return el;
    }
    return window;
  }, [targetSelector]);

  useEffect(() => {
    const container = getScrollContainer();
    const isWindow = container === window;

    const handleScroll = () => {
      const y = isWindow
        ? (window.scrollY || document.documentElement.scrollTop || 0)
        : container.scrollTop || 0;
      setVisible(y > threshold);
    };

    // فحص الحالة الأولية
    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [getScrollContainer, threshold]);

  const handleClick = useCallback(() => {
    const container = getScrollContainer();
    try {
      if (container === window) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      // متصفحات قديمة جداً — fallback بدون smooth
      if (container === window) window.scrollTo(0, 0);
      else container.scrollTop = 0;
    }
  }, [getScrollContainer]);

  return (
    <>
      <button
        type="button"
        className={`yam-scroll-top-fab ${visible ? 'is-visible' : ''}`}
        onClick={handleClick}
        aria-label="العودة إلى الأعلى"
        title="العودة إلى الأعلى"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>

      <style>{`
        .yam-scroll-top-fab {
          position: fixed;
          bottom: 96px;
          inset-inline-start: 18px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1px solid rgba(139, 92, 246, 0.45);
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(99, 102, 241, 0.95));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.35), 0 2px 6px rgba(0, 0, 0, 0.25);
          opacity: 0;
          transform: translateY(20px) scale(0.85);
          pointer-events: none;
          transition: opacity .22s ease, transform .22s ease, box-shadow .22s ease;
          z-index: 60;
        }
        .yam-scroll-top-fab.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .yam-scroll-top-fab:hover {
          box-shadow: 0 14px 36px rgba(99, 102, 241, 0.5);
          transform: translateY(-2px) scale(1.04);
        }
        .yam-scroll-top-fab:active {
          transform: translateY(0) scale(0.96);
        }
        @media (min-width: 1024px) {
          .yam-scroll-top-fab {
            bottom: 28px;
            inset-inline-start: 28px;
            width: 50px;
            height: 50px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .yam-scroll-top-fab {
            transition: opacity .2s ease;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
