/**
 * mediaEventBridge.js
 * ------------------------------------
 * Wires the centralized audioService to the existing app event sources:
 *  - chatEventBus (typing, new message, sent, seen, failed)
 *  - notification store updates
 *  - socket manager events (if available)
 *
 * Import this ONCE from main.jsx / App.jsx to activate global wiring.
 */
import audioService from './audioService.js';

let activated = false;

export function activateMediaEventBridge({
  notificationStore,            // optional: zustand store for notifications
  socketManager,                // optional: socket.io wrapper
  chatBus,                       // optional: { onChatBus } from features/chat
} = {}) {
  if (activated || typeof window === 'undefined') return () => {};
  activated = true;

  const cleanups = [];
  const bindSocketEvent = (eventName, handler) => {
    if (typeof socketManager?.on === 'function') {
      const unsubscribe = socketManager.on(eventName, handler);
      if (typeof unsubscribe === 'function') cleanups.push(unsubscribe);
      return true;
    }
    if (socketManager?.socket?.on) {
      socketManager.socket.on(eventName, handler);
      cleanups.push(() => socketManager.socket.off(eventName, handler));
      return true;
    }
    return false;
  };

  // 1) Chat bus integration
  if (chatBus?.onChatBus) {
    cleanups.push(chatBus.onChatBus('message:received', (payload) => {
      // skip my own
      if (payload?.self) return;
      audioService.onMessageReceived();
    }));
    cleanups.push(chatBus.onChatBus('message:sent', () => audioService.onMessageSent()));
    cleanups.push(chatBus.onChatBus('message:seen', () => audioService.onMessageSeen()));
    cleanups.push(chatBus.onChatBus('message:failed', () => audioService.onMessageFailed()));
    cleanups.push(chatBus.onChatBus('typing', () => audioService.onTyping()));
    cleanups.push(chatBus.onChatBus('call:incoming', (p) => audioService.startIncomingCall(!!p?.video)));
    cleanups.push(chatBus.onChatBus('call:ended', () => audioService.endCall()));
  }

  // 2) Socket-driven notifications (best-effort, optional)
  bindSocketEvent('notification', (payload) => {
    audioService.onNotification(payload?.type || 'generic');
  });
  bindSocketEvent('new_notification', (payload) => {
    audioService.onNotification(payload?.type || payload?.category || 'generic');
  });
  bindSocketEvent('notification:like', () => audioService.onNotification('like'));
  bindSocketEvent('notification:comment', () => audioService.onNotification('comment'));
  bindSocketEvent('notification:follow', () => audioService.onNotification('follow'));
  bindSocketEvent('notification:mention', () => audioService.onNotification('mention'));
  bindSocketEvent('notification:friend_request', () => audioService.onNotification('friend_request'));
  bindSocketEvent('live:started', () => audioService.liveStarted());
  bindSocketEvent('live:ended', () => audioService.liveEnded());
  bindSocketEvent('live:viewer_joined', () => audioService.onNotification('viewer_join'));
  bindSocketEvent('live:gift', () => audioService.onNotification('gift'));
  bindSocketEvent('call:incoming', (p) => audioService.startIncomingCall(!!p?.video));
  bindSocketEvent('call:answered', () => audioService.stopIncomingCall());
  bindSocketEvent('call:ended', () => audioService.endCall());

  // 3) Notification store subscription (zustand)
  if (notificationStore?.subscribe) {
    let lastSeenId = null;
    cleanups.push(notificationStore.subscribe((state) => {
      const items = state?.items || state?.notifications || [];
      const newest = items[0];
      if (!newest) return;
      const id = newest.id || newest._id;
      if (id && id !== lastSeenId) {
        lastSeenId = id;
        if (lastSeenId !== null) {
          audioService.onNotification(newest.type || 'generic');
        }
      }
    }));
  }

  // 4) BroadcastChannel cross-tab dedupe (optional, prevents same sound from many tabs)
  if (typeof BroadcastChannel === 'function') {
    try {
      const bc = new BroadcastChannel('yamshat-audio');
      cleanups.push(() => bc.close());
    } catch { /* ignore */ }
  }

  return () => {
    cleanups.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
    activated = false;
  };
}

export default activateMediaEventBridge;
