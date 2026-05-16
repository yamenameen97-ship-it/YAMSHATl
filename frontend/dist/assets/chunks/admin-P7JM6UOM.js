import {
  getStories,
  getStoryAnalyticsSummary,
  getStoryArchive,
  getStoryHighlights,
  toggleStoryHighlight,
  viewStory
} from "./chunk-CNLIQS4X.js";
import {
  getDeviceProfile
} from "./chunk-TTTTPZJD.js";
import {
  getPosts
} from "./chunk-QYGJVHBV.js";
import {
  createGroup,
  getGroups,
  joinGroup
} from "./chunk-P7MPFPG2.js";
import {
  broadcastAdminNotification,
  bulkUpdatePostStatus,
  changeAdminPassword,
  endAdminLiveRoom,
  escalateReport,
  getAdminLiveOverview,
  getAdminNotifications,
  getAdminOverview,
  getAdminPosts,
  getAdminRbac,
  getAdminReportsSummary,
  getAdminSettings,
  getAdminUsers,
  moderatePostAI,
  searchAdmin,
  toggleShadowBan,
  updateAdminSettings,
  updateAdminUser,
  updateReportStatus,
  useDebouncedValue
} from "./chunk-AMXAPOO5.js";
import {
  ErrorState
} from "./chunk-X4EAIF56.js";
import {
  EmptyState
} from "./chunk-I2PPYNN4.js";
import {
  Modal
} from "./chunk-ERP4JHH7.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import {
  socket_default
} from "./chunk-O2E6FMLO.js";
import "./chunk-46YZGXXY.js";
import {
  useToast
} from "./chunk-OIWCOE6H.js";
import {
  AdminOverviewSkeleton,
  ListSkeleton,
  TableSkeleton
} from "./chunk-4ZQ5VGKF.js";
import {
  getChatThreads,
  getMessages,
  restoreMessage
} from "./chunk-HHMVNFXU.js";
import "./chunk-JSOE33EX.js";
import {
  logoutUser
} from "./chunk-27I664WH.js";
import {
  Input
} from "./chunk-RYTW2TDG.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  Link,
  NavLink,
  PRIMARY_ADMIN_EMAIL,
  axios_default,
  clearStoredUser,
  getAuthToken,
  getStoredUser,
  useLocation,
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/features/admin/index.js
init_define_import_meta_env();

// src/pages/admin/AdminDashboard.jsx
init_define_import_meta_env();
var import_react3 = __toESM(require_react(), 1);

// src/components/admin/AdminLayout.jsx
init_define_import_meta_env();
var import_react2 = __toESM(require_react(), 1);

// src/components/admin/Breadcrumbs.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function Breadcrumbs({ items = [] }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "breadcrumbs", children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "breadcrumb-item", children: [
    item.to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: item.to, children: item.label }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.label }),
    index < items.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "breadcrumb-separator", children: "/" }) : null
  ] }, `${item.label}-${index}`)) });
}

// src/components/admin/AdminSidebar.jsx
init_define_import_meta_env();
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var groups = [
  {
    title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u0649",
    items: [
      { to: "/admin/dashboard", label: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645", icon: "\u25C8", permission: "dashboard.view" },
      { to: "/admin/posts", label: "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A", icon: "\u2726", permission: "posts.view" },
      { to: "/admin/stories", label: "\u0627\u0644\u0633\u062A\u0648\u0631\u064A", icon: "\u25CE", permission: "dashboard.view" },
      { to: "/admin/reels", label: "\u0627\u0644\u0631\u064A\u0644\u0632", icon: "\u25B6", permission: "dashboard.view" },
      { to: "/admin/live", label: "\u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631", icon: "\u25C9", permission: "live.manage", badge: "LIVE" },
      { to: "/admin/chat", label: "\u0627\u0644\u0634\u0627\u062A", icon: "\u2709", permission: "dashboard.view" },
      { to: "/admin/groups", label: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A", icon: "\u25CC", permission: "dashboard.view" }
    ]
  },
  {
    title: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629",
    items: [
      { to: "/admin/users", label: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646", icon: "\u25CD", permission: "users.view" },
      { to: "/admin/rbac", label: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A", icon: "\u2318", permission: "rbac.view" },
      { to: "/admin/notifications", label: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", icon: "\u25D4", permission: "notifications.manage" },
      { to: "/admin/reports", label: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A", icon: "\u25A3", permission: "reports.view", badge: "HOT" },
      { to: "/admin/audit", label: "\u0633\u062C\u0644 \u0627\u0644\u0623\u062F\u0645\u0646", icon: "\u29C9", permission: "dashboard.view" },
      { to: "/admin/settings", label: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", icon: "\u2699", permission: "settings.manage" }
    ]
  }
];
function AdminSidebar({ collapsed, permissions = [], role = "user" }) {
  const isAllowed = (permission) => !permission || role === "admin" || permissions.includes(permission);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("aside", { className: `admin-sidebar admin-reference-sidebar ${collapsed ? "collapsed" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "admin-brand admin-reference-brand", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "brand-logo brand-logo-reference", children: "YS" }),
      !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Yamshat Admin" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0644\u0648\u062D\u0629 \u0625\u062F\u0627\u0631\u0629 \u0639\u0631\u0628\u064A\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629" })
      ] }) : null
    ] }),
    !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "admin-sidebar-usercard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "admin-sidebar-avatar", children: "A" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0639\u0627\u0645" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "Super Admin" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "admin-sidebar-status", children: "\u0645\u062A\u0635\u0644" })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "admin-sidebar-scroll", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "admin-sidebar-group", children: [
      !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "admin-sidebar-group-title", children: group.title }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { className: "admin-nav admin-reference-nav", children: group.items.filter((item) => isAllowed(item.permission)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(NavLink, { to: item.to, className: ({ isActive }) => `admin-nav-link admin-reference-link ${isActive ? "active" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "admin-nav-icon admin-reference-icon", children: item.icon }),
        !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: item.label }) : null,
        !collapsed && item.badge ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("em", { className: "admin-nav-badge", children: item.badge }) : null
      ] }, item.to)) })
    ] }, group.title)) }),
    !collapsed ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sidebar-promo admin-reference-promo", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "badge", children: "\u0648\u0627\u062C\u0647\u0629 \u0645\u062D\u0633\u0651\u0646\u0629" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u0643\u0632 \u0628\u0644\u0627\u063A\u0627\u062A \u0643\u0627\u0645\u0644\u060C \u0633\u062C\u0644 \u062A\u062F\u0642\u064A\u0642 \u0644\u0644\u0623\u062F\u0645\u0646\u060C \u0648\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u062D\u064A\u0629 \u0645\u0639 \u062A\u062D\u0633\u064A\u0646\u0627\u062A \u0644\u0644\u062C\u0648\u0627\u0644 \u0648\u0627\u0644\u0631\u064A\u0644\u0632 \u0644\u062A\u0642\u0644\u064A\u0644 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0648\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0623\u062F\u0627\u0621 \u0639\u0644\u0649 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0636\u0639\u064A\u0641\u0629." })
    ] }) : null
  ] });
}

// src/components/admin/AdminTopbar.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function AdminTopbar({ title, onToggleSidebar, notifications = [] }) {
  const [query, setQuery] = (0, import_react.useState)("");
  const [results, setResults] = (0, import_react.useState)({ users: [], posts: [] });
  const [open, setOpen] = (0, import_react.useState)(false);
  const navigate = useNavigate();
  const user = getStoredUser();
  const debouncedQuery = useDebouncedValue(query, 350);
  const unreadCount = (0, import_react.useMemo)(() => notifications.filter((item) => !item.is_read).length, [notifications]);
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "admin-topbar admin-reference-topbar", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "admin-topbar-search-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "ghost-btn icon-btn admin-menu-toggle", onClick: onToggleSidebar, children: "\u2630" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "admin-search-box admin-reference-search-box", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u2315" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "\u0628\u062D\u062B \u0639\u0646 \u0645\u0633\u062A\u062E\u062F\u0645\u060C \u0628\u062B\u060C \u0645\u0646\u0634\u0648\u0631..." }),
        results.users.length || results.posts.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "search-results-panel", children: [
          results.users.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646" }),
            results.users.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "search-result-item", onClick: () => navigate("/admin/users"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: item.username }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: item.role })
            ] }, item.id))
          ] }) : null,
          results.posts.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A" }),
            results.posts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "search-result-item", onClick: () => navigate("/admin/posts"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: item.username }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: item.content?.slice(0, 42) })
            ] }, item.id))
          ] }) : null
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "admin-topbar-meta-block", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "page-eyebrow", children: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { className: "page-title admin-reference-title", children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "topbar-meta-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "live-pill", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "status-dot live-dot" }),
          "\u062A\u062D\u062F\u064A\u062B \u0644\u062D\u0638\u064A"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "deploy-pill", children: "\u0648\u0627\u062C\u0647\u0629 RTL \u062F\u0627\u0643\u0646\u0629 \u0645\u062D\u0633\u0651\u0646\u0629" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "topbar-controls admin-reference-controls", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "ghost-btn notification-button admin-reference-utility", onClick: () => setOpen((prev) => !prev), children: [
        "\u{1F514}",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: unreadCount })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Link, { className: "ghost-btn admin-reference-utility", to: "/admin/reports", children: "\u{1F4C8}" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Link, { className: "ghost-btn admin-reference-utility", to: "/admin/notifications", children: "\u2709" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "profile-pill admin-profile-pill admin-reference-profile", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "admin-reference-profile-avatar", children: (user?.username || "A").slice(0, 1).toUpperCase() }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: user?.username || "admin" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: user?.role || "admin" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "ghost-btn", onClick: handleLogout, children: "\u062E\u0631\u0648\u062C" }),
      open ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "notification-popover", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "notification-popover-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u0622\u062E\u0631 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Link, { to: "/admin/notifications", children: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "notification-popover-list", children: [
          notifications.slice(0, 5).map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "notification-popover-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: item.title }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: item.body })
          ] }, item.id)),
          !notifications.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "empty-state compact", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u062D\u0627\u0644\u064A\u0627\u064B." }) : null
        ] })
      ] }) : null
    ] })
  ] });
}

// src/components/admin/AdminLayout.jsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var routeMeta = {
  "/admin/dashboard": { title: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"] },
  "/admin/posts": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A"] },
  "/admin/content": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A"] },
  "/admin/chat": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u062A", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0634\u0627\u062A"] },
  "/admin/stories": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0633\u062A\u0648\u0631\u064A", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0633\u062A\u0648\u0631\u064A"] },
  "/admin/reels": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0631\u064A\u0644\u0632", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0631\u064A\u0644\u0632"] },
  "/admin/groups": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A"] },
  "/admin/live": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0628\u062B"] },
  "/admin/users": { title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646"] },
  "/admin/rbac": { title: "\u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A"] },
  "/admin/notifications": { title: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A"] },
  "/admin/reports": { title: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A \u0648\u0627\u0644\u0625\u0634\u0631\u0627\u0641", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A"] },
  "/admin/audit": { title: "\u0633\u062C\u0644 \u0646\u0634\u0627\u0637 \u0627\u0644\u0623\u062F\u0645\u0646", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0633\u062C\u0644 \u0627\u0644\u0623\u062F\u0645\u0646"] },
  "/admin/settings": { title: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629", breadcrumb: ["\u0627\u0644\u0625\u062F\u0627\u0631\u0629", "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A"] }
};
function AdminLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = (0, import_react2.useState)(false);
  const [notifications, setNotifications] = (0, import_react2.useState)([]);
  const { pushToast } = useToast();
  const user = getStoredUser();
  const token = getAuthToken();
  const meta = routeMeta[location.pathname] || routeMeta["/admin/dashboard"];
  const breadcrumbs = (0, import_react2.useMemo)(
    () => meta.breadcrumb.map((label, index) => ({ label, to: index === meta.breadcrumb.length - 1 ? "" : "/admin/dashboard" })),
    [meta]
  );
  (0, import_react2.useEffect)(() => {
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
    socket_default.emit("register_user", { token, user: user?.username });
    const onAdminNotification = (payload) => {
      pushToast({ title: payload?.title || "\u0625\u0634\u0639\u0627\u0631 \u0645\u0628\u0627\u0634\u0631", description: payload?.body || "\u062A\u0645 \u0648\u0635\u0648\u0644 \u062A\u062D\u062F\u064A\u062B \u062C\u062F\u064A\u062F.", type: "info" });
      setNotifications((prev) => [{ id: `${Date.now()}`, ...payload, is_read: false }, ...prev].slice(0, 20));
    };
    const syncEvents = ["admin:user_updated", "admin:user_status_changed", "admin:user_deleted", "admin:post_created", "admin:post_updated", "admin:post_deleted", "admin:posts_bulk_deleted", "admin:live_updated"];
    socket_default.on("admin:notification", onAdminNotification);
    syncEvents.forEach((eventName) => socket_default.on(eventName, loadNotifications));
    return () => {
      active = false;
      socket_default.off("admin:notification", onAdminNotification);
      syncEvents.forEach((eventName) => socket_default.off(eventName, loadNotifications));
    };
  }, [pushToast, token, user?.username]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "admin-app-shell admin-reference-shell", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(AdminSidebar, { collapsed, permissions: user?.permissions || [], role: user?.role || "user" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "admin-main-shell", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(AdminTopbar, { title: meta.title, onToggleSidebar: () => setCollapsed((prev) => !prev), notifications }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("main", { className: "admin-page-shell admin-reference-page-shell", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Breadcrumbs, { items: breadcrumbs }),
        children
      ] })
    ] })
  ] });
}

// src/components/admin/Charts.jsx
init_define_import_meta_env();
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "chart-shell", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { viewBox: `0 0 ${width} ${height + 16}`, className: "chart-svg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("polyline", { fill: "none", stroke: "url(#lineGradient)", strokeWidth: "4", points, strokeLinecap: "round", strokeLinejoin: "round" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("linearGradient", { id: "lineGradient", x1: "0", y1: "0", x2: "1", y2: "1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("stop", { offset: "0%", stopColor: "#8b5cf6" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("stop", { offset: "100%", stopColor: "#22d3ee" })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "chart-label-row", children: data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: item.label }, item.label)) })
  ] });
}
function BarChart({ data = [] }) {
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "bar-chart", children: data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "bar-item", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "bar-track", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "bar-value", style: { height: `${Math.max((Number(item.value) || 0) / max * 100, 8)}%` } }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: item.value }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: item.label })
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "donut-wrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "donut-chart", style: { background: `conic-gradient(${segments || "#8b5cf6 0 360deg"})` }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "donut-hole", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: total }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "\u0625\u062C\u0645\u0627\u0644\u064A" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "legend-list", children: data.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "legend-item", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "legend-dot", style: { background: palette[index % palette.length] } }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: item.label }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: item.value })
    ] }, item.label)) })
  ] });
}

