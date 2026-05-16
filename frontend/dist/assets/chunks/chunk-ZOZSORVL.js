import {
  selectUnreadNotificationsCount,
  useNotificationStore,
  useQuery
} from "./chunk-AB4CHF2R.js";
import {
  Link,
  NavLink,
  axios_default,
  getCurrentUsername,
  getStoredUserSnapshot,
  selectUnreadTotal,
  useAppStore,
  useChatStore,
  useLocation
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/api/users.js
init_define_import_meta_env();
var getUsers = () => axios_default.get("/users");
var getProfileBundle = (username) => axios_default.get(`/users/profile/${encodeURIComponent(username)}`, { cache: false, forceRefresh: true });
var followUser = (username) => axios_default.post("/users/follow", { following: username });
var updateMyProfile = (payload) => axios_default.patch("/users/me", payload);

// src/api/live.js
init_define_import_meta_env();
var getLiveRooms = () => axios_default.get("/live_rooms", { cache: false, forceRefresh: true });
var getLiveRoom = (roomId) => axios_default.get(`/live_room/${roomId}`, { cache: false, forceRefresh: true });
var createLiveRoom = (data) => axios_default.post("/create_live", data);
var getLiveComments = (roomId) => axios_default.get(`/live_comments/${roomId}`, { cache: false, forceRefresh: true });
var endLiveRoom = (roomId) => axios_default.post(`/end_live/${roomId}`);
var sendLiveGift = ({ room_id, ...payload }) => axios_default.post(`/live/${room_id}/gift`, payload);
var updateLiveRecording = ({ room_id, action }) => axios_default.post(`/live/${room_id}/recording/${action}`);

// src/components/yamshat/YamshatDesign.js
init_define_import_meta_env();
function initialsFromName(value = "") {
  const clean = String(value || "").trim();
  if (!clean) return "Y";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
function avatarGradient(seed = "") {
  const palette = [
    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "linear-gradient(135deg, #ec4899, #8b5cf6)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #22c55e, #14b8a6)",
    "linear-gradient(135deg, #f97316, #ef4444)",
    "linear-gradient(135deg, #f59e0b, #eab308)"
  ];
  const text = String(seed || "yamshat");
  let total = 0;
  for (const char of text) total += char.charCodeAt(0);
  return palette[total % palette.length];
}
function formatCompactNumber(value = 0) {
  const number = Number(value || 0);
  if (number >= 1e6) return `${(number / 1e6).toFixed(number >= 1e7 ? 0 : 1)}M`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(number >= 1e4 ? 0 : 1)}K`;
  return `${number}`;
}
function formatTimeAgo(value) {
  if (!value) return "\u0627\u0644\u0622\u0646";
  try {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 6e4));
    if (diffMin < 60) return `\u0645\u0646\u0630 ${diffMin} \u062F\u0642\u064A\u0642\u0629`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `\u0645\u0646\u0630 ${diffHours} \u0633\u0627\u0639\u0629`;
    const diffDays = Math.floor(diffHours / 24);
    return `\u0645\u0646\u0630 ${diffDays} \u064A\u0648\u0645`;
  } catch {
    return "\u0627\u0644\u0622\u0646";
  }
}
function formatLastSeen(value, isOnline = false) {
  if (isOnline) return "\u0645\u062A\u0635\u0644 \u0627\u0644\u0622\u0646";
  if (!value) return "\u0622\u062E\u0631 \u0638\u0647\u0648\u0631 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D";
  try {
    const date = new Date(value);
    return `\u0622\u062E\u0631 \u0638\u0647\u0648\u0631 ${date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "\u0622\u062E\u0631 \u0638\u0647\u0648\u0631 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D";
  }
}
function statusTicks(status = "sent") {
  if (status === "seen") return "\u2713\u2713";
  if (status === "delivered") return "\u2713\u2713";
  if (status === "sending") return "\u25CC";
  return "\u2713";
}
function statusColor(status = "sent") {
  if (status === "seen") return "#60a5fa";
  if (status === "delivered") return "rgba(255,255,255,0.82)";
  if (status === "sending") return "rgba(255,255,255,0.5)";
  return "rgba(255,255,255,0.68)";
}

// src/api/notifications.js
init_define_import_meta_env();
var getNotifications = (limit = 50) => axios_default.get("/notifications", {
  params: { limit },
  cache: true,
  cacheTtlMs: 2e4
});

// src/components/layout/MainLayout.jsx
init_define_import_meta_env();
var import_react2 = __toESM(require_react(), 1);

// src/components/layout/Sidebar.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var NAV_ITEMS = [
  { to: "/", label: "\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", icon: "\u2302" },
  { to: "/search", label: "\u0627\u0643\u062A\u0634\u0641", icon: "\u2315" },
  { to: "/users", label: "\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0648\u0646", icon: "\u25CC" },
  { to: "/notifications", label: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", icon: "\u25D4", badgeType: "notifications" },
  { to: "/inbox", label: "\u0627\u0644\u0631\u0633\u0627\u0626\u0644", icon: "\u2709", badgeType: "messages" },
  { to: "/profile", label: "\u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629", icon: "\u25A3" }
];
function Avatar({ name, src, size = 42 }) {
  return src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "img",
    {
      src,
      alt: name,
      style: { width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }
    }
  ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 800,
        background: avatarGradient(name),
        flexShrink: 0
      },
      children: initialsFromName(name).slice(0, 1)
    }
  );
}
function Sidebar() {
  const notificationCount = 0;
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const language = useAppStore((state) => state.language);
  const { data: usersData = [] } = useQuery({
    queryKey: ["sidebar-users"],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 6e4
  });
  const { data: liveData = [] } = useQuery({
    queryKey: ["sidebar-live-rooms"],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 2e4,
    refetchInterval: 25e3
  });
  const liveUsers = Array.isArray(liveData) ? liveData.slice(0, 5) : [];
  const suggestedUsers = Array.isArray(usersData) ? usersData.slice(0, 3) : [];
  const suggestedGroups = [
    { name: "Gamers Hub", members: "12.5K \u0639\u0636\u0648" },
    { name: "Tech Talk", members: "5.2K \u0639\u0636\u0648" },
    { name: "Music Vibes", members: "8.2K \u0639\u0636\u0648" }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { className: "yamshat-side-rail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yamshat-side-section yam-brand-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-brand-mark", children: "\u{1F732}" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-brand-title", children: "YAMSHAT PRO" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "yam-brand-copy", children: language === "en" ? "Upgrade for an ad-free gaming social experience." : "\u062A\u0631\u0642\u064A\u0629 \u0644\u062D\u0633\u0627\u0628\u0643 \u0644\u062A\u062C\u0631\u0628\u0629 \u064A\u0627\u0645\u0634\u0627\u062A \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643 \u0628\u0645\u0645\u064A\u0632\u0627\u062A \u062D\u0635\u0631\u064A\u0629 \u0648\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u062E\u0627\u0635\u0629 \u0648\u0627\u0644\u0645\u0632\u064A\u062F." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-primary-btn", children: "\u062A\u0631\u0642\u064A\u0629 \u0627\u0644\u0622\u0646" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { className: "yamshat-side-section yam-side-nav", children: NAV_ITEMS.map((item) => {
      const badge = item.badgeType === "messages" ? unreadInboxCount : item.badgeType === "notifications" ? notificationCount : 0;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NavLink, { to: item.to, className: ({ isActive }) => `yam-side-link ${isActive ? "active" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "yam-side-icon", children: item.icon }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }),
        badge > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "yam-side-badge", children: badge }) : null
      ] }, item.to);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "yamshat-side-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-section-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0627\u0644\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u062A\u0627\u0628\u0639\u0647\u0627" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-stack-list", children: liveUsers.length ? liveUsers.map((room) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: room.host || room.username || "Live", src: room.avatar }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: room.host || room.username || "PlayerOne" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: room.title || "Gaming" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-metric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dot" }),
          formatCompactNumber(room.viewer_count || 0)
        ] })
      ] }, room.id)) : ["PlayerOne", "Ahmed_King", "ShadowGirl"].map((name, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: ["Just Chatting", "VALORANT", "Fortnite"][index] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-metric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dot" }),
          ["1.2K", "980", "756"][index]
        ] })
      ] }, name)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "yamshat-side-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-section-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-stack-list", children: suggestedUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-row compact", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: user.username || "User", src: user.avatar, size: 40 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: user.username }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: user.profile?.activity_tagline || user.email || "Gaming Creator" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-follow-btn", children: "\u0645\u062A\u0627\u0628\u0639\u0629" })
      ] }, user.username || user.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "yamshat-side-section", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-section-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647\u0627" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-stack-list", children: suggestedGroups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-row compact", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-group-badge", children: "\u{1F3AE}" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: group.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: group.members })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-join-btn", children: "\u0627\u0646\u0636\u0645\u0627\u0645" })
      ] }, group.name)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .yamshat-side-rail {
          width: 330px;
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 22px 18px 32px;
          background: rgba(5, 10, 22, 0.94);
          border-inline-end: 1px solid rgba(148, 163, 184, 0.08);
          display: grid;
          gap: 16px;
          backdrop-filter: blur(16px);
        }
        .yamshat-side-rail::-webkit-scrollbar { width: 6px; }
        .yamshat-side-rail::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
        .yamshat-side-section {
          border-radius: 24px;
          background: rgba(12, 18, 34, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 20px 40px rgba(2,6,23,0.24);
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .yam-brand-card {
          background: radial-gradient(circle at top, rgba(139,92,246,0.28), transparent 65%), linear-gradient(180deg, rgba(20, 13, 48, 0.98), rgba(12,18,34,0.96));
          grid-template-columns: 72px 1fr;
          align-items: start;
        }
        .yam-brand-mark {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 28px;
          background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.18));
          color: #d8b4fe;
          border: 1px solid rgba(167,139,250,0.24);
        }
        .yam-brand-title { font-size: 20px; font-weight: 900; letter-spacing: 0.04em; }
        .yam-brand-copy { margin: 6px 0 14px; color: #94a3b8; font-size: 13px; line-height: 1.8; }
        .yam-primary-btn, .yam-follow-btn, .yam-join-btn {
          border: none;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 16px 30px rgba(124,58,237,0.24);
        }
        .yam-follow-btn, .yam-join-btn {
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          box-shadow: none;
        }
        .yam-side-nav { padding: 10px; gap: 8px; }
        .yam-side-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          color: #dbe4ff;
          background: transparent;
          transition: 0.2s ease;
          font-weight: 700;
        }
        .yam-side-link.active,
        .yam-side-link:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.14));
          color: white;
        }
        .yam-side-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          font-size: 16px;
        }
        .yam-side-badge {
          margin-inline-start: auto;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #7c3aed;
          color: white;
          font-size: 12px;
          font-weight: 800;
        }
        .yam-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .yam-section-head h3 {
          margin: 0;
          font-size: 17px;
        }
        .yam-section-head span {
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 700;
        }
        .yam-stack-list { display: grid; gap: 12px; }
        .yam-entity-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .yam-entity-row.compact { gap: 10px; }
        .yam-entity-copy { min-width: 0; display: grid; gap: 2px; }
        .yam-entity-copy strong {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 15px;
        }
        .yam-entity-copy small {
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yam-live-metric {
          margin-inline-start: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #fda4af;
          font-size: 13px;
          font-weight: 700;
        }
        .yam-live-metric .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,0.14);
        }
        .yam-group-badge {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(99,102,241,0.26), rgba(139,92,246,0.18));
        }
        @media (max-width: 1180px) {
          .yamshat-side-rail { width: 290px; }
        }
        @media (max-width: 1024px) {
          .yamshat-side-rail { display: none; }
        }
      ` })
  ] });
}

// src/components/layout/Topbar.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var MAIN_TABS = [
  { to: "/", label: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629" },
  { to: "/live", label: "\u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631" },
  { to: "/groups", label: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A" },
  { to: "/reels", label: "\u0627\u0644\u0645\u0642\u0627\u0637\u0639" },
  { to: "/stories", label: "\u0627\u0644\u0642\u0635\u0635" }
];
function Avatar2({ username, avatar }) {
  return avatar ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: avatar, alt: username, style: { width: 42, height: 42, borderRadius: "50%", objectFit: "cover" } }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient(username) }, children: initialsFromName(username).slice(0, 1) });
}
function Topbar() {
  const location = useLocation();
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const isOnline = useAppStore((state) => state.isOnline);
  const currentUsername = getCurrentUsername();
  const session = getStoredUserSnapshot();
  const { data: notifications = [] } = useQuery({
    queryKey: ["topbar-notifications-count"],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15e3,
    refetchInterval: 2e4
  });
  const unreadNotificationCount = (0, import_react.useMemo)(
    () => Array.isArray(notifications) ? notifications.filter((item) => !item.is_read).length : 0,
    [notifications]
  );
  const pageTitle = (0, import_react.useMemo)(() => {
    if (location.pathname.startsWith("/live")) return "\u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631";
    if (location.pathname.startsWith("/inbox") || location.pathname.startsWith("/chat")) return "\u0627\u0644\u062F\u0631\u062F\u0634\u0627\u062A";
    if (location.pathname.startsWith("/notifications")) return "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A";
    if (location.pathname.startsWith("/groups")) return "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A";
    return "YAMSHAT";
  }, [location.pathname]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "yam-topbar-shell", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-topbar-left", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Link, { to: "/", className: "yam-logo-lockup", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-logo-mark", children: "\u{1F732}" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-logo-title", children: "YAMSHAT" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-logo-subtitle", children: pageTitle })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { className: "yam-main-tabs", children: MAIN_TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(NavLink, { to: tab.to, className: ({ isActive }) => `yam-main-tab ${isActive ? "active" : ""}`, children: tab.label }, tab.to)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-topbar-center", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "yam-search-box", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u2315" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "search", placeholder: "\u0627\u0628\u062D\u062B \u0641\u064A \u064A\u0627\u0645\u0634\u0627\u062A", "aria-label": "\u0627\u0628\u062D\u062B \u0641\u064A \u064A\u0627\u0645\u0634\u0627\u062A" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-topbar-right", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "yam-icon-btn", onClick: toggleTheme, title: "\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0646\u0645\u0637", children: theme === "dark" ? "\u263E" : "\u2600" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Link, { to: "/notifications", className: "yam-icon-btn with-badge", title: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", children: [
        "\u{1F514}",
        unreadNotificationCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "yam-count-badge", children: unreadNotificationCount }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Link, { to: "/inbox", className: "yam-icon-btn with-badge", title: "\u0627\u0644\u0631\u0633\u0627\u0626\u0644", children: [
        "\u{1F4AC}",
        unreadInboxCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "yam-count-badge", children: unreadInboxCount }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-presence-pill", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `presence-dot ${isOnline ? "online" : "offline"}` }),
        isOnline ? "\u0645\u062A\u0635\u0644" : "\u063A\u064A\u0631 \u0645\u062A\u0635\u0644"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Link, { to: "/profile", className: "yam-profile-pill", title: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar2, { username: currentUsername || session?.username || "Y", avatar: session?.avatar || session?.profile?.avatar }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: `
        .yam-topbar-shell {
          position: sticky;
          top: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: auto minmax(280px, 1fr) auto;
          align-items: center;
          gap: 18px;
          padding: 14px 22px;
          background: rgba(4, 8, 18, 0.88);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
        }
        .yam-topbar-left, .yam-topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .yam-logo-lockup {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: max-content;
        }
        .yam-logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.36), rgba(99,102,241,0.2));
          color: #d8b4fe;
          font-size: 22px;
          border: 1px solid rgba(167,139,250,0.22);
        }
        .yam-logo-title { font-weight: 900; letter-spacing: 0.08em; }
        .yam-logo-subtitle { color: #64748b; font-size: 12px; }
        .yam-main-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .yam-main-tab {
          padding: 10px 14px;
          border-radius: 14px;
          color: #94a3b8;
          font-weight: 700;
          transition: 0.2s ease;
        }
        .yam-main-tab.active,
        .yam-main-tab:hover {
          color: white;
          background: rgba(124,58,237,0.18);
        }
        .yam-topbar-center { display: flex; justify-content: center; }
        .yam-search-box {
          width: min(620px, 100%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 18px;
          background: rgba(15,23,42,0.76);
          border: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
        }
        .yam-search-box input {
          width: 100%;
          border: none;
          outline: none;
          color: white;
          background: transparent;
        }
        .yam-icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(15,23,42,0.72);
          color: white;
          display: grid;
          place-items: center;
          font-size: 17px;
          position: relative;
        }
        .yam-count-badge {
          position: absolute;
          top: -4px;
          inset-inline-end: -4px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid rgba(4,8,18,0.92);
        }
        .yam-presence-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 700;
        }
        .presence-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
        }
        .presence-dot.online { background: #22c55e; box-shadow: 0 0 0 5px rgba(34,197,94,0.12); }
        .presence-dot.offline { background: #f97316; }
        .yam-profile-pill { display: flex; align-items: center; }
        @media (max-width: 1180px) {
          .yam-topbar-shell {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .yam-topbar-left,
          .yam-topbar-right { justify-content: space-between; flex-wrap: wrap; }
          .yam-topbar-center { order: 3; }
        }
        @media (max-width: 768px) {
          .yam-main-tabs { display: none; }
          .yam-presence-pill { display: none; }
          .yam-topbar-shell { padding: 14px; }
        }
      ` })
  ] });
}

