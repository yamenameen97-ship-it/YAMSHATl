import { useEffect, useRef } from 'react';
import socketManager from '../../services/socketManager.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { normalizeNotification } from '../../utils/notificationCenter.js';

/**
 * Mounted once at the app root. Subscribes to `new_notification` socket
 * events GLOBALLY so:
 *   - The bell badge updates instantly.
 *   - A browser notification fires when the tab is in the background.
 *   - An in-app toast pops on the current screen (any route).
 *   - A short beep plays so the user actually notices.
 *
 * Fixes the bug where notifications never fired because the only listener
 * lived inside the Notifications page, which is rarely mounted.
 */
export default function GlobalNotificationListener() {
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const lastBeepRef = useRef(0);

  useEffect(() => {
    // Try to ask for notification permission on first mount. We don't force
    // it; the browser will silently keep the default state if the user has
    // already decided.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (_) { /* noop */ }
    }
  }, []);

  useEffect(() => {
    const handleIncoming = (raw) => {
      try {
        const item = normalizeNotification(raw || {});
        upsertNotification(item);

        // In-app toast via the global event bus (compatible with ToastProvider).
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('yamshat:toast', {
            detail: {
              type: 'info',
              title: item.title || 'إشعار جديد',
              description: item.body || item.message || '',
              duration: 4200,
            },
          }));
        }

        // Browser/system notification when the tab isn't focused.
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
            const notif = new Notification(item.title || 'إشعار جديد', {
              body: item.body || item.message || '',
              icon: '/icons/icon-512.png',
              badge: '/icons/badge-96.png',
              tag: `yamshat-${item.type || 'generic'}-${item.id || Date.now()}`,
              data: { url: item.path || '/notifications' },
            });
            notif.onclick = () => {
              try { window.focus(); } catch (_) {}
              if (item.path) {
                try { window.location.assign(item.path); } catch (_) {}
              }
              notif.close();
            };
          }
        } catch (_) { /* noop */ }

        // Short beep (skip if a beep already played in the last 1.5s).
        const now = Date.now();
        if (now - lastBeepRef.current > 1500) {
          lastBeepRef.current = now;
          try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) {
              const ctx = new Ctx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.value = 880;
              gain.gain.setValueAtTime(0.0001, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.35);
              setTimeout(() => { try { ctx.close(); } catch (_) {} }, 600);
            }
          } catch (_) { /* noop */ }
        }
      } catch (_) { /* noop */ }
    };

    const unsubscribe = socketManager.on('new_notification', handleIncoming);

    // ✅ دعم إشعارات محلية (تطلقها ويدجتات داخلية مثل بدء بث مباشر)
    // تستخدم نفس دورة حياة socket لتحديث الجرس + إصدار بيب + إظهار توست.
    const handleLocal = (event) => {
      try { handleIncoming(event?.detail || {}); } catch (_) { /* noop */ }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('yamshat:notification', handleLocal);
    }

    return () => {
      try { unsubscribe?.(); } catch (_) {}
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('yamshat:notification', handleLocal);
        }
      } catch (_) {}
    };
  }, [upsertNotification]);

  return null;
}
