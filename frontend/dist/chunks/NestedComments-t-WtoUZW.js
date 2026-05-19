import { r as reactExports, j as jsxRuntimeExports, B as Button } from "../index-BAMQT-m6.js";
import { A as AutoSizer, F as FixedSizeList } from "./react-virtualized-auto-sizer.esm-_F9403nZ.js";
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
export {
  NestedComments as N
};
