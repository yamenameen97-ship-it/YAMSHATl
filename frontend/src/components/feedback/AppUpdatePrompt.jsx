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
    <div className="yam-update-banner system-style" dir="rtl" role="status" aria-live="polite">
      <div className="yam-update-copy">
        <strong>إصدار جديد متوفر</strong>
        <span>تتوفر تحسينات جديدة للنظام، هل تود التحديث الآن؟</span>
      </div>
      <div className="yam-update-actions">
        <button type="button" className="yam-update-btn primary system-btn" onClick={handleUpdateNow} disabled={refreshing}>
          {refreshing ? 'جاري التحديث...' : 'تحديث'}
        </button>
        <button type="button" className="yam-update-btn system-btn secondary" onClick={() => setVisible(false)}>
          لاحقاً
        </button>
      </div>

      <style>{`
        .yam-update-banner {
          position: fixed;
          inset-inline: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 12px 20px;
          background: var(--bg-surface, #1e293b);
          color: var(--text-primary, #fff);
          border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));
          box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
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
          background: var(--accent-color, #6366f1);
          border: none;
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
