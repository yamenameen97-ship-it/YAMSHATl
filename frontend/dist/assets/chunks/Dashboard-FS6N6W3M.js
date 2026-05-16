import {
  MainLayout
} from "./chunk-ZOZSORVL.js";
import "./chunk-AB4CHF2R.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import {
  DashboardSkeleton
} from "./chunk-4ZQ5VGKF.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  Link,
  getStoredUser,
  useAppStore
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Dashboard.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var RealtimeChart = ({ data, color = "#3b82f6", label }) => {
  const max = Math.max(...data, 1);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "realtime-chart-container", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chart-label", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chart-bars", children: data.map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        className: "chart-bar",
        style: {
          height: `${v / max * 100}%`,
          backgroundColor: color,
          transition: "height 0.3s ease"
        }
      },
      i
    )) })
  ] });
};
function Dashboard() {
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [metrics, setMetrics] = (0, import_react.useState)({
    onlineUsers: Array(20).fill(0).map(() => Math.floor(Math.random() * 100 + 500)),
    postActivity: Array(20).fill(0).map(() => Math.floor(Math.random() * 50 + 100)),
    systemLoad: 24,
    storageUsed: 65
  });
  const user = getStoredUser();
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const analytics = (0, import_react.useMemo)(() => ({
    topPosts: [
      { id: 1, title: "\u062A\u062D\u062F\u064A\u062B \u064A\u0645\u0634\u0627\u062A \u0627\u0644\u062C\u062F\u064A\u062F", engagement: "98%", reach: "12.5k" },
      { id: 2, title: "\u0643\u064A\u0641 \u062A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A", engagement: "85%", reach: "8.2k" }
    ],
    userGrowth: "+15% \u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639",
    avgSession: "12m 45s"
  }), []);
  (0, import_react.useEffect)(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        onlineUsers: [...prev.onlineUsers.slice(1), Math.floor(Math.random() * 100 + 500)],
        postActivity: [...prev.postActivity.slice(1), Math.floor(Math.random() * 50 + 100)],
        systemLoad: Math.min(100, Math.max(10, prev.systemLoad + (Math.random() * 10 - 5)))
      }));
    }, 2e3);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardSkeleton, {}) });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dashboard-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { className: "welcome-widget", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "welcome-flex", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "user-info", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
            "\u0623\u0647\u0644\u0627\u064B \u0628\u0643\u060C ",
            user?.username || "\u0645\u0633\u062A\u062E\u062F\u0645 \u064A\u0645\u0634\u0627\u062A",
            " \u{1F44B}"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", children: "\u0625\u0644\u064A\u0643 \u0646\u0638\u0631\u0629 \u0633\u0631\u064A\u0639\u0629 \u0639\u0644\u0649 \u0646\u0634\u0627\u0637 \u062D\u0633\u0627\u0628\u0643 \u0648\u0645\u0646\u0635\u062A\u0643 \u0627\u0644\u064A\u0648\u0645." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "status-badges", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `status-pill ${isOnline ? "online" : "offline"}`, children: isOnline ? "\u0645\u062A\u0635\u0644 \u0628\u0627\u0644\u062E\u0627\u062F\u0645" : "\u063A\u064A\u0631 \u0645\u062A\u0635\u0644" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-pill security", children: "\u062D\u0645\u0627\u064A\u0629 \u0645\u0641\u0639\u0644\u0629" })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "monitoring-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { className: "metric-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RealtimeChart, { data: metrics.onlineUsers, label: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0627\u0644\u0645\u062A\u0635\u0644\u0648\u0646 (\u0627\u0644\u0622\u0646)", color: "#10b981" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "metric-footer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "current-val", children: metrics.onlineUsers[metrics.onlineUsers.length - 1] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "trend up", children: "+2.4%" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { className: "metric-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RealtimeChart, { data: metrics.postActivity, label: "\u0646\u0634\u0627\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A / \u062F\u0642\u064A\u0642\u0629", color: "#6366f1" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "metric-footer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "current-val", children: metrics.postActivity[metrics.postActivity.length - 1] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "trend up", children: "+5.1%" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { className: "system-health-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0635\u062D\u0629 \u0627\u0644\u0646\u0638\u0627\u0645" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "health-grid", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "health-item", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: "\u062D\u0645\u0648\u0644\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062C" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "progress-bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "progress-fill", style: { width: `${metrics.systemLoad}%`, backgroundColor: metrics.systemLoad > 80 ? "#ef4444" : "#3b82f6" } }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                Math.round(metrics.systemLoad),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "health-item", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "progress-bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "progress-fill", style: { width: `${metrics.storageUsed}%` } }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                metrics.storageUsed,
                "%"
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "analytics-main-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { className: "analytics-details", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "card-header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0639\u0645\u064A\u0642\u0629 (Deep Analytics)" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { size: "small", variant: "secondary", children: "\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u062A\u0642\u0631\u064A\u0631" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "analytics-stats-grid", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-box", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "stat-label", children: "\u0646\u0645\u0648 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "stat-value", children: analytics.userGrowth })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-box", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "stat-label", children: "\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u062C\u0644\u0633\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "stat-value", children: analytics.avgSession })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "stat-box", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "stat-label", children: "\u0645\u0639\u062F\u0644 \u0627\u0644\u0627\u0631\u062A\u062F\u0627\u062F" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "stat-value", children: "24.2%" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "top-content", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0623\u0643\u062B\u0631 \u062A\u0641\u0627\u0639\u0644\u0627\u064B" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "analytics-table", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "\u0627\u0644\u062A\u0641\u0627\u0639\u0644" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "\u0627\u0644\u0648\u0635\u0648\u0644" })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: analytics.topPosts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: post.title }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "engagement-badge", children: post.engagement }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: post.reach })
              ] }, post.id)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { className: "quick-actions-sidebar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0633\u0631\u064A\u0639\u0629" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "actions-list", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/profile", className: "action-item", children: "\u{1F464} \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/settings", className: "action-item", children: "\u2699\uFE0F \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0623\u0645\u0627\u0646" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/notifications", className: "action-item", children: "\u{1F514} \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "action-item danger", children: "\u{1F6AA} \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { dangerouslySetInnerHTML: { __html: `
        .dashboard-grid { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
        .monitoring-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .realtime-chart-container { height: 120px; display: flex; flex-direction: column; gap: 10px; }
        .chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
        .chart-bar { flex: 1; border-radius: 2px 2px 0 0; }
        .metric-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .current-val { font-size: 24px; font-weight: bold; }
        .trend.up { color: #10b981; font-size: 14px; }
        .health-grid { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
        .progress-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; transition: width 0.5s ease; }
        .analytics-main-row { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .analytics-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; }
        .stat-value { font-size: 18px; font-weight: bold; color: #111827; }
        .analytics-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .analytics-table th { text-align: right; padding: 10px; border-bottom: 2px solid #f3f4f6; color: #6b7280; font-size: 13px; }
        .analytics-table td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; }
        .engagement-badge { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .actions-list { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; }
        .action-item { padding: 12px; background: #f9fafb; border-radius: 8px; text-decoration: none; color: #374151; transition: all 0.2s; }
        .action-item:hover { background: #f3f4f6; transform: translateX(-5px); }
        .action-item.danger { color: #ef4444; border: none; text-align: right; cursor: pointer; }
        @media (max-width: 768px) { .analytics-main-row { grid-template-columns: 1fr; } }
      ` } })
  ] });
}
export {
  Dashboard as default
};
