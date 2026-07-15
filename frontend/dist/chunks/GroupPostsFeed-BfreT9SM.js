import { bz as useParams, bE as useToast, a7 as getCurrentUsername, b0 as reactExports, as as jsxRuntimeExports, h as MainLayout } from "../index-D_Nx8mZz.js";
import { G as GroupSubHeader } from "./GroupSubHeader-CDQWLrYF.js";
import { t as getGroupPosts, p as getGroupDetails, e as createGroupPost, E as pinGroupPost, j as deleteGroupPost } from "./groups-BgR9_Dnk.js";
/* empty css                         */
const formatTime = (t) => {
  if (!t) return "";
  try {
    return new Date(t).toLocaleString("ar-EG");
  } catch {
    return "";
  }
};
const GroupPostsFeed = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [loading, setLoading] = reactExports.useState(true);
  const [posts, setPosts] = reactExports.useState([]);
  const [group, setGroup] = reactExports.useState(null);
  const [composer, setComposer] = reactExports.useState("");
  const [posting, setPosting] = reactExports.useState(false);
  const [showComposer, setShowComposer] = reactExports.useState(false);
  const taRef = reactExports.useRef(null);
  const role = reactExports.useMemo(() => {
    const m = group?.members?.find((x) => (x.username || x.user_id) === currentUser);
    return m?.role || "member";
  }, [group, currentUser]);
  const canPin = role === "owner" || role === "admin" || role === "moderator";
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [postsRes, gRes] = await Promise.allSettled([
          getGroupPosts(groupId, { limit: 50 }),
          getGroupDetails(groupId)
        ]);
        if (cancelled) return;
        if (postsRes.status === "fulfilled") {
          const list = Array.isArray(postsRes.value?.data) ? postsRes.value.data : postsRes.value?.data?.items || postsRes.value?.data?.posts || [];
          const sorted = [...list].sort((a, b) => {
            if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
            return new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0);
          });
          setPosts(sorted);
        }
        if (gRes.status === "fulfilled") setGroup(gRes.value?.data || null);
      } catch (e) {
        console.warn(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);
  const handleCreate = async () => {
    const text = composer.trim();
    if (!text || posting) return;
    setPosting(true);
    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: text,
      author: currentUser,
      author_name: currentUser,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      pinned: false,
      _pending: true
    };
    setPosts((p) => [optimistic, ...p]);
    setComposer("");
    try {
      const res = await createGroupPost(groupId, { content: text });
      const real = res?.data?.post || res?.data || optimistic;
      setPosts((p) => p.map((x) => x.id === optimistic.id ? { ...real, _pending: false } : x));
      pushToast?.({ type: "success", title: "نشر", description: "تم نشر المنشور." });
      setShowComposer(false);
    } catch (e) {
      setPosts((p) => p.filter((x) => x.id !== optimistic.id));
      setComposer(text);
      pushToast?.({ type: "error", title: "تعذر النشر", description: e?.message || "حاول مرة أخرى" });
    } finally {
      setPosting(false);
    }
  };
  const handleDelete = async (post) => {
    if (!confirm("حذف هذا المنشور؟")) return;
    const prev = posts;
    setPosts((p) => p.filter((x) => x.id !== post.id));
    try {
      await deleteGroupPost(groupId, post.id);
      pushToast?.({ type: "success", title: "تم الحذف" });
    } catch (e) {
      setPosts(prev);
      pushToast?.({ type: "error", title: "تعذر الحذف" });
    }
  };
  const handlePin = async (post) => {
    const target = !post.pinned;
    setPosts((p) => p.map((x) => x.id === post.id ? { ...x, pinned: target } : x).sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }));
    try {
      await pinGroupPost(groupId, post.id, target);
      pushToast?.({ type: "success", title: target ? "تم التثبيت" : "تم إلغاء التثبيت" });
    } catch (e) {
      setPosts((p) => p.map((x) => x.id === post.id ? { ...x, pinned: !target } : x));
      pushToast?.({ type: "error", title: "تعذر التحديث" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GroupSubHeader,
      {
        title: `منشورات ${group?.name || "المجموعة"}`,
        subtitle: `${posts.length} منشور`,
        action: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "yamg-btn",
            onClick: () => {
              setShowComposer((v) => !v);
              setTimeout(() => taRef.current?.focus(), 50);
            },
            children: showComposer ? "✕ إغلاق" : "+ منشور جديد"
          }
        )
      }
    ),
    showComposer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          ref: taRef,
          className: "yamg-textarea",
          placeholder: "بماذا تفكر؟ شارك مع أعضاء المجموعة...",
          value: composer,
          onChange: (e) => setComposer(e.target.value),
          dir: "rtl"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-row", style: { justifyContent: "flex-end", marginTop: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn secondary", onClick: () => {
          setComposer("");
          setShowComposer(false);
        }, children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yamg-btn", disabled: !composer.trim() || posting, onClick: handleCreate, children: posting ? "...جاري النشر" : "نشر" })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-spinner" }),
      "جاري التحميل..."
    ] }) : posts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-empty", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "📝" }),
      "لا توجد منشورات بعد. كن أول من ينشر!"
    ] }) : posts.map((post) => {
      const isMine = (post.author || post.user_id) === currentUser;
      const showPin = canPin;
      const showDelete = isMine || canPin;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "article",
        {
          className: "yamg-card hover",
          style: post.pinned ? { borderColor: "rgba(245,158,11,.4)" } : {},
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-post-author", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || "u"}`,
                  alt: "",
                  loading: "lazy"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0, overflow: "hidden" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-post-name", title: post.author_name || post.author, children: post.author_name || post.author || "مستخدم" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-post-time", children: formatTime(post.created_at || post.timestamp) })
              ] }),
              post.pinned && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag warning", style: { flexShrink: 0 }, children: "📌" }),
              post._pending && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yamg-tag", style: { flexShrink: 0 }, children: "…" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-post-body", children: post.content || post.text || post.body }),
            (post.media_url || post.image_url) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-post-media", children: post.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: post.media_url, controls: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.media_url || post.image_url, alt: "", loading: "lazy" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamg-post-actions", role: "group", "aria-label": "إجراءات المنشور", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", "aria-label": "إعجاب", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "👍" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yamg-post-actions-count", children: [
                  " ",
                  post.likes_count || 0
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", "aria-label": "تعليقات", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "💬" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yamg-post-actions-count", children: [
                  " ",
                  post.comments_count || 0
                ] })
              ] }),
              showPin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => handlePin(post), "aria-label": post.pinned ? "إلغاء التثبيت" : "تثبيت", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: post.pinned ? "📍" : "📌" }) }),
              showDelete && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleDelete(post),
                  style: { color: "#fca5a5" },
                  "aria-label": "حذف",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "🗑️" })
                }
              )
            ] })
          ]
        },
        post.id
      );
    })
  ] }) });
};
export {
  GroupPostsFeed as default
};
