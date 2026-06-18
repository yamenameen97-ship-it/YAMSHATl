/**
 * Yamshat Realtime Notifications Client (v47.10)
 * -------------------------------------------------
 * عميل WebSocket مخصّص للإشعارات اللحظية - يعمل مثل Instagram/Twitter.
 *
 * يتولّى:
 *   - فتح WebSocket لـ /ws/notifications مع JWT
 *   - إعادة الاتصال التلقائي مع backoff
 *   - heartbeat (ping/pong) كل 25 ثانية
 *   - إصدار حدث `yamshat:notification` لكل إشعار جديد
 *   - تسجيل/إلغاء جهاز Web Push عبر VAPID
 *
 * ✅ v47.10: إصلاح فيضان أخطاء 404 في الكونسول
 *   - circuit breaker: يتوقف بعد MAX_FAILED_ATTEMPTS فشل متتالٍ
 *   - يمنع spam في الكونسول إذا كان endpoint غير متاح (404)
 *   - يدعم تعطيله بمتغير VITE_DISABLE_REALTIME_WS=true
 */

import { getAuthToken } from '../utils/auth.js';

const WS_PATH = '/ws/notifications';
const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 60_000;
const MAX_FAILED_ATTEMPTS = 3; // بعدها نوقف المحاولات نهائياً للجلسة
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const DISABLED = String(import.meta.env.VITE_DISABLE_REALTIME_WS || '').toLowerCase() === 'true';

function buildWsUrl(token) {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_HOST || window.location.host;
  return `${proto}//${host}${WS_PATH}?token=${encodeURIComponent(token || '')}`;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function getOrCreateDeviceId() {
  let id = localStorage.getItem('yamshat_device_id');
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('yamshat_device_id', id);
  }
  return id;
}

class RealtimeNotificationsClient {
  constructor() {
    this.socket = null;
    this.reconnectAttempt = 0;
    this.failedAttempts = 0;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.manualClose = false;
    this.disabled = DISABLED;
    this.listeners = new Set();
    this.everConnected = false;
  }

  start() {
    if (this.disabled) {
      console.info('[realtime] WS realtime notifications disabled by env');
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    this.manualClose = false;
    this.failedAttempts = 0;
    this._connect(token);
  }

  stop() {
    this.manualClose = true;
    this._clearTimers();
    if (this.socket) {
      try { this.socket.close(1000, 'client_stop'); } catch (_) {}
      this.socket = null;
    }
  }

  onNotification(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  send(payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try { this.socket.send(JSON.stringify(payload)); } catch (_) {}
    }
  }

  ackNotification(notificationId) {
    this.send({ type: 'ack', notification_id: notificationId });
  }

  notifyRead(notificationId) {
    this.send({ type: 'mark_read', notification_id: notificationId });
  }

  _connect(token) {
    if (this.disabled) return;
    // كتم console.error مؤقتاً لأن المتصفح يطبع خطأ WebSocket تلقائياً (لا يمكن منعه عبر JS)
    // نعتمد بدلاً من ذلك على عدم محاولة الاتصال أصلاً بعد فشل متكرر
    try {
      this.socket = new WebSocket(buildWsUrl(token));
    } catch (e) {
      this._handleFailure();
      return;
    }

    this.socket.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.failedAttempts = 0;
      this.everConnected = true;
      this._startHeartbeat();
      console.info('[realtime] notifications WS connected');
    });

    this.socket.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch (_) { return; }

      if (msg.type === 'ping') {
        this.send({ type: 'pong' });
        return;
      }
      if (msg.type === 'connection_ack') return;

      if (msg.type === 'new_notification') {
        const item = msg.data || {};
        try {
          window.dispatchEvent(new CustomEvent('yamshat:notification', { detail: item }));
        } catch (_) {}
        if (item.id) this.ackNotification(item.id);
        this.listeners.forEach((fn) => {
          try { fn(item); } catch (_) {}
        });
      }
    });

    this.socket.addEventListener('close', (ev) => {
      this._clearTimers();
      // إذا لم نتصل أبداً وأُغلقت بسرعة (404/handshake fail)، عدّ فشلاً
      if (!this.everConnected) {
        this._handleFailure();
      } else if (!this.manualClose) {
        this._scheduleReconnect();
      }
    });

    this.socket.addEventListener('error', () => {
      // أخطاء WebSocket لا يمكن منع المتصفح من طباعتها في الكونسول،
      // لكن نحن نتعامل معها بهدوء عبر circuit breaker
      try { this.socket && this.socket.close(); } catch (_) {}
    });
  }

  _handleFailure() {
    this.failedAttempts += 1;
    if (this.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // circuit breaker: توقف نهائياً لهذه الجلسة
      this.disabled = true;
      this._clearTimers();
      console.warn(
        `[realtime] WS endpoint unavailable after ${MAX_FAILED_ATTEMPTS} attempts — disabled for this session. ` +
        `Set VITE_DISABLE_REALTIME_WS=true to suppress this.`
      );
      return;
    }
    if (!this.manualClose) this._scheduleReconnect();
  }

  _scheduleReconnect() {
    if (this.manualClose || this.disabled) return;
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempt), MAX_BACKOFF_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      const token = getAuthToken();
      if (token) this._connect(token);
    }, delay);
  }

  _startHeartbeat() {
    this._clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, HEARTBEAT_MS);
  }

  _clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _clearTimers() {
    this._clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const realtimeNotifications = new RealtimeNotificationsClient();

/**
 * تسجيل Web Push (VAPID) وإرسال الـ subscription للخادم.
 */
export async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  // تحقق صارم من مفتاح VAPID لتجنب InvalidAccessError في الكونسول
  if (!VAPID_PUBLIC_KEY || typeof VAPID_PUBLIC_KEY !== 'string' || VAPID_PUBLIC_KEY.length < 80) {
    console.info('[realtime] VAPID key missing or invalid - web push disabled');
    return false;
  }
  let serverKey;
  try {
    serverKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    if (!serverKey || serverKey.length !== 65) {
      console.info('[realtime] VAPID key wrong length - web push disabled');
      return false;
    }
  } catch (keyErr) {
    console.info('[realtime] VAPID key decode failed - web push disabled', keyErr?.message || keyErr);
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.register('/sw-push.js');
    await navigator.serviceWorker.ready;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: serverKey,
      });
    }

    const keys = subscription.toJSON().keys || {};
    const token = getAuthToken();

    await fetch('/api/devices/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        device_id: getOrCreateDeviceId(),
        push_token: subscription.endpoint,
        platform: 'web',
        provider: 'webpush',
        web_push_p256dh: keys.p256dh || null,
        web_push_auth: keys.auth || null,
        user_agent: navigator.userAgent.slice(0, 500),
      }),
    });
    return true;
  } catch (e) {
    console.warn('[realtime] web push registration failed', e);
    return false;
  }
}
