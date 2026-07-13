import { a_ as reactExports, b9 as resolveMediaUrl, aq as jsxRuntimeExports, aJ as motion } from "../index-2I4hYPnI.js";
import { viewStory, reactToStory, replyToStory, deleteStory, downloadStoryMedia, toggleStoryHighlight, getStoryViewers, voteStoryPoll, unmuteUserStories, muteUserStories, getStoryMusicCatalog, uploadStory } from "./stories-8iU6bq4Q.js";
import { R as ReportModal } from "./ReportModal-Z-Qi2U52.js";
import { A as AnimatePresence } from "./index-CoUPGeqi.js";
import { U as UserPickerModal } from "./UserPickerModal-3WVfz9fU.js";
function getCountdownData(value, now = Date.now()) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return { expired: true, label: "انتهى العد التنازلي", shortLabel: "انتهى", target };
  const totalSeconds = Math.floor(diff / 1e3);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  const shortParts = [];
  if (days > 0) shortParts.push(`${days}ي`);
  if (hours > 0 || days > 0) shortParts.push(`${hours}س`);
  shortParts.push(`${minutes}د`);
  if (days === 0) shortParts.push(`${String(seconds).padStart(2, "0")}ث`);
  return { expired: false, label: shortParts.join(" "), shortLabel: shortParts.join(" "), target };
}
function extractDecorations(story) {
  const stickers = Array.isArray(story?.stickers) ? story.stickers : [];
  const locationText = stickers.find((s) => String(s).startsWith("location::"))?.replace("location::", "") || "";
  const questionText = stickers.find((s) => String(s).startsWith("question::"))?.replace("question::", "") || "";
  const emojiStickers = stickers.filter((s) => !String(s).includes("::"));
  return {
    locationText,
    questionText,
    emojiStickers,
    mentions: Array.isArray(story?.mentions) ? story.mentions : []
  };
}
function StoryViewerEnhanced({
  group,
  allGroups = [],
  currentIndex = 0,
  onClose,
  onNextGroup,
  onPrevGroup,
  currentUserId
}) {
  const stories = reactExports.useMemo(() => group?.stories || [], [group]);
  const [storyIdx, setStoryIdx] = reactExports.useState(0);
  const [progress, setProgress] = reactExports.useState(0);
  const [paused, setPaused] = reactExports.useState(false);
  const [replyText, setReplyText] = reactExports.useState("");
  const [showReactions, setShowReactions] = reactExports.useState(false);
  const [imgError, setImgError] = reactExports.useState(false);
  const [muted, setMuted] = reactExports.useState(false);
  const [musicMuted, setMusicMuted] = reactExports.useState(false);
  const [showViewers, setShowViewers] = reactExports.useState(false);
  const [viewers, setViewers] = reactExports.useState([]);
  const [viewerReactions, setViewerReactions] = reactExports.useState([]);
  const [viewerReplies, setViewerReplies] = reactExports.useState([]);
  const [loadingViewers, setLoadingViewers] = reactExports.useState(false);
  const [pollMyVote, setPollMyVote] = reactExports.useState(null);
  const [pollVotes, setPollVotes] = reactExports.useState({});
  const [countdownNow, setCountdownNow] = reactExports.useState(Date.now());
  const [toast, setToast] = reactExports.useState("");
  const [isStoryMuted, setIsStoryMuted] = reactExports.useState(false);
  const [showReport, setShowReport] = reactExports.useState(false);
  const timerRef = reactExports.useRef(null);
  const longPressRef = reactExports.useRef(null);
  const startYRef = reactExports.useRef(0);
  const videoElRef = reactExports.useRef(null);
  const toastTimerRef = reactExports.useRef(null);
  const musicAudioRef = reactExports.useRef(null);
  const isMountedRef = reactExports.useRef(true);
  const rawCurrent = stories[storyIdx];
  const current = reactExports.useMemo(() => {
    if (!rawCurrent) return rawCurrent;
    const fixedMedia = resolveMediaUrl(rawCurrent.media_url || rawCurrent.media || "");
    return {
      ...rawCurrent,
      media_url: fixedMedia || rawCurrent.media_url || "",
      media: fixedMedia || rawCurrent.media || "",
      user_avatar: resolveMediaUrl(rawCurrent.user_avatar || rawCurrent.avatar_url || ""),
      avatar_url: resolveMediaUrl(rawCurrent.avatar_url || rawCurrent.user_avatar || "")
    };
  }, [rawCurrent]);
  const STORY_MS = current?.media_type === "video" ? 15e3 : 5e3;
  const STEP_MS = 50;
  const decoration = reactExports.useMemo(() => extractDecorations(current), [current]);
  const isOwner = group?.is_self || currentUserId && current?.user_id === currentUserId;
  const hasPoll = current?.poll_question && Array.isArray(current?.poll_options) && current.poll_options.length >= 2;
  const totalPollVotes = Object.values(pollVotes || {}).reduce((s, n) => s + (n || 0), 0);
  const countdownData = getCountdownData(current?.countdown_at, countdownNow);
  const showToast = reactExports.useCallback((message, duration = 2500, onAfter) => {
    if (!isMountedRef.current) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setToast("");
      toastTimerRef.current = null;
      if (typeof onAfter === "function") onAfter();
    }, duration);
  }, []);
  reactExports.useEffect(() => () => {
    isMountedRef.current = false;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
  }, []);
  reactExports.useEffect(() => {
    setStoryIdx(0);
    setProgress(0);
    setImgError(false);
    setShowViewers(false);
    setReplyText("");
    setShowReactions(false);
    setPaused(false);
  }, [group?.user_id]);
  reactExports.useEffect(() => {
    if (current) {
      setPollMyVote(current.my_vote ?? null);
      setPollVotes(current.poll_votes || {});
      setIsStoryMuted(!!current.is_muted_by_viewer);
    }
  }, [current?.id]);
  reactExports.useEffect(() => {
    if (!current?.countdown_at) return void 0;
    setCountdownNow(Date.now());
    const timer = setInterval(() => setCountdownNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, [current?.id, current?.countdown_at]);
  reactExports.useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
    if (current?.music_url && !musicMuted) {
      const audio = new Audio(current.music_url);
      audio.volume = 0.35;
      audio.loop = true;
      audio.play().catch(() => {
      });
      musicAudioRef.current = audio;
    }
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
    };
  }, [current?.id, current?.music_url, musicMuted]);
  reactExports.useEffect(() => {
    const v = videoElRef.current;
    if (!v) return;
    v.muted = muted;
    if (paused) {
      if (!v.paused) v.pause();
    } else if (v.paused) {
      v.play?.().catch(() => {
      });
    }
  }, [paused, muted, current?.id]);
  reactExports.useEffect(() => {
    if (!current) return;
    if (paused) {
      clearInterval(timerRef.current);
      return void 0;
    }
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + STEP_MS / STORY_MS * 100;
        if (next >= 100) {
          clearInterval(timerRef.current);
          requestAnimationFrame(handleNextStory);
          return 0;
        }
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(timerRef.current);
  }, [storyIdx, paused, current?.id]);
  reactExports.useEffect(() => {
    if (current?.id) viewStory(current.id).catch(() => {
    });
  }, [current?.id]);
  const handleNextStory = reactExports.useCallback(() => {
    setImgError(false);
    if (storyIdx < stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (typeof onNextGroup === "function") onNextGroup();
    else if (typeof onClose === "function") onClose();
  }, [storyIdx, stories.length, onNextGroup, onClose]);
  const handlePrevStory = reactExports.useCallback(() => {
    setImgError(false);
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (typeof onPrevGroup === "function") onPrevGroup();
  }, [storyIdx, onPrevGroup]);
  reactExports.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "ArrowRight") {
        handlePrevStory();
        return;
      }
      if (e.key === "ArrowLeft") {
        handleNextStory();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNextStory, handlePrevStory, onClose]);
  const handleReact = async (emoji) => {
    if (!current?.id) return;
    try {
      await reactToStory(current.id, emoji);
    } catch {
    }
    if (!isMountedRef.current) return;
    setShowReactions(false);
    showToast(`تم التفاعل ${emoji}`);
  };
  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !current?.id) return;
    setReplyText("");
    try {
      await replyToStory(current.id, text);
      showToast("تم إرسال الرد");
    } catch {
      showToast("تعذّر إرسال الرد");
    }
  };
  const handleDelete = async () => {
    if (!current?.id) return;
    if (!window.confirm("حذف هذه القصة؟")) return;
    try {
      await deleteStory(current.id);
      if (!isMountedRef.current) return;
      handleNextStory();
    } catch {
      if (!isMountedRef.current) return;
      showToast("تعذّر الحذف");
    }
  };
  const handleDownload = async () => {
    if (!current?.media_url) return;
    setPaused(true);
    const ok = await downloadStoryMedia(current.media_url, `story-${current.username || "user"}-${current.id}`);
    showToast(ok ? "تم الحفظ ✓" : "تعذّر التنزيل", 2500, () => {
      if (isMountedRef.current) setPaused(false);
    });
  };
  const handleHighlight = async () => {
    if (!current?.id) return;
    const title = window.prompt("عنوان اللحظة المميزة (اختياري):", current.highlight_title || "");
    if (title === null) return;
    try {
      await toggleStoryHighlight(current.id, title || "");
      if (!isMountedRef.current) return;
      showToast(current.highlight ? "تمت إزالة الإبراز ✓" : "تمت الإضافة للإبراز ✓");
    } catch {
      if (!isMountedRef.current) return;
      showToast("تعذّر التحديث");
    }
  };
  const handleShowViewers = async () => {
    if (!current?.id) return;
    setShowViewers(true);
    setPaused(true);
    setLoadingViewers(true);
    try {
      const res = await getStoryViewers(current.id);
      if (!isMountedRef.current) return;
      setViewers(res?.data?.viewers || []);
      setViewerReactions(res?.data?.reactions || []);
      setViewerReplies(res?.data?.replies || []);
    } catch {
      if (!isMountedRef.current) return;
      setViewers([]);
      setViewerReactions([]);
      setViewerReplies([]);
    } finally {
      if (isMountedRef.current) setLoadingViewers(false);
    }
  };
  const handleCloseViewers = () => {
    setShowViewers(false);
    setPaused(false);
  };
  const handleVotePoll = async (optionIndex) => {
    if (!current?.id || pollMyVote === optionIndex) return;
    setPollVotes((prev) => {
      const next = { ...prev };
      if (pollMyVote !== null && pollMyVote !== void 0) {
        const prevKey = String(pollMyVote);
        next[prevKey] = Math.max(0, (next[prevKey] || 0) - 1);
      }
      const newKey = String(optionIndex);
      next[newKey] = (next[newKey] || 0) + 1;
      return next;
    });
    setPollMyVote(optionIndex);
    try {
      const res = await voteStoryPoll(current.id, optionIndex);
      if (!isMountedRef.current) return;
      setPollVotes(res?.data?.poll_votes || {});
    } catch {
      if (!isMountedRef.current) return;
      showToast("تعذّر التصويت");
    }
  };
  const handleMuteUserStories = async () => {
    if (!group?.username) return;
    try {
      if (isStoryMuted) {
        await unmuteUserStories(group.username);
        if (!isMountedRef.current) return;
        setIsStoryMuted(false);
        showToast("تم إلغاء كتم القصص ✓");
      } else {
        await muteUserStories(group.username);
        if (!isMountedRef.current) return;
        setIsStoryMuted(true);
        showToast("تم كتم قصص هذا المستخدم ✓");
      }
    } catch {
      if (!isMountedRef.current) return;
      showToast("تعذّر التحديث");
    }
  };
  const handlePressStart = () => {
    longPressRef.current = setTimeout(() => setPaused(true), 180);
  };
  const handlePressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setPaused(false);
  };
  if (!current) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      dir: "rtl",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "عارض الستوري",
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "yam-story-viewer",
      onTouchStart: (e) => {
        startYRef.current = e.touches[0].clientY;
      },
      onTouchEnd: (e) => {
        if (e.changedTouches[0].clientY - startYRef.current > 80) onClose?.();
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-stage", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-progress-row", children: stories.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-progress-track", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-progress-fill", style: { width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" } }) }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-header", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "yam-story-avatar-sm", src: group?.user_avatar || group?.avatar_url || current?.user_avatar || current?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(group?.username || "user")}&background=8b5cf6&color=fff`, alt: "", onError: (e) => {
              const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(group?.username || "user")}&background=8b5cf6&color=fff`;
              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-meta", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: group?.username || "مستخدم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-time", children: formatTime(current?.created_at) })
            ] }),
            current?.privacy === "close_friends" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-badge yam-cf", children: "💚" }),
            current.media_type === "video" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: () => setMuted((m) => !m), children: muted ? "🔇" : "🔊" }),
            current?.music_url && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: () => setMusicMuted((m) => !m), children: musicMuted ? "🎵" : "🎶" }),
            !isOwner && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: handleMuteUserStories, children: isStoryMuted ? "🔕" : "🔕" }),
            isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: handleHighlight, children: current.highlight ? "⭐" : "☆" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: handleDelete, children: "🗑️" })
            ] }),
            !isOwner && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: () => {
              setPaused(true);
              setShowReport(true);
            }, children: "🚩" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: handleDownload, children: "⬇" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-icon-btn", onClick: onClose, children: "✕" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-media-wrap", onMouseDown: handlePressStart, onMouseUp: handlePressEnd, onMouseLeave: handlePressEnd, onTouchStart: handlePressStart, onTouchEnd: handlePressEnd, children: [
            current.media_type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { ref: videoElRef, src: current.media_url, autoPlay: true, playsInline: true, muted, onEnded: handleNextStory, onError: () => setImgError(true), className: "yam-story-media" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: current.media_url, alt: current.caption || "", className: "yam-story-media", onError: () => setImgError(true) }),
            imgError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-error", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تعذّر تحميل الوسائط." }) }),
            decoration.locationText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-location", children: [
              "📍 ",
              decoration.locationText
            ] }),
            decoration.mentions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-mentions", children: decoration.mentions.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "@",
              m
            ] }, m)) }),
            decoration.questionText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-question", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "❓ سؤال" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: decoration.questionText })
            ] }),
            decoration.emojiStickers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-emoji-strip", children: decoration.emojiStickers.join(" ") }),
            countdownData && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-story-countdown ${countdownData.expired ? "expired" : ""}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-countdown-title", children: "⏳ العد التنازلي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-countdown-value", children: countdownData.shortLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-countdown-meta", children: [
                "ينتهي ",
                new Date(current.countdown_at).toLocaleString("ar-EG")
              ] })
            ] }),
            hasPoll && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-poll", onClick: (e) => e.stopPropagation(), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-poll-question", children: current.poll_question }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-poll-options", children: current.poll_options.map((opt, idx) => {
                const count = pollVotes[String(idx)] || 0;
                const pct = totalPollVotes > 0 ? Math.round(count / totalPollVotes * 100) : 0;
                const mine = pollMyVote === idx;
                const showResults = pollMyVote !== null && pollMyVote !== void 0;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `yam-poll-option ${mine ? "mine" : ""} ${showResults ? "voted" : ""}`, onClick: () => handleVotePoll(idx), disabled: isOwner, children: [
                  showResults && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-poll-bar", style: { width: `${pct}%` }, "aria-hidden": true }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-poll-text", children: [
                    opt,
                    " ",
                    mine && "✓"
                  ] }),
                  showResults && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-poll-pct", children: [
                    pct,
                    "%"
                  ] })
                ] }, idx);
              }) }),
              totalPollVotes > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-poll-total", children: [
                totalPollVotes,
                " مصوت"
              ] })
            ] }),
            current.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-story-caption", children: current.caption }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "السابقة", className: "yam-story-tap yam-tap-prev", onClick: handlePrevStory }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "التالية", className: "yam-story-tap yam-tap-next", onClick: handleNextStory })
          ] }),
          !isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-footer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", dir: "rtl", value: replyText, onChange: (e) => setReplyText(e.target.value), onFocus: () => setPaused(true), onBlur: () => setPaused(false), onKeyDown: (e) => {
              if (e.key === "Enter") handleSendReply();
            }, placeholder: `الرد على ${group?.username || ""}…`, className: "yam-story-reply", "aria-label": "رد على القصة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-react-btn", onClick: () => setShowReactions((s) => !s), children: "😍" }),
            replyText.trim() && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-story-send-btn", onClick: handleSendReply, children: "➤" }),
            showReactions && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-reactions-bar", children: ["❤️", "🔥", "😂", "😮", "😢", "👏", "💯"].map((emo) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => handleReact(emo), children: emo }, emo)) })
          ] }),
          isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-story-owner-info clickable", onClick: handleShowViewers, children: [
            "👁 ",
            current.views_count || 0,
            " مشاهدة",
            current.reactions_count ? ` • 💖 ${current.reactions_count}` : "",
            current.replies_count ? ` • 💬 ${current.replies_count}` : "",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-chevron", children: "›" })
          ] }),
          toast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-viewer-toast", children: toast }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showViewers && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "yam-viewers-sheet", initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: { type: "spring", damping: 28, stiffness: 280 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-viewers-handle" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewers-header", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "إحصاءات القصة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleCloseViewers, children: "✕" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewers-list", children: [
              loadingViewers && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-viewers-empty", children: "جاري التحميل…" }),
              !loadingViewers && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-sheet-section", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-sheet-title", children: [
                    "👁 المشاهدون (",
                    viewers.length,
                    ")"
                  ] }),
                  viewers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-viewers-empty", children: "لم يشاهد القصة أحد بعد" }) : viewers.map((v, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewer-row", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: v.avatar_url, alt: "", className: "yam-viewer-avatar", loading: "lazy" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewer-info", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: v.username }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(v.viewed_at) })
                    ] })
                  ] }, `${v.username}-${i}`))
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-sheet-section", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-sheet-title", children: [
                    "💖 التفاعلات (",
                    viewerReactions.length || current.reactions_count || 0,
                    ")"
                  ] }),
                  viewerReactions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-viewers-empty", children: "لا توجد قائمة تفاعلات مفصلة بعد." }) : viewerReactions.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewer-row reaction", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: r.avatar_url, alt: "", className: "yam-viewer-avatar", loading: "lazy" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewer-info", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: r.username }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(r.created_at) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-reaction-emoji", children: r.emoji })
                  ] }, `${r.username}-${i}`))
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-sheet-section", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-sheet-title", children: [
                    "💬 الردود (",
                    viewerReplies.length || current.replies_count || 0,
                    ")"
                  ] }),
                  viewerReplies.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-viewers-empty", children: "لا توجد ردود بعد." }) : viewerReplies.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewer-row reply", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: r.avatar_url, alt: "", className: "yam-viewer-avatar", loading: "lazy" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-viewer-info", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: r.username }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: r.text }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(r.created_at) })
                    ] })
                  ] }, `${r.username}-${i}`))
                ] })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: viewerStyles }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ReportModal, { open: showReport, onClose: () => {
          setShowReport(false);
          setPaused(false);
        }, targetType: "story", targetId: current?.id, targetLabel: `قصة @${group?.username || ""}` })
      ]
    }
  );
}
function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 6e4);
    if (mins < 1) return "الآن";
    if (mins < 60) return `قبل ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `قبل ${hrs} س`;
    return d.toLocaleDateString("ar");
  } catch {
    return "";
  }
}
const viewerStyles = `
.yam-story-viewer { font-family:'Noto Sans Arabic','Tajawal',system-ui,sans-serif; position:fixed; inset:0; background:rgba(0,0,0,.96); z-index:2000; display:flex; align-items:center; justify-content:center; padding:0; }
.yam-story-stage { position:relative; width:100%; height:100%; max-width:100vw; background:#000; display:flex; flex-direction:column; overflow:hidden; }
@media (min-width: 900px) { .yam-story-viewer { padding:20px; } .yam-story-stage { max-width:420px; max-height:92vh; aspect-ratio:9/16; border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,.7); } }
.yam-progress-row { display:flex; gap:4px; padding:10px 12px 0; z-index:3; }
.yam-progress-track { flex:1; height:2.5px; background:rgba(255,255,255,.28); border-radius:2px; overflow:hidden; }
.yam-progress-fill { height:100%; background:#fff; transition:width 50ms linear; }
.yam-story-header { display:flex; align-items:center; gap:10px; padding:10px 14px; color:#fff; z-index:3; }
.yam-story-avatar-sm { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,.85); }
.yam-story-meta { display:flex; flex-direction:column; line-height:1.15; }
.yam-story-meta strong { font-size:14px; font-weight:700; }
.yam-story-time { font-size:11px; opacity:.75; }
.yam-story-badge { margin-inline-start:auto; font-size:18px; padding:2px 8px; background:rgba(34,197,94,.18); border-radius:10px; }
.yam-story-icon-btn { background:rgba(255,255,255,.08); border:none; color:#fff; font-size:16px; width:34px; height:34px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; margin-inline-start:4px; }
.yam-story-header > .yam-story-icon-btn:last-child { margin-inline-start:auto; }
.yam-story-media-wrap { position:relative; flex:1; display:flex; align-items:center; justify-content:center; background:#000; overflow:hidden; user-select:none; touch-action:pan-y; }
.yam-story-media { width:100%; height:100%; object-fit:contain; }
.yam-story-error { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; background:rgba(0,0,0,.6); font-size:14px; }
.yam-story-location, .yam-story-mentions, .yam-story-question, .yam-story-countdown { position:absolute; left:50%; transform:translateX(-50%); z-index:3; color:#fff; }
.yam-story-location { top:84px; background:rgba(17,24,39,.76); border:1px solid rgba(255,255,255,.12); padding:10px 14px; border-radius:999px; font-size:13px; font-weight:800; }
.yam-story-mentions { top:132px; display:flex; gap:8px; flex-wrap:wrap; max-width:calc(100% - 32px); justify-content:center; }
.yam-story-mentions span { background:rgba(17,24,39,.7); border:1px solid rgba(255,255,255,.08); padding:7px 10px; border-radius:999px; font-size:12px; }
.yam-story-question { top:174px; width:min(340px,calc(100% - 32px)); background:rgba(15,15,20,.82); border:1px solid rgba(255,255,255,.1); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:8px; text-align:center; }
.yam-story-question strong { font-size:14px; }
.yam-story-emoji-strip { position:absolute; bottom:148px; left:50%; transform:translateX(-50%); font-size:30px; text-shadow:0 4px 14px rgba(0,0,0,.45); z-index:3; }
.yam-story-caption { position:absolute; bottom:14px; inset-inline-start:16px; inset-inline-end:16px; color:#fff; background:rgba(0,0,0,.45); backdrop-filter:blur(8px); padding:8px 12px; border-radius:12px; font-size:14px; line-height:1.5; text-align:start; }
.yam-story-tap { position:absolute; top:0; bottom:0; width:30%; background:transparent; border:none; cursor:pointer; z-index:2; }
.yam-tap-prev { inset-inline-start:0; } .yam-tap-next { inset-inline-end:0; }
.yam-story-footer { display:flex; align-items:center; gap:8px; padding:10px 14px 14px; position:relative; z-index:3; }
.yam-story-reply { flex:1; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); color:#fff; border-radius:22px; padding:11px 16px; font-size:14px; outline:none; font-family:inherit; }
.yam-story-react-btn,.yam-story-send-btn { background:rgba(255,255,255,.1); border:none; color:#fff; width:42px; height:42px; border-radius:50%; font-size:20px; cursor:pointer; }
.yam-story-send-btn { background:#8b5cf6; transform:scaleX(-1); }
.yam-reactions-bar { position:absolute; bottom:64px; inset-inline-end:14px; background:rgba(20,20,28,.95); border:1px solid rgba(255,255,255,.1); border-radius:28px; padding:8px 12px; display:flex; gap:6px; box-shadow:0 10px 30px rgba(0,0,0,.5); }
.yam-reactions-bar button { background:transparent; border:none; font-size:24px; cursor:pointer; padding:4px; }
.yam-story-owner-info { padding:12px 16px; color:#fff; font-size:13px; opacity:.85; text-align:center; border-top:1px solid rgba(255,255,255,.08); background:transparent; border-left:0; border-right:0; border-bottom:0; font-family:inherit; width:100%; }
.yam-story-owner-info.clickable { cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; }
.yam-story-chevron { font-size:18px; opacity:.7; }
.yam-story-countdown { top:auto; bottom:84px; min-width:180px; max-width:calc(100% - 40px); padding:12px 16px; border-radius:18px; background:rgba(17,24,39,.76); border:1px solid rgba(255,255,255,.12); box-shadow:0 16px 36px rgba(0,0,0,.26); backdrop-filter:blur(14px); text-align:center; }
.yam-story-countdown.expired { background:rgba(127,29,29,.78); border-color:rgba(248,113,113,.38); }
.yam-story-countdown-title { font-size:11px; color:rgba(255,255,255,.72); margin-bottom:6px; font-weight:700; }
.yam-story-countdown-value { font-size:21px; font-weight:900; }
.yam-story-countdown-meta { margin-top:6px; font-size:11.5px; color:rgba(255,255,255,.7); }
.yam-story-poll { position:absolute; bottom:80px; inset-inline-start:16px; inset-inline-end:16px; background:rgba(15,15,20,.85); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:12px; z-index:3; }
.yam-story-poll-question { color:#fff; font-size:14px; font-weight:700; margin-bottom:10px; text-align:center; }
.yam-story-poll-options { display:flex; flex-direction:column; gap:6px; }
.yam-poll-option { position:relative; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); border-radius:10px; color:#fff; font-size:13.5px; cursor:pointer; font-family:inherit; font-weight:600; overflow:hidden; }
.yam-poll-option.mine { border-color:#8b5cf6; background:rgba(139,92,246,.18); }
.yam-poll-bar { position:absolute; top:0; bottom:0; inset-inline-start:0; background:linear-gradient(90deg,rgba(139,92,246,.55),rgba(236,72,153,.35)); z-index:0; transition:width .4s ease-out; }
.yam-poll-text,.yam-poll-pct { position:relative; z-index:1; }
.yam-poll-total { text-align:center; color:rgba(255,255,255,.65); font-size:11px; margin-top:8px; }
.yam-viewer-toast { position:absolute; top:80px; left:50%; transform:translateX(-50%); background:rgba(15,15,20,.95); color:#fff; padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; z-index:10; border:1px solid rgba(139,92,246,.4); }
.yam-viewers-sheet { position:absolute; left:0; right:0; bottom:0; max-height:76%; background:#14141c; border-top-left-radius:18px; border-top-right-radius:18px; z-index:20; display:flex; flex-direction:column; border-top:1px solid rgba(255,255,255,.1); }
.yam-viewers-handle { width:44px; height:4px; background:rgba(255,255,255,.3); border-radius:4px; margin:8px auto 0; }
.yam-viewers-header { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; color:#fff; border-bottom:1px solid rgba(255,255,255,.06); }
.yam-viewers-header button { background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer; }
.yam-viewers-list { flex:1; overflow-y:auto; padding:4px 0 16px; }
.yam-sheet-section { padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,.05); }
.yam-sheet-title { color:#fff; font-size:13px; font-weight:800; padding:12px 18px 8px; opacity:.9; }
.yam-viewer-row { display:flex; align-items:center; gap:12px; padding:10px 18px; }
.yam-viewer-avatar { width:42px; height:42px; border-radius:50%; object-fit:cover; background:#1a1a22; }
.yam-viewer-info { display:flex; flex-direction:column; line-height:1.35; min-width:0; }
.yam-viewer-info strong { font-size:14px; color:#fff; }
.yam-viewer-info span { font-size:11.5px; color:rgba(255,255,255,.55); overflow-wrap:anywhere; }
.yam-reaction-emoji { margin-inline-start:auto; font-size:28px; }
.yam-viewers-empty { text-align:center; color:rgba(255,255,255,.5); padding:24px 16px; font-size:13px; }
@media (max-width: 380px) { .yam-story-reply { font-size:13px; padding:9px 14px; } .yam-story-meta strong { font-size:13px; } }
`;
const STORY_SETTINGS_KEY = "yamshat:stories-settings";
function _readDefaultPrivacy() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORY_SETTINGS_KEY) || "{}");
    let v = String(raw?.whoCanSeeMyStory || "friends").trim();
    if (v === "close-friends") v = "close_friends";
    if (raw?.closeFriendsOnly) v = "close_friends";
    if (!["friends", "close_friends", "private"].includes(v)) v = "friends";
    return v;
  } catch {
    return "friends";
  }
}
function toLocalDateTimeValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatCountdownRemaining(value) {
  if (!value) return "";
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "";
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "انتهى العد التنازلي";
  const totalSeconds = Math.floor(diff / 1e3);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds % 86400 / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}ي`);
  if (hours > 0 || days > 0) parts.push(`${hours}س`);
  parts.push(`${minutes}د`);
  if (days === 0) parts.push(`${String(seconds).padStart(2, "0")}ث`);
  return parts.join(" ");
}
function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
async function buildTextStoryFile({
  caption,
  texts,
  stickers,
  locationText,
  questionSticker,
  mentions
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#7c3aed");
  grad.addColorStop(0.5, "#ec4899");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(150 + i * 160, 220 + i % 2 * 120, 90 + i * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  let y = 260;
  if (locationText) {
    ctx.fillStyle = "rgba(15,23,42,0.5)";
    roundRect(ctx, 110, y - 46, 420, 72, 28);
    ctx.font = "700 34px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`📍 ${locationText}`, 140, y);
    y += 120;
  }
  const mainText = caption || texts.map((t) => t.text).join(" • ") || "قصة نصية";
  ctx.font = "700 72px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  const lines = wrapText(ctx, mainText, 820).slice(0, 6);
  lines.forEach((line) => {
    ctx.fillText(line, canvas.width / 2, y);
    y += 96;
  });
  if (mentions.length) {
    y += 40;
    ctx.font = "600 32px sans-serif";
    ctx.fillStyle = "#fde68a";
    ctx.fillText(mentions.map((m) => `@${m}`).join("   "), canvas.width / 2, y);
    y += 90;
  }
  if (questionSticker) {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, 120, y - 30, 840, 220, 36);
    ctx.font = "700 44px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText("❓ سؤال", canvas.width / 2, y + 26);
    ctx.font = "600 38px sans-serif";
    const questionLines = wrapText(ctx, questionSticker, 720).slice(0, 3);
    questionLines.forEach((line, idx) => {
      ctx.fillText(line, canvas.width / 2, y + 94 + idx * 48);
    });
  }
  const emojiLine = stickers.filter((s) => !String(s).includes("::")).slice(0, 4).join("   ");
  if (emojiLine) {
    ctx.font = "64px sans-serif";
    ctx.fillText(emojiLine, canvas.width / 2, 1720);
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("تعذّر إنشاء القصة النصية"));
        return;
      }
      resolve(new File([blob], `text-story-${Date.now()}.png`, { type: "image/png" }));
    }, "image/png", 0.95);
  });
}
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fill();
}
function StoryEditor({ file, onClose, onSuccess }) {
  const [previewUrl, setPreviewUrl] = reactExports.useState(() => file ? URL.createObjectURL(file) : "");
  const [mediaType, setMediaType] = reactExports.useState(() => file?.type?.startsWith("video") ? "video" : file ? "image" : "text");
  const [stickers, setStickers] = reactExports.useState([]);
  const [texts, setTexts] = reactExports.useState([]);
  const [caption, setCaption] = reactExports.useState("");
  const [privacy, setPrivacy] = reactExports.useState(() => _readDefaultPrivacy());
  const [filterName, setFilterName] = reactExports.useState("");
  const [music, setMusic] = reactExports.useState("");
  const [musicCatalog, setMusicCatalog] = reactExports.useState([]);
  const [showMusicPicker, setShowMusicPicker] = reactExports.useState(false);
  const [previewingMusic, setPreviewingMusic] = reactExports.useState("");
  const musicAudioRef = reactExports.useRef(null);
  const [isDrawing, setIsDrawing] = reactExports.useState(false);
  const [drawMode, setDrawMode] = reactExports.useState(false);
  const [uploading, setUploading] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState(0);
  const [error, setError] = reactExports.useState("");
  const [showPoll, setShowPoll] = reactExports.useState(false);
  const [pollQuestion, setPollQuestion] = reactExports.useState("");
  const [pollOptions, setPollOptions] = reactExports.useState(["", ""]);
  const [showCountdown, setShowCountdown] = reactExports.useState(false);
  const [countdownAt, setCountdownAt] = reactExports.useState("");
  const [showTextModal, setShowTextModal] = reactExports.useState(false);
  const [textDraft, setTextDraft] = reactExports.useState("");
  const [questionSticker, setQuestionSticker] = reactExports.useState("");
  const [showQuestionEditor, setShowQuestionEditor] = reactExports.useState(false);
  const [locationText, setLocationText] = reactExports.useState("");
  const [showLocationEditor, setShowLocationEditor] = reactExports.useState(false);
  const [mentions, setMentions] = reactExports.useState([]);
  const [showMentionsPicker, setShowMentionsPicker] = reactExports.useState(false);
  const [crossPostToReels, setCrossPostToReels] = reactExports.useState(false);
  const canvasRef = reactExports.useRef(null);
  const ctxRef = reactExports.useRef(null);
  const stageRef = reactExports.useRef(null);
  const isMountedRef = reactExports.useRef(true);
  const dirty = Boolean(
    caption || stickers.length || texts.length || questionSticker || locationText || mentions.length || music && music !== "none" || filterName || showPoll || pollQuestion || showCountdown || countdownAt || !file
  );
  reactExports.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getStoryMusicCatalog();
        if (!cancelled) setMusicCatalog(res?.data?.items || []);
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  reactExports.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
  }, [previewUrl]);
  reactExports.useEffect(() => {
    if (canvasRef.current && stageRef.current) {
      const canvas = canvasRef.current;
      const rect = stageRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctxRef.current = ctx;
    }
  }, [mediaType]);
  const previewMusic = reactExports.useCallback((url, key) => {
    if (previewingMusic === key) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      setPreviewingMusic("");
      return;
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
    if (!url) {
      setMusic("none");
      setPreviewingMusic("");
      return;
    }
    const audio = new Audio(url);
    audio.volume = 0.45;
    audio.loop = true;
    audio.play().catch(() => {
    });
    musicAudioRef.current = audio;
    setPreviewingMusic(key);
    setMusic(key);
  }, [previewingMusic]);
  const addSticker = (emoji) => {
    setStickers((s) => [...s, { id: Date.now() + Math.random(), emoji, x: 40, y: 40 }]);
  };
  const addText = () => {
    setTextDraft("");
    setShowTextModal(true);
  };
  const confirmAddText = () => {
    const value = textDraft.trim();
    if (value) setTexts((t) => [...t, { id: Date.now() + Math.random(), text: value, x: 12, y: 16 + t.length * 10 }]);
    setShowTextModal(false);
    setTextDraft("");
  };
  const removeText = (id) => setTexts((t) => t.filter((x) => x.id !== id));
  const removeSticker = (id) => setStickers((s) => s.filter((x) => x.id !== id));
  const removeMention = (username) => setMentions((arr) => arr.filter((item) => item !== username));
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const cx = touch ? touch.clientX : e.clientX;
    const cy = touch ? touch.clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };
  const startDraw = (e) => {
    if (!drawMode || !ctxRef.current) return;
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };
  const moveDraw = (e) => {
    if (!isDrawing || !ctxRef.current) return;
    const { x, y } = getPos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };
  const endDraw = () => setIsDrawing(false);
  const clearDrawing = () => {
    if (ctxRef.current && canvasRef.current) ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  const publishDisabled = reactExports.useMemo(() => {
    if (uploading) return true;
    if (file) return false;
    return !caption.trim() && !texts.length && !stickers.length && !questionSticker.trim() && !locationText.trim() && !mentions.length;
  }, [uploading, file, caption, texts.length, stickers.length, questionSticker, locationText, mentions.length]);
  const handleUpload = reactExports.useCallback(async () => {
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      const drawingData = canvasRef.current?.toDataURL("image/png");
      const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      const structuredStickers = [
        ...stickers.map((s) => s.emoji),
        ...locationText.trim() ? [`location::${locationText.trim()}`] : [],
        ...questionSticker.trim() ? [`question::${questionSticker.trim()}`] : []
      ];
      const generatedFile = file || await buildTextStoryFile({
        caption,
        texts,
        stickers: structuredStickers,
        locationText,
        questionSticker,
        mentions
      });
      const uploadResponse = await uploadStory(
        generatedFile,
        {
          caption,
          privacy,
          music,
          filter_name: filterName,
          poll_question: showPoll && validPollOptions.length >= 2 ? pollQuestion.trim() : "",
          poll_options: showPoll && validPollOptions.length >= 2 ? validPollOptions : [],
          countdown_at: showCountdown && countdownAt && !Number.isNaN(new Date(countdownAt).getTime()) ? new Date(countdownAt).toISOString() : "",
          drawing_data: drawingData?.length < 2e5 ? drawingData : "",
          is_close_friends: privacy === "close_friends",
          auto_delete_hours: 24,
          stickers: structuredStickers,
          mentions,
          cross_post_to_reels: crossPostToReels
        },
        (evt) => {
          if (!isMountedRef.current) return;
          if (evt?.total) setProgress(Math.round(evt.loaded / evt.total * 100));
        }
      );
      const uploadedStory = uploadResponse?.data || null;
      if (isMountedRef.current && typeof onSuccess === "function") {
        onSuccess(uploadedStory, { file, generatedFile, caption, privacy });
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "";
      if (isMountedRef.current) setError(msg ? `تعذّر الرفع: ${msg}` : "تعذّر رفع القصة.");
    } finally {
      if (isMountedRef.current) setUploading(false);
    }
  }, [caption, countdownAt, crossPostToReels, file, filterName, locationText, mentions, music, onSuccess, pollOptions, pollQuestion, privacy, questionSticker, showCountdown, showPoll, stickers, texts]);
  const handleClose = reactExports.useCallback(() => {
    if (uploading) return;
    if (dirty && !window.confirm("أنت على وشك الخروج دون نشر. هل تريد الإغلاق؟")) return;
    if (typeof onClose === "function") onClose();
  }, [dirty, uploading, onClose]);
  const FILTERS = [
    { id: "", label: "بدون", css: "none" },
    { id: "mono", label: "أبيض/أسود", css: "grayscale(1)" },
    { id: "warm", label: "دافئ", css: "sepia(0.4) saturate(1.2)" },
    { id: "cool", label: "بارد", css: "hue-rotate(180deg) saturate(1.1)" },
    { id: "vivid", label: "حيوي", css: "saturate(1.6) contrast(1.1)" },
    { id: "fade", label: "باهت", css: "opacity(0.85) contrast(0.9)" }
  ];
  const activeFilterCss = FILTERS.find((f) => f.id === filterName)?.css || "none";
  const countdownPreviewLabel = showCountdown && countdownAt ? formatCountdownRemaining(countdownAt) : "";
  const setCountdownPreset = (hours) => {
    const date = new Date(Date.now() + hours * 60 * 60 * 1e3);
    setCountdownAt(toLocalDateTimeValue(date));
    setShowCountdown(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "yam-story-editor-overlay", role: "dialog", "aria-modal": "true", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-editor", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-editor-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleClose, className: "yam-editor-close", "aria-label": "إغلاق", children: "✕" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: file ? "قصة جديدة" : "قصة نصية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleUpload, disabled: publishDisabled, className: "yam-editor-publish", children: uploading ? `${progress}%` : "نشر" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: stageRef, className: `yam-editor-stage ${mediaType === "text" ? "text-mode" : ""}`, children: [
        mediaType === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: previewUrl, autoPlay: true, loop: true, muted: true, playsInline: true, style: { filter: activeFilterCss }, className: "yam-editor-media" }) : previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: previewUrl, alt: "معاينة", style: { filter: activeFilterCss }, className: "yam-editor-media" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-editor-text-preview", style: { filter: activeFilterCss }, children: [
          locationText && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-text-chip", children: [
            "📍 ",
            locationText
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-text-preview-main", children: caption || texts[0]?.text || "ابدأ بكتابة قصة نصية…" }),
          mentions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-mentions-inline", children: mentions.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "@",
            m
          ] }, m)) }),
          questionSticker && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-editor-question-preview", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "❓ سؤال" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: questionSticker })
          ] }),
          stickers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-emojis", children: stickers.map((s) => s.emoji).join(" ") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "canvas",
          {
            ref: canvasRef,
            onMouseDown: startDraw,
            onMouseMove: moveDraw,
            onMouseUp: endDraw,
            onMouseLeave: endDraw,
            onTouchStart: startDraw,
            onTouchMove: moveDraw,
            onTouchEnd: endDraw,
            style: { position: "absolute", inset: 0, width: "100%", height: "100%", cursor: drawMode ? "crosshair" : "default", pointerEvents: drawMode ? "auto" : "none" }
          }
        ),
        stickers.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => removeSticker(s.id), className: "yam-stage-emoji", style: { insetInlineStart: `${s.x}%`, top: `${s.y}%` }, title: "انقر للحذف", children: s.emoji }, s.id)),
        texts.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => removeText(t.id), className: "yam-stage-text", style: { insetInlineStart: `${t.x}%`, top: `${t.y}%` }, title: "انقر للحذف", children: t.text }, t.id)),
        countdownPreviewLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-countdown-preview", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "yam-editor-countdown-chip", children: [
          "⏳ ",
          countdownPreviewLabel
        ] }) }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-error", children: error }),
        uploading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-progress", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-progress-bar", style: { width: `${progress}%` } }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-editor-tools", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: addText, className: "yam-tool-btn", children: "Aa نص" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setDrawMode((d) => !d), className: `yam-tool-btn ${drawMode ? "active" : ""}`, children: "✏️ رسم" }),
        drawMode && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: clearDrawing, className: "yam-tool-btn", children: "🧽 مسح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => addSticker("🔥"), className: "yam-tool-btn", children: "🔥" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => addSticker("❤️"), className: "yam-tool-btn", children: "❤️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => addSticker("😂"), className: "yam-tool-btn", children: "😂" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowMentionsPicker(true), className: "yam-tool-btn", children: "@ منشن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowLocationEditor((s) => !s), className: `yam-tool-btn ${showLocationEditor ? "active" : ""}`, children: "📍 موقع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowQuestionEditor((s) => !s), className: `yam-tool-btn ${showQuestionEditor ? "active" : ""}`, children: "❓ سؤال" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPoll((s) => !s), className: `yam-tool-btn ${showPoll ? "active" : ""}`, children: "📊 استطلاع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
          const next = !showCountdown;
          setShowCountdown(next);
          if (next && !countdownAt) setCountdownPreset(24);
        }, className: `yam-tool-btn ${showCountdown ? "active" : ""}`, children: "⏳ عدّاد" })
      ] }),
      showLocationEditor && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-block", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", dir: "rtl", value: locationText, onChange: (e) => setLocationText(e.target.value), placeholder: "اسم الموقع أو المكان", maxLength: 60, className: "yam-editor-input" }) }),
      showQuestionEditor && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-block", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", dir: "rtl", value: questionSticker, onChange: (e) => setQuestionSticker(e.target.value), placeholder: "اكتب السؤال الذي تريد طرحه", maxLength: 140, className: "yam-editor-input" }) }),
      showPoll && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-editor-poll", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", dir: "rtl", value: pollQuestion, onChange: (e) => setPollQuestion(e.target.value), placeholder: "سؤال الاستطلاع…", maxLength: 140, className: "yam-editor-input" }),
        pollOptions.map((opt, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-poll-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", dir: "rtl", value: opt, onChange: (e) => {
            const next = [...pollOptions];
            next[idx] = e.target.value;
            setPollOptions(next);
          }, placeholder: `الخيار ${idx + 1}`, maxLength: 60, className: "yam-editor-input" }),
          pollOptions.length > 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-poll-remove", onClick: () => setPollOptions(pollOptions.filter((_, i) => i !== idx)), children: "✕" })
        ] }, idx)),
        pollOptions.length < 4 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-poll-add", onClick: () => setPollOptions([...pollOptions, ""]), children: "+ إضافة خيار" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-editor-filters", children: FILTERS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setFilterName(f.id), className: `yam-filter-btn ${filterName === f.id ? "active" : ""}`, children: f.label }, f.id || "none")) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-editor-meta", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", dir: "rtl", value: caption, onChange: (e) => setCaption(e.target.value), placeholder: file ? "اكتب وصفًا (اختياري)…" : "اكتب نص القصة…", maxLength: 300, className: "yam-editor-input" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowMusicPicker((s) => !s), className: "yam-editor-input yam-music-picker-btn", children: music && music !== "none" && music !== "" ? `🎵 ${musicCatalog.find((m) => m.key === music)?.label || music}` : "🎵 إضافة موسيقى (اختياري)" }),
        showMusicPicker && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-music-picker", dir: "rtl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-music-picker-header", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "🎵 مكتبة الموسيقى" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
              setShowMusicPicker(false);
              if (musicAudioRef.current) {
                musicAudioRef.current.pause();
                musicAudioRef.current = null;
              }
              setPreviewingMusic("");
            }, children: "✕" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-music-list", children: musicCatalog.length > 0 ? musicCatalog.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `yam-music-item ${music === item.key ? "selected" : ""}`, onClick: () => previewMusic(item.url, item.key), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-music-label", children: item.label }),
            item.url && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-music-play-icon", children: previewingMusic === item.key ? "⏸" : "▶" }),
            music === item.key && item.url && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-music-check", children: "✓" })
          ] }, item.key)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-music-loading", children: "جاري تحميل المكتبة…" }) })
        ] }),
        mentions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-mentions-chips", children: mentions.map((username) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-chip", onClick: () => removeMention(username), children: [
          "@",
          username,
          " ✕"
        ] }, username)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yam-switch-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: crossPostToReels, onChange: (e) => setCrossPostToReels(e.target.checked), disabled: file && !file.type?.startsWith("video") || !file && mediaType !== "video" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "نشر تلقائي كريلز عند كون القصة فيديو" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-editor-privacy", role: "radiogroup", "aria-label": "خصوصية القصة", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "radio", "aria-checked": privacy === "friends", onClick: () => setPrivacy("friends"), className: `yam-privacy-btn ${privacy === "friends" ? "active" : ""}`, children: "👥 الأصدقاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "radio", "aria-checked": privacy === "close_friends", onClick: () => setPrivacy("close_friends"), className: `yam-privacy-btn ${privacy === "close_friends" ? "active" : ""}`, children: "💚 المقربون" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "radio", "aria-checked": privacy === "private", onClick: () => setPrivacy("private"), className: `yam-privacy-btn ${privacy === "private" ? "active" : ""}`, children: "🔒 خاص" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-editor-note", children: "يمكنك الآن نشر قصة عادية أو قصة نصية فقط مع سؤال، موقع، منشن، استطلاع، وعدّاد تنازلي." })
      ] })
    ] }),
    showTextModal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "dialog", "aria-modal": "true", dir: "rtl", onClick: (e) => {
      if (e.target === e.currentTarget) {
        setShowTextModal(false);
        setTextDraft("");
      }
    }, className: "yam-modal-backdrop", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-modal-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "🔤 إضافة نص للقصة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { autoFocus: true, value: textDraft, onChange: (e) => setTextDraft(e.target.value), placeholder: "أدخل النص هنا…", maxLength: 140, rows: 3, onKeyDown: (e) => {
        if (e.key === "Escape") {
          setShowTextModal(false);
          setTextDraft("");
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && textDraft.trim()) confirmAddText();
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-modal-meta", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Ctrl/Cmd + Enter للإضافة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          textDraft.length,
          "/140"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
          setShowTextModal(false);
          setTextDraft("");
        }, children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: !textDraft.trim(), onClick: confirmAddText, className: "primary", children: "إضافة" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      UserPickerModal,
      {
        open: showMentionsPicker,
        title: "إضافة منشن إلى القصة",
        excludedUsernames: mentions,
        onPick: async (user) => {
          if (user?.username && !mentions.includes(user.username)) setMentions((prev) => [...prev, user.username]);
          setShowMentionsPicker(false);
        },
        onClose: () => setShowMentionsPicker(false)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: editorStyles })
  ] });
}
const editorStyles = `
.yam-story-editor-overlay { font-family:'Noto Sans Arabic','Tajawal',system-ui,sans-serif; position:fixed; inset:0; background:rgba(0,0,0,.94); z-index:2100; display:flex; align-items:stretch; justify-content:center; overflow:hidden; }
.yam-story-editor { width:100%; height:100%; max-width:100vw; background:#0a0a10; display:flex; flex-direction:column; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
@media (min-width: 900px) { .yam-story-editor-overlay { padding:20px; align-items:center; } .yam-story-editor { max-width:460px; max-height:96vh; border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,.7); } }
.yam-editor-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(10,10,16,.95); color:#fff; border-bottom:1px solid rgba(255,255,255,.06); position:sticky; top:0; z-index:20; }
.yam-editor-close,.yam-editor-publish { background:transparent; border:none; color:#fff; font-size:16px; cursor:pointer; padding:6px 12px; border-radius:12px; font-family:inherit; font-weight:700; }
.yam-editor-publish { background:linear-gradient(135deg,#8b5cf6,#ec4899); min-width:74px; }
.yam-editor-publish:disabled { opacity:.6; cursor:not-allowed; }
.yam-editor-stage { position:relative; min-height:45vh; max-height:60vh; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.yam-editor-stage.text-mode { background:linear-gradient(135deg,#7c3aed,#ec4899,#0f172a); }
@media (min-width: 900px) { .yam-editor-stage { flex:1; min-height:0; max-height:none; } }
.yam-editor-media { width:100%; height:100%; object-fit:contain; transition:filter .25s; }
.yam-editor-text-preview { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px; gap:18px; color:#fff; text-align:center; }
.yam-editor-text-preview-main { font-size:clamp(24px,5vw,40px); font-weight:800; line-height:1.6; text-shadow:0 6px 22px rgba(0,0,0,.45); }
.yam-text-chip,.yam-editor-countdown-chip,.yam-chip { display:inline-flex; align-items:center; gap:6px; padding:10px 14px; border-radius:999px; background:rgba(17,24,39,.75); border:1px solid rgba(255,255,255,.18); color:#fff; font-weight:800; font-size:13px; }
.yam-editor-mentions-inline { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.yam-editor-mentions-inline span { background:rgba(255,255,255,.16); padding:7px 10px; border-radius:999px; font-size:13px; }
.yam-editor-question-preview { max-width:88%; background:rgba(17,24,39,.5); border:1px solid rgba(255,255,255,.12); border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:8px; }
.yam-editor-question-preview strong { font-size:15px; }
.yam-editor-emojis { font-size:32px; }
.yam-stage-emoji { position:absolute; font-size:clamp(32px,8vw,56px); cursor:pointer; user-select:none; filter:drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
.yam-stage-text { position:absolute; color:#fff; font-size:clamp(18px,5vw,28px); font-weight:800; text-shadow:0 2px 8px rgba(0,0,0,.7); cursor:pointer; padding:4px 10px; background:rgba(0,0,0,.25); border-radius:8px; }
.yam-editor-error { position:absolute; top:12px; inset-inline:12px; background:rgba(239,68,68,.95); color:#fff; padding:10px 14px; border-radius:10px; font-size:13px; text-align:center; }
.yam-editor-progress { position:absolute; bottom:0; left:0; right:0; height:4px; background:rgba(255,255,255,.15); }
.yam-editor-progress-bar { height:100%; background:linear-gradient(90deg,#8b5cf6,#ec4899); transition:width .2s; }
.yam-editor-countdown-preview { position:absolute; top:18px; left:50%; transform:translateX(-50%); z-index:4; pointer-events:none; }
.yam-editor-tools,.yam-editor-filters { display:flex; gap:8px; overflow-x:auto; padding:10px 12px; background:rgba(255,255,255,.03); border-top:1px solid rgba(255,255,255,.06); scrollbar-width:none; }
.yam-editor-tools::-webkit-scrollbar,.yam-editor-filters::-webkit-scrollbar { display:none; }
.yam-tool-btn,.yam-filter-btn { flex-shrink:0; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); color:#fff; padding:8px 14px; border-radius:18px; font-size:14px; cursor:pointer; font-family:inherit; font-weight:600; }
.yam-tool-btn.active,.yam-filter-btn.active { background:#8b5cf6; border-color:#8b5cf6; }
.yam-editor-meta,.yam-editor-block,.yam-editor-poll { display:flex; flex-direction:column; gap:10px; padding:12px; }
.yam-editor-input { width:100%; box-sizing:border-box; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#fff; padding:12px 14px; border-radius:14px; font-size:14px; font-family:inherit; }
.yam-editor-input::placeholder { color:rgba(255,255,255,.45); }
.yam-mentions-chips { display:flex; flex-wrap:wrap; gap:8px; }
.yam-chip { background:rgba(56,189,248,.18); border-color:rgba(56,189,248,.35); cursor:pointer; font-size:12px; }
.yam-switch-row { display:flex; align-items:center; gap:10px; color:#fff; font-size:13px; }
.yam-editor-privacy { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.yam-privacy-btn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#fff; padding:10px 12px; border-radius:14px; cursor:pointer; font-family:inherit; font-weight:700; }
.yam-privacy-btn.active { background:rgba(139,92,246,.22); border-color:#8b5cf6; }
.yam-editor-note { margin:0; opacity:.72; font-size:12px; color:#dbeafe; }
.yam-poll-row { display:flex; gap:8px; align-items:center; }
.yam-poll-remove,.yam-poll-add { border:none; cursor:pointer; border-radius:12px; font-family:inherit; }
.yam-poll-remove { width:42px; height:42px; background:rgba(239,68,68,.16); color:#fff; }
.yam-poll-add { align-self:flex-start; padding:10px 14px; background:rgba(255,255,255,.08); color:#fff; }
.yam-music-picker { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:16px; overflow:hidden; }
.yam-music-picker-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; color:#fff; border-bottom:1px solid rgba(255,255,255,.08); }
.yam-music-picker-header button { background:transparent; border:none; color:#fff; cursor:pointer; font-size:18px; }
.yam-music-list { display:flex; flex-direction:column; max-height:220px; overflow:auto; }
.yam-music-item { display:flex; align-items:center; gap:8px; padding:10px 12px; background:transparent; border:none; color:#fff; cursor:pointer; font-family:inherit; text-align:right; }
.yam-music-item.selected { background:rgba(139,92,246,.18); }
.yam-music-label { flex:1; }
.yam-music-loading { padding:14px; color:rgba(255,255,255,.68); }
.yam-modal-backdrop { position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; padding:16px; }
.yam-modal-card { background:#1f2233; color:#fff; border-radius:14px; width:100%; max-width:420px; padding:18px; box-shadow:0 18px 48px rgba(0,0,0,.45); border:1px solid rgba(255,255,255,.08); }
.yam-modal-card h3 { margin:0 0 12px; font-size:17px; font-weight:700; }
.yam-modal-card textarea { width:100%; box-sizing:border-box; padding:12px; border-radius:10px; background:rgba(255,255,255,.06); color:inherit; border:1px solid rgba(255,255,255,.12); font-family:inherit; font-size:16px; resize:vertical; }
.yam-modal-meta { display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:12px; opacity:.65; }
.yam-modal-actions { display:flex; gap:8px; margin-top:14px; justify-content:flex-end; }
.yam-modal-actions button { padding:9px 16px; border-radius:10px; cursor:pointer; background:transparent; color:inherit; border:1px solid rgba(255,255,255,.16); font-weight:600; }
.yam-modal-actions button.primary { background:var(--primary,#8b5cf6); color:#fff; border:none; }
`;
export {
  StoryEditor as S,
  StoryViewerEnhanced as a
};
