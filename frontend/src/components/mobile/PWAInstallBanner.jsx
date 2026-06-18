import { memo, useCallback, useEffect, useState } from 'react';

/**
 * PWAInstallBanner (v47.9 — يعمل على كل المتصفحات بما فيها الأجهزة الضعيفة)
 * ------------------------------------------------------------------------
 * - يعرض شريط تثبيت PWA أعلى الصفحة (تحت الـ TopBar)
 * - يكتشف Chrome / Edge / Samsung Internet / MIUI / Opera Mobile (يدعم beforeinstallprompt)
 * - يعرض تعليمات يدوية لـ Safari iOS / Firefox Android
 * - يخفي نفسه بعد التثبيت أو الرفض (مع تذكُّر الاختيار في localStorage)
 * - يستخدم dir="rtl" وخط Noto Sans Arabic كما هو مطلوب
 */

const DISMISS_KEY = 'yamshat:pwa-install-dismissed-v1';
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // أسبوع

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const isSamsung = /SamsungBrowser/.test(ua);
  const isMIUI = /MiuiBrowser/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS && isSafari) return 'ios-safari';
  if (isIOS) return 'ios-other';
  if (isFirefox && isAndroid) return 'firefox-android';
  if (isSamsung) return 'samsung';
  if (isMIUI) return 'miui';
  if (isAndroid) return 'android-chrome';
  return 'desktop';
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  // iOS
  if (window.navigator.standalone === true) return true;
  // Android/desktop
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  return false;
}

