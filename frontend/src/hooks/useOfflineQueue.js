import { useEffect, useRef } from 'react';
import { sendMessageApi } from '../api/chat.js';
import { useAppStore } from '../store/appStore.js';
import logger from '../utils/logger.js';
import featureFlags from '../utils/featureFlags.js';
import { getBackoffDelayMs, sleep } from '../utils/retry.js';

function fireQueueEvent(name, detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export default function useOfflineQueue() {
  const isOnline = useAppStore((state) => state.isOnline);
  const queuedActions = useAppStore((state) => state.queuedActions);
  const dequeueAction = useAppStore((state) => state.dequeueAction);
  const updateQueuedAction = useAppStore((state) => state.updateQueuedAction);
  const replaceQueuedActions = useAppStore((state) => state.replaceQueuedActions);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!featureFlags.offlineQueue || !isOnline || runningRef.current || queuedActions.length === 0) return;

    let cancelled = false;
    runningRef.current = true;

    const flushQueue = async () => {
      logger.info('offline queue flush started', { size: queuedActions.length });
      for (const action of queuedActions) {
        if (cancelled) break;
        if (action?.type !== 'chat:send_message' || !action?.payload) {
          dequeueAction(action?.id);
          continue;
        }

        const retryAtMs = action?.nextRetryAt ? new Date(action.nextRetryAt).getTime() : 0;
        if (retryAtMs && retryAtMs > Date.now()) {
          continue;
        }

        try {
          updateQueuedAction(action.id, { lastAttemptAt: new Date().toISOString() });
          const { data } = await sendMessageApi(action.payload);
          dequeueAction(action.id);
          fireQueueEvent('yamshat:queued-message-sent', {
            queuedId: action.id,
            client_id: action.payload.client_id,
            payload: action.payload,
            response: data?.data || data,
          });
          await sleep(120);
        } catch (error) {
          const status = error?.response?.status;
          const attempts = Number(action?.attempts || 0) + 1;
          logger.warn('offline queue item failed', { actionId: action.id, status, attempts });
          if (status && status < 500 && status !== 429) {
            dequeueAction(action.id);
            fireQueueEvent('yamshat:queued-message-failed', {
              queuedId: action.id,
              client_id: action.payload.client_id,
              payload: action.payload,
              error: error?.response?.data?.detail || error?.message || 'Queue item failed',
            });
            continue;
          }

          const delayMs = getBackoffDelayMs(attempts - 1, {
            baseDelayMs: status === 429 ? 1400 : 900,
            maxDelayMs: 45_000,
            jitterRatio: 0.4,
          });
          updateQueuedAction(action.id, {
            attempts,
            lastAttemptAt: new Date().toISOString(),
            nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
          });
          break;
        }
      }
      runningRef.current = false;
    };

    flushQueue();

    const pendingRetryAt = queuedActions
      .map((item) => (item?.nextRetryAt ? new Date(item.nextRetryAt).getTime() : 0))
      .filter((value) => value > Date.now())
      .sort((a, b) => a - b)[0];

    const timer = pendingRetryAt
      ? window.setTimeout(() => {
        replaceQueuedActions([...useAppStore.getState().queuedActions]);
      }, Math.max(250, pendingRetryAt - Date.now() + 50))
      : null;

    return () => {
      cancelled = true;
      runningRef.current = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [dequeueAction, isOnline, queuedActions, replaceQueuedActions, updateQueuedAction]);
}