// src/services/adminService.js
init_define_import_meta_env();
var CACHE_KEY_PREFIX = "admin_cache_";
var CACHE_TTL_MS = 5 * 60 * 1e3;
var ANALYTICS_CACHE_TTL_MS = 15 * 60 * 1e3;
var adminService = {
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
      const { data } = await axios_default.get("/admin/overview");
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
      const { data } = await axios_default.get("/admin/users", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Gets single user details
   */
  async getUser(userId) {
    return this.getCachedData(`user_${userId}`, async () => {
      const { data } = await axios_default.get(`/admin/users/${userId}`);
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Bans or unbans user
   */
  async banUser(userId, restore = false) {
    const response = await axios_default.post(`/admin/users/${userId}/ban`, null, {
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
    const response = await axios_default.post(`/admin/users/${userId}/shadow-ban`, null, {
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
      const { data } = await axios_default.get("/admin/users/ban-history", {
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
      const { data } = await axios_default.get("/admin/analytics/dashboard");
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets user analytics with caching
   */
  async getUserAnalytics(params = {}) {
    const cacheKey = `user_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await axios_default.get("/admin/analytics/users", { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets content analytics with caching
   */
  async getContentAnalytics(params = {}) {
    const cacheKey = `content_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await axios_default.get("/admin/analytics/content", { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets engagement analytics with caching
   */
  async getEngagementAnalytics(params = {}) {
    const cacheKey = `engagement_analytics_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await axios_default.get("/admin/analytics/engagement", { params });
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Gets system health metrics with caching
   */
  async getSystemHealth() {
    return this.getCachedData("system_health", async () => {
      const { data } = await axios_default.get("/admin/analytics/system-health");
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
      const { data } = await axios_default.get("/admin/audit-logs", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Gets audit logs for specific user
   */
  async getUserAuditLogs(userId, params = {}) {
    const cacheKey = `user_audit_logs_${userId}_${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, async () => {
      const { data } = await axios_default.get(`/admin/audit-logs/user/${userId}`, { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Logs admin action
   */
  async logAction(action, details = {}) {
    try {
      await axios_default.post("/admin/audit-logs", {
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
      const { data } = await axios_default.get("/admin/audit-logs/summary", { params });
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
      const { data } = await axios_default.get("/admin/reports/summary", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Updates report status
   */
  async updateReportStatus(reportId, status) {
    const response = await axios_default.post(`/admin/reports/${reportId}/status`, { status });
    this.clearCache("reports_summary_*");
    return response.data;
  },
  /**
   * Escalates report
   */
  async escalateReport(reportId) {
    const response = await axios_default.post(`/admin/reports/${reportId}/escalate`);
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
      const { data } = await axios_default.get("/admin/posts", { params });
      return data;
    }, CACHE_TTL_MS);
  },
  /**
   * Moderates post with AI
   */
  async moderatePostAI(postId) {
    const response = await axios_default.post(`/admin/posts/${postId}/moderate-ai`);
    this.clearCache("admin_posts_*");
    return response.data;
  },
  /**
   * Bulk updates post status
   */
  async bulkUpdatePostStatus(ids, status) {
    const response = await axios_default.post("/admin/posts/bulk-update-status", { ids, status });
    this.clearCache("admin_posts_*");
    return response.data;
  },
  // ============ SETTINGS ============
  /**
   * Gets admin settings with caching
   */
  async getSettings() {
    return this.getCachedData("admin_settings", async () => {
      const { data } = await axios_default.get("/admin/settings");
      return data;
    }, ANALYTICS_CACHE_TTL_MS);
  },
  /**
   * Updates admin settings
   */
  async updateSettings(settings) {
    const response = await axios_default.put("/admin/settings", settings);
    this.clearCache("admin_settings");
    return response.data;
  },
  // ============ EXPORTS ============
  /**
   * Exports admin report
   */
  async exportReport(format = "csv") {
    const response = await axios_default.get("/admin/reports/export", {
      params: { format },
      responseType: "blob"
    });
    return response.data;
  },
  /**
   * Exports users data
   */
  async exportUsers(format = "csv") {
    const response = await axios_default.get("/admin/users/export", {
      params: { format },
      responseType: "blob"
    });
    return response.data;
  },
  /**
   * Exports analytics data
   */
  async exportAnalytics(format = "csv") {
    const response = await axios_default.get("/admin/analytics/export", {
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

// src/pages/admin/AdminDashboard.jsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
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
    message: index === 0 ? "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062E\u0631\u0648\u062C \u0625\u062C\u0628\u0627\u0631\u064A \u0644\u0639\u062F\u0629 \u062C\u0644\u0633\u0627\u062A \u063A\u064A\u0631 \u0645\u0648\u062B\u0642\u0629." : `\u0625\u062C\u0631\u0627\u0621 \u0625\u062F\u0627\u0631\u064A \u0631\u0642\u0645 ${index + 1} \u062A\u0645 \u0628\u0646\u062C\u0627\u062D.`,
    admin_name: ["Super Admin", "Content Lead", "Security Admin"][index % 3],
    timestamp: new Date(now - index * 12 * 60 * 1e3).toISOString()
  }));
  const activityStream = Array.from({ length: 6 }, (_, index) => ({
    id: `ACT-${index + 1}`,
    action: ["New report", "Post approved", "Live room flagged", "User restored"][index % 4],
    description: "\u062A\u062D\u062F\u064A\u062B \u062D\u064A \u0639\u0644\u0649 \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0645\u0631\u062A\u0628\u0637 \u0628\u0627\u0644\u0640 socket \u0623\u0648 polling.",
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
  const [dashboard, setDashboard] = (0, import_react3.useState)(() => normalizeOverview(fallbackOverview()));
  const [performanceSnapshot, setPerformanceSnapshot] = (0, import_react3.useState)(() => getPerformanceSnapshot());
  const [refreshInterval, setRefreshInterval] = (0, import_react3.useState)(7e3);
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [tableFilter, setTableFilter] = (0, import_react3.useState)("all");
  const [searchTerm, setSearchTerm] = (0, import_react3.useState)("");
  const loadDashboard = (0, import_react3.useCallback)(async () => {
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
      pushToast({ type: "warning", title: "Fallback analytics active", description: error?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0628\u0639\u0636 \u0627\u0644\u0645\u0642\u0627\u064A\u064A\u0633 \u0627\u0644\u062D\u064A\u0629." });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);
  (0, import_react3.useEffect)(() => {
    loadDashboard();
  }, [loadDashboard]);
  (0, import_react3.useEffect)(() => {
    const timer = window.setInterval(() => {
      loadDashboard();
      setPerformanceSnapshot(getPerformanceSnapshot());
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [loadDashboard, refreshInterval]);
  (0, import_react3.useEffect)(() => {
    const onMetric = () => setPerformanceSnapshot(getPerformanceSnapshot());
    const onMemoryCritical = () => pushToast({ type: "warning", title: "\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0645\u0631\u062A\u0641\u0639\u0629", description: "\u062A\u0645 \u0631\u0635\u062F \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0639\u0627\u0644\u064D \u0644\u0644\u0630\u0627\u0643\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u062D\u0627\u0644\u064A." });
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
    socket_default.on("realtime_metrics", onRealtimeMetrics);
    socket_default.on("new_audit_log", onAuditLog);
    socket_default.on("activity_update", onActivity);
    return () => {
      window.removeEventListener("yamshat:performance-metric", onMetric);
      window.removeEventListener("yamshat:memory-critical", onMemoryCritical);
      socket_default.off("realtime_metrics", onRealtimeMetrics);
      socket_default.off("new_audit_log", onAuditLog);
      socket_default.off("activity_update", onActivity);
    };
  }, [pushToast]);
  const { metrics, audit_logs: auditLogs, activity_stream: activityStream } = dashboard;
  const kpis = (0, import_react3.useMemo)(() => [
    { label: "Active users", value: metrics.active_users, tone: "#60a5fa", hint: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0627\u0644\u0646\u0634\u0637\u0648\u0646 \u0627\u0644\u0622\u0646" },
    { label: "Traffic / minute", value: metrics.traffic_per_minute || metrics.total_requests || 0, tone: "#22c55e", hint: "\u062A\u062F\u0641\u0642 \u0627\u0644\u062D\u0631\u0643\u0629 \u0627\u0644\u062D\u064A" },
    { label: "Growth", value: `${Number(metrics.growth_rate || 0).toFixed(1)}%`, tone: "#f59e0b", hint: "\u0646\u0645\u0648 \u0622\u062E\u0631 \u062F\u0648\u0631\u0629" },
    { label: "Live metrics", value: `${metrics.live_metrics_score || 0}/100`, tone: "#a78bfa", hint: "\u062C\u0648\u062F\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0644\u062D\u0638\u064A" },
    { label: "Moderation queue", value: metrics.moderation_queue || metrics.queue_size || 0, tone: "#fb7185", hint: "\u0645\u062D\u062A\u0648\u0649 \u064A\u0646\u062A\u0638\u0631 \u0627\u0644\u0642\u0631\u0627\u0631" },
    { label: "API response", value: `${Math.round(metrics.api_response_time || 0)}ms`, tone: "#38bdf8", hint: "\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629" }
  ], [metrics]);
  const healthLevel = (0, import_react3.useMemo)(() => {
    const penalty = Number(metrics.cpu_usage || 0) + Number(metrics.memory_usage || 0) + Number(performanceSnapshot.longTasks || 0) * 4;
    if (penalty > 140) return { label: "\u062D\u0631\u062C", color: "#ef4444" };
    if (penalty > 95) return { label: "\u0645\u0631\u0627\u0642\u0628\u0629", color: "#f97316" };
    return { label: "\u0645\u0633\u062A\u0642\u0631", color: "#22c55e" };
  }, [metrics.cpu_usage, metrics.memory_usage, performanceSnapshot.longTasks]);
  const liveTableRows = (0, import_react3.useMemo)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(AdminLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { style: { display: "grid", gap: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { style: { padding: 20 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#60a5fa", fontSize: 13, marginBottom: 8 }, children: "Charts \u2022 Live dashboards \u2022 Better tables \u2022 Filters" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { style: { margin: 0, color: "#f8fafc" }, children: "\u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u064A\u0629" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 820 }, children: "\u062A\u0645 \u062A\u0637\u0648\u064A\u0631 \u0644\u0648\u062D\u0629 \u0627\u0644\u0623\u062F\u0645\u0646 \u0628\u0648\u0627\u062C\u0647\u0627\u062A Dashboard \u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0648\u062C\u062F\u0627\u0648\u0644 \u0645\u062D\u0633\u0651\u0646\u0629 \u0645\u0639 \u0641\u0644\u062A\u0631\u0629 \u0648\u0628\u062D\u062B\u060C \u0648\u0631\u0633\u0648\u0645 \u0628\u064A\u0627\u0646\u064A\u0629 \u062A\u0633\u0627\u0639\u062F \u0627\u0644\u0641\u0631\u064A\u0642 \u064A\u062A\u0627\u0628\u0639 \u0627\u0644\u0623\u062F\u0627\u0621 \u0648\u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0641\u064A \u0644\u062D\u0638\u062A\u0647\u0627." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { className: "field select-field", style: { minWidth: 170 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "field-label", children: "\u0627\u0644\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("select", { className: "input", value: refreshInterval, onChange: (event) => setRefreshInterval(Number(event.target.value)), children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: 5e3, children: "\u0643\u0644 5 \u062B\u0648\u0627\u0646\u064A" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: 7e3, children: "\u0643\u0644 7 \u062B\u0648\u0627\u0646\u064A" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: 15e3, children: "\u0643\u0644 15 \u062B\u0627\u0646\u064A\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: 3e4, children: "\u0643\u0644 30 \u062B\u0627\u0646\u064A\u0629" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Button, { variant: "secondary", onClick: loadDashboard, loading, children: "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0622\u0646" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { style: { padding: 18, background: `${healthLevel.color}16`, border: `1px solid ${healthLevel.color}44` }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 12, alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { width: 14, height: 14, borderRadius: "50%", background: healthLevel.color, boxShadow: `0 0 24px ${healthLevel.color}` } }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { color: "#f8fafc", fontWeight: 800 }, children: [
              "\u062D\u0627\u0644\u0629 \u0627\u0644\u0646\u0638\u0627\u0645: ",
              healthLevel.label
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { color: "#cbd5e1", fontSize: 13 }, children: [
              "CPU ",
              metrics.cpu_usage || 0,
              "% \u2022 RAM ",
              metrics.memory_usage || 0,
              "% \u2022 Long tasks ",
              performanceSnapshot.longTasks
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { color: "#94a3b8", fontSize: 13 }, children: [
          "Connection ",
          performanceSnapshot.connection,
          " \u2022 Recommended quality ",
          performanceSnapshot.quality
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: kpis.map((item) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 30, fontWeight: 800, margin: "10px 0 8px", color: item.tone }, children: item.value }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
      ] }, item.label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "Traffic & growth charts" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#94a3b8", fontSize: 13, marginBottom: 12 }, children: "\u062D\u0631\u0643\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u064A\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(LineChart, { data: metrics.traffic_history || [] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#94a3b8", fontSize: 13, marginBottom: 12 }, children: "\u0645\u0639\u062F\u0644 \u0627\u0644\u0646\u0645\u0648" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(BarChart, { data: metrics.growth_history || [] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "Audience mix" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DonutChart, { data: metrics.audience_mix || [] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }, children: [
        { label: "\u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631", value: metrics.live_mix?.[0]?.value || 0, hint: "\u0627\u0644\u063A\u0631\u0641 \u0627\u0644\u0646\u0634\u0637\u0629 \u0627\u0644\u0622\u0646" },
        { label: "\u0627\u0644\u0631\u064A\u0644\u0632 \u0627\u0644\u0646\u0634\u0637\u0629", value: metrics.live_mix?.[1]?.value || 0, hint: "\u0645\u062D\u062A\u0648\u0649 \u0633\u0631\u064A\u0639 \u0645\u0628\u0627\u0634\u0631" },
        { label: "\u0627\u0644\u0642\u0635\u0635 \u0627\u0644\u0646\u0634\u0637\u0629", value: metrics.live_mix?.[2]?.value || 0, hint: "\u0642\u0635\u0635 \u0642\u064A\u062F \u0627\u0644\u0639\u0631\u0636" },
        { label: "\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629", value: metrics.reports_open || 0, hint: "\u064A\u062D\u062A\u0627\u062C \u0645\u062A\u0627\u0628\u0639\u0629" }
      ].map((item) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#f8fafc", fontSize: 24, fontWeight: 800, margin: "10px 0 8px" }, children: item.value }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
      ] }, item.label)) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.9fr)", gap: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { style: { margin: 0, color: "#f8fafc" }, children: "\u0627\u0644\u062C\u062F\u0648\u0644 \u0627\u0644\u062D\u064A \u0627\u0644\u0645\u062D\u0633\u0651\u0646" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "muted", style: { marginTop: 6 }, children: "\u0628\u062D\u062B + \u0641\u0644\u0627\u062A\u0631 + \u062F\u0645\u062C \u0627\u0644\u0646\u0634\u0627\u0637\u0627\u062A \u0648\u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0641\u064A \u062C\u062F\u0648\u0644 \u0648\u0627\u062D\u062F" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
              ["all", "\u0627\u0644\u0643\u0644"],
              ["audit", "Audit"],
              ["activity", "Activity"]
            ].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: `dashboard-filter-chip ${tableFilter === value ? "active" : ""}`, onClick: () => setTableFilter(value), children: label }, value)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { className: "input", style: { flex: 1, minWidth: 220 }, value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), placeholder: "\u0627\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u062C\u062F\u0627\u0648\u0644..." }) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("table", { className: "admin-table", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u0627\u0644\u0646\u0648\u0639" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u0627\u0644\u0645\u0633\u0624\u0648\u0644" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u0627\u0644\u062D\u0627\u0644\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("th", { children: "\u0627\u0644\u0648\u0642\u062A" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tbody", { children: [
              liveTableRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "row-kind-pill", children: row.kind === "audit" ? "Audit" : "Activity" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "grid", gap: 4 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { style: { color: "#f8fafc" }, children: row.title }),
                  row.description ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "muted", style: { fontSize: 12 }, children: row.description }) : null
                ] }) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: row.actor }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "row-level-pill", style: { "--level-tone": levelTone(row.level) }, children: row.level }) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { children: new Date(row.time).toLocaleString("ar-EG") })
              ] }, row.id)),
              !liveTableRows.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("td", { colSpan: "5", className: "table-empty", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0641\u0644\u0627\u062A\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629." }) }) : null
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { style: { padding: 18 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Admin activity stream" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: "#94a3b8", fontSize: 12 }, children: "live updates" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { display: "grid", gap: 10 }, children: activityStream.map((activity, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { borderRadius: 16, padding: 14, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", color: "#f8fafc", fontWeight: 700 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: activity.action }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { color: "#64748b", fontSize: 12 }, children: new Date(activity.timestamp).toLocaleTimeString("ar-EG") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: activity.description })
          ] }, `${activity.action}-${index}`)) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }, children: [
        { label: "JS heap", value: `${performanceSnapshot.jsHeapMb} MB`, hint: "\u0642\u064A\u0627\u0633 \u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u062D\u0627\u0644\u064A\u0629" },
        { label: "Tracked metrics", value: performanceSnapshot.metricCount, hint: "LCP / CLS / longtask events" },
        { label: "TTFB", value: `${performanceSnapshot.ttfb} ms`, hint: "\u0632\u0645\u0646 \u0623\u0648\u0644 \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0644\u0644\u0645\u0644\u0627\u062D\u0629" },
        { label: "Device profile", value: performanceSnapshot.lowEnd ? "Low-end" : "Standard", hint: "\u062A\u0642\u062F\u064A\u0631 \u0622\u0644\u064A \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0636\u0639\u064A\u0641\u0629" }
      ].map((item) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#f8fafc", fontSize: 24, fontWeight: 800, margin: "10px 0 8px" }, children: item.value }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
      ] }, item.label)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("style", { children: `
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

// src/pages/admin/AdminUsers.jsx
init_define_import_meta_env();

// src/admin/pages/AdminUsers.jsx
init_define_import_meta_env();
var import_react4 = __toESM(require_react(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
function AdminUsers() {
  const [searchTerm, setSearchTerm] = (0, import_react4.useState)("");
  const [selectedUser, setSelectedUser] = (0, import_react4.useState)(null);
  const [filterRole, setFilterRole] = (0, import_react4.useState)("all");
  const [filterStatus, setFilterStatus] = (0, import_react4.useState)("all");
  const [actionModal, setActionModal] = (0, import_react4.useState)(null);
  const [actionData, setActionData] = (0, import_react4.useState)({});
  const [users, setUsers] = (0, import_react4.useState)([
    {
      id: 1,
      name: "\u0623\u062D\u0645\u062F \u0639\u0644\u064A",
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
        { time: "2024-05-10 14:20", action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644", details: "\u0645\u0646 \u0627\u0644\u0631\u064A\u0627\u0636" },
        { time: "2024-05-09 18:30", action: "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A", details: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0635\u0648\u0631\u0629" }
      ]
    },
    {
      id: 2,
      name: "\u0633\u0627\u0631\u0629 \u0645\u062D\u0645\u062F",
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
        { time: "2024-05-10 10:05", action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u062F\u062E\u0648\u0644 \u0641\u0627\u0634\u0644\u0629", details: "\u0645\u0646 \u0641\u0631\u0646\u0633\u0627" }
      ]
    },
    {
      id: 3,
      name: "\u062E\u0627\u0644\u062F \u062D\u0633\u0646",
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
      name: "\u0645\u062D\u0645\u062F \u0627\u0644\u062D\u0633\u0646",
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
        { time: "2024-05-08 12:00", action: "\u062A\u062D\u0630\u064A\u0631 \u062A\u0644\u0642\u0627\u0626\u064A", details: "\u0633\u0628\u0627\u0645 \u0645\u062A\u0643\u0631\u0631" }
      ]
    }
  ]);
  const filteredUsers = (0, import_react4.useMemo)(() => {
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
          action: "\u062A\u062C\u0645\u064A\u062F \u0645\u0624\u0642\u062A",
          details: `\u0644\u0645\u062F\u0629 ${duration} \u0623\u064A\u0627\u0645`
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
          action: "\u062D\u0638\u0631 IP",
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
          action: "\u062D\u0638\u0631 \u062C\u0647\u0627\u0632",
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
          action: "\u062D\u0638\u0631 \u0646\u0647\u0627\u0626\u064A",
          details: "\u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0634\u0643\u0644 \u0646\u0647\u0627\u0626\u064A"
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
          action: "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062C\u0645\u064A\u062F",
          details: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062C\u0645\u064A\u062F \u0627\u0644\u0645\u0624\u0642\u062A"
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
          action: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629",
          details: `\u0645\u0646 ${u.role} \u0625\u0644\u0649 ${newRole}`
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
      "super_admin": "\u0645\u0633\u0624\u0648\u0644 \u0639\u0627\u0645",
      "moderator": "\u0645\u0634\u0631\u0641",
      "support": "\u062F\u0639\u0645 \u0641\u0646\u064A",
      "user": "\u0645\u0633\u062A\u062E\u062F\u0645 \u0639\u0627\u062F\u064A"
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
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "admin-users-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Card, { className: "users-header-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { children: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "muted", children: "\u0646\u0638\u0627\u0645 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0645\u062A\u062F\u0631\u062C\u060C \u0645\u0631\u0627\u0642\u0628\u0629 \u0633\u0644\u0648\u0643 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646\u060C \u0648\u0623\u062F\u0648\u0627\u062A \u062D\u0638\u0631 \u0645\u062A\u0642\u062F\u0645\u0629." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: handleExport, variant: "secondary", children: "\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 (CSV)" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "filters-row mt-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Input,
          {
            placeholder: "\u0627\u0644\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "search-input"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "select",
          {
            value: filterRole,
            onChange: (e) => setFilterRole(e.target.value),
            className: "filter-select",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "all", children: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "super_admin", children: "\u0645\u0633\u0624\u0648\u0644 \u0639\u0627\u0645" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "moderator", children: "\u0645\u0634\u0631\u0641" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "support", children: "\u062F\u0639\u0645 \u0641\u0646\u064A" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "user", children: "\u0645\u0633\u062A\u062E\u062F\u0645 \u0639\u0627\u062F\u064A" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "select",
          {
            value: filterStatus,
            onChange: (e) => setFilterStatus(e.target.value),
            className: "filter-select",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "all", children: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0627\u0644\u0627\u062A" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "active", children: "\u0646\u0634\u0637" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "frozen", children: "\u0645\u062C\u0645\u062F" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "flagged", children: "\u0645\u0631\u0627\u0642\u0628" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "banned", children: "\u0645\u062D\u0638\u0648\u0631" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Card, { className: "users-stats-card mt-4", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "stats-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "stat-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-value", children: users.length }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-label", children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "stat-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-value", children: users.filter((u) => u.status === "active").length }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-label", children: "\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0646\u0634\u0637\u0648\u0646" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "stat-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-value", children: users.filter((u) => u.isFrozen).length }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-label", children: "\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0645\u062C\u0645\u062F\u0648\u0646" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "stat-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-value", children: users.filter((u) => u.status === "banned").length }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "stat-label", children: "\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0645\u062D\u0638\u0648\u0631\u0648\u0646" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Card, { className: "users-table-card mt-4", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("table", { className: "admin-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { children: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { children: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { children: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { children: "\u062F\u0631\u062C\u0629 \u0627\u0644\u0645\u062E\u0627\u0637\u0631" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { children: "\u0627\u0644\u062D\u0627\u0644\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { children: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("tbody", { children: filteredUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "user-cell", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "avatar-sm", children: user.name[0].toUpperCase() }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: user.name }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "text-xs muted", children: user.email })
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `role-badge role-${user.role}`, children: getRoleLabel(user.role) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { children: user.joined }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `risk-badge ${user.riskScore > 70 ? "high" : user.riskScore > 30 ? "medium" : "low"}`, children: [
          user.riskScore,
          "%"
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "status-pill", style: { background: getStatusColor(user.status) + "20", color: getStatusColor(user.status) }, children: user.status === "active" ? "\u0646\u0634\u0637" : user.status === "frozen" ? "\u0645\u062C\u0645\u062F" : user.status === "flagged" ? "\u0645\u0631\u0627\u0642\u0628" : "\u0645\u062D\u0638\u0648\u0631" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { size: "small", variant: "secondary", onClick: () => setSelectedUser(user), children: "\u062A\u062F\u0642\u064A\u0642" }) })
      ] }, user.id)) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Modal,
      {
        open: !!selectedUser,
        onClose: () => setSelectedUser(null),
        title: `\u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642: ${selectedUser?.name}`,
        size: "large",
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "audit-content", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "audit-summary", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "summary-item", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { children: "\u0628\u0635\u0645\u0629 \u0627\u0644\u062C\u0647\u0627\u0632" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("code", { children: selectedUser?.fingerprint })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "summary-item", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { children: "\u0639\u0646\u0648\u0627\u0646 IP" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("code", { children: selectedUser?.ip })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "summary-item", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { children: "\u0645\u0639\u0631\u0641 \u0627\u0644\u062C\u0647\u0627\u0632" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("code", { children: selectedUser?.deviceId })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "summary-item", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { children: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `role-badge role-${selectedUser?.role}`, children: getRoleLabel(selectedUser?.role) })
            ] })
          ] }),
          selectedUser?.bannedIPs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "banned-list mt-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h4", { children: "\u0639\u0646\u0627\u0648\u064A\u0646 IP \u0627\u0644\u0645\u062D\u0638\u0648\u0631\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "banned-items", children: selectedUser.bannedIPs.map((ip, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "banned-item", children: ip }, i)) })
          ] }),
          selectedUser?.bannedDevices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "banned-list mt-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h4", { children: "\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u062D\u0638\u0648\u0631\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "banned-items", children: selectedUser.bannedDevices.map((device, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "banned-item", children: device }, i)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h4", { className: "mt-6 mb-4", children: "\u0633\u062C\u0644 \u0627\u0644\u0646\u0634\u0627\u0637" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "timeline", children: selectedUser?.activityLog.map((log, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `timeline-item ${log.action.includes("\u062A\u062D\u0630\u064A\u0631") || log.action.includes("\u0641\u0627\u0634\u0644\u0629") ? "warning" : ""}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "time", children: log.time }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "event", children: [
              log.action,
              ": ",
              log.details
            ] })
          ] }, i)) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "audit-actions mt-6", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "action-group", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h4", { children: "\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "button-group", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                Button,
                {
                  size: "small",
                  variant: "secondary",
                  onClick: () => setActionModal("change_role"),
                  children: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629"
                }
              ) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "action-group mt-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h4", { children: "\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062D\u0638\u0631 \u0648\u0627\u0644\u062A\u062C\u0645\u064A\u062F" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "button-group", children: [
                !selectedUser?.isFrozen ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  Button,
                  {
                    size: "small",
                    variant: "warning",
                    onClick: () => setActionModal("freeze"),
                    children: "\u062A\u062C\u0645\u064A\u062F \u0645\u0624\u0642\u062A"
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  Button,
                  {
                    size: "small",
                    variant: "primary",
                    onClick: () => handleUnfreeze(selectedUser.id),
                    children: "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062C\u0645\u064A\u062F"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  Button,
                  {
                    size: "small",
                    variant: "secondary",
                    onClick: () => setActionModal("ban_ip"),
                    children: "\u062D\u0638\u0631 IP"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  Button,
                  {
                    size: "small",
                    variant: "secondary",
                    onClick: () => setActionModal("ban_device"),
                    children: "\u062D\u0638\u0631 \u062C\u0647\u0627\u0632"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  Button,
                  {
                    size: "small",
                    variant: "danger",
                    onClick: () => setActionModal("ban_user"),
                    children: "\u062D\u0638\u0631 \u0646\u0647\u0627\u0626\u064A"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Modal,
      {
        open: actionModal === "freeze",
        onClose: () => setActionModal(null),
        title: "\u062A\u062C\u0645\u064A\u062F \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0624\u0642\u062A\u0627\u064B",
        size: "small",
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "action-form", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "\u0627\u062E\u062A\u0631 \u0645\u062F\u0629 \u0627\u0644\u062A\u062C\u0645\u064A\u062F:" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "duration-buttons", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: () => handleFreezeUser(selectedUser.id, 1), children: "\u064A\u0648\u0645 \u0648\u0627\u062D\u062F" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: () => handleFreezeUser(selectedUser.id, 7), children: "\u0623\u0633\u0628\u0648\u0639" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: () => handleFreezeUser(selectedUser.id, 30), children: "\u0634\u0647\u0631" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Modal,
      {
        open: actionModal === "ban_ip",
        onClose: () => setActionModal(null),
        title: "\u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 IP",
        size: "small",
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "action-form", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { children: [
            "\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0638\u0631 \u0639\u0646\u0648\u0627\u0646 IP: ",
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("code", { children: selectedUser?.ip }),
            "\u061F"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "button-group mt-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "danger", onClick: () => handleBanIP(selectedUser.id, selectedUser.ip), children: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0638\u0631" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "secondary", onClick: () => setActionModal(null), children: "\u0625\u0644\u063A\u0627\u0621" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Modal,
      {
        open: actionModal === "ban_device",
        onClose: () => setActionModal(null),
        title: "\u062D\u0638\u0631 \u0627\u0644\u062C\u0647\u0627\u0632",
        size: "small",
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "action-form", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { children: [
            "\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0638\u0631 \u0627\u0644\u062C\u0647\u0627\u0632: ",
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("code", { children: selectedUser?.deviceId }),
            "\u061F"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "button-group mt-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "danger", onClick: () => handleBanDevice(selectedUser.id, selectedUser.deviceId), children: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0638\u0631" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "secondary", onClick: () => setActionModal(null), children: "\u0625\u0644\u063A\u0627\u0621" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Modal,
      {
        open: actionModal === "ban_user",
        onClose: () => setActionModal(null),
        title: "\u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0646\u0647\u0627\u0626\u064A\u0627\u064B",
        size: "small",
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "action-form", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "warning-text", children: "\u26A0\uFE0F \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0633\u064A\u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0634\u0643\u0644 \u0646\u0647\u0627\u0626\u064A \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646\u0647 \u0628\u0633\u0647\u0648\u0644\u0629." }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { children: [
            "\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062D\u0638\u0631 ",
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: selectedUser?.name }),
            "\u061F"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "button-group mt-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "danger", onClick: () => handleBanUser(selectedUser.id), children: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0638\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { variant: "secondary", onClick: () => setActionModal(null), children: "\u0625\u0644\u063A\u0627\u0621" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Modal,
      {
        open: actionModal === "change_role",
        onClose: () => setActionModal(null),
        title: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629",
        size: "small",
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "action-form", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629:" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "role-buttons", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: () => handleChangeRole(selectedUser.id, "user"), children: "\u0645\u0633\u062A\u062E\u062F\u0645 \u0639\u0627\u062F\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: () => handleChangeRole(selectedUser.id, "support"), children: "\u062F\u0639\u0645 \u0641\u0646\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: () => handleChangeRole(selectedUser.id, "moderator"), children: "\u0645\u0634\u0631\u0641" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Button, { onClick: () => handleChangeRole(selectedUser.id, "super_admin"), children: "\u0645\u0633\u0624\u0648\u0644 \u0639\u0627\u0645" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("style", { dangerouslySetInnerHTML: { __html: `
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

// src/pages/admin/AdminPosts.jsx
init_define_import_meta_env();
var import_react5 = __toESM(require_react(), 1);
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var initialForm = { content: "", image_url: "", user_id: "" };
function AdminPosts() {
  const [posts, setPosts] = (0, import_react5.useState)([]);
  const [pagination, setPagination] = (0, import_react5.useState)({ page: 1, pages: 1, total: 0, page_size: 10 });
  const [search, setSearch] = (0, import_react5.useState)("");
  const [sortBy, setSortBy] = (0, import_react5.useState)("created_at");
  const [sortDirection, setSortDirection] = (0, import_react5.useState)("desc");
  const [selectedIds, setSelectedIds] = (0, import_react5.useState)([]);
  const [form, setForm] = (0, import_react5.useState)(initialForm);
  const [editingPost, setEditingPost] = (0, import_react5.useState)(null);
  const [open, setOpen] = (0, import_react5.useState)(false);
  const [deleteTarget, setDeleteTarget] = (0, import_react5.useState)(null);
  const [loading, setLoading] = (0, import_react5.useState)(true);
  const [loadError, setLoadError] = (0, import_react5.useState)("");
  const [saving, setSaving] = (0, import_react5.useState)(false);
  const [actionBusyKey, setActionBusyKey] = (0, import_react5.useState)("");
  const [mediaReviewOpen, setMediaReviewOpen] = (0, import_react5.useState)(false);
  const [currentMedia, setCurrentMedia] = (0, import_react5.useState)(null);
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
      const message = error?.response?.data?.detail || "\u062D\u062F\u062B \u062E\u0637\u0623.";
      setLoadError(message);
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u062D\u062A\u0648\u0649", description: message, type: "error" });
    } finally {
      setLoading(false);
    }
  };
  (0, import_react5.useEffect)(() => {
    loadPosts(1);
  }, [debouncedSearch, sortBy, sortDirection]);
  (0, import_react5.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(AdminLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "filters-row wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Input, { label: "Search", value: search, onChange: (event) => setSearch(event.target.value), placeholder: "\u0627\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0623\u0648 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "field select-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "field-label", children: "Sorting" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("select", { className: "input", value: sortBy, onChange: (event) => setSortBy(event.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "created_at", children: "\u0627\u0644\u0623\u062D\u062F\u062B" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "engagement", children: "\u0627\u0644\u062A\u0641\u0627\u0639\u0644" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "field select-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "field-label", children: "Direction" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("select", { className: "input", value: sortDirection, onChange: (event) => setSortDirection(event.target.value), children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "desc", children: "\u062A\u0646\u0627\u0632\u0644\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "asc", children: "\u062A\u0635\u0627\u0639\u062F\u064A" })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "action-row wide", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { onClick: () => setOpen(true), children: "\u0645\u0646\u0634\u0648\u0631 \u062C\u062F\u064A\u062F" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "bulk-actions-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { variant: "secondary", disabled: !selectedIds.length, onClick: () => handleBulkAction("approve"), children: "Approve All" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { variant: "secondary", className: "danger", disabled: !selectedIds.length, onClick: () => handleBulkAction("delete"), children: "Delete All" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { variant: "secondary", onClick: () => loadPosts(pagination.page), loading, children: "Refresh" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "muted", children: [
          selectedIds.length,
          " items selected"
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Card, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "card-head split", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "section-title", children: "Post Moderation & AI Control" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "pagination-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { variant: "secondary", disabled: pagination.page <= 1, onClick: () => loadPosts(pagination.page - 1), children: "\u0627\u0644\u0633\u0627\u0628\u0642" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
            pagination.page,
            " / ",
            pagination.pages
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { variant: "secondary", disabled: pagination.page >= pagination.pages, onClick: () => loadPosts(pagination.page + 1), children: "\u0627\u0644\u062A\u0627\u0644\u064A" })
        ] })
      ] }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(TableSkeleton, { rows: 6 }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("table", { className: "admin-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "checkbox", onChange: (e) => setSelectedIds(e.target.checked ? posts.map((p) => p.id) : []) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { children: "ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { children: "Author" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { children: "Content & Media" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { children: "AI Flag" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("tbody", { children: posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "checkbox", checked: selectedIds.includes(post.id), onChange: () => toggleSelected(post.id) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("td", { children: [
            "#",
            post.id
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "user-cell", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: post.username }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "text-link tiny", onClick: () => handleShadowBan(post.user_id), children: "Shadow Ban" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "content-preview", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { children: [
              post.content?.slice(0, 50),
              "..."
            ] }),
            post.image_url && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "media-badge", onClick: () => openMediaReview(post), children: "Review Media" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `badge ${post.ai_flagged ? "danger" : "success"}`, children: post.ai_flagged ? "Auto-Flagged" : "Clean" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "action-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "mini-action", onClick: () => handleAIModeration(post.id), children: "AI Scan" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "mini-action danger", onClick: () => setDeleteTarget(post), children: "Delete" })
          ] }) })
        ] }, post.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Modal, { open: mediaReviewOpen, title: "Media Review", onClose: () => setMediaReviewOpen(false), children: currentMedia && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "media-review-container", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("img", { src: currentMedia.image_url, alt: "Post content", className: "review-img" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "modal-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { variant: "secondary", onClick: () => setMediaReviewOpen(false), children: "Close" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Button, { className: "danger", onClick: () => {
          handleBulkAction("delete");
          setMediaReviewOpen(false);
        }, children: "Flag & Remove" })
      ] })
    ] }) })
  ] });
}

// src/pages/admin/AdminNotifications.jsx
init_define_import_meta_env();
var import_react6 = __toESM(require_react(), 1);
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
function AdminNotifications() {
  const [notifications, setNotifications] = (0, import_react6.useState)([]);
  const [analytics, setAnalytics] = (0, import_react6.useState)({ delivered: 0, opened: 0, failed: 0 });
  const [form, setForm] = (0, import_react6.useState)({ title: "", body: "", segment: "all", schedule_time: "" });
  const [loading, setLoading] = (0, import_react6.useState)(true);
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
  (0, import_react6.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("section", { className: "notifications-dashboard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "two-column-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Card, { title: "Schedule Push Notification", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "modal-stack", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input, { label: "Title", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "field-label", children: "Message Body" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("textarea", { className: "input", rows: "3", value: form.body, onChange: (e) => setForm({ ...form, body: e.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "filters-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "field select-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "field-label", children: "User Segmentation" }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("select", { className: "input", value: form.segment, onChange: (e) => setForm({ ...form, segment: e.target.value }), children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: "all", children: "All Users" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: "active", children: "Active (Last 7 days)" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: "inactive", children: "Inactive" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: "premium", children: "Premium Only" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Input, { label: "Schedule Time", type: "datetime-local", value: form.schedule_time, onChange: (e) => setForm({ ...form, schedule_time: e.target.value }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Button, { onClick: handleSchedule, children: "Schedule & Broadcast" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Card, { title: "Delivery Analytics", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "analytics-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "stat-item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "label", children: "Delivered" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "value success", children: analytics.delivered })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "stat-item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "label", children: "Open Rate" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "value info", children: [
            (analytics.opened / analytics.delivered * 100 || 0).toFixed(1),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "stat-item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "label", children: "Retry Queue" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "value warning", children: analytics.failed })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Card, { title: "Notification History & Queue", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("table", { className: "admin-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { children: "Title" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { children: "Target Segment" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { children: "Scheduled For" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { children: "Status" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("th", { children: "Analytics" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("tbody", { children: notifications.map((n) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { children: n.title }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "badge", children: n.segment }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("td", { children: new Date(n.schedule_time).toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("td", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: `status-dot ${n.status}` }),
          " ",
          n.status
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("td", { children: [
          n.open_count,
          " opens / ",
          n.delivery_count,
          " sent"
        ] })
      ] }, n.id)) })
    ] }) }) })
  ] }) });
}

// src/pages/admin/AdminLive.jsx
init_define_import_meta_env();
var import_react7 = __toESM(require_react(), 1);
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
function AdminLive() {
  const [rooms, setRooms] = (0, import_react7.useState)([]);
  const [stats, setStats] = (0, import_react7.useState)({});
  const [loading, setLoading] = (0, import_react7.useState)(true);
  const [selectedRoom, setSelectedRoom] = (0, import_react7.useState)(null);
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
  (0, import_react7.useEffect)(() => {
    loadLiveStatus();
    socket_default.on("stream_metrics_update", (data) => {
      setStats((prev) => ({ ...prev, ...data }));
    });
    return () => socket_default.off("stream_metrics_update");
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
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(AdminLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("section", { className: "live-monitoring-header", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { className: "metrics-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "metric-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "label", children: "Active Streams" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "value", children: stats.active_rooms || 0 })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "metric-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "label", children: "Total Viewers" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "value", children: stats.current_viewers || 0 })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "metric-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "label", children: "Avg Bitrate" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "value", children: stats.avg_bitrate || "0 kbps" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("section", { className: "streams-grid", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "card-head split", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { className: "section-title", children: "Live Stream Monitoring" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "live-indicator", children: "Real-time Feed Active" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("table", { className: "admin-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "Host" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "Title" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "Metrics (V/L/B)" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "Status" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("th", { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("tbody", { children: rooms.map((room) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { children: room.username }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { children: room.title }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("td", { children: [
            room.viewer_count,
            " / ",
            room.likes,
            " / ",
            room.bitrate,
            "k"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "badge success", children: "Live" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "action-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "mini-action", onClick: () => setSelectedRoom(room), children: "Monitor" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "mini-action danger", onClick: () => handleEmergencyStop(room.id), children: "Emergency Stop" })
          ] }) })
        ] }, room.id)) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Modal, { open: !!selectedRoom, title: "Stream Moderation & Metrics", onClose: () => setSelectedRoom(null), children: selectedRoom && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "stream-mod-container", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "stream-preview-placeholder", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "overlay-metrics", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
          "FPS: ",
          selectedRoom.fps || 30
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
          "Latency: ",
          selectedRoom.latency || "120ms"
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "mod-controls", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Button, { variant: "secondary", children: "Mute Audio" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Button, { variant: "secondary", children: "Hide Chat" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Button, { className: "danger", onClick: () => handleEmergencyStop(selectedRoom.id), children: "Terminate Stream" })
      ] })
    ] }) })
  ] });
}

// src/pages/admin/AdminReports.jsx
init_define_import_meta_env();
var import_react8 = __toESM(require_react(), 1);
var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
var ROW_HEIGHT = 94;
var QUEUE_HEIGHT = 520;
var OVERSCAN = 4;
var FALLBACK_REPORTS = [
  {
    id: "REP-4102",
    type: "\u0627\u0646\u062A\u062D\u0627\u0644 \u0634\u062E\u0635\u064A\u0629",
    target: "@fake.company.support",
    targetType: "account",
    reporter: "@salma",
    severity: "critical",
    status: "pending",
    score: 96,
    queue: "identity",
    reason: "\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0633\u0645 \u0648\u0647\u0648\u064A\u0629 \u0645\u0639 \u062D\u0633\u0627\u0628 \u0645\u0648\u062B\u0651\u0642 \u0648\u0645\u062D\u0627\u0648\u0644\u0629 \u0633\u062D\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646.",
    slaMinutes: 12,
    createdAt: "2026-05-11T08:15:00.000Z"
  },
  {
    id: "REP-4103",
    type: "\u062A\u062D\u0631\u0634 \u0648\u0631\u0633\u0627\u0626\u0644 \u0645\u0633\u064A\u0626\u0629",
    target: "Chat Room #778",
    targetType: "chat",
    reporter: "@mahmoud",
    severity: "high",
    status: "investigating",
    score: 82,
    queue: "safety",
    reason: "\u0628\u0644\u0627\u063A \u0645\u062A\u0643\u0631\u0631 \u0645\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0639 \u0643\u0644\u0645\u0627\u062A \u0645\u0641\u062A\u0627\u062D\u064A\u0629 \u062E\u0637\u064A\u0631\u0629.",
    slaMinutes: 28,
    createdAt: "2026-05-11T08:21:00.000Z"
  },
  {
    id: "REP-4104",
    type: "\u0645\u062D\u062A\u0648\u0649 \u0639\u0646\u064A\u0641",
    target: "Post #29018",
    targetType: "post",
    reporter: "@nada",
    severity: "high",
    status: "pending",
    score: 77,
    queue: "content",
    reason: "\u0635\u0648\u0631\u0629 \u062D\u0633\u0627\u0633\u0629 \u0628\u062F\u0648\u0646 \u062A\u062D\u0630\u064A\u0631 + \u0627\u0646\u062A\u0634\u0627\u0631 \u0633\u0631\u064A\u0639 \u062F\u0627\u062E\u0644 \u0627\u0644\u0631\u064A\u0644\u0632.",
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
    reason: "\u0631\u0648\u0627\u0628\u0637 \u0645\u0634\u0628\u0648\u0647\u0629 \u0648\u0639\u0631\u0648\u0636 \u0648\u0647\u0645\u064A\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0628\u062B.",
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
    reason: "\u0645\u0637\u0627\u0644\u0628\u0629 \u062D\u0642\u0648\u0642 \u0646\u0634\u0631 \u0645\u0639 \u0625\u062B\u0628\u0627\u062A \u0645\u0644\u0643\u064A\u0629 \u0644\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A\u064A.",
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
    type: item.type || item.reason || "\u0628\u0644\u0627\u063A \u0639\u0627\u0645",
    target: item.target || item.target_label || item.target_id || `Target #${index + 1}`,
    targetType: item.target_type || "content",
    reporter: item.reporter || item.reported_by || item.username || `user_${index + 1}`,
    severity: item.severity || item.priority || (Number(item.score || 0) > 85 ? "critical" : Number(item.score || 0) > 70 ? "high" : "medium"),
    status: item.status || "pending",
    score: Number(item.score ?? item.risk_score ?? item.confidence ?? 60 + index % 28),
    queue: item.queue || item.category || item.target_type || "general",
    reason: item.reason || item.description || item.summary || "\u0644\u0627 \u064A\u0648\u062C\u062F \u0648\u0635\u0641 \u0625\u0636\u0627\u0641\u064A \u0645\u0646 \u0627\u0644\u0640 API.",
    slaMinutes: Number(item.sla_minutes ?? item.sla ?? 20 + index * 3),
    createdAt: item.created_at || item.timestamp || new Date(Date.now() - index * 11 * 60 * 1e3).toISOString()
  }));
}
function statusLabel(status) {
  switch (status) {
    case "pending":
      return "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629";
    case "investigating":
      return "\u0642\u064A\u062F \u0627\u0644\u062A\u062D\u0642\u064A\u0642";
    case "resolved":
      return "\u062A\u0645 \u0627\u0644\u062D\u0644";
    case "rejected":
      return "\u0645\u0631\u0641\u0648\u0636";
    case "escalated":
      return "\u062A\u0645 \u0627\u0644\u062A\u0635\u0639\u064A\u062F";
    default:
      return status || "\u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641";
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
    { label: "Report Center", value: reports.length, hint: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629" },
    { label: "Review Queue", value: pending, hint: "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0623\u0648\u0644 \u0625\u062C\u0631\u0627\u0621 \u0645\u0646 \u0627\u0644\u0641\u0631\u064A\u0642" },
    { label: "Critical cases", value: critical, hint: "\u0623\u0648\u0644\u0648\u064A\u0629 \u0642\u0635\u0648\u0649 \u062A\u062D\u062A\u0627\u062C \u0642\u0631\u0627\u0631 \u0633\u0631\u064A\u0639" },
    { label: "Moderation accuracy", value: `${accuracy}%`, hint: "\u0645\u062A\u0648\u0633\u0637 \u062F\u0642\u0629 \u0627\u0644\u0641\u0631\u0632 \u0627\u0644\u0630\u0643\u064A" },
    { label: "Escalations", value: escalated, hint: "\u062D\u0627\u0644\u0627\u062A \u062A\u0645 \u0631\u0641\u0639\u0647\u0627 \u0644\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627" },
    { label: "SLA \u2264 30m", value: `${underSla}/${reports.length}`, hint: "\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0632\u0645\u0646 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629" }
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
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { style: { fontWeight: 800, color: "#f8fafc" }, children: report.type }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { style: { padding: "4px 10px", borderRadius: 999, fontSize: 12, background: `${severityColor(report.severity)}22`, color: severityColor(report.severity) }, children: report.severity }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { style: { padding: "4px 10px", borderRadius: 999, fontSize: 12, background: "rgba(148,163,184,0.16)", color: "#cbd5e1" }, children: statusLabel(report.status) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#e2e8f0", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: report.target }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#94a3b8", fontSize: 12, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: report.reason })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#f8fafc", fontWeight: 700, marginBottom: 5 }, children: report.reporter }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { color: "#94a3b8", fontSize: 12 }, children: [
            "Score: ",
            report.score,
            " \u2022 SLA: ",
            report.slaMinutes,
            "m"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#64748b", fontSize: 12, marginTop: 4 }, children: new Date(report.createdAt).toLocaleString("ar-EG") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { size: "small", variant: "secondary", onClick: (event) => {
            event.stopPropagation();
            onOpen(report);
          }, children: "\u062A\u0641\u0627\u0635\u064A\u0644" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { size: "small", variant: "success", onClick: (event) => {
            event.stopPropagation();
            onResolve(report);
          }, children: "\u0627\u0639\u062A\u0645\u0627\u062F" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { size: "small", variant: "danger", onClick: (event) => {
            event.stopPropagation();
            onEscalate(report);
          }, children: "\u062A\u0635\u0639\u064A\u062F" })
        ] })
      ]
    }
  );
}
function AdminReports() {
  const { pushToast } = useToast();
  const [reports, setReports] = (0, import_react8.useState)([]);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  const [activeReportId, setActiveReportId] = (0, import_react8.useState)("");
  const [filters, setFilters] = (0, import_react8.useState)({ search: "", status: "all", severity: "all", queue: "all" });
  const [scrollTop, setScrollTop] = (0, import_react8.useState)(0);
  const [busyId, setBusyId] = (0, import_react8.useState)("");
  const loadReports = (0, import_react8.useCallback)(async () => {
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
      pushToast({ type: "warning", title: "\u062A\u0645 \u062A\u0634\u063A\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u062C\u0631\u064A\u0628\u064A\u0629", description: error?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 \u062D\u0627\u0644\u064A\u0627\u064B." });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);
  (0, import_react8.useEffect)(() => {
    loadReports();
  }, [loadReports]);
  (0, import_react8.useEffect)(() => {
    const refresh = () => loadReports();
    socket_default.on("admin:report_created", refresh);
    socket_default.on("admin:report_updated", refresh);
    return () => {
      socket_default.off("admin:report_created", refresh);
      socket_default.off("admin:report_updated", refresh);
    };
  }, [loadReports]);
  const filteredReports = (0, import_react8.useMemo)(() => {
    const keyword = filters.search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesKeyword = !keyword || [report.id, report.type, report.target, report.reporter, report.reason].join(" ").toLowerCase().includes(keyword);
      const matchesStatus = filters.status === "all" || report.status === filters.status;
      const matchesSeverity = filters.severity === "all" || report.severity === filters.severity;
      const matchesQueue = filters.queue === "all" || report.queue === filters.queue;
      return matchesKeyword && matchesStatus && matchesSeverity && matchesQueue;
    });
  }, [filters, reports]);
  const queueMix = (0, import_react8.useMemo)(() => getQueueMix(filteredReports), [filteredReports]);
  const kpis = (0, import_react8.useMemo)(() => buildKpis(filteredReports), [filteredReports]);
  const scoring = (0, import_react8.useMemo)(() => scoreBars(filteredReports), [filteredReports]);
  const activeReport = (0, import_react8.useMemo)(
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
      pushToast({ type: "success", title: "\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0642\u0631\u0627\u0631", description: `${report.id} \u062A\u0645 \u0625\u0646\u0647\u0627\u0624\u0647 \u0628\u0646\u062C\u0627\u062D.` });
    } catch (error) {
      patchReport(report.id, { status: report.status });
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062D\u0627\u0644\u0629", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId("");
    }
  };
  const handleEscalate = async (report) => {
    try {
      setBusyId(report.id);
      patchReport(report.id, { status: "escalated", severity: report.severity === "critical" ? "critical" : "high" });
      await escalateReport(report.id);
      pushToast({ type: "warning", title: "\u062A\u0645 \u0627\u0644\u062A\u0635\u0639\u064A\u062F", description: `${report.id} \u062F\u062E\u0644 \u0645\u0633\u0627\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627.` });
    } catch (error) {
      patchReport(report.id, { status: report.status, severity: report.severity });
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u0635\u0639\u064A\u062F", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId("");
    }
  };
  const moderationActions = [
    { title: "\u062D\u0638\u0631 \u0645\u0624\u0642\u062A", description: "\u0625\u064A\u0642\u0627\u0641 24 \u0633\u0627\u0639\u0629 \u0645\u0639 \u0625\u0631\u0633\u0627\u0644 \u062A\u0646\u0628\u064A\u0647 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645", tone: "#ef4444" },
    { title: "\u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0645\u062D\u062A\u0648\u0649", description: "\u0625\u0632\u0627\u0644\u0629 \u0641\u0648\u0631\u064A\u0629 \u0645\u0646 \u0627\u0644\u0640 feed \u0648\u0627\u0644\u0628\u062D\u062B \u0648\u0627\u0644\u0631\u064A\u0644\u0632", tone: "#f97316" },
    { title: "\u0645\u0631\u0627\u062C\u0639\u0629 \u064A\u062F\u0648\u064A\u0629", description: "\u0625\u0633\u0646\u0627\u062F \u0627\u0644\u0628\u0644\u0627\u063A \u0644\u0623\u0639\u0644\u0649 \u0645\u062D\u0644\u0644 \u0645\u062A\u0627\u062D", tone: "#3b82f6" },
    { title: "\u0631\u0641\u0639 \u0644\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631", description: "\u0631\u0628\u0637 \u0627\u0644\u0628\u0644\u0627\u063A \u0628\u0646\u0638\u0627\u0645 live moderation", tone: "#14b8a6" }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { style: { display: "grid", gap: 18 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Card, { style: { padding: 20 }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { fontSize: 13, color: "#60a5fa", marginBottom: 8 }, children: "Report Center \u2022 Review Queue \u2022 Moderation Tools" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { style: { margin: 0, color: "#f8fafc" }, children: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A \u0648\u0627\u0644\u0625\u0634\u0631\u0627\u0641" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 760 }, children: "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u0643\u0632 \u0628\u0644\u0627\u063A\u0627\u062A \u0643\u0627\u0645\u0644 \u0628\u0641\u0644\u062A\u0631\u0629 \u0641\u0648\u0631\u064A\u0629\u060C \u0642\u0627\u0626\u0645\u0629 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u062E\u0641\u064A\u0641\u0629 \u0639\u0644\u0649 \u0627\u0644\u062C\u0648\u0627\u0644\u060C \u0648\u0623\u0632\u0631\u0627\u0631 \u0625\u0634\u0631\u0627\u0641 \u0633\u0631\u064A\u0639\u0629 \u0644\u062A\u0642\u0644\u064A\u0644 \u0632\u0645\u0646 \u0627\u0644\u0642\u0631\u0627\u0631 \u0639\u0644\u0649 \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0636\u0639\u064A\u0641\u0629." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { variant: "secondary", onClick: loadReports, loading, children: "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0622\u0646" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { onClick: () => pushToast({ type: "info", title: "Queue synced", description: "\u062A\u0645 \u0645\u0632\u0627\u0645\u0646\u0629 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0639 \u0627\u0644\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0644\u062D\u0638\u064A." }), children: "\u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0640 Queue" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: kpis.map((item) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#94a3b8", fontSize: 12, marginBottom: 10 }, children: item.label }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { fontSize: 28, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }, children: item.value }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
    ] }, item.label)) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Card, { style: { padding: 18, minWidth: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Review Queue" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "\u0642\u0627\u0626\u0645\u0629 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0633\u0631\u064A\u0639\u0629 \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0631\u0633\u0645 \u0643\u0644 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { color: "#64748b", fontSize: 12, display: "flex", alignItems: "center" }, children: [
            "Windowed list \u2022 ",
            filteredReports.length,
            " items"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Input, { label: "\u0628\u062D\u062B", value: filters.search, onChange: (event) => setFilters((prev) => ({ ...prev, search: event.target.value })), placeholder: "ID / \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 / \u0627\u0644\u0633\u0628\u0628" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "field select-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "field-label", children: "\u0627\u0644\u062D\u0627\u0644\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("select", { className: "input", value: filters.status, onChange: (event) => setFilters((prev) => ({ ...prev, status: event.target.value })), children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "all", children: "\u0627\u0644\u0643\u0644" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "pending", children: "\u0628\u0627\u0646\u062A\u0638\u0627\u0631" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "investigating", children: "\u062A\u062D\u0642\u064A\u0642" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "escalated", children: "\u062A\u0635\u0639\u064A\u062F" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "resolved", children: "\u0645\u0646\u062A\u0647\u064A" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "field select-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "field-label", children: "\u0627\u0644\u062E\u0637\u0648\u0631\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("select", { className: "input", value: filters.severity, onChange: (event) => setFilters((prev) => ({ ...prev, severity: event.target.value })), children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "all", children: "\u0627\u0644\u0643\u0644" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "critical", children: "critical" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "high", children: "high" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "medium", children: "medium" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "low", children: "low" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "field select-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "field-label", children: "\u0627\u0644\u0645\u0633\u0627\u0631" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("select", { className: "input", value: filters.queue, onChange: (event) => setFilters((prev) => ({ ...prev, queue: event.target.value })), children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "all", children: "\u0627\u0644\u0643\u0644" }),
              queueMix.map((item) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: item.label, children: item.label }, item.label))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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
            children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { height: totalHeight || 120, position: "relative" }, children: [
              visibleRows.map((report, index) => {
                const actualIndex = startIndex + index;
                return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { position: "absolute", insetInline: 0, top: actualIndex * ROW_HEIGHT, height: ROW_HEIGHT }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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
              !filteredReports.length ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { display: "grid", placeItems: "center", height: 120, color: "#94a3b8" }, children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u062A\u0627\u0626\u062C \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0641\u0644\u062A\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629." }) : null
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Card, { style: { padding: 18, display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { style: { margin: 0, color: "#f8fafc" }, children: "Moderation Tools" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "\u0623\u0648\u0627\u0645\u0631 \u0633\u0631\u064A\u0639\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u064A\u0646 \u0645\u0639 \u062A\u0648\u0636\u064A\u062D \u0623\u062B\u0631 \u0643\u0644 \u0625\u062C\u0631\u0627\u0621." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { display: "grid", gap: 10 }, children: moderationActions.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#f8fafc", fontWeight: 700 }, children: tool.title }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#cbd5e1", fontSize: 12, marginTop: 4 }, children: tool.description })
            ]
          },
          tool.title
        )) }),
        activeReport ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { borderRadius: 20, padding: 16, background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#60a5fa", fontSize: 12 }, children: activeReport.id }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#f8fafc", fontWeight: 800 }, children: activeReport.target })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { style: { padding: "6px 10px", borderRadius: 999, background: `${severityColor(activeReport.severity)}22`, color: severityColor(activeReport.severity), fontSize: 12 }, children: activeReport.severity })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#e2e8f0", fontSize: 14, marginBottom: 8 }, children: activeReport.type }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }, children: activeReport.reason }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: "\u0627\u0644\u0645\u0628\u0644\u0651\u063A" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#f8fafc", marginTop: 4 }, children: activeReport.reporter })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: "\u0627\u0644\u062B\u0642\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { color: "#f8fafc", marginTop: 4 }, children: [
                activeReport.score,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: "\u0627\u0644\u0645\u0633\u0627\u0631" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#f8fafc", marginTop: 4 }, children: activeReport.queue })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.04)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: "SLA" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { color: "#f8fafc", marginTop: 4 }, children: [
                activeReport.slaMinutes,
                " \u062F\u0642\u064A\u0642\u0629"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { variant: "success", loading: busyId === activeReport.id && activeReport.status !== "escalated", onClick: () => handleResolve(activeReport), children: "\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0628\u0644\u0627\u063A" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { variant: "danger", loading: busyId === activeReport.id && activeReport.status === "escalated", onClick: () => handleEscalate(activeReport), children: "\u062A\u0635\u0639\u064A\u062F \u0641\u0648\u0631\u064A" })
          ] })
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u0645\u0633\u0627\u0631" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { display: "grid", gap: 10 }, children: queueMix.map((item) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13, marginBottom: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: item.label }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: item.value })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { height: 10, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.12)" }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { width: `${item.value / Math.max(filteredReports.length, 1) * 100}%`, height: "100%", background: "linear-gradient(90deg,#38bdf8,#8b5cf6)" } }) })
        ] }, item.label)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "\u0623\u0639\u0644\u0649 \u0627\u0644\u0628\u0644\u0627\u063A\u0627\u062A \u0646\u0642\u0627\u0637\u064B\u0627" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { display: "grid", gap: 10 }, children: scoring.map((item) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "110px minmax(0,1fr) 56px", gap: 10, alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { style: { color: "#cbd5e1", fontSize: 12 }, children: item.label }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { height: 12, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.12)" }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { style: { width: `${item.value}%`, height: "100%", background: `linear-gradient(90deg, ${severityColor(item.severity)}, #38bdf8)` } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("strong", { style: { color: "#f8fafc", fontSize: 12 }, children: [
            item.value,
            "%"
          ] })
        ] }, item.id)) })
      ] })
    ] })
  ] }) });
}

