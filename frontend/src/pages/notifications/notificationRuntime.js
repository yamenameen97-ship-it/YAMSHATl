import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getNotifications } from '../../api/notifications.js';
import notificationService from '../../services/notificationService.js';
import socketManager from '../../services/socketManager.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { maybeShowBrowserNotification, normalizeNotification } from '../../utils/notificationCenter.js';
import {
  buildBatchSummary,
  dedupeNotifications,
  getUnreadCount,
  playNotificationFeedback,
  postServiceWorkerMessage,
  registerBackgroundNotificationSync,
} from './notificationUtils.js';

let runtimeInitialized = false;

function emitToast(pushToast, toast) {
  if (typeof pushToast === 'function') {
    pushToast(toast);
    return;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yamshat:toast', { detail: toast }));
  }
}

async function readPushSubscriptionStatus() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

export function useNotificationsRuntime(pushToast) {
  const hydrateNotifications = useNotificationStore((state) => state.hydrateNotifications);
  const upsertNotifications = useNotificationStore((state) => state.upsertNotifications);
  const restoreFromStorage = useNotificationStore((state) => state.restoreFromStorage);
  const preferences = useNotificationStore((state) => state.preferences);
  const setPreferences = useNotificationStore((state) => state.setPreferences);
  const status = useNotificationStore((state) => state.status);
  const setStatus = useNotificationStore((state) => state.setStatus);

  const syncInFlightRef = useRef(false);
  const batchTimerRef = useRef(null);
  const pendingBatchRef = useRef([]);

  const flushBatch = useCallback(async (source = 'realtime') => {
    if (batchTimerRef.current) {
      window.clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    const batchItems = dedupeNotifications(pendingBatchRef.current.splice(0));
    setStatus({ pendingBatchSize: 0 });
    if (!batchItems.length) return;

    upsertNotifications(batchItems);
    const summary = buildBatchSummary(batchItems);
    setStatus({
      lastBatchAt: new Date().toISOString(),
      lastSource: source,
      lastSocketEventAt: new Date().toISOString(),
    });

    playNotificationFeedback(preferences, batchItems.length);

    if (batchItems.length === 1) {
      emitToast(pushToast, {
        type: 'info',
        title: batchItems[0].title,
        description: batchItems[0].body,
        duration: 4200,
      });

      if (preferences.pushEnabled) {
        await maybeShowBrowserNotification(batchItems[0]).catch(() => null);
      }
      return;
    }

    emitToast(pushToast, {
      type: 'info',
      title: summary.title,
      description: `${summary.unreadCount} غير مقروء • ${summary.body}`,
      duration: 5200,
      actionLabel: 'فتح المركز',
      onAction: () => {
        if (typeof window !== 'undefined') window.location.hash = '#/notifications';
      },
    });

    if (preferences.pushEnabled) {
      await postServiceWorkerMessage('yamshat:queue-notification', {
        items: batchItems,
        summary,
        immediate: true,
      });
    }
  }, [preferences, pushToast, setStatus, upsertNotifications]);

  const queueIncomingNotification = useCallback((incoming, source = 'realtime') => {
    const nextNotification = normalizeNotification(incoming);
    pendingBatchRef.current.push(nextNotification);
    setStatus({
      pendingBatchSize: pendingBatchRef.current.length,
      lastSource: source,
    });

    if (!preferences.batchingEnabled) {
      flushBatch(source).catch(() => null);
      return;
    }

    if (batchTimerRef.current) window.clearTimeout(batchTimerRef.current);
    batchTimerRef.current = window.setTimeout(() => {
      flushBatch(source).catch(() => null);
    }, Number(preferences.batchWindowMs || 900));
  }, [flushBatch, preferences.batchWindowMs, preferences.batchingEnabled, setStatus]);

  const syncNotifications = useCallback(async (source = 'manual') => {
    if (syncInFlightRef.current) return null;
    syncInFlightRef.current = true;
    setStatus({ isSyncing: true, lastSource: source });

    try {
      const { data } = await getNotifications(100);
      const normalized = dedupeNotifications(Array.isArray(data) ? data : []);
      hydrateNotifications(normalized, { replace: true });
      setStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        lastSource: source,
        unreadServerCount: getUnreadCount(normalized),
        lastServerCount: normalized.length,
        syncError: '',
      });
      return normalized;
    } catch (error) {
      restoreFromStorage();
      setStatus({
        isSyncing: false,
        syncError: error?.message || 'sync_failed',
        lastSource: source,
      });
      return null;
    } finally {
      syncInFlightRef.current = false;
    }
  }, [hydrateNotifications, restoreFromStorage, setStatus]);

  const runtimeState = useMemo(() => ({ preferences, status }), [preferences, status]);

  useEffect(() => {
    let disposed = false;
    restoreFromStorage();

    if (!runtimeInitialized) {
      runtimeInitialized = true;
      notificationService.initialize().catch(() => null);
    }

    readPushSubscriptionStatus().then((pushSubscribed) => {
      if (!disposed) {
        setStatus({
          pushSubscribed,
          pushPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
        });
      }
    }).catch(() => null);

    syncNotifications('startup').catch(() => null);

    registerBackgroundNotificationSync(preferences.backgroundSyncEnabled)
      .then((backgroundSyncRegistered) => {
        if (!disposed) setStatus({ backgroundSyncRegistered });
      })
      .catch(() => null);

    const socketUnsubscribe = socketManager.on('new_notification', (payload) => {
      if (!preferences.realtimeEnabled) return;
      queueIncomingNotification(payload, 'realtime');
    });

    const handleSocketState = (event) => {
      const detail = event?.detail || {};
      setStatus({ socketConnected: Boolean(detail.connected) });
      if (detail.connected && preferences.unreadSyncEnabled) {
        syncNotifications('socket-reconnect').catch(() => null);
      }
    };

    const handleSyncRequest = (event) => {
      const source = event?.detail?.source || 'manual';
      syncNotifications(source).catch(() => null);
    };

    const handlePreferenceUpdate = (event) => {
      setPreferences(event?.detail || {});
    };

    const handleServiceWorkerMessage = (event) => {
      const data = event?.data || {};
      if (data?.type === 'yamshat:notification-click' && data?.payload?.path && preferences.deepLinking) {
        if (typeof window !== 'undefined') window.location.hash = `#${data.payload.path}`;
      }

      if (data?.type === 'yamshat:notifications-flushed') {
        setStatus({ lastBatchAt: new Date().toISOString(), pendingBatchSize: 0 });
      }

      if (data?.type === 'yamshat:sync-now' && preferences.unreadSyncEnabled) {
        syncNotifications('background-sync').catch(() => null);
      }
    };

    const handleFocusSync = (event) => {
      if (event?.type === 'visibilitychange' && document.visibilityState !== 'visible') return;
      const source = event?.type === 'online' ? 'online' : event?.type === 'focus' ? 'focus' : 'visibility';
      if (preferences.unreadSyncEnabled) syncNotifications(source).catch(() => null);
      if (preferences.backgroundSyncEnabled) {
        registerBackgroundNotificationSync(true)
          .then((backgroundSyncRegistered) => setStatus({ backgroundSyncRegistered }))
          .catch(() => null);
      }
    };

    const intervalId = window.setInterval(() => {
      if (preferences.unreadSyncEnabled) syncNotifications('poll').catch(() => null);
    }, Number(preferences.syncIntervalMs || 30000));

    window.addEventListener('yamshat:socket-state', handleSocketState);
    window.addEventListener('yamshat:notifications-sync-request', handleSyncRequest);
    window.addEventListener('yamshat:notification-preferences', handlePreferenceUpdate);
    window.addEventListener('online', handleFocusSync);
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);
    navigator.serviceWorker?.addEventListener?.('message', handleServiceWorkerMessage);

    return () => {
      disposed = true;
      socketUnsubscribe?.();
      window.removeEventListener('yamshat:socket-state', handleSocketState);
      window.removeEventListener('yamshat:notifications-sync-request', handleSyncRequest);
      window.removeEventListener('yamshat:notification-preferences', handlePreferenceUpdate);
      window.removeEventListener('online', handleFocusSync);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
      navigator.serviceWorker?.removeEventListener?.('message', handleServiceWorkerMessage);
      window.clearInterval(intervalId);
      if (batchTimerRef.current) {
        window.clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    };
  }, [preferences.backgroundSyncEnabled, preferences.deepLinking, preferences.realtimeEnabled, preferences.syncIntervalMs, preferences.unreadSyncEnabled, queueIncomingNotification, restoreFromStorage, setPreferences, setStatus, syncNotifications]);

  return runtimeState;
}

export function requestNotificationSync(source = 'manual') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yamshat:notifications-sync-request', {
    detail: { source },
  }));
}

export function NotificationRuntimeBridge() {
  useNotificationsRuntime();
  return null;
}
