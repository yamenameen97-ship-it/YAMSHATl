import { j as jsxRuntimeExports, u as useNavigate, p as useQueryClient, f as getCurrentUsername, v as useChatStore, w as selectUnreadTotal, r as reactExports, N as NavLink, x as logger } from "../index-DuXBJv5q.js";
import { u as useQuery, M as MainLayout, g as getNotifications } from "./MainLayout-CsZ3tvBx.js";
import { u as useFeed, a as useMutation, P as PostComposer } from "./useFeed-D74BbOte.js";
import { E as ErrorState } from "./ErrorState-E6_7voYz.js";
import { E as EmptyState } from "./EmptyState-CdKtrcN-.js";
import { d as deletePost, l as likePost } from "./posts-1f9mZwS7.js";
import { f as followUser, g as getUsers } from "./users-yjlw8KOa.js";
import { g as getLiveRooms } from "./live-b1Kum3Sy.js";
import { r as rankSuggestedUsers, b as buildTrendingHashtags } from "./recommendationService-CaN6KIfu.js";
import { b as formatCompactNumber, i as initialsFromName, a as avatarGradient, f as formatTimeAgo } from "./YamshatDesign-C0ca_MnA.js";
import "./Card-qq68bGlj.js";
import "./proxy-BFepwXo2.js";
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
const LEFT_NAV_ITEMS = [
  { to: "/", label: "الرئيسية", icon: "⌂" },
  { to: "/search", label: "الاستكشاف", icon: "⌕" },
  { to: "/groups", label: "المجموعات", icon: "◫" },
  { to: "/inbox", label: "الرسائل", icon: "✉", badgeType: "messages" },
  { to: "/notifications", label: "الإشعارات", icon: "🔔", badgeType: "notifications" },
  { to: "/profile", label: "الملف الشخصي", icon: "◌" },
  { to: "/settings", label: "الإعدادات", icon: "⚙" }
];
const TOP_ACTIONS = [
  { to: "/", label: "الرئيسية", icon: "⌂" },
  { to: "/users", label: "الأصدقاء", icon: "👥" },
  { to: "/inbox", label: "الرسائل", icon: "✉", badgeType: "messages" },
  { to: "/notifications", label: "الإشعارات", icon: "🔔", badgeType: "notifications" }
];
const SERVICE_SHORTCUTS = [
  { title: "الدردشة", icon: "💬" },
  { title: "المكالمات", icon: "📞" },
  { title: "المجموعات", icon: "👥" },
  { title: "الأخبار", icon: "📰" },
  { title: "الفعاليات", icon: "🏟️" },
  { title: "البث المباشر", icon: "📺" },
  { title: "الملفات", icon: "📁" },
  { title: "المدونة", icon: "✍️" },
  { title: "السوق", icon: "🛍️" }
];
const QUICK_COMPOSER_ACTIONS = ["صورة", "فيديو", "استطلاع", "نشاط"];
const FALLBACK_SUGGESTIONS = [
  { username: "UIUX.design", handle: "@uiux.design", followers_count: 12e3, is_verified: true },
  { username: "tech.arabic", handle: "@tech.arabic", followers_count: 8700, is_verified: false },
  { username: "web.developer", handle: "@web.developer", followers_count: 6200, is_verified: true }
];
function Avatar({ name, src, size = 46, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    border: ring ? "2px solid rgba(139,92,246,0.78)" : "1px solid rgba(255,255,255,0.08)",
    boxShadow: ring ? "0 0 0 4px rgba(139,92,246,0.14)" : "none",
    flexShrink: 0,
    background: "rgba(15,23,42,0.8)"
  };
  return src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, style }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient(name) }, children: initialsFromName(name).slice(0, 1) });
}
function mediaListFromPost(post) {
  if (Array.isArray(post?.media_urls) && post.media_urls.length) return post.media_urls;
  if (Array.isArray(post?.images) && post.images.length) return post.images;
  if (post?.image_url) return [post.image_url];
  if (post?.media_url) return [post.media_url];
  if (post?.media) return [post.media];
  return [];
}
function FeedMedia({ post, media }) {
  if (!media.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-brand-fallback", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-brand-symbol", children: "Y" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.content || "YAMSHAT" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: media[0], alt: post.content || post.username || "Yamshat post", className: "desktop-post-media" });
}
function DesktopPostCard({ post, onLike, onDelete, localLikeState, onToggleLocalLike }) {
  const media = mediaListFromPost(post);
  const isLocalBrandPost = post.id === "yamshat-featured-brand-post";
  const likes = isLocalBrandPost ? localLikeState.likes : Number(post.likes_count ?? post.like_count ?? post.likes ?? 0);
  const comments = Number(post.comments_count ?? post.comment_count ?? Math.max(12, Math.floor(likes / 4.2)));
  const shares = Number(post.share_count ?? post.shares ?? Math.max(6, Math.floor(likes / 8.3)));
  const userAvatar = post.user_avatar || post.avatar || "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: `desktop-post-card ${isLocalBrandPost ? "featured" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-author", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: post.username || "Yamshat", src: userAvatar, size: 50, ring: Boolean(post.is_brand_seed) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-author-line", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.username || "Yamshat" }),
            post.is_verified || post.is_brand_seed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "verify-dot", children: "✓" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: post.created_at ? formatTimeAgo(post.created_at) : "الآن" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-tools", children: [
        post.is_brand_seed ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "desktop-post-badge", children: "منشور مثبت" }) : null,
        !isLocalBrandPost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "desktop-ghost-btn", onClick: () => onDelete(post.id), children: "⋯" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "desktop-ghost-btn", children: "⋯" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-post-copy", children: post.content || "شارك أفكارك مع مجتمع يام شات." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeedMedia, { post, media }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-meta-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-reactions", children: [
        "🟣 💜 🔥 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCompactNumber(likes) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-stats", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          formatCompactNumber(comments),
          " تعليق"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          formatCompactNumber(shares),
          " مشاركة"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-post-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `desktop-action-btn ${isLocalBrandPost && localLikeState.liked ? "active" : ""}`, onClick: () => isLocalBrandPost ? onToggleLocalLike() : onLike(post.id), children: [
        "❤ ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCompactNumber(likes) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "desktop-action-btn", children: [
        "💬 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCompactNumber(comments) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "desktop-action-btn", children: [
        "⤴ ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCompactNumber(shares) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "desktop-action-btn bookmark", children: "⌑" })
    ] })
  ] });
}
function FeedEnhanced() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUsername = getCurrentUsername();
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const [searchText, setSearchText] = reactExports.useState("");
  const [localBrandPost, setLocalBrandPost] = reactExports.useState({ likes: 532, liked: false });
  const { posts = [], isLoading, isError, refetch } = useFeed({ limit: 10, pollingInterval: 25e3 });
  const { data: users = [] } = useQuery({
    queryKey: ["feed-desktop-users"],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 6e4
  });
  const { data: liveRooms = [] } = useQuery({
    queryKey: ["feed-desktop-live"],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 2e4,
    refetchInterval: 25e3
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["feed-desktop-notifications"],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15e3,
    refetchInterval: 2e4
  });
  const unreadNotificationCount = reactExports.useMemo(
    () => Array.isArray(notifications) ? notifications.filter((item) => !item.is_read).length : 0,
    [notifications]
  );
  const suggestedUsers = reactExports.useMemo(() => {
    const ranked = rankSuggestedUsers(Array.isArray(users) && users.length ? users : FALLBACK_SUGGESTIONS, currentUsername);
    return ranked.slice(0, 3);
  }, [users, currentUsername]);
  const trendingTopics = reactExports.useMemo(() => {
    const localTopics = buildTrendingHashtags(posts).slice(0, 3);
    if (localTopics.length) return localTopics;
    return [
      { tag: "#يام_شات", count: 12400 },
      { tag: "#تقنية", count: 8700 },
      { tag: "#تصميم", count: 6200 }
    ];
  }, [posts]);
  const stats = reactExports.useMemo(() => ({
    posts: Number(posts.length || 128),
    followers: Number(users?.length || 15200),
    following: Number(Math.max(342, Math.floor((users?.length || 342) / 2)))
  }), [posts.length, users]);
  const featuredBrandPost = reactExports.useMemo(() => ({
    id: "yamshat-featured-brand-post",
    username: "Yamshat",
    user_avatar: "/icons/icon-192.png",
    content: "هيا لنجرب منصة يام شات",
    media_urls: ["/brand/yamshat-logo.jpg"],
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    likes_count: localBrandPost.likes,
    comments_count: 128,
    share_count: 64,
    is_verified: true,
    is_brand_seed: true,
    hashtags: ["يام_شات", "واجهة", "تصميم"]
  }), [localBrandPost.likes]);
  const displayPosts = reactExports.useMemo(() => {
    const uniquePosts = posts.filter((post) => post.id !== featuredBrandPost.id);
    return [featuredBrandPost, ...uniquePosts];
  }, [featuredBrandPost, posts]);
  const liveHighlights = reactExports.useMemo(() => {
    const rooms = Array.isArray(liveRooms) ? liveRooms.slice(0, 3) : [];
    if (rooms.length) return rooms;
    return [
      { id: "yam-live-1", title: "Yamshat Community Space", host: "Yamshat", viewer_count: 482 },
      { id: "yam-live-2", title: "Design Review", host: "UIUX.design", viewer_count: 219 }
    ];
  }, [liveRooms]);
  const likeMutation = useMutation({
    mutationFn: likePost,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed-data"] }),
    onError: (error, postId) => logger.warn("Like failed", { postId, error: error?.message })
  });
  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed-data"] }),
    onError: (error, postId) => logger.warn("Delete failed", { postId, error: error?.message })
  });
  const followMutation = useMutation({
    mutationFn: followUser,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed-desktop-users"] })
  });
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchText.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };
  const handleToggleLocalLike = () => {
    setLocalBrandPost((prev) => ({
      liked: !prev.liked,
      likes: prev.liked ? prev.likes - 1 : prev.likes + 1
    }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { hideNav: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-feed-shell", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "desktop-feed-left-rail", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-left-brand-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-left-brand-mark", children: "Y" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-left-brand-title", children: "YAMSHAT" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-left-brand-subtitle", children: "منصة اجتماعية بطابع عصري" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "desktop-left-nav", children: LEFT_NAV_ITEMS.map((item) => {
          const badge = item.badgeType === "messages" ? unreadInboxCount : item.badgeType === "notifications" ? unreadNotificationCount : 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, className: ({ isActive }) => `desktop-left-link ${isActive ? "active" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "desktop-left-icon", children: item.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "desktop-left-label", children: item.label }),
            badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "desktop-left-badge", children: badge }) : null
          ] }, item.to);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "desktop-new-post-btn", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }), children: "＋ منشور جديد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-profile-summary-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-profile-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: currentUsername || "Yamshat", src: "/icons/icon-192.png", size: 48, ring: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: currentUsername || "Yamshat" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
                "@",
                currentUsername || "yamshat"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-profile-stats", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(stats.posts) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المنشورات" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(stats.followers) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المتابعون" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(stats.following) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المتابَعون" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "desktop-feed-center-column", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "desktop-feed-topbar", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "desktop-search-box", onSubmit: handleSearchSubmit, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "desktop-search-icon", children: "⌕" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "search",
                placeholder: "بحث في يام شات",
                value: searchText,
                onChange: (event) => setSearchText(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-top-actions", children: [
            TOP_ACTIONS.map((item) => {
              const badge = item.badgeType === "messages" ? unreadInboxCount : item.badgeType === "notifications" ? unreadNotificationCount : 0;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, className: ({ isActive }) => `desktop-top-action ${isActive ? "active" : ""}`, title: item.label, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.icon }),
                badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: badge }) : null
              ] }, item.to);
            }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: "/profile", className: "desktop-top-profile-pill", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: currentUsername || "Y", size: 36 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: currentUsername || "Yamshat" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-composer-hero-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-composer-hero-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: currentUsername || "You", size: 54, ring: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "ماذا يحدث يا مبدع؟" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "صمّم منشورك ليظهر بشكل أنيق على نسخة الويب للكمبيوتر." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "desktop-publish-glow", onClick: () => window.scrollTo({ top: 280, behavior: "smooth" }), children: "نشر" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-composer-hero-actions", children: QUICK_COMPOSER_ACTIONS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "desktop-mini-chip", children: item }, item)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PostComposer, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-feed-posts-stack", children: [
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(FeedSkeleton, { count: 3 }) : null,
          isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { onRetry: refetch }) : null,
          !isLoading && !isError && !displayPosts.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: "لا توجد منشورات حالياً", description: "ابدأ بنشر أول محتوى لك." }) : null,
          !isLoading && !isError && displayPosts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            DesktopPostCard,
            {
              post,
              onLike: (postId) => likeMutation.mutate(postId),
              onDelete: (postId) => deleteMutation.mutate(postId),
              localLikeState: localBrandPost,
              onToggleLocalLike: handleToggleLocalLike
            },
            post.id
          ))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "desktop-feed-right-rail", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "desktop-side-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-side-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "الخدمات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(NavLink, { to: "/search", style: { fontSize: "12px", color: "#8b5cf6", textDecoration: "none" }, children: "عرض الكل" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-services-grid", children: SERVICE_SHORTCUTS.map((service) => {
            const getServiceRoute = (title) => {
              switch (title) {
                case "الدردشة":
                  return "/inbox";
                case "المكالمات":
                  return "/inbox";
                case "المجموعات":
                  return "/groups";
                case "البث المباشر":
                  return "/live";
                default:
                  return "/search";
              }
            };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: getServiceRoute(service.title), className: "desktop-service-tile", style: { textDecoration: "none" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "desktop-service-icon", children: service.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: service.title })
            ] }, service.title);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "desktop-side-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-side-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "اقتراحات المتابعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-suggest-list", children: suggestedUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-suggest-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-suggest-meta", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: user.username, src: user.avatar, size: 44 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: user.handle || user.email || user.recommendation_reason || "@yamshat.creator" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "desktop-follow-btn", onClick: () => followMutation.mutate(user.username), children: "تابع" })
          ] }, user.username)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "desktop-side-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-side-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "المواضيع الرائجة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-trend-list", children: trendingTopics.map((topic) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-trend-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: topic.tag }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
                formatCompactNumber(topic.count || 0),
                " منشور"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "desktop-trend-pulse" })
          ] }, topic.tag)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "desktop-side-card compact", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-side-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "نشاط مباشر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              liveHighlights.length,
              " الآن"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "desktop-live-list", children: liveHighlights.map((room) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "desktop-live-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: room.title || room.host || room.username || "Yamshat Live" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: room.host || room.username || "Yamshat" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "desktop-live-pill", children: [
              formatCompactNumber(room.viewer_count || 0),
              " LIVE"
            ] })
          ] }, room.id)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .desktop-feed-shell {
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 340px;
          gap: 22px;
          padding: 22px;
          box-sizing: border-box;
          background:
            radial-gradient(circle at top left, rgba(139,92,246,0.18), transparent 30%),
            linear-gradient(180deg, #050816 0%, #070c18 46%, #050915 100%);
          color: #eff4ff;
        }

        @media (max-width: 1200px) {
          .desktop-feed-shell {
            grid-template-columns: 280px 1fr;
          }
          .desktop-feed-right-rail {
            display: none;
          }
        }

        @media (max-width: 900px) {
          .desktop-feed-shell {
            grid-template-columns: 1fr;
            padding: 10px;
          }
          .desktop-feed-left-rail {
            display: none;
          }
        }

        .desktop-feed-left-rail,
        .desktop-feed-right-rail {
          position: sticky;
          top: 22px;
          align-self: start;
          display: grid;
          gap: 16px;
        }

        .desktop-feed-center-column {
          min-width: 0;
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .desktop-left-brand-card,
        .desktop-composer-hero-card,
        .desktop-post-card,
        .desktop-side-card,
        .desktop-profile-summary-card,
        .desktop-feed-topbar {
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(7, 12, 24, 0.88);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.36);
          backdrop-filter: blur(18px);
        }

        .desktop-feed-topbar {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          justify-content: space-between;
          position: sticky;
          top: 18px;
          z-index: 12;
        }

        .desktop-search-box {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          min-height: 52px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .desktop-search-box input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #eff4ff;
          font-size: 14px;
          font-family: inherit;
        }

        .desktop-search-box input::placeholder,
        .desktop-search-icon,
        .desktop-left-brand-subtitle,
        .desktop-post-author small,
        .desktop-suggest-item small,
        .desktop-trend-item small,
        .desktop-live-item small,
        .desktop-profile-head small,
        .desktop-profile-stats span,
        .desktop-composer-hero-head span,
        .desktop-post-stats span {
          color: #94a3b8;
        }

        .desktop-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .desktop-top-action,
        .desktop-top-profile-pill,
        .desktop-ghost-btn,
        .desktop-new-post-btn,
        .desktop-action-btn,
        .desktop-follow-btn,
        .desktop-publish-glow,
        .desktop-mini-chip,
        .desktop-service-tile {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.04);
          color: #eff4ff;
          border-radius: 16px;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .desktop-top-action {
          width: 48px;
          height: 48px;
          display: inline-grid;
          place-items: center;
          position: relative;
          font-size: 18px;
          text-decoration: none;
        }

        .desktop-top-action.active,
        .desktop-top-action:hover,
        .desktop-left-link.active,
        .desktop-left-link:hover,
        .desktop-service-tile:hover,
        .desktop-action-btn:hover,
        .desktop-follow-btn:hover,
        .desktop-new-post-btn:hover,
        .desktop-mini-chip:hover,
        .desktop-publish-glow:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(99,102,241,0.14));
          border-color: rgba(167,139,250,0.34);
          box-shadow: 0 16px 28px rgba(124,58,237,0.16);
          transform: translateY(-1px);
        }

        .desktop-top-action small {
          position: absolute;
          top: -4px;
          inset-inline-start: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 800;
        }

        .desktop-top-profile-pill {
          min-height: 48px;
          padding: 0 12px 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-weight: 700;
        }

        .desktop-left-brand-card {
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .desktop-left-brand-mark,
        .desktop-brand-symbol {
          width: 58px;
          height: 58px;
          border-radius: 20px;
          display: grid;
          place-items: center;
          color: white;
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6 55%, #a855f7);
          box-shadow: 0 20px 30px rgba(124,58,237,0.25);
        }

        .desktop-left-brand-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .desktop-left-nav,
        .desktop-feed-posts-stack,
        .desktop-suggest-list,
        .desktop-trend-list,
        .desktop-live-list {
          display: grid;
          gap: 12px;
        }

        .desktop-left-link {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 56px;
          padding: 0 16px;
          text-decoration: none;
          color: #dbe4ff;
          border-radius: 18px;
          border: 1px solid transparent;
          background: transparent;
        }

        .desktop-left-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          font-size: 17px;
          flex-shrink: 0;
        }

        .desktop-left-label {
          font-weight: 800;
        }

        .desktop-left-badge {
          margin-inline-start: auto;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: #8b5cf6;
          display: grid;
          place-items: center;
          color: white;
          font-size: 12px;
          font-weight: 800;
        }

        .desktop-new-post-btn {
          min-height: 54px;
          padding: 0 16px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 20px 30px rgba(124,58,237,0.24);
        }

        .desktop-profile-summary-card {
          padding: 18px;
          display: grid;
          gap: 16px;
        }

        .desktop-profile-head,
        .desktop-profile-stats,
        .desktop-post-head,
        .desktop-post-author,
        .desktop-post-author-line,
        .desktop-post-tools,
        .desktop-post-meta-row,
        .desktop-post-actions,
        .desktop-composer-hero-head,
        .desktop-side-head,
        .desktop-suggest-item,
        .desktop-suggest-meta,
        .desktop-live-item,
        .desktop-trend-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .desktop-profile-stats {
          justify-content: space-between;
        }

        .desktop-profile-stats div {
          display: grid;
          gap: 4px;
          text-align: center;
          flex: 1;
          padding: 12px 8px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
        }

        .desktop-profile-stats strong {
          font-size: 18px;
        }

        .desktop-composer-hero-card {
          padding: 18px;
          display: grid;
          gap: 14px;
        }

        .desktop-composer-hero-head {
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        .desktop-composer-hero-head strong {
          display: block;
          font-size: 22px;
          margin-bottom: 4px;
        }

        .desktop-publish-glow {
          min-height: 46px;
          padding: 0 18px;
          cursor: pointer;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 18px 28px rgba(124,58,237,0.22);
        }

        .desktop-composer-hero-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .desktop-mini-chip {
          min-height: 40px;
          padding: 0 14px;
          cursor: pointer;
          font-weight: 700;
        }

        .desktop-post-card {
          padding: 18px;
          display: grid;
          gap: 16px;
        }

        .desktop-post-card.featured {
          background:
            radial-gradient(circle at top, rgba(124,58,237,0.18), transparent 38%),
            rgba(7, 12, 24, 0.92);
        }

        .verify-dot,
        .desktop-post-badge,
        .desktop-live-pill {
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          font-weight: 900;
        }

        .verify-dot {
          width: 18px;
          height: 18px;
          background: #3b82f6;
          color: white;
          font-size: 11px;
        }

        .desktop-post-badge {
          min-height: 30px;
          padding: 0 12px;
          background: rgba(139,92,246,0.14);
          color: #d8b4fe;
          border: 1px solid rgba(167,139,250,0.22);
          font-size: 12px;
        }

        .desktop-ghost-btn {
          width: 42px;
          height: 42px;
          display: inline-grid;
          place-items: center;
          cursor: pointer;
        }

        .desktop-post-head,
        .desktop-post-meta-row,
        .desktop-side-head,
        .desktop-suggest-item,
        .desktop-live-item,
        .desktop-trend-item {
          justify-content: space-between;
        }

        .desktop-post-copy {
          font-size: 17px;
          line-height: 1.95;
          color: #eef2ff;
          white-space: pre-wrap;
        }

        .desktop-post-media,
        .desktop-brand-fallback {
          width: 100%;
          min-height: 320px;
          max-height: 560px;
          border-radius: 24px;
          overflow: hidden;
          object-fit: cover;
          display: block;
          background: linear-gradient(180deg, rgba(22,28,45,0.95), rgba(5,8,22,1));
        }

        .desktop-brand-fallback {
          display: grid;
          place-items: center;
          gap: 14px;
          padding: 30px;
          text-align: center;
        }

        .desktop-brand-fallback strong {
          font-size: 28px;
          letter-spacing: 0.08em;
        }

        .desktop-post-meta-row {
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 0;
          color: #cbd5e1;
          flex-wrap: wrap;
        }

        .desktop-post-reactions,
        .desktop-post-stats {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .desktop-post-actions {
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        .desktop-action-btn {
          min-height: 44px;
          padding: 0 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
        }

        .desktop-action-btn.active {
          background: rgba(236,72,153,0.16);
          border-color: rgba(236,72,153,0.28);
          color: #f9a8d4;
        }

        .desktop-action-btn.bookmark {
          margin-inline-start: auto;
        }

        .desktop-side-card {
          padding: 18px;
          display: grid;
          gap: 14px;
        }

        .desktop-side-card.compact {
          gap: 12px;
        }

        .desktop-side-head h3 {
          margin: 0;
          font-size: 19px;
        }

        .desktop-side-head span {
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 800;
        }

        .desktop-services-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .desktop-service-tile {
          min-height: 96px;
          padding: 14px 10px;
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 10px;
          cursor: pointer;
        }

        .desktop-service-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 21px;
          background: rgba(124,58,237,0.14);
          color: #d8b4fe;
        }

        .desktop-service-tile strong {
          font-size: 13px;
          text-align: center;
        }

        .desktop-suggest-item,
        .desktop-trend-item,
        .desktop-live-item {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
        }

        .desktop-follow-btn {
          min-height: 40px;
          padding: 0 14px;
          cursor: pointer;
          font-weight: 900;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
        }

        .desktop-trend-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 0 8px rgba(139,92,246,0.14);
          flex-shrink: 0;
        }

        .desktop-live-pill {
          min-height: 30px;
          padding: 0 10px;
          background: rgba(239,68,68,0.12);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,0.18);
          font-size: 12px;
        }

        @media (max-width: 1380px) {
          .desktop-feed-shell {
            grid-template-columns: 250px minmax(0, 1fr) 300px;
            gap: 18px;
            padding: 18px;
          }
        }

        @media (max-width: 1180px) {
          .desktop-feed-shell {
            grid-template-columns: 250px minmax(0, 1fr);
          }

          .desktop-feed-right-rail {
            display: none;
          }
        }

        @media (max-width: 920px) {
          .desktop-feed-shell {
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .desktop-feed-left-rail,
          .desktop-feed-right-rail {
            display: none;
          }

          .desktop-feed-topbar {
            position: static;
            flex-direction: column;
            align-items: stretch;
          }

          .desktop-top-actions {
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .desktop-composer-hero-head {
            align-items: flex-start;
          }
        }

        @media (max-width: 640px) {
          .desktop-feed-shell {
            padding: 10px;
          }

          .desktop-post-action.bookmark,
          .desktop-action-btn.bookmark {
            margin-inline-start: 0;
          }

          .desktop-post-card,
          .desktop-side-card,
          .desktop-composer-hero-card,
          .desktop-feed-topbar {
            border-radius: 22px;
          }

          .desktop-top-profile-pill span {
            display: none;
          }

          .desktop-post-media,
          .desktop-brand-fallback {
            min-height: 240px;
          }
        }
      ` })
  ] });
}
export {
  FeedEnhanced as default
};