function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    if (isStandalone()) return;

    // فحص الرفض السابق
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.ts && Date.now() - data.ts < REMIND_AFTER_MS) {
          return;
        }
      }
    } catch { /* تجاهل */ }

    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

    // المتصفحات التي تدعم beforeinstallprompt
    const beforeInstallHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', beforeInstallHandler);

    // المتصفحات التي لا تدعم beforeinstallprompt (Safari iOS, Firefox Android)
    if (detectedPlatform === 'ios-safari' || detectedPlatform === 'firefox-android' || detectedPlatform === 'ios-other') {
      // إظهار البانر مع تعليمات يدوية بعد ثانية
      const t = setTimeout(() => setVisible(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      };
    }

    // التقاط حدث appinstalled
    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setShowIOSHelp(false);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({ ts: Date.now() }));
    } catch { /* تجاهل */ }
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setVisible(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('PWA install prompt failed', err);
      }
      return;
    }
    // متصفحات بدون beforeinstallprompt → عرض تعليمات يدوية
    setShowIOSHelp(true);
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <div className="ym-pwa-banner" dir="rtl" role="region" aria-label="تثبيت تطبيق يام شات">
      <div className="ym-pwa-banner-inner">
        <div className="ym-pwa-icon" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="32" height="32">
            <defs>
              <linearGradient id="ym-pwa-grad" x1="0" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
            </defs>
            <line x1="22" y1="20" x2="50" y2="55" stroke="url(#ym-pwa-grad)" strokeWidth="12" strokeLinecap="round" />
            <line x1="78" y1="20" x2="50" y2="55" stroke="url(#ym-pwa-grad)" strokeWidth="12" strokeLinecap="round" />
            <line x1="50" y1="55" x2="50" y2="85" stroke="url(#ym-pwa-grad)" strokeWidth="12" strokeLinecap="round" />
          </svg>
        </div>
        <div className="ym-pwa-text">
          <div className="ym-pwa-title">ثبّت يام شات على جهازك</div>
          <div className="ym-pwa-desc">تجربة أسرع وإشعارات فورية بدون متصفح</div>
        </div>
        <button type="button" className="ym-pwa-btn ym-pwa-btn-install" onClick={handleInstall}>
          تثبيت
        </button>
        <button type="button" className="ym-pwa-btn ym-pwa-btn-close" aria-label="إغلاق" onClick={dismiss}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>

      {showIOSHelp && (
        <div className="ym-pwa-help" dir="rtl">
          {(platform === 'ios-safari' || platform === 'ios-other') && (
            <>
              <div className="ym-pwa-help-title">للتثبيت على iPhone / iPad:</div>
              <ol className="ym-pwa-help-list">
                <li>اضغط على أيقونة المشاركة <span className="ym-pwa-help-icon">⬆️</span> أسفل المتصفح</li>
                <li>اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong></li>
                <li>اضغط <strong>«إضافة»</strong></li>
              </ol>
            </>
          )}
          {platform === 'firefox-android' && (
            <>
              <div className="ym-pwa-help-title">للتثبيت على Firefox:</div>
              <ol className="ym-pwa-help-list">
                <li>اضغط القائمة <strong>⋮</strong> أعلى يمين المتصفح</li>
                <li>اختر <strong>«تثبيت»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong></li>
              </ol>
            </>
          )}
          {(platform === 'samsung' || platform === 'miui' || platform === 'android-chrome' || platform === 'desktop') && (
            <>
              <div className="ym-pwa-help-title">للتثبيت يدوياً:</div>
              <ol className="ym-pwa-help-list">
                <li>افتح قائمة المتصفح <strong>⋮</strong></li>
                <li>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong></li>
              </ol>
            </>
          )}
        </div>
      )}

      <style>{`
        .ym-pwa-banner {
          position: sticky;
          top: 0;
          z-index: 999;
          background: linear-gradient(90deg, #1A1F2E 0%, #14172a 100%);
          border-bottom: 1px solid rgba(139, 92, 246, 0.35);
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          direction: rtl;
          color: #fff;
          animation: ym-pwa-slide 0.3s ease-out;
        }
        @keyframes ym-pwa-slide {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ym-pwa-banner-inner {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          max-width: 600px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .ym-pwa-icon {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          background: rgba(139, 92, 246, 0.15);
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ym-pwa-text {
          flex: 1 1 auto;
          min-width: 0;
          text-align: right;
        }
        .ym-pwa-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ym-pwa-desc {
          font-size: 0.7rem;
          color: #9CA3AF;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ym-pwa-btn {
          font-family: inherit;
          cursor: pointer;
          border: none;
          flex-shrink: 0;
        }
        .ym-pwa-btn-install {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: #fff;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
        }
        .ym-pwa-btn-install:active { transform: scale(0.95); }
        .ym-pwa-btn-close {
          background: transparent;
          color: #9CA3AF;
          padding: 6px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ym-pwa-btn-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

        .ym-pwa-help {
          padding: 10px 16px 12px;
          background: rgba(10, 13, 26, 0.6);
          border-top: 1px solid rgba(139, 92, 246, 0.18);
          font-size: 0.78rem;
          color: #E5E7EB;
          text-align: right;
          direction: rtl;
        }
        .ym-pwa-help-title {
          font-weight: 700;
          color: #C4B5FD;
          margin-bottom: 6px;
        }
        .ym-pwa-help-list {
          margin: 0;
          padding-inline-start: 18px;
          list-style: decimal;
          line-height: 1.7;
        }
        .ym-pwa-help-list li { color: #E5E7EB; }
        .ym-pwa-help-icon {
          display: inline-block;
          font-size: 1.1em;
          vertical-align: middle;
        }

        @media (max-width: 400px) {
          .ym-pwa-banner-inner { padding: 7px 10px; gap: 8px; }
          .ym-pwa-icon { width: 32px; height: 32px; }
          .ym-pwa-title { font-size: 0.8rem; }
          .ym-pwa-desc { font-size: 0.66rem; }
          .ym-pwa-btn-install { padding: 6px 13px; font-size: 0.74rem; }
        }
        @media (max-width: 360px) {
          .ym-pwa-banner-inner { padding: 6px 8px; gap: 6px; }
          .ym-pwa-icon { width: 28px; height: 28px; }
          .ym-pwa-icon svg { width: 26px; height: 26px; }
          .ym-pwa-title { font-size: 0.74rem; }
          .ym-pwa-desc { font-size: 0.62rem; }
          .ym-pwa-btn-install { padding: 5px 10px; font-size: 0.7rem; }
          .ym-pwa-btn-close { padding: 4px; }
          .ym-pwa-btn-close svg { width: 16px; height: 16px; }
        }
        @media (max-width: 320px) {
          .ym-pwa-banner-inner { padding: 5px 6px; gap: 5px; }
          .ym-pwa-icon { width: 24px; height: 24px; }
          .ym-pwa-icon svg { width: 22px; height: 22px; }
          .ym-pwa-title { font-size: 0.68rem; }
          .ym-pwa-desc { display: none; }
          .ym-pwa-btn-install { padding: 4px 9px; font-size: 0.64rem; }
        }
        /* دعم Redmi Note 8 وأجهزة 393px */
        @media (max-width: 393px) and (min-width: 361px) {
          .ym-pwa-title { font-size: 0.82rem; }
          .ym-pwa-desc { font-size: 0.68rem; }
        }
        /* Fallback للمتصفحات القديمة بدون sticky */
        @supports not (position: sticky) {
          .ym-pwa-banner { position: relative; }
        }
      `}</style>
    </div>
  );
}

export default memo(PWAInstallBanner);
