import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * AppUpdatePrompt — v88.11 NATIVE SYSTEM-STYLE UPDATE SHEET
 * ═══════════════════════════════════════════════════════════════════
 *
 * تصميم مطابق لأسلوب نوافذ النظام (Android / PWA System Sheet):
 *   - خلفية خضراء داكنة بلمعة أنيقة (مطابقة لهوية YAMSHAT + شكل نظام)
 *   - عنوان: "تحديث جديد متاح"
 *   - زر رئيسي (أبيض بارز): "تحديث الآن"
 *   - زر ثانوي (شفاف): "لاحقاً"
 *
 * الهدف:
 *   1) استبدال بانر المتصفح/الـ HTML injection القبيح القادم من pwaInitializer.
 *   2) توحيد شكل رسالة التحديث مع باقي نظام YAMSHAT (in-app, not browser popup).
 *   3) إجبار الويب على تنزيل التحديثات الجديدة عبر:
 *      - مسح جميع الـ Service Worker caches
 *      - postMessage: SKIP_WAITING إلى الـ waiting worker
 *      - controllerchange → hard reload بدون كاش
 *
 * يستمع لأحداث:
 *   - 'yamshat:update-ready'      (registration جاهزة مع waiting worker)
 *   - 'yamshat:update-available'  (من service-worker-manager broadcast)
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const DISMISS_STORAGE_KEY = 'yamshat_update_dismissed_at';
// v88.11: قلّصنا مدة الهدوء من 6 ساعات إلى 30 دقيقة فقط
// حتى نضمن أن المستخدم يرى التحديث الجديد بشكل شبه فوري
const DISMISS_COOLDOWN_MS = 30 * 60 * 1000;

function wasRecentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0);
    if (!at) return false;
    return Date.now() - at < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/**
 * إجبار مسح جميع الكاشات (Service Worker + Browser caches)
 * لضمان تنزيل الإصدار الجديد كاملاً بدون أي بقايا.
 */
async function nukeAllCaches() {
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      console.log('[UpdatePrompt] ✅ تم مسح جميع الكاشات:', names.length);
    }
  } catch (err) {
    console.warn('[UpdatePrompt] تعذّر مسح بعض الكاشات:', err);
  }
}

/**
 * hard reload يتخطى كاش المتصفح (equivalent to Ctrl+Shift+R).
 */
