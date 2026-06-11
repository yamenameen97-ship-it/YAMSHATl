import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore.js';

/**
 * InstallPrompt - يعرض خيار تثبيت التطبيق في كل المتصفحات.
 * - Chrome/Edge/Samsung/Brave على أندرويد و سطح المكتب: يستخدم beforeinstallprompt الأصلي.
 * - Safari iOS / iPadOS: يعرض تعليمات يدوية (مشاركة → إضافة إلى الشاشة الرئيسية).
 * - Firefox / Opera / متصفحات أخرى: تعليمات يدوية حسب النظام.
 * - يخفي البانر إذا التطبيق مثبت بالفعل (display-mode: standalone).
 * - يحفظ القرار في localStorage حتى لا يظهر بانر "لاحقاً" مرة كل جلسة.
 */

const DISMISS_KEY = 'yamshat:install-dismiss';
const DISMISS_HOURS = 24; // إخفاء لمدة 24 ساعة بعد الضغط على "لاحقاً"

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    // iOS Safari
    window.navigator.standalone === true
  );
}

function detectBrowser() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { name: 'unknown', os: 'unknown', supportsNativePrompt: false };
  }
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isMac = /macintosh|mac os x/.test(ua) && !isIOS;
  const isWindows = /windows/.test(ua);

  let os = 'desktop';
  if (isIOS) os = 'ios';
  else if (isAndroid) os = 'android';
  else if (isMac) os = 'macos';
  else if (isWindows) os = 'windows';

  let name = 'unknown';
  if (/edg\//.test(ua)) name = 'edge';
  else if (/samsungbrowser/.test(ua)) name = 'samsung';
  else if (/opr\//.test(ua) || /opera/.test(ua)) name = 'opera';
  else if (/firefox|fxios/.test(ua)) name = 'firefox';
  else if (/chrome|crios/.test(ua) && !/edg\//.test(ua)) name = 'chrome';
  else if (/safari/.test(ua)) name = 'safari';

  // المتصفحات التي تدعم beforeinstallprompt
  const supportsNativePrompt = ['chrome', 'edge', 'samsung', 'opera'].includes(name)
    && !isIOS; // iOS لا يدعم النداء البرمجي حتى لو كان كروم

  return { name, os, supportsNativePrompt };
}

function getInstallInstructions(browser) {
  const { name, os } = browser;

  if (os === 'ios') {
    return {
      title: 'تثبيت التطبيق على iPhone / iPad',
      steps: [
        'اضغط زر المشاركة (📤) في شريط Safari السفلي.',
        'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).',
        'اضغط "إضافة" لتثبيت التطبيق.',
      ],
    };
  }

  if (os === 'macos' && name === 'safari') {
    return {
      title: 'تثبيت التطبيق على Mac',
      steps: [
        'افتح القائمة "ملف" (File) في Safari.',
        'اختر "إضافة إلى Dock…" (Add to Dock).',
        'اضغط "إضافة" لتثبيت التطبيق.',
      ],
    };
  }

  if (name === 'firefox') {
    return {
      title: 'تثبيت التطبيق على Firefox',
      steps: [
        'افتح القائمة (☰) من زاوية المتصفح.',
        os === 'android'
          ? 'اختر "تثبيت" أو "إضافة إلى الشاشة الرئيسية".'
          : 'اختر "تثبيت هذا الموقع كتطبيق" إن توفّر، أو ثبّت كاختصار.',
        'تابع الخطوات لإكمال التثبيت.',
      ],
    };
  }

  if (os === 'android') {
    return {
      title: 'تثبيت التطبيق على Android',
      steps: [
        'افتح قائمة المتصفح (⋮) من الزاوية.',
        'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".',
        'اضغط "تثبيت" لإكمال العملية.',
      ],
    };
  }

  // سطح المكتب (Chrome/Edge/Brave عند عدم توفر beforeinstallprompt)
  return {
    title: 'تثبيت التطبيق على الكمبيوتر',
    steps: [
      'افتح قائمة المتصفح (⋮) من الزاوية اليمنى العليا.',
      'اختر "تثبيت يام شات" أو "Install Yamshat" أو "إنشاء اختصار".',
      'تابع التعليمات لإكمال التثبيت.',
    ],
  };
}

function getDismissedUntil() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function setDismissed() {
  try {
    const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
  } catch {
    /* ignore */
  }
}

export default function InstallPrompt() {
  const installPrompt = useAppStore((state) => state.installPrompt);
  const clearInstallPrompt = useAppStore((state) => state.clearInstallPrompt);

  const browser = useMemo(() => detectBrowser(), []);
  const instructions = useMemo(() => getInstallInstructions(browser), [browser]);

  const [showFallback, setShowFallback] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  // إخفاء البانر إذا التطبيق مثبت بالفعل
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    setInstalled(isStandalone());
    const handler = () => setInstalled(isStandalone());
    window.addEventListener('appinstalled', handler);
    const mql = window.matchMedia?.('(display-mode: standalone)');
    mql?.addEventListener?.('change', handler);
    return () => {
      window.removeEventListener('appinstalled', handler);
      mql?.removeEventListener?.('change', handler);
    };
  }, []);

  // عرض fallback للمتصفحات التي لا تدعم beforeinstallprompt
  useEffect(() => {
    if (installed) return;
    if (installPrompt) return; // الحدث الأصلي متاح، لا داعي للـ fallback
    if (browser.supportsNativePrompt) return; // ننتظر الحدث

    // تحقق من الإخفاء المؤقت
    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil && Date.now() < dismissedUntil) return;

    // متصفحات iOS / Safari / Firefox => اعرض fallback مباشرة بعد ثانيتين
    const t = setTimeout(() => setShowFallback(true), 2000);
    return () => clearTimeout(t);
  }, [installPrompt, browser, installed]);

  if (installed) return null;

  const hasNativePrompt = !!installPrompt;
  const visible = hasNativePrompt || showFallback;
  if (!visible) return null;

  const handleInstall = async () => {
    if (hasNativePrompt) {
      try {
        installPrompt.prompt();
        await installPrompt.userChoice.catch(() => null);
      } catch {
        /* ignore */
      } finally {
        clearInstallPrompt();
      }
    } else {
      // عرض تعليمات التثبيت اليدوي
      setShowHelp(true);
    }
  };

  const handleDismiss = () => {
    setDismissed();
    if (hasNativePrompt) clearInstallPrompt();
    setShowFallback(false);
    setShowHelp(false);
  };

  return (
    <>
      <div className="install-banner slim-install-banner" dir="rtl" role="dialog" aria-label="تثبيت التطبيق">
        <div className="slim-install-copy">
          <strong>📲 تثبيت يام شات</strong>
          <span>
            {hasNativePrompt
              ? 'نسخة PWA أسرع وأخف مع إشعارات أفضل عند ضعف الشبكة.'
              : 'ثبّت التطبيق على جهازك للوصول السريع وتجربة كاملة الشاشة.'}
          </span>
        </div>
        <div className="slim-install-actions">
          <button type="button" className="slim-install-btn primary" onClick={handleInstall}>
            {hasNativePrompt ? 'تثبيت الآن' : 'كيفية التثبيت'}
          </button>
          <button type="button" className="slim-install-btn" onClick={handleDismiss} aria-label="إخفاء">
            لاحقاً
          </button>
        </div>

        <style>{`
          .slim-install-banner {
            position: sticky;
            top: 58px;
            z-index: 35;
            margin: 6px auto 0;
            width: min(1100px, calc(100% - 20px));
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 14px;
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(11, 18, 32, 0.95));
            border: 1px solid rgba(167,139,250,0.28);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 12px 28px rgba(2, 6, 23, 0.28);
          }

          .slim-install-copy {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            color: #e2e8f0;
            font-size: 13px;
            flex-wrap: wrap;
          }

          .slim-install-copy strong {
            color: #fff;
            flex-shrink: 0;
          }

          .slim-install-copy span {
            color: #cbd5e1;
          }

          .slim-install-actions {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }

          .slim-install-btn {
            min-height: 36px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04);
            color: #fff;
            padding: 0 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: transform 160ms ease, background 160ms ease;
          }

          .slim-install-btn:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.08);
          }

          .slim-install-btn.primary {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border-color: transparent;
            box-shadow: 0 8px 18px rgba(99, 102, 241, 0.32);
          }

          @media (max-width: 768px) {
            .slim-install-banner {
              top: 54px;
              width: calc(100% - 16px);
              padding: 10px 12px;
              flex-wrap: wrap;
            }

            .slim-install-copy {
              font-size: 12px;
            }
          }
        `}</style>
      </div>

      {showHelp ? (
        <div className="install-help-overlay" dir="rtl" role="dialog" aria-modal="true" onClick={() => setShowHelp(false)}>
          <div className="install-help-card" onClick={(e) => e.stopPropagation()}>
            <div className="install-help-head">
              <strong>{instructions.title}</strong>
              <button type="button" className="install-help-close" onClick={() => setShowHelp(false)} aria-label="إغلاق">×</button>
            </div>
            <ol className="install-help-steps">
              {instructions.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            <button type="button" className="slim-install-btn primary install-help-done" onClick={() => setShowHelp(false)}>
              تم، فهمت
            </button>
          </div>

          <style>{`
            .install-help-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: grid;
              place-items: center;
              padding: 20px;
              background: rgba(2, 6, 23, 0.72);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              animation: yamFadeIn 200ms ease;
            }
            .install-help-card {
              width: min(440px, 100%);
              padding: 20px;
              border-radius: 22px;
              background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(7, 10, 24, 1));
              border: 1px solid rgba(167, 139, 250, 0.24);
              box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
              color: #e2e8f0;
              display: grid;
              gap: 14px;
            }
            .install-help-head {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
            }
            .install-help-head strong {
              color: #fff;
              font-size: 17px;
            }
            .install-help-close {
              all: unset;
              cursor: pointer;
              width: 32px;
              height: 32px;
              border-radius: 999px;
              display: grid;
              place-items: center;
              background: rgba(255, 255, 255, 0.06);
              color: #fff;
              font-size: 18px;
            }
            .install-help-steps {
              margin: 0;
              padding-inline-start: 22px;
              display: grid;
              gap: 10px;
              line-height: 1.7;
              font-size: 14px;
              color: #cbd5e1;
            }
            .install-help-steps li::marker {
              color: #a78bfa;
              font-weight: 700;
            }
            .install-help-done {
              margin-top: 4px;
              justify-self: stretch;
            }
            @keyframes yamFadeIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      ) : null}
    </>
  );
}
