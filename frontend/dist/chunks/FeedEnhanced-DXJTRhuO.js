import { e as useToast, f as getCurrentUsername, p as useQueryClient, r as reactExports, h as socketManager, j as jsxRuntimeExports, B as Button, x as logger } from "../index-BAMQT-m6.js";
import { M as MainLayout } from "./MainLayout-R4-pAMZD.js";
import { M as Modal } from "./Modal-zc2pETlg.js";
import { C as Card } from "./Card-BJoniTPs.js";
import { N as NestedComments } from "./NestedComments-t-WtoUZW.js";
import { a as useMutation, u as useFeed, P as PostComposer } from "./useFeed-Dc-HL0mX.js";
import { s as savePost, b as sharePost, c as getComments, a as addComment, e as deletePost, u as updatePost, l as likePost } from "./posts-IFBCXYyQ.js";
import { E as ErrorState } from "./ErrorState-CDGi9dt6.js";
import { E as EmptyState } from "./EmptyState-a8e0B9JF.js";
import { A as AutoSizer, F as FixedSizeList } from "./react-virtualized-auto-sizer.esm-_F9403nZ.js";
import "./proxy--nYX4zu0.js";
const ADVANCED_REACTIONS = [
  { emoji: "❤️", label: "حب" },
  { emoji: "😂", label: "ضحك" },
  { emoji: "😮", label: "مندهش" },
  { emoji: "🔥", label: "حماس" },
  { emoji: "👏", label: "تصفيق" },
  { emoji: "💡", label: "فكرة" }
];
function renderRichText(content = "") {
  return content.split(/(\s+)/).map((part, index) => {
    if (part.startsWith("@")) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "var(--accent)", cursor: "pointer", fontWeight: 700 }, children: part }, index);
    if (part.startsWith("#")) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "var(--primary)", cursor: "pointer", fontWeight: 700 }, children: part }, index);
    return part;
  });
}
function PostCard({ post, onShowAnalytics, onLike }) {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const queryClient = useQueryClient();
  const [showReactions, setShowReactions] = reactExports.useState(false);
  const [showShareModal, setShowShareModal] = reactExports.useState(false);
  const [showMediaModal, setShowMediaModal] = reactExports.useState(false);
  const [showCommentsModal, setShowCommentsModal] = reactExports.useState(false);
  const [showEditModal, setShowEditModal] = reactExports.useState(false);
  const [commentDraft, setCommentDraft] = reactExports.useState("");
  const [comments, setComments] = reactExports.useState([]);
  const [editContent, setEditContent] = reactExports.useState(post?.content || "");
  const [myReaction, setMyReaction] = reactExports.useState(post?.my_reaction || null);
  const [isPinned, setIsPinned] = reactExports.useState(Boolean(post?.is_pinned));
  const isOwner = reactExports.useMemo(() => currentUser && post?.username && currentUser === post.username, [currentUser, post?.username]);
  const interactionCount = reactExports.useMemo(() => {
    const reactionCounts = Object.values(post?.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    return reactionCounts + Number(post?.likes_count || 0) + Number(post?.comments_count || 0) + Number(post?.share_count || 0);
  }, [post?.comments_count, post?.likes_count, post?.reactions, post?.share_count]);
  const refreshComments = async () => {
    try {
      const { data } = await getComments(post.id);
      setComments(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحميل التعليقات", description: error?.response?.data?.detail || error?.message });
    }
  };
  reactExports.useEffect(() => {
    if (!showCommentsModal) return void 0;
    socketManager.connect();
    const handleIncomingComment = (payload) => {
      if (String(payload?.post_id) !== String(post.id)) return;
      setComments((prev) => {
        const exists = prev.some((item) => String(item.id) === String(payload.id));
        if (exists) return prev;
        const next = [...prev, { ...payload, justArrived: true }];
        window.setTimeout(() => {
          setComments((current) => current.map((item) => String(item.id) === String(payload.id) ? { ...item, justArrived: false } : item));
        }, 2600);
        return next;
      });
    };
    socketManager.on("post_comment", handleIncomingComment);
    return () => socketManager.off("post_comment", handleIncomingComment);
  }, [post.id, showCommentsModal]);
  const saveMutation = useMutation({
    mutationFn: () => savePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries(["feed-data"]);
      pushToast({ type: "success", title: post.is_saved ? "تم إلغاء الحفظ" : "تم حفظ المنشور" });
    },
    onError: (error) => pushToast({ type: "error", title: "تعذر حفظ المنشور", description: error?.response?.data?.detail || error?.message })
  });
  const shareMutation = useMutation({
    mutationFn: (platform) => sharePost(post.id, platform),
    onError: (error) => pushToast({ type: "error", title: "تعذر مشاركة المنشور", description: error?.response?.data?.detail || error?.message })
  });
  const handleShare = async (platform) => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (platform === "copy") {
        await navigator.clipboard.writeText(url);
      } else {
        const shares = {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(`${post.content} ${url}`)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content)}&url=${encodeURIComponent(url)}`
        };
        window.open(shares[platform], "_blank", "noopener,noreferrer");
      }
      shareMutation.mutate(platform);
      setShowShareModal(false);
      pushToast({ type: "success", title: "تمت مشاركة المنشور" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر المشاركة", description: error?.message });
    }
  };
  const handleAddComment = async ({ content, parentId = null }) => {
    if (!content?.trim()) return;
    const cleanContent = content.trim();
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticComment = {
      id: optimisticId,
      username: currentUser,
      content: cleanContent,
      parent_id: parentId,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      reactions: {},
      optimistic: true,
      justArrived: true
    };
    setComments((prev) => [...prev, optimisticComment]);
    setCommentDraft("");
    try {
      const { data } = await addComment(post.id, cleanContent, parentId);
      const confirmedComment = {
        ...data || optimisticComment,
        optimistic: false,
        justArrived: true
      };
      setComments((prev) => prev.map((item) => String(item.id) === optimisticId ? { ...confirmedComment, id: data?.id || optimisticId } : item));
      queryClient.invalidateQueries(["feed-data"]);
      socketManager.emit?.("post_comment", { ...confirmedComment, post_id: post.id });
      window.setTimeout(() => {
        setComments((prev) => prev.map((item) => item.id === (data?.id || optimisticId) ? { ...item, justArrived: false } : item));
      }, 2600);
    } catch (error) {
      setComments((prev) => prev.filter((item) => String(item.id) !== optimisticId));
      pushToast({ type: "error", title: "تعذر إضافة التعليق", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      queryClient.invalidateQueries(["feed-data"]);
      pushToast({ type: "success", title: "تم حذف المنشور" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر حذف المنشور", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleEdit = async () => {
    try {
      await updatePost(post.id, { content: editContent });
      queryClient.invalidateQueries(["feed-data"]);
      setShowEditModal(false);
      pushToast({ type: "success", title: "تم تعديل المنشور" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تعديل المنشور", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleTogglePin = async () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    try {
      await updatePost(post.id, { is_pinned: nextPinned });
      queryClient.invalidateQueries(["feed-data"]);
      pushToast({ type: "success", title: nextPinned ? "تم تثبيت المنشور" : "تم إلغاء التثبيت" });
    } catch (error) {
      setIsPinned(!nextPinned);
      pushToast({ type: "error", title: "تعذر تحديث التثبيت", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleQuote = () => {
    localStorage.setItem("yamshat_quote_draft", JSON.stringify({ id: post.id, username: post.username, content: post.content }));
    window.dispatchEvent(new Event("yamshat:quote-post"));
    window.scrollTo({ top: 0, behavior: "smooth" });
    pushToast({ type: "success", title: "تم تجهيز الاقتباس في صندوق النشر" });
  };
  const handleCommentReaction = (commentId, emoji) => {
    setComments((prev) => prev.map((item) => String(item.id) === String(commentId) ? { ...item, reactions: { ...item.reactions || {}, [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } } : item));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `post-card ${isPinned ? "pinned" : ""}`, style: { padding: 16, position: "relative", border: isPinned ? "1px solid var(--accent)" : "1px solid var(--line)", background: isPinned ? "rgba(59,130,246,0.03)" : "var(--bg-card)" }, children: [
    isPinned ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 12, left: 16, display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 12, fontWeight: "bold" }, children: "📌 منشور مثبت" }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 44, height: 44, borderRadius: "50%", background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid var(--line)" }, children: post.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.avatar, alt: post.username, style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.username?.[0]?.toUpperCase() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: "bold", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }, children: [
            post.username,
            post.is_verified ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title: "حساب موثق", children: "✅" }) : null,
            post.mentions?.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", style: { fontSize: 12 }, children: [
              "ذكر ",
              post.mentions.length,
              " مستخدم"
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 11 }, children: post.created_at ? new Date(post.created_at).toLocaleString("ar-EG") : "الآن" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
        typeof onShowAnalytics === "function" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: onShowAnalytics, children: "📊" }) : null,
        isOwner ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setShowEditModal(true), children: "تعديل" }) : null,
        isOwner ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: handleTogglePin, children: isPinned ? "إلغاء التثبيت" : "تثبيت" }) : null,
        isOwner ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: handleDelete, children: "حذف" }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 16, lineHeight: 1.8, marginBottom: 16, whiteSpace: "pre-wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: renderRichText(post.content || "") }),
      post.hashtags?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 8, fontSize: 13, color: "var(--primary)" }, children: post.hashtags.map((item) => `#${item}`).join(" · ") }) : null,
      post.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => setShowMediaModal(true), style: { marginTop: 12, borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "#000", maxHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }, children: post.media_url.match(/\.(mp4|webm|mov|m3u8)$/i) ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: post.media_url, style: { width: "100%", maxHeight: 420 }, muted: true, loop: true, autoPlay: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.media_url, alt: "Post Media", style: { width: "100%", height: "auto", objectFit: "contain" } }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 13 }, children: [
        "إجمالي التفاعل: ",
        interactionCount,
        " · حفظ ",
        Number(post.saved_count || 0),
        " · مشاركة ",
        Number(post.share_count || 0)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: 12, gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: onLike, onContextMenu: (event) => {
              event.preventDefault();
              setShowReactions((prev) => !prev);
            }, className: "post-inline-btn", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 18 }, children: post.is_liked ? myReaction || "❤️" : "🤍" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.likes_count || 0 })
            ] }),
            showReactions ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reactions-popup", style: { position: "absolute", bottom: "100%", left: 0, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: 30, padding: "6px 10px", display: "flex", gap: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", zIndex: 100, marginBottom: 10 }, children: ADVANCED_REACTIONS.map((reaction) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
              setMyReaction(reaction.emoji);
              setShowReactions(false);
              onLike?.();
            }, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer" }, children: reaction.emoji }, reaction.emoji)) }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
            setShowCommentsModal(true);
            refreshComments();
          }, className: "post-inline-btn", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 18 }, children: "💬" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.comments_count || comments.length || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: handleQuote, className: "post-inline-btn", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 18 }, children: "❝" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "اقتباس" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowShareModal(true), className: "post-inline-btn", children: "📤 مشاركة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => saveMutation.mutate(), className: "post-inline-btn", children: post.is_saved ? "🔖 محفوظ" : "📑 حفظ" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: showMediaModal, onClose: () => setShowMediaModal(false), title: "الوسائط", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }, children: post.media_url?.match(/\.(mp4|webm|mov|m3u8)$/i) ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: post.media_url, controls: true, autoPlay: true, style: { maxWidth: "100%", maxHeight: "80vh" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.media_url, alt: "Full Media", style: { maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" } }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: showShareModal, onClose: () => setShowShareModal(false), title: "مشاركة المنشور", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleShare("whatsapp"), style: { background: "#25D366", color: "white" }, children: "WhatsApp" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleShare("twitter"), style: { background: "#000", color: "white" }, children: "X" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleShare("copy"), children: "نسخ الرابط" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { open: showCommentsModal, onClose: () => setShowCommentsModal(false), title: "التعليقات اللحظية", size: "large", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        NestedComments,
        {
          comments,
          onAddComment: handleAddComment,
          onReply: (parentId, content) => handleAddComment({ content, parentId }),
          onToggleReaction: handleCommentReaction
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10, marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: commentDraft, onChange: (event) => setCommentDraft(event.target.value), rows: 3, placeholder: "تعليق سريع", style: { width: "100%", borderRadius: 12, padding: 12 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleAddComment({ content: commentDraft }), children: "إرسال سريع" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: showEditModal, onClose: () => setShowEditModal(false), title: "تعديل المنشور", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: editContent, onChange: (event) => setEditContent(event.target.value), rows: 6, style: { width: "100%", borderRadius: 12, padding: 12 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleEdit, children: "حفظ التعديلات" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .post-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .post-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .post-inline-btn {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          padding: 0;
        }
      ` })
  ] });
}
const PostSkeleton = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "post-skeleton", style: {
  background: "var(--bg-card)",
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  border: "1px solid var(--line)",
  animation: "pulse 1.5s infinite ease-in-out"
}, children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, marginBottom: 16 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 48, height: 48, borderRadius: "50%", background: "var(--line)" } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40%", height: 14, background: "var(--line)", borderRadius: 4, marginBottom: 8 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "20%", height: 10, background: "var(--line)", borderRadius: 4 } })
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: 12, background: "var(--line)", borderRadius: 4, marginBottom: 8 } }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "90%", height: 12, background: "var(--line)", borderRadius: 4, marginBottom: 8 } }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "60%", height: 12, background: "var(--line)", borderRadius: 4, marginBottom: 16 } }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", height: 300, background: "var(--line)", borderRadius: 12 } }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    ` })
] });
function FeedSkeleton({ count = 3 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "feed-skeleton", children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(PostSkeleton, {}, i)) });
}
const PostItem = ({ index, style, data }) => {
  const { posts, onLike, onDelete } = data;
  const post = posts[index];
  if (!post) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, paddingBottom: "20px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    PostCard,
    {
      post,
      onLike: () => onLike(post.id),
      onDelete: () => onDelete(post.id)
    }
  ) });
};
function FeedEnhanced() {
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = reactExports.useState(typeof window === "undefined" ? false : window.innerWidth < 768);
  const [filterType, setFilterType] = reactExports.useState("all");
  const [sortBy, setSortBy] = reactExports.useState("recent");
  const listRef = reactExports.useRef(null);
  reactExports.useRef(null);
  reactExports.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch
  } = useFeed({
    limit: 10,
    filterType,
    sortBy
  });
  const likeMutation = useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed-data"] });
      const previousData = queryClient.getQueryData(["feed-data"]);
      queryClient.setQueryData(["feed-data"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(
            (page) => page.map(
              (post) => post.id === postId ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
              } : post
            )
          )
        };
      });
      return { previousData };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(["feed-data"], context?.previousData);
      logger.warn("Like failed", { postId: _postId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed-data"] });
      const previousData = queryClient.getQueryData(["feed-data"]);
      queryClient.setQueryData(["feed-data"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(
            (page) => page.filter((post) => post.id !== postId)
          )
        };
      });
      return { previousData };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(["feed-data"], context?.previousData);
      logger.warn("Delete failed", { postId: _postId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    }
  });
  const handleScroll = reactExports.useCallback(({ visibleStopIndex }) => {
    if (visibleStopIndex >= posts.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [posts.length, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const itemSize = isMobile ? 560 : 620;
  const listData = reactExports.useMemo(() => ({
    posts,
    onLike: (id) => likeMutation.mutate(id),
    onDelete: (id) => deleteMutation.mutate(id)
  }), [posts, likeMutation, deleteMutation]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { maxWidth: 700, margin: "0 auto", padding: "20px 10px", height: "calc(100vh - 70px)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PostComposer, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        display: "flex",
        gap: "10px",
        marginTop: "20px",
        marginBottom: "20px",
        flexWrap: "wrap"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: filterType,
            onChange: (e) => setFilterType(e.target.value),
            style: {
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--bg-card)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "14px"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "الكل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "following", children: "المتابعون" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "trending", children: "الأكثر تفاعلاً" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value),
            style: {
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--line)",
              background: "var(--bg-card)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "14px"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "recent", children: "الأحدث" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "trending", children: "الأكثر تفاعلاً" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "oldest", children: "الأقدم" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => refetch(),
            style: {
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--primary)",
              background: "transparent",
              color: "var(--primary)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            },
            children: "تحديث"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 20, height: "calc(100% - 200px)" }, children: [
        isLoading && !isFetchingNextPage ? /* @__PURE__ */ jsxRuntimeExports.jsx(FeedSkeleton, { count: 3 }) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { onRetry: refetch }) : posts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "لا توجد منشورات حالياً" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          FixedSizeList,
          {
            ref: listRef,
            height,
            width,
            itemCount: posts.length,
            itemSize,
            onItemsRendered: handleScroll,
            itemData: listData,
            className: "no-scrollbar",
            children: PostItem
          }
        ) }),
        isFetchingNextPage && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "20px", textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-small" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` })
  ] });
}
export {
  FeedEnhanced as default
};
