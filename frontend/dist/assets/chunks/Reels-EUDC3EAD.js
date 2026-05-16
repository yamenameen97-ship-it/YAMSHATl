import {
  AutoSizer,
  FixedSizeList
} from "./chunk-U2HBZFH7.js";
import {
  fetchSuggestedReels
} from "./chunk-LADVLV2U.js";
import {
  MainLayout
} from "./chunk-ZOZSORVL.js";
import {
  getOptimizedImageUrl
} from "./chunk-A6DTRSIG.js";
import "./chunk-AB4CHF2R.js";
import {
  appendVideoQuality,
  getDeviceProfile
} from "./chunk-TTTTPZJD.js";
import {
  addComment,
  createPost,
  getComments,
  getPosts,
  likePost,
  savePost,
  sharePost
} from "./chunk-QYGJVHBV.js";
import {
  Modal
} from "./chunk-ERP4JHH7.js";
import {
  useToast
} from "./chunk-OIWCOE6H.js";
import {
  uploadMediaWithResume
} from "./chunk-HHMVNFXU.js";
import "./chunk-JSOE33EX.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  getCurrentUsername
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Reels.jsx
init_define_import_meta_env();
var import_react3 = __toESM(require_react(), 1);

// src/components/upload/VideoUploader.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var MAX_VIDEO_SIZE = 500 * 1024 * 1024;
var ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
function VideoUploader({ onUploadComplete, onError, label = "\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648" }) {
  const [videoFile, setVideoFile] = (0, import_react.useState)(null);
  const [uploading, setUploading] = (0, import_react.useState)(false);
  const [progress, setProgress] = (0, import_react.useState)(0);
  const fileInputRef = (0, import_react.useRef)(null);
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.("\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645. \u0627\u0633\u062A\u062E\u062F\u0645 MP4 \u0623\u0648 WebM \u0623\u0648 MOV");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      onError?.(`\u062D\u062C\u0645 \u0627\u0644\u0645\u0644\u0641 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B. \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
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
      onError?.(error?.response?.data?.detail || error?.message || "\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648");
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "video-uploader", children: [
    videoFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "video-upload-status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "video-info", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "video-icon", children: "\u{1F3AC}" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: videoFile.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", children: [
            (videoFile.size / (1024 * 1024)).toFixed(2),
            "MB"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "upload-progress", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "progress-bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "progress-fill", style: { width: `${progress}%` } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "progress-info", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            progress,
            "%"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: "\u0631\u0641\u0639 \u0648\u0627\u0633\u062A\u0626\u0646\u0627\u0641 \u062D\u0642\u064A\u0642\u064A" })
        ] })
      ] }),
      !uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "upload-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: handleRemoveVideo, children: "\u0625\u0632\u0627\u0644\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: () => fileInputRef.current?.click(), children: "\u0631\u0641\u0639 \u0641\u064A\u062F\u064A\u0648 \u0622\u062E\u0631" })
      ] }) : null
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "video-upload-area", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "upload-icon", children: "\u{1F3AC}" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", children: "MP4, WebM \u0623\u0648 MOV" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "muted", children: [
        "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649: ",
        MAX_VIDEO_SIZE / (1024 * 1024),
        "MB"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => fileInputRef.current?.click(), loading: uploading, children: "\u0627\u062E\u062A\u0631 \u0641\u064A\u062F\u064A\u0648" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: fileInputRef, type: "file", accept: ALLOWED_TYPES.join(","), onChange: handleFileSelect, style: { display: "none" } })
  ] });
}

// src/components/feed/NestedComments.jsx
init_define_import_meta_env();
var import_react2 = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var EMOJIS = ["\u2764\uFE0F", "\u{1F525}", "\u{1F602}", "\u{1F44F}", "\u{1F62E}", "\u{1F4AF}"];
function enrichMentions(text = "") {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith("@")) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: "var(--primary)", fontWeight: 700 }, children: part }, index);
    return part;
  });
}
function countReactions(reactions = {}) {
  return Object.values(reactions).reduce((sum, value) => sum + Number(value || 0), 0);
}
var CommentRow = ({ index, style, data }) => {
  const { items, onReply, onReact } = data;
  const item = items[index];
  if (!item) return null;
  const totalReactions = countReactions(item.reactions);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { ...style, padding: "10px" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `comment-card-shell ${item.optimistic ? "optimistic" : ""} ${item.justArrived ? "live" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: item.username || item.user || "\u0645\u0633\u062A\u062E\u062F\u0645" }),
        item.optimistic ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "comment-state-pill pending", children: "\u0642\u064A\u062F \u0627\u0644\u0625\u0631\u0633\u0627\u0644" }) : null,
        item.justArrived ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "comment-state-pill live", children: "\u0648\u0635\u0644 \u0627\u0644\u0622\u0646" }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "muted", style: { fontSize: 12 }, children: item.created_at ? new Date(item.created_at).toLocaleString("ar-EG") : "\u0627\u0644\u0622\u0646" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { lineHeight: 1.8, fontSize: 14 }, children: enrichMentions(item.content || item.text || item.comment || "") }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "comment-toolbar-row", style: { marginTop: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: EMOJIS.map((emoji) => {
        const count = Number(item.reactions?.[emoji] || 0);
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "comment-emoji-btn", onClick: () => onReact(item.id, emoji), children: [
          emoji,
          " ",
          count ? count : ""
        ] }, emoji);
      }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "muted", style: { fontSize: 11 }, children: [
          "\u0627\u0644\u062A\u0641\u0627\u0639\u0644\u0627\u062A ",
          totalReactions
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "comment-link-btn", style: { fontSize: 11 }, children: "\u0631\u062F" })
      ] })
    ] })
  ] }) });
};
function NestedComments({ comments = [], onAddComment, onReply, onToggleReaction }) {
  const [commentText, setCommentText] = (0, import_react2.useState)("");
  const [sortBy, setSortBy] = (0, import_react2.useState)("newest");
  const sortedComments = (0, import_react2.useMemo)(() => {
    const items = [...comments];
    items.sort((a, b) => {
      if (sortBy === "popular") return countReactions(b.reactions) - countReactions(a.reactions);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    return items;
  }, [comments, sortBy]);
  const listData = (0, import_react2.useMemo)(() => ({
    items: sortedComments,
    onReply,
    onReact: onToggleReaction
  }), [sortedComments, onReply, onToggleReaction]);
  const pendingCount = comments.filter((item) => item.optimistic).length;
  const liveCount = comments.filter((item) => item.justArrived).length;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%", gap: 16 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "comments-head-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { style: { margin: 0 }, children: [
        "\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A (",
        comments.length,
        ")"
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "comments-badges-wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "comment-summary-pill live", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "live-mini-dot" }),
          "Realtime"
        ] }),
        pendingCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "comment-summary-pill pending", children: pendingCount }) : null
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { flex: 1, minHeight: 300 }, children: sortedComments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "muted text-center py-10", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0628\u0639\u062F." }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "comment-composer-shell", style: { marginTop: "auto" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "textarea",
        {
          placeholder: "\u0627\u0643\u062A\u0628 \u062A\u0639\u0644\u064A\u0642\u0643...",
          value: commentText,
          onChange: (event) => setCommentText(event.target.value),
          rows: 2,
          style: { width: "100%", borderRadius: 16, padding: 12, fontSize: 14 }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", gap: 4 }, children: EMOJIS.slice(0, 4).map((emoji) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "comment-emoji-btn", onClick: () => setCommentText((prev) => `${prev}${emoji}`), children: emoji }, emoji)) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Button, { size: "sm", onClick: () => {
          if (!commentText.trim()) return;
          onAddComment({ content: commentText.trim() });
          setCommentText("");
        }, children: "\u0646\u0634\u0631" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: `
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

// src/pages/Reels.jsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
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
var ReelItem = ({ index, style, data }) => {
  const { reels, activeIndex, setVideoRef, handleLike, openComments, handleSave, handleShare, busyId, heartBurstId, currentUser } = data;
  const reel = reels[index];
  const isActive = index === activeIndex;
  const videoRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    setVideoRef(index, videoRef.current);
    return () => setVideoRef(index, null);
  }, [index, setVideoRef]);
  if (!reel) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style, className: "reel-container", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "reel-card relative bg-black overflow-hidden h-full w-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white pointer-events-none", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-3 mb-2 pointer-events-auto", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("img", { src: getOptimizedImageUrl(reel.user_avatar, 80), alt: "", className: "w-full h-full object-cover" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "font-bold text-sm", children: [
          "@",
          reel.username
        ] }),
        reel.username !== currentUser && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors", children: "\u0645\u062A\u0627\u0628\u0639\u0629" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm line-clamp-2 mb-2 pointer-events-auto", children: reel.content })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            onClick: () => handleLike(reel),
            disabled: busyId === `like-${reel.id}`,
            className: `p-3 rounded-full transition-all transform active:scale-90 ${reel.is_liked ? "text-red-500 bg-red-500/10" : "text-white bg-white/10"}`,
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { className: "w-7 h-7", fill: reel.is_liked ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-white text-xs font-medium", children: reel.likes_count || 0 })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            onClick: () => openComments(reel),
            className: "p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { className: "w-7 h-7", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-white text-xs font-medium", children: reel.comments_count || 0 })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "flex flex-col items-center gap-1", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          onClick: () => handleSave(reel),
          disabled: busyId === `save-${reel.id}`,
          className: `p-3 rounded-full transition-all ${reel.is_saved ? "text-yellow-500 bg-yellow-500/10" : "text-white bg-white/10"}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { className: "w-7 h-7", fill: reel.is_saved ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" }) })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          onClick: () => handleShare(reel),
          className: "p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
          children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { className: "w-7 h-7", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" }) })
        }
      )
    ] }),
    heartBurstId === String(reel.id) && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none z-50", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "animate-ping", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { className: "w-24 h-24 text-red-500", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }) })
  ] }) });
};
function ReelsPage() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const listRef = (0, import_react3.useRef)(null);
  const videoRefs = (0, import_react3.useRef)(/* @__PURE__ */ new Map());
  const viewTimersRef = (0, import_react3.useRef)(/* @__PURE__ */ new Map());
  const preloadNodesRef = (0, import_react3.useRef)([]);
  const viewedReelsRef = (0, import_react3.useRef)(/* @__PURE__ */ new Set());
  const [reels, setReels] = (0, import_react3.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react3.useState)(true);
  const [activeIndex, setActiveIndex] = (0, import_react3.useState)(0);
  const [heartBurstId, setHeartBurstId] = (0, import_react3.useState)("");
  const [showUploadModal, setShowUploadModal] = (0, import_react3.useState)(false);
  const [showCommentsModal, setShowCommentsModal] = (0, import_react3.useState)(false);
  const [activeReel, setActiveReel] = (0, import_react3.useState)(null);
  const [activeComments, setActiveComments] = (0, import_react3.useState)([]);
  const [busyId, setBusyId] = (0, import_react3.useState)("");
  const [uploadState, setUploadState] = (0, import_react3.useState)({ mediaUrl: "", uploading: false, content: "" });
  const deviceProfile = (0, import_react3.useMemo)(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.isLowEndDevice ? 1 : 2;
  const loadReels = (0, import_react3.useCallback)(async () => {
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
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0631\u064A\u0644\u0632", description: error?.message });
    } finally {
      setIsLoading(false);
    }
  }, [pushToast]);
  (0, import_react3.useEffect)(() => {
    loadReels();
  }, [loadReels]);
  (0, import_react3.useEffect)(() => {
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
  (0, import_react3.useEffect)(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      const isVisible = Math.abs(index - activeIndex) <= 1;
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
  const setVideoRef = (0, import_react3.useCallback)((index, node) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);
  const handleScroll = (0, import_react3.useCallback)(({ startIndex }) => {
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
      pushToast({ type: "error", title: "\u062E\u0637\u0623", description: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0639\u062C\u0627\u0628" });
    }
  };
  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, is_saved: !r.is_saved } : r));
    try {
      await savePost(reel.id);
    } catch (error) {
      setReels(originalReels);
      pushToast({ type: "error", title: "\u062E\u0637\u0623", description: "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u0631\u064A\u0644" });
    }
  };
  const handleShare = async (reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
      pushToast({ type: "success", title: "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637" });
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
  const listData = (0, import_react3.useMemo)(() => ({
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(MainLayout, { hideNav: true, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "h-screen bg-black flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { className: "text-white font-bold text-xl", children: "Reels" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            onClick: () => setShowUploadModal(true),
            className: "bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-all",
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 4v16m8-8H4" }) })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "flex-1", children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "h-full flex items-center justify-center bg-black", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Modal, { isOpen: showUploadModal, onClose: () => setShowUploadModal(false), title: "\u0625\u0636\u0627\u0641\u0629 \u0631\u064A\u0644 \u062C\u062F\u064A\u062F", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "grid", gap: 14 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "textarea",
          {
            value: uploadState.content,
            onChange: (event) => setUploadState((prev) => ({ ...prev, content: event.target.value })),
            rows: 4,
            placeholder: "\u0648\u0635\u0641 \u0627\u0644\u0631\u064A\u0644 \u0623\u0648 \u0627\u0644\u0643\u0627\u0628\u0634\u0646",
            style: { width: "100%", borderRadius: 14, padding: 12 }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          VideoUploader,
          {
            onUploadComplete: async ({ url }) => {
              try {
                setUploadState((prev) => ({ ...prev, uploading: true, mediaUrl: url || "" }));
                await createPost({
                  content: uploadState.content?.trim() || "\u0631\u064A\u0644 \u062C\u062F\u064A\u062F",
                  media_url: url || "",
                  media: url || "",
                  media_urls: url ? [url] : []
                });
                setShowUploadModal(false);
                setUploadState({ mediaUrl: "", uploading: false, content: "" });
                await loadReels();
                pushToast({ type: "success", title: "\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0631\u064A\u0644 \u0648\u0646\u0634\u0631\u0647 \u0628\u0646\u062C\u0627\u062D" });
              } catch (error) {
                setUploadState((prev) => ({ ...prev, uploading: false }));
                pushToast({ type: "error", title: "\u0641\u0634\u0644 \u0646\u0634\u0631 \u0627\u0644\u0631\u064A\u0644", description: error?.response?.data?.detail || error?.message });
              }
            },
            onError: (message) => pushToast({ type: "error", title: "\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648", description: message })
          }
        )
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Modal, { isOpen: showCommentsModal, onClose: () => setShowCommentsModal(false), title: "\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "max-h-[70vh] overflow-y-auto p-4", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .reel-container { scroll-snap-align: start; }
      ` })
  ] });
}
export {
  ReelsPage as default
};
