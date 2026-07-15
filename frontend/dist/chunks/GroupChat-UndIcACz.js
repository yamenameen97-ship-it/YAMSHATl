import { b0 as reactExports, as as jsxRuntimeExports, bx as useNavigate, bw as useLocation, bz as useParams, bE as useToast, a7 as getCurrentUsername, v as bootstrapCallService, Q as ensureNotificationPermission, bl as socketManager, h as MainLayout, C as CallExperience, bk as showLocalNotification } from "../index-D_Nx8mZz.js";
import { B as listPinnedMessages, D as pinGroupMessage, p as getGroupDetails, r as getGroupMessages, i as deleteGroupMessage, F as reactToGroupMessage, l as forwardGroupMessage, P as uploadGroupMedia, I as sendGroupMessage } from "./groups-BgR9_Dnk.js";
import { a as MessageActionsToolbar, b as MessageReactionPicker, M as MediaPreviewModal } from "./MessageReactionPicker-QWD8GIAd.js";
import { V as VoiceMessagePlayer } from "./VoiceMessagePlayer-CtowHjVw.js";
/* empty css                         */
import { R as ReportModal } from "./ReportModal-CiNYlv7W.js";
const GroupPinnedBar = ({ groupId, canManage = false, onJump = () => {
} }) => {
  const [pinned, setPinned] = reactExports.useState([]);
  const [open, setOpen] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  const isMountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const fetchPinned = reactExports.useCallback(async () => {
    if (!groupId) return;
    try {
      if (isMountedRef.current) setLoading(true);
      const res = await listPinnedMessages(groupId);
      if (!isMountedRef.current) return;
      const list = Array.isArray(res?.data) ? res.data : res?.data?.items || [];
      setPinned(list);
    } catch {
      if (isMountedRef.current) setPinned([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [groupId]);
  reactExports.useEffect(() => {
    fetchPinned();
  }, [fetchPinned]);
  const handleUnpin = async (msgId, e) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      const ok = window.confirm("هل أنت متأكد من إلغاء تثبيت هذه الرسالة؟");
      if (!ok) return;
    }
    try {
      await pinGroupMessage(groupId, msgId, false);
      if (!isMountedRef.current) return;
      setPinned((prev) => prev.filter((p) => p.id !== msgId));
    } catch {
    }
  };
  if (loading || pinned.length === 0) return null;
  const first = pinned[0];
  const preview = String(first?.content || first?.text || first?.body || "").slice(0, 80);
  const handleBarKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    } else if (e.key === "Escape" && open) {
      setOpen(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      dir: "rtl",
      style: { fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif' },
      className: "yam-pinned-bar yamg-pinned-bar",
      onClick: () => setOpen((v) => !v),
      onKeyDown: handleBarKey,
      role: "button",
      tabIndex: 0,
      "aria-expanded": open,
      "aria-label": `رسائل مثبّتة (${pinned.length})`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ic", children: "📌" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "body", children: preview || "رسالة مثبّتة" }),
        pinned.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "count", children: pinned.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 12, color: "#fde68a" }, children: open ? "▲" : "▼" }),
        open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-pinned-list", dir: "rtl", onClick: (e) => e.stopPropagation(), children: pinned.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "yamg-pinned-item",
            onClick: () => {
              onJump(p.id);
              setOpen(false);
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pin-text", children: String(p.content || p.text || p.body || "").slice(0, 140) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pin-meta", children: [
                p.sender_name || p.author || "مستخدم",
                " ·",
                " ",
                p.timestamp ? new Date(p.timestamp).toLocaleString("ar-EG") : "",
                canManage && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: (e) => handleUnpin(p.id, e),
                    "aria-label": "إلغاء تثبيت الرسالة",
                    style: {
                      marginInlineStart: 8,
                      background: "transparent",
                      color: "#fca5a5",
                      border: 0,
                      cursor: "pointer",
                      fontSize: 11,
                      fontFamily: "inherit"
                    },
                    children: "إلغاء التثبيت"
                  }
                )
              ] })
            ]
          },
          p.id
        )) })
      ]
    }
  );
};
const GroupQuickLinks = ({ groupId, role = "member" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = role === "owner" || role === "admin";
  const links = [
    { to: `/groups/${groupId}/posts`, icon: "📝", label: "المنشورات" },
    { to: `/groups/${groupId}/events`, icon: "📅", label: "الأحداث" },
    { to: `/groups/${groupId}/polls`, icon: "📊", label: "الاستطلاعات" },
    { to: `/groups/${groupId}/mentions`, icon: "@", label: "الإشارات" },
    { to: `/groups/${groupId}/media`, icon: "🖼️", label: "الوسائط" },
    ...isAdmin ? [{ to: `/groups/${groupId}/audit`, icon: "📜", label: "سجل التدقيق" }] : [],
    { to: `/groups/${groupId}/notifications`, icon: "🔔", label: "الإشعارات" }
  ];
  const handleKey = (e, idx) => {
    const isRTL = (e.currentTarget.closest('[dir="rtl"]') || document.documentElement).getAttribute("dir") === "rtl";
    const next = isRTL ? "ArrowLeft" : "ArrowRight";
    const prev = isRTL ? "ArrowRight" : "ArrowLeft";
    let target = -1;
    if (e.key === next || e.key === "ArrowDown") target = (idx + 1) % links.length;
    else if (e.key === prev || e.key === "ArrowUp") target = (idx - 1 + links.length) % links.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = links.length - 1;
    if (target >= 0) {
      e.preventDefault();
      const root = e.currentTarget.parentElement;
      const btns = root?.querySelectorAll(".yamg-quicklink");
      if (btns && btns[target]) {
        try {
          btns[target].focus();
        } catch {
        }
      }
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yamg-quicklinks", dir: "rtl", role: "navigation", "aria-label": "اختصارات أقسام المجموعة", children: links.map((l, idx) => {
    const isActive = location?.pathname === l.to;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: `yamg-quicklink${isActive ? " is-active" : ""}`,
        onClick: () => navigate(l.to),
        onKeyDown: (e) => handleKey(e, idx),
        "aria-label": l.label,
        "aria-current": isActive ? "page" : void 0,
        "data-testid": `group-quicklink-${l.to.split("/").pop()}`,
        style: isActive ? {
          outline: "2px solid rgba(139, 92, 246, 0.6)",
          outlineOffset: 1,
          borderRadius: 10
        } : void 0,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: l.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: l.label })
        ]
      },
      l.to
    );
  }) });
};
const AUDIO_EXT_RE = /\.(aac|m4a|mp3|oga|ogg|opus|wav|webm)(?:$|\?)/i;
function normalizeGroupMediaType(type = "", attachment = {}, mediaUrl = "") {
  const raw = String(type || attachment?.kind || "").trim().toLowerCase();
  const mime = String(attachment?.mime_type || "").toLowerCase();
  const url = String(mediaUrl || attachment?.url || "").toLowerCase();
  if (["voice", "audio", "audio_message", "voice_message"].includes(raw)) return "voice";
  if (mime.startsWith("audio/") || AUDIO_EXT_RE.test(url)) return "voice";
  if (raw === "photo") return "image";
  if (raw === "attachment") return mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : "file";
  return raw || "text";
}
const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [message, setMessage] = reactExports.useState("");
  const [messages, setMessages] = reactExports.useState([]);
  const [groupInfo, setGroupInfo] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [uploading, setUploading] = reactExports.useState(false);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [showAttachMenu, setShowAttachMenu] = reactExports.useState(false);
  const [activeCall, setActiveCall] = reactExports.useState(null);
  const [notifPermission, setNotifPermission] = reactExports.useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const messagesEndRef = reactExports.useRef(null);
  const fileInputRef = reactExports.useRef(null);
  const imageInputRef = reactExports.useRef(null);
  const videoInputRef = reactExports.useRef(null);
  const [previewFiles, setPreviewFiles] = reactExports.useState([]);
  const [previewMediaType, setPreviewMediaType] = reactExports.useState("image");
  const [selectedMessage, setSelectedMessage] = reactExports.useState(null);
  const [reactionAnchor, setReactionAnchor] = reactExports.useState(null);
  const [reportTarget, setReportTarget] = reactExports.useState(null);
  const [forwardTarget, setForwardTarget] = reactExports.useState(null);
  const [forwardDraft, setForwardDraft] = reactExports.useState("");
  const [forwardBusy, setForwardBusy] = reactExports.useState(false);
  const documentVisibleRef = reactExports.useRef(
    typeof document !== "undefined" ? !document.hidden : true
  );
  const activeGroupIdRef = reactExports.useRef(groupId);
  reactExports.useEffect(() => {
    activeGroupIdRef.current = groupId;
  }, [groupId]);
  const groupNameRef = reactExports.useRef("المجموعة");
  reactExports.useEffect(() => {
    if (groupInfo?.name) groupNameRef.current = groupInfo.name;
  }, [groupInfo?.name]);
  const currentUser = getCurrentUsername();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  reactExports.useEffect(() => {
    setMessages([]);
    setGroupInfo(null);
    setLoading(true);
    setMessage("");
    setShowAttachMenu(false);
    setUploadProgress(0);
  }, [groupId]);
  reactExports.useEffect(() => {
    try {
      bootstrapCallService();
    } catch {
    }
    try {
      ensureNotificationPermission?.().then((perm) => {
        if (perm) setNotifPermission(perm);
      }).catch(() => {
      });
    } catch {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().then(setNotifPermission).catch(() => {
        });
      }
    }
    const onVisibility = () => {
      documentVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  reactExports.useEffect(() => {
    let cancelled = false;
    const fetchGroup = async () => {
      try {
        const res = await getGroupDetails(groupId);
        if (cancelled) return;
        const data = res.data || res;
        setGroupInfo(data);
      } catch (err) {
        console.warn("Could not load group info:", err?.message);
        if (!cancelled) {
          setGroupInfo({ name: "المجموعة", members_count: 0, icon: "👥" });
        }
      }
    };
    fetchGroup();
    return () => {
      cancelled = true;
    };
  }, [groupId]);
  reactExports.useEffect(() => {
    let cancelled = false;
    const room = `group:${groupId}`;
    const fetchChatData = async () => {
      try {
        setLoading(true);
        const response = await getGroupMessages(groupId, { limit: 50, offset: 0 });
        if (cancelled) return;
        const raw = Array.isArray(response.data) ? response.data : response.data?.items || [];
        const formattedMessages = raw.map((msg) => {
          const attachment = Array.isArray(msg.attachments) ? msg.attachments[0] || {} : {};
          const mediaUrl = msg.media_url || attachment?.url || null;
          return {
            id: msg.id,
            group_id: String(msg.group_id || groupId),
            sender: msg.sender_username || msg.sender,
            text: msg.content || msg.text || msg.message || "",
            mediaUrl,
            mediaType: normalizeGroupMediaType(msg.message_type, attachment, mediaUrl),
            time: new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            }),
            isMe: (msg.sender_username || msg.sender) === currentUser,
            avatar: msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_username || msg.sender}`
          };
        });
        formattedMessages.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error fetching group messages:", err);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }
      }
    };
    fetchChatData();
    socketManager.connect();
    try {
      socketManager.emit("join_group", { group_id: groupId, room });
    } catch {
    }
    const handleNewMessage = (payload) => {
      const currentGid = activeGroupIdRef.current;
      const payloadGid = String(payload.group_id || "") || (typeof payload.receiver === "string" && payload.receiver.startsWith("group:") ? payload.receiver.slice("group:".length) : "");
      if (String(payloadGid) !== String(currentGid)) return;
      const senderName = payload.sender_username || payload.sender;
      const isFromMe = senderName === currentUser;
      const attachment = Array.isArray(payload.attachments) ? payload.attachments[0] || {} : {};
      const mediaUrl = payload.media_url || attachment?.url || null;
      const newMsg = {
        id: payload.id || `srv_${Date.now()}`,
        group_id: String(currentGid),
        sender: senderName,
        text: payload.content || payload.text || payload.message || "",
        mediaUrl,
        mediaType: normalizeGroupMediaType(payload.message_type, attachment, mediaUrl),
        time: new Date(payload.created_at || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        isMe: isFromMe,
        avatar: payload.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`
      };
      setMessages((prev) => {
        if (prev.find((m) => String(m.id) === String(newMsg.id))) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();
      if (!isFromMe && !documentVisibleRef.current) {
        try {
          const groupName2 = groupNameRef.current || "المجموعة";
          showLocalNotification?.({
            title: `${groupName2} — ${senderName}`,
            body: newMsg.text || (newMsg.mediaUrl ? "📎 مرفق جديد" : "رسالة جديدة"),
            icon: "/favicon.ico",
            tag: `group-${currentGid}`,
            data: { groupId: currentGid, type: "group_message" }
          });
        } catch (e) {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(`${groupNameRef.current || "المجموعة"} — ${senderName}`, {
                body: newMsg.text || "📎 مرفق جديد",
                icon: "/favicon.ico",
                tag: `group-${currentGid}`
              });
            } catch {
            }
          }
        }
      }
    };
    socketManager.on("new_message", handleNewMessage);
    socketManager.on("group_message", handleNewMessage);
    return () => {
      cancelled = true;
      socketManager.off("new_message", handleNewMessage);
      socketManager.off("group_message", handleNewMessage);
      try {
        socketManager.emit("leave_group", { group_id: groupId, room });
      } catch {
      }
    };
  }, [groupId, currentUser]);
  reactExports.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const sendWithRetry = async (payload, maxAttempts = 3) => {
    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await sendGroupMessage(groupId, payload);
        return response;
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw err;
        }
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 800 * Math.pow(2, attempt - 1)));
        }
      }
    }
    throw lastErr;
  };
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const content = message.trim();
    setMessage("");
    const tempId = `tmp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      group_id: String(groupId),
      sender: currentUser,
      text: content,
      time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
      pending: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();
    try {
      const response = await sendWithRetry({
        content,
        message_type: "text"
      }, 3);
      const body = response.data || {};
      const serverMsg = body.message || body;
      setMessages(
        (prev) => prev.map(
          (m) => m.id === tempId ? {
            ...m,
            id: serverMsg.id || tempId,
            pending: false,
            failed: false
          } : m
        )
      );
    } catch (err) {
      console.error("Failed to send message after retries:", err);
      setMessages(
        (prev) => prev.map(
          (m) => m.id === tempId ? { ...m, pending: false, failed: true } : m
        )
      );
      setMessage((prevInput) => prevInput || content);
      const errMsg = err?.response?.data?.detail || "فشل إرسال الرسالة. تحقق من الاتصال.";
      pushToast?.({ type: "error", title: "فشل الإرسال", description: errMsg });
    }
  };
  const handleFileSelect = (e, mediaType = "file") => {
    const filesList = Array.from(e.target.files || []);
    if (!filesList.length) return;
    setShowAttachMenu(false);
    const MAX_SIZE = 50 * 1024 * 1024;
    const accepted = [];
    for (const f of filesList) {
      if (f.size > MAX_SIZE) {
        pushToast?.({
          type: "warning",
          title: "الملف كبير",
          description: `"${f.name}" يتجاوز ${Math.round(MAX_SIZE / 1024 / 1024)}MB`
        });
        continue;
      }
      accepted.push(f);
    }
    if (e.target) e.target.value = "";
    if (!accepted.length) return;
    setPreviewMediaType(mediaType);
    setPreviewFiles((prev) => [...prev, ...accepted]);
  };
  const handleConfirmPreviewSend = async (filesToSend, caption) => {
    const list = filesToSend && filesToSend.length ? filesToSend : previewFiles;
    setPreviewFiles([]);
    for (const f of list) {
      await uploadAndSendGroupFile(f, previewMediaType, caption);
    }
  };
  const uploadAndSendGroupFile = async (file, mediaType = "file", caption = "") => {
    if (!file) return;
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      pushToast?.({ type: "warning", title: "الملف كبير", description: `الحد الأقصى ${Math.round(MAX_SIZE / 1024 / 1024)}MB` });
      return;
    }
    const tempId = `tmp_${Date.now()}`;
    const previewUrl = mediaType === "image" && URL.createObjectURL ? URL.createObjectURL(file) : null;
    const optimisticMsg = {
      id: tempId,
      group_id: String(groupId),
      sender: currentUser,
      text: file.name,
      mediaUrl: previewUrl,
      mediaType,
      time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
      pending: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await uploadGroupMedia(formData, (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round(progressEvent.loaded * 100 / progressEvent.total);
          setUploadProgress(pct);
        }
      });
      const mediaUrl = uploadRes.data?.url || uploadRes.data?.media_url || uploadRes.data?.cdn_url;
      if (!mediaUrl) throw new Error("No URL returned from upload");
      const sendResp = await sendWithRetry({
        content: caption || "",
        message_type: mediaType,
        attachments: [
          {
            url: mediaUrl,
            kind: mediaType,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type
          }
        ]
      }, 3);
      const body = sendResp.data || {};
      const serverMsg = body.message || body;
      setMessages(
        (prev) => prev.map(
          (m) => m.id === tempId ? {
            ...m,
            id: serverMsg.id || tempId,
            mediaUrl,
            pending: false,
            failed: false
          } : m
        )
      );
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setMessages(
        (prev) => prev.map(
          (m) => m.id === tempId ? { ...m, pending: false, failed: true } : m
        )
      );
      const errMsg = err?.response?.data?.detail || "فشل رفع الملف. حاول مرة أخرى.";
      pushToast?.({ type: "error", title: "فشل الرفع", description: errMsg });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const openSettings = reactExports.useCallback(() => {
    navigate(`/groups/${groupId}/settings`);
  }, [groupId, navigate]);
  const handleStartCall = reactExports.useCallback(async (mode = "voice") => {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {
        }
      }
      setActiveCall({ mode, nonce: Date.now() });
    } catch (err) {
      console.error("Could not start call:", err);
      pushToast?.({
        type: "error",
        title: "تعذر بدء المكالمة",
        description: "تأكد من السماح بالوصول للميكروفون/الكاميرا."
      });
    }
  }, [pushToast]);
  const groupName = groupInfo?.name || groupInfo?.title || "دردشة المجموعة";
  const groupIcon = groupInfo?.icon || groupInfo?.image_url || null;
  const membersCount = groupInfo?.members_count || (Array.isArray(groupInfo?.members) ? groupInfo.members.length : 0) || 0;
  const closeMsgSelection = () => {
    setSelectedMessage(null);
    setReactionAnchor(null);
    try {
      document.body.classList.remove("yam-long-press-active");
    } catch {
    }
  };
  const onMsgReply = (m) => setMessage((p) => (p ? p + " " : "") + `رد، على «${(m?.text || "").slice(0, 40)}»: `);
  const onMsgCopy = (m) => {
    try {
      navigator.clipboard.writeText(m?.text || "");
      pushToast?.({ type: "success", title: "تم", description: "تم نسخ النص" });
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "تعذر النسخ" });
    }
  };
  const onMsgDelete = async (m) => {
    const prev = messages;
    setMessages((p) => p.filter((x) => x.id !== m.id));
    try {
      await deleteGroupMessage(groupId, m.id);
      pushToast?.({ type: "success", title: "تم", description: "تم حذف الرسالة" });
    } catch {
      setMessages(prev);
      pushToast?.({ type: "error", title: "خطأ", description: "فشل حذف الرسالة" });
    }
  };
  const onMsgStar = (m) => {
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, starred: !x.starred } : x));
    pushToast?.({ type: "info", title: "مفضلة", description: m.starred ? "تمت إزالة الرسالة من المفضلة" : "تمت إضافة الرسالة للمفضلة" });
  };
  const onMsgPin = async (m) => {
    try {
      await pinGroupMessage(groupId, m.id, !m.pinned);
      setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, pinned: !m.pinned } : x));
      pushToast?.({ type: "success", title: "تم", description: m.pinned ? "تم فك تثبيت الرسالة" : "تم تثبيت الرسالة" });
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل تثبيت الرسالة" });
    }
  };
  const onMsgInfo = (m) => {
    pushToast?.({
      type: "info",
      title: `معلومات الرسالة`,
      description: `المرسل: ${m?.sender || "—"} • الوقت: ${m?.time || "—"}`
    });
  };
  const onMsgForward = (m) => {
    setForwardDraft("");
    setForwardTarget({ messageId: m.id });
  };
  const submitForward = async () => {
    const target = (forwardDraft || "").trim();
    if (!target || !forwardTarget?.messageId) return;
    setForwardBusy(true);
    try {
      await forwardGroupMessage(groupId, forwardTarget.messageId, [target]);
      pushToast?.({ type: "success", title: "تم", description: "تم إعادة توجيه الرسالة" });
      setForwardTarget(null);
      setForwardDraft("");
    } catch {
      pushToast?.({ type: "error", title: "خطأ", description: "فشل إعادة التوجيه" });
    } finally {
      setForwardBusy(false);
    }
  };
  const onMsgReport = (m) => {
    setReportTarget({
      id: m?.id,
      label: `رسالة مجموعة من ${m?.sender || "عضو"}`
    });
  };
  const onMsgReact = async (m, emoji) => {
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, reaction: emoji } : x));
    try {
      await reactToGroupMessage(groupId, m.id, emoji);
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { hideNav: true, lockScroll: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-chat-container", dir: "rtl", "data-yam-group-root": "true", style: { fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif", position: "relative", isolation: "isolate" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        [data-yam-group-root="true"] {
          height: 100%;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        [data-yam-group-root="true"] .yam-group-header,
        [data-yam-group-root="true"] .yamg-quicklinks,
        [data-yam-group-root="true"] .yam-group-pinned-bar {
          flex-shrink: 0;
        }
        [data-yam-group-root="true"] .yam-group-messages {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 24px;
        }
        [data-yam-group-root="true"] .yam-group-input-area {
          flex-shrink: 0;
          position: sticky;
          bottom: 0;
          padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
        }
      ` }),
      selectedMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        MessageActionsToolbar,
        {
          selectedMessage,
          onClose: closeMsgSelection,
          onForward: onMsgForward,
          onDelete: onMsgDelete,
          onStar: onMsgStar,
          onReply: onMsgReply,
          onCopy: onMsgCopy,
          onPin: onMsgPin,
          onInfo: onMsgInfo,
          onReport: onMsgReport
        }
      ) : null,
      selectedMessage && reactionAnchor ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        MessageReactionPicker,
        {
          anchorRect: reactionAnchor,
          onPick: (emoji) => onMsgReact(selectedMessage, emoji),
          onClose: () => {
          }
        }
      ) : null,
      previewFiles.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        MediaPreviewModal,
        {
          files: previewFiles,
          onCancel: () => setPreviewFiles([]),
          onSend: (files, caption) => handleConfirmPreviewSend(files, caption),
          onRemove: (idx) => setPreviewFiles((p) => p.filter((_, i) => i !== idx)),
          onAddMore: () => {
            if (previewMediaType === "image") imageInputRef.current?.click();
            else if (previewMediaType === "video") videoInputRef.current?.click();
            else fileInputRef.current?.click();
          }
        }
      ) : null,
      activeCall ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        CallExperience,
        {
          open: Boolean(activeCall),
          mode: activeCall.mode,
          callType: "group",
          participantName: groupName,
          peerId: `group:${groupId}`,
          onClose: () => setActiveCall(null),
          onStatusChange: () => {
          }
        },
        `${groupId}-${activeCall.mode}-${activeCall.nonce}`
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-group-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "yam-back-arrow-btn",
            onClick: () => navigate("/groups"),
            "aria-label": "رجوع",
            style: {
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "22px",
              cursor: "pointer",
              padding: "4px 8px",
              marginInlineEnd: "4px"
            },
            children: "←"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "yam-group-info",
            onClick: openSettings,
            style: { cursor: "pointer", flex: 1 },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-group-icon-wrap", children: groupIcon && String(groupIcon).startsWith("http") ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: groupIcon,
                  alt: groupName,
                  style: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "24px" }, children: groupIcon || "👥" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-details", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { children: [
                  groupName,
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-verified-badge", children: "✔️" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-status", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-status-dot" }),
                  membersCount > 0 ? `${membersCount} عضو` : "متصل الآن"
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-header-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-action-btn",
              title: "مكالمة صوتية",
              "aria-label": "مكالمة صوتية",
              onClick: () => handleStartCall("voice"),
              children: "📞"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-action-btn",
              title: "مكالمة فيديو",
              "aria-label": "مكالمة فيديو",
              onClick: () => handleStartCall("video"),
              children: "🎥"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-action-btn",
              onClick: openSettings,
              title: "إعدادات المجموعة",
              "aria-label": "إعدادات المجموعة",
              children: "ℹ️"
            }
          )
        ] })
      ] }),
      notifPermission === "default" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          style: {
            background: "rgba(124, 58, 237, 0.12)",
            color: "#c4b5fd",
            padding: "8px 12px",
            fontSize: "13px",
            textAlign: "center",
            cursor: "pointer",
            borderBottom: "1px solid rgba(255,255,255,0.05)"
          },
          onClick: () => {
            if (typeof Notification !== "undefined") {
              Notification.requestPermission().then(setNotifPermission).catch(() => {
              });
            }
          },
          children: "🔔 فعّل إشعارات المجموعة لتصلك الرسائل وأنت بعيد عن التطبيق"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        GroupPinnedBar,
        {
          groupId,
          canManage: groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role === "owner" || groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role === "admin" || groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role === "moderator",
          onJump: (msgId) => {
            const el = document.querySelector(`[data-msg-id="${msgId}"]`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.style.outline = "2px solid #f59e0b";
              setTimeout(() => {
                el.style.outline = "";
              }, 1500);
            }
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        GroupQuickLinks,
        {
          groupId,
          role: groupInfo?.members?.find?.((m) => (m.username || m.user_id) === currentUser)?.role || "member"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "yam-group-messages", style: { paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px))", scrollPaddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px))" }, children: [
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", color: "#94a3b8" }, children: "جاري تحميل الرسائل..." }) : messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", color: "#94a3b8" }, children: "لا توجد رسائل بعد. ابدأ المحادثة!" }) : messages.filter((m) => !m.group_id || String(m.group_id) === String(groupId)).map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `yam-message-group ${msg.isMe ? "me" : ""} ${msg.pending ? "pending" : ""} ${msg.failed ? "failed" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-user-avatar-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: msg.avatar, alt: msg.sender, className: "yam-user-avatar" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-message-content-wrap", children: [
                !msg.isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-sender-name", children: msg.sender }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-message-bubble ${msg.mediaType === "voice" ? "voice-bubble" : ""}`, children: msg.mediaUrl ? msg.mediaType === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: msg.mediaUrl,
                    alt: "media",
                    style: { maxWidth: "240px", borderRadius: "8px", display: "block" }
                  }
                ) : msg.mediaType === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "video",
                  {
                    src: msg.mediaUrl,
                    controls: true,
                    style: { maxWidth: "240px", borderRadius: "8px", display: "block" }
                  }
                ) : msg.mediaType === "voice" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  VoiceMessagePlayer,
                  {
                    src: msg.mediaUrl,
                    seed: `${msg.id}-${msg.time}`,
                    title: "رسالة صوتية",
                    bubbleless: true,
                    isMe: msg.isMe
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "a",
                  {
                    href: msg.mediaUrl,
                    target: "_blank",
                    rel: "noreferrer",
                    style: { color: "#a78bfa" },
                    children: [
                      "📎 ",
                      msg.text || "ملف مرفق"
                    ]
                  }
                ) : msg.text }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-message-time", children: [
                  msg.time,
                  msg.isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-read-receipt", style: msg.failed ? { color: "#ef4444" } : {}, children: msg.failed ? "⚠️" : msg.pending ? "🕓" : "✓✓" })
                ] })
              ] })
            ]
          },
          msg.id
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
      ] }),
      uploading && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "yam-upload-progress",
          style: {
            position: "absolute",
            bottom: "calc(82px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px))",
            insetInlineStart: "12px",
            insetInlineEnd: "12px",
            background: "#1e293b",
            borderRadius: "10px",
            padding: "8px 12px",
            color: "#fff",
            fontSize: "13px",
            zIndex: 60,
            boxShadow: "0 6px 18px rgba(0,0,0,0.4)"
          },
          children: [
            "⏫ جاري الرفع... ",
            uploadProgress,
            "%",
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              marginTop: "6px",
              height: "4px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "4px",
              overflow: "hidden"
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: `${uploadProgress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
              transition: "width 0.3s ease"
            } }) })
          ]
        }
      ),
      showAttachMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "yam-attach-menu",
          style: {
            position: "absolute",
            bottom: "calc(86px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px))",
            insetInlineStart: "12px",
            background: "#1e293b",
            borderRadius: "12px",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 50,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "yam-attach-option",
                onClick: () => imageInputRef.current?.click(),
                style: {
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  padding: "10px",
                  cursor: "pointer",
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                },
                children: "🖼️ صورة"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "yam-attach-option",
                onClick: () => videoInputRef.current?.click(),
                style: {
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  padding: "10px",
                  cursor: "pointer",
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                },
                children: "🎬 فيديو"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "yam-attach-option",
                onClick: () => fileInputRef.current?.click(),
                style: {
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  padding: "10px",
                  cursor: "pointer",
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                },
                children: "📄 ملف"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "yam-attach-option",
                onClick: () => setShowAttachMenu(false),
                style: {
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  padding: "8px",
                  cursor: "pointer",
                  textAlign: "center"
                },
                children: "إلغاء"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: imageInputRef,
          type: "file",
          accept: "image/*",
          style: { display: "none" },
          multiple: true,
          onChange: (e) => handleFileSelect(e, "image")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: videoInputRef,
          type: "file",
          accept: "video/*",
          style: { display: "none" },
          multiple: true,
          onChange: (e) => handleFileSelect(e, "video")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          style: { display: "none" },
          multiple: true,
          onChange: (e) => handleFileSelect(e, "file")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "yam-group-input-area", style: { position: "sticky", bottom: 0, insetInline: 0, display: "grid", gridTemplateColumns: "42px minmax(0, 1fr) 42px", alignItems: "center", gap: "10px", padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px))", background: "linear-gradient(180deg, rgba(9, 13, 24, 0.92), rgba(9, 13, 24, 0.98))", borderTop: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 -16px 34px rgba(0,0,0,0.34)", zIndex: 120 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "yam-group-plus-btn",
            onClick: () => setShowAttachMenu((prev) => !prev),
            title: "إرفاق ملف",
            "aria-label": "إرفاق ملف",
            disabled: uploading,
            style: {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              width: "42px",
              minWidth: "42px",
              height: "42px",
              borderRadius: "14px",
              alignSelf: "center",
              boxSizing: "border-box"
            },
            children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "14px" }, children: "⏳" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" })
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-input-wrapper", style: { minWidth: 0, width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", gap: "8px", direction: "rtl", borderRadius: "24px", padding: "0 12px", minHeight: "46px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", overflow: "hidden", order: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              className: "yam-group-chat-input",
              placeholder: "اكتب رسالة...",
              value: message,
              onChange: (e) => setMessage(e.target.value),
              onKeyDown: handleKeyPress,
              dir: "rtl",
              enterKeyHint: "send",
              inputMode: "text",
              autoComplete: "off",
              onFocus: () => window.setTimeout(scrollToBottom, 140),
              style: { minWidth: 0, width: "100%", height: "100%", background: "transparent", border: 0, outline: 0, padding: "11px 0", fontSize: "16px", lineHeight: 1.5, color: "#fff", direction: "rtl", textAlign: "right" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-group-input-icon", style: { width: "28px", height: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#94a3b8", fontSize: "18px" }, children: "😊" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "yam-group-send-btn",
            onClick: handleSendMessage,
            "aria-label": "إرسال",
            onMouseDown: (e) => e.preventDefault(),
            type: "button",
            style: { width: "42px", minWidth: "42px", height: "42px", borderRadius: "14px", alignSelf: "center", order: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" }) })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ReportModal,
      {
        open: !!reportTarget,
        onClose: () => setReportTarget(null),
        targetType: "group_message",
        targetId: reportTarget?.id,
        targetLabel: reportTarget?.label
      }
    ),
    forwardTarget ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "yam-fwd-title",
        dir: "rtl",
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif"
        },
        onClick: (e) => {
          if (e.target === e.currentTarget && !forwardBusy) {
            setForwardTarget(null);
            setForwardDraft("");
          }
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          background: "var(--bg-elevated, #1f2233)",
          color: "var(--text, #fff)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 460,
          padding: 18,
          boxShadow: "0 18px 48px rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.08)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id: "yam-fwd-title", style: { margin: "0 0 4px", fontSize: 17, fontWeight: 700 }, children: "↪️ إعادة توجيه الرسالة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "0 0 12px", fontSize: 13, opacity: 0.7 }, children: "أدخل اسم المستخدم (@username) أو معرّف المجموعة:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              dir: "auto",
              placeholder: "مثال: @ahmad أو group:42",
              value: forwardDraft,
              onChange: (e) => setForwardDraft(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" && !forwardBusy && forwardDraft.trim()) submitForward();
                if (e.key === "Escape") {
                  setForwardTarget(null);
                  setForwardDraft("");
                }
              },
              style: {
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.12)",
                fontFamily: "inherit",
                fontSize: 15
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                disabled: forwardBusy,
                onClick: () => {
                  setForwardTarget(null);
                  setForwardDraft("");
                },
                style: {
                  padding: "9px 16px",
                  borderRadius: 10,
                  cursor: forwardBusy ? "not-allowed" : "pointer",
                  background: "transparent",
                  color: "inherit",
                  border: "1px solid rgba(255,255,255,0.16)",
                  fontWeight: 600,
                  opacity: forwardBusy ? 0.5 : 1
                },
                children: "إلغاء"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                disabled: forwardBusy || !forwardDraft.trim(),
                onClick: submitForward,
                style: {
                  padding: "9px 18px",
                  borderRadius: 10,
                  cursor: forwardBusy || !forwardDraft.trim() ? "not-allowed" : "pointer",
                  background: "var(--primary, #6f53ff)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  opacity: forwardBusy || !forwardDraft.trim() ? 0.5 : 1
                },
                children: forwardBusy ? "جارٍ…" : "إعادة توجيه"
              }
            )
          ] })
        ] })
      }
    ) : null
  ] });
};
export {
  GroupChat as default
};
