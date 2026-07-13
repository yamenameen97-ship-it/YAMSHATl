import { b0 as reactExports, ar as jsxRuntimeExports, aL as motion, bz as useNavigate, bG as useToast, a4 as getChatThreads, ab as getMe, aC as markMessagesSeen, h as MainLayout, al as getUsers } from "../index-TztUfWYS.js";
import { g as getNotifications, m as markNotificationRead, a as markNotificationsRead } from "./notifications-BoRL03El.js";
import { u as getGroups, c as createGroup } from "./groups-Dj_JWnYK.js";
import { u as useIsMobile } from "./useIsMobile-oeGtrRpg.js";
import { getStoriesGrouped, viewStory } from "./stories-B0F1RGCz.js";
import { S as StoryEditor, a as StoryViewerEnhanced } from "./StoryEditor-D9BPVXND.js";
import { A as AnimatePresence } from "./index-Bz-_CRjd.js";
import "./ReportModal-Dipso1Nd.js";
import "./UserPickerModal-sU3J9G9C.js";
function buildOptimisticSelfGroup(uploadedStory, file, caption, currentUser, prevSelfGroup) {
  let createdLocalUrl = "";
  const buildLocalUrl = () => {
    if (!file) return "";
    try {
      const u = URL.createObjectURL(file);
      createdLocalUrl = u;
      return u;
    } catch {
      return "";
    }
  };
  const storyObj = uploadedStory && uploadedStory.id ? {
    id: uploadedStory.id,
    media_url: uploadedStory.media_url || buildLocalUrl(),
    media_type: uploadedStory.media_type || (file?.type?.startsWith("video") ? "video" : "image"),
    caption: uploadedStory.caption ?? caption ?? "",
    created_at: uploadedStory.created_at || (/* @__PURE__ */ new Date()).toISOString(),
    views_count: uploadedStory.views_count ?? 0,
    reactions_count: uploadedStory.reactions_count ?? 0,
    replies_count: uploadedStory.replies_count ?? 0,
    _localBlobUrl: createdLocalUrl || void 0
  } : {
    id: `local-${Date.now()}`,
    media_url: buildLocalUrl(),
    media_type: file?.type?.startsWith("video") ? "video" : "image",
    caption: caption || "",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    views_count: 0,
    reactions_count: 0,
    replies_count: 0,
    _optimistic: true,
    _localBlobUrl: createdLocalUrl || void 0
  };
  return {
    group: {
      user_id: currentUser?.id || prevSelfGroup?.user_id || "me",
      username: currentUser?.username || prevSelfGroup?.username || "أنا",
      is_self: true,
      has_unseen: false,
      last_created_at: storyObj.created_at,
      stories: [storyObj, ...prevSelfGroup?.stories || []]
    },
    createdLocalUrl
    // '' إذا لم يُنشَأ ولا واحد
  };
}
function StoriesBar({ currentUser, onOpenComposer }) {
  const [groups, setGroups] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [viewerOpen, setViewerOpen] = reactExports.useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = reactExports.useState(0);
  const [pendingFile, setPendingFile] = reactExports.useState(null);
  const [toast, setToast] = reactExports.useState("");
  const fileInputRef = reactExports.useRef(null);
  const scrollRef = reactExports.useRef(null);
  const toastTimerRef = reactExports.useRef(null);
  const isMountedRef = reactExports.useRef(true);
  const optimisticBlobUrlsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const trackOptimisticBlobUrl = reactExports.useCallback((url) => {
    if (url && typeof url === "string") optimisticBlobUrlsRef.current.add(url);
  }, []);
  const revokeOptimisticBlobUrls = reactExports.useCallback(() => {
    optimisticBlobUrlsRef.current.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {
      }
    });
    optimisticBlobUrlsRef.current.clear();
  }, []);
  const showToast = reactExports.useCallback((message, duration = 2500) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (!isMountedRef.current) return;
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      setToast("");
      toastTimerRef.current = null;
    }, duration);
  }, []);
  reactExports.useEffect(() => () => {
    isMountedRef.current = false;
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    revokeOptimisticBlobUrls();
  }, [revokeOptimisticBlobUrls]);
  const disabledRef = reactExports.useRef(false);
  const failCountRef = reactExports.useRef(0);
  const loadGroups = reactExports.useCallback(async () => {
    if (disabledRef.current) return;
    try {
      const res = await getStoriesGrouped();
      if (!isMountedRef.current) return;
      if (res?.status === 404) {
        failCountRef.current += 1;
        if (failCountRef.current >= 2) {
          disabledRef.current = true;
        }
        setGroups([]);
      } else {
        failCountRef.current = 0;
        const freshGroups = Array.isArray(res?.data) ? res.data : [];
        revokeOptimisticBlobUrls();
        setGroups(freshGroups);
      }
    } catch (err) {
      if (!err?.isSilent && !err?.silent) {
        console.warn("[StoriesBar] failed to load grouped stories", err);
      }
      if (!isMountedRef.current) return;
      failCountRef.current += 1;
      if (failCountRef.current >= 3) {
        disabledRef.current = true;
      }
      setGroups([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [revokeOptimisticBlobUrls]);
  reactExports.useEffect(() => {
    loadGroups();
    let intervalId = null;
    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (disabledRef.current) {
          stopPolling();
          return;
        }
        if (typeof document !== "undefined" && document.hidden) return;
        loadGroups();
      }, 6e4);
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) ;
      else {
        if (!disabledRef.current) loadGroups();
      }
    };
    startPolling();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }
    return () => {
      stopPolling();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [loadGroups]);
  const myGroup = reactExports.useMemo(
    () => groups.find((g) => g.is_self) || null,
    [groups]
  );
  const otherGroups = reactExports.useMemo(
    () => groups.filter((g) => !g.is_self),
    [groups]
  );
  const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
  const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v", "video/3gpp", "video/mpeg"];
  const MAX_FILE_SIZE = 600 * 1024 * 1024;
  const MIN_FILE_SIZE = 1024;
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const type = (file.type || "").toLowerCase();
    const isImage = type.startsWith("image/") && ACCEPTED_IMAGE_TYPES.includes(type);
    const isVideo = type.startsWith("video/") && ACCEPTED_VIDEO_TYPES.includes(type);
    if (!isImage && !isVideo) {
      showToast("صيغة الملف غير مدعومة. اختر صورة أو فيديو.", 3500);
      return;
    }
    if (file.size < MIN_FILE_SIZE) {
      showToast("الملف فارغ أو تالف", 3e3);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast("الملف كبير جداً (الحد الأقصى 600MB)", 3500);
      return;
    }
    setPendingFile(file);
  };
  const handleEditorClose = () => setPendingFile(null);
  const handleEditorSuccess = async (uploadedStory, ctx = {}) => {
    setPendingFile(null);
    showToast("تم نشر القصة ✓", 2500);
    try {
      setGroups((prev) => {
        const prevSelf = prev.find((g) => g.is_self) || null;
        const { group: optimisticSelf, createdLocalUrl } = buildOptimisticSelfGroup(
          uploadedStory,
          ctx.file,
          ctx.caption,
          currentUser,
          prevSelf
        );
        if (createdLocalUrl) trackOptimisticBlobUrl(createdLocalUrl);
        const others = prev.filter((g) => !g.is_self);
        return [optimisticSelf, ...others];
      });
    } catch (e) {
    }
    disabledRef.current = false;
    failCountRef.current = 0;
    await loadGroups();
  };
  const openViewer = async (group) => {
    const idx = groups.findIndex((g) => g.user_id === group.user_id);
    setActiveGroupIndex(Math.max(0, idx));
    setViewerOpen(true);
    const first = group.stories?.[0];
    if (first?.id) {
      try {
        await viewStory(first.id);
      } catch (_) {
      }
    }
  };
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };
  if (!loading && groups.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "yam-stories-bar", "data-empty": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "yam-story-add",
          onClick: handleAddClick,
          "aria-label": "إضافة قصة جديدة",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-avatar", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || "me")}&background=8b5cf6&color=fff`,
                  alt: "",
                  loading: "lazy"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-plus", "aria-hidden": true, children: "+" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-name", children: "قصتك" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "image/*,video/*",
          hidden: true,
          onChange: handleFileSelect
        }
      ),
      pendingFile && /* @__PURE__ */ jsxRuntimeExports.jsx(StoryEditor, { file: pendingFile, onClose: handleEditorClose, onSuccess: handleEditorSuccess }),
      toast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-stories-toast", children: toast }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: barStyles })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "yam-stories-bar", role: "region", "aria-label": "ستوريات الأصدقاء", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: scrollRef, className: "yam-stories-scroll", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "yam-story-add",
          onClick: myGroup ? () => openViewer(myGroup) : handleAddClick,
          "aria-label": myGroup ? "عرض قصصي" : "إضافة قصة جديدة",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-story-avatar ${myGroup ? "has-stories" : ""}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || "me")}&background=8b5cf6&color=fff`,
                  alt: "",
                  loading: "lazy"
                }
              ),
              !myGroup && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-plus", "aria-hidden": true, children: "+" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-name", children: "قصتك" })
          ]
        }
      ),
      myGroup && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "yam-story-add-mini",
          onClick: handleAddClick,
          "aria-label": "إضافة قصة جديدة",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-avatar dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-plus", "aria-hidden": true, children: "+" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-name", children: "إضافة" })
          ]
        }
      ),
      otherGroups.map((group, idx) => {
        const realAvatar = group.user_avatar || group.avatar_url || "";
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.username || "user")}&background=random&color=fff`;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.button,
          {
            type: "button",
            whileTap: { scale: 0.92 },
            className: "yam-story-item",
            onClick: () => openViewer(group),
            "aria-label": `فتح قصص ${group.username}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-story-avatar ${group.has_unseen ? "unseen" : "seen"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: realAvatar || fallbackAvatar,
                    alt: "",
                    loading: "lazy",
                    onError: (e) => {
                      if (e.currentTarget.src !== fallbackAvatar) {
                        e.currentTarget.src = fallbackAvatar;
                      }
                    }
                  }
                ),
                group.stories?.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-count", "aria-hidden": true, children: group.stories.length })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-name", title: group.username, children: group.username })
            ]
          },
          `g-${group.user_id}`
        );
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*,video/*",
        hidden: true,
        onChange: handleFileSelect
      }
    ),
    pendingFile && /* @__PURE__ */ jsxRuntimeExports.jsx(StoryEditor, { file: pendingFile, onClose: handleEditorClose, onSuccess: handleEditorSuccess }),
    toast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-stories-toast", children: toast }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: viewerOpen && groups[activeGroupIndex] && /* @__PURE__ */ jsxRuntimeExports.jsx(
      StoryViewerEnhanced,
      {
        group: groups[activeGroupIndex],
        allGroups: groups,
        currentIndex: activeGroupIndex,
        currentUserId: currentUser?.id,
        onClose: () => {
          setViewerOpen(false);
          loadGroups();
        },
        onNextGroup: () => {
          if (activeGroupIndex < groups.length - 1) {
            setActiveGroupIndex((i) => i + 1);
          } else {
            setViewerOpen(false);
            loadGroups();
          }
        },
        onPrevGroup: () => {
          if (activeGroupIndex > 0) setActiveGroupIndex((i) => i - 1);
        }
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: barStyles })
  ] });
}
const barStyles = `
.yam-stories-bar {
  font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
  width: 100%;
  background: var(--surface, #0f0f14);
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
  padding: 10px 0;
  position: relative;
  z-index: 5;
}
.yam-stories-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 14px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.yam-stories-scroll::-webkit-scrollbar { display: none; }

.yam-story-item, .yam-story-add, .yam-story-add-mini {
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  width: 72px;
}
.yam-story-item:disabled, .yam-story-add:disabled { opacity: 0.6; cursor: wait; }

.yam-story-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 2.5px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.yam-story-avatar.seen {
  background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
}
.yam-story-avatar.unseen {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
}
.yam-story-avatar.has-stories {
  background: linear-gradient(135deg, #22d3ee 0%, #8b5cf6 100%);
}
.yam-story-avatar.dashed {
  background: transparent;
  border: 2px dashed rgba(139, 92, 246, 0.7);
}
.yam-story-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--surface, #0f0f14);
  background: #1a1a22;
}
.yam-story-plus {
  position: absolute;
  bottom: -2px;
  inset-inline-start: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0 0 2px var(--surface, #0f0f14);
}
.yam-story-avatar.dashed .yam-story-plus {
  position: static;
  width: 28px;
  height: 28px;
  font-size: 22px;
  box-shadow: none;
}
.yam-story-count {
  position: absolute;
  top: -2px;
  inset-inline-end: -2px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  padding: 0 6px;
  background: #ec4899;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--surface, #0f0f14);
}
.yam-story-name {
  font-size: 11.5px;
  color: var(--text-secondary, #d4d4d8);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  font-weight: 500;
}
.yam-story-add .yam-story-name { color: var(--text, #f4f4f5); font-weight: 600; }

/* تجاوب الشاشات */
@media (min-width: 768px) {
  .yam-story-item, .yam-story-add, .yam-story-add-mini { width: 80px; }
  .yam-story-avatar { width: 72px; height: 72px; padding: 3px; }
  .yam-story-name { font-size: 12.5px; max-width: 78px; }
  .yam-stories-scroll { gap: 14px; padding: 6px 18px; }
}
@media (min-width: 1280px) {
  .yam-story-item, .yam-story-add, .yam-story-add-mini { width: 86px; }
  .yam-story-avatar { width: 78px; height: 78px; }
  .yam-stories-scroll { gap: 16px; padding: 6px 22px; }
}
@media (max-width: 380px) {
  .yam-story-item, .yam-story-add, .yam-story-add-mini { width: 64px; }
  .yam-story-avatar { width: 56px; height: 56px; }
  .yam-story-name { font-size: 10.5px; max-width: 62px; }
}

/* Toast (v59.10) */
.yam-stories-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 15, 20, 0.95);
  color: #fff;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  z-index: 2200;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(139, 92, 246, 0.4);
  animation: yamToastIn 0.3s ease-out;
}
@keyframes yamToastIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
`;
const TABS = [
  { key: "all", label: "الكل" },
  { key: "messages", label: "الرسائل" },
  { key: "requests", label: "الطلبات" }
];
function SearchIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "6.5", fill: "none", stroke: "currentColor", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m16 16 4.2 4.2", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
  ] });
}
function DoubleCheckIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: "M2 13l4 4 8-10M9 17l1.2 1.2L22 7",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function BellIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "path",
      {
        d: "M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.2c0 .9-.3 1.8-.9 2.5l-1.1 1.3h13l-1.1-1.3c-.6-.7-.9-1.6-.9-2.5V9A4.5 4.5 0 0 0 12 4.5Z",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinejoin: "round"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9.8 18.2a2.5 2.5 0 0 0 4.4 0", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
  ] });
}
function YamshatMark() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 100 100", width: "34", height: "34", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "yam-row-y", x1: "0", y1: "0", x2: "1", y2: "1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#A78BFA" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#7C3AED" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 22 L50 60 L80 22 L70 22 L50 47 L30 22 Z", fill: "url(#yam-row-y)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M45 60 L55 60 L55 84 L45 84 Z", fill: "url(#yam-row-y)" })
  ] });
}
function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = /* @__PURE__ */ new Date();
  const sameDay = today.toDateString() === date.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = /* @__PURE__ */ new Date();
  yesterday.setDate(today.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return "أمس";
  return date.toLocaleDateString("ar-EG", { month: "numeric", day: "numeric" });
}
function initials(value = "") {
  return String(value || "").trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase() || "Y";
}
function gradientFromSeed(seed = "") {
  const value = Array.from(String(seed || "YAMSHAT")).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
  const hue = value % 360;
  return `linear-gradient(135deg, hsl(${hue} 78% 58%), hsl(${(hue + 42) % 360} 88% 62%))`;
}
function threadPreview(thread) {
  const content = String(thread?.last_message || "").trim();
  const type = String(thread?.last_message_type || "text").toLowerCase();
  if (content) {
    if (type === "voice") return `🎤 ${content}`;
    if (type === "image" || type === "photo") return `🖼️ ${content}`;
    if (type === "video") return `🎬 ${content}`;
    if (type === "file" || type === "document") return `📎 ${content}`;
    return content;
  }
  if (type === "voice") return "🎤 رسالة صوتية";
  if (type === "image" || type === "photo") return "🖼️ صورة";
  if (type === "video") return "🎬 فيديو";
  if (type === "file" || type === "document") return "📎 ملف";
  return "ابدأ المحادثة";
}
function normalizeThread(item = {}) {
  const username = String(item.username || item.name || "").trim();
  return {
    type: "thread",
    id: `thread:${username}`,
    username,
    title: username,
    avatar: item.avatar || "",
    preview: threadPreview(item),
    unreadCount: Number(item.unread_count || 0),
    isOnline: Boolean(item?.presence?.is_online),
    lastSeen: item?.presence?.last_seen || item?.last_seen || null,
    timestamp: item.created_at || null,
    // إذا كانت آخر رسالة من المستخدم الحالي وقد قُرئت → نعرض ✓✓
    // نضع علامة افتراضية عند غياب unread_count كي يطابق المرجع
    seen: Number(item.unread_count || 0) === 0,
    raw: item
  };
}
function normalizeNotificationItem(item = {}) {
  const title = String(item.title || "إشعار جديد").trim() || "إشعار جديد";
  const body = String(item.body || item.message || item.text || "").trim() || "لديك تحديث جديد";
  return {
    type: "notification",
    id: `notification:${item.id}`,
    notificationId: item.id,
    title,
    preview: body,
    unreadCount: item.is_read || item.seen ? 0 : 1,
    timestamp: item.created_at || null,
    path: item.path || item?.data?.path || "/notifications",
    raw: item
  };
}
function normalizeGroupItem(item = {}, currentUsername = "") {
  const members = Array.isArray(item.members) ? item.members : [];
  const isMember = members.some((member) => member?.username === currentUsername);
  return {
    type: "group",
    id: `group:${item.id}`,
    groupId: item.id,
    title: String(item.name || "مجموعة").trim() || "مجموعة",
    preview: item.description || `${Number(item.members_count || members.length || 0)} عضو`,
    unreadCount: Number(item.unread_count || 0),
    timestamp: item.created_at || null,
    isMember,
    raw: item
  };
}
function Avatar({ name, avatar, size = 56, online = false, fallback = null }) {
  const hasAvatar = Boolean(avatar);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-avatar", style: { width: size, height: size }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "yam-avatar-inner",
        style: {
          width: size,
          height: size,
          backgroundImage: hasAvatar ? `url(${avatar})` : gradientFromSeed(name)
        },
        "aria-hidden": "true",
        children: !hasAvatar ? fallback || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: initials(name) }) : null
      }
    ),
    online ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-online-dot", "aria-label": "متصل" }) : null
  ] });
}
function ComposeModal({ open, onClose, navigate, pushToast }) {
  const [tab, setTab] = reactExports.useState("chat");
  const [query, setQuery] = reactExports.useState("");
  const [users, setUsers] = reactExports.useState([]);
  const [searching, setSearching] = reactExports.useState(false);
  const [groupName, setGroupName] = reactExports.useState("");
  const [groupDesc, setGroupDesc] = reactExports.useState("");
  const [creatingGroup, setCreatingGroup] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!open) {
      setQuery("");
      setUsers([]);
      setGroupName("");
      setGroupDesc("");
      setTab("chat");
    }
  }, [open]);
  reactExports.useEffect(() => {
    if (!open || tab !== "chat") return void 0;
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      setSearching(true);
      try {
        const resp = await getUsers({ q: query, limit: 20 });
        if (cancelled) return;
        const list = Array.isArray(resp?.data) ? resp.data : resp?.data?.users || [];
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, tab, query]);
  const handleOpenChat = reactExports.useCallback(
    (user) => {
      if (!user) return;
      const username = user.username || user.user_name || user.handle;
      onClose?.();
      if (username) {
        navigate(`/chat/${encodeURIComponent(username)}`);
      } else if (user.id) {
        navigate(`/chat/${encodeURIComponent(user.id)}`);
      }
    },
    [navigate, onClose]
  );
  const composeMountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    composeMountedRef.current = true;
    return () => {
      composeMountedRef.current = false;
    };
  }, []);
  const handleCreateGroup = reactExports.useCallback(async () => {
    const name = groupName.trim();
    if (!name) {
      pushToast?.({ type: "info", title: "أدخل اسم المجموعة" });
      return;
    }
    setCreatingGroup(true);
    try {
      const resp = await createGroup({ name, description: groupDesc.trim() });
      const group = resp?.data || resp;
      if (!composeMountedRef.current) return;
      pushToast?.({ type: "success", title: "تم إنشاء المجموعة", description: name });
      onClose?.();
      if (group?.id) {
        navigate(`/groups`);
      }
    } catch {
      if (composeMountedRef.current) {
        pushToast?.({
          type: "warning",
          title: "تعذر إنشاء المجموعة",
          description: "تحقق من الاتصال وحاول مجدداً."
        });
      }
    } finally {
      if (composeMountedRef.current) setCreatingGroup(false);
    }
  }, [groupName, groupDesc, pushToast, onClose, navigate]);
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "yam-compose-overlay",
      dir: "rtl",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "إنشاء جديد",
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "yam-compose-modal",
          onClick: (e) => e.stopPropagation(),
          style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-compose-head", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "إنشاء جديد" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-compose-close", onClick: onClose, "aria-label": "إغلاق", children: "✕" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-compose-tabs", role: "tablist", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "aria-selected": tab === "chat",
                  className: `yam-compose-tab ${tab === "chat" ? "active" : ""}`,
                  onClick: () => setTab("chat"),
                  children: "دردشة جديدة"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "aria-selected": tab === "group",
                  className: `yam-compose-tab ${tab === "group" ? "active" : ""}`,
                  onClick: () => setTab("group"),
                  children: "مجموعة جديدة"
                }
              )
            ] }),
            tab === "chat" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-compose-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "search",
                  className: "yam-compose-input",
                  value: query,
                  onChange: (e) => setQuery(e.target.value),
                  placeholder: "ابحث عن شخص للمحادثة...",
                  "aria-label": "البحث عن مستخدم",
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-compose-users-list", children: searching ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-compose-hint", children: "جارٍ البحث…" }) : users.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-compose-hint", children: query ? `لا توجد نتائج لـ "${query}".` : "ابدأ بكتابة اسم المستخدم." }) : users.map((u) => {
                const name = u.full_name || u.name || u.username || "مستخدم";
                const handle = u.username || u.user_name || u.handle || "";
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    className: "yam-compose-user-row",
                    onClick: () => handleOpenChat(u),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-compose-user-avatar", "aria-hidden": "true", children: name.slice(0, 1) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-compose-user-meta", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: name }),
                        handle ? /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
                          "@",
                          handle
                        ] }) : null
                      ] })
                    ]
                  },
                  u.id || handle || name
                );
              }) })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-compose-body", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-compose-label", htmlFor: "yam-group-name", children: "اسم المجموعة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "yam-group-name",
                  type: "text",
                  className: "yam-compose-input",
                  value: groupName,
                  onChange: (e) => setGroupName(e.target.value),
                  placeholder: "مثال: عائلة تواصل",
                  maxLength: 80,
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-compose-label", htmlFor: "yam-group-desc", children: "وصف (اختياري)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  id: "yam-group-desc",
                  className: "yam-compose-input yam-compose-textarea",
                  value: groupDesc,
                  onChange: (e) => setGroupDesc(e.target.value),
                  placeholder: "وصف قصير للمجموعة",
                  rows: 3,
                  maxLength: 200
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "yam-compose-primary",
                  onClick: handleCreateGroup,
                  disabled: creatingGroup || !groupName.trim(),
                  children: creatingGroup ? "جارٍ الإنشاء…" : "إنشاء المجموعة"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-compose-overlay {
            position: fixed; inset: 0; z-index: 1200;
            background: rgba(2, 4, 12, 0.72);
            backdrop-filter: blur(6px);
            display: grid; place-items: center; padding: 16px;
          }
          .yam-compose-modal {
            width: 100%; max-width: 460px;
            background: #0B1024;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 22px; padding: 18px;
            box-shadow: 0 30px 80px rgba(0,0,0,0.55);
            color: #fff;
          }
          .yam-compose-head {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 14px;
          }
          .yam-compose-head strong { font-size: 17px; }
          .yam-compose-close {
            width: 34px; height: 34px; border-radius: 50%;
            background: rgba(255,255,255,0.06); border: 0; color: #fff;
            cursor: pointer; font-size: 14px;
          }
          .yam-compose-tabs {
            display: flex; gap: 8px; margin-bottom: 14px;
            padding: 4px; background: rgba(255,255,255,0.04);
            border-radius: 14px;
          }
          .yam-compose-tab {
            flex: 1; padding: 10px; border: 0; background: transparent;
            color: #b9bee0; font-weight: 700; border-radius: 10px;
            cursor: pointer; font-size: 14px;
          }
          .yam-compose-tab.active {
            background: linear-gradient(135deg, #8b5cf6, #6320d9);
            color: #fff;
          }
          .yam-compose-body { display: grid; gap: 10px; }
          .yam-compose-label { font-size: 13px; color: #aab0d6; }
          .yam-compose-input {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            color: #fff; padding: 12px 14px;
            border-radius: 12px; font-size: 14px;
            font-family: inherit;
          }
          .yam-compose-textarea { resize: vertical; min-height: 80px; }
          .yam-compose-users-list { display: grid; gap: 4px; max-height: 320px; overflow-y: auto; }
          .yam-compose-hint { color: #8b90b7; text-align: center; font-size: 13px; padding: 18px 8px; margin: 0; }
          .yam-compose-user-row {
            display: flex; gap: 10px; align-items: center; padding: 10px;
            border-radius: 12px; border: 1px solid transparent;
            background: transparent; color: #fff; cursor: pointer; text-align: start;
          }
          .yam-compose-user-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
          .yam-compose-user-avatar {
            width: 38px; height: 38px; border-radius: 50%;
            display: grid; place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white; font-weight: 800; flex-shrink: 0;
          }
          .yam-compose-user-meta { display: grid; gap: 2px; }
          .yam-compose-user-meta small { color: #8b90b7; font-size: 12px; }
          .yam-compose-primary {
            margin-top: 6px; min-height: 46px; border-radius: 12px; border: none;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white; font-weight: 700; cursor: pointer; font-size: 15px;
          }
          .yam-compose-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        ` })
          ]
        }
      )
    }
  );
}
function Inbox() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  useIsMobile();
  const [loading, setLoading] = reactExports.useState(true);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [threads, setThreads] = reactExports.useState([]);
  const [notifications, setNotifications] = reactExports.useState([]);
  const [groups, setGroups] = reactExports.useState([]);
  const [profile, setProfile] = reactExports.useState(null);
  const [composeOpen, setComposeOpen] = reactExports.useState(false);
  const inboxMountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    inboxMountedRef.current = true;
    return () => {
      inboxMountedRef.current = false;
    };
  }, []);
  const loadData = reactExports.useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const results = await Promise.allSettled([
        getChatThreads(),
        getNotifications(40),
        getGroups(),
        getMe()
      ]);
      if (!inboxMountedRef.current) return;
      const [threadsRes, notificationsRes, groupsRes, meRes] = results;
      if (threadsRes.status === "fulfilled") {
        const nextThreads = Array.isArray(threadsRes.value?.data) ? threadsRes.value.data : [];
        setThreads(nextThreads.map(normalizeThread).filter((item) => item.username));
      } else {
        setThreads([]);
      }
      if (notificationsRes.status === "fulfilled") {
        const nextNotifications = Array.isArray(notificationsRes.value?.data) ? notificationsRes.value.data : [];
        setNotifications(nextNotifications.map(normalizeNotificationItem));
      } else {
        setNotifications([]);
      }
      if (groupsRes.status === "fulfilled") {
        setGroups(Array.isArray(groupsRes.value?.data) ? groupsRes.value.data : []);
      } else {
        setGroups([]);
      }
      if (meRes.status === "fulfilled") {
        setProfile(meRes.value?.data || null);
      } else {
        setProfile(null);
      }
      if (results.every((entry) => entry.status === "rejected")) {
        pushToast({
          type: "error",
          title: "تعذر تحميل الصفحة",
          description: "راجع الاتصال بالخادم ثم حاول مرة أخرى."
        });
      }
      setLoading(false);
      setRefreshing(false);
    },
    [pushToast]
  );
  reactExports.useEffect(() => {
    loadData(false);
  }, [loadData]);
  reactExports.useEffect(() => {
    const handler = () => setComposeOpen(true);
    window.addEventListener("yamshat:open-compose", handler);
    return () => window.removeEventListener("yamshat:open-compose", handler);
  }, []);
  const currentUsername = reactExports.useMemo(
    () => String(profile?.username || profile?.name || "").trim(),
    [profile]
  );
  const unreadMessagesCount = reactExports.useMemo(
    () => threads.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0),
    [threads]
  );
  const requestItems = reactExports.useMemo(
    () => notifications.filter((item) => item.unreadCount > 0),
    [notifications]
  );
  const groupItems = reactExports.useMemo(
    () => groups.map((item) => normalizeGroupItem(item, currentUsername)),
    [currentUsername, groups]
  );
  const requestCount = requestItems.length;
  const filteredThreads = reactExports.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter(
      (item) => [item.title, item.preview].some(
        (field) => String(field || "").toLowerCase().includes(query)
      )
    );
  }, [searchQuery, threads]);
  reactExports.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groupItems;
    return groupItems.filter(
      (item) => [item.title, item.preview].some(
        (field) => String(field || "").toLowerCase().includes(query)
      )
    );
  }, [groupItems, searchQuery]);
  const filteredRequests = reactExports.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requestItems;
    return requestItems.filter(
      (item) => [item.title, item.preview].some(
        (field) => String(field || "").toLowerCase().includes(query)
      )
    );
  }, [requestItems, searchQuery]);
  const unifiedItems = reactExports.useMemo(() => {
    if (activeTab === "requests") return filteredRequests;
    return filteredThreads;
  }, [activeTab, filteredRequests, filteredThreads]);
  const handleOpenThread = reactExports.useCallback(
    async (thread) => {
      if (!thread?.username) return;
      try {
        if (thread.unreadCount > 0) {
          await markMessagesSeen(thread.username);
          setThreads(
            (prev) => prev.map(
              (item) => item.username === thread.username ? { ...item, unreadCount: 0, seen: true } : item
            )
          );
        }
      } catch {
      }
      navigate(`/chat/${encodeURIComponent(thread.username)}`);
    },
    [navigate]
  );
  const handleOpenRequest = reactExports.useCallback(
    async (item) => {
      if (!item?.notificationId) return;
      try {
        await markNotificationRead(item.notificationId);
        setNotifications(
          (prev) => prev.map(
            (entry) => entry.notificationId === item.notificationId ? { ...entry, unreadCount: 0 } : entry
          )
        );
      } catch {
      }
      navigate(item.path || "/notifications");
    },
    [navigate]
  );
  const handleOpenGroup = reactExports.useCallback(
    (group) => {
      if (!group) return;
      navigate("/groups");
    },
    [navigate]
  );
  const markAllRequestsAsRead = reactExports.useCallback(async () => {
    if (!requestCount) return;
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, unreadCount: 0 })));
      pushToast({
        type: "success",
        title: "تم تحديث الطلبات",
        description: "تم تعليم كل الطلبات كمقروءة."
      });
    } catch {
      pushToast({
        type: "warning",
        title: "تعذر تحديث الطلبات",
        description: "حاول مرة أخرى بعد قليل."
      });
    }
  }, [pushToast, requestCount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      className: "yam-inbox-page",
      dir: "rtl",
      style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-inbox-screen", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ComposeModal,
            {
              open: composeOpen,
              onClose: () => setComposeOpen(false),
              navigate,
              pushToast
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StoriesBar,
            {
              currentUser: profile,
              onOpenComposer: () => navigate("/stories")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-search-box", role: "search", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SearchIcon, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "search",
                value: searchQuery,
                onChange: (event) => setSearchQuery(event.target.value),
                placeholder: "البحث في المحادثات",
                "aria-label": "البحث في المحادثات"
              }
            ),
            refreshing ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-refresh-spinner", "aria-hidden": "true" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-tabs", role: "tablist", children: TABS.map((tab) => {
            let count = 0;
            if (tab.key === "messages") count = unreadMessagesCount;
            else if (tab.key === "requests") count = requestCount;
            const isActive = activeTab === tab.key;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": isActive,
                className: `yam-tab ${isActive ? "active" : ""}`,
                onClick: () => setActiveTab(tab.key),
                onDoubleClick: () => loadData(true),
                children: [
                  count > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-tab-badge", children: count }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tab.label })
                ]
              },
              tab.key
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-list", role: "list", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-loading", children: "جارٍ تحميل المحادثات…" }) : unifiedItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-empty", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-icon", children: "💬" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: activeTab === "requests" ? "لا توجد طلبات جديدة" : activeTab === "messages" ? "لا توجد محادثات بعد" : "ابدأ محادثتك الأولى" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activeTab === "requests" ? "أي طلب جديد سيظهر فوراً في هذه المساحة." : 'اضغط زر "+" في الأسفل لبدء محادثة جديدة.' }),
            activeTab === "requests" && requestCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-empty-cta", onClick: markAllRequestsAsRead, children: "تعليم الكل كمقروء" }) : null
          ] }) : unifiedItems.map((item) => {
            if (item.type === "notification") {
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: "yam-row",
                  role: "listitem",
                  onClick: () => handleOpenRequest(item),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-side", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-row-time", children: formatTime(item.timestamp) }),
                      item.unreadCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-row-unread", children: item.unreadCount }) : null
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-main", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-text", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-row-title", children: item.title }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-preview", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-row-tick", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DoubleCheckIcon, {}) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.preview })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-row-avatar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-avatar", style: { width: 56, height: 56 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "yam-avatar-inner yam-avatar-system",
                          style: { width: 56, height: 56 },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(BellIcon, {})
                        }
                      ) }) })
                    ] })
                  ]
                },
                item.id
              );
            }
            if (item.type === "group") {
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: "yam-row",
                  role: "listitem",
                  onClick: () => handleOpenGroup(item),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-side", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-row-time", children: formatTime(item.timestamp) }),
                      item.unreadCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-row-unread", children: item.unreadCount }) : null
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-main", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-text", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-row-title", children: item.title }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-preview", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-row-tick", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DoubleCheckIcon, {}) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.preview })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-row-avatar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-avatar", style: { width: 56, height: 56 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "yam-avatar-inner yam-avatar-yamshat",
                            style: { width: 56, height: 56 },
                            children: item.raw?.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "span",
                              {
                                className: "yam-avatar-bg",
                                style: { backgroundImage: `url(${item.raw.avatar})` }
                              }
                            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatMark, {})
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-online-dot", "aria-hidden": "true" })
                      ] }) })
                    ] })
                  ]
                },
                item.id
              );
            }
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "yam-row",
                role: "listitem",
                onClick: () => handleOpenThread(item),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-side", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-row-time", children: formatTime(item.timestamp) }),
                    item.unreadCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-row-unread", children: item.unreadCount }) : null
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-main", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-text", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-row-title", children: item.title }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-row-preview", children: [
                        item.unreadCount === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-row-tick", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DoubleCheckIcon, {}) }) : null,
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: item.preview })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-row-avatar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Avatar,
                      {
                        name: item.title,
                        avatar: item.avatar,
                        size: 56,
                        online: item.isOnline
                      }
                    ) })
                  ] })
                ]
              },
              item.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          /* ⭐ v59.13.31 — .yam-inbox-page هي scroll container بصمة .yam-groups-page تماماً
             height ثابت + overflow-y:auto + momentum scroll + touch-action:pan-y
             هذا يحلّ مشكلة عدم استجابة السحب من منتصف الشاشة. */
          .yam-inbox-page {
            /* ✅ height ثابت — أبعاد معروفة مسبقاً تُفعّل momentum scroll على iOS Safari */
            height: 100vh;
            height: 100dvh;
            max-height: 100dvh;
            overflow-y: auto;
            overflow-x: hidden;
            background:
              radial-gradient(circle at top right, rgba(130, 73, 255, 0.14), transparent 22%),
              radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 20%),
              #060818;
            color: #fff;
            /* ✅ السر: momentum scroll حقيقي (iOS) */
            -webkit-overflow-scrolling: touch;
            /* ✅ اللمس: pan-y نقي (السحب العمودي) */
            touch-action: pan-y;
            -ms-touch-action: pan-y;
            /* ✅ لا انعكاس bounce يبتلع التمرير */
            overscroll-behavior-y: contain;
            overscroll-behavior-x: none;
            /* ✅ لا transform/filter يكسر momentum على iOS */
            transform: none;
            -webkit-transform: none;
            filter: none;
            -webkit-filter: none;
            perspective: none;
            pointer-events: auto;
            overflow-anchor: none;
            will-change: scroll-position;
            scrollbar-width: none;
            box-sizing: border-box;
          }
          .yam-inbox-page::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
          .yam-inbox-screen {
            max-width: 520px;
            margin: 0 auto;
            /* مسافة علوية تكفي للهيدر الموحَّد (60px) + مسافة سفلية تكفي للـ BottomNav */
            padding:
              calc(76px + env(safe-area-inset-top, 0px))
              14px
              calc(120px + env(safe-area-inset-bottom, 0px));
            /* ✅ لا overflow ذاتي — تتدفّق طبيعياً داخل .yam-inbox-page */
            min-height: auto;
            height: auto;
            max-height: none;
            overflow: visible;
            touch-action: pan-y;
            pointer-events: auto;
          }

          /* ============== شريط البحث ============== */
          .yam-search-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #0E1530;
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 16px;
            padding: 13px 16px;
            margin-bottom: 16px;
            color: #6E73A6;
          }
          .yam-search-box svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .yam-search-box input {
            flex: 1;
            background: transparent;
            border: 0;
            outline: 0;
            color: #fff;
            font-size: 14px;
            font-family: inherit;
            text-align: right;
          }
          .yam-search-box input::placeholder {
            color: #6E73A6;
            font-size: 14px;
          }
          .yam-refresh-spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(139,92,246,0.25);
            border-top-color: #A78BFA;
            animation: yam-spin 0.9s linear infinite;
            flex-shrink: 0;
          }
          @keyframes yam-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          /* ============== التبويبات ============== */
          .yam-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 18px;
            /* dir=rtl سيجعل العنصر الأول (الكل) يظهر على اليمين */
          }
          .yam-tab {
            flex: 1;
            min-height: 48px;
            border: 0;
            border-radius: 999px;
            background: #0E1530;
            color: #B8BCE3;
            font-family: inherit;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: background 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
          }
          .yam-tab:hover {
            background: #131A3A;
          }
          .yam-tab.active {
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
            color: #fff;
            box-shadow: 0 10px 26px rgba(124, 58, 237, 0.42);
          }
          .yam-tab-badge {
            min-width: 22px;
            height: 22px;
            padding: 0 6px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            background: #8B5CF6;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            line-height: 1;
          }
          .yam-tab.active .yam-tab-badge {
            background: rgba(255,255,255,0.22);
            color: #fff;
          }

          /* ============== قائمة الصفوف ============== */
          .yam-list {
            display: flex;
            flex-direction: column;
          }
          .yam-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 16px 4px;
            background: transparent;
            border: 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            color: inherit;
            cursor: pointer;
            font-family: inherit;
            text-align: right;
            transition: background 0.18s ease;
          }
          .yam-row:hover,
          .yam-row:focus-visible {
            background: rgba(139, 92, 246, 0.04);
            outline: none;
          }
          .yam-row:last-child {
            border-bottom: 0;
          }

          /* العمود الجانبي (الوقت + شارة العدد) — يظهر على اليسار في RTL */
          .yam-row-side {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            flex-shrink: 0;
            min-width: 48px;
          }
          .yam-row-time {
            font-size: 12px;
            color: #8085AC;
            white-space: nowrap;
            font-weight: 500;
          }
          .yam-row-unread {
            min-width: 22px;
            height: 22px;
            padding: 0 7px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            background: #8B5CF6;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            line-height: 1;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          }

          /* الجزء الرئيسي (النص + الصورة) */
          .yam-row-main {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }
          .yam-row-text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
            /* النص محاذٍ لليمين بسبب dir=rtl، والصورة ستكون على يمينه */
          }
          .yam-row-title {
            font-size: 17px;
            font-weight: 700;
            color: #FFFFFF;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: right;
          }
          .yam-row-preview {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #8085AC;
            font-size: 14px;
            min-width: 0;
            /* dir=rtl: العلامة ✓✓ تظهر يسار النص (بعد النص في تدفق RTL) */
            flex-direction: row;
          }
          .yam-row-preview p {
            margin: 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
            text-align: right;
          }
          .yam-row-tick {
            display: inline-flex;
            align-items: center;
            color: #A78BFA;
            flex-shrink: 0;
          }

          /* الصورة الدائرية */
          .yam-row-avatar {
            flex-shrink: 0;
          }
          .yam-avatar {
            position: relative;
            border-radius: 50%;
            overflow: visible;
          }
          .yam-avatar-inner {
            position: relative;
            border-radius: 50%;
            background-size: cover;
            background-position: center;
            display: grid;
            place-items: center;
            color: #fff;
            font-weight: 800;
            overflow: hidden;
            box-shadow: 0 6px 18px rgba(0,0,0,0.25);
          }
          .yam-avatar-inner span {
            font-size: 18px;
            letter-spacing: 0.04em;
          }
          .yam-avatar-system {
            background: linear-gradient(135deg, rgba(139,92,246,0.32), rgba(87,28,221,0.55));
            color: #EFE6FF;
          }
          .yam-avatar-system svg {
            width: 24px;
            height: 24px;
          }
          .yam-avatar-yamshat {
            background: #0E1530;
            border: 1px solid rgba(139, 92, 246, 0.25);
          }
          .yam-avatar-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            border-radius: 50%;
          }

          .yam-online-dot {
            position: absolute;
            right: 2px;
            bottom: 2px;
            width: 13px;
            height: 13px;
            border-radius: 50%;
            background: #22C55E;
            border: 2.5px solid #060818;
            box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.45);
          }

          /* ============== حالات (تحميل/فارغ) ============== */
          .yam-loading {
            padding: 40px 16px;
            text-align: center;
            color: #8085AC;
            font-size: 14px;
          }
          .yam-empty {
            padding: 60px 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .yam-empty-icon {
            font-size: 44px;
            margin-bottom: 6px;
          }
          .yam-empty strong {
            font-size: 17px;
            color: #fff;
          }
          .yam-empty span {
            color: #8085AC;
            font-size: 13px;
            max-width: 280px;
            line-height: 1.6;
          }
          .yam-empty-cta {
            margin-top: 14px;
            padding: 10px 18px;
            border-radius: 12px;
            border: 0;
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
            color: #fff;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            font-family: inherit;
          }

          /* استجابة شاشة أعرض (تابلت/ديسكتوب) */
          @media (min-width: 720px) {
            .yam-row-title { font-size: 18px; }
            .yam-row-preview { font-size: 14px; }
          }
        ` })
      ]
    }
  ) });
}
export {
  Inbox as default
};
