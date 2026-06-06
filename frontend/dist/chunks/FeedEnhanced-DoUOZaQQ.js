import { Q as QueryObserver, ae as hasPreviousPage, ac as hasNextPage, aX as useBaseQuery, aK as reactExports, a$ as useLocation, b0 as useNavigate, aY as useChatStore, aQ as selectUnreadTotal, ah as jsxRuntimeExports, f as Link, N as NavLink, b5 as useQueryClient, b8 as useToast, aO as resolveMediaUrl, aW as useAppStore, aU as unblockUserApi, r as blockUserApi, d as Card, c as Button, k as MainLayout$2, ab as getStoredUserSnapshot, Z as getCurrentUsername, K as getAuthToken, Y as getCsrfToken, B as BACKEND_ORIGIN, v as clearStoredUser, aL as redirectToAppPath } from "../index-BtxTC4_g.js";
import { B as BrandLogo } from "./BrandLogo-i6D71WuC.js";
import { u as useIsMobile } from "./useIsMobile-nVYdMVTQ.js";
import { b as createPost, i as injectPostIntoFeedCache, c as clearLocalFeedCaches, j as uploadPostMedia, g as getComments, a as addComment, h as sortPostsNewestFirst, e as getPosts, l as likePost, s as savePost, f as sharePost, d as deletePost } from "./posts-BsDvbV4a.js";
import { M as Modal } from "./Modal-DO_hehoX.js";
import { f as followUser, u as unmuteUser, m as muteUser } from "./users-DNLqh2s5.js";
import { m as mediaUploadService } from "./mediaUploadService-CY7adyIZ.js";
import { f as formatCompactNumber } from "./YamshatDesign-BB_OE-D7.js";
import { a as apiClient } from "./apiClient-DxRN-ErF.js";
var InfiniteQueryObserver = class extends QueryObserver {
  constructor(client, options) {
    super(client, options);
  }
  bindMethods() {
    super.bindMethods();
    this.fetchNextPage = this.fetchNextPage.bind(this);
    this.fetchPreviousPage = this.fetchPreviousPage.bind(this);
  }
  setOptions(options) {
    options._type = "infinite";
    super.setOptions(options);
  }
  getOptimisticResult(options) {
    options._type = "infinite";
    return super.getOptimisticResult(options);
  }
  fetchNextPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "forward" }
      }
    });
  }
  fetchPreviousPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "backward" }
      }
    });
  }
  createResult(query, options) {
    const { state } = query;
    const parentResult = super.createResult(query, options);
    const { isFetching, isRefetching, isError, isRefetchError } = parentResult;
    const fetchDirection = state.fetchMeta?.fetchMore?.direction;
    const isFetchNextPageError = isError && fetchDirection === "forward";
    const isFetchingNextPage = isFetching && fetchDirection === "forward";
    const isFetchPreviousPageError = isError && fetchDirection === "backward";
    const isFetchingPreviousPage = isFetching && fetchDirection === "backward";
    const result = {
      ...parentResult,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options, state.data),
      hasPreviousPage: hasPreviousPage(options, state.data),
      isFetchNextPageError,
      isFetchingNextPage,
      isFetchPreviousPageError,
      isFetchingPreviousPage,
      isRefetchError: isRefetchError && !isFetchNextPageError && !isFetchPreviousPageError,
      isRefetching: isRefetching && !isFetchingNextPage && !isFetchingPreviousPage
    };
    return result;
  }
};
function useInfiniteQuery(options, queryClient) {
  return useBaseQuery(
    options,
    InfiniteQueryObserver
  );
}
const Icon = {
  home: (active) => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: "M3 11.5 L12 4 L21 11.5 V20 a1 1 0 0 1-1 1 h-5 v-6 h-4 v6 H4 a1 1 0 0 1-1-1 Z",
      fill: active ? "currentColor" : "none",
      stroke: "currentColor",
      strokeLinejoin: "round"
    }
  ) }),
  search: () => /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "7", stroke: "currentColor", fill: "none" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 20 L16.5 16.5", stroke: "currentColor", strokeLinecap: "round" })
  ] }),
  plus: () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 5 V19 M5 12 H19", strokeLinecap: "round" }) }),
  inbox: (active) => /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "path",
      {
        d: "M3 7 a2 2 0 0 1 2-2 h14 a2 2 0 0 1 2 2 v10 a2 2 0 0 1-2 2 H5 a2 2 0 0 1-2-2 Z",
        fill: active ? "currentColor" : "none",
        stroke: "currentColor",
        strokeLinejoin: "round"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 7 L12 13 L20 7", stroke: active ? "#0A0D1A" : "currentColor", fill: "none", strokeLinejoin: "round" })
  ] }),
  profile: (active) => /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "8", r: "4", fill: active ? "currentColor" : "none", stroke: "currentColor" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 21 a8 8 0 0 1 16 0", fill: active ? "currentColor" : "none", stroke: "currentColor", strokeLinecap: "round" })
  ] })
};
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadTotal = useChatStore(selectUnreadTotal);
  const items = reactExports.useMemo(() => [
    {
      key: "home",
      to: "/",
      label: "الرئيسية",
      match: (p) => p === "/" || p === "/feed",
      icon: Icon.home
    },
    {
      key: "search",
      to: "/search",
      label: "الاستكشاف",
      match: (p) => p.startsWith("/search") || p.startsWith("/explore"),
      icon: Icon.search
    },
    {
      key: "create",
      label: "إنشاء",
      isCenter: true,
      onClick: () => {
        const onHome = location.pathname === "/" || location.pathname === "/feed";
        if (onHome) {
          window.dispatchEvent(new CustomEvent("yamshat:open-composer", { detail: { action: null } }));
        } else {
          navigate("/?compose=1");
        }
      }
    },
    {
      key: "inbox",
      to: "/inbox",
      label: "الرسائل",
      match: (p) => p.startsWith("/inbox") || p.startsWith("/chat"),
      icon: Icon.inbox,
      badge: unreadTotal > 0 ? unreadTotal > 99 ? "99+" : unreadTotal : null
    },
    {
      key: "profile",
      to: "/profile",
      label: "الملف الشخصي",
      match: (p) => p.startsWith("/profile"),
      icon: Icon.profile
    }
  ], [unreadTotal, navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "ym-bottomnav", "aria-label": "التنقل السفلي", role: "navigation", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-bottomnav-inner", children: items.map((item) => {
    if (item.isCenter) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-nav-plus-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "ym-nav-plus",
          "aria-label": item.label,
          onClick: item.onClick,
          children: Icon.plus()
        }
      ) }, item.key);
    }
    const active = item.match?.(location.pathname);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: item.to,
        className: `ym-nav-item ${active ? "is-active" : ""}`,
        "aria-current": active ? "page" : void 0,
        children: [
          item.icon(active),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
          item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: item.badge }) : null
        ]
      },
      item.key
    );
  }) }) });
}
const BottomNav$1 = reactExports.memo(BottomNav);
const HOME_SHORTCUTS = Object.freeze([
  { to: "/live/control", label: "البث" },
  { to: "/groups", label: "المجموعات" },
  { to: "/stories", label: "الستوري" },
  { to: "/reels", label: "الريلز" }
]);
function MobileTopBar({ onMenuClick, hasNotifications = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/feed";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: `ym-topbar ${isHome ? "has-shortcuts" : ""}`, role: "banner", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-topbar-inner", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-topbar-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "ym-topbar-btn",
          "aria-label": "الإشعارات",
          onClick: () => navigate("/notifications"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z", strokeLinejoin: "round" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10 21a2 2 0 0 0 4 0", strokeLinecap: "round" })
            ] }),
            hasNotifications ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-topbar-bell-dot", "aria-hidden": "true" }) : null
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "ym-topbar-btn",
          "aria-label": "فتح القائمة",
          onClick: onMenuClick || (() => navigate("/settings")),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 6h16M4 12h16M4 18h16", strokeLinecap: "round" }) })
        }
      )
    ] }),
    isHome ? /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "ym-topbar-shortcuts", "aria-label": "اختصارات الصفحة الرئيسية", children: HOME_SHORTCUTS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      NavLink,
      {
        to: item.to,
        className: ({ isActive }) => `ym-topbar-shortcut ${isActive ? "is-active" : ""}`,
        children: item.label
      },
      item.to
    )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-topbar-shortcuts-spacer", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "ym-topbar-brand", "aria-label": "الرئيسية - يام شات", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-topbar-wordmark", children: "YAMSHAT" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-topbar-logo", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 32 32", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "ym-logo-grad", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#A78BFA" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#6D28D9" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: "M6 4 L16 18 L26 4 L21 4 L16 11 L11 4 Z M14 18 L18 18 L18 28 L14 28 Z",
            fill: "url(#ym-logo-grad)"
          }
        )
      ] }) })
    ] })
  ] }) });
}
const MobileTopBar$1 = reactExports.memo(MobileTopBar);
const DEFAULT_TABS = [
  { id: "home", label: "الرئيسية" },
  { id: "trending", label: "الرائج" },
  { id: "following", label: "المتابعون" }
];
function MobileTabs({ tabs = DEFAULT_TABS, activeId = "home", onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "ym-tabs", "aria-label": "أقسام الخلاصة", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-tabs-inner", role: "tablist", children: tabs.map((t) => {
    const isActive = t.id === activeId;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": isActive,
        className: `ym-tab ${isActive ? "is-active" : ""}`,
        onClick: () => onChange?.(t.id),
        children: t.label
      },
      t.id
    );
  }) }) });
}
const MobileTabs$1 = reactExports.memo(MobileTabs);
function MobileLayout({ children, showTabs }) {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/feed";
  const tabsVisible = showTabs ?? isHome;
  const [activeTab, setActiveTab] = reactExports.useState("home");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mobile-layout", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(MobileTopBar$1, {}),
    tabsVisible ? /* @__PURE__ */ jsxRuntimeExports.jsx(MobileTabs$1, { activeId: activeTab, onChange: setActiveTab }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "main",
      {
        className: "mobile-content",
        style: !tabsVisible ? { paddingTop: "calc(var(--ym-topbar-h) + env(safe-area-inset-top, 0px) + 12px)" } : void 0,
        children
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNav$1, {})
  ] });
}
const MobileLayout$1 = reactExports.memo(MobileLayout);
function Sidebar() {
  const location = useLocation();
  const menuItems = [
    { path: "/", icon: "🏠", label: "الرئيسية" },
    { path: "/stories", icon: "📱", label: "القصص" },
    { path: "/reels", icon: "🎬", label: "الريلز" },
    { path: "/groups", icon: "👥", label: "المجموعات" },
    { path: "/live/control", icon: "🔴", label: "بث مباشر" },
    { path: "/chat", icon: "💬", label: "الرسائل" },
    { path: "/notifications", icon: "🔔", label: "التنبيهات" },
    { path: "/profile", icon: "👤", label: "الملف الشخصي" },
    { path: "/settings", icon: "⚙️", label: "الإعدادات" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "sidebar glass", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sidebar-logo", style: { display: "flex", alignItems: "center", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 42, alt: "Yamshat", className: "desktop-sidebar-brand" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0 }, children: "YAMSHAT" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "sidebar-nav", children: menuItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: item.path,
        className: `sidebar-item ${location.pathname === item.path ? "active" : ""}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "item-icon", children: item.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "item-label", children: item.label })
        ]
      },
      item.path
    )) })
  ] });
}
function RightPanel() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "right-panel glass", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "اقتراحات لك" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "suggestions-list", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "empty-msg", children: "لا يوجد اقتراحات حالياً" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "الترند الحالي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "trending-list", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "trending-item", children: "#يم_شات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "trending-item", children: "#بث_مباشر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "trending-item", children: "#تقنية" })
      ] })
    ] })
  ] });
}
function DesktopLayout({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-layout yamshat-desktop-layout", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "desktop-feed", children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RightPanel, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @media (max-width: 1023.98px) {
          .yamshat-desktop-layout {
            grid-template-columns: 1fr;
          }

          .yamshat-desktop-layout > aside,
          .yamshat-desktop-layout > .right-panel {
            display: none !important;
          }
        }
      ` })
  ] });
}
function MainLayout({ children }) {
  const mobile = useIsMobile();
  return mobile ? /* @__PURE__ */ jsxRuntimeExports.jsx(MobileLayout$1, { children }) : /* @__PURE__ */ jsxRuntimeExports.jsx(DesktopLayout, { children });
}
const MainLayout$1 = reactExports.memo(MainLayout);
function MobileComposer({ onFocus, onMedia, onGif, onEmoji }) {
  const open = (action) => {
    if (onFocus) {
      onFocus(action);
      return;
    }
    window.dispatchEvent(new CustomEvent("yamshat:open-composer", { detail: { action } }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "ym-composer",
      role: "button",
      tabIndex: 0,
      onClick: () => open(null),
      onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && open(null),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-composer-avatar", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 3 L12 12 L18 3 L15 3 L12 7 L9 3 Z M10 12 L14 12 L14 21 L10 21 Z", fill: "#fff" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "ym-composer-input",
            placeholder: "بماذا تفكر؟",
            readOnly: true,
            "aria-label": "بماذا تفكر؟",
            onFocus: (e) => {
              e.target.blur();
              open(null);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-composer-actions", onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "ym-composer-action",
              "aria-label": "إضافة صورة",
              onClick: () => onMedia ? onMedia() : open("image"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2", stroke: "currentColor", fill: "none", strokeWidth: "1.8" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "10", r: "1.5", fill: "currentColor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 17 L15 11 L5 19", stroke: "currentColor", fill: "none", strokeWidth: "1.8", strokeLinejoin: "round" })
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "ym-composer-action",
              "aria-label": "إضافة GIF",
              onClick: () => onGif ? onGif() : open(null),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-gif-pill", children: "GIF" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "ym-composer-action",
              "aria-label": "إضافة إيموجي",
              onClick: () => onEmoji ? onEmoji() : open("emoji"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", fill: "none", strokeWidth: "1.8" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "9", cy: "10", r: "1.2", fill: "currentColor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "15", cy: "10", r: "1.2", fill: "currentColor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M8 14.5 C9.5 16.5, 14.5 16.5, 16 14.5",
                    stroke: "currentColor",
                    fill: "none",
                    strokeWidth: "1.8",
                    strokeLinecap: "round"
                  }
                )
              ] })
            }
          )
        ] })
      ]
    }
  );
}
const MobileComposer$1 = reactExports.memo(MobileComposer);
const DEFAULT_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "updates", label: "التحديثات" },
  { id: "ads", label: "الإعلانات" },
  { id: "community", label: "المجتمع" }
];
function MobileFilterPills({ filters = DEFAULT_FILTERS, activeId = "all", onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-filters", role: "tablist", "aria-label": "فلاتر الخلاصة", children: filters.map((f) => {
    const isActive = f.id === activeId;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        role: "tab",
        "aria-selected": isActive,
        className: `ym-filter-pill ${isActive ? "is-active" : ""}`,
        onClick: () => onChange?.(f.id),
        children: f.label
      },
      f.id
    );
  }) });
}
const MobileFilterPills$1 = reactExports.memo(MobileFilterPills);
function VerifiedBadge() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-verified", "aria-label": "حساب موثّق", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 12.5 L11 14.5 L15.5 10", stroke: "#fff", strokeWidth: "2.5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }) }) });
}
function YamshatY({ size = 22 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size, alt: "Yamshat", shadow: false, className: "ym-inline-brand" });
}
function formatCount(n) {
  if (n == null || Number.isNaN(Number(n))) return "0";
  const num = Number(n);
  if (num >= 1e6) return `${(num / 1e6).toFixed(1).replace(/\.0$/, "")} مليون`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1).replace(/\.0$/, "")} ألف`;
  return String(num);
}
function renderTextWithHashtags(text = "") {
  const parts = String(text).split(/(\s+)/);
  return parts.map((part, i) => {
    if (/^#[\w\u0600-\u06FF_]+/.test(part)) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hashtag", children: part }, i);
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: part }, i);
  });
}
function MobilePostCard({
  post = {},
  onLike,
  onComment,
  onShare,
  onSave,
  onMore
}) {
  const navigate = useNavigate();
  const {
    authorName = "مستخدم",
    handle = "@user",
    timeText = "منذ قليل",
    verified = false,
    avatarUrl = "",
    text = "",
    banner = null,
    liked = false,
    saved = false,
    likes = 0,
    comments = 0,
    reposts = 0,
    is_live = false,
    live_stream_id = null,
    viewers = 0,
    thumbnail = null,
    media = []
  } = post;
  const liveThumbnail = thumbnail || media && media[0]?.url || "";
  const handleClick = (handler) => (e) => {
    e?.stopPropagation?.();
    handler?.(post);
  };
  const handleLiveCardClick = (e) => {
    e?.stopPropagation();
    if (live_stream_id) {
      navigate(`/live/view/${live_stream_id}`);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "ym-post", "aria-label": `منشور من ${authorName}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ym-post-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-post-avatar", children: avatarUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatarUrl, alt: "", loading: "lazy" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatY, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-post-meta", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-author", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "name", children: authorName }),
        verified ? /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedBadge, {}) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ym-post-sub", style: { marginInlineStart: 4 }, children: [
          handle,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dot" }),
          timeText
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ym-post-more", "aria-label": "المزيد", onClick: handleClick(onMore), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "5", cy: "12", r: "1.6", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "1.6", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "19", cy: "12", r: "1.6", fill: "currentColor" })
      ] }) })
    ] }),
    text ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-post-body", children: renderTextWithHashtags(text) }) : null,
    is_live ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-live-banner", onClick: handleLiveCardClick, style: {
      position: "relative",
      borderRadius: "16px",
      overflow: "hidden",
      cursor: "pointer",
      aspectRatio: "16/9",
      background: "#000",
      margin: "8px 0"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: liveThumbnail || "https://via.placeholder.com/800x450?text=Live+Stream", alt: "Live", style: { width: "100%", height: "100%", objectFit: "cover" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)",
        zIndex: 1
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        top: "12px",
        left: "12px",
        background: "linear-gradient(135deg, #ef4444, #f97316)",
        color: "white",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        animation: "pulse 2s ease-in-out infinite",
        zIndex: 2
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { width: 8, height: 8, background: "white", borderRadius: "50%", animation: "blink 1s ease-in-out infinite" } }),
        " مباشر"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "rgba(0,0,0,0.4)",
        color: "white",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        backdropFilter: "blur(10px)",
        zIndex: 2
      }, children: [
        "👁 ",
        formatCount(viewers)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        bottom: "0",
        left: "0",
        right: "0",
        background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
        padding: "30px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 2
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "bold", color: "white" }, children: text || "بث مباشر جديد" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "28px", height: "28px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid white", boxShadow: "0 0 8px rgba(255,255,255,0.3)" }, children: avatarUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatarUrl, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: "100%", background: "linear-gradient(135deg, #7c3aed, #3b82f6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }, children: authorName.charAt(0) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "white", fontSize: "13px", fontWeight: "700", lineHeight: 1.1 }, children: [
                authorName,
                " ",
                verified && /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedBadge, {})
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "rgba(255,255,255,0.8)", fontSize: "11px" }, children: [
                "@",
                handle.replace("@", "")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleLiveCardClick, style: {
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "10px",
            fontWeight: "800",
            fontSize: "12px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)",
            transition: "transform 0.2s"
          }, children: "انضم الآن" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
          ` })
    ] }) : banner ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-post-banner", children: banner.type === "image" && banner.url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: banner.url, alt: banner.title || "", loading: "lazy" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-banner-overlay", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "brand-logo", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 56, alt: "Yamshat", shadow: false, className: "ym-banner-brand" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "brand-name", children: banner.title || "YAMSHAT" }),
      banner.slogan ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "brand-slogan", children: banner.slogan }) : null
    ] }) }) : null,
    likes > 0 || comments > 0 || reposts > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-stats", style: {
      display: "flex",
      gap: "12px",
      padding: "8px 0",
      fontSize: "13px",
      color: "var(--text-muted, #65676b)",
      borderBottom: "1px solid var(--line, #e5e5ea)",
      marginBottom: "8px"
    }, children: [
      likes > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        formatCount(likes),
        " إعجاب"
      ] }),
      comments > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        formatCount(comments),
        " تعليق"
      ] }),
      reposts > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        formatCount(reposts),
        " مشاركة"
      ] })
    ] }) : null,
    !is_live ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-actions", role: "group", "aria-label": "إجراءات المنشور", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `ym-action like ${liked ? "is-active" : ""}`, onClick: handleClick(onLike), "aria-label": "إعجاب", "aria-pressed": liked, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z", strokeLinejoin: "round" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "label", children: [
          "أعجبني ",
          likes > 0 ? `(${formatCount(likes)})` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ym-action", onClick: handleClick(onComment), "aria-label": "تعليق", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 4.6A7.97 7.97 0 0 1 21 12Z", strokeLinejoin: "round" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "label", children: [
          "تعليق ",
          comments > 0 ? `(${formatCount(comments)})` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ym-action", onClick: handleClick(onShare), "aria-label": "مشاركة", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 16V4 M7 9l5-5 5 5 M5 20h14", strokeLinecap: "round", strokeLinejoin: "round" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "label", children: [
          "مشاركة ",
          reposts > 0 ? `(${formatCount(reposts)})` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `ym-action save ${saved ? "is-active" : ""}`, onClick: handleClick(onSave), "aria-label": "حفظ", "aria-pressed": saved, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 4 H18 V21 L12 16 L6 21 Z", strokeLinejoin: "round", fill: saved ? "currentColor" : "none" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "حفظ" })
      ] })
    ] }) : null
  ] });
}
const MobilePostCard$1 = reactExports.memo(MobilePostCard);
function MobileComposeModal({ open, onClose, initialAction = null }) {
  const [text, setText] = reactExports.useState("");
  const [mediaFile, setMediaFile] = reactExports.useState(null);
  const [mediaPreview, setMediaPreview] = reactExports.useState("");
  const [uploadedMediaUrl, setUploadedMediaUrl] = reactExports.useState("");
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const textareaRef = reactExports.useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  reactExports.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      textareaRef.current?.focus();
      if (initialAction === "image" && fileInputRef.current) {
        fileInputRef.current.accept = "image/*";
        fileInputRef.current.click();
      } else if (initialAction === "video" && fileInputRef.current) {
        fileInputRef.current.accept = "video/*";
        fileInputRef.current.click();
      }
    }, 80);
    return () => clearTimeout(t);
  }, [open, initialAction]);
  reactExports.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  const reset = () => {
    setText("");
    setMediaFile(null);
    setMediaPreview("");
    setUploadedMediaUrl("");
    setIsUploading(false);
    setIsSubmitting(false);
  };
  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose?.();
  };
  const handlePickFile = (accept = "image/*,video/*") => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  };
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(localUrl);
    setUploadedMediaUrl("");
    setIsUploading(true);
    try {
      const res = await uploadPostMedia(file);
      const url = res?.data?.url || res?.data?.media_url || res?.data?.path || "";
      if (url) {
        setUploadedMediaUrl(url);
      } else {
        throw new Error("No URL in upload response");
      }
    } catch (err) {
      console.error("Upload failed", err);
      pushToast?.({ type: "error", title: "تعذر رفع الملف", description: "حاول مرة أخرى." });
      setMediaFile(null);
      setMediaPreview("");
    } finally {
      setIsUploading(false);
    }
  };
  const handleSubmit = async () => {
    const content = text.trim();
    if (!content && !uploadedMediaUrl) {
      pushToast?.({ type: "info", title: "لا يوجد محتوى", description: "اكتب نصاً أو أضف وسائط." });
      return;
    }
    if (isUploading) {
      pushToast?.({ type: "info", title: "جارٍ رفع الملف...", description: "انتظر اكتمال الرفع." });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        content,
        status: "published"
      };
      if (uploadedMediaUrl) {
        payload.media_url = uploadedMediaUrl;
        payload.image_url = uploadedMediaUrl;
        payload.media_urls = [uploadedMediaUrl];
      }
      const createdPostResponse = await createPost(payload);
      const createdPost = createdPostResponse?.data || null;
      if (createdPost) {
        injectPostIntoFeedCache(queryClient, createdPost);
      } else {
        clearLocalFeedCaches();
      }
      await queryClient.invalidateQueries({ queryKey: ["feed-data"] });
      pushToast?.({ type: "success", title: "تم نشر المنشور بنجاح" });
      reset();
      onClose?.();
    } catch (err) {
      console.error("Create post failed", err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "تعذر نشر المنشور";
      pushToast?.({ type: "error", title: msg });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-modal-overlay", role: "dialog", "aria-modal": "true", "aria-label": "إنشاء منشور", onClick: handleClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ym-modal-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ym-modal-close", onClick: handleClose, "aria-label": "إغلاق", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 6 L18 18 M18 6 L6 18", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "منشور جديد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "ym-modal-publish",
          onClick: handleSubmit,
          disabled: isSubmitting || isUploading || !text.trim() && !uploadedMediaUrl,
          children: isSubmitting ? "ينشر..." : "نشر"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-modal-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          ref: textareaRef,
          className: "ym-modal-textarea",
          placeholder: "بماذا تفكر؟",
          value: text,
          onChange: (e) => setText(e.target.value),
          rows: 6,
          maxLength: 2e3,
          dir: "auto"
        }
      ),
      mediaPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-modal-media-preview", children: [
        mediaFile?.type?.startsWith("video/") ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: mediaPreview, controls: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveMediaUrl(uploadedMediaUrl) || mediaPreview, alt: "معاينة" }),
        isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-modal-upload-progress", children: "جارٍ الرفع..." }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "ym-modal-media-remove",
            "aria-label": "إزالة الوسائط",
            onClick: () => {
              setMediaFile(null);
              setMediaPreview("");
              setUploadedMediaUrl("");
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 6 L18 18 M18 6 L6 18", stroke: "#fff", strokeWidth: "2.5", strokeLinecap: "round" }) })
          }
        )
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-modal-counter", children: [
        text.length,
        " / 2000"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "ym-modal-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ym-modal-action", onClick: () => handlePickFile("image/*"), "aria-label": "إضافة صورة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2", stroke: "currentColor", strokeWidth: "1.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "10", r: "1.5", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 17 L15 11 L5 19", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ym-modal-action", onClick: () => handlePickFile("video/*"), "aria-label": "إضافة فيديو", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "6", width: "14", height: "12", rx: "2", stroke: "currentColor", strokeWidth: "1.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M17 10 L22 7 V17 L17 14 Z", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ym-modal-action", "aria-label": "إيموجي", onClick: () => {
        setText((t) => t + "😊");
        textareaRef.current?.focus();
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "9", stroke: "currentColor", strokeWidth: "1.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "9", cy: "10", r: "1.2", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "15", cy: "10", r: "1.2", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 14.5 C9.5 16.5, 14.5 16.5, 16 14.5", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "image/*,video/*",
          hidden: true,
          onChange: handleFileChange
        }
      )
    ] })
  ] }) });
}
const MobileComposeModal$1 = reactExports.memo(MobileComposeModal);
function MobileCommentsSheet({ open, postId, onClose }) {
  const [comments, setComments] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [draft, setDraft] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  reactExports.useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    setLoading(true);
    getComments(postId).then((res) => {
      if (cancelled) return;
      const data = res?.data;
      const list = Array.isArray(data) ? data : data?.comments || data?.items || [];
      setComments(list);
    }).catch((err) => {
      const status = err?.response?.status;
      if (status && status !== 500) {
        console.warn("Failed to load comments", err?.message || err);
      }
      if (!cancelled) setComments([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, postId]);
  reactExports.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !postId) return;
    setSending(true);
    try {
      const res = await addComment(postId, content);
      const newComment = res?.data?.comment || res?.data || {
        id: `local-${Date.now()}`,
        content,
        author_name: "أنت",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      setComments((prev) => [newComment, ...prev]);
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
      pushToast?.({ type: "success", title: "تمت إضافة التعليق" });
    } catch (err) {
      console.error("Add comment failed", err);
      pushToast?.({ type: "error", title: "تعذر إضافة التعليق" });
    } finally {
      setSending(false);
    }
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-sheet-overlay", role: "dialog", "aria-modal": "true", "aria-label": "التعليقات", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-sheet", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-sheet-handle", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ym-sheet-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "التعليقات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ym-sheet-close", onClick: onClose, "aria-label": "إغلاق", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 6 L18 18 M18 6 L6 18", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-sheet-body", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-sheet-empty", children: "جارٍ التحميل..." }) : comments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-sheet-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "icon", children: "💬" }),
      "لا توجد تعليقات بعد. كن أول من يعلّق!"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "ym-comment-list", children: comments.map((c) => {
      const author = c.author_name || c.username || c.user || "مستخدم";
      const avatar = resolveMediaUrl(c.user_avatar || c.avatar || c.author_avatar || "");
      const txt = c.content || c.text || "";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "ym-comment-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-comment-avatar", children: avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatar, alt: "", loading: "lazy" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ph", children: String(author).charAt(0) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-comment-body", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-comment-author", children: author }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-comment-text", dir: "auto", children: txt })
        ] })
      ] }, c.id || `c-${Math.random()}`);
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "ym-sheet-composer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          placeholder: "اكتب تعليقاً...",
          value: draft,
          onChange: (e) => setDraft(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          },
          disabled: sending,
          dir: "auto",
          className: "ym-sheet-input"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "ym-sheet-send",
          onClick: handleSend,
          disabled: !draft.trim() || sending,
          "aria-label": "إرسال",
          children: sending ? "..." : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3 12 L21 4 L17 21 L13 13 Z", fill: "currentColor" }) })
        }
      )
    ] })
  ] }) });
}
const MobileCommentsSheet$1 = reactExports.memo(MobileCommentsSheet);
function useFeed(options = {}) {
  const {
    tab,
    filter,
    filterType,
    sort,
    sortBy,
    limit = 10,
    includeDrafts = false,
    pollingInterval = 3e4,
    initialData
  } = options;
  const effectiveFilter = String(filterType || tab || filter || "all").trim().toLowerCase();
  const effectiveSort = String(sortBy || sort || (filter === "latest" ? "recent" : "recent")).trim().toLowerCase();
  const pageSize = Math.max(Number(limit) || 10, 1);
  const lastFetchRef = reactExports.useRef(Date.now());
  const query = useInfiniteQuery({
    queryKey: ["feed-data", effectiveFilter, effectiveSort, pageSize, Boolean(includeDrafts)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({
        page: pageParam,
        limit: pageSize,
        filterType: effectiveFilter,
        sortBy: effectiveSort,
        includeDrafts
      });
      lastFetchRef.current = Date.now();
      return {
        items: response.data || [],
        meta: response.meta || {}
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = Boolean(
        lastPage?.meta?.pagination?.has_more ?? lastPage?.meta?.has_more ?? (Array.isArray(lastPage?.items) && lastPage.items.length === pageSize)
      );
      return hasMore ? allPages.length + 1 : void 0;
    },
    staleTime: 5 * 60 * 1e3,
    cacheTime: 30 * 60 * 1e3,
    refetchOnWindowFocus: true,
    initialData,
    refetchInterval: (data) => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;
      return data?.pages?.length === 1 ? pollingInterval : false;
    }
  });
  const posts = sortPostsNewestFirst(query.data?.pages.flatMap((page) => page.items || []) || []);
  const meta = query.data?.pages?.[0]?.meta || {};
  return {
    posts,
    meta,
    ...query,
    lastFetched: lastFetchRef.current
  };
}
const FEED_CACHE_PREFIX = "yamshat:feed:cache:v2";
const CACHE_TTL_MS = 1 * 60 * 1e3;
function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function buildCacheKey({ filterType = "all", sortBy = "recent", limit = 12 }) {
  return `${FEED_CACHE_PREFIX}:${filterType}:${sortBy}:${limit}`;
}
function loadCachedFeed(key) {
  if (typeof window === "undefined") return null;
  const parsed = safeParse(window.localStorage.getItem(key) || "null");
  if (!parsed?.timestamp || !parsed?.data) return null;
  if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
  return parsed.data;
}
function persistCachedFeed(key, data) {
  if (typeof window === "undefined" || !data?.pages?.length) return;
  const payload = {
    timestamp: Date.now(),
    data: {
      pages: data.pages.map((page) => ({
        items: Array.isArray(page?.items) ? page.items.slice(0, 24) : [],
        meta: page?.meta || {}
      })),
      pageParams: Array.isArray(data.pageParams) ? data.pageParams : [1]
    }
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}
function useSmartFeed(options = {}) {
  const {
    filterType = "all",
    sortBy = "recent",
    limit = 12,
    ...rest
  } = options;
  const cacheKey = reactExports.useMemo(
    () => buildCacheKey({ filterType, sortBy, limit }),
    [filterType, sortBy, limit]
  );
  const initialData = reactExports.useMemo(() => loadCachedFeed(cacheKey), [cacheKey]);
  const feed = useFeed({
    ...rest,
    filterType,
    sortBy,
    limit,
    initialData
  });
  reactExports.useEffect(() => {
    if (feed.data?.pages?.length) persistCachedFeed(cacheKey, feed.data);
  }, [cacheKey, feed.data]);
  return {
    ...feed,
    cacheKey,
    isHydratedFromCache: Boolean(initialData?.pages?.length)
  };
}
function timeAgoAr$1(dateLike) {
  if (!dateLike) return "الآن";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "الآن";
  const diffSec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1e3));
  if (diffSec < 60) return "الآن";
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const days = Math.floor(h / 24);
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `منذ ${months} شهر`;
  }
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
function isVideoMediaUrl$1(value = "", post = {}) {
  const candidate = String(value || "");
  return Boolean(
    post.has_video || post.is_reel || String(post.media_type || "").toLowerCase() === "video" || /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(candidate) || /\b(video|reel|stream)\b/i.test(candidate)
  );
}
function buildBanner(post = {}) {
  const rawMedia = Array.isArray(post.media_urls) && post.media_urls.length ? post.media_urls : [post.image_url || post.media_url || post.thumbnail_url || post.media].filter(Boolean);
  const firstMedia = rawMedia[0] || "";
  const resolved = resolveMediaUrl(firstMedia);
  if (!resolved || isVideoMediaUrl$1(resolved || firstMedia, post)) return null;
  return { type: "image", url: resolved };
}
function normalizePost(p, i) {
  const author = p.author_name || p.username || p.user || "مستخدم يام شات";
  const handle = (p.username || p.user || `user${i}`).toString();
  const verified = Boolean(p.verified || p.is_verified || p.official);
  const isLive = Boolean(
    p.is_live || p.is_live_stream || p.has_live_stream || p.type === "live" || p.type === "LIVE" || p.post_type === "LIVE"
  );
  return {
    id: p.id ?? `p-${i}`,
    rawId: p.id,
    authorName: author,
    handle: `@${handle.replace(/^@/, "")}`,
    timeText: isLive ? "مباشر الآن" : timeAgoAr$1(p.created_at || p.published_at || p.createdAt),
    verified,
    avatarUrl: resolveMediaUrl(p.user_avatar || p.avatar || p.author_avatar || ""),
    text: p.content || p.text || p.description || p.title || "",
    banner: buildBanner(p),
    likes: Number(p.likes_count ?? p.like_count ?? p.likes ?? 0),
    comments: Number(p.comments_count ?? p.comment_count ?? p.comments ?? 0),
    reposts: Number(p.share_count ?? p.shares ?? p.reposts ?? 0),
    liked: Boolean(p.is_liked ?? p.liked_by_me ?? p.liked),
    reposted: Boolean(p.reposted ?? p.is_reposted),
    saved: Boolean(p.is_saved ?? p.saved_by_me ?? p.saved),
    // حقول البث
    type: p.type || (isLive ? "live" : "POST"),
    is_live: isLive,
    live_stream_id: p.live_stream_id || p.streamId || p.live_id,
    viewers: Number(p.viewers_count || p.viewers || p.viewer_count || 0),
    thumbnail: resolveMediaUrl(p.thumbnail || p.thumbnail_url || p.preview_url || p.media_url || ""),
    duration: p.duration
  };
}
function FeedMobile() {
  const [activeFilter, setActiveFilter] = reactExports.useState("all");
  const [composerOpen, setComposerOpen] = reactExports.useState(false);
  const [composerAction, setComposerAction] = reactExports.useState(null);
  const [commentsPostId, setCommentsPostId] = reactExports.useState(null);
  const [moreMenuPost, setMoreMenuPost] = reactExports.useState(null);
  const [moreMenuBusy, setMoreMenuBusy] = reactExports.useState(false);
  const [moreMenuState, setMoreMenuState] = reactExports.useState({ following: false, muted: false, blocked: false });
  const [overlay, setOverlay] = reactExports.useState({});
  const [livePosts, setLivePosts] = reactExports.useState([]);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const session = useAppStore((s) => s.session);
  const feedType = reactExports.useMemo(() => {
    if (activeFilter === "posts") return "POST";
    if (activeFilter === "stories") return "STORY";
    if (activeFilter === "live") return "LIVE";
    return "all";
  }, [activeFilter]);
  const smart = useSmartFeed?.({ filterType: feedType });
  const rawPosts = smart?.posts || smart?.data || smart?.items || [];
  const loading = smart?.isLoading || smart?.loading;
  const error = smart?.error;
  const loadLivePosts = reactExports.useCallback(() => {
    try {
      const posts2 = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
      const liveOnly = posts2.filter((p) => p.type === "live" || p.is_live);
      setLivePosts(liveOnly);
    } catch (e) {
      console.error("Error loading live posts:", e);
    }
  }, []);
  reactExports.useEffect(() => {
    loadLivePosts();
    const handleLivePostCreated = () => loadLivePosts();
    const handleStreamStarted = () => loadLivePosts();
    const handleStreamEnded = () => loadLivePosts();
    window.addEventListener("yamshat:live-post-created", handleLivePostCreated);
    window.addEventListener("yamshat:stream-started", handleStreamStarted);
    window.addEventListener("yamshat:stream-ended", handleStreamEnded);
    const interval = setInterval(loadLivePosts, 3e3);
    return () => {
      window.removeEventListener("yamshat:live-post-created", handleLivePostCreated);
      window.removeEventListener("yamshat:stream-started", handleStreamStarted);
      window.removeEventListener("yamshat:stream-ended", handleStreamEnded);
      clearInterval(interval);
    };
  }, [loadLivePosts]);
  reactExports.useEffect(() => {
    const handler = (e) => {
      setComposerAction(e?.detail?.action || null);
      setComposerOpen(true);
    };
    window.addEventListener("yamshat:open-composer", handler);
    const url = new URL(window.location.href);
    if (url.searchParams.get("compose") === "1" || /[?&]compose=1/.test(window.location.hash)) {
      setComposerOpen(true);
      try {
        url.searchParams.delete("compose");
        window.history.replaceState(null, "", url.toString());
      } catch {
      }
    }
    return () => window.removeEventListener("yamshat:open-composer", handler);
  }, []);
  const posts = reactExports.useMemo(() => {
    const normalizedLivePosts = livePosts.map((p, i) => normalizePost(p, i));
    const normalizedRawPosts = Array.isArray(rawPosts) ? rawPosts.map((p, i) => normalizePost(p, i)) : [];
    let list = [];
    if (activeFilter === "all") {
      list = [...normalizedLivePosts, ...normalizedRawPosts];
    } else if (activeFilter === "live") {
      list = normalizedLivePosts;
    } else {
      list = normalizedRawPosts;
    }
    if (list.length === 0 && (activeFilter === "all" || activeFilter === "posts")) {
      list = [];
    }
    return list.map((p) => {
      const o = overlay[p.id];
      return o ? { ...p, ...o } : p;
    });
  }, [rawPosts, overlay, activeFilter, livePosts]);
  const filtered = posts;
  const requireAuth = reactExports.useCallback(() => {
    if (!session) {
      pushToast?.({ type: "info", title: "يجب تسجيل الدخول", description: "لتتمكن من التفاعل مع المنشورات." });
      return false;
    }
    return true;
  }, [session, pushToast]);
  const setOverlayFor = reactExports.useCallback((id, patch) => {
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id] || {}, ...patch } }));
  }, []);
  const handleLike = reactExports.useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newLiked = !post.liked;
    const newLikes = Math.max(0, Number(post.likes || 0) + (newLiked ? 1 : -1));
    setOverlayFor(post.id, { liked: newLiked, likes: newLikes });
    try {
      await likePost(post.rawId);
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (err) {
      console.error("Like failed", err);
      setOverlayFor(post.id, { liked: post.liked, likes: Number(post.likes || 0) });
      pushToast?.({ type: "error", title: "تعذر تنفيذ الإعجاب" });
    }
  }, [requireAuth, setOverlayFor, queryClient, pushToast]);
  const handleSave = reactExports.useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newSaved = !post.saved;
    setOverlayFor(post.id, { saved: newSaved });
    try {
      await savePost(post.rawId);
      pushToast?.({ type: "success", title: newSaved ? "تم الحفظ" : "تمت إزالة الحفظ" });
    } catch (err) {
      console.error("Save failed", err);
      setOverlayFor(post.id, { saved: post.saved });
      pushToast?.({ type: "error", title: "تعذر حفظ المنشور" });
    }
  }, [requireAuth, setOverlayFor, pushToast]);
  const handleShare = reactExports.useCallback(async (post) => {
    const postUrl = `${window.location.origin}/#/post/${post.rawId || post.id}`;
    const shareData = {
      title: post.authorName,
      text: post.text?.slice(0, 200) || "منشور على يام شات",
      url: postUrl
    };
    let succeeded = false;
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        succeeded = true;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        pushToast?.({ type: "success", title: "تم نسخ رابط المنشور" });
        succeeded = true;
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        pushToast?.({ type: "info", title: "تم إلغاء المشاركة" });
      }
    }
    if (succeeded && post.rawId) {
      try {
        await sharePost(post.rawId, navigator.share ? "native" : "copy");
        const newReposts = Number(post.reposts || 0) + 1;
        setOverlayFor(post.id, { reposts: newReposts });
        queryClient.invalidateQueries({ queryKey: ["feed-data"] });
      } catch (err) {
        console.warn("share tracking failed", err);
      }
    }
  }, [pushToast, setOverlayFor, queryClient]);
  reactExports.useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newReposted = !post.reposted;
    const newReposts = Math.max(0, Number(post.reposts || 0) + (newReposted ? 1 : -1));
    setOverlayFor(post.id, { reposted: newReposted, reposts: newReposts });
    try {
      await sharePost(post.rawId, "repost");
      pushToast?.({ type: "success", title: newReposted ? "تمت إعادة النشر" : "تم إلغاء إعادة النشر" });
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (err) {
      console.error("Repost failed", err);
      setOverlayFor(post.id, { reposted: post.reposted, reposts: Number(post.reposts || 0) });
      pushToast?.({ type: "error", title: "تعذر إعادة النشر" });
    }
  }, [requireAuth, setOverlayFor, pushToast, queryClient]);
  const handleComment = reactExports.useCallback((post) => {
    if (!post?.rawId) {
      pushToast?.({ type: "info", title: "لا يمكن التعليق على المنشور الترحيبي" });
      return;
    }
    setCommentsPostId(post.rawId);
  }, [pushToast]);
  const handleMore = reactExports.useCallback((post) => {
    setMoreMenuPost(post);
    setMoreMenuState({
      following: Boolean(post?.following),
      muted: Boolean(post?.muted),
      blocked: Boolean(post?.blocked_by_me)
    });
  }, []);
  const closeMoreMenu = reactExports.useCallback(() => {
    setMoreMenuPost(null);
    setMoreMenuBusy(false);
  }, []);
  const handleMenuFollow = reactExports.useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || "").replace(/^@/, "");
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      const response = await followUser(username);
      const nextFollowing = Boolean(response?.data?.following ?? !moreMenuState.following);
      setMoreMenuState((prev) => ({ ...prev, following: nextFollowing }));
      pushToast?.({ type: "success", title: nextFollowing ? "تمت المتابعة" : "تم إلغاء المتابعة" });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر تحديث المتابعة", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.following, requireAuth, pushToast, closeMoreMenu]);
  const handleMenuMute = reactExports.useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || "").replace(/^@/, "");
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.muted) await unmuteUser(username);
      else await muteUser(username);
      const nextMuted = !moreMenuState.muted;
      setMoreMenuState((prev) => ({ ...prev, muted: nextMuted }));
      pushToast?.({ type: "success", title: nextMuted ? "تم الكتم" : "تم إلغاء الكتم" });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر تحديث الكتم", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.muted, requireAuth, pushToast, closeMoreMenu]);
  const handleMenuBlock = reactExports.useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || "").replace(/^@/, "");
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.blocked) await unblockUserApi(username);
      else await blockUserApi(username);
      const nextBlocked = !moreMenuState.blocked;
      setMoreMenuState((prev) => ({ ...prev, blocked: nextBlocked }));
      pushToast?.({ type: "success", title: nextBlocked ? "تم الحظر" : "تم إلغاء الحظر" });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر تحديث الحظر", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.blocked, requireAuth, pushToast, closeMoreMenu]);
  const handleMenuReport = reactExports.useCallback(() => {
    if (!moreMenuPost) return;
    try {
      const key = "yamshat_reported_posts";
      const current = JSON.parse(window.localStorage.getItem(key) || "[]");
      const next = Array.isArray(current) ? current : [];
      next.unshift({ id: moreMenuPost.id, username: moreMenuPost.handle, created_at: (/* @__PURE__ */ new Date()).toISOString() });
      window.localStorage.setItem(key, JSON.stringify(next.slice(0, 100)));
    } catch {
    }
    pushToast?.({ type: "success", title: "تم إرسال البلاغ للمراجعة" });
    closeMoreMenu();
  }, [moreMenuPost, pushToast, closeMoreMenu]);
  const handleMenuDeleteOwnPost = reactExports.useCallback(async () => {
    if (!moreMenuPost?.rawId) return;
    setMoreMenuBusy(true);
    try {
      await deletePost(moreMenuPost.rawId);
      pushToast?.({ type: "success", title: "تم حذف المنشور" });
      closeMoreMenu();
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر حذف المنشور", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, pushToast, queryClient, closeMoreMenu]);
  const isOwnMoreMenuPost = Boolean(moreMenuPost && (session?.username || session?.user_name || session?.handle) === String(moreMenuPost.handle || "").replace(/^@/, ""));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(MobileComposer$1, { onFocus: () => {
      setComposerAction(null);
      setComposerOpen(true);
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MobileFilterPills$1, { activeId: activeFilter, onChange: setActiveFilter }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "icon", children: "⚠️" }),
      "تعذر تحميل المنشورات. حاول لاحقاً."
    ] }) : null,
    loading && !filtered.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-feed", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post", "aria-busy": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-skeleton", style: { width: 44, height: 44, borderRadius: "50%" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-meta", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-skeleton", style: { width: "40%", height: 14 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-skeleton", style: { width: "25%", height: 12, marginTop: 6 } })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-skeleton", style: { width: "100%", height: 60 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-skeleton", style: { width: "100%", aspectRatio: "16/9" } })
    ] }, i)) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-feed", children: filtered.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      MobilePostCard$1,
      {
        post,
        onLike: handleLike,
        onComment: handleComment,
        onShare: handleShare,
        onSave: handleSave,
        onMore: handleMore
      },
      post.id
    )) }),
    !loading && filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "icon", children: "📭" }),
      "لا توجد منشورات في هذا التصنيف بعد."
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MobileComposeModal$1,
      {
        open: composerOpen,
        initialAction: composerAction,
        onClose: () => {
          setComposerOpen(false);
          setComposerAction(null);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MobileCommentsSheet$1,
      {
        open: Boolean(commentsPostId),
        postId: commentsPostId,
        onClose: () => setCommentsPostId(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: Boolean(moreMenuPost), onClose: closeMoreMenu, title: "خيارات المنشور", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "profile-modal-stack", children: [
      !isOwnMoreMenuPost ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab active", onClick: handleMenuFollow, disabled: moreMenuBusy, children: moreMenuState.following ? "إلغاء المتابعة" : "متابعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuMute, disabled: moreMenuBusy, children: moreMenuState.muted ? "إلغاء الكتم" : "كتم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuBlock, disabled: moreMenuBusy, children: moreMenuState.blocked ? "إلغاء الحظر" : "حظر" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuDeleteOwnPost, disabled: moreMenuBusy, children: "حذف المنشور" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuReport, disabled: moreMenuBusy, children: "بلاغ" })
    ] }) })
  ] });
}
const FeedMobile$1 = reactExports.memo(FeedMobile);
const DRAFT_KEY = "yamshat_post_draft";
const QUOTE_KEY = "yamshat_quote_draft";
function extractTags(text = "") {
  const hashtags = Array.from(new Set((text.match(/#[\p{L}\p{N}_-]+/gu) || []).map((item) => item.replace("#", ""))));
  const mentions = Array.from(new Set((text.match(/@[\p{L}\p{N}_.-]+/gu) || []).map((item) => item.replace("@", ""))));
  return { hashtags, mentions };
}
function PostComposer() {
  const [content, setContent] = reactExports.useState("");
  const [media, setMedia] = reactExports.useState(null);
  const [mediaPreview, setMediaPreview] = reactExports.useState(null);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [showScheduler, setShowScheduler] = reactExports.useState(false);
  const [scheduledDate, setScheduledDate] = reactExports.useState("");
  const [showPollBuilder, setShowPollBuilder] = reactExports.useState(false);
  const [pollQuestion, setPollQuestion] = reactExports.useState("");
  const [pollOptions, setPollOptions] = reactExports.useState(["", ""]);
  const [isPinned, setIsPinned] = reactExports.useState(false);
  const [quoteDraft, setQuoteDraft] = reactExports.useState(null);
  const [isDragActive, setIsDragActive] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const textareaRef = reactExports.useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  reactExports.useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    const savedQuote = localStorage.getItem(QUOTE_KEY);
    if (savedDraft) setContent(savedDraft);
    if (savedQuote) {
      try {
        setQuoteDraft(JSON.parse(savedQuote));
      } catch {
        localStorage.removeItem(QUOTE_KEY);
      }
    }
    const focusComposer = () => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const handleQuotedPost = () => {
      try {
        const nextValue = JSON.parse(localStorage.getItem(QUOTE_KEY) || "null");
        setQuoteDraft(nextValue);
      } catch {
        setQuoteDraft(null);
      }
      window.setTimeout(focusComposer, 30);
    };
    const handleComposerAction = (event) => {
      const action = event?.detail?.action;
      if (action === "image") {
        if (fileInputRef.current) {
          fileInputRef.current.accept = "image/*";
          fileInputRef.current.click();
        }
        return;
      }
      if (action === "video") {
        if (fileInputRef.current) {
          fileInputRef.current.accept = "video/*";
          fileInputRef.current.click();
        }
        return;
      }
      if (fileInputRef.current) fileInputRef.current.accept = "image/*,video/*";
      if (action === "thought") {
        setContent((prev) => prev || "شاركنا رأيك... ");
      }
      window.setTimeout(focusComposer, 30);
    };
    window.addEventListener("yamshat:quote-post", handleQuotedPost);
    window.addEventListener("yamshat:composer-action", handleComposerAction);
    return () => {
      window.removeEventListener("yamshat:quote-post", handleQuotedPost);
      window.removeEventListener("yamshat:composer-action", handleComposerAction);
    };
  }, []);
  reactExports.useEffect(() => {
    const timer = window.setTimeout(() => {
      if (content.trim()) localStorage.setItem(DRAFT_KEY, content);
      else localStorage.removeItem(DRAFT_KEY);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [content]);
  reactExports.useEffect(() => () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
  }, [mediaPreview]);
  const tagsPreview = reactExports.useMemo(() => extractTags(content), [content]);
  const clearComposer = () => {
    setContent("");
    setMedia(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setScheduledDate("");
    setShowScheduler(false);
    setShowPollBuilder(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setIsPinned(false);
    setQuoteDraft(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(QUOTE_KEY);
  };
  const addSnippet = (value) => {
    setContent((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${value}`);
  };
  const applySelectedFile = (file) => {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      pushToast({ type: "error", title: "الملف كبير جدًا", description: "الحد الأقصى 200 ميجا." });
      return;
    }
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };
  const handleMediaSelect = (event) => {
    const file = event.target.files?.[0];
    applySelectedFile(file);
  };
  const normalizedPollOptions = pollOptions.map((item) => item.trim()).filter(Boolean);
  const canSubmit = Boolean(content.trim() || media || quoteDraft || showPollBuilder && pollQuestion.trim() && normalizedPollOptions.length >= 2);
  const handleSubmit = async (status = "published") => {
    if (isUploading || !canSubmit) return;
    if (status === "scheduled" && !scheduledDate) {
      pushToast({ type: "warning", title: "حدد وقت الجدولة", description: "لازم تختار تاريخ ووقت قبل تأكيد الجدولة." });
      return;
    }
    if (showPollBuilder && (!pollQuestion.trim() || normalizedPollOptions.length < 2)) {
      pushToast({ type: "warning", title: "الاستطلاع غير مكتمل", description: "اكتب سؤال الاستطلاع وأضف خيارين على الأقل." });
      return;
    }
    setIsUploading(true);
    try {
      let mediaUrl = "";
      if (media) {
        const uploadRes = await mediaUploadService.uploadFile(media, {
          purpose: media?.type?.startsWith("video/") ? "post-video" : "post-image",
          onProgress: (payload) => {
            const percent = typeof payload === "number" ? Number(payload || 0) : Number(payload?.percent || 0);
            setUploadProgress(percent);
          }
        });
        mediaUrl = uploadRes?.mediaUrl || uploadRes?.url || uploadRes?.file_url || "";
      }
      const { hashtags, mentions } = extractTags(content);
      const poll = showPollBuilder ? normalizedPollOptions.map((label) => ({ label })) : void 0;
      const createdPostResponse = await createPost({
        content: pollQuestion.trim() ? `${pollQuestion.trim()}
${content}`.trim() : content,
        media_url: mediaUrl,
        status,
        scheduled_at: status === "scheduled" ? scheduledDate : null,
        is_pinned: isPinned,
        hashtags,
        mentions,
        poll,
        quote_source_id: quoteDraft?.id || null
      });
      const createdPost = createdPostResponse?.data || null;
      if (status === "published" && createdPost) {
        injectPostIntoFeedCache(queryClient, createdPost);
      } else {
        clearLocalFeedCaches();
      }
      pushToast({
        type: "success",
        title: status === "draft" ? "تم حفظ المسودة" : status === "scheduled" ? "تمت جدولة المنشور" : "تم نشر المنشور",
        description: isPinned ? "المنشور متجهز كمنشور مثبت." : void 0
      });
      clearComposer();
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (error) {
      pushToast({ type: "error", title: "فشل نشر المنشور", description: error?.response?.data?.detail || error?.message || "حاول مرة تانية." });
    } finally {
      setIsUploading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      style: {
        marginBottom: 16,
        padding: 18,
        border: "1px solid var(--line)",
        direction: "rtl",
        borderRadius: 22,
        background: "linear-gradient(180deg, rgba(13,17,29,0.96), rgba(8,12,22,0.94))"
      },
      onDragOver: (event) => {
        event.preventDefault();
        setIsDragActive(true);
      },
      onDragLeave: (event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setIsDragActive(false);
      },
      onDrop: (event) => {
        event.preventDefault();
        setIsDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        applySelectedFile(file);
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-header-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "composer-title", children: "إنشاء منشور" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "composer-subtitle", children: "رتّب الخيارات بالأعلى ثم اكتب المنشور أسفلها ليظهر بشكل أوضح في صفحة المنشورات." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `composer-status-badge ${isPinned ? "pinned" : ""}`, children: isPinned ? "منشور مثبت" : "منشور عادي" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-toolbar", "aria-label": "أدوات المنشور", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("#ترند"), children: "ترند#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("#هاشتاج"), children: "هاشتاج" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("@username"), children: "منشن" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("اقتباس: "), children: "اقتباس" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `composer-chip ${isPinned ? "active" : ""}`, onClick: () => setIsPinned((prev) => !prev), children: "تثبيت منشور" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-actions-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "composer-action-btn", onClick: () => fileInputRef.current?.click(), title: "رفع صورة أو فيديو", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🖼️" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "رفع الصورة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: `composer-action-btn ${showScheduler ? "active" : ""}`,
              onClick: () => setShowScheduler((prev) => !prev),
              title: "جدولة",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "📅" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "جدولة" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: `composer-action-btn ${showPollBuilder ? "active" : ""}`,
              onClick: () => setShowPollBuilder((prev) => !prev),
              title: "استطلاع",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🗳️" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "استطلاع" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "secondary",
              size: "small",
              onClick: () => handleSubmit("draft"),
              disabled: isUploading || !canSubmit,
              children: "حفظ المنشور"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "small",
              onClick: () => handleSubmit(showScheduler ? "scheduled" : "published"),
              loading: isUploading,
              disabled: isUploading || !canSubmit,
              children: showScheduler ? "تأكيد الجدولة" : "النشر"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", ref: fileInputRef, hidden: true, accept: "image/*,video/*", onChange: handleMediaSelect })
        ] }),
        showScheduler ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-scheduler-box", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "composer-field-label", children: "تحديد وقت النشر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "datetime-local",
              value: scheduledDate,
              onChange: (event) => setScheduledDate(event.target.value),
              className: "composer-datetime-input"
            }
          )
        ] }) : null,
        showPollBuilder ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-scheduler-box", style: { display: "grid", gap: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "composer-field-label", children: "سؤال الاستطلاع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: pollQuestion,
              onChange: (event) => setPollQuestion(event.target.value),
              className: "composer-datetime-input",
              placeholder: "مثال: أي تحسين تحبه أكثر في صفحة المنشورات؟"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 8 }, children: pollOptions.map((option, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: option,
                onChange: (event) => setPollOptions((prev) => prev.map((item, idx) => idx === index ? event.target.value : item)),
                className: "composer-datetime-input",
                placeholder: `الخيار ${index + 1}`
              }
            ),
            pollOptions.length > 2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => setPollOptions((prev) => prev.filter((_, idx) => idx !== index)), children: "حذف" }) : null
          ] }, `poll-option-${index}`)) }),
          pollOptions.length < 4 ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => setPollOptions((prev) => [...prev, ""]), children: "إضافة خيار" }) : null
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `composer-editor-shell ${isDragActive ? "drag-active" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-editor-topline", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "composer-field-label", children: "بماذا تفكر؟" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "composer-drop-hint", children: "اسحب وأسقط صورة أو فيديو أو GIF هنا" })
          ] }),
          quoteDraft ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-quote-box", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, marginBottom: 4 }, children: [
                "اقتباس من @",
                quoteDraft.username
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 13, lineHeight: 1.7 }, children: quoteDraft.content })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setQuoteDraft(null);
                  localStorage.removeItem(QUOTE_KEY);
                },
                className: "composer-close-btn",
                children: "✕"
              }
            )
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              ref: textareaRef,
              placeholder: "اكتب منشورك هنا... استخدم #هاشتاج أو @منشن لو حابب",
              value: content,
              onChange: (event) => setContent(event.target.value),
              className: "composer-textarea"
            }
          )
        ] }),
        tagsPreview.hashtags.length || tagsPreview.mentions.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-tags-preview", children: [
          tagsPreview.hashtags.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 13 }, children: [
            "هاشتاج: ",
            tagsPreview.hashtags.map((item) => `#${item}`).join(" · ")
          ] }) : null,
          tagsPreview.mentions.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 13 }, children: [
            "منشن: ",
            tagsPreview.mentions.map((item) => `@${item}`).join(" · ")
          ] }) : null
        ] }) : null,
        mediaPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "composer-media-preview", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setMedia(null);
                if (mediaPreview) URL.revokeObjectURL(mediaPreview);
                setMediaPreview(null);
              },
              className: "composer-close-btn media-close",
              children: "✕"
            }
          ),
          media?.type?.startsWith("video") ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: mediaPreview, style: { width: "100%", display: "block" }, controls: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: mediaPreview, style: { width: "100%", objectFit: "cover", display: "block" }, alt: "Preview" }),
          isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "composer-upload-progress-track", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "composer-upload-progress-fill", style: { width: `${uploadProgress}%` } }) }) : null
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .composer-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .composer-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
        }
        .composer-subtitle {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }
        .composer-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--muted);
          font-size: 12px;
          white-space: nowrap;
        }
        .composer-status-badge.pinned {
          background: rgba(16,185,129,0.14);
          border-color: rgba(16,185,129,0.3);
          color: #6ee7b7;
        }
        .composer-toolbar {
          display: flex;
          flex-direction: row-reverse;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
          align-items: center;
        }
        .composer-chip {
          border: 1px solid rgba(167, 139, 250, 0.25);
          background: rgba(139, 92, 246, 0.10);
          color: var(--text);
          padding: 8px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .composer-chip:hover {
          background: rgba(139, 92, 246, 0.16);
          border-color: rgba(167, 139, 250, 0.35);
        }
        .composer-chip.active {
          background: rgba(16,185,129,0.14);
          border-color: rgba(16,185,129,0.3);
          color: #6ee7b7;
        }
        .composer-actions-row {
          display: flex;
          flex-direction: row-reverse;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .composer-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: var(--text);
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .composer-action-btn:hover,
        .composer-action-btn.active {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(167, 139, 250, 0.3);
        }
        .composer-scheduler-box {
          margin-bottom: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.035);
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .composer-field-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
        }
        .composer-datetime-input {
          width: 100%;
          margin-top: 8px;
          background: var(--bg-input);
          color: var(--text);
          border: 1px solid var(--line);
          padding: 10px 12px;
          border-radius: 10px;
        }
        .composer-editor-shell {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
          padding: 14px;
          transition: all 0.2s ease;
        }
        .composer-editor-shell.drag-active {
          border-color: rgba(16,185,129,0.45);
          background: rgba(16,185,129,0.08);
        }
        .composer-editor-topline {
          display: flex;
          flex-direction: row-reverse;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .composer-drop-hint {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px dashed rgba(139, 92, 246, 0.28);
          color: var(--muted);
          font-size: 12px;
          background: rgba(139, 92, 246, 0.05);
        }
        .composer-quote-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-radius: 14px;
          padding: 12px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.18);
          margin-bottom: 12px;
        }
        .composer-close-btn {
          background: rgba(0,0,0,0.18);
          border: none;
          cursor: pointer;
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .composer-textarea {
          width: 100%;
          min-height: 120px;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 15px;
          resize: vertical;
          outline: none;
          line-height: 1.9;
          direction: rtl;
        }
        .composer-tags-preview {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }
        .composer-media-preview {
          position: relative;
          margin-top: 12px;
          border-radius: 14px;
          overflow: hidden;
          max-height: 320px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .composer-close-btn.media-close {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1;
          background: rgba(0,0,0,0.5);
        }
        .composer-upload-progress-track {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255,255,255,0.2);
        }
        .composer-upload-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          transition: width 0.2s;
        }
        @media (max-width: 1024px) {
          .composer-header-row,
          .composer-editor-topline {
            align-items: stretch;
          }
          .composer-toolbar {
            gap: 8px;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .composer-toolbar::-webkit-scrollbar {
            display: none;
          }
          .composer-chip {
            width: auto;
            min-width: max-content;
            justify-content: center;
            padding: 8px 12px;
            flex: 0 0 auto;
          }
          .composer-actions-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            padding: 8px 0;
          }
          .composer-action-btn,
          .composer-actions-row > button {
            width: 100%;
            min-width: 0;
            min-height: 54px;
            justify-content: center;
            padding-inline: 16px;
            font-size: 15px;
            font-weight: 700;
            border-radius: 14px;
          }
          .composer-action-btn span:first-child {
            font-size: 20px;
          }
          .composer-status-badge {
            align-self: flex-start;
          }
          .composer-drop-hint {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
          .composer-quote-box {
            flex-direction: column;
          }
          .composer-textarea {
            min-height: 96px;
            line-height: 1.75;
          }
        }
      ` })
      ]
    }
  );
}
const iconStyles = {
  width: "1em",
  height: "1em",
  display: "block"
};
function Path({ d, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d, fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", ...props });
}
function YamshatIcon({ name, size = 20, filled = false }) {
  const props = {
    viewBox: "0 0 24 24",
    style: { ...iconStyles, width: size, height: size },
    "aria-hidden": true
  };
  switch (name) {
    case "home":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4 10.5 12 4l8 6.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M6.5 9.8V20h11V9.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M9.5 20v-5.5h5V20" })
      ] });
    case "discover":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M13.6 10.4 17 7l-3.4 3.4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "m8.4 15.6 7.2-7.2-2.4 6-6 2.4Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 3.5a8.5 8.5 0 1 0 8.5 8.5" })
      ] });
    case "users":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M16.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M3.5 19c1.1-2.4 3-3.6 5.7-3.6S13.8 16.6 15 19" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M14.4 17.8c.7-1.3 1.8-2 3.4-2 1.3 0 2.3.5 3.2 1.7" })
      ] });
    case "bell":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M6.5 16.5h11l-1.2-1.7V10a4.3 4.3 0 0 0-8.6 0v4.8L6.5 16.5Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M10 18.5a2 2 0 0 0 4 0" })
      ] });
    case "message":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 6.5h14v9H9l-4 3v-3H5z" }) });
    case "bookmark":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 4.5h10V20l-5-3-5 3V4.5Z" }) });
    case "live":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3.2", fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "1.9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5.5 8.5a7.5 7.5 0 0 0 0 7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M18.5 8.5a7.5 7.5 0 0 1 0 7" })
      ] });
    case "groups":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 7h14" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 12h10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 17h7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M18 12v5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M15.5 14.5h5" })
      ] });
    case "clips":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 5.5h8.5A3.5 3.5 0 0 1 19 9v6.5A3.5 3.5 0 0 1 15.5 19H9A3.5 3.5 0 0 1 5.5 15.5V7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M9 3v7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12.5 3v4" })
      ] });
    case "forum":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 6.5h14v8H9l-4 3v-3H5z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M9 10h6" })
      ] });
    case "menu":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4.5 7h15" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4.5 12h15" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4.5 17h15" })
      ] });
    case "plus":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 5v14" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 12h14" })
      ] });
    case "search":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "m20 20-4-4" })
      ] });
    case "moon":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M16.5 4.8A7.7 7.7 0 1 0 19 18.5 8.5 8.5 0 0 1 16.5 4.8Z" }) });
    case "more":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "6", cy: "12", r: "1.3", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "1.3", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "18", cy: "12", r: "1.3", fill: "currentColor" })
      ] });
    case "heart":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 19s-6.5-3.8-8-7.5C2.7 8.8 4.4 6 7.2 6c1.8 0 3 1 3.8 2 0.8-1 2-2 3.8-2 2.8 0 4.5 2.8 3.2 5.5C18.5 15.2 12 19 12 19Z" }) });
    case "comment":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 6.5h14v9H9l-4 3v-3H5z" }) });
    case "repeat":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 7h9l-2.5-2.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M17 17H8l2.5 2.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M17 7v4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 17v-4" })
      ] });
    case "play":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 7.5v9l7-4.5-7-4.5Z", fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }) });
    case "profile":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 19c1.4-2.7 3.7-4 7-4s5.6 1.3 7 4" })
      ] });
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "7", fill: "none", stroke: "currentColor", strokeWidth: "1.9" }) });
  }
}
const getActiveLiveStreams = (filters = {}) => apiClient.get("/live_rooms", { params: filters, cache: false, forceRefresh: true });
const FEED_TABS = [
  { id: "favorites", label: "المفضلة" },
  { id: "groups", label: "المجموعات" },
  { id: "friends", label: "الأصدقاء" },
  { id: "following", label: "متابعين" },
  { id: "all", label: "الكل" }
];
const NAV_ITEMS = [
  { to: "/", label: "الرئيسية", icon: "home", exact: true },
  { to: "/reels", label: "الريلز", icon: "clips" },
  { to: "/live/control", label: "البث", icon: "live" },
  { to: "/groups", label: "المجموعات", icon: "groups" },
  { to: "/stories", label: "الستوري", icon: "bookmark" },
  { to: "/inbox", label: "الدردشة", icon: "message" },
  { to: "/notifications", label: "الإشعارات", icon: "bell" },
  { to: "/search", label: "البحث الذكي", icon: "search" },
  { to: "/settings", label: "الإعدادات", icon: "menu" }
];
const QUICK_ACTIONS = [
  { label: "صورة", color: "green", action: "image" },
  { label: "فيديو", color: "violet", action: "video" },
  { label: "رأيك", color: "rose", action: "thought" }
];
const DEFAULT_PROFILE_HIGHLIGHTS = [
  { label: "جديد", kind: "add" }
];
function timeAgoAr(dateLike) {
  if (!dateLike) return "الآن";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "الآن";
  const diffSeconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1e3));
  if (diffSeconds < 60) return "الآن";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `منذ ${months} شهر`;
  }
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
function convertLiveStreamToPost(stream) {
  if (!stream || !stream.id) return null;
  const thumbnail = stream.thumbnail_url || stream.thumbnail || "";
  const viewers = stream.viewers_count || stream.viewer_count || 0;
  return {
    id: `live_${stream.id}`,
    rawId: `live_${stream.id}`,
    type: "live_stream",
    is_live: true,
    is_live_stream: true,
    live_stream_id: stream.id,
    title: stream.title || "بث مباشر",
    content: stream.title || "بث مباشر",
    text: stream.title || "بث مباشر جديد",
    authorName: stream.host_name || stream.host_username || "مستخدم",
    authorAvatar: stream.host_avatar || "",
    username: stream.host_username || "مستخدم",
    handle: `@${(stream.host_username || "مستخدم").replace(/^@/, "")}`,
    avatar: stream.host_avatar || "",
    user_avatar: stream.host_avatar || "",
    created_at: stream.started_at || (/* @__PURE__ */ new Date()).toISOString(),
    time: "مباشر الآن",
    media_type: "live",
    media_url: thumbnail,
    thumbnail_url: thumbnail,
    preview_url: thumbnail,
    viewers_count: viewers,
    viewers,
    likes_count: stream.hearts_count || 0,
    comments_count: stream.comments_count || 0,
    share_count: stream.share_count || 0,
    is_liked: false,
    is_saved: false,
    is_verified: Boolean(stream.is_verified),
    is_reel: false,
    has_video: false,
    has_live_stream: true,
    live_stream: stream,
    media: thumbnail ? [{ type: "image-primary", kind: "image", url: thumbnail }] : [],
    // حقول إضافية للعرض الجذاب
    liveStreamId: stream.id,
    liveUrl: `/#/live/view/${stream.id}`,
    isLive: true,
    views: viewers
  };
}
function normalizeHandle(value = "") {
  const cleaned = String(value || "").trim().replace(/^@+/, "");
  return cleaned ? `@${cleaned}` : "@yamshat";
}
function isVideoMediaUrl(value = "", options = {}) {
  const candidate = String(value || "");
  if (options.forceVideo) return true;
  return /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i.test(candidate) || /\b(video|reel|stream)\b/i.test(candidate);
}
function extractFirstUrl(value = "") {
  const match = String(value || "").match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : "";
}
function stripFirstUrl(value = "") {
  return String(value || "").replace(/\s*https?:\/\/[^\s]+/i, "").trim();
}
function resolveLiveViewerUrl(post = {}) {
  if (post?.live_id) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/#/live/view/${post.live_id}`;
  }
  const directUrl = extractFirstUrl(post.content || post.text || "");
  if (!directUrl) return "";
  return /#\/live\/(watch|view)\//.test(directUrl) ? directUrl : "";
}
function buildFeedPosts(posts = []) {
  if (Array.isArray(posts) && posts.length) {
    return posts.map((post, index) => {
      const rawMedia = Array.isArray(post.media_urls) && post.media_urls.length ? post.media_urls : [post.media_url || post.image_url].filter(Boolean);
      const normalizedMedia = rawMedia.slice(0, 3).map((url, mediaIndex) => {
        const resolvedUrl = resolveMediaUrl(url);
        const isVideo = isVideoMediaUrl(resolvedUrl || url, {
          forceVideo: Boolean(post.has_video || post.is_reel || post.type === "video" || post.media_type === "video")
        });
        return {
          type: isVideo ? "video" : mediaIndex === 0 ? "image-primary" : "image-secondary",
          kind: isVideo ? "video" : "image",
          url: resolvedUrl
        };
      });
      const isLive = Boolean(
        post.is_live_stream || post.is_live || post.has_live_stream || post.type === "LIVE" || post.type === "live" || post.post_type === "LIVE"
      );
      const liveThumbnail = post.thumbnail_url || post.thumbnail || post.preview_url || post.media_url || "";
      const finalMedia = isLive && !normalizedMedia.length && liveThumbnail ? [{ type: "image-primary", kind: "image", url: resolveMediaUrl(liveThumbnail) }] : normalizedMedia;
      return {
        id: post.id || `post-${index}`,
        rawId: post.id || null,
        userId: post.user_id || null,
        rawUsername: post.username || post.user || "",
        isLive,
        liveStreamId: post.live_stream_id || post.live_id || post.streamId || null,
        authorName: post.author_name || post.username || post.user || "مستخدم يام شات",
        authorAvatar: resolveMediaUrl(post.user_avatar || post.avatar || post.author_avatar || ""),
        handle: normalizeHandle(post.username || post.user || `user.${index + 1}`),
        time: isLive ? "مباشر الآن" : timeAgoAr(post.created_at || post.published_at),
        text: stripFirstUrl(post.content || post.text || ""),
        liveUrl: post.liveUrl || resolveLiveViewerUrl(post),
        rawText: post.content || post.text || "",
        likes: Number(post.likes_count || post.like_count || post.likes || 0),
        comments: Number(post.comments_count || post.comment_count || 0),
        shares: Number(post.share_count || post.shares || 0),
        views: Number(post.viewers_count || post.viewers || post.views_count || 0),
        isLiked: Boolean(post.is_liked ?? post.liked_by_me),
        isSaved: Boolean(post.is_saved ?? post.saved_by_me),
        media: finalMedia
      };
    });
  }
  return [];
}
function Avatar({ name, size = 46, accent = false, image = false, src = "" }) {
  const firstLetter = String(name || "Y").trim().charAt(0) || "Y";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `yam-laptop-avatar ${accent ? "accent" : ""} ${image ? "image" : ""}`,
      style: { width: size, height: size, minWidth: size, minHeight: size },
      "aria-hidden": "true",
      children: src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: firstLetter })
    }
  );
}
function MediaTile({ item, index }) {
  const [renderAsVideo, setRenderAsVideo] = reactExports.useState(item?.kind === "video");
  reactExports.useEffect(() => {
    setRenderAsVideo(item?.kind === "video");
  }, [item?.kind, item?.url]);
  if (item?.url) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-post-media-tile tile-${index}`, children: [
      renderAsVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
          src: item.url,
          className: "yam-post-media-video",
          muted: true,
          loop: true,
          autoPlay: true,
          playsInline: true,
          preload: "metadata",
          controls: true
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.url, alt: "post media", className: "yam-post-media-image", onError: () => setRenderAsVideo(true) }),
      index === 0 && renderAsVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-play-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "play", size: 24, filled: true }) }) : null
    ] });
  }
  return null;
}
function PostCard({ post }) {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const postUrl = `${window.location.origin}/#/post/${post.rawId || post.id}`;
  const mediaItems = Array.isArray(post.media) ? post.media.slice(0, 3) : [];
  const [liked, setLiked] = reactExports.useState(Boolean(post.isLiked));
  const [saved, setSaved] = reactExports.useState(Boolean(post.isSaved));
  const [likesCount, setLikesCount] = reactExports.useState(Number(post.likes || 0));
  const [commentsCount, setCommentsCount] = reactExports.useState(Number(post.comments || 0));
  const [sharesCount, setSharesCount] = reactExports.useState(Number(post.shares || 0));
  const [showComments, setShowComments] = reactExports.useState(false);
  const [commentDraft, setCommentDraft] = reactExports.useState("");
  const [localComments, setLocalComments] = reactExports.useState([]);
  const [commentsLoaded, setCommentsLoaded] = reactExports.useState(false);
  const [commentsLoading, setCommentsLoading] = reactExports.useState(false);
  const [sendingComment, setSendingComment] = reactExports.useState(false);
  const [busyAction, setBusyAction] = reactExports.useState(null);
  const [showMoreMenu, setShowMoreMenu] = reactExports.useState(false);
  const [isFollowing, setIsFollowing] = reactExports.useState(false);
  const [isMuted, setIsMuted] = reactExports.useState(false);
  const [isBlocked, setIsBlocked] = reactExports.useState(false);
  const [isDeleted, setIsDeleted] = reactExports.useState(false);
  const authorUsername = String(post.rawUsername || post.handle || "").replace(/^@/, "");
  const currentUsername = getCurrentUsername();
  const isOwnPost = Boolean(authorUsername && currentUsername && authorUsername === currentUsername);
  const canCallBackend = Boolean(post.rawId) && !post.isLive;
  const invalidateFeed = reactExports.useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (_) {
    }
  }, [queryClient]);
  const handleOpenLiveAnnouncement = () => {
    if (!post.liveUrl) return;
    const hashRoute = post.liveUrl.includes("/#/") ? post.liveUrl.split("/#/")[1] : "";
    if (hashRoute) {
      navigate(`/${hashRoute.replace(/^\/+/, "")}`);
      return;
    }
    window.location.href = post.liveUrl;
  };
  const handleLike = async () => {
    if (busyAction === "like") return;
    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    if (!canCallBackend) return;
    setBusyAction("like");
    try {
      const response = await likePost(post.rawId);
      const data = response?.data || {};
      if (typeof data.is_liked === "boolean") setLiked(data.is_liked);
      if (typeof data.likes_count === "number") setLikesCount(data.likes_count);
      else if (typeof data.like_count === "number") setLikesCount(data.like_count);
      invalidateFeed();
    } catch (error) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      pushToast({ type: "error", title: "تعذر تنفيذ الإعجاب", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction(null);
    }
  };
  const handleShare = async () => {
    if (busyAction === "share") return;
    let platform = "copy";
    let succeeded = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorName, text: post.text, url: postUrl });
        platform = "native";
        succeeded = true;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        platform = "copy";
        succeeded = true;
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        pushToast({ type: "info", title: "تعذر فتح نافذة المشاركة" });
      }
      return;
    }
    if (!succeeded) return;
    setSharesCount((count) => count + 1);
    pushToast({ type: "success", title: "تمت مشاركة المنشور" });
    if (!canCallBackend) return;
    setBusyAction("share");
    try {
      const response = await sharePost(post.rawId, platform);
      const data = response?.data || {};
      if (typeof data.share_count === "number") setSharesCount(data.share_count);
      else if (typeof data.shares === "number") setSharesCount(data.shares);
      invalidateFeed();
    } catch (error) {
      console.warn("share tracking failed", error);
    } finally {
      setBusyAction(null);
    }
  };
  const handleSave = async () => {
    if (busyAction === "save") return;
    const prevSaved = saved;
    const nextSaved = !prevSaved;
    setSaved(nextSaved);
    if (!canCallBackend) {
      pushToast({ type: "success", title: nextSaved ? "تم حفظ المنشور" : "تمت إزالة المنشور من المحفوظات" });
      return;
    }
    setBusyAction("save");
    try {
      const response = await savePost(post.rawId);
      const data = response?.data || {};
      if (typeof data.is_saved === "boolean") setSaved(data.is_saved);
      pushToast({ type: "success", title: data.is_saved ?? nextSaved ? "تم حفظ المنشور" : "تمت إزالة المنشور من المحفوظات" });
      invalidateFeed();
    } catch (error) {
      setSaved(prevSaved);
      pushToast({ type: "error", title: "تعذر حفظ المنشور", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction(null);
    }
  };
  const handleDeletePost = async () => {
    if (!isOwnPost || !canCallBackend) return;
    if (!window.confirm("هل تريد حذف هذا المنشور نهائيًا؟")) return;
    try {
      await deletePost(post.rawId);
      setIsDeleted(true);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: "تم حذف المنشور" });
      invalidateFeed();
    } catch (error) {
      pushToast({ type: "error", title: "تعذر حذف المنشور", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleMoreOptions = () => {
    setShowMoreMenu((prev) => !prev);
  };
  const handleFollowAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      const response = await followUser(authorUsername);
      const nextFollowing = Boolean(response?.data?.following ?? !isFollowing);
      setIsFollowing(nextFollowing);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: nextFollowing ? "تمت المتابعة" : "تم إلغاء المتابعة" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحديث المتابعة", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleMuteAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      if (isMuted) await unmuteUser(authorUsername);
      else await muteUser(authorUsername);
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: nextMuted ? "تم الكتم" : "تم إلغاء الكتم" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحديث الكتم", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleBlockAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      if (isBlocked) await unblockUserApi(authorUsername);
      else await blockUserApi(authorUsername);
      const nextBlocked = !isBlocked;
      setIsBlocked(nextBlocked);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: nextBlocked ? "تم الحظر" : "تم إلغاء الحظر" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحديث الحظر", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleReportPost = () => {
    try {
      const key = "yamshat_reported_posts";
      const current = JSON.parse(window.localStorage.getItem(key) || "[]");
      const next = Array.isArray(current) ? current : [];
      next.unshift({ id: post.id, username: authorUsername, created_at: (/* @__PURE__ */ new Date()).toISOString() });
      window.localStorage.setItem(key, JSON.stringify(next.slice(0, 100)));
    } catch {
    }
    setShowMoreMenu(false);
    pushToast({ type: "success", title: "تم إرسال البلاغ للمراجعة" });
  };
  const loadComments = reactExports.useCallback(async () => {
    if (!canCallBackend || commentsLoaded || commentsLoading) return;
    setCommentsLoading(true);
    try {
      const response = await getComments(post.rawId, { page: 1, limit: 20, sort_by: "newest" });
      const data = response?.data;
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const mapped = items.map((item) => ({
        id: item.id,
        author: item.username || item.user || item.author_name || "مستخدم",
        content: item.content || item.text || ""
      }));
      setLocalComments(mapped);
      if (typeof data?.total === "number") setCommentsCount(data.total);
      else if (typeof data?.total_count === "number") setCommentsCount(data.total_count);
      setCommentsLoaded(true);
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحميل التعليقات", description: error?.response?.data?.detail || error?.message });
    } finally {
      setCommentsLoading(false);
    }
  }, [canCallBackend, commentsLoaded, commentsLoading, post.rawId, pushToast]);
  reactExports.useEffect(() => {
    if (showComments && !commentsLoaded && canCallBackend) {
      loadComments();
    }
  }, [showComments, commentsLoaded, canCallBackend, loadComments]);
  const handleAddComment = async () => {
    const content = commentDraft.trim();
    if (!content || sendingComment) return;
    if (!canCallBackend) {
      setLocalComments((prev) => [{ id: `${post.id}-${Date.now()}`, author: "أنت", content }, ...prev]);
      setCommentsCount((count) => count + 1);
      setCommentDraft("");
      if (!showComments) setShowComments(true);
      pushToast({ type: "success", title: "تمت إضافة التعليق" });
      return;
    }
    setSendingComment(true);
    const tempId = `temp-${Date.now()}`;
    const tempComment = { id: tempId, author: currentUsername || "أنت", content, pending: true };
    setLocalComments((prev) => [tempComment, ...prev]);
    setCommentsCount((count) => count + 1);
    setCommentDraft("");
    if (!showComments) setShowComments(true);
    try {
      const response = await addComment(post.rawId, content);
      const data = response?.data || {};
      const finalComment = {
        id: data.id || tempId,
        author: data.username || data.user || currentUsername || "أنت",
        content: data.content || content
      };
      setLocalComments((prev) => prev.map((c) => c.id === tempId ? finalComment : c));
      pushToast({ type: "success", title: "تمت إضافة التعليق" });
      invalidateFeed();
    } catch (error) {
      setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentsCount((count) => Math.max(0, count - 1));
      setCommentDraft(content);
      pushToast({ type: "error", title: "تعذر إرسال التعليق", description: error?.response?.data?.detail || error?.message });
    } finally {
      setSendingComment(false);
    }
  };
  if (isDeleted) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "yam-post-card-v2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-head-v2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author-v2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: post.authorName, size: 48, accent: Boolean(post.brandRing), image: true, src: post.authorAvatar }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author-line", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.authorName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-verified-badge", children: "✓" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-handle", children: post.handle })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-meta-v2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.time }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-menu-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-ghost-icon-btn", "aria-label": "خيارات المنشور", onClick: handleMoreOptions, title: "خيارات المنشور", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "more", size: 18 }) }),
          showMoreMenu ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-settings-popover", children: !isOwnPost ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item", onClick: handleFollowAuthor, children: isFollowing ? "إلغاء المتابعة" : "متابعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item", onClick: handleMuteAuthor, children: isMuted ? "إلغاء الكتم" : "كتم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleBlockAuthor, children: isBlocked ? "إلغاء الحظر" : "حظر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleReportPost, children: "بلاغ" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleDeletePost, children: "حذف المنشور" }) }) : null
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-post-copy-v2", children: post.text }),
    post.isLive && post.authorAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-live-card", onClick: handleOpenLiveAnnouncement, style: { cursor: "pointer" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-live-background", style: {
      position: "relative",
      borderRadius: "16px",
      overflow: "hidden",
      background: "#000",
      aspectRatio: "16/9",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: [
      post.media_url || post.thumbnail_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: post.media_url || post.thumbnail_url,
          alt: "Live Stream",
          style: { width: "100%", height: "100%", objectFit: "cover" }
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        position: "absolute",
        top: "12px",
        left: "12px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        background: "#ef4444",
        borderRadius: "6px",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
        zIndex: 2
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "مباشر" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        top: "12px",
        left: "75px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px 10px",
        background: "rgba(0, 0, 0, 0.4)",
        borderRadius: "6px",
        color: "white",
        fontSize: "12px",
        fontWeight: "600",
        backdropFilter: "blur(10px)",
        zIndex: 2
      }, children: [
        "👁 ",
        formatCompactNumber(post.views || 0)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
        padding: "20px 12px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 2
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flex: 1
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            flexShrink: 0
          }, children: post.authorAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.authorAvatar, alt: post.authorName, style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px"
          }, children: post.authorName?.charAt(0).toUpperCase() }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "white", flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "700" }, children: post.authorName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }, children: post.text || post.title })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            style: {
              padding: "8px 16px",
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)",
              flexShrink: 0
            },
            onMouseEnter: (e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(124, 58, 237, 0.6)";
            },
            onMouseLeave: (e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.4)";
            },
            children: "انضم الآن"
          }
        )
      ] })
    ] }) }) : null,
    post.isLive && !post.authorAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-live-indicator", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "live-dot" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "live-text", children: "مباشر الآن" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "live-viewers", children: [
        "للا ",
        formatCompactNumber(post.views || 0),
        " مشاهد"
      ] })
    ] }) : null,
    post.liveUrl && !post.isLive ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "yam-post-live-cta",
        onClick: handleOpenLiveAnnouncement,
        children: "📵 متابعة البث المباشر"
      }
    ) : null,
    mediaItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-post-media-grid-v2 media-count-${mediaItems.length}`, children: mediaItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(MediaTile, { item, index }, `${post.id}-media-${index}`)) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-actions-v2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: liked ? "active" : "", onClick: handleLike, disabled: busyAction === "like", "aria-label": "إعجاب", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "heart", size: 17 }),
        liked ? `تم الإعجاب${likesCount ? ` (${likesCount})` : ""}` : `أعجبني${likesCount ? ` (${likesCount})` : ""}`
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: showComments ? "active" : "", onClick: () => setShowComments((prev) => !prev), "aria-label": "تعليق", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "comment", size: 17 }),
        "تعليق",
        commentsCount ? ` (${commentsCount})` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: handleShare, disabled: busyAction === "share", "aria-label": "مشاركة", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "repeat", size: 17 }),
        "مشاركة",
        sharesCount ? ` (${sharesCount})` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: saved ? "active" : "", onClick: handleSave, disabled: busyAction === "save", "aria-label": "حفظ", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "bookmark", size: 17 }),
        saved ? "محفوظ" : "حفظ"
      ] })
    ] }),
    showComments ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-comments-panel", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-comment-composer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: commentDraft,
            onChange: (event) => setCommentDraft(event.target.value),
            placeholder: "اكتب تعليقك هنا...",
            rows: 3,
            disabled: sendingComment
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-post-comment-send", onClick: handleAddComment, disabled: sendingComment || !commentDraft.trim(), children: sendingComment ? "جارٍ الإرسال..." : "إرسال التعليق" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-comment-list", children: commentsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-comment-empty", children: "جارٍ تحميل التعليقات..." }) : localComments.length ? localComments.map((comment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-comment-item", style: comment.pending ? { opacity: 0.6 } : void 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: comment.author }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: comment.content })
      ] }, comment.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-comment-empty", children: "لا توجد تعليقات بعد، كن أول من يعلّق." }) })
    ] }) : null
  ] });
}
function FeedEnhanced() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout$1, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedMobile$1, {}) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout$2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(FeedDesktopInner, {}) });
}
function FeedDesktopInner() {
  const navigate = useNavigate();
  const centerStageRef = reactExports.useRef(null);
  const postStackRef = reactExports.useRef(null);
  const { pushToast } = useToast();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = reactExports.useState(false);
  const [loggingOut, setLoggingOut] = reactExports.useState(false);
  const [liveStreams, setLiveStreams] = reactExports.useState([]);
  const [loadingLiveStreams, setLoadingLiveStreams] = reactExports.useState(false);
  const profile = getStoredUserSnapshot();
  const profileDetails = profile?.profile || {};
  const username = getCurrentUsername() || profile?.username || profile?.user || "";
  const displayName = profileDetails.full_name || profile?.name || profile?.full_name || username || "مستخدم يام شات";
  const profileAvatar = resolveMediaUrl(profileDetails.avatar || profile?.avatar || profileDetails.avatar_url || profile?.avatar_url || "");
  const isVerified = Boolean(profile?.is_verified || profile?.verified || profileDetails.is_verified || profileDetails.verified);
  const followersCount = Number(profile?.followers_count || profileDetails.followers_count || profile?.followers || 0);
  const followingCount = Number(profile?.following_count || profileDetails.following_count || profile?.following || 0);
  const profileBio = [profileDetails.activity_tagline, profileDetails.bio, profileDetails.location || profile?.location].map((value) => String(value || "").trim()).filter(Boolean).join("\n") || "حدّث ملفك الشخصي ليظهر وصفك الحقيقي هنا.";
  const joinedAt = profile?.created_at || profileDetails.created_at || profileDetails.joined_at || "";
  const joinedLabel = joinedAt ? new Date(joinedAt).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) : "";
  const dynamicHighlightValues = Array.isArray(profileDetails.highlights) ? profileDetails.highlights : Array.isArray(profileDetails.interests) ? profileDetails.interests : [];
  const profileHighlights = [
    ...DEFAULT_PROFILE_HIGHLIGHTS,
    ...dynamicHighlightValues.filter(Boolean).slice(0, 4).map((item, index) => ({
      label: String(item).slice(0, 18),
      kind: ["travel", "design", "moments", "projects"][index % 4]
    }))
  ];
  const summaryItems = [
    profileDetails.profession ? { icon: "profile", text: profileDetails.profession } : null,
    profileDetails.company ? { icon: "groups", text: profileDetails.company } : null,
    profileDetails.location || profile?.location ? { icon: "discover", text: profileDetails.location || profile?.location } : null,
    joinedLabel ? { icon: "bookmark", text: `انضم في ${joinedLabel}` } : null
  ].filter(Boolean);
  const {
    posts = [],
    fetchNextPage,
    hasNextPage: hasNextPage2,
    isFetching,
    isFetchingNextPage
  } = useSmartFeed({
    filterType: activeTab === "all" ? "all" : "following",
    sortBy: "recent",
    limit: 12,
    pollingInterval: 25e3
  });
  reactExports.useEffect(() => {
    const fetchActiveLiveStreams = async () => {
      try {
        setLoadingLiveStreams(true);
        const response = await getActiveLiveStreams({ limit: 10 });
        const streams = Array.isArray(response?.data) ? response.data : [];
        const localPosts = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
        const localStreams = localPosts.filter((p) => (p.type === "live" || p.is_live) && p.streamId).map((p) => ({
          id: p.streamId,
          title: p.title || p.content || "بث مباشر",
          thumbnail_url: p.thumbnail || p.media_url,
          viewers_count: p.viewers || 0,
          host_name: p.authorName || p.username || "مستخدم",
          host_username: p.username || "user",
          host_avatar: p.avatarUrl || p.user_avatar || "",
          started_at: p.createdAt || p.created_at || (/* @__PURE__ */ new Date()).toISOString()
        }));
        const combinedStreams = [...streams];
        localStreams.forEach((ls) => {
          if (!combinedStreams.find((s) => String(s.id) === String(ls.id))) {
            combinedStreams.unshift(ls);
          }
        });
        setLiveStreams(combinedStreams);
      } catch (error) {
        console.error("Error fetching live streams:", error);
        try {
          const localPosts = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
          const localStreams = localPosts.filter((p) => (p.type === "live" || p.is_live) && p.streamId).map((p) => ({
            id: p.streamId,
            title: p.title || p.content || "بث مباشر",
            thumbnail_url: p.thumbnail || p.media_url,
            viewers_count: p.viewers || 0,
            host_name: p.authorName || p.username || "مستخدم",
            host_username: p.username || "user",
            host_avatar: p.avatarUrl || p.user_avatar || "",
            started_at: p.createdAt || p.created_at || (/* @__PURE__ */ new Date()).toISOString()
          }));
          setLiveStreams(localStreams);
        } catch (e) {
          setLiveStreams([]);
        }
      } finally {
        setLoadingLiveStreams(false);
      }
    };
    fetchActiveLiveStreams();
    const handleRefresh = () => fetchActiveLiveStreams();
    window.addEventListener("yamshat:live-post-created", handleRefresh);
    window.addEventListener("yamshat:stream-started", handleRefresh);
    window.addEventListener("yamshat:stream-ended", handleRefresh);
    const interval = setInterval(fetchActiveLiveStreams, 5e3);
    return () => {
      clearInterval(interval);
      window.removeEventListener("yamshat:live-post-created", handleRefresh);
      window.removeEventListener("yamshat:stream-started", handleRefresh);
      window.removeEventListener("yamshat:stream-ended", handleRefresh);
    };
  }, []);
  const liveStreamPosts = reactExports.useMemo(() => liveStreams.map(convertLiveStreamToPost).filter(Boolean), [liveStreams]);
  const feedPosts = reactExports.useMemo(() => {
    const allPosts = buildFeedPosts(posts);
    const filteredLivePosts = liveStreamPosts.filter(
      (lp) => !allPosts.find((ap) => String(ap.liveStreamId) === String(lp.liveStreamId))
    );
    const combined = [...filteredLivePosts, ...allPosts];
    return combined.filter((p) => p.id !== "welcome");
  }, [posts, liveStreamPosts]);
  const totalPosts = feedPosts.length;
  const profilePostsCount = Number(profile?.posts_count || profileDetails.posts_count || profileDetails.posts || profile?.posts || totalPosts || 0);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return void 0;
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return void 0;
    const mediaQuery = window.matchMedia("(min-width: 1141px)");
    const syncScrollMode = () => {
      pageContent.classList.toggle("yam-feed-page-locked", mediaQuery.matches);
    };
    syncScrollMode();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncScrollMode);
      return () => {
        pageContent.classList.remove("yam-feed-page-locked");
        mediaQuery.removeEventListener("change", syncScrollMode);
      };
    }
    mediaQuery.addListener(syncScrollMode);
    return () => {
      pageContent.classList.remove("yam-feed-page-locked");
      mediaQuery.removeListener(syncScrollMode);
    };
  }, []);
  reactExports.useEffect(() => {
    const scroller = centerStageRef.current;
    if (!scroller) return void 0;
    const handleScroll = () => {
      if (!hasNextPage2 || isFetchingNextPage) return;
      const remainingDistance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      if (remainingDistance <= 320) fetchNextPage();
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage2, isFetchingNextPage]);
  reactExports.useEffect(() => {
    const scroller = centerStageRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);
  const handleQuickAction = (action) => {
    document.querySelector(".yam-home-composer-slot")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.dispatchEvent(new CustomEvent("yamshat:composer-action", { detail: { action } }));
  };
  const handleThemeToggle = () => {
    toggleTheme();
    pushToast({ type: "success", title: theme === "dark" ? "تم تفعيل الوضع النهاري" : "تم تفعيل الوضع الليلي" });
  };
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      await fetch(`${BACKEND_ORIGIN}/api/auth/logout`, {
        method: "POST",
        headers: {
          ...token ? { Authorization: `Bearer ${token}` } : {},
          ...csrfToken ? { "X-CSRF-Token": csrfToken } : {}
        },
        credentials: "include"
      });
    } catch {
    } finally {
      clearStoredUser();
      setIsSettingsOpen(false);
      setLoggingOut(false);
      redirectToAppPath("/login");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-laptop-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-page-noise" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-laptop-shell", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-left-rail", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-logo-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-logo-mark", children: "Y" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-logo-text", children: "YAMSHAT" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "yam-main-nav-desktop", children: NAV_ITEMS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          NavLink,
          {
            to: item.to,
            end: Boolean(item.exact),
            className: ({ isActive }) => `yam-nav-link-desktop ${isActive ? "active" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-link-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: item.icon, size: 18 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
              item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-link-badge", children: item.badge }) : null
            ]
          },
          item.to
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-rail-footer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-dark-toggle-row yam-action-surface", onClick: handleThemeToggle, "aria-label": "تبديل الوضع الليلي", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-dark-toggle-copy", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "moon", size: 18 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الوضع الليلي" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `yam-dark-toggle-switch ${theme === "dark" ? "active" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-logout-btn-desktop", onClick: handleLogout, disabled: loggingOut, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "message", size: 16 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل خروج" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "yam-center-stage", ref: centerStageRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-feed-header-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-header-top", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "المنشورات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-mobile-brand", children: "YAMSHAT" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-composer-prompt-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-composer-actions-inline", children: QUICK_ACTIONS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `yam-mini-action ${item.color}`, onClick: () => handleQuickAction(item.action), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dot" }),
            item.label
          ] }, item.label)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-home-composer-slot", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PostComposer, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-feed-tabs", children: FEED_TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: `yam-feed-tab ${activeTab === tab.id ? "active" : ""}`,
              onClick: () => setActiveTab(tab.id),
              children: tab.label
            },
            tab.id
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-stack-v2", ref: postStackRef, children: [
          feedPosts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx(PostCard, { post }, post.id)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-feed-status-row", children: isFetchingNextPage ? "جارٍ تحميل المنشورات الأقدم..." : hasNextPage2 ? "اسحب شريط التمرير لأسفل لإظهار منشورات أكثر." : isFetching && !feedPosts.length ? "جارٍ تحميل المنشورات..." : "تم عرض كل المنشورات الحالية." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-right-rail", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-profile-card-v2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-profile-cover-v2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-profile-cover-brand", children: "YAMSHAT" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-body-v2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-avatar-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: displayName, size: 96, accent: true, image: true, src: profileAvatar }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-avatar-camera-btn", "aria-label": "تغيير الصورة", onClick: () => navigate("/profile"), title: "الانتقال إلى الملف الشخصي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "profile", size: 16 }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-name-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: displayName }),
              isVerified ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-verified-badge", children: "✓" }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-profile-handle-v2", children: normalizeHandle(username || displayName) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-stats-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(profilePostsCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المنشورات" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(followersCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المتابعين" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(followingCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "يتابع" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-profile-bio-v2", children: profileBio }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-actions-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-primary-action-btn", onClick: () => navigate("/profile"), children: "تعديل الملف الشخصي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-menu-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-icon-btn", onClick: () => setIsSettingsOpen((prev) => !prev), "aria-expanded": isSettingsOpen, "aria-label": "فتح إعدادات سريعة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "menu", size: 18 }) }),
                isSettingsOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-popover", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-settings-popover-item", onClick: handleThemeToggle, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الوضع الليلي" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `yam-dark-toggle-switch small ${theme === "dark" ? "active" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleLogout, disabled: loggingOut, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل خروج" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "message", size: 16 })
                  ] })
                ] }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-highlights-row-v2", children: profileHighlights.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-highlight-item-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-highlight-ring ${item.kind}`, children: item.kind === "add" ? /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "plus", size: 18 }) : null }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
            ] }, item.label)) })
          ] })
        ] }),
        summaryItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-summary-card-v2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-section-title-row", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "معلومات مختصرة" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-summary-list-v2", children: summaryItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-summary-row-v2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-summary-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: item.icon, size: 16 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.text })
          ] }, item.text)) })
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-laptop-page {
            position: relative;
            min-height: 100%;
            width: 100%;
            max-width: 100%;
            background:
              radial-gradient(circle at top right, rgba(121, 40, 202, 0.22), transparent 18%),
              radial-gradient(circle at top left, rgba(96, 165, 250, 0.10), transparent 16%),
              linear-gradient(180deg, #040815 0%, #070d1d 48%, #060913 100%);
            color: #f5f7ff;
            /* السماح بالتمرير العمودي الكامل على كل الأجهزة */
            overflow-x: hidden;
            overflow-y: visible;
          }

          .yam-page-noise {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: radial-gradient(rgba(255,255,255,0.06) 0.5px, transparent 0.5px);
            background-size: 14px 14px;
            opacity: 0.14;
          }

          .yam-laptop-shell {
            position: relative;
            width: min(1800px, 100%);
            max-width: 100%;
            min-height: 100%;
            margin: 0 auto;
            padding: 20px 14px 32px;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 250px minmax(0, 1fr) 360px;
            gap: 18px;
            align-items: start;
            /* على الديسكتوب: نجعل الـ shell بالكامل يملأ الشاشة لتعمل آلية sticky بشكل صحيح */
            min-height: calc(100vh - 24px);
          }

          .yam-left-rail,
          .yam-center-stage,
          .yam-right-rail {
            min-width: 0;
          }

          .yam-left-rail,
          .yam-right-rail {
            position: sticky !important;
            top: 18px;
            align-self: start;
            /* الأشرطة الجانبية ثابتة عند التمرير ولها تمريرها الداخلي الخاص إذا طال محتواها */
            max-height: calc(100vh - 36px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
            z-index: 10;
            contain: layout style paint;
          }

          .yam-left-rail::-webkit-scrollbar,
          .yam-right-rail::-webkit-scrollbar {
            width: 6px;
          }

          .yam-left-rail::-webkit-scrollbar-thumb,
          .yam-right-rail::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 999px;
          }

          .yam-logo-card,
          .yam-feed-header-card,
          .yam-post-card-v2,
          .yam-profile-card-v2,
          .yam-summary-card-v2,
          .yam-main-nav-desktop,
          .yam-rail-footer {
            border: 1px solid rgba(255,255,255,0.07);
            background: linear-gradient(180deg, rgba(7, 12, 25, 0.96), rgba(6, 10, 20, 0.92));
            border-radius: 26px;
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.32);
            backdrop-filter: blur(22px);
          }

          .yam-left-rail {
            display: grid;
            gap: 16px;
          }

          /* على الجوال والتابلت، شيل القيود المتعلقة بالـ rail اليساري */
          @media (max-width: 1140px) {
            .yam-left-rail {
              max-height: none;
              overflow: visible;
            }
          }

          .yam-logo-card {
            min-height: 190px;
            display: grid;
            place-items: center;
            text-align: center;
            padding: 22px;
            background:
              radial-gradient(circle at 50% 15%, rgba(152, 62, 255, 0.32), transparent 38%),
              linear-gradient(180deg, rgba(11, 14, 35, 0.98), rgba(5, 10, 20, 0.98));
          }

          .yam-logo-mark {
            width: 84px;
            height: 84px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            font-size: 46px;
            font-weight: 900;
            color: #dfc5ff;
            border: 1px solid rgba(178, 111, 255, 0.34);
            background: linear-gradient(180deg, rgba(119, 65, 245, 0.25), rgba(71, 27, 152, 0.1));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(103, 45, 221, 0.24);
          }

          .yam-logo-text {
            margin-top: 14px;
            letter-spacing: 0.24em;
            font-size: 15px;
            font-weight: 800;
            color: #e9ddff;
          }

          .yam-main-nav-desktop {
            padding: 14px;
            display: grid;
            gap: 8px;
          }

          .yam-nav-link-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 14px;
            color: #d7def6;
            transition: 0.22s ease;
            font-weight: 700;
          }

          .yam-nav-link-desktop:hover,
          .yam-nav-link-desktop.active {
            color: #fff;
            background: linear-gradient(90deg, rgba(114, 60, 240, 0.24), rgba(85, 73, 243, 0.08));
            box-shadow: var(--shadow-inset-soft);
          }

          .yam-nav-link-icon {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            color: #bda8ff;
          }

          .yam-nav-link-badge {
            margin-inline-start: auto;
            min-width: 26px;
            height: 26px;
            padding: 0 8px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }

          .yam-rail-footer {
            padding: 14px;
            display: grid;
            gap: 12px;
          }

          .yam-dark-toggle-row,
          .yam-logout-btn-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            background: rgba(255,255,255,0.03);
            color: #e5e7f8;
            border: 1px solid rgba(255,255,255,0.05);
          }

          .yam-action-surface {
            width: 100%;
            cursor: pointer;
          }

          .yam-dark-toggle-copy,
          .yam-logout-btn-desktop {
            font-weight: 700;
          }

          .yam-dark-toggle-copy {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .yam-dark-toggle-switch {
            width: 48px;
            height: 28px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            padding: 3px;
            display: flex;
            align-items: center;
          }

          .yam-dark-toggle-switch span {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.26);
            transition: transform 0.2s ease;
          }

          .yam-dark-toggle-switch.active {
            justify-content: flex-end;
            background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.9));
          }

          .yam-logout-btn-desktop {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.05);
            justify-content: center;
            cursor: pointer;
          }

          .yam-logout-btn-desktop:disabled {
            opacity: 0.7;
            cursor: wait;
          }

          .page-content.yam-feed-page-locked {
            overflow-y: hidden;
          }

          /* منطقة المنشورات المركزية: تأخذ ارتفاع كامل للشاشة وتسمح بالتمرير الداخلي للـ post-stack
             فقط، دون أن تؤثر على ثبات الأشرطة الجانبية */
          .yam-center-stage {
            position: sticky;
            top: 18px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            min-height: 0;
            height: calc(100vh - 36px);
            max-height: calc(100vh - 36px);
            overflow-x: hidden;
            overflow-y: auto;
            align-self: start;
            direction: rtl;
            scrollbar-gutter: stable both-edges;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.92) rgba(255,255,255,0.06);
            padding-inline-start: 4px;
            padding-inline-end: 10px;
            scroll-behavior: smooth;
            overscroll-behavior-y: contain;
          }

          .yam-center-stage > * {
            direction: rtl;
          }

          .yam-center-stage::-webkit-scrollbar {
            width: 14px;
            -webkit-appearance: none;
          }

          .yam-center-stage::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.06);
            border-radius: 999px;
            box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.18);
          }

          .yam-center-stage::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.92), rgba(99, 102, 241, 0.88));
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .yam-center-stage::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(167, 139, 250, 1), rgba(129, 140, 248, 1));
          }

          .yam-feed-header-card {
            position: relative;
            top: auto;
            z-index: 1;
            flex-shrink: 0;
            padding: 18px 20px 14px;
          }

          .yam-feed-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .yam-feed-header-top h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 900;
          }

          .yam-mobile-brand {
            display: none;
            font-size: 12px;
            letter-spacing: 0.22em;
            color: #bda8ff;
            font-weight: 800;
          }

          .yam-composer-prompt-bar {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            margin-bottom: 14px;
          }

          .yam-home-composer-slot {
            margin-bottom: 14px;
          }

          .yam-home-composer-slot > * {
            margin-bottom: 0 !important;
          }

          .yam-composer-actions-inline {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .yam-mini-action {
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            min-height: 44px;
            padding: 0 14px;
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            cursor: pointer;
          }

          .yam-mini-action:hover {
            background: rgba(139, 92, 246, 0.12);
            border-color: rgba(167, 139, 250, 0.24);
          }

          .yam-mini-action .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .yam-mini-action.green .dot { background: #22c55e; }
          .yam-mini-action.violet .dot { background: #8b5cf6; }
          .yam-mini-action.rose .dot { background: #f43f5e; }

          .yam-composer-input-surface {
            min-height: 52px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #95a0c7;
            font-weight: 600;
          }

          .yam-feed-tabs {
            display: flex;
            align-items: center;
            gap: 18px;
            overflow-x: auto;
            padding-bottom: 2px;
          }

          .yam-feed-tabs::-webkit-scrollbar { display: none; }

          .yam-feed-tab {
            position: relative;
            background: transparent;
            border: none;
            color: #97a2c6;
            padding: 10px 0;
            font-weight: 700;
            white-space: nowrap;
          }

          .yam-feed-tab.active {
            color: #fff;
          }

          .yam-feed-tab.active::after {
            content: '';
            position: absolute;
            inset-inline: 0;
            bottom: 0;
            height: 3px;
            border-radius: 999px;
            background: linear-gradient(90deg, #8b5cf6, #d946ef);
          }

          .yam-post-stack-v2 {
            flex: 0 0 auto;
            min-height: min-content;
            position: relative;
            overflow: visible !important;
            display: grid;
            gap: 18px;
            direction: rtl;
            padding-inline-start: 0;
            padding-inline-end: 0;
            padding-bottom: 28px;
            border: 0;
            -webkit-overflow-scrolling: touch;
            contain: none;
          }


          .yam-post-stack-v2 > * {
            direction: rtl;
          }

          .yam-post-stack-v2::-webkit-scrollbar {
            width: 14px;
            -webkit-appearance: none;
          }

          .yam-post-stack-v2::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.06);
            border-radius: 999px;
            box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.18);
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.92), rgba(99, 102, 241, 0.88));
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(167, 139, 250, 1), rgba(129, 140, 248, 1));
          }


          .yam-feed-status-row {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 54px;
            padding: 0 16px;
            border-radius: 18px;
            border: 1px dashed rgba(167, 139, 250, 0.22);
            background: rgba(139, 92, 246, 0.06);
            color: #c4b5fd;
            font-size: 13px;
            font-weight: 700;
          }

          .yam-post-card-v2 {
            padding: 18px;
            display: grid;
            gap: 14px;
          }

          .yam-post-head-v2,
          .yam-post-author-v2,
          .yam-post-meta-v2,
          .yam-post-stats-v2,
          .yam-post-reactions-v2,
          .yam-post-actions-v2,
          .yam-profile-name-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .yam-post-head-v2,
          .yam-post-stats-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            justify-content: space-between;
          }

          .yam-post-meta-v2 {
            color: #8894bd;
            font-size: 13px;
          }

          .yam-post-author-copy {
            min-width: 0;
          }

          .yam-post-author-line,
          .yam-profile-name-v2 {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .yam-post-author-line strong,
          .yam-profile-name-v2 strong {
            font-size: 18px;
          }

          .yam-post-handle,
          .yam-profile-handle-v2 {
            color: #8f9cc5;
            font-size: 14px;
            margin-top: 2px;
          }

          .yam-verified-badge {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            background: #3b82f6;
            color: #fff;
            font-size: 11px;
            font-weight: 900;
            flex-shrink: 0;
          }

          .yam-ghost-icon-btn,
          .yam-settings-icon-btn {
            width: 38px;
            height: 38px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.04);
            color: #e8ebff;
            display: grid;
            place-items: center;
          }

          .yam-settings-menu-wrap {
            position: relative;
          }

          .yam-settings-popover {
            position: absolute;
            top: calc(100% + 10px);
            inset-inline-end: 0;
            width: min(260px, 72vw);
            padding: 10px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(8, 12, 26, 0.96);
            box-shadow: 0 24px 50px rgba(0, 0, 0, 0.34);
            display: grid;
            gap: 8px;
            z-index: 20;
            backdrop-filter: blur(20px);
          }

          .yam-settings-popover-item {
            min-height: 48px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            font-weight: 800;
          }

          .yam-settings-popover-item.danger {
            color: #fda4af;
          }

          .yam-dark-toggle-switch.small {
            width: 42px;
            height: 24px;
          }

          .yam-dark-toggle-switch.small span {
            width: 18px;
            height: 18px;
          }

          .yam-post-copy-v2 {
            margin: 0;
            color: #edf2ff;
            line-height: 1.9;
            white-space: pre-line;
            font-size: 15px;
          }

          .yam-post-live-cta {
            width: 100%;
            min-height: 52px;
            border-radius: 18px;
            border: none;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: #fff;
            font-weight: 800;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 12px 28px rgba(124, 58, 237, 0.32);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 8px;
          }

          .yam-post-live-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 36px rgba(124, 58, 237, 0.42);
            background: linear-gradient(135deg, #9333ea, #4f46e5);
          }

          .yam-post-live-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            padding: 10px 16px;
            background: rgba(239, 68, 68, 0.12);
            border-radius: 14px;
            border: 1px solid rgba(239, 68, 68, 0.25);
          }

          .live-dot {
            width: 10px;
            height: 10px;
            background: #ef4444;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
            animation: pulse-live 1.5s infinite;
          }

          @keyframes pulse-live {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }

          .live-text {
            color: #ef4444;
            font-weight: 900;
            font-size: 14px;
            letter-spacing: 0.5px;
          }

          .live-viewers {
            color: #cbd5e1;
            font-size: 13px;
            font-weight: 700;
            margin-inline-start: auto;
            background: rgba(0, 0, 0, 0.2);
            padding: 2px 10px;
            border-radius: 8px;
          }

          .yam-post-media-grid-v2 {
            display: grid;
            grid-template-columns: 1.05fr 1.25fr 0.72fr;
            gap: 10px;
            min-height: 318px;
          }

          .yam-post-media-grid-v2.media-count-1 {
            grid-template-columns: 1fr;
            min-height: 320px;
          }

          .yam-post-media-grid-v2.media-count-2 {
            grid-template-columns: 1.1fr 0.9fr;
          }

          .yam-post-media-tile {
            position: relative;
            overflow: hidden;
            border-radius: 22px;
            min-height: 318px;
            background: linear-gradient(180deg, rgba(99,102,241,0.18), rgba(15,23,42,0.9));
          }

          .yam-post-media-grid-v2.media-count-3 .tile-2 {
            min-height: 318px;
          }

          .yam-post-media-image,
          .yam-post-media-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .yam-post-media-video {
            background: #000;
          }

          .yam-post-play-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.24));
          }

          .yam-post-play-overlay svg {
            width: 64px !important;
            height: 64px !important;
            padding: 18px;
            border-radius: 50%;
            color: #fff;
            background: rgba(255,255,255,0.16);
            backdrop-filter: blur(10px);
            box-shadow: 0 16px 35px rgba(0,0,0,0.32);
          }

          .scenic-video {
            background:
              linear-gradient(180deg, rgba(10,18,37,0.05), rgba(3,7,18,0.3)),
              radial-gradient(circle at 50% 35%, rgba(255,255,255,0.18), transparent 24%),
              linear-gradient(180deg, #4b5d7d 0%, #1b2740 44%, #0b1224 100%);
          }

          .scenic-lake {
            background:
              radial-gradient(circle at 65% 12%, rgba(255, 196, 148, 0.46), transparent 16%),
              linear-gradient(180deg, #8978ab 0%, #3f4d7c 30%, #173257 56%, #0a1730 100%);
          }

          .scenic-forest {
            background:
              linear-gradient(180deg, rgba(240,240,255,0.24), rgba(18,43,48,0.12) 28%, rgba(7,19,26,0.96) 100%),
              linear-gradient(180deg, #6c768f 0%, #253349 32%, #0f1f2b 100%);
          }

          .portrait-purple {
            background:
              radial-gradient(circle at 45% 30%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(120deg, #081021 12%, #3a065f 55%, #0d0f29 100%);
          }

          .yam-post-reactions-v2 {
            color: #ecf1ff;
            font-size: 14px;
            font-weight: 800;
          }

          .reaction-bubble {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            font-size: 12px;
            margin-inline-end: -6px;
            border: 2px solid rgba(7,12,25,0.95);
          }

          .reaction-bubble.like { background: #fb7185; }
          .reaction-bubble.support { background: #60a5fa; }
          .reaction-bubble.wow { background: #818cf8; }

          .yam-post-numbers-v2 {
            display: inline-flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 14px;
            color: #8994ba;
            font-size: 13px;
          }

          .yam-post-actions-v2 {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 12px;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .yam-post-actions-v2 button {
            border: none;
            background: transparent;
            color: #dce2f8;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 12px;
            cursor: pointer;
          }

          .yam-post-actions-v2 button:hover,
          .yam-post-actions-v2 button.active {
            background: rgba(124,58,237,0.14);
            color: #fff;
          }

          .yam-post-comments-panel {
            display: grid;
            gap: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }

          .yam-post-comment-composer {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-composer textarea {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #eef2ff;
            border-radius: 16px;
            padding: 14px;
            resize: vertical;
            min-height: 96px;
          }

          .yam-post-comment-send {
            justify-self: flex-start;
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(167,139,250,0.24);
            background: linear-gradient(135deg, rgba(124,58,237,0.92), rgba(99,102,241,0.92));
            color: white;
            padding: 0 16px;
            font-weight: 800;
          }

          .yam-post-comment-list {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-item,
          .yam-post-comment-empty {
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 12px 14px;
          }

          .yam-post-comment-item p {
            margin: 6px 0 0;
            color: #cbd5f5;
            line-height: 1.8;
          }

          .yam-post-comment-empty {
            color: #94a3b8;
          }

          .yam-right-rail {
            display: grid;
            gap: 18px;
            max-height: calc(100vh - 40px);
            overflow: auto;
            align-self: start;
          }

          .yam-profile-card-v2 {
            overflow: hidden;
          }

          .yam-profile-cover-v2 {
            min-height: 146px;
            padding: 18px;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            background:
              radial-gradient(circle at 50% 0%, rgba(146, 71, 255, 0.34), transparent 34%),
              linear-gradient(180deg, #0f1230 0%, #0a0f21 100%);
          }

          .yam-profile-cover-brand {
            letter-spacing: 0.28em;
            color: #ede6ff;
            font-size: 14px;
            font-weight: 900;
            margin-top: 8px;
          }

          .yam-profile-body-v2 {
            position: relative;
            padding: 0 20px 20px;
            text-align: center;
          }

          .yam-profile-avatar-wrap {
            position: relative;
            width: fit-content;
            margin: -48px auto 12px;
          }

          .yam-avatar-camera-btn {
            position: absolute;
            inset-inline-end: 0;
            bottom: 4px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(10,15,30,0.92);
            color: #fff;
            display: grid;
            place-items: center;
          }

          .yam-profile-stats-v2 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin: 16px 0;
          }

          .yam-profile-stats-v2 div {
            display: grid;
            gap: 4px;
          }

          .yam-profile-stats-v2 strong {
            font-size: 24px;
          }

          .yam-profile-stats-v2 span,
          .yam-highlight-item-v2 span,
          .yam-summary-row-v2 span:last-child {
            color: #97a3ca;
            font-size: 13px;
          }

          .yam-profile-bio-v2 {
            margin: 0;
            color: #dbe3fc;
            line-height: 1.9;
            font-size: 14px;
          }

          .yam-primary-action-btn {
            flex: 1;
            min-height: 48px;
            border: none;
            border-radius: 16px;
            color: #fff;
            font-weight: 800;
            background: linear-gradient(135deg, #6d3cf0, #8b5cf6);
            box-shadow: 0 16px 34px rgba(109, 60, 240, 0.28);
          }

          .yam-highlights-row-v2 {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-top: 14px;
          }

          .yam-highlight-item-v2 {
            min-width: 64px;
            display: grid;
            justify-items: center;
            gap: 8px;
          }

          .yam-highlight-ring {
            width: 62px;
            height: 62px;
            border-radius: 50%;
            padding: 3px;
            display: grid;
            place-items: center;
            color: #fff;
            background: linear-gradient(135deg, #7c3aed, #d946ef);
          }

          .yam-highlight-ring::before {
            content: '';
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(180deg, #151a39, #090d1d);
            display: block;
          }

          .yam-highlight-ring.add {
            background: linear-gradient(135deg, #353f62, #1a2035);
            position: relative;
          }

          .yam-highlight-ring svg,
          .yam-highlight-ring.add svg {
            position: absolute;
            z-index: 1;
          }

          .yam-highlight-ring.travel,
          .yam-highlight-ring.design,
          .yam-highlight-ring.moments,
          .yam-highlight-ring.projects {
            position: relative;
          }

          .yam-highlight-ring.travel::after,
          .yam-highlight-ring.design::after,
          .yam-highlight-ring.moments::after,
          .yam-highlight-ring.projects::after {
            content: '';
            position: absolute;
            inset: 8px;
            border-radius: 50%;
            background:
              radial-gradient(circle at 55% 30%, rgba(255,255,255,0.14), transparent 18%),
              linear-gradient(180deg, #273657, #111931 70%, #0a1022);
          }

          .yam-summary-card-v2 {
            padding: 18px;
          }

          .yam-summary-card-v2 h3 {
            margin: 0;
            font-size: 20px;
          }

          .yam-summary-list-v2 {
            display: grid;
            gap: 14px;
            margin-top: 14px;
          }

          .yam-summary-row-v2 {
            justify-content: flex-start;
            gap: 12px;
            color: #dbe2fb;
          }

          .yam-summary-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            color: #c9b7ff;
            background: rgba(255,255,255,0.04);
          }

          .yam-laptop-avatar {
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 22px;
            font-weight: 900;
            background:
              radial-gradient(circle at 50% 28%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(140deg, #1b2340 10%, #6241a8 60%, #0f1428 100%);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 14px 24px rgba(0,0,0,0.24);
            overflow: hidden;
          }

          .yam-laptop-avatar.image span {
            transform: translateY(8px);
          }

          .yam-laptop-avatar.accent {
            box-shadow: 0 0 0 4px rgba(124,58,237,0.18), 0 14px 24px rgba(0,0,0,0.24);
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          .yam-post-live-card {
            width: 100%;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .yam-post-live-card:hover .yam-post-live-background {
            box-shadow: 0 8px 24px rgba(124, 58, 237, 0.2);
          }

          @media (max-width: 1380px) {
            .yam-laptop-shell {
              grid-template-columns: 220px minmax(0, 1fr) 320px;
            }
          }

          @media (max-width: 1140px) {
            .yam-laptop-shell {
              grid-template-columns: minmax(0, 1fr);
            }

            .yam-left-rail,
            .yam-right-rail {
              position: static;
            }

            .yam-left-rail {
              order: 2;
            }

            .yam-right-rail {
              order: 3;
            }
          }

          @media (max-width: 1024px) {
            .page-content.yam-feed-page-locked {
              overflow-y: auto;
            }

            .yam-laptop-page {
              min-height: auto;
              overflow-x: hidden;
              overflow-y: visible;
            }

            .yam-laptop-shell {
              width: 100%;
              padding: 8px 10px calc(96px + env(safe-area-inset-bottom, 0px));
              gap: 14px;
              min-height: auto;
              grid-template-columns: 1fr;
            }

            .yam-left-rail,
            .yam-right-rail {
              display: none;
            }

            .yam-feed-header-card,
            .yam-post-card-v2,
            .yam-summary-card-v2,
            .yam-profile-card-v2 {
              border-radius: 22px;
            }

            .yam-feed-header-top h1 {
              font-size: 24px;
            }

            .yam-mobile-brand {
              display: block;
            }

            .yam-composer-prompt-bar {
              grid-template-columns: 1fr;
            }

            .yam-composer-actions-inline {
              width: 100%;
              overflow-x: auto;
              padding-bottom: 2px;
            }

            .yam-post-media-grid-v2,
            .yam-post-media-grid-v2.media-count-2,
            .yam-post-media-grid-v2.media-count-3 {
              grid-template-columns: 1fr;
              min-height: auto;
            }

            .yam-post-media-tile,
            .yam-post-media-grid-v2.media-count-3 .tile-2 {
              min-height: 220px;
            }

            .yam-feed-header-card,
            .yam-post-card-v2,
            .yam-home-composer-slot,
            .yam-post-comments-panel {
              width: 100%;
              max-width: 100%;
              overflow: hidden;
            }

            .yam-post-head-v2,
            .yam-post-author-v2,
            .yam-post-meta-v2 {
              min-width: 0;
              flex-wrap: wrap;
            }

            .yam-post-author-copy,
            .yam-post-copy-v2,
            .yam-post-handle {
              min-width: 0;
              overflow-wrap: anywhere;
            }

            .yam-post-stats-v2 {
              gap: 10px;
              flex-direction: column;
              align-items: flex-start;
            }

            .yam-post-numbers-v2 {
              justify-content: flex-start;
            }

            .yam-post-actions-v2 {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              align-items: stretch;
              width: 100%;
              gap: 8px;
            }

            .yam-post-actions-v2 button {
              width: 100%;
              min-width: 0;
              justify-content: center;
              flex-direction: row;
              gap: 6px;
              padding: 10px 6px;
              background: rgba(255,255,255,0.03);
              font-size: 11px;
              text-align: center;
              white-space: nowrap;
            }

            .yam-post-actions-v2 button svg {
              width: 18px !important;
              height: 18px !important;
            }

            .yam-center-stage,
            .yam-post-stack-v2 {
              max-height: none;
              overflow: visible !important;
              height: auto !important;
            }
          }
        ` })
  ] }) });
}
export {
  FeedEnhanced as default
};
