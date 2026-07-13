import { bz as useNavigate, bG as useToast, b0 as reactExports, aj as getStoredUser, bt as useAppStore, ar as jsxRuntimeExports, h as MainLayout, e as DashboardSkeleton, d as Card, c as Button, f as Link, z as clearStoredUser } from "../index-TztUfWYS.js";
const RealtimeChart = ({ data, color = "#3b82f6", label }) => {
  const max = Math.max(...data, 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "realtime-chart-container", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chart-label", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chart-bars", children: data.map((v, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [loading, setLoading] = reactExports.useState(true);
  const [metrics, setMetrics] = reactExports.useState({
    onlineUsers: Array(20).fill(0).map(() => Math.floor(Math.random() * 100 + 500)),
    postActivity: Array(20).fill(0).map(() => Math.floor(Math.random() * 50 + 100)),
    systemLoad: 24,
    storageUsed: 65
  });
  const user = getStoredUser();
  useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const handleExportAnalytics = () => {
    const report = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      username: user?.username || "yamshat-user",
      metrics: {
        onlineUsersNow: metrics.onlineUsers[metrics.onlineUsers.length - 1],
        postActivityNow: metrics.postActivity[metrics.postActivity.length - 1],
        systemLoad: Math.round(metrics.systemLoad),
        storageUsed: metrics.storageUsed
      },
      analytics
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `yamshat-dashboard-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    pushToast({ type: "success", title: "تم تصدير التقرير", description: "تم تنزيل تقرير لوحة التحكم بصيغة JSON." });
  };
  const handleLogout = () => {
    clearStoredUser();
    pushToast({ type: "info", title: "تم تسجيل الخروج", description: "نراك قريبًا داخل يام شات." });
    navigate("/login", { replace: true });
  };
  const analytics = reactExports.useMemo(() => ({
    topPosts: [
      { id: 1, title: "تحديث يام شات الجديد", engagement: "98%", reach: "12.5k" },
      { id: 2, title: "كيف تستخدم الذكاء الاصطناعي", engagement: "85%", reach: "8.2k" }
    ],
    userGrowth: "+15% هذا الأسبوع",
    avgSession: "12m 45s"
  }), []);
  reactExports.useEffect(() => {
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
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardSkeleton, {}) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "dashboard-grid", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "welcome-widget", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "welcome-flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { children: [
            "أهلاً بك، ",
            user?.username || "مستخدم يام شات",
            " 👋"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "إليك نظرة سريعة على نشاط حسابك ومنصتك اليوم." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "status-badges", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `status-pill ${isOnline ? "online" : "offline"}`, children: isOnline ? "متصل بالخادم" : "غير متصل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-pill security", children: "حماية مفعلة" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "monitoring-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "metric-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RealtimeChart, { data: metrics.onlineUsers, label: "المستخدمون المتصلون (الآن)", color: "#10b981" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-footer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "current-val", children: metrics.onlineUsers[metrics.onlineUsers.length - 1] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "trend up", children: "+2.4%" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "metric-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RealtimeChart, { data: metrics.postActivity, label: "نشاط المنشورات / دقيقة", color: "#6366f1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "metric-footer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "current-val", children: metrics.postActivity[metrics.postActivity.length - 1] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "trend up", children: "+5.1%" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "system-health-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "صحة النظام" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "health-grid", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "health-item", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "حمولة المعالج" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill", style: { width: `${metrics.systemLoad}%`, backgroundColor: metrics.systemLoad > 80 ? "#ef4444" : "#3b82f6" } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                Math.round(metrics.systemLoad),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "health-item", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "مساحة التخزين" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill", style: { width: `${metrics.storageUsed}%` } }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                metrics.storageUsed,
                "%"
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "analytics-main-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "analytics-details", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card-header", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "تحليلات عميقة (Deep Analytics)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: handleExportAnalytics, children: "تصدير التقرير" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "analytics-stats-grid", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "نمو المستخدمين" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: analytics.userGrowth })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "متوسط الجلسة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: analytics.avgSession })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "معدل الارتداد" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: "24.2%" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "top-content", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "المحتوى الأكثر تفاعلاً" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "analytics-table", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "العنوان" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "التفاعل" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "الوصول" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: analytics.topPosts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: post.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "engagement-badge", children: post.engagement }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: post.reach })
              ] }, post.id)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "quick-actions-sidebar", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "إجراءات سريعة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "actions-list", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "action-item", children: "👤 تعديل الملف الشخصي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/settings", className: "action-item", children: "⚙️ إعدادات الأمان" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/notifications", className: "action-item", children: "🔔 إدارة التنبيهات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "action-item danger", onClick: handleLogout, children: "🚪 تسجيل الخروج" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { dangerouslySetInnerHTML: { __html: `
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
