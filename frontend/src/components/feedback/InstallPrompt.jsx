import { useAppStore } from '../../store/appStore.js';

export default function InstallPrompt() {
  const installPrompt = useAppStore((state) => state.installPrompt);
  const clearInstallPrompt = useAppStore((state) => state.clearInstallPrompt);

  if (!installPrompt) return null;

  const handleInstall = async () => {
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    clearInstallPrompt();
  };

  return (
    <div className="install-banner slim-install-banner" dir="rtl">
      <div className="slim-install-copy">
        <strong>تثبيت التطبيق</strong>
        <span>نسخة PWA أسرع وأخف مع إشعارات أفضل عند ضعف الشبكة.</span>
      </div>
      <div className="slim-install-actions">
        <button type="button" className="slim-install-btn primary" onClick={handleInstall}>تثبيت الآن</button>
        <button type="button" className="slim-install-btn" onClick={clearInstallPrompt}>لاحقاً</button>
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
          padding: 8px 12px;
          border-radius: 16px;
          background: rgba(11, 18, 32, 0.9);
          border: 1px solid rgba(167,139,250,0.16);
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 28px rgba(2, 6, 23, 0.18);
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
          color: #94a3b8;
        }

        .slim-install-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .slim-install-btn {
          min-height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #fff;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .slim-install-btn.primary {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-color: transparent;
        }

        @media (max-width: 768px) {
          .slim-install-banner {
            top: 54px;
            width: calc(100% - 16px);
            padding: 8px 10px;
            flex-wrap: wrap;
          }

          .slim-install-copy {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