// src/components/layout/MobileDock.jsx
init_define_import_meta_env();

// src/utils/i18n.js
init_define_import_meta_env();
var UI_TEXT = {
  ar: {
    brandSubtitle: "\u0648\u0627\u062C\u0647\u0629 \u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0629 \u0645\u0646\u0638\u0645\u0629 \u0645\u0639 \u0634\u0631\u064A\u0637 \u0639\u0644\u0648\u064A \u0648\u0633\u0641\u0644\u064A \u0645\u062A\u0646\u0627\u0633\u0642 \u0648\u0631\u0628\u0637 \u062D\u064A \u0628\u0627\u0644\u062E\u062F\u0645\u0627\u062A.",
    routeMeta: {
      "/": { title: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", note: "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0641\u0642\u0637 \u0645\u0639 \u0645\u0633\u0627\u062D\u0629 \u0623\u0648\u0633\u0639 \u0644\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u062A\u0646\u0642\u0644 \u0623\u0648\u0636\u062D." },
      "/dashboard": { title: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", note: "\u0627\u0644\u0644\u063A\u0629\u060C \u0627\u0644\u0633\u0645\u0627\u062A\u060C \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A\u060C \u0648\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062E\u062F\u0645\u0627\u062A." },
      "/users": { title: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646", note: "\u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u0627\u0628\u062F\u0623 \u062F\u0631\u062F\u0634\u0629 \u0623\u0648 \u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0628\u0627\u0634\u0631\u0629." },
      "/profile": { title: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A", note: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628\u060C \u0627\u0644\u0644\u063A\u0629\u060C \u0648\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0634\u062E\u0635\u064A\u0629." },
      "/inbox": { title: "\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A", note: "\u0635\u0646\u062F\u0648\u0642 \u0648\u0627\u0631\u062F \u0645\u0646\u0638\u0645 \u0644\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A \u0627\u0644\u062E\u0627\u0635\u0629." },
      "/stories": { title: "\u0627\u0644\u0642\u0635\u0635", note: "\u0633\u062A\u0648\u0631\u064A \u0645\u0646\u0641\u0635\u0644 \u0633\u0631\u064A\u0639 \u0648\u062E\u0641\u064A\u0641." },
      "/reels": { title: "\u0627\u0644\u0631\u064A\u0644\u0632", note: "\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0642\u0635\u064A\u0631\u0629 \u0641\u064A \u0635\u0641\u062D\u0629 \u0645\u0633\u062A\u0642\u0644\u0629." },
      "/groups": { title: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A", note: "\u0627\u0644\u0645\u062C\u062A\u0645\u0639\u0627\u062A \u0648\u0627\u0644\u0646\u0642\u0627\u0634\u0627\u062A \u0641\u064A \u0634\u0627\u0634\u0629 \u0645\u0633\u062A\u0642\u0644\u0629." },
      "/live": { title: "\u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631", note: "\u0627\u0644\u0628\u062B \u0648\u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0648\u063A\u0631\u0641 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629." },
      "/notifications": { title: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", note: "\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0645\u0631\u062A\u0628\u0629 \u062D\u0633\u0628 \u0627\u0644\u0646\u0648\u0639 \u0648\u0627\u0644\u0632\u0645\u0646." }
    },
    topbarFallback: { title: "YAMSHAT", note: "\u0645\u0646\u0635\u0629 \u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0629 \u0639\u0631\u0628\u064A\u0629 \u0628\u0648\u0627\u062C\u0647\u0629 \u0623\u0643\u062B\u0631 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629." },
    nav: {
      home: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
      reels: "\u0627\u0644\u0631\u064A\u0644\u0632",
      live: "\u0645\u0628\u0627\u0634\u0631",
      inbox: "\u0627\u0644\u062F\u0631\u062F\u0634\u0629",
      notifications: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
      users: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646",
      groups: "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A",
      stories: "\u0627\u0644\u0642\u0635\u0635",
      profile: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A",
      dashboard: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
      publish: "\u0646\u0634\u0631"
    },
    navMeta: {
      home: "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A",
      reels: "\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0642\u0635\u064A\u0631\u0629",
      live: "\u063A\u0631\u0641 \u0645\u0628\u0627\u0634\u0631\u0629",
      inbox: "\u0627\u0644\u0631\u0633\u0627\u0626\u0644",
      notifications: "\u062A\u0646\u0628\u064A\u0647\u0627\u062A",
      users: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u062A\u0648\u0627\u0635\u0644",
      groups: "\u0645\u062C\u062A\u0645\u0639\u0627\u062A",
      stories: "\u0644\u062D\u0638\u0627\u062A \u0633\u0631\u064A\u0639\u0629",
      profile: "\u062D\u0633\u0627\u0628\u0643",
      dashboard: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A"
    },
    dashboard: {
      title: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A + \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A + \u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064A\u0639\u0629",
      description: "\u0645\u0631\u0643\u0632 \u0645\u0648\u062D\u062F \u0644\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0648\u062A\u062E\u0635\u064A\u0635 \u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0641\u064A.",
      languageLabel: "\u0644\u063A\u0629 \u0627\u0644\u0648\u0627\u062C\u0647\u0629",
      languageHint: "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0625\u0644\u0649 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0648\u064A\u0628 \u0648\u062D\u0641\u0638\u0647\u0627 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.",
      translationLabel: "\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0631\u0633\u0627\u0626\u0644",
      translationHint: "\u062A\u0641\u0639\u064A\u0644 \u062A\u0631\u062C\u0645\u0629 \u0633\u0631\u064A\u0639\u0629 \u062F\u0627\u062E\u0644 \u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0644\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0635\u064A\u0629.",
      save: "\u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      saving: "\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0641\u0638...",
      languageSaved: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0628\u0646\u062C\u0627\u062D."
    },
    chat: {
      audioCall: "\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062A\u064A\u0629",
      videoCall: "\u0645\u0643\u0627\u0644\u0645\u0629 \u0645\u0631\u0626\u064A\u0629",
      block: "\u062D\u0638\u0631",
      unblock: "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0638\u0631",
      translate: "\u062A\u0631\u062C\u0645\u0629",
      translatedToEnglish: "\u0645\u062A\u0631\u062C\u0645\u0629 \u0625\u0644\u0649 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629",
      translatedToArabic: "\u0645\u062A\u0631\u062C\u0645\u0629 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      incomingAudio: "\u0645\u0643\u0627\u0644\u0645\u0629 \u0635\u0648\u062A\u064A\u0629 \u0648\u0627\u0631\u062F\u0629",
      incomingVideo: "\u0645\u0643\u0627\u0644\u0645\u0629 \u0645\u0631\u0626\u064A\u0629 \u0648\u0627\u0631\u062F\u0629",
      accept: "\u0631\u062F",
      decline: "\u0631\u0641\u0636",
      hangup: "\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629",
      preparingCall: "\u062C\u0627\u0631\u064D \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629...",
      blockedByMe: "\u062A\u0645 \u062D\u0638\u0631 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645. \u064A\u0645\u0643\u0646\u0643 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0638\u0631 \u0644\u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A.",
      blockedMe: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0642\u0627\u0645 \u0628\u062D\u0638\u0631\u0643. \u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A.",
      translatorOff: "\u0641\u0639\u0651\u0644 \u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0645\u0646 \u0635\u0641\u062D\u0629 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0623\u0648\u0644\u0627\u064B.",
      callFallback: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062C\u0644\u0633\u0629 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0644\u0643\u0646 \u062E\u062F\u0645\u0629 \u0627\u0644\u0635\u0648\u062A/\u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u063A\u064A\u0631 \u0645\u0641\u0639\u0644\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645."
    }
  },
  en: {
    brandSubtitle: "Organized social interface with polished top and bottom navigation.",
    routeMeta: {
      "/": { title: "Home", note: "Posts only with wider content space and cleaner navigation." },
      "/dashboard": { title: "Menu & Settings", note: "Language, theme, readiness checks, and service links." },
      "/users": { title: "Users", note: "Discover people and start chats or follows quickly." },
      "/profile": { title: "Profile", note: "Account settings, language, and personal posts." },
      "/inbox": { title: "Inbox", note: "A cleaner private messaging hub." },
      "/stories": { title: "Stories", note: "A standalone fast stories page." },
      "/reels": { title: "Reels", note: "Short-form videos in a dedicated page." },
      "/groups": { title: "Groups", note: "Communities and discussions in their own screen." },
      "/live": { title: "Live", note: "Live rooms, audience activity, and streaming tools." },
      "/notifications": { title: "Notifications", note: "Alerts organized by type and time." }
    },
    topbarFallback: { title: "YAMSHAT", note: "A more professional social experience." },
    nav: {
      home: "Home",
      reels: "Reels",
      live: "Live",
      inbox: "Chat",
      notifications: "Alerts",
      users: "Users",
      groups: "Groups",
      stories: "Stories",
      profile: "Profile",
      dashboard: "Menu",
      publish: "Post"
    },
    navMeta: {
      home: "Posts",
      reels: "Short videos",
      live: "Live rooms",
      inbox: "Messages",
      notifications: "Updates",
      users: "People",
      groups: "Communities",
      stories: "Moments",
      profile: "Your account",
      dashboard: "Settings"
    },
    dashboard: {
      title: "Settings + checks + quick links",
      description: "A unified settings center with language control and cleaner navigation.",
      languageLabel: "Interface language",
      languageHint: "English is now available in web settings and saved to the database.",
      translationLabel: "Message translation",
      translationHint: "Enable quick in-chat translation for text messages.",
      save: "Save settings",
      saving: "Saving...",
      languageSaved: "Language and preferences saved successfully."
    },
    chat: {
      audioCall: "Audio call",
      videoCall: "Video call",
      block: "Block",
      unblock: "Unblock",
      translate: "Translate",
      translatedToEnglish: "Translated to English",
      translatedToArabic: "Translated to Arabic",
      incomingAudio: "Incoming audio call",
      incomingVideo: "Incoming video call",
      accept: "Answer",
      decline: "Decline",
      hangup: "End call",
      preparingCall: "Preparing call...",
      blockedByMe: "You blocked this user. Unblock to continue chat and calls.",
      blockedMe: "This user blocked you. Messaging and calls are disabled.",
      translatorOff: "Enable message translation first from settings.",
      callFallback: "The call session was created but realtime media is not enabled on the server."
    }
  }
};
function getUiText(language = "ar") {
  return UI_TEXT[language] || UI_TEXT.ar;
}

// src/utils/navigation.js
init_define_import_meta_env();
var SCROLL_CACHE_KEY = "yamshat-scroll-cache-v1";
var prefetchedRoutes = /* @__PURE__ */ new Set();
var routePrefetchers = {
  "/": () => import("./Feed-DPX3EJJB.js"),
  "/dashboard": () => import("./Dashboard-FS6N6W3M.js"),
  "/stories": () => import("./Stories-AH23EFRE.js"),
  "/reels": () => import("./Reels-EUDC3EAD.js"),
  "/groups": () => import("./Groups-FNWPBLPC.js"),
  "/live": () => import("./Live-3GMZ7KYD.js"),
  "/inbox": () => import("./Inbox-TWACEF3K.js"),
  "/users": () => import("./Users-Z57PWDCW.js"),
  "/profile": () => import("./Profile-7J54KWQV.js"),
  "/notifications": () => import("./Notifications-JGBWH4VJ.js"),
  "/search": () => import("./Search-YDRZ6KN3.js"),
  "/settings": () => import("./Settings-XNOTV627.js"),
  "/chat": () => import("./Chat-HTCZ5UAK.js")
};
function normalizePath(pathname = "/") {
  if (!pathname) return "/";
  if (pathname.startsWith("/profile/")) return "/profile";
  if (pathname.startsWith("/chat/")) return "/chat";
  return pathname;
}
function readScrollCache() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SCROLL_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function writeScrollCache(cache) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SCROLL_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
}
function saveScrollPosition(pathname, position = 0) {
  if (typeof window === "undefined") return;
  const key = normalizePath(pathname);
  const cache = readScrollCache();
  cache[key] = Math.max(0, Number(position || 0));
  writeScrollCache(cache);
}
function getScrollPosition(pathname) {
  const key = normalizePath(pathname);
  const cache = readScrollCache();
  return Math.max(0, Number(cache[key] || 0));
}
async function prefetchRoute(pathname) {
  const key = normalizePath(pathname);
  if (prefetchedRoutes.has(key)) return;
  const prefetcher = routePrefetchers[key];
  if (!prefetcher) return;
  prefetchedRoutes.add(key);
  try {
    await prefetcher();
  } catch {
    prefetchedRoutes.delete(key);
  }
}
function prefetchCriticalRoutes(currentPathname = "/") {
  const current = normalizePath(currentPathname);
  const neighbors = {
    "/": ["/reels", "/stories", "/inbox"],
    "/reels": ["/", "/stories", "/live"],
    "/stories": ["/", "/reels", "/profile"],
    "/inbox": ["/chat", "/notifications", "/"],
    "/chat": ["/inbox", "/profile"],
    "/profile": ["/", "/stories"]
  };
  (neighbors[current] || ["/reels", "/stories"]).forEach((route) => {
    const idle = typeof window !== "undefined" && "requestIdleCallback" in window ? window.requestIdleCallback(() => prefetchRoute(route), { timeout: 1200 }) : window.setTimeout(() => prefetchRoute(route), 180);
    return idle;
  });
}
function getPrefetchHandlers(pathname) {
  return {
    onMouseEnter: () => prefetchRoute(pathname),
    onFocus: () => prefetchRoute(pathname),
    onTouchStart: () => prefetchRoute(pathname)
  };
}

// src/components/layout/MobileDock.jsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function MobileDock() {
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const ui = getUiText(language);
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const unreadNotifications = useNotificationStore(selectUnreadNotificationsCount);
  const dockLinks = [
    { to: "/", label: ui.nav.home, icon: "\u2302", badge: 0 },
    { to: "/reels", label: ui.nav.reels, icon: "\u25A3", badge: 0 },
    { to: "/live", label: ui.nav.live, icon: "\u25C9", badge: isOnline ? "live" : 0 },
    { to: "/inbox", label: ui.nav.inbox, icon: "\u2709", badge: unreadInboxCount },
    { to: "/dashboard", label: ui.nav.dashboard, icon: "\u2630", badge: unreadNotifications }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("nav", { className: "mobile-dock mobile-dock-professional", "aria-label": language === "en" ? "Quick navigation" : "\u0627\u0644\u062A\u0646\u0642\u0644 \u0627\u0644\u0633\u0631\u064A\u0639", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mobile-dock-inner mobile-dock-grid-5 mobile-dock-balanced-grid", children: [
      dockLinks.slice(0, 2).map((link) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        NavLink,
        {
          to: link.to,
          className: ({ isActive }) => `mobile-dock-link ${isActive ? "active" : ""}`,
          ...getPrefetchHandlers(link.to),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mobile-dock-icon", children: link.icon }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: link.label }),
            typeof link.badge === "number" && link.badge > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { className: "topbar-badge", children: link.badge }) : null
          ]
        },
        link.to
      )),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Link, { to: { pathname: "/", search: "?compose=1", hash: "#composer" }, className: "mobile-dock-link mobile-dock-center", "aria-label": ui.nav.publish, ...getPrefetchHandlers("/"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mobile-dock-icon", children: "\uFF0B" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: ui.nav.publish })
      ] }),
      dockLinks.slice(2).map((link) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        NavLink,
        {
          to: link.to,
          className: ({ isActive }) => `mobile-dock-link ${isActive ? "active" : ""}`,
          ...getPrefetchHandlers(link.to),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mobile-dock-icon", children: link.icon }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: link.label }),
            link.badge === "live" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mobile-live-dot", "aria-hidden": "true" }) : null,
            typeof link.badge === "number" && link.badge > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { className: "topbar-badge", children: link.badge }) : null
          ]
        },
        link.to
      ))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: `
        .mobile-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 5px rgba(34,197,94,0.18);
          animation: mobile-live-pulse 1.6s infinite;
        }
        @keyframes mobile-live-pulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.75; }
        }
      ` })
  ] });
}

