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
    <div className="install-banner card">
      <div>
        <strong>تثبيت التطبيق</strong>
        <div className="muted">يمكنك تثبيت يمشات كتطبيق PWA على الموبايل أو سطح المكتب.</div>
      </div>
      <div className="install-banner-actions">
        <Button onClick={handleInstall}>تثبيت الآن</Button>
        <Button variant="secondary" onClick={clearInstallPrompt}>لاحقاً</Button>
      </div>
    </div>
  );
}
