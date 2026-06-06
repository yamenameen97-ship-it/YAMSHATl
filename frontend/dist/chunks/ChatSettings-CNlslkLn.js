import { b2 as useParams, b0 as useNavigate, b8 as useToast, aK as reactExports, aU as unblockUserApi, r as blockUserApi, ah as jsxRuntimeExports, k as MainLayout, b as Avatar, a4 as getMessages, a8 as getPresence, O as getBlockStatus, X as getChatThreads } from "../index-Dz8FA2T4.js";
import { g as getChatPreferences, t as toggleChatPreference } from "./chatPreferences-Bmfbafxa.js";
import { b as formatLastSeen } from "./YamshatDesign-BB_OE-D7.js";
const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
function extractFileName(message = {}) {
  if (message.attachment_name) return message.attachment_name;
  if (Array.isArray(message.attachments) && message.attachments[0]?.fileName) return message.attachments[0].fileName;
  const mediaUrl = message.media_url || "";
  if (!mediaUrl) return "ملف مرفق";
  try {
    const clean = mediaUrl.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "ملف مرفق");
  } catch {
    return "ملف مرفق";
  }
}
function resolveMediaType(message = {}) {
  const mediaUrl = String(message?.media_url || "");
  if (message?.type === "video" || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(mediaUrl)) return "video";
  return "image";
}
function ChatSettings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const peer = decodeURIComponent(userId || "").trim();
  const [loading, setLoading] = reactExports.useState(true);
  const [messages, setMessages] = reactExports.useState([]);
  const [presence, setPresence] = reactExports.useState({});
  const [threadMeta, setThreadMeta] = reactExports.useState(null);
  const [blockStatus, setBlockStatus] = reactExports.useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [isMutedConversation, setIsMutedConversation] = reactExports.useState(false);
  const [isPinnedConversation, setIsPinnedConversation] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!peer) return;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
  }, [peer]);
  reactExports.useEffect(() => {
    if (!peer) return;
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [messagesRes, presenceRes, blockRes, threadsRes] = await Promise.allSettled([
          getMessages(peer, 120),
          getPresence(peer),
          getBlockStatus(peer),
          getChatThreads()
        ]);
        if (!active) return;
        const nextMessages = messagesRes.status === "fulfilled" ? Array.isArray(messagesRes.value?.data) ? messagesRes.value.data : messagesRes.value?.data?.items || [] : [];
        const threads = threadsRes.status === "fulfilled" ? Array.isArray(threadsRes.value?.data) ? threadsRes.value.data : [] : [];
        setMessages(nextMessages);
        setPresence(presenceRes.status === "fulfilled" ? presenceRes.value?.data || {} : {});
        setBlockStatus(blockRes.status === "fulfilled" ? blockRes.value?.data || {} : { can_chat: true, blocked_by_me: false, blocked_me: false });
        setThreadMeta(threads.find((item) => item.username === peer) || null);
      } catch {
        if (!active) return;
        pushToast?.({ type: "error", title: "تعذر تحميل إعدادات المحادثة" });
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [peer, pushToast]);
  const mediaItems = reactExports.useMemo(() => messages.filter((item) => item?.media_url).map((item, index) => ({
    id: String(item?.id || item?.client_id || index),
    url: item.media_url,
    type: resolveMediaType(item),
    caption: item.content || item.message || ""
  })), [messages]);
  const fileItems = reactExports.useMemo(() => messages.filter((item) => item?.type === "file" || item?.type === "voice" || Array.isArray(item?.attachments) && item.attachments.length > 0), [messages]);
  const sharedLinks = reactExports.useMemo(() => {
    const collected = [];
    messages.forEach((item, index) => {
      const text = `${item?.content || ""} ${item?.message || ""}`;
      const matches = text.match(URL_PATTERN) || [];
      matches.forEach((url, linkIndex) => {
        const normalized = url.startsWith("http") ? url : `https://${url}`;
        collected.push({
          id: `${item?.id || index}-${linkIndex}`,
          url: normalized,
          sender: item?.sender || "غير معروف"
        });
      });
    });
    return collected.filter((entry, index, array) => array.findIndex((item) => item.url === entry.url) === index);
  }, [messages]);
  const handleBack = reactExports.useCallback(() => {
    navigate(`/chat/${encodeURIComponent(peer)}`);
  }, [navigate, peer]);
  const handleMuteConversation = reactExports.useCallback(() => {
    const nextSet = toggleChatPreference("muted", peer);
    const next = nextSet.has(peer);
    setIsMutedConversation(next);
    pushToast?.({ type: "success", title: next ? "تم كتم المحادثة" : "تم إلغاء كتم المحادثة" });
  }, [peer, pushToast]);
  const handlePinConversation = reactExports.useCallback(() => {
    const nextSet = toggleChatPreference("pinned", peer);
    const next = nextSet.has(peer);
    setIsPinnedConversation(next);
    pushToast?.({ type: "success", title: next ? "تم تثبيت المحادثة" : "تم إلغاء تثبيت المحادثة" });
  }, [peer, pushToast]);
  const handleBlock = reactExports.useCallback(async () => {
    try {
      if (blockStatus.blocked_by_me) {
        await unblockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: false, can_chat: true }));
        pushToast?.({ type: "success", title: "تم رفع الحظر" });
      } else {
        await blockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: true, can_chat: false }));
        pushToast?.({ type: "success", title: "تم حظر المستخدم" });
      }
    } catch {
      pushToast?.({ type: "error", title: "تعذر تنفيذ العملية" });
    }
  }, [blockStatus.blocked_by_me, peer, pushToast]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { hideNav: true, lockScroll: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-chat-settings-screen", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-chat-settings-screen {
            min-height: 100%;
            height: min(100dvh, var(--yam-vh, 100dvh));
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%),
              radial-gradient(circle at bottom left, rgba(59,130,246,0.08), transparent 22%),
              #040714;
            color: #fff;
            overflow: hidden;
          }
          .yam-chat-settings-header {
            position: sticky;
            top: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 18px;
            padding-top: calc(16px + env(safe-area-inset-top, 0px));
            border-bottom: 1px solid rgba(255,255,255,0.06);
            background: rgba(7,10,24,0.94);
            backdrop-filter: blur(16px);
          }
          .yam-chat-settings-back,
          .yam-chat-settings-header-action {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .yam-chat-settings-header-copy {
            flex: 1;
            min-width: 0;
          }
          .yam-chat-settings-header-copy strong,
          .yam-chat-settings-header-copy span {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-chat-settings-header-copy strong {
            font-size: 16px;
            font-weight: 900;
          }
          .yam-chat-settings-header-copy span {
            color: #94a3b8;
            font-size: 12px;
            margin-top: 4px;
          }
          .yam-chat-settings-body {
            overflow: auto;
            padding: 18px;
            padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
            display: grid;
            gap: 16px;
          }
          .yam-chat-settings-card {
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(180deg, rgba(7,10,24,0.95), rgba(4,7,18,0.98));
            padding: 18px;
            box-shadow: 0 18px 38px rgba(0,0,0,0.18);
          }
          .yam-peer-hero {
            display: grid;
            justify-items: center;
            text-align: center;
            gap: 12px;
          }
          .yam-peer-hero h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
          }
          .yam-peer-hero p {
            margin: 0;
            color: #94a3b8;
          }
          .yam-meta-grid,
          .yam-actions-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .yam-stat-pill,
          .yam-action-tile {
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            padding: 14px;
          }
          .yam-stat-pill span,
          .yam-action-tile span {
            display: block;
            color: #94a3b8;
            font-size: 12px;
            margin-bottom: 6px;
          }
          .yam-stat-pill strong,
          .yam-action-tile strong {
            font-size: 16px;
            font-weight: 800;
          }
          .yam-section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }
          .yam-section-title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 900;
          }
          .yam-section-title small {
            color: #94a3b8;
          }
          .yam-media-strip {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(124px, 1fr);
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .yam-media-card {
            display: grid;
            gap: 8px;
            text-decoration: none;
            color: #fff;
          }
          .yam-media-thumb {
            height: 128px;
            border-radius: 18px;
            overflow: hidden;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            display: grid;
            place-items: center;
          }
          .yam-media-thumb img,
          .yam-media-thumb video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .yam-media-thumb .yam-video-placeholder {
            font-size: 34px;
          }
          .yam-media-card p {
            margin: 0;
            color: #cbd5e1;
            font-size: 12px;
            line-height: 1.5;
            min-height: 36px;
          }
          .yam-link-list,
          .yam-file-list {
            display: grid;
            gap: 10px;
          }
          .yam-link-item,
          .yam-file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
          }
          .yam-link-copy,
          .yam-file-copy {
            min-width: 0;
            flex: 1;
          }
          .yam-link-copy strong,
          .yam-link-copy span,
          .yam-file-copy strong,
          .yam-file-copy span {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-link-copy span,
          .yam-file-copy span {
            color: #94a3b8;
            font-size: 12px;
            margin-top: 4px;
          }
          .yam-open-link {
            color: #a78bfa;
            text-decoration: none;
            font-weight: 800;
          }
          .yam-settings-actions {
            display: grid;
            gap: 10px;
          }
          .yam-settings-action-btn {
            min-height: 54px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 16px;
            text-align: right;
          }
          .yam-settings-action-btn.danger {
            border-color: rgba(248,113,113,0.28);
            color: #fca5a5;
          }
          .yam-settings-empty {
            color: #94a3b8;
            text-align: center;
            padding: 18px 10px;
            border-radius: 18px;
            border: 1px dashed rgba(255,255,255,0.12);
          }
          @media (max-width: 560px) {
            .yam-chat-settings-body {
              padding: 14px;
            }
            .yam-meta-grid,
            .yam-actions-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }
        ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-chat-settings-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chat-settings-back", onClick: handleBack, "aria-label": "رجوع", children: "←" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: threadMeta?.avatar, size: 44, ring: true, showStatus: true, status: presence?.is_online ? "online" : "offline" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-settings-header-copy", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: peer }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatLastSeen(presence?.last_seen, Boolean(presence?.is_online)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chat-settings-header-action", onClick: () => navigate(`/chat/${encodeURIComponent(peer)}`), "aria-label": "فتح المحادثة", children: "💬" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-settings-body", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-chat-settings-card yam-peer-hero", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: threadMeta?.avatar, size: 104, ring: true, showStatus: true, status: presence?.is_online ? "online" : "offline" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: peer }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: presence?.is_typing ? "يكتب الآن..." : formatLastSeen(presence?.last_seen, Boolean(presence?.is_online)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-meta-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-pill", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الوسائط المشتركة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: mediaItems.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-pill", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الروابط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: sharedLinks.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-pill", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الملفات والصوتيات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fileItems.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-pill", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "حالة المحادثة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: blockStatus.blocked_by_me ? "محظور" : isMutedConversation ? "مكتومة" : "نشطة" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-chat-settings-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-title", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "إجراءات المحادثة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "بنفس أسلوب واتساب تقريبًا" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-settings-action-btn", onClick: handleMuteConversation, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: isMutedConversation ? "إلغاء كتم المحادثة" : "كتم المحادثة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isMutedConversation ? "🔔" : "🔕" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-settings-action-btn", onClick: handlePinConversation, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: isPinnedConversation ? "إلغاء تثبيت المحادثة" : "تثبيت المحادثة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "📌" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `yam-settings-action-btn ${blockStatus.blocked_by_me ? "" : "danger"}`, onClick: handleBlock, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: blockStatus.blocked_by_me ? "رفع الحظر" : "حظر المستخدم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: blockStatus.blocked_by_me ? "✅" : "🚫" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-chat-settings-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-title", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "الوسائط المشتركة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
            mediaItems.length,
            " عنصر"
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-settings-empty", children: "جاري تحميل الوسائط..." }) : null,
        !loading && !mediaItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-settings-empty", children: "لا توجد وسائط مشتركة في هذه المحادثة حالياً." }) : null,
        !loading && mediaItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-media-strip", children: mediaItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: item.url, target: "_blank", rel: "noreferrer", className: "yam-media-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-media-thumb", children: item.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.url, alt: item.caption || "وسائط مشتركة" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-video-placeholder", children: "🎬" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.caption || "عرض الوسائط" })
        ] }, item.id)) }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-chat-settings-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-title", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "الروابط المشتركة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
            sharedLinks.length,
            " رابط"
          ] })
        ] }),
        !sharedLinks.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-settings-empty", children: "لا توجد روابط مشتركة في الرسائل الحالية." }) : null,
        sharedLinks.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-link-list", children: sharedLinks.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-link-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-link-copy", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.url }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "أرسله ",
              item.sender
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "yam-open-link", href: item.url, target: "_blank", rel: "noreferrer", children: "فتح" })
        ] }, item.id)) }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-chat-settings-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-title", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "الملفات والصوتيات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
            fileItems.length,
            " ملف"
          ] })
        ] }),
        !fileItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-settings-empty", children: "لا توجد ملفات أو رسائل صوتية مشتركة حتى الآن." }) : null,
        fileItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-file-list", children: fileItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-file-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-file-copy", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: extractFileName(item) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item?.type === "voice" ? "رسالة صوتية" : "ملف مرفق" })
          ] }),
          item?.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "yam-open-link", href: item.media_url, target: "_blank", rel: "noreferrer", children: "فتح" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "📎" })
        ] }, String(item?.id || item?.client_id || index))) }) : null
      ] })
    ] })
  ] }) });
}
export {
  ChatSettings as default
};
