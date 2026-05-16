import { j as jsxRuntimeExports, L as Link, aa as NavLink, r as reactExports, u as useNavigate, b as getStoredUser, c as clearStoredUser, a as useLocation, e as useToast, ad as getAuthToken, h as socketManager, A as API, B as Button, ae as TableSkeleton, af as AdminOverviewSkeleton, P as PRIMARY_ADMIN_EMAIL, p as getChatThreads, ag as restoreMessage, V as getMessages, l as ListSkeleton } from "../index-D6u1FUhW.js";
import { u as useDebouncedValue, s as searchAdmin, g as getAdminNotifications, c as getAdminOverview, e as getAdminPosts, m as moderatePostAI, t as toggleShadowBan, f as bulkUpdatePostStatus, h as broadcastAdminNotification, i as getAdminLiveOverview, j as endAdminLiveRoom, k as getAdminReportsSummary, l as updateReportStatus, n as escalateReport, o as getAdminSettings, p as updateAdminSettings, q as changeAdminPassword, r as getAdminRbac, v as getAdminUsers, a as updateAdminUser } from "./useDebouncedValue-BcUj6oW-.js";
import { h as logoutUser } from "./auth-B1x7DPWW.js";
import { C as Card } from "./Card-r3PaFA5D.js";
import { g as getDeviceProfile } from "./deviceProfile-DTy4urT5.js";
import { I as Input } from "./Input-seVNQLEe.js";
import { M as Modal } from "./Modal-TdtOGZ1q.js";
import { E as EmptyState } from "./EmptyState-ClJjbgqU.js";
import { E as ErrorState } from "./ErrorState-BLxz9IXV.js";
import { v as viewStory, g as getStories, c as getStoryAnalyticsSummary, a as getStoryArchive, d as getStoryHighlights, t as toggleStoryHighlight } from "./stories-D_IGhHok.js";
import { g as getPosts } from "./posts-Q6IL2Y7w.js";
import { g as getGroups, c as createGroup, j as joinGroup } from "./groups-D2AEuPFy.js";
import "./proxy-npyH2_t3.js";
function Breadcrumbs({ items = [] }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "breadcrumbs", children: items.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "breadcrumb-item", children: [
    item.to ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: item.to, children: item.label }) : /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.label }),
    index < items.length - 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "breadcrumb-separator", children: "/" }) : null
  ] }, `${item.label}-${index}`)) });
}
const groups = [
  {
    title: "إدارة المحتوى",
    items: [
      { to: "/admin/dashboard", label: "لوحة التحكم", icon: "◈", permission: "dashboard.view" },
      { to: "/admin/posts", label: "المنشورات", icon: "✦", permission: "posts.view" },
      { to: "/admin/stories", label: "الستوري", icon: "◎", permission: "dashboard.view" },
      { to: "/admin/reels", label: "الريلز", icon: "▶", permission: "dashboard.view" },
      { to: "/admin/live", label: "البث المباشر", icon: "◉", permission: "live.manage", badge: "LIVE" },
      { to: "/admin/chat", label: "الشات", icon: "✉", permission: "dashboard.view" },
      { to: "/admin/groups", label: "المجموعات", icon: "◌", permission: "dashboard.view" }
    ]
  },
  {
    title: "الإدارة",
    items: [
      { to: "/admin/users", label: "المستخدمون", icon: "◍", permission: "users.view" },
      { to: "/admin/rbac", label: "الصلاحيات", icon: "⌘", permission: "rbac.view" },
      { to: "/admin/notifications", label: "الإشعارات", icon: "◔", permission: "notifications.manage" },
      { to: "/admin/reports", label: "مركز البلاغات", icon: "▣", permission: "reports.view", badge: "HOT" },
      { to: "/admin/audit", label: "سجل الأدمن", icon: "⧉", permission: "dashboard.view" },
      { to: "/admin/settings", label: "الإعدادات", icon: "⚙", permission: "settings.manage" }
    ]
  }
];
function AdminSidebar({ collapsed, permissions = [], role = "user" }) {
  const isAllowed = (permission) => !permission || role === "admin" || permissions.includes(permission);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: `admin-sidebar admin-reference-sidebar ${collapsed ? "collapsed" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-brand admin-reference-brand", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brand-logo brand-logo-reference", children: "YS" }),
      !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Yamshat Admin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "لوحة إدارة عربية احترافية" })
      ] }) : null
    ] }),
    !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-sidebar-usercard", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-avatar", children: "A" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "المدير العام" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Super Admin" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-status", children: "متصل" })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-scroll", children: groups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-sidebar-group", children: [
      !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-group-title", children: group.title }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "admin-nav admin-reference-nav", children: group.items.filter((item) => isAllowed(item.permission)).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, className: ({ isActive }) => `admin-nav-link admin-reference-link ${isActive ? "active" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-nav-icon admin-reference-icon", children: item.icon }),
        !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }) : null,
        !collapsed && item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("em", { className: "admin-nav-badge", children: item.badge }) : null
      ] }, item.to)) })
    ] }, group.title)) }),
    !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sidebar-promo admin-reference-promo", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "واجهة محسّنة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "تم إضافة مركز بلاغات كامل، سجل تدقيق للأدمن، وإحصائيات حية مع تحسينات للجوال والريلز لتقليل استهلاك الذاكرة وتحسين الأداء على الأجهزة الضعيفة." })
    ] }) : null
  ] });
}
function AdminTopbar({ title, onToggleSidebar, notifications = [] }) {
  const [query, setQuery] = reactExports.useState("");
  const [results, setResults] = reactExports.useState({ users: [], posts: [] });
  const [open, setOpen] = reactExports.useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();
  const debouncedQuery = useDebouncedValue(query, 350);
  const unreadCount = reactExports.useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);
  reactExports.useEffect(() => {
    let active = true;
    if (!debouncedQuery.trim()) {
      setResults({ users: [], posts: [] });
      return void 0;
    }
    searchAdmin(debouncedQuery).then(({ data }) => {
      if (active) setResults(data || { users: [], posts: [] });
    }).catch(() => {
      if (active) setResults({ users: [], posts: [] });
    });
    return () => {
      active = false;
    };
  }, [debouncedQuery]);
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
    }
    clearStoredUser();
    navigate("/login", { replace: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "admin-topbar admin-reference-topbar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-topbar-search-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ghost-btn icon-btn admin-menu-toggle", onClick: onToggleSidebar, children: "☰" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-search-box admin-reference-search-box", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⌕" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "بحث عن مستخدم، بث، منشور..." }),
        results.users.length || results.posts.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "search-results-panel", children: [
          results.users.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "المستخدمون" }),
            results.users.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "search-result-item", onClick: () => navigate("/admin/users"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: item.role })
            ] }, item.id))
          ] }) : null,
          results.posts.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "المنشورات" }),
            results.posts.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "search-result-item", onClick: () => navigate("/admin/posts"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: item.content?.slice(0, 42) })
            ] }, item.id))
          ] }) : null
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-topbar-meta-block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "page-eyebrow", children: "لوحة التحكم" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "page-title admin-reference-title", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "topbar-meta-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "live-pill", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-dot live-dot" }),
          "تحديث لحظي"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "deploy-pill", children: "واجهة RTL داكنة محسّنة" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "topbar-controls admin-reference-controls", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ghost-btn notification-button admin-reference-utility", onClick: () => setOpen((prev) => !prev), children: [
        "🔔",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: unreadCount })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "ghost-btn admin-reference-utility", to: "/admin/reports", children: "📈" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "ghost-btn admin-reference-utility", to: "/admin/notifications", children: "✉" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "profile-pill admin-profile-pill admin-reference-profile", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-reference-profile-avatar", children: (user?.username || "A").slice(0, 1).toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user?.username || "admin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: user?.role || "admin" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ghost-btn", onClick: handleLogout, children: "خروج" }),
      open ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "notification-popover", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "notification-popover-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "آخر الإشعارات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin/notifications", children: "عرض الكل" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "notification-popover-list", children: [
          notifications.slice(0, 5).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "notification-popover-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.body })
          ] }, item.id)),
          !notifications.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state compact", children: "لا توجد إشعارات حالياً." }) : null
        ] })
      ] }) : null
    ] })
  ] });
}
const routeMeta = {
  "/admin/dashboard": { title: "لوحة التحكم", breadcrumb: ["الإدارة", "الرئيسية"] },
  "/admin/posts": { title: "إدارة المنشورات", breadcrumb: ["الإدارة", "المنشورات"] },
  "/admin/content": { title: "إدارة المنشورات", breadcrumb: ["الإدارة", "المنشورات"] },
  "/admin/chat": { title: "إدارة الشات", breadcrumb: ["الإدارة", "الشات"] },
  "/admin/stories": { title: "إدارة الستوري", breadcrumb: ["الإدارة", "الستوري"] },
  "/admin/reels": { title: "إدارة الريلز", breadcrumb: ["الإدارة", "الريلز"] },
  "/admin/groups": { title: "إدارة المجموعات", breadcrumb: ["الإدارة", "المجموعات"] },
  "/admin/live": { title: "إدارة البث المباشر", breadcrumb: ["الإدارة", "البث"] },
  "/admin/users": { title: "إدارة المستخدمين", breadcrumb: ["الإدارة", "المستخدمون"] },
  "/admin/rbac": { title: "الأدوار والصلاحيات", breadcrumb: ["الإدارة", "الصلاحيات"] },
  "/admin/notifications": { title: "الإشعارات", breadcrumb: ["الإدارة", "الإشعارات"] },
  "/admin/reports": { title: "مركز البلاغات والإشراف", breadcrumb: ["الإدارة", "مركز البلاغات"] },
  "/admin/audit": { title: "سجل نشاط الأدمن", breadcrumb: ["الإدارة", "سجل الأدمن"] },
  "/admin/settings": { title: "الإعدادات العامة", breadcrumb: ["الإدارة", "الإعدادات"] }
};
function AdminLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = reactExports.useState(false);
  const [notifications, setNotifications] = reactExports.useState([]);
  const { pushToast } = useToast();
  const user = getStoredUser();
  const token = getAuthToken();
  const meta = routeMeta[location.pathname] || routeMeta["/admin/dashboard"];
  const breadcrumbs = reactExports.useMemo(
    () => meta.breadcrumb.map((label, index) => ({ label, to: index === meta.breadcrumb.length - 1 ? "" : "/admin/dashboard" })),
    [meta]
  );
  reactExports.useEffect(() => {
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
    if (!socketManager.connected) socketManager.connect();
    socketManager.emit("register_user", { token, user: user?.username });
    const onAdminNotification = (payload) => {
      pushToast({ title: payload?.title || "إشعار مباشر", description: payload?.body || "تم وصول تحديث جديد.", type: "info" });
      setNotifications((prev) => [{ id: `${Date.now()}`, ...payload, is_read: false }, ...prev].slice(0, 20));
    };
    const syncEvents = ["admin:user_updated", "admin:user_status_changed", "admin:user_deleted", "admin:post_created", "admin:post_updated", "admin:post_deleted", "admin:posts_bulk_deleted", "admin:live_updated"];
    socketManager.on("admin:notification", onAdminNotification);
    syncEvents.forEach((eventName) => socketManager.on(eventName, loadNotifications));
    return () => {
      active = false;
      socketManager.off("admin:notification", onAdminNotification);
      syncEvents.forEach((eventName) => socketManager.off(eventName, loadNotifications));
    };
  }, [pushToast, token, user?.username]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-app-shell admin-reference-shell", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AdminSidebar, { collapsed, permissions: user?.permissions || [], role: user?.role || "user" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-main-shell", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AdminTopbar, { title: meta.title, onToggleSidebar: () => setCollapsed((prev) => !prev), notifications }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "admin-page-shell admin-reference-page-shell", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Breadcrumbs, { items: breadcrumbs }),
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bottom-mobile-nav", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "nav-btn", href: "/", children: [
            "🏠",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الرئيسية" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "nav-btn", href: "/reels", children: [
            "🎬",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الريلز" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "add-btn", children: "+" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "nav-btn", href: "/messages", children: [
            "💬",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الدردشة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "nav-btn", href: "/profile", children: [
            "👤",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "حسابي" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function buildPoints(data, width, height) {
  if (!data.length) return "";
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  return data.map((item, index) => {
    const x = index / Math.max(data.length - 1, 1) * width;
    const y = height - (Number(item.value) || 0) / max * height;
    return `${x},${y}`;
  }).join(" ");
}
function LineChart({ data = [] }) {
  const width = 320;
  const height = 140;
  const points = buildPoints(data, width, height);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chart-shell", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${width} ${height + 16}`, className: "chart-svg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { fill: "none", stroke: "url(#lineGradient)", strokeWidth: "4", points, strokeLinecap: "round", strokeLinejoin: "round" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "lineGradient", x1: "0", y1: "0", x2: "1", y2: "1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#8b5cf6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#22d3ee" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chart-label-row", children: data.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }, item.label)) })
  ] });
}
function BarChart({ data = [] }) {
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bar-chart", children: data.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bar-item", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bar-track", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bar-value", style: { height: `${Math.max((Number(item.value) || 0) / max * 100, 8)}%` } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
  ] }, item.label)) });
}
function DonutChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 1;
  let start = 0;
  const palette = ["#8b5cf6", "#06b6d4", "#f97316", "#22c55e", "#ec4899"];
  const segments = data.map((item, index) => {
    const value = Number(item.value) || 0;
    const end = start + value / total * 360;
    const color = palette[index % palette.length];
    const segment = `${color} ${start}deg ${end}deg`;
    start = end;
    return segment;
  }).join(", ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "donut-wrap", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "donut-chart", style: { background: `conic-gradient(${segments || "#8b5cf6 0 360deg"})` }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "donut-hole", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: total }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إجمالي" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "legend-list", children: data.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "legend-item", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "legend-dot", style: { background: palette[index % palette.length] } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value })
    ] }, item.label)) })
  ] });
}
const CACHE_KEY_PREFIX = "admin_cache_";
const CACHE_TTL_MS = 5 * 60 * 1e3;
const ANALYTICS_CACHE_TTL_MS = 15 * 60 * 1e3;
const adminService = {
  /**
   * Gets cached data or fetches from API
   */
  async getCachedData(key, fetcher, ttl = CACHE_TTL_MS) {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
    const cached = this.getFromCache(cacheKey);
    if (cached && !this.isCacheExpired(cacheKey)) {
      return cached;
    }
    try {
      const data = await fetcher();
      this.setInCache(cacheKey, data, ttl);
      return data;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  },
  /**
   * Gets data from localStorage cache
   */
  getFromCache(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const { data } = JSON.parse(item);
      return data;
    } catch (error) {
      console.warn("Failed to get cache:", error);
      return null;
    }
  },
  /**
   * Sets data in localStorage cache
   */
  setInCache(key, data, ttl = CACHE_TTL_MS) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl
        })
      );
    } catch (error) {
      console.warn("Failed to set cache:", error);
    }
  },
  /**
   * Checks if cache is expired
   */
  isCacheExpired(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return true;
      const { timestamp, ttl } = JSON.parse(item);
      return Date.now() - timestamp > ttl;
    } catch (error) {
      return true;
    }
  },
  /**
   * Clears cache for a specific key
   */
  clearCache(key) {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  },
  /**
   * Clears all admin cache
   */
  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear all cache:", error);
    }
  },
  // ============ OVERVIEW ============
  /**
   * Gets admin overview with caching
   */
  async getOverview() {
    return this.getCachedData("overview", async () => {
      const { data } = await API.get("/admin/overview");
      return data;
    }, CACHE_TTL_MS);
  },
  // ============ USERS ============
  /**
   * Gets admin users with caching and filters
   */
  async getUsers(params = {}) {
    const cacheKey = `users_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/users", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Gets single user details
   */
  async getUser(userId) {
    return this.getCachedData(`user_${userId}`, async () => {
      const { data } = await API.get(`/admin/users/${userId}`);
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Bans or unbans user
   */
  async banUser(userId, restore = false) {
    const response = await API.post(`/admin/users/${userId}/ban`, null, {
      params: { restore }
    });
    this.clearCache(`users_*`);
    this.clearCache(`user_${userId}`);
    return response.data;
  },
  /**
   * Toggles shadow ban for user
   */
  async toggleShadowBan(userId, enabled = true) {
    const response = await API.post(`/admin/users/${userId}/shadow-ban`, null, {
      params: { enabled }
    });
    this.clearCache(`user_${userId}`);
    return response.data;
  },
  /**
   * Gets ban history with caching
   */
  async getBanHistory(limit = 30) {
    return this.getCachedData(`ban_history_${limit}`, async () => {
      const { data } = await API.get("/admin/users/ban-history", {
        params: { limit }
      });
      return data;
    }, CACHE_TTL_MS);
  },
  // ============ ANALYTICS ============
  /**
   * Gets analytics dashboard data with caching
   */
  async getAnalyticsDashboard() {
    return this.getCachedData("analytics_dashboard", async () => {
      const { data } = await API.get("/admin/analytics/dashboard");
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets user analytics with caching
   */
  async getUserAnalytics(params = {}) {
    const cacheKey = `user_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/analytics/users", { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets content analytics with caching
   */
  async getContentAnalytics(params = {}) {
    const cacheKey = `content_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/analytics/content", { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets engagement analytics with caching
   */
  async getEngagementAnalytics(params = {}) {
    const cacheKey = `engagement_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/analytics/engagement", { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets system health metrics with caching
   */
  async getSystemHealth() {
    return this.getCachedData("system_health", async () => {
      const { data } = await API.get("/admin/analytics/system-health");
      return data;
    }, 3e4);
  },
  // ============ AUDIT LOGS ============
  /**
   * Gets audit logs with caching
   */
  async getAuditLogs(params = {}) {
    const cacheKey = `audit_logs_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/audit-logs", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Gets audit logs for specific user
   */
  async getUserAuditLogs(userId, params = {}) {
    const cacheKey = `user_audit_logs_${userId}_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get(`/admin/audit-logs/user/${userId}`, { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Logs admin action
   */
  async logAction(action, details = {}) {
    try {
      await API.post("/admin/audit-logs", {
        action,
        details,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Failed to log action:", error);
    }
  },
  /**
   * Gets audit logs summary
   */
  async getAuditLogsSummary(params = {}) {
    const cacheKey = `audit_logs_summary_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/audit-logs/summary", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  // ============ REPORTS ============
  /**
   * Gets reports summary with caching
   */
  async getReportsSummary(params = {}) {
    const cacheKey = `reports_summary_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/reports/summary", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Updates report status
   */
  async updateReportStatus(reportId, status) {
    const response = await API.post(`/admin/reports/${reportId}/status`, { status });
    this.clearCache("reports_summary_*");
    return response.data;
  },
  /**
   * Escalates report
   */
  async escalateReport(reportId) {
    const response = await API.post(`/admin/reports/${reportId}/escalate`);
    this.clearCache("reports_summary_*");
    return response.data;
  },
  // ============ POSTS ============
  /**
   * Gets admin posts with caching
   */
  async getPosts(params = {}) {
    const cacheKey = `admin_posts_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await API.get("/admin/posts", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Moderates post with AI
   */
  async moderatePostAI(postId) {
    const response = await API.post(`/admin/posts/${postId}/moderate-ai`);
    this.clearCache("admin_posts_*");
    return response.data;
  },
  /**
   * Bulk updates post status
   */
  async bulkUpdatePostStatus(ids, status) {
    const response = await API.post("/admin/posts/bulk-update-status", { ids, status });
    this.clearCache("admin_posts_*");
    return response.data;
  },
  // ============ SETTINGS ============
  /**
   * Gets admin settings with caching
   */
  async getSettings() {
    return this.getCachedData("admin_settings", async () => {
      const { data } = await API.get("/admin/settings");
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Updates admin settings
   */
  async updateSettings(settings) {
    const response = await API.put("/admin/settings", settings);
    this.clearCache("admin_settings");
    return response.data;
  },
  // ============ EXPORTS ============
  /**
   * Exports admin report
   */
  async exportReport(format = "csv") {
    const response = await API.get("/admin/reports/export", {
      params: { format },
      responseType: "blob"
    });
    return response.data;
  },
  /**
   * Exports users data
   */
  async exportUsers(format = "csv") {
    const response = await API.get("/admin/users/export", {
      params: { format },
      responseType: "blob"
    });
    return response.data;
  },
  /**
   * Exports analytics data
   */
  async exportAnalytics(format = "csv") {
    const response = await API.get("/admin/analytics/export", {
      params: { format },
      responseType: "blob"
    });
    return response.data;
  },
  // ============ UTILITY ============
  /**
   * Gets cache statistics
   */
  getCacheStats() {
    const stats = {
      totalItems: 0,
      totalSize: 0,
      items: []
    };
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const item = localStorage.getItem(key);
          const size = item ? item.length : 0;
          stats.totalItems++;
          stats.totalSize += size;
          stats.items.push({
            key: key.replace(CACHE_KEY_PREFIX, ""),
            size,
            expired: this.isCacheExpired(key)
          });
        }
      });
    } catch (error) {
      console.warn("Failed to get cache stats:", error);
    }
    return stats;
  }
};
function fallbackOverview() {
  const now = Date.now();
  const trafficHistory = Array.from({ length: 8 }, (_, index) => ({
    label: `${index + 9}:00`,
    value: 1200 + index * 190 + index % 2 * 140
  }));
  const growthHistory = Array.from({ length: 7 }, (_, index) => ({
    label: `D${index + 1}`,
    value: 4 + index * 1.6 + index % 3 * 0.8
  }));
  const auditLogs = Array.from({ length: 7 }, (_, index) => ({
    id: `AUD-${index + 1}`,
    type: index === 0 ? "critical" : index % 2 ? "warning" : "info",
    message: index === 0 ? "تم تسجيل خروج إجباري لعدة جلسات غير موثقة." : `إجراء إداري رقم ${index + 1} تم بنجاح.`,
    admin_name: ["Super Admin", "Content Lead", "Security Admin"][index % 3],
    timestamp: new Date(now - index * 12 * 60 * 1e3).toISOString()
  }));
  const activityStream = Array.from({ length: 6 }, (_, index) => ({
    id: `ACT-${index + 1}`,
    action: ["New report", "Post approved", "Live room flagged", "User restored"][index % 4],
    description: "تحديث حي على لوحة الإدارة مرتبط بالـ socket أو polling.",
    timestamp: new Date(now - index * 7 * 60 * 1e3).toISOString()
  }));
  return {
    metrics: {
      active_users: 4860,
      traffic_per_minute: 1284,
      growth_rate: 12.4,
      live_metrics_score: 91,
      moderation_queue: 34,
      reports_open: 18,
      cpu_usage: 42,
      memory_usage: 51,
      disk_usage: 39,
      api_response_time: 182,
      traffic_history: trafficHistory,
      growth_history: growthHistory,
      audience_mix: [
        { label: "Android", value: 58 },
        { label: "iOS", value: 23 },
        { label: "Web", value: 19 }
      ],
      live_mix: [
        { label: "Live rooms", value: 16 },
        { label: "Reels now", value: 41 },
        { label: "Stories active", value: 22 }
      ]
    },
    audit_logs: auditLogs,
    activity_stream: activityStream
  };
}
function normalizeOverview(payload) {
  const fallback = fallbackOverview();
  const source = payload?.metrics ? payload : fallback;
  const metrics = { ...fallback.metrics, ...source.metrics || {} };
  return {
    metrics: {
      ...metrics,
      traffic_history: Array.isArray(metrics.traffic_history) && metrics.traffic_history.length ? metrics.traffic_history : fallback.metrics.traffic_history,
      growth_history: Array.isArray(metrics.growth_history) && metrics.growth_history.length ? metrics.growth_history : fallback.metrics.growth_history,
      audience_mix: Array.isArray(metrics.audience_mix) && metrics.audience_mix.length ? metrics.audience_mix : fallback.metrics.audience_mix,
      live_mix: Array.isArray(metrics.live_mix) && metrics.live_mix.length ? metrics.live_mix : fallback.metrics.live_mix
    },
    audit_logs: Array.isArray(source.audit_logs) && source.audit_logs.length ? source.audit_logs : fallback.audit_logs,
    activity_stream: Array.isArray(source.activity_stream) && source.activity_stream.length ? source.activity_stream : fallback.activity_stream
  };
}
function getPerformanceSnapshot() {
  const profile = getDeviceProfile();
  const store = typeof window !== "undefined" ? window.__YAMSHAT_PERF__ : null;
  const memory = typeof window !== "undefined" ? window.performance?.memory : null;
  const navigationEntries = typeof performance !== "undefined" ? performance.getEntriesByType?.("navigation") || [] : [];
  const nav = navigationEntries[0];
  return {
    jsHeapMb: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
    longTasks: Number(store?.longTasks || 0),
    metricCount: Number(store?.metrics?.length || 0),
    ttfb: nav ? Math.round(nav.responseStart || 0) : 0,
    lowEnd: profile.isLowEndDevice,
    connection: profile.effectiveType,
    quality: profile.preferredVideoQuality
  };
}
function levelTone(level = "info") {
  if (["critical", "error"].includes(level)) return "#ef4444";
  if (["warning", "pending"].includes(level)) return "#f97316";
  return "#22c55e";
}
function AdminDashboard() {
  const { pushToast } = useToast();
  const [dashboard, setDashboard] = reactExports.useState(() => normalizeOverview(fallbackOverview()));
  const [performanceSnapshot, setPerformanceSnapshot] = reactExports.useState(() => getPerformanceSnapshot());
  const [refreshInterval, setRefreshInterval] = reactExports.useState(7e3);
  const [loading, setLoading] = reactExports.useState(true);
  const [tableFilter, setTableFilter] = reactExports.useState("all");
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const loadDashboard = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const [overviewResponse, auditResponse] = await Promise.allSettled([
        getAdminOverview(),
        adminService.getAuditLogs({ limit: 12 })
      ]);
      const overviewPayload = overviewResponse.status === "fulfilled" ? overviewResponse.value.data : fallbackOverview();
      const normalized = normalizeOverview(overviewPayload);
      if (auditResponse.status === "fulfilled") {
        normalized.audit_logs = Array.isArray(auditResponse.value?.items) ? auditResponse.value.items.slice(0, 10) : normalized.audit_logs;
      }
      setDashboard(normalized);
      setPerformanceSnapshot(getPerformanceSnapshot());
    } catch (error) {
      setDashboard(normalizeOverview(fallbackOverview()));
      pushToast({ type: "warning", title: "Fallback analytics active", description: error?.response?.data?.detail || "تعذر تحميل بعض المقاييس الحية." });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);
  reactExports.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  reactExports.useEffect(() => {
    const timer = window.setInterval(() => {
      loadDashboard();
      setPerformanceSnapshot(getPerformanceSnapshot());
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [loadDashboard, refreshInterval]);
  reactExports.useEffect(() => {
    const onMetric = () => setPerformanceSnapshot(getPerformanceSnapshot());
    const onMemoryCritical = () => pushToast({ type: "warning", title: "ذاكرة المتصفح مرتفعة", description: "تم رصد استهلاك عالٍ للذاكرة على الجهاز الحالي." });
    const onRealtimeMetrics = (nextMetrics) => {
      setDashboard((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          ...nextMetrics,
          traffic_history: Array.isArray(nextMetrics?.traffic_history) && nextMetrics.traffic_history.length ? nextMetrics.traffic_history : prev.metrics.traffic_history,
          growth_history: Array.isArray(nextMetrics?.growth_history) && nextMetrics.growth_history.length ? nextMetrics.growth_history : prev.metrics.growth_history
        }
      }));
    };
    const onAuditLog = (log) => {
      setDashboard((prev) => ({ ...prev, audit_logs: [log, ...prev.audit_logs].slice(0, 10) }));
    };
    const onActivity = (activity) => {
      setDashboard((prev) => ({ ...prev, activity_stream: [{ ...activity, id: activity.id || `act-${Date.now()}` }, ...prev.activity_stream].slice(0, 10) }));
    };
    window.addEventListener("yamshat:performance-metric", onMetric);
    window.addEventListener("yamshat:memory-critical", onMemoryCritical);
    socketManager.on("realtime_metrics", onRealtimeMetrics);
    socketManager.on("new_audit_log", onAuditLog);
    socketManager.on("activity_update", onActivity);
    return () => {
      window.removeEventListener("yamshat:performance-metric", onMetric);
      window.removeEventListener("yamshat:memory-critical", onMemoryCritical);
      socketManager.off("realtime_metrics", onRealtimeMetrics);
      socketManager.off("new_audit_log", onAuditLog);
      socketManager.off("activity_update", onActivity);
    };
  }, [pushToast]);
  const { metrics, audit_logs: auditLogs, activity_stream: activityStream } = dashboard;
  const kpis = reactExports.useMemo(() => [
    { label: "Active users", value: metrics.active_users, tone: "#60a5fa", hint: "المستخدمون النشطون الآن" },
    { label: "Traffic / minute", value: metrics.traffic_per_minute || metrics.total_requests || 0, tone: "#22c55e", hint: "تدفق الحركة الحي" },
    { label: "Growth", value: `${Number(metrics.growth_rate || 0).toFixed(1)}%`, tone: "#f59e0b", hint: "نمو آخر دورة" },
    { label: "Live metrics", value: `${metrics.live_metrics_score || 0}/100`, tone: "#a78bfa", hint: "جودة التشغيل اللحظي" },
    { label: "Moderation queue", value: metrics.moderation_queue || metrics.queue_size || 0, tone: "#fb7185", hint: "محتوى ينتظر القرار" },
    { label: "API response", value: `${Math.round(metrics.api_response_time || 0)}ms`, tone: "#38bdf8", hint: "متوسط الاستجابة الحالية" }
  ], [metrics]);
  const healthLevel = reactExports.useMemo(() => {
    const penalty = Number(metrics.cpu_usage || 0) + Number(metrics.memory_usage || 0) + Number(performanceSnapshot.longTasks || 0) * 4;
    if (penalty > 140) return { label: "حرج", color: "#ef4444" };
    if (penalty > 95) return { label: "مراقبة", color: "#f97316" };
    return { label: "مستقر", color: "#22c55e" };
  }, [metrics.cpu_usage, metrics.memory_usage, performanceSnapshot.longTasks]);
  const liveTableRows = reactExports.useMemo(() => {
    const auditRows = auditLogs.map((log, index) => ({
      id: log.id || `audit-${index}`,
      kind: "audit",
      title: log.message || log.summary || "Audit log",
      actor: log.admin_name || log.actor || "Admin",
      level: log.type || "info",
      time: log.timestamp
    }));
    const activityRows = activityStream.map((activity, index) => ({
      id: activity.id || `activity-${index}`,
      kind: "activity",
      title: activity.action || activity.title || "Activity",
      actor: activity.actor || "Realtime engine",
      level: activity.level || "info",
      time: activity.timestamp,
      description: activity.description
    }));
    return [...auditRows, ...activityRows].filter((item) => tableFilter === "all" ? true : item.kind === tableFilter).filter((item) => `${item.title} ${item.actor} ${item.description || ""}`.toLowerCase().includes(searchTerm.trim().toLowerCase())).sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [activityStream, auditLogs, searchTerm, tableFilter]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#60a5fa", fontSize: 13, marginBottom: 8 }, children: "Charts • Live dashboards • Better tables • Filters" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, color: "#f8fafc" }, children: "لوحة الإدارة الحية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 820 }, children: "تم تطوير لوحة الأدمن بواجهات Dashboard مباشرة، وجداول محسّنة مع فلترة وبحث، ورسوم بيانية تساعد الفريق يتابع الأداء والعمليات في لحظتها." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", style: { minWidth: 170 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "التحديث التلقائي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: refreshInterval, onChange: (event) => setRefreshInterval(Number(event.target.value)), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 5e3, children: "كل 5 ثواني" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 7e3, children: "كل 7 ثواني" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 15e3, children: "كل 15 ثانية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 3e4, children: "كل 30 ثانية" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadDashboard, loading, children: "تحديث الآن" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 18, background: `${healthLevel.color}16`, border: `1px solid ${healthLevel.color}44` }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 14, height: 14, borderRadius: "50%", background: healthLevel.color, boxShadow: `0 0 24px ${healthLevel.color}` } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#f8fafc", fontWeight: 800 }, children: [
              "حالة النظام: ",
              healthLevel.label
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#cbd5e1", fontSize: 13 }, children: [
              "CPU ",
              metrics.cpu_usage || 0,
              "% • RAM ",
              metrics.memory_usage || 0,
              "% • Long tasks ",
              performanceSnapshot.longTasks
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#94a3b8", fontSize: 13 }, children: [
          "Connection ",
          performanceSnapshot.connection,
          " • Recommended quality ",
          performanceSnapshot.quality
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: kpis.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 30, fontWeight: 800, margin: "10px 0 8px", color: item.tone }, children: item.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
      ] }, item.label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "Traffic & growth charts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginBottom: 12 }, children: "حركة المرور الحية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(LineChart, { data: metrics.traffic_history || [] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginBottom: 12 }, children: "معدل النمو" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart, { data: metrics.growth_history || [] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "Audience mix" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DonutChart, { data: metrics.audience_mix || [] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }, children: [
        { label: "البث المباشر", value: metrics.live_mix?.[0]?.value || 0, hint: "الغرف النشطة الآن" },
        { label: "الريلز النشطة", value: metrics.live_mix?.[1]?.value || 0, hint: "محتوى سريع مباشر" },
        { label: "القصص النشطة", value: metrics.live_mix?.[2]?.value || 0, hint: "قصص قيد العرض" },
        { label: "التقارير المفتوحة", value: metrics.reports_open || 0, hint: "يحتاج متابعة" }
      ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontSize: 24, fontWeight: 800, margin: "10px 0 8px" }, children: item.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
      ] }, item.label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.9fr)", gap: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "الجدول الحي المحسّن" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { marginTop: 6 }, children: "بحث + فلاتر + دمج النشاطات والتدقيق في جدول واحد" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
              ["all", "الكل"],
              ["audit", "Audit"],
              ["activity", "Activity"]
            ].map(([value, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `dashboard-filter-chip ${tableFilter === value ? "active" : ""}`, onClick: () => setTableFilter(value), children: label }, value)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", style: { flex: 1, minWidth: 220 }, value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), placeholder: "ابحث في الجداول..." }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "النوع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "العنوان" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المسؤول" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الوقت" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
              liveTableRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "row-kind-pill", children: row.kind === "audit" ? "Audit" : "Activity" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 4 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#f8fafc" }, children: row.title }),
                  row.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 12 }, children: row.description }) : null
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: row.actor }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "row-level-pill", style: { "--level-tone": levelTone(row.level) }, children: row.level }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: new Date(row.time).toLocaleString("ar-EG") })
              ] }, row.id)),
              !liveTableRows.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: "5", className: "table-empty", children: "لا توجد بيانات مطابقة للفلاتر الحالية." }) }) : null
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 12 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Admin activity stream" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#94a3b8", fontSize: 12 }, children: "live updates" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: activityStream.map((activity, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 16, padding: 14, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", color: "#f8fafc", fontWeight: 700 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activity.action }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#64748b", fontSize: 12 }, children: new Date(activity.timestamp).toLocaleTimeString("ar-EG") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: activity.description })
          ] }, `${activity.action}-${index}`)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }, children: [
        { label: "JS heap", value: `${performanceSnapshot.jsHeapMb} MB`, hint: "قياس ذاكرة المتصفح الحالية" },
        { label: "Tracked metrics", value: performanceSnapshot.metricCount, hint: "LCP / CLS / longtask events" },
        { label: "TTFB", value: `${performanceSnapshot.ttfb} ms`, hint: "زمن أول استجابة للملاحة" },
        { label: "Device profile", value: performanceSnapshot.lowEnd ? "Low-end" : "Standard", hint: "تقدير آلي للأجهزة الضعيفة" }
      ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontSize: 24, fontWeight: 800, margin: "10px 0 8px" }, children: item.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
      ] }, item.label)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .dashboard-filter-chip {
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(255,255,255,0.04);
          color: #e2e8f0;
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .dashboard-filter-chip.active {
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          border-color: transparent;
        }
        .row-kind-pill,
        .row-level-pill {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .row-kind-pill {
          background: rgba(59,130,246,0.12);
          color: #bfdbfe;
        }
        .row-level-pill {
          --level-tone: #22c55e;
          background: color-mix(in srgb, var(--level-tone) 16%, transparent);
          color: var(--level-tone);
        }
      ` })
  ] });
}
function AdminUsers() {
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedUser, setSelectedUser] = reactExports.useState(null);
  const [filterRole, setFilterRole] = reactExports.useState("all");
  const [filterStatus, setFilterStatus] = reactExports.useState("all");
  const [actionModal, setActionModal] = reactExports.useState(null);
  const [actionData, setActionData] = reactExports.useState({});
  const [users, setUsers] = reactExports.useState([
    {
      id: 1,
      name: "أحمد علي",
      email: "ahmed@example.com",
      role: "user",
      riskScore: 12,
      status: "active",
      joined: "2024-01-01",
      fingerprint: "dev_992x",
      ip: "192.168.1.1",
      deviceId: "device_001",
      isFrozen: false,
      frozenUntil: null,
      bannedIPs: [],
      bannedDevices: [],
      activityLog: [
        { time: "2024-05-10 14:20", action: "تسجيل دخول", details: "من الرياض" },
        { time: "2024-05-09 18:30", action: "تحديث الملف الشخصي", details: "تغيير الصورة" }
      ]
    },
    {
      id: 2,
      name: "سارة محمد",
      email: "sara@example.com",
      role: "moderator",
      riskScore: 85,
      status: "flagged",
      joined: "2024-02-15",
      fingerprint: "dev_881a",
      ip: "192.168.1.2",
      deviceId: "device_002",
      isFrozen: false,
      frozenUntil: null,
      bannedIPs: ["10.0.0.5"],
      bannedDevices: [],
      activityLog: [
        { time: "2024-05-10 10:05", action: "محاولة دخول فاشلة", details: "من فرنسا" }
      ]
    },
    {
      id: 3,
      name: "خالد حسن",
      email: "khaled@example.com",
      role: "support",
      riskScore: 5,
      status: "active",
      joined: "2024-03-10",
      fingerprint: "dev_772b",
      ip: "192.168.1.3",
      deviceId: "device_003",
      isFrozen: false,
      frozenUntil: null,
      bannedIPs: [],
      bannedDevices: [],
      activityLog: []
    },
    {
      id: 4,
      name: "محمد الحسن",
      email: "spam@example.com",
      role: "user",
      riskScore: 95,
      status: "banned",
      joined: "2024-04-01",
      fingerprint: "dev_553c",
      ip: "192.168.1.4",
      deviceId: "device_004",
      isFrozen: true,
      frozenUntil: "2024-05-25",
      bannedIPs: ["192.168.1.4", "10.0.0.1"],
      bannedDevices: ["device_004", "device_005"],
      activityLog: [
        { time: "2024-05-08 12:00", action: "تحذير تلقائي", details: "سبام متكرر" }
      ]
    }
  ]);
  const filteredUsers = reactExports.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.includes(searchTerm) || u.email.includes(searchTerm);
      const matchesRole = filterRole === "all" || u.role === filterRole;
      const matchesStatus = filterStatus === "all" || u.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);
  const handleFreezeUser = (userId, duration) => {
    const frozenUntil = /* @__PURE__ */ new Date();
    frozenUntil.setDate(frozenUntil.getDate() + duration);
    setUsers((prev) => prev.map(
      (u) => u.id === userId ? {
        ...u,
        isFrozen: true,
        frozenUntil: frozenUntil.toISOString().split("T")[0],
        status: "frozen",
        activityLog: [...u.activityLog, {
          time: (/* @__PURE__ */ new Date()).toLocaleString("ar-EG"),
          action: "تجميد مؤقت",
          details: `لمدة ${duration} أيام`
        }]
      } : u
    ));
    setActionModal(null);
  };
  const handleBanIP = (userId, ip) => {
    setUsers((prev) => prev.map(
      (u) => u.id === userId ? {
        ...u,
        bannedIPs: [.../* @__PURE__ */ new Set([...u.bannedIPs, ip])],
        activityLog: [...u.activityLog, {
          time: (/* @__PURE__ */ new Date()).toLocaleString("ar-EG"),
          action: "حظر IP",
          details: ip
        }]
      } : u
    ));
    setActionModal(null);
  };
  const handleBanDevice = (userId, deviceId) => {
    setUsers((prev) => prev.map(
      (u) => u.id === userId ? {
        ...u,
        bannedDevices: [.../* @__PURE__ */ new Set([...u.bannedDevices, deviceId])],
        activityLog: [...u.activityLog, {
          time: (/* @__PURE__ */ new Date()).toLocaleString("ar-EG"),
          action: "حظر جهاز",
          details: deviceId
        }]
      } : u
    ));
    setActionModal(null);
  };
  const handleBanUser = (userId) => {
    setUsers((prev) => prev.map(
      (u) => u.id === userId ? {
        ...u,
        status: "banned",
        isFrozen: true,
        activityLog: [...u.activityLog, {
          time: (/* @__PURE__ */ new Date()).toLocaleString("ar-EG"),
          action: "حظر نهائي",
          details: "تم حظر المستخدم بشكل نهائي"
        }]
      } : u
    ));
    setActionModal(null);
  };
  const handleUnfreeze = (userId) => {
    setUsers((prev) => prev.map(
      (u) => u.id === userId ? {
        ...u,
        isFrozen: false,
        frozenUntil: null,
        status: "active",
        activityLog: [...u.activityLog, {
          time: (/* @__PURE__ */ new Date()).toLocaleString("ar-EG"),
          action: "إلغاء التجميد",
          details: "تم إلغاء التجميد المؤقت"
        }]
      } : u
    ));
  };
  const handleChangeRole = (userId, newRole) => {
    setUsers((prev) => prev.map(
      (u) => u.id === userId ? {
        ...u,
        role: newRole,
        activityLog: [...u.activityLog, {
          time: (/* @__PURE__ */ new Date()).toLocaleString("ar-EG"),
          action: "تغيير الصلاحية",
          details: `من ${u.role} إلى ${newRole}`
        }]
      } : u
    ));
    setActionModal(null);
  };
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Name,Email,Role,RiskScore,Status,Joined,IP,Device,Frozen\n" + users.map((u) => `${u.id},${u.name},${u.email},${u.role},${u.riskScore},${u.status},${u.joined},${u.ip},${u.deviceId},${u.isFrozen}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "yamshat_users_audit.csv");
    document.body.appendChild(link);
    link.click();
  };
  const getRoleLabel = (role) => {
    const roles = {
      "super_admin": "مسؤول عام",
      "moderator": "مشرف",
      "support": "دعم فني",
      "user": "مستخدم عادي"
    };
    return roles[role] || role;
  };
  const getStatusColor = (status) => {
    const colors = {
      "active": "#10b981",
      "frozen": "#f59e0b",
      "flagged": "#ef4444",
      "banned": "#7c2d12"
    };
    return colors[status] || "#64748b";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-users-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "users-header-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "إدارة المستخدمين والصلاحيات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "نظام صلاحيات متدرج، مراقبة سلوك المستخدمين، وأدوات حظر متقدمة." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleExport, variant: "secondary", children: "تصدير المستخدمين (CSV)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "filters-row mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: "البحث بالاسم أو البريد...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "search-input"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: filterRole,
            onChange: (e) => setFilterRole(e.target.value),
            className: "filter-select",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "جميع الصلاحيات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "super_admin", children: "مسؤول عام" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "moderator", children: "مشرف" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "support", children: "دعم فني" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "user", children: "مستخدم عادي" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: filterStatus,
            onChange: (e) => setFilterStatus(e.target.value),
            className: "filter-select",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "جميع الحالات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "نشط" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "frozen", children: "مجمد" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "flagged", children: "مراقب" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "banned", children: "محظور" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "users-stats-card mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-value", children: users.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-label", children: "إجمالي المستخدمين" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-value", children: users.filter((u) => u.status === "active").length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-label", children: "مستخدمون نشطون" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-value", children: users.filter((u) => u.isFrozen).length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-label", children: "مستخدمون مجمدون" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-value", children: users.filter((u) => u.status === "banned").length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stat-label", children: "مستخدمون محظورون" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "users-table-card mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الصلاحية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "تاريخ الانضمام" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "درجة المخاطر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الإجراءات" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: filteredUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-cell", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "avatar-sm", children: user.name[0].toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs muted", children: user.email })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `role-badge role-${user.role}`, children: getRoleLabel(user.role) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: user.joined }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `risk-badge ${user.riskScore > 70 ? "high" : user.riskScore > 30 ? "medium" : "low"}`, children: [
          user.riskScore,
          "%"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-pill", style: { background: getStatusColor(user.status) + "20", color: getStatusColor(user.status) }, children: user.status === "active" ? "نشط" : user.status === "frozen" ? "مجمد" : user.status === "flagged" ? "مراقب" : "محظور" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => setSelectedUser(user), children: "تدقيق" }) })
      ] }, user.id)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: !!selectedUser,
        onClose: () => setSelectedUser(null),
        title: `سجل التدقيق: ${selectedUser?.name}`,
        size: "large",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "audit-content", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "audit-summary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "بصمة الجهاز" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: selectedUser?.fingerprint })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "عنوان IP" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: selectedUser?.ip })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "معرف الجهاز" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: selectedUser?.deviceId })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "summary-item", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "الصلاحية الحالية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `role-badge role-${selectedUser?.role}`, children: getRoleLabel(selectedUser?.role) })
            ] })
          ] }),
          selectedUser?.bannedIPs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "banned-list mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "عناوين IP المحظورة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "banned-items", children: selectedUser.bannedIPs.map((ip, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "banned-item", children: ip }, i)) })
          ] }),
          selectedUser?.bannedDevices.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "banned-list mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "الأجهزة المحظورة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "banned-items", children: selectedUser.bannedDevices.map((device, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "banned-item", children: device }, i)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mt-6 mb-4", children: "سجل النشاط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "timeline", children: selectedUser?.activityLog.map((log, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `timeline-item ${log.action.includes("تحذير") || log.action.includes("فاشلة") ? "warning" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "time", children: log.time }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "event", children: [
              log.action,
              ": ",
              log.details
            ] })
          ] }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "audit-actions mt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "إجراءات الصلاحيات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "button-group", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "small",
                  variant: "secondary",
                  onClick: () => setActionModal("change_role"),
                  children: "تغيير الصلاحية"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-group mt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "إجراءات الحظر والتجميد" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "button-group", children: [
                !selectedUser?.isFrozen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    variant: "warning",
                    onClick: () => setActionModal("freeze"),
                    children: "تجميد مؤقت"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    variant: "primary",
                    onClick: () => handleUnfreeze(selectedUser.id),
                    children: "إلغاء التجميد"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    variant: "secondary",
                    onClick: () => setActionModal("ban_ip"),
                    children: "حظر IP"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    variant: "secondary",
                    onClick: () => setActionModal("ban_device"),
                    children: "حظر جهاز"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "small",
                    variant: "danger",
                    onClick: () => setActionModal("ban_user"),
                    children: "حظر نهائي"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: actionModal === "freeze",
        onClose: () => setActionModal(null),
        title: "تجميد المستخدم مؤقتاً",
        size: "small",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-form", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اختر مدة التجميد:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "duration-buttons", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleFreezeUser(selectedUser.id, 1), children: "يوم واحد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleFreezeUser(selectedUser.id, 7), children: "أسبوع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleFreezeUser(selectedUser.id, 30), children: "شهر" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: actionModal === "ban_ip",
        onClose: () => setActionModal(null),
        title: "حظر عنوان IP",
        size: "small",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-form", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "هل تريد حظر عنوان IP: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: selectedUser?.ip }),
            "؟"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "button-group mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", onClick: () => handleBanIP(selectedUser.id, selectedUser.ip), children: "تأكيد الحظر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActionModal(null), children: "إلغاء" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: actionModal === "ban_device",
        onClose: () => setActionModal(null),
        title: "حظر الجهاز",
        size: "small",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-form", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "هل تريد حظر الجهاز: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: selectedUser?.deviceId }),
            "؟"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "button-group mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", onClick: () => handleBanDevice(selectedUser.id, selectedUser.deviceId), children: "تأكيد الحظر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActionModal(null), children: "إلغاء" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: actionModal === "ban_user",
        onClose: () => setActionModal(null),
        title: "حظر المستخدم نهائياً",
        size: "small",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-form", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "warning-text", children: "⚠️ هذا الإجراء سيحظر المستخدم بشكل نهائي ولا يمكن التراجع عنه بسهولة." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "هل أنت متأكد من حظر ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: selectedUser?.name }),
            "؟"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "button-group mt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", onClick: () => handleBanUser(selectedUser.id), children: "تأكيد الحظر النهائي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActionModal(null), children: "إلغاء" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: actionModal === "change_role",
        onClose: () => setActionModal(null),
        title: "تغيير الصلاحية",
        size: "small",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-form", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اختر الصلاحية الجديدة:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "role-buttons", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleChangeRole(selectedUser.id, "user"), children: "مستخدم عادي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleChangeRole(selectedUser.id, "support"), children: "دعم فني" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleChangeRole(selectedUser.id, "moderator"), children: "مشرف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleChangeRole(selectedUser.id, "super_admin"), children: "مسؤول عام" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { dangerouslySetInnerHTML: { __html: `
        .admin-users-page { padding: 20px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .muted { color: #64748b; font-size: 14px; }
        
        .filters-row { display: flex; gap: 12px; margin-top: 16px; }
        .search-input { flex: 1; }
        .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        
        .users-stats-card { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .stat-item { text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; }
        .stat-value { font-size: 28px; font-weight: bold; color: #1e293b; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 8px; }
        
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: right; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 13px; }
        .admin-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
        
        .user-cell { display: flex; gap: 12px; align-items: center; }
        .avatar-sm { width: 32px; height: 32px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
        
        .role-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .role-super_admin { background: #7c3aed; color: white; }
        .role-moderator { background: #3b82f6; color: white; }
        .role-support { background: #10b981; color: white; }
        .role-user { background: #f3f4f6; color: #374151; }
        
        .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .risk-badge.low { background: #dcfce7; color: #166534; }
        .risk-badge.medium { background: #fef3c7; color: #92400e; }
        .risk-badge.high { background: #fee2e2; color: #991b1b; }
        
        .status-pill { padding: 4px 10px; border-radius: 6px; font-size: 11px; text-transform: uppercase; font-weight: bold; }
        
        .audit-content { padding: 20px 0; }
        .audit-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
        .summary-item label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: bold; }
        .summary-item code { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        
        .banned-list { padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 3px solid #ef4444; }
        .banned-list h4 { margin: 0 0 8px 0; color: #991b1b; }
        .banned-items { display: flex; flex-wrap: wrap; gap: 8px; }
        .banned-item { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        
        .timeline { border-right: 2px solid #e2e8f0; padding-right: 20px; }
        .timeline-item { position: relative; margin-bottom: 20px; }
        .timeline-item::before { content: ''; position: absolute; right: -27px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; border: 2px solid white; }
        .timeline-item.warning::before { background: #f59e0b; }
        .timeline-item .time { font-size: 11px; color: #94a3b8; }
        .timeline-item .event { margin-top: 4px; font-size: 14px; }
        
        .audit-actions { border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .action-group { padding: 12px; background: #f8fafc; border-radius: 8px; }
        .action-group h4 { margin: 0 0 12px 0; font-size: 13px; }
        .button-group { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .action-form { padding: 16px 0; }
        .action-form p { margin: 0 0 12px 0; }
        .duration-buttons { display: flex; gap: 8px; }
        .role-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .warning-text { color: #991b1b; font-weight: bold; }
        
        .text-xs { font-size: 12px; }
      ` } })
  ] });
}
const initialForm$1 = { content: "", image_url: "", user_id: "" };
function AdminPosts() {
  const [posts, setPosts] = reactExports.useState([]);
  const [pagination, setPagination] = reactExports.useState({ page: 1, pages: 1, total: 0, page_size: 10 });
  const [search, setSearch] = reactExports.useState("");
  const [sortBy, setSortBy] = reactExports.useState("created_at");
  const [sortDirection, setSortDirection] = reactExports.useState("desc");
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [form, setForm] = reactExports.useState(initialForm$1);
  const [editingPost, setEditingPost] = reactExports.useState(null);
  const [open, setOpen] = reactExports.useState(false);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [loadError, setLoadError] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const [actionBusyKey, setActionBusyKey] = reactExports.useState("");
  const [mediaReviewOpen, setMediaReviewOpen] = reactExports.useState(false);
  const [currentMedia, setCurrentMedia] = reactExports.useState(null);
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(search, 350);
  const loadPosts = async (page = pagination.page) => {
    try {
      setLoading(true);
      setLoadError("");
      const { data } = await getAdminPosts({ page, page_size: pagination.page_size, search: debouncedSearch, sort_by: sortBy, sort_direction: sortDirection });
      setPosts(data.items || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      const message = error?.response?.data?.detail || "حدث خطأ.";
      setLoadError(message);
      pushToast({ title: "تعذر تحميل المحتوى", description: message, type: "error" });
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadPosts(1);
  }, [debouncedSearch, sortBy, sortDirection]);
  reactExports.useEffect(() => {
    const syncPosts = () => loadPosts(pagination.page);
    socketManager.on("admin:post_created", syncPosts);
    socketManager.on("admin:post_updated", syncPosts);
    socketManager.on("admin:post_deleted", syncPosts);
    socketManager.on("admin:posts_bulk_deleted", syncPosts);
    return () => {
      socketManager.off("admin:post_created", syncPosts);
      socketManager.off("admin:post_updated", syncPosts);
      socketManager.off("admin:post_deleted", syncPosts);
      socketManager.off("admin:posts_bulk_deleted", syncPosts);
    };
  }, [pagination.page, debouncedSearch, sortBy, sortDirection]);
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
      pushToast({ title: "AI Moderation Failed", description: "Could not process request", type: "error" });
    } finally {
      setActionBusyKey("");
    }
  };
  const handleShadowBan = async (userId) => {
    try {
      await toggleShadowBan(userId, true);
      pushToast({ title: "User Shadow Banned", description: `User ID: ${userId}`, type: "warning" });
    } catch (error) {
      pushToast({ title: "Action Failed", description: "Could not shadow ban user", type: "error" });
    }
  };
  const handleBulkAction = async (action) => {
    if (!selectedIds.length) return;
    try {
      setActionBusyKey("bulk-action");
      await bulkUpdatePostStatus(selectedIds, action);
      pushToast({ title: "Bulk Action Success", description: `Applied ${action} to ${selectedIds.length} posts`, type: "success" });
      setSelectedIds([]);
      loadPosts();
    } catch (error) {
      pushToast({ title: "Bulk Action Failed", type: "error" });
    } finally {
      setActionBusyKey("");
    }
  };
  const openMediaReview = (post) => {
    setCurrentMedia(post);
    setMediaReviewOpen(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "filters-row wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Search", value: search, onChange: (event) => setSearch(event.target.value), placeholder: "ابحث في المحتوى أو اسم المستخدم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "Sorting" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: sortBy, onChange: (event) => setSortBy(event.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "created_at", children: "الأحدث" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "engagement", children: "التفاعل" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "Direction" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: sortDirection, onChange: (event) => setSortDirection(event.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "desc", children: "تنازلي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "asc", children: "تصاعدي" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setOpen(true), children: "منشور جديد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bulk-actions-group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", disabled: !selectedIds.length, onClick: () => handleBulkAction("approve"), children: "Approve All" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", className: "danger", disabled: !selectedIds.length, onClick: () => handleBulkAction("delete"), children: "Delete All" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => loadPosts(pagination.page), loading, children: "Refresh" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", children: [
          selectedIds.length,
          " items selected"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Post Moderation & AI Control" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pagination-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", disabled: pagination.page <= 1, onClick: () => loadPosts(pagination.page - 1), children: "السابق" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            pagination.page,
            " / ",
            pagination.pages
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", disabled: pagination.page >= pagination.pages, onClick: () => loadPosts(pagination.page + 1), children: "التالي" })
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, { rows: 6 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", onChange: (e) => setSelectedIds(e.target.checked ? posts.map((p) => p.id) : []) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Author" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Content & Media" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "AI Flag" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: posts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.includes(post.id), onChange: () => toggleSelected(post.id) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
            "#",
            post.id
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-cell", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-link tiny", onClick: () => handleShadowBan(post.user_id), children: "Shadow Ban" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "content-preview", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              post.content?.slice(0, 50),
              "..."
            ] }),
            post.image_url && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "media-badge", onClick: () => openMediaReview(post), children: "Review Media" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${post.ai_flagged ? "danger" : "success"}`, children: post.ai_flagged ? "Auto-Flagged" : "Clean" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action", onClick: () => handleAIModeration(post.id), children: "AI Scan" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action danger", onClick: () => setDeleteTarget(post), children: "Delete" })
          ] }) })
        ] }, post.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: mediaReviewOpen, title: "Media Review", onClose: () => setMediaReviewOpen(false), children: currentMedia && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "media-review-container", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: currentMedia.image_url, alt: "Post content", className: "review-img" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setMediaReviewOpen(false), children: "Close" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "danger", onClick: () => {
          handleBulkAction("delete");
          setMediaReviewOpen(false);
        }, children: "Flag & Remove" })
      ] })
    ] }) })
  ] });
}
function AdminNotifications() {
  const [notifications, setNotifications] = reactExports.useState([]);
  const [analytics, setAnalytics] = reactExports.useState({ delivered: 0, opened: 0, failed: 0 });
  const [form, setForm] = reactExports.useState({ title: "", body: "", segment: "all", schedule_time: "" });
  const [loading, setLoading] = reactExports.useState(true);
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
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const handleSchedule = async () => {
    try {
      await broadcastAdminNotification(form);
      pushToast({ title: "Notification Scheduled", description: `Target: ${form.segment}`, type: "success" });
      setForm({ title: "", body: "", segment: "all", schedule_time: "" });
      loadData();
    } catch (err) {
      pushToast({ title: "Scheduling Failed", type: "error" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "notifications-dashboard", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "two-column-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "Schedule Push Notification", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Title", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "Message Body" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input", rows: "3", value: form.body, onChange: (e) => setForm({ ...form, body: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "filters-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "User Segmentation" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: form.segment, onChange: (e) => setForm({ ...form, segment: e.target.value }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Users" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "Active (Last 7 days)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: "Inactive" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "premium", children: "Premium Only" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Schedule Time", type: "datetime-local", value: form.schedule_time, onChange: (e) => setForm({ ...form, schedule_time: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSchedule, children: "Schedule & Broadcast" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "Delivery Analytics", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "analytics-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "Delivered" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value success", children: analytics.delivered })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "Open Rate" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "value info", children: [
            (analytics.opened / analytics.delivered * 100 || 0).toFixed(1),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "Retry Queue" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value warning", children: analytics.failed })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "Notification History & Queue", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Title" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Target Segment" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Scheduled For" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Analytics" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: notifications.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: n.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: n.segment }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: new Date(n.schedule_time).toLocaleString() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `status-dot ${n.status}` }),
          " ",
          n.status
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
          n.open_count,
          " opens / ",
          n.delivery_count,
          " sent"
        ] })
      ] }, n.id)) })
    ] }) }) })
  ] }) });
}
function AdminLive() {
  const [rooms, setRooms] = reactExports.useState([]);
  const [stats, setStats] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedRoom, setSelectedRoom] = reactExports.useState(null);
  const { pushToast } = useToast();
  const loadLiveStatus = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminLiveOverview();
      setRooms(data.rooms || []);
      setStats(data.stats || {});
    } catch (err) {
      pushToast({ title: "Monitoring Failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadLiveStatus();
    socketManager.on("stream_metrics_update", (data) => {
      setStats((prev) => ({ ...prev, ...data }));
    });
    return () => socketManager.off("stream_metrics_update");
  }, []);
  const handleEmergencyStop = async (roomId) => {
    if (!window.confirm("Are you sure you want to trigger an EMERGENCY STOP?")) return;
    try {
      await endAdminLiveRoom(roomId);
      pushToast({ title: "Emergency Stop Triggered", description: `Stream ${roomId} terminated`, type: "error" });
      loadLiveStatus();
    } catch (err) {
      pushToast({ title: "Action Failed", type: "error" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "live-monitoring-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "metrics-bar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "Active Streams" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: stats.active_rooms || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "Total Viewers" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: stats.current_viewers || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "Avg Bitrate" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: stats.avg_bitrate || "0 kbps" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "streams-grid", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Live Stream Monitoring" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "live-indicator", children: "Real-time Feed Active" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Host" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Metrics (V/L/B)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rooms.map((room) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: room.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: room.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
            room.viewer_count,
            " / ",
            room.likes,
            " / ",
            room.bitrate,
            "k"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge success", children: "Live" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action", onClick: () => setSelectedRoom(room), children: "Monitor" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action danger", onClick: () => handleEmergencyStop(room.id), children: "Emergency Stop" })
          ] }) })
        ] }, room.id)) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: !!selectedRoom, title: "Stream Moderation & Metrics", onClose: () => setSelectedRoom(null), children: selectedRoom && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stream-mod-container", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stream-preview-placeholder", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overlay-metrics", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "FPS: ",
          selectedRoom.fps || 30
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Latency: ",
          selectedRoom.latency || "120ms"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mod-controls", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", children: "Mute Audio" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", children: "Hide Chat" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "danger", onClick: () => handleEmergencyStop(selectedRoom.id), children: "Terminate Stream" })
      ] })
    ] }) })
  ] });
}
const ROW_HEIGHT = 94;
const QUEUE_HEIGHT = 520;
const OVERSCAN = 4;
const FALLBACK_REPORTS = [
  {
    id: "REP-4102",
    type: "انتحال شخصية",
    target: "@fake.company.support",
    targetType: "account",
    reporter: "@salma",
    severity: "critical",
    status: "pending",
    score: 96,
    queue: "identity",
    reason: "مطابقة اسم وهوية مع حساب موثّق ومحاولة سحب بيانات المستخدمين.",
    slaMinutes: 12,
    createdAt: "2026-05-11T08:15:00.000Z"
  },
  {
    id: "REP-4103",
    type: "تحرش ورسائل مسيئة",
    target: "Chat Room #778",
    targetType: "chat",
    reporter: "@mahmoud",
    severity: "high",
    status: "investigating",
    score: 82,
    queue: "safety",
    reason: "بلاغ متكرر من أكثر من مستخدم مع كلمات مفتاحية خطيرة.",
    slaMinutes: 28,
    createdAt: "2026-05-11T08:21:00.000Z"
  },
  {
    id: "REP-4104",
    type: "محتوى عنيف",
    target: "Post #29018",
    targetType: "post",
    reporter: "@nada",
    severity: "high",
    status: "pending",
    score: 77,
    queue: "content",
    reason: "صورة حساسة بدون تحذير + انتشار سريع داخل الريلز.",
    slaMinutes: 34,
    createdAt: "2026-05-11T08:31:00.000Z"
  },
  {
    id: "REP-4105",
    type: "Spam / Scam",
    target: "Live Room #44",
    targetType: "live",
    reporter: "@zeinab",
    severity: "medium",
    status: "escalated",
    score: 71,
    queue: "commerce",
    reason: "روابط مشبوهة وعروض وهمية أثناء البث.",
    slaMinutes: 49,
    createdAt: "2026-05-11T08:37:00.000Z"
  },
  {
    id: "REP-4106",
    type: "copyright",
    target: "Reel #7771",
    targetType: "reel",
    reporter: "@rights.owner",
    severity: "medium",
    status: "resolved",
    score: 58,
    queue: "ip",
    reason: "مطالبة حقوق نشر مع إثبات ملكية للمحتوى الصوتي.",
    slaMinutes: 81,
    createdAt: "2026-05-11T08:41:00.000Z"
  }
];
function duplicateSeedReports(base) {
  return Array.from({ length: 42 }, (_, index) => {
    const template = base[index % base.length];
    return {
      ...template,
      id: `${template.id}-${index + 1}`,
      score: Math.max(42, template.score - index % 14 + index * 3 % 9),
      slaMinutes: template.slaMinutes + index * 2,
      createdAt: new Date(Date.now() - index * 6 * 60 * 1e3).toISOString(),
      reporter: `${template.reporter}${index % 3 === 0 ? "" : `_${index}`}`
    };
  }).sort((a, b) => {
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0) || new Date(b.createdAt) - new Date(a.createdAt);
  });
}
function normalizeReports(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.reports) ? payload.reports : Array.isArray(payload) ? payload : null;
  if (!items?.length) return duplicateSeedReports(FALLBACK_REPORTS);
  return items.map((item, index) => ({
    id: String(item.id ?? item.report_id ?? `REP-${9e3 + index}`),
    type: item.type || item.reason || "بلاغ عام",
    target: item.target || item.target_label || item.target_id || `Target #${index + 1}`,
    targetType: item.target_type || "content",
    reporter: item.reporter || item.reported_by || item.username || `user_${index + 1}`,
    severity: item.severity || item.priority || (Number(item.score || 0) > 85 ? "critical" : Number(item.score || 0) > 70 ? "high" : "medium"),
    status: item.status || "pending",
    score: Number(item.score ?? item.risk_score ?? item.confidence ?? 60 + index % 28),
    queue: item.queue || item.category || item.target_type || "general",
    reason: item.reason || item.description || item.summary || "لا يوجد وصف إضافي من الـ API.",
    slaMinutes: Number(item.sla_minutes ?? item.sla ?? 20 + index * 3),
    createdAt: item.created_at || item.timestamp || new Date(Date.now() - index * 11 * 60 * 1e3).toISOString()
  }));
}
function statusLabel$1(status) {
  switch (status) {
    case "pending":
      return "بانتظار المراجعة";
    case "investigating":
      return "قيد التحقيق";
    case "resolved":
      return "تم الحل";
    case "rejected":
      return "مرفوض";
    case "escalated":
      return "تم التصعيد";
    default:
      return status || "غير معروف";
  }
}
function severityColor(level) {
  switch (level) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#facc15";
    default:
      return "#22c55e";
  }
}
function buildKpis(reports) {
  const pending = reports.filter((item) => item.status === "pending").length;
  const escalated = reports.filter((item) => item.status === "escalated").length;
  const critical = reports.filter((item) => item.severity === "critical").length;
  const underSla = reports.filter((item) => item.slaMinutes <= 30).length;
  const accuracy = Math.round(reports.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(reports.length, 1));
  return [
    { label: "Report Center", value: reports.length, hint: "إجمالي البلاغات المفتوحة والمتابعة" },
    { label: "Review Queue", value: pending, hint: "بانتظار أول إجراء من الفريق" },
    { label: "Critical cases", value: critical, hint: "أولوية قصوى تحتاج قرار سريع" },
    { label: "Moderation accuracy", value: `${accuracy}%`, hint: "متوسط دقة الفرز الذكي" },
    { label: "Escalations", value: escalated, hint: "حالات تم رفعها للإدارة العليا" },
    { label: "SLA ≤ 30m", value: `${underSla}/${reports.length}`, hint: "الالتزام بزمن الاستجابة" }
  ];
}
function getQueueMix(reports) {
  const map = /* @__PURE__ */ new Map();
  reports.forEach((item) => {
    map.set(item.queue, (map.get(item.queue) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}
function scoreBars(reports) {
  return reports.slice(0, 6).map((item) => ({
    id: item.id,
    label: item.id,
    value: Math.min(100, Number(item.score || 0)),
    status: item.status,
    severity: item.severity
  }));
}
function QueueRow({ report, active, onOpen, onResolve, onEscalate }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      onClick: () => onOpen(report),
      style: {
        height: ROW_HEIGHT - 12,
        margin: "6px 0",
        borderRadius: 18,
        padding: "14px 16px",
        cursor: "pointer",
        background: active ? "rgba(59,130,246,0.14)" : "rgba(15,23,42,0.7)",
        border: `1px solid ${active ? "rgba(59,130,246,0.55)" : "rgba(148,163,184,0.14)"}`,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.7fr) minmax(180px, 0.9fr) minmax(180px, 0.9fr)",
        gap: 14,
        alignItems: "center"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 800, color: "#f8fafc" }, children: report.type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "4px 10px", borderRadius: 999, fontSize: 12, background: `${severityColor(report.severity)}22`, color: severityColor(report.severity) }, children: report.severity }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "4px 10px", borderRadius: 999, fontSize: 12, background: "rgba(148,163,184,0.16)", color: "#cbd5e1" }, children: statusLabel$1(report.status) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#e2e8f0", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: report.target }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: report.reason })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 700, marginBottom: 5 }, children: report.reporter }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#94a3b8", fontSize: 12 }, children: [
            "Score: ",
            report.score,
            " • SLA: ",
            report.slaMinutes,
            "m"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12, marginTop: 4 }, children: new Date(report.createdAt).toLocaleString("ar-EG") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: (event) => {
            event.stopPropagation();
            onOpen(report);
          }, children: "تفاصيل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "success", onClick: (event) => {
            event.stopPropagation();
            onResolve(report);
          }, children: "اعتماد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "danger", onClick: (event) => {
            event.stopPropagation();
            onEscalate(report);
          }, children: "تصعيد" })
        ] })
      ]
    }
  );
}
function AdminReports() {
  const { pushToast } = useToast();
  const [reports, setReports] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [activeReportId, setActiveReportId] = reactExports.useState("");
  const [filters, setFilters] = reactExports.useState({ search: "", status: "all", severity: "all", queue: "all" });
  const [scrollTop, setScrollTop] = reactExports.useState(0);
  const [busyId, setBusyId] = reactExports.useState("");
  const loadReports = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAdminReportsSummary();
      const normalized = normalizeReports(data);
      setReports(normalized);
      setActiveReportId((prev) => prev || normalized[0]?.id || "");
    } catch (error) {
      const fallback = duplicateSeedReports(FALLBACK_REPORTS);
      setReports(fallback);
      setActiveReportId((prev) => prev || fallback[0]?.id || "");
      pushToast({ type: "warning", title: "تم تشغيل بيانات تجريبية", description: error?.response?.data?.detail || "تعذر جلب البلاغات من الخادم حالياً." });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);
  reactExports.useEffect(() => {
    loadReports();
  }, [loadReports]);
  reactExports.useEffect(() => {
    const refresh = () => loadReports();
    socketManager.on("admin:report_created", refresh);
    socketManager.on("admin:report_updated", refresh);
    return () => {
      socketManager.off("admin:report_created", refresh);
      socketManager.off("admin:report_updated", refresh);
    };
  }, [loadReports]);
  const filteredReports = reactExports.useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesKeyword = !keyword || [report.id, report.type, report.target, report.reporter, report.reason].join(" ").toLowerCase().includes(keyword);
      const matchesStatus = filters.status === "all" || report.status === filters.status;
      const matchesSeverity = filters.severity === "all" || report.severity === filters.severity;
      const matchesQueue = filters.queue === "all" || report.queue === filters.queue;
      return matchesKeyword && matchesStatus && matchesSeverity && matchesQueue;
    });
  }, [filters, reports]);
  const queueMix = reactExports.useMemo(() => getQueueMix(filteredReports), [filteredReports]);
  const kpis = reactExports.useMemo(() => buildKpis(filteredReports), [filteredReports]);
  const scoring = reactExports.useMemo(() => scoreBars(filteredReports), [filteredReports]);
  const activeReport = reactExports.useMemo(
    () => filteredReports.find((item) => item.id === activeReportId) || filteredReports[0] || null,
    [activeReportId, filteredReports]
  );
  const totalHeight = filteredReports.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(filteredReports.length, Math.ceil((scrollTop + QUEUE_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = filteredReports.slice(startIndex, endIndex);
  const patchReport = (reportId, patch) => {
    setReports((prev) => prev.map((item) => item.id === reportId ? { ...item, ...patch } : item));
  };
  const handleResolve = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: "resolved" });
      await updateReportStatus(report.id, "resolved");
      pushToast({ type: "success", title: "تم اعتماد القرار", description: `${report.id} تم إنهاؤه بنجاح.` });
    } catch (error) {
      patchReport(report.id, { status: report.status });
      pushToast({ type: "error", title: "تعذر تحديث الحالة", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId("");
    }
  };
  const handleEscalate = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: "escalated", severity: report.severity === "critical" ? "critical" : "high" });
      await escalateReport(report.id);
      pushToast({ type: "warning", title: "تم التصعيد", description: `${report.id} دخل مسار الإدارة العليا.` });
    } catch (error) {
      patchReport(report.id, { status: report.status, severity: report.severity });
      pushToast({ type: "error", title: "تعذر التصعيد", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId("");
    }
  };
  const moderationActions = [
    { title: "حظر مؤقت", description: "إيقاف 24 ساعة مع إرسال تنبيه للمستخدم", tone: "#ef4444" },
    { title: "إخفاء المحتوى", description: "إزالة فورية من الـ feed والبحث والريلز", tone: "#f97316" },
    { title: "مراجعة يدوية", description: "إسناد البلاغ لأعلى محلل متاح", tone: "#3b82f6" },
    { title: "رفع للبث المباشر", description: "ربط البلاغ بنظام live moderation", tone: "#14b8a6" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gap: 18 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, color: "#60a5fa", marginBottom: 8 }, children: "Report Center • Review Queue • Moderation Tools" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, color: "#f8fafc" }, children: "مركز البلاغات والإشراف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 760 }, children: "تم إضافة مركز بلاغات كامل بفلترة فورية، قائمة مراجعة افتراضية خفيفة على الجوال، وأزرار إشراف سريعة لتقليل زمن القرار على الأجهزة الضعيفة." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadReports, loading, children: "تحديث الآن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => pushToast({ type: "info", title: "Queue synced", description: "تم مزامنة قائمة المراجعة مع التحديث اللحظي." }), children: "مزامنة الـ Queue" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: kpis.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12, marginBottom: 10 }, children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 28, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }, children: item.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
    ] }, item.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, minWidth: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Review Queue" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "قائمة مراجعة افتراضية سريعة بدلاً من رسم كل العناصر مرة واحدة." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#64748b", fontSize: 12, display: "flex", alignItems: "center" }, children: [
            "Windowed list • ",
            filteredReports.length,
            " items"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "بحث", value: filters.search, onChange: (event) => setFilters((prev) => ({ ...prev, search: event.target.value })), placeholder: "ID / المستخدم / السبب" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الحالة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.status, onChange: (event) => setFilters((prev) => ({ ...prev, status: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: "بانتظار" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "investigating", children: "تحقيق" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "escalated", children: "تصعيد" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "resolved", children: "منتهي" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الخطورة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.severity, onChange: (event) => setFilters((prev) => ({ ...prev, severity: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "critical", children: "critical" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "high", children: "high" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "medium" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "low", children: "low" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "المسار" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.queue, onChange: (event) => setFilters((prev) => ({ ...prev, queue: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              queueMix.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: item.label, children: item.label }, item.label))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            onScroll: (event) => setScrollTop(event.currentTarget.scrollTop),
            style: {
              height: QUEUE_HEIGHT,
              overflowY: "auto",
              borderRadius: 20,
              background: "rgba(2,6,23,0.72)",
              border: "1px solid rgba(148,163,184,0.12)",
              padding: 12
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: totalHeight || 120, position: "relative" }, children: [
              visibleRows.map((report, index) => {
                const actualIndex = startIndex + index;
                return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", insetInline: 0, top: actualIndex * ROW_HEIGHT, height: ROW_HEIGHT }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  QueueRow,
                  {
                    report,
                    active: activeReport?.id === report.id,
                    onOpen: (value) => setActiveReportId(value.id),
                    onResolve: handleResolve,
                    onEscalate: handleEscalate
                  }
                ) }, report.id);
              }),
              !filteredReports.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", placeItems: "center", height: 120, color: "#94a3b8" }, children: "لا توجد نتائج مطابقة للفلترة الحالية." }) : null
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Moderation Tools" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "أوامر سريعة للمراجعين مع توضيح أثر كل إجراء." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: moderationActions.map((tool) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => pushToast({ type: "info", title: tool.title, description: tool.description }),
            style: {
              border: `1px solid ${tool.tone}55`,
              background: `${tool.tone}16`,
              borderRadius: 18,
              padding: "14px 16px",
              textAlign: "right",
              cursor: "pointer"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 700 }, children: tool.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cbd5e1", fontSize: 12, marginTop: 4 }, children: tool.description })
            ]
          },
          tool.title
        )) }),
        activeReport ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 20, padding: 16, background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#60a5fa", fontSize: 12 }, children: activeReport.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 800 }, children: activeReport.target })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "6px 10px", borderRadius: 999, background: `${severityColor(activeReport.severity)}22`, color: severityColor(activeReport.severity), fontSize: 12 }, children: activeReport.severity })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#e2e8f0", fontSize: 14, marginBottom: 8 }, children: activeReport.type }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }, children: activeReport.reason }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 14 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: "المبلّغ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", marginTop: 4 }, children: activeReport.reporter })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: "الثقة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#f8fafc", marginTop: 4 }, children: [
                activeReport.score,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: "المسار" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", marginTop: 4 }, children: activeReport.queue })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: "SLA" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#f8fafc", marginTop: 4 }, children: [
                activeReport.slaMinutes,
                " دقيقة"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "success", loading: busyId === activeReport.id && activeReport.status !== "escalated", onClick: () => handleResolve(activeReport), children: "اعتماد البلاغ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", loading: busyId === activeReport.id && activeReport.status === "escalated", onClick: () => handleEscalate(activeReport), children: "تصعيد فوري" })
          ] })
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "توزيع البلاغات حسب المسار" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: queueMix.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13, marginBottom: 6 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: 10, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.12)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: `${item.value / Math.max(filteredReports.length, 1) * 100}%`, height: "100%", background: "linear-gradient(90deg,#38bdf8,#8b5cf6)" } }) })
        ] }, item.label)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "أعلى البلاغات نقاطًا" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: scoring.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "110px minmax(0,1fr) 56px", gap: 10, alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#cbd5e1", fontSize: 12 }, children: item.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: 12, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.12)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: `${item.value}%`, height: "100%", background: `linear-gradient(90deg, ${severityColor(item.severity)}, #38bdf8)` } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { style: { color: "#f8fafc", fontSize: 12 }, children: [
            item.value,
            "%"
          ] })
        ] }, item.id)) })
      ] })
    ] })
  ] }) });
}
const FALLBACK_LOGS = [
  {
    id: "AUD-2001",
    action: "approve_report",
    admin_name: "Super Admin",
    actor: "superadmin@yamsat.local",
    scope: "reports",
    severity: "info",
    summary: "اعتماد بلاغ انتحال شخصية بعد مراجعة الأدلة.",
    ip_address: "41.33.18.10",
    entity: "REP-4102",
    timestamp: "2026-05-11T08:42:00.000Z"
  },
  {
    id: "AUD-2002",
    action: "shadow_ban_user",
    admin_name: "Content Lead",
    actor: "contentlead@yamsat.local",
    scope: "users",
    severity: "warning",
    summary: "تفعيل Shadow Ban لحساب عالي الخطورة بعد موجة Spam.",
    ip_address: "41.33.18.12",
    entity: "USR-991",
    timestamp: "2026-05-11T08:39:00.000Z"
  },
  {
    id: "AUD-2003",
    action: "export_analytics",
    admin_name: "Analytics Admin",
    actor: "analytics@yamsat.local",
    scope: "analytics",
    severity: "info",
    summary: "تصدير live metrics لمتابعة النمو خلال آخر 24 ساعة.",
    ip_address: "41.33.18.16",
    entity: "growth-board",
    timestamp: "2026-05-11T08:32:00.000Z"
  },
  {
    id: "AUD-2004",
    action: "force_logout",
    admin_name: "Security Admin",
    actor: "security@yamsat.local",
    scope: "security",
    severity: "critical",
    summary: "تسجيل خروج إجباري لعدة جلسات بعد سلوك مشبوه من نفس البصمة.",
    ip_address: "41.33.18.22",
    entity: "session-batch-22",
    timestamp: "2026-05-11T08:21:00.000Z"
  }
];
function normalizeLogs(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.logs) ? payload.logs : Array.isArray(payload) ? payload : null;
  if (!items?.length) {
    return Array.from({ length: 28 }, (_, index) => {
      const base = FALLBACK_LOGS[index % FALLBACK_LOGS.length];
      return {
        ...base,
        id: `${base.id}-${index + 1}`,
        timestamp: new Date(Date.now() - index * 8 * 60 * 1e3).toISOString()
      };
    });
  }
  return items.map((item, index) => ({
    id: String(item.id ?? `AUD-${index + 1}`),
    action: item.action || item.event || "admin_action",
    admin_name: item.admin_name || item.username || item.actor_name || "Admin",
    actor: item.actor || item.email || item.admin_email || "admin@yamshat.local",
    scope: item.scope || item.module || item.category || "general",
    severity: item.severity || item.level || "info",
    summary: item.summary || item.message || item.description || "لا يوجد وصف إضافي.",
    ip_address: item.ip_address || item.ip || "--",
    entity: item.entity || item.entity_id || item.target || "--",
    timestamp: item.timestamp || item.created_at || new Date(Date.now() - index * 8 * 60 * 1e3).toISOString()
  }));
}
function severityTone(level) {
  switch (level) {
    case "critical":
      return { bg: "rgba(239,68,68,0.16)", color: "#ef4444" };
    case "warning":
      return { bg: "rgba(249,115,22,0.16)", color: "#f97316" };
    case "success":
      return { bg: "rgba(34,197,94,0.16)", color: "#22c55e" };
    default:
      return { bg: "rgba(59,130,246,0.16)", color: "#60a5fa" };
  }
}
function AdminAudit() {
  const { pushToast } = useToast();
  const [logs, setLogs] = reactExports.useState([]);
  const [summary, setSummary] = reactExports.useState({ today: 0, critical: 0, exports: 0, security: 0 });
  const [filters, setFilters] = reactExports.useState({ search: "", scope: "all", severity: "all" });
  const [loading, setLoading] = reactExports.useState(true);
  const loadAuditLogs = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const [logsData, summaryData] = await Promise.all([
        adminService.getAuditLogs({ limit: 120 }),
        adminService.getAuditLogsSummary({ period: "24h" })
      ]);
      const normalized = normalizeLogs(logsData);
      setLogs(normalized);
      setSummary({
        today: Number(summaryData?.today ?? normalized.length),
        critical: Number(summaryData?.critical ?? normalized.filter((item) => item.severity === "critical").length),
        exports: Number(summaryData?.exports ?? normalized.filter((item) => item.action.includes("export")).length),
        security: Number(summaryData?.security ?? normalized.filter((item) => item.scope === "security").length)
      });
    } catch (error) {
      const fallback = normalizeLogs([]);
      setLogs(fallback);
      setSummary({
        today: fallback.length,
        critical: fallback.filter((item) => item.severity === "critical").length,
        exports: fallback.filter((item) => item.action.includes("export")).length,
        security: fallback.filter((item) => item.scope === "security").length
      });
      pushToast({ type: "warning", title: "تم تشغيل سجل محلي", description: error?.response?.data?.detail || "تعذر جلب سجل النشاط من الـ API." });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);
  reactExports.useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);
  reactExports.useEffect(() => {
    const onSocketLog = (payload) => {
      const [nextLog] = normalizeLogs([payload]);
      setLogs((prev) => [nextLog, ...prev].slice(0, 150));
    };
    socketManager.on("new_audit_log", onSocketLog);
    return () => socketManager.off("new_audit_log", onSocketLog);
  }, []);
  const filteredLogs = reactExports.useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesKeyword = !keyword || [log.id, log.action, log.admin_name, log.actor, log.summary, log.entity].join(" ").toLowerCase().includes(keyword);
      const matchesScope = filters.scope === "all" || log.scope === filters.scope;
      const matchesSeverity = filters.severity === "all" || log.severity === filters.severity;
      return matchesKeyword && matchesScope && matchesSeverity;
    });
  }, [filters, logs]);
  const scopes = reactExports.useMemo(() => Array.from(new Set(logs.map((item) => item.scope))), [logs]);
  const breakdown = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    filteredLogs.forEach((log) => map.set(log.scope, (map.get(log.scope) || 0) + 1));
    return Array.from(map.entries());
  }, [filteredLogs]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gap: 18 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#60a5fa", fontSize: 13, marginBottom: 8 }, children: "Admin Activity Log • Tracking • Audit System" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, color: "#f8fafc" }, children: "سجل نشاط الأدمن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 760 }, children: "شاشة مخصصة لتتبع كل حركة إدارية مع فلترة حسب النطاق والخطورة، ومناسبة للمراجعة السريعة والتدقيق الأمني." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadAuditLogs, loading, children: "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => pushToast({ type: "info", title: "Audit export queued", description: "جاهز لربط التصدير مع الـ backend." }), children: "تصدير السجل" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: [
      { label: "إجمالي أحداث اليوم", value: summary.today, hint: "كل الإجراءات المسجلة خلال 24 ساعة" },
      { label: "حوادث حرجة", value: summary.critical, hint: "تحتاج مراجعة أمنية أو إدارية" },
      { label: "عمليات تصدير", value: summary.exports, hint: "سحب بيانات أو لوحات متابعة" },
      { label: "أحداث الأمن", value: summary.security, hint: "جلسات، IP، وتدخلات حماية" }
    ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontSize: 28, fontWeight: 800, margin: "10px 0 8px" }, children: item.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
    ] }, item.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "بحث", value: filters.search, onChange: (event) => setFilters((prev) => ({ ...prev, search: event.target.value })), placeholder: "الإجراء / الإدمن / الكيان" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "النطاق" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.scope, onChange: (event) => setFilters((prev) => ({ ...prev, scope: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              scopes.map((scope) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: scope, children: scope }, scope))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الخطورة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.severity, onChange: (event) => setFilters((prev) => ({ ...prev, severity: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "info", children: "info" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "warning", children: "warning" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "critical", children: "critical" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "success", children: "success" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12 }, children: [
          filteredLogs.map((log) => {
            const tone = severityTone(log.severity);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#f8fafc" }, children: log.action }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "4px 10px", borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12 }, children: log.severity }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "4px 10px", borderRadius: 999, background: "rgba(148,163,184,0.14)", color: "#cbd5e1", fontSize: 12 }, children: log.scope })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: new Date(log.timestamp).toLocaleString("ar-EG") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 10, color: "#e2e8f0", fontSize: 14 }, children: log.summary }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: "الإدمن" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", marginTop: 4 }, children: log.admin_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12 }, children: log.actor })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: "الكيان" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", marginTop: 4 }, children: log.entity })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: "IP" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", marginTop: 4 }, children: log.ip_address })
                ] })
              ] })
            ] }, log.id);
          }),
          !filteredLogs.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", textAlign: "center", padding: 30 }, children: "لا توجد نتائج في سجل الأدمن." }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "Tracking summary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "تفصيل النشاط حسب كل نطاق إداري." })
        ] }),
        breakdown.map(([scope, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13, marginBottom: 6 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: scope }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: count })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: 10, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.12)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: `${count / Math.max(filteredLogs.length, 1) * 100}%`, height: "100%", background: "linear-gradient(90deg,#22d3ee,#8b5cf6)" } }) })
        ] }, scope)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.78)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginTop: 0, color: "#f8fafc" }, children: "Audit system notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { style: { margin: 0, paddingInlineStart: 18, color: "#cbd5e1", lineHeight: 1.9, fontSize: 14 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "فلترة حسب مستوى الخطورة والنطاق." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "استقبال مباشر عبر socket لسجلات audit الجديدة." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "مناسب لتتبع الإجراءات الحرجة أثناء التشغيل المباشر." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "قابل للربط مع التصدير وSIEM لاحقًا بدون تغيير الواجهة." })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
