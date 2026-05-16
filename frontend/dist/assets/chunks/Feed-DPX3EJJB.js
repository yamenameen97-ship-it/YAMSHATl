import {
  MainLayout,
  avatarGradient,
  followUser,
  formatCompactNumber,
  formatTimeAgo,
  getLiveRooms,
  getUsers,
  initialsFromName
} from "./chunk-ZOZSORVL.js";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "./chunk-AB4CHF2R.js";
import {
  createPost,
  getPosts,
  likePost,
  uploadPostMedia
} from "./chunk-QYGJVHBV.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import {
  useToast
} from "./chunk-OIWCOE6H.js";
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

// src/pages/Feed.jsx
init_define_import_meta_env();
var import_react3 = __toESM(require_react(), 1);

// src/components/feed/PostComposer.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var DRAFT_KEY = "yamshat_post_draft";
var QUOTE_KEY = "yamshat_quote_draft";
function extractTags(text = "") {
  const hashtags = Array.from(new Set((text.match(/#[\p{L}\p{N}_-]+/gu) || []).map((item) => item.replace("#", ""))));
  const mentions = Array.from(new Set((text.match(/@[\p{L}\p{N}_.-]+/gu) || []).map((item) => item.replace("@", ""))));
  return { hashtags, mentions };
}
function PostComposer() {
  const [content, setContent] = (0, import_react.useState)("");
  const [media, setMedia] = (0, import_react.useState)(null);
  const [mediaPreview, setMediaPreview] = (0, import_react.useState)(null);
  const [uploadProgress, setUploadProgress] = (0, import_react.useState)(0);
  const [isUploading, setIsUploading] = (0, import_react.useState)(false);
  const [showScheduler, setShowScheduler] = (0, import_react.useState)(false);
  const [scheduledDate, setScheduledDate] = (0, import_react.useState)("");
  const [isPinned, setIsPinned] = (0, import_react.useState)(false);
  const [quoteDraft, setQuoteDraft] = (0, import_react.useState)(null);
  const fileInputRef = (0, import_react.useRef)(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  (0, import_react.useEffect)(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    const savedQuote = localStorage.getItem(QUOTE_KEY);
    if (savedDraft) setContent(savedDraft);
    if (savedQuote) {
      try {
        setQuoteDraft(JSON.parse(savedQuote));
      } catch {
        localStorage.removeItem(QUOTE_KEY);
      }
    }
    const handleQuotedPost = () => {
      try {
        const nextValue = JSON.parse(localStorage.getItem(QUOTE_KEY) || "null");
        setQuoteDraft(nextValue);
      } catch {
        setQuoteDraft(null);
      }
    };
    window.addEventListener("yamshat:quote-post", handleQuotedPost);
    return () => window.removeEventListener("yamshat:quote-post", handleQuotedPost);
  }, []);
  (0, import_react.useEffect)(() => {
    const timer = window.setTimeout(() => {
      if (content.trim()) localStorage.setItem(DRAFT_KEY, content);
      else localStorage.removeItem(DRAFT_KEY);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [content]);
  const tagsPreview = (0, import_react.useMemo)(() => extractTags(content), [content]);
  const clearComposer = () => {
    setContent("");
    setMedia(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setScheduledDate("");
    setShowScheduler(false);
    setIsPinned(false);
    setQuoteDraft(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(QUOTE_KEY);
  };
  const addSnippet = (value) => {
    setContent((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${value}`);
  };
  const handleMediaSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      pushToast({ type: "error", title: "\u0627\u0644\u0645\u0644\u0641 \u0643\u0628\u064A\u0631 \u062C\u062F\u064B\u0627", description: "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 200 \u0645\u064A\u062C\u0627." });
      return;
    }
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };
  const handleSubmit = async (status = "published") => {
    if (isUploading || !content.trim() && !media && !quoteDraft) return;
    setIsUploading(true);
    try {
      let mediaUrl = "";
      if (media) {
        const uploadRes = await uploadPostMedia(media, (event) => {
          const percent = event.total ? Math.round(event.loaded / event.total * 100) : 0;
          setUploadProgress(percent);
        });
        mediaUrl = uploadRes?.data?.media_url || uploadRes?.data?.url || uploadRes?.data?.file_url || "";
      }
      const { hashtags, mentions } = extractTags(content);
      await createPost({
        content,
        media_url: mediaUrl,
        status,
        scheduled_at: status === "scheduled" ? scheduledDate : null,
        is_pinned: isPinned,
        hashtags,
        mentions,
        quote_source_id: quoteDraft?.id || null
      });
      pushToast({
        type: "success",
        title: status === "draft" ? "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u0633\u0648\u062F\u0629" : status === "scheduled" ? "\u062A\u0645\u062A \u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631" : "\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0645\u0646\u0634\u0648\u0631",
        description: isPinned ? "\u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u0645\u062A\u062C\u0647\u0632 \u0643\u0645\u0646\u0634\u0648\u0631 \u0645\u062B\u0628\u062A." : void 0
      });
      clearComposer();
      queryClient.invalidateQueries(["feed-data"]);
    } catch (error) {
      pushToast({ type: "error", title: "\u0641\u0634\u0644 \u0646\u0634\u0631 \u0627\u0644\u0645\u0646\u0634\u0648\u0631", description: error?.response?.data?.detail || error?.message || "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u062A\u0627\u0646\u064A\u0629." });
    } finally {
      setIsUploading(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { marginBottom: 24, padding: 20, border: "1px solid var(--line)" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", flexShrink: 0 } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
        quoteDraft ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { borderRadius: 16, padding: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", marginBottom: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontWeight: 700, marginBottom: 4 }, children: [
              "\u0627\u0642\u062A\u0628\u0627\u0633 \u0645\u0646 @",
              quoteDraft.username
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { fontSize: 13, lineHeight: 1.6 }, children: quoteDraft.content })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => {
            setQuoteDraft(null);
            localStorage.removeItem(QUOTE_KEY);
          }, style: { background: "none", border: "none", cursor: "pointer", fontSize: 18 }, children: "\u2715" })
        ] }) }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "textarea",
          {
            placeholder: "\u0627\u0643\u062A\u0628 \u0645\u0646\u0634\u0648\u0631\u0643... \u0627\u0633\u062A\u062E\u062F\u0645 #\u0647\u0627\u0634\u062A\u0627\u062C \u0648 @\u0645\u0646\u0634\u0646 \u0644\u0648 \u062D\u0627\u0628\u0628",
            value: content,
            onChange: (event) => setContent(event.target.value),
            style: { width: "100%", minHeight: 96, background: "transparent", border: "none", color: "var(--text)", fontSize: 16, resize: "none", outline: "none", paddingTop: 8, lineHeight: 1.7 }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("#\u062A\u0631\u0646\u062F"), children: "#\u0647\u0627\u0634\u062A\u0627\u062C" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("@username"), children: "@\u0645\u0646\u0634\u0646" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("\u0627\u0642\u062A\u0628\u0627\u0633: "), children: "\u0627\u0642\u062A\u0628\u0627\u0633" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: `composer-chip ${isPinned ? "active" : ""}`, onClick: () => setIsPinned((prev) => !prev), children: "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631" })
    ] }),
    tagsPreview.hashtags.length || tagsPreview.mentions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 8, marginTop: 12 }, children: [
      tagsPreview.hashtags.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "muted", style: { fontSize: 13 }, children: [
        "\u0647\u0627\u0634\u062A\u0627\u062C: ",
        tagsPreview.hashtags.map((item) => `#${item}`).join(" \xB7 ")
      ] }) : null,
      tagsPreview.mentions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "muted", style: { fontSize: 13 }, children: [
        "\u0645\u0646\u0634\u0646: ",
        tagsPreview.mentions.map((item) => `@${item}`).join(" \xB7 ")
      ] }) : null
    ] }) : null,
    mediaPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", marginTop: 12, borderRadius: 12, overflow: "hidden", maxHeight: 320 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => {
        setMedia(null);
        setMediaPreview(null);
      }, style: { position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", zIndex: 1 }, children: "\u2715" }),
      media?.type?.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: mediaPreview, style: { width: "100%", display: "block" }, controls: true }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: mediaPreview, style: { width: "100%", objectFit: "cover" }, alt: "Preview" }),
      isUploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.2)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "100%", background: "var(--accent)", width: `${uploadProgress}%`, transition: "width 0.2s" } }) }) : null
    ] }) : null,
    showScheduler ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 16, padding: 12, background: "var(--bg-soft)", borderRadius: 12, border: "1px solid var(--line)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", marginBottom: 8, fontSize: 13, fontWeight: "bold" }, children: "\u062A\u062D\u062F\u064A\u062F \u0648\u0642\u062A \u0627\u0644\u0646\u0634\u0631" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "datetime-local", value: scheduledDate, onChange: (event) => setScheduledDate(event.target.value), style: { width: "100%", background: "var(--bg-input)", color: "var(--text)", border: "1px solid var(--line)", padding: 10, borderRadius: 8 } })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 16, alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 16, gap: 12, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => fileInputRef.current?.click(), style: { background: "none", border: "none", cursor: "pointer", fontSize: 20, opacity: 0.8 }, title: "\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0623\u0648 \u0641\u064A\u062F\u064A\u0648", children: "\u{1F5BC}\uFE0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => setShowScheduler((prev) => !prev), style: { background: "none", border: "none", cursor: "pointer", fontSize: 20, opacity: showScheduler ? 1 : 0.8, color: showScheduler ? "var(--accent)" : "inherit" }, title: "\u062C\u062F\u0648\u0644\u0629", children: "\u{1F4C5}" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", style: { fontSize: 13 }, children: isPinned ? "\u0647\u064A\u062A\u062B\u0628\u062A \u0628\u0639\u062F \u0627\u0644\u0646\u0634\u0631" : "\u0645\u0646\u0634\u0648\u0631 \u0639\u0627\u062F\u064A" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "file", ref: fileInputRef, hidden: true, accept: "image/*,video/*", onChange: handleMediaSelect })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => handleSubmit("draft"), disabled: isUploading || !content.trim() && !quoteDraft, children: "\u062D\u0641\u0638 \u0645\u0633\u0648\u062F\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: () => handleSubmit(showScheduler ? "scheduled" : "published"), loading: isUploading, disabled: isUploading || !content.trim() && !media && !quoteDraft, children: showScheduler ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062C\u062F\u0648\u0644\u0629" : "\u0646\u0634\u0631" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .composer-chip {
          border: 1px solid rgba(59,130,246,0.15);
          background: rgba(59,130,246,0.06);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
        }
        .composer-chip.active {
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.3);
          color: #059669;
        }
      ` })
  ] });
}

// src/hooks/useFeed.js
init_define_import_meta_env();
var import_react2 = __toESM(require_react(), 1);
function useFeed(options = {}) {
  const {
    tab = "all",
    filter = "latest",
    limit = 10,
    pollingInterval = 3e4
    // 30 seconds polling
  } = options;
  const lastFetchRef = (0, import_react2.useRef)(Date.now());
  const query = useInfiniteQuery({
    queryKey: ["feed-data", tab, filter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({ tab, filter, page: pageParam, limit });
      lastFetchRef.current = Date.now();
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === limit ? allPages.length + 1 : void 0;
    },
    // Stale data handling
    staleTime: 5 * 60 * 1e3,
    // 5 minutes
    cacheTime: 30 * 60 * 1e3,
    // 30 minutes
    refetchOnWindowFocus: true,
    // Polling fallback for real-time updates
    refetchInterval: (data) => {
      return data?.pages?.length === 1 && document.visibilityState === "visible" ? pollingInterval : false;
    }
  });
  const posts = query.data?.pages.flatMap((page) => page) || [];
  return {
    posts,
    ...query,
    lastFetched: lastFetchRef.current
  };
}

// src/pages/Feed.jsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
function Avatar({ name, src, size = 46, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    border: ring ? "2px solid rgba(139,92,246,0.8)" : "none",
    boxShadow: ring ? "0 0 0 4px rgba(139,92,246,0.14)" : "none",
    flexShrink: 0
  };
  return src ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src, alt: name, style }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { ...style, display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient(name) }, children: initialsFromName(name).slice(0, 1) });
}
function mediaListFromPost(post) {
  if (Array.isArray(post?.media_urls) && post.media_urls.length) return post.media_urls;
  if (Array.isArray(post?.images) && post.images.length) return post.images;
  if (post?.image_url) return [post.image_url];
  if (post?.media) return [post.media];
  return [];
}
function PostGallery({ media, title }) {
  const items = media.slice(0, 3);
  if (!items.length) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-feed-fallback-media", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "monitor-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", {}),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", {}),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", {})
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: title || "Gaming vibes" })
    ] });
  }
  if (items.length === 1) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: items[0], alt: title, className: "yam-feed-main-media" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `yam-feed-media-grid ${items.length === 2 ? "two" : "three"}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: items[0], alt: title, className: "primary" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "secondary-stack", children: items.slice(1).map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "secondary-cell", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: item, alt: `${title}-${index}` }),
      index === 1 && media.length > 3 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "media-overlay", children: [
        "+",
        media.length - 3
      ] }) : null
    ] }, `${item}-${index}`)) })
  ] });
}
function FeedPostCard({ post, onLike }) {
  const media = mediaListFromPost(post);
  const likes = post.likes_count ?? post.like_count ?? post.likes ?? 0;
  const comments = post.comments_count ?? post.comment_count ?? Math.max(12, Math.floor(likes / 9));
  const shares = post.share_count ?? post.shares ?? Math.max(6, Math.floor(likes / 18));
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "yam-feed-post-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-post-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-post-author", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar, { name: post.username || "User", src: post.avatar }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-post-author-line", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: post.username || "Creator" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "verify-dot", children: "\u2713" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: formatTimeAgo(post.created_at) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "yam-icon-ghost", children: "\u22EF" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-post-copy", children: post.content || "\u062C\u0644\u0633\u0629 \u0645\u0645\u062A\u0639\u0629 \u0627\u0644\u064A\u0648\u0645 \u0645\u0639 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u064A\u0646! \u0634\u0643\u0631\u0627\u064B \u0644\u0643\u0644 \u0645\u0646 \u0643\u0627\u0646 \u0645\u0648\u062C\u0648\u062F." }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PostGallery, { media, title: post.content || post.username }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-post-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "yam-react-btn", onClick: () => onLike(post.id), children: [
        "\u2764 ",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: formatCompactNumber(likes) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "yam-react-btn", children: [
        "\u{1F4AC} ",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: formatCompactNumber(comments) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "yam-react-btn", children: [
        "\u2934 ",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: formatCompactNumber(shares) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "yam-react-btn save", children: "\u2311" })
    ] })
  ] });
}
function Feed() {
  const queryClient = useQueryClient();
  const currentUsername = getCurrentUsername();
  const { posts = [], isLoading, refetch } = useFeed({ limit: 10, pollingInterval: 25e3 });
  const { data: users = [] } = useQuery({
    queryKey: ["feed-users-sidebar"],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 6e4
  });
  const { data: liveRooms = [] } = useQuery({
    queryKey: ["feed-live-sidebar"],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 15e3,
    refetchInterval: 2e4
  });
  const likeMutation = useMutation({
    mutationFn: likePost,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed-data"] })
  });
  const followMutation = useMutation({
    mutationFn: followUser,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed-users-sidebar"] })
  });
  const stories = (0, import_react3.useMemo)(() => {
    const liveStories = Array.isArray(liveRooms) ? liveRooms.slice(0, 2).map((room) => ({
      id: `live-${room.id}`,
      username: room.host || room.username || "PlayerOne",
      avatar: room.avatar,
      live: true
    })) : [];
    const userStories = Array.isArray(users) ? users.slice(0, 4).map((user) => ({
      id: user.username,
      username: user.username,
      avatar: user.avatar,
      live: false
    })) : [];
    return [...liveStories, ...userStories].slice(0, 5);
  }, [liveRooms, users]);
  const trendingPosts = (0, import_react3.useMemo)(
    () => [...posts].sort((a, b) => Number(b.likes_count ?? b.like_count ?? b.likes ?? 0) - Number(a.likes_count ?? a.like_count ?? a.likes ?? 0)).slice(0, 3),
    [posts]
  );
  const onlineFriends = (0, import_react3.useMemo)(
    () => users.filter((user) => user.username !== currentUsername).slice(0, 5),
    [users, currentUsername]
  );
  const suggestedUsers = (0, import_react3.useMemo)(
    () => users.filter((user) => user.username !== currentUsername).slice(0, 3),
    [users, currentUsername]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-feed-page desktop-post mobile-post", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-feed-main-column", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "yam-feed-composer-shell", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-feed-composer-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar, { name: currentUsername || "You", size: 54, ring: true }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-feed-composer-prompt", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u0628\u0645 \u062A\u0641\u0643\u0631 \u0627\u0644\u064A\u0648\u0645\u061F" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0646\u0635 \u2022 \u0635\u0648\u0631\u0629 \u2022 \u0645\u0642\u0637\u0639 \u0642\u0635\u064A\u0631 \u2022 \u0644\u0627\u064A\u0641 \u0645\u0628\u0627\u0634\u0631" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PostComposer, {})
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-feed-sort-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0639\u0631\u0636 \u062D\u0633\u0628" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u0623\u062D\u062F\u062B \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "yam-refresh-btn", onClick: () => refetch(), children: "\u062A\u062D\u062F\u064A\u062B" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-feed-posts-stack", children: [
          isLoading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-empty-block", children: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A..." }) : null,
          !isLoading && !posts.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-empty-block", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u0634\u0648\u0631\u0627\u062A \u062D\u0627\u0644\u064A\u0627\u064B." }) : null,
          posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FeedPostCard, { post, onLike: (postId) => likeMutation.mutate(postId) }, post.id))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("aside", { className: "yam-feed-right-column", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u0627\u0644\u0642\u0635\u0635" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-story-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "yam-add-story", children: [
              "\uFF0B",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: "\u0625\u0636\u0627\u0641\u0629 \u0642\u0635\u0629" })
            ] }),
            stories.map((story) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-story-user", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `yam-story-ring ${story.live ? "live" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar, { name: story.username, src: story.avatar, size: 58 }) }),
              story.live ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "yam-story-live", children: "LIVE" }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: story.username })
            ] }, story.id))
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0631\u0627\u0626\u062C\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-trending-list", children: trendingPosts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-trending-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: post.username }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: (post.content || "\u0645\u0646\u0634\u0648\u0631 \u0645\u0645\u064A\u0632").slice(0, 70) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-trending-stats", children: [
                "\u2764 ",
                formatCompactNumber(post.likes_count ?? post.like_count ?? post.likes ?? 0),
                " \xB7 \u{1F4AC} ",
                formatCompactNumber(post.comments_count ?? 0)
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-trending-thumb", children: mediaListFromPost(post)[0] ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: mediaListFromPost(post)[0], alt: post.username }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u{1F3AE}" }) })
          ] }, post.id)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621 \u0627\u0644\u0645\u062A\u0635\u0644\u0648\u0646" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-online-list", children: onlineFriends.map((user) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-online-item", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-online-meta", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-online-avatar-wrap", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar, { name: user.username, src: user.avatar, size: 42 }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "online-indicator" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: user.username }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: user.profile?.activity_tagline || "\u0645\u062A\u0635\u0644 \u0627\u0644\u0622\u0646" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "yam-chat-shortcut", children: "\u{1F4AC}" })
          ] }, user.username)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "yam-side-card promo", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "promo-visual", children: "\u{1F3AE}" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0645\u062C\u062A\u0645\u0639 \u064A\u0627\u0645\u0634\u0627\u062A" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u0627\u0643\u062A\u0634\u0641 \u0645\u062D\u062A\u0648\u0649 \u062C\u062F\u064A\u062F \u0648\u062A\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0623\u0635\u062F\u0642\u0627\u0621 \u062C\u062F\u062F \u0648\u0627\u0633\u062A\u0645\u062A\u0639 \u0628\u062A\u062C\u0631\u0628\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0641\u0631\u064A\u062F\u0629." }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "yam-primary-wide", children: "\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0622\u0646" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "yam-suggest-list", children: suggestedUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-suggest-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "yam-online-meta", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Avatar, { name: user.username, src: user.avatar, size: 42 }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: user.username }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: user.email || "Gaming creator" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "yam-follow-inline", onClick: () => followMutation.mutate(user.username), children: "\u0645\u062A\u0627\u0628\u0639\u0629" })
          ] }, user.username)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: `
        .yam-feed-page {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 18px;
          padding: 18px;
        }
        @media (max-width: 1023px) {
          .yam-feed-page {
            grid-template-columns: 1fr;
            padding: 10px;
          }
          .yam-feed-right-column {
            display: none;
          }
        }
        .yam-feed-main-column { min-width: 0; display: grid; gap: 16px; }
        .yam-feed-right-column { display: grid; gap: 16px; align-content: start; }
        .yam-feed-composer-shell,
        .yam-side-card,
        .yam-feed-post-card {
          border-radius: 28px;
          background: rgba(7, 12, 24, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 24px 50px rgba(2,6,23,0.24);
          overflow: hidden;
        }
        .yam-feed-composer-shell { padding: 18px; }
        .yam-feed-composer-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .yam-feed-composer-prompt strong { display: block; font-size: 18px; }
        .yam-feed-composer-prompt span { color: #94a3b8; font-size: 13px; }
        .yam-feed-sort-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          padding: 0 8px;
          font-size: 14px;
        }
        .yam-refresh-btn {
          margin-inline-start: auto;
          border: none;
          background: rgba(124,58,237,0.18);
          color: white;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 700;
        }
        .yam-feed-posts-stack { display: grid; gap: 16px; }
        .yam-feed-post-card { padding: 18px; display: grid; gap: 16px; }
        .yam-post-header,
        .yam-post-actions,
        .yam-side-card-head,
        .yam-online-item,
        .yam-suggest-row,
        .yam-trending-item,
        .yam-post-author,
        .yam-online-meta { display: flex; align-items: center; gap: 12px; }
        .yam-post-header, .yam-side-card-head, .yam-trending-item, .yam-suggest-row, .yam-online-item {
          justify-content: space-between;
        }
        .yam-post-author-line { display: flex; align-items: center; gap: 6px; font-size: 16px; }
        .verify-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #3b82f6;
          color: white;
          font-size: 11px;
          font-weight: 900;
        }
        .yam-post-copy {
          color: #dbe4ff;
          line-height: 1.9;
          white-space: pre-wrap;
        }
        .yam-feed-main-media {
          width: 100%;
          max-height: 430px;
          object-fit: cover;
          border-radius: 24px;
          display: block;
        }
        .yam-feed-media-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(200px, 0.9fr);
          gap: 10px;
          min-height: 320px;
        }
        .yam-feed-media-grid.two .secondary-stack { grid-template-rows: 1fr; }
        .yam-feed-media-grid img,
        .yam-feed-media-grid video,
        .yam-trending-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .yam-feed-media-grid .primary,
        .yam-feed-fallback-media { border-radius: 22px; min-height: 320px; }
        .secondary-stack { display: grid; gap: 10px; }
        .secondary-cell { position: relative; border-radius: 22px; overflow: hidden; min-height: 155px; }
        .media-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(6,10,18,0.46);
          color: white;
          font-size: 30px;
          font-weight: 900;
          backdrop-filter: blur(4px);
        }
        .yam-feed-fallback-media {
          padding: 28px;
          background: radial-gradient(circle at top, rgba(139,92,246,0.26), transparent 50%), linear-gradient(135deg, rgba(10,18,38,0.96), rgba(7,12,24,1));
          display: grid;
          align-content: center;
          gap: 18px;
          color: white;
        }
        .monitor-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .monitor-grid div { min-height: 110px; border-radius: 18px; background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.34)); border: 1px solid rgba(255,255,255,0.08); }
        .yam-post-actions { justify-content: flex-start; flex-wrap: wrap; }
        .yam-react-btn, .yam-icon-ghost, .yam-chat-shortcut, .yam-follow-inline {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.04);
          color: white;
          border-radius: 14px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }
        .yam-icon-ghost, .yam-chat-shortcut { width: 42px; height: 42px; padding: 0; justify-content: center; }
        .yam-react-btn.save { margin-inline-start: auto; }
        .yam-side-card { padding: 18px; display: grid; gap: 14px; }
        .yam-side-card-head h3 { margin: 0; font-size: 18px; }
        .yam-side-card-head span { color: #8b5cf6; font-size: 13px; font-weight: 700; }
        .yam-story-row { display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
        .yam-story-row::-webkit-scrollbar { height: 5px; }
        .yam-story-user { display: grid; justify-items: center; gap: 8px; min-width: 72px; }
        .yam-story-user small { color: #cbd5e1; }
        .yam-story-ring {
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(236,72,153,0.88), rgba(124,58,237,0.88));
        }
        .yam-story-ring.live { background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(168,85,247,0.88)); }
        .yam-story-live {
          padding: 4px 8px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 900;
          margin-top: -16px;
          z-index: 1;
        }
        .yam-add-story {
          min-width: 72px;
          min-height: 72px;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.02);
          color: white;
          display: grid;
          place-items: center;
          gap: 4px;
          padding: 0;
          font-size: 26px;
        }
        .yam-add-story small { font-size: 12px; color: #94a3b8; }
        .yam-trending-list, .yam-online-list, .yam-suggest-list { display: grid; gap: 12px; }
        .yam-trending-item, .yam-online-item, .yam-suggest-row {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
          gap: 12px;
        }
        .yam-trending-item p { margin: 6px 0 8px; color: #cbd5e1; line-height: 1.7; }
        .yam-trending-thumb {
          width: 92px;
          height: 92px;
          border-radius: 18px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.22));
          display: grid;
          place-items: center;
          font-size: 24px;
        }
        .yam-trending-stats, .yam-online-item small, .yam-suggest-row small { color: #94a3b8; font-size: 13px; }
        .yam-online-avatar-wrap { position: relative; }
        .online-indicator {
          position: absolute;
          bottom: 1px;
          inset-inline-end: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid rgba(7,12,24,0.94);
        }
        .promo { text-align: center; }
        .promo-visual {
          width: 92px;
          height: 92px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          margin: 0 auto 8px;
          font-size: 42px;
          background: linear-gradient(135deg, rgba(124,58,237,0.26), rgba(99,102,241,0.14));
        }
        .promo p { margin: 0; color: #94a3b8; line-height: 1.8; }
        .yam-primary-wide, .yam-follow-inline {
          border: none;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
        }
        .yam-follow-inline { padding: 10px 14px; }
        .yam-empty-block {
          border-radius: 24px;
          background: rgba(7,12,24,0.88);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 24px;
          text-align: center;
          color: #94a3b8;
        }
        @media (max-width: 1280px) {
          .yam-feed-page { grid-template-columns: minmax(0, 1fr) 320px; }
        }
        @media (max-width: 1024px) {
          .yam-feed-page { grid-template-columns: 1fr; }
          .yam-feed-right-column { order: -1; }
        }
        @media (max-width: 680px) {
          .yam-feed-page { padding: 12px; }
          .yam-feed-media-grid { grid-template-columns: 1fr; }
          .yam-react-btn.save { margin-inline-start: 0; }
          .yam-trending-thumb { width: 74px; height: 74px; }
        }
      ` })
  ] });
}
export {
  Feed as default
};
