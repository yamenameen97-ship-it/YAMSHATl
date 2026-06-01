import { useEffect, useState } from 'react';

export default function AppUpdatePrompt() {
  const [registration, setRegistration] = useState(null);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleReady = (event) => {
      const nextRegistration = event.detail?.registration || null;
      if (!nextRegistration) return;
      setRegistration(nextRegistration);
      setVisible(true);
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

  return (
    <div className="yam-update-banner" dir="rtl" role="status" aria-live="polite">
      <div className="yam-update-copy">
        <strong>يوجد إصدار جديد</strong>
        <span>حدّث الآن للحصول على آخر تحسينات الـ PWA والإشعارات والعمل بدون إنترنت.</span>
      </div>
      <div className="yam-update-actions">
        <button type="button" className="yam-update-btn primary" onClick={handleUpdateNow} disabled={refreshing}>
          {refreshing ? 'جاري التحديث...' : 'تحديث الآن'}
        </button>
        <button type="button" className="yam-update-btn" onClick={() => setVisible(false)}>
          لاحقاً
        </button>
      </div>

      <style>{`
        .yam-update-banner {
          position: fixed;
          inset-inline: 12px;
          bottom: calc(92px + env(safe-area-inset-bottom, 0px));
          z-index: 130;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 14px 16px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.98));
          color: #fff;
          border: 1px solid rgba(99, 102, 241, 0.28);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.28);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .yam-update-copy {
          display: grid;
          gap: 4px;
          flex: 1;
          min-width: 220px;
        }

        .yam-update-copy strong {
          font-size: 0.96rem;
        }

        .yam-update-copy span {
          color: #cbd5e1;
          font-size: 0.86rem;
          line-height: 1.5;
        }

        .yam-update-actions {
          display: inline-flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .yam-update-btn {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: #fff;
          font-weight: 800;
        }

        .yam-update-btn.primary {
          border-color: transparent;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
        }

        .yam-update-btn:disabled {
          opacity: 0.72;
        }

        @media (min-width: 900px) {
          .yam-update-banner {
            inset-inline: auto 20px;
            width: min(540px, calc(100vw - 40px));
          }
        }
      `}</style>
    </div>
  );
}