// src/pages/admin/AdminAudit.jsx
init_define_import_meta_env();
var import_react9 = __toESM(require_react(), 1);
var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
var FALLBACK_LOGS = [
  {
    id: "AUD-2001",
    action: "approve_report",
    admin_name: "Super Admin",
    actor: "superadmin@yamsat.local",
    scope: "reports",
    severity: "info",
    summary: "\u0627\u0639\u062A\u0645\u0627\u062F \u0628\u0644\u0627\u063A \u0627\u0646\u062A\u062D\u0627\u0644 \u0634\u062E\u0635\u064A\u0629 \u0628\u0639\u062F \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0623\u062F\u0644\u0629.",
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
    summary: "\u062A\u0641\u0639\u064A\u0644 Shadow Ban \u0644\u062D\u0633\u0627\u0628 \u0639\u0627\u0644\u064A \u0627\u0644\u062E\u0637\u0648\u0631\u0629 \u0628\u0639\u062F \u0645\u0648\u062C\u0629 Spam.",
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
    summary: "\u062A\u0635\u062F\u064A\u0631 live metrics \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0646\u0645\u0648 \u062E\u0644\u0627\u0644 \u0622\u062E\u0631 24 \u0633\u0627\u0639\u0629.",
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
    summary: "\u062A\u0633\u062C\u064A\u0644 \u062E\u0631\u0648\u062C \u0625\u062C\u0628\u0627\u0631\u064A \u0644\u0639\u062F\u0629 \u062C\u0644\u0633\u0627\u062A \u0628\u0639\u062F \u0633\u0644\u0648\u0643 \u0645\u0634\u0628\u0648\u0647 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0628\u0635\u0645\u0629.",
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
    summary: item.summary || item.message || item.description || "\u0644\u0627 \u064A\u0648\u062C\u062F \u0648\u0635\u0641 \u0625\u0636\u0627\u0641\u064A.",
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
  const [logs, setLogs] = (0, import_react9.useState)([]);
  const [summary, setSummary] = (0, import_react9.useState)({ today: 0, critical: 0, exports: 0, security: 0 });
  const [filters, setFilters] = (0, import_react9.useState)({ search: "", scope: "all", severity: "all" });
  const [loading, setLoading] = (0, import_react9.useState)(true);
  const loadAuditLogs = (0, import_react9.useCallback)(async () => {
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
      pushToast({ type: "warning", title: "\u062A\u0645 \u062A\u0634\u063A\u064A\u0644 \u0633\u062C\u0644 \u0645\u062D\u0644\u064A", description: error?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062C\u0644\u0628 \u0633\u062C\u0644 \u0627\u0644\u0646\u0634\u0627\u0637 \u0645\u0646 \u0627\u0644\u0640 API." });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);
  (0, import_react9.useEffect)(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);
  (0, import_react9.useEffect)(() => {
    const onSocketLog = (payload) => {
      const [nextLog] = normalizeLogs([payload]);
      setLogs((prev) => [nextLog, ...prev].slice(0, 150));
    };
    socket_default.on("new_audit_log", onSocketLog);
    return () => socket_default.off("new_audit_log", onSocketLog);
  }, []);
  const filteredLogs = (0, import_react9.useMemo)(() => {
    const keyword = filters.search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesKeyword = !keyword || [log.id, log.action, log.admin_name, log.actor, log.summary, log.entity].join(" ").toLowerCase().includes(keyword);
      const matchesScope = filters.scope === "all" || log.scope === filters.scope;
      const matchesSeverity = filters.severity === "all" || log.severity === filters.severity;
      return matchesKeyword && matchesScope && matchesSeverity;
    });
  }, [filters, logs]);
  const scopes = (0, import_react9.useMemo)(() => Array.from(new Set(logs.map((item) => item.scope))), [logs]);
  const breakdown = (0, import_react9.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    filteredLogs.forEach((log) => map.set(log.scope, (map.get(log.scope) || 0) + 1));
    return Array.from(map.entries());
  }, [filteredLogs]);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { style: { display: "grid", gap: 18 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Card, { style: { padding: 20 }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#60a5fa", fontSize: 13, marginBottom: 8 }, children: "Admin Activity Log \u2022 Tracking \u2022 Audit System" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h2", { style: { margin: 0, color: "#f8fafc" }, children: "\u0633\u062C\u0644 \u0646\u0634\u0627\u0637 \u0627\u0644\u0623\u062F\u0645\u0646" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { style: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 760 }, children: "\u0634\u0627\u0634\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u062A\u062A\u0628\u0639 \u0643\u0644 \u062D\u0631\u0643\u0629 \u0625\u062F\u0627\u0631\u064A\u0629 \u0645\u0639 \u0641\u0644\u062A\u0631\u0629 \u062D\u0633\u0628 \u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u062E\u0637\u0648\u0631\u0629\u060C \u0648\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0648\u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0623\u0645\u0646\u064A." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Button, { variant: "secondary", onClick: loadAuditLogs, loading, children: "\u062A\u062D\u062F\u064A\u062B" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Button, { onClick: () => pushToast({ type: "info", title: "Audit export queued", description: "\u062C\u0627\u0647\u0632 \u0644\u0631\u0628\u0637 \u0627\u0644\u062A\u0635\u062F\u064A\u0631 \u0645\u0639 \u0627\u0644\u0640 backend." }), children: "\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0633\u062C\u0644" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("section", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }, children: [
      { label: "\u0625\u062C\u0645\u0627\u0644\u064A \u0623\u062D\u062F\u0627\u062B \u0627\u0644\u064A\u0648\u0645", value: summary.today, hint: "\u0643\u0644 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u062E\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629" },
      { label: "\u062D\u0648\u0627\u062F\u062B \u062D\u0631\u062C\u0629", value: summary.critical, hint: "\u062A\u062D\u062A\u0627\u062C \u0645\u0631\u0627\u062C\u0639\u0629 \u0623\u0645\u0646\u064A\u0629 \u0623\u0648 \u0625\u062F\u0627\u0631\u064A\u0629" },
      { label: "\u0639\u0645\u0644\u064A\u0627\u062A \u062A\u0635\u062F\u064A\u0631", value: summary.exports, hint: "\u0633\u062D\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0623\u0648 \u0644\u0648\u062D\u0627\u062A \u0645\u062A\u0627\u0628\u0639\u0629" },
      { label: "\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0623\u0645\u0646", value: summary.security, hint: "\u062C\u0644\u0633\u0627\u062A\u060C IP\u060C \u0648\u062A\u062F\u062E\u0644\u0627\u062A \u062D\u0645\u0627\u064A\u0629" }
    ].map((item) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(Card, { style: { padding: 18, background: "rgba(15,23,42,0.78)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#94a3b8", fontSize: 12 }, children: item.label }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#f8fafc", fontSize: 28, fontWeight: 800, margin: "10px 0 8px" }, children: item.value }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: item.hint })
    ] }, item.label)) }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("section", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.8fr)", gap: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(Card, { style: { padding: 18 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Input, { label: "\u0628\u062D\u062B", value: filters.search, onChange: (event) => setFilters((prev) => ({ ...prev, search: event.target.value })), placeholder: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621 / \u0627\u0644\u0625\u062F\u0645\u0646 / \u0627\u0644\u0643\u064A\u0627\u0646" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: "field select-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "field-label", children: "\u0627\u0644\u0646\u0637\u0627\u0642" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("select", { className: "input", value: filters.scope, onChange: (event) => setFilters((prev) => ({ ...prev, scope: event.target.value })), children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "all", children: "\u0627\u0644\u0643\u0644" }),
              scopes.map((scope) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: scope, children: scope }, scope))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: "field select-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "field-label", children: "\u0627\u0644\u062E\u0637\u0648\u0631\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("select", { className: "input", value: filters.severity, onChange: (event) => setFilters((prev) => ({ ...prev, severity: event.target.value })), children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "all", children: "\u0627\u0644\u0643\u0644" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "info", children: "info" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "warning", children: "warning" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "critical", children: "critical" }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("option", { value: "success", children: "success" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "grid", gap: 12 }, children: [
          filteredLogs.map((log) => {
            const tone = severityTone(log.severity);
            return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("strong", { style: { color: "#f8fafc" }, children: log.action }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { style: { padding: "4px 10px", borderRadius: 999, background: tone.bg, color: tone.color, fontSize: 12 }, children: log.severity }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { style: { padding: "4px 10px", borderRadius: 999, background: "rgba(148,163,184,0.14)", color: "#cbd5e1", fontSize: 12 }, children: log.scope })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: new Date(log.timestamp).toLocaleString("ar-EG") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { marginTop: 10, color: "#e2e8f0", fontSize: 14 }, children: log.summary }),
              /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: "\u0627\u0644\u0625\u062F\u0645\u0646" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#f8fafc", marginTop: 4 }, children: log.admin_name }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#94a3b8", fontSize: 12 }, children: log.actor })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: "\u0627\u0644\u0643\u064A\u0627\u0646" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#f8fafc", marginTop: 4 }, children: log.entity })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#64748b", fontSize: 12 }, children: "IP" }),
                  /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#f8fafc", marginTop: 4 }, children: log.ip_address })
                ] })
              ] })
            ] }, log.id);
          }),
          !filteredLogs.length ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#94a3b8", textAlign: "center", padding: 30 }, children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u062A\u0627\u0626\u062C \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u0623\u062F\u0645\u0646." }) : null
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(Card, { style: { padding: 18, display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { style: { marginTop: 0, color: "#f8fafc" }, children: "Tracking summary" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { color: "#94a3b8", fontSize: 13, marginTop: 6 }, children: "\u062A\u0641\u0635\u064A\u0644 \u0627\u0644\u0646\u0634\u0627\u0637 \u062D\u0633\u0628 \u0643\u0644 \u0646\u0637\u0627\u0642 \u0625\u062F\u0627\u0631\u064A." })
        ] }),
        breakdown.map(([scope, count]) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13, marginBottom: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: scope }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("strong", { children: count })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { height: 10, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.12)" }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { style: { width: `${count / Math.max(filteredLogs.length, 1) * 100}%`, height: "100%", background: "linear-gradient(90deg,#22d3ee,#8b5cf6)" } }) })
        ] }, scope)),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { style: { borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.78)", border: "1px solid rgba(148,163,184,0.12)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h4", { style: { marginTop: 0, color: "#f8fafc" }, children: "Audit system notes" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("ul", { style: { margin: 0, paddingInlineStart: 18, color: "#cbd5e1", lineHeight: 1.9, fontSize: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("li", { children: "\u0641\u0644\u062A\u0631\u0629 \u062D\u0633\u0628 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u062E\u0637\u0648\u0631\u0629 \u0648\u0627\u0644\u0646\u0637\u0627\u0642." }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("li", { children: "\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0645\u0628\u0627\u0634\u0631 \u0639\u0628\u0631 socket \u0644\u0633\u062C\u0644\u0627\u062A audit \u0627\u0644\u062C\u062F\u064A\u062F\u0629." }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("li", { children: "\u0645\u0646\u0627\u0633\u0628 \u0644\u062A\u062A\u0628\u0639 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631." }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("li", { children: "\u0642\u0627\u0628\u0644 \u0644\u0644\u0631\u0628\u0637 \u0645\u0639 \u0627\u0644\u062A\u0635\u062F\u064A\u0631 \u0648SIEM \u0644\u0627\u062D\u0642\u064B\u0627 \u0628\u062F\u0648\u0646 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0648\u0627\u062C\u0647\u0629." })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}

// src/pages/admin/AdminSettings.jsx
init_define_import_meta_env();
var import_react10 = __toESM(require_react(), 1);
var import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
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
  const [general, setGeneral] = (0, import_react10.useState)(defaultGeneral);
  const [lastLoadedGeneral, setLastLoadedGeneral] = (0, import_react10.useState)(defaultGeneral);
  const [passwordForm, setPasswordForm] = (0, import_react10.useState)({ current_password: "", new_password: "" });
  const [loading, setLoading] = (0, import_react10.useState)(true);
  const [error, setError] = (0, import_react10.useState)("");
  const [savingGeneral, setSavingGeneral] = (0, import_react10.useState)(false);
  const [changingPassword, setChangingPassword] = (0, import_react10.useState)(false);
  const { pushToast } = useToast();
  const hasSettingsData = Boolean(general.platform_name || general.support_email || general.session_timeout_minutes || general.theme || general.locale);
  const settingsChecklist = (0, import_react10.useMemo)(() => [
    { key: "platform", label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0635\u0629", value: general.platform_name || "\u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637 \u0628\u0639\u062F" },
    { key: "support", label: "\u0628\u0631\u064A\u062F \u0627\u0644\u062F\u0639\u0645", value: general.support_email || "\u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637 \u0628\u0639\u062F" },
    { key: "registration", label: "\u0627\u0644\u062A\u0633\u062C\u064A\u0644", value: general.allow_registration ? "\u0645\u0641\u062A\u0648\u062D" : "\u0645\u063A\u0644\u0642" },
    { key: "maintenance", label: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629", value: general.maintenance_mode ? "\u0645\u0641\u0639\u0651\u0644\u0629" : "\u0645\u062A\u0648\u0642\u0641\u0629" },
    { key: "push", label: "Push Notifications", value: general.notifications?.push_enabled ? "\u0645\u0641\u0639\u0644\u0629" : "\u0645\u063A\u0644\u0642\u0629" },
    { key: "grouped", label: "Grouped Notifications", value: general.notifications?.grouped_notifications ? "\u0645\u0641\u0639\u0644\u0629" : "\u0645\u063A\u0644\u0642\u0629" }
  ], [general]);
  const loadSettings = async (showToast = false) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getAdminSettings();
      const normalized = normalizeSettingsPayload(data);
      setGeneral(normalized);
      setLastLoadedGeneral(normalized);
      if (showToast) pushToast({ title: "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644", description: "\u062A\u0645 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0622\u062E\u0631 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u062D\u0641\u0648\u0638\u0629 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645.", type: "success" });
    } catch (err) {
      setError(err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u062D\u0627\u0644\u064A\u0627\u064B.");
    } finally {
      setLoading(false);
    }
  };
  (0, import_react10.useEffect)(() => {
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
      pushToast({ title: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", description: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0648\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0628\u0646\u062C\u0627\u062D.", type: "success" });
    } catch (err) {
      const message = err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u062D\u0627\u0644\u064A\u0627\u064B.";
      setError(message);
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062D\u0641\u0638", description: message, type: "error" });
    } finally {
      setSavingGeneral(false);
    }
  };
  const handleResetSettings = async () => {
    await loadSettings(true);
  };
  const handleChangePassword = async () => {
    if (!passwordForm.current_password.trim() || !passwordForm.new_password.trim()) {
      setError("\u0627\u0643\u062A\u0628 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0642\u0628\u0644 \u0627\u0644\u062A\u0646\u0641\u064A\u0630.");
      return;
    }
    setChangingPassword(true);
    setError("");
    try {
      await changeAdminPassword(passwordForm);
      pushToast({ title: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", description: "\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u062D\u0627\u0644\u064A.", type: "success" });
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (err) {
      const message = err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u062D\u0627\u0644\u064A\u0627\u064B.";
      setError(message);
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u062F\u064A\u062B", description: message, type: "error" });
    } finally {
      setChangingPassword(false);
    }
  };
  if (loading && !hasSettingsData) {
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(AdminOverviewSkeleton, {}) });
  }
  if (error && !hasSettingsData) {
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ErrorState, { title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", description: error, onRetry: loadSettings }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(AdminLayout, { children: [
    error ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "alert error", children: error }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(Card, { className: "hero-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "badge", children: "System Preferences" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { children: "\u062A\u0648\u062D\u064A\u062F \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629 \u0648\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "muted", children: "\u062A\u0645 \u0631\u0628\u0637 \u0627\u0644\u062D\u0641\u0638 \u0648\u0627\u0644\u0640 reset \u0645\u0639 \u0627\u0644\u0640 API \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u060C \u0645\u0639 \u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0648 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u062A\u063A\u064A\u0631\u062A \u0645\u0646 \u062C\u0644\u0633\u0629 \u0623\u062F\u0645\u0646 \u062A\u0627\u0646\u064A\u0629." }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "action-row wide", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { loading: savingGeneral, disabled: savingGeneral, onClick: handleSaveSettings, children: "\u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { variant: "secondary", loading, disabled: loading, onClick: handleResetSettings, children: loading ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639..." : "Reset / \u0625\u0639\u0627\u062F\u0629 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "card-head split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { className: "section-title", children: "\u062C\u0627\u0647\u0632\u064A\u0629 \u0627\u0644\u062A\u0643\u0648\u064A\u0646" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { className: "badge", children: [
            settingsChecklist.filter((item) => !String(item.value).includes("\u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637")).length,
            "/",
            settingsChecklist.length
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "queue-grid compact-cards", children: settingsChecklist.map((item) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "queue-card compact", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "queue-label", children: item.label }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("strong", { children: item.value }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: "\u0645\u0624\u0634\u0631 \u0633\u0631\u064A\u0639 \u0639\u0644\u0649 \u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629." })
        ] }, item.key)) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "two-column-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "card-head", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { className: "section-title", children: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629" }) }),
        !hasSettingsData ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          EmptyState,
          {
            icon: "\u2699\uFE0F",
            title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u064F\u062D\u0645\u0651\u0644\u0629 \u0628\u0639\u062F",
            description: "\u064A\u0645\u0643\u0646\u0643 \u0633\u062D\u0628 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u062F\u0621 \u0628\u0645\u0644\u0621 \u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u062B\u0645 \u0627\u0644\u062D\u0641\u0638.",
            actionLabel: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644",
            onAction: loadSettings
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "modal-stack", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Input, { label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0635\u0629", value: general.platform_name, onChange: (event) => setGeneral((prev) => ({ ...prev, platform_name: event.target.value })) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Input, { label: "\u0628\u0631\u064A\u062F \u0627\u0644\u062F\u0639\u0645", value: general.support_email, onChange: (event) => setGeneral((prev) => ({ ...prev, support_email: event.target.value })) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "filters-row wrap", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "field select-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "field-label", children: "\u0627\u0644\u062F\u0648\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A" }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("select", { className: "input", value: general.default_user_role, onChange: (event) => setGeneral((prev) => ({ ...prev, default_user_role: event.target.value })), children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "user", children: "\u0645\u0633\u062A\u062E\u062F\u0645" }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "moderator", children: "\u0645\u0634\u0631\u0641" }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "admin", children: "\u0623\u062F\u0645\u0646" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Input, { label: "\u0645\u0647\u0644\u0629 \u0627\u0644\u062C\u0644\u0633\u0629 \u0628\u0627\u0644\u062F\u0642\u0627\u0626\u0642", type: "number", value: general.session_timeout_minutes, onChange: (event) => setGeneral((prev) => ({ ...prev, session_timeout_minutes: Number(event.target.value) || 0 })) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "filters-row wrap", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "field select-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "field-label", children: "\u0627\u0644\u062B\u064A\u0645" }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("select", { className: "input", value: general.theme, onChange: (event) => setGeneral((prev) => ({ ...prev, theme: event.target.value })), children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "midnight", children: "Midnight" }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "aurora", children: "Aurora" }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "graphite", children: "Graphite" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "field select-field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "field-label", children: "\u0627\u0644\u0644\u063A\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("select", { className: "input", value: general.locale, onChange: (event) => setGeneral((prev) => ({ ...prev, locale: event.target.value })), children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "ar-EG", children: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "en-US", children: "English" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "filters-row wrap", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "checkbox", checked: general.maintenance_mode, onChange: (event) => setGeneral((prev) => ({ ...prev, maintenance_mode: event.target.checked })) }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: "\u0648\u0636\u0639 \u0627\u0644\u0635\u064A\u0627\u0646\u0629" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "checkbox", checked: general.allow_registration, onChange: (event) => setGeneral((prev) => ({ ...prev, allow_registration: event.target.checked })) }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: "\u0627\u0644\u0633\u0645\u0627\u062D \u0628\u0627\u0644\u062A\u0633\u062C\u064A\u0644" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { loading: savingGeneral, disabled: savingGeneral, onClick: handleSaveSettings, children: "\u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "card-head", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { className: "section-title", children: "Notification Settings" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "modal-stack", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "queue-grid compact-cards", children: [
            ["push_enabled", "Push Notifications"],
            ["browser_enabled", "Browser Notifications"],
            ["mobile_enabled", "Mobile Notifications"],
            ["smart_notifications", "Smart Notifications"],
            ["grouped_notifications", "Grouped Notifications"],
            ["silent_notifications", "Silent Notifications"],
            ["realtime_notifications", "Real-time Notifications"]
          ].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "queue-card compact", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "queue-label", children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("strong", { children: general.notifications?.[key] ? "\u0645\u0641\u0639\u0651\u0644" : "\u0645\u062A\u0648\u0642\u0641" }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "checkbox", checked: Boolean(general.notifications?.[key]), onChange: (event) => updateNotificationSetting(key, event.target.checked) }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: "\u062A\u0628\u062F\u064A\u0644" })
            ] })
          ] }, key)) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "field select-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "field-label", children: "Notification Sounds" }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("select", { className: "input", value: general.notifications?.sound || "classic", onChange: (event) => updateNotificationSetting("sound", event.target.value), children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "classic", children: "Classic Bell" }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "pulse", children: "Pulse Ping" }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "soft", children: "Soft Chime" }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("option", { value: "silent", children: "Silent Mode" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "queue-grid compact-cards", children: Object.entries(general.notifications?.categories || {}).map(([key, enabled]) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "queue-card compact", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "queue-label", children: key }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("strong", { children: enabled ? "\u0645\u0641\u0639\u0651\u0644" : "\u0645\u062A\u0648\u0642\u0641" }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: "checkbox-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("input", { type: "checkbox", checked: Boolean(enabled), onChange: () => toggleCategory(key) }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { children: "Toggle Category" })
            ] })
          ] }, key)) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { loading: savingGeneral, disabled: savingGeneral, onClick: handleSaveSettings, children: "\u062D\u0641\u0638 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "two-column-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "card-head", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { className: "section-title", children: "\u0627\u0644\u0623\u0645\u0627\u0646 \u0648\u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u064A" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "modal-stack", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Input, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629", type: "password", value: passwordForm.current_password, onChange: (event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value })) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Input, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629", type: "password", value: passwordForm.new_password, onChange: (event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value })) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { variant: "secondary", loading: changingPassword, disabled: changingPassword, onClick: handleChangePassword, children: "\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "card-head", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h3", { className: "section-title", children: "\u0627\u0644\u0623\u062F\u0645\u0646 \u0627\u0644\u0623\u0633\u0627\u0633\u064A" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "dropzone-hint admin-access-help", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("strong", { children: "\u062F\u062E\u0648\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u0623\u062F\u0645\u0646" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "muted no-margin", children: "\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0623\u0633\u0627\u0633\u064A: /admin/login" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "muted no-margin", children: "\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A: /admin.html" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: "muted no-margin", children: [
            "\u0644\u0627\u0632\u0645 \u0627\u0644\u062F\u062E\u0648\u0644 \u064A\u062A\u0645 \u0628\u0646\u0641\u0633 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0623\u0633\u0627\u0633\u064A: ",
            PRIMARY_ADMIN_EMAIL
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: "muted no-margin", children: [
            "\u0622\u062E\u0631 \u0646\u0633\u062E\u0629 \u0645\u062D\u0645\u0644\u0629 \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645: ",
            lastLoadedGeneral.platform_name || "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629 \u062D\u0627\u0644\u064A\u0627\u064B"
          ] })
        ] })
      ] })
    ] })
  ] });
}

