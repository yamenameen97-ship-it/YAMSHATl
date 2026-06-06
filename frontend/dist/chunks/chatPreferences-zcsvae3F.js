import { aK as reactExports, l as MotionConfigContext, ah as jsxRuntimeExports, aZ as useConstant, n as PresenceContext, b3 as usePresence, a_ as useIsomorphicLayoutEffect, L as LayoutGroupContext, b6 as useReducedMotion, ax as motion, b as Avatar } from "../index-BtxTC4_g.js";
import { c as statusTicks, s as statusColor } from "./YamshatDesign-BB_OE-D7.js";
class PopChildMeasure extends reactExports.Component {
  getSnapshotBeforeUpdate(prevProps) {
    const element = this.props.childRef.current;
    if (element && prevProps.isPresent && !this.props.isPresent) {
      const size = this.props.sizeRef.current;
      size.height = element.offsetHeight || 0;
      size.width = element.offsetWidth || 0;
      size.top = element.offsetTop;
      size.left = element.offsetLeft;
    }
    return null;
  }
  /**
   * Required with getSnapshotBeforeUpdate to stop React complaining.
   */
  componentDidUpdate() {
  }
  render() {
    return this.props.children;
  }
}
function PopChild({ children, isPresent }) {
  const id = reactExports.useId();
  const ref = reactExports.useRef(null);
  const size = reactExports.useRef({
    width: 0,
    height: 0,
    top: 0,
    left: 0
  });
  const { nonce } = reactExports.useContext(MotionConfigContext);
  reactExports.useInsertionEffect(() => {
    const { width, height, top, left } = size.current;
    if (isPresent || !ref.current || !width || !height)
      return;
    ref.current.dataset.motionPopId = id;
    const style = document.createElement("style");
    if (nonce)
      style.nonce = nonce;
    document.head.appendChild(style);
    if (style.sheet) {
      style.sheet.insertRule(`
          [data-motion-pop-id="${id}"] {
            position: absolute !important;
            width: ${width}px !important;
            height: ${height}px !important;
            top: ${top}px !important;
            left: ${left}px !important;
          }
        `);
    }
    return () => {
      document.head.removeChild(style);
    };
  }, [isPresent]);
  return jsxRuntimeExports.jsx(PopChildMeasure, { isPresent, childRef: ref, sizeRef: size, children: reactExports.cloneElement(children, { ref }) });
}
const PresenceChild = ({ children, initial, isPresent, onExitComplete, custom, presenceAffectsLayout, mode }) => {
  const presenceChildren = useConstant(newChildrenMap);
  const id = reactExports.useId();
  const memoizedOnExitComplete = reactExports.useCallback((childId) => {
    presenceChildren.set(childId, true);
    for (const isComplete of presenceChildren.values()) {
      if (!isComplete)
        return;
    }
    onExitComplete && onExitComplete();
  }, [presenceChildren, onExitComplete]);
  const context = reactExports.useMemo(
    () => ({
      id,
      initial,
      isPresent,
      custom,
      onExitComplete: memoizedOnExitComplete,
      register: (childId) => {
        presenceChildren.set(childId, false);
        return () => presenceChildren.delete(childId);
      }
    }),
    /**
     * If the presence of a child affects the layout of the components around it,
     * we want to make a new context value to ensure they get re-rendered
     * so they can detect that layout change.
     */
    presenceAffectsLayout ? [Math.random(), memoizedOnExitComplete] : [isPresent, memoizedOnExitComplete]
  );
  reactExports.useMemo(() => {
    presenceChildren.forEach((_, key) => presenceChildren.set(key, false));
  }, [isPresent]);
  reactExports.useEffect(() => {
    !isPresent && !presenceChildren.size && onExitComplete && onExitComplete();
  }, [isPresent]);
  if (mode === "popLayout") {
    children = jsxRuntimeExports.jsx(PopChild, { isPresent, children });
  }
  return jsxRuntimeExports.jsx(PresenceContext.Provider, { value: context, children });
};
function newChildrenMap() {
  return /* @__PURE__ */ new Map();
}
const getChildKey = (child) => child.key || "";
function onlyElements(children) {
  const filtered = [];
  reactExports.Children.forEach(children, (child) => {
    if (reactExports.isValidElement(child))
      filtered.push(child);
  });
  return filtered;
}
const AnimatePresence = ({ children, custom, initial = true, onExitComplete, presenceAffectsLayout = true, mode = "sync", propagate = false }) => {
  const [isParentPresent, safeToRemove] = usePresence(propagate);
  const presentChildren = reactExports.useMemo(() => onlyElements(children), [children]);
  const presentKeys = propagate && !isParentPresent ? [] : presentChildren.map(getChildKey);
  const isInitialRender = reactExports.useRef(true);
  const pendingPresentChildren = reactExports.useRef(presentChildren);
  const exitComplete = useConstant(() => /* @__PURE__ */ new Map());
  const [diffedChildren, setDiffedChildren] = reactExports.useState(presentChildren);
  const [renderedChildren, setRenderedChildren] = reactExports.useState(presentChildren);
  useIsomorphicLayoutEffect(() => {
    isInitialRender.current = false;
    pendingPresentChildren.current = presentChildren;
    for (let i = 0; i < renderedChildren.length; i++) {
      const key = getChildKey(renderedChildren[i]);
      if (!presentKeys.includes(key)) {
        if (exitComplete.get(key) !== true) {
          exitComplete.set(key, false);
        }
      } else {
        exitComplete.delete(key);
      }
    }
  }, [renderedChildren, presentKeys.length, presentKeys.join("-")]);
  const exitingChildren = [];
  if (presentChildren !== diffedChildren) {
    let nextChildren = [...presentChildren];
    for (let i = 0; i < renderedChildren.length; i++) {
      const child = renderedChildren[i];
      const key = getChildKey(child);
      if (!presentKeys.includes(key)) {
        nextChildren.splice(i, 0, child);
        exitingChildren.push(child);
      }
    }
    if (mode === "wait" && exitingChildren.length) {
      nextChildren = exitingChildren;
    }
    setRenderedChildren(onlyElements(nextChildren));
    setDiffedChildren(presentChildren);
    return;
  }
  const { forceRender } = reactExports.useContext(LayoutGroupContext);
  return jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: renderedChildren.map((child) => {
    const key = getChildKey(child);
    const isPresent = propagate && !isParentPresent ? false : presentChildren === renderedChildren || presentKeys.includes(key);
    const onExit = () => {
      if (exitComplete.has(key)) {
        exitComplete.set(key, true);
      } else {
        return;
      }
      let isEveryExitComplete = true;
      exitComplete.forEach((isExitComplete) => {
        if (!isExitComplete)
          isEveryExitComplete = false;
      });
      if (isEveryExitComplete) {
        forceRender === null || forceRender === void 0 ? void 0 : forceRender();
        setRenderedChildren(pendingPresentChildren.current);
        propagate && (safeToRemove === null || safeToRemove === void 0 ? void 0 : safeToRemove());
        onExitComplete && onExitComplete();
      }
    };
    return jsxRuntimeExports.jsx(PresenceChild, { isPresent, initial: !isInitialRender.current || initial ? void 0 : false, custom: isPresent ? void 0 : custom, presenceAffectsLayout, mode, onExitComplete: isPresent ? void 0 : onExit, children: child }, key);
  }) });
};
function hashSeed(seed = "") {
  const source = String(seed || "audio");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function pseudoRandom(seed) {
  let value = hashSeed(seed) || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) % 1e3 / 1e3;
  };
}
function buildWaveform(seed = "", compact = false) {
  const count = compact ? 28 : 40;
  const random = pseudoRandom(seed);
  const raw = [];
  for (let index = 0; index < count; index += 1) {
    const centerDistance = Math.abs(index - (count - 1) / 2) / (count / 2);
    const envelope = 1 - Math.min(0.72, centerDistance * 0.72);
    const oscillation = Math.sin(index / count * Math.PI * 2.8 + random() * 1.4);
    const harmonic = Math.sin(index / count * Math.PI * 6.2 + random() * 2.2) * 0.24;
    const noise = (random() - 0.5) * 0.2;
    const normalized = Math.max(0.18, Math.min(1, 0.46 + oscillation * 0.24 + harmonic + noise));
    raw.push(normalized * envelope);
  }
  return raw.map((value, index) => {
    const left = raw[index - 1] ?? value;
    const right = raw[index + 1] ?? value;
    const smoothed = left * 0.25 + value * 0.5 + right * 0.25;
    return Math.round(24 + smoothed * 72);
  });
}
function AudioWaveform({ seed, compact = false, progress = 0, playing = false }) {
  const bars = reactExports.useMemo(() => buildWaveform(seed, compact), [seed, compact]);
  const normalizedProgress = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `audio-waveform ${compact ? "compact" : ""} ${playing ? "playing" : ""}`,
      "aria-hidden": "true",
      children: bars.map((height, index) => {
        const completion = bars.length > 1 ? index / (bars.length - 1) : 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: completion <= normalizedProgress ? "active" : "",
            style: {
              "--bar-height": `${height}%`,
              "--bar-delay": `${index * 24}ms`
            }
          },
          `${seed || "audio"}-${index}`
        );
      })
    }
  );
}
function formatTime(seconds = 0) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
function VoiceMessagePlayer({
  src,
  seed,
  title = "رسالة صوتية",
  compact = false,
  autoPlay = false,
  bubbleless = false,
  isMe = false
}) {
  const audioRef = reactExports.useRef(null);
  const rafRef = reactExports.useRef(0);
  const [isPlaying, setIsPlaying] = reactExports.useState(false);
  const [duration, setDuration] = reactExports.useState(0);
  const [currentTime, setCurrentTime] = reactExports.useState(0);
  const [playbackRate, setPlaybackRate] = reactExports.useState(1);
  const [hasPlayed, setHasPlayed] = reactExports.useState(false);
  const [loadError, setLoadError] = reactExports.useState(false);
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const speedOptions = reactExports.useMemo(() => [1, 1.5, 2], []);
  const stopProgressLoop = reactExports.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);
  const syncProgress = reactExports.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime || 0);
    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(syncProgress);
    }
  }, []);
  reactExports.useEffect(() => () => stopProgressLoop(), [stopProgressLoop]);
  reactExports.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return void 0;
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      stopProgressLoop();
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };
    const handlePause = () => {
      stopProgressLoop();
      setIsPlaying(false);
      setCurrentTime(audio.currentTime || 0);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setHasPlayed(true);
      stopProgressLoop();
      rafRef.current = requestAnimationFrame(syncProgress);
    };
    const handleError = () => {
      setLoadError(true);
    };
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("error", handleError);
    if (autoPlay) {
      audio.play().catch(() => {
      });
    }
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("error", handleError);
    };
  }, [autoPlay, stopProgressLoop, syncProgress, src]);
  const togglePlayback = reactExports.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => setLoadError(true));
      }
    } else {
      audio.pause();
    }
  }, []);
  const handleSeek = reactExports.useCallback((event) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    let ratio = (event.clientX - rect.left) / rect.width;
    if (isRtl) ratio = 1 - ratio;
    ratio = Math.max(0, Math.min(1, ratio));
    const nextTime = ratio * audio.duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);
  const cycleRate = reactExports.useCallback(() => {
    const audio = audioRef.current;
    const currentIdx = speedOptions.indexOf(playbackRate);
    const nextRate = speedOptions[(currentIdx + 1) % speedOptions.length] || 1;
    setPlaybackRate(nextRate);
    if (audio) audio.playbackRate = nextRate;
  }, [playbackRate, speedOptions]);
  if (bubbleless) {
    const displayTime = isPlaying || hasPlayed ? currentTime : duration;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `yam-voice-pill ${isMe ? "me" : "them"} ${isPlaying ? "playing" : ""}`,
        dir: "ltr",
        role: "group",
        "aria-label": title,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { ref: audioRef, src, preload: "metadata", playsInline: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-voice-pill__play",
              onClick: togglePlayback,
              "aria-label": isPlaying ? "إيقاف" : "تشغيل",
              disabled: loadError && !src,
              children: loadError ? "!" : isPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "5", width: "4", height: "14", rx: "1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "5", width: "4", height: "14", rx: "1" })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 5v14l11-7z" }) })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-voice-pill__wave",
              onClick: handleSeek,
              "aria-label": "موضع التشغيل",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(AudioWaveform, { seed: seed || src, compact: true, progress, playing: isPlaying })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-voice-pill__meta", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-voice-pill__time", children: formatTime(displayTime) }),
            (isPlaying || hasPlayed) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "yam-voice-pill__rate",
                onClick: cycleRate,
                "aria-label": "تغيير السرعة",
                children: [
                  "×",
                  playbackRate
                ]
              }
            )
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-voice-card ${compact ? "compact" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { ref: audioRef, src, preload: "metadata", playsInline: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-voice-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `yam-voice-play ${isPlaying ? "playing" : ""}`,
          onClick: togglePlayback,
          "aria-label": isPlaying ? "إيقاف الرسالة الصوتية" : "تشغيل الرسالة الصوتية",
          children: isPlaying ? "❚❚" : "▶"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-voice-copy", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          formatTime(currentTime),
          " / ",
          formatTime(duration)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-voice-rates", children: speedOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: `yam-speed-pill ${playbackRate === option ? "active" : ""}`,
          onClick: () => {
            const audio = audioRef.current;
            setPlaybackRate(option);
            if (audio) audio.playbackRate = option;
          },
          children: [
            "×",
            option
          ]
        },
        option
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-voice-seek", onClick: handleSeek, "aria-label": "التنقل داخل الرسالة الصوتية", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AudioWaveform, { seed: seed || src, compact, progress, playing: isPlaying }) })
  ] });
}
const QUICK_REACTIONS = ["❤️", "🔥", "😂", "👏", "👍", "😮"];
function formatMessageTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
function extractFileName(message) {
  if (message?.attachment_name) return message.attachment_name;
  if (Array.isArray(message?.attachments) && message.attachments[0]?.fileName) return message.attachments[0].fileName;
  const mediaUrl = message?.media_url || "";
  if (!mediaUrl) return "ملف مرفق";
  try {
    const clean = mediaUrl.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "ملف مرفق");
  } catch {
    return "ملف مرفق";
  }
}
function messageMatchesSearch(message, query) {
  const lowered = String(query || "").trim().toLowerCase();
  if (!lowered) return true;
  return [
    message?.content,
    message?.message,
    message?.sender,
    extractFileName(message)
  ].some((value) => String(value || "").toLowerCase().includes(lowered));
}
function areGrouped(firstMessage, secondMessage) {
  if (!firstMessage || !secondMessage) return false;
  if (firstMessage.sender !== secondMessage.sender) return false;
  const firstStamp = new Date(firstMessage.created_at || 0).getTime();
  const secondStamp = new Date(secondMessage.created_at || 0).getTime();
  return Math.abs(secondStamp - firstStamp) <= 5 * 60 * 1e3;
}
function MessageBubble({
  message,
  isMe,
  prevMessage,
  nextMessage,
  highlightQuery = "",
  reactionState,
  onReply,
  onDelete,
  onReact,
  onJumpToReply,
  registerMessageNode,
  onOpenMedia
}) {
  const [showToolbar, setShowToolbar] = reactExports.useState(false);
  const reduceMotion = useReducedMotion();
  const hasMedia = Boolean(message?.media_url);
  const isVoice = message?.type === "voice";
  const isImage = message?.type === "image" || hasMedia && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(message?.media_url || "");
  const isVideo = message?.type === "video" || hasMedia && /\.(mp4|webm|mov|m4v)$/i.test(message?.media_url || "");
  const isFile = message?.type === "file" || hasMedia && !isVoice && !isImage && !isVideo;
  const content = message?.content || message?.message || "";
  const fileName = extractFileName(message);
  const shouldGlow = highlightQuery.trim() && messageMatchesSearch(message, highlightQuery);
  const groupedWithPrev = areGrouped(prevMessage, message);
  const groupedWithNext = areGrouped(message, nextMessage);
  const showAvatar = !isMe && !groupedWithNext;
  const replyTarget = message?.reply_to || message?.replyTo || null;
  const topReactions = reactExports.useMemo(() => Object.entries(reactionState?.counts || {}).filter(([, count]) => Number(count || 0) > 0).sort((left, right) => Number(right[1]) - Number(left[1])).slice(0, 3), [reactionState]);
  const rowMotion = reduceMotion ? { initial: false, animate: { opacity: 1 } } : {
    initial: { opacity: 0, x: isMe ? 20 : -20, y: 14, scale: 0.985 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
  };
  const popMotion = reduceMotion ? { initial: false, animate: { opacity: 1, scale: 1 } } : {
    initial: { opacity: 0, scale: 0.9, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.92, y: 6 },
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
  };
  const messageId = message?.id || message?.client_id;
  const openCurrentMedia = () => {
    if (!message?.media_url) return;
    onOpenMedia?.(message);
  };
  const isVoiceOnly = isVoice && !content && !replyTarget && !message?.deleted;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      ref: (node) => registerMessageNode?.(String(messageId), node),
      className: `yam-message-row ${isMe ? "me" : "them"} ${groupedWithPrev ? "grouped-prev" : ""} ${groupedWithNext ? "grouped-next" : ""} ${isVoiceOnly ? "voice-only" : ""}`,
      "data-msg-id": messageId,
      layout: !reduceMotion,
      onMouseEnter: () => setShowToolbar(true),
      onMouseLeave: () => setShowToolbar(false),
      ...rowMotion,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-message-avatar ${showAvatar ? "visible" : ""}`, children: showAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Avatar,
          {
            name: message?.sender || "مستخدم",
            src: message?.sender_avatar,
            size: "sm",
            showStatus: true,
            status: "online"
          }
        ) : null }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-message-stack", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              className: `yam-bubble ${isMe ? "bubble-me" : "bubble-them"} ${shouldGlow ? "search-hit" : ""} ${showToolbar ? "toolbar-open" : ""} ${isVoiceOnly ? "is-voice-only" : ""}`,
              layout: !reduceMotion,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "yam-bubble-more",
                    "aria-label": "خيارات الرسالة",
                    onClick: () => setShowToolbar((current) => !current),
                    children: "⋯"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: showToolbar ? /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "yam-bubble-toolbar", ...popMotion, children: [
                  QUICK_REACTIONS.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        onReact?.(message, emoji);
                        setShowToolbar(false);
                      },
                      title: `إضافة ${emoji}`,
                      children: emoji
                    },
                    emoji
                  )),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
                    onReply?.(message);
                    setShowToolbar(false);
                  }, children: "↩" }),
                  isMe && !message?.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
                    onDelete?.(messageId, false);
                    setShowToolbar(false);
                  }, children: "🗑" }) : null,
                  isMe && !message?.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
                    onDelete?.(messageId, true);
                    setShowToolbar(false);
                  }, children: "🧹" }) : null
                ] }) : null }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: replyTarget ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  motion.button,
                  {
                    type: "button",
                    className: "yam-reply-preview",
                    onClick: () => onJumpToReply?.(replyTarget?.id),
                    layout: !reduceMotion,
                    ...popMotion,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "↩ الرد على" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: replyTarget?.content || replyTarget?.message || "..." })
                    ]
                  }
                ) : null }),
                isImage && message?.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-media-button", onClick: openCurrentMedia, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: message.media_url, alt: fileName, className: "yam-bubble-media", loading: "lazy", decoding: "async" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-bubble-media-overlay", children: "تكبير" })
                ] }) : null,
                isVideo && message?.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-media-button yam-video-preview-shell", onClick: openCurrentMedia, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: message.media_url, muted: true, playsInline: true, className: "yam-bubble-media", preload: "metadata" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-bubble-media-overlay", children: "تشغيل كامل" })
                ] }) : null,
                isVoice && message?.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  VoiceMessagePlayer,
                  {
                    src: message.media_url,
                    seed: message?.waveform_seed || message?.created_at || messageId,
                    title: "رسالة صوتية",
                    bubbleless: true,
                    isMe
                  }
                ) : null,
                isFile && message?.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: message.media_url, target: "_blank", rel: "noreferrer", className: "yam-file-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-file-icon", children: "📄" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-file-copy", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fileName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: (message?.attachments?.[0]?.mediaType || message?.type || "FILE").toUpperCase() })
                  ] })
                ] }) : null,
                content && !message?.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bubble-text", children: content }) : null,
                message?.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bubble-deleted", children: "تم حذف الرسالة" }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-meta", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bubble-time", children: formatMessageTime(message?.created_at) }),
                  isMe ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "bubble-status",
                      "data-status": message?.status || "sent",
                      "data-ds-status-color": statusColor(message?.status),
                      children: statusTicks(message?.status)
                    }
                  ) : null
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: topReactions.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { className: `yam-reaction-summary ${isMe ? "me" : "them"}`, layout: !reduceMotion, ...popMotion, children: topReactions.map(([emoji, count]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.button,
            {
              type: "button",
              layout: !reduceMotion,
              className: `yam-reaction-chip ${reactionState?.myReaction === emoji ? "active" : ""}`,
              onClick: () => onReact?.(message, emoji),
              whileTap: reduceMotion ? void 0 : { scale: 0.94 },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: emoji }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: count })
              ]
            },
            emoji
          )) }) : null })
        ] })
      ]
    }
  );
}
const ChatBubble = reactExports.memo(MessageBubble);
const STORAGE_KEY = "yamshat-chat-preferences";
function readRaw() {
  if (typeof window === "undefined") return { muted: [], archived: [], pinned: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      muted: Array.isArray(parsed.muted) ? parsed.muted : [],
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : []
    };
  } catch {
    return { muted: [], archived: [], pinned: [] };
  }
}
function writeRaw(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function getChatPreferences() {
  const raw = readRaw();
  return {
    muted: new Set(raw.muted),
    archived: new Set(raw.archived),
    pinned: new Set(raw.pinned)
  };
}
function toggleChatPreference(type, username) {
  const raw = readRaw();
  const next = new Set(raw[type] || []);
  if (next.has(username)) next.delete(username);
  else next.add(username);
  raw[type] = [...next];
  writeRaw(raw);
  return new Set(raw[type]);
}
export {
  AudioWaveform as A,
  ChatBubble as C,
  VoiceMessagePlayer as V,
  getChatPreferences as g,
  toggleChatPreference as t
};
