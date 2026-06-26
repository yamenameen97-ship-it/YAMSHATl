/**
 * usePullToRefresh — v59.13.24 (Reels-Style Free Scroll Edition)
 * ----------------------------------------------------------------------
 * 🔴 المشكلة المُبلَّغ عنها من المستخدم:
 *   "المس والسحب بالصفحة الرئيسية لا يعمل عندما أريد أن أسحب لفوق/تحت ما
 *    يعمل أبداً. ادرس ذلك من خلال صفحة الريلز لأن صفحة الريلز تعمل بسلاسة.
 *    السحب حالياً بالصفحة الرئيسية ما في إلا بالأطراف القصوى ما أستطيع
 *    السحب من أي منطقة."
 *
 * 🔎 التحليل (لماذا الريلز تعمل والصفحة الرئيسية لا):
 *   - في MobileLayout، صفحة /reels مُعطّل لها PullToRefresh (disablePullToRefresh = true).
 *   - النتيجة: الـ Hook لا يُلصق أي معالج touch على الـ DOM في الريلز.
 *   - فيستطيع المتصفح إدارة التمرير العمودي الأصلي بحرية تامة.
 *
 *   - في الصفحة الرئيسية، الـ Hook يُلصق:
 *     • touchstart على document {capture:true}
 *     • touchmove على document {capture:true, passive:false}
 *
 *   - في إصدار v59.13.22 كانت معالجات الـ Hook على document مع capture:true.
 *     عند بدء أي لمس داخل main، يصل الحدث إلى الـ Hook قبل المتصفح.
 *     على بعض إصدارات Chrome Android (خاصة Redmi/Honor/Galaxy A)
 *     وجود معالج {passive:false, capture:true} على document.touchmove
 *     يُجبر المتصفح على تعطيل التمرير "السلس" الأصلي حتى لو لم نستدعِ
 *     preventDefault — لأن المتصفح لا يستطيع توقّع متى ستستدعيه.
 *     النتيجة: التمرير يصبح "خشناً" ولا يستجيب إلا من الحواف الفارغة.
 *
 * ✅ الحل في v59.13.24 (محاكاة نمط الريلز):
 *
 *   1) ⭐ إلصاق المعالجات على الـ scrollContainer (main.mobile-main-content)
 *      بدل document. الـ Hook لا يحجز touchmove على document بعد الآن.
 *
 *   2) ⭐ touchmove يبقى {passive:true} ما دام السحب لم يثبت أنه PTR.
 *      عند ثبوت الـ PTR (sustained downward pull من scrollTop=0)، نُحوّل
 *      إلى مسار غير-passive عبر مستمع ثانٍ مؤقت ونستدعي preventDefault.
 *
 *      🔧 ملاحظة: في الإصدارات الحديثة من Chrome/Safari، حتى مع passive:false
 *      المتصفح يحترم touch-action: pan-y ويسمح بالتمرير العمودي الطبيعي
 *      ما لم نستدعي preventDefault. لذا الحل العملي: نستخدم passive:false
 *      ولكن لا نستدعي preventDefault أبداً قبل ثبوت الـ PTR. كما نُلصق
 *      المعالج على scrollContainer (لا document) لتقليل النطاق.
 *
 *   3) ⭐ scrollContainer.scrollTop يُفحص بانتظام؛ في اللحظة التي يصبح
 *      فيها >0 (المستخدم بدأ يتمرّر فعلاً)، نُلغي محاولة PTR فوراً
 *      ونُفلت السيطرة للمتصفح.
 *
 *   4) ⭐ تجاهل الـ targets التي ليست داخل scrollContainer أو داخل
 *      overlay/modal/input/horizontal-scroller — كما في الإصدار السابق.
 *
 *   5) ⭐ الحفاظ على كل تحسينات a11y من v59.13.23 (aria-live).
 *
 * النتيجة: السحب لأعلى/لأسفل يعمل من أي مكان في الصفحة كما في الريلز،
 *           وميزة PTR لا تزال تعمل عند السحب من القمة لأسفل.
 *
 * 🔧 إصلاحات سابقة محفوظة:
 *   • Stable refs (لا re-attach storm) — v59.13.20
 *   • Race condition عند mount — v59.13.20
 *   • RTL آمن — السحب عمودي فقط — v59.13.18
 *   • Resistance لتجربة شبيهة بالتطبيقات الأصلية — v59.13.18
 *   • Haptic feedback خفيف عند التفعيل — v59.13.18
 *   • aria-live region لقارئات الشاشة — v59.13.23
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_THRESHOLD = 70;
const DEFAULT_MAX_PULL = 140;
const RESISTANCE = 2.4;
const HORIZONTAL_TOLERANCE = 10;
// ⭐ v59.13.24: نرفع عتبة التفعيل لتجنب التداخل مع التمرير الطبيعي القصير.
// إذا تحرّك الإصبع أقل من 14px عمودياً، نعتبره تمريراً عادياً وننسحب.
const ACTIVATION_DELTA = 14;

export default function usePullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  maxPull = DEFAULT_MAX_PULL,
  disabled = false,
  hapticOnTrigger = true,
  scrollContainerRef = null,
} = {}) {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ⭐ v59.13.23 a11y: رسالة تُعلَن عبر aria-live polite
  const [a11yMessage, setA11yMessage] = useState('');

  // refs مستقرة — تجنّب re-attach storm
  const isRefreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  const thresholdRef = useRef(threshold);
  const maxPullRef = useRef(maxPull);
  const hapticOnTriggerRef = useRef(hapticOnTrigger);

  useEffect(() => { isRefreshingRef.current = isRefreshing; }, [isRefreshing]);
  useEffect(() => { pullDistanceRef.current = pullDistance; }, [pullDistance]);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);
  useEffect(() => { maxPullRef.current = maxPull; }, [maxPull]);
  useEffect(() => { hapticOnTriggerRef.current = hapticOnTrigger; }, [hapticOnTrigger]);

  const stateRef = useRef({
    startY: 0,
    startX: 0,
    active: false,
    locked: false,
    triggered: false,
    cancelled: false,
    initialScrollTop: 0,
  });

  const triggerHaptic = useCallback(() => {
    if (!hapticOnTriggerRef.current) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const finishRefresh = useCallback(async () => {
    setIsRefreshing(true);
    isRefreshingRef.current = true;
    setA11yMessage('جارٍ تحديث المحتوى…');
    try {
      if (typeof onRefreshRef.current === 'function') {
        await onRefreshRef.current();
      }
      setA11yMessage('تمّ تحديث المحتوى.');
    } catch (err) {
      setA11yMessage('تعذّر تحديث المحتوى.');
      // eslint-disable-next-line no-console
      console.warn('[usePullToRefresh] onRefresh failed:', err);
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
      setPullDistance(0);
      pullDistanceRef.current = 0;
      setTimeout(() => setA11yMessage(''), 3000);
    }
  }, []);

  useEffect(() => {
    if (disabled) return undefined;
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouchDevice) return undefined;

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
      if (scrollContainerRef && scrollContainerRef.current) {
        const refEl = scrollContainerRef.current;
        if (isScrollable(refEl)) return refEl;
        for (const child of refEl.children) {
          if (isScrollable(child) && child.scrollHeight > child.clientHeight) {
            return child;
          }
        }
        if (refEl.tagName === 'MAIN' || refEl.classList.contains('mobile-main-content')) {
          return refEl;
        }
        return null;
      }
      const mainEl = document.querySelector(
        'main.mobile-main-content, .mobile-main-content, main.page-content, .page-content'
      );
      if (mainEl) return mainEl;
      let node = containerRef.current;
      while (node && node !== document.body && node !== document.documentElement) {
        if (isScrollable(node) && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
      return null;
    };

    let scrollContainer = resolveScrollContainer();
    // إعادة محاولة الحصول على scroll container إذا لم يكن جاهزاً (SPA mount race)
    let retries = 0;
    const ensureContainer = () => {
      if (!scrollContainer && retries < 10) {
        retries += 1;
        scrollContainer = resolveScrollContainer();
        if (!scrollContainer) {
          setTimeout(ensureContainer, 150);
          return;
        }
        attachListeners();
      }
    };

    const getScrollTop = () => {
      if (scrollContainer && scrollContainer !== window) {
        return scrollContainer.scrollTop || 0;
      }
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    const isInsideInteractiveOverlay = (target) => {
      if (!target || target.nodeType !== 1) return false;
      try {
        if (target.closest('[role="dialog"]:not([aria-hidden="true"])')) return true;
        if (target.closest('.modal:not([hidden]):not([aria-hidden="true"])')) return true;
        if (target.closest('.drawer:not([aria-hidden="true"])')) return true;
        if (target.closest('.bottom-sheet:not([aria-hidden="true"])')) return true;
        if (target.closest('[data-no-pull-to-refresh="true"]')) return true;
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (target.isContentEditable) return true;
        const horizontalScroller = target.closest(
          '[data-horizontal-scroll="true"], .ym-filters, .stories-row, .reels-snap, [data-reels]'
        );
        if (horizontalScroller) return true;
        if (tag === 'VIDEO') return true;
        return false;
      } catch {
        return false;
      }
    };

    const reset = () => {
      stateRef.current.active = false;
      stateRef.current.locked = false;
      stateRef.current.triggered = false;
      stateRef.current.cancelled = false;
    };

    const onTouchStart = (e) => {
      if (isRefreshingRef.current) return;
      if (!e.touches || e.touches.length !== 1) {
        stateRef.current.cancelled = true;
        return;
      }
      const t = e.touches[0];

      // ⭐ v59.13.24: نسجّل بدء اللمس فقط — لا نقرّر شيئاً بعد.
      // القرار يُتخذ في touchmove حيث نرى ما إذا كان السحب فعلاً
      // pull-to-refresh أم تمريراً طبيعياً.
      // تجاهل overlay/dialog/input/horizontal-scroller
      if (isInsideInteractiveOverlay(e.target)) {
        stateRef.current.cancelled = true;
        return;
      }

      // ⭐ نسجّل scrollTop عند بدء اللمس. سنُلغي PTR لاحقاً إن لم يكن =0
      // عند ثبوت اتجاه السحب.
      stateRef.current.startY = t.clientY;
      stateRef.current.startX = t.clientX;
      stateRef.current.initialScrollTop = getScrollTop();
      stateRef.current.active = true;
      stateRef.current.locked = false;
      stateRef.current.triggered = false;
      stateRef.current.cancelled = false;
    };

    const onTouchMove = (e) => {
      if (stateRef.current.cancelled) return;
      if (!stateRef.current.active || isRefreshingRef.current) return;
      if (!e.touches || e.touches.length !== 1) {
        stateRef.current.cancelled = true;
        if (pullDistanceRef.current !== 0) {
          setPullDistance(0);
          pullDistanceRef.current = 0;
        }
        return;
      }

      const t = e.touches[0];
      const deltaY = t.clientY - stateRef.current.startY;
      const deltaX = t.clientX - stateRef.current.startX;

      // ⭐⭐⭐ v59.13.24: قاعدة ذهبية — قبل قفل السحب على أنه PTR،
      // نتأكد من ثلاثة شروط معاً:
      //   (1) الصفحة في القمة فعلاً (scrollTop === 0)
      //   (2) السحب عمودي بوضوح (|dy| > |dx| ومسافة عمودية كافية)
      //   (3) الاتجاه نحو الأسفل (deltaY > 0)
      // إذا لم تتحقق هذه الشروط: ننسحب فوراً ولا نلمس الحدث.
      if (!stateRef.current.locked) {
        // تمرير عمودي للأعلى أو حركة أفقية → اخرج فوراً
        // واترك المتصفح يتمرّر طبيعياً.
        if (deltaY < 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
          stateRef.current.cancelled = true;
          return;
        }
        // لم نتجاوز عتبة التفعيل بعد → اخرج بصمت (نسمح للمتصفح
        // بإدارة التمرير الطبيعي خلال أول مم من السحب)
        if (deltaY < ACTIVATION_DELTA) {
          return;
        }
        // ⭐ الصفحة ليست في القمة → هذا تمرير عادي، انسحب
        if (getScrollTop() > 0 || stateRef.current.initialScrollTop > 0) {
          stateRef.current.cancelled = true;
          return;
        }
        // ⭐ سرعة أفقية ملحوظة → تمرير أفقي، انسحب
        if (Math.abs(deltaX) > HORIZONTAL_TOLERANCE) {
          stateRef.current.cancelled = true;
          return;
        }
        // ✅ كل الشروط مستوفاة: هذا فعلاً Pull-to-Refresh
        stateRef.current.locked = true;
      }

      // بعد القفل: السحب للأعلى يعني المستخدم غيّر رأيه → تصفير المسافة
      if (deltaY <= 0) {
        if (pullDistanceRef.current !== 0) {
          setPullDistance(0);
          pullDistanceRef.current = 0;
        }
        return;
      }

      // ⭐ منع التمرير الأصلي للمتصفح خلال السحب لأسفل (حتى لا يحدث
      // bounce-back قبيح ولا يتم تشغيل native PTR في PWA).
      // هذا يحدث فقط بعد قفل السحب على PTR — لا قبل.
      if (e.cancelable) {
        try { e.preventDefault(); } catch { /* ignore */ }
      }

      const resisted = Math.min(maxPullRef.current, deltaY / RESISTANCE);
      pullDistanceRef.current = resisted;
      setPullDistance(resisted);

      const curThreshold = thresholdRef.current;
      if (!stateRef.current.triggered && resisted >= curThreshold) {
        stateRef.current.triggered = true;
        triggerHaptic();
        setA11yMessage('حرّر للتحديث');
      } else if (stateRef.current.triggered && resisted < curThreshold) {
        stateRef.current.triggered = false;
        setA11yMessage('اسحب للتحديث');
      }
    };

    const onTouchEnd = () => {
      if (!stateRef.current.active) {
        reset();
        return;
      }
      const wasTriggered = stateRef.current.triggered && stateRef.current.locked;
      reset();
      if (wasTriggered && !isRefreshingRef.current) {
        finishRefresh();
      } else {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    };

    // ⭐⭐⭐ v59.13.24: إلصاق المعالجات على scrollContainer (main) بدلاً
    // من document. هذا يقلّل نطاق المعالج بحيث لا يتدخل في أي حدث
    // touch خارج main (BottomNav / TopBar / Drawer ...) — تماماً كما
    // تفعل صفحة الريلز التي لا يوجد لها معالج PTR إطلاقاً.
    //
    // - passive:false على touchmove: نحتاجه لـ preventDefault بعد قفل PTR.
    //   ⚠️ المتصفحات الحديثة تحترم touch-action: pan-y وتسمح بالتمرير
    //   العمودي الطبيعي حتى مع passive:false ما لم نستدعِ preventDefault.
    // - passive:true على touchstart/end: لا نحتاج preventDefault.
    // - capture:false: نسمح للأبناء بمعالجة الحدث أولاً (أزرار/روابط
    //   تعمل بشكل طبيعي).
    let detachListeners = null;
    const attachListeners = () => {
      if (!scrollContainer) return;
      const target = scrollContainer;
      const moveOpts = { passive: false };
      const passiveOpts = { passive: true };
      target.addEventListener('touchstart', onTouchStart, passiveOpts);
      target.addEventListener('touchmove', onTouchMove, moveOpts);
      target.addEventListener('touchend', onTouchEnd, passiveOpts);
      target.addEventListener('touchcancel', onTouchEnd, passiveOpts);
      detachListeners = () => {
        target.removeEventListener('touchstart', onTouchStart, passiveOpts);
        target.removeEventListener('touchmove', onTouchMove, moveOpts);
        target.removeEventListener('touchend', onTouchEnd, passiveOpts);
        target.removeEventListener('touchcancel', onTouchEnd, passiveOpts);
      };
    };

    if (scrollContainer) {
      attachListeners();
    } else {
      ensureContainer();
    }

    return () => {
      if (detachListeners) detachListeners();
    };
  }, [disabled, scrollContainerRef, triggerHaptic, finishRefresh]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= threshold,
    progress: Math.min(1, pullDistance / threshold),
    a11yMessage,
  };
}
