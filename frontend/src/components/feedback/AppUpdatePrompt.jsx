import { useEffect, useState } from 'react';

/**
 * 🔧 إصلاح v53:
 * - تم تعطيل الشريط الأخضر السفلي (الذي كان يظهر بنمط "تنشيط Windows") نهائياً.
 * - بدلاً منه: إشعار صغير في الزاوية العلوية بنفس استايل نظام إشعارات
 *   التطبيق (دائرة صغيرة + شارة نقطة خضراء) يستجيب للضغط لتطبيق التحديث.
 * - عند الضغط: ينفّذ التحديث مباشرة (SKIP_WAITING + reload).
 * - عند الإغلاق: يختفي تماماً للجلسة الحالية (لا شريط، لا تذكير مزعج).
 */

const DISMISS_STORAGE_KEY = 'yamshat_update_dismissed_at';
const DISMISS_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 ساعة هدوء بعد الإغلاق

function wasRecentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0);
    if (!at) return false;
    return Date.now() - at < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export default function AppUpdatePrompt() {
  const [registration, setRegistration] = useState(null);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleReady = (event) => {
      const nextRegistration = event.detail?.registration || null;
      if (!nextRegistration) return;
      if (wasRecentlyDismissed()) return; // أُغلق مؤخراً، لا تُظهر شيئاً
      setRegistration(nextRegistration);
      setVisible(true);
    };

    window.addEventListener('yamshat:update-ready', handleReady);
    return () => window.removeEventListener('yamshat:update-ready', handleReady);
  }, []);

  if (!visible || !registration) return null;

  const handleUpdateNow = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        // controllerchange listener في main.jsx سيتولى إعادة التحميل
        return;
      }
      await registration.update();
      // إذا لم يكن هناك waiting، نُجبر إعادة التحميل
      setTimeout(() => window.location.reload(), 300);
    } catch {
      setRefreshing(false);
    }
  };

  const handleDismiss = (event) => {
    event.stopPropagation();
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  // إشعار صغير في الزاوية العلوية اليسرى — بنفس استايل نظام إشعارات التطبيق
  // (دائرة صغيرة + شارة نقطة) — يستجيب للضغط لتطبيق التحديث فوراً.
  return (
    <div
      className="yam-update-badge-wrap"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        className="yam-update-badge"
        title="إصدار جديد متاح — اضغط للتحديث"
        aria-label="إصدار جديد متاح، اضغط للتحديث الآن"
        onClick={handleUpdateNow}
        disabled={refreshing}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 11-3.5-7.1" />
          <path d="M21 4v5h-5" />
        </svg>
        <span className="yam-update-badge-dot" aria-hidden="true" />
      </button>

      <button
        type="button"
        className="yam-update-badge-close"
        title="إخفاء إشعار التحديث"
        aria-label="إخفاء إشعار التحديث"
        onClick={handleDismiss}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <style>{`
        .yam-update-badge-wrap {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 10px);
          inset-inline-start: 10px;
          z-index: 9998;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          pointer-events: none;
        }

        .yam-update-badge,
        .yam-update-badge-close {
          pointer-events: auto;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .yam-update-badge {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(20, 14, 38, 0.92), rgba(30, 18, 56, 0.94));
          border: 1px solid rgba(168, 130, 255, 0.32);
          color: #e9d5ff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(91, 33, 182, 0.32);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform 160ms ease, background 200ms ease, box-shadow 200ms ease;
          animation: yamUpdateFadeIn 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .yam-update-badge:hover {
          background: linear-gradient(135deg, rgba(30, 22, 56, 0.95), rgba(45, 28, 80, 0.96));
          box-shadow: 0 8px 22px rgba(91, 33, 182, 0.42);
        }

        .yam-update-badge:active {
          transform: scale(0.92);
        }

        .yam-update-badge:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .yam-update-badge-dot {
          position: absolute;
          top: 4px;
          inset-inline-end: 4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #a78bfa;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.9);
          animation: yamUpdatePulse 1.8s ease-in-out infinite;
        }

        .yam-update-badge-close {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(20, 14, 38, 0.86);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 0.85;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .yam-update-badge-close:hover {
          opacity: 1;
        }

        .yam-update-badge-close:active {
          transform: scale(0.9);
        }

        @keyframes yamUpdateFadeIn {
          from { transform: translateY(-6px) scale(0.9); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }

        @keyframes yamUpdatePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.3); opacity: 0.65; }
        }

        /* تجنّب التداخل مع شريط الحالة في وضع PWA standalone */
        @media (display-mode: standalone) {
          .yam-update-badge-wrap {
            top: calc(env(safe-area-inset-top, 0px) + 14px);
          }
        }
      `}</style>
    </div>
  );
}
