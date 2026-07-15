import { E as reactExports, I as jsxRuntimeExports, a6 as useSearchParams, F as useNavigate, $ as useAppStore, a0 as MainLayout } from "../index-DRmq1dbV.js";
import { v as voiceRoomsApi } from "./engagementApi-CFhn71Pq.js";
const CATEGORIES = [
  { key: null, label: "🔥 الكل" },
  { key: "general", label: "💬 عام" },
  { key: "music", label: "🎵 موسيقى" },
  { key: "games", label: "🎮 ألعاب" },
  { key: "education", label: "📚 تعليم" },
  { key: "comedy", label: "😂 تسلية" },
  { key: "religion", label: "🕌 ديني" }
];
function VoiceRoomsList({ onOpen, onCreate }) {
  const [category, setCategory] = reactExports.useState(null);
  const [rooms, setRooms] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const d = await voiceRoomsApi.list(category);
      setRooms(d.rooms || []);
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, [category]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    padding: 16,
    maxWidth: 1100,
    margin: "0 auto"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0, fontWeight: 800 }, children: "🔊 الغرف الصوتية" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onCreate, style: {
        background: "linear-gradient(135deg,#F59E0B,#EF4444)",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: 12,
        fontWeight: 700,
        cursor: "pointer"
      }, children: "➕ إنشاء غرفة" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" }, children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCategory(c.key), style: {
      padding: "6px 14px",
      borderRadius: 18,
      whiteSpace: "nowrap",
      background: category === c.key ? "#F59E0B" : "#1F2937",
      color: category === c.key ? "#111" : "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: 600
    }, children: c.label }, c.key || "all")) }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 20 }, children: "جاري التحميل..." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      gap: 12,
      marginTop: 12
    }, children: [
      rooms.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => onOpen?.(r.id), style: {
        background: r.cover_image ? `linear-gradient(180deg, rgba(15,23,42,0.45), rgba(15,23,42,0.95)), url(${r.cover_image}) center/cover` : "linear-gradient(135deg,#1F2937,#0F172A)",
        borderRadius: 16,
        padding: 14,
        cursor: "pointer",
        border: "1px solid #374151",
        color: "#fff",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
              background: "rgba(239,68,68,0.85)",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700
            }, children: "● مباشر" }),
            r.is_private && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 14 }, children: "🔒" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginTop: 8, fontSize: 16 }, children: r.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#9CA3AF", fontSize: 12, marginTop: 4 }, children: r.description?.slice(0, 60) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#D1D5DB",
          marginTop: 8
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "👥 ",
            r.current_listeners
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "💺 ",
            r.seats_count,
            " مقاعد"
          ] })
        ] })
      ] }, r.id)),
      !loading && rooms.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        color: "#9CA3AF",
        gridColumn: "1/-1",
        textAlign: "center",
        padding: 40
      }, children: "لا توجد غرف نشطة الآن. كن أول من يبدأ غرفة!" })
    ] })
  ] });
}
function VoiceRoomView({ roomId, onLeave, currentUserId }) {
  const [room, setRoom] = reactExports.useState(null);
  const [messages, setMessages] = reactExports.useState([]);
  const [text, setText] = reactExports.useState("");
  const chatEndRef = reactExports.useRef(null);
  const pollRef = reactExports.useRef(null);
  const refresh = async () => {
    try {
      const r = await voiceRoomsApi.get(roomId);
      setRoom(r);
      const m = await voiceRoomsApi.getMessages(roomId, 50);
      setMessages(m.messages || []);
    } catch (e) {
    }
  };
  reactExports.useEffect(() => {
    voiceRoomsApi.join(roomId).then(refresh).catch(refresh);
    pollRef.current = setInterval(refresh, 5e3);
    return () => {
      clearInterval(pollRef.current);
      voiceRoomsApi.leave(roomId).catch(() => {
      });
    };
  }, [roomId]);
  reactExports.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);
  const takeSeat = async (idx) => {
    try {
      await voiceRoomsApi.takeSeat(roomId, idx);
      refresh();
    } catch (e) {
    }
  };
  const leaveSeat = async () => {
    try {
      await voiceRoomsApi.leaveSeat(roomId);
      refresh();
    } catch (e) {
    }
  };
  const send = async () => {
    if (!text.trim()) return;
    try {
      await voiceRoomsApi.sendMessage(roomId, text.trim());
      setText("");
      refresh();
    } catch (e) {
    }
  };
  const onLeaveRoom = async () => {
    try {
      await voiceRoomsApi.leave(roomId);
    } catch {
    }
    onLeave?.();
  };
  if (!room) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { dir: "rtl", style: { padding: 20 }, children: "جاري التحميل..." });
  const mySeatIndex = (room.seats || []).findIndex((s) => s && s.user_id === currentUserId);
  room.owner_id === currentUserId;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(180deg,#0F172A,#1F2937)",
    color: "#fff",
    display: "flex",
    flexDirection: "column"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      padding: 14,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onLeaveRoom, style: {
        background: "#EF4444",
        color: "#fff",
        border: "none",
        padding: "8px 14px",
        borderRadius: 10,
        fontWeight: 700,
        cursor: "pointer"
      }, children: "✕ مغادرة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 800, fontSize: 17 }, children: room.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#9CA3AF" }, children: [
          "👥 ",
          room.current_listeners,
          " مستمع · 💎 ",
          room.total_gifts_value
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 80 } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 18 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        justifyItems: "center"
      }, children: (room.seats || []).map((s, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        SeatBubble,
        {
          seat: s,
          index: idx,
          onTake: () => takeSeat(idx)
        },
        idx
      )) }),
      mySeatIndex >= 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", marginTop: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: leaveSeat, style: {
        background: "#374151",
        color: "#fff",
        border: "none",
        padding: "6px 16px",
        borderRadius: 10,
        fontWeight: 600,
        cursor: "pointer"
      }, children: "أنزل من المقعد" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      flex: 1,
      overflowY: "auto",
      padding: "0 16px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 6
    }, children: [
      messages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        background: "rgba(31,41,55,0.6)",
        padding: "6px 10px",
        borderRadius: 10,
        maxWidth: "80%"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: m.avatar ? `url(${m.avatar}) center/cover` : "#374151"
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "#FBBF24", fontWeight: 700 }, children: m.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 14 }, children: m.content })
        ] })
      ] }, m.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: chatEndRef })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      display: "flex",
      gap: 8,
      padding: 12,
      background: "rgba(0,0,0,0.35)"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: text,
          onChange: (e) => setText(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && send(),
          placeholder: "اكتب رسالة...",
          style: {
            flex: 1,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #374151",
            background: "#111827",
            color: "#fff",
            fontFamily: "inherit"
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: send, style: {
        background: "#10B981",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: 12,
        fontWeight: 700,
        cursor: "pointer"
      }, children: "إرسال" })
    ] })
  ] });
}
function SeatBubble({ seat, index, onTake }) {
  if (!seat) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onTake, style: {
      width: 72,
      height: 72,
      borderRadius: "50%",
      border: "2px dashed #6B7280",
      background: "rgba(255,255,255,0.05)",
      color: "#9CA3AF",
      cursor: "pointer",
      fontSize: 22
    }, children: "+" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      width: 72,
      height: 72,
      borderRadius: "50%",
      background: seat.avatar ? `url(${seat.avatar}) center/cover` : "#374151",
      border: seat.role === "owner" ? "3px solid #FBBF24" : seat.role === "speaker" ? "3px solid #10B981" : "3px solid #6B7280",
      position: "relative"
    }, children: seat.is_muted && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      position: "absolute",
      bottom: -4,
      left: -4,
      background: "#EF4444",
      width: 22,
      height: 22,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12
    }, children: "🔇" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, marginTop: 4, fontWeight: 600 }, children: seat.username }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 10, color: "#9CA3AF" }, children: seat.role === "owner" ? "👑 المالك" : seat.role === "admin" ? "🛡️ مشرف" : "🎤 متحدث" })
  ] });
}
function VoiceRoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const wantsCreate = searchParams.get("create") === "1";
  const [mode, setMode] = reactExports.useState(wantsCreate ? "create" : "list");
  const [activeRoomId, setActiveRoomId] = reactExports.useState(null);
  const currentUserId = useAppStore((s) => s?.session?.id ?? s?.session?.user?.id ?? null);
  reactExports.useEffect(() => {
    if (wantsCreate) {
      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  }, []);
  if (mode === "room" && activeRoomId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      VoiceRoomView,
      {
        roomId: activeRoomId,
        currentUserId,
        onLeave: () => {
          setMode("list");
          setActiveRoomId(null);
        }
      }
    ) });
  }
  if (mode === "create") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      CreateRoomInline,
      {
        onCancel: () => {
          if (wantsCreate) {
            navigate("/groups");
            return;
          }
          setMode("list");
        },
        onCreated: (id) => {
          setActiveRoomId(id);
          setMode("room");
        }
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    VoiceRoomsList,
    {
      onOpen: (id) => {
        setActiveRoomId(id);
        setMode("room");
      },
      onCreate: () => setMode("create")
    }
  ) });
}
function CreateRoomInline({ onCancel, onCreated }) {
  const [form, setForm] = reactExports.useState({
    title: "",
    description: "",
    category: "general",
    seats_count: 8,
    is_private: false,
    password: ""
  });
  const [err, setErr] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const submit = async () => {
    if (!form.title.trim()) {
      setErr("أدخل عنواناً للغرفة");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await voiceRoomsApi.create(form);
      onCreated(r.id);
    } catch (e) {
      setErr(e?.response?.data?.detail || "تعذر إنشاء الغرفة");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: {
    fontFamily: "'Noto Sans Arabic', sans-serif",
    padding: 16,
    maxWidth: 520,
    margin: "0 auto",
    color: "#fff"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontWeight: 800 }, children: "➕ إنشاء غرفة صوتية" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12, marginTop: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "عنوان الغرفة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: form.title,
          onChange: (e) => setForm({ ...form, title: e.target.value }),
          maxLength: 100,
          style: inputStyle
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "وصف مختصر (اختياري)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          value: form.description,
          onChange: (e) => setForm({ ...form, description: e.target.value }),
          rows: 3,
          maxLength: 300,
          style: inputStyle
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "التصنيف", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: form.category,
          onChange: (e) => setForm({ ...form, category: e.target.value }),
          style: inputStyle,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "general", children: "عام" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "music", children: "موسيقى" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "games", children: "ألعاب" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "education", children: "تعليم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "comedy", children: "تسلية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "religion", children: "ديني" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `عدد المقاعد: ${form.seats_count}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "range",
          min: 2,
          max: 15,
          value: form.seats_count,
          onChange: (e) => setForm({ ...form, seats_count: +e.target.value }),
          style: { width: "100%" }
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: form.is_private,
            onChange: (e) => setForm({ ...form, is_private: e.target.checked })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "غرفة خاصة (محمية بكلمة مرور)" })
      ] }),
      form.is_private && /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "كلمة المرور", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: form.password,
          onChange: (e) => setForm({ ...form, password: e.target.value }),
          style: inputStyle
        }
      ) }),
      err && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#EF4444" }, children: err }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onCancel, style: btnStyle("#374151"), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: submit,
            disabled: busy,
            style: { ...btnStyle("#10B981"), flex: 1 },
            children: busy ? "جاري الإنشاء..." : "🚀 إنشاء وبدء الغرفة"
          }
        )
      ] })
    ] })
  ] });
}
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#111827",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: 14
};
const btnStyle = (bg) => ({
  background: bg,
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit"
});
function Field({ label, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 4, fontSize: 13, color: "#9CA3AF" }, children: label }),
    children
  ] });
}
export {
  VoiceRoomsPage as default
};