// src/pages/admin/AdminRbac.jsx
init_define_import_meta_env();
var import_react11 = __toESM(require_react(), 1);
var import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
var defaultRbac = { current_role: "", current_permissions: [], roles: [] };
function AdminRbac() {
  const [rbac, setRbac] = (0, import_react11.useState)(defaultRbac);
  const [users, setUsers] = (0, import_react11.useState)([]);
  const [search, setSearch] = (0, import_react11.useState)("");
  const [loading, setLoading] = (0, import_react11.useState)(true);
  const [userLoading, setUserLoading] = (0, import_react11.useState)(true);
  const [error, setError] = (0, import_react11.useState)("");
  const [actionBusyKey, setActionBusyKey] = (0, import_react11.useState)("");
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
      setError(err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u062D\u0627\u0644\u064A\u0627\u064B.");
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
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646", description: err?.response?.data?.detail || "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.", type: "error" });
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  };
  (0, import_react11.useEffect)(() => {
    loadRbac();
  }, []);
  (0, import_react11.useEffect)(() => {
    loadUsers();
  }, [debouncedSearch]);
  (0, import_react11.useEffect)(() => {
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
  const roleMap = (0, import_react11.useMemo)(() => Object.fromEntries((rbac.roles || []).map((role) => [role.role, role])), [rbac.roles]);
  const handleAssignRole = async (user, role) => {
    try {
      setActionBusyKey(`${user.id}-${role}`);
      await updateAdminUser(user.id, { role });
      pushToast({ title: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062F\u0648\u0631", description: `${user.username} \u2192 ${role}`, type: "success" });
      await Promise.all([loadUsers(), loadRbac()]);
    } catch (error2) {
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062F\u0648\u0631", description: error2?.response?.data?.detail || "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.", type: "error" });
    } finally {
      setActionBusyKey("");
    }
  };
  if (loading && !hasRbacData) {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AdminOverviewSkeleton, {}) });
  }
  if (error && !hasRbacData) {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ErrorState, { title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0623\u062F\u0648\u0627\u0631", description: error, onRetry: loadRbac }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(AdminLayout, { children: [
    error ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "alert error", children: error }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Card, { className: "hero-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "badge", children: "RBAC" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h2", { children: "\u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u0631" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "muted", children: "\u062A\u0645 \u0631\u0628\u0637 \u0627\u0644\u0635\u0641\u062D\u0629 \u0628\u0648\u0627\u062C\u0647\u0629 RBAC \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0648\u0625\u0636\u0627\u0641\u0629 Assign / Remove Role \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0645\u0639 \u062A\u062D\u062F\u064A\u062B \u062D\u064A \u0641\u0648\u0631 \u0627\u0644\u062A\u0646\u0641\u064A\u0630." }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "action-row wide", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Button, { loading, disabled: loading, onClick: loadRbac, children: "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Button, { variant: "secondary", loading: userLoading, disabled: userLoading, onClick: loadUsers, children: "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "badge", children: "Current Role" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h2", { children: rbac.current_role || "\u2014" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "muted", children: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u062F\u0627\u062E\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645." })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("section", { className: "two-column-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "card-head", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h3", { className: "section-title", children: "Current Permissions" }) }),
        (rbac.current_permissions || []).length ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "badge-wrap", children: (rbac.current_permissions || []).map((permission) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "glass-chip", children: permission }, permission)) }) : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(EmptyState, { icon: "\u{1F510}", title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0645\u0631\u062A\u0628\u0637\u0629 \u0628\u0627\u0644\u062D\u0633\u0627\u0628", description: "\u0642\u062F \u064A\u0643\u0648\u0646 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u062D\u062F\u0648\u062F \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0623\u0648 \u0644\u0645 \u062A\u0635\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 \u0628\u0639\u062F.", actionLabel: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644", onAction: loadRbac })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "card-head", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h3", { className: "section-title", children: "\u0645\u0644\u062E\u0635 \u0627\u0644\u0623\u062F\u0648\u0627\u0631" }) }),
        (rbac.roles || []).length ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "queue-grid compact-cards", children: (rbac.roles || []).map((role) => /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "queue-card compact", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "queue-label", children: role.label || role.role }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("strong", { children: [
            role.permissions?.length || 0,
            " \u0635\u0644\u0627\u062D\u064A\u0629"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: (role.permissions || []).slice(0, 3).join(" \u2022 ") || "\u0628\u062F\u0648\u0646 \u0635\u0644\u0627\u062D\u064A\u0627\u062A" })
        ] }, role.role)) }) : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(EmptyState, { icon: "\u{1F9E9}", title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u062F\u0648\u0627\u0631 \u0645\u0639\u0631\u0641\u0629 \u0628\u0639\u062F", description: "\u0633\u064A\u062A\u0645 \u0639\u0631\u0636 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0647\u0646\u0627 \u0628\u0645\u062C\u0631\u062F \u0631\u062C\u0648\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0635\u0641\u0648\u0641\u0629 \u0645\u0646 \u0627\u0644\u0628\u0627\u0643 \u0625\u0646\u062F." })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Card, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "card-head", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h3", { className: "section-title", children: "Roles & Permissions Matrix" }) }),
      (rbac.roles || []).length ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "rbac-grid role-grid", children: (rbac.roles || []).map((role) => /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "permission-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: role.label || role.role }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "badge-wrap compact", children: (role.permissions || []).map((permission) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "role-pill neutral", children: permission }, permission)) })
      ] }, role.role)) }) : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(EmptyState, { icon: "\u{1F4DA}", title: "\u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0641\u0627\u0631\u063A\u0629", description: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0641\u0648\u0641 \u0644\u0639\u0631\u0636 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u062D\u0627\u0644\u064A\u0627\u064B.", actionLabel: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644", onAction: loadRbac })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(Card, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "card-head split", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h3", { className: "section-title", children: "Assign / Remove Role" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "muted no-margin", children: "\u062A\u0639\u062F\u064A\u0644 \u0645\u0628\u0627\u0634\u0631 \u0644\u062F\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0639 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0641\u0648\u0631\u0627\u064B \u0628\u0639\u062F \u0646\u062C\u0627\u062D \u0627\u0644\u0639\u0645\u0644\u064A\u0629." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Input, { label: "\u0628\u062D\u062B \u0645\u0633\u062A\u062E\u062F\u0645", value: search, onChange: (event) => setSearch(event.target.value), placeholder: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F" })
      ] }),
      userLoading ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AdminOverviewSkeleton, {}) : null,
      !userLoading && users.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(EmptyState, { icon: "\u{1F464}", title: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0645\u0637\u0627\u0628\u0642\u0648\u0646", description: "\u062C\u0631\u0651\u0628 \u0628\u062D\u062B \u0645\u062E\u062A\u0644\u0641 \u0623\u0648 \u0623\u0639\u062F \u0627\u0644\u062A\u062D\u0645\u064A\u0644.", actionLabel: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644", onAction: loadUsers }) : null,
      !userLoading && users.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("table", { className: "admin-table", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("th", { children: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("th", { children: "\u0627\u0644\u062F\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("th", { children: "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u062F\u0648\u0631" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("th", { children: "Assign Role" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("th", { children: "Remove Role" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("tbody", { children: users.map((user) => {
          const permissions = roleMap[user.role]?.permissions || [];
          return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("td", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: user.username }),
              /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("small", { children: user.email })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: `role-pill ${user.role}`, children: user.role }) }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "badge-wrap compact", children: permissions.length ? permissions.slice(0, 4).map((permission) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "glass-chip", children: permission }, permission)) : /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "muted", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0644\u0627\u062D\u064A\u0627\u062A" }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "hero-actions-wrap", children: ["admin", "moderator", "user"].map((role) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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

