
import { useEffect, useRef, useState } from 'react';
import notificationService from '../../services/notificationService.js';

const DISMISS_KEY = 'yamshat_notification_prompt_dismissed';
// ✅ v59.13.13 FIX #5: إضافة TTL لـ dismiss (7 أيام)
// الخلل السابق: رفض المستخدم للإشعار كان يخفي النافذة للأبد بدون انتهاء صلاحية
// → لو غيّر رأيه لاحقاً، لا توجد طريقة لتثبيت التفعيل إلا عبر إعدادات المتصفح مباشرة.
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 أيام

function getPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

function isDismissActive() {
  if (typeof window === 'undefined') return false;
  const stamp = window.localStorage.getItem(DISMISS_KEY);
  if (!stamp) return false;
  // توافق خلفي مع القيمة القديمة '1' → نعتبرها منتهية ونعيد إظهار النافذة
  if (stamp === '1') {
    try { window.localStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
    return false;
  }
  const ts = Number(stamp);
  if (!Number.isFinite(ts) || ts <= 0) {
    try { window.localStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
    return false;
  }
  if (Date.now() - ts > DISMISS_TTL_MS) {
    try { window.localStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
    return false;
  }
  return true;
}

export default function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState(getPermission);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => isDismissActive());
  // ✅ v59.13.13 FIX #5: حراس mount لمنع setState بعد unmount في handleEnable
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPermission = () => setPermission(getPermission());

    // ✅ v83.5 FIX #5: مزامنة فورية عند التركيب.
    // الخلل السابق: getPermission() يُستدعى مرة واحدة فقط داخل useState initializer
    // (أول render). إذا منح المستخدم الإذن في تبويب آخر أو عبر Web Push subscription
    // من SDK خارجي، فإن focus/visibilitychange لا يُطلقان إذا كان التبويب الحالي
    // مفتوحاً دون تبديل → المستخدم يرى نافذة "فعّل الإشعارات" حتّى لو كانت
    // مُفعّلة فعلاً. يُصلّح الآن بمزامنة فورية.
    syncPermission();

    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);

    // ✅ v83.5 FIX #5 (تكملة): مراقبة تغيير الإذن مباشرة عبر Permissions API
    // حيثما متوفر — Chromium/Firefox يدعمان change event لـ PermissionStatus
    // → المزامنة تحدث فوراً حتّى دون focus/visibility change.
    let permStatus = null;
    let permHandler = null;
    try {
      if (navigator?.permissions?.query) {
        navigator.permissions
          .query({ name: 'notifications' })
          .then((status) => {
            permStatus = status;
            permHandler = () => setPermission(getPermission());
            status.addEventListener?.('change', permHandler);
          })
          .catch(() => { /* Safari أقدم يرمي — نتجاهل */ });
      }
    } catch { /* ignore */ }

    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
      try {
        if (permStatus && permHandler) {
          permStatus.removeEventListener?.('change', permHandler);
        }
      } catch { /* ignore */ }
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
      // ✅ v59.13.13 FIX #5: خزِّن طابع زمني بدل '1' حتى تعمل حسابات TTL
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDismissed(true);
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      await notificationService.subscribeToPushNotifications().catch(async () => {
        await notificationService.requestPermission();
      });
      // ✅ v59.13.13 FIX #5: تجنّب setState بعد unmount
      if (isMountedRef.current) setPermission(getPermission());
    } finally {
      if (isMountedRef.current) setBusy(false);
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
