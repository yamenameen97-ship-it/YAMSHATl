import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { X as useLocation, Z as useNavigate, ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as Link, r as NavLink } from "./vendor-react-D9YCW6KT.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { C as useToast, D as getStoredUser, P as PRIMARY_ADMIN_EMAIL, S as Button, T as getAuthToken, b as ListSkeleton, g as socket_default, i as getMessages, o as restoreMessage, r as getChatThreads, v as AdminOverviewSkeleton, w as clearStoredUser, x as TableSkeleton } from "../index-RNpBu_Fp.js";
import { _ as toggleShadowBan, a as changeAdminPassword, c as getAdminLiveOverview, d as getAdminPosts, f as getAdminRbac, g as searchAdmin, h as moderatePostAI, i as bulkUpdatePostStatus, l as getAdminNotifications, m as getAdminUsers, p as getAdminSettings, r as broadcastAdminNotification, s as endAdminLiveRoom, t as useDebouncedValue, u as getAdminOverview, v as updateAdminSettings, y as updateAdminUser } from "./useDebouncedValue-Bbubz4pq.js";
import { a as logoutUser } from "./auth-C2WvK0K6.js";
import { t as Card } from "./Card-TPneInOP.js";
import { t as Modal } from "./Modal-DHoVpNfV.js";
import { t as Input } from "./Input-BNYQZD5U.js";
import { t as EmptyState } from "./EmptyState-Co07m3O6.js";
import { t as ErrorState } from "./ErrorState-Xz3LP_u1.js";
import { a as toggleStoryHighlight, i as getStoryHighlights, n as getStoryAnalyticsSummary, r as getStoryArchive, s as viewStory, t as getStories } from "./stories-CYBJZ-UE.js";
import { a as getPosts } from "./posts-BHSunouz.js";
import { n as getGroups, r as joinGroup, t as createGroup } from "./groups-Dnulg_cN.js";
//#region src/components/admin/Breadcrumbs.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function Breadcrumbs({ items = [] }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "breadcrumbs",
		children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "breadcrumb-item",
			children: [item.to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: item.to,
				children: item.label
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.label }), index < items.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "breadcrumb-separator",
				children: "/"
			}) : null]
		}, `${item.label}-${index}`))
	});
}
//#endregion
//#region src/components/admin/AdminSidebar.jsx
var groups = [{
	title: "إدارة المحتوى",
	items: [
		{
			to: "/admin/dashboard",
			label: "لوحة التحكم",
			icon: "◈",
			permission: "dashboard.view"
		},
		{
			to: "/admin/posts",
			label: "المنشورات",
			icon: "✦",
			permission: "posts.view"
		},
		{
			to: "/admin/stories",
			label: "الستوري",
			icon: "◎",
			permission: "dashboard.view"
		},
		{
			to: "/admin/reels",
			label: "الريلز",
			icon: "▶",
			permission: "dashboard.view"
		},
		{
			to: "/admin/live",
			label: "البث المباشر",
			icon: "◉",
			permission: "live.manage",
			badge: "LIVE"
		},
		{
			to: "/admin/chat",
			label: "الشات",
			icon: "✉",
			permission: "dashboard.view"
		},
		{
			to: "/admin/groups",
			label: "المجموعات",
			icon: "◌",
			permission: "dashboard.view"
		}
	]
}, {
	title: "الإدارة",
	items: [
		{
			to: "/admin/users",
			label: "المستخدمون",
			icon: "◍",
			permission: "users.view"
		},
		{
			to: "/admin/rbac",
			label: "الصلاحيات",
			icon: "⌘",
			permission: "rbac.view"
		},
		{
			to: "/admin/notifications",
			label: "الإشعارات",
			icon: "◔",
			permission: "notifications.manage"
		},
		{
			to: "/admin/reports",
			label: "التقارير",
			icon: "▣",
			permission: "reports.view"
		},
		{
			to: "/admin/settings",
			label: "الإعدادات",
			icon: "⚙",
			permission: "settings.manage"
		}
	]
}];
function AdminSidebar({ collapsed, permissions = [], role = "user" }) {
	const isAllowed = (permission) => !permission || role === "admin" || permissions.includes(permission);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: `admin-sidebar admin-reference-sidebar ${collapsed ? "collapsed" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-brand admin-reference-brand",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "brand-logo brand-logo-reference",
					children: "YS"
				}), !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Yamshat Admin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "لوحة إدارة عربية احترافية" })] }) : null]
			}),
			!collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-sidebar-usercard",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "admin-sidebar-avatar",
						children: "A"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "المدير العام" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Super Admin" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "admin-sidebar-status",
						children: "متصل"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "admin-sidebar-scroll",
				children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-sidebar-group",
					children: [!collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "admin-sidebar-group-title",
						children: group.title
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "admin-nav admin-reference-nav",
						children: group.items.filter((item) => isAllowed(item.permission)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NavLink, {
							to: item.to,
							className: ({ isActive }) => `admin-nav-link admin-reference-link ${isActive ? "active" : ""}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "admin-nav-icon admin-reference-icon",
									children: item.icon
								}),
								!collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }) : null,
								!collapsed && item.badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
									className: "admin-nav-badge",
									children: item.badge
								}) : null
							]
						}, item.to))
					})]
				}, group.title))
			}),
			!collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sidebar-promo admin-reference-promo",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "badge",
					children: "واجهة محسّنة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "الرئيسية والصفحات الفرعية صارت أقرب لأسلوب المرجع الداكن: كروت إحصائية، جداول متابعة، وتقسيمات أوضح لإدارة الشات والستوري والبث والريلز والمجموعات." })]
			}) : null
		]
	});
}
//#endregion
//#region src/components/admin/AdminTopbar.jsx
function AdminTopbar({ title, onToggleSidebar, notifications = [] }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)({
		users: [],
		posts: []
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	const user = getStoredUser();
	const debouncedQuery = useDebouncedValue(query, 350);
	const unreadCount = (0, import_react.useMemo)(() => notifications.filter((item) => !item.is_read).length, [notifications]);
	(0, import_react.useEffect)(() => {
		let active = true;
		if (!debouncedQuery.trim()) {
			setResults({
				users: [],
				posts: []
			});
			return;
		}
		searchAdmin(debouncedQuery).then(({ data }) => {
			if (active) setResults(data || {
				users: [],
				posts: []
			});
		}).catch(() => {
			if (active) setResults({
				users: [],
				posts: []
			});
		});
		return () => {
			active = false;
		};
	}, [debouncedQuery]);
	const handleLogout = async () => {
		try {
			await logoutUser();
		} catch {}
		clearStoredUser();
		navigate("/login", { replace: true });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "admin-topbar admin-reference-topbar",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-topbar-search-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ghost-btn icon-btn admin-menu-toggle",
					onClick: onToggleSidebar,
					children: "☰"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-search-box admin-reference-search-box",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⌕" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: query,
							onChange: (event) => setQuery(event.target.value),
							placeholder: "بحث عن مستخدم، بث، منشور..."
						}),
						results.users.length || results.posts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "search-results-panel",
							children: [results.users.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "المستخدمون" }), results.users.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "search-result-item",
								onClick: () => navigate("/admin/users"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.username }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.role })]
							}, item.id))] }) : null, results.posts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "المنشورات" }), results.posts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "search-result-item",
								onClick: () => navigate("/admin/posts"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.username }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.content?.slice(0, 42) })]
							}, item.id))] }) : null]
						}) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "admin-topbar-meta-block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "page-eyebrow",
						children: "لوحة التحكم"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "page-title admin-reference-title",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "topbar-meta-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "live-pill",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot live-dot" }), "تحديث لحظي"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "deploy-pill",
							children: "واجهة RTL داكنة محسّنة"
						})]
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "topbar-controls admin-reference-controls",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ghost-btn notification-button admin-reference-utility",
						onClick: () => setOpen((prev) => !prev),
						children: ["🔔", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: unreadCount })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						className: "ghost-btn admin-reference-utility",
						to: "/admin/reports",
						children: "📈"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						className: "ghost-btn admin-reference-utility",
						to: "/admin/notifications",
						children: "✉"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "profile-pill admin-profile-pill admin-reference-profile",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "admin-reference-profile-avatar",
							children: (user?.username || "A").slice(0, 1).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: user?.username || "admin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: user?.role || "admin" })] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ghost-btn",
						onClick: handleLogout,
						children: "خروج"
					}),
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "notification-popover",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "notification-popover-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "آخر الإشعارات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/admin/notifications",
								children: "عرض الكل"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "notification-popover-list",
							children: [notifications.slice(0, 5).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "notification-popover-item",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.body })]
							}, item.id)), !notifications.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "empty-state compact",
								children: "لا توجد إشعارات حالياً."
							}) : null]
						})]
					}) : null
				]
			})
		]
	});
}
//#endregion
//#region src/components/admin/AdminLayout.jsx
var routeMeta = {
	"/admin/dashboard": {
		title: "لوحة التحكم",
		breadcrumb: ["الإدارة", "الرئيسية"]
	},
	"/admin/posts": {
		title: "إدارة المنشورات",
		breadcrumb: ["الإدارة", "المنشورات"]
	},
	"/admin/content": {
		title: "إدارة المنشورات",
		breadcrumb: ["الإدارة", "المنشورات"]
	},
	"/admin/chat": {
		title: "إدارة الشات",
		breadcrumb: ["الإدارة", "الشات"]
	},
	"/admin/stories": {
		title: "إدارة الستوري",
		breadcrumb: ["الإدارة", "الستوري"]
	},
	"/admin/reels": {
		title: "إدارة الريلز",
		breadcrumb: ["الإدارة", "الريلز"]
	},
	"/admin/groups": {
		title: "إدارة المجموعات",
		breadcrumb: ["الإدارة", "المجموعات"]
	},
	"/admin/live": {
		title: "إدارة البث المباشر",
		breadcrumb: ["الإدارة", "البث"]
	},
	"/admin/users": {
		title: "إدارة المستخدمين",
		breadcrumb: ["الإدارة", "المستخدمون"]
	},
	"/admin/rbac": {
		title: "الأدوار والصلاحيات",
		breadcrumb: ["الإدارة", "الصلاحيات"]
	},
	"/admin/notifications": {
		title: "الإشعارات",
		breadcrumb: ["الإدارة", "الإشعارات"]
	},
	"/admin/reports": {
		title: "التقارير والإحصائيات",
		breadcrumb: ["الإدارة", "التقارير"]
	},
	"/admin/settings": {
		title: "الإعدادات العامة",
		breadcrumb: ["الإدارة", "الإعدادات"]
	}
};
function AdminLayout({ children }) {
	const location = useLocation();
	const [collapsed, setCollapsed] = (0, import_react.useState)(false);
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const { pushToast } = useToast();
	const user = getStoredUser();
	const token = getAuthToken();
	const meta = routeMeta[location.pathname] || routeMeta["/admin/dashboard"];
	const breadcrumbs = (0, import_react.useMemo)(() => meta.breadcrumb.map((label, index) => ({
		label,
		to: index === meta.breadcrumb.length - 1 ? "" : "/admin/dashboard"
	})), [meta]);
	(0, import_react.useEffect)(() => {
		let active = true;
		const loadNotifications = async () => {
			try {
				const { data } = await getAdminNotifications(20);
				if (active) setNotifications(data?.items || []);
			} catch {
				if (active) setNotifications([]);
			}
		};
		loadNotifications();
		if (!socket_default.connected) socket_default.connect();
		socket_default.emit("register_user", {
			token,
			user: user?.username
		});
		const onAdminNotification = (payload) => {
			pushToast({
				title: payload?.title || "إشعار مباشر",
				description: payload?.body || "تم وصول تحديث جديد.",
				type: "info"
			});
			setNotifications((prev) => [{
				id: `${Date.now()}`,
				...payload,
				is_read: false
			}, ...prev].slice(0, 20));
		};
		const syncEvents = [
			"admin:user_updated",
			"admin:user_status_changed",
			"admin:user_deleted",
			"admin:post_created",
			"admin:post_updated",
			"admin:post_deleted",
			"admin:posts_bulk_deleted",
			"admin:live_updated"
		];
		socket_default.on("admin:notification", onAdminNotification);
		syncEvents.forEach((eventName) => socket_default.on(eventName, loadNotifications));
		return () => {
			active = false;
			socket_default.off("admin:notification", onAdminNotification);
			syncEvents.forEach((eventName) => socket_default.off(eventName, loadNotifications));
		};
	}, [
		pushToast,
		token,
		user?.username
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "admin-app-shell admin-reference-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminSidebar, {
			collapsed,
			permissions: user?.permissions || [],
			role: user?.role || "user"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "admin-main-shell",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminTopbar, {
				title: meta.title,
				onToggleSidebar: () => setCollapsed((prev) => !prev),
				notifications
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "admin-page-shell admin-reference-page-shell",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breadcrumbs, { items: breadcrumbs }), children]
			})]
		})]
	});
}
//#endregion
//#region src/components/admin/Charts.jsx
function buildPoints(data, width, height) {
	if (!data.length) return "";
	const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
	return data.map((item, index) => {
		return `${index / Math.max(data.length - 1, 1) * width},${height - (Number(item.value) || 0) / max * height}`;
	}).join(" ");
}
function LineChart({ data = [] }) {
	const width = 320;
	const height = 140;
	const points = buildPoints(data, width, height);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "chart-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${width} ${height + 16}`,
			className: "chart-svg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
				fill: "none",
				stroke: "url(#lineGradient)",
				strokeWidth: "4",
				points,
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "lineGradient",
				x1: "0",
				y1: "0",
				x2: "1",
				y2: "1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#8b5cf6"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#22d3ee"
				})]
			}) })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "chart-label-row",
			children: data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }, item.label))
		})]
	});
}
function BarChart({ data = [] }) {
	const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "bar-chart",
		children: data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bar-item",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bar-track",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bar-value",
						style: { height: `${Math.max((Number(item.value) || 0) / max * 100, 8)}%` }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })
			]
		}, item.label))
	});
}
//#endregion
//#region src/pages/admin/AdminDashboard.jsx
/**
* AdminDashboard Component
* Features: Analytics charts, Real-time monitoring, Server health cards, Activity stream
*/
function AdminDashboard() {
	const [metrics, setMetrics] = (0, import_react.useState)({
		active_users: 0,
		live_streams: 0,
		queue_size: 0,
		error_rate: 0,
		cpu_usage: 0,
		memory_usage: 0,
		disk_usage: 0,
		api_response_time: 0,
		total_requests: 0,
		failed_requests: 0
	});
	const [auditLogs, setAuditLogs] = (0, import_react.useState)([]);
	const [activityStream, setActivityStream] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [refreshInterval, setRefreshInterval] = (0, import_react.useState)(5e3);
	/**
	* Loads initial dashboard data
	*/
	const loadInitialData = (0, import_react.useCallback)(async () => {
		try {
			const { data } = await getAdminOverview();
			setMetrics(data.metrics || metrics);
			setAuditLogs(data.audit_logs || []);
			setActivityStream(data.activity_stream || []);
		} catch (error) {
			console.error("Failed to load admin overview:", error);
		} finally {
			setLoading(false);
		}
	}, []);
	/**
	* Sets up real-time socket listeners and polling
	*/
	(0, import_react.useEffect)(() => {
		loadInitialData();
		socket_default.on("realtime_metrics", (newMetrics) => {
			setMetrics((prev) => ({
				...prev,
				...newMetrics
			}));
		});
		socket_default.on("new_audit_log", (log) => {
			setAuditLogs((prev) => [log, ...prev].slice(0, 50));
		});
		socket_default.on("activity_update", (activity) => {
			setActivityStream((prev) => [activity, ...prev].slice(0, 30));
		});
		const refreshTimer = setInterval(loadInitialData, refreshInterval);
		return () => {
			socket_default.off("realtime_metrics");
			socket_default.off("new_audit_log");
			socket_default.off("activity_update");
			clearInterval(refreshTimer);
		};
	}, [loadInitialData, refreshInterval]);
	/**
	* Calculates server health status
	*/
	const serverHealth = (0, import_react.useMemo)(() => {
		const cpu = metrics.cpu_usage || 0;
		const memory = metrics.memory_usage || 0;
		const errorRate = metrics.error_rate || 0;
		if (cpu > 80 || memory > 80 || errorRate > 5) return "critical";
		if (cpu > 60 || memory > 60 || errorRate > 2) return "warning";
		return "healthy";
	}, [metrics]);
	/**
	* Gets health status color
	*/
	const getHealthColor = (status) => {
		switch (status) {
			case "critical": return "#ff4444";
			case "warning": return "#ffaa00";
			case "healthy": return "#44ff44";
			default: return "#888";
		}
	};
	/**
	* Formats large numbers
	*/
	const formatNumber = (num) => {
		if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
		if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
		return num.toString();
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			textAlign: "center",
			padding: "40px"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "page-loader-spinner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "جارٍ تحميل لوحة التحكم..." })]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		style: { padding: "20px" },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 30
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					style: { margin: 0 },
					children: "لوحة التحكم"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 10
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: refreshInterval,
						onChange: (e) => setRefreshInterval(Number(e.target.value)),
						style: {
							padding: "8px 12px",
							background: "#222",
							color: "white",
							border: "1px solid #333",
							borderRadius: 6
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 5e3,
								children: "تحديث كل 5 ثوان"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 1e4,
								children: "تحديث كل 10 ثوان"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 3e4,
								children: "تحديث كل 30 ثانية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 6e4,
								children: "تحديث كل دقيقة"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: loadInitialData,
						size: "small",
						children: "🔄 تحديث الآن"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				style: {
					marginBottom: 20,
					padding: 20,
					background: `rgba(${serverHealth === "healthy" ? "68, 255, 68" : serverHealth === "warning" ? "255, 170, 0" : "255, 68, 68"}, 0.1)`
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 15
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
						width: 20,
						height: 20,
						borderRadius: "50%",
						background: getHealthColor(serverHealth),
						animation: serverHealth !== "healthy" ? "pulse 1s infinite" : "none"
					} }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						style: {
							margin: 0,
							marginBottom: 5
						},
						children: "حالة النظام"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						style: {
							margin: 0,
							fontSize: 12,
							color: "#888"
						},
						children: serverHealth === "healthy" ? "✓ النظام يعمل بشكل طبيعي" : serverHealth === "warning" ? "⚠️ تحذير: استخدام موارد مرتفع" : "❌ حرج: يتطلب انتباه فوري"
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
					gap: 15,
					marginBottom: 30
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						style: {
							padding: 20,
							textAlign: "center"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 28,
								fontWeight: "bold",
								color: "var(--primary)",
								marginBottom: 5
							},
							children: formatNumber(metrics.active_users)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "#888",
								fontSize: 12
							},
							children: "المستخدمون النشطون (مباشر)"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						style: {
							padding: 20,
							textAlign: "center"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 28,
								fontWeight: "bold",
								color: "#44ff44",
								marginBottom: 5
							},
							children: metrics.queue_size
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "#888",
								fontSize: 12
							},
							children: "قائمة الانتظار للمراجعة"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						style: {
							padding: 20,
							textAlign: "center"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								fontSize: 28,
								fontWeight: "bold",
								color: "#ff9800",
								marginBottom: 5
							},
							children: [metrics.error_rate.toFixed(2), "%"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "#888",
								fontSize: 12
							},
							children: "معدل الأخطاء"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						style: {
							padding: 20,
							textAlign: "center"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								fontSize: 28,
								fontWeight: "bold",
								color: "#3b82f6",
								marginBottom: 5
							},
							children: [metrics.api_response_time.toFixed(0), "ms"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "#888",
								fontSize: 12
							},
							children: "وقت استجابة API"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
					gap: 15,
					marginBottom: 30
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						style: { padding: 20 },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { marginBottom: 10 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									marginBottom: 8
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 12,
										fontWeight: "bold"
									},
									children: "CPU"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									style: {
										fontSize: 12,
										color: "#888"
									},
									children: [metrics.cpu_usage.toFixed(1), "%"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									height: 8,
									background: "#333",
									borderRadius: 4,
									overflow: "hidden"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
									height: "100%",
									width: `${metrics.cpu_usage}%`,
									background: metrics.cpu_usage > 80 ? "#ff4444" : metrics.cpu_usage > 60 ? "#ffaa00" : "#44ff44",
									transition: "width 0.3s ease"
								} })
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						style: { padding: 20 },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { marginBottom: 10 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									marginBottom: 8
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 12,
										fontWeight: "bold"
									},
									children: "الذاكرة"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									style: {
										fontSize: 12,
										color: "#888"
									},
									children: [metrics.memory_usage.toFixed(1), "%"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									height: 8,
									background: "#333",
									borderRadius: 4,
									overflow: "hidden"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
									height: "100%",
									width: `${metrics.memory_usage}%`,
									background: metrics.memory_usage > 80 ? "#ff4444" : metrics.memory_usage > 60 ? "#ffaa00" : "#44ff44",
									transition: "width 0.3s ease"
								} })
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						style: { padding: 20 },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { marginBottom: 10 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									marginBottom: 8
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 12,
										fontWeight: "bold"
									},
									children: "القرص"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									style: {
										fontSize: 12,
										color: "#888"
									},
									children: [metrics.disk_usage.toFixed(1), "%"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									height: 8,
									background: "#333",
									borderRadius: 4,
									overflow: "hidden"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
									height: "100%",
									width: `${metrics.disk_usage}%`,
									background: metrics.disk_usage > 80 ? "#ff4444" : metrics.disk_usage > 60 ? "#ffaa00" : "#44ff44",
									transition: "width 0.3s ease"
								} })
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
					gap: 15,
					marginBottom: 30
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "نظرة عامة على حركة المرور",
					style: { padding: 20 },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineChart, { data: metrics.traffic_history || [] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "نظرة عامة على الاعتدال",
					style: { padding: 20 },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarChart, { data: metrics.mod_stats || [] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
					gap: 15
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "تدفق النشاط",
					style: { padding: 20 },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							maxHeight: 400,
							overflowY: "auto"
						},
						children: activityStream.length > 0 ? activityStream.map((activity, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								padding: "10px 0",
								borderBottom: "1px solid #333",
								fontSize: 12
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									marginBottom: 4
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { fontWeight: "bold" },
									children: activity.action
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { color: "#888" },
									children: new Date(activity.timestamp).toLocaleTimeString()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { color: "#aaa" },
								children: activity.description
							})]
						}, i)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "#888",
								textAlign: "center",
								padding: "20px"
							},
							children: "لا يوجد نشاط"
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "سجلات التدقيق",
					style: { padding: 20 },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							maxHeight: 400,
							overflowY: "auto"
						},
						children: auditLogs.length > 0 ? auditLogs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								padding: "10px 0",
								borderBottom: "1px solid #333",
								fontSize: 11
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										gap: 8,
										alignItems: "center",
										marginBottom: 4
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { color: "#888" },
										children: new Date(log.timestamp).toLocaleTimeString()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: {
											padding: "2px 6px",
											borderRadius: 4,
											background: log.type === "error" ? "rgba(255, 68, 68, 0.2)" : log.type === "warning" ? "rgba(255, 170, 0, 0.2)" : "rgba(68, 255, 68, 0.2)",
											color: log.type === "error" ? "#ff4444" : log.type === "warning" ? "#ffaa00" : "#44ff44"
										},
										children: log.type
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										color: "#aaa",
										marginBottom: 2
									},
									children: log.message
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										color: "#666",
										fontSize: 10
									},
									children: ["بواسطة ", log.admin_name]
								})
							]
						}, log.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "#888",
								textAlign: "center",
								padding: "20px"
							},
							children: "لا توجد سجلات"
						})
					})
				})]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      ` })] });
}
//#endregion
//#region src/pages/admin/AdminPosts.jsx
var initialForm$1 = {
	content: "",
	image_url: "",
	user_id: ""
};
function AdminPosts() {
	const [posts, setPosts] = (0, import_react.useState)([]);
	const [pagination, setPagination] = (0, import_react.useState)({
		page: 1,
		pages: 1,
		total: 0,
		page_size: 10
	});
	const [search, setSearch] = (0, import_react.useState)("");
	const [sortBy, setSortBy] = (0, import_react.useState)("created_at");
	const [sortDirection, setSortDirection] = (0, import_react.useState)("desc");
	const [selectedIds, setSelectedIds] = (0, import_react.useState)([]);
	const [form, setForm] = (0, import_react.useState)(initialForm$1);
	const [editingPost, setEditingPost] = (0, import_react.useState)(null);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [deleteTarget, setDeleteTarget] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [loadError, setLoadError] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [actionBusyKey, setActionBusyKey] = (0, import_react.useState)("");
	const [mediaReviewOpen, setMediaReviewOpen] = (0, import_react.useState)(false);
	const [currentMedia, setCurrentMedia] = (0, import_react.useState)(null);
	const { pushToast } = useToast();
	const debouncedSearch = useDebouncedValue(search, 350);
	const loadPosts = async (page = pagination.page) => {
		try {
			setLoading(true);
			setLoadError("");
			const { data } = await getAdminPosts({
				page,
				page_size: pagination.page_size,
				search: debouncedSearch,
				sort_by: sortBy,
				sort_direction: sortDirection
			});
			setPosts(data.items || []);
			setPagination(data.pagination || pagination);
		} catch (error) {
			const message = error?.response?.data?.detail || "حدث خطأ.";
			setLoadError(message);
			pushToast({
				title: "تعذر تحميل المحتوى",
				description: message,
				type: "error"
			});
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadPosts(1);
	}, [
		debouncedSearch,
		sortBy,
		sortDirection
	]);
	(0, import_react.useEffect)(() => {
		const syncPosts = () => loadPosts(pagination.page);
		socket_default.on("admin:post_created", syncPosts);
		socket_default.on("admin:post_updated", syncPosts);
		socket_default.on("admin:post_deleted", syncPosts);
		socket_default.on("admin:posts_bulk_deleted", syncPosts);
		return () => {
			socket_default.off("admin:post_created", syncPosts);
			socket_default.off("admin:post_updated", syncPosts);
			socket_default.off("admin:post_deleted", syncPosts);
			socket_default.off("admin:posts_bulk_deleted", syncPosts);
		};
	}, [
		pagination.page,
		debouncedSearch,
		sortBy,
		sortDirection
	]);
	const toggleSelected = (postId) => {
		setSelectedIds((prev) => prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]);
	};
	const handleAIModeration = async (postId) => {
		try {
			setActionBusyKey(`ai-${postId}`);
			const { data } = await moderatePostAI(postId);
			pushToast({
				title: "AI Moderation Complete",
				description: `Score: ${data.score}. Status: ${data.flagged ? "Flagged" : "Clean"}`,
				type: data.flagged ? "warning" : "success"
			});
			loadPosts();
		} catch (error) {
			pushToast({
				title: "AI Moderation Failed",
				description: "Could not process request",
				type: "error"
			});
		} finally {
			setActionBusyKey("");
		}
	};
	const handleShadowBan = async (userId) => {
		try {
			await toggleShadowBan(userId, true);
			pushToast({
				title: "User Shadow Banned",
				description: `User ID: ${userId}`,
				type: "warning"
			});
		} catch (error) {
			pushToast({
				title: "Action Failed",
				description: "Could not shadow ban user",
				type: "error"
			});
		}
	};
	const handleBulkAction = async (action) => {
		if (!selectedIds.length) return;
		try {
			setActionBusyKey("bulk-action");
			await bulkUpdatePostStatus(selectedIds, action);
			pushToast({
				title: "Bulk Action Success",
				description: `Applied ${action} to ${selectedIds.length} posts`,
				type: "success"
			});
			setSelectedIds([]);
			loadPosts();
		} catch (error) {
			pushToast({
				title: "Bulk Action Failed",
				type: "error"
			});
		} finally {
			setActionBusyKey("");
		}
	};
	const openMediaReview = (post) => {
		setCurrentMedia(post);
		setMediaReviewOpen(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "dashboard-hero-grid small-gap",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "filters-row wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "Search",
						value: search,
						onChange: (event) => setSearch(event.target.value),
						placeholder: "ابحث في المحتوى أو اسم المستخدم"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field select-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "field-label",
							children: "Sorting"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "input",
							value: sortBy,
							onChange: (event) => setSortBy(event.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "created_at",
								children: "الأحدث"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "engagement",
								children: "التفاعل"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field select-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "field-label",
							children: "Direction"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "input",
							value: sortDirection,
							onChange: (event) => setSortDirection(event.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "desc",
								children: "تنازلي"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "asc",
								children: "تصاعدي"
							})]
						})]
					})
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "action-row wide",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => setOpen(true),
						children: "منشور جديد"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bulk-actions-group",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							disabled: !selectedIds.length,
							onClick: () => handleBulkAction("approve"),
							children: "Approve All"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							className: "danger",
							disabled: !selectedIds.length,
							onClick: () => handleBulkAction("delete"),
							children: "Delete All"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => loadPosts(pagination.page),
						loading,
						children: "Refresh"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "muted",
						children: [selectedIds.length, " items selected"]
					})
				]
			}) })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-head split",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "section-title",
				children: "Post Moderation & AI Control"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pagination-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						disabled: pagination.page <= 1,
						onClick: () => loadPosts(pagination.page - 1),
						children: "السابق"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						pagination.page,
						" / ",
						pagination.pages
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						disabled: pagination.page >= pagination.pages,
						onClick: () => loadPosts(pagination.page + 1),
						children: "التالي"
					})
				]
			})]
		}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableSkeleton, { rows: 6 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "table-shell",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "admin-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						onChange: (e) => setSelectedIds(e.target.checked ? posts.map((p) => p.id) : [])
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "ID" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Author" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Content & Media" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "AI Flag" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Actions" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: selectedIds.includes(post.id),
						onChange: () => toggleSelected(post.id)
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: ["#", post.id] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "user-cell",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: post.username }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "text-link tiny",
							onClick: () => handleShadowBan(post.user_id),
							children: "Shadow Ban"
						})]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "content-preview",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [post.content?.slice(0, 50), "..."] }), post.image_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "media-badge",
							onClick: () => openMediaReview(post),
							children: "Review Media"
						})]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `badge ${post.ai_flagged ? "danger" : "success"}`,
						children: post.ai_flagged ? "Auto-Flagged" : "Clean"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "action-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "mini-action",
							onClick: () => handleAIModeration(post.id),
							children: "AI Scan"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "mini-action danger",
							onClick: () => setDeleteTarget(post),
							children: "Delete"
						})]
					}) })
				] }, post.id)) })]
			})
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: mediaReviewOpen,
			title: "Media Review",
			onClose: () => setMediaReviewOpen(false),
			children: currentMedia && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "media-review-container",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: currentMedia.image_url,
					alt: "Post content",
					className: "review-img"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "modal-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => setMediaReviewOpen(false),
						children: "Close"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "danger",
						onClick: () => {
							handleBulkAction("delete");
							setMediaReviewOpen(false);
						},
						children: "Flag & Remove"
					})]
				})]
			})
		})
	] });
}
//#endregion
//#region src/pages/admin/AdminNotifications.jsx
function AdminNotifications() {
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [analytics, setAnalytics] = (0, import_react.useState)({
		delivered: 0,
		opened: 0,
		failed: 0
	});
	const [form, setForm] = (0, import_react.useState)({
		title: "",
		body: "",
		segment: "all",
		schedule_time: ""
	});
	const [loading, setLoading] = (0, import_react.useState)(true);
	const { pushToast } = useToast();
	const loadData = async () => {
		try {
			const { data } = await getAdminNotifications();
			setNotifications(data.items || []);
			setAnalytics(data.analytics || analytics);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadData();
	}, []);
	const handleSchedule = async () => {
		try {
			await broadcastAdminNotification(form);
			pushToast({
				title: "Notification Scheduled",
				description: `Target: ${form.segment}`,
				type: "success"
			});
			setForm({
				title: "",
				body: "",
				segment: "all",
				schedule_time: ""
			});
			loadData();
		} catch (err) {
			pushToast({
				title: "Scheduling Failed",
				type: "error"
			});
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "notifications-dashboard",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "two-column-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Schedule Push Notification",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "modal-stack",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							label: "Title",
							value: form.title,
							onChange: (e) => setForm({
								...form,
								title: e.target.value
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "field-label",
								children: "Message Body"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "input",
								rows: "3",
								value: form.body,
								onChange: (e) => setForm({
									...form,
									body: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "filters-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field select-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "field-label",
									children: "User Segmentation"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "input",
									value: form.segment,
									onChange: (e) => setForm({
										...form,
										segment: e.target.value
									}),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: "All Users"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "active",
											children: "Active (Last 7 days)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "inactive",
											children: "Inactive"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "premium",
											children: "Premium Only"
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "Schedule Time",
								type: "datetime-local",
								value: form.schedule_time,
								onChange: (e) => setForm({
									...form,
									schedule_time: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleSchedule,
							children: "Schedule & Broadcast"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Delivery Analytics",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "analytics-grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "stat-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Delivered"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "value success",
								children: analytics.delivered
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "stat-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Open Rate"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "value info",
								children: [(analytics.opened / analytics.delivered * 100 || 0).toFixed(1), "%"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "stat-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "label",
								children: "Retry Queue"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "value warning",
								children: analytics.failed
							})]
						})
					]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			title: "Notification History & Queue",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "table-shell",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "admin-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Title" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Target Segment" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Scheduled For" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Analytics" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: notifications.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: n.title }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: n.segment
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: new Date(n.schedule_time).toLocaleString() }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `status-dot ${n.status}` }),
							" ",
							n.status
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [
							n.open_count,
							" opens / ",
							n.delivery_count,
							" sent"
						] })
					] }, n.id)) })]
				})
			})
		})]
	}) });
}
//#endregion
//#region src/pages/admin/AdminLive.jsx
function AdminLive() {
	const [rooms, setRooms] = (0, import_react.useState)([]);
	const [stats, setStats] = (0, import_react.useState)({});
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [selectedRoom, setSelectedRoom] = (0, import_react.useState)(null);
	const { pushToast } = useToast();
	const loadLiveStatus = async () => {
		try {
			setLoading(true);
			const { data } = await getAdminLiveOverview();
			setRooms(data.rooms || []);
			setStats(data.stats || {});
		} catch (err) {
			pushToast({
				title: "Monitoring Failed",
				type: "error"
			});
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadLiveStatus();
		socket_default.on("stream_metrics_update", (data) => {
			setStats((prev) => ({
				...prev,
				...data
			}));
		});
		return () => socket_default.off("stream_metrics_update");
	}, []);
	const handleEmergencyStop = async (roomId) => {
		if (!window.confirm("Are you sure you want to trigger an EMERGENCY STOP?")) return;
		try {
			await endAdminLiveRoom(roomId);
			pushToast({
				title: "Emergency Stop Triggered",
				description: `Stream ${roomId} terminated`,
				type: "error"
			});
			loadLiveStatus();
		} catch (err) {
			pushToast({
				title: "Action Failed",
				type: "error"
			});
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "live-monitoring-header",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "metrics-bar",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "metric-item",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Active Streams"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "value",
							children: stats.active_rooms || 0
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "metric-item",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Total Viewers"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "value",
							children: stats.current_viewers || 0
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "metric-item",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "label",
							children: "Avg Bitrate"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "value",
							children: stats.avg_bitrate || "0 kbps"
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "streams-grid",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-head split",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "Live Stream Monitoring"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "live-indicator",
					children: "Real-time Feed Active"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "table-shell",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "admin-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Host" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Title" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Metrics (V/L/B)" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Actions" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rooms.map((room) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: room.username }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: room.title }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [
							room.viewer_count,
							" / ",
							room.likes,
							" / ",
							room.bitrate,
							"k"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge success",
							children: "Live"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "action-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "mini-action",
								onClick: () => setSelectedRoom(room),
								children: "Monitor"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "mini-action danger",
								onClick: () => handleEmergencyStop(room.id),
								children: "Emergency Stop"
							})]
						}) })
					] }, room.id)) })]
				})
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: !!selectedRoom,
			title: "Stream Moderation & Metrics",
			onClose: () => setSelectedRoom(null),
			children: selectedRoom && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stream-mod-container",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "stream-preview-placeholder",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overlay-metrics",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["FPS: ", selectedRoom.fps || 30] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Latency: ", selectedRoom.latency || "120ms"] })]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mod-controls",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							children: "Mute Audio"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							children: "Hide Chat"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "danger",
							onClick: () => handleEmergencyStop(selectedRoom.id),
							children: "Terminate Stream"
						})
					]
				})]
			})
		})
	] });
}
//#endregion
//#region src/pages/admin/AdminSettings.jsx
var defaultNotificationSettings = {
	push_enabled: true,
	browser_enabled: true,
	mobile_enabled: true,
	smart_notifications: true,
	grouped_notifications: true,
	silent_notifications: false,
	realtime_notifications: true,
	sound: "classic",
	categories: {
		chat: true,
		follow: true,
		interaction: true,
		live: true,
		system: true,
		reports: true
	}
};
var defaultGeneral = {
	platform_name: "",
	support_email: "",
	maintenance_mode: false,
	allow_registration: true,
	default_user_role: "user",
	session_timeout_minutes: 120,
	theme: "midnight",
	locale: "ar-EG",
	notifications: defaultNotificationSettings
};
function normalizeSettingsPayload(data) {
	return {
		...defaultGeneral,
		...data?.general || {},
		notifications: {
			...defaultNotificationSettings,
			...data?.general?.notifications || {},
			categories: {
				...defaultNotificationSettings.categories,
				...data?.general?.notifications?.categories || {}
			}
		}
	};
}
function AdminSettings() {
	const [general, setGeneral] = (0, import_react.useState)(defaultGeneral);
	const [lastLoadedGeneral, setLastLoadedGeneral] = (0, import_react.useState)(defaultGeneral);
	const [passwordForm, setPasswordForm] = (0, import_react.useState)({
		current_password: "",
		new_password: ""
	});
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)("");
	const [savingGeneral, setSavingGeneral] = (0, import_react.useState)(false);
	const [changingPassword, setChangingPassword] = (0, import_react.useState)(false);
	const { pushToast } = useToast();
	const hasSettingsData = Boolean(general.platform_name || general.support_email || general.session_timeout_minutes || general.theme || general.locale);
	const settingsChecklist = (0, import_react.useMemo)(() => [
		{
			key: "platform",
			label: "اسم المنصة",
			value: general.platform_name || "غير مضبوط بعد"
		},
		{
			key: "support",
			label: "بريد الدعم",
			value: general.support_email || "غير مضبوط بعد"
		},
		{
			key: "registration",
			label: "التسجيل",
			value: general.allow_registration ? "مفتوح" : "مغلق"
		},
		{
			key: "maintenance",
			label: "الصيانة",
			value: general.maintenance_mode ? "مفعّلة" : "متوقفة"
		},
		{
			key: "push",
			label: "Push Notifications",
			value: general.notifications?.push_enabled ? "مفعلة" : "مغلقة"
		},
		{
			key: "grouped",
			label: "Grouped Notifications",
			value: general.notifications?.grouped_notifications ? "مفعلة" : "مغلقة"
		}
	], [general]);
	const loadSettings = async (showToast = false) => {
		try {
			setLoading(true);
			setError("");
			const { data } = await getAdminSettings();
			const normalized = normalizeSettingsPayload(data);
			setGeneral(normalized);
			setLastLoadedGeneral(normalized);
			if (showToast) pushToast({
				title: "تمت إعادة التحميل",
				description: "تم استرجاع آخر إعدادات محفوظة من الخادم.",
				type: "success"
			});
		} catch (err) {
			setError(err?.response?.data?.detail || "تعذر تحميل إعدادات الإدارة حالياً.");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadSettings();
		const onSettingsUpdated = (payload) => {
			const normalized = normalizeSettingsPayload({ general: payload?.general || {} });
			setGeneral(normalized);
			setLastLoadedGeneral(normalized);
		};
		socket_default.on("admin:settings_updated", onSettingsUpdated);
		return () => {
			socket_default.off("admin:settings_updated", onSettingsUpdated);
		};
	}, []);
	const updateNotificationSetting = (key, value) => {
		setGeneral((prev) => ({
			...prev,
			notifications: {
				...prev.notifications,
				[key]: value
			}
		}));
	};
	const toggleCategory = (key) => {
		setGeneral((prev) => ({
			...prev,
			notifications: {
				...prev.notifications,
				categories: {
					...prev.notifications.categories,
					[key]: !prev.notifications.categories[key]
				}
			}
		}));
	};
	const handleSaveSettings = async () => {
		setSavingGeneral(true);
		setError("");
		try {
			const { data } = await updateAdminSettings({ general });
			const normalized = normalizeSettingsPayload(data);
			setGeneral(normalized);
			setLastLoadedGeneral(normalized);
			pushToast({
				title: "تم حفظ الإعدادات",
				description: "تم تحديث الإعدادات العامة وإعدادات الإشعارات بنجاح.",
				type: "success"
			});
		} catch (err) {
			const message = err?.response?.data?.detail || "تعذر حفظ الإعدادات حالياً.";
			setError(message);
			pushToast({
				title: "تعذر الحفظ",
				description: message,
				type: "error"
			});
		} finally {
			setSavingGeneral(false);
		}
	};
	const handleResetSettings = async () => {
		await loadSettings(true);
	};
	const handleChangePassword = async () => {
		if (!passwordForm.current_password.trim() || !passwordForm.new_password.trim()) {
			setError("اكتب كلمة المرور الحالية والجديدة قبل التنفيذ.");
			return;
		}
		setChangingPassword(true);
		setError("");
		try {
			await changeAdminPassword(passwordForm);
			pushToast({
				title: "تم تحديث كلمة المرور",
				description: "تم تغيير كلمة المرور للحساب الحالي.",
				type: "success"
			});
			setPasswordForm({
				current_password: "",
				new_password: ""
			});
		} catch (err) {
			const message = err?.response?.data?.detail || "تعذر تغيير كلمة المرور حالياً.";
			setError(message);
			pushToast({
				title: "تعذر التحديث",
				description: message,
				type: "error"
			});
		} finally {
			setChangingPassword(false);
		}
	};
	if (loading && !hasSettingsData) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminOverviewSkeleton, {}) });
	if (error && !hasSettingsData) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "تعذر تحميل الإعدادات",
		description: error,
		onRetry: loadSettings
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "alert error",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "dashboard-hero-grid small-gap",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "hero-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "badge",
						children: "System Preferences"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "توحيد إعدادات المنصة والإشعارات والإدارة" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: "تم ربط الحفظ والـ reset مع الـ API الحقيقي، مع مزامنة مباشرة لو الإعدادات اتغيرت من جلسة أدمن تانية."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "action-row wide",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							loading: savingGeneral,
							disabled: savingGeneral,
							onClick: handleSaveSettings,
							children: "حفظ الإعدادات"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							loading,
							disabled: loading,
							onClick: handleResetSettings,
							children: loading ? "جارٍ الاسترجاع..." : "Reset / إعادة من الخادم"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-head split",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "جاهزية التكوين"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "badge",
					children: [
						settingsChecklist.filter((item) => !String(item.value).includes("غير مضبوط")).length,
						"/",
						settingsChecklist.length
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "queue-grid compact-cards",
				children: settingsChecklist.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "queue-card compact",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "queue-label",
							children: item.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "مؤشر سريع على حالة التهيئة الحالية." })
					]
				}, item.key))
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "two-column-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "الإعدادات العامة"
				})
			}), !hasSettingsData ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: "⚙️",
				title: "لا توجد إعدادات مُحمّلة بعد",
				description: "يمكنك سحب الإعدادات من الخادم أو البدء بملء القيم الافتراضية ثم الحفظ.",
				actionLabel: "إعادة التحميل",
				onAction: loadSettings
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "اسم المنصة",
						value: general.platform_name,
						onChange: (event) => setGeneral((prev) => ({
							...prev,
							platform_name: event.target.value
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "بريد الدعم",
						value: general.support_email,
						onChange: (event) => setGeneral((prev) => ({
							...prev,
							support_email: event.target.value
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "filters-row wrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field select-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "field-label",
								children: "الدور الافتراضي"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "input",
								value: general.default_user_role,
								onChange: (event) => setGeneral((prev) => ({
									...prev,
									default_user_role: event.target.value
								})),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "user",
										children: "مستخدم"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "moderator",
										children: "مشرف"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "admin",
										children: "أدمن"
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							label: "مهلة الجلسة بالدقائق",
							type: "number",
							value: general.session_timeout_minutes,
							onChange: (event) => setGeneral((prev) => ({
								...prev,
								session_timeout_minutes: Number(event.target.value) || 0
							}))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "filters-row wrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field select-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "field-label",
								children: "الثيم"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "input",
								value: general.theme,
								onChange: (event) => setGeneral((prev) => ({
									...prev,
									theme: event.target.value
								})),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "midnight",
										children: "Midnight"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "aurora",
										children: "Aurora"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "graphite",
										children: "Graphite"
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field select-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "field-label",
								children: "اللغة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "input",
								value: general.locale,
								onChange: (event) => setGeneral((prev) => ({
									...prev,
									locale: event.target.value
								})),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ar-EG",
									children: "العربية"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "en-US",
									children: "English"
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "filters-row wrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "checkbox-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: general.maintenance_mode,
								onChange: (event) => setGeneral((prev) => ({
									...prev,
									maintenance_mode: event.target.checked
								}))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "وضع الصيانة" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "checkbox-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: general.allow_registration,
								onChange: (event) => setGeneral((prev) => ({
									...prev,
									allow_registration: event.target.checked
								}))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "السماح بالتسجيل" })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						loading: savingGeneral,
						disabled: savingGeneral,
						onClick: handleSaveSettings,
						children: "حفظ الإعدادات"
					})
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "Notification Settings"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "queue-grid compact-cards",
						children: [
							["push_enabled", "Push Notifications"],
							["browser_enabled", "Browser Notifications"],
							["mobile_enabled", "Mobile Notifications"],
							["smart_notifications", "Smart Notifications"],
							["grouped_notifications", "Grouped Notifications"],
							["silent_notifications", "Silent Notifications"],
							["realtime_notifications", "Real-time Notifications"]
						].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "queue-card compact",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "queue-label",
									children: label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: general.notifications?.[key] ? "مفعّل" : "متوقف" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "checkbox-row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: Boolean(general.notifications?.[key]),
										onChange: (event) => updateNotificationSetting(key, event.target.checked)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تبديل" })]
								})
							]
						}, key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field select-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "field-label",
							children: "Notification Sounds"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "input",
							value: general.notifications?.sound || "classic",
							onChange: (event) => updateNotificationSetting("sound", event.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "classic",
									children: "Classic Bell"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "pulse",
									children: "Pulse Ping"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "soft",
									children: "Soft Chime"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "silent",
									children: "Silent Mode"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "queue-grid compact-cards",
						children: Object.entries(general.notifications?.categories || {}).map(([key, enabled]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "queue-card compact",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "queue-label",
									children: key
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: enabled ? "مفعّل" : "متوقف" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "checkbox-row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: Boolean(enabled),
										onChange: () => toggleCategory(key)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Toggle Category" })]
								})
							]
						}, key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						loading: savingGeneral,
						disabled: savingGeneral,
						onClick: handleSaveSettings,
						children: "حفظ إعدادات الإشعارات"
					})
				]
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "two-column-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "الأمان والوصول الإداري"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "كلمة المرور الحالية",
						type: "password",
						value: passwordForm.current_password,
						onChange: (event) => setPasswordForm((prev) => ({
							...prev,
							current_password: event.target.value
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "كلمة المرور الجديدة",
						type: "password",
						value: passwordForm.new_password,
						onChange: (event) => setPasswordForm((prev) => ({
							...prev,
							new_password: event.target.value
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						loading: changingPassword,
						disabled: changingPassword,
						onClick: handleChangePassword,
						children: "تغيير كلمة المرور"
					})
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "الأدمن الأساسي"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "dropzone-hint admin-access-help",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "دخول لوحة الأدمن" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted no-margin",
						children: "الرابط الأساسي: /admin/login"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted no-margin",
						children: "الرابط الاحتياطي: /admin.html"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "muted no-margin",
						children: ["لازم الدخول يتم بنفس البريد الإداري الأساسي: ", PRIMARY_ADMIN_EMAIL]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "muted no-margin",
						children: ["آخر نسخة محملة من الخادم: ", lastLoadedGeneral.platform_name || "غير متوفرة حالياً"]
					})
				]
			})] })]
		})
	] });
}
//#endregion
//#region src/pages/admin/AdminRbac.jsx
var defaultRbac = {
	current_role: "",
	current_permissions: [],
	roles: []
};
function AdminRbac() {
	const [rbac, setRbac] = (0, import_react.useState)(defaultRbac);
	const [users, setUsers] = (0, import_react.useState)([]);
	const [search, setSearch] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [userLoading, setUserLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)("");
	const [actionBusyKey, setActionBusyKey] = (0, import_react.useState)("");
	const debouncedSearch = useDebouncedValue(search, 300);
	const { pushToast } = useToast();
	const hasRbacData = Boolean(rbac.current_role || (rbac.current_permissions || []).length || (rbac.roles || []).length);
	const loadRbac = async () => {
		try {
			setLoading(true);
			setError("");
			const { data } = await getAdminRbac();
			setRbac({
				...defaultRbac,
				...data || {}
			});
		} catch (err) {
			setError(err?.response?.data?.detail || "تعذر تحميل صلاحيات الأدوار حالياً.");
		} finally {
			setLoading(false);
		}
	};
	const loadUsers = async () => {
		try {
			setUserLoading(true);
			const { data } = await getAdminUsers({
				page: 1,
				page_size: 20,
				search: debouncedSearch,
				status: "all",
				role: "all"
			});
			setUsers(data?.items || []);
		} catch (err) {
			pushToast({
				title: "تعذر تحميل المستخدمين",
				description: err?.response?.data?.detail || "حاول مرة أخرى.",
				type: "error"
			});
			setUsers([]);
		} finally {
			setUserLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadRbac();
	}, []);
	(0, import_react.useEffect)(() => {
		loadUsers();
	}, [debouncedSearch]);
	(0, import_react.useEffect)(() => {
		const sync = () => {
			loadUsers();
			loadRbac();
		};
		socket_default.on("admin:user_updated", sync);
		socket_default.on("admin:user_deleted", sync);
		socket_default.on("admin:user_status_changed", sync);
		return () => {
			socket_default.off("admin:user_updated", sync);
			socket_default.off("admin:user_deleted", sync);
			socket_default.off("admin:user_status_changed", sync);
		};
	}, [debouncedSearch]);
	const roleMap = (0, import_react.useMemo)(() => Object.fromEntries((rbac.roles || []).map((role) => [role.role, role])), [rbac.roles]);
	const handleAssignRole = async (user, role) => {
		try {
			setActionBusyKey(`${user.id}-${role}`);
			await updateAdminUser(user.id, { role });
			pushToast({
				title: "تم تحديث الدور",
				description: `${user.username} → ${role}`,
				type: "success"
			});
			await Promise.all([loadUsers(), loadRbac()]);
		} catch (error) {
			pushToast({
				title: "تعذر تحديث الدور",
				description: error?.response?.data?.detail || "حاول مرة أخرى.",
				type: "error"
			});
		} finally {
			setActionBusyKey("");
		}
	};
	if (loading && !hasRbacData) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminOverviewSkeleton, {}) });
	if (error && !hasRbacData) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "تعذر تحميل صلاحيات الأدوار",
		description: error,
		onRetry: loadRbac
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "alert error",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "dashboard-hero-grid small-gap",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "hero-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "badge",
						children: "RBAC"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "مصفوفة الصلاحيات والأدوار" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: "تم ربط الصفحة بواجهة RBAC الحقيقية وإضافة Assign / Remove Role مباشرة على المستخدمين مع تحديث حي فور التنفيذ."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "action-row wide",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							loading,
							disabled: loading,
							onClick: loadRbac,
							children: "تحديث الصلاحيات"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							loading: userLoading,
							disabled: userLoading,
							onClick: loadUsers,
							children: "تحديث المستخدمين"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "badge",
					children: "Current Role"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: rbac.current_role || "—" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "الصلاحيات الحالية للحساب المعتمد داخل لوحة التحكم."
				})
			] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "two-column-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "Current Permissions"
				})
			}), (rbac.current_permissions || []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "badge-wrap",
				children: (rbac.current_permissions || []).map((permission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "glass-chip",
					children: permission
				}, permission))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: "🔐",
				title: "لا توجد صلاحيات مرتبطة بالحساب",
				description: "قد يكون الحساب محدود الصلاحية أو لم تصل البيانات من الخادم بعد.",
				actionLabel: "إعادة التحميل",
				onAction: loadRbac
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-head",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "ملخص الأدوار"
				})
			}), (rbac.roles || []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "queue-grid compact-cards",
				children: (rbac.roles || []).map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "queue-card compact",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "queue-label",
							children: role.label || role.role
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [role.permissions?.length || 0, " صلاحية"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: (role.permissions || []).slice(0, 3).join(" • ") || "بدون صلاحيات" })
					]
				}, role.role))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: "🧩",
				title: "لا توجد أدوار معرفة بعد",
				description: "سيتم عرض الأدوار هنا بمجرد رجوع بيانات المصفوفة من الباك إند."
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "card-head",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "section-title",
				children: "Roles & Permissions Matrix"
			})
		}), (rbac.roles || []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rbac-grid role-grid",
			children: (rbac.roles || []).map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "permission-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: role.label || role.role }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "badge-wrap compact",
					children: (role.permissions || []).map((permission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "role-pill neutral",
						children: permission
					}, permission))
				})]
			}, role.role))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: "📚",
			title: "مصفوفة الصلاحيات فارغة",
			description: "لا توجد صفوف لعرض الأدوار والصلاحيات حالياً.",
			actionLabel: "إعادة التحميل",
			onAction: loadRbac
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-head split",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "Assign / Remove Role"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted no-margin",
					children: "تعديل مباشر لدور المستخدم مع تحديث الصلاحيات فوراً بعد نجاح العملية."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					label: "بحث مستخدم",
					value: search,
					onChange: (event) => setSearch(event.target.value),
					placeholder: "اسم المستخدم أو البريد"
				})]
			}),
			userLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminOverviewSkeleton, {}) : null,
			!userLoading && users.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: "👤",
				title: "لا يوجد مستخدمون مطابقون",
				description: "جرّب بحث مختلف أو أعد التحميل.",
				actionLabel: "إعادة التحميل",
				onAction: loadUsers
			}) : null,
			!userLoading && users.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "table-shell",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "admin-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "المستخدم" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "الدور الحالي" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "صلاحيات الدور" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Assign Role" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Remove Role" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: users.map((user) => {
						const permissions = roleMap[user.role]?.permissions || [];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: user.username }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: user.email })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `role-pill ${user.role}`,
								children: user.role
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "badge-wrap compact",
								children: permissions.length ? permissions.slice(0, 4).map((permission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "glass-chip",
									children: permission
								}, permission)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "muted",
									children: "لا توجد صلاحيات"
								})
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "hero-actions-wrap",
								children: [
									"admin",
									"moderator",
									"user"
								].map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mini-action",
									disabled: user.role === role || actionBusyKey === `${user.id}-${role}`,
									"aria-busy": actionBusyKey === `${user.id}-${role}`,
									onClick: () => handleAssignRole(user, role),
									children: actionBusyKey === `${user.id}-${role}` ? "..." : `Assign ${role}`
								}, role))
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mini-action danger",
								disabled: user.role === "user" || actionBusyKey === `${user.id}-user`,
								"aria-busy": actionBusyKey === `${user.id}-user`,
								onClick: () => handleAssignRole(user, "user"),
								children: actionBusyKey === `${user.id}-user` ? "..." : "Remove Role"
							}) })
						] }, user.id);
					}) })]
				})
			}) : null
		] })
	] });
}
//#endregion
//#region src/pages/admin/AdminChat.jsx
function AdminChat() {
	const [threads, setThreads] = (0, import_react.useState)([]);
	const [activeThread, setActiveThread] = (0, import_react.useState)(null);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const { pushToast } = useToast();
	const loadThreads = async () => {
		try {
			const { data } = await getChatThreads();
			setThreads(data || []);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadThreads();
		socket_default.on("abuse_detected", (payload) => {
			pushToast({
				title: "Abuse Detected",
				description: `In chat with ${payload.user}`,
				type: "warning"
			});
			loadThreads();
		});
		return () => socket_default.off("abuse_detected");
	}, []);
	const handleRestore = async (messageId) => {
		try {
			await restoreMessage(messageId);
			pushToast({
				title: "Message Restored",
				type: "success"
			});
			if (activeThread) loadMessages(activeThread.id);
		} catch (err) {
			pushToast({
				title: "Restore Failed",
				type: "error"
			});
		}
	};
	const loadMessages = async (threadId) => {
		const { data } = await getMessages(threadId);
		setMessages(data.items || []);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "admin-chat-layout",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "chat-sidebar",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Active Conversations",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "thread-list",
					children: threads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `thread-item ${activeThread?.id === thread.id ? "active" : ""} ${thread.flagged ? "flagged" : ""}`,
						onClick: () => {
							setActiveThread(thread);
							loadMessages(thread.id);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "thread-meta",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: thread.username }), thread.abuse_score > 50 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "abuse-indicator",
								children: "!"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "last-msg",
							children: [thread.last_message?.slice(0, 30), "..."]
						})]
					}, thread.id))
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "chat-monitor-area",
			children: activeThread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: `Monitoring: ${activeThread.username}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "messages-scroller",
					children: messages.map((msg) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `msg-bubble ${msg.deleted ? "deleted" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "msg-content",
							children: [msg.type === "media" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "media-placeholder",
								children: ["[Media Moderation Pending]", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "text-link",
									onClick: () => window.open(msg.media_url),
									children: "View Original"
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: msg.content }), msg.deleted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "restore-btn",
								onClick: () => handleRestore(msg.id),
								children: "Restore Message"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "msg-meta",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(msg.created_at).toLocaleTimeString() }), msg.ai_score && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ai-score",
								children: [
									"AI: ",
									msg.ai_score,
									"%"
								]
							})]
						})]
					}, msg.id))
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "chat-empty-state",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Select a conversation to monitor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Real-time abuse detection and media moderation are active." })]
			})
		})]
	}) });
}
//#endregion
//#region src/pages/admin/AdminStories.jsx
function isVideo$1(value) {
	return /\.(mp4|mov|webm|mkv)$/i.test(String(value || ""));
}
function normalizeStory(item) {
	return {
		id: item?.id || `${item?.username}-${item?.media_url}-${item?.created_at}`,
		username: item?.username || "user",
		media: item?.media_url || item?.media || "",
		created_at: item?.created_at || "",
		expires_at: item?.expires_at || "",
		caption: item?.caption || "",
		privacy: item?.privacy || "public",
		music: item?.music || "",
		stickers: Array.isArray(item?.stickers) ? item.stickers : [],
		mentions: Array.isArray(item?.mentions) ? item.mentions : [],
		filter_name: item?.filter_name || "",
		countdown_at: item?.countdown_at || "",
		highlight: Boolean(item?.highlight),
		replies: Array.isArray(item?.replies) ? item.replies : [],
		seen_by: Array.isArray(item?.seen_by) ? item.seen_by : [],
		views_count: Number(item?.views_count || 0),
		replies_count: Number(item?.replies_count || 0),
		reactions_count: Number(item?.reactions_count || 0),
		type: isVideo$1(item?.media_url || item?.media) ? "video" : "image"
	};
}
function formatDate$1(value) {
	if (!value) return "—";
	try {
		return new Date(value).toLocaleString("ar-EG");
	} catch {
		return "—";
	}
}
function AdminStories() {
	const [stories, setStories] = (0, import_react.useState)([]);
	const [archive, setArchive] = (0, import_react.useState)([]);
	const [highlights, setHighlights] = (0, import_react.useState)([]);
	const [analytics, setAnalytics] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)("");
	const [activeStoryId, setActiveStoryId] = (0, import_react.useState)("");
	const [storyModalOpen, setStoryModalOpen] = (0, import_react.useState)(false);
	const [togglingHighlight, setTogglingHighlight] = (0, import_react.useState)(false);
	const { pushToast } = useToast();
	const load = async ({ preserveActive = true } = {}) => {
		try {
			setLoading(true);
			setError("");
			const [storiesRes, analyticsRes, archiveRes, highlightsRes] = await Promise.all([
				getStories(),
				getStoryAnalyticsSummary(),
				getStoryArchive(),
				getStoryHighlights()
			]);
			const nextStories = (Array.isArray(storiesRes.data) ? storiesRes.data : []).map(normalizeStory);
			const nextArchive = (Array.isArray(archiveRes.data) ? archiveRes.data : []).map(normalizeStory);
			const nextHighlights = (Array.isArray(highlightsRes.data) ? highlightsRes.data : []).map(normalizeStory);
			setStories(nextStories);
			setArchive(nextArchive);
			setHighlights(nextHighlights);
			setAnalytics(analyticsRes.data || null);
			setActiveStoryId((previous) => {
				if (!nextStories.length) return "";
				if (preserveActive && previous && nextStories.some((story) => String(story.id) === String(previous))) return previous;
				return String(nextStories[0].id);
			});
		} catch (err) {
			setError(err?.response?.data?.detail || "تعذر تحميل القصص الحية.");
			setStories([]);
			setArchive([]);
			setHighlights([]);
			setAnalytics(null);
			setActiveStoryId("");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		load({ preserveActive: false });
	}, []);
	const activeIndex = (0, import_react.useMemo)(() => stories.findIndex((story) => String(story.id) === String(activeStoryId)), [stories, activeStoryId]);
	const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;
	(0, import_react.useEffect)(() => {
		if (!storyModalOpen || !activeStory) return;
		viewStory(activeStory.id).catch(() => null);
	}, [activeStory, storyModalOpen]);
	const stats = (0, import_react.useMemo)(() => [
		{
			label: "القصص الحالية",
			value: analytics?.stories_count ?? stories.length
		},
		{
			label: "Highlights",
			value: analytics?.highlights_count ?? highlights.length
		},
		{
			label: "المشاهدات",
			value: analytics?.total_views ?? stories.reduce((sum, item) => sum + item.views_count, 0)
		},
		{
			label: "الردود",
			value: analytics?.total_replies ?? stories.reduce((sum, item) => sum + item.replies_count, 0)
		}
	], [
		analytics,
		highlights.length,
		stories
	]);
	const openStory = (storyId) => {
		setActiveStoryId(String(storyId));
		setStoryModalOpen(true);
	};
	const moveStory = (direction) => {
		if (!stories.length) return;
		const nextIndex = Math.max(0, Math.min(stories.length - 1, activeIndex + direction));
		setActiveStoryId(String(stories[nextIndex].id));
	};
	const handleToggleHighlight = async () => {
		if (!activeStory) return;
		try {
			setTogglingHighlight(true);
			await toggleStoryHighlight(activeStory.id);
			await load();
			pushToast({
				title: activeStory.highlight ? "تمت إزالة الهايلايت" : "تمت إضافة الهايلايت",
				description: `@${activeStory.username}`,
				type: "success"
			});
		} catch (err) {
			pushToast({
				title: "تعذر تحديث الهايلايت",
				description: err?.response?.data?.detail || "حاول مرة تانية.",
				type: "error"
			});
		} finally {
			setTogglingHighlight(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "dashboard-hero-grid small-gap",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-head split",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "Stories Control"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "التالي/السابق والـ Story Modal بقوا مربوطين مباشرة بالـ backend وبيعرضوا الوسائط الفعلية."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => load(),
					loading,
					children: loading ? "جارٍ التحديث..." : "تحديث"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "status-list compact-grid",
				children: stats.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })] }, item.label))
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "queue-grid compact-cards",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "queue-card compact admin-tone-violet",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "queue-label",
								children: "أفضل قصة الآن"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: stories[0]?.username || "—" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: stories[0]?.caption || "هتظهر هنا أعلى قصة مباشرة من الـ API." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "queue-card compact admin-tone-amber",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "queue-label",
								children: "الأرشيف"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: archive.length }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "آخر القصص المؤرشفة المتاحة للحساب الحالي." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "queue-card compact admin-tone-blue",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "queue-label",
								children: "Highlights"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: highlights.length }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "قصص محفوظة للعرض الطويل داخل الواجهة." })
						]
					})
				]
			}) })]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			title: "تعذر تحميل الستوري",
			description: error,
			onRetry: () => load({ preserveActive: false })
		}) : null,
		loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, { count: 6 }) : null,
		!loading && stories.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: "🎞️",
			title: "لا توجد قصص منشورة الآن",
			description: "عند وصول قصص جديدة من الـ backend هتظهر هنا تلقائياً.",
			actionLabel: "تحديث",
			onAction: () => load({ preserveActive: false })
		}) : null,
		!loading && stories.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "admin-deep-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "admin-rich-table-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-head split",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "section-title",
						children: "القصص الحية"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted no-margin",
						children: "اضغط على أي قصة لفتح الـ modal والتنقل بين القصص الفعلية."
					})] }), activeStory ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => openStory(activeStory.id),
						children: "فتح القصة الحالية"
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "table-shell admin-rich-table-shell",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "admin-table admin-rich-table",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "الناشر" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "المحتوى" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "المشاهدات" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "الردود" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "النوع" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "ينتهي" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "إجراء" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: stories.map((story) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "admin-rich-user-cell",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "admin-module-avatar",
									children: story.username.slice(0, 1).toUpperCase()
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: story.username }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: story.privacy })] })]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "content-cell compact",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: story.caption || "بدون كابشن" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: story.music || story.filter_name || "بدون ميتاداتا إضافية" })]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: story.views_count }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: story.replies_count }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `status-pill ${story.type === "video" ? "warning-soft" : "active"}`,
								children: story.type === "video" ? "فيديو" : "صورة"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDate$1(story.expires_at) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mini-action",
								onClick: () => openStory(story.id),
								children: "عرض القصة"
							}) })
						] }, story.id)) })]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-side-stack",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "admin-mini-list-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head split",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "section-title",
							children: "آخر أرشيف"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: archive.length
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "admin-activity-list",
						children: archive.slice(0, 6).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "admin-activity-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "admin-activity-dot tone-story" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["@", item.username] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.caption || "قصة مؤرشفة" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatDate$1(item.created_at) })
							] })]
						}, item.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "admin-mini-list-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head split",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "section-title",
							children: "Highlights الحالية"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: highlights.length
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "queue-grid compact-cards",
						children: highlights.length ? highlights.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "queue-card compact admin-tone-violet",
							style: {
								textAlign: "inherit",
								cursor: "pointer"
							},
							onClick: () => openStory(item.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "queue-label",
									children: ["@", item.username]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.caption || "Story Highlight" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									item.views_count,
									" مشاهدة • ",
									item.replies_count,
									" رد"
								] })
							]
						}, item.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "empty-state compact",
							children: "لا توجد Highlights حالياً."
						})
					})]
				})]
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: storyModalOpen && Boolean(activeStory),
			title: activeStory ? `Story • @${activeStory.username}` : "Story Viewer",
			onClose: () => setStoryModalOpen(false),
			children: activeStory ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [
					activeStory.type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: activeStory.media,
						controls: true,
						autoPlay: true,
						className: "media-viewer-asset"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: activeStory.media,
						alt: `story-${activeStory.username}`,
						className: "media-viewer-asset"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "profile-summary-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "avatar-circle large",
							children: activeStory.username.slice(0, 1).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["@", activeStory.username] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: activeStory.caption || "بدون كابشن"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "action-row",
								style: { marginTop: 8 },
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "glass-chip",
										children: activeStory.privacy
									}),
									activeStory.highlight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "glass-chip",
										children: "⭐ Highlight"
									}) : null,
									activeStory.music ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "glass-chip",
										children: ["🎵 ", activeStory.music]
									}) : null
								]
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "stats-inline-grid",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: activeStory.views_count }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "مشاهدة" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: activeStory.replies_count }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "رد" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: activeStory.reactions_count }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تفاعل" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatDate$1(activeStory.expires_at) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "انتهاء" })] })
						]
					}),
					activeStory.mentions.length || activeStory.stickers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "badge-wrap compact",
						children: [activeStory.mentions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "glass-chip",
							children: ["@", item]
						}, `mention-${item}`)), activeStory.stickers.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "glass-chip",
							children: item
						}, `sticker-${item}`))]
					}) : null,
					activeStory.replies.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "story-feedback-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "آخر الردود" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "admin-activity-list",
							style: { marginTop: 10 },
							children: activeStory.replies.slice(0, 5).map((reply, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "admin-activity-item",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "admin-activity-dot tone-live" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["@", reply.username] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: reply.text }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatDate$1(reply.created_at) })
								] })]
							}, `${reply.username}-${index}`))
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal-actions",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => moveStory(-1),
								disabled: activeIndex <= 0,
								children: "القصة السابقة"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: handleToggleHighlight,
								loading: togglingHighlight,
								children: activeStory.highlight ? "إزالة Highlight" : "إضافة Highlight"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => moveStory(1),
								disabled: activeIndex >= stories.length - 1,
								children: "القصة التالية"
							})
						]
					})
				]
			}) : null
		})
	] });
}
//#endregion
//#region src/components/admin/adminShared.js
function toArray(value) {
	return Array.isArray(value) ? value : [];
}
function formatCompactNumber(value, options = {}) {
	const number = Number(value || 0);
	if (!Number.isFinite(number)) return "0";
	if (options.currency) return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: options.currencyCode || "USD",
		maximumFractionDigits: 2
	}).format(number);
	return new Intl.NumberFormat("en-US", {
		notation: Math.abs(number) >= 1e3 ? "compact" : "standard",
		maximumFractionDigits: 1
	}).format(number);
}
function formatFullNumber(value) {
	const number = Number(value || 0);
	if (!Number.isFinite(number)) return "0";
	return new Intl.NumberFormat("en-US").format(number);
}
function formatDateTime(value) {
	if (!value) return "الآن";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "الآن";
	return date.toLocaleString("ar-EG", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function sampleActivity() {
	return [
		{
			id: "1",
			title: "PlayerOne بدأ بث جديد",
			description: "منذ دقائق قليلة",
			created_at: (/* @__PURE__ */ new Date()).toISOString(),
			level: "live"
		},
		{
			id: "2",
			title: "KhaledGamer نشر منشوراً جديداً",
			description: "محتوى تفاعلي جديد",
			created_at: (/* @__PURE__ */ new Date(Date.now() - 1e3 * 60 * 12)).toISOString(),
			level: "post"
		},
		{
			id: "3",
			title: "ShadowGirl استقبلت ردوداً على الستوري",
			description: "ارتفاع ملحوظ في التفاعل",
			created_at: (/* @__PURE__ */ new Date(Date.now() - 1e3 * 60 * 28)).toISOString(),
			level: "story"
		},
		{
			id: "4",
			title: "MoX انضم إلى مجموعة جديدة",
			description: "نشاط مجتمعي متزايد",
			created_at: (/* @__PURE__ */ new Date(Date.now() - 1e3 * 60 * 42)).toISOString(),
			level: "group"
		}
	];
}
function getStatusTone(status) {
	const value = String(status || "").toLowerCase();
	if ([
		"active",
		"featured",
		"live",
		"healthy",
		"linked",
		"seen"
	].includes(value)) return "success";
	if ([
		"warning",
		"pending",
		"review",
		"archived",
		"draft"
	].includes(value)) return "warning";
	if ([
		"danger",
		"critical",
		"ended",
		"ended_live",
		"offline",
		"banned"
	].includes(value)) return "danger";
	return "neutral";
}
function statusLabel(status) {
	const value = String(status || "").toLowerCase();
	if (value === "active") return "نشط";
	if (value === "featured") return "مميز";
	if (value === "live") return "مباشر";
	if (value === "healthy" || value === "linked") return "سليم";
	if (value === "warning" || value === "review") return "مراجعة";
	if (value === "pending") return "قيد الانتظار";
	if (value === "draft") return "مسودة";
	if (value === "archived") return "مؤرشف";
	if (value === "offline") return "غير متصل";
	if (value === "ended" || value === "ended_live") return "منتهي";
	if (value === "danger" || value === "critical") return "خطر";
	if (value === "banned") return "محظور";
	if (value === "seen") return "مقروء";
	return status || "—";
}
//#endregion
//#region src/components/admin/AdminSectionTemplate.jsx
function AdminSectionTemplate({ loading = false, error = "", onRetry, title, subtitle, badge, accent, stats = [], spotlight = [], tableTitle, tableDescription, columns = [], rows = [], rowKey = "id", emptyIcon = "📂", emptyTitle = "لا توجد بيانات بعد", emptyDescription = "ستظهر البيانات هنا تلقائياً عند توفرها.", asideTitle = "مؤشرات سريعة", asideItems = [], timelineTitle = "آخر النشاطات", timelineItems = [], primaryAction, secondaryAction }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "alert error",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "dashboard-hero-grid small-gap admin-section-hero-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "hero-card admin-hero-card admin-section-hero",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hero-card-topline",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: badge || "Admin Workspace"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "live-pill",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot live-dot" }), accent || "لوحة تشغيل مباشرة"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: title }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: subtitle }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hero-actions-wrap",
						children: [primaryAction ? primaryAction.to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							className: "btn btn-primary",
							to: primaryAction.to,
							children: primaryAction.label
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: primaryAction.onClick,
							children: primaryAction.label
						}) : null, secondaryAction ? secondaryAction.to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							className: "btn btn-secondary",
							to: secondaryAction.to,
							children: secondaryAction.label
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: secondaryAction.onClick,
							children: secondaryAction.label
						}) : null]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "spotlight-card admin-section-spotlight",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-head split",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "section-title",
						children: asideTitle
					}), onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onRetry,
						children: "تحديث"
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "status-list compact-grid admin-spotlight-grid",
					children: spotlight.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })] }, item.label))
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "admin-metric-grid",
			children: stats.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: `admin-metric-card tone-${item.tone || "neutral"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "admin-metric-icon",
					children: item.icon || "•"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-metric-copy",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value }),
						item.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.note }) : null
					]
				})]
			}, item.label))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "admin-deep-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "admin-rich-table-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head split",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "section-title",
							children: tableTitle
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "muted no-margin",
							children: tableDescription
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "badge",
							children: [formatFullNumber(rows.length), " عنصر"]
						})]
					}),
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "empty-state compact",
						children: "جارٍ تحميل البيانات..."
					}) : null,
					!loading && error && !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
						title: "تعذر تحميل البيانات",
						description: error,
						onRetry
					}) : null,
					!loading && !rows.length && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						icon: emptyIcon,
						title: emptyTitle,
						description: emptyDescription,
						actionLabel: onRetry ? "إعادة التحميل" : void 0,
						onAction: onRetry
					}) : null,
					!loading && rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "table-shell admin-rich-table-shell",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "admin-table admin-rich-table",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: column.label }, column.key)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((column) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: typeof column.render === "function" ? column.render(row, index) : row[column.key] }, column.key);
							}) }, row[rowKey] || `${index}-${row.title || row.name || "row"}`)) })]
						})
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-side-stack",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "admin-mini-list-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head split",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "section-title",
							children: "بطاقات المتابعة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: "Live"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "queue-grid compact-cards",
						children: asideItems.length ? asideItems.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `queue-card compact admin-tone-${item.tone || "neutral"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "queue-label",
									children: item.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.description })
							]
						}, `${item.label}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "empty-state compact",
							children: "لا توجد مؤشرات إضافية حالياً."
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "admin-mini-list-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head split",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "section-title",
							children: timelineTitle
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: "Feed"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "admin-activity-list",
						children: timelineItems.length ? timelineItems.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "admin-activity-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `admin-activity-dot tone-${getStatusTone(item.level || item.status)}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.title || item.label }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.description || item.body || "تم تسجيل نشاط جديد داخل النظام." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatDateTime(item.created_at || item.time) })
							] })]
						}, `${item.id || item.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "empty-state compact",
							children: "لا توجد نشاطات حديثة."
						})
					})]
				})]
			})]
		})
	] });
}
function renderStatus(status) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `status-pill ${getStatusTone(status)}`,
		children: statusLabel(status)
	});
}
//#endregion
//#region src/pages/admin/AdminReels.jsx
var reelUrl = (item) => item?.media_urls?.[0] || item?.media || item?.image_url || "";
var isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ""));
function AdminReels() {
	const [reels, setReels] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)("");
	const [activeReelId, setActiveReelId] = (0, import_react.useState)("");
	const [inlinePlayingId, setInlinePlayingId] = (0, import_react.useState)("");
	const [modalPlaying, setModalPlaying] = (0, import_react.useState)(false);
	const videoRefs = (0, import_react.useRef)({});
	const modalVideoRef = (0, import_react.useRef)(null);
	const load = async () => {
		try {
			setLoading(true);
			setError("");
			const { data } = await getPosts({
				skip: 0,
				limit: 30
			});
			const items = toArray(data).filter((item) => isVideo(reelUrl(item)));
			setReels(items);
			setActiveReelId((previous) => {
				if (previous && items.some((item) => String(item.id) === String(previous))) return previous;
				return String(items[0]?.id || "");
			});
		} catch (err) {
			setError(err?.response?.data?.detail || "تعذر تحميل بيانات الريلز.");
			setReels([]);
			setActiveReelId("");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	const activeReel = (0, import_react.useMemo)(() => reels.find((item) => String(item.id) === String(activeReelId)) || null, [activeReelId, reels]);
	(0, import_react.useEffect)(() => {
		if (!activeReel || !modalVideoRef.current) {
			setModalPlaying(false);
			return;
		}
		const video = modalVideoRef.current;
		video.currentTime = 0;
		video.play().then(() => setModalPlaying(true)).catch(() => setModalPlaying(false));
		return () => {
			video.pause();
			setModalPlaying(false);
		};
	}, [activeReel]);
	const stopAllInlineVideos = (exceptId = "") => {
		Object.entries(videoRefs.current).forEach(([id, node]) => {
			if (!node || String(id) === String(exceptId)) return;
			node.pause();
		});
	};
	const toggleInlinePlayback = async (reelId) => {
		const key = String(reelId);
		const video = videoRefs.current[key];
		if (!video) return;
		if (inlinePlayingId === key && !video.paused) {
			video.pause();
			setInlinePlayingId("");
			return;
		}
		stopAllInlineVideos(key);
		try {
			await video.play();
			setInlinePlayingId(key);
		} catch {
			setInlinePlayingId("");
		}
	};
	const openReelModal = (reel) => {
		setActiveReelId(String(reel?.id || ""));
	};
	const closeReelModal = () => {
		if (modalVideoRef.current) modalVideoRef.current.pause();
		setActiveReelId("");
		setModalPlaying(false);
	};
	const toggleModalPlayback = async () => {
		const video = modalVideoRef.current;
		if (!video) return;
		if (!video.paused) {
			video.pause();
			setModalPlaying(false);
			return;
		}
		try {
			await video.play();
			setModalPlaying(true);
		} catch {
			setModalPlaying(false);
		}
	};
	const engagementTotal = reels.reduce((sum, item) => sum + Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0), 0);
	const stats = [
		{
			label: "إجمالي الريلز",
			value: formatCompactNumber(reels.length || 0),
			icon: "🎬",
			tone: "violet",
			note: "مقاطع فيديو قصيرة مربوطة ببيانات المنشورات."
		},
		{
			label: "التفاعل",
			value: formatCompactNumber(engagementTotal || 0),
			icon: "🔥",
			tone: "green",
			note: "إجمالي اللايكات والتعليقات والمشاركات."
		},
		{
			label: "أفضل منشئ",
			value: reels[0]?.username || "—",
			icon: "🏆",
			tone: "amber",
			note: "أعلى ظهور حالي داخل البيانات المحملة."
		},
		{
			label: "جاهز للمعاينة",
			value: formatCompactNumber(reels.length),
			icon: "🛡️",
			tone: "blue",
			note: "يمكن تشغيل الريل وفتحه داخل Modal مباشرة."
		}
	];
	const spotlight = [
		{
			label: "أعلى تفاعل",
			value: formatCompactNumber(Math.max(...reels.map((item) => Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0)), 0))
		},
		{
			label: "أحدث ريل",
			value: reels[0]?.created_at ? formatDateTime(reels[0].created_at) : "—"
		},
		{
			label: "حالة الربط",
			value: reels.length ? "API متصل" : "لا توجد فيديوهات"
		}
	];
	const asideItems = [
		{
			label: "الريل المتصدر",
			value: reels[0]?.username || "—",
			description: reels[0]?.content || "سيظهر هنا وصف الريل الأعلى عند توفر البيانات.",
			tone: "success"
		},
		{
			label: "معاينة مباشرة",
			value: inlinePlayingId ? "نشطة" : "جاهزة",
			description: "تمت إضافة تشغيل/إيقاف مباشر داخل الجدول مع Modal للعرض الكامل.",
			tone: "violet"
		},
		{
			label: "مصدر البيانات",
			value: "Posts API",
			description: "الصفحة تسحب الفيديوهات تلقائياً من نفس مصدر المنشورات وتفلتر الريلز فقط.",
			tone: "amber"
		}
	];
	const timeline = reels.length ? reels.slice(0, 6).map((item) => ({
		id: item.id,
		title: item.username || "creator",
		description: item.content || "تم نشر ريل جديد.",
		created_at: item.created_at,
		level: "featured"
	})) : sampleActivity();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminSectionTemplate, {
		loading,
		error,
		onRetry: load,
		title: "إدارة الريلز",
		subtitle: "تم ربط صفحة إدارة الريلز بمصدر البيانات الحقيقي مع معاينة فيديو مباشرة، أزرار تشغيل/إيقاف، وModal لعرض الريل بالكامل وتحليل محتواه بسرعة.",
		badge: "Reels Studio",
		accent: "إدارة الفيديو القصير",
		stats,
		spotlight,
		tableTitle: "أحدث الريلز",
		tableDescription: "الجدول يسحب الريلز من Posts API، يفلتر الفيديوهات فقط، ويعرض معاينة فعلية مع إجراءات تشغيل وفتح Modal.",
		columns: [
			{
				key: "preview",
				label: "المعاينة",
				render: (row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: { width: 120 },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: (node) => {
							if (node) videoRefs.current[String(row.id)] = node;
							else delete videoRefs.current[String(row.id)];
						},
						src: row.reelSrc,
						muted: true,
						playsInline: true,
						preload: "metadata",
						poster: row.thumbnail_url || row.cover_url || "",
						onPause: () => setInlinePlayingId((current) => current === String(row.id) ? "" : current),
						onPlay: () => setInlinePlayingId(String(row.id)),
						style: {
							width: "100%",
							borderRadius: 14,
							background: "#111",
							maxHeight: 180,
							objectFit: "cover"
						}
					})
				})
			},
			{
				key: "content",
				label: "الريل",
				render: (row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-rich-user-cell",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "admin-module-avatar",
						children: "🎬"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.content?.slice(0, 36) || "ريل جديد" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: ["@", row.username || "creator"] })] })]
				})
			},
			{
				key: "engagement",
				label: "التفاعل",
				render: (row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatCompactNumber(row.engagement) })
			},
			{
				key: "comments_count",
				label: "التعليقات",
				render: (row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.comments_count || 0 })
			},
			{
				key: "share_count",
				label: "المشاركات",
				render: (row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.share_count || 0 })
			},
			{
				key: "adminStatus",
				label: "الحالة",
				render: (row) => renderStatus(row.adminStatus)
			},
			{
				key: "created_at",
				label: "التاريخ",
				render: (row) => formatDateTime(row.created_at)
			},
			{
				key: "actions",
				label: "الإجراءات",
				render: (row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "grid",
						gap: 8
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => toggleInlinePlayback(row.id),
						children: inlinePlayingId === String(row.id) ? "إيقاف" : "تشغيل"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => openReelModal(row),
						children: "فتح الريل"
					})]
				})
			}
		],
		rows: reels.map((item) => ({
			...item,
			adminStatus: Number(item.comments_count || 0) > 0 ? "active" : "review",
			engagement: Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0),
			reelSrc: reelUrl(item)
		})),
		emptyIcon: "🎬",
		emptyTitle: "لا توجد ريلز حالياً",
		emptyDescription: "عند توفر فيديوهات قصيرة سيتم عرضها هنا للإدارة والمعاينة الفعلية.",
		asideTitle: "استوديو الريلز",
		asideItems,
		timelineTitle: "تدفق الريلز",
		timelineItems: timeline,
		primaryAction: {
			to: "/admin/dashboard",
			label: "العودة للرئيسية"
		},
		secondaryAction: {
			to: "/reels",
			label: "فتح الريلز"
		}
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		open: Boolean(activeReel),
		title: activeReel ? `ريل @${activeReel.username || "creator"}` : "Reel Viewer",
		onClose: closeReelModal,
		children: activeReel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "grid",
				gap: 16
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					ref: modalVideoRef,
					src: reelUrl(activeReel),
					controls: true,
					playsInline: true,
					preload: "auto",
					poster: activeReel.thumbnail_url || activeReel.cover_url || "",
					onPause: () => setModalPlaying(false),
					onPlay: () => setModalPlaying(true),
					style: {
						width: "100%",
						borderRadius: 18,
						background: "#111",
						maxHeight: "70vh"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						flexWrap: "wrap",
						gap: 10
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: toggleModalPlayback,
						children: modalPlaying ? "إيقاف الريل" : "تشغيل الريل"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: closeReelModal,
						children: "إغلاق"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "queue-grid compact-cards",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "queue-card compact admin-tone-violet",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "queue-label",
									children: "المنشئ"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["@", activeReel.username || "creator"] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: activeReel.content || "بدون وصف." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "queue-card compact admin-tone-success",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "queue-label",
									children: "التفاعل"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatCompactNumber(Number(activeReel.likes || activeReel.like_count || 0) + Number(activeReel.comments_count || 0) + Number(activeReel.share_count || 0)) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "لايكات + تعليقات + مشاركات." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "queue-card compact admin-tone-amber",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "queue-label",
									children: "تاريخ النشر"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatDateTime(activeReel.created_at) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "تم ربط الـ Modal بنفس بيانات الـ API المحمّلة للصفحة." })
							]
						})
					]
				})
			]
		}) : null
	})] });
}
//#endregion
//#region src/pages/admin/AdminGroups.jsx
var initialForm = {
	name: "",
	description: "",
	members: ""
};
function formatDate(value) {
	if (!value) return "—";
	try {
		return new Date(value).toLocaleString("ar-EG");
	} catch {
		return "—";
	}
}
function AdminGroups() {
	const [groups, setGroups] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)("");
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [detailGroup, setDetailGroup] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)(initialForm);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [joiningGroupId, setJoiningGroupId] = (0, import_react.useState)("");
	const { pushToast } = useToast();
	const load = async () => {
		try {
			setLoading(true);
			setError("");
			const { data } = await getGroups();
			setGroups(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(err?.response?.data?.detail || "تعذر تحميل المجموعات.");
			setGroups([]);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	const stats = (0, import_react.useMemo)(() => {
		const members = groups.reduce((sum, item) => sum + Number(item.members_count || 0), 0);
		return [
			{
				label: "إجمالي المجموعات",
				value: groups.length
			},
			{
				label: "إجمالي الأعضاء",
				value: members
			},
			{
				label: "متوسط الأعضاء",
				value: groups.length ? Math.round(members / groups.length) : 0
			},
			{
				label: "آخر إضافات",
				value: groups.slice(0, 3).length
			}
		];
	}, [groups]);
	const openGroupModal = (group) => {
		setDetailGroup(group);
	};
	const syncDetailGroup = (groupId, nextGroup) => {
		if (!groupId) return;
		setDetailGroup((previous) => previous && String(previous.id) === String(groupId) ? nextGroup : previous);
	};
	const handleCreate = async () => {
		if (!form.name.trim()) {
			pushToast({
				title: "اسم المجموعة مطلوب",
				description: "اكتب اسم واضح قبل الإنشاء.",
				type: "warning"
			});
			return;
		}
		try {
			setSaving(true);
			const payload = {
				name: form.name.trim(),
				description: form.description.trim(),
				members: form.members.split(",").map((item) => item.trim()).filter(Boolean)
			};
			const { data } = await createGroup(payload);
			setCreateOpen(false);
			setForm(initialForm);
			pushToast({
				title: "تم إنشاء المجموعة",
				description: data?.name || payload.name,
				type: "success"
			});
			await load();
			if (data) setDetailGroup(data);
		} catch (err) {
			pushToast({
				title: "تعذر إنشاء المجموعة",
				description: err?.response?.data?.detail || "حاول مرة تانية.",
				type: "error"
			});
		} finally {
			setSaving(false);
		}
	};
	const handleJoin = async (group) => {
		try {
			setJoiningGroupId(String(group.id));
			const { data } = await joinGroup(group.id);
			setGroups((previous) => previous.map((item) => String(item.id) === String(group.id) ? data : item));
			syncDetailGroup(group.id, data);
			pushToast({
				title: data?.joined ? "تم الانضمام للمجموعة" : "أنت منضم بالفعل",
				description: data?.name || group.name,
				type: data?.joined ? "success" : "info"
			});
		} catch (err) {
			pushToast({
				title: "تعذر الانضمام",
				description: err?.response?.data?.detail || "حاول مرة تانية.",
				type: "error"
			});
		} finally {
			setJoiningGroupId("");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "dashboard-hero-grid small-gap",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-head split",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "section-title",
					children: "Groups Hub"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "أزرار Create / Join والـ Group Modal بقوا مربوطين بالـ API وبيعرضوا التفاصيل الفعلية للمجموعة."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "action-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => setCreateOpen(true),
						children: "إنشاء مجموعة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: load,
						loading,
						children: loading ? "جارٍ التحديث..." : "تحديث"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "status-list compact-grid",
				children: stats.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.value }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })] }, item.label))
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "queue-grid compact-cards",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "queue-card compact admin-tone-success",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "queue-label",
								children: "أكبر مجموعة"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: groups[0]?.name || "—" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: groups[0]?.description || "هتظهر هنا تفاصيل المجموعة الأعلى في القائمة." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "queue-card compact admin-tone-blue",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "queue-label",
								children: "صاحب المجموعة الأولى"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: groups[0]?.owner_username || "—" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "مستخرج مباشرة من بيانات الـ backend." })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "queue-card compact admin-tone-amber",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "queue-label",
								children: "جاهزية الانضمام"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Live" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "تقدر تنضم للمجموعة وتتابع تحديث عدد الأعضاء فوراً." })
						]
					})
				]
			}) })]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			title: "تعذر تحميل المجموعات",
			description: error,
			onRetry: load
		}) : null,
		loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, { count: 5 }) : null,
		!loading && groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: "👥",
			title: "لا توجد مجموعات بعد",
			description: "أنشئ أول مجموعة من الزر اللي فوق وهتظهر هنا فوراً.",
			actionLabel: "إنشاء مجموعة",
			onAction: () => setCreateOpen(true)
		}) : null,
		!loading && groups.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "admin-deep-grid",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "admin-rich-table-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-head split",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "section-title",
						children: "قائمة المجموعات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted no-margin",
						children: "افتح التفاصيل أو انضم لأي مجموعة مباشرة من الجدول."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "badge",
						children: groups.length
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "table-shell admin-rich-table-shell",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "admin-table admin-rich-table",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "المجموعة" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "الوصف" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "المالك" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "الأعضاء" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "الإنشاء" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "إجراءات" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "admin-rich-user-cell",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "admin-module-avatar",
									children: "👥"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: group.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: ["#", group.id] })] })]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "content-cell compact",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: group.description || "بدون وصف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: group.members?.slice(0, 3).join(" • ") || "لا توجد أسماء أعضاء بعد" })]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: ["@", group.owner_username] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: group.members_count || group.members?.length || 0 }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDate(group.created_at) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "action-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mini-action",
									onClick: () => openGroupModal(group),
									children: "عرض التفاصيل"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									className: "group-join-btn",
									loading: joiningGroupId === String(group.id),
									onClick: () => handleJoin(group),
									children: joiningGroupId === String(group.id) ? "جارٍ الانضمام..." : "انضمام"
								})]
							}) })
						] }, group.id)) })]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-side-stack",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "admin-mini-list-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head split",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "section-title",
							children: "آخر المجموعات"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: "Feed"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "admin-activity-list",
						children: groups.slice(0, 6).map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "admin-activity-item",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "admin-activity-dot tone-group" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: group.name }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: group.description || "تم إنشاء مجموعة جديدة." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatDate(group.created_at) })
							] })]
						}, group.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "admin-mini-list-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-head split",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "section-title",
							children: "مؤشرات سريعة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "badge",
							children: "Live"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "queue-grid compact-cards",
						children: groups.slice(0, 3).map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "queue-card compact admin-tone-violet",
							style: {
								textAlign: "inherit",
								cursor: "pointer"
							},
							onClick: () => openGroupModal(group),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "queue-label",
									children: group.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [group.members_count || 0, " عضو"] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["المالك: @", group.owner_username] })
							]
						}, group.id))
					})]
				})]
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: createOpen,
			title: "إنشاء مجموعة جديدة",
			onClose: () => setCreateOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "اسم المجموعة",
						value: form.name,
						onChange: (event) => setForm((prev) => ({
							...prev,
							name: event.target.value
						})),
						placeholder: "مثال: فريق الدعم"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "field-label",
							children: "وصف المجموعة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "input textarea",
							rows: "4",
							value: form.description,
							onChange: (event) => setForm((prev) => ({
								...prev,
								description: event.target.value
							})),
							placeholder: "اكتب وصف مختصر للمجموعة"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "أعضاء مبدئيون",
						hint: "افصل الأسماء بفاصلة",
						value: form.members,
						onChange: (event) => setForm((prev) => ({
							...prev,
							members: event.target.value
						})),
						placeholder: "ahmed, sara, nour"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setCreateOpen(false),
							children: "إلغاء"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleCreate,
							loading: saving,
							children: saving ? "جارٍ الإنشاء..." : "إنشاء المجموعة"
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: Boolean(detailGroup),
			title: detailGroup ? detailGroup.name : "تفاصيل المجموعة",
			onClose: () => setDetailGroup(null),
			children: detailGroup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "profile-summary-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "avatar-circle large",
							children: "👥"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: detailGroup.name }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "muted",
								children: ["بواسطة @", detailGroup.owner_username]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "glass-chip",
								style: { marginTop: 8 },
								children: ["#", detailGroup.id]
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "story-feedback-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "الوصف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							style: { marginTop: 8 },
							children: detailGroup.description || "بدون وصف"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "stats-inline-grid",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: detailGroup.members_count || detailGroup.members?.length || 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "أعضاء" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["@", detailGroup.owner_username] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "المالك" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatDate(detailGroup.created_at) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تاريخ الإنشاء" })] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "story-feedback-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "قائمة الأعضاء" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "badge-wrap compact",
							style: { marginTop: 10 },
							children: (detailGroup.members || []).length ? detailGroup.members.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "glass-chip",
								children: ["@", member]
							}, member)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "muted",
								children: "لا يوجد أعضاء معروضين."
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => handleJoin(detailGroup),
							loading: joiningGroupId === String(detailGroup.id),
							children: joiningGroupId === String(detailGroup.id) ? "جارٍ الانضمام..." : "انضمام للمجموعة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => setDetailGroup(null),
							children: "إغلاق"
						})]
					})
				]
			}) : null
		})
	] });
}
//#endregion
export { AdminChat, AdminDashboard, AdminGroups, AdminLive, AdminNotifications, AdminPosts, AdminRbac, AdminReels, AdminSettings, AdminStories };