// src/utils/runtime.js
init_define_import_meta_env();
function isNativeShell() {
  try {
    return localStorage.getItem("yamshatNativeShell") === "1";
  } catch {
    return false;
  }
}

// src/components/layout/MainLayout.jsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
function MainLayout({ children }) {
  const nativeShell = isNativeShell();
  const location = useLocation();
  const mainRef = (0, import_react2.useRef)(null);
  const frameRef = (0, import_react2.useRef)(0);
  const [isTransitioning, setIsTransitioning] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    const container = mainRef.current;
    if (!container) return void 0;
    const restore = () => {
      const cachedPosition = getScrollPosition(location.pathname);
      container.scrollTo({ top: cachedPosition, behavior: "auto" });
      setIsTransitioning(true);
      window.clearTimeout(container.__yamshatTransitionTimer__);
      container.__yamshatTransitionTimer__ = window.setTimeout(() => setIsTransitioning(false), 260);
    };
    const rafId = window.requestAnimationFrame(restore);
    prefetchCriticalRoutes(location.pathname);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(container.__yamshatTransitionTimer__);
    };
  }, [location.pathname]);
  (0, import_react2.useEffect)(() => {
    const container = mainRef.current;
    if (!container) return void 0;
    const handleScroll = () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        saveScrollPosition(location.pathname, container.scrollTop);
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [location.pathname]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `app-shell yamshat-shell ${nativeShell ? "native-shell" : ""}`, children: [
    !nativeShell && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Sidebar, {}),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `main-shell ${nativeShell ? "native-shell" : ""}`, children: [
      !nativeShell && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Topbar, {}),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "main",
        {
          className: `page-content ${nativeShell ? "native-shell" : ""} ${isTransitioning ? "is-transitioning" : ""}`,
          ref: mainRef,
          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "page-shell-glow", children }, location.pathname)
        }
      )
    ] }),
    !nativeShell && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MobileDock, {}),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("style", { dangerouslySetInnerHTML: {
      __html: `
          .app-shell {
            display: flex;
            min-height: 100vh;
            height: 100vh;
            background:
              radial-gradient(circle at top, rgba(59,130,246,0.08), transparent 34%),
              linear-gradient(180deg, #07111f 0%, #0f172a 34%, #08101d 100%);
            overflow: hidden;
          }

          .app-shell.native-shell {
            flex-direction: column;
          }

          .main-shell {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
            min-width: 0;
          }

          .main-shell.native-shell {
            width: 100%;
          }

          .page-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            transition: opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease;
            will-change: transform, opacity;
          }

          .page-content.is-transitioning {
            opacity: 0.96;
            transform: translate3d(0, 8px, 0);
            filter: saturate(0.95);
          }

          .page-content.native-shell {
            padding-bottom: 68px;
          }

          .page-shell-glow {
            min-height: 100%;
            animation: pageFadeIn 260ms cubic-bezier(0.22, 1, 0.36, 1);
            content-visibility: auto;
            contain-intrinsic-size: 900px;
          }

          .page-content::-webkit-scrollbar {
            width: 8px;
          }

          .page-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .page-content::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.35);
            border-radius: 999px;
          }

          .page-content::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.55);
          }

          @keyframes pageFadeIn {
            from {
              opacity: 0;
              transform: translate3d(0, 12px, 0) scale(0.995);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @media (max-width: 768px) {
            .app-shell {
              flex-direction: column;
            }

            .page-content {
              padding-bottom: 78px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .page-content,
            .page-shell-glow {
              animation: none;
              transition: none;
              scroll-behavior: auto;
            }
          }
        `
    } })
  ] });
}

export {
  getUsers,
  getProfileBundle,
  followUser,
  updateMyProfile,
  getLiveRooms,
  getLiveRoom,
  createLiveRoom,
  getLiveComments,
  endLiveRoom,
  sendLiveGift,
  updateLiveRecording,
  initialsFromName,
  avatarGradient,
  formatCompactNumber,
  formatTimeAgo,
  formatLastSeen,
  statusTicks,
  statusColor,
  getNotifications,
  MainLayout
};
