import { b8 as useToast, aK as reactExports, ah as jsxRuntimeExports, Z as getCurrentUsername, b0 as useNavigate } from "../index-Dz8FA2T4.js";
import { a as apiClient } from "./apiClient-DEojD3jc.js";
import { b as createPost, u as updatePost } from "./posts-DcFjEz5E.js";
import { u as uploadFile } from "./mediaUploadService-CZ2Dj9RA.js";
const createLiveStream = (streamData = {}) => apiClient.post("/live/create", {
  title: streamData.title || "",
  description: streamData.description || "",
  category: streamData.category || "أخرى",
  quality: streamData.quality || "720p",
  is_public: streamData.isPublic !== false,
  allow_comments: streamData.allowComments !== false,
  allow_gifts: streamData.allowGifts !== false,
  allow_recording: streamData.allowRecording || false
});
const startLiveStream = (streamId, payload = {}) => apiClient.post(`/live/${streamId}/start`, {
  quality: payload.quality || "720p",
  enable_recording: payload.enableRecording || false
});
const endLiveStream = (streamId) => apiClient.post(`/live/${streamId}/end`);
const updateCameraState = (streamId, cameraData = {}) => apiClient.put(`/live/${streamId}/camera`, {
  camera_enabled: cameraData.cameraEnabled,
  microphone_enabled: cameraData.microphoneEnabled,
  screen_share_enabled: cameraData.screenShareEnabled,
  video_bitrate: cameraData.videoBitrate,
  audio_bitrate: cameraData.audioBitrate
});
const toggleCamera = async (streamId, enabled) => {
  return updateCameraState(streamId, {
    cameraEnabled: enabled
  });
};
const toggleMicrophone = async (streamId, enabled) => {
  return updateCameraState(streamId, {
    microphoneEnabled: enabled
  });
};
const getStreamStats = (streamId) => apiClient.get(`/live/${streamId}/stats`, { cache: false, forceRefresh: true });
const sendLiveComment = (streamId, commentData = {}) => apiClient.post(`/live/${streamId}/comment`, {
  text: commentData.text || ""
});
const getLiveComments = (streamId, limit = 50) => apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });
const sendLiveGift = (streamId, giftData = {}) => apiClient.post(`/live/${streamId}/gift`, {
  gift_id: giftData.giftId,
  name: giftData.name,
  price: giftData.price
});
const recordLiveStream = (streamId, recordingData = {}) => {
  const action = recordingData.action || "start";
  return apiClient.post(`/live/${streamId}/recording/${action}`);
};
const getStreamViewers = (roomId) => apiClient.get(`/live/${roomId}/viewers`, { cache: false, forceRefresh: true });
const removeViewer = (roomId, userId) => apiClient.post(`/live/${roomId}/remove-viewer`, { user_id: userId });
const muteUser = (roomId, userId, moderatorId, reason = "", durationMinutes = 5) => apiClient.post(`/live/${roomId}/mute`, {
  user_id: userId,
  moderator_id: moderatorId,
  reason,
  duration_minutes: durationMinutes
});
const unmuteUser = (roomId, userId) => apiClient.post(`/live/${roomId}/unmute`, { user_id: userId });
const banUser = (roomId, userId, moderatorId, reason = "", duration = "temporary") => apiClient.post(`/live/${roomId}/ban`, {
  user_id: userId,
  moderator_id: moderatorId,
  reason,
  duration
});
const unbanUser = (roomId, userId) => apiClient.post(`/live/${roomId}/unban`, { user_id: userId });
function Avatar$1({ name = "", size = 32 }) {
  const colors = ["#7c3aed", "#3b82f6", "#10b981", "#f97316", "#ec4899"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        color: "white",
        fontWeight: 900,
        fontSize: size / 2.5,
        flexShrink: 0
      },
      children: name?.charAt(0).toUpperCase() || "?"
    }
  );
}
function ViewersManagementPanel({
  streamId,
  hostId,
  onViewerCountChange
}) {
  const { pushToast } = useToast();
  const [viewers, setViewers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [selectedViewer, setSelectedViewer] = reactExports.useState(null);
  const [showActionMenu, setShowActionMenu] = reactExports.useState(null);
  const [filterStatus, setFilterStatus] = reactExports.useState("all");
  const pollingStateRef = reactExports.useRef({ inFlight: false, backoffUntil: 0 });
  const loadViewers = reactExports.useCallback(async () => {
    const state = pollingStateRef.current;
    if (!streamId || state.inFlight || Date.now() < state.backoffUntil) return;
    state.inFlight = true;
    setLoading(true);
    try {
      const response = await getStreamViewers(streamId);
      state.backoffUntil = 0;
      const viewersList = Array.isArray(response?.data) ? response.data : [];
      setViewers(viewersList);
      onViewerCountChange?.(viewersList.length);
    } catch (error) {
      if (Number(error?.response?.status) === 429) {
        const retryAfter = Number(error?.response?.headers?.["retry-after"] || error?.response?.data?.retry_after || 20);
        state.backoffUntil = Date.now() + (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1e3 : 2e4);
      }
      console.error("خطأ في تحميل المشاهدين:", error);
    } finally {
      state.inFlight = false;
      setLoading(false);
    }
  }, [streamId, onViewerCountChange]);
  reactExports.useEffect(() => {
    loadViewers();
    const interval = setInterval(loadViewers, 12e3);
    return () => clearInterval(interval);
  }, [loadViewers]);
  const handleMuteUser = reactExports.useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;
      try {
        await muteUser(streamId, viewer.user_id, hostId, "من قبل المضيف", 5);
        setViewers(
          (prev) => prev.map(
            (v) => v.user_id === viewer.user_id ? { ...v, is_muted: true } : v
          )
        );
        pushToast?.({
          type: "success",
          title: "تم كتم الصوت",
          description: `تم كتم صوت ${viewer.username}`
        });
        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: "warning",
          title: "خطأ في كتم الصوت",
          description: error?.response?.data?.message || "حاول مرة أخرى"
        });
      }
    },
    [streamId, hostId, pushToast]
  );
  const handleUnmuteUser = reactExports.useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;
      try {
        await unmuteUser(streamId, viewer.user_id);
        setViewers(
          (prev) => prev.map(
            (v) => v.user_id === viewer.user_id ? { ...v, is_muted: false } : v
          )
        );
        pushToast?.({
          type: "success",
          title: "تم رفع الكتم",
          description: `تم رفع كتم صوت ${viewer.username}`
        });
        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: "warning",
          title: "خطأ في رفع الكتم",
          description: error?.response?.data?.message || "حاول مرة أخرى"
        });
      }
    },
    [streamId, pushToast]
  );
  const handleBanUser = reactExports.useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;
      if (!window.confirm(`هل أنت متأكد من حظر ${viewer.username}؟`)) return;
      try {
        await banUser(streamId, viewer.user_id, hostId, "من قبل المضيف", "temporary");
        setViewers(
          (prev) => prev.map(
            (v) => v.user_id === viewer.user_id ? { ...v, is_banned: true } : v
          )
        );
        pushToast?.({
          type: "success",
          title: "تم الحظر",
          description: `تم حظر ${viewer.username}`
        });
        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: "warning",
          title: "خطأ في الحظر",
          description: error?.response?.data?.message || "حاول مرة أخرى"
        });
      }
    },
    [streamId, hostId, pushToast]
  );
  const handleUnbanUser = reactExports.useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;
      try {
        await unbanUser(streamId, viewer.user_id);
        setViewers(
          (prev) => prev.map(
            (v) => v.user_id === viewer.user_id ? { ...v, is_banned: false } : v
          )
        );
        pushToast?.({
          type: "success",
          title: "تم رفع الحظر",
          description: `تم رفع حظر ${viewer.username}`
        });
        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: "warning",
          title: "خطأ في رفع الحظر",
          description: error?.response?.data?.message || "حاول مرة أخرى"
        });
      }
    },
    [streamId, pushToast]
  );
  const handleRemoveViewer = reactExports.useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;
      try {
        await removeViewer(streamId, viewer.user_id);
        setViewers((prev) => prev.filter((v) => v.user_id !== viewer.user_id));
        pushToast?.({
          type: "success",
          title: "تم الإزالة",
          description: `تم إزالة ${viewer.username}`
        });
        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: "warning",
          title: "خطأ في الإزالة",
          description: error?.response?.data?.message || "حاول مرة أخرى"
        });
      }
    },
    [streamId, pushToast]
  );
  const filteredViewers = viewers.filter((viewer) => {
    if (filterStatus === "muted") return viewer.is_muted;
    if (filterStatus === "banned") return viewer.is_banned;
    return true;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "viewers-management-panel", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "إدارة المشاهدين" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-header-stats", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vmp-stat", children: [
          "👁 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: viewers.length }),
          " مشاهد"
        ] }),
        viewers.some((v) => v.is_muted) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vmp-stat vmp-stat-muted", children: [
          "🔇 ",
          viewers.filter((v) => v.is_muted).length,
          " مكتوم"
        ] }),
        viewers.some((v) => v.is_banned) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "vmp-stat vmp-stat-banned", children: [
          "🚫 ",
          viewers.filter((v) => v.is_banned).length,
          " محظور"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-filters", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: `vmp-filter-btn ${filterStatus === "all" ? "active" : ""}`,
          onClick: () => setFilterStatus("all"),
          children: [
            "الكل (",
            viewers.length,
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: `vmp-filter-btn ${filterStatus === "muted" ? "active" : ""}`,
          onClick: () => setFilterStatus("muted"),
          children: [
            "مكتومون (",
            viewers.filter((v) => v.is_muted).length,
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: `vmp-filter-btn ${filterStatus === "banned" ? "active" : ""}`,
          onClick: () => setFilterStatus("banned"),
          children: [
            "محظورون (",
            viewers.filter((v) => v.is_banned).length,
            ")"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vmp-viewers-list", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vmp-loading", children: "جاري التحميل..." }) : filteredViewers.length > 0 ? filteredViewers.map((viewer) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `vmp-viewer-item ${viewer.is_muted ? "muted" : ""} ${viewer.is_banned ? "banned" : ""}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-viewer-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar$1, { name: viewer.username, size: 32 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-viewer-details", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-viewer-name", children: [
                viewer.username,
                viewer.is_muted && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vmp-badge muted", children: "🔇 مكتوم" }),
                viewer.is_banned && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "vmp-badge banned", children: "🚫 محظور" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-viewer-stats", children: [
                "💜 ",
                viewer.hearts_sent || 0,
                " | 🎁 ",
                viewer.gifts_sent || 0,
                " | 💬",
                " ",
                viewer.comments_count || 0
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-viewer-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "vmp-action-btn vmp-action-menu",
                onClick: () => setShowActionMenu(
                  showActionMenu === viewer.user_id ? null : viewer.user_id
                ),
                title: "المزيد من الخيارات",
                children: "⋮"
              }
            ),
            showActionMenu === viewer.user_id && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vmp-action-menu-dropdown", children: [
              !viewer.is_muted ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "vmp-menu-item vmp-menu-mute",
                  onClick: () => handleMuteUser(viewer),
                  children: "🔇 كتم الصوت"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "vmp-menu-item vmp-menu-unmute",
                  onClick: () => handleUnmuteUser(viewer),
                  children: "🔊 رفع الكتم"
                }
              ),
              !viewer.is_banned ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "vmp-menu-item vmp-menu-ban",
                  onClick: () => handleBanUser(viewer),
                  children: "🚫 حظر"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "vmp-menu-item vmp-menu-unban",
                  onClick: () => handleUnbanUser(viewer),
                  children: "✅ رفع الحظر"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "vmp-menu-item vmp-menu-remove",
                  onClick: () => handleRemoveViewer(viewer),
                  children: "❌ إزالة"
                }
              )
            ] })
          ] })
        ]
      },
      viewer.user_id
    )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vmp-empty", children: filterStatus === "all" ? "لا يوجد مشاهدون حالياً" : "لا توجد نتائج" }) })
  ] });
}
const GIFTS = [
  { id: 1, name: "وردة", icon: "🌹", price: 10 },
  { id: 2, name: "قهوة", icon: "☕", price: 50 },
  { id: 3, name: "قلب كبير", icon: "💜", price: 100 },
  { id: 4, name: "نجمة", icon: "⭐", price: 250 },
  { id: 5, name: "تاج ملكي", icon: "👑", price: 1e3 }
];
function Avatar({ name = "", size = 42 }) {
  const colors = ["#7c3aed", "#3b82f6", "#10b981", "#f97316", "#ec4899"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        color: "white",
        fontWeight: 900,
        fontSize: size / 2.5,
        flexShrink: 0
      },
      children: name?.charAt(0).toUpperCase() || "?"
    }
  );
}
function LiveStudio() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();
  const [streams, setStreams] = reactExports.useState([]);
  const [activeStream, setActiveStream] = reactExports.useState(null);
  const [isStreaming, setIsStreaming] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  const [newStreamData, setNewStreamData] = reactExports.useState({
    title: "",
    description: "",
    category: "ألعاب",
    quality: "720p",
    isPublic: true
  });
  const [streamStats, setStreamStats] = reactExports.useState({
    viewers: 0,
    hearts: 0,
    gifts: 0,
    comments: 0,
    duration: 0,
    bitrate: 0
  });
  const [comments, setComments] = reactExports.useState([]);
  const [commentText, setCommentText] = reactExports.useState("");
  const [showGiftPanel, setShowGiftPanel] = reactExports.useState(false);
  const [viewers, setViewers] = reactExports.useState([]);
  const [cameraReady, setCameraReady] = reactExports.useState(false);
  const [cameraError, setCameraError] = reactExports.useState("");
  const [recordingEnabled, setRecordingEnabled] = reactExports.useState(false);
  const [streamHealth, setStreamHealth] = reactExports.useState("good");
  const [cameraState, setCameraState] = reactExports.useState({
    cameraEnabled: true,
    microphoneEnabled: true,
    screenShareEnabled: false
  });
  const [coverImage, setCoverImage] = reactExports.useState(null);
  const [coverPreview, setCoverPreview] = reactExports.useState("");
  const [activePostId, setActivePostId] = reactExports.useState(null);
  const localVideoRef = reactExports.useRef(null);
  const localStreamRef = reactExports.useRef(null);
  const statsIntervalRef = reactExports.useRef(null);
  const durationIntervalRef = reactExports.useRef(null);
  const handleCreateStream = reactExports.useCallback(async () => {
    const { title, description, category, quality } = newStreamData;
    if (!title.trim()) {
      pushToast?.({
        type: "info",
        title: "عنوان البث مطلوب",
        description: "أدخل عنواناً للبث المباشر"
      });
      return;
    }
    setLoading(true);
    try {
      let uploadedCover = "";
      if (coverImage) {
        const uploadRes = await uploadFile(coverImage, (p) => {
          console.log(`Uploading cover: ${p.percent}%`);
        });
        uploadedCover = uploadRes?.url || "";
      }
      const response = await createLiveStream({
        title: title.trim(),
        description: description.trim(),
        category,
        quality,
        isPublic: newStreamData.isPublic
      });
      if (response?.data) {
        const streamId = response.data.stream_id;
        setActiveStream(response.data);
        setIsStreaming(true);
        try {
          const livePost = {
            type: "live_stream",
            content: title.trim(),
            title: title.trim(),
            media_url: uploadedCover,
            image_url: uploadedCover,
            stream_id: streamId,
            username: currentUsername,
            is_live: true,
            status: "published"
          };
          const postRes = await createPost(livePost);
          if (postRes?.data?.id) {
            setActivePostId(postRes.data.id);
          }
        } catch (postErr) {
          console.error("Failed to create live post:", postErr);
        }
        setNewStreamData({
          title: "",
          description: "",
          category: "ألعاب",
          quality: "720p",
          isPublic: true
        });
        setCoverImage(null);
        setCoverPreview("");
        pushToast?.({
          type: "success",
          title: "تم إنشاء البث بنجاح",
          description: "جاهز لبدء البث المباشر"
        });
        await handleStartStream(streamId);
      }
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في إنشاء البث",
        description: error?.response?.data?.message || "حاول مرة أخرى"
      });
    } finally {
      setLoading(false);
    }
  }, [newStreamData, pushToast]);
  const handleStartStream = reactExports.useCallback(async (streamId) => {
    if (!streamId) return;
    try {
      const tokenResponse = await startLiveStream(streamId, {
        quality: newStreamData.quality || "720p"
      });
      if (tokenResponse?.data?.token) {
        setCameraReady(true);
        setStreamHealth("good");
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = setInterval(() => {
          updateStreamStats(streamId);
        }, 5e3);
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        let duration = 0;
        durationIntervalRef.current = setInterval(() => {
          duration += 1;
          setStreamStats((prev) => ({ ...prev, duration }));
        }, 1e3);
        pushToast?.({
          type: "success",
          title: "بدأ البث بنجاح",
          description: "أنت الآن مباشر!"
        });
      }
    } catch (error) {
      setCameraError("فشل في بدء البث. تحقق من الاتصال.");
      pushToast?.({
        type: "warning",
        title: "خطأ في بدء البث",
        description: error?.response?.data?.message || "حاول مرة أخرى"
      });
    }
  }, [newStreamData.quality, pushToast]);
  const handleEndStream = reactExports.useCallback(async () => {
    if (!activeStream?.stream_id) return;
    if (!window.confirm("هل أنت متأكد من إنهاء البث؟")) return;
    setLoading(true);
    try {
      await endLiveStream(activeStream.stream_id);
      if (activePostId) {
        try {
          await updatePost(activePostId, {
            is_live: false,
            type: "video"
            // في البيئة الحقيقية ستحصل على رابط الفيديو المسجل من الـ backend
            // هنا نضع قيمة افتراضية أو نترك الرابط الحالي
          });
        } catch (updateErr) {
          console.error("Failed to update post on end stream:", updateErr);
        }
      }
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setActiveStream(null);
      setIsStreaming(false);
      setCameraReady(false);
      setActivePostId(null);
      setStreamStats({
        viewers: 0,
        hearts: 0,
        gifts: 0,
        comments: 0,
        duration: 0,
        bitrate: 0
      });
      pushToast?.({
        type: "success",
        title: "تم إنهاء البث",
        description: "شكراً على البث!"
      });
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في إنهاء البث",
        description: error?.response?.data?.message || "حاول مرة أخرى"
      });
    } finally {
      setLoading(false);
    }
  }, [activeStream, pushToast]);
  const updateStreamStats = reactExports.useCallback(async (streamId) => {
    try {
      const response = await getStreamStats(streamId);
      if (response?.data) {
        const data = response.data;
        setStreamStats((prev) => ({
          ...prev,
          viewers: data.total_viewers || data.viewers_count || prev.viewers,
          hearts: data.total_hearts || data.hearts_count || prev.hearts,
          gifts: data.total_gifts || data.gifts_count || prev.gifts,
          bitrate: data.bitrate || prev.bitrate
        }));
        if (data.bitrate && data.bitrate < 1e3) {
          setStreamHealth("poor");
        } else if (data.bitrate && data.bitrate < 2e3) {
          setStreamHealth("fair");
        } else {
          setStreamHealth("good");
        }
      }
    } catch (error) {
      console.error("خطأ في تحديث الإحصائيات:", error);
    }
  }, []);
  const loadComments = reactExports.useCallback(async (streamId) => {
    try {
      const response = await getLiveComments(streamId);
      setComments(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("خطأ في تحميل التعليقات:", error);
    }
  }, []);
  const handleSendComment = reactExports.useCallback(async () => {
    if (!commentText.trim() || !activeStream?.stream_id) return;
    try {
      const newComment = {
        id: Date.now(),
        username: currentUsername,
        text: commentText,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      await sendLiveComment(activeStream.stream_id, {
        text: commentText
      });
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في إرسال التعليق",
        description: "حاول مرة أخرى"
      });
    }
  }, [commentText, activeStream, currentUsername, pushToast]);
  const handleSendGift = reactExports.useCallback(async (gift) => {
    if (!activeStream?.stream_id || !gift) return;
    try {
      await sendLiveGift(activeStream.stream_id, {
        gift_id: gift.id,
        name: gift.name,
        price: gift.price
      });
      setStreamStats((prev) => ({
        ...prev,
        gifts: prev.gifts + 1
      }));
      pushToast?.({
        type: "success",
        title: `تم إرسال ${gift.name}`,
        description: "شكراً على الدعم!"
      });
      setShowGiftPanel(false);
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في إرسال الهدية",
        description: "حاول مرة أخرى"
      });
    }
  }, [activeStream, pushToast]);
  const handleToggleRecording = reactExports.useCallback(async () => {
    if (!activeStream?.stream_id) return;
    try {
      const action = recordingEnabled ? "stop" : "start";
      await recordLiveStream(activeStream.stream_id, { action });
      setRecordingEnabled(!recordingEnabled);
      pushToast?.({
        type: "success",
        title: recordingEnabled ? "تم إيقاف التسجيل" : "بدأ التسجيل"
      });
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في التسجيل",
        description: "حاول مرة أخرى"
      });
    }
  }, [activeStream, recordingEnabled, pushToast]);
  const handleToggleCamera = reactExports.useCallback(async () => {
    if (!activeStream?.stream_id) return;
    try {
      const newState = !cameraState.cameraEnabled;
      await toggleCamera(activeStream.stream_id, newState);
      setCameraState((prev) => ({
        ...prev,
        cameraEnabled: newState
      }));
      pushToast?.({
        type: "success",
        title: newState ? "تم تشغيل الكاميرا" : "تم إيقاف الكاميرا"
      });
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في تبديل الكاميرا",
        description: "حاول مرة أخرى"
      });
    }
  }, [activeStream, cameraState.cameraEnabled, pushToast]);
  const handleToggleMicrophone = reactExports.useCallback(async () => {
    if (!activeStream?.stream_id) return;
    try {
      const newState = !cameraState.microphoneEnabled;
      await toggleMicrophone(activeStream.stream_id, newState);
      setCameraState((prev) => ({
        ...prev,
        microphoneEnabled: newState
      }));
      pushToast?.({
        type: "success",
        title: newState ? "تم تشغيل الميكروفون" : "تم كتم الميكروفون"
      });
    } catch (error) {
      pushToast?.({
        type: "warning",
        title: "خطأ في تبديل الميكروفون",
        description: "حاول مرة أخرى"
      });
    }
  }, [activeStream, cameraState.microphoneEnabled, pushToast]);
  reactExports.useEffect(() => {
    if (!isStreaming || !activeStream?.stream_id) return;
    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("هذا المتصفح لا يدعم الكاميرا");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play();
        }
        setCameraReady(true);
        setCameraError("");
      } catch (error) {
        const permissionDenied = error?.name === "NotAllowedError";
        setCameraError(
          permissionDenied ? "تم رفض إذن الكاميرا. اسمح بالوصول وحاول مجدداً." : "خطأ في تشغيل الكاميرا"
        );
      }
    };
    setupCamera();
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [isStreaming, activeStream?.stream_id]);
  reactExports.useEffect(() => {
    if (activeStream?.stream_id) {
      loadComments(activeStream.stream_id);
      const interval = setInterval(() => loadComments(activeStream.stream_id), 3e3);
      return () => clearInterval(interval);
    }
  }, [activeStream?.stream_id, loadComments]);
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modern-live-control", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mlc-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-header-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mlc-back-btn", onClick: () => navigate(-1), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "<" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "تحكم البث المباشر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: isStreaming ? "أنت الآن مباشر" : "جاهز للبث" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-header-actions", children: [
        isStreaming && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "mlc-live-badge", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-live-dot" }),
          "مباشر"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mlc-menu-btn", children: "⋮" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-container", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mlc-main", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-video-section", children: [
          !isStreaming && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-pre-live-card", style: { marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mlc-title-label", children: "إعدادات البث" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  placeholder: "عنوان البث...",
                  className: "mlc-message-text",
                  style: { background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(124, 58, 237, 0.2)", padding: "10px", borderRadius: "8px", color: "white" },
                  value: newStreamData.title,
                  onChange: (e) => setNewStreamData((prev) => ({ ...prev, title: e.target.value }))
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cover-upload-section", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { display: "block", marginBottom: "8px", fontSize: "13px", color: "#94a3b8" }, children: "صورة الغلاف" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*",
                    style: { display: "none" },
                    id: "cover-upload-input",
                    onChange: (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setCoverImage(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => document.getElementById("cover-upload-input").click(),
                    style: { padding: "8px 16px", borderRadius: "8px", background: "rgba(124, 58, 237, 0.2)", border: "1px solid rgba(124, 58, 237, 0.4)", color: "white", cursor: "pointer" },
                    children: "رفع صورة الغلاف"
                  }
                ),
                coverPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "12px", position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(124, 58, 237, 0.3)" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: coverPreview, alt: "Cover Preview", style: { width: "100%", height: "100%", objectFit: "cover" } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => {
                        setCoverImage(null);
                        setCoverPreview("");
                      },
                      style: { position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" },
                      children: "✕"
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-video-container", children: [
            cameraReady ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "video",
              {
                ref: localVideoRef,
                className: "mlc-video",
                autoPlay: true,
                muted: true,
                playsInline: true
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-video-placeholder", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-placeholder-icon", children: "📺" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: cameraError || "جاري تحضير الكاميرا..." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-video-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mlc-viewer-count", children: [
              "👁 ",
              streamStats.viewers,
              "K"
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-stats-panel", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "إحصائيات البث" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-stats-grid", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-stat-item", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-icon", children: "👁" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-value", children: streamStats.viewers }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-label", children: "المشاهدون" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-stat-item", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-icon", children: "💜" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-value", children: streamStats.hearts }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-label", children: "الإعجابات" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-stat-item", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-icon", children: "🎁" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-value", children: streamStats.gifts }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-label", children: "الهدايا" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-stat-item", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-icon", children: "⏱" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-value", children: formatDuration(streamStats.duration) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-stat-label", children: "المدة" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-controls", children: !isStreaming ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "mlc-control-btn mlc-control-btn-start",
            onClick: handleCreateStream,
            disabled: loading,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "▶" }),
              loading ? "جاري البدء..." : "بدء البث"
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "mlc-control-btn mlc-control-btn-stop",
              onClick: handleEndStream,
              disabled: loading,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⏹" }),
                "إيقاف البث"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: `mlc-control-btn mlc-control-btn-camera ${!cameraState.cameraEnabled ? "disabled" : ""}`,
              onClick: handleToggleCamera,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: cameraState.cameraEnabled ? "📷" : "🚫" }),
                cameraState.cameraEnabled ? "إيقاف الكاميرا" : "تشغيل الكاميرا"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: `mlc-control-btn mlc-control-btn-mute ${!cameraState.microphoneEnabled ? "disabled" : ""}`,
              onClick: handleToggleMicrophone,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: cameraState.microphoneEnabled ? "🎤" : "🔇" }),
                cameraState.microphoneEnabled ? "كتم الميكروفون" : "تشغيل الميكروفون"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: `mlc-control-btn mlc-control-btn-record ${recordingEnabled ? "active" : ""}`,
              onClick: handleToggleRecording,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: recordingEnabled ? "⏹" : "⏺" }),
                recordingEnabled ? "إيقاف التسجيل" : "بدء التسجيل"
              ]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-messages-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-messages-header", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "لوحة الرسائل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-messages-info", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mlc-message-count", children: [
              "(",
              comments.length,
              ") الكل"
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-messages-list", children: comments.length > 0 ? comments.map((comment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-message-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: comment.username, size: 36 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-message-content", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-message-header", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-message-name", children: comment.username }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mlc-message-text", children: comment.text })
            ] })
          ] }, comment.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-empty-messages", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "لا توجد رسائل حتى الآن" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-comment-input", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "اكتب رسالة...",
                value: commentText,
                onChange: (e) => setCommentText(e.target.value),
                onKeyPress: (e) => e.key === "Enter" && handleSendComment()
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSendComment, children: "إرسال" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "mlc-sidebar", children: [
        isStreaming && activeStream?.stream_id && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ViewersManagementPanel,
          {
            streamId: activeStream.stream_id,
            hostId: activeStream.host_id,
            onViewerCountChange: (count) => {
              setStreamStats((prev) => ({ ...prev, viewers: count }));
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mlc-gifts-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "الهدايا" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mlc-gifts-grid", children: GIFTS.map((gift) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "mlc-gift-btn",
              onClick: () => handleSendGift(gift),
              disabled: !isStreaming,
              title: `${gift.name} - ${gift.price} نقطة`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-gift-icon-large", children: gift.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mlc-gift-price", children: gift.price })
              ]
            },
            gift.id
          )) })
        ] })
      ] })
    ] })
  ] });
}
export {
  LiveStudio as default
};
