import { r as reactExports, j as jsxRuntimeExports, B as Button } from "../index-BAMQT-m6.js";
import { M as MainLayout } from "./MainLayout-R4-pAMZD.js";
import { C as Card } from "./Card-BJoniTPs.js";
import { M as Modal } from "./Modal-zc2pETlg.js";
import { E as EmptyState } from "./EmptyState-a8e0B9JF.js";
import { g as getGroups, c as createGroup } from "./groups-MJv_7L3Z.js";
import "./proxy--nYX4zu0.js";
const ROLES = [
  { id: "admin", label: "مدير", color: "#ff4444" },
  { id: "moderator", label: "مشرف", color: "#ffaa00" },
  { id: "member", label: "عضو", color: "#44ff44" }
];
function Groups() {
  const [groups, setGroups] = reactExports.useState([]);
  const [selectedGroup, setSelectedGroup] = reactExports.useState(null);
  const [showInviteModal, setShowInviteModal] = reactExports.useState(false);
  const [showAnalytics, setShowAnalytics] = reactExports.useState(false);
  const [showCreateModal, setShowCreateModal] = reactExports.useState(false);
  const [createForm, setCreateForm] = reactExports.useState({ name: "", description: "" });
  const [savingGroup, setSavingGroup] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("members");
  reactExports.useEffect(() => {
    loadGroups();
  }, []);
  const loadGroups = async () => {
    const { data } = await getGroups();
    setGroups(data || []);
    if (data?.length > 0) setSelectedGroup(data[0]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", height: "calc(100vh - 70px)", maxWidth: 1200, margin: "0 auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: 300, borderLeft: "1px solid var(--line)", padding: 20, overflowY: "auto" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0 }, children: "مجموعاتي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => setShowCreateModal(true), children: "➕" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: groups.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            onClick: () => setSelectedGroup(g),
            style: {
              padding: 12,
              cursor: "pointer",
              background: selectedGroup?.id === g.id ? "rgba(139, 92, 246, 0.1)" : "",
              border: selectedGroup?.id === g.id ? "1px solid var(--primary)" : "1px solid transparent"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "bold" }, children: g.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 12 }, children: [
                g.members_count,
                " عضو"
              ] })
            ]
          },
          g.id
        )) })
      ] }),
      selectedGroup ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, padding: 30, overflowY: "auto" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { margin: "0 0 8px 0" }, children: selectedGroup.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: selectedGroup.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setShowInviteModal(true), children: "➕ دعوة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowAnalytics(true), children: "📊 التحليلات" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 20, borderBottom: "1px solid var(--line)", marginBottom: 24 }, children: ["members", "moderation", "settings"].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setActiveTab(tab),
            style: {
              padding: "12px 0",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
              color: activeTab === tab ? "white" : "#888",
              cursor: "pointer",
              fontWeight: activeTab === tab ? "bold" : "normal"
            },
            children: tab === "members" ? "الأعضاء" : tab === "moderation" ? "الرقابة" : "الإعدادات"
          },
          tab
        )) }),
        activeTab === "members" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: [
          { id: 1, name: "أحمد محمد", role: "admin" },
          { id: 2, name: "سارة خالد", role: "moderator" },
          { id: 3, name: "ياسين علي", role: "member" }
        ].map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 35, height: 35, borderRadius: "50%", background: "#444" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "bold" }, children: member.name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 15 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 10,
              background: ROLES.find((r) => r.id === member.role).color + "33",
              color: ROLES.find((r) => r.id === member.role).color
            }, children: ROLES.find((r) => r.id === member.role).label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { background: "none", border: "none", color: "#888", cursor: "pointer" }, children: "⚙️" })
          ] })
        ] }, member.id)) }),
        activeTab === "moderation" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 20 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "المنشورات المعلقة (Pending)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { textAlign: "center", padding: "20px 0" }, children: "لا توجد منشورات بانتظار المراجعة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "قواعد المجموعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10, marginTop: 15 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 10, background: "rgba(255,255,255,0.05)", borderRadius: 8 }, children: "1. الاحترام المتبادل بين الأعضاء" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 10, background: "rgba(255,255,255,0.05)", borderRadius: 8 }, children: "2. يمنع نشر الروابط الخارجية دون إذن" })
            ] })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "اختر مجموعة لعرض تفاصيلها" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showInviteModal, onClose: () => setShowInviteModal(false), title: "دعوة أعضاء للمجموعة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "شارك رابط الدعوة مع أصدقائك:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            readOnly: true,
            value: `https://yamshat.com/join/${selectedGroup?.id}`,
            style: { flex: 1, background: "#222", border: "1px solid #444", padding: 10, borderRadius: 8, color: "white" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => alert("تم النسخ!"), children: "نسخ" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divider", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "أو ابحث عن صديق" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "ابحث بالاسم أو البريد...", style: { width: "100%", background: "#222", border: "1px solid #444", padding: 10, borderRadius: 8, color: "white", marginTop: 15 } })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showCreateModal, onClose: () => setShowCreateModal(false), title: "إنشاء مجموعة جديدة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20, display: "grid", gap: 14 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "grid", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 700 }, children: "اسم المجموعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: createForm.name,
            onChange: (event) => setCreateForm((prev) => ({ ...prev, name: event.target.value })),
            placeholder: "اكتب اسم المجموعة",
            style: { width: "100%", borderRadius: 12, padding: 12 }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "grid", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 700 }, children: "وصف المجموعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: createForm.description,
            onChange: (event) => setCreateForm((prev) => ({ ...prev, description: event.target.value })),
            placeholder: "اكتب وصف واضح للمجموعة",
            rows: 4,
            style: { width: "100%", borderRadius: 12, padding: 12 }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setShowCreateModal(false), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: async () => {
              if (!createForm.name.trim()) return;
              try {
                setSavingGroup(true);
                const { data } = await createGroup({ name: createForm.name.trim(), description: createForm.description.trim() });
                const createdGroup = data || { id: `local-${Date.now()}`, name: createForm.name.trim(), description: createForm.description.trim(), members_count: 1 };
                setGroups((prev) => [createdGroup, ...prev]);
                setSelectedGroup(createdGroup);
                setCreateForm({ name: "", description: "" });
                setShowCreateModal(false);
              } finally {
                setSavingGroup(false);
              }
            },
            loading: savingGroup,
            disabled: !createForm.name.trim(),
            children: "إنشاء المجموعة"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showAnalytics, onClose: () => setShowAnalytics(false), title: "تحليلات المجموعة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 15, textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 24, fontWeight: "bold", color: "var(--primary)" }, children: "+12%" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "نمو الأعضاء (هذا الشهر)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 15, textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 24, fontWeight: "bold", color: "#44ff44" }, children: "850" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "عضو نشط يومياً" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "أكثر الأعضاء تفاعلاً" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: 150, background: "rgba(255,255,255,0.05)", borderRadius: 12, marginTop: 10, display: "flex", alignItems: "flex-end", gap: 10, padding: 15 }, children: [40, 70, 50, 90, 60].map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, height: `${h}%`, background: "var(--primary)", borderRadius: "4px 4px 0 0" } }, i)) })
    ] }) })
  ] });
}
export {
  Groups as default
};
