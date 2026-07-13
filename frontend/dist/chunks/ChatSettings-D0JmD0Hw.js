import { bx as useParams, bv as useNavigate, bC as useToast, a_ as reactExports, bm as unblockUserApi, u as blockUserApi, aq as jsxRuntimeExports, h as MainLayout, ae as getMessages, ag as getPresence, a0 as getBlockStatus, a4 as getChatThreads } from "../index-2I4hYPnI.js";
import { g as getChatPreferences, t as toggleChatPreference, A as Avatar } from "./chatPreferences-DmINjiDA.js";
import { b as formatLastSeen } from "./YamshatDesign-54IPzo7E.js";
import "./VoiceMessagePlayer-DD0mL2o0.js";
import "./translationService-tb0zyizg.js";
import "./index-CoUPGeqi.js";
const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const IMAGE_MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic|heif)(?:$|\?)/i;
const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|mkv)(?:$|\?)/i;
function getPrimaryAttachment(message = {}) {
  return Array.isArray(message?.attachments) && message.attachments.length ? message.attachments[0] || {} : {};
}
function resolveMessageMediaUrl(message = {}) {
  const attachment = getPrimaryAttachment(message);
  return String(
    message?.media_url || message?.media_urls?.[0] || attachment?.url || attachment?.mediaUrl || attachment?.media_url || ""
  ).trim();
}
function extractFileName(message = {}) {
  const attachment = getPrimaryAttachment(message);
  if (message.attachment_name) return message.attachment_name;
  if (attachment?.fileName) return attachment.fileName;
  if (attachment?.file_name) return attachment.file_name;
  if (attachment?.name) return attachment.name;
  const mediaUrl = resolveMessageMediaUrl(message);
  if (!mediaUrl) return "ملف مرفق";
  try {
    const clean = mediaUrl.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "ملف مرفق");
  } catch {
    return "ملف مرفق";
  }
}
function resolveMediaType(message = {}) {
  const attachment = getPrimaryAttachment(message);
  const mediaUrl = resolveMessageMediaUrl(message).toLowerCase();
  const rawType = String(message?.type || message?.message_type || attachment?.kind || attachment?.type || "").trim().toLowerCase();
  const mime = String(attachment?.mime_type || attachment?.mimeType || "").trim().toLowerCase();
  if (["video", "media_video"].includes(rawType) || mime.startsWith("video/") || VIDEO_MEDIA_RE.test(mediaUrl)) return "video";
  if (mime.startsWith("image/") || IMAGE_MEDIA_RE.test(mediaUrl) || ["image", "photo", "media_image"].includes(rawType)) return "image";
  return "file";
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
        const nextMessages = messagesRes.status === "fulfilled" ? (Array.isArray(messagesRes.value?.data) ? messagesRes.value.data : messagesRes.value?.data?.items || []).map((item) => ({ ...item, media_url: resolveMessageMediaUrl(item) })) : [];
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
  const mediaItems = reactExports.useMemo(() => messages.filter((item) => resolveMessageMediaUrl(item)).map((item, index) => ({
    id: String(item?.id || item?.client_id || index),
    url: resolveMessageMediaUrl(item),
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
          /* ✅ v85.8: تفعيل التمرير باللمس على الموبايل على body فقط.
             المشكلة السابقة: المُغلف الخارجي كان overflow:hidden مع grid داخل lockScroll
             دون تفعيل -webkit-overflow-scrolling و touch-action مما أوقف السحب بالأصبع. */
          .yam-chat-settings-screen {
            min-height: 100%;
            display: flex;
            flex-direction: column;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%),
              radial-gradient(circle at bottom left, rgba(59,130,246,0.08), transparent 22%),
              #040714;
            color: #fff;
            touch-action: pan-y;
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
          /* ✅ v85.8: تمرير لمسي مفعّل بالكامل للموبايل */
          .yam-chat-settings-body {
            flex: 1 1 auto;
            min-height: 0;
            overflow: visible;
            touch-action: pan-y;
            padding: 14px 14px 40px;
            padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
            display: grid;
            gap: 12px;
          }
          /* ✅ v85.8: بطاقة أكثر ترتيباً — رأس واضح + محتوى منظم،
             دون الحاجة لأشرطة لونية مقطوعة على اليمين/اليسار. */
          .yam-chat-settings-card {
            border-radius: 18px;
            border: 1px solid rgba(148,163,184,0.12);
            background: linear-gradient(180deg, rgba(15,20,38,0.92), rgba(7,11,24,0.96));
            padding: 14px 14px 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.24);
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
          /* ✅ v85.8: تجاوز تصادم enhanced-ui.css الذي يجعل .yam-section-title
             بحجم 24-36px مما يخترق ترتيب الصفحة. */
          .yam-chat-settings-body .yam-section-title {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: 0 0 10px !important;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(148,163,184,0.10);
            font-size: 15px !important;
          }
          .yam-chat-settings-body .yam-section-title h2 {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            color: #e2e8f0;
          }
          .yam-chat-settings-body .yam-section-title small {
            color: #94a3b8;
            font-size: 11px;
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
              padding: 12px 12px 40px;
              padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));
              gap: 10px;
            }
            .yam-chat-settings-card {
              padding: 12px 12px 10px;
              border-radius: 16px;
            }
            /* ✅ v85.8: الإحصائيات أحياناً 2×2 أفضل من عمود واحد — أرتب */
            .yam-meta-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px;
            }
            .yam-actions-grid {
              grid-template-columns: minmax(0, 1fr);
            }
            .yam-stat-pill,
            .yam-action-tile {
              padding: 10px;
              border-radius: 14px;
            }
            .yam-stat-pill span,
            .yam-action-tile span {
              font-size: 10.5px;
              margin-bottom: 4px;
            }
            .yam-stat-pill strong,
            .yam-action-tile strong {
              font-size: 14px;
            }
            .yam-settings-action-btn {
              min-height: 46px;
              padding: 0 12px;
              font-size: 13.5px;
            }
            .yam-settings-action-btn strong { font-size: 13px; font-weight: 700; }
            .yam-peer-hero h1 { font-size: 18px; }
            .yam-peer-hero p { font-size: 12px; }
            .yam-media-thumb { height: 100px; }
            .yam-media-strip { grid-auto-columns: minmax(108px, 1fr); }
            .yam-file-item, .yam-link-item {
              padding: 10px 12px;
              border-radius: 14px;
            }
            .yam-file-copy strong, .yam-link-copy strong { font-size: 12.5px; }
            .yam-file-copy span, .yam-link-copy span { font-size: 10.5px; }
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
          resolveMessageMediaUrl(item) ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "yam-open-link", href: resolveMessageMediaUrl(item), target: "_blank", rel: "noreferrer", children: "فتح" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "📎" })
        ] }, String(item?.id || item?.client_id || index))) }) : null
      ] })
    ] })
  ] }) });
}
export {
  ChatSettings as default
};
