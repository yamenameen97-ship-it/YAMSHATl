import { bG as useToast, bA as useNotificationStore, b0 as reactExports, bl as socketManager, aO as normalizeNotification, ar as jsxRuntimeExports, h as MainLayout, d as Card, c as Button, s as audioService, aD as maybeShowBrowserNotification, b2 as redirectToAppPath } from "../index-D5NOBPt4.js";
import { M as Modal } from "./Modal-DakIp0eG.js";
import { g as getNotifications } from "./notifications-MOZRSPGC.js";
import { F as FixedSizeList } from "./index.esm-Dmp9q2sQ.js";
import { A as AutoSizer } from "./react-virtualized-auto-sizer.esm-B1_QiHk9.js";
const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "unread", label: "غير مقروء" },
  { id: "mention", label: "Mentions" },
  { id: "chat", label: "الرسائل" },
  { id: "live", label: "البث" }
];
function getNotificationBucket(item) {
  if (item.type === "mention" || item.category === "mention") return "mentions";
  if (item.type === "chat" || item.category === "chat") return "messages";
  if (item.type === "live" || item.category === "live") return "live";
  return "general";
}
function getNotificationMeta(item) {
  const bucket = getNotificationBucket(item);
  if (bucket === "mentions") return { icon: "@", label: "منشنات", tone: "#f59e0b" };
  if (bucket === "messages") return { icon: "💬", label: "رسائل", tone: "#06b6d4" };
  if (bucket === "live") return { icon: "🔴", label: "بث حي", tone: "#22c55e" };
  return { icon: "🔔", label: "عامة", tone: "#8b5cf6" };
}
const NotificationRow = ({ index: index2, style, data }) => {
  const { items, markRead, removeNotification, settings } = data;
  const notification = items[index2];
  if (!notification) return null;
  const meta = getNotificationMeta(notification);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, padding: "5px 10px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 16, display: "flex", gap: 14, alignItems: "start", border: notification.seen ? "1px solid var(--line)" : `1px solid ${meta.tone}44`, background: notification.seen ? "var(--bg-card)" : `${meta.tone}12`, height: "100%" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 46, height: 46, borderRadius: 16, background: `linear-gradient(135deg, ${meta.tone}, #0ea5e9)`, display: "grid", placeItems: "center", color: "white", fontSize: 20 }, children: meta.icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
            notification.title,
            !notification.seen ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "notif-live-badge", children: "Live" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { marginTop: 4, lineHeight: 1.6, fontSize: 13 }, children: notification.body })
        ] }),
        !notification.seen ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "notif-dot" }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 12 }, children: new Date(notification.created_at || Date.now()).toLocaleString("ar-EG") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
          !notification.seen ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: () => markRead(notification.id), children: "مقروء" }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: () => {
            markRead(notification.id);
            if (settings.deepLinking) redirectToAppPath(notification.path || "/notifications", { replace: false });
          }, children: "فتح" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: () => removeNotification(notification.id), children: "إخفاء" })
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
  const [activeFilter, setActiveFilter] = reactExports.useState("all");
  const [showSettings, setShowSettings] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  const isMountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const [settings, setSettings] = reactExports.useState({
    pushEnabled: true,
    realtimeEnabled: true,
    groupedNotifications: false,
    // Virtualization works better without grouping in this simple implementation
    deepLinking: true,
    browserPermission: typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  });
  reactExports.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getNotifications();
        if (!active || !isMountedRef.current) return;
        hydrateNotifications(Array.isArray(data) ? data.map(normalizeNotification) : [], { replace: true });
      } finally {
        if (active && isMountedRef.current) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [hydrateNotifications]);
  reactExports.useEffect(() => {
    if (!settings.realtimeEnabled) return void 0;
    let subscriptionActive = true;
    const handleIncoming = async (incoming) => {
      if (!subscriptionActive || !isMountedRef.current) return;
      const nextItem = normalizeNotification(incoming);
      upsertNotification(nextItem);
      if (!subscriptionActive || !isMountedRef.current) return;
      audioService.onNotification(nextItem.type || nextItem.category || "generic");
      pushToast({ type: "info", title: nextItem.title, description: nextItem.body, duration: 4200 });
      if (settings.pushEnabled) {
        try {
          await maybeShowBrowserNotification(nextItem);
        } catch {
        }
      }
    };
    const unsubscribe = socketManager.on("new_notification", handleIncoming);
    return () => {
      subscriptionActive = false;
      try {
        unsubscribe?.();
      } catch {
      }
    };
  }, [pushToast, settings.pushEnabled, settings.realtimeEnabled, upsertNotification]);
  const filteredItems = reactExports.useMemo(() => {
    const normalized = items.map(normalizeNotification);
    return normalized.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return !item.seen;
      if (activeFilter === "mention") return item.type === "mention" || item.category === "mention";
      return item.type === activeFilter || item.category === activeFilter || item.payload?.screen === activeFilter;
    });
  }, [activeFilter, items]);
  const listData = reactExports.useMemo(() => ({
    items: filteredItems,
    markRead,
    removeNotification,
    settings
  }), [filteredItems, markRead, removeNotification, settings]);
  const unreadCount = reactExports.useMemo(() => items.filter((item) => !normalizeNotification(item).seen).length, [items]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-notifications-page", "data-page": "notifications", dir: "rtl", style: { maxWidth: 920, margin: "0 auto", padding: "20px 10px", height: "calc(100vh - 70px)", display: "flex", flexDirection: "column", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 18 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0 }, children: "الإشعارات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { marginTop: 6 }, children: "نظام تنبيهات ذكي ومحسن للأداء" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setShowSettings(true), children: "⚙️ الإعدادات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => markAllRead(), children: "تحديد الكل كمقروء" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }, children: FILTERS.map((filter) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setActiveFilter(filter.id), className: `notif-filter-chip ${activeFilter === filter.id ? "active" : ""}`, children: [
        filter.label,
        filter.id === "unread" && unreadCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: unreadCount }) : null
      ] }, filter.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1 }, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 24 }, children: "جارٍ تحميل الإشعارات..." }) : filteredItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 36, textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 42 }, children: "📭" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "لا توجد إشعارات حالياً" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: showSettings, onClose: () => setShowSettings(false), title: "إعدادات الإشعارات", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 14 }, children: [
      [
        ["pushEnabled", "Push notifications"],
        ["realtimeEnabled", "Realtime notifications"],
        ["deepLinking", "Deep linking"]
      ].map(([key, label]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, background: "rgba(59,130,246,0.05)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: label }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: Boolean(settings[key]), onChange: (event) => setSettings((prev) => ({ ...prev, [key]: event.target.checked })) })
      ] }, key)),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowSettings(false), children: "تم" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
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
const Notifications$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Notifications
}, Symbol.toStringTag, { value: "Module" }));
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Notifications
}, Symbol.toStringTag, { value: "Module" }));
export {
  Notifications$1 as N,
  index as i
};
