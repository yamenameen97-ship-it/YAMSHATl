import { u as useNavigate, f as getCurrentUsername, r as reactExports, j as jsxRuntimeExports, q as getChatThreads } from "../index-BAMQT-m6.js";
import { u as useQuery, M as MainLayout } from "./MainLayout-R4-pAMZD.js";
function formatThreadTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}
function Avatar({ username }) {
  const initial = String(username || "?").trim().charAt(0).toUpperCase() || "?";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-inbox-avatar", children: initial });
}
function Inbox() {
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [pinnedChats, setPinnedChats] = reactExports.useState(/* @__PURE__ */ new Set());
  const [archivedChats, setArchivedChats] = reactExports.useState(/* @__PURE__ */ new Set());
  const [mutedChats, setMutedChats] = reactExports.useState(/* @__PURE__ */ new Set());
  const { data: threads = [], isLoading } = useQuery({
    queryKey: ["chat-threads", currentUser],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return Array.isArray(data) ? data : [];
    }
  });
  const filteredThreads = reactExports.useMemo(() => {
    return threads.filter((thread) => {
      const username = String(thread.username || "").toLowerCase();
      const matchesSearch = username.includes(searchQuery.toLowerCase());
      const isArchived = archivedChats.has(thread.username);
      const isPinned = pinnedChats.has(thread.username);
      if (activeTab === "archived") return isArchived && matchesSearch;
      if (activeTab === "pinned") return isPinned && matchesSearch;
      return !isArchived && matchesSearch;
    }).sort((a, b) => {
      const aPinned = pinnedChats.has(a.username);
      const bPinned = pinnedChats.has(b.username);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.last_message_at || b.created_at || 0) - new Date(a.last_message_at || a.created_at || 0);
    });
  }, [threads, activeTab, searchQuery, archivedChats, pinnedChats]);
  const toggleSetMembership = (setter, setValue, username, event) => {
    event.stopPropagation();
    const next = new Set(setValue);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setter(next);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-inbox-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-inbox-shell", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-inbox-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "الدردشات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "واجهة مرتبة مثل قائمة المحادثات: اسم، آخر رسالة، والوقت بدون فوضى." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-inbox-stats", children: [
          filteredThreads.length,
          " محادثة"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-inbox-toolbar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-inbox-tabs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: activeTab === "all" ? "active" : "", onClick: () => setActiveTab("all"), children: "الكل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: activeTab === "pinned" ? "active" : "", onClick: () => setActiveTab("pinned"), children: "المثبتة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: activeTab === "archived" ? "active" : "", onClick: () => setActiveTab("archived"), children: "المؤرشفة" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            placeholder: "ابحث باسم الشخص أو المحادثة",
            value: searchQuery,
            onChange: (event) => setSearchQuery(event.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-inbox-list", children: [
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-inbox-empty", children: "جارٍ تحميل المحادثات..." }) : null,
        !isLoading && !filteredThreads.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-inbox-empty", children: "لا توجد محادثات مطابقة حالياً." }) : null,
        filteredThreads.map((thread) => {
          const username = thread.username || "مستخدم";
          const lastTime = formatThreadTime(thread.last_message_at || thread.created_at);
          const isMuted = mutedChats.has(username);
          const isPinned = pinnedChats.has(username);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: `yam-thread-card ${thread.unread_count > 0 ? "unread" : ""}`,
              onClick: () => navigate(`/chat/${encodeURIComponent(username)}`),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { username }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-thread-body", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-thread-row-top", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: username }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: lastTime })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-thread-row-bottom", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: thread.last_message || "ابدأ المحادثة الآن" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-thread-meta-tools", children: [
                      isMuted ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-mini-flag", children: "🔕" }) : null,
                      isPinned ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-mini-flag", children: "📌" }) : null,
                      thread.unread_count > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-unread-pill", children: thread.unread_count }) : null
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-thread-tools", onClick: (event) => event.stopPropagation(), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: "تثبيت", onClick: (event) => toggleSetMembership(setPinnedChats, pinnedChats, username, event), children: isPinned ? "📍" : "📌" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: "كتم", onClick: (event) => toggleSetMembership(setMutedChats, mutedChats, username, event), children: isMuted ? "🔊" : "🔇" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: "أرشفة", onClick: (event) => toggleSetMembership(setArchivedChats, archivedChats, username, event), children: archivedChats.has(username) ? "📤" : "🗂️" })
                ] })
              ]
            },
            username
          );
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-inbox-page {
            padding: 18px;
            min-height: calc(100vh - 92px);
            background: radial-gradient(circle at top, rgba(139,92,246,0.08), transparent 28%), #060d19;
          }

          .yam-inbox-shell {
            max-width: 980px;
            margin: 0 auto;
            border-radius: 30px;
            background: rgba(7, 12, 24, 0.94);
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: 0 24px 60px rgba(2, 6, 23, 0.34);
            overflow: hidden;
          }

          .yam-inbox-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 22px 22px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }

          .yam-inbox-header h1 {
            margin: 0 0 6px;
            font-size: 28px;
          }

          .yam-inbox-header p {
            margin: 0;
            color: #94a3b8;
            font-size: 14px;
          }

          .yam-inbox-stats {
            min-height: 42px;
            padding: 0 16px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            background: rgba(124,58,237,0.12);
            border: 1px solid rgba(167,139,250,0.18);
            color: #ddd6fe;
            font-weight: 800;
            flex-shrink: 0;
          }

          .yam-inbox-toolbar {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 12px;
            padding: 14px 22px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }

          .yam-inbox-tabs {
            display: inline-flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .yam-inbox-tabs button {
            min-height: 42px;
            padding: 0 14px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.7);
            color: #cbd5e1;
            font-weight: 800;
          }

          .yam-inbox-tabs button.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.32), rgba(99,102,241,0.18));
            color: #fff;
            border-color: rgba(167,139,250,0.24);
          }

          .yam-inbox-toolbar input {
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.78);
            padding: 0 16px;
            color: white;
          }

          .yam-inbox-list {
            display: grid;
          }

          .yam-thread-card {
            width: 100%;
            border: none;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: transparent;
            color: white;
            padding: 16px 20px;
            display: grid;
            grid-template-columns: 56px minmax(0, 1fr) auto;
            gap: 14px;
            text-align: start;
            align-items: center;
            transition: background 0.18s ease;
          }

          .yam-thread-card:hover {
            background: rgba(255,255,255,0.03);
          }

          .yam-thread-card.unread {
            background: rgba(124,58,237,0.07);
          }

          .yam-inbox-avatar {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: white;
            font-size: 22px;
            font-weight: 900;
          }

          .yam-thread-body {
            min-width: 0;
            display: grid;
            gap: 8px;
          }

          .yam-thread-row-top,
          .yam-thread-row-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .yam-thread-row-top strong {
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-thread-row-top span {
            color: #94a3b8;
            font-size: 12px;
            flex-shrink: 0;
          }

          .yam-thread-row-bottom p {
            margin: 0;
            color: #cbd5e1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 14px;
          }

          .yam-thread-meta-tools {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          }

          .yam-unread-pill,
          .yam-mini-flag {
            min-width: 22px;
            height: 22px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            font-size: 11px;
          }

          .yam-unread-pill {
            padding: 0 7px;
            background: #8b5cf6;
            color: white;
            font-weight: 800;
          }

          .yam-mini-flag {
            background: rgba(255,255,255,0.06);
          }

          .yam-thread-tools {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .yam-thread-tools button {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.72);
            color: white;
          }

          .yam-inbox-empty {
            padding: 28px 20px;
            text-align: center;
            color: #94a3b8;
          }

          @media (max-width: 768px) {
            .yam-inbox-page {
              padding: 10px;
              min-height: calc(100vh - 118px);
            }

            .yam-inbox-header,
            .yam-inbox-toolbar {
              padding-inline: 14px;
            }

            .yam-inbox-header {
              flex-wrap: wrap;
            }

            .yam-inbox-toolbar {
              grid-template-columns: 1fr;
            }

            .yam-thread-card {
              grid-template-columns: 52px minmax(0, 1fr);
              padding: 14px;
            }

            .yam-thread-tools {
              grid-column: 2;
              justify-content: flex-start;
              margin-top: 8px;
            }
          }
        ` })
  ] }) });
}
export {
  Inbox as default
};
