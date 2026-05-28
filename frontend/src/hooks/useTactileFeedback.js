import { useEffect } from 'react';

/**
 * useTactileFeedback — Stage 5
 * --------------------------------
 * يربط على document-level أحداث pointerdown/pointerup/pointercancel
 * ويضيف على كل العناصر التفاعلية الكلاسات:
 *    .is-pressing  → عند الضغط الفوري (≤ 250ms)
 *    .is-holding   → بعد long-press (>= 380ms)
 *
 * هذا يفعّل تلقائياً الـ feedback المعرّفين في chat-premium.css و global.css
 * بدون الحاجة لتعديل كل زرّ يدوياً.
 *
 * الاستخدام:
 *   import useTactileFeedback from './hooks/useTactileFeedback';
 *   // داخل App.jsx
 *   useTactileFeedback();
 */
const TARGET_SELECTOR = [
  'button',
  'a.btn',
  '[role="button"]',
  '.btn',
  '.ds-btn',
  '[data-ds="btn"]',
  '.yam-bubble',
  '.yam-reaction-chip',
  '.yam-bubble-toolbar button',
  '.reel-action-btn',
  '.story-user-card',
  '.mini-action',
  '.ghost-btn',
  '.reaction-btn',
  '.table-link',
].join(', ');

const HOLD_DELAY = 380;

export default function useTactileFeedback() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let holdTimer = null;
    let activeEl = null;

    const cleanup = () => {
      if (activeEl) {
        activeEl.classList.remove('is-pressing', 'is-holding');
        activeEl = null;
      }
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const onPointerDown = (event) => {
      const target = event.target?.closest?.(TARGET_SELECTOR);
      if (!target) return;
      cleanup();
      activeEl = target;
      target.classList.add('is-pressing');
      holdTimer = window.setTimeout(() => {
        if (activeEl) {
          activeEl.classList.remove('is-pressing');
          activeEl.classList.add('is-holding');
        }
      }, HOLD_DELAY);
    };

    const onPointerEnd = () => {
      cleanup();
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerup', onPointerEnd, { passive: true });
    document.addEventListener('pointercancel', onPointerEnd, { passive: true });
    document.addEventListener('pointerleave', onPointerEnd, { passive: true });
    window.addEventListener('blur', onPointerEnd, { passive: true });

    return () => {
      cleanup();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerEnd);
      document.removeEventListener('pointercancel', onPointerEnd);
      document.removeEventListener('pointerleave', onPointerEnd);
      window.removeEventListener('blur', onPointerEnd);
    };
  }, []);
}
