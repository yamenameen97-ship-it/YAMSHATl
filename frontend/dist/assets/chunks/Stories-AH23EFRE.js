import {
  MainLayout
} from "./chunk-ZOZSORVL.js";
import "./chunk-AB4CHF2R.js";
import {
  getStories,
  getStoryArchive,
  reactToStory,
  replyToStory,
  uploadStory,
  viewStory
} from "./chunk-CNLIQS4X.js";
import {
  Modal
} from "./chunk-ERP4JHH7.js";
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
import "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Stories.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var MUSIC_OPTIONS = [
  { id: "lofi-night", label: "Lo-fi Night", mood: "\u0647\u0627\u062F\u0626", color: "#3b82f6" },
  { id: "arabic-pop", label: "Arabic Pop Intro", mood: "\u062D\u064A\u0648\u064A", color: "#8b5cf6" },
  { id: "cinematic-rise", label: "Cinematic Rise", mood: "\u0645\u0644\u062D\u0645\u064A", color: "#f97316" },
  { id: "acoustic-vibes", label: "Acoustic Vibes", mood: "\u062F\u0627\u0641\u0626", color: "#10b981" }
];
var STICKERS = ["\u{1F525}", "\u2764\uFE0F", "\u2728", "\u{1F389}", "\u{1F9FF}", "\u{1F4CD}", "\u{1F3B5}", "\u{1F680}"];
var REACTIONS = ["\u2764\uFE0F", "\u{1F525}", "\u{1F602}", "\u{1F62E}", "\u{1F44F}"];
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
    const key = story.username || "\u0645\u0633\u062A\u062E\u062F\u0645";
    if (!groups.has(key)) groups.set(key, { username: key, stories: [] });
    groups.get(key).stories.push(story);
  });
  return Array.from(groups.values());
}
function isVideoStory(story) {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(story?.media_url || "");
}
function storyAudienceLabel(story) {
  return story?.is_close_friends ? "\u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621 \u0627\u0644\u0645\u0642\u0631\u0628\u0648\u0646" : "\u0639\u0627\u0645";
}
function Stories() {
  const { pushToast } = useToast();
  const fileInputRef = (0, import_react.useRef)(null);
  const progressTimerRef = (0, import_react.useRef)(0);
  const prefetchCleanupRef = (0, import_react.useRef)([]);
  const viewedStoryIdsRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
  const [activeTab, setActiveTab] = (0, import_react.useState)("feed");
  const [viewerMode, setViewerMode] = (0, import_react.useState)("feed");
  const [stories, setStories] = (0, import_react.useState)([]);
  const [archive, setArchive] = (0, import_react.useState)([]);
  const [selectedFile, setSelectedFile] = (0, import_react.useState)(null);
  const [previewUrl, setPreviewUrl] = (0, import_react.useState)("");
  const [isCloseFriends, setIsCloseFriends] = (0, import_react.useState)(false);
  const [caption, setCaption] = (0, import_react.useState)("");
  const [selectedStickers, setSelectedStickers] = (0, import_react.useState)([]);
  const [selectedMusic, setSelectedMusic] = (0, import_react.useState)(MUSIC_OPTIONS[0]);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [uploading, setUploading] = (0, import_react.useState)(false);
  const [activeGroupIndex, setActiveGroupIndex] = (0, import_react.useState)(0);
  const [activeStoryIndex, setActiveStoryIndex] = (0, import_react.useState)(0);
  const [viewerOpen, setViewerOpen] = (0, import_react.useState)(false);
  const [replyText, setReplyText] = (0, import_react.useState)("");
  const [progress, setProgress] = (0, import_react.useState)(0);
  const [paused, setPaused] = (0, import_react.useState)(false);
  const loadData = async () => {
    setLoading(true);
    try {
      const [storiesRes, archiveRes] = await Promise.all([getStories(), getStoryArchive()]);
      setStories(normalizeStories(Array.isArray(storiesRes?.data) ? storiesRes.data : []));
      setArchive(normalizeStories(Array.isArray(archiveRes?.data) ? archiveRes.data : []));
    } catch (error) {
      pushToast({ type: "error", title: "\u0641\u0634\u0644 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0642\u0635\u0635", description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoading(false);
    }
  };
  (0, import_react.useEffect)(() => {
    loadData();
  }, []);
  (0, import_react.useEffect)(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    prefetchCleanupRef.current.forEach((fn) => fn?.());
  }, [previewUrl]);
  const storyGroups = (0, import_react.useMemo)(() => groupStoriesByUser(stories), [stories]);
  const archiveGroups = (0, import_react.useMemo)(() => groupStoriesByUser(archive), [archive]);
  const viewerGroups = viewerMode === "archive" ? archiveGroups : storyGroups;
  const activeGroup = viewerGroups[activeGroupIndex] || null;
  const activeStory = activeGroup?.stories?.[activeStoryIndex] || null;
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
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
      pushToast({ type: "success", title: "\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0633\u062A\u0648\u0631\u064A" });
      resetComposer();
      setActiveTab("feed");
      await loadData();
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u0631\u0641\u0639 \u0627\u0644\u0633\u062A\u0648\u0631\u064A", description: error?.response?.data?.detail || error?.message });
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
      pushToast({ type: "success", title: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F" });
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F", description: error?.response?.data?.detail || error?.message });
    }
  };
  const archiveCount = archive.length;
  const totalViewers = stories.reduce((sum, item) => sum + Number(item.views_count || 0), 0);
  const totalReactions = stories.reduce((sum, item) => sum + Object.values(item.reactions || {}).reduce((acc, value) => acc + Number(value || 0), 0), 0);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { maxWidth: 980, margin: "0 auto", padding: "20px 10px", display: "grid", gap: 18 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 18 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { margin: 0 }, children: "\u0627\u0644\u0633\u062A\u0648\u0631\u064A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { marginTop: 6 }, children: "viewers list + reactions + stickers + music UI + archive UI" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setActiveTab("feed"), children: "\u0627\u0644\u0642\u0635\u0635" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setActiveTab("archive"), children: "\u0627\u0644\u0623\u0631\u0634\u064A\u0641" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: loadData, loading, children: "\u062A\u062D\u062F\u064A\u062B" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: () => fileInputRef.current?.click(), children: "\u0631\u0641\u0639 \u0633\u062A\u0648\u0631\u064A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { ref: fileInputRef, type: "file", hidden: true, accept: "image/*,video/*", onChange: handleFileSelect })
        ] })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-kpi", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: storyGroups.length }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u062F\u0648\u0627\u0626\u0631 \u0627\u0644\u0633\u062A\u0648\u0631\u064A" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-kpi", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: totalViewers }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-kpi", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: totalReactions }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u0627\u062A" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-kpi", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: archiveCount }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0623\u0631\u0634\u064A\u0641" })
        ] }) })
      ] }),
      loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 24 }, children: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0633\u062A\u0648\u0631\u064A..." }) : null,
      !loading && activeTab === "feed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "story-circles-strip", children: storyGroups.map((group, groupIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", onClick: () => openViewer("feed", groupIndex, 0), className: "story-user-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "story-user-ring", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: `https://ui-avatars.com/api/?name=${group.username}`, alt: group.username, className: "story-user-avatar" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 8, fontSize: 12 }, children: group.username }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { className: "muted", children: [
            group.stories.length,
            " \u0642\u0635\u0629"
          ] })
        ] }, group.username)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }, children: stories.map((story) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { overflow: "hidden", padding: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { aspectRatio: "9 / 16", position: "relative", background: "#111" }, children: [
            isVideoStory(story) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: story.media_url, muted: true, loop: true, autoPlay: true, playsInline: true, preload: "metadata", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: story.media_url, alt: "story", loading: "lazy", decoding: "async", style: { width: "100%", height: "100%", objectFit: "cover" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 12, right: 12, display: "flex", gap: 6, flexWrap: "wrap" }, children: [
              story.music ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "story-chip", children: [
                "\u{1F3B5} ",
                story.music
              ] }) : null,
              story.sticker_items?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "story-chip", children: story.sticker_items.join(" ") }) : null
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 12, background: "linear-gradient(transparent, rgba(0,0,0,0.82))", color: "white" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontWeight: 700 }, children: [
                "@",
                story.username
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, opacity: 0.84 }, children: story.caption || "\u0628\u062F\u0648\u0646 \u0643\u0627\u0628\u0634\u0646" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 12, display: "grid", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "muted", style: { fontSize: 12 }, children: [
              "\u{1F441}\uFE0F ",
              story.views_count,
              " \xB7 \u{1F4AC} ",
              story.replies_count,
              " \xB7 \u{1F3B5} ",
              story.music || "\u0628\u062F\u0648\u0646 \u0645\u0648\u0633\u064A\u0642\u0649"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "story-chip", children: storyAudienceLabel(story) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => {
                const index = storyGroups.findIndex((group) => group.username === story.username);
                const nestedIndex = storyGroups[index]?.stories?.findIndex((item) => String(item.id) === String(story.id)) || 0;
                openViewer("feed", index, nestedIndex);
              }, children: "\u0639\u0631\u0636" })
            ] })
          ] })
        ] }, story.id)) })
      ] }) : null,
      !loading && activeTab === "archive" ? archive.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 16 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0623\u0631\u0634\u064A\u0641" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { marginTop: 6 }, children: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0633\u0631\u064A\u0639\u0629 \u0644\u0644\u0642\u0635\u0635 \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u0645\u0639 \u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649 \u0648\u0627\u0644\u0645\u0644\u0635\u0642\u0627\u062A \u0648\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "story-chip", children: [
            archiveCount,
            " \u0639\u0646\u0635\u0631"
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }, children: archive.map((story) => {
          const groupIndex = archiveGroups.findIndex((group) => group.username === story.username);
          const nestedIndex = archiveGroups[groupIndex]?.stories?.findIndex((item) => String(item.id) === String(story.id)) || 0;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { overflow: "hidden", padding: 0, cursor: "pointer" }, onClick: () => openViewer("archive", groupIndex, nestedIndex), children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { aspectRatio: "9 / 16", background: "#111", position: "relative" }, children: [
              isVideoStory(story) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: story.media_url, muted: true, preload: "metadata", style: { width: "100%", height: "100%", objectFit: "cover", opacity: 0.78 } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: story.media_url, alt: "archived", loading: "lazy", decoding: "async", style: { width: "100%", height: "100%", objectFit: "cover", opacity: 0.78 } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: 10, left: 10 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "story-chip", children: "\u{1F5C4}\uFE0F \u0645\u0624\u0631\u0634\u0641" }) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.84))", color: "white" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
                  "@",
                  story.username
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 11, opacity: 0.84 }, children: story.music || "\u0628\u062F\u0648\u0646 \u0645\u0648\u0633\u064A\u0642\u0649" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 10, fontSize: 12, display: "grid", gap: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "muted", children: [
                "\u{1F441}\uFE0F ",
                story.views_count,
                " \xB7 \u{1F4AC} ",
                story.replies_count
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: story.sticker_items?.length ? story.sticker_items.join(" ") : "\u0628\u062F\u0648\u0646 \u0645\u0644\u0635\u0642\u0627\u062A" })
            ] })
          ] }, story.id);
        }) })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 24 }, children: "\u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0641\u0627\u0631\u063A." }) : null,
      activeTab === "create" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 18 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.95fr)", gap: 16 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative", aspectRatio: "9 / 16", background: "#000", borderRadius: 20, overflow: "hidden" }, children: [
            selectedFile?.type?.startsWith("video/") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: previewUrl, controls: true, style: { width: "100%", height: "100%", objectFit: "contain" } }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: previewUrl, alt: "preview", style: { width: "100%", height: "100%", objectFit: "contain" } }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: 20, left: 20, display: "flex", gap: 8, flexWrap: "wrap" }, children: selectedStickers.map((sticker) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "story-chip", style: { fontSize: 20 }, children: sticker }, sticker)) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 16, background: "linear-gradient(transparent, rgba(0,0,0,0.82))", color: "white" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 14, marginBottom: 6 }, children: caption || "\u0627\u0643\u062A\u0628 \u0643\u0627\u0628\u0634\u0646 \u0644\u0644\u0633\u062A\u0648\u0631\u064A" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: 12, opacity: 0.82 }, children: [
                "\u{1F3B5} ",
                selectedMusic.label
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 14 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Stickers" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: STICKERS.map((sticker) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: `story-picker-chip ${selectedStickers.includes(sticker) ? "active" : ""}`, onClick: () => toggleSticker(sticker), children: sticker }, sticker)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 14 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Music UI" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 10 }, children: MUSIC_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: `story-music-row ${selectedMusic.id === option.id ? "active" : ""}`, onClick: () => setSelectedMusic(option), children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "story-music-dot", style: { background: option.color } }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { textAlign: "start" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: option.label }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { className: "muted", style: { display: "block", marginTop: 4 }, children: option.mood })
                ] })
              ] }, option.id)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: caption, onChange: (event) => setCaption(event.target.value), rows: 3, placeholder: "\u0643\u0627\u0628\u0634\u0646 / CTA / \u0633\u0624\u0627\u0644 \u0644\u0644\u0645\u0634\u0627\u0647\u062F\u064A\u0646", style: { width: "100%", borderRadius: 16, padding: 12 } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: isCloseFriends, onChange: (event) => setIsCloseFriends(event.target.checked) }),
          "\u0646\u0634\u0631 \u0644\u0644\u0623\u0635\u062F\u0642\u0627\u0621 \u0627\u0644\u0645\u0642\u0631\u0628\u064A\u0646 \u0641\u0642\u0637"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => {
            resetComposer();
            setActiveTab("feed");
          }, children: "\u0625\u0644\u063A\u0627\u0621" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: handleUpload, loading: uploading, children: "\u0646\u0634\u0631 \u0627\u0644\u0633\u062A\u0648\u0631\u064A" })
        ] })
      ] }) }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { open: viewerOpen && Boolean(activeStory), onClose: () => setViewerOpen(false), title: activeStory ? `@${activeStory.username}` : "Story", size: "large", children: activeStory ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 6 }, children: (activeGroup?.stories || []).map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: 4, borderRadius: 999, overflow: "hidden", background: "rgba(59,130,246,0.14)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: idx < activeStoryIndex ? "100%" : idx === activeStoryIndex ? `${progress}%` : "0%", height: "100%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" } }) }, item.id || idx)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(300px, 0.95fr)", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: { position: "relative", aspectRatio: "9 / 16", background: "#000", borderRadius: 20, overflow: "hidden" },
            onMouseDown: () => setPaused(true),
            onMouseUp: () => setPaused(false),
            onTouchStart: () => setPaused(true),
            onTouchEnd: () => setPaused(false),
            children: [
              isVideoStory(activeStory) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", { src: activeStory.media_url, controls: true, autoPlay: true, playsInline: true, preload: "metadata", style: { width: "100%", height: "100%", objectFit: "contain" } }, activeStory.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: activeStory.media_url, alt: "story", style: { width: "100%", height: "100%", objectFit: "contain" } }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: 18, left: 18, display: "flex", gap: 8, flexWrap: "wrap" }, children: [
                activeStory.music ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "story-chip", children: [
                  "\u{1F3B5} ",
                  activeStory.music
                ] }) : null,
                activeStory.sticker_items?.map((sticker) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "story-chip", children: sticker }, sticker))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "story-nav-hit story-nav-prev", onClick: () => {
                if (activeStoryIndex > 0) setActiveStoryIndex((prev) => prev - 1);
                else if (activeGroupIndex > 0) {
                  const previousGroupIndex = activeGroupIndex - 1;
                  const previousGroupLength = viewerGroups[previousGroupIndex]?.stories?.length || 1;
                  setActiveGroupIndex(previousGroupIndex);
                  setActiveStoryIndex(previousGroupLength - 1);
                }
              }, children: "\u2039" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "story-nav-hit story-nav-next", onClick: () => {
                if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) setActiveStoryIndex((prev) => prev + 1);
                else if (activeGroupIndex < viewerGroups.length - 1) {
                  setActiveGroupIndex((prev) => prev + 1);
                  setActiveStoryIndex(0);
                }
              }, children: "\u203A" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", insetInline: 0, bottom: 0, padding: 16, background: "linear-gradient(transparent, rgba(0,0,0,0.84))", color: "white" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 700, marginBottom: 6 }, children: activeStory.caption || "\u0628\u062F\u0648\u0646 \u0643\u0627\u0628\u0634\u0646" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: 12, opacity: 0.82 }, children: [
                  "\u{1F3B5} ",
                  activeStory.music || "\u0628\u062F\u0648\u0646 \u0645\u0648\u0633\u064A\u0642\u0649",
                  " \xB7 ",
                  storyAudienceLabel(activeStory)
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { style: { padding: 14 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: activeStory.views_count })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u0627\u0644\u0631\u062F\u0648\u062F" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: activeStory.replies_count })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u0627\u0644\u0623\u0631\u0634\u064A\u0641" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: viewerMode === "archive" ? "\u0645\u0624\u0631\u0634\u0641" : archive.some((item) => String(item.id) === String(activeStory.id)) ? "\u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0627\u0644\u0623\u0631\u0634\u064A\u0641" : "\u0646\u0634\u0637" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-meta-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0648\u0646 \u0627\u0644\u062A\u0641\u0635\u064A\u0644\u064A\u0648\u0646" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: activeStory.viewers?.length || 0 })
            ] })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Reactions" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: REACTIONS.map((emoji) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "story-picker-chip", onClick: () => reactToCurrentStory(emoji), children: [
              emoji,
              " ",
              activeStory.reactions?.[emoji] ? activeStory.reactions[emoji] : ""
            ] }, emoji)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Viewers list" }),
            activeStory.viewers?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 10, maxHeight: 180, overflowY: "auto" }, children: activeStory.viewers.map((viewer, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "story-viewer-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "story-viewer-avatar", children: String(viewer?.username || viewer || "U").slice(0, 1).toUpperCase() }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: viewer?.username || viewer }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { fontSize: 12 }, children: viewer?.viewed_at ? new Date(viewer.viewed_at).toLocaleString("ar-EG") : "\u0634\u0627\u0647\u062F \u0627\u0644\u0642\u0635\u0629" })
              ] })
            ] }, `${viewer?.username || viewer}-${index}`)) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A viewers \u062A\u0641\u0635\u064A\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u0640 API \u062D\u0627\u0644\u064A\u0627\u064B\u060C \u0644\u0643\u0646 \u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0627\u062A \u0638\u0627\u0647\u0631 \u0641\u0648\u0642." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 14 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "Reply" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "textarea",
              {
                value: replyText,
                onChange: (event) => setReplyText(event.target.value),
                rows: 3,
                placeholder: "\u0627\u0643\u062A\u0628 \u0631\u062F\u0643 \u0639\u0644\u0649 \u0627\u0644\u0633\u062A\u0648\u0631\u064A",
                style: { width: "100%", borderRadius: 14, padding: 12 },
                onFocus: () => setPaused(true),
                onBlur: () => setPaused(false)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", style: { fontSize: 12 }, children: "CTA / mentions / quick reactions \u062C\u0627\u0647\u0632\u064A\u0646" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: sendReply, children: "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F" })
            ] })
          ] })
        ] })
      ] })
    ] }) : null }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
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
