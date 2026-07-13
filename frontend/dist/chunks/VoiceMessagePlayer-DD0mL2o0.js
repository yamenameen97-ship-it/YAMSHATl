import { a_ as reactExports, aq as jsxRuntimeExports } from "../index-2I4hYPnI.js";
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
    const showRate = isPlaying || hasPlayed && playbackRate !== 1;
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
              children: loadError ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" }) }) : isPlaying ? /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "5", width: "4", height: "14", rx: "1" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "5", width: "4", height: "14", rx: "1" })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 5v14l11-7z" }) })
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
            showRate ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "yam-voice-pill__rate",
                onClick: cycleRate,
                "aria-label": "تغيير السرعة",
                children: [
                  playbackRate,
                  "×"
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-voice-pill__mic", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-voice-pill__time", children: formatTime(displayTime) })
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
export {
  AudioWaveform as A,
  VoiceMessagePlayer as V
};