// src/pages/admin/AdminChat.jsx
init_define_import_meta_env();
var import_react12 = __toESM(require_react(), 1);
var import_jsx_runtime15 = __toESM(require_jsx_runtime(), 1);
function AdminChat() {
  const [threads, setThreads] = (0, import_react12.useState)([]);
  const [activeThread, setActiveThread] = (0, import_react12.useState)(null);
  const [messages, setMessages] = (0, import_react12.useState)([]);
  const [loading, setLoading] = (0, import_react12.useState)(true);
  const { pushToast } = useToast();
  const loadThreads = async () => {
    try {
      const { data } = await getChatThreads();
      setThreads(data || []);
    } finally {
      setLoading(false);
    }
  };
  (0, import_react12.useEffect)(() => {
    loadThreads();
    socket_default.on("abuse_detected", (payload) => {
      pushToast({ title: "Abuse Detected", description: `In chat with ${payload.user}`, type: "warning" });
      loadThreads();
    });
    return () => socket_default.off("abuse_detected");
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
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(AdminLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "admin-chat-layout", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("aside", { className: "chat-sidebar", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Card, { title: "Active Conversations", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "thread-list", children: threads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
      "div",
      {
        className: `thread-item ${activeThread?.id === thread.id ? "active" : ""} ${thread.flagged ? "flagged" : ""}`,
        onClick: () => {
          setActiveThread(thread);
          loadMessages(thread.id);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "thread-meta", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { children: thread.username }),
            thread.abuse_score > 50 && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "abuse-indicator", children: "!" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("p", { className: "last-msg", children: [
            thread.last_message?.slice(0, 30),
            "..."
          ] })
        ]
      },
      thread.id
    )) }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("main", { className: "chat-monitor-area", children: activeThread ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Card, { title: `Monitoring: ${activeThread.username}`, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "messages-scroller", children: messages.map((msg) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: `msg-bubble ${msg.deleted ? "deleted" : ""}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "msg-content", children: [
        msg.type === "media" ? /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "media-placeholder", children: [
          "[Media Moderation Pending]",
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: "text-link", onClick: () => window.open(msg.media_url), children: "View Original" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { children: msg.content }),
        msg.deleted && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { className: "restore-btn", onClick: () => handleRestore(msg.id), children: "Restore Message" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "msg-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: new Date(msg.created_at).toLocaleTimeString() }),
        msg.ai_score && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: "ai-score", children: [
          "AI: ",
          msg.ai_score,
          "%"
        ] })
      ] })
    ] }, msg.id)) }) }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "chat-empty-state", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h3", { children: "Select a conversation to monitor" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { children: "Real-time abuse detection and media moderation are active." })
    ] }) })
  ] }) });
}

// src/pages/admin/AdminStories.jsx
init_define_import_meta_env();
var import_react13 = __toESM(require_react(), 1);
var import_jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
function isVideo(value) {
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
    type: isVideo(item?.media_url || item?.media) ? "video" : "image"
  };
}
function formatDate(value) {
  if (!value) return "\u2014";
  try {
    return new Date(value).toLocaleString("ar-EG");
  } catch {
    return "\u2014";
  }
}
function AdminStories() {
  const [stories, setStories] = (0, import_react13.useState)([]);
  const [archive, setArchive] = (0, import_react13.useState)([]);
  const [highlights, setHighlights] = (0, import_react13.useState)([]);
  const [analytics, setAnalytics] = (0, import_react13.useState)(null);
  const [loading, setLoading] = (0, import_react13.useState)(true);
  const [error, setError] = (0, import_react13.useState)("");
  const [activeStoryId, setActiveStoryId] = (0, import_react13.useState)("");
  const [storyModalOpen, setStoryModalOpen] = (0, import_react13.useState)(false);
  const [togglingHighlight, setTogglingHighlight] = (0, import_react13.useState)(false);
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
      setError(err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0642\u0635\u0635 \u0627\u0644\u062D\u064A\u0629.");
      setStories([]);
      setArchive([]);
      setHighlights([]);
      setAnalytics(null);
      setActiveStoryId("");
    } finally {
      setLoading(false);
    }
  };
  (0, import_react13.useEffect)(() => {
    load({ preserveActive: false });
  }, []);
  const activeIndex = (0, import_react13.useMemo)(() => stories.findIndex((story) => String(story.id) === String(activeStoryId)), [stories, activeStoryId]);
  const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;
  (0, import_react13.useEffect)(() => {
    if (!storyModalOpen || !activeStory) return;
    viewStory(activeStory.id).catch(() => null);
  }, [activeStory, storyModalOpen]);
  const stats = (0, import_react13.useMemo)(() => [
    { label: "\u0627\u0644\u0642\u0635\u0635 \u0627\u0644\u062D\u0627\u0644\u064A\u0629", value: analytics?.stories_count ?? stories.length },
    { label: "Highlights", value: analytics?.highlights_count ?? highlights.length },
    { label: "\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A", value: analytics?.total_views ?? stories.reduce((sum, item) => sum + item.views_count, 0) },
    { label: "\u0627\u0644\u0631\u062F\u0648\u062F", value: analytics?.total_replies ?? stories.reduce((sum, item) => sum + item.replies_count, 0) }
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
      pushToast({ title: activeStory.highlight ? "\u062A\u0645\u062A \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0647\u0627\u064A\u0644\u0627\u064A\u062A" : "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0647\u0627\u064A\u0644\u0627\u064A\u062A", description: `@${activeStory.username}`, type: "success" });
    } catch (err) {
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0647\u0627\u064A\u0644\u0627\u064A\u062A", description: err?.response?.data?.detail || "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u062A\u0627\u0646\u064A\u0629.", type: "error" });
    } finally {
      setTogglingHighlight(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(AdminLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "card-head split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h3", { className: "section-title", children: "Stories Control" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "muted", children: "\u0627\u0644\u062A\u0627\u0644\u064A/\u0627\u0644\u0633\u0627\u0628\u0642 \u0648\u0627\u0644\u0640 Story Modal \u0628\u0642\u0648\u0627 \u0645\u0631\u0628\u0648\u0637\u064A\u0646 \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0627\u0644\u0640 backend \u0648\u0628\u064A\u0639\u0631\u0636\u0648\u0627 \u0627\u0644\u0648\u0633\u0627\u0626\u0637 \u0627\u0644\u0641\u0639\u0644\u064A\u0629." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Button, { variant: "secondary", onClick: () => load(), loading, children: loading ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u062F\u064A\u062B..." : "\u062A\u062D\u062F\u064A\u062B" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "status-list compact-grid", children: stats.map((item) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: item.value }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: item.label })
        ] }, item.label)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "queue-grid compact-cards", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "queue-card compact admin-tone-violet", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "queue-label", children: "\u0623\u0641\u0636\u0644 \u0642\u0635\u0629 \u0627\u0644\u0622\u0646" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: stories[0]?.username || "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: stories[0]?.caption || "\u0647\u062A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0623\u0639\u0644\u0649 \u0642\u0635\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0627\u0644\u0640 API." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "queue-card compact admin-tone-amber", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "queue-label", children: "\u0627\u0644\u0623\u0631\u0634\u064A\u0641" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: archive.length }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: "\u0622\u062E\u0631 \u0627\u0644\u0642\u0635\u0635 \u0627\u0644\u0645\u0624\u0631\u0634\u0641\u0629 \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u062D\u0627\u0644\u064A." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "queue-card compact admin-tone-blue", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "queue-label", children: "Highlights" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: highlights.length }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: "\u0642\u0635\u0635 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u0644\u0639\u0631\u0636 \u0627\u0644\u0637\u0648\u064A\u0644 \u062F\u0627\u062E\u0644 \u0627\u0644\u0648\u0627\u062C\u0647\u0629." })
        ] })
      ] }) })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(ErrorState, { title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0633\u062A\u0648\u0631\u064A", description: error, onRetry: () => load({ preserveActive: false }) }) : null,
    loading ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(ListSkeleton, { count: 6 }) : null,
    !loading && stories.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(EmptyState, { icon: "\u{1F39E}\uFE0F", title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0642\u0635\u0635 \u0645\u0646\u0634\u0648\u0631\u0629 \u0627\u0644\u0622\u0646", description: "\u0639\u0646\u062F \u0648\u0635\u0648\u0644 \u0642\u0635\u0635 \u062C\u062F\u064A\u062F\u0629 \u0645\u0646 \u0627\u0644\u0640 backend \u0647\u062A\u0638\u0647\u0631 \u0647\u0646\u0627 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.", actionLabel: "\u062A\u062D\u062F\u064A\u062B", onAction: () => load({ preserveActive: false }) }) : null,
    !loading && stories.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: "admin-deep-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(Card, { className: "admin-rich-table-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "card-head split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h3", { className: "section-title", children: "\u0627\u0644\u0642\u0635\u0635 \u0627\u0644\u062D\u064A\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "muted no-margin", children: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0623\u064A \u0642\u0635\u0629 \u0644\u0641\u062A\u062D \u0627\u0644\u0640 modal \u0648\u0627\u0644\u062A\u0646\u0642\u0644 \u0628\u064A\u0646 \u0627\u0644\u0642\u0635\u0635 \u0627\u0644\u0641\u0639\u0644\u064A\u0629." })
          ] }),
          activeStory ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Button, { onClick: () => openStory(activeStory.id), children: "\u0641\u062A\u062D \u0627\u0644\u0642\u0635\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629" }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "table-shell admin-rich-table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("table", { className: "admin-table admin-rich-table", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "\u0627\u0644\u0646\u0627\u0634\u0631" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "\u0627\u0644\u0645\u062D\u062A\u0648\u0649" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "\u0627\u0644\u0631\u062F\u0648\u062F" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "\u0627\u0644\u0646\u0648\u0639" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "\u064A\u0646\u062A\u0647\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "\u0625\u062C\u0631\u0627\u0621" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("tbody", { children: stories.map((story) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "admin-rich-user-cell", children: [
              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "admin-module-avatar", children: story.username.slice(0, 1).toUpperCase() }),
              /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: story.username }),
                /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("small", { children: story.privacy })
              ] })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "content-cell compact", children: [
              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: story.caption || "\u0628\u062F\u0648\u0646 \u0643\u0627\u0628\u0634\u0646" }),
              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("small", { children: story.music || story.filter_name || "\u0628\u062F\u0648\u0646 \u0645\u064A\u062A\u0627\u062F\u0627\u062A\u0627 \u0625\u0636\u0627\u0641\u064A\u0629" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: story.views_count }) }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: story.replies_count }) }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: `status-pill ${story.type === "video" ? "warning-soft" : "active"}`, children: story.type === "video" ? "\u0641\u064A\u062F\u064A\u0648" : "\u0635\u0648\u0631\u0629" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: formatDate(story.expires_at) }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("button", { type: "button", className: "mini-action", onClick: () => openStory(story.id), children: "\u0639\u0631\u0636 \u0627\u0644\u0642\u0635\u0629" }) })
          ] }, story.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "admin-side-stack", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "card-head split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h3", { className: "section-title", children: "\u0622\u062E\u0631 \u0623\u0631\u0634\u064A\u0641" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "badge", children: archive.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "admin-activity-list", children: archive.slice(0, 6).map((item) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "admin-activity-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "admin-activity-dot tone-story" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("strong", { children: [
                "@",
                item.username
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: item.caption || "\u0642\u0635\u0629 \u0645\u0624\u0631\u0634\u0641\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("small", { children: formatDate(item.created_at) })
            ] })
          ] }, item.id)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "card-head split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h3", { className: "section-title", children: "Highlights \u0627\u0644\u062D\u0627\u0644\u064A\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "badge", children: highlights.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "queue-grid compact-cards", children: highlights.length ? highlights.map((item) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("button", { type: "button", className: "queue-card compact admin-tone-violet", style: { textAlign: "inherit", cursor: "pointer" }, onClick: () => openStory(item.id), children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "queue-label", children: [
              "@",
              item.username
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: item.caption || "Story Highlight" }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { children: [
              item.views_count,
              " \u0645\u0634\u0627\u0647\u062F\u0629 \u2022 ",
              item.replies_count,
              " \u0631\u062F"
            ] })
          ] }, item.id)) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "empty-state compact", children: "\u0644\u0627 \u062A\u0648\u062C\u062F Highlights \u062D\u0627\u0644\u064A\u0627\u064B." }) })
        ] })
      ] })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Modal, { open: storyModalOpen && Boolean(activeStory), title: activeStory ? `Story \u2022 @${activeStory.username}` : "Story Viewer", onClose: () => setStoryModalOpen(false), children: activeStory ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "modal-stack", children: [
      activeStory.type === "video" ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("video", { src: activeStory.media, controls: true, autoPlay: true, className: "media-viewer-asset" }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("img", { src: activeStory.media, alt: `story-${activeStory.username}`, className: "media-viewer-asset" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "profile-summary-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "avatar-circle large", children: activeStory.username.slice(0, 1).toUpperCase() }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("strong", { children: [
            "@",
            activeStory.username
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "muted", children: activeStory.caption || "\u0628\u062F\u0648\u0646 \u0643\u0627\u0628\u0634\u0646" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "action-row", style: { marginTop: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "glass-chip", children: activeStory.privacy }),
            activeStory.highlight ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "glass-chip", children: "\u2B50 Highlight" }) : null,
            activeStory.music ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "glass-chip", children: [
              "\u{1F3B5} ",
              activeStory.music
            ] }) : null
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "stats-inline-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: activeStory.views_count }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "\u0645\u0634\u0627\u0647\u062F\u0629" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: activeStory.replies_count }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "\u0631\u062F" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: activeStory.reactions_count }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "\u062A\u0641\u0627\u0639\u0644" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: formatDate(activeStory.expires_at) }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "\u0627\u0646\u062A\u0647\u0627\u0621" })
        ] })
      ] }),
      activeStory.mentions.length || activeStory.stickers.length ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "badge-wrap compact", children: [
        activeStory.mentions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "glass-chip", children: [
          "@",
          item
        ] }, `mention-${item}`)),
        activeStory.stickers.map((item) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "glass-chip", children: item }, `sticker-${item}`))
      ] }) : null,
      activeStory.replies.length ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "story-feedback-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: "\u0622\u062E\u0631 \u0627\u0644\u0631\u062F\u0648\u062F" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "admin-activity-list", style: { marginTop: 10 }, children: activeStory.replies.slice(0, 5).map((reply, index) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "admin-activity-item", children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "admin-activity-dot tone-live" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("strong", { children: [
              "@",
              reply.username
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: reply.text }),
            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("small", { children: formatDate(reply.created_at) })
          ] })
        ] }, `${reply.username}-${index}`)) })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "modal-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Button, { variant: "secondary", onClick: () => moveStory(-1), disabled: activeIndex <= 0, children: "\u0627\u0644\u0642\u0635\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Button, { variant: "secondary", onClick: handleToggleHighlight, loading: togglingHighlight, children: activeStory.highlight ? "\u0625\u0632\u0627\u0644\u0629 Highlight" : "\u0625\u0636\u0627\u0641\u0629 Highlight" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Button, { onClick: () => moveStory(1), disabled: activeIndex >= stories.length - 1, children: "\u0627\u0644\u0642\u0635\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629" })
      ] })
    ] }) : null })
  ] });
}

// src/pages/admin/AdminReels.jsx
init_define_import_meta_env();
var import_react14 = __toESM(require_react(), 1);

// src/components/admin/AdminSectionTemplate.jsx
init_define_import_meta_env();

// src/components/admin/adminShared.js
init_define_import_meta_env();
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
  if (!value) return "\u0627\u0644\u0622\u0646";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u0627\u0644\u0622\u0646";
  return date.toLocaleString("ar-EG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function sampleActivity() {
  return [
    { id: "1", title: "PlayerOne \u0628\u062F\u0623 \u0628\u062B \u062C\u062F\u064A\u062F", description: "\u0645\u0646\u0630 \u062F\u0642\u0627\u0626\u0642 \u0642\u0644\u064A\u0644\u0629", created_at: (/* @__PURE__ */ new Date()).toISOString(), level: "live" },
    { id: "2", title: "KhaledGamer \u0646\u0634\u0631 \u0645\u0646\u0634\u0648\u0631\u0627\u064B \u062C\u062F\u064A\u062F\u0627\u064B", description: "\u0645\u062D\u062A\u0648\u0649 \u062A\u0641\u0627\u0639\u0644\u064A \u062C\u062F\u064A\u062F", created_at: new Date(Date.now() - 1e3 * 60 * 12).toISOString(), level: "post" },
    { id: "3", title: "ShadowGirl \u0627\u0633\u062A\u0642\u0628\u0644\u062A \u0631\u062F\u0648\u062F\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0633\u062A\u0648\u0631\u064A", description: "\u0627\u0631\u062A\u0641\u0627\u0639 \u0645\u0644\u062D\u0648\u0638 \u0641\u064A \u0627\u0644\u062A\u0641\u0627\u0639\u0644", created_at: new Date(Date.now() - 1e3 * 60 * 28).toISOString(), level: "story" },
    { id: "4", title: "MoX \u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0645\u062C\u0645\u0648\u0639\u0629 \u062C\u062F\u064A\u062F\u0629", description: "\u0646\u0634\u0627\u0637 \u0645\u062C\u062A\u0645\u0639\u064A \u0645\u062A\u0632\u0627\u064A\u062F", created_at: new Date(Date.now() - 1e3 * 60 * 42).toISOString(), level: "group" }
  ];
}
function getStatusTone(status) {
  const value = String(status || "").toLowerCase();
  if (["active", "featured", "live", "healthy", "linked", "seen"].includes(value)) return "success";
  if (["warning", "pending", "review", "archived", "draft"].includes(value)) return "warning";
  if (["danger", "critical", "ended", "ended_live", "offline", "banned"].includes(value)) return "danger";
  return "neutral";
}
function statusLabel2(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "\u0646\u0634\u0637";
  if (value === "featured") return "\u0645\u0645\u064A\u0632";
  if (value === "live") return "\u0645\u0628\u0627\u0634\u0631";
  if (value === "healthy" || value === "linked") return "\u0633\u0644\u064A\u0645";
  if (value === "warning" || value === "review") return "\u0645\u0631\u0627\u062C\u0639\u0629";
  if (value === "pending") return "\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631";
  if (value === "draft") return "\u0645\u0633\u0648\u062F\u0629";
  if (value === "archived") return "\u0645\u0624\u0631\u0634\u0641";
  if (value === "offline") return "\u063A\u064A\u0631 \u0645\u062A\u0635\u0644";
  if (value === "ended" || value === "ended_live") return "\u0645\u0646\u062A\u0647\u064A";
  if (value === "danger" || value === "critical") return "\u062E\u0637\u0631";
  if (value === "banned") return "\u0645\u062D\u0638\u0648\u0631";
  if (value === "seen") return "\u0645\u0642\u0631\u0648\u0621";
  return status || "\u2014";
}

// src/components/admin/AdminSectionTemplate.jsx
var import_jsx_runtime17 = __toESM(require_jsx_runtime(), 1);
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
  emptyIcon = "\u{1F4C2}",
  emptyTitle = "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0639\u062F",
  emptyDescription = "\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0647\u0646\u0627 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0646\u062F \u062A\u0648\u0641\u0631\u0647\u0627.",
  asideTitle = "\u0645\u0624\u0634\u0631\u0627\u062A \u0633\u0631\u064A\u0639\u0629",
  asideItems = [],
  timelineTitle = "\u0622\u062E\u0631 \u0627\u0644\u0646\u0634\u0627\u0637\u0627\u062A",
  timelineItems = [],
  primaryAction,
  secondaryAction
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(AdminLayout, { children: [
    error ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "alert error", children: error }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("section", { className: "dashboard-hero-grid small-gap admin-section-hero-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Card, { className: "hero-card admin-hero-card admin-section-hero", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "hero-card-topline", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "badge", children: badge || "Admin Workspace" }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { className: "live-pill", children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "status-dot live-dot" }),
            accent || "\u0644\u0648\u062D\u0629 \u062A\u0634\u063A\u064A\u0644 \u0645\u0628\u0627\u0634\u0631\u0629"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h2", { children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: subtitle }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "hero-actions-wrap", children: [
          primaryAction ? primaryAction.to ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Link, { className: "btn btn-primary", to: primaryAction.to, children: primaryAction.label }) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Button, { onClick: primaryAction.onClick, children: primaryAction.label }) : null,
          secondaryAction ? secondaryAction.to ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Link, { className: "btn btn-secondary", to: secondaryAction.to, children: secondaryAction.label }) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Button, { variant: "secondary", onClick: secondaryAction.onClick, children: secondaryAction.label }) : null
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Card, { className: "spotlight-card admin-section-spotlight", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "card-head split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h3", { className: "section-title", children: asideTitle }),
          onRetry ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Button, { variant: "secondary", onClick: onRetry, children: "\u062A\u062D\u062F\u064A\u062B" }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "status-list compact-grid admin-spotlight-grid", children: spotlight.map((item) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: item.value }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { children: item.label })
        ] }, item.label)) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("section", { className: "admin-metric-grid", children: stats.map((item) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Card, { className: `admin-metric-card tone-${item.tone || "neutral"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "admin-metric-icon", children: item.icon || "\u2022" }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "admin-metric-copy", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { children: item.label }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: item.value }),
        item.note ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("small", { children: item.note }) : null
      ] })
    ] }, item.label)) }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("section", { className: "admin-deep-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Card, { className: "admin-rich-table-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "card-head split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h3", { className: "section-title", children: tableTitle }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { className: "muted no-margin", children: tableDescription })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("span", { className: "badge", children: [
            formatFullNumber(rows.length),
            " \u0639\u0646\u0635\u0631"
          ] })
        ] }),
        loading ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "empty-state compact", children: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A..." }) : null,
        !loading && error && !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(ErrorState, { title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", description: error, onRetry }) : null,
        !loading && !rows.length && !error ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(EmptyState, { icon: emptyIcon, title: emptyTitle, description: emptyDescription, actionLabel: onRetry ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u062D\u0645\u064A\u0644" : void 0, onAction: onRetry }) : null,
        !loading && rows.length ? /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "table-shell admin-rich-table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("table", { className: "admin-table admin-rich-table", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("tr", { children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("th", { children: column.label }, column.key)) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("tbody", { children: rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("tr", { children: columns.map((column) => {
            const rawValue = typeof column.render === "function" ? column.render(row, index) : row[column.key];
            return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("td", { children: rawValue }, column.key);
          }) }, row[rowKey] || `${index}-${row.title || row.name || "row"}`)) })
        ] }) }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "admin-side-stack", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "card-head split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h3", { className: "section-title", children: "\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "badge", children: "Live" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "queue-grid compact-cards", children: asideItems.length ? asideItems.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: `queue-card compact admin-tone-${item.tone || "neutral"}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "queue-label", children: item.label }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: item.value }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: item.description })
          ] }, `${item.label}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "empty-state compact", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0624\u0634\u0631\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629 \u062D\u0627\u0644\u064A\u0627\u064B." }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "card-head split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("h3", { className: "section-title", children: timelineTitle }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "badge", children: "Feed" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "admin-activity-list", children: timelineItems.length ? timelineItems.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "admin-activity-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: `admin-activity-dot tone-${getStatusTone(item.level || item.status)}` }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("strong", { children: item.title || item.label }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("p", { children: item.description || item.body || "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0646\u0634\u0627\u0637 \u062C\u062F\u064A\u062F \u062F\u0627\u062E\u0644 \u0627\u0644\u0646\u0638\u0627\u0645." }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("small", { children: formatDateTime(item.created_at || item.time) })
            ] })
          ] }, `${item.id || item.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "empty-state compact", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u0634\u0627\u0637\u0627\u062A \u062D\u062F\u064A\u062B\u0629." }) })
        ] })
      ] })
    ] })
  ] });
}
function renderStatus(status) {
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: `status-pill ${getStatusTone(status)}`, children: statusLabel2(status) });
}

