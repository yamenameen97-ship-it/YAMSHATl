import {
  AutoSizer,
  FixedSizeList
} from "./chunk-U2HBZFH7.js";
import {
  MainLayout,
  getNotifications
} from "./chunk-ZOZSORVL.js";
import {
  maybeShowBrowserNotification,
  normalizeNotification,
  useNotificationStore
} from "./chunk-AB4CHF2R.js";
import {
  Modal
} from "./chunk-ERP4JHH7.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import {
  socketManager_default
} from "./chunk-46YZGXXY.js";
import {
  useToast
} from "./chunk-OIWCOE6H.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  redirectToAppPath
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Notifications.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var FILTERS = [
  { id: "all", label: "\u0627\u0644\u0643\u0644" },
  { id: "unread", label: "\u063A\u064A\u0631 \u0645\u0642\u0631\u0648\u0621" },
  { id: "mention", label: "Mentions" },
  { id: "chat", label: "\u0627\u0644\u0631\u0633\u0627\u0626\u0644" },
  { id: "live", label: "\u0627\u0644\u0628\u062B" }
];
function getNotificationBucket(item) {
  if (item.type === "mention" || item.category === "mention") return "mentions";
  if (item.type === "chat" || item.category === "chat") return "messages";
  if (item.type === "live" || item.category === "live") return "live";
  return "general";
}
function getNotificationMeta(item) {
  const bucket = getNotificationBucket(item);
  if (bucket === "mentions") return { icon: "@", label: "\u0645\u0646\u0634\u0646\u0627\u062A", tone: "#f59e0b" };
  if (bucket === "messages") return { icon: "\u{1F4AC}", label: "\u0631\u0633\u0627\u0626\u0644", tone: "#06b6d4" };
  if (bucket === "live") return { icon: "\u{1F534}", label: "\u0628\u062B \u062D\u064A", tone: "#22c55e" };
  return { icon: "\u{1F514}", label: "\u0639\u0627\u0645\u0629", tone: "#8b5cf6" };
}
var NotificationRow = ({ index, style, data }) => {
  const { items, markRead, removeNotification, settings } = data;
  const notification = items[index];
  if (!notification) return null;
  const meta = getNotificationMeta(notification);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...style, padding: "5px 10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 16, display: "flex", gap: 14, alignItems: "start", border: notification.seen ? "1px solid var(--line)" : `1px solid ${meta.tone}44`, background: notification.seen ? "var(--bg-card)" : `${meta.tone}12`, height: "100%" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 46, height: 46, borderRadius: 16, background: `linear-gradient(135deg, ${meta.tone}, #0ea5e9)`, display: "grid", placeItems: "center", color: "white", fontSize: 20 }, children: meta.icon }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontWeight: 700, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
            notification.title,
            !notification.seen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "notif-live-badge", children: "Live" }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { marginTop: 4, lineHeight: 1.6, fontSize: 13 }, children: notification.body })
        ] }),
        !notification.seen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "notif-dot" }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", style: { fontSize: 12 }, children: new Date(notification.created_at || Date.now()).toLocaleString("ar-EG") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
          !notification.seen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => markRead(notification.id), children: "\u0645\u0642\u0631\u0648\u0621" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => {
            markRead(notification.id);
            if (settings.deepLinking) redirectToAppPath(notification.path || "/notifications", { replace: false });
          }, children: "\u0641\u062A\u062D" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", size: "sm", onClick: () => removeNotification(notification.id), children: "\u0625\u062E\u0641\u0627\u0621" })
        ] })
      ] })
    ] })
  ] }) });
};
function Notifications() {
  const { pushToast } = useToast();
  const items = useNotificationStore((state) => state.items);
  const hydrateNotifications = useNotificationStore((state) => state.hydrateNotifications);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const [activeFilter, setActiveFilter] = (0, import_react.useState)("all");
  const [showSettings, setShowSettings] = (0, import_react.useState)(false);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [settings, setSettings] = (0, import_react.useState)({
    pushEnabled: true,
    realtimeEnabled: true,
    groupedNotifications: false,
    // Virtualization works better without grouping in this simple implementation
    deepLinking: true,
    browserPermission: typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  });
  (0, import_react.useEffect)(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getNotifications();
        if (!active) return;
        hydrateNotifications(Array.isArray(data) ? data.map(normalizeNotification) : [], { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [hydrateNotifications]);
  (0, import_react.useEffect)(() => {
    if (!settings.realtimeEnabled) return void 0;
    const handleIncoming = async (incoming) => {
      const nextItem = normalizeNotification(incoming);
      upsertNotification(nextItem);
      pushToast({ type: "info", title: nextItem.title, description: nextItem.body, duration: 4200 });
      if (settings.pushEnabled) await maybeShowBrowserNotification(nextItem).catch(() => null);
    };
    const unsubscribe = socketManager_default.on("new_notification", handleIncoming);
    return () => unsubscribe();
  }, [pushToast, settings.pushEnabled, settings.realtimeEnabled, upsertNotification]);
  const filteredItems = (0, import_react.useMemo)(() => {
    const normalized = items.map(normalizeNotification);
    return normalized.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return !item.seen;
      if (activeFilter === "mention") return item.type === "mention" || item.category === "mention";
      return item.type === activeFilter || item.category === activeFilter || item.payload?.screen === activeFilter;
    });
  }, [activeFilter, items]);
  const listData = (0, import_react.useMemo)(() => ({
    items: filteredItems,
    markRead,
    removeNotification,
    settings
  }), [filteredItems, markRead, removeNotification, settings]);
  const unreadCount = (0, import_react.useMemo)(() => items.filter((item) => !normalizeNotification(item).seen).length, [items]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { maxWidth: 920, margin: "0 auto", padding: "20px 10px", height: "calc(100vh - 70px)", display: "flex", flexDirection: "column", gap: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 18 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { margin: 0 }, children: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { marginTop: 6 }, children: "\u0646\u0638\u0627\u0645 \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0630\u0643\u064A \u0648\u0645\u062D\u0633\u0646 \u0644\u0644\u0623\u062F\u0627\u0621" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setShowSettings(true), children: "\u2699\uFE0F \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => markAllRead(), children: "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0643\u0644 \u0643\u0645\u0642\u0631\u0648\u0621" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }, children: FILTERS.map((filter) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", onClick: () => setActiveFilter(filter.id), className: `notif-filter-chip ${activeFilter === filter.id ? "active" : ""}`, children: [
        filter.label,
        filter.id === "unread" && unreadCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: unreadCount }) : null
      ] }, filter.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1 }, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 24 }, children: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A..." }) : filteredItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 36, textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 42 }, children: "\u{1F4ED}" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u062D\u0627\u0644\u064A\u0627\u064B" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        FixedSizeList,
        {
          height,
          width,
          itemCount: filteredItems.length,
          itemSize: 160,
          itemData: listData,
          className: "no-scrollbar",
          children: NotificationRow
        }
      ) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { open: showSettings, onClose: () => setShowSettings(false), title: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 14 }, children: [
      [
        ["pushEnabled", "Push notifications"],
        ["realtimeEnabled", "Realtime notifications"],
        ["deepLinking", "Deep linking"]
      ].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, background: "rgba(59,130,246,0.05)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: Boolean(settings[key]), onChange: (event) => setSettings((prev) => ({ ...prev, [key]: event.target.checked })) })
      ] }, key)),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: () => setShowSettings(false), children: "\u062A\u0645" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .notif-filter-chip {
          border: none;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(59,130,246,0.08);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .notif-filter-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .notif-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2563eb;
          flex-shrink: 0;
          margin-top: 6px;
        }
        .notif-live-badge {
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(34,197,94,0.14);
          color: #86efac;
          font-size: 11px;
          font-weight: 800;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` })
  ] });
}

export {
  Notifications
};
