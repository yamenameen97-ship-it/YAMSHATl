import {
  MainLayout,
  avatarGradient,
  createLiveRoom,
  endLiveRoom,
  formatTimeAgo,
  getLiveComments,
  getLiveRoom,
  getLiveRooms,
  initialsFromName,
  sendLiveGift,
  updateLiveRecording
} from "./chunk-ZOZSORVL.js";
import "./chunk-AB4CHF2R.js";
import {
  socketManager_default
} from "./chunk-46YZGXXY.js";
import {
  useToast
} from "./chunk-OIWCOE6H.js";
import {
  getCurrentUsername
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Live.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var GIFTS = [
  { id: 1, name: "\u0648\u0631\u062F\u0629", icon: "\u{1F339}", price: 10 },
  { id: 2, name: "\u0642\u0647\u0648\u0629", icon: "\u2615", price: 50 },
  { id: 3, name: "\u0642\u0644\u0628 \u0643\u0628\u064A\u0631", icon: "\u{1F49C}", price: 100 },
  { id: 4, name: "\u0646\u062C\u0645\u0629", icon: "\u2B50", price: 250 },
  { id: 5, name: "\u062A\u0627\u062C", icon: "\u{1F451}", price: 1e3 }
];
function Avatar({ name = "", src, size = 42, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: ring ? "2px solid rgba(239,68,68,0.88)" : "none",
    boxShadow: ring ? "0 0 0 4px rgba(239,68,68,0.12)" : "none"
  };
  return src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src, alt: name, style }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...style, display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient(name) }, children: initialsFromName(name).slice(0, 1) });
}
function FloatingHearts({ items }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-hearts-layer", "aria-hidden": true, children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "span",
    {
      className: "yam-live-heart",
      style: { left: `${item.left}%`, animationDuration: `${item.duration}ms` },
      children: "\u{1F49C}"
    },
    item.id
  )) });
}
function Live() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [rooms, setRooms] = (0, import_react.useState)([]);
  const [activeRoom, setActiveRoom] = (0, import_react.useState)(null);
  const [comments, setComments] = (0, import_react.useState)([]);
  const [commentText, setCommentText] = (0, import_react.useState)("");
  const [loadingRooms, setLoadingRooms] = (0, import_react.useState)(true);
  const [loadingRoom, setLoadingRoom] = (0, import_react.useState)(false);
  const [busy, setBusy] = (0, import_react.useState)("");
  const [showGiftTray, setShowGiftTray] = (0, import_react.useState)(false);
  const [floatingHearts, setFloatingHearts] = (0, import_react.useState)([]);
  const [latencyMs, setLatencyMs] = (0, import_react.useState)(1250);
  const [coHosts, setCoHosts] = (0, import_react.useState)([]);
  const commentsEndRef = (0, import_react.useRef)(null);
  const loadRooms = (0, import_react.useCallback)(async () => {
    setLoadingRooms(true);
    try {
      const { data } = await getLiveRooms();
      const next = Array.isArray(data) ? data : [];
      setRooms(next);
      if (!activeRoom && next.length) setActiveRoom(next[0]);
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u062B\u0648\u062B", description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingRooms(false);
    }
  }, [activeRoom, pushToast]);
  const loadRoomDetails = (0, import_react.useCallback)(async (roomId) => {
    if (!roomId) return;
    setLoadingRoom(true);
    try {
      const [{ data: room }, { data: liveComments }] = await Promise.all([
        getLiveRoom(roomId),
        getLiveComments(roomId)
      ]);
      setActiveRoom(room);
      setComments(Array.isArray(liveComments) ? liveComments : []);
      setCoHosts(room?.multi_host?.current_hosts || []);
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0628\u062B", description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingRoom(false);
    }
  }, [pushToast]);
  (0, import_react.useEffect)(() => {
    loadRooms();
  }, [loadRooms]);
  (0, import_react.useEffect)(() => {
    if (!activeRoom?.id) return;
    loadRoomDetails(activeRoom.id);
  }, [activeRoom?.id, loadRoomDetails]);
  (0, import_react.useEffect)(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);
  (0, import_react.useEffect)(() => {
    if (!activeRoom?.id) return void 0;
    socketManager_default.connect();
    socketManager_default.emit("join_live", {
      room_id: activeRoom.id,
      role: activeRoom.host === currentUser ? "host" : "viewer",
      platform: "web",
      device_type: "browser"
    });
    const handleComment = (payload) => {
      if (!payload || payload.room_id !== activeRoom.id) return;
      setComments((prev) => [...prev, payload]);
    };
    const handleStats = (payload) => {
      if (!payload || payload.room_id !== activeRoom.id) return;
      setActiveRoom((prev) => prev ? { ...prev, viewer_count: payload.viewer_count, hearts_count: payload.hearts_count } : prev);
      setRooms((prev) => prev.map((room) => room.id === payload.room_id ? { ...room, viewer_count: payload.viewer_count, hearts_count: payload.hearts_count } : room));
      setLatencyMs((prev) => prev > 1950 ? 980 : prev + 75);
    };
    const handleHeart = () => {
      const id = `heart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const next = { id, left: 14 + Math.random() * 72, duration: 1500 + Math.random() * 900 };
      setFloatingHearts((prev) => [...prev, next]);
      setTimeout(() => setFloatingHearts((prev) => prev.filter((item) => item.id !== id)), next.duration);
    };
    socketManager_default.on("new_comment", handleComment);
    socketManager_default.on("room_stats", handleStats);
    socketManager_default.on("new_heart", handleHeart);
    return () => {
      socketManager_default.emit("leave_live", { room_id: activeRoom.id });
      socketManager_default.off("new_comment", handleComment);
      socketManager_default.off("room_stats", handleStats);
      socketManager_default.off("new_heart", handleHeart);
    };
  }, [activeRoom?.id, activeRoom?.host, currentUser]);
  const hostName = activeRoom?.host || activeRoom?.username || "Streamer";
  const isHost = hostName === currentUser;
  const currentPot = Number(activeRoom?.economy?.pot || activeRoom?.economy?.current_pot || 0);
  const goalTarget = 2e3;
  const goalPercent = Math.min(100, Math.round(currentPot / goalTarget * 100));
  const topGifters = Array.isArray(activeRoom?.economy?.top_gifters) ? activeRoom.economy.top_gifters : [];
  const recordingStatus = activeRoom?.recording?.status || "idle";
  const healthScore = Number(activeRoom?.analytics?.health_score || 92);
  const bitrate = Number(activeRoom?.analytics?.avg_bitrate || 4200);
  const heartsCount = Number(activeRoom?.hearts_count || 0);
  const viewerCount = Number(activeRoom?.viewer_count || 0);
  const sendComment = async () => {
    if (!commentText.trim() || !activeRoom?.id) return;
    const optimistic = {
      id: `local-${Date.now()}`,
      room_id: activeRoom.id,
      user: currentUser,
      text: commentText.trim(),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setComments((prev) => [...prev, optimistic]);
    socketManager_default.emit("send_comment", { room_id: activeRoom.id, text: commentText.trim() });
    setCommentText("");
  };
  const sendHeart = () => {
    if (!activeRoom?.id) return;
    socketManager_default.emit("send_heart", { room_id: activeRoom.id });
    const id = `heart-${Date.now()}`;
    const next = { id, left: 14 + Math.random() * 72, duration: 1500 + Math.random() * 900 };
    setFloatingHearts((prev) => [...prev, next]);
    setTimeout(() => setFloatingHearts((prev) => prev.filter((item) => item.id !== id)), next.duration);
  };
  const giveGift = async (gift) => {
    if (!activeRoom?.id) return;
    try {
      await sendLiveGift({ room_id: activeRoom.id, gift_name: gift.name, coins: gift.price });
      pushToast({ type: "success", title: `\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 ${gift.icon} ${gift.name}` });
      loadRoomDetails(activeRoom.id);
      setShowGiftTray(false);
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0647\u062F\u064A\u0629", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleShare = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#/live`;
      await navigator.clipboard.writeText(url);
      pushToast({ type: "success", title: "\u062A\u0645 \u0646\u0633\u062E \u0631\u0627\u0628\u0637 \u0627\u0644\u0628\u062B" });
    } catch {
      pushToast({ type: "warning", title: "\u062A\u0639\u0630\u0631 \u0627\u0644\u0646\u0633\u062E", description: "\u0627\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637 \u064A\u062F\u0648\u064A\u064B\u0627." });
    }
  };
  const handleCreateRoom = async () => {
    try {
      setBusy("create");
      const { data } = await createLiveRoom({ title: `\u0628\u062B \u0645\u0628\u0627\u0634\u0631 \u0645\u0639 ${currentUser}` });
      setActiveRoom(data);
      await loadRooms();
      pushToast({ type: "success", title: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u063A\u0631\u0641\u0629 \u0627\u0644\u0628\u062B" });
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u062B", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy("");
    }
  };
  const toggleRecording = async () => {
    if (!activeRoom?.id) return;
    try {
      setBusy("recording");
      const action = recordingStatus === "recording" ? "stop" : "start";
      await updateLiveRecording({ room_id: activeRoom.id, action });
      await loadRoomDetails(activeRoom.id);
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0633\u062C\u064A\u0644", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy("");
    }
  };
  const stopLive = async () => {
    if (!activeRoom?.id) return;
    try {
      setBusy("end");
      await endLiveRoom(activeRoom.id);
      setActiveRoom(null);
      setComments([]);
      await loadRooms();
      pushToast({ type: "success", title: "\u062A\u0645 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u062B" });
    } catch (error) {
      pushToast({ type: "error", title: "\u062A\u0639\u0630\u0631 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u062B", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-page desktop-post mobile-post", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-main", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-stage-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingHearts, { items: floatingHearts }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-stage-gradient" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-stage-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-badges", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-badge live", children: "LIVE" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "live-badge", children: [
                "\u{1F441} ",
                viewerCount
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "live-badge", children: [
                "\u{1F49C} ",
                heartsCount
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "live-badge", children: [
                "\u26A1 ",
                latencyMs,
                "ms"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-stage-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-live-action-btn", onClick: loadRooms, children: "\u062A\u062D\u062F\u064A\u062B" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-live-action-btn", onClick: handleShare, children: "\u0645\u0634\u0627\u0631\u0643\u0629" }),
              isHost && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-live-action-btn", onClick: toggleRecording, children: recordingStatus === "recording" ? "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062A\u0633\u062C\u064A\u0644" : "\u0628\u062F\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644" }),
              isHost && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-live-action-btn danger", onClick: stopLive, children: "\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u062B" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-video-placeholder", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-hero-icon", children: "\u{1F3A5}" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: activeRoom?.title || "\u0628\u062B \u0645\u0628\u0627\u0634\u0631 \u0645\u0645\u064A\u0632" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
              "\u0627\u0644\u0645\u0636\u064A\u0641: ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: hostName })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-stage-tech", children: "WebRTC \u2022 RTMP ingest \u2022 HLS playback \u2022 Adaptive moderation" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-stage-footer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-host-block", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: hostName, size: 56, ring: true }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-host-line", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: hostName }),
                  " ",
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "verify-dot", children: "\u2713" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "Gaming \u2022 Just Chatting \u2022 Battle Royale" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-footer-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-live-pill-btn", children: "\u0645\u062A\u0627\u0628\u0639\u0629" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-live-pill-btn", children: "\u062A\u0646\u0628\u064A\u0647" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-live-pill-btn", onClick: handleShare, children: "\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-bottom-grid", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "yam-live-panel", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-panel-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0647\u062F\u0641 \u0627\u0644\u062F\u0639\u0645" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "$",
                currentPot.toLocaleString(),
                " / $",
                goalTarget.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-goal-bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${goalPercent}%` } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-goal-note", children: [
              "\u062A\u0645 \u062A\u062D\u0642\u064A\u0642 ",
              goalPercent,
              "% \u0645\u0646 \u0627\u0644\u0647\u062F\u0641"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-top-supporters", children: topGifters.length ? topGifters.map(([name, total]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-supporter-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: name }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
                total,
                " coin"
              ] })
            ] }, name)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u0644\u0627 \u064A\u0648\u062C\u062F \u062F\u0627\u0639\u0645\u0648\u0646 \u0628\u0639\u062F" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "yam-live-panel", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-panel-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0628\u062B" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0627\u0644\u064A\u0648\u0645" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-info-stats-grid", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-stat-box", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u0627\u0644\u0645\u0634\u0627\u0647\u062F\u064A\u0646" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: viewerCount })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-stat-box", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u0627\u0644\u0635\u062D\u0629" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
                  healthScore,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-stat-box", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Bitrate" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: bitrate })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-stat-box", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u0627\u0644\u062A\u0633\u062C\u064A\u0644" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: recordingStatus })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-schedule-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u0627\u0644\u062C\u062F\u0648\u0644 \u0627\u0644\u0642\u0627\u062F\u0645" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u063A\u062F\u064B\u0627 09:00 \u0645\u0633\u0627\u0621\u064B \u2013 \u062C\u0644\u0633\u0629 \u0644\u0639\u0628 \u0648\u062A\u062D\u062F\u064A\u0627\u062A \u0645\u0639 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u064A\u0646" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "yam-live-panel", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-panel-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0627\u0644\u0636\u064A\u0648\u0641 / Co-host" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: coHosts.length })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-cohost-list", children: (coHosts.length ? coHosts : [hostName]).map((name, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-cohost-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name, size: 38 }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: index === 0 ? "Host" : "Co-host" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-mini-chip", children: "Live" })
            ] }, name)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { className: "yam-live-sidebar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-rooms-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u0627\u0644\u063A\u0631\u0641 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629" }),
          !activeRoom && currentUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-create-live-btn", onClick: handleCreateRoom, disabled: busy === "create", children: busy === "create" ? "..." : "\u0628\u062F\u0621 \u0628\u062B" }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-room-list", children: [
          loadingRooms && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-side-empty", children: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u063A\u0631\u0641..." }),
          !loadingRooms && !rooms.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-side-empty", children: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0628\u062B \u0645\u0628\u0627\u0634\u0631 \u0627\u0644\u0622\u0646" }),
          rooms.map((room) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: `yam-room-card ${activeRoom?.id === room.id ? "active" : ""}`, onClick: () => setActiveRoom(room), children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-room-card-top", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "room-live-pill", children: "LIVE" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "room-viewers", children: [
                "\u{1F441} ",
                room.viewer_count || 0
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: room.title || "\u0628\u062B \u0645\u0628\u0627\u0634\u0631" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: room.host || room.username })
          ] }, room.id))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-chat-box", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-chat-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0627\u0644\u0628\u062B" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u062A\u0641\u0627\u0639\u0644\u060C \u0639\u0644\u0651\u0642\u060C \u0623\u0631\u0633\u0644 \u0642\u0644\u0648\u0628 \u0648\u0647\u062F\u0627\u064A\u0627" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-chat-head-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-icon-lite", onClick: () => setShowGiftTray((prev) => !prev), children: "\u{1F381}" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-icon-lite", onClick: sendHeart, children: "\u{1F49C}" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-icon-lite", onClick: handleShare, children: "\u2934" })
            ] })
          ] }),
          showGiftTray && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-gift-tray", children: GIFTS.map((gift) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "yam-gift-card", onClick: () => giveGift(gift), children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gift-icon", children: gift.icon }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: gift.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
              gift.price,
              " coin"
            ] })
          ] }, gift.id)) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-comments-stream", children: [
            loadingRoom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-side-empty", children: "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A..." }),
            !loadingRoom && !comments.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-side-empty", children: "\u0623\u0648\u0644 \u062A\u0639\u0644\u064A\u0642 \u0645\u0646\u0643\u061F" }),
            comments.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-comment", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, { name: item.user, size: 36 }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-comment-body", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-comment-top", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.user }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTimeAgo(item.created_at) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "yam-live-comment-text", children: item.text })
              ] })
            ] }, item.id)),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: commentsEndRef })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "yam-live-comment-composer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "text",
                placeholder: "\u0627\u0643\u062A\u0628 \u062A\u0639\u0644\u064A\u0642\u064B\u0627...",
                value: commentText,
                onChange: (event) => setCommentText(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === "Enter") sendComment();
                },
                disabled: !activeRoom?.id
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "yam-send-comment-btn", onClick: sendComment, disabled: !activeRoom?.id || !commentText.trim(), children: "\u0625\u0631\u0633\u0627\u0644" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .yam-live-page {
          direction: rtl;
          display: grid;
          grid-template-columns: minmax(0,1fr) 380px;
          gap: 16px;
          padding: 18px;
          min-height: calc(100vh - 66px);
          background: radial-gradient(circle at top, rgba(139,92,246,0.06), transparent 30%), #050b18;
        }
        @media (max-width: 1180px) {
          .yam-live-page { grid-template-columns: 1fr; }
        }

        .yam-live-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .yam-live-stage-card {
          position: relative;
          overflow: hidden;
          border-radius: 32px;
          border: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(180deg, rgba(10,16,31,0.97), rgba(8,13,27,0.96));
          min-height: 520px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 60px rgba(2,6,23,0.46);
        }
        .yam-live-stage-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, rgba(239,68,68,0.22), transparent 30%), radial-gradient(circle at 25% 25%, rgba(139,92,246,0.24), transparent 35%);
          pointer-events: none;
        }
        .yam-live-stage-head,
        .yam-live-stage-footer {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 18px 22px;
        }
        .yam-live-badges,
        .yam-live-stage-actions,
        .yam-live-footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(15,23,42,0.74);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 12px;
          font-weight: 700;
        }
        .live-badge.live {
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-color: transparent;
          color: white;
        }
        .yam-live-action-btn,
        .yam-live-pill-btn,
        .yam-mini-chip,
        .yam-create-live-btn,
        .yam-send-comment-btn {
          border: none;
          border-radius: 14px;
          padding: 10px 14px;
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(255,255,255,0.06);
          color: white;
          cursor: pointer;
          font-weight: 700;
        }
        .yam-live-action-btn:hover,
        .yam-live-pill-btn:hover,
        .yam-mini-chip:hover,
        .yam-create-live-btn:hover,
        .yam-send-comment-btn:hover {
          background: rgba(139,92,246,0.18);
        }
        .yam-live-action-btn.danger {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .yam-live-video-placeholder {
          flex: 1;
          min-height: 320px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 28px;
          position: relative;
          z-index: 1;
        }
        .yam-live-hero-icon { font-size: 88px; margin-bottom: 12px; }
        .yam-live-video-placeholder h1 { margin: 0; font-size: 34px; font-weight: 900; }
        .yam-live-video-placeholder p { margin: 8px 0 12px; font-size: 16px; color: #cbd5e1; }
        .yam-live-stage-tech {
          display: inline-flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
          font-size: 13px;
        }
        .yam-live-host-block { display: flex; align-items: center; gap: 12px; }
        .yam-live-host-line { display: flex; align-items: center; gap: 6px; font-size: 16px; }
        .verify-dot { color: #3b82f6; }

        .yam-live-hearts-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 4;
        }
        .yam-live-heart {
          position: absolute;
          bottom: 90px;
          font-size: 28px;
          animation-name: fly-heart;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes fly-heart {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          60% { transform: translateY(-180px) scale(1.35) rotate(-8deg); opacity: 0.92; }
          100% { transform: translateY(-340px) scale(0.35) rotate(12deg); opacity: 0; }
        }

        .yam-live-bottom-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 16px;
        }
        @media (max-width: 960px) {
          .yam-live-bottom-grid { grid-template-columns: 1fr; }
        }
        .yam-live-panel {
          border-radius: 24px;
          background: rgba(12,18,34,0.9);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 18px;
          box-shadow: 0 20px 40px rgba(2,6,23,0.26);
        }
        .yam-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }
        .yam-panel-head h3 { margin: 0; font-size: 17px; font-weight: 900; }
        .yam-panel-head span { color: #94a3b8; font-size: 13px; }
        .yam-goal-bar {
          width: 100%;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
          margin-bottom: 10px;
        }
        .yam-goal-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(135deg, #7c3aed, #ef4444);
        }
        .yam-goal-note { color: #94a3b8; font-size: 13px; margin-bottom: 12px; }
        .yam-supporter-row,
        .yam-cohost-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .yam-top-supporters,
        .yam-cohost-list { display: grid; gap: 8px; }
        .yam-info-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .yam-stat-box {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          display: grid;
          gap: 6px;
        }
        .yam-stat-box small { color: #94a3b8; font-size: 12px; }
        .yam-stat-box strong { font-size: 20px; font-weight: 900; }
        .yam-schedule-card {
          border-radius: 16px;
          padding: 14px;
          background: rgba(124,58,237,0.08);
          border: 1px solid rgba(124,58,237,0.14);
        }
        .yam-schedule-card strong { display: block; margin-bottom: 8px; }
        .yam-schedule-card p { margin: 0; color: #cbd5e1; line-height: 1.6; }

        .yam-live-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
        }
        .yam-live-rooms-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .yam-live-rooms-head h3 { margin: 0; font-size: 20px; font-weight: 900; }
        .yam-room-list,
        .yam-live-chat-box {
          border-radius: 24px;
          background: rgba(12,18,34,0.94);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 14px;
          box-shadow: 0 20px 40px rgba(2,6,23,0.28);
        }
        .yam-room-list { display: grid; gap: 10px; max-height: 260px; overflow-y: auto; }
        .yam-room-card {
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: white;
          text-align: start;
          cursor: pointer;
          display: grid;
          gap: 6px;
        }
        .yam-room-card.active {
          background: rgba(139,92,246,0.16);
          border-color: rgba(139,92,246,0.32);
        }
        .yam-room-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .room-live-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
          background: #ef4444;
          color: white;
        }
        .room-viewers { color: #94a3b8; font-size: 12px; }
        .yam-live-side-empty { padding: 16px; color: #64748b; text-align: center; }

        .yam-live-chat-box {
          display: flex;
          flex-direction: column;
          min-height: 420px;
          flex: 1;
          min-height: 0;
        }
        .yam-live-chat-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .yam-live-chat-head strong { display: block; font-size: 16px; margin-bottom: 4px; }
        .muted { color: #94a3b8; font-size: 12px; }
        .yam-live-chat-head-actions { display: flex; gap: 6px; }
        .yam-icon-lite {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: white;
          cursor: pointer;
        }
        .yam-gift-tray {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        .yam-gift-card {
          display: grid;
          gap: 4px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(124,58,237,0.08);
          border: 1px solid rgba(124,58,237,0.14);
          color: white;
          cursor: pointer;
          text-align: center;
        }
        .gift-icon { font-size: 22px; }
        .yam-comments-stream {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-inline-end: 2px;
        }
        .yam-comments-stream::-webkit-scrollbar { width: 4px; }
        .yam-comments-stream::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.24); border-radius: 999px; }
        .yam-live-comment {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .yam-live-comment:last-child { border-bottom: none; }
        .yam-live-comment-body { flex: 1; min-width: 0; }
        .yam-live-comment-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }
        .yam-live-comment-top strong { font-size: 13px; }
        .yam-live-comment-top span { font-size: 11px; color: #64748b; }
        .yam-live-comment-text { font-size: 14px; line-height: 1.5; color: #e2e8f0; word-break: break-word; }
        .yam-live-comment-composer {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .yam-live-comment-composer input {
          flex: 1;
          min-width: 0;
          background: rgba(15,23,42,0.78);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
        }
        .yam-send-comment-btn {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          border-color: transparent;
          min-width: 88px;
        }
      ` })
  ] });
}
export {
  Live as default
};
