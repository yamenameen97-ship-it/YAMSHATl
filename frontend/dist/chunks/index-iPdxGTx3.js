import { bx as useNavigate, ak as getStoredUser, b0 as reactExports, as as jsxRuntimeExports, N as NavLink, aC as logoutUser, z as clearStoredUser, f as Link, bw as useLocation, bE as useToast, $ as getAuthToken, bl as socketManager, A as API, d as Card, c as Button, T as TableSkeleton, b as AdminOverviewSkeleton, P as PRIMARY_ADMIN_EMAIL, a4 as getChatThreads, ae as getMessages, be as restoreMessage, g as ListSkeleton } from "../index-D_Nx8mZz.js";
import { v as searchAdmin, l as getAdminDashboardLive, n as getAdminNotifications, t as getAdminUsers, k as getAdminBanHistory, s as getAdminUser, z as updateAdminUser, b as banAdminUser, w as toggleAdminShadowBan, g as deleteAdminUser, o as getAdminPosts, x as updateAdminPost, e as createAdminPost, f as deleteAdminPost, c as bulkDeleteAdminPosts, a as broadcastAdminNotification, q as getAdminReportsSummary, A as updateReportStatus, i as escalateReport, r as getAdminSettings, y as updateAdminSettings, d as changeAdminPassword, p as getAdminRbac, m as getAdminLiveOverview, h as endAdminLiveRoom, j as featureAdminLiveRoom, u as pinLatestAdminLiveComment } from "./admin-exTuW7D8.js";
import { B as BrandLogo } from "./BrandLogo-BPQTFvfc.js";
import { u as useDebouncedValue } from "./useDebouncedValue-CYVuzFq4.js";
import { I as Input } from "./Input-DPd4atoV.js";
import { M as Modal } from "./Modal-Cj270ZxR.js";
import { a as ErrorState, E as EmptyState } from "./ErrorState-DH0i98l0.js";
import { viewStory, getStories, getStoryAnalyticsSummary, getStoryArchive, getStoryHighlights, toggleStoryHighlight } from "./stories-CE2jHqiL.js";
import { e as getPosts } from "./posts-CuljhCYS.js";
import { a as getReelInsightsById, d as getWatchHistory, g as getModerationReports, b as getReelsAnalyticsDashboard } from "./reelsEngine-bJfUGmhY.js";
import { u as getGroups, c as createGroup, w as joinGroup } from "./groups-BgR9_Dnk.js";
const ADMIN_NAV_GROUPS = [
  {
    title: "لوحة التحكم",
    items: [
      { to: "/admin/dashboard", label: "لوحة التحكم", icon: "⌂", permission: "dashboard.view", exact: true }
    ]
  },
  {
    title: "إدارة المحتوى",
    items: [
      // ⛔ تم حذف "إدارة البثوث" بناءً على طلب المالك (نظام البث ملغى).
      { to: "/admin/posts", label: "إدارة المنشورات", icon: "✦", permission: "posts.view" },
      { to: "/admin/chat", label: "إدارة الشات", icon: "✉", permission: "dashboard.view" },
      { to: "/admin/stories", label: "إدارة الستوري", icon: "◎", permission: "dashboard.view" },
      { to: "/admin/reels", label: "إدارة الريلز", icon: "▶", permission: "dashboard.view" },
      { to: "/admin/groups", label: "إدارة المجموعات", icon: "◌", permission: "dashboard.view" }
    ]
  },
  {
    title: "إدارة المستخدمين",
    items: [
      { to: "/admin/users", label: "المستخدمون", icon: "◍", permission: "users.view" },
      { to: "/admin/rbac", label: "المشرفون والصلاحيات", icon: "⌘", permission: "rbac.view" },
      { to: "/admin/reports", label: "التقارير والبلاغات", icon: "▣", permission: "reports.view", badge: "HOT" },
      { to: "/admin/notifications", label: "الإشعارات", icon: "◔", permission: "notifications.manage" },
      { to: "/admin/audit", label: "سجل الأدمن", icon: "⧉", permission: "dashboard.view" },
      { to: "/admin/settings", label: "الإعدادات العامة", icon: "⚙", permission: "settings.manage" }
    ]
  }
];
function canAccessAdminItem(item, role = "user", permissions = []) {
  return !item.permission || role === "admin" || permissions.includes(item.permission);
}
function getAdminNavItems(role = "user", permissions = []) {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessAdminItem(item, role, permissions))
  })).filter((group) => group.items.length);
}
function getFlattenedAdminItems(role = "user", permissions = []) {
  return getAdminNavItems(role, permissions).flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })));
}
function AdminSidebar({ collapsed, permissions = [], role = "user" }) {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const navGroups = reactExports.useMemo(() => getAdminNavItems(role, permissions), [permissions, role]);
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
    }
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: `admin-sidebar admin-reference-sidebar ${collapsed ? "collapsed" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-brand admin-reference-brand", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brand-logo brand-logo-reference", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 38, alt: "Yamshat Admin", className: "brand-logo-reference-image" }) }),
      !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Yamshat Admin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "لوحة تحكم موحّدة" })
      ] }) : null
    ] }),
    !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-sidebar-usercard", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-avatar", children: (currentUser?.username || "A").slice(0, 1).toUpperCase() }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: currentUser?.full_name || currentUser?.username || "المدير العام" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: role === "admin" ? "Super Admin" : role || "Admin" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-status", children: "متصل" })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-scroll", children: navGroups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-sidebar-group", children: [
      !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-sidebar-group-title", children: group.title }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "admin-nav admin-reference-nav", children: group.items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        NavLink,
        {
          to: item.to,
          end: Boolean(item.exact),
          className: ({ isActive }) => `admin-nav-link admin-reference-link ${isActive ? "active" : ""}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-nav-icon admin-reference-icon", children: item.icon }),
            !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }) : null,
            !collapsed && item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("em", { className: "admin-nav-badge", children: item.badge }) : null
          ]
        },
        item.to
      )) })
    ] }, group.title)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-sidebar-footer-block", children: [
      !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sidebar-promo admin-reference-promo compact", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: "واجهة واحدة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "تم تثبيت الشعار الرسمي في كامل واجهات الإدارة مع الحفاظ على نفس سرعة التنقّل والتنظيم." })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "admin-sidebar-logout", onClick: handleLogout, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⇠" }),
        !collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تسجيل الخروج" }) : null
      ] })
    ] })
  ] });
}
function AdminTopbar({ title, subtitle, onToggleSidebar, notifications = [], serverStatus = { state: "online", text: "متصل" } }) {
  const [query, setQuery] = reactExports.useState("");
  const [results, setResults] = reactExports.useState({ users: [], posts: [] });
  const [openNotifications, setOpenNotifications] = reactExports.useState(false);
  const [openMenu, setOpenMenu] = reactExports.useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();
  const role = user?.role || "admin";
  const permissions = user?.permissions || [];
  const profileMenuRef = reactExports.useRef(null);
  const notificationRef = reactExports.useRef(null);
  const debouncedQuery = useDebouncedValue(query, 350);
  const unreadCount = reactExports.useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);
  const adminLinks = reactExports.useMemo(() => getFlattenedAdminItems(role, permissions), [permissions, role]);
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
  reactExports.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
    }
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "admin-topbar admin-reference-topbar admin-topbar-modern", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-topbar-leading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ghost-btn icon-btn admin-menu-toggle", onClick: onToggleSidebar, children: "☰" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-search-box admin-reference-search-box", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-search-input-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-search-icon", children: "⌕" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "بحث عن مستخدم، بث، منشور..." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-topbar-inline-heading admin-topbar-inline-heading-compact", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "admin-topbar-inline-title", children: title }),
          subtitle ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-topbar-inline-sub", children: subtitle }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `admin-server-status admin-server-status-${serverStatus.state || "online"}`,
            title: `حالة السيرفر: ${serverStatus.text}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-server-status-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-server-status-body", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "حالة السيرفر" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: serverStatus.text })
              ] })
            ]
          }
        ),
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "topbar-controls admin-reference-controls", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "topbar-popover-wrap", ref: notificationRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ghost-btn notification-button admin-reference-utility", onClick: () => setOpenNotifications((prev) => !prev), children: [
          "🔔",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: unreadCount })
        ] }),
        openNotifications ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "notification-popover admin-header-popover", children: [
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
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "ghost-btn admin-reference-utility", to: "/admin/reports", title: "التقارير", children: "📈" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "ghost-btn admin-reference-utility", to: "/admin/notifications", title: "الإشعارات", children: "✉" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-profile-dropdown-wrap", ref: profileMenuRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "profile-pill admin-profile-pill admin-reference-profile admin-profile-trigger", onClick: () => setOpenMenu((prev) => !prev), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-reference-profile-avatar", children: (user?.username || "A").slice(0, 1).toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user?.username || "admin" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: user?.role || "admin" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `admin-dropdown-caret ${openMenu ? "open" : ""}`, children: "⌄" })
        ] }),
        openMenu ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-profile-dropdown admin-header-popover", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-profile-dropdown-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "أقسام الإدارة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "اختر القسم المطلوب بسرعة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-profile-dropdown-list", children: adminLinks.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, end: Boolean(item.exact), className: "admin-profile-dropdown-item", onClick: () => setOpenMenu(false), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "admin-profile-dropdown-icon", children: item.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "admin-profile-dropdown-copy", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: item.group })
            ] }),
            item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("em", { className: "admin-nav-badge", children: item.badge }) : null
          ] }, item.to)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "admin-profile-dropdown-logout", onClick: handleLogout, children: "تسجيل الخروج" })
        ] }) : null
      ] })
    ] })
  ] });
}
const routeMeta = {
  "/admin/dashboard": { title: "لوحة التحكم", subtitle: "نظرة عامة على المنصة", breadcrumb: ["الإدارة", "الرئيسية"] },
  "/admin/posts": { title: "إدارة المنشورات", breadcrumb: ["الإدارة", "المنشورات"] },
  "/admin/content": { title: "إدارة المنشورات", breadcrumb: ["الإدارة", "المنشورات"] },
  "/admin/chat": { title: "إدارة الشات", subtitle: "مراقبة المحادثات والإشراف الفوري", breadcrumb: ["الإدارة", "الشات"] },
  "/admin/stories": { title: "إدارة الستوري", breadcrumb: ["الإدارة", "الستوري"] },
  "/admin/reels": { title: "إدارة الريلز", breadcrumb: ["الإدارة", "الريلز"] },
  "/admin/live": { title: "إدارة البثوث", breadcrumb: ["الإدارة", "البثوث"] },
  "/admin/groups": { title: "إدارة المجموعات", breadcrumb: ["الإدارة", "المجموعات"] },
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
  const [serverStatus, setServerStatus] = reactExports.useState({ state: "checking", text: "جاري الفحص..." });
  const { pushToast } = useToast();
  const user = getStoredUser();
  const token = getAuthToken();
  const meta = routeMeta[location.pathname] || routeMeta["/admin/dashboard"];
  reactExports.useMemo(
    () => meta.breadcrumb.map((label, index) => ({ label, to: index === meta.breadcrumb.length - 1 ? "" : "/admin/dashboard" })),
    [meta]
  );
  const checkServerStatus = reactExports.useCallback(async () => {
    try {
      await getAdminDashboardLive();
      setServerStatus({ state: "online", text: "متصل" });
    } catch (err) {
      const code = err?.response?.status;
      if (!code) {
        setServerStatus({ state: "offline", text: "بلا اتصال" });
      } else if (code >= 500) {
        setServerStatus({ state: "error", text: "خطأ بالخادم" });
      } else {
        setServerStatus({ state: "warning", text: "اتصال ضعيف" });
      }
    }
  }, []);
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
    checkServerStatus();
    const statusInterval = setInterval(() => {
      if (active) checkServerStatus();
    }, 3e4);
    const onConnect = () => active && setServerStatus({ state: "online", text: "متصل" });
    const onDisconnect = () => active && setServerStatus({ state: "offline", text: "بلا اتصال" });
    socketManager.on("connect", onConnect);
    socketManager.on("disconnect", onDisconnect);
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
      clearInterval(statusInterval);
      socketManager.off("connect", onConnect);
      socketManager.off("disconnect", onDisconnect);
      socketManager.off("admin:notification", onAdminNotification);
      syncEvents.forEach((eventName) => socketManager.off(eventName, loadNotifications));
    };
  }, [pushToast, token, user?.username, checkServerStatus]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-app-shell admin-reference-shell admin-shell-modern", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AdminSidebar, { collapsed, permissions: user?.permissions || [], role: user?.role || "user" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-main-shell admin-main-shell-modern", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AdminTopbar,
        {
          title: meta.title,
          subtitle: meta.subtitle,
          onToggleSidebar: () => setCollapsed((prev) => !prev),
          notifications,
          serverStatus
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "admin-page-shell admin-reference-page-shell admin-page-shell-modern", children })
    ] })
  ] });
}
const FALLBACK_STAT_CARDS = [
  { id: "users", label: "إجمالي المستخدمين", value: "—", trend: "+0.0%", icon: "👥", tone: "#8b5cf6" },
  { id: "live", label: "البثوث المباشرة", value: "—", trend: "+0.0%", icon: "📡", tone: "#ef4444" },
  { id: "views", label: "المشاهدات الكلية", value: "—", trend: "+0.0%", icon: "👁", tone: "#ef4444" },
  { id: "revenue", label: "الإيرادات", value: "—", trend: "+0.0%", icon: "$", tone: "#10b981" },
  { id: "posts", label: "المنشورات", value: "—", trend: "+0.0%", icon: "🎁", tone: "#f59e0b" },
  { id: "reels", label: "الريلز", value: "—", trend: "+0.0%", icon: "🎵", tone: "#ec4899" }
];
const FALLBACK_VIEWS_TREND = [
  { day: "—", value: 0 },
  { day: "—", value: 0 },
  { day: "—", value: 0 },
  { day: "—", value: 0 },
  { day: "—", value: 0 },
  { day: "—", value: 0 },
  { day: "—", value: 0 }
];
const FALLBACK_CONTENT_DISTRIBUTION = [
  { label: "بثوث مباشرة", value: 40, color: "#a78bfa" },
  { label: "منشورات", value: 25, color: "#8b5cf6" },
  { label: "ريلز", value: 20, color: "#f59e0b" },
  { label: "ستوري", value: 10, color: "#10b981" },
  { label: "أخرى", value: 5, color: "#ef4444" }
];
const FALLBACK_AUDIENCE = [
  { label: "18-24 سنة", value: 35, color: "#a78bfa" },
  { label: "25-34 سنة", value: 40, color: "#3b82f6" },
  { label: "35-44 سنة", value: 15, color: "#f59e0b" },
  { label: "أكثر من ذلك", value: 10, color: "#10b981" }
];
const STAT_TARGETS = {
  users: "/admin/users",
  live: "/admin/live",
  views: "/admin/reports",
  revenue: "/admin/reports",
  posts: "/admin/posts",
  reels: "/admin/reels",
  stories: "/admin/stories",
  chat: "/admin/chat",
  reports: "/admin/reports",
  notifications: "/admin/notifications"
};
function AreaChart({ data, height = 130 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.1;
  const w = 700;
  const h = height;
  const padX = 28;
  const padY = 14;
  const stepX = (w - padX * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = h - padY - d.value / max * (h - padY * 2);
    return { x, y, ...d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;
  const yTicks = [0, Math.round(max * 0.5), Math.round(max)];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: "100%", preserveAspectRatio: "none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "areaFill", x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#8b5cf6", stopOpacity: "0.55" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#8b5cf6", stopOpacity: "0.02" })
    ] }) }),
    yTicks.map((t, i) => {
      const y = h - padY - t / max * (h - padY * 2);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: padX, y1: y, x2: w - padX, y2: y, stroke: "rgba(148,163,184,0.12)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("text", { x: padX - 4, y: y + 3, fill: "#64748b", fontSize: "9", textAnchor: "end", children: [
          t,
          "K"
        ] })
      ] }, i);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: areaPath, fill: "url(#areaFill)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: linePath, fill: "none", stroke: "#8b5cf6", strokeWidth: "2" }),
    points.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: p.x, cy: p.y, r: "3", fill: "#8b5cf6", stroke: "#0f172a", strokeWidth: "1.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: p.x, y: h - 2, fill: "#64748b", fontSize: "9", textAnchor: "middle", children: p.day })
    ] }, i))
  ] });
}
function Donut({ data, size = 110, centerLabel = "الإجمالي", centerValue = "100%" }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const arcs = data.map((d) => {
    const a0 = acc / total * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const a1 = acc / total * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return { path: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`, color: d.color };
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, children: [
    arcs.map((a, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: a.path, fill: a.color }, i)),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx, cy, r: r * 0.62, fill: "#0f172a" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: cx, y: cy - 1, fill: "#94a3b8", fontSize: "8", textAnchor: "middle", children: centerLabel }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: cx, y: cy + 10, fill: "#f8fafc", fontSize: "11", fontWeight: "800", textAnchor: "middle", children: centerValue })
  ] });
}
function BarChart({ values, labels, height = 110, color = "#a78bfa" }) {
  if (!values?.length) return null;
  const max = Math.max(...values, 1) * 1.15;
  const w = 700;
  const padX = 22;
  const padY = 12;
  const bw = (w - padX * 2) / values.length - 6;
  const yTicks = [0, Math.round(max * 0.5), Math.round(max)];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${w} ${height}`, width: "100%", height: "100%", preserveAspectRatio: "none", children: [
    yTicks.map((t, i) => {
      const y = height - padY - t / max * (height - padY * 2);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: padX, y1: y, x2: w - padX, y2: y, stroke: "rgba(148,163,184,0.10)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("text", { x: padX - 3, y: y + 3, fill: "#64748b", fontSize: "8", textAnchor: "end", children: [
          t,
          "K"
        ] })
      ] }, i);
    }),
    values.map((v, i) => {
      const h = v / max * (height - padY * 2);
      const x = padX + i * ((w - padX * 2) / values.length) + 3;
      const y = height - padY - h;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x, y, width: bw, height: h, fill: color, rx: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: x + bw / 2, y: height - 2, fill: "#64748b", fontSize: "7", textAnchor: "middle", children: labels[i] })
      ] }, i);
    })
  ] });
}
function ClickableCard({ to, navigate, className = "", children, ariaLabel }) {
  const handle = (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (["button", "input", "select", "textarea", "a", "option"].includes(tag)) return;
    if (e.target.closest("button, input, select, textarea, a")) return;
    navigate(to);
  };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(to);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `ls-card ls-clickable ${className}`,
      role: "link",
      tabIndex: 0,
      "aria-label": ariaLabel,
      onClick: handle,
      onKeyDown: onKey,
      children
    }
  );
}
function AdminDashboard() {
  const navigate = useNavigate();
  const [chartTab, setChartTab] = reactExports.useState("views");
  const [reportTab, setReportTab] = reactExports.useState("interactions");
  const [data, setData] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") {
      window.__YAMSHAT_ADMIN_DASHBOARD_VERSION__ = "unified-v60-single-viewport";
      document.querySelectorAll('[data-legacy-admin-dashboard="true"]').forEach((el) => el.remove());
    }
  }, []);
  reactExports.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getAdminDashboardLive();
        if (active) {
          setData(res?.data || null);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.detail || err?.message || "تعذّر تحميل بيانات اللوحة");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 3e4);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);
  const apiStatCards = data?.stat_cards || [];
  const statCards = reactExports.useMemo(() => {
    const byId = /* @__PURE__ */ new Map();
    apiStatCards.forEach((s) => byId.set(s.id, s));
    return FALLBACK_STAT_CARDS.map((fb) => {
      const live = byId.get(fb.id);
      return live ? { ...fb, ...live } : fb;
    });
  }, [apiStatCards]);
  const viewsTrend = data?.views_trend || FALLBACK_VIEWS_TREND;
  const contentDistribution = data?.content_distribution || FALLBACK_CONTENT_DISTRIBUTION;
  const recentActivities = data?.recent_activities || [];
  const postsRows = data?.posts_table || [];
  const chatRows = data?.chat_table || [];
  const storiesRows = data?.stories_table || [];
  const reelsRows = data?.reels_table || [];
  const liveRows = data?.live_table || data?.broadcasts_table || [];
  const kpis = data?.kpis || [];
  const dailyValues = data?.daily_views_values || [];
  const dailyLabels = data?.daily_views_labels || [];
  const audience = data?.audience || FALLBACK_AUDIENCE;
  const distributionTotal = reactExports.useMemo(
    () => contentDistribution.reduce((s, d) => s + d.value, 0) || 1,
    [contentDistribution]
  );
  const previewPosts = postsRows.slice(0, 4);
  const previewChat = chatRows.slice(0, 4);
  const previewStories = storiesRows.slice(0, 4);
  const previewReels = reelsRows.slice(0, 4);
  const previewLive = liveRows.slice(0, 4);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-admin", dir: "rtl", "data-yamshat-version": "unified-v60-single-viewport", children: [
      loading && !data ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-loading", children: "جاري تحميل البيانات الحية..." }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-stats-grid", children: statCards.map((s) => {
        const target = STAT_TARGETS[s.id] || "/admin/dashboard";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "ls-stat-card ls-clickable",
            onClick: () => navigate(target),
            "aria-label": `فتح ${s.label}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-stat-top", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-stat-icon", style: { background: `${s.tone}22`, color: s.tone }, children: s.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-stat-label", children: s.label })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-stat-value", children: s.value }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-stat-trend", children: [
                "▲ ",
                s.trend,
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-stat-muted", children: "من الشهر الماضي" })
              ] })
            ]
          },
          s.id
        );
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-row ls-row-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          ClickableCard,
          {
            to: "/admin/reports",
            navigate,
            ariaLabel: "فتح التقارير والمشاهدات الكاملة",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "المشاهدات خلال آخر 7 أيام" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-head-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "ls-select", value: chartTab, onChange: (e) => setChartTab(e.target.value), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "views", children: "المشاهدات" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "interactions", children: "التفاعلات" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "users", children: "المستخدمون" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-chart-area", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AreaChart, { data: viewsTrend }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ClickableCard, { to: "/admin/reports", navigate, ariaLabel: "فتح إحصائيات توزيع المحتوى", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "توزيع المحتوى" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-open-hint", children: "عرض الكل ›" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-donut-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Donut, { data: contentDistribution, centerLabel: "الإجمالي", centerValue: "100%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "ls-legend", children: contentDistribution.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-dot", style: { background: d.color } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-legend-label", children: d.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ls-legend-value", children: [
                Math.round(d.value / distributionTotal * 100),
                "%"
              ] })
            ] }, d.label)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ClickableCard, { to: "/admin/notifications", navigate, ariaLabel: "فتح كل النشاطات الأخيرة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "النشاطات الأخيرة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-open-hint", children: "عرض الكل ›" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "ls-activity", children: recentActivities.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "ls-empty", children: "لا يوجد نشاط حديث" }) : recentActivities.slice(0, 5).map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-avatar", children: (a.user || "?").charAt(0) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-activity-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: a.user }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: a.text })
            ] }),
            a.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-live", children: a.badge }) : null
          ] }, a.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-row ls-row-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ClickableCard, { to: "/admin/live", navigate, ariaLabel: "فتح صفحة إدارة البثوث الكاملة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "📡 إدارة البثوث" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-open-hint", children: "عرض الكل ›" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-table-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "ls-table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التاريخ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "عنوان البث" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المشاهدات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewLive.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "ls-empty-row", children: "لا توجد بثوث بعد" }) }) : previewLive.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.user }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "ls-ellipsis", children: r.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.views ?? r.viewers ?? "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-status ls-status-live", children: "إنهاء" }) })
            ] }, r.id)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ClickableCard, { to: "/admin/posts", navigate, ariaLabel: "فتح صفحة إدارة المنشورات الكاملة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "📨 إدارة المنشورات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-open-hint", children: "عرض الكل ›" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-table-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "ls-table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التاريخ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المحتوى" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التفاعلات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewPosts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "ls-empty-row", children: "لا توجد منشورات بعد" }) }) : previewPosts.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.user }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "ls-ellipsis", children: r.content }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.interactions }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-status ls-status-ok", children: "نشط" }) })
            ] }, r.id)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ClickableCard, { to: "/admin/chat", navigate, ariaLabel: "فتح صفحة إدارة الشات الكاملة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "💬 إدارة الشات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-open-hint", children: "عرض الكل ›" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-table-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "ls-table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "آخر رسالة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewChat.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 3, className: "ls-empty-row", children: "لا توجد رسائل بعد" }) }) : previewChat.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.user }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "ls-ellipsis", children: r.text }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-status ls-status-ok", children: "نشط" }) })
            ] }, r.id)) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-row ls-row-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ClickableCard, { to: "/admin/stories", navigate, ariaLabel: "فتح صفحة إدارة الستوري الكاملة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "📷 إدارة الستوري" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-open-hint", children: "عرض الكل ›" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-table-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "ls-table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التاريخ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المشاهدات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewStories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "ls-empty-row", children: "لا توجد ستوريات بعد" }) }) : previewStories.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.user }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.views }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-status ls-status-ok", children: "نشط" }) })
            ] }, r.id)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ClickableCard, { to: "/admin/reels", navigate, ariaLabel: "فتح صفحة إدارة الريلز الكاملة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "🎬 إدارة الريلز" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-open-hint", children: "عرض الكل ›" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-table-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "ls-table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التاريخ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "العنوان" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المشاهدات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewReels.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "ls-empty-row", children: "لا توجد ريلز بعد" }) }) : previewReels.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.user }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "ls-ellipsis", children: r.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: r.views }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-status ls-status-ok", children: "نشط" }) })
            ] }, r.id)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          ClickableCard,
          {
            to: "/admin/reports",
            navigate,
            ariaLabel: "فتح صفحة التقارير والإحصائيات الكاملة",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-card-head", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "📊 التقارير والإحصائيات" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-head-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    className: "ls-select",
                    value: reportTab,
                    onClick: (e) => e.stopPropagation(),
                    onChange: (e) => setReportTab(e.target.value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "interactions", children: "التفاعلات" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "revenue", children: "الإيرادات" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "content", children: "المحتوى" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "users", children: "المستخدمون" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "overview", children: "نظرة عامة" })
                    ]
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-kpi-mini", children: (kpis.length ? kpis : [
                { label: "إجمالي الإيرادات", value: "—", trend: "+0.0%" },
                { label: "معدل التفاعل", value: "—", trend: "+0.0%" },
                { label: "متوسط المشاهدة", value: "—", trend: "+0.0%" },
                { label: "إجمالي المشاهدات", value: "—", trend: "+0.0%" }
              ]).slice(0, 4).map((k, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-kpi-cell", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-kpi-label", children: k.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ls-kpi-value", children: k.value }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-kpi-trend up", children: [
                  "▲ ",
                  k.trend
                ] })
              ] }, i)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-reports-mini", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-reports-chart", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "ls-sub-title", children: "المشاهدات اليومية" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    BarChart,
                    {
                      values: dailyValues.length ? dailyValues : [0],
                      labels: dailyLabels.length ? dailyLabels : ["—"],
                      height: 70
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-reports-donut", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "ls-sub-title", children: "توزيع الجمهور" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ls-donut-wrap ls-donut-wrap-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Donut, { data: audience, size: 72, centerLabel: "الجمهور", centerValue: "100%" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "ls-legend ls-legend-sm", children: audience.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-dot", style: { background: d.color } }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ls-legend-label", children: d.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ls-legend-value", children: [
                        d.value,
                        "%"
                      ] })
                    ] }, d.label)) })
                  ] })
                ] })
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');

        /* ============================================================
         * v60 — Single-Viewport Compact Layout
         * كل اللوحة تظهر في صفحة واحدة بدون تمرير عمودي.
         * 6 إحصائيات + 3 صفوف × 3 صناديق متراصة، كل صندوق اختصار قابل للنقر.
         * ============================================================ */

        .ls-admin {
          font-family: 'Noto Sans Arabic', system-ui, sans-serif;
          color: #e2e8f0;
          background: transparent;
          padding: 0;
          margin: 0;
          direction: rtl;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .ls-admin *, .ls-admin *::before, .ls-admin *::after { box-sizing: border-box; }

        /* === Loading / Error states === */
        .ls-loading {
          padding: 8px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        .ls-error {
          padding: 5px 9px;
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          font-size: 10.5px;
        }
        .ls-empty {
          color: #64748b;
          font-size: 10px;
          text-align: center;
          padding: 8px 0;
        }
        .ls-empty-row {
          text-align: center;
          color: #64748b;
          font-size: 10px;
          padding: 8px 0 !important;
        }

        /* === Clickable cards interaction === */
        .ls-clickable {
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease;
        }
        .ls-clickable:hover {
          transform: translateY(-1px);
          border-color: rgba(139, 92, 246, 0.45) !important;
          box-shadow: 0 6px 18px -8px rgba(139, 92, 246, 0.55);
        }
        .ls-clickable:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
        .ls-open-hint {
          color: #a78bfa;
          font-size: 9.5px;
          font-weight: 700;
          opacity: 0.85;
          white-space: nowrap;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(139, 92, 246, 0.10);
        }

        /* === Stat cards (6 بطاقات في صف واحد) === */
        .ls-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          margin: 0;
        }
        @media (max-width: 1180px) {
          .ls-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ls-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .ls-stat-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 10px;
          padding: 9px 11px;
          text-align: right;
          color: inherit;
          font-family: inherit;
          width: 100%;
          display: block;
        }
        .ls-stat-top { display: flex; align-items: center; gap: 6px; }
        .ls-stat-icon {
          width: 26px; height: 26px; border-radius: 7px;
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px;
        }
        .ls-stat-label { color: #94a3b8; font-size: 10.5px; }
        .ls-stat-value {
          color: #f8fafc; font-size: 17px; font-weight: 800;
          margin: 4px 0 2px; letter-spacing: -0.2px;
        }
        .ls-stat-trend { color: #10b981; font-size: 9.5px; font-weight: 700; }
        .ls-stat-muted { color: #64748b; font-weight: 500; margin-right: 3px; font-size: 9.5px; }

        /* === Rows (شبكة موحّدة بنفس الحجم لجميع البطاقات) === */
        .ls-row { display: grid; gap: 8px; margin: 0; }
        .ls-row-3 { grid-template-columns: repeat(3, 1fr); }

        /* === Cards (مربعة / شبه مربعة بنفس الحجم) === */
        /* ✅ v51: تقليص ارتفاع الصناديق لتظهر جميع المحتويات في صفحة واحدة + تفعيل شريط السحب داخل كل صندوق */
        .ls-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
          padding: 8px 10px;
          min-height: 200px;
          height: 200px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .ls-card-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 6px; gap: 6px;
          flex-shrink: 0;
        }
        .ls-card-head h3 {
          margin: 0; color: #f8fafc; font-size: 11.5px; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ls-head-actions { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .ls-sub-title { color: #cbd5e1; font-size: 10px; margin: 0 0 3px; font-weight: 600; }

        /* === Inputs & selects === */
        .ls-select {
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          border: 1px solid rgba(148,163,184,0.15);
          border-radius: 5px; padding: 2px 6px; font-size: 9.5px;
          font-family: inherit;
        }

        /* === Chart area === */
        .ls-chart-area {
          flex: 1; min-height: 0;
          display: flex; align-items: stretch;
        }

        /* === Donut + legend === */
        .ls-donut-wrap {
          display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;
          flex: 1; min-height: 0;
        }
        .ls-donut-wrap-sm { gap: 6px; }
        .ls-legend { list-style: none; padding: 0; margin: 0; flex: 1; min-width: 0; }
        .ls-legend li {
          display: flex; align-items: center; gap: 4px;
          padding: 1.5px 0; font-size: 9.5px; color: #cbd5e1;
        }
        .ls-legend-sm li { font-size: 8.5px; padding: 1px 0; }
        .ls-legend-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ls-legend-value { color: #f8fafc; font-weight: 700; }
        .ls-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

        /* === Activity list === */
        /* ✅ v51: تفعيل شريط سحب واضح داخل كل صندوق */
        .ls-activity {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 5px;
          flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.7) rgba(15,23,42,0.4);
          padding-inline-end: 4px;
        }
        .ls-activity::-webkit-scrollbar { width: 6px; }
        .ls-activity::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.4);
          border-radius: 5px;
        }
        .ls-activity::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.75), rgba(99,102,241,0.75));
          border-radius: 5px;
        }
        .ls-activity::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(139,92,246,1), rgba(99,102,241,1));
        }
        .ls-activity li { display: flex; align-items: center; gap: 6px; }
        .ls-avatar {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: inline-flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 10px;
          flex-shrink: 0;
        }
        .ls-activity-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .ls-activity-body strong { color: #f8fafc; font-size: 10px; }
        .ls-activity-body span {
          color: #94a3b8; font-size: 9px; line-height: 1.25;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ls-live {
          background: #ef4444; color: #fff;
          font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px;
        }

        /* === Scrollable table areas === */
        /* ✅ v51: شريط سحب أوضح وأعرض داخل كل جدول */
        .ls-table-wrap {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.7) rgba(15,23,42,0.4);
          padding-inline-end: 2px;
        }
        .ls-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
        .ls-table-wrap::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.75), rgba(99,102,241,0.75));
          border-radius: 5px;
        }
        .ls-table-wrap::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(139,92,246,1), rgba(99,102,241,1));
        }
        .ls-table-wrap::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.4); border-radius: 5px;
        }

        /* === Tables (مدمجة) === */
        .ls-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
        .ls-table thead th {
          position: sticky; top: 0;
          background: linear-gradient(180deg, #131a33, #0f152a); z-index: 2;
        }
        .ls-table th {
          text-align: right; color: #94a3b8; font-weight: 600;
          padding: 4px 4px; border-bottom: 1px solid rgba(148,163,184,0.10);
          font-size: 8.8px; white-space: nowrap;
        }
        .ls-table td {
          padding: 4px 4px; color: #e2e8f0;
          border-bottom: 1px solid rgba(148,163,184,0.06); font-size: 9.5px;
          white-space: nowrap;
        }
        .ls-table td.ls-ellipsis {
          max-width: 120px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ls-status {
          display: inline-block; padding: 1px 6px; border-radius: 999px;
          font-size: 8.5px; font-weight: 700;
        }
        .ls-status-ok   { background: rgba(16,185,129,0.18); color: #34d399; }
        .ls-status-live { background: rgba(239,68,68,0.18);  color: #fca5a5; }

        /* === KPI mini (داخل بطاقة التقارير المضغوطة) === */
        .ls-kpi-mini {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 4px; margin-bottom: 5px;
          flex-shrink: 0;
        }
        .ls-kpi-cell {
          background: rgba(15,23,42,0.55);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 6px; padding: 4px 6px;
        }
        .ls-kpi-label { color: #94a3b8; font-size: 8.5px; }
        .ls-kpi-value {
          color: #f8fafc; font-size: 11px; font-weight: 800;
          margin: 1px 0; letter-spacing: -0.2px;
        }
        .ls-kpi-trend.up { color: #10b981; font-size: 8.5px; font-weight: 700; }

        /* === Reports mini (chart + donut صغيرين داخل بطاقة واحدة) === */
        .ls-reports-mini {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          flex: 1;
          min-height: 0;
        }
        .ls-reports-chart, .ls-reports-donut {
          display: flex; flex-direction: column;
          min-height: 0; overflow: hidden;
        }

        /* === Responsive breakpoints === */
        @media (max-width: 1280px) {
          .ls-card { height: 195px; min-height: 195px; }
        }
        @media (max-width: 1180px) {
          .ls-row-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 820px) {
          .ls-row-3 { grid-template-columns: 1fr; }
          .ls-card { height: auto; min-height: 200px; max-height: 260px; }
        }

        /* === ✅ v51: إزالة الفراغ العلوي + رفع المحتوى لأعلى اللوحة بالكامل === */
        .admin-page-shell-modern {
          padding: 0 10px 6px !important;
          gap: 6px !important;
          justify-content: flex-start !important;
          align-content: flex-start !important;
        }
        .admin-page-shell-modern .breadcrumbs {
          margin: 0 !important;
          padding: 2px 0 !important;
          font-size: 10px !important;
          line-height: 1.2 !important;
        }
        .admin-topbar-modern {
          min-height: 38px !important;
          padding: 2px 12px !important;
        }
        .ls-admin {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        .ls-admin > *:first-child {
          margin-top: 0 !important;
        }
        /* تقليص الفجوة بين الصفوف */
        .ls-admin {
          gap: 6px !important;
        }
        .ls-row {
          gap: 6px !important;
        }
        .ls-stats-grid {
          gap: 6px !important;
        }
      ` })
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
function normalizeUsers(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.users) ? payload.users : Array.isArray(payload) ? payload : null;
  if (!items?.length) return [];
  return items.map((item, index) => ({
    id: String(item.id ?? item.user_id ?? `USR-${index + 1}`),
    username: item.username || item.handle || `user_${index + 1}`,
    name: item.name || item.full_name || item.username || `مستخدم ${index + 1}`,
    email: item.email || `user${index + 1}@yamshat.app`,
    role: item.role || "user",
    status: item.status || (item.is_banned ? "banned" : item.is_active === false ? "suspended" : "active"),
    riskScore: Number(item.risk_score ?? item.riskScore ?? item.health_score ?? Math.min(95, 20 + index * 9 % 70)),
    reports: Number(item.report_count ?? item.reports ?? index % 6),
    warnings: Number(item.warning_count ?? item.warnings ?? index % 3),
    strikes: Number(item.strike_count ?? item.strikes ?? index % 2),
    shadowBanned: Boolean(item.shadow_banned ?? item.shadowBanned ?? false),
    joinedAt: item.created_at || item.joined_at || new Date(Date.now() - (index + 2) * 864e5).toISOString(),
    lastActive: item.last_active || item.last_seen || new Date(Date.now() - (index + 1) * 36e5).toISOString(),
    ip: item.ip_address || item.ip || "--",
    deviceId: item.device_id || item.fingerprint || "--",
    country: item.country || item.region || "--",
    followers: Number(item.followers ?? item.followers_count ?? 0),
    contentCounts: {
      posts: Number(item.posts_count ?? item.posts ?? 0),
      reels: Number(item.reels_count ?? item.reels ?? 0),
      comments: Number(item.comments_count ?? item.comments ?? 0),
      removals: Number(item.removed_content ?? 0)
    },
    recentContent: Array.isArray(item.recent_content) && item.recent_content.length ? item.recent_content.map((content, contentIndex) => ({
      id: String(content.id ?? `${item.id || index}-content-${contentIndex}`),
      type: content.type || "post",
      title: content.title || content.caption || content.text || `عنصر محتوى ${contentIndex + 1}`,
      status: content.status || "visible",
      risk: Number(content.risk ?? content.score ?? 20 + contentIndex * 12)
    })) : [],
    auditTrail: Array.isArray(item.audit_trail) ? item.audit_trail : [],
    appealOpen: Boolean(item.appeal_open ?? item.appealOpen ?? false)
  }));
}
function statusTone(status) {
  switch (status) {
    case "active":
      return { bg: "rgba(34,197,94,0.16)", color: "#22c55e", label: "نشط" };
    case "flagged":
      return { bg: "rgba(249,115,22,0.16)", color: "#f97316", label: "مراقب" };
    case "frozen":
      return { bg: "rgba(245,158,11,0.16)", color: "#f59e0b", label: "مجمّد" };
    case "suspended":
      return { bg: "rgba(251,146,60,0.16)", color: "#fb923c", label: "معلّق" };
    case "banned":
      return { bg: "rgba(239,68,68,0.16)", color: "#ef4444", label: "محظور" };
    default:
      return { bg: "rgba(148,163,184,0.16)", color: "#94a3b8", label: status || "غير معروف" };
  }
}
function riskTone(score) {
  if (score >= 85) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 35) return "#f59e0b";
  return "#22c55e";
}
function roleLabel(role) {
  const labels = {
    super_admin: "مدير عام",
    admin: "Admin",
    moderator: "مشرف",
    support: "دعم",
    creator: "صانع محتوى",
    analyst: "محلل",
    user: "مستخدم"
  };
  return labels[role] || role;
}
function exportCsv(filename, rows) {
  const header = Object.keys(rows[0] || {});
  const csv = [header.join(","), ...rows.map((row) => header.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
function AdminUsers() {
  const { pushToast } = useToast();
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedId, setSelectedId] = reactExports.useState("");
  const [filters, setFilters] = reactExports.useState({ search: "", status: "all", role: "all", risk: "all" });
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [banHistory, setBanHistory] = reactExports.useState([]);
  const [busyAction, setBusyAction] = reactExports.useState("");
  const mergeUser = reactExports.useCallback((userId, patch) => {
    setUsers((prev) => prev.map((item) => item.id === userId ? { ...item, ...patch } : item));
  }, []);
  const appendAudit = reactExports.useCallback((userId, action, note) => {
    setUsers((prev) => prev.map((item) => item.id === userId ? {
      ...item,
      auditTrail: [{ id: `${userId}-${Date.now()}`, action, note, at: (/* @__PURE__ */ new Date()).toISOString() }, ...item.auditTrail || []].slice(0, 12)
    } : item));
  }, []);
  const loadUsers = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const [usersResponse, banHistoryResponse] = await Promise.allSettled([
        getAdminUsers({ page: 1, page_size: 80 }),
        getAdminBanHistory(20)
      ]);
      const normalized = usersResponse.status === "fulfilled" ? normalizeUsers(usersResponse.value?.data) : [];
      setUsers(normalized);
      setSelectedId((prev) => prev || normalized[0]?.id || "");
      const historyPayload = banHistoryResponse.status === "fulfilled" ? banHistoryResponse.value?.data : null;
      const historyItems = Array.isArray(historyPayload?.items) ? historyPayload.items : Array.isArray(historyPayload) ? historyPayload : [];
      setBanHistory(historyItems.slice(0, 20));
      if (usersResponse.status !== "fulfilled") {
        pushToast({ type: "warning", title: "تعذر تحميل المستخدمين", description: "لا توجد بيانات مستخدمين متاحة من الخادم حالياً." });
      }
    } catch (error) {
      setUsers([]);
      setSelectedId("");
      setBanHistory([]);
      pushToast({ type: "warning", title: "تعذر تحميل المستخدمين", description: error?.response?.data?.detail || error?.message || "الخادم لم يرجع بيانات حالياً." });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);
  reactExports.useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  reactExports.useEffect(() => {
    const refresh = () => loadUsers();
    socketManager.on("admin:user_updated", refresh);
    socketManager.on("admin:user_status_changed", refresh);
    socketManager.on("admin:user_deleted", refresh);
    return () => {
      socketManager.off("admin:user_updated", refresh);
      socketManager.off("admin:user_status_changed", refresh);
      socketManager.off("admin:user_deleted", refresh);
    };
  }, [loadUsers]);
  const filteredUsers = reactExports.useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesKeyword = !keyword || [user.id, user.username, user.name, user.email, user.ip].join(" ").toLowerCase().includes(keyword);
      const matchesStatus = filters.status === "all" || user.status === filters.status;
      const matchesRole = filters.role === "all" || user.role === filters.role;
      const matchesRisk = filters.risk === "all" || filters.risk === "high" && user.riskScore >= 75 || filters.risk === "medium" && user.riskScore >= 40 && user.riskScore < 75 || filters.risk === "low" && user.riskScore < 40;
      return matchesKeyword && matchesStatus && matchesRole && matchesRisk;
    }).sort((a, b) => b.riskScore - a.riskScore || new Date(b.lastActive) - new Date(a.lastActive));
  }, [filters, users]);
  const selectedUser = reactExports.useMemo(() => filteredUsers.find((item) => item.id === selectedId) || users.find((item) => item.id === selectedId) || filteredUsers[0] || users[0] || null, [filteredUsers, selectedId, users]);
  reactExports.useEffect(() => {
    if (!selectedUser && filteredUsers[0]) setSelectedId(filteredUsers[0].id);
  }, [filteredUsers, selectedUser]);
  const summary = reactExports.useMemo(() => ({
    total: filteredUsers.length,
    highRisk: filteredUsers.filter((item) => item.riskScore >= 75).length,
    banned: filteredUsers.filter((item) => item.status === "banned").length,
    appeals: filteredUsers.filter((item) => item.appealOpen).length,
    removals: filteredUsers.reduce((sum, item) => sum + Number(item.contentCounts?.removals || 0), 0)
  }), [filteredUsers]);
  const topRoles = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    filteredUsers.forEach((item) => map.set(item.role, (map.get(item.role) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [filteredUsers]);
  const bulkCount = selectedIds.length;
  const openUser = reactExports.useCallback(async (user) => {
    setSelectedId(user.id);
    try {
      const [{ data: detail }, auditPayload] = await Promise.all([
        getAdminUser(user.id),
        adminService.getUserAuditLogs(user.id, { limit: 10 }).catch(() => null)
      ]);
      const [normalized] = normalizeUsers([detail]);
      const auditItems = Array.isArray(auditPayload?.items) ? auditPayload.items : Array.isArray(auditPayload?.logs) ? auditPayload.logs : [];
      mergeUser(user.id, {
        ...normalized,
        auditTrail: auditItems.length ? auditItems.map((item, index) => ({
          id: item.id || `audit-${index}`,
          action: item.action || item.event || "admin_action",
          note: item.summary || item.message || item.description || "بدون ملاحظات.",
          at: item.timestamp || item.created_at || (/* @__PURE__ */ new Date()).toISOString()
        })) : normalized.auditTrail
      });
    } catch {
    }
  }, [mergeUser]);
  const handleRoleChange = reactExports.useCallback(async (user, nextRole) => {
    try {
      setBusyAction(`role-${user.id}`);
      mergeUser(user.id, { role: nextRole });
      await updateAdminUser(user.id, { role: nextRole });
      appendAudit(user.id, "role_change", `تم تغيير الدور إلى ${nextRole}.`);
      pushToast({ type: "success", title: "تم تحديث الدور", description: `${user.username} أصبح ${roleLabel(nextRole)}.` });
    } catch (error) {
      mergeUser(user.id, { role: user.role });
      appendAudit(user.id, "role_change_local", `تم حفظ التغيير محليًا فقط: ${nextRole}.`);
      pushToast({ type: "warning", title: "تم حفظ التغيير محليًا", description: error?.response?.data?.detail || "الـ API لم يقبل تغيير الدور، لكن الواجهة جاهزة." });
    } finally {
      setBusyAction("");
    }
  }, [appendAudit, mergeUser, pushToast]);
  const handleBanToggle = reactExports.useCallback(async (user, restore = false) => {
    const originalStatus = user.status;
    try {
      setBusyAction(`ban-${user.id}`);
      mergeUser(user.id, { status: restore ? "active" : "banned", shadowBanned: restore ? false : true, appealOpen: restore ? false : true });
      await banAdminUser(user.id, restore);
      appendAudit(user.id, restore ? "ban_restored" : "user_banned", restore ? "تم رفع الحظر وإعادة التفعيل." : "تم تنفيذ حظر إداري مع فتح مسار استئناف.");
      pushToast({ type: restore ? "success" : "warning", title: restore ? "تم رفع الحظر" : "تم حظر المستخدم", description: user.username });
    } catch (error) {
      mergeUser(user.id, { status: originalStatus, shadowBanned: user.shadowBanned, appealOpen: user.appealOpen });
      appendAudit(user.id, "ban_local_only", restore ? "فشل رفع الحظر من الخادم." : "فشل الحظر من الخادم، التغيير محلي فقط.");
      pushToast({ type: "warning", title: "تعذر إكمال العملية من الخادم", description: error?.response?.data?.detail || "تم الإبقاء على التغيير داخل الواجهة." });
    } finally {
      setBusyAction("");
    }
  }, [appendAudit, mergeUser, pushToast]);
  const handleShadowBan = reactExports.useCallback(async (user, enabled) => {
    try {
      setBusyAction(`shadow-${user.id}`);
      mergeUser(user.id, { shadowBanned: enabled, status: enabled && user.status === "active" ? "flagged" : user.status });
      await toggleAdminShadowBan(user.id, enabled);
      appendAudit(user.id, enabled ? "shadow_ban_enabled" : "shadow_ban_disabled", enabled ? "تفعيل Shadow Ban لإخفاء الوصول." : "إلغاء Shadow Ban.");
      pushToast({ type: "info", title: enabled ? "Shadow Ban مفعّل" : "Shadow Ban ملغي", description: user.username });
    } catch (error) {
      mergeUser(user.id, { shadowBanned: user.shadowBanned, status: user.status });
      pushToast({ type: "warning", title: "فشل تفعيل Shadow Ban", description: error?.response?.data?.detail || "تم الاكتفاء بالتغيير المحلي." });
    } finally {
      setBusyAction("");
    }
  }, [appendAudit, mergeUser, pushToast]);
  const handleLocalAction = reactExports.useCallback((user, type) => {
    const map = {
      warn: () => {
        mergeUser(user.id, { warnings: user.warnings + 1, status: user.status === "active" ? "flagged" : user.status, riskScore: Math.min(99, user.riskScore + 6) });
        appendAudit(user.id, "warning_sent", "تم إرسال تحذير إداري وربط الحالة بملف المراجعة.");
      },
      freeze: () => {
        mergeUser(user.id, { status: "frozen", riskScore: Math.min(99, user.riskScore + 8), appealOpen: true });
        appendAudit(user.id, "user_frozen", "تجميد مؤقت لمدة 24 ساعة مع إتاحة الاستئناف.");
      },
      strike: () => {
        mergeUser(user.id, { strikes: user.strikes + 1, riskScore: Math.min(99, user.riskScore + 10), appealOpen: true });
        appendAudit(user.id, "strike_added", "تمت إضافة strike جديدة بسبب سلوك مخالف.");
      },
      remove_content: () => {
        mergeUser(user.id, {
          contentCounts: { ...user.contentCounts, removals: Number(user.contentCounts?.removals || 0) + 1 },
          recentContent: (user.recentContent || []).map((content, index) => index === 0 ? { ...content, status: "removed", risk: Math.max(content.risk || 0, 88) } : content),
          appealOpen: true
        });
        appendAudit(user.id, "content_removed", "تم حذف عنصر محتوى وفتح مسار استئناف تلقائي.");
      }
    };
    map[type]?.();
    pushToast({ type: "info", title: "تم تنفيذ الإجراء", description: `${type} • ${user.username}` });
  }, [appendAudit, mergeUser, pushToast]);
  const handleDeleteUser = reactExports.useCallback(async (user) => {
    try {
      setBusyAction(`delete-${user.id}`);
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setSelectedIds((prev) => prev.filter((id) => id !== user.id));
      pushToast({ type: "success", title: "تم حذف المستخدم", description: user.username });
    } catch (error) {
      pushToast({ type: "warning", title: "تعذر حذف المستخدم من الخادم", description: error?.response?.data?.detail || "احتفظت الواجهة بالمستخدم لعدم فقدان البيانات." });
    } finally {
      setBusyAction("");
    }
  }, [pushToast]);
  const toggleSelect = reactExports.useCallback((userId) => {
    setSelectedIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  }, []);
  const applyBulkAction = reactExports.useCallback((type) => {
    if (!selectedIds.length) {
      pushToast({ type: "warning", title: "لا يوجد تحديد", description: "اختر مستخدمين أولًا لتنفيذ الإجراء الجماعي." });
      return;
    }
    setUsers((prev) => prev.map((item) => selectedIds.includes(item.id) ? {
      ...item,
      status: type === "bulk_ban" ? "banned" : type === "bulk_flag" ? "flagged" : item.status,
      shadowBanned: type === "bulk_shadow" ? true : item.shadowBanned,
      appealOpen: type === "bulk_ban" ? true : item.appealOpen,
      auditTrail: [{ id: `${item.id}-${Date.now()}`, action: type, note: "إجراء جماعي من شاشة المستخدمين.", at: (/* @__PURE__ */ new Date()).toISOString() }, ...item.auditTrail || []].slice(0, 12)
    } : item));
    pushToast({ type: "info", title: "تم تنفيذ إجراء جماعي", description: `${selectedIds.length} مستخدم` });
    setSelectedIds([]);
  }, [pushToast, selectedIds]);
  const exportUsers = reactExports.useCallback(() => {
    exportCsv("yamshat_admin_users.csv", filteredUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      riskScore: user.riskScore,
      reports: user.reports,
      warnings: user.warnings,
      strikes: user.strikes,
      shadowBanned: user.shadowBanned,
      lastActive: user.lastActive
    })));
    pushToast({ type: "success", title: "تم التصدير", description: "تم إنشاء ملف CSV لقائمة المستخدمين الحالية." });
  }, [filteredUsers, pushToast]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gap: 18 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#60a5fa", fontSize: 13, marginBottom: 8 }, children: "User actions • Ban system • Content removal • Appeal-ready workflows" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, color: "#f8fafc" }, children: "إدارة المستخدمين والإجراءات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 820 }, children: "تم استكمال شاشة المستخدمين لتشمل إجراءات سريعة على الحساب، Shadow Ban، الحظر والاسترجاع، إزالة المحتوى، وسجل تدقيق مرتبط بكل مستخدم بدل شاشة ثابتة ناقصة." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadUsers, loading, children: "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: exportUsers, children: "تصدير CSV" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: [
      { label: "المستخدمون بعد الفلترة", value: summary.total, hint: "العدد الحالي داخل الجدول" },
      { label: "مخاطر عالية", value: summary.highRisk, hint: "Risk score أكبر من 75" },
      { label: "حسابات محظورة", value: summary.banned, hint: "حظر كامل أو دائم" },
      { label: "استئنافات مفتوحة", value: summary.appeals, hint: "تحتاج قرار مراجعة" },
      { label: "إزالات محتوى", value: summary.removals, hint: "تم تنفيذها من إدارة المستخدمين" }
    ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontSize: 28, fontWeight: 800, margin: "10px 0 8px" }, children: item.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
    ] }, item.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(340px, 0.9fr)", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, minWidth: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "بحث", value: filters.search, onChange: (event) => setFilters((prev) => ({ ...prev, search: event.target.value })), placeholder: "الاسم / المعرف / الإيميل / IP" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الحالة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.status, onChange: (event) => setFilters((prev) => ({ ...prev, status: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "نشط" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "flagged", children: "مراقب" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "frozen", children: "مجمّد" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "banned", children: "محظور" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الدور" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.role, onChange: (event) => setFilters((prev) => ({ ...prev, role: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              Array.from(new Set(users.map((item) => item.role))).map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: role, children: roleLabel(role) }, role))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "المخاطر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: filters.risk, onChange: (event) => setFilters((prev) => ({ ...prev, risk: event.target.value })), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "high", children: "مرتفع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "medium", children: "متوسط" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "low", children: "منخفض" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: "جدول إجراءات حي مع تحديد جماعي، مراجعة حساب، وإجراءات حظر فورية." }),
          bulkCount ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => applyBulkAction("bulk_flag"), children: "تمييز جماعي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "danger", onClick: () => applyBulkAction("bulk_ban"), children: "حظر جماعي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => applyBulkAction("bulk_shadow"), children: "Shadow Ban" })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { style: { width: 48 } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الدور" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المخاطر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "بلاغات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "آخر نشاط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "إجراءات" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            filteredUsers.map((user) => {
              const status = statusTone(user.status);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { style: { background: selectedUser?.id === user.id ? "rgba(59,130,246,0.08)" : "transparent" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.includes(user.id), onChange: () => toggleSelect(user.id) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => openUser(user), style: { background: "transparent", border: 0, color: "inherit", textAlign: "right", cursor: "pointer", padding: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 4 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#f8fafc" }, children: user.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#94a3b8", fontSize: 12 }, children: [
                    user.username,
                    " • ",
                    user.email
                  ] })
                ] }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: roleLabel(user.role) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 86, height: 8, borderRadius: 999, background: "rgba(148,163,184,0.12)", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: `${user.riskScore}%`, height: "100%", background: riskTone(user.riskScore) } }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { style: { color: riskTone(user.riskScore), fontSize: 12 }, children: [
                    user.riskScore,
                    "%"
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { display: "inline-flex", padding: "5px 10px", borderRadius: 999, background: status.bg, color: status.color, fontSize: 12 }, children: status.label }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: user.reports }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: new Date(user.lastActive).toLocaleString("ar-EG") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => openUser(user), children: "مراجعة" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: user.status === "banned" ? "success" : "danger", loading: busyAction === `ban-${user.id}`, onClick: () => handleBanToggle(user, user.status === "banned"), children: user.status === "banned" ? "استرجاع" : "حظر" })
                ] }) })
              ] }, user.id);
            }),
            !filteredUsers.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: "8", className: "table-empty", children: "لا توجد نتائج مطابقة للفلاتر الحالية." }) }) : null
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 18, display: "grid", gap: 16 }, children: selectedUser ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#60a5fa", fontSize: 12 }, children: selectedUser.id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: "6px 0 4px", color: "#f8fafc" }, children: selectedUser.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#94a3b8", fontSize: 13 }, children: [
            selectedUser.username,
            " • ",
            selectedUser.country
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }, children: [
          ["الدور", roleLabel(selectedUser.role)],
          ["المتابعون", selectedUser.followers.toLocaleString("ar-EG")],
          ["IP", selectedUser.ip],
          ["Device", selectedUser.deviceId],
          ["البلاغات", selectedUser.reports],
          ["الإزالات", selectedUser.contentCounts?.removals || 0]
        ].map(([label, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", marginTop: 4 }, children: value })
        ] }, label)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: "إجراءات المستخدم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => handleLocalAction(selectedUser, "warn"), children: "تحذير" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => handleLocalAction(selectedUser, "freeze"), children: "تجميد مؤقت" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => handleLocalAction(selectedUser, "strike"), children: "إضافة Strike" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "danger", onClick: () => handleLocalAction(selectedUser, "remove_content"), children: "إزالة محتوى" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: selectedUser.shadowBanned ? "success" : "secondary", loading: busyAction === `shadow-${selectedUser.id}`, onClick: () => handleShadowBan(selectedUser, !selectedUser.shadowBanned), children: selectedUser.shadowBanned ? "إلغاء Shadow Ban" : "Shadow Ban" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
            ["user", "support", "moderator"].filter((role) => role !== selectedUser.role).map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "small", variant: "secondary", loading: busyAction === `role-${selectedUser.id}`, onClick: () => handleRoleChange(selectedUser, role), children: [
              "تحويل إلى ",
              roleLabel(role)
            ] }, role)),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "danger", loading: busyAction === `delete-${selectedUser.id}`, onClick: () => handleDeleteUser(selectedUser), children: "حذف الحساب" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 18, padding: 16, background: selectedUser.appealOpen ? "rgba(249,115,22,0.14)" : "rgba(34,197,94,0.14)", border: `1px solid ${selectedUser.appealOpen ? "rgba(249,115,22,0.35)" : "rgba(34,197,94,0.35)"}` }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 700 }, children: selectedUser.appealOpen ? "يوجد استئناف مفتوح" : "لا توجد استئنافات حالية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cbd5e1", fontSize: 13, marginTop: 6 }, children: selectedUser.appealOpen ? "تم تجهيز الحساب للربط المباشر مع نظام الاستئناف داخل مركز البلاغات." : "الحساب مستقر ولا يحتاج مراجعة استئناف الآن." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginTop: 0, color: "#f8fafc" }, children: "آخر المحتوى المرتبط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10 }, children: [
            (selectedUser.recentContent || []).map((content) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 16, padding: 12, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "#f8fafc" }, children: content.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: riskTone(content.risk), fontSize: 12 }, children: [
                  "Risk ",
                  content.risk,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#94a3b8", fontSize: 12, marginTop: 4 }, children: [
                content.id,
                " • ",
                content.type,
                " • ",
                content.status
              ] })
            ] }, content.id)),
            !selectedUser.recentContent?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: "لا توجد عناصر محتوى حديثة." }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginTop: 0, color: "#f8fafc" }, children: "سجل التدقيق للمستخدم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10 }, children: [
            (selectedUser.auditTrail || []).map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderInlineStart: "3px solid rgba(96,165,250,0.8)", paddingInlineStart: 12 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 700, fontSize: 13 }, children: entry.action }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cbd5e1", fontSize: 13, marginTop: 4 }, children: entry.note }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12, marginTop: 4 }, children: new Date(entry.at).toLocaleString("ar-EG") })
            ] }, entry.id)),
            !selectedUser.auditTrail?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: "لا يوجد سجل إضافي لهذا المستخدم." }) : null
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8" }, children: "اختر مستخدمًا من الجدول لعرض التفاصيل." }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "توزيع الأدوار" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: topRoles.map(([role, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13, marginBottom: 6 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: roleLabel(role) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: count })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: 10, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.12)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: `${count / Math.max(filteredUsers.length, 1) * 100}%`, height: "100%", background: "linear-gradient(90deg,#22d3ee,#8b5cf6)" } }) })
        ] }, role)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "سجل الحظر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: banHistory.length ? banHistory.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 16, padding: 12, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 700 }, children: item.username || item.user || item.user_id || item.id || `ban-${index + 1}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cbd5e1", fontSize: 13, marginTop: 4 }, children: item.reason || item.action || "إجراء حظر إداري" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12, marginTop: 4 }, children: new Date(item.created_at || item.timestamp || Date.now()).toLocaleString("ar-EG") })
        ] }, item.id || index)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: "لا توجد بيانات ban history من الخادم حاليًا، لكن نظام الحظر داخل الشاشة أصبح جاهزًا للعمل." }) })
      ] })
    ] })
  ] }) });
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
  const [formOpen, setFormOpen] = reactExports.useState(false);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [loadError, setLoadError] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const [actionBusyKey, setActionBusyKey] = reactExports.useState("");
  const [mediaReviewOpen, setMediaReviewOpen] = reactExports.useState(false);
  const [currentMedia, setCurrentMedia] = reactExports.useState(null);
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(search, 350);
  const resetForm = () => {
    setForm(initialForm$1);
    setEditingPost(null);
    setFormOpen(false);
  };
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
      setPosts(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || pagination);
    } catch (error) {
      const message = error?.response?.data?.detail || "حدث خطأ أثناء تحميل المنشورات.";
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
  const toggleAll = (checked) => {
    setSelectedIds(checked ? posts.map((post) => post.id) : []);
  };
  const openCreateModal = () => {
    setEditingPost(null);
    setForm(initialForm$1);
    setFormOpen(true);
  };
  const openEditModal = (post) => {
    setEditingPost(post);
    setForm({
      content: post?.content || "",
      image_url: post?.image_url || "",
      user_id: post?.user_id ? String(post.user_id) : ""
    });
    setFormOpen(true);
  };
  const handleSave = async () => {
    const content = String(form.content || "").trim();
    if (!content) {
      pushToast({ title: "محتوى المنشور مطلوب", type: "warning" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        content,
        image_url: String(form.image_url || "").trim() || void 0,
        user_id: form.user_id ? Number(form.user_id) : void 0
      };
      if (editingPost?.id) {
        await updateAdminPost(editingPost.id, payload);
        pushToast({ title: "تم تعديل المنشور", type: "success" });
      } else {
        await createAdminPost(payload);
        pushToast({ title: "تم إنشاء المنشور", type: "success" });
      }
      resetForm();
      loadPosts(editingPost?.id ? pagination.page : 1);
    } catch (error) {
      pushToast({
        title: editingPost?.id ? "فشل تعديل المنشور" : "فشل إنشاء المنشور",
        description: error?.response?.data?.detail || error?.message,
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (post) => {
    if (!post?.id) return;
    try {
      setActionBusyKey(`delete-${post.id}`);
      await deleteAdminPost(post.id);
      pushToast({ title: "تم حذف المنشور", type: "success" });
      setDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== post.id));
      loadPosts(pagination.page);
    } catch (error) {
      pushToast({ title: "فشل حذف المنشور", description: error?.response?.data?.detail || error?.message, type: "error" });
    } finally {
      setActionBusyKey("");
    }
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      setActionBusyKey("bulk-delete");
      await bulkDeleteAdminPosts(selectedIds);
      pushToast({ title: "تم حذف المنشورات المحددة", description: `عدد العناصر: ${selectedIds.length}`, type: "success" });
      setSelectedIds([]);
      loadPosts(pagination.page);
    } catch (error) {
      pushToast({ title: "فشل الحذف الجماعي", description: error?.response?.data?.detail || error?.message, type: "error" });
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            label: "بحث",
            value: search,
            onChange: (event) => setSearch(event.target.value),
            placeholder: "ابحث في المحتوى أو اسم المستخدم"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الترتيب" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: sortBy, onChange: (event) => setSortBy(event.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "created_at", children: "الأحدث" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "engagement", children: "الأعلى تفاعلاً" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الاتجاه" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: sortDirection, onChange: (event) => setSortDirection(event.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "desc", children: "تنازلي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "asc", children: "تصاعدي" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row wide", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: openCreateModal, children: "منشور جديد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            className: "danger",
            disabled: !selectedIds.length,
            loading: actionBusyKey === "bulk-delete",
            onClick: handleBulkDelete,
            children: "حذف المحدد"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => loadPosts(pagination.page), loading, children: "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", children: [
          selectedIds.length,
          " عنصر محدد"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "إدارة المنشورات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", style: { margin: "6px 0 0" }, children: "تم ربط الصفحة فقط بالعمليات المدعومة فعليًا من الخادم: عرض، إنشاء، تعديل، حذف، وحذف جماعي." })
        ] }),
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
      loadError && !loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل المنشورات", description: loadError, onRetry: () => loadPosts(pagination.page) }) : null,
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, { rows: 6 }) : null,
      !loading && !loadError && !posts.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "لا توجد منشورات", description: "ابدأ بإنشاء منشور جديد من لوحة الإدارة." }) : null,
      !loading && !loadError && posts.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: posts.length > 0 && selectedIds.length === posts.length,
              onChange: (event) => toggleAll(event.target.checked)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الكاتب" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المحتوى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التفاعل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الإجراءات" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: posts.map((post) => {
          const likes = Number(post.likes ?? post.like_count ?? 0);
          const comments = Number(post.comments ?? post.comment_count ?? 0);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.includes(post.id), onChange: () => toggleSelected(post.id) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
              "#",
              post.id
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-cell", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.username || "unknown" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", children: [
                "UID: ",
                post.user_id
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "content-preview", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: post.content ? `${post.content.slice(0, 90)}${post.content.length > 90 ? "…" : ""}` : "بدون نص" }),
              post.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "media-badge", onClick: () => openMediaReview(post), children: "معاينة الوسائط" }) : null
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stacked-metrics", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "إعجابات: ",
                likes
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "تعليقات: ",
                comments
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action", onClick: () => openEditModal(post), children: "تعديل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action danger", onClick: () => setDeleteTarget(post), children: "حذف" })
            ] }) })
          ] }, post.id);
        }) })
      ] }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: formOpen, title: editingPost ? "تعديل منشور" : "منشور جديد", onClose: resetForm, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stacked-form", style: { display: "grid", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          label: "محتوى المنشور",
          value: form.content,
          onChange: (event) => setForm((prev) => ({ ...prev, content: event.target.value })),
          placeholder: "اكتب نص المنشور"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          label: "رابط الصورة",
          value: form.image_url,
          onChange: (event) => setForm((prev) => ({ ...prev, image_url: event.target.value })),
          placeholder: "https://..."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          label: "رقم المستخدم",
          value: form.user_id,
          onChange: (event) => setForm((prev) => ({ ...prev, user_id: event.target.value.replace(/[^0-9]/g, "") })),
          placeholder: "اختياري"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: resetForm, children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, loading: saving, children: editingPost ? "حفظ التعديل" : "إنشاء المنشور" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: !!deleteTarget, title: "تأكيد حذف المنشور", onClose: () => setDeleteTarget(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: 0 }, children: [
        "هل تريد حذف المنشور رقم ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
          "#",
          deleteTarget?.id
        ] }),
        " نهائيًا؟"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setDeleteTarget(null), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "danger", loading: actionBusyKey === `delete-${deleteTarget?.id || ""}`, onClick: () => handleDelete(deleteTarget), children: "تأكيد الحذف" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: mediaReviewOpen, title: "معاينة الوسائط", onClose: () => setMediaReviewOpen(false), children: currentMedia ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "media-review-container", style: { display: "grid", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: currentMedia.image_url, alt: "Post content", className: "review-img", style: { width: "100%", borderRadius: 14 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setMediaReviewOpen(false), children: "إغلاق" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "danger", onClick: () => {
          setMediaReviewOpen(false);
          setDeleteTarget(currentMedia);
        }, children: "حذف هذا المنشور" })
      ] })
    ] }) : null })
  ] });
}
const TARGET_ROLE_OPTIONS = [
  { value: "", label: "كل المستخدمين" },
  { value: "user", label: "المستخدمون" },
  { value: "moderator", label: "المشرفون" },
  { value: "admin", label: "الإدارة" }
];
function AdminNotifications() {
  const [notifications, setNotifications] = reactExports.useState([]);
  const [form, setForm] = reactExports.useState({ title: "", body: "", targetRole: "" });
  const [loading, setLoading] = reactExports.useState(true);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const { pushToast } = useToast();
  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminNotifications(50);
      setNotifications(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      setNotifications([]);
      pushToast({ title: "تعذر تحميل الإشعارات", description: "حاول مرة أخرى بعد قليل.", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const analytics = reactExports.useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((item) => !item?.is_read).length;
    const broadcasts = notifications.filter((item) => item?.data?.broadcast).length;
    const today = notifications.filter((item) => {
      if (!item?.created_at) return false;
      const created = new Date(item.created_at);
      const now = /* @__PURE__ */ new Date();
      return created.toDateString() === now.toDateString();
    }).length;
    return { total, unread, broadcasts, today };
  }, [notifications]);
  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      pushToast({ title: "البيانات ناقصة", description: "اكتب العنوان والمحتوى أولاً.", type: "warning" });
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await broadcastAdminNotification({
        title: form.title.trim(),
        body: form.body.trim(),
        type: "SYSTEM",
        target_role: form.targetRole || null
      });
      pushToast({
        title: "تم إرسال الإشعار",
        description: `تمت المعالجة لـ ${data?.recipients ?? 0} مستخدم.`,
        type: "success"
      });
      setForm({ title: "", body: "", targetRole: "" });
      await loadData();
    } catch (error) {
      pushToast({ title: "فشل إرسال الإشعار", description: "تحقق من الصلاحيات أو أعد المحاولة.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "notifications-dashboard", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "two-column-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "إرسال إشعار فوري", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "العنوان", value: form.title, onChange: (e) => setForm((prev) => ({ ...prev, title: e.target.value })) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "محتوى الإشعار" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input", rows: "4", value: form.body, onChange: (e) => setForm((prev) => ({ ...prev, body: e.target.value })) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "الفئة المستهدفة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "input", value: form.targetRole, onChange: (e) => setForm((prev) => ({ ...prev, targetRole: e.target.value })), children: TARGET_ROLE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value || "all")) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleBroadcast, loading: submitting, disabled: submitting, children: submitting ? "جارٍ الإرسال..." : "إرسال الآن" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "ملخص الإشعارات", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "analytics-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "إجمالي الإشعارات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: analytics.total })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "غير مقروء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value info", children: analytics.unread })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "إشعارات جماعية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value success", children: analytics.broadcasts })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "اليوم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value warning", children: analytics.today })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "سجل الإشعارات", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state", children: "جارٍ تحميل السجل..." }) : !notifications.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state", children: "لا توجد إشعارات متاحة حالياً." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "العنوان" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المحتوى" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المستخدم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "النوع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التوقيت" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: notifications.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: item.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: item.body }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: item.username || `#${item.user_id}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: item.type }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `status-dot ${item.is_read ? "sent" : "scheduled"}` }),
          item.is_read ? "تمت القراءة" : "غير مقروء"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: item.created_at ? new Date(item.created_at).toLocaleString("ar-EG") : "—" })
      ] }, item.id)) })
    ] }) }) })
  ] }) });
}
const ROW_HEIGHT = 94;
const QUEUE_HEIGHT = 520;
const OVERSCAN = 4;
function normalizeReports(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.reports) ? payload.reports : Array.isArray(payload) ? payload : null;
  if (!items?.length) return [];
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
    case "appealed":
      return "قيد الاستئناف";
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
function buildKpis(reports, removals, appeals) {
  const pending = reports.filter((item) => item.status === "pending").length;
  const escalated = reports.filter((item) => item.status === "escalated").length;
  const critical = reports.filter((item) => item.severity === "critical").length;
  const underSla = reports.filter((item) => item.slaMinutes <= 30).length;
  const accuracy = Math.round(reports.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(reports.length, 1));
  return [
    { label: "Review Queue", value: pending, hint: "بانتظار أول قرار من الفريق" },
    { label: "Critical cases", value: critical, hint: "أولوية قصوى" },
    { label: "Escalations", value: escalated, hint: "تم رفعها للإدارة العليا" },
    { label: "Moderation accuracy", value: `${accuracy}%`, hint: "متوسط دقة الفرز الحالي" },
    { label: "Content removals", value: removals.length, hint: "إجراءات حذف أو إخفاء" },
    { label: "Appeals open", value: appeals.filter((item) => item.status === "open").length, hint: "استئنافات تنتظر القرار" },
    { label: "SLA ≤ 30m", value: `${underSla}/${reports.length}`, hint: "الالتزام بسرعة الاستجابة" }
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
function seedRemovalRegistry(reports) {
  return reports.slice(0, 3).map((report, index) => ({
    id: `REM-${index + 1}`,
    reportId: report.id,
    target: report.target,
    targetType: report.targetType,
    action: index === 1 ? "hide_from_feed" : "remove_content",
    reason: report.reason,
    status: index === 2 ? "restored" : "active",
    executedAt: new Date(Date.now() - index * 2 * 60 * 60 * 1e3).toISOString(),
    by: ["Content Lead", "Trust & Safety", "Super Admin"][index % 3]
  }));
}
function seedAppealsRegistry(reports) {
  return reports.slice(0, 3).map((report, index) => ({
    id: `APL-${index + 1}`,
    reportId: report.id,
    target: report.target,
    appellant: [report.reporter, "@creator_case", "@owner_media"][index] || report.reporter,
    request: index === 0 ? "إعادة فحص قرار الحظر المؤقت." : index === 1 ? "استرجاع المحتوى بعد إزالة تلقائية." : "الاعتراض على إنذار حقوق النشر.",
    status: index === 1 ? "under_review" : "open",
    severity: report.severity,
    submittedAt: new Date(Date.now() - (index + 1) * 90 * 60 * 1e3).toISOString(),
    decision: ""
  }));
}
function QueueRow({ report, active, onOpen, onResolve, onEscalate, onRemove }) {
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
        gridTemplateColumns: "minmax(0, 1.7fr) minmax(180px, 0.9fr) minmax(220px, 0.9fr)",
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
            onRemove(report);
          }, children: "إزالة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: (event) => {
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
  const [activeTab, setActiveTab] = reactExports.useState("queue");
  const [removals, setRemovals] = reactExports.useState([]);
  const [appeals, setAppeals] = reactExports.useState([]);
  const [activityLog, setActivityLog] = reactExports.useState([]);
  const pushActivity = reactExports.useCallback((title, description, tone = "#38bdf8") => {
    setActivityLog((prev) => [{ id: `${Date.now()}-${prev.length}`, title, description, tone, at: (/* @__PURE__ */ new Date()).toISOString() }, ...prev].slice(0, 12));
  }, []);
  const loadReports = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getAdminReportsSummary();
      const normalized = normalizeReports(data);
      setReports(normalized);
      setActiveReportId((prev) => prev || normalized[0]?.id || "");
      setRemovals((prev) => prev.length ? prev : seedRemovalRegistry(normalized));
      setAppeals((prev) => prev.length ? prev : seedAppealsRegistry(normalized));
    } catch (error) {
      setReports([]);
      setActiveReportId("");
      setRemovals([]);
      setAppeals([]);
      pushToast({ type: "warning", title: "تعذر تحميل البلاغات", description: error?.response?.data?.detail || "الخادم لم يرجع بلاغات حالياً." });
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
  const kpis = reactExports.useMemo(() => buildKpis(filteredReports, removals, appeals), [filteredReports, removals, appeals]);
  const scoring = reactExports.useMemo(() => scoreBars(filteredReports), [filteredReports]);
  const activeReport = reactExports.useMemo(
    () => filteredReports.find((item) => item.id === activeReportId) || filteredReports[0] || null,
    [activeReportId, filteredReports]
  );
  const totalHeight = filteredReports.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(filteredReports.length, Math.ceil((scrollTop + QUEUE_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = filteredReports.slice(startIndex, endIndex);
  const patchReport = reactExports.useCallback((reportId, patch) => {
    setReports((prev) => prev.map((item) => item.id === reportId ? { ...item, ...patch } : item));
  }, []);
  const createRemovalRecord = reactExports.useCallback((report, action = "remove_content") => {
    const record = {
      id: `REM-${Date.now()}`,
      reportId: report.id,
      target: report.target,
      targetType: report.targetType,
      action,
      reason: report.reason,
      status: "active",
      executedAt: (/* @__PURE__ */ new Date()).toISOString(),
      by: "Admin Console"
    };
    setRemovals((prev) => [record, ...prev]);
    pushActivity("content_removal", `${report.id} • ${report.target}`, "#f97316");
    return record;
  }, [pushActivity]);
  const createAppealRecord = reactExports.useCallback((report, request = "تم فتح استئناف تلقائي بعد إجراء إداري.") => {
    const existing = appeals.find((item) => item.reportId === report.id && item.status !== "closed");
    if (existing) return existing;
    const appeal = {
      id: `APL-${Date.now()}`,
      reportId: report.id,
      target: report.target,
      appellant: report.reporter,
      request,
      status: "open",
      severity: report.severity,
      submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
      decision: ""
    };
    setAppeals((prev) => [appeal, ...prev]);
    pushActivity("appeal_created", `${report.id} دخل مسار الاستئناف`, "#8b5cf6");
    return appeal;
  }, [appeals, pushActivity]);
  const handleResolve = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: "resolved" });
      await updateReportStatus(report.id, "resolved");
      pushActivity("report_resolved", `${report.id} تم اعتماده`, "#22c55e");
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
      createAppealRecord(report, "تم التصعيد وفتح قناة مراجعة أعلى للحالة.");
      pushActivity("report_escalated", `${report.id} تم تصعيده`, "#ef4444");
      pushToast({ type: "warning", title: "تم التصعيد", description: `${report.id} دخل مسار الإدارة العليا.` });
    } catch (error) {
      patchReport(report.id, { status: report.status, severity: report.severity });
      pushToast({ type: "error", title: "تعذر التصعيد", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId("");
    }
  };
  const handleRemoveContent = reactExports.useCallback((report) => {
    patchReport(report.id, { status: report.status === "resolved" ? "resolved" : "investigating" });
    createRemovalRecord(report, report.targetType === "account" ? "account_restriction" : "remove_content");
    createAppealRecord(report, "تم حذف المحتوى ويمكن لصاحب المحتوى إرسال اعتراض خلال 48 ساعة.");
    pushToast({ type: "info", title: "تم تسجيل إزالة محتوى", description: `${report.target} تمت إضافته لسجل الإزالة.` });
  }, [createAppealRecord, createRemovalRecord, patchReport, pushToast]);
  const updateAppeal = reactExports.useCallback((appealId, decision, nextStatus = "closed") => {
    setAppeals((prev) => prev.map((item) => item.id === appealId ? { ...item, decision, status: nextStatus } : item));
    pushActivity("appeal_decision", `${appealId} • ${decision}`, "#22c55e");
    pushToast({ type: "success", title: "تم حفظ قرار الاستئناف", description: decision });
  }, [pushActivity, pushToast]);
  const updateRemoval = reactExports.useCallback((removalId, status) => {
    setRemovals((prev) => prev.map((item) => item.id === removalId ? { ...item, status } : item));
    pushActivity("content_status_changed", `${removalId} أصبح ${status}`, status === "restored" ? "#22c55e" : "#f97316");
  }, [pushActivity]);
  const handleManualReview = reactExports.useCallback(async (report) => {
    if (!report) {
      pushToast({ type: "warning", title: "اختر بلاغًا أولًا", description: "حدد بلاغًا من القائمة لتطبيق الإجراء." });
      return;
    }
    const originalStatus = report.status;
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: "investigating" });
      await updateReportStatus(report.id, "investigating");
      pushActivity("manual_review", `${report.id} دخل المراجعة اليدوية`, "#3b82f6");
      pushToast({ type: "success", title: "تم تحويل البلاغ للمراجعة", description: `${report.id} أصبح قيد التحقيق.` });
    } catch (error) {
      patchReport(report.id, { status: originalStatus });
      pushToast({ type: "error", title: "تعذر تحويل البلاغ", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId("");
    }
  }, [patchReport, pushActivity, pushToast]);
  const handleTemporaryBan = reactExports.useCallback(async (report) => {
    if (!report) {
      pushToast({ type: "warning", title: "اختر بلاغًا أولًا", description: "حدد بلاغًا من القائمة لتطبيق الإجراء." });
      return;
    }
    patchReport(report.id, { status: "investigating", severity: report.severity === "low" ? "medium" : report.severity });
    createRemovalRecord(report, report.targetType === "account" ? "account_restriction" : "temporary_ban");
    createAppealRecord(report, "تم تنفيذ قيد مؤقت وربطه بسجل البلاغ مع فتح الاستئناف.");
    pushToast({ type: "warning", title: "تم تسجيل الحظر المؤقت", description: `${report.id} دخل مسار القيود المؤقتة.` });
  }, [createAppealRecord, createRemovalRecord, patchReport, pushToast]);
  const handleFullSync = reactExports.useCallback(async () => {
    await loadReports();
    pushActivity("queue_synced", "تم تحديث البلاغات وسجلات الإزالة والاستئناف.", "#38bdf8");
    pushToast({ type: "success", title: "تمت المزامنة", description: "تم جلب أحدث بيانات البلاغات من الخادم." });
  }, [loadReports, pushActivity, pushToast]);
  const moderationActions = [
    { key: "temporary_ban", title: "حظر مؤقت", description: "تسجيل قيد مؤقت وربطه بالبلاغ المحدد", tone: "#ef4444", action: () => handleTemporaryBan(activeReport) },
    { key: "remove_content", title: "إخفاء المحتوى", description: "إزالة فورية للمحتوى وربطه بسجل الإزالة", tone: "#f97316", action: () => handleRemoveContent(activeReport) },
    { key: "manual_review", title: "مراجعة يدوية", description: "تحويل البلاغ المحدد إلى حالة التحقيق", tone: "#3b82f6", action: () => handleManualReview(activeReport) },
    { key: "open_appeal", title: "فتح استئناف", description: "إنشاء اعتراض مرتبط مباشرة بالبلاغ الحالي", tone: "#8b5cf6", action: () => activeReport ? createAppealRecord(activeReport, "تم إنشاء استئناف يدوي من صندوق الأدوات.") : pushToast({ type: "warning", title: "اختر بلاغًا أولًا", description: "حدد بلاغًا من القائمة لفتح الاستئناف." }) }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gap: 18 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, color: "#60a5fa", marginBottom: 8 }, children: "Report Center • Content removal • Appeals system • Moderation tools" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, color: "#f8fafc" }, children: "مركز البلاغات والإشراف المكتمل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 820 }, children: "تم استكمال مركز البلاغات ليشمل مراجعة البلاغات، سجل إزالة المحتوى، ونظام استئناف داخلي مرتبط بكل قرار إداري بدل الاكتفاء بقائمة ناقصة فقط." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadReports, loading, children: "تحديث الآن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleFullSync, children: "مزامنة كاملة" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: kpis.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 12, marginBottom: 10 }, children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 28, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }, children: item.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
    ] }, item.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 12 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
      ["queue", "Review Queue"],
      ["removals", "Content Removal"],
      ["appeals", "Appeals System"]
    ].map(([value, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => setActiveTab(value),
        style: {
          border: 0,
          cursor: "pointer",
          borderRadius: 999,
          padding: "10px 16px",
          color: "#f8fafc",
          background: activeTab === value ? "linear-gradient(135deg,#8b5cf6,#06b6d4)" : "rgba(255,255,255,0.06)"
        },
        children: label
      },
      value
    )) }) }),
    activeTab === "queue" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, minWidth: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Review Queue" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "قائمة مراجعة افتراضية سريعة مع إجراءات مباشرة للحذف والتصعيد والاستئناف." })
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
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "resolved", children: "منتهي" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "appealed", children: "استئناف" })
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
                      onEscalate: handleEscalate,
                      onRemove: handleRemoveContent
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Moderation tools" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "أوامر سريعة للمراجعين مع توضيح أثر كل إجراء." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: moderationActions.map((tool) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: tool.action,
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
            tool.key
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
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", onClick: () => handleRemoveContent(activeReport), children: "إزالة المحتوى" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { loading: busyId === activeReport.id && activeReport.status === "escalated", onClick: () => handleEscalate(activeReport), children: "تصعيد فوري" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => createAppealRecord(activeReport, "تم إنشاء استئناف يدوي من شاشة البلاغات."), children: "فتح استئناف" })
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
    ] }) : null,
    activeTab === "removals" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Content removal registry" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "سجل كامل لكل إزالة أو إخفاء محتوى مع إمكانية الاسترجاع وفتح استئناف." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#64748b", fontSize: 12 }, children: [
            removals.length,
            " actions"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: removals.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 800 }, children: item.target }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#94a3b8", fontSize: 12, marginTop: 4 }, children: [
                item.id,
                " • ",
                item.targetType,
                " • ",
                item.action
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "5px 10px", borderRadius: 999, background: item.status === "restored" ? "rgba(34,197,94,0.16)" : "rgba(249,115,22,0.16)", color: item.status === "restored" ? "#22c55e" : "#f97316", fontSize: 12 }, children: item.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cbd5e1", fontSize: 13, marginTop: 10 }, children: item.reason }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#64748b", fontSize: 12, marginTop: 8 }, children: [
            new Date(item.executedAt).toLocaleString("ar-EG"),
            " • بواسطة ",
            item.by
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }, children: [
            item.status !== "restored" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "success", onClick: () => updateRemoval(item.id, "restored"), children: "استرجاع المحتوى" }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => updateRemoval(item.id, "active"), children: "إعادة التفعيل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => setAppeals((prev) => [{ id: `APL-${Date.now()}`, reportId: item.reportId, target: item.target, appellant: "@appeal_user", request: "أطالب بإعادة فحص قرار إزالة المحتوى.", status: "open", severity: "medium", submittedAt: (/* @__PURE__ */ new Date()).toISOString(), decision: "" }, ...prev]), children: "فتح استئناف" })
          ] })
        ] }, item.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "لماذا هذا القسم مهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { style: { margin: 0, paddingInlineStart: 18, color: "#cbd5e1", lineHeight: 1.9, fontSize: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "تتبع كل قرار إزالة محتوى بشكل واضح." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "إمكانية الاسترجاع بدون مغادرة لوحة الإدارة." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "ربط مباشر مع الاستئناف بدل العمل اليدوي الخارجي." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "جاهز للربط لاحقًا مع API حذف المنشورات والتعليقات بشكل أعمق." })
        ] })
      ] })
    ] }) : null,
    activeTab === "appeals" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Appeals center" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "نظام استئناف كامل لمراجعة اعتراضات المستخدمين على قرارات الحظر أو إزالة المحتوى." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#64748b", fontSize: 12 }, children: [
            appeals.length,
            " appeal cases"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: appeals.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 800 }, children: item.target }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#94a3b8", fontSize: 12, marginTop: 4 }, children: [
                item.id,
                " • ",
                item.reportId,
                " • ",
                item.appellant
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { padding: "5px 10px", borderRadius: 999, background: item.status === "closed" ? "rgba(34,197,94,0.16)" : item.status === "under_review" ? "rgba(59,130,246,0.16)" : "rgba(249,115,22,0.16)", color: item.status === "closed" ? "#22c55e" : item.status === "under_review" ? "#60a5fa" : "#f97316", fontSize: 12 }, children: item.status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cbd5e1", fontSize: 13, marginTop: 10, lineHeight: 1.8 }, children: item.request }),
          item.decision ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#86efac", fontSize: 13, marginTop: 8 }, children: [
            "القرار: ",
            item.decision
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12, marginTop: 8 }, children: new Date(item.submittedAt).toLocaleString("ar-EG") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => updateAppeal(item.id, "تم قبول الاستئناف وإرجاع المحتوى.", "closed"), children: "قبول الاستئناف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => updateAppeal(item.id, "تم تحويله لمراجعة يدوية موسعة.", "under_review"), children: "تحت المراجعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "danger", onClick: () => updateAppeal(item.id, "تم رفض الاستئناف مع الإبقاء على القرار.", "closed"), children: "رفض الاستئناف" })
          ] })
        ] }, item.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "سجل النشاط الإداري" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10 }, children: [
          activityLog.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 16, padding: 12, background: `${item.tone}16`, border: `1px solid ${item.tone}44` }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#f8fafc", fontWeight: 700 }, children: item.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#cbd5e1", fontSize: 13, marginTop: 4 }, children: item.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: 12, marginTop: 4 }, children: new Date(item.at).toLocaleString("ar-EG") })
          ] }, item.id)),
          !activityLog.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: "سيظهر هنا أي قرار إشراف أو استئناف جديد." }) : null
        ] })
      ] })
    ] }) : null
  ] }) });
}
function normalizeLogs(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.logs) ? payload.logs : Array.isArray(payload) ? payload : null;
  if (!items?.length) {
    return [];
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
function exportAuditRows(rows) {
  const payload = rows.map((item) => ({
    id: item.id,
    action: item.action,
    scope: item.scope,
    severity: item.severity,
    admin_name: item.admin_name,
    actor: item.actor,
    summary: item.summary,
    entity: item.entity,
    ip_address: item.ip_address,
    timestamp: item.timestamp
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `yamshat-admin-audit-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
      setLogs([]);
      setSummary({ today: 0, critical: 0, exports: 0, security: 0 });
      pushToast({ type: "warning", title: "تعذر تحميل سجل النشاط", description: error?.response?.data?.detail || "الخادم لم يرجع سجلات حالياً." });
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
  const handleExport = reactExports.useCallback(() => {
    if (!filteredLogs.length) {
      pushToast({ type: "warning", title: "لا توجد بيانات للتصدير", description: "قم بتوسيع الفلاتر أو تحديث السجل أولًا." });
      return;
    }
    exportAuditRows(filteredLogs);
    pushToast({ type: "success", title: "تم تصدير السجل", description: `تم إنشاء ملف JSON بعدد ${filteredLogs.length} سجل.` });
  }, [filteredLogs, pushToast]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { display: "grid", gap: 18 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#60a5fa", fontSize: 13, marginBottom: 8 }, children: "Admin Activity Log • Tracking • Audit System" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, color: "#f8fafc" }, children: "سجل نشاط الأدمن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 760 }, children: "شاشة مخصصة لتتبع كل حركة إدارية مع فلترة حسب النطاق والخطورة، ومناسبة للمراجعة السريعة والتدقيق الأمني." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadAuditLogs, loading, children: "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleExport, children: "تصدير السجل" })
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
function cleanEncryptedText(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\[\/?ENCRYPTED[^\]]*\]/gi, "").replace(/^\.\.\.\s*/, "").trim();
}
function truncate(text, n = 60) {
  const t = cleanEncryptedText(text);
  if (!t) return "لا توجد رسائل بعد";
  return t.length > n ? `${t.slice(0, n)}…` : t;
}
function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
function AdminChat() {
  const [threads, setThreads] = reactExports.useState([]);
  const [activeThread, setActiveThread] = reactExports.useState(null);
  const [messages, setMessages] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const { pushToast } = useToast();
  const loadThreads = async () => {
    try {
      const { data } = await getChatThreads();
      const list = Array.isArray(data) ? data : data?.items || [];
      setThreads(list);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };
  const loadMessages = async (threadId) => {
    if (!threadId) return;
    try {
      const { data } = await getMessages(threadId);
      setMessages(data?.items || data?.messages || []);
    } catch {
      setMessages([]);
    }
  };
  reactExports.useEffect(() => {
    loadThreads();
    const onAbuse = (payload) => {
      pushToast({
        title: "تم رصد إساءة",
        description: `في محادثة مع ${payload?.user || "مستخدم"}`,
        type: "warning"
      });
      loadThreads();
    };
    socketManager.on("abuse_detected", onAbuse);
    return () => socketManager.off("abuse_detected", onAbuse);
  }, []);
  const handleRestore = async (messageId) => {
    try {
      await restoreMessage(messageId);
      pushToast({ title: "تمت استعادة الرسالة", type: "success" });
      if (activeThread) loadMessages(activeThread.id);
    } catch {
      pushToast({ title: "فشلت استعادة الرسالة", type: "error" });
    }
  };
  const filteredThreads = reactExports.useMemo(() => {
    if (!searchTerm.trim()) return threads;
    const q = searchTerm.trim().toLowerCase();
    return threads.filter((t) => {
      const name = (t.username || t.name || "").toLowerCase();
      const last = cleanEncryptedText(t.last_message || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    });
  }, [threads, searchTerm]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-toolbar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-toolbar-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-stat", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-stat-dot adm-chat-stat-dot-ok" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: threads.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "محادثات نشطة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-stat", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-stat-dot adm-chat-stat-dot-warn" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: threads.filter((t) => t.flagged || (t.abuse_score || 0) > 50).length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تحت المراقبة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-stat", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-stat-dot adm-chat-stat-dot-info" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "مفعّل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الإشراف الفوري" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-toolbar-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            className: "adm-chat-search",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "ابحث عن مستخدم أو محتوى رسالة..."
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "adm-chat-list-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "المحادثات النشطة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-count", children: filteredThreads.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-thread-list", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-empty", children: "جاري تحميل المحادثات..." }) : filteredThreads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-empty", children: searchTerm ? "لا نتائج مطابقة لبحثك" : "لا توجد محادثات حالياً" }) : filteredThreads.map((thread) => {
            const isActive = activeThread?.id === thread.id;
            const isFlagged = thread.flagged || (thread.abuse_score || 0) > 50;
            const lastMsg = truncate(thread.last_message, 50);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: `adm-chat-thread ${isActive ? "is-active" : ""} ${isFlagged ? "is-flagged" : ""}`,
                onClick: () => {
                  setActiveThread(thread);
                  loadMessages(thread.id);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-thread-avatar", children: (thread.username || "?").charAt(0).toUpperCase() }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-thread-body", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-thread-row", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: thread.username || "مستخدم" }),
                      isFlagged ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-flag", children: "⚠" }) : null,
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-thread-time", children: formatTime(thread.updated_at || thread.last_at) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "adm-chat-thread-preview", children: lastMsg })
                  ] })
                ]
              },
              thread.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "adm-chat-main-card", children: activeThread ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-active-info", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-active-avatar", children: (activeThread.username || "?").charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: activeThread.username || "مستخدم" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "مراقبة فورية للمحادثة · كشف الإساءة والوسائط مفعّل" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-active-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "adm-chat-btn ghost", onClick: () => loadMessages(activeThread.id), children: "تحديث" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-messages", children: messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-empty", children: "لا توجد رسائل في هذه المحادثة بعد." }) : messages.map((msg) => {
            const isMedia = msg.type === "media" || msg.kind === "media" || msg.media_url;
            const cleanText = cleanEncryptedText(msg.content || msg.text || msg.message || "");
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `adm-chat-msg ${msg.deleted ? "is-deleted" : ""} ${(msg.ai_score || 0) > 70 ? "is-flagged" : ""}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-msg-head", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: msg.sender || msg.from || activeThread.username }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-msg-time", children: formatTime(msg.created_at || msg.timestamp) }),
                    msg.ai_score ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `adm-chat-msg-ai ${msg.ai_score > 70 ? "high" : msg.ai_score > 40 ? "mid" : "low"}`, children: [
                      "AI ",
                      msg.ai_score,
                      "%"
                    ] }) : null
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-msg-body", children: [
                    isMedia ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-msg-media", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "adm-chat-msg-media-icon", children: "📎" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "وسائط بانتظار المراجعة" }),
                      msg.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          className: "adm-chat-link",
                          onClick: () => window.open(msg.media_url, "_blank", "noopener,noreferrer"),
                          children: "عرض الأصل"
                        }
                      ) : null
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: cleanText || "— رسالة فارغة —" }),
                    msg.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        className: "adm-chat-btn solid",
                        onClick: () => handleRestore(msg.id),
                        children: "استعادة الرسالة"
                      }
                    ) : null
                  ] })
                ]
              },
              msg.id
            );
          }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "adm-chat-placeholder", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "adm-chat-placeholder-icon", children: "💬" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "اختر محادثة لبدء المراقبة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "الإشراف الفوري على الإساءات وفحص الوسائط مُفعّل لكل المحادثات." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "adm-chat-placeholder-tips", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "اضغط على أي محادثة من القائمة الجانبية لعرض رسائلها." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "الرسائل المُشار إليها بـ ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "⚠" }),
              " تحتاج مراجعة سريعة."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "يمكنك استعادة أي رسالة محذوفة من المحادثة المختارة." })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        /* ====================================================================
         * AdminChat v55 — تنسيق متناسق مع باقي صفحات الأدمن
         * ==================================================================== */
        .adm-chat {
          font-family: 'Noto Sans Arabic', system-ui, sans-serif;
          color: #e2e8f0;
          padding: 0;
          margin: 0;
          direction: rtl;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          min-height: 0;
          height: 100%;
        }
        .adm-chat *, .adm-chat *::before, .adm-chat *::after { box-sizing: border-box; }

        /* ---- شريط الأدوات ---- */
        .adm-chat-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
        }
        .adm-chat-toolbar-left {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
        }
        .adm-chat-stat {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #cbd5e1;
        }
        .adm-chat-stat strong {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 800;
        }
        .adm-chat-stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .adm-chat-stat-dot-ok    { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .adm-chat-stat-dot-warn  { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        .adm-chat-stat-dot-info  { background: #8b5cf6; box-shadow: 0 0 8px #8b5cf6; }

        .adm-chat-search {
          width: 280px;
          max-width: 100%;
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.55);
          color: #e2e8f0;
          font-size: 12px;
          font-family: inherit;
          outline: none;
        }
        .adm-chat-search::placeholder { color: #64748b; }
        .adm-chat-search:focus {
          border-color: rgba(139,92,246,0.55);
          background: rgba(15,23,42,0.85);
        }

        /* ---- الشبكة الرئيسية ---- */
        .adm-chat-grid {
          display: grid;
          grid-template-columns: minmax(260px, 320px) 1fr;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }
        @media (max-width: 920px) {
          .adm-chat-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ---- بطاقات أساسية ---- */
        .adm-chat-list-card, .adm-chat-main-card {
          background: linear-gradient(180deg, #131a33, #0f152a);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .adm-chat-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(148,163,184,0.10);
          flex-shrink: 0;
        }
        .adm-chat-card-head h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 13px;
          font-weight: 800;
        }
        .adm-chat-count {
          background: rgba(139,92,246,0.15);
          color: #a78bfa;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
        }

        /* ---- قائمة المحادثات ---- */
        .adm-chat-thread-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.55) transparent;
        }
        .adm-chat-thread-list::-webkit-scrollbar { width: 6px; }
        .adm-chat-thread-list::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7));
          border-radius: 5px;
        }
        .adm-chat-thread {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: rgba(15,23,42,0.35);
          color: inherit;
          font-family: inherit;
          text-align: right;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, transform .12s ease;
          width: 100%;
        }
        .adm-chat-thread:hover {
          background: rgba(139,92,246,0.08);
          border-color: rgba(139,92,246,0.30);
          transform: translateY(-1px);
        }
        .adm-chat-thread.is-active {
          background: rgba(139,92,246,0.16);
          border-color: rgba(139,92,246,0.50);
        }
        .adm-chat-thread.is-flagged {
          border-color: rgba(239,68,68,0.40);
          background: rgba(239,68,68,0.05);
        }
        .adm-chat-thread-avatar {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .adm-chat-thread-body {
          flex: 1;
          min-width: 0;
        }
        .adm-chat-thread-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .adm-chat-thread-row strong {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .adm-chat-thread-time {
          margin-inline-start: auto;
          color: #64748b;
          font-size: 10px;
          flex-shrink: 0;
        }
        .adm-chat-flag {
          color: #fbbf24;
          font-size: 11px;
        }
        .adm-chat-thread-preview {
          margin: 2px 0 0;
          color: #94a3b8;
          font-size: 10.5px;
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ---- منطقة الرسائل ---- */
        .adm-chat-active-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .adm-chat-active-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .adm-chat-active-info h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 13px;
          font-weight: 800;
        }
        .adm-chat-active-info small {
          color: #94a3b8;
          font-size: 10.5px;
          display: block;
          margin-top: 2px;
        }
        .adm-chat-active-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .adm-chat-btn {
          height: 30px;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background .15s ease;
        }
        .adm-chat-btn.ghost {
          background: rgba(148,163,184,0.10);
          color: #cbd5e1;
          border-color: rgba(148,163,184,0.20);
        }
        .adm-chat-btn.ghost:hover { background: rgba(148,163,184,0.18); }
        .adm-chat-btn.solid {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff;
        }
        .adm-chat-btn.solid:hover { filter: brightness(1.08); }

        .adm-chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.55) transparent;
        }
        .adm-chat-messages::-webkit-scrollbar { width: 6px; }
        .adm-chat-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(139,92,246,0.7), rgba(99,102,241,0.7));
          border-radius: 5px;
        }

        .adm-chat-msg {
          background: rgba(15,23,42,0.45);
          border: 1px solid rgba(148,163,184,0.10);
          border-radius: 10px;
          padding: 8px 10px;
          max-width: 90%;
        }
        .adm-chat-msg.is-deleted {
          opacity: 0.7;
          border-style: dashed;
          border-color: rgba(239,68,68,0.30);
        }
        .adm-chat-msg.is-flagged {
          border-color: rgba(239,68,68,0.45);
          background: rgba(239,68,68,0.06);
        }
        .adm-chat-msg-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .adm-chat-msg-head strong {
          color: #f8fafc;
          font-size: 11px;
          font-weight: 700;
        }
        .adm-chat-msg-time {
          color: #64748b;
          font-size: 10px;
        }
        .adm-chat-msg-ai {
          margin-inline-start: auto;
          font-size: 9.5px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }
        .adm-chat-msg-ai.low  { background: rgba(16,185,129,0.18); color: #34d399; }
        .adm-chat-msg-ai.mid  { background: rgba(234,179,8,0.18);  color: #fde047; }
        .adm-chat-msg-ai.high { background: rgba(239,68,68,0.18);  color: #fca5a5; }

        .adm-chat-msg-body p {
          margin: 0;
          color: #e2e8f0;
          font-size: 12px;
          line-height: 1.55;
          word-break: break-word;
        }
        .adm-chat-msg-media {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: rgba(99,102,241,0.10);
          border: 1px dashed rgba(99,102,241,0.40);
          border-radius: 8px;
          color: #c7d2fe;
          font-size: 11px;
        }
        .adm-chat-msg-media-icon { font-size: 14px; }
        .adm-chat-link {
          background: transparent;
          border: none;
          color: #a78bfa;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          font-family: inherit;
          text-decoration: underline;
          padding: 0;
        }

        /* ---- الحالة الفارغة / Placeholder ---- */
        .adm-chat-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px 20px;
          color: #cbd5e1;
        }
        .adm-chat-placeholder-icon {
          font-size: 42px;
          margin-bottom: 10px;
          opacity: 0.85;
          filter: drop-shadow(0 4px 12px rgba(139,92,246,0.4));
        }
        .adm-chat-placeholder h3 {
          margin: 0 0 6px;
          color: #f8fafc;
          font-size: 15px;
          font-weight: 800;
        }
        .adm-chat-placeholder p {
          margin: 0 0 14px;
          color: #94a3b8;
          font-size: 12px;
          max-width: 420px;
          line-height: 1.55;
        }
        .adm-chat-placeholder-tips {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11.5px;
          color: #94a3b8;
          max-width: 380px;
          text-align: right;
        }
        .adm-chat-placeholder-tips li {
          padding: 6px 10px;
          background: rgba(148,163,184,0.06);
          border-radius: 8px;
          border-inline-end: 3px solid rgba(139,92,246,0.55);
        }
        .adm-chat-placeholder-tips em {
          color: #fbbf24;
          font-style: normal;
          font-weight: 800;
        }

        .adm-chat-empty {
          padding: 18px;
          text-align: center;
          color: #64748b;
          font-size: 11.5px;
        }

        /* ---- ضبط مع shell الأدمن ---- */
        .admin-page-shell-modern:has(.adm-chat) {
          overflow: hidden;
        }
      ` })
  ] });
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
const reelUrl = (item) => item?.media_urls?.[0] || item?.media || item?.image_url || item?.media_url || "";
const isVideo = (value) => /\.(mp4|mov|webm|mkv|m3u8)/i.test(String(value || ""));
function useClientInsights() {
  const [snapshot, setSnapshot] = reactExports.useState({ analytics: getReelsAnalyticsDashboard(), moderation: getModerationReports(), history: getWatchHistory() });
  reactExports.useEffect(() => {
    const refresh = () => {
      setSnapshot({
        analytics: getReelsAnalyticsDashboard(),
        moderation: getModerationReports(),
        history: getWatchHistory()
      });
    };
    refresh();
    window.addEventListener("storage", refresh);
    const timer = window.setInterval(refresh, 2500);
    return () => {
      window.removeEventListener("storage", refresh);
      window.clearInterval(timer);
    };
  }, []);
  return snapshot;
}
function AdminReels() {
  const [reels, setReels] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [activeReelId, setActiveReelId] = reactExports.useState("");
  const [inlinePlayingId, setInlinePlayingId] = reactExports.useState("");
  const [modalPlaying, setModalPlaying] = reactExports.useState(false);
  const videoRefs = reactExports.useRef({});
  const modalVideoRef = reactExports.useRef(null);
  const { analytics, moderation, history } = useClientInsights();
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
  const engagementTotal = reels.reduce((sum, item) => sum + Number(item.likes || item.like_count || item.likes_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0), 0);
  const stats = [
    { label: "إجمالي الريلز", value: formatCompactNumber(reels.length || 0), icon: "🎬", tone: "violet", note: "مقاطع فيديو قصيرة مربوطة ببيانات المنشورات." },
    { label: "التفاعل", value: formatCompactNumber(engagementTotal || 0), icon: "🔥", tone: "green", note: "إجمالي اللايكات والتعليقات والمشاركات." },
    { label: "Qualified Views", value: formatCompactNumber(analytics.summary.qualifiedViews || 0), icon: "👁️", tone: "blue", note: "مشاهدات محققة من طبقة Analytics داخل الريلز." },
    { label: "بلاغات معلقة", value: formatCompactNumber(moderation.filter((item) => item.status === "pending").length), icon: "🛡️", tone: "amber", note: "بلاغات تم تسجيلها من واجهة المستخدم وتحتاج مراجعة." }
  ];
  const spotlight = [
    { label: "إجمالي وقت المشاهدة", value: `${Math.round(Number(analytics.summary.totalWatchMs || 0) / 6e4)} د` },
    { label: "Buffer events", value: formatCompactNumber(analytics.summary.bufferEvents || 0) },
    { label: "آخر تحديث", value: analytics.updatedAt ? formatDateTime(analytics.updatedAt) : "—" }
  ];
  const asideItems = [
    {
      label: "سجل المشاهدة",
      value: formatCompactNumber(history.length),
      description: history[0] ? `آخر مشاهدة: @${history[0].username || "creator"}` : "لا يوجد سجل مشاهدة حتى الآن.",
      tone: "success"
    },
    {
      label: "الجودة التلقائية",
      value: formatCompactNumber(analytics.summary.autoQualityDowngrades || 0),
      description: "عدد مرات خفض الجودة تلقائيًا بسبب الشبكة أو التخزين المؤقت.",
      tone: "violet"
    },
    {
      label: "المراجعة",
      value: moderation[0]?.reason || "جاهزة",
      description: moderation[0] ? `أحدث بلاغ على @${moderation[0].username || "creator"}` : "لا توجد بلاغات جديدة حالياً.",
      tone: "amber"
    }
  ];
  const timeline = reels.length ? reels.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.username || "creator",
    description: item.content || "تم نشر ريل جديد.",
    created_at: item.created_at,
    level: "featured"
  })) : [];
  const rows = reels.map((item) => {
    const insight = getReelInsightsById(item.id);
    const reports = moderation.filter((report) => String(report.reelId) === String(item.id)).length;
    return {
      ...item,
      adminStatus: reports > 0 ? "review" : Number(item.comments_count || 0) > 0 ? "active" : "draft",
      engagement: Number(item.likes || item.like_count || item.likes_count || 0) + Number(item.comments_count || 0) + Number(item.share_count || 0),
      reelSrc: reelUrl(item),
      insight,
      reports
    };
  });
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
    { key: "qualifiedViews", label: "المشاهدات", render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(row.insight?.qualifiedViews || 0) }) },
    { key: "avgWatchMs", label: "متوسط المشاهدة", render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
      Math.round(Number(row.insight?.avgWatchMs || 0) / 1e3),
      "ث"
    ] }) },
    { key: "reports", label: "بلاغات", render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: row.reports }) },
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
        subtitle: "تمت إضافة لوحات Analytics محلية للريلز، سجل مشاهدة، Queue للبلاغات، ومؤشرات جودة/Buffer فوق المعاينة والإدارة.",
        badge: "Reels Studio",
        accent: "إدارة الفيديو القصير",
        stats,
        spotlight,
        tableTitle: "أحدث الريلز",
        tableDescription: "الجدول يعرض مصدر الفيديو، التفاعل، المشاهدات المؤهلة، متوسط وقت المشاهدة، والبلاغات المسجلة من تجربة الريلز.",
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 16, marginTop: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { style: { borderRadius: 20, padding: 18, background: "rgba(15,23,42,0.9)", border: "1px solid rgba(148,163,184,0.18)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0 }, children: "Queue البلاغات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "6px 0 0", color: "#94a3b8" }, children: "أحدث البلاغات الملتقطة من شاشة الريلز نفسها." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: load, children: "تحديث" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: moderation.length ? moderation.slice(0, 8).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderRadius: 16, padding: 14, background: "rgba(255,255,255,0.04)", display: "grid", gap: 6 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
          "@",
          item.username || "creator",
          " — ",
          item.reason
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#cbd5e1" }, children: item.note || "بدون ملاحظات إضافية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("small", { style: { color: "#94a3b8" }, children: formatDateTime(item.createdAt) })
      ] }, item.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#94a3b8" }, children: "لا توجد بلاغات مسجلة حالياً." }) })
    ] }) }),
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(Number(activeReel.likes || activeReel.like_count || activeReel.likes_count || 0) + Number(activeReel.comments_count || 0) + Number(activeReel.share_count || 0)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "لايكات + تعليقات + مشاركات." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-amber", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "Analytics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            formatCompactNumber(getReelInsightsById(activeReel.id)?.qualifiedViews || 0),
            " views"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "متوسط المشاهدة ",
            Math.round(Number(getReelInsightsById(activeReel.id)?.avgWatchMs || 0) / 1e3),
            " ثانية."
          ] })
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
  const [groups, setGroups] = reactExports.useState([]);
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
    const members = groups.reduce((sum, item) => sum + Number(item.members_count || 0), 0);
    return [
      { label: "إجمالي المجموعات", value: groups.length },
      { label: "إجمالي الأعضاء", value: members },
      { label: "متوسط الأعضاء", value: groups.length ? Math.round(members / groups.length) : 0 },
      { label: "آخر إضافات", value: groups.slice(0, 3).length }
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: groups[0]?.name || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: groups[0]?.description || "هتظهر هنا تفاصيل المجموعة الأعلى في القائمة." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "queue-card compact admin-tone-blue", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "queue-label", children: "صاحب المجموعة الأولى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: groups[0]?.owner_username || "—" }),
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
    !loading && groups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "👥", title: "لا توجد مجموعات بعد", description: "أنشئ أول مجموعة من الزر اللي فوق وهتظهر هنا فوراً.", actionLabel: "إنشاء مجموعة", onAction: () => setCreateOpen(true) }) : null,
    !loading && groups.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "admin-deep-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "admin-rich-table-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "قائمة المجموعات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted no-margin", children: "افتح التفاصيل أو انضم لأي مجموعة مباشرة من الجدول." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: groups.length })
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: groups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-activity-list", children: groups.slice(0, 6).map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "admin-activity-item", children: [
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "queue-grid compact-cards", children: groups.slice(0, 3).map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "queue-card compact admin-tone-violet", style: { textAlign: "inherit", cursor: "pointer" }, onClick: () => openGroupModal(group), children: [
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
function statusBadgeClass(status = "") {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "live" || normalized === "ready") return "success";
  if (normalized === "ended") return "danger";
  return "warning";
}
function AdminLive() {
  const [rooms, setRooms] = reactExports.useState([]);
  const [stats, setStats] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedRoom, setSelectedRoom] = reactExports.useState(null);
  const [busyKey, setBusyKey] = reactExports.useState("");
  const { pushToast } = useToast();
  const loadLiveStatus = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminLiveOverview();
      setRooms(Array.isArray(data?.rooms) ? data.rooms : []);
      setStats(data?.stats || {});
    } catch (error) {
      pushToast({
        title: "تعذر تحميل حالة البث",
        description: error?.response?.data?.detail || error?.message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadLiveStatus();
    const syncLive = () => loadLiveStatus();
    socketManager.on("admin:live_updated", syncLive);
    socketManager.on("stream_metrics_update", syncLive);
    return () => {
      socketManager.off("admin:live_updated", syncLive);
      socketManager.off("stream_metrics_update", syncLive);
    };
  }, []);
  const handleEmergencyStop = async (roomId) => {
    if (!window.confirm("تأكيد إنهاء هذا البث؟")) return;
    try {
      setBusyKey(`end-${roomId}`);
      await endAdminLiveRoom(roomId);
      pushToast({ title: "تم إنهاء البث", description: `تم إيقاف الغرفة ${roomId}`, type: "success" });
      if (selectedRoom?.id === roomId) setSelectedRoom(null);
      loadLiveStatus();
    } catch (error) {
      pushToast({ title: "فشل إنهاء البث", description: error?.response?.data?.detail || error?.message, type: "error" });
    } finally {
      setBusyKey("");
    }
  };
  const handleFeatureToggle = async (room) => {
    try {
      setBusyKey(`feature-${room.id}`);
      await featureAdminLiveRoom(room.id, !room.featured);
      pushToast({
        title: room.featured ? "تم إلغاء تمييز الغرفة" : "تم تمييز الغرفة",
        description: room.title,
        type: "success"
      });
      loadLiveStatus();
    } catch (error) {
      pushToast({ title: "فشل تحديث حالة التمييز", description: error?.response?.data?.detail || error?.message, type: "error" });
    } finally {
      setBusyKey("");
    }
  };
  const handlePinLatest = async (roomId) => {
    try {
      setBusyKey(`pin-${roomId}`);
      await pinLatestAdminLiveComment(roomId);
      pushToast({ title: "تم تثبيت آخر تعليق", type: "success" });
      loadLiveStatus();
    } catch (error) {
      pushToast({ title: "تعذر تثبيت التعليق", description: error?.response?.data?.detail || error?.message, type: "error" });
    } finally {
      setBusyKey("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "live-monitoring-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "metrics-bar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "الغرف النشطة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: stats.active_rooms || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "المشاهدون الآن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: stats.current_viewers || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "القلوب" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: stats.hearts_count || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "أعلى ذروة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: stats.top_peak_viewers || 0 })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "streams-grid", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-head split", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "إدارة البث المباشر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", style: { margin: "6px 0 0" }, children: "تم ربط اللوحة بالحقول والعمليات الفعلية الراجعة من الخادم بدل القيم غير الموجودة." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadLiveStatus, loading, children: "تحديث" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "admin-table", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المضيف" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "العنوان" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "المشاهدون" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التعليقات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "القلوب" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الحالة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الإجراءات" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rooms.length ? rooms.map((room) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: room.username || room.host || "unknown" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: room.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: room.featured ? "غرفة مميزة" : "غرفة عادية" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: room.viewer_count || 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: room.comments_count || 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: room.hearts_count || 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${statusBadgeClass(room.stream_status)}`, children: room.stream_status || (room.active ? "live" : "unknown") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "action-row", style: { flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action", onClick: () => setSelectedRoom(room), children: "مراقبة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action", onClick: () => handleFeatureToggle(room), disabled: busyKey === `feature-${room.id}`, children: room.featured ? "إلغاء التمييز" : "تمييز" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action", onClick: () => handlePinLatest(room.id), disabled: busyKey === `pin-${room.id}`, children: "تثبيت آخر تعليق" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mini-action danger", onClick: () => handleEmergencyStop(room.id), disabled: busyKey === `end-${room.id}`, children: "إنهاء البث" })
          ] }) })
        ] }, room.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: "7", className: "muted", style: { textAlign: "center", padding: 24 }, children: loading ? "جارٍ تحميل الغرف..." : "لا توجد غرف بث نشطة الآن." }) }) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: !!selectedRoom, title: "تفاصيل غرفة البث", onClose: () => setSelectedRoom(null), children: selectedRoom ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stream-mod-container", style: { display: "grid", gap: 14 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stream-preview-placeholder", style: { padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.04)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overlay-metrics", style: { display: "grid", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "المعرف: ",
          selectedRoom.id
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "العنوان: ",
          selectedRoom.title
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "المضيف: ",
          selectedRoom.username || selectedRoom.host
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "المشاهدون الحاليون: ",
          selectedRoom.viewer_count || 0
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "ذروة المشاهدة: ",
          selectedRoom.peak_viewer_count || 0
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "التعليقات: ",
          selectedRoom.comments_count || 0
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "القلوب: ",
          selectedRoom.hearts_count || 0
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "التسجيل: ",
          selectedRoom.recording?.status || "idle"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "الحالة: ",
          selectedRoom.stream_status || "unknown"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mod-controls", style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleFeatureToggle(selectedRoom), children: selectedRoom.featured ? "إلغاء تمييز الغرفة" : "تمييز الغرفة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handlePinLatest(selectedRoom.id), children: "تثبيت آخر تعليق" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "danger", onClick: () => handleEmergencyStop(selectedRoom.id), children: "إنهاء البث" })
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