function hardReload() {
  try {
    // إضافة query cache-buster لضمان طلب index.html جديد
    const url = new URL(window.location.href);
    url.searchParams.set('_v', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

export default function AppUpdatePrompt() {
  const [registration, setRegistration] = useState(null);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const controllerChangedRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────
  // مستمع أحداث SW: يعرض النافذة عند توفر تحديث
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleReady = (event) => {
      const nextRegistration = event.detail?.registration || null;
      // نقبل الحدث حتى بدون registration (بعض المسارات ترسل حدث فقط)
      if (nextRegistration) {
        setRegistration(nextRegistration);
      }
      if (wasRecentlyDismissed()) {
        setCollapsed(true);
        setVisible(true);
      } else {
        setCollapsed(false);
        setVisible(true);
      }
    };

    // ندعم الحدثَين معاً لتغطية كل مصادر الإشعار
    window.addEventListener('yamshat:update-ready', handleReady);
    window.addEventListener('yamshat:update-available', handleReady);
    return () => {
      window.removeEventListener('yamshat:update-ready', handleReady);
      window.removeEventListener('yamshat:update-available', handleReady);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // v88.11: مراقبة controllerchange — بمجرد تفعيل SW الجديد
  // ننفّذ hard reload فوراً لتحميل الأصول الجديدة كاملة.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onControllerChange = () => {
      if (controllerChangedRef.current) return;
      controllerChangedRef.current = true;
      console.log('[UpdatePrompt] ✅ SW controller changed — reloading');
      hardReload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // زر "تحديث الآن" — force update كامل
  // ─────────────────────────────────────────────────────────────────
  const handleUpdateNow = useCallback(async () => {
    setRefreshing(true);
    try {
      // مسح كل الكاشات أولاً
      await nukeAllCaches();

      // مسح دفاتر أذونات التذكير
      try {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {
        /* noop */
      }

      // محاولة تفعيل SW جديد ينتظر
      const reg =
        registration ||
        (navigator.serviceWorker && (await navigator.serviceWorker.getRegistration())) ||
        null;

      if (reg) {
        try {
          await reg.update();
        } catch {
          /* noop */
        }
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          // في العادة يتبعه controllerchange → hardReload تلقائياً
          // لكن نضع reload احتياطي بعد 1.5 ثانية في حال لم يُطلق الحدث
          setTimeout(() => {
            if (!controllerChangedRef.current) hardReload();
          }, 1500);
          return;
        }
      }

      // لا يوجد waiting worker: قد يكون التحديث بالفعل مُفعّلاً
      // نُنفّذ hard reload مباشرة لضمان تحميل index.html الجديد
      hardReload();
    } catch (err) {
      console.error('[UpdatePrompt] خطأ أثناء التحديث:', err);
      // fallback: إعادة تحميل مباشرة
      hardReload();
    }
  }, [registration]);

  // ─────────────────────────────────────────────────────────────────
  // زر "لاحقاً" — يطوي النافذة (لا يخفيها كلياً)
  // ─────────────────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setCollapsed(true);
  }, []);

  if (!visible) return null;

  // ─────────────────────────────────────────────────────────────────
  // الوضع المصغّر (بعد "لاحقاً"): زر عائم صغير أخضر مع نبضة
  // ─────────────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <>
        <button
          type="button"
          className="yam-native-update-mini"
          dir="rtl"
          title="تحديث جديد متاح — اضغط للتثبيت"
          aria-label="تحديث جديد متاح"
          onClick={() => setCollapsed(false)}
        >
          <span className="yam-native-update-mini-dot" aria-hidden="true" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 11-3.5-7.1" />
            <path d="M21 4v5h-5" />
          </svg>
        </button>
        <style>{miniStyles}</style>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // الوضع الكامل (نافذة نظام مطابقة للأسلوب الأصلي في الصورة)
  // ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="yam-native-update-overlay"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="yam-native-update-title"
    >
      <div className="yam-native-update-sheet">
        {/* شارة/أيقونة صغيرة أعلى النافذة */}
        <div className="yam-native-update-badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-3.5-7.1" />
            <path d="M21 4v5h-5" />
          </svg>
        </div>

        <h2 id="yam-native-update-title" className="yam-native-update-title">
          تحديث جديد متاح
        </h2>

        <p className="yam-native-update-subtitle">
          إصدار جديد من YAMSHAT جاهز — تحديثات، إصلاحات، وأداء أفضل.
        </p>

        <div className="yam-native-update-actions">
          <button
            type="button"
            className="yam-native-update-btn yam-native-update-btn-primary"
            onClick={handleUpdateNow}
            disabled={refreshing}
            autoFocus
          >
            {refreshing ? (
              <span className="yam-native-update-spinner" aria-hidden="true" />
            ) : (
              'تحديث الآن'
            )}
          </button>
          <button
            type="button"
            className="yam-native-update-btn yam-native-update-btn-secondary"
            onClick={handleDismiss}
            disabled={refreshing}
          >
            لاحقاً
          </button>
        </div>
      </div>

      <style>{sheetStyles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   أنماط النافذة الكاملة — مطابقة لأسلوب نظام WhatsApp/Android update sheet
   خلفية خضراء داكنة، زر أبيض بارز، زر ثانوي شفاف
   ══════════════════════════════════════════════════════════════════ */
const sheetStyles = `
  .yam-native-update-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: yamNativeFade 220ms ease-out;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
  }

  @keyframes yamNativeFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .yam-native-update-sheet {
    position: relative;
    width: 100%;
    max-width: 640px;
    padding: 26px 22px 24px;
    background: linear-gradient(180deg, #0f8a5a 0%, #0a6b47 100%);
    border-top-left-radius: 26px;
    border-top-right-radius: 26px;
    box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.55), 0 -1px 0 rgba(255, 255, 255, 0.08) inset;
    color: #ffffff;
    text-align: right;
    animation: yamNativeSlideUp 320ms cubic-bezier(0.2, 0.9, 0.25, 1);
  }

  @keyframes yamNativeSlideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  /* شريط سحب صغير أعلى النافذة (اختياري بصري فقط) */
  .yam-native-update-sheet::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 44px;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.28);
  }

  .yam-native-update-badge {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.14);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    margin-bottom: 14px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  }

  .yam-native-update-title {
    margin: 0 0 6px;
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .yam-native-update-subtitle {
    margin: 0 0 22px;
    font-size: 0.92rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.55;
  }

  .yam-native-update-actions {
    display: flex;
    gap: 12px;
    align-items: stretch;
    flex-direction: row-reverse; /* الأساسي "تحديث الآن" على اليمين مطابقاً للصورة */
  }

  .yam-native-update-btn {
    flex: 1;
    min-height: 52px;
    padding: 0 18px;
    border-radius: 14px;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 140ms ease, background 200ms ease, opacity 200ms ease;
    -webkit-tap-highlight-color: transparent;
  }

  .yam-native-update-btn:active {
    transform: scale(0.97);
  }

  .yam-native-update-btn:disabled {
    opacity: 0.7;
    cursor: default;
  }

  /* الزر الرئيسي "تحديث الآن" — أبيض بارز مطابق للصورة */
  .yam-native-update-btn-primary {
    background: #ffffff;
    color: #0a6b47;
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  }

  .yam-native-update-btn-primary:hover {
    background: #f5faf7;
  }

  /* الزر الثانوي "لاحقاً" — شفاف على الخضرة */
  .yam-native-update-btn-secondary {
    background: rgba(255, 255, 255, 0.10);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .yam-native-update-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  /* مؤشر تحميل داخل الزر أثناء التحديث */
  .yam-native-update-spinner {
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(10, 107, 71, 0.25);
    border-top-color: #0a6b47;
    border-radius: 50%;
    animation: yamNativeSpin 700ms linear infinite;
  }
  @keyframes yamNativeSpin {
    to { transform: rotate(360deg); }
  }

  /* تكييف على سطح المكتب: نجعلها بطاقة مركزية بدل sheet سفلي */
  @media (min-width: 900px) {
    .yam-native-update-overlay {
      align-items: center;
    }
    .yam-native-update-sheet {
      max-width: 480px;
      border-radius: 22px;
      padding: 30px 26px 26px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }
    .yam-native-update-sheet::before {
      display: none;
    }
  }

  /* شاشات صغيرة جداً */
  @media (max-width: 360px) {
    .yam-native-update-sheet {
      padding: 22px 16px 20px;
    }
    .yam-native-update-btn {
      min-height: 48px;
      font-size: 0.95rem;
    }
  }
`;

/* أنماط الزر العائم المصغّر بعد "لاحقاً" */
const miniStyles = `
  .yam-native-update-mini {
    position: fixed;
    inset-inline-start: 14px;
    bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    z-index: 9998;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: linear-gradient(135deg, #0f8a5a, #0a6b47);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 22px rgba(10, 107, 71, 0.5);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 180ms ease;
  }
  .yam-native-update-mini:active { transform: scale(0.94); }
  .yam-native-update-mini-dot {
    position: absolute;
    top: 5px;
    inset-inline-end: 5px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ffcc33;
    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.9);
    animation: yamNativeMiniPulse 1.6s ease-in-out infinite;
  }
  @keyframes yamNativeMiniPulse {
    0%, 100% { transform: scale(1);    opacity: 1;   }
    50%      { transform: scale(1.25); opacity: 0.7; }
  }
`;
