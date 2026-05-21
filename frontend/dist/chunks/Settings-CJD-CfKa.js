import { r as reactExports, d as useAppStore, A as API, C as notificationService, E as getCDNConfig, F as getMediaDeliveryProfile, j as jsxRuntimeExports, B as Button, M as MEDIA_SECURITY, S as SIGNED_URL_TTL_SECONDS, G as currentMediaProviderLabel } from "../index-DuXBJv5q.js";
import { M as MainLayout } from "./MainLayout-CsZ3tvBx.js";
import { C as Card } from "./Card-qq68bGlj.js";
import "./proxy-BFepwXo2.js";
const RATE_LIMIT_PREFIX = "yamshat-rate-limit";
const SHADOW_BAN_KEY = "yamshat-shadow-bans";
function now() {
  return Date.now();
}
function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 6e4, storageKey = "") {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.storageKey = storageKey || `${RATE_LIMIT_PREFIX}:${maxRequests}:${windowMs}`;
    this.requests = readJson(this.storageKey, []);
  }
  prune() {
    const threshold = now() - this.windowMs;
    this.requests = this.requests.filter((time) => Number(time) > threshold);
    writeJson(this.storageKey, this.requests);
  }
  isAllowed(weight = 1) {
    this.prune();
    if (this.requests.length + weight > this.maxRequests) return false;
    for (let index = 0; index < weight; index += 1) {
      this.requests.push(now());
    }
    writeJson(this.storageKey, this.requests);
    return true;
  }
  getRemainingRequests() {
    this.prune();
    return Math.max(0, this.maxRequests - this.requests.length);
  }
  getResetTime() {
    this.prune();
    if (!this.requests.length) return 0;
    return Math.max(0, this.requests[0] + this.windowMs - now());
  }
  reset() {
    this.requests = [];
    writeJson(this.storageKey, this.requests);
  }
}
class DuplicateDetector {
  constructor(timeWindowMs = 5e3) {
    this.timeWindowMs = timeWindowMs;
    this.history = [];
  }
  hashContent(content) {
    let hash = 0;
    const str = JSON.stringify(content);
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
  isDuplicate(content) {
    const threshold = now() - this.timeWindowMs;
    this.history = this.history.filter((entry) => entry.time > threshold);
    const hash = this.hashContent(content);
    const duplicate = this.history.some((entry) => entry.hash === hash);
    this.history.push({ hash, time: now() });
    return duplicate;
  }
  clear() {
    this.history = [];
  }
}
class BotDetector {
  analyze(payload = {}) {
    const pointerMoves = Number(payload.pointerMoves || 0);
    const keyStrokes = Number(payload.keyStrokes || 0);
    const typingDurationMs = Number(payload.typingDurationMs || 0);
    const pasteRatio = Number(payload.pasteRatio || 0);
    const retryBursts = Number(payload.retryBursts || 0);
    const formFillMs = Number(payload.formFillMs || 0);
    let score = 0;
    if (typingDurationMs > 0 && keyStrokes > 0) {
      const cps = keyStrokes / Math.max(typingDurationMs / 1e3, 1);
      if (cps > 11) score += 24;
      else if (cps > 7) score += 12;
    }
    if (pointerMoves < 2 && keyStrokes > 12) score += 18;
    if (pasteRatio > 0.85) score += 14;
    if (retryBursts > 4) score += 20;
    if (formFillMs > 0 && formFillMs < 1200) score += 18;
    const verdict = score >= 60 ? "high-risk" : score >= 35 ? "review" : "human-like";
    return {
      score,
      verdict,
      humanConfidence: Math.max(0, 100 - score),
      flags: [
        pointerMoves < 2 && keyStrokes > 12 ? "low-pointer-activity" : "",
        pasteRatio > 0.85 ? "high-paste-ratio" : "",
        retryBursts > 4 ? "burst-retries" : ""
      ].filter(Boolean)
    };
  }
}
class ShadowBanRegistry {
  list() {
    return readJson(SHADOW_BAN_KEY, []);
  }
  isShadowBanned(identifier) {
    return this.list().some((item) => item.identifier === identifier && item.active !== false);
  }
  set(identifier, reason = "spam-risk") {
    const current = this.list().filter((item) => item.identifier !== identifier);
    const next = [{ identifier, reason, active: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() }, ...current].slice(0, 100);
    writeJson(SHADOW_BAN_KEY, next);
    return next[0];
  }
  clear(identifier) {
    const next = this.list().filter((item) => item.identifier !== identifier);
    writeJson(SHADOW_BAN_KEY, next);
    return next;
  }
}
function createAntiSpamReport({ actionKey = "generic", content = "", behavior = {} } = {}) {
  const limiter = new RateLimiter(8, 6e4, `${RATE_LIMIT_PREFIX}:${actionKey}`);
  const duplicateDetector = new DuplicateDetector(8e3);
  const botDetector = new BotDetector();
  const shadowBans = new ShadowBanRegistry();
  const allowed = limiter.isAllowed();
  const duplicate = duplicateDetector.isDuplicate(content);
  const bot = botDetector.analyze(behavior);
  const shouldShadowBan = duplicate && bot.score >= 35;
  if (shouldShadowBan) shadowBans.set(actionKey, "duplicate + automated behavior");
  return {
    allowed,
    duplicate,
    bot,
    shadowBanned: shadowBans.isShadowBanned(actionKey),
    remainingRequests: limiter.getRemainingRequests(),
    resetInMs: limiter.getResetTime()
  };
}
function RateLimitUI({ remaining, resetTime }) {
  if (remaining > 0) return null;
  const seconds = Math.ceil(resetTime / 1e3);
  return reactExports.createElement(
    "div",
    { style: { padding: "12px 16px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, fontSize: 14, color: "#92400e" } },
    `⏱️ تم الوصول للحد الأقصى من المحاولات. حاول تاني بعد ${seconds} ثانية.`
  );
}
function CooldownUI({ remaining, action = "الإجراء" }) {
  if (remaining <= 0) return null;
  const seconds = Math.ceil(remaining / 1e3);
  return reactExports.createElement(
    "div",
    { style: { padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, fontSize: 14, color: "#1d4ed8" } },
    `🛡️ انتظر ${seconds} ثانية قبل ${action} لتقليل الـ spam.`
  );
}
const DEVICE_STORE_KEY = "yamshat.trusted.devices";
const SESSION_STORE_KEY = "yamshat.device.sessions";
const ALERTS_STORE_KEY = "yamshat.device.alerts";
const SYNC_STORE_KEY = "yamshat.device.sync";
const CHANNEL_NAME = "yamshat-multi-device";
function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function persist(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}
function getCurrentDeviceFingerprint() {
  if (typeof window === "undefined") return "server-device";
  const platform = navigator.userAgentData?.platform || navigator.platform || "unknown";
  const seed = [
    navigator.userAgent,
    platform,
    navigator.language,
    window.screen?.width || 0,
    window.screen?.height || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  ].join("|");
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return `device_${Math.abs(hash)}`;
}
function getCurrentDeviceLabel() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const platform = /android/i.test(ua) ? "Android" : /iphone|ipad|ipod/i.test(ua) ? "iPhone / iPad" : /mac/i.test(ua) ? "macOS" : /win/i.test(ua) ? "Windows" : /linux/i.test(ua) ? "Linux" : "Web";
  const browser = /edg/i.test(ua) ? "Edge" : /chrome/i.test(ua) ? "Chrome" : /firefox/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Browser";
  return `${browser} • ${platform}`;
}
function fallbackTrustedDevices() {
  const currentId = getCurrentDeviceFingerprint();
  const list = read(DEVICE_STORE_KEY, []);
  if (list.length) return list;
  const initial = [{
    id: currentId,
    label: getCurrentDeviceLabel(),
    trusted: true,
    current: true,
    lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
    trustedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ipLabel: "Current network"
  }];
  persist(DEVICE_STORE_KEY, initial);
  return initial;
}
function fallbackSessions() {
  const currentId = getCurrentDeviceFingerprint();
  const sessions = read(SESSION_STORE_KEY, []);
  if (sessions.length) return sessions;
  const initial = [{
    id: `session-${currentId}`,
    device_id: currentId,
    device_label: getCurrentDeviceLabel(),
    current: true,
    trusted: true,
    last_active_at: (/* @__PURE__ */ new Date()).toISOString(),
    sync_state: "healthy",
    push_enabled: "Notification" in window ? Notification.permission === "granted" : false
  }];
  persist(SESSION_STORE_KEY, initial);
  return initial;
}
function fallbackAlerts() {
  const alerts = read(ALERTS_STORE_KEY, []);
  if (alerts.length) return alerts;
  const initial = [{
    id: "alert-current-login",
    severity: "info",
    title: "تم التحقق من الجهاز الحالي",
    description: "تم تمييز هذا الجهاز كجهاز موثوق ويمكنه استلام تنبيهات الدخول والجلسات.",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }];
  persist(ALERTS_STORE_KEY, initial);
  return initial;
}
function updateCollection(collection, predicate, updater) {
  return collection.map((item) => predicate(item) ? typeof updater === "function" ? updater(item) : { ...item, ...updater } : item);
}
async function attemptRemote(method, url, config) {
  try {
    const response = await API[method](url, ...Array.isArray(config) ? config : [config].filter((value) => value !== void 0));
    return response?.data;
  } catch {
    return null;
  }
}
const deviceTrustService = {
  async getTrustedDevices() {
    const remote = await attemptRemote("get", "/users/trusted-devices");
    if (Array.isArray(remote?.items || remote)) return remote.items || remote;
    return fallbackTrustedDevices();
  },
  async trustCurrentDevice() {
    const payload = {
      device_id: getCurrentDeviceFingerprint(),
      label: getCurrentDeviceLabel(),
      trusted: true
    };
    const remote = await attemptRemote("post", "/users/trusted-devices", payload);
    if (remote) return remote;
    const list = fallbackTrustedDevices();
    const currentId = payload.device_id;
    const existing = list.find((item) => item.id === currentId || item.device_id === currentId);
    const next = existing ? updateCollection(list, (item) => item.id === currentId || item.device_id === currentId, { trusted: true, current: true, trustedAt: (/* @__PURE__ */ new Date()).toISOString(), lastSeenAt: (/* @__PURE__ */ new Date()).toISOString() }) : [{ ...payload, id: currentId, current: true, trustedAt: (/* @__PURE__ */ new Date()).toISOString(), lastSeenAt: (/* @__PURE__ */ new Date()).toISOString() }, ...list];
    persist(DEVICE_STORE_KEY, next);
    return next;
  },
  async untrustDevice(deviceId) {
    const remote = await attemptRemote("delete", `/users/trusted-devices/${encodeURIComponent(deviceId)}`);
    if (remote) return remote;
    const next = fallbackTrustedDevices().filter((item) => (item.id || item.device_id) !== deviceId);
    persist(DEVICE_STORE_KEY, next);
    return next;
  },
  async getSessions() {
    const remote = await attemptRemote("get", "/users/sessions");
    const list = Array.isArray(remote?.items || remote) ? remote.items || remote : fallbackSessions();
    persist(SESSION_STORE_KEY, list);
    return list;
  },
  async revokeSession(sessionId) {
    const remote = await attemptRemote("delete", `/users/sessions/${encodeURIComponent(sessionId)}`);
    if (remote) return remote;
    const next = fallbackSessions().filter((item) => item.id !== sessionId);
    persist(SESSION_STORE_KEY, next);
    return next;
  },
  async getLoginAlerts() {
    const remote = await attemptRemote("get", "/users/login-alerts");
    if (Array.isArray(remote?.items || remote)) return remote.items || remote;
    return fallbackAlerts();
  },
  async createLoginAlert(alert) {
    const payload = {
      id: `alert-${Date.now()}`,
      severity: alert?.severity || "warning",
      title: alert?.title || "تنبيه تسجيل دخول",
      description: alert?.description || "تم رصد محاولة دخول جديدة وتحتاج لمراجعتك.",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await attemptRemote("post", "/users/login-alerts", payload);
    const next = [payload, ...fallbackAlerts()].slice(0, 20);
    persist(ALERTS_STORE_KEY, next);
    return payload;
  },
  getSyncState() {
    const session = useAppStore.getState().session;
    const snapshot = read(SYNC_STORE_KEY, {
      profile_revision: 1,
      notifications_revision: 1,
      inbox_revision: 1,
      last_sync_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: session?.session_id || session?.id || null,
      strategy: "broadcast-channel + storage event fallback",
      conflicts: 0,
      devices_online: 1
    });
    return snapshot;
  },
  updateSyncState(patch = {}) {
    const next = {
      ...this.getSyncState(),
      ...patch,
      last_sync_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    persist(SYNC_STORE_KEY, next);
    this.broadcastSyncState(next);
    return next;
  },
  broadcastSyncState(payload = {}) {
    if (typeof window === "undefined") return;
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: "sync-state", payload });
      channel.close();
    } catch {
      window.localStorage.setItem(`${SYNC_STORE_KEY}.broadcast`, JSON.stringify({ payload, sentAt: Date.now() }));
    }
  },
  subscribe(handler) {
    if (typeof window === "undefined" || typeof handler !== "function") return () => {
    };
    const onStorage = (event) => {
      if (event.key !== `${SYNC_STORE_KEY}.broadcast`) return;
      const payload = safeParse(event.newValue, null);
      if (payload?.payload) handler(payload.payload);
    };
    window.addEventListener("storage", onStorage);
    let channel = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event?.data?.type === "sync-state") handler(event.data.payload);
      };
    } catch {
      channel = null;
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close?.();
    };
  }
};
const TABS = [
  { key: "security", label: "الأمان" },
  { key: "devices", label: "الأجهزة الموثوقة" },
  { key: "media", label: "حماية الوسائط" },
  { key: "notifications", label: "Push Notifications" },
  { key: "sync", label: "Multi Device" }
];
function Settings() {
  const [activeTab, setActiveTab] = reactExports.useState("security");
  const [trustedDevices, setTrustedDevices] = reactExports.useState([]);
  const [sessions, setSessions] = reactExports.useState([]);
  const [alerts, setAlerts] = reactExports.useState([]);
  const [pushState, setPushState] = reactExports.useState(notificationService.getPushReadiness());
  const [syncState, setSyncState] = reactExports.useState(deviceTrustService.getSyncState());
  const [message, setMessage] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState("");
  const antiSpam = reactExports.useMemo(() => createAntiSpamReport({
    actionKey: "settings-preview",
    content: "preview",
    behavior: { pointerMoves: 6, keyStrokes: 14, typingDurationMs: 4200, pasteRatio: 0.1, retryBursts: 0, formFillMs: 4200 }
  }), []);
  const cdnConfig = reactExports.useMemo(() => getCDNConfig(), []);
  const imageDelivery = reactExports.useMemo(() => getMediaDeliveryProfile("image"), []);
  const videoDelivery = reactExports.useMemo(() => getMediaDeliveryProfile("video"), []);
  const fileDelivery = reactExports.useMemo(() => getMediaDeliveryProfile("file"), []);
  reactExports.useEffect(() => {
    let unsubscribe = () => {
    };
    const load = async () => {
      const [devicesResult, sessionsResult, alertsResult] = await Promise.all([
        deviceTrustService.getTrustedDevices(),
        deviceTrustService.getSessions(),
        deviceTrustService.getLoginAlerts()
      ]);
      setTrustedDevices(Array.isArray(devicesResult) ? devicesResult : devicesResult?.items || []);
      setSessions(Array.isArray(sessionsResult) ? sessionsResult : sessionsResult?.items || []);
      setAlerts(Array.isArray(alertsResult) ? alertsResult : alertsResult?.items || []);
      setPushState(notificationService.getPushReadiness());
      setSyncState(deviceTrustService.getSyncState());
      unsubscribe = deviceTrustService.subscribe((payload) => setSyncState((prev) => ({ ...prev, ...payload || {} })));
    };
    load();
    return () => unsubscribe();
  }, []);
  const setSuccess = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };
  const handleTrustCurrentDevice = async () => {
    setBusy("trust-device");
    await deviceTrustService.trustCurrentDevice();
    setTrustedDevices(await deviceTrustService.getTrustedDevices());
    setSuccess("تم اعتبار الجهاز الحالي موثوق.");
    setBusy("");
  };
  const handleRemoveDevice = async (deviceId) => {
    setBusy(deviceId);
    await deviceTrustService.untrustDevice(deviceId);
    setTrustedDevices(await deviceTrustService.getTrustedDevices());
    setSuccess("تم إزالة الجهاز من قائمة الأجهزة الموثوقة.");
    setBusy("");
  };
  const handleRevokeSession = async (sessionId) => {
    setBusy(sessionId);
    await deviceTrustService.revokeSession(sessionId);
    setSessions(await deviceTrustService.getSessions());
    setSuccess("تم إنهاء الجلسة المحددة.");
    setBusy("");
  };
  const handleEnablePush = async () => {
    setBusy("push");
    await notificationService.initialize();
    await notificationService.subscribeToPushNotifications().catch(() => null);
    setPushState(notificationService.getPushReadiness());
    setSuccess("تم تجهيز إشعارات الـ Push للجهاز الحالي.");
    setBusy("");
  };
  const handleSyncNow = () => {
    const next = deviceTrustService.updateSyncState({
      profile_revision: Number(syncState.profile_revision || 1) + 1,
      notifications_revision: Number(syncState.notifications_revision || 1) + 1,
      inbox_revision: Number(syncState.inbox_revision || 1) + 1,
      devices_online: Math.max(1, trustedDevices.length)
    });
    setSyncState(next);
    setSuccess("تم بث حالة المزامنة لكل الأجهزة المفتوحة.");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { maxWidth: 1080, margin: "0 auto", padding: 20 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { marginBottom: 8 }, children: "إعدادات الأمان والتوسّع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", style: { margin: 0 }, children: "تم إضافة طبقات Frontend للأمان، الأجهزة الموثوقة، الروابط الموقعة، المزامنة متعددة الأجهزة، وإشعارات الـ Push الاحترافية." })
      ] }),
      message ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-banner", children: message }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { style: { display: "grid", gap: 10, alignSelf: "start" }, children: TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: activeTab === tab.key ? "primary" : "secondary", onClick: () => setActiveTab(tab.key), fullWidth: true, children: tab.label }, tab.key)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { style: { display: "grid", gap: 16 }, children: [
          activeTab === "security" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "Anti-Spam / Bot Detection / Shadow Ban" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Rate limit" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                    antiSpam.remainingRequests,
                    " متبقي"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Bot score" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                    antiSpam.bot.score,
                    "/100"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Verdict" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: antiSpam.bot.verdict })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Shadow ban" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: antiSpam.shadowBanned ? "مفعّل" : "غير مفعّل" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 16, display: "grid", gap: 12 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RateLimitUI, { remaining: antiSpam.remainingRequests, resetTime: antiSpam.resetInMs }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CooldownUI, { remaining: antiSpam.bot.score >= 35 ? 9e3 : 0, action: "إعادة المحاولة" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "المنظومة دلوقتي بتدعم rate limits على مستوى الإجراء، تقييم سلوك الـ bot من سرعة التفاعل، وإمكانية shadow ban للمراجعة الهادية." })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "Login Alerts" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: alerts.map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: alert.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: alert.description })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "score-pill", children: alert.severity })
              ] }, alert.id)) })
            ] })
          ] }) : null,
          activeTab === "devices" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 6px" }, children: "Trusted Devices" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "إدارة الأجهزة الموثوقة ومدير الجلسات والتنبيهات وقت تسجيل الدخول." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleTrustCurrentDevice, loading: busy === "trust-device", children: "توثيق الجهاز الحالي" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12, marginTop: 16 }, children: trustedDevices.map((device) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: device.label || device.device_label || "Device" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                    "آخر ظهور: ",
                    new Date(device.lastSeenAt || device.last_active_at || Date.now()).toLocaleString("ar-EG")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "score-pill", children: device.current ? "Current" : "Trusted" }),
                  !device.current ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => handleRemoveDevice(device.id || device.device_id), loading: busy === (device.id || device.device_id), children: "إزالة" }) : null
                ] })
              ] }, device.id || device.device_id)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "Session Manager" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: sessions.map((session) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: session.device_label || session.label || "Session" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
                    "آخر نشاط: ",
                    new Date(session.last_active_at || Date.now()).toLocaleString("ar-EG")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "score-pill", children: session.sync_state || "healthy" }),
                  !session.current ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => handleRevokeSession(session.id), loading: busy === session.id, children: "إنهاء" }) : null
                ] })
              ] }, session.id)) })
            ] })
          ] }) : null,
          activeTab === "media" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "Media Protection" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Signed URLs" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: MEDIA_SECURITY.signedUrls ? "On" : "Off" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Expiring links" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: MEDIA_SECURITY.expiringLinks ? `${SIGNED_URL_TTL_SECONDS}s` : "Off" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Encrypted uploads" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: MEDIA_SECURITY.encryptedUploads ? "Enabled" : "Disabled" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Provider" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: currentMediaProviderLabel() })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "CDN Acceleration" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { marginBottom: 12 }, children: "الصور والفيديو والملفات بيتم تحضيرهم للتسريع من خلال CDN عالمي وسياسات edge caching." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: [imageDelivery, videoDelivery, fileDelivery].map((profile) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "list-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: profile.strategy }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: profile.preferredCdn })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "score-pill", children: [
                  "TTL ",
                  profile.ttl
                ] })
              ] }, profile.strategy)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { marginTop: 12 }, children: [
                "المناطق المدعومة: ",
                cdnConfig.regions.join(" • ")
              ] })
            ] })
          ] }) : null,
          activeTab === "notifications" ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 6px" }, children: "Push Notifications احترافية" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "Android + PWA + foreground/background + service worker registration." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleEnablePush, loading: busy === "push", children: "تفعيل الـ Push" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", style: { marginTop: 16 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Permission" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.permission })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Android" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.androidReady ? "جاهز" : "غير متاح" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "PWA" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.pwaReady ? "Installed" : "Browser" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Background" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: pushState.supportsBackground ? "Enabled" : "No" })
              ] })
            ] })
          ] }) }) : null,
          activeTab === "sync" ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "0 0 6px" }, children: "Multi Device Sync" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "مزامنة الحالة بين الأجهزة باستخدام BroadcastChannel مع fallback للتخزين المحلي." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSyncNow, children: "Sync state now" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", style: { marginTop: 16 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Devices online" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.devices_online || trustedDevices.length || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Profile rev" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.profile_revision || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Notifications rev" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.notifications_revision || 1 })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Inbox rev" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: syncState.inbox_revision || 1 })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { marginTop: 12 }, children: [
              "آخر مزامنة: ",
              new Date(syncState.last_sync_at || Date.now()).toLocaleString("ar-EG")
            ] })
          ] }) }) : null
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .settings-banner {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.24);
          margin-bottom: 18px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .metric-card {
          padding: 16px;
          border-radius: 16px;
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.12);
          display: grid;
          gap: 6px;
        }
        .metric-card span { color: rgba(226,232,240,0.72); font-size: 13px; }
        .metric-card strong { font-size: 18px; }
        .list-row {
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.38);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .score-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 78px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #93c5fd;
          border: 1px solid rgba(147,197,253,0.26);
          font-size: 12px;
        }
        @media (max-width: 920px) {
          .settings-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          main, aside { width: 100%; }
          div[style*='grid-template-columns: 240px 1fr'] { grid-template-columns: 1fr !important; }
        }
      ` })
  ] });
}
export {
  Settings as default
};