const defaultNotificationSettings = {
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
const defaultGeneral = {
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
  const [general, setGeneral] = reactExports.useState(defaultGeneral);
  const [lastLoadedGeneral, setLastLoadedGeneral] = reactExports.useState(defaultGeneral);
  const [passwordForm, setPasswordForm] = reactExports.useState({ current_password: "", new_password: "" });
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [savingGeneral, setSavingGeneral] = reactExports.useState(false);
  const [changingPassword, setChangingPassword] = reactExports.useState(false);
  const { pushToast } = useToast();
  const hasSettingsData = Boolean(general.platform_name || general.support_email || general.session_timeout_minutes || general.theme || general.locale);
  const settingsChecklist = reactExports.useMemo(() => [
    { key: "platform", label: "اسم المنصة", value: general.platform_name || "غير مضبوط بعد" },
    { key: "support", label: "بريد الدعم", value: general.support_email || "غير مضبوط بعد" },
    { key: "registration", label: "التسجيل", value: general.allow_registration ? "مفتوح" : "مغلق" },
    { key: "maintenance", label: "الصيانة", value: general.maintenance_mode ? "مفعّلة" : "متوقفة" },
    { key: "push", label: "Push Notifications", value: general.notifications?.push_enabled ? "مفعلة" : "مغلقة" },
    { key: "grouped", label: "Grouped Notifications", value: general.notifications?.grouped_notifications ? "مفعلة" : "مغلقة" }
  ], [general]);
  const loadSettings = async (showToast = false) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getAdminSettings();
      const normalized = normalizeSettingsPayload(data);
      setGeneral(normalized);
      setLastLoadedGeneral(normalized);
      if (showToast) pushToast({ title: "تمت إعادة التحميل", description: "تم استرجاع آخر إعدادات محفوظة من الخادم.", type: "success" });
    } catch (err) {
      setError(err?.response?.data?.detail || "تعذر تحميل إعدادات الإدارة حالياً.");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadSettings();
    const onSettingsUpdated = (payload) => {
      const normalized = normalizeSettingsPayload({ general: payload?.general || {} });
      setGeneral(normalized);
      setLastLoadedGeneral(normalized);
    };
    socketManager.on("admin:settings_updated", onSettingsUpdated);
    return () => {
      socketManager.off("admin:settings_updated", onSettingsUpdated);
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
      pushToast({ title: "تم حفظ الإعدادات", description: "تم تحديث الإعدادات العامة وإعدادات الإشعارات بنجاح.", type: "success" });
    } catch (err) {
      const message = err?.response?.data?.detail || "تعذر حفظ الإعدادات حالياً.";
      setError(message);
      pushToast({ title: "تعذر الحفظ", description: message, type: "error" });
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
      pushToast({ title: "تم تحديث كلمة المرور", description: "تم تغيير كلمة المرور للحساب الحالي.", type: "success" });
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (err) {
      const message = err?.response?.data?.detail || "تعذر تغيير كلمة المرور حالياً.";
      setError(message);
      pushToast({ title: "تعذر التحديث", description: message, type: "error" });
    } finally {
      setChangingPassword(false);
    }
  };
  if (loading && !hasSettingsData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminOverviewSkeleton, {}) });
  }
  if (error && !hasSettingsData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل الإعدادات", description: error, onRetry: loadSettings }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", children: error }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hero-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "System Preferences" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "توحيد إعدادات المنصة والإشعارات والإدارة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "تم ربط الحفظ والـ reset مع الـ API الحقيقي، مع مزامنة مباشرة لو الإعدادات اتغيرت من جلسة أدمن تانية." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row wide", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { loading: savingGeneral, disabled: savingGeneral, onClick: handleSaveSettings, children: "حفظ الإعدادات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", loading, disabled: loading, onClick: handleResetSettings, children: loading ? "جارٍ الاسترجاع..." : "Reset / إعادة من الخادم" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "جاهزية التكوين" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge", children: [
            settingsChecklist.filter((item) => !String(item.value).includes("غير مضبوط")).length,
            "/",
            settingsChecklist.length
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: settingsChecklist.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: item.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "مؤشر سريع على حالة التهيئة الحالية." })
        ] }, item.key)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "two-column-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-head", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "الإعدادات العامة" }) }),
        !hasSettingsData ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          EmptyState,
          {
            icon: "⚙️",
            title: "لا توجد إعدادات مُحمّلة بعد",
            description: "يمكنك سحب الإعدادات من الخادم أو البدء بملء القيم الافتراضية ثم الحفظ.",
            actionLabel: "إعادة التحميل",
            onAction: loadSettings
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "اسم المنصة", value: general.platform_name, onChange: (event) => setGeneral((prev) => ({ ...prev, platform_name: event.target.value })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "بريد الدعم", value: general.support_email, onChange: (event) => setGeneral((prev) => ({ ...prev, support_email: event.target.value })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "filters-row wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الدور الافتراضي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: general.default_user_role, onChange: (event) => setGeneral((prev) => ({ ...prev, default_user_role: event.target.value })), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "user", children: "مستخدم" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "moderator", children: "مشرف" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: "أدمن" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "مهلة الجلسة بالدقائق", type: "number", value: general.session_timeout_minutes, onChange: (event) => setGeneral((prev) => ({ ...prev, session_timeout_minutes: Number(event.target.value) || 0 })) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "filters-row wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الثيم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: general.theme, onChange: (event) => setGeneral((prev) => ({ ...prev, theme: event.target.value })), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "midnight", children: "Midnight" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "aurora", children: "Aurora" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "graphite", children: "Graphite" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "اللغة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: general.locale, onChange: (event) => setGeneral((prev) => ({ ...prev, locale: event.target.value })), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ar-EG", children: "العربية" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en-US", children: "English" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "filters-row wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: general.maintenance_mode, onChange: (event) => setGeneral((prev) => ({ ...prev, maintenance_mode: event.target.checked })) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "وضع الصيانة" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: general.allow_registration, onChange: (event) => setGeneral((prev) => ({ ...prev, allow_registration: event.target.checked })) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "السماح بالتسجيل" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { loading: savingGeneral, disabled: savingGeneral, onClick: handleSaveSettings, children: "حفظ الإعدادات" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-head", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Notification Settings" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: [
            ["push_enabled", "Push Notifications"],
            ["browser_enabled", "Browser Notifications"],
            ["mobile_enabled", "Mobile Notifications"],
            ["smart_notifications", "Smart Notifications"],
            ["grouped_notifications", "Grouped Notifications"],
            ["silent_notifications", "Silent Notifications"],
            ["realtime_notifications", "Real-time Notifications"]
          ].map(([key, label]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: general.notifications?.[key] ? "مفعّل" : "متوقف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: Boolean(general.notifications?.[key]), onChange: (event) => updateNotificationSetting(key, event.target.checked) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تبديل" })
            ] })
          ] }, key)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "Notification Sounds" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: general.notifications?.sound || "classic", onChange: (event) => updateNotificationSetting("sound", event.target.value), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "classic", children: "Classic Bell" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pulse", children: "Pulse Ping" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "soft", children: "Soft Chime" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "silent", children: "Silent Mode" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: Object.entries(general.notifications?.categories || {}).map(([key, enabled]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: key }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: enabled ? "مفعّل" : "متوقف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: Boolean(enabled), onChange: () => toggleCategory(key) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Toggle Category" })
            ] })
          ] }, key)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { loading: savingGeneral, disabled: savingGeneral, onClick: handleSaveSettings, children: "حفظ إعدادات الإشعارات" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "two-column-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-head", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "الأمان والوصول الإداري" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "كلمة المرور الحالية", type: "password", value: passwordForm.current_password, onChange: (event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "كلمة المرور الجديدة", type: "password", value: passwordForm.new_password, onChange: (event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value })) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", loading: changingPassword, disabled: changingPassword, onClick: handleChangePassword, children: "تغيير كلمة المرور" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-head", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "الأدمن الأساسي" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropzone-hint admin-access-help", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "دخول لوحة الأدمن" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: "الرابط الأساسي: /admin/login" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: "الرابط الاحتياطي: /admin.html" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted no-margin", children: [
            "لازم الدخول يتم بنفس البريد الإداري الأساسي: ",
            PRIMARY_ADMIN_EMAIL
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted no-margin", children: [
            "آخر نسخة محملة من الخادم: ",
            lastLoadedGeneral.platform_name || "غير متوفرة حالياً"
          ] })
        ] })
      ] })
    ] })
  ] });
}
const defaultRbac = { current_role: "", current_permissions: [], roles: [] };
function AdminRbac() {
  const [rbac, setRbac] = reactExports.useState(defaultRbac);
  const [users, setUsers] = reactExports.useState([]);
  const [search, setSearch] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [userLoading, setUserLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [actionBusyKey, setActionBusyKey] = reactExports.useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { pushToast } = useToast();
  const hasRbacData = Boolean(rbac.current_role || (rbac.current_permissions || []).length || (rbac.roles || []).length);
  const loadRbac = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getAdminRbac();
      setRbac({ ...defaultRbac, ...data || {} });
    } catch (err) {
      setError(err?.response?.data?.detail || "تعذر تحميل صلاحيات الأدوار حالياً.");
    } finally {
      setLoading(false);
    }
  };
  const loadUsers = async () => {
    try {
      setUserLoading(true);
      const { data } = await getAdminUsers({ page: 1, page_size: 20, search: debouncedSearch, status: "all", role: "all" });
      setUsers(data?.items || []);
    } catch (err) {
      pushToast({ title: "تعذر تحميل المستخدمين", description: err?.response?.data?.detail || "حاول مرة أخرى.", type: "error" });
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadRbac();
  }, []);
  reactExports.useEffect(() => {
    loadUsers();
  }, [debouncedSearch]);
  reactExports.useEffect(() => {
    const sync = () => {
      loadUsers();
      loadRbac();
    };
    socketManager.on("admin:user_updated", sync);
    socketManager.on("admin:user_deleted", sync);
    socketManager.on("admin:user_status_changed", sync);
    return () => {
      socketManager.off("admin:user_updated", sync);
      socketManager.off("admin:user_deleted", sync);
      socketManager.off("admin:user_status_changed", sync);
    };
  }, [debouncedSearch]);
  const roleMap = reactExports.useMemo(() => Object.fromEntries((rbac.roles || []).map((role) => [role.role, role])), [rbac.roles]);
  const handleAssignRole = async (user, role) => {
    try {
      setActionBusyKey(`${user.id}-${role}`);
      await updateAdminUser(user.id, { role });
      pushToast({ title: "تم تحديث الدور", description: `${user.username} → ${role}`, type: "success" });
      await Promise.all([loadUsers(), loadRbac()]);
    } catch (error2) {
      pushToast({ title: "تعذر تحديث الدور", description: error2?.response?.data?.detail || "حاول مرة أخرى.", type: "error" });
    } finally {
      setActionBusyKey("");
    }
  };
  if (loading && !hasRbacData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminOverviewSkeleton, {}) });
  }
  if (error && !hasRbacData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل صلاحيات الأدوار", description: error, onRetry: loadRbac }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", children: error }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hero-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "RBAC" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "مصفوفة الصلاحيات والأدوار" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "تم ربط الصفحة بواجهة RBAC الحقيقية وإضافة Assign / Remove Role مباشرة على المستخدمين مع تحديث حي فور التنفيذ." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row wide", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { loading, disabled: loading, onClick: loadRbac, children: "تحديث الصلاحيات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", loading: userLoading, disabled: userLoading, onClick: loadUsers, children: "تحديث المستخدمين" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "Current Role" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: rbac.current_role || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "الصلاحيات الحالية للحساب المعتمد داخل لوحة التحكم." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "two-column-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-head", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Current Permissions" }) }),
        (rbac.current_permissions || []).length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "badge-wrap", children: (rbac.current_permissions || []).map((permission) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-chip", children: permission }, permission)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "🔐", title: "لا توجد صلاحيات مرتبطة بالحساب", description: "قد يكون الحساب محدود الصلاحية أو لم تصل البيانات من الخادم بعد.", actionLabel: "إعادة التحميل", onAction: loadRbac })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-head", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "ملخص الأدوار" }) }),
        (rbac.roles || []).length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: (rbac.roles || []).map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: role.label || role.role }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            role.permissions?.length || 0,
            " صلاحية"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: (role.permissions || []).slice(0, 3).join(" • ") || "بدون صلاحيات" })
        ] }, role.role)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "🧩", title: "لا توجد أدوار معرفة بعد", description: "سيتم عرض الأدوار هنا بمجرد رجوع بيانات المصفوفة من الباك إند." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-head", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Roles & Permissions Matrix" }) }),
      (rbac.roles || []).length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rbac-grid role-grid", children: (rbac.roles || []).map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "permission-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: role.label || role.role }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "badge-wrap compact", children: (role.permissions || []).map((permission) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "role-pill neutral", children: permission }, permission)) })
      ] }, role.role)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "📚", title: "مصفوفة الصلاحيات فارغة", description: "لا توجد صفوف لعرض الأدوار والصلاحيات حالياً.", actionLabel: "إعادة التحميل", onAction: loadRbac })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Assign / Remove Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: "تعديل مباشر لدور المستخدم مع تحديث الصلاحيات فوراً بعد نجاح العملية." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "بحث مستخدم", value: search, onChange: (event) => setSearch(event.target.value), placeholder: "اسم المستخدم أو البريد" })
      ] }),
      userLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(AdminOverviewSkeleton, {}) : null,
      !userLoading && users.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "👤", title: "لا يوجد مستخدمون مطابقون", description: "جرّب بحث مختلف أو أعد التحميل.", actionLabel: "إعادة التحميل", onAction: loadUsers }) : null,
      !userLoading && users.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الدور الحالي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "صلاحيات الدور" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Assign Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Remove Role" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: users.map((user) => {
          const permissions = roleMap[user.role]?.permissions || [];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: user.email })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `role-pill ${user.role}`, children: user.role }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "badge-wrap compact", children: permissions.length ? permissions.slice(0, 4).map((permission) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-chip", children: permission }, permission)) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "لا توجد صلاحيات" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hero-actions-wrap", children: ["admin", "moderator", "user"].map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "mini-action",
                disabled: user.role === role || actionBusyKey === `${user.id}-${role}`,
                "aria-busy": actionBusyKey === `${user.id}-${role}`,
                onClick: () => handleAssignRole(user, role),
                children: actionBusyKey === `${user.id}-${role}` ? "..." : `Assign ${role}`
              },
              role
            )) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "mini-action danger",
                disabled: user.role === "user" || actionBusyKey === `${user.id}-user`,
                "aria-busy": actionBusyKey === `${user.id}-user`,
                onClick: () => handleAssignRole(user, "user"),
                children: actionBusyKey === `${user.id}-user` ? "..." : "Remove Role"
              }
            ) })
          ] }, user.id);
        }) })
      ] }) }) : null
    ] })
  ] });
}
function AdminChat() {
  const [threads, setThreads] = reactExports.useState([]);
  const [activeThread, setActiveThread] = reactExports.useState(null);
  const [messages, setMessages] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const { pushToast } = useToast();
  const loadThreads = async () => {
    try {
      const { data } = await getChatThreads();
      setThreads(data || []);
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadThreads();
    socketManager.on("abuse_detected", (payload) => {
      pushToast({ title: "Abuse Detected", description: `In chat with ${payload.user}`, type: "warning" });
      loadThreads();
    });
    return () => socketManager.off("abuse_detected");
  }, []);
  const handleRestore = async (messageId) => {
    try {
      await restoreMessage(messageId);
      pushToast({ title: "Message Restored", type: "success" });
      if (activeThread) loadMessages(activeThread.id);
    } catch (err) {
      pushToast({ title: "Restore Failed", type: "error" });
    }
  };
  const loadMessages = async (threadId) => {
    const { data } = await getMessages(threadId);
    setMessages(data.items || []);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-chat-layout", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "chat-sidebar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "Active Conversations", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "thread-list", children: threads.map((thread) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `thread-item ${activeThread?.id === thread.id ? "active" : ""} ${thread.flagged ? "flagged" : ""}`,
        onClick: () => {
          setActiveThread(thread);
          loadMessages(thread.id);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thread-meta", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: thread.username }),
            thread.abuse_score > 50 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "abuse-indicator", children: "!" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "last-msg", children: [
            thread.last_message?.slice(0, 30),
            "..."
          ] })
        ]
      },
      thread.id
    )) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "chat-monitor-area", children: activeThread ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: `Monitoring: ${activeThread.username}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "messages-scroller", children: messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `msg-bubble ${msg.deleted ? "deleted" : ""}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "msg-content", children: [
        msg.type === "media" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "media-placeholder", children: [
          "[Media Moderation Pending]",
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-link", onClick: () => window.open(msg.media_url), children: "View Original" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: msg.content }),
        msg.deleted && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "restore-btn", onClick: () => handleRestore(msg.id), children: "Restore Message" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "msg-meta", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(msg.created_at).toLocaleTimeString() }),
        msg.ai_score && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ai-score", children: [
          "AI: ",
          msg.ai_score,
          "%"
        ] })
      ] })
    ] }, msg.id)) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-empty-state", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Select a conversation to monitor" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Real-time abuse detection and media moderation are active." })
    ] }) })
  ] }) });
}
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
  const [stories, setStories] = reactExports.useState([]);
  const [archive, setArchive] = reactExports.useState([]);
  const [highlights, setHighlights] = reactExports.useState([]);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [activeStoryId, setActiveStoryId] = reactExports.useState("");
  const [storyModalOpen, setStoryModalOpen] = reactExports.useState(false);
  const [togglingHighlight, setTogglingHighlight] = reactExports.useState(false);
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
  reactExports.useEffect(() => {
    load({ preserveActive: false });
  }, []);
  const activeIndex = reactExports.useMemo(() => stories.findIndex((story) => String(story.id) === String(activeStoryId)), [stories, activeStoryId]);
  const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;
  reactExports.useEffect(() => {
    if (!storyModalOpen || !activeStory) return;
    viewStory(activeStory.id).catch(() => null);
  }, [activeStory, storyModalOpen]);
  const stats = reactExports.useMemo(() => [
    { label: "القصص الحالية", value: analytics?.stories_count ?? stories.length },
    { label: "Highlights", value: analytics?.highlights_count ?? highlights.length },
    { label: "المشاهدات", value: analytics?.total_views ?? stories.reduce((sum, item) => sum + item.views_count, 0) },
    { label: "الردود", value: analytics?.total_replies ?? stories.reduce((sum, item) => sum + item.replies_count, 0) }
  ], [analytics, highlights.length, stories]);
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
      pushToast({ title: activeStory.highlight ? "تمت إزالة الهايلايت" : "تمت إضافة الهايلايت", description: `@${activeStory.username}`, type: "success" });
    } catch (err) {
      pushToast({ title: "تعذر تحديث الهايلايت", description: err?.response?.data?.detail || "حاول مرة تانية.", type: "error" });
    } finally {
      setTogglingHighlight(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Stories Control" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "التالي/السابق والـ Story Modal بقوا مربوطين مباشرة بالـ backend وبيعرضوا الوسائط الفعلية." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => load(), loading, children: loading ? "جارٍ التحديث..." : "تحديث" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-list compact-grid", children: stats.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
        ] }, item.label)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-grid compact-cards", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-violet", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "أفضل قصة الآن" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: stories[0]?.username || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: stories[0]?.caption || "هتظهر هنا أعلى قصة مباشرة من الـ API." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-amber", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "الأرشيف" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: archive.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "آخر القصص المؤرشفة المتاحة للحساب الحالي." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-blue", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "Highlights" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: highlights.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "قصص محفوظة للعرض الطويل داخل الواجهة." })
        ] })
      ] }) })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل الستوري", description: error, onRetry: () => load({ preserveActive: false }) }) : null,
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 6 }) : null,
    !loading && stories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "🎞️", title: "لا توجد قصص منشورة الآن", description: "عند وصول قصص جديدة من الـ backend هتظهر هنا تلقائياً.", actionLabel: "تحديث", onAction: () => load({ preserveActive: false }) }) : null,
    !loading && stories.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "admin-deep-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-rich-table-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "القصص الحية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: "اضغط على أي قصة لفتح الـ modal والتنقل بين القصص الفعلية." })
          ] }),
          activeStory ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => openStory(activeStory.id), children: "فتح القصة الحالية" }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell admin-rich-table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table admin-rich-table", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الناشر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المحتوى" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المشاهدات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الردود" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "النوع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "ينتهي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "إجراء" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: stories.map((story) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-rich-user-cell", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-module-avatar", children: story.username.slice(0, 1).toUpperCase() }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: story.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: story.privacy })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "content-cell compact", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: story.caption || "بدون كابشن" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: story.music || story.filter_name || "بدون ميتاداتا إضافية" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: story.views_count }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: story.replies_count }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `status-pill ${story.type === "video" ? "warning-soft" : "active"}`, children: story.type === "video" ? "فيديو" : "صورة" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: formatDate$1(story.expires_at) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "mini-action", onClick: () => openStory(story.id), children: "عرض القصة" }) })
          ] }, story.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-side-stack", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "آخر أرشيف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: archive.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-activity-list", children: archive.slice(0, 6).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-activity-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-activity-dot tone-story" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                "@",
                item.username
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.caption || "قصة مؤرشفة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: formatDate$1(item.created_at) })
            ] })
          ] }, item.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Highlights الحالية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: highlights.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: highlights.length ? highlights.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "queue-card compact admin-tone-violet", style: { textAlign: "inherit", cursor: "pointer" }, onClick: () => openStory(item.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "queue-label", children: [
              "@",
              item.username
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.caption || "Story Highlight" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              item.views_count,
              " مشاهدة • ",
              item.replies_count,
              " رد"
            ] })
          ] }, item.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state compact", children: "لا توجد Highlights حالياً." }) })
        ] })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: storyModalOpen && Boolean(activeStory), title: activeStory ? `Story • @${activeStory.username}` : "Story Viewer", onClose: () => setStoryModalOpen(false), children: activeStory ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
      activeStory.type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: activeStory.media, controls: true, autoPlay: true, className: "media-viewer-asset" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: activeStory.media, alt: `story-${activeStory.username}`, className: "media-viewer-asset" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "profile-summary-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "avatar-circle large", children: activeStory.username.slice(0, 1).toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            "@",
            activeStory.username
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: activeStory.caption || "بدون كابشن" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row", style: { marginTop: 8 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-chip", children: activeStory.privacy }),
            activeStory.highlight ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-chip", children: "⭐ Highlight" }) : null,
            activeStory.music ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "glass-chip", children: [
              "🎵 ",
              activeStory.music
            ] }) : null
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-inline-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: activeStory.views_count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "مشاهدة" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: activeStory.replies_count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "رد" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: activeStory.reactions_count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تفاعل" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatDate$1(activeStory.expires_at) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "انتهاء" })
        ] })
      ] }),
      activeStory.mentions.length || activeStory.stickers.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "badge-wrap compact", children: [
        activeStory.mentions.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "glass-chip", children: [
          "@",
          item
        ] }, `mention-${item}`)),
        activeStory.stickers.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "glass-chip", children: item }, `sticker-${item}`))
      ] }) : null,
      activeStory.replies.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-feedback-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "آخر الردود" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-activity-list", style: { marginTop: 10 }, children: activeStory.replies.slice(0, 5).map((reply, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-activity-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-activity-dot tone-live" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              "@",
              reply.username
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: reply.text }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: formatDate$1(reply.created_at) })
          ] })
        ] }, `${reply.username}-${index}`)) })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => moveStory(-1), disabled: activeIndex <= 0, children: "القصة السابقة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: handleToggleHighlight, loading: togglingHighlight, children: activeStory.highlight ? "إزالة Highlight" : "إضافة Highlight" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => moveStory(1), disabled: activeIndex >= stories.length - 1, children: "القصة التالية" })
      ] })
    ] }) : null })
  ] });
}
function toArray(value) {
  return Array.isArray(value) ? value : [];
}
function formatCompactNumber(value, options = {}) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  if (options.currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: options.currencyCode || "USD",
      maximumFractionDigits: 2
    }).format(number);
  }
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
    { id: "1", title: "PlayerOne بدأ بث جديد", description: "منذ دقائق قليلة", created_at: (/* @__PURE__ */ new Date()).toISOString(), level: "live" },
    { id: "2", title: "KhaledGamer نشر منشوراً جديداً", description: "محتوى تفاعلي جديد", created_at: new Date(Date.now() - 1e3 * 60 * 12).toISOString(), level: "post" },
    { id: "3", title: "ShadowGirl استقبلت ردوداً على الستوري", description: "ارتفاع ملحوظ في التفاعل", created_at: new Date(Date.now() - 1e3 * 60 * 28).toISOString(), level: "story" },
    { id: "4", title: "MoX انضم إلى مجموعة جديدة", description: "نشاط مجتمعي متزايد", created_at: new Date(Date.now() - 1e3 * 60 * 42).toISOString(), level: "group" }
  ];
}
function getStatusTone(status) {
  const value = String(status || "").toLowerCase();
  if (["active", "featured", "live", "healthy", "linked", "seen"].includes(value)) return "success";
  if (["warning", "pending", "review", "archived", "draft"].includes(value)) return "warning";
  if (["danger", "critical", "ended", "ended_live", "offline", "banned"].includes(value)) return "danger";
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
function AdminSectionTemplate({
  loading = false,
  error = "",
  onRetry,
  title,
  subtitle,
  badge,
  accent,
  stats = [],
  spotlight = [],
  tableTitle,
  tableDescription,
  columns = [],
  rows = [],
  rowKey = "id",
  emptyIcon = "📂",
  emptyTitle = "لا توجد بيانات بعد",
  emptyDescription = "ستظهر البيانات هنا تلقائياً عند توفرها.",
  asideTitle = "مؤشرات سريعة",
  asideItems = [],
  timelineTitle = "آخر النشاطات",
  timelineItems = [],
  primaryAction,
  secondaryAction
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", children: error }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "dashboard-hero-grid small-gap admin-section-hero-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hero-card admin-hero-card admin-section-hero", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hero-card-topline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: badge || "Admin Workspace" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "live-pill", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-dot live-dot" }),
            accent || "لوحة تشغيل مباشرة"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: subtitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hero-actions-wrap", children: [
          primaryAction ? primaryAction.to ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "btn btn-primary", to: primaryAction.to, children: primaryAction.label }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: primaryAction.onClick, children: primaryAction.label }) : null,
          secondaryAction ? secondaryAction.to ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "btn btn-secondary", to: secondaryAction.to, children: secondaryAction.label }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: secondaryAction.onClick, children: secondaryAction.label }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "spotlight-card admin-section-spotlight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: asideTitle }),
          onRetry ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: onRetry, children: "تحديث" }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-list compact-grid admin-spotlight-grid", children: spotlight.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
        ] }, item.label)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "admin-metric-grid", children: stats.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `admin-metric-card tone-${item.tone || "neutral"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-metric-icon", children: item.icon || "•" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-metric-copy", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value }),
        item.note ? /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: item.note }) : null
      ] })
    ] }, item.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "admin-deep-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-rich-table-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: tableTitle }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: tableDescription })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge", children: [
            formatFullNumber(rows.length),
            " عنصر"
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state compact", children: "جارٍ تحميل البيانات..." }) : null,
        !loading && error && !rows.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل البيانات", description: error, onRetry }) : null,
        !loading && !rows.length && !error ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: emptyIcon, title: emptyTitle, description: emptyDescription, actionLabel: onRetry ? "إعادة التحميل" : void 0, onAction: onRetry }) : null,
        !loading && rows.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell admin-rich-table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table admin-rich-table", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: columns.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: column.label }, column.key)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: columns.map((column) => {
            const rawValue = typeof column.render === "function" ? column.render(row, index) : row[column.key];
            return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: rawValue }, column.key);
          }) }, row[rowKey] || `${index}-${row.title || row.name || "row"}`)) })
        ] }) }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-side-stack", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "بطاقات المتابعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "Live" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: asideItems.length ? asideItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `queue-card compact admin-tone-${item.tone || "neutral"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: item.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.description })
          ] }, `${item.label}-${index}`)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state compact", children: "لا توجد مؤشرات إضافية حالياً." }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: timelineTitle }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "Feed" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-activity-list", children: timelineItems.length ? timelineItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-activity-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `admin-activity-dot tone-${getStatusTone(item.level || item.status)}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.title || item.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.description || item.body || "تم تسجيل نشاط جديد داخل النظام." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: formatDateTime(item.created_at || item.time) })
            ] })
          ] }, `${item.id || item.title}-${index}`)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state compact", children: "لا توجد نشاطات حديثة." }) })
        ] })
      ] })
    ] })
  ] });
}
function renderStatus(status) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `status-pill ${getStatusTone(status)}`, children: statusLabel(status) });
}
const reelUrl = (item) => item?.media_urls?.[0] || item?.media || item?.image_url || "";
const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ""));
function AdminReels() {
  const [reels, setReels] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [activeReelId, setActiveReelId] = reactExports.useState("");
  const [inlinePlayingId, setInlinePlayingId] = reactExports.useState("");
  const [modalPlaying, setModalPlaying] = reactExports.useState(false);
  const videoRefs = reactExports.useRef({});
  const modalVideoRef = reactExports.useRef(null);
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getPosts({ skip: 0, limit: 30 });
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
  reactExports.useEffect(() => {
    load();
  }, []);
  const activeReel = reactExports.useMemo(
    () => reels.find((item) => String(item.id) === String(activeReelId)) || null,
    [activeReelId, reels]
  );
  reactExports.useEffect(() => {
    if (!activeReel || !modalVideoRef.current) {
      setModalPlaying(false);
      return void 0;
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
    { label: "إجمالي الريلز", value: formatCompactNumber(reels.length || 0), icon: "🎬", tone: "violet", note: "مقاطع فيديو قصيرة مربوطة ببيانات المنشورات." },
    { label: "التفاعل", value: formatCompactNumber(engagementTotal || 0), icon: "🔥", tone: "green", note: "إجمالي اللايكات والتعليقات والمشاركات." },
    { label: "أفضل منشئ", value: reels[0]?.username || "—", icon: "🏆", tone: "amber", note: "أعلى ظهور حالي داخل البيانات المحملة." },
    { label: "جاهز للمعاينة", value: formatCompactNumber(reels.length), icon: "🛡️", tone: "blue", note: "يمكن تشغيل الريل وفتحه داخل Modal مباشرة." }
  ];
  const spotlight = [
    { label: "أعلى تفاعل", value: formatCompactNumber(Math.max(...reels.map((item) => Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0)), 0)) },
    { label: "أحدث ريل", value: reels[0]?.created_at ? formatDateTime(reels[0].created_at) : "—" },
    { label: "حالة الربط", value: reels.length ? "API متصل" : "لا توجد فيديوهات" }
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
  const rows = reels.map((item) => ({
    ...item,
    adminStatus: Number(item.comments_count || 0) > 0 ? "active" : "review",
    engagement: Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0),
    reelSrc: reelUrl(item)
  }));
  const columns = [
    {
      key: "preview",
      label: "المعاينة",
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 120 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
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
          style: { width: "100%", borderRadius: 14, background: "#111", maxHeight: 180, objectFit: "cover" }
        }
      ) })
    },
    {
      key: "content",
      label: "الريل",
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-rich-user-cell", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-module-avatar", children: "🎬" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: row.content?.slice(0, 36) || "ريل جديد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
            "@",
            row.username || "creator"
          ] })
        ] })
      ] })
    },
    { key: "engagement", label: "التفاعل", render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(row.engagement) }) },
    { key: "comments_count", label: "التعليقات", render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: row.comments_count || 0 }) },
    { key: "share_count", label: "المشاركات", render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: row.share_count || 0 }) },
    { key: "adminStatus", label: "الحالة", render: (row) => renderStatus(row.adminStatus) },
    { key: "created_at", label: "التاريخ", render: (row) => formatDateTime(row.created_at) },
    {
      key: "actions",
      label: "الإجراءات",
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => toggleInlinePlayback(row.id), children: inlinePlayingId === String(row.id) ? "إيقاف" : "تشغيل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => openReelModal(row), children: "فتح الريل" })
      ] })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AdminSectionTemplate,
      {
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
        columns,
        rows,
        emptyIcon: "🎬",
        emptyTitle: "لا توجد ريلز حالياً",
        emptyDescription: "عند توفر فيديوهات قصيرة سيتم عرضها هنا للإدارة والمعاينة الفعلية.",
        asideTitle: "استوديو الريلز",
        asideItems,
        timelineTitle: "تدفق الريلز",
        timelineItems: timeline,
        primaryAction: { to: "/admin/dashboard", label: "العودة للرئيسية" },
        secondaryAction: { to: "/reels", label: "فتح الريلز" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: Boolean(activeReel), title: activeReel ? `ريل @${activeReel.username || "creator"}` : "Reel Viewer", onClose: closeReelModal, children: activeReel ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
          ref: modalVideoRef,
          src: reelUrl(activeReel),
          controls: true,
          playsInline: true,
          preload: "auto",
          poster: activeReel.thumbnail_url || activeReel.cover_url || "",
          onPause: () => setModalPlaying(false),
          onPlay: () => setModalPlaying(true),
          style: { width: "100%", borderRadius: 18, background: "#111", maxHeight: "70vh" }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: toggleModalPlayback, children: modalPlaying ? "إيقاف الريل" : "تشغيل الريل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: closeReelModal, children: "إغلاق" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-grid compact-cards", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-violet", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "المنشئ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            "@",
            activeReel.username || "creator"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: activeReel.content || "بدون وصف." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-success", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "التفاعل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(Number(activeReel.likes || activeReel.like_count || 0) + Number(activeReel.comments_count || 0) + Number(activeReel.share_count || 0)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "لايكات + تعليقات + مشاركات." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-amber", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "تاريخ النشر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatDateTime(activeReel.created_at) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "تم ربط الـ Modal بنفس بيانات الـ API المحمّلة للصفحة." })
        ] })
      ] })
    ] }) : null })
  ] });
}
const initialForm = { name: "", description: "", members: "" };
function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG");
  } catch {
    return "—";
  }
}
function AdminGroups() {
  const [groups2, setGroups] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [createOpen, setCreateOpen] = reactExports.useState(false);
  const [detailGroup, setDetailGroup] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState(initialForm);
  const [saving, setSaving] = reactExports.useState(false);
  const [joiningGroupId, setJoiningGroupId] = reactExports.useState("");
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
  reactExports.useEffect(() => {
    load();
  }, []);
  const stats = reactExports.useMemo(() => {
    const members = groups2.reduce((sum, item) => sum + Number(item.members_count || 0), 0);
    return [
      { label: "إجمالي المجموعات", value: groups2.length },
      { label: "إجمالي الأعضاء", value: members },
      { label: "متوسط الأعضاء", value: groups2.length ? Math.round(members / groups2.length) : 0 },
      { label: "آخر إضافات", value: groups2.slice(0, 3).length }
    ];
  }, [groups2]);
  const openGroupModal = (group) => {
    setDetailGroup(group);
  };
  const syncDetailGroup = (groupId, nextGroup) => {
    if (!groupId) return;
    setDetailGroup((previous) => previous && String(previous.id) === String(groupId) ? nextGroup : previous);
  };
  const handleCreate = async () => {
    if (!form.name.trim()) {
      pushToast({ title: "اسم المجموعة مطلوب", description: "اكتب اسم واضح قبل الإنشاء.", type: "warning" });
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
      pushToast({ title: "تم إنشاء المجموعة", description: data?.name || payload.name, type: "success" });
      await load();
      if (data) setDetailGroup(data);
    } catch (err) {
      pushToast({ title: "تعذر إنشاء المجموعة", description: err?.response?.data?.detail || "حاول مرة تانية.", type: "error" });
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
      pushToast({ title: data?.joined ? "تم الانضمام للمجموعة" : "أنت منضم بالفعل", description: data?.name || group.name, type: data?.joined ? "success" : "info" });
    } catch (err) {
      pushToast({ title: "تعذر الانضمام", description: err?.response?.data?.detail || "حاول مرة تانية.", type: "error" });
    } finally {
      setJoiningGroupId("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Groups Hub" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "أزرار Create / Join والـ Group Modal بقوا مربوطين بالـ API وبيعرضوا التفاصيل الفعلية للمجموعة." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setCreateOpen(true), children: "إنشاء مجموعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: load, loading, children: loading ? "جارٍ التحديث..." : "تحديث" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-list compact-grid", children: stats.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
        ] }, item.label)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-grid compact-cards", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-success", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "أكبر مجموعة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: groups2[0]?.name || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: groups2[0]?.description || "هتظهر هنا تفاصيل المجموعة الأعلى في القائمة." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-blue", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "صاحب المجموعة الأولى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: groups2[0]?.owner_username || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "مستخرج مباشرة من بيانات الـ backend." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-amber", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "جاهزية الانضمام" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Live" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "تقدر تنضم للمجموعة وتتابع تحديث عدد الأعضاء فوراً." })
        ] })
      ] }) })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل المجموعات", description: error, onRetry: load }) : null,
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 5 }) : null,
    !loading && groups2.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "👥", title: "لا توجد مجموعات بعد", description: "أنشئ أول مجموعة من الزر اللي فوق وهتظهر هنا فوراً.", actionLabel: "إنشاء مجموعة", onAction: () => setCreateOpen(true) }) : null,
    !loading && groups2.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "admin-deep-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-rich-table-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "قائمة المجموعات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: "افتح التفاصيل أو انضم لأي مجموعة مباشرة من الجدول." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: groups2.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell admin-rich-table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table admin-rich-table", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المجموعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الوصف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المالك" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الأعضاء" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الإنشاء" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "إجراءات" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: groups2.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-rich-user-cell", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-module-avatar", children: "👥" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: group.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
                  "#",
                  group.id
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "content-cell compact", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: group.description || "بدون وصف" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: group.members?.slice(0, 3).join(" • ") || "لا توجد أسماء أعضاء بعد" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
              "@",
              group.owner_username
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: group.members_count || group.members?.length || 0 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: formatDate(group.created_at) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "mini-action", onClick: () => openGroupModal(group), children: "عرض التفاصيل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", className: "group-join-btn", loading: joiningGroupId === String(group.id), onClick: () => handleJoin(group), children: joiningGroupId === String(group.id) ? "جارٍ الانضمام..." : "انضمام" })
            ] }) })
          ] }, group.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-side-stack", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "آخر المجموعات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "Feed" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-activity-list", children: groups2.slice(0, 6).map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-activity-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-activity-dot tone-group" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: group.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: group.description || "تم إنشاء مجموعة جديدة." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: formatDate(group.created_at) })
            ] })
          ] }, group.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "مؤشرات سريعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "Live" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: groups2.slice(0, 3).map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "queue-card compact admin-tone-violet", style: { textAlign: "inherit", cursor: "pointer" }, onClick: () => openGroupModal(group), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: group.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              group.members_count || 0,
              " عضو"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "المالك: @",
              group.owner_username
            ] })
          ] }, group.id)) })
        ] })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: createOpen, title: "إنشاء مجموعة جديدة", onClose: () => setCreateOpen(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "اسم المجموعة", value: form.name, onChange: (event) => setForm((prev) => ({ ...prev, name: event.target.value })), placeholder: "مثال: فريق الدعم" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "وصف المجموعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input textarea", rows: "4", value: form.description, onChange: (event) => setForm((prev) => ({ ...prev, description: event.target.value })), placeholder: "اكتب وصف مختصر للمجموعة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "أعضاء مبدئيون", hint: "افصل الأسماء بفاصلة", value: form.members, onChange: (event) => setForm((prev) => ({ ...prev, members: event.target.value })), placeholder: "ahmed, sara, nour" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setCreateOpen(false), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreate, loading: saving, children: saving ? "جارٍ الإنشاء..." : "إنشاء المجموعة" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: Boolean(detailGroup), title: detailGroup ? detailGroup.name : "تفاصيل المجموعة", onClose: () => setDetailGroup(null), children: detailGroup ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "profile-summary-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "avatar-circle large", children: "👥" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: detailGroup.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", children: [
            "بواسطة @",
            detailGroup.owner_username
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-chip", style: { marginTop: 8 }, children: [
            "#",
            detailGroup.id
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-feedback-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الوصف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { marginTop: 8 }, children: detailGroup.description || "بدون وصف" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-inline-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: detailGroup.members_count || detailGroup.members?.length || 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "أعضاء" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            "@",
            detailGroup.owner_username
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المالك" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatDate(detailGroup.created_at) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تاريخ الإنشاء" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-feedback-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "قائمة الأعضاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "badge-wrap compact", style: { marginTop: 10 }, children: (detailGroup.members || []).length ? detailGroup.members.map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "glass-chip", children: [
          "@",
          member
        ] }, member)) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "لا يوجد أعضاء معروضين." }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleJoin(detailGroup), loading: joiningGroupId === String(detailGroup.id), children: joiningGroupId === String(detailGroup.id) ? "جارٍ الانضمام..." : "انضمام للمجموعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setDetailGroup(null), children: "إغلاق" })
      ] })
    ] }) : null })
  ] });
}
export {
  AdminAudit,
  AdminChat,
  AdminDashboard,
  AdminGroups,
  AdminLive,
  AdminNotifications,
  AdminPosts,
  AdminRbac,
  AdminReels,
  AdminReports,
  AdminSettings,
  AdminStories,
  AdminUsers
};