// src/pages/admin/AdminReels.jsx
var import_jsx_runtime18 = __toESM(require_jsx_runtime(), 1);
var reelUrl = (item) => item?.media_urls?.[0] || item?.media || item?.image_url || "";
var isVideo2 = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ""));
function AdminReels() {
  const [reels, setReels] = (0, import_react14.useState)([]);
  const [loading, setLoading] = (0, import_react14.useState)(true);
  const [error, setError] = (0, import_react14.useState)("");
  const [activeReelId, setActiveReelId] = (0, import_react14.useState)("");
  const [inlinePlayingId, setInlinePlayingId] = (0, import_react14.useState)("");
  const [modalPlaying, setModalPlaying] = (0, import_react14.useState)(false);
  const videoRefs = (0, import_react14.useRef)({});
  const modalVideoRef = (0, import_react14.useRef)(null);
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getPosts({ skip: 0, limit: 30 });
      const items = toArray(data).filter((item) => isVideo2(reelUrl(item)));
      setReels(items);
      setActiveReelId((previous) => {
        if (previous && items.some((item) => String(item.id) === String(previous))) return previous;
        return String(items[0]?.id || "");
      });
    } catch (err) {
      setError(err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0631\u064A\u0644\u0632.");
      setReels([]);
      setActiveReelId("");
    } finally {
      setLoading(false);
    }
  };
  (0, import_react14.useEffect)(() => {
    load();
  }, []);
  const activeReel = (0, import_react14.useMemo)(
    () => reels.find((item) => String(item.id) === String(activeReelId)) || null,
    [activeReelId, reels]
  );
  (0, import_react14.useEffect)(() => {
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
    { label: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0631\u064A\u0644\u0632", value: formatCompactNumber(reels.length || 0), icon: "\u{1F3AC}", tone: "violet", note: "\u0645\u0642\u0627\u0637\u0639 \u0641\u064A\u062F\u064A\u0648 \u0642\u0635\u064A\u0631\u0629 \u0645\u0631\u0628\u0648\u0637\u0629 \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A." },
    { label: "\u0627\u0644\u062A\u0641\u0627\u0639\u0644", value: formatCompactNumber(engagementTotal || 0), icon: "\u{1F525}", tone: "green", note: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0644\u0627\u064A\u0643\u0627\u062A \u0648\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0627\u062A." },
    { label: "\u0623\u0641\u0636\u0644 \u0645\u0646\u0634\u0626", value: reels[0]?.username || "\u2014", icon: "\u{1F3C6}", tone: "amber", note: "\u0623\u0639\u0644\u0649 \u0638\u0647\u0648\u0631 \u062D\u0627\u0644\u064A \u062F\u0627\u062E\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062D\u0645\u0644\u0629." },
    { label: "\u062C\u0627\u0647\u0632 \u0644\u0644\u0645\u0639\u0627\u064A\u0646\u0629", value: formatCompactNumber(reels.length), icon: "\u{1F6E1}\uFE0F", tone: "blue", note: "\u064A\u0645\u0643\u0646 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0631\u064A\u0644 \u0648\u0641\u062A\u062D\u0647 \u062F\u0627\u062E\u0644 Modal \u0645\u0628\u0627\u0634\u0631\u0629." }
  ];
  const spotlight = [
    { label: "\u0623\u0639\u0644\u0649 \u062A\u0641\u0627\u0639\u0644", value: formatCompactNumber(Math.max(...reels.map((item) => Number(item.likes || item.like_count || 0) + Number(item.comments_count || 0)), 0)) },
    { label: "\u0623\u062D\u062F\u062B \u0631\u064A\u0644", value: reels[0]?.created_at ? formatDateTime(reels[0].created_at) : "\u2014" },
    { label: "\u062D\u0627\u0644\u0629 \u0627\u0644\u0631\u0628\u0637", value: reels.length ? "API \u0645\u062A\u0635\u0644" : "\u0644\u0627 \u062A\u0648\u062C\u062F \u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A" }
  ];
  const asideItems = [
    {
      label: "\u0627\u0644\u0631\u064A\u0644 \u0627\u0644\u0645\u062A\u0635\u062F\u0631",
      value: reels[0]?.username || "\u2014",
      description: reels[0]?.content || "\u0633\u064A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0648\u0635\u0641 \u0627\u0644\u0631\u064A\u0644 \u0627\u0644\u0623\u0639\u0644\u0649 \u0639\u0646\u062F \u062A\u0648\u0641\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.",
      tone: "success"
    },
    {
      label: "\u0645\u0639\u0627\u064A\u0646\u0629 \u0645\u0628\u0627\u0634\u0631\u0629",
      value: inlinePlayingId ? "\u0646\u0634\u0637\u0629" : "\u062C\u0627\u0647\u0632\u0629",
      description: "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u062A\u0634\u063A\u064A\u0644/\u0625\u064A\u0642\u0627\u0641 \u0645\u0628\u0627\u0634\u0631 \u062F\u0627\u062E\u0644 \u0627\u0644\u062C\u062F\u0648\u0644 \u0645\u0639 Modal \u0644\u0644\u0639\u0631\u0636 \u0627\u0644\u0643\u0627\u0645\u0644.",
      tone: "violet"
    },
    {
      label: "\u0645\u0635\u062F\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
      value: "Posts API",
      description: "\u0627\u0644\u0635\u0641\u062D\u0629 \u062A\u0633\u062D\u0628 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u0646\u0641\u0633 \u0645\u0635\u062F\u0631 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0648\u062A\u0641\u0644\u062A\u0631 \u0627\u0644\u0631\u064A\u0644\u0632 \u0641\u0642\u0637.",
      tone: "amber"
    }
  ];
  const timeline = reels.length ? reels.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.username || "creator",
    description: item.content || "\u062A\u0645 \u0646\u0634\u0631 \u0631\u064A\u0644 \u062C\u062F\u064A\u062F.",
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
      label: "\u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629",
      render: (row) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { style: { width: 120 }, children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
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
      label: "\u0627\u0644\u0631\u064A\u0644",
      render: (row) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "admin-rich-user-cell", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("div", { className: "admin-module-avatar", children: "\u{1F3AC}" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("strong", { children: row.content?.slice(0, 36) || "\u0631\u064A\u0644 \u062C\u062F\u064A\u062F" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("small", { children: [
            "@",
            row.username || "creator"
          ] })
        ] })
      ] })
    },
    { key: "engagement", label: "\u0627\u0644\u062A\u0641\u0627\u0639\u0644", render: (row) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("strong", { children: formatCompactNumber(row.engagement) }) },
    { key: "comments_count", label: "\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A", render: (row) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("strong", { children: row.comments_count || 0 }) },
    { key: "share_count", label: "\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0627\u062A", render: (row) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("strong", { children: row.share_count || 0 }) },
    { key: "adminStatus", label: "\u0627\u0644\u062D\u0627\u0644\u0629", render: (row) => renderStatus(row.adminStatus) },
    { key: "created_at", label: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E", render: (row) => formatDateTime(row.created_at) },
    {
      key: "actions",
      label: "\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A",
      render: (row) => /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "grid", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "secondary", onClick: () => toggleInlinePlayback(row.id), children: inlinePlayingId === String(row.id) ? "\u0625\u064A\u0642\u0627\u0641" : "\u062A\u0634\u063A\u064A\u0644" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { onClick: () => openReelModal(row), children: "\u0641\u062A\u062D \u0627\u0644\u0631\u064A\u0644" })
      ] })
    }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      AdminSectionTemplate,
      {
        loading,
        error,
        onRetry: load,
        title: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0631\u064A\u0644\u0632",
        subtitle: "\u062A\u0645 \u0631\u0628\u0637 \u0635\u0641\u062D\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0631\u064A\u0644\u0632 \u0628\u0645\u0635\u062F\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0645\u0639 \u0645\u0639\u0627\u064A\u0646\u0629 \u0641\u064A\u062F\u064A\u0648 \u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0623\u0632\u0631\u0627\u0631 \u062A\u0634\u063A\u064A\u0644/\u0625\u064A\u0642\u0627\u0641\u060C \u0648Modal \u0644\u0639\u0631\u0636 \u0627\u0644\u0631\u064A\u0644 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u062A\u062D\u0644\u064A\u0644 \u0645\u062D\u062A\u0648\u0627\u0647 \u0628\u0633\u0631\u0639\u0629.",
        badge: "Reels Studio",
        accent: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u0642\u0635\u064A\u0631",
        stats,
        spotlight,
        tableTitle: "\u0623\u062D\u062F\u062B \u0627\u0644\u0631\u064A\u0644\u0632",
        tableDescription: "\u0627\u0644\u062C\u062F\u0648\u0644 \u064A\u0633\u062D\u0628 \u0627\u0644\u0631\u064A\u0644\u0632 \u0645\u0646 Posts API\u060C \u064A\u0641\u0644\u062A\u0631 \u0627\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0641\u0642\u0637\u060C \u0648\u064A\u0639\u0631\u0636 \u0645\u0639\u0627\u064A\u0646\u0629 \u0641\u0639\u0644\u064A\u0629 \u0645\u0639 \u0625\u062C\u0631\u0627\u0621\u0627\u062A \u062A\u0634\u063A\u064A\u0644 \u0648\u0641\u062A\u062D Modal.",
        columns,
        rows,
        emptyIcon: "\u{1F3AC}",
        emptyTitle: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0631\u064A\u0644\u0632 \u062D\u0627\u0644\u064A\u0627\u064B",
        emptyDescription: "\u0639\u0646\u062F \u062A\u0648\u0641\u0631 \u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0642\u0635\u064A\u0631\u0629 \u0633\u064A\u062A\u0645 \u0639\u0631\u0636\u0647\u0627 \u0647\u0646\u0627 \u0644\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0641\u0639\u0644\u064A\u0629.",
        asideTitle: "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0631\u064A\u0644\u0632",
        asideItems,
        timelineTitle: "\u062A\u062F\u0641\u0642 \u0627\u0644\u0631\u064A\u0644\u0632",
        timelineItems: timeline,
        primaryAction: { to: "/admin/dashboard", label: "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0631\u0626\u064A\u0633\u064A\u0629" },
        secondaryAction: { to: "/reels", label: "\u0641\u062A\u062D \u0627\u0644\u0631\u064A\u0644\u0632" }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Modal, { open: Boolean(activeReel), title: activeReel ? `\u0631\u064A\u0644 @${activeReel.username || "creator"}` : "Reel Viewer", onClose: closeReelModal, children: activeReel ? /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "grid", gap: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { onClick: toggleModalPlayback, children: modalPlaying ? "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0631\u064A\u0644" : "\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0631\u064A\u0644" }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Button, { variant: "secondary", onClick: closeReelModal, children: "\u0625\u063A\u0644\u0627\u0642" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "queue-grid compact-cards", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "queue-card compact admin-tone-violet", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "queue-label", children: "\u0627\u0644\u0645\u0646\u0634\u0626" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("strong", { children: [
            "@",
            activeReel.username || "creator"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { children: activeReel.content || "\u0628\u062F\u0648\u0646 \u0648\u0635\u0641." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "queue-card compact admin-tone-success", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "queue-label", children: "\u0627\u0644\u062A\u0641\u0627\u0639\u0644" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("strong", { children: formatCompactNumber(Number(activeReel.likes || activeReel.like_count || 0) + Number(activeReel.comments_count || 0) + Number(activeReel.share_count || 0)) }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { children: "\u0644\u0627\u064A\u0643\u0627\u062A + \u062A\u0639\u0644\u064A\u0642\u0627\u062A + \u0645\u0634\u0627\u0631\u0643\u0627\u062A." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "queue-card compact admin-tone-amber", children: [
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("span", { className: "queue-label", children: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0646\u0634\u0631" }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("strong", { children: formatDateTime(activeReel.created_at) }),
          /* @__PURE__ */ (0, import_jsx_runtime18.jsx)("p", { children: "\u062A\u0645 \u0631\u0628\u0637 \u0627\u0644\u0640 Modal \u0628\u0646\u0641\u0633 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0640 API \u0627\u0644\u0645\u062D\u0645\u0651\u0644\u0629 \u0644\u0644\u0635\u0641\u062D\u0629." })
        ] })
      ] })
    ] }) : null })
  ] });
}

