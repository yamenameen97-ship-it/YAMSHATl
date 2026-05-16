import { e as useToast, r as reactExports, j as jsxRuntimeExports, B as Button } from "../index-D6u1FUhW.js";
import { M as MainLayout } from "./MainLayout-Ca2z1jDa.js";
import { C as Card } from "./Card-r3PaFA5D.js";
import { M as Modal } from "./Modal-TdtOGZ1q.js";
import { v as viewStory, g as getStories, a as getStoryArchive, u as uploadStory, r as reactToStory, b as replyToStory } from "./stories-D_IGhHok.js";
import "./proxy-npyH2_t3.js";
const MUSIC_OPTIONS = [
  { id: "lofi-night", label: "Lo-fi Night", mood: "هادئ", color: "#3b82f6" },
  { id: "arabic-pop", label: "Arabic Pop Intro", mood: "حيوي", color: "#8b5cf6" },
  { id: "cinematic-rise", label: "Cinematic Rise", mood: "ملحمي", color: "#f97316" },
  { id: "acoustic-vibes", label: "Acoustic Vibes", mood: "دافئ", color: "#10b981" }
];
const STICKERS = ["🔥", "❤️", "✨", "🎉", "🧿", "📍", "🎵", "🚀"];
const REACTIONS = ["❤️", "🔥", "😂", "😮", "👏"];
function normalizeStories(items = []) {
  return items.map((item) => {
    const viewers = Array.isArray(item.viewers) ? item.viewers : Array.isArray(item.viewers_list) ? item.viewers_list : [];
    return {
      ...item,
      viewers,
      sticker_items: Array.isArray(item.sticker_items) ? item.sticker_items : Array.isArray(item.stickers) ? item.stickers : [],
      music: item.music || item.music_track || "",
      reactions: item.reactions || {},
      replies_count: Number(item.replies_count || 0),
      views_count: Number(item.views_count || item.view_count || viewers.length || 0),
      viewer_count: Number(item.views_count || item.view_count || viewers.length || 0)
    };
  });
}
function groupStoriesByUser(items = []) {
  const groups = /* @__PURE__ */ new Map();
  items.forEach((story) => {
    const key = story.username || "مستخدم";
    if (!groups.has(key)) groups.set(key, { username: key, stories: [] });
    groups.get(key).stories.push(story);
  });
  return Array.from(groups.values());
}
function isVideoStory(story) {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(story?.media_url || "");
}
function storyAudienceLabel(story) {
  return story?.is_close_friends ? "الأصدقاء المقربون" : "عام";
}
function Stories() {
  const { pushToast } = useToast();
  const fileInputRef = reactExports.useRef(null);
  const progressTimerRef = reactExports.useRef(0);
  const prefetchCleanupRef = reactExports.useRef([]);
  const viewedStoryIdsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const [activeTab, setActiveTab] = reactExports.useState("feed");
  const [viewerMode, setViewerMode] = reactExports.useState("feed");
  const [stories, setStories] = reactExports.useState([]);
  const [archive, setArchive] = reactExports.useState([]);
  const [selectedFile, setSelectedFile] = reactExports.useState(null);
  const [previewUrl, setPreviewUrl] = reactExports.useState("");
  const [isCloseFriends, setIsCloseFriends] = reactExports.useState(false);
  const [caption, setCaption] = reactExports.useState("");
  const [selectedStickers, setSelectedStickers] = reactExports.useState([]);
  const [selectedMusic, setSelectedMusic] = reactExports.useState(MUSIC_OPTIONS[0]);
  const [loading, setLoading] = reactExports.useState(true);
  const [uploading, setUploading] = reactExports.useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = reactExports.useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = reactExports.useState(0);
  const [viewerOpen, setViewerOpen] = reactExports.useState(false);
  const [replyText, setReplyText] = reactExports.useState("");
  const [progress, setProgress] = reactExports.useState(0);
  const [paused, setPaused] = reactExports.useState(false);
  const loadData = async () => {
    setLoading(true);
    try {
      const [storiesRes, archiveRes] = await Promise.all([getStories(), getStoryArchive()]);
      setStories(normalizeStories(Array.isArray(storiesRes?.data) ? storiesRes.data : []));
      setArchive(normalizeStories(Array.isArray(archiveRes?.data) ? archiveRes.data : []));
    } catch (error) {
      pushToast({ type: "error", title: "فشل تحميل القصص", description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadData();
  }, []);
  reactExports.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    prefetchCleanupRef.current.forEach((fn) => fn?.());
  }, [previewUrl]);
  const storyGroups = reactExports.useMemo(() => groupStoriesByUser(stories), [stories]);
  const archiveGroups = reactExports.useMemo(() => groupStoriesByUser(archive), [archive]);
  const viewerGroups = viewerMode === "archive" ? archiveGroups : storyGroups;
  const activeGroup = viewerGroups[activeGroupIndex] || null;
  const activeStory = activeGroup?.stories?.[activeStoryIndex] || null;
  reactExports.useEffect(() => {
    prefetchCleanupRef.current.forEach((fn) => fn?.());
    prefetchCleanupRef.current = [];
    if (!viewerOpen || !activeGroup) return void 0;
    const nextStory = activeGroup.stories?.[activeStoryIndex + 1] || viewerGroups[activeGroupIndex + 1]?.stories?.[0];
    if (!nextStory?.media_url) return void 0;
    if (isVideoStory(nextStory)) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = nextStory.media_url;
      prefetchCleanupRef.current.push(() => {
        video.pause?.();
        video.removeAttribute("src");
        video.load?.();
      });
    } else {
      const img = new Image();
      img.decoding = "async";
      img.src = nextStory.media_url;
      prefetchCleanupRef.current.push(() => {
        img.src = "";
      });
    }
    return () => {
      prefetchCleanupRef.current.forEach((fn) => fn?.());
      prefetchCleanupRef.current = [];
    };
  }, [activeGroup, activeGroupIndex, activeStoryIndex, viewerGroups, viewerOpen]);
  reactExports.useEffect(() => {
    if (!viewerOpen || !activeStory) return void 0;
    setProgress(0);
    if (!viewedStoryIdsRef.current.has(String(activeStory.id))) {
      viewedStoryIdsRef.current.add(String(activeStory.id));
      viewStory(activeStory.id).then(({ data }) => {
        const nextViews = Number(data?.views_count ?? data?.view_count ?? activeStory.views_count ?? 0);
        const updater = (items) => items.map((item) => String(item.id) === String(activeStory.id) ? { ...item, views_count: nextViews, viewer_count: nextViews, seen_by: data?.seen_by || item.seen_by || [] } : item);
        if (viewerMode === "archive") setArchive((prev) => updater(prev));
        else setStories((prev) => updater(prev));
      }).catch(() => null);
    }
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    if (!paused) {
      progressTimerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) {
              setActiveStoryIndex((current) => current + 1);
            } else if (activeGroupIndex < viewerGroups.length - 1) {
              setActiveGroupIndex((current) => current + 1);
              setActiveStoryIndex(0);
            } else {
              setViewerOpen(false);
            }
            return 0;
          }
          return prev + 2;
        });
      }, 120);
    }
    return () => {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    };
  }, [activeGroup?.stories?.length, activeGroupIndex, activeStory, activeStoryIndex, paused, viewerGroups.length, viewerOpen]);
  const resetComposer = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
    setSelectedStickers([]);
    setSelectedMusic(MUSIC_OPTIONS[0]);
    setIsCloseFriends(false);
  };
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setActiveTab("create");
  };
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await uploadStory(selectedFile, {
        caption,
        is_close_friends: isCloseFriends,
        filter_name: "Yamshat Stories",
        stickers: selectedStickers,
        music: selectedMusic.label
      });
      pushToast({ type: "success", title: "تم نشر الستوري" });
      resetComposer();
      setActiveTab("feed");
      await loadData();
    } catch (error) {
      pushToast({ type: "error", title: "تعذر رفع الستوري", description: error?.response?.data?.detail || error?.message });
    } finally {
      setUploading(false);
    }
  };
  const toggleSticker = (sticker) => {
    setSelectedStickers((prev) => prev.includes(sticker) ? prev.filter((item) => item !== sticker) : [...prev, sticker].slice(0, 3));
  };
  const openViewer = (mode, groupIndex, storyIndex = 0) => {
    setViewerMode(mode);
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(storyIndex);
    setReplyText("");
    setPaused(false);
    setViewerOpen(true);
  };
  const reactToCurrentStory = async (emoji) => {
    if (!activeStory) return;
    try {
      await reactToStory(activeStory.id, emoji);
    } catch {
    }
    const updater = (items) => items.map((item) => String(item.id) === String(activeStory.id) ? { ...item, reactions: { ...item.reactions || {}, [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } } : item);
    if (viewerMode === "archive") setArchive((prev) => updater(prev));
    else setStories((prev) => updater(prev));
  };
  const sendReply = async () => {
    if (!activeStory || !replyText.trim()) return;
    try {
      await replyToStory(activeStory.id, replyText.trim());
      setStories((prev) => prev.map((item) => String(item.id) === String(activeStory.id) ? { ...item, replies_count: Number(item.replies_count || 0) + 1 } : item));
      setReplyText("");
      pushToast({ type: "success", title: "تم إرسال الرد" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر إرسال الرد", description: error?.response?.data?.detail || error?.message });
    }
  };
  const archiveCount = archive.length;
  const totalViewers = stories.reduce((sum, item) => sum + Number(item.views_count || 0), 0);
  const totalReactions = stories.reduce((sum, item) => sum + Object.values(item.reactions || {}).reduce((acc, value) => acc + Number(value || 0), 0), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { maxWidth: 980, margin: "0 auto", padding: "20px 10px", display: "grid", gap: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 18 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0 }, children: "الستوري" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { marginTop: 6 }, children: "viewers list + reactions + stickers + music UI + archive UI" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActiveTab("feed"), children: "القصص" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setActiveTab("archive"), children: "الأرشيف" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: loadData, loading, children: "تحديث" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => fileInputRef.current?.click(), children: "رفع ستوري" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", hidden: true, accept: "image/*,video/*", onChange: handleFileSelect })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-kpi", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: storyGroups.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "دوائر الستوري" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-kpi", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: totalViewers }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إجمالي المشاهدات" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-kpi", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: totalReactions }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إجمالي التفاعلات" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-kpi", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: archiveCount }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عناصر الأرشيف" })
        ] }) })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 24 }, children: "جارٍ تحميل الستوري..." }) : null,
      !loading && activeTab === "feed" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "story-circles-strip", children: storyGroups.map((group, groupIndex) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => openViewer("feed", groupIndex, 0), className: "story-user-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "story-user-ring", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: `https://ui-avatars.com/api/?name=${group.username}`, alt: group.username, className: "story-user-avatar" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 8, fontSize: 12 }, children: group.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { className: "muted", children: [
            group.stories.length,
            " قصة"
          ] })
        ] }, group.username)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }, children: stories.map((story) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { overflow: "hidden", padding: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { aspectRatio: "9 / 16", position: "relative", background: "#111" }, children: [
            isVideoStory(story) ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: story.media_url, muted: true, loop: true, autoPlay: true, playsInline: true, preload: "metadata", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: story.media_url, alt: "story", loading: "lazy", decoding: "async", style: { width: "100%", height: "100%", objectFit: "cover" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: 12, right: 12, display: "flex", gap: 6, flexWrap: "wrap" }, children: [
              story.music ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "story-chip", children: [
                "🎵 ",
                story.music
              ] }) : null,
              story.sticker_items?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "story-chip", children: story.sticker_items.join(" ") }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 12, background: "linear-gradient(transparent, rgba(0,0,0,0.82))", color: "white" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700 }, children: [
                "@",
                story.username
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, opacity: 0.84 }, children: story.caption || "بدون كابشن" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 12, display: "grid", gap: 8 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 12 }, children: [
              "👁️ ",
              story.views_count,
              " · 💬 ",
              story.replies_count,
              " · 🎵 ",
              story.music || "بدون موسيقى"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "story-chip", children: storyAudienceLabel(story) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => {
                const index = storyGroups.findIndex((group) => group.username === story.username);
                const nestedIndex = storyGroups[index]?.stories?.findIndex((item) => String(item.id) === String(story.id)) || 0;
                openViewer("feed", index, nestedIndex);
              }, children: "عرض" })
            ] })
          ] })
        ] }, story.id)) })
      ] }) : null,
      !loading && activeTab === "archive" ? archive.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 16 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "واجهة الأرشيف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { marginTop: 6 }, children: "مراجعة سريعة للقصص القديمة مع الموسيقى والملصقات والمشاهدات." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "story-chip", children: [
            archiveCount,
            " عنصر"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }, children: archive.map((story) => {
          const groupIndex = archiveGroups.findIndex((group) => group.username === story.username);
          const nestedIndex = archiveGroups[groupIndex]?.stories?.findIndex((item) => String(item.id) === String(story.id)) || 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { overflow: "hidden", padding: 0, cursor: "pointer" }, onClick: () => openViewer("archive", groupIndex, nestedIndex), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { aspectRatio: "9 / 16", background: "#111", position: "relative" }, children: [
              isVideoStory(story) ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: story.media_url, muted: true, preload: "metadata", style: { width: "100%", height: "100%", objectFit: "cover", opacity: 0.78 } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: story.media_url, alt: "archived", loading: "lazy", decoding: "async", style: { width: "100%", height: "100%", objectFit: "cover", opacity: 0.78 } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 10, left: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "story-chip", children: "🗄️ مؤرشف" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.84))", color: "white" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  "@",
                  story.username
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, opacity: 0.84 }, children: story.music || "بدون موسيقى" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 10, fontSize: 12, display: "grid", gap: 6 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", children: [
                "👁️ ",
                story.views_count,
                " · 💬 ",
                story.replies_count
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: story.sticker_items?.length ? story.sticker_items.join(" ") : "بدون ملصقات" })
            ] })
          ] }, story.id);
        }) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 24 }, children: "الأرشيف فارغ." }) : null,
      activeTab === "create" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 18 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.95fr)", gap: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", aspectRatio: "9 / 16", background: "#000", borderRadius: 20, overflow: "hidden" }, children: [
            selectedFile?.type?.startsWith("video/") ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: previewUrl, controls: true, style: { width: "100%", height: "100%", objectFit: "contain" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: previewUrl, alt: "preview", style: { width: "100%", height: "100%", objectFit: "contain" } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 20, left: 20, display: "flex", gap: 8, flexWrap: "wrap" }, children: selectedStickers.map((sticker) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "story-chip", style: { fontSize: 20 }, children: sticker }, sticker)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 16, background: "linear-gradient(transparent, rgba(0,0,0,0.82))", color: "white" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 14, marginBottom: 6 }, children: caption || "اكتب كابشن للستوري" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, opacity: 0.82 }, children: [
                "🎵 ",
                selectedMusic.label
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 14 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 14 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Stickers" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: STICKERS.map((sticker) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `story-picker-chip ${selectedStickers.includes(sticker) ? "active" : ""}`, onClick: () => toggleSticker(sticker), children: sticker }, sticker)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 14 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Music UI" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: MUSIC_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `story-music-row ${selectedMusic.id === option.id ? "active" : ""}`, onClick: () => setSelectedMusic(option), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "story-music-dot", style: { background: option.color } }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { textAlign: "start" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: option.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("small", { className: "muted", style: { display: "block", marginTop: 4 }, children: option.mood })
                ] })
              ] }, option.id)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: caption, onChange: (event) => setCaption(event.target.value), rows: 3, placeholder: "كابشن / CTA / سؤال للمشاهدين", style: { width: "100%", borderRadius: 16, padding: 12 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: isCloseFriends, onChange: (event) => setIsCloseFriends(event.target.checked) }),
          "نشر للأصدقاء المقربين فقط"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => {
            resetComposer();
            setActiveTab("feed");
          }, children: "إلغاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleUpload, loading: uploading, children: "نشر الستوري" })
        ] })
      ] }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: viewerOpen && Boolean(activeStory), onClose: () => setViewerOpen(false), title: activeStory ? `@${activeStory.username}` : "Story", size: "large", children: activeStory ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 6 }, children: (activeGroup?.stories || []).map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, height: 4, borderRadius: 999, overflow: "hidden", background: "rgba(59,130,246,0.14)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: idx < activeStoryIndex ? "100%" : idx === activeStoryIndex ? `${progress}%` : "0%", height: "100%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" } }) }, item.id || idx)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(300px, 0.95fr)", gap: 16 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: { position: "relative", aspectRatio: "9 / 16", background: "#000", borderRadius: 20, overflow: "hidden" },
            onMouseDown: () => setPaused(true),
            onMouseUp: () => setPaused(false),
            onTouchStart: () => setPaused(true),
            onTouchEnd: () => setPaused(false),
            children: [
              isVideoStory(activeStory) ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: activeStory.media_url, controls: true, autoPlay: true, playsInline: true, preload: "metadata", style: { width: "100%", height: "100%", objectFit: "contain" } }, activeStory.id) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: activeStory.media_url, alt: "story", style: { width: "100%", height: "100%", objectFit: "contain" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: 18, left: 18, display: "flex", gap: 8, flexWrap: "wrap" }, children: [
                activeStory.music ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "story-chip", children: [
                  "🎵 ",
                  activeStory.music
                ] }) : null,
                activeStory.sticker_items?.map((sticker) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "story-chip", children: sticker }, sticker))
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "story-nav-hit story-nav-prev", onClick: () => {
                if (activeStoryIndex > 0) setActiveStoryIndex((prev) => prev - 1);
                else if (activeGroupIndex > 0) {
                  const previousGroupIndex = activeGroupIndex - 1;
                  const previousGroupLength = viewerGroups[previousGroupIndex]?.stories?.length || 1;
                  setActiveGroupIndex(previousGroupIndex);
                  setActiveStoryIndex(previousGroupLength - 1);
                }
              }, children: "‹" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "story-nav-hit story-nav-next", onClick: () => {
                if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) setActiveStoryIndex((prev) => prev + 1);
                else if (activeGroupIndex < viewerGroups.length - 1) {
                  setActiveGroupIndex((prev) => prev + 1);
                  setActiveStoryIndex(0);
                }
              }, children: "›" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 16, background: "linear-gradient(transparent, rgba(0,0,0,0.84))", color: "white" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 6 }, children: activeStory.caption || "بدون كابشن" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, opacity: 0.82 }, children: [
                  "🎵 ",
                  activeStory.music || "بدون موسيقى",
                  " · ",
                  storyAudienceLabel(activeStory)
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { style: { padding: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "المشاهدات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activeStory.views_count })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الردود" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activeStory.replies_count })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الأرشيف" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: viewerMode === "archive" ? "مؤرشف" : archive.some((item) => String(item.id) === String(activeStory.id)) ? "موجود في الأرشيف" : "نشط" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "المشاهدون التفصيليون" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activeStory.viewers?.length || 0 })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 14 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Reactions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: REACTIONS.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "story-picker-chip", onClick: () => reactToCurrentStory(emoji), children: [
              emoji,
              " ",
              activeStory.reactions?.[emoji] ? activeStory.reactions[emoji] : ""
            ] }, emoji)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 14 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Viewers list" }),
            activeStory.viewers?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10, maxHeight: 180, overflowY: "auto" }, children: activeStory.viewers.map((viewer, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "story-viewer-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "story-viewer-avatar", children: String(viewer?.username || viewer || "U").slice(0, 1).toUpperCase() }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: viewer?.username || viewer }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 12 }, children: viewer?.viewed_at ? new Date(viewer.viewed_at).toLocaleString("ar-EG") : "شاهد القصة" })
              ] })
            ] }, `${viewer?.username || viewer}-${index}`)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "لا توجد بيانات viewers تفصيلية من الـ API حالياً، لكن عداد المشاهدات ظاهر فوق." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 14 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Reply" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                value: replyText,
                onChange: (event) => setReplyText(event.target.value),
                rows: 3,
                placeholder: "اكتب ردك على الستوري",
                style: { width: "100%", borderRadius: 14, padding: 12 },
                onFocus: () => setPaused(true),
                onBlur: () => setPaused(false)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 12 }, children: "CTA / mentions / quick reactions جاهزين" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: sendReply, children: "إرسال الرد" })
            ] })
          ] })
        ] })
      ] })
    ] }) : null }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .story-kpi {
          display: grid;
          gap: 6px;
        }
        .story-kpi strong {
          font-size: 28px;
        }
        .story-chip,
        .story-picker-chip {
          border: 1px solid rgba(59,130,246,0.15);
          background: rgba(59,130,246,0.06);
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
        }
        .story-picker-chip.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .story-circles-strip {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .story-user-card {
          border: none;
          background: none;
          cursor: pointer;
          color: inherit;
          min-width: 98px;
          text-align: center;
        }
        .story-user-ring {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          padding: 3px;
          margin: 0 auto;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #f97316);
          box-shadow: 0 18px 36px rgba(59,130,246,0.18);
        }
        .story-user-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
        }
        .story-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(15,23,42,0.06);
        }
        .story-meta-row:last-child {
          border-bottom: none;
        }
        .story-viewer-row {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(15,23,42,0.06);
        }
        .story-viewer-row:last-child {
          border-bottom: none;
        }
        .story-viewer-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-weight: 700;
        }
        .story-music-row {
          width: 100%;
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          padding: 12px 14px;
          display: flex;
          gap: 12px;
          align-items: center;
          cursor: pointer;
        }
        .story-music-row.active {
          border-color: rgba(59,130,246,0.4);
          box-shadow: 0 14px 30px rgba(59,130,246,0.12);
        }
        .story-music-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .story-nav-hit {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 54px;
          border: none;
          background: linear-gradient(90deg, rgba(0,0,0,0.24), transparent);
          color: white;
          font-size: 36px;
          cursor: pointer;
        }
        .story-nav-prev { left: 0; }
        .story-nav-next {
          right: 0;
          background: linear-gradient(270deg, rgba(0,0,0,0.24), transparent);
        }
        @media (max-width: 920px) {
          .story-circles-strip {
            padding-inline-end: 8px;
          }
        }
      ` })
  ] });
}
export {
  Stories as default
};
