import { b0 as reactExports, ab as getMe, ar as jsxRuntimeExports, h as MainLayout, aL as motion } from "../index-TztUfWYS.js";
import { S as StoryEditor, a as StoryViewerEnhanced } from "./StoryEditor-D9BPVXND.js";
import { getStoriesGrouped, getStoryArchive, getStoryAnalyticsSummary, getStoryHighlights } from "./stories-B0F1RGCz.js";
import { A as AnimatePresence } from "./index-Bz-_CRjd.js";
import "./ReportModal-Dipso1Nd.js";
import "./UserPickerModal-sU3J9G9C.js";
function StoriesPage() {
  const [activeTab, setActiveTab] = reactExports.useState("feed");
  const [groups, setGroups] = reactExports.useState([]);
  const [archive, setArchive] = reactExports.useState([]);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [highlights, setHighlights] = reactExports.useState([]);
  const [selectedFile, setSelectedFile] = reactExports.useState(void 0);
  const [viewerOpen, setViewerOpen] = reactExports.useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = reactExports.useState(0);
  const [me, setMe] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const optimisticBlobUrlsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const loadData = reactExports.useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getStoriesGrouped(),
      getStoryArchive(),
      getStoryAnalyticsSummary(),
      getStoryHighlights(),
      getMe()
    ]);
    const [gRes, aRes, analyticsRes, highlightsRes, meRes] = results;
    setGroups(gRes.status === "fulfilled" ? gRes.value?.data || [] : []);
    setArchive(aRes.status === "fulfilled" ? aRes.value?.data || [] : []);
    setAnalytics(analyticsRes.status === "fulfilled" ? analyticsRes.value?.data || null : null);
    setHighlights(highlightsRes.status === "fulfilled" ? highlightsRes.value?.data || [] : []);
    setMe(meRes.status === "fulfilled" ? meRes.value?.data || null : null);
    setLoading(false);
  }, []);
  reactExports.useEffect(() => {
    loadData();
  }, [loadData]);
  reactExports.useEffect(() => () => {
    optimisticBlobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {
      }
    });
    optimisticBlobUrlsRef.current.clear();
  }, []);
  reactExports.useEffect(() => {
    const next = groups[activeGroupIndex + 1];
    if (next?.stories?.length) {
      next.stories.forEach((s) => {
        if (s.media_type !== "video" && s.media_url) {
          const img = new Image();
          img.src = s.media_url;
        }
      });
    }
  }, [activeGroupIndex, groups]);
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      setSelectedFile(file);
      setActiveTab("create");
    }
  };
  const handleCreateTextOnly = () => {
    setSelectedFile(null);
    setActiveTab("create");
  };
  const handleUploadSuccess = (uploadedStory, ctx = {}) => {
    setActiveTab("feed");
    setSelectedFile(void 0);
    try {
      const makeTrackedBlobUrl = (file) => {
        if (!file) return "";
        const url = URL.createObjectURL(file);
        optimisticBlobUrlsRef.current.add(url);
        return url;
      };
      const fallbackFile = ctx.generatedFile || ctx.file || null;
      const storyObj = uploadedStory && uploadedStory.id ? {
        ...uploadedStory,
        media_url: uploadedStory.media_url || makeTrackedBlobUrl(fallbackFile),
        media_type: uploadedStory.media_type || (fallbackFile?.type?.startsWith("video") ? "video" : "image"),
        caption: uploadedStory.caption ?? ctx.caption ?? "",
        created_at: uploadedStory.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        views_count: uploadedStory.views_count ?? 0,
        reactions_count: uploadedStory.reactions_count ?? 0,
        replies_count: uploadedStory.replies_count ?? 0
      } : {
        id: `local-${Date.now()}`,
        media_url: makeTrackedBlobUrl(fallbackFile),
        media_type: fallbackFile?.type?.startsWith("video") ? "video" : "image",
        caption: ctx.caption || "",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        views_count: 0,
        reactions_count: 0,
        replies_count: 0,
        _optimistic: true
      };
      setGroups((prev) => {
        const prevSelf = prev.find((g) => g.is_self) || null;
        const optimisticSelf = {
          user_id: me?.id || prevSelf?.user_id || "me",
          username: me?.username || prevSelf?.username || "أنا",
          user_avatar: me?.avatar_url || prevSelf?.user_avatar || prevSelf?.avatar_url || "",
          avatar_url: me?.avatar_url || prevSelf?.avatar_url || prevSelf?.user_avatar || "",
          is_self: true,
          has_unseen: false,
          last_created_at: storyObj.created_at,
          stories: [storyObj, ...prevSelf?.stories || []]
        };
        const others = prev.filter((g) => !g.is_self);
        return [optimisticSelf, ...others];
      });
    } catch (_) {
    }
    loadData();
  };
  const openViewer = (idx) => {
    setActiveGroupIndex(idx);
    setViewerOpen(true);
  };
  const myStoriesCount = reactExports.useMemo(() => groups.find((g) => g.is_self)?.stories?.length || 0, [groups]);
  const topStory = analytics?.top_story || null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { dir: "rtl", className: "yam-stories-page", style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stories-tabs", role: "tablist", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === "feed", onClick: () => setActiveTab("feed"), className: `yam-stab ${activeTab === "feed" ? "active" : ""}`, children: "قصص الأصدقاء" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", role: "tab", "aria-selected": activeTab === "archive", onClick: () => setActiveTab("archive"), className: `yam-stab ${activeTab === "archive" ? "active" : ""}`, children: [
        "🗄️ الأرشيف ",
        myStoriesCount ? `(${myStoriesCount})` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === "analytics", onClick: () => setActiveTab("analytics"), className: `yam-stab ${activeTab === "analytics" ? "active" : ""}`, children: "📈 الإحصائيات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yam-stab yam-stab-add", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", hidden: true, onChange: handleFileSelect, accept: "image/*,video/*" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "➕ قصة وسائط" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stab yam-stab-add alt", onClick: handleCreateTextOnly, children: "📝 قصة نصية" })
    ] }),
    activeTab === "feed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stories-freeflow", children: [
      loading && /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonFreeFlow, {}),
      !loading && groups.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-empty", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-icon", children: "📭" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "لا توجد قصص حاليًا" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "عندما يضيف أحد أصدقائك قصة، ستظهر هنا." })
      ] }),
      groups.map((group, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.button,
        {
          type: "button",
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.96 },
          onClick: () => openViewer(idx),
          className: `yam-story-bubble ${group.has_unseen ? "unseen" : ""}`,
          "aria-label": `فتح قصة ${group.is_self ? "قصتي" : group.username}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-bubble-ring", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-bubble-media", children: [
              group.stories?.[0]?.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: group.stories[0].media_url, muted: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: group.stories?.[0]?.media_url, alt: "", loading: "lazy" }),
              group.stories?.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-bubble-count", children: group.stories.length })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-bubble-name", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: group.is_self ? "قصتي" : group.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTimeAgo(group.last_created_at) })
            ] })
          ]
        },
        group.user_id
      ))
    ] }),
    activeTab === "archive" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-panel-stack", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-panel-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-panel-title", children: "⭐ القصص المميزة" }),
        highlights.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-inline-empty", children: "لا توجد قصص مميزة بعد." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-highlights-row", children: highlights.map((story) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-highlight-item", children: [
          story.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: story.media_url, muted: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: story.media_url, alt: story.highlight_title || "", loading: "lazy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-highlight-label", children: story.highlight_title || "مميزة" })
        ] }, story.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-panel-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-panel-title", children: "🗂️ الأرشيف الكامل" }),
        archive.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-empty", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-icon", children: "🗄️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "لا توجد قصص في الأرشيف" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "قصصك المنتهية تُحفظ تلقائيًا هنا." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-archive-grid", children: archive.map((story) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-archive-item", children: [
          story.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: story.media_url, muted: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: story.media_url, alt: "", loading: "lazy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-archive-stats", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "👁 ",
              story.views_count || 0
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "💖 ",
              story.reactions_count || 0
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "💬 ",
              story.replies_count || 0
            ] }),
            story.highlight && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⭐" })
          ] })
        ] }, story.id)) })
      ] })
    ] }),
    activeTab === "analytics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-panel-stack", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-analytics-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "إجمالي القصص", value: analytics?.stories_count ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "إجمالي المشاهدات", value: analytics?.total_views ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "إجمالي الردود", value: analytics?.total_replies ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "إجمالي التفاعلات", value: analytics?.total_reactions ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "متوسط المشاهدات", value: analytics?.average_views ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "القصص المميزة", value: analytics?.highlights_count ?? 0 })
      ] }),
      topStory && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-panel-card yam-top-story-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-panel-title", children: "🏆 أفضل قصة أداءً" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-top-story-layout", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-top-story-media", children: topStory.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: topStory.media_url, muted: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: topStory.media_url, alt: topStory.caption || "Top story", loading: "lazy" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-top-story-copy", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: topStory.caption || "قصة بدون وصف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "معدل التفاعل: ",
              analytics?.engagement_rate ?? 0
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-top-story-metrics", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "👁 ",
                topStory.views_count || 0
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "💖 ",
                topStory.reactions_count || 0
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "💬 ",
                topStory.replies_count || 0
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-panel-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-panel-title", children: "🕘 آخر القصص" }),
        analytics?.recent_stories?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-recent-stories-grid", children: analytics.recent_stories.map((story) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-recent-card", children: [
          story.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: story.media_url, muted: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: story.media_url, alt: story.caption || "", loading: "lazy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-recent-body", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: story.caption || "قصة بدون وصف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "👁 ",
              story.views_count || 0,
              " • 💖 ",
              story.reactions_count || 0,
              " • 💬 ",
              story.replies_count || 0
            ] })
          ] })
        ] }, story.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-inline-empty", children: "لا توجد بيانات كافية بعد." })
      ] })
    ] }),
    activeTab === "create" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      StoryEditor,
      {
        file: selectedFile ?? null,
        onClose: () => {
          setActiveTab("feed");
          setSelectedFile(void 0);
        },
        onSuccess: handleUploadSuccess
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: viewerOpen && groups[activeGroupIndex] && /* @__PURE__ */ jsxRuntimeExports.jsx(
      StoryViewerEnhanced,
      {
        group: groups[activeGroupIndex],
        allGroups: groups,
        currentIndex: activeGroupIndex,
        currentUserId: me?.id,
        onClose: () => {
          setViewerOpen(false);
          loadData();
        },
        onNextGroup: () => {
          if (activeGroupIndex < groups.length - 1) setActiveGroupIndex((i) => i + 1);
          else {
            setViewerOpen(false);
            loadData();
          }
        },
        onPrevGroup: () => {
          if (activeGroupIndex > 0) setActiveGroupIndex((i) => i - 1);
        }
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: pageStyles })
  ] }) });
}
function StatCard({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: value })
  ] });
}
function SkeletonFreeFlow() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-bubble yam-skel-bubble", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-bubble-ring", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-bubble-media yam-skel" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-bubble-name", children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-skel-text" }) })
  ] }, i)) });
}
function formatTimeAgo(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diffMin = Math.floor((Date.now() - d.getTime()) / 6e4);
    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return `قبل ${diffMin} د`;
    const hrs = Math.floor(diffMin / 60);
    if (hrs < 24) return `قبل ${hrs} س`;
    return d.toLocaleDateString("ar");
  } catch (_) {
    return "";
  }
}
const pageStyles = `
.yam-stories-page { padding: 18px; display:flex; flex-direction:column; gap:16px; }
.yam-stories-tabs { display:flex; gap:10px; flex-wrap:wrap; }
.yam-stab { border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:var(--text,#eef2ff); border-radius:999px; padding:10px 16px; cursor:pointer; font:inherit; font-weight:700; }
.yam-stab.active { background:linear-gradient(135deg,#7c3aed,#ec4899); border-color:transparent; }
.yam-stab-add { display:inline-flex; align-items:center; justify-content:center; }
.yam-stab-add.alt { background:rgba(56,189,248,.12); }
.yam-stories-freeflow { display:flex; gap:18px; flex-wrap:wrap; }
.yam-story-bubble { border:0; background:transparent; display:flex; flex-direction:column; align-items:center; gap:10px; cursor:pointer; color:inherit; }
.yam-story-bubble-ring { width:92px; height:92px; padding:4px; border-radius:50%; background:linear-gradient(135deg,#a855f7,#ec4899,#f59e0b); }
.yam-story-bubble.unseen .yam-story-bubble-ring { box-shadow:0 0 0 4px rgba(168,85,247,.18); }
.yam-story-bubble-media { position:relative; width:100%; height:100%; border-radius:50%; overflow:hidden; background:#111827; }
.yam-story-bubble-media img, .yam-story-bubble-media video { width:100%; height:100%; object-fit:cover; }
.yam-story-bubble-count { position:absolute; left:2px; bottom:2px; min-width:22px; height:22px; border-radius:999px; background:#111827; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid #fff; }
.yam-story-bubble-name { text-align:center; display:flex; flex-direction:column; gap:4px; }
.yam-story-bubble-name strong { font-size:14px; }
.yam-story-bubble-name span { font-size:11px; opacity:.7; }
.yam-panel-stack { display:flex; flex-direction:column; gap:16px; }
.yam-panel-card { background:rgba(15,23,42,.62); border:1px solid rgba(255,255,255,.08); border-radius:20px; padding:16px; }
.yam-panel-title { font-weight:800; margin-bottom:12px; color:#f8fafc; }
.yam-highlights-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:12px; }
.yam-highlight-item, .yam-archive-item, .yam-recent-card { background:rgba(255,255,255,.03); border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,.06); }
.yam-highlight-item img, .yam-highlight-item video, .yam-archive-item img, .yam-archive-item video, .yam-recent-card img, .yam-recent-card video { width:100%; aspect-ratio:9/16; object-fit:cover; display:block; background:#020617; }
.yam-highlight-label { padding:8px; text-align:center; font-size:12px; font-weight:700; }
.yam-archive-grid, .yam-recent-stories-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; }
.yam-archive-stats, .yam-recent-body { padding:10px; display:flex; flex-wrap:wrap; gap:8px; font-size:12px; }
.yam-recent-body { flex-direction:column; }
.yam-analytics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
.yam-stat-card { background:rgba(15,23,42,.72); border:1px solid rgba(255,255,255,.08); border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:8px; }
.yam-stat-card span { opacity:.72; font-size:12px; }
.yam-stat-card strong { font-size:28px; color:#fff; }
.yam-top-story-layout { display:grid; grid-template-columns:minmax(160px,220px) 1fr; gap:16px; align-items:center; }
.yam-top-story-media img, .yam-top-story-media video { width:100%; aspect-ratio:9/16; object-fit:cover; border-radius:18px; background:#020617; }
.yam-top-story-copy h3 { margin:0 0 8px; font-size:18px; }
.yam-top-story-copy p { margin:0 0 10px; opacity:.78; }
.yam-top-story-metrics { display:flex; gap:10px; flex-wrap:wrap; font-size:13px; }
.yam-empty, .yam-inline-empty { text-align:center; padding:32px 16px; color:rgba(255,255,255,.72); }
.yam-empty-icon { font-size:36px; margin-bottom:10px; }
.yam-skel { background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.12),rgba(255,255,255,.06)); background-size:200% 100%; animation:yamShimmer 1.2s linear infinite; }
.yam-skel-text { display:block; width:70px; height:12px; border-radius:999px; background:rgba(255,255,255,.08); }
@keyframes yamShimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }
@media (max-width: 720px) {
  .yam-stories-page { padding:14px; }
  .yam-story-bubble-ring { width:84px; height:84px; }
  .yam-top-story-layout { grid-template-columns:1fr; }
}
`;
function Stories() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(StoriesPage, {});
}
export {
  Stories as default
};
