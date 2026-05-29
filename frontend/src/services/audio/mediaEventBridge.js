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
  if (socketManager?.socket?.on) {
    const sock = socketManager.socket;
    const wrap = (ev, handler) => { sock.on(ev, handler); cleanups.push(() => sock.off(ev, handler)); };

    wrap('notification', (payload) => {
      audioService.onNotification(payload?.type || 'generic');
    });
    wrap('notification:like', () => audioService.onNotification('like'));
    wrap('notification:comment', () => audioService.onNotification('comment'));
    wrap('notification:follow', () => audioService.onNotification('follow'));
    wrap('notification:mention', () => audioService.onNotification('mention'));
    wrap('notification:friend_request', () => audioService.onNotification('friend_request'));
    wrap('live:started', () => audioService.liveStarted());
    wrap('live:ended', () => audioService.liveEnded());
    wrap('live:viewer_joined', () => audioService.onNotification('viewer_join'));
    wrap('live:gift', () => audioService.onNotification('gift'));
    wrap('call:incoming', (p) => audioService.startIncomingCall(!!p?.video));
    wrap('call:answered', () => audioService.stopIncomingCall());
    wrap('call:ended', () => audioService.endCall());
  }

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
