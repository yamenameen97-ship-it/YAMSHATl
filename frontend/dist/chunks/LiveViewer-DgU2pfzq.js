import { b8 as useToast, Z as getCurrentUsername, b0 as useNavigate, b2 as useParams, aK as reactExports, ah as jsxRuntimeExports } from "../index-Dz8FA2T4.js";
import { g as getActiveLiveStreams, b as getLiveStreamDetails, a as getLiveComments, d as getLiveStreamViewers, c as getLiveStreamStats, s as sendLiveComment, f as sendLiveHeart, e as sendLiveGift } from "./liveStreamApi-DOCsImD-.js";
import "./apiClient-DEojD3jc.js";
const GIFTS = [
  { id: 1, name: "وردة", icon: "🌹", price: 10 },
  { id: 2, name: "قهوة", icon: "☕", price: 50 },
  { id: 3, name: "قلب كبير", icon: "💜", price: 100 },
  { id: 4, name: "نجمة", icon: "⭐", price: 250 },
  { id: 5, name: "تاج ملكي", icon: "👑", price: 1e3 }
];
function Avatar({ name = "", size = 42 }) {
  const colors = ["#7c3aed", "#3b82f6", "#10b981", "#f97316", "#ec4899"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        color: "white",
        fontWeight: 900,
        fontSize: size / 2.5,
        flexShrink: 0
      },
      children: name?.charAt(0).toUpperCase() || "?"
    }
  );
}
function FloatingHearts({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-floating-hearts", "aria-hidden": "true", children: items.map((heart) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "mlv-floating-heart",
      style: {
        right: `${heart.x}%`,
        animation: `mlvFloatUp 1.5s ease-out forwards`
      },
      children: heart.icon || "💜"
    },
    heart.id
  )) });
}
function LiveViewer() {
  const { pushToast } = useToast();
  getCurrentUsername();
  const navigate = useNavigate();
  const { streamId } = useParams();
  const [streams, setStreams] = reactExports.useState([]);
  const [filteredStreams, setFilteredStreams] = reactExports.useState([]);
  const [activeStream, setActiveStream] = reactExports.useState(null);
  const [filter, setFilter] = reactExports.useState("all");
  const [loading, setLoading] = reactExports.useState(false);
  const [streamDetails, setStreamDetails] = reactExports.useState(null);
  const [streamStats, setStreamStats] = reactExports.useState({
    viewers: 0,
    hearts: 0,
    comments: 0
  });
  const [comments, setComments] = reactExports.useState([]);
  const [commentText, setCommentText] = reactExports.useState("");
  const [showGiftPanel, setShowGiftPanel] = reactExports.useState(false);
  const [floatingHearts, setFloatingHearts] = reactExports.useState([]);
  const [isFollowing, setIsFollowing] = reactExports.useState(false);
  const [viewers, setViewers] = reactExports.useState([]);
  const heartTimerRef = reactExports.useRef(null);
  const statsIntervalRef = reactExports.useRef(null);
  const commentsIntervalRef = reactExports.useRef(null);
  const routeStreamId = String(streamId || "").trim();
  const loadStreams = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActiveLiveStreams({ limit: 100 });
      const allStreams = Array.isArray(response?.data) ? response.data : [];
      setStreams(allStreams);
      let filtered = allStreams;
      if (filter === "active") {
        filtered = allStreams.filter((s) => s.is_active);
      } else if (filter === "popular") {
        filtered = allStreams.filter((s) => s.is_active).sort((a, b) => (b.viewers_count || 0) - (a.viewers_count || 0));
      }
      setFilteredStreams(filtered);
    } catch (error) {
      console.error("خطأ في تحميل البثوث:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);
  const openStream = reactExports.useCallback(async (stream, options = {}) => {
    if (!stream?.id) return;
    if (options.syncUrl !== false) {
      navigate(`/live/view/${stream.id}`);
    }
    setActiveStream(stream);
    try {
      const detailsResponse = await getLiveStreamDetails(stream.id);
      if (detailsResponse?.data) {
        setStreamDetails(detailsResponse.data);
        setStreamStats({
          viewers: detailsResponse.data.viewers_count || 0,
          hearts: detailsResponse.data.hearts_count || 0,
          comments: 0
        });
      }
      const commentsResponse = await getLiveComments(stream.id);
      setComments(Array.isArray(commentsResponse?.data) ? commentsResponse.data : []);
      const viewersResponse = await getLiveStreamViewers(stream.id);
      if (viewersResponse?.data?.viewers) {
        setViewers(viewersResponse.data.viewers);
      }
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = setInterval(() => {
        updateStreamStats(stream.id);
      }, 3e3);
      if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
      commentsIntervalRef.current = setInterval(() => {
        loadComments(stream.id);
      }, 2e3);
      pushToast?.({
        type: "success",
        title: "تم الانضمام للبث",
        description: `مرحباً في بث ${stream.title}`
      });
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في فتح البث",
        description: "حاول مرة أخرى"
      });
    }
  }, [navigate, pushToast]);
  const updateStreamStats = reactExports.useCallback(async (streamId2) => {
    try {
      const response = await getLiveStreamStats(streamId2);
      if (response?.data) {
        setStreamStats((prev) => ({
          ...prev,
          viewers: response.data.viewers_count || response.data.unique_viewers || prev.viewers,
          hearts: response.data.hearts_count || prev.hearts
        }));
      }
    } catch (error) {
      console.error("خطأ في تحديث الإحصائيات:", error);
    }
  }, []);
  const loadComments = reactExports.useCallback(async (streamId2) => {
    try {
      const response = await getLiveComments(streamId2, 50);
      setComments(Array.isArray(response?.data) ? response.data : []);
      setStreamStats((prev) => ({
        ...prev,
        comments: Array.isArray(response?.data) ? response.data.length : 0
      }));
    } catch (error) {
      console.error("خطأ في تحميل التعليقات:", error);
    }
  }, []);
  const handleSendComment = reactExports.useCallback(async () => {
    if (!commentText.trim() || !activeStream?.id) return;
    try {
      await sendLiveComment(activeStream.id, {
        text: commentText
      });
      setCommentText("");
      await loadComments(activeStream.id);
      pushToast?.({
        type: "success",
        title: "تم إرسال التعليق"
      });
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في إرسال التعليق",
        description: "حاول مرة أخرى"
      });
    }
  }, [commentText, activeStream, pushToast, loadComments]);
  const handleSendHeart = reactExports.useCallback(async () => {
    if (!activeStream?.id) return;
    try {
      await sendLiveHeart(activeStream.id);
      const heart = {
        id: Date.now() + Math.random(),
        icon: "💜",
        x: Math.floor(Math.random() * 80) + 10
      };
      setFloatingHearts((prev) => [...prev.slice(-12), heart]);
      setStreamStats((prev) => ({
        ...prev,
        hearts: prev.hearts + 1
      }));
    } catch (error) {
      console.error("خطأ في إرسال القلب:", error);
    }
  }, [activeStream]);
  const handleSendGift = reactExports.useCallback(async (gift) => {
    if (!activeStream?.id || !gift) return;
    try {
      await sendLiveGift(activeStream.id, {
        gift_id: gift.id,
        name: gift.name,
        price: gift.price
      });
      pushToast?.({
        type: "success",
        title: `تم إرسال ${gift.name}`,
        description: "شكراً على الدعم!"
      });
      setShowGiftPanel(false);
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في إرسال الهدية",
        description: "حاول مرة أخرى"
      });
    }
  }, [activeStream, pushToast]);
  reactExports.useEffect(() => {
    if (floatingHearts.length === 0) return;
    if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    heartTimerRef.current = setTimeout(() => {
      setFloatingHearts((prev) => prev.slice(1));
    }, 1500);
    return () => {
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    };
  }, [floatingHearts]);
  reactExports.useEffect(() => {
    loadStreams();
  }, [loadStreams]);
  reactExports.useEffect(() => {
    if (!routeStreamId || !streams.length) return;
    const matchedStream = streams.find((stream) => String(stream.id) === routeStreamId);
    if (matchedStream && String(activeStream?.id || "") !== String(matchedStream.id)) {
      openStream(matchedStream, { syncUrl: false });
    }
  }, [routeStreamId, streams, activeStream?.id, openStream]);
  reactExports.useEffect(() => {
    let filtered = streams;
    if (filter === "active") {
      filtered = streams.filter((s) => s.is_active);
    } else if (filter === "popular") {
      filtered = streams.filter((s) => s.is_active).sort((a, b) => (b.viewers_count || 0) - (a.viewers_count || 0));
    }
    setFilteredStreams(filtered);
  }, [streams, filter]);
  reactExports.useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
    };
  }, []);
  const hostName = activeStream?.host_name || activeStream?.host_username || "مضيف البث";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modern-live-viewer", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mlv-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-header-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mlv-back-btn", onClick: () => navigate(-1), children: "<" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "البث المباشر" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-header-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mlv-refresh-btn", onClick: loadStreams, disabled: loading, children: "↻" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-container", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mlv-main", children: activeStream ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-player-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-player", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-player-placeholder", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-player-icon", children: "📺" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "بث مباشر من ",
                hostName
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: activeStream.title })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(FloatingHearts, { items: floatingHearts })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stream-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-info-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: hostName, size: 48 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-host-details", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: activeStream.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                  "المضيف: ",
                  hostName
                ] })
              ] }),
              activeStream.is_active && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-live-badge", children: "● مباشر" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stats-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stat", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-icon", children: "👁" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-value", children: streamStats.viewers }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-label", children: "مشاهد" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stat", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-icon", children: "💜" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-value", children: streamStats.hearts }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-label", children: "قلب" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stat", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-icon", children: "💬" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-value", children: streamStats.comments }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-stat-label", children: "تعليق" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-action-buttons", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "mlv-action-btn mlv-action-heart", onClick: handleSendHeart, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "💜" }),
            "إعجاب"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "mlv-action-btn mlv-action-gift", onClick: () => setShowGiftPanel(!showGiftPanel), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🎁" }),
            "هدية"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "mlv-action-btn mlv-action-share", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "↗" }),
            "مشاركة"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "mlv-action-btn mlv-action-follow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "👥" }),
            "متابعة"
          ] })
        ] }),
        showGiftPanel && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-gifts-panel", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "اختر هدية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-gifts-list", children: GIFTS.map((gift) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "mlv-gift-option",
              onClick: () => handleSendGift(gift),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-gift-icon", children: gift.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-gift-name", children: gift.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-gift-price", children: gift.price })
              ]
            },
            gift.id
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-comments-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "التعليقات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-comments-list", children: comments.length > 0 ? comments.map((comment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-comment-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: comment.username, size: 32 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-comment-content", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-comment-header", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-comment-name", children: comment.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlv-comment-time", children: "الآن" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mlv-comment-text", children: comment.text })
            ] })
          ] }, comment.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-empty-comments", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "لا توجد تعليقات حتى الآن" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-comment-input", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "أضف تعليقاً...",
                value: commentText,
                onChange: (e) => setCommentText(e.target.value),
                onKeyPress: (e) => e.key === "Enter" && handleSendComment()
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSendComment, disabled: !commentText.trim(), children: "إرسال" })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-empty-state", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-empty-icon", children: "📡" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "لا توجد بثوث نشطة حالياً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mlv-empty-subtitle", children: "تحقق لاحقاً لمتابعة البثوث المباشرة" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "mlv-sidebar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-streams-list-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "البثوث المتاحة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-filter-buttons", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: `mlv-filter-btn ${filter === "all" ? "active" : ""}`,
              onClick: () => setFilter("all"),
              children: "الكل"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: `mlv-filter-btn ${filter === "active" ? "active" : ""}`,
              onClick: () => setFilter("active"),
              children: "النشطة"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: `mlv-filter-btn ${filter === "popular" ? "active" : ""}`,
              onClick: () => setFilter("popular"),
              children: "الأكثر"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-streams-items", children: filteredStreams.length > 0 ? filteredStreams.map((stream) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: `mlv-stream-card ${activeStream?.id === stream.id ? "active" : ""}`,
            onClick: () => openStream(stream),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stream-card-header", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: stream.host_username, size: 32 }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stream-card-info", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: stream.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: stream.host_username })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlv-stream-card-stats", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "👁 ",
                  stream.viewers_count || 0
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "💜 ",
                  stream.hearts_count || 0
                ] })
              ] })
            ]
          },
          stream.id
        )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlv-empty-streams", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "لا توجد بثوث متاحة" }) }) })
      ] }) })
    ] })
  ] });
}
export {
  LiveViewer as default
};
