import { u as useNavigate, f as getCurrentUsername, r as reactExports, j as jsxRuntimeExports, B as Button, l as ListSkeleton, p as getChatThreads } from "../index-D6u1FUhW.js";
import { h as useQuery, M as MainLayout } from "./MainLayout-Ca2z1jDa.js";
import { C as Card } from "./Card-r3PaFA5D.js";
import { E as EmptyState } from "./EmptyState-ClJjbgqU.js";
import "./proxy-npyH2_t3.js";
function Inbox() {
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [pinnedChats, setPinnedChats] = reactExports.useState(/* @__PURE__ */ new Set());
  const [archivedChats, setArchivedChats] = reactExports.useState(/* @__PURE__ */ new Set());
  const [mutedChats, setMutedChats] = reactExports.useState(/* @__PURE__ */ new Set());
  const { data: threads = [], isLoading, refetch } = useQuery({
    queryKey: ["chat-threads", currentUser],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return data || [];
    }
  });
  const filteredThreads = reactExports.useMemo(() => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { maxWidth: 600, margin: "0 auto", padding: "20px 10px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0 }, children: "الرسائل" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActiveTab("all"), style: { background: activeTab === "all" ? "var(--primary)" : "" }, children: "الكل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActiveTab("pinned"), style: { background: activeTab === "pinned" ? "var(--primary)" : "" }, children: "📌 المثبتة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActiveTab("archived"), style: { background: activeTab === "archived" ? "var(--primary)" : "" }, children: "📦 مؤرشف" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 20 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "text",
        placeholder: "ابحث في المحادثات...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        style: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #333", padding: "12px 16px", borderRadius: 12, color: "white" }
      }
    ) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, {}) : filteredThreads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "لا توجد محادثات", description: "ابدأ دردشة جديدة مع أصدقائك الآن." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: filteredThreads.map((thread) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 50, height: 50, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 20 }, children: thread.username[0].toUpperCase() }),
            thread.presence?.is_online && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, background: "#44ff44", borderRadius: "50%", border: "2px solid #111" } })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }, children: [
                thread.username,
                mutedChats.has(thread.username) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 12 }, children: "🔇" }),
                pinnedChats.has(thread.username) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 12 }, children: "📌" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 11 }, children: new Date(thread.last_message_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: thread.last_message || "لا توجد رسائل بعد" }),
              thread.unread_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "var(--primary)", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 10, fontWeight: "bold" }, children: thread.unread_count })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => togglePin(thread.username, e), style: { background: "none", border: "none", cursor: "pointer", fontSize: 16 }, title: "تثبيت", children: pinnedChats.has(thread.username) ? "📍" : "📌" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => toggleMute(thread.username, e), style: { background: "none", border: "none", cursor: "pointer", fontSize: 16 }, title: "كتم", children: mutedChats.has(thread.username) ? "🔊" : "🔇" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => toggleArchive(thread.username, e), style: { background: "none", border: "none", cursor: "pointer", fontSize: 16 }, title: "أرشفة", children: archivedChats.has(thread.username) ? "📤" : "📦" })
          ] })
        ]
      },
      thread.username
    )) })
  ] }) });
}
export {
  Inbox as default
};
