import { am as logger, aK as reactExports, ah as jsxRuntimeExports, c as Button, _ as __vitePreload, b8 as useToast, Z as getCurrentUsername, b0 as useNavigate, a$ as useLocation, A as API, k as MainLayout, aO as resolveMediaUrl, a6 as getOptimizedImageUrl } from "../index-Dz8FA2T4.js";
import { M as Modal } from "./Modal-CQnWI2rS.js";
import { m as mediaUploadService } from "./mediaUploadService-CZ2Dj9RA.js";
import { A as AutoSizer, F as FixedSizeList } from "./react-virtualized-auto-sizer.esm-DRzjgw4p.js";
import { e as getPosts, a as addComment, g as getComments } from "./posts-DcFjEz5E.js";
import { i as getWatchHistory, g as getDeviceProfile, d as getReelInsightsById, h as getReelsCache, k as saveWatchHistoryEntry, t as trackReelAnalytics, s as saveReelsCache, p as preloadPoster, c as computeAutoQuality, j as primeVideo, b as buildAdaptiveSource, l as submitModerationReport, f as formatWatchPercentage } from "./reelsEngine-CfBKEEDO.js";
import { f as fetchSuggestedReels } from "./recommendationService-C1I5cM5E.js";
const VIDEO_PREVIEW_TYPES = /* @__PURE__ */ new Set(["video/mp4", "video/webm", "video/quicktime", "video/ogg"]);
const DEFAULT_VISUAL_ADJUSTMENTS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0
};
const VIDEO_FILTER_PRESETS = [
  { value: "original", label: "بدون فلتر" },
  { value: "enhance", label: "تحسين ذكي" },
  { value: "cinematic", label: "سينمائي" },
  { value: "warm", label: "دافئ" },
  { value: "cool", label: "بارد" },
  { value: "mono", label: "أبيض وأسود" }
];
const AUDIO_MODE_OPTIONS = [
  { value: "original", label: "الصوت الأصلي" },
  { value: "mute", label: "كتم كامل" },
  { value: "bass", label: "صوت عميق" },
  { value: "bright", label: "صوت أوضح" },
  { value: "radio", label: "راديو / هاتف" }
];
const FILTER_PRESET_STYLE = {
  original: "",
  enhance: "brightness(1.04) contrast(1.08) saturate(1.12)",
  cinematic: "brightness(0.98) contrast(1.14) saturate(1.18) sepia(0.08)",
  warm: "brightness(1.03) contrast(1.05) saturate(1.08) sepia(0.14) hue-rotate(-6deg)",
  cool: "brightness(1.02) contrast(1.07) saturate(0.94) hue-rotate(8deg)",
  mono: "grayscale(1) contrast(1.12)"
};
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value || 0)));
}
function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}
function formatSpeed(bytesPerSecond = 0) {
  if (!bytesPerSecond || bytesPerSecond <= 0) return "—";
  return `${formatBytes(bytesPerSecond)}/ث`;
}
function formatEta(seconds = 0) {
  const value = Math.max(0, Math.round(Number(seconds || 0)));
  if (!value) return "ثوانٍ";
  if (value < 60) return `${value} ث`;
  const minutes = Math.floor(value / 60);
  const remain = value % 60;
  if (minutes < 60) return remain ? `${minutes} د ${remain} ث` : `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours} س ${restMinutes} د` : `${hours} س`;
}
function revokeObjectUrl(url = "") {
  if (!url || typeof URL === "undefined" || !String(url).startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
  }
}
async function buildVideoPreview(file) {
  if (!VIDEO_PREVIEW_TYPES.has(file?.type)) return null;
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;
    video.src = objectUrl;
    const cleanup = () => {
      video.pause?.();
    };
    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.min(video.videoWidth || 720, 720));
      canvas.height = Math.max(1, Math.round(canvas.width / Math.max(video.videoWidth || 1, 1) * Math.max(video.videoHeight || 1, 1)));
      const context = canvas.getContext("2d");
      if (!context) {
        cleanup();
        resolve({ kind: "video", objectUrl, duration: Number(video.duration || 0), width: video.videoWidth || 0, height: video.videoHeight || 0, thumbnailUrl: "" });
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.82);
      cleanup();
      resolve({
        kind: "video",
        objectUrl,
        thumbnailUrl,
        duration: Number(video.duration || 0),
        width: video.videoWidth || 0,
        height: video.videoHeight || 0
      });
    };
    video.onerror = () => {
      cleanup();
      resolve({ kind: "video", objectUrl, duration: 0, width: 0, height: 0, thumbnailUrl: "" });
    };
  });
}
function getSupportedRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}
function compressionPresetToBps(preset = "balanced") {
  if (preset === "light") return 28e5;
  if (preset === "strong") return 12e5;
  return 19e5;
}
function normalizeEnhancementSettings(options = {}) {
  return {
    enhancementEnabled: options.enhancementEnabled !== false,
    compressionEnabled: options.compressionEnabled !== false,
    compressionPreset: options.compressionPreset || "balanced",
    videoFilter: options.videoFilter || "original",
    audioMode: options.audioMode || "original",
    volume: clamp(options.volume ?? 100, 0, 200),
    adjustments: {
      brightness: clamp(options.adjustments?.brightness ?? DEFAULT_VISUAL_ADJUSTMENTS.brightness, 60, 140),
      contrast: clamp(options.adjustments?.contrast ?? DEFAULT_VISUAL_ADJUSTMENTS.contrast, 60, 160),
      saturation: clamp(options.adjustments?.saturation ?? DEFAULT_VISUAL_ADJUSTMENTS.saturation, 0, 180),
      blur: clamp(options.adjustments?.blur ?? DEFAULT_VISUAL_ADJUSTMENTS.blur, 0, 8)
    }
  };
}
function buildVideoFilterStyle(options = {}) {
  const settings = normalizeEnhancementSettings(options);
  const filters = [];
  const preset = FILTER_PRESET_STYLE[settings.videoFilter] || "";
  if (preset) filters.push(preset);
  const brightness = settings.adjustments.brightness / 100;
  const contrast = settings.adjustments.contrast / 100;
  const saturation = settings.adjustments.saturation / 100;
  const blur = settings.adjustments.blur;
  if (Math.abs(brightness - 1) > 0.01) filters.push(`brightness(${brightness.toFixed(2)})`);
  if (Math.abs(contrast - 1) > 0.01) filters.push(`contrast(${contrast.toFixed(2)})`);
  if (Math.abs(saturation - 1) > 0.01) filters.push(`saturate(${saturation.toFixed(2)})`);
  if (blur > 0.05) filters.push(`blur(${blur.toFixed(2)}px)`);
  return filters.join(" ").trim();
}
function hasVisualProcessing(settings) {
  if (!settings.enhancementEnabled) return false;
  if (settings.videoFilter !== "original") return true;
  return Object.entries(DEFAULT_VISUAL_ADJUSTMENTS).some(([key, value]) => Number(settings.adjustments?.[key]) !== Number(value));
}
function hasAudioProcessing(settings) {
  return settings.audioMode !== "original" || Number(settings.volume) !== 100;
}
function needsPreUploadProcessing(settings) {
  return hasVisualProcessing(settings) || hasAudioProcessing(settings);
}
function wireAudioEffectChain(audioContext, sourceNode, destinationNode, audioMode = "original", volume = 100) {
  let current = sourceNode;
  const gainNode = audioContext.createGain();
  gainNode.gain.value = clamp(volume, 0, 200) / 100;
  if (audioMode === "bass") {
    const lowShelf = audioContext.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 220;
    lowShelf.gain.value = 10;
    current.connect(lowShelf);
    current = lowShelf;
  } else if (audioMode === "bright") {
    const highShelf = audioContext.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.value = 2800;
    highShelf.gain.value = 8;
    current.connect(highShelf);
    current = highShelf;
  } else if (audioMode === "radio") {
    const highPass = audioContext.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 280;
    const lowPass = audioContext.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 3200;
    current.connect(highPass);
    highPass.connect(lowPass);
    current = lowPass;
  }
  current.connect(gainNode);
  gainNode.connect(destinationNode);
}
async function waitForMediaMetadata(video) {
  if (Number(video.readyState || 0) >= 1) return;
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("تعذر تحميل الفيديو قبل المعالجة"));
  });
}
async function compressVideoFile(file, options = {}) {
  const { enabled = true, preset = "balanced", onProgress = () => {
  } } = options;
  if (!enabled || !String(file?.type || "").startsWith("video/")) return file;
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") return file;
  const recorderMimeType = getSupportedRecorderMimeType();
  if (!recorderMimeType) return file;
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = sourceUrl;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.muted = false;
  video.preload = "auto";
  try {
    await waitForMediaMetadata(video);
    const captureStream = video.captureStream?.bind(video) || video.mozCaptureStream?.bind(video);
    if (!captureStream) return file;
    const stream = captureStream();
    const chunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: recorderMimeType,
      videoBitsPerSecond: compressionPresetToBps(preset),
      audioBitsPerSecond: 96e3
    });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    const completed = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("فشل ضغط الفيديو أثناء التسجيل"));
    });
    video.ontimeupdate = () => {
      const duration = Math.max(Number(video.duration || 0), 1);
      const percent = Math.min(99, Math.round(video.currentTime / duration * 100));
      onProgress({ stage: "compressing-video", percent, currentTime: video.currentTime, duration });
    };
    recorder.start(1e3);
    await video.play();
    await new Promise((resolve) => {
      video.onended = () => resolve();
    });
    if (recorder.state !== "inactive") recorder.stop();
    await completed;
    const blob = new Blob(chunks, { type: recorderMimeType.split(";")[0] || "video/webm" });
    if (!blob.size || blob.size >= file.size * 0.98) return file;
    onProgress({ stage: "compressing-video", percent: 100 });
    const outputName = `${String(file.name || "video").replace(/\.[^.]+$/, "")}.webm`;
    return new File([blob], outputName, { type: "video/webm", lastModified: Date.now() });
  } catch (error) {
    logger.warn("Video compression fallback to original file", { message: error?.message, fileName: file?.name });
    return file;
  } finally {
    revokeObjectUrl(sourceUrl);
    try {
      video.pause?.();
    } catch {
    }
  }
}
async function processVideoFile(file, options = {}) {
  const settings = normalizeEnhancementSettings(options);
  const { onProgress = () => {
  } } = options;
  if (!String(file?.type || "").startsWith("video/")) return file;
  if (!needsPreUploadProcessing(settings)) {
    return compressVideoFile(file, {
      enabled: settings.compressionEnabled,
      preset: settings.compressionPreset,
      onProgress
    });
  }
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    return compressVideoFile(file, {
      enabled: settings.compressionEnabled,
      preset: settings.compressionPreset,
      onProgress
    });
  }
  const recorderMimeType = getSupportedRecorderMimeType();
  if (!recorderMimeType) {
    return compressVideoFile(file, {
      enabled: settings.compressionEnabled,
      preset: settings.compressionPreset,
      onProgress
    });
  }
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = sourceUrl;
  video.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  video.crossOrigin = "anonymous";
  let animationFrame = 0;
  let audioContext = null;
  let outputStream = null;
  let canvasStream = null;
  try {
    await waitForMediaMetadata(video);
    const sourceWidth = Math.max(1, Number(video.videoWidth || 720));
    const sourceHeight = Math.max(1, Number(video.videoHeight || 1280));
    const maxWidth = sourceWidth > 1080 ? 1080 : sourceWidth;
    const outputWidth = maxWidth;
    const outputHeight = Math.max(1, Math.round(outputWidth / sourceWidth * sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return compressVideoFile(file, {
        enabled: settings.compressionEnabled,
        preset: settings.compressionPreset,
        onProgress
      });
    }
    const visualFilter = buildVideoFilterStyle(settings);
    const frameRate = 30;
    canvasStream = canvas.captureStream(frameRate);
    outputStream = new MediaStream();
    canvasStream.getVideoTracks().forEach((track) => outputStream.addTrack(track));
    if (settings.audioMode !== "mute") {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextCtor) {
        audioContext = new AudioContextCtor();
        const sourceNode = audioContext.createMediaElementSource(video);
        const destinationNode = audioContext.createMediaStreamDestination();
        wireAudioEffectChain(audioContext, sourceNode, destinationNode, settings.audioMode, settings.volume);
        destinationNode.stream.getAudioTracks().forEach((track) => outputStream.addTrack(track));
        if (audioContext.state === "suspended") {
          await audioContext.resume().catch(() => {
          });
        }
      }
    }
    const chunks = [];
    const recorder = new MediaRecorder(outputStream, {
      mimeType: recorderMimeType,
      videoBitsPerSecond: settings.compressionEnabled ? compressionPresetToBps(settings.compressionPreset) : 45e5,
      audioBitsPerSecond: 112e3
    });
    const completed = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("فشل تجهيز الفيديو قبل الرفع"));
    });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    const drawFrame = () => {
      context.save();
      context.filter = visualFilter || "none";
      context.drawImage(video, 0, 0, outputWidth, outputHeight);
      context.restore();
      if (!video.paused && !video.ended) animationFrame = window.requestAnimationFrame(drawFrame);
    };
    video.ontimeupdate = () => {
      const duration = Math.max(Number(video.duration || 0), 1);
      const percent = Math.min(99, Math.round(video.currentTime / duration * 100));
      onProgress({ stage: "processing-video", percent, currentTime: video.currentTime, duration });
    };
    recorder.start(1e3);
    drawFrame();
    await video.play();
    await new Promise((resolve) => {
      video.onended = () => resolve();
    });
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    if (recorder.state !== "inactive") recorder.stop();
    await completed;
    const blob = new Blob(chunks, { type: "video/webm" });
    if (!blob.size) {
      return compressVideoFile(file, {
        enabled: settings.compressionEnabled,
        preset: settings.compressionPreset,
        onProgress
      });
    }
    onProgress({ stage: "processing-video", percent: 100 });
    const suffix = [settings.videoFilter !== "original" ? settings.videoFilter : "", settings.audioMode !== "original" ? settings.audioMode : ""].filter(Boolean).join("-");
    const outputName = `${String(file.name || "video").replace(/\.[^.]+$/, "")}${suffix ? `-${suffix}` : ""}.webm`;
    return new File([blob], outputName, { type: "video/webm", lastModified: Date.now() });
  } catch (error) {
    logger.warn("Video pre-upload processing fallback to original/compressed file", {
      message: error?.message,
      fileName: file?.name
    });
    return compressVideoFile(file, {
      enabled: settings.compressionEnabled,
      preset: settings.compressionPreset,
      onProgress
    });
  } finally {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    try {
      video.pause?.();
    } catch {
    }
    if (canvasStream) {
      canvasStream.getTracks().forEach((track) => track.stop());
    }
    if (outputStream) {
      outputStream.getTracks().forEach((track) => track.stop());
    }
    if (audioContext) {
      await audioContext.close().catch(() => {
      });
    }
    revokeObjectUrl(sourceUrl);
  }
}
function createProgressTracker(initialTotalBytes = 0) {
  let startedAt = 0;
  let lastLoadedBytes = 0;
  let lastTimestamp = 0;
  return function withMetrics(payload = {}) {
    const totalBytes = Number(payload.totalBytes || payload.total || initialTotalBytes || 0);
    const loadedBytes = Number(payload.loadedBytes || payload.loaded || 0);
    const now = Date.now();
    if (!startedAt) startedAt = now;
    if (!lastTimestamp) {
      lastTimestamp = now;
      lastLoadedBytes = loadedBytes;
    }
    const deltaBytes = Math.max(0, loadedBytes - lastLoadedBytes);
    const deltaTime = Math.max(1, now - lastTimestamp);
    const speedBps = deltaBytes > 0 ? deltaBytes / deltaTime * 1e3 : Number(payload.speedBps || 0);
    const remainingBytes = Math.max(0, totalBytes - loadedBytes);
    const etaSeconds = speedBps > 0 ? Math.round(remainingBytes / speedBps) : Number(payload.etaSeconds || 0);
    lastLoadedBytes = loadedBytes;
    lastTimestamp = now;
    return {
      ...payload,
      totalBytes,
      loadedBytes,
      speedBps,
      etaSeconds,
      elapsedMs: now - startedAt
    };
  };
}
function createManagedUploadTask(file, uploadFn, options = {}) {
  const controller = new AbortController();
  const toMetrics = createProgressTracker(file?.size || 0);
  const promise = uploadFn({
    signal: controller.signal,
    onProgress: (payload) => {
      options.onProgress?.(toMetrics(payload));
    }
  });
  return {
    controller,
    abort: () => controller.abort("user-cancelled"),
    promise
  };
}
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const DEFAULT_ADJUSTMENTS = {
  brightness: 100,
  contrast: 100,
  saturation: 110,
  blur: 0
};
function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${minutes}:${String(remain).padStart(2, "0")}`;
}
function stageLabel(stage = "") {
  if (stage === "processing-video") return "تحسين الفيديو والصوت";
  if (stage === "compressing-video") return "جاري ضغط الفيديو فعلياً";
  if (stage === "validating") return "فحص الملف";
  if (stage === "hashing") return "تجهيز الاستئناف";
  if (stage === "preparing") return "تجهيز المعاينة";
  if (stage === "uploading") return "رفع الشرائح";
  if (stage === "retrying") return "إعادة المحاولة";
  if (stage === "finalizing") return "إغلاق جلسة الرفع";
  if (stage === "done") return "تم الرفع";
  return "جاهز";
}
function SliderControl({ label, value, min, max, step = 1, suffix = "", disabled, onChange }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "studio-slider", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "studio-slider-head", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
        value,
        suffix
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "range",
        min,
        max,
        step,
        value,
        disabled,
        onChange: (event) => onChange(Number(event.target.value))
      }
    )
  ] });
}
function VideoUploader({ onUploadComplete, onError, label = "رفع فيديو الريل" }) {
  const [videoFile, setVideoFile] = reactExports.useState(null);
  const [preparedFile, setPreparedFile] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState(0);
  const [progressMeta, setProgressMeta] = reactExports.useState({ stage: "idle", speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
  const [preview, setPreview] = reactExports.useState(null);
  const [compressionEnabled, setCompressionEnabled] = reactExports.useState(true);
  const [compressionPreset, setCompressionPreset] = reactExports.useState("balanced");
  const [enhancementEnabled, setEnhancementEnabled] = reactExports.useState(true);
  const [videoFilter, setVideoFilter] = reactExports.useState("enhance");
  const [audioMode, setAudioMode] = reactExports.useState("original");
  const [audioVolume, setAudioVolume] = reactExports.useState(100);
  const [adjustments, setAdjustments] = reactExports.useState(DEFAULT_ADJUSTMENTS);
  const [errorMessage, setErrorMessage] = reactExports.useState("");
  const [lastPayload, setLastPayload] = reactExports.useState(null);
  const fileInputRef = reactExports.useRef(null);
  const taskRef = reactExports.useRef(null);
  reactExports.useEffect(() => () => {
    if (taskRef.current?.abort) taskRef.current.abort();
    revokeObjectUrl(preview?.objectUrl);
  }, [preview?.objectUrl]);
  const acceptedText = reactExports.useMemo(() => "MP4, WebM أو MOV", []);
  const previewFilter = reactExports.useMemo(() => buildVideoFilterStyle({
    enhancementEnabled,
    videoFilter,
    adjustments
  }), [adjustments, enhancementEnabled, videoFilter]);
  const studioSummary = reactExports.useMemo(() => {
    const selectedFilter = VIDEO_FILTER_PRESETS.find((item) => item.value === videoFilter)?.label || videoFilter;
    const selectedAudio = AUDIO_MODE_OPTIONS.find((item) => item.value === audioMode)?.label || audioMode;
    return [
      compressionEnabled ? `ضغط ${compressionPreset}` : "بدون ضغط إضافي",
      enhancementEnabled ? `فلتر ${selectedFilter}` : "تحسين بصري متوقف",
      `الصوت: ${selectedAudio}`,
      audioMode === "mute" ? "كتم قبل الرفع" : `مستوى الصوت ${audioVolume}%`
    ];
  }, [audioMode, audioVolume, compressionEnabled, compressionPreset, enhancementEnabled, videoFilter]);
  const resetLocalState = () => {
    if (taskRef.current?.abort) taskRef.current.abort();
    revokeObjectUrl(preview?.objectUrl);
    setVideoFile(null);
    setPreparedFile(null);
    setUploading(false);
    setProgress(0);
    setPreview(null);
    setErrorMessage("");
    setLastPayload(null);
    setProgressMeta({ stage: "idle", speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const propagateUploadProgress = (payload = {}) => {
    setProgress(Math.min(100, Number(payload?.percent || 0)));
    setProgressMeta((prev) => ({
      ...prev,
      ...payload,
      stage: payload?.stage || prev.stage
    }));
  };
  const startUpload = async (sourceFile, currentPreview = null) => {
    if (!sourceFile) return;
    setUploading(true);
    setErrorMessage("");
    setProgress(0);
    setLastPayload(null);
    try {
      const fileForUpload = await processVideoFile(sourceFile, {
        enhancementEnabled,
        compressionEnabled,
        compressionPreset,
        videoFilter,
        audioMode,
        volume: audioVolume,
        adjustments,
        onProgress: propagateUploadProgress
      });
      setPreparedFile(fileForUpload);
      const task = createManagedUploadTask(fileForUpload, ({ signal, onProgress }) => mediaUploadService.uploadFile(fileForUpload, {
        signal,
        onProgress,
        purpose: "reel-upload",
        compressionPreset,
        chunkRetries: 4,
        retries: 3,
        processingProfile: `${videoFilter}:${audioMode}`
      }), {
        onProgress: propagateUploadProgress
      });
      taskRef.current = task;
      const upload = await task.promise;
      setProgress(100);
      setProgressMeta({ stage: "done", speedBps: 0, etaSeconds: 0, retryAttempt: 0 });
      setLastPayload(upload);
      onUploadComplete?.({
        file: fileForUpload,
        originalFile: sourceFile,
        previewUrl: currentPreview?.objectUrl || "",
        thumbnailUrl: currentPreview?.thumbnailUrl || "",
        url: upload.mediaUrl || upload.url || "",
        payload: upload,
        compressed: fileForUpload !== sourceFile,
        enhancementPreset: videoFilter,
        audioMode
      });
    } catch (error) {
      const message = error?.name === "AbortError" ? "تم إلغاء الرفع" : error?.response?.data?.detail || error?.message || "فشل رفع الفيديو";
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setUploading(false);
      taskRef.current = null;
    }
  };
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      const message = "نوع الملف غير مدعوم. استخدم MP4 أو WebM أو MOV";
      setErrorMessage(message);
      onError?.(message);
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      const message = `حجم الملف كبير جداً. الحد الأقصى: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`;
      setErrorMessage(message);
      onError?.(message);
      return;
    }
    revokeObjectUrl(preview?.objectUrl);
    const nextPreview = await buildVideoPreview(file);
    setVideoFile(file);
    setPreparedFile(file);
    setPreview(nextPreview);
    setLastPayload(null);
    setErrorMessage("");
    await startUpload(file, nextPreview);
  };
  const retryUpload = async () => {
    if (!videoFile) return;
    await startUpload(videoFile, preview);
  };
  const updateAdjustment = (key, value) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-uploader-shell", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-settings-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "استوديو تحسين الفيديو قبل الرفع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "فلترة الصورة، تحسين الإضاءة، ومعالجة الصوت أو كتمه قبل نشر الريل." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "settings-badges", children: studioSummary.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "studio-badge", children: item }, item)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-grid two-cols", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "settings-toggle cardish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: compressionEnabled, onChange: (event) => setCompressionEnabled(event.target.checked), disabled: uploading }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ضغط فيديو فعلي قبل الرفع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "يقلل الحجم مع الحفاظ على وضوح مناسب للريلز." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "settings-select cardish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "قوة الضغط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: compressionPreset, onChange: (event) => setCompressionPreset(event.target.value), disabled: uploading, className: "quality-select", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "light", children: "Light" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "balanced", children: "Balanced" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "strong", children: "Strong" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "settings-toggle cardish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: enhancementEnabled, onChange: (event) => setEnhancementEnabled(event.target.checked), disabled: uploading }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تحسين بصري قبل الرفع" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "تطبيق فلتر وإضاءة وتباين على الفيديو النهائي." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "settings-select cardish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "فلتر الفيديو" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: videoFilter, onChange: (event) => setVideoFilter(event.target.value), disabled: uploading || !enhancementEnabled, className: "quality-select", children: VIDEO_FILTER_PRESETS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "settings-select cardish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "وضع الصوت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: audioMode, onChange: (event) => setAudioMode(event.target.value), disabled: uploading, className: "quality-select", children: AUDIO_MODE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SliderControl,
          {
            label: "مستوى الصوت",
            value: audioVolume,
            min: 0,
            max: 200,
            suffix: "%",
            disabled: uploading || audioMode === "mute",
            onChange: (value) => setAudioVolume(value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "studio-sliders-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SliderControl, { label: "السطوع", value: adjustments.brightness, min: 60, max: 140, suffix: "%", disabled: uploading || !enhancementEnabled, onChange: (value) => updateAdjustment("brightness", value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SliderControl, { label: "التباين", value: adjustments.contrast, min: 60, max: 160, suffix: "%", disabled: uploading || !enhancementEnabled, onChange: (value) => updateAdjustment("contrast", value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SliderControl, { label: "التشبع", value: adjustments.saturation, min: 0, max: 180, suffix: "%", disabled: uploading || !enhancementEnabled, onChange: (value) => updateAdjustment("saturation", value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SliderControl, { label: "تمويه خفيف", value: adjustments.blur, min: 0, max: 8, step: 0.5, suffix: "px", disabled: uploading || !enhancementEnabled, onChange: (value) => updateAdjustment("blur", value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "الرفع يدعم الاستئناف + chunk upload + retry + معاينة Thumbnail حقيقية، ومعالجة الفيديو والصوت قبل النشر داخل نفس الصندوق." })
    ] }),
    videoFile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-upload-status", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-preview-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "preview-ribbon", children: enhancementEnabled ? "معاينة بالفلتر الحالي" : "معاينة أصلية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            src: preview?.objectUrl || "",
            controls: true,
            playsInline: true,
            muted: audioMode === "mute",
            className: "video-preview-player",
            style: { filter: previewFilter || "none" }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-info-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: videoFile.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
            "الأصلي: ",
            formatBytes(videoFile.size),
            preparedFile && preparedFile !== videoFile ? ` • بعد المعالجة: ${formatBytes(preparedFile.size)}` : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
            preview?.duration ? `المدة ${formatDuration(preview.duration)}` : "بدون مدة",
            preview?.width ? ` • ${preview.width}×${preview.height}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `upload-state-pill ${uploading ? "busy" : errorMessage ? "error" : "done"}`, children: errorMessage ? "فيه مشكلة" : uploading ? stageLabel(progressMeta.stage) : "تم تجهيز الفيديو" })
      ] }),
      preview?.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thumbnail-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview.thumbnailUrl, alt: "معاينة الفيديو", className: "video-thumb" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Preview جاهز" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "تم توليد thumbnail محلي قبل الرفع، ويمكن استخدامه عند نشر الريل." })
        ] })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-progress", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill", style: { width: `${Math.min(progress, 100)}%` } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "progress-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            Math.min(progress, 100),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: stageLabel(progressMeta.stage) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "progress-stats-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "السرعة: ",
            formatSpeed(progressMeta.speedBps)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "الوقت المتبقي: ",
            formatEta(progressMeta.etaSeconds)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "المحاولات: ",
            progressMeta.retryAttempt || 0
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "الرابط: ",
            lastPayload?.cdnUrl ? "CDN جاهز" : "بعد الاكتمال"
          ] })
        ] })
      ] }),
      errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-banner", children: errorMessage }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => fileInputRef.current?.click(), disabled: uploading, children: "استبدال الفيديو" }),
        uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => taskRef.current?.abort?.(), children: "إلغاء الرفع" }) : null,
        !uploading && errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: retryUpload, children: "إعادة المحاولة" }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: resetLocalState, disabled: uploading, children: "إزالة" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "video-upload-area", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upload-icon", children: "🎬" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "upload-title", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "اسحب الفيديو هنا أو اختره من الجهاز" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: acceptedText }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "muted", children: [
        "الحد الأقصى: ",
        MAX_VIDEO_SIZE / (1024 * 1024),
        "MB"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => fileInputRef.current?.click(), loading: uploading, children: "اختيار فيديو الريل" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: ALLOWED_TYPES.join(","),
        onChange: handleFileSelect,
        style: { display: "none" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .video-uploader-shell { display: grid; gap: 12px; }
        .upload-settings-card,
        .video-upload-status,
        .video-upload-area {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.66);
        }
        .settings-head {
          display: grid;
          gap: 8px;
        }
        .settings-head strong {
          color: #fff;
          font-size: 15px;
        }
        .settings-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .studio-badge {
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #dbeafe;
          font-size: 12px;
          border: 1px solid rgba(147,197,253,0.16);
        }
        .settings-grid.two-cols {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cardish {
          border-radius: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .settings-toggle {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #fff;
        }
        .settings-toggle small {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 12px;
        }
        .settings-select {
          display: grid;
          gap: 8px;
          color: #fff;
        }
        .studio-sliders-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .studio-slider {
          display: grid;
          gap: 8px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .studio-slider-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #fff;
          font-size: 13px;
        }
        .studio-slider input[type="range"] {
          width: 100%;
          accent-color: #8b5cf6;
        }
        .upload-actions,
        .progress-info,
        .video-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .video-upload-area { text-align: center; justify-items: center; padding: 20px 16px; }
        .upload-icon {
          width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(59,130,246,0.16)); font-size: 28px;
        }
        .upload-title { font-weight: 800; color: #fff; margin: 0; }
        .video-preview-card { position: relative; border-radius: 18px; overflow: hidden; background: #020617; border: 1px solid rgba(255,255,255,0.08); }
        .preview-ribbon {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15,23,42,0.72);
          color: #fff;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .video-preview-player { width: 100%; max-height: 320px; display: block; background: #000; }
        .upload-state-pill { padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: rgba(34,197,94,0.16); color: #86efac; }
        .upload-state-pill.busy { background: rgba(59,130,246,0.16); color: #93c5fd; }
        .upload-state-pill.error { background: rgba(239,68,68,0.16); color: #fca5a5; }
        .muted { margin: 0; color: #94a3b8; font-size: 13px; }
        .upload-progress { display: grid; gap: 8px; }
        .progress-bar { height: 10px; border-radius: 999px; background: rgba(148,163,184,0.18); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8b5cf6, #3b82f6); transition: width 160ms ease; }
        .progress-stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 12px; color: #cbd5e1; }
        .thumbnail-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.04); }
        .video-thumb { width: 120px; height: 68px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
        .quality-select {
          border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 12px;
          background: rgba(15,23,42,0.82); color: #fff;
        }
        .error-banner { border-radius: 14px; padding: 10px 12px; background: rgba(127,29,29,0.25); border: 1px solid rgba(248,113,113,0.26); color: #fecaca; }
        @media (max-width: 720px) {
          .settings-grid.two-cols,
          .studio-sliders-grid,
          .progress-stats-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      ` })
  ] });
}
const EMOJIS = ["❤️", "🔥", "😂", "👏", "😮", "💯"];
function enrichMentions(text = "") {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith("@")) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "var(--primary)", fontWeight: 700 }, children: part }, index);
    if (part.startsWith("#")) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "var(--accent)", fontWeight: 700 }, children: part }, index);
    return part;
  });
}
function flattenComments(items = [], depth = 0, result = []) {
  items.forEach((item) => {
    result.push({ ...item, depth });
    if (Array.isArray(item?.replies) && item.replies.length) {
      flattenComments(item.replies, depth + 1, result);
    }
  });
  return result;
}
const CommentRow = ({ index, style, data }) => {
  const {
    items,
    replyState,
    editState,
    onReplyStateChange,
    onEditStateChange,
    onReplySubmit,
    onEditSubmit,
    onLike,
    onPin,
    onHide,
    onReport,
    onDelete,
    onCopy,
    onReact
  } = data;
  const item = items[index];
  if (!item) return null;
  const replyText = replyState[item.id] || "";
  const editText = editState[item.id] ?? item.content ?? "";
  const totalReactions = Object.values(item.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const isEditing = typeof editState[item.id] === "string";
  const isReplying = typeof replyState[item.id] === "string";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, padding: "10px 8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `comment-card-shell ${item.optimistic ? "optimistic" : ""} ${item.justArrived ? "live" : ""} ${item.is_hidden ? "is-hidden" : ""}`,
      style: { marginInlineStart: `${Math.min(item.depth || 0, 5) * 18}px` },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-top-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: item.username || item.user || "مستخدم" }),
            item.is_pinned ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill pinned", children: "📌 مثبت" }) : null,
            item.optimistic ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill pending", children: "قيد الإرسال" }) : null,
            item.justArrived ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill live", children: "الآن" }) : null,
            item.is_hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "comment-state-pill muted", children: "مخفي" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 12 }, children: item.created_at ? new Date(item.created_at).toLocaleString("ar-EG") : "الآن" })
        ] }),
        isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: editText, onChange: (event) => onEditStateChange(item.id, event.target.value), rows: 3, style: { width: "100%", borderRadius: 12, padding: 10 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => onEditSubmit(item.id, editText), children: "حفظ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => onEditStateChange(item.id, null), children: "إلغاء" })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { lineHeight: 1.8, fontSize: 14, marginTop: 8 }, children: item.is_hidden ? /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "هذا التعليق مخفي." }) : enrichMentions(item.content || item.text || item.comment || "") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-toolbar-row", style: { marginTop: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: EMOJIS.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "comment-emoji-btn", onClick: () => onReact?.(item.id, emoji), children: [
            emoji,
            " ",
            Number(item.reactions?.[emoji] || 0) || ""
          ] }, emoji)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "comment-link-btn", onClick: () => onLike?.(item.id), children: [
              item.is_liked ? "💙" : "🤍",
              " ",
              item.likes_count || 0
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onReplyStateChange(item.id, isReplying ? null : ""), children: "رد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onEditStateChange(item.id, item.content || ""), children: "تعديل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onPin?.(item.id, !item.is_pinned), children: item.is_pinned ? "إلغاء التثبيت" : "تثبيت" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onHide?.(item.id, !item.is_hidden), children: item.is_hidden ? "إظهار" : "إخفاء" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onCopy?.(item), children: "نسخ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn", onClick: () => onReport?.(item.id), children: "إبلاغ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-link-btn danger", onClick: () => onDelete?.(item.id), children: "حذف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted", style: { fontSize: 11 }, children: [
              "إجمالي التفاعل ",
              totalReactions
            ] })
          ] })
        ] }),
        isReplying ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8, marginTop: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: replyText, onChange: (event) => onReplyStateChange(item.id, event.target.value), rows: 2, placeholder: `رد على @${item.username || "user"}`, style: { width: "100%", borderRadius: 12, padding: 10 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => onReplySubmit(item.id, replyText), children: "إرسال الرد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "secondary", onClick: () => onReplyStateChange(item.id, null), children: "إلغاء" })
          ] })
        ] }) : null
      ]
    }
  ) });
};
function NestedComments({
  comments = [],
  pagination = null,
  sortBy = "newest",
  loadingMore = false,
  onSortChange,
  onLoadMore,
  onAddComment,
  onReply,
  onToggleReaction,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onPinComment,
  onHideComment,
  onReportComment,
  onCopyComment
}) {
  const [commentText, setCommentText] = reactExports.useState("");
  const [replyDrafts, setReplyDrafts] = reactExports.useState({});
  const [editDrafts, setEditDrafts] = reactExports.useState({});
  const flatComments = reactExports.useMemo(() => flattenComments(comments), [comments]);
  const pendingCount = flatComments.filter((item) => item.optimistic).length;
  const liveCount = flatComments.filter((item) => item.justArrived).length;
  const listData = reactExports.useMemo(() => ({
    items: flatComments,
    replyState: replyDrafts,
    editState: editDrafts,
    onReplyStateChange: (commentId, value) => {
      setReplyDrafts((prev) => {
        const next = { ...prev };
        if (value === null) delete next[commentId];
        else next[commentId] = value;
        return next;
      });
    },
    onEditStateChange: (commentId, value) => {
      setEditDrafts((prev) => {
        const next = { ...prev };
        if (value === null) delete next[commentId];
        else next[commentId] = value;
        return next;
      });
    },
    onReplySubmit: (commentId, value) => {
      if (!String(value || "").trim()) return;
      onReply?.(commentId, value.trim());
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    },
    onEditSubmit: (commentId, value) => {
      if (!String(value || "").trim()) return;
      onEditComment?.(commentId, value.trim());
      setEditDrafts((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    },
    onLike: onLikeComment,
    onPin: onPinComment,
    onHide: onHideComment,
    onReport: onReportComment,
    onDelete: onDeleteComment,
    onCopy: onCopyComment,
    onReact: onToggleReaction
  }), [flatComments, replyDrafts, editDrafts, onReply, onEditComment, onLikeComment, onPinComment, onHideComment, onReportComment, onDeleteComment, onCopyComment, onToggleReaction]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", height: "100%", gap: 16 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comments-head-row", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { style: { margin: 0 }, children: [
          "التعليقات (",
          flatComments.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 12, marginTop: 4 }, children: "النظام يدعم الردود المتداخلة والتحديثات الفورية والإجراءات السريعة." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comments-badges-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "comment-summary-pill live", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "live-mini-dot" }),
          "Realtime ",
          liveCount ? `(${liveCount})` : ""
        ] }),
        pendingCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "comment-summary-pill pending", children: [
          "معلق ",
          pendingCount
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: sortBy, onChange: (event) => onSortChange?.(event.target.value), style: { minHeight: 34, borderRadius: 999, padding: "0 12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "newest", children: "الأحدث" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "popular", children: "الأكثر تفاعلاً" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "oldest", children: "الأقدم" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, minHeight: 320 }, children: flatComments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted text-center py-10", children: "لا توجد تعليقات بعد." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      FixedSizeList,
      {
        height,
        width,
        itemCount: flatComments.length,
        itemSize: 220,
        itemData: listData,
        className: "no-scrollbar",
        children: CommentRow
      }
    ) }) }),
    pagination?.has_more ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: onLoadMore, loading: loadingMore, children: "تحميل المزيد من التعليقات" }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "comment-composer-shell", style: { marginTop: "auto" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          placeholder: "اكتب تعليقك... تقدر تستخدم @mention و #hashtag",
          value: commentText,
          onChange: (event) => setCommentText(event.target.value),
          rows: 3,
          style: { width: "100%", borderRadius: 16, padding: 12, fontSize: 14 }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" }, children: EMOJIS.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "comment-emoji-btn", onClick: () => setCommentText((prev) => `${prev}${emoji}`), children: emoji }, emoji)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => {
          if (!commentText.trim()) return;
          onAddComment?.({ content: commentText.trim() });
          setCommentText("");
        }, children: "نشر" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .comment-composer-shell,
        .comment-card-shell {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.05);
          border-radius: 18px;
          padding: 14px;
        }
        .comment-card-shell.is-hidden {
          opacity: 0.78;
          border-style: dashed;
        }
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          color: inherit;
        }
        .comment-link-btn.danger {
          border-color: rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap,
        .comment-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .comment-top-row {
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .comment-state-pill,
        .comment-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .comment-summary-pill.live,
        .comment-state-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }
        .comment-state-pill.pending,
        .comment-summary-pill.pending {
          background: rgba(251,191,36,0.12);
          color: #fde68a;
        }
        .comment-state-pill.pinned {
          background: rgba(139,92,246,0.16);
          color: #d8b4fe;
        }
        .comment-state-pill.muted {
          background: rgba(148,163,184,0.14);
          color: #cbd5e1;
        }
        .live-mini-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: comment-live-pulse 1.5s infinite;
        }
        @keyframes comment-live-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` })
  ] });
}
const STORAGE_KEY = "yamshat_video_settings_v1";
const DEFAULTS = {
  muted: true,
  // start muted to satisfy autoplay policies
  defaultVolume: 1,
  preferredQuality: "auto",
  // 'auto' | 'low' | 'medium' | 'high'
  autoplay: true,
  preloadStrategy: "metadata"
  // 'none' | 'metadata' | 'auto'
};
function readSettings() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
function writeSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}
let hlsModulePromise = null;
async function loadHls() {
  if (typeof window === "undefined") return null;
  if (window.Hls) return window.Hls;
  if (hlsModulePromise) return hlsModulePromise;
  hlsModulePromise = __vitePreload(() => import(
    /* @vite-ignore */
    "./hls-UO_B3WO7.js"
  ), true ? [] : void 0).then((m) => m?.default || m?.Hls || null).catch(() => null);
  return hlsModulePromise;
}
function isHlsSource(src = "") {
  return /\.m3u8($|\?)/i.test(String(src || ""));
}
class VideoEngine {
  constructor() {
    this.settings = readSettings();
    this.activeVideo = null;
    this.hlsInstances = /* @__PURE__ */ new WeakMap();
    this.listeners = /* @__PURE__ */ new Set();
    this.preloadCache = /* @__PURE__ */ new Map();
  }
  getSettings() {
    return { ...this.settings };
  }
  updateSettings(patch = {}) {
    this.settings = { ...this.settings, ...patch };
    writeSettings(this.settings);
    this._notify();
  }
  subscribe(fn) {
    if (typeof fn !== "function") return () => {
    };
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  _notify() {
    for (const fn of this.listeners) {
      try {
        fn(this.getSettings());
      } catch {
      }
    }
  }
  /**
   * Attach a <video> element to a source (HLS or progressive).
   * Returns a cleanup function.
   */
  async attach(videoEl, src) {
    if (!videoEl || !src) return () => {
    };
    this.detach(videoEl);
    if (isHlsSource(src)) {
      const Hls = await loadHls();
      if (Hls && Hls.isSupported && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          lowLatencyMode: false,
          enableWorker: true
        });
        hls.loadSource(src);
        hls.attachMedia(videoEl);
        this.hlsInstances.set(videoEl, hls);
      } else if (videoEl.canPlayType && videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = src;
      } else {
        videoEl.src = src;
      }
    } else {
      videoEl.src = src;
    }
    return () => this.detach(videoEl);
  }
  detach(videoEl) {
    if (!videoEl) return;
    const hls = this.hlsInstances.get(videoEl);
    if (hls) {
      try {
        hls.destroy();
      } catch {
      }
      this.hlsInstances.delete(videoEl);
    }
  }
  /**
   * Only one video can be "active" at a time — pauses everyone else.
   */
  setActive(videoEl) {
    if (this.activeVideo && this.activeVideo !== videoEl) {
      try {
        this.activeVideo.pause();
      } catch {
      }
    }
    this.activeVideo = videoEl;
  }
  clearActive(videoEl) {
    if (this.activeVideo === videoEl) this.activeVideo = null;
  }
  pauseAll() {
    if (this.activeVideo) {
      try {
        this.activeVideo.pause();
      } catch {
      }
    }
    this.activeVideo = null;
  }
  /**
   * Preload metadata for an upcoming source (used by reels).
   */
  preload(src) {
    if (!src || this.preloadCache.has(src)) return;
    try {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = src;
      this.preloadCache.set(src, v);
      setTimeout(() => {
        try {
          v.removeAttribute("src");
          v.load();
        } catch {
        }
        this.preloadCache.delete(src);
      }, 3e4);
    } catch {
    }
  }
}
const videoService = new VideoEngine();
function useVideo({
  src,
  autoplay = false,
  muted: initialMuted,
  loop = false,
  smartPause = false,
  threshold = 0.6
} = {}) {
  const videoRef = reactExports.useRef(null);
  const containerRef = reactExports.useRef(null);
  const [isPlaying, setIsPlaying] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState(0);
  const [duration, setDuration] = reactExports.useState(0);
  const [buffered, setBuffered] = reactExports.useState(0);
  const [muted, setMuted] = reactExports.useState(
    typeof initialMuted === "boolean" ? initialMuted : videoService.getSettings().muted
  );
  const [isVisible, setIsVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return void 0;
    let cleanup = () => {
    };
    let cancelled = false;
    videoService.attach(el, src).then((c) => {
      if (cancelled) {
        try {
          c();
        } catch {
        }
      } else {
        cleanup = c;
      }
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [src]);
  reactExports.useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted]);
  reactExports.useEffect(() => {
    if (!smartPause) return void 0;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return void 0;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting && entry.intersectionRatio >= threshold);
        }
      },
      { threshold: [0, threshold, 1] }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [smartPause, threshold]);
  reactExports.useEffect(() => {
    const el = videoRef.current;
    if (!el || !smartPause) return;
    if (isVisible) {
      videoService.setActive(el);
      const p = el.play();
      if (p && p.catch) p.catch(() => {
      });
    } else {
      try {
        el.pause();
      } catch {
      }
      videoService.clearActive(el);
    }
  }, [isVisible, smartPause]);
  reactExports.useEffect(() => {
    const el = videoRef.current;
    if (!el) return void 0;
    const onPlay = () => {
      setIsPlaying(true);
      videoService.setActive(el);
    };
    const onPause = () => {
      setIsPlaying(false);
      videoService.clearActive(el);
    };
    const onTime = () => {
      setProgress(el.duration ? el.currentTime / el.duration * 100 : 0);
      if (el.buffered && el.buffered.length > 0 && el.duration) {
        setBuffered(el.buffered.end(el.buffered.length - 1) / el.duration * 100);
      }
    };
    const onMeta = () => setDuration(el.duration || 0);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);
  const play = reactExports.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const p = el.play();
    if (p && p.catch) p.catch(() => {
    });
  }, []);
  const pause = reactExports.useCallback(() => {
    const el = videoRef.current;
    if (el) {
      try {
        el.pause();
      } catch {
      }
    }
  }, []);
  const toggle = reactExports.useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) play();
    else pause();
  }, [play, pause]);
  const toggleMute = reactExports.useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      videoService.updateSettings({ muted: next });
      return next;
    });
  }, []);
  const seek = reactExports.useCallback((percent) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.max(0, Math.min(el.duration, percent / 100 * el.duration));
  }, []);
  reactExports.useEffect(() => {
    if (!autoplay) return;
    const el = videoRef.current;
    if (!el) return;
    const p = el.play();
    if (p && p.catch) p.catch(() => {
    });
  }, [autoplay]);
  return {
    videoRef,
    containerRef,
    isPlaying,
    progress,
    duration,
    buffered,
    muted,
    setMuted,
    toggleMute,
    play,
    pause,
    toggle,
    seek,
    loop,
    isVisible
  };
}
function UniversalPlayer({
  src,
  poster,
  variant = "post",
  autoplay,
  loop,
  muted,
  isActive,
  onDoubleTapLike,
  qualities = [],
  className = "",
  onError
}) {
  const smartPause = variant === "reel";
  const computedAutoplay = autoplay ?? (variant === "reel" || variant === "live");
  const computedLoop = loop ?? variant === "reel";
  const computedMuted = muted ?? variant === "reel";
  const {
    videoRef,
    containerRef,
    isPlaying,
    progress,
    duration,
    buffered,
    muted: isMuted,
    toggleMute,
    toggle,
    seek
  } = useVideo({
    src,
    autoplay: computedAutoplay,
    muted: computedMuted,
    smartPause,
    threshold: 0.6
  });
  const [showControls, setShowControls] = reactExports.useState(variant !== "reel");
  const [showHeart, setShowHeart] = reactExports.useState(false);
  const [speed, setSpeed] = reactExports.useState(1);
  const [currentSrc, setCurrentSrc] = reactExports.useState(src);
  const [fullscreen, setFullscreen] = reactExports.useState(false);
  const fullscreenApi = reactExports.useMemo(() => ({
    request: (node) => node?.requestFullscreen || node?.webkitRequestFullscreen || node?.mozRequestFullScreen || node?.msRequestFullscreen,
    exit: document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen,
    element: () => document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null
  }), []);
  reactExports.useEffect(() => {
    if (variant !== "reel") return;
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      const p = el.play();
      if (p && p.catch) p.catch(() => {
      });
    } else {
      try {
        el.pause();
        el.currentTime = 0;
      } catch {
      }
    }
  }, [isActive, variant, videoRef]);
  const lastTapRef = reactExports.useState({ ts: 0 })[0];
  const handleTap = reactExports.useCallback(() => {
    if (variant !== "reel") {
      toggle();
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.ts < 280) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      if (typeof onDoubleTapLike === "function") onDoubleTapLike();
      lastTapRef.ts = 0;
      return;
    }
    lastTapRef.ts = now;
    setTimeout(() => {
      if (lastTapRef.ts !== 0 && Date.now() - lastTapRef.ts >= 280) {
        toggle();
        lastTapRef.ts = 0;
      }
    }, 300);
  }, [variant, toggle, onDoubleTapLike, lastTapRef]);
  reactExports.useEffect(() => {
    const syncFullscreenState = () => setFullscreen(Boolean(fullscreenApi.element()));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    document.addEventListener("mozfullscreenchange", syncFullscreenState);
    document.addEventListener("MSFullscreenChange", syncFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
      document.removeEventListener("mozfullscreenchange", syncFullscreenState);
      document.removeEventListener("MSFullscreenChange", syncFullscreenState);
    };
  }, [fullscreenApi]);
  const handleFullscreen = reactExports.useCallback(async () => {
    const node = containerRef.current;
    if (!node) return;
    try {
      if (!fullscreenApi.element()) {
        const requestFullscreen = fullscreenApi.request(node);
        if (requestFullscreen) {
          await requestFullscreen.call(node);
          setFullscreen(true);
        }
        return;
      }
      const exitFullscreen = fullscreenApi.exit;
      if (exitFullscreen) {
        await exitFullscreen.call(document);
        setFullscreen(false);
      }
    } catch {
    }
  }, [containerRef, fullscreenApi]);
  const handlePiP = reactExports.useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await el.requestPictureInPicture?.();
    } catch {
    }
  }, [videoRef]);
  const handleSpeed = reactExports.useCallback((v) => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = v;
    setSpeed(v);
  }, [videoRef]);
  const handleQuality = reactExports.useCallback((url) => {
    setCurrentSrc(url);
  }, []);
  const containerStyle = {
    position: "relative",
    width: "100%",
    height: variant === "reel" ? "100%" : "auto",
    aspectRatio: variant === "reel" ? "9 / 16" : variant === "live" ? "16 / 9" : void 0,
    background: "#000",
    borderRadius: variant === "reel" ? 0 : 12,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff"
  };
  const fmt = (s) => {
    if (!s || Number.isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: containerRef,
      className: `yamshat-universal-player yamshat-up-${variant} ${className}`,
      style: containerStyle,
      onMouseEnter: () => setShowControls(true),
      onMouseLeave: () => variant !== "reel" && isPlaying && setShowControls(false),
      onClick: variant === "reel" ? handleTap : void 0,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            ref: videoRef,
            src: currentSrc !== src ? currentSrc : void 0,
            poster,
            playsInline: true,
            loop: computedLoop,
            muted: isMuted,
            preload: "metadata",
            onError,
            style: {
              width: "100%",
              height: "100%",
              objectFit: variant === "reel" ? "cover" : "contain"
            }
          }
        ),
        variant === "reel" && showHeart && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "aria-hidden": true,
            style: {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) scale(1.4)",
              fontSize: 96,
              color: "#ff3366",
              textShadow: "0 4px 24px rgba(0,0,0,0.4)",
              pointerEvents: "none",
              animation: "yamshat-heart-pop 700ms ease-out"
            },
            children: "❤️"
          }
        ),
        variant === "live" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "absolute",
          top: 12,
          insetInlineStart: 12,
          background: "#ff3b30",
          color: "white",
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.5
        }, children: "● LIVE" }),
        variant === "reel" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.stopPropagation();
              toggleMute();
            },
            style: {
              position: "absolute",
              bottom: 80,
              insetInlineEnd: 16,
              background: "rgba(0,0,0,0.5)",
              color: "white",
              border: 0,
              width: 40,
              height: 40,
              borderRadius: 20,
              cursor: "pointer",
              fontSize: 18
            },
            "aria-label": isMuted ? "Unmute" : "Mute",
            children: isMuted ? "🔇" : "🔊"
          }
        ),
        (variant === "reel" || showControls) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: (e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width * 100;
              seek(pct);
            },
            style: {
              position: "absolute",
              bottom: variant === "reel" ? 0 : 44,
              left: 0,
              right: 0,
              height: variant === "reel" ? 3 : 5,
              background: "rgba(255,255,255,0.18)",
              cursor: variant !== "reel" ? "pointer" : "default"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: `${buffered}%`, height: "100%", background: "rgba(255,255,255,0.35)" } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
                width: `${progress}%`,
                height: "100%",
                background: "#ff3366",
                marginTop: variant === "reel" ? -3 : -5
              } })
            ]
          }
        ),
        variant !== "reel" && showControls && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 12px",
          background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
          display: "flex",
          alignItems: "center",
          gap: 10
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                toggle();
              },
              style: btnStyle,
              "aria-label": isPlaying ? "Pause" : "Play",
              children: isPlaying ? "⏸" : "▶"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                toggleMute();
              },
              style: btnStyle,
              "aria-label": isMuted ? "Unmute" : "Mute",
              children: isMuted ? "🔇" : "🔊"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#fff" }, children: [
            fmt(progress / 100 * duration),
            " / ",
            fmt(duration)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1 } }),
          variant === "post" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: speed,
              onChange: (e) => {
                e.stopPropagation();
                handleSpeed(parseFloat(e.target.value));
              },
              style: selectStyle,
              children: [0.5, 1, 1.25, 1.5, 2].map((v) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: v, children: [
                v,
                "x"
              ] }, v))
            }
          ),
          qualities.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: currentSrc,
              onChange: (e) => {
                e.stopPropagation();
                handleQuality(e.target.value);
              },
              style: selectStyle,
              children: qualities.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: q.url, children: q.label }, q.url))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                handlePiP();
              },
              style: btnStyle,
              "aria-label": "Picture in picture",
              children: "📺"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                handleFullscreen();
              },
              style: btnStyle,
              "aria-label": "Fullscreen",
              children: fullscreen ? "⛶" : "⛶"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes yamshat-heart-pop {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30%  { opacity: 1; transform: translate(-50%, -50%) scale(1.6); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
      ` })
      ]
    }
  );
}
const btnStyle = {
  background: "none",
  border: 0,
  color: "white",
  cursor: "pointer",
  fontSize: 18,
  padding: "4px 6px"
};
const selectStyle = {
  background: "rgba(255,255,255,0.12)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 6,
  padding: "3px 6px",
  fontSize: 12
};
function computeReelScore(item) {
  const likes = Number(item.likes_count || 0);
  const comments = Number(item.comments_count || 0);
  const shares = Number(item.share_count || 0);
  const saves = Number(item.saved_count || 0);
  const freshnessHours = Math.max(1, (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 36e5);
  return likes * 2 + comments * 3 + shares * 4 + saves * 4 + 96 / freshnessHours;
}
function isVideoUrl(url = "", hints = {}) {
  const candidate = String(url || "");
  if (hints.forceVideo) return true;
  return /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i.test(candidate) || /\b(video|reel|stream)\b/i.test(candidate);
}
function getPosterUrl(reel) {
  const source = reel.thumbnail_url || reel.image_url || reel.preview_url || "";
  return source ? getOptimizedImageUrl(source, 720, 74) : "";
}
function normalizeReel(item = {}) {
  return {
    ...item,
    media_url: resolveMediaUrl(item.media_url || item.video_url || item.videoUrl || ""),
    recommendation_score: item.recommendation_score || computeReelScore(item),
    views_count: Number(item.views_count || item.view_count || 0),
    likes_count: Number(item.likes_count || 0),
    comments_count: Number(item.comments_count || 0),
    share_count: Number(item.share_count || 0),
    saved_count: Number(item.saved_count || 0),
    poster_url: resolveMediaUrl(item.poster_url || getPosterUrl(item)),
    duration_label: item.duration_label || item.duration || ""
  };
}
function dataUrlToFile(dataUrl = "", fileName = "thumbnail.jpg") {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
  const [meta, content] = dataUrl.split(",");
  if (!meta || !content) return null;
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
}
const QUALITY_OPTIONS = [
  { value: "auto", label: "تلقائي" },
  { value: "high", label: "عالي" },
  { value: "medium", label: "متوسط" },
  { value: "low", label: "موفر" }
];
const REPORT_OPTIONS = [
  { value: "spam", label: "سبام" },
  { value: "nudity", label: "محتوى غير مناسب" },
  { value: "violence", label: "عنف" },
  { value: "copyright", label: "حقوق ملكية" },
  { value: "other", label: "سبب آخر" }
];
function ReelItem({ index, style, data }) {
  const {
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    handleReport,
    handleFollow,
    followingUsers,
    currentUser,
    scrollToIndex,
    isDesktop,
    isBuffering,
    bufferPercent,
    selectedQuality,
    activeQuality,
    watchHistoryMap,
    onVideoWaiting,
    onVideoCanPlay,
    onVideoProgress,
    onVideoLoadedMetadata,
    onVideoEnded,
    onVideoError,
    onVideoPlay,
    navDirection
  } = data;
  const reel = reels[index];
  const isActive = index === activeIndex;
  const videoRef = reactExports.useRef(null);
  const [playbackProgress, setPlaybackProgress] = reactExports.useState(0);
  const insights = reactExports.useMemo(() => reel ? getReelInsightsById(reel.id) : null, [reel?.id]);
  const watchEntry = reel ? watchHistoryMap[String(reel.id)] : null;
  reactExports.useEffect(() => {
    setVideoRef(index, videoRef.current);
    return () => setVideoRef(index, null);
  }, [index, setVideoRef]);
  if (!reel) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style, className: `reel-container ${isActive ? "active" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `reel-card-shell reel-card relative bg-black overflow-hidden h-full w-full ${isActive ? "active" : ""}`, "data-direction": navDirection > 0 ? "forward" : "backward", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "video",
      {
        ref: videoRef,
        className: `w-full h-full object-cover reel-video ${isActive ? "active" : ""}`,
        loop: true,
        playsInline: true,
        muted: true,
        autoPlay: isActive,
        preload: "metadata",
        poster: reel.poster_url,
        onClick: () => {
          if (!videoRef.current) return;
          if (videoRef.current.paused) videoRef.current.play().catch(() => {
          });
          else videoRef.current.pause();
        },
        onPlay: () => onVideoPlay(index),
        onWaiting: () => onVideoWaiting(index),
        onCanPlay: () => onVideoCanPlay(index),
        onProgress: () => onVideoProgress(index),
        onTimeUpdate: () => {
          if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration <= 0) return;
          setPlaybackProgress(videoRef.current.currentTime / videoRef.current.duration * 100);
        },
        onLoadedMetadata: () => onVideoLoadedMetadata(index),
        onEnded: () => onVideoEnded(index),
        onError: () => onVideoError(index),
        onDoubleClick: () => handleLike(reel, { burst: true })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-top-overlay absolute inset-x-0 top-0 z-20 px-4 pt-4 pb-10 text-white pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 pointer-events-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-chip", children: "الريلز" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "reel-hint", children: isDesktop ? "تنقل بالأسهم ↑ ↓" : "مرر عموديًا أو اسحب للأعلى والأسفل" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-count-pill", children: [
          index + 1,
          " / ",
          reels.length
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-meta-row pointer-events-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "reel-chip ghost", children: [
          "الجودة: ",
          isActive ? QUALITY_OPTIONS.find((item) => item.value === activeQuality)?.label || activeQuality : "جاهز"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "reel-chip ghost", children: [
          "الوضع: ",
          QUALITY_OPTIONS.find((item) => item.value === selectedQuality)?.label || selectedQuality
        ] }),
        watchEntry ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "reel-chip ghost", children: [
          "آخر مشاهدة ",
          formatWatchPercentage(watchEntry.progress || 0)
        ] }) : null
      ] }),
      isActive && isBuffering ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-buffer-banner pointer-events-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "جارٍ التحميل الذكي…" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          bufferPercent,
          "%"
        ] })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-bottom-overlay absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2 pointer-events-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: getOptimizedImageUrl(reel.user_avatar, 80), alt: "", className: "w-full h-full object-cover" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-sm", children: [
          "@",
          reel.username || "user"
        ] }),
        reel.username !== currentUser ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors", onClick: () => handleFollow(reel.username), children: followingUsers.has(String(reel.username || "")) ? "تمت المتابعة" : "متابعة" }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-6 line-clamp-3 mb-2 pointer-events-auto", children: reel.content || "ريل جديد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-meta-row pointer-events-auto", children: [
        reel.duration_label ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-chip ghost", children: reel.duration_label }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "reel-chip ghost", children: [
          "👁 ",
          Number(reel.views_count || 0)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "reel-chip ghost", children: [
          "⏱ متوسط المشاهدة ",
          Math.round(Number(insights?.avgWatchMs || 0) / 1e3),
          "ث"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-swipe-indicator", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "︿" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "اسحب" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "﹀" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reel-actions-stack absolute right-4 bottom-24 flex flex-col gap-4 items-center z-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleLike(reel), className: `reel-action-btn ${reel.is_liked ? "liked" : ""}`, children: "❤️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: reel.likes_count || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => openComments(reel), className: "reel-action-btn", children: "💬" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: reel.comments_count || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleSave(reel), className: `reel-action-btn ${reel.is_saved ? "saved" : ""}`, children: "🔖" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: "حفظ" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleShare(reel), className: "reel-action-btn", children: "↗" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: "مشاركة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleReport(reel), className: "reel-action-btn warn", children: "⚑" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "reel-action-label", children: "بلاغ" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-progress-rail", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-progress-fill", style: { width: `${Math.max(playbackProgress, 0)}%` } }) }),
    isDesktop ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "reel-arrow reel-arrow-up", onClick: () => scrollToIndex(index - 1), disabled: index === 0, children: "↑" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "reel-arrow reel-arrow-down", onClick: () => scrollToIndex(index + 1), disabled: index >= reels.length - 1, children: "↓" })
    ] }) : null
  ] }) });
}
function ReelsPage() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const listRef = reactExports.useRef(null);
  const videoRefs = reactExports.useRef(/* @__PURE__ */ new Map());
  const viewTimersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const preloadNodesRef = reactExports.useRef([]);
  const viewedReelsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const gestureRafRef = reactExports.useRef(0);
  const gestureLockRef = reactExports.useRef(false);
  const wheelAccumulatorRef = reactExports.useRef(0);
  const touchStartYRef = reactExports.useRef(0);
  const activeSessionRef = reactExports.useRef(null);
  const bufferStartRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const bufferCountRef = reactExports.useRef({});
  const lastInteractionRef = reactExports.useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const [reels, setReels] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [activeIndex, setActiveIndex] = reactExports.useState(0);
  const [heartBurstId, setHeartBurstId] = reactExports.useState("");
  const [showUploadModal, setShowUploadModal] = reactExports.useState(false);
  const [showCommentsModal, setShowCommentsModal] = reactExports.useState(false);
  const [activeReel, setActiveReel] = reactExports.useState(null);
  const [activeComments, setActiveComments] = reactExports.useState([]);
  const [selectedQuality, setSelectedQuality] = reactExports.useState("auto");
  const [activeQuality, setActiveQuality] = reactExports.useState("high");
  const [navDirection, setNavDirection] = reactExports.useState(1);
  const [bufferState, setBufferState] = reactExports.useState({ index: -1, percent: 0, active: false });
  const [reportState, setReportState] = reactExports.useState({ open: false, reel: null, reason: "spam", note: "" });
  const [followingUsers, setFollowingUsers] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [watchHistoryMap, setWatchHistoryMap] = reactExports.useState(() => {
    const items = getWatchHistory();
    return items.reduce((acc, item) => {
      acc[String(item.reelId)] = item;
      return acc;
    }, {});
  });
  const [uploadState, setUploadState] = reactExports.useState({ mediaUrl: "", previewUrl: "", thumbnailUrl: "", uploading: false, publishing: false, content: "", fileName: "", processedFile: null, originalFile: null });
  const deviceProfile = reactExports.useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.videoPreloadRange || (deviceProfile.isLowEndDevice ? 1 : 2);
  const isDesktop = reactExports.useMemo(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches, []);
  const activeReelItem = reels[activeIndex] || null;
  const activeInsights = activeReelItem ? getReelInsightsById(activeReelItem.id) : null;
  const resetUploadState = reactExports.useCallback(() => {
    setUploadState({ mediaUrl: "", previewUrl: "", thumbnailUrl: "", uploading: false, publishing: false, content: "", fileName: "", processedFile: null, originalFile: null });
  }, []);
  const hydrateFromCache = reactExports.useCallback(() => {
    const cached = getReelsCache();
    if (Array.isArray(cached?.items) && cached.items.length) {
      setReels(cached.items.map(normalizeReel));
      setIsLoading(false);
    }
  }, []);
  const finalizeWatchSession = reactExports.useCallback((reason = "switch") => {
    const session = activeSessionRef.current;
    if (!session) return;
    const reel = session.reel;
    const video = videoRefs.current.get(session.index);
    const duration = Number(video?.duration || reel?.duration || 0);
    const position = Number(video?.currentTime || 0);
    const watchMs = Math.max(0, Date.now() - session.startedAt);
    const progress = duration > 0 ? Math.min(1, position / duration) : 0;
    const completed = progress >= 0.92 || reason === "ended";
    if (watchMs >= 600) {
      saveWatchHistoryEntry({
        reelId: reel.id,
        content: reel.content,
        username: reel.username,
        thumbnail_url: reel.poster_url,
        position,
        duration,
        progress,
        completed,
        quality: session.quality,
        watchMs
      });
      setWatchHistoryMap((prev) => ({
        ...prev,
        [String(reel.id)]: {
          reelId: String(reel.id),
          content: reel.content,
          username: reel.username,
          thumbnail_url: reel.poster_url,
          position,
          duration,
          progress,
          completed,
          quality: session.quality,
          watchMs,
          watchedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      }));
      trackReelAnalytics("watch_session", {
        reelId: reel.id,
        content: reel.content,
        username: reel.username,
        thumbnail_url: reel.poster_url,
        watchMs,
        quality: session.quality
      });
      if (completed) {
        trackReelAnalytics("completion", {
          reelId: reel.id,
          content: reel.content,
          username: reel.username,
          thumbnail_url: reel.poster_url,
          quality: session.quality
        });
      }
    }
    activeSessionRef.current = null;
  }, []);
  const scrollToIndex = reactExports.useCallback((nextIndex, origin = "programmatic") => {
    const bounded = Math.max(0, Math.min(nextIndex, reels.length - 1));
    if (!Number.isFinite(bounded) || bounded === activeIndex) return;
    finalizeWatchSession("switch");
    trackReelAnalytics("swipe", {
      reelId: reels[activeIndex]?.id,
      quality: activeQuality
    });
    setNavDirection(bounded > activeIndex ? 1 : -1);
    setActiveIndex(bounded);
    const outer = listRef.current?._outerRef;
    const viewportHeight = outer?.clientHeight || 0;
    if (outer && viewportHeight) {
      outer.scrollTo({ top: viewportHeight * bounded, behavior: "smooth" });
    } else {
      listRef.current?.scrollToItem?.(bounded, "start");
    }
    lastInteractionRef.current = Date.now();
  }, [activeIndex, activeQuality, finalizeWatchSession, reels]);
  const queueNavigation = reactExports.useCallback((direction, origin = "gesture") => {
    if (gestureLockRef.current) return;
    gestureLockRef.current = true;
    if (gestureRafRef.current) cancelAnimationFrame(gestureRafRef.current);
    gestureRafRef.current = requestAnimationFrame(() => {
      scrollToIndex(activeIndex + direction, origin);
      const cooldown = origin === "wheel" ? 380 : 260;
      window.setTimeout(() => {
        gestureLockRef.current = false;
      }, cooldown);
    });
  }, [activeIndex, scrollToIndex]);
  const loadReels = reactExports.useCallback(async () => {
    setIsLoading(true);
    try {
      let data;
      try {
        ({ data } = await API.get("/reels/feed", { params: { limit: 40, offset: 0 } }));
      } catch {
        try {
          ({ data } = await API.get("/reels", { params: { limit: 40, offset: 0 } }));
        } catch {
          const postsResponse = await getPosts({ page: 1, limit: 40 });
          const fallbackItems = Array.isArray(postsResponse?.data) ? postsResponse.data.filter((post) => isVideoUrl(post?.media_url || post?.image_url || "")).map((post) => ({
            ...post,
            video_url: post.media_url || post.image_url || "",
            media_url: post.media_url || post.image_url || "",
            thumbnail_url: post.image_url || post.media_url || "",
            image_url: post.image_url || post.media_url || ""
          })) : [];
          data = { items: fallbackItems, reels: fallbackItems };
        }
      }
      const source = Array.isArray(data) ? data : data?.items || data?.reels || [];
      const onlyVideos = source.filter((post) => isVideoUrl(post?.media_url || post?.video_url || "", { forceVideo: true })).map(normalizeReel);
      const rankedReels = await fetchSuggestedReels(onlyVideos);
      const normalized = (Array.isArray(rankedReels) ? rankedReels : onlyVideos).map(normalizeReel);
      setReels(normalized);
      saveReelsCache(normalized);
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحميل الريلز", description: error?.message });
      hydrateFromCache();
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromCache, pushToast]);
  reactExports.useEffect(() => {
    hydrateFromCache();
    loadReels();
  }, [hydrateFromCache, loadReels]);
  reactExports.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("upload") === "1") {
      setShowUploadModal(true);
    }
    const reelId = params.get("reel");
    if (reelId) {
      const reelIndex = reels.findIndex((item) => String(item.id) === String(reelId));
      if (reelIndex >= 0) {
        setActiveIndex(reelIndex);
        requestAnimationFrame(() => {
          listRef.current?.scrollToItem?.(reelIndex, "start");
        });
      }
    }
  }, [location.search, reels]);
  reactExports.useEffect(() => {
    const start = Math.max(0, activeIndex - (navDirection < 0 ? preloadRange : 1));
    const end = Math.min(reels.length, activeIndex + 1 + preloadRange + (navDirection > 0 ? 1 : 0));
    const nextItems = reels.slice(start, end).filter((_, index) => start + index !== activeIndex);
    preloadNodesRef.current.forEach((node) => node?.remove?.());
    preloadNodesRef.current = nextItems.map((reel) => {
      preloadPoster(reel.poster_url);
      const quality = computeAutoQuality({
        manualQuality: selectedQuality,
        preferredQuality: deviceProfile.preferredVideoQuality,
        saveData: deviceProfile.saveData,
        effectiveType: deviceProfile.effectiveType,
        bufferEvents: 0
      });
      return primeVideo(buildAdaptiveSource(reel, quality));
    }).filter(Boolean);
    return () => {
      preloadNodesRef.current.forEach((node) => node?.remove?.());
    };
  }, [activeIndex, deviceProfile, navDirection, preloadRange, reels, selectedQuality]);
  reactExports.useEffect(() => {
    const current = reels[activeIndex];
    const currentKey = String(current?.id || "");
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      const reel = reels[index];
      const inWindow = Math.abs(index - activeIndex) <= preloadRange;
      if (!inWindow || !reel) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.preload = "none";
        return;
      }
      const bufferEvents = bufferCountRef.current[String(reel.id)] || 0;
      const resolvedQuality = computeAutoQuality({
        manualQuality: selectedQuality,
        preferredQuality: deviceProfile.preferredVideoQuality,
        saveData: deviceProfile.saveData,
        effectiveType: deviceProfile.effectiveType,
        bufferEvents
      });
      const src = buildAdaptiveSource(reel, resolvedQuality);
      if (index === activeIndex) setActiveQuality(resolvedQuality);
      if (src && video.getAttribute("src") !== src) {
        video.setAttribute("src", src);
        video.load();
      }
      const distance = Math.abs(index - activeIndex);
      video.preload = distance === 0 ? "auto" : distance === 1 ? "auto" : "metadata";
      video.muted = true;
      video.playsInline = true;
      video.autoplay = index === activeIndex;
      if (index === activeIndex) video.play().catch(() => {
      });
      else video.pause();
    });
    if (current) {
      activeSessionRef.current = {
        reel: current,
        index: activeIndex,
        startedAt: Date.now(),
        quality: computeAutoQuality({
          manualQuality: selectedQuality,
          preferredQuality: deviceProfile.preferredVideoQuality,
          saveData: deviceProfile.saveData,
          effectiveType: deviceProfile.effectiveType,
          bufferEvents: bufferCountRef.current[currentKey] || 0
        })
      };
      trackReelAnalytics("impression", {
        reelId: current.id,
        content: current.content,
        username: current.username,
        thumbnail_url: current.poster_url
      });
      if (viewTimersRef.current.has(currentKey)) clearTimeout(viewTimersRef.current.get(currentKey));
      if (!viewedReelsRef.current.has(currentKey)) {
        const timer = setTimeout(() => {
          viewedReelsRef.current.add(currentKey);
          trackReelAnalytics("qualified_view", {
            reelId: current.id,
            content: current.content,
            username: current.username,
            thumbnail_url: current.poster_url,
            quality: activeSessionRef.current?.quality
          });
          API.post(`/reels/${encodeURIComponent(current.id)}/view`).catch(() => {
          });
        }, 2e3);
        viewTimersRef.current.set(currentKey, timer);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex, deviceProfile, navDirection, preloadRange, reels, selectedQuality]);
  reactExports.useEffect(() => {
    const handleBeforeUnload = () => finalizeWatchSession("unload");
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      finalizeWatchSession("unmount");
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (gestureRafRef.current) cancelAnimationFrame(gestureRafRef.current);
    };
  }, [finalizeWatchSession]);
  reactExports.useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isDesktop || showUploadModal || showCommentsModal || reportState.open) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        queueNavigation(1, "keyboard");
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        queueNavigation(-1, "keyboard");
      }
      if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        setShowUploadModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesktop, queueNavigation, reportState.open, showCommentsModal, showUploadModal]);
  const setVideoRef = reactExports.useCallback((index, node) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);
  const handleScroll = reactExports.useCallback(({ startIndex }) => {
    if (startIndex !== activeIndex && Date.now() - lastInteractionRef.current > 160) {
      finalizeWatchSession("switch");
      setActiveIndex(startIndex);
    }
  }, [activeIndex, finalizeWatchSession]);
  const handleWheelNavigation = reactExports.useCallback((event) => {
    if (showUploadModal || showCommentsModal || reportState.open) return;
    event.preventDefault();
    wheelAccumulatorRef.current += event.deltaY;
    if (Math.abs(wheelAccumulatorRef.current) < 56) return;
    const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
    wheelAccumulatorRef.current = 0;
    queueNavigation(direction, "wheel");
  }, [queueNavigation, reportState.open, showCommentsModal, showUploadModal]);
  const handleTouchStart = reactExports.useCallback((event) => {
    touchStartYRef.current = event.touches?.[0]?.clientY || 0;
  }, []);
  const handleTouchEnd = reactExports.useCallback((event) => {
    if (showUploadModal || showCommentsModal || reportState.open) return;
    const endY = event.changedTouches?.[0]?.clientY || 0;
    const diff = touchStartYRef.current - endY;
    const threshold = Math.max(40, Math.min(window.innerHeight * 0.08, 96));
    if (Math.abs(diff) < threshold) return;
    queueNavigation(diff > 0 ? 1 : -1, "touch");
  }, [queueNavigation, reportState.open, showCommentsModal, showUploadModal]);
  const handleVideoWaiting = reactExports.useCallback((index) => {
    const reel = reels[index];
    if (!reel) return;
    const key = String(reel.id);
    bufferStartRef.current.set(key, Date.now());
    bufferCountRef.current[key] = Number(bufferCountRef.current[key] || 0) + 1;
    setBufferState((prev) => ({ ...prev, active: true, index, percent: Math.max(prev.percent, 18) }));
    const autoQuality = computeAutoQuality({
      manualQuality: selectedQuality,
      preferredQuality: deviceProfile.preferredVideoQuality,
      saveData: deviceProfile.saveData,
      effectiveType: deviceProfile.effectiveType,
      bufferEvents: bufferCountRef.current[key]
    });
    if (selectedQuality === "auto" && activeIndex === index) {
      setActiveQuality(autoQuality);
      if (bufferCountRef.current[key] >= 2) {
        trackReelAnalytics("auto_quality_downgrade", {
          reelId: reel.id,
          content: reel.content,
          username: reel.username,
          thumbnail_url: reel.poster_url,
          quality: autoQuality
        });
      }
    }
  }, [activeIndex, deviceProfile, reels, selectedQuality]);
  const handleVideoCanPlay = reactExports.useCallback((index) => {
    const reel = reels[index];
    if (!reel) return;
    const key = String(reel.id);
    const startedAt = bufferStartRef.current.get(key);
    const bufferMs = startedAt ? Date.now() - startedAt : 0;
    if (startedAt) {
      trackReelAnalytics("buffer", {
        reelId: reel.id,
        content: reel.content,
        username: reel.username,
        thumbnail_url: reel.poster_url,
        bufferMs,
        quality: activeQuality
      });
      bufferStartRef.current.delete(key);
    }
    setBufferState({ index, percent: 100, active: false });
  }, [activeQuality, reels]);
  const handleVideoProgress = reactExports.useCallback((index) => {
    const video = videoRefs.current.get(index);
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (video.buffered?.length > 0) {
      const end = video.buffered.end(video.buffered.length - 1);
      const percent = Math.min(100, Math.round(end / video.duration * 100));
      if (activeIndex === index) setBufferState((prev) => ({ ...prev, index, percent }));
    }
  }, [activeIndex]);
  const handleVideoLoadedMetadata = reactExports.useCallback((index) => {
    const video = videoRefs.current.get(index);
    const reel = reels[index];
    if (!video || !reel) return;
    if (!reel.duration_label && Number.isFinite(video.duration) && video.duration > 0) {
      setReels((prev) => prev.map((item, idx) => idx === index ? {
        ...item,
        duration_label: `${Math.round(video.duration)}ث`
      } : item));
    }
  }, [reels]);
  const handleVideoEnded = reactExports.useCallback((index) => {
    if (index !== activeIndex) return;
    finalizeWatchSession("ended");
  }, [activeIndex, finalizeWatchSession]);
  const handleVideoError = reactExports.useCallback((index) => {
    const reel = reels[index];
    if (!reel) return;
    pushToast({ type: "warning", title: "تعذر تشغيل الريل", description: "تم تسجيل الخطأ وسيتم تجربة جودة أخف تلقائيًا." });
    bufferCountRef.current[String(reel.id)] = Math.max(2, Number(bufferCountRef.current[String(reel.id)] || 0));
    setActiveQuality("low");
  }, [pushToast, reels]);
  const handleVideoPlay = reactExports.useCallback((index) => {
    const reel = reels[index];
    if (!reel || !activeSessionRef.current || activeSessionRef.current.index !== index) return;
    activeSessionRef.current.quality = activeQuality;
  }, [activeQuality, reels]);
  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      setTimeout(() => setHeartBurstId(""), 650);
    }
    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? {
      ...item,
      is_liked: !item.is_liked,
      likes_count: item.is_liked ? Math.max(0, Number(item.likes_count || 0) - 1) : Number(item.likes_count || 0) + 1
    } : item));
    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/like`);
    } catch {
      setReels(originalReels);
      pushToast({ type: "error", title: "تعذر تحديث الإعجاب" });
    }
  };
  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? { ...item, is_saved: !item.is_saved } : item));
    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/save`);
    } catch {
      setReels(originalReels);
      pushToast({ type: "error", title: "تعذر حفظ الريل" });
    }
  };
  const handleShare = async (reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels?reel=${encodeURIComponent(reel.id)}`);
      pushToast({ type: "success", title: "تم نسخ رابط الريل" });
    } catch {
      pushToast({ type: "warning", title: "تعذر نسخ الرابط" });
    }
  };
  const handleFollow = reactExports.useCallback((username) => {
    if (!username) return;
    setFollowingUsers((prev) => {
      const next = new Set(prev);
      const key = String(username);
      const isFollowing = next.has(key);
      if (isFollowing) next.delete(key);
      else next.add(key);
      pushToast({
        type: "success",
        title: isFollowing ? "تم إلغاء المتابعة" : "تمت المتابعة",
        description: `@${key}`
      });
      return next;
    });
  }, [pushToast]);
  const handleReport = reactExports.useCallback((reel) => {
    setReportState({ open: true, reel, reason: "spam", note: "" });
  }, []);
  const submitReport = reactExports.useCallback(() => {
    if (!reportState.reel) return;
    submitModerationReport({
      reelId: reportState.reel.id,
      content: reportState.reel.content,
      username: reportState.reel.username,
      thumbnail_url: reportState.reel.poster_url,
      reason: reportState.reason,
      note: reportState.note
    });
    pushToast({ type: "success", title: "تم إرسال البلاغ للمراجعة" });
    setReportState({ open: false, reel: null, reason: "spam", note: "" });
  }, [pushToast, reportState]);
  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    try {
      const { data } = await getComments(reel.id);
      setActiveComments(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setActiveComments([]);
    }
  };
  const publishReel = async () => {
    if (!uploadState.mediaUrl && !uploadState.processedFile && !uploadState.originalFile) {
      pushToast({ type: "warning", title: "ارفع فيديو أولاً" });
      return;
    }
    const caption = uploadState.content?.trim() || "ريل جديد";
    setUploadState((prev) => ({ ...prev, publishing: true }));
    const tryMultipartFallback = async () => {
      const fallbackFile = uploadState.processedFile || uploadState.originalFile;
      if (!fallbackFile) throw new Error("لا يوجد ملف متاح لإعادة المحاولة.");
      const formData = new FormData();
      formData.append("file", fallbackFile);
      const thumbnailFile = dataUrlToFile(uploadState.thumbnailUrl, `${String(fallbackFile.name || "reel").replace(/\.[^.]+$/, "")}-thumb.jpg`);
      if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
      formData.append("caption", caption);
      formData.append("category", "general");
      return API.post("/reels", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    };
    try {
      if (uploadState.mediaUrl) {
        await API.post("/reels", {
          caption,
          media_url: uploadState.mediaUrl,
          video_url: uploadState.mediaUrl,
          thumbnail_url: uploadState.thumbnailUrl && !String(uploadState.thumbnailUrl).startsWith("data:") ? uploadState.thumbnailUrl : void 0
        });
      } else {
        await tryMultipartFallback();
      }
    } catch (error) {
      try {
        await tryMultipartFallback();
      } catch (fallbackError) {
        setUploadState((prev) => ({ ...prev, publishing: false }));
        pushToast({
          type: "error",
          title: "فشل نشر الريل",
          description: fallbackError?.response?.data?.detail || fallbackError?.message || error?.response?.data?.detail || error?.message
        });
        return;
      }
    }
    setShowUploadModal(false);
    setUploadState((prev) => ({ ...prev, publishing: false }));
    resetUploadState();
    navigate("/reels", { replace: true });
    await loadReels();
    pushToast({ type: "success", title: "تم نشر الريل بنجاح" });
  };
  const listData = reactExports.useMemo(() => ({
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    handleReport,
    handleFollow,
    followingUsers,
    currentUser,
    scrollToIndex,
    isDesktop,
    navDirection,
    isBuffering: bufferState.active && bufferState.index === activeIndex,
    bufferPercent: bufferState.percent,
    selectedQuality,
    activeQuality,
    watchHistoryMap,
    onVideoWaiting: handleVideoWaiting,
    onVideoCanPlay: handleVideoCanPlay,
    onVideoProgress: handleVideoProgress,
    onVideoLoadedMetadata: handleVideoLoadedMetadata,
    onVideoEnded: handleVideoEnded,
    onVideoError: handleVideoError,
    onVideoPlay: handleVideoPlay
  }), [
    activeIndex,
    activeQuality,
    bufferState.active,
    bufferState.index,
    bufferState.percent,
    currentUser,
    followingUsers,
    handleFollow,
    handleReport,
    handleSave,
    handleShare,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
    handleVideoLoadedMetadata,
    handleVideoPlay,
    handleVideoProgress,
    handleVideoWaiting,
    isDesktop,
    navDirection,
    reels,
    scrollToIndex,
    selectedQuality,
    setVideoRef,
    watchHistoryMap
  ]);
  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadState();
    navigate("/reels", { replace: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, {  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-page-shell", onWheelCapture: handleWheelNavigation, onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-header-bar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "الريلز" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: isDesktop ? "سوايب سريع بالمفاتيح أو عجلة الماوس مع جودة تلقائية ومؤشرات Buffer" : "مرر بين الفيديوهات مع تحميل مسبق وتخزين ذكي وسجل مشاهدة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-toolbar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "quality-select", value: selectedQuality, onChange: (event) => {
          const value = event.target.value;
          setSelectedQuality(value);
          trackReelAnalytics("manual_quality_change", {
            reelId: activeReelItem?.id,
            content: activeReelItem?.content,
            username: activeReelItem?.username,
            thumbnail_url: activeReelItem?.poster_url,
            quality: value
          });
        }, children: QUALITY_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "upload-reel-button", onClick: () => setShowUploadModal(true), children: "⬆ رفع ريل" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reels-stage-shell", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-loading-state", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-loader" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "جارٍ تحميل الريلز..." })
    ] }) : reels.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-status-ribbon", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "الجودة الفعلية: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: QUALITY_OPTIONS.find((item) => item.value === activeQuality)?.label || activeQuality })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "الشبكة: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: deviceProfile.effectiveType })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Buffer events: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: Number(activeInsights?.bufferEvents || 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AutoSizer, { children: ({ height, width }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        FixedSizeList,
        {
          ref: listRef,
          height,
          width,
          itemCount: reels.length,
          itemSize: height,
          overscanCount: deviceProfile.maxVisibleReels || 2,
          onItemsRendered: ({ visibleStartIndex }) => handleScroll({ startIndex: visibleStartIndex }),
          itemData: listData,
          className: "no-scrollbar reel-viewport",
          children: ReelItem
        }
      ) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reels-empty-state", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-icon", children: "🎬" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "مافيش ريلز لسه" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اضغط على زر رفع ريل وأضف أول فيديو بشكل واضح ومباشر." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowUploadModal(true), children: "رفع أول ريل" })
    ] }) }),
    heartBurstId ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "reel-heart-burst", children: "❤️" }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showUploadModal, onClose: closeUploadModal, title: "إضافة ريل جديد", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-layout", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-help", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الخطوة 1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اختر فيديو واضح للريل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الخطوة 2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "بعد اكتمال الرفع سيظهر لك مشغل فيديو للمعاينة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الخطوة 3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اضغط زر نشر الريل" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: uploadState.content,
          onChange: (event) => setUploadState((prev) => ({ ...prev, content: event.target.value })),
          rows: 4,
          placeholder: "اكتب وصف الريل أو الكابشن",
          className: "upload-caption-field"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        VideoUploader,
        {
          label: "رفع فيديو الريل",
          onUploadComplete: ({ url, previewUrl, file, originalFile, thumbnailUrl, payload }) => {
            setUploadState((prev) => ({
              ...prev,
              mediaUrl: url || payload?.mediaUrl || payload?.url || "",
              previewUrl: previewUrl || url || payload?.mediaUrl || "",
              thumbnailUrl: thumbnailUrl || payload?.thumbnailUrl || "",
              fileName: file?.name || originalFile?.name || "",
              processedFile: file || null,
              originalFile: originalFile || null,
              uploading: false
            }));
            pushToast({ type: "success", title: "تم رفع الفيديو", description: "راجع المشغل ثم اضغط نشر الريل." });
          },
          onError: (message) => pushToast({ type: "error", title: "فشل رفع الفيديو", description: message })
        }
      ),
      uploadState.mediaUrl || uploadState.previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "uploaded-preview-shell", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "uploaded-preview-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "معاينة الريل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: uploadState.fileName || "video.mp4" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          UniversalPlayer,
          {
            src: resolveMediaUrl(uploadState.mediaUrl || uploadState.previewUrl),
            poster: uploadState.thumbnailUrl || "",
            variant: "post",
            muted: true,
            className: "uploaded-preview-player"
          }
        )
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: closeUploadModal, children: "إغلاق" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: publishReel, loading: uploadState.publishing, disabled: !uploadState.mediaUrl && !uploadState.processedFile && !uploadState.originalFile || uploadState.publishing, children: "نشر الريل الآن" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showCommentsModal, onClose: () => setShowCommentsModal(false), title: "التعليقات", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "comments-modal-shell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      NestedComments,
      {
        comments: activeComments,
        onAddComment: async (content) => {
          const { data } = await addComment(activeReel.id, content);
          setActiveComments((prev) => [data, ...prev]);
        }
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: reportState.open, onClose: () => setReportState({ open: false, reel: null, reason: "spam", note: "" }), title: "بلاغ على ريل", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-layout", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-help", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
          "@",
          reportState.reel?.username || "user"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: reportState.reel?.content || "حدد سبب البلاغ وسيتم إضافته لقائمة المراجعة." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: reportState.reason, onChange: (event) => setReportState((prev) => ({ ...prev, reason: event.target.value })), children: REPORT_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          rows: 4,
          placeholder: "ملاحظات إضافية",
          value: reportState.note,
          onChange: (event) => setReportState((prev) => ({ ...prev, note: event.target.value }))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upload-modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setReportState({ open: false, reel: null, reason: "spam", note: "" }), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submitReport, children: "إرسال البلاغ" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .reels-page-shell {
            position: relative;
            min-height: calc(100dvh - var(--yam-top-chrome-height, 60px) - var(--yam-bottom-chrome-height, 70px));
            height: calc(100dvh - var(--yam-top-chrome-height, 60px) - var(--yam-bottom-chrome-height, 70px));
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .reels-header-bar {
            position: absolute;
            inset-inline: 0;
            top: 0;
            z-index: 30;
            padding: 18px 18px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0));
          }
          .reels-header-bar h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 900;
          }
          .reels-header-bar p {
            margin: 4px 0 0;
            color: rgba(255,255,255,0.76);
            font-size: 13px;
          }
          .reels-toolbar {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .quality-select,
          .upload-reel-button {
            border: none;
            border-radius: 999px;
            padding: 12px 18px;
            font-weight: 900;
            cursor: pointer;
          }
          .quality-select {
            background: rgba(255,255,255,0.1);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.12);
          }
          .upload-reel-button {
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: #fff;
            box-shadow: 0 18px 36px rgba(59,130,246,0.24);
          }
          .reels-stage-shell {
            flex: 1;
            height: 100%;
          }
          .reels-status-ribbon {
            position: absolute;
            top: 84px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 25;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(2,6,23,0.58);
            border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(16px);
            font-size: 12px;
          }
          .reels-loading-state,
          .reels-empty-state {
            height: 100%;
            display: grid;
            place-items: center;
            text-align: center;
            gap: 12px;
            padding: 24px;
          }
          .reel-loader {
            width: 54px;
            height: 54px;
            border-radius: 999px;
            border: 4px solid rgba(255,255,255,0.16);
            border-top-color: #8b5cf6;
            animation: reelSpin 0.9s linear infinite;
          }
          .reels-empty-state .empty-icon {
            width: 84px;
            height: 84px;
            border-radius: 26px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.06);
            font-size: 34px;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .reel-viewport {
            scroll-snap-type: y mandatory;
            overscroll-behavior-y: contain;
            scroll-behavior: smooth;
          }
          .reel-container { scroll-snap-align: start; scroll-snap-stop: always; }
          .reel-card-shell {
            border-radius: 34px;
            box-shadow: 0 28px 70px rgba(0,0,0,0.34);
            transform: scale(0.986);
            transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease;
          }
          .reel-card-shell.active {
            transform: scale(1);
            box-shadow: 0 34px 86px rgba(0,0,0,0.4);
          }
          .reel-video {
            opacity: 0.94;
            transform: scale(1.02);
            transition: transform 260ms ease, opacity 260ms ease, filter 260ms ease;
            filter: saturate(0.94);
          }
          .reel-video.active {
            opacity: 1;
            transform: scale(1);
            filter: saturate(1);
          }
          .reel-top-overlay {
            background: linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.18), transparent);
          }
          .reel-bottom-overlay {
            background: linear-gradient(180deg, transparent, rgba(0,0,0,0.18), rgba(0,0,0,0.86));
          }
          .reel-actions-stack {
            right: 18px;
            bottom: 28px;
          }
          .reel-swipe-indicator {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 19;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 10px 8px;
            border-radius: 999px;
            background: rgba(9,14,28,0.42);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.82);
            backdrop-filter: blur(14px);
            pointer-events: none;
            box-shadow: 0 12px 30px rgba(0,0,0,0.18);
          }
          .reel-swipe-indicator small {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.02em;
          }
          .reel-progress-rail {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 10px;
            height: 4px;
            border-radius: 999px;
            background: rgba(255,255,255,0.16);
            overflow: hidden;
            z-index: 24;
          }
          .reel-progress-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #8b5cf6, #38bdf8);
            transition: width 120ms linear;
          }
          .reel-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(255,255,255,0.14);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 12px 26px rgba(0,0,0,0.18);
          }
          .reel-chip.ghost {
            background: rgba(15,23,42,0.58);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .reel-meta-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            margin-top: 10px;
          }
          .reel-hint {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.78);
            font-size: 12px;
          }
          .reel-count-pill {
            border-radius: 999px;
            padding: 8px 12px;
            background: rgba(0,0,0,0.42);
            border: 1px solid rgba(255,255,255,0.08);
            font-size: 12px;
            font-weight: 800;
          }
          .reel-buffer-banner {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(255,255,255,0.1);
            font-size: 12px;
            font-weight: 800;
          }
          .reel-action-btn {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(9,14,28,0.54);
            color: #fff;
            font-size: 22px;
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
            box-shadow: 0 16px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06);
            backdrop-filter: blur(16px);
            opacity: 0.96;
          }
          .reel-action-btn:hover {
            transform: translateY(-2px) scale(1.02);
            background: rgba(15,23,42,0.72);
            box-shadow: 0 20px 44px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
          }
          .reel-action-btn.liked {
            background: rgba(239,68,68,0.22);
            color: #fecaca;
          }
          .reel-action-btn.saved {
            background: rgba(245,158,11,0.22);
            color: #fde68a;
          }
          .reel-action-btn.warn {
            background: rgba(249,115,22,0.22);
            color: #fdba74;
          }
          .reel-action-label {
            font-size: 11px;
            color: rgba(255,255,255,0.85);
            font-weight: 700;
          }
          .reel-arrow {
            position: absolute;
            left: 12px;
            width: 48px;
            height: 48px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(9,14,28,0.54);
            color: white;
            font-size: 22px;
            cursor: pointer;
            z-index: 20;
            box-shadow: 0 18px 40px rgba(0,0,0,0.22);
            backdrop-filter: blur(16px);
          }
          .reel-arrow:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }
          .reel-arrow-up { top: 50%; transform: translateY(-72px); }
          .reel-arrow-down { top: 50%; transform: translateY(20px); }
          .reel-heart-burst {
            position: absolute;
            inset: 0;
            z-index: 35;
            display: grid;
            place-items: center;
            font-size: 84px;
            pointer-events: none;
            animation: heartBurst 0.65s ease-out forwards;
          }
          .upload-modal-layout,
          .comments-modal-shell {
            display: grid;
            gap: 14px;
          }
          .upload-modal-help {
            display: grid;
            gap: 6px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(255,255,255,0.06);
            color: #cbd5e1;
          }
          .upload-modal-help strong {
            color: #fff;
          }
          .upload-modal-help p {
            margin: 0;
            font-size: 13px;
          }
          .upload-caption-field {
            width: 100%;
            border-radius: 16px;
            padding: 14px;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(255,255,255,0.08);
            color: #fff;
            resize: vertical;
          }
          .uploaded-preview-shell {
            display: grid;
            gap: 10px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.62);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .uploaded-preview-head {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            color: #fff;
            font-size: 13px;
          }
          .uploaded-preview-player,
          .uploaded-preview-video {
            width: 100%;
            min-height: 320px;
            max-height: 420px;
            border-radius: 14px;
            background: #000;
          }
          .upload-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            flex-wrap: wrap;
          }
          @media (max-width: 768px) {
            .reel-swipe-indicator {
              left: 8px;
              top: auto;
              bottom: 120px;
              transform: none;
            }
          }
          @keyframes reelSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes heartBurst {
            0% { opacity: 0; transform: scale(0.4); }
            45% { opacity: 1; transform: scale(1.08); }
            100% { opacity: 0; transform: scale(1.35); }
          }
          @media (max-width: 1023px) {
            .reels-header-bar {
              padding: 14px 14px 12px;
              align-items: flex-start;
              flex-direction: column;
            }
            .reels-header-bar h1 {
              font-size: 20px;
            }
            .upload-reel-button,
            .quality-select {
              padding: 10px 14px;
              font-size: 14px;
            }
            .reels-status-ribbon {
              top: 112px;
              width: calc(100% - 24px);
            }
          }
        ` })
  ] }) });
}
export {
  ReelsPage as default
};
