import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { J as useLocation, it as require_react } from "./vendor-9lSzsY2K.js";
import { n as Link, r as NavLink } from "./vendor-react-BET-OF9-.js";
import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { t as create } from "./vendor-state-DVSFIWCx.js";
import { C as useChatStore, S as selectUnreadTotal, _ as getCurrentUsername, c as socket_default, g as getAuthToken, o as API, s as redirectToAppPath, x as useAppStore } from "../index-dyGfSAus.js";
//#region src/utils/i18n.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var UI_TEXT = {
	ar: {
		brandSubtitle: "واجهة اجتماعية منظمة مع شريط علوي وسفلي متناسق وربط حي بالخدمات.",
		routeMeta: {
			"/": {
				title: "الرئيسية",
				note: "المنشورات فقط مع مساحة أوسع للمحتوى وتنقل أوضح."
			},
			"/dashboard": {
				title: "القائمة والإعدادات",
				note: "اللغة، السمات، الاختبارات، وروابط الخدمات."
			},
			"/users": {
				title: "المستخدمون",
				note: "اكتشف المستخدمين وابدأ دردشة أو متابعة مباشرة."
			},
			"/profile": {
				title: "الملف الشخصي",
				note: "إعدادات الحساب، اللغة، والمنشورات الشخصية."
			},
			"/inbox": {
				title: "المحادثات",
				note: "صندوق وارد منظم للمحادثات الخاصة."
			},
			"/stories": {
				title: "القصص",
				note: "ستوري منفصل سريع وخفيف."
			},
			"/reels": {
				title: "الريلز",
				note: "فيديوهات قصيرة في صفحة مستقلة."
			},
			"/groups": {
				title: "المجموعات",
				note: "المجتمعات والنقاشات في شاشة مستقلة."
			},
			"/live": {
				title: "البث المباشر",
				note: "البث والتفاعل المباشر وغرف المشاهدة."
			},
			"/notifications": {
				title: "الإشعارات",
				note: "تنبيهات مرتبة حسب النوع والزمن."
			}
		},
		topbarFallback: {
			title: "YAMSHAT",
			note: "منصة اجتماعية عربية بواجهة أكثر احترافية."
		},
		nav: {
			home: "الرئيسية",
			reels: "الريلز",
			live: "مباشر",
			inbox: "الدردشة",
			notifications: "الإشعارات",
			users: "المستخدمون",
			groups: "المجموعات",
			stories: "القصص",
			profile: "الملف الشخصي",
			dashboard: "القائمة",
			publish: "نشر"
		},
		navMeta: {
			home: "المنشورات",
			reels: "فيديوهات قصيرة",
			live: "غرف مباشرة",
			inbox: "الرسائل",
			notifications: "تنبيهات",
			users: "متابعة وتواصل",
			groups: "مجتمعات",
			stories: "لحظات سريعة",
			profile: "حسابك",
			dashboard: "إعدادات"
		},
		dashboard: {
			title: "إعدادات + اختبارات + روابط سريعة",
			description: "مركز موحد للإعدادات السريعة وتخصيص اللغة والتنقل الاحترافي.",
			languageLabel: "لغة الواجهة",
			languageHint: "تمت إضافة الإنجليزية إلى إعدادات الويب وحفظها في قاعدة البيانات.",
			translationLabel: "ترجمة الرسائل",
			translationHint: "تفعيل ترجمة سريعة داخل الدردشة للرسائل النصية.",
			save: "حفظ الإعدادات",
			saving: "جارٍ الحفظ...",
			languageSaved: "تم حفظ اللغة والإعدادات بنجاح."
		},
		chat: {
			audioCall: "مكالمة صوتية",
			videoCall: "مكالمة مرئية",
			block: "حظر",
			unblock: "إلغاء الحظر",
			translate: "ترجمة",
			translatedToEnglish: "مترجمة إلى الإنجليزية",
			translatedToArabic: "مترجمة إلى العربية",
			incomingAudio: "مكالمة صوتية واردة",
			incomingVideo: "مكالمة مرئية واردة",
			accept: "رد",
			decline: "رفض",
			hangup: "إنهاء المكالمة",
			preparingCall: "جارٍ تجهيز المكالمة...",
			blockedByMe: "تم حظر هذا المستخدم. يمكنك إلغاء الحظر لاستكمال الدردشة والمكالمات.",
			blockedMe: "هذا المستخدم قام بحظرك. تم تعطيل الإرسال والمكالمات.",
			translatorOff: "فعّل ترجمة الرسائل من صفحة الإعدادات أولاً.",
			callFallback: "تم إنشاء جلسة المكالمة لكن خدمة الصوت/الفيديو غير مفعلة حالياً على الخادم."
		}
	},
	en: {
		brandSubtitle: "Organized social interface with polished top and bottom navigation.",
		routeMeta: {
			"/": {
				title: "Home",
				note: "Posts only with wider content space and cleaner navigation."
			},
			"/dashboard": {
				title: "Menu & Settings",
				note: "Language, theme, readiness checks, and service links."
			},
			"/users": {
				title: "Users",
				note: "Discover people and start chats or follows quickly."
			},
			"/profile": {
				title: "Profile",
				note: "Account settings, language, and personal posts."
			},
			"/inbox": {
				title: "Inbox",
				note: "A cleaner private messaging hub."
			},
			"/stories": {
				title: "Stories",
				note: "A standalone fast stories page."
			},
			"/reels": {
				title: "Reels",
				note: "Short-form videos in a dedicated page."
			},
			"/groups": {
				title: "Groups",
				note: "Communities and discussions in their own screen."
			},
			"/live": {
				title: "Live",
				note: "Live rooms, audience activity, and streaming tools."
			},
			"/notifications": {
				title: "Notifications",
				note: "Alerts organized by type and time."
			}
		},
		topbarFallback: {
			title: "YAMSHAT",
			note: "A more professional social experience."
		},
		nav: {
			home: "Home",
			reels: "Reels",
			live: "Live",
			inbox: "Chat",
			notifications: "Alerts",
			users: "Users",
			groups: "Groups",
			stories: "Stories",
			profile: "Profile",
			dashboard: "Menu",
			publish: "Post"
		},
		navMeta: {
			home: "Posts",
			reels: "Short videos",
			live: "Live rooms",
			inbox: "Messages",
			notifications: "Updates",
			users: "People",
			groups: "Communities",
			stories: "Moments",
			profile: "Your account",
			dashboard: "Settings"
		},
		dashboard: {
			title: "Settings + checks + quick links",
			description: "A unified settings center with language control and cleaner navigation.",
			languageLabel: "Interface language",
			languageHint: "English is now available in web settings and saved to the database.",
			translationLabel: "Message translation",
			translationHint: "Enable quick in-chat translation for text messages.",
			save: "Save settings",
			saving: "Saving...",
			languageSaved: "Language and preferences saved successfully."
		},
		chat: {
			audioCall: "Audio call",
			videoCall: "Video call",
			block: "Block",
			unblock: "Unblock",
			translate: "Translate",
			translatedToEnglish: "Translated to English",
			translatedToArabic: "Translated to Arabic",
			incomingAudio: "Incoming audio call",
			incomingVideo: "Incoming video call",
			accept: "Answer",
			decline: "Decline",
			hangup: "End call",
			preparingCall: "Preparing call...",
			blockedByMe: "You blocked this user. Unblock to continue chat and calls.",
			blockedMe: "This user blocked you. Messaging and calls are disabled.",
			translatorOff: "Enable message translation first from settings.",
			callFallback: "The call session was created but realtime media is not enabled on the server."
		}
	}
};
function getUiText(language = "ar") {
	return UI_TEXT[language] || UI_TEXT.ar;
}
//#endregion
//#region src/components/layout/Sidebar.jsx
var import_jsx_runtime = require_jsx_runtime();
function Sidebar() {
	const language = useAppStore((state) => state.language);
	const ui = getUiText(language);
	const unreadInboxCount = useChatStore(selectUnreadTotal);
	const links = [
		{
			to: "/",
			label: ui.nav.home,
			meta: ui.navMeta.home,
			icon: "⌂"
		},
		{
			to: "/reels",
			label: ui.nav.reels,
			meta: ui.navMeta.reels,
			icon: "▣"
		},
		{
			to: "/live",
			label: ui.nav.live,
			meta: ui.navMeta.live,
			icon: "◉"
		},
		{
			to: "/inbox",
			label: ui.nav.inbox,
			meta: ui.navMeta.inbox,
			icon: "✉"
		},
		{
			to: "/notifications",
			label: ui.nav.notifications,
			meta: ui.navMeta.notifications,
			icon: "🔔"
		},
		{
			to: "/users",
			label: ui.nav.users,
			meta: ui.navMeta.users,
			icon: "◎"
		},
		{
			to: "/groups",
			label: ui.nav.groups,
			meta: ui.navMeta.groups,
			icon: "◍"
		},
		{
			to: "/stories",
			label: ui.nav.stories,
			meta: ui.navMeta.stories,
			icon: "◌"
		},
		{
			to: "/profile",
			label: ui.nav.profile,
			meta: ui.navMeta.profile,
			icon: "◌"
		},
		{
			to: "/dashboard",
			label: ui.nav.dashboard,
			meta: ui.navMeta.dashboard,
			icon: "☰"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "sidebar yamshat-sidebar",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sidebar-top",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brand-stack brand-stack-rich",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "brand-mark brand-mark-image",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/brand/yamshat-logo.jpg",
							alt: "Yamshat",
							className: "brand-logo-img"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "brand-title",
						children: "YAMSHAT"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "brand-subtitle",
						children: ui.brandSubtitle
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sidebar-highlight card sidebar-highlight-rich",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "page-eyebrow",
							children: "Yamshat UI"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: language === "en" ? "Posts · Reels · Live · Chat" : "المنشورات · الريلز · البث · الدردشة" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "muted no-margin",
							children: language === "en" ? "Every service now has its own page with cleaner top and bottom navigation." : "كل خدمة الآن في صفحة مستقلة مع شريط علوي وسفلي أكثر توازناً."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "nav-links",
				children: links.map((link) => {
					const badge = link.to === "/inbox" ? unreadInboxCount : 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NavLink, {
						to: link.to,
						className: ({ isActive }) => `nav-link ${isActive ? "active" : ""}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "nav-link-icon",
								children: link.icon
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "nav-link-copy",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: link.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: link.meta })]
							}),
							badge > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "topbar-badge",
								children: badge
							}) : null
						]
					}, link.to);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sidebar-footer sidebar-footer-rich",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "glass-chip",
						children: "DB linked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "glass-chip",
						children: "Top bar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "glass-chip",
						children: "Bottom bar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/login",
						className: "glass-chip admin-entry-chip",
						children: "Admin"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/api/notifications.js
var getNotifications = (limit = 50) => API.get("/notifications", {
	params: { limit },
	cache: true,
	cacheTtlMs: 2e4
});
//#endregion
//#region src/utils/notificationCenter.js
var shownNotificationIds = /* @__PURE__ */ new Set();
function resolveNotificationPath(notification) {
	const payload = notification?.payload || notification?.data || {};
	if (typeof payload?.path === "string" && payload.path.trim()) return payload.path.trim();
	if (typeof notification?.path === "string" && notification.path.trim()) return notification.path.trim();
	const screen = String(payload?.screen || notification?.screen || "").toLowerCase();
	if (screen === "chat") return "/inbox";
	if (screen === "notifications") return "/notifications";
	if (screen === "live") return "/live";
	if (screen === "groups") return "/groups";
	if (screen === "users") return "/users";
	if (screen === "profile") {
		const username = payload?.username || payload?.target_username || notification?.username;
		return username ? `/profile/${encodeURIComponent(username)}` : "/profile";
	}
	return "/notifications";
}
function normalizeNotification(item) {
	if (!item) return {
		id: "temp-empty",
		title: "إشعار",
		body: "لا توجد بيانات متاحة.",
		seen: true,
		created_at: null,
		payload: {},
		path: "/notifications"
	};
	const payload = item?.payload || item?.data || {};
	const title = item?.title || payload?.title || "إشعار جديد";
	const body = item?.body || item?.message || item?.text || payload?.body || "وصلك تحديث جديد داخل يمشات.";
	const seen = Boolean(item?.seen ?? item?.is_read ?? item?.read);
	return {
		...item,
		id: item?.id || `${title}-${body}-${item?.created_at || Date.now()}`,
		title,
		body,
		seen,
		payload,
		path: resolveNotificationPath({
			...item,
			payload
		})
	};
}
function browserNotificationsSupported() {
	return typeof window !== "undefined" && "Notification" in window;
}
async function serviceWorkerNotification(notification) {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
	await (await navigator.serviceWorker.ready).showNotification(notification.title, {
		body: notification.body,
		icon: "/icons/icon-192.png",
		badge: "/icons/icon-192.png",
		tag: `yamshat:${notification.id}`,
		data: {
			path: notification.path,
			notification
		}
	});
	return true;
}
async function maybeShowBrowserNotification(item) {
	if (!browserNotificationsSupported()) return false;
	if (document.visibilityState === "visible") return false;
	if (window.Notification.permission !== "granted") return false;
	const notification = normalizeNotification(item);
	if (shownNotificationIds.has(String(notification.id))) return false;
	shownNotificationIds.add(String(notification.id));
	try {
		await serviceWorkerNotification(notification);
		return true;
	} catch {
		const native = new window.Notification(notification.title, {
			body: notification.body,
			icon: "/icons/icon-192.png",
			tag: `yamshat:${notification.id}`,
			data: { path: notification.path }
		});
		native.onclick = () => {
			window.focus();
			redirectToAppPath(notification.path || "/notifications", { replace: false });
			native.close();
		};
		return true;
	}
}
//#endregion
//#region src/store/notificationStore.js
var STORAGE_KEY = "yamshat_notifications";
var BATCH_DELAY_MS = 300;
var CACHE_TTL_MS = 300 * 1e3;
var MAX_STORED_NOTIFICATIONS = 500;
/**
* Sorts notifications by creation date (newest first)
*/
function sortNotifications(items = []) {
	return [...items].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
}
/**
* Loads notifications from localStorage with TTL validation
*/
function loadFromStorage() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		const { items, timestamp } = JSON.parse(stored);
		if (Date.now() - timestamp > CACHE_TTL_MS) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return items || [];
	} catch (error) {
		console.warn("Failed to load notifications from storage:", error);
		return null;
	}
}
/**
* Saves notifications to localStorage with timestamp
*/
function saveToStorage(items) {
	try {
		const limited = items.slice(0, MAX_STORED_NOTIFICATIONS);
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			items: limited,
			timestamp: Date.now()
		}));
	} catch (error) {
		console.warn("Failed to save notifications to storage:", error);
	}
}
/**
* Deduplicates notifications in real-time using Map
*/
function deduplicateNotifications(items = []) {
	const map = /* @__PURE__ */ new Map();
	items.forEach((item) => {
		const normalized = normalizeNotification(item);
		const key = String(normalized.id);
		const existing = map.get(key);
		if (existing) map.set(key, {
			...existing,
			...normalized,
			seen: existing.seen || normalized.seen,
			is_read: existing.is_read || normalized.is_read
		});
		else map.set(key, normalized);
	});
	return [...map.values()];
}
var useNotificationStore = create((set, get) => {
	let batchTimer = null;
	let pendingBatch = [];
	/**
	* Processes batched notifications
	*/
	const processBatch = () => {
		if (pendingBatch.length === 0) return;
		set((state) => {
			const sorted = sortNotifications(deduplicateNotifications([...state.items, ...pendingBatch]));
			saveToStorage(sorted);
			return {
				items: sorted,
				initialized: true,
				error: ""
			};
		});
		pendingBatch = [];
	};
	/**
	* Schedules a batch update with debouncing
	*/
	const scheduleBatch = () => {
		if (batchTimer) clearTimeout(batchTimer);
		batchTimer = setTimeout(processBatch, BATCH_DELAY_MS);
	};
	return {
		initialized: false,
		loading: false,
		error: "",
		items: [],
		cacheTimestamp: null,
		/**
		* Sets loading state
		*/
		setLoading: (loading) => set({ loading: Boolean(loading) }),
		/**
		* Sets error state
		*/
		setError: (error = "") => set({ error }),
		/**
		* Hydrates notifications from API with deduplication and persistence
		*/
		hydrateNotifications: (items = [], options = {}) => set((state) => {
			const replace = options.replace !== false;
			let allItems = [];
			if (!replace) allItems = [...state.items, ...items];
			else allItems = items;
			const sorted = sortNotifications(deduplicateNotifications(allItems));
			saveToStorage(sorted);
			return {
				items: sorted,
				initialized: true,
				error: "",
				cacheTimestamp: Date.now()
			};
		}),
		/**
		* Adds a single notification with batching
		*/
		upsertNotification: (item) => {
			pendingBatch.push(item);
			scheduleBatch();
		},
		/**
		* Adds multiple notifications with batching
		*/
		upsertNotifications: (items = []) => {
			pendingBatch.push(...items);
			scheduleBatch();
		},
		/**
		* Marks a single notification as read
		*/
		markRead: (notificationId, nextValues = {}) => set((state) => {
			const updated = state.items.map((item) => String(item.id) === String(notificationId) ? normalizeNotification({
				...item,
				...nextValues,
				seen: true,
				is_read: true
			}) : item);
			saveToStorage(updated);
			return { items: updated };
		}),
		/**
		* Marks all notifications as read
		*/
		markAllRead: () => set((state) => {
			const updated = state.items.map((item) => normalizeNotification({
				...item,
				seen: true,
				is_read: true
			}));
			saveToStorage(updated);
			return { items: updated };
		}),
		/**
		* Removes a notification
		*/
		removeNotification: (notificationId) => set((state) => {
			const updated = state.items.filter((item) => String(item.id) !== String(notificationId));
			saveToStorage(updated);
			return { items: updated };
		}),
		/**
		* Clears all notifications
		*/
		clearAll: () => set(() => {
			localStorage.removeItem(STORAGE_KEY);
			return {
				items: [],
				initialized: true
			};
		}),
		/**
		* Restores notifications from storage
		*/
		restoreFromStorage: () => set(() => {
			return {
				items: loadFromStorage() || [],
				initialized: true,
				cacheTimestamp: Date.now()
			};
		}),
		/**
		* Gets cache validity status
		*/
		isCacheValid: () => {
			const state = get();
			if (!state.cacheTimestamp) return false;
			return Date.now() - state.cacheTimestamp < CACHE_TTL_MS;
		},
		/**
		* Invalidates cache
		*/
		invalidateCache: () => set({ cacheTimestamp: null })
	};
});
/**
* Selector for unread notifications count
*/
function selectUnreadNotificationsCount(state) {
	return (state.items || []).filter((item) => !item?.seen).length;
}
//#endregion
//#region src/components/layout/Topbar.jsx
function Topbar() {
	const location = useLocation();
	const token = getAuthToken();
	const currentUsername = getCurrentUsername();
	const language = useAppStore((state) => state.language);
	const ui = getUiText(language);
	const unreadCount = useNotificationStore(selectUnreadNotificationsCount);
	const notificationsInitialized = useNotificationStore((state) => state.initialized);
	const hydrateNotifications = useNotificationStore((state) => state.hydrateNotifications);
	const upsertNotification = useNotificationStore((state) => state.upsertNotification);
	const unreadInboxCount = useChatStore(selectUnreadTotal);
	const pageMeta = (0, import_react.useMemo)(() => {
		if (location.pathname.startsWith("/chat/")) return language === "en" ? {
			title: "Conversation",
			note: "Private chat with live status, translation, and call shortcuts."
		} : {
			title: "المحادثة",
			note: "دردشة خاصة مع حالة اتصال وترجمة ومكالمات سريعة."
		};
		if (location.pathname.startsWith("/profile/")) return language === "en" ? {
			title: "User profile",
			note: "View account details and connected posts in a separate page."
		} : {
			title: "ملف المستخدم",
			note: "استعراض الحساب ومنشوراته في صفحة مستقلة."
		};
		return ui.routeMeta[location.pathname] || ui.topbarFallback;
	}, [
		language,
		location.pathname,
		ui
	]);
	(0, import_react.useEffect)(() => {
		if (!currentUsername) return void 0;
		let active = true;
		const loadNotifications = async () => {
			if (notificationsInitialized) return;
			try {
				const { data } = await getNotifications();
				if (!active) return;
				hydrateNotifications(Array.isArray(data) ? data : [], { replace: true });
			} catch {
				if (active) hydrateNotifications([], { replace: true });
			}
		};
		loadNotifications();
		if (!socket_default.connected) socket_default.connect();
		socket_default.emit("register_user", {
			token,
			user: currentUsername
		});
		const handleNotification = (incoming) => {
			if (!active) return;
			upsertNotification(incoming);
			maybeShowBrowserNotification(incoming).catch(() => null);
		};
		socket_default.on("new_notification", handleNotification);
		return () => {
			active = false;
			socket_default.off("new_notification", handleNotification);
		};
	}, [
		currentUsername,
		hydrateNotifications,
		notificationsInitialized,
		token,
		upsertNotification
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "topbar yamshat-topbar compact-topbar topbar-app-like topbar-professional-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "topbar-brand-wrap",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "topbar-brand-link",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "topbar-brand-mark",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/brand/yamshat-logo.jpg",
						alt: "Yamshat",
						className: "brand-logo-img"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "topbar-brand-copy",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "page-eyebrow",
						children: "YAMSHAT"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: pageMeta.title })]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "muted no-margin topbar-page-note",
				children: pageMeta.note
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "topbar-route-actions topbar-actions-rich topbar-actions-equal",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/notifications",
					className: "topbar-icon-link topbar-badge-link",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "🔔"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ui.nav.notifications }),
						unreadCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "topbar-badge",
							children: unreadCount
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/reels",
					className: "topbar-icon-link",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						children: "🎬"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ui.nav.reels })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/live",
					className: "topbar-icon-link topbar-primary-action",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						children: "🔴"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ui.nav.live })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/inbox",
					className: "topbar-icon-link topbar-badge-link",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "💬"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ui.nav.inbox }),
						unreadInboxCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "topbar-badge",
							children: unreadInboxCount
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/dashboard",
					className: "topbar-icon-link",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						children: "☰"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ui.nav.dashboard })]
				})
			]
		})]
	});
}
//#endregion
//#region src/components/layout/MobileDock.jsx
function MobileDock() {
	const language = useAppStore((state) => state.language);
	const ui = getUiText(language);
	const unreadInboxCount = useChatStore(selectUnreadTotal);
	const dockLinks = [
		{
			to: "/",
			label: ui.nav.home,
			icon: "⌂"
		},
		{
			to: "/reels",
			label: ui.nav.reels,
			icon: "▣"
		},
		{
			to: "/live",
			label: ui.nav.live,
			icon: "◉"
		},
		{
			to: "/inbox",
			label: ui.nav.inbox,
			icon: "✉"
		},
		{
			to: "/dashboard",
			label: ui.nav.dashboard,
			icon: "☰"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "mobile-dock mobile-dock-professional",
		"aria-label": language === "en" ? "Quick navigation" : "التنقل السريع",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mobile-dock-inner mobile-dock-grid-5 mobile-dock-balanced-grid",
			children: [
				dockLinks.slice(0, 2).map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NavLink, {
					to: link.to,
					className: ({ isActive }) => `mobile-dock-link ${isActive ? "active" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mobile-dock-icon",
						children: link.icon
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: link.label })]
				}, link.to)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: {
						pathname: "/",
						search: "?compose=1",
						hash: "#composer"
					},
					className: "mobile-dock-link mobile-dock-center",
					"aria-label": ui.nav.publish,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mobile-dock-icon",
						children: "＋"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ui.nav.publish })]
				}),
				dockLinks.slice(2).map((link) => {
					const badge = link.to === "/inbox" ? unreadInboxCount : 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NavLink, {
						to: link.to,
						className: ({ isActive }) => `mobile-dock-link ${isActive ? "active" : ""}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mobile-dock-icon",
								children: link.icon
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: link.label }),
							badge > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "topbar-badge",
								children: badge
							}) : null
						]
					}, link.to);
				})
			]
		})
	});
}
//#endregion
//#region src/utils/runtime.js
function isNativeShell() {
	try {
		return localStorage.getItem("yamshatNativeShell") === "1";
	} catch {
		return false;
	}
}
//#endregion
//#region src/components/layout/MainLayout.jsx
/**
* MainLayout Component
* Features: Transitions, Scroll restoration, Responsive polish, Adaptive navigation
*/
function MainLayout({ children }) {
	const nativeShell = isNativeShell();
	const mainRef = (0, import_react.useRef)(null);
	const [isTransitioning, setIsTransitioning] = (0, import_react.useState)(false);
	const [scrollPosition, setScrollPosition] = (0, import_react.useState)(0);
	const [isMobile, setIsMobile] = (0, import_react.useState)(window.innerWidth < 768);
	/**
	* Handles scroll restoration
	*/
	(0, import_react.useEffect)(() => {
		const handleScroll = () => {
			setScrollPosition(window.scrollY);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);
	/**
	* Restores scroll position on page navigation
	*/
	(0, import_react.useEffect)(() => {
		window.scrollTo(0, scrollPosition);
		setIsTransitioning(true);
		const timer = setTimeout(() => setIsTransitioning(false), 300);
		return () => clearTimeout(timer);
	}, [children]);
	/**
	* Handles responsive layout changes
	*/
	(0, import_react.useEffect)(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);
	/**
	* Handles page transitions
	*/
	const handlePageTransition = () => {
		setIsTransitioning(true);
		setTimeout(() => setIsTransitioning(false), 300);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `app-shell yamshat-shell ${nativeShell ? "native-shell" : ""}`,
		children: [
			!nativeShell && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, { onNavigate: handlePageTransition }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `main-shell ${nativeShell ? "native-shell" : ""}`,
				children: [!nativeShell && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Topbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: `page-content ${nativeShell ? "native-shell" : ""} ${isTransitioning ? "is-transitioning" : ""}`,
					ref: mainRef,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "page-shell-glow",
						children
					})
				})]
			}),
			!nativeShell && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileDock, { onNavigate: handlePageTransition }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: `
          /* App Shell */
          .app-shell {
            display: flex;
            height: 100vh;
            background: #ffffff;
            overflow: hidden;
          }

          .app-shell.native-shell {
            flex-direction: column;
          }

          /* Main Shell */
          .main-shell {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
          }

          .main-shell.native-shell {
            width: 100%;
          }

          /* Page Content */
          .page-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            transition: opacity 0.3s ease-out;
          }

          .page-content.is-transitioning {
            opacity: 0.95;
          }

          .page-content.native-shell {
            padding-bottom: 60px;
          }

          /* Page Shell Glow */
          .page-shell-glow {
            min-height: 100%;
            animation: fadeIn 0.3s ease-out;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .app-shell {
              flex-direction: column;
            }

            .main-shell {
              width: 100%;
            }

            .page-content {
              padding-bottom: 60px;
            }
          }

          /* Smooth scroll behavior */
          html {
            scroll-behavior: smooth;
          }

          /* Scrollbar styling */
          .page-content::-webkit-scrollbar {
            width: 8px;
          }

          .page-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .page-content::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }

          .page-content::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }

          /* Animations */
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideInUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideInDown {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .page-content,
            .page-shell-glow {
              animation: none;
              transition: none;
            }

            html {
              scroll-behavior: auto;
            }
          }

          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .app-shell {
              background: #111827;
            }

            .page-content::-webkit-scrollbar-thumb {
              background: #4b5563;
            }

            .page-content::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
            }
          }
        ` } })
		]
	});
}
//#endregion
export { getNotifications as n, MainLayout as t };
