
import { useEffect, useState } from 'react';
import notificationService from '../../services/notificationService.js';

const DISMISS_KEY = 'yamshat_notification_prompt_dismissed';

function getPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

export default function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState(getPermission);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPermission = () => setPermission(getPermission());
    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);

    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, []);

  useEffect(() => {
    if (permission === 'granted' && typeof window !== 'undefined') {
      window.localStorage.removeItem(DISMISS_KEY);
      setDismissed(false);
    }
  }, [permission]);

  if (dismissed || permission === 'granted' || permission === 'unsupported') return null;

  const isDenied = permission === 'denied';

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, '1');
    }
    setDismissed(true);
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      await notificationService.subscribeToPushNotifications().catch(async () => {
        await notificationService.requestPermission();
      });
      setPermission(getPermission());
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className={`yam-notification-prompt ${isDenied ? 'is-denied' : ''}`} role="status" aria-live="polite">
      <div className="yam-notification-prompt-head">
        <div className="yam-notification-prompt-mark" aria-hidden="true" />
        <div className="yam-notification-prompt-copy">
          <strong>{isDenied ? 'الإشعارات متوقفة في المتصفح' : 'فعّل إشعارات يام شات'}</strong>
          <p>
            {isDenied
              ? 'لو عايز تنبيهات الرسائل والتفاعلات، فعّل الإشعارات من إعدادات المتصفح ثم حدّث الصفحة.'
              : 'وصلك تنبيه فوري للرسائل والتفاعلات، وكمان هيظهر نفس الشعار كأيقونة التطبيق عند التثبيت من الويب.'}
          </p>
        </div>
      </div>

      <div className="yam-notification-prompt-actions">
        {!isDenied ? (
          <button type="button" className="primary" onClick={handleEnable} disabled={busy}>
            {busy ? 'جارٍ التفعيل...' : 'تفعيل الإشعارات'}
          </button>
        ) : null}
        <button type="button" className="ghost" onClick={handleDismiss}>
          إخفاء
        </button>
      </div>
    </aside>
  );
}
