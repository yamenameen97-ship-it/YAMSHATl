const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/admin-Cbfe96Hs.js","chunks/vendor-BEGBKm-Y.js","chunks/rolldown-runtime-DuU1KJyR.js","chunks/vendor-motion-DouOFhvK.js","chunks/vendor-react-D9YCW6KT.js","chunks/useDebouncedValue-Bbubz4pq.js","chunks/auth-C2WvK0K6.js","chunks/groups-Dnulg_cN.js","chunks/posts-BHSunouz.js","chunks/stories-CYBJZ-UE.js","chunks/EmptyState-Co07m3O6.js","chunks/ErrorState-Xz3LP_u1.js","chunks/Card-TPneInOP.js","chunks/Input-BNYQZD5U.js","chunks/Modal-DHoVpNfV.js","chunks/auth-2tAwxGR9.js","chunks/Dashboard-cIeApP3G.js","chunks/MainLayout-DmJHsj7d.js","chunks/vendor-state-kpIG4jk7.js","chunks/Feed-5Cn11sP-.js","chunks/vendor-network-H7MgKIFL.js","chunks/Stories-Miqmwe47.js","chunks/Reels-Cmw8OlTs.js","chunks/users-C1eqSvVi.js","chunks/Groups-oRBCvyw-.js","chunks/Live-DicPywTX.js","chunks/chat-QszTyEwN.js","chunks/Users-2XOtGngm.js","chunks/Profile-DXdRphAk.js","chunks/notifications-L23V4jVY.js","chunks/Search-CRemi6_Q.js"])))=>i.map(i=>d[i]);
import { a as __toESM } from "./chunks/rolldown-runtime-DuU1KJyR.js";
import { G as Route, N as QueryClient, T as imageCompression, U as Navigate, X as useLocation, ot as require_react, q as Routes, w as require_spark_md5 } from "./chunks/vendor-BEGBKm-Y.js";
import { i as require_client, t as HashRouter } from "./chunks/vendor-react-D9YCW6KT.js";
import { n as require_jsx_runtime } from "./chunks/vendor-motion-DouOFhvK.js";
import { a as QueryClientProvider, t as axios } from "./chunks/vendor-network-H7MgKIFL.js";
import { t as create } from "./chunks/vendor-state-kpIG4jk7.js";
import { t as lookup } from "./chunks/vendor-socket-DtqqNw19.js";
//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region src/components/feedback/PageLoader.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_client = /* @__PURE__ */ __toESM(require_client(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PageLoader({ label = "جارٍ التحميل..." }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-loader",
		role: "status",
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "page-loader-spinner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-loader-copy",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "بنجهز لك الواجهة بشكل أسرع وأكثر سلاسة." })]
		})]
	});
}
//#endregion
//#region src/utils/access.js
var DEFAULT_PRIMARY_ADMIN_EMAIL = "yamenameen97@gmail.com";
var PLACEHOLDER_ADMIN_EMAILS = new Set([
	"",
	"admin@example.com",
	"your-admin@example.com"
]);
var normalizeEmail = (value) => String(value || "").trim().toLowerCase();
var configuredPrimaryAdminEmail = normalizeEmail("");
var PRIMARY_ADMIN_EMAIL = PLACEHOLDER_ADMIN_EMAILS.has(configuredPrimaryAdminEmail) ? DEFAULT_PRIMARY_ADMIN_EMAIL : configuredPrimaryAdminEmail;
var isPrimaryAdminEmail = (value) => normalizeEmail(value) === PRIMARY_ADMIN_EMAIL;
var isPrimaryAdminSession = (session) => {
	if (!session || typeof session !== "object") return false;
	const email = session.email || session?.profile?.email || "";
	const role = String(session.role || session?.profile?.role || "user").trim().toLowerCase();
	return isPrimaryAdminEmail(email) && role === "admin";
};
var getDefaultPostLoginPath = (session) => isPrimaryAdminSession(session) ? "/admin/dashboard" : "/";
//#endregion
//#region src/utils/secureStorage.js
function getSafeStorage(type = "localStorage") {
	if (typeof window === "undefined") return null;
	try {
		return window[type] || null;
	} catch {
		return null;
	}
}
function secureGet(key) {
	const normalizedKey = String(key);
	const sessionStorageRef = getSafeStorage("sessionStorage");
	const localStorageRef = getSafeStorage("localStorage");
	return sessionStorageRef?.getItem(normalizedKey) || localStorageRef?.getItem(normalizedKey) || "";
}
function secureSet(key, value, options = {}) {
	const normalizedKey = String(key);
	const persist = Boolean(options?.persist);
	const sessionStorageRef = getSafeStorage("sessionStorage");
	const localStorageRef = getSafeStorage("localStorage");
	const rawValue = String(value ?? "");
	try {
		sessionStorageRef?.removeItem(normalizedKey);
		localStorageRef?.removeItem(normalizedKey);
		if (persist) localStorageRef?.setItem(normalizedKey, rawValue);
		else sessionStorageRef?.setItem(normalizedKey, rawValue);
	} catch {}
}
function secureRemove(key) {
	const normalizedKey = String(key);
	try {
		getSafeStorage("sessionStorage")?.removeItem(normalizedKey);
		getSafeStorage("localStorage")?.removeItem(normalizedKey);
	} catch {}
}
//#endregion
//#region src/utils/csrf.js
var CSRF_COOKIE_NAME = "yamshat_csrf_token";
var CSRF_STORAGE_KEY$1 = "yamshat_csrf_token";
function canUseDocument() {
	return typeof document !== "undefined";
}
function canUseStorage() {
	return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function readCookie(name) {
	if (!canUseDocument()) return "";
	const prefix = `${name}=`;
	const raw = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
	return raw ? decodeURIComponent(raw.slice(prefix.length)) : "";
}
function readStoredToken() {
	if (!canUseStorage()) return "";
	try {
		return String(window.localStorage.getItem(CSRF_STORAGE_KEY$1) || window.sessionStorage.getItem(CSRF_STORAGE_KEY$1) || "").trim();
	} catch {
		return "";
	}
}
function getCsrfToken() {
	return readStoredToken() || readCookie(CSRF_COOKIE_NAME);
}
function setCsrfToken(value = "") {
	if (!canUseStorage()) return;
	const token = String(value || "").trim();
	try {
		if (token) {
			window.localStorage.setItem(CSRF_STORAGE_KEY$1, token);
			window.sessionStorage.setItem(CSRF_STORAGE_KEY$1, token);
			return;
		}
		window.localStorage.removeItem(CSRF_STORAGE_KEY$1);
		window.sessionStorage.removeItem(CSRF_STORAGE_KEY$1);
	} catch {}
}
function clearCsrfToken() {
	setCsrfToken("");
}
//#endregion
//#region src/api/config.js
var trim$1 = (value) => String(value || "").trim().replace(/\/+$/, "");
var toApiBase = (value) => {
	const cleaned = trim$1(value);
	if (!cleaned) return "";
	return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
};
var apiToOrigin = (value) => trim$1(toApiBase(value).replace(/\/api$/, ""));
var currentOrigin = trim$1(window.location.origin);
var safeOrigin = (value) => {
	try {
		return trim$1(new URL(String(value || "").trim()).origin);
	} catch {
		return "";
	}
};
var inferBackendOrigin = () => {
	try {
		const links = Array.from(document.querySelectorAll("link[rel=\"preconnect\"][href], link[rel=\"dns-prefetch\"][href]"));
		for (const link of links) {
			const origin = safeOrigin(link.getAttribute("href"));
			if (origin && origin !== currentOrigin) return origin;
		}
	} catch {}
	const renderSibling = trim$1(window.location.hostname).toLowerCase().match(/^(.*)-\d+\.onrender\.com$/i);
	if (renderSibling?.[1]) return `${window.location.protocol}//${renderSibling[1]}.onrender.com`;
	return currentOrigin;
};
var readStored = (key) => {
	try {
		return localStorage.getItem(key) || "";
	} catch {
		return "";
	}
};
var params = new URLSearchParams(window.location.search);
var queryApi = toApiBase(params.get("api"));
var queryBackend = trim$1(params.get("backend"));
var storedApi = toApiBase(readStored("apiBase"));
var storedBackend = trim$1(readStored("backendOrigin"));
var runtimeApi = toApiBase(window.APP_API_BASE || "");
var runtimeBackendOrigin = trim$1(window.YAMSHAT_BACKEND_ORIGIN || window.APP_BACKEND_ORIGIN);
var envApi = toApiBase("");
var envBackendOrigin = trim$1(apiToOrigin(envApi));
var envSocketUrl = trim$1(envBackendOrigin);
var envCdnBase = trim$1("");
var inferredBackendOrigin = inferBackendOrigin();
var inferredApi = inferredBackendOrigin ? `${inferredBackendOrigin}/api` : "";
var SESSION_STORAGE_KEY = "yamshat_user_session";
var CSRF_STORAGE_KEY = "yamshat_csrf_token";
var isRenderHost = (value) => /\.onrender\.com$/i.test(trim$1(value));
var originLooksCurrent = (value) => {
	const candidate = trim$1(value);
	if (!candidate || !inferredBackendOrigin) return false;
	return candidate === inferredBackendOrigin || candidate === currentOrigin;
};
var apiLooksCurrent = (value) => {
	const candidate = toApiBase(value);
	if (!candidate) return false;
	return candidate === toApiBase(inferredApi) || candidate === toApiBase(`${currentOrigin}/api`);
};
var safeStoredBackend = originLooksCurrent(storedBackend) || !isRenderHost(storedBackend) ? storedBackend : "";
var safeStoredApi = apiLooksCurrent(storedApi) || !isRenderHost(apiToOrigin(storedApi)) ? storedApi : "";
var runtimeBackendIsFrontendOrigin = Boolean(runtimeBackendOrigin && runtimeBackendOrigin === currentOrigin && inferredBackendOrigin !== currentOrigin);
var runtimeApiIsFrontendOrigin = Boolean(runtimeApi && runtimeApi === toApiBase(`${currentOrigin}/api`) && inferredBackendOrigin !== currentOrigin);
var safeRuntimeBackendOrigin = runtimeBackendIsFrontendOrigin ? "" : runtimeBackendOrigin;
var safeRuntimeApi = runtimeApiIsFrontendOrigin ? "" : runtimeApi;
var BACKEND_ORIGIN = trim$1(queryBackend || apiToOrigin(queryApi) || safeRuntimeBackendOrigin || envBackendOrigin || safeStoredBackend || apiToOrigin(safeRuntimeApi || safeStoredApi) || inferredBackendOrigin || currentOrigin);
var API_BASE = toApiBase(queryApi || safeRuntimeApi || envApi || safeStoredApi || (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${currentOrigin}/api`));
var CDN_BASE = trim$1(window.YAMSHAT_CDN_BASE || window.APP_CDN_BASE || envCdnBase || "");
var SOCKET_URL = trim$1(queryBackend || apiToOrigin(queryApi) || safeRuntimeBackendOrigin || envSocketUrl || window.YAMSHAT_SOCKET_URL || safeStoredBackend || BACKEND_ORIGIN || currentOrigin);
try {
	const previousBackendOrigin = trim$1(localStorage.getItem("backendOrigin"));
	if (Boolean(previousBackendOrigin && previousBackendOrigin !== BACKEND_ORIGIN)) {
		localStorage.removeItem(CSRF_STORAGE_KEY);
		sessionStorage.removeItem(SESSION_STORAGE_KEY);
	}
	localStorage.setItem("backendOrigin", BACKEND_ORIGIN);
	localStorage.setItem("apiBase", API_BASE);
} catch {}
//#endregion
//#region src/utils/logger.js
var LEVELS = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40
};
var JWT_PATTERN = /\b[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g;
var SENSITIVE_KEYS = new Set([
	"authorization",
	"token",
	"access_token",
	"refresh_token",
	"csrf_token",
	"password",
	"secret",
	"cookie",
	"set-cookie"
]);
function currentLevel() {
	return LEVELS[String("info").toLowerCase()] || LEVELS.info;
}
function canLog(level) {
	return LEVELS[level] >= currentLevel();
}
function redactString(value) {
	return String(value || "").replace(JWT_PATTERN, "[REDACTED_JWT]");
}
function redactMeta(value) {
	if (Array.isArray(value)) return value.map((item) => redactMeta(item));
	if (!value || typeof value !== "object") return typeof value === "string" ? redactString(value) : value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
		if (SENSITIVE_KEYS.has(String(key).toLowerCase())) return [key, "[REDACTED]"];
		return [key, redactMeta(entry)];
	}));
}
function emit(level, message, meta = {}) {
	if (!canLog(level)) return;
	const safeMeta = redactMeta(meta);
	const safeMessage = redactString(message);
	const payload = {
		level,
		message: safeMessage,
		meta: safeMeta,
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	};
	const method = level === "debug" ? "debug" : level === "info" ? "info" : level === "warn" ? "warn" : "error";
	if (typeof console !== "undefined" && typeof console[method] === "function") console[method](`[yamshat:${level}] ${safeMessage}`, safeMeta);
	if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("yamshat:log", { detail: payload }));
}
var logger = {
	debug: (message, meta) => emit("debug", message, meta),
	info: (message, meta) => emit("info", message, meta),
	warn: (message, meta) => emit("warn", message, meta),
	error: (message, meta) => emit("error", message, meta)
};
//#endregion
//#region src/utils/retry.js
function getBackoffDelayMs(attempt = 0, options = {}) {
	const { baseDelayMs = 900, maxDelayMs = 3e4, jitterRatio = .35 } = options;
	const safeAttempt = Math.max(0, Number(attempt) || 0);
	const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** safeAttempt);
	const jitterWindow = Math.max(0, Math.round(exponential * jitterRatio));
	const jitter = jitterWindow ? Math.round((Math.random() * 2 - 1) * jitterWindow) : 0;
	return Math.max(baseDelayMs, Math.min(maxDelayMs, exponential + jitter));
}
function sleep(ms) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
//#endregion
//#region src/auth/sessionManager.js
var plainHttp = axios.create({
	baseURL: API_BASE,
	withCredentials: true,
	headers: {
		"X-Requested-With": "XMLHttpRequest",
		"X-Yamshat-Client": "web"
	}
});
var listeners = /* @__PURE__ */ new Set();
var state = {
	refreshPromise: null,
	consecutiveFailures: 0,
	lastSuccessAt: 0,
	cooldownUntil: 0,
	circuitOpenUntil: 0,
	lastFailureReason: ""
};
function notify() {
	const snapshot = getRefreshState();
	listeners.forEach((listener) => {
		try {
			listener(snapshot);
		} catch {}
	});
}
function createRefreshError(message, code = "REFRESH_BLOCKED", status = 0) {
	const error = new Error(message);
	error.code = code;
	error.status = status;
	return error;
}
function currentTime() {
	return Date.now();
}
function isOffline() {
	return typeof navigator !== "undefined" && navigator.onLine === false;
}
function resetFailureState() {
	state.consecutiveFailures = 0;
	state.cooldownUntil = 0;
	state.circuitOpenUntil = 0;
	state.lastFailureReason = "";
}
function registerFailure(error) {
	state.consecutiveFailures += 1;
	state.lastFailureReason = error?.response?.data?.detail || error?.message || "refresh_failed";
	const cooldownDelay = getBackoffDelayMs(state.consecutiveFailures - 1, {
		baseDelayMs: 1200,
		maxDelayMs: 3e4,
		jitterRatio: .35
	});
	state.cooldownUntil = currentTime() + cooldownDelay;
	if (state.consecutiveFailures >= 3) state.circuitOpenUntil = currentTime() + Math.max(15e3, cooldownDelay);
}
function csrfHeaders() {
	const csrfToken = getCsrfToken();
	return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
}
/**
* Centralized Error Normalization
*/
function normalizeAuthError(error) {
	if (!error.response) return {
		message: "تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.",
		type: "NETWORK_ERROR",
		status: 0
	};
	const status = error.response.status;
	const detail = error.response.data?.detail;
	let message = "حدث خطأ غير متوقع في المصادقة.";
	if (typeof detail === "string") message = detail;
	else if (detail?.message) message = detail.message;
	return {
		message,
		status,
		type: status >= 500 ? "SERVER_ERROR" : "CLIENT_ERROR",
		original: error
	};
}
function getRefreshState() {
	return {
		inFlight: Boolean(state.refreshPromise),
		consecutiveFailures: state.consecutiveFailures,
		cooldownUntil: state.cooldownUntil,
		circuitOpenUntil: state.circuitOpenUntil,
		lastSuccessAt: state.lastSuccessAt,
		lastFailureReason: state.lastFailureReason
	};
}
function subscribeToRefreshState(listener) {
	if (typeof listener !== "function") return () => {};
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function shouldRefreshSoon(windowMs = 6e4) {
	const ttl = getSessionTtlMs();
	return ttl !== null && ttl <= windowMs;
}
/**
* Multi-tab Session Sync
*/
function initMultiTabSync() {
	if (typeof window === "undefined") return;
	window.addEventListener("storage", (event) => {
		if (event.key === "yamshat_auth_user" || event.key === "yamshat_session_active") {
			logger.info("Auth storage changed in another tab, syncing state...");
			if (!event.newValue) window.location.reload();
		}
	});
}
/**
* Enhanced Refresh with Retry Logic
*/
async function refreshSession(options = {}) {
	const { reason = "manual", force = false, retryCount = 0 } = options;
	if (state.refreshPromise) return state.refreshPromise;
	if (isOffline()) throw createRefreshError("لا يمكن التحديث أثناء عدم الاتصال بالإنترنت", "OFFLINE");
	const now = currentTime();
	if (!force && state.circuitOpenUntil > now) throw createRefreshError("نظام الحماية مفعل حالياً، حاول مجدداً لاحقاً", "CIRCUIT_OPEN");
	if (!force && state.cooldownUntil > now) throw createRefreshError("يرجى الانتظار قليلاً قبل المحاولة مجدداً", "COOLDOWN_ACTIVE");
	logger.info("refresh session requested", {
		reason,
		retryCount
	});
	state.refreshPromise = (async () => {
		try {
			const response = await plainHttp.post("/auth/refresh", {}, { headers: csrfHeaders() });
			mergeStoredUser(response.data);
			resetFailureState();
			state.lastSuccessAt = currentTime();
			return response;
		} catch (error) {
			const normalized = normalizeAuthError(error);
			if (retryCount < 2 && (normalized.type === "NETWORK_ERROR" || normalized.status >= 500)) {
				await sleep(getBackoffDelayMs(retryCount));
				state.refreshPromise = null;
				return refreshSession({
					...options,
					retryCount: retryCount + 1,
					force: true
				});
			}
			registerFailure(error);
			const status = Number(error?.response?.status || 0);
			if ([
				400,
				401,
				403,
				404
			].includes(status)) clearStoredUser();
			throw normalized;
		} finally {
			state.refreshPromise = null;
			notify();
		}
	})();
	notify();
	return state.refreshPromise;
}
var sessionManager = {
	refreshSession,
	shouldRefreshSoon,
	subscribeToRefreshState,
	getRefreshState,
	normalizeAuthError,
	initMultiTabSync
};
//#endregion
//#region src/stores/chatStore.js
function toIsoDate(value) {
	if (!value) return null;
	try {
		return new Date(value).toISOString();
	} catch {
		return null;
	}
}
function normalizeThread(rawThread = {}) {
	const timestamp = toIsoDate(rawThread.last_message_at || rawThread.created_at) || (/* @__PURE__ */ new Date()).toISOString();
	return {
		username: rawThread.username || rawThread.name || rawThread.peer || "",
		unread_count: Number(rawThread.unread_count || 0),
		last_message: rawThread.last_message || rawThread.message || "ابدأ المحادثة الآن",
		last_message_at: timestamp,
		presence: rawThread.presence || { is_online: false }
	};
}
function upsertThread(state, peer, patch = {}) {
	const current = state.threadsByUsername[peer] || normalizeThread({ username: peer });
	return {
		...state.threadsByUsername,
		[peer]: {
			...current,
			...patch,
			username: peer
		}
	};
}
var useChatStore = create((set, get) => ({
	threadsByUsername: {},
	conversationsByPeer: {},
	isSyncing: false,
	initialized: false,
	loadingThreads: false,
	activePeer: null,
	setLoadingThreads: (loadingThreads = false) => set({ loadingThreads: Boolean(loadingThreads) }),
	setActivePeer: (activePeer = null) => set({ activePeer }),
	hydrateThreads: (threads = [], options = {}) => set((state) => {
		const nextThreads = options?.replace !== false ? {} : { ...state.threadsByUsername };
		(Array.isArray(threads) ? threads : []).forEach((thread) => {
			const normalized = normalizeThread(thread);
			if (!normalized.username) return;
			nextThreads[normalized.username] = {
				...nextThreads[normalized.username] || {},
				...normalized
			};
		});
		return {
			threadsByUsername: nextThreads,
			initialized: true
		};
	}),
	setThreads: (threads = []) => get().hydrateThreads(threads, { replace: true }),
	applyIncomingMessage: (message, currentUser, options = {}) => set((state) => {
		const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
		if (!peer) return state;
		const prevConversation = state.conversationsByPeer[peer] || {
			messages: [],
			lastUpdate: null
		};
		const nextMessages = [...Array.isArray(prevConversation.messages) ? prevConversation.messages : [], message].slice(-100);
		const shouldIncrementUnread = message?.sender !== currentUser && !options?.skipUnreadIncrement;
		const previousThread = state.threadsByUsername[peer] || normalizeThread({ username: peer });
		return {
			conversationsByPeer: {
				...state.conversationsByPeer,
				[peer]: {
					...prevConversation,
					messages: nextMessages,
					lastUpdate: Date.now()
				}
			},
			threadsByUsername: {
				...state.threadsByUsername,
				[peer]: {
					...previousThread,
					username: peer,
					last_message: message?.body || message?.content || previousThread.last_message,
					last_message_at: toIsoDate(message?.created_at) || (/* @__PURE__ */ new Date()).toISOString(),
					unread_count: shouldIncrementUnread ? Number(previousThread.unread_count || 0) + 1 : Number(previousThread.unread_count || 0)
				}
			},
			initialized: true
		};
	}),
	updateMessageStatus: (peer, messageIds = [], status = "sent") => set((state) => {
		if (!peer || !state.conversationsByPeer[peer]) return state;
		const ids = new Set((Array.isArray(messageIds) ? messageIds : []).map(String));
		if (!ids.size) return state;
		return { conversationsByPeer: {
			...state.conversationsByPeer,
			[peer]: {
				...state.conversationsByPeer[peer],
				messages: (state.conversationsByPeer[peer].messages || []).map((message) => {
					const messageId = message?.id ?? message?.message_id;
					if (!ids.has(String(messageId))) return message;
					return {
						...message,
						status
					};
				})
			}
		} };
	}),
	setPresence: (peer, presence = {}) => set((state) => ({ threadsByUsername: upsertThread(state, peer, { presence: {
		...state.threadsByUsername[peer]?.presence || {},
		...presence || {}
	} }) })),
	markThreadRead: (peer) => set((state) => ({ threadsByUsername: upsertThread(state, peer, { unread_count: 0 }) })),
	invalidateCache: () => set({
		threadsByUsername: {},
		conversationsByPeer: {},
		initialized: false,
		activePeer: null
	}),
	syncOfflineMessages: async () => {
		set({ isSyncing: true });
		set({ isSyncing: false });
	}
}));
var selectUnreadTotal = (state) => Object.values(state?.threadsByUsername || {}).reduce((total, thread) => total + Number(thread?.unread_count || 0), 0);
//#endregion
//#region src/store/appStore.js
var THEME_KEY = "yamshat-theme";
var LANGUAGE_KEY = "yamshat-language";
var TRANSLATION_KEY = "yamshat-chat-translation";
var QUEUE_KEY$1 = "yamshat-offline-queue";
var getInitialTheme = () => {
	if (typeof window === "undefined") return "dark";
	return window.localStorage.getItem(THEME_KEY) || "dark";
};
var getInitialLanguage = () => {
	if (typeof window === "undefined") return "ar";
	return window.localStorage.getItem(LANGUAGE_KEY) || "ar";
};
var getInitialTranslationSetting = () => {
	if (typeof window === "undefined") return true;
	const raw = window.localStorage.getItem(TRANSLATION_KEY);
	if (raw === null) return true;
	return raw === "1";
};
var loadQueuedActions = () => {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(QUEUE_KEY$1);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};
var persistQueuedActions = (actions) => {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(QUEUE_KEY$1, JSON.stringify(actions));
	} catch {}
};
var useAppStore = create((set, get) => ({
	session: null,
	authHydrated: false,
	authLoading: false,
	isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
	isReconnecting: false,
	lastOfflineAt: null,
	activeRequests: 0,
	theme: getInitialTheme(),
	language: getInitialLanguage(),
	chatTranslationEnabled: getInitialTranslationSetting(),
	installPrompt: null,
	uploadProgress: {},
	queuedActions: loadQueuedActions(),
	setSession: (session) => set({
		session,
		authHydrated: true
	}),
	clearSession: () => set({
		session: null,
		authHydrated: true
	}),
	setAuthHydrated: (authHydrated = true) => set({ authHydrated: Boolean(authHydrated) }),
	setAuthLoading: (authLoading = false) => set({ authLoading: Boolean(authLoading) }),
	setOnlineStatus: (isOnline) => {
		const wasOffline = !get().isOnline;
		set({
			isOnline,
			lastOfflineAt: isOnline ? null : (/* @__PURE__ */ new Date()).toISOString()
		});
		if (wasOffline && isOnline) get().recoverSession();
	},
	recoverSession: async () => {
		if (get().isReconnecting) return;
		set({ isReconnecting: true });
		try {
			console.log("[AppStore] Connection restored, attempting session recovery...");
			await sessionManager.refreshSession({ reason: "reconnect" });
		} catch (err) {
			console.warn("[AppStore] Session recovery failed after reconnect.");
		} finally {
			set({ isReconnecting: false });
		}
	},
	syncFromStorage: (userData) => {
		if (JSON.stringify(userData) !== JSON.stringify(get().session)) set({
			session: userData,
			authHydrated: true
		});
	},
	startRequest: () => set((state) => ({ activeRequests: state.activeRequests + 1 })),
	finishRequest: () => set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),
	setTheme: (theme) => {
		if (typeof window !== "undefined") window.localStorage.setItem(THEME_KEY, theme);
		set({ theme });
	},
	toggleTheme: () => {
		const nextTheme = get().theme === "dark" ? "light" : "dark";
		if (typeof window !== "undefined") window.localStorage.setItem(THEME_KEY, nextTheme);
		set({ theme: nextTheme });
	},
	setLanguage: (language) => {
		const nextLanguage = language === "en" ? "en" : "ar";
		if (typeof window !== "undefined") {
			window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
			document.documentElement.setAttribute("lang", nextLanguage);
			document.documentElement.setAttribute("dir", nextLanguage === "ar" ? "rtl" : "ltr");
		}
		set({ language: nextLanguage });
	},
	setChatTranslationEnabled: (enabled) => {
		if (typeof window !== "undefined") window.localStorage.setItem(TRANSLATION_KEY, enabled ? "1" : "0");
		set({ chatTranslationEnabled: Boolean(enabled) });
	},
	setInstallPrompt: (installPrompt) => set({ installPrompt }),
	clearInstallPrompt: () => set({ installPrompt: null }),
	setUploadProgress: (key, value) => set((state) => ({ uploadProgress: {
		...state.uploadProgress,
		[key]: value
	} })),
	clearUploadProgress: (key) => set((state) => {
		const next = { ...state.uploadProgress };
		delete next[key];
		return { uploadProgress: next };
	}),
	queueAction: (action) => set((state) => {
		const next = [...state.queuedActions, {
			id: action?.id || `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			createdAt: action?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
			attempts: Number(action?.attempts || 0),
			lastAttemptAt: action?.lastAttemptAt || null,
			nextRetryAt: action?.nextRetryAt || null,
			...action
		}];
		persistQueuedActions(next);
		return { queuedActions: next };
	}),
	dequeueAction: (actionId) => set((state) => {
		const next = state.queuedActions.filter((item) => item.id !== actionId);
		persistQueuedActions(next);
		return { queuedActions: next };
	}),
	updateQueuedAction: (actionId, patch) => set((state) => {
		const next = state.queuedActions.map((item) => item.id === actionId ? {
			...item,
			...patch || {}
		} : item);
		persistQueuedActions(next);
		return { queuedActions: next };
	}),
	replaceQueuedActions: (actions) => {
		const safe = Array.isArray(actions) ? actions : [];
		persistQueuedActions(safe);
		set({ queuedActions: safe });
	},
	flushQueue: () => {
		persistQueuedActions([]);
		set({ queuedActions: [] });
	}
}));
if (typeof window !== "undefined") {
	window.addEventListener("online", () => useAppStore.getState().setOnlineStatus(true));
	window.addEventListener("offline", () => useAppStore.getState().setOnlineStatus(false));
	window.addEventListener("storage", (event) => {
		if (event.key === "yamshat_auth_user") try {
			const userData = event.newValue ? JSON.parse(event.newValue) : null;
			useAppStore.getState().syncFromStorage(userData);
		} catch (e) {}
	});
}
//#endregion
//#region src/utils/auth.js
var STORAGE_KEY = "yamshat_user_session";
var EXPIRY_LEEWAY_SECONDS = 30;
function normalizeUserShape(user) {
	if (!user || typeof user !== "object") return null;
	const token = user.token || user.access_token || user?.profile?.token || "";
	const username = user.username || user.user || user?.profile?.username || "";
	const role = user.role || user?.profile?.role || "user";
	const permissions = Array.isArray(user.permissions) ? user.permissions : Array.isArray(user?.profile?.permissions) ? user.profile.permissions : [];
	const csrf_token = user.csrf_token || user?.profile?.csrf_token || "";
	const remember_me = Boolean(user.remember_me ?? user?.profile?.remember_me ?? true);
	const session_id = user.session_id || user?.profile?.session_id || "";
	return {
		...user,
		token,
		access_token: token || user.access_token || "",
		refresh_token: "",
		username,
		user: username,
		role,
		permissions,
		csrf_token,
		remember_me,
		session_id,
		email_verified: Boolean(user.email_verified ?? user?.profile?.email_verified),
		profile: user.profile || null
	};
}
function decodeJwtPayload$1(token) {
	if (!token || typeof token !== "string" || token.split(".").length < 2) return null;
	try {
		const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
		const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
		const decoded = typeof window !== "undefined" && typeof window.atob === "function" ? window.atob(normalized) : Buffer.from(normalized, "base64").toString("utf-8");
		return JSON.parse(decoded);
	} catch {
		return null;
	}
}
function syncStore(user) {
	const state = useAppStore.getState();
	if (user) state.setSession?.(user);
	else state.clearSession?.();
}
function readStoredSession() {
	try {
		const raw = secureGet(STORAGE_KEY) || secureGet("yamshatAuth") || secureGet("user");
		return normalizeUserShape(raw ? JSON.parse(raw) : null);
	} catch {
		return null;
	}
}
function getTokenExpiryMs(token) {
	const payload = decodeJwtPayload$1(token);
	if (!payload?.exp) return null;
	const exp = Number(payload.exp);
	return Number.isFinite(exp) ? exp * 1e3 : null;
}
function isTokenExpired(token, leewaySeconds = EXPIRY_LEEWAY_SECONDS) {
	const expiryMs = getTokenExpiryMs(token);
	if (!expiryMs) return false;
	return expiryMs <= Date.now() + leewaySeconds * 1e3;
}
function getStoredUser() {
	const parsed = readStoredSession();
	syncStore(parsed);
	return parsed;
}
function hasStoredSession() {
	const user = readStoredSession();
	return Boolean(user?.id || user?.username || user?.user || user?.email);
}
function setStoredUser(user) {
	const normalized = normalizeUserShape(user);
	if (!normalized) {
		secureRemove(STORAGE_KEY);
		clearCsrfToken();
		syncStore(null);
		return;
	}
	const raw = JSON.stringify(normalized);
	secureSet(STORAGE_KEY, raw, { persist: Boolean(normalized.remember_me) });
	secureSet("yamshatAuth", raw, { persist: Boolean(normalized.remember_me) });
	secureSet("user", raw, { persist: Boolean(normalized.remember_me) });
	setCsrfToken(normalized.csrf_token || "");
	syncStore(normalized);
}
function mergeStoredUser(nextValues) {
	const current = readStoredSession() || {};
	setStoredUser({
		...current,
		...nextValues,
		remember_me: Boolean(nextValues?.remember_me ?? current?.remember_me ?? true),
		refresh_token: "",
		profile: {
			...current.profile || {},
			...nextValues?.profile || {}
		}
	});
}
function clearStoredUser() {
	secureRemove(STORAGE_KEY);
	secureRemove("yamshatAuth");
	secureRemove("user");
	clearCsrfToken();
	syncStore(null);
}
function getAuthToken() {
	const user = readStoredSession();
	const token = user?.token || user?.access_token || "";
	if (!token || isTokenExpired(token)) return "";
	return token;
}
function getCurrentUsername() {
	const user = readStoredSession();
	return user?.user || user?.username || "";
}
function getSessionTtlMs() {
	const user = readStoredSession();
	const expiryMs = getTokenExpiryMs(user?.token || user?.access_token || "");
	if (!expiryMs) return null;
	return Math.max(expiryMs - Date.now(), 0);
}
function shouldRefreshSessionSoon(windowMs = 6e4) {
	const ttl = getSessionTtlMs();
	return ttl !== null && ttl <= windowMs;
}
function hasPermission(permission) {
	const user = readStoredSession();
	if (!user) return false;
	if (isPrimaryAdminSession(user)) return true;
	return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
//#endregion
//#region src/components/ProtectedRoute.jsx
function ProtectedRoute({ children, requiredPermission = "" }) {
	const location = useLocation();
	const user = useAppStore((state) => state.session);
	const authHydrated = useAppStore((state) => state.authHydrated);
	const authLoading = useAppStore((state) => state.authLoading);
	if (!authHydrated || authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageLoader, { label: "جارٍ التحقق من الجلسة..." });
	if (!user?.username && !user?.user && !user?.email) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: location.pathname.startsWith("/admin") ? "/admin/login" : "/login",
		state: { from: location },
		replace: true
	});
	if (location.pathname.startsWith("/admin") && !isPrimaryAdminSession(user)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/admin/login",
		state: { from: location },
		replace: true
	});
	if (requiredPermission && !hasPermission(requiredPermission)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/",
		replace: true
	});
	return children;
}
//#endregion
//#region src/components/admin/ToastProvider.jsx
var ToastContext = (0, import_react.createContext)({ pushToast: () => {} });
function normalizeToast(toast = {}) {
	const title = toast.title || toast.message || toast.label || (toast.type === "error" ? "حدث خطأ" : toast.type === "success" ? "تم بنجاح" : "تنبيه");
	const description = toast.description || (toast.title && toast.message && toast.title !== toast.message ? toast.message : "") || "";
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		type: toast.type || "info",
		title,
		description,
		duration: Number(toast.duration || 3200)
	};
}
function ToastProvider({ children }) {
	const [toasts, setToasts] = (0, import_react.useState)([]);
	const pushToast = (0, import_react.useCallback)((toast) => {
		const nextToast = normalizeToast(toast);
		setToasts((prev) => [...prev, nextToast]);
		window.setTimeout(() => {
			setToasts((prev) => prev.filter((item) => item.id !== nextToast.id));
		}, nextToast.duration);
	}, []);
	(0, import_react.useEffect)(() => {
		const handleToast = (event) => pushToast(event.detail || {});
		window.addEventListener("yamshat:toast", handleToast);
		return () => window.removeEventListener("yamshat:toast", handleToast);
	}, [pushToast]);
	const value = (0, import_react.useMemo)(() => ({ pushToast }), [pushToast]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToastContext.Provider, {
		value,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "toast-stack",
			"aria-live": "polite",
			"aria-atomic": "true",
			children: toasts.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `toast toast-${toast.type}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: toast.title }), toast.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: toast.description }) : null]
			}, toast.id))
		})]
	});
}
function useToast() {
	return (0, import_react.useContext)(ToastContext);
}
//#endregion
//#region src/components/system/AppStatusBanner.jsx
function formatRemaining(ms) {
	return `${Math.max(Math.ceil(ms / 6e4), 1)} دقيقة`;
}
function AppStatusBanner() {
	const isOnline = useAppStore((state) => state.isOnline);
	const activeRequests = useAppStore((state) => state.activeRequests);
	const ttl = getSessionTtlMs();
	const banner = (0, import_react.useMemo)(() => {
		if (!isOnline) return {
			type: "warning",
			text: "أنت الآن بدون إنترنت. سيتم استئناف التحديثات والاتصال اللحظي تلقائياً عند رجوع الشبكة."
		};
		if (ttl !== null && ttl > 0 && ttl <= 300 * 1e3) return {
			type: "info",
			text: `تنبيه: الجلسة الحالية ستنتهي خلال ${formatRemaining(ttl)} ما لم يتم تجديدها تلقائياً.`
		};
		if (activeRequests > 0) return {
			type: "info",
			text: "جارٍ مزامنة البيانات وتحديث الواجهة..."
		};
		return null;
	}, [
		activeRequests,
		isOnline,
		ttl
	]);
	if (!banner) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `app-status-banner ${banner.type}`,
		children: banner.text
	});
}
//#endregion
//#region src/components/ui/Button.jsx
/**
* Button Component
* Features: Unified variants, Loading states, Haptic feedback, Disabled polish
*/
function wait(ms) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
/**
* Triggers haptic feedback if available
*/
function triggerHapticFeedback(type = "light") {
	if (navigator.vibrate) switch (type) {
		case "light":
			navigator.vibrate(10);
			break;
		case "medium":
			navigator.vibrate(20);
			break;
		case "heavy":
			navigator.vibrate(30);
			break;
		default: navigator.vibrate(10);
	}
}
function Button({ children, type = "button", variant = "primary", size = "medium", className = "", disabled = false, loading = false, preventRepeat = true, cooldownMs = 500, hapticFeedback = true, icon = null, fullWidth = false, onClick, ...props }) {
	const [internalBusy, setInternalBusy] = (0, import_react.useState)(false);
	const mountedRef = (0, import_react.useRef)(true);
	const busy = loading || internalBusy;
	const locked = disabled || busy;
	(0, import_react.useEffect)(() => () => {
		mountedRef.current = false;
	}, []);
	/**
	* Handles button click with haptic feedback
	*/
	const handleClick = async (event) => {
		if (!onClick) return;
		if (locked) {
			event.preventDefault();
			return;
		}
		if (hapticFeedback) triggerHapticFeedback("light");
		if (!preventRepeat) {
			onClick(event);
			return;
		}
		setInternalBusy(true);
		try {
			await Promise.resolve(onClick(event));
			if (cooldownMs > 0) await wait(cooldownMs);
		} finally {
			if (mountedRef.current) setInternalBusy(false);
		}
	};
	/**
	* Handles keyboard interactions
	*/
	const handleKeyDown = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick(event);
		}
	};
	const buttonClasses = [
		"btn",
		`btn-${variant}`,
		`btn-${size}`,
		busy ? "is-busy" : "",
		locked ? "is-disabled" : "",
		fullWidth ? "is-full-width" : "",
		className
	].filter(Boolean).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type,
		disabled: locked,
		"aria-busy": busy,
		"data-busy": busy ? "true" : "false",
		className: buttonClasses,
		onClick: handleClick,
		onKeyDown: handleKeyDown,
		...props,
		children: [
			icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "btn-icon",
				children: icon
			}),
			busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "btn-spinner",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "btn-label",
				children
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: `
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
            position: relative;
            overflow: hidden;
            white-space: nowrap;
          }

          /* Size variants */
          .btn-small {
            padding: 6px 12px;
            font-size: 0.875rem;
          }

          .btn-medium {
            padding: 10px 16px;
            font-size: 1rem;
          }

          .btn-large {
            padding: 14px 24px;
            font-size: 1.125rem;
          }

          /* Color variants */
          .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 6px 12px -1px rgba(59, 130, 246, 0.4);
            transform: translateY(-2px);
          }

          .btn-primary:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 2px 4px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-primary:focus:not(:disabled) {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-secondary {
            background: #e5e7eb;
            color: #111827;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }

          .btn-secondary:hover:not(:disabled) {
            background: #d1d5db;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }

          .btn-secondary:active:not(:disabled) {
            transform: translateY(0);
          }

          .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
          }

          .btn-success:hover:not(:disabled) {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            box-shadow: 0 6px 12px -1px rgba(16, 185, 129, 0.4);
            transform: translateY(-2px);
          }

          .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
          }

          .btn-danger:hover:not(:disabled) {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            box-shadow: 0 6px 12px -1px rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
          }

          .btn-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
          }

          .btn-warning:hover:not(:disabled) {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            box-shadow: 0 6px 12px -1px rgba(245, 158, 11, 0.4);
            transform: translateY(-2px);
          }

          /* Full width */
          .btn.is-full-width {
            width: 100%;
          }

          /* Loading state */
          .btn.is-busy {
            opacity: 0.8;
          }

          .btn-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          .btn-small .btn-spinner {
            width: 12px;
            height: 12px;
            border-width: 2px;
          }

          .btn-large .btn-spinner {
            width: 20px;
            height: 20px;
            border-width: 2px;
          }

          /* Icon */
          .btn-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          /* Disabled state */
          .btn:disabled,
          .btn.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
          }

          /* Focus visible for accessibility */
          .btn:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* Ripple effect on click */
          .btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            pointer-events: none;
          }

          .btn:active:not(:disabled)::after {
            animation: ripple 0.6s ease-out;
          }

          @keyframes ripple {
            to {
              width: 300px;
              height: 300px;
              opacity: 0;
            }
          }
        ` } })] });
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region src/components/system/AppErrorBoundary.jsx
var AppErrorBoundary = class extends import_react.Component {
	constructor(props) {
		super(props);
		_defineProperty(this, "handleReload", () => {
			if (typeof window !== "undefined") window.location.reload();
		});
		this.state = {
			hasError: false,
			message: ""
		};
	}
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			message: error?.message || "حدث خطأ غير متوقع."
		};
	}
	componentDidCatch(error, errorInfo) {
		logger.error("app error boundary caught an error", {
			message: error?.message,
			stack: error?.stack,
			componentStack: errorInfo?.componentStack
		});
	}
	render() {
		if (!this.state.hasError) return this.props.children;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "page-loader-shell",
			style: {
				minHeight: "100vh",
				padding: 24
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "empty-state",
				style: { maxWidth: 560 },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "empty-icon",
						children: "⚠️"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "حصل خطأ غير متوقع" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: this.state.message || "تم إيقاف الجزء المتأثر لحماية الجلسة والبيانات." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: this.handleReload,
						children: "إعادة تحميل التطبيق"
					})
				]
			})
		});
	}
};
//#endregion
//#region src/components/feedback/InstallPrompt.jsx
function InstallPrompt() {
	const installPrompt = useAppStore((state) => state.installPrompt);
	const clearInstallPrompt = useAppStore((state) => state.clearInstallPrompt);
	if (!installPrompt) return null;
	const handleInstall = async () => {
		installPrompt.prompt();
		await installPrompt.userChoice.catch(() => null);
		clearInstallPrompt();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "install-banner card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "تثبيت التطبيق" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "muted",
			children: "يمكنك تثبيت يمشات كتطبيق PWA على الموبايل أو سطح المكتب."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "install-banner-actions",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: handleInstall,
				children: "تثبيت الآن"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				onClick: clearInstallPrompt,
				children: "لاحقاً"
			})]
		})]
	});
}
//#endregion
//#region src/components/feedback/Skeleton.jsx
function SkeletonBlock({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `skeleton-block ${className}`.trim(),
		"aria-hidden": "true"
	});
}
function FeedSkeleton({ count = 3 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "feed-stack",
		children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card post-card skeleton-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "post-head",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "user-row compact-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-avatar" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "user-meta",
							style: { minWidth: 180 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" })]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-media" })
			]
		}, index))
	});
}
function ListSkeleton({ count = 6 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "list-grid",
		children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card user-row skeleton-card",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-avatar" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "user-meta",
				style: { minWidth: 180 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" })]
			})]
		}, index))
	});
}
function TableSkeleton({ rows = 6, columns = 6 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "table-skeleton-card card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "table-skeleton-head",
			children: Array.from({ length: columns }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line table-head-cell" }, `head-${index}`))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "table-skeleton-body",
			children: Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "table-skeleton-row",
				children: Array.from({ length: columns }).map((__, cellIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line table-cell" }, `cell-${rowIndex}-${cellIndex}`))
			}, `row-${rowIndex}`))
		})]
	});
}
function DashboardSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-state-stack",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card skeleton-card skeleton-hero-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-pill" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stats-skeleton-grid",
				children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card skeleton-card stat-skeleton-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-value" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" })
					]
				}, index))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "list-grid two-column-grid-skeleton",
				children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card skeleton-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-md" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-media short-media" })
					]
				}, index))
			})
		]
	});
}
function AdminOverviewSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-state-stack",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "list-grid two-column-grid-skeleton",
				children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card skeleton-card skeleton-hero-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-pill" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-xl" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" })
					]
				}, index))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stats-skeleton-grid",
				children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card skeleton-card stat-skeleton-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-value" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" })
					]
				}, index))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "list-grid two-column-grid-skeleton",
				children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card skeleton-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-md" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-media short-media" })
					]
				}, index))
			})
		]
	});
}
function RoutePageSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-state-stack route-page-skeleton",
		role: "status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card skeleton-card skeleton-hero-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-pill" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-title-xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line long" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line medium" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "stats-skeleton-grid",
				children: Array.from({ length: 3 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card skeleton-card stat-skeleton-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line tiny" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-value" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonBlock, { className: "skeleton-line short" })
					]
				}, index))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedSkeleton, { count: 2 })
		]
	});
}
//#endregion
//#region src/services/socketManager.js
function decodeJwtPayload(token) {
	if (!token || typeof token !== "string") return null;
	const parts = token.split(".");
	if (parts.length < 2) return null;
	try {
		const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
		const decoded = typeof window !== "undefined" && typeof window.atob === "function" ? window.atob(normalized) : Buffer.from(normalized, "base64").toString("utf-8");
		return JSON.parse(decoded);
	} catch {
		return null;
	}
}
function randomNonce() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function eventSignature(eventName, nonce, timestamp, tokenJti) {
	const value = `${eventName}|${nonce}|${timestamp}|${tokenJti}`;
	let hashed = 2166136261;
	for (const char of value) {
		hashed ^= char.charCodeAt(0);
		hashed = Math.imul(hashed, 16777619) >>> 0;
	}
	return hashed.toString(16).padStart(8, "0");
}
var SocketManager = class {
	constructor() {
		this.socket = lookup(SOCKET_URL, {
			autoConnect: false,
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 1e3,
			reconnectionDelayMax: 3e4,
			timeout: 2e4,
			auth: this.buildAuthPayload()
		});
		this.offlineQueue = this.readOfflineQueue();
		this.heartbeatInterval = null;
		this.lastHeartbeatAt = 0;
		this.lastPongAt = 0;
		this.lastLatencyMs = null;
		this.setupRobustListeners();
	}
	get connected() {
		return Boolean(this.socket?.connected);
	}
	get id() {
		return this.socket?.id || "";
	}
	readOfflineQueue() {
		if (typeof window === "undefined") return [];
		try {
			const raw = window.localStorage.getItem("socket_offline_queue") || "[]";
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	persistOfflineQueue() {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem("socket_offline_queue", JSON.stringify(this.offlineQueue));
		} catch {}
	}
	emitBrowserEvent(name, detail = {}) {
		if (typeof window === "undefined") return;
		window.dispatchEvent(new CustomEvent(name, { detail }));
	}
	setupRobustListeners() {
		this.socket.on("connect", () => {
			logger.info("Socket connected", { id: this.socket.id });
			this.emitBrowserEvent("yamshat:socket-state", {
				connected: true,
				id: this.socket.id,
				latencyMs: this.lastLatencyMs
			});
			this.processOfflineQueue();
			this.startHeartbeat();
		});
		this.socket.on("disconnect", (reason) => {
			logger.warn("Socket disconnected", { reason });
			this.emitBrowserEvent("yamshat:socket-state", {
				connected: false,
				reason,
				latencyMs: this.lastLatencyMs
			});
			this.stopHeartbeat();
			if (reason === "io server disconnect") this.socket.connect();
		});
		this.socket.io.on("reconnect_attempt", (attempt) => {
			const delay = getBackoffDelayMs(attempt, {
				baseDelayMs: 1e3,
				maxDelayMs: 3e4
			});
			this.socket.io.opts.reconnectionDelay = delay;
			this.emitBrowserEvent("yamshat:socket-state", {
				connected: false,
				reconnecting: true,
				attempt,
				nextDelayMs: delay
			});
		});
		this.socket.io.on("reconnect", (attempt) => {
			this.emitBrowserEvent("yamshat:socket-state", {
				connected: true,
				reconnecting: false,
				attempt,
				latencyMs: this.lastLatencyMs
			});
		});
		this.socket.on("pong", (payload = {}) => {
			this.lastPongAt = Date.now();
			const serverTs = Number(payload.server_ts || 0);
			this.lastLatencyMs = this.lastHeartbeatAt ? Math.max(Date.now() - this.lastHeartbeatAt, 0) : null;
			this.emitBrowserEvent("yamshat:socket-heartbeat", {
				latencyMs: this.lastLatencyMs,
				lastPongAt: this.lastPongAt,
				serverTs: Number.isFinite(serverTs) ? serverTs : null
			});
		});
		this.socket.on("auth_expired", (payload = {}) => {
			this.emitBrowserEvent("yamshat:toast", {
				type: "error",
				title: "انتهت الجلسة",
				description: payload.detail || "سجّل الدخول مرة تانية."
			});
		});
	}
	startHeartbeat() {
		this.stopHeartbeat();
		this.heartbeatInterval = setInterval(() => {
			if (!this.socket.connected) return;
			this.lastHeartbeatAt = Date.now();
			this.socket.emit("ping", this.decoratePayload("ping", { ts: this.lastHeartbeatAt }));
		}, 25e3);
	}
	stopHeartbeat() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}
	buildAuthPayload() {
		const token = getAuthToken();
		return token ? { token } : {};
	}
	syncAuth() {
		const authPayload = this.buildAuthPayload();
		this.socket.auth = authPayload;
		if (this.socket.io?.opts) this.socket.io.opts.auth = authPayload;
		return authPayload;
	}
	decoratePayload(eventName, payload = {}) {
		const token = getAuthToken();
		const basePayload = { ...payload || {} };
		if (token && !basePayload.token) basePayload.token = token;
		const jwtPayload = decodeJwtPayload(token);
		const tokenJti = String(jwtPayload?.jti || "").trim();
		if (!tokenJti) return basePayload;
		const timestamp = Date.now();
		const nonce = randomNonce();
		return {
			...basePayload,
			_ts: timestamp,
			_nonce: nonce,
			_sig: eventSignature(eventName, nonce, timestamp, tokenJti)
		};
	}
	connect() {
		if (!getAuthToken()) return;
		this.syncAuth();
		if (!this.socket.connected) this.socket.connect();
	}
	disconnect() {
		this.stopHeartbeat();
		if (this.socket.connected) this.socket.disconnect();
	}
	emit(eventName, payload = {}, options = {}) {
		const signedPayload = options?.skipSignature ? payload : this.decoratePayload(eventName, payload);
		if (this.socket.connected) this.socket.emit(eventName, signedPayload);
		else {
			this.offlineQueue.push({
				eventName,
				payload: signedPayload,
				ts: Date.now()
			});
			if (this.offlineQueue.length > 100) this.offlineQueue.shift();
			this.persistOfflineQueue();
		}
	}
	processOfflineQueue() {
		if (this.offlineQueue.length === 0) return;
		logger.info(`Processing ${this.offlineQueue.length} offline messages`);
		this.offlineQueue.forEach((item) => {
			this.socket.emit(item.eventName, item.payload || {});
		});
		this.offlineQueue = [];
		if (typeof window !== "undefined") try {
			window.localStorage.removeItem("socket_offline_queue");
		} catch {}
	}
	on(event, handler) {
		this.socket.on(event, handler);
		return () => this.socket.off(event, handler);
	}
	off(event, handler) {
		this.socket.off(event, handler);
	}
};
var socketManager = new SocketManager();
//#endregion
//#region src/api/socket.js
var socket_default = socketManager;
//#endregion
//#region src/hooks/useNetworkStatus.js
function useNetworkStatus() {
	const setOnlineStatus = useAppStore((state) => state.setOnlineStatus);
	(0, import_react.useEffect)(() => {
		const updateStatus = (online) => {
			setOnlineStatus(Boolean(online));
			if (online) {
				if (!socket_default.connected) socket_default.connect();
				if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("yamshat:network-restored"));
				return;
			}
			if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("yamshat:network-lost"));
			if (socket_default.connected) socket_default.disconnect();
		};
		updateStatus(typeof navigator === "undefined" ? true : navigator.onLine);
		const handleOnline = () => updateStatus(true);
		const handleOffline = () => updateStatus(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [setOnlineStatus]);
}
//#endregion
//#region src/utils/router.js
function normalizeHashPath(value = "") {
	const raw = String(value || "").replace(/^#/, "").trim();
	if (!raw) return "/";
	return raw.startsWith("/") ? raw : `/${raw}`;
}
function splitPath(value = "") {
	const [pathAndSearch, hash = ""] = normalizeHashPath(value).split("#");
	const [pathname = "/", search = ""] = pathAndSearch.split("?");
	return {
		pathname: pathname || "/",
		search: search ? `?${search}` : "",
		hash: hash ? `#${hash}` : ""
	};
}
function getCurrentAppLocation() {
	if (typeof window === "undefined") return {
		pathname: "/",
		search: "",
		hash: ""
	};
	if (window.location.hash) return splitPath(window.location.hash);
	return {
		pathname: window.location.pathname || "/",
		search: window.location.search || "",
		hash: window.location.hash || ""
	};
}
function getCurrentAppPathname() {
	return getCurrentAppLocation().pathname;
}
function buildAppUrl(target = "/") {
	if (typeof window === "undefined") return String(target || "/");
	const { pathname, search, hash } = splitPath(target);
	return `${window.location.origin}/#${pathname}${search}${hash}`;
}
function redirectToAppPath(target = "/", { replace = true } = {}) {
	if (typeof window === "undefined") return;
	const { pathname, search, hash } = splitPath(target);
	const current = getCurrentAppLocation();
	if (current.pathname === pathname && current.search === search && current.hash === hash) return;
	const nextUrl = buildAppUrl(`${pathname}${search}${hash}`);
	if (replace && typeof window.location.replace === "function") {
		window.location.replace(nextUrl);
		return;
	}
	window.location.assign(nextUrl);
}
//#endregion
//#region src/api/axios.js
var DEFAULT_TIMEOUT_MS = 2e4;
var RETRYABLE_STATUSES = new Set([
	408,
	409,
	425,
	429,
	500,
	502,
	503,
	504
]);
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL = 300 * 1e3;
var pendingRequests = /* @__PURE__ */ new Map();
var API = axios.create({
	baseURL: API_BASE,
	timeout: DEFAULT_TIMEOUT_MS,
	withCredentials: true
});
API.interceptors.request.use(async (config) => {
	const token = getAuthToken();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	const csrfToken = getCsrfToken();
	if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
	if (config.method === "get" && config.useCache) {
		const cacheKey = `${config.url}${JSON.stringify(config.params)}`;
		const cachedResponse = cache.get(cacheKey);
		if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) config.adapter = () => Promise.resolve({
			data: cachedResponse.data,
			status: 200,
			statusText: "OK",
			headers: {},
			config,
			request: {}
		});
	}
	const requestKey = `${config.method}_${config.url}_${JSON.stringify(config.params || config.data)}`;
	if (pendingRequests.has(requestKey)) return Promise.reject({
		isDeduplicated: true,
		requestKey
	});
	pendingRequests.set(requestKey, true);
	return config;
});
API.interceptors.response.use((response) => {
	const requestKey = `${response.config.method}_${response.config.url}_${JSON.stringify(response.config.params || response.config.data)}`;
	pendingRequests.delete(requestKey);
	if (response.config.method === "get" && response.config.useCache) {
		const cacheKey = `${response.config.url}${JSON.stringify(response.config.params)}`;
		cache.set(cacheKey, {
			data: response.data,
			timestamp: Date.now()
		});
	}
	return response;
}, async (error) => {
	if (error.isDeduplicated) {
		console.log(`Request deduplicated: ${error.requestKey}`);
		return Promise.reject(error);
	}
	const { config, response } = error;
	if (config) {
		const requestKey = `${config.method}_${config.url}_${JSON.stringify(config.params || config.data)}`;
		pendingRequests.delete(requestKey);
	}
	if (response?.status === 401 && !config._retry) {
		config._retry = true;
		try {
			const { data } = await sessionManager.refreshSession();
			const newToken = data.access_token;
			config.headers.Authorization = `Bearer ${newToken}`;
			return API(config);
		} catch (refreshError) {
			clearStoredUser();
			redirectToAppPath("/login");
			return Promise.reject(refreshError);
		}
	}
	const retryCount = config._retryCount || 0;
	if (RETRYABLE_STATUSES.has(response?.status) && retryCount < 3) {
		config._retryCount = retryCount + 1;
		const delay = Math.pow(2, retryCount) * 1e3 + Math.random() * 1e3;
		await new Promise((resolve) => setTimeout(resolve, delay));
		return API(config);
	}
	return Promise.reject(error);
});
//#endregion
//#region src/config/mediaConfig.js
var import_spark_md5 = /* @__PURE__ */ __toESM(require_spark_md5(), 1);
var trim = (value) => String(value || "").trim();
var trimSlash = (value) => trim(value).replace(/\/+$/, "");
var runtime = typeof window === "undefined" ? {} : window;
var readRuntime = (key, fallback = "") => trim(runtime?.[key] || fallback);
var readEnv = (key, fallback = "") => trim({
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": false
}[key] || fallback);
var MEDIA_PROVIDER = (readRuntime("APP_MEDIA_PROVIDER") || readRuntime("YAMSHAT_MEDIA_PROVIDER") || readEnv("VITE_MEDIA_PROVIDER") || "cloudflare-r2").toLowerCase();
var MEDIA_CDN_BASE = trimSlash(readRuntime("APP_CDN_BASE") || readRuntime("YAMSHAT_CDN_BASE") || readEnv("VITE_CDN_BASE") || "");
var MEDIA_ENDPOINTS = {
	simpleUpload: readRuntime("APP_MEDIA_UPLOAD_URL") || readEnv("VITE_MEDIA_UPLOAD_URL") || "/upload",
	resumableStart: readRuntime("APP_MEDIA_RESUMABLE_START_URL") || readEnv("VITE_MEDIA_RESUMABLE_START_URL") || "/upload/resumable/start",
	resumableStatus: readRuntime("APP_MEDIA_RESUMABLE_STATUS_URL") || readEnv("VITE_MEDIA_RESUMABLE_STATUS_URL") || "/upload/resumable",
	resumableChunk: readRuntime("APP_MEDIA_RESUMABLE_CHUNK_URL") || readEnv("VITE_MEDIA_RESUMABLE_CHUNK_URL") || "/upload/resumable",
	resumableComplete: readRuntime("APP_MEDIA_RESUMABLE_COMPLETE_URL") || readEnv("VITE_MEDIA_RESUMABLE_COMPLETE_URL") || "/upload/resumable"
};
var IMAGE_PRESET = {
	format: "image/webp",
	quality: Number(readRuntime("APP_IMAGE_QUALITY") || readEnv("VITE_IMAGE_QUALITY") || .82),
	maxWidthOrHeight: Number(readRuntime("APP_IMAGE_MAX_DIMENSION") || readEnv("VITE_IMAGE_MAX_DIMENSION") || 1920),
	maxSizeMB: Number(readRuntime("APP_IMAGE_MAX_SIZE_MB") || readEnv("VITE_IMAGE_MAX_SIZE_MB") || 4)
};
var VIDEO_PRESET = {
	chunkSizeBytes: Number(readRuntime("APP_VIDEO_CHUNK_SIZE") || readEnv("VITE_VIDEO_CHUNK_SIZE") || 5 * 1024 * 1024),
	qualities: (readRuntime("APP_VIDEO_QUALITIES") || readEnv("VITE_VIDEO_QUALITIES") || "1080,720,480").split(",").map((item) => Number(item.trim())).filter(Boolean),
	streamingProfiles: ["hls"],
	thumbnailCount: Number(readRuntime("APP_VIDEO_THUMBNAIL_COUNT") || readEnv("VITE_VIDEO_THUMBNAIL_COUNT") || 1)
};
var FILE_RULES = {
	resumableThresholdBytes: Number(readRuntime("APP_MEDIA_RESUMABLE_THRESHOLD") || readEnv("VITE_MEDIA_RESUMABLE_THRESHOLD") || 5 * 1024 * 1024),
	maxFileSizeBytes: Number(readRuntime("APP_MEDIA_MAX_SIZE") || readEnv("VITE_MEDIA_MAX_SIZE") || 250 * 1024 * 1024),
	allowedMimeTypes: (readRuntime("APP_MEDIA_ALLOWED_TYPES") || readEnv("VITE_MEDIA_ALLOWED_TYPES") || "").split(",").map((item) => item.trim()).filter(Boolean)
};
var PROVIDER_OPTIONS = {
	"cloudflare-r2": {
		label: "Cloudflare R2",
		strengths: [
			"Storage",
			"Signed URLs",
			"S3 compatible API"
		]
	},
	"aws-s3": {
		label: "AWS S3",
		strengths: [
			"Multipart upload",
			"Lifecycle policies",
			"Transcoding integrations"
		]
	},
	"bunny-cdn": {
		label: "Bunny CDN",
		strengths: [
			"Global CDN",
			"Video streaming edge delivery",
			"Image optimizer"
		]
	}
};
var DISAPPEARING_MESSAGE_OPTIONS = [
	{
		value: 0,
		label: "بدون"
	},
	{
		value: 30,
		label: "30 ثانية"
	},
	{
		value: 300,
		label: "5 دقائق"
	},
	{
		value: 3600,
		label: "ساعة"
	},
	{
		value: 86400,
		label: "24 ساعة"
	}
];
function resolveMediaUrl(candidate = "") {
	const value = trim(candidate);
	if (!value) return "";
	if (/^(blob:|data:|https?:)/i.test(value)) return value;
	if (!MEDIA_CDN_BASE) return value;
	return `${MEDIA_CDN_BASE}/${value.replace(/^\/+/, "")}`;
}
function currentMediaProviderLabel() {
	return PROVIDER_OPTIONS[MEDIA_PROVIDER]?.label || MEDIA_PROVIDER;
}
//#endregion
//#region src/services/media/mediaUploadService.js
var SESSION_PREFIX = "yamshat-media-upload";
var DEFAULT_CHUNK_SIZE = VIDEO_PRESET.chunkSizeBytes || 5 * 1024 * 1024;
var stagePercent = {
	validating: 5,
	optimizing: 20,
	hashing: 30,
	preparing: 35,
	uploading: 80,
	finalizing: 95,
	done: 100
};
function isImage(file) {
	return Boolean(file?.type?.startsWith("image/"));
}
function isVideo(file) {
	return Boolean(file?.type?.startsWith("video/"));
}
function isAudio(file) {
	return Boolean(file?.type?.startsWith("audio/"));
}
function extensionFor(type = "") {
	if (type === "image/webp") return "webp";
	if (type === "audio/ogg") return "ogg";
	if (type === "audio/webm") return "webm";
	return "";
}
function withExtension(name = "upload", ext = "") {
	if (!ext) return name;
	return `${String(name).replace(/\.[^/.]+$/, "")}.${ext}`;
}
function sessionKey(fingerprint = "") {
	return `${SESSION_PREFIX}:${fingerprint}`;
}
function persistSession(fingerprint, payload) {
	if (typeof window === "undefined" || !fingerprint) return;
	window.localStorage.setItem(sessionKey(fingerprint), JSON.stringify(payload));
}
function readSession(fingerprint) {
	if (typeof window === "undefined" || !fingerprint) return null;
	try {
		const raw = window.localStorage.getItem(sessionKey(fingerprint));
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function clearSession(fingerprint) {
	if (typeof window === "undefined" || !fingerprint) return;
	window.localStorage.removeItem(sessionKey(fingerprint));
}
function emitProgress(onProgress, payload) {
	if (typeof onProgress !== "function") return;
	onProgress(payload);
}
async function readChunkAsArrayBuffer(blob) {
	return blob.arrayBuffer();
}
async function computeFingerprint(file, onProgress = () => {}) {
	const chunkSize = 2 * 1024 * 1024;
	const chunks = Math.max(1, Math.ceil(file.size / chunkSize));
	const spark = new import_spark_md5.default.ArrayBuffer();
	for (let index = 0; index < chunks; index += 1) {
		const start = index * chunkSize;
		const end = Math.min(file.size, start + chunkSize);
		const buffer = await readChunkAsArrayBuffer(file.slice(start, end));
		spark.append(buffer);
		emitProgress(onProgress, {
			stage: "hashing",
			percent: Math.min(35, 25 + Math.round((index + 1) / chunks * 10)),
			chunkIndex: index,
			totalChunks: chunks
		});
	}
	return spark.end();
}
async function extractVideoThumbnail(file) {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		video.preload = "metadata";
		video.muted = true;
		const source = URL.createObjectURL(file);
		video.src = source;
		video.playsInline = true;
		const cleanup = () => {
			URL.revokeObjectURL(source);
		};
		video.onloadeddata = () => {
			const canvas = document.createElement("canvas");
			canvas.width = Math.min(video.videoWidth || 640, 640);
			canvas.height = Math.max(1, Math.round(canvas.width / Math.max(video.videoWidth || 1, 1) * Math.max(video.videoHeight || 1, 1)));
			const context = canvas.getContext("2d");
			if (!context) {
				cleanup();
				resolve(null);
				return;
			}
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
			canvas.toBlob((blob) => {
				cleanup();
				if (!blob) {
					resolve(null);
					return;
				}
				resolve(new File([blob], withExtension(file.name, "jpg"), { type: "image/jpeg" }));
			}, "image/jpeg", .82);
		};
		video.onerror = () => {
			cleanup();
			resolve(null);
		};
	});
}
function validateFile(file) {
	if (!file) throw new Error("الملف غير صالح.");
	if (FILE_RULES.allowedMimeTypes.length && !FILE_RULES.allowedMimeTypes.includes(file.type)) throw new Error(`نوع الملف ${file.type || "غير معروف"} غير مسموح.`);
	if (file.size > FILE_RULES.maxFileSizeBytes) throw new Error(`حجم الملف أكبر من الحد المسموح (${Math.round(FILE_RULES.maxFileSizeBytes / (1024 * 1024))}MB).`);
}
async function prepareImage(file, onProgress) {
	emitProgress(onProgress, {
		stage: "optimizing",
		percent: stagePercent.optimizing,
		fileName: file.name
	});
	const optimized = await imageCompression(file, {
		maxSizeMB: IMAGE_PRESET.maxSizeMB,
		maxWidthOrHeight: IMAGE_PRESET.maxWidthOrHeight,
		useWebWorker: false,
		fileType: IMAGE_PRESET.format,
		initialQuality: IMAGE_PRESET.quality,
		alwaysKeepResolution: false,
		onProgress: (value) => {
			emitProgress(onProgress, {
				stage: "optimizing",
				percent: Math.min(35, 10 + Math.round(value * .2)),
				fileName: file.name
			});
		}
	});
	return {
		file: new File([optimized], withExtension(file.name, extensionFor(IMAGE_PRESET.format)), {
			type: IMAGE_PRESET.format,
			lastModified: Date.now()
		}),
		manifest: {
			category: "image",
			provider: MEDIA_PROVIDER,
			optimize: true,
			webp: true,
			resize: IMAGE_PRESET.maxWidthOrHeight,
			cdn: Boolean(MEDIA_CDN_BASE)
		}
	};
}
async function prepareVideo(file, onProgress) {
	emitProgress(onProgress, {
		stage: "preparing",
		percent: stagePercent.preparing,
		fileName: file.name
	});
	return {
		file,
		thumbnail: await extractVideoThumbnail(file),
		manifest: {
			category: "video",
			provider: MEDIA_PROVIDER,
			requestedQualities: VIDEO_PRESET.qualities,
			thumbnails: VIDEO_PRESET.thumbnailCount,
			streaming: VIDEO_PRESET.streamingProfiles,
			chunkUpload: true,
			cdn: Boolean(MEDIA_CDN_BASE)
		}
	};
}
async function prepareAudio(file, onProgress) {
	emitProgress(onProgress, {
		stage: "preparing",
		percent: stagePercent.preparing,
		fileName: file.name
	});
	return {
		file,
		manifest: {
			category: "audio",
			codec: file.type || "audio/ogg",
			streamingUpload: true,
			cdn: Boolean(MEDIA_CDN_BASE)
		}
	};
}
async function prepareGenericFile(file, onProgress) {
	emitProgress(onProgress, {
		stage: "preparing",
		percent: stagePercent.preparing,
		fileName: file.name
	});
	return {
		file,
		manifest: {
			category: "file",
			provider: MEDIA_PROVIDER,
			resumable: file.size >= FILE_RULES.resumableThresholdBytes,
			validation: true,
			progressBar: true,
			resumeUpload: true
		}
	};
}
function normalizeUploadResponse(response, extra = {}) {
	const data = response?.data?.upload || response?.data || {};
	const url = resolveMediaUrl(data.media_url || data.url || data.file_url || data.path || "");
	return {
		...data,
		...extra,
		url,
		mediaUrl: url,
		cdnUrl: url,
		provider: MEDIA_PROVIDER,
		cdnBase: MEDIA_CDN_BASE
	};
}
async function uploadSimple(file, manifest, onProgress, extraFields = {}) {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("provider", MEDIA_PROVIDER);
	formData.append("manifest", JSON.stringify(manifest));
	Object.entries(extraFields || {}).forEach(([key, value]) => {
		if (value === void 0 || value === null) return;
		formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
	});
	const response = await API.post(MEDIA_ENDPOINTS.simpleUpload, formData, {
		headers: { "Content-Type": "multipart/form-data" },
		onUploadProgress: (event) => {
			const progress = event.total ? Math.round(event.loaded / event.total * 100) : 0;
			emitProgress(onProgress, {
				stage: "uploading",
				percent: Math.max(stagePercent.preparing, progress),
				loadedBytes: event.loaded,
				totalBytes: event.total || file.size
			});
		}
	});
	emitProgress(onProgress, {
		stage: "done",
		percent: stagePercent.done
	});
	return normalizeUploadResponse(response, { manifest });
}
async function uploadResumable(file, fingerprint, manifest, onProgress, extraFields = {}) {
	const chunkSize = DEFAULT_CHUNK_SIZE;
	const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
	let cached = readSession(fingerprint);
	let sessionId = cached?.sessionId || "";
	let uploadedChunks = cached?.uploadedChunks || [];
	if (!sessionId) try {
		const response = await API.post(MEDIA_ENDPOINTS.resumableStart, {
			filename: file.name,
			content_type: file.type || "application/octet-stream",
			total_size: file.size,
			total_chunks: totalChunks,
			file_hash: fingerprint,
			provider: MEDIA_PROVIDER,
			manifest,
			...extraFields
		});
		sessionId = response?.data?.session_id;
		uploadedChunks = response?.data?.uploaded_chunks || [];
		persistSession(fingerprint, {
			sessionId,
			uploadedChunks,
			fileName: file.name,
			totalChunks,
			updatedAt: Date.now()
		});
	} catch (error) {
		logger.warn("Resumable start failed, falling back to single upload", {
			message: error?.message,
			endpoint: MEDIA_ENDPOINTS.resumableStart
		});
		return uploadSimple(file, manifest, onProgress, extraFields);
	}
	else try {
		uploadedChunks = (await API.get(`${MEDIA_ENDPOINTS.resumableStatus}/${sessionId}`))?.data?.uploaded_chunks || uploadedChunks;
	} catch {}
	const uploadedSet = new Set(uploadedChunks);
	for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
		if (uploadedSet.has(chunkIndex)) {
			emitProgress(onProgress, {
				stage: "uploading",
				percent: Math.round((chunkIndex + 1) / totalChunks * 100),
				chunkIndex,
				totalChunks,
				resumed: true
			});
			continue;
		}
		const start = chunkIndex * chunkSize;
		const end = Math.min(file.size, start + chunkSize);
		const chunk = file.slice(start, end);
		await API.put(`${MEDIA_ENDPOINTS.resumableChunk}/${sessionId}/chunk/${chunkIndex}`, chunk, { headers: {
			"Content-Type": "application/octet-stream",
			"X-Chunk-Start": String(start),
			"X-Chunk-End": String(end),
			"X-File-Hash": fingerprint
		} });
		uploadedSet.add(chunkIndex);
		persistSession(fingerprint, {
			sessionId,
			uploadedChunks: Array.from(uploadedSet),
			fileName: file.name,
			totalChunks,
			updatedAt: Date.now()
		});
		emitProgress(onProgress, {
			stage: "uploading",
			percent: Math.round((chunkIndex + 1) / totalChunks * 100),
			chunkIndex,
			totalChunks,
			resumed: Boolean(cached?.sessionId),
			loadedBytes: end,
			totalBytes: file.size
		});
	}
	emitProgress(onProgress, {
		stage: "finalizing",
		percent: stagePercent.finalizing
	});
	const response = await API.post(`${MEDIA_ENDPOINTS.resumableComplete}/${sessionId}/complete`, {
		file_hash: fingerprint,
		manifest,
		...extraFields
	});
	clearSession(fingerprint);
	emitProgress(onProgress, {
		stage: "done",
		percent: stagePercent.done
	});
	return normalizeUploadResponse(response, {
		manifest,
		resumed: Boolean(cached?.sessionId)
	});
}
var MediaUploadService = class {
	async prepareFile(file, onProgress = () => {}) {
		validateFile(file);
		emitProgress(onProgress, {
			stage: "validating",
			percent: stagePercent.validating,
			fileName: file.name
		});
		if (isImage(file)) return prepareImage(file, onProgress);
		if (isVideo(file)) return prepareVideo(file, onProgress);
		if (isAudio(file)) return prepareAudio(file, onProgress);
		return prepareGenericFile(file, onProgress);
	}
	async uploadFile(file, options = {}) {
		const onProgress = options?.onProgress || (() => {});
		const prepared = await this.prepareFile(file, onProgress);
		const fingerprint = await computeFingerprint(prepared.file, onProgress);
		const extraFields = {
			purpose: options?.purpose || "chat-attachment",
			original_filename: file.name,
			original_size: file.size,
			thumbnail_count: prepared.thumbnail ? 1 : 0,
			attachment_kind: isImage(file) ? "image" : isVideo(file) ? "video" : isAudio(file) ? "audio" : "file"
		};
		if (prepared.thumbnail) extraFields.thumbnail_manifest = {
			name: prepared.thumbnail.name,
			type: prepared.thumbnail.type,
			size: prepared.thumbnail.size
		};
		return {
			...prepared.file.size >= FILE_RULES.resumableThresholdBytes || isVideo(prepared.file) ? await uploadResumable(prepared.file, fingerprint, prepared.manifest, onProgress, extraFields) : await uploadSimple(prepared.file, prepared.manifest, onProgress, extraFields),
			fingerprint,
			preparedFile: prepared.file,
			thumbnailFile: prepared.thumbnail || null,
			manifest: prepared.manifest,
			optimized: prepared.file !== file,
			mediaType: extraFields.attachment_kind,
			originalName: file.name,
			originalSize: file.size
		};
	}
	async uploadVoiceNote(blob, options = {}) {
		const fileName = options?.fileName || `voice-note-${Date.now()}.ogg`;
		const file = blob instanceof File ? blob : new File([blob], fileName, { type: blob?.type || "audio/ogg" });
		return this.uploadFile(file, {
			...options,
			purpose: "voice-note"
		});
	}
	validate(file) {
		validateFile(file);
		return true;
	}
};
var mediaUploadService = new MediaUploadService();
//#endregion
//#region src/api/chat.js
var RESUME_KEY_PREFIX = "yamshat-upload-session";
var sessionStorageKey = (file) => `${RESUME_KEY_PREFIX}:${file.name}:${file.size}:${file.lastModified}`;
var getMessages = (receiver, limit = 40, before_id, options = {}) => API.get("/messages", {
	params: {
		receiver,
		limit,
		before_id
	},
	signal: options.signal,
	cache: Boolean(before_id),
	cacheTtlMs: 8e3
});
var sendMessageApi = (payload) => API.post("/send_message", payload);
var markMessagesSeen = (sender) => API.post("/message_seen", { sender });
var getChatThreads = (options = {}) => API.get("/chat_threads", {
	signal: options.signal,
	cache: true,
	cacheTtlMs: 1e4
});
var blockUserApi = (username) => API.post("/block_user", { username });
var unblockUserApi = (username) => API.post("/unblock_user", { username });
var deleteMessageApi = (message_id) => API.post("/delete_message", { message_id });
async function uploadMediaWithResume(file, onProgress = () => {}) {
	const upload = await mediaUploadService.uploadFile(file, { onProgress: (payload) => {
		onProgress(typeof payload === "number" ? payload : Number(payload?.percent || 0));
	} });
	const responseShape = {
		upload,
		media_url: upload.mediaUrl,
		url: upload.url,
		cdn_url: upload.cdnUrl,
		manifest: upload.manifest,
		provider: upload.provider
	};
	try {
		window.localStorage.removeItem(sessionStorageKey(file));
	} catch {}
	return { data: responseShape };
}
var restoreMessage = (message_id) => API.post("/restore_message", { message_id });
//#endregion
//#region src/utils/featureFlags.js
function readFlag(name, fallback = true) {
	const value = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": false
	}[name];
	if (value === void 0) return fallback;
	return String(value).trim().toLowerCase() !== "false";
}
var featureFlags = {
	offlineQueue: readFlag("VITE_ENABLE_OFFLINE_QUEUE", true),
	chatCache: readFlag("VITE_ENABLE_CHAT_CACHE", true),
	frontendLogging: readFlag("VITE_ENABLE_FRONTEND_LOGGING", true),
	performanceMetrics: readFlag("VITE_ENABLE_PERFORMANCE_METRICS", true)
};
//#endregion
//#region src/hooks/useOfflineQueue.js
function fireQueueEvent(name, detail) {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent(name, { detail }));
}
function useOfflineQueue() {
	const isOnline = useAppStore((state) => state.isOnline);
	const queuedActions = useAppStore((state) => state.queuedActions);
	const dequeueAction = useAppStore((state) => state.dequeueAction);
	const updateQueuedAction = useAppStore((state) => state.updateQueuedAction);
	const replaceQueuedActions = useAppStore((state) => state.replaceQueuedActions);
	const runningRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (!featureFlags.offlineQueue || !isOnline || runningRef.current || queuedActions.length === 0) return;
		window.__YAMSHAT_SW_READY__?.then((registration) => registration?.active?.postMessage?.({ type: "yamshat:queue-sync" })).catch(() => null);
		let cancelled = false;
		runningRef.current = true;
		const flushQueue = async () => {
			logger.info("offline queue flush started", { size: queuedActions.length });
			for (const action of queuedActions) {
				if (cancelled) break;
				if (action?.type !== "chat:send_message" || !action?.payload) {
					dequeueAction(action?.id);
					continue;
				}
				const retryAtMs = action?.nextRetryAt ? new Date(action.nextRetryAt).getTime() : 0;
				if (retryAtMs && retryAtMs > Date.now()) continue;
				try {
					updateQueuedAction(action.id, { lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString() });
					const { data } = await sendMessageApi(action.payload);
					dequeueAction(action.id);
					fireQueueEvent("yamshat:queued-message-sent", {
						queuedId: action.id,
						client_id: action.payload.client_id,
						payload: action.payload,
						response: data?.data || data
					});
					await sleep(120);
				} catch (error) {
					const status = error?.response?.status;
					const attempts = Number(action?.attempts || 0) + 1;
					logger.warn("offline queue item failed", {
						actionId: action.id,
						status,
						attempts
					});
					if (status && status < 500 && status !== 429) {
						dequeueAction(action.id);
						fireQueueEvent("yamshat:queued-message-failed", {
							queuedId: action.id,
							client_id: action.payload.client_id,
							payload: action.payload,
							error: error?.response?.data?.detail || error?.message || "Queue item failed"
						});
						continue;
					}
					const delayMs = getBackoffDelayMs(attempts - 1, {
						baseDelayMs: status === 429 ? 1400 : 900,
						maxDelayMs: 45e3,
						jitterRatio: .4
					});
					updateQueuedAction(action.id, {
						attempts,
						lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString(),
						nextRetryAt: new Date(Date.now() + delayMs).toISOString()
					});
					break;
				}
			}
			runningRef.current = false;
		};
		flushQueue();
		const handleSyncNow = () => {
			replaceQueuedActions([...useAppStore.getState().queuedActions]);
		};
		const handleServiceWorkerMessage = (event) => {
			if (event.data?.type === "yamshat:sync-now") handleSyncNow();
		};
		window.addEventListener("yamshat:sync-now", handleSyncNow);
		navigator.serviceWorker?.addEventListener?.("message", handleServiceWorkerMessage);
		const pendingRetryAt = queuedActions.map((item) => item?.nextRetryAt ? new Date(item.nextRetryAt).getTime() : 0).filter((value) => value > Date.now()).sort((a, b) => a - b)[0];
		const timer = pendingRetryAt ? window.setTimeout(() => {
			replaceQueuedActions([...useAppStore.getState().queuedActions]);
		}, Math.max(250, pendingRetryAt - Date.now() + 50)) : null;
		return () => {
			cancelled = true;
			runningRef.current = false;
			if (timer) window.clearTimeout(timer);
			window.removeEventListener("yamshat:sync-now", handleSyncNow);
			navigator.serviceWorker?.removeEventListener?.("message", handleServiceWorkerMessage);
		};
	}, [
		dequeueAction,
		isOnline,
		queuedActions,
		replaceQueuedActions,
		updateQueuedAction
	]);
}
//#endregion
//#region src/hooks/useSessionGuard.js
var PUBLIC_PATHS = new Set([
	"/login",
	"/register",
	"/verify-email",
	"/forgot-password",
	"/reset-password",
	"/admin",
	"/admin/login"
]);
var REFRESH_EARLY_WINDOW_MS = 6e4;
function isPublicPath(pathname) {
	if (PUBLIC_PATHS.has(pathname)) return true;
	return pathname.startsWith("/reset-password");
}
function redirectToLogin$1(pathname) {
	if (typeof window === "undefined") return;
	const currentPath = getCurrentAppPathname();
	redirectToAppPath(pathname.startsWith("/admin") || currentPath.startsWith("/admin") ? "/admin/login" : "/login");
}
function useSessionGuard() {
	const location = useLocation();
	const setAuthHydrated = useAppStore((state) => state.setAuthHydrated);
	const setAuthLoading = useAppStore((state) => state.setAuthLoading);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const bootstrap = async () => {
			setAuthLoading(true);
			try {
				const pathname = location.pathname;
				const publicPath = isPublicPath(pathname);
				const stored = getStoredUser();
				const token = getAuthToken();
				const shouldAttemptRestore = !publicPath || hasStoredSession();
				if (stored && token && !shouldRefreshSessionSoon(REFRESH_EARLY_WINDOW_MS)) return;
				if (!shouldAttemptRestore) return;
				await sessionManager.refreshSession({
					reason: publicPath ? "public-bootstrap" : "protected-bootstrap",
					force: !publicPath
				});
			} catch {
				if (cancelled) return;
				clearStoredUser();
				if (!isPublicPath(location.pathname)) redirectToLogin$1(location.pathname);
			} finally {
				if (!cancelled) {
					setAuthHydrated(true);
					setAuthLoading(false);
				}
			}
		};
		bootstrap();
		return () => {
			cancelled = true;
		};
	}, [
		location.pathname,
		setAuthHydrated,
		setAuthLoading
	]);
	(0, import_react.useEffect)(() => {
		if (!hasStoredSession()) return void 0;
		const ttl = getSessionTtlMs();
		if (ttl === null) return void 0;
		const refreshIn = Math.max(ttl - REFRESH_EARLY_WINDOW_MS, 5e3);
		const timer = window.setTimeout(async () => {
			try {
				setAuthLoading(true);
				await sessionManager.refreshSession({ reason: "scheduled" });
			} catch {
				clearStoredUser();
				if (!isPublicPath(location.pathname)) redirectToLogin$1(location.pathname);
			} finally {
				setAuthHydrated(true);
				setAuthLoading(false);
			}
		}, refreshIn);
		return () => window.clearTimeout(timer);
	}, [
		location.pathname,
		setAuthHydrated,
		setAuthLoading
	]);
}
//#endregion
//#region src/utils/analytics.js
var QUEUE_KEY = "yamshat-analytics-queue";
function readQueue() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(QUEUE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writeQueue(queue) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
	} catch {}
}
function getAnonymousId() {
	if (typeof window === "undefined") return "server";
	try {
		const key = "yamshat-anonymous-id";
		const existing = window.localStorage.getItem(key);
		if (existing) return existing;
		const next = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		window.localStorage.setItem(key, next);
		return next;
	} catch {
		return `anon-${Date.now()}`;
	}
}
function buildHeaders() {
	const headers = {
		"Content-Type": "application/json",
		"X-Yamshat-Client": "web",
		"X-Session-Id": typeof window === "undefined" ? "server" : window.sessionStorage.getItem("yamshat-session-id") || getAnonymousId(),
		"X-Anonymous-Id": getAnonymousId()
	};
	const token = getAuthToken();
	if (token) headers.Authorization = `Bearer ${token}`;
	const csrfToken = getCsrfToken();
	if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
	return headers;
}
async function sendPayload(payload) {
	const endpoint = `${API_BASE}/analytics/events`;
	const body = JSON.stringify(payload);
	if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") try {
		const blob = new Blob([body], { type: "application/json" });
		if (navigator.sendBeacon(endpoint, blob)) return true;
	} catch {}
	const response = await fetch(endpoint, {
		method: "POST",
		headers: buildHeaders(),
		body,
		keepalive: true,
		credentials: "include"
	});
	if (!response.ok) throw new Error(`Analytics failed: ${response.status}`);
	return true;
}
async function flushAnalyticsQueue() {
	const queued = readQueue();
	if (!queued.length) return;
	const pending = [...queued];
	writeQueue([]);
	for (const item of pending) try {
		await sendPayload(item);
	} catch {
		writeQueue([...readQueue(), item]);
	}
}
async function trackEvent(eventName, properties = {}, context = {}) {
	const payload = {
		event_name: eventName,
		category: context.category || "ui",
		route: context.route || (typeof window !== "undefined" ? window.location.pathname : "/"),
		platform: "web",
		anonymous_id: getAnonymousId(),
		properties,
		context
	};
	try {
		await sendPayload(payload);
	} catch {
		writeQueue([...readQueue(), payload]);
	}
}
function trackPageView(route, title = "") {
	return trackEvent("page_view", { title: title || (typeof document !== "undefined" ? document.title : "") }, {
		category: "navigation",
		route
	});
}
//#endregion
//#region src/hooks/usePageAnalytics.js
function usePageAnalytics() {
	const location = useLocation();
	(0, import_react.useEffect)(() => {
		trackPageView(`${location.pathname}${location.search || ""}`).catch(() => null);
	}, [location.pathname, location.search]);
	(0, import_react.useEffect)(() => {
		flushAnalyticsQueue().catch(() => null);
		const handleOnline = () => {
			flushAnalyticsQueue().catch(() => null);
		};
		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, []);
}
//#endregion
//#region src/hooks/useChatRealtime.js
function useChatRealtime() {
	const currentUser = getCurrentUsername();
	const token = getAuthToken();
	const initialized = useChatStore((state) => state.initialized);
	const activePeer = useChatStore((state) => state.activePeer);
	const hydrateThreads = useChatStore((state) => state.hydrateThreads);
	const applyIncomingMessage = useChatStore((state) => state.applyIncomingMessage);
	const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);
	const setPresence = useChatStore((state) => state.setPresence);
	const markThreadRead = useChatStore((state) => state.markThreadRead);
	const setLoadingThreads = useChatStore((state) => state.setLoadingThreads);
	const activePeerRef = (0, import_react.useRef)(activePeer);
	(0, import_react.useEffect)(() => {
		activePeerRef.current = activePeer;
	}, [activePeer]);
	(0, import_react.useEffect)(() => {
		if (!currentUser || initialized) return void 0;
		let active = true;
		const bootstrap = async () => {
			setLoadingThreads(true);
			try {
				const { data } = await getChatThreads({});
				if (!active) return;
				hydrateThreads(Array.isArray(data) ? data : [], { replace: true });
			} catch (error) {
				logger.warn("chat threads bootstrap failed", { detail: error?.response?.data?.detail || error?.message });
			} finally {
				if (active) setLoadingThreads(false);
			}
		};
		bootstrap();
		return () => {
			active = false;
		};
	}, [
		currentUser,
		hydrateThreads,
		initialized,
		setLoadingThreads
	]);
	(0, import_react.useEffect)(() => {
		if (!currentUser) return void 0;
		const emitRegister = () => {
			socketManager.emit("register_user", {
				token,
				user: currentUser
			}, { skipSignature: true });
			socketManager.emit("sync_chat_state", { peer: activePeerRef.current || void 0 });
		};
		socketManager.connect();
		emitRegister();
		const handleConnect = () => emitRegister();
		const handleNewMessage = (message) => {
			if (![message?.sender, message?.receiver].includes(currentUser)) return;
			const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
			applyIncomingMessage(message, currentUser, { skipUnreadIncrement: message?.sender !== currentUser && activePeerRef.current === peer });
			if (message?.sender !== currentUser && activePeerRef.current === peer) markThreadRead(peer);
		};
		const handleDelivered = (payload) => {
			if (payload?.sender !== currentUser || !payload?.viewer) return;
			updateMessageStatus(payload.viewer, payload.message_ids || [], "delivered");
		};
		const handleSeen = (payload) => {
			if (payload?.sender === currentUser && payload?.viewer) updateMessageStatus(payload.viewer, payload.message_ids || [], "seen");
			if (payload?.viewer === currentUser && payload?.sender) markThreadRead(payload.sender);
		};
		const handlePresence = (payload) => {
			if (!payload?.user) return;
			setPresence(payload.user, payload);
		};
		const handleTyping = (payload) => {
			if (!payload?.sender) return;
			setPresence(payload.sender, {
				is_typing: Boolean(payload?.is_typing),
				typing_updated_at: (/* @__PURE__ */ new Date()).toISOString()
			});
		};
		socketManager.on("connect", handleConnect);
		socketManager.on("new_private_message", handleNewMessage);
		socketManager.on("messages_delivered", handleDelivered);
		socketManager.on("messages_seen", handleSeen);
		socketManager.on("presence_update", handlePresence);
		socketManager.on("typing_update", handleTyping);
		return () => {
			socketManager.off("connect", handleConnect);
			socketManager.off("new_private_message", handleNewMessage);
			socketManager.off("messages_delivered", handleDelivered);
			socketManager.off("messages_seen", handleSeen);
			socketManager.off("presence_update", handlePresence);
			socketManager.off("typing_update", handleTyping);
		};
	}, [
		activePeer,
		applyIncomingMessage,
		currentUser,
		markThreadRead,
		setPresence,
		token,
		updateMessageStatus
	]);
}
//#endregion
//#region \0vite/preload-helper.js
var scriptRel = "modulepreload";
var assetsURL = function(dep) {
	return "/" + dep;
};
var seen = {};
var __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (deps && deps.length > 0) {
		const links = document.getElementsByTagName("link");
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
		function allSettled(promises) {
			return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
				status: "fulfilled",
				value
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		promise = allSettled(deps.map((dep) => {
			dep = assetsURL(dep, importerUrl);
			if (dep in seen) return;
			seen[dep] = true;
			const isCss = dep.endsWith(".css");
			const cssSelector = isCss ? "[rel=\"stylesheet\"]" : "";
			if (!!importerUrl) for (let i = links.length - 1; i >= 0; i--) {
				const link = links[i];
				if (link.href === dep && (!isCss || link.rel === "stylesheet")) return;
			}
			else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
			const link = document.createElement("link");
			link.rel = isCss ? "stylesheet" : scriptRel;
			if (!isCss) link.as = "script";
			link.crossOrigin = "";
			link.href = dep;
			if (cspNonce) link.setAttribute("nonce", cspNonce);
			document.head.appendChild(link);
			if (isCss) return new Promise((res, rej) => {
				link.addEventListener("load", res);
				link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
			});
		}));
	}
	function handlePreloadError(err) {
		const e = new Event("vite:preloadError", { cancelable: true });
		e.payload = err;
		window.dispatchEvent(e);
		if (!e.defaultPrevented) throw err;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};
//#endregion
//#region src/App.jsx
var AdminDashboard = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminDashboard })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminUsers = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminUsers })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminPosts = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminPosts })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminNotifications = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminNotifications })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminLive = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminLive })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminReports = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminReports })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminSettings = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminSettings })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminRbac = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminRbac })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminChat = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminChat })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminStories = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminStories })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminReels = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminReels })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var AdminGroups = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/admin-Cbfe96Hs.js").then((mod) => ({ default: mod.AdminGroups })), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14])));
var Login = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/auth-2tAwxGR9.js").then((mod) => ({ default: mod.Login })), __vite__mapDeps([15,1,2,3,4,6,13])));
var AdminLogin = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/auth-2tAwxGR9.js").then((mod) => ({ default: mod.AdminLogin })), __vite__mapDeps([15,1,2,3,4,6,13])));
var Register = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/auth-2tAwxGR9.js").then((mod) => ({ default: mod.Register })), __vite__mapDeps([15,1,2,3,4,6,13])));
var VerifyEmail = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/auth-2tAwxGR9.js").then((mod) => ({ default: mod.VerifyEmail })), __vite__mapDeps([15,1,2,3,4,6,13])));
var ForgotPassword = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/auth-2tAwxGR9.js").then((mod) => ({ default: mod.ForgotPassword })), __vite__mapDeps([15,1,2,3,4,6,13])));
var ResetPassword = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/auth-2tAwxGR9.js").then((mod) => ({ default: mod.ResetPassword })), __vite__mapDeps([15,1,2,3,4,6,13])));
var Dashboard = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Dashboard-cIeApP3G.js"), __vite__mapDeps([16,1,2,3,4,17,18,12])));
var Feed = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Feed-5Cn11sP-.js"), __vite__mapDeps([19,1,2,20,3,17,4,18,8,10,11,12,14])));
var Stories = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Stories-Miqmwe47.js"), __vite__mapDeps([21,1,2,3,17,4,18,9,12])));
var Reels = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Reels-Cmw8OlTs.js"), __vite__mapDeps([22,1,2,3,17,4,18,8,23,14])));
var Groups = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Groups-oRBCvyw-.js"), __vite__mapDeps([24,1,2,3,7,17,4,18,12,14])));
var Live = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Live-DicPywTX.js"), __vite__mapDeps([25,1,2,3,17,4,18,12,14])));
var Inbox = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/chat-QszTyEwN.js").then((mod) => ({ default: mod.Inbox })), __vite__mapDeps([26,1,2,20,3,17,4,18,10,12])));
var Users = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Users-2XOtGngm.js"), __vite__mapDeps([27,1,2,20,3,5,17,4,18,23,10,11,12,13,14])));
var Profile = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Profile-DXdRphAk.js"), __vite__mapDeps([28,1,2,3,17,4,18,23,12,14])));
var Chat = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/chat-QszTyEwN.js").then((mod) => ({ default: mod.Chat })), __vite__mapDeps([26,1,2,20,3,17,4,18,10,12])));
var Notifications = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/notifications-L23V4jVY.js").then((mod) => ({ default: mod.Notifications })), __vite__mapDeps([29,1,2,3,17,4,18,12,14])));
var Search = (0, import_react.lazy)(() => __vitePreload(() => import("./chunks/Search-CRemi6_Q.js"), __vite__mapDeps([30,1,2,20,3,17,4,18,10,11,12,13])));
function AppGuards() {
	useNetworkStatus();
	useSessionGuard();
	useOfflineQueue();
	usePageAnalytics();
	useChatRealtime();
	const theme = useAppStore((state) => state.theme);
	const language = useAppStore((state) => state.language);
	const activeRequests = useAppStore((state) => state.activeRequests);
	(0, import_react.useEffect)(() => {
		document.documentElement.dataset.theme = theme;
		document.documentElement.style.colorScheme = theme;
	}, [theme]);
	(0, import_react.useEffect)(() => {
		document.documentElement.setAttribute("lang", language);
		document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
	}, [language]);
	(0, import_react.useEffect)(() => {
		const timers = /* @__PURE__ */ new WeakMap();
		const clickableSelector = "button, a.btn, .mini-action, .ghost-btn, .reaction-btn, .table-link, .story-user-card";
		const handlePointerFeedback = (event) => {
			const target = event.target instanceof Element ? event.target.closest(clickableSelector) : null;
			if (!target) return;
			if (target.matches?.(":disabled") || target.getAttribute("aria-disabled") === "true" || target.getAttribute("aria-busy") === "true" || target.dataset.busy === "true") return;
			target.dataset.autoBusy = "true";
			const activeTimer = timers.get(target);
			if (activeTimer) window.clearTimeout(activeTimer);
			const nextTimer = window.setTimeout(() => {
				delete target.dataset.autoBusy;
			}, 650);
			timers.set(target, nextTimer);
		};
		document.addEventListener("click", handlePointerFeedback, true);
		return () => {
			document.removeEventListener("click", handlePointerFeedback, true);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppStatusBanner, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallPrompt, {}),
		activeRequests > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "global-progress-bar" }) : null
	] });
}
function RouteFallback() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoutePageSkeleton, {});
}
function App() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppErrorBoundary, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppGuards, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
		fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouteFallback, {}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Routes, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/login",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Login, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/register",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Register, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/verify-email",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerifyEmail, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/forgot-password",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForgotPassword, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/reset-password",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResetPassword, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
					to: "/admin/login",
					replace: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/login",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLogin, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/register",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
					to: "/register",
					replace: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feed, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/dashboard",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/stories",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stories, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/reels",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reels, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/groups",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Groups, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/live",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Live, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/inbox",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/users",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/profile",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Profile, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/notifications",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notifications, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/search",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/profile/:username",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Profile, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/chat",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chat, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/chat/:userId",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chat, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/dashboard",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "dashboard.view",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminDashboard, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/users",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "users.view",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminUsers, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/rbac",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "rbac.view",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminRbac, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/posts",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "posts.view",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminPosts, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/content",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
					to: "/admin/posts",
					replace: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/notifications",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "notifications.manage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminNotifications, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/live",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "live.manage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLive, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/reports",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "reports.view",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminReports, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/settings",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, {
					requiredPermission: "settings.manage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminSettings, {})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/chat",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminChat, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/stories",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminStories, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/reels",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminReels, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "/admin/groups",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProtectedRoute, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminGroups, {}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Route, {
				path: "*",
				element: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
					to: "/",
					replace: true
				})
			})
		] })
	})] }) });
}
//#endregion
//#region src/lib/queryClient.js
var queryClient = new QueryClient({ defaultOptions: {
	queries: {
		staleTime: 6e4,
		gcTime: 10 * 6e4,
		retry: (failureCount, error) => {
			const status = error?.response?.status;
			if ([
				400,
				401,
				403,
				404,
				422
			].includes(status)) return false;
			return failureCount < 2;
		},
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		refetchInterval: false,
		networkMode: "offlineFirst",
		structuralSharing: true
	},
	mutations: {
		retry: 1,
		networkMode: "offlineFirst"
	}
} });
//#endregion
//#region src/realtime/RealtimeProvider.jsx
var RealtimeContext = (0, import_react.createContext)({
	socket: socket_default,
	connected: false,
	socketId: ""
});
function redirectToLogin() {
	if (typeof window === "undefined") return;
	redirectToAppPath(getCurrentAppPathname().startsWith("/admin") ? "/admin/login" : "/login");
}
function RealtimeProvider({ children }) {
	const session = useAppStore((state) => state.session);
	const [connected, setConnected] = (0, import_react.useState)(socket_default.connected);
	const [socketId, setSocketId] = (0, import_react.useState)(socket_default.id || "");
	(0, import_react.useEffect)(() => {
		const handleConnect = () => {
			setConnected(true);
			setSocketId(socket_default.id || "");
		};
		const handleDisconnect = () => {
			setConnected(false);
			setSocketId("");
		};
		const handleAuthExpired = () => {
			logger.warn("realtime auth expired, clearing session");
			clearStoredUser();
			redirectToLogin();
		};
		const disposeConnect = socket_default.on("connect", handleConnect);
		const disposeDisconnect = socket_default.on("disconnect", handleDisconnect);
		const disposeAuthExpired = socket_default.on("auth_expired", handleAuthExpired);
		return () => {
			disposeConnect?.();
			disposeDisconnect?.();
			disposeAuthExpired?.();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (session?.access_token || session?.token) {
			socket_default.syncAuth();
			socket_default.connect();
			return;
		}
		socket_default.disconnect();
	}, [
		session?.access_token,
		session?.token,
		session?.username,
		session?.role
	]);
	const value = (0, import_react.useMemo)(() => ({
		socket: socket_default,
		connected,
		socketId
	}), [connected, socketId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RealtimeContext.Provider, {
		value,
		children
	});
}
//#endregion
//#region src/utils/performance.js
var initialized$1 = false;
function canUseWindow() {
	return typeof window !== "undefined";
}
function perfStore() {
	if (!canUseWindow()) return null;
	if (!window.__YAMSHAT_PERF__) window.__YAMSHAT_PERF__ = {
		metrics: [],
		longTasks: 0,
		lastMemorySample: null,
		startedAt: Date.now()
	};
	return window.__YAMSHAT_PERF__;
}
function pushMetric(metric) {
	const store = perfStore();
	if (!store || !featureFlags.performanceMetrics) return;
	store.metrics.push({
		...metric,
		recordedAt: (/* @__PURE__ */ new Date()).toISOString()
	});
	if (store.metrics.length > 40) store.metrics.splice(0, store.metrics.length - 40);
	window.dispatchEvent(new CustomEvent("yamshat:performance-metric", { detail: metric }));
}
function observePerformanceEntries() {
	if (!canUseWindow() || typeof PerformanceObserver === "undefined" || !featureFlags.performanceMetrics) return;
	const safeObserve = (type, handler) => {
		try {
			new PerformanceObserver((list) => handler(list.getEntries())).observe({
				type,
				buffered: true
			});
		} catch {}
	};
	safeObserve("largest-contentful-paint", (entries) => {
		const entry = entries.at(-1);
		if (entry) pushMetric({
			type: "lcp",
			value: Math.round(entry.startTime)
		});
	});
	safeObserve("layout-shift", (entries) => {
		let score = 0;
		entries.forEach((entry) => {
			if (!entry.hadRecentInput) score += entry.value || 0;
		});
		if (score > 0) pushMetric({
			type: "cls",
			value: Number(score.toFixed(4))
		});
	});
	safeObserve("longtask", (entries) => {
		const total = entries.reduce((sum, entry) => sum + Math.round(entry.duration || 0), 0);
		const store = perfStore();
		if (store) store.longTasks += entries.length;
		if (entries.length) pushMetric({
			type: "longtask",
			value: total,
			count: entries.length
		});
	});
}
function sampleMemory() {
	if (!canUseWindow() || !featureFlags.performanceMetrics) return;
	const store = perfStore();
	const memory = window.performance?.memory;
	if (!store || !memory) return;
	store.lastMemorySample = {
		usedJSHeapSize: memory.usedJSHeapSize,
		totalJSHeapSize: memory.totalJSHeapSize,
		jsHeapSizeLimit: memory.jsHeapSizeLimit,
		recordedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * .8) {
		console.warn("[Performance] Memory usage critical. Triggering emergency cleanup.");
		window.dispatchEvent(new CustomEvent("yamshat:memory-critical"));
	}
}
function ensurePreconnect(url) {
	if (!canUseWindow()) return;
	const value = String(url || "").trim();
	if (!/^https?:\/\//i.test(value)) return;
	if (document.head.querySelector(`link[data-preconnect="${value}"]`)) return;
	const link = document.createElement("link");
	link.rel = "preconnect";
	link.href = value;
	link.crossOrigin = "anonymous";
	link.dataset.preconnect = value;
	document.head.appendChild(link);
}
function initializePerformanceToolkit({ registration = null } = {}) {
	if (initialized$1 || !canUseWindow()) return;
	initialized$1 = true;
	ensurePreconnect(BACKEND_ORIGIN);
	ensurePreconnect(CDN_BASE);
	observePerformanceEntries();
	sampleMemory();
	window.setInterval(sampleMemory, 6e4);
}
//#endregion
//#region src/utils/runtimeErrors.js
var initialized = false;
function report(kind, payload = {}) {
	if (!featureFlags.frontendLogging) return;
	logger.error(`frontend runtime ${kind}`, payload);
}
function initializeRuntimeErrorCapture() {
	if (initialized || typeof window === "undefined") return;
	initialized = true;
	window.addEventListener("error", (event) => {
		report("error", {
			message: event?.message,
			filename: event?.filename,
			lineno: event?.lineno,
			colno: event?.colno,
			stack: event?.error?.stack
		});
	});
	window.addEventListener("unhandledrejection", (event) => {
		report("unhandledrejection", {
			reason: event?.reason?.message || String(event?.reason || ""),
			stack: event?.reason?.stack
		});
	});
}
//#endregion
//#region src/main.jsx
if (typeof window !== "undefined") {
	window.__YAMSHAT_SW_READY__ = Promise.resolve(null);
	initializePerformanceToolkit();
	initializeRuntimeErrorCapture();
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		useAppStore.getState().setInstallPrompt(event);
	});
	window.addEventListener("appinstalled", () => {
		useAppStore.getState().clearInstallPrompt();
	});
	if ("serviceWorker" in navigator) window.addEventListener("load", () => {
		window.__YAMSHAT_SW_READY__ = navigator.serviceWorker.register("/sw.js").then((registration) => {
			initializePerformanceToolkit({ registration });
			return registration;
		}).catch(() => null);
	});
}
import_client.createRoot(document.getElementById("root")).render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.StrictMode, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
	client: queryClient,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashRouter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RealtimeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {}) }) })
}) }));
//#endregion
export { useAppStore as A, useToast as C, getStoredUser as D, getCurrentUsername as E, getDefaultPostLoginPath as F, isPrimaryAdminSession as I, useChatStore as M, logger as N, hasPermission as O, PRIMARY_ADMIN_EMAIL as P, Button as S, getAuthToken as T, socketManager as _, markMessagesSeen as a, ListSkeleton as b, unblockUserApi as c, DISAPPEARING_MESSAGE_OPTIONS as d, currentMediaProviderLabel as f, socket_default as g, redirectToAppPath as h, getMessages as i, selectUnreadTotal as j, setStoredUser as k, uploadMediaWithResume as l, API as m, deleteMessageApi as n, restoreMessage as o, resolveMediaUrl as p, getChatThreads as r, sendMessageApi as s, blockUserApi as t, mediaUploadService as u, AdminOverviewSkeleton as v, clearStoredUser as w, TableSkeleton as x, DashboardSkeleton as y };
