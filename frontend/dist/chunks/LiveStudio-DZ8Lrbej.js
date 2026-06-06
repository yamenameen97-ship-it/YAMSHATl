import { q as apiClient, bh as useToast, a1 as getCurrentUsername, b9 as useNavigate, aP as reactExports, E as createLiveStream, b0 as startLiveStream, a6 as getLiveStreamStats, am as jsxRuntimeExports, aW as sendLiveComment } from "../index-T8PSkq5D.js";
import { b as createPost, u as updatePost } from "./posts-CWyyqd5F.js";
const endLiveStream = (streamId) => apiClient.post(`/live/${streamId}/end`, {});
const toggleCamera = (streamId, enabled) => apiClient.post(`/live/${streamId}/camera`, { enabled });
const toggleMicrophone = (streamId, enabled) => apiClient.post(`/live/${streamId}/microphone`, { enabled });
const QUALITY_OPTIONS = [
  { value: "1080p", label: "1080p (أفضل جودة)", bitrate: 6e3 },
  { value: "720p", label: "720p (موصى به)", bitrate: 3e3 },
  { value: "480p", label: "480p (سريع)", bitrate: 1500 }
];
const STREAM_CATEGORIES = [
  "ألعاب",
  "موسيقى",
  "تعليم",
  "ترفيه",
  "رياضة",
  "تقنية",
  "أخرى"
];
function LiveStudio() {
  const { pushToast } = useToast();
  getCurrentUsername();
  useNavigate();
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
  const localVideoRef = reactExports.useRef(null);
  const localStreamRef = reactExports.useRef(null);
  const statsIntervalRef = reactExports.useRef(null);
  const durationIntervalRef = reactExports.useRef(null);
  reactExports.useRef(null);
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
      const response = await createLiveStream({
        title: title.trim(),
        description: description.trim(),
        category,
        quality,
        isPublic: newStreamData.isPublic
      });
      if (response?.data) {
        setActiveStream(response.data);
        setIsStreaming(true);
        setNewStreamData({
          title: "",
          description: "",
          category: "ألعاب",
          quality: "720p",
          isPublic: true
        });
        pushToast?.({
          type: "success",
          title: "تم إنشاء البث بنجاح",
          description: "جاهز لبدء البث المباشر"
        });
        await handleStartStream(response.data.stream_id);
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
  const captureThumbnail = () => {
    const video = localVideoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 450;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  };
  const handleStartStream = reactExports.useCallback(async (streamId) => {
    if (!streamId) return;
    try {
      const tokenResponse = await startLiveStream(streamId, {
        quality: newStreamData.quality || "720p"
      });
      if (tokenResponse?.data?.token) {
        setCameraReady(true);
        setStreamHealth("good");
        setTimeout(async () => {
          const thumbnail = captureThumbnail() || "https://placehold.co/800x450?text=Live+Stream";
          const livePostData = {
            type: "live",
            post_type: "LIVE",
            live_stream_id: streamId,
            title: newStreamData.title || "بث مباشر",
            content: newStreamData.description || newStreamData.title || "بث مباشر جديد",
            thumbnail_url: thumbnail,
            media_url: thumbnail,
            is_live: true,
            status: "published"
          };
          try {
            const backendResponse = await createPost(livePostData);
            const savedPost = backendResponse?.data || livePostData;
            const localPost = {
              ...savedPost,
              id: savedPost.id || `live-${streamId}`,
              streamId,
              isLive: true,
              thumbnail,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            const existing = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
            localStorage.setItem("yamshat_posts", JSON.stringify([localPost, ...existing]));
            window.dispatchEvent(new CustomEvent("yamshat:live-post-created", { detail: localPost }));
            console.log("Live post synced with backend successfully");
          } catch (e) {
            console.error("Error syncing live post with backend:", e);
            const fallbackPost = { ...livePostData, id: `live-${streamId}`, streamId, isLive: true, thumbnail };
            const existing = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
            localStorage.setItem("yamshat_posts", JSON.stringify([fallbackPost, ...existing]));
            window.dispatchEvent(new CustomEvent("yamshat:live-post-created", { detail: fallbackPost }));
          }
        }, 500);
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = setInterval(() => {
          updateStreamStats(streamId);
          try {
            const existing = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
            const updated = existing.map(
              (p) => p.streamId === streamId ? { ...p, viewers: streamStats.viewers } : p
            );
            localStorage.setItem("yamshat_posts", JSON.stringify(updated));
          } catch (e) {
            console.error("Error updating live post viewers:", e);
          }
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
        window.dispatchEvent(new CustomEvent("yamshat:stream-started", { detail: { streamId } }));
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
    const performLocalCleanup = async () => {
      const streamId = activeStream.stream_id;
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      try {
        const existing = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
        const post = existing.find((p) => p.streamId === streamId);
        if (post && post.rawId) {
          await updatePost(post.rawId, { is_live: false, status: "archived" });
        }
      } catch (e) {
        console.error("Error updating post status on backend:", e);
      }
      try {
        const existing = JSON.parse(localStorage.getItem("yamshat_posts") || "[]");
        const filtered = existing.filter((p) => p.streamId !== streamId);
        localStorage.setItem("yamshat_posts", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("yamshat:stream-ended", { detail: { streamId } }));
      } catch (e) {
        console.error("Error removing live post:", e);
      }
      setActiveStream(null);
      setIsStreaming(false);
      setCameraReady(false);
    };
    try {
      await endLiveStream(activeStream.stream_id);
      await performLocalCleanup();
      pushToast?.({
        type: "success",
        title: "تم إنهاء البث",
        description: "تم حفظ البث في سجلاتك"
      });
    } catch (error) {
      await performLocalCleanup();
      pushToast?.({
        type: "warning",
        title: "تنبيه",
        description: "تم إنهاء البث محلياً، قد يكون هناك تأخير في تحديث الخادم"
      });
    } finally {
      setLoading(false);
    }
  }, [activeStream, pushToast]);
  const updateStreamStats = async (streamId) => {
    try {
      const stats = await getLiveStreamStats(streamId);
      if (stats?.data) {
        setStreamStats((prev) => ({
          ...prev,
          viewers: stats.data.viewers_count || 0,
          hearts: stats.data.hearts_count || 0,
          gifts: stats.data.gifts_count || 0
        }));
      }
    } catch (error) {
      console.error("Error fetching stream stats:", error);
    }
  };
  const handleSendComment = async () => {
    if (!commentText.trim() || !activeStream?.stream_id) return;
    try {
      await sendLiveComment(activeStream.stream_id, commentText.trim());
      setCommentText("");
    } catch (error) {
      pushToast?.({
        type: "error",
        title: "فشل إرسال التعليق"
      });
    }
  };
  const handleToggleCamera = async () => {
    const newState = !cameraState.cameraEnabled;
    setCameraState((prev) => ({ ...prev, cameraEnabled: newState }));
    if (activeStream?.stream_id) {
      await toggleCamera(activeStream.stream_id, newState);
    }
  };
  const handleToggleMicrophone = async () => {
    const newState = !cameraState.microphoneEnabled;
    setCameraState((prev) => ({ ...prev, microphoneEnabled: newState }));
    if (activeStream?.stream_id) {
      await toggleMicrophone(activeStream.stream_id, newState);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modern-live-studio", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "studio-container", children: !isStreaming ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "setup-screen", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "إعداد البث المباشر" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "setup-form", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          placeholder: "عنوان البث...",
          value: newStreamData.title,
          onChange: (e) => setNewStreamData((prev) => ({ ...prev, title: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          placeholder: "وصف البث...",
          value: newStreamData.description,
          onChange: (e) => setNewStreamData((prev) => ({ ...prev, description: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            value: newStreamData.category,
            onChange: (e) => setNewStreamData((prev) => ({ ...prev, category: e.target.value })),
            children: STREAM_CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            value: newStreamData.quality,
            onChange: (e) => setNewStreamData((prev) => ({ ...prev, quality: e.target.value })),
            children: QUALITY_OPTIONS.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: q.value, children: q.label }, q.value))
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "start-btn",
          onClick: handleCreateStream,
          disabled: loading,
          children: loading ? "جاري البدء..." : "بدء البث المباشر"
        }
      )
    ] })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "live-screen", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-preview", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("video", { ref: localVideoRef, autoPlay: true, muted: true, playsInline: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "live-overlay", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "live-badge", children: "مباشر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "viewer-count", children: [
          "👁️ ",
          streamStats.viewers
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stream-controls", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleToggleCamera, className: cameraState.cameraEnabled ? "active" : "", children: cameraState.cameraEnabled ? "📹" : "📵" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleToggleMicrophone, className: cameraState.microphoneEnabled ? "active" : "", children: cameraState.microphoneEnabled ? "🎤" : "🔇" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "end-btn", onClick: handleEndStream, children: "إنهاء البث" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "studio-sidebar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-panel", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "المشاهدات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: streamStats.viewers })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "القلوب" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "value", children: streamStats.hearts })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "label", children: "الوقت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "value", children: [
            Math.floor(streamStats.duration / 60),
            ":",
            (streamStats.duration % 60).toString().padStart(2, "0")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-panel", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chat-messages", children: comments.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-msg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            c.username,
            ":"
          ] }),
          " ",
          c.text
        ] }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-input", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "اكتب تعليقاً...",
              value: commentText,
              onChange: (e) => setCommentText(e.target.value),
              onKeyPress: (e) => e.key === "Enter" && handleSendComment()
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSendComment, children: "إرسال" })
        ] })
      ] })
    ] })
  ] }) }) });
}
export {
  LiveStudio as default
};
