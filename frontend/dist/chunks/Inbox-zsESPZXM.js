import { b9 as useNavigate, bh as useToast, aP as reactExports, $ as getChatThreads, aa as getNotifications, as as markMessagesSeen, at as markNotificationRead, au as markNotificationsRead, am as jsxRuntimeExports, k as MainLayout } from "../index-T8PSkq5D.js";
import { g as getStories, v as viewStory } from "./stories-CipqxCu0.js";
import { e as getGroups, c as createGroup } from "./groups-3iIR0itr.js";
import { g as getMe, b as getUsers } from "./users-DfLSLKsg.js";
import { u as useIsMobile } from "./useIsMobile-BIlF5Z4x.js";
import { B as BrandLogo } from "./BrandLogo-B8rkCqHE.js";
const TABS = [
  { key: "all", label: "الكل" },
  { key: "messages", label: "الرسائل" },
  { key: "groups", label: "المجموعات" },
  { key: "requests", label: "الطلبات" }
];
function MenuIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 7h16M4 12h16M4 17h10", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }) });
}
function SearchIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "6.5", fill: "none", stroke: "currentColor", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m16 16 4.2 4.2", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
  ] });
}
function ComposeIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M13.5 5.5 18.5 10.5M5 19l3.6-.8c.5-.1 1-.4 1.4-.8L19.2 8.2a1.9 1.9 0 0 0 0-2.7l-.7-.7a1.9 1.9 0 0 0-2.7 0l-9.2 9.2c-.4.4-.7.9-.8 1.4L5 19Z", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round", strokeLinecap: "round" }) });
}
function PlusIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 5v14M5 12h14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) });
}
function HomeIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.8v-5.3H9.8V20H5a1 1 0 0 1-1-1z", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }) });
}
function CompassIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "8", fill: "none", stroke: "currentColor", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m9.3 14.7 1.7-5.1 5.1-1.7-1.7 5.1z", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" })
  ] });
}
function ChatNavIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 18.5c-1.1 0-2-.9-2-2V7.5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H9l-4 3v-3z", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }) });
}
function UserIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "8", r: "3.2", fill: "none", stroke: "currentColor", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5.5 19c1.6-3 4-4.5 6.5-4.5s4.9 1.5 6.5 4.5", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
  ] });
}
function BellIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.2c0 .9-.3 1.8-.9 2.5l-1.1 1.3h13l-1.1-1.3c-.6-.7-.9-1.6-.9-2.5V9A4.5 4.5 0 0 0 12 4.5Z", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9.8 18.2a2.5 2.5 0 0 0 4.4 0", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
  ] });
}
function GroupIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "9", cy: "9", r: "2.5", fill: "none", stroke: "currentColor", strokeWidth: "1.7" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "16.5", cy: "8", r: "2", fill: "none", stroke: "currentColor", strokeWidth: "1.7" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4.5 18c.8-2.4 2.7-3.8 4.8-3.8s4 1.4 4.8 3.8M14.3 17.7c.4-1.8 1.7-2.9 3.5-2.9 1 0 2 .4 2.7 1.2", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" })
  ] });
}
function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = /* @__PURE__ */ new Date();
  const sameDay = today.toDateString() === date.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = /* @__PURE__ */ new Date();
  yesterday.setDate(today.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return "أمس";
  return date.toLocaleDateString("ar-EG", { month: "numeric", day: "numeric" });
}
function timeAgoLabel(value) {
  if (!value) return "الآن";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "الآن";
  const diffMin = Math.max(1, Math.floor((Date.now() - date.getTime()) / 6e4));
  if (diffMin < 60) return `منذ ${diffMin} د`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `منذ ${diffHours} س`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "أمس";
  return `منذ ${diffDays} ي`;
}
function initials(value = "") {
  return String(value || "").trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase() || "Y";
}
function gradientFromSeed(seed = "") {
  const value = Array.from(String(seed || "YAMSHAT")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const hue = value % 360;
  return `linear-gradient(135deg, hsl(${hue} 78% 58%), hsl(${(hue + 42) % 360} 88% 62%))`;
}
function threadPreview(thread) {
  const content = String(thread?.last_message || "").trim();
  const type = String(thread?.last_message_type || "text").toLowerCase();
  if (content) {
    if (type === "voice") return `🎤 ${content}`;
    if (type === "image" || type === "photo") return `🖼️ ${content}`;
    if (type === "video") return `🎬 ${content}`;
    if (type === "file" || type === "document") return `📎 ${content}`;
    return content;
  }
  if (type === "voice") return "🎤 رسالة صوتية";
  if (type === "image" || type === "photo") return "🖼️ صورة";
  if (type === "video") return "🎬 فيديو";
  if (type === "file" || type === "document") return "📎 ملف";
  return "ابدأ المحادثة";
}
function normalizeThread(item = {}) {
  const username = String(item.username || item.name || "").trim();
  return {
    type: "thread",
    id: `thread:${username}`,
    username,
    title: username,
    avatar: item.avatar || "",
    preview: threadPreview(item),
    unreadCount: Number(item.unread_count || 0),
    isOnline: Boolean(item?.presence?.is_online),
    lastSeen: item?.presence?.last_seen || item?.last_seen || null,
    timestamp: item.created_at || null,
    raw: item
  };
}
function normalizeNotificationItem(item = {}) {
  const title = String(item.title || "إشعار جديد").trim() || "إشعار جديد";
  const body = String(item.body || item.message || item.text || "").trim() || "لديك تحديث جديد";
  return {
    type: "notification",
    id: `notification:${item.id}`,
    notificationId: item.id,
    title,
    preview: body,
    unreadCount: item.is_read || item.seen ? 0 : 1,
    timestamp: item.created_at || null,
    path: item.path || item?.data?.path || "/notifications",
    raw: item
  };
}
function normalizeGroupItem(item = {}, currentUsername = "") {
  const members = Array.isArray(item.members) ? item.members : [];
  const isMember = members.some((member) => member?.username === currentUsername);
  return {
    type: "group",
    id: `group:${item.id}`,
    groupId: item.id,
    title: String(item.name || "مجموعة").trim() || "مجموعة",
    preview: item.description || `${Number(item.members_count || members.length || 0)} عضو`,
    membersCount: Number(item.members_count || members.length || 0),
    timestamp: item.created_at || null,
    isMember,
    raw: item
  };
}
function groupStories(items = []) {
  const map = /* @__PURE__ */ new Map();
  (Array.isArray(items) ? items : []).forEach((story) => {
    const username = String(story?.username || "").trim();
    if (!username) return;
    if (!map.has(username)) {
      map.set(username, {
        username,
        stories: [],
        avatar: story?.avatar || story?.avatar_url || ""
      });
    }
    map.get(username).stories.push(story);
  });
  return Array.from(map.values()).sort((a, b) => {
    const left = new Date(b.stories?.[0]?.created_at || 0).getTime();
    const right = new Date(a.stories?.[0]?.created_at || 0).getTime();
    return left - right;
  });
}
function AvatarCircle({ name, avatar, size = 56, ring = false, online = false, icon = null }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `yam-mobile-avatar ${ring ? "ringed" : ""}`,
      style: { width: size, height: size, backgroundImage: avatar ? `url(${avatar})` : gradientFromSeed(name) },
      "aria-hidden": "true",
      children: [
        !avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: icon || initials(name) }) : null,
        online ? /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "online-dot" }) : null
      ]
    }
  );
}
function MobileNav({ unreadCount = 0, requestCount = 0 }) {
  const navigate = useNavigate();
  const items = [
    { key: "home", label: "الرئيسية", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(HomeIcon, {}), onClick: () => navigate("/") },
    { key: "discover", label: "الاستكشاف", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CompassIcon, {}), onClick: () => navigate("/search") },
    { key: "create", label: "إنشاء", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(PlusIcon, {}), center: true, onClick: () => navigate("/stories") },
    { key: "messages", label: "الرسائل", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ChatNavIcon, {}), active: true, badge: unreadCount > 0 ? unreadCount : "", onClick: () => navigate("/inbox") },
    { key: "profile", label: "الملف الشخصي", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(UserIcon, {}), badge: requestCount > 0 ? requestCount : "", onClick: () => navigate("/profile") }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "yam-mobile-bottom-nav", "aria-label": "التنقل السفلي", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      className: `yam-bottom-nav-item ${item.center ? "center" : ""} ${item.active ? "active" : ""}`,
      onClick: item.onClick,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-bottom-nav-icon", children: item.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-bottom-nav-label", children: item.label }),
        item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-bottom-nav-badge", children: item.badge }) : null
      ]
    },
    item.key
  )) });
}
function ComposeModal({ open, onClose, navigate, pushToast }) {
  const [tab, setTab] = reactExports.useState("chat");
  const [query, setQuery] = reactExports.useState("");
  const [users, setUsers] = reactExports.useState([]);
  const [searching, setSearching] = reactExports.useState(false);
  const [groupName, setGroupName] = reactExports.useState("");
  const [groupDesc, setGroupDesc] = reactExports.useState("");
  const [creatingGroup, setCreatingGroup] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!open) {
      setQuery("");
      setUsers([]);
      setGroupName("");
      setGroupDesc("");
      setTab("chat");
    }
  }, [open]);
  reactExports.useEffect(() => {
    if (!open || tab !== "chat") return void 0;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const resp = await getUsers({ q: query, limit: 20 });
        const list = Array.isArray(resp?.data) ? resp.data : resp?.data?.users || [];
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, tab, query]);
  const handleOpenChat = reactExports.useCallback((user) => {
    if (!user) return;
    const username = user.username || user.user_name || user.handle;
    onClose?.();
    if (username) {
      navigate(`/chat/${encodeURIComponent(username)}`);
    } else if (user.id) {
      navigate(`/chat/${encodeURIComponent(user.id)}`);
    }
  }, [navigate, onClose]);
  const handleCreateGroup = reactExports.useCallback(async () => {
    const name = groupName.trim();
    if (!name) {
      pushToast?.({ type: "info", title: "أدخل اسم المجموعة" });
      return;
    }
    setCreatingGroup(true);
    try {
      const resp = await createGroup({ name, description: groupDesc.trim() });
      const group = resp?.data || resp;
      pushToast?.({ type: "success", title: "تم إنشاء المجموعة", description: name });
      onClose?.();
      if (group?.id) {
        navigate(`/groups`);
      }
    } catch {
      pushToast?.({ type: "warning", title: "تعذر إنشاء المجموعة", description: "تحقق من الاتصال وحاول مجدداً." });
    } finally {
      setCreatingGroup(false);
    }
  }, [groupName, groupDesc, pushToast, onClose, navigate]);
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-compose-overlay", dir: "rtl", role: "dialog", "aria-modal": "true", "aria-label": "إنشاء جديد", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-compose-modal", onClick: (e) => e.stopPropagation(), style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-compose-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "إنشاء جديد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-compose-close", onClick: onClose, "aria-label": "إغلاق", children: "✕" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-compose-tabs", role: "tablist", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": tab === "chat",
          className: `yam-compose-tab ${tab === "chat" ? "active" : ""}`,
          onClick: () => setTab("chat"),
          children: "دردشة جديدة"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": tab === "group",
          className: `yam-compose-tab ${tab === "group" ? "active" : ""}`,
          onClick: () => setTab("group"),
          children: "مجموعة جديدة"
        }
      )
    ] }),
    tab === "chat" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-compose-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "search",
          className: "yam-compose-input",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "ابحث عن شخص للمحادثة...",
          "aria-label": "البحث عن مستخدم",
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-compose-users-list", children: searching ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-compose-hint", children: "جارٍ البحث…" }) : users.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-compose-hint", children: query ? 'لا توجد نتائج لـ "' + query + '".' : "ابدأ بكتابة اسم المستخدم." }) : users.map((u) => {
        const name = u.full_name || u.name || u.username || "mostakhdam";
        const handle = u.username || u.user_name || u.handle || "";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "yam-compose-user-row",
            onClick: () => handleOpenChat(u),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-compose-user-avatar", "aria-hidden": "true", children: name.slice(0, 1) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-compose-user-meta", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: name }),
                handle ? /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
                  "@",
                  handle
                ] }) : null
              ] })
            ]
          },
          u.id || handle || name
        );
      }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-compose-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-compose-label", htmlFor: "yam-group-name", children: "اسم المجموعة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: "yam-group-name",
          type: "text",
          className: "yam-compose-input",
          value: groupName,
          onChange: (e) => setGroupName(e.target.value),
          placeholder: "مثال: عائلة تواصل",
          maxLength: 80,
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-compose-label", htmlFor: "yam-group-desc", children: "وصف (اختياري)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          id: "yam-group-desc",
          className: "yam-compose-input yam-compose-textarea",
          value: groupDesc,
          onChange: (e) => setGroupDesc(e.target.value),
          placeholder: "وصف قصير للمجموعة",
          rows: 3,
          maxLength: 200
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "yam-compose-primary",
          onClick: handleCreateGroup,
          disabled: creatingGroup || !groupName.trim(),
          children: creatingGroup ? "جارٍ الإنشاء…" : "إنشاء المجموعة"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-compose-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: grid;
            place-items: center;
            z-index: 9999;
            padding: 16px;
            font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          }
          .yam-compose-modal {
            width: min(440px, 100%);
            max-height: calc(100vh - 32px);
            overflow-y: auto;
            background: var(--panel, #1a1a25);
            border: 1px solid var(--line, #2a2a3a);
            border-radius: 18px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            color: var(--text, #fff);
          }
          .yam-compose-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            border-bottom: 1px solid var(--line, #2a2a3a);
          }
          .yam-compose-head strong { font-size: 16px; }
          .yam-compose-close {
            min-width: 36px;
            min-height: 36px;
            border-radius: 10px;
            border: none;
            background: transparent;
            color: var(--muted, #aaa);
            font-size: 18px;
            cursor: pointer;
          }
          .yam-compose-close:hover { background: rgba(255,255,255,0.06); color: var(--text, #fff); }
          .yam-compose-tabs {
            display: flex;
            gap: 6px;
            padding: 10px 12px 0;
          }
          .yam-compose-tab {
            flex: 1;
            min-height: 40px;
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
            background: transparent;
            color: var(--text, #fff);
            font-weight: 600;
            cursor: pointer;
          }
          .yam-compose-tab.active {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border-color: transparent;
            color: white;
          }
          .yam-compose-body {
            padding: 14px 16px 18px;
            display: grid;
            gap: 10px;
          }
          .yam-compose-label { font-size: 13px; color: var(--muted, #aaa); }
          .yam-compose-input {
            width: 100%;
            min-height: 44px;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
            background: var(--bg, #0e0e18);
            color: var(--text, #fff);
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
          }
          .yam-compose-textarea { min-height: 72px; resize: vertical; }
          .yam-compose-input:focus {
            outline: 2px solid rgba(139, 92, 246, 0.5);
            outline-offset: 1px;
          }
          .yam-compose-users-list {
            display: grid;
            gap: 4px;
            max-height: 320px;
            overflow-y: auto;
          }
          .yam-compose-hint {
            color: var(--muted, #aaa);
            text-align: center;
            font-size: 13px;
            padding: 18px 8px;
            margin: 0;
          }
          .yam-compose-user-row {
            display: flex;
            gap: 10px;
            align-items: center;
            padding: 10px;
            border-radius: 12px;
            border: 1px solid transparent;
            background: transparent;
            color: var(--text, #fff);
            cursor: pointer;
            text-align: start;
          }
          .yam-compose-user-row:hover {
            background: rgba(255,255,255,0.04);
            border-color: var(--line, #2a2a3a);
          }
          .yam-compose-user-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            font-weight: 800;
            flex-shrink: 0;
          }
          .yam-compose-user-meta { display: grid; gap: 2px; }
          .yam-compose-user-meta small { color: var(--muted, #aaa); font-size: 12px; }
          .yam-compose-primary {
            margin-top: 6px;
            min-height: 46px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            font-weight: 700;
            cursor: pointer;
            font-size: 15px;
          }
          .yam-compose-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        ` })
  ] }) });
}
function Inbox() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = reactExports.useState(true);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [threads, setThreads] = reactExports.useState([]);
  const [notifications, setNotifications] = reactExports.useState([]);
  const [stories, setStories] = reactExports.useState([]);
  const [groups, setGroups] = reactExports.useState([]);
  const [profile, setProfile] = reactExports.useState(null);
  const [composeOpen, setComposeOpen] = reactExports.useState(false);
  const loadData = reactExports.useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    const results = await Promise.allSettled([
      getChatThreads(),
      getNotifications(40),
      getStories(),
      getGroups(),
      getMe()
    ]);
    const [threadsRes, notificationsRes, storiesRes, groupsRes, meRes] = results;
    if (threadsRes.status === "fulfilled") {
      const nextThreads = Array.isArray(threadsRes.value?.data) ? threadsRes.value.data : [];
      setThreads(nextThreads.map(normalizeThread).filter((item) => item.username));
    } else {
      setThreads([]);
    }
    if (notificationsRes.status === "fulfilled") {
      const nextNotifications = Array.isArray(notificationsRes.value?.data) ? notificationsRes.value.data : [];
      setNotifications(nextNotifications.map(normalizeNotificationItem));
    } else {
      setNotifications([]);
    }
    if (storiesRes.status === "fulfilled") {
      setStories(Array.isArray(storiesRes.value?.data) ? storiesRes.value.data : []);
    } else {
      setStories([]);
    }
    if (groupsRes.status === "fulfilled") {
      setGroups(Array.isArray(groupsRes.value?.data) ? groupsRes.value.data : []);
    } else {
      setGroups([]);
    }
    if (meRes.status === "fulfilled") {
      setProfile(meRes.value?.data || null);
    } else {
      setProfile(null);
    }
    if (results.every((entry) => entry.status === "rejected")) {
      pushToast({ type: "error", title: "تعذر تحميل الصفحة", description: "راجع الاتصال بالخادم ثم حاول مرة أخرى." });
    }
    setLoading(false);
    setRefreshing(false);
  }, [pushToast]);
  reactExports.useEffect(() => {
    loadData(false);
  }, [loadData]);
  const currentUsername = reactExports.useMemo(() => String(profile?.username || profile?.name || "").trim(), [profile]);
  const storyUsers = reactExports.useMemo(() => groupStories(stories), [stories]);
  const unreadMessagesCount = reactExports.useMemo(
    () => threads.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0),
    [threads]
  );
  reactExports.useMemo(
    () => notifications.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0),
    [notifications]
  );
  const requestItems = reactExports.useMemo(
    () => notifications.filter((item) => item.unreadCount > 0),
    [notifications]
  );
  const groupItems = reactExports.useMemo(
    () => groups.map((item) => normalizeGroupItem(item, currentUsername)),
    [currentUsername, groups]
  );
  const requestCount = requestItems.length;
  const filteredThreads = reactExports.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((item) => [item.title, item.preview].some((field) => String(field || "").toLowerCase().includes(query)));
  }, [searchQuery, threads]);
  const filteredGroups = reactExports.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groupItems;
    return groupItems.filter((item) => [item.title, item.preview].some((field) => String(field || "").toLowerCase().includes(query)));
  }, [groupItems, searchQuery]);
  const filteredRequests = reactExports.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requestItems;
    return requestItems.filter((item) => [item.title, item.preview].some((field) => String(field || "").toLowerCase().includes(query)));
  }, [requestItems, searchQuery]);
  const unifiedItems = reactExports.useMemo(() => {
    const base = [];
    if (activeTab === "all" || activeTab === "messages") base.push(...filteredThreads);
    if (activeTab === "all") base.push(...filteredRequests.slice(0, 4));
    if (activeTab === "groups") return filteredGroups;
    if (activeTab === "requests") return filteredRequests;
    return base.sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime());
  }, [activeTab, filteredGroups, filteredRequests, filteredThreads]);
  const storyRail = reactExports.useMemo(() => {
    const mine = currentUsername ? [{ username: currentUsername, stories: [], avatar: profile?.avatar || "", mine: true }] : [];
    const others = storyUsers.filter((item) => item.username !== currentUsername).slice(0, isMobile ? 12 : 8);
    return [...mine, ...others];
  }, [currentUsername, isMobile, profile?.avatar, storyUsers]);
  const handleOpenThread = reactExports.useCallback(async (thread) => {
    if (!thread?.username) return;
    try {
      if (thread.unreadCount > 0) {
        await markMessagesSeen(thread.username);
        setThreads((prev) => prev.map((item) => item.username === thread.username ? { ...item, unreadCount: 0 } : item));
      }
    } catch {
    }
    navigate(`/chat/${encodeURIComponent(thread.username)}`);
  }, [navigate]);
  const handleOpenRequest = reactExports.useCallback(async (item) => {
    if (!item?.notificationId) return;
    try {
      await markNotificationRead(item.notificationId);
      setNotifications((prev) => prev.map((entry) => entry.notificationId === item.notificationId ? { ...entry, unreadCount: 0 } : entry));
    } catch {
    }
    navigate(item.path || "/notifications");
  }, [navigate]);
  const handleOpenStory = reactExports.useCallback(async (storyGroup) => {
    if (!storyGroup) return;
    if (!storyGroup.mine && storyGroup.stories?.[0]?.id) {
      try {
        await viewStory(storyGroup.stories[0].id);
      } catch {
      }
    }
    navigate("/stories");
  }, [navigate]);
  const handleOpenGroup = reactExports.useCallback((group) => {
    if (!group) return;
    navigate("/groups");
  }, [navigate]);
  const markAllRequestsAsRead = reactExports.useCallback(async () => {
    if (!requestCount) return;
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, unreadCount: 0 })));
      pushToast({ type: "success", title: "تم تحديث الطلبات", description: "تم تعليم كل الطلبات كمقروءة." });
    } catch {
      pushToast({ type: "warning", title: "تعذر تحديث الطلبات", description: "حاول مرة أخرى بعد قليل." });
    }
  }, [pushToast, requestCount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { hideNav: true, lockScroll: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-mobile-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-mobile-screen", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-mobile-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-btn", onClick: () => navigate("/settings"), "aria-label": "القائمة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MenuIcon, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-brand", onClick: () => navigate("/"), "aria-label": "YAMSHAT", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-brand-mark", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 28, alt: "Yamshat", className: "yam-brand-mark-image" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-brand-text", children: "YAMSHAT" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-btn", onClick: () => setComposeOpen(true), "aria-label": "إنشاء محادثة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ComposeIcon, {}) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ComposeModal,
        {
          open: composeOpen,
          onClose: () => setComposeOpen(false),
          navigate,
          pushToast
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-search-box", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SearchIcon, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            value: searchQuery,
            onChange: (event) => setSearchQuery(event.target.value),
            placeholder: "البحث في المحادثات",
            "aria-label": "البحث في المحادثات"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-refresh-chip", onClick: () => loadData(true), disabled: refreshing, children: refreshing ? "جارٍ التحديث" : "تحديث" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-rail", role: "list", "aria-label": "القصص والنشاط السريع", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-story-card create", onClick: () => navigate("/stories"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-create-badge", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PlusIcon, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-label", children: "إنشاء قصة" })
        ] }),
        storyRail.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "yam-story-card",
            onClick: () => handleOpenStory(item),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AvatarCircle,
                {
                  name: item.mine ? item.username || "أنت" : item.username,
                  avatar: item.avatar,
                  size: 58,
                  ring: !item.mine && item.stories?.length > 0,
                  online: !item.mine && item.stories?.length > 0
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-label", children: item.mine ? "أنت" : item.username })
            ]
          },
          `${item.username || "me"}:${item.mine ? "mine" : "story"}`
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-tabs-wrap", children: TABS.map((tab) => {
        const count = tab.key === "messages" ? unreadMessagesCount : tab.key === "groups" ? groupItems.length : tab.key === "requests" ? requestCount : unreadMessagesCount + requestCount;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: `yam-tab-pill ${activeTab === tab.key ? "active" : ""}`,
            onClick: () => setActiveTab(tab.key),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tab.label }),
              count > 0 && tab.key !== "all" ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: count }) : null
            ]
          },
          tab.key
        );
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-content-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-content-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: activeTab === "groups" ? "المجموعات" : activeTab === "requests" ? "الطلبات والتنبيهات" : "المحادثات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: activeTab === "groups" ? "عرض مباشر للمجموعات المحفوظة في الخادم." : activeTab === "requests" ? "كل عنصر هنا قادم من بيانات التنبيهات الحقيقية." : "القائمة مرتبطة بآخر الرسائل المخزنة في الباك إند." })
          ] }),
          activeTab === "requests" && requestCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-link-btn", onClick: markAllRequestsAsRead, children: "تعليم الكل" }) : null
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-loading-state", children: "جارٍ تحميل البيانات الحقيقية..." }) : unifiedItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-list", children: unifiedItems.map((item) => {
          if (item.type === "notification") {
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-list-row system", onClick: () => handleOpenRequest(item), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-leading-icon notification", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BellIcon, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-copy", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-main-line", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(item.timestamp) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-sub-line", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.preview }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-meta", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-meta-tag", children: "إشعار" }),
                    item.unreadCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-count-badge", children: item.unreadCount }) : null
                  ] })
                ] })
              ] })
            ] }, item.id);
          }
          if (item.type === "group") {
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-list-row system", onClick: () => handleOpenGroup(item), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-leading-icon group", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GroupIcon, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-copy", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-main-line", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(item.timestamp) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-sub-line", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.preview }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-meta", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-meta-tag", children: [
                      item.membersCount,
                      " عضو"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `yam-meta-tag ${item.isMember ? "success" : ""}`, children: item.isMember ? "منضم" : "عرض" })
                  ] })
                ] })
              ] })
            ] }, item.id);
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-list-row", onClick: () => handleOpenThread(item), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-avatar-slot", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarCircle, { name: item.title, avatar: item.avatar, size: 58, online: item.isOnline }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-copy", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-main-line", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(item.timestamp) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-sub-line", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.preview }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-meta", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `yam-meta-tag ${item.isOnline ? "success" : ""}`, children: item.isOnline ? "متصل الآن" : item.lastSeen ? timeAgoLabel(item.lastSeen) : "آخر ظهور غير متاح" }),
                  item.unreadCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-count-badge", children: item.unreadCount }) : null
                ] })
              ] })
            ] })
          ] }, item.id);
        }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-empty-state", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-icon", children: "💬" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: activeTab === "groups" ? "لا توجد مجموعات حالياً" : activeTab === "requests" ? "لا توجد طلبات جديدة" : "لا توجد محادثات مخزنة بعد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activeTab === "groups" ? "بمجرد إنشاء أو تحميل مجموعات من الخادم ستظهر هنا." : activeTab === "requests" ? "أي تنبيه أو طلب جديد من الباك إند سيظهر فوراً في هذه المساحة." : "سيتم عرض المحادثات الحقيقية فور توفرها من الباك إند دون أي أسماء تجريبية." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MobileNav, { unreadCount: unreadMessagesCount, requestCount }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-mobile-page {
            min-height: 100vh;
            min-height: 100dvh;
            background:
              radial-gradient(circle at top right, rgba(130, 73, 255, 0.16), transparent 20%),
              radial-gradient(circle at top left, rgba(52, 211, 153, 0.08), transparent 18%),
              #040713;
            color: #fff;
          }

          .yam-mobile-screen {
            min-height: 100vh;
            min-height: 100dvh;
            max-width: 520px;
            margin: 0 auto;
            padding: calc(14px + env(safe-area-inset-top, 0px)) 14px calc(104px + env(safe-area-inset-bottom, 0px));
          }

          .yam-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .yam-icon-btn,
          .yam-link-btn,
          .yam-refresh-chip,
          .yam-bottom-nav-item,
          .yam-story-card,
          .yam-tab-pill,
          .yam-list-row,
          .yam-brand {
            border: 0;
            background: none;
            color: inherit;
            cursor: pointer;
            font: inherit;
          }

          .yam-icon-btn {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            color: #d7d8ff;
            border-radius: 14px;
            background: rgba(10, 15, 31, 0.86);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
          }

          .yam-icon-btn svg,
          .yam-search-box svg,
          .yam-leading-icon svg,
          .yam-bottom-nav-icon svg,
          .yam-story-create-badge svg {
            width: 20px;
            height: 20px;
          }

          .yam-brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 0 10px;
          }

          .yam-brand-mark {
            width: 28px;
            height: 28px;
            border-radius: 11px;
            display: grid;
            place-items: center;
            font-weight: 900;
            font-size: 16px;
            background: linear-gradient(135deg, #8b5cf6, #5b21b6);
            color: #fff;
            box-shadow: 0 10px 24px rgba(109, 40, 217, 0.35);
          }

          .yam-brand-text {
            letter-spacing: 0.32em;
            font-size: 15px;
            font-weight: 800;
            color: #f7f7ff;
          }

          .yam-search-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(9, 15, 32, 0.92);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 18px;
            padding: 12px 14px;
            margin-bottom: 14px;
            box-shadow: 0 12px 30px rgba(2, 6, 23, 0.42);
            color: #9297c4;
          }

          .yam-search-box input {
            flex: 1;
            background: transparent;
            border: 0;
            outline: 0;
            color: #fff;
            font-size: 14px;
          }

          .yam-search-box input::placeholder {
            color: #8b90b7;
          }

          .yam-refresh-chip {
            flex-shrink: 0;
            border-radius: 999px;
            padding: 7px 11px;
            background: rgba(139, 92, 246, 0.18);
            color: #d8c8ff;
            font-size: 12px;
            font-weight: 700;
          }

          .yam-story-rail {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 4px 0 12px;
            margin-bottom: 10px;
            scrollbar-width: none;
          }

          .yam-story-rail::-webkit-scrollbar {
            display: none;
          }

          .yam-story-card {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            min-width: 64px;
          }

          .yam-story-card.create {
            padding-top: 2px;
          }

          .yam-story-label {
            width: 68px;
            font-size: 12px;
            color: #d9defe;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .yam-story-create-badge {
            width: 58px;
            height: 58px;
            border-radius: 22px;
            display: grid;
            place-items: center;
            background: rgba(9, 15, 32, 0.9);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
            color: #8b5cf6;
          }

          .yam-mobile-avatar {
            position: relative;
            border-radius: 20px;
            background-size: cover;
            background-position: center;
            display: grid;
            place-items: center;
            color: white;
            font-weight: 800;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
            overflow: hidden;
          }

          .yam-mobile-avatar.ringed {
            box-shadow: 0 0 0 2px rgba(138, 92, 246, 0.88), 0 10px 26px rgba(88, 28, 135, 0.35);
          }

          .yam-mobile-avatar span {
            font-size: 16px;
            letter-spacing: 0.04em;
          }

          .online-dot {
            position: absolute;
            right: 3px;
            bottom: 3px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #44d36e;
            border: 2px solid #050916;
            box-shadow: 0 0 0 3px rgba(68, 211, 110, 0.15);
          }

          .yam-tabs-wrap {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 2px 0 14px;
            scrollbar-width: none;
          }

          .yam-tabs-wrap::-webkit-scrollbar {
            display: none;
          }

          .yam-tab-pill {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 42px;
            padding: 0 18px;
            border-radius: 999px;
            background: rgba(9, 15, 32, 0.92);
            color: #c8ccee;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
            font-weight: 700;
          }

          .yam-tab-pill strong {
            min-width: 22px;
            height: 22px;
            padding: 0 6px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: rgba(139, 92, 246, 0.22);
            color: #efe6ff;
            font-size: 12px;
          }

          .yam-tab-pill.active {
            background: linear-gradient(135deg, #8338ec, #6320d9);
            color: #fff;
            box-shadow: 0 14px 30px rgba(99, 32, 217, 0.34);
          }

          .yam-tab-pill.active strong {
            background: rgba(255,255,255,0.16);
            color: #fff;
          }

          .yam-content-card {
            background: rgba(8, 13, 28, 0.92);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 28px;
            padding: 16px;
            box-shadow: 0 20px 50px rgba(2, 6, 23, 0.42);
          }

          .yam-content-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 8px;
          }

          .yam-content-head h1 {
            margin: 0;
            font-size: 24px;
            line-height: 1.1;
          }

          .yam-content-head p {
            margin: 6px 0 0;
            color: #96a0cb;
            font-size: 12px;
            line-height: 1.7;
          }

          .yam-link-btn {
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(139, 92, 246, 0.12);
            color: #d7c8ff;
            font-size: 12px;
            font-weight: 700;
          }

          .yam-list {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }

          .yam-list-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            text-align: right;
            border-radius: 22px;
            padding: 12px;
            background: rgba(7, 12, 27, 0.84);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
            transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
          }

          .yam-list-row:hover,
          .yam-list-row:focus-visible {
            background: rgba(12, 19, 40, 0.96);
            transform: translateY(-1px);
            box-shadow: inset 0 0 0 1px rgba(139,92,246,0.24);
            outline: none;
          }

          .yam-list-row.system {
            align-items: stretch;
          }

          .yam-avatar-slot {
            flex-shrink: 0;
          }

          .yam-leading-icon {
            width: 58px;
            height: 58px;
            border-radius: 22px;
            display: grid;
            place-items: center;
            flex-shrink: 0;
          }

          .yam-leading-icon.notification {
            background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(87, 28, 221, 0.56));
            color: #efe6ff;
          }

          .yam-leading-icon.group {
            background: linear-gradient(135deg, rgba(59,130,246,0.26), rgba(6,182,212,0.32));
            color: #dff7ff;
          }

          .yam-row-copy {
            min-width: 0;
            flex: 1;
            display: grid;
            gap: 6px;
          }

          .yam-row-main-line,
          .yam-row-sub-line {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
          }

          .yam-row-main-line strong {
            font-size: 18px;
            line-height: 1.2;
            color: #fff;
          }

          .yam-row-main-line span {
            flex-shrink: 0;
            color: #98a0c8;
            font-size: 12px;
            padding-top: 2px;
          }

          .yam-row-sub-line p {
            margin: 0;
            min-width: 0;
            color: #a5add3;
            font-size: 13px;
            line-height: 1.6;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .yam-row-meta {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .yam-meta-tag {
            display: inline-flex;
            align-items: center;
            min-height: 26px;
            padding: 0 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.05);
            color: #aeb6de;
            font-size: 11px;
            font-weight: 700;
          }

          .yam-meta-tag.success {
            background: rgba(34,197,94,0.14);
            color: #aaf0be;
          }

          .yam-count-badge {
            min-width: 28px;
            height: 28px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            padding: 0 8px;
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 10px 18px rgba(109, 40, 217, 0.28);
          }

          .yam-loading-state,
          .yam-empty-state {
            min-height: 320px;
            display: grid;
            place-items: center;
            text-align: center;
            padding: 30px 18px 24px;
            color: #dbe0ff;
          }

          .yam-empty-state {
            gap: 10px;
          }

          .yam-empty-state strong {
            font-size: 18px;
          }

          .yam-empty-state span {
            color: #98a0c8;
            line-height: 1.8;
            font-size: 13px;
            max-width: 310px;
          }

          .yam-empty-icon {
            font-size: 40px;
            line-height: 1;
          }

          .yam-mobile-bottom-nav {
            position: fixed;
            right: 50%;
            bottom: 0;
            transform: translateX(50%);
            width: min(520px, 100%);
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            background: linear-gradient(180deg, rgba(4,7,19,0), rgba(4,7,19,0.92) 30%, rgba(4,7,19,0.98));
            backdrop-filter: blur(20px);
          }

          .yam-bottom-nav-item {
            position: relative;
            min-height: 62px;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            color: #8f97c2;
            background: rgba(9, 15, 32, 0.88);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
          }

          .yam-bottom-nav-item.center {
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            color: #fff;
            transform: translateY(-12px);
            box-shadow: 0 18px 32px rgba(109,40,217,0.34);
          }

          .yam-bottom-nav-item.active:not(.center) {
            color: #b590ff;
            box-shadow: inset 0 0 0 1px rgba(139,92,246,0.18);
          }

          .yam-bottom-nav-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .yam-bottom-nav-label {
            font-size: 11px;
            font-weight: 700;
          }

          .yam-bottom-nav-badge {
            position: absolute;
            top: 7px;
            left: 14px;
            min-width: 20px;
            height: 20px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            padding: 0 5px;
            background: #8b5cf6;
            color: #fff;
            font-size: 10px;
            font-weight: 800;
          }

          @media (min-width: 1024px) {
            .yam-mobile-screen {
              padding-top: 20px;
            }

            .yam-mobile-bottom-nav {
              border-radius: 30px 30px 0 0;
            }
          }

          @media (max-width: 420px) {
            .yam-brand-text {
              letter-spacing: 0.18em;
              font-size: 13px;
            }

            .yam-row-main-line strong {
              font-size: 16px;
            }

            .yam-content-head h1 {
              font-size: 22px;
            }
          }
        ` })
  ] }) });
}
export {
  Inbox as default
};
