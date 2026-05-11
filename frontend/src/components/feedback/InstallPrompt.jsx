import { useAppStore } from '../../store/appStore.js';
import Button from '../ui/Button.jsx';

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
    <div className="install-banner card enhanced-install-banner">
      <div style={{ display: 'grid', gap: 8 }}>
        <strong>تثبيت التطبيق</strong>
        <div className="muted">ثبّت يمشات كتطبيق PWA للوصول السريع، والإشعارات، وتجربة أفضل عند ضعف الشبكة.</div>
        <div className="install-benefits-row">
          <span className="install-benefit-pill">فتح أسرع</span>
          <span className="install-benefit-pill">Offline pages</span>
          <span className="install-benefit-pill">Background sync</span>
        </div>
      </div>
      <div className="install-banner-actions">
        <Button onClick={handleInstall}>تثبيت الآن</Button>
        <Button variant="secondary" onClick={clearInstallPrompt}>لاحقاً</Button>
      </div>

      <style>{`
        .enhanced-install-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .install-benefits-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .install-benefit-pill {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.14);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
