import { b8 as useToast, Z as getCurrentUsername, b0 as useNavigate, b2 as useParams, aK as reactExports, ah as jsxRuntimeExports } from "../index-BtxTC4_g.js";
import { a as getLiveStreamDetails, g as getLiveComments, b as getStreamStats, s as sendLiveComment, f as sendLiveHeart, d as sendLiveGift } from "./correctedLiveStreamApi-C7kfwmaj.js";
import "./apiClient-DxRN-ErF.js";
const GIFTS = [
  { id: 1, name: "وردة", icon: "🌹", price: 10 },
  { id: 2, name: "صاروخ", icon: "🚀", price: 500 },
  { id: 3, name: "تاج", icon: "👑", price: 1e3 }
];
function LiveViewer() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();
  const { streamId } = useParams();
  const [activeStream, setActiveStream] = reactExports.useState(null);
  const [streamStats, setStreamStats] = reactExports.useState({ viewers: 0, hearts: 0, comments: 0 });
  const [comments, setComments] = reactExports.useState([]);
  const [commentText, setCommentText] = reactExports.useState("");
  const [recentGifts, setRecentGifts] = reactExports.useState([]);
  const [floatingHearts, setFloatingHearts] = reactExports.useState([]);
  const statsIntervalRef = reactExports.useRef(null);
  const commentsIntervalRef = reactExports.useRef(null);
  const loadStreamDetails = reactExports.useCallback(async () => {
    if (!streamId) return;
    try {
      const response = await getLiveStreamDetails(streamId);
      if (response?.data) {
        setActiveStream(response.data);
        setStreamStats({
          viewers: response.data.viewers_count || 0,
          hearts: response.data.hearts_count || 0,
          comments: 0
        });
      }
    } catch (error) {
      console.error("Error loading stream:", error);
      pushToast?.({ type: "warning", title: "خطأ في تحميل البث" });
    }
  }, [streamId, pushToast]);
  const loadComments = reactExports.useCallback(async () => {
    if (!streamId) return;
    try {
      const response = await getLiveComments(streamId);
      if (response?.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  }, [streamId]);
  const updateStats = reactExports.useCallback(async () => {
    if (!streamId) return;
    try {
      const response = await getStreamStats(streamId);
      if (response?.data) {
        setStreamStats((prev) => ({
          ...prev,
          viewers: response.data.viewers_count || prev.viewers,
          hearts: response.data.hearts_count || prev.hearts
        }));
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }, [streamId]);
  reactExports.useEffect(() => {
    loadStreamDetails();
    statsIntervalRef.current = setInterval(updateStats, 5e3);
    commentsIntervalRef.current = setInterval(loadComments, 3e3);
    return () => {
      clearInterval(statsIntervalRef.current);
      clearInterval(commentsIntervalRef.current);
    };
  }, [loadStreamDetails, updateStats, loadComments]);
  const handleSendComment = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !streamId) return;
    try {
      await sendLiveComment(streamId, { text: commentText });
      setCommentText("");
      loadComments();
    } catch (error) {
      pushToast?.({ type: "warning", title: "فشل إرسال التعليق" });
    }
  };
  const handleSendHeart = async () => {
    if (!streamId) return;
    try {
      await sendLiveHeart(streamId);
      const newHeart = { id: Date.now(), x: Math.random() * 80 };
      setFloatingHearts((prev) => [...prev, newHeart]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 2e3);
    } catch (error) {
      console.error("Error sending heart:", error);
    }
  };
  const handleSendGift = async (gift) => {
    if (!streamId) return;
    try {
      await sendLiveGift(streamId, { gift_id: gift.id, name: gift.name });
      const giftNotif = { id: Date.now(), user: currentUsername, gift: gift.name, icon: gift.icon };
      setRecentGifts((prev) => [giftNotif, ...prev].slice(0, 3));
      setTimeout(() => {
        setRecentGifts((prev) => prev.filter((g) => g.id !== giftNotif.id));
      }, 5e3);
      pushToast?.({ type: "success", title: "تم إرسال الهدية!" });
    } catch (error) {
      pushToast?.({ type: "warning", title: "فشل إرسال الهدية" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-container", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-video-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-live-video-placeholder", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: activeStream?.thumbnail_url || "https://via.placeholder.com/800x1200?text=Live+Stream", style: { width: "100%", height: "100%", objectFit: "cover" }, alt: "Stream" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-video-overlay", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "pro-live-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-host-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate(-1), style: { background: "none", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }, children: "✕" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-avatar-wrapper", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: activeStream?.host_avatar || "https://via.placeholder.com/100", className: "pro-live-avatar", alt: "Host" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-live-verified", children: "✓" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-host-meta", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: activeStream?.host_name || "Yamshat Official" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "@",
                activeStream?.host_username || "yamshat_team"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-badges", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-badge", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dot" }),
              " مباشر"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-viewers", children: [
              "👁 ",
              streamStats.viewers > 1e3 ? (streamStats.viewers / 1e3).toFixed(1) + "K" : streamStats.viewers
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-side-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "pro-side-btn", onClick: () => {
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-side-icon-circle", children: "🔊" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "صوت" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "pro-side-btn", onClick: handleSendHeart, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-side-icon-circle", children: "🔄" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "قلب" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "pro-side-btn", onClick: () => handleSendGift(GIFTS[2]), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-side-icon-circle", children: "🎁" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "هدايا" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-bottom-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-stream-title-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-title-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: activeStream?.title || "تصميم جديد لمنصة يمشات 🚀" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-tags", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pro-live-tag", children: "تقنية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pro-live-tag", children: "تطوير" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pro-live-tag", children: "تصميم" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", opacity: 0.8 }, children: "🔥 رائج الآن" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-chat-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-messages", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-chat-msg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pro-chat-user", children: "Yamshat Bot ✓" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pro-chat-text", children: "أهلاً وسهلاً بكم في البث المباشر 💜" })
          ] }),
          comments.map((msg, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-chat-msg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pro-chat-user", children: msg.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pro-chat-text", children: msg.text })
          ] }, i))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-live-gift-notifications", children: recentGifts.map((gift) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-gift-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "20px" }, children: gift.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "bold" }, children: gift.user }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              "أرسل ",
              gift.gift
            ] })
          ] })
        ] }, gift.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-live-input-bar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-chat-input-wrapper", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSendComment, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              className: "pro-chat-input",
              placeholder: "قل شيئاً...",
              value: commentText,
              onChange: (e) => setCommentText(e.target.value)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "pro-send-btn", children: "➤" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pro-action-icons", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "pro-icon-btn", onClick: handleSendHeart, children: "😊" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "pro-icon-btn gift", onClick: () => handleSendGift(GIFTS[0]), children: "🎁" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pro-floating-hearts-container", children: floatingHearts.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "floating-heart",
        style: {
          position: "absolute",
          bottom: 0,
          left: h.x + "%",
          fontSize: "24px",
          animation: "floatUp 2s ease-out forwards"
        },
        children: "💜"
      },
      h.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
      ` })
  ] });
}
export {
  LiveViewer as default
};
