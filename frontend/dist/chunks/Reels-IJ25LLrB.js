import { r as reactExports, j as jsxRuntimeExports, B as Button, y as uploadMediaWithResume, e as useToast, f as getCurrentUsername, u as useNavigate, a as useLocation, z as getOptimizedImageUrl } from "../index-DuXBJv5q.js";
import { M as MainLayout } from "./MainLayout-CsZ3tvBx.js";
import { M as Modal } from "./Modal-DM4_qhBh.js";
import { A as AutoSizer, F as FixedSizeList } from "./react-virtualized-auto-sizer.esm-DKGCxiTv.js";
import { g as getPosts, a as addComment, l as likePost, s as savePost, b as sharePost, c as getComments, e as createPost } from "./posts-1f9mZwS7.js";
import { g as getDeviceProfile, a as appendVideoQuality } from "./deviceProfile-DTy4urT5.js";
import { f as fetchSuggestedReels } from "./recommendationService-CaN6KIfu.js";
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
function formatSize(size = 0) {
  return `${(size / (1024 * 1024)).toFixed(2)}MB`;
}
function VideoUploader({ onUploadComplete, onError, label = "رفع فيديو الريل" }) {
  const [videoFile, setVideoFile] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState(0);
  const [previewUrl, setPreviewUrl] = reactExports.useState("");
  const fileInputRef = reactExports.useRef(null);
  const acceptedText = reactExports.useMemo(() => "MP4, WebM أو MOV", []);
  const resetLocalState = () => {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
      }
    }
    setVideoFile(null);
    setUploading(false);
    setProgress(0);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
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
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
      }
    }
    const nextPreviewUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setPreviewUrl(nextPreviewUrl);
    setUploading(true);
    setProgress(0);
    try {
      const response = await uploadMediaWithResume(file, (nextProgress) => setProgress(Number(nextProgress || 0)));
      const payload = response?.data || {};
      onUploadComplete?.({
        file,
        previewUrl: nextPreviewUrl,
        url: payload.media_url || payload.url || payload.file_url,
        payload
      });
    } catch (error) {
      onError?.(error?.response?.data?.detail || error?.message || "فشل رفع الفيديو");
      resetLocalState();
    } finally {
      setUploading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-uploader-shell", children: [
    videoFile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-upload-status", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "video-preview-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: previewUrl, controls: true, playsInline: true, className: "video-preview-player" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-info-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: videoFile.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: formatSize(videoFile.size) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `upload-state-pill ${uploading ? "busy" : "done"}`, children: uploading ? "جارٍ رفع الفيديو..." : "تم رفع الفيديو" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-progress", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill", style: { width: `${Math.min(progress, 100)}%` } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "progress-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            Math.min(progress, 100),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "رفع حقيقي مع استئناف" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => fileInputRef.current?.click(), loading: uploading, children: "استبدال الفيديو" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: resetLocalState, disabled: uploading, children: "إزالة" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-upload-area", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upload-icon", children: "🎬" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "upload-title", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "اسحب الفيديو هنا أو اختره من الجهاز" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: acceptedText }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
        "الحد الأقصى: ",
        MAX_VIDEO_SIZE / (1024 * 1024),
        "MB"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => fileInputRef.current?.click(), loading: uploading, children: "اختيار فيديو الريل" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: ALLOWED_TYPES.join(","),
        onChange: handleFileSelect,
        style: { display: "none" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .video-uploader-shell {
          display: grid;
          gap: 12px;
        }
        .video-upload-status,
        .video-upload-area {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.66);
        }
        .video-upload-area {
          text-align: center;
          justify-items: center;
          padding: 20px 16px;
        }
        .upload-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16));
          font-size: 28px;
        }
        .upload-title {
          font-weight: 800;
          color: #fff;
          margin: 0;
        }
        .video-preview-card {
          border-radius: 18px;
          overflow: hidden;
          background: #020617;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .video-preview-player {
          width: 100%;
          max-height: 320px;
          display: block;
          background: #000;
        }
        .video-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          color: #fff;
        }
        .upload-state-pill {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          background: rgba(34,197,94,0.16);
          color: #86efac;
        }
        .upload-state-pill.busy {
          background: rgba(59,130,246,0.16);
          color: #93c5fd;
        }
        .muted {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
        }
        .upload-progress {
          display: grid;
          gap: 8px;
        }
        .progress-bar {
          height: 10px;
          border-radius: 999px;
          background: rgba(148,163,184,0.18);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #3b82f6);
          transition: width 160ms ease;
        }
        .progress-info,
        .upload-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
      ` })
  ] });
}
const EMOJIS = ["❤️", "🔥", "😂", "👏", "😮", "💯"];
function enrichMentions(text = "") {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith("@")) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "var(--primary)", fontWeight: 700 }, children: part }, index);
    if (part.startsWith("#")) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "var(--accent)", fontWeight: 700 }, children: part }, index);
    return part;
  });
}
function flattenComments(items = [], depth = 0, result = []) {
  items.forEach((item) => {
    result.push({ ...item, depth });
    if (Array.isArray(item?.replies) && item.replies.length) {
      flattenComments(item.replies, depth + 1, result);
    }
  });
  return result;
}
const CommentRow = ({ index, style, data }) => {
  const {
    items,
    replyState,
    editState,
    onReplyStateChange,
    onEditStateChange,
    onReplySubmit,
    onEditSubmit,
    onLike,
    onPin,
    onHide,
    onReport,
    onDelete,
    onCopy,
    onReact
  } = data;
  const item = items[index];
  if (!item) return null;
  const replyText = replyState[item.id] || "";
  const editText = editState[item.id] ?? item.content ?? "";
  const totalReactions = Object.values(item.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const isEditing = typeof editState[item.id] === "string";
  const isReplying = typeof replyState[item.id] === "string";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, padding: "10px 8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `comment-card-shell ${item.optimistic ? "optimistic" : ""} ${item.justArrived ? "live" : ""} ${item.is_hidden ? "is-hidden" : ""}`,
      style: { marginInlineStart: `${Math.min(item.depth || 0, 5) * 18}px` },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-top-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.username || item.user || "مستخدم" }),
            item.is_pinned ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill pinned", children: "📌 مثبت" }) : null,
            item.optimistic ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill pending", children: "قيد الإرسال" }) : null,
            item.justArrived ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill live", children: "الآن" }) : null,
            item.is_hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill muted", children: "مخفي" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 12 }, children: item.created_at ? new Date(item.created_at).toLocaleString("ar-EG") : "الآن" })
        ] }),
        isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: editText, onChange: (event) => onEditStateChange(item.id, event.target.value), rows: 3, style: { width: "100%", borderRadius: 12, padding: 10 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => onEditSubmit(item.id, editText), children: "حفظ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => onEditStateChange(item.id, null), children: "إلغاء" })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { lineHeight: 1.8, fontSize: 14, marginTop: 8 }, children: item.is_hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "هذا التعليق مخفي." }) : enrichMentions(item.content || item.text || item.comment || "") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-toolbar-row", style: { marginTop: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: EMOJIS.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "comment-emoji-btn", onClick: () => onReact?.(item.id, emoji), children: [
            emoji,
            " ",
            Number(item.reactions?.[emoji] || 0) || ""
          ] }, emoji)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "comment-link-btn", onClick: () => onLike?.(item.id), children: [
              item.is_liked ? "💙" : "🤍",
              " ",
              item.likes_count || 0
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onReplyStateChange(item.id, isReplying ? null : ""), children: "رد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onEditStateChange(item.id, item.content || ""), children: "تعديل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onPin?.(item.id, !item.is_pinned), children: item.is_pinned ? "إلغاء التثبيت" : "تثبيت" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onHide?.(item.id, !item.is_hidden), children: item.is_hidden ? "إظهار" : "إخفاء" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onCopy?.(item), children: "نسخ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onReport?.(item.id), children: "إبلاغ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn danger", onClick: () => onDelete?.(item.id), children: "حذف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", style: { fontSize: 11 }, children: [
              "إجمالي التفاعل ",
              totalReactions
            ] })
          ] })
        ] }),
        isReplying ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8, marginTop: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: replyText, onChange: (event) => onReplyStateChange(item.id, event.target.value), rows: 2, placeholder: `رد على @${item.username || "user"}`, style: { width: "100%", borderRadius: 12, padding: 10 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => onReplySubmit(item.id, replyText), children: "إرسال الرد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => onReplyStateChange(item.id, null), children: "إلغاء" })
          ] })
        ] }) : null
      ]
    }
  ) });
};
function NestedComments({
  comments = [],
  pagination = null,
  sortBy = "newest",
  loadingMore = false,
  onSortChange,
  onLoadMore,
  onAddComment,
  onReply,
  onToggleReaction,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onPinComment,
  onHideComment,
  onReportComment,
  onCopyComment
}) {
  const [commentText, setCommentText] = reactExports.useState("");
  const [replyDrafts, setReplyDrafts] = reactExports.useState({});
  const [editDrafts, setEditDrafts] = reactExports.useState({});
  const flatComments = reactExports.useMemo(() => flattenComments(comments), [comments]);
  const pendingCount = flatComments.filter((item) => item.optimistic).length;
  const liveCount = flatComments.filter((item) => item.justArrived).length;
  const listData = reactExports.useMemo(() => ({
    items: flatComments,
    replyState: replyDrafts,
    editState: editDrafts,
    onReplyStateChange: (commentId, value) => {
      setReplyDrafts((prev) => {
        const next = { ...prev };
        if (value === null) delete next[commentId];
        else next[commentId] = value;
        return next;
      });
    },
    onEditStateChange: (commentId, value) => {
      setEditDrafts((prev) => {
        const next = { ...prev };
        if (value === null) delete next[commentId];
        else next[commentId] = value;
        return next;
      });
    },
    onReplySubmit: (commentId, value) => {
      if (!String(value || "").trim()) return;
      onReply?.(commentId, value.trim());
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    },
    onEditSubmit: (commentId, value) => {
      if (!String(value || "").trim()) return;
      onEditComment?.(commentId, value.trim());
      setEditDrafts((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    },
    onLike: onLikeComment,
    onPin: onPinComment,
    onHide: onHideComment,
    onReport: onReportComment,
    onDelete: onDeleteComment,
    onCopy: onCopyComment,
    onReact: onToggleReaction
  }), [flatComments, replyDrafts, editDrafts, onReply, onEditComment, onLikeComment, onPinComment, onHideComment, onReportComment, onDeleteComment, onCopyComment, onToggleReaction]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", height: "100%", gap: 16 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comments-head-row", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { style: { margin: 0 }, children: [
          "التعليقات (",
          flatComments.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 12, marginTop: 4 }, children: "النظام يدعم الردود المتداخلة والتحديثات الفورية والإجراءات السريعة." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comments-badges-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "comment-summary-pill live", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "live-mini-dot" }),
          "Realtime ",
          liveCount ? `(${liveCount})` : ""
        ] }),
        pendingCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "comment-summary-pill pending", children: [
          "معلق ",
          pendingCount
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: sortBy, onChange: (event) => onSortChange?.(event.target.value), style: { minHeight: 34, borderRadius: 999, padding: "0 12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "newest", children: "الأحدث" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "popular", children: "الأكثر تفاعلاً" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "oldest", children: "الأقدم" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, minHeight: 320 }, children: flatComments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted text-center py-10", children: "لا توجد تعليقات بعد." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      FixedSizeList,
      {
        height,
        width,
        itemCount: flatComments.length,
        itemSize: 220,
        itemData: listData,
        className: "no-scrollbar",
        children: CommentRow
      }
    ) }) }),
    pagination?.has_more ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: onLoadMore, loading: loadingMore, children: "تحميل المزيد من التعليقات" }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-composer-shell", style: { marginTop: "auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          placeholder: "اكتب تعليقك... تقدر تستخدم @mention و #hashtag",
          value: commentText,
          onChange: (event) => setCommentText(event.target.value),
          rows: 3,
          style: { width: "100%", borderRadius: 16, padding: 12, fontSize: 14 }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" }, children: EMOJIS.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-emoji-btn", onClick: () => setCommentText((prev) => `${prev}${emoji}`), children: emoji }, emoji)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => {
          if (!commentText.trim()) return;
          onAddComment?.({ content: commentText.trim() });
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
        .comment-card-shell.is-hidden {
          opacity: 0.78;
          border-style: dashed;
        }
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          color: inherit;
        }
        .comment-link-btn.danger {
          border-color: rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap,
        .comment-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .comment-top-row {
          justify-content: space-between;
          flex-wrap: wrap;
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
        .comment-summary-pill.live,
        .comment-state-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }
        .comment-state-pill.pending,
        .comment-summary-pill.pending {
          background: rgba(251,191,36,0.12);
          color: #fde68a;
        }
        .comment-state-pill.pinned {
          background: rgba(139,92,246,0.16);
          color: #d8b4fe;
        }
        .comment-state-pill.muted {
          background: rgba(148,163,184,0.14);
          color: #cbd5e1;
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
  const {
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    currentUser,
    scrollToIndex,
    isDesktop
  } = data;
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
          if (!videoRef.current) return;
          if (videoRef.current.paused) videoRef.current.play().catch(() => {
          });
          else videoRef.current.pause();
        },
        onDoubleClick: () => handleLike(reel, { burst: true })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10 text-white pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 pointer-events-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-chip", children: "الريلز" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "reel-hint", children: isDesktop ? "تنقل بالأسهم ↑ ↓" : "تنقل بالسحب العمودي" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-count-pill", children: [
        index + 1,
        " / ",
        reels.length
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent text-white pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2 pointer-events-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: getOptimizedImageUrl(reel.user_avatar, 80), alt: "", className: "w-full h-full object-cover" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-sm", children: [
          "@",
          reel.username || "user"
        ] }),
        reel.username !== currentUser ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors", children: "متابعة" }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-6 line-clamp-3 mb-2 pointer-events-auto", children: reel.content || "ريل جديد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-white/80 pointer-events-auto", children: [
        reel.duration_label ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-chip ghost", children: reel.duration_label }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "reel-chip ghost", children: [
          "👁 ",
          Number(reel.views_count || 0)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-4 bottom-24 flex flex-col gap-5 items-center z-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => handleLike(reel),
            className: `reel-action-btn ${reel.is_liked ? "liked" : ""}`,
            children: "❤️"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: reel.likes_count || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => openComments(reel), className: "reel-action-btn", children: "💬" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: reel.comments_count || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleSave(reel), className: `reel-action-btn ${reel.is_saved ? "saved" : ""}`, children: "🔖" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: "حفظ" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleShare(reel), className: "reel-action-btn", children: "↗" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: "مشاركة" })
      ] })
    ] }),
    isDesktop ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "reel-arrow reel-arrow-up", onClick: () => scrollToIndex(index - 1), disabled: index === 0, children: "↑" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "reel-arrow reel-arrow-down", onClick: () => scrollToIndex(index + 1), disabled: index >= reels.length - 1, children: "↓" })
    ] }) : null
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
  const wheelLockRef = reactExports.useRef(false);
  const touchStartYRef = reactExports.useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const [reels, setReels] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [activeIndex, setActiveIndex] = reactExports.useState(0);
  const [heartBurstId, setHeartBurstId] = reactExports.useState("");
  const [showUploadModal, setShowUploadModal] = reactExports.useState(false);
  const [showCommentsModal, setShowCommentsModal] = reactExports.useState(false);
  const [activeReel, setActiveReel] = reactExports.useState(null);
  const [activeComments, setActiveComments] = reactExports.useState([]);
  const [uploadState, setUploadState] = reactExports.useState({ mediaUrl: "", previewUrl: "", uploading: false, publishing: false, content: "", fileName: "" });
  const deviceProfile = reactExports.useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.isLowEndDevice ? 1 : 2;
  const isDesktop = reactExports.useMemo(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches, []);
  const resetUploadState = reactExports.useCallback(() => {
    setUploadState({ mediaUrl: "", previewUrl: "", uploading: false, publishing: false, content: "", fileName: "" });
  }, []);
  const scrollToIndex = reactExports.useCallback((nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, reels.length - 1));
    if (!Number.isFinite(bounded)) return;
    setActiveIndex(bounded);
    listRef.current?.scrollToItem?.(bounded, "start");
  }, [reels.length]);
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
      setReels(Array.isArray(rankedReels) ? rankedReels : onlyVideos);
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
    const params = new URLSearchParams(location.search);
    if (params.get("upload") === "1") {
      setShowUploadModal(true);
    }
  }, [location.search]);
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
        video.removeAttribute("src");
        video.load();
        video.preload = "none";
        return;
      }
      if (!reel) return;
      const src = getAdaptiveVideoSrc(reel, deviceProfile, index === activeIndex);
      if (video.src !== src) {
        video.src = src;
        video.load();
      }
      video.preload = index === activeIndex ? "auto" : "metadata";
      if (index === activeIndex) video.play().catch(() => {
      });
      else video.pause();
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
  reactExports.useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isDesktop) return;
      if (showUploadModal || showCommentsModal) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
      if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        setShowUploadModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isDesktop, scrollToIndex, showCommentsModal, showUploadModal]);
  const setVideoRef = reactExports.useCallback((index, node) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);
  const handleScroll = reactExports.useCallback(({ startIndex }) => {
    if (startIndex !== activeIndex) setActiveIndex(startIndex);
  }, [activeIndex]);
  const handleWheelNavigation = reactExports.useCallback((event) => {
    if (showUploadModal || showCommentsModal || wheelLockRef.current) return;
    if (Math.abs(event.deltaY) < 18) return;
    wheelLockRef.current = true;
    scrollToIndex(activeIndex + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 420);
  }, [activeIndex, scrollToIndex, showCommentsModal, showUploadModal]);
  const handleTouchStart = reactExports.useCallback((event) => {
    touchStartYRef.current = event.touches?.[0]?.clientY || 0;
  }, []);
  const handleTouchEnd = reactExports.useCallback((event) => {
    if (showUploadModal || showCommentsModal) return;
    const endY = event.changedTouches?.[0]?.clientY || 0;
    const diff = touchStartYRef.current - endY;
    if (Math.abs(diff) < 50) return;
    scrollToIndex(activeIndex + (diff > 0 ? 1 : -1));
  }, [activeIndex, scrollToIndex, showCommentsModal, showUploadModal]);
  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      setTimeout(() => setHeartBurstId(""), 650);
    }
    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? {
      ...item,
      is_liked: !item.is_liked,
      likes_count: item.is_liked ? Number(item.likes_count || 0) - 1 : Number(item.likes_count || 0) + 1
    } : item));
    try {
      await likePost(reel.id);
    } catch {
      setReels(originalReels);
      pushToast({ type: "error", title: "تعذر تحديث الإعجاب" });
    }
  };
  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? { ...item, is_saved: !item.is_saved } : item));
    try {
      await savePost(reel.id);
    } catch {
      setReels(originalReels);
      pushToast({ type: "error", title: "تعذر حفظ الريل" });
    }
  };
  const handleShare = async (reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
      pushToast({ type: "success", title: "تم نسخ رابط الريل" });
      await sharePost(reel.id, "copy");
    } catch {
      pushToast({ type: "warning", title: "تعذر نسخ الرابط" });
    }
  };
  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    try {
      const { data } = await getComments(reel.id);
      setActiveComments(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setActiveComments([]);
    }
  };
  const publishReel = async () => {
    if (!uploadState.mediaUrl) {
      pushToast({ type: "warning", title: "ارفع فيديو أولاً" });
      return;
    }
    try {
      setUploadState((prev) => ({ ...prev, publishing: true }));
      await createPost({
        content: uploadState.content?.trim() || "ريل جديد",
        media_url: uploadState.mediaUrl,
        media: uploadState.mediaUrl,
        media_urls: [uploadState.mediaUrl],
        type: "video",
        is_reel: true
      });
      setShowUploadModal(false);
      resetUploadState();
      navigate("/reels", { replace: true });
      await loadReels();
      pushToast({ type: "success", title: "تم نشر الريل بنجاح" });
    } catch (error) {
      setUploadState((prev) => ({ ...prev, publishing: false }));
      pushToast({ type: "error", title: "فشل نشر الريل", description: error?.response?.data?.detail || error?.message });
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
    currentUser,
    scrollToIndex,
    isDesktop
  }), [reels, activeIndex, setVideoRef, currentUser, scrollToIndex, isDesktop]);
  const closeUploadModal = () => {
    setShowUploadModal(false);
    navigate("/reels", { replace: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { hideNav: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "reels-page-shell",
      onWheelCapture: handleWheelNavigation,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-header-bar", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "الريلز" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: isDesktop ? "استخدم الأسهم للتنقل بين الفيديوهات" : "مرر لأعلى وأسفل للتنقل بين الفيديوهات" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "upload-reel-button", onClick: () => setShowUploadModal(true), children: "⬆ رفع ريل" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reels-stage-shell", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-loading-state", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-loader" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "جارٍ تحميل الريلز..." })
        ] }) : reels.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
        ) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-empty-state", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-icon", children: "🎬" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "مافيش ريلز لسه" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اضغط على زر رفع ريل وأضف أول فيديو بشكل واضح ومباشر." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowUploadModal(true), children: "رفع أول ريل" })
        ] }) }),
        heartBurstId ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-heart-burst", children: "❤️" }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showUploadModal, onClose: closeUploadModal, title: "إضافة ريل جديد", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-layout", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-help", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الخطوة 1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اختر فيديو واضح للريل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الخطوة 2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "بعد اكتمال الرفع سيظهر لك مشغل فيديو للمعاينة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الخطوة 3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اضغط زر نشر الريل" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: uploadState.content,
              onChange: (event) => setUploadState((prev) => ({ ...prev, content: event.target.value })),
              rows: 4,
              placeholder: "اكتب وصف الريل أو الكابشن",
              className: "upload-caption-field"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            VideoUploader,
            {
              label: "رفع فيديو الريل",
              onUploadComplete: ({ url, previewUrl, file }) => {
                setUploadState((prev) => ({
                  ...prev,
                  mediaUrl: url || "",
                  previewUrl: previewUrl || "",
                  fileName: file?.name || "",
                  uploading: false
                }));
                pushToast({ type: "success", title: "تم رفع الفيديو", description: "راجع المعاينة ثم اضغط نشر الريل." });
              },
              onError: (message) => pushToast({ type: "error", title: "فشل رفع الفيديو", description: message })
            }
          ),
          uploadState.mediaUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "uploaded-preview-shell", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "uploaded-preview-head", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "معاينة الريل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: uploadState.fileName || "video.mp4" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: uploadState.mediaUrl, controls: true, playsInline: true, className: "uploaded-preview-video" })
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: closeUploadModal, children: "إغلاق" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: publishReel, loading: uploadState.publishing, disabled: !uploadState.mediaUrl || uploadState.publishing, children: "نشر الريل الآن" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showCommentsModal, onClose: () => setShowCommentsModal(false), title: "التعليقات", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "comments-modal-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          NestedComments,
          {
            comments: activeComments,
            onAddComment: async (content) => {
              const { data } = await addComment(activeReel.id, content);
              setActiveComments((prev) => [data, ...prev]);
            }
          }
        ) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .reels-page-shell {
            position: relative;
            min-height: 100vh;
            height: 100vh;
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .reels-header-bar {
            position: absolute;
            inset-inline: 0;
            top: 0;
            z-index: 30;
            padding: 18px 18px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0));
          }
          .reels-header-bar h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 900;
          }
          .reels-header-bar p {
            margin: 4px 0 0;
            color: rgba(255,255,255,0.76);
            font-size: 13px;
          }
          .upload-reel-button {
            border: none;
            border-radius: 999px;
            padding: 12px 18px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: #fff;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 18px 36px rgba(59,130,246,0.24);
          }
          .reels-stage-shell {
            flex: 1;
            height: 100%;
          }
          .reels-loading-state,
          .reels-empty-state {
            height: 100%;
            display: grid;
            place-items: center;
            text-align: center;
            gap: 12px;
            padding: 24px;
          }
          .reel-loader {
            width: 54px;
            height: 54px;
            border-radius: 999px;
            border: 4px solid rgba(255,255,255,0.16);
            border-top-color: #8b5cf6;
            animation: reelSpin 0.9s linear infinite;
          }
          .reels-empty-state .empty-icon {
            width: 84px;
            height: 84px;
            border-radius: 26px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.06);
            font-size: 34px;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .reel-container { scroll-snap-align: start; }
          .reel-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.12);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }
          .reel-chip.ghost {
            background: rgba(15,23,42,0.58);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .reel-hint {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.78);
            font-size: 12px;
          }
          .reel-count-pill {
            border-radius: 999px;
            padding: 8px 12px;
            background: rgba(0,0,0,0.42);
            border: 1px solid rgba(255,255,255,0.08);
            font-size: 12px;
            font-weight: 800;
          }
          .reel-action-btn {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.12);
            color: #fff;
            font-size: 24px;
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: transform 120ms ease, background 120ms ease;
          }
          .reel-action-btn:hover {
            transform: translateY(-2px);
            background: rgba(255,255,255,0.18);
          }
          .reel-action-btn.liked {
            background: rgba(239,68,68,0.22);
            color: #fecaca;
          }
          .reel-action-btn.saved {
            background: rgba(245,158,11,0.22);
            color: #fde68a;
          }
          .reel-action-label {
            font-size: 11px;
            color: rgba(255,255,255,0.85);
            font-weight: 700;
          }
          .reel-arrow {
            position: absolute;
            left: 24px;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.34);
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 20;
          }
          .reel-arrow:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }
          .reel-arrow-up { top: 50%; transform: translateY(-68px); }
          .reel-arrow-down { top: 50%; transform: translateY(16px); }
          .reel-heart-burst {
            position: absolute;
            inset: 0;
            z-index: 35;
            display: grid;
            place-items: center;
            font-size: 84px;
            pointer-events: none;
            animation: heartBurst 0.65s ease-out forwards;
          }
          .upload-modal-layout,
          .comments-modal-shell {
            display: grid;
            gap: 14px;
          }
          .upload-modal-help {
            display: grid;
            gap: 6px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(255,255,255,0.06);
            color: #cbd5e1;
          }
          .upload-modal-help strong {
            color: #fff;
          }
          .upload-modal-help p {
            margin: 0;
            font-size: 13px;
          }
          .upload-caption-field {
            width: 100%;
            border-radius: 16px;
            padding: 14px;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(255,255,255,0.08);
            color: #fff;
            resize: vertical;
          }
          .uploaded-preview-shell {
            display: grid;
            gap: 10px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.62);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .uploaded-preview-head {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            color: #fff;
            font-size: 13px;
          }
          .uploaded-preview-video {
            width: 100%;
            max-height: 320px;
            border-radius: 14px;
            background: #000;
          }
          .upload-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            flex-wrap: wrap;
          }
          @keyframes reelSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes heartBurst {
            0% { opacity: 0; transform: scale(0.4); }
            45% { opacity: 1; transform: scale(1.08); }
            100% { opacity: 0; transform: scale(1.35); }
          }
          @media (max-width: 1023px) {
            .reels-header-bar {
              padding: 14px 14px 12px;
            }
            .reels-header-bar h1 {
              font-size: 20px;
            }
            .upload-reel-button {
              padding: 10px 14px;
              font-size: 14px;
            }
          }
        ` })
      ]
    }
  ) });
}
export {
  ReelsPage as default
};
