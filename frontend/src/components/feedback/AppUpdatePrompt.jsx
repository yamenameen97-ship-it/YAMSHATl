import { useEffect, useState } from 'react';

const DISMISS_STORAGE_KEY = 'yamshat_update_dismissed_at';
const DISMISS_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 ساعات هدوء بعد "لاحقاً"

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleReady = (event) => {
      const nextRegistration = event.detail?.registration || null;
      if (!nextRegistration) return;
      setRegistration(nextRegistration);
      if (wasRecentlyDismissed()) {
        // يظهر بشكل مصغّر (شارة صغيرة فقط) بدلاً من شريط كامل يغطي الأزرار
        setCollapsed(true);
        setVisible(true);
      } else {
        setCollapsed(false);
        setVisible(true);
      }
    };

    window.addEventListener('yamshat:update-ready', handleReady);
    return () => window.removeEventListener('yamshat:update-ready', handleReady);
  }, []);

  if (!visible || !registration) return null;

  const handleUpdateNow = async () => {
    setRefreshing(true);
    try {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }
      await registration.update();
    } catch {
      setRefreshing(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    // ندخل في وضع مصغّر بدلاً من الاختفاء الكامل (للمستخدمين الذين يرغبون بالعودة لاحقاً)
    setCollapsed(true);
  };

  // الوضع المصغّر: زر دائري صغير في الزاوية لا يغطي محتوى الصفحة
  if (collapsed) {
    return (
      <button
        type="button"
        className="yam-update-mini"
        dir="rtl"
        title="إصدار جديد متاح — اضغط للتحديث"
        aria-label="إصدار جديد متاح"
        onClick={() => setCollapsed(false)}
      >
        <span className="yam-update-mini-dot" aria-hidden="true" />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 11-3.5-7.1" />
          <path d="M21 4v5h-5" />
        </svg>
        <style>{`
          .yam-update-mini {
            position: fixed;
            inset-inline-start: 14px;
            bottom: calc(14px + env(safe-area-inset-bottom, 0px));
            z-index: 9998;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 1px solid rgba(168, 130, 255, 0.35);
            background: linear-gradient(135deg, rgba(142, 61, 255, 0.92), rgba(91, 33, 182, 0.92));
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(91, 33, 182, 0.45);
            cursor: pointer;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transition: transform 180ms ease;
          }
          .yam-update-mini:active { transform: scale(0.94); }
          .yam-update-mini-dot {
            position: absolute;
            top: 6px;
            inset-inline-end: 6px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #34d399;
            box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.9);
            animation: yamUpdatePulse 1.6s ease-in-out infinite;
          }
          @keyframes yamUpdatePulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.25); opacity: 0.7; }
          }
        `}</style>
      </button>
    );
  }

  // الوضع الكامل: شريط أنيق بألوان البراند البنفسجية، مع زر إغلاق واضح
  return (
    <div className="yam-update-toast" dir="rtl" role="status" aria-live="polite">
      <div className="yam-update-toast-inner">
        <div className="yam-update-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-3.5-7.1" />
            <path d="M21 4v5h-5" />
          </svg>
        </div>
        <div className="yam-update-copy">
          <strong>إصدار جديد متاح</strong>
          <span>تحسينات وأداء أفضل</span>
        </div>
        <div className="yam-update-actions">
          <button
            type="button"
            className="yam-update-btn primary"
            onClick={handleUpdateNow}
            disabled={refreshing}
          >
            {refreshing ? '…' : 'تحديث'}
          </button>
          <button
            type="button"
            className="yam-update-btn ghost"
            onClick={handleDismiss}
            aria-label="إخفاء"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .yam-update-toast {
          position: fixed;
          inset-inline: 12px;
          bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          z-index: 9998;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .yam-update-toast-inner {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          max-width: 520px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(20, 14, 38, 0.92), rgba(30, 18, 56, 0.94));
          border: 1px solid rgba(168, 130, 255, 0.28);
          box-shadow:
            0 14px 36px rgba(91, 33, 182, 0.32),
            0 0 0 1px rgba(255, 255, 255, 0.02) inset;
          color: #f5f3ff;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: yamUpdateSlide 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes yamUpdateSlide {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .yam-update-icon {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: linear-gradient(135deg, #8e3dff, #5b21b6);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 6px 16px rgba(91, 33, 182, 0.45);
        }

        .yam-update-copy {
          display: grid;
          flex: 1;
          min-width: 0;
          line-height: 1.25;
        }

        .yam-update-copy strong {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
        }

        .yam-update-copy span {
          color: #c4b5fd;
          font-size: 0.78rem;
          opacity: 0.9;
        }

        .yam-update-actions {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
        }

        .yam-update-btn {
          min-height: 36px;
          padding: 0 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: transform 120ms ease, background 200ms ease, opacity 200ms ease;
        }

        .yam-update-btn.primary {
          background: linear-gradient(135deg, #8e3dff, #5b21b6);
          color: #fff;
          border: 1px solid rgba(168, 130, 255, 0.45);
          box-shadow: 0 4px 14px rgba(91, 33, 182, 0.35);
        }

        .yam-update-btn.primary:active {
          transform: scale(0.96);
        }

        .yam-update-btn.ghost {
          width: 36px;
          padding: 0;
          background: rgba(255, 255, 255, 0.06);
          color: #e9d5ff;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .yam-update-btn.ghost:active {
          transform: scale(0.94);
          background: rgba(255, 255, 255, 0.1);
        }

        .yam-update-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        /* على الشاشات الصغيرة جداً، نخفّض الحشو قليلاً */
        @media (max-width: 380px) {
          .yam-update-copy span { display: none; }
          .yam-update-toast-inner { padding: 8px 10px; gap: 8px; }
        }

        /* على سطح المكتب، نلصقه يمين الأسفل بدلاً من ملء العرض */
        @media (min-width: 900px) {
          .yam-update-toast {
            justify-content: flex-end;
            inset-inline: auto 20px;
          }
        }
      `}</style>
    </div>
  );
}