// src/pages/admin/AdminGroups.jsx
init_define_import_meta_env();
var import_react15 = __toESM(require_react(), 1);
var import_jsx_runtime19 = __toESM(require_jsx_runtime(), 1);
var initialForm2 = { name: "", description: "", members: "" };
function formatDate2(value) {
  if (!value) return "\u2014";
  try {
    return new Date(value).toLocaleString("ar-EG");
  } catch {
    return "\u2014";
  }
}
function AdminGroups() {
  const [groups2, setGroups] = (0, import_react15.useState)([]);
  const [loading, setLoading] = (0, import_react15.useState)(true);
  const [error, setError] = (0, import_react15.useState)("");
  const [createOpen, setCreateOpen] = (0, import_react15.useState)(false);
  const [detailGroup, setDetailGroup] = (0, import_react15.useState)(null);
  const [form, setForm] = (0, import_react15.useState)(initialForm2);
  const [saving, setSaving] = (0, import_react15.useState)(false);
  const [joiningGroupId, setJoiningGroupId] = (0, import_react15.useState)("");
  const { pushToast } = useToast();
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };
  (0, import_react15.useEffect)(() => {
    load();
  }, []);
  const stats = (0, import_react15.useMemo)(() => {
    const members = groups2.reduce((sum, item) => sum + Number(item.members_count || 0), 0);
    return [
      { label: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A", value: groups2.length },
      { label: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0623\u0639\u0636\u0627\u0621", value: members },
      { label: "\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0623\u0639\u0636\u0627\u0621", value: groups2.length ? Math.round(members / groups2.length) : 0 },
      { label: "\u0622\u062E\u0631 \u0625\u0636\u0627\u0641\u0627\u062A", value: groups2.slice(0, 3).length }
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
      pushToast({ title: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0645\u0637\u0644\u0648\u0628", description: "\u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u0648\u0627\u0636\u062D \u0642\u0628\u0644 \u0627\u0644\u0625\u0646\u0634\u0627\u0621.", type: "warning" });
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
      setForm(initialForm2);
      pushToast({ title: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629", description: data?.name || payload.name, type: "success" });
      await load();
      if (data) setDetailGroup(data);
    } catch (err) {
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629", description: err?.response?.data?.detail || "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u062A\u0627\u0646\u064A\u0629.", type: "error" });
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
      pushToast({ title: data?.joined ? "\u062A\u0645 \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629" : "\u0623\u0646\u062A \u0645\u0646\u0636\u0645 \u0628\u0627\u0644\u0641\u0639\u0644", description: data?.name || group.name, type: data?.joined ? "success" : "info" });
    } catch (err) {
      pushToast({ title: "\u062A\u0639\u0630\u0631 \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645", description: err?.response?.data?.detail || "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u062A\u0627\u0646\u064A\u0629.", type: "error" });
    } finally {
      setJoiningGroupId("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(AdminLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("section", { className: "dashboard-hero-grid small-gap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(Card, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "card-head split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h3", { className: "section-title", children: "Groups Hub" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { className: "muted", children: "\u0623\u0632\u0631\u0627\u0631 Create / Join \u0648\u0627\u0644\u0640 Group Modal \u0628\u0642\u0648\u0627 \u0645\u0631\u0628\u0648\u0637\u064A\u0646 \u0628\u0627\u0644\u0640 API \u0648\u0628\u064A\u0639\u0631\u0636\u0648\u0627 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "action-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Button, { onClick: () => setCreateOpen(true), children: "\u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0648\u0639\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Button, { variant: "secondary", onClick: load, loading, children: loading ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u062F\u064A\u062B..." : "\u062A\u062D\u062F\u064A\u062B" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "status-list compact-grid", children: stats.map((item) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: item.value }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: item.label })
        ] }, item.label)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "queue-grid compact-cards", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "queue-card compact admin-tone-success", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "queue-label", children: "\u0623\u0643\u0628\u0631 \u0645\u062C\u0645\u0648\u0639\u0629" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: groups2[0]?.name || "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: groups2[0]?.description || "\u0647\u062A\u0638\u0647\u0631 \u0647\u0646\u0627 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0623\u0639\u0644\u0649 \u0641\u064A \u0627\u0644\u0642\u0627\u0626\u0645\u0629." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "queue-card compact admin-tone-blue", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "queue-label", children: "\u0635\u0627\u062D\u0628 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0623\u0648\u0644\u0649" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: groups2[0]?.owner_username || "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: "\u0645\u0633\u062A\u062E\u0631\u062C \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0640 backend." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "queue-card compact admin-tone-amber", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "queue-label", children: "\u062C\u0627\u0647\u0632\u064A\u0629 \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: "Live" }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: "\u062A\u0642\u062F\u0631 \u062A\u0646\u0636\u0645 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0648\u062A\u062A\u0627\u0628\u0639 \u062A\u062D\u062F\u064A\u062B \u0639\u062F\u062F \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0641\u0648\u0631\u0627\u064B." })
        ] })
      ] }) })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(ErrorState, { title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A", description: error, onRetry: load }) : null,
    loading ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(ListSkeleton, { count: 5 }) : null,
    !loading && groups2.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(EmptyState, { icon: "\u{1F465}", title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0628\u0639\u062F", description: "\u0623\u0646\u0634\u0626 \u0623\u0648\u0644 \u0645\u062C\u0645\u0648\u0639\u0629 \u0645\u0646 \u0627\u0644\u0632\u0631 \u0627\u0644\u0644\u064A \u0641\u0648\u0642 \u0648\u0647\u062A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0641\u0648\u0631\u0627\u064B.", actionLabel: "\u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0648\u0639\u0629", onAction: () => setCreateOpen(true) }) : null,
    !loading && groups2.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("section", { className: "admin-deep-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(Card, { className: "admin-rich-table-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "card-head split", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h3", { className: "section-title", children: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { className: "muted no-margin", children: "\u0627\u0641\u062A\u062D \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0623\u0648 \u0627\u0646\u0636\u0645 \u0644\u0623\u064A \u0645\u062C\u0645\u0648\u0639\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0627\u0644\u062C\u062F\u0648\u0644." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "badge", children: groups2.length })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "table-shell admin-rich-table-shell", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("table", { className: "admin-table admin-rich-table", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "\u0627\u0644\u0648\u0635\u0641" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "\u0627\u0644\u0645\u0627\u0644\u0643" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "\u0627\u0644\u0623\u0639\u0636\u0627\u0621" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "\u0627\u0644\u0625\u0646\u0634\u0627\u0621" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("th", { children: "\u0625\u062C\u0631\u0627\u0621\u0627\u062A" })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("tbody", { children: groups2.map((group) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "admin-rich-user-cell", children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "admin-module-avatar", children: "\u{1F465}" }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: group.name }),
                /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("small", { children: [
                  "#",
                  group.id
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "content-cell compact", children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: group.description || "\u0628\u062F\u0648\u0646 \u0648\u0635\u0641" }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("small", { children: group.members?.slice(0, 3).join(" \u2022 ") || "\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0633\u0645\u0627\u0621 \u0623\u0639\u0636\u0627\u0621 \u0628\u0639\u062F" })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("td", { children: [
              "@",
              group.owner_username
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: group.members_count || group.members?.length || 0 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { children: formatDate2(group.created_at) }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "action-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("button", { type: "button", className: "mini-action", onClick: () => openGroupModal(group), children: "\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644" }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Button, { variant: "secondary", className: "group-join-btn", loading: joiningGroupId === String(group.id), onClick: () => handleJoin(group), children: joiningGroupId === String(group.id) ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645..." : "\u0627\u0646\u0636\u0645\u0627\u0645" })
            ] }) })
          ] }, group.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "admin-side-stack", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "card-head split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h3", { className: "section-title", children: "\u0622\u062E\u0631 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "badge", children: "Feed" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "admin-activity-list", children: groups2.slice(0, 6).map((group) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "admin-activity-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "admin-activity-dot tone-group" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: group.name }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { children: group.description || "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0648\u0639\u0629 \u062C\u062F\u064A\u062F\u0629." }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("small", { children: formatDate2(group.created_at) })
            ] })
          ] }, group.id)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(Card, { className: "admin-mini-list-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "card-head split", children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("h3", { className: "section-title", children: "\u0645\u0624\u0634\u0631\u0627\u062A \u0633\u0631\u064A\u0639\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "badge", children: "Live" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "queue-grid compact-cards", children: groups2.slice(0, 3).map((group) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("button", { type: "button", className: "queue-card compact admin-tone-violet", style: { textAlign: "inherit", cursor: "pointer" }, onClick: () => openGroupModal(group), children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "queue-label", children: group.name }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("strong", { children: [
              group.members_count || 0,
              " \u0639\u0636\u0648"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("p", { children: [
              "\u0627\u0644\u0645\u0627\u0644\u0643: @",
              group.owner_username
            ] })
          ] }, group.id)) })
        ] })
      ] })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Modal, { open: createOpen, title: "\u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0648\u0639\u0629 \u062C\u062F\u064A\u062F\u0629", onClose: () => setCreateOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "modal-stack", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Input, { label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629", value: form.name, onChange: (event) => setForm((prev) => ({ ...prev, name: event.target.value })), placeholder: "\u0645\u062B\u0627\u0644: \u0641\u0631\u064A\u0642 \u0627\u0644\u062F\u0639\u0645" }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("label", { className: "field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "field-label", children: "\u0648\u0635\u0641 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("textarea", { className: "input textarea", rows: "4", value: form.description, onChange: (event) => setForm((prev) => ({ ...prev, description: event.target.value })), placeholder: "\u0627\u0643\u062A\u0628 \u0648\u0635\u0641 \u0645\u062E\u062A\u0635\u0631 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Input, { label: "\u0623\u0639\u0636\u0627\u0621 \u0645\u0628\u062F\u0626\u064A\u0648\u0646", hint: "\u0627\u0641\u0635\u0644 \u0627\u0644\u0623\u0633\u0645\u0627\u0621 \u0628\u0641\u0627\u0635\u0644\u0629", value: form.members, onChange: (event) => setForm((prev) => ({ ...prev, members: event.target.value })), placeholder: "ahmed, sara, nour" }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "modal-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Button, { variant: "secondary", onClick: () => setCreateOpen(false), children: "\u0625\u0644\u063A\u0627\u0621" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Button, { onClick: handleCreate, loading: saving, children: saving ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0625\u0646\u0634\u0627\u0621..." : "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Modal, { open: Boolean(detailGroup), title: detailGroup ? detailGroup.name : "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629", onClose: () => setDetailGroup(null), children: detailGroup ? /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "modal-stack", children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "profile-summary-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "avatar-circle large", children: "\u{1F465}" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: detailGroup.name }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "muted", children: [
            "\u0628\u0648\u0627\u0633\u0637\u0629 @",
            detailGroup.owner_username
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "glass-chip", style: { marginTop: 8 }, children: [
            "#",
            detailGroup.id
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "story-feedback-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: "\u0627\u0644\u0648\u0635\u0641" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("p", { style: { marginTop: 8 }, children: detailGroup.description || "\u0628\u062F\u0648\u0646 \u0648\u0635\u0641" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "stats-inline-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: detailGroup.members_count || detailGroup.members?.length || 0 }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "\u0623\u0639\u0636\u0627\u0621" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("strong", { children: [
            "@",
            detailGroup.owner_username
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "\u0627\u0644\u0645\u0627\u0644\u0643" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: formatDate2(detailGroup.created_at) }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u0634\u0627\u0621" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "story-feedback-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("strong", { children: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0639\u0636\u0627\u0621" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: "badge-wrap compact", style: { marginTop: 10 }, children: (detailGroup.members || []).length ? detailGroup.members.map((member) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { className: "glass-chip", children: [
          "@",
          member
        ] }, member)) : /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "muted", children: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0623\u0639\u0636\u0627\u0621 \u0645\u0639\u0631\u0648\u0636\u064A\u0646." }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: "modal-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Button, { variant: "secondary", onClick: () => handleJoin(detailGroup), loading: joiningGroupId === String(detailGroup.id), children: joiningGroupId === String(detailGroup.id) ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645..." : "\u0627\u0646\u0636\u0645\u0627\u0645 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(Button, { onClick: () => setDetailGroup(null), children: "\u0625\u063A\u0644\u0627\u0642" })
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
