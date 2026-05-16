import { r as reactExports, j as jsxRuntimeExports, B as Button, t as uploadMediaWithResume, e as useToast, f as getCurrentUsername, v as getOptimizedImageUrl } from "../index-D6u1FUhW.js";
import { M as MainLayout } from "./MainLayout-Ca2z1jDa.js";
import { M as Modal } from "./Modal-TdtOGZ1q.js";
import { A as AutoSizer, F as FixedSizeList } from "./react-virtualized-auto-sizer.esm-DZJRkXMU.js";
import { g as getPosts, c as createPost, a as addComment, l as likePost, s as savePost, b as sharePost, d as getComments } from "./posts-Q6IL2Y7w.js";
import { g as getDeviceProfile, a as appendVideoQuality } from "./deviceProfile-DTy4urT5.js";
import { f as fetchSuggestedReels } from "./recommendationService-CVn5JDS5.js";
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
function VideoUploader({ onUploadComplete, onError, label = "رفع فيديو" }) {
  const [videoFile, setVideoFile] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState(0);
  const fileInputRef = reactExports.useRef(null);
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.("نوع الملف غير مدعوم. استخدم MP4 أو WebM أو MOV");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      onError?.(`حجم الملف كبير جداً. الحد الأقصى: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
      return;
    }
    setVideoFile(file);
    setUploading(true);
    setProgress(0);
    try {
      const response = await uploadMediaWithResume(file, (nextProgress) => setProgress(nextProgress));
      const payload = response?.data || {};
      onUploadComplete?.({
        file,
        url: payload.media_url || payload.url || payload.file_url,
        payload
      });
    } catch (error) {
      onError?.(error?.response?.data?.detail || error?.message || "فشل رفع الفيديو");
      setVideoFile(null);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveVideo = () => {
    setVideoFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-uploader", children: [
    videoFile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-upload-status", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-info", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "video-icon", children: "🎬" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: videoFile.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
            (videoFile.size / (1024 * 1024)).toFixed(2),
            "MB"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-progress", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill", style: { width: `${progress}%` } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "progress-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            progress,
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "رفع واستئناف حقيقي" })
        ] })
      ] }),
      !uploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: handleRemoveVideo, children: "إزالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => fileInputRef.current?.click(), children: "رفع فيديو آخر" })
      ] }) : null
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-upload-area", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upload-icon", children: "🎬" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "MP4, WebM أو MOV" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
        "الحد الأقصى: ",
        MAX_VIDEO_SIZE / (1024 * 1024),
        "MB"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => fileInputRef.current?.click(), loading: uploading, children: "اختر فيديو" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: ALLOWED_TYPES.join(","), onChange: handleFileSelect, style: { display: "none" } })
  ] });
}
const EMOJIS = ["❤️", "🔥", "😂", "👏", "😮", "💯"];
function enrichMentions(text = "") {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith("@")) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "var(--primary)", fontWeight: 700 }, children: part }, index);
    return part;
  });
}
function countReactions(reactions = {}) {
  return Object.values(reactions).reduce((sum, value) => sum + Number(value || 0), 0);
}
const CommentRow = ({ index, style, data }) => {
  const { items, onReply, onReact } = data;
  const item = items[index];
  if (!item) return null;
  const totalReactions = countReactions(item.reactions);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, padding: "10px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `comment-card-shell ${item.optimistic ? "optimistic" : ""} ${item.justArrived ? "live" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.username || item.user || "مستخدم" }),
        item.optimistic ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill pending", children: "قيد الإرسال" }) : null,
        item.justArrived ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill live", children: "وصل الآن" }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 12 }, children: item.created_at ? new Date(item.created_at).toLocaleString("ar-EG") : "الآن" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { lineHeight: 1.8, fontSize: 14 }, children: enrichMentions(item.content || item.text || item.comment || "") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-toolbar-row", style: { marginTop: 8 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: EMOJIS.map((emoji) => {
        const count = Number(item.reactions?.[emoji] || 0);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "comment-emoji-btn", onClick: () => onReact(item.id, emoji), children: [
          emoji,
          " ",
          count ? count : ""
        ] }, emoji);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", style: { fontSize: 11 }, children: [
          "التفاعلات ",
          totalReactions
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", style: { fontSize: 11 }, children: "رد" })
      ] })
    ] })
  ] }) });
};
function NestedComments({ comments = [], onAddComment, onReply, onToggleReaction }) {
  const [commentText, setCommentText] = reactExports.useState("");
  const [sortBy, setSortBy] = reactExports.useState("newest");
  const sortedComments = reactExports.useMemo(() => {
    const items = [...comments];
    items.sort((a, b) => {
      if (sortBy === "popular") return countReactions(b.reactions) - countReactions(a.reactions);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    return items;
  }, [comments, sortBy]);
  const listData = reactExports.useMemo(() => ({
    items: sortedComments,
    onReply,
    onReact: onToggleReaction
  }), [sortedComments, onReply, onToggleReaction]);
  const pendingCount = comments.filter((item) => item.optimistic).length;
  comments.filter((item) => item.justArrived).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", height: "100%", gap: 16 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comments-head-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { style: { margin: 0 }, children: [
        "التعليقات (",
        comments.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comments-badges-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "comment-summary-pill live", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "live-mini-dot" }),
          "Realtime"
        ] }),
        pendingCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-summary-pill pending", children: pendingCount }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, minHeight: 300 }, children: sortedComments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted text-center py-10", children: "لا توجد تعليقات بعد." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      FixedSizeList,
      {
        height,
        width,
        itemCount: sortedComments.length,
        itemSize: 140,
        itemData: listData,
        className: "no-scrollbar",
        children: CommentRow
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-composer-shell", style: { marginTop: "auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          placeholder: "اكتب تعليقك...",
          value: commentText,
          onChange: (event) => setCommentText(event.target.value),
          rows: 2,
          style: { width: "100%", borderRadius: 16, padding: 12, fontSize: 14 }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 4 }, children: EMOJIS.slice(0, 4).map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-emoji-btn", onClick: () => setCommentText((prev) => `${prev}${emoji}`), children: emoji }, emoji)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => {
          if (!commentText.trim()) return;
          onAddComment({ content: commentText.trim() });
          setCommentText("");
        }, children: "نشر" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .comment-composer-shell,
        .comment-card-shell {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.05);
          border-radius: 18px;
          padding: 14px;
        }
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .comment-state-pill,
        .comment-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .comment-summary-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }
        .live-mini-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: comment-live-pulse 1.5s infinite;
        }
        @keyframes comment-live-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` })
  ] });
}
function computeReelScore(item) {
  const likes = Number(item.likes_count || 0);
  const comments = Number(item.comments_count || 0);
  const shares = Number(item.share_count || 0);
  const saves = Number(item.saved_count || 0);
  const freshnessHours = Math.max(1, (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 36e5);
  return likes * 2 + comments * 3 + shares * 4 + saves * 4 + 96 / freshnessHours;
}
function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(url);
}
function getPosterUrl(reel) {
  const source = reel.thumbnail_url || reel.image_url || reel.preview_url || "";
  return source ? getOptimizedImageUrl(source, 720, 74) : "";
}
function getAdaptiveVideoSrc(reel, profile, active = false) {
  const quality = active ? profile.preferredVideoQuality : profile.isLowEndDevice ? "low" : "medium";
  return appendVideoQuality(reel.media_url || reel.video_url || "", quality);
}
const ReelItem = ({ index, style, data }) => {
  const { reels, activeIndex, setVideoRef, handleLike, openComments, handleSave, handleShare, busyId, heartBurstId, currentUser } = data;
  const reel = reels[index];
  const isActive = index === activeIndex;
  const videoRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    setVideoRef(index, videoRef.current);
    return () => setVideoRef(index, null);
  }, [index, setVideoRef]);
  if (!reel) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style, className: "reel-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-card relative bg-black overflow-hidden h-full w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "video",
      {
        ref: videoRef,
        className: "w-full h-full object-cover",
        loop: true,
        playsInline: true,
        muted: !isActive,
        poster: getPosterUrl(reel),
        onClick: () => {
          if (videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
          }
        },
        onDoubleClick: () => handleLike(reel, { burst: true })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2 pointer-events-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: getOptimizedImageUrl(reel.user_avatar, 80), alt: "", className: "w-full h-full object-cover" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-sm", children: [
          "@",
          reel.username
        ] }),
        reel.username !== currentUser && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors", children: "متابعة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm line-clamp-2 mb-2 pointer-events-auto", children: reel.content })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => handleLike(reel),
            disabled: busyId === `like-${reel.id}`,
            className: `p-3 rounded-full transition-all transform active:scale-90 ${reel.is_liked ? "text-red-500 bg-red-500/10" : "text-white bg-white/10"}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-7 h-7", fill: reel.is_liked ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-xs font-medium", children: reel.likes_count || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => openComments(reel),
            className: "p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-7 h-7", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-xs font-medium", children: reel.comments_count || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => handleSave(reel),
          disabled: busyId === `save-${reel.id}`,
          className: `p-3 rounded-full transition-all ${reel.is_saved ? "text-yellow-500 bg-yellow-500/10" : "text-white bg-white/10"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-7 h-7", fill: reel.is_saved ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" }) })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => handleShare(reel),
          className: "p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-7 h-7", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" }) })
        }
      )
    ] }),
    heartBurstId === String(reel.id) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none z-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-ping", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-24 h-24 text-red-500", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }) })
  ] }) });
};
function ReelsPage() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const listRef = reactExports.useRef(null);
  const videoRefs = reactExports.useRef(/* @__PURE__ */ new Map());
  const viewTimersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const preloadNodesRef = reactExports.useRef([]);
  const viewedReelsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const [reels, setReels] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [activeIndex, setActiveIndex] = reactExports.useState(0);
  const [heartBurstId, setHeartBurstId] = reactExports.useState("");
  const [showUploadModal, setShowUploadModal] = reactExports.useState(false);
  const [showCommentsModal, setShowCommentsModal] = reactExports.useState(false);
  const [activeReel, setActiveReel] = reactExports.useState(null);
  const [activeComments, setActiveComments] = reactExports.useState([]);
  const [busyId, setBusyId] = reactExports.useState("");
  const [uploadState, setUploadState] = reactExports.useState({ mediaUrl: "", uploading: false, content: "" });
  const deviceProfile = reactExports.useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.isLowEndDevice ? 1 : 2;
  const loadReels = reactExports.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getPosts({ limit: 40, page: 1 });
      const source = Array.isArray(data) ? data : data?.items || [];
      const onlyVideos = source.filter((post) => isVideoUrl(post?.media_url || post?.video_url || "")).map((item) => ({
        ...item,
        media_url: item.media_url || item.video_url,
        recommendation_score: computeReelScore(item),
        views_count: Number(item.views_count || item.view_count || 0),
        poster_url: getPosterUrl(item),
        duration_label: item.duration_label || item.duration || ""
      }));
      const rankedReels = await fetchSuggestedReels(onlyVideos);
      setReels(rankedReels);
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحميل الريلز", description: error?.message });
    } finally {
      setIsLoading(false);
    }
  }, [pushToast]);
  reactExports.useEffect(() => {
    loadReels();
  }, [loadReels]);
  reactExports.useEffect(() => {
    preloadNodesRef.current.forEach((node) => node.remove?.());
    preloadNodesRef.current = [];
    const nextItems = reels.slice(activeIndex + 1, activeIndex + 1 + preloadRange);
    nextItems.forEach((reel) => {
      const href = getAdaptiveVideoSrc(reel, deviceProfile, false);
      if (!href) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = href;
      document.head.appendChild(link);
      preloadNodesRef.current.push(link);
    });
    return () => {
      preloadNodesRef.current.forEach((node) => node.remove?.());
    };
  }, [activeIndex, deviceProfile, reels, preloadRange]);
  reactExports.useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      const isPreload = Math.abs(index - activeIndex) <= preloadRange;
      const reel = reels[index];
      if (!isPreload) {
        video.pause();
        video.src = "";
        video.load();
        video.removeAttribute("src");
        video.preload = "none";
      } else if (reel) {
        const src = getAdaptiveVideoSrc(reel, deviceProfile, index === activeIndex);
        if (video.src !== src) {
          video.src = src;
          video.load();
        }
        video.preload = index === activeIndex ? "auto" : "metadata";
        if (index === activeIndex) {
          video.play().catch(() => {
          });
        } else {
          video.pause();
        }
      }
    });
    const activeReelItem = reels[activeIndex];
    if (activeReelItem) {
      const timerKey = String(activeReelItem.id);
      if (viewTimersRef.current.has(timerKey)) clearTimeout(viewTimersRef.current.get(timerKey));
      if (!viewedReelsRef.current.has(timerKey)) {
        const timer = setTimeout(() => {
          viewedReelsRef.current.add(timerKey);
        }, 2e3);
        viewTimersRef.current.set(timerKey, timer);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex, reels, deviceProfile, preloadRange]);
  const setVideoRef = reactExports.useCallback((index, node) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);
  const handleScroll = reactExports.useCallback(({ startIndex }) => {
    if (startIndex !== activeIndex) {
      setActiveIndex(startIndex);
    }
  }, [activeIndex]);
  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      setTimeout(() => setHeartBurstId(""), 650);
    }
    const originalReels = [...reels];
    setReels((prev) => prev.map((r) => r.id === reel.id ? {
      ...r,
      is_liked: !r.is_liked,
      likes_count: r.is_liked ? r.likes_count - 1 : r.likes_count + 1
    } : r));
    try {
      await likePost(reel.id);
    } catch (error) {
      setReels(originalReels);
      pushToast({ type: "error", title: "خطأ", description: "تعذر تحديث الإعجاب" });
    }
  };
  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, is_saved: !r.is_saved } : r));
    try {
      await savePost(reel.id);
    } catch (error) {
      setReels(originalReels);
      pushToast({ type: "error", title: "خطأ", description: "تعذر حفظ الريل" });
    }
  };
  const handleShare = async (reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
      pushToast({ type: "success", title: "تم نسخ الرابط" });
      await sharePost(reel.id, "copy");
    } catch (e) {
    }
  };
  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    try {
      const { data } = await getComments(reel.id);
      setActiveComments(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
    }
  };
  const listData = reactExports.useMemo(() => ({
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    busyId,
    heartBurstId,
    currentUser
  }), [reels, activeIndex, setVideoRef, busyId, heartBurstId, currentUser]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { hideNav: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen bg-black flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-white font-bold text-xl", children: "Reels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowUploadModal(true),
            className: "bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-all",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 4v16m8-8H4" }) })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center bg-black", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        FixedSizeList,
        {
          ref: listRef,
          height,
          width,
          itemCount: reels.length,
          itemSize: height,
          onItemsRendered: ({ visibleStartIndex }) => handleScroll({ startIndex: visibleStartIndex }),
          itemData: listData,
          className: "no-scrollbar",
          children: ReelItem
        }
      ) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showUploadModal, onClose: () => setShowUploadModal(false), title: "إضافة ريل جديد", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 14 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: uploadState.content,
            onChange: (event) => setUploadState((prev) => ({ ...prev, content: event.target.value })),
            rows: 4,
            placeholder: "وصف الريل أو الكابشن",
            style: { width: "100%", borderRadius: 14, padding: 12 }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          VideoUploader,
          {
            onUploadComplete: async ({ url }) => {
              try {
                setUploadState((prev) => ({ ...prev, uploading: true, mediaUrl: url || "" }));
                await createPost({
                  content: uploadState.content?.trim() || "ريل جديد",
                  media_url: url || "",
                  media: url || "",
                  media_urls: url ? [url] : []
                });
                setShowUploadModal(false);
                setUploadState({ mediaUrl: "", uploading: false, content: "" });
                await loadReels();
                pushToast({ type: "success", title: "تم رفع الريل ونشره بنجاح" });
              } catch (error) {
                setUploadState((prev) => ({ ...prev, uploading: false }));
                pushToast({ type: "error", title: "فشل نشر الريل", description: error?.response?.data?.detail || error?.message });
              }
            },
            onError: (message) => pushToast({ type: "error", title: "فشل رفع الفيديو", description: message })
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showCommentsModal, onClose: () => setShowCommentsModal(false), title: "التعليقات", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[70vh] overflow-y-auto p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        NestedComments,
        {
          comments: activeComments,
          onAddComment: async (content) => {
            const { data } = await addComment(activeReel.id, content);
            setActiveComments((prev) => [data, ...prev]);
          }
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .reel-container { scroll-snap-align: start; }
      ` })
  ] });
}
export {
  ReelsPage as default
};
