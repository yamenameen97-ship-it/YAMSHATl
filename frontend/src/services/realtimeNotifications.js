/**
 * Yamshat Realtime Notifications Client (v47.11)
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
 * ✅ v47.11: إصلاح أخطاء الكونسول
 *   - WebSocket يستخدم BACKEND_ORIGIN/SOCKET_URL بدل window.location.host
 *     (كان يحاول الاتصال بـ frontend host وهو خطأ على معماريات split frontend/backend)
 *   - فحص صلاحية VAPID public key قبل subscribe (تجنّب InvalidAccessError)
 *   - استخدام API client لتسجيل الجهاز بدل fetch مع relative path
 *   - إخفاء أخطاء WebSocket المتكررة بعد المحاولات الأولى
 *
 * ✅ v47.10: إصلاح فيضان أخطاء 404 في الكونسول
 *   - circuit breaker: يتوقف بعد MAX_FAILED_ATTEMPTS فشل متتالٍ
 *   - يمنع spam في الكونسول إذا كان endpoint غير متاح (404)
 *   - يدعم تعطيله بمتغير VITE_DISABLE_REALTIME_WS=true
 */

import { getAuthToken } from '../utils/auth.js';
import { SOCKET_URL, BACKEND_ORIGIN } from '../api/config.js';
import API from '../api/axios.js';

const WS_PATH = '/ws/notifications';
const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 60_000;
const MAX_FAILED_ATTEMPTS = 3; // بعدها نوقف المحاولات نهائياً للجلسة
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const DISABLED = String(import.meta.env.VITE_DISABLE_REALTIME_WS || '').toLowerCase() === 'true';

/**
 * بناء رابط WebSocket بالاعتماد على Backend origin (وليس frontend host).
 * يدعم: https → wss, http → ws.
 */
function buildWsUrl(token) {
  // الأولوية: VITE_WS_HOST → SOCKET_URL → BACKEND_ORIGIN → window.location.origin
  const explicitHost = String(import.meta.env.VITE_WS_HOST || '').trim();
  let base = explicitHost
    || String(SOCKET_URL || '').trim()
    || String(BACKEND_ORIGIN || '').trim()
    || (typeof window !== 'undefined' ? window.location.origin : '');

  // تحويل http(s) → ws(s)
  base = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');

  // إزالة trailing slash
  base = base.replace(/\/+$/, '');

  // إذا أعطي host بدون scheme، استخدم بروتوكول النافذة
  if (!/^wss?:\/\//i.test(base)) {
    const proto = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    base = `${proto}//${base.replace(/^\/+/, '')}`;
  }

  return `${base}${WS_PATH}?token=${encodeURIComponent(token || '')}`;
}

/**
 * تحويل Base64URL إلى Uint8Array مع التحقق من الصلاحية.
 * يرجع null إذا كان المفتاح غير صالح بدل رمي استثناء.
 */
function urlBase64ToUint8Array(base64String) {
  try {
    if (!base64String || typeof base64String !== 'string') return null;
    const cleaned = base64String.trim();
    // VAPID public key (P-256 uncompressed) = 65 bytes → ~87 Base64URL chars
    // نقبل أيضاً 86-88 لمراعاة padding
    if (cleaned.length < 80) return null;

    const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
    const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const arr = Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));

    // مفتاح VAPID صالح يجب أن يكون 65 بايت ويبدأ بـ 0x04 (uncompressed P-256)
    if (arr.length !== 65 || arr[0] !== 0x04) return null;

    return arr;
  } catch (_) {
    return null;
  }
}

/**
 * يتحقق ما إذا كان مفتاح VAPID المتوفر صالحاً للاستخدام.
 */
function isValidVapidKey(key) {
  return urlBase64ToUint8Array(key) !== null;
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
 * ✅ v47.11: يتحقق من صلاحية مفتاح VAPID قبل subscribe لتجنب InvalidAccessError،
 *           ويستخدم API client (الذي يعرف base URL الصحيح للباك إند).
 */
export async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  if (!VAPID_PUBLIC_KEY) {
    console.info('[realtime] VAPID key missing - web push disabled');
    return false;
  }

  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  if (!applicationServerKey) {
    // المفتاح موجود لكن غير صالح - لا داعي لإرعاب المستخدم بأخطاء InvalidAccessError
    console.info('[realtime] VAPID key invalid format - web push disabled (key must be 65-byte uncompressed P-256 in Base64URL)');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.register('/sw-push.js');
    await navigator.serviceWorker.ready;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } catch (subErr) {
        // InvalidAccessError أو AbortError - الكثير من المتصفحات ترفض VAPID غير صالحة
        console.info('[realtime] push subscribe failed:', subErr?.name || subErr?.message);
        return false;
      }
    }

    const keys = subscription.toJSON().keys || {};

    // استخدم API client (يعرف backend origin وحماية CSRF و auth headers)
    try {
      await API.post('/devices/register', {
        device_id: getOrCreateDeviceId(),
        push_token: subscription.endpoint,
        platform: 'web',
        provider: 'webpush',
        web_push_p256dh: keys.p256dh || null,
        web_push_auth: keys.auth || null,
        user_agent: navigator.userAgent.slice(0, 500),
      }, { silent: true, retry: false });
    } catch (regErr) {
      // فشل تسجيل الجهاز ليس قاتلاً - الاشتراك في المتصفح ناجح أصلاً
      console.info('[realtime] device registration failed (push still active locally)');
    }

    return true;
  } catch (e) {
    console.info('[realtime] web push registration failed:', e?.name || e?.message);
    return false;
  }
}
