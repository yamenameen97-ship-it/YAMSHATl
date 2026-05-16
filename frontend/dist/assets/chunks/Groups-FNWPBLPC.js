import {
  MainLayout
} from "./chunk-ZOZSORVL.js";
import "./chunk-AB4CHF2R.js";
import {
  createGroup,
  getGroups
} from "./chunk-P7MPFPG2.js";
import {
  EmptyState
} from "./chunk-I2PPYNN4.js";
import {
  Modal
} from "./chunk-ERP4JHH7.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Groups.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var ROLES = [
  { id: "admin", label: "\u0645\u062F\u064A\u0631", color: "#ff4444" },
  { id: "moderator", label: "\u0645\u0634\u0631\u0641", color: "#ffaa00" },
  { id: "member", label: "\u0639\u0636\u0648", color: "#44ff44" }
];
function Groups() {
  const [groups, setGroups] = (0, import_react.useState)([]);
  const [selectedGroup, setSelectedGroup] = (0, import_react.useState)(null);
  const [showInviteModal, setShowInviteModal] = (0, import_react.useState)(false);
  const [showAnalytics, setShowAnalytics] = (0, import_react.useState)(false);
  const [showCreateModal, setShowCreateModal] = (0, import_react.useState)(false);
  const [createForm, setCreateForm] = (0, import_react.useState)({ name: "", description: "" });
  const [savingGroup, setSavingGroup] = (0, import_react.useState)(false);
  const [activeTab, setActiveTab] = (0, import_react.useState)("members");
  (0, import_react.useEffect)(() => {
    loadGroups();
  }, []);
  const loadGroups = async () => {
    const { data } = await getGroups();
    setGroups(data || []);
    if (data?.length > 0) setSelectedGroup(data[0]);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", height: "calc(100vh - 70px)", maxWidth: 1200, margin: "0 auto" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { width: 300, borderLeft: "1px solid var(--line)", padding: 20, overflowY: "auto" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { margin: 0 }, children: "\u0645\u062C\u0645\u0648\u0639\u0627\u062A\u064A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { size: "small", onClick: () => setShowCreateModal(true), children: "\u2795" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 10 }, children: groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: "bold" }, children: g.name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "muted", style: { fontSize: 12 }, children: [
                g.members_count,
                " \u0639\u0636\u0648"
              ] })
            ]
          },
          g.id
        )) })
      ] }),
      selectedGroup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, padding: 30, overflowY: "auto" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { style: { margin: "0 0 8px 0" }, children: selectedGroup.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", children: selectedGroup.description })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setShowInviteModal(true), children: "\u2795 \u062F\u0639\u0648\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: () => setShowAnalytics(true), children: "\u{1F4CA} \u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 20, borderBottom: "1px solid var(--line)", marginBottom: 24 }, children: ["members", "moderation", "settings"].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
            children: tab === "members" ? "\u0627\u0644\u0623\u0639\u0636\u0627\u0621" : tab === "moderation" ? "\u0627\u0644\u0631\u0642\u0627\u0628\u0629" : "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A"
          },
          tab
        )) }),
        activeTab === "members" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 12 }, children: [
          { id: 1, name: "\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F", role: "admin" },
          { id: 2, name: "\u0633\u0627\u0631\u0629 \u062E\u0627\u0644\u062F", role: "moderator" },
          { id: 3, name: "\u064A\u0627\u0633\u064A\u0646 \u0639\u0644\u064A", role: "member" }
        ].map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 35, height: 35, borderRadius: "50%", background: "#444" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: "bold" }, children: member.name })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 15 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 10,
              background: ROLES.find((r) => r.id === member.role).color + "33",
              color: ROLES.find((r) => r.id === member.role).color
            }, children: ROLES.find((r) => r.id === member.role).label }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: { background: "none", border: "none", color: "#888", cursor: "pointer" }, children: "\u2699\uFE0F" })
          ] })
        ] }, member.id)) }),
        activeTab === "moderation" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 20 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 20 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0642\u0629 (Pending)" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { textAlign: "center", padding: "20px 0" }, children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 20 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 10, marginTop: 15 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 10, background: "rgba(255,255,255,0.05)", borderRadius: 8 }, children: "1. \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0645 \u0627\u0644\u0645\u062A\u0628\u0627\u062F\u0644 \u0628\u064A\u0646 \u0627\u0644\u0623\u0639\u0636\u0627\u0621" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 10, background: "rgba(255,255,255,0.05)", borderRadius: 8 }, children: "2. \u064A\u0645\u0646\u0639 \u0646\u0634\u0631 \u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629 \u062F\u0648\u0646 \u0625\u0630\u0646" })
            ] })
          ] })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: "\u0627\u062E\u062A\u0631 \u0645\u062C\u0645\u0648\u0639\u0629 \u0644\u0639\u0631\u0636 \u062A\u0641\u0627\u0635\u064A\u0644\u0647\u0627" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { isOpen: showInviteModal, onClose: () => setShowInviteModal(false), title: "\u062F\u0639\u0648\u0629 \u0623\u0639\u0636\u0627\u0621 \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u0634\u0627\u0631\u0643 \u0631\u0627\u0628\u0637 \u0627\u0644\u062F\u0639\u0648\u0629 \u0645\u0639 \u0623\u0635\u062F\u0642\u0627\u0626\u0643:" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, marginBottom: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            readOnly: true,
            value: `https://yamshat.com/join/${selectedGroup?.id}`,
            style: { flex: 1, background: "#222", border: "1px solid #444", padding: 10, borderRadius: 8, color: "white" }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: () => alert("\u062A\u0645 \u0627\u0644\u0646\u0633\u062E!"), children: "\u0646\u0633\u062E" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "divider", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0623\u0648 \u0627\u0628\u062D\u062B \u0639\u0646 \u0635\u062F\u064A\u0642" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F...", style: { width: "100%", background: "#222", border: "1px solid #444", padding: 10, borderRadius: 8, color: "white", marginTop: 15 } })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { isOpen: showCreateModal, onClose: () => setShowCreateModal(false), title: "\u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0645\u0648\u0639\u0629 \u062C\u062F\u064A\u062F\u0629", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 20, display: "grid", gap: 14 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "grid", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 700 }, children: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            value: createForm.name,
            onChange: (event) => setCreateForm((prev) => ({ ...prev, name: event.target.value })),
            placeholder: "\u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
            style: { width: "100%", borderRadius: 12, padding: 12 }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "grid", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 700 }, children: "\u0648\u0635\u0641 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "textarea",
          {
            value: createForm.description,
            onChange: (event) => setCreateForm((prev) => ({ ...prev, description: event.target.value })),
            placeholder: "\u0627\u0643\u062A\u0628 \u0648\u0635\u0641 \u0648\u0627\u0636\u062D \u0644\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
            rows: 4,
            style: { width: "100%", borderRadius: 12, padding: 12 }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setShowCreateModal(false), children: "\u0625\u0644\u063A\u0627\u0621" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
            children: "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { isOpen: showAnalytics, onClose: () => setShowAnalytics(false), title: "\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 15, textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 24, fontWeight: "bold", color: "var(--primary)" }, children: "+12%" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u0646\u0645\u0648 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 (\u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631)" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 15, textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 24, fontWeight: "bold", color: "#44ff44" }, children: "850" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u0639\u0636\u0648 \u0646\u0634\u0637 \u064A\u0648\u0645\u064A\u0627\u064B" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0623\u0643\u062B\u0631 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u062A\u0641\u0627\u0639\u0644\u0627\u064B" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 150, background: "rgba(255,255,255,0.05)", borderRadius: 12, marginTop: 10, display: "flex", alignItems: "flex-end", gap: 10, padding: 15 }, children: [40, 70, 50, 90, 60].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: `${h}%`, background: "var(--primary)", borderRadius: "4px 4px 0 0" } }, i)) })
    ] }) })
  ] });
}
export {
  Groups as default
};
