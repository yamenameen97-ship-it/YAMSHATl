/**
 * usePullToRefresh — v59.13.18 (Direct Scroll-Container Ref)
 * ----------------------------------------------------------
 * Hook عام للسحب من أعلى لتحديث الصفحة (Pull-to-Refresh)
 *
 * 🔧 إصلاح v59.13.18 (الإصلاح الجذري للسحب بين الصفحات):
 *   • قبلًا: كان الـ hook يستخدم document.querySelector('main.mobile-main-content')
 *     لإيجاد حاوية التمرير. هذا فشل في بعض الصفحات لأن:
 *       - DOM لم يكن جاهزاً وقت الـ effect
 *       - بعض الصفحات تستخدم حاوية تمرير داخلية مختلفة
 *       - أي تغيير في أسماء الـ classes كان يكسر السحب صامتاً
 *   • الآن: الـ hook يقبل scrollContainerRef خارجي يتم تمريره مباشرة
 *     من MainLayout (الـ ref الفعلي على عنصر <main>).
 *     النتيجة: نفس عنصر التمرير في كل الصفحات بدون اعتماد على CSS classes.
 *
 *   ✅ الاتصال الجديد:
 *     MobileLayout → mainRef → PullToRefresh(scrollContainerRef={mainRef})
 *                 → usePullToRefresh({ scrollContainerRef })
 *
 * 🔧 إصلاحات سابقة محفوظة:
 *   • passive listeners افتراضياً (لا يخنق التمرير)
 *   • preventDefault يُستدعى فقط عند سحب فعلي من scrollTop=0
 *   • تعطيل تلقائي إذا لم يكن الجهاز touch
 *   • تجاهل multi-touch (pinch zoom)
 *   • RTL آمن — السحب عمودي فقط
 *   • مقاومة (resistance) لتجربة شبيهة بالتطبيقات الأصلية
 *   • Haptic feedback خفيف عند التفعيل
 *   • تنظيف آمن لمستمعي الأحداث
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_THRESHOLD = 70;
const DEFAULT_MAX_PULL = 140;
const RESISTANCE = 2.4;
const HORIZONTAL_TOLERANCE = 12; // إن تجاوزت الحركة الأفقية هذا الرقم → ألغِ السحب
const ACTIVATION_DELTA = 6;      // الحد الأدنى لاعتبار اللمس "سحب"

export default function usePullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  maxPull = DEFAULT_MAX_PULL,
  disabled = false,
  hapticOnTrigger = true,
  scrollContainerRef = null, // ⭐ v59.13.18: مرجع خارجي لحاوية التمرير الفعلية
} = {}) {
  // containerRef داخلي يستخدمه PullToRefresh لتحريك الـ indicator (لفّ المحتوى)
  // أما scrollContainerRef فهو حاوية التمرير الحقيقية القادمة من MainLayout.
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const stateRef = useRef({
    startY: 0,
    startX: 0,
    active: false,
    locked: false,        // قُفل كسحب فعلي
    triggered: false,
    cancelled: false,
  });

  const triggerHaptic = useCallback(() => {
    if (!hapticOnTrigger) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
    } catch {
      /* ignore */
    }
  }, [hapticOnTrigger]);

  const finishRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[usePullToRefresh] onRefresh failed:', err);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (disabled) return undefined;
    if (typeof window === 'undefined') return undefined;

    // فقط على أجهزة اللمس
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice) return undefined;

    // ──────────────────────────────────────────────────────────────
    // v59.13.18: إيجاد حاوية التمرير — الأولوية المطلقة للـ ref الخارجي
    // ──────────────────────────────────────────────────────────────
    // 1) إذا كان scrollContainerRef.current موجوداً → استخدمه دائماً.
    //    هذا يضمن أن السحب يعمل في كل صفحة بدون اعتماد على CSS classes.
    // 2) إذا لم يُمرَّر → fallback ذكي: ابحث في الـ DOM (للتوافق العكسي).
    // 3) إذا فشل كل شيء → window/document (سلوك Desktop القديم).
    // Helper: هل هذا العنصر حاوية تمرير فعلية؟
    const isScrollable = (el) => {
      if (!el || el.nodeType !== 1) return false;
      try {
        const style = window.getComputedStyle(el);
        return /(auto|scroll)/.test(style.overflowY);
      } catch {
        return false;
      }
    };

    const resolveScrollContainer = () => {
      // 1) Direct ref — الطريقة الموصى بها (MainLayout يمرّر mainRef)
      if (scrollContainerRef && scrollContainerRef.current) {
        const refEl = scrollContainerRef.current;
        // إذا كان العنصر نفسه قابلاً للتمرير → استخدمه مباشرة
        if (isScrollable(refEl)) return refEl;
        // وإلا تحقّق من أول أبنائه لعلّ التمرير داخلي (حالة wrapper بـ overflow:hidden)
        for (const child of refEl.children) {
          if (isScrollable(child) && child.scrollHeight > child.clientHeight) {
            return child;
          }
        }
        // إذا لم يكن تمريراً حقيقياً (مثل desktop overflow:hidden) → fallback إلى window
        // بإرجاع null هنا حتى يتم تفعيل fallback window.scrollY
        if (!isScrollable(refEl)) return null;
        return refEl;
      }

      // 2) Legacy fallback — للتوافق مع الكود القديم الذي لا يمرّر ref
      const mainEl = typeof document !== 'undefined'
        ? document.querySelector('main.mobile-main-content, .mobile-main-content, main.page-content, .page-content')
        : null;
      if (mainEl && isScrollable(mainEl)) {
        return mainEl;
      }

      // 3) ابدأ من containerRef الداخلي واصعد لأعلى
      let node = containerRef.current;
      while (node && node !== document.body && node !== document.documentElement) {
        if (isScrollable(node) && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }

      // 4) Fallback نهائي: window/document
      return null;
    };

    let scrollContainer = resolveScrollContainer();

    // نُعيد البحث على onTouchStart فقط إن لم نكن قد وجدنا الحاوية بعد
    const refreshScrollContainer = () => {
      scrollContainer = resolveScrollContainer();
    };

    const getScrollTop = () => {
      if (scrollContainer) {
        return scrollContainer.scrollTop || 0;
      }
      // Fallback القديم — يعمل في صفحات الـ Desktop بدون scroll container
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    const reset = () => {
      stateRef.current.active = false;
      stateRef.current.locked = false;
      stateRef.current.triggered = false;
      stateRef.current.cancelled = false;
    };

    const onTouchStart = (e) => {
      if (isRefreshing) return;
      if (!e.touches || e.touches.length !== 1) {
        // pinch / multi-touch → تجاهل
        stateRef.current.cancelled = true;
        return;
      }
      // v59.13.18: حدّث مرجع الـ scroll container إن لم يكن جاهزاً
      if (!scrollContainer) refreshScrollContainer();
      if (getScrollTop() > 0) {
        stateRef.current.cancelled = true;
        return;
      }
      const t = e.touches[0];
      stateRef.current.startY = t.clientY;
      stateRef.current.startX = t.clientX;
      stateRef.current.active = true;
      stateRef.current.locked = false;
      stateRef.current.triggered = false;
      stateRef.current.cancelled = false;
    };

    const onTouchMove = (e) => {
      if (stateRef.current.cancelled) return;
      if (!stateRef.current.active || isRefreshing) return;
      if (!e.touches || e.touches.length !== 1) {
        stateRef.current.cancelled = true;
        if (pullDistance !== 0) setPullDistance(0);
        return;
      }

      const t = e.touches[0];
      const deltaY = t.clientY - stateRef.current.startY;
      const deltaX = t.clientX - stateRef.current.startX;

      // لم نقفل بعد كسحب — افحص الاتجاه أولاً
      if (!stateRef.current.locked) {
        // إذا كانت الحركة أفقية أو لأعلى → ألغِ
        if (Math.abs(deltaX) > HORIZONTAL_TOLERANCE || deltaY < ACTIVATION_DELTA) {
          // ربما swipe جانبي أو scroll لأعلى → دعه
          if (deltaY < 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
            stateRef.current.cancelled = true;
            if (pullDistance !== 0) setPullDistance(0);
            return;
          }
        }
        // إذا تجاوز deltaY الحد الأدنى → اقفل كسحب
        if (deltaY >= ACTIVATION_DELTA) {
          // تأكد مرة أخرى من scrollTop = 0
          if (getScrollTop() > 0) {
            stateRef.current.cancelled = true;
            if (pullDistance !== 0) setPullDistance(0);
            return;
          }
          stateRef.current.locked = true;
        } else {
          return;
        }
      }

      // الآن نحن في وضع سحب مؤكد
      if (deltaY <= 0) {
        if (pullDistance !== 0) setPullDistance(0);
        return;
      }

      // الآن فقط يُسمح بـ preventDefault لمنع scroll الافتراضي
      if (e.cancelable) {
        try { e.preventDefault(); } catch { /* ignore */ }
      }

      const resisted = Math.min(maxPull, deltaY / RESISTANCE);
      setPullDistance(resisted);

      if (!stateRef.current.triggered && resisted >= threshold) {
        stateRef.current.triggered = true;
        triggerHaptic();
      } else if (stateRef.current.triggered && resisted < threshold) {
        stateRef.current.triggered = false;
      }
    };

    const onTouchEnd = () => {
      if (!stateRef.current.active) {
        reset();
        return;
      }
      const wasTriggered = stateRef.current.triggered && stateRef.current.locked;
      reset();
      if (wasTriggered && !isRefreshing) {
        finishRefresh();
      } else {
        setPullDistance(0);
      }
    };

    // ⚠️ touchmove يجب أن يكون non-passive حتى يستطيع preventDefault
    //    لكن نتأكد من عدم استدعاء preventDefault إلا في وضع locked
    const opts = { passive: false };
    const passiveOpts = { passive: true };

    // v59.13.18: نُرفِق المستمعين على الـ scroll container الفعلي إن وُجد،
    // وإلا نقع على window (Desktop fallback). هذا يضمن أن الـ hook
    // لا يخنق التمرير في صفحات الجوال (حيث body مقفول overflow:hidden).
    const target = scrollContainer || window;

    target.addEventListener('touchstart', onTouchStart, passiveOpts);
    target.addEventListener('touchmove', onTouchMove, opts);
    target.addEventListener('touchend', onTouchEnd, passiveOpts);
    target.addEventListener('touchcancel', onTouchEnd, passiveOpts);

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
      target.removeEventListener('touchcancel', onTouchEnd);
    };
    // scrollContainerRef نفسه stable (useRef) لكن نضمّنه احتياطاً
  }, [disabled, isRefreshing, threshold, maxPull, pullDistance, finishRefresh, triggerHaptic, scrollContainerRef]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= threshold,
    progress: Math.min(1, pullDistance / threshold),
  };
}
