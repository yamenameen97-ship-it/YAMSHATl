import { bb as useParams, b9 as useNavigate, aP as reactExports, a1 as getCurrentUsername, a$ as socketManager, am as jsxRuntimeExports, a9 as getMessages, b2 as uploadMedia, aZ as sendMessageApi } from "../index-T8PSkq5D.js";
import { a as getGroupDetails } from "./groups-3iIR0itr.js";
const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = reactExports.useState("");
  const [messages, setMessages] = reactExports.useState([]);
  const [groupInfo, setGroupInfo] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [uploading, setUploading] = reactExports.useState(false);
  const [showAttachMenu, setShowAttachMenu] = reactExports.useState(false);
  const messagesEndRef = reactExports.useRef(null);
  const fileInputRef = reactExports.useRef(null);
  const imageInputRef = reactExports.useRef(null);
  const currentUser = getCurrentUsername();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  reactExports.useEffect(() => {
    let cancelled = false;
    const fetchGroup = async () => {
      try {
        const res = await getGroupDetails(groupId);
        if (!cancelled) {
          setGroupInfo(res.data || res);
        }
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
    const fetchChatData = async () => {
      try {
        setLoading(true);
        const response = await getMessages(`group:${groupId}`);
        const history = Array.isArray(response.data) ? response.data : response.data?.items || [];
        const formattedMessages = history.map((msg) => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.content || msg.text || msg.message,
          mediaUrl: msg.media_url || null,
          mediaType: msg.message_type || "text",
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isMe: msg.sender === currentUser,
          avatar: msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`
        }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error fetching group messages:", err);
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    };
    fetchChatData();
    socketManager.connect();
    try {
      socketManager.emit("join_group", { group_id: groupId, room: `group:${groupId}` });
    } catch (e) {
    }
    const handleNewMessage = (payload) => {
      if (payload.receiver === `group:${groupId}`) {
        const newMsg = {
          id: payload.id || Date.now(),
          sender: payload.sender,
          text: payload.content || payload.text || payload.message,
          mediaUrl: payload.media_url || null,
          mediaType: payload.message_type || "text",
          time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isMe: payload.sender === currentUser,
          avatar: payload.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.sender}`
        };
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      }
    };
    socketManager.on("new_message", handleNewMessage);
    return () => {
      socketManager.off("new_message", handleNewMessage);
      try {
        socketManager.emit("leave_group", { group_id: groupId, room: `group:${groupId}` });
      } catch (e) {
      }
    };
  }, [groupId, currentUser]);
  reactExports.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const content = message.trim();
    setMessage("");
    const tempId = `tmp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
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
      const payload = {
        receiver: `group:${groupId}`,
        content,
        message: content,
        type: "text"
      };
      const response = await sendMessageApi(payload);
      const serverMsg = response.data || {};
      setMessages((prev) => prev.map(
        (m) => m.id === tempId ? {
          ...m,
          id: serverMsg.id || tempId,
          pending: false
        } : m
      ));
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(content);
      alert("فشل إرسال الرسالة. حاول مرة أخرى.");
    }
  };
  const handleFileUpload = async (e, mediaType = "file") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await uploadMedia(formData);
      const mediaUrl = uploadRes.data?.url || uploadRes.data?.media_url;
      if (!mediaUrl) throw new Error("No URL returned from upload");
      const payload = {
        receiver: `group:${groupId}`,
        content: "",
        media_url: mediaUrl,
        type: mediaType
      };
      await sendMessageApi(payload);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("فشل رفع الملف. حاول مرة أخرى.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
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
  const groupName = groupInfo?.name || groupInfo?.title || "دردشة المجموعة";
  const groupIcon = groupInfo?.icon || groupInfo?.image_url || null;
  const membersCount = groupInfo?.members_count || groupInfo?.members?.length || 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-chat-container", children: [
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
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-group-info", onClick: openSettings, style: { cursor: "pointer", flex: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-group-icon-wrap", children: groupIcon && groupIcon.startsWith("http") ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: groupIcon, alt: groupName, style: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "24px" }, children: groupIcon || "👥" }) }),
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
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-header-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-action-btn", title: "مكالمة صوتية", "aria-label": "مكالمة صوتية", children: "📞" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-action-btn", title: "مكالمة فيديو", "aria-label": "مكالمة فيديو", children: "🎥" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-action-btn", onClick: openSettings, title: "إعدادات المجموعة", "aria-label": "إعدادات المجموعة", children: "ℹ️" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "yam-group-messages", children: [
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", color: "#94a3b8" }, children: "جاري تحميل الرسائل..." }) : messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "20px", color: "#94a3b8" }, children: "لا توجد رسائل بعد. ابدأ المحادثة!" }) : messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-message-group ${msg.isMe ? "me" : ""} ${msg.pending ? "pending" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-user-avatar-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: msg.avatar, alt: msg.sender, className: "yam-user-avatar" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-message-content-wrap", children: [
          !msg.isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-sender-name", children: msg.sender }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-message-bubble", children: msg.mediaUrl ? msg.mediaType === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: msg.mediaUrl, alt: "media", style: { maxWidth: "240px", borderRadius: "8px", display: "block" } }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: msg.mediaUrl, target: "_blank", rel: "noreferrer", style: { color: "#a78bfa" }, children: [
            "📎 ",
            msg.text || "ملف مرفق"
          ] }) : msg.text }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-message-time", children: [
            msg.time,
            msg.isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-read-receipt", children: msg.pending ? "🕓" : "✓✓" })
          ] })
        ] })
      ] }, msg.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
    ] }),
    showAttachMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "yam-attach-menu",
        style: {
          position: "absolute",
          bottom: "80px",
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
              style: { background: "transparent", border: "none", color: "#fff", padding: "10px", cursor: "pointer", textAlign: "right", display: "flex", alignItems: "center", gap: "8px" },
              children: "🖼️ صورة"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "yam-attach-option",
              onClick: () => fileInputRef.current?.click(),
              style: { background: "transparent", border: "none", color: "#fff", padding: "10px", cursor: "pointer", textAlign: "right", display: "flex", alignItems: "center", gap: "8px" },
              children: "📄 ملف"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "yam-attach-option",
              onClick: () => setShowAttachMenu(false),
              style: { background: "transparent", border: "none", color: "#94a3b8", padding: "8px", cursor: "pointer", textAlign: "center" },
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
        onChange: (e) => handleFileUpload(e, "image")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        style: { display: "none" },
        onChange: (e) => handleFileUpload(e, "file")
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "yam-group-input-area", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "yam-plus-btn",
          onClick: () => setShowAttachMenu((prev) => !prev),
          title: "إرفاق ملف",
          "aria-label": "إرفاق ملف",
          disabled: uploading,
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px"
          },
          children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "14px" }, children: "⏳" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-input-wrapper", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: "yam-chat-input",
            placeholder: "اكتب رسالة...",
            value: message,
            onChange: (e) => setMessage(e.target.value),
            onKeyDown: handleKeyPress
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-input-icon", children: "😊" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "yam-send-btn", onClick: handleSendMessage, "aria-label": "إرسال", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" }) }) })
    ] })
  ] });
};
export {
  GroupChat as default
};
