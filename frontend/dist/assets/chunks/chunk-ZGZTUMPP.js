import {
  MainLayout
} from "./chunk-ZOZSORVL.js";
import {
  useQuery
} from "./chunk-AB4CHF2R.js";
import {
  EmptyState
} from "./chunk-I2PPYNN4.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import {
  ListSkeleton
} from "./chunk-4ZQ5VGKF.js";
import {
  getChatThreads
} from "./chunk-HHMVNFXU.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  getCurrentUsername,
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Inbox.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function Inbox() {
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [activeTab, setActiveTab] = (0, import_react.useState)("all");
  const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
  const [pinnedChats, setPinnedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [archivedChats, setArchivedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [mutedChats, setMutedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const { data: threads = [], isLoading, refetch } = useQuery({
    queryKey: ["chat-threads", currentUser],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return data || [];
    }
  });
  const filteredThreads = (0, import_react.useMemo)(() => {
    return threads.filter((thread) => {
      const isArchived = archivedChats.has(thread.username);
      const isPinned = pinnedChats.has(thread.username);
      const matchesSearch = thread.username.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === "archived") return isArchived && matchesSearch;
      if (activeTab === "pinned") return isPinned && matchesSearch;
      return !isArchived && matchesSearch;
    }).sort((a, b) => {
      const aPinned = pinnedChats.has(a.username);
      const bPinned = pinnedChats.has(b.username);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    });
  }, [threads, activeTab, searchQuery, archivedChats, pinnedChats]);
  const togglePin = (username, e) => {
    e.stopPropagation();
    const next = new Set(pinnedChats);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setPinnedChats(next);
  };
  const toggleArchive = (username, e) => {
    e.stopPropagation();
    const next = new Set(archivedChats);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setArchivedChats(next);
  };
  const toggleMute = (username, e) => {
    e.stopPropagation();
    const next = new Set(mutedChats);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setMutedChats(next);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { maxWidth: 600, margin: "0 auto", padding: "20px 10px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { margin: 0 }, children: "\u0627\u0644\u0631\u0633\u0627\u0626\u0644" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setActiveTab("all"), style: { background: activeTab === "all" ? "var(--primary)" : "" }, children: "\u0627\u0644\u0643\u0644" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setActiveTab("pinned"), style: { background: activeTab === "pinned" ? "var(--primary)" : "" }, children: "\u{1F4CC} \u0627\u0644\u0645\u062B\u0628\u062A\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setActiveTab("archived"), style: { background: activeTab === "archived" ? "var(--primary)" : "" }, children: "\u{1F4E6} \u0645\u0624\u0631\u0634\u0641" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginBottom: 20 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "text",
        placeholder: "\u0627\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        style: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #333", padding: "12px 16px", borderRadius: 12, color: "white" }
      }
    ) }),
    isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : filteredThreads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u062D\u0627\u062F\u062B\u0627\u062A", description: "\u0627\u0628\u062F\u0623 \u062F\u0631\u062F\u0634\u0629 \u062C\u062F\u064A\u062F\u0629 \u0645\u0639 \u0623\u0635\u062F\u0642\u0627\u0626\u0643 \u0627\u0644\u0622\u0646." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 10 }, children: filteredThreads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      Card,
      {
        onClick: () => navigate(`/chat/${thread.username}`),
        style: {
          padding: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 16,
          border: pinnedChats.has(thread.username) ? "1px solid var(--primary)" : "1px solid transparent",
          background: thread.unread_count > 0 ? "rgba(139, 92, 246, 0.05)" : ""
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 50, height: 50, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 20 }, children: thread.username[0].toUpperCase() }),
            thread.presence?.is_online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, background: "#44ff44", borderRadius: "50%", border: "2px solid #111" } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }, children: [
                thread.username,
                mutedChats.has(thread.username) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12 }, children: "\u{1F507}" }),
                pinnedChats.has(thread.username) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 12 }, children: "\u{1F4CC}" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { fontSize: 11 }, children: new Date(thread.last_message_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: thread.last_message || "\u0644\u0627 \u062A\u0648\u062C\u062F \u0631\u0633\u0627\u0626\u0644 \u0628\u0639\u062F" }),
              thread.unread_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { background: "var(--primary)", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 10, fontWeight: "bold" }, children: thread.unread_count })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => togglePin(thread.username, e), style: { background: "none", border: "none", cursor: "pointer", fontSize: 16 }, title: "\u062A\u062B\u0628\u064A\u062A", children: pinnedChats.has(thread.username) ? "\u{1F4CD}" : "\u{1F4CC}" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => toggleMute(thread.username, e), style: { background: "none", border: "none", cursor: "pointer", fontSize: 16 }, title: "\u0643\u062A\u0645", children: mutedChats.has(thread.username) ? "\u{1F50A}" : "\u{1F507}" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: (e) => toggleArchive(thread.username, e), style: { background: "none", border: "none", cursor: "pointer", fontSize: 16 }, title: "\u0623\u0631\u0634\u0641\u0629", children: archivedChats.has(thread.username) ? "\u{1F4E4}" : "\u{1F4E6}" })
          ] })
        ]
      },
      thread.username
    )) })
  ] }) });
}

export {
  Inbox
};
