import { e as useToast, f as getCurrentUsername, r as reactExports, _ as __vitePreload, h as socketManager, j as jsxRuntimeExports } from "../index-DuXBJv5q.js";
import { M as MainLayout } from "./MainLayout-CsZ3tvBx.js";
import { g as getLiveRooms, a as getLiveRoom, b as getLiveComments, c as getLiveToken, s as sendLiveGift, d as createLiveRoom, u as updateLiveRecording, e as endLiveRoom } from "./live-b1Kum3Sy.js";
import { f as formatTimeAgo, i as initialsFromName, a as avatarGradient } from "./YamshatDesign-C0ca_MnA.js";
const GIFTS = [
  { id: 1, name: "وردة", icon: "🌹", price: 10 },
  { id: 2, name: "قهوة", icon: "☕", price: 50 },
  { id: 3, name: "قلب كبير", icon: "💜", price: 100 },
  { id: 4, name: "نجمة", icon: "⭐", price: 250 },
  { id: 5, name: "تاج", icon: "👑", price: 1e3 }
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
  return src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, style }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient(name) }, children: initialsFromName(name).slice(0, 1) });
}
function FloatingHearts({ items }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-live-hearts-layer", "aria-hidden": true, children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-live-heart", style: { left: `${item.left}%`, animationDuration: `${item.duration}ms` }, children: "💜" }, item.id)) });
}
function Live() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [rooms, setRooms] = reactExports.useState([]);
  const [activeRoom, setActiveRoom] = reactExports.useState(null);
  const [comments, setComments] = reactExports.useState([]);
  const [commentText, setCommentText] = reactExports.useState("");
  const [loadingRooms, setLoadingRooms] = reactExports.useState(true);
  const [loadingRoom, setLoadingRoom] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState("");
  const [showGiftTray, setShowGiftTray] = reactExports.useState(false);
  const [floatingHearts, setFloatingHearts] = reactExports.useState([]);
  const [latencyMs, setLatencyMs] = reactExports.useState(1250);
  const [coHosts, setCoHosts] = reactExports.useState([]);
  const [cameraEnabled, setCameraEnabled] = reactExports.useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = reactExports.useState(true);
  const [joinedRole, setJoinedRole] = reactExports.useState("");
  const [streamReady, setStreamReady] = reactExports.useState(false);
  const [mediaStatus, setMediaStatus] = reactExports.useState("جاهز");
  const [connectionLabel, setConnectionLabel] = reactExports.useState("غير متصل");
  const [remoteParticipantName, setRemoteParticipantName] = reactExports.useState("");
  const [hasPreview, setHasPreview] = reactExports.useState(false);
  const commentsEndRef = reactExports.useRef(null);
  const previewVideoRef = reactExports.useRef(null);
  const remoteVideoRef = reactExports.useRef(null);
  const previewStreamRef = reactExports.useRef(null);
  const liveRoomRef = reactExports.useRef(null);
  const livekitRef = reactExports.useRef(null);
  const remoteTrackRef = reactExports.useRef(null);
  const remoteAudioElementsRef = reactExports.useRef([]);
  const loadRooms = reactExports.useCallback(async () => {
    setLoadingRooms(true);
    try {
      const { data } = await getLiveRooms();
      const next = Array.isArray(data) ? data : [];
      setRooms(next);
      setActiveRoom((prev) => {
        if (!next.length) return null;
        if (prev?.id) {
          const matchedRoom = next.find((room) => room.id === prev.id);
          if (matchedRoom) return matchedRoom;
        }
        return next[0];
      });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحميل البثوث", description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingRooms(false);
    }
  }, [pushToast]);
  const loadRoomDetails = reactExports.useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingRoom(true);
    try {
      const [{ data: room }, { data: liveComments }] = await Promise.all([
        getLiveRoom(roomId),
        getLiveComments(roomId)
      ]);
      setActiveRoom(room);
      setComments(Array.isArray(liveComments) ? liveComments : []);
      setCoHosts(room?.multi_host?.current_hosts || room?.co_hosts || []);
      setStreamReady(Boolean(room?.livekit_configured));
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحميل تفاصيل البث", description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingRoom(false);
    }
  }, [pushToast]);
  const cleanupAudioElements = reactExports.useCallback(() => {
    remoteAudioElementsRef.current.forEach((element) => {
      try {
        element.remove?.();
      } catch {
      }
    });
    remoteAudioElementsRef.current = [];
  }, []);
  const stopPreviewStream = reactExports.useCallback(() => {
    previewStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    previewStreamRef.current = null;
    setHasPreview(false);
    if (previewVideoRef.current) {
      previewVideoRef.current.pause?.();
      previewVideoRef.current.srcObject = null;
    }
  }, []);
  const disconnectLiveSession = reactExports.useCallback(async ({ keepPreview = false } = {}) => {
    if (remoteTrackRef.current && remoteVideoRef.current) {
      try {
        remoteTrackRef.current.detach(remoteVideoRef.current);
      } catch {
      }
      remoteTrackRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause?.();
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.removeAttribute("src");
      remoteVideoRef.current.load?.();
    }
    cleanupAudioElements();
    if (liveRoomRef.current) {
      try {
        await liveRoomRef.current.disconnect();
      } catch {
      }
      liveRoomRef.current = null;
    }
    setJoinedRole("");
    setConnectionLabel("غير متصل");
    setRemoteParticipantName("");
    if (!keepPreview) {
      stopPreviewStream();
    }
  }, [cleanupAudioElements, stopPreviewStream]);
  const ensureCameraPreview = reactExports.useCallback(async () => {
    if (previewStreamRef.current) return previewStreamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("المتصفح لا يدعم تشغيل الكاميرا");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    previewStreamRef.current = stream;
    setHasPreview(true);
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = stream;
      previewVideoRef.current.muted = true;
      previewVideoRef.current.playsInline = true;
      await previewVideoRef.current.play().catch(() => {
      });
    }
    setMediaStatus("تم فتح الكاميرا");
    return stream;
  }, []);
  const attachRemoteTrack = reactExports.useCallback((track, participantName = "") => {
    if (!track) return;
    if (track.kind === "video" && remoteVideoRef.current) {
      try {
        track.attach(remoteVideoRef.current);
      } catch {
      }
      remoteTrackRef.current = track;
      setRemoteParticipantName(participantName || "ضيف مباشر");
    }
    if (track.kind === "audio") {
      const audioElement = track.attach();
      audioElement.autoplay = true;
      audioElement.style.display = "none";
      document.body.appendChild(audioElement);
      remoteAudioElementsRef.current.push(audioElement);
    }
  }, []);
  const connectToLiveKit = reactExports.useCallback(async (role) => {
    if (!activeRoom?.id) {
      pushToast({ type: "warning", title: "اختر غرفة بث أولاً" });
      return;
    }
    if (!activeRoom.livekit_configured) {
      pushToast({ type: "warning", title: "سيتم تجربة الاتصال الحقيقي", description: "سيتم طلب توكن البث مباشرة من الخادم للتأكد من إعداد LiveKit الفعلي." });
      if (role === "host") {
        await ensureCameraPreview();
      }
    }
    setBusy("connect-livekit");
    try {
      const { Room, RoomEvent } = livekitRef.current || await __vitePreload(() => import("./livekit-client.esm-DFWnix2L.js"), true ? [] : void 0);
      livekitRef.current = { Room, RoomEvent };
      const { data } = await getLiveToken(activeRoom.id, { role });
      await disconnectLiveSession({ keepPreview: role === "host" });
      const room = new Room({ adaptiveStream: true, dynacast: true });
      liveRoomRef.current = room;
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionLabel(state === "connected" ? "متصل" : state === "reconnecting" ? "جارٍ إعادة الاتصال" : "غير متصل");
      });
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        attachRemoteTrack(track, participant?.name || participant?.identity || "ضيف مباشر");
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        try {
          track.detach?.(remoteVideoRef.current);
        } catch {
        }
      });
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        setRemoteParticipantName(participant?.name || participant?.identity || "ضيف مباشر");
      });
      room.on(RoomEvent.Disconnected, () => {
        setConnectionLabel("غير متصل");
      });
      await room.connect(data.livekit_url, data.token);
      setJoinedRole(role);
      setConnectionLabel("متصل");
      if (role === "host") {
        await ensureCameraPreview();
        await room.localParticipant.setCameraEnabled(cameraEnabled);
        await room.localParticipant.setMicrophoneEnabled(microphoneEnabled);
        setMediaStatus(cameraEnabled ? "الكاميرا تعمل والبث متصل" : "البث متصل والكاميرا مغلقة");
      } else {
        setMediaStatus("تم الدخول للمشاهدة");
      }
      pushToast({ type: "success", title: role === "host" ? "تم تشغيل البث الحقيقي" : "تم الدخول إلى البث" });
    } catch (error) {
      await disconnectLiveSession({ keepPreview: true });
      pushToast({ type: "error", title: "تعذر الاتصال بالبث الحقيقي", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy("");
    }
  }, [activeRoom?.id, activeRoom?.livekit_configured, attachRemoteTrack, cameraEnabled, disconnectLiveSession, ensureCameraPreview, microphoneEnabled, pushToast]);
  reactExports.useEffect(() => {
    loadRooms();
  }, [loadRooms]);
  reactExports.useEffect(() => {
    if (!activeRoom?.id) return;
    loadRoomDetails(activeRoom.id);
  }, [activeRoom?.id, loadRoomDetails]);
  reactExports.useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);
  reactExports.useEffect(() => {
    if (!activeRoom?.id) return void 0;
    socketManager.connect();
    socketManager.emit("join_live", {
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
    socketManager.on("new_comment", handleComment);
    socketManager.on("room_stats", handleStats);
    socketManager.on("new_heart", handleHeart);
    return () => {
      socketManager.emit("leave_live", { room_id: activeRoom.id });
      socketManager.off("new_comment", handleComment);
      socketManager.off("room_stats", handleStats);
      socketManager.off("new_heart", handleHeart);
    };
  }, [activeRoom?.id, activeRoom?.host, currentUser]);
  reactExports.useEffect(() => () => {
    disconnectLiveSession();
  }, [disconnectLiveSession]);
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
    socketManager.emit("send_comment", { room_id: activeRoom.id, text: commentText.trim() });
    setCommentText("");
  };
  const sendHeart = () => {
    if (!activeRoom?.id) return;
    socketManager.emit("send_heart", { room_id: activeRoom.id });
    const id = `heart-${Date.now()}`;
    const next = { id, left: 14 + Math.random() * 72, duration: 1500 + Math.random() * 900 };
    setFloatingHearts((prev) => [...prev, next]);
    setTimeout(() => setFloatingHearts((prev) => prev.filter((item) => item.id !== id)), next.duration);
  };
  const giveGift = async (gift) => {
    if (!activeRoom?.id) return;
    try {
      await sendLiveGift({ room_id: activeRoom.id, gift_name: gift.name, coins: gift.price });
      pushToast({ type: "success", title: `تم إرسال ${gift.icon} ${gift.name}` });
      loadRoomDetails(activeRoom.id);
      setShowGiftTray(false);
    } catch (error) {
      pushToast({ type: "error", title: "تعذر إرسال الهدية", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleShare = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#/live`;
      await navigator.clipboard.writeText(url);
      pushToast({ type: "success", title: "تم نسخ رابط البث" });
    } catch {
      pushToast({ type: "warning", title: "تعذر النسخ", description: "انسخ الرابط يدويًا." });
    }
  };
  const handleCreateRoom = async () => {
    try {
      setBusy("create");
      const { data } = await createLiveRoom({ title: `بث مباشر مع ${currentUser}` });
      setActiveRoom(data);
      await loadRooms();
      pushToast({ type: "success", title: "تم إنشاء غرفة البث وربطها بقاعدة البيانات" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر إنشاء البث", description: error?.response?.data?.detail || error?.message });
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
      pushToast({ type: "success", title: action === "start" ? "تم بدء التسجيل" : "تم إيقاف التسجيل" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحديث التسجيل", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy("");
    }
  };
  const stopLive = async () => {
    if (!activeRoom?.id) return;
    try {
      setBusy("end");
      await disconnectLiveSession();
      await endLiveRoom(activeRoom.id);
      setActiveRoom(null);
      setComments([]);
      await loadRooms();
      pushToast({ type: "success", title: "تم إنهاء البث" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر إنهاء البث", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy("");
    }
  };
  const toggleCamera = async () => {
    const nextValue = !cameraEnabled;
    setCameraEnabled(nextValue);
    try {
      if (nextValue) {
        await ensureCameraPreview();
      } else if (!joinedRole) {
        stopPreviewStream();
      }
      if (joinedRole === "host" && liveRoomRef.current) {
        await liveRoomRef.current.localParticipant.setCameraEnabled(nextValue);
      }
      setMediaStatus(nextValue ? "الكاميرا تعمل" : "الكاميرا متوقفة");
    } catch (error) {
      setCameraEnabled(!nextValue);
      pushToast({ type: "error", title: "تعذر التحكم في الكاميرا", description: error?.message });
    }
  };
  const toggleMic = async () => {
    const nextValue = !microphoneEnabled;
    setMicrophoneEnabled(nextValue);
    try {
      if (joinedRole === "host" && liveRoomRef.current) {
        await liveRoomRef.current.localParticipant.setMicrophoneEnabled(nextValue);
      }
      setMediaStatus(nextValue ? "المايك مفتوح" : "المايك مغلق");
    } catch (error) {
      setMicrophoneEnabled(!nextValue);
      pushToast({ type: "error", title: "تعذر التحكم في المايك", description: error?.message });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-page desktop-post mobile-post", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-main", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-stage-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FloatingHearts, { items: floatingHearts }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-live-stage-gradient" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-stage-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-badges", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "live-badge live", children: "LIVE" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "live-badge", children: [
              "👁 ",
              viewerCount
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "live-badge", children: [
              "💜 ",
              heartsCount
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "live-badge", children: [
              "⚡ ",
              latencyMs,
              "ms"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-stage-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-live-action-btn", onClick: loadRooms, children: "تحديث" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-live-action-btn", onClick: handleShare, children: "مشاركة" }),
            isHost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-live-action-btn", onClick: toggleRecording, children: recordingStatus === "recording" ? "إيقاف التسجيل" : "بدء التسجيل" }) : null,
            isHost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-live-action-btn danger", onClick: stopLive, children: "إنهاء البث" }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-video-shell", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("video", { ref: remoteVideoRef, className: `yam-live-main-video ${joinedRole === "viewer" ? "visible" : ""}`, playsInline: true, autoPlay: true, controls: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("video", { ref: previewVideoRef, className: `yam-live-preview-video ${hasPreview ? "visible" : ""} ${joinedRole === "host" ? "host-mode" : ""}`, playsInline: true, muted: true, autoPlay: true }),
          joinedRole === "viewer" && remoteParticipantName ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-remote-tag", children: [
            "البث من ",
            remoteParticipantName
          ] }) : null,
          !joinedRole ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-video-placeholder", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-live-hero-icon", children: "🎥" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: activeRoom?.title || "بث مباشر مميز" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "المضيف: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: hostName })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-live-stage-tech", children: "Database-backed live rooms • LiveKit token endpoint • Camera preview • Real-time socket comments" })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-stage-footer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-host-box", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: hostName, size: 52, ring: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: hostName }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: activeRoom?.title || "بث مباشر" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-stage-tools", children: [
            isHost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chip-btn", onClick: toggleCamera, children: cameraEnabled ? "إغلاق الكاميرا" : "فتح الكاميرا" }) : null,
            isHost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chip-btn", onClick: toggleMic, children: microphoneEnabled ? "كتم المايك" : "فتح المايك" }) : null,
            isHost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chip-btn primary", onClick: () => connectToLiveKit("host"), disabled: busy === "connect-livekit", children: joinedRole === "host" ? "إعادة مزامنة البث" : "بدء البث الحقيقي" }) : null,
            !isHost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chip-btn primary", onClick: () => connectToLiveKit("viewer"), disabled: busy === "connect-livekit", children: "دخول المشاهدة" }) : null,
            joinedRole ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chip-btn", onClick: () => disconnectLiveSession({ keepPreview: false }), children: "فصل الاتصال" }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chip-btn", onClick: sendHeart, children: "إرسال قلب" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chip-btn", onClick: () => setShowGiftTray((prev) => !prev), children: "الهدايا" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-grid-aux", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-info-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "حالة الربط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: loadingRoom ? "جارٍ التحديث..." : "مباشر" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-grid", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "القاعدة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: activeRoom?.id ? "مرتبطة" : "غير مرتبطة" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المفاتيح" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: streamReady ? "مفعلة" : "تحتاج إعداد" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الاتصال" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: connectionLabel })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الأجهزة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: mediaStatus })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-info-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "جودة البث" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              healthScore,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-grid", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المشاهدون" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: viewerCount })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "البت ريت" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                bitrate,
                " kbps"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "التسجيل" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: recordingStatus })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stat-box", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "آخر نشاط" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: activeRoom?.last_activity_at ? formatTimeAgo(activeRoom.last_activity_at) : "الآن" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-info-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "هدف الدعم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              goalPercent,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-goal-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { width: `${goalPercent}%` } }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "yam-subtle-copy", children: [
            currentPot,
            " / ",
            goalTarget,
            " عملة"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-supporter-row", children: topGifters.length ? topGifters.map(([name, coins]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-supporter-pill", children: [
            name,
            " • ",
            coins
          ] }, name)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-supporter-pill", children: "لا يوجد داعمين بعد" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-live-sidebar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-side-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-card-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "غرف البث" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-mini-btn", onClick: handleCreateRoom, disabled: busy === "create", children: "+ إنشاء" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-room-list", children: loadingRooms ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-subtle-copy", children: "جارٍ تحميل الغرف..." }) : rooms.length ? rooms.map((room) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `yam-room-card ${activeRoom?.id === room.id ? "active" : ""}`, onClick: () => setActiveRoom(room), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: room.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "@",
              room.host || room.username
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            room.viewer_count || 0,
            " 👁"
          ] })
        ] }, room.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-subtle-copy", children: "مفيش غرف حالياً. أنشئ بث جديد." }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-side-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-card-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "المضيفون المشاركون" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: coHosts.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-cohost-list", children: (coHosts.length ? coHosts : [hostName]).map((name) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-cohost-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name, size: 40 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: name === hostName ? "المضيف الرئيسي" : "مضيف مشارك" })
          ] })
        ] }, name)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-side-card yam-live-chat-box", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-card-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "الشات المباشر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: comments.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-comment-stream", children: [
          comments.map((comment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-comment", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: comment.user || comment.username || "عضو" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: comment.text })
          ] }, comment.id)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: commentsEndRef })
        ] }),
        showGiftTray ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-gift-tray", children: GIFTS.map((gift) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-gift-card", onClick: () => giveGift(gift), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: gift.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: gift.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: gift.price })
        ] }, gift.id)) }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-comment-composer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: commentText, onChange: (event) => setCommentText(event.target.value), placeholder: "اكتب تعليقك" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: sendComment, children: "إرسال" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-live-page {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 340px;
            gap: 18px;
            padding: 18px;
            direction: rtl;
            color: #fff;
          }
          .yam-live-main {
            display: grid;
            gap: 18px;
          }
          .yam-live-stage-card,
          .yam-live-info-card,
          .yam-live-side-card {
            position: relative;
            border-radius: 28px;
            background: rgba(7, 12, 24, 0.92);
            border: 1px solid rgba(255,255,255,0.06);
            box-shadow: 0 28px 60px rgba(2,6,23,0.35);
            overflow: hidden;
          }
          .yam-live-stage-card {
            padding: 20px;
            min-height: 620px;
          }
          .yam-live-stage-gradient {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at top, rgba(139,92,246,0.18), transparent 48%), linear-gradient(180deg, rgba(59,130,246,0.08), transparent 30%);
            pointer-events: none;
          }
          .yam-live-stage-head,
          .yam-live-stage-footer,
          .yam-live-video-shell,
          .yam-live-grid-aux {
            position: relative;
            z-index: 1;
          }
          .yam-live-stage-head,
          .yam-live-stage-footer,
          .yam-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }
          .yam-live-badges,
          .yam-live-stage-actions,
          .yam-live-stage-tools,
          .yam-supporter-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .live-badge,
          .yam-chip-btn,
          .yam-mini-btn,
          .yam-supporter-pill,
          .yam-remote-tag {
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.66);
            color: #fff;
            font-weight: 800;
          }
          .live-badge {
            padding: 9px 12px;
            font-size: 12px;
          }
          .live-badge.live {
            background: rgba(239,68,68,0.18);
            color: #fecaca;
            border-color: rgba(239,68,68,0.3);
          }
          .yam-live-action-btn,
          .yam-chip-btn,
          .yam-mini-btn,
          .yam-comment-composer button,
          .yam-gift-card,
          .yam-room-card {
            transition: 0.18s ease;
          }
          .yam-live-action-btn,
          .yam-chip-btn,
          .yam-mini-btn,
          .yam-comment-composer button {
            border: none;
            cursor: pointer;
            padding: 11px 16px;
          }
          .yam-live-action-btn {
            border-radius: 16px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            font-weight: 800;
          }
          .yam-live-action-btn.danger {
            background: rgba(239,68,68,0.18);
            color: #fecaca;
          }
          .yam-live-video-shell {
            margin-top: 18px;
            min-height: 360px;
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(15,23,42,0.85), rgba(2,6,23,0.96));
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.06);
            display: grid;
            place-items: center;
          }
          .yam-live-main-video,
          .yam-live-preview-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
            background: #000;
          }
          .yam-live-main-video.visible {
            display: block;
          }
          .yam-live-preview-video.visible {
            display: block;
          }
          .yam-live-preview-video.host-mode {
            display: block;
          }
          .yam-live-preview-video.host-mode:not(.visible) {
            display: none;
          }
          .yam-remote-tag {
            position: absolute;
            top: 18px;
            right: 18px;
            padding: 8px 12px;
          }
          .yam-live-video-placeholder {
            text-align: center;
            padding: 32px;
          }
          .yam-live-hero-icon {
            width: 86px;
            height: 86px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            margin: 0 auto 18px;
            font-size: 38px;
            background: linear-gradient(135deg, rgba(139,92,246,0.28), rgba(59,130,246,0.12));
          }
          .yam-live-video-placeholder h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }
          .yam-live-video-placeholder p,
          .yam-live-stage-tech,
          .yam-subtle-copy,
          .yam-room-card p,
          .yam-cohost-row p,
          .yam-live-comment p {
            margin: 0;
            color: #94a3b8;
          }
          .yam-live-stage-tech {
            margin-top: 14px;
            font-size: 13px;
          }
          .yam-live-stage-footer {
            margin-top: 18px;
          }
          .yam-live-host-box {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .yam-live-host-box p,
          .yam-cohost-row p {
            margin-top: 4px;
            font-size: 13px;
          }
          .yam-chip-btn {
            padding: 10px 14px;
            cursor: pointer;
          }
          .yam-chip-btn.primary,
          .yam-mini-btn,
          .yam-comment-composer button {
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          }
          .yam-live-grid-aux {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }
          .yam-live-info-card,
          .yam-live-side-card {
            padding: 18px;
            display: grid;
            gap: 14px;
          }
          .yam-card-head span {
            color: #94a3b8;
            font-size: 13px;
          }
          .yam-info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .yam-stat-box {
            padding: 14px;
            border-radius: 18px;
            background: rgba(15,23,42,0.64);
            border: 1px solid rgba(255,255,255,0.05);
            display: grid;
            gap: 6px;
          }
          .yam-stat-box span {
            color: #94a3b8;
            font-size: 12px;
          }
          .yam-stat-box strong {
            color: #fff;
            font-size: 17px;
          }
          .yam-goal-bar {
            width: 100%;
            height: 12px;
            border-radius: 999px;
            background: rgba(148,163,184,0.14);
            overflow: hidden;
          }
          .yam-goal-bar span {
            display: block;
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #10b981);
          }
          .yam-live-sidebar {
            display: grid;
            gap: 18px;
            align-content: start;
          }
          .yam-room-list,
          .yam-cohost-list,
          .yam-comment-stream,
          .yam-gift-tray {
            display: grid;
            gap: 10px;
          }
          .yam-room-card {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.5);
            border-radius: 18px;
            padding: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            color: #fff;
            text-align: start;
            cursor: pointer;
          }
          .yam-room-card.active,
          .yam-room-card:hover {
            background: rgba(124,58,237,0.18);
            border-color: rgba(167,139,250,0.24);
          }
          .yam-cohost-row,
          .yam-live-comment {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.5);
            border: 1px solid rgba(255,255,255,0.05);
          }
          .yam-live-chat-box {
            min-height: 420px;
          }
          .yam-comment-stream {
            max-height: 280px;
            overflow-y: auto;
            padding-inline-end: 4px;
          }
          .yam-comment-composer {
            display: flex;
            gap: 10px;
          }
          .yam-comment-composer input {
            flex: 1;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(15,23,42,0.7);
            color: #fff;
            padding: 12px 14px;
          }
          .yam-gift-tray {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .yam-gift-card {
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 18px;
            padding: 14px;
            background: rgba(15,23,42,0.54);
            color: #fff;
            display: grid;
            gap: 6px;
            justify-items: start;
            cursor: pointer;
          }
          .yam-gift-card:hover,
          .yam-live-action-btn:hover,
          .yam-chip-btn:hover,
          .yam-mini-btn:hover,
          .yam-comment-composer button:hover {
            transform: translateY(-1px);
          }
          .yam-live-hearts-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
            z-index: 3;
          }
          .yam-live-heart {
            position: absolute;
            bottom: 18px;
            font-size: 30px;
            animation-name: yamHeartFly;
            animation-timing-function: ease-out;
            animation-fill-mode: forwards;
          }
          @keyframes yamHeartFly {
            0% { transform: translateY(0) scale(0.8); opacity: 0.2; }
            25% { opacity: 1; }
            100% { transform: translateY(-260px) translateX(16px) scale(1.16); opacity: 0; }
          }
          @media (max-width: 1200px) {
            .yam-live-page {
              grid-template-columns: 1fr;
            }
            .yam-live-grid-aux {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 720px) {
            .yam-live-page {
              padding: 12px;
            }
            .yam-live-stage-card {
              min-height: auto;
              padding: 14px;
            }
            .yam-live-video-shell {
              min-height: 240px;
            }
            .yam-info-grid {
              grid-template-columns: 1fr 1fr;
            }
            .yam-comment-composer {
              flex-direction: column;
            }
            .yam-gift-tray {
              grid-template-columns: 1fr 1fr;
            }
          }
        ` })
  ] }) });
}
export {
  Live as default
};
